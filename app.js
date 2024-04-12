const express = require("express");
const mongoose = require("mongoose");
const winston = require("winston");
const authenticationRoutes = require("./src/routes/authenticationRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const userRoutes = require("./src/routes/userRoutes");
const uploadRoutes = require("./src/routes/uploadRoutes");
const nodemailer = require('nodemailer');
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt'); 
const cors = require('cors');



// Importar el modelo de usuario
const UserDetails = require('./src/models/UserDetails');

const app = express();
app.use(cors()); // Configuración de CORS
app.use(express.json());



// Conexión a MongoDB
const mongoUrl = "mongodb+srv://adminEla:jn8LOqeW4Z1mDNpD@cluster0.rpysdem.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl)
  .then(() => {
    console.log("Base de datos conectada");

    // Configuración básica de Winston
    const logger = winston.createLogger({
      transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
      ],
    });

    // Importar modulos de rutas
    const blocInformativoRoutes = require("./src/routes/blocInformativoRoutes");

    // Montaje de las rutas
    app.use("/admin", adminRoutes);
    app.use("/auth", authenticationRoutes);
    app.use("/bloc-informativo", blocInformativoRoutes);
    app.use("/user", userRoutes);
    app.use("/upload", uploadRoutes); // Utiliza uploadRoutes en lugar de upload


    // Ruta de carga de archivos
    app.post("/upload", uploadRoutes, (req, res) => {
      res.status(200).send("Imagen cargada con éxito");
    });

    //Ruta patch para actualizar parcialmente el usuario 

    app.patch('/update/:userId', async (req, res) => {
        const userId = req.params.userId;
        const { name, email, mobile } = req.body;
      
        // Validación de datos
        if (!name &&!email &&!mobile) {
            return res.status(400).send({ status: "error", data: "No se ha proporcionado ningún dato para actualizar" });
        }
      
        try {
            // Buscar al usuario en la base de datos por su ID
            const user = await UserDetails.findById(userId);
      
            console.log("User encontrado:", user);
      
            // Si el usuario no existe, responder con un mensaje de error
            if (!user) {
                console.log("Usuario no encontrado");
                return res.status(404).send({ status: "error", data: "Usuario no encontrado" });
            }
      
            // Actualizar los campos del usuario si se proporcionan
            if (name) user.name = name;
            if (email) user.email = email;
            if (mobile) user.mobile = mobile;
      
            // Guardar los cambios en la base de datos
            await user.save();
      
            console.log("Información del usuario actualizada:", user);
      
            res.send({ status: "ok", data: "Información del usuario actualizada parcialmente" });
        } catch (error) {
            console.error(error);
            let message = "Error al actualizar la información del usuario";
      
            if (error.name === "ValidationError") {
                message = error.message;
            }
      
            res.status(400).send({ status: "error", data: message });
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

// Ruta para el restablecimiento de contraseña - Método POST
app.post('/forgot-password', async (req, res) => {
  try {
      // Verificar si el correo electrónico proporcionado existe en la base de datos
      const user = await UserDetails.findOne({ email: req.body.email });
      if (!user) {
          return res.status(404).send('Correo electrónico no encontrado');
      }

      // Generar token seguro
      const token = jwt.sign({ email: req.body.email }, 'tu_secreto', { expiresIn: '1h' });

      // Construir URL de restablecimiento de contraseña
      const resetUrl = `http://localhost:3000/restore_password?/${token}`;

      // Configurar el correo electrónico
      const mailOptions = {
          from: 'tu_correo@gmail.com',
          to: req.body.email,
          subject: 'Restablecer contraseña',
          text: `Para restablecer tu contraseña, haz clic en el siguiente enlace: ${resetUrl}`
      };

      // Enviar correo electrónico
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.log(error);
              res.status(500).send('Error al enviar el correo electrónico de restablecimiento de contraseña');
          } else {
              console.log('Correo electrónico enviado: ' + info.response);
              res.status(200).send('Correo electrónico de restablecimiento de contraseña enviado');
          }
      });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error en el servidor');
  }
});

// Ruta para validar el token y permitir el restablecimiento de contraseña - Método POST
app.post('/validate-token', async (req, res) => {
  try {
      const { token } = req.body; // Obtener el token del cuerpo de la solicitud (req.body)

      // Verificar y decodificar el token
      const decoded = jwt.verify(token, 'tu_secreto');

      // Buscar al usuario en la base de datos usando el correo electrónico decodificado
      const user = await UserDetails.findOne({ email: decoded.email });
      if (!user) {
          return res.status(404).send('Usuario no encontrado');
      }

      // El token es válido, puedes permitir al usuario restablecer la contraseña
      res.status(200).send({ valid: true, userId: user._id });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error al validar el token');
  }
});

// resetear contraseña
// Ruta para procesar el restablecimiento de contraseña

app.post('/reset-password', async (req, res) => {
  try {
      const { userId, password, confirmPassword } = req.body;

      // Verificar que las contraseñas sean iguales
      if (password !== confirmPassword) {
          return res.status(400).send('Las contraseñas no coinciden');
      }

      // Buscar al usuario por ID
      const user = await UserDetails.findById(userId);
      if (!user) {
          return res.status(404).send('Usuario no encontrado');
      }

      // Guardar la nueva contraseña en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).send('Contraseña restablecida exitosamente');
  } catch (error) {
      console.error(error);
      res.status(500).send('Error al restablecer la contraseña');
  }
});

// Ruta para consultar todos los usuarios
app.get("/usuarios", async (req, res) => {
  try {
    // Buscar todos los usuarios en la base de datos
    const usuarios = await UserDetails.find();
    
    // Responder con la lista de usuarios
    res.status(200).json({ status: "success", data: usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error al consultar los usuarios" });
  }
});


// Ruta GET para filtrar usuarios
app.get("/filter_users", async (req, res) => {
  try {
    const { name, email, mobile, role } = req.query;

    const filter = {};

    // Configurar filtros p
    if (name !== undefined) {
      // Utilizar expresión regular nombres
      const regexName = new RegExp(`^${name}`, 'i'); 
      filter.name = regexName;
    }
    
    if (email !== undefined) {
      // Filtro (exacto o parcial)
      if (email.includes('@')) {
        filter.email = email; 
      } else {
        filter.email = { $regex: `^${email}`, $options: 'i' }; 
      }
    }

    if (mobile !== undefined) {
      // Filtro para número de móvil exacto
      filter.mobile = mobile;
    }
    
    if (role !== undefined) {
      // Filtro para rol exacto
      filter.role = role;
    }

    // Realizar la búsqueda en la base de datos con el filtro
    const usuarios = await UserDetails.find(filter);

    // Responder con la lista de usuarios que coinciden con el filtro
    res.status(200).json({ status: "ok", data: usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error al filtrar usuarios" });
  }
});

    // Manejo de la ruta raíz
    app.get("/", (req, res) => {
      res.send({ status: "Inicio" });
    });

    // Iniciar el servidor
    app.listen(4000, () => {
      console.log("El servidor Node.js se ha iniciado en el puerto 4000");
    });
  })
  .catch((e) => {
    console.log(e);
  });

