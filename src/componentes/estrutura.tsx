/**
 * ESTRUTURA — peças que montam as telas: barra do topo, área rolável,
 * título de seção, cartão, avatar, logo e a tela de "acesso restrito".
 */
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { iniciais } from '../utilidades/formatar';
import { cor, espaco, FAIXA_SENAI, raio, sombra, tipografia, TOQUE_MINIMO } from '../tema';
import { Tocavel } from './animacao';
import { Icone } from './icone';
import { Vazio } from './indicadores';

/* ───────────── Logo ───────────── */

// Logo "MEU SENAI": marca oficial do SENAI (Wikimedia Commons, CC BY-SA 4.0)
// + "MEU" na fonte Exo 2.
const LOGO_BRANCA = require('../../assets/meu-senai-logo-white.png');
const PROPORCAO_LOGO = 1371 / 186;

/** Logo branca, para fundo azul. `tamanho` é a altura das letras. */
export function Logo({ tamanho = 20 }: { tamanho?: number }) {
  const altura = Math.round(tamanho * 1.1);
  return (
    <Image
      source={LOGO_BRANCA}
      style={{ height: altura, width: altura * PROPORCAO_LOGO }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Meu SENAI"
      accessibilityIgnoresInvertColors
    />
  );
}

/* ───────────── Barra do topo ───────────── */

/**
 * Cabeçalho azul das telas internas: cantos curvos e faixa vermelha SENAI.
 * Uma linha: botão voltar, título + subtítulo e, à direita, a logo ou ações.
 * Nas abas (`voltar={false}`) mostra só o título.
 */
export function BarraTopo({
  titulo,
  subtitulo,
  direita,
  voltar = true,
}: {
  titulo: string;
  subtitulo?: string;
  direita?: ReactNode;
  voltar?: boolean;
}) {
  const margens = useSafeAreaInsets();
  return (
    <View style={[estilos.barra, { paddingTop: margens.top + espaco[3] }]}>
      <View style={estilos.barraLinha}>
        {voltar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            style={({ pressed }) => [estilos.botaoRedondo, pressed && { backgroundColor: 'rgba(255,255,255,0.26)' }]}
            hitSlop={4}
          >
            <Icone nome="arrow-left" cor={cor.sobrePrimaria} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text
            style={[tipografia.titulo, { color: cor.sobrePrimaria, fontSize: 20, lineHeight: 26 }]}
            numberOfLines={1}
            accessibilityRole="header"
          >
            {titulo}
          </Text>
          {subtitulo ? (
            <Text style={[tipografia.corpoPequeno, { color: cor.sobrePrimariaSuave }]} numberOfLines={1}>
              {subtitulo}
            </Text>
          ) : null}
        </View>
        {direita ?? (voltar ? <Logo tamanho={12} /> : null)}
      </View>
    </View>
  );
}

/* ───────────── Tela ───────────── */

/** Área rolável da tela. `rodape` fica fixo embaixo (ex.: botão Enviar). */
export function Tela({ children, rodape }: { children: ReactNode; rodape?: ReactNode }) {
  const margens = useSafeAreaInsets();
  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: cor.fundo }}
        contentContainerStyle={{ padding: espaco[4], paddingBottom: espaco[8] + (rodape ? 0 : margens.bottom) }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={estilos.coluna}>{children}</View>
      </ScrollView>
      {rodape ? <View style={[estilos.rodape, { paddingBottom: espaco[3] + margens.bottom }]}>{rodape}</View> : null}
    </View>
  );
}

/** Tela inteira de "sem permissão" ou "não encontrado". */
export function Bloqueado({ titulo, texto, barra }: { titulo: string; texto: string; barra: string }) {
  return (
    <>
      <BarraTopo titulo={barra} />
      <Tela>
        <Vazio icone="lock-outline" titulo={titulo} texto={texto} />
      </Tela>
    </>
  );
}

