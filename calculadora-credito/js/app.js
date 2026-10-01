import { solve } from './features/calculator.js';
import { payment, principal } from './core/price.js';
import { buildSchedule } from './core/schedule.js';
import { brl, pct, parseBRNumber } from './utils/currency.js';
import { updateBalance } from './features/update-balance.js';
import { simulateCredit } from './features/simulate-credit.js';
import { amortizeBalance } from './features/amortize-balance.js';
import { compareCredit } from './features/compare-credit.js';
import { debtExchange } from './features/debt-exchange.js';
import { creditToAmortize } from './features/credit-to-amortize.js';
import { offerInsights } from './features/offer-insights.js';
const $=id=>document.getElementById(id); const form=$('calcForm'); let current=null;
function renderInsights(context,data){
  const insights=offerInsights(context,data),hub=$('insightsHubList'); if(!hub)return;
  hub.innerHTML='';
  for(const item of insights){const box=document.createElement('div');box.className='balance-stat';const span=document.createElement('span');span.textContent=item.title;const b=document.createElement('b');b.textContent=item.text;box.append(span,b);hub.appendChild(box);}
  if(!insights.length)hub.innerHTML='<div class="balance-stat"><span>Sem argumento adicional</span><b>Os dados calculados não produziram um destaque comercial relevante.</b></div>';
}

