require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar configuración de la base de datos
const dbInit = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/auth');
const settingsRoutes = require('./routes/settings');
const statusRoutes = require('./routes/status');

// Importar servicio de programación de publicaciones
const schedulerService = require('./services/scheduler');

// Inicializar la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Rutas
app.use('/auth', authRoutes);
app.use('/settings', settingsRoutes);
app.use('/status', statusRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Inicializar la base de datos
dbInit.initDatabase()
  .then(() => {
    console.log('Base de datos inicializada correctamente');
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor iniciado en http://localhost:${PORT}`);
      
      // Iniciar el servicio de programación
      schedulerService.init();
    });
  })
  .catch(err => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
  });
