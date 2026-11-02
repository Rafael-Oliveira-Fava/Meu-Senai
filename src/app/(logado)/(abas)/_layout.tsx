/**
 * ABAS DE BAIXO — Início, Avisos, Pedidos, Aluno e Suporte.
 * As bolinhas vermelhas mostram quantas coisas esperam o usuário.
 * Aluno não vê a aba Pedidos (quem envia atestados é o responsável).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { Platform, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NomeIcone } from '../../../componentes/icone';
import { contarAvisosNaoLidos, contarChamadosAguardando, pendencias } from '../../../dados/consultas';
import { useBanco, useUsuario } from '../../../dados/banco';
import { ehEquipe, ehFamilia } from '../../../dados/permissoes';
import { cor, fonte, raio } from '../../../tema';

/** Ícone da aba: cheio quando ativa, com a pílula azul-clara atrás. */
const iconeAba = (ativo: NomeIcone, inativo: NomeIcone) =>
  function IconeAba({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View
        style={{
          width: 56,
          height: 30,
          borderRadius: raio.pilula,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? cor.primariaClara : 'transparent',
        }}
      >
        <MaterialCommunityIcons name={focused ? ativo : inativo} size={22} color={color as string} />
      </View>
    );
  };

/** Número da bolinha (some quando é zero). */
const bolinha = (n: number) => (n > 0 ? (n > 9 ? '9+' : n) : undefined);

export default function LayoutAbas() {
  const { db } = useBanco();
  const usuario = useUsuario();
  const margens = useSafeAreaInsets();
  const equipe = ehEquipe(usuario);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cor.primaria,
        tabBarInactiveTintColor: cor.suave,
        tabBarLabelStyle: { fontFamily: fonte.media, fontSize: 12, marginTop: 2 },
        tabBarIconStyle: { width: 56 },
        tabBarBadgeStyle: { backgroundColor: cor.vermelho, fontFamily: fonte.media, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: cor.superficie,
          borderTopColor: cor.borda,
          height: 68 + margens.bottom,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'web' ? 8 : Math.max(margens.bottom, 8),
        },
        sceneStyle: { backgroundColor: cor.fundo },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: iconeAba('home-variant', 'home-variant-outline') }} />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: iconeAba('bullhorn', 'bullhorn-outline'),
          tabBarBadge: bolinha(contarAvisosNaoLidos(db, usuario)),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'Pedidos',
          href: usuario.perfil === 'aluno' ? null : undefined,
          tabBarIcon: iconeAba('file-document-multiple', 'file-document-multiple-outline'),
          tabBarBadge: bolinha(pendencias(db, usuario).total),
        }}
      />
      <Tabs.Screen
        name="aluno"
        options={{
          title: ehFamilia(usuario) ? (usuario.perfil === 'aluno' ? 'Meu perfil' : 'Aluno') : 'Alunos',
          tabBarIcon: equipe
            ? iconeAba('account-group', 'account-group-outline')
            : iconeAba('card-account-details', 'card-account-details-outline'),
        }}
      />
      <Tabs.Screen
        name="suporte"
        options={{
          title: 'Suporte',
          tabBarIcon: iconeAba('chat-question', 'chat-question-outline'),
          tabBarBadge: bolinha(contarChamadosAguardando(db, usuario)),
        }}
      />
    </Tabs>
  );
}
