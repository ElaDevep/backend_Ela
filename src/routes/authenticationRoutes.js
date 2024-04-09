const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserDetails");
const { UserDetailSchema, roles } = require("../models/UserDetails");
const checkUserRole = require("../middleware/checkUserRoleMiddleware");



// Ruta para el inicio de sesión
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Buscar al usuario en la base de datos por su correo electrónico
        const user = await User.findOne({ email });

        // Si el usuario no existe, responder con un mensaje de error
        if (!user) {
            return res.status(401).send({ status: "error", data: "Correo electrónico o contraseña incorrectos" });
        }

        // Verificar si la contraseña proporcionada coincide con la contraseña almacenada
        const passwordMatch = await bcrypt.compare(password, user.password);

        // Si las contraseñas no coinciden, responder con un mensaje de error
        if (!passwordMatch) {
            return res.status(401).send({ status: "error", data: "Correo electrónico o contraseña incorrectos" });
        }

        // Si las credenciales son correctas, puedes iniciar una sesión o generar un token de autenticación
        // Generar un token de autenticación
        const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '1h' });

        // Devolver el token como respuesta
        res.send({ status: "ok", data: token });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "error", data: "Error en el servidor" });
    }
});

// Ruta para el registro de usuarios (accesible para todos)
router.post('/register', async (req, res) => {
    const { name, email, mobile, password } = req.body;

    try {
        // Validar que todos los campos requeridos estén presentes
        if (!name || !email || !password) {
            throw new Error("Se requieren el nombre, correo electrónico y contraseña");
        }

        // Validar el formato del correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("El formato del correo electrónico no es válido");
        }

        // Validar el formato del número de celular (si se proporciona)
        if (mobile) {
            const mobileRegex = /^\d{10}$/;
            if (!mobileRegex.test(mobile)) {
                throw new Error("El formato del número de celular no es válido");
            }
        }

        // Verificar si el usuario ya existe en la base de datos
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("El usuario ya existe");
        }

        // Encriptar la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear el usuario en la base de datos
        await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            role: 'Visualizador', // Asignar el rol por defecto al registrarse
            approved: false
        });

        res.send({ status: "ok", data: "Usuario creado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }
});

// Ruta post para que el administrador asigne roles a los nuevos usuarios
router.post('/admin/register', checkUserRole('Admin'), async (req, res) => {
    const { name, email, mobile, password, role } = req.body;

    try {
        // Verificar si el rol proporcionado es válido
        const validRoles = ['Admin', 'Rol Visualizador', 'Rol Carga Información', 'ELA Super Usuario'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: "error", data: "El rol proporcionado no es válido" });
        }

        // Validar que todos los campos requeridos estén presentes
        if (!name || !email || !password || !role) {
            throw new Error("Se requieren el nombre, correo electrónico, contraseña y rol");
        }

        // Validar el formato del correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("El formato del correo electrónico no es válido");
        }

        // Validar el formato del número de celular (si se proporciona)
        if (mobile) {
            const mobileRegex = /^\d{10}$/;
            if (!mobileRegex.test(mobile)) {
                throw new Error("El formato del número de celular no es válido");
            }
        }

        // Verificar si el rol proporcionado es válido
        const validRole = roles && roles.includes(role);
        if (!validRole) {
            throw new Error("El rol proporcionado no es válido");
        }

        // Verificar si el usuario ya existe en la base de datos
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: "error", data: "El usuario ya existe" });
        }

        // Encriptar la contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Crear el usuario en la base de datos con el rol proporcionado
        await User.create({
            name,
            email,
            mobile,
            password: hashedPassword,
            role,
            approved: false
        });

        res.send({ status: "ok", data: "Usuario creado correctamente con el rol asignado" });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }

});
// Ruta PUT para actualizar la información del usuario
router.put('/update/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { name, email, mobile } = req.body;

    try {
        // Validar el formato del correo electrónico (si se proporciona)
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error("El formato del correo electrónico no es válido");
            }
        }

        // Validar el formato del número de celular (si se proporciona)
        if (mobile) {
            const mobileRegex = /^\d{10}$/;
            if (!mobileRegex.test(mobile)) {
                throw new Error("El formato del número de celular no es válido");
            }
        }

        // Buscar al usuario en la base de datos por su ID
        const user = await User.findById(userId);

        // Si el usuario no existe, responder con un mensaje de error
        if (!user) {
            return res.status(404).send({ status: "error", data: "Usuario no encontrado" });
        }

        // Actualizar los campos de usuario
        user.name = name || user.name;
        user.email = email || user.email;
        user.mobile = mobile || user.mobile;

        // Guardar los cambios en la base de datos
        await user.save();

        res.send({ status: "ok", data: "Información del usuario actualizada" });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }
});

// Ruta GET para obtener la información de un usuario específico
router.get('/user/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Buscar al usuario en la base de datos por su ID
        const user = await User.findById(userId);

        // Si el usuario no existe, responder con un mensaje de error
        if (!user) {
            return res.status(404).send({ status: "error", data: "Usuario no encontrado" });
        }

        // Devolver la información del usuario como respuesta
        res.send({ status: "ok", data: user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "error", data: "Error en el servidor" });
    }
});


module.exports = router;

