/**
 * TELA DE LOGIN (RF01) — e-mail e senha.
 * Acesso rápido escondido: segurar o logo por 2 s mostra as contas de teste
 * e o botão para restaurar os dados iniciais (útil para apresentar o app).
 */
import { Redirect, router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Aparecer } from '../componentes/animacao';
import { confirmar } from '../componentes/confirmar';
import { Botao, Campo } from '../componentes/controles';
import { Avatar, Divisor, Logo } from '../componentes/estrutura';
import { Icone } from '../componentes/icone';
import { FaixaErro } from '../componentes/indicadores';
import { useMensagem } from '../componentes/mensagem';
import { useBanco } from '../dados/banco';
import { CONTAS_DEMO, SENHA_DEMO } from '../dados/demonstracao';
import { cor, espaco, raio, sombra, tipografia } from '../tema';

export default function TelaEntrar() {
  const { db, usuario, entrar, restaurarDemonstracao } = useBanco();
  const mostrar = useMensagem();
  const [acessoRapido, setAcessoRapido] = useState(false);
  const margens = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const campoSenha = useRef<ComponentRef<typeof TextInput>>(null);

  if (usuario) return <Redirect href="/" />;

  const fazerLogin = (e = email, s = senha) => {
    setErro(null);
    if (!e.trim() || !s) return setErro('Preencha e-mail e senha.');
    setCarregando(true);
    entrar(e, s).then((resultado) => {
      setCarregando(false);
      if (resultado.ok) router.replace('/');
      else setErro(resultado.erro);
    });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cor.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: margens.bottom + espaco[8] }}>
        <View style={[estilos.topo, { paddingTop: margens.top + espaco[8] }]}>
          <View style={estilos.coluna}>
            {/* Segurar o logo por 2 s abre o acesso rápido (sem aviso visual de propósito). */}
            <Pressable onLongPress={() => setAcessoRapido((v) => !v)} delayLongPress={2000} style={{ alignSelf: 'flex-start' }}>
              <Logo tamanho={32} />
            </Pressable>
            <Text style={[tipografia.corpo, { color: cor.sobrePrimariaSuave, marginTop: espaco[3], maxWidth: 420 }]}>
              Comunicados, atestados, autorizações e suporte da escola em um só lugar.
            </Text>
          </View>
        </View>

        <View style={[estilos.coluna, { paddingHorizontal: espaco[4] }]}>
          <Aparecer style={[estilos.cartao, { marginTop: -espaco[8] }]}>
            <Text style={[tipografia.titulo, { color: cor.tinta }]}>Entrar</Text>
            <FaixaErro mensagem={erro} />
            <Campo
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => campoSenha.current?.focus()}
            />
            <View>
              <Campo
                ref={campoSenha}
                rotulo="Senha"
                value={senha}
                onChangeText={setSenha}
                placeholder="Sua senha"
                secureTextEntry={!mostrarSenha}
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={() => fazerLogin()}
                style={{ paddingRight: 56 }}
              />
              <Pressable
                onPress={() => setMostrarSenha((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                style={estilos.olho}
              >
                <Icone nome={mostrarSenha ? 'eye-off-outline' : 'eye-outline'} cor={cor.suave} />
              </Pressable>
            </View>
            <Botao texto={carregando ? 'Entrando…' : 'Entrar'} aoTocar={() => fazerLogin()} carregando={carregando} largo />
          </Aparecer>

          {acessoRapido ? (
            <Aparecer style={{ marginTop: espaco[6], gap: espaco[2] }}>
              <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>Acesso rápido</Text>
              <View style={estilos.lista}>
                {CONTAS_DEMO.map((conta, i) => (
                  <View key={conta.email}>
                    {i > 0 ? <Divisor recuo={72} /> : null}
                    <Pressable
                      onPress={() => {
                        setEmail(conta.email);
                        setSenha(SENHA_DEMO);
                        fazerLogin(conta.email, SENHA_DEMO);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Entrar como ${conta.nome}, ${conta.descricao}`}
                      style={({ pressed }) => [estilos.conta, pressed && { backgroundColor: cor.superficieAlt }]}
                    >
                      <Avatar nome={conta.nome} tamanho={40} tom="azul" foto={db.usuarios.find((u) => u.email === conta.email)?.foto} />
                      <View style={{ flex: 1 }}>
                        <Text style={[tipografia.subtitulo, { color: cor.tinta }]}>{conta.nome}</Text>
                        <Text style={[tipografia.corpoPequeno, { color: cor.suave }]}>{conta.descricao}</Text>
                      </View>
                      <Icone nome="chevron-right" cor={cor.bordaForte} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <Botao
                texto="Restaurar dados iniciais"
                icone="restore"
                variante="perigo"
                largo
                aoTocar={() =>
                  confirmar('Restaurar dados iniciais?', 'Avisos, pedidos e mensagens criados depois serão apagados para todos.', () => {
                    restaurarDemonstracao();
                    mostrar('Dados iniciais restaurados.');
                  })
                }
              />
            </Aparecer>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  coluna: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  topo: {
    backgroundColor: cor.primaria,
    paddingHorizontal: espaco[5],
    paddingBottom: espaco[8] + espaco[6],
    borderBottomLeftRadius: raio.folha,
    borderBottomRightRadius: raio.folha,
  },
  cartao: { backgroundColor: cor.superficie, borderRadius: raio.folha, padding: espaco[5], gap: espaco[4], ...sombra },
  olho: { position: 'absolute', right: 4, bottom: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  lista: { backgroundColor: cor.superficie, borderRadius: raio.cartao, overflow: 'hidden', ...sombra },
  conta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco[4],
    paddingHorizontal: espaco[4],
    minHeight: 64,
    paddingVertical: espaco[2],
  },
});
