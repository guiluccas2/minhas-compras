// Catálogo sugerido, listas fixas (categorias, locais, medidas) e lojas iniciais.
// O catálogo é gravado uma única vez, no primeiro acesso. Depois tudo é editável no app (Mais → Catálogo).

// tipo de loja onde o item costuma ser comprado (filtro da lista de compras)
export const TIPOS_LOJA = ["mercado", "açougue", "padaria", "farmácia", "hortifrúti"];

export const CATEGORIAS = [
  { nome: "Mercearia", loja: "mercado" },
  { nome: "Hortifrúti", loja: "mercado" },
  { nome: "Carnes", loja: "açougue" },
  { nome: "Frios e laticínios", loja: "mercado" },
  { nome: "Padaria", loja: "padaria" },
  { nome: "Bebidas", loja: "mercado" },
  { nome: "Limpeza", loja: "mercado" },
  { nome: "Higiene", loja: "mercado" },
  { nome: "Farmácia", loja: "farmácia" },
  { nome: "Outros", loja: "mercado" },
];

export const LOCAIS = ["Despensa", "Geladeira", "Freezer", "Fruteira", "Cozinha", "Banheiro", "Lavanderia", "Armário"];

// Medidas: "base" é a unidade usada para comparar preços (ml vira litro, g vira quilo).
export const MEDIDAS = {
  un: { nome: "unidade", base: "un", fator: 1, rotulo: "un" },
  kg: { nome: "quilo", base: "kg", fator: 1, rotulo: "kg" },
  g: { nome: "grama", base: "kg", fator: 0.001, rotulo: "g" },
  L: { nome: "litro", base: "L", fator: 1, rotulo: "L" },
  ml: { nome: "mililitro", base: "L", fator: 0.001, rotulo: "ml" },
  m: { nome: "metro", base: "m", fator: 1, rotulo: "m" },
  lav: { nome: "lavagem", base: "lav", fator: 1, rotulo: "lavagens" },
  fl: { nome: "folha", base: "fl", fator: 1, rotulo: "folhas" },
};
export const NOME_BASE = { un: "unidade", kg: "kg", L: "litro", m: "metro", lav: "lavagem", fl: "folha" };

// Modos de controle do estoque
export const MODOS = {
  un: "Por unidade (usei 1, usei 2…)",
  emb: "Por embalagem (abri uma nova / acabou)",
  status: "Só situação (tem / acabando / acabou)",
};

export const PAGAMENTOS = ["Crédito", "Débito", "Pix", "Dinheiro", "Vale-alimentação"];

export const LOJAS_INICIAIS = [
  { id: "lj-panelao-centro", nome: "Panelão do Centro", cidade: "Agudos", tipo: "mercado" },
  { id: "lj-panelao-honorina", nome: "Panelão da Honorina", cidade: "Agudos", tipo: "mercado" },
  { id: "lj-estrela", nome: "Estrela", cidade: "Agudos", tipo: "mercado" },
  { id: "lj-tauste", nome: "Tauste", cidade: "Bauru", tipo: "mercado" },
  { id: "lj-atacadao", nome: "Atacadão", cidade: "Bauru", tipo: "mercado" },
  { id: "lj-jesus-garcia", nome: "Jesus Garcia", cidade: "Agudos", tipo: "mercado", obs: "mercadinho de vila com açougue" },
];

