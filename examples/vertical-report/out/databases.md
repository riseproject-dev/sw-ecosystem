---
title: Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack -- RISC-V Ecosystem Status
---

# Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack -- RISC-V Ecosystem Status

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-27<br/>
**Scope:** RISC-V readiness of the Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

**Scoping assumptions:**
- Five per-product sub-verticals: PostgreSQL, MySQL, MariaDB, Redis, Memcached. Each has three per-product layers (Client Drivers, Database Engine, Extensions / Clustering & Proxies).
- Two shared layers span all five products: Orchestration & Observability (Kubernetes control plane, database operators, metrics pipeline) and System Libraries (compression, crypto, allocators, text, I/O, system runtime).
- CPU-only per operator directive: no GPU / CUDA / ROCm paths.
- Target profile RVA23U64: RVV 1.0, vector crypto (Zvkned), Zba/Zbb/Zbc, and FP16 are treated as mandatory baseline, so missing SIMD/crypto acceleration is a gap against baseline.

**Out of scope (deliberately dropped):** Managed cloud database services (AWS RDS/Aurora/ElastiCache, GCP Cloud SQL/AlloyDB/MemoryStore, Azure Database); GPU/CUDA/ROCm acceleration paths; Windows and macOS server deployment.

---

**Color key:**

| Color | Meaning |
|-------|---------|
| green | Upstream CI passes on riscv64; upstream ships riscv64 release artifact |
| blue | Upstream CI passes on riscv64; no upstream riscv64 release artifact (distro provides) |
| yellow | Build-only CI or clean distro build from unpatched upstream source; no test gate |
| orange | No upstream riscv64 CI; build status uncertain (no confirmed current breakage) |
| red | Confirmed build-blocking breakage on riscv64; upstream explicitly unsupported |

---

## Artifact 1: Layered stack outline

### Layer 1.a -- PostgreSQL: Client Drivers

- **libpq** -- blue (critical)
  - The canonical C client library for PostgreSQL, shipped as part of the PostgreSQL source tree.
  - License: Data not available. Governance: PostgreSQL Global Development Group.
  - Release provided by Ubuntu (and Debian), not upstream.
  - Gap: No riscv64 jobs in the primary GitHub Actions workflow; riscv64 coverage comes exclusively from the PostgreSQL Build Farm (three active workers: boomslang, copperhead, greenfly) running the full regression suite daily. Upstream ships source-only tarballs; distros provide riscv64 binaries.

- **psycopg** -- green (optional)
  - Pure-Python PostgreSQL adapter for Python 3; binary wheel variant (psycopg_binary) includes a C extension.
  - License: Data not available. Governance: Daniele Varrazzo / community.
  - Upstream publishes riscv64 binary wheels on PyPI (manylinux_2_39, musllinux_1_2) for Python 3.10-3.14, tested via QEMU in the packages-bin.yml CI workflow with no CIBW_TEST_SKIP for riscv64.

- **pgx** -- green (optional)
  - Pure-Go PostgreSQL driver for Go; no assembly or CGo.
  - License: Data not available. Governance: Jack Christensen / community.
  - Distributed as a Go module via proxy.golang.org; runs on linux/riscv64 by construction via the standard Go toolchain.

- **pgjdbc** -- green (optional)
  - Pure-Java Type 4 JDBC driver for PostgreSQL; no JNI or native code.
  - License: Data not available. Governance: PostgreSQL JDBC Driver project.
  - Upstream publishes a single architecture-independent JAR on Maven Central; runs on riscv64 via any conformant JDK.

### Layer 2.a -- PostgreSQL: Database Engine

- **PostgreSQL** -- blue (critical)
  - The PostgreSQL relational database engine; primary open-source OLTP workhorse in this vertical.
  - License: Data not available. Governance: PostgreSQL Global Development Group.
  - Release provided by Debian (and Ubuntu, Arch Linux RISC-V), not upstream.
  - Gap: Zero riscv64 jobs in the GitHub Actions primary CI (pg-ci.yml); riscv64 coverage is provided exclusively by the [Build Farm](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64) (four active riscv64 workers: boomslang, copperhead, greenfly, mollusk) running the full regression suite on master through REL_13_STABLE. Upstream ships source-only tarballs.

### Layer 3.a -- PostgreSQL: Extensions, Clustering & Proxies

- **pgvector** -- yellow (optional)
  - HNSW and IVFFlat vector similarity search extension for PostgreSQL.
  - License: Data not available. Governance: Andrew Kane / community.
  - Release provided by Ubuntu (and Debian), not upstream.
  - Gap: No riscv64 CI upstream. RVV SIMD acceleration absent; scalar fallback fully functional for all operator and index types. Distro packages available (Ubuntu 24.04 ships 0.6.0, Debian sid ships 0.8.6) from unpatched upstream source.

- **PostGIS** -- yellow (optional)
  - Spatial and geographic object support extension for PostgreSQL.
  - License: Data not available. Governance: PostGIS Project Steering Committee.
  - Release provided by Debian, not upstream.
  - Gap: No riscv64 CI upstream (Woodpecker portability CI covers arm64, armhf, s390x but not riscv64). Debian sid ships 3.6.4+dfsg-2 from unpatched upstream source.

- **TimescaleDB** -- yellow (optional)
  - Time-series extension for PostgreSQL.
  - License: Data not available. Governance: Timescale, Inc.
  - Release provided by Debian, not upstream.
  - Gap: Zero riscv64 references across all ~45 GitHub Actions workflows; upstream release artifacts are Windows amd64 only. Debian sid ships 2.29.2+dfsg-1 for riscv64 from unpatched upstream source.

- **Apache AGE** -- yellow (optional)
  - Graph database extension for PostgreSQL implementing openCypher.
  - License: Data not available. Governance: Apache Software Foundation.
  - Release provided by Debian, not upstream.
  - Gap: All five upstream workflows run on x86_64 only. Debian packages postgresql-18-age 1.8.0~rc0-2 for riscv64 from unmodified upstream source (single packaging patch is test-harness paths only, not architecture-specific).

- **Citus** -- orange (optional)
  - Distributed PostgreSQL extension for sharding and horizontal scaling.
  - License: Data not available. Governance: Microsoft / citusdata.
  - Release provider: none (no upstream or distro riscv64 binary exists).
  - Gap: All 7 GitHub Actions workflow files run exclusively on ubuntu-latest/ubuntu-22.04 (x86_64). No riscv64 package exists in Ubuntu noble, Debian, Arch Linux RISC-V, or PGDG. Build status on riscv64 is unconfirmed; no confirmed breakage has been reported.

- **Patroni** -- green (optional)
  - High-availability solution for PostgreSQL using distributed configuration stores.
  - License: Data not available. Governance: Zalando SE / community.
  - Pure Python; upstream publishes exclusively as a py3-none-any wheel on PyPI. Runs on riscv64 by construction.

- **PgBouncer** -- yellow (optional)
  - Lightweight connection pooler for PostgreSQL.
  - License: Data not available. Governance: PgBouncer community.
  - Release provided by Ubuntu (and Debian), not upstream.
  - Gap: No riscv64 CI upstream (upstream CI covers ubuntu-22.04, ubuntu-24.04-arm, macos-15, windows-2022 only). Debian ships 1.25.2-1 for riscv64; no riscv64-specific patches in the packaging.

- **Pgpool-II** -- yellow (optional)
  - Connection pooling, load balancing, and replication middleware for PostgreSQL.
  - License: Data not available. Governance: Pgpool Global Development Group.
  - Release provided by Debian (and Ubuntu), not upstream.
  - Gap: No upstream CI of any kind (.github/workflows absent). Debian sid ships pgpool2 4.7.2-1 built natively on rv-manda-04; Ubuntu 24.04 ships 4.3.7-1ubuntu4 for riscv64. Single Debian packaging patch is a generic config change.

