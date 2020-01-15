"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
class PromisePool {
    constructor(asyncFuncs = [], options = {}) {
        this.asyncFuncs = asyncFuncs;
        this.options = options;
        this.workingThread = 0;
        this.blockDTD = null;
        this.globalDTD = null;
        const defaultOptions = {
            concurrency: 10,
            maxRetry: 5,
            retryWait: 1000,
            debug: false,
            onProgress: (index, result, error) => { },
            onProgressRetry: (index, retry, error) => { },
            onFinish: (results, errors) => { }
        };
        this.options = Object.assign(defaultOptions, this.options);
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
    async start() {
        let promisePool = this;
        let finishCount = 0;
        let results = [];
        let errors = [];
        if (this.asyncFuncs.length == 0) {
            return results;
        }
        this.globalDTD = this.buildDTD();
        for (let i in this.asyncFuncs) {
            let func = this.asyncFuncs[i];
            let retry = 0;
            if (this.workingThread >= this.options.concurrency) {
                this.blockDTD = this.buildDTD();
                await this.blockDTD.promise;
            }
            let runFunc = async function () {
                try {
                    promisePool.options.debug && console.info(`[PromisePool] Task[${i}] Begin`);
                    let result = await func();
                    promisePool.options.onProgress(+i, result, undefined);
                    promisePool.options.debug && console.info(`[PromisePool] Task[${i}] Finish`);
                    return result;
                }
                catch (error) {
                    retry++;
                    if (retry <= promisePool.options.maxRetry) {
                        promisePool.options.debug && console.error(`[PromisePool] task[${i}] Error...retry:${retry}`, error);
                        await promisePool.wait(promisePool.options.retryWait);
                        return await runFunc();
                    }
                    else {
                        promisePool.options.onProgress(+i, undefined, error);
                        promisePool.options.debug && console.info(`[PromisePool] Task[${i}] Error`, error);
                        throw error;
                    }
                }
            };
            let markFinish = (result, error) => {
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
            runFunc().then(result => {
                markFinish(result, undefined);
            }, error => {
                markFinish(undefined, error);
            });
        }
        await this.globalDTD.promise;
        promisePool.options.onFinish(results, errors);
        return results;
    }
}
exports.PromisePool = PromisePool;
