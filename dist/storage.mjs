// Detect a stale tab before overwriting another tab's saved snapshot.
export function createStore(storage,key){
 let seen=storage.getItem(key);
 return {
  read:()=>seen,
  write(value,{replace=false}={}){
   if(!replace&&storage.getItem(key)!==seen)throw new Error('Another tab saved changes. Download a backup of this tab, then reload before saving again.');
   const serialized=JSON.stringify(value);storage.setItem(key,serialized);seen=serialized;
  },
  changed:()=>storage.getItem(key)!==seen
 };
}
