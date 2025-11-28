// ============================================
// LÓGICA FRONTEND - script.js
// Ubicación: public/script.js
// Función: Maneja reconocimiento de voz, síntesis de voz, comunicación con backend y UI
// ============================================

// Variables globales: Estado de la aplicación
let recognition = null; // Objeto de reconocimiento de voz (Web Speech API)
let isListening = false; // Indica si el micrófono está escuchando
let autoSpeak = true; // Si el bot debe hablar automáticamente las respuestas
let conversationHistory = []; // Historial de conversación para mantener contexto con GPT
let responseLanguage = 'es'; // Idioma de respuesta por defecto
let realtimeTranslation = false; // Traducción en tiempo real activada/desactivada
let sourceLanguage = 'auto'; // Idioma de entrada (o 'auto' para detección automática)

// Inicialización: Cuando la página carga, inicializa todas las funcionalidades
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition(); // Configura el reconocimiento de voz
    initializeSpeechSynthesis(); // Configura la síntesis de voz (TTS)
    setupEventListeners(); // Configura los event listeners de los controles
});

// Mapeo de códigos de idioma ISO a códigos de reconocimiento de voz del navegador
const speechRecognitionLanguages = {
    'es': 'es-ES',
    'en': 'en-US',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ja': 'ja-JP',
    'zh': 'zh-CN',
    'ru': 'ru-RU',
    'auto': 'es-ES' // Por defecto español si es auto
};

// Función: Actualiza el idioma del reconocimiento de voz según la configuración
function updateRecognitionLanguage() {
    if (!recognition) return;
    
    if (realtimeTranslation && sourceLanguage !== 'auto') {
        recognition.lang = speechRecognitionLanguages[sourceLanguage] || 'es-ES';
    } else {
        recognition.lang = speechRecognitionLanguages[responseLanguage] || 'es-ES';
    }
}

// Función: Inicializa la API de reconocimiento de voz del navegador
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showError('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome o Edge.');
        return;
    }

    recognition = new SpeechRecognition();
    updateRecognitionLanguage();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        isListening = true;
        updateUI('Escuchando...', true);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addMessage(transcript, 'user');
        processUserInput(transcript);
    };

    recognition.onerror = (event) => {
        console.error('Error en reconocimiento:', event.error);
        if (event.error === 'no-speech') {
            updateUI('No se detectó voz. Intenta de nuevo.', false);
        } else if (event.error === 'not-allowed') {
            showError('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
        } else {
            updateUI('Error al escuchar. Intenta de nuevo.', false);
        }
        isListening = false;
    };

    recognition.onend = () => {
        isListening = false;
        updateUI('Listo para escuchar', false);
    };
}

// Función: Inicializa la API de síntesis de voz (text-to-speech)
function initializeSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        showError('Tu navegador no soporta síntesis de voz.');
        return;
    }

    // Cargar voces disponibles
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

// Función: Carga las voces disponibles en el sistema y las muestra en el selector
function loadVoices() {
    const voices = speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.innerHTML = '<option value="">Voz predeterminada</option>';

    voices.forEach((voice, index) => {
        if (voice.lang.startsWith('es')) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        }
    });
}

// Función: Configura los event listeners para todos los controles de la interfaz
function setupEventListeners() {
    const micButton = document.getElementById('micButton');
    const autoSpeakCheckbox = document.getElementById('autoSpeak');
    const voiceSelect = document.getElementById('voiceSelect');
    const languageSelect = document.getElementById('languageSelect');
    const realtimeTranslationCheckbox = document.getElementById('realtimeTranslation');
    const sourceLanguageSelect = document.getElementById('sourceLanguageSelect');
    const sourceLanguageLabel = document.getElementById('sourceLanguageLabel');

    micButton.addEventListener('click', toggleListening);
    autoSpeakCheckbox.addEventListener('change', (e) => {
        autoSpeak = e.target.checked;
    });
    voiceSelect.addEventListener('change', () => {
        // La voz se aplicará en la próxima síntesis
    });
    languageSelect.addEventListener('change', (e) => {
        responseLanguage = e.target.value;
        updateRecognitionLanguage();
    });
    realtimeTranslationCheckbox.addEventListener('change', (e) => {
        realtimeTranslation = e.target.checked;
        if (realtimeTranslation) {
            sourceLanguageLabel.classList.add('show');
        } else {
            sourceLanguageLabel.classList.remove('show');
        }
        updateRecognitionLanguage();
    });
    sourceLanguageSelect.addEventListener('change', (e) => {
        sourceLanguage = e.target.value;
        updateRecognitionLanguage();
    });
}

