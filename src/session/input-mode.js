const MODES = new Set(['chat', 'shell']);

/** Resolve operator input without guessing from command-like words. */
function resolveInput(input, requestedMode = 'chat') {
  const text = String(input || '').trim();
  const forcedShell = text.startsWith('!');
  const mode = forcedShell ? 'shell' : (MODES.has(requestedMode) ? requestedMode : 'chat');
  return {
    mode,
    text: forcedShell ? text.slice(1).trimStart() : text
  };
}

module.exports = { resolveInput };
