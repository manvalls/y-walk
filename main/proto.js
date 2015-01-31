var Resolver = require('y-resolver'),
    Su = require('u-su'),
    walk = require('../main.js'),
    
    yielded = Su(),
    
    walkArray,
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

walkArray = walk.wrap(function*(array){
  var result = [],element;
  
  while(element = array.shift()) result.push(yield element);
  
  return result;
});

Su.define(Array.prototype,toYielded,function(){
  return this[yielded] = this[yielded] || walkArray(this);
});

