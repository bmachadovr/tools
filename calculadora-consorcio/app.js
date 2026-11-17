"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  const money = (value) => Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const pct = (value) => Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
  const numberBR = (value) => Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const examplesUsed = { comparar: false, lances: false, propostas: false };
  let lastAnalysis = null;

  function parseValue(value) {
    let text = String(value == null ? "" : value).trim().replace(/\s|R\$|%/g, "");
    if (!text) return NaN;
    if (text.includes(",") && text.includes(".")) {
      const comma = text.lastIndexOf(",");
      const dot = text.lastIndexOf(".");
      text = comma > dot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
    } else if (text.includes(",")) {
      text = text.replace(",", ".");
    } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
      text = text.replace(/\./g, "");
    }
    if (!/^-?\d+(\.\d+)?$/.test(text)) return NaN;
    return Number(text);
  }
  function read(id, required) {
    const field = $(id);
    if (!field) throw Error("Campo não encontrado: " + id);
    const raw = field.value.trim();
    if (!raw && !required) return 0;
    const value = parseValue(raw);
    if (!Number.isFinite(value) || value < 0) {
      throw Error("Informe um valor válido e não negativo em: " + field.closest("label").childNodes[0].textContent.trim() + ".");
    }
    return value;
  }
  function integer(id, required) {
    const value = read(id, required);
    if (!Number.isInteger(value) || value < 1 || value > 600) {
      throw Error("Informe uma quantidade de meses inteira entre 1 e 600.");
    }
    return value;
  }
  function positive(v, text) {
    if (!Number.isFinite(v) || v <= 0) throw Error("Informe " + text + " maior que zero.");
  }
  function escapeHtml(v) {
    return String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function resultMetrics(items) {
    return '<div class="metrics">' + items.map((item) => '<div class="metric"><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(String(item[1])) + '</strong></div>').join("") + '</div>';
  }
  function note(text, warn) {
    return '<div class="callout' + (warn ? ' warn' : '') + '">' + escapeHtml(text) + '</div>';
  }
  function table(headers, rows) {
    const header = '<thead><tr>' + headers.map((x) => '<th>' + escapeHtml(x) + '</th>').join("") + '</tr></thead>';
    const body = rows.map((row) => '<tr>' + row.map((x) => '<td>' + escapeHtml(String(x)) + '</td>').join("") + '</tr>').join("");
    return '<table class="compare-table">' + header + '<tbody>' + body + '</tbody></table>';
  }
  function updateResult(target, heading, main, sub, metrics, sections, notices) {
    $(target).innerHTML = '<div class="result-top"><span class="result-kicker">RESULTADO DA ANÁLISE</span><span class="status-pill">Cálculo orientativo</span></div>'
      + '<div class="hero-number">' + escapeHtml(main) + '<small>' + escapeHtml(heading) + '</small></div>'
      + '<p class="result-copy">' + escapeHtml(sub) + '</p>' + resultMetrics(metrics)
      + sections.join("") + notices.map((x) => note(x.text, x.warn)).join("")
      + '<div class="result-actions"><button type="button" class="to-offer">Gerar proposta com esta análise →</button></div>';
  }
  function setError(id, error) { $(id).textContent = error ? String(error.message || error) : ""; }
  function showTab(id) {
    document.querySelectorAll(".tab").forEach((button) => {
      const selected = button.dataset.tab === id;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".panel").forEach((panel) => {
      const selected = panel.id === "painel-" + id;
      panel.classList.toggle("active", selected);
      panel.hidden = !selected;
    });
    if (id === "oferta") renderOffer();
    const heading = $("painel-" + id).querySelector("h2");
    if (heading) heading.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function totalComReajuste(parcela, meses, anual) {
    if (anual === 0) return parcela * meses;
    let total = 0;
    const base = 1 + anual / 100;
    for (let m = 1; m <= meses; m++) total += parcela * Math.pow(base, Math.floor((m - 1) / 12));
    return total;
  }
  function setAnalysis(kind, rows, warnings) {
    lastAnalysis = { kind, rows, warnings, example: !!examplesUsed[kind] };
    renderOffer();
  }
  function explain(sectionTitle, contents) {
    return '<div class="result-section"><h4>' + escapeHtml(sectionTitle) + '</h4>' + contents + '</div>';
  }

  function roundCents(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  // A prestação financiada é calculada exclusivamente com a taxa mensal fornecida.
  // Tributos e despesas só entram quando informados e com sua forma de pagamento indicada.
  function calculateFinancing(principal, months, ratePercent, system) {
    if (!(principal > 0)) throw Error("O valor a financiar precisa ser maior que zero.");
    const rate = ratePercent / 100;
    let first = 0, last = 0, installmentsTotal = 0;
    if (system === "price") {
      const payment = roundCents(rate === 0
        ? principal / months
        : principal * rate / (-Math.expm1(-months * Math.log1p(rate))));
      first = last = payment;
      installmentsTotal = roundCents(payment * months);
    } else if (system === "sac") {
      const monthlyAmortization = principal / months;
      for (let month = 1; month <= months; month++) {
        const balanceBefore = principal - monthlyAmortization * (month - 1);
        const payment = roundCents(monthlyAmortization + balanceBefore * rate);
        if (month === 1) first = payment;
        if (month === months) last = payment;
        installmentsTotal += payment;
      }
      installmentsTotal = roundCents(installmentsTotal);
    } else {
      throw Error("Sistema de amortização inválido.");
    }
    return {
      principal, first, last, installmentsTotal,
      interestTotal: roundCents(installmentsTotal - principal),
      system
    };
  }

  function compare() {
    const bem = read("c-bem", true);
    const mesContemplacao = integer("c-contemplacao", true);
    const carta = read("c-carta", true), parcela = read("c-parcela", true);
    const prazo = integer("c-prazo", true);
    const lanceProprio = read("c-lance"), extras = read("c-extras");
    const reaj = read("c-reajuste");

    const entrada = read("c-entrada", true);
    const taxaFin = read("c-fintaxa", true);
    const finPrazo = integer("c-finprazo", true);
    const finSistema = $("c-sistema").value;
    const iof = read("c-finiof");
    const tarifasFinanciadas = read("c-fintarifas");
    const finExtras = read("c-finextras");

    [bem, carta, parcela].forEach((v) => positive(v, "os valores essenciais"));
    if (mesContemplacao > prazo) throw Error("O mês hipotético de contemplação não pode ultrapassar as prestações a pagar.");
    if (reaj > 100) throw Error("Informe reajuste anual de até 100% para evitar uma projeção inconsistente.");
    if (taxaFin > 100) throw Error("Confirme a taxa de juros do financiamento: o valor mensal informado ultrapassa 100%.");
    if (entrada >= bem) throw Error("A entrada precisa ser menor que o preço do bem para haver saldo a financiar.");

    const creditoFinanciadoDoBem = bem - entrada;
    const principalFinanciado = roundCents(creditoFinanciadoDoBem + iof + tarifasFinanciadas);
    const fin = calculateFinancing(principalFinanciado, finPrazo, taxaFin, finSistema);
    const totalFin = roundCents(fin.installmentsTotal + entrada + finExtras);

    const diferencaBem = Math.max(0, bem - carta);
    const sobra = Math.max(0, carta - bem);
    const totalParcelasCons = totalComReajuste(parcela, prazo, reaj);
    const totalCons = roundCents(totalParcelasCons + lanceProprio + extras + diferencaBem);
    const totalVista = bem;
    const diff = roundCents(Math.abs(totalCons - totalFin));
    const cheaper = totalCons < totalFin - 0.005 ? "consórcio" : totalFin < totalCons - 0.005 ? "financiamento" : "mesmo valor nominal";
    const headline = cheaper === "mesmo valor nominal" ? "Mesmo custo estimado" : money(diff);
    const heading = cheaper === "mesmo valor nominal" ? "nas premissas informadas" : "diferença nominal — menor no " + cheaper;
    const labelSistema = finSistema === "price" ? "Price" : "SAC";
    const parcelaResumo = finSistema === "price"
      ? "Prestação calculada: " + money(fin.first)
      : "1ª parcela: " + money(fin.first) + " / última: " + money(fin.last);
    const rows = [
      ["Consórcio", money(totalCons), "Mês " + mesContemplacao + " (hipótese)"],
      ["Financiamento " + labelSistema, money(totalFin), "Após aprovação"],
      ["Compra à vista", money(totalVista), "No pagamento"]
    ];
    const tableHtml = table(["Alternativa", "Desembolso nominal", "Acesso ao bem"], rows);

    const financiamentos = [
      ["Preço do bem", money(bem)],
      ["Entrada", money(entrada)],
      ["Preço financiado", money(creditoFinanciadoDoBem)],
      ["IOF incluído no saldo", money(iof)],
      ["Outras despesas financiadas", money(tarifasFinanciadas)],
      ["Total financiado", money(fin.principal)],
      [finSistema === "price" ? "Parcela mensal" : "Primeira / última parcela",
        finSistema === "price" ? money(fin.first) : money(fin.first) + " / " + money(fin.last)],
      ["Total de juros nas parcelas", money(fin.interestTotal)],
      ["Total das prestações", money(fin.installmentsTotal)],
      ["Entrada + despesas pagas à vista", money(entrada + finExtras)],
      ["Desembolso total", money(totalFin)]
    ];

    const notices = [
      { text: "Contemplação no mês " + mesContemplacao + " é hipótese, não previsão. O financiamento permite adquirir o bem após contratação e aprovação, enquanto o consórcio depende da contemplação e das condições de liberação.", warn: true },
      { text: "Financiamento " + labelSistema + " calculado a " + pct(taxaFin) + " ao mês em " + finPrazo + " prestações. " + parcelaResumo + ". Juros estimados: " + money(fin.interestTotal) + ". A taxa informada não equivale automaticamente ao CET.", warn: false },
      { text: "Consórcio: " + money(totalParcelasCons) + " em prestações, " + money(lanceProprio) + " em lance próprio, " + money(diferencaBem) + " para completar a compra e " + money(extras) + " em despesas externas.", warn: false }
    ];
    const costsEmpty = ["c-finiof", "c-fintarifas", "c-finextras"].some((id) => !$(id).value.trim());
    if (costsEmpty) notices.push({
      text: "Alguns campos de IOF, tarifas ou despesas do financiamento não foram preenchidos e entraram como zero. Isso NÃO significa isenção: confira os custos reais antes de considerar a comparação completa.",
      warn: true
    });
    if (sobra > 0) notices.push({ text: "A carta excede o preço do bem em " + money(sobra) + ". Esse saldo não foi tratado como dinheiro livre ou abatimento automático; sua destinação depende do contrato.", warn: true });
    if (reaj > 0) notices.push({ text: "Reajuste do consórcio simplificado em " + pct(reaj) + " a cada 12 prestações, contado da primeira prestação informada; a data-base contratual pode ser diferente.", warn: true });
    if (examplesUsed.comparar) notices.push({ text: "EXEMPLO ILUSTRATIVO: valores fictícios ou demonstrativos. Não compartilhar como proposta real.", warn: true });

    const metrics = [
      ["Parcela financiamento " + labelSistema + (finSistema === "sac" ? " — primeira" : ""), money(fin.first)],
      ["Juros totais do financiamento", money(fin.interestTotal)],
      ["Valor efetivamente financiado", money(fin.principal)],
      ["Crédito líquido do consórcio", money(carta)]
    ];
    if (finSistema === "sac") metrics.push(["Última prestação SAC", money(fin.last)]);
    updateResult("resultado-comparar", heading, headline,
      "Financiamento calculado a partir de entrada, juros mensais e prazo, com despesas explicitadas. A diferença é nominal e não equivale a valor presente, CET ou vantagem financeira garantida.",
      metrics,
      [explain("Desembolso total e acesso ao bem", tableHtml), explain("Como foi calculado o financiamento", table(["Componente", "Valor"], financiamentos))],
      notices);
    setAnalysis("comparar", [
      ["Preço do bem", money(bem)],
      ["Crédito líquido do consórcio", money(carta)],
      ["Prestação e prazo do consórcio", prazo + " × " + money(parcela)],
      ["Desembolso nominal no consórcio", money(totalCons)],
      ["Sistema de amortização do financiamento", labelSistema],
      ["Taxa de juros mensal", pct(taxaFin)],
      ["Entrada", money(entrada)],
      ["Principal financiado (com despesas incorporadas)", money(fin.principal)],
      ["IOF e despesas financiadas", money(iof + tarifasFinanciadas)],
      ["Prestação do financiamento", finSistema === "price" ? money(fin.first) : money(fin.first) + " (primeira) / " + money(fin.last) + " (última)"],
      ["Juros totais do financiamento", money(fin.interestTotal)],
      ["Total de prestações do financiamento", money(fin.installmentsTotal)],
      ["Desembolso nominal no financiamento", money(totalFin)],
      ["Compra à vista", money(totalVista)],
      ["Diferença nominal entre os planos", money(diff) + " — menor no " + cheaper],
      ["Contemplação hipotética", "Mês " + mesContemplacao],
      ["Reajuste anual hipotético do consórcio", pct(reaj)]
    ], notices.map((x) => x.text));
  }

    function bids() {
    const carta = read("l-carta", true), bem = read("l-bem");
    const proprio = read("l-proprio"), embutido = read("l-embutido");
    const limite = read("l-limite", true);
    const modo = $("l-modo").value;
    const parcela = read("l-parcela");
    const restantesRaw = $("l-restantes").value.trim();
    const restantes = restantesRaw ? integer("l-restantes", true) : 0;
    positive(carta, "o crédito da carta");
    if (limite > 100) throw Error("O limite do lance embutido não pode ultrapassar 100%.");
    if (embutido > carta * limite / 100 + .005) throw Error("O lance embutido excede " + pct(limite) + " da carta. Ajuste os valores segundo a regra do grupo.");
    if ((parcela > 0) !== (restantes > 0) && modo === "parcela") throw Error("Para estimar a nova prestação, informe tanto a parcela atual quanto as prestações sujeitas ao abatimento.");
    const totalLance = proprio + embutido;
    const creditoLiquido = carta - embutido;
    const diferencaBem = Math.max(0, bem - creditoLiquido);
    const excesso = bem > 0 ? Math.max(0, creditoLiquido - bem) : 0;
    const nova = modo === "parcela" && parcela > 0 && restantes > 0 ? parcela - totalLance / restantes : null;
    if (nova != null && nova <= 0) throw Error("O lance supera o valor que seria amortizado pelas prestações informadas. Confira o saldo amortizável e as regras do grupo.");
    const notices = [
      { text: "O lance próprio sai do caixa do cliente; o embutido é deduzido da carta. Os custos contratuais não são automaticamente recalculados sobre o crédito líquido.", warn: false },
      { text: "O lance só produz os efeitos indicados caso seja vencedor e pago, conforme o regulamento e a data da assembleia. Não é garantia de contemplação.", warn: true }
    ];
    if (modo === "prazo") notices.push({ text: "A redução de prazo depende do cronograma de quitação das últimas parcelas e do saldo devedor. Não há um número de meses confiável sem essas informações.", warn: true });
    else if (nova != null) notices.push({ text: "Nova prestação estimada pela hipótese: parcela atual − (lance total ÷ " + restantes + " prestações). É necessário confirmar essa regra no grupo; não projetamos reajustes.", warn: true });
    else notices.push({ text: "Para estimar a redução da prestação, informe a parcela atual e a quantidade validada de prestações elegíveis. Nenhum divisor padrão foi presumido.", warn: true });
    if (excesso > 0) notices.push({ text: "A carta supera o valor do bem em " + money(excesso) + ". A destinação desse saldo depende do contrato.", warn: true });
    if (examplesUsed.lances) notices.push({ text: "EXEMPLO ILUSTRATIVO. Confira condições reais antes de compartilhar.", warn: true });
    const metrics = [
      ["Capital próprio", money(proprio)],
      ["Lance embutido", money(embutido)],
      ["Lance total", money(totalLance) + " (" + pct(totalLance / carta * 100) + ")"],
      ["Complemento para compra", bem > 0 ? money(diferencaBem) : "Informe o valor do bem"]
    ];
    if (nova != null) metrics.push(["Nova parcela hipotética", money(nova)]);
    updateResult("resultado-lances", "crédito restante para adquirir o bem", money(creditoLiquido),
      "O lance total foi de " + pct(totalLance / carta * 100) + " da carta, mas somente o componente embutido reduz o crédito para a compra.",
      metrics, [explain("Composição de recursos", table(["Componente", "Valor"], [
        ["Carta original", money(carta)],
        ["Dedução embutida", "− " + money(embutido)],
        ["Crédito utilizável", money(creditoLiquido)],
        ["Dinheiro próprio para o lance", money(proprio)]
      ]))], notices);
    setAnalysis("lances", [
      ["Carta vigente", money(carta)],
      ["Lance com capital próprio", money(proprio)],
      ["Lance embutido", money(embutido)],
      ["Lance total", money(totalLance) + " (" + pct(totalLance / carta * 100) + ")"],
      ["Crédito líquido para aquisição", money(creditoLiquido)],
      ["Complemento de recursos para adquirir o bem", bem > 0 ? money(diferencaBem) : "Não informado"],
      ["Forma de amortização", modo === "prazo" ? "Redução de prazo — não quantificada" : "Redução da prestação"],
      ["Prestação após lance", nova == null ? "Não calculada" : money(nova) + " (hipótese, " + restantes + " prestações)"]
    ], notices.map((x) => x.text));
  }

  function proposals() {
    const nome = $("p-nome").value.trim();
    if (!nome) throw Error("Informe o nome da administradora concorrente.");
    const a = {
      credito: read("p-a-credito", true), parcela: read("p-a-parcela", true), prazo: integer("p-a-prazo", true),
      taxa: read("p-a-taxa"), reserva: read("p-a-reserva"), extra: read("p-a-extras")
    };
    const b = {
      credito: read("p-b-credito", true), parcela: read("p-b-parcela", true), prazo: integer("p-b-prazo", true),
      taxa: read("p-b-taxa"), reserva: read("p-b-reserva"), extra: read("p-b-extras")
    };
    [a.credito, a.parcela, b.credito, b.parcela].forEach((v) => positive(v, "os valores de crédito e parcela"));
    if ([a.taxa, b.taxa, a.reserva, b.reserva].some((v) => v > 100)) throw Error("Confira as taxas informadas: percentuais acima de 100% precisam ser revistos.");
    const totalA = a.parcela * a.prazo + a.extra;
    const totalB = b.parcela * b.prazo + b.extra;
    const diff = Math.abs(totalA - totalB);
    const low = totalA < totalB - 0.005 ? "Plano de referência" : totalB < totalA - 0.005 ? nome : "Empate nominal";
    const notEqual = Math.abs(a.credito - b.credito) > .01 || a.prazo !== b.prazo;
    const unknownSource = !$("p-fonte").value.trim();
    const notices = [
      { text: "Os totais usam as prestações atuais multiplicadas pelo prazo informado. Não projetam reajustes, alterações de valor, data da contemplação ou custo de oportunidade.", warn: true }
    ];
    if (notEqual) notices.push({ text: "ATENÇÃO: as propostas têm crédito líquido e/ou prazo diferentes. Não é correto concluir qual é melhor apenas pela diferença em reais.", warn: true });
    if (unknownSource) notices.push({ text: "Fonte da proposta concorrente não informada. Registre origem, data e validade para comparação comercial.", warn: true });
    notices.push({ text: "As taxas de administração e reserva foram informadas apenas para leitura: não foram somadas novamente, pois podem já integrar as parcelas.", warn: false });
    if (examplesUsed.propostas) notices.push({ text: "EXEMPLO ILUSTRATIVO: números não constituem oferta real.", warn: true });
    const displayName = nome.slice(0, 70);
    const rows = [
      ["Crédito líquido", money(a.credito), money(b.credito)],
      ["Prestação", money(a.parcela), money(b.parcela)],
      ["Prestações", numberBR(a.prazo), numberBR(b.prazo)],
      ["Administração informada", $("p-a-taxa").value.trim() ? pct(a.taxa) : "Não informado", $("p-b-taxa").value.trim() ? pct(b.taxa) : "Não informado"],
      ["Reserva informada", $("p-a-reserva").value.trim() ? pct(a.reserva) : "Não informado", $("p-b-reserva").value.trim() ? pct(b.reserva) : "Não informado"],
      ["Custos adicionais", money(a.extra), money(b.extra)],
      ["Total nominal", money(totalA), money(totalB)]
    ];
    const sub = notEqual ? "Os planos não são equivalentes em crédito e/ou prazo; compare cada condição antes de decidir." : "Diferença nominal calculada a partir das prestações e dos custos adicionais informados.";
    updateResult("resultado-propostas", "diferença nominal entre propostas", money(diff), sub,
      [["Menor desembolso nominal", low], ["Equivalência de crédito e prazo", notEqual ? "Não" : "Sim"]],
      [explain("Condições lado a lado", table(["Critério", "Referência", displayName], rows))], notices);
    const fonte = $("p-fonte").value.trim(), data = $("p-data").value;
    setAnalysis("propostas", [
      ["Proposta concorrente", displayName],
      ["Crédito líquido — referência / concorrente", money(a.credito) + " / " + money(b.credito)],
      ["Prestação — referência / concorrente", money(a.parcela) + " / " + money(b.parcela)],
      ["Prazo — referência / concorrente", a.prazo + " / " + b.prazo + " meses"],
      ["Administração — referência / concorrente", ($("p-a-taxa").value.trim() ? pct(a.taxa) : "não informada") + " / " + ($("p-b-taxa").value.trim() ? pct(b.taxa) : "não informada")],
      ["Desembolso nominal — referência / concorrente", money(totalA) + " / " + money(totalB)],
      ["Diferença nominal", money(diff) + " — menor em " + low],
      ["Fonte", fonte || "Não informada"],
      ["Data da proposta", data ? data.split("-").reverse().join("/") : "Não informada"]
    ], notices.map((x) => x.text));
  }

  function buildOfferText() {
    if (!lastAnalysis) return "Faça uma análise em uma das três primeiras abas para gerar seu resumo comercial.";
    const nome = $("o-nome").value.trim();
    const objetivo = $("o-objetivo").value.trim();
    const title = { comparar: "COMPARAÇÃO DE ALTERNATIVAS", lances: "ESTRATÉGIA DE LANCE", propostas: "COMPARAÇÃO DE PROPOSTAS" }[lastAnalysis.kind];
    const rows = lastAnalysis.rows.map((entry) => entry[0] + ": " + entry[1]);
    const intro = [title, "Data: " + new Date().toLocaleDateString("pt-BR")];
    if (lastAnalysis.example) intro.unshift("EXEMPLO ILUSTRATIVO — NÃO UTILIZAR COMO OFERTA REAL");
    if (nome) intro.push("Cliente: " + nome);
    if (objetivo) intro.push("Objetivo: " + objetivo);
    return intro.concat(["", ...rows, "", "CONDIÇÕES E RESSALVAS", ...lastAnalysis.warnings.map((x) => "• " + x),
      "", "Simulação orientativa baseada nos dados informados. Não é proposta contratual e não garante contemplação. Confirme regulamento, custos, índices e condições de adesão."]).join("\n");
  }
  function renderOffer() {
    $("o-previa").textContent = buildOfferText();
    const disabled = !lastAnalysis;
    ["o-copiar", "o-whatsapp", "o-imprimir"].forEach((id) => { $(id).disabled = disabled; });
    $("o-whatsapp").disabled = disabled || (lastAnalysis && lastAnalysis.example);
  }
  async function copyOffer() {
    if (!lastAnalysis) return;
    try {
      await navigator.clipboard.writeText(buildOfferText());
      setError("erro-oferta", "Texto copiado. Confira as condições antes de compartilhar.");
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents($("o-previa"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      const ok = document.execCommand("copy");
      selection.removeAllRanges();
      setError("erro-oferta", ok ? "Texto copiado." : "Não foi possível copiar automaticamente. Selecione e copie o texto da prévia.");
    }
  }
  const samples = {
    comparar: {
      "c-bem":"110.026,00", "c-contemplacao":"12", "c-carta":"110.026,00",
      "c-parcela":"1.363,22", "c-prazo":"100", "c-lance":"0", "c-extras":"0",
      "c-reajuste":"0", "c-entrada":"22.005,20", "c-fintaxa":"1,60",
      "c-finprazo":"60", "c-sistema":"price", "c-finiof":"",
      "c-fintarifas":"", "c-finextras":""
    },
    lances: {
      "l-carta":"110.026,00", "l-bem":"110.026,00", "l-proprio":"33.007,80",
      "l-embutido":"0", "l-limite":"30", "l-parcela":"1.363,22",
      "l-restantes":"99", "l-modo":"parcela"
    },
    propostas: {
      "p-a-credito":"110.026,00", "p-a-parcela":"1.363,22", "p-a-prazo":"100",
      "p-a-taxa":"20,90", "p-a-reserva":"3", "p-a-extras":"0",
      "p-nome":"Exemplo de concorrente", "p-b-credito":"110.026,00",
      "p-b-parcela":"1.390,00", "p-b-prazo":"100", "p-b-taxa":"22",
      "p-b-reserva":"3", "p-b-extras":"0", "p-fonte":"Valores fictícios", "p-data":""
    }
  };

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const tabs = Array.from(document.querySelectorAll(".tab"));
      const index = tabs.indexOf(tab);
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      showTab(tabs[next].dataset.tab);
    });
  });
  document.querySelectorAll(".example").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.example;
      Object.entries(samples[kind]).forEach(([id, value]) => { $(id).value = value; });
      examplesUsed[kind] = true;
      const el = $("erro-" + kind);
      el.textContent = "Exemplo ilustrativo carregado. Para informar uma operação real, clique em Limpar e preencha novamente.";
      el.style.color = "#92631e";
    });
  });
  [
    ["form-comparar", "comparar", compare],
    ["form-lances", "lances", bids],
    ["form-propostas", "propostas", proposals]
  ].forEach(([formId, kind, fn]) => {
    $(formId).addEventListener("submit", (e) => {
      e.preventDefault();
      setError("erro-" + kind, "");
      try { fn(); } catch (err) { setError("erro-" + kind, err); }
    });
    $(formId).addEventListener("reset", () => {
      examplesUsed[kind] = false;
      window.setTimeout(() => {
        setError("erro-" + kind, "");
        $("erro-" + kind).style.color = "";
        $("resultado-" + kind).innerHTML = '<div class="empty-result"><span class="empty-icon">↗</span><h3>Aguardando uma nova análise</h3><p>Preencha os campos para calcular novamente.</p></div>';
        if (lastAnalysis && lastAnalysis.kind === kind) lastAnalysis = null;
        renderOffer();
      }, 0);
    });
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".to-offer")) showTab("oferta");
  });
  ["o-nome", "o-objetivo"].forEach((id) => $(id).addEventListener("input", renderOffer));
  $("o-copiar").addEventListener("click", copyOffer);
  $("o-whatsapp").addEventListener("click", () => {
    if (!lastAnalysis || lastAnalysis.example) return;
    window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(buildOfferText()), "_blank", "noopener,noreferrer");
  });
  $("o-imprimir").addEventListener("click", () => { if (lastAnalysis) window.print(); });
  renderOffer();
}());
