import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { NoticeRow } from '../../../components/rows';
import { AppBar, Chip, ChipRow, EmptyState, Fab } from '../../../components/ui';
import { canPublish, visibleNotices } from '../../../data/access';
import { isUnread, needsAck } from '../../../data/selectors';
import { useStore, useUser } from '../../../data/store';
import { color, space } from '../../../theme';

type Filter = 'todos' | 'naoLidos' | 'individuais' | 'gerais' | 'meus';

export default function Avisos() {
  const { db } = useStore();
  const user = useUser();
  const [filter, setFilter] = useState<Filter>('todos');
  const staff = canPublish(user);
  const all = useMemo(() => visibleNotices(db, user), [db, user]);

  const list = all.filter((n) => {
    if (filter === 'naoLidos') return isUnread(n, user) || needsAck(n, user);
    if (filter === 'individuais') return n.audience.kind === 'individual';
    if (filter === 'gerais') return n.audience.kind !== 'individual';
    if (filter === 'meus') return n.authorId === user.id;
    return true;
  });
  const unread = all.filter((n) => isUnread(n, user)).length;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <AppBar title="Avisos" subtitle={unread ? `${unread} não ${unread === 1 ? 'lido' : 'lidos'}` : 'Tudo em dia'} back={false} />
      <FlatList
        data={list}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 120, width: '100%', maxWidth: 672, alignSelf: 'center' }}
        ListHeaderComponent={
          <ChipRow>
            <Chip label="Todos" selected={filter === 'todos'} onPress={() => setFilter('todos')} />
            <Chip label="Não lidos" selected={filter === 'naoLidos'} onPress={() => setFilter('naoLidos')} count={filter === 'naoLidos' ? undefined : unread} />
            <Chip label="Individuais" selected={filter === 'individuais'} onPress={() => setFilter('individuais')} />
            <Chip label="Gerais" selected={filter === 'gerais'} onPress={() => setFilter('gerais')} />
            {staff ? <Chip label="Enviados por mim" selected={filter === 'meus'} onPress={() => setFilter('meus')} /> : null}
          </ChipRow>
        }
        renderItem={({ item, index }) => (
          <FadeIn index={index}>
            <NoticeRow db={db} user={user} notice={item} />
          </FadeIn>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={filter === 'naoLidos' ? 'check-all' : 'bullhorn-outline'}
            title={filter === 'naoLidos' ? 'Você leu tudo' : 'Nada por aqui'}
            text={filter === 'naoLidos' ? 'Novos comunicados e avisos aparecem aqui e no sino da tela inicial.' : 'Troque o filtro para ver outros comunicados.'}
            action={filter !== 'todos' ? { label: 'Ver todos', onPress: () => setFilter('todos') } : undefined}
          />
        }
      />
      {staff ? <Fab label="Novo aviso" icon="plus" onPress={() => router.push('/aviso/novo')} /> : null}
    </View>
  );
}
