const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para iniciar la autenticación con Instagram
router.get('/instagram', authController.redirectToInstagramAuth);

// Ruta para el callback de Instagram después de la autorización
router.get('/instagram/callback', authController.handleInstagramCallback);

// Ruta para desconectar la cuenta de Instagram
router.post('/instagram/disconnect', authController.disconnectInstagram);

module.exports = router; 