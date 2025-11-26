const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('../docs/swagger.json');
const emailService = require('./services/email');


const app = express();
const PORT = process.env.PORT || 3000;
const TEMP_LIMIT = parseFloat(process.env.TEMP_LIMIT || '30');

let currentReading = null; 
const history = [];

app.use(cors());
app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
app.use(express.static(path.join(__dirname, '..', 'public')));

function deriveStatus(temp, providedStatus) {
  if (providedStatus) return providedStatus;
  if (Number.isNaN(temp)) return 'desconhecido';
  if (temp >= TEMP_LIMIT) return 'alto';
  if (temp >= TEMP_LIMIT - 5) return 'moderado';
  return 'normal';
}

app.post('/temperatura', async (req, res) => {
  try {
    const { temp, status } = req.body || {};
    if (typeof temp !== 'number') {
      return res.status(400).json({ error: 'Campo \"temp\" numerico e obrigatorio.' });
    }

    const timestamp = new Date().toISOString();
    const entry = {
      temp,
      status: deriveStatus(temp, status),
      timestamp,
    };

    currentReading = entry;
    history.push({ temp: entry.temp, status: entry.status, timestamp: entry.timestamp });

    
    if (temp > TEMP_LIMIT) {
      emailService
        .sendTemperatureAlert(entry)
        .catch((err) => console.error('Falha ao enviar alerta de e-mail:', err.message));
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

app.get('/temperatura/atual', (req, res) => {
  if (!currentReading) {
    return res.status(404).json({ error: 'Nenhuma leitura recebida ainda.' });
  }
  return res.json(currentReading);
});

app.get('/temperatura/historico', (req, res) => {
  return res.json(history);
});

app.post('/alerta/email', async (req, res) => {
  try {
    const { subject = 'Alerta de Temperatura', message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Campo \"message\" eh obrigatorio.' });
    }
    await emailService.sendManualEmail({ subject, message });
    return res.json({ sent: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao enviar e-mail' });
  }
});

app.post('/alerta/whatsapp', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Campo \"message\" eh obrigatorio.' });
    }
   
    return res.status(501).json({ error: 'WhatsApp desativado' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro ao enviar WhatsApp (desativado)' });
  }
});

app.get('/status', (req, res) => {
  return res.json({ api: 'online', uptime: Math.floor(process.uptime()) });
});

app.get('/', (req, res) => {
  return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((req, res) => {
  return res.status(404).json({ error: 'Rota nao encontrada' });
});

app.listen(PORT, () => {
  console.log(`API ouvindo na porta ${PORT}`);
});
