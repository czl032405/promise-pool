"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalAsyncFunction = void 0;
const DTDMap = {};
function GlobalAsyncFunction(key, asyncFunc) {
    const func = async function () {
        if (DTDMap[key] && DTDMap[key].dtd) {
            return await DTDMap[key].dtd.promise;
        }
        let dtd = buildDTD();
        DTDMap[key].dtd = dtd;
        asyncFunc()
            .then((result) => dtd.resolve(result))
            .catch((error) => dtd.reject(error));
        let result = await dtd.promise;
        delete DTDMap[key].dtd;
        return result;
    };
    DTDMap[key] = { dtd: null, func: func };
    return func;
}
exports.GlobalAsyncFunction = GlobalAsyncFunction;
GlobalAsyncFunction.get = function (key) {
    let func = DTDMap[key] && DTDMap[key].func;
    if (!func) {
        throw new Error(`Function ${key} Not Set`);
    }
    return func;
};
GlobalAsyncFunction.remove = function (key) {
    delete DTDMap[key];
};
const buildDTD = function () {
    let resolve, reject;
    let promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    return {
        resolve,
        reject,
        promise,
    };
};
