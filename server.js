// Servidor backend para proteger la API key de OpenAI
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta public

// Ruta para procesar mensajes con OpenAI
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        const systemPrompt = process.env.SYSTEM_PROMPT || 'Eres un asistente de voz amigable y conversacional. Responde de manera natural, breve y en español. Mantén las respuestas concisas ya que serán leídas en voz alta.';

        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada en el servidor' });
        }

        if (!message) {
            return res.status(400).json({ error: 'Mensaje requerido' });
        }

        // Construir mensajes para la API
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []),
            { role: 'user', content: message }
        ];

        // Llamar a OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = 'Error al procesar la solicitud';
            
            if (response.status === 401) {
                errorMessage = 'API key inválida';
            } else if (response.status === 429) {
                errorMessage = 'Cuota excedida';
            } else if (response.status === 402 || response.status === 403) {
                errorMessage = 'Problema de facturación';
            }

            return res.status(response.status).json({ 
                error: errorMessage,
                details: errorData.error?.message 
            });
        }

        const data = await response.json();
        const botResponse = data.choices[0].message.content.trim();

        res.json({ 
            response: botResponse,
            usage: data.usage 
        });

    } catch (error) {
        console.error('Error en /api/chat:', error);
        res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Servir la aplicación en la ruta raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Asegúrate de tener configurado OPENAI_API_KEY en el archivo .env`);
});

