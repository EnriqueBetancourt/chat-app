// db/connection.js
const mysql = require('mysql2');
require('dotenv').config();  // Cargar las variables de entorno desde el archivo .env

// Crear la conexión a la base de datos usando las variables de entorno
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,  // Asegúrate de que esta línea esté bien
    database: process.env.DB_NAME
});

// Conectar a la base de datos
db.connect(err => {
    if (err) {
        console.error('Error al conectar con la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos: ' + process.env.DB_NAME);
});

module.exports = db;
