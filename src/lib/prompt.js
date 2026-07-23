const readline = require('readline');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function confirm(question, defaultYes = true) {
  const suffix = defaultYes ? '[Y/n] ' : '[y/N] ';
  const answer = (await ask(`${question} ${suffix}`)).toLowerCase();
  if (answer === '') return defaultYes;
  return answer === 'y' || answer === 'yes';
}

module.exports = { ask, confirm };
