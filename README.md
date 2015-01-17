# Walk

## Sample ussage

```javascript
var Resolver = require('y-resolver'),
    walk = require('y-walk'),
    res = new Resolver();

walk(function*(){
  yield res.yielded;
  console.log('hi');
});

res.accept(); // hi
```
