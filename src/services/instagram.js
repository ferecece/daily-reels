const axios = require('axios');
const instagramModel = require('../models/instagram');

// Configuración de la API de Instagram
// Usamos la versión más reciente de la Graph API según la documentación
const FACEBOOK_API_URL = 'https://graph.facebook.com';
const GRAPH_API_VERSION = 'v22.0';

// Obtener la URL de autorización para Instagram
const getAuthorizationUrl = () => {
  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
  
  if (!appId || !redirectUri) {
    throw new Error('No se han configurado INSTAGRAM_APP_ID o INSTAGRAM_REDIRECT_URI');
  }
  
  // Permisos necesarios para publicar contenido en Instagram según la documentación actualizada
  const scopes = [
    'instagram_basic',             // Información básica de Instagram
    'instagram_content_publish',   // Publicar contenido
    'pages_read_engagement',       // Leer páginas
    'pages_show_list',             // Ver lista de páginas
    'business_management'          // Administrar negocios
  ].join(',');
  
  // Usamos la API de Facebook para autorizar y luego acceder a Instagram
  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;
};

// Intercambiar el código de autorización por un token de acceso
const exchangeCodeForToken = async (code) => {
  try {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!appId || !appSecret || !redirectUri) {
      throw new Error('No se han configurado INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET o INSTAGRAM_REDIRECT_URI');
    }
    
    // Intercambiar código por token de acceso usando la API de Facebook
    const tokenResponse = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/oauth/access_token`,
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code: code
        }
      }
    );
    
    const shortLivedToken = tokenResponse.data.access_token;
    
    // Intercambiar token de corta duración por uno de larga duración
    const longLivedToken = await exchangeToLongLivedToken(shortLivedToken, appId, appSecret);
    
    // Obtener información del usuario
    const userInfo = await getInstagramBusinessAccount(longLivedToken.access_token);
    
    // Guardar información de autenticación
    await instagramModel.saveAuthInfo({
      userId: userInfo.userId,
      username: userInfo.username,
      accessToken: longLivedToken.access_token,
      tokenType: 'bearer',
      expiresIn: longLivedToken.expires_in || 60 * 24 * 60 * 60 // 60 días en segundos por defecto
    });
    
    return {
      userId: userInfo.userId,
      username: userInfo.username,
      accessToken: longLivedToken.access_token
    };
  } catch (error) {
    console.error('Error al intercambiar código por token:', error.response?.data || error.message);
    throw new Error('No se pudo obtener el token de acceso de Instagram');
  }
};

// Convertir token de corta duración a token de larga duración
const exchangeToLongLivedToken = async (shortLivedToken, appId, appSecret) => {
  try {
    const response = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken
        }
      }
    );
    
    return {
      access_token: response.data.access_token,
      token_type: 'bearer',
      expires_in: response.data.expires_in || 60 * 24 * 60 * 60 // 60 días en segundos por defecto
    };
  } catch (error) {
    console.error('Error al convertir a token de larga duración:', error.response?.data || error.message);
    throw new Error('No se pudo obtener un token de larga duración');
  }
};

// Obtener cuenta de Instagram Business asociada
const getInstagramBusinessAccount = async (accessToken) => {
  try {
    // Primero obtenemos las páginas del usuario
    const pagesResponse = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/me/accounts`,
      {
        params: {
          access_token: accessToken
        }
      }
    );
    
    if (!pagesResponse.data.data || pagesResponse.data.data.length === 0) {
      throw new Error('No se encontraron páginas de Facebook asociadas a esta cuenta');
    }
    
    // Tomamos la primera página
    const page = pagesResponse.data.data[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;
    
    // Obtenemos la cuenta de Instagram Business asociada a esta página
    const igResponse = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/${pageId}`,
      {
        params: {
          fields: 'instagram_business_account{id,username}',
          access_token: pageAccessToken
        }
      }
    );
    
    if (!igResponse.data.instagram_business_account) {
      throw new Error('No se encontró una cuenta de Instagram Business asociada a esta página');
    }
    
    return {
      userId: igResponse.data.instagram_business_account.id,
      username: igResponse.data.instagram_business_account.username,
      pageId,
      pageAccessToken
    };
  } catch (error) {
    console.error('Error al obtener cuenta de Instagram Business:', error.response?.data || error.message);
    throw new Error('No se pudo obtener información de la cuenta de Instagram Business');
  }
};

// Refrescar token de larga duración
const refreshLongLivedToken = async () => {
  try {
    const authInfo = await instagramModel.getLatestAuthInfo();
    
    if (!authInfo) {
      throw new Error('No hay token de acceso disponible');
    }
    
    // Para tokens de larga duración de Facebook, podemos obtener un nuevo token
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    
    const response = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/oauth/access_token`,
      {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: appId,
          client_secret: appSecret,
          fb_exchange_token: authInfo.accessToken
        }
      }
    );
    
    const refreshedToken = {
      userId: authInfo.userId,
      accessToken: response.data.access_token,
      tokenType: 'bearer',
      expiresIn: response.data.expires_in || 60 * 24 * 60 * 60 // 60 días por defecto
    };
    
    await instagramModel.updateAccessToken(refreshedToken);
    
    return refreshedToken;
  } catch (error) {
    console.error('Error al refrescar token:', error.response?.data || error.message);
    throw new Error('No se pudo refrescar el token de acceso');
  }
};

