---
title: Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack
parent: Whole-Stack Reports
---

# Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack

**Author:** Ludovic Henry<br/>
**Date:** 2026-08-27<br/>
**Scope:** RISC-V readiness of the Databases (OLTP + OLAP + KV/cache) -- self-managed open-source database stack software stack<br/>
**Target profile:** RVA23U64<br/>
**Audience:** exec-product<br/>
**Verification policy:** Colors are assigned from primary upstream sources, adversarially verified against the per-project reports under project-reports/. Items not verifiable against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="databases" %}

## Scoping assumptions

- Five per-product sub-verticals: PostgreSQL, MySQL, MariaDB, Redis, Memcached. Each has three per-product layers (Client Drivers, Database Engine, Extensions / Clustering & Proxies).
- Two shared layers span all five products: Orchestration & Observability (Kubernetes control plane, database operators, metrics pipeline) and System Libraries (compression, crypto, allocators, text, I/O, system runtime).
- CPU-only per operator directive: no GPU / CUDA / ROCm paths.
- Target profile RVA23U64: RVV 1.0, vector crypto (Zvkned), Zba/Zbb/Zbc, and FP16 are treated as mandatory baseline, so missing SIMD/crypto acceleration is a gap against baseline, even where the node is otherwise colored blue or yellow on CI/build/release grounds alone.

**Out of scope (deliberately dropped, not classified):** managed cloud database services (AWS RDS/Aurora/ElastiCache, GCP Cloud SQL/AlloyDB/MemoryStore, Azure Database); GPU/CUDA/ROCm acceleration paths (GPU-accelerated analytics, GPU vector search); Windows and macOS server deployment.

Note: the classification records place "Percona Operator for MySQL" under the PostgreSQL orchestration layer (its `layer` field reads "PostgreSQL -- Orchestration & Observability (per-product)") despite it being a MySQL/XtraDB Cluster operator. Reproduced as-is from the source records below rather than reclassified.

---

## Artifact 1: Layered stack outline

### Layer 1.a -- PostgreSQL: Client Drivers

- **libpq** -- blue (critical)
  - PostgreSQL's native C client library, built in-tree with every PostgreSQL checkout.
  - Release provided by Ubuntu, not upstream (upstream ships source tarballs only).
- **psycopg** -- green (optional)
  - Python driver for PostgreSQL (psycopg3); runtime dependency on libpq.
- **pgx** -- green (optional)
  - Go driver/toolkit for PostgreSQL; pure Go, no cgo, no compiled artifacts.
- **pgjdbc** -- green (optional)
  - Pure-Java Type-4 JDBC driver for PostgreSQL, single architecture-independent JAR.

### Layer 1.b -- MySQL: Client Drivers

- **MariaDB Connector/C** -- yellow (optional)
  - C client library connecting applications to MariaDB and MySQL.
  - Release provided by Ubuntu, not upstream. Gap: no upstream riscv64 CI; relies on a clean but unpatched Ubuntu/Debian build.
- **go-sql-driver/mysql** -- green (optional)
  - Pure-Go driver for the MySQL/MariaDB wire protocol; architecture-independent.

### Layer 1.c -- MariaDB: Client Drivers

- **MariaDB Connector/C** -- yellow (optional)
  - Same codebase as the MySQL-layer entry above; separately graded record.
  - Release provided by Ubuntu, not upstream. Gap: no upstream riscv64 CI; clean unpatched distro build only.
- **go-sql-driver/mysql** -- green (optional)
  - Same pure-Go driver, separately graded for the MariaDB context.

### Layer 1.d -- Redis: Client Drivers

- **hiredis** -- yellow (critical)
  - Minimalistic C client library for Redis; used by redis-cli and Sentinel.
  - Release provided by Debian, not upstream. Gap: no upstream riscv64 CI; clean unpatched Debian/Ubuntu build only.

### Layer 1.e -- Memcached: Client Drivers

- N/A: no Memcached-specific client-driver node exists in the classification records (e.g. no libmemcached record).

