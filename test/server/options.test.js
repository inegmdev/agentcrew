const test = require('node:test');
const assert = require('node:assert/strict');

const { parseServerHost } = require('../../src/server/options');

test('server host defaults to loopback unless --host is supplied', () => {
  assert.equal(parseServerHost([]), '127.0.0.1');
  assert.equal(parseServerHost(['--host', '0.0.0.0']), '0.0.0.0');
  assert.throws(() => parseServerHost(['--host']), /Usage: --host <address>/);
});
