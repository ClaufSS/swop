
// best performing shuffler for smalest sequences
const shuffle = ( arr, ignore=[] ) => {
  // Note: ignore -- implement to ignore items
  const randInt = max => Math.floor(Math.random() * max);
  
  // ri -- randomic index
  // aux -- auxiliar variable
  for(let i = arr.length, ri, aux; i; ri = randInt(--i), aux = arr[i], arr[i] = arr[ri], arr[ri] = aux);

  return arr;
}


const range = function( s, e, steps=1 ) {
  // NOTE: steps not implemented
  if (!isNum(s) || !isNum(steps)) return
  
  if (!isNum(e)) {
    if (e === undefined) [s, e] = [0, s];
    else return;
  }

  const _range = [];

  for (let i = --e - s + 1; i; i -= 1, _range[i] = s + i);

  return _range;
}


const clearArray = ( arr, onDeleting ) => {
  switch (typeof onDeleting) {
    case 'function':
      for (let i = arr.length; i; --i, onDeleting(arr[i]), arr.pop());
        break;

    default:
      for (let i = arr.length; i; --i, arr.pop());
  }
}


const metricValidation = function(value) {
  let result = null;

  switch (typeof value) {
    case 'number':
      result = `${value}px`;
      break;
    case 'string':
      // implement string analize in the future
      result = value;
  }

  return result;
}


const isFun = foo => {
  return typeof foo === 'function'
}


const isNum = num => {
  return typeof num === 'number'
}


(function() {
  const provisoryAt = function (index) {
    const len = this.length;
    
    if (index < 0) {
      if ((len + index) < len) {
        return this[len + index];
      }
    } else {
      if (index < len) return this[index];
    }
  }

  Array.prototype.at = Array.prototype.at || provisoryAt;
  String.prototype.at = String.prototype.at || provisoryAt;
})();
