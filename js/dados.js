// Dados do app: registros, gravação no aparelho, envio para a nuvem e todos os cálculos
// (estoque, consumo médio, previsão, preço por unidade e lista de compras).
//
// Cada registro tem { id, t: tipo, ... }. Tipos: item, loja, compra, linha, mov, lista, cfg.
// O estoque NÃO é um número gravado: é calculado a partir das compras (linhas) e das anotações (mov).
// Assim, duas pessoas anotando ao mesmo tempo nunca sobrescrevem o estoque uma da outra.

import { hoje, somaDias, diasEntre, tsDeIso, isoDeTs, dataDe, agrupar, uid, pluralizar } from "./util.js";
import { MEDIDAS } from "./catalogo.js";

export const REG = new Map();     // id -> registro
let VER = 0;                      // muda a cada alteração (invalida os cálculos guardados)
const ouvintes = new Set();
export const estado = { usuario: "", sync: "local", ultimoServidor: 0 };

export function aoMudar(fn) { ouvintes.add(fn); }
function avisarMudanca() { VER++; for (const fn of ouvintes) fn(); }

// ---------- Cálculos guardados até a próxima alteração ----------
const MEMO = new Map();
export function memo(chave, fn) {
  const m = MEMO.get(chave);
  if (m && m.v === VER) return m.r;
  const r = fn();
  MEMO.set(chave, { v: VER, r });
  return r;
}

