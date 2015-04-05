var Resolver = require('y-resolver'),
    Su = require('u-su'),
    walk = require('../main.js'),
    
    yielded = Su(),
    
    toYd = Resolver.toYielded,
    
    race,fromPromise;

// Promise

if(global.Promise && !Promise.prototype[toYd])
Object.defineProperty(Promise.prototype,toYd,{writable: true,value: fromPromise = function(){
  var resolver;
  
  if(this[yielded]) return this[yielded];
  
  resolver = new Resolver();
  this.then(function(v){ resolver.accept(v); },function(e){ resolver.reject(e); });
  
  return this[yielded] = resolver.yielded;
}});

// Array (Promise.all equivalent)

if(!Array.prototype[toYd])
Object.defineProperty(Array.prototype,toYd,{writable: true,value: walk.wrap(function*(){
  var result = [],
      array = this.slice(),
      element;
  
  while(element = array.shift()) result.push(yield element);
  
  return result;
})});

// Object (Promise.race equivalent)

if(!Object.prototype[toYd]){
  
  race = walk.wrap(function*(ctx,key,yd){
    var obj;
    
    yield ctx.ready;
    
    try{
      obj = {};
      obj[key] = yield yd;
      ctx.resolver.accept(obj);
    }catch(e){
      if(!--ctx.toFail) ctx.resolver.reject(e);
    }
    
  });
  
  Object.defineProperty(Object.prototype,toYd,{writable: true,value: function(){
    var ready,keys,ctx,i;
    
    if(typeof this.toPromise == 'function') return this.toPromise();
    if(typeof this.then == 'function') return fromPromise.call(this);
    
    keys = Object.keys(this);
    if(!keys.length) return Resolver.accept(this);
    
    ready = new Resolver();
    
    ctx = {
      ready: ready.yielded,
      resolver: new Resolver(),
      toFail: keys.length
    };
    
    for(i = 0;i < keys.length;i++) race(ctx,keys[i],this[keys[i]]);
    ready.accept();
    
    return ctx.resolver.yielded;
  }});
  
}


