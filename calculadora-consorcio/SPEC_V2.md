# Especificação funcional — Comparador V2 de Consórcio

**Implementação:** `index.html` + `styles.css` + `compare-v2.js`, integrados a `app.js`.  
**Escopo:** comparador responsivo de **veículos** e **imóveis**, executado integralmente no navegador, sem backend.  
**Prioridade:** primeiro uso no computador e adaptação ao celular.  
**Referências no botão “Preencher exemplo”:** carta e preço do bem de **R$ 100.000,00**; contemplação **hipotética no primeiro mês**. **Na abertura real os campos estão vazios**, exceto o reajuste anual sugerido para a modalidade.

## 1. Experiência visual

- No cabeçalho, **dois cartões grandes clicáveis**, com desenhos vetoriais de veículo e imóvel, indicação selecionada e textos curtos explicativos. Não exibir uma terceira modalidade.
- Alternar a modalidade sem sair da página. O estado escolhido determina rótulo, unidade da taxa de juros, tratamento inicial do IOF e **índice sugerido de reajuste (IPCA/INCC-M)**.
- Valores de referência ficam em um bloco separado do consórcio: **um único campo de valor do bem / carta de crédito** e **mês hipotético de contemplação**.
- Consórcio e financiamento têm campos principais visíveis e um bloco `<details>` recolhido para informações de maior precisão.
- Resultado fica lado a lado com o formulário no desktop e abaixo no celular. Mostrar uma explicação do cálculo e seus componentes.
- A aplicação não pode sugerir vínculo ou apoio institucional. Nenhum identificador de instituição de referência pode entrar em qualquer arquivo.

## 2. Consórcio — três campos principais nesta ordem

1. **Prestações a pagar** — quantidade inteira.
2. **Taxa de administração + fundo de reserva** — percentual **total** sobre a carta; não taxa mensal.
3. **Valor da parcela** — valor monetário.

**Regra reversível:** com pelo menos dois campos informados, calcular automaticamente o terceiro:

```text
valor_parcela = valor_carta × (1 + taxa_total / 100) / numero_prestacoes
taxa_total = 100 × (valor_parcela × numero_prestacoes / valor_carta - 1)
numero_prestacoes = valor_carta × (1 + taxa_total / 100) / valor_parcela
```

O prazo derivado precisa ser **inteiro**; se o resultado não for exato, arredondar e avisar sobre a aproximação/possível parcela residual. Quando o usuário editar um campo anteriormente calculado, preservar os **dois mais recentemente editados** e recalcular o restante.

**Limitação necessária:** é uma **reconciliação nominal simplificada**. A distribuição real de administração, reserva e fundo comum pode ser não linear. Percentuais anuais de reajuste e redutores particulares não são inferidos pelos três campos.

### Campos opcionais do consórcio (exatamente nesta ordem)

1. Lance com capital próprio.
2. Lance embutido.
3. Valor da carta após lance embutido.
4. Nova prestação após lance.
5. Prestações a pagar após lance.
6. Outros custos.
7. Reajuste anual hipotético.

O crédito líquido inicial é `valor_carta - lance_embutido`; permitir informar valor específico se houver outra dedução comprovada, alertando sobre divergência. Embutido limitado ao percentual contratual adotado para o perfil (30% como referência atual) e **não é caixa próprio**.

Se houver lance e número de prestações após lance, mas não houver nova parcela, permitir **apenas hipótese explicitamente sinalizada** de `parcela_inicial - lance_total / prestações_pós_lance`. Se nova parcela for informada, preferir a **observada**. Total de prestações considera as anteriores e posteriores ao lance na quantidade informada. Se houver lance sem número de prestações pós-lance, o total fica **parcial**, não se conclui qual alternativa vence.

## 3. Financiamento — quatro campos principais nesta ordem

1. **Entrada** — mesmo número do **lance com capital próprio**.
2. **Juros** — mensal em veículos; anual **efetivo** em imóveis.
3. **Prazo** — sempre em meses.
4. **Parcela** — prestação Price ou **primeira prestação** no SAC.

