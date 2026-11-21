// Menu "Mais": Catálogo, Inventário, Lojas, Planejamento (configurações), Cópia de segurança e Conta.

import { esc, num, hoje, norm, aviso, abrirJanela, fecharJanela, confirmar, lerNum, $, $$, dataCurta, NOMES_SEMANA, agrupar, reais } from "./util.js";
import { cfg, itens, itensAtivos, lojas, salvar, situacao, REG, vivos, porId, linhasDaCompra, comprasFeitas, nomeLoja, totalCompra, estado } from "./dados.js";
import { formItem, unTxt, qtdTxt, anotar } from "./ui.js";
import { CATEGORIAS, LOCAIS, TIPOS_LOJA } from "./catalogo.js";
import { nuvem, sair } from "./nuvem.js";

export const VERSAO = "1.1.0";
const filtroCat = { q: "" };

export function telaMais() {
  const n = itensAtivos().length;
  return `<header class="topo"><h1>Mais</h1></header>
  <nav class="menu-mais">
    <a href="#/catalogo"><b>Catálogo de itens</b><span class="sub">${n} em uso de ${itens().length} · editar, esconder, cadastrar</span></a>
    <a href="#/inventario"><b>Inventário</b><span class="sub">contar o que tem em casa, cômodo por cômodo</span></a>
    <a href="#/compras"><b>Histórico de compras</b><span class="sub">todas as compras, por mês</span></a>
    <a href="#/lojas"><b>Lojas</b><span class="sub">${lojas().filter(l => l.ativo !== false).length} lojas cadastradas</span></a>
    <a href="#/config"><b>Planejamento e orçamento</b><span class="sub">dia da compra semanal, compra grande, orçamento</span></a>
    <a href="#/backup"><b>Cópia de segurança</b><span class="sub">baixar os dados ou a planilha das compras</span></a>
  </nav>
  <div class="cartao">
    ${nuvem.modo === "firebase" && nuvem.usuario ? `<div class="linha1"><span><b>${esc(nuvem.usuario.nome)}</b><br><span class="sub">${esc(nuvem.usuario.email)}</span></span><button class="btn sec mini-btn" data-acao="sair">Sair</button></div>
    <span class="sub">Sincronização: ${({ ok: "em dia", enviando: "enviando…", offline: "sem internet (envia quando voltar)" })[estado.sync] || estado.sync}</span>`
    : `<b>Modo local</b><span class="sub">Os dados ficam só neste aparelho.${nuvem.erro ? " " + esc(nuvem.erro) : ""}</span>`}
  </div>
  <p class="sub centro">Minhas Compras · versão ${VERSAO}</p>`;
}