**Pipeline chains and alternate paths (Row 1):** No PIPELINE CHAIN in scope begins purely within this row; the PostgreSQL vector search path (which opens with `libpq/psycopg`) is rendered under Row 3, where its terminal gap node (pgvector's SIMD kernels) sits.

---

### Layer 2.a -- PostgreSQL: Database Engine

- **PostgreSQL** -- blue (critical)
  - Core relational database engine.
  - Release provided by none upstream (source tarballs only; riscv64 packages are all downstream-built).
  - Gap: riscv64-specific hardware paths (Zbb popcount, Zbc CRC32C, AMOSWAP spinlock) remain unmerged; JIT stays disabled on riscv64 in all packaged distributions.

**Pipeline chains and alternate paths (Row 2.a):** none of the nine listed chains anchor primarily on the bare engine; see Row 3 (pgvector) and Layer 6 (TLS, compression, CRC32C paths).

### Layer 2.b -- MySQL: Database Engine

- **MySQL** -- orange (critical)
  - Core relational database engine (Oracle MySQL).
  - Release provided by Debian/Ubuntu, not upstream. Gap: zero riscv64 CI across 11 upstream workflow files; the InnoDB `temptable` lock-free-type build failure is fixed only by an unmerged, Canonical-authored downstream patch (`use-largest-lock-free-type-selector-on-riscv.patch`, 2020, `Forwarded: no`).

### Layer 2.c -- MariaDB: Database Engine

- **MariaDB** -- yellow (critical)
  - Core relational database engine, MySQL-compatible fork.
  - Release provided by Ubuntu, not upstream. Gap: zero upstream riscv64 CI; core server/InnoDB/PCRE2 pass Debian autopkgtest on riscv64, but MyRocks/RocksDB (MDEV-29875) is a known open gap on vanilla upstream source.

### Layer 2.d -- Redis: Database Engine

- **Redis** -- yellow (critical)
  - Core in-memory KV/cache database engine.
  - Release provided by Ubuntu, not upstream. Gap: zero riscv64 CI across 11 workflow files; BITCOUNT (Zbb) and HyperLogLog (RVV) acceleration PRs remain open/unmerged; `BUILD_WITH_MODULES=yes` is blocked by the Rust toolchain installer on riscv64.
- **Valkey** -- yellow (optional)
  - Linux Foundation community fork of Redis.
  - Release provided by Ubuntu, not upstream. Gap: no upstream riscv64 CI; clean unpatched distro build only.
- **KeyDB** -- orange (optional)
  - Multithreaded Redis-compatible fork (Snapchat).
  - No production release provider (release_provider: none). Gap: no upstream riscv64 CI, no distro package anywhere; only community evidence of a working source build (2022 issue report).
- **Dragonfly** -- orange (optional)
  - Multithreaded Redis/Memcached-compatible in-memory datastore.
  - No production release provider (release_provider: none). Gap: zero riscv64 CI; the shared `helio` build layer's architecture dispatch has no riscv64 case and falls through to a `FATAL_ERROR`.

### Layer 2.e -- Memcached: Database Engine

- **Memcached** -- yellow (critical)
  - Core in-memory caching engine.
  - Release provided by Ubuntu, not upstream. Gap: single-job, x86-only upstream CI; clean unpatched distro build on riscv64. Optional OpenSSL TLS path inherits OpenSSL's AES constant-time gap on hardware lacking Zkn.

**Pipeline chains and alternate paths (Row 2):** none of the nine chains anchor purely on a bare engine node; they are rendered where their terminal/gap nodes sit (Rows 3-4, Layer 5, Layer 6).

---

### Layer 3.a -- PostgreSQL: Extensions, Clustering & Proxies

- **pgvector** -- orange (optional)
  - Vector similarity search extension (embeddings/AI workloads).
  - Release provided by Ubuntu, not upstream. Gap: Ubuntu's shipped 0.8.1-2 carries a downstream `no-native` patch stripping `-march=native`, predating upstream's own riscv64 fix (v0.8.2); SIMD distance kernels remain scalar on riscv64 pending RVV enablement -- directly relevant to the RVA23U64 baseline.
- **PostGIS** -- yellow (optional)
  - Spatial/GIS extension for PostgreSQL.
  - Release provided by Ubuntu, not upstream. Gap: no upstream riscv64 CI anywhere (GitHub Actions or Woodpecker); clean unpatched distro build only.
- **TimescaleDB** -- yellow (optional)
  - Time-series extension (hypertables, compression, continuous aggregates).
  - Release provided by Ubuntu, not upstream. Gap: vendored UMASH hash library auto-disables on riscv64 (no carry-less-multiply implementation), dropping vectorized text/multi-column GROUP BY.
- **Apache AGE** -- yellow (optional)
  - Graph database extension (openCypher) for PostgreSQL.
  - Release provided by Debian, not upstream. Gap: all 5 upstream workflows and official Docker images target only x86_64/arm64; clean unpatched Debian build.
- **Citus** -- orange (optional)
  - Distributed/sharding extension for PostgreSQL.
  - No production release provider. Gap: zero riscv64 CI, zero release assets on any architecture, no distro package -- untested rather than broken.
- **Patroni** -- green (optional)
  - PostgreSQL HA orchestrator; pure Python, architecture-independent.
- **PgBouncer** -- yellow (optional)
  - Lightweight connection pooler for PostgreSQL.
  - Release provided by Ubuntu, not upstream. Gap: no riscv64 CI job; clean unpatched distro build.
- **Pgpool-II** -- yellow (optional)
  - Connection pooling, load balancing and HA middleware for PostgreSQL.
  - Release provided by Ubuntu/Debian, not upstream. Gap: zero upstream CI, zero GitHub releases; clean unpatched distro build only.
- **pgcat** -- red (optional)
  - Rust PostgreSQL pooler/proxy (PgBouncer alternative).
  - No production release provider. Gap: pinned `ring 0.16.20` (via rustls) hardcodes its asm target list to exclude riscv64 and `.unwrap()`s on the lookup, aborting the build before compilation -- a confirmed build-blocking failure, not merely untested.

**Pipeline chains and alternate paths (Row 3.a):**
- PostgreSQL vector search path: Application -> libpq/psycopg -> PostgreSQL -> pgvector -> SIMD distance kernels (RVV target; scalar fallback today)

### Layer 3.b -- MySQL: Extensions, Clustering & Proxies

- **Vitess** -- orange (optional)
  - Sharding/clustering middleware for MySQL (vtgate/vttablet).
  - No production release provider. Gap: zero riscv64 CI, zero release assets, no distro package; pure Go with automatic pure-Go fallbacks for its two arch-specific subsystems (128-bit atomic CAS, HighwayHash), so cross-compilation is expected but unverified upstream.
- **ProxySQL** -- orange (optional)
  - High-performance protocol-aware proxy for MySQL/MariaDB/PostgreSQL.
  - No production release provider. Gap: zero riscv64 CI across 260 workflow files; all three concurrent release tracks ship amd64/arm64 only; sole community riscv64 PR (#5034) remains open/unmerged; no distro packages it at all.

**Pipeline chains and alternate paths (Row 3.b):**
- Distributed MySQL (sharding) path: Application -> Vitess vtgate -> Vitess vttablet -> MySQL shard -> InnoDB

### Layer 3.c -- MariaDB: Extensions, Clustering & Proxies

- **RocksDB** -- orange (optional)
  - Embedded LSM key-value store, backs MyRocks.
  - Release provided by Ubuntu, not upstream. Gap: zero riscv64 CI; three RISC-V PRs remain open/unmerged; Debian's packaging carries a genuine riscv-motivated atomics patch (`toku_atomic.h`), so this is a patched, not clean, distro build.
- **MyRocks** -- orange (optional)
  - RocksDB-backed storage engine for MySQL/MariaDB.
  - Release provided by Debian/Ubuntu, not upstream. Gap: upstream `facebook/mysql-5.6` is archived with zero riscv64 CI and zero releases; Ubuntu's riscv64 build backports a general server timer fix (MDEV-33435 RDCYCLE workaround) into an older base still shipped for riscv64.
- **MariaDB ColumnStore** -- red (optional)
  - Columnar analytics storage engine for MariaDB.
  - No production release provider. Gap: riscv64 is excluded from the CMake `CMAKE_SYSTEM_PROCESSOR` allowlist (build silently skipped); `mcs_int128.h` emits x86 SSE inline assembly unconditionally on non-aarch64 targets; `primproc.cpp` contains a hard-coded runtime abort for any architecture other than x86_64/aarch64 -- three independently confirmed breakage layers.
- **Galera Cluster** -- yellow (optional)
  - Synchronous multi-master replication (wsrep) for MariaDB/MySQL.
  - Release provided by Debian/Ubuntu, not upstream. Gap: zero riscv64 CI; clean unpatched distro build (the one historical riscv64-gated test-timeout fix now applies to all architectures unconditionally).
- **MaxScale** -- orange (optional)
  - MariaDB's database proxy/router.
  - No production release provider. Gap: no upstream CI or release channel for any architecture, not just riscv64; no distro packages it anywhere.

**Pipeline chains and alternate paths (Row 3.c):**
- MySQL/MariaDB LSM storage path: MySQL/MariaDB -> MyRocks -> RocksDB -> LZ4 / zstd / snappy compression -> glibc

### Layer 3.d -- Redis: Extensions, Clustering & Proxies

- **RediSearch** -- yellow (optional)
  - Full-text/vector search module for Redis.
  - Release provided by Ubuntu, not upstream. Gap: no riscv64 CI matrix entry anywhere; clean unpatched distro build; VectorSimilarity's SIMD kernels have no RISC-V path (scalar fallback only).
- **RedisJSON** -- orange (optional)
  - JSON document data type module for Redis.
  - No production release provider. Gap: hard binary CI arch ternary excludes riscv64; no distro package; a previously-cited bindgen-version root cause for a 2022 build failure is refuted by the current Cargo.lock (bindgen 0.66.1, past the riscv64gc fix) -- unverified rather than confirmed-broken.
- **RedisBloom** -- red (optional)
  - Probabilistic data structures (Bloom/Cuckoo filters) module for Redis.
  - No production release provider. Gap: the Makefile hard-blocks any build on architectures other than x64/arm64v8 with an explicit `$(error ...)`, an explicit upstream unsupported-architecture statement.
- **RedisTimeSeries** -- red (optional)
  - Time-series data structure module for Redis.
  - No production release provider. Gap: the Makefile carries the identical hard `$(error ...)` 64-bit-only guard; the vendored `cpu_features` CMake also `FATAL_ERROR`s outside a small architecture allowlist.

**Pipeline chains and alternate paths (Row 3.d):** No PIPELINE CHAIN anchors specifically on a Redis module; see the KV cache on Kubernetes path under Row 4.d.

### Layer 3.e -- Memcached: Extensions, Clustering & Proxies

- **mcrouter** -- red (optional)
  - Facebook's Memcached protocol router for scaling deployments.
  - No production release provider. Gap: an unconditional compile-time `#error` for riscv64 in `Clocks.cpp`; the hard-required `folly` dependency has two open riscv64 build-failure issues; CI is x86-only with no distro package anywhere.

**Pipeline chains and alternate paths (Row 3.e):** none of the nine chains anchor on mcrouter specifically.

---

### Layer 4.a -- PostgreSQL: Orchestration & Observability (per-product)

- **CloudNativePG** -- orange (optional)
  - Kubernetes operator for PostgreSQL HA clusters with native streaming replication.
  - No production release provider. Gap: CI platform lists hardcode `linux/amd64,linux/arm64`; zero riscv-related issues/PRs; no distro packages it (Ubuntu/Debian/Fedora all absent).
- **Zalando postgres-operator** -- orange (optional)
  - Kubernetes operator for PostgreSQL, powered by Patroni.
  - No production release provider. Gap: image-publish workflow hardcodes `linux/amd64,linux/arm64` across all four build steps; zero riscv code/issue/PR references; no distro package exists at all.
- **Percona Operator for MySQL** -- orange (optional)
  - Kubernetes operator for Percona Server for MySQL/XtraDB Cluster. (Classified under the PostgreSQL orchestration layer in the source records; reproduced as-is.)
  - No production release provider. Gap: CI builds only linux/amd64/arm64; workload images (Percona Server, XtraDB Cluster) ship amd64/arm64 only; no distro package.
- **postgres_exporter** -- yellow (optional)
  - Prometheus exporter for PostgreSQL metrics.
  - Release provided by upstream. Gap: PR-blocking unit tests run only on ubuntu-latest; the riscv64 binary is cross-compiled (`promu crossbuild`) with no test execution against it -- build-only CI.

**Pipeline chains and alternate paths (Row 4.a):**
- PostgreSQL HA on Kubernetes path: CloudNativePG operator -> PostgreSQL pod (container image) -> streaming replication -> etcd / k8s API

### Layer 4.b -- MySQL: Orchestration & Observability (per-product)

- **MySQL Operator for Kubernetes** -- orange (optional)
  - Oracle's Kubernetes operator for InnoDB Cluster.
  - No production release provider. Gap: no `.github/workflows` directory at all; `build.sh` hard-validates architecture against `^(amd64|arm64)$` and exits 1 otherwise; Docker Hub images are amd64-only; no distro package.
- **mysqld_exporter** -- yellow (optional)
  - Prometheus exporter for MySQL/MariaDB metrics.
  - Release provided by upstream. Gap: PR-blocking Go tests run only on ubuntu-latest; the riscv64 tarball is a build-only cross-compile via `promu crossbuild`.

**Pipeline chains and alternate paths (Row 4.b):** none of the nine chains anchor specifically here; see Layer 5's Observability path.

### Layer 4.c -- MariaDB: Orchestration & Observability (per-product)

- **mariadb-operator** -- orange (optional)
  - Kubernetes operator for MariaDB (including Galera, MaxScale topologies).
  - No production release provider. Gap: `.goreleaser.yml` and the release workflow both hardcode `[amd64, arm64]`; zero riscv code references; no distro or third-party package exists at all -- there is no downstream release channel to fall back on.
- **mysqld_exporter** -- yellow (optional)
  - Same exporter, separately graded for the MariaDB context.
  - Release provided by upstream. Gap: identical build-only-CI condition as the MySQL-layer entry.

**Pipeline chains and alternate paths (Row 4.c):** none of the nine chains anchor specifically here.

### Layer 4.d -- Redis: Orchestration & Observability (per-product)

- **Redis Operator (OT-CONTAINER-KIT)** -- orange (optional)
  - Kubernetes operator for Redis standalone/cluster/replication/sentinel.
  - No production release provider. Gap: Makefile and every publish workflow hardcode `linux/arm64,linux/amd64`; zero riscv code/issue hits; no distro package (container-image-only distribution); pure Go with CGO disabled would cross-compile cleanly, but this is unverified in CI.
- **redis_exporter** -- yellow (optional)
  - Prometheus exporter for Redis/Valkey metrics.
  - Release provided by Ubuntu, not upstream. Gap: no upstream riscv64 CI, build, or release; consumable via Debian's Go Packaging Team's `prometheus-redis-exporter` (unpatched, `Architecture: any`), shipped by Ubuntu 26.04.

**Pipeline chains and alternate paths (Row 4.d):**
- KV cache on Kubernetes path: Redis Operator -> Redis / Valkey pod (container image) -> jemalloc -> glibc

### Layer 4.e -- Memcached: Orchestration & Observability (per-product)

- **memcached_exporter** -- yellow (optional)
  - Prometheus exporter for Memcached metrics.
  - Release provided by upstream. Gap: PR-facing test job runs only on ubuntu-latest; riscv64 tarball is a build-only `promu crossbuild` artifact, unbroken since v0.13.1.

**Pipeline chains and alternate paths (Row 4.e):** none of the nine chains anchor specifically here.

---

### Layer 5 -- Orchestration & Observability (shared)

- **Kubernetes** -- orange (optional)
  - Container orchestration control plane.
  - Release provided by third-party. Gap: `hack/lib/golang.sh` omits `linux/riscv64` from every supported-platform array; zero riscv64 Prow CI jobs; two pending PRs remain `/hold`-blocked; etcd (a required dependency) ships zero riscv64 release binaries; the only consumable artifact is Debian sid's patched, client-only (`kubectl`) build -- not a deployable cluster.
- **containerd** -- yellow (optional)
  - Container runtime (CRI backend for Kubernetes).
  - Release provided by upstream. Gap: PR-gating CI has zero riscv references; riscv64 appears only in a build-only nightly workflow and the release Docker Buildx matrix; a PR adding riscv64 to the PR-gated integration matrix via **RISE runners** remains open/unmerged pending maintainer review -- RISE-provided CI capacity not yet integrated.
- **runc** -- yellow (optional)
  - Low-level OCI container runtime invoked by containerd.
  - Release provided by upstream. Gap: zero riscv64 references in any of the 4 CI workflow files; the riscv64 binary comes from a manual, non-CI maintainer release process (`make releaseall` + GPG signing), not automated testing, with a 4+ year unbroken track record.
- **etcd** -- orange (optional)
  - Distributed key-value store, Kubernetes control-plane state store.
  - Release provided by Ubuntu/Debian, not upstream. Gap: zero riscv64 CI or release from upstream; Debian/Ubuntu ship it only via riscv64-specific patches that bypass upstream's own unsupported-architecture exit gate and cut the initial mmap size for riscv64 buildds.
- **Helm** -- yellow (optional)
  - Kubernetes package manager.
  - Release provided by upstream. Gap: the release job's unit-test step runs on the native x86_64 runner, before cross-compiling riscv64 -- the riscv64 binary itself is never tested, though it is published directly by upstream.
- **k0s** -- blue (optional)
  - Single-binary Kubernetes distribution.
  - No production release provider. Gap: real build+test execution on a native riscv64 CI runner (unit tests and 2 smoketest suites), but triggers are dispatch/nightly only (never gate merges) and no riscv64 release artifact is published by anyone.
- **k3s** -- orange (optional)
  - Lightweight Kubernetes distribution (Rancher).
  - No production release provider. Gap: release workflow builds only linux/amd64 and linux/arm64(/arm/v7); a closed PR's author reported a manual riscv64 build "installs fine, but then cannot start" because dependent images (pause, busybox) lack riscv64 variants; no distro packages it.
- **Prometheus** -- yellow (optional)
  - Metrics collection/monitoring system and TSDB.
  - Release provided by upstream. Gap: PR-facing tests run on ubuntu-latest/windows-latest only; the riscv64 release tarball is a build-only cross-compile via promu, though upstream does publish it directly.
- **node_exporter** -- yellow (optional)
  - Prometheus exporter for host/OS metrics.
  - Release provided by upstream. Gap: same build-only-CI pattern; upstream directly publishes the riscv64 tarball; distro packaging (Debian, Ubuntu) also independently available.
- **OpenTelemetry Collector** -- yellow (optional)
  - Vendor-neutral telemetry collection/processing pipeline.
  - Release provided by upstream. Gap: the sole riscv64 CI job cross-compiles only (`make otelcorecol`, no test step); upstream ships riscv64 release binaries plus SBOM/sigstore attestations directly.
- **Grafana** -- yellow (optional)
  - Metrics/logs visualization and dashboarding.
  - Release provided by Alpine, not upstream. Gap: riscv64 CI is marked `allow-failure: true` with a comment stating riscv64 is "not an officially supported architecture"; the PR pre-merge gate has zero riscv64 references; no upstream release ships a riscv64 binary; the only working artifact is the community-maintained Alpine edge package. The official riscv64-support proposal (issue #109717) remains undecided.
- **Grafana Alloy** -- orange (optional)
  - OpenTelemetry Collector distribution with programmable pipelines (Grafana's LGTM-stack agent).
  - No production release provider. Gap: build matrix hardcodes `[amd64, arm64, ppc64le, s390x]`; the sole community riscv64 PR was closed unmerged and reopened without progress; no distro packages it; two embedded subsystems (Beyla eBPF instrumentation, ebpf-profiler) hardcode amd64/arm64-only support in their own Makefiles.

**Pipeline chains and alternate paths (Layer 5):**
- Observability path: Engine -> postgres_/mysqld_/redis_/memcached_exporter -> Prometheus -> Grafana -> (OpenTelemetry Collector / Grafana Alloy pipeline)

---

### Layer 6 -- System Libraries (shared)

- **OpenSSL** -- blue (critical)
  - TLS/crypto library, used across the stack for encrypted connections.
  - Release provided by Ubuntu/Debian (upstream ships source only). Gap: `linux64-riscv64` is built and tested (real QEMU test execution, not build-only) on every push/PR; the AES-GCM/GHASH scalar-fallback constant-time gap (non-constant-time without Zvkned/Zkn) remains open/unmerged (PRs #31080, #31082) -- directly relevant to the RVA23U64 vector-crypto baseline.
- **BoringSSL** -- yellow (optional)
  - Google's OpenSSL fork, security-reviewed TLS/crypto library.
  - No production release provider. Gap: both riscv64 CQ builders are build-only (`run_unit_tests:false`, `run_ssl_tests:false`); source-only project, no upstream binary releases for any architecture; no RISC-V assembly or Zvkn/Zvksh vector-crypto -- all primitives fall back to scalar C.
- **zlib** -- blue (critical)
  - DEFLATE compression library, used for WAL/network/page compression.
  - Release provided by Ubuntu, not upstream. Gap: upstream CI genuinely builds and tests riscv64 (OpenBSD/QEMU); no riscv64-specific code exists; the RVV Adler32 acceleration PR remains open/unmerged (performance gap only).
- **zlib-ng** -- blue (optional)
  - Performance-focused zlib-compatible fork with SIMD paths.
  - Release provided by Alpine Linux, not upstream. Gap: genuine test-executing CI on riscv64 (GCC and Clang, under QEMU); `arch/riscv/` gives RVV coverage across primary hot paths (adler32, compare256/longest_match, slide_hash, chunkset/inflate_fast) plus Zbc-accelerated CRC32 -- the strongest optimization coverage of the compression-library set. Upstream ships no riscv64 binary.
- **LZ4** -- yellow (critical)
  - Fast compression library, used for MySQL redo-log, RocksDB and page compression.
  - Release provided by Ubuntu/Debian, not upstream (upstream ships source/Windows-only). Gap: primary CI tier genuinely builds and tests riscv64 under QEMU, but `LZ4_FAST_DEC_LOOP` -- the primary decompression hot path -- remains scalar-only on riscv64; three PRs to enable it are open/unmerged. Directly relevant to the RVA23U64 SIMD baseline and the compression pipeline chain below.
- **zstd** -- blue (critical)
  - Zstandard compression library, used for WAL/page/RocksDB compression.
  - Release provided by Ubuntu, not upstream. Gap: PR-triggered CI genuinely executes the riscv64 test suite under QEMU (rv64gc baseline plus RVV vlen 128/256/512); RVV intrinsics are merged for several compression-side hot paths, but the HUF 4-way decode loop and sequence-decode fast path remain scalar (PRs open/unmerged) -- a partial optimization gap against the RVA23U64 baseline.
- **snappy** -- blue (optional)
  - Google's fast compression library, used by RocksDB and others.
  - Release provided by Ubuntu, not upstream. Gap: genuine `make test`+benchmark execution under QEMU CI; RVV `MemCopy64` and a branchless tag-advance path are merged (partial optimization), but CRC32 hash acceleration and vectorized `FindMatchLength` for compression remain unmerged (two open PRs).
- **jemalloc** -- yellow (critical)
  - General-purpose memory allocator, default for Redis/Valkey.
  - Release provided by Ubuntu, not upstream. Gap: zero riscv64 CI; clean unpatched distro build; the CPU spin-wait hint falls back to a no-op instead of using Zihintpause, and sub-word atomics rely on libatomic emulation -- minimal optimization coverage against the contention-scalability value proposition.
- **tcmalloc** -- orange (optional)
  - Google's thread-caching memory allocator.
  - No production release provider. Gap: the riscv64 package some distros ship (`libtcmalloc-minimal4t64`) is actually built from the separate `gperftools` project, not `google/tcmalloc`; the graded project itself has zero riscv64 CI, no release, and its per-CPU RSEQ fast path (the core value proposition) excludes riscv64 entirely.
- **PCRE2** -- blue (critical)
  - Perl-compatible regular expressions library.
  - Release provided by Debian, not upstream. Gap: a non-release-blocking CI job genuinely builds and runs the full test suite on riscv64 under QEMU; a RISC-V SIMD fast-path guard is missing in the JIT's `pcre2_jit_simd_inc.h` (secondary scan-speed layer only, not core correctness).
- **ICU** -- yellow (critical)
  - Unicode/locale/collation library.
  - Release provided by Debian, not upstream. Gap: zero riscv64 CI across 23 workflow files; clean unpatched Debian build. Architecture-neutral, no SIMD on any platform, so no optimization gap applies.
- **libevent** -- yellow (critical)
  - Event-notification library, powers PgBouncer/MySQL Router/mcrouter event loops.
  - Release provided by Ubuntu, not upstream. Gap: zero riscv64 CI across all 4 workflow files; clean unpatched distro build (architecture-agnostic Debian packaging patches only).
- **liburing** -- yellow (optional)
  - Userspace wrapper for Linux io_uring async I/O.
  - No production release provider (upstream ships source-only; distros build unpatched). Gap: riscv64 CI job cross-compiles and links a test program but never executes it -- build-only.
- **libnuma** -- yellow (optional)
  - NUMA-aware memory allocation library.
  - Release provided by Ubuntu/Debian, not upstream. Gap: zero riscv64 CI; Debian's packaging patch series is empty -- confirmed clean, unpatched build.
- **Protocol Buffers** -- yellow (optional)
  - Serialization library, used across Kubernetes, Vitess, MySQL and the observability stack.
  - Release provided by Ubuntu, not upstream. Gap: zero riscv64 references across 24 workflow files; no riscv64 protoc release asset; clean unpatched distro build empirically confirmed still building on Debian's riscv64 buildd hardware.
- **Lua** -- yellow (optional)
  - Embeddable scripting language, powers Redis/Valkey `EVAL` and Memcached proxy scripting.
  - Release provided by Ubuntu, not upstream. Gap: no upstream CI of any kind, source-only releases; clean distro build (Debian's two patches are generic multiarch packaging, not riscv64-specific).
- **xxHash** -- blue (optional)
  - Fast non-cryptographic hashing library.
  - Release provided by Ubuntu, not upstream. Gap: genuine `make check` test execution on riscv64 (scalar and RVV vlen 128/256/512) under QEMU; RVV covers XXH3's core hot paths, but XXH32/XXH64 remain scalar with no runtime ISA dispatch -- partial optimization.
- **glibc** -- yellow (critical)
  - GNU C library; the core system runtime nearly everything in this stack links against.
  - Release provided by Ubuntu, not upstream. Gap: both Sourceware riscv64 CI buildbot builders are offline; clean unpatched distro build (Debian's 94 architecture-specific patches include none for riscv).
- **libmvec** -- orange (optional)
  - glibc's SIMD-vectorized math library (vector math functions for auto-vectorized loops).
  - No production release provider. Gap: `sysdeps/riscv/configure.ac` never sets `build_mathvec=yes` (unlike x86_64/aarch64), so `mathvec/` is never built for riscv64; zero vector-math code merged for RISC-V anywhere; no distro ships it. Directly relevant to the RVA23U64 vectorization baseline.

**Pipeline chains and alternate paths (Layer 6):**
- TLS / encrypted connection path: Engine -> OpenSSL -> AES-GCM (Zvkned / Zkn hardware; non-constant-time scalar fallback without them)
- Compression path (vectorization gap): Engine / RocksDB -> zstd / LZ4 / zlib -> RVV vectorized decode (NOT enabled today -> scalar)
- CRC32C checksum path (vectorization gap): InnoDB / PostgreSQL / extstore -> CRC32C -> Zbc/Zbkc clmul hardware (patches open; scalar fallback today)

---

## Artifact 2: Status table

### (a) Full table

| Node | Layer | Criticality | Color | Release provider | Justification | Primary source | As-of | Delta-vs-report |
|---|---|---|---|---|---|---|---|---|
| libpq | 1.a PostgreSQL: Client Drivers | critical | blue | Ubuntu | Buildfarm runs full regression tests on riscv64; upstream CI has none; Ubuntu/Debian ship unpatched. | [PostgreSQL Build Farm](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64) | 2026-06-17 | none |
| psycopg | 1.a PostgreSQL: Client Drivers | optional | green | upstream | CI builds and tests riscv64 wheels under QEMU with live Postgres service; PyPI ships riscv64 wheels. | [packages-bin.yml](https://github.com/psycopg/psycopg/blob/master/.github/workflows/packages-bin.yml) | 2026-08-14 | none |
| pgx | 1.a PostgreSQL: Client Drivers | optional | green | upstream | Zero riscv/assembly/cgo files; pure Go, arch-independent by construction; Ubuntu packages `arch: all`. | [go.mod](https://github.com/jackc/pgx/blob/master/go.mod) | 2026-06-17 | none |
| pgjdbc | 1.a PostgreSQL: Client Drivers | optional | green | upstream | Single arch-independent JAR on Maven Central; zero compiled/native code in the repo. | [Maven Central](https://repo1.maven.org/maven2/org/postgresql/postgresql/42.7.13/) | 2026-06-17 | none |
| PostgreSQL | 2.a PostgreSQL: Database Engine | critical | blue | none | No riscv64 CI job; Build Farm workers run the full test pipeline and pass; upstream ships source tarballs only. | [pg-ci.yml](https://raw.githubusercontent.com/postgres/postgres/master/.github/workflows/pg-ci.yml) | 2026-06-17 | none |
| pgvector | 3.a PostgreSQL: Extensions | optional | orange | Ubuntu | No upstream riscv64 CI; Ubuntu's shipped 0.8.1-2 carries a downstream patch predating upstream's own riscv64 fix. | [Debian no-native patch](https://salsa.debian.org/postgresql/pgvector/-/raw/debian/0.8.1-2/debian/patches/no-native) | 2026-06-17 | color moved yellow->orange on patch discovery |
| PostGIS | 3.a PostgreSQL: Extensions | optional | yellow | ubuntu | No riscv64 CI anywhere (GitHub Actions, Woodpecker); clean unpatched distro build confirmed. | [portability.yml](https://github.com/postgis/postgis/blob/master/.woodpecker/portability.yml) | 2026-06-17 | none |
| TimescaleDB | 3.a PostgreSQL: Extensions | optional | yellow | ubuntu | No riscv64 CI in 47 workflow files; clean unpatched distro build; vendored UMASH auto-disables. | [Ubuntu package](https://packages.ubuntu.com/resolute/riscv64/postgresql-18-timescaledb) | 2026-06-17 | none |
| Apache AGE | 3.a PostgreSQL: Extensions | optional | yellow | Debian | Upstream CI/images x86_64/arm64 only; Debian buildd installed riscv64 with only an unrelated packaging patch. | [Debian buildd](https://buildd.debian.org/status/package.php?p=postgresql-18-age) | 2026-09-04 | none |
| Citus | 3.a PostgreSQL: Extensions | optional | orange | none | No riscv64 CI; zero release assets on any architecture; no distro package; zero riscv-specific code. | [build_and_test.yml](https://github.com/citusdata/citus/blob/main/.github/workflows/build_and_test.yml) | 2026-06-17 | none |
| Patroni | 3.a PostgreSQL: Extensions | optional | green | upstream | Pure Python, zero compiled code; upstream release.yaml publishes wheel+sdist directly. | [PyPI JSON](https://pypi.org/pypi/patroni/json) | 2026-06-17 | none |
| PgBouncer | 3.a PostgreSQL: Extensions | optional | yellow | ubuntu | No riscv64 CI job; Ubuntu ships unpatched from Debian packaging with no riscv64-specific patch. | [pgbouncer-ci.yml](https://github.com/pgbouncer/pgbouncer/blob/main/.github/workflows/pgbouncer-ci.yml) | 2025-11-10 | none |
| Pgpool-II | 3.a PostgreSQL: Extensions | optional | yellow | Ubuntu/Debian | Zero upstream CI and zero releases; Ubuntu/Debian ship unpatched from portable C99 source. | [Debian patches](https://sources.debian.org/src/pgpool2/4.7.2-1/debian/patches/) | 2026-08-14 | none |
| pgcat | 3.a PostgreSQL: Extensions | optional | red | none | Pinned `ring 0.16.20` build.rs hardcodes non-riscv64 asm targets and panics on riscv64 -- confirmed build-blocking. | [Cargo.lock](https://github.com/postgresml/pgcat/blob/main/Cargo.lock) | 2026-09-04 | confirms/sharpens report |
| CloudNativePG | 4.a PostgreSQL: Orchestration | optional | orange | none | CI platform lists hardcode amd64/arm64; no riscv issues/PRs; no distro package anywhere. | [continuous-integration.yml](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/.github/workflows/continuous-integration.yml) | 2026-06-17 | none |
| Zalando postgres-operator | 4.a PostgreSQL: Orchestration | optional | orange | none | Image workflow hardcodes amd64/arm64; zero riscv references; no distro package. | [publish_ghcr_image.yaml](https://github.com/zalando/postgres-operator/blob/master/.github/workflows/publish_ghcr_image.yaml) | 2026-08-30 | none |
| Percona Operator for MySQL | 4.a PostgreSQL: Orchestration (per source record) | optional | orange | none | CI/images amd64/arm64 only; no distro package. | [scan.yml](https://github.com/percona/percona-server-mysql-operator/blob/main/.github/workflows/scan.yml) | 2026-09-04 | color_case corrected |
| postgres_exporter | 4.a PostgreSQL: Orchestration | optional | yellow | upstream | Tests run x86-only; riscv64 tarball is a build-only promu crossbuild, published directly by upstream. | [ci.yml](https://github.com/prometheus-community/postgres_exporter/blob/main/.github/workflows/ci.yml) | 2026-07-08 | none |
| MariaDB Connector/C | 1.b MySQL: Client Drivers | optional | yellow | ubuntu | No riscv64 CI; Ubuntu ships unpatched (two dormant riscv patches exist but are unapplied). | [Ubuntu package](https://packages.ubuntu.com/resolute/riscv64/libmariadb3) | 2026-02-09 | none |
| go-sql-driver/mysql | 1.b MySQL: Client Drivers | optional | green | upstream | Zero asm/cgo/arch-specific code; Debian packages `arch: all`. | [test.yml](https://github.com/go-sql-driver/mysql/blob/master/.github/workflows/test.yml) | 2026-06-17 | none |
| MySQL | 2.b MySQL: Database Engine | critical | orange | Debian/Ubuntu | Zero riscv64 CI across 11 workflows; Ubuntu ships via an unmerged, Canonical-authored downstream patch. | [Launchpad debian.tar.xz](https://launchpad.net/ubuntu/+archive/primary/+sourcefiles/mysql-8.4/8.4.11-0ubuntu0.26.04.1/mysql-8.4_8.4.11-0ubuntu0.26.04.1.debian.tar.xz) | 2020-07-27 | confirmed and refined |
| Vitess | 3.b MySQL: Extensions | optional | orange | none | Zero riscv64 CI/release/distro package; pure Go with automatic fallbacks for the two arch-specific subsystems, unverified in CI. | [Releases](https://github.com/vitessio/vitess/releases) | 2026-06-17 | none |
| ProxySQL | 3.b MySQL: Extensions | optional | orange | none | Zero riscv64 CI across 260 workflows; no distro packages it at all; sole community PR unmerged. | [PR #5034](https://github.com/sysown/proxysql/pull/5034) | 2026-08-14 | none |
| MySQL Operator for Kubernetes | 4.b MySQL: Orchestration | optional | orange | none | No CI at all; build.sh hard-validates architecture excluding riscv64; amd64-only images; no distro package. | [build.sh](https://raw.githubusercontent.com/mysql/mysql-operator/trunk/build.sh) | 2026-06-17 | none |
| mysqld_exporter (MySQL) | 4.b MySQL: Orchestration | optional | yellow | upstream | Tests x86-only; riscv64 binary is a build-only promu crossbuild, published directly by upstream. | [ci.yml](https://github.com/prometheus/mysqld_exporter/blob/main/.github/workflows/ci.yml) | 2026-08-13 | none |
| MariaDB Connector/C | 1.c MariaDB: Client Drivers | optional | yellow | ubuntu | Same codebase, separately graded; no riscv64 CI; clean unpatched build confirmed via Debian patch series. | [ci.yml](https://github.com/mariadb-corporation/mariadb-connector-c/blob/3.4/.github/workflows/ci.yml) | 2026-06-17 | none |
| go-sql-driver/mysql | 1.c MariaDB: Client Drivers | optional | green | upstream | Same pure-Go driver, separately graded. | [go.mod](https://github.com/go-sql-driver/mysql/blob/master/go.mod) | 2026-06-17 | none |
| MariaDB | 2.c MariaDB: Database Engine | critical | yellow | ubuntu | Zero upstream riscv64 CI; clean unpatched distro build passes core/InnoDB/PCRE2 autopkgtest. | [MariaDB/server workflows](https://github.com/MariaDB/server/tree/main/.github/workflows) | 2026-09-04 | none |
| RocksDB | 3.c MariaDB: Extensions | optional | orange | ubuntu | Zero riscv64 CI; three riscv PRs open/unmerged; Debian carries a genuine riscv-motivated atomics patch. | [Debian atomics patch](https://sources.debian.org/src/rocksdb/9.11.2-1/debian/patches/0001-replace-old-sync-with-new-atomic-builtin-equivalents.patch) | 2026-09-04 | strengthened basis, same color |
| MyRocks | 3.c MariaDB: Extensions | optional | orange | Debian/Ubuntu | Upstream archived, zero CI/releases; Ubuntu backports a general timer fix, not a RocksDB-specific patch. | [MDEV-33435](https://jira.mariadb.org/browse/MDEV-33435) | 2026-08-14 | mechanism corrected |
| MariaDB ColumnStore | 3.c MariaDB: Extensions | optional | red | none | riscv64 excluded from CMake allowlist; x86 SSE inline asm; hard-coded runtime abort for non-x86_64/aarch64. | [primproc.cpp](https://github.com/mariadb-corporation/mariadb-columnstore-engine/blob/main/primitives/primproc/primproc.cpp#L711-L714) | 2026-06-17 | orange->red on same evidence |
| Galera Cluster | 3.c MariaDB: Extensions | optional | yellow | Debian/Ubuntu | Zero riscv64 CI; Debian buildd builds successfully; the one historical riscv-gated patch now applies to all arches. | [Debian buildd log](https://buildd.debian.org/status/logs.php?pkg=galera-4&arch=riscv64) | 2026-08-14 | none |
| MaxScale | 3.c MariaDB: Extensions | optional | orange | none | No CI or release channel for any architecture; no distro package anywhere. | [repo](https://github.com/mariadb-corporation/MaxScale) | 2026-08-14 | none |
| mariadb-operator | 4.c MariaDB: Orchestration | optional | orange | none | Release tooling hardcodes amd64/arm64; zero riscv references; no downstream release channel of any kind. | [.goreleaser.yml](https://github.com/mariadb-operator/mariadb-operator/blob/main/.goreleaser.yml) | 2026-06-17 | color_case corrected |
| mysqld_exporter (MariaDB) | 4.c MariaDB: Orchestration | optional | yellow | upstream | Identical build-only-CI condition as the MySQL-layer entry. | [ci.yml](https://github.com/prometheus/mysqld_exporter/blob/main/.github/workflows/ci.yml) | 2026-06-17 | none |
| hiredis | 1.d Redis: Client Drivers | critical | yellow | debian | Zero riscv64 CI; Debian ships unpatched (6 patches, none riscv64-specific). | [Debian buildd](https://buildd.debian.org/status/package.php?p=hiredis&suite=sid) | 2026-06-17 | none |
| Redis | 2.d Redis: Database Engine | critical | yellow | ubuntu | Zero riscv64 CI across 11 workflows; clean unpatched Ubuntu build; BITCOUNT/HyperLogLog acceleration PRs open. | [workflows dir](https://github.com/redis/redis/tree/unstable/.github/workflows) | 2026-06-17 | none |
| Valkey | 2.d Redis: Database Engine | optional | yellow | ubuntu | Zero riscv64 CI across 20 workflows; clean unpatched Ubuntu build (5 generic patches). | [Ubuntu package](https://packages.ubuntu.com/resolute/riscv64/valkey-server) | 2026-09-04 | none |
| KeyDB | 2.d Redis: Database Engine | optional | orange | none | Zero riscv64 CI; zero release assets; no distro package; community source-build report only. | [ci.yml](https://github.com/Snapchat/KeyDB/blob/main/.github/workflows/ci.yml) | 2022-11-30 | none |
| Dragonfly | 2.d Redis: Database Engine | optional | orange | none | Zero riscv64 CI/release/distro package; helio's arch dispatch has no riscv64 case, falls to FATAL_ERROR. | [workflows](https://github.com/dragonflydb/dragonfly/tree/main/.github/workflows) | 2026-08-14 | none |
| RediSearch | 3.d Redis: Extensions | optional | yellow | ubuntu | No riscv64 CI matrix entry; Ubuntu 26.04 ships unpatched. | [generate-matrix.yml](https://github.com/RediSearch/RediSearch/blob/master/.github/workflows/generate-matrix.yml) | 2026-09-04 | none |
| RedisJSON | 3.d Redis: Extensions | optional | orange | none | CI arch ternary excludes riscv64; no distro package; cited bindgen build-failure root cause is refuted by current Cargo.lock. | [flow-linux.yml](https://github.com/RedisJSON/RedisJSON/blob/master/.github/workflows/flow-linux.yml) | 2026-06-17 | root-cause narrative corrected |
| RedisBloom | 3.d Redis: Extensions | optional | red | none | Makefile hard-blocks any non-x64/arm64v8 build with an explicit error; no distro package anywhere. | [Makefile](https://github.com/RedisBloom/RedisBloom/blob/master/Makefile) | 2026-06-17 | orange->red |
| RedisTimeSeries | 3.d Redis: Extensions | optional | red | none | Identical hard Makefile guard; vendored cpu_features CMake also FATAL_ERRORs outside a small allowlist. | [Makefile](https://github.com/RedisTimeSeries/RedisTimeSeries/blob/master/Makefile) | 2026-06-17 | none |
| Redis Operator (OT-CONTAINER-KIT) | 4.d Redis: Orchestration | optional | orange | none | Build/CI hardcode arm64/amd64; zero riscv references; no distro package. | [publish-image.yaml](https://github.com/OT-CONTAINER-KIT/redis-operator/blob/main/.github/workflows/publish-image.yaml) | 2026-08-14 | none |
| redis_exporter | 4.d Redis: Orchestration | optional | yellow | Ubuntu | No riscv64 CI/build/release from upstream; Debian's Go Packaging Team ships it unpatched as `prometheus-redis-exporter`. | [Ubuntu package](https://packages.ubuntu.com/resolute/riscv64/prometheus-redis-exporter) | 2026-09-04 | orange->yellow on renamed-package discovery |
| Memcached | 2.e Memcached: Database Engine | critical | yellow | ubuntu | Single x86-only CI job; clean unpatched distro build confirmed by buildd install status. | [Debian buildd](https://buildd.debian.org/status/package.php?p=memcached&suite=sid) | 2026-06-17 | none |
| mcrouter | 3.e Memcached: Extensions | optional | red | none | Unconditional `#error` for riscv64 in Clocks.cpp; folly dependency has open riscv64 build-failure issues. | [Clocks.cpp](https://github.com/facebook/mcrouter/blob/main/mcrouter/lib/Clocks.cpp) | 2026-06-17 | none |
| memcached_exporter | 4.e Memcached: Orchestration | optional | yellow | upstream | Tests x86-only; riscv64 tarball is a build-only promu crossbuild, published directly by upstream. | [ci.yml](https://github.com/prometheus/memcached_exporter/blob/master/.github/workflows/ci.yml) | 2026-08-14 | none |
| Kubernetes | 5 Orchestration & Observability | optional | orange | third-party | Zero riscv64 CI/supported-platform entry; two pending PRs blocked; etcd dependency ships no riscv64 binaries. | [hack/lib/golang.sh](https://github.com/kubernetes/kubernetes/blob/master/hack/lib/golang.sh) | 2025-07-09 | none |
| containerd | 5 Orchestration & Observability | optional | yellow | upstream | PR-gating CI has zero riscv references; riscv64 tarball published directly by upstream; RISE-runner integration PR pending review. | [ci.yml](https://github.com/containerd/containerd/blob/main/.github/workflows/ci.yml) | 2026-06-17 | none |
| runc | 5 Orchestration & Observability | optional | yellow | upstream | Zero riscv64 CI in any workflow; riscv64 binary comes from a manual, non-CI signed release process. | [test.yml](https://github.com/opencontainers/runc/blob/main/.github/workflows/test.yml) | 2026-09-04 | color_case corrected |
| etcd | 5 Orchestration & Observability | optional | orange | Ubuntu/Debian | Zero riscv64 CI/release from upstream; Debian/Ubuntu ship via patches bypassing the upstream unsupported-arch exit. | [InitialMmapSize patch](https://sources.debian.org/data/main/e/etcd/3.5.30-2/debian/patches/0025-Reduce-InitialMmapSize-on-32-bit-and-riscv64-archite.patch) | 2026-06-17 | none |
| Helm | 5 Orchestration & Observability | optional | yellow | upstream | Unit tests run pre-crossbuild on x86_64; riscv64 tarball published directly by upstream. | [release.yml](https://github.com/helm/helm/blob/main/.github/workflows/release.yml) | 2026-06-17 | mechanism corrected |
| k0s | 5 Orchestration & Observability | optional | blue | none | Native riscv64 CI runner executes unit tests and smoketests; no riscv64 release artifact from any provider. | [riscv64.yml](https://github.com/k0sproject/k0s/blob/main/.github/workflows/riscv64.yml) | 2026-06-17 | none |
| k3s | 5 Orchestration & Observability | optional | orange | none | Release workflow builds amd64/arm64(/arm) only; manual riscv64 build reportedly cannot start (dependent images lack riscv64). | [release.yml](https://github.com/k3s-io/k3s/blob/main/.github/workflows/release.yml) | 2026-08-10 | none |
| Prometheus | 5 Orchestration & Observability | optional | yellow | upstream | PR tests x86/Windows only; build-only riscv64 crossbuild; upstream publishes the tarball directly. | [ci.yml](https://github.com/prometheus/prometheus/blob/main/.github/workflows/ci.yml) | 2026-06-17 | none |
| node_exporter | 5 Orchestration & Observability | optional | yellow | upstream | Same build-only-CI pattern; upstream directly publishes the riscv64 tarball. | [ci.yml](https://github.com/prometheus/node_exporter/blob/main/.github/workflows/ci.yml) | 2026-06-17 | none |
| OpenTelemetry Collector | 5 Orchestration & Observability | optional | yellow | upstream | Sole riscv64 CI job cross-compiles only; upstream publishes riscv64 release artifacts with SBOM/sigstore. | [build-and-test.yml](https://github.com/open-telemetry/opentelemetry-collector/blob/main/.github/workflows/build-and-test.yml) | 2026-06-17 | none |
| Grafana | 5 Orchestration & Observability | optional | yellow | Alpine | riscv64 CI marked allow-failure with explicit "not officially supported" comment; no upstream release; Alpine ships unofficial package. | [release-build.yml](https://github.com/grafana/grafana/blob/main/.github/workflows/release-build.yml) | 2025-08-20 | none |
| Grafana Alloy | 5 Orchestration & Observability | optional | orange | none | Build matrix hardcodes amd64/arm64/ppc64le/s390x; sole community PR closed unmerged; no distro package. | [build.yml](https://github.com/grafana/alloy/blob/main/.github/workflows/build.yml) | 2026-06-17 | none |
| OpenSSL | 6 System Libraries | critical | blue | Ubuntu/Debian | riscv64 build+test unconditional on every push/PR; AES-GCM constant-time gap remains open/unmerged. | [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml) | 2026-06-17 | none |
| BoringSSL | 6 System Libraries | optional | yellow | none | Both riscv64 CQ builders are build-only; source-only project; no RISC-V vector-crypto. | [commit-queue.cfg](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/commit-queue.cfg) | 2026-06-17 | none |
| zlib | 6 System Libraries | critical | blue | Ubuntu | Upstream CI genuinely builds+tests riscv64 (OpenBSD/QEMU); RVV Adler32 PR open/unmerged. | [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) | 2025-12-25 | CI-origin commit corrected |
| zlib-ng | 6 System Libraries | optional | blue | Alpine Linux | Genuine test-executing riscv64 CI; RVV coverage across all primary hot paths plus Zbc CRC32. | [cmake.yml](https://github.com/zlib-ng/zlib-ng/blob/develop/.github/workflows/cmake.yml) | 2026-06-17 | correctness issue #1670 since fixed |
| LZ4 | 6 System Libraries | critical | yellow | Ubuntu/Debian | Primary CI tier build+test on riscv64 via QEMU; FAST_DEC_LOOP decompression hot path remains scalar (3 PRs open). | [lz4.c](https://github.com/lz4/lz4/blob/dev/lib/lz4.c) | 2024-07-22 | none |
| zstd | 6 System Libraries | critical | blue | Ubuntu | Genuine riscv64 QEMU test execution across RVV vlens; HUF decode/sequence-decode fast paths remain scalar (2 PRs open). | [dev-short-tests.yml](https://github.com/facebook/zstd/blob/dev/.github/workflows/dev-short-tests.yml) | 2026-06-17 | none |
| snappy | 6 System Libraries | optional | blue | Ubuntu | Genuine `make test`+benchmark under QEMU CI; RVV MemCopy64/tag-advance merged; CRC32/FindMatchLength unmerged. | [riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml) | 2025-03-26 | PR churn updated |
| jemalloc | 6 System Libraries | critical | yellow | ubuntu | Zero riscv64 CI; clean unpatched distro build; Zihintpause spin-hint and sub-word atomics both fall back to generic paths. | [Ubuntu package](https://packages.ubuntu.com/search?keywords=jemalloc&searchon=names&suite=resolute&section=all) | 2026-06-17 | none |
| tcmalloc | 6 System Libraries | optional | orange | none | The riscv64 package distros ship is actually the separate gperftools project; google/tcmalloc has zero riscv64 CI/release and excludes riscv64 from its per-CPU RSEQ fast path. | [libtcmalloc-minimal4t64](https://packages.debian.org/sid/libtcmalloc-minimal4t64) | 2026-06-17 | color corrected yellow->orange |
| PCRE2 | 6 System Libraries | critical | blue | Debian | Non-blocking CI genuinely builds+tests riscv64 under QEMU; JIT SIMD fast-path guard missing (secondary layer only). | [dev.yml](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml#L559-L627) | 2026-06-17 | none |
| ICU | 6 System Libraries | critical | yellow | Debian | Zero riscv64 CI across 23 workflows; clean unpatched Debian build; no SIMD on any platform. | [Debian buildd](https://buildd.debian.org/status/package.php?p=icu&suite=sid) | 2026-06-17 | none |
| libevent | 6 System Libraries | critical | yellow | ubuntu | Zero riscv64 CI across 4 workflows; clean unpatched distro build (arch-agnostic patches only). | [workflows](https://github.com/libevent/libevent/tree/master/.github/workflows) | 2026-06-17 | none |
| liburing | 6 System Libraries | optional | yellow | none | riscv64 CI job cross-compiles and links but never executes the test program; distros build unpatched upstream. | [ci.yml](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml) | 2026-06-17 | release_provider corrected upstream->none |
| libnuma | 6 System Libraries | optional | yellow | Ubuntu/Debian | Zero riscv64 CI; Debian's patch series is empty, confirming a clean unpatched build. | [makefile.yml](https://raw.githubusercontent.com/numactl/numactl/master/.github/workflows/makefile.yml) | 2026-06-17 | none |
| Protocol Buffers | 6 System Libraries | optional | yellow | ubuntu | Zero riscv64 CI across 24 workflows; clean distro build confirmed building on live Debian riscv64 buildd hardware. | [patches series](https://sources.debian.org/src/protobuf/3.21.12-16/debian/patches/series) | 2026-09-04 | uncertainty resolved, same color |
| Lua | 6 System Libraries | optional | yellow | Ubuntu | No upstream CI at all, source-only releases; clean distro build (patches are generic multiarch packaging). | [Ubuntu package](https://packages.ubuntu.com/resolute/riscv64/lua5.4) | 2026-06-17 | none |
| xxHash | 6 System Libraries | optional | blue | Ubuntu | Genuine riscv64 `make check` test execution across scalar/RVV vlens; XXH32/XXH64 remain scalar. | [ci.yml](https://github.com/Cyan4973/xxHash/blob/dev/.github/workflows/ci.yml) | 2026-06-17 | none |
| glibc | 6 System Libraries | critical | yellow | ubuntu | Sourceware riscv64 CI buildbots offline; clean unpatched distro build (94 arch-patches, none for riscv). | [Buildbot API](https://builder.sourceware.org/buildbot/api/v2/builders/293) | 2026-08-27 | none |
| libmvec | 6 System Libraries | optional | orange | none | `sysdeps/riscv/configure.ac` never enables `build_mathvec`; zero vector-math code merged for riscv64; no distro ships it. | [sysdeps/riscv/configure.ac](https://raw.githubusercontent.com/bminor/glibc/master/sysdeps/riscv/configure.ac) | 2026-09-04 | none |

### (b) Slide-ready summary table

| Node | Color | Criticality | Release provider |
|---|---|---|---|
| libpq | blue | critical | Ubuntu |
| psycopg | green | optional | upstream |
| pgx | green | optional | upstream |
| pgjdbc | green | optional | upstream |
| PostgreSQL | blue | critical | none |
| pgvector | orange | optional | Ubuntu |
| PostGIS | yellow | optional | ubuntu |
| TimescaleDB | yellow | optional | ubuntu |
| Apache AGE | yellow | optional | Debian |
| Citus | orange | optional | none |
| Patroni | green | optional | upstream |
| PgBouncer | yellow | optional | ubuntu |
| Pgpool-II | yellow | optional | Ubuntu/Debian |
| pgcat | red | optional | none |
| CloudNativePG | orange | optional | none |
| Zalando postgres-operator | orange | optional | none |
| Percona Operator for MySQL | orange | optional | none |
| postgres_exporter | yellow | optional | upstream |
| MariaDB Connector/C (MySQL ctx) | yellow | optional | ubuntu |
| go-sql-driver/mysql (MySQL ctx) | green | optional | upstream |
| MySQL | orange | critical | Debian/Ubuntu |
| Vitess | orange | optional | none |
| ProxySQL | orange | optional | none |
| MySQL Operator for Kubernetes | orange | optional | none |
| mysqld_exporter (MySQL ctx) | yellow | optional | upstream |
| MariaDB Connector/C (MariaDB ctx) | yellow | optional | ubuntu |
| go-sql-driver/mysql (MariaDB ctx) | green | optional | upstream |
| MariaDB | yellow | critical | ubuntu |
| RocksDB | orange | optional | ubuntu |
| MyRocks | orange | optional | Debian/Ubuntu |
| MariaDB ColumnStore | red | optional | none |
| Galera Cluster | yellow | optional | Debian/Ubuntu |
| MaxScale | orange | optional | none |
| mariadb-operator | orange | optional | none |
| mysqld_exporter (MariaDB ctx) | yellow | optional | upstream |
| hiredis | yellow | critical | debian |
| Redis | yellow | critical | ubuntu |
| Valkey | yellow | optional | ubuntu |
| KeyDB | orange | optional | none |
| Dragonfly | orange | optional | none |
| RediSearch | yellow | optional | ubuntu |
| RedisJSON | orange | optional | none |
| RedisBloom | red | optional | none |
| RedisTimeSeries | red | optional | none |
| Redis Operator (OT-CONTAINER-KIT) | orange | optional | none |
| redis_exporter | yellow | optional | Ubuntu |
| Memcached | yellow | critical | ubuntu |
| mcrouter | red | optional | none |
| memcached_exporter | yellow | optional | upstream |
| Kubernetes | orange | optional | third-party |
| containerd | yellow | optional | upstream |
| runc | yellow | optional | upstream |
| etcd | orange | optional | Ubuntu/Debian |
| Helm | yellow | optional | upstream |
| k0s | blue | optional | none |
| k3s | orange | optional | none |
| Prometheus | yellow | optional | upstream |
| node_exporter | yellow | optional | upstream |
| OpenTelemetry Collector | yellow | optional | upstream |
| Grafana | yellow | optional | Alpine |
| Grafana Alloy | orange | optional | none |
| OpenSSL | blue | critical | Ubuntu/Debian |
| BoringSSL | yellow | optional | none |
| zlib | blue | critical | Ubuntu |
| zlib-ng | blue | optional | Alpine Linux |
| LZ4 | yellow | critical | Ubuntu/Debian |
| zstd | blue | critical | Ubuntu |
| snappy | blue | optional | Ubuntu |
| jemalloc | yellow | critical | ubuntu |
| tcmalloc | orange | optional | none |
| PCRE2 | blue | critical | Debian |
| ICU | yellow | critical | Debian |
| libevent | yellow | critical | ubuntu |
| liburing | yellow | optional | none |
| libnuma | yellow | optional | Ubuntu/Debian |
| Protocol Buffers | yellow | optional | ubuntu |
| Lua | yellow | optional | Ubuntu |
| xxHash | blue | optional | Ubuntu |
| glibc | yellow | critical | ubuntu |
| libmvec | orange | optional | none |

---

## Artifact 3: Narrative and next steps

**Scorecard.** Of 16 critical-path nodes: 9 yellow, 6 blue, 1 orange. No critical-path node is green, red, or grey.
Of 64 optional nodes: 27 yellow, 22 orange, 6 green, 5 red, 4 blue. No optional node is grey.

**The story.**

The single most consequential fact for this vertical: **MySQL itself is orange.** The engine that ~40% of the deployed OLTP fleet runs on ships to riscv64 users only through an unmerged, six-year-old, Canonical-authored downstream patch fixing an InnoDB `temptable` build failure that Oracle has never accepted upstream. Upstream MySQL has zero riscv64 CI across all 11 of its workflow files. This is the one critical-path node that sits below the "clean distro build" floor every other database engine in the vertical clears -- and it is the highest-priority engineering gap in the whole report.

Red and orange nodes concentrate in the extensions/clustering/proxies layer, where they degrade or block specific capabilities rather than the core engines:
- **Vector search on PostgreSQL is compromised at two levels.** pgvector (orange) ships to riscv64 users only via an Ubuntu patch that predates upstream's own fix, and even where it builds, its SIMD distance kernels run scalar today -- a direct gap against the RVA23U64 RVV baseline this profile mandates.
- **MyRocks/RocksDB, the LSM storage path shared by MySQL and MariaDB, is orange on both legs of the chain.** Upstream `facebook/mysql-5.6` (MyRocks) is archived with zero CI or releases; RocksDB itself needs a genuine riscv-motivated atomics patch to build on riscv64 at all.
- **Sharding (Vitess) and pooling (ProxySQL, MaxScale) are all orange**, meaning production topologies that depend on horizontal scale-out or protocol-aware proxying have no verified riscv64 path today, even though the underlying engines (MySQL, MariaDB) at least build.
- **Four Redis-family extension modules are red or orange**: RedisBloom and RedisTimeSeries both carry an explicit, hard-coded upstream refusal to build on any architecture but x64/arm64v8; RedisJSON and mcrouter fail or are unverified for similar reasons. Any deployment depending on probabilistic filters, time-series, JSON documents, or Facebook's mcrouter proxy has no riscv64 story.
- **MariaDB ColumnStore is red** with three independently confirmed breakage layers (config-skip, x86 SSE inline assembly, a hard-coded runtime abort naming x86_64/aarch64 as the only supported architectures) -- this is not a testing gap, it is an explicit unsupported-architecture statement.
- **Every Kubernetes-native database operator in scope is orange** (CloudNativePG, Zalando postgres-operator, Percona Operator for MySQL, MySQL Operator for Kubernetes, mariadb-operator, Redis Operator, plus Kubernetes itself, etcd, k3s, and Grafana Alloy). None publish riscv64 images, and several (Zalando, Percona's, MySQL Operator, mariadb-operator, Redis Operator) have no distro package to fall back on either -- the entire "run this database on Kubernetes" motion is currently orange end to end, independent of whether the underlying engine is blue or yellow.

Yellow dominates the picture for the core engines and system libraries: MariaDB, Redis, Memcached, and the majority of System Libraries nodes (LZ4, jemalloc, ICU, libevent, glibc, plus most Prometheus-ecosystem exporters) build and, in several cases, genuinely test on riscv64, but with no upstream CI gate -- meaning a future upstream regression would not be caught before release. Distinct from that, several yellow/blue System Libraries nodes have a real, RVA23U64-relevant SIMD gap even though they build and pass tests: LZ4's primary decompression hot path (`LZ4_FAST_DEC_LOOP`) is scalar-only on riscv64; OpenSSL's AES-GCM path is non-constant-time without Zvkned/Zkn hardware; zstd's HUF decode and sequence-decode fast paths remain scalar; libmvec (glibc's vectorized math library) never builds for riscv64 at all. These are the compression and CRC32C vectorization gaps called out explicitly in the pipeline chains above, and they mean that even "green-looking" parts of the stack are running at reduced throughput on RVA23U64 hardware today.

**Hidden third-party dependency risk.** The large majority of yellow and orange nodes in this report reach riscv64 users only because Ubuntu, Debian, or Alpine chooses to package them -- not because upstream guarantees a riscv64 artifact. If any of these distributions dropped riscv64 packaging, the corresponding node would have no consumable release at all. This applies to, among others: libpq, MariaDB Connector/C (both contexts), MySQL, MariaDB, RocksDB, MyRocks, Galera Cluster, hiredis, Redis, Valkey, redis_exporter, Memcached, etcd, Grafana, zlib, zlib-ng, LZ4, zstd, snappy, jemalloc, PCRE2, ICU, libevent, libnuma, Protocol Buffers, Lua, xxHash, and glibc itself. Separately, **Kubernetes's** own riscv64 release provider is recorded as literally "third-party" (no upstream binary at all; Debian ships only a client-only `kubectl` build). And **containerd's** path to PR-gated riscv64 CI is explicitly contingent on **RISE-hosted CI runners** (PR #13124) being installed and approved by containerd's maintainers -- capacity that already exists but is not yet wired into the merge gate. Any exec narrative that treats "the database builds on riscv64" as durable should be qualified: for most of this stack, durability depends on continued goodwill from Ubuntu/Debian/Alpine packaging teams, not on upstream commitment.

**Actionable next steps, prioritized:**

1. **Get MySQL's riscv64 InnoDB build fix upstream.** This is the single highest-leverage item: Oracle owns the fix (Canonical's patch already exists and works), and merging it converts the vertical's most-used OLTP engine from orange to at least yellow, ahead of everything downstream (Vitess, ProxySQL, MySQL Operator, mysqld_exporter all sit on top of it).
2. **Land the open compression/crypto/checksum vectorization PRs already sitting in upstream review**, rather than starting new work: LZ4 (#1678/#1686/#1739, FAST_DEC_LOOP), zstd (#4622 HUF decode, #4557 sequence-decode), pgvector's RVV distance kernels, and the CRC32C Zbc/Zbkc patches referenced in the pipeline chains. These are the concrete RVA23U64 SIMD-baseline gaps and the code exists; it needs review bandwidth, not new engineering.
3. **Fix or fork the four hard-blocked Redis modules** (RedisBloom, RedisTimeSeries explicit architecture guards; RedisJSON's stale CI ternary; mcrouter's folly dependency). These are small, mechanical CI/build-guard changes relative to their blast radius on caching workloads.
4. **Prioritize Kubernetes-native database operators as a group**, since none of the six database operators in scope currently ship a riscv64 image. A single shared fix -- adding riscv64 to each project's `docker buildx` platform list and CI matrix -- is low-cost per operator (all are pure-Go, CGO-disabled) and would move CloudNativePG, Zalando's operator, MySQL Operator, mariadb-operator, and Redis Operator from orange to at least yellow simultaneously.
5. **Track and, where possible, expand RISE's already-committed capacity** rather than duplicating it: RISE-hosted runners are the identified path to landing containerd's PR-gated riscv64 CI (#13124); the same board-farm/CI-runner model is a natural fit for the six stalled database-operator CI matrices in item 4, and for MySQL's/Vitess's/ProxySQL's currently nonexistent riscv64 CI.
6. **Treat Kubernetes and etcd as upstream blockers, not packaging gaps.** Both remain unresolved at the K8s SIG level (tracking issue #132836 open, untriaged) and gate every downstream operator in this report; Debian's patched, client-only `kubectl` is not a substitute for a deployable riscv64 control plane.