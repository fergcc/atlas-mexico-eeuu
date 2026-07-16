"""Piloto de datos LIVE (reales) para dos pares — nacional y estatal.

Reutiliza la generación mock completa para todos los sectores/pares (así el
manifest sigue teniendo los 6 sectores y 21 pares que el frontend ya conoce),
y luego SUSTITUYE las series subyacentes de dos pares específicos por datos
reales obtenidos en vivo de INEGI/FRED (nacional) e INEGI/BLS (estatal),
antes de correr el motor econométrico y exportar. El resto de los pares
permanece en modo mock hasta que se identifiquen sus claves reales de
indicador (ver TODOs abajo y `docs/arquitectura.md`).

Limitaciones conocidas de este piloto (documentadas, no ocultas):
  - INEGI 736407 ("Total de la actividad industrial") es Series Originales
    (NSA); no se identificó todavía la clave de la serie desestacionalizada
    equivalente. FRED INDPRO es SA. Este piloto por tanto compara una serie
    NSA (MX) contra una SA (US) — aceptable para probar el plumbing end-to-
    end, pero antes de confiar en el resultado econométrico habría que
    resolver esta asimetría (buscar el ID SA de INEGI, o usar la variante
    NSA de FRED).
  - El par estatal usa BLS `SMU48000003133600001` (Texas, "equipo de
    transporte", un subsector NAICS específico) contra INEGI 741651 (ITAEE
    manufactura total 31-33, Chihuahua) — granularidad sectorial distinta
    entre ambos lados (aerospacial-adyacente vs manufactura total).

Ejecutar con:
    pipeline/.venv/bin/python -m pipeline.live.run_live_pilot
"""
from __future__ import annotations

import logging

from pipeline.econometrics.pipeline_runner import run_all
from pipeline.export.to_json import export_all
from pipeline.ingestion import fred, inegi, bls
from pipeline.mock.generate_mock_data import (
    ADDITIONAL_STATE_PAIRS,
    _load_sectors,
    _monthly_periods,
    _national_pair_frames,
    _quarterly_periods,
    _state_pair_frames,
)
from pipeline.processing.normalize import SeriesMeta, normalize_series

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

CHIHUAHUA_CODE = "08"
TEXAS_FIPS = "48"


def _fetch_real_national_pair(sector: dict) -> tuple[dict, dict]:
    """MX: INEGI 736407 (IMAI total, NSA) vs US: FRED INDPRO (SA)."""
    sector_id = sector["id"]
    mx_series_id = f"mx-nac_{sector_id}_emim"
    us_series_id = f"us-nac_{sector_id}_ip"

    mx_obs = inegi.fetch_indicator()  # default = 736407, área 00
    mx_pairs = [(o["TIME_PERIOD"].replace("/", "-") + "-01", o["OBS_VALUE"]) for o in mx_obs]
    mx_meta = SeriesMeta(
        series_id=mx_series_id,
        source="INEGI - BIE (Indicadores económicos de coyuntura, clave 736407)",
        country="MX",
        region_code="NAC",
        sector_id=sector_id,
        frequency="monthly",
        seasonal_adjustment="nsa",
        units="Índice base 2018=100",
        proxy_type="output_index",
        publication_lag_days=45,
        vintage_date=max(o["TIME_PERIOD"] for o in mx_obs).replace("/", "-") + "-01",
        scian_code=sector["scian_codes"][0] if sector.get("scian_codes") else None,
        naics_code=sector["naics_codes"][0] if sector.get("naics_codes") else None,
    )
    mx_tidy = normalize_series(mx_pairs, mx_meta)

    us_obs = fred.fetch_series()  # default = INDPRO
    us_pairs = [(o["date"], o["value"]) for o in us_obs]
    us_meta = SeriesMeta(
        series_id=us_series_id,
        source="FRED - INDPRO (Industrial Production: Total Index)",
        country="US",
        region_code="NAC",
        sector_id=sector_id,
        frequency="monthly",
        seasonal_adjustment="sa",
        units="Índice base 2017=100",
        proxy_type="output_index",
        publication_lag_days=15,
        vintage_date=max(o["date"] for o in us_obs),
        scian_code=sector["scian_codes"][0] if sector.get("scian_codes") else None,
        naics_code=sector["naics_codes"][0] if sector.get("naics_codes") else None,
    )
    us_tidy = normalize_series(us_pairs, us_meta)

    labels = {
        mx_series_id: "Producción manufacturera - Actividad industrial total (México, nacional, INEGI real)",
        us_series_id: "Industrial Production Index - Total (US, national, FRED real)",
    }
    return {mx_series_id: mx_tidy, us_series_id: us_tidy}, labels