**Vinculação bidirecional:** editar o lance próprio altera imediatamente a entrada; editar a entrada altera imediatamente o lance próprio. O **lance embutido não compõe a entrada**. Se uma entrada for calculada como campo faltante, atualizar também o lance próprio.

**Regra reversível:** dados três campos válidos, calcular o quarto; se todos estiverem preenchidos, considerar os três editados mais recentemente e atualizar o outro. Determinar a prestação conforme o regime; determinar juros por busca numérica, entrada por inversão numérica e prazo por busca de quantidade inteira mais próxima, sinalizando discrepância quando houver.

```text
taxa_mensal_veiculos = juros_mensal_percentual / 100
taxa_mensal_imoveis = (1 + juros_anual_efetivo / 100)^(1/12) - 1

saldo_da_compra = preco_do_bem - entrada
base_financiada = saldo_da_compra + tarifas_financiadas
principal = base_financiada + (iof_financiado ? iof_estimado : 0)

prestacao_price = principal × taxa_mensal / (1 - (1 + taxa_mensal)^(-prazo))
prestacao_sac_mes_t = principal/prazo + saldo_anterior_t × taxa_mensal

prestacao_com_seguro = prestacao_financeira + seguro_mensal
desembolso_financiamento = entrada + soma_prestacoes +
                           despesas_pagas_a_vista +
                           (iof_financiado ? 0 : iof_estimado)
```

Quando taxa = zero, usar `principal/prazo` e corrigir eventual resíduo de arredondamento no **último vencimento**, sem gerar juros negativos fictícios.

### Opcionais do financiamento (recolhidos)

- Regime de financiamento por modalidade: **CDC/Price obrigatório no comparador de veículos**, e **Price ou SAC configurável para imóveis**.
- Tarifas financiadas.
- Seguro mensal.
- Custos pagos à vista.
- Data de contratação e primeiro vencimento, para melhorar a precisão do IOF.
- IOF financiado ou pago à vista.
- Imóvel com finalidade habitacional ou não.
- Outra hipótese de isenção de IOF, mediante confirmação do enquadramento.

### IOF automático — hipótese regulamentar explícita

**Fundamento:** Decreto nº 6.306/2007, arts. **7º** e **9º**, texto consolidado.  
**Referência oficial independente:** https://www2.camara.leg.br/legin/fed/decret/2007/decreto-6306-14-dezembro-2007-566561-normaatualizada-pe.html

Para operação tributável de crédito de pessoa física, estimar:

```text
iof = 0,38% × base_financiada
    + 0,0082% × SOMA[pagamento_principal_t × min(dias_ate_vencimento_t, 365)]
```

- Distribuir amortizações conforme o financiamento: **Price em veículos**, **Price ou SAC em imóveis**.
- Quando datas não forem fornecidas, aproximar vencimentos a cada 30 dias. A ferramenta **não garante cálculo tributário oficial** nem contempla todas as particularidades fiscais.
- Para **imóvel habitacional elegível**, aplicar **isenção** (art. 9º, I), se a opção estiver marcada. Imóveis não habitacionais podem ser tributáveis.
- Também existem isenções especiais em outras operações, inclusive hipóteses específicas para veículos (art. 9º, VI). Disponibilizar marcação manual de isenção para casos confirmados.
- Se o IOF for financiado, incluí-lo no principal; caso contrário, somá-lo como desembolso à vista.
- Nunca inserir uma despesa duas vezes.

## 4. Resultado da comparação

Exibir:
- **Consórcio:** carta, crédito líquido, lance próprio, lance embutido, prestações antes/depois do lance, valor extra para completar a compra e total nominal.
- **Financiamento:** preço, entrada, saldo, IOF, principal, taxa na unidade correta, parcela(s), juros, seguro e total nominal.
- **Comparação:** consórcio, financiamento e preço à vista; diferença **nominal** e menor desembolso **somente quando a projeção for suficientemente preenchida**.
- **Ressalvas:** contemplação é hipótese (por padrão no mês 1); financiamento depende de aprovação; ausência de custos pode tornar a simulação incompleta; reajustes e índices contratuais não são integralmente projetados; imóveis podem ter TR, seguros e correção de saldo não modelados.
- **Compartilhamento:** enviar ao gerador de proposta os valores e as ressalvas da análise, sem inventar condições.

