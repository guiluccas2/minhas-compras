// Modo Compra (no mercado), registro de cada item com preço por unidade, finalização e histórico de compras.

import { esc, num, reais, reaisFino, hoje, dataCurta, diaSemana, norm, aviso, abrirJanela, fecharJanela, confirmar, lerNum, $, $$, somaDias, tsDeIso, agrupar } from "./util.js";
import { cfg, itensAtivos, lojas, nomeLoja, porId, salvar, apagar, compras, compraAberta, linhasDaCompra, totalCompra, listaCompras, historicoItem, precoInfo, doTipo, sugestaoTexto, porCategoria } from "./dados.js";
import { formItem, unTxt, precoTxt } from "./ui.js";
import { descEmb, ICONE_COD } from "./telas.js";
import { MEDIDAS, NOME_BASE, PAGAMENTOS } from "./catalogo.js";

const NOME_TIPO = { semanal: "Semanal", grande: "Compra grande", avulsa: "Avulsa" };
const NOME_FIN = { pendente: "a lançar no financeiro", lancado: "lançada no financeiro", revisar: "alterada depois de lançada: revisar no financeiro", ignorado: "fora do financeiro" };

// Compra finalizada guarda total e nº de itens (o Minhas Finanças lê só a compra, sem os itens).
// Se ela já tinha sido lançada no financeiro e o total mudou, volta para revisão lá.
export function gravarTotal(c) {
  if (!c || c.status !== "fim") return;
  const total = Math.round(totalCompra(c) * 100) / 100;
  const n = linhasDaCompra(c.id).length;
  const pc = porCategoria(c);
  if (c.total === total && c.nItens === n && JSON.stringify(c.porCat || {}) === JSON.stringify(pc)) return;
  c.total = total; c.nItens = n; c.porCat = pc;
  if (c.fin === "lancado" && c.finValor != null && Math.round(total * 100) !== c.finValor) c.fin = "revisar";
  else if (c.fin === "revisar" && Math.round(total * 100) === c.finValor) c.fin = "lancado";
  salvar(c);
}
export const buscaCompra = { q: "" };