def _fetch_real_state_pair(sector: dict) -> tuple[dict, dict]:
    """MX: INEGI 741651 (ITAEE manufactura, Chihuahua) vs US: BLS transporte (Texas)."""
    sector_id = sector["id"]
    mx_series_id = f"mx-chh_{sector_id}_itaee"
    us_series_id = f"us-tx_{sector_id}_chh_bls"

    mx_obs = inegi.fetch_itaee(CHIHUAHUA_CODE, indicator_id=inegi.ITAEE_MANUFACTURING_INDICATOR_ID)
    # ITAEE es trimestral; TIME_PERIOD viene como "YYYY/Q" (1-4) según la API.
    mx_pairs = []
    for o in mx_obs:
        year, q = o["TIME_PERIOD"].split("/")
        month = int(q) * 3
        mx_pairs.append((f"{year}-{month:02d}-01", o["OBS_VALUE"]))
    mx_meta = SeriesMeta(
        series_id=mx_series_id,
        source="INEGI - ITAEE (Series Originales, clave 741651, manufactura 31-33)",
        country="MX",
        region_code=CHIHUAHUA_CODE,
        sector_id=sector_id,
        frequency="quarterly",
        seasonal_adjustment="nsa",
        units="Índice base 2018=100",
        proxy_type="output_index",
        publication_lag_days=95,
        vintage_date=mx_pairs[-1][0],
        scian_code=sector["scian_codes"][0],
        naics_code=sector["naics_codes"][0],
    )
    mx_tidy = normalize_series(mx_pairs, mx_meta)

    us_series = bls.fetch_timeseries()[0]  # default = SMU48000003133600001
    us_pairs = []
    for o in us_series["data"]:
        if not o["period"].startswith("M") or o["period"] == "M13":
            continue
        month = int(o["period"][1:])
        us_pairs.append((f"{o['year']}-{month:02d}-01", o["value"]))
    us_meta = SeriesMeta(
        series_id=us_series_id,
        source="BLS - CES SMU48000003133600001 (Texas, equipo de transporte)",
        country="US",
        region_code=TEXAS_FIPS,
        sector_id=sector_id,
        frequency="monthly",
        seasonal_adjustment="nsa",
        units="Miles de empleos",
        proxy_type="labor_input",
        publication_lag_days=21,
        vintage_date=max(p[0] for p in us_pairs),
        scian_code=sector["scian_codes"][0],
        naics_code=sector["naics_codes"][0],
    )
    us_tidy = normalize_series(us_pairs, us_meta)

    labels = {
        mx_series_id: "ITAEE - Manufactura 31-33 (Chihuahua, INEGI real)",
        us_series_id: "Empleo manufacturero - Equipo de transporte (Texas, BLS real)",
    }
    return {mx_series_id: mx_tidy, us_series_id: us_tidy}, labels


def main() -> dict:
    sectors = _load_sectors()
    sectors_by_id = {s["id"]: s for s in sectors}
    monthly_dates = _monthly_periods()
    quarterly_dates = _quarterly_periods()

    series_lookup: dict = {}
    series_labels: dict = {}
    pair_defs: list = []

    # 1) Generar TODO en modo mock primero (igual que generate_mock_data.main),
    #    para no perder cobertura de los sectores/pares sin claves reales aún.
    for idx, sector in enumerate(sectors):
        frames, labels, pair_def = _national_pair_frames(idx, sector, monthly_dates)
        series_lookup.update(frames)
        series_labels.update(labels)
        pair_defs.append(pair_def)

        # Paridad con generate_mock_data.main(): el par estatal original
        # (Chihuahua/aeroespacial vs Texas, índices 0..len(sectors)-1 ya
        # usados por los nacionales, así que este usa idx + len(sectors),
        # exactamente como en el script mock) no debe perderse aquí.
        if sector["id"] == "aeroespacial":
            state_frames, state_labels, state_pair_def = _state_pair_frames(
                idx + len(sectors), sector, quarterly_dates, monthly_dates
            )
            series_lookup.update(state_frames)
            series_labels.update(state_labels)
            pair_defs.append(state_pair_def)

    logger.info("Generando %d pares estatales mock (frontera + corredores)...", len(ADDITIONAL_STATE_PAIRS))
    for spec in ADDITIONAL_STATE_PAIRS:
        sector = sectors_by_id[spec["sector_id"]]
        mx, us = spec["mx"], spec["us"]
        state_frames, state_labels, state_pair_def = _state_pair_frames(
            spec["rng_index"], sector, quarterly_dates, monthly_dates,
            mx_region_code=mx["code"], mx_abbr=mx["abbr"], mx_state_label=mx["label"],
            us_region_code=us["code"], us_abbr=us["abbr"], us_state_label=us["label"],
            us_series_disambiguator=mx["abbr"],
        )
        series_lookup.update(state_frames)
        series_labels.update(state_labels)
        pair_defs.append(state_pair_def)

    # 2) Sustituir por datos REALES el par nacional y el par estatal piloto.
    logger.info("Descargando datos reales: INEGI (IMAI, ITAEE) + FRED (INDPRO) + BLS...")
    real_sector = sectors_by_id["manufactura_total"]

    real_national_frames, real_national_labels = _fetch_real_national_pair(real_sector)
    series_lookup.update(real_national_frames)
    series_labels.update(real_national_labels)

    real_state_frames, real_state_labels = _fetch_real_state_pair(real_sector)
    series_lookup.update(real_state_frames)
    series_labels.update(real_state_labels)

    # El pair_def del par estatal piloto no existe todavía en ADDITIONAL_STATE_PAIRS
    # (esa lista solo cubre pares fronterizos "aeroespacial"/"manufactura_total"
    # ya generados arriba en mock — pero "manufactura_total" Chihuahua-Texas SÍ
    # está ahí con rng_index 112, mismos series_id, así que basta con que los
    # datos reales usen los MISMOS series_id que ese pair_def ya declaró).
    logger.info(
        "Series reales cargadas: %s",
        list(real_national_frames.keys()) + list(real_state_frames.keys()),
    )

    logger.info("Corriendo motor econométrico sobre %d pares (2 con datos reales)...", len(pair_defs))
    results = run_all(pair_defs, series_lookup, sectors_by_id)

    logger.info("Exportando manifest/series/results a data/ (mode=mixed)...")
    manifest = export_all(
        sectors=sectors,
        series_lookup=series_lookup,
        series_labels=series_labels,
        pair_defs=pair_defs,
        results=results,
        mode="mixed",
        refresh_cadence="trimestral",
    )
    logger.info("Listo: %d sectores, %d series, %d pares (mixed: 2 pares con datos reales).",
                len(sectors), len(series_lookup), len(pair_defs))
    return manifest


if __name__ == "__main__":
    main()
