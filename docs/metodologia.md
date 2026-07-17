# Metodología

## Qué extiende y qué no del Atlas

El libro [*Atlas prospectivo territorial-industrial para la atracción de inversiones*](https://play.google.com/store/books/details?id=XM2cEQAAQBAJ), de Javier Jileta-Ockholm (Scientika, 2025), es un diagnóstico estructural, no un análisis de series de tiempo: usa Ventaja Comparativa Revelada (VCR), participación en la matriz insumo-producto, y un modelo de cambio-participación (shift-share), sobre datos de corte transversal (2019 vs 2014). No prueba causalidad ni cointegración.

Este proyecto toma del Atlas: los 5 sectores estratégicos (energía eólica, farmacéutica, aeroespacial, agroindustrial, petroquímica), su clasificación SCIAN, y los corredores territoriales identificados. Sobre esa base construye una capa econométrica propia con series de tiempo reales.

## Motor econométrico (`pipeline/econometrics/`)

1. **Estacionariedad** (`stationarity.py`): transformación logarítmica, `adfuller` (ADF) como prueba principal y `kpss` como confirmatoria (hipótesis nula opuesta), diferenciación hasta orden 2 si es necesario.
2. **Causalidad de Granger** (`granger.py`): VAR (`statsmodels.tsa.api.VAR`) con selección de orden por BIC, `test_causality` corrido en ambas direcciones — nunca se asume una sola dirección.
3. **Cointegración** (`cointegration.py`): Engle-Granger (`coint`) como *screening* rápido bivariado, Johansen (`coint_johansen`) como resultado autoritativo para sistemas multivariados, y si hay cointegración se ajusta un VECM para extraer el vector de cointegración y la velocidad de ajuste.
4. **Corrección por comparaciones múltiples**: FDR de Benjamini-Hochberg sobre el conjunto completo de p-values de Granger de cada corrida (no por par aislado) — con decenas de pares evaluados, sin esta corrección la tasa de falsos positivos se dispara.
5. **Umbral mínimo de observaciones**: un par con menos observaciones que el umbral configurado se marca `insufficient_data` en vez de reportar un estadístico potencialmente espurio.

## Asimetría de proxies MX-EEUU a nivel estatal

México no publica un índice de producción industrial mensual por estado — el proxy real es el ITAEE (trimestral, ~120 días de rezago). Estados Unidos no publica producción industrial por estado en FRED — el mejor proxy público es empleo/horas manufactureras de BLS. Por eso cada resultado declara explícitamente `proxy_type: "output_index"` (México, ITAEE) vs `proxy_type: "labor_input"` (EEUU, BLS): una relación "México causa a Texas" en este contexto es "producción mexicana causa empleo manufacturero en Texas", no una relación producción-producción simétrica.

## Periodicidad real de los datos

El pipeline corre trimestralmente, pero eso no significa que cada serie tenga un dato nuevo cada trimestre — el dashboard muestra la periodicidad real de cada indicador (mensual/trimestral/anual) y la fecha del dato más reciente, nunca una granularidad falsa.
