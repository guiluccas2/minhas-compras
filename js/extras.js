// Telas e recursos da fase 3: comparação de preços entre lojas, relatório do mês e leitura de código de barras.

import { esc, num, reais, reaisFino, hoje, dataCurta, norm, aviso, abrirJanela, fecharJanela, $, lerNum } from "./util.js";
import { comparativoLojas, precosPorLoja, relatorioMes, nomeLoja, itensAtivos, itemPorCodigo, salvar, porId } from "./dados.js";
import { NOME_BASE } from "./catalogo.js";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const nomeMes = m => { const [a, mm] = m.split("-"); const t = `${MESES[+mm - 1]} de ${a}`; return t[0].toUpperCase() + t.slice(1); };
const somaMes = (m, k) => { const [a, mm] = m.split("-").map(Number); const d = new Date(a, mm - 1 + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const pctTxt = p => `${p > 0 ? "+" : ""}${num(p * 100, 0)}%`;
const porTxt = base => base === "un" ? "un." : NOME_BASE[base] || base;

// ================= B. COMPARAR PREÇOS ENTRE LOJAS =================
const fPreco = { q: "" };
export function telaPrecos() {
  const r = comparativoLojas(90);
  const q = norm(fPreco.q);
  const lista = r.itens.filter(x => !q || norm(x.item.nome).includes(q));
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Comparar preços</h1><p class="sub">Preço por litro, quilo, metro ou unidade na compra mais recente de cada loja (últimos 12 meses).</p></div></header>
  ${r.itens.length ? `
  <div class="kpis">
    <div class="kpi"><span class="sub">Economia possível (90 dias)</span><b>${reais(r.economia)}</b><span class="sub">comprando cada item na loja mais barata</span></div>
    <div class="kpi"><span class="sub">Mais vezes a mais barata</span><b>${esc(nomeLoja(r.ranking[0]?.loja))}</b><span class="sub">${r.ranking.map(x => `${esc(nomeLoja(x.loja))} ${x.n}`).join(" · ")}</span></div>
  </div>
  <div class="busca"><input id="busca-precos" type="search" placeholder="Buscar item…" value="${esc(fPreco.q)}" aria-label="Buscar item"></div>
  <div class="cartao lista">${lista.map(x => `<a class="li botao" href="#/item/${x.item.id}"><span class="tx">
    <span class="linha1"><b>${esc(x.item.nome)}</b><span class="pill ${x.dif >= 0.15 ? "p-amar" : "p-cinza"}">até ${num(x.dif * 100, 0)}% de diferença</span></span>
    <span class="sub">${x.precos.map((p, i) => `${i === 0 ? "<b class=\"barato\">" : ""}${esc(nomeLoja(p.loja))} ${reaisFino(p.valor)}/${porTxt(p.base)}${p.linha.promo ? " (promo)" : ""}${i === 0 ? "</b>" : ""}`).join(" · ")}</span></span></a>`).join("") || `<p class="vazio">Nada encontrado.</p>`}</div>`
  : `<p class="vazio">A comparação aparece quando o mesmo item tiver sido comprado em pelo menos duas lojas diferentes.</p>`}`;
}
export function buscaPrecos(v) { fPreco.q = v; }

// Bloco da ficha do item: preço em cada loja
export function precosItemHtml(itemId) {
  const ps = precosPorLoja(itemId);
  if (ps.length < 2) return "";
  return `<h3 class="secao">Preço por loja</h3><div class="cartao lista">${ps.map((p, i) => `<div class="li"><span class="tx"><span class="linha1"><b>${esc(nomeLoja(p.loja))}</b><span class="num ${i === 0 ? "barato" : ""}">${reaisFino(p.valor)}/${porTxt(p.base)}</span></span>
    <span class="sub">${dataCurta(p.linha.data)}${p.linha.marca ? " · " + esc(p.linha.marca) : ""}${p.linha.promo ? " · promoção" : ""}${i > 0 ? ` · ${pctTxt(p.valor / ps[0].valor - 1)}` : " · mais barata"}</span></span></div>`).join("")}</div>`;
}

// ================= E. RELATÓRIO DO MÊS =================
export function telaRelatorio(params) {
  const mes = params.get("m") || hoje().slice(0, 7);
  const r = relatorioMes(mes), ant = relatorioMes(somaMes(mes, -1));
  const barras = (lista, nomeFn) => {
    const max = Math.max(...lista.map(x => x.v), 1);
    return lista.map(x => `<div class="barra-lin"><span class="bl-nome">${nomeFn(x)}</span><span class="bl-trilho"><b style="width:${Math.max(2, (x.v / max) * 100)}%"></b></span><span class="bl-v num">${reais(x.v)}</span></div>`).join("");
  };
  const dif = ant.total ? r.total / ant.total - 1 : null;
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Relatório do mês</h1></div></header>
  <div class="mesnav"><a class="mini" href="#/relatorio?m=${somaMes(mes, -1)}" aria-label="Mês anterior">‹</a><b>${nomeMes(mes)}</b>${mes < hoje().slice(0, 7) ? `<a class="mini" href="#/relatorio?m=${somaMes(mes, 1)}" aria-label="Próximo mês">›</a>` : `<span class="mini" style="visibility:hidden">›</span>`}</div>
  ${r.compras.length ? `
  <div class="kpis">
    <div class="kpi"><span class="sub">Gasto nas compras</span><b>${reais(r.total)}</b><span class="sub">${dif == null ? "sem dados do mês anterior" : `${dif > 0 ? "▲" : "▼"} ${num(Math.abs(dif) * 100, 0)}% vs. ${MESES[+somaMes(mes, -1).slice(5) - 1]}`}</span></div>
    <div class="kpi"><span class="sub">Idas às compras</span><b>${r.idas}</b><span class="sub">média de ${reais(r.media)} por ida${ant.idas ? ` · mês anterior: ${ant.idas}` : ""}</span></div>
  </div>
  <div class="cartao"><b>Por categoria</b>${barras(r.porCat, x => esc(x.k))}</div>
  <div class="cartao"><b>Por loja</b>${barras(r.porLoja, x => esc(nomeLoja(x.k)))}</div>
  <div class="cartao"><b>Onde mais se gastou</b>${barras(r.topItens.map(x => ({ v: x.v, it: x.item })), x => `<a href="#/item/${x.it.id}">${esc(x.it.nome)}</a>`)}</div>
  <div class="cartao lista"><div class="li"><b>Preços que mais subiram</b></div>${r.altas.length ? r.altas.map(v => `<a class="li botao" href="#/item/${v.item.id}"><span class="tx"><span class="linha1"><b>${esc(v.item.nome)}</b><span class="num caro">${pctTxt(v.pct)}</span></span><span class="sub">${reaisFino(v.antes)} → ${reaisFino(v.agora)} por ${porTxt(v.base)}${v.promo ? " (promoção)" : ""}</span></span></a>`).join("") : `<div class="li sub">Nenhum item ficou mais caro em relação à compra anterior.</div>`}
    ${r.baixas.length ? `<div class="li"><b>Ficaram mais baratos</b></div>${r.baixas.map(v => `<a class="li botao" href="#/item/${v.item.id}"><span class="tx"><span class="linha1"><b>${esc(v.item.nome)}</b><span class="num barato">${pctTxt(v.pct)}</span></span><span class="sub">${reaisFino(v.antes)} → ${reaisFino(v.agora)} por ${porTxt(v.base)}${v.promo ? " (promoção)" : ""}</span></span></a>`).join("")}` : ""}</div>` : `<p class="vazio">Nenhuma compra registrada em ${nomeMes(mes)}.</p>`}
  <div class="cartao lista"><div class="li"><span class="tx"><span class="linha1"><b>Desperdício</b><span class="num ${r.perdaTotal ? "caro" : ""}">${reais(r.perdaTotal)}</span></span><span class="sub">o que foi anotado como “venceu / estragou”</span></span></div>
    ${r.perdas.map(p => `<div class="li"><span class="tx"><span class="linha1"><span>${esc(p.item.nome)} · ${num(p.q, 2)}</span><span class="num">${p.valor ? reais(p.valor) : "sem preço"}</span></span><span class="sub">${dataCurta(p.data)}${p.valor ? "" : " · item ainda sem compra registrada"}</span></span></div>`).join("")}</div>`;
}

// ================= D. CÓDIGO DE BARRAS =================
const LIB = "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.8/html5-qrcode.min.js";
let carregando = null;
function carregarLeitor() {
  if (window.Html5Qrcode) return Promise.resolve();
  if (!carregando) carregando = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = LIB; s.onload = res; s.onerror = () => { carregando = null; rej(new Error("Não foi possível carregar o leitor (sem internet?).")); };
    document.head.appendChild(s);
  });
  return carregando;
}

