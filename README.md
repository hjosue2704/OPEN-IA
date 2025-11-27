# Bot de Voz Interactivo con GPT 🤖

Una aplicación web moderna que permite comunicarse con un bot inteligente usando reconocimiento de voz, síntesis de voz (TTS) y OpenAI GPT para respuestas inteligentes.

## Características

- 🎤 **Reconocimiento de Voz**: El bot puede escuchar lo que dices usando la Web Speech API
- 🔊 **Síntesis de Voz (TTS)**: El bot responde con voz usando text-to-speech
- 🤖 **Inteligencia Artificial**: Integrado con OpenAI GPT para respuestas inteligentes y conversacionales
- 💬 **Interfaz Moderna**: Diseño atractivo y responsive
- ⚙️ **Configuración**: Opciones para activar/desactivar respuesta automática y seleccionar voz
- 🌐 **Multiplataforma**: Funciona en cualquier navegador moderno
- 🔒 **Seguro**: La API key se mantiene fuera del repositorio

## Requisitos

- Navegador moderno que soporte Web Speech API (recomendado: Chrome, Edge, Safari)
- Micrófono conectado y permisos de acceso
- Conexión a internet (para cargar las APIs del navegador y OpenAI)
- **API Key de OpenAI** (ver configuración abajo)

## Instalación y Configuración

### 1. Clonar o descargar el proyecto

```bash
git clone <tu-repositorio>
cd OPEN-IA
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar la API Key de OpenAI

**IMPORTANTE**: Necesitas una API key de OpenAI para que el bot funcione.

1. **Obtener una API Key**:
   - Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Inicia sesión o crea una cuenta
   - Crea una nueva API key

2. **Configurar variables de entorno**:
   ```bash
   # Windows (PowerShell)
   Copy-Item env.example.txt .env
   
   # Linux/Mac
   cp env.example.txt .env
   ```

3. **Editar el archivo `.env`**:
   - Abre `.env` con un editor de texto
   - Reemplaza `tu-api-key-aqui` con tu API key real:
   ```
   OPENAI_API_KEY=sk-proj-tu-api-key-real-aqui
   PORT=3000
   OPENAI_MODEL=gpt-3.5-turbo
   ```

**⚠️ IMPORTANTE**: El archivo `.env` está en `.gitignore` y NO se subirá al repositorio. Esto protege tu API key.

### 4. Ejecutar el servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

**Modo desarrollo** (con auto-reload):
```bash
npm run dev
```

### 5. Usar la aplicación

1. Abre `http://localhost:3000` en tu navegador (Chrome o Edge recomendado)
2. **Permitir acceso al micrófono** cuando el navegador lo solicite
3. **Hacer clic en el botón del micrófono** para comenzar a hablar
4. El bot procesará tu mensaje con GPT y responderá por voz

## 🚀 Deploy en un Servidor

Para desplegar la aplicación en producción, consulta la **[Guía de Deploy completa](DEPLOY.md)**.

Opciones recomendadas:
- **Railway** (fácil y gratis)
- **Render** (gratis)
- **Heroku** (requiere plan de pago)
- **VPS propio** (más control)

## Funcionalidades del Bot

El bot utiliza **OpenAI GPT** para proporcionar respuestas inteligentes a:
- ✅ Cualquier pregunta o conversación
- ✅ Explicaciones de conceptos
- ✅ Ayuda con tareas
- ✅ Conversación natural y contextual
- ✅ Y mucho más...

El bot mantiene el contexto de la conversación, por lo que puedes hacer preguntas de seguimiento y mantener una conversación fluida.

## Configuración

- **Respuesta automática por voz**: Activa/desactiva si el bot debe hablar automáticamente
- **Selección de voz**: Elige entre diferentes voces en español disponibles en tu sistema

## Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura de la interfaz
- **CSS3**: Estilos modernos con gradientes y animaciones
- **JavaScript**: Lógica de la aplicación
- **Web Speech API**: 
  - SpeechRecognition API (reconocimiento de voz)
  - SpeechSynthesis API (síntesis de voz)

