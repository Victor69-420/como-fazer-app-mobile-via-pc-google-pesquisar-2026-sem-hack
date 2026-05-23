// src/services/notifications.js
// Compatível com Expo Go SDK 54
// Usa notificações in-app (Alert) pois push foi removido do Expo Go no SDK 53+

import { Alert } from 'react-native';

const MESSAGES = [
  { title: '🔧 Hora de revisar seu carro!',        body: 'Módulos e sensores com até 22% OFF. Confira agora!' },
  { title: '⚡ Elétrica do seu carro em dia?',       body: 'Módulos de ignição e sensores MAP disponíveis!' },
  { title: '🛞 Freios em dia = segurança!',          body: 'Discos e pastilhas de alta performance. Compre já!' },
  { title: '🔋 Bateria fraca? A gente resolve!',     body: 'Baterias Moura 60Ah com 18 meses de garantia!' },
  { title: '💡 Ilumine seu caminho!',                body: 'Kit LED H4 6000K — 8000 lúmens. Plug-and-play!' },
  { title: '⚙️ Motor pedindo socorro?',              body: 'Velas Iridium NGK e filtros Mahle. Melhor desempenho!' },
  { title: '❄️ Ar-condicionado parou de gelar?',     body: 'Compressores Valeo universais em estoque. Peça agora!' },
  { title: '🔩 Suspensão firme na estrada?',         body: 'Amortecedores Monroe com -18% OFF. Conforto garantido!' },
  { title: '🛒 Seu carrinho está esperando!',        body: 'Finalize sua compra antes que o estoque acabe!' },
  { title: '🏆 Qualidade premium ASR Eletrônica!',   body: 'As melhores peças com garantia de fábrica. Acesse já!' },
];

let intervalId  = null;
let msgIndex    = 0;
let isActive    = false;
let _navigator  = null; // referência de navegação (opcional)

export function setNavigatorRef(ref) {
  _navigator = ref;
}

export function isNotificationsActive() {
  return isActive;
}

// Inicia notificações in-app a cada 5 minutos
export function scheduleRecurringNotifications() {
  if (intervalId) return true; // já rodando

  isActive  = true;
  msgIndex  = 0;

  // Primeira em 5 minutos
  intervalId = setInterval(() => {
    const msg = MESSAGES[msgIndex % MESSAGES.length];
    msgIndex++;

    Alert.alert(
      msg.title,
      msg.body,
      [
        { text: 'Ver Ofertas', style: 'default' },
        { text: 'Fechar',      style: 'cancel'  },
      ]
    );
  }, 5 * 60 * 1000); // 5 minutos

  return true;
}

export function cancelAllNotifications() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  isActive = false;
  msgIndex = 0;
}

export function sendTestNotification() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  Alert.alert(
    msg.title,
    msg.body,
    [
      { text: 'Ver Ofertas', style: 'default' },
      { text: 'Fechar',      style: 'cancel'  },
    ]
  );
  return true;
}

export function getScheduledCount() {
  return isActive ? 1 : 0;
}

export async function requestNotificationPermission() {
  return true; // Alert não precisa de permissão
}