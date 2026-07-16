"""Pipeline Python del proyecto Atlas México-EEUU.

Convierte datos crudos de fuentes públicas (INEGI, Banxico, FRED, BEA, BLS) —o,
mientras no haya credenciales reales, datos sintéticos generados por
`pipeline.mock`— en el conjunto de JSON versionado en `data/` que consume el
frontend Next.js en `app/`.

Subpaquetes:
    ingestion     — clientes HTTP por fuente (requieren credenciales reales).
    mock          — generador de datos sintéticos reproducibles para Fase 0/1.
    processing    — normalización a esquema tidy y alineación de pares.
    econometrics  — estacionariedad, Granger, cointegración, VECM, FDR.
    export        — serialización a `data/manifest.json`, `data/series/`, `data/results/`.
"""
