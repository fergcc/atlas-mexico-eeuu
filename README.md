# Atlas México–EEUU

Dashboard interactivo y de uso público que extiende el [*Atlas Prospectivo Territorial-Industrial para la Atracción de Inversiones*](https://www.gob.mx/sre) (SRE / ONUDI / ONU-Hábitat, 2021) con dos preguntas que el documento original no respondía:

1. **¿La producción industrial de un país anticipa a la del otro?** (causalidad de Granger, México ↔ Estados Unidos)
2. **¿Se mueven juntas en el largo plazo?** (cointegración: Engle-Granger + Johansen + VECM)

A nivel nacional, estatal (32 entidades de México) y regional (corredores industriales), actualizado con datos públicos de INEGI, Banxico, FRED, BEA y BLS.

> El Atlas 2021 original usa Ventaja Comparativa Revelada, matriz insumo-producto y shift-share — **no** usa Granger ni cointegración. Esta capa econométrica es una extensión propia construida sobre el mismo armazón sectorial y territorial del Atlas (ver [`docs/metodologia.md`](docs/metodologia.md) y la página `/metodologia` del sitio).

## Estado actual

El sitio corre hoy en **modo `mock`**: datos sintéticos con relaciones causales y de cointegración conocidas por construcción (para validar que el motor econométrico detecta lo que debe detectar), no datos reales todavía. Para pasar a modo `live` necesitas conseguir tus propias credenciales gratuitas — ver la sección de [Credenciales](#credenciales-gratuitas-que-debes-conseguir) abajo.

## Estructura del repo

```
atlas-mexico-eeuu/
├── pipeline/       Python: ingesta de APIs, motor econométrico (statsmodels), export a JSON
├── data/           JSON generado por el pipeline (series, resultados, geografía) — versionado en git
├── app/            Next.js 16 + Tailwind v4, exportación estática, consume /data
├── docs/           Metodología y arquitectura
└── .github/workflows/   CI + actualización trimestral automática
```

## Cómo correrlo localmente

Requisitos: Node 20+, Python 3.11+.

### Frontend

```bash
cd app
npm install --legacy-peer-deps   # react-simple-maps aún no declara soporte oficial de React 19
npm run dev
```

Abre `http://localhost:3000`. El script `predev`/`prebuild` sincroniza automáticamente `/data` → `app/public/data`.

### Pipeline (opcional — el repo ya trae datos generados en `/data`)

```bash
cd pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest tests/ -v                        # motor econométrico, series sintéticas con causalidad/cointegración conocida
python -m pipeline.mock.generate_mock_data   # regenera /data en modo mock
```

## Credenciales gratuitas que debes conseguir

El pipeline lee estas variables desde un archivo `.env` (copia `.env.example`) o desde GitHub Actions Secrets. Ninguna se comitea al repo. Todas son gratuitas y de registro público:

| Variable | Fuente | Dónde conseguirla |
|---|---|---|
| `INEGI_TOKEN` | INEGI — API de Indicadores (BIE): ITAEE, IMAI, EMIM, PIBE | https://www.inegi.org.mx/servicios/api_indicadores.html |
| `BANXICO_TOKEN` | Banxico — Sistema de Información Económica (SIE) | https://www.banxico.org.mx/SieAPIRest/service/v1/token |
| `FRED_API_KEY` | FRED (St. Louis Fed) — Industrial Production Index | https://fred.stlouisfed.org/docs/api/api_key.html |
| `BEA_API_KEY` | BEA — GDP por estado/industria | https://apps.bea.gov/API/signup/ |
| `BLS_API_KEY` | BLS — empleo/horas manufactureras por estado | https://data.bls.gov/registrationEngine/ |

Sin una credencial, el módulo de ingestión correspondiente falla explícitamente (`MissingCredentialError`) en vez de inventar datos.

## Desplegar tu propia copia

El sitio es 100% estático (`output: 'export'` en `next.config.ts`) — no requiere backend ni base de datos.

**Vercel (recomendado):** conecta este repo desde [vercel.com/new](https://vercel.com/new), configura el *Root Directory* como `app/`, y Vercel detecta Next.js automáticamente. Para que la actualización trimestral automática (`.github/workflows/update-and-deploy.yml`) dispare el redeploy, crea un *Deploy Hook* en tu proyecto de Vercel (Settings → Git → Deploy Hooks) y guárdalo como variable de repo `VERCEL_DEPLOY_HOOK_URL` en GitHub (Settings → Secrets and variables → Actions → Variables).

**GitHub Pages (alternativa sin servicios externos):** requiere ajustar `basePath`/`assetPrefix` en `next.config.ts` según el nombre del repo — ver `docs/arquitectura.md`.

## Actualización automática

`.github/workflows/update-and-deploy.yml` corre trimestralmente (mediados de enero/abril/julio/octubre, sincronizado con el calendario real de publicación de INEGI/BEA/BLS) y también puede dispararse manualmente (`workflow_dispatch`) si una fuente publica fuera de ese calendario. Corre las pruebas del pipeline, regenera `/data`, comitea a `main` si hay cambios, y reconstruye/despliega el sitio.

## Licencia

MIT — ver [`LICENSE`](LICENSE). Los datos generados son de fuentes públicas (INEGI, Banxico, FRED, BEA, BLS); la geografía de `data/geo/mx-states.topojson` proviene de [datamaps](https://github.com/markmarkoh/datamaps)/Natural Earth (dominio público) — ver [`data/geo/SOURCES.md`](data/geo/SOURCES.md).

## Contribuir

Ver [`CONTRIBUTING.md`](CONTRIBUTING.md).
