import { Router } from 'express';
import {
  crearEvento,
  obtenerEventos,
  obtenerEventoPorId,
  actualizarEvento,
  eliminarEvento,
  cambiarEstadoEvento,
} from '../controllers/eventosCtl.js';

const router = Router();

// Debug de token (solo dev)
router.use((req, _res, next) => {
  if (process.env.NODE_ENV === 'development') {
    const auth = req.get('authorization') || req.get('Authorization') || '';
    if (auth) console.log('[eventos] Authorization:', auth.slice(0, 25) + '...');
  }
  next();
});

// /api/eventos
router.get('/', obtenerEventos);
router.post('/', crearEvento);

// /api/eventos/:id
router.get('/:id', obtenerEventoPorId);
router.put('/:id', actualizarEvento);
router.delete('/:id', eliminarEvento);

// /api/eventos/:id/estado
router.patch('/:id/estado', cambiarEstadoEvento);

export default router;
