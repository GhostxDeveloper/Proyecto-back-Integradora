import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Importar rutas
import userRoutes from './routes/userRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import atraccionRoutes from './routes/atraccionRoutes.js';
import eventosRoutes from './routes/eventosRoutes.js';

const server = express();

// Middlewares
server.use(cors());
server.use(bodyParser.json({ limit: '50mb' }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Rutas de la API
server.use('/api/users', userRoutes);
server.use('/api/restaurants', restaurantRoutes);
server.use('/api/dishes', dishRoutes);
server.use('/api/atracciones', atraccionRoutes);
server.use('/api/eventos', eventosRoutes);

export default server;