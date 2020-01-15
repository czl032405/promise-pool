const { PromisePool } = require("./dist/index");
const wait = async function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 20);
  });
};
const main = async function() {
  const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value, index) => async () => {
    if (Math.random() < 0.4) {
      throw "40% Error";
    }
    return index;
  });

  // test1
  console.info("\r\n[test 1]");
  const promisePool = new PromisePool(tasks, { concurrency: 2 });
  let result = await promisePool.start();
  console.info("All task finish", result);

  // test2
  console.info("\r\n[test 2]");
  const promisePool2 = new PromisePool(tasks, {
    concurrency: 5,
    maxRetry: 2
  });
  let result2 = await promisePool2.start();
  console.info("all task finish", result2);

  // test3
  console.info("\r\n[test 3]");
  const promisePool3 = new PromisePool(tasks, {
    concurrency: 5,
    maxRetry: 1,
    onProgress(index, result, error) {
      if (error) {
        console.error(`Task ${index + 1} error `, error);
      } else {
        console.error(`Task ${index + 1} success `, result);
      }
    },
    onFinish(results, errors) {
      console.info("Task Finished", `Success Count ${result.filter(Boolean).length} Fail Count ${errors.filter(Boolean).length}`);
    }
  });
  let result3 = await promisePool3.start();
  console.info("all task finish", result3);

  // test4
  console.info("\r\n[test 4]");
  const promisePool4 = new PromisePool([]);
  let result4 = await promisePool4.start();
  console.info("all task finish", result4);
};

main();
