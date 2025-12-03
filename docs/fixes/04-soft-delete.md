# FIX #6: Soft Delete Consistente en Todas las Entidades

## Problema Resuelto
- Inconsistencia: Algunas entidades tienen soft delete, otras hard delete
- Pérdida irreversible de datos con hard delete
- No se pueden recuperar eliminaciones accidentales
- Problemas de integridad referencial
- Sin auditoría de eliminaciones (quién, cuándo)
- Incumplimiento de requisitos legales (retención de datos)

## Solución Implementada
Sistema unificado de soft delete en TODAS las entidades:
- `delete()` marca como eliminado (no borra físicamente)
- Campos `deletedAt` y `deletedBy` para auditoría
- `getAll()` excluye eliminados automáticamente
- `restore()` para recuperar elementos
- `getDeleted()` para ver "papelera"
- `hardDelete()` para borrado permanente (requiere confirmación)
- Middleware de confirmación para operaciones irreversibles

## Archivos Modificados
- `src/models/Atraccion.js` - Soft delete completo
- `src/models/Servicio.js` - Soft delete completo
- `src/models/eventoModel.js` - Soft delete completo
- `src/controllers/atraccionCtl.js` - Nuevos endpoints
- `src/controllers/servicioController.js` - Nuevos endpoints
- `src/controllers/eventosCtl.js` - Nuevos endpoints
- `src/routes/atraccionRoutes.js` - Rutas de papelera
- `src/routes/servicioRoutes.js` - Rutas de papelera
- `src/routes/eventosRoutes.js` - Rutas de papelera

## Archivos Creados
- `src/middleware/confirmDelete.js` - Protección hard delete
- `src/scripts/migrateSoftDelete.js` - Migración de datos
- `docs/fixes/06-soft-delete.md` - Esta documentación

## Nuevos Campos en Documentos
```javascript
{
  // ... campos existentes ...
  deletedAt: null | "2025-01-15T14:30:00.000Z",
  deletedBy: null | "userId_del_admin",
  restoredAt: null | "2025-01-16T10:00:00.000Z",
  restoredBy: null | "userId_del_admin"
}
```

## Flujo de Eliminación

### 1. Soft Delete (Normal)
```javascript
// Admin elimina una atracción
DELETE /api/atracciones/abc123

// Response:
{
  "success": true,
  "message": "Atracción eliminada correctamente",
  "recoverable": true,
  "deletedAt": "2025-01-15T14:30:00.000Z"
}

// El documento NO se borra, solo se marca:
{
  deletedAt: "2025-01-15T14:30:00.000Z",
  deletedBy: "adminUserId",
  estado: "eliminada"
}
```

### 2. Ver Papelera
```javascript
// Admin consulta elementos eliminados
GET /api/atracciones/admin/deleted

// Response:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": "abc123",
      "nombre": "Cascada eliminada",
      "deletedAt": "2025-01-15T14:30:00.000Z",
      "deletedBy": "adminUserId"
    }
  ]
}
```

### 3. Restaurar
```javascript
// Admin restaura una atracción
POST /api/atracciones/abc123/restore

// Response:
{
  "success": true,
  "message": "Atracción restaurada correctamente",
  "data": { ... }
}

// El documento vuelve a estar activo:
{
  deletedAt: null,
  deletedBy: null,
  estado: "activa",
  restoredAt: "2025-01-16T10:00:00.000Z",
  restoredBy: "adminUserId"
}
```

### 4. Eliminación Permanente (Irreversible)
```javascript
// Admin elimina PERMANENTEMENTE (requiere confirmación)
DELETE /api/atracciones/abc123/permanent
Body: {
  "confirmacion": "ELIMINAR_PERMANENTEMENTE"
}

// Response:
{
  "success": true,
  "message": "Atracción eliminada permanentemente",
  "recoverable": false,
  "warning": "Esta atracción ha sido eliminada permanentemente..."
}

// El documento se BORRA físicamente de Firebase
```

