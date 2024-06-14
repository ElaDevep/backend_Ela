const express = require('express');
const router = express.Router();
const Comentario = require('../models/Comentarios.js');
const User = require("../models/UserDetails");
const Empresa = require('../models/Empresa');
const moment = require('moment');
const Anuncio = require('../models/Anuncios.js');


router.post('/comentarios', async (req, res) => {
  try {
    const { idUsuario, texto, calificacion, idPost } = req.body;

    // Crear el nuevo comentario con los campos proporcionados
    const nuevoComentario = new Comentario({ 
      idUsuario, 
      texto,
      calificacion, 
      idPost
    });

    // Guardar el comentario en la base de datos
    const comentarioGuardado = await nuevoComentario.save();

    // Actualizar la calificación del post correspondiente (anuncio o blog)
    const post = await Anuncio.findById(idPost); // o Blog.findById(idPost), según corresponda
    const calificacionActual = post.nCalificacion;

    // Calcular el nuevo promedio de calificación
    const nuevoPromedio = ((calificacionActual * post.calificacion) + calificacion) / (calificacionActual + 1);

    // Redondear el nuevo promedio a dos decimales
    const nuevaCalificacion = parseFloat(nuevoPromedio.toFixed(2));

    // Actualizar la calificación en el post
    post.nCalificacion += 1;
    post.calificacion = nuevaCalificacion;
    await post.save();

    // Responder con el ID del comentario creado y la nueva calificación del post
    res.status(201).json({ status: 'success', comentarioId: comentarioGuardado._id, nuevaCalificacion: post.calificacion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al crear el comentario' });
  }
});


  // Ruta Get especifica
  router.get('/comentarios/:comentarioId', async (req, res) => {
    try {
      // ID del comentario específico 
      const comentarioId = req.params.comentarioId;
  
      // por su url
      const comentario = await Comentario.findById(comentarioId);
  
      if (!comentario) {
        return res.status(404).json({ status: 'error', message: 'Comentario no encontrado' });
      }
  
      // Obtener el ID del usuario que realizó el comentario
      const userId = comentario.idUsuario;
  
      // Buscar los detalles del usuario en la colección UserDetails utilizando el ID del usuario
      const userDetails = await User.findById(userId, 'name lastname imgProfile');
  
      // Si no se encuentra el usuario, puedes manejarlo según tus requisitos
      if (!userDetails) {
        // Puedes decidir si quieres responder con un error o simplemente dejar los detalles del usuario como nulos
        return res.status(404).json({ status: 'error', message: 'Detalles del usuario no encontrados' });
      }
  
      // Combinar los detalles del comentario con collection
      const combinedData = {
        ...comentario.toObject(),
        name: userDetails.name,
        lastname: userDetails.lastname,
        imgProfile: userDetails.imgProfile
      };
  
      // Responder con el comentario y los detalles del usuario
      res.status(200).json({ status: 'success', data: combinedData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status: 'error', message: 'Error al obtener el comentario y los detalles del usuario' });
    }
  });

 // Ruta Get para ver todos los comentarios
router.get('/comentarios', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // limita a 5 comentarios por pagina

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Calcular la fecha 15 días atrás
    const fechaLimite = moment().subtract(15, 'days').toDate();

    // Buscar comentarios creados en los últimos 15 días
    const comentarios = await Comentario.find({ fechaCreacion: { $gte: fechaLimite } })
      .sort({ fechaCreacion: -1 }) // Ordenar por fecha de creación descendente
      .limit(limit)
      .skip(startIndex)
      .exec();

    const totalComentarios = await Comentario.countDocuments({ fechaCreacion: { $gte: fechaLimite } });

    // Array para almacenar datos combinados de comentarios y usuarios
    const combinedDataArray = [];

    // Iterar sobre cada comentario para obtener los detalles del usuario
    for (const comentario of comentarios) {
      // Obtener el ID del usuario que realizó el comentario
      const userId = comentario.idUsuario;

      // Buscar los detalles del usuario en la colección UserDetails utilizando el ID del usuario
      const userDetails = await User.findById(userId, 'name lastname imgProfile');

      // Si se encuentra el usuario, combinar los detalles del comentario con los del usuario
      if (userDetails) {
        const combinedData = {
          ...comentario.toObject(),
          name: userDetails.name,
          lastname: userDetails.lastname,
          imgProfile: userDetails.imgProfile
        };
        combinedDataArray.push(combinedData);
      }
    }

    const paginatedResult = {
      totalComentarios: totalComentarios,
      totalPages: Math.ceil(totalComentarios / limit),
      currentPage: page,
      data: combinedDataArray
    };

    res.status(200).json({ status: 'success', data: paginatedResult });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener los comentarios paginados' });
  }
});


module.exports = router;
