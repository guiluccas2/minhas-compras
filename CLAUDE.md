# Minhas Compras — regras para qualquer alteração

PWA em JavaScript puro (módulos ES, sem build), publicado no GitHub Pages (`https://guiluccas2.github.io/minhas-compras/`). Usuários: um casal (os dois leem e gravam tudo). Responda sempre em **português**, com passos simples (o usuário não é programador).

## Decisões já tomadas (não reabrir sem o usuário pedir)
- Dados no **Firebase** (projeto `minhas-compras-c9691`), login com Google. Firestore em `casa/principal/regs`. As regras do Firestore (com os e-mails do casal) ficam **só no console do Firebase**, nunca no GitHub. O mesmo projeto vai guardar o **Minhas Finanças** em `/financas/...` (regras já publicadas para `casa` e `financas`).
- **Dois apps ligados**, não um só. Compra finalizada grava `total`, `nItens` e `fin: "pendente"` (`gravarTotal` em compra.js). O Minhas Finanças (repositório `minhas-financas`, `store.ouvirCompras`) mostra essas compras na caixa “Compras a lançar” do Início e, ao lançar, grava na compra `fin: "lancado"`, `finTx` (id do lançamento) e `finValor` (centavos). “Não lançar” = `fin: "ignorado"`. Compra lançada cujo total muda → `fin: "revisar"` (volta a `lancado` se o total voltar a `finValor`). Botão “Mandar de novo para o Minhas Finanças” → `pendente`.
- Planejamento: **compra grande** a cada 2–3 meses (padrão 75 dias, duráveis: limpeza, higiene, mercearia) e **compra semanal aos domingos** (perecíveis e reposição do que acabou antes). Item tem `freq: "semanal" | "grande"`.
- Cada item escolhe o controle: `modo: "un"` (por unidade: usei 1…), `"emb"` (por embalagem: abri um / acabou um) ou `"status"` (tem / acabando / acabou).
- Lojas iniciais: Panelão do Centro, Panelão da Honorina, Estrela, Jesus Garcia (Agudos); Tauste, Atacadão (Bauru). Catálogo sugerido em `js/catalogo.js` (gravado só no primeiro acesso; depois tudo é editável no app).

## Como os dados funcionam (confira antes de mudar)
- Registros `{ id, t, ... }` com `t` = `item`, `loja`, `compra`, `linha` (item de uma compra), `mov` (anotação de consumo), `lista` (anotação manual na lista), `cfg`.
- **Estoque não é gravado**: é calculado (`situacao()` em `js/dados.js`) a partir das linhas de compras finalizadas e das anotações (`mov`: usei, abri, acabou, zerou, contagem, status). Assim duas pessoas anotando juntas nunca se sobrescrevem. Não crie campo de estoque.
- Toda gravação passa por `salvar()` / `apagar()` (dados.js). Apagar = `del: true` (a exclusão precisa chegar ao outro aparelho). Gravação local: IndexedDB + cópia síncrona no localStorage ao fechar o app. Registros gravados sem nuvem ficam em `PENDENTES` e sobem quando a nuvem liga.
- Sincronização (`js/nuvem.js`): escuta só o que mudou desde `estado.ultimoServidor` (campo `upd` = horário do servidor). Não troque por leitura da coleção inteira (gasta a cota gratuita).
- Cálculos repetidos usam `memo()` (zera a cada alteração). Nada de `filter`/`find` na coleção inteira dentro de laços: use os índices (`historicoItem`, `movsItem`, `linhasDaCompra`).
- Preço por unidade: `precoInfo(linha)` (ml→L, g→kg; `MEDIDAS` em catalogo.js). Lista de compras: `listaCompras("semanal" | "grande")`.

## Mapa de dependências
| Se mexer em… | Atualize também |
|---|---|
| Tipo de registro novo | `salvar`/`doTipo` (dados.js), cópia de segurança (`mais.js`), e o Minhas Finanças se ele ler esse tipo |
| Campo da compra usado pelo financeiro (`data`, `loja`, `pag`, `ajuste`, `fin`, `totalCompra`) | a caixa “Compras a lançar” do Minhas Finanças |
| Tela nova | rota em `desenhar()` (app.js), `NAV`/mapa de menu, `sw.js` (`ARQUIVOS`), teste de 390 px em `testes/teste-app.js` |
| Arquivo JS novo | `sw.js` (`ARQUIVOS`) e linha no `LEIA-ME.md` |
| Categorias, locais, medidas | `js/catalogo.js` (itens antigos guardam o nome da categoria/local) |

## Antes de publicar
1. `bash testes/rodar.sh` (Playwright já instalado; tudo ✔). Teste novo para cada funcionalidade nova.
2. Celular: tudo cabe em 390 px; avisos e botões sem cobrir a tela.
3. Versão: trocar `?v=` em `index.html` e `sw.js`, `VERSAO` em `js/mais.js`, subir `CACHE` em `sw.js`.
4. Commit e push na `main` (o GitHub Pages publica sozinho).
