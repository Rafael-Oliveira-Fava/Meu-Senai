import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { FadeIn } from '../../../components/motion';
import { TicketRow } from '../../../components/rows';
import { AppBar, Chip, ChipRow, EmptyState, Fab } from '../../../components/ui';
import { isStaff, ticketHandledBy, visibleTickets } from '../../../data/access';
import { useStore, useUser } from '../../../data/store';
import { color, space } from '../../../theme';

type Filter = 'abertos' | 'recebidos' | 'enviados' | 'encerrados';

export default function Suporte() {
  const { db } = useStore();
  const user = useUser();
  const staff = isStaff(user);
  const [filter, setFilter] = useState<Filter>(staff ? 'recebidos' : 'abertos');
  const all = visibleTickets(db, user);

  const list = all.filter((t) => {
    if (filter === 'encerrados') return t.status === 'encerrado';
    if (t.status === 'encerrado') return false;
    if (filter === 'recebidos') return ticketHandledBy(user, t);
    if (filter === 'enviados') return t.createdById === user.id;
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <AppBar title="Central de suporte" subtitle={staff ? 'Mensagens das famílias e alunos' : 'Dúvidas para secretaria, coordenação, professores e direção'} back={false} />
      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: space.lg, gap: space.md, paddingBottom: 120, width: '100%', maxWidth: 672, alignSelf: 'center' }}
        ListHeaderComponent={
          <ChipRow>
            {staff ? (
              <>
                <Chip label="Recebidas" selected={filter === 'recebidos'} onPress={() => setFilter('recebidos')} />
                <Chip label="Enviadas" selected={filter === 'enviados'} onPress={() => setFilter('enviados')} />
              </>
            ) : (
              <Chip label="Em andamento" selected={filter === 'abertos'} onPress={() => setFilter('abertos')} />
            )}
            <Chip label="Encerradas" selected={filter === 'encerrados'} onPress={() => setFilter('encerrados')} />
          </ChipRow>
        }
        renderItem={({ item, index }) => (
          <FadeIn index={index}>
            <TicketRow db={db} ticket={item} user={user} />
          </FadeIn>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="chat-question-outline"
            title={filter === 'encerrados' ? 'Nenhuma conversa encerrada' : staff && filter === 'recebidos' ? 'Nenhuma mensagem recebida' : 'Nenhuma solicitação aberta'}
            text="Escolha o setor certo e envie sua dúvida. Você acompanha a resposta aqui, com número de protocolo."
            action={{ label: 'Nova solicitação', onPress: () => router.push('/suporte/novo') }}
          />
        }
      />
      <Fab label="Nova solicitação" icon="message-plus-outline" onPress={() => router.push('/suporte/novo')} />
    </View>
  );
}
