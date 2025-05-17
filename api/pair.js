const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode');

const app = express();
const port = process.env.PORT || 3000;

let sock;
let qrCodeData = null;

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // terminal එකට print කරන්න නැහැ
        logger: pino({ level: 'fatal' }),
        browser: Browsers.macOS('Chrome'),
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // QR code එක generate කරලා base64 string එකක් සකසමු
            qrCodeData = await qrcode.toDataURL(qr);
            console.log('New QR code generated');
        }

        if (connection === 'open') {
            console.log('WhatsApp connection opened!');
            qrCodeData = null; // connected පස්සේ QR එක clear කරමු
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log('Connection closed. Reconnecting?', shouldReconnect);
            if (shouldReconnect) {
                startSock();
            } else {
                console.log('Session invalid, please delete auth_info folder and restart.');
            }
        }
    });
}

app.get('/qr', (req, res) => {
    if (qrCodeData) {
        // Browser එකට QR code image එක base64 ලෙස පෙන්වන්න
        res.send(`
            <html>
                <body style="text-align:center;">
                    <h2>Scan this QR code with WhatsApp</h2>
                    <img src="${qrCodeData}" />
                </body>
            </html>
        `);
    } else {
        res.send('No QR code available or already connected.');
    }
});

app.get('/start', async (req, res) => {
    if (!sock) {
        await startSock();
        res.send('Starting WhatsApp connection. Open /qr to scan QR code.');
    } else {
        res.send('WhatsApp socket already running. Open /qr to scan QR code.');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Open http://localhost:${port}/start to start the WhatsApp socket`);
});