## 5. Casos de teste obrigatórios

| Caso | Resultado esperado |
| --- | --- |
| Carta 100.000; 100 prestações; taxa 20% | Parcela **R$ 1.200,00** |
| Carta 100.000; taxa 20%; parcela 1.500 | Prazo calculado **80** prestações |
| Carta 100.000; 100 prestações; parcela 1.300 | Taxa total calculada **30%** |
| Preencher lance próprio 20.000 | Entrada do financiamento = **R$ 20.000,00** |
| Preencher entrada 15.000 | Lance próprio = **R$ 15.000,00** |
| Carta 100.000; lance embutido 30.000 | Crédito líquido = **R$ 70.000,00**; entrada não aumenta |
| Veículos: Price com entrada, taxa e prazo | Prestação e IOF estimados calculados |
| Imóveis: SAC | Mostrar primeira e última prestações, não uma fixa |
| Imóveis: 12% a.a. efetiva | Converter para taxa mensal equivalente; prestação mensal |
| Imóvel habitacional | IOF isento **condicional ao enquadramento** |
| Financiamento com três de quatro campos | Resolver campo faltante: entrada, juros, prazo ou parcela |
| Lance sem prestações após lance | Mostrar **comparação parcial**; não declarar vencedor |
| IOF financiado/despesas à vista | Segregar custos e evitar dupla contagem |
| Taxa de juros zero | Juros totais zero e ajuste residual de centavos |

## 6. Limites desta versão

- Não estimar probabilidade ou data de contemplação.
- Não calcular automaticamente fluxo real mensal do consórcio sem demonstrativo do grupo.
- Não projetar amortização pós-lance como valor contratual quando deduzida apenas de uma hipótese.
- Não calcular automaticamente correções monetárias de imóveis, seguro variável, tarifas contratuais desconhecidas ou CET.
- Não tratar a diferença de **desembolso nominal** como decisão financeira completa sem momento de aquisição e custo de oportunidade.

## 7. Ajustes de usabilidade — campos vazios, limpar e máscaras (17/11/2026)

**Regra central:** não carregar a simulação fictícia automaticamente. Os campos de valor do bem, carta, contemplação, prazo, taxa de administração, parcela, lance próprio, entrada, juros do financiamento e prestações do financiamento devem ficar **vazios até interação do usuário**. O botão `Preencher exemplo` é a única forma de carregar a referência de carta de R$ 100 mil, contemplação no primeiro mês e condições numéricas de exemplo.

**Limpar:** disponibilizar botão visível ao lado de `Preencher exemplo` e no final do formulário. A limpeza deve apagar campos informados e calculados, limpar resultado/gerador de proposta da análise, recolher os dois blocos opcionais e restaurar a modalidade Veículos com a taxa sugerida de IPCA. Não reintroduzir números fictícios.

**Máscara revisada:** valores monetários adotam agora digitação **centesimal em tempo real** (exemplo: teclas `1`, `2`, `3`, `4` exibem sucessivamente `0,01`, `0,12`, `1,23`, `12,34`); seis teclas `123456` produzem `1.234,56`. Ao usar Backspace/Delete, os centavos recuam até esvaziar o campo. Percentuais mantêm digitação decimal comum e são padronizados no desfoque (`20,5` → `20,50`). Dados carregados pelo botão de exemplo permanecem em valores absolutos (R$ 100.000,00 não é reinterpretado como R$ 1.000,00).

### 7.1. Taxas sugeridas para cenários de reajuste

O único campo financeiro pré-preenchido na abertura é `reajuste_anual_hipotetico`, com percentual anualizado a partir de **36 meses consecutivos encerrados em outubro de 2026**:

