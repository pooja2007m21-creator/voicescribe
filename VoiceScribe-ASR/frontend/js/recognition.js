const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const ed = $('final'), im = $('interim');
let rec, wantRun = false, paused = false, sec = 0, tick = null, startISO = '', edits = 0, empties = 0, errs = 0, saved = false;
const ERR = {
  'no-speech':'No speech was detected. Please try speaking again.',
  'audio-capture':'No microphone was found. Please connect a microphone and try again.',
  'not-allowed':'Microphone permission was denied. Please allow microphone access in your browser settings and try again.',
  'service-not-allowed':'The speech recognition service is not allowed here. Use a supported Chromium-based browser on localhost or HTTPS.',
  'network':'A network error occurred. Speech recognition usually needs an internet connection.',
  'aborted':'Recognition was aborted.',
  'language-not-supported':'The selected language is not supported by this browser.'
};
$('lang').innerHTML = langOptions(get('lang','en-IN'));

function status(t, on) { $('status').textContent = t; $('wave').classList.toggle('on', !!on); $('mic').classList.toggle('on', !!on); }
function buttons() {
  $('start').disabled = !SR || wantRun; $('stop').disabled = !wantRun && !paused;
  $('pause').disabled = !wantRun && !paused; $('pause').textContent = paused ? 'Resume' : 'Pause';
}
function quality() {
  const w = countWords(ed.value);
  $('qWords').textContent = w; $('qEdits').textContent = edits; $('qDur').textContent = fmt(sec); $('qEmpty').textContent = empties;
  $('qStatus').textContent = w === 0 ? 'No data yet' : (errs === 0 && empties <= 2 ? 'Good' : errs <= 1 ? 'Fair' : 'Needs attention');
}
function update() { renderAnalysis(ed.value); quality(); saved = false; }

function begin() {
  if (!SR) return toast('Browser does not support speech recognition', 'err');
  if (!paused) { sec = 0; edits = 0; empties = 0; errs = 0; startISO = new Date().toISOString(); $('timer').textContent = '00:00'; $('msg').hidden = true; }
  paused = false; wantRun = true; launch(); buttons();
}
function launch() {
  rec = new SR();
  rec.lang = $('lang').value; rec.continuous = true; rec.interimResults = true;
  rec.onstart = () => {
    status('Listening...', true);
    if (!tick) { tick = setInterval(() => { sec++; $('timer').textContent = fmt(sec); }, 1000); toast('Recognition started'); }
  };
  rec.onresult = e => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i], t = r[0].transcript;
      if (r.isFinal) {
        const s = t.trim();
        if (s) ed.value += (ed.value && !/\s$/.test(ed.value) ? ' ' : '') + s; else empties++;
      } else interim += t;
    }
    im.textContent = interim; update();
  };
  rec.onerror = e => {
    if (e.error === 'no-speech') empties++; else { errs++; wantRun = false; paused = false; }
    $('msg').textContent = ERR[e.error] || 'Recognition error: ' + e.error; $('msg').hidden = false;
    if (e.error === 'not-allowed') toast('Microphone permission required', 'err');
  };
  rec.onend = () => {
    im.textContent = '';
    if (wantRun) { try { launch(); return; } catch { wantRun = false; } }
    clearInterval(tick); tick = null;
    if (paused) status('Paused', false);
    else { status('Recognition stopped', false); if (get('autosave', false) && ed.value.trim() && !saved) save(); }
    buttons(); quality();
  };
  try { rec.start(); } catch (e) { wantRun = false; status('Recognition stopped', false); buttons(); }
}
function stop() { wantRun = false; paused = false; if (rec) rec.stop(); status('Recognition stopped', false); buttons(); }
function pause() {
  if (paused) return begin();
  wantRun = false; paused = true; if (rec) rec.stop(); buttons();
}
async function save() {
  const t = ed.value.trim();
  if (!t) return toast('Transcript is empty. Nothing to save.', 'err');
  await api('/transcripts', {method:'POST', body:JSON.stringify({transcript:t, language:$('lang').value, duration:sec, start_time:startISO, end_time:new Date().toISOString()})});
  saved = true; toast('Transcript saved'); loadSummary();
}
async function loadSummary() {
  try {
    const s = await api('/summary');
    $('sSess').textContent = s.total_sessions; $('sWords').textContent = s.total_words; $('sTr').textContent = s.total_transcripts;
    $('sLangTop').textContent = s.top_language ? (LANGS[s.top_language] || s.top_language) : '-';
  } catch {}
}
function applySettings() { im.parentElement.hidden = !get('interim', true); }

$('start').onclick = begin; $('stop').onclick = stop; $('pause').onclick = pause; $('save').onclick = save;
$('heroBtn').onclick = () => { $('recCard').scrollIntoView({behavior:'smooth'}); begin(); };
$('copy').onclick = () => ed.value.trim() ? copyText(ed.value) : toast('Transcript is empty.', 'err');
$('download').onclick = () => ed.value.trim() ? (download(ed.value), toast('Transcript downloaded')) : toast('Transcript is empty.', 'err');
$('clear').onclick = () => {
  if (ed.value.trim() && !confirm('Clear the transcript? Unsaved text will be lost.')) return;
  ed.value = ''; im.textContent = ''; edits = 0; update(); toast('Transcript cleared');
};
ed.addEventListener('input', () => { edits++; update(); });
window.addEventListener('settings', applySettings);

applySettings();
if (!SR) {
  $('unsupported').hidden = false; $('heroBtn').disabled = true; status('Recognition unavailable', false);
}
const useId = new URLSearchParams(location.search).get('use');
if (useId) api('/transcripts/' + encodeURIComponent(useId)).then(d => { ed.value = d.transcript; if (LANGS[d.language]) $('lang').value = d.language; update(); }).catch(() => {});
buttons(); update(); loadSummary();
