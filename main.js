var Resolver = require('y-resolver'),
    Su = require('u-su'),
    
    after = Su(),
    before = Su(),
    
    toYielded = Su(),
    
    stack = [],
    prevStack = stack,
    walk;

// Main

function getYielded(obj){
  
  while(!(obj instanceof Resolver.Yielded)){
    if(obj != null && obj[toYielded]) obj = obj[toYielded]();
    else return Resolver.accept(obj);
  }
  
  return obj;
}

walk = module.exports = function(generator,args,thisArg){
  try{ return walkIt(generator,args,thisArg,stack); }
  catch(e){
    stack = prevStack;
    return Resolver.reject(e);
  }
};

function listener(iterator,prevYd,resolver,s){
  
  try{ squeeze(iterator,prevYd,resolver,s,true); }
  catch(e){
    stack = prevStack;
    resolver.reject(e);
  }
  
}

function squeeze(iterator,prevYd,resolver,s,fl){
  var result,res;
  
  while(true){
    
    if(!prevYd.done){
      prevYd.listen(listener,[iterator,prevYd,resolver,s]);
      
      if(prevYd[before]){
        res = prevYd[before];
        delete prevYd[before];
        res.accept();
      }
      
      return;
    }else if(!fl && prevYd[before]){
      res = prevYd[before];
      delete prevYd[before];
      res.accept();
    }
    
    fl = false;
    
    prevStack = stack;
    stack = s;
    
    if(prevYd.accepted) result = iterator.next(prevYd.value);
    else result = iterator.throw(prevYd.error);
    
    stack = prevStack;
    
    if(prevYd[after] && !prevYd.listeners){
      res = prevYd[after];
      delete prevYd[after];
      res.accept();
    }
    
    if(result.done) return resolver.accept(result.value);
    prevYd = getYielded(result.value);
  }
  
}

function walkIt(generator,args,thisArg,s){
  var it,result,resolver,prevYd,res;
  
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
  prevYd = getYielded(result.value);
  
  squeeze(it,prevYd,resolver,s);
  
  return resolver.yielded;
}

// Aux

walk.toYielded = toYielded;

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

walk.after = function(yd){
  yd[after] = yd[after] || new Resolver();
  return yd[after].yielded;
};

walk.before = function(yd){
  yd[before] = yd[before] || new Resolver();
  return yd[before].yielded;
};

require('./main/proto.js');
