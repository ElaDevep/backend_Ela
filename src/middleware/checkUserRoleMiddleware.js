const jwt = require("jsonwebtoken");
const User = require("../models/UserDetails");

// Definir los roles válidos
const validRoles = ['Admin', 'Cliente', 'Visualizador', 'Carga Información', 'ELA Super Usuario'];

// Middleware para verificar el rol de usuario
const checkUserRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization.split(" ")[1]; // Obtener el token del encabezado Authorization

            // Verificar si se proporcionó un token 
            if (!token) {
                return res.status(401).json({ status: "error", data: "Token no proporcionado" });
            }

            // Verificar el token utilizando la clave secreta ('secretKey') usada para firmarlo
            const decoded = jwt.verify(token, 'secretKey');

            // Verificar el rol del usuario
            const user = await User.findById(decoded.userId);
            if (!user || !validRoles.includes(user.role)) {
                return res.status(403).json({ status: "error", data: "No tienes permisos para realizar esta acción" });
            }

            // Continuar con la siguiente función de middleware si el usuario tiene el rol requerido
            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: "error", data: "Error en el servidor" });
        }
    };
};

module.exports = checkUserRole;
