
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
require('dotenv').config();

const context = new TuyaContext({
    baseUrl: process.env.TUYA_ENDPOINT,
    accessKey: process.env.TUYA_ACCESS_ID,
    secretKey: process.env.TUYA_ACCESS_SECRET,
});

async function testTuya() {
    console.log("Testing Tuya connection...");
    console.log("Endpoint:", process.env.TUYA_ENDPOINT);
    console.log("User UID:", process.env.TUYA_USER_UID);

    try {
        // Fetch devices for the user
        const response = await context.request({
            method: 'GET',
            path: `/v1.0/users/${process.env.TUYA_USER_UID}/devices`,
        });

        if (!response.success) {
            console.error("Tuya API Error:", response);
            return;
        }

        console.log("Successfully fetched devices!");
        console.log("Device Count:", response.result.length);

        response.result.forEach(device => {
            console.log(`- [${device.online ? 'ONLINE' : 'OFFLINE'}] ${device.name} (ID: ${device.id})`);
            console.log(`  Product: ${device.product_name}`);
            console.log(`  Status:`, JSON.stringify(device.status));
        });

    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testTuya();
