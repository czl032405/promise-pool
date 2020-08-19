# Promise Pool Tool

check test.js to see full examples.

## Promise Pool

Run async functions in Limit Concurrency Number.

### OPTIONS

- concurrency
  Max thread when runing async functions
  Default: 10
- maxRetry
  Max retry time when a task throw errors
  Default: 5
- retryWait
  Timeout(millseconds) when retry the task
  Default: 1000
- onProgress: (index: number, result: T, error: Error) => void
  Event on a Task Finished
- onFinish: (results: T[], errors: Error[]) => void
  Event on all Tasks Finished

### USAGE

```javascript
const { PromisePool } = require("./promise-pool-tool");
const options = { concurrency: 2 };
const tasks = [
  //
  async function () {},
  async function () {},
  async function () {},
  async function () {},
];
const promisePool = new PromisePool(tasks, options);
const results = await promisePool.start();
console.info("All Finish");
```

## Promise Queue

Run async functions in a Queue.
(Extend From PromisePool with concurrency=1)

### USAGE

```javascript
// simulation of second buy
let promiseQueue = new PromiseQueue();
let quantity = 5;
Array.from({ length: 10 }).map(async (unknow, index) => {
  setTimeout(() => {
    // push async task in the queue
    promiseQueue.push(async function () {
      await wait(1);
      if (quantity > 0) {
        quantity--;
        console.info(`[PromiseQueue Test 1] ${index} Buy Success`);
      } else {
        console.info(`[PromiseQueue Test 1] ${index} Sold Out`);
      }
    });
  }, Math.floor(Math.random() * 100));
});
```

## Global Async Function

Create an async function that returning the same Promise before resolved.

### USAGE

```javascript
// they all will return the same number
let globalAsyncFunction = new GlobalAsyncFunction("sampleKey", async function () {
  await wait(2000);
  return Math.random();
});

globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
globalAsyncFunction().then(console.info);
GlobalAsyncFunction.get("sampleKey")().then(console.info);
GlobalAsyncFunction.get("sampleKey")().then(console.info);
GlobalAsyncFunction.get("sampleKey")().then(console.info);
GlobalAsyncFunction.get("sampleKey")().then(console.info);
GlobalAsyncFunction.get("sampleKey")().then(console.info);
```
