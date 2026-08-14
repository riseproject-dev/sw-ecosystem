---
title: Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack -- RISC-V Ecosystem Status
---

# Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack -- RISC-V Ecosystem Status

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-13<br/>
**Scope:** RISC-V readiness of the Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

## Scoping assumptions

- Vertical is "Databases" as a category, represented by five named engines plus their common production ecosystem. Each engine is treated as critical (the subject of the report); most feature plugins, proxies, operators, exporters, and interchangeable alternatives are optional.
- CPU-only per operator directive: no GPU / CUDA / ROCm paths. GPU-accelerated analytics and vector search are out of scope, not classified.
- "Cloud" is represented by the self-managed OSS substrate (container images, Kubernetes, operators). Proprietary managed services (RDS/Aurora/ElastiCache, Cloud SQL/AlloyDB/MemoryStore, Azure Database) are out of scope, not classified (operator chose OSS-substrate-only).
- Linux/riscv64 server deployment assumed; Windows and macOS server targets are out of scope.
- Comprehensive plugin breadth per operator. Where several near-identical choices exist, one or two representatives are kept as nodes and secondary choices are folded into notes.
- Target profile RVA23U64: RVV 1.0, vector crypto (Zvkned), Zba/Zbb/Zbc, and FP16 are treated as mandatory baseline, so missing SIMD/crypto acceleration is a gap against baseline, not a nicety.

**Out of scope (deliberately not classified):** Managed cloud database services (AWS RDS / Aurora / ElastiCache, GCP Cloud SQL / AlloyDB / MemoryStore, Azure Database); GPU / CUDA / ROCm acceleration paths; Windows and macOS server deployment.

---

## Artifact 1: Layered stack outline

Layers 1-4 below are organized as five vertical stacks -- one per database engine -- instead of
horizontal layers, so each can be pasted as its own PowerPoint diagram. Nodes shared by more than
one engine (connectors, RocksDB/MyRocks, Galera, ProxySQL, Dragonfly) are repeated in each
relevant vertical, marked "(shared with X)". Cross-cutting deployment substrate that is not
specific to any one engine (Kubernetes, containerd, etcd, Prometheus, Grafana, etc.) is broken out
into its own "Shared substrate" section instead of being repeated five times -- paste it as the
common base layer beneath any of the five stacks below.

### PostgreSQL

#### Layer 1 -- Client drivers and connectors

- **libpq** -- blue (critical)
  - PostgreSQL in-tree C client library; compiled arch-specific artifact; full regression suite passes on 3 active upstream riscv64 build farm workers (boomslang, copperhead, greenfly) as of 2026-08-13.
  - License: PostgreSQL License. Governance: PostgreSQL Global Development Group.
  - Release provided by Debian (libpq5 17.10-0+deb13u1), not upstream (upstream ships source tarballs only).
  - Gap: none -- upstream tests riscv64 and the regression suite passes; no SIMD-specific gap reported.

- **psycopg** -- green (optional)
  - Pure-Python PostgreSQL adapter; psycopg-binary C-extension ships 10 upstream riscv64 wheels on PyPI (manylinux + musllinux) with full test suite via QEMU in CI.
  - License: LGPL 3+. Governance: psycopg contributors.

- **pgx** -- green (optional)
  - Pure-Go PostgreSQL driver; no cgo on any code path; inherits riscv64 from the Go toolchain by construction.
  - License: MIT. Governance: jackc / community.

- **pgjdbc** -- green (optional)
  - Pure-Java noarch jar; upstream publishes platform-independent releases directly; inherits riscv64 from its JVM runtime.
  - License: BSD 2-Clause. Governance: pgjdbc contributors.

#### Layer 2 -- Database engine

- **PostgreSQL** -- blue (critical)
  - Full-featured ORDBMS; upstream tests riscv64 natively on 3-4 build farm workers; regression suite (including recovery, aio, module, and misc stages) passes on recent commits; LLVM JIT disabled on riscv64; Zbb/Zbc CRC patches unmerged (performance gap only).
  - License: PostgreSQL License. Governance: PostgreSQL Global Development Group.
  - Release provided by Debian (postgresql-17 17.10-0+deb13u1), not upstream (source tarballs only).
  - Gap: LLVM JIT backend not enabled; CRC32C Zbc/Zbkc hardware acceleration patch open but unmerged; no vectorized buffer checksum path.

#### Layer 3 -- Feature extensions, clustering and proxies

- **pgvector** -- orange (optional)
  - Vector similarity search extension for PostgreSQL; Ubuntu Noble ships 0.6.0-1 for riscv64 (significantly behind upstream v0.8.6); no upstream riscv64 CI of any kind; SIMD distance kernels use scalar fallback on riscv64.
  - License: PostgreSQL License. Governance: pgvector contributors.
  - Release provided by Ubuntu (postgresql-16-pgvector 0.6.0-1, two major releases behind upstream v0.8.6).
  - Gap: RVV distance kernel path not implemented; Ubuntu carries a stale release (0.6.0 vs. upstream 0.8.6); no upstream riscv64 CI gate.

- **Citus** -- red (optional)
  - PostgreSQL sharding and distributed query extension; upstream CI (build_and_test.yml) targets ubuntu-latest amd64 only; zero riscv64 references in codebase; not packaged by any downstream distro or PGDG for riscv64.
  - License: AGPL 3. Governance: Microsoft / citus contributors.
  - Release provided by: none.
  - Gap: no CI, no packaging, no riscv64 artifact from any source.

- **TimescaleDB** -- red (optional)
  - Time-series PostgreSQL extension; upstream CI matrix enumerates only x86 and ARM; Linux packages distributed exclusively via Timescale's private packagecloud.io (not in official archives) for x86/ARM only; source build is the only riscv64 path.
  - License: Timescale License 2.0 (TSL) / Apache 2.0 (community). Governance: Timescale.
  - Release provided by: none.
  - Gap: no upstream riscv64 CI; no official packaging channel for riscv64.

- **PostGIS** -- orange (optional)
  - PostgreSQL spatial data extension; upstream CI runs on ubuntu-latest amd64 only; Debian sid ships 3.4.2+dfsg-1ubuntu3 for riscv64 (Installed on rv-osuosl-02); no upstream riscv64 test gate.
  - License: GPL 2. Governance: OSGeo / PostGIS PSC.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; spatial computation paths have no RVV acceleration.

- **Apache AGE** -- red (optional)
  - Graph database extension for PostgreSQL (openCypher queries); CI runs installcheck only on ubuntu-24.04 x86_64; no riscv64 references in codebase; no binary releases; not packaged downstream.
  - License: Apache 2.0. Governance: Apache Software Foundation.
  - Release provided by: none.
  - Gap: no CI, no packaging, no riscv64 artifact from any source.

- **Patroni** -- green (optional)
  - Python-based high-availability template for PostgreSQL; pure Python py3-none-any wheels on PyPI (v4.1.5, 2026-08-12); architecture-independent by construction.
  - License: MIT. Governance: Zalando / Patroni contributors.

- **PgBouncer** -- orange (optional)
  - Lightweight PostgreSQL connection pooler; upstream CI covers x86_64, aarch64, macOS, Windows only; Debian sid ships 1.25.2-1 for riscv64; no upstream test gate on riscv64.
  - License: ISC. Governance: PgBouncer contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI.

- **Pgpool-II** -- orange (optional)
  - PostgreSQL connection pooling and load balancing; upstream repository has no CI of any kind; Debian sid ships pgpool2 4.7.2-1 for riscv64 (Installed); Ubuntu Noble ships 4.3.7-1ubuntu4.
  - License: BSD. Governance: pgpool Global Development Group.
  - Release provided by Debian, not upstream.
  - Gap: no upstream CI at all (any architecture); riscv64 solely dependent on downstream packaging quality.

- **pgcat** -- red (optional)
  - Rust-based PostgreSQL connection pooler and proxy; upstream CI builds OCI images for linux/amd64,linux/arm64 only; zero riscv64 references in repo; not packaged by Ubuntu Noble, Debian, or Arch Linux RISC-V.
  - License: MIT. Governance: postgresml contributors.
  - Release provided by: none.
  - Gap: no riscv64 path from any source; Rust tier-2 riscv64 would allow source build but no validated artifact.

#### Layer 4 -- Orchestration and observability

- **CloudNativePG** -- red (optional)
  - Kubernetes operator for PostgreSQL; goreleaser restricts operator binaries to amd64/arm64 only; all release workflows hard-code PLATFORMS: "linux/amd64,linux/arm64"; zero riscv64 references in repo; no downstream build of the operator container image.
  - License: Apache 2.0. Governance: CNCF / CloudNativePG contributors.
  - Release provided by: none.
  - Gap: PostgreSQL HA on Kubernetes path blocked at the operator tier for riscv64; the most widely adopted PostgreSQL Kubernetes operator has no riscv64 path.

- **Zalando postgres-operator** -- red (optional)
  - Alternative PostgreSQL Kubernetes operator; multi-arch publish limited to linux/amd64,linux/arm64; no riscv64 references; no downstream build.
  - License: MIT. Governance: Zalando.
  - Release provided by: none.

- **postgres_exporter** -- orange (optional)
  - PostgreSQL metrics exporter for Prometheus; upstream ships postgres_exporter-0.20.1.linux-riscv64.tar.gz; test jobs (test_go, integration_tests against multiple Postgres versions) run exclusively on ubuntu-latest amd64; binary shipped untested.
  - License: MIT. Governance: prometheus-community.
  - Gap: binary shipped untested; integration tests (which test SQL-level metric collection) never run on riscv64.

##### PostgreSQL pipeline chains

- Vector search path: Application -> libpq/psycopg -> PostgreSQL -> pgvector -> SIMD distance kernels (RVV target; scalar fallback today)
- HA on Kubernetes path: CloudNativePG operator -> PostgreSQL pod (container image) -> streaming replication -> etcd / k8s API

---

### MySQL

#### Layer 1 -- Client drivers and connectors

- **go-sql-driver/mysql** -- green (optional)
  - Pure-Go MySQL driver; no C extensions; rule-0 applies -- inherits riscv64 from the Go toolchain.
  - License: MPL 2.0. Governance: Go SQL Driver contributors.

- **MariaDB Connector/C** -- orange (optional) *(shared with MariaDB)*
  - Compiled C connector for MySQL/MariaDB wire protocol; upstream CI covers only ubuntu-latest, macOS, Windows with no riscv64.
  - License: LGPL 2.1. Governance: MariaDB Foundation.
  - Release provided by Ubuntu Noble (libmariadb3 10.11.7-2ubuntu2), not upstream.
  - Gap: no upstream riscv64 CI job or binary artifact.

#### Layer 2 -- Database engine

