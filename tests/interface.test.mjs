import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createPlan,validateTopics} from '../dist/core.mjs';

const topics=validateTopics([{id:'a',title:'Topic A',importance:3,confidence:1},{id:'b',title:'Topic B',importance:2,confidence:2}]);
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('actual page handlers preserve saved work until replacement is approved',async()=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://clearstudy.test/'});
  const {window}=dom, doc=window.document, storage=window.localStorage;
  const initial={version:1,topics,minutes:45,plan:createPlan(topics,45)};
  initial.plan.sessions[0].completed=true;initial.plan.sessions[0].notes='A saved explanation';
  const before=JSON.stringify(initial);storage.setItem('clearstudy-v1',before);
  globalThis.document=doc;globalThis.localStorage=storage;
  // jsdom has no visual modal UI. Emulate only opening/closing; the real app's
  // event handlers, saved data and DOM updates are exercised unchanged.
  const dialog=doc.querySelector('#replace-dialog');
  dialog.showModal=function(){this.open=true;};
  dialog.close=function(value){this.returnValue=value;this.open=false;this.dispatchEvent(new window.Event('close'));};
  await import('../dist/app.mjs');
  const input=doc.querySelector('#minutes');input.value='30';
  input.dispatchEvent(new window.Event('change',{bubbles:true}));
  assert.equal(storage.getItem('clearstudy-v1'),before);
  assert.equal(doc.querySelector('#notes-0').value,'A saved explanation');
  const submit=()=>doc.querySelector('#planner').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  submit();assert.equal(dialog.open,true);assert.match(doc.querySelector('#replace-message').textContent,/clears.*notes/);
  dialog.close('cancel');await tick();assert.equal(storage.getItem('clearstudy-v1'),before);
  assert.equal(doc.querySelector('#notes-0').value,'A saved explanation');
  submit();dialog.close('replace');await tick();
  const saved=JSON.parse(storage.getItem('clearstudy-v1'));assert.equal(saved.minutes,30);
  assert.equal(saved.plan.sessions[0].completed,false);assert.equal(saved.plan.sessions[0].notes,'');
  doc.querySelector('#notes-0').value='New reminder';
  doc.querySelector('#notes-0').dispatchEvent(new window.Event('input',{bubbles:true}));
  const unchanged=storage.getItem('clearstudy-v1');submit();await tick();
  assert.equal(dialog.open,false);assert.equal(storage.getItem('clearstudy-v1'),unchanged);
  doc.querySelector('[data-remove="0"]').click();
  assert.equal(storage.getItem('clearstudy-v1'),unchanged);
  assert.equal(doc.querySelector('#notes-0').value,'New reminder');
  // Invalid backup is rejected before opening the replacement review.
  const upload=doc.querySelector('#import');
  Object.defineProperty(upload,'files',{value:[{size:10,text:async()=>'{broken'}],configurable:true});
  upload.dispatchEvent(new window.Event('change'));await tick();
  assert.equal(storage.getItem('clearstudy-v1'),unchanged);assert.match(doc.querySelector('#message').textContent,/not restored/);
  // A valid import must also be approved before replacing saved work.
  Object.defineProperty(upload,'files',{value:[{size:before.length,text:async()=>before}],configurable:true});
  upload.dispatchEvent(new window.Event('change'));await tick();assert.equal(dialog.open,true);
  dialog.close('cancel');await tick();assert.equal(storage.getItem('clearstudy-v1'),unchanged);
  dom.window.close();delete globalThis.document;delete globalThis.localStorage;
});
