var walk = require('./main.js'),
    wait = require('y-timers/wait');

walk(function*(){
  var yd = wait(1000),
      after = walk.after(yd),
      before = walk.before(yd);
  
  walk(function*(){
    yield before;
    console.log('before');
  });
  
  walk(function*(){
    yield after;
    console.log('after');
  });
  
  yield yd;
  console.log('lel');
  
  return 5;
}).listen(function(){
  console.log(this.done,this.accepted,this.rejected,this.value);
});

