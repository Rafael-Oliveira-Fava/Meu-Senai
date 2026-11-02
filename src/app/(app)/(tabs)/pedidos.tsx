import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { AuthorizationRow, CertificateRow } from '../../../components/rows';
import { AppBar, Button, Chip, ChipRow, EmptyState } from '../../../components/ui';
import { canRequestAuthorizationFromFamily, canRequestRelease, canSendCertificate, isFamily, visibleAuthorizations, visibleCertificates } from '../../../data/access';
import { pendingActions } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import type { Authorization, Certificate } from '../../../data/types';
import { color, space } from '../../../theme';

type Tab = 'autorizacoes' | 'atestados';
type Item = { kind: 'auth'; data: Authorization } | { kind: 'cert'; data: Certificate };

export default function Pedidos() {
  const { db } = useStore();
  const user = useUser();
  const [tab, setTab] = useState<Tab>('autorizacoes');
  const [onlyPending, setOnlyPending] = useState(false);
  const pending = pendingActions(db, user);

  const auths = visibleAuthorizations(db, user).filter((a) => !onlyPending || a.status === 'pendente');
  const certs = visibleCertificates(db, user).filter((c) => !onlyPending || c.status === 'pendente');
  const items: Item[] = tab === 'autorizacoes' ? auths.map((a) => ({ kind: 'auth', data: a })) : certs.map((c) => ({ kind: 'cert', data: c }));
  const canCreate = tab === 'autorizacoes' ? canRequestRelease(user) || canRequestAuthorizationFromFamily(user) : canSendCertificate(user);
  const createLabel = tab === 'autorizacoes' ? (isFamily(user) ? 'Pedir saída antecipada' : 'Pedir autorização à família') : 'Enviar atestado';
  const createHref = tab === 'autorizacoes' ? '/autorizacao/nova' : '/atestado/novo';

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <AppBar title="Pedidos" subtitle={pending.total ? `${pending.total} aguardando você` : 'Atestados e autorizações'} back={false} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.data.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: space.xxxl, width: '100%', maxWidth: 672, alignSelf: 'center' }}
        ListHeaderComponent={
          <View style={{ gap: space.md }}>
            <ChipRow>
              <Chip label="Autorizações" selected={tab === 'autorizacoes'} onPress={() => setTab('autorizacoes')} count={tab === 'autorizacoes' ? undefined : pending.auths.length} />
              <Chip label="Atestados" selected={tab === 'atestados'} onPress={() => setTab('atestados')} count={tab === 'atestados' ? undefined : pending.certs.length} />
              <Chip label="Só pendentes" icon="filter-variant" selected={onlyPending} onPress={() => setOnlyPending((v) => !v)} />
            </ChipRow>
            {canCreate ? <Button label={createLabel} icon="plus" variant="tonal" onPress={() => router.push(createHref)} full /> : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn index={index}>
            {item.kind === 'auth' ? <AuthorizationRow db={db} auth={item.data} user={user} /> : <CertificateRow db={db} cert={item.data} showStudent={!isFamily(user)} />}
          </FadeIn>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={tab === 'autorizacoes' ? 'file-sign' : 'medical-bag'}
            title={onlyPending ? 'Nada pendente' : tab === 'autorizacoes' ? 'Nenhuma autorização' : 'Nenhum atestado'}
            text={
              tab === 'autorizacoes'
                ? 'Pedidos de saída antecipada e autorizações para atividades aparecem aqui com a situação de cada um.'
                : 'Atestados médicos enviados pelos responsáveis aparecem aqui até serem analisados pela secretaria.'
            }
          />
        }
      />
    </View>
  );
}
