"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PromisePool_1 = require("./PromisePool");
class PromiseQueue extends PromisePool_1.PromisePool {
    constructor(asyncFuncs = [], options = {}) {
        super(asyncFuncs, { ...options, concurrency: 1 });
    }
}
exports.PromiseQueue = PromiseQueue;
