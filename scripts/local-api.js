
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const TUYA_ACCESS_ID = process.env.TUYA_ACCESS_ID;
const TUYA_SECRET = process.env.TUYA_ACCESS_SECRET;
const TUYA_ENDPOINT = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaus.com';

const context = new TuyaContext({
    baseUrl: TUYA_ENDPOINT,
    accessKey: TUYA_ACCESS_ID,
    secretKey: TUYA_SECRET,
});

app.all('/api/tuya', async (req, res) => {
    // Replicate logic from api/tuya.js
    // We can't import api/tuya.js directly if it uses specific Vercel export syntax (export default)
    // So we replicate the logic here for the local proxy.

    console.log(`[Local API] ${req.method} /api/tuya`, req.query);

    try {
        const { action } = req.query;

        if (req.method === 'GET' && action === 'get_devices') {
            const userId = process.env.TUYA_USER_UID;
            if (!userId) {
                return res.status(400).json({ error: 'TUYA_USER_UID is required to fetch devices.' });
            }

            const response = await context.request({
                method: 'GET',
                path: `/v1.0/users/${userId}/devices`,
            });

            if (!response.success) {
                console.error("Tuya API Error:", response);
                throw new Error(response.msg || 'Tuya API Error');
            }

            return res.status(200).json({ success: true, devices: response.result });
        }

        if (req.method === 'GET' && action === 'get_logs') {
            const { deviceId, start_time, end_time, type } = req.query;

            // Default time range if not provided: last 24h
            const now = new Date().getTime();
            const start = start_time || (now - 24 * 60 * 60 * 1000);
            const end = end_time || now;

            console.log(`[Local API] Fetching logs for ${deviceId} from ${start} to ${end}`);

            const response = await context.request({
                method: 'GET',
                path: `/v1.0/devices/${deviceId}/logs?start_time=${start}&end_time=${end}&type=${type || 7}&size=100`,
            });

            if (!response.success) {
                console.error("Tuya API Error Logs:", response);
                // Don't throw, just return empty or error
                return res.status(200).json({ success: false, logs: [], msg: response.msg });
            }
            return res.status(200).json({ success: true, logs: response.result });
        }

        if (req.method === 'POST') {
            const { deviceId, commands } = req.body;

            if (!deviceId || !commands) {
                return res.status(400).json({ error: 'Missing deviceId or commands' });
            }

            const response = await context.request({
                method: 'POST',
                path: `/v1.0/devices/${deviceId}/commands`,
                body: { commands }
            });

            if (!response.success) {
                console.error("Tuya API Error Command:", response);
                throw new Error(response.msg || 'Tuya API Error Command');
            }

            return res.status(200).json({ success: true, result: response.result });
        }

        return res.status(404).json({ error: 'Action not found' });

    } catch (error) {
        console.error('Tuya Handler Error:', error);
        return res.status(500).json({
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Local Tuya API proxy running on http://localhost:${PORT}`);
});