- **pgcat** -- red (optional)
  - PostgreSQL connection pooler and proxy written in Rust.
  - License: Data not available. Governance: PostgresML / community.
  - Release provider: none.
  - Gap: Build-blocking dependency -- Cargo.toml pins tokio-rustls = 0.24 and rustls = 0.21, pulling in ring 0.16 which predates riscv64 support (ring PR [#1627](https://github.com/briansmith/ring/pull/1627) targeted ring 0.17). Upgrade PR [#881](https://github.com/postgresml/pgcat/pull/881) remains open and unmerged as of 2026-08-27. No riscv64 CI, release artifacts, or distro packages exist.

**Pipeline chains and alternate paths:**

PostgreSQL application stack: libpq -> PostgreSQL -> pgvector -> (Patroni / PgBouncer / Pgpool-II) -> Kubernetes operators

### Layer 4.a -- Orchestration & Observability

- **CloudNativePG** -- red (optional)
  - Primary CNCF Sandbox Kubernetes operator for PostgreSQL.
  - License: Data not available. Governance: CNCF / CloudNativePG community.
  - Release provider: none.
  - Gap: [continuous-delivery.yml](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/.github/workflows/continuous-delivery.yml) hard-codes `PLATFORMS: "linux/amd64,linux/arm64"`; all v1.30.0 release binaries cover only x86_64, arm64, ppc64le, and s390x. Zero riscv64 issues or PRs in the repository.

- **Zalando postgres-operator** -- orange (optional)
  - Kubernetes operator for automated PostgreSQL cluster management.
  - License: Data not available. Governance: Zalando SE.
  - Release provider: none.
  - Gap: All three CI workflows run on ubuntu-latest (x86_64) only; [publish_ghcr_image.yaml](https://github.com/zalando/postgres-operator/blob/master/.github/workflows/publish_ghcr_image.yaml) explicitly specifies `platforms: linux/amd64,linux/arm64` with no riscv64 target. No riscv64 mention anywhere in the codebase.

- **postgres_exporter** -- yellow (optional)
  - Prometheus exporter for PostgreSQL metrics.
  - License: Data not available. Governance: Prometheus community.
  - Release provided by upstream.
  - Gap: The `build` job calls promci/build (promu crossbuild, no test execution); test_go and integration_tests jobs run only on ubuntu-latest (amd64). Upstream publishes postgres_exporter-0.20.1.linux-riscv64.tar.gz directly.

### Layer 1.b -- MySQL: Client Drivers

- **MariaDB Connector/C** -- yellow (optional)
  - C client library for MySQL-compatible connections, also used by MySQL clients.
  - License: Data not available. Governance: MariaDB Corporation.
  - Release provided by Ubuntu, not upstream.
  - Gap: No riscv64 CI in any upstream branch or the external build-matrix action. Ubuntu noble ships libmariadb3 for riscv64 from the mariadb server source package; the one riscv64-specific patch in that packaging (2980-riscv-use-rdtime.patch) modifies only include/my_rdtsc.h, a server-internal file not compiled into the connector library, so the connector itself builds from unmodified upstream source.

- **go-sql-driver/mysql** -- green (optional)
  - Pure-Go MySQL driver; no assembly or CGo.
  - License: Data not available. Governance: community.
  - Distributed as a Go module via proxy.golang.org; runs on linux/riscv64 by construction.

### Layer 2.b -- MySQL: Database Engine

- **MySQL** -- orange (critical)
  - The MySQL relational database engine.
  - License: Data not available. Governance: Oracle Corporation.
  - Release provided by Debian (and Ubuntu), not upstream.
  - Gap: Oracle's .github/workflows/ (pr-build.yml, mtr.yml) has zero riscv64 references. Ubuntu 24.04 Noble ships mysql-server-8.0 at version 8.0.36 for riscv64 with the [use-largest-lock-free-type-selector-on-riscv.patch](https://git.launchpad.net/ubuntu/+source/mysql-8.0/tree/debian/patches?h=ubuntu/noble) still required because upstream lock_free_type.h has no `__riscv` guard. The situation has worsened since June 2026: Debian sid removed mysql-8.0 on 2026-07-23, and the replacement mysql-9.7 (9.7.2-4) has a missing riscv64 build in the Debian tracker, leaving Ubuntu 24.04 as the primary distribution channel at 8.0.36 -- behind the 8.0.46 security release on other architectures.

### Layer 3.b -- MySQL: Extensions, Clustering & Proxies

- **Vitess** -- orange (optional)
  - Distributed MySQL clustering system, originally built at YouTube.
  - License: Data not available. Governance: CNCF / Vitess community.
  - Release provider: none.
  - Gap: No riscv64 CI across ~49 workflow files; latest release v24.0.2 ships only amd64.deb, x86_64.rpm, and a generic tarball. No Vitess package exists in Ubuntu, Debian, or Arch Linux RISC-V.

- **ProxySQL** -- orange (optional)
  - High-performance MySQL proxy with advanced query routing.
  - License: Data not available. Governance: ProxySQL community / Rene Cannao.
  - Release provider: none.
  - Gap: No riscv64 CI; latest stable v3.0.11 ships only x86_64 and aarch64 assets. Active build blockers: coredumper is an unconditional Linux dependency with no skip flag; pinned jemalloc 5.2.0 does not recognize the riscv64gc toolchain triple (fix in 5.3.1). The sole community RISC-V PR [#5034](https://github.com/sysown/proxysql/pull/5034) (documentation-only) is stalled with no maintainer action since 2025-09-30.

**Pipeline chains and alternate paths:**

MySQL application stack: MariaDB Connector/C -> MySQL -> (Vitess / ProxySQL) -> Kubernetes operators

### Layer 4.b -- Orchestration & Observability

- **Percona Operator for MySQL** -- orange (optional)
  - Kubernetes operator for Percona Server for MySQL.
  - License: Data not available. Governance: Percona.
  - Release provider: none.
  - Gap: [scan.yml](https://github.com/percona/percona-server-mysql-operator/blob/main/.github/workflows/scan.yml) builds only linux/arm64 and linux/amd64; no riscv64 image on Docker Hub.

- **MySQL Operator for Kubernetes** -- orange (optional)
  - Official Oracle Kubernetes operator for MySQL InnoDB Cluster.
  - License: Data not available. Governance: Oracle Corporation.
  - Release provider: none.
  - Gap: [build.sh](https://github.com/mysql/mysql-operator/blob/trunk/build.sh) contains a `^(amd64|arm64)$` validation guard that actively rejects riscv64 with `exit 1`. No .github/workflows directory exists.

- **mysqld_exporter** -- yellow (optional)
  - Prometheus exporter for MySQL and MariaDB metrics.
  - License: Data not available. Governance: Prometheus community / CNCF.
  - Release provided by upstream.
  - Gap: test_go runs only on ubuntu-latest (x86_64); the build job cross-compiles via promci/build with no riscv64 test execution. Upstream ships mysqld_exporter-0.20.0.linux-riscv64.tar.gz directly.

### Layer 1.c -- MariaDB: Client Drivers

- **MariaDB Connector/C** -- yellow (optional)
  - C client library for MariaDB-compatible connections. (Same upstream project as MySQL layer entry.)
  - License: Data not available. Governance: MariaDB Corporation.
  - Release provided by Ubuntu, not upstream.
  - Gap: No riscv64 CI upstream. Ubuntu noble ships libmariadb3 for riscv64 from the mariadb server source package with no riscv64-specific patches affecting the connector library itself.

- **go-sql-driver/mysql** -- green (optional)
  - Pure-Go MySQL/MariaDB driver. (Same upstream project as MySQL layer entry.)
  - License: Data not available. Governance: community.
  - Runs on linux/riscv64 by construction via the Go toolchain.

### Layer 2.c -- MariaDB: Database Engine

- **MariaDB** -- yellow (critical)
  - MariaDB Server relational database engine; drop-in MySQL replacement.
  - License: Data not available. Governance: MariaDB Foundation.
  - Release provided by Debian, not upstream.
  - Gap: Zero riscv64 references in the .gitlab-ci.yml (confirmed 564 lines). All 17 Debian packaging patches contain no riscv64-specific changes, qualifying for clean-distro-build. MDEV-29875 (RocksDB plugin build failure on riscv64) is open/critical but out of scope for the default feature set built with -DPLUGIN_ROCKSDB=NO.

### Layer 3.c -- MariaDB: Extensions, Clustering & Proxies

- **RocksDB** -- orange (optional)
  - LSM-tree storage engine used as the MyRocks plugin backend.
  - License: Data not available. Governance: Meta / RocksDB community.
  - Release provided by Debian, not upstream.
  - Gap: Zero riscv64 CI across all 14 upstream workflow files. Debian sid 9.11.2-1 ships riscv64 with a patch that removes a build-blocking `#error` in toku_time.h for unrecognized architectures (including riscv64). Upstream PR [#14530](https://github.com/facebook/rocksdb/pull/14530) (fixes RISC_ISA typo, LLD detection) remains open and unmerged as of 2026-08-08.

- **MyRocks** -- orange (optional)
  - RocksDB storage engine plugin for MariaDB/MySQL.
  - License: Data not available. Governance: Meta (archived repository).
  - Release provided by Debian, not upstream.
  - Gap: [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) (open/critical, filed 2022-10-26, last updated 2026-06-02) documents that mariadb-plugin-rocksdb fails to build on riscv64 from vanilla upstream source due to a jemalloc mm_malloc.h scope issue. Debian maintainers carry riscv64-specific workaround patches. The upstream facebook/mysql-5.6 repository was archived on 2026-03-01.

- **Galera Cluster** -- yellow (optional)
  - Synchronous multi-primary replication plugin for MariaDB.
  - License: Data not available. Governance: Codership.
  - Release provided by Debian, not upstream.
  - Gap: Upstream CI covers x86 only (Travis CI on Ubuntu Bionic, no riscv64). Debian sid builds galera-4 26.4.27-1 natively (rv-manda-02, Installed, 2026-08-10). The historical CK_TIMEOUT_MULTIPLIER fix is now set universally in upstream, so no riscv64-specific patch is applied by Debian.

- **MariaDB ColumnStore** -- red (optional)
  - Distributed columnar analytics (OLAP) storage engine for MariaDB.
  - License: Data not available. Governance: MariaDB Corporation.
  - Release provider: none.
  - Gap: [.drone.jsonnet](https://github.com/mariadb-corporation/mariadb-columnstore-engine/blob/develop/.drone.jsonnet) targets only amd64 and arm64; no riscv64 CI job exists. Not packaged in Debian, Ubuntu, or Arch Linux RISC-V for riscv64. No known build attempt on riscv64.

- **MaxScale** -- orange (optional)
  - Advanced database proxy and load balancer for MariaDB.
  - License: Data not available. Governance: MariaDB Corporation.
  - Release provider: none.
  - Gap: No CI of any kind -- the .github/ directory contains only dependabot.yml with no workflows subdirectory. No riscv64 binary available from any channel: not Debian (HTTP 404), not Ubuntu 24.04, not Arch Linux RISC-V, not the MariaDB download portal.

**Pipeline chains and alternate paths:**

MariaDB application stack: MariaDB Connector/C -> MariaDB -> (Galera Cluster / MaxScale) -> mariadb-operator -> Kubernetes

MyRocks/RocksDB chain: RocksDB -> MyRocks -> MariaDB (plugin, disabled on riscv64 by default)

### Layer 4.c -- Orchestration & Observability

- **mariadb-operator** -- orange (optional)
  - Kubernetes operator for MariaDB deployments.
  - License: Data not available. Governance: mariadb-operator community.
  - Release provider: none.
  - Gap: [.goreleaser.yml](https://github.com/mariadb-operator/mariadb-operator/blob/main/.goreleaser.yml) lists `goarch: [amd64, arm64]` only; [release.yml](https://github.com/mariadb-operator/mariadb-operator/blob/main/.github/workflows/release.yml) sets `platforms: linux/arm64,linux/amd64`. Latest release v26.6.0 has only linux_amd64 and linux_arm64 tarballs.

### Layer 1.d -- Redis: Client Drivers

- **hiredis** -- yellow (critical)
  - The canonical minimalist C client library for Redis.
  - License: Data not available. Governance: Redis Ltd / community.
  - Release provided by Ubuntu (and Debian), not upstream.
  - Gap: Upstream CI [test.yml](https://github.com/redis/hiredis/blob/master/.github/workflows/test.yml) covers x86_64, 32-bit, arm, and aarch64 but contains no riscv64 job. Debian sid ships 1.2.0-6+b4 for riscv64 built natively with no riscv64-specific patches.

### Layer 2.d -- Redis: Database Engine

- **Redis** -- orange (critical)
  - The primary in-memory KV cache and data structure server for this vertical.
  - License: Data not available. Governance: Redis Ltd.
  - Release provided by Debian, not upstream.
  - Gap: All 9 upstream CI workflow files contain zero riscv64 references; no maintainer owns RISC-V hardware. Two performance PRs ([#15204](https://github.com/redis/redis/pull/15204) Zbb popcount, [#15273](https://github.com/redis/redis/pull/15273) HyperLogLog RVV) remain unreviewed since May 2026. Debian sid ships 5:8.0.6-2 built on OSUOSL RISC-V hardware.

- **Valkey** -- orange (optional)
  - Linux Foundation fork of Redis 7.2; drop-in Redis replacement.
  - License: Data not available. Governance: Linux Foundation / Valkey project.
  - Release provided by Debian, not upstream.
  - Gap: CI workflow (unstable branch) covers Linux x86_64, x86-32, macOS ARM64 only -- no riscv64 runner or QEMU job. No upstream release binary assets. Debian sid ships valkey-server 9.1.1-1 for riscv64 as a first-class architecture.

- **KeyDB** -- orange (optional)
  - Multi-threaded Redis fork maintained by Snapchat.
  - License: Data not available. Governance: Snapchat.
  - Release provider: none.
  - Gap: CI covers ubuntu-latest, ubuntu-20.04, macos-latest, libc-malloc only; all GitHub releases have empty asset lists; no distro packages exist. Community reports (issue #517, Nov 2022) indicate the source is manually buildable on riscv64 but no CI gate exists.

- **Dragonfly** -- orange (optional)
  - Redis-compatible in-memory datastore written in C++.
  - License: Data not available. Governance: DragonflyDB.
  - Release provider: none.
  - Gap: Zero riscv64 CI across all 20 GitHub Actions workflows; no riscv64 assets in releases v1.38.0 through v1.40.1; no distro packages. Native riscv64 builds additionally require a manual CMake override to bypass a FATAL_ERROR in [helio/cmake/internal.cmake](https://github.com/romange/helio/blob/main/cmake/internal.cmake) that handles only aarch64, x86_64, arm64, and s390x -- riscv64 falls to the FATAL_ERROR else branch.

### Layer 3.d -- Redis: Extensions, Clustering & Proxies

- **RediSearch** -- orange (optional)
  - Full-text search and secondary indexing module for Redis.
  - License: Data not available. Governance: Redis Ltd.
  - Release provided by Ubuntu (v1.2.2 in universe), not upstream.
  - Gap: No riscv64 CI across all 59 upstream workflows; the VectorSimilarity submodule has cmake/aarch64InstructionFlags.cmake and cmake/x86_64InstructionFlags.cmake but no riscv64 counterpart. Ubuntu 24.04 ships redis-redisearch 1:1.2.2-4 for riscv64 -- approximately 7 major versions behind upstream 2.10.x -- making the distribution floor resolve at orange rather than yellow.

- **RedisJSON** -- orange (optional)
  - Native JSON data type module for Redis.
  - License: Data not available. Governance: Redis Ltd.
  - Release provider: none.
  - Gap: No riscv64 CI and no riscv64 release artifacts. The previously confirmed build blocker (bindgen = 0.22.1 pinned in Cargo.lock) was resolved by upgrading to bindgen 0.66.1 in PR #1483 (merged 2025-12-30). No confirmed current breakage exists, but the build has never been verified on riscv64 upstream.

- **RedisBloom** -- red (optional)
  - Probabilistic data structures module (Bloom filter, Cuckoo filter, etc.) for Redis.
  - License: Data not available. Governance: Redis Ltd (deprecated since Redis 8 GA, May 2025).
  - Release provider: none.
  - Gap: The [Makefile](https://github.com/RedisBloom/RedisBloom/blob/master/Makefile) contains an explicit `$(error)` that aborts compilation for any architecture other than x64 or arm64v8, confirmed live on 2026-08-27. Non-OSI RSALv2/SSPLv1 license prevents distro distribution. No riscv64 PRs or issues have ever been filed. Module is deprecated.

- **RedisTimeSeries** -- red (optional)
  - Time-series data module for Redis.
  - License: Data not available. Governance: Redis Ltd (merged into Redis 8).
  - Release provider: none.
  - Gap: The [Makefile](https://github.com/RedisTimeSeries/RedisTimeSeries/blob/master/Makefile) still contains a hard `$(error)` terminating any build on riscv64, mapping only x64 and arm64v8. The vendored cpu_features v0.6.0 submodule also emits a CMake FATAL_ERROR for riscv64. Both constitute explicit upstream statements that riscv64 is unsupported. Zero riscv64 code across all 18 workflow files.

**Pipeline chains and alternate paths:**

Redis application stack: hiredis -> Redis -> (RediSearch / RedisJSON) -> Redis Operator (OT-CONTAINER-KIT) -> Kubernetes

### Layer 4.d -- Orchestration & Observability

- **Redis Operator (OT-CONTAINER-KIT)** -- orange (optional)
  - Kubernetes operator for Redis cluster deployments.
  - License: Data not available. Governance: OT-CONTAINER-KIT community.
  - Release provider: none.
  - Gap: [publish-image.yaml](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/publish-image.yaml) hard-codes `platforms: linux/amd64,linux/arm64`; [ci.yaml](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/ci.yaml) builds only `arch: ["amd64", "arm64"]`.

- **redis_exporter** -- orange (optional)
  - Prometheus exporter for Redis metrics.
  - License: Data not available. Governance: Oliver006 / community.
  - Release provider: none.
  - Gap: v1.90.0 (2026-08-27) ships 23 assets covering 9 Linux architectures but riscv64 is absent from all of them. No riscv64 references in CI workflow files. Pure Go with CGO_ENABLED=0, so trivially buildable from source, but upstream has never shipped a riscv64 binary and no distro packages the project.

### Layer 1.e -- Memcached: Client Drivers

N/A: everything is through simple TCP connection

### Layer 2.e -- Memcached: Database Engine

- **Memcached** -- yellow (critical)
  - High-performance in-memory key-value cache.
  - License: Data not available. Governance: Memcached community.
  - Release provided by Debian, not upstream.
  - Gap: Upstream CI [ci.yml](https://github.com/memcached/memcached/blob/master/.github/workflows/ci.yml) has a single x86_64-only job. Debian sid ships 1.6.45-1 for riscv64 (built on rv-osuosl-03); all Debian patches are packaging-only with no riscv64-specific changes. CRC32C software fallback affects only the optional extstore path.

### Layer 3.e -- Memcached: Extensions, Clustering & Proxies

- **mcrouter** -- red (optional)
  - Production Memcached proxy from Meta; used for large-scale fan-out.
  - License: Data not available. Governance: Meta.
  - Release provider: none.
  - Gap: [mcrouter/lib/Clocks.cpp](https://github.com/facebook/mcrouter/blob/main/mcrouter/lib/Clocks.cpp) has no `#elif defined(__riscv)` branch and hits `#error Unsupported CPU. Consider implementing your own Clock.` at compile time (confirmed live 2026-08-27). Independently, the hard-required dependency folly has two unresolved riscv64 build failures ([#2493](https://github.com/facebook/folly/issues/2493), [#2416](https://github.com/facebook/folly/issues/2416)) both still open. No distro packages mcrouter for any architecture.

**Pipeline chains and alternate paths:**

Memcached application stack: hiredis (or native binary protocol) -> Memcached -> mcrouter (red) -> Kubernetes

### Layer 4.e -- Orchestration & Observability

- **memcached_exporter** -- yellow (optional)
  - Prometheus exporter for Memcached metrics.
  - License: Data not available. Governance: Prometheus community / CNCF.
  - Release provided by upstream.
  - Gap: The build job calls promci/build (cross-compile only); test_go runs on ubuntu-latest (amd64) only. Upstream publishes memcached_exporter-0.17.0.linux-riscv64.tar.gz directly.

### Layer 4 -- Orchestration & Observability

- **Kubernetes** -- yellow (optional)
  - Container orchestration control plane; the deployment substrate for all database operators in this vertical.
  - License: Data not available. Governance: CNCF / Linux Foundation.
  - Release provided by Debian, not upstream.
  - Gap: No upstream riscv64 CI (zero Prow/GitHub Actions riscv64 jobs confirmed in test-infra); no upstream riscv64 release binaries. Debian sid ships kubectl 1.33.4+ds-1 for riscv64 with only two packaging patches (neither riscv64-specific). Open PR [#141291](https://github.com/kubernetes/kubernetes/pull/141291) (2026-08-10, on hold, unmerged) would add riscv64 to the pause image build.

- **containerd** -- yellow (optional)
  - Container runtime; required by Kubernetes node agents.
  - License: Data not available. Governance: CNCF.
  - Release provided by upstream.
  - Gap: Upstream nightly CI cross-compiles riscv64 and ships riscv64 tarballs in every tagged release (confirmed v2.3.4), but the integration test workflow (ci.yml) has zero riscv64 entries -- no tests run on riscv64. PR [#13124](https://github.com/containerd/containerd/pull/13124) to add riscv64 integration tests via RISE runners remains open and unmerged as of 2026-08-08.

- **runc** -- yellow (optional)
  - OCI container runtime; the low-level process launcher used by containerd.
  - License: Data not available. Governance: OCI / CNCF.
  - Release provided by upstream.
  - Gap: Upstream cross-compiles and publishes a signed runc.riscv64 binary in every official release (confirmed v1.5.1, 2026-07-14), but zero riscv64 occurrences exist in all three CI workflow files -- the binary is built but never tested before release.

- **etcd** -- orange (optional)
  - Distributed key-value store; the persistence backend for Kubernetes control plane state.
  - License: Data not available. Governance: CNCF.
  - Release provided by Debian, not upstream.
  - Gap: No upstream riscv64 CI; no riscv64 assets in v3.7.1 (July 2026). Debian sid ships etcd 3.5.30-2 with two riscv64-specific patches: [0002](https://sources.debian.org/src/etcd/3.5.30-2/debian/patches/0002-don-t-exit-on-unsupported-arch.patch/) removes a startup arch gate, and [0025](https://sources.debian.org/src/etcd/3.5.30-2/debian/patches/0025-Reduce-InitialMmapSize-on-32-bit-and-riscv64-archite.patch/) explicitly checks `runtime.GOARCH == "riscv64"` to reduce InitialMmapSize from 10 GB to 16 MB. These riscv64-specific patches in the downstream build prevent the yellow floor from applying. Upstream issue [#21509](https://github.com/etcd-io/etcd/issues/21509) was closed 2026-06-04 with maintainer confirmation that Prow has no riscv64 nodes.

- **Helm** -- yellow (optional)
  - Kubernetes package manager; used by all database operator deployment paths.
  - License: Data not available. Governance: CNCF.
  - Release provided by upstream.
  - Gap: Upstream cross-compiles via goreleaser and publishes riscv64 binaries at get.helm.sh for every release (v4.2.4 confirmed live 2026-08-13), but unit tests run only on ubuntu-latest (x86_64) with no riscv64 runner, QEMU emulation, or test execution on riscv64 in any workflow.

- **k0s** -- blue (optional)
  - Lightweight Kubernetes distribution; single-binary deployment.
  - License: Data not available. Governance: Mirantis.
  - Release provider: none (no riscv64 release binary).
  - Gap: [riscv64.yml](https://github.com/k0sproject/k0s/blob/main/.github/workflows/riscv64.yml) (merged 2026-06-19) runs genuine tests on native RISE Scaleway EM-RV1 runners: unit tests (make check-unit) and 2 smoke tests (basic + airgap), all confirmed passing. The latest release v1.36.3+k0s.2 (2026-08-12) publishes assets only for amd64, arm, and arm64 -- no riscv64 binary. Tests pass but upstream does not yet ship a riscv64 release.

- **k3s** -- orange (optional)
  - Lightweight Kubernetes distribution for edge and IoT use cases.
  - License: Data not available. Governance: Rancher Labs / SUSE.
  - Release provider: none.
  - Gap: v1.33.13+k3s2 has 16 assets with zero riscv64; the official installer aborts on riscv64; no CI workflow builds or tests riscv64. A manual build of v1.36.3+k3s1 succeeded in a RISC-V VM, but the cluster cannot start due to missing rancher/mirrored-pause and rancher/systemd-node riscv64 container images. Draft CI PR [#13854](https://github.com/k3s-io/k3s/pull/13854) remains unreviewed; PR #7778 was closed without merging on 2026-08-10.

- **Prometheus** -- yellow (optional)
  - Time-series metrics collection and alerting system; primary observability backend.
  - License: Data not available. Governance: CNCF.
  - Release provided by upstream.
  - Gap: The `build_all` job cross-compiles riscv64 via promu and publishes official riscv64 tarballs (since v2.46.0) and Docker images (since v3.10.0, latest v3.14.0). riscv64 is absent from the PR-level `build` job and all test jobs -- zero riscv64 or GOARCH=riscv64 entries in [ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml).

- **node_exporter** -- yellow (optional)
  - Hardware and OS metrics exporter for Prometheus.
  - License: Data not available. Governance: Prometheus community / CNCF.
  - Release provided by upstream.
  - Gap: riscv64 is built via `promu crossbuild` on an x86 ubuntu-latest runner with zero test execution. Upstream ships node_exporter-1.12.1.linux-riscv64.tar.gz and a Docker Hub riscv64 image. The test_go_arm job runs native ARM tests with no riscv64 equivalent.

- **OpenTelemetry Collector** -- yellow (optional)
  - Vendor-agnostic telemetry collection pipeline (traces, metrics, logs).
  - License: Data not available. Governance: CNCF / OpenTelemetry project.
  - Release provided by upstream.
  - Gap: The `cross-build-collector` job in [build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector/blob/main/.github/workflows/build-and-test.yml) cross-compiles `GOOS=linux GOARCH=riscv64` with no test step. [platform-support.md](https://github.com/open-telemetry/opentelemetry-collector/blob/main/docs/platform-support.md) explicitly designates riscv64 as Tier 3 ("guaranteed to build -- binaries not tested at all"). Upstream publishes riscv64 release artifacts (tarball, .deb, .rpm, Docker multi-arch) confirmed in v0.159.0.

- **Grafana** -- yellow (optional)
  - Visualization and dashboarding platform for Prometheus and other data sources.
  - License: Data not available. Governance: Grafana Labs.
  - Release provided by Alpine Linux (community package).
  - Gap: [release-build.yml](https://github.com/grafana/grafana/blob/main/.github/workflows/release-build.yml) includes riscv64 in the build matrix with `allow-failure: true` and `continue-on-error`; riscv64 is absent from the PR pre-merge gate (build-go-matrix.yml). No riscv64 upstream release artifact (v13.2.0 confirmed); only Alpine Linux edge/community ships grafana 12.4.4-r1 for riscv64.

- **Grafana Alloy** -- orange (optional)
  - OpenTelemetry-native successor to Grafana Agent; telemetry pipeline.
  - License: Data not available. Governance: Grafana Labs.
  - Release provider: none.
  - Gap: [build.yml CI matrix](https://github.com/grafana/alloy/blob/main/.github/workflows/build.yml) lists only amd64, arm64, ppc64le, s390x. Latest release v1.19.2 (2026-08-26) has zero riscv64 artifacts. Issue [#1036](https://github.com/grafana/alloy/issues/1036) was closed as not_planned; PR [#1526](https://github.com/grafana/alloy/pull/1526) closed unmerged.

**Pipeline chains and alternate paths:**

Kubernetes orchestration stack: containerd -> runc -> Kubernetes -> etcd (control plane) -> (Helm for deployments)

Database operator paths: Helm -> (Zalando postgres-operator / mariadb-operator / MySQL Operator for Kubernetes / Percona Operator for MySQL / Redis Operator) -> (PostgreSQL / MariaDB / MySQL / Redis)

Metrics pipeline: (Prometheus node_exporter / postgres_exporter / mysqld_exporter / redis_exporter / memcached_exporter) -> Prometheus -> Grafana

Telemetry pipeline: OpenTelemetry Collector -> Grafana Alloy -> Grafana

### Layer 5 -- System Libraries

- **OpenSSL** -- blue (critical)
  - The reference TLS/crypto library; used by every database engine and driver in this vertical.
  - License: Data not available. Governance: OpenSSL Foundation / OpenSSL Management Committee.
  - Release provided by Debian (and Ubuntu, Arch Linux RISC-V), not upstream.
  - Gap: Upstream CI [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml) runs `make all tests` on every push via qemu-user (minus test_afalg). Upstream ships source-only tarballs; distros provide riscv64 binaries. Note: Zvkned (AES vector crypto) is part of the RVA23U64 baseline but the degree to which OpenSSL dispatches to Zvkned instructions versus software AES is not captured in this record.

- **BoringSSL** -- yellow (optional)
  - Google's TLS/crypto fork; used by some database clients and proxies.
  - License: Data not available. Governance: Google.
  - Release provider: none (no upstream binary releases for any architecture).
  - Gap: Two mandatory CQ-gated LUCI builders (android_riscv64_compile_only, android_riscv64_prefixed_compile) cross-compile on every commit but both have `run_unit_tests: false` and `run_ssl_tests: false`, confirmed in [cr-buildbucket.cfg](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/cr-buildbucket.cfg). No binary releases for any architecture; build-only CI.

- **zlib** -- blue (critical)
  - Reference DEFLATE compression library; used by PostgreSQL WAL, MySQL binlog, and wire protocols.
  - License: Data not available. Governance: Mark Adler / Jean-loup Gailly.
  - Release provided by Ubuntu (and Debian), not upstream.
  - Gap: Upstream CI [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) runs both build and `ctest` for riscv64 (OpenBSD/riscv64 via QEMU). Upstream ships source-only releases.

- **zlib-ng** -- blue (optional)
  - Performance-optimized zlib replacement with RVV 1.0 SIMD paths.
  - License: Data not available. Governance: zlib-ng community.
  - Release provided by Alpine Linux, not upstream.
  - RISC-V-specific implementations exist in arch/riscv/ for all primary hot paths (adler32, chunkset/inflate_fast, compare256/longest_match, slide_hash via RVV; crc32 via Zbc). Upstream CI runs `ctest --verbose` on GCC and Clang riscv64 jobs (QEMU).

- **LZ4** -- yellow (critical)
  - Fast lossless compression algorithm; used by PostgreSQL (pg_lz4), ClickHouse, Kafka, and Redis RDB.
  - License: Data not available. Governance: Yann Collet / Facebook.
  - Release provided by Ubuntu (and Debian), not upstream.
  - Gap: CI [cross-platform.yml](https://github.com/lz4/lz4/blob/dev/.github/workflows/cross-platform.yml) runs a live compress/decompress pipeline under qemu-riscv64-static, giving a primary blue grade. However, `LZ4_FAST_DEC_LOOP` remains disabled on riscv64 (lz4.c lines 479-485); all five RVV/FAST_DEC_LOOP PRs (#1678, #1686, #1734, #1738, #1739) remain open and unmerged as of 2026-08-27. Optimization level is minimal, capping to yellow against the RVA23U64 baseline.

- **zstd** -- yellow (critical)
  - Zstandard compression algorithm; used by PostgreSQL WAL compression, RocksDB, MariaDB, and Kafka.
  - License: Data not available. Governance: Meta / Zstandard community.
  - Release provided by Debian, not upstream.
  - Gap: CI [dev-short-tests.yml](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml) runs full test suite at rv64gc baseline and with RVV at vlen=128/256/512. However, the Huffman decompression 4-way loop (`HUF_4X2_4WAY`) remains disabled on riscv64 (PR [#4622](https://github.com/facebook/zstd/pull/4622) open, unreviewed); sequence decode fast path falls to scalar C (PR [#4557](https://github.com/facebook/zstd/pull/4557) open since 2025-12-22); Zicclsm unaligned optimization absent (PR [#4596](https://github.com/facebook/zstd/pull/4596) stalled). Gaps cover primary Huffman decompression and compression throughput hot paths.

- **snappy** -- yellow (optional)
  - Snappy compression algorithm; used by RocksDB (MyRocks) and LevelDB-family stores.
  - License: Data not available. Governance: Google.
  - Release provided by Ubuntu, not upstream.
  - Gap: CI [riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml) runs `make test` via QEMU on every push. However, the V128 byte-shuffle decompression fast path (SSSE3/NEON on amd64/arm64) and CRC32 hash have no riscv64 equivalents; riscv64-specific code covers secondary paths only (RVV MemCopy64, Zicond AdvanceToNextTag, 64-bit FindMatchLength, Zbb ctzll). PR #233 (RVV FindMatchLength) was closed without merge; PR #235 (RVV short-memcpy) remains open.

- **jemalloc** -- orange (critical)
  - General-purpose allocator used by default in Redis and optionally in PostgreSQL and MariaDB.
  - License: Data not available. Governance: jemalloc contributors / community.
  - Release provided by Debian, not upstream.
  - Gap: Zero riscv64 CI across all six workflow files (confirmed live). Debian ships libjemalloc2 5.3.1-2 for riscv64 from unpatched upstream source (yellow floor). However, jemalloc's primary performance differentiator -- spin-wait/pause in the lock-free path -- is absent on riscv64: HAVE_CPU_SPINWAIT=0 is set by configure.ac for riscv64 while amd64 and arm64 both receive hardware pause/isb hints; zero RVV intrinsics or RISC-V assembly in the codebase. Absent-optimization cap holds the color at orange, overriding the yellow distro floor.

- **tcmalloc** -- orange (optional)
  - Google's thread-caching allocator; used by some MySQL builds and gRPC paths.
  - License: Data not available. Governance: Google.
  - Release provider: none.
  - Gap: No riscv64 CI. The primary performance differentiator -- the per-CPU RSEQ slab (TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM = 0 on riscv64, no percpu_rseq_riscv.S) -- is entirely absent, leaving only the slower per-thread fallback. Absent-optimization cap applies.

- **PCRE2** -- blue (critical)
  - Perl-compatible regular expressions library; used by PostgreSQL, MariaDB, and MySQL.
  - License: Data not available. Governance: PCRE2 Project / University of Cambridge.
  - Release provided by Debian (and Ubuntu), not upstream.
  - Gap: The `ptarmigan` job in [dev.yml](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml) runs `ctest -j$(nproc) --output-on-failure` in a QEMU riscv64 container on every push to main (updated 2026-08-09). Upstream ships source-only releases.

- **ICU** -- yellow (critical)
  - Unicode and internationalization support library; required by PostgreSQL, MySQL, and MariaDB.
  - License: Data not available. Governance: Unicode Consortium.
  - Release provided by Debian, not upstream.
  - Gap: Zero riscv64 CI across all six major workflow files. Debian sid ships libicu78 78.3-2 for riscv64 with no riscv64-specific patches. ICU is pure scalar C++ with no SIMD for any architecture, so no optimization gap applies.

- **libevent** -- yellow (critical)
  - Event notification library; used by Memcached as its I/O backend.
  - License: Data not available. Governance: libevent contributors.
  - Release provided by Debian (and Ubuntu), not upstream.
  - Gap: All four upstream CI workflow files contain zero riscv64 or QEMU references. Debian sid ships libevent 2.1.13-stable-1 from unmodified upstream source; both packaging patches are fully architecture-agnostic.

- **liburing** -- yellow (optional)
  - Linux io_uring library; used by database engines for async I/O on Linux kernels >= 5.1.
  - License: Data not available. Governance: Jens Axboe / community.
  - Release provider: none (all GitHub releases are source-only archives).
  - Gap: [ci.yml](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml) cross-compiles using gcc-riscv64-linux-gnu and compiles test_build.c against the installed library, but never executes the produced binary or calls `make test`. Build-only CI with no test execution for any architecture.

- **libnuma** -- blue (optional)
  - NUMA topology and memory policy library; used by PostgreSQL and MySQL for NUMA-aware allocation.
  - License: Data not available. Governance: numactl / community.
  - Release provided by Debian, not upstream.
  - Gap: No upstream riscv64 CI; latest release v2.0.19 ships source-only. All NUMA syscalls resolve via generic kernel headers -- no riscv64-specific patches required. Debian sid ships libnuma1 2.0.19-1+b2 built on physical RISC-V hardware (rv-osuosl-03); Ubuntu 24.04 also ships libnuma-dev for riscv64.


- **Protocol Buffers** -- yellow (optional)
  - Serialization library; used by database gRPC interfaces and operator-to-engine communication.
  - License: Data not available. Governance: Google.
  - Release provided by Ubuntu, not upstream.
  - Gap: Zero riscv64 CI across all 26 workflow files; latest release v36.0 includes no riscv64 protoc binary. Ubuntu 24.04 ships libprotobuf-dev 3.21.12 for riscv64 from unmodified upstream source (34 Debian patches contain no riscv64-specific changes).

- **Lua** -- yellow (optional)
  - Scripting language; used by Redis (server-side scripts), Memcached (mcscript), and Nginx (lua-nginx-module).
  - License: Data not available. Governance: PUC-Rio.
  - Release provided by Ubuntu, not upstream.
  - Gap: Pure ISO C99 with no architecture-specific code or CI for any architecture. Ubuntu 24.04 ships lua5.4 5.4.6-3build2 for riscv64; Debian packaging contains only two non-arch-specific patches.

- **xxHash** -- blue (optional)
  - Extremely fast non-cryptographic hash; used by RocksDB, LZ4, and zstd.
  - License: Data not available. Governance: Yann Collet.
  - Release provided by upstream.
  - Gap: Upstream CI [ci.yml](https://github.com/Cyan4973/xxHash/blob/dev/.github/workflows/ci.yml) runs `make check` plus RVV consistency checks at vlen 128/256/512 under qemu-riscv64-static. The RVV backend fully covers all three XXH3 primary hot paths (XXH3_accumulate_512_rvv, XXH3_scrambleAcc_rvv, XXH3_initCustomSecret_rvv) with adaptive-vlen RVV intrinsics. No riscv64 binary published upstream; upstream provides Windows binaries only (xxhsum_win64).

- **glibc** -- yellow (critical)
  - The GNU C Library; the system runtime for all native database binaries on Linux.
  - License: Data not available. Governance: Free Software Foundation / GNU Project.
  - Release provided by Debian, not upstream.
  - Gap: Both Sourceware Buildbot riscv64 builders (#293, #336) are confirmed offline via live API check, with all recent runs reporting failure. No passing upstream CI exists for riscv64. Debian sid ships libc6 2.43-4 for riscv64 with no riscv64-specific patches (confirmed at [sources.debian.org](https://sources.debian.org/patches/glibc/2.43-4/)), qualifying for the yellow floor.

- **libmvec** -- orange (optional)
  - SIMD-accelerated vectorized math library (part of glibc); used by analytics and ML workloads alongside database engines.
  - License: Data not available. Governance: Free Software Foundation / GNU Project.
  - Release provider: none.
  - Gap: libmvec does not exist for riscv64 in upstream glibc -- no sysdeps configure fragment sets `build_mathvec=yes` for RISC-V, so the library is never compiled for riscv64. No Linux distribution ships a riscv64 libmvec package (Debian, Ubuntu, Arch RISC-V, Fedora all confirmed absent). The psABI PR #455 (name mangling, merged 2026-06-18) removes one blocker, but no new glibc patch series has been submitted for July/August 2026 per the libc-alpha archive.

**Pipeline chains and alternate paths:**

Crypto layer: OpenSSL (or BoringSSL) -> all database wire-protocol TLS paths

Compression layer: zlib -> zlib-ng (drop-in replacement) -> PostgreSQL/MySQL/MariaDB WAL and wire compression

Fast compression: LZ4 -> zstd -> RocksDB -> MyRocks -> MariaDB (storage engine path)

Allocator layer: glibc malloc (default) / jemalloc (Redis, optional PostgreSQL/MariaDB) / tcmalloc (some MySQL builds)

System runtime: glibc -> libmvec -> all native database binaries

---

## Artifact 2: Status tables

### (a) Full table

| Node | Layer | Criticality | Color | Release provider | Justification summary | Primary source | As-of | Delta vs report |
|------|-------|-------------|-------|------------------|-----------------------|----------------|-------|-----------------|
| libpq | PostgreSQL -- Client Drivers | critical | blue | Ubuntu | Build Farm: 3 active riscv64 workers, last run 2026-08-26, all passing; no GitHub Actions riscv64 jobs; distros provide binaries | [buildfarm.postgresql.org](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64) | 2026-08-27 | none |
| psycopg | PostgreSQL -- Client Drivers | optional | green | upstream | py3-none-any wheel (pure Python) + riscv64 binary wheels on PyPI; CI tests via QEMU weekly | [packages-bin.yml](https://github.com/psycopg/psycopg/blob/master/.github/workflows/packages-bin.yml) | 2026-08-14 | none |
| pgx | PostgreSQL -- Client Drivers | optional | green | upstream | Pure Go, no assembly, no CGo; runs on linux/riscv64 by construction via Go toolchain | [ci.yml](https://github.com/jackc/pgx/blob/master/.github/workflows/ci.yml) | 2026-06-17 | none |
| pgjdbc | PostgreSQL -- Client Drivers | optional | green | upstream | Pure-Java Type 4 JDBC; single arch-independent JAR on Maven Central | [REL42.7.13 release](https://github.com/pgjdbc/pgjdbc/releases/tag/REL42.7.13) | 2026-06-17 | none |
| PostgreSQL | PostgreSQL -- Database Engine | critical | blue | Debian | Build Farm: 4 active riscv64 workers on master through REL_13_STABLE; zero GitHub Actions riscv64 jobs; source-only upstream tarballs | [buildfarm.postgresql.org](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64) | 2026-06-17 | none |
| pgvector | PostgreSQL -- Extensions, Clustering & Proxies | optional | yellow | Ubuntu | Zero riscv64 CI; Ubuntu 24.04 ships 0.6.0, Debian sid ships 0.8.6, unpatched upstream; scalar fallback fully functional | [build.yml](https://github.com/pgvector/pgvector/blob/master/.github/workflows/build.yml) | 2026-06-17 | Corrected from orange (optimization-absent) to yellow (clean-distro-build): HNSW/IVFFlat fully functional on scalar |
| PostGIS | PostgreSQL -- Extensions, Clustering & Proxies | optional | yellow | Debian | Zero riscv64 CI; Woodpecker covers arm64/armhf/s390x but not riscv64; Debian sid 3.6.4+dfsg-2, no riscv64 patches | [portability.yml](https://github.com/postgis/postgis/blob/master/.woodpecker/portability.yml) | 2026-06-17 | none |
| TimescaleDB | PostgreSQL -- Extensions, Clustering & Proxies | optional | yellow | Debian | Zero riscv64 CI; upstream releases Windows amd64 only; Debian sid 2.29.2+dfsg-1 ships riscv64, single non-arch patch | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=timescaledb&suite=sid) | 2026-08-27 | n/a (new entry) |
| Apache AGE | PostgreSQL -- Extensions, Clustering & Proxies | optional | yellow | Debian | All 5 upstream workflows x86_64 only; Debian ships postgresql-18-age 1.8.0~rc0-2 for riscv64, no arch-specific patches | [FTP-master madison API](https://api.ftp-master.debian.org/madison?package=postgresql-18-age&f=json) | 2026-06-17 | none |
| Citus | PostgreSQL -- Extensions, Clustering & Proxies | optional | orange | none | All 7 workflows x86_64 only; no riscv64 package in any downstream distro or PGDG | [citusdata/citus workflows](https://github.com/citusdata/citus/tree/main/.github/workflows) | 2026-06-17 | color_case corrected: no distro ships riscv64, so downstream-only sub-type does not apply |
| Patroni | PostgreSQL -- Extensions, Clustering & Proxies | optional | green | upstream | Pure Python; py3-none-any wheel on PyPI v4.1.5; runs on riscv64 by construction | [PyPI patroni](https://pypi.org/pypi/patroni/json) | 2026-06-17 | none |
| PgBouncer | PostgreSQL -- Extensions, Clustering & Proxies | optional | yellow | Ubuntu | No riscv64 CI upstream; Debian ships 1.25.2-1 (rv-osuosl-01); no riscv64-specific packaging patches | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=pgbouncer&suite=sid) | 2026-08-14 | none |
| Pgpool-II | PostgreSQL -- Extensions, Clustering & Proxies | optional | yellow | Debian | No upstream CI of any kind; Debian sid ships pgpool2 4.7.2-1 (rv-manda-04); single generic config patch | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=pgpool2&suite=sid) | 2026-08-14 | none |
| pgcat | PostgreSQL -- Extensions, Clustering & Proxies | optional | red | none | ring 0.16 build-blocking dependency (riscv64 support added in 0.17); upgrade PR #881 open unmerged; no CI, no distro packages | [Cargo.toml](https://github.com/postgresml/pgcat/blob/main/Cargo.toml) | 2026-06-17 | none |
| MariaDB Connector/C | MySQL -- Client Drivers | optional | yellow | Ubuntu | No riscv64 CI; Ubuntu noble ships libmariadb3 riscv64; connector builds from unmodified upstream source | [ci.yml (branch 3.4)](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.github/workflows/ci.yml) | 2026-06-17 | none |
| go-sql-driver/mysql | MySQL -- Client Drivers | optional | green | upstream | Pure Go, no assembly/CGo; runs on linux/riscv64 by construction | [repository](https://github.com/go-sql-driver/mysql) | 2026-06-17 | none |
| MySQL | MySQL -- Database Engine | critical | orange | Debian (Ubuntu) | No upstream riscv64 CI; Ubuntu 24.04 ships 8.0.36 with use-largest-lock-free-type-selector-on-riscv.patch; Debian sid removed 8.0; mysql-9.7 missing riscv64 build | [Ubuntu Noble patches](https://git.launchpad.net/ubuntu/+source/mysql-8.0/tree/debian/patches?h=ubuntu/noble) | 2026-06-17 | Debian removed mysql-8.0 2026-07-23; mysql-9.7 missing riscv64 build in Debian tracker; Oracle added .github/workflows but zero riscv64 jobs |
| Vitess | MySQL -- Extensions, Clustering & Proxies | optional | orange | none | No riscv64 CI across ~49 workflows; release v24.0.2 ships only amd64/x86_64; no distro packages | [unit_test.yml](https://github.com/vitessio/vitess/blob/main/.github/workflows/unit_test.yml) | 2026-08-27 | n/a (new entry) |
| ProxySQL | MySQL -- Extensions, Clustering & Proxies | optional | orange | none | No riscv64 CI; v3.0.11 ships only x86_64/aarch64; coredumper unconditional dep; jemalloc 5.2.0 rejects riscv64gc triple | [v3.0.11 release](https://github.com/sysown/proxysql/releases/tag/v3.0.11) | 2026-08-14 | none |
| MariaDB Connector/C | MariaDB -- Client Drivers | optional | yellow | Ubuntu | Same project as MySQL layer entry; Ubuntu noble ships libmariadb3; connector builds from unmodified upstream source | [ci.yml (branch 3.4)](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.github/workflows/ci.yml) | 2026-08-27 | none |
| go-sql-driver/mysql | MariaDB -- Client Drivers | optional | green | upstream | Same project as MySQL layer entry; pure Go; runs on linux/riscv64 by construction | [test.yml](https://github.com/go-sql-driver/mysql/blob/master/.github/workflows/test.yml) | 2026-08-27 | none |
| MariaDB | MariaDB -- Database Engine | critical | yellow | Debian | Zero riscv64 CI (.gitlab-ci.yml 564 lines, zero riscv refs); all 17 Debian patches lack riscv64-specific changes; RocksDB plugin disabled on riscv64 | [.gitlab-ci.yml](https://github.com/MariaDB/server/blob/main/.gitlab-ci.yml) | 2026-06-17 | none |
| RocksDB | MariaDB -- Extensions, Clustering & Proxies | optional | orange | Debian | Zero riscv64 CI; Debian carries patch removing build-blocking #error in toku_time.h; upstream PR #14530 open unmerged | [pr-jobs.yml](https://github.com/facebook/rocksdb/blob/main/.github/workflows/pr-jobs.yml) | 2026-06-17 | none |
| MyRocks | MariaDB -- Extensions, Clustering & Proxies | optional | orange | Debian | No upstream riscv64 CI; MDEV-29875 open/critical (jemalloc mm_malloc.h scope issue); Debian carries riscv64-specific workaround patches | [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) | 2022-10-26 | none |
| MariaDB ColumnStore | MariaDB -- Extensions, Clustering & Proxies | optional | red | none | .drone.jsonnet targets only amd64 and arm64; not packaged in Debian, Ubuntu, or Arch Linux RISC-V; no known riscv64 build attempt | [.drone.jsonnet](https://github.com/mariadb-corporation/mariadb-columnstore-engine/blob/develop/.drone.jsonnet) | 2026-08-27 | n/a (new entry) |
| Galera Cluster | MariaDB -- Extensions, Clustering & Proxies | optional | yellow | Debian | Upstream CI x86 only; Debian sid ships galera-4 26.4.27-1 (rv-manda-02, 2026-08-10); no riscv64-specific patch applied | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=galera-4&suite=sid) | 2026-08-14 | none |
| MaxScale | MariaDB -- Extensions, Clustering & Proxies | optional | orange | none | No CI of any kind (.github/ has only dependabot.yml); no riscv64 binary from any channel | [.github/ directory](https://github.com/mariadb-corporation/MaxScale/tree/24.02/.github) | 2026-08-14 | none |
| hiredis | Redis -- Client Drivers | critical | yellow | Ubuntu | CI covers x86/arm/aarch64 but no riscv64 job; Debian sid 1.2.0-6+b4 (rv-osuosl-02), no riscv64 patches | [test.yml](https://github.com/redis/hiredis/blob/master/.github/workflows/test.yml) | 2026-08-27 | n/a (new entry) |
| Redis | Redis -- Database Engine | critical | orange | Debian | Zero riscv64 references across all 9 upstream CI workflows; Debian sid ships 5:8.0.6-2; PRs #15204 (Zbb popcount) and #15273 (HyperLogLog RVV) unreviewed since May 2026 | [ci.yml](https://github.com/redis/redis/blob/unstable/.github/workflows/ci.yml) | 2026-06-17 | none |
| Valkey | Redis -- Database Engine | optional | orange | Debian | CI covers x86_64, x86-32, macOS ARM64 only; no riscv64 runner or QEMU job; no upstream release binary assets; Debian sid ships valkey-server 9.1.1-1 for riscv64 | [ci.yml](https://github.com/valkey-io/valkey/blob/unstable/.github/workflows/ci.yml) | 2026-08-27 | n/a (new entry) |
| KeyDB | Redis -- Database Engine | optional | orange | none | CI covers ubuntu-latest/ubuntu-20.04/macos-latest/libc-malloc only; empty release assets; no distro packages; manually buildable per community report | [ci.yml](https://github.com/Snapchat/KeyDB/blob/main/.github/workflows/ci.yml) | 2026-08-27 | none |
| Dragonfly | Redis -- Database Engine | optional | orange | none | Zero riscv64 CI across 20 workflows; no riscv64 assets in releases v1.38.0-v1.40.1; FATAL_ERROR in helio/cmake/internal.cmake requires manual CMake override | [ci.yml](https://github.com/dragonflydb/dragonfly/blob/main/.github/workflows/ci.yml) | 2026-08-27 | color_case corrected from downstream-only to empty: no distro ships Dragonfly for riscv64 |
| RediSearch | Redis -- Extensions, Clustering & Proxies | optional | orange | Ubuntu | No riscv64 CI; Ubuntu ships v1.2.2 (7 major versions behind upstream 2.10.x); VectorSimilarity has no riscv64 cmake flags | [generate-matrix.yml](https://github.com/RediSearch/RediSearch/blob/master/.github/workflows/generate-matrix.yml) | 2026-06-17 | none |
| RedisJSON | Redis -- Extensions, Clustering & Proxies | optional | orange | none | No riscv64 CI; no release artifacts; bindgen pin resolved (upgraded to 0.66.1 in 2025-12-30) -- no confirmed current breakage | [Cargo.lock](https://github.com/RedisJSON/RedisJSON/blob/master/Cargo.lock) | 2025-12-30 | Corrected from red to orange: bindgen upgraded to 0.66.1, resolving the riscv64gc triple-recognition failure |
| RedisBloom | Redis -- Extensions, Clustering & Proxies | optional | red | none | Makefile contains explicit $(error) for any arch other than x64/arm64v8; deprecated since Redis 8 GA (May 2025) | [Makefile](https://github.com/RedisBloom/RedisBloom/blob/master/Makefile) | 2026-08-27 | none |
| RedisTimeSeries | Redis -- Extensions, Clustering & Proxies | optional | red | none | Makefile contains hard $(error) on riscv64; vendored cpu_features v0.6.0 emits CMake FATAL_ERROR for riscv64; effectively archived | [Makefile](https://github.com/RedisTimeSeries/RedisTimeSeries/blob/master/Makefile) | 2026-06-17 | none |
| Memcached | Memcached -- Database Engine | critical | yellow | Debian | Upstream CI single x86_64-only job; Debian sid 1.6.45-1 (rv-osuosl-03); all packaging patches generic | [buildd.debian.org](https://buildd.debian.org/status/package.php?p=memcached&suite=sid) | 2026-06-17 | Debian sid updated to 1.6.45-1 from 1.6.42-1; PR #1291 (unaligned access) closed without merging |
| mcrouter | Memcached -- Extensions, Clustering & Proxies | optional | red | none | mcrouter/lib/Clocks.cpp hits #error Unsupported CPU at compile time; folly has two open riscv64 build failures (#2493, #2416) | [Clocks.cpp](https://github.com/facebook/mcrouter/blob/main/mcrouter/lib/Clocks.cpp) | 2026-06-17 | none |
| Kubernetes | Orchestration & Observability | optional | yellow | Debian | No upstream riscv64 CI (zero Prow riscv64 nodes confirmed); no upstream release binaries; Debian sid kubectl 1.33.4+ds-1, no riscv64-specific patches; open PR #141291 (pause image, on hold) | [Debian patches](https://sources.debian.org/patches/kubernetes/1.33.4+ds-1/) | 2026-06-17 | Report assigned orange/downstream-only; corrected to yellow/clean-distro-build: neither Debian patch is riscv64-specific |
| containerd | Orchestration & Observability | optional | yellow | upstream | Nightly CI cross-compiles riscv64; ships riscv64 tarballs in every release; integration test workflow has zero riscv64 entries; PR #13124 unmerged | [nightly.yml](https://github.com/containerd/containerd/blob/main/.github/workflows/nightly.yml) | 2026-08-08 | none |
| runc | Orchestration & Observability | optional | yellow | upstream | Publishes signed runc.riscv64 in every release (v1.5.1 confirmed); zero riscv64 occurrences in all three CI workflow files | [test.yml](https://github.com/opencontainers/runc/blob/main/.github/workflows/test.yml) | 2026-06-17 | color_case corrected from clean-distro-build to build-only-ci; v1.5.1 is new latest |
| etcd | Orchestration & Observability | optional | orange | Debian | No upstream riscv64 CI; no riscv64 assets in v3.7.1 (July 2026); Debian carries two riscv64-specific patches (startup gate removal; InitialMmapSize reduction from 10 GB to 16 MB) | [Debian patches](https://sources.debian.org/src/etcd/3.5.30-2/debian/patches/) | 2026-06-17 | Two riscv64-specific Debian patches confirmed; issue #21509 closed 2026-06-04 (Prow has no riscv64 nodes) |
| Helm | Orchestration & Observability | optional | yellow | upstream | goreleaser cross-compiles riscv64 and publishes at get.helm.sh for every release (v4.2.4); unit tests run x86_64 only | [release.yml](https://github.com/helm/helm/blob/main/.github/workflows/release.yml) | 2026-06-17 | none |
| k0s | Orchestration & Observability | optional | blue | none | riscv64.yml runs unit tests + 2 smoke tests on native RISE Scaleway EM-RV1 runners, all passing; release v1.36.3+k0s.2 ships no riscv64 binary | [riscv64.yml](https://github.com/k0sproject/k0s/blob/main/.github/workflows/riscv64.yml) | 2026-06-17 | none |
| k3s | Orchestration & Observability | optional | orange | none | No CI riscv64 build; v1.33.13+k3s2 has zero riscv64 assets; cluster cannot start due to missing container images; PR #7778 closed 2026-08-10 without merging | [v1.33.13+k3s2 release](https://github.com/k3s-io/k3s/releases/tag/v1.33.13%2Bk3s2) | 2026-08-27 | PR #7778 closed without merging; riscv64 added to Makefile multiarch-binary; cluster still blocked on container images |
| CloudNativePG | Orchestration & Observability | optional | red | none | continuous-delivery.yml hard-codes PLATFORMS: "linux/amd64,linux/arm64"; v1.30.0 releases cover x86_64/arm64/ppc64le/s390x only; zero riscv64 issues or PRs | [continuous-delivery.yml](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/.github/workflows/continuous-delivery.yml) | 2026-08-27 | n/a (new entry) |
| Zalando postgres-operator | Orchestration & Observability | optional | orange | none | All CI workflows run ubuntu-latest; platforms: linux/amd64,linux/arm64 hard-coded; no riscv64 in any release or distro | [publish_ghcr_image.yaml](https://github.com/zalando/postgres-operator/blob/master/.github/workflows/publish_ghcr_image.yaml) | 2026-08-27 | n/a (new entry) |
| Percona Operator for MySQL | Orchestration & Observability | optional | orange | none | CI builds only linux/arm64 and linux/amd64; no riscv64 Docker image on Docker Hub | [scan.yml](https://github.com/percona/percona-server-mysql-operator/blob/main/.github/workflows/scan.yml) | 2026-08-27 | none |
| MySQL Operator for Kubernetes | Orchestration & Observability | optional | orange | none | build.sh contains ^(amd64|arm64)$ guard that rejects riscv64 with exit 1; no .github/workflows directory | [build.sh](https://github.com/mysql/mysql-operator/blob/trunk/build.sh) | 2026-06-17 | none |
| mariadb-operator | Orchestration & Observability | optional | orange | none | .goreleaser.yml lists goarch: [amd64, arm64] only; latest release v26.6.0 has only linux_amd64 and linux_arm64 tarballs | [.goreleaser.yml](https://github.com/mariadb-operator/mariadb-operator/blob/main/.goreleaser.yml) | 2026-06-17 | none |
| Redis Operator (OT-CONTAINER-KIT) | Orchestration & Observability | optional | orange | none | publish-image.yaml hard-codes platforms: linux/amd64,linux/arm64; ci.yaml builds only amd64/arm64 | [publish-image.yaml](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/publish-image.yaml) | 2026-08-14 | none |
| Prometheus | Orchestration & Observability | optional | yellow | upstream | build_all job cross-compiles riscv64 and publishes tarballs (since v2.46.0) and Docker images (since v3.10.0); zero riscv64 entries in any test job | [ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml) | 2026-06-17 | none |
| node_exporter | Orchestration & Observability | optional | yellow | upstream | promu crossbuild on x86, zero test execution; ships node_exporter-1.12.1.linux-riscv64.tar.gz | [ci.yml](https://github.com/prometheus/node_exporter/blob/master/.github/workflows/ci.yml) | 2026-06-17 | none |
| postgres_exporter | Orchestration & Observability | optional | yellow | upstream | promci/build cross-compiles; test_go and integration_tests run x86_64 only; ships postgres_exporter-0.20.1.linux-riscv64.tar.gz | [ci.yml](https://github.com/prometheus-community/postgres_exporter/blob/main/.github/workflows/ci.yml) | 2026-08-14 | none |
| mysqld_exporter | Orchestration & Observability | optional | yellow | upstream | test_go on ubuntu-latest only; promci/build cross-compiles; ships mysqld_exporter-0.20.0.linux-riscv64.tar.gz | [ci.yml](https://github.com/prometheus/mysqld_exporter/blob/main/.github/workflows/ci.yml) | 2026-06-17 | none |
| redis_exporter | Orchestration & Observability | optional | orange | none | v1.90.0 ships 23 Linux arch assets; riscv64 absent from all; no CI references; pure Go but upstream has never shipped riscv64 binary | [v1.90.0 release](https://github.com/oliver006/redis_exporter/releases/tag/v1.90.0) | 2026-08-27 | Report cited v1.89.0; v1.90.0 confirmed consistent |
| memcached_exporter | Orchestration & Observability | optional | yellow | upstream | promci/build cross-compiles; test_go on amd64 only; ships memcached_exporter-0.17.0.linux-riscv64.tar.gz | [ci.yml](https://github.com/prometheus/memcached_exporter/blob/master/.github/workflows/ci.yml) | 2026-08-14 | none |
| OpenTelemetry Collector | Orchestration & Observability | optional | yellow | upstream | cross-build-collector job cross-compiles with no test step; Tier 3 platform per platform-support.md; publishes riscv64 tarball/.deb/.rpm/Docker in v0.159.0 | [build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector/blob/main/.github/workflows/build-and-test.yml) | 2026-06-17 | none |
| Grafana | Orchestration & Observability | optional | yellow | Alpine Linux | release-build.yml includes riscv64 with allow-failure: true; absent from PR gate; no upstream release artifact; Alpine edge ships grafana 12.4.4-r1 | [release-build.yml](https://github.com/grafana/grafana/blob/main/.github/workflows/release-build.yml) | 2026-08-14 | none |
| Grafana Alloy | Orchestration & Observability | optional | orange | none | build.yml lists only amd64/arm64/ppc64le/s390x; v1.19.2 (2026-08-26) has zero riscv64 assets; issue #1036 closed not_planned; PR #1526 closed unmerged | [build.yml](https://github.com/grafana/alloy/blob/main/.github/workflows/build.yml) | 2026-08-26 | none |
| OpenSSL | System Libraries | critical | blue | Debian | cross-compiles.yml runs `make all tests` via qemu-user on every push; source-only upstream tarballs | [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml) | 2026-06-17 | Optimization modifier does not apply; blue from release-provider rule alone |
| BoringSSL | System Libraries | optional | yellow | none | CQ-gated LUCI builders cross-compile on every commit with run_unit_tests: false and run_ssl_tests: false; no binary releases | [cr-buildbucket.cfg](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/cr-buildbucket.cfg) | 2026-06-17 | none |
| zlib | System Libraries | critical | blue | Ubuntu | others.yml runs both cmake --build and ctest for riscv64 (OpenBSD/riscv64 via QEMU); source-only upstream releases | [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) | 2026-06-17 | none |
| zlib-ng | System Libraries | optional | blue | Alpine Linux | cmake.yml and configure.yml run ctest/make test on QEMU riscv64 (GCC + Clang); RVV paths in arch/riscv/ for all primary hot paths | [cmake.yml](https://github.com/zlib-ng/zlib-ng/blob/develop/.github/workflows/cmake.yml) | 2026-06-17 | none |
| LZ4 | System Libraries | critical | yellow | Ubuntu | CI runs live compress/decompress under qemu-riscv64-static; LZ4_FAST_DEC_LOOP disabled; 5 RVV PRs open unmerged; optimization level minimal | [cross-platform.yml](https://github.com/lz4/lz4/blob/dev/.github/workflows/cross-platform.yml) | 2026-08-27 | none |
| zstd | System Libraries | critical | yellow | Debian | CI runs full test suite at rv64gc and with RVV vlen=128/256/512; Huffman 4-way loop disabled (PR #4622 open); sequence decode scalar fallback (PR #4557 open); Zicclsm absent (PR #4596 open) | [dev-short-tests.yml](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml) | 2026-06-17 | none |
| snappy | System Libraries | optional | yellow | Ubuntu | CI runs `make test` via QEMU on every push; V128 byte-shuffle decompression fast path absent; CRC32 hash has no riscv64 equivalent; PR #233 closed without merge | [riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml) | 2026-06-17 | none |
| jemalloc | System Libraries | critical | orange | Debian | Zero riscv64 CI; Debian ships 5.3.1-2 from unpatched source; HAVE_CPU_SPINWAIT=0 on riscv64; zero RVV/RISC-V assembly; absent-optimization cap overrides yellow distro floor | [linux-ci.yml](https://github.com/jemalloc/jemalloc/blob/dev/.github/workflows/linux-ci.yml) | 2026-06-17 | none |
| tcmalloc | System Libraries | optional | orange | none | No riscv64 CI; TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM=0 on riscv64; per-CPU RSEQ slab entirely absent; only slower per-thread fallback available | [percpu.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h) | 2026-06-17 | none |
| PCRE2 | System Libraries | critical | blue | Debian | dev.yml ptarmigan job runs ctest in QEMU riscv64 container on every push to main (updated 2026-08-09); source-only upstream releases | [dev.yml](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml) | 2026-06-17 | none |
| ICU | System Libraries | critical | yellow | Debian | Zero riscv64 CI across all six major workflows; Debian sid libicu78 78.3-2 ships riscv64 with no riscv64-specific patches; pure scalar C++ | [icu4c.yml](https://github.com/unicode-org/icu/blob/main/.github/workflows/icu4c.yml) | 2026-06-17 | none |
| libevent | System Libraries | critical | yellow | Debian | Zero riscv64 CI across all four workflow files; Debian sid ships 2.1.13-stable-1 from unmodified upstream source; both patches are arch-agnostic | [sources.debian.org patches](https://sources.debian.org/patches/libevent/2.1.13-stable-1/) | 2026-06-17 | none |
| liburing | System Libraries | optional | yellow | none | ci.yml cross-compiles and installs for riscv64 but never executes binaries or calls `make test`; all releases are source-only; Debian/Ubuntu/Arch RISC-V ship from unpatched upstream | [ci.yml](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml) | 2026-06-17 | none |
| libnuma | System Libraries | optional | blue | Debian | All NUMA syscalls resolve via generic kernel headers; no riscv64-specific patches; Debian sid ships libnuma1 2.0.19-1+b2 on rv-osuosl-03; Ubuntu 24.04 also ships libnuma-dev for riscv64 | [packages.debian.org](https://packages.debian.org/sid/riscv64/libnuma1/download) | 2026-06-17 | none |
| Protocol Buffers | System Libraries | optional | yellow | Ubuntu | Zero riscv64 CI; no riscv64 protoc in release v36.0; Ubuntu 24.04 ships libprotobuf-dev 3.21.12 with no riscv64-specific Debian patches | [Debian patch listing](https://udd.debian.org/patches.cgi?src=protobuf&version=3.21.12-16) | 2026-08-27 | Corrected from orange (downstream-only) to yellow (clean-distro-build): no riscv64-specific Debian patches confirmed |
| Lua | System Libraries | optional | yellow | Ubuntu | Pure ISO C99, no arch-specific code; Ubuntu 24.04 ships lua5.4 5.4.6-3build2 riscv64; Debian packaging has only two non-arch-specific patches | [packages.ubuntu.com/noble/lua5.4](https://packages.ubuntu.com/noble/lua5.4) | 2026-06-17 | none |
| xxHash | System Libraries | optional | blue | upstream | ci.yml runs make check plus RVV consistency checks at vlen 128/256/512; RVV backend covers all three XXH3 primary hot paths with adaptive-vlen intrinsics; no riscv64 binary upstream | [ci.yml](https://github.com/Cyan4973/xxHash/blob/dev/.github/workflows/ci.yml) | 2026-08-27 | n/a (new entry) |
| glibc | System Libraries | critical | yellow | Debian | Both Sourceware Buildbot riscv64 builders offline; Debian sid libc6 2.43-4 ships riscv64 with no riscv64-specific patches | [builder.sourceware.org API](https://builder.sourceware.org/buildbot/api/v2/builders/293/builds?limit=5&order=-number) | 2025-06-10 | none |
| libmvec | System Libraries | optional | orange | none | libmvec does not exist for riscv64 in upstream glibc; no Linux distro ships riscv64 libmvec; psABI PR #455 merged 2026-06-18 removes one blocker but no implementation patch submitted | [libc-alpha archive](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html) | 2026-06-17 | none |

### (b) Slide-ready summary table

| Node | Color | Criticality | Release provider |
|------|-------|-------------|-----------------|
| libpq | blue | critical | Ubuntu |
| psycopg | green | optional | upstream |
| pgx | green | optional | upstream |
| pgjdbc | green | optional | upstream |
| PostgreSQL | blue | critical | Debian |
| pgvector | yellow | optional | Ubuntu |
| PostGIS | yellow | optional | Debian |
| TimescaleDB | yellow | optional | Debian |
| Apache AGE | yellow | optional | Debian |
| Citus | orange | optional | none |
| Patroni | green | optional | upstream |
| PgBouncer | yellow | optional | Ubuntu |
| Pgpool-II | yellow | optional | Debian |
| pgcat | red | optional | none |
| MariaDB Connector/C | yellow | optional | Ubuntu |
| go-sql-driver/mysql | green | optional | upstream |
| MySQL | orange | critical | Debian (Ubuntu) |
| Vitess | orange | optional | none |
| ProxySQL | orange | optional | none |
| MariaDB | yellow | critical | Debian |
| RocksDB | orange | optional | Debian |
| MyRocks | orange | optional | Debian |
| MariaDB ColumnStore | red | optional | none |
| Galera Cluster | yellow | optional | Debian |
| MaxScale | orange | optional | none |
| hiredis | yellow | critical | Ubuntu |
| Redis | orange | critical | Debian |
| Valkey | orange | optional | Debian |
| KeyDB | orange | optional | none |
| Dragonfly | orange | optional | none |
| RediSearch | orange | optional | Ubuntu |
| RedisJSON | orange | optional | none |
| RedisBloom | red | optional | none |
| RedisTimeSeries | red | optional | none |
| Memcached | yellow | critical | Debian |
| mcrouter | red | optional | none |
| Kubernetes | yellow | optional | Debian |
| containerd | yellow | optional | upstream |
| runc | yellow | optional | upstream |
| etcd | orange | optional | Debian |
| Helm | yellow | optional | upstream |
| k0s | blue | optional | none |
| k3s | orange | optional | none |
| CloudNativePG | red | optional | none |
| Zalando postgres-operator | orange | optional | none |
| Percona Operator for MySQL | orange | optional | none |
| MySQL Operator for Kubernetes | orange | optional | none |
| mariadb-operator | orange | optional | none |
| Redis Operator (OT-CONTAINER-KIT) | orange | optional | none |
| Prometheus | yellow | optional | upstream |
| node_exporter | yellow | optional | upstream |
| postgres_exporter | yellow | optional | upstream |
| mysqld_exporter | yellow | optional | upstream |
| redis_exporter | orange | optional | none |
| memcached_exporter | yellow | optional | upstream |
| OpenTelemetry Collector | yellow | optional | upstream |
| Grafana | yellow | optional | Alpine Linux |
| Grafana Alloy | orange | optional | none |
| OpenSSL | blue | critical | Debian |
| BoringSSL | yellow | optional | none |
| zlib | blue | critical | Ubuntu |
| zlib-ng | blue | optional | Alpine Linux |
| LZ4 | yellow | critical | Ubuntu |
| zstd | yellow | critical | Debian |
| snappy | yellow | optional | Ubuntu |
| jemalloc | orange | critical | Debian |
| tcmalloc | orange | optional | none |
| PCRE2 | blue | critical | Debian |
| ICU | yellow | critical | Debian |
| libevent | yellow | critical | Debian |
| liburing | yellow | optional | none |
| libnuma | blue | optional | Debian |
| Protocol Buffers | yellow | optional | Ubuntu |
| Lua | yellow | optional | Ubuntu |
| xxHash | blue | optional | upstream |
| glibc | yellow | critical | Debian |
| libmvec | orange | optional | none |

---

## Artifact 3: Narrative and next steps

### Scorecard

**Critical-path nodes (16 total):** 5 blue, 8 yellow, 3 orange. Zero green, zero red.

The 5 blue critical nodes are libpq, PostgreSQL, OpenSSL, zlib, and PCRE2 -- all pass the upstream test suite on riscv64 but none ship riscv64 binaries upstream; distros (Debian, Ubuntu) fill that gap.

The 8 yellow critical nodes are MariaDB, hiredis, Memcached, LZ4, zstd, ICU, libevent, and glibc -- all build on riscv64 and are distributed by distros, but none have a test gate on riscv64 upstream.

The 3 orange critical nodes are MySQL, Redis, and jemalloc. MySQL requires a downstream patch from Ubuntu to build; Debian's mysql-9.7 replacement currently has a missing riscv64 build, worsening the situation since June 2026. jemalloc's absent spin-wait/pause primitives mean the allocator used by default in Redis, and optionally in PostgreSQL and MariaDB, operates in a degraded performance mode with no upstream plan to address it.

**Optional nodes (57 entries, excluding duplicates):** 5 green, 4 blue, 22 yellow, 21 orange, 4 red.

### The story

**What blocks or degrades this vertical on RISC-V**

The four red nodes -- pgcat, RedisBloom, RedisTimeSeries, and mcrouter -- each have confirmed build-blocking issues. pgcat is the most operationally relevant: it is a PostgreSQL connection pooler in active use, and its ring 0.16 dependency is a hard build blocker with an upgrade path (PR #881) stalled by the maintainer. RedisBloom and RedisTimeSeries both carry explicit Makefile `$(error)` guards; both are officially deprecated since Redis 8 GA (May 2025), reducing their urgency, but operators running pre-Redis-8 stacks will encounter these gates. mcrouter has two independent hard blockers (the Clocks.cpp `#error` and two open folly build failures), no active upstream interest, and no distro packaging on any architecture.

The orange critical node jemalloc is the most consequential gap in the system libraries layer. jemalloc is Redis's default allocator and is used by optional configurations of PostgreSQL and MariaDB. The absence of HAVE_CPU_SPINWAIT on riscv64 (confirmed by configure.ac) leaves the allocator's lock-free paths without hardware pause hints, directly degrading Redis throughput under contention on RVA23U64 hardware. The Debian distribution floor prevents a red classification, but the performance regression is real and there is no upstream plan or open PR to add RISC-V spin-wait support.

MySQL is the second orange critical node and is worsening. Debian removed mysql-8.0 from sid in July 2026, and the replacement mysql-9.7 (9.7.2-4) currently has a missing riscv64 build in the Debian tracker. Ubuntu 24.04 Noble remains the only reliable riscv64 distribution channel for MySQL 8, at version 8.0.36 -- 10 patch releases behind the current 8.0.46 security release on other architectures. The `use-largest-lock-free-type-selector-on-riscv.patch` applied by Ubuntu has never been upstreamed; this is a maintenance burden on Ubuntu and a distribution-provider risk for operators who do not pin Ubuntu Noble.

Among the optional orange nodes, the database operator layer is the most uniformly gapped. Five of the six tracked Kubernetes database operators (Zalando postgres-operator, Percona Operator for MySQL, MySQL Operator for Kubernetes, mariadb-operator, Redis Operator) have no riscv64 CI and no riscv64 release artifacts. The MySQL Operator for Kubernetes additionally has an active build guard (`exit 1` in build.sh). Only k0s among the Kubernetes distributions has native riscv64 CI (via RISE Scaleway EM-RV1 runners) and passing tests; k3s cannot start a cluster due to missing container images even though the binary now builds. etcd, the Kubernetes control plane's state store, requires two riscv64-specific downstream patches in Debian (including a 10 GB to 16 MB InitialMmapSize reduction) that upstream has declined to merge, leaving the Kubernetes control plane at orange with a permanent Debian patch dependency.

In the Redis extensions layer, RedisSearch ships only a seven-major-version-old package in Ubuntu (v1.2.2 vs upstream 2.10.x) with no vector similarity acceleration for riscv64. The VectorSimilarity submodule has cmake files for aarch64 and x86_64 only. For operators deploying vector search with Redis, RediSearch on riscv64 is not viable at current versions.

The compression library layer (LZ4, zstd, snappy) shows a consistent pattern: upstream test suites pass on riscv64, confirming correctness, but RVV 1.0 acceleration patches sit in open pull requests with no maintainer engagement. LZ4 has five open RVV PRs (#1678, #1686, #1734, #1738, #1739); zstd has three open RVV/optimization PRs (#4557, #4596, #4622); snappy's primary RVV PR (#233) was closed without merge. For a database vertical where WAL compression, binlog compression, and RDB snapshots all flow through these libraries, the performance gap against x86_64 and aarch64 is material at scale.

libmvec does not exist for riscv64. For analytics workloads that run vectorized math alongside database engines (e.g., Python data science pipelines querying PostgreSQL or ClickHouse), the missing libmvec means glibc cannot dispatch sinf/cosf/expf/logf to vectorized implementations on RVA23U64 hardware despite RVV 1.0 being mandatory in the target profile. The psABI naming PR (#455) merged in June 2026 removes one procedural blocker, but no implementation patch has been submitted to the libc-alpha mailing list as of August 2026.

**Hidden dependency risk: third-party release providers**

A significant fraction of critical-path nodes have their riscv64 release provided by Debian or Ubuntu rather than upstream. In some cases this is the normal model (PostgreSQL has always relied on the Build Farm and distros), but in others it introduces a hidden risk:

- **MySQL**: Ubuntu Noble is the only riscv64 distribution channel at 8.0.36, behind the security release on other architectures, with a patch that has never been submitted upstream.
- **glibc**: Both Sourceware Buildbot riscv64 builders are offline with no passing test run since June 2025. Debian ships libc6 from unpatched source, but upstream has no functioning riscv64 CI.
- **LZ4, zstd, ICU, libevent, PCRE2**: Each is distributed only by Debian/Ubuntu for riscv64; upstream ships no riscv64 binary. For distro-independent deployment (e.g., static binaries, container base images not derived from Debian/Ubuntu), these libraries require building from source.
- **Grafana**: Upstream has no riscv64 release artifact; only Alpine Linux edge/community ships a Grafana riscv64 package, at version 12.4.4 against the 13.2.0 upstream release.

Where `release_provider: none` is listed in the orange and red nodes, operators have no packaged option from any channel and must build from source -- with uncertain outcomes for many of these projects.

### Actionable next steps

The following actions are ordered by expected impact on the vertical's RISC-V readiness, with RISE engagement opportunities called out explicitly.

**1. Unblock pgcat's ring dependency (low effort, high impact for the PostgreSQL layer)**

pgcat PR [#881](https://github.com/postgresml/pgcat/pull/881) upgrades tokio-rustls from 0.24 to 0.26, removing the ring 0.16 pin that blocks the riscv64 build. The PR is open and unmerged due to lack of maintainer bandwidth, not technical objection. RISE or a funded contributor can pick up the review, address any rebase conflicts, and merge. This is the only red node in the PostgreSQL sub-vertical and unblocking it moves pgcat to at least orange.

**2. Submit the lock_free_type.h riscv64 guard to MySQL upstream (medium effort, unblocks distro parity)**

Ubuntu's `use-largest-lock-free-type-selector-on-riscv.patch` has been in-tree since MySQL 8.0 for Ubuntu Noble but has never been submitted to Oracle's mysql-8.0 or mysql-9.7 tree. Without it, Debian's mysql-9.7 cannot build on riscv64. A targeted upstream submission to the MySQL development list or Oracle's public bug tracker (bugs.mysql.com) is the lowest-effort path to restoring Debian mysql-9.7 riscv64 availability. This also eliminates the Ubuntu-as-sole-provider risk for a critical-path node.

**3. Add riscv64 spin-wait support to jemalloc (medium effort, impacts Redis, PostgreSQL, MariaDB)**

jemalloc's HAVE_CPU_SPINWAIT=0 on riscv64 is the root cause of the orange rating for the most widely deployed allocator in this vertical. RISC-V defines the `pause` hint via the Zihintpause extension (part of RVA23U64 baseline). A one-function contribution to jemalloc's `include/jemalloc/internal/spin.h` adding the riscv64 `pause` hint alongside the existing `__asm__ volatile("pause" ::: "memory")` for x86 and `__asm__ volatile("isb" ::: "memory")` for ARM would lift the optimization gap. RISE contributors or a RISC-V hardware vendor are well-positioned to author and champion this change given the direct performance benefit on their platforms.

**4. Drive the compression library RVV PRs to merge (medium effort, impacts all five database engines)**

Three compression libraries critical to this vertical (LZ4, zstd, snappy) each have open RVV acceleration PRs with no upstream maintainer engagement. Recommended actions:
- **zstd PR [#4557](https://github.com/facebook/zstd/pull/4557)** (sequence decode fast path): Filed December 2025, no response. Identify the correct Meta/Zstandard maintainer contact; escalate via the RISC-V International RISE project if needed.
- **LZ4 RVV PRs**: Five concurrent PRs (#1678, #1686, #1734, #1738, #1739) are fragmented. Consolidate into a single coordinated submission with a clear owner.
- **snappy PR [#235](https://github.com/google/snappy/pull/235)** (RVV short-memcpy): Remains open; PR #233 was closed. Rebase and request a fresh review from the Google Snappy maintainer.

These libraries sit in the hot path for WAL compression (PostgreSQL, MySQL), binlog compression, and RocksDB block compression. Moving them from yellow to blue unlocks measurable throughput improvements on RVA23U64.

**5. Add riscv64 to k3s container images and CI (medium effort, enables edge Kubernetes deployments)**

k3s is the dominant Kubernetes distribution for edge and IoT workloads, and RISC-V targets many such deployments. The binary now builds manually for riscv64, but cluster startup is blocked on missing `rancher/mirrored-pause` and `rancher/systemd-node` riscv64 container images. RISE has existing Scaleway EM-RV1 runner infrastructure (already used by k0s) that could be offered to the k3s project to unblock CI. Draft PR [#13854](https://github.com/k3s-io/k3s/pull/13854) needs a maintainer review and the container image build work is a Rancher/SUSE internal infrastructure task.

**6. Upstream the etcd riscv64 patches (medium effort, removes Kubernetes control plane dependency on Debian)**

Debian carries two riscv64-specific patches for etcd: a startup gate removal and an InitialMmapSize reduction from 10 GB to 16 MB. The InitialMmapSize reduction (patch 0025) is a legitimate fix for a real behavioral difference on riscv64 Linux (MMAP_MIN_ADDR and overcommit behavior differ from x86_64). The etcd maintainers closed upstream issue [#21509](https://github.com/etcd-io/etcd/issues/21509) confirming no Prow riscv64 nodes exist. RISE providing native riscv64 test infrastructure to the etcd project (as it does for k0s and containerd) would be the prerequisite for reopening the CI and upstream-patch conversation.

**7. Engage the Kubernetes operator ecosystem with riscv64 CI runners (lower urgency, completes the operator layer)**

All five orange Kubernetes database operators (Zalando postgres-operator, Percona Operator for MySQL, MySQL Operator for Kubernetes, mariadb-operator, Redis Operator) are pure-Go with CGO_ENABLED=0 and would trivially cross-compile for riscv64 if their CI platform lists and release goreleaser configs were updated. The MySQL Operator for Kubernetes additionally requires removing the active `exit 1` guard in build.sh. RISE offering github Actions riscv64 runners to these projects would enable a simple platform-list addition to clear all five from orange to at least yellow without requiring native hardware.

**8. Initiate the libmvec riscv64 implementation (long-term, high impact for analytics co-deployment)**

libmvec riscv64 support is a multi-month effort requiring a complete RISC-V SIMD vector-math implementation, ABI negotiation, and integration into the glibc release cycle. The psABI PR #455 (merged June 2026) resolved the name-mangling question. The recommended next step is a formal RFC to the libc-alpha mailing list coordinating with the RISC-V glibc maintainers (Kito Cheng, DJ Delorie) and Toolchain Working Group. For this vertical specifically, the first priority functions are expf/logf/sinf/cosf (used by pgvector distance functions and analytics UDFs), followed by the sqrt family. RISE funding a dedicated glibc contributor for this work is the most direct path to completion within a 12-month horizon.