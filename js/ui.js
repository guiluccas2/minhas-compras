// Peças de tela usadas em várias telas: situação do item, cartão do estoque,
// janela de anotar consumo (usei / abri / acabou / contagem) e cadastro do item.

import { esc, num, plural, pluralizar, aviso, abrirJanela, fecharJanela, confirmar, hoje, lerNum, $, dataCurta, isoDeTs, reaisFino } from "./util.js";
import { salvar, apagar, situacao, porId, historicoItem, movsItem, precoInfo, nomeLoja } from "./dados.js";
import { CATEGORIAS, LOCAIS, MEDIDAS, MODOS, NOME_BASE } from "./catalogo.js";

export function unTxt(item, n) {
  const u = item.unNome || "unidade";
  if (n == null) return u;
  return n > 1 ? pluralizar(u, n) : u;
}

// Selo da situação: { cls, txt }
export function selo(item, s = situacao(item)) {
  if (s.status === "desconhecido") return { cls: "p-cinza", txt: "sem registro" };
  if (s.status === "acabou") return { cls: "p-verm", txt: "acabou" };
  if (s.status === "acabando") return { cls: "p-amar", txt: "acabando" };
  if (s.diasRest != null) {
    const d = Math.floor(s.diasRest);
    const cls = d <= 7 ? "p-amar" : "p-verde";
    return { cls, txt: d <= 0 ? "acaba hoje" : d === 1 ? "~1 dia" : `~${d} dias` };
  }
  return { cls: "p-verde", txt: "tem" };
}

// Quantidade em casa, por extenso
export function qtdTxt(item, s = situacao(item)) {
  if (item.modo === "status") return s.status === "desconhecido" ? "sem registro" : ({ tem: "tem em casa", acabando: "está acabando", acabou: "acabou" })[s.status] || s.status;
  if (s.est == null) return "sem registro";
  const regs = s.est;
  let t = `${num(regs, 1)} ${unTxt(item, regs)}`;
  if (s.aberto && item.modo === "emb") t += regs > 1 ? ` (1 aberto)` : " (aberto)";
  if (s.taxa && s.estimado != null && regs - s.estimado >= 0.5) t = `~${num(Math.max(0, s.estimado), 1)} de ${t}`;
  return t;
}

// Fração para a barrinha (estoque em relação à última compra)
export function fracao(item, s = situacao(item)) {
  if (item.modo === "status") return { tem: 0.8, acabando: 0.25, acabou: 0 }[s.status] ?? 0;
  if (s.est == null) return 0;
  const ult = historicoItem(item.id)[0];
  const ref = Math.max(1, ult ? precoInfo(ult).unidades : 1, s.est);
  return Math.max(0, Math.min(1, (s.estimado ?? s.est) / ref));
}

export function botoesRapidos(item, s = situacao(item)) {
  if (item.modo === "status") {
    return ["tem", "acabando", "acabou"].map(v => `<button class="mini ${s.status === v ? "on" : ""}" data-acao="status" data-id="${item.id}" data-v="${v}">${v === "tem" ? "Tem" : v === "acabando" ? "Acabando" : "Acabou"}</button>`).join("");
  }
  if (item.modo === "emb") {
    return `<button class="mini" data-acao="abri" data-id="${item.id}">Abri um</button><button class="mini verm" data-acao="acabou" data-id="${item.id}">Acabou um</button>`;
  }
  return `<button class="mini" data-acao="usei" data-id="${item.id}">− Usei 1</button><button class="mini verm" data-acao="zerou" data-id="${item.id}">Acabou tudo</button>`;
}

export function cartaoItem(item) {
  const s = situacao(item);
  const sl = selo(item, s);
  const f = fracao(item, s);
  const corBarra = sl.cls === "p-verm" ? "var(--verm)" : sl.cls === "p-amar" ? "var(--amar)" : "var(--verde)";
  return `<article class="cartao item" data-item="${item.id}">
    <div class="linha1"><a class="nome" href="#/item/${item.id}">${esc(item.nome)}</a><span class="pill ${sl.cls}">${sl.txt}</span></div>
    <div class="barra"><b style="width:${Math.round(f * 100)}%;background:${corBarra}"></b></div>
    <div class="linha2"><span class="sub">${esc(qtdTxt(item, s))}</span><span class="rapidos">${botoesRapidos(item, s)}<button class="mini so-icone" data-acao="consumo" data-id="${item.id}" aria-label="Mais opções">⋯</button></span></div>
  </article>`;
}

