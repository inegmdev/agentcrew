const EventEmitter = require('node:events');
const { execFile } = require('node:child_process');
const pty = require('node-pty');

/** Owns one provider's interactive process, independent of browser connections. */
class AgentTerminal extends EventEmitter {
  constructor({ agent, session, cwd, which, spawn = pty.spawn }) {
    super();
    this.agent = agent;
    this.session = session;
    this.cwd = cwd;
    this.which = which;
    this.spawn = spawn;
    this.isAlive = false;
    this.output = '';
    this.exitPromise = new Promise((resolve) => { this.resolveExit = resolve; });
  }

  start({ cols = 80, rows = 24 } = {}) {
    const provider = this.agent.provider;
    if (!['agy', 'codex'].includes(provider)) throw new Error(`${provider}: interactive CLI is not qualified`);
    if (!this.which(provider)) throw new Error(`${provider}: CLI is not installed; ${this.agent.name} is disconnected`);
    const model = this.agent.model;
    let args;
    if (provider === 'codex') {
      args = this.session?.sessionId
        ? ['resume', '--include-non-interactive', this.session.sessionId]
        : [];
      if (model && model !== 'o3') args.push('-m', model);
    } else {
      args = this.session?.sessionId ? ['--conversation', this.session.sessionId] : [];
      if (model && model !== 'gemini-2.5-pro') args.push('--model', model);
    }
    this.command = provider;
    this.args = args;
    this.pty = this.spawn(provider, args, {
      cwd: this.cwd,
      cols,
      rows,
      name: 'xterm-256color',
      env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    });
    this.isAlive = true;
    this.pty.onData((data) => {
      this.output = (this.output + data).slice(-100000);
      this.emit('data', data);
    });
    this.pty.onExit(({ exitCode, signal }) => {
      this.isAlive = false;
      this.resolveExit({ exitCode, signal });
      this.emit('exit', { exitCode, signal });
    });
    return this;
  }

  write(data) {
    if (!this.isAlive) throw new Error('Provider CLI has exited');
    if (typeof data !== 'string' || data.length > 65536) throw new Error('Invalid terminal input');
    this.pty.write(data);
  }

  resize(cols, rows) {
    if (!this.isAlive) return;
    if (!Number.isInteger(cols) || !Number.isInteger(rows) || cols < 10 || cols > 500 || rows < 4 || rows > 200) {
      throw new Error('Invalid terminal size');
    }
    this.pty.resize(cols, rows);
  }

  async waitForExit(timeoutMs) {
    let timer;
    const exited = await Promise.race([
      this.exitPromise.then(() => true),
      new Promise((resolve) => { timer = setTimeout(() => resolve(false), timeoutMs); }),
    ]);
    clearTimeout(timer);
    return exited;
  }

  async terminateTree(timeoutMs = 5000) {
    const pid = this.pty.pid;
    const groupGone = () => {
      try { process.kill(-pid, 0); return false; }
      catch (error) { return error.code === 'ESRCH'; }
    };
    if (!this.isAlive && (process.platform === 'win32' || !pid || groupGone())) return true;
    if (process.platform === 'win32' && pid) {
      const killed = await new Promise((resolve) => {
        execFile('taskkill', ['/PID', String(pid), '/T', '/F'], { timeout: timeoutMs }, (error) => resolve(!error));
      });
      if (!killed && this.isAlive) return false;
    } else if (pid) {
      try { process.kill(-pid, 'SIGTERM'); }
      catch (error) {
        if (error.code !== 'ESRCH') return false;
        this.pty.kill();
      }
    } else {
      this.pty.kill();
    }
    let exited = await this.waitForExit(timeoutMs);
    if (!exited && process.platform !== 'win32' && pid) {
      try { process.kill(-pid, 'SIGKILL'); }
      catch (error) { if (error.code !== 'ESRCH') return false; }
      exited = await this.waitForExit(timeoutMs);
    }
    if (!exited || this.isAlive) return false;
    if (process.platform !== 'win32' && pid) {
      const deadline = Date.now() + timeoutMs;
      let escalated = false;
      while (Date.now() < deadline) {
        if (groupGone()) return true;
        if (!escalated && Date.now() >= deadline - Math.min(timeoutMs / 2, 2500)) {
          try { process.kill(-pid, 'SIGKILL'); }
          catch (error) { if (error.code !== 'ESRCH') return false; }
          escalated = true;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      return false;
    }
    return true;
  }
}

module.exports = { AgentTerminal };
