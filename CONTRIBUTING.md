# Contribuir

Gracias por tu interés en mejorar el Atlas México–EEUU.

## Extender a más sectores o estados

El pipeline está diseñado para ser genérico — nunca hay sectores o regiones hardcodeados en el código:

- Agrega sectores en `pipeline/reference/sectors.yaml` (y su mapeo en `pipeline/reference/scian_naics_crosswalk.csv`).
- Los 32 estados de México y 50+DC de EEUU ya están en `pipeline/reference/region_registry.yaml`; para agregar un par estatal nuevo, extiende el generador de datos (`pipeline/mock/generate_mock_data.py` en modo mock, o los módulos de `pipeline/ingestion/` en modo live).
- El frontend itera sobre `data/manifest.json` — nunca hace falta tocar código de página para un sector/estado nuevo.

## Antes de un PR

```bash
cd pipeline && pip install -r requirements.txt && pytest tests/ -v
cd app && npm ci --legacy-peer-deps && npm run lint && npm run build
```

Ambos deben pasar limpio (el workflow de CI los corre automáticamente).

## Reportar un problema

Abre un issue describiendo qué esperabas ver y qué viste — si es sobre un resultado econométrico específico, incluye el `pair_id` de `data/results/`.