- **MySQL** -- orange (critical)
  - Oracle-backed relational engine; replaced mysql-8.0 with mysql-9.7 in Debian sid (9.7.2-1, built on rv-manda-01); upstream CI (pr-build.yml, mtr.yml) runs exclusively on ubuntu-latest x86_64 with zero riscv64 coverage; Abseil CRC32C riscv64 acceleration PR #639 closed unmerged 2026-01-18.
  - License: GPL 2. Governance: Oracle.
  - Release provided by Debian (mysql-9.7 9.7.2-1), not upstream (no upstream binary releases).
  - Gap: no upstream riscv64 CI; CRC32C Zbc hardware path rejected; InnoDB buffer pool checksum runs scalar fallback; MySQL Test Run suite never executed on riscv64.

#### Layer 3 -- Feature extensions, clustering and proxies

- **RocksDB** -- orange (optional) *(shared with MariaDB)*
  - LSM-tree embedded key-value store; underlying storage engine for MyRocks and used by many proxies; upstream CI covers x86_64 and aarch64 only; Debian sid ships 9.11.2-1 for riscv64; latest upstream release v11.8.1 has no binary assets.
  - License: Apache 2.0. Governance: Meta / RocksDB contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; compression library paths (LZ4/zstd/snappy) lack RVV acceleration.

- **MyRocks** -- orange (optional) *(shared with MariaDB)*
  - RocksDB storage engine for MySQL/MariaDB; consumable as mariadb-plugin-rocksdb in Debian sid (1:11.8.8-1); upstream facebook/mysql-5.6 has no riscv64 CI; Debian maintainers patch around build failures (MDEV-29875, open/critical).
  - License: GPL 2. Governance: Meta / MariaDB.
  - Release provided by Debian, not upstream.
  - Gap: build failure on riscv64 requires active Debian patching; MDEV-29875 unresolved upstream; no upstream test gate.

- **Vitess** -- red (optional)
  - MySQL sharding and query routing platform; all CI and release workflows target x86_64 and arm64 only; zero riscv64 references in repo; no upstream or downstream riscv64 artifact. Note: pure Go source would cross-compile, but source-only does not satisfy the orange threshold.
  - License: Apache 2.0. Governance: CNCF / PlanetScale.
  - Release provided by: none.
  - Gap: no riscv64 CI, no release, no downstream packaging; distributed MySQL (sharding) path blocked at the proxy tier.

- **Galera Cluster** -- orange (optional) *(shared with MariaDB)*
  - Synchronous multi-primary replication plugin for MySQL/MariaDB; upstream CI targets Ubuntu Bionic x86 only; Debian sid ships galera-4 26.4.27-1 for riscv64; Ubuntu Noble also lists riscv64.
  - License: GPL 2. Governance: Codership / MariaDB.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; replication correctness unverified by upstream on this architecture.

- **ProxySQL** -- red (optional) *(shared with MariaDB)*
  - High-performance MySQL proxy; all workflow files target amd64 and arm64 only; 240+ workflow files with zero riscv64 references beyond bundled autotools config scripts; releases v3.0.9-v4.0.10 carry no riscv64 assets; not packaged downstream.
  - License: GPL 3. Governance: ProxySQL contributors.
  - Release provided by: none.
  - Gap: no riscv64 CI, release, or downstream packaging.

#### Layer 4 -- Orchestration and observability

- **Percona Operator for MySQL** -- red (optional)
  - MySQL Kubernetes operator from Percona; CI and Docker images for linux/amd64 and linux/arm64 only; zero riscv64 references; no downstream artifact.
  - License: Apache 2.0. Governance: Percona.
  - Release provided by: none.

- **MySQL Operator for Kubernetes** -- red (optional)
  - Oracle's official MySQL Kubernetes operator; build.sh hard-validates architecture against ^(amd64|arm64)$ and exits non-zero for any other value; manifest.sh assembles two-arch manifest only; zero riscv64 references; no downstream artifact.
  - License: GPL 2. Governance: Oracle.
  - Release provided by: none.

- **mysqld_exporter** -- orange (optional) *(shared with MariaDB)*
  - MySQL metrics exporter for Prometheus; upstream ships linux-riscv64 tarball in v0.19.0; test_go runs only on ubuntu-latest amd64; binary shipped untested.
  - License: Apache 2.0. Governance: prometheus / community.
  - Gap: binary shipped untested.

##### MySQL pipeline chains

- LSM storage path: MySQL -> MyRocks -> RocksDB -> LZ4 / zstd / snappy compression -> glibc
- Distributed (sharding) path: Application -> Vitess vtgate -> Vitess vttablet -> MySQL shard -> InnoDB

---

### MariaDB

#### Layer 1 -- Client drivers and connectors

- **MariaDB Connector/C** -- orange (optional)
  - Compiled C connector for MySQL/MariaDB wire protocol; upstream CI covers only ubuntu-latest, macOS, Windows with no riscv64.
  - License: LGPL 2.1. Governance: MariaDB Foundation.
  - Release provided by Ubuntu Noble (libmariadb3 10.11.7-2ubuntu2), not upstream.
  - Gap: no upstream riscv64 CI job or binary artifact.

- **go-sql-driver/mysql** -- green (optional) *(shared with MySQL)*
  - Pure-Go MySQL/MariaDB driver; no C extensions; rule-0 applies -- inherits riscv64 from the Go toolchain.
  - License: MPL 2.0. Governance: Go SQL Driver contributors.

#### Layer 2 -- Database engine

- **MariaDB** -- orange (critical)
  - MySQL-compatible community fork; all upstream CI (GitLab CI, GitHub Actions) targets x86_64 only; Debian sid builds 11.8.8-1 on rv-osuosl-03; MDEV-29875 (MyRocks build failure on riscv64) open/critical.
  - License: GPL 2. Governance: MariaDB Foundation.
  - Release provided by Debian (1:11.8.8-1), not upstream.
  - Gap: no upstream riscv64 CI gate; MyRocks storage plugin has known build failure tracked as critical upstream bug; no Zbb/Zbc/RVV acceleration in any storage path.

#### Layer 3 -- Feature extensions, clustering and proxies

- **RocksDB** -- orange (optional) *(shared with MySQL)*
  - LSM-tree embedded key-value store; underlying storage engine for MyRocks; upstream CI covers x86_64 and aarch64 only; Debian sid ships 9.11.2-1 for riscv64; latest upstream release v11.8.1 has no binary assets.
  - License: Apache 2.0. Governance: Meta / RocksDB contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; compression library paths lack RVV acceleration.

- **MyRocks** -- orange (optional) *(shared with MySQL)*
  - RocksDB storage engine for MySQL/MariaDB; consumable as mariadb-plugin-rocksdb in Debian sid (1:11.8.8-1); upstream facebook/mysql-5.6 has no riscv64 CI; Debian maintainers patch around build failures (MDEV-29875, open/critical).
  - License: GPL 2. Governance: Meta / MariaDB.
  - Release provided by Debian, not upstream.
  - Gap: build failure on riscv64 requires active Debian patching; MDEV-29875 unresolved upstream; no upstream test gate.

- **MariaDB ColumnStore** -- red (optional)
  - Columnar storage engine for MariaDB (OLAP workloads); Drone CI exists but is amd64-only (`local archs = ["amd64"]`); SUPPORTED_ARCHITECTURES in cmapi constants.py explicitly excludes riscv64; no downstream distro ships this for riscv64.
  - License: GPL 2. Governance: MariaDB Corporation.
  - Release provided by: none.
  - Gap: riscv64 explicitly excluded from supported architectures; no OLAP columnar path available on RISC-V.

- **Galera Cluster** -- orange (optional) *(shared with MySQL)*
  - Synchronous multi-primary replication plugin for MySQL/MariaDB; upstream CI targets Ubuntu Bionic x86 only; Debian sid ships galera-4 26.4.27-1 for riscv64; Ubuntu Noble also lists riscv64.
  - License: GPL 2. Governance: Codership / MariaDB.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; replication correctness unverified by upstream on this architecture.

- **ProxySQL** -- red (optional) *(shared with MySQL)*
  - High-performance MySQL/MariaDB proxy; all workflow files target amd64 and arm64 only; 240+ workflow files with zero riscv64 references beyond bundled autotools config scripts; not packaged downstream.
  - License: GPL 3. Governance: ProxySQL contributors.
  - Release provided by: none.
  - Gap: no riscv64 CI, release, or downstream packaging.

- **MaxScale** -- red (optional)
  - MariaDB database proxy with advanced routing; no GitHub Actions CI (only dependabot.yml); not in Ubuntu Noble, Debian, or Fedora; MariaDB's own release channel covers only x86_64 and ARM64; two riscv64 hits in repo are bundled SQLite autoconf scripts.
  - License: BSL 1.1. Governance: MariaDB Corporation.
  - Release provided by: none.
  - Gap: no riscv64 path from any source; proprietary release channel excludes riscv64.

#### Layer 4 -- Orchestration and observability

- **mariadb-operator** -- red (optional)
  - MariaDB Kubernetes operator; release workflow produces Docker images and binaries for amd64/arm64 only; zero riscv64 references in repo; no downstream artifact.
  - License: Apache 2.0. Governance: mariadb-operator contributors.
  - Release provided by: none.

- **mysqld_exporter** -- orange (optional) *(shared with MySQL)*
  - MySQL/MariaDB metrics exporter for Prometheus; upstream ships linux-riscv64 tarball in v0.19.0; test_go runs only on ubuntu-latest amd64; binary shipped untested.
  - License: Apache 2.0. Governance: prometheus / community.
  - Gap: binary shipped untested.

##### MariaDB pipeline chains

- LSM storage path: MariaDB -> MyRocks -> RocksDB -> LZ4 / zstd / snappy compression -> glibc

---

### Redis

#### Layer 1 -- Client drivers and connectors

- **hiredis** -- orange (critical)
  - Minimalist C client library for Redis; compiled artifact used by Redis itself, most Redis-protocol clients, and numerous database proxies.
  - License: BSD 3-Clause. Governance: Redis Ltd / community.
  - Release provided by Debian (1.2.0-6+b4) and Ubuntu Noble (1.2.0-6ubuntu3), not upstream.
  - Gap: upstream CI has no riscv64 job of any kind (neither build nor QEMU test); no upstream riscv64 binary published.

#### Layer 2 -- Database engine and alternatives

