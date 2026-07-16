# Arquitectura

## Pendiente: orquestador de ingesta real

`pipeline/ingestion/{inegi,banxico,fred,bea,bls}.py` ya tienen clientes funcionales por fuente (fallan explícito con `MissingCredentialError` si falta la variable de entorno correspondiente), y `pipeline/econometrics/pipeline_runner.run_pair()` es agnóstico a si los datos vienen de `pipeline/mock/generate_mock_data.py` o de una fuente real — solo espera DataFrames tidy ya normalizados. Falta el script que conecte ambos extremos en modo `live` (iterar `sectors.yaml`/`region_registry.yaml`, llamar al cliente de ingesta correspondiente por serie, y pasar el resultado a `run_pair`). El workflow de actualización trimestral corre siempre en modo mock hasta que ese orquestador exista y se pruebe contra credenciales reales.

## Flujo de datos

```
INEGI / Banxico / FRED / BEA / BLS
        │  (pipeline/ingestion/*.py — requests + tenacity, falla explícito sin credencial)
        ▼
pipeline/processing/  (normaliza a esquema tidy común, alinea frecuencias/ventana muestral)
        ▼
pipeline/econometrics/  (ADF/KPSS → Granger vía VAR → Engle-Granger/Johansen/VECM → FDR)
        ▼
pipeline/export/to_json.py
        ▼
data/manifest.json, data/series/*.json, data/results/*.json   (versionado en git)
        │  (app/scripts/sync-data.mjs, en predev/prebuild)
        ▼
app/public/data/**
        ▼
Next.js (Server Components leen vía fs en build; client components hacen fetch estático)
        ▼
Exportación estática (output: 'export') → Vercel / GitHub Pages
```

No hay servidor ni base de datos en producción. Cualquiera que clone el repo puede correr el pipeline y el frontend sin infraestructura pagada.

## Por qué monorepo con dos lenguajes

`statsmodels` (ADF, KPSS, VAR, Granger, Engle-Granger, Johansen, VECM) no tiene equivalente maduro en el ecosistema JS — reimplementarlo sería reinventar código validado académicamente. Node/Next.js se reserva para la capa de presentación.

## Desplegar en GitHub Pages en vez de Vercel

`next.config.ts` necesita `basePath`/`assetPrefix` condicionales si el sitio no vive en la raíz del dominio:

```ts
const repoName = "atlas-mexico-eeuu";
const basePath = process.env.GITHUB_PAGES ? `/${repoName}` : "";

export default {
  output: "export",
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath,
  trailingSlash: true,
};
```

Y en el workflow de despliegue, sustituir el paso de Vercel por `actions/upload-pages-artifact` + `actions/deploy-pages` sobre `app/out`.

## Geografía

`data/geo/mx-states.topojson`: TopoJSON de los 32 estados de México (fuente: [datamaps](https://github.com/markmarkoh/datamaps)/Natural Earth, dominio público/MIT — ver `data/geo/SOURCES.md`). Pendiente: reemplazar por el Marco Geoestadístico oficial de INEGI cuando se integre la ingesta real, manteniendo el mismo contrato de nombres/códigos de estado usado en `app/src/data/mx-states.ts`.
