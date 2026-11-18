"use strict";
// Análise de alavancagem patrimonial: cenário imobiliário didático.
// Não calcula patrimônio líquido, retorno garantido ou probabilidade de contemplação.
(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const num = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const pc = (v) => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "%";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);
  let isExample = false;

  function money(id, optional) {
    const raw = $(id).value.trim().replace(/\s|R\$/g, "");
    if (!raw) {
      if (optional) return 0;
      throw Error("Preencha o campo: " + $(id).closest("label").childNodes[0].textContent.trim() + ".");
    }
    const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") : raw;
    const value = Number(normalized);
    if (!Number.isFinite(value) || value < 0) throw Error("Confira o valor informado em " + id + ".");
    return value;
  }
  function integer(id, min, max) {
    const raw = $(id).value.trim();
    if (!/^\d+$/.test(raw)) throw Error("Informe um número inteiro no campo " + $(id).closest("label").childNodes[0].textContent.trim() + ".");
    const value = Number(raw);
    if (value < min || value > max) throw Error("O campo " + id + " deve ficar entre " + min + " e " + max + ".");
    return value;
  }
  function percent(id, min, max) {
    const raw = $(id).value.trim().replace(",", ".");
    if (!raw) throw Error("Informe a taxa de valorização hipotética.");
    const value = Number(raw);
    if (!Number.isFinite(value) || value < min || value > max) throw Error("A valorização hipotética precisa ficar entre " + min + "% e " + max + "%.");
    return value;
  }
  function renderArguments(items) {
    return '<div class="result-section"><h4>Argumentos para a conversa</h4><ol class="pat-arguments">'
      + items.map((t) => '<li>' + esc(t) + '</li>').join("") + '</ol></div>';
  }
  function renderMetrics(items) {
    return '<div class="metrics">' + items.map(([label, value]) =>
      '<div class="metric"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong></div>').join("") + '</div>';
  }
  function renderRows(rows) {
    return '<div class="result-section"><h4>Memória dos cálculos</h4><table class="compare-table"><tbody>'
      + rows.map(([a,b]) => '<tr><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>').join("")
      + '</tbody></table></div>';
  }
  function renderWarnings(warnings) {
    return warnings.map((t) => '<div class="callout warn">' + esc(t) + '</div>').join("");
  }

  function calculate() {
    const carta = money("a-carta"), preco = money("a-preco");
    const proprio = money("a-proprio", true), embutido = money("a-embutido", true);
    const custos = money("a-custos", true);
    const parcela = money("a-parcela"), aluguel = money("a-aluguel", true);
    const prazo = integer("a-prazo", 1, 600);
    const contemplacao = integer("a-contemplacao", 1, prazo);
    const horizonte = integer("a-horizonte", contemplacao, 600);
    const vacancia = integer("a-vacancia", 0, 12);
    const valorizacao = percent("a-valorizacao", -50, 50);

    if (!(carta > 0 && preco > 0 && parcela > 0)) throw Error("Carta, preço do imóvel e parcela precisam ser maiores que zero.");
    if (embutido >= carta) throw Error("O lance embutido não pode consumir toda a carta.");
    if (proprio + embutido > carta) throw Error("A soma dos lances supera o valor da carta. Confirme as regras ou revise os valores.");

    const creditoLiquido = carta - embutido;
    const complemento = Math.max(0, preco - creditoLiquido);
    const capitalInicial = proprio + complemento + custos;
    const mesesLocacao = Math.max(0, horizonte - contemplacao);
    const aluguelMedio = aluguel * (1 - vacancia / 12);
    const receitaPeriodo = aluguelMedio * mesesLocacao;
    const valorFuturo = preco * Math.pow(1 + valorizacao / 100, mesesLocacao / 12);
    const cobertura = aluguelMedio / parcela * 100;
    const diferencaMensal = parcela - aluguelMedio;
    const parcelasAteHorizonte = Math.min(prazo, horizonte) * parcela;
    const parcelasRestantes = Math.max(0, prazo - horizonte);
    const caixaPeriodo = capitalInicial + parcelasAteHorizonte - receitaPeriodo;
    const alertas = [
      "Contemplação no mês " + contemplacao + " é apenas uma hipótese. Sorteio ou lance não têm data garantida; sem contemplação não há aquisição nem aluguel nos meses estimados.",
      "Valorização e aluguel são premissas fornecidas para explorar cenários, não previsões. O valor projetado do imóvel é bruto, não representa lucro nem patrimônio líquido.",
      "Prestações consideradas constantes, sem reajustes futuros, seguros, tributos pessoais, custo de oportunidade ou mudança contratual. Confira a proposta e faça análise de sensibilidade antes de ofertar.",
      "A soma nominal das prestações restantes não representa saldo devedor para quitação. Custos e prazos de liberação dependem do contrato e da aprovação da operação."
    ];
    if (aluguel > 0) alertas.push("O aluguel pode ser interrompido por desocupação, inadimplência ou manutenção. Mesmo sem receita, a prestação permanece exigível.");
    if (creditoLiquido > preco) alertas.push("Crédito disponível excede o preço do imóvel. A diferença não deve ser tratada como dinheiro livre; sua utilização depende das regras contratuais.");
    if (isExample) alertas.unshift("EXEMPLO FICTÍCIO. Os números são ilustrativos e não devem ser apresentados como oferta válida.");

    const argumentos = [
      "Com " + fmt(capitalInicial) + " de recursos iniciais projetados (lance próprio, complemento da compra e despesas), o cenário considera um imóvel de " + fmt(preco) + ". A diferença é viabilizada por crédito com " + num(prazo) + " prestações, condicionado à contemplação e às regras do grupo.",
      aluguel > 0
        ? "Se a locação ocorrer como planejado, o aluguel líquido médio ajustado por vacância de " + fmt(aluguelMedio) + "/mês cobriria " + pc(cobertura) + " da prestação de " + fmt(parcela) + "; " + (diferencaMensal >= 0 ? "seriam necessários " + fmt(diferencaMensal) + "/mês adicionais." : "haveria excedente operacional estimado de " + fmt(-diferencaMensal) + "/mês, sujeito a outros custos e impostos.")
        : "Sem aluguel informado, a prestação de " + fmt(parcela) + " deve ser suportada integralmente com renda própria. Não há argumento de autofinanciamento por locação.",
      "Se o imóvel variar " + pc(valorizacao) + " ao ano por " + (mesesLocacao / 12).toLocaleString("pt-BR",{maximumFractionDigits:1}) + " anos após a contemplação hipotética, o valor bruto seria " + fmt(valorFuturo) + ". Isso não desconta prestações, obrigações ou custos e não equivale a ganho líquido."
    ];
    const rows = [
      ["Preço do imóvel", fmt(preco)],
      ["Carta nominal", fmt(carta)],
      ["Lance próprio / embutido", fmt(proprio) + " / " + fmt(embutido)],
      ["Crédito após lance embutido", fmt(creditoLiquido)],
      ["Complemento do preço / despesas iniciais", fmt(complemento) + " / " + fmt(custos)],
      ["Capital próprio inicial projetado", fmt(capitalInicial)],
      ["Parcela / prazo", fmt(parcela) + " × " + prazo + " meses"],
      ["Contemplação hipotética", "Mês " + contemplacao + " — não garantido"],
      ["Horizonte da análise", horizonte + " meses desde a contratação"],
      ["Meses potenciais de locação", num(mesesLocacao)],
      ["Aluguel líquido médio após vacância", fmt(aluguelMedio) + "/mês"],
      ["Cobertura estimada da prestação", pc(cobertura)],
      ["Renda de aluguel no horizonte", fmt(receitaPeriodo)],
      ["Prestações nominais pagas até o horizonte", fmt(parcelasAteHorizonte)],
      ["Saída de caixa líquida no horizonte (aportes + parcelas − aluguéis)", fmt(caixaPeriodo)],
      ["Valor bruto futuro do imóvel — hipótese", fmt(valorFuturo)],
      ["Prestações ainda previstas após o horizonte", num(parcelasRestantes) + " (não é saldo devedor)"]
    ];
    $("resultado-patrimonio").innerHTML =
      '<div class="result-top"><span class="result-kicker">CENÁRIO DE FORMAÇÃO PATRIMONIAL</span><span class="status-pill">Hipóteses editáveis</span></div>'
      + '<div class="hero-number">' + esc(fmt(capitalInicial)) + '<small>capital próprio inicial projetado para aquisição</small></div>'
      + '<p class="result-copy">Imóvel de ' + esc(fmt(preco)) + ' condicionado à contemplação hipotética no mês ' + contemplacao + '. O patrimônio projetado é bruto; não significa lucro ou riqueza líquida.</p>'
      + renderMetrics([
        ["Crédito após embutido", fmt(creditoLiquido)],
        ["Aluguel cobre a prestação", pc(cobertura)],
        ["Diferença mensal após aluguel", fmt(diferencaMensal)],
        ["Valor bruto no horizonte (hipótese)", fmt(valorFuturo)]
      ])
      + renderArguments(argumentos) + renderRows(rows)
      + renderWarnings(alertas)
      + '<div class="result-actions"><button type="button" class="to-offer">Gerar proposta com esta análise →</button></div>';

    if (typeof window.receberAnalisePatrimonial === "function") {
      window.receberAnalisePatrimonial({
        rows: [["Estratégia", "Formação patrimonial com imóvel para locação"], ...rows, ...argumentos.map((a,i) => ["Argumento " + (i+1), a])],
        warnings: alertas,
        example: isExample
      });
    }
  }

  const form = $("form-patrimonio");
  if (!form) return;
  const example = {
    "a-carta":"300.000,00", "a-preco":"300.000,00", "a-proprio":"60.000,00",
    "a-embutido":"0,00", "a-custos":"12.000,00", "a-parcela":"2.300,00",
    "a-prazo":"180", "a-contemplacao":"18", "a-horizonte":"60",
    "a-aluguel":"1.800,00", "a-vacancia":"1", "a-valorizacao":"3"
  };
  $("a-exemplo").addEventListener("click", () => {
    for (const [id,value] of Object.entries(example)) $(id).value=value;
    if (window.ConsorcioMasks) window.ConsorcioMasks.formatAll();
    isExample=true;
    $("erro-patrimonio").textContent="Exemplo fictício carregado. Use Limpar para iniciar uma análise real.";
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault(); $("erro-patrimonio").textContent="";
    try { calculate(); }
    catch (e) {
      $("erro-patrimonio").textContent = e.message || "Revise os campos.";
      $("resultado-patrimonio").innerHTML = '<div class="empty-result"><h3>Revise os dados</h3><p>Corrija os campos indicados antes de gerar argumentos.</p></div>';
      if (window.receberAnalisePatrimonial) window.receberAnalisePatrimonial(null);
    }
  });
  form.addEventListener("reset", () => {
    isExample=false;
    window.setTimeout(() => {
      $("erro-patrimonio").textContent="";
      $("resultado-patrimonio").innerHTML='<div class="empty-result"><span class="empty-icon">↗</span><h3>Construa um cenário de patrimônio</h3><p>Informe os dados para avaliar capital inicial, potencial de aluguel, compromissos e argumentos de oferta.</p></div>';
      if (window.receberAnalisePatrimonial) window.receberAnalisePatrimonial(null);
    },0);
  });
}());
