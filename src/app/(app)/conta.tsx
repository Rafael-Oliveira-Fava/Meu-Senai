import { router } from 'expo-router';
import { Alert, Platform, Text, View } from 'react-native';

import { useSnackbar } from '../../components/snackbar';
import { AppBar, Avatar, Button, Card, InfoRow, Screen, SectionTitle } from '../../components/ui';
import { visibleStudents } from '../../data/access';
import { useStore, useUser } from '../../data/store';
import { ROLE_LABEL } from '../../lib/format';
import { color, space, type } from '../../theme';

function confirm(title: string, message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Confirmar', style: 'destructive', onPress: onYes },
  ]);
}

export default function Account() {
  const { db, logout, resetDemo } = useStore();
  const user = useUser();
  const snack = useSnackbar();
  const students = visibleStudents(db, user);

  return (
    <>
      <AppBar title="Minha conta" />
      <Screen>
        <Card style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.xxl }}>
          <Avatar name={user.name} size={72} tone="blue" ring />
          <Text style={[type.headline, { color: color.ink, textAlign: 'center' }]}>{user.name}</Text>
          <Text style={[type.body, { color: color.muted }]}>{ROLE_LABEL[user.role]}</Text>
        </Card>
        <Card style={{ paddingVertical: space.xs }}>
          <InfoRow icon="email-outline" label="E-mail" value={user.email} />
          {user.phone ? <InfoRow icon="phone-outline" label="Telefone" value={user.phone} /> : null}
          {user.turmas?.length ? <InfoRow icon="google-classroom" label="Turmas" value={user.turmas.join(', ')} /> : null}
          {user.role === 'responsavel' || user.role === 'aluno' ? (
            <InfoRow icon="account-child-outline" label={user.role === 'aluno' ? 'Matrícula' : 'Alunos'} value={user.role === 'aluno' ? (students[0]?.registration ?? '') : students.map((s) => s.name).join(', ')} last />
          ) : (
            <InfoRow icon="shield-account-outline" label="Perfil" value={ROLE_LABEL[user.role]} last />
          )}
        </Card>

        <SectionTitle>Privacidade</SectionTitle>
        <Card style={{ gap: space.sm }}>
          <Text style={[type.body, { color: color.text }]}>
            Seus dados e os do aluno só aparecem para perfis autorizados: o próprio aluno, os responsáveis vinculados e a equipe da escola conforme a função de cada um (LGPD).
          </Text>
          <Text style={[type.bodySm, { color: color.muted }]}>
            Nesta versão de demonstração, os dados ficam salvos apenas neste aparelho.
          </Text>
        </Card>

        <View style={{ gap: space.md, marginTop: space.sm }}>
          <Button
            label="Sair"
            icon="logout"
            variant="outlined"
            onPress={() => {
              logout();
              router.replace('/login');
            }}
            full
          />
          <Button
            label="Restaurar dados de demonstração"
            icon="restore"
            variant="dangerOutlined"
            onPress={() =>
              confirm('Restaurar dados?', 'Todos os avisos, pedidos e mensagens criados nesta demonstração serão apagados.', () => {
                resetDemo();
                snack('Dados de demonstração restaurados.');
              })
            }
            full
          />
        </View>
      </Screen>
    </>
  );
}
