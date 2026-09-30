import { solve } from './features/calculator.js';
import { payment } from './core/price.js';
import { buildSchedule } from './core/schedule.js';
import { brl, pct, parseBRNumber } from './utils/currency.js';
import { updateBalance } from './features/update-balance.js';
import { simulateCredit } from './features/simulate-credit.js';
import { amortizeBalance } from './features/amortize-balance.js';\nimport { compareCredit } from './features/compare-credit.js';
const $=id=>document.getElementById(id); const form=$('calcForm'); let current=null;

function formatFixed2(input) {
  const raw = input.value.trim();
  if (!raw) { input.value = ''; return; }
  const digits = raw.replace(/\D/g,'');
  if (!digits || /^0+$/.test(digits)) { input.value = ''; return; }
  input.value=(Number(digits)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
['pv','pmt','originalPv','upPv','upPmt','simAmount','simBalance','amPv','amPmt','amExtra','cmpAAmount','cmpAPayment','cmpBAmount','cmpBPayment'].forEach(id=>$(id).addEventListener('input',e=>formatFixed2(e.target)));
['i','upI','simI','amI','cmpAI','cmpBI'].forEach(id=>$(id).addEventListener('input',e=>formatFixed2(e.target)));

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
['due','baseDate','firstDue','upBaseDate','upDue','updateDate','simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'].forEach(id => $(id).addEventListener('input', e => formatDate(e.target)));

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
const toolCount=tabs.length;
function normalizeTool(index){return (index+toolCount)%toolCount;}
function centerActiveTab(index,smooth=true){
  const tab=tabs[index];
  const left=tab.offsetLeft-(tab.parentElement.clientWidth-tab.offsetWidth)/2;
  tab.parentElement.scrollTo({left,behavior:smooth?'smooth':'auto'});
}
function goTool(index,smooth=true){
  index=normalizeTool(index);
  const panel=carousel.children[index];
  carousel.scrollTo({left:panel.offsetLeft,behavior:smooth?'smooth':'auto'});
  setToolState(index,smooth);
}
function setToolState(index,smooth=true){
  index=normalizeTool(index);
  tabs.forEach((t,i)=>t.classList.toggle('active',i===index));
  dots.forEach((d,i)=>d.classList.toggle('active',i===index));
  centerActiveTab(index,smooth);
}
tabs.forEach((tab,i)=>tab.addEventListener('click',()=>goTool(i)));

let activeTool=0,startX=null,startY=null;
carousel.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;startX=e.clientX;startY=e.clientY;},{passive:true});
carousel.addEventListener('pointerup',e=>{
  if(startX===null)return;
  const dx=e.clientX-startX,dy=e.clientY-startY;
  startX=startY=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)){
    if(activeTool===toolCount-1&&dx<0){goTool(0);return;}
    if(activeTool===0&&dx>0){goTool(toolCount-1);return;}
  }
},{passive:true});

let scrollTimer;
carousel.addEventListener('scroll',()=>{
  clearTimeout(scrollTimer);
  scrollTimer=setTimeout(()=>{
    const width=carousel.clientWidth||1;
    activeTool=Math.max(0,Math.min(toolCount-1,Math.round(carousel.scrollLeft/width)));
    setToolState(activeTool);
  },80);
},{passive:true});
setToolState(0,false);

function updateFieldState(id, valid){
  $(id).classList.toggle('field-valid',valid);
  $(id).classList.toggle('field-invalid',$(id).value.trim()!==''&&!valid);
}
function validateUpdateForm(){
  const requiredNumeric=['upPv','upPmt','upI'];
  const numericOk=requiredNumeric.every(id=>{
    const value=parseBRNumber($(id).value);
    const valid=Number.isFinite(value)&&value>0;
    updateFieldState(id,valid);
    return valid;
  });
  const targetValid=$('updateDate').value.trim()!==''&&validDate($('updateDate').value);
  updateFieldState('updateDate',targetValid);

  // Campos avançados refinam o cálculo, mas não controlam a habilitação do botão.
  const nRaw=$('upN').value.trim(),n=parseBRNumber(nRaw);
  $('upN').classList.toggle('field-valid',nRaw!==''&&Number.isFinite(n)&&n>0);
  $('upN').classList.toggle('field-invalid',nRaw!==''&&!(Number.isFinite(n)&&n>0));
  for(const id of ['upBaseDate','upDue']){
    const raw=$(id).value.trim(),valid=raw===''||validDate(raw);
    $(id).classList.toggle('field-valid',raw!==''&&valid);
    $(id).classList.toggle('field-invalid',raw!==''&&!valid);
  }
  $('calculateUpdateBalance').disabled=!(numericOk&&targetValid);
}
['upPv','upPmt','upN','upI','upBaseDate','upDue','updateDate'].forEach(id => {
  $(id).addEventListener('input', validateUpdateForm);
});
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
$('sendToUpdate').addEventListener('click',()=>{fillUpdateFromCurrent();goTool(2);});

