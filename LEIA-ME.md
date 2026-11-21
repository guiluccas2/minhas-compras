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
2. **Estoque → aba Catálogo**: desmarque o que vocês não usam, acerte nomes e embalagens, cadastre o que faltar.
3. **Estoque → aba Inventário**: anote quanto tem de cada item, cômodo por cômodo.
4. **Ajustes → Planejamento**: confira o dia da compra semanal (domingo), a cada quantos dias é a compra grande e a data da próxima.
5. No mercado, abra **Comprar** e toque em *Iniciar Modo Compra*: toque no item, digite quantidade e preço; o app mostra o preço por unidade e compara com a última compra. Ao finalizar, o estoque é atualizado.

## Onde fica cada coisa (menu de baixo)
| Botão | O que tem |
|---|---|
| **Início** | resumo do mês, próximas compras, o que acabou |
| **Estoque** | abas *Consumo* (anotar usei/abri/acabou), *Inventário* (contar o que tem) e *Catálogo* (itens que vocês usam) |
| **Comprar** | lista de compras (semanal ou grande); no mercado vira o Modo Compra |
| **Gastos** | abas *Compras* (histórico), *Relatório* do mês e *Preços* (comparar lojas) |
| **Ajustes** | planejamento e orçamento, lojas, cópia de segurança, aparência (claro, escuro, automático), conta, situação da nuvem e versão |

No computador, o menu fica na lateral (como no Minhas Finanças), com a situação da nuvem, o tema e a versão no rodapé. No celular, a bolinha ao lado do título mostra a nuvem: verde = salvo, amarela = salvando, vermelha = sem internet ou modo local.

## Outros recursos
- **Código de barras:** o botão com o desenho do código, ao lado da busca (Estoque e Modo Compra), abre a câmera. Na primeira vez que um código aparece, escolha qual item ele é; depois ele é reconhecido sozinho. Dá para digitar o código se a câmera não ler.
- **Venceu / estragou:** na anotação de consumo (botão ⋯ do item). Tira do estoque sem atrapalhar a previsão e entra como desperdício no relatório.
- **Gastos → aba Preços:** em qual loja cada item sai mais barato (por litro, quilo, metro ou unidade) e quanto daria para economizar.
- **Gastos → aba Relatório:** gasto por categoria e por loja, itens com mais gasto, preços que subiram ou caíram, desperdício e comparação com o mês anterior.
- **Minhas Finanças:** cada compra finalizada aparece lá em “Compras a lançar”, com a opção de dividir por categoria.

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
| `js/extras.js` | Comparar preços, Relatório do mês, leitura de código de barras |
| `js/mais.js` | Catálogo, Inventário, Ajustes (Lojas, Planejamento, Cópia de segurança, conta) |
| `js/util.js` | datas, números, avisos, janelas |
| `version.json` | número da versão publicada (o app avisa quando há uma nova) |
| `sw.js`, `manifest.webmanifest`, `icons/` | app instalável e funcionamento sem internet |
| `testes/` | testes automáticos (`bash testes/rodar.sh`) |
