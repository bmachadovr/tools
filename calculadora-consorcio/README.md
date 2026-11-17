# Calculadora de Consórcio — Central de Estratégias Comerciais

> **Status:** especificação funcional e técnica aprovada para início do desenvolvimento (17/11/2026).  
> **Local:** `tools/calculadora-consorcio/` (pasta `calculadora-consorcio/` na raiz do repositório `tools`).  
> **Produto:** aplicação web independente, estática, responsiva e orientada ao apoio à negociação.  
> **Importante:** este README documenta o projeto; nenhuma funcionalidade está implementada apenas pela criação desta pasta.

## 1. Propósito

Construir uma **central de estratégias de consórcio**, inspirada na experiência de uso da Calculadora de Crédito existente, com foco em **análises que ajudem a transformar números em explicações e propostas comerciais claras**.

A ferramenta deve responder, principalmente:

- Em que condições um consórcio pode fazer sentido para este cliente?
- Como diferentes fontes e tipos de lance afetam crédito disponível, desembolso e pagamentos futuros?
- Como uma proposta se compara ao financiamento, à compra à vista ou à proposta de outra administradora?
- Que premissas, vantagens, limitações e riscos precisam ser mostrados com transparência?
- Como gerar um resumo simples e compartilhável para apoiar a conversa comercial?

**Não se trata de um simulador básico de contratação.** Já existe uma solução operacional interna para informar carta, prazo, prestações e condições do produto. Evitar retrabalho e duplicação de funcionalidades é uma decisão expressa de escopo.

### 1.1. Usuário e contexto

- Usuário principal: profissional que faz atendimento e oferta de consórcio.
- Uso principal: atendimento em computador, com previsão de utilização em celular.
- Uso secundário: apresentar ao cliente cenários e enviar um resumo de proposta pelo WhatsApp.
- Uso sem integração inicial com sistemas internos: dados necessários serão informados manualmente, de preferência reaproveitando resultados de uma simulação já disponível ao atendente.
- O objetivo comercial **não autoriza distorcer resultados** nem privilegiar uma alternativa sem fundamento matemático.

## 2. Regra absoluta de identidade e neutralidade

**Obrigatório em todo o projeto, sem exceções:**

1. A instituição utilizada como referência operacional **não pode ser identificada** pelo nome, marca, sigla, logotipo ou outros identificadores.
2. Essa proibição vale para **toda a interface, código-fonte, HTML, CSS, JavaScript, variáveis, funções, comentários, dados de teste, configurações, caminhos, nomes de arquivos, metadados, títulos, textos de SEO, documentação, propostas e mensagens geradas**.
3. Nenhuma paleta, símbolo, assinatura ou aparência deve sugerir vínculo ou endosso institucional não declarado.
4. Para a alternativa principal utilizar somente rótulos neutros, como **“Plano de referência”**, **“Nossa simulação”** ou **“Cenário analisado”**.
5. **Administradoras concorrentes podem ser nomeadas** e comparadas. Exemplos de nomes permitidos quando sustentados por dados: Santander, Itaú, CAIXA Consórcio, Porto Bank e Embracon.
6. Não embutir identificação institucional oculta em constantes, chaves, IDs, comentários, identificadores internos, commits de conteúdo, amostras ou telemetria.
7. Antes de cada publicação, revisar manualmente e por busca automatizada os identificadores proibidos estabelecidos fora deste repositório, sem registrar tais identificadores nos próprios arquivos do projeto.

A neutralidade visual e nominal **não elimina** a necessidade de declarar as premissas, características contratuais e fontes dos resultados. Não afirmar que uma hipótese vale para todas as administradoras.

## 3. Princípios do produto

