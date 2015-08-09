var Resolver = require('y-resolver'),
    fromPromise = require('./Promise.js'),
    walk = require('../main.js'),

    toYd = Resolver.toYielded,

    race;

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
