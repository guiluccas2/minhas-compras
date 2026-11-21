// Ligação com o Firebase: login com Google e sincronização em tempo real entre os aparelhos.
// Os registros ficam em casa/principal/regs (regras do Firestore: só os e-mails da casa leem e gravam).
// Só os registros alterados desde a última sincronização são baixados (economiza leituras).
// Sem internet: o Firestore guarda as gravações no aparelho e envia quando a conexão volta.

import { firebaseConfig } from "./config.js";
import { estado, receberDaNuvem, ligarNuvem } from "./dados.js";

const V = "10.12.2";
const GS = `https://www.gstatic.com/firebasejs/${V}/`;

let fb = null;      // módulos do Firebase
let auth, db, col;
let pararEscuta = null;

export const nuvem = {
  modo: "local",    // "local" (só neste aparelho) ou "firebase"
  usuario: null,    // { nome, email, foto }
  erro: "",
};

export async function iniciarNuvem({ aoEntrar, aoSair, aoErro, aoSincronizar, aoPrimeiraCarga }) {
  if (new URLSearchParams(location.search).has("local") || !firebaseConfig?.apiKey) {
    nuvem.modo = "local";
    return false;
  }
  try {
    const [app, a, f] = await Promise.all([
      import(GS + "firebase-app.js"),
      import(GS + "firebase-auth.js"),
      import(GS + "firebase-firestore.js"),
    ]);
    fb = { ...app, ...a, ...f };
  } catch (e) {
    nuvem.modo = "local";
    nuvem.erro = "Não foi possível carregar o Firebase (sem internet no primeiro acesso?).";
    return false;
  }
  nuvem.modo = "firebase";
  const app = fb.initializeApp(firebaseConfig);
  auth = fb.getAuth(app);
  try {
    db = fb.initializeFirestore(app, { localCache: fb.persistentLocalCache({ tabManager: fb.persistentMultipleTabManager() }) });
  } catch {
    db = fb.getFirestore(app);
  }
  col = fb.collection(db, "casa", "principal", "regs");

  try { await fb.getRedirectResult(auth); } catch (e) { aoErro?.(traduzErro(e)); }

  fb.onAuthStateChanged(auth, user => {
    if (pararEscuta) { pararEscuta(); pararEscuta = null; }
    if (!user) { nuvem.usuario = null; ligarNuvem(null); aoSair?.(); return; }
    nuvem.usuario = { nome: user.displayName || user.email, email: user.email, foto: user.photoURL };
    estado.usuario = (user.displayName || user.email || "").split(" ")[0];
    ligarNuvem(enviar);
    escutar({ aoErro, aoSincronizar, aoPrimeiraCarga });
    aoEntrar?.(nuvem.usuario);
  });
  return true;
}

function escutar({ aoErro, aoSincronizar, aoPrimeiraCarga }) {
  const desde = fb.Timestamp.fromMillis(Math.max(0, (estado.ultimoServidor || 0) - 1));
  const q = fb.query(col, fb.where("upd", ">", desde));
  let primeira = true;
  pararEscuta = fb.onSnapshot(q, { includeMetadataChanges: true }, snap => {
    const chegaram = [];
    for (const ch of snap.docChanges()) {
      if (ch.doc.metadata.hasPendingWrites) continue; // gravação deste aparelho ainda não confirmada
      const d = ch.doc.data();
      const ms = d.upd?.toMillis ? d.upd.toMillis() : 0;
      if (ms > estado.ultimoServidor) estado.ultimoServidor = ms;
      d.upd = ms;
      chegaram.push(d);
    }
    if (chegaram.length) receberDaNuvem(chegaram);
    estado.sync = snap.metadata.hasPendingWrites ? "enviando" : snap.metadata.fromCache ? "offline" : "ok";
    aoSincronizar?.(estado.sync);
    if (primeira && !snap.metadata.fromCache) { primeira = false; aoPrimeiraCarga?.(); }
  }, e => aoErro?.(traduzErro(e)));
}

function enviar(reg) {
  const dados = { ...reg, upd: fb.serverTimestamp() };
  fb.setDoc(fb.doc(col, reg.id), dados).catch(() => {});
  estado.sync = "enviando";
}

export async function entrar() {
  const prov = new fb.GoogleAuthProvider();
  prov.setCustomParameters({ prompt: "select_account" });
  try {
    await fb.signInWithPopup(auth, prov);
  } catch (e) {
    if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") {
      await fb.signInWithRedirect(auth, prov);
    } else if (e?.code !== "auth/popup-closed-by-user" && e?.code !== "auth/cancelled-popup-request") {
      throw new Error(traduzErro(e));
    }
  }
}

export async function sair() {
  if (fb && auth) await fb.signOut(auth);
}

function traduzErro(e) {
  const c = e?.code || "";
  if (c.includes("permission-denied")) return "Este e-mail não tem acesso aos dados da casa. Entre com um dos e-mails liberados nas regras do Firebase.";
  if (c.includes("unauthorized-domain")) return "Este endereço não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).";
  if (c.includes("network")) return "Sem conexão com a internet.";
  return e?.message || String(e);
}
