// Variables globales
let recognition = null;
let isListening = false;
let autoSpeak = true;
let conversationHistory = []; // Historial de conversación para contexto

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeSpeechRecognition();
    initializeSpeechSynthesis();
    setupEventListeners();
});

// Inicializar reconocimiento de voz
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showError('Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome o Edge.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
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

    micButton.addEventListener('click', toggleListening);
    autoSpeakCheckbox.addEventListener('change', (e) => {
        autoSpeak = e.target.checked;
    });
    voiceSelect.addEventListener('change', () => {
        // La voz se aplicará en la próxima síntesis
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
function addMessage(text, type) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    const p = document.createElement('p');
    p.textContent = text;
    contentDiv.appendChild(p);

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Procesar entrada del usuario con OpenAI (a través del backend)
async function processUserInput(input) {
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
            conversationHistory: conversationHistory
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

