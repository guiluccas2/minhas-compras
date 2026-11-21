// Telas: Início, Estoque, Lista de compras e Ficha do item.

import { esc, num, pluralizar, reais, reaisFino, hoje, dataCurta, dataExtenso, diasEntre, diaSemana, norm, aviso, abrirJanela, fecharJanela, lerNum, $, quandoRel, isoDeTs, agrupar } from "./util.js";
import { cfg, itensAtivos, situacao, listaCompras, sugestaoTexto, resumoMes, vencendo, proxSemanal, proxGrande, porId, historicoItem, movsItem, precoInfo, nomeLoja, salvar, apagar, doTipo, compraAberta, estado } from "./dados.js";
import { nuvem } from "./nuvem.js";
import { cartaoItem, selo, qtdTxt, abrirConsumo, formItem, unTxt, precoTxt } from "./ui.js";
import { CATEGORIAS, LOCAIS, NOME_BASE, TIPOS_LOJA } from "./catalogo.js";
import { precosItemHtml, codigosItemHtml } from "./extras.js";

export const ICONE_COD = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M17 8v8"/></svg>`;
export const filtros = { busca: "", grupo: "Tudo", sit: "todos", listaTipo: "semanal", listaLoja: "todas" };

// ================= INÍCIO =================
export function telaInicio() {
  const c = cfg();
  const r = resumoMes();
  const sem = listaCompras("semanal"), gr = listaCompras("grande");
  const acabou = itensAtivos().filter(i => situacao(i).status === "acabou");
  const dSem = proxSemanal(), dGr = proxGrande();
  const acabando = sem.filter(x => x.item && x.motivo !== "acabou" && x.motivo !== "anotado");
  const venc = vencendo();
  const semRegistro = itensAtivos().filter(i => situacao(i).status === "desconhecido").length;
  const aberta = compraAberta();
  const orc = Number(c.orcamento) || 0;
  const pct = orc ? Math.min(100, Math.round((r.gasto / orc) * 100)) : 0;
  const nomes = l => l.slice(0, 6).map(x => esc(x.item?.nome || x.texto)).join(" · ") + (l.length > 6 ? ` · +${l.length - 6}` : "");
  const quando = d => d === hoje() ? "hoje" : `${diaSemana(d)}, ${dataCurta(d)}`;

  return `
  <header class="topo"><div><h1>Olá${estado.usuario ? ", " + esc(estado.usuario) : ""}!</h1><p class="sub">${dataExtenso(hoje())}</p></div></header>
  ${nuvem.erro ? `<div class="faixa alerta">Sem ligação com a nuvem: as anotações ficam guardadas neste aparelho e são enviadas quando a conexão voltar. <button class="link" data-acao="recarregar">Tentar de novo</button></div>` : ""}
  ${aberta ? `<a class="faixa" href="#/comprando">🛒 Compra em andamento em ${esc(nomeLoja(aberta.loja))} · continuar</a>` : ""}
  ${semRegistro > itensAtivos().length * 0.6 ? `
  <section class="cartao destaque">
    <h2>Primeiros passos</h2>
    <ol class="passos">
      <li><a href="#/catalogo">Confira o catálogo</a>: desmarque o que vocês não usam e acrescente o que faltar.</li>
      <li><a href="#/inventario">Faça o inventário</a>: anote o que tem em casa hoje.</li>
      <li>Na próxima ida ao mercado, use o <b>Modo Compra</b>: os preços e o estoque entram sozinhos.</li>
    </ol>
  </section>` : ""}
  <div class="kpis">
    <div class="kpi"><span class="sub">Gasto no mês</span><b>${reais(r.gasto)}</b>${orc ? `<div class="barra"><b style="width:${pct}%;background:${pct >= 100 ? "var(--verm)" : pct > 85 ? "var(--amar)" : "var(--verde)"}"></b></div><span class="sub">de ${reais(orc)}</span>` : `<a class="sub link" href="#/config">definir orçamento</a>`}</div>
    <div class="kpi"><span class="sub">Idas às compras no mês</span><b>${r.idas}</b><span class="sub">${r.compras.length} compra${r.compras.length === 1 ? "" : "s"} registrada${r.compras.length === 1 ? "" : "s"}</span></div>
  </div>
  <div class="grade2">
    <a class="cartao clic" href="#/lista?t=semanal">
      <div class="linha1"><b>Compra semanal</b><span class="pill p-azul">${sem.length} ${sem.length === 1 ? "item" : "itens"}</span></div>
      <span class="sub">${quando(dSem)}</span>
      ${sem.length ? `<span class="sub">${nomes(sem)}</span>` : ""}
    </a>
    <a class="cartao clic" href="#/lista?t=grande">
      <div class="linha1"><b>Compra grande</b><span class="pill p-azul">${gr.length} ${gr.length === 1 ? "item" : "itens"}</span></div>
      <span class="sub">${quando(dGr)}${dGr === hoje() && c.proxGrande && c.proxGrande < hoje() ? " (atrasada)" : ""}</span>
      ${gr.length ? `<span class="sub">${nomes(gr)}</span>` : ""}
    </a>
  </div>
  ${acabou.length ? `<a class="cartao clic" href="#/estoque?sit=acabou"><div class="linha1"><b>Acabou</b><span class="pill p-verm">${acabou.length}</span></div><span class="sub">${acabou.slice(0, 8).map(i => esc(i.nome)).join(" · ")}${acabou.length > 8 ? " · …" : ""}</span></a>` : ""}
  ${acabando.length ? `<a class="cartao clic" href="#/lista?t=semanal"><div class="linha1"><b>Acaba antes da compra de ${diaSemana(dSem)}</b><span class="pill p-amar">${acabando.length}</span></div><span class="sub">${acabando.slice(0, 8).map(x => `${esc(x.item.nome)}${x.sit.diasRest != null ? ` (${Math.max(0, Math.floor(x.sit.diasRest))} d)` : ""}`).join(" · ")}</span></a>` : ""}
  ${venc.length ? `<div class="cartao"><div class="linha1"><b>Vence em breve</b><span class="pill p-azul">${venc.length}</span></div><span class="sub">${venc.map(v => `${esc(v.item.nome)} (${dataCurta(v.validade)})`).join(" · ")}</span></div>` : ""}
  <div class="botoes col">
    <a class="btn" href="#/lista">Ver lista de compras</a>
    <a class="btn sec" href="#/estoque">Anotar consumo</a>
  </div>
  ${r.compras.length ? `<a class="link centro" href="#/relatorio">Ver o relatório de ${["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][+hoje().slice(5, 7) - 1]} →</a>` : ""}`;
}

// ================= ESTOQUE =================
export function telaEstoque(params) {
  if (params.get("sit")) filtros.sit = params.get("sit");
  const grupos = ["Tudo", ...LOCAIS, ...CATEGORIAS.map(c => c.nome)];
  const q = norm(filtros.busca);
  let lista = itensAtivos().filter(i => !q || norm(i.nome).includes(q));
  if (filtros.grupo !== "Tudo") lista = lista.filter(i => i.local === filtros.grupo || i.cat === filtros.grupo);
  if (filtros.sit !== "todos") lista = lista.filter(i => {
    const s = situacao(i);
    if (filtros.sit === "acabou") return s.status === "acabou";
    if (filtros.sit === "acabando") return s.status === "acabando" || (s.diasRest != null && s.diasRest <= 7 && s.status !== "acabou");
    if (filtros.sit === "tem") return s.status === "tem" || s.status === "acabando";
    if (filtros.sit === "sem") return s.status === "desconhecido";
    return true;
  });
  const total = itensAtivos().length;
  const nAcabou = itensAtivos().filter(i => situacao(i).status === "acabou").length;
  const porLocal = agrupar(lista, i => filtros.grupo === "Tudo" ? i.local : "");
  return `
  <header class="topo"><div><h1>Estoque</h1><p class="sub">${total} itens · ${nAcabou} acabaram</p></div><button class="btn mini-btn" data-acao="novo-item">＋ Item</button></header>
  <div class="busca com-botao"><input id="busca" type="search" placeholder="Buscar item…" value="${esc(filtros.busca)}" aria-label="Buscar item"><button class="btn sec" data-acao="ler-codigo" data-ctx="estoque" aria-label="Ler código de barras" title="Ler código de barras">${ICONE_COD}</button></div>
  <div class="chips rolar">${grupos.map(g => `<button class="chip ${g === filtros.grupo ? "on" : ""}" data-grupo="${esc(g)}">${esc(g)}</button>`).join("")}</div>
  <div class="chips">${[["todos", "Todos"], ["acabou", "Acabou"], ["acabando", "Acabando"], ["tem", "Tem"], ["sem", "Sem registro"]].map(([k, v]) => `<button class="chip peq ${k === filtros.sit ? "on" : ""}" data-sit="${k}">${v}</button>`).join("")}</div>
  ${lista.length ? [...porLocal].map(([loc, its]) => `${loc ? `<h3 class="secao">${esc(loc)}</h3>` : ""}<div class="lista-cartoes">${its.map(cartaoItem).join("")}</div>`).join("") : `<p class="vazio">Nenhum item encontrado.${q ? ` <button class="link" data-acao="novo-item" data-nome="${esc(filtros.busca)}">Cadastrar “${esc(filtros.busca)}”</button>` : ""}</p>`}`;
}

// ================= LISTA DE COMPRAS =================
export function telaLista(params) {
  if (params.get("t")) filtros.listaTipo = params.get("t");
  const tipo = filtros.listaTipo;
  const data = tipo === "grande" ? proxGrande() : proxSemanal();
  let lista = listaCompras(tipo);
  const lojaTipo = filtros.listaLoja;
  if (lojaTipo !== "todas") lista = lista.filter(x => (x.item ? (CATEGORIAS.find(c => c.nome === x.item.cat)?.loja || "mercado") : "mercado") === lojaTipo);
  const estimativa = lista.reduce((s, x) => {
    if (!x.item) return s;
    const h = historicoItem(x.item.id)[0];
    if (!h) return s;
    const p = precoInfo(h);
    const un = x.sug || p.unidades || 1;
    return s + (isFinite(p.porUn) ? p.porUn * un : 0);
  }, 0);
  const motivoPill = x => ({ acabou: ["p-verm", "acabou"], acabando: ["p-amar", "acabando"], "mínimo": ["p-amar", "no mínimo"], anotado: ["p-azul", "anotado"] })[x.motivo] || ["p-amar", x.sit?.diasRest != null ? `${Math.max(0, Math.floor(x.sit.diasRest))} dias` : "previsão"];
  const aberta = compraAberta();
  return `
  <header class="topo"><div><h1>Lista de compras</h1><p class="sub">${tipo === "grande" ? "Compra grande" : "Compra semanal"}: ${data === hoje() ? "hoje" : `${diaSemana(data)}, ${dataCurta(data)}`}</p></div><button class="btn mini-btn" data-acao="anotar-lista">＋ Anotar</button></header>
  <div class="seg"><button class="${tipo === "semanal" ? "on" : ""}" data-lista-tipo="semanal">Semanal</button><button class="${tipo === "grande" ? "on" : ""}" data-lista-tipo="grande">Grande</button></div>
  <div class="chips rolar">${["todas", ...TIPOS_LOJA].map(t => `<button class="chip ${t === lojaTipo ? "on" : ""}" data-lista-loja="${t}">${t === "todas" ? "Todas as lojas" : t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
  ${lista.length ? `<div class="cartao lista">${lista.map(x => {
    const [cls, txt] = motivoPill(x);
    if (!x.item) return `<div class="li"><div class="tx"><div class="linha1"><b>${esc(x.texto)}</b><span class="pill ${cls}">${txt}</span></div><span class="sub">${x.sug ? "qtd: " + esc(x.sug) + " · " : ""}anotado${x.manual.por ? " por " + esc(x.manual.por) : ""}</span></div><button class="mini" data-acao="tirar-lista" data-id="${x.manual.id}" aria-label="Tirar da lista">✕</button></div>`;
    const h = historicoItem(x.item.id)[0];
    const ult = h ? `última: ${h.marca ? esc(h.marca) + " " : ""}${reais(h.preco)} (${esc(nomeLoja(h.loja))}, ${dataCurta(h.data)})${h.promo ? " promoção" : ""}` : "sem compra registrada";
    return `<div class="li"><div class="tx"><div class="linha1"><a class="nome" href="#/item/${x.item.id}">${esc(x.item.nome)}</a><span class="pill ${cls}">${txt}</span></div><span class="sub">${x.sug ? "sugestão: " + esc(sugestaoTexto(x.item, x.sug)) + " · " : ""}${ult}</span></div>${x.manual ? `<button class="mini" data-acao="tirar-lista" data-id="${x.manual.id}" aria-label="Tirar da lista">✕</button>` : ""}</div>`;
  }).join("")}</div>
  <div class="kpi linha1"><span class="sub">Estimativa pelos últimos preços</span><b>${reais(estimativa)}</b></div>` : `<p class="vazio">Nada para comprar nesta lista por enquanto.</p>`}
  <div class="botoes col">${aberta ? `<a class="btn" href="#/comprando">Continuar a compra em ${esc(nomeLoja(aberta.loja))}</a>` : `<button class="btn" data-acao="iniciar-compra" data-tipo="${tipo}">Iniciar Modo Compra</button>`}</div>`;
}

export function anotarNaLista() {
  const el = abrirJanela(`<h3>Anotar na lista</h3>
    <form class="form" id="fl">
      <label class="campo"><span>Item</span><input id="fl-txt" list="fl-itens" placeholder="Digite o nome" autocomplete="off"></label>
      <datalist id="fl-itens">${itensAtivos().map(i => `<option value="${esc(i.nome)}">`).join("")}</datalist>
      <label class="campo"><span>Quantidade (opcional)</span><input id="fl-q" placeholder="ex.: 2"></label>
      <div class="botoes"><button class="btn">Anotar</button></div>
    </form>`);
  $("#fl", el).addEventListener("submit", e => {
    e.preventDefault();
    const txt = $("#fl-txt", el).value.trim();
    if (!txt) return;
    const it = itensAtivos().find(i => norm(i.nome) === norm(txt));
    const q = $("#fl-q", el).value.trim();
    salvar({ t: "lista", item: it?.id || null, texto: it ? "" : txt, qtd: q ? (lerNum(q) || q) : null, feito: false });
    fecharJanela();
    aviso(`${txt} anotado na lista`);
  });
}

// ================= FICHA DO ITEM =================
export function telaItem(id) {
  const it = porId(id);
  if (!it) return `<p class="vazio">Item não encontrado. <a href="#/estoque">Voltar ao estoque</a></p>`;
  const s = situacao(it);
  const sl = selo(it, s);
  const hist = historicoItem(id);
  const movs = movsItem(id).slice(0, 15);
  const ano = Date.now() - 365 * 86400000;
  const comBase = hist.filter(h => isFinite(precoInfo(h).porBase) && h.ts >= ano);
  const melhor = comBase.reduce((m, h) => (!m || precoInfo(h).porBase < precoInfo(m).porBase ? h : m), null);
  const base = melhor ? precoInfo(melhor).base : null;
  const tipoMov = { usei: "usou", abri: "abriu", acabou: "acabou 1", zerou: "acabou tudo", contagem: "contagem", status: "situação" };
  return `
  <header class="topo"><div><a class="voltar" href="#/estoque">← Estoque</a><h1>${esc(it.nome)}</h1><p class="sub">${esc(it.cat)} · ${esc(it.local)} · compra ${it.freq === "semanal" ? "semanal" : "grande"}</p></div><button class="btn mini-btn sec" data-acao="editar-item" data-id="${id}">Editar</button></header>
  <div class="cartao"><div class="linha1"><b>${esc(qtdTxt(it, s))}</b><span class="pill ${sl.cls}">${sl.txt}</span></div>
    <button class="btn" data-acao="consumo" data-id="${id}">Anotar consumo</button></div>
  <div class="kpis">
    <div class="kpi"><span class="sub">Dura em média</span><b>${s.duracaoMedia ? Math.round(s.duracaoMedia) + " dias" : s.taxa && it.modo !== "status" ? num(1 / s.taxa, 1) + " dias/" + esc(unTxt(it, 1)) : "—"}</b><span class="sub">${s.duracaoMedia ? "cada compra" : s.fonteTaxa === "informado" ? "valor informado" : s.taxa ? "pelo consumo anotado" : "ainda aprendendo"}</span></div>
    <div class="kpi"><span class="sub">Melhor preço (12 meses)</span><b>${melhor ? reaisFino(precoInfo(melhor).porBase) : "—"}</b><span class="sub">${melhor ? `por ${NOME_BASE[base]} · ${esc(nomeLoja(melhor.loja))}` : "sem compras"}</span></div>
  </div>
  ${comBase.length > 1 ? grafico(comBase.slice().reverse(), base) : ""}
  ${precosItemHtml(id)}
  <h3 class="secao">Compras</h3>
  ${hist.length ? `<div class="cartao lista">${hist.slice(0, 30).map(h => `<div class="li"><div class="tx"><div class="linha1"><b>${dataCurta(h.data)} · ${esc(nomeLoja(h.loja))}</b><span class="num">${reais(h.preco)}</span></div>
    <span class="sub">${h.marca ? esc(h.marca) + " · " : ""}${esc(descEmb(h))}${precoTxt(h) ? " · " + precoTxt(h) : ""}${h.promo ? ` · <span class="promo">promoção</span>` : ""}</span></div></div>`).join("")}</div>` : `<p class="vazio">Nenhuma compra registrada.</p>`}
  <h3 class="secao">Anotações recentes</h3>
  ${movs.length ? `<div class="cartao lista">${movs.map(m => `<div class="li"><div class="tx"><div class="linha1"><span>${quandoRel(isoDeTs(m.ts))} · ${tipoMov[m.tipo] || m.tipo}${m.tipo === "usei" || m.tipo === "contagem" ? " " + num(m.q, 2) : m.tipo === "status" ? ": " + esc(m.q) : ""}</span><button class="mini" data-acao="apagar-mov" data-id="${m.id}" aria-label="Apagar anotação">✕</button></div><span class="sub">${m.por ? esc(m.por) : ""}</span></div></div>`).join("")}</div>` : `<p class="vazio">Nenhuma anotação ainda.</p>`}
  ${it.obs ? `<p class="sub">Obs.: ${esc(it.obs)}</p>` : ""}
  ${codigosItemHtml(it)}`;
}

export function descEmb(l) {
  const q = Number(l.qtd) || 0, por = Number(l.porEmb) || 1;
  const un = l.unNome || "un";
  const cont = l.conteudo ? ` de ${num(l.conteudo, 3)} ${l.medida === "lav" ? "lavagens" : l.medida === "fl" ? "folhas" : l.medida}` : "";
  if (por > 1) return `${num(q)} ${pluralizar(l.embNome || "embalagem", q)} × ${por} ${pluralizar(un, por)}${cont}`;
  return `${num(q, 3)} ${pluralizar(un, q)}${cont}`;
}

function grafico(pts, base) {
  const W = 300, H = 90, pad = 22;
  const vs = pts.map(h => precoInfo(h).porBase);
  const min = Math.min(...vs), max = Math.max(...vs);
  const t0 = pts[0].ts, t1 = pts[pts.length - 1].ts || t0 + 1;
  const x = t => pad + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad - 8);
  const y = v => max === min ? H / 2 : 8 + (1 - (v - min) / (max - min)) * (H - 28);
  const d = pts.map((h, i) => `${i ? "L" : "M"}${x(h.ts).toFixed(1)} ${y(vs[i]).toFixed(1)}`).join(" ");
  return `<div class="cartao"><span class="sub">Preço por ${NOME_BASE[base]} nas compras</span>
  <svg viewBox="0 0 ${W} ${H}" class="graf" role="img" aria-label="Histórico do preço por ${NOME_BASE[base]}">
    <path d="${d}" fill="none" stroke="var(--verde)" stroke-width="2"/>
    ${pts.map((h, i) => `<circle cx="${x(h.ts).toFixed(1)}" cy="${y(vs[i]).toFixed(1)}" r="3.5" fill="${h.promo ? "var(--azul)" : "var(--verde)"}"/>`).join("")}
    <text x="0" y="12" font-size="9" fill="var(--sub)">${reaisFino(max)}</text>
    <text x="0" y="${H - 22}" font-size="9" fill="var(--sub)">${max === min ? "" : reaisFino(min)}</text>
    <text x="${pad}" y="${H - 4}" font-size="9" fill="var(--sub)">${dataCurta(pts[0].data)}</text>
    <text x="${W - 8}" y="${H - 4}" font-size="9" fill="var(--sub)" text-anchor="end">${dataCurta(pts[pts.length - 1].data)}</text>
  </svg><span class="sub"><span style="color:var(--azul)">●</span> promoção</span></div>`;
}
