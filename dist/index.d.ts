/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
declare class PromisePool<T> {
    private readonly asyncFuncs;
    private readonly options;
    private workingThread;
    private blockDTD;
    private globalDTD;
    constructor(asyncFuncs?: (() => Promise<T>)[], options?: {
        concurrency?: number;
        maxRetry?: number;
        retryWait?: number;
        debug?: boolean;
        onProgress?: (index: number, result: T, error: Error) => void;
        onProgressRetry?: (index: number, retry: number, error: Error) => void;
        onFinish?: (results: T[], errors: Error[]) => void;
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
