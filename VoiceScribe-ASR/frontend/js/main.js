const $ = id => document.getElementById(id);
const LANGS = {'en-IN':'English (India)','en-US':'English (US)','en-GB':'English (UK)','ta-IN':'Tamil','hi-IN':'Hindi','te-IN':'Telugu','ml-IN':'Malayalam','kn-IN':'Kannada'};
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = s => String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
const get = (k,d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } };
const put = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const langOptions = sel => Object.entries(LANGS).map(([c,n]) => `<option value="${c}"${c===sel?' selected':''}>${n}</option>`).join('');

function toast(msg, type='ok') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.textContent = msg;
  $('toasts').appendChild(t);
  setTimeout(() => t.remove(), 4000);
}
async function api(path, opt={}) {
  try {
    const r = await fetch('/api' + path, {headers:{'Content-Type':'application/json'}, ...opt});
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Request failed.');
    return d;
  } catch (e) { toast(e.message === 'Failed to fetch' ? 'Cannot reach the server. Is Flask running?' : e.message, 'err'); throw e; }
}
function download(text, name='voicescribe-transcript.txt') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  toast('Transcript copied successfully.');
}
function applyTheme() { document.documentElement.dataset.theme = get('dark', false) ? 'dark' : 'light'; if ($('themeBtn')) $('themeBtn').textContent = get('dark', false) ? '☀️ Light' : '🌙 Dark'; }

const page = location.pathname.split('/').pop() || 'index.html';
const nl = (h, t) => `<a href="${h}"${page===h?' class="cur" aria-current="page"':''}>${t}</a>`;
$('hdr').innerHTML = `<header class="top"><a class="logo" href="index.html">🎙️ VoiceScribe</a>
<button id="menuBtn" class="icon" aria-label="Toggle menu" aria-expanded="false">☰</button>
<nav id="nav" aria-label="Main">${nl('index.html','Home')}${nl('history.html','History')}${nl('about.html','About')}
<button id="setBtn" class="link">Settings</button><button id="themeBtn" class="icon" aria-label="Switch between light and dark mode"></button></nav></header>
<dialog id="dlg" aria-labelledby="dt"><h2 id="dt">Settings</h2>
<label>Default recognition language<br><select id="sLang">${langOptions(get('lang','en-IN'))}</select></label>
<label><input type="checkbox" id="sAuto"> Auto-save transcripts when recognition stops</label>
<label><input type="checkbox" id="sInt"> Show interim results</label>
<label><input type="checkbox" id="sDark"> Dark mode</label>
<div class="row"><button id="sClear" class="btn danger">Clear history</button><button id="sClose" class="btn primary">Close</button></div></dialog>
<div id="toasts" aria-live="polite"></div>`;
$('sAuto').checked = get('autosave', false); $('sInt').checked = get('interim', true); $('sDark').checked = get('dark', false);
applyTheme();
$('menuBtn').onclick = () => { const o = $('nav').classList.toggle('open'); $('menuBtn').setAttribute('aria-expanded', o); };
$('themeBtn').onclick = () => { put('dark', !get('dark', false)); $('sDark').checked = get('dark', false); applyTheme(); };
$('setBtn').onclick = () => $('dlg').showModal();
$('sClose').onclick = () => $('dlg').close();
$('sLang').onchange = e => { put('lang', e.target.value); if ($('lang')) $('lang').value = e.target.value; };
$('sAuto').onchange = e => put('autosave', e.target.checked);
$('sInt').onchange = e => { put('interim', e.target.checked); window.dispatchEvent(new Event('settings')); };
$('sDark').onchange = e => { put('dark', e.target.checked); applyTheme(); };
$('sClear').onclick = async () => {
  if (!confirm('Delete all saved transcripts? This cannot be undone.')) return;
  await api('/transcripts', {method:'DELETE'}); toast('History cleared'); window.dispatchEvent(new Event('historychanged'));
};