- **Redis** -- orange (critical)
  - In-memory data structure server; builds and runs on riscv64 via Debian/Ubuntu but upstream CI (ci.yml) has zero riscv64 jobs; two open RISC-V optimization PRs (#15204 Zbb popcount, #15273 HLL RVV) unmerged and unreviewed since May 2026.
  - License: RSALv2 / SSPLv1 (Redis 7.4+). Governance: Redis Ltd.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; RVV HyperLogLog and Zbb bit-count optimizations unreviewed; jemalloc allocator path has no upstream riscv64 test gate (orange).

- **Valkey** -- orange (optional)
  - Linux Foundation Redis fork; upstream CI (ci.yml, daily.yml) has zero riscv64 jobs; upstream releases publish no binary assets; Debian sid ships 8.1.4+dfsg1-2.
  - License: BSD 3-Clause. Governance: Linux Foundation / Valkey contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI or binary; functionally equivalent to Redis riscv64 gaps.

- **KeyDB** -- red (optional)
  - Multi-threaded Redis fork by Snapchat; upstream CI targets ubuntu-latest x86_64 only; last release v6.3.4 (October 2023) with no riscv64 artifacts; not packaged by any major Linux distribution for riscv64; no consumable riscv64 artifact from any source.
  - License: BSD 3-Clause. Governance: Snapchat.
  - Release provided by: none.
  - Gap: no riscv64 CI, no release, no downstream packaging; effectively unmaintained on this architecture.

- **Dragonfly** -- red (optional) *(shared with Memcached)*
  - High-performance Redis/Memcached compatible server; all CI and release workflows target amd64 and aarch64 only; zero riscv64 references in codebase; latest v1.40.1 (2026-08-06) has no riscv64 artifact from any provider.
  - License: BSL 1.1. Governance: DragonflyDB.
  - Release provided by: none.
  - Gap: actively developed but riscv64 not in roadmap; no downstream packaging.

#### Layer 3 -- Feature extensions and modules

- **RediSearch** -- red (optional)
  - Full-text search module for Redis; CI matrix hard-codes x86_64 and aarch64 only; no riscv64 references in codebase; not packaged downstream for riscv64.
  - License: RSALv2 / SSPLv1. Governance: Redis Ltd.
  - Release provided by: none.
  - Gap: no riscv64 path; full-text indexing workload requires source build with no upstream validation.

- **RedisJSON** -- red (optional)
  - JSON data type module for Redis; CI accepts only x64 or arm64 arch inputs; [issue #830](https://github.com/RedisJSON/RedisJSON/issues/830) documents cross-compilation failures for riscv64gc-unknown-linux-gnu (open since 2022, unresolved); not packaged downstream.
  - License: RSALv2 / SSPLv1. Governance: Redis Ltd.
  - Release provided by: none.
  - Gap: known cross-compilation failure; open issue since 2022 with no traction.

- **RedisBloom** -- red (optional)
  - Probabilistic data structures module for Redis; CI covers only x64 and arm64; no riscv64 references; not packaged downstream. Note: Redis 8 inlines bloom filters, making the standalone module less relevant going forward.
  - License: RSALv2 / SSPLv1. Governance: Redis Ltd.
  - Release provided by: none.
  - Gap: no riscv64 path from any source; Redis 8 inline probabilistic structures may eventually supersede.

- **RedisTimeSeries** -- red (optional)
  - Time-series data module for Redis; CI targets x64 and arm64 only; deprecated upstream as Redis 8 integrates the functionality directly; no future riscv64 support expected from this project.
  - License: RSALv2 / SSPLv1. Governance: Redis Ltd.
  - Release provided by: none.
  - Gap: deprecated module; Redis 8 integration path still carries no riscv64 test gate.

#### Layer 4 -- Orchestration and observability

- **Redis Operator (OT-CONTAINER-KIT)** -- red (optional)
  - Redis Kubernetes operator; publish-image workflow targets linux/amd64,linux/arm64 only; CI builds Go binaries for ["amd64","arm64"] only; zero riscv64 references; no downstream artifact.
  - License: Apache 2.0. Governance: OT-CONTAINER-KIT contributors.
  - Release provided by: none.

- **redis_exporter** -- orange (optional)
  - Redis metrics exporter for Prometheus; upstream Makefile explicitly omits riscv64 from all gox targets and Docker platforms; Ubuntu Noble ships prometheus-redis-exporter 1.54.0-1ubuntu0.24.04.3 for riscv64.
  - License: MIT. Governance: oliver006 / community.
  - Release provided by Ubuntu, not upstream.
  - Gap: upstream explicitly excludes riscv64 from build targets; consumable only via downstream distro.

##### Redis pipeline chains

- KV cache on Kubernetes path: Redis Operator -> Redis / Valkey pod (container image) -> jemalloc -> glibc

---

### Memcached

#### Layer 1 -- Client drivers and connectors

No dedicated client-driver node is in scope for Memcached (hiredis is Redis-only; Memcached
clients are typically thin libevent-based wrappers not separately tracked in this stack).

#### Layer 2 -- Database engine and alternatives

- **Memcached** -- orange (critical)
  - High-performance distributed memory cache; upstream CI covers ubuntu-latest x86_64 only; upstream ships no binary artifacts; PR #1291 (alignment fix for strict-alignment platforms including RISC-V) shows merged=false despite "merged/fixed for next" label as of 2026-07-03.
  - License: BSD 3-Clause. Governance: Memcached contributors.
  - Release provided by Debian (1.6.45-1), not upstream.
  - Gap: no upstream riscv64 CI; alignment fix for RISC-V not yet landed in master; no SIMD path in extstore or CRC path.

- **Dragonfly** -- red (optional) *(shared with Redis)*
  - High-performance Redis/Memcached compatible server; all CI and release workflows target amd64 and aarch64 only; zero riscv64 references in codebase; latest v1.40.1 (2026-08-06) has no riscv64 artifact from any provider.
  - License: BSL 1.1. Governance: DragonflyDB.
  - Release provided by: none.
  - Gap: actively developed but riscv64 not in roadmap; no downstream packaging.

#### Layer 3 -- Feature extensions and proxies

- **mcrouter** -- red (optional)
  - Memcached routing proxy from Meta; upstream CI builds only on ubuntu-24.04 x86_64 with no test step; last formal release v0.41.0 (2019); zero riscv64 references in source; not in Ubuntu Noble, Arch Linux RISC-V, or Debian.
  - License: MIT. Governance: Meta.
  - Release provided by: none.
  - Gap: no riscv64 CI, stale releases, no downstream packaging; Memcached routing has no viable riscv64 proxy tier.

#### Layer 4 -- Orchestration and observability

No dedicated Kubernetes operator is in scope for Memcached (typically deployed as a plain
StatefulSet/Deployment rather than via a custom operator).

- **memcached_exporter** -- orange (optional)
  - Memcached metrics exporter for Prometheus; upstream ships memcached_exporter-0.16.0.linux-riscv64.tar.gz; CI test_go runs only on ubuntu-latest; binary shipped untested.
  - License: Apache 2.0. Governance: prometheus / community.
  - Gap: binary shipped untested.

---

### Shared substrate (Layer 4, applies to every engine above)

This deployment and observability infrastructure is not owned by any single database engine --
it sits underneath all five verticals identically.

- **Kubernetes** -- orange (optional)
  - Container orchestration platform; upstream supported platform list (hack/lib/golang.sh) does not include riscv64; zero riscv64 references in kubernetes/kubernetes; official v1.36.3 release carries no riscv64 artifacts; third-party builds available from CARV-ICS-FORTH and alitariq4589; two new PRs (#141291, kubernetes/release#4489) opened 2026-08-10 for riscv64 pause image and kube-cross held with do-not-merge/hold pending the Tier 3 KEP process.
  - License: Apache 2.0. Governance: CNCF / Kubernetes SIG.
  - Release provided by third-party (CARV-ICS-FORTH, alitariq4589), not upstream.
  - Gap: riscv64 not an official Kubernetes platform; Tier 3 KEP process in earliest stages; production deployments depend on community forks with no SLA.

- **containerd** -- orange (optional)
  - Container runtime; upstream ships official riscv64 tarballs in every release (v2.3.4 confirmed); CI integration tests cover only ubuntu-22.04, ubuntu-24.04, and ubuntu-24.04-arm; nightly cross-compiles riscv64 but has no test step; PR #13124 to add riscv64 to test matrix open with active blockers (dirty/needs-rebase).
  - License: Apache 2.0. Governance: CNCF / containerd maintainers.
  - Gap: binary shipped untested; test gate PR blocked; riscv64 OCI image operations unvalidated by upstream.

- **runc** -- orange (optional)
  - OCI container runtime; upstream ships signed runc.riscv64 binary in every release (v1.5.1 confirmed); CI tests only ubuntu-24.04 and ubuntu-24.04-arm; no riscv64 test job of any kind; cross-compiled binary shipped without upstream test gate.
  - License: Apache 2.0. Governance: OCI / opencontainers maintainers.
  - Gap: binary shipped untested; runc namespace and cgroup operations unvalidated on riscv64.

- **etcd** -- orange (optional)
  - Distributed key-value store; critical dependency for Kubernetes and CloudNativePG; upstream explicitly checks supported architectures at startup and requires ETCD_UNSUPPORTED_ARCH=riscv64 override; issue #21509 closed by bot without adding support (June 2026, citing missing Prow RISC-V nodes); Debian sid ships 3.5.30-2 for riscv64.
  - License: Apache 2.0. Governance: CNCF / etcd maintainers.
  - Release provided by Debian (3.5.30-2, behind upstream 3.7.1), not upstream.
  - Gap: riscv64 treated as unsupported arch requiring runtime override; Kubernetes control plane dependency with no upstream test gate; Debian lags upstream by two major point releases.

- **Helm** -- orange (optional)
  - Kubernetes package manager; upstream ships linux/riscv64 tarballs for v3.21.3 and v4.2.3; CI has a single ubuntu-latest job with no riscv64 matrix; riscv64 binary cross-compiled and released without any upstream test gate.
  - License: Apache 2.0. Governance: CNCF / Helm maintainers.
  - Gap: binary shipped untested; Helm chart rendering and release workflows untested on riscv64.

- **k3s** -- red (optional)
  - Lightweight Kubernetes distribution; latest v1.36.3+k3s1 (2026-08-04) has no riscv64 binary; release workflow does not invoke the Makefile multiarch target for riscv64; PR #7778 (RISC-V support) closed without merging 2026-08-10; no downstream riscv64 artifact from any provider.
  - License: Apache 2.0. Governance: Rancher / SUSE.
  - Release provided by: none.
  - Gap: riscv64 PR explicitly rejected; k3s is a common edge/IoT Kubernetes distribution where riscv64 demand is highest.

- **k0s** -- blue (optional)
  - Kubernetes distribution from Mirantis; upstream CI workflow (riscv64.yml) runs nightly on native RISE ubuntu-24.04-riscv runners executing unit tests and smoke tests (basic + airgap); latest release v1.36.3+k0s.2 (2026-08-12) ships binaries for amd64, arm, and arm64 only - no riscv64 release artifact.
  - License: Apache 2.0. Governance: k0s contributors / Mirantis.
  - Release provided by: none (upstream tests pass on RISE native runners, but no riscv64 binary is published in any release).
  - Gap: upstream CI tests pass on RISC-V hardware but release pipeline does not yet produce a riscv64 artifact; nearest to green of all Kubernetes distributions.

- **Prometheus** -- orange (optional)
  - Metrics collection and alerting platform; upstream ships prometheus-3.13.2.linux-riscv64.tar.gz; CI build_all job cross-compiles riscv64 but all test jobs run exclusively on ubuntu-latest/windows-latest x86_64; binary shipped untested.
  - License: Apache 2.0. Governance: CNCF / Prometheus maintainers.
  - Gap: binary shipped untested on riscv64; time-series storage and query engine not CI-validated on this architecture.

- **node_exporter** -- orange (optional)
  - OS metrics exporter; upstream ships node_exporter-1.12.1.linux-riscv64.tar.gz; CI cross-compiles for riscv64 via promu crossbuild but neither test_go nor test_go_arm tests riscv64; binary shipped untested.
  - License: Apache 2.0. Governance: CNCF Prometheus / community.
  - Gap: binary shipped untested.

- **OpenTelemetry Collector** -- orange (optional)
  - Vendor-neutral telemetry pipeline; upstream ships riscv64 tarballs, .deb/.rpm packages, and Docker images in every release; cross-build-collector job for riscv64 runs make otelcorecol with no test step; unittest-matrix runs on ubuntu-latest only.
  - License: Apache 2.0. Governance: CNCF / OpenTelemetry.
  - Gap: binary shipped untested; OTel pipeline with Alloy (red) blocked at the visualization tier.

- **Grafana Alloy** -- red (optional)
  - Grafana's OTel-native telemetry agent; CI matrix is [amd64, arm64, ppc64le, s390x] only; PR #1526 (Build Alloy for linux/riscv64) closed without merging (2024-09-02); issue #1036 requesting riscv64 binaries closed as not_planned and locked; v1.18.1 (2026-08-06) has zero riscv64 artifacts from any source.
  - License: Apache 2.0. Governance: Grafana Labs.
  - Release provided by: none.
  - Gap: upstream declined riscv64 support explicitly; the OTel Collector -> Grafana Alloy pipeline path is blocked.

- **Grafana** -- red (optional)
  - Metrics visualization platform; release-build.yml cross-compiles riscv64 backend with allow-failure: true and "not an officially supported architecture" comment; internal artifact never promoted to public release; backend unit tests run exclusively on ubuntu-x64; issue #109717 (open since August 2025) confirms official riscv64 support not yet available; no public upstream release or downstream distro build.
  - License: AGPL 3 (OSS). Governance: Grafana Labs.
  - Release provided by: none.
  - Gap: riscv64 designated "not officially supported"; internal CI artifact not publicly consumable; database observability dashboards blocked at the visualization tier.

##### Shared substrate pipeline chains

- Observability path: Engine -> postgres_/mysqld_/redis_/memcached_exporter -> Prometheus -> Grafana -> (OpenTelemetry Collector / Grafana Alloy pipeline)

---

### Layer 5 -- Core shared libraries (compression, crypto, allocators, text, event, I/O)

- **OpenSSL** -- blue (critical)
  - TLS and crypto library; upstream CI (cross-compiles.yml, riscv-more-cross-compiles.yml) runs full test suite on riscv64 via QEMU on every push; PR #31080 (AES constant-time hardening for hardware lacking Zkn/Zvkned) open but not a test failure; existing tests pass.
  - License: Apache 2.0. Governance: OpenSSL Software Foundation.
  - Release provided by Debian/Ubuntu/Arch, not upstream (source-only releases).
  - Gap: PR #31080 open -- on hardware without Zvkned/Zkn, AES runs a non-constant-time scalar path (timing side-channel risk); this is a security gap against the RVA23U64 baseline that mandates Zvkned.

- **BoringSSL** -- orange (optional)
  - Google's TLS/crypto library used by some database clients and Chrome-ecosystem tools; upstream CI has two riscv64 builders (android_riscv64_compile_only, android_riscv64_prefixed_compile) that are standard commit-gate jobs but both have run_unit_tests:false and run_ssl_tests:false -- compile-only, no test execution.
  - License: OpenSSL License (permissive). Governance: Google.
  - Release provided by: none.
  - Gap: compile-only upstream CI; no riscv64 crypto correctness testing; no downstream distro package.

- **zlib** -- blue (critical)
  - General-purpose compression library; upstream CI (others.yml) runs ctest on riscv64 via QEMU OpenBSD VM on every push/PR; source-only releases; consumable via Debian.
  - License: zlib License. Governance: Mark Adler / community.
  - Release provided by Debian, not upstream.
  - Gap: RVV Adler32 optimization PR #1099 open (performance only, no correctness issue).

- **zlib-ng** -- blue (optional)
  - zlib replacement with modern optimizations; upstream CI runs full ctest on riscv64 via QEMU for GCC and Clang matrix entries on every push and PR; coverage collection confirms test execution; Alpine Linux edge ships 2.3.3-r0.
  - License: zlib License. Governance: zlib-ng contributors.
  - Release provided by Alpine, not upstream.
  - Gap: no RVV vectorized inflate/deflate path yet (performance gap; correctness is fine).

- **LZ4** -- blue (critical)
  - Fast lossless compression; upstream CI (cross-platform.yml) runs make platformTest on riscv64 via qemu-riscv64-static on every push and PR; PR #1739 (LZ4_FAST_DEC_LOOP for RV64) open/unmerged -- performance gap only.
  - License: BSD 2-Clause. Governance: Yann Collet / Meta.
  - Release provided by Debian (liblz4-1), not upstream.
  - Gap: LZ4_FAST_DEC_LOOP RVV fast-path unmerged; decompression runs portable scalar path on riscv64, slower than x86/ARM.

- **zstd** -- blue (critical)
  - Lossless compression with high ratio; upstream CI (dev-short-tests.yml qemu-consistency job) runs make clean check under QEMU at vlen=128/256/512 on riscv64; PR #4622 (HUF 4-way decode enable) open/unmerged -- performance gap only.
  - License: BSD/GPL dual. Governance: Meta.
  - Release provided by Debian/Ubuntu, not upstream.
  - Gap: Huffman decode fast path not enabled for riscv64; compression/decompression throughput below x86/ARM potential. Critical for RocksDB and MySQL/MariaDB innodb page compression paths.

- **snappy** -- blue (optional)
  - Fast compression library used by RocksDB; upstream CI (riscv64-qemu-test.yaml) cross-compiles and runs make test under qemu-user with QEMU_LD_PREFIX on every push; source-only releases.
  - License: BSD 3-Clause. Governance: Google.
  - Release provided by Debian (libsnappy1v5), not upstream.
  - Gap: none identified beyond general scalar performance.

- **jemalloc** -- orange (critical)
  - General-purpose memory allocator used by Redis, MariaDB, and numerous database engines; upstream CI covers ubuntu-24.04 x86_64 and arm64 only -- no riscv64 job; Debian ships libjemalloc2 5.3.1-2 for riscv64 (Installed); riscv64 architecture supported in source (LG_QUANTUM 4 for __riscv) but untested upstream.
  - License: BSD 2-Clause. Governance: jemalloc contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; allocator performance and correctness unvalidated by upstream; Redis's default allocator has no upstream riscv64 test gate.

- **tcmalloc** -- red (optional)
  - Google's thread-caching allocator; upstream CI covers only ubuntu-24.04 x86_64; no riscv64 job; segv_handler.cc explicitly marks __riscv as not yet supported; per-CPU RSEQ slab assembly absent; Ubuntu Noble's libtcmalloc package comes from gperftools (a separate codebase), not google/tcmalloc.
  - License: Apache 2.0. Governance: Google.
  - Release provided by: none.
  - Gap: RSEQ/per-CPU fast path explicitly not implemented for riscv64; only slow-path fallback would operate; no consumable artifact from this codebase.

- **PCRE2** -- blue (critical)
  - Regular expression library used by PostgreSQL and MariaDB; upstream CI (dev.yml ptarmigan job) runs full ctest with JIT on riscv64 via uraimo/run-on-arch-action (QEMU) on every push; source-only releases.
  - License: BSD 3-Clause. Governance: PCRE2 Project.
  - Release provided by Debian, not upstream.
  - Gap: none identified.

- **ICU** -- orange (critical)
  - Unicode and locale library required by PostgreSQL and MariaDB; upstream CI covers only ubuntu-24.04, macOS, and Windows -- no riscv64; upstream releases are Windows MSVC binaries and source tarballs only; Debian sid ships libicu78 78.3-2 for riscv64.
  - License: Unicode License (permissive). Governance: Unicode Consortium / IBM.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; Unicode collation and text processing paths untested by upstream on riscv64.

- **libevent** -- orange (critical)
  - Event notification library used by Memcached; upstream CI (build.yml) covers Linux x86_64, Windows, macOS, FreeBSD, OpenBSD, Android -- zero riscv64 coverage; Debian and Ubuntu Noble ship riscv64 packages; two new upstream releases (2.1.13-stable, 2.2.2-alpha, 2026-07-01) are source-only.
  - License: BSD 3-Clause. Governance: libevent contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; Memcached's event loop layer untested on riscv64 by upstream.

- **liburing** -- orange (optional)
  - Linux io_uring interface library; upstream CI includes riscv64 matrix entry but cross-compiles only, runs make install and compiles a trivial test_build.c -- the actual test suite in test/ is never executed; source-only releases; Debian sid ships 2.14-1.
  - License: MIT / LGPL 2.1. Governance: Jens Axboe / community.
  - Release provided by Debian, not upstream.
  - Gap: io_uring test suite never run on riscv64; async I/O path unvalidated by upstream.

- **libnuma** -- orange (optional)
  - NUMA topology library; upstream CI covers ubuntu-latest x86_64 only; upstream ships source tarball only; Debian sid ships libnuma1 2.0.19-1+b2 (Installed on native RISC-V hardware).
  - License: LGPL 2.1. Governance: numactl contributors.
  - Release provided by Debian, not upstream.
  - Gap: no upstream riscv64 CI; NUMA-aware memory allocation for large database buffer pools untested upstream.

- **Protocol Buffers** -- orange (optional)
  - Serialization library used by various database tools and exporters; upstream CI covers x86_64, aarch64, i386, and 32-bit Linux only; maintainer comment (2025-08-27): "RISC-V isn't on our roadmap... we wouldn't be testing RISC-V or guaranteeing that it stays unbroken"; PR #23206 closed without merge; Debian ships libprotobuf-dev for riscv64.
  - License: BSD 3-Clause. Governance: Google.
  - Release provided by Debian, not upstream.
  - Gap: explicitly not on Google's roadmap; breakage on riscv64 may go undetected.

- **Lua** -- orange (optional)
  - Scripting language used by Redis (scripting) and various database extensions; upstream repository has no CI of any kind; latest release v5.5.1 (2026-08-05) has empty assets array; Debian sid ships lua5.4 5.4.8-2 for riscv64 (Installed).
  - License: MIT. Governance: PUC-Rio / Lua team.
  - Release provided by Debian, not upstream.
  - Gap: no upstream CI of any kind; Redis Lua scripting path has no upstream riscv64 validation at any layer.

- **xxHash** -- blue (optional)
  - Extremely fast non-cryptographic hash function used by RocksDB and compression libraries; upstream CI (qemu-consistency job in ci.yml) runs make check via qemu-riscv64-static for scalar and three RVV vector paths (vlen=128/256/512); XXH3_accumulate_512_rvv implemented in xxhash.h; source-only releases; Debian/Ubuntu ship libxxhash-dev.
  - License: BSD 2-Clause. Governance: Yann Collet.
  - Release provided by Debian, not upstream.
  - Gap: none -- RVV path is implemented and CI-tested.

- **glibc** -- orange (critical)
  - GNU C Library; upstream sourceware Buildbot builder glibc-fedora-riscv (builderid 336) ran full make check on riscv64 hardware, but all five sampled builds (207-211, last run 2025-06-10) fail with results=2 and the builder has been detached from all Buildbot masters (masterids: []) since then -- no upstream riscv64 CI gate is actively enforced; Debian sid ships glibc 2.43-3 built successfully on riscv64 (rv-osuosl-02, Installed); upstream latest is glibc-2.44 (2026-07-24).
  - License: LGPL 2.1. Governance: GNU / Free Software Foundation.
  - Release provided by: none (upstream ships source tarballs; distros provide binaries).
  - Gap: upstream riscv64 CI detached and failing; Debian lags upstream by one release (2.43 vs. 2.44); system-level test failures in upstream CI unresolved; libmvec (vectorized math) entirely absent on riscv64.

- **libmvec** -- red (optional)
  - Vectorized math library (glibc component); sysdeps/riscv/configure.ac sets no build_mathvec=yes; no mathvec subdirectory under sysdeps/riscv/; libmvec.so not present in any Debian riscv64 libc6 package; no downstream distro ships riscv64 libmvec.
  - License: LGPL 2.1. Governance: GNU / Free Software Foundation.
  - Release provided by: none.
  - Gap: vectorized math library does not exist for riscv64; database analytics functions that use libmvec on x86/ARM must fall back to scalar math on riscv64.

#### Pipeline chains and alternate paths

- Compression path (vectorization gap): Engine / RocksDB -> zstd / LZ4 / zlib -> RVV vectorized decode (NOT enabled today -> scalar)
- TLS / encrypted connection path: Engine -> OpenSSL -> AES-GCM (Zvkned / Zkn hardware; non-constant-time scalar fallback without them)

---

## Artifact 2: Status table

### (a) Full table

| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
|------|-------|-------------|-------|-----------------|---------------|----------------|-------|-----------------|
| libpq | Client drivers and connectors | critical | blue | Debian | 3 active upstream riscv64 build farm workers; full regression suite (Check + recovery/aio/misc) passes on recent commits | [buildfarm history](https://buildfarm.postgresql.org/cgi-bin/show_history.pl?nm=copperhead&br=HEAD) | 2026-08-13 | 4 workers -> 3 (mollusk no longer listed on members page but confirmed active via show_status); no color change |
| hiredis | Client drivers and connectors | critical | orange | Debian | Upstream CI (test.yml, build.yml) has no riscv64 job of any kind; Debian 1.2.0-6+b4 and Ubuntu Noble 1.2.0-6ubuntu3 provide the only riscv64 artifacts | [Debian buildd](https://buildd.debian.org/status/package.php?p=hiredis) | 2026-08-13 | none |
| psycopg | Client drivers and connectors | optional | green | upstream | Pure-Python core; psycopg-binary ships 10 upstream riscv64 wheels on PyPI 3.3.4 with full test suite via QEMU | [PyPI psycopg-binary](https://pypi.org/pypi/psycopg-binary/3.3.4/json) | 2026-08-13 | none |
| pgx | Client drivers and connectors | optional | green | upstream | Pure-Go; no cgo; rule-0 -- inherits riscv64 from Go toolchain | [pgx CI](https://github.com/jackc/pgx/blob/master/.github/workflows/ci.yml) | 2026-08-13 | n/a |
| pgjdbc | Client drivers and connectors | optional | green | upstream | Pure-Java noarch jar; upstream publishes platform-independent releases | [pgjdbc REL42.7.13](https://github.com/pgjdbc/pgjdbc/releases/tag/REL42.7.13) | 2026-08-13 | none |
| MariaDB Connector/C | Client drivers and connectors | optional | orange | Ubuntu | Upstream CI targets ubuntu-latest, macOS, Windows only -- no riscv64; Ubuntu Noble ships libmariadb3 for riscv64 | [packages.ubuntu.com](https://packages.ubuntu.com/noble/libmariadb3) | 2026-08-13 | n/a |
| go-sql-driver/mysql | Client drivers and connectors | optional | green | upstream | Pure-Go; rule-0 applies; upstream releases via Go module proxy to any GOARCH | [test.yml](https://github.com/go-sql-driver/mysql/blob/main/.github/workflows/test.yml) | 2026-08-13 | none |
| PostgreSQL | Database engines | critical | blue | Debian | 3-4 upstream riscv64 build farm workers; full regression suite passes; LLVM JIT disabled; CRC Zbc patches unmerged | [buildfarm members](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?arch=riscv64) | 2026-08-13 | Confirmed 3 workers on members page (mollusk confirmed via show_status); Debian 17.10-0+deb13u1 Installed |
| MySQL | Database engines | critical | orange | Debian | No upstream riscv64 CI (mtr.yml runs on ubuntu-latest x86_64 only); PR #639 (CRC32C riscv64) closed unmerged; Debian sid mysql-9.7 9.7.2-1 | [packages.debian.org](https://packages.debian.org/sid/mysql-server) | 2026-08-13 | mysql-8.0 replaced by mysql-9.7 in Debian sid; PR #639 confirmed closed unmerged; color unchanged |
| MariaDB | Database engines | critical | orange | Debian | All upstream CI is x86_64 only; Debian sid 1:11.8.8-1 built on rv-osuosl-03 | [.gitlab-ci.yml](https://github.com/MariaDB/server/blob/main/.gitlab-ci.yml) | 2026-08-13 | none |
| Redis | Database engines | critical | orange | Debian | Upstream ci.yml has zero riscv64 jobs; two RISC-V optimization PRs (#15204, #15273) unmerged/unreviewed since May 2026 | [ci.yml](https://github.com/redis/redis/blob/unstable/.github/workflows/ci.yml) | 2026-08-13 | none |
| Memcached | Database engines | critical | orange | Debian | Upstream CI covers ubuntu-latest x86_64 only; PR #1291 (alignment fix) shows merged=false despite "merged/fixed for next" label | [buildd memcached](https://buildd.debian.org/status/package.php?p=memcached&suite=sid) | 2026-08-13 | PR #1291 closure confirmed as not-merged; alignment fix staged but not in master |
| Valkey | Database engines | optional | orange | Debian | Upstream CI has zero riscv64 jobs; releases publish no binary assets; Debian sid 8.1.4+dfsg1-2 | [buildd valkey](https://buildd.debian.org/status/package.php?p=valkey) | 2026-08-13 | none |
| KeyDB | Database engines | optional | red | none | CI targets ubuntu-latest x86_64 only; last release v6.3.4 (Oct 2023); not packaged by any major distro for riscv64 | [ci.yml](https://github.com/Snapchat/KeyDB/blob/main/.github/workflows/ci.yml) | 2026-08-13 | none |
| Dragonfly | Database engines | optional | red | none | All CI targets amd64 and aarch64; zero riscv64 references in codebase; v1.40.1 has no riscv64 artifact | [release.yml](https://github.com/dragonflydb/dragonfly/blob/main/.github/workflows/release.yml) | 2026-08-13 | none |
| pgvector | Feature extensions | optional | orange | Ubuntu | Upstream CI covers x86-64, aarch64, macOS, Windows, i386 -- no riscv64; Ubuntu Noble ships 0.6.0-1 (vs upstream v0.8.6) | [build.yml](https://github.com/pgvector/pgvector/blob/main/.github/workflows/build.yml) | 2026-08-13 | Ubuntu ships 0.6.0-1, significantly behind upstream v0.8.6 |
| Citus | Feature extensions | optional | red | none | CI targets ubuntu-latest amd64 only; zero riscv64 references; not packaged downstream | [build_and_test.yml](https://github.com/citusdata/citus/blob/main/.github/workflows/build_and_test.yml) | 2026-08-13 | none |
| TimescaleDB | Feature extensions | optional | red | none | CI covers only x86 and ARM; Linux packages via private packagecloud.io for x86/ARM only | [apt-packages.yaml](https://github.com/timescale/timescaledb/blob/main/.github/workflows/apt-packages.yaml) | 2026-08-13 | n/a |
| PostGIS | Feature extensions | optional | orange | Debian | Upstream CI runs on ubuntu-latest amd64 only; Debian sid 3.4.2+dfsg-1ubuntu3 Installed on rv-osuosl-02 | [buildd postgis](https://buildd.debian.org/status/package.php?p=postgis&suite=sid) | 2026-08-13 | none |
| Apache AGE | Feature extensions | optional | red | none | CI runs installcheck on ubuntu-24.04 x86_64 only; no riscv64 references; no downstream packaging | [installcheck.yaml](https://github.com/apache/age/blob/master/.github/workflows/installcheck.yaml) | 2026-08-13 | none |
| RocksDB | Feature extensions | optional | orange | Debian | Upstream CI targets x86_64 and aarch64 only; Debian sid 9.11.2-1 Installed | [pr-jobs.yml](https://github.com/facebook/rocksdb/blob/main/.github/workflows/pr-jobs.yml) | 2026-08-13 | none |
| MyRocks | Feature extensions | optional | orange | Debian | Upstream CI is x86 only; Debian ships mariadb-plugin-rocksdb; MDEV-29875 (riscv64 build failure) open/critical | [azure-pipelines.yml](https://github.com/facebook/mysql-5.6/blob/c6e4b9f3f93dce206370105fe73ee337ece0c5e7/azure-pipelines.yml) | 2026-06-02 | none |
| MariaDB ColumnStore | Feature extensions | optional | red | none | Drone CI is amd64-only; SUPPORTED_ARCHITECTURES in cmapi constants.py explicitly excludes riscv64; no downstream packaging | [.drone.jsonnet](https://github.com/mariadb-corporation/mariadb-columnstore-engine/blob/79f0711858e34ecb188089baf109efab1f5fceed/.drone.jsonnet) | 2026-08-13 | CI exists but amd64-only; prior report incorrectly stated "no CI" |
| RediSearch | Feature extensions | optional | red | none | CI matrix hard-codes x86_64 and aarch64; zero riscv64 references; no downstream packaging | [generate-matrix.yml](https://github.com/RediSearch/RediSearch/blob/master/.github/workflows/generate-matrix.yml) | 2026-06-17 | none |
| RedisJSON | Feature extensions | optional | red | none | CI accepts only x64 or arm64; issue #830 documents riscv64gc cross-compile failures (open since 2022); no downstream packaging | [flow-linux.yml](https://github.com/RedisJSON/RedisJSON/blob/28f4bb10a377dcc3aae4155ddf76541fcc6eba1d/.github/workflows/flow-linux.yml) | 2026-08-13 | none |
| RedisBloom | Feature extensions | optional | red | none | CI covers only x64 and arm64; zero riscv64 references; no downstream packaging | [event-nightly.yml](https://github.com/RedisBloom/RedisBloom/blob/master/.github/workflows/event-nightly.yml) | 2026-08-13 | none |
| RedisTimeSeries | Feature extensions | optional | red | none | CI targets x64 and arm64 only; deprecated -- Redis 8 integrates functionality; no future riscv64 support expected | [event-nightly.yml](https://github.com/RedisTimeSeries/RedisTimeSeries/blob/main/.github/workflows/event-nightly.yml) | 2026-08-13 | none |
| Vitess | Clustering/proxies | optional | red | none | All CI targets x86-64 and arm64; zero riscv64 references; pure Go source not sufficient for orange | [unit_test.yml](https://github.com/vitessio/vitess/blob/main/.github/workflows/unit_test.yml) | 2026-08-13 | none |
| Galera Cluster | Clustering/proxies | optional | orange | Debian | Upstream CI targets Ubuntu Bionic x86 only; Debian sid galera-4 26.4.27-1 for riscv64 | [packages.debian.org](https://packages.debian.org/sid/galera-4) | 2026-08-13 | none |
| Patroni | Clustering/proxies | optional | green | upstream | Pure Python py3-none-any wheels; rule-0; v4.1.5 on PyPI (2026-08-12) | [PyPI patroni](https://pypi.org/pypi/patroni/json) | 2026-08-13 | none |
| PgBouncer | Clustering/proxies | optional | orange | Debian | Upstream CI covers x86-64, aarch64, macOS, Windows only; Debian sid 1.25.2-1 for riscv64 | [pgbouncer-ci.yml](https://github.com/pgbouncer/pgbouncer/blob/master/.github/workflows/pgbouncer-ci.yml) | 2026-08-13 | none |
| Pgpool-II | Clustering/proxies | optional | orange | Debian | Upstream has no CI of any kind; Debian sid pgpool2 4.7.2-1 Installed; Ubuntu Noble 4.3.7-1ubuntu4 | [buildd pgpool2](https://buildd.debian.org/status/package.php?p=pgpool2&suite=sid) | 2026-08-13 | none |
| pgcat | Clustering/proxies | optional | red | none | CI builds OCI for linux/amd64,linux/arm64 only; zero riscv64 references; not packaged downstream | [build-and-push.yaml](https://github.com/postgresml/pgcat/blob/main/.github/workflows/build-and-push.yaml) | 2026-08-13 | none |
| ProxySQL | Clustering/proxies | optional | red | none | All 240+ workflow files target amd64 and arm64; zero riscv64 references beyond bundled autotools; releases v3.0.9-v4.0.10 carry no riscv64 assets | [workflows dir](https://github.com/sysown/proxysql/tree/main/.github/workflows) | 2026-08-13 | none |
| MaxScale | Clustering/proxies | optional | red | none | No GitHub Actions CI; not in Ubuntu Noble, Debian, Fedora; MariaDB release channel covers x86-64 and ARM64 only | [GitHub repo](https://github.com/mariadb-corporation/MaxScale) | 2026-08-13 | none |
| mcrouter | Clustering/proxies | optional | red | none | CI builds on ubuntu-24.04 x86_64 with no test step; last release v0.41.0 (2019); zero riscv64 references; not packaged downstream | [build.yml](https://github.com/facebook/mcrouter/blob/main/.github/workflows/build.yml) | 2026-08-13 | none |
| Kubernetes | Orchestration/operators | optional | orange | third-party | Upstream does not include riscv64 in KUBE_SUPPORTED_*_PLATFORMS; two new PRs (#141291, kubernetes/release#4489) held with do-not-merge/hold pending Tier 3 KEP; third-party builds from CARV-ICS-FORTH and alitariq4589 | [golang.sh](https://github.com/kubernetes/kubernetes/blob/master/hack/lib/golang.sh) | 2026-08-13 | Two new PRs appeared since last report; both held; no merges |
| containerd | Orchestration/operators | optional | orange | upstream (untested) | Ships official riscv64 tarballs (v2.3.4); CI integration tests cover ubuntu-22.04, ubuntu-24.04, ubuntu-24.04-arm only; PR #13124 to add riscv64 tests open with active blockers | [ci.yml](https://github.com/containerd/containerd/blob/main/.github/workflows/ci.yml) | 2026-08-12 | Latest release confirmed v2.3.4 with riscv64 assets; PR #13124 still open dirty/needs-rebase |
| runc | Orchestration/operators | optional | orange | upstream (untested) | Ships signed runc.riscv64 binary; CI tests only ubuntu-24.04 and ubuntu-24.04-arm; cross-compiled and shipped without upstream test gate | [v1.5.1 release](https://github.com/opencontainers/runc/releases/tag/v1.5.1) | 2026-07-14 | none |
| etcd | Orchestration/operators | optional | orange | Debian | Upstream startup code exits on riscv64 unless ETCD_UNSUPPORTED_ARCH=riscv64 override set; issue #21509 closed by bot without adding support; Debian sid 3.5.30-2 | [etcd.go](https://github.com/etcd-io/etcd/blob/main/server/etcdmain/etcd.go) | 2026-08-13 | Issue #21509 closed by bot (not resolved); Debian at 3.5.30-2 vs upstream 3.7.1 |
| Helm | Orchestration/operators | optional | orange | upstream (untested) | Ships linux/riscv64 tarballs for v3.21.3 and v4.2.3; CI has a single ubuntu-latest job with no riscv64 matrix | [build-test.yml](https://github.com/helm/helm/blob/main/.github/workflows/build-test.yml) | 2026-08-13 | n/a |
| k3s | Orchestration/operators | optional | red | none | Latest v1.36.3+k3s1 has no riscv64 binary; release workflow does not invoke multiarch target for riscv64; PR #7778 closed without merging 2026-08-10 | [v1.36.3+k3s1 release](https://github.com/k3s-io/k3s/releases/tag/v1.36.3%2Bk3s1) | 2026-08-13 | PR #7778 confirmed closed 2026-08-10 |
| k0s | Orchestration/operators | optional | blue | none | Upstream CI (riscv64.yml) runs unit tests and smoke tests on native RISE ubuntu-24.04-riscv runners nightly; latest release v1.36.3+k0s.2 ships no riscv64 binary | [riscv64.yml](https://github.com/k0sproject/k0s/blob/main/.github/workflows/riscv64.yml) | 2026-08-12 | none |
| CloudNativePG | Orchestration/operators | optional | red | none | goreleaser and all release workflows restrict to amd64/arm64 only; zero riscv64 references in repo; no downstream build | [.goreleaser.yml](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/.goreleaser.yml) | 2026-08-13 | none |
| Zalando postgres-operator | Orchestration/operators | optional | red | none | Multi-arch publish limited to linux/amd64,linux/arm64; no riscv64 references; no downstream build | [publish_ghcr_image.yaml](https://github.com/zalando/postgres-operator/blob/master/.github/workflows/publish_ghcr_image.yaml) | 2026-08-13 | none |
| Percona Operator for MySQL | Orchestration/operators | optional | red | none | CI and Docker images for linux/amd64 and linux/arm64 only; zero riscv64 references; no downstream artifact | [scan.yml](https://github.com/percona/percona-server-mysql-operator/blob/main/.github/workflows/scan.yml) | 2026-08-13 | none |
| MySQL Operator for Kubernetes | Orchestration/operators | optional | red | none | build.sh hard-validates against ^(amd64\|arm64)$; manifest.sh assembles two-arch manifest only; zero riscv64 references | [build.sh](https://github.com/mysql/mysql-operator/blob/fd5c6bcf4bc3778dc4cb324c69053cac58e632ac/build.sh) | 2026-08-13 | none |
| mariadb-operator | Orchestration/operators | optional | red | none | Release workflow for linux/amd64,linux/arm64 only; goreleaser config excludes riscv64; zero riscv64 references | [release.yml](https://github.com/mariadb-operator/mariadb-operator/blob/main/.github/workflows/release.yml) | 2026-08-13 | none |
| Redis Operator (OT-CONTAINER-KIT) | Orchestration/operators | optional | red | none | Publish-image workflow targets linux/amd64,linux/arm64 only; CI Go binaries for [amd64,arm64] only; zero riscv64 references | [publish-image.yaml](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/publish-image.yaml) | 2026-08-13 | none |
| Prometheus | Observability | optional | orange | upstream (untested) | Ships prometheus-3.13.2.linux-riscv64.tar.gz; test jobs run exclusively on ubuntu-latest/windows-latest x86_64 | [ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml) | 2026-07-30 | none |
| node_exporter | Observability | optional | orange | upstream (untested) | Ships node_exporter-1.12.1.linux-riscv64.tar.gz; CI cross-compiles but neither test job tests riscv64 | [v1.12.1 release](https://github.com/prometheus/node_exporter/releases/tag/v1.12.1) | 2026-07-14 | none |
| postgres_exporter | Observability | optional | orange | upstream (untested) | Ships postgres_exporter-0.20.1.linux-riscv64.tar.gz; all test jobs on ubuntu-latest amd64 | [v0.20.1 release](https://github.com/prometheus-community/postgres_exporter/releases/tag/v0.20.1) | 2026-08-13 | none |
| mysqld_exporter | Observability | optional | orange | upstream (untested) | Ships linux-riscv64 tarball in v0.19.0; test_go runs only on ubuntu-latest amd64 | [ci.yml](https://github.com/prometheus/mysqld_exporter/blob/main/.github/workflows/ci.yml) | 2026-08-13 | none |
| redis_exporter | Observability | optional | orange | Ubuntu | Upstream Makefile explicitly omits riscv64 from gox targets; Ubuntu Noble ships prometheus-redis-exporter 1.54.0-1ubuntu0.24.04.3 | [Makefile](https://github.com/oliver006/redis_exporter/blob/master/Makefile) | 2026-08-13 | Proposed color was RED; corrected to ORANGE -- Ubuntu Noble downstream packaging found |
| memcached_exporter | Observability | optional | orange | upstream (untested) | Ships memcached_exporter-0.16.0.linux-riscv64.tar.gz; test_go runs only on ubuntu-latest | [v0.16.0 release](https://github.com/prometheus/memcached_exporter/releases/tag/v0.16.0) | 2026-04-08 | none |
| OpenTelemetry Collector | Observability | optional | orange | upstream (untested) | Ships riscv64 tarballs, .deb/.rpm, and Docker images; cross-build job has no test step; unittest-matrix on ubuntu-latest only | [build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector/blob/main/.github/workflows/build-and-test.yml) | 2026-08-13 | none |
| Grafana Alloy | Observability | optional | red | none | CI matrix is [amd64, arm64, ppc64le, s390x]; PR #1526 closed without merging; issue #1036 closed as not_planned and locked; v1.18.1 has no riscv64 artifacts | [packaging.mk](https://github.com/grafana/alloy/blob/main/build-tools/make/packaging.mk) | 2026-08-13 | Primary source updated; PR #1526 confirmed closed without merging |
| Grafana | Observability | optional | red | none | release-build.yml cross-compiles with allow-failure:true and "not an officially supported architecture" comment; internal staging artifact never promoted to public release; issue #109717 open since Aug 2025 | [release-build.yml](https://github.com/grafana/grafana/blob/main/.github/workflows/release-build.yml) | 2026-08-13 | none |
| OpenSSL | Core shared libraries | critical | blue | Debian/Ubuntu/Arch | Full test suite runs on riscv64 via QEMU on every push (cross-compiles.yml + riscv-more-cross-compiles.yml); PR #31080 (AES constant-time hardening) open but not a test failure | [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml) | 2026-08-13 | none |
| BoringSSL | Core shared libraries | optional | orange | none | Two riscv64 CI builders are standard commit-gate jobs but run_unit_tests:false and run_ssl_tests:false (compile-only) | [cr-buildbucket.cfg](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/cr-buildbucket.cfg) | 2026-08-13 | none |
| zlib | Core shared libraries | critical | blue | Debian | Upstream CI runs ctest on riscv64 via QEMU on every push/PR (others.yml OpenBSD matrix); source-only releases | [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) | 2026-08-13 | none |
| zlib-ng | Core shared libraries | optional | blue | Alpine | Full ctest on riscv64 via QEMU for GCC and Clang on every push/PR; coverage collection confirms test execution | [cmake.yml](https://github.com/zlib-ng/zlib-ng/blob/develop/.github/workflows/cmake.yml) | 2026-08-13 | none |
| LZ4 | Core shared libraries | critical | blue | Debian | Upstream CI runs make platformTest on riscv64 via qemu-riscv64-static; PR #1739 (LZ4_FAST_DEC_LOOP) open/unmerged -- performance gap only | [cross-platform.yml](https://github.com/lz4/lz4/blob/dev/.github/workflows/cross-platform.yml) | 2026-08-13 | none |
| zstd | Core shared libraries | critical | blue | Debian | Upstream CI runs full make check under QEMU at vlen=128/256/512 on riscv64; PR #4622 (HUF 4-way decode) open/unmerged -- performance gap only | [dev-short-tests.yml](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml) | 2026-06-17 | none |
| snappy | Core shared libraries | optional | blue | Debian | Upstream CI (riscv64-qemu-test.yaml) cross-compiles and runs make test under qemu-user | [riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml) | 2026-08-13 | none |
| jemalloc | Core shared libraries | critical | orange | Debian | Upstream CI covers ubuntu-24.04 x86_64 and arm64 only; Debian ships libjemalloc2 5.3.1-2 Installed; riscv64 supported in source (LG_QUANTUM 4) | [linux-ci.yml](https://github.com/jemalloc/jemalloc/blob/dev/.github/workflows/linux-ci.yml) | 2026-08-13 | none |
| tcmalloc | Core shared libraries | optional | red | none | Upstream CI covers ubuntu-24.04 x86_64 only; segv_handler.cc marks __riscv as not yet supported; RSEQ/per-CPU path absent; Ubuntu Noble libtcmalloc is from gperftools (separate codebase) | [ci.yml](https://github.com/google/tcmalloc/blob/master/.github/workflows/ci.yml) | 2026-08-13 | CI exists (x86-64 only); prior report incorrectly stated ".github/workflows/ does not exist" |
| PCRE2 | Core shared libraries | critical | blue | Debian | Upstream CI (dev.yml ptarmigan job) runs full ctest with JIT on riscv64 via uraimo/run-on-arch-action on every push | [dev.yml](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml) | 2026-08-13 | none |
| ICU | Core shared libraries | critical | orange | Debian | Upstream CI covers ubuntu-24.04, macOS, Windows only; no riscv64 CI; Debian sid libicu78 78.3-2 | [icu4c.yml](https://github.com/unicode-org/icu/blob/main/.github/workflows/icu4c.yml) | 2026-08-13 | none |
| libevent | Core shared libraries | critical | orange | Debian | Upstream CI (build.yml) covers Linux x86_64, Windows, macOS, FreeBSD, OpenBSD, Android -- zero riscv64; two new upstream releases (2.1.13-stable, 2.2.2-alpha, 2026-07-01) are source-only | [build.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/build.yml) | 2026-08-13 | Two new upstream releases since report; color unchanged |
| liburing | Core shared libraries | optional | orange | Debian | CI includes riscv64 matrix but runs only make install and trivial compile -- actual test/ suite never executed; liburing-2.15 final released 2026-06-29 | [ci.yml](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml) | 2026-08-13 | liburing-2.15 final released (was rc1 in prior report) |
| libnuma | Core shared libraries | optional | orange | Debian | Upstream CI covers ubuntu-latest x86_64 only; Debian sid libnuma1 2.0.19-1+b2 Installed on native RISC-V hardware | [makefile.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/makefile.yml) | 2026-08-13 | none |
| Protocol Buffers | Core shared libraries | optional | orange | Debian | Upstream CI covers x86_64, aarch64, i386, 32-bit Linux; maintainer comment 2025-08-27: "RISC-V isn't on our roadmap"; PR #23206 closed without merge | [test_cpp.yml](https://github.com/protocolbuffers/protobuf/blob/main/.github/workflows/test_cpp.yml) | 2025-08-27 | none |
| Lua | Core shared libraries | optional | orange | Debian | Upstream repository has no CI of any kind; v5.5.1 (2026-08-05) has empty assets array; Debian sid lua5.4 5.4.8-2 Installed | [buildd lua5.4](https://buildd.debian.org/status/package.php?p=lua5.4&suite=sid) | 2026-08-13 | none |
| xxHash | Core shared libraries | optional | blue | Debian | CI runs make check via qemu-riscv64-static for scalar and three RVV vector paths (vlen=128/256/512); XXH3_accumulate_512_rvv implemented | [ci.yml](https://github.com/Cyan4973/xxHash/blob/dev/.github/workflows/ci.yml) | 2026-08-13 | none |
| glibc | System runtime | critical | orange | none | Upstream Buildbot builder ran make check on riscv64 but all 5 builds fail (results=2); builder detached (masterids:[]) since 2025-06-10; Debian sid 2.43-3 Installed; glibc-2.44 released 2026-07-24 | [Debian buildd glibc](https://buildd.debian.org/status/package.php?p=glibc&suite=sid&arch=riscv64) | 2026-08-13 | Builder detachment and persistent failures confirmed; glibc-2.44 released upstream since report |
| libmvec | System runtime | optional | red | none | sysdeps/riscv/configure.ac sets no build_mathvec=yes; no mathvec subdirectory; libmvec.so absent from Debian riscv64 libc6; no downstream packaging | [bminor/glibc sysdeps/riscv](https://github.com/bminor/glibc/tree/master/sysdeps/riscv) | 2026-08-13 | none |
| Linux kernel riscv64 (io_uring/crypto/hwprobe) | System runtime | critical | orange | Debian | KernelCI builds and boots riscv64 on real hardware but all kselftest-* jobs wired to arm/arm64 and x86 only; no riscv64 test-execution in any CI; Debian ships 6.12.101-1 (stable) and 7.1.7-1 (testing) | [scheduler.yaml](https://github.com/kernelci/kernelci-pipeline/blob/main/config/scheduler.yaml) | 2026-08-13 | none |

### (b) Slide-ready summary table

| Node | Color | Criticality | Release provider |
|------|-------|-------------|-----------------|
| libpq | blue | critical | Debian |
| hiredis | orange | critical | Debian |
| PostgreSQL | blue | critical | Debian |
| MySQL | orange | critical | Debian |
| MariaDB | orange | critical | Debian |
| Redis | orange | critical | Debian |
| Memcached | orange | critical | Debian |
| OpenSSL | blue | critical | Debian/Ubuntu/Arch |
| zlib | blue | critical | Debian |
| LZ4 | blue | critical | Debian |
| zstd | blue | critical | Debian |
| jemalloc | orange | critical | Debian |
| PCRE2 | blue | critical | Debian |
| ICU | orange | critical | Debian |
| libevent | orange | critical | Debian |
| glibc | orange | critical | none |
| Linux kernel riscv64 | orange | critical | Debian |
| psycopg | green | optional | upstream |
| pgx | green | optional | upstream |
| pgjdbc | green | optional | upstream |
| go-sql-driver/mysql | green | optional | upstream |
| Patroni | green | optional | upstream |
| k0s | blue | optional | none |
| zlib-ng | blue | optional | Alpine |
| snappy | blue | optional | Debian |
| xxHash | blue | optional | Debian |
| hiredis | orange | critical | Debian |
| MariaDB Connector/C | orange | optional | Ubuntu |
| Valkey | orange | optional | Debian |
| pgvector | orange | optional | Ubuntu |
| PostGIS | orange | optional | Debian |
| RocksDB | orange | optional | Debian |
| MyRocks | orange | optional | Debian |
| Galera Cluster | orange | optional | Debian |
| PgBouncer | orange | optional | Debian |
| Pgpool-II | orange | optional | Debian |
| Kubernetes | orange | optional | third-party |
| containerd | orange | optional | upstream (untested) |
| runc | orange | optional | upstream (untested) |
| etcd | orange | optional | Debian |
| Helm | orange | optional | upstream (untested) |
| Prometheus | orange | optional | upstream (untested) |
| node_exporter | orange | optional | upstream (untested) |
| postgres_exporter | orange | optional | upstream (untested) |
| mysqld_exporter | orange | optional | upstream (untested) |
| redis_exporter | orange | optional | Ubuntu |
| memcached_exporter | orange | optional | upstream (untested) |
| OpenTelemetry Collector | orange | optional | upstream (untested) |
| BoringSSL | orange | optional | none |
| liburing | orange | optional | Debian |
| libnuma | orange | optional | Debian |
| Protocol Buffers | orange | optional | Debian |
| Lua | orange | optional | Debian |
| KeyDB | red | optional | none |
| Dragonfly | red | optional | none |
| Citus | red | optional | none |
| TimescaleDB | red | optional | none |
| Apache AGE | red | optional | none |
| MariaDB ColumnStore | red | optional | none |
| RediSearch | red | optional | none |
| RedisJSON | red | optional | none |
| RedisBloom | red | optional | none |
| RedisTimeSeries | red | optional | none |
| Vitess | red | optional | none |
| pgcat | red | optional | none |
| ProxySQL | red | optional | none |
| MaxScale | red | optional | none |
| mcrouter | red | optional | none |
| k3s | red | optional | none |
| CloudNativePG | red | optional | none |
| Zalando postgres-operator | red | optional | none |
| Percona Operator for MySQL | red | optional | none |
| MySQL Operator for Kubernetes | red | optional | none |
| mariadb-operator | red | optional | none |
| Redis Operator (OT-CONTAINER-KIT) | red | optional | none |
| Grafana Alloy | red | optional | none |
| Grafana | red | optional | none |
| tcmalloc | red | optional | none |
| libmvec | red | optional | none |

---

## Artifact 3: Narrative and next steps

### Scorecard

Of 17 critical-path nodes: 0 green, 7 blue (libpq, PostgreSQL, OpenSSL, zlib, LZ4, zstd, PCRE2), 10 orange (hiredis, MySQL, MariaDB, Redis, Memcached, jemalloc, ICU, libevent, glibc, Linux kernel), 0 red, 0 grey.

Of 61 optional nodes: 5 green (psycopg, pgx, pgjdbc, go-sql-driver/mysql, Patroni), 4 blue (k0s, zlib-ng, snappy, xxHash), 26 orange, 26 red, 0 grey.

### The story

**The floor holds, but only downstream.** Every one of the five database engines runs on riscv64. None of them are released by upstream. MySQL, MariaDB, Redis, and Memcached are orange because Debian or Ubuntu packaging teams are the sole party performing build validation on riscv64. If Debian drops or stalls a package (as happened with mysql-8.0, now replaced by mysql-9.7 in sid), the deployment path gaps without notice. PostgreSQL and its libpq client library are the healthiest: 3-4 upstream build farm workers run the full regression suite on native riscv64 hardware and publish results publicly. That is the only critical-path engine with an upstream riscv64 test gate.

**The system runtime is the silent floor risk.** glibc's upstream riscv64 CI builder (glibc-fedora-riscv) ran make check and produced five consecutive test failures before being detached from all Buildbot masters in June 2025. There is no active upstream riscv64 CI gate for glibc as of August 2026. Debian successfully builds and ships 2.43-3, lagging upstream 2.44 by one release. libmvec does not exist on riscv64 at all: no sysdeps/riscv/mathvec directory, no libmvec.so in any Debian package. Database analytics workloads that use vectorized math on x86/ARM fall back to scalar glibc math calls on riscv64 with no transparent upgrade path until libmvec is ported.

**Vectorization and crypto gaps are systemic, not per-project.** The RVA23U64 profile mandates RVV 1.0, Zvkned (AES vector crypto), and Zba/Zbb/Zbc. Against that baseline, the following gaps are confirmed:

- AES-GCM: OpenSSL PR #31080 (constant-time Zvkned path) open and unmerged. On hardware without Zvkned, OpenSSL uses a non-constant-time scalar fallback. Every TLS connection from every database engine (the TLS/encrypted connection pipeline chain) carries this timing side-channel risk.
- CRC32C: MySQL PR #639 (Abseil riscv64 CRC32C) closed unmerged; Zbc/Zbkc clmul patches for InnoDB/PostgreSQL/extstore are open but not merged. All three databases run scalar CRC32C checksums in their hot I/O paths.
- Compression throughput: zstd PR #4622 (HUF 4-way decode) and LZ4 PR #1739 (LZ4_FAST_DEC_LOOP) are unmerged. The MySQL/MariaDB LSM storage chain (MyRocks -> RocksDB -> LZ4/zstd/snappy) runs scalar decode on riscv64.
- Vector search: pgvector has no RVV distance kernel implementation. The PostgreSQL vector search pipeline chain falls back to scalar distance computation. Ubuntu Noble ships pgvector 0.6.0-1, two major upstream releases behind (current: 0.8.6), so even downstream vector improvements are not yet available.
- Vectorized math: libmvec is absent -- no port started.

**The Kubernetes and operator layer is a structural gap.** Kubernetes does not officially support riscv64. Two PRs opened 2026-08-10 to add riscv64 to the pause image and kube-cross toolchain are held pending the Tier 3 KEP process. Every PostgreSQL and MySQL Kubernetes operator (CloudNativePG, Zalando postgres-operator, Percona Operator for MySQL, MySQL Operator for Kubernetes, mariadb-operator) is red: none produce a riscv64 artifact. The only PostgreSQL HA on Kubernetes pipeline is blocked at the operator tier. The Redis Operator for Kubernetes (OT-CONTAINER-KIT) is also red. etcd, the distributed key-value store that Kubernetes and CloudNativePG depend on, treats riscv64 as an explicitly unsupported architecture requiring a runtime override flag, with the issue requesting official support closed without resolution in June 2026.

The one bright spot in this layer is k0s: upstream runs unit tests and smoke tests on native RISE ubuntu-24.04-riscv hardware nightly, and those tests pass. k0s is blue for CI quality but still ships no riscv64 release binary. It is the nearest-ready Kubernetes distribution for RISC-V and the most natural candidate for an end-to-end database deployment substrate.

**The observability tier is structurally untested but available.** Prometheus, node_exporter, and all Prometheus exporters for the five database engines ship upstream riscv64 binaries. None of them run their test suites on riscv64 before releasing -- they are uniformly orange upstream-ships-untested. This is largely acceptable risk for monitoring agents (test failures are operational, not data-loss), but it means no upstream CI catches regressions. The Grafana visualization tier is red: Grafana Alloy declined riscv64 support explicitly (issue #1036 closed as not_planned); Grafana itself produces an internal staging riscv64 artifact with allow-failure:true that never reaches public distribution. The OTel Collector -> Grafana Alloy -> Grafana dashboard pipeline has two consecutive red nodes at the presentation layer.

**Hidden dependency risks via third-party and downstream-only providers.** Thirteen critical or load-bearing optional nodes have their sole consumable riscv64 artifact produced by Debian or Ubuntu, not upstream. In several cases Debian patching actively works around upstream build failures (MyRocks/MDEV-29875). If distro packaging priorities shift, these nodes become unavailable with no upstream fallback. Kubernetes riscv64 deployments depend on community forks (CARV-ICS-FORTH, alitariq4589) with no SLA or long-term support commitment.

### Actionable next steps

The following actions are ordered by impact-to-effort ratio. Where RISE or another party already has work underway, that is called out to avoid double-counting.

**1. CRC32C hardware acceleration -- MySQL and PostgreSQL (high impact, low upstream friction).**
The MySQL PR #639 (Abseil CRC32C Zbc/Zbkc) was closed; a new or successor PR should be prepared against the mysql-9.7 codebase targeting the InnoDB CRC32C hot path. For PostgreSQL the relevant patch targets the storage manager and WAL CRC path. These are narrow, well-understood patches. CRC32C is on every I/O request; scalar fallback is a measurable throughput regression on high-IOPS workloads. Priority upstream contact: MySQL storage team (Oracle) and PostgreSQL hackers list.

**2. AES constant-time path in OpenSSL (OpenSSL PR #31080) -- security gap, cross-cutting.**
PR #31080 is open and addresses an explicit security property required by the RVA23U64 profile (Zvkned). Every database TLS session is affected. Engaging the OpenSSL RISC-V maintainers to prioritize review or provide a RISE-funded contributor to iterate on the PR is the most efficient lever. This unblocks the TLS/encrypted connection pipeline chain for all five database engines simultaneously.

**3. zstd HUF 4-way decode (PR #4622) and LZ4 LZ4_FAST_DEC_LOOP (PR #1739) -- compression throughput.**
Both PRs are open and unmerged. These libraries are in the critical path for RocksDB (used by MySQL/MariaDB MyRocks), InnoDB page compression, and PostgreSQL pg_compress. Throughput gains are 2-4x vs. scalar on these decode paths. Both projects are relatively responsive to well-prepared PRs. RISE could accelerate by providing QEMU/native test infrastructure for benchmark validation in the PR review cycle.

**4. pgvector RVV distance kernels -- vector search path.**
pgvector's distance computation kernels (L2, inner product, cosine) have no RVV implementation. The PostgreSQL vector search pipeline chain is a target workload for AI/ML database applications. The pgvector project is small and community-driven; an RVV kernel contribution with QEMU test coverage has a reasonable chance of acceptance. Additionally, Ubuntu Noble carries a stale 0.6.0-1 package -- coordinating with Ubuntu to advance to 0.8.x would unblock users who cannot build from source.

**5. k0s release pipeline for riscv64 -- Kubernetes deployment substrate.**
k0s already passes unit tests and smoke tests on native RISE hardware nightly. The only remaining step to move it from blue to green is enabling the riscv64 binary in the goreleaser release pipeline. This is the lowest-hanging fruit in the Kubernetes operator layer and would provide a supported deployment substrate for containerized databases. RISE runners are already in place; the ask to the k0s maintainers is a release pipeline extension.

**6. CloudNativePG riscv64 operator image -- PostgreSQL HA on Kubernetes path.**
CloudNativePG is the most widely adopted PostgreSQL Kubernetes operator. Its goreleaser is restricted to amd64/arm64. A Go cross-compiled riscv64 binary and container image built in CI (no native hardware needed) would unblock the PostgreSQL HA on Kubernetes pipeline chain. The Zalando postgres-operator is an alternative if CloudNativePG is unresponsive, but CloudNativePG has better community momentum. RISE could provide a QEMU-based riscv64 CI runner as a contribution incentive.

**7. etcd riscv64 official support -- Kubernetes control plane dependency.**
etcd's runtime guard (checkSupportArch, os.Exit(1) without the env override) reflects the absence of Prow RISC-V test nodes cited in issue #21509. This is a clear infrastructure ask: a RISE-provided riscv64 Prow node would directly unblock the etcd riscv64 tier promotion. Without it, Kubernetes and all PostgreSQL HA deployments run an unsupported etcd binary under an override flag. Priority contact: etcd-io maintainers, CNCF TOC.

**8. Grafana riscv64 official release -- observability visualization.**
Grafana already cross-compiles riscv64 internally with allow-failure:true. The barrier is promoting that build to an official release artifact and removing the "not officially supported" guard. Issue #109717 is open with no assigned owner. This is an escalation path, not a code contribution: a RISE or operator request to Grafana Labs to move riscv64 from internal staging to official release would likely require a support or partnership conversation rather than a code PR.

**9. glibc riscv64 CI reactivation and libmvec port -- system runtime completeness.**
The glibc-fedora-riscv Buildbot builder needs reactivation with its test failures addressed (or a replacement builder on a clean riscv64 host). RISE already operates ubuntu-24.04-riscv runners for k0s; the same infrastructure should be offered to the glibc Buildbot. The libmvec port is a longer-term investment -- it requires implementing sysdeps/riscv/mathvec with RVV-optimized elementary math functions -- but it is the prerequisite for database analytics workloads to fully utilize the RISC-V vector unit.

**10. Redis and Memcached upstream CI -- cache engine correctness.**
Both Redis and Memcached have upstream CI with zero riscv64 coverage. The Memcached alignment fix (PR #1291) is staged but not in master, indicating an active quality gap on strict-alignment architectures. Contributing a QEMU-based riscv64 CI job to both projects (similar to what already exists for LZ4, snappy, zstd, and PCRE2) would provide the upstream test gate currently absent. This is a CI infrastructure contribution rather than a code change and is the most straightforward community ask for these projects.