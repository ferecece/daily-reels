# DailyReels

Tu asistente para publicar reels diarios en Instagram con horarios configurables por día de la semana.

![Instagram Reels](https://img.shields.io/badge/Instagram-Reels-E4405F?style=for-the-badge&logo=instagram&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)

## Tabla de Contenidos

- [Descripción](#descripción)
- [Funcionalidades](#funcionalidades)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Flujo de Publicación](#flujo-de-publicación)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [APIs y Endpoints](#apis-y-endpoints)
- [Solución de Problemas](#solución-de-problemas)
- [Licencia](#licencia)

## Descripción

DailyReels es una aplicación Node.js diseñada para creadores de contenido diario que necesitan publicar reels en Instagram de manera automática. La aplicación permite configurar horarios específicos para cada día de la semana y personalizar el texto de tus publicaciones con un contador automático de días (ej: "Día 1", "Día 2", etc.).

El sistema utiliza la Graph API v22.0 de Facebook/Instagram y ofrece una interfaz amigable y moderna para gestionar tus publicaciones diarias con facilidad.

## Funcionalidades

- **Autenticación con Instagram**: Conecta tu cuenta de Instagram Business/Creator con pocos clics.
- **Publicación de Reels**: Publica tus videos desde URLs externas (Cloudinary, etc.) como Reels en Instagram.
- **Contador automático de días**: Añade automáticamente un número secuencial de día al texto de tus reels.
- **Horarios personalizados por día**: Configura un horario específico para cada día de la semana.
- **Soporte de zonas horarias**: Configura tu zona horaria para que las publicaciones sean precisas.
- **Publicación inmediata**: Botón para publicar inmediatamente cuando lo necesites.
- **Refresco automático de tokens**: Gestión inteligente de tokens de acceso.
- **Interfaz moderna**: Panel de control elegante con modo oscuro, efectos visuales y diseño responsive.

## Requisitos Previos

- Node.js 14 o superior
- Cuenta de Instagram Business o Creator conectada a una página de Facebook
- Aplicación de desarrollador en Meta for Developers con los permisos necesarios
- Servidor público para alojar la aplicación (los hooks de Instagram requieren una URL pública)

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/daily-reels.git
cd daily-reels
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear y configurar el archivo `.env` con las siguientes variables:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Instagram API
INSTAGRAM_APP_ID=tu_app_id_aqui
INSTAGRAM_APP_SECRET=tu_app_secret_aqui
INSTAGRAM_REDIRECT_URI=http://tu-dominio.com/auth/instagram/callback

# Base de datos
DB_PATH=./data/database.sqlite
```

4. Iniciar la aplicación:

```bash
npm run dev
```

## Configuración

### 1. Crear una Aplicación en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación (tipo "Otro")
3. Agrega el producto "Facebook Login"
4. Configura las URL de redirección OAuth válidas en Configuración > Básica > Facebook Login
5. Solicita los siguientes permisos a través de App Review:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
   - `business_management`

### 2. Preparar la Cuenta de Instagram

1. Asegúrate de tener una cuenta de Instagram Business o Creator
2. Conecta la cuenta de Instagram a una página de Facebook
3. La cuenta debe tener permisos para publicar contenido mediante la API

### 3. Configurar la Aplicación

1. Accede a la aplicación web en tu navegador
2. Haz clic en "Conectar con Instagram" para autorizar la aplicación
3. Configura la URL del video (debe ser accesible públicamente)
4. Personaliza el texto para tus reels (usa %d para el número de día)
5. Selecciona tu zona horaria
6. Establece un horario de publicación específico para cada día de la semana

## Uso

### Panel de Control

Accede a la interfaz web a través de `http://localhost:3000` (o el puerto configurado):

- **Tu Panel de Control**: Muestra el estado de conexión con Instagram, información del día actual, y detalles de tus publicaciones recientes y próximas.
- **¡Publicar ahora!**: Botón para publicar inmediatamente tu reel configurado.
- **Personaliza tus Reels**: Permite configurar la URL de tu video, el texto personalizado, tu zona horaria y los horarios específicos para cada día de la semana.

### Publicación Inmediata

1. Asegúrate de haber configurado correctamente la URL del video en la sección de personalización
2. Haz clic en el botón "¡Publicar ahora!" en tu panel de control
3. El sistema iniciará el proceso de publicación y te mostrará una notificación con el resultado

### Publicación Programada

Las publicaciones programadas se ejecutan automáticamente según los horarios configurados para cada día de la semana mientras la aplicación esté en funcionamiento.

## Flujo de Publicación

El proceso de publicación utiliza el flujo oficial de la Graph API v22.0 para publicar Reels:

1. **Autenticación**: Obtiene un token de acceso válido
2. **Creación del contenedor**: Envía la URL del video y el texto a la Graph API
3. **Monitoreo del estado**: Verifica el estado del procesamiento del video
4. **Publicación**: Una vez que el contenedor está listo, publica el Reel
5. **Registro**: Almacena el resultado de la publicación en la base de datos

## Estructura del Proyecto

```
/daily-reels
  ├── data/                  # Almacena la base de datos SQLite
  ├── public/                # Archivos estáticos y frontend
  │   ├── css/               # Estilos CSS
  │   │   └── styles.css     # Estilos principales con soporte para modo oscuro
  │   └── index.html         # Interfaz de usuario
  ├── src/
  │   ├── config/            # Configuraciones
  │   │   └── database.js    # Configuración de la base de datos
  │   ├── controllers/       # Controladores para las rutas
  │   │   ├── authController.js    # Controlador de autenticación
  │   │   ├── settingsController.js # Controlador de configuraciones
  │   │   └── statusController.js   # Controlador de estado
  │   ├── middlewares/       # Middlewares de Express
  │   ├── models/            # Modelos de datos
  │   │   ├── instagram.js   # Modelo para autenticación de Instagram
  │   │   ├── publication.js # Modelo para publicaciones
  │   │   └── settings.js    # Modelo para configuraciones
  │   ├── routes/            # Rutas de la API
  │   │   ├── auth.js        # Rutas de autenticación
  │   │   ├── settings.js    # Rutas de configuración
  │   │   └── status.js      # Rutas de estado
  │   ├── services/          # Servicios de la aplicación
  │   │   ├── instagram.js   # Servicio para la API de Instagram
  │   │   └── scheduler.js   # Servicio de programación con soporte de timezone
  │   ├── utils/             # Utilidades
  │   │   └── dateUtils.js   # Funciones para manejo de fechas y zonas horarias
  │   └── server.js          # Archivo principal del servidor
  ├── .env                   # Variables de entorno
  ├── .gitignore             # Archivos a ignorar por Git
  ├── package.json           # Dependencias y scripts
  └── README.md              # Documentación
```

## APIs y Endpoints

### API REST

- `GET /auth/instagram`: Inicia el flujo de autenticación
- `GET /auth/instagram/callback`: Callback para la autenticación
- `POST /auth/instagram/disconnect`: Desconecta la cuenta
- `GET /settings`: Obtiene la configuración actual
- `POST /settings`: Actualiza la configuración
- `GET /status`: Obtiene el estado actual del sistema
- `POST /status/publish-now`: Publica inmediatamente

### Instagram Graph API

El sistema utiliza los siguientes endpoints de la Graph API v22.0:

- `/{GRAPH_API_VERSION}/dialog/oauth`: Autenticación OAuth
- `/{GRAPH_API_VERSION}/oauth/access_token`: Obtención y refresco de tokens
- `/{GRAPH_API_VERSION}/me/accounts`: Obtención de páginas del usuario
- `/{GRAPH_API_VERSION}/{ig-user-id}/media`: Creación del contenedor de medios
- `/{GRAPH_API_VERSION}/{container-id}`: Verificación del estado del contenedor
- `/{GRAPH_API_VERSION}/{ig-user-id}/media_publish`: Publicación del contenedor

## Solución de Problemas

### Problemas comunes

1. **Error de autenticación**:
   - Verifica que los valores de `INSTAGRAM_APP_ID` y `INSTAGRAM_APP_SECRET` sean correctos
   - Asegúrate de que la URL de redirección esté correctamente configurada en Meta for Developers

2. **Error al publicar**:
   - Confirma que la URL del video sea accesible públicamente
   - Verifica que la cuenta de Instagram sea Business o Creator
   - Asegúrate de que la página de Facebook tenga los permisos necesarios

3. **Video no procesado**:
   - Verifica que el formato del video sea compatible con Instagram Reels
   - Asegúrate de que el tamaño del video no exceda los límites

4. **Problemas con horarios**:
   - Verifica que la zona horaria seleccionada sea correcta para tu ubicación
   - Comprueba que los horarios estén configurados en formato 24 horas

### Verificación de logs

Los logs de la aplicación proporcionan información detallada sobre el proceso de publicación y posibles errores:

```bash
# Ver los logs en tiempo real
npm run dev
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo LICENSE para más detalles.

---

Desarrollado con ❤️ para creadores de contenido diario. 