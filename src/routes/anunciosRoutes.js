const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Anuncio = require('../models/Anuncios.js');
const User = require("../models/UserDetails");
const Empresa = require('../models/Empresa');




// Ruta para crear un nuevo blog (dentro de la colección de anuncios)
router.post('/blog', async (req, res) => {
  try {
    const { title, contenido, idAutor, fechaCreacion, idEnterprise, tipo, calificacion, nCalificacion, imgFrontpage, resumen } = req.body;

    // Crear el nuevo blog con los campos proporcionados
    const newBlog = new Anuncio({ 
      title,
      contenido, 
      idAuthor: idAutor,
      fechaCreacion, 
      idEnterprise, 
      tipo, 
      aprobado: false, 
      revision: false, 
      calificacion, 
      nCalificacion, 
      imgFrontpage,
      resumen
    });

    // Guardar el blog en la base de datos (en la colección de anuncios)
    const savedBlog = await newBlog.save();

    // Responder con el ID del blog creado
    res.status(201).json({ status: 'success', blogId: savedBlog._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al crear el blog' });
  }
});

// Ruta para crear un nuevo anuncio
router.post('/advert', async (req, res) => {
  try {
    const { title, contenido, idAutor, fechaCreacion, idEnterprise, tipo, calificacion, nCalificacion, imgFrontpage,resumen } = req.body;

    // Crear el nuevo anuncio con los campos proporcionados
    const newAnuncio = new Anuncio({ 
      title,
      contenido, 
      idAuthor: idAutor, 
      fechaCreacion, 
      idEnterprise, 
      tipo, 
      aprobado: true, 
      revision: true, 
      calificacion, 
      nCalificacion, 
      imgFrontpage,
      resumen
    });

    // Guardar el anuncio en la base de datos
    const savedAnuncio = await newAnuncio.save();

    // Responder con el ID del anuncio creado
    res.status(201).json({ status: 'success', anuncioId: savedAnuncio._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al crear el anuncio' });
  }
});

// Rta Get Especifica
router.get('/ads_blogs/:adId', async (req, res) => {
  try {
    // ID del anuncio/blog específico tomado de los parámetros de la solicitud
    const adsBlogsId = req.params.adId;

    // Buscar el anuncio/blog en la base de datos por su ID
    const adsBlog = await Anuncio.findById(adsBlogsId);

    if (!adsBlog) {
      return res.status(404).json({ status: 'error', message: 'Anuncio/blog no encontrado' });
    }

    // Obtener el ID del autor del anuncio/blog
    const authorId = adsBlog.idAuthor;

    // Buscar los detalles del usuario en la colección UserDetails utilizando el ID del autor
    const userDetails = await User.findById(authorId, 'name lastname imgProfile');

    // Si no se encuentra el usuario, puedes manejarlo según tus requisitos
    if (!userDetails) {
      return res.status(404).json({ status: 'error', message: 'Detalles del usuario no encontrados' });
    }

    // Obtener el ID de la empresa asociada al anuncio/blog
    const enterpriseId = adsBlog.idEnterprise;

    // Establecer razonSocial basado en idEnterprise
    let razonSocial = '';

    if (enterpriseId === '01') {
      razonSocial = 'Ela Sustentable';
    } else {
      // Buscar la empresa en la colección Empresa utilizando el ID de la empresa en el anuncio/blog
      const empresa = await Empresa.findById(enterpriseId);

      // Si no se encuentra la empresa, puedes manejarlo según tus requisitos
      if (!empresa) {
        return res.status(404).json({ status: 'error', message: 'Empresa no encontrada' });
      }

      razonSocial = empresa.razonSocial;
    }

    // Combinar los detalles del usuario, el anuncio/blog y la razón social de la empresa
    const combinedData = {
      ...adsBlog.toObject(),
      name: userDetails.name,
      lastname: userDetails.lastname,
      imgProfile: userDetails.imgProfile,
      razonSocial: razonSocial
    };

    // Responder con el anuncio/blog, los detalles del usuario y la razón social de la empresa
    res.status(200).json({ status: 'success', data: combinedData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener el anuncio/blog, los detalles del usuario y la razón social de la empresa' });
  }
});

// rta get para todos
router.get('/ads_blogs', async (req, res) => {
  try {
    // Página actual y tamaño de página, si no se especifican, los valores predeterminados son 1 y 10 respectivamente
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;

    // Calcular el índice de inicio y fin para la paginación
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;

    // Calcular la fecha límite para los últimos 15 días
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    // Base de datos: Buscar anuncios/blogs con fecha de creación en los últimos 15 días
    const adsBlogs = await Anuncio.find({ fechaCreacion: { $gte: fifteenDaysAgo } })
                                  .sort({ fechaCreacion: -1 })
                                  .skip(startIndex)
                                  .limit(pageSize);

    // Array para almacenar los datos combinados de cada anuncio/blog
    const combinedDataArray = [];

    // Iterar sobre cada anuncio/blog 
    for (const adsBlog of adsBlogs) {
      const authorId = adsBlog.idAuthor;

      // Buscar los detalles del usuario en la colección 
      const userDetails = await User.findById(authorId, 'name lastname imgProfile');

      // Si no se encuentra el usuario, puedes manejarlo según tus requisitos
      if (!userDetails) {
        continue; 
      }

      // Obtener el ID de la empresa asociada al anuncio/blog
      const enterpriseId = adsBlog.idEnterprise;

      // Establecer razonSocial basado en idEnterprise
      let razonSocial = '';

      if (enterpriseId === '01') {
        razonSocial = 'Ela Sustentable';
      } else {
        // Buscar la empresa en la colección Empresa 
        const empresa = await Empresa.findById(enterpriseId);

        // Si no se encuentra la empresa, puedes manejarlo según tus requisitos
        if (!empresa) {
          continue;  
        }
        razonSocial = empresa.razonSocial;
      }

      // Combinar los detalles 
      const combinedData = {
        ...adsBlog.toObject(),
        name: userDetails.name,
        lastname: userDetails.lastname,
        imgProfile: userDetails.imgProfile,
        razonSocial: razonSocial
      };

      // Agregar los datos combinados al array
      combinedDataArray.push(combinedData);
    }

    // Responder con la lista de anuncios/blogs y sus detalles
    res.status(200).json({ status: 'success', data: combinedDataArray });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener los anuncios/blogs y sus detalles' });
  }
});



// Ruta para actualizar 
router.patch('/review/:id', async (req, res) => {
  try {
    const anuncioId = req.params.id;
    const { aprobado, revision } = req.body;

    // Buscar un anuncio por su ID
    const anuncio = await Anuncio.findById(anuncioId);

    if (!anuncio) {
      return res.status(404).json({ status: 'error', message: 'Anuncio no encontrado' });
    }

    // Actualizar los campos del anuncio
    if (typeof aprobado === 'boolean') {
      anuncio.aprobado = aprobado;
    }
    if (typeof revision === 'string') {
      anuncio.revision = revision;
    }

    // Guardar los cambios en la base de datos
    await anuncio.save();

    res.status(200).json({ status: 'success', data: anuncio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al actualizar el anuncio' });
  }
});

// Ruta  anuncios/blogs aprobados
router.get('/approved_ads_blogs', async (req, res) => {
  try {
    // Buscar todos los anuncios/blogs con aprobado: true en la base de datos
    const approvedAdsBlogs = await Anuncio.find({ aprobado: true });

    // Responder con la lista de anuncios/blogs aprobados
    res.status(200).json({ status: 'success', data: approvedAdsBlogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener los anuncios/blogs aprobados' });
  }
});

// rta anuncios/blogs no aprobados
router.get('/unapproved_ads_blogs', async (req, res) => {

  try{
   // buscar los no aprobados 
   const unapprovedAdsBlogs = await Anuncio.find({ aprobado: false });
   // responder con la lista de anuncios/blogs no aprobados
   res.status(200).json({ status: 'success', data: unapprovedAdsBlogs});
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Error al obtener los anuncios/blogs no aprobados' });
  }

});

module.exports = router;


