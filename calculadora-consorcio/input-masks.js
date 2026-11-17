"use strict";
// Máscara pt-BR: valores monetários com dois decimais e taxas percentuais
// com duas casas (quatro na taxa mensal/anual do financiamento inverso).
// Digitação não converte "1000" em "10,00": preserva o valor pretendido.
(function () {
  const percentIds = new Set([
    "c-taxa", "c-reajuste", "c-fintaxa", "l-limite",
    "p-a-taxa", "p-a-reserva", "p-b-taxa", "p-b-reserva"
  ]);
  const places = (input) => input.id === "c-fintaxa" ? 4 : 2;

  function format(raw, digits, complete) {
    const clean = String(raw == null ? "" : raw).replace(/[^0-9.,]/g, "");
    if (!clean || !/[0-9]/.test(clean)) return "";
    const comma = clean.lastIndexOf(",");
    const lastDot = clean.lastIndexOf(".");
    let separator = -1;
    if (comma >= 0) separator = comma;
    else if (lastDot >= 0) {
      const tail = clean.slice(lastDot + 1);
      const dots = (clean.match(/\./g) || []).length;
      // Um ponto seguido de três algarismos é separador de milhar em pt-BR.
      if (tail.length !== 3 && tail.length <= digits && (dots === 1 || tail.length === 0)) separator = lastDot;
    }
    const initial = separator < 0 ? clean : clean.slice(0, separator);
    const integerDigits = initial.replace(/\D/g, "").replace(/^0+(?=\d)/, "") || "0";
    const integer = integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (separator < 0) return complete ? integer + "," + "0".repeat(digits) : integer;
    let fractional = clean.slice(separator + 1).replace(/\D/g, "").slice(0, digits);
    if (complete) fractional = fractional.padEnd(digits, "0");
    return integer + "," + fractional;
  }

  function attach(input) {
    const digits = places(input);
    input.autocomplete = "off";
    input.addEventListener("input", (event) => {
      if (event.isComposing) return;
      const old = input.value;
      const formatted = format(old, digits, false);
      if (old === formatted) return;
      const selection = typeof input.selectionStart === "number" ? input.selectionStart : old.length;
      const significant = (old.slice(0, selection).match(/[0-9]/g) || []).length;
      input.value = formatted;
      if (typeof input.setSelectionRange === "function" && document.activeElement === input) {
        let seen = 0, cursor = formatted.length;
        for (let i = 0; i < formatted.length; i++) {
          if (/[0-9]/.test(formatted[i])) seen++;
          if (seen === significant) { cursor = i + 1; break; }
        }
        try { input.setSelectionRange(cursor, cursor); } catch (_) { /* Teclado sem seleção */ }
      }
    }, true);

    input.addEventListener("blur", () => {
      if (input.value.trim() === "") return;
      const formatted = format(input.value, digits, true);
      if (input.value === formatted) return;
      input.value = formatted;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  function formatAll() {
    document.querySelectorAll('input[inputmode="decimal"]').forEach((input) => {
      if (input.value.trim()) input.value = format(input.value, places(input), true);
    });
  }

  document.querySelectorAll('input[inputmode="decimal"]').forEach(attach);
  window.ConsorcioMasks = { formatAll };
}());
