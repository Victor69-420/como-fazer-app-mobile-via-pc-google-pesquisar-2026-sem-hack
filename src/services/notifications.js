// src/services/notifications.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const MESSAGES = [
  { title: '🔧 Hora de revisar seu carro!',          body: 'Módulos e sensores com até 22% OFF. Confira agora!' },
  { title: '⚡ Elétrica do seu carro em dia?',        body: 'Módulos de ignição e sensores MAP disponíveis. Acesse o catálogo!' },
  { title: '🛞 Freios em dia = segurança garantida',  body: 'Discos e pastilhas de alta performance. Compre já!' },
  { title: '🔋 Bateria fraca? A gente resolve!',      body: 'Baterias Moura 60Ah com 18 meses de garantia. Veja!' },
  { title: '💡 Ilumine seu caminho!',                 body: 'Kit LED H4 6000K — 8000 lúmens. Plug-and-play!' },
  { title: '⚙️ Motor pedindo socorro?',               body: 'Velas Iridium NGK e filtros Mahle. Melhor desempenho!' },
  { title: '❄️ Ar-condicionado parou de gelar?',      body: 'Compressores Valeo universais em estoque. Peça agora!' },
  { title: '🔩 Suspensão firme na estrada?',          body: 'Amortecedores Monroe com -18% OFF. Conforto garantido!' },
  { title: '🛒 Seu carrinho está esperando!',         body: 'Finalize sua compra antes que o estoque acabe!' },
  { title: '🏆 Qualidade premium ASR Eletrônica!',    body: 'As melhores peças com garantia de fábrica. Acesse já!' },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

export async function requestNotificationPermission() {
  if (!Device.isDevice) return false;
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

export async function scheduleRecurringNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // 10 notificações únicas — uma a cada 5 minutos
  for (let i = 0; i < MESSAGES.length; i++) {
    const msg = MESSAGES[i];
    await Notifications.scheduleNotificationAsync({
      content: {
        title: msg.title,
        body:  msg.body,
        sound: true,
        data:  { screen: 'Products' },
        ...(Platform.OS === 'android' && { channelId: 'asr-promos' }),
      },
      trigger: { seconds: (i + 1) * 5 * 60, repeats: false },
    });
  }

  // Notificação recorrente permanente a cada 5 minutos após as 10
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔧 ASR Eletrônica',
      body:  'Peças premium para seu carro com garantia e entrega rápida!',
      sound: true,
      data:  { screen: 'Products' },
      ...(Platform.OS === 'android' && { channelId: 'asr-promos' }),
    },
    trigger: { seconds: 5 * 60, repeats: true },
  });

  return true;
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.setBadgeCountAsync(0);
}

export async function sendTestNotification() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body:  msg.body,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'asr-promos' }),
    },
    trigger: null,
  });
}

export async function getScheduledCount() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length;
}