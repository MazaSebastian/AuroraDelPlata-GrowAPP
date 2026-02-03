
import { TuyaContext } from '@tuya/tuya-connector-nodejs';

const TUYA_ACCESS_ID = process.env.TUYA_ACCESS_ID;
const TUYA_SECRET = process.env.TUYA_ACCESS_SECRET;
const TUYA_ENDPOINT = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaus.com'; // Default to US

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!TUYA_ACCESS_ID || !TUYA_SECRET) {
        return res.status(500).json({ error: 'Missing Tuya Credentials in Environment' });
    }

    const context = new TuyaContext({
        baseUrl: TUYA_ENDPOINT,
        accessKey: TUYA_ACCESS_ID,
        secretKey: TUYA_SECRET,
    });

    try {
        const { action } = req.query;

        if (req.method === 'GET' && action === 'get_devices') {
            // Retrieve devices. 
            // If user_uid is provided, list devices for that user.
            // Otherwise, we might need to list all devices in the project (if possible via simple API)
            // However, Tuya API usually requires a user_id or device_ids.
            // We'll use the generic user UID from env if available.
            const userId = process.env.TUYA_USER_UID;

            if (!userId) {
                // If no user ID, try to get all devices (project level - restricted strictly)
                // Better to just error out for now or assume a specific flow.
                // Or we can try getting devices linked to the app account.
                // Simple approach: Use `GET /v1.0/users/{uid}/devices`
                return res.status(400).json({ error: 'TUYA_USER_UID is required to fetch devices.' });
            }

            const response = await context.request({
                method: 'GET',
                path: `/v1.0/users/${userId}/devices`,
            });

            if (!response.success) {
                throw new Error(response.msg || 'Tuya API Error');
            }

            return res.status(200).json({ success: true, devices: response.result });
        }

        if (req.method === 'GET' && action === 'get_logs') {
            const { deviceId, start_time, end_time, type } = req.query;
            const response = await context.request({
                method: 'GET',
                path: `/v1.0/devices/${deviceId}/logs?start_time=${start_time}&end_time=${end_time}&type=${type || 7}&size=100`, // Type 7 = all? Usually 1=event, 7=report
            });
            return res.status(200).json({ success: response.success, logs: response.result });
        }

        if (req.method === 'POST') {
            const { deviceId, commands } = req.body; // commands: [{ code: 'switch_1', value: true }]

            if (!deviceId || !commands) {
                return res.status(400).json({ error: 'Missing deviceId or commands' });
            }

            // Execute command
            // POST /v1.0/devices/{device_id}/commands
            const response = await context.request({
                method: 'POST',
                path: `/v1.0/devices/${deviceId}/commands`,
                body: { commands }
            });

            if (!response.success) {
                throw new Error(response.msg || 'Tuya API Error Command');
            }

            return res.status(200).json({ success: true, result: response.result });
        }

        return res.status(404).json({ error: 'Action not found' });

    } catch (error) {
        console.error('Tuya Handler Error:', error);
        return res.status(500).json({
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
}
