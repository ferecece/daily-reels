const { db } = require('../config/database');

// Registrar una nueva publicación
const logPublication = (publication) => {
  return new Promise((resolve, reject) => {
    const { 
      dayNumber, 
      videoUrl, 
      caption, 
      status, 
      errorMessage = null, 
      publicationId = null,
      containerId = null 
    } = publication;
    
    db.run(
      `INSERT INTO publication_history (
        day_number, video_url, caption, status, error_message, publication_id, container_id, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [dayNumber, videoUrl, caption, status, errorMessage, publicationId, containerId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({ id: this.lastID, ...publication });
      }
    );
  });
};

// Obtener la última publicación exitosa
const getLastSuccessfulPublication = () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM publication_history 
       WHERE status = 'success' 
       ORDER BY published_at DESC 
       LIMIT 1`,
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row) {
          resolve(null);
        } else {
          resolve({
            id: row.id,
            dayNumber: row.day_number,
            videoUrl: row.video_url,
            caption: row.caption,
            status: row.status,
            errorMessage: row.error_message,
            publicationId: row.publication_id,
            containerId: row.container_id,
            publishedAt: row.published_at
          });
        }
      }
    );
  });
};

// Obtener todas las publicaciones de un día específico
const getPublicationsByDay = (dayNumber) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM publication_history 
       WHERE day_number = ? 
       ORDER BY published_at DESC`,
      [dayNumber],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const publications = rows.map(row => ({
          id: row.id,
          dayNumber: row.day_number,
          videoUrl: row.video_url,
          caption: row.caption,
          status: row.status,
          errorMessage: row.error_message,
          publicationId: row.publication_id,
          containerId: row.container_id,
          publishedAt: row.published_at
        }));
        
        resolve(publications);
      }
    );
  });
};

// Obtener el día actual (último día + 1, o 1 si no hay publicaciones previas)
const getCurrentDay = () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT MAX(day_number) as max_day 
       FROM publication_history 
       WHERE status = 'success'`,
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!row || !row.max_day) {
          resolve(1); // Primer día si no hay publicaciones previas
        } else {
          resolve(row.max_day + 1);
        }
      }
    );
  });
};

// Obtener publicaciones recientes
const getRecentPublications = (limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM publication_history 
       ORDER BY published_at DESC 
       LIMIT ?`,
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const publications = rows.map(row => ({
          id: row.id,
          dayNumber: row.day_number,
          videoUrl: row.video_url,
          caption: row.caption,
          status: row.status,
          errorMessage: row.error_message,
          publicationId: row.publication_id,
          containerId: row.container_id,
          publishedAt: row.published_at
        }));
        
        resolve(publications);
      }
    );
  });
};

module.exports = {
  logPublication,
  getLastSuccessfulPublication,
  getPublicationsByDay,
  getCurrentDay,
  getRecentPublications
}; 