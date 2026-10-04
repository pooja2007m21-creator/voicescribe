const list = $('list'), det = $('details');
let current = null;
async function load() {
  det.hidden = true;
  const rows = await api('/transcripts').catch(() => null);
  if (!rows) return;
  $('clearAll').hidden = !rows.length;
  list.innerHTML = rows.length ? rows.map(r => `<article class="card new"><div class="item"><div>
    <p class="prev">${esc(r.transcript.slice(0,140))}${r.transcript.length>140?'…':''}</p>
    <div class="meta">${esc(LANGS[r.language]||r.language)} · ${r.word_count} words · ${fmt(r.duration)} · ${esc(r.created_at)} UTC</div></div>
    <div class="row"><button class="btn" data-v="${r.id}">View</button><a class="btn" href="index.html?use=${r.id}">Use Again</a>
    <button class="btn danger" data-d="${r.id}">Delete</button></div></div></article>`).join('')
    : '<p class="card">No transcript history available.</p>';
}
async function del(id) {
  if (!confirm('Delete this transcript?')) return;
  await api('/transcripts/' + id, {method:'DELETE'}); toast('Transcript deleted'); load();
}
list.onclick = async e => {
  const v = e.target.dataset.v, d = e.target.dataset.d;
  if (d) return del(d);
  if (!v) return;
  current = await api('/transcripts/' + v);
  $('dLang').textContent = LANGS[current.language] || current.language; $('dDur').textContent = fmt(current.duration);
  $('dWords').textContent = current.word_count; $('dDate').textContent = current.created_at + ' UTC';
  $('dText').value = current.transcript; det.hidden = false; det.scrollIntoView({behavior:'smooth'});
};
$('dCopy').onclick = () => copyText($('dText').value);
$('dDown').onclick = () => { download($('dText').value); toast('Transcript downloaded'); };
$('dDel').onclick = () => del(current.id);
$('dEdit').onclick = () => { $('dText').focus(); toast('Edit the text below, then copy or download to keep your changes.'); };
$('clearAll').onclick = async () => {
  if (!confirm('Delete all saved transcripts? This cannot be undone.')) return;
  await api('/transcripts', {method:'DELETE'}); toast('History cleared'); load();
};
window.addEventListener('historychanged', load);
load();
