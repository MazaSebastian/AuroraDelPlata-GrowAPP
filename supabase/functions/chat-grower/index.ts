import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const taskTools = [
    {
        function_declarations: [
            {
                name: "create_task",
                description: "Crea una nueva tarea en el calendario de cultivo. Úsalo cuando el usuario quiera agendar algo, recordar algo o registrar una acción futura.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        title: {
                            type: "STRING",
                            description: "Título corto de la tarea (ej: 'Regar plantas', 'Poda apical', 'Comprar sustrato')"
                        },
                        description: {
                            type: "STRING",
                            description: "Detalles adicionales de la tarea"
                        },
                        due_date: {
                            type: "STRING",
                            description: "Fecha de vencimiento en formato ISO YYYY-MM-DD. Si el usuario dice 'mañana', calcula la fecha correcta."
                        },
                        type: {
                            type: "STRING",
                            description: "Tipo de tarea.",
                            enum: ["riego", "fertilizar", "poda_apical", "entrenamiento", "defoliacion", "esquejes", "info", "warning"]
                        }
                    },
                    required: ["title"]
                }
            }
        ]
    }
];

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { message, history, image } = await req.json();

        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

        // Initialize Supabase Client with user context (Forward Authorization header)
        const authHeader = req.headers.get('Authorization');
        const supabase = createClient(
            SUPABASE_URL ?? '',
            SUPABASE_ANON_KEY ?? '',
            { global: { headers: { Authorization: authHeader || '' } } }
        );

        // Prepare context/system prompt
        const systemPrompt = `Eres el "Master Grower" de Aurora Del Plata, un asistente experto en el cultivo de cannabis.
    Ayuda a gestionar el cultivo y agenda tareas usando las herramientas disponibles cuando sea necesario.
    Si el usuario pide que le recuerdes algo o que agendes una acción, USA LA HERRAMIENTA 'create_task'.
    Responde de manera concisa.`;

        let contents = [];

        // Add history (Simplified)
        if (history && Array.isArray(history) && history.length > 0) {
            history.forEach((msg: any) => {
                if (msg.role === 'user' || msg.role === 'model') {
                    contents.push({
                        role: msg.role,
                        parts: [{ text: msg.content }]
                    });
                }
            });
        }

        // Add current user message
        const userParts: any[] = [{ text: systemPrompt + "\n\nUser Query: " + message }];
        if (image) {
            const matches = image.match(/^data:(.+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                userParts.push({
                    inline_data: { mime_type: matches[1], data: matches[2] }
                });
            }
        }
        contents.push({ role: 'user', parts: userParts });

        // --- FIRST CALL TO GEMINI ---
        const firstResponse = await callGemini(contents, taskTools);
        const firstCandidate = firstResponse.candidates?.[0];

        let finalReply = firstCandidate?.content?.parts?.[0]?.text || "";
        const functionCall = firstCandidate?.content?.parts?.[0]?.functionCall;

        // --- HANDLE FUNCTION CALL ---
        if (functionCall) {
            console.log("Function Call Detected:", functionCall.name);

            if (functionCall.name === "create_task") {
                const args = functionCall.args;

                // Execute Database Action
                const { data, error } = await supabase
                    .from('chakra_tasks')
                    .insert([{
                        title: args.title,
                        description: args.description || '',
                        type: args.type || 'info',
                        due_date: args.due_date, // AI should provide YYYY-MM-DD
                        status: 'pending',
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                let functionResult;
                if (error) {
                    console.error("DB Error:", error);
                    functionResult = { error: `Error creando tarea: ${error.message}` };
                } else {
                    functionResult = { success: true, task_id: data.id, message: "Tarea creada correctamente." };
                }

                // --- SECOND CALL TO GEMINI (With Result) ---

                // 1. Add the assistant's function call message to history
                contents.push({
                    role: 'model',
                    parts: [{ functionCall: functionCall }]
                });

                // 2. Add the function response to history
                contents.push({
                    role: 'function',
                    parts: [{
                        functionResponse: {
                            name: "create_task",
                            response: { content: functionResult }
                        }
                    }]
                });

                // 3. Call Gemini again to generate natural language confirmation
                const secondResponse = await callGemini(contents, taskTools); // Tools optional here but good to keep
                finalReply = secondResponse.candidates?.[0]?.content?.parts?.[0]?.text || "Tarea creada.";
            }
        }

        return new Response(
            JSON.stringify({ reply: finalReply }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});

async function callGemini(contents: any[], tools?: any[]) {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const payload: any = {
        contents: contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
    };

    if (tools) {
        payload.tools = tools;
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }
    );

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error: ${errText}`);
    }

    return await response.json();
}
