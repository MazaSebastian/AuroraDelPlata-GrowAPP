export default async function handler(request, response) {
    // Allow all origins
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }

    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { title, message } = request.body || {};

    // TELEGRAM CONFIGURATION
    const BOT_TOKEN = "8599613524:AAHfQlPMy9dXTwLPBSIyQHh5rm45alpg-Jw";

    // Lista de IDs: [Sebastian, Santiago (Pendiente), Otros...]
    const CHAT_IDS = [
        "870522507", // Sebastian
        "1692599686" // Santiago
    ];

    if (!title && !message) {
        return response.status(400).json({ error: 'Missing title or message' });
    }

    try {
        const text = `🌿 *${title}*\n\n${message}`;
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        // Enviar a todos los destinatarios en paralelo
        const sendPromises = CHAT_IDS.map(chatId =>
            fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            })
        );

        await Promise.all(sendPromises);

        return response.status(200).json({ success: true, platform: 'telegram', recipients: CHAT_IDS.length });

    } catch (error) {
        console.error("Handler Error:", error);
        return response.status(500).json({ error: error.message });
    }
}
