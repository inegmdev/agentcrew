const { which } = require('../lib/shell');

function checkPrerequisites() {
  console.log('\n[1/7] Checking prerequisites…');

  const problems = [];

  if (process.platform === 'win32') {
    problems.push(
      "guild's installer targets macOS/Linux. On Windows, use WSL and run this wizard from inside it."
    );
  }

  const required = ['git', 'curl', 'node', 'npm'];
  for (const bin of required) {
    if (!which(bin)) problems.push(`Missing required command: ${bin}`);
  }

  if (problems.length) {
    console.log('  Found problems:');
    problems.forEach((p) => console.log(`   - ${p}`));
    throw new Error('Resolve the above before continuing.');
  }

  console.log('  OK — git, curl, node, npm all present.');
}

module.exports = { checkPrerequisites };
