import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Importar rutas
import userRoutes from './routes/userRoutes.js';

const server = express();

// Middlewares
server.use(cors());
server.use(bodyParser.json({ limit: '50mb' }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Rutas de la API
server.use('/api/users', userRoutes);


export default server;