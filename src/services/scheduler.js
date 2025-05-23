const cron = require('node-cron');
const settingsModel = require('../models/settings');
const publicationModel = require('../models/publication');
const instagramService = require('./instagram');

// Lista de tareas programadas
let scheduledTasks = [];

// Inicializar el programador
const init = async () => {
  // Limpiar tareas anteriores
  clearAllTasks();
  
  try {
    // Programar la tarea de verificación de token (cada día a medianoche)
    await scheduleTokenRefresh();
    
    // Programar publicaciones según la configuración
    await schedulePublications();
    
    console.log('Servicio de programación iniciado correctamente');
  } catch (error) {
    console.error('Error al iniciar el servicio de programación:', error);
  }
};

// Programar la tarea de verificación/refresco del token
const scheduleTokenRefresh = async () => {
  // Obtener la configuración para la zona horaria
  const settings = await settingsModel.getSettings();
  const timezone = settings.timezone || 'America/Santiago';
  
  // Ejecutar todos los días a medianoche en la zona horaria configurada
  const task = cron.schedule('0 0 * * *', async () => {
    try {
      console.log('Verificando token de acceso...');
      const isValid = await instagramService.ensureValidToken();
      console.log('Estado del token:', isValid ? 'Válido' : 'No se pudo validar/refrescar');
    } catch (error) {
      console.error('Error al refrescar token de acceso:', error);
    }
  }, {
    scheduled: true,
    timezone: timezone
  });
  
  scheduledTasks.push(task);
};

// Mapeo de días de la semana para expresiones cron
const weekdayMap = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0
};

// Programar publicaciones según horarios configurados
const schedulePublications = async () => {
  try {
    // Obtener configuración
    const settings = await settingsModel.getSettings();
    
    if (!settings.videoUrl) {
      console.log('No hay URL de video configurada. No se programarán publicaciones.');
      return;
    }
    
    const timezone = settings.timezone || 'America/Santiago';
    const schedules = settings.schedules;
    
    // Programar para cada día de la semana
    Object.entries(schedules).forEach(([day, time]) => {
      if (!time) {
        console.log(`No hay horario configurado para ${day}`);
        return;
      }
      
      const [hour, minute] = time.split(':').map(Number);
      
      if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.error(`Formato de hora inválido para ${day}: ${time}`);
        return;
      }
      
      const weekday = weekdayMap[day];
      
      // Crear expresión cron (minuto hora * * dia_semana)
      // En cron, 0=domingo, 1=lunes, ..., 6=sábado
      const cronExpression = `${minute} ${hour} * * ${weekday}`;
      
      const task = cron.schedule(cronExpression, async () => {
        await publishVideo(settings);
      }, {
        scheduled: true,
        timezone: timezone
      });
      
      scheduledTasks.push(task);
      console.log(`Publicación programada para ${day} a las ${time} (${timezone})`);
    });
    
  } catch (error) {
    console.error('Error al programar publicaciones:', error);
  }
};

// Publicar un video en Instagram
const publishVideo = async (settings) => {
  try {
    // Verificar que hay un token válido
    const tokenValid = await instagramService.ensureValidToken();
    
    if (!tokenValid) {
      console.error('No hay un token válido para publicar');
      return;
    }
    
    // Obtener el día actual
    const currentDay = await publicationModel.getCurrentDay();
    
    // Formatear el caption con el número de día
    const caption = settings.caption.replace('%d', currentDay);
    
    console.log(`Intentando publicar video del día ${currentDay}...`);
    
    // Publicar el video
    const result = await instagramService.publishVideoFromUrl(settings.videoUrl, caption);
    
    // Registrar la publicación exitosa
    await publicationModel.logPublication({
      dayNumber: currentDay,
      videoUrl: settings.videoUrl,
      caption,
      status: 'success',
      publicationId: result.publicationId,
      containerId: result.containerId
    });
    
    console.log(`Video publicado exitosamente para el día ${currentDay}`);
  } catch (error) {
    console.error('Error al publicar video:', error);
    
    // Registrar el error en la base de datos
    try {
      const currentDay = await publicationModel.getCurrentDay();
      await publicationModel.logPublication({
        dayNumber: currentDay,
        videoUrl: settings.videoUrl,
        caption: settings.caption.replace('%d', currentDay),
        status: 'error',
        errorMessage: error.message
      });
    } catch (logError) {
      console.error('Error al registrar error de publicación:', logError);
    }
  }
};

// Limpiar todas las tareas programadas
const clearAllTasks = () => {
  scheduledTasks.forEach(task => task.stop());
  scheduledTasks = [];
};

// Reprogramar publicaciones (cuando cambia la configuración)
const reschedule = async () => {
  clearAllTasks();
  await scheduleTokenRefresh();
  await schedulePublications();
};

module.exports = {
  init,
  reschedule,
  publishVideo
}; 