// Exemplos exclusivamente demonstrativos. Nenhum dado é transmitido ao servidor.
const $ = id => document.getElementById(id);
const activeExamples = new Set();
const tools = {
  credit: {
    clear: 'clearSimulation',
    values: { simAmount: '10.000,00', simN: '36', simPmt: '', simI: '1,80' }
  },
  portability: {
    clear: 'clear',
    values: { pv: '30.000,00', pmt: '', n: '36', i: '1,60', portI: '1,20' }
  },
  exchange: {
    clear: 'clearExchange',
    values: {
      exBalance: '15.000,00', exCurrentPayment: '650,00', exCurrentN: '30',
      exNewPayment: '690,00', exNewN: '36', exNewAmount: '18.000,00',
      exAmortizeAmount: '10.000,00', exCurrentI: '1,80', exNewI: '1,70'
    }
  },
  amortization: {
    clear: 'clearAmortization',
    values: { amPv: '15.000,00', amPmt: '650,00', amN: '30', amI: '1,80', amExtra: '5.000,00' }
  },
  future: { clear: 'clearUpdate', values: {} }
};
const contextToTool = {
  simulation: 'credit', comparison: 'portability', exchange: 'exchange',
  amortization: 'amortization', futureBalance: 'future'
};

export function isExampleContext(context) {
  return activeExamples.has(contextToTool[context]);
}

function dayString(date) {
  return date.toLocaleDateString('pt-BR');
}
function plusDays(from, number) {
  const date = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  date.setDate(date.getDate() + number);
  return date;
}
function plusMonths(from, months) {
  const date = new Date(from.getFullYear(), from.getMonth() + months, 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(from.getDate(), lastDay));
  return date;
}
function valuesFor(key) {
  if(key!=='future') return tools[key].values;
  const today = new Date();
  return {
    upPv: '15.000,00', upPmt: '650,00', upN: '30', upI: '1,80',
    upBaseDate: dayString(today), upDue: dayString(plusDays(today,30)),
    updateDate: dayString(plusMonths(today,6))
  };
}
function setStatus(key, active) {
  const note = document.querySelector('[data-example-status="'+key+'"]');
  if(!note) return;
  note.hidden = !active;
}

function fillExample(key) {
  const spec = tools[key];
  if(!spec) return;
  // Usa a limpeza existente para não misturar um caso demonstrativo com outro.
  $(spec.clear).click();
  if(key==='exchange') document.querySelector('[data-exchange-mode="payment"]')?.click();
  for (const [id,value] of Object.entries(valuesFor(key))) {
    const input=$(id);
    if(!input) continue;
    input.value=value;
    input.dispatchEvent(new Event('input',{bubbles:true}));
  }
  activeExamples.add(key);
  setStatus(key,true);
  const first = key==='future' ? 'upPv' : Object.keys(valuesFor(key))[0];
  $(first)?.focus({preventScroll:true});
}

export function initGuidedExamples({goTool}) {
  for(const [key,spec] of Object.entries(tools)){
    $(spec.clear)?.addEventListener('click',()=>{
      activeExamples.delete(key);
      setStatus(key,false);
    });
  }
  document.querySelectorAll('[data-example]').forEach(button => {
    button.addEventListener('click',()=>{
      const key=button.dataset.example;
      if(key==='offer'){
        fillExample('credit');
        $('simulate').click();
        // Aguarda o foco do resultado, definido pelo simulador, antes de trocar de ferramenta.
        window.setTimeout(()=>goTool(5),100);
      } else {
        fillExample(key);
      }
    });
  });
}

export function explainResult(id, paragraphs, context) {
  const root=$(id);
  if(!root)return;
  let section=root.querySelector('.result-explanation');
  if(!section){
    section=document.createElement('section');
    section.className='result-explanation';
    const title=document.createElement('h3');
    title.textContent='Entenda o resultado';
    section.appendChild(title);
    const next=root.querySelector('.next');
    if(next)root.insertBefore(section,next);
    else root.appendChild(section);
  }
  section.replaceChildren();
  const title=document.createElement('h3');
  title.textContent='Entenda o resultado';
  section.appendChild(title);
  if(isExampleContext(context)){
    const note=document.createElement('p');
    note.className='example-result-warning';
    note.textContent='Resultado ilustrativo, feito com dados fictícios. Não use para apresentar uma oferta real.';
    section.appendChild(note);
  }
  for(const line of paragraphs){
    if(!line)continue;
    const p=document.createElement('p');
    p.textContent=line;
    section.appendChild(p);
  }
}
