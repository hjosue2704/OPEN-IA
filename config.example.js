// Archivo de ejemplo de configuración
// Copia este archivo a config.js y agrega tu API key

const CONFIG = {
    // Tu API key de OpenAI
    // Obtén una en: https://platform.openai.com/api-keys
    OPENAI_API_KEY: 'tu-api-key-aqui', // Reemplaza con tu API key real
    
    // Modelo de OpenAI a usar
    OPENAI_MODEL: 'gpt-3.5-turbo', // Puedes cambiar a 'gpt-4' si tienes acceso
    
    // Configuración del sistema para el bot
    SYSTEM_PROMPT: 'Eres un asistente de voz amigable y conversacional. Responde de manera natural, breve y en español. Mantén las respuestas concisas ya que serán leídas en voz alta.'
};

// Exportar configuración
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

