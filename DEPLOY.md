# Guía de Deploy del Bot de Voz 🤖

Esta guía te ayudará a desplegar el bot en diferentes plataformas.

## ⚠️ IMPORTANTE: Seguridad

El proyecto ahora usa un **backend** que protege tu API key. La API key **NO** se expone en el cliente, solo en el servidor.

## Estructura del Proyecto

```
OPEN-IA/
├── server.js           # Servidor backend (Express)
├── package.json        # Dependencias Node.js
├── .env                # Configuración (NO se sube al repo)
├── env.example.txt     # Ejemplo de configuración
├── public/             # Archivos frontend
│   ├── index.html
│   ├── styles.css
│   └── script.js
└── README.md
```

## Configuración Local (Desarrollo)

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Windows (PowerShell)
Copy-Item env.example.txt .env

# Linux/Mac
cp env.example.txt .env
```

Edita `.env` y agrega tu API key de OpenAI:

```
OPENAI_API_KEY=tu-api-key-real-aqui
PORT=3000
OPENAI_MODEL=gpt-3.5-turbo
```

### 3. Ejecutar el servidor

```bash
npm start
```

O en modo desarrollo (con auto-reload):

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## Deploy en Diferentes Plataformas

### Opción 1: Railway (Recomendado - Fácil y Gratis)

1. **Crear cuenta en Railway**:
   - Ve a [railway.app](https://railway.app)
   - Inicia sesión con GitHub

2. **Conectar repositorio**:
   - Crea un nuevo proyecto
   - Conecta tu repositorio de GitHub

3. **Configurar variables de entorno**:
   - En el dashboard de Railway, ve a "Variables"
   - Agrega:
     - `OPENAI_API_KEY` = tu API key
     - `PORT` = 3000 (o déjalo vacío, Railway lo asigna automáticamente)
     - `OPENAI_MODEL` = gpt-3.5-turbo

4. **Deploy automático**:
   - Railway detectará automáticamente el `package.json`
   - Ejecutará `npm install` y `npm start`
   - Tu app estará disponible en una URL como `https://tu-proyecto.railway.app`

### Opción 2: Render (Gratis)

1. **Crear cuenta en Render**:
   - Ve a [render.com](https://render.com)
   - Inicia sesión con GitHub

2. **Crear nuevo Web Service**:
   - Conecta tu repositorio
   - Tipo: "Web Service"
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Configurar variables de entorno**:
   - En "Environment Variables", agrega:
     - `OPENAI_API_KEY`
     - `OPENAI_MODEL` (opcional)

4. **Deploy**:
   - Render desplegará automáticamente
   - Tu app estará en `https://tu-proyecto.onrender.com`

### Opción 3: Heroku

1. **Instalar Heroku CLI**:
   ```bash
   # Descarga desde heroku.com
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Crear app**:
   ```bash
   heroku create tu-nombre-app
   ```

4. **Configurar variables**:
   ```bash
   heroku config:set OPENAI_API_KEY=tu-api-key
   heroku config:set OPENAI_MODEL=gpt-3.5-turbo
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

### Opción 4: VPS (Servidor Propio)

#### Con Node.js instalado:

1. **Clonar repositorio**:
   ```bash
   git clone tu-repositorio
   cd OPEN-IA
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar .env**:
   ```bash
   cp env.example.txt .env
   nano .env  # Editar con tu API key
   ```

4. **Usar PM2 (recomendado para producción)**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name bot-voz
   pm2 save
   pm2 startup  # Para iniciar automáticamente al reiniciar
   ```

5. **Configurar Nginx (opcional, para HTTPS)**:
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Opción 5: Vercel (Serverless)

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Crear `vercel.json`**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Configurar variables**:
   - En el dashboard de Vercel, agrega `OPENAI_API_KEY`

## Verificar el Deploy

1. **Probar la API**:
   ```bash
   curl https://tu-url.com/api/health
   ```

2. **Abrir en el navegador**:
   - Ve a `https://tu-url.com`
   - Permite el micrófono
   - Prueba hablar con el bot

## Solución de Problemas

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Verifica que `.env` exista y tenga `OPENAI_API_KEY`
- Revisa los logs: `npm start` o en la plataforma de deploy

### Error 500 en las respuestas
- Verifica que `OPENAI_API_KEY` esté correctamente configurada
- Revisa que tengas créditos en OpenAI
- Verifica los logs del servidor

### CORS errors
- El servidor ya tiene CORS habilitado
- Si persisten, verifica que estés usando HTTPS en producción

### El micrófono no funciona
- Los navegadores requieren HTTPS para el micrófono (excepto localhost)
- Asegúrate de que tu deploy use HTTPS
- Railway, Render y Heroku proporcionan HTTPS automáticamente

## Costos

- **Railway**: Plan gratuito con límites
- **Render**: Plan gratuito (se duerme después de inactividad)
- **Heroku**: Plan gratuito descontinuado, requiere plan de pago
- **VPS**: Depende del proveedor (DigitalOcean, AWS, etc.)
- **OpenAI API**: Pago por uso (muy económico con gpt-3.5-turbo)

## Recomendación

Para empezar rápido y gratis, usa **Railway** o **Render**. Son fáciles de configurar y proporcionan HTTPS automáticamente.

