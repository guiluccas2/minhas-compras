// Utilitários gerais: datas, números, dinheiro, HTML e pequenos componentes (aviso, janela de baixo, confirmação).

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function uid(prefixo = "") {
  return prefixo + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Datas (sempre "AAAA-MM-DD" no horário local) ----------
export function isoDe(d) {
  const z = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export const hoje = () => isoDe(new Date());
export function dataDe(iso) { const [a, m, d] = iso.split("-").map(Number); return new Date(a, m - 1, d, 12); }
export function somaDias(iso, n) { const d = dataDe(iso); d.setDate(d.getDate() + n); return isoDe(d); }
export function diasEntre(a, b) { return Math.round((dataDe(b) - dataDe(a)) / 86400000); }
export function tsDeIso(iso) { return dataDe(iso).getTime(); }
export function isoDeTs(ts) { return isoDe(new Date(ts)); }

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
export const NOMES_SEMANA = SEMANA;
export function dataCurta(iso) { if (!iso) return ""; const [a, m, d] = iso.split("-"); return `${d}/${MESES[+m - 1]}${a !== String(new Date().getFullYear()) ? "/" + a.slice(2) : ""}`; }
export function dataBR(iso) { if (!iso) return ""; const [a, m, d] = iso.split("-"); return `${d}/${m}/${a}`; }
export function diaSemana(iso) { return SEMANA[dataDe(iso).getDay()]; }
export function dataExtenso(iso) { const d = dataDe(iso); return `${SEMANA[d.getDay()]}, ${d.getDate()} de ${["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"][d.getMonth()]}`; }
export function quandoRel(iso) {
  const n = diasEntre(iso, hoje());
  if (n === 0) return "hoje";
  if (n === 1) return "ontem";
  if (n > 1 && n < 7) return `há ${n} dias`;
  return dataCurta(iso);
}

// ---------- Números e dinheiro ----------
const fmtR = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = v => fmtR.format(Number(v) || 0);
export function num(v, casas = 2) {
  if (v == null || !isFinite(v)) return "";
  return Number(v).toLocaleString("pt-BR", { maximumFractionDigits: casas });
}
// Preço pequeno (ex.: R$ 0,055 o metro) com casas suficientes para comparar
export function reaisFino(v) {
  if (!isFinite(v)) return "";
  const casas = v >= 1 ? 2 : v >= 0.01 ? 3 : 4;
  return "R$\u00a0" + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}
// Lê número digitado em formato brasileiro ("1.234,5" ou "1234.5")
export function lerNum(s) {
  if (typeof s === "number") return s;
  s = String(s ?? "").trim().replace(/\s|R\$/g, "");
  if (!s) return NaN;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  return Number(s);
}
// plural simples em português (pacote → pacotes, frasco → frascos, barril → barris, par → pares)
export function pluralizar(p, n) {
  if (!p || Math.abs(n) <= 1) return p || "";
  return p.split(" ").map((w, i) => i ? w : /s$/.test(w) ? w : /[aeiou]$/i.test(w) ? w + "s" : /[rz]$/.test(w) ? w + "es" : /l$/.test(w) ? w.slice(0, -1) + "is" : /m$/.test(w) ? w.slice(0, -1) + "ns" : w + "s").join(" ");
}
export function plural(n, um, varios) { return `${num(n)} ${Math.abs(n) === 1 ? um : (varios || um + "s")}`; }

// ---------- Componentes de tela ----------
let avisoTimer;
export function aviso(msg, tipo = "") {
  let el = $("#aviso");
  if (!el) { el = document.createElement("div"); el.id = "aviso"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg;
  el.className = "aviso on " + tipo;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => el.classList.remove("on"), 2600);
}

// Janela que sobe de baixo (no computador fica centralizada). Retorna o elemento do conteúdo.
export function abrirJanela(html, { aoFechar } = {}) {
  fecharJanela();
  const fundo = document.createElement("div");
  fundo.className = "jfundo";
  fundo.innerHTML = `<div class="janela" role="dialog" aria-modal="true"><button class="jfechar" type="button" aria-label="Fechar">✕</button><div class="jconteudo">${html}</div></div>`;
  fundo.addEventListener("click", e => { if (e.target === fundo || e.target.closest(".jfechar")) fecharJanela(); });
  fundo._aoFechar = aoFechar;
  document.body.appendChild(fundo);
  document.body.classList.add("travado");
  const primeiro = fundo.querySelector("input:not([type=hidden]):not([readonly]),select,textarea");
  if (primeiro && matchMedia("(pointer:fine)").matches) primeiro.focus();
  return fundo.querySelector(".jconteudo");
}
export function fecharJanela() {
  const f = $(".jfundo");
  if (!f) return;
  f.remove();
  document.body.classList.remove("travado");
  if (f._aoFechar) f._aoFechar();
}
document.addEventListener("keydown", e => { if (e.key === "Escape") fecharJanela(); });

// Confirmação feita na própria tela (sem caixa do navegador)
export function confirmar(msg, { sim = "Confirmar", perigo = false } = {}) {
  return new Promise(res => {
    let ok = false;
    const el = abrirJanela(`<p class="conf-msg">${esc(msg)}</p><div class="botoes"><button class="btn sec" data-r="0">Cancelar</button><button class="btn ${perigo ? "perigo" : ""}" data-r="1">${esc(sim)}</button></div>`, { aoFechar: () => res(ok) });
    el.addEventListener("click", e => { const b = e.target.closest("[data-r]"); if (!b) return; ok = b.dataset.r === "1"; fecharJanela(); });
  });
}

// Busca sem acento e sem maiúsculas
export function norm(s) { return String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
export function agrupar(lista, chaveFn) {
  const m = new Map();
  for (const x of lista) { const k = chaveFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return m;
}
export function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