- **Valor comercial antes de volume de funcionalidades.** Priorizar decisões reais de atendimento.
- **Cálculo verificável.** Regras e fórmulas explícitas, testes matemáticos e rastreabilidade das premissas.
- **Sem falsa precisão.** Não apresentar cenário hipotético como proposta confirmada.
- **Sem promessa de contemplação.** Contemplação por sorteio ou lance depende das regras do grupo e de fatores que não são controlados pela ferramenta.
- **Comparações justas.** Equalizar crédito líquido, momento de aquisição, aporte inicial, prazo, cobertura de encargos e hipóteses de reajuste.
- **Poucos campos por tarefa.** Usar informação já obtida em simulação operacional quando disponível.
- **Linguagem acessível.** Explicar finalidade, campos e resultados para quem não domina consórcio.
- **Privacidade por padrão.** Não depender de nome, CPF, número de contrato, telefone ou dados pessoais de clientes.
- **Baixa complexidade.** Aplicação simples em HTML/CSS/JavaScript, executada no navegador, sem backend obrigatório.
- **Sem apresentação enviesada.** Se outra alternativa for melhor nas premissas informadas, mostrar isso.

## 4. Escopo funcional — primeira versão (MVP)

### 4.1. Comparar alternativas — prioridade 1

**Objetivo:** comparar consórcio, financiamento e, quando pertinente, compra à vista.

**Entradas essenciais:**
- Valor efetivo do bem e valor de crédito utilizável.
- Condições obtidas no simulador operacional: crédito nominal, prestação(ões), prazo restante, taxa total de administração, fundo de reserva, seguros e outros custos aplicáveis.
- Alternativa de financiamento: entrada, prazo, parcela, taxa/CET e encargos, quando disponíveis.
- Horizonte de comparação e cenários **hipotéticos** de contemplação (sem previsão nem garantia).
- Premissas de reajuste do bem e das prestações, se aplicáveis.

**Resultados:**
- Capital próprio necessário e desembolso inicial.
- Fluxo mensal e desembolso acumulado em cada cenário.
- Custo total projetado e custos segregados por tipo.
- Diferenças em reais e percentuais sob hipóteses equivalentes.
- Diferença de disponibilidade do bem: aquisição imediata versus aquisição condicionada à contemplação.
- Conclusão comercial descritiva, incluindo desvantagens e riscos.

**Atenção:** uma comparação apenas entre parcelas, sem considerar o momento em que o cliente recebe o bem, **é inadequada**.

### 4.2. Estratégia de lances — prioridade 2

**Objetivo:** comparar lance com recursos próprios, embutido e combinado, respeitando o regulamento de cada plano.

**Entradas:**
- Crédito nominal, valor líquido desejado para aquisição e recursos próprios disponíveis.
- Lance próprio, lance embutido, percentual máximo admitido e base contratual de cálculo.
- Prazo e prestações de referência; regras de amortização pós-lance.
- Uso de FGTS **somente quando admitido** para a operação e observadas as condições aplicáveis.

**Resultados:**
- Valor e percentual de cada lance, discriminando origens.
- Crédito líquido destinado à compra após dedução de lance embutido e demais deduções aplicáveis.
- Valor de carta necessário para atingir o crédito líquido desejado.
- Desembolso próprio, recursos preservados e evolução de prestações ou prazo, quando o contrato permitir.
- Cenários de redução de prazo ou de parcela, sempre de acordo com a regra do plano.

**Regras críticas:**
- **Lance embutido não é dinheiro adicional disponível**: utiliza parte do próprio crédito e reduz o valor líquido para adquirir o bem.
- Não contar lance embutido como desembolso de recursos próprios.
- O efeito financeiro do lance depende de contemplação efetiva e das regras de amortização.
- Percentual de lance, lance embutido e cálculo de prestações não devem usar fórmulas universais quando forem regras particulares de um plano.
- Um lance maior **não garante contemplação**.

### 4.3. Analisar proposta concorrente — prioridade 3

**Objetivo:** comparar um plano de referência sem identificação institucional com propostas de administradoras concorrentes **identificáveis**.

**Entradas:**
- Administradora concorrente e modalidade (veículos, imóveis etc.).
- Dados conferidos da proposta: carta, crédito líquido, prazo, parcelas e sua evolução, taxa de administração, fundo de reserva, seguros, reajustes, condições de lance e demais encargos.
- Fonte, data de consulta, validade e eventuais restrições comerciais.
- Mesmo objetivo de compra e parâmetros comuns entre as alternativas.

**Resultados:**
- Tabela lado a lado com **Plano de referência** e concorrente(s).
- Diferenças de prestações, custos projetados, crédito disponível e regras contratuais.
- Alertas de comparação não equivalente e campos ausentes.
- Argumentos comerciais baseados em diferenças verificáveis; vantagens e desvantagens de todas as alternativas.

