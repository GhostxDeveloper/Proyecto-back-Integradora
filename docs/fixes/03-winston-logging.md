# FIX #03: Logging Estructurado con Winston

## Problema Resuelto
- Uso de `console.log` con emojis no profesional
- Logs difíciles de analizar y filtrar
- No hay persistencia de logs
- Imposible debugging de producción
- No hay rotación de archivos de log
- Logs importantes se pierden

## Solución Implementada
Sistema de logging profesional con Winston que incluye:
- Logs estructurados en formato JSON
- Rotación automática diaria de archivos
- Retención de 14 días
- Archivos separados por nivel (error, http, combined)
- Integración con errorHandler
- HTTP logging con Morgan
- Captura de excepciones no manejadas
- Formato colorizado en desarrollo

## Archivos Creados
- `src/config/logger.js` - Configuración de Winston
- `scripts/view-logs.js` - Herramienta para ver logs
- `docs/fixes/03-winston-logging.md` - Esta documentación

## Archivos Modificados
- `src/api.js` - Usa logger y Morgan
- `src/middleware/errorHandler.js` - Integra logger
- `src/controllers/atraccionCtl.js` - Ejemplo de uso
- `src/models/Atraccion.js` - Reemplaza console.log
- `package.json` - Scripts para ver logs
- `.gitignore` - Ignora directorio logs/

## Estructura de Logs
```
logs/
├── combined-2025-01-15.log    # Todos los logs
├── error-2025-01-15.log       # Solo errores
├── http-2025-01-15.log        # Requests HTTP
└── ... (archivos de días anteriores)
```

## Niveles de Log

| Nivel | Cuándo Usar | Ejemplo |
|-------|-------------|---------|
| `error` | Errores que requieren atención | Error de base de datos |
| `warn` | Situaciones anormales pero manejables | Contraseña incorrecta |
| `info` | Eventos importantes del sistema | Usuario creado |
| `http` | Requests HTTP | GET /api/users |
| `debug` | Información detallada para debugging | Valor de variable |

## Cómo Usar

### Logging básico:
```javascript
import logger from '../config/logger.js';

logger.info('Usuario creado exitosamente', { userId: user.id });
logger.warn('Intento de login fallido', { email, ip: req.ip });
logger.error('Error conectando a Firebase', { error: err.message });
logger.debug('Validando datos', { data: req.body });
```

### Logging de errores con contexto:
```javascript
logger.logError(error, {
    userId: req.user.id,
    url: req.originalUrl,
    action: 'crear_atraccion'
});
```

### Logging de operaciones exitosas:
```javascript
logger.logSuccess('Atracción creada', {
    atraccionId: nuevaAtraccion.id,
    nombre: nuevaAtraccion.nombre,
    userId: req.user.id
});
```

## Ver Logs
```bash
# Ver logs combinados (más reciente)
npm run logs

# Ver solo errores
npm run logs:error

# Ver requests HTTP
npm run logs:http
```

## Ejemplo de Log JSON
```json
{
  "timestamp": "2025-01-15 14:30:45",
  "level": "info",
  "message": "Creando nueva atracción",
  "nombre": "Cascada El Chuveje",
  "categoria": "cascada",
  "userId": "abc123"
}
```

## Beneficios
✅ Logs persistentes y estructurados
✅ Rotación automática (no crece infinitamente)
✅ Fácil debugging en producción
✅ Análisis con herramientas (grep, awk, jq)
✅ Captura excepciones críticas
✅ HTTP logging automático con Morgan
✅ Separación por niveles de severidad

## Breaking Changes
❌ Ninguno - Solo mejora el logging interno
ℹ️  Los logs ahora van a archivos, no solo consola