// Abre a câmera; ao ler (ou digitar) um código chama aoLer(codigo)
export function lerCodigo(aoLer) {
  let leitor = null, feito = false;
  const parar = () => { try { leitor?.stop().catch(() => {}); } catch {} leitor = null; };
  const entregar = cod => { if (feito) return; feito = true; parar(); fecharJanela(); aoLer(String(cod).trim()); };
  const el = abrirJanela(`<h3>Ler código de barras</h3>
    <div id="leitor" class="leitor"><p class="sub centro" id="leitor-msg">Abrindo a câmera…</p></div>
    <form class="campo-inline" id="fcod"><label for="cod-dig">Ou digite</label><input id="cod-dig" inputmode="numeric" placeholder="7891234567890" autocomplete="off"><button class="btn sec">OK</button></form>`, { aoFechar: parar });
  $("#fcod", el).addEventListener("submit", e => { e.preventDefault(); const v = $("#cod-dig", el).value.replace(/\D/g, ""); if (v) entregar(v); });
  if (window.__codigoTeste) return setTimeout(() => entregar(window.__codigoTeste), 50); // testes automáticos
  carregarLeitor().then(() => {
    if (feito || !document.getElementById("leitor")) return;
    $("#leitor-msg", el)?.remove();
    leitor = new window.Html5Qrcode("leitor", { verbose: false });
    return leitor.start({ facingMode: "environment" }, { fps: 10, qrbox: (w, h) => ({ width: Math.min(280, w * 0.85), height: Math.min(140, h * 0.5) }) }, txt => entregar(txt), () => {});
  }).catch(e => {
    const m = $("#leitor-msg", el) || $("#leitor", el);
    if (m) m.innerHTML = `<span class="erro-box">${esc(/Permission|NotAllowed/i.test(String(e)) ? "A câmera não foi liberada. Libere o acesso à câmera nas configurações do navegador, ou digite o código." : e?.message || String(e))}</span>`;
  });
}

