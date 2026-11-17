# Especificação funcional — Comparador V2 de Consórcio

**Implementação:** `index.html` + `styles.css` + `compare-v2.js`, integrados a `app.js`.  
**Escopo:** comparador responsivo de **veículos** e **imóveis**, executado integralmente no navegador, sem backend.  
**Prioridade:** primeiro uso no computador e adaptação ao celular.  
**Referências iniciais:** carta e preço do bem de **R$ 100.000,00**; contemplação **hipotética no primeiro mês**.

## 1. Experiência visual

- No cabeçalho, **dois cartões grandes clicáveis**, com desenhos vetoriais de veículo e imóvel, indicação selecionada e textos curtos explicativos. Não exibir uma terceira modalidade.
- Alternar a modalidade sem sair da página. O estado escolhido determina rótulo, unidade da taxa de juros e tratamento inicial do IOF.
- Valores de referência ficam em um bloco separado do consórcio: **preço do bem**, **carta de crédito** e **mês hipotético de contemplação**.
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

- Regime **Price/SAC** (Price por padrão).
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

- Distribuir amortizações pelo sistema escolhido (Price/SAC).
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
| Veículos: SAC | Mostrar primeira e última prestações, não uma fixa |
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
