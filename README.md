# Promise Pool

Limit the concurrency when runing async functions

## USAGE

```javascript
const PromisePool = require("./PromisePool");
const concurrency = 2;
const tasks = [
  async function() {},
  async function() {},
  async function() {},
  async function() {}
];
const promisePool = new PromisePool(tasks, concurrency);
await promisePool.start();
console.info("All Finish");
```