// ---------- Iniciar ----------
export function iniciarCompra(tipo = "semanal", { passada = false } = {}) {
  const aberta = compraAberta();
  if (aberta) { location.hash = "#/comprando"; return; }
  const ls = lojas().filter(l => l.ativo !== false);
  const el = abrirJanela(`<h3>${passada ? "Lançar compra já feita" : "Iniciar compra"}</h3>
    <form class="form" id="fc">
      <label class="campo"><span>Loja</span><select id="fc-loja">${ls.map(l => `<option value="${l.id}">${esc(l.nome)}${l.cidade ? " (" + esc(l.cidade) + ")" : ""}</option>`).join("")}</select></label>
      <label class="campo"><span>Tipo de compra</span><select id="fc-tipo">${Object.entries(NOME_TIPO).map(([k, v]) => `<option value="${k}" ${k === tipo ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="campo"><span>Data</span><input id="fc-data" type="date" value="${hoje()}" max="${hoje()}"></label>
      <div class="botoes"><button class="btn">${passada ? "Começar a lançar" : "Começar"}</button></div>
    </form>`);
  $("#fc", el).addEventListener("submit", e => {
    e.preventDefault();
    const c = salvar({ t: "compra", loja: $("#fc-loja", el).value, tipo: $("#fc-tipo", el).value, data: $("#fc-data", el).value || hoje(), status: "aberta", ajuste: 0 });
    fecharJanela();
    buscaCompra.q = "";
    location.hash = "#/comprando";
    return c;
  });
}

// ---------- Tela do Modo Compra ----------
export function telaComprando() {
  const c = compraAberta();
  if (!c) return `<header class="topo"><h1>Modo Compra</h1></header><p class="vazio">Nenhuma compra em andamento.</p>
    <div class="botoes col"><button class="btn" data-acao="iniciar-compra" data-tipo="semanal">Iniciar compra</button><button class="btn sec" data-acao="compra-passada">Lançar compra já feita</button></div>`;
  const linhas = linhasDaCompra(c.id);
  const noCarrinho = new Set(linhas.map(l => l.item));
  const tipoLista = c.tipo === "grande" ? "grande" : "semanal";
  const faltam = listaCompras(tipoLista).filter(x => !(x.item && noCarrinho.has(x.item.id)));
  const q = norm(buscaCompra.q);
  const achados = q ? itensAtivos().filter(i => norm(i.nome).includes(q)).slice(0, 12) : [];
  const total = totalCompra(c);
  return `
  <header class="topo"><div><h1>${esc(nomeLoja(c.loja))}</h1><p class="sub">${NOME_TIPO[c.tipo] || ""} · ${c.data === hoje() ? "hoje" : dataCurta(c.data)} · ${linhas.length} no carrinho</p></div><span class="pill p-verde grande num" id="total-carrinho">${reais(total)}</span></header>
  <div class="busca com-botao"><input id="busca-compra" type="search" placeholder="Pegar outro item… (buscar)" value="${esc(buscaCompra.q)}" autocomplete="off" aria-label="Buscar item para o carrinho"><button class="btn sec" data-acao="ler-codigo" data-ctx="compra" aria-label="Ler código de barras" title="Ler código de barras">${ICONE_COD}</button></div>
  ${q ? `<div class="cartao lista">${achados.map(i => `<button class="li botao" data-acao="linha-nova" data-id="${i.id}"><span class="tx"><b>${esc(i.nome)}</b><span class="sub">${noCarrinho.has(i.id) ? "já no carrinho · " : ""}${ultimaTxt(i)}</span></span><span class="mais-ico">＋</span></button>`).join("")}
    <button class="li botao" data-acao="cadastrar-e-pegar" data-nome="${esc(buscaCompra.q)}"><span class="tx"><b>Cadastrar “${esc(buscaCompra.q)}”</b><span class="sub">item novo no catálogo</span></span><span class="mais-ico">＋</span></button></div>` : ""}
  <h3 class="secao">Falta pegar (${faltam.length})</h3>
  ${faltam.length ? `<div class="cartao lista">${faltam.map(x => x.item ? `<button class="li botao" data-acao="linha-nova" data-id="${x.item.id}"><span class="check"></span><span class="tx"><span class="linha1"><b>${esc(x.item.nome)}</b>${x.motivo === "acabou" ? `<span class="pill p-verm">acabou</span>` : ""}</span><span class="sub">${x.sug ? esc(sugestaoTexto(x.item, x.sug)) + " · " : ""}${ultimaTxt(x.item)}</span></span></button>` :
    `<div class="li"><span class="check"></span><span class="tx"><b>${esc(x.texto)}</b><span class="sub">anotado na lista</span></span><button class="mini" data-acao="peguei-texto" data-id="${x.manual.id}">Peguei</button></div>`).join("")}</div>` : `<p class="vazio">Tudo da lista já está no carrinho.</p>`}
  <h3 class="secao">No carrinho (${linhas.length})</h3>
  ${linhas.length ? `<div class="cartao lista">${linhas.slice().sort((a, b) => b.mod - a.mod).map(l => linhaHtml(l)).join("")}</div>` : `<p class="vazio">Toque num item para pôr no carrinho e anotar o preço.</p>`}
  <div class="botoes col">
    <button class="btn" data-acao="finalizar-compra" ${linhas.length ? "" : "disabled"}>Finalizar compra · ${reais(total)}</button>
    <button class="btn perigo sec" data-acao="cancelar-compra">Cancelar esta compra</button>
  </div>`;
}

function ultimaTxt(item) {
  const h = historicoItem(item.id)[0];
  if (!h) return "sem compra anterior";
  return `última: ${h.marca ? esc(h.marca) + " " : ""}${reais(h.preco)}${precoTxt(h) ? " (" + precoTxt(h) + ")" : ""} · ${esc(nomeLoja(h.loja))}, ${dataCurta(h.data)}${h.promo ? " · promoção" : ""}`;
}

function linhaHtml(l) {
  const it = porId(l.item);
  return `<button class="li botao" data-acao="linha-editar" data-id="${l.id}"><span class="check ok"></span><span class="tx"><span class="linha1"><b>${esc(it?.nome || "?")}</b><span class="num">${reais(l.preco)}</span></span>
    <span class="sub">${l.marca ? esc(l.marca) + " · " : ""}${esc(descEmb(l))}${precoTxt(l) ? " · " + precoTxt(l) : ""}${l.promo ? ` · <span class="promo">promoção</span>` : ""}</span></span></button>`;
}

// ---------- Janela do item (preço, embalagem, marca) ----------
export function abrirLinha({ itemId, linhaId, compraId }) {
  const linha = linhaId ? porId(linhaId) : null;
  const item = porId(itemId || linha?.item);
  if (!item) return;
  const compra = porId(compraId || linha?.compra) || compraAberta();
  if (!compra) return;
  const hist = historicoItem(item.id).filter(h => h.compra !== compra.id);
  const ult = hist[0];
  const ref = linha || ult || {};
  // quantidade sugerida pela lista
  let qtd = linha?.qtd;
  if (qtd == null) {
    const x = listaCompras(compra.tipo === "grande" ? "grande" : "semanal").find(y => y.item?.id === item.id);
    const por = Number(ref.porEmb || item.porEmb) || 1;
    qtd = x?.sug ? Math.max(1, Math.round(x.sug / por)) : 1;
  }
  const v = {
    qtd, porEmb: ref.porEmb ?? item.porEmb ?? 1, embNome: ref.embNome ?? item.embNome ?? "", unNome: item.unNome || "unidade",
    conteudo: ref.conteudo ?? item.conteudo ?? "", medida: ref.medida || item.medida || "un", marca: ref.marca || "",
    promo: linha ? !!linha.promo : false, validade: linha?.validade || "",
  };
  const cada = linha ? linha.preco / (Number(linha.qtd) || 1) : ult ? ult.preco / (Number(ult.qtd) || 1) : "";
  const marcas = [...new Set(historicoItem(item.id).map(h => h.marca).filter(Boolean))];
  const ano = Date.now() - 365 * 86400000;
  const melhor = hist.filter(h => h.ts >= ano && isFinite(precoInfo(h).porBase)).sort((a, b) => precoInfo(a).porBase - precoInfo(b).porBase)[0];
  const f2 = n => (n === "" || n == null || !isFinite(n)) ? "" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fb = n => (!isFinite(n)) ? "" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: n < 1 ? 4 : 2 });

  const el = abrirJanela(`
    <h3>${esc(item.nome)}</h3>
    <form class="form" id="fln">
      <div class="tres">
        <label class="campo"><span>Quantas</span><input id="ln-qtd" inputmode="decimal" value="${num(v.qtd, 3)}"></label>
        <label class="campo"><span>Embalagem</span><input id="ln-emb" value="${esc(v.embNome || v.unNome)}" placeholder="pacote"></label>
        <label class="campo"><span>${esc(unTxt(item, 2))} em cada</span><input id="ln-por" inputmode="numeric" value="${v.porEmb}"></label>
      </div>
      <div class="dois">
        <label class="campo"><span>Conteúdo de cada ${esc(v.unNome)}</span><input id="ln-cont" inputmode="decimal" value="${v.conteudo === "" || v.conteudo == null ? "" : num(v.conteudo, 3)}" placeholder="ex.: 30"></label>
        <label class="campo"><span>Medida</span><select id="ln-med">${Object.entries(MEDIDAS).map(([k, m]) => `<option value="${k}" ${k === v.medida ? "selected" : ""}>${m.rotulo}</option>`).join("")}</select></label>
      </div>
      <div class="tres">
        <label class="campo"><span>Preço de cada</span><input id="ln-cada" inputmode="decimal" value="${f2(cada)}" placeholder="0,00"></label>
        <label class="campo"><span>Total</span><input id="ln-total" inputmode="decimal" value="${linha ? f2(linha.preco) : ""}" placeholder="0,00"></label>
        <label class="campo"><span id="ln-base-rot">Preço/kg</span><input id="ln-base" inputmode="decimal" placeholder="—"></label>
      </div>
      <div class="calc" id="ln-calc"></div>
      <div class="comp" id="ln-comp"></div>
      <div class="dois">
        <label class="campo"><span>Marca</span><input id="ln-marca" list="ln-marcas" value="${esc(v.marca)}" autocomplete="off"></label>
        <label class="campo"><span>Validade (opcional)</span><input id="ln-val" type="date" value="${v.validade}"></label>
      </div>
      <datalist id="ln-marcas">${marcas.map(m => `<option value="${esc(m)}">`).join("")}</datalist>
      <label class="check-linha"><input type="checkbox" id="ln-promo" ${v.promo ? "checked" : ""}> Preço de promoção</label>
      <div class="botoes">${linha ? `<button type="button" class="btn perigo sec" id="ln-tirar">Tirar</button>` : ""}<button class="btn">${linha ? "Salvar" : "Pôr no carrinho"}</button></div>
    </form>`);

  const g = id => $(id, el);
  const atual = () => ({ qtd: lerNum(g("#ln-qtd").value), porEmb: Math.max(1, lerNum(g("#ln-por").value) || 1), conteudo: lerNum(g("#ln-cont").value), medida: g("#ln-med").value, preco: lerNum(g("#ln-total").value), unNome: v.unNome });
  function qBase() { const a = atual(); return precoInfo({ ...a, preco: 1 }).qBase; }
  function atualizar(origem) {
    const a = atual();
    const med = MEDIDAS[a.medida] || MEDIDAS.un;
    g("#ln-base-rot").textContent = "Preço/" + (med.base === "un" ? "un." : NOME_BASE[med.base]);
    const qb = qBase();
    if (origem === "cada") { const c = lerNum(g("#ln-cada").value); if (isFinite(c) && a.qtd) g("#ln-total").value = f2(c * a.qtd); }
    if (origem === "total" || origem === "qtd" || origem === "cada" || origem === "emb") {
      const t = lerNum(g("#ln-total").value);
      if (origem === "qtd") { const c = lerNum(g("#ln-cada").value); if (isFinite(c) && a.qtd) g("#ln-total").value = f2(c * a.qtd); }
      if (origem === "total" && isFinite(t) && a.qtd) g("#ln-cada").value = f2(t / a.qtd);
      const t2 = lerNum(g("#ln-total").value);
      if (document.activeElement !== g("#ln-base")) g("#ln-base").value = isFinite(t2) && qb ? fb(t2 / qb) : "";
    }
    if (origem === "base") {
      const b = lerNum(g("#ln-base").value);
      if (isFinite(b) && qb) { g("#ln-total").value = f2(b * qb); if (a.qtd) g("#ln-cada").value = f2((b * qb) / a.qtd); }
    }
    // resumo e comparação
    const p = precoInfo(atual());
    const partes = [];
    if (isFinite(p.porUn) && p.unidades > 1) partes.push(`${reaisFino(p.porUn)} por ${esc(v.unNome)}`);
    if (isFinite(p.porBase) && p.base !== "un") partes.push(`${reaisFino(p.porBase)} por ${NOME_BASE[p.base]}`);
    if (p.unidades) partes.unshift(`${num(p.unidades, 3)} ${esc(unTxt(item, p.unidades))}${p.qBase && p.base !== "un" ? ` = ${num(p.qBase, 3)} ${p.base === "lav" ? "lavagens" : p.base === "fl" ? "folhas" : p.base}` : ""}`);
    g("#ln-calc").innerHTML = partes.join(" · ");
    g("#ln-calc").hidden = !partes.length;
    g("#ln-comp").innerHTML = comparacao(p, ult, melhor);
  }
  for (const [id, o] of [["#ln-qtd", "qtd"], ["#ln-por", "emb"], ["#ln-cont", "emb"], ["#ln-med", "emb"], ["#ln-cada", "cada"], ["#ln-total", "total"], ["#ln-base", "base"]])
    g(id).addEventListener("input", () => atualizar(o));
  if (!linha && cada !== "") atualizar("cada"); else atualizar("total");

  g("#fln").addEventListener("submit", e => {
    e.preventDefault();
    const a = atual();
    if (!(a.qtd > 0)) return aviso("Informe a quantidade", "erro");
    if (!(a.preco >= 0)) return aviso("Informe o preço", "erro");
    const emb = g("#ln-emb").value.trim();
    const reg = linha || { t: "linha", compra: compra.id, item: item.id };
    Object.assign(reg, {
      qtd: a.qtd, porEmb: a.porEmb, embNome: emb === v.unNome ? "" : emb, unNome: v.unNome,
      conteudo: a.conteudo > 0 ? a.conteudo : null, medida: a.medida, preco: Math.round(a.preco * 100) / 100,
      marca: g("#ln-marca").value.trim(), promo: g("#ln-promo").checked, validade: g("#ln-val").value || "",
    });
    salvar(reg);
    gravarTotal(compra);
    fecharJanela();
    buscaCompra.q = "";
    aviso(linha ? "Salvo" : `${item.nome} no carrinho`);
  });
  g("#ln-tirar")?.addEventListener("click", () => { apagar(linha); gravarTotal(compra); fecharJanela(); aviso(`${item.nome} saiu do carrinho`); });
}

function comparacao(p, ult, melhor) {
  if (!ult) return `<span class="sub">Primeira compra deste item: o preço fica guardado para as próximas.</span>`;
  const out = [];
  const pu = precoInfo(ult);
  const usarBase = isFinite(p.porBase) && isFinite(pu.porBase) && p.base === pu.base;
  const atual = usarBase ? p.porBase : p.porUn, antes = usarBase ? pu.porBase : pu.porUn;
  const rot = usarBase ? NOME_BASE[p.base] : (ult.unNome || "un");
  let dif = "";
  if (isFinite(atual) && isFinite(antes) && antes > 0 && atual > 0) {
    const pct = (atual / antes - 1) * 100;
    dif = Math.abs(pct) < 0.5 ? ` · <b>mesmo preço</b>` : pct > 0 ? ` · <b class="caro">${num(pct, 0)}% mais caro</b>` : ` · <b class="barato">${num(-pct, 0)}% mais barato</b>`;
  }
  out.push(`Última: ${ult.marca ? esc(ult.marca) + ", " : ""}${reaisFino(antes)}/${esc(rot)} em ${dataCurta(ult.data)} (${esc(nomeLoja(ult.loja))}${ult.promo ? ", promoção" : ""})${dif}`);
  if (melhor && melhor.id !== ult.id) {
    const pm = precoInfo(melhor);
    out.push(`Melhor em 12 meses: ${reaisFino(pm.porBase)}/${NOME_BASE[pm.base]} · ${esc(nomeLoja(melhor.loja))}, ${dataCurta(melhor.data)}${melhor.promo ? " (promoção)" : ""}`);
  }
  return out.map(t => `<span class="sub">${t}</span>`).join("");
}

// ---------- Finalizar ----------
export function finalizarCompra() {
  const c = compraAberta();
  if (!c) return;
  const soma = linhasDaCompra(c.id).reduce((s, l) => s + (Number(l.preco) || 0), 0);
  const el = abrirJanela(`<h3>Finalizar compra</h3>
    <form class="form" id="ff">
      <p class="sub">${esc(nomeLoja(c.loja))} · ${linhasDaCompra(c.id).length} itens · soma dos itens: <b>${reais(soma)}</b></p>
      <label class="campo"><span>Total pago no caixa</span><input id="ff-total" inputmode="decimal" value="${num(soma, 2)}"></label>
      <label class="campo"><span>Forma de pagamento</span><select id="ff-pag">${PAGAMENTOS.map(p => `<option>${p}</option>`).join("")}</select></label>
      <label class="campo"><span>Observação</span><input id="ff-obs" placeholder="opcional"></label>
      <p class="dica">O estoque é atualizado na hora. A compra fica marcada como pendente para o Minhas Finanças.</p>
      <div class="botoes"><button class="btn">Finalizar</button></div>
    </form>`);
  $("#ff", el).addEventListener("submit", e => {
    e.preventDefault();
    const pago = lerNum($("#ff-total", el).value);
    c.ajuste = isFinite(pago) ? Math.round((pago - soma) * 100) / 100 : 0;
    c.pag = $("#ff-pag", el).value;
    c.obs = $("#ff-obs", el).value.trim();
    c.status = "fim";
    c.fimEm = c.data === hoje() ? Date.now() : tsDeIso(c.data) + 12 * 3600000;
    c.fin = "pendente";
    c.total = Math.round((soma + c.ajuste) * 100) / 100;
    c.nItens = linhasDaCompra(c.id).length;
    c.porCat = porCategoria(c);
    salvar(c);
    // tira da lista o que foi comprado
    const comprados = new Set(linhasDaCompra(c.id).map(l => l.item));
    const feitos = doTipo("lista").filter(x => !x.feito && x.item && comprados.has(x.item));
    for (const x of feitos) { x.feito = true; x.compra = c.id; }
    if (feitos.length) salvar(...feitos);
    // próxima compra grande
    if (c.tipo === "grande") { const k = cfg(); salvar({ ...k, proxGrande: somaDias(c.data, Number(k.grandeDias) || 75) }); }
    fecharJanela();
    aviso("Compra registrada. Estoque atualizado!");
    location.hash = "#/compra/" + c.id;
  });
}

export async function cancelarCompra() {
  const c = compraAberta();
  if (!c) return;
  const n = linhasDaCompra(c.id).length;
  if (!(await confirmar(n ? `Cancelar a compra e tirar os ${n} itens do carrinho?` : "Cancelar esta compra?", { sim: "Cancelar compra", perigo: true }))) return;
  apagar(c, ...linhasDaCompra(c.id));
  aviso("Compra cancelada");
  location.hash = "#/inicio";
}

// ---------- Histórico ----------
export function telaCompras() {
  const lista = compras().filter(c => c.status === "fim");
  const porMes = agrupar(lista, c => c.data.slice(0, 7));
  const nomeMes = m => { const [a, mm] = m.split("-"); return ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"][+mm - 1] + " de " + a; };
  const aberta = compraAberta();
  return `
  <header class="topo"><div><h1>Compras</h1><p class="sub">${lista.length} compras registradas</p></div><button class="btn mini-btn sec" data-acao="compra-passada">＋ Lançar</button></header>
  ${aberta ? `<a class="faixa" href="#/comprando">🛒 Compra em andamento em ${esc(nomeLoja(aberta.loja))} · continuar</a>` : `<div class="botoes col"><button class="btn" data-acao="iniciar-compra" data-tipo="semanal">Iniciar Modo Compra</button></div>`}
  ${lista.length ? [...porMes].map(([m, cs]) => `<h3 class="secao linha1"><span>${nomeMes(m)}</span><span class="num">${reais(cs.reduce((s, c) => s + totalCompra(c), 0))}</span></h3>
    <div class="cartao lista">${cs.map(c => `<a class="li botao" href="#/compra/${c.id}"><span class="tx"><span class="linha1"><b>${dataCurta(c.data)} · ${esc(nomeLoja(c.loja))}</b><span class="num">${reais(totalCompra(c))}</span></span>
      <span class="sub">${NOME_TIPO[c.tipo] || ""} · ${linhasDaCompra(c.id).length} itens${c.pag ? " · " + esc(c.pag) : ""}${c.por ? " · " + esc(c.por) : ""}${c.fin === "pendente" || c.fin === "revisar" ? ` · <span class="pend">${NOME_FIN[c.fin]}</span>` : ""}</span></span></a>`).join("")}</div>`).join("") : `<p class="vazio">Nenhuma compra registrada ainda.</p>`}`;
}

export function telaCompra(id) {
  const c = porId(id);
  if (!c || c.t !== "compra") return `<p class="vazio">Compra não encontrada. <a href="#/compras">Voltar</a></p>`;
  if (c.status === "aberta") { location.hash = "#/comprando"; return ""; }
  const ls = linhasDaCompra(id).slice().sort((a, b) => (porId(a.item)?.nome || "").localeCompare(porId(b.item)?.nome || "", "pt-BR"));
  const soma = ls.reduce((s, l) => s + (Number(l.preco) || 0), 0);
  return `
  <header class="topo"><div><a class="voltar" href="#/compras">← Compras</a><h1>${esc(nomeLoja(c.loja))}</h1><p class="sub">${diaSemana(c.data)}, ${dataCurta(c.data)} · ${NOME_TIPO[c.tipo] || ""}${c.por ? " · " + esc(c.por) : ""}</p></div><button class="btn mini-btn sec" data-acao="editar-compra" data-id="${id}">Editar</button></header>
  <div class="kpis">
    <div class="kpi"><span class="sub">Total pago</span><b>${reais(totalCompra(c))}</b><span class="sub">${c.pag ? esc(c.pag) : ""}${c.ajuste ? ` · ajuste ${reais(c.ajuste)}` : ""}</span></div>
    <div class="kpi"><span class="sub">Itens</span><b>${ls.length}</b><span class="sub ${c.fin === "pendente" || c.fin === "revisar" ? "pend" : ""}">${NOME_FIN[c.fin] || ""}</span></div>
  </div>
  <div class="cartao lista">${ls.map(l => linhaHtml(l).replace('data-acao="linha-editar"', `data-acao="linha-editar"`)).join("")}</div>
  <div class="linha1 kpi"><span class="sub">Soma dos itens</span><b class="num">${reais(soma)}</b></div>
  <div class="botoes col"><button class="btn sec" data-acao="add-linha-compra" data-id="${id}">＋ Acrescentar item esquecido</button>${c.fin === "lancado" || c.fin === "ignorado" ? `<button class="btn sec" data-acao="fin-de-novo" data-id="${id}">Mandar de novo para o Minhas Finanças</button>` : ""}<button class="btn perigo sec" data-acao="excluir-compra" data-id="${id}">Excluir compra</button></div>
  ${c.obs ? `<p class="sub">Obs.: ${esc(c.obs)}</p>` : ""}`;
}

export function editarCompra(id) {
  const c = porId(id);
  const soma = linhasDaCompra(id).reduce((s, l) => s + (Number(l.preco) || 0), 0);
  const el = abrirJanela(`<h3>Editar compra</h3><form class="form" id="fe">
    <label class="campo"><span>Loja</span><select id="fe-loja">${lojas().map(l => `<option value="${l.id}" ${l.id === c.loja ? "selected" : ""}>${esc(l.nome)}</option>`).join("")}</select></label>
    <div class="dois"><label class="campo"><span>Data</span><input id="fe-data" type="date" value="${c.data}" max="${hoje()}"></label>
    <label class="campo"><span>Tipo</span><select id="fe-tipo">${Object.entries(NOME_TIPO).map(([k, v]) => `<option value="${k}" ${k === c.tipo ? "selected" : ""}>${v}</option>`).join("")}</select></label></div>
    <div class="dois"><label class="campo"><span>Total pago</span><input id="fe-total" inputmode="decimal" value="${num(soma + (Number(c.ajuste) || 0), 2)}"></label>
    <label class="campo"><span>Pagamento</span><select id="fe-pag">${PAGAMENTOS.map(p => `<option ${p === c.pag ? "selected" : ""}>${p}</option>`).join("")}</select></label></div>
    <label class="campo"><span>Observação</span><input id="fe-obs" value="${esc(c.obs || "")}"></label>
    <div class="botoes"><button class="btn">Salvar</button></div></form>`);
  $("#fe", el).addEventListener("submit", e => {
    e.preventDefault();
    const pago = lerNum($("#fe-total", el).value);
    const novaData = $("#fe-data", el).value || c.data;
    if (novaData !== c.data) c.fimEm = tsDeIso(novaData) + 12 * 3600000;
    Object.assign(c, { loja: $("#fe-loja", el).value, data: novaData, tipo: $("#fe-tipo", el).value, pag: $("#fe-pag", el).value, obs: $("#fe-obs", el).value.trim(), ajuste: isFinite(pago) ? Math.round((pago - soma) * 100) / 100 : c.ajuste });
    salvar(c);
    gravarTotal(c);
    fecharJanela();
    aviso("Compra salva");
  });
}

export async function excluirCompra(id) {
  const c = porId(id);
  if (!(await confirmar(`Excluir a compra de ${dataCurta(c.data)} em ${nomeLoja(c.loja)}? O estoque desses itens também volta atrás.`, { sim: "Excluir", perigo: true }))) return;
  apagar(c, ...linhasDaCompra(id));
  aviso("Compra excluída");
  location.hash = "#/compras";
}

// Acrescentar item numa compra já finalizada
export function escolherItemPara(compraId) {
  const el = abrirJanela(`<h3>Acrescentar item</h3><div class="busca"><input id="ei-b" type="search" placeholder="Buscar item…" autocomplete="off"></div><div class="cartao lista" id="ei-l"></div>`);
  const desenhar = () => {
    const q = norm($("#ei-b", el).value);
    const its = itensAtivos().filter(i => !q || norm(i.nome).includes(q)).slice(0, 20);
    $("#ei-l", el).innerHTML = its.map(i => `<button class="li botao" data-i="${i.id}"><span class="tx"><b>${esc(i.nome)}</b></span><span class="mais-ico">＋</span></button>`).join("") || `<p class="vazio">Nada encontrado.</p>`;
  };
  $("#ei-b", el).addEventListener("input", desenhar);
  $("#ei-l", el).addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) abrirLinha({ itemId: b.dataset.i, compraId }); });
  desenhar();
}

export function cadastrarEPegar(nome) {
  formItem(null, { nomeInicial: nome, aoSalvar: it => setTimeout(() => abrirLinha({ itemId: it.id }), 50) });
}
