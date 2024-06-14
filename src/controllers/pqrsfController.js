const PQRSF = require('../models/PQRSF');
const nodemailer = require('nodemailer');
const UserDetails = require('../models/UserDetails');

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'developmentELA@gmail.com',
    pass: 'ghey kptl qckc tkbi'
  }
});

// Enviar PQRSF
exports.createPQRSF = async (req, res) => {
  const { userId, type, message } = req.body;

  try {
    const user = await UserDetails.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    }

    const pqrsf = new PQRSF({ user: userId, type, message });
    await pqrsf.save();

    // Enviar correo electrónico al administrador
    const mailOptions = {
      from: 'developmentELA@gmail.com',
      to: 'laurasofia20032@gmail.com', // Admin
      subject: `Nuevo PQRSF: ${type}`,
      text: `Usuario: ${user.email}\nTipo: ${type}\nMensaje: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ status: 'error', message: 'Error al enviar el correo electrónico' });
      } else {
        console.log('Correo electrónico enviado: ' + info.response);
        return res.status(200).json({ status: 'success', message: 'PQRSF enviado exitosamente' });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al crear PQRSF' });
  }
};

// Obtener todos los PQRSF
exports.getPQRSF = async (req, res) => {
  try {
    const pqrsfList = await PQRSF.find().populate('user', 'email name');
    res.status(200).json({ status: 'success', data: pqrsfList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener los mensajes PQRSF' });
  }
};