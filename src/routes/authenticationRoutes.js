const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserDetails");
const { UserDetailSchema, roles } = require("../models/UserDetails");
const checkUserRole = require("../middleware/checkUserRoleMiddleware");
const path = require('path');
const fs = require('fs');


// Definir los roles válidos
const validRoles = ['Admin', 'Cliente', 'Visualizador', 'Carga Información', 'ELA Super Usuario'];

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

// Ruta para validar un token de sesión
router.post('/validate-token', async (req, res) => {
    const { token } = req.body;

    try {
        // Verificar si se proporcionó un token 
        if (!token) {
            return res.status(401).send({ status: "error", data: "Token no proporcionado" });
        }

        // Verificar el token utilizando la clave secreta ('secretKey') usada para firmarlo
        jwt.verify(token, 'secretKey', (err, decoded) => {
            if (err) {
                return res.status(401).send({ status: "error", data: "Token inválido" });
            } else {
                // El token es válido, puedes responder con los datos decodificados
                const userId = decoded.userId;
                res.send({ status: "ok", data: { userId } });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: "error", data: "Error en el servidor" });
    }
});


// Ruta post Admi clientes Rgister
router.post('/admin/registerCliente', checkUserRole('Admin'), async (req, res) => {
    const { name, lastname, mobile, idEnterprice, email, password, imgProfile, role } = req.body;

    try {
        // Validar si el rol proporcionado es válido
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: "error", data: "El rol proporcionado no es válido" });
        }

        // Validar que todos los campos requeridos estén presentes
        if (!name || !lastname || !mobile || !idEnterprice || !email || !password || !role) {
            throw new Error("Se requieren nombre, apellido, móvil, ID de empresa, correo electrónico, contraseña y rol");
        }

        // Validar el formato del correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("El formato del correo electrónico no es válido");
        }

        // Validar el formato del número de celular
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            throw new Error("El formato del número de celular no es válido");
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
            lastname,
            mobile,
            idEnterprice,
            email,
            password: hashedPassword,
            imgProfile,
            role:"Cliente"
        });

        res.send({ status: "ok", data: "Usuario creado " });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }
});

// Ruta registro Ela

router.post('/admin/registerEla', checkUserRole('Admin'), async (req, res) => {
    const { name, lastname, idEnterprice, email, password, imgProfile, role } = req.body;

    try {
        // Validar si el rol proporcionado es válido
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: "error", data: "El rol proporcionado no es válido" });
        }

        // Validar que todos los campos requeridos estén presentes
        if (!name || !lastname || !idEnterprice || !email || !password || !imgProfile || !role) {
            throw new Error("Se requieren nombre, apellido, ID de empresa, correo electrónico, contraseña, imagen de perfil y rol");
        }

        // Validar el formato del correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("El formato del correo electrónico no es válido");
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
            lastname,
            idEnterprice: "ELa",
            email,
            password: hashedPassword,
            imgProfile,
            role
        });

        res.send({ status: "ok", data: "Usuario creado " });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }
});

// Ruta para redirigir a la imagen de perfil de un usuario por su ID
router.get('/image/:userId', checkUserRole('Admin'), async (req, res) => {
    try {
        // Encuentra el usuario en la base de datos por su ID
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ status: "error", data: "Usuario no encontrado" });
        }

        // Verifica si el usuario tiene una imagen de perfil
        if (!user.imgProfile) {
            return res.status(404).json({ status: "error", data: "El usuario no tiene una imagen" });
        }

        // Redirige al navegador a la URL de la imagen
        res.redirect(user.imgProfile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", data: "Error " });
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