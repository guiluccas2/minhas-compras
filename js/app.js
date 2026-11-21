// Início do app: carrega dados, liga a nuvem, desenha as telas e trata os toques.

import { $, aviso, esc, fecharJanela, debounce } from "./util.js";
import { carregarLocal, aoMudar, salvar, apagar, porId, precisaSemear, estado, CFG_PADRAO, REG, compraAberta } from "./dados.js";
import { catalogoSugerido, LOJAS_INICIAIS } from "./catalogo.js";
import { iniciarNuvem, entrar, nuvem, sair } from "./nuvem.js";
import { acaoRapida, formItem } from "./ui.js";
import { telaInicio, telaEstoque, telaLista, telaItem, filtros, anotarNaLista } from "./telas.js";
import { telaComprando, telaCompras, telaCompra, iniciarCompra, abrirLinha, finalizarCompra, cancelarCompra, editarCompra, excluirCompra, escolherItemPara, cadastrarEPegar, buscaCompra } from "./compra.js";
import { telaPrecos, buscaPrecos, telaRelatorio, lerCodigo, tratarCodigo } from "./extras.js";
import { abrirConsumo } from "./ui.js";
import { estadoSync, syncHtml, SYNC_TXT, temaHtml, aplicarTema, versaoHtml, checarVersao, atualizarApp, versao } from "./mais.js";
import { telaMais, telaCatalogo, ligarBuscaCatalogo, telaInventario, trocarLocalInventario, salvarInventario, telaLojas, formLoja, telaConfig, salvarConfig, telaBackup, baixarJson, baixarCsv, restaurar, sairDaConta } from "./mais.js";

const main = $("#tela");
// Ícones no mesmo traço do Minhas Finanças
const ICONES = {
  inicio: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  estoque: "M4 7h16v13H4zM2 3h20v4H2zM9 11h6",
  inventario: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2zM9 12l2 2 4-4",
  catalogo: "M3 12V4h8l9 9-8 8zM7.5 7.5h.01",
  lista: "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2M9 20.5h.01M17 20.5h.01",
  compras: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  relatorio: "M4 20V10M10 20V4M16 20v-7M2 20h20",
  precos: "M12 3v18M17 7.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 2.8 5 3.4 5 1.6 5 3.6-2.2 3-5 3-5-1.1-5-3",
  ajustes: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z",
  config: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
  lojas: "M4 10v10h16V10M3 4h18l-1 6H4zM9 20v-5h6v5",
  backup: "M12 3v12M7 10l5 5 5-5M4 21h16",
};
const icone = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONES[n]}"/></svg>`;
// celular: 5 botões embaixo
const NAV = [["inicio", "Início"], ["estoque", "Estoque"], ["lista", "Comprar"], ["compras", "Gastos"], ["ajustes", "Ajustes"]];
// computador: menu lateral com grupos, como no Minhas Finanças
const LATERAL = [
  ["Dia a dia", [["inicio", "Início"], ["estoque", "Estoque"], ["lista", "Lista de compras"]]],
  ["Casa", [["inventario", "Inventário"], ["catalogo", "Catálogo"]]],
  ["Analisar", [["compras", "Compras feitas"], ["relatorio", "Relatório do mês"], ["precos", "Comparar preços"]]],
  ["Ajustes", [["config", "Planejamento"], ["lojas", "Lojas"], ["backup", "Cópia de segurança"], ["ajustes", "Aparência e conta"]]],
];
const ICONE_MARCA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONES.lista}"/></svg>`;
let autorizado = false;

