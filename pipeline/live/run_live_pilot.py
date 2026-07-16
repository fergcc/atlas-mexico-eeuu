"""Piloto de datos LIVE (reales), extendido de 2 a 13 de los 21 pares.

Reutiliza la generación mock completa para todos los sectores/pares (así el
manifest sigue teniendo los 6 sectores y 21 pares que el frontend ya conoce),
y luego SUSTITUYE las series subyacentes de los pares para los que se
identificó y VERIFICÓ (contra la API real, nunca solo contra la documentación)
una clave de indicador real, antes de correr el motor econométrico y
exportar. El resto de los pares permanece en modo mock porque no se encontró
una clave verificable (ver tabla de cobertura abajo).

Cómo se descubrieron las claves nuevas (además de las 3 ya documentadas en
`pipeline/ingestion/inegi.py`): navegando en vivo el "Constructor de
Consultas" de INEGI (https://www.inegi.org.mx/app/querybuilder2/) — no existe
búsqueda por texto en la API pública, así que se recorrió programáticamente
el árbol AngularJS/jsTree del constructor (función global
`treeTemasIndicadores('#componente').trataNodos(id, '3')`, que expande un
nodo por su id de forma idéntica a un clic) hasta los nodos hoja, cuyo
`id` de `<li>` (`li_componente_{clave}`) es literalmente la clave numérica del
indicador. Cada clave candidata se verificó después contra la API real
(`inegi.fetch_indicator`) antes de usarse aquí — ninguna se adivinó a ciegas.

=======================================================================
COBERTURA FINAL (13 de 21 pares reales; 8 permanecen mock)
=======================================================================

Nacional (6/6 reales — INEGI IMAI "Series Originales", área 00, catálogo
"Actividad industrial, base 2018"; FRED Industrial Production por NAICS):
  - manufactura_total: INEGI 736407 vs FRED INDPRO (piloto original)
  - aeroespacial:      INEGI 736515 (3364) vs FRED IPG3364N
  - farmaceutica:      INEGI 736462 (3254) vs FRED IPG3254N
  - eolica:            INEGI 736491 (subsector 333 completo, "Fabricación de
                        maquinaria y equipo") vs FRED IPG333N — APROXIMACIÓN:
                        ni el catálogo IMAI de INEGI ni FRED desagregan hasta
                        SCIAN/NAICS 333611 (turbinas eólicas específicamente);
                        se usa el subsector 333 completo en AMBOS lados para
                        mantener granularidad consistente entre MX y US.
  - agroindustrial:     INEGI 736427 (3118, "Elaboración de productos de
                        panadería y tortillas") vs FRED IPN3118N — mismo
                        proxy ya declarado en `scian_naics_crosswalk.csv`
                        para cacao/vainilla (no existe indicador SCIAN 311800
                        exacto en el catálogo IMAI).
  - petroquimica:       INEGI 736459 (3251, "Fabricación de productos
                        químicos básicos") vs FRED IPG3251N — APROXIMACIÓN:
                        `sectors.yaml` declara 2 códigos SCIAN para este
                        sector (324110 refinación + 325100 química básica);
                        se usa solo 325100/3251 para tener una correspondencia
                        1:1 clara con una serie FRED real, en vez de mezclar
                        dos indicadores de naturaleza distinta.

Estatal (7/14 reales; los otros 7 permanecen mock):
  - aeroespacial:
      Chihuahua-Texas:        REAL (INEGI 741651 fallback + BLS SMU48000003133640001)
      Baja California-California: REAL (INEGI 741651 fallback + BLS SMU06000003133640001)
      Sonora-Arizona:          REAL (INEGI 741651 fallback + BLS SMU04000003133640001)
      Coahuila-Texas:          MOCK — INEGI 741651 y 741177 devuelven
                               ErrorCode:100 ("no se encontraron resultados")
                               para area_code="05" en este catálogo.
      Nuevo León-Texas:        MOCK — mismo problema, area_code="19".
      Tamaulipas-Texas:        MOCK — mismo problema, area_code="28".
  - manufactura_total:
      Baja California-California: REAL (INEGI 741651 exacto + BLS SMU06000003000000001)
      Sonora-Arizona:          REAL (INEGI 741651 exacto + BLS SMU04000003000000001)
      Chihuahua-Texas:         REAL (piloto original, sin cambios)
      Coahuila/Nuevo León/Tamaulipas-Texas: MOCK (mismo ErrorCode:100 de INEGI).
  - farmaceutica:
      Jalisco-New Jersey:      REAL (INEGI 741651 fallback + BLS SMU34000003232540001)
      Sinaloa-North Carolina:  REAL (INEGI 741651 fallback + BLS SMU37000003232540001)
  - agroindustrial:
      Veracruz-Florida:        MOCK — INEGI 741651/741177 con area_code="30"
                                también devuelven ErrorCode:100.

APROXIMACIÓN usada en TODOS los pares estatales "reales" salvo
manufactura_total: no existe en el catálogo público de INEGI un ITAEE
desagregado por SCIAN de 4 dígitos a nivel estatal (se navegó el árbol
completo "Actividad industrial por entidad federativa, base 2018" — tanto
"Por actividad económica y entidad federativa" como "Por entidad federativa y
actividad económica" — y en ambos casos la granularidad máxima es la
manufactura total 31-33, o como mucho 3 grupos gruesos "31"/"32"/"33"; nunca
un subsector SCIAN de 4 dígitos como 3364, 3254 o 3118). Por eso los pares
estatales de aeroespacial y farmacéutica usan 741651 (ITAEE manufactura
31-33 total) como el mejor proxy disponible del lado MX, mientras que el
lado US SÍ es una serie BLS específica del sector (NAICS de 4-6 dígitos por
estado). Esta asimetría de granularidad (MX = manufactura total, US = sector
específico) se documenta explícitamente en cada `source` string generado.

FALLA CONOCIDA DE COBERTURA DE INEGI (no es un bug de este pipeline): los
indicadores 741651 y 741177 devuelven `ErrorCode:100` para los `area_code`
"04" (Campeche), "05" (Coahuila), "07" (Chiapas), "19" (Nuevo León), "28"
(Tamaulipas) y "30" (Veracruz) — verificado contra la API real, no es un
error de código de área (se probaron variantes con padding sin éxito). Esto
excluye a 4 de los 13 pares estatales objetivo de este trabajo (Coahuila,
Nuevo León y Tamaulipas para aeroespacial y manufactura_total, y Veracruz
para agroindustrial), que permanecen en modo mock.

Ejecutar con:
    pipeline/.venv/bin/python -m pipeline.live.run_live_pilot
"""
from __future__ import annotations

