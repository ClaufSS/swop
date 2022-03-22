
// best performing shuffler for smalest sequences
const shuffle = function(arr) {
 const len = arr.length;
 const randInt = (max) => Math.floor(Math.random() * max);
 
 for(let i=arr.length, ri, aux; i;
 	ri=randInt(--i), aux=arr[i], arr[i]=arr[ri], arr[ri]=aux);
}
