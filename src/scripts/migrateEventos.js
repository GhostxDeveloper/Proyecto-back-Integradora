/**
 * Script para migrar eventos existentes agregando el campo cantidadBoletos
 * 
 * Uso:
 * node src/scripts/migrateEventos.js
 */

import { db } from '../lib/firebaseAdmin.js';

async function migrateEventos() {
  try {
    console.log('🔄 Iniciando migración de eventos...\n');
    
    const eventosRef = db.collection('eventos');
    const snapshot = await eventosRef.get();
    
    if (snapshot.empty) {
      console.log('⚠️  No hay eventos para migrar');
      return;
    }
    
    console.log(`📊 Total de eventos encontrados: ${snapshot.size}\n`);
    
    let migrados = 0;
    let yaExistian = 0;
    let errores = 0;
    
    // Procesar cada evento
    const batch = db.batch();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      
      // Si el campo ya existe, no hacer nada
      if (data.cantidadBoletos !== undefined) {
        console.log(`✓ ${doc.id} - "${data.nombre}" ya tiene cantidadBoletos: ${data.cantidadBoletos}`);
        yaExistian++;
        return;
      }
      
      // Agregar el campo con valor por defecto 0
      console.log(`→ ${doc.id} - "${data.nombre}" se agregará cantidadBoletos: 0`);
      batch.update(doc.ref, {
        cantidadBoletos: 0,
        updatedAt: new Date().toISOString()
      });
      migrados++;
    });
    
    // Ejecutar el batch si hay cambios
    if (migrados > 0) {
      console.log('\n⏳ Aplicando cambios...');
      await batch.commit();
      console.log('✅ Cambios aplicados correctamente\n');
    }
    
    // Resumen
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Eventos migrados: ${migrados}`);
    console.log(`ℹ️  Ya tenían el campo: ${yaExistian}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📦 Total procesados: ${snapshot.size}`);
    console.log('═══════════════════════════════════════\n');
    
    if (migrados > 0) {
      console.log('✨ Migración completada exitosamente');
    } else {
      console.log('ℹ️  No se requirieron cambios');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
console.log('\n╔═══════════════════════════════════════╗');
console.log('║  MIGRACIÓN: CAMPO cantidadBoletos    ║');
console.log('║  Colección: eventos                   ║');
console.log('╚═══════════════════════════════════════╝\n');

migrateEventos()
  .then(() => {
    console.log('\n✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
