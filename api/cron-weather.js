export default async function handler(request, response) {
    // SECURITY: Vercel Cron Jobs send a specific header. 
    // We can also allow manual testing if needed, but in production, we might want to restrict this.
    // For now, open access is fine since it just sends a weather report.

    // TELEGRAM CONFIGURATION
    const BOT_TOKEN = "8599613524:AAHfQlPMy9dXTwLPBSIyQHh5rm45alpg-Jw";
    const CHAT_IDS = [
        "870522507", // Sebastian
        "1692599686" // Santiago
    ];

    // WEATHER CONFIGURATION (Munro/Olivos)
    const LAT = -34.5175;
    const LON = -58.5331;

    try {
        // 1. Fetch Weather (Forecast for 4 days to see 48h ahead)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=America%2FArgentina%2FBuenos_Aires&forecast_days=4`;

        const weatherRes = await fetch(weatherUrl);
        const weatherData = await weatherRes.json();

        if (!weatherData || !weatherData.daily) {
            throw new Error("Failed to fetch weather data");
        }

        // Today's Forecast
        const today = {
            max: Math.round(weatherData.daily.temperature_2m_max[0]),
            min: Math.round(weatherData.daily.temperature_2m_min[0]),
            rain: weatherData.daily.precipitation_sum[0],
            code: weatherData.daily.weathercode[0]
        };

        // 48h Forecast (Index 2 -> Today + 2 days)
        const forecast48h = {
            date: weatherData.daily.time[2],
            rain: weatherData.daily.precipitation_sum[2],
            code: weatherData.daily.weathercode[2]
        };

        // Interpret Code (Simplified WMO)
        const getCondition = (code) => {
            if (code > 95) return "Tormenta Eléctrica ⚡";
            if (code > 80) return "Tormenta ⛈️";
            if (code > 60) return "Lluvia 🌧️";
            if (code > 50) return "Llovizna 💧";
            if (code > 45) return "Niebla 🌫️";
            if (code > 3) return "Nublado ☁️";
            return "Despejado ☀️";
        };

        const todayCondition = getCondition(today.code);

        // Calculate Preventive Warning
        // Trigger if rain > 2mm OR if code indicates significant storm/rain
        let warningMessage = "";
        const isRainy48h = forecast48h.rain >= 2.0 || forecast48h.code >= 60;

        if (isRainy48h) {
            // Get day name (e.g., "Miércoles")
            const dateObj = new Date(forecast48h.date + 'T00:00:00'); // Prevent timezone shift
            const dayName = dateObj.toLocaleDateString('es-AR', { weekday: 'long' });
            const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);

            warningMessage = `
⚠️ *ALERTA TEMPRANA (48hs)*
Se esperan lluvias (${forecast48h.rain}mm) para el *${dayNameCap}*.
¡Toma los recaudos necesarios! ☔
            `.trim();
        }

        // 2. Format Message
        const message = `
📅 *Pronóstico de Hoy*

${todayCondition}
🌡️ *Máx:* ${today.max}°C  |  *Mín:* ${today.min}°C
💧 *Lluvia:* ${today.rain} mm

${warningMessage}

_¡Buenos días! Que tengas una excelente jornada en la huerta._ 🌱
        `.trim();

        // 3. Send to Telegram
        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const sendPromises = CHAT_IDS.map(chatId =>
            fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            })
        );

        await Promise.all(sendPromises);

        return response.status(200).json({ success: true, weather: condition });

    } catch (error) {
        console.error("Cron Error:", error);
        return response.status(500).json({ error: error.message });
    }
}
