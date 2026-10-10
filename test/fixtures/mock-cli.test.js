const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { MockCLI } = require('../../test/fixtures/mock-cli');

test('MockCLI replays recorded stream-json fixtures deterministically', async () => {
  const mock = new MockCLI({
    responses: [
      { type: 'message.assistant', text: 'Chunk 1' },
      { type: 'message.assistant', text: 'Chunk 2' },
      { type: 'turn.completed', cost_usd: 0.001 },
    ],
  });

  const lines = [];
  for await (const event of mock.stream()) {
    lines.push(event);
  }

  assert.equal(lines.length, 3);
  assert.equal(lines[0].text, 'Chunk 1');
  assert.equal(lines[1].text, 'Chunk 2');
  assert.equal(lines[2].type, 'turn.completed');
});
