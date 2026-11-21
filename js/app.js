// Início do app: carrega dados, liga a nuvem, desenha as telas e trata os toques.

import { $, aviso, esc, fecharJanela, debounce } from "./util.js";
import { carregarLocal, aoMudar, salvar, apagar, porId, precisaSemear, estado, CFG_PADRAO, REG } from "./dados.js";
import { catalogoSugerido, LOJAS_INICIAIS } from "./catalogo.js";
import { iniciarNuvem, entrar, nuvem, sair } from "./nuvem.js";
import { acaoRapida, formItem } from "./ui.js";
import { telaInicio, telaEstoque, telaLista, telaItem, filtros, anotarNaLista } from "./telas.js";
import { telaComprando, telaCompras, telaCompra, iniciarCompra, abrirLinha, finalizarCompra, cancelarCompra, editarCompra, excluirCompra, escolherItemPara, cadastrarEPegar, buscaCompra } from "./compra.js";
import { telaMais, telaCatalogo, ligarBuscaCatalogo, telaInventario, trocarLocalInventario, salvarInventario, telaLojas, formLoja, telaConfig, salvarConfig, telaBackup, baixarJson, baixarCsv, restaurar, sairDaConta } from "./mais.js";

const main = $("#tela");
const NAV = [
  ["inicio", "Início", "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"],
  ["estoque", "Estoque", "M4 7h16v13H4zM2 3h20v4H2zM9 11h6"],
  ["lista", "Lista", "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"],
  ["comprando", "Comprar", "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2M9 20.5h.01M17 20.5h.01"],
  ["mais", "Mais", "M5 12h.01M12 12h.01M19 12h.01"],
];
let autorizado = false;

function rota() {
  const h = location.hash.replace(/^#\/?/, "") || "inicio";
  const [caminho, qs] = h.split("?");
  const [nome, id] = caminho.split("/");
  return { nome, id, params: new URLSearchParams(qs || "") };
}

function desenharNav(ativo) {
  const mapa = { item: "estoque", catalogo: "mais", inventario: "mais", lojas: "mais", config: "mais", backup: "mais", compras: "mais", compra: "mais" };
  const at = mapa[ativo] || ativo;
  $("#nav").innerHTML = NAV.map(([k, nome, d]) => `<a href="#/${k}" class="${k === at ? "on" : ""}" ${k === at ? 'aria-current="page"' : ""}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg><span>${nome}</span></a>`).join("");
}

function desenhar() {
  if (!autorizado) return;
  const r = rota();
  const telas = {
    inicio: telaInicio, estoque: () => telaEstoque(r.params), lista: () => telaLista(r.params), item: () => telaItem(r.id),
    comprando: telaComprando, compras: telaCompras, compra: () => telaCompra(r.id),
    mais: telaMais, catalogo: telaCatalogo, inventario: telaInventario, lojas: telaLojas, config: telaConfig, backup: telaBackup,
  };
  const fn = telas[r.nome] || telaInicio;
  // guarda o foco/posição de campos de busca para não atrapalhar quem está digitando
  const foco = document.activeElement && main.contains(document.activeElement) && document.activeElement.id;
  const pos = foco ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
  main.innerHTML = fn();
  desenharNav(r.nome);
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
  main.innerHTML = `<div class="login">
    <img src="icons/icon-192.png" alt="" width="72" height="72">
    <h1>Minhas Compras</h1>
    <p class="sub">Estoque da casa, lista de compras e preços, sincronizados entre os celulares e o computador.</p>
    ${msg ? `<p class="erro-box">${esc(msg)}</p>` : ""}
    ${nuvem.usuario ? `<p class="sub">Conectado como ${esc(nuvem.usuario.email)}</p><button class="btn" data-acao="sair-direto">Sair e entrar com outro e-mail</button>` : `<button class="btn" data-acao="entrar">Entrar com Google</button>`}
  </div>`;
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
    aoSincronizar: () => { const el = $("#sync"); if (el) el.dataset.s = estado.sync; },
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
