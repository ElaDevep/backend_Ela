
// Middleware para verificar el rol de usuario
const checkUserRole = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: "error", data: "Debes iniciar sesión para acceder a esta función" });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ status: "error", data: "No tienes permisos para realizar esta acción" });
        }

        if (requiredRole === 'ELA Super Usuario' && !req.user.approved) {
            return res.status(403).json({ status: "error", data: "No tienes permisos para acceder al bloc informativo" });
        }
        

        next(); // Continúa con la siguiente función de middleware si el usuario tiene el rol requerido y la aprobación (si es necesario)
    };
};

module.exports = checkUserRole;
