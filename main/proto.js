var Resolver = require('y-resolver'),
    Su = require('u-su'),
    
    walk = require('../main.js'),
    
    yielded = Su(),
    
    toYielded = walk.toYielded;

if(global.Promise) Su.define(Promise.prototype,toYielded,function(){
  var resolver;
  
  if(this[yielded]) return this[yielded];
  
  resolver = new Resolver();
  
  this.then(function(v){ resolver.accept(v); },function(e){ resolver.reject(e); });
  
  return this[yielded] = resolver.yielded;
});