$('clearUpdate').addEventListener('click',()=>{
  ['upPv','upPmt','upN','upI','upBaseDate','upDue','updateDate'].forEach(id=>{$(id).value='';$(id).classList.remove('field-valid','field-invalid');});
  $('updatedBalanceResult').classList.add('hidden');$('updateError').textContent='';validateUpdateForm();
});
$('calculateUpdateBalance').addEventListener('click',()=>{
  $('updateError').textContent='';$('updatedBalanceResult').classList.add('hidden');
  try{
    validateUpdateForm(); if($('calculateUpdateBalance').disabled)throw new Error('Preencha os campos essenciais com valores válidos.');
    const principal=parseBRNumber($('upPv').value),pmt=parseBRNumber($('upPmt').value),informedPeriods=parseBRNumber($('upN').value),periods=informedPeriods??600,monthlyRate=parseBRNumber($('upI').value)/100;
    const targetDate=parseDateBR($('updateDate').value),baseDate=parseDateBR($('upBaseDate').value)??new Date(),nextDue=parseDateBR($('upDue').value)??defaultNextDue(baseDate);
    const updated=updateBalance({principal,monthlyRate,payment:pmt,periods,baseDate,nextDue,targetDate});
    $('updatedBalanceDate').textContent='Saldo em '+formatDateBR(targetDate);$('updatedBalanceValue').textContent=brl.format(updated.balance);
    $('paidPeriods').textContent=updated.paid.toLocaleString('pt-BR');$('remainingPeriods').textContent=informedPeriods===null?'—':updated.remaining.toLocaleString('pt-BR');$('updatedNextDue').textContent=formatDateBR(updated.nextDue);
    $('updatedBalanceResult').classList.remove('hidden');
  }catch(err){$('updateError').textContent=err.message;}
});

