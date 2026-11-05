/**
 * AVISOS NO CELULAR (RF07) — quando chega uma notificação nova para o usuário,
 * ela também aparece na barra de notificações do celular (notificação local).
 *
 * Funciona enquanto o app está aberto ou em segundo plano (o app busca novidades
 * a cada 15 s). Com o app fechado de vez, só uma notificação push resolve: isso
 * exige um build próprio (EAS) e um serviço de push no servidor.
 * No navegador não faz nada: lá as notificações continuam só dentro do app.
 */
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useBanco } from '../dados/banco';

type Notificacoes = typeof import('expo-notifications');

export function AvisosNoCelular() {
  const { db, usuario } = useBanco();
  const modulo = useRef<Notificacoes | null>(null);
  const jaVistas = useRef<Set<string> | null>(null);

  // Prepara a biblioteca uma vez: permissão, canal do Android e toque na notificação.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let toque: { remove: () => void } | undefined;
    import('expo-notifications')
      .then(async (N) => {
        N.setNotificationHandler({
          handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
        });
        if (Platform.OS === 'android') {
          await N.setNotificationChannelAsync('avisos', { name: 'Avisos da escola', importance: N.AndroidImportance.HIGH });
        }
        const { granted } = await N.requestPermissionsAsync();
        if (!granted) return;
        // Tocar na notificação abre a tela certa (aviso, pedido, conversa...).
        toque = N.addNotificationResponseReceivedListener((r) => {
          const link = r.notification.request.content.data?.link;
          if (typeof link === 'string') router.push(link as Href);
        });
        modulo.current = N;
      })
      .catch((erro) => console.warn('Notificações no celular indisponíveis:', erro));
    return () => toque?.remove();
  }, []);

  // A cada atualização dos dados, mostra só as notificações que acabaram de chegar.
  useEffect(() => {
    if (!usuario) return;
    const minhas = db.notificacoes.filter((n) => n.usuarioId === usuario.id);
    if (!jaVistas.current) {
      // Primeira leitura: o que já existia não vira alerta no celular.
      jaVistas.current = new Set(minhas.map((n) => n.id));
      return;
    }
    for (const n of minhas) {
      if (jaVistas.current.has(n.id)) continue;
      jaVistas.current.add(n.id);
      if (n.lida || !modulo.current) continue;
      modulo.current
        .scheduleNotificationAsync({
          content: { title: n.titulo, body: n.texto, data: { link: n.link } },
          trigger: Platform.OS === 'android' ? { channelId: 'avisos' } : null,
        })
        .catch(() => {});
    }
  }, [db.notificacoes, usuario]);

  return null;
}
