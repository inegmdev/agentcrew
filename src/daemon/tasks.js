const fs = require('fs');
const path = require('path');

const TASKS_DIR = path.join('backlog', 'tasks');

/**
 * Reads the frontmatter fields the daemon cares about out of a task file.
 *
 * Deliberately a shallow scan rather than a YAML parse: we only need three
 * scalar keys from the top block, and Backlog.md owns the file format. Anything
 * deeper would couple the daemon to internals it is explicitly told not to
 * write to.
 */
function parseTask(contents) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^(id|status|title):\s*(.*)$/);
    if (kv) fields[kv[1]] = stripQuotes(kv[2].trim());
  }

  return fields.id ? fields : null;
}

function stripQuotes(value) {
  return value.replace(/^["'](.*)["']$/, '$1');
}

/**
 * Returns a Map of task id -> { status, title, file } for a project.
 * An unreadable or malformed file is skipped rather than throwing: a
 * half-written file caught mid-save must not take the daemon down.
 */
function readTasks(projectPath) {
  const dir = path.join(projectPath, TASKS_DIR);
  const tasks = new Map();

  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return tasks;
  }

  for (const entry of entries) {
    if (!entry.endsWith('.md')) continue;
    const file = path.join(dir, entry);

    let parsed;
    try {
      parsed = parseTask(fs.readFileSync(file, 'utf8'));
    } catch {
      continue;
    }

    if (parsed) {
      tasks.set(parsed.id, { status: parsed.status || '', title: parsed.title || '', file });
    }
  }

  return tasks;
}

/**
 * Compares two snapshots and returns the status transitions between them.
 *
 * Only status changes are reported. Edits to a task's body are invisible here
 * by design — the daemon reacts to work moving across the board, not to text
 * being typed.
 */
function diffTasks(before, after) {
  const transitions = [];

  for (const [id, now] of after) {
    const was = before.get(id);

    if (!was) {
      transitions.push({ id, from: null, to: now.status, title: now.title, file: now.file });
    } else if (was.status !== now.status) {
      transitions.push({ id, from: was.status, to: now.status, title: now.title, file: now.file });
    }
  }

  return transitions;
}

module.exports = { readTasks, diffTasks, parseTask, TASKS_DIR };
