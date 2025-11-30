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
    
    console.log('🆕 Creando nuevo evento');
    console.log('🎫 cantidadBoletos recibido:', req.body.cantidadBoletos, 'tipo:', typeof req.body.cantidadBoletos);
    
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
      cantidadBoletos: Number(req.body.cantidadBoletos) || 0,
      imagen: req.body.imagen || '',
      fotos: Array.isArray(req.body.fotos) ? req.body.fotos : [],
      estado: req.body.estado || 'activo',
      asistentes: req.body.asistentes ?? 0,
      destacado: !!req.body.destacado,
      createdAt: now,
      updatedAt: now,
    };
    
    console.log('✅ cantidadBoletos que se guardará:', evento.cantidadBoletos);
    
    const ref = await addDoc(collection(db, 'eventos'), evento);
    
    console.log('✅ Evento creado con ID:', ref.id);
    
    res.status(201).json({ id: ref.id, ...evento });
  } catch (err) {
    console.error('❌ Error creando evento:', err);
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
    
    // Log para debugging
    console.log('📝 Actualizando evento:', req.params.id);
    console.log('🎫 cantidadBoletos recibido:', req.body.cantidadBoletos, 'tipo:', typeof req.body.cantidadBoletos);
    
    // Construir el objeto de actualización con valores predeterminados
    const patch = {
      updatedAt: new Date().toISOString()
    };
    
    // Solo agregar campos que vengan en el body
    if (req.body.nombre !== undefined) patch.nombre = req.body.nombre;
    if (req.body.descripcion !== undefined) patch.descripcion = req.body.descripcion;
    if (req.body.fecha !== undefined) patch.fecha = req.body.fecha;
    if (req.body.hora !== undefined) patch.hora = req.body.hora;
    if (req.body.ubicacion !== undefined) patch.ubicacion = req.body.ubicacion;
    if (req.body.categoria !== undefined) patch.categoria = req.body.categoria;
    if (req.body.precio !== undefined) patch.precio = req.body.precio ?? 0;
    if (req.body.cantidadBoletos !== undefined) {
      patch.cantidadBoletos = Number(req.body.cantidadBoletos) || 0;
      console.log('✅ cantidadBoletos agregado al patch:', patch.cantidadBoletos);
    }
    if (req.body.imagen !== undefined) patch.imagen = req.body.imagen;
    if (req.body.fotos !== undefined) patch.fotos = Array.isArray(req.body.fotos) ? req.body.fotos : [];
    if (req.body.estado !== undefined) patch.estado = req.body.estado;
    if (req.body.asistentes !== undefined) patch.asistentes = req.body.asistentes ?? 0;
    if (req.body.destacado !== undefined) patch.destacado = !!req.body.destacado;
    
    console.log('📦 Patch completo:', JSON.stringify(patch, null, 2));
    
    await setDoc(ref, patch, { merge: true });
    const updated = await getDoc(ref);
    
    console.log('✅ Evento actualizado. cantidadBoletos guardado:', updated.data().cantidadBoletos);
    
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error('❌ Error actualizando evento:', err);
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
