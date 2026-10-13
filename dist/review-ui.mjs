import {emptyReview,validateReview,validateCard,dueCards,rateCard,summarize,parseCSV,mergeCards,timerRemaining,pauseTimer,startTimer} from './review.mjs';
const key='clearstudy-review-v1',$=s=>document.querySelector(s),win=document.defaultView,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=emptyReview(),editing=null,revealed=false,notice,interval;
function persist(){try{localStorage.setItem(key,JSON.stringify(state));return true;}catch{notice('Browser storage is unavailable. Download a full backup before leaving.');return false;}}
export function backupReview(){return validateReview(state);}
export function restoreReview(value){state=validateReview(value);revealed=false;editing=null;const saved=persist();render();return saved;}
export function reviewPlannedTopic(topic,minutes){
 const match=state.cards.some(c=>c.topic.toLowerCase()===topic.toLowerCase());
 if(!match){activate('bank');$('#card-topic').value=topic;message('Add questions for this topic, then open Study room to practise them.');$('#card-question').focus();return;}
 $('#review-topic').value=state.cards.find(c=>c.topic.toLowerCase()===topic.toLowerCase()).topic;
 if(state.timer.endsAt===null){state.timer={durationSec:minutes*60,remainingSec:minutes*60,endsAt:null};persist();}
 start(true);
}
function message(text){$('#review-message').textContent=text;}
function commit(text){const saved=persist();render();if(saved)message(text);}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();win.setTimeout(()=>URL.revokeObjectURL(url),1000);}
function activate(view){document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));document.querySelectorAll('[data-screen]').forEach(s=>s.hidden=s.dataset.screen!==view);$('#review-message').textContent='';}
function stats(){const n=summarize(state);$('#stat-cards').textContent=n.total;$('#stat-due').textContent=n.due;$('#stat-today').textContent=n.reviewedToday;$('#stat-recall').textContent=n.recallToday===null?'—':`${n.recallToday}%`;$('#recall-caption').textContent=n.reviewedToday?'Self-rated good or easy today':'No recall ratings today';$('#bank-count').textContent=`${n.total} / 500 questions`;$('#due-button').disabled=!dueCards(state,Date.now(),false,$('#review-topic').value).length;$('#practice-button').disabled=!dueCards(state,Date.now(),true,$('#review-topic').value).length;
 const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const end=new Date(d);end.setDate(end.getDate()+1);days.push({label:d.toLocaleDateString(undefined,{weekday:'short'}),count:state.history.filter(h=>h.at>=d.getTime()&&h.at<end.getTime()).length});}
 const max=Math.max(1,...days.map(d=>d.count));$('#activity').innerHTML=days.map(d=>`<div class="activity-day"><span class="bar-number">${d.count}</span><div class="bar-track"><span style="height:${Math.max(2,100*d.count/max)}%"></span></div><span>${esc(d.label)}</span></div>`).join('');
 $('#weak-topics').innerHTML=state.cards.filter(c=>['again','hard'].includes(c.lastRating)).slice(0,5).map(c=>`<li><span>${esc(c.topic)}</span><small>${esc(c.question)}</small></li>`).join('')||'<li class="hint">Questions rated Again or Hard will appear here.</li>';
}
function library(){const q=$('#bank-search').value.trim().toLowerCase(),cards=state.cards.filter(c=>`${c.topic} ${c.question} ${c.answer}`.toLowerCase().includes(q));$('#card-list').innerHTML=cards.map(c=>`<article class="bank-card"><div class="card-meta"><span class="tag">${esc(c.topic)}</span><span>${c.reviews?`${c.reviews} reviews`:'New question'}</span></div><h3>${esc(c.question)}</h3><details><summary>Reference answer</summary><p class="answer-text">${esc(c.answer)}</p></details><div class="card-footer"><span>${c.dueAt<=Date.now()?'Ready to review':`Next: ${esc(new Date(c.dueAt).toLocaleDateString())}`}</span><button data-edit="${esc(c.id)}" type="button">Edit question</button></div></article>`).join('')||'<div class="empty bank-empty"><h3>No questions here yet</h3><p>Add your first question, import a CSV, or try the sample deck.</p></div>';$('#search-count').textContent=q?`${cards.length} matching questions`:'';}
function topics(){const select=$('#review-topic'),old=select.value;select.innerHTML='<option value="">All topics</option>'+[...new Set(state.cards.map(c=>c.topic))].sort().map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');if([...select.options].some(o=>o.value===old))select.value=old;}
function session(){const run=state.session,area=$('#practice-area');$('#end-session').hidden=!run?.queue.length;
 if(!run){area.innerHTML='<div class="practice-empty"><span class="empty-icon">↗</span><h3>Learn by trying to remember.</h3><p>Start with the questions due today, or practise the whole bank. Write your answer before you reveal the reference.</p></div>';return;}
 const card=state.cards.find(c=>c.id===run.queue[0]);
 if(!card){area.innerHTML=`<div class="practice-empty"><span class="empty-icon">✓</span><p class="eyebrow">SESSION COMPLETE</p><h3>${run.completed} question${run.completed===1?'':'s'} reviewed.</h3><p>Your next review dates are saved. Questions rated Again return in ten minutes.</p><button id="finish-session" type="button">Back to review queue</button></div>`;return;}
 area.innerHTML=`<div class="practice-top"><span class="tag">${esc(card.topic)}</span><span>${run.completed+1} of ${run.total}</span></div><progress aria-label="Practice session progress" value="${run.completed}" max="${run.total}"></progress><h3 class="practice-question">${esc(card.question)}</h3><label for="practice-attempt">Your answer from memory<textarea id="practice-attempt" maxlength="4000" placeholder="Try a short explanation before revealing the answer.">${esc(run.attempt||'')}</textarea></label><button type="button" class="primary" id="reveal-answer">Reveal reference answer <span aria-hidden="true">↓</span></button><div id="reference-panel" hidden><p class="eyebrow">COMPARE WITH YOUR ANSWER</p><div class="reference-answer">${esc(card.answer)}</div><p class="hint">How well did you remember? You choose the rating; this app does not mark your answer.</p><div class="rating-grid"><button data-rating="again"><strong>Again</strong><small>10 min</small></button><button data-rating="hard"><strong>Hard</strong><small>1 day</small></button><button data-rating="good"><strong>Good</strong><small>Longer gap</small></button><button data-rating="easy"><strong>Easy</strong><small>Longest gap</small></button></div></div>`;
 revealed=false;
}
function clock(){const remaining=timerRemaining(state.timer);$('#timer-clock').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;$('#timer-toggle').textContent=state.timer.endsAt===null?'Start focus timer':'Pause focus timer';$('#timer-minutes').disabled=state.timer.endsAt!==null;$('#timer-state').textContent=remaining===0?'Focus block complete. Take a short break.':state.timer.endsAt===null?'Ready when you are.':'Focus time is running.';if(state.timer.endsAt!==null&&remaining===0){state.timer=pauseTimer(state.timer);persist();$('#timer-state').textContent='Focus block complete. Take a short break.';$('#timer-toggle').textContent='Start focus timer';$('#timer-minutes').disabled=false;message('Focus block complete. Your practice progress is saved.');}}
function render(){topics();stats();library();session();$('#timer-minutes').value=state.timer.durationSec/60;clock();}
function start(all){if(state.session?.queue.length){activate('study');message('Your unfinished session is ready to continue.');return;}
 const queue=dueCards(state,Date.now(),all,$('#review-topic').value).map(c=>c.id);if(!queue.length)return;
 state.session={queue,completed:0,total:queue.length,startedAt:Date.now(),attempt:''};activate('study');commit('Practice session started. Try your answer before revealing the reference.');$('#practice-attempt')?.focus();}
export function initReview(globalNotice){
 notice=globalNotice;if(!$('#card-form'))return;
 try{const saved=localStorage.getItem(key);if(saved)state=validateReview(JSON.parse(saved));}catch{message('Your question bank could not be loaded. Restore a backup before adding new work.');}
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.view)));
 $('#open-backup').addEventListener('click',()=>{activate('plan');document.querySelector('details.backup').open=true;$('#export').focus();});
 $('#card-form').addEventListener('submit',e=>{e.preventDefault();try{
  if(state.session?.queue.length)throw new Error('Finish the active practice session before changing questions. Your draft is kept.');
  const prior=state.cards.find(c=>c.id===editing);let card=validateCard({...prior,id:editing||crypto.randomUUID(),topic:$('#card-topic').value,question:$('#card-question').value,answer:$('#card-answer').value});
  if(prior&&(prior.question!==card.question||prior.answer!==card.answer||prior.topic!==card.topic))card={...card,intervalDays:0,dueAt:0,reviews:0,lastRating:null};
  if(state.cards.some(c=>c.id!==card.id&&c.topic.toLowerCase()===card.topic.toLowerCase()&&c.question.toLowerCase()===card.question.toLowerCase()))throw new Error('This topic and question already exist. Edit the existing card instead.');
  if(prior){state.cards=state.cards.map(c=>c.id===editing?card:c);}else{if(state.cards.length===500)throw new Error('The bank is full. Export a backup before starting another bank.');state.cards.push(card);}
  $('#card-form').reset();editing=null;$('#card-save').textContent='Save question';$('#cancel-edit').hidden=true;commit('Question saved. Its answer stays in this browser.');
 }catch(err){message(err.message);}});
 $('#card-list').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(!b)return;const c=state.cards.find(c=>c.id===b.dataset.edit);editing=c.id;$('#card-topic').value=c.topic;$('#card-question').value=c.question;$('#card-answer').value=c.answer;$('#card-save').textContent='Save changes';$('#cancel-edit').hidden=false;$('#card-question').focus();});
 $('#cancel-edit').addEventListener('click',()=>{editing=null;$('#card-form').reset();$('#card-save').textContent='Save question';$('#cancel-edit').hidden=true;message('Question edits cancelled.');});
 $('#bank-search').addEventListener('input',library);
 $('#csv-import').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{
  if(state.session?.queue.length)throw new Error('Finish the practice session before importing questions.');
  if(file.size>3000000)throw new Error('Choose a CSV smaller than 3 MB.');const result=mergeCards(state.cards,parseCSV(await file.text()),()=>crypto.randomUUID());state.cards=result.cards;commit(`${result.added} questions imported; ${result.skipped} duplicates skipped.`);
 }catch(err){message(`Import failed: ${err.message}`);}finally{e.target.value='';}});
 $('#csv-template').addEventListener('click',()=>download('clearstudy-questions-template.csv','topic,question,answer\nComputing,What is a variable?,A named place to store a value.\n','text/csv'));
 $('#sample-deck').addEventListener('click',()=>{try{
  if(state.session?.queue.length)throw new Error('Finish the active session before adding sample questions.');
  const raw=[['What is a variable?','A variable gives a name to a value so a program can use or change it.'],['What does a function do?','A function groups a set of steps. You can call it whenever those steps are needed.'],['Why do we test software?','Tests check whether software behaves as expected. They help us find mistakes when we change the code.'],['What is an array?','An array stores a sequence of values. Each value can be accessed by its position.'],['What is a backup?','A backup is another copy of your data. You can use it to recover work if the original is lost.']].map((x,i)=>({id:`sample-${i}`,topic:'Computing basics',question:x[0],answer:x[1]}));
  const result=mergeCards(state.cards,raw,()=>crypto.randomUUID());state.cards=result.cards;commit(`${result.added} sample questions added; ${result.skipped} duplicates skipped.`);
 }catch(err){message(err.message);}});
 $('#due-button').addEventListener('click',()=>start(false));$('#practice-button').addEventListener('click',()=>start(true));$('#review-topic').addEventListener('change',stats);
 $('#end-session').addEventListener('click',()=>{const count=state.session?.completed||0;state.session=null;commit(`Session finished early. ${count} recall ratings are saved; unreviewed questions remain ready.`);});
 $('#practice-area').addEventListener('click',e=>{
  if(e.target.closest('#reveal-answer')){$('#reference-panel').hidden=false;$('#reveal-answer').hidden=true;revealed=true;$('#reference-panel').querySelector('button').focus();return;}
  if(e.target.closest('#finish-session')){state.session=null;commit('Session saved. Choose another set when ready.');return;}
  const b=e.target.closest('[data-rating]');if(!b||!revealed||!state.session?.queue.length)return;
  const card=state.cards.find(c=>c.id===state.session.queue[0]),rating=b.dataset.rating,now=Date.now();state.cards=state.cards.map(c=>c.id===card.id?rateCard(c,rating,now):c);
  state.history.push({id:crypto.randomUUID(),cardId:card.id,topic:card.topic,rating,at:now,attempt:$('#practice-attempt').value});state.history=state.history.slice(-500);state.session.queue.shift();state.session.completed++;state.session.attempt='';commit('Recall rating saved. Your next review is scheduled.');$('#practice-attempt')?.focus();
 });
 $('#timer-toggle').addEventListener('click',()=>{if(state.timer.endsAt===null){const n=Number($('#timer-minutes').value);if(!Number.isInteger(n)||n<1||n>180){message('Choose 1–180 whole minutes before starting.');return;}if(n*60!==state.timer.durationSec)state.timer={durationSec:n*60,remainingSec:n*60,endsAt:null};state.timer=startTimer(state.timer);}else{state.timer=pauseTimer(state.timer);}persist();clock();});
 $('#practice-area').addEventListener('input',e=>{if(e.target.id==='practice-attempt'&&state.session){state.session.attempt=e.target.value;persist();}});
 $('#timer-minutes').addEventListener('change',()=>{const n=Number($('#timer-minutes').value);if(!Number.isInteger(n)||n<1||n>180){message('Choose 1–180 whole minutes for the focus timer.');$('#timer-minutes').value=state.timer.durationSec/60;return;}state.timer={durationSec:n*60,remainingSec:n*60,endsAt:null};persist();clock();});
 $('#timer-reset').addEventListener('click',()=>{state.timer={...state.timer,remainingSec:state.timer.durationSec,endsAt:null};persist();clock();});
 document.querySelectorAll('[data-open-bank]').forEach(b=>b.addEventListener('click',()=>{activate('bank');$('#card-topic').focus();}));
 render();interval=win.setInterval(()=>{clock();stats();},1000);win.addEventListener('pagehide',()=>win.clearInterval(interval),{once:true});
 if(state.session?.queue.length)message('An unfinished practice session is saved. Open Study room to continue.');
}