// ---------- Anotações ----------
let ultimoDesfazer = null;
export function anotar(item, tipo, q, { data } = {}) {
  const ts = data && data !== hoje() ? new Date(data + "T20:00").getTime() : Date.now();
  const mov = salvar({ t: "mov", item: item.id, tipo, q, ts, data: isoDeTs(ts) });
  ultimoDesfazer = mov;
  const txt = {
    usei: `Anotado: usou ${plural(q || 1, unTxt(item, 1), unTxt(item, 2))} de ${item.nome}`,
    abri: `Anotado: abriu ${unTxt(item, 1)} de ${item.nome}`,
    acabou: `Anotado: acabou ${unTxt(item, 1)} de ${item.nome}`,
    zerou: `${item.nome}: acabou tudo`,
    contagem: `${item.nome}: contagem ${num(q, 2)} ${unTxt(item, q)}`,
    status: `${item.nome}: ${q}`,
    perdi: `Anotado: ${plural(q || 1, unTxt(item, 1), unTxt(item, 2))} de ${item.nome} venceu/estragou`,
  }[tipo];
  avisoComDesfazer(txt);
  return mov;
}
function avisoComDesfazer(txt) {
  aviso(txt);
  const el = $("#aviso");
  const b = document.createElement("button");
  b.className = "desfazer"; b.textContent = "Desfazer";
  b.onclick = () => { if (ultimoDesfazer) { apagar(ultimoDesfazer); ultimoDesfazer = null; aviso("Anotação desfeita"); } };
  el.appendChild(b);
}

export function acaoRapida(acao, id, v) {
  const item = porId(id);
  if (!item) return;
  if (acao === "usei") anotar(item, "usei", 1);
  else if (acao === "abri") anotar(item, "abri", 1);
  else if (acao === "acabou") anotar(item, "acabou", 1);
  else if (acao === "zerou") anotar(item, "zerou", 0);
  else if (acao === "status") anotar(item, "status", v);
  else if (acao === "consumo") abrirConsumo(item);
}

