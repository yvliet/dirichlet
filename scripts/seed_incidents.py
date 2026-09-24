#!/usr/bin/env python3
"""
Seed comprehensive incidents into Turso libSQL database and export static JSON snapshots.
Populates incident history records and exports static JSON snapshots.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from scripts.turso_client import execute_turso_queries, export_snapshots_to_disk

INCIDENTS_SEED = [
    {
        "id": "inc-2026-09-24-bgp",
        "title": "Customers using BYOIP can have issues updating their BGP prefixes, including advertising or withdrawing prefixes.",
        "service": "svc-ip",
        "service_group": "group-proxy",
        "severity": "minor",
        "status": "resolved",
        "impact": "Minor Impact",
        "root_cause": "BGP route reflection update latency across edge prefixes",
        "started_at": "2026-09-24T10:22:34.763Z",
        "resolved_at": "2026-09-24T10:25:52.106Z",
        "updates": [
            {
                "time": "2026-09-24T10:25:52.106Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "This incident has now been resolved - Customers with BYOIP addresses were unable to update their BGP prefixes, including advertising or withdrawing prefixes. Customers making changes to their address maps may also have experienced delays."
            },
            {
                "time": "2026-09-24T10:22:34.862Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "We are currently investigating an issue where customers with BYOIP addresses will be unable to update their BGP prefixes, including advertising or withdrawing prefixes."
            }
        ]
    },
    {
        "id": "inc-2026-09-24-drift",
        "title": "L7 Edge Proxy Ingestion Panic (TryFromSliceError)",
        "service": "svc-fl2",
        "service_group": "group-proxy",
        "severity": "critical",
        "status": "resolved",
        "impact": "100% 502 Bad Gateway across edge PoPs",
        "root_cause": "system.columns multi-shard reflection expanded dynamic catalog to 280 features",
        "started_at": "2026-09-24T11:28:06.041Z",
        "resolved_at": "2026-09-24T11:42:08.960Z",
        "updates": [
            {
                "time": "2026-09-24T11:42:08.960Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "In-place partial selection (select_nth_unstable_by) shed 80 shadow columns. All 200 core signals restored with 0 B heap reallocations. 100% edge traffic restored."
            },
            {
                "time": "2026-09-24T11:35:12.000Z",
                "status": "monitoring",
                "title": "Monitoring",
                "message": "Kernel memory and edge proxy daemon processes stabilized across canary PoPs. Edge latency returned to sub-1.2ms baseline."
            },
            {
                "time": "2026-09-24T11:31:40.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Identified cross-boundary schema drift: ClickHouse system.columns multi-shard reflection expanded dynamic catalog to 280 features, overflowing fixed stack buffer [Feature; 200]."
            },
            {
                "time": "2026-09-24T11:28:06.041Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Critical panic detected: L7 Edge Proxy Ingestion Panic (TryFromSliceError). Edge proxy non-responsive across all ingress points."
            }
        ]
    },
    {
        "id": "inc-2026-09-24-auth",
        "title": "Intermittent authentication errors for API and R2",
        "service": "svc-api",
        "service_group": "group-cdn",
        "severity": "minor",
        "status": "resolved",
        "impact": "Minor error rate for scoped credential validation",
        "root_cause": "Key validation cache rebalancing latency on edge auth tier",
        "started_at": "2026-09-23T20:59:35.579Z",
        "resolved_at": "2026-09-23T22:44:32.859Z",
        "updates": [
            {
                "time": "2026-09-23T22:44:32.859Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Cache configuration redeployed and distributed to all regional edge auth caches. Error rates returned to baseline."
            },
            {
                "time": "2026-09-23T21:59:10.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Root cause identified in regional edge auth cache tier lease invalidation loop."
            },
            {
                "time": "2026-09-23T20:59:35.579Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating elevated authentication failures and scoped token validation timeouts on API and R2 gateway."
            }
        ]
    },
    {
        "id": "inc-2026-09-23-cache",
        "title": "Elevated Errors with any / all in http_response_cache_settings",
        "service": "svc-cdn",
        "service_group": "group-cdn",
        "severity": "minor",
        "status": "resolved",
        "impact": "Edge rule evaluation syntax errors on combined predicate",
        "root_cause": "Parser regex boundary condition on nested array expressions in cache rule compiler",
        "started_at": "2026-09-23T15:54:28.000Z",
        "resolved_at": "2026-09-23T18:08:18.013Z",
        "updates": [
            {
                "time": "2026-09-23T18:08:18.013Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Rule compiler syntax patch distributed to all colo PoPs. Cache evaluation syntax errors resolved."
            },
            {
                "time": "2026-09-23T16:45:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Isolated syntax tokenizer edge case triggered by combined any/all predicates in http_response_cache_settings."
            },
            {
                "time": "2026-09-23T15:54:28.000Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Monitoring increased customer rule evaluation exceptions when modifying complex cache settings."
            }
        ]
    },
    {
        "id": "inc-2026-09-22-do",
        "title": "Increased Errors for Durable Objects",
        "service": "svc-kv",
        "service_group": "group-storage",
        "severity": "major",
        "status": "resolved",
        "impact": "Object replication stalls on multi-region sync",
        "root_cause": "Distributed lock lease expiry under high network concurrency",
        "started_at": "2026-09-22T11:14:32.859Z",
        "resolved_at": "2026-09-22T13:14:32.859Z",
        "updates": [
            {
                "time": "2026-09-22T13:14:32.859Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Lock contention resolved with revised lease expiry backoff parameters. Replication queues cleared."
            },
            {
                "time": "2026-09-22T12:05:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Distributed lock lease expiry timer conflict observed under high concurrent synchronization in US-EAST."
            },
            {
                "time": "2026-09-22T11:14:32.859Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating replica lock contention and synchronization delays in US-EAST colo clusters."
            }
        ]
    },
    {
        "id": "inc-2026-09-21-r2-au",
        "title": "Elevated number of R2 503 errors in Australian Eastern Coast region",
        "service": "svc-fl2",
        "service_group": "group-proxy",
        "severity": "minor",
        "status": "resolved",
        "impact": "Temporary 503 errors on object storage fetches in Sydney and Melbourne",
        "root_cause": "Subsea fiber cable maintenance caused upstream gateway congestion",
        "started_at": "2026-09-21T09:12:00.000Z",
        "resolved_at": "2026-09-21T11:25:00.000Z",
        "updates": [
            {
                "time": "2026-09-21T11:25:00.000Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Anycast traffic rerouted to redundant oceanic links. 503 error rates dropped to baseline 0%."
            },
            {
                "time": "2026-09-21T10:02:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Identified upstream transit latency spikes on Sydney (SYD) edge interconnects."
            },
            {
                "time": "2026-09-21T09:12:00.000Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating transient 503 service unavailable errors affecting R2 object downloads in Australia."
            }
        ]
    },
    {
        "id": "inc-2026-09-20-dns",
        "title": "Issues with 1.1.1.1 for Families",
        "service": "svc-dns",
        "service_group": "group-proxy",
        "severity": "minor",
        "status": "resolved",
        "impact": "Malware and adult domain filtering rule propagation delays",
        "root_cause": "BGP prefix synchronization lag on filtering blocklists",
        "started_at": "2026-09-20T07:15:00.000Z",
        "resolved_at": "2026-09-20T08:26:00.000Z",
        "updates": [
            {
                "time": "2026-09-20T08:26:00.000Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Resolver policy tables synchronized across all edge nodes. Policy enforcement restored."
            },
            {
                "time": "2026-09-20T07:40:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Blocklist propagation daemon stalled due to socket timeout on secondary distribution nodes."
            },
            {
                "time": "2026-09-20T07:15:00.000Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating intermittent policy evaluation bypass reports for 1.1.1.1 for Families."
            }
        ]
    },
    {
        "id": "inc-2026-09-18-shards",
        "title": "ClickHouse Replica Desynchronization on Analytical Shard 2",
        "service": "svc-shards",
        "service_group": "group-storage",
        "severity": "minor",
        "status": "resolved",
        "impact": "Delayed real-time feature extraction aggregation queries",
        "root_cause": "Zookeeper metadata sync timeout during cluster node rotation",
        "started_at": "2026-09-18T14:20:00.000Z",
        "resolved_at": "2026-09-18T15:45:00.000Z",
        "updates": [
            {
                "time": "2026-09-18T15:45:00.000Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Shard 2 replica part log caught up with primary. Mutation queues drained."
            },
            {
                "time": "2026-09-18T14:50:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Replica queue lag detected following scheduled cluster node maintenance in Frankfurt."
            },
            {
                "time": "2026-09-18T14:20:00.000Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating elevated replication delays on ClickHouse events_r1 shard table."
            }
        ]
    },
    {
        "id": "inc-2026-09-15-ja4",
        "title": "Cryptographic Fingerprint Evaluator Rate Limit Throttling",
        "service": "svc-ja4",
        "service_group": "group-proxy",
        "severity": "minor",
        "status": "resolved",
        "impact": "Brief fallback to heuristic fingerprinting for TLS client handshakes",
        "root_cause": "High volume of anomalous TLS ClientHello extensions exceeding cache buffer",
        "started_at": "2026-09-15T18:10:00.000Z",
        "resolved_at": "2026-09-15T19:05:00.000Z",
        "updates": [
            {
                "time": "2026-09-15T19:05:00.000Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Buffer capacity doubled across L7 TLS termination daemons. Handshake latency normalized."
            },
            {
                "time": "2026-09-15T18:35:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Novel botnet TLS grease configuration triggered LRU eviction cascades in JA4 evaluator."
            },
            {
                "time": "2026-09-15T18:10:00.000Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating latency spikes during TLS handshake fingerprint generation in Tokyo PoP."
            }
        ]
    },
    {
        "id": "inc-2026-09-12-entropy",
        "title": "Header Entropy Scorer Parser Edge Cases on RFC 9110 Headers",
        "service": "svc-entropy",
        "service_group": "group-proxy",
        "severity": "minor",
        "status": "resolved",
        "impact": "Benign requests flagged with elevated bot confidence score",
        "root_cause": "Unicode normalization edge case in Shannon entropy character distribution window",
        "started_at": "2026-09-12T10:00:00.000Z",
        "resolved_at": "2026-09-12T11:18:00.000Z",
        "updates": [
            {
                "time": "2026-09-12T11:18:00.000Z",
                "status": "resolved",
                "title": "Resolved",
                "message": "Entropy calculation tokenizer updated with standard UTF-8 NFC normalization. False positive rate returned to 0%."
            },
            {
                "time": "2026-09-12T10:30:00.000Z",
                "status": "identified",
                "title": "Identified",
                "message": "Non-ASCII request header values caused skew in logarithmic entropy scoring distribution."
            },
            {
                "time": "2026-09-12T10:00:00.000Z",
                "status": "investigating",
                "title": "Investigating",
                "message": "Investigating elevated challenge rates on international non-ASCII user agent headers."
            }
        ]
    }
]


def seed_database():
    print(f"[seed-incidents] Seeding {len(INCIDENTS_SEED)} incidents into Turso...")
    statements = []
    for inc in INCIDENTS_SEED:
        updates_json = json.dumps(inc["updates"]).replace("'", "''")
        title_esc = inc["title"].replace("'", "''")
        impact_esc = inc["impact"].replace("'", "''")
        root_cause_esc = (inc.get("root_cause") or "").replace("'", "''")

        sql = f"""
        INSERT OR REPLACE INTO incidents (id, title, service, service_group, severity, status, impact, root_cause, started_at, resolved_at, updates_json)
        VALUES ('{inc["id"]}', '{title_esc}', '{inc["service"]}', '{inc["service_group"]}', '{inc["severity"]}', '{inc["status"]}', '{impact_esc}', '{root_cause_esc}', '{inc["started_at"]}', '{inc["resolved_at"]}', '{updates_json}');
        """
        statements.append(sql.strip())

    res = execute_turso_queries(statements)
    if res is not None:
        print("[seed-incidents] Successfully seeded incidents into Turso libSQL.")
    else:
        print("[seed-incidents] Notice: Turso query direct execution returned None, writing local snapshots directly.")

    export_snapshots_to_disk()
    print("[seed-incidents] Snapshots exported to data/incidents.json")


if __name__ == "__main__":
    seed_database()
