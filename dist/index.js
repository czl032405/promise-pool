"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
class PromisePool {
    constructor(asyncFuncs = [], { concurrency = 10, maxRetry = 5, retryWait = 1000, throwError = true } = {}) {
        this.asyncFuncs = [];
        this.workingThread = 0;
        this.concurrency = 10;
        this.maxRetry = 5;
        this.retryWait = 1000;
        this.throwError = true;
        this.blockDTD = null;
        this.globalDTD = null;
        this.asyncFuncs = asyncFuncs;
        this.concurrency = concurrency;
        this.maxRetry = maxRetry;
        this.retryWait = retryWait;
        this.throwError = throwError;
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
        this.globalDTD = this.buildDTD();
        for (let i in this.asyncFuncs) {
            let func = this.asyncFuncs[i];
            let retry = 0;
            if (this.workingThread >= this.concurrency) {
                this.blockDTD = this.buildDTD();
                await this.blockDTD.promise;
            }
            let runFunc = async function () {
                try {
                    let result = await func();
                    return result;
                }
                catch (error) {
                    retry++;
                    if (retry <= promisePool.maxRetry) {
                        console.error(`[PromisePool] task[${i}] Error...retry:${retry}`, error);
                        await promisePool.wait(promisePool.retryWait);
                        return await runFunc();
                    }
                    else {
                        throw error;
                    }
                }
            };
            let markFinish = (result) => {
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
            };
            this.workingThread++;
            console.info(`[PromisePool] Task[${i}] Begin`);
            runFunc().then(result => {
                markFinish(result);
                console.info(`[PromisePool] Task[${i}] Finish`);
            }, error => {
                if (this.throwError) {
                    this.globalDTD.reject(error);
                }
                else {
                    markFinish(undefined);
                    console.info(`[PromisePool] Task[${i}] Error`);
                }
            });
        }
        await this.globalDTD.promise;
        return results;
    }
}
exports.PromisePool = PromisePool;
