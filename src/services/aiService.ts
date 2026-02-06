import { supabase } from './supabaseClient';

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    image?: string; // Base64 or URL
}

export const aiService = {
    async sendMessage(message: string, history: ChatMessage[] = [], imageBase64?: string, context?: { roomId?: string }): Promise<string> {
        if (!supabase) throw new Error("Supabase client not initialized");

        // Prepare history for API (we might need to limit length to avoid token limits in MVP)
        const recentHistory = history.slice(-10); // Keep last 10 messages

        const { data, error } = await supabase.functions.invoke('chat-grower', {
            body: { message, history: recentHistory, image: imageBase64, context }
        });

        if (error) {
            console.error('AI Service Error:', error);
            throw error;
        }

        return data?.reply || "Lo siento, no pude procesar tu solicitud.";
    }
};