/** Título de seção com marcador vermelho, contador opcional e link "Ver todos". */
export function TituloSecao({
  children,
  contador,
  acao,
}: {
  children: string;
  contador?: number;
  acao?: { texto: string; aoTocar: () => void };
}) {
  return (
    <View style={estilos.secao}>
      <View style={estilos.marcador} />
      <Text style={[tipografia.titulo, { color: cor.tinta, flex: 1 }]} accessibilityRole="header">
        {children}
      </Text>
      {contador ? (
        <View style={estilos.contador} accessibilityLabel={`${contador} itens`}>
          <Text style={[tipografia.rotuloPequeno, { color: '#fff' }]}>{contador}</Text>
        </View>
      ) : null}
      {acao ? (
        <Pressable
          onPress={acao.aoTocar}
          hitSlop={6}
          accessibilityRole="button"
          style={({ pressed }) => [estilos.link, pressed && { backgroundColor: cor.primariaClara }]}
        >
          <Text style={[tipografia.rotulo, { color: cor.primaria }]}>{acao.texto}</Text>
          <Icone nome="chevron-right" tamanho={18} cor={cor.primaria} />
        </Pressable>
      ) : null}
    </View>
  );
}

/* ───────────── Cartão, avatar, divisor ───────────── */

/** Caixa branca com sombra. Com `aoTocar`, vira um cartão tocável. */
export function Cartao({
  children,
  aoTocar,
  style,
  descricao,
}: {
  children: ReactNode;
  aoTocar?: () => void;
  style?: StyleProp<ViewStyle>;
  descricao?: string;
}) {
  if (!aoTocar) return <View style={[estilos.cartao, style]}>{children}</View>;
  return (
    <Tocavel onPress={aoTocar} style={[estilos.cartao, style]} accessibilityRole="button" accessibilityLabel={descricao} escala={0.985}>
      {children}
    </Tocavel>
  );
}

/** Círculo com as iniciais do nome. `anel` desenha o anel vermelho SENAI. */
export function Avatar({
  nome,
  tamanho = 44,
  tom = 'branco',
  anel,
}: {
  nome: string;
  tamanho?: number;
  tom?: 'branco' | 'azul' | 'escuro';
  anel?: boolean;
}) {
  const fundo = { branco: cor.sobrePrimaria, azul: cor.primariaClara, escuro: cor.tinta }[tom];
  return (
    <View
      style={[
        {
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          backgroundColor: fundo,
          alignItems: 'center',
          justifyContent: 'center',
        },
        anel && { borderWidth: 2.5, borderColor: cor.vermelho },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text
        style={{
          fontFamily: tipografia.titulo.fontFamily,
          fontSize: tamanho * 0.38,
          color: tom === 'escuro' ? cor.sobrePrimaria : cor.primaria,
        }}
      >
        {iniciais(nome)}
      </Text>
    </View>
  );
}

/** Linha fina de separação. `recuo` empurra o início para a direita. */
export function Divisor({ recuo = 0 }: { recuo?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: cor.borda, marginLeft: recuo }} />;
}

const estilos = StyleSheet.create({
  barra: {
    backgroundColor: cor.primaria,
    paddingHorizontal: espaco[4],
    paddingBottom: espaco[5],
    borderBottomLeftRadius: raio.folha,
    borderBottomRightRadius: raio.folha,
    borderBottomWidth: FAIXA_SENAI,
    borderBottomColor: cor.vermelho,
    zIndex: 1,
    ...sombra,
  },
  barraLinha: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    minHeight: TOQUE_MINIMO,
  },
  botaoRedondo: {
    width: 44,
    height: 44,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  coluna: { width: '100%', maxWidth: 640, alignSelf: 'center', gap: espaco[4] },
  rodape: {
    backgroundColor: cor.superficie,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: cor.borda,
    paddingHorizontal: espaco[4],
    paddingTop: espaco[3],
  },
  secao: { flexDirection: 'row', alignItems: 'center', gap: espaco[2], marginTop: espaco[2] },
  marcador: { width: 4, height: 20, borderRadius: raio.pilula, backgroundColor: cor.vermelho },
  contador: {
    minWidth: 24,
    height: 24,
    borderRadius: raio.pilula,
    backgroundColor: cor.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  link: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: espaco[3],
    paddingRight: espaco[2],
    borderRadius: raio.pilula,
  },
  cartao: { backgroundColor: cor.superficie, borderRadius: raio.cartao, padding: espaco[4], ...sombra },
});
