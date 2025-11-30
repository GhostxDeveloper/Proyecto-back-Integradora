import { db } from '../lib/firebaseAdmin.js';

const COLLECTION = 'eventos';

export const createEvento = async (data) => {
  const now = new Date().toISOString();
  const evento = {
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    fecha: data.fecha,        // ISO string o 'YYYY-MM-DD'
    hora: data.hora || '',
    ubicacion: data.ubicacion || '',
    categoria: data.categoria || '',
    precio: data.precio ?? 0,
    cantidadBoletos: data.cantidadBoletos || 0,
    imagen: data.imagen || '',
    fotos: Array.isArray(data.fotos) ? data.fotos : [],
    estado: data.estado || 'activo',
    asistentes: data.asistentes ?? 0,
    destacado: !!data.destacado,
    createdAt: now,
    updatedAt: now,
  };
  const ref = await db.collection(COLLECTION).add(evento);
  return { id: ref.id, ...evento };
};

export const getEventos = async () => {
  const snap = await db.collection(COLLECTION).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getEventoById = async (id) => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

export const updateEvento = async (id, data) => {
  const patch = {
    updatedAt: new Date().toISOString(),
  };
  
  // Solo agregar campos que vengan definidos
  if (data.nombre !== undefined) patch.nombre = data.nombre;
  if (data.descripcion !== undefined) patch.descripcion = data.descripcion;
  if (data.fecha !== undefined) patch.fecha = data.fecha;
  if (data.hora !== undefined) patch.hora = data.hora;
  if (data.ubicacion !== undefined) patch.ubicacion = data.ubicacion;
  if (data.categoria !== undefined) patch.categoria = data.categoria;
  if (data.precio !== undefined) patch.precio = data.precio ?? 0;
  if (data.cantidadBoletos !== undefined) patch.cantidadBoletos = data.cantidadBoletos ?? 0;
  if (data.imagen !== undefined) patch.imagen = data.imagen;
  if (data.fotos !== undefined) patch.fotos = Array.isArray(data.fotos) ? data.fotos : [];
  if (data.estado !== undefined) patch.estado = data.estado;
  if (data.asistentes !== undefined) patch.asistentes = data.asistentes ?? 0;
  if (data.destacado !== undefined) patch.destacado = !!data.destacado;
  
  await db.collection(COLLECTION).doc(id).set(patch, { merge: true });
  return getEventoById(id);
};

export const deleteEvento = async (id) => {
  await db.collection(COLLECTION).doc(id).delete();
  return { id };
};

export const changeEstado = async (id, estado) => {
  await db.collection(COLLECTION).doc(id).set(
    { estado, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  return getEventoById(id);
};