import logging
from typing import Any

from pipeline.econometrics.pipeline_runner import run_all
from pipeline.export.to_json import export_all
from pipeline.ingestion import bls, fred, inegi
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

# Rango de años usado para las llamadas a BLS (ver `bls.fetch_timeseries`):
# hasta 20 años por llamada. INEGI ITAEE arranca en 2003, pero con esta
# ventana ya se cubren ~80 trimestres alineados — muy por encima del mínimo
# de 30 (`MIN_OBS_QUARTERLY`, ver `pipeline/config.py`), así que no hace
# falta encadenar múltiples llamadas.
BLS_START_YEAR = "2006"
BLS_END_YEAR = "2026"


# ---------------------------------------------------------------------
# Fetchers genéricos (reemplazan las 2 funciones casi-duplicadas del piloto
# original: una función nacional y una estatal, parametrizadas por las claves
# de indicador/serie reales en vez de estar hardcodeadas a un solo par).
# ---------------------------------------------------------------------
def _fetch_real_national_pair(
    sector: dict[str, Any],
    *,
    mx_indicator_id: str,
    us_series_id_real: str,
    mx_scian_code: str | None = None,
    mx_naics_code: str | None = None,
    approximation_note: str | None = None,
) -> tuple[dict[str, Any], dict[str, str]]:
    """MX: INEGI IMAI (Series Originales, área nacional 00) vs US: FRED
    Industrial Production por NAICS, a nivel nacional. Genérico sobre
    `mx_indicator_id`/`us_series_id_real` para poder reusarse en los 6
    sectores (ver tabla de cobertura en el docstring del módulo)."""
    sector_id = sector["id"]
    mx_series_id = f"mx-nac_{sector_id}_emim"
    us_series_id = f"us-nac_{sector_id}_ip"
    scian_code = mx_scian_code or (sector["scian_codes"][0] if sector.get("scian_codes") else None)
    naics_code = mx_naics_code or (sector["naics_codes"][0] if sector.get("naics_codes") else None)

    mx_obs = inegi.fetch_indicator(mx_indicator_id, area_code=inegi.NATIONAL_AREA_CODE)
    mx_pairs = [(o["TIME_PERIOD"].replace("/", "-") + "-01", o["OBS_VALUE"]) for o in mx_obs]
    mx_source = f"INEGI - BIE (Indicadores económicos de coyuntura, clave {mx_indicator_id})"
    if approximation_note:
        mx_source += f" [APROXIMACIÓN: {approximation_note}]"
    mx_meta = SeriesMeta(
        series_id=mx_series_id,
        source=mx_source,
        country="MX",
        region_code="NAC",
        sector_id=sector_id,
        frequency="monthly",
        seasonal_adjustment="nsa",
        units="Índice base 2018=100",
        proxy_type="output_index",
        publication_lag_days=45,
        vintage_date=max(o["TIME_PERIOD"] for o in mx_obs).replace("/", "-") + "-01",
        scian_code=scian_code,
        naics_code=naics_code,
    )
    mx_tidy = normalize_series(mx_pairs, mx_meta)

    us_obs = fred.fetch_series(series_id=us_series_id_real)
    us_pairs = [(o["date"], o["value"]) for o in us_obs]
    us_meta = SeriesMeta(
        series_id=us_series_id,
        source=f"FRED - {us_series_id_real} (Industrial Production por NAICS)",
        country="US",
        region_code="NAC",
        sector_id=sector_id,
        frequency="monthly",
        seasonal_adjustment="nsa",
        units="Índice base 2017=100",
        proxy_type="output_index",
        publication_lag_days=15,
        vintage_date=max(o["date"] for o in us_obs),
        scian_code=scian_code,
        naics_code=naics_code,
    )
    us_tidy = normalize_series(us_pairs, us_meta)

    label_en = sector.get("label_en", sector["label"])
    proxy_suffix = " [proxy]" if approximation_note else ""
    labels = {
        mx_series_id: f"Producción manufacturera - {sector['label']} (México, nacional, INEGI real{proxy_suffix})",
        us_series_id: f"Industrial Production Index - {label_en} (US, national, FRED real)",
    }
    return {mx_series_id: mx_tidy, us_series_id: us_tidy}, labels


