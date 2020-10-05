declare function GlobalAsyncFunction<T>(key: string, asyncFunc: () => Promise<T>): () => Promise<T>;
declare namespace GlobalAsyncFunction {
    var get: (key: string) => () => Promise<any>;
    var remove: (key: string) => void;
}
export { GlobalAsyncFunction };