let simulationKind='new';
const kindButtons=[...document.querySelectorAll('.kind-option')];
function setSimulationKind(kind){
  simulationKind=kind;
  const renewal=kind==='renewal';
  $('simBalanceLabel').classList.toggle('hidden',!renewal);
  $('renewalPrecisionFields').classList.toggle('hidden',!renewal);
  $('simPrecisionNote').textContent=renewal
    ? 'Para maior precisão do IOF sobre o saldo renovado, informe a data da contratação original e o vencimento final original. Sem esses dados será usada uma estimativa.'
    : 'Se as datas não forem informadas, a contratação será considerada hoje e o primeiro vencimento em 30 dias.';
  kindButtons.forEach(button=>{
    const active=button.dataset.kind===kind;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  if(!renewal){
    for(const id of ['simBalance','simOriginalContractDate','simOriginalFinalDue']){$(id).value='';$(id).classList.remove('field-valid','field-invalid');}
  }
  $('simulationResult').classList.add('hidden');
  validateSimulation();
}
kindButtons.forEach(button=>button.addEventListener('click',()=>setSimulationKind(button.dataset.kind)));

function positiveSimulationField(id){
  const value=parseBRNumber($(id).value);
  const valid=Number.isFinite(value)&&value>0;
  updateFieldState(id,valid);
  return valid;
}
function validateSimulation(){
  const amountOk=positiveSimulationField('simAmount');
  const nOk=positiveSimulationField('simN');
  const rateOk=positiveSimulationField('simI');
  const balanceOk=simulationKind==='new'||positiveSimulationField('simBalance');
  for(const id of ['simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue']){
    const raw=$(id).value.trim(),valid=raw===''||validDate(raw);
    $(id).classList.toggle('field-valid',raw!==''&&valid);
    $(id).classList.toggle('field-invalid',raw!==''&&!valid);
  }
  $('simulate').disabled=!(amountOk&&nOk&&rateOk&&balanceOk);
}
['simAmount','simBalance','simN','simI','simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'].forEach(id=>$(id).addEventListener('input',validateSimulation));

$('simulateForm').addEventListener('submit',e=>{
  e.preventDefault(); $('simulateError').textContent=''; $('simulationResult').classList.add('hidden');
  try{
    validateSimulation();
    if($('simulate').disabled)throw new Error('Preencha os campos essenciais com valores válidos.');
    for(const id of ['simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
    const originalDateRaw=$('simOriginalContractDate').value.trim(),originalFinalRaw=$('simOriginalFinalDue').value.trim();
    if(simulationKind==='renewal'&&((originalDateRaw&&!originalFinalRaw)||(!originalDateRaw&&originalFinalRaw)))throw new Error('Para refinar o IOF do saldo, informe as duas datas da operação original.');
    const contractDate=parseDateBR($('simContractDate').value)??new Date();
    const firstDue=parseDateBR($('simFirstDue').value)??defaultNextDue(contractDate);
    if(firstDue<=contractDate)throw new Error('O primeiro vencimento deve ser posterior à data da contratação.');
    const result=simulateCredit({
      kind:simulationKind,
      requestedAmount:parseBRNumber($('simAmount').value),
      outstandingBalance:simulationKind==='renewal'?parseBRNumber($('simBalance').value):0,
      periods:parseBRNumber($('simN').value),
      monthlyRate:parseBRNumber($('simI').value)/100,
      contractDate,firstDue,
      originalContractDate:simulationKind==='renewal'?parseDateBR($('simOriginalContractDate').value):null,
      originalFinalDue:simulationKind==='renewal'?parseDateBR($('simOriginalFinalDue').value):null
    });
    $('simPayment').textContent=brl.format(result.payment);
    $('simFinanced').textContent=brl.format(result.financedAmount);
    $('simIof').textContent=brl.format(result.iof);
    $('simReleased').textContent=brl.format(result.requestedAmount);
    $('simOldBalanceIof').textContent=brl.format(result.outstandingIof);
    $('simOldBalanceIofStat').classList.toggle('hidden',simulationKind!=='renewal');
    $('simReleasedLabel').textContent=simulationKind==='renewal'?'Valor liberado':'Valor contratado';
    $('simRenewalStat').classList.toggle('hidden',simulationKind==='new');
    $('simAssumption').textContent=simulationKind==='renewal'
      ? (result.outstandingIofMode==='informed'
          ? 'IOF do saldo renovado estimado pelo período complementar até o limite de 365 dias, sem repetir o adicional de 0,38%. '+result.complementaryDays+' dias complementares considerados. Primeiro vencimento em '+formatDateBR(firstDue)+'.'
          : 'IOF do saldo renovado aproximado assumindo 180 dias já tributados na operação original. Informe as datas da operação original em “Aumente a precisão” para refinar. Primeiro vencimento em '+formatDateBR(firstDue)+'.')
      : 'IOF estimado incluído no valor financiado. Primeiro vencimento em '+formatDateBR(firstDue)+'.';
    $('simulationResult').classList.remove('hidden');
  }catch(err){$('simulateError').textContent=err.message;}
});
$('clearSimulation').addEventListener('click',()=>{
  $('simulateForm').reset();
  ['simAmount','simBalance','simN','simI','simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));
  $('simulateError').textContent='';$('simulationResult').classList.add('hidden');setSimulationKind('new');
});
setSimulationKind('new');


function validateAmortization(){
  const ids=['amPv','amPmt','amN','amI','amExtra'];
  const ok=ids.every(id=>{const value=parseBRNumber($(id).value);const valid=Number.isFinite(value)&&value>0;updateFieldState(id,valid);return valid;});
  const pv=parseBRNumber($('amPv').value),extra=parseBRNumber($('amExtra').value);
  const extraOk=Number.isFinite(extra)&&Number.isFinite(pv)&&extra>0&&extra<pv;
  if($('amExtra').value.trim()!=='')updateFieldState('amExtra',extraOk);
  $('amortize').disabled=!(ok&&extraOk);
}
['amPv','amPmt','amN','amI','amExtra'].forEach(id=>$(id).addEventListener('input',validateAmortization));
$('amortizeForm').addEventListener('submit',e=>{
  e.preventDefault();$('amortizeError').textContent='';$('amortizationResult').classList.add('hidden');
  try{
    validateAmortization();if($('amortize').disabled)throw new Error('Preencha os campos essenciais com valores válidos. A amortização deve ser menor que o saldo.');
    const r=amortizeBalance({principal:parseBRNumber($('amPv').value),currentPayment:parseBRNumber($('amPmt').value),remainingPeriods:parseBRNumber($('amN').value),monthlyRate:parseBRNumber($('amI').value)/100,extraPayment:parseBRNumber($('amExtra').value)});
    $('amNewBalance').textContent=brl.format(r.newBalance);
    $('amNewN').textContent=Math.ceil(r.reducedPeriods).toLocaleString('pt-BR')+' parcelas';
    $('amSavedN').textContent='redução de aproximadamente '+Math.max(0,Math.floor(r.periodsSaved)).toLocaleString('pt-BR')+' parcelas';
    $('amNewPmt').textContent=brl.format(r.newPayment);
    $('amSavedPmt').textContent='redução de '+brl.format(r.paymentReduction)+' por parcela';
    $('amInterestTerm').textContent=brl.format(r.interestSavingTerm);
    $('amInterestPayment').textContent=brl.format(r.interestSavingPayment);
    $('amortizationResult').classList.remove('hidden');
  }catch(err){$('amortizeError').textContent=err.message;}
});
$('clearAmortization').addEventListener('click',()=>{
  $('amortizeForm').reset();['amPv','amPmt','amN','amI','amExtra'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));
  $('amortizeError').textContent='';$('amortizationResult').classList.add('hidden');validateAmortization();
});
validateAmortization();


function validateComparison(){
  const ids=['cmpAAmount','cmpAPayment','cmpAN','cmpAI','cmpBAmount','cmpBPayment','cmpBN','cmpBI'];
  const ok=ids.every(id=>{const value=parseBRNumber($(id).value);const valid=Number.isFinite(value)&&value>0;updateFieldState(id,valid);return valid;});
  $('compare').disabled=!ok;
}
['cmpAAmount','cmpAPayment','cmpAN','cmpAI','cmpBAmount','cmpBPayment','cmpBN','cmpBI'].forEach(id=>$(id).addEventListener('input',validateComparison));
function signedMoney(value){return (value>0?'+ ':'− ')+brl.format(Math.abs(value));}
function signedPctValue(value){if(value===null||Math.abs(value)<1e-12)return 'sem variação';return (value>0?'+ ':'− ')+Math.abs(value*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';}
$('compareForm').addEventListener('submit',e=>{
  e.preventDefault();$('compareError').textContent='';$('comparisonResult').classList.add('hidden');
  try{
    validateComparison();if($('compare').disabled)throw new Error('Preencha todos os dados das duas alternativas com valores válidos.');
    const readOption=p=>({amount:parseBRNumber($(p+'Amount').value),payment:parseBRNumber($(p+'Payment').value),periods:parseBRNumber($(p+'N').value),monthlyRate:parseBRNumber($(p+'I').value)/100});
    const r=compareCredit(readOption('cmpA'),readOption('cmpB'));
    $('cmpPaymentDiff').textContent=signedMoney(r.diff.payment);$('cmpPaymentPct').textContent=signedPctValue(r.pct.payment);
    $('cmpPeriodDiff').textContent=(r.diff.periods>0?'+ ':'− ')+Math.abs(r.diff.periods).toLocaleString('pt-BR')+' parcelas';
    if(r.diff.periods===0)$('cmpPeriodDiff').textContent='Mesmo prazo';
    $('cmpTotalDiff').textContent=signedMoney(r.diff.totalPaid);$('cmpTotalPct').textContent=signedPctValue(r.pct.totalPaid);
    $('cmpCostDiff').textContent=signedMoney(r.diff.totalCost);
    const parts=[];
    parts.push(r.diff.payment===0?'As parcelas são iguais.':r.diff.payment<0?'A alternativa B reduz a parcela em '+brl.format(-r.diff.payment)+'.':'A alternativa B aumenta a parcela em '+brl.format(r.diff.payment)+'.');
    parts.push(r.diff.totalPaid===0?'O desembolso total é igual.':r.diff.totalPaid<0?'O desembolso total de B é '+brl.format(-r.diff.totalPaid)+' menor.':'O desembolso total de B é '+brl.format(r.diff.totalPaid)+' maior.');
    $('cmpSummary').textContent=parts.join(' ');
    $('comparisonResult').classList.remove('hidden');
  }catch(err){$('compareError').textContent=err.message;}
});
$('clearComparison').addEventListener('click',()=>{$('compareForm').reset();['cmpAAmount','cmpAPayment','cmpAN','cmpAI','cmpBAmount','cmpBPayment','cmpBN','cmpBI'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('compareError').textContent='';$('comparisonResult').classList.add('hidden');validateComparison();});
validateComparison();