**Fontes e atualização:**
- Dados públicos de sites oficiais e regulamentos, quando acessíveis.
- Propostas reais fornecidas pelo cliente e registradas manualmente com a devida referência.
- Estatísticas do Banco Central como **contexto de mercado**, não como substitutas de preços e condições individuais.
- Atualização automática apenas se existir fonte autorizada, estável e tecnicamente acessível.
- Registrar **fonte, data e status de validação**; evitar apresentar preços de divulgação como oferta vigente e garantida.
- Não coletar automaticamente dados de sistemas protegidos ou contornar autenticação e restrições de acesso.

### 4.4. Gerador de proposta comercial — prioridade 4

**Objetivo:** converter a análise em uma peça curta, profissional e compreensível.

**Saídas previstas:**
- Resumo com objetivo do cliente, entradas, cenários, diferenças financeiras e condições.
- Tabelas e gráficos simples, legíveis no celular.
- Texto comercial em linguagem natural, sem afirmações enganosas.
- Botão de copiar e opção de compartilhar pelo WhatsApp; se possível, impressão/PDF pelo navegador.
- Avisos claros de hipóteses, fontes, validade das condições e ausência de garantia de contemplação.

**Regras:** não preencher automaticamente dados pessoais, não inserir assinatura institucional, não inventar taxas ou condições e não ocultar custos desfavoráveis.

## 5. Evolução posterior — não faz parte do MVP

1. **Planejamento de aquisição:** comparar cenários para quem pretende comprar ou trocar um bem em meses/anos, considerando datas hipotéticas de contemplação.
2. **Custo de oportunidade e patrimônio:** comparar preservar ou aplicar recursos, utilizá-los como lance, poupar para comprar à vista ou financiar.
3. **Carta ideal / crédito líquido necessário:** recurso avançado dentro da estratégia de lances, quando a fórmula do plano for conhecida e validada.
4. **Amortização avançada:** modelos de redução de prazo ou de prestações com regras específicas do contrato.
5. **Biblioteca de condições de concorrentes:** histórico datado e auditável das informações públicas e comerciais, quando houver benefício comprovado.
6. **Argumentação contextual:** sugestões calculadas conforme objeção ou perfil da operação, sem transformar o sistema em um gerador de argumentos enviesados.

**Fora de escopo no lançamento:** simulador básico duplicado, CRM, cadastro de clientes, integração com sistemas internos, backend, autenticação e armazenamento de dados sensíveis.

## 6. Modelo de dados e parâmetros

Separar o **motor matemático** das **regras contratuais configuráveis** e da **camada de apresentação**.

### 6.1. Dados da operação

- Modalidade e finalidade: veículo, imóvel ou outras.
- Preço do bem; valor do crédito nominal; crédito líquido efetivamente utilizável.
- Prazo, data-base e cronograma de prestações informadas ou projetadas.
- Taxa de administração (base de incidência, total, eventual antecipação ou distribuição temporal).
- Fundo de reserva (base, cobrança e eventual restituição conforme contrato).
- Seguro e outros encargos, quando existirem.
- Critério e periodicidade de reajuste; índice de referência, se previsto.
- Regras de lance, lance embutido e amortização aplicáveis.
- Recursos próprios, entrada e objetivos financeiros do cliente.

### 6.2. Dados da comparação

- Financiamento: preço do bem, entrada, valor financiado, prestações, prazo, juros, CET/encargos e cronograma.
- Concorrente: administradora, identificação da proposta, condições, fonte e data.
- Cenários: mês hipotético de contemplação, hipótese de reajuste e rendimento alternativo, quando pertinente.
- Identificador genérico de cenário, sem conteúdo institucional.

### 6.3. Regras de cálculo

