import { DTD } from "./iDTD";

/**
 * Limit the concurrency when runing async functions
 * @author czl
 */

class PromisePool<T> {
  private isWorking: boolean = false;
  private asyncFuncs: (() => Promise<T>)[] = []; // will keep splice when runing
  private asyncFuncsDTDs: DTD<T>[] = []; // will keep splice when runing
  private finishedCount: number = 0;
  private asyncFuncsCount: number = 0;

  constructor(
    asyncFuncs: (() => Promise<T>)[] = [],
    protected readonly options: {
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
      maxRetry: 1,
      retryWait: 1000,
      debug: false,
      onProgress: (index: number, result: T, error: Error) => {},
      onProgressRetry: (index: number, retry: number, error: Error) => {},
      onFinish: (results: T[], errors: Error[]) => {}
    };
    this.options = Object.assign(defaultOptions, this.options);
    this.asyncFuncs = this.asyncFuncs.concat(asyncFuncs);
    this.asyncFuncsCount = this.asyncFuncs.length;
    this.asyncFuncsDTDs = this.asyncFuncsDTDs.concat(Array.from({ length: this.asyncFuncsCount }).map(() => this.buildDTD<T>()));
  }

  private buildDTD<T>(): DTD<T> {
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

  private async wait(timeout: number = 1000) {
    let promise = new Promise<null>(resolve => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
    return await promise;
  }

  async push(asyncFunc: () => Promise<T>): Promise<T>;
  async push(asyncFuncs: (() => Promise<T>)[]): Promise<T[]>;
  async push(asyncFuncs: (() => Promise<T>) | (() => Promise<T>)[]): Promise<T | T[]> {
    if (!asyncFuncs) {
      return null;
    }

    let isArray = asyncFuncs instanceof Array;
    let asyncFuncsCount = isArray ? asyncFuncs.length : 1;
    this.asyncFuncs = this.asyncFuncs.concat(asyncFuncs);
    this.asyncFuncsCount = this.asyncFuncsCount + asyncFuncsCount;
    let dtds = Array.from({ length: asyncFuncsCount }).map(() => this.buildDTD<T>());
    this.asyncFuncsDTDs = this.asyncFuncsDTDs.concat(dtds);

    if (!this.isWorking) {
      this.start();
    }
    let result = await Promise.all(dtds.map(dtd => dtd.promise));
    return isArray ? result : result[0];
  }

  async start() {
    let promisePool = this;
    let { debug, concurrency, maxRetry, retryWait, onProgress, onProgressRetry, onFinish } = this.options;
    let workingCount = 0;
    let taskIndex = 0;
    let results: T[] = [];
    let errors: Error[] = [];
    let resultDTD = this.buildDTD<null>();
    let blockDTD: DTD<null> = null;

    if (this.isWorking) {
      throw new Error("Async Tasks is already running");
    }

    if (this.asyncFuncs.length == 0) {
      this.isWorking = false;
      return results;
    }
    this.isWorking = true;
    while (this.asyncFuncs.length > 0) {
      let i = taskIndex;
      let func = this.asyncFuncs.splice(0, 1)[0];
      let funcDTD = this.asyncFuncsDTDs.splice(0, 1)[0];
      let retry = 0;

      if (workingCount >= concurrency) {
        blockDTD = this.buildDTD();
        await blockDTD.promise;
      }

      let runFunc = async function(): Promise<T> {
        try {
          debug && console.info(`[PromisePool] Task[${i}] Begin`);
          let result = await func();
          onProgress(i, result, undefined);
          debug && console.info(`[PromisePool] Task[${i}] Finish`);
          return result;
        } catch (error) {
          retry++;
          if (retry <= maxRetry) {
            onProgressRetry(i, retry, error);
            debug && console.error(`[PromisePool] task[${i}] Error...retry:${retry}`, error);
            await promisePool.wait(retryWait);
            return await runFunc();
          } else {
            onProgress(i, undefined, error);
            debug && console.info(`[PromisePool] Task[${i}] Error`, error);
            throw error;
          }
        }
      };

      let markFinish = (result: T, error: Error) => {
        this.finishedCount++;
        workingCount--;
        results[i] = result;
        errors[i] = error;

        // release block dtd
        if (workingCount < this.options.concurrency) {
          blockDTD && blockDTD.resolve();
          funcDTD && funcDTD.resolve(result);
        }
        // release global dtd
        if (this.finishedCount >= this.asyncFuncsCount) {
          resultDTD.resolve();
          funcDTD && funcDTD.reject(error);
        }
      };

      workingCount++;
      taskIndex++;

      runFunc().then(
        result => {
          markFinish(result, undefined);
        },
        error => {
          markFinish(undefined, error);
        }
      );
    }

    await resultDTD.promise;
    onFinish(results, errors);
    this.isWorking = false;
    return results;
  }
}

export { PromisePool };
