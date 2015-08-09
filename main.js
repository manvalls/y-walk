var stack = [],
    current = null,

    resolver = Symbol(),
    paused = Symbol(),
    iterator = Symbol(),
    lastYd = Symbol(),
    lastDt = Symbol(),
    iStack = Symbol(),

    Resolver,Yielded,toYd,isYd,define;

/*/ exports /*/

module.exports = walk;
walk.wrap = wrap;
walk.getStack = getStack;
walk.getCurrent = getCurrent;
walk.trace = trace;

/*/ imports /*/

define = require('u-proto/define');
Resolver = require('y-resolver');

toYd = Resolver.toYielded;
isYd = Resolver.isYielded;
Yielded = Resolver.Yielded;

if(global.process){
    require('./proto/stream/' + 'Readable.js');
    require('./proto/stream/' + 'Writable.js');
}

require('./proto/Promise.js');
require('./proto/Array.js');
require('./proto/Object.js');

/*/ ******* /*/

// Walker

function Walker(g,args,that,st){
  var res,ps,it;

  Yielded.call(this,resolver);
  this[paused] = false;

  res = this[resolver];
  that = that || this;
  args = args || [];
  st = st || stack;

  ps = stack;
  stack = st;
  current = this;

  try{
    it = g.apply(that,args);
  }catch(e){
    res.reject(e);
    return;
  }finally{
    stack = ps;
    current = null;
  }

  this[iterator] = it;
  this[iStack] = st;

  if(!(it && it.next && it.throw)){
    res.accept(it);
    return;
  }

  squeeze(step(it,this,st,res),it,st,res,this);
}

Walker.prototype = Object.create(Yielded.prototype);
Walker.prototype[define]('constructor',Walker);
Walker.prototype[define]({

  pause: function(){
    if(this[paused]) return;

    this[paused] = true;
    if(this[lastDt]) this[lastDt].detach();
  },

  resume: function(){
    if(!this[paused]) return;

    this[paused] = false;
    if(this[lastYd]) this[lastYd].listen(squeeze,[
      this[lastYd],
      this[iterator],
      this[iStack],
      this[resolver],
      this
    ]);

  }

});

// walk

function walk(g,args,that){
  return new Walker(g,args,that);
}

// - utils

function trace(id,g,args,that){
  var s = stack.slice();
  s.push(id);

  return new Walker(g,args,that,s);
}

function getYielded(obj){

  while(!(obj && obj[isYd])){
    if(obj && obj[toYd]) obj = obj[toYd]();
    else return Resolver.accept(obj);
  }

  return obj;
}

function squeeze(yd,it,st,res,w){

  while(yd){

    w[lastYd] = yd;
    if(w[paused]) return;

    if(!yd.done){
      w[lastDt] = yd.listen(squeeze,[yd,it,st,res,w]);
      return;
    }

    w[lastYd] = null;
    w[lastDt] = null;

    yd = step(it,w,st,res,yd.value,yd.error,yd.rejected);

  }

}

function step(it,w,st,res,value,error,failed){
  var next,ps;

  ps = stack;
  stack = st;
  current = w;

  try{
    if(failed) next = it.throw(error);
    else next = it.next(value);
  }catch(e){
    res.reject(e);
    return;
  }finally{
    stack = ps;
    current = null;
  }

  if(next.done){
    res.accept(next.value);
    return;
  }

  return getYielded(next.value);
}

function getStack(){
  return stack.slice();
}

function getCurrent(){
  return current;
}

function wrap(g){
  return function(){
    return walk(g,arguments,this);
  };
}
