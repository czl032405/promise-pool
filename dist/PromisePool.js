"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
class PromisePool {
    constructor(asyncFuncs = [], options = {}) {
        this.options = options;
        this.isWorking = false;
        this.asyncFuncs = []; // will keep splice when runing
        this.asyncFuncsDTDs = []; // will keep splice when runing
        this.finishedCount = 0;
        this.asyncFuncsCount = 0;
        const defaultOptions = {
            concurrency: 10,
            maxRetry: 1,
            retryWait: 1000,
            debug: false,
            onProgress: (index, result, error) => { },
            onProgressRetry: (index, retry, error) => { },
            onFinish: (results, errors) => { }
        };
        this.options = Object.assign(defaultOptions, this.options);
        this.asyncFuncs = this.asyncFuncs.concat(asyncFuncs);
        this.asyncFuncsCount = this.asyncFuncs.length;
        this.asyncFuncsDTDs = this.asyncFuncsDTDs.concat(Array.from({ length: this.asyncFuncsCount }).map(() => this.buildDTD()));
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
    async wait(timeout = 1000) {
        let promise = new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, timeout);
        });
        return await promise;
    }
    async push(asyncFuncs) {
        if (!asyncFuncs) {
            return null;
        }
        let isArray = asyncFuncs instanceof Array;
        let asyncFuncsCount = isArray ? asyncFuncs.length : 1;
        let dtds = Array.from({ length: asyncFuncsCount }).map(() => this.buildDTD());
        this.asyncFuncs = this.asyncFuncs.concat(asyncFuncs);
        this.asyncFuncsCount = this.asyncFuncsCount + asyncFuncsCount;
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
        let results = [];
        let errors = [];
        let resultDTD = this.buildDTD();
        let blockDTD = null;
        debug && console.info("[PromisePool] Start");
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
            let runFunc = async function () {
                try {
                    debug && console.info(`[PromisePool] Task[${i}] Begin`);
                    let result = await func();
                    onProgress(i, result, undefined);
                    debug && console.info(`[PromisePool] Task[${i}] Finish`);
                    return result;
                }
                catch (error) {
                    console.error(error);
                    retry++;
                    if (retry <= maxRetry) {
                        onProgressRetry(i, retry, error);
                        debug && console.error(`[PromisePool] task[${i}] Error...retry:${retry}`, error);
                        await promisePool.wait(retryWait);
                        return await runFunc();
                    }
                    else {
                        onProgress(i, undefined, error);
                        debug && console.info(`[PromisePool] Task[${i}] Error`, error);
                        throw error;
                    }
                }
            };
            let markFinish = (result, error) => {
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
            runFunc().then(result => {
                markFinish(result, undefined);
            }, error => {
                markFinish(undefined, error);
            });
            await this.wait(0); // check if there are any pending tasks to push
        }
        await resultDTD.promise;
        onFinish(results, errors);
        this.isWorking = false;
        return results;
    }
}
exports.PromisePool = PromisePool;
