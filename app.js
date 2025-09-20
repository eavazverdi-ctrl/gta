const $ = sel => document.querySelector(sel);

// digits normalize
function normalizeDigits(s) {
  if (!s) return s;
  const map = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','٫':'.','٬':'',',':''};
  return s.split('').map(ch => map[ch] ?? ch).join('');
}
function toNum(v) {
  if (v == null) return null;
  const t = normalizeDigits(v).replace(',', '.').trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
function fmt(v) { if (v == null) return '—'; const n = Number(v); return Number.isFinite(n) ? n.toFixed(2) : String(v); }

function recalc() {
  // Buy
  const ht  = toNum($('#buyTop').value);
  const hi1 = toNum($('#buyHigh').value);
  const lo1 = toNum($('#buyLow').value);
  if (ht != null && hi1 != null && lo1 != null) {
    const b22 = 2*lo1 - hi1;
    const p1  = 2*b22 - (ht + hi1)/2;
    const p2  = 2*b22 - ht;
    const st  = 2*p2 - p1;
    $('#buyP1').textContent = fmt(p1);
    $('#buyP2').textContent = fmt(p2);
    $('#buyStop').textContent = fmt(st);
  } else {
    $('#buyP1').textContent = $('#buyP2').textContent = $('#buyStop').textContent = '—';
  }

  // Sell
  const hl  = toNum($('#sellLow').value);
  const hi2 = toNum($('#sellHigh').value);
  const lo2 = toNum($('#sellLow2').value);
  if (hl != null && hi2 != null && lo2 != null) {
    const d22 = 2*hi2 - lo2;
    const d23 = (hl + lo2)/2;
    const pt2 = 2*d22 - hl;
    const pt1 = 2*d22 - d23;
    const st  = 2*pt2 - pt1;
    $('#sellStop').textContent = fmt(st);
    $('#sellP2').textContent = fmt(pt2);
    $('#sellP1').textContent = fmt(pt1);
  } else {
    $('#sellStop').textContent = $('#sellP2').textContent = $('#sellP1').textContent = '—';
  }
}

// Bind inputs
['buyTop','buyHigh','buyLow','sellLow','sellHigh','sellLow2'].forEach(id => {
  const el = document.getElementById(id);
  ['input','change','keyup','paste'].forEach(evt => el.addEventListener(evt, recalc));
});

// Clear on headers
document.getElementById('buyHead').addEventListener('click', () => {
  ['buyTop','buyHigh','buyLow'].forEach(id => document.getElementById(id).value='');
  ['buyP1','buyP2','buyStop'].forEach(id => document.getElementById(id).textContent='—');
});
document.getElementById('sellHead').addEventListener('click', () => {
  ['sellLow','sellHigh','sellLow2'].forEach(id => document.getElementById(id).value='');
  ['sellStop','sellP2','sellP1'].forEach(id => document.getElementById(id).textContent='—');
});

recalc();

// === Glass controls ===
const fab = document.getElementById('glassFab');
const sheet = document.getElementById('glassSheet');
function toggleSheet(open){
  sheet.classList.toggle('open', open ?? !sheet.classList.contains('open'));
  sheet.setAttribute('aria-hidden', sheet.classList.contains('open') ? 'false' : 'true');
}
if (fab) fab.addEventListener('click', ()=>toggleSheet(true));
if (sheet) sheet.addEventListener('click', (e)=>{ if(e.target === sheet) toggleSheet(false); });

const $id = (x)=>document.getElementById(x);
const sliders = { alpha: $id('alpha'), border: $id('border'), blur: $id('blur'), sat: $id('sat') };
const labels  = { alpha: $id('alphaVal'), border: $id('borderVal'), blur: $id('blurVal'), sat: $id('satVal') };
const defaults = { alpha:0.12, border:0.08, blur:20, sat:180, alphaLight:0.65, borderLight:0.06 };

function applyVars(v){
  const r = document.documentElement.style;
  r.setProperty('--glass-alpha', String(v.alpha));
  r.setProperty('--glass-border-alpha', String(v.border));
  r.setProperty('--glass-blur', v.blur + 'px');
  r.setProperty('--glass-sat', v.sat + '%');
  const aL = v.alphaLight ?? Math.min(0.9, v.alpha + 0.48);
  const bL = v.borderLight ?? Math.max(0.04, v.border - 0.02);
  r.setProperty('--glass-alpha-light', String(aL));
  r.setProperty('--glass-border-alpha-light', String(bL));
  labels.alpha.textContent  = (v.alpha||0).toFixed(2);
  labels.border.textContent = (v.border||0).toFixed(2);
  labels.blur.textContent   = String(v.blur||0);
  labels.sat.textContent    = String(v.sat||0);
}
function save(v){ try{ localStorage.setItem('glassSettingsV1', JSON.stringify(v)); }catch(e){} }
function load(){ try{ return JSON.parse(localStorage.getItem('glassSettingsV1')) || defaults; } catch(e){ return defaults; } }
function readCurrent(){ return { alpha:Number(sliders.alpha.value), border:Number(sliders.border.value), blur:Number(sliders.blur.value), sat:Number(sliders.sat.value) }; }
function setSliders(v){ sliders.alpha.value=v.alpha; sliders.border.value=v.border; sliders.blur.value=v.blur; sliders.sat.value=v.sat; applyVars(v); }

Object.values(sliders).forEach(el=> el && el.addEventListener('input', ()=>{ const v=readCurrent(); applyVars(v); save(v); }));

document.querySelectorAll('.preset-row button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const p = btn.dataset.preset;
    let v = {...defaults};
    if (p==='soft')    v={alpha:0.10,border:0.06,blur:24,sat:180};
    if (p==='default') v={alpha:0.12,border:0.08,blur:20,sat:180};
    if (p==='solid')   v={alpha:0.18,border:0.10,blur:16,sat:160};
    if (p==='reset')   v={...defaults};
    setSliders(v); save(v);
  });
});

