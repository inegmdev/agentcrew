const fs = require('fs');
const path = require('path');
const { readTasks, diffTasks, TASKS_DIR } = require('./tasks');
const { appendToJournal, describeTransition } = require('./journal');
const { consolidate } = require('./consolidate');

// fs.watch fires several times for one logical save, so changes are coalesced
// before the directory is re-read.
const DEBOUNCE_MS = 250;

// fs.watch is not reliable everywhere (network mounts, some container
// filesystems, editors that replace files rather than writing in place), so a
// slower full sweep runs alongside it as a correctness backstop. The watcher
// provides latency; the sweep provides the guarantee.
const SWEEP_MS = 30000;

const NEEDS_ATTENTION = 'needs attention';
const DONE = 'done';

/**
 * Watches one project's board and reacts to work moving across it.
 *
 * Holds no state of its own beyond an in-memory snapshot: every durable thing
 * it produces is a file in the repo. Stopping the daemon loses automation,
 * never data — which is the whole reason it is allowed to exist.
 */
function startDaemon(projectPath, options = {}) {
  const resolved = path.resolve(projectPath);
  const tasksDir = path.join(resolved, TASKS_DIR);

  if (!fs.existsSync(tasksDir)) {
    throw new Error(`No board found at ${tasksDir}\nRun \`agentcrew setup ${resolved}\` first.`);
  }

  const log = options.log || console.log;

  // Baseline is taken from disk at startup rather than persisted, so a restart
  // never replays old transitions as if they just happened. Transitions that
  // occur while the daemon is stopped are missed by design.
  let snapshot = readTasks(resolved);
  log(`  Watching ${snapshot.size} task(s) in ${tasksDir}`);

  let timer = null;

  const check = () => {
    const next = readTasks(resolved);
    const transitions = diffTasks(snapshot, next);
    snapshot = next;

    for (const transition of transitions) {
      handleTransition(resolved, transition, { log, ...options });
    }
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(check, DEBOUNCE_MS);
  };

  const watcher = fs.watch(tasksDir, schedule);
  const sweep = setInterval(check, SWEEP_MS);

  return {
    stop() {
      clearTimeout(timer);
      clearInterval(sweep);
      watcher.close();
    },
    check,
  };
}

/**
 * Decides what a single status transition should cause.
 */
function handleTransition(projectPath, transition, options) {
  const { log } = options;
  const to = (transition.to || '').toLowerCase();

  // Every transition is journalled: the daily log is append-only and cheap, so
  // there is no reason to be selective about what goes in it.
  appendToJournal(projectPath, describeTransition(transition), options.now);
  log(`  ${describeTransition(transition)}`);

  if (to === NEEDS_ATTENTION) {
    notify(transition, options);
  }

  if (to === DONE && options.consolidateOnDone) {
    runConsolidation(projectPath, options);
  }
}

/**
 * Surfaces a task that has stopped and wants a human.
 *
 * Deliberately just stdout plus a bell: anything richer (desktop toast, push,
 * webhook) is a per-machine preference and a dependency this does not need.
 * The daemon's job is to notice; how you get told is yours to wire up.
 */
function notify(transition, options) {
  const message = `NEEDS ATTENTION: ${transition.id} — ${transition.title}`;
  (options.log || console.log)(`\n  *** ${message} ***\n`);
  if (options.bell !== false) process.stdout.write('');
}

function runConsolidation(projectPath, options) {
  const log = options.log || console.log;
  log('  Running consolidation…');

  try {
    const result = consolidate(projectPath, options);
    if (result.ok) {
      log(`  Proposal written to ${result.proposalPath} (${result.agent}, ${result.daysConsidered} day(s))`);
      log('  Review it, then replace docs/MEMORY.md if you agree.');
    } else {
      log(`  Skipped consolidation: ${result.reason}`);
    }
  } catch (err) {
    // A failed consolidation must never take the watcher down with it.
    log(`  Consolidation failed: ${err.message}`);
  }
}

module.exports = { startDaemon, handleTransition, DEBOUNCE_MS, SWEEP_MS };
