# Promise Pool

Limit the concurrency when runing async functions

## OPTIONS

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

## USAGE

```javascript
const { PromisePool } = require("./promise-pool-tool");
const options = { concurrency: 2 };
const tasks = [
  //
  async function() {},
  async function() {},
  async function() {},
  async function() {}
];
const promisePool = new PromisePool(tasks, options);
const results = await promisePool.start();
console.info("All Finish");
```
