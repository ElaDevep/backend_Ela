
// Solo administrador

const express = require("express"); 
const router = express.Router(); 
const bcrypt = require("bcrypt"); 
const checkUserRole = require("../middleware/checkUserRoleMiddleware"); 
const UserDetails = require("../models/UserDetails"); // Asegúrate de que la ruta sea correcta

// Ruta DELETE para eliminar usuarios (solo para administradores)

router.delete('/user/:userId', async (req, res) => { 
  const userId = req.params.userId;
   try { 
     const deletedUser = await UserDetails.findByIdAndDelete(userId); 
     if (!deletedUser) { 
       return res.status(404).send({ error: "El usuario no pudo ser encontrado" }); 
     } 
     res.send({ message: "El usuario ha sido eliminado exitosamente" }); 
  } catch (error) { 
    console.error(error); 
    res.status(500).send({ error: "Error al eliminar el usuario" }); 
  } 
});


module.exports = router;
