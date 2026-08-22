export class RetryPolicy {
  constructor({ retries = 3, baseDelayMs = 10, factor = 2 } = {}) {
    this.retries = retries;
    this.baseDelayMs = baseDelayMs;
    this.factor = factor;
  }

  async run(fn) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        return {
          ok: true,
          attempts: attempt + 1,
          result: await fn(attempt)
        };
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          await new Promise((resolve) => setTimeout(resolve, this.baseDelayMs * Math.pow(this.factor, attempt)));
        }
      }
    }

    return {
      ok: false,
      attempts: this.retries + 1,
      error: lastError
    };
  }
}