- Exibir valor nominal e, quando útil, comparação em valores presentes, **explicitando taxa de desconto**.
- Distinguir **parcela inicial**, **parcela futura projetada**, **custo contratual** e **custo total efetivo desembolsado**.
- Custo total projetado deve agregar apenas fluxos efetivamente pagos, sem dupla contagem de aportes, lances e parcelas.
- Separar desembolso de recursos próprios de redução do crédito por lance embutido.
- Não supor valor de restituição do fundo de reserva sem base contratual.
- Não substituir o CET do financiamento por taxa nominal, quando o CET for necessário para uma comparação justa.
- Reajustes devem ser parametrizados, e a ferramenta precisa mostrar cenários sem reajuste e com reajustes definidos pelo usuário, se aplicáveis.
- Cálculos devem tratar datas, prazos, arredondamentos e parcelas residuais de forma determinística.
- Se faltar informação crítica, **exibir “dados insuficientes” ou comparação parcial**, nunca preencher custos relevantes silenciosamente com zero.
- O sistema deve diferenciar **valor informado**, **valor calculado**, **valor estimado** e **condição verificada**.

## 7. Experiência do usuário e design

Inspirar-se no padrão geral da Calculadora de Crédito existente, sem reproduzir identidade visual de instituição financeira.

- Primeiro computador: largura confortável, boa densidade de informação e resultados lado a lado.
- Responsividade real para celular: campos grandes, cartões reorganizáveis e tabelas sem perda de leitura.
- Navegação por funcionalidades: menu superior / menu móvel, cartões e, se adequado, carrossel entre módulos.
- Visual profissional, limpo e neutro, com temas **Claro, Escuro e Colorido**; o tema colorido deve ter paleta própria, não institucional.
- Cada módulo terá uma **explicação de uso breve e objetiva**, compreensível para leigos.
- Exemplo opcional com números fictícios, claramente identificado, e botão **Limpar**.
- Campos essenciais primeiro; opções avançadas recolhidas em seção de detalhes.
- Máscaras brasileiras: moeda em R$, percentuais, inteiros e datas em `dd/mm/aaaa`.
- Validação imediata e legível; botão de calcular somente com dados essenciais válidos.
- Resumo de premissas próximo aos resultados; destaque para riscos e limitações relevantes.
- Acessibilidade: teclado, rótulos explícitos, contraste adequado, foco visível e estados de erro anunciáveis.
- Gerar oferta, copiar resumo e compartilhar por WhatsApp a partir do resultado.

### 7.1. Jornada ideal

1. Escolher a situação comercial (financiamento, lance, concorrente ou proposta).
2. Informar os dados mínimos já disponíveis no atendimento.
3. Calcular e apresentar cenários comparáveis.
4. Ler conclusão fundamentada, incluindo oportunidades e riscos.
5. Ajustar hipóteses e gerar mensagem/proposta.

## 8. Arquitetura e publicação

- Repositório: `tools`; diretório: `calculadora-consorcio/`.
- Site estático publicado via GitHub Pages, mantendo independência dos demais módulos.
- Tecnologias preferenciais: **HTML, CSS e JavaScript puros**, sem framework ou build obrigatório.
- Estrutura sugerida quando iniciar a implementação:

```text
calculadora-consorcio/
├── README.md
├── index.html
├── css/
│   └── app.css
├── js/
│   ├── app.js
│   ├── calculos.js
│   ├── regras.js
│   └── propostas.js
├── data/
│   └── fontes-exemplo.json
└── tests/
    └── calculos.test.js
```

- Nomes técnicos devem ser genéricos e descritivos; não usar identificadores da instituição de referência.
- Regras contratuais nunca devem estar espalhadas pela UI; centralizar parâmetros configuráveis e validar seu formato.
- Sem segredo ou credencial no navegador; não usar chaves privadas em arquivos públicos.
- Preferir cálculos inteiramente locais para preservar privacidade e disponibilidade.
- Cadastrar o link da nova ferramenta na página inicial de `tools` **somente após a implementação mínima estar utilizável**.
- Rodapé sugerido: **“Simulação matemática. Resultados sujeitos às premissas e condições contratuais. Desenvolvido por: bmachado.dev – 2026.”**
- Não copiar elementos gráficos nem mensagens institucionais de terceiros.

## 9. Qualidade, conferência e segurança comercial

Antes de divulgar qualquer módulo:

