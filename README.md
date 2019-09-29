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
- throwError
  Whether to throw an error when one of the task fail
  Default: true

## USAGE

```javascript
const { PromisePool } = require("./promise-pool-tool");
const concurrency = 2;
const tasks = [
  async function() {},
  async function() {},
  async function() {},
  async function() {}
];
const promisePool = new PromisePool(tasks, {
  concurrency
});
await promisePool.start();
console.info("All Finish");
```
