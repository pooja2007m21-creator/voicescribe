const STOP = new Set("the is a an and of to in for on at it that this with as are was be by or from i you we they he she my our your not but have has had do does will can so if then than there their its am been were would could should about into just".split(" "));
const countWords = t => (t.trim().match(/\S+/g) || []).length;

function renderAnalysis(t) {
  const w = countWords(t);
  const sent = t.split(/[.!?।]+/).filter(s => s.trim()).length;
  const para = t.split("\n").filter(s => s.trim()).length;
  const v = {aWords:w, aChars:t.length, aNoSp:t.replace(/\s/g,'').length, aSent:sent, aPara:para,
             aAvg: sent ? (w/sent).toFixed(1) : 0, aRead: fmt(Math.round(w/200*60))};
  for (const k in v) $(k).textContent = v[k];
  const counts = {};
  (t.toLowerCase().match(/[\p{L}\p{M}\p{N}']+/gu) || []).forEach(x => { if (x.length > 2 && !STOP.has(x)) counts[x] = (counts[x]||0) + 1; });
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,10);
  $('keywords').innerHTML = top.length ? top.map(([k,c]) => `<span class="tag">${esc(k)} (${c})</span>`).join('') : '<span class="note">No keywords yet.</span>';
}