// Código lido: item conhecido → acao(item); desconhecido → pergunta qual item é e guarda o código nele
export function tratarCodigo(cod, acao) {
  const it = itemPorCodigo(cod);
  if (it) return acao(it);
  const el = abrirJanela(`<h3>Código novo</h3><p class="sub">O código <b>${esc(cod)}</b> ainda não está em nenhum item. Qual item é? Ele fica guardado para as próximas vezes.</p>
    <div class="busca"><input id="vc-b" type="search" placeholder="Buscar item…" autocomplete="off"></div><div class="cartao lista" id="vc-l"></div>`);
  const desenhar = () => {
    const q = norm($("#vc-b", el).value);
    $("#vc-l", el).innerHTML = itensAtivos().filter(i => !q || norm(i.nome).includes(q)).slice(0, 25).map(i => `<button class="li botao" data-i="${i.id}"><span class="tx"><b>${esc(i.nome)}</b>${i.codigos?.length ? `<span class="sub">${i.codigos.length} código(s) já guardado(s)</span>` : ""}</span><span class="mais-ico">＋</span></button>`).join("") || `<p class="vazio">Nada encontrado.</p>`;
  };
  $("#vc-b", el).addEventListener("input", desenhar);
  $("#vc-l", el).addEventListener("click", e => {
    const b = e.target.closest("[data-i]");
    if (!b) return;
    const it2 = porId(b.dataset.i);
    it2.codigos = [...new Set([...(it2.codigos || []), cod])];
    salvar(it2);
    fecharJanela();
    aviso(`Código guardado em ${it2.nome}`);
    setTimeout(() => acao(it2), 30);
  });
  desenhar();
}

export function codigosItemHtml(it) {
  if (!it.codigos?.length) return "";
  return `<p class="sub">Códigos de barras: ${it.codigos.map(c => `<span class="codigo">${esc(c)} <button class="link" data-acao="tirar-codigo" data-id="${it.id}" data-v="${esc(c)}" aria-label="Tirar código ${esc(c)}">✕</button></span>`).join(" ")}</p>`;
}
