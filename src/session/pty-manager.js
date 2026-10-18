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
      detached: process.platform !== 'win32',
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
            if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGKILL');
            else child.kill('SIGKILL');
          } catch (_) {}
        }
      },
      async terminateTree() {
        if (session.isAlive) {
          try {
            if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, 'SIGTERM');
            else child.kill('SIGTERM');
          } catch (error) { if (error.code !== 'ESRCH') return false; }
          await new Promise((resolve) => {
            if (!session.isAlive) return resolve();
            const timer = setTimeout(resolve, 5000);
            child.once('close', () => { clearTimeout(timer); resolve(); });
          });
        }
        if (process.platform === 'win32' || !child.pid) return false;
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch (error) {
          if (error.code === 'ESRCH') return true;
        }
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          try { process.kill(-child.pid, 0); } catch (error) { if (error.code === 'ESRCH') return true; }
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        return false;
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

  async execute(command, { timeoutMs = 8000, cwd } = {}) {
    return new Promise((resolve, reject) => {
      const isWin = process.platform === 'win32';
      const shellCmd = isWin ? 'cmd.exe' : (this.shell || '/bin/bash');
      const args = isWin ? ['/c', command] : ['-c', command];

      const child = spawn(shellCmd, args, {
        cwd: cwd || this.cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // One-shot command: signal EOF so tools that wait on piped stdin (e.g. `codex exec`) proceed.
      child.stdin.end();

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (c) => { stdout += c.toString('utf8'); });
      child.stderr.on('data', (c) => { stderr += c.toString('utf8'); });

      let finished = false;
      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try { child.kill('SIGKILL'); } catch (_) {}
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim() || 'Command timed out',
            code: -1,
            timedOut: true
          });
        }
      }, timeoutMs);

      child.on('close', (code) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            code,
            timedOut: false
          });
        }
      });

      child.on('error', (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          reject(err);
        }
      });
    });
  }

  async executeCommand(binary, args = [], { timeoutMs = 45000, cwd, stdinInput, signal, onStdout } = {}) {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) return resolve({ stdout: '', stderr: 'Cancelled before spawn', code: -1, interrupted: true, quiescent: true });
      const child = spawn(binary, args, {
        cwd: cwd || this.cwd,
        detached: process.platform !== 'win32',
        env: {
          ...process.env,
          TERM: 'xterm-256color',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (stdinInput) {
        child.stdin.write(stdinInput);
      }
      child.stdin.end();

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (c) => {
        const text = c.toString('utf8');
        stdout += text;
        if (typeof onStdout === 'function') onStdout(text);
      });
      child.stderr.on('data', (c) => { stderr += c.toString('utf8'); });

      let finished = false;
      let interrupted = false;
      let interruptionAt = null;
      let escalationTimer = null;
      const signalTree = (name) => {
        try {
          if (process.platform !== 'win32' && child.pid) process.kill(-child.pid, name);
          else child.kill(name);
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
      };
      const onAbort = () => {
        interrupted = true;
        interruptionAt = Date.now();
        signalTree('SIGTERM');
        escalationTimer = setTimeout(() => signalTree('SIGKILL'), 5000);
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => {
        if (!finished) {
          interrupted = true;
          interruptionAt = Date.now();
          signalTree('SIGTERM');
          escalationTimer = setTimeout(() => signalTree('SIGKILL'), 5000);
        }
      }, timeoutMs);

      child.on('close', async (code) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          clearTimeout(escalationTimer);
          signal?.removeEventListener('abort', onAbort);
          let quiescent = !interrupted;
          if (interrupted && process.platform !== 'win32' && child.pid) {
            const deadline = interruptionAt + 10000;
            let escalated = false;
            while (Date.now() < deadline) {
              let groupExists = true;
              try { process.kill(-child.pid, 0); } catch (error) { if (error.code === 'ESRCH') groupExists = false; }
              if (!groupExists) { quiescent = true; break; }
              if (!escalated && Date.now() >= interruptionAt + 5000) {
                signalTree('SIGKILL');
                escalated = true;
              }
              await new Promise((resolveWait) => setTimeout(resolveWait, 50));
            }
          }
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            code,
            timedOut: !signal?.aborted && interrupted,
            interrupted,
            quiescent
          });
        }
      });

      child.on('error', (err) => {
        if (!finished) {
          finished = true;
          clearTimeout(timer);
          clearTimeout(escalationTimer);
          signal?.removeEventListener('abort', onAbort);
          reject(err);
        }
      });
    });
  }

  killAll() {
    for (const session of this.activeSessions.values()) {
      session.kill();
    }
    this.activeSessions.clear();
  }
}

module.exports = { PtyManager };
