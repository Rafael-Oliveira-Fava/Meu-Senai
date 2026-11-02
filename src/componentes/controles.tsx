/**
 * CONTROLES — tudo que o usuário toca ou preenche: botões, filtros, campos,
 * listas de opção e interruptor. Regra de forma: todo controle é pílula ou círculo.
 */
import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { cor, espaco, raio, sombra, tipografia, TOQUE_MINIMO } from '../tema';
import { Tocavel } from './animacao';
import { Icone, type NomeIcone } from './icone';

/* ───────────── Botões ───────────── */

const VARIANTES = {
  principal: { fundo: cor.primaria, texto: cor.sobrePrimaria, borda: cor.primaria },
  suave: { fundo: cor.primariaClara, texto: cor.sobrePrimariaClara, borda: cor.primariaClara },
  contorno: { fundo: 'transparent', texto: cor.primaria, borda: cor.bordaForte },
  perigo: { fundo: 'transparent', texto: cor.vermelho, borda: '#F0B4B7' },
};

export function Botao({
  texto,
  aoTocar,
  variante = 'principal',
  icone,
  carregando,
  largo,
}: {
  texto: string;
  aoTocar: () => void;
  variante?: keyof typeof VARIANTES;
  icone?: NomeIcone;
  carregando?: boolean;
  largo?: boolean; // ocupa a largura toda
}) {
  const v = VARIANTES[variante];
  return (
    <Tocavel
      onPress={aoTocar}
      disabled={carregando}
      accessibilityRole="button"
      accessibilityLabel={texto}
      accessibilityState={{ disabled: !!carregando, busy: !!carregando }}
      style={[
        estilos.botao,
        { backgroundColor: v.fundo, borderColor: v.borda },
        largo && { alignSelf: 'stretch' },
        carregando && { opacity: 0.5 },
      ]}
    >
      {carregando ? <ActivityIndicator color={v.texto} size="small" /> : icone ? <Icone nome={icone} tamanho={20} cor={v.texto} /> : null}
      <Text style={[tipografia.rotulo, { color: v.texto, fontSize: 15 }]}>{texto}</Text>
    </Tocavel>
  );
}

/** Botão vermelho flutuante no canto da tela (ação principal da lista). */
export function BotaoFlutuante({ texto, icone, aoTocar }: { texto: string; icone: NomeIcone; aoTocar: () => void }) {
  return (
    <Tocavel onPress={aoTocar} accessibilityRole="button" accessibilityLabel={texto} style={estilos.flutuante}>
      <Icone nome={icone} cor={cor.sobrePrimaria} />
      <Text style={[tipografia.rotulo, { color: cor.sobrePrimaria, fontSize: 15 }]}>{texto}</Text>
    </Tocavel>
  );
}

/** Par de botões "Recusar / Aprovar" usado no rodapé dos detalhes de pedido. */
export function BotoesDecisao({
  recusar,
  aprovar,
  aoDecidir,
}: {
  recusar: string;
  aprovar: string;
  aoDecidir: (d: 'aprovado' | 'recusado') => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: espaco[3] }}>
      <View style={{ flex: 1 }}>
        <Botao texto={recusar} variante="perigo" icone="close" aoTocar={() => aoDecidir('recusado')} largo />
      </View>
      <View style={{ flex: 1 }}>
        <Botao texto={aprovar} icone="check" aoTocar={() => aoDecidir('aprovado')} largo />
      </View>
    </View>
  );
}

/* ───────────── Filtros ───────────── */

/** Pílula de filtro; `contador` mostra uma bolinha vermelha com número. */
export function Filtro({
  texto,
  ativo,
  aoTocar,
  icone,
  contador,
}: {
  texto: string;
  ativo?: boolean;
  aoTocar: () => void;
  icone?: NomeIcone;
  contador?: number;
}) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityLabel={contador ? `${texto}, ${contador}` : texto}
      accessibilityState={{ selected: !!ativo }}
      style={({ pressed }) => [estilos.filtro, ativo && estilos.filtroAtivo, pressed && { opacity: 0.85 }]}
    >
      {ativo ? (
        <Icone nome="check" tamanho={16} cor={cor.sobrePrimariaClara} />
      ) : icone ? (
        <Icone nome={icone} tamanho={16} cor={cor.suave} />
      ) : null}
      <Text style={[tipografia.rotulo, { color: ativo ? cor.sobrePrimariaClara : cor.texto }]}>{texto}</Text>
      {contador ? (
        <View style={estilos.contador}>
          <Text style={[tipografia.rotuloPequeno, { color: '#fff' }]}>{contador}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Linha de filtros com rolagem para o lado. */
export function LinhaFiltros({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: espaco[2], paddingVertical: 2 }}
      style={{ flexGrow: 0 }}
    >
      {children}
    </ScrollView>
  );
}

/* ───────────── Campos ───────────── */

type PropsCampo = TextInputProps & { rotulo: string; dica?: string; obrigatorio?: boolean };

/** Campo de texto com rótulo, asterisco de obrigatório, dica e borda azul ao focar. */
export const Campo = forwardRef<ComponentRef<typeof TextInput>, PropsCampo>(function Campo(
  { rotulo, dica, obrigatorio, style, multiline, ...resto },
  ref,
) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={[tipografia.rotulo, { color: cor.texto }]}>
        {rotulo}
        {obrigatorio ? <Text style={{ color: cor.vermelho }}> *</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor="#7A8494"
        selectionColor={cor.primaria}
        cursorColor={cor.primaria}
        accessibilityLabel={rotulo}
        multiline={multiline}
        style={[estilos.campo, multiline && estilos.campoGrande, focado && estilos.campoFocado, style]}
        {...resto}
        onFocus={(e) => {
          setFocado(true);
          resto.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          resto.onBlur?.(e);
        }}
      />
      {dica ? <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>{dica}</Text> : null}
    </View>
  );
});

