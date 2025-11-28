// ============================================
// SERVIDOR BACKEND - server.js
// Ubicación: raíz del proyecto
// Función: Servidor Express que protege la API key de OpenAI y maneja las peticiones
// ============================================

// Servidor backend para proteger la API key de OpenAI
const express = require('express'); // Framework web para Node.js
const cors = require('cors'); // Permite peticiones desde el frontend
const path = require('path'); // Manejo de rutas de archivos
const fetch = require('node-fetch'); // Para hacer peticiones HTTP a OpenAI
require('dotenv').config(); // Carga variables de entorno desde .env

const app = express();
// Railway asigna el PORT automáticamente, asegurarse de que sea un número entero
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware: Configuración del servidor
app.use(cors()); // Permite peticiones cross-origin desde el navegador
app.use(express.json()); // Parsea el cuerpo de las peticiones JSON
app.use(express.static('public')); // Sirve archivos estáticos (HTML, CSS, JS) desde la carpeta public

// ============================================
// ENDPOINT: /api/chat
// Función: Procesa mensajes del usuario y obtiene respuestas de OpenAI GPT
// ============================================
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationHistory, responseLanguage } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        
        // Mapeo de códigos de idioma a nombres
        const languageNames = {
            'es': 'español',
            'en': 'inglés',
            'fr': 'francés',
            'de': 'alemán',
            'it': 'italiano',
            'pt': 'portugués',
            'ja': 'japonés',
            'zh': 'chino',
            'ru': 'ruso'
        };
        
        const targetLanguage = responseLanguage || 'es';
        const languageName = languageNames[targetLanguage] || 'español';
        const systemPrompt = `Eres un asistente de voz amigable y conversacional. Responde de manera natural, breve y en ${languageName}. Mantén las respuestas concisas ya que serán leídas en voz alta.`;

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

// ============================================
// ENDPOINT: /api/translate
// Función: Traduce texto a un idioma específico usando OpenAI
// ============================================
app.post('/api/translate', async (req, res) => {
    try {
        const { text, targetLanguage } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada en el servidor' });
        }

        if (!text) {
            return res.status(400).json({ error: 'Texto requerido para traducir' });
        }

        // Mapeo de códigos de idioma a nombres
        const languageNames = {
            'es': 'español',
            'en': 'inglés',
            'fr': 'francés',
            'de': 'alemán',
            'it': 'italiano',
            'pt': 'portugués',
            'ja': 'japonés',
            'zh': 'chino',
            'ru': 'ruso'
        };

        const targetLang = targetLanguage || 'es';
        const languageName = languageNames[targetLang] || 'español';

        console.log(`🔄 Traduciendo a ${languageName}...`);

        // Usar OpenAI para traducir
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `Eres un traductor profesional. Traduce el texto proporcionado al ${languageName}. Solo devuelve la traducción, sin explicaciones adicionales.`
                    },
                    {
                        role: 'user',
                        content: `Traduce esto al ${languageName}: "${text}"`
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Error de OpenAI al traducir:', errorData);
            return res.status(response.status).json({ 
                error: 'Error al traducir',
                details: errorData.error?.message 
            });
        }

        const data = await response.json();
        const translation = data.choices[0].message.content.trim();
        console.log('✅ Traducción exitosa');

        res.json({ translation });

    } catch (error) {
        console.error('Error en /api/translate:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor', 
            details: error.message
        });
    }
});

// ============================================
// ENDPOINT: /api/translate-realtime
// Función: Traduce en tiempo real con detección automática de idioma
// ============================================
app.post('/api/translate-realtime', async (req, res) => {
    try {
        const { text, sourceLanguage, targetLanguage } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key no configurada en el servidor' });
        }

        if (!text) {
            return res.status(400).json({ error: 'Texto requerido para traducir' });
        }

        // Mapeo de códigos de idioma a nombres
        const languageNames = {
            'es': 'español',
            'en': 'inglés',
            'fr': 'francés',
            'de': 'alemán',
            'it': 'italiano',
            'pt': 'portugués',
            'ja': 'japonés',
            'zh': 'chino',
            'ru': 'ruso',
            'auto': 'detectar automáticamente'
        };

        const targetLang = targetLanguage || 'es';
        const sourceLang = sourceLanguage || 'auto';
        const targetLanguageName = languageNames[targetLang] || 'español';
        
        let detectedLanguage = sourceLang;
        let sourceLanguageName = languageNames[sourceLang] || 'detectar automáticamente';

        // Si el idioma de origen es 'auto', detectarlo primero
        if (sourceLang === 'auto') {
            console.log('🔍 Detectando idioma...');
            const detectResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'Eres un detector de idiomas. Analiza el texto y responde SOLO con el código de idioma ISO 639-1 (es, en, fr, de, it, pt, ja, zh, ru). Si no puedes detectarlo, responde "es".'
                        },
                        {
                            role: 'user',
                            content: `¿Qué idioma es este texto? "${text}"`
                        }
                    ],
                    temperature: 0.1,
                    max_tokens: 10
                })
            });

            if (detectResponse.ok) {
                const detectData = await detectResponse.json();
                detectedLanguage = detectData.choices[0].message.content.trim().toLowerCase();
                sourceLanguageName = languageNames[detectedLanguage] || detectedLanguage;
                console.log(`✅ Idioma detectado: ${sourceLanguageName} (${detectedLanguage})`);
            }
        }

        // Si el idioma detectado es el mismo que el objetivo, no traducir
        if (detectedLanguage === targetLang) {
            return res.json({ 
                translation: text,
                originalText: text,
                sourceLanguage: detectedLanguage,
                targetLanguage: targetLang,
                translated: false
            });
        }

        console.log(`🔄 Traduciendo de ${sourceLanguageName} a ${targetLanguageName}...`);

        // Traducir el texto
        const translateResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `Eres un traductor profesional. Traduce el texto del ${sourceLanguageName} al ${targetLanguageName}. Solo devuelve la traducción, sin explicaciones adicionales, sin comillas, sin prefijos.`
                    },
                    {
                        role: 'user',
                        content: `Traduce este texto del ${sourceLanguageName} al ${targetLanguageName}: "${text}"`
                    }
                ],
                temperature: 0.3,
                max_tokens: 300
            })
        });

        if (!translateResponse.ok) {
            const errorData = await translateResponse.json().catch(() => ({}));
            console.error('❌ Error de OpenAI al traducir:', errorData);
            return res.status(translateResponse.status).json({ 
                error: 'Error al traducir',
                details: errorData.error?.message 
            });
        }

        const translateData = await translateResponse.json();
        const translation = translateData.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        console.log('✅ Traducción en tiempo real exitosa');

        res.json({ 
            translation,
            originalText: text,
            sourceLanguage: detectedLanguage,
            targetLanguage: targetLang,
            translated: true
        });

    } catch (error) {
        console.error('Error en /api/translate-realtime:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor', 
            details: error.message
        });
    }
});

// ============================================
// ENDPOINT: /api/health
// Función: Verifica que el servidor está funcionando (health check)
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// ============================================
// RUTA RAÍZ: /
// Función: Sirve la aplicación HTML principal
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// INICIO DEL SERVIDOR
// Función: Inicia el servidor en el puerto especificado
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Asegúrate de tener configurado OPENAI_API_KEY en el archivo .env`);
});