// Función: Activa o desactiva el reconocimiento de voz al hacer clic en el botón
function toggleListening() {
    if (!recognition) {
        showError('Reconocimiento de voz no disponible.');
        return;
    }

    if (isListening) {
        recognition.stop();
    } else {
        try {
            recognition.start();
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            updateUI('Error al iniciar. Intenta de nuevo.', false);
        }
    }
}

// Función: Actualiza la interfaz de usuario con el estado actual (texto de estado y visual del botón)
function updateUI(statusText, listening) {
    const status = document.getElementById('status');
    const micButton = document.getElementById('micButton');

    status.textContent = statusText;
    if (listening) {
        status.classList.add('listening');
        micButton.classList.add('listening');
    } else {
        status.classList.remove('listening');
        micButton.classList.remove('listening');
    }
}

// Función: Añade un mensaje al chat (usuario o bot), con soporte para mostrar texto original y traducido
function addMessage(text, type, originalText = null, translated = false) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Si hay texto original y está traducido, mostrar ambos
    if (originalText && translated && originalText !== text) {
        const originalP = document.createElement('p');
        originalP.className = 'original-text';
        originalP.textContent = originalText;
        originalP.style.opacity = '0.7';
        originalP.style.fontSize = '0.9em';
        originalP.style.marginBottom = '5px';
        originalP.style.fontStyle = 'italic';
        contentDiv.appendChild(originalP);
        
        const translatedP = document.createElement('p');
        translatedP.className = 'translated-text';
        translatedP.textContent = text;
        translatedP.style.borderTop = '1px solid rgba(0,0,0,0.1)';
        translatedP.style.paddingTop = '5px';
        contentDiv.appendChild(translatedP);
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        contentDiv.appendChild(p);
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función: Procesa el input del usuario - traduce si está activado, o envía al bot asistente
async function processUserInput(input) {
    const lowerInput = input.toLowerCase().trim();
    
    // Detectar si el usuario quiere traducir algo
    if (lowerInput.startsWith('traduce ') || lowerInput.startsWith('translate ')) {
        const textToTranslate = input.replace(/^(traduce|translate)\s+/i, '').trim();
        if (textToTranslate) {
            await translateText(textToTranslate);
            return;
        }
    }
    
    let userMessage = input;
    let translatedUserMessage = null;
    let userMessageTranslated = false;
    
    // Si la traducción en tiempo real está activada, solo traducir sin responder
    if (realtimeTranslation) {
        updateUI('Traduciendo mensaje...', false);
        try {
            const translationResult = await translateRealtime(input, sourceLanguage, responseLanguage);
            if (translationResult.translated) {
                translatedUserMessage = translationResult.translation;
                userMessage = translatedUserMessage;
                userMessageTranslated = true;
            }
            
            // Mostrar mensaje del usuario (con traducción si aplica)
            addMessage(userMessage, 'user', input, userMessageTranslated);
            
            // Si hay traducción, mostrar también el texto traducido como mensaje del bot
            if (userMessageTranslated && translatedUserMessage) {
                addMessage(`Traducción: ${translatedUserMessage}`, 'bot');
                // Leer la traducción en voz alta usando el idioma de respuesta
                if (autoSpeak) {
                    speak(translatedUserMessage, responseLanguage);
                }
            } else if (translatedUserMessage) {
                // Si no se tradujo pero hay mensaje, también leerlo
                if (autoSpeak) {
                    speak(translatedUserMessage, responseLanguage);
                }
            }
            
            updateUI('Listo para escuchar', false);
            return; // Salir sin llamar al bot asistente
        } catch (error) {
            console.error('Error al traducir mensaje del usuario:', error);
            addMessage('Error al traducir el mensaje. Intenta de nuevo.', 'bot');
            updateUI('Error al traducir', false);
            return; // Salir sin llamar al bot asistente
        }
    }
    
    // Si la traducción en tiempo real NO está activada, proceder normalmente con el bot asistente
    // Mostrar mensaje del usuario
    addMessage(input, 'user');
    
    // Mostrar indicador de carga
    updateUI('Pensando...', false);
    
    // Agregar mensaje del usuario al historial
    conversationHistory.push({
        role: 'user',
        content: input
    });

    try {
        // Llamar al backend (que llama a OpenAI)
        const response = await callBackendAPI(input);
        
        // Agregar respuesta del bot al historial
        conversationHistory.push({
            role: 'assistant',
            content: response
        });

        // Limitar el historial a las últimas 10 interacciones para no exceder tokens
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        // Mostrar respuesta
        addMessage(response, 'bot');
        if (autoSpeak) {
            speak(response);
        }
    } catch (error) {
        console.error('Error al procesar con el backend:', error);
        let errorMessage = 'Lo siento, hubo un error al procesar tu mensaje.';
        
        if (error.message.includes('API key')) {
            errorMessage = 'Error: API key inválida o no configurada en el servidor.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Error de conexión con el servidor. Por favor, verifica que el servidor esté corriendo.';
        } else if (error.message.includes('quota') || error.message.includes('billing')) {
            errorMessage = 'Error: Has excedido tu cuota de API o necesitas configurar el método de pago.';
        }
        
        addMessage(errorMessage, 'bot');
        updateUI('Error al procesar', false);
    }
}

// Función: Traduce texto usando el endpoint /api/translate (traducción simple)
async function translateText(text) {
    updateUI('Traduciendo...', false);
    
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                targetLanguage: responseLanguage
            })
        });

        if (!response.ok) {
            throw new Error('Error al traducir');
        }

        const data = await response.json();
        const translatedText = data.translation;
        
        addMessage(`Traducción: ${translatedText}`, 'bot');
        if (autoSpeak) {
            speak(translatedText);
        }
    } catch (error) {
        console.error('Error al traducir:', error);
        addMessage('Error al traducir el texto. Intenta de nuevo.', 'bot');
        updateUI('Error al traducir', false);
    }
}

