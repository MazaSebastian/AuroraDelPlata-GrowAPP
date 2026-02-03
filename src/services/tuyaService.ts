
import axios from 'axios';
import { supabase } from './supabaseClient';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocal ? 'http://localhost:3001/api/tuya' : '/api/tuya';

export interface DeviceSettings {
    device_id: string;
    min_temp?: number;
    max_temp?: number;
    min_hum?: number;
    max_hum?: number;
}

export interface TuyaDevice {
    id: string;
    name: string;
    product_name: string;
    category: string;
    online: boolean;
    status: {
        code: string;
        value: any;
    }[];
}

export const tuyaService = {
    async getDeviceSettings(deviceId: string): Promise<DeviceSettings | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('tuya_device_settings')
            .select('*')
            .eq('device_id', deviceId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching device settings:", error);
        }
        return data;
    },

    async saveDeviceSettings(settings: DeviceSettings) {
        if (!supabase) throw new Error("Supabase not initialized");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No authenticated user");

        const { error } = await supabase
            .from('tuya_device_settings')
            .upsert({ ...settings, user_id: user.id })
            .select();

        if (error) throw error;
    },

    async getDevices(): Promise<TuyaDevice[]> {
        // If we are in local dev without vercel dev, this might fail (404).
        // For now, we assume standardized Vercel deployment structure.
        try {
            const response = await axios.get(`${API_URL}?action=get_devices`);
            if (response.data.success) {
                return response.data.devices;
            }
            return [];
        } catch (error) {
            console.error("Error fetching Tuya devices:", error);
            throw error;
        }
    },

    async toggleDevice(deviceId: string, currentStatus: boolean, switchCode: string = 'switch_1') {
        try {
            // Toggle value
            const newValue = !currentStatus;
            const commands = [
                {
                    code: switchCode,
                    value: newValue
                }
            ];

            const response = await axios.post(API_URL, {
                deviceId,
                commands
            });

            return response.data;
        } catch (error) {
            console.error("Error toggling device:", error);
            throw error;
        }
    },

    async getDeviceLogs(deviceId: string, startTime?: number, endTime?: number) {
        try {
            const now = new Date().getTime();
            const start = startTime || (now - 7 * 24 * 60 * 60 * 1000); // Default 7 days
            const end = endTime || now;

            const response = await axios.get(`${API_URL}?action=get_logs&deviceId=${deviceId}&start_time=${start}&end_time=${end}&type=7`);
            return response.data.logs;
        } catch (error) {
            console.error("Error fetching logs:", error);
            return null; // Return null on error to handle gracefully
        }
    },

    // Flexible command sending
    async sendCommand(deviceId: string, commands: { code: string, value: any }[]) {
        try {
            const response = await axios.post(API_URL, {
                deviceId,
                commands
            });
            return response.data;
        } catch (error) {
            console.error("Error sending command:", error);
            throw error;
        }
    }
};