## Nuevos Endpoints

### Para Atracciones:
```
GET    /api/atracciones/admin/deleted      - Listar eliminadas
POST   /api/atracciones/:id/restore        - Restaurar
DELETE /api/atracciones/:id/permanent      - Eliminar permanentemente
```

### Para Servicios:
```
GET    /api/servicios/admin/deleted
POST   /api/servicios/:id/restore
DELETE /api/servicios/:id/permanent
```

### Para Eventos:
```
GET    /api/eventos/admin/deleted
POST   /api/eventos/:id/restore
DELETE /api/eventos/:id/permanent
```

## Protección de Hard Delete

El middleware `requireDeleteConfirmation` protege contra eliminaciones accidentales:
```javascript
// Sin confirmación - RECHAZADO
DELETE /api/atracciones/abc123/permanent
Body: {}

Response (400):
{
  "success": false,
  "message": "Debes confirmar la eliminación permanente",
  "required": {
    "body": {
      "confirmacion": "ELIMINAR_PERMANENTEMENTE"
    }
  },
  "warning": "⚠️  Esta acción NO se puede deshacer..."
}
```

## Migración de Datos Existentes

Ejecutar script para agregar campos a documentos existentes:
```bash
npm run migrate:soft-delete
```

Output:
```
📦 Migrando colección: atracciones
   ✅ 25 documentos migrados

📦 Migrando colección: servicios
   ✅ 18 documentos migrados

📦 Migrando colección: eventos
   ✅ 12 documentos migrados

📊 RESUMEN TOTAL
✅ Total migrados: 55
```

## Auditoría de Eliminaciones

Todos los soft deletes y restauraciones se loguean:
```json
{
  "level": "info",
  "message": "Atracción eliminada (soft delete)",
  "atraccionId": "abc123",
  "nombre": "Cascada El Chuveje",
  "deletedBy": "adminUserId",
  "deletedAt": "2025-01-15T14:30:00.000Z"
}
```
```json
{
  "level": "warn",
  "message": "Atracción eliminada PERMANENTEMENTE",
  "atraccionId": "abc123",
  "adminId": "adminUserId",
  "warning": "Esta acción no se puede deshacer"
}
```

## Consultas

### Listar solo activos (comportamiento por defecto):
```javascript
const atracciones = await Atraccion.getAll();
// Excluye automáticamente los eliminados
```

### Listar TODOS (incluyendo eliminados):
```javascript
const snapshot = await db.collection('atracciones').get();
const todos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
```

### Listar solo eliminados:
```javascript
const eliminados = await Atraccion.getDeleted();
```

## Beneficios
✅ Recuperación de eliminaciones accidentales
✅ Auditoría completa (quién, cuándo, qué)
✅ Protección contra pérdida de datos
✅ Cumplimiento legal (retención de datos)
✅ Integridad referencial preservada
✅ Confirmación requerida para borrados permanentes
✅ Consistencia en todas las entidades

## Breaking Changes
⚠️  **Comportamiento de DELETE cambió:**
- Antes: Borraba permanentemente
- Ahora: Marca como eliminado (recuperable)

✅ **Migración automática**: Script agrega campos a documentos existentes

⚠️  **Código frontend debe adaptarse:**
- Las listas no incluyen eliminados automáticamente
- Agregar funcionalidad de "papelera" en admin panel
- Agregar botón "restaurar" para elementos eliminados

## Recomendaciones

1. **Purga periódica**: Considera eliminar permanentemente registros antiguos (>1 año)
2. **Política de retención**: Define cuánto tiempo conservar eliminados
3. **Backup antes de hard delete**: Siempre hacer backup antes de borrar permanentemente
4. **Permisos estrictos**: Solo super-admins pueden hacer hard delete
5. **Documentar razones**: Guardar motivo de eliminaciones importantes