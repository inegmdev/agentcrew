const { spawn } = require('node:child_process');
const EventEmitter = require('node:events');

/**
 * Manages child terminal / shell processes for interactive browser takeover.
 * Spawns bash / sh with interactive flags, piping real stdin/stdout/stderr
 * bidirectional streams to a connected WebSocket.
 */
class PtyManager extends EventEmitter {
  constructor(opts = {}) {
    super();
    this.cwd = opts.cwd || process.cwd();
    this.shell = opts.shell || process.env.SHELL || (process.platform === 'win32' ? 'cmd.exe' : '/bin/bash');
    this.activeSessions = new Map();
  }

  createSession({ sessionId, cwd, env } = {}) {
    const id = sessionId || `pty-${Date.now()}`;
    const shellEnv = {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      ...(env || {}),
    };

    const isWin = process.platform === 'win32';
    const args = isWin ? [] : ['-i'];

    const child = spawn(this.shell, args, {
      cwd: cwd || this.cwd,
      env: shellEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const session = {
      id,
      child,
      isAlive: true,
      cwd: cwd || this.cwd,
      write(data) {
        if (child.stdin && child.stdin.writable) {
          child.stdin.write(data);
        }
      },
      kill() {
        if (session.isAlive) {
          session.isAlive = false;
          try {
            if (child.stdin) child.stdin.end();
            if (child.stdout) child.stdout.destroy();
            if (child.stderr) child.stderr.destroy();
            child.kill('SIGKILL');
          } catch (_) {}
        }
      },
    };

    this.activeSessions.set(id, session);

    child.on('exit', (code, signal) => {
      session.isAlive = false;
      this.activeSessions.delete(id);
      this.emit('session_exit', { sessionId: id, code, signal });
    });

    return session;
  }

  getSession(id) {
    return this.activeSessions.get(id);
  }

  killAll() {
    for (const session of this.activeSessions.values()) {
      session.kill();
    }
    this.activeSessions.clear();
  }
}

module.exports = { PtyManager };
