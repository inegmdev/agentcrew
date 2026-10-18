const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveInput } = require('../../src/session/input-mode');

test('input mode defaults to chat and leaves natural language untouched', () => {
  assert.deepEqual(resolveInput('find the riskiest module'), {
    mode: 'chat',
    text: 'find the riskiest module'
  });
});

test('explicit shell mode and ! prefix route input to shell', () => {
  assert.deepEqual(resolveInput('git status', 'shell'), {
    mode: 'shell',
    text: 'git status'
  });
  assert.deepEqual(resolveInput('!git status'), {
    mode: 'shell',
    text: 'git status'
  });
});

test('unknown modes fall back to chat', () => {
  assert.equal(resolveInput('make a plan', 'other').mode, 'chat');
});
