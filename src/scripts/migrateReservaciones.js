import { db } from '../config/firebase.js';

/**
 * Script de migración para actualizar reservaciones existentes
 * Convierte numeroPersonas → cantidadBoletos
 * Agrega campo tipoServicio si no existe
 */
async function migrateReservaciones() {
    console.log('🔄 Iniciando migración de reservaciones...\n');
    
    try {
        const snapshot = await db.collection('reservaciones').get();
        
        if (snapshot.empty) {
            console.log('✅ No hay reservaciones para migrar.');
            return;
        }

        console.log(`📋 Encontradas ${snapshot.size} reservaciones para revisar\n`);
        
        let migradas = 0;
        let sinCambios = 0;
        const errores = [];

        // Procesar cada reservación
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const updates = {};
            let needsUpdate = false;

            // 1. Migrar numeroPersonas a cantidadBoletos
            if (data.numeroPersonas && !data.cantidadBoletos) {
                updates.cantidadBoletos = data.numeroPersonas;
                needsUpdate = true;
            }

            // 2. Agregar tipoServicio si no existe
            if (!data.tipoServicio) {
                updates.tipoServicio = 'servicio'; // Valor por defecto
                needsUpdate = true;
            }

            // 3. Aplicar actualizaciones si es necesario
            if (needsUpdate) {
                try {
                    await db.collection('reservaciones').doc(doc.id).update(updates);
                    migradas++;
                    console.log(`✅ Migrada: ${doc.id}`);
                    if (updates.cantidadBoletos) {
                        console.log(`   - numeroPersonas (${data.numeroPersonas}) → cantidadBoletos (${updates.cantidadBoletos})`);
                    }
                    if (updates.tipoServicio) {
                        console.log(`   - Agregado tipoServicio: ${updates.tipoServicio}`);
                    }
                    console.log('');
                } catch (error) {
                    errores.push({ id: doc.id, error: error.message });
                    console.error(`❌ Error en ${doc.id}:`, error.message);
                }
            } else {
                sinCambios++;
            }
        }

        // Resumen final
        console.log('\n' + '='.repeat(50));
        console.log('📊 RESUMEN DE MIGRACIÓN');
        console.log('='.repeat(50));
        console.log(`Total revisadas:    ${snapshot.size}`);
        console.log(`✅ Migradas:        ${migradas}`);
        console.log(`⏭️  Sin cambios:     ${sinCambios}`);
        console.log(`❌ Errores:         ${errores.length}`);
        
        if (errores.length > 0) {
            console.log('\n⚠️  Reservaciones con errores:');
            errores.forEach(e => console.log(`   - ${e.id}: ${e.error}`));
        }
        
        console.log('\n✨ Migración completada!\n');

    } catch (error) {
        console.error('❌ Error fatal en la migración:', error);
        throw error;
    }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateReservaciones()
        .then(() => {
            console.log('👋 Proceso finalizado');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Error:', error);
            process.exit(1);
        });
}

export default migrateReservaciones;
