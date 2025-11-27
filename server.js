// Servidor backend para proteger la API key de OpenAI
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
// Railway asigna el PORT automáticamente, asegurarse de que sea un número entero
const PORT = parseInt(process.env.PORT || '3000', 10);

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

        console.log('📥 Request recibido:', { 
            hasMessage: !!message, 
            hasApiKey: !!apiKey,
            apiKeyLength: apiKey ? apiKey.length : 0,
            model 
        });

        if (!apiKey) {
            console.error('❌ API key no configurada');
            return res.status(500).json({ error: 'API key no configurada en el servidor' });
        }

        if (!message) {
            console.error('❌ Mensaje faltante');
            return res.status(400).json({ error: 'Mensaje requerido' });
        }

        // Construir mensajes para la API
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []),
            { role: 'user', content: message }
        ];

        // Llamar a OpenAI API
        console.log('🔄 Llamando a OpenAI API...');
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

        console.log('📡 Respuesta de OpenAI:', response.status, response.statusText);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error de OpenAI:', errorData);
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
        console.log('✅ Respuesta exitosa de OpenAI');

        res.json({ 
            response: botResponse,
            usage: data.usage 
        });

    } catch (error) {
        console.error('Error en /api/chat:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            error: 'Error interno del servidor', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
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

