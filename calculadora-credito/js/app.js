import { solve } from './features/calculator.js';
import { payment } from './core/price.js';
import { buildSchedule } from './core/schedule.js';
import { brl, pct, parseBRNumber } from './utils/currency.js';
import { updateBalance } from './features/update-balance.js';
const $=id=>document.getElementById(id); const form=$('calcForm'); let current=null;

function formatFixed2(input) {
  const raw = input.value.trim();
  if (!raw) { input.value = ''; return; }
  const digits = raw.replace(/\D/g,'');
  if (!digits || /^0+$/.test(digits)) { input.value = ''; return; }
  input.value=(Number(digits)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
['pv','pmt','originalPv','upPv','upPmt'].forEach(id=>$(id).addEventListener('input',e=>formatFixed2(e.target)));
['i','upI'].forEach(id=>$(id).addEventListener('input',e=>formatFixed2(e.target)));

function formatDate(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 8);
  let value = digits.slice(0, 2);
  if (digits.length > 2) value += '/' + digits.slice(2, 4);
  if (digits.length > 4) value += '/' + digits.slice(4, 8);
  input.value = value;
}
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function defaultNextDue(baseDate = new Date()) {
  return addDays(baseDate, 30);
}

function validDate(value) {
  if (!value) return true;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
['due','baseDate','firstDue','upBaseDate','upDue','updateDate'].forEach(id => $(id).addEventListener('input', e => formatDate(e.target)));

function parseDateBR(value) {
  if (!value) return null;
  const [day, month, year] = value.split('/').map(Number);
  return new Date(year, month - 1, day);
}
function daysBetween(start, end) {
  return Math.round((end - start) / 86400000);
}
function read(){const pv=parseBRNumber($('pv').value),pmt=parseBRNumber($('pmt').value),n=parseBRNumber($('n').value),rawI=parseBRNumber($('i').value);const base=parseDateBR($('baseDate').value) ?? new Date();
  const due=parseDateBR($('due').value);
  const firstPeriodDays=due ? daysBetween(base,due) : 30;
  if (firstPeriodDays <= 0) throw new Error('O próximo vencimento deve ser posterior à data-base.');
  return{pv,pmt,n,i:rawI===null?null:rawI/100,firstPeriodDays,baseDate:base,dueDate:due??defaultNextDue(base)};}
function essentialFieldState(id) {
  const raw = $(id).value.trim();
  if (raw === '') return 'empty';
  const value = parseBRNumber(raw);
  return Number.isFinite(value) && value > 0 ? 'valid' : 'invalid';
}
function updateCalculateState() {
  const ids = ['pv','pmt','n','i'];
  const states = ids.map(essentialFieldState);
  ids.forEach((id, index) => {
    $(id).classList.toggle('field-valid', states[index] === 'valid');
    $(id).classList.toggle('field-invalid', states[index] === 'invalid');
  });
  const validCount = states.filter(state => state === 'valid').length;
  const emptyCount = states.filter(state => state === 'empty').length;
  $('calculate').disabled = !(validCount === 3 && emptyCount === 1);
}
['pv','pmt','n','i'].forEach(id => $(id).addEventListener('input', updateCalculateState));
updateCalculateState();
const labels={pv:'Saldo devedor encontrado',pmt:'Parcela encontrada',n:'Prazo encontrado',i:'Taxa encontrada'};
form.addEventListener('submit',e=>{e.preventDefault();$('error').textContent='';$('evolution').classList.add('hidden');try{for(const id of ['due','baseDate','firstDue']){if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');}const data=read();const r=solve(data);current={...data,[r.key]:r.value};$('resultLabel').textContent=labels[r.key];$('resultValue').textContent=r.key==='pv'||r.key==='pmt'?brl.format(r.value):r.key==='i'?`${r.displayedRate.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`:`${r.displayedPeriods.toLocaleString('pt-BR')} parcelas`;$('resultExtra').textContent=r.key==='i'?`${pct(r.annual,2)} a.a. equivalente`:r.annual!==null?`${pct(r.annual,2)} a.a. equivalente`:'';$('result').classList.remove('hidden');}catch(err){$('result').classList.add('hidden');$('error').textContent=err.message;}});
$('clear').addEventListener('click',()=>{form.reset();$('result').classList.add('hidden');$('evolution').classList.add('hidden');$('error').textContent='';current=null;updateCalculateState();});
$('showEvolution').addEventListener('click',()=>{if(!current)return;try{const pmt=current.pmt??payment(current.pv,current.i,current.n);const schedule=buildSchedule(current.pv,current.i,pmt,Math.min(600,Math.ceil(current.n)+2));const body=$('scheduleBody');body.innerHTML='';for(const r of schedule.rows){const tr=document.createElement('tr');[r.n,brl.format(r.opening),brl.format(r.interest),brl.format(r.amortization),brl.format(r.payment),brl.format(r.closing)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});body.appendChild(tr)}$('evolution').classList.remove('hidden');$('evolution').scrollIntoView({behavior:'smooth',block:'start'});}catch(err){$('error').textContent=err.message;}});
$('hideEvolution').addEventListener('click',()=>$('evolution').classList.add('hidden'));

function formatDateBR(date){return date?date.toLocaleDateString('pt-BR'): '—';}
const carousel=$('toolsCarousel'), tabs=[...document.querySelectorAll('.tool-tab')], dots=[...document.querySelectorAll('.tool-dots i')];
function goTool(index, smooth=true){const panel=carousel.children[index];carousel.scrollTo({left:panel.offsetLeft,behavior:smooth?'smooth':'auto'});}
function setToolState(index){tabs.forEach((t,i)=>t.classList.toggle('active',i===index));dots.forEach((d,i)=>d.classList.toggle('active',i===index));}
tabs.forEach((tab,i)=>tab.addEventListener('click',()=>goTool(i)));
let scrollTimer; carousel.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{const width=carousel.clientWidth||1;setToolState(Math.round(carousel.scrollLeft/width));},80);},{passive:true});

function updateFieldState(id, valid){
  $(id).classList.toggle('field-valid',valid);
  $(id).classList.toggle('field-invalid',$(id).value.trim()!==''&&!valid);
}
function validateUpdateForm(){
  const numeric=['upPv','upPmt','upN','upI'];
  let ok=true;
  for(const id of numeric){const v=parseBRNumber($(id).value);const valid=Number.isFinite(v)&&v>0;updateFieldState(id,valid);ok=ok&&valid;}
  for(const id of ['upBaseDate','upDue','updateDate']){const valid=$(id).value!==''&&validDate($(id).value);updateFieldState(id,valid);ok=ok&&valid;}
  if(ok){const base=parseDateBR($('upBaseDate').value),due=parseDateBR($('upDue').value),target=parseDateBR($('updateDate').value);ok=due>base&&target>=base;}
  $('calculateUpdateBalance').disabled=!ok;
}
['upPv','upPmt','upN','upI','upBaseDate','upDue','updateDate'].forEach(id=>$(id).addEventListener('input',validateUpdateForm));
validateUpdateForm();

function fillUpdateFromCurrent(){
  if(!current)return;
  $('upPv').value=(current.pv).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('upPmt').value=(current.pmt??payment(current.pv,current.i,current.n)).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('upN').value=Math.ceil(current.n).toLocaleString('pt-BR');
  $('upI').value=(current.i*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  $('upBaseDate').value=formatDateBR(current.baseDate);
  $('upDue').value=formatDateBR(current.dueDate);
  if(!$('updateDate').value)$('updateDate').value=formatDateBR(new Date());
  validateUpdateForm();
}
$('sendToUpdate').addEventListener('click',()=>{fillUpdateFromCurrent();goTool(1);});

$('clearUpdate').addEventListener('click',()=>{
  ['upPv','upPmt','upN','upI','upBaseDate','upDue','updateDate'].forEach(id=>{$(id).value='';$(id).classList.remove('field-valid','field-invalid');});
  $('updatedBalanceResult').classList.add('hidden');$('updateError').textContent='';validateUpdateForm();
});
$('calculateUpdateBalance').addEventListener('click',()=>{
  $('updateError').textContent='';$('updatedBalanceResult').classList.add('hidden');
  try{
    validateUpdateForm(); if($('calculateUpdateBalance').disabled)throw new Error('Preencha todos os dados do contrato com valores válidos.');
    const principal=parseBRNumber($('upPv').value),pmt=parseBRNumber($('upPmt').value),periods=parseBRNumber($('upN').value),monthlyRate=parseBRNumber($('upI').value)/100;
    const baseDate=parseDateBR($('upBaseDate').value),nextDue=parseDateBR($('upDue').value),targetDate=parseDateBR($('updateDate').value);
    const updated=updateBalance({principal,monthlyRate,payment:pmt,periods,baseDate,nextDue,targetDate});
    $('updatedBalanceDate').textContent='Saldo em '+formatDateBR(targetDate);$('updatedBalanceValue').textContent=brl.format(updated.balance);
    $('paidPeriods').textContent=updated.paid.toLocaleString('pt-BR');$('remainingPeriods').textContent=updated.remaining.toLocaleString('pt-BR');$('updatedNextDue').textContent=formatDateBR(updated.nextDue);
    $('updatedBalanceResult').classList.remove('hidden');
  }catch(err){$('updateError').textContent=err.message;}
});