var Resolver = require('y-resolver'),
    walk = require('../main.js'),

    toYd = Resolver.toYielded,

    run;

if(!Array.prototype.hasOwnProperty(toYd)){

  run = walk.wrap(function*(ctx,i,yd){
    var error;

    try{ ctx.arr[i] = yield yd; }
    catch(e){
      ctx.errors[i] = e;
      ctx.lastError = e;
    }

    if(!--ctx.length){

      if(ctx.lastError){
        error = new Error(ctx.lastError.message);
        error.stack = ctx.lastError.stack;

        error.errors = ctx.errors;
        error.values = ctx.arr;

        ctx.resolver.reject(error);
      }else ctx.resolver.accept(ctx.arr);

    }

  });

  Object.defineProperty(Array.prototype,toYd,{writable: true,value: module.exports = function(){
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
