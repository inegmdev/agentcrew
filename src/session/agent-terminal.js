const EventEmitter = require('node:events');
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

  async terminateTree(timeoutMs = 5000) {
    if (!this.isAlive) return true;
    this.pty.kill();
    const result = await Promise.race([
      this.exitPromise.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]);
    return result && !this.isAlive;
  }
}

module.exports = { AgentTerminal };