// ---------- Gravação no aparelho (IndexedDB, com localStorage de reserva) ----------
const BANCO = "minhas-compras", LOJA = "kv", CHAVE = "dados";
function abrirIDB() {
  return new Promise((res, rej) => {
    if (!("indexedDB" in self)) return rej(new Error("sem IndexedDB"));
    const r = indexedDB.open(BANCO, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function lerIDB() {
  try {
    const db = await abrirIDB();
    return await new Promise((res, rej) => { const q = db.transaction(LOJA).objectStore(LOJA).get(CHAVE); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
  } catch { return null; }
}
function lerLS() { try { return JSON.parse(localStorage.getItem("mc-" + CHAVE) || "null"); } catch { return null; } }
// usa a cópia mais recente entre o IndexedDB e a cópia rápida do localStorage
async function lerLocal() {
  const a = await lerIDB(), b = lerLS();
  if (a && b) return (b.em || 0) > (a.em || 0) ? b : a;
  return a || b;
}
function pacote() { return { regs: [...REG.values()], ultimoServidor: estado.ultimoServidor, pendentes: [...PENDENTES], em: Date.now() }; }
async function gravarLocalAgora() {
  const dados = pacote();
  try {
    const db = await abrirIDB();
    await new Promise((res, rej) => { const tx = db.transaction(LOJA, "readwrite"); tx.objectStore(LOJA).put(dados, CHAVE); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    try { localStorage.removeItem("mc-" + CHAVE); } catch {}
    return;
  } catch {}
  try { localStorage.setItem("mc-" + CHAVE, JSON.stringify(dados)); } catch {}
}
let tGravar, pendente = false;
function agendarGravacao() { pendente = true; clearTimeout(tGravar); tGravar = setTimeout(() => { pendente = false; gravarLocalAgora(); }, 40); }
// App fechado ou minimizado com gravação pendente: cópia imediata (síncrona) no localStorage
function gravarJa() {
  if (!pendente) return;
  clearTimeout(tGravar); pendente = false;
  try { localStorage.setItem("mc-" + CHAVE, JSON.stringify(pacote())); } catch {}
  gravarLocalAgora();
}
addEventListener("pagehide", gravarJa);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") gravarJa(); });

export async function carregarLocal() {
  const d = await lerLocal();
  if (d && Array.isArray(d.regs)) {
    for (const r of d.regs) REG.set(r.id, r);
    estado.ultimoServidor = d.ultimoServidor || 0;
    for (const id of d.pendentes || []) PENDENTES.add(id);
  }
  avisarMudanca();
}

// ---------- Ligação com a nuvem (definida em nuvem.js) ----------
// Registros gravados enquanto a nuvem não estava ligada (Firebase não carregou, ninguém logado)
// ficam em PENDENTES e são enviados assim que a nuvem liga.
let enviarNuvem = null;
const PENDENTES = new Set();
export function ligarNuvem(fnEnviar) {
  enviarNuvem = fnEnviar;
  if (!fnEnviar || !PENDENTES.size) return;
  for (const id of PENDENTES) { const r = REG.get(id); if (r) fnEnviar(r); }
  PENDENTES.clear();
  agendarGravacao();
}
export const qtdPendentes = () => PENDENTES.size;

// Chegou registro da nuvem (do outro aparelho ou confirmação do próprio)
export function receberDaNuvem(lista) {
  let mudou = false;
  for (const r of lista) {
    const atual = REG.get(r.id);
    if (atual && JSON.stringify(atual) === JSON.stringify(r)) continue;
    REG.set(r.id, r);
    mudou = true;
  }
  if (mudou) { agendarGravacao(); avisarMudanca(); }
  else agendarGravacao();
}

// ---------- Gravar e apagar (único caminho para alterar dados) ----------
export function salvar(...regs) {
  for (const r of regs) {
    if (!r.id) r.id = uid(r.t ? r.t.slice(0, 2) + "-" : "");
    r.mod = Date.now();
    r.por = estado.usuario || r.por || "";
    const limpo = JSON.parse(JSON.stringify(r)); // tira campos indefinidos (a nuvem não aceita)
    REG.set(limpo.id, limpo);
    if (enviarNuvem) enviarNuvem(limpo); else PENDENTES.add(limpo.id);
  }
  agendarGravacao();
  avisarMudanca();
  return regs[0];
}
// Apagar = marcar como apagado (assim a exclusão chega ao outro aparelho)
export function apagar(...regs) {
  for (const r of regs) r.del = true;
  salvar(...regs);
}
export const vivos = () => memo("vivos", () => [...REG.values()].filter(r => !r.del));
export const doTipo = t => memo("tipo:" + t, () => vivos().filter(r => r.t === t));
export const porId = id => { const r = REG.get(id); return r && !r.del ? r : null; };

// ---------- Configuração ----------
export const CFG_PADRAO = { id: "cfg", t: "cfg", semanalDia: 0, grandeDias: 75, proxGrande: "", orcamento: 0, margem: 2 };
export function cfg() { return { ...CFG_PADRAO, ...(porId("cfg") || {}) }; }

// ---------- Itens, lojas, compras ----------
export const itens = () => memo("itens", () => doTipo("item").slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
export const itensAtivos = () => memo("itensAtivos", () => itens().filter(i => i.ativo !== false));
export const lojas = () => memo("lojas", () => doTipo("loja").slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
export const nomeLoja = id => porId(id)?.nome || "—";
export const compras = () => memo("compras", () => doTipo("compra").slice().sort((a, b) => (b.data + (b.fimEm || 0)).localeCompare(a.data + (a.fimEm || 0))));
export const comprasFeitas = () => memo("comprasFeitas", () => compras().filter(c => c.status === "fim"));
export const compraAberta = () => memo("compraAberta", () => compras().find(c => c.status === "aberta") || null);
export const linhasDaCompra = id => memo("linhasPorCompra", () => agrupar(doTipo("linha"), l => l.compra)).get(id) || [];

export function totalCompra(c) {
  return linhasDaCompra(c.id).reduce((s, l) => s + (Number(l.preco) || 0), 0) + (Number(c.ajuste) || 0);
}

// Linhas de compras finalizadas, por item, já com data/loja da compra (mais recente primeiro)
export const historicoItem = id => memo("histItens", () => {
  const m = new Map();
  for (const l of doTipo("linha")) {
    const c = porId(l.compra);
    if (!c || c.status !== "fim") continue;
    const h = { ...l, data: c.data, loja: c.loja, ts: c.fimEm && isoDeTs(c.fimEm) === c.data ? c.fimEm : tsDeIso(c.data) };
    if (!m.has(l.item)) m.set(l.item, []);
    m.get(l.item).push(h);
  }
  for (const lista of m.values()) lista.sort((a, b) => b.ts - a.ts);
  return m;
}).get(id) || [];

export const movsItem = id => memo("movsItens", () => {
  const m = agrupar(doTipo("mov"), x => x.item);
  for (const lista of m.values()) lista.sort((a, b) => b.ts - a.ts);
  return m;
}).get(id) || [];

// ---------- Preço por unidade ----------
// unidades = qtd de embalagens × unidades por embalagem; base = unidades × conteúdo convertido (ml→L, g→kg)
export function precoInfo(l) {
  const qtd = Number(l.qtd) || 0, por = Number(l.porEmb) || 1, preco = Number(l.preco) || 0;
  const unidades = qtd * por;
  const med = MEDIDAS[l.medida] || MEDIDAS.un;
  const cont = Number(l.conteudo) || 0;
  const qBase = cont ? unidades * cont * med.fator : (med.base === "un" ? unidades : 0);
  return {
    unidades,
    porUn: unidades ? preco / unidades : NaN,
    base: med.base,
    qBase,
    porBase: qBase ? preco / qBase : NaN,
  };
}

// ---------- Estoque, consumo e previsão de cada item ----------
const DIA = 86400000;
export function situacao(item) {
  return memo("sit", () => new Map()).get(item.id) || calcularSituacao(item);
}
function calcularSituacao(item) {
  const cache = memo("sit", () => new Map());
  const evs = [];
  for (const h of historicoItem(item.id)) evs.push({ ts: h.ts, tipo: "compra", q: precoInfo(h).unidades || 1 });
  for (const m of movsItem(item.id)) evs.push(m);
  evs.sort((a, b) => a.ts - b.ts);

  let est = null, aberto = false, status = null, ultCompraTs = null, ultEventoTs = null;
  const consumos = [];   // {ts, q}
  const ciclos = [];     // dias entre uma compra e o estoque zerar
  let inicioTs = null;
  for (const e of evs) {
    const antes = est ?? 0;
    switch (e.tipo) {
      case "compra": est = antes + e.q; status = "tem"; ultCompraTs = e.ts; if (inicioTs == null) inicioTs = e.ts; break;
      case "usei": est = Math.max(0, antes - (Number(e.q) || 1)); consumos.push({ ts: e.ts, q: antes - est }); break;
      case "abri": aberto = true; if (est == null) est = 1; status = "tem"; break;
      case "acabou": est = Math.max(0, antes - 1); aberto = false; consumos.push({ ts: e.ts, q: antes - est }); break;
      case "zerou": est = 0; aberto = false; consumos.push({ ts: e.ts, q: antes }); break;
      case "contagem": {
        const v = Math.max(0, Number(e.q) || 0);
        if (est != null && v < est) consumos.push({ ts: e.ts, q: est - v });
        est = v; if (v === 0) aberto = false;
        if (inicioTs == null && v > 0) inicioTs = e.ts;
        status = v > 0 ? "tem" : "acabou";
        break;
      }
      case "status":
        status = e.q;
        if (e.q === "acabou") { consumos.push({ ts: e.ts, q: 1 }); }
        if (e.q === "tem" && inicioTs == null) inicioTs = e.ts;
        break;
    }
    // fim de um ciclo: o estoque (ou a situação) chegou a zero
    const zerou = item.modo === "status" ? (e.tipo === "status" && e.q === "acabou") : (antes > 0 && est === 0);
    if (zerou && ultCompraTs != null && e.ts > ultCompraTs) ciclos.push((e.ts - ultCompraTs) / DIA);
    ultEventoTs = e.ts;
  }

  // Consumo médio (unidades por dia) do último ano
  const desde = Date.now() - 365 * DIA;
  const c12 = consumos.filter(c => c.ts >= desde && c.q > 0);
  let taxa = null, fonteTaxa = "";
  const ini = Math.max(inicioTs ?? Infinity, desde);
  if (c12.length && isFinite(ini)) {
    const fim = c12[c12.length - 1].ts;
    const dias = (fim - ini) / DIA;
    const total = c12.reduce((s, c) => s + c.q, 0);
    if (dias >= 1) { taxa = total / dias; fonteTaxa = "histórico"; }
  }
  if (taxa == null && Number(item.diasPorUn) > 0) { taxa = 1 / Number(item.diasPorUn); fonteTaxa = "informado"; }
  const duracaoMedia = ciclos.length ? ciclos.slice(-4).reduce((s, x) => s + x, 0) / Math.min(4, ciclos.length) : null;

  let estimado = est, diasRest = null;
  if (item.modo === "status") {
    if (status === "acabou") diasRest = 0;
    else if (duracaoMedia && ultCompraTs) diasRest = Math.max(0, duracaoMedia - (Date.now() - ultCompraTs) / DIA);
  } else if (est != null) {
    if (taxa && est > 0) {
      const ref = Math.max(ultEventoTs || 0, ...consumos.slice(-1).map(c => c.ts));
      const passados = Math.max(0, (Date.now() - ref) / DIA);
      estimado = Math.max(0, est - taxa * passados);
      // nunca estima abaixo do que já se sabe estar aberto
      if (aberto && estimado < 0.2) estimado = 0.2;
      diasRest = estimado / taxa;
    } else if (est === 0) diasRest = 0;
  }

  let sit;
  if (item.modo === "status") sit = status || "desconhecido";
  else if (est == null) sit = "desconhecido";
  else if (est <= 0) sit = "acabou";
  else sit = "tem";
  const r = { est, estimado, aberto, status: sit, taxa, fonteTaxa, diasRest, duracaoMedia, ciclos, ultCompraTs, ultEventoTs };
  cache.set(item.id, r);
  return r;
}

// ---------- Datas das próximas compras ----------
export function proxSemanal(base = hoje()) {
  const c = cfg();
  const d = dataDe(base).getDay();
  const falta = (Number(c.semanalDia) - d + 7) % 7;
  return somaDias(base, falta);
}
export function proxGrande(base = hoje()) {
  const c = cfg();
  if (c.proxGrande && c.proxGrande >= base) return c.proxGrande;
  if (c.proxGrande) return base; // atrasada: é para já
  return somaDias(base, Number(c.grandeDias) || 75);
}

// ---------- Lista de compras ----------
// tipo: "semanal" ou "grande". Retorna itens com motivo, urgência e quantidade sugerida.
export function listaCompras(tipo) {
  return memo("lista:" + tipo + hoje(), () => {
    const c = cfg();
    const hj = hoje();
    const dSem = diasEntre(hj, proxSemanal());
    const dGr = diasEntre(hj, proxGrande());
    const alvo = tipo === "grande" ? dGr : dSem;
    const cobertura = tipo === "grande" ? Number(c.grandeDias) || 75 : 7;
    const margem = Number(c.margem) || 0;
    const out = [];
    const manuais = doTipo("lista").filter(x => !x.feito);
    const manualPorItem = new Map(manuais.filter(x => x.item).map(x => [x.item, x]));

    for (const it of itensAtivos()) {
      const s = situacao(it);
      const manual = manualPorItem.get(it.id);
      let motivo = null, urg = 9;
      if (s.status === "acabou") { motivo = "acabou"; urg = 0; }
      else if (s.status === "acabando") { motivo = "acabando"; urg = 1; }
      else if (it.minimo > 0 && s.est != null && s.estimado <= it.minimo) { motivo = "mínimo"; urg = 1; }
      else if (s.diasRest != null) {
        if (tipo === "semanal") {
          const naoChega = it.freq === "semanal" ? s.diasRest < dSem + 7 + margem : (s.diasRest < dSem + 7 + margem && s.diasRest < dGr);
          if (naoChega) { motivo = "previsão"; urg = 2; }
        } else if (it.freq === "grande" && s.diasRest < dGr + cobertura) { motivo = "previsão"; urg = 3; }
      }
      // na compra grande entram só os itens de compra grande (e o que acabou deles)
      if (motivo && tipo === "grande" && it.freq !== "grande") motivo = null;
      if (!motivo && manual) { motivo = "anotado"; urg = 1; }
      if (!motivo) continue;
      // quantidade sugerida (em unidades do item)
      let sug = null;
      if (it.modo !== "status" && s.taxa) {
        const precisa = s.taxa * (alvo + cobertura) + (Number(it.minimo) || 0) - (s.estimado || 0);
        sug = Math.max(1, Math.ceil(precisa - 0.15));
      }
      if (manual?.qtd) sug = manual.qtd;
      out.push({ item: it, sit: s, motivo, urg, sug, manual });
    }
    // anotações livres (sem item do catálogo)
    for (const m of manuais.filter(x => !x.item)) out.push({ item: null, texto: m.texto, manual: m, motivo: "anotado", urg: 1, sug: m.qtd || null });
    out.sort((a, b) => a.urg - b.urg || (a.sit?.diasRest ?? 99) - (b.sit?.diasRest ?? 99) || (a.item?.nome || a.texto).localeCompare(b.item?.nome || b.texto, "pt-BR"));
    return out;
  });
}

// Converte unidades sugeridas em embalagens da última compra (ex.: 48 rolos = 2 pacotes de 24)
export function sugestaoTexto(item, sug) {
  if (!sug) return "";
  const ult = historicoItem(item.id)[0];
  const por = Number(ult?.porEmb || item.porEmb) || 1;
  const emb = ult?.embNome || item.embNome;
  const un = item.unNome || "unidade";
  if (por > 1 && emb) {
    const n = Math.max(1, Math.round(sug / por));
    return `${n} ${pluralizar(emb, n)} (${n * por} ${pluralizar(un, n * por)})`;
  }
  return `${sug} ${pluralizar(un, sug)}`;
}

// ---------- Resumos do mês ----------
export function resumoMes(iso = hoje()) {
  const mes = iso.slice(0, 7);
  const doMes = comprasFeitas().filter(c => c.data.slice(0, 7) === mes);
  const gasto = doMes.reduce((s, c) => s + totalCompra(c), 0);
  const idas = new Set(doMes.map(c => c.data + "|" + c.loja)).size;
  return { gasto, idas, compras: doMes };
}

// Validades próximas (linhas com validade, item ainda com estoque)
export function vencendo(dias = 5) {
  const lim = somaDias(hoje(), dias);
  const out = [];
  for (const it of itensAtivos()) {
    const h = historicoItem(it.id)[0];
    if (!h?.validade || h.validade > lim) continue;
    const s = situacao(it);
    if (s.status === "acabou") continue;
    out.push({ item: it, validade: h.validade });
  }
  return out.sort((a, b) => a.validade.localeCompare(b.validade));
}

// Primeiro acesso: grava catálogo, lojas e configuração
export function precisaSemear() { return !porId("cfg"); }