// Nome | categoria | local | frequência (s = semanal, g = compra grande) | modo (u, e, s) | nome da unidade | conteúdo | medida | embalagem | unidades por embalagem
const C = `
Arroz|Mercearia|Despensa|g|e|pacote|5|kg||
Feijão carioca|Mercearia|Despensa|g|e|pacote|1|kg||
Feijão preto|Mercearia|Despensa|g|e|pacote|1|kg||
Açúcar refinado|Mercearia|Despensa|g|e|pacote|1|kg||
Sal refinado|Mercearia|Despensa|g|s|pacote|1|kg||
Óleo de soja|Mercearia|Despensa|g|e|frasco|900|ml||
Azeite de oliva|Mercearia|Despensa|g|e|frasco|500|ml||
Vinagre|Mercearia|Despensa|g|e|frasco|750|ml||
Café em pó|Mercearia|Despensa|g|e|pacote|500|g||
Filtro de papel para café|Mercearia|Despensa|g|e|caixa|30|un||
Macarrão espaguete|Mercearia|Despensa|g|u|pacote|500|g||
Macarrão parafuso|Mercearia|Despensa|g|u|pacote|500|g||
Farinha de trigo|Mercearia|Despensa|g|e|pacote|1|kg||
Farinha de mandioca|Mercearia|Despensa|g|e|pacote|500|g||
Fubá|Mercearia|Despensa|g|e|pacote|1|kg||
Aveia em flocos|Mercearia|Despensa|g|e|caixa|200|g||
Achocolatado em pó|Mercearia|Despensa|g|e|pote|400|g||
Biscoito cream cracker|Mercearia|Despensa|g|u|pacote|350|g||
Biscoito recheado|Mercearia|Despensa|g|u|pacote|130|g||
Bolacha maisena|Mercearia|Despensa|g|u|pacote|350|g||
Molho de tomate|Mercearia|Despensa|g|u|sachê|300|g||
Extrato de tomate|Mercearia|Despensa|g|u|lata|340|g||
Milho em conserva|Mercearia|Despensa|g|u|lata|170|g||
Ervilha em conserva|Mercearia|Despensa|g|u|lata|170|g||
Atum em lata|Mercearia|Despensa|g|u|lata|170|g||
Sardinha em lata|Mercearia|Despensa|g|u|lata|125|g||
Maionese|Mercearia|Geladeira|g|e|pote|500|g||
Ketchup|Mercearia|Geladeira|g|e|frasco|380|g||
Mostarda|Mercearia|Geladeira|g|e|frasco|200|g||
Tempero pronto|Mercearia|Cozinha|g|s|pacote|300|g||
Pimenta-do-reino|Mercearia|Cozinha|g|s|pote|50|g||
Orégano|Mercearia|Cozinha|g|s|pacote|10|g||
Caldo em tablete|Mercearia|Despensa|g|s|caixa|57|g||
Fermento em pó|Mercearia|Despensa|g|s|lata|100|g||
Amido de milho|Mercearia|Despensa|g|s|caixa|500|g||
Gelatina|Mercearia|Despensa|g|u|caixa|20|g||
Leite condensado|Mercearia|Despensa|g|u|caixa|395|g||
Creme de leite|Mercearia|Despensa|g|u|caixa|200|g||
Chá em sachê|Mercearia|Despensa|g|e|caixa|10|un||
Mel|Mercearia|Despensa|g|e|pote|300|g||
Milho de pipoca|Mercearia|Despensa|g|e|pacote|500|g||
Granola|Mercearia|Despensa|g|e|pacote|800|g||
Banana|Hortifrúti|Fruteira|s|s|kg|1|kg||
Maçã|Hortifrúti|Fruteira|s|s|kg|1|kg||
Laranja|Hortifrúti|Fruteira|s|s|kg|1|kg||
Mamão|Hortifrúti|Fruteira|s|s|unidade||un||
Limão|Hortifrúti|Fruteira|s|s|kg|1|kg||
Tomate|Hortifrúti|Geladeira|s|s|kg|1|kg||
Cebola|Hortifrúti|Fruteira|s|s|kg|1|kg||
Alho|Hortifrúti|Fruteira|s|s|kg|1|kg||
Batata|Hortifrúti|Fruteira|s|s|kg|1|kg||
Batata-doce|Hortifrúti|Fruteira|s|s|kg|1|kg||
Cenoura|Hortifrúti|Geladeira|s|s|kg|1|kg||
Abobrinha|Hortifrúti|Geladeira|s|s|kg|1|kg||
Pepino|Hortifrúti|Geladeira|s|s|kg|1|kg||
Alface|Hortifrúti|Geladeira|s|s|pé||un||
Cheiro-verde|Hortifrúti|Geladeira|s|s|maço||un||
Mandioca|Hortifrúti|Fruteira|s|s|kg|1|kg||
Carne moída|Carnes|Freezer|s|e|pacote|1|kg||
Patinho|Carnes|Freezer|s|e|pacote|1|kg||
Alcatra|Carnes|Freezer|s|e|pacote|1|kg||
Contrafilé|Carnes|Freezer|s|e|pacote|1|kg||
Costela bovina|Carnes|Freezer|s|e|pacote|1|kg||
Peito de frango|Carnes|Freezer|s|e|pacote|1|kg||
Coxa e sobrecoxa|Carnes|Freezer|s|e|pacote|1|kg||
Linguiça toscana|Carnes|Freezer|s|e|pacote|1|kg||
Bisteca suína|Carnes|Freezer|s|e|pacote|1|kg||
Peixe (filé)|Carnes|Freezer|s|e|pacote|1|kg||
Leite integral|Frios e laticínios|Despensa|s|u|caixa|1|L||
Iogurte|Frios e laticínios|Geladeira|s|u|unidade|170|g||
Queijo muçarela fatiado|Frios e laticínios|Geladeira|s|e|pacote|300|g||
Presunto fatiado|Frios e laticínios|Geladeira|s|e|pacote|200|g||
Manteiga|Frios e laticínios|Geladeira|g|e|pote|200|g||
Margarina|Frios e laticínios|Geladeira|g|e|pote|500|g||
Requeijão|Frios e laticínios|Geladeira|s|e|copo|200|g||
Queijo ralado|Frios e laticínios|Geladeira|g|e|pacote|50|g||
Ovos|Frios e laticínios|Geladeira|s|u|ovo||un|bandeja|30
Pão francês|Padaria|Cozinha|s|s|kg|1|kg||
Pão de forma|Padaria|Cozinha|s|e|pacote|500|g||
Bolo|Padaria|Cozinha|s|s|unidade||un||
Água mineral|Bebidas|Despensa|g|u|garrafa|1.5|L|fardo|6
Água (galão 20 L)|Bebidas|Cozinha|s|e|galão|20|L||
Refrigerante|Bebidas|Despensa|g|u|garrafa|2|L||
Suco integral|Bebidas|Despensa|g|u|garrafa|1|L||
Cerveja|Bebidas|Despensa|g|u|lata|350|ml|fardo|12
Detergente|Limpeza|Cozinha|g|e|frasco|500|ml||
Esponja de louça|Limpeza|Cozinha|g|e|esponja||un|pacote|4
Sabão em pó|Limpeza|Lavanderia|g|e|caixa|1.6|kg||
Sabão líquido para roupas|Limpeza|Lavanderia|g|e|frasco|3|L||
Amaciante|Limpeza|Lavanderia|g|e|frasco|2|L||
Água sanitária|Limpeza|Lavanderia|g|e|frasco|2|L||
Desinfetante|Limpeza|Lavanderia|g|e|frasco|2|L||
Limpador multiuso|Limpeza|Lavanderia|g|e|frasco|500|ml||
Limpa-vidros|Limpeza|Lavanderia|g|e|frasco|500|ml||
Álcool 70%|Limpeza|Lavanderia|g|e|frasco|1|L||
Lustra-móveis|Limpeza|Lavanderia|g|e|frasco|200|ml||
Sabão em barra|Limpeza|Lavanderia|g|u|barra|200|g|pacote|5
Saco de lixo 50 L|Limpeza|Cozinha|g|e|pacote|30|un||
Saco de lixo 100 L|Limpeza|Lavanderia|g|e|pacote|15|un||
Papel toalha|Limpeza|Cozinha|g|u|rolo|60|fl|pacote|2
Pano de chão|Limpeza|Lavanderia|g|u|pano||un||
Palha de aço|Limpeza|Cozinha|g|u|unidade||un|pacote|8
Desengordurante|Limpeza|Cozinha|g|e|frasco|500|ml||
Pedra sanitária|Limpeza|Banheiro|g|u|unidade||un||
Inseticida|Limpeza|Lavanderia|g|e|frasco|300|ml||
Filme PVC|Limpeza|Cozinha|g|e|rolo|28|m||
Papel alumínio|Limpeza|Cozinha|g|e|rolo|7.5|m||
Guardanapo de papel|Limpeza|Cozinha|g|e|pacote|50|fl||
Luva de limpeza|Limpeza|Lavanderia|g|u|par||un||
Papel higiênico|Higiene|Banheiro|g|u|rolo|30|m|pacote|24
Sabonete|Higiene|Banheiro|g|u|sabonete|85|g|pacote|6
Sabonete líquido|Higiene|Banheiro|g|e|frasco|250|ml||
Pasta de dente|Higiene|Banheiro|g|u|tubo|90|g||
Escova de dente|Higiene|Banheiro|g|u|escova||un||
Fio dental|Higiene|Banheiro|g|u|rolo|50|m||
Enxaguante bucal|Higiene|Banheiro|g|e|frasco|500|ml||
Shampoo|Higiene|Banheiro|g|e|frasco|350|ml||
Condicionador|Higiene|Banheiro|g|e|frasco|350|ml||
Desodorante|Higiene|Banheiro|g|u|unidade|150|ml||
Aparelho de barbear|Higiene|Banheiro|g|u|aparelho||un|pacote|2
Espuma de barbear|Higiene|Banheiro|g|e|frasco|200|ml||
Absorvente|Higiene|Banheiro|g|e|pacote|8|un||
Algodão|Higiene|Banheiro|g|e|pacote|50|g||
Cotonete|Higiene|Banheiro|g|e|caixa|75|un||
Hidratante corporal|Higiene|Banheiro|g|e|frasco|400|ml||
Protetor solar|Higiene|Banheiro|g|e|frasco|200|ml||
Lenço umedecido|Higiene|Banheiro|g|e|pacote|50|un||
Analgésico / antitérmico|Farmácia|Armário|g|e|caixa|20|un||
Curativo adesivo|Farmácia|Armário|g|e|caixa|35|un||
Soro fisiológico|Farmácia|Armário|g|e|frasco|500|ml||
Álcool em gel|Farmácia|Armário|g|e|frasco|500|ml||
Repelente|Farmácia|Armário|g|e|frasco|200|ml||
`;

export function slug(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Itens do catálogo com ids fixos (se dois aparelhos gravarem o catálogo ao mesmo tempo, não duplica)
export function catalogoSugerido() {
  const modo = { u: "un", e: "emb", s: "status" };
  return C.trim().split("\n").map(l => {
    const [nome, cat, local, freq, m, unNome, conteudo, medida, embNome, porEmb] = l.split("|");
    return {
      id: "it-" + slug(nome), t: "item", nome, cat, local,
      freq: freq === "s" ? "semanal" : "grande",
      modo: modo[m], unNome, conteudo: conteudo ? Number(conteudo) : null, medida: medida || "un",
      embNome: embNome || "", porEmb: porEmb ? Number(porEmb) : 1,
      ativo: true, minimo: 0, diasPorUn: null, obs: "",
    };
  });
}
