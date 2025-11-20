const nodemailer = require('nodemailer');

const missingCreds = !process.env.EMAIL_USER || !process.env.EMAIL_PASS;

// Basic Gmail transport. Adjust host/port if you use another provider.
const transporter = missingCreds
  ? null
  : nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

function buildAlertHtml({ temp, status, timestamp }) {
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; padding: 24px; color: #e2e8f0;">
    <div style="max-width: 520px; margin: 0 auto; background: linear-gradient(135deg, #111827 0%, #0b1220 100%); border: 1px solid #1e293b; border-radius: 14px; box-shadow: 0 18px 40px rgba(0,0,0,0.35); overflow: hidden;">
      <div style="padding: 20px 24px; border-bottom: 1px solid #1e293b; display: flex; align-items: center; gap: 12px;">
        <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(145deg,#6366f1,#a855f7); display: grid; place-items: center; color: #0f172a; font-weight: 800; letter-spacing: -0.02em;">°C</div>
        <div>
          <div style="font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em;">Alerta de Temperatura</div>
          <div style="font-size: 18px; color: #e2e8f0; font-weight: 700;">${temp}°C – ${status}</div>
        </div>
      </div>
      <div style="padding: 22px 24px;">
        <div style="margin-bottom: 12px; font-size: 15px; color: #cbd5e1;">
          Detectamos uma leitura acima do limite definido.
        </div>
        <table role="presentation" style="width:100%; border-collapse: collapse; color: #e2e8f0; font-size: 14px;">
          <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Temperatura</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700;">${temp}°C</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Status</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; text-transform: capitalize;">${status}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Horário (UTC)</td>
            <td style="padding: 10px 0; text-align: right;">${timestamp}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding: 14px 16px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; color: #c7d2fe; font-size: 13px;">
          Ajuste o limite ou verifique o sensor se este alerta não era esperado.
        </div>
      </div>
      <div style="padding: 14px 24px; border-top: 1px solid #1e293b; color: #94a3b8; font-size: 12px; text-align: center;">
        Este é um aviso automático do monitor de temperatura.
      </div>
    </div>
  </div>
  `;
}

async function sendMail({ subject, message, html }) {
  if (!transporter) {
    console.warn('E-mail nao configurado (.env ausente). Mensagem nao enviada.');
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject,
    text: message,
    html,
  });
}

async function sendTemperatureAlert({ temp, status, timestamp }) {
  const subject = `Alerta de Temperatura: ${temp}C (${status})`;
  const message = `Temperatura atual: ${temp}C\nStatus: ${status}\nMomento: ${timestamp}`;
  const html = buildAlertHtml({ temp, status, timestamp });
  await sendMail({ subject, message, html });
}

async function sendManualEmail({ subject, message }) {
  await sendMail({ subject, message });
}

module.exports = { sendTemperatureAlert, sendManualEmail };
