/**
 * TEMA — cores, letras, espaços e animações do app.
 *
 * Todas as telas usam estes valores, então mudar algo aqui muda o app inteiro.
 * Regra de cor: azul é a cor principal; vermelho (SENAI) é detalhe e alerta.
 */
import { Easing, Platform } from 'react-native';

export const cor = {
  // Azul (principal)
  primaria: '#0B4DA2',
  sobrePrimaria: '#FFFFFF', // texto em cima do azul
  sobrePrimariaSuave: '#C9DAF3', // texto secundário em cima do azul
  primariaClara: '#E3ECFA', // fundos suaves: ícones, chips selecionados
  sobrePrimariaClara: '#0A3A7A',

  // Fundos e textos
  fundo: '#F3F5F9',
  superficie: '#FFFFFF', // cartões, campos, barra de abas
  superficieAlt: '#F7F9FC',
  tinta: '#111418', // títulos (o "preto" da identidade)
  texto: '#1F2937',
  suave: '#566173', // texto secundário
  borda: '#DCE2EB',
  bordaForte: '#B9C3D1',

  // Vermelho SENAI: faixa, botão flutuante, contadores e alertas
  vermelho: '#E30613',
  vermelhoClaro: '#FDE4E5',
  sobreVermelhoClaro: '#8C0710',

  // Situações (sempre acompanhadas de ícone + palavra)
  verde: '#1C7A45',
  verdeClaro: '#E0F3E7',
  ambar: '#8A5300',
  ambarClaro: '#FFF0D4',
} as const;

/** Fonte Roboto (padrão do Android) em três pesos. */
export const fonte = {
  normal: 'Roboto_400Regular',
  media: 'Roboto_500Medium',
  negrito: 'Roboto_700Bold',
} as const;

/** Escala de texto (tamanho / altura da linha). */
export const tipografia = {
  manchete: { fontFamily: fonte.negrito, fontSize: 22, lineHeight: 28, letterSpacing: -0.2 },
  titulo: { fontFamily: fonte.negrito, fontSize: 18, lineHeight: 24 },
  subtitulo: { fontFamily: fonte.media, fontSize: 16, lineHeight: 22 },
  corpo: { fontFamily: fonte.normal, fontSize: 16, lineHeight: 24 },
  corpoPequeno: { fontFamily: fonte.normal, fontSize: 14, lineHeight: 20 },
  rotulo: { fontFamily: fonte.media, fontSize: 14, lineHeight: 20 },
  rotuloPequeno: { fontFamily: fonte.media, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  numeros: { fontFamily: fonte.media, fontVariant: ['tabular-nums' as const] }, // horários e protocolos alinhados
} as const;

/** Espaçamentos em múltiplos de 4: espaco[4] = 16 px. */
export const espaco = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32 } as const;

/**
 * Formas: tudo que se toca é pílula ou círculo.
 * Caixas usam só três arredondamentos, conforme a função.
 */
export const raio = { campo: 16, cartao: 20, folha: 28, pilula: 999 } as const;

/** Altura da faixa vermelha embaixo dos cabeçalhos azuis. */
export const FAIXA_SENAI = 4;

/** Área mínima de toque (padrão Android: 48 dp). */
export const TOQUE_MINIMO = 48;

/** Sombras suaves (no navegador usa CSS; no celular, elevação). */
export const sombra = Platform.select({
  web: { boxShadow: '0 1px 2px rgba(17,20,24,0.06), 0 4px 14px rgba(11,77,162,0.07)' },
  default: { elevation: 2, shadowColor: '#0B2550', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
}) as object;

export const sombraForte = Platform.select({
  web: { boxShadow: '0 2px 4px rgba(17,20,24,0.06), 0 10px 28px rgba(11,77,162,0.12)' },
  default: { elevation: 6, shadowColor: '#0B2550', shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
}) as object;

/** Animações curtas que mostram mudança de estado (não decoração). */
export const animacao = {
  curva: Easing.bezier(0.23, 1, 0.32, 1), // começa rápido e desacelera
  toque: 160, // ms: botão encolhendo ao tocar
  entrada: 240, // ms: item aparecendo
  saida: 160, // ms: sair é mais rápido que entrar
  intervalo: 40, // ms entre itens de uma lista
  nativo: Platform.OS !== 'web', // animação na GPU do celular
} as const;
