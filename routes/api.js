const express = require('express');
const path = require('path');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/chatController');

// Ruta para registrar usuario
router.post('/register', registerUser);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Ruta para mostrar la vista de inicio
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Ruta para la página de inicio de sesión
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Ruta para la página de registro
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'registro.html'));
});

module.exports = router;