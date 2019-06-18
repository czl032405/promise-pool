const PromisePool = require("./PromisePool");
const wait = async function() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 2000);
  });
};
const main = async function() {
  const tasks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(index => async () => {
    console.info(index, "begin");
    await wait();
    console.info(index, "finish");
  });
  const promisePool = new PromisePool(tasks, 2);
  await promisePool.start();
  console.info("all task finish");
};

main();
