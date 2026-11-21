# Minhas Compras

Controle do estoque da casa, lista de compras automática e histórico de preços (com preço por litro, quilo, metro, rolo…), sincronizado entre os celulares e o computador.

Endereço: **https://guiluccas2.github.io/minhas-compras/**

## Ativar o site (uma vez só)
1. No GitHub, abra o repositório `minhas-compras` → **Settings** → **Pages**.
2. Em *Build and deployment*: *Deploy from a branch*, branch **main**, pasta **/ (root)** → **Save**.
3. Em um ou dois minutos o endereço acima funciona.

## Instalar como app
- **Android (Chrome):** abra o endereço → menu ⋮ → **Instalar app** (ou “Adicionar à tela inicial”).
- **iPhone (Safari):** abra o endereço → botão Compartilhar → **Adicionar à Tela de Início**.
- **Computador (Chrome/Edge):** ícone de instalar na barra de endereço.

## Primeiro acesso
1. **Entrar com Google** (só os e-mails liberados nas regras do Firebase conseguem ver os dados).
2. **Mais → Catálogo**: desmarque o que vocês não usam, acerte nomes e embalagens, cadastre o que faltar.
3. **Mais → Inventário**: anote quanto tem de cada item, cômodo por cômodo.
4. **Mais → Planejamento**: confira o dia da compra semanal (domingo), a cada quantos dias é a compra grande e a data da próxima.
5. No mercado, use **Comprar** (Modo Compra): toque no item, digite quantidade e preço; o app mostra o preço por unidade e compara com a última compra. Ao finalizar, o estoque é atualizado.

## Arquivos
| Arquivo | O que é |
|---|---|
| `index.html`, `css/app.css` | a página e o visual |
| `js/app.js` | início, navegação entre telas, login |
| `js/dados.js` | registros, gravação, estoque, consumo, previsão, lista de compras |
| `js/nuvem.js` | Firebase: login Google e sincronização |
| `js/config.js` | identificação do projeto Firebase (não é senha) |
| `js/catalogo.js` | catálogo sugerido, categorias, locais, medidas, lojas iniciais |
| `js/ui.js` | peças de tela: cartão do item, anotar consumo, cadastro do item |
| `js/telas.js` | Início, Estoque, Lista, Ficha do item |
| `js/compra.js` | Modo Compra, preços, histórico de compras |
| `js/mais.js` | Catálogo, Inventário, Lojas, Planejamento, Cópia de segurança |
| `js/util.js` | datas, números, avisos, janelas |
| `sw.js`, `manifest.webmanifest`, `icons/` | app instalável e funcionamento sem internet |
| `testes/` | testes automáticos (`bash testes/rodar.sh`) |
