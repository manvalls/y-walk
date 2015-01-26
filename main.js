var Resolver = require('y-resolver'),
    Su = require('vz.rand').Su,
    
    after = Su(),
    before = Su(),
    
    stack = [],
    prevStack = stack,
    walk;

// Main

walk = module.exports = function(generator,args,thisArg){
  try{ return walkIt(generator,args,thisArg,stack); }
  catch(e){
    stack = prevStack;
    return Resolver.reject(e);
  }
};

function listener(iterator,prevYd,resolver){
  
  try{ squeeze(iterator,prevYd,resolver); }
  catch(e){
    stack = prevStack;
    resolver.reject(e);
  }
  
}

function squeeze(iterator,prevYd,resolver,s){
  var result,res;
  
  while(true){
    if(!prevYd.done) return prevYd.listen(listener,[iterator,prevYd,resolver]);
    
    if(prevYd[before]) while(res = prevYd[before].shift()) res.accept();
    
    prevStack = stack;
    stack = s;
    
    if(prevYd.accepted) result = iterator.next(prevYd.value);
    else result = iterator.throw(prevYd.error);
    
    stack = prevStack;
    
    if(prevYd[after]) while(res = prevYd[after].shift()) res.accept();
    
    if(result.done) return resolver.accept(result.value);
    prevYd = result.value.yielded || result.value;
  }
  
}

function walkIt(generator,args,thisArg,s){
  var it,
      result,
      resolver;
  
  prevStack = stack;
  stack = s;
  
  it = generator.apply(thisArg || this,args);
  
  if(it && it.next && it.throw) result = it.next();
  else{
    stack = prevStack;
    return Resolver.accept(it);
  }
  
  stack = prevStack;
  
  if(result.done) return Resolver.accept(result.value);
  
  resolver = new Resolver();
  squeeze(it,result.value.yielded || result.value,resolver,s);
  
  return resolver.yielded;
}

// Aux

walk.trace = function(id,generator,args,thisArg){
  var s = stack.slice();
  s.push(id);
  
  try{ return walkIt(generator,args,thisArg,s); }
  catch(e){
    stack = prevStack;
    return Resolver.reject(e);
  }
};

walk.getStack = function(){
  return stack.slice();
};

walk.wrap = function(generator){
  return function(){
    return walk(generator,arguments,this);
  };
};

walk.after = function(yd,resolver){
  resolver = resolver || new Resolver();
  
  yd[after] = yd[after] || [];
  yd[after].push(resolver);
  
  return resolver.yielded;
};

walk.before = function(yd,resolver){
  resolver = resolver || new Resolver();
  
  yd[before] = yd[before] || [];
  yd[before].push(resolver);
  
  return resolver.yielded;
};