export function abrirConsumo(item) {
  const s = situacao(item);
  const ult = historicoItem(item.id)[0];
  const infoUlt = ult ? `Última compra: ${dataCurta(ult.data)} · ${esc(nomeLoja(ult.loja))}${ult.marca ? " · " + esc(ult.marca) : ""}` : "Ainda sem compra registrada";
  let corpo;
  if (item.modo === "status") {
    corpo = `<div class="botoes col">
      <button class="btn" data-c="status" data-v="tem">Tem em casa</button>
      <button class="btn sec" data-c="status" data-v="acabando">Está acabando</button>
      <button class="btn perigo" data-c="status" data-v="acabou">Acabou (vai para a lista)</button>
      <button class="btn sec" data-c="perdi">Venceu / estragou (jogou fora)</button></div>`;
  } else {
    const un = unTxt(item, 2);
    corpo = `<div class="botoes col">
      ${item.modo === "emb" ? `<button class="btn" data-c="abri">Abri ${esc(unTxt(item, 1) === "unidade" ? "uma nova" : "um(a) " + unTxt(item, 1) + " novo(a)")}</button>
      <button class="btn perigo" data-c="acabou">Acabou ${esc(unTxt(item, 1))} aberto(a)</button>` :
      `<div class="campo-inline"><label for="cq">Usei</label><input id="cq" inputmode="decimal" value="1"><span>${esc(un)}</span><button class="btn" data-c="usei">Anotar</button></div>`}
      <button class="btn perigo sec" data-c="zerou">Acabou tudo (estoque zerado)</button>
      <button class="btn sec" data-c="perdi">Venceu / estragou${item.modo === "un" ? " (a quantidade acima)" : " (1 " + esc(unTxt(item, 1)) + ")"}</button>
    </div>
    <details class="mais"><summary>Corrigir a quantidade em casa (contagem)</summary>
      <div class="campo-inline"><label for="cc">Temos</label><input id="cc" inputmode="decimal" value="${s.est != null ? num(s.estimado ?? s.est, 1) : ""}" placeholder="0"><span>${esc(un)}</span><button class="btn sec" data-c="contagem">Salvar</button></div>
    </details>`;
  }
  const el = abrirJanela(`
    <h3>${esc(item.nome)}</h3>
    <p class="sub">Em casa: <b>${esc(qtdTxt(item, s))}</b>${s.diasRest != null && s.status !== "acabou" ? ` · dura mais ~${Math.floor(s.diasRest)} dias` : ""}</p>
    <p class="sub">${infoUlt}</p>
    ${corpo}
    <div class="campo-inline data-mov"><label for="cd">Data</label><input id="cd" type="date" value="${hoje()}" max="${hoje()}"></div>
    <a class="link" href="#/item/${item.id}">Ver ficha completa →</a>`);
  el.addEventListener("click", e => {
    const b = e.target.closest("[data-c]");
    if (b) {
      const tipo = b.dataset.c;
      const data = $("#cd", el).value || hoje();
      let q = tipo === "status" ? b.dataset.v : 1;
      if (tipo === "usei") q = lerNum($("#cq", el).value);
      if (tipo === "contagem") q = lerNum($("#cc", el).value);
      if ((tipo === "usei" || tipo === "contagem") && !(q >= 0)) return aviso("Digite um número válido", "erro");
      if (tipo === "zerou") q = 0;
      if (tipo === "perdi") q = item.modo === "un" ? lerNum($("#cq", el)?.value) || 1 : 1;
      fecharJanela();
      anotar(item, tipo, q, { data });
      if (tipo === "perdi" && item.modo === "status") salvar({ t: "mov", item: item.id, tipo: "status", q: "acabou", ts: Date.now() + 1, data });
    }
    if (e.target.closest("a.link")) fecharJanela();
  });
}

// ---------- Cadastro do item ----------
function opcoes(lista, atual) { return lista.map(v => `<option ${v === atual ? "selected" : ""}>${esc(v)}</option>`).join(""); }

