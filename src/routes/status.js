const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');

// Ruta para obtener el estado actual de la aplicación
router.get('/', statusController.getStatus);

// Ruta para publicar ahora mismo
router.post('/publish-now', statusController.publishNow);

module.exports = router; 