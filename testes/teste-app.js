// Teste de ponta a ponta em modo local (sem Firebase): node testes/teste-app.js [endereço]
// Cobre: catálogo inicial, inventário, consumo, lista de compras, Modo Compra com preço por unidade,
// finalização (estoque atualizado), ficha do item, desfazer, celular 390 px sem rolagem lateral.
const { chromium } = require("playwright");
const BASE = process.argv[2] || "http://localhost:8765/";
let falhas = 0;
const ok = (cond, msg) => { console.log((cond ? "✔ " : "✘ ") + msg); if (!cond) falhas++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const erros = [];
  page.on("pageerror", e => erros.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !/fonts|ERR_|Failed to load resource/.test(m.text())) erros.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(BASE + "?local=1#/inicio");
  await page.waitForSelector("h1");
  ok(await page.locator("text=Primeiros passos").count() === 1, "Início mostra os primeiros passos");

  // catálogo semeado
  await page.goto(BASE + "?local=1#/catalogo");
  const nItens = await page.locator(".chk").count();
  ok(nItens > 120, `catálogo sugerido carregado (${nItens} itens)`);
  // esconder um item
  await page.locator('[data-id="it-cerveja"].chk').uncheck();
  await page.goto(BASE + "?local=1#/estoque");
  ok(await page.locator('[data-item="it-cerveja"]').count() === 0, "item desmarcado some do estoque");

  // inventário: Banheiro, papel higiênico = 10
  await page.goto(BASE + "?local=1#/inventario");
  await page.click('[data-inv-local="Banheiro"]');
  await page.fill('[data-inv="it-papel-higienico"]', "10");
  await page.fill('[data-inv="it-sabonete"]', "3");
  await page.click('[data-acao="salvar-inventario"]');
  await page.goto(BASE + "?local=1#/item/it-papel-higienico");
  ok((await page.textContent(".cartao b")).includes("10 rolos"), "contagem do inventário vira estoque (10 rolos)");

  // consumo rápido: usei 1 sabonete
  await page.goto(BASE + "?local=1#/estoque");
  await page.fill("#busca", "sabonete");
  await page.click('[data-acao="usei"][data-id="it-sabonete"]');
  await page.waitForTimeout(150);
  ok((await page.textContent('[data-item="it-sabonete"] .sub')).includes("2 sabonetes"), "Usei 1 baixa o estoque (3 → 2)");
  // desfazer
  await page.click("#aviso .desfazer");
  await page.waitForTimeout(150);
  ok((await page.textContent('[data-item="it-sabonete"] .sub')).includes("3 sabonetes"), "Desfazer volta o estoque (3)");
  // acabou tudo do café (status emb) e situação do sal
  await page.fill("#busca", "café em pó");
  await page.click('[data-acao="zerou"]').catch(() => {});
  await page.fill("#busca", "Café em pó");
  // café é "por embalagem": usa a janela ⋯
  await page.click('[data-acao="consumo"][data-id="it-cafe-em-po"]');
  await page.click('[data-c="zerou"]');
  await page.waitForTimeout(150);
  ok((await page.textContent('[data-item="it-cafe-em-po"] .pill')).includes("acabou"), "Acabou tudo marca o café como acabado");

  // lista semanal mostra o café (acabou)
  await page.goto(BASE + "?local=1#/lista?t=semanal");
  ok(await page.locator('.li a[href="#/item/it-cafe-em-po"]').count() === 1, "café que acabou entra na lista semanal");
  // anotação livre
  await page.click('[data-acao="anotar-lista"]');
  await page.fill("#fl-txt", "Pilhas AA");
  await page.click('#fl button.btn');
  await page.waitForTimeout(150);
  ok(await page.locator(".li >> text=Pilhas AA").count() === 1, "anotação livre aparece na lista");

  // Modo Compra
  await page.click('[data-acao="iniciar-compra"]');
  await page.selectOption("#fc-loja", "lj-atacadao");
  await page.click("#fc button.btn");
  await page.waitForSelector("text=Falta pegar");
  await page.goto(BASE + "?local=1#/lista");
  await page.waitForSelector("text=Falta pegar");
  ok(await page.locator("#nav a.on span").textContent() === "Comprar", "com compra em andamento, o botão Comprar abre direto o Modo Compra");
  await page.click('[data-acao="linha-nova"][data-id="it-cafe-em-po"]');
  await page.fill("#ln-qtd", "2");
  await page.fill("#ln-cada", "18,90");
  await page.waitForTimeout(50);
  await page.fill("#ln-marca", "Melitta");
  { const t = await page.inputValue("#ln-total"); ok(t === "37,80", "total = 2 × 18,90 → " + t + " (qtd " + await page.inputValue("#ln-qtd") + ")"); }
  ok((await page.textContent("#ln-calc")).includes("por kg"), "mostra preço por kg: " + (await page.textContent("#ln-calc")));
  await page.click("#fln button.btn:not(.perigo)");
  await page.waitForTimeout(120);
  // papel higiênico: 2 pacotes de 24 rolos de 30 m a 39,90
  await page.fill("#busca-compra", "papel hig");
  await page.click('[data-acao="linha-nova"][data-id="it-papel-higienico"]');
  await page.fill("#ln-qtd", "2");
  await page.fill("#ln-por", "24");
  await page.fill("#ln-cont", "30");
  await page.fill("#ln-cada", "39,90");
  const calc = (await page.textContent("#ln-calc")).replace(/\u00a0/g, " ");
  ok(calc.includes("R$ 1,66 por rolo") && calc.includes("R$ 0,055 por metro"), "papel: R$ 1,66/rolo e R$ 0,055/metro → " + calc);
  await page.check("#ln-promo");
  await page.click("#fln button.btn:not(.perigo)");
  await page.waitForTimeout(120);
  // carne por quilo: preço por kg calcula o total
  await page.fill("#busca-compra", "patinho");
  await page.click('[data-acao="linha-nova"][data-id="it-patinho"]');
  await page.fill("#ln-cont", "1,24");
  await page.fill("#ln-base", "45");
  ok((await page.inputValue("#ln-total")) === "55,80", "carne: R$ 45/kg × 1,24 kg = 55,80");
  await page.click("#fln button.btn:not(.perigo)");
  await page.waitForTimeout(120);
  await page.waitForTimeout(150);
  await page.click('[data-acao="peguei-texto"]');
  await page.waitForTimeout(150);
  { const t = await page.textContent("#total-carrinho"); ok(t.includes("173,40"), "total do carrinho = 37,80 + 79,80 + 55,80 → " + t); }
  await page.click('[data-acao="finalizar-compra"]');
  await page.fill("#ff-total", "170");
  await page.click("#ff button.btn");
  await page.waitForSelector("text=Total pago");
  ok((await page.textContent(".kpi b")).includes("170,00"), "total pago com desconto (R$ 170,00)");

  // dados para o Minhas Finanças: total, nº de itens e situação
  const fin = await page.evaluate(async () => { const d = await import("/js/dados.js"); const c = d.comprasFeitas()[0]; return { id: c.id, total: c.total, n: c.nItens, fin: c.fin }; });
  ok(fin.total === 170 && fin.n === 3 && fin.fin === "pendente", `compra guarda total/itens para o financeiro (${JSON.stringify(fin)})`);
  // já lançada no financeiro e depois alterada → volta para revisão
  await page.evaluate(async (id) => { const d = await import("/js/dados.js"); const c = d.porId(id); c.fin = "lancado"; c.finValor = 17000; d.salvar(c); }, fin.id);
  await page.goto(BASE + "?local=1#/compra/" + fin.id);
  await page.click('[data-acao="linha-editar"] >> nth=0');
  const totalAntes = await page.inputValue("#ln-total");
  await page.fill("#ln-total", "1,00");
  await page.click("#fln button.btn:not(.perigo)");
  await page.waitForTimeout(150);
  const fin2 = await page.evaluate(async (id) => { const d = await import("/js/dados.js"); const c = d.porId(id); return { fin: c.fin, total: c.total }; }, fin.id);
  ok(fin2.fin === "revisar", `compra lançada e alterada volta para revisão no financeiro (${JSON.stringify(fin2)})`);
  ok(await page.locator("text=alterada depois de lançada").count() >= 1, "tela da compra avisa que precisa revisar no financeiro");
  // desfaz a alteração para os próximos testes
  await page.click('[data-acao="linha-editar"] >> nth=0');
  await page.fill("#ln-total", totalAntes);
  await page.click("#fln button.btn:not(.perigo)");
  await page.waitForTimeout(150);
  ok((await page.evaluate(async (id) => (await import("/js/dados.js")).porId(id).fin, fin.id)) === "lancado", "voltando ao valor lançado, sai da revisão");

  // estoque atualizado
  await page.goto(BASE + "?local=1#/item/it-papel-higienico");
  ok((await page.textContent(".cartao b")).includes("58 rolos"), "estoque: 10 + 48 = 58 rolos");
  ok(await page.locator("text=promoção").count() >= 1, "ficha mostra a compra em promoção");
  await page.goto(BASE + "?local=1#/item/it-cafe-em-po");
  ok((await page.textContent(".cartao b")).includes("2 pacotes"), "café volta a ter 2 pacotes");
  await page.goto(BASE + "?local=1#/lista?t=semanal");
  ok(await page.locator('.li a[href="#/item/it-cafe-em-po"]').count() === 0, "café comprado sai da lista");
  ok(await page.locator(".li >> text=Pilhas AA").count() === 0, "anotação marcada como pega sai da lista");

  // Início: gasto do mês e idas
  await page.goto(BASE + "?local=1#/inicio");
  ok((await page.textContent(".kpis")).includes("170,00"), "Início mostra o gasto do mês");

  // segunda compra do café mais cara → comparação
  await page.goto(BASE + "?local=1#/comprando");
  await page.click('[data-acao="iniciar-compra"]');
  await page.click("#fc button.btn");
  await page.fill("#busca-compra", "café em");
  await page.click('[data-acao="linha-nova"][data-id="it-cafe-em-po"]');
  await page.fill("#ln-cada", "20,79");
  const comp = await page.textContent("#ln-comp");
  ok(comp.includes("10% mais caro"), "comparação com a última compra: " + comp.trim());
  await page.click(".jfechar");
  await page.click('[data-acao="cancelar-compra"]');
  await page.click('[data-r="1"]');
  await page.waitForTimeout(100);
  await page.reload();
  await page.waitForSelector("h1");
  ok(await page.locator(".faixa").count() === 0, "compra cancelada não volta depois de recarregar");

  // ===== fase 3 =====
  // C. valor por categoria guardado na compra (para o Minhas Finanças dividir)
  const pc = await page.evaluate(async () => { const d = await import("/js/dados.js"); return d.comprasFeitas()[0].porCat; });
  const somaPc = Object.values(pc || {}).reduce((a, b) => a + b, 0);
  ok(pc && pc["Mercearia"] && pc["Higiene"] && pc["Carnes"] && Math.abs(somaPc - 170) < 0.001, `compra guarda o valor por categoria, somando o total pago (${JSON.stringify(pc)})`);

  // B. segunda compra de papel higiênico em outra loja, mais cara
  await page.goto(BASE + "?local=1#/comprando");
  await page.click('[data-acao="iniciar-compra"]');
  await page.selectOption("#fc-loja", "lj-tauste");
  await page.click("#fc button.btn");
  await page.fill("#busca-compra", "papel hig");
  await page.click('[data-acao="linha-nova"][data-id="it-papel-higienico"]');
  await page.fill("#ln-qtd", "1"); await page.fill("#ln-por", "24"); await page.fill("#ln-cont", "30"); await page.fill("#ln-cada", "47,90");
  await page.waitForTimeout(50);
  await page.click("#fln button.btn:not(.perigo)");
  await page.waitForTimeout(120);
  await page.click('[data-acao="finalizar-compra"]');
  await page.click("#ff button.btn");
  await page.waitForSelector("text=Total pago");
  await page.goto(BASE + "?local=1#/precos");
  await page.waitForTimeout(100);
  const precosTxt = (await page.textContent("#tela")).replace(/\u00a0/g, " ");
  ok(precosTxt.includes("Papel higiênico") && precosTxt.includes("Mais vezes a mais barata") && precosTxt.includes("Atacadão"), "comparar preços mostra o papel higiênico e o Atacadão como mais barato");
  ok(/Economia possível[^R]*R\$ 8,00/.test(precosTxt), "economia possível calculada (R$ 47,90 − 720 m × R$ 0,0554 = R$ 8,00)");
  await page.goto(BASE + "?local=1#/item/it-papel-higienico");
  ok(await page.locator("text=Preço por loja").count() === 1, "ficha do item mostra o preço por loja");

  // E. relatório do mês
  await page.goto(BASE + "?local=1#/relatorio");
  await page.waitForTimeout(100);
  const rel = (await page.textContent("#tela")).replace(/\u00a0/g, " ");
  ok(rel.includes("R$ 217,90") && rel.includes("Higiene") && rel.includes("Carnes") && rel.includes("Tauste"), "relatório do mês: total (170 + 47,90), categorias e lojas");
  ok(/Preços que mais subiram[\s\S]*Papel higiênico[\s\S]*\+20%/.test(rel), "relatório mostra o papel higiênico 20% mais caro");

  // D. código de barras: código novo → escolhe o item → guarda; depois abre direto
  await page.goto(BASE + "?local=1#/estoque");
  await page.evaluate(() => { window.__codigoTeste = "7891234567895"; });
  await page.click('[data-acao="ler-codigo"]');
  await page.waitForSelector("text=Código novo");
  await page.fill("#vc-b", "detergente");
  await page.click('#vc-l [data-i="it-detergente"]');
  await page.waitForTimeout(150);
  ok((await page.textContent(".jconteudo h3")) === "Detergente", "código novo ligado ao Detergente abre a anotação de consumo");
  await page.click(".jfechar");
  await page.click('[data-acao="ler-codigo"]');
  await page.waitForTimeout(200);
  ok((await page.textContent(".jconteudo h3")) === "Detergente", "mesmo código lido de novo abre o Detergente direto");
  // venceu / estragou (desperdício)
  await page.click('[data-c="perdi"]');
  await page.waitForTimeout(120);
  await page.goto(BASE + "?local=1#/relatorio");
  ok(await page.locator(".li >> text=Detergente · 1").count() === 1, "venceu/estragou aparece no desperdício do relatório");
  // Modo Compra: código abre a janela de preço
  await page.goto(BASE + "?local=1#/comprando");
  await page.click('[data-acao="iniciar-compra"]');
  await page.click("#fc button.btn");
  await page.click('[data-acao="ler-codigo"]');
  await page.waitForTimeout(200);
  ok(await page.locator("#fln").count() === 1 && (await page.textContent(".jconteudo h3")) === "Detergente", "no Modo Compra, o código abre a janela de preço do item");
  await page.click(".jfechar");
  await page.click('[data-acao="cancelar-compra"]');
  await page.click('[data-r="1"]');
  await page.evaluate(() => { delete window.__codigoTeste; });
  await page.waitForTimeout(100);

  // persistência após recarregar
  await page.goto(BASE + "?local=1#/item/it-papel-higienico");
  await page.reload();
  await page.waitForSelector(".cartao b");
  ok((await page.textContent(".cartao b")).includes("82 rolos"), "dados continuam após recarregar (58 + 24 da segunda compra)");

  // anotações feitas sem nuvem ficam pendentes e são enviadas quando a nuvem liga
  const envio = await page.evaluate(async () => {
    const d = await import("/js/dados.js");
    const antes = d.qtdPendentes();
    const enviados = [];
    d.ligarNuvem(r => enviados.push(r.id));
    const depois = d.qtdPendentes();
    d.ligarNuvem(null);
    return { antes, enviados: enviados.length, depois };
  });
  ok(envio.antes > 100 && envio.enviados === envio.antes && envio.depois === 0, `pendentes enviados ao ligar a nuvem (${envio.enviados} de ${envio.antes})`);

  // menu reorganizado: 5 botões, abas nas telas irmãs, nada mais escondido em "Mais"
  await page.goto(BASE + "?local=1#/inicio");
  const nav = (await page.locator("#nav a span").allTextContents()).join(",");
  ok(nav === "Início,Estoque,Comprar,Gastos,Ajustes", "menu de baixo: " + nav);
  await page.goto(BASE + "?local=1#/catalogo");
  ok(await page.locator("#nav a.on span").textContent() === "Estoque" && await page.locator('.abas a.on').textContent() === "Catálogo", "Catálogo fica dentro de Estoque (aba)");
  await page.click('.abas a[href="#/inventario"]');
  await page.waitForSelector("text=Anote quanto tem");
  ok(true, "aba Inventário abre o inventário");
  await page.goto(BASE + "?local=1#/relatorio");
  ok(await page.locator("#nav a.on span").textContent() === "Gastos" && await page.locator(".abas a").count() === 3, "Relatório fica dentro de Gastos (aba)");
  await page.click('.abas a[href="#/precos"]');
  await page.waitForSelector("h1 >> text=Comparar preços");
  ok(true, "aba Preços abre a comparação");
  await page.goto(BASE + "?local=1#/ajustes");
  const aj = await page.textContent("#tela");
  ok(aj.includes("Planejamento") && aj.includes("Lojas") && aj.includes("Cópia de segurança") && await page.locator(".menu-mais a").count() === 3, "Ajustes só com configurações");
  await page.goto(BASE + "?local=1#/lista");
  ok(await page.locator('[data-acao="iniciar-compra"]').count() === 1 && await page.locator('[data-acao="compra-passada"]').count() === 1, "Comprar mostra a lista e os botões de compra");

  // celular: nada mais largo que a tela
  for (const r of ["inicio", "estoque", "lista", "comprando", "ajustes", "precos", "relatorio", "catalogo", "inventario", "lojas", "config", "compras", "item/it-papel-higienico"]) {
    await page.goto(BASE + "?local=1#/" + r);
    await page.waitForTimeout(80);
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    ok(w <= 390, `390 px sem rolagem lateral: ${r} (${w})`);
    if (process.env.FOTOS) await page.screenshot({ path: `${process.env.FOTOS}/${r.replace("/", "-")}.png`, fullPage: true });
  }
  await page.screenshot({ path: process.env.FOTO || "/tmp/mc.png", fullPage: false });
  ok(erros.length === 0, "sem erros no console" + (erros.length ? ": " + erros.join(" | ") : ""));
  await browser.close();
  console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo.");
  process.exit(falhas ? 1 : 0);
})();