function rota() {
  const h = location.hash.replace(/^#\/?/, "") || "inicio";
  const [caminho, qs] = h.split("?");
  const [nome, id] = caminho.split("/");
  return { nome, id, params: new URLSearchParams(qs || "") };
}

function desenharNav(ativo) {
  // telas que acendem cada botão do menu de baixo / do menu lateral
  const mapa = { item: "estoque", inventario: "estoque", catalogo: "estoque", comprando: "lista", compra: "compras", relatorio: "compras", precos: "compras", mais: "ajustes", lojas: "ajustes", config: "ajustes", backup: "ajustes" };
  const lat = { item: "estoque", comprando: "lista", compra: "compras", mais: "ajustes" };
  const at = mapa[ativo] || ativo, atL = lat[ativo] || ativo;
  const cur = on => `aria-current="${on ? "page" : "false"}"`;
  $("#nav").innerHTML = NAV.map(([k, nome]) => `<a href="#/${k}" ${cur(k === at)}>${icone(k)}<span>${nome}</span></a>`).join("");
  $("#side").innerHTML = `<div class="brand"><i>${ICONE_MARCA}</i>Minhas Compras</div>
    ${LATERAL.map(([g, itens]) => `<div class="grp">${g}</div>${itens.map(([k, nome]) => `<a class="nav" href="#/${k}" ${cur(k === atL)}>${icone(k)}${nome}</a>`).join("")}`).join("")}
    <div class="foot">${syncHtml()}${temaHtml()}${versaoHtml()}</div>`;
}
// bolinha da nuvem ao lado do título (celular) e texto no menu lateral
function atualizarSync() {
  const s = estadoSync();
  document.querySelectorAll(".sync").forEach(el => { el.className = "sync " + s; el.innerHTML = `<i></i>${esc(SYNC_TXT[s])}`; });
  document.querySelectorAll(".mtop-sync").forEach(el => { el.className = "mtop-sync " + s; el.title = SYNC_TXT[s]; });
}
function bolinhaSync() {
  const h1 = main.querySelector(".topo h1");
  if (h1 && !h1.querySelector(".mtop-sync")) h1.insertAdjacentHTML("afterbegin", `<span class="mtop-sync" role="img"></span>`);
  atualizarSync();
}

function desenhar() {
  if (!autorizado) return;
  const r = rota();
  const telas = {
    inicio: telaInicio, estoque: () => telaEstoque(r.params), item: () => telaItem(r.id),
    // "Comprar": com uma compra em andamento mostra direto o Modo Compra (que já traz o que falta da lista)
    lista: () => compraAberta() ? telaComprando() : telaLista(r.params),
    comprando: () => compraAberta() ? telaComprando() : telaLista(r.params), compras: telaCompras, compra: () => telaCompra(r.id),
    precos: telaPrecos, relatorio: () => telaRelatorio(r.params),
    ajustes: telaMais, mais: telaMais, catalogo: telaCatalogo, inventario: telaInventario, lojas: telaLojas, config: telaConfig, backup: telaBackup,
  };
  const fn = telas[r.nome] || telaInicio;
  // guarda o foco/posição de campos de busca para não atrapalhar quem está digitando
  const foco = document.activeElement && main.contains(document.activeElement) && document.activeElement.id;
  const pos = foco ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  main.innerHTML = fn();
  desenharNav(r.nome);
  bolinhaSync();
  if (foco) { const el = document.getElementById(foco); if (el) { el.focus(); try { el.setSelectionRange(...pos); } catch {} } }
  document.title = "Minhas Compras";
}
const redesenhar = debounce(desenhar, 60);

// ---------- Toques ----------
document.addEventListener("click", async e => {
  const b = e.target.closest("[data-acao],[data-grupo],[data-sit],[data-lista-tipo],[data-lista-loja],[data-inv-local]");
  if (!b) return;
  const d = b.dataset;
  if (d.grupo) { filtros.grupo = d.grupo; return desenhar(); }
  if (d.sit) { filtros.sit = d.sit; if (location.hash.includes("sit=")) location.hash = "#/estoque"; return desenhar(); }
  if (d.listaTipo) { filtros.listaTipo = d.listaTipo; if (location.hash.includes("t=")) location.hash = "#/lista"; return desenhar(); }
  if (d.listaLoja) { filtros.listaLoja = d.listaLoja; return desenhar(); }
  if (d.invLocal) { trocarLocalInventario(d.invLocal); return desenhar(); }
  const a = d.acao;
  if (a === "tema") { aplicarTema(d.v); return desenhar(); }
  if (a === "atualizar-app") return atualizarApp();
  if (a === "instalar") { const p = versao.instalar; if (p) { p.prompt(); await p.userChoice.catch(() => {}); versao.instalar = null; desenhar(); } return; }
  if (["usei", "abri", "acabou", "zerou", "status", "consumo"].includes(a)) { e.preventDefault(); return acaoRapida(a, d.id, d.v); }
  switch (a) {
    case "novo-item": return formItem(null, { nomeInicial: d.nome || "" });
    case "editar-item": return formItem(porId(d.id));
    case "ativo-item": { const it = porId(d.id); it.ativo = b.checked; salvar(it); return; }
    case "nao-usamos": { const it = porId(d.id); it.ativo = false; salvar(it); aviso(`${it.nome}: escondido (não usamos)`); return; }
    case "anotar-lista": return anotarNaLista();
    case "tirar-lista": { const x = porId(d.id); if (x) { apagar(x); aviso("Tirado da lista"); } return; }
    case "peguei-texto": { const x = porId(d.id); if (x) { x.feito = true; salvar(x); } return; }
    case "iniciar-compra": return iniciarCompra(d.tipo || "semanal");
    case "compra-passada": return iniciarCompra("semanal", { passada: true });
    case "linha-nova": return abrirLinha({ itemId: d.id });
    case "linha-editar": return abrirLinha({ linhaId: d.id });
    case "cadastrar-e-pegar": return cadastrarEPegar(d.nome);
    case "finalizar-compra": return finalizarCompra();
    case "cancelar-compra": return cancelarCompra();
    case "editar-compra": return editarCompra(d.id);
    case "excluir-compra": return excluirCompra(d.id);
    case "add-linha-compra": return escolherItemPara(d.id);
    case "fin-de-novo": { const c = porId(d.id); c.fin = "pendente"; salvar(c); aviso("A compra voltou para “Compras a lançar” do Minhas Finanças"); return; }
    case "apagar-mov": { const m = porId(d.id); if (m) { apagar(m); aviso("Anotação apagada"); } return; }
    case "ler-codigo": return lerCodigo(cod => tratarCodigo(cod, it => d.ctx === "compra" ? abrirLinha({ itemId: it.id }) : abrirConsumo(it)));
    case "tirar-codigo": { const it = porId(d.id); it.codigos = (it.codigos || []).filter(c => c !== d.v); salvar(it); aviso("Código retirado"); return; }
    case "nova-loja": return formLoja(null);
    case "editar-loja": return formLoja(d.id);
    case "salvar-inventario": salvarInventario(); return desenhar();
    case "baixar-json": return baixarJson();
    case "baixar-csv": return baixarCsv();
    case "sair": return sairDaConta();
    case "sair-direto": return sair();
    case "recarregar": return location.reload();
    case "entrar":
      try { await entrar(); } catch (err) { aviso(err.message, "erro"); }
      return;
  }
});

document.addEventListener("input", e => {
  const t = e.target;
  if (t.id === "busca") { filtros.busca = t.value; desenhar(); }
  else if (t.id === "busca-compra") { buscaCompra.q = t.value; desenhar(); }
  else if (t.id === "busca-cat") { ligarBuscaCatalogo(t.value); desenhar(); }
  else if (t.id === "busca-precos") { buscaPrecos(t.value); desenhar(); }
});
document.addEventListener("submit", e => {
  if (e.target.id === "fcfg") { e.preventDefault(); salvarConfig(); }
  if (e.target.id === "finv") { e.preventDefault(); salvarInventario(); desenhar(); }
});
document.addEventListener("change", e => { if (e.target.id === "restaurar" && e.target.files[0]) restaurar(e.target.files[0]); });
addEventListener("hashchange", () => { fecharJanela(); desenhar(); scrollTo(0, 0); });

// ---------- Login ----------
function telaLogin(msg = "") {
  autorizado = false;
  $("#nav").innerHTML = "";
  $("#side").innerHTML = "";
  main.innerHTML = `<div class="login"><div class="cartao">
    <div class="brand" style="padding:0"><i>${ICONE_MARCA}</i>Minhas Compras</div>
    <p class="sub">Entre com a sua conta Google. Estoque da casa, lista de compras e preços, sincronizados entre os celulares e o computador.</p>
    ${msg ? `<p class="erro-box">${esc(msg)}</p>` : ""}
    ${nuvem.usuario ? `<p class="sub">Conectado como ${esc(nuvem.usuario.email)}</p><button class="btn" data-acao="sair-direto">Sair e entrar com outro e-mail</button>` : `<button class="btn" data-acao="entrar">Entrar com Google</button>`}
  </div></div>`;
}

function semear() {
  if (!precisaSemear()) return;
  salvar({ ...CFG_PADRAO }, ...LOJAS_INICIAIS.map(l => ({ t: "loja", ativo: true, ...l })), ...catalogoSugerido());
}

// ---------- Início ----------
async function iniciar() {
  await carregarLocal();
  aoMudar(redesenhar);
  const naNuvem = await iniciarNuvem({
    aoEntrar: () => { autorizado = true; desenhar(); },
    aoSair: () => telaLogin(),
    aoErro: msg => { if (/acesso|autorizado/.test(msg)) telaLogin(msg); else aviso(msg, "erro"); },
    aoSincronizar: () => atualizarSync(),
    aoPrimeiraCarga: () => semear(),
  });
  if (!naNuvem) {
    autorizado = true;
    if (!REG.size || precisaSemear()) semear();
    desenhar();
  }
  // segurança: se nada respondeu em 15 s, mostra o motivo em vez de ficar carregando
  setTimeout(() => { if (main.textContent.trim() === "Carregando…") telaLogin("O login não respondeu. Verifique a internet e toque em Entrar com Google."); }, 15000);
}
// erro inesperado na abertura: mostra na tela (ajuda a descobrir o problema)
addEventListener("error", e => { if (main.textContent.trim() === "Carregando…") main.innerHTML = `<p class="erro-box">Erro ao abrir: ${esc(e.message)}</p>`; });
addEventListener("unhandledrejection", e => { if (main.textContent.trim() === "Carregando…") main.innerHTML = `<p class="erro-box">Erro ao abrir: ${esc(e.reason?.message || e.reason)}</p>`; });
iniciar();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
// versão nova publicada: confere ao abrir, a cada 30 minutos e ao voltar para o app
checarVersao();
setInterval(checarVersao, 30 * 60000);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checarVersao(); });
// tema "Automático": acompanha a troca de claro/escuro do aparelho
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => aplicarTema(document.documentElement.dataset.theme || "auto"));
// botão "Instalar" (Chrome/Edge) aparece em Ajustes quando o navegador oferece
addEventListener("beforeinstallprompt", e => { e.preventDefault(); versao.instalar = e; if (rota().nome === "ajustes") desenhar(); });
// teclado aberto no celular: esconde a barra de baixo
document.addEventListener("focusin", e => { if (e.target.matches?.("input:not([type=checkbox]):not([type=radio]), textarea, select")) document.documentElement.classList.add("typing"); });
document.addEventListener("focusout", () => setTimeout(() => { if (!document.activeElement?.matches?.("input, textarea, select")) document.documentElement.classList.remove("typing"); }, 120));
