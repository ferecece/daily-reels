const { db } = require('../config/database');

// Guardar información de autenticación de Instagram
const saveAuthInfo = (authInfo) => {
  return new Promise((resolve, reject) => {
    const { userId, username, accessToken, tokenType, expiresIn } = authInfo;
    
    db.run(
      `INSERT INTO instagram_auth (
        user_id, username, access_token, token_type, expires_in, obtained_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, username, accessToken, tokenType, expiresIn],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        resolve({ id: this.lastID, ...authInfo });
      }
    );
  });
};

// Obtener información de autenticación más reciente
const getLatestAuthInfo = () => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM instagram_auth 
       ORDER BY obtained_at DESC 
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
            userId: row.user_id,
            username: row.username,
            accessToken: row.access_token,
            tokenType: row.token_type,
            expiresIn: row.expires_in,
            obtainedAt: row.obtained_at
          });
        }
      }
    );
  });
};

// Actualizar token de acceso
const updateAccessToken = (authInfo) => {
  return new Promise((resolve, reject) => {
    const { userId, accessToken, tokenType, expiresIn } = authInfo;
    
    db.run(
      `UPDATE instagram_auth 
       SET access_token = ?, 
           token_type = ?, 
           expires_in = ?, 
           obtained_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ?`,
      [accessToken, tokenType, expiresIn, userId],
      function(err) {
        if (err) {
          reject(err);
          return;
        }
        
        if (this.changes === 0) {
          // Si no se encontró el usuario, crear nuevo registro
          saveAuthInfo(authInfo)
            .then(resolve)
            .catch(reject);
        } else {
          resolve({ ...authInfo });
        }
      }
    );
  });
};

// Eliminar información de autenticación
const deleteAuthInfo = () => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM instagram_auth', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({ success: true });
    });
  });
};

// Verificar si hay un token de acceso válido
const hasValidToken = () => {
  return new Promise((resolve, reject) => {
    getLatestAuthInfo()
      .then(authInfo => {
        if (!authInfo) {
          resolve(false);
          return;
        }
        
        // Verificar si el token sigue siendo válido
        const obtainedAt = new Date(authInfo.obtainedAt);
        const expiresInMs = authInfo.expiresIn * 1000;
        const expirationDate = new Date(obtainedAt.getTime() + expiresInMs);
        
        // Considerar válido si falta más de un día para que expire
        const oneDayInMs = 24 * 60 * 60 * 1000;
        const now = new Date();
        const isValid = expirationDate.getTime() - now.getTime() > oneDayInMs;
        
        resolve(isValid);
      })
      .catch(reject);
  });
};

module.exports = {
  saveAuthInfo,
  getLatestAuthInfo,
  updateAccessToken,
  deleteAuthInfo,
  hasValidToken
}; 