var Resolver = require('y-resolver'),

    yielded = Symbol(),
    
    toYd = Resolver.toYielded;

if(global.Promise && !Promise.prototype[toYd])
Object.defineProperty(Promise.prototype,toYd,{writable: true,value: module.exports = function(){
  var resolver;

  if(this[yielded]) return this[yielded];

  resolver = new Resolver();
  this.then(function(v){ resolver.accept(v); },function(e){ resolver.reject(e); });

  return this[yielded] = resolver.yielded;
}});
