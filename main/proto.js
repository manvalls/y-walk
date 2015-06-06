var Resolver = require('y-resolver'),
    Su = require('u-su'),
    walk = require('../main.js'),
    
    yielded = Su(),
    
    toYd = Resolver.toYielded,
    
    race,fromPromise,run;

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

if(!Array.prototype[toYd]){
  
  run = walk.wrap(function*(ctx,i,yd){
    var error;
    
    try{ ctx.arr[i] = yield yd; }
    catch(e){ ctx.errors[i] = e; }
    
    if(!--ctx.length){
      
      if(ctx.errors.length){
        error = new Error(ctx.errors[0].message);
        error.stack = ctx.errors[0].stack;
        
        error.errors = ctx.errors;
        error.values = ctx.arr;
        
        ctx.resolver.reject(error);
      }else ctx.resolver.accept(ctx.arr);
      
    }
    
  });
  
  Object.defineProperty(Array.prototype,toYd,{writable: true,value: function(){
    var arr = [],
        res,i,ctx;
    
    if(!this.length) return Resolver.accept(arr);
    
    ctx = {
      length: this.length,
      resolver: new Resolver(),
      arr: [],
      errors: []
    };
    
    for(i = 0;i < this.length;i++) run(ctx,i,this[i]);
    
    return ctx.resolver.yielded;
  }});
  
}

// Object (Promise.race equivalent)

if(!Object.prototype[toYd]){
  
  race = walk.wrap(function*(ctx,key,yd){
    var error;
    
    try{
      ctx.obj[key] = yield yd;
      ctx.resolver.accept(ctx.obj);
    }catch(e){
      ctx.errors[key] = e;
      if(!--ctx.toFail){
        error = new Error(e.message);
        error.stack = e.stack;
        
        error.errors = ctx.errors;
        ctx.resolver.reject(error);
      }
    }
    
  });
  
  Object.defineProperty(Object.prototype,toYd,{writable: true,value: function(){
    var keys,ctx,i;
    
    if(typeof this.toPromise == 'function') return this.toPromise();
    if(typeof this.then == 'function') return fromPromise.call(this);
    
    keys = Object.keys(this);
    if(!keys.length) return Resolver.accept(this);
    
    ctx = {
      resolver: new Resolver(),
      toFail: keys.length,
      errors: {},
      obj: {}
    };
    
    for(i = 0;i < keys.length;i++) race(ctx,keys[i],this[keys[i]]);
    
    return ctx.resolver.yielded;
  }});
  
}


