/**
 * Deterministic Mock CLI Harness for tests and CI execution (ADR decision-6).
 */
class MockCLI {
  constructor(opts = {}) {
    this.responses = opts.responses || [];
  }

  async *stream() {
    for (const item of this.responses) {
      yield item;
    }
  }
}

module.exports = { MockCLI };
