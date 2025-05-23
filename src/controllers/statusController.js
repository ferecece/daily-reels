const instagramModel = require('../models/instagram');
const publicationModel = require('../models/publication');
const settingsModel = require('../models/settings');
const { parseTimeToNextPublication } = require('../utils/dateUtils');
const schedulerService = require('../services/scheduler');

// Obtener estado actual de la aplicación
const getStatus = async (req, res) => {
  try {
    // Verificar conexión a Instagram
    const authInfo = await instagramModel.getLatestAuthInfo();
    const isConnected = authInfo !== null && await instagramModel.hasValidToken();
    
    // Obtener día actual
    const currentDay = await publicationModel.getCurrentDay();
    
    // Obtener última publicación
    const lastPublication = await publicationModel.getLastSuccessfulPublication();
    
    // Obtener configuración actual
    const settings = await settingsModel.getSettings();
    
    // Calcular próxima publicación
    const nextPublication = parseTimeToNextPublication(settings.schedules, settings.timezone);
    
    // Construir respuesta
    const status = {
      connected: isConnected,
      username: authInfo ? authInfo.username : null,
      currentDay: currentDay,
      timezone: settings.timezone,
      lastPublication: lastPublication ? new Date(lastPublication.publishedAt).toLocaleString('es-ES', { timeZone: settings.timezone }) : null,
      nextPublication: nextPublication
    };
    
    res.json(status);
  } catch (error) {
    console.error('Error al obtener estado:', error);
    res.status(500).json({
      error: 'Error al obtener el estado de la aplicación',
      message: error.message
    });
  }
};

// Publicar ahora mismo
const publishNow = async (req, res) => {
  try {
    // Verificar si hay una conexión activa a Instagram
    const authInfo = await instagramModel.getLatestAuthInfo();
    if (!authInfo) {
      return res.status(400).json({
        error: 'No hay una cuenta de Instagram conectada',
        message: 'Debe conectar una cuenta de Instagram antes de publicar'
      });
    }

    // Verificar que el token sea válido
    const isValid = await instagramModel.hasValidToken();
    if (!isValid) {
      return res.status(400).json({
        error: 'El token de Instagram no es válido',
        message: 'Es necesario reconectar la cuenta de Instagram'
      });
    }

    // Obtener configuración actual
    const settings = await settingsModel.getSettings();
    
    // Verificar que haya una URL de video configurada
    if (!settings.videoUrl) {
      return res.status(400).json({
        error: 'No hay una URL de video configurada',
        message: 'Configure una URL de video en la sección de configuración'
      });
    }

    // Iniciar la publicación en segundo plano
    res.status(202).json({
      success: true,
      message: 'Publicación iniciada. Este proceso puede tardar unos minutos.'
    });

    // Ejecutar la publicación después de enviar la respuesta
    try {
      await schedulerService.publishVideo(settings);
    } catch (publishError) {
      console.error('Error durante la publicación:', publishError);
      // Como ya hemos enviado la respuesta, no podemos enviar el error al cliente
    }
  } catch (error) {
    console.error('Error al iniciar publicación:', error);
    res.status(500).json({
      error: 'Error al iniciar la publicación',
      message: error.message
    });
  }
};

module.exports = {
  getStatus,
  publishNow
}; 