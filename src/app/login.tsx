import { Redirect, router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn } from '../components/motion';
import { Avatar, Button, Divider, ErrorBanner, Field, Icon, Wordmark } from '../components/ui';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../data/seed';
import { useStore } from '../data/store';
import { color, radius, shadow, space, type } from '../theme';

export default function Login() {
  const { user, login } = useStore();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const passRef = useRef<ComponentRef<typeof TextInput>>(null);

  if (user) return <Redirect href="/" />;

  const submit = (e = email, p = password) => {
    setError(null);
    if (!e.trim() || !p) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    // Small delay so the button state is perceivable, like a real request.
    setTimeout(() => {
      const r = login(e, p);
      setLoading(false);
      if (!r.ok) setError(r.error);
      else router.replace('/');
    }, 350);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: color.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}>
        <View style={[st.hero, { paddingTop: insets.top + space.xxxl }]}>
          <View style={st.column}>
            <Wordmark size={32} />
            <Text style={[type.body, { color: color.onPrimaryMuted, marginTop: space.md, maxWidth: 420 }]}>
              Comunicados, atestados, autorizações e suporte da escola em um só lugar.
            </Text>
          </View>
        </View>

        <View style={[st.column, { paddingHorizontal: space.lg }]}>
          <FadeIn style={[st.card, { marginTop: -space.xxxl }]}>
            <Text style={[type.title, { color: color.ink }]}>Entrar</Text>
            <ErrorBanner message={error} />
            <Field
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passRef.current?.focus()}
            />
            <View>
              <Field
                ref={passRef}
                label="Senha"
                value={password}
                onChangeText={setPassword}
                placeholder="Sua senha"
                secureTextEntry={!show}
                autoComplete="current-password"
                returnKeyType="go"
                onSubmitEditing={() => submit()}
                style={{ paddingRight: 56 }}
              />
              <Pressable
                onPress={() => setShow((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={show ? 'Ocultar senha' : 'Mostrar senha'}
                style={st.eye}
              >
                <Icon name={show ? 'eye-off-outline' : 'eye-outline'} tint={color.muted} />
              </Pressable>
            </View>
            <Button label={loading ? 'Entrando…' : 'Entrar'} onPress={() => submit()} loading={loading} full />
          </FadeIn>

          <FadeIn index={1} style={{ marginTop: space.xxl, gap: space.sm }}>
            <Text style={[type.titleSm, { color: color.ink }]}>Contas de demonstração</Text>
            <Text style={[type.bodySm, { color: color.muted }]}>
              Toque em um perfil para entrar. Todos os dados são fictícios, criados para a apresentação do TCC.
            </Text>
            <View style={st.list}>
              {DEMO_ACCOUNTS.map((a, i) => (
                <View key={a.email}>
                  {i > 0 ? <Divider inset={72} /> : null}
                  <Pressable
                    onPress={() => {
                      setEmail(a.email);
                      setPassword(DEMO_PASSWORD);
                      submit(a.email, DEMO_PASSWORD);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Entrar como ${a.label}, ${a.hint}`}
                    style={({ pressed }) => [st.row, pressed && { backgroundColor: color.surfaceAlt }]}
                  >
                    <Avatar name={a.label} size={40} tone="blue" />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.titleSm, { color: color.ink }]}>{a.label}</Text>
                      <Text style={[type.bodySm, { color: color.muted }]}>{a.hint}</Text>
                    </View>
                    <Icon name="chevron-right" tint={color.outlineStrong} />
                  </Pressable>
                </View>
              ))}
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  column: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  hero: {
    backgroundColor: color.primary,
    paddingHorizontal: space.xl,
    paddingBottom: space.xxxl + space.xxl,
    borderBottomLeftRadius: radius.sheet,
    borderBottomRightRadius: radius.sheet,
  },
  card: { backgroundColor: color.surface, borderRadius: radius.sheet, padding: space.xl, gap: space.lg, ...shadow },
  eye: { position: 'absolute', right: 4, bottom: 2, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  list: { backgroundColor: color.surface, borderRadius: radius.card, overflow: 'hidden', ...shadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: space.lg, minHeight: 64, paddingVertical: space.sm },
});
