const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/UserDetails");
const { UserDetailSchema, roles } = require("../models/UserDetails");
const checkUserRole = require("../middleware/checkUserRoleMiddleware");
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');


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
        const token = jwt.sign({ userId: user._id }, 'secretKey', { expiresIn: '7d' });

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

 // Configuración del transporter de nodemailer
 const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'developmentELA@gmail.com',
        pass: 'ghey kptl qckc tkbi'
    }
  });

  //Registro clientes

router.post('/admin/registerCliente', checkUserRole('Admin'), async (req, res) => {
    const { name, lastname, mobile, idEnterprice, email, imgProfile, role,businessName } = req.body;

    try {
        // Validar si el rol proporcionado es válido
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: "error", data: "El rol proporcionado no es válido" });
        }

        // Validar que todos los campos requeridos estén presentes
        if (!name || !lastname || !mobile || !idEnterprice || !email || !role || !businessName) {
            throw new Error("Se requieren nombre, apellido, móvil, ID de empresa, correo electrónico y rol");
        }

        // Validar el formato del correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error("El formato del correo electrónico no es válido");
        }

        // Validar el formato del celular
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(mobile)) {
            throw new Error("El formato del número de celular no es válido");
        }

        // Verificar si el usuario ya existe en la base de datos
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: "error", data: "El usuario ya existe" });
        }

        // generar contraseña temporal
        const temporaryPassword = Math.random().toString(36).slice(-8);

        //encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

        //crear usuario en la base de datos
        await User.create({
            name,
            lastname,
            mobile,
            idEnterprice,
            email,
            password: hashedPassword,
            imgProfile,
            role: "Cliente",
            businessName
        });

        // enviar correo 
        const mailOptions = {
            from: 'tu_correo@gmail.com',
            to: email,
            subject: 'Contraseña temporal',
            text: `Tu contraseña temporal es: ${temporaryPassword}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error al enviar el correo electrónico');
            } else {
                console.log('Correo electrónico enviado: ' + info.response);
                res.status(200).send('Correo electrónico enviado');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }
});

// Ruta registro Ela
router.post('/admin/registerEla', checkUserRole('Admin'), async (req, res) => {
    const { name, lastname, idEnterprice, email,imgProfile, role,businessName } = req.body;

    try {
        // Validar si el rol proporcionado es válido
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: "error", data: "El rol proporcionado no es válido" });
        }

        // Validar que todos los campos requeridos estén presentes
        if (!name || !lastname || !idEnterprice || !email || !imgProfile || !role|| !businessName) {
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

        // generar contraseña temporal
        const temporaryPassword = Math.random().toString(36).slice(-8);

        //encriptar contraseña
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(temporaryPassword, saltRounds);

        // Crear el usuario en la base de datos con el rol proporcionado
        await User.create({
            name,
            lastname,
            idEnterprice: "ELa",
            email,
            password: hashedPassword,
            imgProfile,
            role,
            businessName
        });

         // enviar correo 
         const mailOptions = {
            from: 'tu_correo@gmail.com',
            to: email,
            subject: 'Contraseña temporal',
            text: `Tu contraseña temporal es: ${temporaryPassword}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                res.status(500).send('Error al enviar el correo electrónico');
            } else {
                console.log('Correo electrónico enviado: ' + info.response);
                res.status(200).send('Correo electrónico enviado');
            }
        });
    } catch (error) {
        console.error(error);
        res.status(400).send({ status: "error", data: error.message });
    }
});

// Ruta para consultar usuarios Cliente
router.get('/admin/usuariosCliente', checkUserRole('Admin'), async (req, res) => {
    try {
        // Buscar todos los usuarios con rol "Cliente" en la base de datos
        const usuarios = await User.find({ role: "Cliente" });
        
        // Responder con la lista de usuarios Cliente
        res.status(200).json({ status: "success", data: usuarios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error al consultar los usuarios Cliente" });
    }
});

  
 // Ruta para consultar usuarios ELa
router.get('/admin/usuariosEla', checkUserRole('Admin'), async (req, res) => {
    try {
        // Buscar todos los usuarios que no tengan el rol "Cliente" en la base de datos
        const usuarios = await User.find({ role: { $ne: "Cliente" } });
        
        // Responder con la lista de usuarios ELa
        res.status(200).json({ status: "success", data: usuarios });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Error al consultar los usuarios ELa" });
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