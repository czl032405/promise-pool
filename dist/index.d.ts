/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
declare class PromisePool<T> {
    asyncFuncs: (() => Promise<T>)[];
    workingThread: number;
    concurrency: number;
    maxRetry: number;
    retryWait: number;
    throwError: boolean;
    blockDTD: DTD<T>;
    globalDTD: DTD<T>;
    constructor(asyncFuncs?: (() => Promise<T>)[], { concurrency, maxRetry, retryWait, throwError }?: {
        concurrency?: number;
        maxRetry?: number;
        retryWait?: number;
        throwError?: boolean;
    });
    buildDTD<T>(): DTD<T>;
    wait(timeout?: number): Promise<null>;
    start(): Promise<T[]>;
}
interface DTD<T> {
    promise: Promise<T>;
    resolve: (value?: T) => void;
    reject: (reason: any) => void;
}
export { PromisePool };