1. Confrontar resultados com **exemplos verificáveis** de simulações operacionais e propostas reais, utilizando dados anonimizados.
2. Registrar casos de teste: sem lance; lance próprio; lance embutido; combinado; crédito líquido inferior ao necessário; reajuste; taxa/seguro ausente; dados contraditórios; contemplação hipotética em meses diferentes.
3. Conferir totais de desembolso mês a mês e igualdade dos fluxos na comparação.
4. Testar limites e entradas inválidas: zero, negativos, datas inconsistentes, percentuais fora da faixa, prazo excessivo e valor de lance superior ao limite contratual.
5. Exigir fonte e data para propostas de concorrentes; marcar dados vencidos como não confirmados.
6. Identificar explicitamente resultados que **não** podem ser inferidos apenas com números: chance de contemplação, aprovação cadastral, regras de assembleia, disponibilidade imediata, preços efetivos e restituições.
7. Testar navegação em desktop e celular; não publicar gráficos e tabelas que escondam dados relevantes.
8. Revisar a identidade neutra de ponta a ponta antes do commit e da publicação.
9. Validar textos comerciais: nenhuma afirmação de contemplação garantida, de economia universal ou de superioridade sem comparação equivalente.

## 10. Roadmap por ordem de entrega

### Fase 0 — Preparação (atual)

- [x] Definir missão comercial e descartar simulador básico duplicado.
- [x] Definir neutralidade absoluta da instituição de referência e permissão de nomear concorrentes.
- [x] Definir módulos prioritários e arquitetura simples.
- [x] Criar diretório e README do projeto.
- [ ] Reunir **exemplos anonimizados** com condições contratuais reais e documentar premissas.
- [ ] Criar casos matemáticos de referência e critérios de validação.

### Fase 1 — MVP

- [ ] Criar interface responsiva e navegação.
- [ ] Implementar **Comparar alternativas**.
- [ ] Implementar **Estratégia de lances**.
- [ ] Implementar **Analisar proposta concorrente**.
- [ ] Implementar **Gerador de proposta** e compartilhamento.
- [ ] Executar testes numéricos e revisão de textos.
- [ ] Adicionar à página inicial de `tools` quando estiver pronto.

### Fase 2 — Inteligência comercial

- [ ] Planejamento de aquisição.
- [ ] Comparação de custo de oportunidade e investimentos.
- [ ] Análise de amortização avançada.
- [ ] Catálogo atualizado e verificável de condições concorrentes, caso seja sustentável.
- [ ] Melhorias de argumentos e apresentações fundamentadas.

## 11. Decisões técnicas ainda pendentes

Definir **com base em dados reais**, antes de codificar regras específicas:

- Fórmula contratual de distribuição da taxa de administração e eventuais antecipações.
- Índices e periodicidade de reajuste por modalidade/plano.
- Fundo de reserva, seguro, restituições e cobranças eventuais.
- Limites de lance embutido e bases de cálculo.
- Critério de abatimento de saldo, prazo e/ou parcelas após lance.
- Regras aplicáveis a FGTS, quando pertinente.
- Como obter e renovar condições documentadas de concorrentes.
- Convenção exata de arredondamento e tratamento de diferenças residuais.

**Regra de decisão:** na ausência de informação suficiente, entregar cálculo parcial transparente em vez de inventar parâmetros.

## 12. Critérios de aceite do MVP

O MVP estará pronto quando:

- Um atendente conseguir executar as quatro tarefas prioritárias **sem usar outro simulador básico dentro desta ferramenta**.
- Uma pessoa leiga entender o preenchimento com explicações curtas.
- Resultados financeiros forem reproduzíveis, rastreáveis e passarem nos casos de teste.
- Lances embutidos, reajustes e datas hipotéticas não produzirem conclusões enganosas.
- Propostas concorrentes exibirem nome, fonte e data quando disponíveis, ou aviso de ausência dessas informações.
- O gerador produzir um resumo comercial útil para WhatsApp com premissas e alertas.
- O código e a interface não contiverem identificadores da instituição de referência.
- O projeto funcionar como página estática, de modo independente, no desktop e no celular.

---

**Princípio orientador:** esta ferramenta não precisa calcular tudo; precisa **esclarecer as escolhas do cliente com comparações corretas** e apoiar uma oferta comercial responsável.
