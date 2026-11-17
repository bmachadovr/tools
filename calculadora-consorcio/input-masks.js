"use strict";
// Valores monetários: digitação por centavos, da direita para a esquerda.
// Percentuais: entrada decimal tradicional (20,5 = 20,5%), com normalização no desfoque.
(function () {
  const percentIds = new Set([
    "c-taxa","c-reajuste","c-fintaxa","l-limite",
    "p-a-taxa","p-a-reserva","p-b-taxa","p-b-reserva"
  ]);
  const digitsFor = (input) => input.id === "c-fintaxa" ? 4 : 2;
  function group(integer) {
    return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  function moneyFromDigits(text) {
    let digits = String(text == null ? "" : text).replace(/\D/g, "");
    if (!digits) return "";
    digits = digits.replace(/^0+(?=\d)/, "");
    const padded = digits.padStart(3,"0");
    return group(padded.slice(0,-2)) + "," + padded.slice(-2);
  }
  function percentFromText(text, limit, pad) {
    const raw = String(text == null ? "" : text).replace(/[^\d,.]/g,"");
    if (!raw || !/\d/.test(raw)) return "";
    const comma = raw.lastIndexOf(","), dot = raw.lastIndexOf(".");
    let pos = comma >= 0 ? comma : (dot >= 0 && raw.indexOf(".") === dot ? dot : -1);
    const left = (pos<0 ? raw : raw.slice(0,pos)).replace(/\D/g,"").replace(/^0+(?=\d)/,"") || "0";
    let fraction = pos < 0 ? "" : raw.slice(pos+1).replace(/\D/g,"").slice(0,limit);
    if (pad) fraction = fraction.padEnd(limit,"0");
    return group(left) + (pos >= 0 || pad ? "," + fraction : "");
  }
  function normaliseExisting(input) {
    const raw = String(input.value||"").trim();
    if (!raw) return "";
    if (percentIds.has(input.id)) return percentFromText(raw,digitsFor(input),true);
    // Os valores atribuídos pelo código e exemplos são valores absolutos, não digitação.
    // Distinguir 100000 (100.000,00) de teclas individuais (cêntimos).
    const stripped=raw.replace(/[^\d,.-]/g,"");
    let numeric;
    if (stripped.includes(",")) numeric=Number(stripped.replace(/\./g,"").replace(",","."));
    else if (/^\d{1,3}(\.\d{3})+$/.test(stripped)) numeric=Number(stripped.replace(/\./g,""));
    else numeric=Number(stripped);
    if (!Number.isFinite(numeric) || numeric<0) return "";
    const cents=Math.round(numeric*100);
    return moneyFromDigits(String(cents));
  }
  function attach(input) {
    input.autocomplete="off";
    input.addEventListener("input", (event) => {
      if(event.isComposing)return;
      const previous=input.value;
      const formatted=percentIds.has(input.id)
        ?percentFromText(previous,digitsFor(input),false)
        :moneyFromDigits(previous);
      if(previous===formatted)return;
      input.value=formatted;
      // Em máscara monetária centesimal o cursor permanece ao fim.
      if(typeof input.setSelectionRange==="function" && document.activeElement===input) {
        try{input.setSelectionRange(formatted.length,formatted.length);}catch(_){}
      }
    },true);
    input.addEventListener("blur",()=>{
      if(!input.value.trim())return;
      const next=percentIds.has(input.id)
        ?percentFromText(input.value,digitsFor(input),true)
        :moneyFromDigits(input.value);
      if(next===input.value)return;
      input.value=next;
      input.dispatchEvent(new Event("input",{bubbles:true}));
    });
  }
  function formatAll(){
    document.querySelectorAll('input[inputmode="decimal"]').forEach(input=>{
      if(input.value.trim())input.value=normaliseExisting(input);
    });
  }
  document.querySelectorAll('input[inputmode="decimal"]').forEach(attach);
  window.ConsorcioMasks={formatAll,moneyFromDigits};
}());
