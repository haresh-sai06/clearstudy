export function validateTopics(topics) {
  if (!Array.isArray(topics) || !topics.length || topics.length > 20) throw new Error('Add between 1 and 20 topics.');
  return topics.map((t, i) => {
    const title = String(t.title ?? '').trim();
    const importance = Number(t.importance), confidence = Number(t.confidence);
    if (!title || title.length > 120) throw new Error(`Topic ${i + 1} needs a name of 1–120 characters.`);
    if (![1, 2, 3].includes(importance) || ![1, 2, 3].includes(confidence)) throw new Error('Choose valid importance and confidence values.');
    return {id: String(t.id || `topic-${i}`), title, importance, confidence};
  });
}
export function createPlan(topics, minutes) {
  topics = validateTopics(topics); minutes = Number(minutes);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) throw new Error('Choose a whole number from 5 to 180 minutes.');
  const ranked = topics.map((t, index) => ({...t, index, score: t.importance * (4 - t.confidence)})).sort((a, b) => b.score - a.score || a.index - b.index);
  const chosen = ranked.slice(0, Math.min(ranked.length, Math.floor(minutes / 5)));
  const remaining = minutes - chosen.length * 5, total = chosen.reduce((s, t) => s + t.score, 0);
  const shares = chosen.map(t => remaining * t.score / total);
  const allocations = shares.map(n => 5 + Math.floor(n));
  let extra = minutes - allocations.reduce((a, b) => a + b, 0);
  const order = shares.map((n, i) => ({i, fraction: n - Math.floor(n)})).sort((a, b) => b.fraction - a.fraction || a.i - b.i);
  for (let i = 0; i < extra; i++) allocations[order[i].i]++;
  return {
    minutes,
    sessions: chosen.map((t, i) => ({id: t.id, title: t.title, minutes: allocations[i], reason: `Importance ${t.importance}/3 · confidence ${t.confidence}/3`, completed: false, notes: ''})),
    deferred: ranked.slice(chosen.length).map(t => t.title)
  };
}
export function validateState(value) {
  if (!value || value.version !== 1) throw new Error('This backup uses an unsupported format.');
  const topics = validateTopics(value.topics);
  const minutes = Number(value.minutes);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180) throw new Error('The saved time is invalid.');
  let plan = null;
  if (value.plan != null) {
    plan = createPlan(topics, minutes);
    if (!Array.isArray(value.plan.sessions) || value.plan.sessions.length !== plan.sessions.length) throw new Error('The saved plan is incomplete.');
    plan.sessions.forEach((s, i) => {
      const saved = value.plan.sessions[i];
      if (saved.id !== s.id || saved.minutes !== s.minutes) throw new Error('The saved plan does not match its topics.');
      if (typeof saved.completed !== 'boolean' || typeof saved.notes !== 'string' || saved.notes.length > 3000) throw new Error('The saved progress is invalid.');
      s.completed = saved.completed; s.notes = saved.notes;
    });
  }
  return {version: 1, topics, minutes, plan};
}
export function progress(plan) {
  if (!plan) return {done: 0, total: 0, minutes: 0};
  return {done: plan.sessions.filter(s => s.completed).length, total: plan.sessions.length, minutes: plan.sessions.filter(s => s.completed).reduce((n, s) => n + s.minutes, 0)};
}

// Prepare a replacement without touching the saved plan. The interface decides
// whether to commit it after the user reviews the loss of notes or completion.
export function proposePlan(current, topics, minutes) {
  const plan = createPlan(topics, minutes);
  const next = {version: 1, topics: validateTopics(topics), minutes: Number(minutes), plan};
  const sameSettings = JSON.stringify(current.topics) === JSON.stringify(next.topics) && current.minutes === next.minutes;
  if (sameSettings && current.plan) return {next: current, needsConfirmation: false, unchanged: true};
  const hasWork = current.plan?.sessions.some(s => s.completed || s.notes.trim());
  return {next, needsConfirmation: Boolean(hasWork), unchanged: false};
}
