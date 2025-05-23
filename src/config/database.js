const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Obtener la ruta de la base de datos desde la variable de entorno o usar la ruta por defecto
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');

// Asegurarse de que el directorio data existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Crear una instancia de la base de datos
const db = new sqlite3.Database(dbPath);

// Inicializar la base de datos con las tablas necesarias
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Tabla para almacenar la configuración de la aplicación
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY,
        video_url TEXT,
        caption TEXT DEFAULT 'Día %d - Remera diaria',
        timezone TEXT DEFAULT 'America/Santiago',
        monday_time TEXT DEFAULT '9:00',
        tuesday_time TEXT DEFAULT '9:00',
        wednesday_time TEXT DEFAULT '9:00',
        thursday_time TEXT DEFAULT '9:00',
        friday_time TEXT DEFAULT '9:00',
        saturday_time TEXT DEFAULT '9:00',
        sunday_time TEXT DEFAULT '9:00',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Tabla para almacenar la información de autenticación de Instagram
      db.run(`CREATE TABLE IF NOT EXISTS instagram_auth (
        id INTEGER PRIMARY KEY,
        user_id TEXT,
        username TEXT,
        access_token TEXT,
        token_type TEXT,
        expires_in INTEGER,
        obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Tabla para almacenar el historial de publicaciones
      db.run(`CREATE TABLE IF NOT EXISTS publication_history (
        id INTEGER PRIMARY KEY,
        day_number INTEGER,
        video_url TEXT,
        caption TEXT,
        status TEXT,
        error_message TEXT,
        publication_id TEXT,
        container_id TEXT,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);
      
      // Verificar si necesitamos migrar datos antiguos
      db.get('SELECT publication_times FROM settings WHERE id = 1', (err, row) => {
        if (err) {
          // Si hay error, probablemente es porque la columna no existe (nueva instalación)
          insertDefaultSettings();
          resolve();
        } else if (row && row.publication_times) {
          // Migrar datos del formato anterior al nuevo
          migrateOldSettings(row.publication_times)
            .then(resolve)
            .catch(reject);
        } else {
          // Insertar configuración por defecto si no existe
          insertDefaultSettings();
          resolve();
        }
      });
    });
  });
};

// Insertar configuración por defecto
const insertDefaultSettings = () => {
  db.get('SELECT * FROM settings WHERE id = 1', (err, row) => {
    if (!row) {
      db.run(`INSERT INTO settings (
        id, video_url, caption, timezone, 
        monday_time, tuesday_time, wednesday_time, thursday_time, 
        friday_time, saturday_time, sunday_time
      ) VALUES (
        1, NULL, 'Día %d - Remera diaria', 'America/Santiago',
        '9:00', '9:00', '9:00', '9:00', '9:00', '9:00', '9:00'
      )`);
    }
  });
};

// Migrar configuración antigua a nueva estructura
const migrateOldSettings = (publicationTimes) => {
  return new Promise((resolve, reject) => {
    try {
      // Obtener el primer horario configurado anteriormente (o usar 9:00 por defecto)
      const defaultTime = publicationTimes.split(',')[0].trim() || '9:00';
      
      // Actualizar la tabla para quitar la columna publication_times y añadir las nuevas
      db.run(`
        PRAGMA foreign_keys=off;
        
        BEGIN TRANSACTION;
        
        -- Crear tabla temporal con la nueva estructura
        CREATE TABLE settings_temp (
          id INTEGER PRIMARY KEY,
          video_url TEXT,
          caption TEXT,
          timezone TEXT DEFAULT 'America/Santiago',
          monday_time TEXT DEFAULT '${defaultTime}',
          tuesday_time TEXT DEFAULT '${defaultTime}',
          wednesday_time TEXT DEFAULT '${defaultTime}',
          thursday_time TEXT DEFAULT '${defaultTime}',
          friday_time TEXT DEFAULT '${defaultTime}',
          saturday_time TEXT DEFAULT '${defaultTime}',
          sunday_time TEXT DEFAULT '${defaultTime}',
          created_at DATETIME,
          updated_at DATETIME
        );
        
        -- Copiar datos a la tabla temporal
        INSERT INTO settings_temp (id, video_url, caption, created_at, updated_at)
        SELECT id, video_url, caption, created_at, updated_at FROM settings;
        
        -- Eliminar tabla antigua
        DROP TABLE settings;
        
        -- Renombrar tabla temporal
        ALTER TABLE settings_temp RENAME TO settings;
        
        COMMIT;
        
        PRAGMA foreign_keys=on;
      `, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  db,
  initDatabase
}; 