export function formItem(item, { aoSalvar, nomeInicial } = {}) {
  const novo = !item;
  const it = item || { t: "item", nome: nomeInicial || "", cat: "Mercearia", local: "Despensa", freq: "grande", modo: "un", unNome: "unidade", conteudo: null, medida: "un", embNome: "", porEmb: 1, ativo: true, minimo: 0, diasPorUn: null, obs: "" };
  const el = abrirJanela(`
    <h3>${novo ? "Novo item" : "Editar item"}</h3>
    <form id="fitem" class="form">
      <label class="campo"><span>Nome</span><input id="fi-nome" required value="${esc(it.nome)}" placeholder="ex.: Papel higiênico"></label>
      <div class="dois">
        <label class="campo"><span>Categoria</span><select id="fi-cat">${opcoes(CATEGORIAS.map(c => c.nome), it.cat)}</select></label>
        <label class="campo"><span>Onde fica</span><select id="fi-local">${opcoes(LOCAIS, it.local)}</select></label>
      </div>
      <label class="campo"><span>Como controlar o estoque</span><select id="fi-modo">${Object.entries(MODOS).map(([k, v]) => `<option value="${k}" ${k === it.modo ? "selected" : ""}>${v}</option>`).join("")}</select></label>
      <label class="campo"><span>Compra em que costuma entrar</span><select id="fi-freq"><option value="semanal" ${it.freq === "semanal" ? "selected" : ""}>Semanal (perecíveis)</option><option value="grande" ${it.freq === "grande" ? "selected" : ""}>Compra grande (duráveis)</option></select></label>
      <fieldset class="grupo"><legend>Como vem (padrão para as compras)</legend>
        <div class="tres">
          <label class="campo"><span>Unidade</span><input id="fi-un" value="${esc(it.unNome)}" placeholder="rolo, frasco…"></label>
          <label class="campo"><span>Conteúdo</span><input id="fi-cont" inputmode="decimal" value="${it.conteudo ?? ""}" placeholder="30"></label>
          <label class="campo"><span>Medida</span><select id="fi-med">${Object.entries(MEDIDAS).map(([k, v]) => `<option value="${k}" ${k === it.medida ? "selected" : ""}>${v.rotulo}</option>`).join("")}</select></label>
        </div>
        <div class="dois">
          <label class="campo"><span>Embalagem maior (opcional)</span><input id="fi-emb" value="${esc(it.embNome)}" placeholder="pacote, fardo…"></label>
          <label class="campo"><span>Unidades por embalagem</span><input id="fi-por" inputmode="numeric" value="${it.porEmb || 1}"></label>
        </div>
        <p class="dica">Ex.: papel higiênico = unidade “rolo”, conteúdo 30 m, embalagem “pacote” com 24.</p>
      </fieldset>
      <div class="dois">
        <label class="campo"><span>Estoque mínimo</span><input id="fi-min" inputmode="decimal" value="${it.minimo || ""}" placeholder="0"></label>
        <label class="campo"><span>Dias que dura 1 unidade</span><input id="fi-dias" inputmode="decimal" value="${it.diasPorUn ?? ""}" placeholder="o app aprende"></label>
      </div>
      <label class="campo"><span>Observação</span><input id="fi-obs" value="${esc(it.obs)}"></label>
      <label class="check-linha"><input type="checkbox" id="fi-ativo" ${it.ativo !== false ? "checked" : ""}> Usamos este item (desmarque para esconder)</label>
      <div class="botoes">${novo ? "" : `<button type="button" class="btn perigo sec" id="fi-apagar">Excluir</button>`}<button class="btn">Salvar</button></div>
    </form>`);
  $("#fitem", el).addEventListener("submit", e => {
    e.preventDefault();
    const nome = $("#fi-nome", el).value.trim();
    if (!nome) return;
    const cont = lerNum($("#fi-cont", el).value);
    const dias = lerNum($("#fi-dias", el).value);
    Object.assign(it, {
      nome, cat: $("#fi-cat", el).value, local: $("#fi-local", el).value, modo: $("#fi-modo", el).value, freq: $("#fi-freq", el).value,
      unNome: $("#fi-un", el).value.trim() || "unidade", conteudo: cont > 0 ? cont : null, medida: $("#fi-med", el).value,
      embNome: $("#fi-emb", el).value.trim(), porEmb: Math.max(1, Math.round(lerNum($("#fi-por", el).value) || 1)),
      minimo: lerNum($("#fi-min", el).value) || 0, diasPorUn: dias > 0 ? dias : null, obs: $("#fi-obs", el).value.trim(),
      ativo: $("#fi-ativo", el).checked,
    });
    salvar(it);
    fecharJanela();
    aviso(novo ? "Item cadastrado" : "Item salvo");
    aoSalvar?.(it);
  });
  $("#fi-apagar", el)?.addEventListener("click", async () => {
    const temHist = historicoItem(it.id).length || movsItem(it.id).length;
    if (temHist) {
      if (await confirmar(`${it.nome} tem histórico de compras ou consumo. Para não perder o histórico, ele será só escondido (desmarcado). Continuar?`, { sim: "Esconder" })) {
        it.ativo = false; salvar(it); aviso("Item escondido");
      }
      return;
    }
    if (await confirmar(`Excluir ${it.nome} do catálogo?`, { sim: "Excluir", perigo: true })) { apagar(it); aviso("Item excluído"); location.hash = "#/estoque"; }
  });
}

// Texto do preço por unidade de uma linha de compra
export function precoTxt(l) {
  const p = precoInfo(l);
  const partes = [];
  if (p.unidades > 1 && isFinite(p.porUn)) partes.push(`${reaisFino(p.porUn)}/${esc(l.unNome || "un")}`);
  if (isFinite(p.porBase) && p.base !== "un") partes.push(`${reaisFino(p.porBase)}/${NOME_BASE[p.base]}`);
  return partes.join(" · ");
}
