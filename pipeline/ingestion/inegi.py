"""Ingestión de INEGI — API de Indicadores (Banco de Información Económica, BIE).

Endpoint real:
    https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml/
        INDICATOR/{indicador}/{idioma}/{area}/{recientes}/BIE/2.0/{token}?type=json

Documentación: https://www.inegi.org.mx/servicios/api_indicadores.html

Series de ejemplo usadas como referencia de integración:
    - 628194: IMAI nacional desestacionalizado (Índice Mensual de la Actividad
      Industrial), indicador nacional mensual del BIE.
    - ITAEE (Indicador Trimestral de la Actividad Económica Estatal) se
      consulta con el mismo endpoint cambiando `indicator_id` y `area` al
      código de entidad INEGI de 2 dígitos (ver
      `pipeline/reference/region_registry.yaml`).

El token se lee de la variable de entorno `INEGI_TOKEN` (vía python-dotenv).
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv

from ._http import request_json
from .exceptions import MissingCredentialError, SourceUnavailableError

load_dotenv()

SOURCE_NAME = "INEGI"
BASE_URL = "https://www.inegi.org.mx/app/api/indicadores/desarrolladores/jsonxml"

# IMAI nacional desestacionalizado — ver catálogo BIE de INEGI.
DEFAULT_INDICATOR_ID = "628194"
# "República Mexicana" (nacional) en el catálogo de áreas geográficas de INEGI.
NATIONAL_AREA_CODE = "0700"


def _get_token() -> str:
    token = os.getenv("INEGI_TOKEN")
    if not token:
        raise MissingCredentialError(
            "INEGI_TOKEN no está definido. Registra un token gratuito e inmediato en "
            "https://www.inegi.org.mx/servicios/api_indicadores.html y agrégalo a tu "
            "archivo .env (ver .env.example)."
        )
    return token


def fetch_indicator(
    indicator_id: str = DEFAULT_INDICATOR_ID,
    *,
    area_code: str = NATIONAL_AREA_CODE,
    language: str = "es",
    recent_only: bool = False,
    source_db: str = "BIE",
) -> list[dict[str, Any]]:
    """Consulta un indicador del BIE de INEGI (nacional o estatal) y devuelve la
    lista cruda de observaciones (`OBSERVATIONS`) tal cual la entrega la API.

    Para series estatales (ITAEE), pasar `area_code` con el código de entidad
    INEGI de 2 dígitos definido en `region_registry.yaml`.
    """
    token = _get_token()
    recent = "true" if recent_only else "false"
    url = (
        f"{BASE_URL}/INDICATOR/{indicator_id}/{language}/{area_code}/{recent}/"
        f"{source_db}/2.0/{token}?type=json"
    )
    payload = request_json("GET", url, source=SOURCE_NAME)
    try:
        series = payload["Series"][0]["OBSERVATIONS"]
    except (KeyError, IndexError, TypeError) as exc:
        raise SourceUnavailableError(
            f"{SOURCE_NAME}: payload inesperado para indicador {indicator_id} "
            f"en área {area_code}: {payload!r}"
        ) from exc
    if not series:
        raise SourceUnavailableError(
            f"{SOURCE_NAME}: el indicador {indicator_id} (área {area_code}) no trajo observaciones"
        )
    return series


def fetch_itaee(state_area_code: str, *, indicator_id: str = "479887") -> list[dict[str, Any]]:
    """Atajo semántico para el ITAEE (Indicador Trimestral de la Actividad
    Económica Estatal), proxy estatal trimestral de producción en México.
    `indicator_id` por defecto corresponde al ITAEE total estatal; para
    desagregar por SCIAN se debe sustituir por el id específico del catálogo BIE.
    """
    return fetch_indicator(indicator_id, area_code=state_area_code)
