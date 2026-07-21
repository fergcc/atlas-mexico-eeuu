# Fuentes de geografía

## mx-states.topojson

- **Origen**: [markmarkoh/datamaps](https://github.com/markmarkoh/datamaps), archivo `src/js/data/mex.topo.json`, derivado de datos de Natural Earth (dominio público).
- **Licencia**: MIT (repo `datamaps`).
- **Contenido**: TopoJSON con los 32 estados de México (nombres cortos, ej. "Coahuila" no "Coahuila de Zaragoza"; "Distrito Federal" en vez de "Ciudad de México" por antigüedad del dataset — normalizado en el frontend vía alias de nombre).
- **Pendiente**: reemplazar por el Marco Geoestadístico oficial de INEGI cuando se integre la ingesta real de INEGI (mayor precisión de fronteras), manteniendo el mismo contrato de nombres/códigos de estado.

## us-states.topojson

- **Origen**: [markmarkoh/datamaps](https://github.com/markmarkoh/datamaps), archivo `src/js/data/usa.topo.json`, derivado de datos de Natural Earth (dominio público).
- **Licencia**: MIT (repo `datamaps`).
- **Contenido**: TopoJSON con los 50 estados + DC de Estados Unidos (nombres cortos en inglés, ej. "California", "Texas"). Los códigos FIPS se obtienen por mapeo de `properties.name` normalizado contra el registro `us_states` en `region_registry.yaml`.
