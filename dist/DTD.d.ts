interface DTD<T> {
    promise: Promise<T>;
    resolve: (value?: T) => void;
    reject: (reason: any) => void;
}
export { DTD };