const initV = load();
setSliders(initV);


// ===== v22: Password Gate =====
(function(){
  const LICENSE_KEY = 'fxLicenseV1';
  function now(){ return Date.now(); }
  function loadLic(){ try { return JSON.parse(localStorage.getItem(LICENSE_KEY) || 'null'); } catch(e){ return null; } }
  function saveLic(v){ try { localStorage.setItem(LICENSE_KEY, JSON.stringify(v)); } catch(e){} }
  function isValid(lic){
    if (!lic) return false;
    if (lic.type === 'permanent') return true;
    if (lic.type === 'trial' && typeof lic.exp === 'number') return now() < lic.exp;
    return false;
  }
  function unlockUI(){ document.body.classList.add('unlocked'); }
  function lockUI(){ document.body.classList.remove('unlocked'); }

  const existing = loadLic();
  if (isValid(existing)) { unlockUI(); } else { lockUI(); }

  const passEl = document.getElementById('authPass');
  const btnEl  = document.getElementById('authBtn');
  const errEl  = document.getElementById('authErr');

  function tryAuth(){
    const v = (passEl.value || '').trim();
    if (v === 'kireehsan'){
      saveLic({ type:'permanent', ts: now() });
      unlockUI();
    } else if (v === 'ehsan'){
      const oneWeek = 7*24*60*60*1000;
      saveLic({ type:'trial', exp: now() + oneWeek, ts: now() });
      unlockUI();
    } else {
      errEl.hidden = false;
      return;
    }
    passEl.value = '';
    errEl.hidden = true;
    const auth = document.getElementById('authGate');
    if (auth) auth.setAttribute('aria-hidden','true');
  }

  if (btnEl) btnEl.addEventListener('click', tryAuth);
  if (passEl) passEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') tryAuth(); });
})();

