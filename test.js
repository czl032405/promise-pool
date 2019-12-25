const { PromisePool } = require("./dist/index");
const wait = async function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 200);
  });
};
const main = async function() {
  console.info("test 1");
  const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(index => async () => {
    await wait();
    if (index == 5) {
      if (Math.random() < 0.5) {
        throw "50% Error in Task 5";
      }
    }
    return index;
  });
  const promisePool = new PromisePool(tasks, { concurrency: 2 });
  let result = await promisePool.start();
  console.info("all task finish", result);

  console.info("test 2");
  const tasks2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(index => async () => {
    throw "100% Error";
  });
  const promisePool2 = new PromisePool(tasks2, {
    concurrency: 2,
    throwError: false
  });
  let result2 = await promisePool2.start();
  console.info("all task finish", result2);
};

main();