// ---------- Catálogo ----------
export function telaCatalogo() {
  const q = norm(filtroCat.q);
  const lista = itens().filter(i => !q || norm(i.nome).includes(q));
  const porCat = agrupar(lista, i => i.cat);
  const ordem = CATEGORIAS.map(c => c.nome).filter(c => porCat.has(c)).concat([...porCat.keys()].filter(k => !CATEGORIAS.some(c => c.nome === k)));
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Catálogo</h1><p class="sub">Desmarque o que vocês não usam. Toque no nome para editar.</p></div><button class="btn mini-btn" data-acao="novo-item">＋ Item</button></header>
  <div class="busca"><input id="busca-cat" type="search" placeholder="Buscar no catálogo…" value="${esc(filtroCat.q)}" aria-label="Buscar no catálogo"></div>
  ${ordem.map(cat => `<h3 class="secao">${esc(cat)}</h3><div class="cartao lista">${porCat.get(cat).map(i => `<div class="li ${i.ativo === false ? "apagado" : ""}">
    <input type="checkbox" class="chk" data-acao="ativo-item" data-id="${i.id}" ${i.ativo !== false ? "checked" : ""} aria-label="Usamos ${esc(i.nome)}">
    <button class="tx botao-texto" data-acao="editar-item" data-id="${i.id}"><b>${esc(i.nome)}</b><span class="sub">${esc(i.local)} · ${i.freq === "semanal" ? "semanal" : "compra grande"} · ${i.modo === "un" ? "por unidade" : i.modo === "emb" ? "por embalagem" : "só situação"} · ${esc(i.unNome)}${i.conteudo ? " " + num(i.conteudo, 3) + " " + i.medida : ""}</span></button></div>`).join("")}</div>`).join("") || `<p class="vazio">Nada encontrado.</p>`}`;
}
export function ligarBuscaCatalogo(v) { filtroCat.q = v; }

// ---------- Inventário ----------
const inv = { local: "" };
export function telaInventario() {
  const locs = LOCAIS.filter(l => itensAtivos().some(i => i.local === l));
  if (!inv.local || !locs.includes(inv.local)) inv.local = locs[0] || "";
  const its = itensAtivos().filter(i => i.local === inv.local);
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Inventário</h1><p class="sub">Anote quanto tem de cada item. Deixe em branco o que não quiser mudar.</p></div></header>
  <div class="chips rolar">${locs.map(l => `<button class="chip ${l === inv.local ? "on" : ""}" data-inv-local="${esc(l)}">${esc(l)}</button>`).join("")}</div>
  <form id="finv" class="cartao lista">
    ${its.map(i => {
      const s = situacao(i);
      if (i.modo === "status") return `<div class="li inv"><div class="tx"><b>${esc(i.nome)}</b><span class="sub">agora: ${esc(qtdTxt(i, s))}</span></div>
        <select data-inv="${i.id}" aria-label="Situação de ${esc(i.nome)}"><option value="">—</option>${["tem", "acabando", "acabou"].map(v => `<option value="${v}">${v}</option>`).join("")}</select>
        <button type="button" class="mini" data-acao="nao-usamos" data-id="${i.id}" title="Não usamos">✕</button></div>`;
      return `<div class="li inv"><div class="tx"><b>${esc(i.nome)}</b><span class="sub">agora: ${esc(qtdTxt(i, s))}</span></div>
        <input data-inv="${i.id}" inputmode="decimal" placeholder="${esc(unTxt(i, 2))}" aria-label="Quantidade de ${esc(i.nome)}">
        <button type="button" class="mini" data-acao="nao-usamos" data-id="${i.id}" title="Não usamos">✕</button></div>`;
    }).join("")}
  </form>
  <p class="dica">✕ = não usamos este item (ele some das listas; dá para voltar no Catálogo).</p>
  <div class="botoes col"><button class="btn" data-acao="salvar-inventario">Salvar ${esc(inv.local)}</button></div>`;
}
export function trocarLocalInventario(l) { inv.local = l; }
export function salvarInventario() {
  let n = 0;
  for (const el of $$("[data-inv]")) {
    const v = el.value.trim();
    if (!v) continue;
    const it = porId(el.dataset.inv);
    if (!it) continue;
    if (it.modo === "status") salvar({ t: "mov", item: it.id, tipo: "status", q: v, ts: Date.now(), data: hoje() });
    else { const q = lerNum(v); if (!(q >= 0)) continue; salvar({ t: "mov", item: it.id, tipo: "contagem", q, ts: Date.now(), data: hoje() }); }
    n++;
  }
  aviso(n ? `${n} ${n === 1 ? "item anotado" : "itens anotados"} em ${inv.local}` : "Nada para salvar: preencha as quantidades");
  if (n) {
    const locs = LOCAIS.filter(l => itensAtivos().some(i => i.local === l));
    const prox = locs[locs.indexOf(inv.local) + 1];
    if (prox) inv.local = prox;
  }
}

