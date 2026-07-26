const { which } = require('../lib/shell');

function checkPrerequisites() {
  console.log('\n[1/6] Checking prerequisites…');

  const problems = [];

  // No platform gate: everything this wizard installs is npm-based and
  // cross-platform. (The old macOS/Linux restriction came from guild's
  // installer, which is no longer part of the stack.)
  const required = ['git', 'node', 'npm'];
  for (const bin of required) {
    if (!which(bin)) problems.push(`Missing required command: ${bin}`);
  }

  if (problems.length) {
    console.log('  Found problems:');
    problems.forEach((p) => console.log(`   - ${p}`));
    throw new Error('Resolve the above before continuing.');
  }

  console.log('  OK — git, node, npm all present.');
}

module.exports = { checkPrerequisites };
