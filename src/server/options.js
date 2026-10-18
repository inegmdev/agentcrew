function parseServerHost(args = []) {
  const hostIndex = args.indexOf('--host');
  if (hostIndex === -1) return '127.0.0.1';

  const host = args[hostIndex + 1];
  if (!host || host.startsWith('--')) {
    throw new Error('Usage: --host <address>');
  }
  return host;
}

module.exports = { parseServerHost };