// Publicar un video de una URL externa (como Cloudinary) como Reel
const publishVideoFromUrl = async (videoUrl, caption) => {
  try {
    const authInfo = await instagramModel.getLatestAuthInfo();
    
    if (!authInfo) {
      throw new Error('No hay token de acceso disponible');
    }
    
    // Obtener el ID de Instagram Business y la página de Facebook
    const { igBusinessId, pageAccessToken } = await getBusinessAccountInfo(authInfo.accessToken);
    
    // Paso 1: Crear el contenedor de medios para el reel
    // Según la documentación actualizada, usamos REELS como media_type
    const containerResponse = await axios.post(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/${igBusinessId}/media`,
      null,
      {
        params: {
          media_type: 'REELS', // Tipo específico para reels según la documentación actualizada
          video_url: videoUrl,
          caption: caption,
          access_token: pageAccessToken
        }
      }
    );
    
    const containerId = containerResponse.data.id;
    console.log(`Container creado con ID: ${containerId}`);
    
    // Paso 2: Verificar el estado del contenedor de medios hasta que esté listo
    let mediaStatus = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 60; // Más intentos para videos largos
    
    while (mediaStatus === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
      
      const statusResponse = await axios.get(
        `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/${containerId}`,
        {
          params: {
            fields: 'status_code',
            access_token: pageAccessToken
          }
        }
      );
      
      mediaStatus = statusResponse.data.status_code;
      console.log(`Estado del container: ${mediaStatus}`);
      attempts++;
    }
    
    if (mediaStatus !== 'FINISHED') {
      throw new Error(`El video no se pudo procesar correctamente. Estado: ${mediaStatus}`);
    }
    
    // Paso 3: Publicar el contenedor de medios
    const publishResponse = await axios.post(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/${igBusinessId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: pageAccessToken
        }
      }
    );
    
    return {
      success: true,
      containerId: containerId,
      publicationId: publishResponse.data.id
    };
  } catch (error) {
    console.error('Error al publicar video:', error.response?.data || error.message);
    throw new Error(`Error al publicar video: ${error.response?.data?.error?.message || error.message}`);
  }
};

// Obtener información de la cuenta de Instagram Business
const getBusinessAccountInfo = async (userAccessToken) => {
  try {
    // Obtener las páginas de Facebook del usuario
    const accountResponse = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/me/accounts`,
      {
        params: {
          access_token: userAccessToken
        }
      }
    );
    
    if (!accountResponse.data.data || accountResponse.data.data.length === 0) {
      throw new Error('No se encontraron páginas de Facebook asociadas a esta cuenta');
    }
    
    // Tomar la primera página (o permitir al usuario seleccionar una en el futuro)
    const page = accountResponse.data.data[0];
    const pageId = page.id;
    const pageAccessToken = page.access_token;
    
    // Obtener la cuenta de Instagram Business asociada a esta página
    const igResponse = await axios.get(
      `${FACEBOOK_API_URL}/${GRAPH_API_VERSION}/${pageId}`,
      {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken
        }
      }
    );
    
    if (!igResponse.data.instagram_business_account) {
      throw new Error('No se encontró una cuenta de Instagram Business asociada a esta página de Facebook');
    }
    
    const igBusinessId = igResponse.data.instagram_business_account.id;
    
    return {
      pageId,
      pageAccessToken,
      igBusinessId
    };
  } catch (error) {
    console.error('Error al obtener información de la cuenta de Instagram Business:', error.response?.data || error.message);
    throw new Error('No se pudo obtener la información de la cuenta de Instagram Business');
  }
};

// Verificar si el token actual es válido y refrescarlo si es necesario
const ensureValidToken = async () => {
  const isValid = await instagramModel.hasValidToken();
  
  if (!isValid) {
    // Intentar refrescar el token
    try {
      await refreshLongLivedToken();
      return true;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return false;
    }
  }
  
  return true;
};

// Desconectar cuenta (eliminar token)
const disconnectAccount = async () => {
  return instagramModel.deleteAuthInfo();
};

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getInstagramBusinessAccount,
  refreshLongLivedToken,
  publishVideoFromUrl,
  ensureValidToken,
  disconnectAccount
}; 