import { solve } from './features/calculator.js';
import { payment } from './core/price.js';
import { buildSchedule } from './core/schedule.js';
import { brl, pct, parseBRNumber } from './utils/currency.js';
const $=id=>document.getElementById(id); const form=$('calcForm'); let current=null;

function formatFixed2(input) {
  const digits=input.value.replace(/\D/g,'');
  if (!digits) { input.value=''; return; }
  input.value=(Number(digits)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
['pv','pmt','originalPv'].forEach(id=>$(id).addEventListener('input',e=>formatFixed2(e.target)));
$('i').addEventListener('input',e=>formatFixed2(e.target));

function formatDate(input) {
  const digits = input.value.replace(/\D/g, '').slice(0, 8);
  let value = digits.slice(0, 2);
  if (digits.length > 2) value += '/' + digits.slice(2, 4);
  if (digits.length > 4) value += '/' + digits.slice(4, 8);
  input.value = value;
}
function validDate(value) {
  if (!value) return true;
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
['due','baseDate','firstDue'].forEach(id => $(id).addEventListener('input', e => formatDate(e.target)));

function read(){const pv=parseBRNumber($('pv').value),pmt=parseBRNumber($('pmt').value),n=parseBRNumber($('n').value),rawI=parseBRNumber($('i').value);return{pv,pmt,n,i:rawI===null?null:rawI/100};}
const labels={pv:'Saldo devedor encontrado',pmt:'Parcela encontrada',n:'Prazo encontrado',i:'Taxa encontrada'};
form.addEventListener('submit',e=>{e.preventDefault();$('error').textContent='';$('evolution').classList.add('hidden');try{for(const id of ['due','baseDate','firstDue']){if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');}const data=read();const r=solve(data);current={...data,[r.key]:r.value};$('resultLabel').textContent=labels[r.key];$('resultValue').textContent=r.key==='pv'||r.key==='pmt'?brl.format(r.value):r.key==='i'?pct(r.value):`${r.value.toLocaleString('pt-BR',{maximumFractionDigits:2})} parcelas`;$('resultExtra').textContent=r.key==='i'?`${pct(r.annual,2)} a.a. equivalente`:r.annual!==null?`${pct(r.annual,2)} a.a. equivalente`:'';$('result').classList.remove('hidden');}catch(err){$('result').classList.add('hidden');$('error').textContent=err.message;}});
$('clear').addEventListener('click',()=>{form.reset();$('result').classList.add('hidden');$('evolution').classList.add('hidden');$('error').textContent='';current=null;});
$('showEvolution').addEventListener('click',()=>{if(!current)return;try{const pmt=current.pmt??payment(current.pv,current.i,current.n);const schedule=buildSchedule(current.pv,current.i,pmt,Math.min(600,Math.ceil(current.n)+2));const body=$('scheduleBody');body.innerHTML='';for(const r of schedule.rows){const tr=document.createElement('tr');[r.n,brl.format(r.opening),brl.format(r.interest),brl.format(r.amortization),brl.format(r.payment),brl.format(r.closing)].forEach(v=>{const td=document.createElement('td');td.textContent=v;tr.appendChild(td)});body.appendChild(tr)}$('evolution').classList.remove('hidden');$('evolution').scrollIntoView({behavior:'smooth',block:'start'});}catch(err){$('error').textContent=err.message;}});
$('hideEvolution').addEventListener('click',()=>$('evolution').classList.add('hidden'));