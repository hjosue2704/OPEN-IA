// Variables globales
let recognition = null;
let isListening = false;
let autoSpeak = true;
let conversationHistory = []; // Historial de conversación para contexto
let responseLanguage = 'es'; // Idioma de respuesta por defecto
let realtimeTranslation = false; // Traducción en tiempo real activada/desactivada
let sourceLanguage = 'auto'; // Idioma de entrada (o 'auto' para detección automática)

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
    setupEventListeners();
});

// Mapeo de códigos de idioma a códigos de reconocimiento de voz
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

// Actualizar idioma del reconocimiento de voz
function updateRecognitionLanguage() {
    if (!recognition) return;
    
    if (realtimeTranslation && sourceLanguage !== 'auto') {
        recognition.lang = speechRecognitionLanguages[sourceLanguage] || 'es-ES';
    } else {
        recognition.lang = speechRecognitionLanguages[responseLanguage] || 'es-ES';
    }
}

// Inicializar reconocimiento de voz
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

// Inicializar síntesis de voz
function initializeSpeechSynthesis() {
    if (!('speechSynthesis' in window)) {
        showError('Tu navegador no soporta síntesis de voz.');
        return;
    }

    // Cargar voces disponibles
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
}

// Cargar voces disponibles
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

// Configurar event listeners
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
        sourceLanguageLabel.style.display = realtimeTranslation ? 'flex' : 'none';
        updateRecognitionLanguage();
    });
    sourceLanguageSelect.addEventListener('change', (e) => {
        sourceLanguage = e.target.value;
        updateRecognitionLanguage();
    });
}

// Alternar escucha
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

// Actualizar UI
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

// Agregar mensaje al chat
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

// Procesar entrada del usuario con OpenAI (a través del backend)
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
    
    // Si la traducción en tiempo real está activada, traducir el mensaje del usuario
    if (realtimeTranslation) {
        updateUI('Traduciendo mensaje...', false);
        try {
            const translationResult = await translateRealtime(input, sourceLanguage, responseLanguage);
            if (translationResult.translated) {
                translatedUserMessage = translationResult.translation;
                userMessage = translatedUserMessage; // Usar el mensaje traducido para la conversación
                userMessageTranslated = true;
            }
        } catch (error) {
            console.error('Error al traducir mensaje del usuario:', error);
            // Continuar con el mensaje original si falla la traducción
        }
    }
    
    // Mostrar mensaje del usuario (con traducción si aplica)
    addMessage(userMessage, 'user', input, userMessageTranslated);
    
    // Mostrar indicador de carga
    updateUI('Pensando...', false);
    
    // Agregar mensaje del usuario al historial (usar el mensaje traducido si existe)
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    try {
        // Llamar al backend (que llama a OpenAI)
        const response = await callBackendAPI(userMessage);
        
        let botResponse = response;
        let botResponseTranslated = false;
        
        // Si la traducción en tiempo real está activada y el idioma de respuesta es diferente al de entrada
        if (realtimeTranslation && sourceLanguage !== responseLanguage) {
            // Si el mensaje del usuario fue traducido, la respuesta ya está en el idioma correcto
            // Pero si el usuario habló en el idioma de respuesta, necesitamos traducir la respuesta
            // Por ahora, asumimos que si traducimos la entrada, la respuesta ya está en el idioma correcto
            // Solo traducimos si el idioma de respuesta es diferente al detectado en la entrada
        }
        
        // Agregar respuesta del bot al historial
        conversationHistory.push({
            role: 'assistant',
            content: botResponse
        });

        // Limitar el historial a las últimas 10 interacciones para no exceder tokens
        if (conversationHistory.length > 20) {
            conversationHistory = conversationHistory.slice(-20);
        }

        // Mostrar respuesta
        addMessage(botResponse, 'bot');
        if (autoSpeak) {
            speak(botResponse);
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

// Traducir texto
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

// Traducir en tiempo real con detección de idioma
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

// Llamar al backend (que protege la API key)
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

// Sintetizar voz
function speak(text) {
    if (!('speechSynthesis' in window)) {
        return;
    }

    // Cancelar cualquier síntesis anterior
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Aplicar voz seleccionada
    const voiceSelect = document.getElementById('voiceSelect');
    const voices = speechSynthesis.getVoices();
    if (voiceSelect.value && voices[voiceSelect.value]) {
        utterance.voice = voices[voiceSelect.value];
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

// Mostrar error
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

