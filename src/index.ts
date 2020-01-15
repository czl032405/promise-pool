/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
class PromisePool<T> {
  private workingThread: number = 0;
  private blockDTD: DTD<T> = null;
  private globalDTD: DTD<T> = null;

  constructor(
    private readonly asyncFuncs: (() => Promise<T>)[] = [],
    private readonly options: {
      concurrency?: number;
      maxRetry?: number;
      retryWait?: number;
      debug?: boolean;
      onProgress?: (index: number, result: T, error: Error) => void;
      onProgressRetry?: (index: number, retry: number, error: Error) => void;
      onFinish?: (results: T[], errors: Error[]) => void;
    } = {}
  ) {
    const defaultOptions = {
      concurrency: 10,
      maxRetry: 5,
      retryWait: 1000,
      debug: false,
      onProgress: (index: number, result: T, error: Error) => {},
      onProgressRetry: (index: number, retry: number, error: Error) => {},
      onFinish: (results: T[], errors: Error[]) => {}
    };
    this.options = Object.assign(defaultOptions, this.options);
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
    let errors: Error[] = [];
    if (this.asyncFuncs.length == 0) {
      return results;
    }
    this.globalDTD = this.buildDTD<null>();

    for (let i in this.asyncFuncs) {
      let func = this.asyncFuncs[i];
      let retry = 0;

      if (this.workingThread >= this.options.concurrency) {
        this.blockDTD = this.buildDTD();
        await this.blockDTD.promise;
      }

      let runFunc = async function(): Promise<T> {
        try {
          promisePool.options.debug && console.info(`[PromisePool] Task[${i}] Begin`);
          let result = await func();
          promisePool.options.onProgress(+i, result, undefined);
          promisePool.options.debug && console.info(`[PromisePool] Task[${i}] Finish`);
          return result;
        } catch (error) {
          retry++;
          if (retry <= promisePool.options.maxRetry) {
            promisePool.options.debug && console.error(`[PromisePool] task[${i}] Error...retry:${retry}`, error);
            await promisePool.wait(promisePool.options.retryWait);
            return await runFunc();
          } else {
            promisePool.options.onProgress(+i, undefined, error);
            promisePool.options.debug && console.info(`[PromisePool] Task[${i}] Error`, error);
            throw error;
          }
        }
      };

      let markFinish = (result: T, error: Error) => {
        this.workingThread--;
        finishCount++;
        results[i] = result;
        errors[i] = error;
        // release block dtd
        if (this.workingThread < this.options.concurrency) {
          this.blockDTD && this.blockDTD.resolve();
        }
        // release global dtd
        if (finishCount >= this.asyncFuncs.length) {
          this.globalDTD.resolve();
        }
      };

      this.workingThread++;

      runFunc().then(
        result => {
          markFinish(result, undefined);
        },
        error => {
          markFinish(undefined, error);
        }
      );
    }

    await this.globalDTD.promise;
    promisePool.options.onFinish(results, errors);
    return results;
  }
}

interface DTD<T> {
  promise: Promise<T>;
  resolve: (value?: T) => void;
  reject: (reason: any) => void;
}

export { PromisePool };
