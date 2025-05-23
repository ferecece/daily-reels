const { db } = require('../config/database');

// Obtener configuración actual
const getSettings = () => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        // Si no hay configuración, devolver valores por defecto
        resolve({
          videoUrl: null,
          caption: 'Día %d - Remera diaria',
          timezone: 'America/Santiago',
          schedules: {
            monday: '9:00',
            tuesday: '9:00',
            wednesday: '9:00',
            thursday: '9:00',
            friday: '9:00',
            saturday: '9:00',
            sunday: '9:00'
          }
        });
      } else {
        // Transformar a formato camelCase para la API
        resolve({
          videoUrl: row.video_url,
          caption: row.caption,
          timezone: row.timezone,
          schedules: {
            monday: row.monday_time,
            tuesday: row.tuesday_time,
            wednesday: row.wednesday_time,
            thursday: row.thursday_time,
            friday: row.friday_time,
            saturday: row.saturday_time,
            sunday: row.sunday_time
          }
        });
      }
    });
  });
};

// Actualizar configuración
const updateSettings = (settings) => {
  return new Promise((resolve, reject) => {
    const { videoUrl, caption, timezone, schedules } = settings;
    
    db.run(
      `UPDATE settings 
       SET video_url = ?, 
           caption = ?, 
           timezone = ?,
           monday_time = ?,
           tuesday_time = ?,
           wednesday_time = ?,
           thursday_time = ?,
           friday_time = ?,
           saturday_time = ?,
           sunday_time = ?,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = 1`,
      [
        videoUrl, 
        caption, 
        timezone,
        schedules.monday,
        schedules.tuesday,
        schedules.wednesday,
        schedules.thursday,
        schedules.friday,
        schedules.saturday,
        schedules.sunday
      ],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          // Si no se actualizó ninguna fila, insertar nueva configuración
          db.run(
            `INSERT INTO settings (
              id, video_url, caption, timezone,
              monday_time, tuesday_time, wednesday_time, thursday_time,
              friday_time, saturday_time, sunday_time
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              videoUrl, 
              caption, 
              timezone,
              schedules.monday,
              schedules.tuesday,
              schedules.wednesday,
              schedules.thursday,
              schedules.friday,
              schedules.saturday,
              schedules.sunday
            ],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              
              resolve({
                videoUrl,
                caption,
                timezone,
                schedules
              });
            }
          );
        } else {
          resolve({
            videoUrl,
            caption,
            timezone,
            schedules
          });
        }
      }
    );
  });
};

module.exports = {
  getSettings,
  updateSettings
}; 