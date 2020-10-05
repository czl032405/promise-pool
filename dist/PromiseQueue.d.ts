import { PromisePool } from "./PromisePool";
declare class PromiseQueue<T> extends PromisePool<T> {
    constructor(asyncFuncs?: (() => Promise<T>)[], options?: {
        maxRetry?: number;
        retryWait?: number;
        debug?: boolean;
        onProgress?: (index: number, result: T, error: Error) => void;
        onProgressRetry?: (index: number, retry: number, error: Error) => void;
        onFinish?: (results: T[], errors: Error[]) => void;
    });
}
export { PromiseQueue };
