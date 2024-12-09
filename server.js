const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const axios = require('axios'); // Para verificar si los servidores están activos
const apiRoutes = require('./routes/api');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurar express-session
const sessionMiddleware = session({
    secret: 'mySecret', // Cambia esto por una clave secreta más segura
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Cambia a true en producción si usas HTTPS
        httpOnly: true,
        maxAge: 3600000  // 1 hora
    }
});

app.use(sessionMiddleware);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Establecer EJS como motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configurar la conexión a la base de datos
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos: ' + process.env.DB_NAME);
});

// Lista de usuarios conectados
let users = [];

// Asociar el middleware de sesión a socket.io
io.use((socket, next) => {
    sessionMiddleware(socket.request, socket.request.res || {}, next);
});

app.use(express.static(path.join(__dirname, 'public')));

// Usar las rutas del archivo api.js
app.use('/', apiRoutes);

// Ruta para la vista del chat
app.get('/chat', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/');  // Si no hay sesión, redirigir al inicio
    }

    const query = 'SELECT * FROM messages ORDER BY created_at ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al cargar mensajes:', err);
            return res.status(500).send('Error del servidor');
        }

        res.render('chat.ejs', { username: req.session.username, messages: results });
    });
});

// Configuración de Socket.io
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    const session = socket.request.session;
    if (!session.username) {
        socket.disconnect();
        console.log('Cliente desconectado, sesión no válida');
        return;
    }

    const username = session.username;
    console.log('Usuario conectado:', username);

    // Agregar usuario a la lista de usuarios conectados
    if (!users.includes(username)) {
        users.push(username);
    }

    // Emitir lista de usuarios conectados
    io.emit('updateUsers', users);

    // Manejar el evento de enviar mensaje
    socket.on('sendMessage', (data) => {
        const query = 'INSERT INTO messages (username, message) VALUES (?, ?)';
        db.query(query, [username, data.message], (err) => {
            if (err) {
                console.error('Error al guardar mensaje:', err);
                return;
            }
            console.log('Mensaje guardado en la base de datos');
        });

        io.emit('receiveMessage', { message: data.message, username: username });
        console.log('usuario: ' + username + ' mensaje: ' + data.message);
    });

    // Desconexión del cliente
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', username);
        users = users.filter(user => user !== username); // Eliminar usuario desconectado
        io.emit('updateUsers', users); // Emitir la lista de usuarios actualizada
    });
});

// Iniciar el servidor
server.listen(3000, () => {
    console.log('Servidor proxy corriendo en http://localhost:3000');
});
