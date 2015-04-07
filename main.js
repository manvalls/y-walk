var Resolver = require('y-resolver'),
    Su = require('u-su'),
    
    stack = [],
    toYd = Resolver.toYielded,
    isYd = Resolver.isYielded,
    
    walk;

// Main

function getYielded(obj){
  
  while(!(obj && obj[isYd])){
    if(obj instanceof Object && obj[toYd]) obj = obj[toYd]();
    else return Resolver.accept(obj);
  }
  
  return obj;
}

walk = module.exports = function(generator,args,thisArg){
  return walkIt(generator,args,thisArg,stack);
};

function squeeze(iterator,prevYd,resolver,s){
  var result,res,error,prevStack;
  
  while(true){
    
    if(!prevYd.done){
      prevYd.listen(squeeze,[iterator,prevYd,resolver,s]);
      return;
    }
    
    prevStack = stack;
    stack = s;
    
    try{
      if(prevYd.accepted) result = iterator.next(prevYd.value);
      else result = iterator.throw(prevYd.error);
    }catch(e){ error = e; }
    
    stack = prevStack;
    
    if(error) return resolver.reject(error);
    if(result.done) return resolver.accept(result.value);
    
    try{ prevYd = getYielded(result.value); }
    catch(e){ return resolver.reject(e); }
  }
  
}

function walkIt(generator,args,thisArg,s){
  var it,result,resolver,prevYd,res,error,prevStack;
  
  prevStack = stack;
  stack = s;
  
  try{ it = generator.apply(thisArg || this,args); }
  catch(e){
    stack = prevStack;
    return Resolver.reject(e);
  }
  
  if(!(it && it.next && it.throw)){
    stack = prevStack;
    return Resolver.accept(it);
  }
  
  try{ result = it.next(); }
  catch(e){ error = e; }
  
  stack = prevStack;
  
  if(error) return Resolver.reject(error);
  if(result.done) return Resolver.accept(result.value);
  
  try{ prevYd = getYielded(result.value); }
  catch(e){ return Resolver.reject(e); }
  
  resolver = new Resolver();
  squeeze(it,prevYd,resolver,s);
  
  return resolver.yielded;
}

// Aux

walk.trace = function(id,generator,args,thisArg){
  var s = stack.slice();
  s.push(id);
  
  return walkIt(generator,args,thisArg,s);
};

walk.getStack = function(){
  return stack.slice();
};

walk.wrap = function(generator){
  return function(){
    return walk(generator,arguments,this);
  };
};

require('./main/proto.js');
