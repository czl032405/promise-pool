import { DTD } from "./DTD";

const DTDMap: { [key: string]: { dtd: DTD<any>; func: () => Promise<any> } } = {};

function GlobalAsyncFunction<T>(key: string, asyncFunc: () => Promise<T>) {
  const func = async function(): Promise<T> {
    if (DTDMap[key] && DTDMap[key].dtd) {
      return await DTDMap[key].dtd.promise;
    }

    let dtd = buildDTD<T>();
    DTDMap[key].dtd = dtd;
    asyncFunc()
      .then(result => dtd.resolve(result))
      .catch(error => dtd.reject(error));
    let result = await dtd.promise;
    delete DTDMap[key].dtd;
    return result;
  };

  DTDMap[key] = { dtd: null, func: func };

  return func;
}

GlobalAsyncFunction.get = function(key: string) {
  let func = DTDMap[key] && DTDMap[key].func;
  if (!func) {
    throw new Error(`Function ${key} Not Set`);
  }
  return func;
};

GlobalAsyncFunction.delete = function(key: string) {
  delete DTDMap[key];
};

const buildDTD = function<T>(): DTD<T> {
  let resolve, reject;
  let promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return {
    resolve,
    reject,
    promise
  };
};

export { GlobalAsyncFunction };
