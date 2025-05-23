const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Ruta para obtener la configuración actual
router.get('/', settingsController.getSettings);

// Ruta para actualizar la configuración
router.post('/', settingsController.updateSettings);

module.exports = router; 