### Backend
- **Node.js**: Runtime de JavaScript
- **Express**: Framework web para el servidor
- **OpenAI API**: Integración con GPT para respuestas inteligentes
- **CORS**: Habilitado para permitir peticiones del frontend

## Notas Importantes

- **Navegador**: Chrome y Edge tienen el mejor soporte para Web Speech API
- **HTTPS**: Algunos navegadores requieren HTTPS para acceder al micrófono (excepto localhost)
- **Idioma**: El bot está configurado para español (es-ES)

## Solución de Problemas

### Error: "API key no configurada"
- Asegúrate de haber creado el archivo `.env` (copia de `env.example.txt`)
- Verifica que tu API key esté correctamente escrita en `.env`
- Comprueba que el archivo `.env` existe en la raíz del proyecto (mismo nivel que `server.js`)
- Reinicia el servidor después de modificar `.env`

### Error: "API key inválida" o problemas de autenticación
- Verifica que tu API key de OpenAI sea válida
- Asegúrate de tener créditos en tu cuenta de OpenAI
- Revisa que no hayas copiado espacios extra en la API key

### Error: "Cuota excedida" o problemas de facturación
- Verifica que tengas créditos disponibles en tu cuenta de OpenAI
- Revisa tu método de pago en [platform.openai.com](https://platform.openai.com)
- Considera usar `gpt-3.5-turbo` en lugar de `gpt-4` para reducir costos

### El micrófono no funciona
- Verifica que has dado permisos al navegador
- Asegúrate de que el micrófono está conectado y funcionando
- Prueba en Chrome o Edge para mejor compatibilidad

### No se escucha la voz del bot
- Verifica que el volumen de tu sistema esté activado
- Revisa que la opción "Respuesta automática por voz" esté activada
- Prueba seleccionando una voz diferente en la configuración

### El reconocimiento no funciona
- Asegúrate de usar un navegador compatible (Chrome, Edge)
- Verifica que estás hablando claramente y en español
- Comprueba que el micrófono no está siendo usado por otra aplicación

### El bot no responde o tarda mucho
- Verifica tu conexión a internet
- Revisa la consola del navegador (F12) para ver errores
- Asegúrate de que tu API key tenga permisos y créditos

## Estructura del Proyecto

```
OPEN-IA/
├── server.js           # Servidor backend (Express)
├── package.json        # Dependencias Node.js
├── .env                # Configuración con API key (NO se sube al repo)
├── env.example.txt     # Ejemplo de configuración
├── .gitignore          # Archivos a ignorar en git
├── public/             # Archivos frontend
│   ├── index.html      # Interfaz principal
│   ├── styles.css      # Estilos de la aplicación
│   └── script.js       # Lógica del frontend
├── DEPLOY.md           # Guía completa de deploy
└── README.md           # Este archivo
```

## Seguridad

- ✅ El archivo `.env` está en `.gitignore` y **NO se sube al repositorio**
- ✅ La API key se mantiene en el servidor (backend), **NO se expone al cliente**
- ✅ El backend actúa como proxy seguro para las llamadas a OpenAI
- ⚠️ **NUNCA** compartas tu `.env` o tu API key públicamente
- ⚠️ Si expones tu API key accidentalmente, revócala inmediatamente en OpenAI
- ⚠️ En producción, siempre usa HTTPS para proteger las comunicaciones

## Costos

- OpenAI cobra por uso de su API (basado en tokens)
- `gpt-3.5-turbo` es más económico que `gpt-4`
- Las respuestas están limitadas a 150 tokens para optimizar costos
- Consulta los precios actuales en [OpenAI Pricing](https://openai.com/pricing)

## Licencia

Este proyecto es de código abierto y está disponible para uso libre.

## Autor

Creado como proyecto de demostración de Web Speech API e integración con OpenAI GPT.

