const bcrypt = require('bcrypt');
const db = require('../db/connection');  // Conexión a la base de datos

// Función para registrar un usuario
const registerUser = (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    // Validar si el correo o el nombre de usuario ya existen
    db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error en la consulta a la base de datos' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'El correo o el nombre de usuario ya están registrados' });
        }

        // Encriptar la contraseña
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                return res.status(500).json({ error: 'Error al encriptar la contraseña' });
            }

            // Insertar el nuevo usuario en la base de datos
            const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
            db.query(query, [username, email, hashedPassword], (err, results) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }
                console.log(`Usuario ${username} registrado`);
                res.redirect('/login'); // Redirigir al login después del registro exitoso
            });
        });
    });
};

const loginUser = (req, res) => {
    const { usernameOrEmail, password } = req.body; // Cambiado a `usernameOrEmail`

    if (!usernameOrEmail || !password) {
        return res.status(400).send('Faltan credenciales');
    }

    const query = `
        SELECT * FROM users 
        WHERE username = ? OR email = ?
    `;
    db.query(query, [usernameOrEmail, usernameOrEmail], async (err, results) => {
        if (err) {
            console.error('Error al buscar usuario:', err);
            return res.status(500).send('Error del servidor');
        }

        if (results.length === 0) {
            return res.status(401).send('Usuario o contraseña incorrectos');
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).send('Usuario o contraseña incorrectos');
        }

        req.session.username = user.username;
        console.log(`Usuario ${user.username} ha iniciado sesión`);
        res.redirect('/chat');
    });
};

module.exports = { registerUser, loginUser };