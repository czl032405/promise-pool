/**
 * Limit the concurrency when runing async functions
 * @author czl
 */
declare class PromisePool<T> {
    protected readonly options: {
        concurrency?: number;
        maxRetry?: number;
        retryWait?: number;
        debug?: boolean;
        onProgress?: (index: number, result: T, error: Error) => void;
        onProgressRetry?: (index: number, retry: number, error: Error) => void;
        onFinish?: (results: T[], errors: Error[]) => void;
    };
    private isWorking;
    private asyncFuncs;
    private asyncFuncsDTDs;
    private finishedCount;
    private asyncFuncsCount;
    constructor(asyncFuncs?: (() => Promise<T>)[], options?: {
        concurrency?: number;
        maxRetry?: number;
        retryWait?: number;
        debug?: boolean;
        onProgress?: (index: number, result: T, error: Error) => void;
        onProgressRetry?: (index: number, retry: number, error: Error) => void;
        onFinish?: (results: T[], errors: Error[]) => void;
    });
    private buildDTD;
    private wait;
    push(asyncFunc: () => Promise<T>): Promise<T>;
    push(asyncFuncs: (() => Promise<T>)[]): Promise<T[]>;
    start(): Promise<T[]>;
}
export { PromisePool };
