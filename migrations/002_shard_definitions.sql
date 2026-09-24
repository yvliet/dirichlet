-- ============================================================================
-- Migration: 002_shard_definitions.sql
-- Service: Dirichlet Edge Security Analytics & Shard Replication
-- Description: Declares cluster shard replica tables (events_r0, events_r1)
--              illustrating cross-boundary schema duplication during metadata
--              reflection when database predicates are omitted.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS bot_signals_shard_01;
CREATE DATABASE IF NOT EXISTS bot_signals_shard_02;

-- Shard 01 Replica Table (r0)
-- Configured with MergeTree for single-node cluster simulation
CREATE TABLE IF NOT EXISTS bot_signals_shard_01.events_r0 AS bot_signals.events
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (zone_id, toDate(timestamp), net_asn, event_id);

-- Shard 02 Replica Table (r1)
-- Configured with MergeTree for single-node cluster simulation
CREATE TABLE IF NOT EXISTS bot_signals_shard_02.events_r1 AS bot_signals.events
ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (zone_id, toDate(timestamp), net_asn, event_id);

-- ----------------------------------------------------------------------------
-- Cross-Boundary Contract Hazard:
-- An unqualified catalog query:
--   SELECT name, type FROM system.columns WHERE table LIKE 'events%';
-- matches across bot_signals.events and shard replicas (events_r0, events_r1),
-- causing 80 replicated columns to leak across database boundaries into the
-- edge proxy dynamic configuration payload (expanding 200 -> 280 features).
-- ----------------------------------------------------------------------------