| Modalidade | Índice escolhido para a hipótese | 12 meses até out/2024 | 12 meses até out/2025 | 12 meses até out/2026 | Média anualizada composta |
| --- | --- | ---: | ---: | ---: | ---: |
| Veículos | **IPCA (IBGE)** | 4,76% | 4,68% | 4,63% | **4,69% a.a.** |
| Imóveis | **INCC-M (FGV)** | 5,72% | 6,58% | 6,75% | **6,35% a.a.** |

```text
media_anualizada =
  100 × [ ((1 + r_2024/100) × (1 + r_2025/100) × (1 + r_2026/100))^(1/3) − 1 ]
```

**Fontes primárias dos acumulados:**
- IPCA: [IBGE, outubro de 2024](https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/41795-ipca-foi-de-0-56-em-outubro); [IBGE, outubro de 2025](https://agenciadenoticias.ibge.gov.br/agencia-sala-de-imprensa/2013-agencia-de-noticias/releases/45033-ipca-fica-em-0-09-em-outubro); [IBGE, painel de indicadores atualizado em outubro de 2026](https://www.ibge.gov.br/indicadores-e-sistemas/indices-e-certificados/16855-ipca.html).
- INCC-M: [FGV, outubro de 2024](https://portal.fgv.br/noticias/incc-m-outubro-2024); [FGV, outubro de 2025](https://portal.fgv.br/noticias/incc-m-outubro-2025); [FGV, outubro de 2026](https://portal.fgv.br/noticias/incc-m-outubro-2026).

O índice é **referência histórica estática**, não previsão e não consulta automática em tempo real. Ao mudar de veículo para imóvel, substituir a sugestão **somente se o usuário ainda não a tiver alterado manualmente**. Quando alterada manualmente, preservar sua escolha. Em imóvel, **INCC-M é uma aproximação**, não comprovação de que essa variante é a contratada no grupo — verificar proposta, versão do INCC e data-base. Nos veículos, o reajuste pode seguir FIPE ou outro parâmetro contratual, não necessariamente IPCA.

### 7.2. Critérios de teste adicionados

- [x] Abrir a ferramenta sem exemplo: campos comerciais vazios, taxa sugerida do veículo em **4,69%**.
- [x] Selecionar imóvel sem preencher demais campos: sugerir **6,35%**, mantendo o restante vazio.
- [x] Editar reajuste manualmente e trocar modalidade: não sobrescrever o valor informado.
- [x] Clicar em `Preencher exemplo`: carregar carta de R$ 100.000 e calcular prestação de R$ 1.200 (100 × 20% total).
- [x] Clicar em `Limpar`: apagar campos e resultado; deixar apenas índice sugerido, blocos recolhidos e modalidade inicial.
- [x] Digitar sequencialmente seis teclas `123456` em campo monetário: exibir `1.234,56` já na digitação.
- [x] Digitar `20,5` em percentual e desfocar: exibir `20,50`.
- [x] Digitar separador decimal parcial: não interromper cálculos por erro de parsing.
- [x] Validar por eventos simulados o Backspace/Delete até campo vazio, inclusive quando existe formatação monetária.
- [ ] Validar a máscara e posição do cursor em teclados físicos e virtuais reais.
- [ ] Comparar o visual desktop e Android após o processamento do GitHub Pages.

## 8. Refinamento do comparador — campo único e análise técnica (17/11/2026)

**Um único campo** `Valor do bem / carta de crédito` substitui as duas entradas duplicadas. O preço utilizado para calcular o financiamento é igual ao valor nominal da carta. Ao informar lance embutido, somente o **crédito líquido disponível** diminui, podendo surgir necessidade de completar a compra com recursos externos. Não permitir uma diferença arbitrária entre as duas bases neste fluxo simplificado.

**Novo painel de resultados** (implementado em `app.js` e `styles.css`):

1. **Diagnóstico nominal**, com diferença projetada e identificação explícita de **comparação parcial** quando faltar cronograma de lance.
2. **Dois cartões**, apresentando total pago, prestação, prazo e recursos necessários no consórcio/financiamento.
3. **Gráfico de linhas de desembolso nominal acumulado**, do mês zero até o último vencimento, com ambas as alternativas na mesma escala, linha estabilizando após o fim do pagamento e valores de marcos selecionados. Não é gráfico de saldo devedor ou de custo presente.
4. **Tabela técnica** com taxas totais (não comparáveis diretamente à taxa de juros), parcelas inicial e após lance/final, prazos, capital próprio/entrada, crédito líquido/principal, juros, IOF, custos e total.
5. **Leitura técnica** em linguagem acessível, com diferença de prestações, duração, estrutura de custos e riscos de contemplação e reajuste.
6. **Memória de cálculo expansível** preservando componentes detalhados por alternativa e premissas.
7. **Ressalvas contratuais** sobre distribuição do consórcio, crédito líquido, custos ausentes, reajustes e ausência de valor presente/CET.

**Importante:** o consórcio pode ter prestação inicial inferior e prazo maior. O painel informa ambos, sem declarar vantagem econômica apenas pela parcela, nem equiparar taxa de administração total e juros mensais. A contemplação no primeiro mês permanece cenário hipotético.

### 8.1. Testes de regressão

- [x] Campo duplicado removido do HTML, referências antigas eliminadas dos cálculos.
- [x] Exemplo com carta de R$ 100.000 ainda gera prestação de R$ 1.200,00 para 100 meses e taxa total de 20%.
- [x] Sequência de teclas `123456` produz `1.234,56` com máscara ativa.
- [x] Quatro exclusões em `12,34` produzem `1,23 → 0,12 → 0,01 → campo vazio`.
- [x] Painel apresenta comparações de **primeira prestação, total nominal, taxas, custos e parecer técnico**, com memória de cálculo recolhida.
- [x] O lance próprio permanece vinculado à entrada e o embutido diminui o crédito líquido sem alterar a entrada.
- [x] Cenário de lance sem prazo pós-lance continua identificado como **comparação parcial**.
- [ ] Homologar o comportamento visual real no navegador do computador e no teclado Android.

O fluxo atual permanece **uma ferramenta de apoio comercial**, e não um cálculo automático e completo de contrato de consórcio ou de CET do financiamento.

## 9. Evolução temporal dos desembolsos e modalidades de financiamento (17/11/2026)

### 9.1. Modalidades de financiamento fixadas no produto

- **Veículos:** modelar a comparação com financiamento **CDC de prestações fixas pelo sistema Price**. A opção SAC fica **oculta e desativada** e o motor impõe Price mesmo se o seletor for alterado fora do fluxo visual.
- **Imóveis:** permitir **Price** e **SAC** no bloco de detalhes, mantendo juros **anuais efetivos** como entrada e convertendo-os em taxa mensal equivalente. Em SAC, as prestações decrescem segundo a amortização constante.
- Ao trocar modalidade, o sistema retorna o seletor a Price, preservando coerência e não reutilizando taxa de juros anual como mensal.
- **Consórcio não possui IOF**; o IOF mostrado é **somente do financiamento**, quando devido, e nunca entra no fluxo do consórcio.

### 9.2. Gráfico de linhas de desembolso acumulado

Substituir as barras de custos por um gráfico com **duas linhas temporais**:

- Eixo X: **mês 0** até `max(prestacoes_consorcio, prazo_financiamento)`.
- Eixo Y: **desembolso nominal acumulado em reais**; escala idêntica para ambas as alternativas.
- **Financiamento no mês 0:** entrada (= lance próprio), despesas à vista e IOF pago à vista, se aplicável; **a cada mês** somar a prestação Price ou SAC, com seguro mensal já incluído quando informado.
- **Consórcio no mês 0:** zero por padrão; em cada mês somar prestação do cenário e o reajuste anual hipotético. O **lance próprio, complemento para compra e outros custos** são contabilizados no **mês hipotético da contemplação**, e não necessariamente na contratação. Se for informado cronograma após lance, respeitar as prestações iniciais e posteriores à amortização.
- Após o encerramento do prazo de uma alternativa, sua linha fica **horizontal**, enquanto a outra segue acumulando pagamentos.
- Se existir lance sem cronograma pós-lance, a linha de consórcio deve ser **tracejada** e sinalizada como **parcial**, sem declarar vencedor.
- Exibir legenda, valores ao passar sobre marcos selecionados e tabela expansível de valores acumulados nos meses selecionados.
- **Reconciliação obrigatória:** os últimos pontos das duas séries precisam coincidir com os totais dos cartões de resultados. Erro de conciliação impede apresentação de um resultado aparentemente preciso.

### 9.3. Limites de interpretação

O eixo Y mostra **quanto foi pago ao longo do tempo**, não saldo devedor, rentabilidade, inflação acumulada ou CET. O mês de contemplação é hipótese, sem garantia; o tempo até liberação do bem não é precificado. A entrada do financiamento no mês zero e o lance do consórcio no mês da contemplação são **premissas explícitas**. O índice de reajuste é estático, editável e não reproduz cronograma contratual completo.

### 9.4. Testes automatizados desta versão

- [x] Veículos: apenas Price disponível e usado pelo motor; tentativa de selecionar SAC fora da interface é ignorada.
- [x] Imóveis: Price ou SAC; teste com SAC mostrou primeira prestação maior que a última.
- [x] Exemplo com carta de R$ 100.000: último ponto de ambas as linhas coincide com os desembolsos totais exibidos.
- [x] Lance próprio com entrada equivalente; fluxo do financiamento começa com a entrada no mês zero, e consórcio contabiliza lance no mês hipotético da contemplação.
- [x] Lance embutido reduz o crédito, sem criar entrada adicional no financiamento.
- [x] Financiamento sem juros trata a última prestação residual sem gerar juros negativos e concilia os fluxos.
- [x] Consórcio não contém cobrança de IOF em nenhum componente de sua soma de caixa.
- [x] Verificação pública concluída na versão `v=20261117-08`: gráfico SVG com duas linhas, legenda e tabela de marcos, sem barras; seleção CDC/Price em veículos, SAC/Price em imóveis; IOF somente no financiamento. Testado em desktop e celular (390 px), sem corte horizontal.

## 10. Simplificação definitiva do lance e da atualização (17/11/2026)

**Esta seção prevalece sobre as seções anteriores quando houver conflito.** O comparador é uma **fotografia atual** da oferta e não uma previsão de assembleias futuras. A interface **não possui mais campo de mês de contemplação**.

### 10.1. Lance na assembleia seguinte: primeira prestação integral

- **Sem lance:** não há hipótese de contemplação, nem estimativa de data para acesso ao bem. O fluxo nominal usa as prestações informadas, sem avaliar custo de esperar.
- **Com lance próprio, embutido ou ambos:** somente para cálculo, considerar que o lance será **ofertado na assembleia seguinte**. Isso **não garante que será vencedor**.
- A **primeira prestação é sempre integral**, calculada com as condições atuais; o lance **não** reduz essa prestação.
- O lance, se contemplado, é contabilizado no **mês 1**, junto à primeira prestação. A partir do **mês 2** aplica-se o efeito estimado da amortização.
- A entrada do financiamento permanece igual ao **lance com recursos próprios**; o embutido não gera caixa e reduz o crédito disponível para a compra.

**Cálculo simplificado para lance com redução de prestação:**

```text
N = prestações inicialmente a pagar (inclui a primeira integral)
L = lance próprio + lance embutido
P = prestação integral inicial

primeira_prestacao = P
prestacoes_apos_lance = N - 1
nova_prestacao_estimada = P - L / (N - 1)

fluxo_consorcio_mes_1 = primeira_prestacao + lance_proprio
                       + max(0,valor_bem - credito_liquido) + custos_externos
fluxo_consorcio_mes_t (>1) = nova_prestacao_estimada ×
                              fator_reajuste_do_credito(t)
```

- Se o operador informar **nova prestação pós-lance**, o modelo **substitui a estimativa por esse valor**, sem exigir mês de contemplação.
- Se informar apenas **prazo pós-lance menor que N-1**, considera-se **redução de prazo** com prestações posteriores iguais à prestação integral, salvo informação da nova parcela. A existência de possível prestação residual exige conferência com o simulador real.
- Se informar ambas, esses dados são a fotografia da simulação existente; o modelo usa **1 prestação integral + o número informado de prestações posteriores**. A contagem não pode superar N-1 sem dados contratuais adicionais.
- Na ausência de informações pós-lance, o aplicativo **não deixa a operação parcial**: projeta redução linear das prestações posteriores e explicita que o número é uma **hipótese**, não valor contratual. Casos inviáveis (lance maior que a soma linear das prestações futuras) pedem dados reais.
- Nenhuma amortização do lance é aplicada à primeira prestação. A soma total nominal considera prestações pós-lance, lance próprio desembolsado e eventual complemento do bem quando o lance é embutido. **Não existe IOF de consórcio.**

### 10.2. Índices: hipóteses simples em vez de previsão de preços

- **Veículos:** usar **IPCA médio histórico de 4,69% ao ano**, como *proxy* de reajuste, mesmo quando o grupo tenha contrato atrelado à FIPE. Isso torna a projeção mais estável, mas **não implica que o IPCA prevê a FIPE com maior precisão estatística**. A escolha é metodológica e editável.
- **Imóveis:** usar **INCC-M médio histórico de 6,35% ao ano**, editável, na ausência da série específica do plano.
- O valor de referência da carta é atualizado por hipótese a cada **12 prestações futuras**. Como não se informa a data-base do grupo, o modelo não reproduz o mês efetivo do reajuste de grupos já em andamento.
- Em **planos de contribuição linear**, atualizar o crédito de referência e recalcular o valor proporcional de cada prestação equivale matematicamente a multiplicar as prestações pelo fator acumulado. Para distribuições não lineares, administração antecipada, diferenças de assembleia, seguros e mudanças de crédito, a aproximação pode não representar a cobrança real.
- A **primeira prestação integral** e as demais após lance são atualizadas nos ciclos de 12 meses pela mesma proxy anual. O gráfico reconcilia os desembolsos com os totais usando essas hipóteses.
- Os contratos de bens móveis e imóveis examinados são de **dezembro de 2024**; a proposta de cada grupo pode prever condições diferentes. O projeto usa essas regras **como referência geral simplificada**, não como regulamento universal ou espelho oficial da oferta.

### 10.3. Testes de regressão

- [x] Mês de contemplação removido de HTML, JavaScript e exemplo.
- [x] Sem lance: nenhuma data de contemplação ou disponibilidade do bem é presumida.
- [x] Com lance: primeira prestação integral e posterior abatimento; caso ilustrativo R$ 100 mil / 100 meses / taxa total 20% / lance próprio R$ 20 mil resulta em primeira prestação de R$ 1.200 e **99 prestações estimadas em R$ 997,98 antes de reajustes**.
- [x] Lance embutido de R$ 30 mil reduz o crédito disponível para R$ 70 mil, sem se transformar em entrada no financiamento.
- [x] Lance combinado: primeira integral, capital próprio lançado somente uma vez e complemento por embutido lançado na hipótese de aquisição.
- [x] Prazo pós-lance explicitamente menor: mantém a primeira prestação integral e passa a usar o prazo informado.
- [x] Nova prestação pós-lance informada: tem prioridade sobre cálculo automático.
- [x] Cenários sem lance ignoram dados pós-lance soltos e avisam sobre essa inconsistência.
- [x] Gráfico de evolução nominal e totais dos cartões reconciliados para os cenários testados.
- [x] Verificação pública em desktop e celular (390 px) na versão `v=20261117-09`: primeira prestação cheia, 99 posteriores estimadas, lance no mês 1 do gráfico, ausência de campo de contemplação e entrada igual ao lance próprio. Sem problemas de layout observados.
- [ ] Validar o novo cenário com dados reais de uma proposta e de seu demonstrativo de amortização após lance.
