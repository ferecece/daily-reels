const settingsModel = require('../models/settings');
const schedulerService = require('../services/scheduler');

// Obtener configuración actual
const getSettings = async (req, res) => {
  try {
    const settings = await settingsModel.getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      error: 'Error al obtener la configuración',
      message: error.message
    });
  }
};

// Actualizar configuración
const updateSettings = async (req, res) => {
  try {
    const { videoUrl, caption, timezone, schedules } = req.body;
    
    // Validaciones básicas
    if (!videoUrl) {
      return res.status(400).json({
        error: 'La URL del video es obligatoria'
      });
    }
    
    // Validar que videoUrl sea una URL válida
    try {
      new URL(videoUrl);
    } catch (e) {
      return res.status(400).json({
        error: 'La URL del video no es válida'
      });
    }
    
    if (!caption) {
      return res.status(400).json({
        error: 'El caption es obligatorio'
      });
    }
    
    if (!timezone) {
      return res.status(400).json({
        error: 'La zona horaria es obligatoria'
      });
    }
    
    // Validar que timezone sea válida
    try {
      // Si la zona horaria es inválida, esto generará un error
      new Date().toLocaleString('es-ES', { timeZone: timezone });
    } catch (e) {
      return res.status(400).json({
        error: 'La zona horaria no es válida'
      });
    }
    
    if (!schedules) {
      return res.status(400).json({
        error: 'Los horarios de publicación son obligatorios'
      });
    }
    
    // Validar formato de horas para cada día
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of requiredDays) {
      if (!schedules[day]) {
        return res.status(400).json({
          error: `El horario para ${day} es obligatorio`
        });
      }
      
      if (!timeRegex.test(schedules[day])) {
        return res.status(400).json({
          error: `Formato de hora inválido para ${day}: ${schedules[day]}. Use el formato HH:MM (24h)`
        });
      }
    }
    
    // Guardar configuración
    const updatedSettings = await settingsModel.updateSettings({
      videoUrl,
      caption,
      timezone,
      schedules
    });
    
    // Reprogramar publicaciones con la nueva configuración
    await schedulerService.reschedule();
    
    res.json(updatedSettings);
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({
      error: 'Error al actualizar la configuración',
      message: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings
}; 