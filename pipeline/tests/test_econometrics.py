"""Pruebas del motor econométrico con series sintéticas de causalidad y
cointegración conocidas analíticamente (no series reales) — el objetivo es
que un economista pueda auditar la corrección del motor mismo, no la calidad
de ningún dataset.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest


# Los nombres reales de estas funciones (test_engle_granger, test_johansen,
# test_granger_causality, test_stationarity) siguen la convención de nombrar
# "test de hipótesis estadística" del módulo de econometría. Se importan con
# alias para que pytest no las confunda con funciones de prueba de este
# archivo (pytest colecciona cualquier callable `test_*` en el namespace del
# módulo, incluyendo nombres importados).
from pipeline.econometrics.cointegration import test_engle_granger as run_engle_granger
from pipeline.econometrics.cointegration import test_johansen as run_johansen
from pipeline.econometrics.granger import test_granger_causality as run_granger_causality
from pipeline.econometrics.stationarity import test_stationarity as run_stationarity_test
from pipeline.processing.align import align_pair
from pipeline.processing.normalize import SeriesMeta, normalize_series

ALPHA = 0.05


def _dates(n: int, freq: str = "MS") -> pd.DatetimeIndex:
    return pd.date_range("2000-01-01", periods=n, freq=freq)


# --------------------------------------------------------------------------
# Granger: x causa y (y[t] = 0.5*x[t-1] + ruido), y NO causa x.
# --------------------------------------------------------------------------
class TestGrangerCausality:
    def test_detects_known_unidirectional_causality(self):
        rng = np.random.default_rng(7)
        n = 300
        x = rng.normal(0, 1, size=n)
        y = np.zeros(n)
        for t in range(1, n):
            y[t] = 0.5 * x[t - 1] + rng.normal(0, 1) * 0.3

        idx = _dates(n)
        x_series = pd.Series(x, index=idx)
        y_series = pd.Series(y, index=idx)

        # x, y son estacionarias por construcción (combinación lineal de
        # ruido blanco): order_integrated=0 para ambas.
        result = run_granger_causality(x_series, y_series, order_a=0, order_b=0)

        assert result.a_causes_b.p_value < ALPHA, "x debería Granger-causar a y (relación conocida por diseño)"
        assert result.b_causes_a.p_value > ALPHA, "y no debería Granger-causar a x (no hay canal de retorno en el DGP)"
        # La dirección verdadera debe ser MUCHO más significativa que la falsa.
        assert result.a_causes_b.p_value < result.b_causes_a.p_value

    def test_optimal_lag_is_positive_and_criterion_recorded(self):
        rng = np.random.default_rng(7)
        n = 250
        x = rng.normal(0, 1, size=n)
        y = np.zeros(n)
        for t in range(1, n):
            y[t] = 0.5 * x[t - 1] + rng.normal(0, 1) * 0.3
        idx = _dates(n)
        result = run_granger_causality(pd.Series(x, index=idx), pd.Series(y, index=idx), 0, 0)
        assert result.optimal_lag >= 1
        assert result.selection_criterion == "bic"


# --------------------------------------------------------------------------
# Cointegración: tendencia estocástica común -> cointegrados; dos random
# walks independientes -> NO cointegrados.
# --------------------------------------------------------------------------
class TestCointegration:
    def test_detects_cointegration_with_common_trend(self):
        rng = np.random.default_rng(11)
        n = 300
        common = np.cumsum(rng.normal(0, 1, size=n))
        a = common + rng.normal(0, 0.5, size=n)
        b = 0.8 * common + rng.normal(0, 0.5, size=n)

        idx = _dates(n)
        a_series = pd.Series(a, index=idx)
        b_series = pd.Series(b, index=idx)

        eg = run_engle_granger(a_series, b_series)
        assert eg.cointegrated, "Engle-Granger debería detectar la tendencia común como cointegración"
        assert eg.p_value < ALPHA

        levels_df = pd.concat([a_series.rename("a"), b_series.rename("b")], axis=1)
        johansen = run_johansen(levels_df)
        assert johansen.rank >= 1, "Johansen debería reportar rango de cointegración >= 1"

    def test_rejects_independent_random_walks(self):
        rng = np.random.default_rng(42)
        n = 300
        a = np.cumsum(rng.normal(0, 1, size=n))
        b = np.cumsum(rng.normal(0, 1, size=n))  # sin componente común

        idx = _dates(n)
        a_series = pd.Series(a, index=idx)
        b_series = pd.Series(b, index=idx)

        eg = run_engle_granger(a_series, b_series)
        assert not eg.cointegrated, "Dos random walks independientes no deberían cointegrar"
        assert eg.p_value > ALPHA

        levels_df = pd.concat([a_series.rename("a"), b_series.rename("b")], axis=1)
        johansen = run_johansen(levels_df)
        assert johansen.rank == 0


# --------------------------------------------------------------------------
# Estacionariedad: ruido blanco es I(0); un random walk necesita diferenciarse.
# --------------------------------------------------------------------------
class TestStationarity:
    def test_white_noise_is_integrated_order_zero(self):
        rng = np.random.default_rng(3)
        series = pd.Series(rng.normal(10, 1, size=200))  # nivel positivo -> permite log
        result = run_stationarity_test(series)
        assert result.order_integrated == 0
        assert result.is_stationary

    def test_random_walk_requires_differencing(self):
        rng = np.random.default_rng(3)
        series = pd.Series(100 + np.cumsum(rng.normal(0, 1, size=200)))
        result = run_stationarity_test(series)
        assert result.order_integrated >= 1


# --------------------------------------------------------------------------
# Umbral de insufficient_data en processing.align.
# --------------------------------------------------------------------------
class TestInsufficientDataThreshold:
    def _tidy(self, values: np.ndarray, dates: pd.DatetimeIndex, *, frequency: str, series_id: str) -> pd.DataFrame:
        meta = SeriesMeta(
            series_id=series_id,
            source="test",
            country="MX",
            region_code="NAC",
            sector_id="manufactura_total",
            frequency=frequency,
            seasonal_adjustment="nsa",
            units="Índice",
            proxy_type="output_index",
            publication_lag_days=30,
            vintage_date="2026-01-01",
        )
        return normalize_series(list(zip(dates, values)), meta)

    def test_flags_insufficient_data_when_n_obs_too_low(self):
        rng = np.random.default_rng(1)
        n = 5  # muy por debajo de MIN_OBS_QUARTERLY (30)
        dates = pd.date_range("2020-01-01", periods=n, freq="QE")
        a = self._tidy(rng.normal(100, 1, n), dates, frequency="quarterly", series_id="a")
        b = self._tidy(rng.normal(100, 1, n), dates, frequency="quarterly", series_id="b")

        aligned = align_pair(a, b)
        assert aligned.insufficient_data
        assert aligned.n_obs == n

    def test_does_not_flag_when_n_obs_meets_threshold(self):
        rng = np.random.default_rng(1)
        n = 40  # por encima de MIN_OBS_QUARTERLY (30)
        dates = pd.date_range("2010-01-01", periods=n, freq="QE")
        a = self._tidy(rng.normal(100, 1, n), dates, frequency="quarterly", series_id="a")
        b = self._tidy(rng.normal(100, 1, n), dates, frequency="quarterly", series_id="b")

        aligned = align_pair(a, b)
        assert not aligned.insufficient_data
        assert aligned.n_obs == n

    def test_resamples_and_aligns_mismatched_frequencies(self):
        rng = np.random.default_rng(5)
        n_months = 120
        monthly_dates = pd.date_range("2010-01-01", periods=n_months, freq="ME")
        quarterly_dates = pd.date_range("2010-01-01", periods=n_months // 3, freq="QE")

        monthly = self._tidy(rng.normal(100, 1, n_months), monthly_dates, frequency="monthly", series_id="m")
        quarterly = self._tidy(
            rng.normal(100, 1, n_months // 3), quarterly_dates, frequency="quarterly", series_id="q"
        )

        aligned = align_pair(monthly, quarterly)
        assert aligned.frequency_used == "quarterly"  # la más baja de las dos
        assert aligned.n_obs == n_months // 3
        assert not aligned.insufficient_data


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