/* ───────────── Escolhas ───────────── */

type Opcao<T> = { id: T; nome: string; dica?: string; icone?: NomeIcone };

/** Lista de opções em que só uma pode ser escolhida (como "radio"). */
export function ListaOpcoes<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoEscolher,
}: {
  rotulo?: string;
  valor: T | null;
  opcoes: Opcao<T>[];
  aoEscolher: (v: T) => void;
}) {
  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup">
      {rotulo ? <Text style={[tipografia.rotulo, { color: cor.texto }]}>{rotulo}</Text> : null}
      <View style={estilos.caixaOpcoes}>
        {opcoes.map((o, i) => {
          const marcada = o.id === valor;
          return (
            <View key={o.id}>
              {i > 0 ? <View style={estilos.divisor} /> : null}
              <Pressable
                onPress={() => aoEscolher(o.id)}
                accessibilityRole="radio"
                accessibilityLabel={o.dica ? `${o.nome}, ${o.dica}` : o.nome}
                accessibilityState={{ checked: marcada }}
                style={({ pressed }) => [
                  estilos.opcao,
                  pressed && { backgroundColor: cor.superficieAlt },
                  marcada && { backgroundColor: '#F2F6FD' },
                ]}
              >
                {o.icone ? <Icone nome={o.icone} cor={marcada ? cor.primaria : cor.suave} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>{o.nome}</Text>
                  {o.dica ? <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>{o.dica}</Text> : null}
                </View>
                <View style={[estilos.radio, marcada && { borderColor: cor.primaria }]}>
                  {marcada ? <View style={estilos.radioPonto} /> : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Liga/desliga com texto explicativo. */
export function Interruptor({
  rotulo,
  dica,
  valor,
  aoMudar,
}: {
  rotulo: string;
  dica?: string;
  valor: boolean;
  aoMudar: (v: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => aoMudar(!valor)}
      accessibilityRole="switch"
      accessibilityLabel={rotulo}
      accessibilityState={{ checked: valor }}
      style={[estilos.caixaOpcoes, estilos.opcao]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>{rotulo}</Text>
        {dica ? <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>{dica}</Text> : null}
      </View>
      <View style={[estilos.trilho, valor && { backgroundColor: cor.primaria, borderColor: cor.primaria }]}>
        <View style={[estilos.bolinha, valor && estilos.bolinhaLigada]}>
          {valor ? <Icone nome="check" tamanho={16} cor={cor.primaria} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: TOQUE_MINIMO,
    borderRadius: raio.pilula,
    paddingHorizontal: espaco[5],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco[2],
    borderWidth: 1,
  },
  flutuante: {
    position: 'absolute',
    right: espaco[4],
    bottom: espaco[4],
    minHeight: 56,
    borderRadius: raio.pilula,
    backgroundColor: cor.vermelho,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[2],
    paddingHorizontal: espaco[5],
    ...sombra,
  },
  filtro: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: espaco[4],
    borderRadius: raio.pilula,
    borderWidth: 1,
    borderColor: cor.bordaForte,
    backgroundColor: cor.superficie,
  },
  filtroAtivo: { backgroundColor: cor.primariaClara, borderColor: cor.primariaClara },
  contador: {
    minWidth: 20,
    height: 20,
    borderRadius: raio.pilula,
    backgroundColor: cor.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  campo: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: cor.bordaForte,
    borderRadius: raio.campo,
    backgroundColor: cor.superficie,
    paddingHorizontal: espaco[4],
    fontFamily: tipografia.corpo.fontFamily,
    fontSize: 16,
    color: cor.tinta,
  },
  campoGrande: { minHeight: 120, textAlignVertical: 'top', paddingTop: 14 },
  campoFocado: { borderColor: cor.primaria, borderWidth: 2, paddingHorizontal: 15 }, // 1 px a menos para o texto não pular
  caixaOpcoes: { backgroundColor: cor.superficie, borderRadius: raio.campo, borderWidth: 1, borderColor: cor.borda, overflow: 'hidden' },
  opcao: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[3],
    paddingHorizontal: espaco[4],
    paddingVertical: espaco[3],
  },
  divisor: { height: StyleSheet.hairlineWidth, backgroundColor: cor.borda, marginLeft: espaco[4] },
  radio: {
    width: 22,
    height: 22,
    borderRadius: raio.pilula,
    borderWidth: 2,
    borderColor: cor.bordaForte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioPonto: { width: 11, height: 11, borderRadius: raio.pilula, backgroundColor: cor.primaria },
  trilho: {
    width: 52,
    height: 32,
    borderRadius: raio.pilula,
    borderWidth: 2,
    borderColor: cor.bordaForte,
    backgroundColor: '#EEF1F5',
    padding: 2,
    justifyContent: 'center',
  },
  bolinha: {
    width: 16,
    height: 16,
    borderRadius: raio.pilula,
    backgroundColor: cor.suave,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaLigada: { alignSelf: 'flex-end', backgroundColor: '#fff', width: 24, height: 24 },
});
