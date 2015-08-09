var Resolver = require('y-resolver'),
    Writable = require('stream').Writable,

    resolver = Symbol(),

    toYd = Resolver.toYielded;

if(!Writable.prototype[toYd]){

  Object.defineProperty(Writable.prototype,toYd,{writable: true,value: module.exports = function(){

    if(!this[resolver]){
      this[resolver] = new Resolver();

      this.once('error',onceError);
      this.once('finish',onceFinish);
    }

    return this[resolver].yielded;
  }});

  function onceError(e){
    this.removeListener('finish',onceFinish);
    this[resolver].reject(e);
  }

  function onceFinish(){
    this.removeListener('error',onceError);
    this[resolver].accept();
  }

}
