# GAZA — IT/OT + as-built discovery checklist

Updated: 2026-10-06

Purpose: convert the public-evidence demonstrator into an authorised read-only operational twin without guessing software, geometry or control interfaces.

## A. Authoritative geometry

Request:
- latest site plan / DWG / DXF / IFC;
- revision/date/author;
- plot boundary and north;
- building footprints/heights;
- internal roads, gates, weighbridge, tanker reception and truck turning envelopes;
- dock count, bay dimensions and yard clearances;
- ASRS footprint and protected areas;
- utilities/EDARI/boiler-room footprints;
- fire routes, pedestrian routes and restricted zones.

Acceptance: establish a project coordinate system and map every imported object to source + revision.

## B. ERP

Public anchor: Solmicro customer reference exists, but current ERP in 2026 is not verified.

Discover:
- current vendor/product/version;
- modules used for purchasing, production, stock, sales, transport and quality;
- database and ownership;
- supported API / web services / reporting views / scheduled exports;
- master IDs for order, SKU, lot, pallet, customer, carrier and expedition;
- update frequency and historical retention;
- read-only service account / API scope.

## C. GAZACONTROL / MES / SCADA / PLC

Public anchor: GAZACONTROL monitors/automates production and logistics.

Discover:
- integrator/vendor;
- server topology and application names;
- PLC brands/models and cell boundaries;
- SCADA/MES/historian product + version;
- OPC UA endpoints, MQTT brokers, REST services, SQL/reporting databases or file exports;
- tag namespace and asset hierarchy;
- event/alarm semantics;
- NTP/PTP time source;
- retention and quality flags;
- cybersecurity zones/conduits.

No write operations during pilot.

## D. Tetra Pak production equipment

Public anchor: Tetra Pak was identified as principal production-equipment supplier.

Discover:
- exact line/equipment models;
- automation platform and software versions;
- batch/lot IDs and production-order linkage;
- machine state model;
- OEE/event availability;
- CIP state exposure;
- vendor-approved read interface.

Do not assume PlantMaster or any named automation product until verified.

## E. ASRS

Public anchor: 9 levels, Esnova racks, Signode StorFast shuttle carts.

Discover:
- WMS/WCS vendor/product/version;
- host interface to ERP;
- location addressing scheme;
- pallet/license-plate ID;
- task/event feed;
- occupancy and inventory truth source;
- shuttle/lift fault/event feed;
- maintenance interface;
- read-only API/reporting database.

## F. Utilities / Veolia

Public anchors: steam, process water, potable-water treatment, EDARI and waste. Official 2025 groundwater concession: 380390 m3/year, 25.20 l/s max instantaneous, 12.06 l/s mean equivalent.

Discover:
- utility SCADA/BMS/metering platform;
- steam, water, electricity and EDARI meter IDs;
- sampling frequency;
- alarms;
- historian/API;
- contractual boundaries between Gaza and Veolia systems.

## G. Fleet / milk collection / dispatch

Discover:
- TMS/route-planning system;
- GPS/telematics provider;
- tanker temperature logger;
- driver application;
- carrier master;
- slot/appointment source;
- proof-of-delivery;
- actual farm master and privacy rules;
- milk-collection schedules and constraints;
- truck dimensions/weight/axles for HGV routing.

Until authorised, `farm-network.html` uses candidate circuits, not real schedules.

## H. Network / security

Collect only with IT/OT authorization:
- logical topology, not passwords;
- VLAN/zone design;
- firewall boundaries;
- DNS/NTP;
- proxy/egress constraints;
- certificate authority;
- identity provider;
- logging/SIEM;
- backup/DR;
- approved integration host location.

Proposed pilot: integration gateway in a read-only zone/DMZ, outbound browser access only to the gateway, never to PLCs/databases.

## I. Canonical event acceptance

Minimum fields:
- `event_id`
- `source`
- `source_class`
- `observed_at`
- `entity_type`
- `entity_id`
- `event_type`
- `quality`
- `payload`

Every adapter must preserve source timestamps and quality. Synthetic events can never be emitted as `REAL_AUTHORIZED`.

## J. Pilot exit criteria

Read-only pilot is complete only when:
- current software inventory is signed off by Gaza IT/OT;
- as-built geometry source/revision is recorded;
- IDs correlate ERP ↔ production ↔ ASRS ↔ expedition;
- route/fleet data source is identified;
- clock skew is bounded;
- no control writes are possible;
- audit logs identify source and transformation;
- twin values can be reconciled against authority systems;
- rollback is simply disabling the gateway.
