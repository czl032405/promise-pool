class PromisePool {
  asyncFuncs = [];
  concurrency = 0;
  workingThread = 0;
  blockDTD = null;
  globalDTD = null;
  constructor(asyncFuncs, concurrency = 10) {
    this.asyncFuncs = asyncFuncs;
    this.concurrency = concurrency;
  }

  buildDTD() {
    let resolve, reject;

    let promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    return {
      resolve,
      reject,
      promise
    };
  }

  async start() {
    this.globalDTD = this.buildDTD();
    let finishCount = 0;

    for (let i in this.asyncFuncs) {
      let func = this.asyncFuncs[i];

      if (this.workingThread >= this.concurrency) {
        this.blockDTD = this.buildDTD();
        await this.blockDTD.promise;
      }

      this.workingThread++;
      func().then(() => {
        this.workingThread--;
        finishCount++;

        // release block dtd
        if (this.workingThread < this.concurrency) {
          this.blockDTD.resolve();
        }

        // release global dtd
        if (finishCount >= this.asyncFuncs.length) {
          this.globalDTD.resolve();
        }
      });
    }
    await this.globalDTD.promise;
    console.info(1);
  }
}

module.exports = PromisePool;