// ---------- Lojas ----------
export function telaLojas() {
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Lojas</h1></div><button class="btn mini-btn" data-acao="nova-loja">＋ Loja</button></header>
  <div class="cartao lista">${lojas().map(l => {
    const cs = comprasFeitas().filter(c => c.loja === l.id);
    return `<button class="li botao ${l.ativo === false ? "apagado" : ""}" data-acao="editar-loja" data-id="${l.id}"><span class="tx"><b>${esc(l.nome)}</b><span class="sub">${esc(l.cidade || "")}${l.tipo ? " · " + esc(l.tipo) : ""}${l.obs ? " · " + esc(l.obs) : ""} · ${cs.length} compra${cs.length === 1 ? "" : "s"}${cs.length ? " · última " + dataCurta(cs[0].data) : ""}</span></span></button>`;
  }).join("")}</div>`;
}
export function formLoja(id) {
  const l = id ? porId(id) : { t: "loja", nome: "", cidade: "Agudos", tipo: "mercado", ativo: true, obs: "" };
  const el = abrirJanela(`<h3>${id ? "Editar loja" : "Nova loja"}</h3><form class="form" id="flj">
    <label class="campo"><span>Nome</span><input id="lj-nome" required value="${esc(l.nome)}"></label>
    <div class="dois"><label class="campo"><span>Cidade</span><input id="lj-cid" value="${esc(l.cidade || "")}"></label>
    <label class="campo"><span>Tipo</span><select id="lj-tipo">${TIPOS_LOJA.map(t => `<option ${t === l.tipo ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
    <label class="campo"><span>Observação</span><input id="lj-obs" value="${esc(l.obs || "")}"></label>
    <label class="check-linha"><input type="checkbox" id="lj-ativo" ${l.ativo !== false ? "checked" : ""}> Aparece na escolha da loja</label>
    <div class="botoes"><button class="btn">Salvar</button></div></form>`);
  $("#flj", el).addEventListener("submit", e => {
    e.preventDefault();
    Object.assign(l, { nome: $("#lj-nome", el).value.trim(), cidade: $("#lj-cid", el).value.trim(), tipo: $("#lj-tipo", el).value, obs: $("#lj-obs", el).value.trim(), ativo: $("#lj-ativo", el).checked });
    if (!l.nome) return;
    salvar(l); fecharJanela(); aviso("Loja salva");
  });
}

// ---------- Planejamento ----------
export function telaConfig() {
  const c = cfg();
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Planejamento</h1></div></header>
  <form id="fcfg" class="form cartao">
    <label class="campo"><span>Dia da compra semanal (perecíveis)</span><select id="cf-dia">${NOMES_SEMANA.map((d, i) => `<option value="${i}" ${i === Number(c.semanalDia) ? "selected" : ""}>${d}</option>`).join("")}</select></label>
    <div class="dois">
      <label class="campo"><span>Compra grande a cada (dias)</span><input id="cf-gd" inputmode="numeric" value="${c.grandeDias}"></label>
      <label class="campo"><span>Próxima compra grande</span><input id="cf-pg" type="date" value="${c.proxGrande || ""}"></label>
    </div>
    <label class="campo"><span>Orçamento mensal (R$)</span><input id="cf-orc" inputmode="decimal" value="${c.orcamento ? num(c.orcamento, 2) : ""}" placeholder="opcional"></label>
    <label class="campo"><span>Folga na previsão (dias)</span><input id="cf-mg" inputmode="numeric" value="${c.margem}"></label>
    <p class="dica">A lista semanal inclui o que acaba antes da compra seguinte (mais a folga). A lista da compra grande inclui o que não dura até a compra grande depois desta. Ao finalizar uma compra grande, a próxima é marcada sozinha.</p>
    <div class="botoes"><button class="btn">Salvar</button></div>
  </form>`;
}
export function salvarConfig() {
  const c = cfg();
  salvar({ ...c, semanalDia: Number($("#cf-dia").value), grandeDias: Math.max(7, Math.round(lerNum($("#cf-gd").value) || 75)), proxGrande: $("#cf-pg").value || "", orcamento: lerNum($("#cf-orc").value) || 0, margem: Math.max(0, Math.round(lerNum($("#cf-mg").value) || 0)) });
  aviso("Planejamento salvo");
}

// ---------- Cópia de segurança ----------
export function telaBackup() {
  return `<header class="topo"><div><a class="voltar" href="#/mais">← Mais</a><h1>Cópia de segurança</h1></div></header>
  <div class="cartao"><b>Os dados já ficam guardados na nuvem</b><span class="sub">e também neste aparelho. Mesmo assim, de vez em quando vale baixar uma cópia.</span></div>
  <div class="botoes col">
    <button class="btn" data-acao="baixar-json">Baixar cópia completa (.json)</button>
    <button class="btn sec" data-acao="baixar-csv">Baixar planilha das compras (Excel)</button>
    <label class="btn sec" for="restaurar">Restaurar uma cópia (.json)</label>
    <input type="file" id="restaurar" accept=".json,application/json" hidden>
  </div>`;
}
function baixar(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function baixarJson() {
  baixar(`minhas-compras-${hoje()}.json`, JSON.stringify({ app: "minhas-compras", versao: VERSAO, em: new Date().toISOString(), regs: [...REG.values()] }), "application/json");
}
export function baixarCsv() {
  const cab = ["Data", "Loja", "Tipo", "Item", "Categoria", "Marca", "Quantidade", "Embalagem", "Unidades", "Conteúdo", "Medida", "Preço total", "Promoção", "Pagamento"];
  const linhas = [cab];
  for (const c of comprasFeitas()) for (const l of linhasDaCompra(c.id)) {
    const it = porId(l.item);
    linhas.push([c.data, nomeLoja(c.loja), c.tipo, it?.nome || "", it?.cat || "", l.marca || "", l.qtd, l.embNome || l.unNome || "", (Number(l.qtd) || 0) * (Number(l.porEmb) || 1), l.conteudo ?? "", l.medida, String(l.preco).replace(".", ","), l.promo ? "sim" : "", c.pag || ""]);
  }
  const csv = "﻿" + linhas.map(r => r.map(v => { const s = String(v ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\r\n");
  baixar(`minhas-compras-${hoje()}.csv`, csv, "text/csv;charset=utf-8");
}
export async function restaurar(arquivo) {
  let d;
  try { d = JSON.parse(await arquivo.text()); } catch { return aviso("Arquivo inválido", "erro"); }
  if (d?.app !== "minhas-compras" || !Array.isArray(d.regs)) return aviso("Este arquivo não é uma cópia do Minhas Compras", "erro");
  if (!(await confirmar(`Restaurar ${d.regs.length} registros da cópia de ${String(d.em).slice(0, 10)}? Os registros da cópia substituem os atuais com o mesmo código; os demais continuam.`, { sim: "Restaurar" }))) return;
  baixarJson(); // cópia do estado atual antes de restaurar
  salvar(...d.regs);
  aviso("Cópia restaurada");
}

export async function sairDaConta() {
  if (await confirmar("Sair da conta neste aparelho?", { sim: "Sair" })) await sair();
}
