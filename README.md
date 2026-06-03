# Gestão Comercial — Matriz de Oportunidades

Ferramenta de **controle diário de gestão comercial** para concessionária (ou qualquer operação de vendas com rotina de consultores). É um **único arquivo HTML** (`index.html`), sem servidor, sem login e sem dependências externas — basta abrir no navegador.

## Como usar

- **Abrir localmente:** dê duplo clique em `index.html` (ou arraste para o navegador).
- **Compartilhar:** como é um HTML estático, pode ser hospedado em qualquer lugar (servidor interno/intranet, SharePoint, Netlify, Cloudflare Pages, GitHub Pages etc.).
- Funciona **offline** e passa em firewall corporativo, pois não carrega nada de fora.

## Conceito

Três camadas que se cruzam para gerar leituras de gestão:

1. **Check-in (manhã)** — o que o consultor planeja para o dia.
2. **Check-out (fim do dia)** — o que ele reportou que fez.
3. **Sistema (verdade)** — o gestor lança no painel, clicando no nome na matriz (modal).

Comparações automáticas:

- **vs Meta** — realizado contra o alvo.
- **Aderência** (check-in × check-out) — `real ÷ planejado`.
- **Acuracidade %** (check-out × sistema) — se o relato bate com o sistema.
- **Projeção** — `realizado acumulado ÷ dias úteis decorridos × dias úteis do mês`.

## Funcionalidades

- **Matriz / Painel:** acumulado por vendedor (mês ou semana), mapa de calor (`<50% / 50-89% / ≥90% / ≥120%`), blocos coloridos por indicador. Cada bloco expande para mostrar **sub-indicadores** (Real · %) e **taxas** (atual · alvo). Coluna de **Projeção** no principal. Indicadores **"só taxa"** (ex.: NPS) aparecem como valor · alvo. Botões **Reordenar** (arrastar linhas/colunas) e **CSV**.
- **Acuracidade do Relato:** painel abaixo da matriz — **auditoria do mês** (check-in · relato × sistema). Clique no **nome** para abrir o modal de auditoria; na matriz, clique no nome para **lançar o sistema** (modal com indicadores expansíveis). Inclui **0** no sistema no cálculo.
- **Resumo Geral:** consolidado da equipe com **Semana / Mês / Projeção**, distinguindo **Meta Vend.** (soma das metas dos vendedores) de **Meta Loja** (meta real/sistêmica, definida no botão 🚩). A Meta Vend. fica **vermelha** quando abaixo da Meta Loja. O % e a projeção comparam com a Meta Loja quando definida.
- **Check-in / Check-out diário:** grade semanal (blocos de 7 dias) com coluna **Meta/dia**, **plano + real empilhados** na mesma célula, meta de sábado automática, destaque do dia de hoje e total semanal.
- **Foco & Ranking:** **ranking em tabela** por ritmo (com acuracidade e aderência), listas de "atenção do dia" (abaixo do ritmo, relato furado, plano não cumprido) e **gráfico de ritmo** (acumulado real × meta ideal + projeção).
- **Configuração:** dias úteis (auto, editável; badge no topo), vendedores dinâmicos, indicadores hierárquicos (principal → subs + taxas `A÷B` com inverter/alvo/manual, flag **"só taxa"**), metas **mensal / diária / sábado** com validação (`diária × dias úteis ≥ mensal`), **backup** JSON e export CSV.
- **Tema claro/escuro**, **nome da loja editável** no cabeçalho, **navegação por teclado** (Enter/setas) nas grades e **persistência da interface** ao recarregar.

## Armazenamento

Os dados ficam no `localStorage` do navegador de cada gestor, **separados por mês** (troque o mês no topo). Não há banco central: cada gestor vê a própria base. Use o **backup** para não perder dados ou para passar a base entre aparelhos.

## Desenvolvimento

Tudo vive em `index.html` (HTML + CSS + JS embutidos). Para alterar, edite o arquivo e recarregue o navegador.

**Restaurar versão anterior:** existe um backup em `index.html.backup-20260603-181537` (antes dos modais de auditoria). Para voltar: `cp index.html.backup-20260603-181537 index.html`
