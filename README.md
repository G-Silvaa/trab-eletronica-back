# ESP32 Temperature API

Backend simples em Node.js/Express para registrar temperatura do ESP32, armazenar a leitura atual e historico, e disparar alertas via E-mail (Nodemailer) e WhatsApp (Baileys).

## Rotas
- POST /temperatura — recebe a leitura { temp, status? }, salva atual e historico; dispara alerta se temp > TEMP_LIMIT.
- GET /temperatura/atual — retorna leitura mais recente.
- GET /temperatura/historico — retorna lista de leituras registradas.
- POST /alerta/email — envia e-mail manual com { subject?, message }.
- POST /alerta/whatsapp — envia mensagem manual com { message }.
- GET /status — healthcheck com uptime.

## Setup rapido
1. Crie o .env (veja .env.example).
2. Instale dependencias: `npm install`.
3. Rode em dev: `npm run dev` (precisa do nodemon instalado) ou producao: `npm start`.
4. Acesse a doc visual: `http://localhost:3000/docs` (Swagger UI).

## Variaveis de ambiente
- EMAIL_USER, EMAIL_PASS - credenciais SMTP (ex.: Gmail). O mesmo e-mail e usado como remetente e destinatario.
- WHATSAPP_NUMBER - numero no formato E.164 (ex.: 5511999999999) para enviar mensagens.
- TEMP_LIMIT - limite de temperatura para disparar alertas (padrao 30).
- PORT - porta HTTP (padrao 3000).

## Notas de integracao
- Armazenamento atual e em memoria. Para persistir, substitua `currentReading` e `history` por acesso a banco/SQLite.
- Baileys salva credenciais em ./auth na primeira conexao. O QR code aparece no terminal; leia com o WhatsApp do numero configurado.
- Os envios de alerta sao "fire-and-forget"; erros sao logados no console.
