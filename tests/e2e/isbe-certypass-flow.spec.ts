import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loginAdmin, loginSuperadmin } from './utils/auth';
import { PrismaClient } from '../../src/generated/prisma';

/**
 * E2E de punta a punta del flujo ISBE + CertyPass, contra la organización
 * demo REAL (Postgres de producción) y la API real de ISBE — nada mockeado.
 *
 * Requiere un servidor ya corriendo contra la BD real (no la SQLite del
 * webServer por defecto de playwright.config.ts). Ver tests/e2e/README.md,
 * sección "ISBE + CertyPass (live)", para cómo ejecutarlo.
 */

// playwright.config.ts no carga .env.local (el proceso de test corre fuera de
// Next.js), así que lo leemos a mano, igual que hacen los scripts/*.mjs.
// OJO: el cliente de Prisma generado auto-carga `.env` (no `.env.local`) en
// cuanto se importa, con una DATABASE_URL antigua/obsoleta — por eso aquí no
// nos fiamos de process.env para la URL de BD y se la pasamos explícita al
// construir el cliente.
function loadEnvLocal(): Record<string, string> {
  const parsed: Record<string, string> = {};
  try {
    const envPath = join(__dirname, '..', '..', '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const [key, ...rest] = line.split('=');
      if (!key || rest.length === 0) continue;
      const value = rest.join('=').trim().replace(/^["']|["']$/g, '');
      parsed[key.trim()] = value;
      if (!process.env[key.trim()]) process.env[key.trim()] = value;
    }
  } catch {
    // .env.local no existe: se asume que las variables ya están en el entorno
  }
  return parsed;
}
const envLocal = loadEnvLocal();

const DEMO_ORG_ID = process.env.DEMO_ORG_ID || 'ab1dc62c-65de-46fe-ba78-233e729c72da';
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_E2E_EMAIL || 'superadmin@certypass.com';
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_E2E_PASSWORD;
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_E2E_EMAIL || 'demo@certypass.com';
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_E2E_PASSWORD;
const IBS_TOKEN = process.env.IBS_TOKEN || envLocal.IBS_TOKEN;
const IBS_ISBE_APPLICATION_ID = process.env.IBS_ISBE_APPLICATION_ID || envLocal.IBS_ISBE_APPLICATION_ID;

const prisma = new PrismaClient({
  datasources: { db: { url: envLocal.DATABASE_URL || process.env.DATABASE_URL } },
});

test.describe('ISBE + CertyPass — flujo real de punta a punta (organización demo)', () => {
  // El texto de botones ("Acceder al Dashboard", "Guardar"...) depende del
  // locale vía next-intl; sin esto Playwright arranca en en-US y esos
  // selectores literales en español dejan de coincidir.
  test.use({ locale: 'es-ES' });

  test.skip(
    !SUPERADMIN_PASSWORD || !DEMO_ADMIN_PASSWORD,
    'Faltan SUPERADMIN_E2E_PASSWORD y/o DEMO_ADMIN_E2E_PASSWORD en el entorno'
  );

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('el superadmin activa/desactiva el módulo certIsbe y el cambio persiste (regresión)', async ({ page }) => {
    await loginSuperadmin(page, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD!);
    await page.goto(`/superadmin/organizations/${DEMO_ORG_ID}`);

    const checkbox = page.locator('#module-certIsbe');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeChecked(); // precondición conocida: la demo ya lo tiene activo

    // Desactivar y comprobar que el estado persiste tras recargar la página
    await checkbox.click();
    await expect(checkbox).not.toBeChecked({ timeout: 15000 });
    await page.reload();
    await expect(page.locator('#module-certIsbe')).not.toBeChecked();

    // Reactivar y comprobar persistencia — deja la organización demo como estaba
    await page.locator('#module-certIsbe').click();
    await expect(page.locator('#module-certIsbe')).toBeChecked({ timeout: 15000 });
    await page.reload();
    await expect(page.locator('#module-certIsbe')).toBeChecked();
  });

  test('crear un item real dispara un timestamp ISBE real y queda persistido en IsbeCertification', async ({ page, baseURL }, testInfo) => {
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: DEMO_ORG_ID },
      select: { configuracion: true },
    });
    const modules = (org.configuracion as { modules?: { certIsbe?: boolean } } | null)?.modules ?? {};
    test.skip(modules.certIsbe !== true, 'certIsbe no está activo para la organización demo ahora mismo');

    await loginAdmin(page, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD!);
    await page.goto('/dashboard/items');
    await page.waitForLoadState('networkidle');

    const customId = `e2e-isbe-${Date.now()}`;
    await page.getByRole('button', { name: 'Añadir' }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.locator('input[name="customId"]').waitFor({ state: 'visible', timeout: 10000 });
    await dialog.locator('input[name="customId"]').fill(customId);
    await dialog.locator('input[name="name"]').fill(`E2E ISBE ${Date.now()}`);
    await dialog.locator('input[name="description"]').fill('Item de prueba E2E del flujo ISBE + CertyPass');
    await dialog.getByRole('button', { name: 'Guardar' }).click();

    // El modal se cierra cuando la creación (evidencia Ethereum + timestamp ISBE) termina
    await expect(dialog).toBeHidden({ timeout: 30000 });

    // La certificación ISBE es un side-effect fire-and-forget sin UI propia:
    // se verifica directamente contra la BD real.
    let cert: { hash: string; executionId: number; txHash: string | null; status: string } | null = null;
    await expect
      .poll(
        async () => {
          cert = await prisma.isbeCertification.findFirst({
            where: { itemId: customId },
            orderBy: { createdAt: 'desc' },
          });
          return cert !== null;
        },
        { timeout: 30000, message: 'No se creó ningún IsbeCertification para el item creado' }
      )
      .toBe(true);

    expect(cert!.hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(cert!.executionId).toBeGreaterThan(0);
    expect(['pending', 'sent', 'confirmed']).toContain(cert!.status);

    // Verificación real contra la API de ISBE (no mockeada): el hash debe
    // existir realmente en su backend, no solo en nuestra tabla local. El
    // timestamp se procesa de forma asíncrona (va a blockchain), así que se
    // hace polling en vez de comprobarlo una sola vez justo después de crear.
    expect(IBS_TOKEN, 'IBS_TOKEN no configurado en .env.local').toBeTruthy();
    expect(IBS_ISBE_APPLICATION_ID, 'IBS_ISBE_APPLICATION_ID no configurado en .env.local').toBeTruthy();

    let exists = false;
    await expect
      .poll(
        async () => {
          const res = await fetch(
            `https://api.icommunitylabs.com/applications/${IBS_ISBE_APPLICATION_ID}/isbe/hashtimestamp/${cert!.hash}`,
            { headers: { Authorization: `Bearer ${IBS_TOKEN}` } }
          );
          if (!res.ok) return false;
          const body = await res.json();
          exists = !!body.exists;
          return exists;
        },
        { timeout: 60000, intervals: [3000, 5000], message: 'ISBE nunca confirmó el hash (exists=true)' }
      )
      .toBe(true);

    expect(exists).toBe(true);

    // El item NO se borra a propósito: queda en la organización demo para
    // poder inspeccionarlo a mano (dashboard, y en el checker de ISBE) tras
    // la ejecución. Se adjunta también al reporte HTML de Playwright para no
    // tener que rebuscar en los logs.
    const itemUrl = `${baseURL || ''}/dashboard/items/${encodeURIComponent(customId)}`;
    const summary = {
      itemId: customId,
      itemUrl,
      hash: cert!.hash,
      executionId: cert!.executionId,
      txHash: cert!.txHash,
      status: cert!.status,
      isbeCheckUrl: `https://api.icommunitylabs.com/applications/${IBS_ISBE_APPLICATION_ID}/isbe/hashtimestamp/${cert!.hash}`,
    };
    console.log('[isbe-certypass-flow] Item creado — revisar manualmente:', JSON.stringify(summary, null, 2));
    await testInfo.attach('isbe-result', {
      body: JSON.stringify(summary, null, 2),
      contentType: 'application/json',
    });
  });
});
