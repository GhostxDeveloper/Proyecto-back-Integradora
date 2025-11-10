import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';

// Inicializa Firebase con variables del .env (FIREBASE_*)
function getDb() {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      // appId/messagingSenderId/bucket no son estrictamente necesarios para Firestore
    });
  }
  return getFirestore();
}

// Crear evento
export const crearEvento = async (req, res, next) => {
  try {
    const { nombre, fecha } = req.body;
    if (!nombre || !fecha) {
      return res.status(400).json({ message: 'nombre y fecha son obligatorios' });
    }
    const db = getDb();
    const now = new Date().toISOString();
    const evento = {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion || '',
      fecha: req.body.fecha,
      hora: req.body.hora || '',
      ubicacion: req.body.ubicacion || '',
      categoria: req.body.categoria || '',
      precio: req.body.precio ?? 0,
      imagen: req.body.imagen || '',
      fotos: Array.isArray(req.body.fotos) ? req.body.fotos : [],
      estado: req.body.estado || 'activo',
      asistentes: req.body.asistentes ?? 0,
      destacado: !!req.body.destacado,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await addDoc(collection(db, 'eventos'), evento);
    res.status(201).json({ id: ref.id, ...evento });
  } catch (err) {
    next(err);
  }
};

// Listar eventos
export const obtenerEventos = async (_req, res, next) => {
  try {
    const db = getDb();
    const snap = await getDocs(collection(db, 'eventos'));
    const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(lista);
  } catch (err) {
    next(err);
  }
};

// Obtener por id
export const obtenerEventoPorId = async (req, res, next) => {
  try {
    const db = getDb();
    const d = await getDoc(doc(db, 'eventos', req.params.id));
    if (!d.exists()) return res.status(404).json({ message: 'Evento no encontrado' });
    res.json({ id: d.id, ...d.data() });
  } catch (err) {
    next(err);
  }
};

// Actualizar (merge)
export const actualizarEvento = async (req, res, next) => {
  try {
    const db = getDb();
    const ref = doc(db, 'eventos', req.params.id);
    const prev = await getDoc(ref);
    if (!prev.exists()) return res.status(404).json({ message: 'Evento no encontrado' });
    const patch = { ...req.body, updatedAt: new Date().toISOString() };
    await setDoc(ref, patch, { merge: true });
    const updated = await getDoc(ref);
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    next(err);
  }
};

// Eliminar
export const eliminarEvento = async (req, res, next) => {
  try {
    const db = getDb();
    const ref = doc(db, 'eventos', req.params.id);
    const prev = await getDoc(ref);
    if (!prev.exists()) return res.status(404).json({ message: 'Evento no encontrado' });
    await deleteDoc(ref);
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    next(err);
  }
};

// Cambiar estado
export const cambiarEstadoEvento = async (req, res, next) => {
  try {
    const { estado } = req.body;
    if (!estado) return res.status(400).json({ message: 'estado es obligatorio' });
    const db = getDb();
    const ref = doc(db, 'eventos', req.params.id);
    const prev = await getDoc(ref);
    if (!prev.exists()) return res.status(404).json({ message: 'Evento no encontrado' });
    await setDoc(ref, { estado, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await getDoc(ref);
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    next(err);
  }
};