function formatFixed2(input) {
  const raw = input.value.trim();
  if (!raw) { input.value = ''; return; }
  const digits = raw.replace(/\D/g,'');
  if (!digits || /^0+$/.test(digits)) { input.value = ''; return; }
  input.value=(Number(digits)/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
['pv','pmt','originalPv','upPv','upPmt','simAmount','simBalance','simPmt','amPv','amPmt','amExtra','cmpAAmount','cmpAPayment','cmpBAmount','cmpBPayment','cmpAIOF','cmpBIOF','exBalance','exCurrentPayment','exNewPayment','exCashBack','exFees','exNewIof','cvAmount','cvPayment','caBalance','caCurrentPayment','caNewAmount'].forEach(id=>$(id)?.addEventListener('input',e=>formatFixed2(e.target)));
['i','portI','upI','amI','cmpAI','cmpBI','exCurrentI','exNewI','cvI','caCurrentI','caNewI'].forEach(id=>$(id)?.addEventListener('input',e=>formatFixed2(e.target)));
$('simI').addEventListener('input',e=>{formatFixed2(e.target);validateSimulation();});

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
['due','baseDate','firstDue','upBaseDate','upDue','updateDate','simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue','amBaseDate','amDue','portEffectiveDate','portFirstDue','cmpAContractDate','cmpAFirstDue','cmpBContractDate','cmpBFirstDue','exBaseDate','exCurrentDue','exNewContractDate','exNewFirstDue','cvContractDate','cvFirstDue','caBaseDate','caCurrentDue','caContractDate','caFirstDue'].forEach(id => $(id)?.addEventListener('input', e => formatDate(e.target)));

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
  const destinationRate=parseBRNumber($('portI').value);
  const destinationValid=Number.isFinite(destinationRate)&&destinationRate>0;
  updateFieldState('portI',destinationValid);
  const validCount = states.filter(state => state === 'valid').length;
  const emptyCount = states.filter(state => state === 'empty').length;
  $('calculate').disabled = !(validCount === 3 && emptyCount === 1 && destinationValid);
}
['pv','pmt','n','i','portI'].forEach(id => $(id).addEventListener('input', updateCalculateState));
['portEffectiveDate','portFirstDue'].forEach(id=>$(id).addEventListener('input',()=>{$('result').classList.add('hidden');}));
updateCalculateState();
function paymentWithFirstPeriod(principalValue,rateValue,periodsValue,firstPeriodDays=30){
  if(firstPeriodDays===30)return payment(principalValue,rateValue,periodsValue);
  const fraction=firstPeriodDays/30;
  if(Math.abs(rateValue)<1e-14)return principalValue/periodsValue;
  const annuityDueFactor=(1-Math.pow(1+rateValue,-periodsValue))/rateValue*(1+rateValue);
  return principalValue*Math.pow(1+rateValue,fraction)/annuityDueFactor;
}
form.addEventListener('submit',e=>{e.preventDefault();$('error').textContent='';$('evolution').classList.add('hidden');try{
  for(const id of ['due','baseDate','firstDue']){if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');}
  const data=read(),r=solve(data);
  current={...data,[r.key]:r.value};
  const originPayment=current.pmt??paymentWithFirstPeriod(current.pv,current.i,current.n,current.firstPeriodDays);
  const destinationRate=parseBRNumber($('portI').value)/100;
  for(const id of ['portEffectiveDate','portFirstDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
  const informedEffective=parseDateBR($('portEffectiveDate').value),informedDestinationDue=parseDateBR($('portFirstDue').value);
  if((informedEffective&&!informedDestinationDue)||(!informedEffective&&informedDestinationDue))throw new Error('Para usar as datas do destino, informe a data de efetivação e a data da primeira parcela.');
  const balanceBaseDate=parseDateBR($('baseDate').value);
  if(informedEffective&&!balanceBaseDate)throw new Error('Para atualizar o saldo até a efetivação, informe também a Data do saldo devedor na Instituição origem.');
  if(informedEffective<=balanceBaseDate)throw new Error('A data de efetivação deve ser posterior à data do saldo devedor.');
  if(informedDestinationDue<=informedEffective)throw new Error('A primeira parcela deve ser posterior à data de efetivação.');
  const balanceUpdateDays=informedEffective?daysBetween(balanceBaseDate,informedEffective):0;
  const updatedBalance=informedEffective?current.pv*Math.pow(1+current.i,balanceUpdateDays/30):current.pv;
  const destinationFirstPeriodDays=informedEffective?daysBetween(informedEffective,informedDestinationDue):30;
  const destinationPayment=paymentWithFirstPeriod(updatedBalance,destinationRate,current.n,destinationFirstPeriodDays);
  $('resultValue').textContent=brl.format(destinationPayment);
  $('portOriginPayment').textContent=brl.format(originPayment);
  $('portUpdatedBalance').textContent=brl.format(updatedBalance);
  $('portOriginRate').textContent=(current.i*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'% a.m.';
  $('portDestinationRate').textContent=(destinationRate*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'% a.m.';
  $('portGraceDays').textContent=destinationFirstPeriodDays.toLocaleString('pt-BR')+' dias';
  const difference=destinationPayment-originPayment;
  const updateText=informedEffective?' Saldo atualizado por '+balanceUpdateDays.toLocaleString('pt-BR')+' dias até a efetivação.':' Saldo informado usado sem atualização até a efetivação.';
  const paymentText=Math.abs(difference)<0.005?'A parcela estimada permanece igual.':difference<0?'Redução estimada de '+brl.format(-difference)+' por parcela.':'Aumento estimado de '+brl.format(difference)+' por parcela.';
  $('resultExtra').textContent=paymentText+updateText+' Carência de '+destinationFirstPeriodDays.toLocaleString('pt-BR')+' dias projetada na parcela do destino. Portabilidade sem incidência de IOF.';
  $('result').classList.remove('hidden');
}catch(err){$('result').classList.add('hidden');$('error').textContent=err.message;}});
$('clear').addEventListener('click',()=>{form.reset();['pv','pmt','n','i','portI','portEffectiveDate','portFirstDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('result').classList.add('hidden');$('evolution').classList.add('hidden');$('error').textContent='';current=null;updateCalculateState();});
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

function simulationFieldState(id){
  const raw=$(id).value.trim();
  if(raw===''){ $(id).classList.remove('field-valid','field-invalid'); return 'empty'; }
  const value=parseBRNumber(raw),valid=Number.isFinite(value)&&value>0;
  updateFieldState(id,valid); return valid?'valid':'invalid';
}
function validateSimulation(){
  const states=['simAmount','simN','simPmt'].map(simulationFieldState);
  const rateValue=parseBRNumber($('simI').value),rateOk=Number.isFinite(rateValue)&&rateValue>0;
  updateFieldState('simI',rateOk);
  const balanceOk=simulationKind==='new'||simulationFieldState('simBalance')==='valid';
  for(const id of ['simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue']){
    const raw=$(id).value.trim(),valid=raw===''||validDate(raw);
    $(id).classList.toggle('field-valid',raw!==''&&valid);$(id).classList.toggle('field-invalid',raw!==''&&!valid);
  }
  $('simulate').disabled=!(rateOk&&balanceOk&&states.filter(x=>x==='valid').length===2&&states.filter(x=>x==='empty').length===1);
}
['simAmount','simBalance','simN','simPmt','simI','simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'].forEach(id=>$(id).addEventListener('input',validateSimulation));

function simulateCreditInputs(requestedAmount,periods,monthlyRate,contractDate,firstDue,originalContractDate,originalFinalDue){
  return simulateCredit({kind:simulationKind,requestedAmount,outstandingBalance:simulationKind==='renewal'?parseBRNumber($('simBalance').value):0,periods,monthlyRate,contractDate,firstDue,originalContractDate,originalFinalDue});
}
function solveSimulationMissing({amount,n,pmt,rate,contractDate,firstDue,originalContractDate,originalFinalDue}){
  if(pmt===null)return {result:simulateCreditInputs(amount,n,rate,contractDate,firstDue,originalContractDate,originalFinalDue),solved:'pmt'};
  if(amount===null){
    let lo=0.01,hi=Math.max(pmt*n*2,1000),candidate;
    for(let k=0;k<80;k++){const mid=(lo+hi)/2;candidate=simulateCreditInputs(mid,n,rate,contractDate,firstDue,originalContractDate,originalFinalDue);if(candidate.payment>pmt)hi=mid;else lo=mid;}
    candidate=simulateCreditInputs((lo+hi)/2,n,rate,contractDate,firstDue,originalContractDate,originalFinalDue);
    if(Math.abs(candidate.payment-pmt)>0.05)throw new Error('Não foi possível encontrar um valor contratado compatível com a parcela informada.');
    return {result:candidate,solved:'amount'};
  }
  if(n===null){
    let best=null;
    for(let periods=1;periods<=600;periods++){const candidate=simulateCreditInputs(amount,periods,rate,contractDate,firstDue,originalContractDate,originalFinalDue);const diff=Math.abs(candidate.payment-pmt);if(!best||diff<best.diff)best={result:candidate,diff};}
    if(!best||best.diff>Math.max(0.05,pmt*0.005))throw new Error('A parcela informada não corresponde a um prazo inteiro entre 1 e 600 meses.');
    return {result:best.result,solved:'n'};
  }
  throw new Error('Deixe exatamente um entre valor contratado, prazo e parcela mensal em branco.');
}

$('simulateForm').addEventListener('submit',e=>{
  e.preventDefault();$('simulateError').textContent='';$('simulationResult').classList.add('hidden');
  try{
    validateSimulation();if($('simulate').disabled)throw new Error('Informe a taxa mensal e exatamente dois entre valor contratado, prazo e parcela mensal.');
    for(const id of ['simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
    const originalDateRaw=$('simOriginalContractDate').value.trim(),originalFinalRaw=$('simOriginalFinalDue').value.trim();
    if(simulationKind==='renewal'&&((originalDateRaw&&!originalFinalRaw)||(!originalDateRaw&&originalFinalRaw)))throw new Error('Para refinar o IOF do saldo, informe as duas datas da operação original.');
    const contractDate=parseDateBR($('simContractDate').value)??new Date(),firstDue=parseDateBR($('simFirstDue').value)??defaultNextDue(contractDate);
    if(firstDue<=contractDate)throw new Error('O primeiro vencimento deve ser posterior à data da contratação.');
    const originalContractDate=simulationKind==='renewal'?parseDateBR($('simOriginalContractDate').value):null,originalFinalDue=simulationKind==='renewal'?parseDateBR($('simOriginalFinalDue').value):null;
    const amount=parseBRNumber($('simAmount').value),n=parseBRNumber($('simN').value),pmt=parseBRNumber($('simPmt').value),rate=parseBRNumber($('simI').value)/100;
    if(n!==null&&!Number.isInteger(n))throw new Error('O prazo deve ser um número inteiro de parcelas.');
    const solved=solveSimulationMissing({amount,n,pmt,rate,contractDate,firstDue,originalContractDate,originalFinalDue}),result=solved.result;
    if(solved.solved==='amount')$('simAmount').value=result.requestedAmount.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    if(solved.solved==='n')$('simN').value=String(result.firstPeriodDays>=0?Math.round((result.financedAmount&&result.payment)?(()=>{for(let x=1;x<=600;x++){try{const r=simulateCreditInputs(result.requestedAmount,x,rate,contractDate,firstDue,originalContractDate,originalFinalDue);if(Math.abs(r.payment-result.payment)<0.01)return x;}catch{}}return n;})():n):n);
    $('simPmt').value=result.payment.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
    $('simPayment').textContent=brl.format(result.payment);$('simFinanced').textContent=brl.format(result.financedAmount);$('simIof').textContent=brl.format(result.iof);$('simReleased').textContent=brl.format(result.requestedAmount);$('simOldBalanceIof').textContent=brl.format(result.outstandingIof);
    $('simOldBalanceIofStat').classList.toggle('hidden',simulationKind!=='renewal');$('simReleasedLabel').textContent=simulationKind==='renewal'?'Valor liberado':'Valor contratado';$('simRenewalStat').classList.toggle('hidden',simulationKind==='new');
    $('simAssumption').textContent=simulationKind==='renewal'?(result.outstandingIofMode==='informed'?'IOF do saldo renovado estimado pelo período complementar até o limite de 365 dias, sem repetir o adicional de 0,38%. '+result.complementaryDays+' dias complementares considerados. Primeiro vencimento em '+formatDateBR(firstDue)+'.':'IOF do saldo renovado aproximado assumindo 180 dias já tributados na operação original. Informe as datas da operação original em “Aumente a precisão” para refinar. Primeiro vencimento em '+formatDateBR(firstDue)+'.'):'IOF estimado incluído no valor financiado. Primeiro vencimento em '+formatDateBR(firstDue)+'.';
    $('simulationResult').classList.remove('hidden');renderInsights('simulation',{...result,kind:simulationKind,outstandingBalance:simulationKind==='renewal'?parseBRNumber($('simBalance').value):0});validateSimulation();
  }catch(err){$('simulateError').textContent=err.message;}
});
$('clearSimulation').addEventListener('click',()=>{$('simulateForm').reset();['simAmount','simBalance','simN','simPmt','simI','simContractDate','simFirstDue','simOriginalContractDate','simOriginalFinalDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('simulateError').textContent='';$('simulationResult').classList.add('hidden');setSimulationKind('new');});
setSimulationKind('new');

function validateAmortization(){
  const ids=['amPv','amPmt','amN','amI','amExtra'];
  const ok=ids.every(id=>{const value=parseBRNumber($(id).value);const valid=Number.isFinite(value)&&value>0;updateFieldState(id,valid);return valid;});
  const pv=parseBRNumber($('amPv').value),extra=parseBRNumber($('amExtra').value);
  const extraOk=Number.isFinite(extra)&&Number.isFinite(pv)&&extra>0&&extra<pv;
  if($('amExtra').value.trim()!=='')updateFieldState('amExtra',extraOk);
  $('amortize').disabled=!(ok&&extraOk);
}
['amPv','amPmt','amN','amI','amExtra','amBaseDate','amDue'].forEach(id=>$(id).addEventListener('input',validateAmortization));
$('amortizeForm').addEventListener('submit',e=>{
  e.preventDefault();$('amortizeError').textContent='';$('amortizationResult').classList.add('hidden');
  try{
    validateAmortization();if($('amortize').disabled)throw new Error('Preencha os campos essenciais com valores válidos. A amortização deve ser menor que o saldo.');
    for(const id of ['amBaseDate','amDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
    const amBase=parseDateBR($('amBaseDate').value),amDue=parseDateBR($('amDue').value);
    const firstPeriodDays=amBase&&amDue?daysBetween(amBase,amDue):30;
    if(firstPeriodDays<=0)throw new Error('O próximo vencimento deve ser posterior à data do saldo.');
    const r=amortizeBalance({principal:parseBRNumber($('amPv').value),currentPayment:parseBRNumber($('amPmt').value),remainingPeriods:parseBRNumber($('amN').value),monthlyRate:parseBRNumber($('amI').value)/100,extraPayment:parseBRNumber($('amExtra').value),firstPeriodDays});
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
  $('amortizeForm').reset();['amPv','amPmt','amN','amI','amExtra','amBaseDate','amDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));
  $('amortizeError').textContent='';$('amortizationResult').classList.add('hidden');validateAmortization();
});
validateAmortization();


function validateComparison(){
  const ids=['cmpAAmount','cmpAPayment','cmpAN','cmpAI','cmpBAmount','cmpBPayment','cmpBN','cmpBI'];
  const ok=ids.every(id=>{const value=parseBRNumber($(id).value);const valid=Number.isFinite(value)&&value>0;updateFieldState(id,valid);return valid;});
  $('compare').disabled=!ok;
}
['cmpAAmount','cmpAPayment','cmpAN','cmpAI','cmpBAmount','cmpBPayment','cmpBN','cmpBI','cmpAIOF','cmpBIOF','cmpAContractDate','cmpAFirstDue','cmpBContractDate','cmpBFirstDue'].forEach(id=>$(id).addEventListener('input',validateComparison));
function signedMoney(value){return (value>0?'+ ':'− ')+brl.format(Math.abs(value));}
function signedPctValue(value){if(value===null||Math.abs(value)<1e-12)return 'sem variação';return (value>0?'+ ':'− ')+Math.abs(value*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';}
$('compareForm').addEventListener('submit',e=>{
  e.preventDefault();$('compareError').textContent='';$('comparisonResult').classList.add('hidden');
  try{
    validateComparison();if($('compare').disabled)throw new Error('Preencha todos os dados das duas alternativas com valores válidos.');
    for(const id of ['cmpAContractDate','cmpAFirstDue','cmpBContractDate','cmpBFirstDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
    const readOption=p=>{const iof=parseBRNumber($(p+'IOF').value)??0;return {amount:parseBRNumber($(p+'Amount').value),payment:parseBRNumber($(p+'Payment').value),periods:parseBRNumber($(p+'N').value),monthlyRate:parseBRNumber($(p+'I').value)/100,iof,financedAmount:parseBRNumber($(p+'Amount').value)+iof};};
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
    renderInsights('comparison',r);
  }catch(err){$('compareError').textContent=err.message;}
});
$('clearComparison').addEventListener('click',()=>{$('compareForm').reset();['cmpAAmount','cmpAPayment','cmpAN','cmpAI','cmpBAmount','cmpBPayment','cmpBN','cmpBI','cmpAIOF','cmpBIOF','cmpAContractDate','cmpAFirstDue','cmpBContractDate','cmpBFirstDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('compareError').textContent='';$('comparisonResult').classList.add('hidden');validateComparison();});
validateComparison();


function validateExchange(){
  const required=['exBalance','exCurrentPayment','exCurrentN','exNewPayment','exNewN'];
  const ok=required.every(id=>{const v=parseBRNumber($(id).value),valid=Number.isFinite(v)&&v>0;updateFieldState(id,valid);return valid;});
  for(const id of ['exCashBack','exFees','exNewIof']){const raw=$(id).value.trim(),v=parseBRNumber(raw),valid=raw===''||(Number.isFinite(v)&&v>=0);$(id).classList.toggle('field-valid',raw!==''&&valid);$(id).classList.toggle('field-invalid',raw!==''&&!valid);}
  $('exchange').disabled=!ok;
}
['exBalance','exCurrentPayment','exCurrentN','exNewPayment','exNewN','exCashBack','exFees','exCurrentI','exNewI','exNewIof','exBaseDate','exCurrentDue','exNewContractDate','exNewFirstDue'].forEach(id=>$(id).addEventListener('input',validateExchange));
$('exchangeForm').addEventListener('submit',e=>{
  e.preventDefault();$('exchangeError').textContent='';$('exchangeResult').classList.add('hidden');
  try{
    validateExchange();if($('exchange').disabled)throw new Error('Preencha os dados essenciais com valores válidos.');
    const r=debtExchange({
      currentBalance:parseBRNumber($('exBalance').value),
      currentPayment:parseBRNumber($('exCurrentPayment').value),
      currentPeriods:parseBRNumber($('exCurrentN').value),
      newPayment:parseBRNumber($('exNewPayment').value),
      newPeriods:parseBRNumber($('exNewN').value),
      cashBack:parseBRNumber($('exCashBack').value)??0,
      fees:parseBRNumber($('exFees').value)??0,
      currentRate:(parseBRNumber($('exCurrentI').value)??0)/100,
      newRate:(parseBRNumber($('exNewI').value)??0)/100,
      currentFirstPeriodDays:parseDateBR($('exBaseDate').value)&&parseDateBR($('exCurrentDue').value)?daysBetween(parseDateBR($('exBaseDate').value),parseDateBR($('exCurrentDue').value)):30,
      newFirstPeriodDays:parseDateBR($('exNewContractDate').value)&&parseDateBR($('exNewFirstDue').value)?daysBetween(parseDateBR($('exNewContractDate').value),parseDateBR($('exNewFirstDue').value)):30,
      newIof:parseBRNumber($('exNewIof').value)??0
    });
    $('exCurrentTotal').textContent=brl.format(r.currentRemaining);$('exNewTotal').textContent=brl.format(r.newRemaining);
    $('exPaymentDiff').textContent=signedMoney(r.paymentDifference);
    $('exPeriodDiff').textContent=r.periodDifference===0?'Mesmo prazo':(r.periodDifference>0?'+ ':'− ')+Math.abs(r.periodDifference).toLocaleString('pt-BR')+' parcelas';
    const positive=r.financialDifference>=0;
    $('exFinancialResult').textContent=(positive?'Economia nominal de ':'Acréscimo nominal de ')+brl.format(Math.abs(r.financialDifference));
    const cash=r.cashBack>0?' considerando '+brl.format(r.cashBack)+' de valor adicional liberado':'';
    $('exSummary').textContent='A nova operação '+(r.paymentDifference<0?'reduz':'aumenta')+' a parcela em '+brl.format(Math.abs(r.paymentDifference))+cash+'.';
    $('exchangeResult').classList.remove('hidden');
    renderInsights('exchange',r);
  }catch(err){$('exchangeError').textContent=err.message;}
});
$('clearExchange').addEventListener('click',()=>{$('exchangeForm').reset();['exBalance','exCurrentPayment','exCurrentN','exNewPayment','exNewN','exCashBack','exFees','exCurrentI','exNewI','exNewIof','exBaseDate','exCurrentDue','exNewContractDate','exNewFirstDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('exchangeError').textContent='';$('exchangeResult').classList.add('hidden');validateExchange();});
validateExchange();


function validateConverter(){
  const amountState=essentialFieldState('cvAmount'),paymentState=essentialFieldState('cvPayment');
  const n=parseBRNumber($('cvN').value),rate=parseBRNumber($('cvI').value);
  updateFieldState('cvAmount',amountState==='valid');updateFieldState('cvPayment',paymentState==='valid');
  updateFieldState('cvN',Number.isFinite(n)&&n>0);updateFieldState('cvI',Number.isFinite(rate)&&rate>0);
  const oneFinancial=(amountState==='valid'&&paymentState==='empty')||(paymentState==='valid'&&amountState==='empty');
  $('convertCredit').disabled=!(oneFinancial&&Number.isFinite(n)&&n>0&&Number.isFinite(rate)&&rate>0);
}
['cvAmount','cvPayment','cvN','cvI','cvContractDate','cvFirstDue','cvIncludeIof'].forEach(id=>$(id).addEventListener('input',validateConverter));
$('converterForm').addEventListener('submit',e=>{
  e.preventDefault();$('converterError').textContent='';$('converterResult').classList.add('hidden');
  try{
    validateConverter();if($('convertCredit').disabled)throw new Error('Informe prazo, taxa e apenas valor do crédito ou valor da parcela.');
    for(const id of ['cvContractDate','cvFirstDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
    const amount=parseBRNumber($('cvAmount').value),pmtValue=parseBRNumber($('cvPayment').value),n=parseBRNumber($('cvN').value),i=parseBRNumber($('cvI').value)/100;
    const contractDate=parseDateBR($('cvContractDate').value)??new Date(),firstDue=parseDateBR($('cvFirstDue').value)??defaultNextDue(contractDate);
    const firstDays=daysBetween(contractDate,firstDue); if(firstDays<=0)throw new Error('O primeiro vencimento deve ser posterior à data da contratação.');
    const findingAmount=amount===null,includeIof=$('cvIncludeIof').checked;
    const fraction=firstDays/30,annuity=(1-Math.pow(1+i,-n))/i*(1+i)/Math.pow(1+i,fraction);
    let result,finalAmount,finalPayment;
    if(includeIof){
      if(findingAmount){
        let lo=0,hi=pmtValue*n;
        for(let k=0;k<80;k++){const mid=(lo+hi)/2;const sim=simulateCredit({kind:'new',requestedAmount:mid,periods:n,monthlyRate:i,contractDate,firstDue});if(sim.payment>pmtValue)hi=mid;else lo=mid;}
        result=(lo+hi)/2;finalAmount=result;finalPayment=pmtValue;
      }else{
        const sim=simulateCredit({kind:'new',requestedAmount:amount,periods:n,monthlyRate:i,contractDate,firstDue});
        result=sim.payment;finalAmount=amount;finalPayment=result;
      }
    }else{
      result=findingAmount?pmtValue*annuity:amount/annuity;finalAmount=findingAmount?result:amount;finalPayment=findingAmount?pmtValue:result;
    }
    $('cvResultLabel').textContent=findingAmount?'Valor de crédito estimado':'Parcela estimada';
    $('cvResultValue').textContent=brl.format(result);$('cvResultN').textContent=n.toLocaleString('pt-BR')+' parcelas';
    $('cvResultI').textContent=(i*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'% a.m.';
    $('cvResultTotal').textContent=brl.format(finalPayment*n);
    $('converterResult').classList.remove('hidden');
    renderInsights('converter',{findingAmount,result,payment:finalPayment,periods:n});
  }catch(err){$('converterError').textContent=err.message;}
});
$('clearConverter').addEventListener('click',()=>{$('converterForm').reset();['cvAmount','cvPayment','cvN','cvI','cvContractDate','cvFirstDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('converterError').textContent='';$('converterResult').classList.add('hidden');validateConverter();});
validateConverter();


function validateCreditAmort(){
  const ids=['caBalance','caCurrentPayment','caCurrentN','caCurrentI','caNewAmount','caNewN','caNewI'];
  const ok=ids.every(id=>{const v=parseBRNumber($(id).value),valid=Number.isFinite(v)&&v>0;updateFieldState(id,valid);return valid;});
  const balance=parseBRNumber($('caBalance').value),amount=parseBRNumber($('caNewAmount').value);
  const amountOk=Number.isFinite(amount)&&Number.isFinite(balance)&&amount>0&&amount<balance;
  if($('caNewAmount').value.trim()!=='')updateFieldState('caNewAmount',amountOk);
  $('creditAmortize').disabled=!(ok&&amountOk);
}
['caBalance','caCurrentPayment','caCurrentN','caCurrentI','caNewAmount','caNewN','caNewI','caBaseDate','caCurrentDue','caContractDate','caFirstDue'].forEach(id=>$(id).addEventListener('input',validateCreditAmort));
$('creditAmortForm').addEventListener('submit',e=>{
  e.preventDefault();$('creditAmortError').textContent='';$('creditAmortResult').classList.add('hidden');
  try{
    validateCreditAmort();if($('creditAmortize').disabled)throw new Error('Preencha os dados essenciais com valores válidos. O novo crédito deve ser menor que o saldo a amortizar.');
    for(const id of ['caBaseDate','caCurrentDue','caContractDate','caFirstDue'])if(!validDate($(id).value))throw new Error('Informe uma data válida no formato DD/MM/AAAA.');
    const base=parseDateBR($('caBaseDate').value),currentDue=parseDateBR($('caCurrentDue').value);
    const contractDate=parseDateBR($('caContractDate').value)??new Date(),firstDue=parseDateBR($('caFirstDue').value)??defaultNextDue(contractDate);
    const targetFirstPeriodDays=base&&currentDue?daysBetween(base,currentDue):30;
    if(targetFirstPeriodDays<=0||firstDue<=contractDate)throw new Error('Os próximos vencimentos devem ser posteriores às respectivas datas-base.');
    const r=creditToAmortize({
      targetBalance:parseBRNumber($('caBalance').value),targetPayment:parseBRNumber($('caCurrentPayment').value),
      targetPeriods:parseBRNumber($('caCurrentN').value),targetRate:parseBRNumber($('caCurrentI').value)/100,
      newCreditAmount:parseBRNumber($('caNewAmount').value),newCreditPeriods:parseBRNumber($('caNewN').value),
      newCreditRate:parseBRNumber($('caNewI').value)/100,contractDate,firstDue,targetFirstPeriodDays
    });
    $('caNewPayment').textContent=brl.format(r.credit.payment);$('caIof').textContent=brl.format(r.credit.iof);
    $('caEconomyTerm').textContent=(r.economyTerm>=0?'Economia de ':'Acréscimo de ')+brl.format(Math.abs(r.economyTerm));
    $('caEconomyPayment').textContent=(r.economyPayment>=0?'Economia de ':'Acréscimo de ')+brl.format(Math.abs(r.economyPayment));
    $('caTermDetail').textContent='saldo amortizado para '+brl.format(r.amort.newBalance)+' e prazo estimado em '+Math.ceil(r.amort.reducedPeriods)+' parcelas';
    $('caPaymentDetail').textContent='nova parcela da dívida amortizada: '+brl.format(r.amort.newPayment);
    const best=r.economyTerm>=r.economyPayment?r.economyTerm:r.economyPayment;
    $('caSummary').textContent='O cálculo compara o fluxo restante da dívida atual com a soma do novo crédito e do saldo após a amortização. '+(best>=0?'Há cenário com redução nominal de desembolso.':'Nos cenários calculados, o custo do novo crédito supera a economia gerada pela amortização.');
    $('creditAmortResult').classList.remove('hidden');
    renderInsights('creditAmortization',r);
  }catch(err){$('creditAmortError').textContent=err.message;}
});
$('clearCreditAmort').addEventListener('click',()=>{$('creditAmortForm').reset();['caBalance','caCurrentPayment','caCurrentN','caCurrentI','caNewAmount','caNewN','caNewI','caBaseDate','caCurrentDue','caContractDate','caFirstDue'].forEach(id=>$(id).classList.remove('field-valid','field-invalid'));$('creditAmortError').textContent='';$('creditAmortResult').classList.add('hidden');validateCreditAmort();});
validateCreditAmort();
