import { default as makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import pino from 'pino';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');
  
  const number = req.query.number;
  if (!number) return res.status(400).json({ error: 'number query parameter required' });
  
  const id = Date.now().toString();

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`./auth/${id}`);

    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' }))
      },
      printQRInTerminal: false,
      logger: pino({ level: 'fatal' }),
      browser: Browsers.macOS('Safari')
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        if (!res.writableEnded) {
          res.status(200).json({ code: qr });
        }
      }

      if (connection === 'open') {
        await saveCreds();
        await delay(2000);
        await sock.ws.close();
      }

      if (connection === 'close') {
        if (lastDisconnect.error?.output?.statusCode !== 401) {
          console.log('Connection closed unexpectedly');
        }
      }
    });
  } catch (err) {
    console.error(err);
    if (!res.writableEnded) res.status(500).json({ code: 'Error getting pair code, try again later.' });
  }
}
