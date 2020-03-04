const { PromisePool, PromiseQueue } = require("./dist/index");
const wait = async function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 5);
  });
};
const main = async function() {
  const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value, index) => async () => {
    await wait();
    // if (Math.random() < 0.2) {
    //   throw "20% Error";
    // }
    return value;
  });

  // PromisePool test1 -- basic
  console.info("\r\n[PromisePool Test 1]");
  const promisePool = new PromisePool(tasks, { concurrency: 2 });
  let result = await promisePool.start();
  console.info("Result", result);

  // PromisePool test2 -- events
  console.info("\r\n[PromisePool Test 2]");
  const promisePool2 = new PromisePool(tasks, {
    concurrency: 5,
    maxRetry: 2,
    onProgressRetry(index, retry, error) {
      console.error(`Task ${index + 1} retry ${retry}`, error);
    },
    onProgress(index, result, error) {
      if (error) {
        console.error(`Task ${index + 1} error `, error);
      } else {
        console.error(`Task ${index + 1} success `, result);
      }
    },
    onFinish(results, errors) {
      console.info("Task Finished", `Success Count ${results.filter(Boolean).length} / Fail Count ${errors.filter(Boolean).length}`);
    }
  });
  let result2 = await promisePool2.start();
  console.info("Result", result2);

  // Promise Pool Test 3 -- push extra async functions when running
  console.info("\r\n[PromisePool Test 3]");
  const promisePool3 = new PromisePool(tasks, {
    concurrency: 5
  });
  setTimeout(() => {
    Array.from({ length: 10 }).map(async (unknow, index) => {
      promisePool3
        .push(async function() {
          await wait();
          return (index + 1) * 1000;
        })
        .then(result => console.info(`Extra Before All Finished ${index} result`, result));
    });
  }, 0);

  let result3 = await promisePool3.start();
  console.info("Result", result3);
  let extraTasks = Array.from({ length: 10 }).map((unknow, index) => async () => {
    await wait();
    return (index + 1) * 10000000 + 9;
  });

  let extraResult3 = await promisePool3.push(extraTasks);
  console.info(`Extra After All Finished result`, extraResult3);
};

main();
