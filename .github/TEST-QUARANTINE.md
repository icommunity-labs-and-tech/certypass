# Ficheros de test en cuarentena

Estos 3 ficheros están excluidos de `vitest` en CI. El resto de la suite sí es gate:
31 ficheros y 235 tests.

Ninguno de estos fallos lo causó el pipeline. Este repo nunca ha tenido CI, así que
la suite se fue quedando desfasada respecto a la UI sin que nadie lo viera. Al
encender el CI (2026-07-31) salieron los 18 fallos de golpe.

A diferencia de `datia`, donde los fallos tenían una única causa raíz y se arreglaron,
aquí son heterogéneos y varios requieren decidir cuál es el comportamiento correcto
—no solo actualizar una aserción—, así que quedan documentados en vez de parcheados a
ciegas.

Al arreglar uno, quítalo de la lista `--exclude` en `ci.yml` **y** en `deploy.yml`:
están duplicadas a propósito, para que el gate de deploy no dependa de un fichero que
alguien pueda tocar sin darse cuenta.

## `src/components/__tests__/AddStateForm.test.tsx`

El grueso de los fallos. Varias causas distintas:

- `Failed to call useTranslations because the context from NextIntlClientProvider was
  not found` — el componente pasó a usar next-intl y el test no lo envuelve.
  Comparar con `datia/src/test/setup.ts`, que mockea `next-intl` globalmente; aquí
  ese mock no existe. Portarlo probablemente arregla varios de golpe.
- `Found multiple elements with the text: Reparado` — el texto aparece ahora en más
  de un sitio (chip y preview del título). Necesita un matcher más específico.
- `Unable to find an element with the text: /Título generado: Laptop HP - Reparado/`
  y `/No se puede determinar la categoría del item/` y `/Error al crear el estado/` —
  copys que cambiaron o que ahora se parten en varios elementos.
- `expected "spy" to be called with arguments: [ 'cat-1' ]` — cambió la firma o el
  momento de la llamada al cargar los status types.

## `src/components/charts/__tests__/DashboardKPIs.test.tsx`

Los tests comprueban `Row`/`Col` y "4 KPI cards", nomenclatura de Bootstrap. El
proyecto migró a Mantine, así que la estructura que asertan ya no existe. Hay que
reescribirlos contra el DOM actual; ojo también con `window.matchMedia`, que jsdom no
implementa y Mantine necesita (ver el stub en `datia/src/test/setup.ts`).

## `src/actions/__tests__/states/list.test.ts`

`No se pudo obtener el contexto del tenant. Token no válido o no presente.`
La action pasó a exigir contexto de tenant y el test no lo provee. Hace falta mockear
ese contexto. Los tres subtests son bastante superficiales ("should return array
type", "should return empty array (current implementation)"), así que merece la pena
preguntarse si aportan algo antes de invertir en arreglarlos.
