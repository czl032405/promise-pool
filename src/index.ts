/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
class PromisePool<T> {
  asyncFuncs: (() => Promise<T>)[] = [];
  workingThread: number = 0;
  concurrency: number = 10;
  maxRetry: number = 5;
  retryWait: number = 1000;
  throwError: boolean = true;
  blockDTD: DTD<T> = null;
  globalDTD: DTD<T> = null;

  constructor(
    asyncFuncs: (() => Promise<T>)[] = [],
    { concurrency = 10, maxRetry = 5, retryWait = 1000, throwError = true } = {}
  ) {
    this.asyncFuncs = asyncFuncs;
    this.concurrency = concurrency;
    this.maxRetry = maxRetry;
    this.retryWait = retryWait;
    this.throwError = throwError;
  }

  buildDTD<T>(): DTD<T> {
    let resolve, reject;
    let promise = new Promise<T>((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });

    return {
      resolve,
      reject,
      promise
    };
  }

  async wait(timeout: number = 1000) {
    let promise = new Promise<null>(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
    return await promise;
  }

  async start() {
    let promisePool = this;
    let finishCount = 0;
    let results: T[] = [];
    this.globalDTD = this.buildDTD<null>();

    for (let i in this.asyncFuncs) {
      let func = this.asyncFuncs[i];
      let retry = 0;

      if (this.workingThread >= this.concurrency) {
        this.blockDTD = this.buildDTD();
        await this.blockDTD.promise;
      }

      let runFunc = async function(): Promise<T> {
        try {
          let result = await func();
          return result;
        } catch (error) {
          retry++;
          if (retry <= promisePool.maxRetry) {
            console.error(
              `[PromisePool] task[${i}] Error...retry:${retry}`,
              error
            );
            await promisePool.wait(promisePool.retryWait);
            return await runFunc();
          } else {
            throw error;
          }
        }
      };

      this.workingThread++;
      console.info(`[PromisePool] Task[${i}] Begin`);
      runFunc().then(
        result => {
          this.workingThread--;
          finishCount++;
          results[i] = result;
          console.info(`[PromisePool] Task[${i}] Finish`);
          // release block dtd
          if (this.workingThread < this.concurrency) {
            this.blockDTD && this.blockDTD.resolve();
          }
          // release global dtd
          if (finishCount >= this.asyncFuncs.length) {
            this.globalDTD.resolve();
          }
        },
        error => {
          if (this.throwError) {
            this.globalDTD.reject(error);
          } else {
            results[i] = error;
          }
        }
      );
    }
    await this.globalDTD.promise;
    return results;
  }
}

interface DTD<T> {
  promise: Promise<T>;
  resolve: (value?: T) => void;
  reject: (reason: any) => void;
}

export { PromisePool };