def _fetch_real_state_pair(
    sector: dict[str, Any],
    *,
    mx_area_code: str,
    mx_abbr: str,
    mx_state_label: str,
    mx_indicator_id: str,
    us_region_code: str,
    us_abbr: str,
    us_state_label: str,
    us_series_id_real: str,
    us_series_disambiguator: str | None = None,
    approximation_note: str | None = None,
) -> tuple[dict[str, Any], dict[str, str]]:
    """MX: INEGI ITAEE (Series Originales, área = estado) vs US: BLS CES
    estatal por industria (Time Series API v2), a nivel estatal. Genérico
    sobre estado/indicador/serie para reusarse en los 7 pares estatales
    reales (ver tabla de cobertura en el docstring del módulo). Los
    `series_id` generados deben coincidir EXACTAMENTE con los que ya produce
    `generate_mock_data._state_pair_frames` para el mismo sector/estado, para
    poder sustituir la serie mock sin tocar `pair_defs`."""
    sector_id = sector["id"]
    mx_abbr_lower = mx_abbr.lower()
    us_abbr_lower = us_abbr.lower()
    mx_series_id = f"mx-{mx_abbr_lower}_{sector_id}_itaee"
    us_series_id = (
        f"us-{us_abbr_lower}_{sector_id}_{us_series_disambiguator.lower()}_bls"
        if us_series_disambiguator
        else f"us-{us_abbr_lower}_{sector_id}_bls"
    )

    mx_obs = inegi.fetch_itaee(mx_area_code, indicator_id=mx_indicator_id)
    mx_pairs = []
    for o in mx_obs:
        year, q = o["TIME_PERIOD"].split("/")
        month = int(q) * 3
        mx_pairs.append((f"{year}-{month:02d}-01", o["OBS_VALUE"]))
    mx_source = f"INEGI - ITAEE (Series Originales, clave {mx_indicator_id})"
    if approximation_note:
        mx_source += f" [APROXIMACIÓN: {approximation_note}]"
    mx_meta = SeriesMeta(
        series_id=mx_series_id,
        source=mx_source,
        country="MX",
        region_code=mx_area_code,
        sector_id=sector_id,
        frequency="quarterly",
        seasonal_adjustment="nsa",
        units="Índice base 2018=100",
        proxy_type="output_index",
        publication_lag_days=95,
        # max() (no el último elemento de la lista): la API de INEGI devuelve
        # las observaciones en orden DESCENDENTE (más reciente primero), así
        # que tomar el último elemento daría la fecha más ANTIGUA.
        vintage_date=max(p[0] for p in mx_pairs),
        scian_code=sector["scian_codes"][0],
        naics_code=sector["naics_codes"][0],
    )
    mx_tidy = normalize_series(mx_pairs, mx_meta)

    us_series = bls.fetch_timeseries(
        [us_series_id_real], start_year=BLS_START_YEAR, end_year=BLS_END_YEAR
    )[0]
    us_pairs = []
    for o in us_series["data"]:
        if not o["period"].startswith("M") or o["period"] == "M13":
            continue
        month = int(o["period"][1:])
        us_pairs.append((f"{o['year']}-{month:02d}-01", o["value"]))
    us_meta = SeriesMeta(
        series_id=us_series_id,
        source=f"BLS - CES {us_series_id_real} ({us_state_label})",
        country="US",
        region_code=us_region_code,
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

    label_en = sector.get("label_en", sector["label"])
    proxy_suffix = " [proxy: ITAEE manufactura total]" if approximation_note else ""
    labels = {
        mx_series_id: f"ITAEE - Actividad industrial ({mx_state_label}, INEGI real{proxy_suffix})",
        us_series_id: f"Empleo manufacturero - {label_en} ({us_state_label}, BLS real)",
    }
    return {mx_series_id: mx_tidy, us_series_id: us_tidy}, labels


# ---------------------------------------------------------------------
# Overrides declarativos: qué pares pasan de mock a real y con qué claves.
# Cada clave fue VERIFICADA contra la API real antes de agregarse aquí (ver
# docstring del módulo para la tabla completa de cobertura y las
# aproximaciones documentadas).
# ---------------------------------------------------------------------
_ITAEE_MANUFACTURING_FALLBACK_NOTE = (
    "ITAEE específico de este sector no existe en el catálogo estatal público de "
    "INEGI (se navegó el árbol completo 'Actividad industrial por entidad "
    "federativa, base 2018' y la granularidad máxima es manufactura 31-33 total); "
    "se usa 741651 (ITAEE manufactura total) como mejor proxy disponible del lado MX."
)

REAL_NATIONAL_OVERRIDES: list[dict[str, Any]] = [
    {
        "sector_id": "aeroespacial",
        "mx_indicator_id": "736515",  # 3364 Fabricación de equipo aeroespacial
        "us_series_id_real": "IPG3364N",
    },
    {
        "sector_id": "farmaceutica",
        "mx_indicator_id": "736462",  # 3254 Fabricación de productos farmacéuticos
        "us_series_id_real": "IPG3254N",
    },
    {
        "sector_id": "eolica",
        "mx_indicator_id": "736491",  # Total subsector 333 (maquinaria y equipo)
        "us_series_id_real": "IPG333N",
        "approximation_note": (
            "SCIAN/NAICS 333611 (turbinas eólicas) no está desagregado ni en el "
            "catálogo IMAI de INEGI ni en FRED; se usa el subsector 333 completo "
            "('Fabricación de maquinaria y equipo') en ambos lados para mantener "
            "granularidad consistente."
        ),
    },
    {
        "sector_id": "agroindustrial",
        "mx_indicator_id": "736427",  # 3118 Elaboración de productos de panadería y tortillas
        "us_series_id_real": "IPN3118N",
        "approximation_note": (
            "Proxy ya declarado en scian_naics_crosswalk.csv (cacao/vainilla vía "
            "panadería y tortillas); no existe indicador SCIAN 311800 exacto en IMAI."
        ),
    },
    {
        "sector_id": "petroquimica",
        "mx_indicator_id": "736459",  # 3251 Fabricación de productos químicos básicos
        "us_series_id_real": "IPG3251N",
        "mx_scian_code": "325100",
        "mx_naics_code": "3251",
        "approximation_note": (
            "sectors.yaml declara 2 códigos SCIAN para petroquímica (324110 "
            "refinación + 325100 química básica); se usa solo 325100/3251 para una "
            "correspondencia 1:1 clara con una serie FRED real (IPG3251N)."
        ),
    },
    # manufactura_total NO está aquí: ya es real desde el piloto original
    # (INEGI 736407 vs FRED INDPRO, manejado directamente en main()).
]

REAL_STATE_OVERRIDES: list[dict[str, Any]] = [
    # --- Aeroespacial: fallback ITAEE manufactura total + BLS aeroespacial real ---
    {
        "sector_id": "aeroespacial",
        "mx_abbr": "CHH", "mx_area_code": "08", "mx_state_label": "Chihuahua",
        "us_abbr": "TX", "us_region_code": "48", "us_state_label": "Texas",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU48000003133640001",
        "us_series_disambiguator": None,  # par original, sin disambiguador (ver generate_mock_data.py)
        "approximation_note": _ITAEE_MANUFACTURING_FALLBACK_NOTE,
    },
    {
        "sector_id": "aeroespacial",
        "mx_abbr": "BC", "mx_area_code": "02", "mx_state_label": "Baja California",
        "us_abbr": "CA", "us_region_code": "06", "us_state_label": "California",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU06000003133640001",
        "us_series_disambiguator": "BC",
        "approximation_note": _ITAEE_MANUFACTURING_FALLBACK_NOTE,
    },
    {
        "sector_id": "aeroespacial",
        "mx_abbr": "SON", "mx_area_code": "26", "mx_state_label": "Sonora",
        "us_abbr": "AZ", "us_region_code": "04", "us_state_label": "Arizona",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU04000003133640001",
        "us_series_disambiguator": "SON",
        "approximation_note": _ITAEE_MANUFACTURING_FALLBACK_NOTE,
    },
    # Coahuila-Texas, Nuevo León-Texas y Tamaulipas-Texas (aeroespacial) NO
    # están aquí: INEGI 741651/741177 devuelven ErrorCode:100 para area_code
    # "05", "19" y "28" respectivamente (verificado, no es un bug de este
    # pipeline) — permanecen en modo mock.

    # --- Manufactura total: INEGI 741651 es la correspondencia EXACTA (no proxy) ---
    {
        "sector_id": "manufactura_total",
        "mx_abbr": "BC", "mx_area_code": "02", "mx_state_label": "Baja California",
        "us_abbr": "CA", "us_region_code": "06", "us_state_label": "California",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU06000003000000001",
        "us_series_disambiguator": "BC",
    },
    {
        "sector_id": "manufactura_total",
        "mx_abbr": "SON", "mx_area_code": "26", "mx_state_label": "Sonora",
        "us_abbr": "AZ", "us_region_code": "04", "us_state_label": "Arizona",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU04000003000000001",
        "us_series_disambiguator": "SON",
    },
    # Chihuahua-Texas (manufactura_total) NO está aquí: ya es real desde el
    # piloto original (manejado directamente en main()).
    # Coahuila/Nuevo León/Tamaulipas-Texas (manufactura_total) NO están aquí:
    # mismo ErrorCode:100 de INEGI que en aeroespacial — permanecen mock.

    # --- Farmacéutica: fallback ITAEE manufactura total + BLS farmacéutica real ---
    {
        "sector_id": "farmaceutica",
        "mx_abbr": "JAL", "mx_area_code": "14", "mx_state_label": "Jalisco",
        "us_abbr": "NJ", "us_region_code": "34", "us_state_label": "New Jersey",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU34000003232540001",
        "us_series_disambiguator": "JAL",
        "approximation_note": _ITAEE_MANUFACTURING_FALLBACK_NOTE,
    },
    {
        "sector_id": "farmaceutica",
        "mx_abbr": "SIN", "mx_area_code": "25", "mx_state_label": "Sinaloa",
        "us_abbr": "NC", "us_region_code": "37", "us_state_label": "North Carolina",
        "mx_indicator_id": "741651",
        "us_series_id_real": "SMU37000003232540001",
        "us_series_disambiguator": "SIN",
        "approximation_note": _ITAEE_MANUFACTURING_FALLBACK_NOTE,
    },
    # Veracruz-Florida (agroindustrial) NO está aquí: INEGI 741651/741177
    # devuelven ErrorCode:100 para area_code "30" — permanece en modo mock.
]


def _try_override(
    label: str,
    fetch_fn,
    series_lookup: dict[str, Any],
    series_labels: dict[str, str],
    status: list[tuple[str, str]],
) -> None:
    """Corre `fetch_fn()` (una llamada real a una fuente externa) y, si tiene
    éxito, sustituye las series mock correspondientes por las reales. Si
    falla por CUALQUIER motivo (credencial faltante, rate limit, caída
    temporal de la fuente, cambio de esquema en la respuesta...), registra el
    fallo y NO propaga la excepción — el par en cuestión simplemente se queda
    con los datos mock ya generados en el paso 1, en vez de tumbar toda la
    corrida. Así es seguro dejar esto corriendo sin supervisión en un cron:
    un solo API caído degrada un par, no todo el pipeline."""
    try:
        frames, labels = fetch_fn()
    except Exception as exc:  # noqa: BLE001 - resiliencia intencional, ver docstring
        logger.warning("Par %s: fuente real falló (%s: %s) — se conserva el dato mock.", label, type(exc).__name__, exc)
        status.append((label, "mock (fallback: fuente real falló)"))
        return
    series_lookup.update(frames)
    series_labels.update(labels)
    status.append((label, "real"))


def main() -> dict[str, Any]:
    sectors = _load_sectors()
    sectors_by_id = {s["id"]: s for s in sectors}
    monthly_dates = _monthly_periods()
    quarterly_dates = _quarterly_periods()

    series_lookup: dict[str, Any] = {}
    series_labels: dict[str, str] = {}
    pair_defs: list[dict[str, Any]] = []
    override_status: list[tuple[str, str]] = []

    # 1) Generar TODO en modo mock primero (idéntico a generate_mock_data.main),
    #    para no perder cobertura de los pares sin claves reales verificadas.
    for idx, sector in enumerate(sectors):
        frames, labels, pair_def = _national_pair_frames(idx, sector, monthly_dates)
        series_lookup.update(frames)
        series_labels.update(labels)
        pair_defs.append(pair_def)

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

    # 2) Sustituir por datos REALES el par nacional+estatal del piloto original
    #    (manufactura_total: INEGI 736407/ITAEE 741651 vs FRED INDPRO/BLS
    #    transporte-TX), cada llamada protegida por `_try_override` — si
    #    alguna fuente falla, ese par se queda con el mock del paso 1.
    logger.info("Descargando datos reales del piloto original (manufactura_total)...")
    real_sector = sectors_by_id["manufactura_total"]
    _try_override(
        "mx-nac_manufactura_total__us-nac_manufactura_total",
        lambda: _fetch_real_national_pair(
            real_sector, mx_indicator_id=inegi.DEFAULT_INDICATOR_ID, us_series_id_real=fred.DEFAULT_SERIES_ID,
        ),
        series_lookup, series_labels, override_status,
    )
    _try_override(
        "mx-chh_manufactura_total__us-tx_manufactura_total",
        lambda: _fetch_real_state_pair(
            real_sector,
            mx_area_code=CHIHUAHUA_CODE, mx_abbr="CHH", mx_state_label="Chihuahua",
            us_region_code=TEXAS_FIPS, us_abbr="TX", us_state_label="Texas",
            mx_indicator_id=inegi.ITAEE_MANUFACTURING_INDICATOR_ID,
            us_series_id_real=bls.DEFAULT_SERIES_ID,
            us_series_disambiguator="CHH",
        ),
        series_lookup, series_labels, override_status,
    )

    # 3) Sustituir por datos REALES los 5 sectores nacionales nuevos.
    logger.info("Descargando %d pares nacionales reales nuevos...", len(REAL_NATIONAL_OVERRIDES))
    for override in REAL_NATIONAL_OVERRIDES:
        sector = sectors_by_id[override["sector_id"]]
        _try_override(
            f"mx-nac_{override['sector_id']}__us-nac_{override['sector_id']}",
            lambda o=override, s=sector: _fetch_real_national_pair(
                s,
                mx_indicator_id=o["mx_indicator_id"],
                us_series_id_real=o["us_series_id_real"],
                mx_scian_code=o.get("mx_scian_code"),
                mx_naics_code=o.get("mx_naics_code"),
                approximation_note=o.get("approximation_note"),
            ),
            series_lookup, series_labels, override_status,
        )

    # 4) Sustituir por datos REALES los 7 pares estatales nuevos verificados.
    logger.info("Descargando %d pares estatales reales nuevos...", len(REAL_STATE_OVERRIDES))
    for override in REAL_STATE_OVERRIDES:
        sector = sectors_by_id[override["sector_id"]]
        pair_label = f"mx-{override['mx_abbr'].lower()}_{override['sector_id']}__us-{override['us_abbr'].lower()}_{override['sector_id']}"
        _try_override(
            pair_label,
            lambda o=override, s=sector: _fetch_real_state_pair(
                s,
                mx_area_code=o["mx_area_code"],
                mx_abbr=o["mx_abbr"],
                mx_state_label=o["mx_state_label"],
                mx_indicator_id=o["mx_indicator_id"],
                us_region_code=o["us_region_code"],
                us_abbr=o["us_abbr"],
                us_state_label=o["us_state_label"],
                us_series_id_real=o["us_series_id_real"],
                us_series_disambiguator=o.get("us_series_disambiguator"),
                approximation_note=o.get("approximation_note"),
            ),
            series_lookup, series_labels, override_status,
        )

    n_real_pairs = sum(1 for _, status in override_status if status == "real")
    n_attempted = len(override_status)
    if n_real_pairs == 0:
        mode = "mock"
    elif n_real_pairs == len(pair_defs):
        mode = "live"
    else:
        mode = "mixed"

    logger.info("Resumen de fuentes reales intentadas (%d/%d exitosas):", n_real_pairs, n_attempted)
    for label, status in override_status:
        logger.info("  %-70s %s", label, status)

    logger.info(
        "Corriendo motor econométrico sobre %d pares (%d con datos reales, mode=%s)...",
        len(pair_defs), n_real_pairs, mode,
    )
    results = run_all(pair_defs, series_lookup, sectors_by_id)

    logger.info("Exportando manifest/series/results a data/ (mode=%s)...", mode)
    manifest = export_all(
        sectors=sectors,
        series_lookup=series_lookup,
        series_labels=series_labels,
        pair_defs=pair_defs,
        results=results,
        mode=mode,
        refresh_cadence="trimestral",
    )
    logger.info(
        "Listo: %d sectores, %d series, %d pares (%s: %d pares con datos reales).",
        len(sectors), len(series_lookup), len(pair_defs), mode, n_real_pairs,
    )
    return manifest


if __name__ == "__main__":
    main()
