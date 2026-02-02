
export interface EnvironmentData {
    temperature: number;
    humidity: number;
    lastUpdated: string;
}

// Mock service for now - mimicking Tuya response structure
export const environmentService = {
    async getEnvironmentData(): Promise<EnvironmentData | null> {
        try {
            // Simulator: Randomize slightly around target values
            // Temp ~ 24°C, Humidity ~ 60%
            const temp = 23 + Math.random() * 2;
            const humidity = 58 + Math.random() * 5;

            return {
                temperature: parseFloat(temp.toFixed(1)),
                humidity: Math.floor(humidity),
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching environment data:', error);
            return null;
        }
    }
};
