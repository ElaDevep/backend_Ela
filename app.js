const express = require("express");
const mongoose = require("mongoose");
const uploadRoutes = require("./src/routes/uploadRoutes"); // Importa el módulo uploadRoutes
const adminRoutes = require("./src/routes/adminRoutes"); // Importa adminRoutes
const userRoutes = require("./src/routes/userRoutes"); // Importa userRoutes
const UserDetails = require("./src/models/UserDetails"); // Importa UserDetails
const app = express();

app.use(express.json());

// Conexión a MongoDB
const mongoUrl = "mongodb+srv://adminEla:jn8LOqeW4Z1mDNpD@cluster0.rpysdem.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(mongoUrl)
    .then(() => {
        console.log('Base de datos conectada');
    })
    .catch((e) => {
        console.log(e);
    });

// Importar modulos de rutas
const authenticationRoutes = require("./src/routes/authenticationRoutes");
const blocInformativoRoutes = require("./src/routes/blocInformativoRoutes");
const upload = require("./src/routes/uploadRoutes");

// Montaje de las rutas
app.use('/admin', adminRoutes);
app.use('/auth', authenticationRoutes);
app.use('/bloc-informativo', blocInformativoRoutes);
app.use('/user', userRoutes);
app.use('/upload', uploadRoutes); // Utiliza uploadRoutes en lugar de upload

// Ruta de carga de archivos
app.post('/upload', upload, (req, res) => {
    res.status(200).send('Imagen cargada con éxito');
});

// Manejo de la ruta raíz
app.get("/", (req, res) => {
    res.send({ status: "Inicio" });
});

// Iniciar el servidor
app.listen(4000, () => {
    console.log("El servidor Node.js se ha iniciado en el puerto 4000");
});