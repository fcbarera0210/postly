import { neon } from '@neondatabase/serverless'
import { resolveDatabaseUrl, resolveDatabaseUrlForMigrations } from '../utils/resolve-database-url'
import {
  applyFullSchemaFiles,
  applyLegacyMigrationFiles,
  applyPhase2MigrationFiles,
  applyPhase3MigrationFiles,
  applyPhase4MigrationFiles,
  verifyPhase1Schema,
  verifyPhase2Schema,
  verifyPhase3Schema,
  verifyPhase4Schema
} from '../utils/apply-legacy-migration'

export default defineNitroPlugin(async () => {
  const urlPooled = resolveDatabaseUrl()
  const urlMigrate = resolveDatabaseUrlForMigrations() || urlPooled
  if (!urlMigrate) {
    console.warn('[postly] Sin DATABASE_URL: no se verifica el esquema.')
    return
  }

  const hostHint = (() => {
    try {
      return new URL(urlMigrate).hostname
    } catch {
      return '(url inválida)'
    }
  })()

  const sqlMigrate = neon(urlMigrate)
  const sqlCheck = neon(urlMigrate)

  try {
    const ok1 = await verifyPhase1Schema(sqlCheck)
    const ok2 = ok1 ? await verifyPhase2Schema(sqlCheck) : false
    const ok3 = ok1 && ok2 ? await verifyPhase3Schema(sqlCheck) : false
    const ok4 = ok1 && ok2 && ok3 ? await verifyPhase4Schema(sqlCheck) : false

    if (ok1 && ok2 && ok3 && ok4) return

    if (ok1 && ok2 && ok3 && !ok4) {
      console.warn('[postly] Falta columna tasks.description. Aplicando migrate_phase4.sql…')
      try {
        await applyPhase4MigrationFiles(sqlMigrate)
        if (await verifyPhase4Schema(sqlCheck)) {
          console.info('[postly] Esquema Fase 4 aplicado al arranque.')
          return
        }
      } catch (e) {
        console.error('[postly] Error al aplicar Fase 4:', e)
      }
      console.error('[postly] Ejecuta manualmente: npm run db:migrate-phase4 o database/migrate_phase4.sql en Neon.')
      return
    }

    if (ok1 && ok2 && !ok3) {
      console.warn('[postly] Falta Fase 3 (p. ej. users.display_name). Aplicando migrate_phase3.sql…')
      try {
        await applyPhase3MigrationFiles(sqlMigrate)
        if (await verifyPhase3Schema(sqlCheck)) {
          console.info('[postly] Esquema Fase 3 aplicado al arranque.')
          if (!(await verifyPhase4Schema(sqlCheck))) {
            try {
              await applyPhase4MigrationFiles(sqlMigrate)
              if (await verifyPhase4Schema(sqlCheck)) {
                console.info('[postly] Esquema Fase 4 aplicado al arranque.')
              }
            } catch (e) {
              console.error('[postly] Error al aplicar Fase 4 tras Fase 3:', e)
            }
          }
          return
        }
      } catch (e) {
        console.error('[postly] Error al aplicar Fase 3:', e)
      }
      console.error('[postly] Ejecuta manualmente: npm run db:migrate-phase3 o pega database/migrate_phase3.sql en Neon.')
      return
    }

    if (ok1 && !ok2) {
      console.warn('[postly] Faltan tablas Fase 2 (task_comments / task_assignees). Aplicando migrate_phase2.sql…')
      try {
        await applyPhase2MigrationFiles(sqlMigrate)
        if (await verifyPhase2Schema(sqlCheck)) {
          console.info('[postly] Esquema Fase 2 aplicado al arranque.')
          if (!(await verifyPhase3Schema(sqlCheck))) {
            try {
              await applyPhase3MigrationFiles(sqlMigrate)
            } catch (e) {
              console.error('[postly] Error al aplicar Fase 3 tras Fase 2:', e)
            }
          }
          if (await verifyPhase3Schema(sqlCheck)) {
            return
          }
        }
      } catch (e) {
        console.error('[postly] Error al aplicar Fase 2:', e)
      }
      console.error('[postly] Ejecuta manualmente: npm run db:migrate-phase2 o pega database/migrate_phase2.sql en Neon.')
      return
    }
  } catch (e) {
    console.warn('[postly] No se pudo comprobar tablas:', e)
  }

  console.warn(
    `[postly] Esquema Fase 1 incompleto. Migrando en ${hostHint} (conexión directa si aplica)…`
  )

  try {
    await applyLegacyMigrationFiles(sqlMigrate)
    let ok = await verifyPhase1Schema(sqlCheck)
    if (!ok && process.env.NODE_ENV !== 'production') {
      console.warn(
        '[postly] migrate_legacy no bastó; en desarrollo aplicamos reset + schema.sql (BD vacía).'
      )
      await applyFullSchemaFiles(sqlMigrate)
      ok = await verifyPhase1Schema(sqlCheck)
    } else if (!ok) {
      console.error(
        '[postly] En producción no se borra la BD automáticamente. Ejecuta en Neon o CI: npm run db:apply'
      )
    }
    if (ok && !(await verifyPhase2Schema(sqlCheck))) {
      try {
        await applyPhase2MigrationFiles(sqlMigrate)
      } catch (e) {
        console.error('[postly] Error al aplicar Fase 2 tras migración:', e)
      }
    }
    if (ok && (await verifyPhase2Schema(sqlCheck)) && !(await verifyPhase3Schema(sqlCheck))) {
      try {
        await applyPhase3MigrationFiles(sqlMigrate)
      } catch (e) {
        console.error('[postly] Error al aplicar Fase 3 tras migración:', e)
      }
    }
    if (
      ok &&
      (await verifyPhase2Schema(sqlCheck)) &&
      (await verifyPhase3Schema(sqlCheck)) &&
      !(await verifyPhase4Schema(sqlCheck))
    ) {
      try {
        await applyPhase4MigrationFiles(sqlMigrate)
      } catch (e) {
        console.error('[postly] Error al aplicar Fase 4 tras migración:', e)
      }
    }

    const phase2Ok = ok && (await verifyPhase2Schema(sqlCheck))
    const phase3Ok = ok && phase2Ok && (await verifyPhase3Schema(sqlCheck))
    const phase4Ok = ok && phase2Ok && phase3Ok && (await verifyPhase4Schema(sqlCheck))

    if (ok && phase2Ok && phase3Ok && phase4Ok) {
      console.info('[postly] Esquema verificado correctamente (Fase 1 + 2 + 3 + 4).')
    } else if (ok && phase2Ok && phase3Ok && !phase4Ok) {
      console.error(
        '[postly] Falta columna tasks.description (Fase 4). Ejecuta: npm run db:migrate-phase4 o database/migrate_phase4.sql en Neon.'
      )
    } else if (ok && phase2Ok && !phase3Ok) {
      console.error(
        '[postly] Faltan columnas Fase 3. Ejecuta: npm run db:migrate-phase3 o database/migrate_phase3.sql en Neon.'
      )
    } else if (ok && !phase2Ok) {
      console.error(
        '[postly] Fase 1 OK pero falta Fase 2. Ejecuta: npm run db:migrate-phase2 o pega database/migrate_phase2.sql en Neon.'
      )
    } else if (!ok) {
      console.error(
        '[postly] No se pudo verificar el esquema. Revisa DATABASE_URL y ejecuta manualmente: npm run db:apply'
      )
    }
  } catch (e) {
    console.error('[postly] Error al migrar esquema:', e)
  }
})