// Función: Traduce en tiempo real con detección automática de idioma usando /api/translate-realtime
async function translateRealtime(text, sourceLang, targetLang) {
    try {
        const response = await fetch('/api/translate-realtime', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                sourceLanguage: sourceLang,
                targetLanguage: targetLang
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al traducir en tiempo real');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en traducción en tiempo real:', error);
        throw error;
    }
}

// Función: Llama al backend /api/chat para obtener respuesta de GPT (la API key está protegida en el servidor)
async function callBackendAPI(userMessage) {
    // Determinar la URL del backend (mismo origen si está en el mismo servidor)
    const apiUrl = '/api/chat';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: userMessage,
            conversationHistory: conversationHistory,
            responseLanguage: responseLanguage
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
            throw new Error('API key inválida');
        } else if (response.status === 429) {
            throw new Error('Cuota excedida');
        } else if (response.status === 402 || response.status === 403) {
            throw new Error('Problema de facturación');
        } else if (response.status === 500) {
            throw new Error('Error del servidor: ' + (errorData.error || 'Error desconocido'));
        }
        throw new Error(errorData.error || `Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
}

// Función: Convierte texto a voz usando SpeechSynthesis API del navegador
// Parámetro opcional: lang - idioma para la síntesis (por defecto usa responseLanguage)
function speak(text, lang = null) {
    if (!('speechSynthesis' in window)) {
        return;
    }

    // Cancelar cualquier síntesis anterior
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Usar el idioma proporcionado o el idioma de respuesta configurado
    const targetLang = lang || responseLanguage;
    // Mapeo de códigos de idioma a códigos de síntesis de voz
    const synthesisLanguages = {
        'es': 'es-ES',
        'en': 'en-US',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ja': 'ja-JP',
        'zh': 'zh-CN',
        'ru': 'ru-RU'
    };
    utterance.lang = synthesisLanguages[targetLang] || 'es-ES';
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Aplicar voz seleccionada (si está disponible para el idioma)
    const voiceSelect = document.getElementById('voiceSelect');
    const voices = speechSynthesis.getVoices();
    if (voiceSelect.value && voices[voiceSelect.value]) {
        utterance.voice = voices[voiceSelect.value];
    } else {
        // Si no hay voz seleccionada, buscar una voz del idioma objetivo
        const targetLangCode = synthesisLanguages[targetLang] || 'es-ES';
        const voiceForLang = voices.find(v => v.lang.startsWith(targetLangCode.split('-')[0]));
        if (voiceForLang) {
            utterance.voice = voiceForLang;
        }
    }

    utterance.onstart = () => {
        updateUI('Hablando...', false);
    };

    utterance.onend = () => {
        updateUI('Listo para escuchar', false);
    };

    utterance.onerror = (event) => {
        console.error('Error en síntesis:', event.error);
        updateUI('Error al hablar', false);
    };

    speechSynthesis.speak(utterance);
}

// Función: Muestra un mensaje de error en el chat con estilo especial
function showError(message) {
    const chatMessages = document.getElementById('chatMessages');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot-message';
    errorDiv.style.opacity = '0.8';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.style.background = '#ffebee';
    contentDiv.style.color = '#c62828';
    const p = document.createElement('p');
    p.textContent = `⚠️ ${message}`;
    contentDiv.appendChild(p);

    errorDiv.appendChild(contentDiv);
    chatMessages.appendChild(errorDiv);
}

