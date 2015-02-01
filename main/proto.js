var Resolver = require('y-resolver'),
    Su = require('u-su'),
    walk = require('../main.js'),
    
    yielded = Su(),
    
    race,
    toYielded = walk.toYielded;

// Promise

if(global.Promise) Su.define(Promise.prototype,toYielded,function(){
  var resolver;
  
  if(this[yielded]) return this[yielded];
  
  resolver = new Resolver();
  
  this.then(function(v){ resolver.accept(v); },function(e){ resolver.reject(e); });
  
  return this[yielded] = resolver.yielded;
});

// Array (Promise.all equivalent)

Su.define(Array.prototype,toYielded,walk.wrap(function*(){
  var result = [],
      array = this.slice(),
      element;
  
  while(element = array.shift()) result.push(yield element);
  
  return result;
}));

// Object (Promise.race equivalent)

race = walk.wrap(function*(ctx,key,yd){
  
  yield ctx.ready;
  
  try{ ctx.resolver.accept([key,yield yd]); }
  catch(e){
    if(!--ctx.toFail) ctx.resolver.reject(e);
  }
  
});

Su.define(Object.prototype,toYielded,function(){
  var ready = new Resolver(),
      keys = Object.keys(this),
      ctx = {
        ready: ready.yielded,
        resolver: new Resolver(),
        toFail: keys.length
      },
      i;
  
  for(i = 0;i < keys.length;i++) race(ctx,keys[i],this[keys[i]]);
  ready.accept();
  
  return ctx.resolver.yielded;
});