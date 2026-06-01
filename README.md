# Gestão Comercial — Matriz de Oportunidades

Ferramenta de **controle diário de gestão comercial** para concessionária (ou qualquer operação de vendas com rotina de consultores). É um **único arquivo HTML** (`index.html`), sem servidor, sem login e sem dependências externas — basta abrir no navegador.

## Como usar

- **Abrir localmente:** dê duplo clique em `index.html` (ou arraste para o navegador).
- **Compartilhar:** como é um HTML estático, pode ser hospedado em qualquer lugar (servidor interno/intranet da empresa, SharePoint, Netlify, Cloudflare Pages, GitHub Pages etc.). O link fica no domínio do serviço escolhido.
- Funciona **offline** e passa em firewall corporativo, pois não carrega nada de fora.

## Conceito

Três camadas que se cruzam para gerar leituras de gestão:

1. **Check-in (manhã)** — o que o consultor planeja para o dia.
2. **Check-out (fim do dia)** — o que ele reportou que fez.
3. **Sistema / Auditoria** — o gestor lança a "verdade" do sistema.

Comparações automáticas:

- **vs Meta** — realizado contra o alvo cadastrado.
- **Aderência** (check-in × check-out) — `real ÷ planejado`. Mede se o consultor cumpre a própria palavra.
- **Acuracidade %** (check-out × sistema) — mede se o relato do consultor bate com o sistema.
- **Projeção** — `realizado acumulado ÷ dias úteis decorridos × dias úteis do mês`. Só no indicador principal de quantidade.

## Funcionalidades

- **Matriz / Painel:** acumulado por vendedor (mês ou semana), mapa de calor (vermelho→âmbar→verde→azul), blocos coloridos por indicador. Cada bloco expande para mostrar **sub-indicadores** (Real · %) e **taxas** (atual · alvo). Coluna de **Projeção** no indicador principal.
- **Check-in / Check-out diário:** grade semanal com linha de *plano* (tracejada) e *real*, com a meta de sábado aplicada automaticamente e a coluna de **Aderência**.
- **Sistema (Auditoria):** lançamento dos números reais do sistema por vendedor (alimenta taxas e acuracidade).
- **Foco & Ranking:** ranking por ritmo, listas de "atenção do dia" (abaixo do ritmo, relato furado, plano não cumprido) e **gráfico de ritmo** (acumulado real × meta ideal + projeção).
- **Resumo Geral:** consolidado da equipe, semana e mês lado a lado.
- **Configuração:**
  - Dias úteis do mês (cálculo automático sem domingos, editável).
  - Cadastro dinâmico de **vendedores**.
  - **Indicadores** customizáveis e hierárquicos: principal → sub-indicadores e taxas `A ÷ B` (com opção de inverter e definir alvo, ou modo **manual** ex.: NPS). Cada indicador liga/desliga check-in e check-out e define metas **mensal / diária / de sábado** com validação (`diária × dias úteis ≥ mensal`).
  - **Backup** exportar/importar (`.json`) e **exportar CSV**.
- **Tema claro/escuro**, **nome da loja editável** no topo e modo **Mover** para reordenar linhas (vendedores) e colunas (indicadores) arrastando.

## Armazenamento

Os dados ficam salvos no `localStorage` do navegador de cada gestor, **separados por mês** (troque o mês no topo para ver/editar períodos anteriores). Não há banco central: cada gestor vê a própria base. Use o **backup** para não perder dados ao limpar o cache ou para passar a base entre aparelhos.

## Desenvolvimento

Tudo vive em `index.html` (HTML + CSS + JS embutidos). Para alterar, edite o arquivo e recarregue o navegador.
