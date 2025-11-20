const baileys = require('@adiwajshing/baileys');
const { DisconnectReason, useMultiFileAuthState } = baileys;

let socketPromise = null;

async function getSocket() {
  if (socketPromise) return socketPromise;

  socketPromise = (async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = baileys.default({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        console.log('QR gerado; escaneie para logar no WhatsApp.');
      }
      if (connection === 'open') {
        console.log('WhatsApp conectado:', sock.user?.id || sock.authState?.creds?.me?.id);
      }
      if (connection === 'close') {
        const shouldReconnect =
          update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          socketPromise = null;
        }
      }
    });

    return sock;
  })();

  return socketPromise;
}

async function sendWhatsAppMessage(message) {
  if (!process.env.WHATSAPP_NUMBER) {
    console.warn('WHATSAPP_NUMBER nao configurado. Mensagem nao enviada.');
    return;
  }
  const sock = await getSocket();
  const meId = sock?.user?.id || sock?.authState?.creds?.me?.id;
  if (!meId) {
    console.warn('WhatsApp nao autenticado (escaneie o QR). Mensagem nao enviada.');
    return;
  }
  const jid = `${process.env.WHATSAPP_NUMBER}@s.whatsapp.net`;
  console.log(`Enviando WhatsApp para ${jid}`);
  await sock.sendMessage(jid, { text: message });
}

async function sendWhatsAppAlert({ temp, status, timestamp }) {
  const message = `Alerta: ${temp}C (${status}) em ${timestamp}`;
  await sendWhatsAppMessage(message);
}

async function sendManualMessage(message) {
  await sendWhatsAppMessage(message);
}

module.exports = { sendWhatsAppAlert, sendManualMessage };
