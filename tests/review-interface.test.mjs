import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {JSDOM} from 'jsdom';
import {emptyReview,validateReview} from '../dist/review.mjs';
test('real question-bank handlers save, reveal, rate, resume and escape user content',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8'),dom=new JSDOM(html,{url:'https://clearstudy.test/'}),win=dom.window,doc=win.document;
 globalThis.document=doc;globalThis.localStorage=win.localStorage;
 const {initReview,backupReview,restoreReview}=await import('../dist/review-ui.mjs');initReview(()=>{});
 const fill=(id,v)=>doc.querySelector(id).value=v,click=id=>doc.querySelector(id).click();
 fill('#card-topic','A topic');fill('#card-question','<img src=x onerror=bad()>');fill('#card-answer','A <script> tag is text.');doc.querySelector('#card-form').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(backupReview().cards.length,1);assert.equal(doc.querySelector('#card-list img'),null);assert.equal(doc.querySelector('#card-list script'),null);
 click('#due-button');assert.equal(backupReview().session.total,1);fill('#practice-attempt','My honest attempt');assert.equal(doc.querySelector('#reference-panel').hidden,true);
 click('#reveal-answer');assert.equal(doc.querySelector('#reference-panel').hidden,false);click('[data-rating="good"]');assert.equal(backupReview().session.completed,1);assert.equal(backupReview().history[0].attempt,'My honest attempt');assert.equal(backupReview().cards[0].reviews,1);assert.match(doc.querySelector('#practice-area').textContent,/reviewed/);
 const saved=backupReview();restoreReview(JSON.parse(JSON.stringify(saved)));assert.deepEqual(backupReview(),saved);assert.deepEqual(validateReview(JSON.parse(win.localStorage.getItem('clearstudy-review-v1'))),saved);
 click('#finish-session');doc.querySelector('#review-topic').value='A topic';click('#practice-button');assert.equal(backupReview().session.queue.length,1);assert.equal(backupReview().session.topic,'A topic');restoreReview(backupReview());assert.equal(doc.querySelector('#review-topic').value,'A topic');assert.equal(doc.querySelector('#review-topic').disabled,true);click('#end-session');assert.equal(backupReview().session,null);assert.equal(backupReview().history.length,1);
 fill('#timer-minutes','1');click('#timer-toggle');assert.ok(backupReview().timer.endsAt);assert.equal(backupReview().timer.durationSec,60);click('#timer-toggle');assert.equal(backupReview().timer.endsAt,null);
 fill('#timer-minutes','0');click('#timer-toggle');assert.equal(backupReview().timer.endsAt,null);
 restoreReview(emptyReview());assert.equal(backupReview().cards.length,0);
 dom.window.close();delete globalThis.document;delete globalThis.localStorage;
});
