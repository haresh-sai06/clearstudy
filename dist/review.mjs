// Pure domain functions. Ratings are self-reports, not automatic assessment.
export const DAY=86400000;
const text=(value,max,label)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw new Error(`${label} is missing or too long.`);return value.trim();};
const num=(v,min,max,label)=>{if(!Number.isFinite(v)||v<min||v>max)throw new Error(`Invalid ${label}.`);return v;};
export function emptyReview(){return {version:1,cards:[],history:[],session:null,timer:{durationSec:1500,remainingSec:1500,endsAt:null}};}
export function validateCard(value){
 if(!value||typeof value!=='object')throw new Error('Invalid question.');
 const id=text(value.id,100,'Question ID');
 return {id,topic:text(value.topic,120,'Topic'),question:text(value.question,1500,'Question'),answer:text(value.answer,4000,'Answer'),intervalDays:num(value.intervalDays??0,0,365,'review interval'),dueAt:num(value.dueAt??0,0,8640000000000000,'review date'),reviews:num(value.reviews??0,0,1000000,'review count'),lastRating:value.lastRating??null};
}
export function validateReview(value){
 if(!value||value.version!==1||!Array.isArray(value.cards)||value.cards.length>500||!Array.isArray(value.history)||value.history.length>500)throw new Error('Invalid question-bank backup.');
 const cards=value.cards.map(validateCard),ids=new Set(cards.map(c=>c.id));
 if(ids.size!==cards.length||cards.some(c=>c.lastRating!==null&&!['again','hard','good','easy'].includes(c.lastRating)||!Number.isInteger(c.reviews)))throw new Error('Duplicate question IDs or invalid review ratings.');
 const history=value.history.map(h=>{
  if(!h||!['again','hard','good','easy'].includes(h.rating)||typeof h.attempt!=='string'||h.attempt.length>4000)throw new Error('Invalid review history.');
  return {id:text(h.id,100,'History ID'),cardId:text(h.cardId,100,'Question ID'),topic:text(h.topic,120,'Topic'),rating:h.rating,at:num(h.at,0,8640000000000000,'review date'),attempt:h.attempt};
 });
 const t=value.timer;
 if(!t||!Number.isInteger(t.durationSec)||t.durationSec%60||t.durationSec<60||t.durationSec>10800)throw new Error('Invalid focus timer.');
 const timer={durationSec:t.durationSec,remainingSec:num(t.remainingSec,0,t.durationSec,'remaining time'),endsAt:t.endsAt===null?null:num(t.endsAt,0,8640000000000000,'timer deadline')};
 let session=null;
 if(value.session){
  const s=value.session;
  if(!Array.isArray(s.queue)||s.queue.length>500||new Set(s.queue).size!==s.queue.length||s.queue.some(id=>!ids.has(id))||!Number.isInteger(s.completed)||s.completed<0||s.completed>500||!Number.isInteger(s.total)||s.total<s.completed+s.queue.length||s.total>500)throw new Error('Invalid practice session.');
  if(typeof(s.attempt??'')!=='string'||(s.attempt??'').length>4000)throw new Error('Invalid draft answer.');
  const topic=s.topic??'';if(typeof topic!=='string'||topic.length>120||topic&&s.queue.some(id=>cards.find(c=>c.id===id)?.topic!==topic))throw new Error('Invalid session topic.');
  session={queue:[...s.queue],completed:s.completed,total:s.total,startedAt:num(s.startedAt,0,8640000000000000,'session date'),attempt:s.attempt??'',topic};
 }
 return {version:1,cards,history,session,timer};
}
export function dueCards(state,now=Date.now(),all=false,topic=''){
 return state.cards.filter(c=>(all||c.dueAt<=now)&&(!topic||c.topic===topic)).sort((a,b)=>a.dueAt-b.dueAt||a.reviews-b.reviews);
}
export function rateCard(card,rating,now=Date.now()){
 if(!['again','hard','good','easy'].includes(rating))throw new Error('Choose a recall rating.');
 const previous=validateCard(card);
 let days=0;
 if(rating==='hard')days=1;
 if(rating==='good')days=Math.min(365,Math.max(1,Math.round(previous.intervalDays*2)));
 if(rating==='easy')days=Math.min(365,Math.max(3,Math.round(previous.intervalDays*3)));
 return {...previous,intervalDays:days,dueAt:now+(rating==='again'?600000:days*DAY),reviews:previous.reviews+1,lastRating:rating};
}
export function timerRemaining(timer,now=Date.now()){
 return Math.max(0,Math.min(timer.durationSec,timer.endsAt===null?timer.remainingSec:Math.ceil((timer.endsAt-now)/1000)));
}
export function pauseTimer(timer,now=Date.now()){return {...timer,remainingSec:timerRemaining(timer,now),endsAt:null};}
export function startTimer(timer,now=Date.now()){const remaining=timerRemaining(timer,now)||timer.durationSec;return {...timer,remainingSec:remaining,endsAt:now+remaining*1000};}
export function summarize(state,now=Date.now()){
 const start=new Date(now);start.setHours(0,0,0,0);
 const today=state.history.filter(h=>h.at>=start.getTime()&&h.at<=now),due=dueCards(state,now);
 return {total:state.cards.length,due:due.length,reviewedToday:today.length,needsPractice:state.cards.filter(c=>c.lastRating==='again'||c.lastRating==='hard').length,recallToday:today.length?Math.round(100*today.filter(h=>h.rating==='good'||h.rating==='easy').length/today.length):null};
}
export function parseCSV(input){
 if(typeof input!=='string'||input.length>3000000)throw new Error('Choose a CSV smaller than 3 MB.');
 const rows=[];let row=[],field='',quoted=false;
 for(let i=0;i<input.length;i++){
  const c=input[i];
  if(c==='"'){
   if(quoted&&input[i+1]==='"'){field+='"';i++;}
   else if(quoted){quoted=false;if(input[i+1]&&!['\r','\n',','].includes(input[i+1]))throw new Error('Unexpected text after a quoted CSV field.');}
   else if(field==='')quoted=true;
   else throw new Error('Quote CSV fields that contain quote marks.');
  }else if(c===','&&!quoted){row.push(field);field='';}
  else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&input[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}
  else field+=c;
  if(rows.length>501)throw new Error('Import at most 500 questions.');
 }
 if(quoted)throw new Error('A quoted CSV field was not closed.');
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 const header=rows.shift()?.map(v=>v.trim().replace(/^\uFEFF/,'').toLowerCase());
 if(!header||header.join(',')!=='topic,question,answer')throw new Error('The CSV header must be topic,question,answer.');
 if(!rows.length||rows.length>500)throw new Error('Import between 1 and 500 questions.');
 return rows.map((r,i)=>{if(r.length!==3)throw new Error(`CSV row ${i+2} must have three fields.`);return validateCard({id:`import-${i}`,topic:r[0],question:r[1],answer:r[2]});});
}
export function mergeCards(existing,incoming,makeId){
 const result=existing.map(c=>({...c}));let added=0,skipped=0;
 for(const raw of incoming){
  const card=validateCard(raw);
  if(result.some(c=>c.topic.toLowerCase()===card.topic.toLowerCase()&&c.question.toLowerCase()===card.question.toLowerCase())){skipped++;continue;}
  if(result.length===500)throw new Error('The question bank can hold 500 questions. Nothing was imported.');
  result.push({...card,id:makeId()});added++;
 }
 return {cards:result,added,skipped};
}
export function sessionReport(state,feedback={},now=Date.now()){
 state=validateReview(state);
 const clean=(name,max=1000)=>{const v=feedback[name]??'';if(typeof v!=='string'||v.length>max)throw new Error('Keep session feedback within its text limit.');return v.trim();};
 const ratings={again:0,hard:0,good:0,easy:0};state.history.forEach(h=>ratings[h.rating]++);
 return {format:'clearstudy-session-report',version:1,appVersion:'0.3.0',generatedAt:new Date(now).toISOString(),automatic:{questions:state.cards.length,dueNow:dueCards(state,now).length,retainedAttempts:state.history.length,ratings,currentSession:state.session?{startedAt:new Date(state.session.startedAt).toISOString(),reviewed:state.session.completed,total:state.session.total,remaining:state.session.queue.length}:null,focusTimer:{minutes:state.timer.durationSec/60,remainingSeconds:timerRemaining(state.timer,now)}},selfReported:{device:clean('device',120),browser:clean('browser',120),experience:clean('experience',80),feedback:clean('feedback')},privacy:'Question text, reference answers, written attempts and topic names are excluded. Free-text feedback contains only what the tester chooses to write.',evidenceType:'Local session record; self-reports are not independently verified; no learning-outcome inference.'};
}
