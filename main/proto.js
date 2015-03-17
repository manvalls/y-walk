var Resolver = require('y-resolver'),
    Su = require('u-su'),
    walk = require('../main.js'),
    
    yielded = Su(),
    
    race;

// Promise

if(global.Promise && !Promise.prototype.yToWalkable)
Object.defineProperty(Promise.prototype,'yToWalkable',{writable: true,value: function(){
  var resolver;
  
  if(this[yielded]) return this[yielded];
  
  resolver = new Resolver();
  
  this.then(function(v){ resolver.accept(v); },function(e){ resolver.reject(e); });
  
  return this[yielded] = resolver.yielded;
}});

// Array (Promise.all equivalent)

if(!Array.prototype.yToWalkable)
Object.defineProperty(Array.prototype,'yToWalkable',{writable: true,value: walk.wrap(function*(){
  var result = [],
      array = this.slice(),
      element;
  
  while(element = array.shift()) result.push(yield element);
  
  return result;
})});

// Object (Promise.race equivalent)

if(!Object.prototype.yToWalkable){
  
  race = walk.wrap(function*(ctx,key,yd){
    yield ctx.ready;
    
    try{ ctx.resolver.accept([key,yield yd]); }
    catch(e){
      if(!--ctx.toFail) ctx.resolver.reject(e);
    }
    
  });
  
  Object.defineProperty(Object.prototype,'yToWalkable',{writable: true,value: function(){
    var ready,
        keys = Object.keys(this),
        ctx,
        i;
    
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


