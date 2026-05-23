// src/services/notifications.js
// ⚠️ Usa apenas notificações LOCAIS agendadas (compatível com Expo Go SDK 54)
// Notificações push remotas requerem development build

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const MESSAGES = [
  { title: '🔧 Hora de revisar seu carro!',           body: 'Módulos e sensores com até 22% OFF. Confira agora!' },
  { title: '⚡ Elétrica do seu carro em dia?',          body: 'Módulos de ignição e sensores MAP disponíveis. Acesse!' },
  { title: '🛞 Freios em dia = segurança garantida',    body: 'Discos e pastilhas de alta performance. Compre já!' },
  { title: '🔋 Bateria fraca? A gente resolve!',        body: 'Baterias Moura 60Ah com 18 meses de garantia!' },
  { title: '💡 Ilumine seu caminho!',                   body: 'Kit LED H4 6000K — 8000 lúmens. Plug-and-play!' },
  { title: '⚙️ Motor pedindo socorro?',                 body: 'Velas Iridium NGK e filtros Mahle. Melhor desempenho!' },
  { title: '❄️ Ar-condicionado parou de gelar?',        body: 'Compressores Valeo universais em estoque. Peça agora!' },
  { title: '🔩 Suspensão firme na estrada?',            body: 'Amortecedores Monroe com -18% OFF. Conforto garantido!' },
  { title: '🛒 Seu carrinho está esperando!',           body: 'Finalize sua compra antes que o estoque acabe!' },
  { title: '🏆 Qualidade premium ASR Eletrônica!',      body: 'As melhores peças com garantia de fábrica. Acesse já!' },
];

// Configurar exibição das notificações
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false, // false evita erro no Expo Go
  }),
});

// Pedir permissão (sem push token — apenas local)
export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('asr-promos', {
      name:             'ASR Promoções',
      importance:       Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#FF6B1A',
      sound:            true,
    });
  }

  return true;
}

// Agendar notificações locais a cada 5 minutos
export async function scheduleRecurringNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const channel = Platform.OS === 'android' ? { channelId: 'asr-promos' } : {};

  // Agendar as 10 mensagens, uma a cada 5 minutos
  for (let i = 0; i < MESSAGES.length; i++) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: MESSAGES[i].title,
        body:  MESSAGES[i].body,
        sound: true,
        data:  { screen: 'Products' },
        ...channel,
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: (i + 1) * 5 * 60,
        repeats: false,
      },
    });
  }

  // Notificação recorrente a cada 5 minutos (permanente)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔧 ASR Eletrônica',
      body:  'Peças premium para seu carro com garantia e entrega rápida!',
      sound: true,
      data:  { screen: 'Products' },
      ...channel,
    },
    trigger: {
      type:    Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5 * 60,
      repeats: true,
    },
  });

  return true;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Enviar notificação imediata para teste
export async function sendTestNotification() {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  const msg     = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const channel = Platform.OS === 'android' ? { channelId: 'asr-promos' } : {};

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body:  msg.body,
      sound: true,
      ...channel,
    },
    trigger: null, // imediata
  });
  return true;
}

export async function getScheduledCount() {
  const list = await Notifications.getAllScheduledNotificationsAsync();
  return list.length;
}