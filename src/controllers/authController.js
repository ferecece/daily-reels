const instagramService = require('../services/instagram');

// Redirigir al usuario a la página de autorización de Instagram
const redirectToInstagramAuth = (req, res) => {
  try {
    const authUrl = instagramService.getAuthorizationUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error al redirigir a Instagram:', error);
    res.status(500).json({
      error: 'Error al iniciar la autenticación con Instagram',
      message: error.message
    });
  }
};

// Manejar el callback de Instagram después de la autorización
const handleInstagramCallback = async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    console.error('Error en callback de Instagram:', error);
    return res.redirect('/?auth=error');
  }
  
  if (!code) {
    return res.redirect('/?auth=nocode');
  }
  
  try {
    // Intercambiar código por token
    await instagramService.exchangeCodeForToken(code);
    
    // Redirigir al usuario a la página principal con éxito
    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Error en autenticación de Instagram:', error);
    res.redirect(`/?auth=error&message=${encodeURIComponent(error.message)}`);
  }
};

// Desconectar cuenta de Instagram
const disconnectInstagram = async (req, res) => {
  try {
    await instagramService.disconnectAccount();
    res.status(200).json({ success: true, message: 'Cuenta desconectada correctamente' });
  } catch (error) {
    console.error('Error al desconectar cuenta:', error);
    res.status(500).json({
      error: 'Error al desconectar la cuenta de Instagram',
      message: error.message
    });
  }
};

module.exports = {
  redirectToInstagramAuth,
  handleInstagramCallback,
  disconnectInstagram
}; 