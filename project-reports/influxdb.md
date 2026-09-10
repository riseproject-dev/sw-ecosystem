---
title: InfluxDB
parent: Project Reports
color: orange
dependencies:
  - name: wasmtime
    relation: runtime-dependency
    criticality: critical
  - name: rustls
    relation: runtime-dependency
    criticality: optional
  - name: Apache Arrow
    relation: runtime-dependency
    criticality: critical
  - name: DataFusion
    relation: runtime-dependency
    criticality: critical
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: BLAKE3
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: build-dependency
    criticality: optional
  - name: brotli (Rust crate)
    relation: build-dependency
    criticality: optional
  - name: snappy
    relation: build-dependency
    criticality: optional
  - name: pyo3
    relation: build-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="influxdb" %}

# InfluxDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for InfluxDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

InfluxDB is a time-series database. The repository at [influxdata/influxdb](https://github.com/influxdata/influxdb) currently defaults to **InfluxDB 3 Core**, a complete Rust rewrite (crates under `influxdb3_*`, workspace `Cargo.toml`), superseding the older Go-based 1.x (`master-1.x` branch) and 2.x (`main-2.x` branch, using `go.etcd.io/bbolt`) codebases.

**Governance:** single-vendor, corporate-controlled. There is no neutral foundation (not CNCF, not Apache Software Foundation, not Linux Foundation). The project is owned and directed by **InfluxData, Inc.** No `MAINTAINERS`, `OWNERS`, or `GOVERNANCE.md` file exists in the repo; `.github/CODEOWNERS` contains only boilerplate comments with no configured ownership rules. `CONTRIBUTING.md` requires contributors to sign InfluxData's Individual CLA ([influxdata.com/legal/cla](https://www.influxdata.com/legal/cla/)), and InfluxData staff unilaterally triage and decide what gets merged.

**License:** dual-licensed MIT / Apache-2.0 (permissive), per `LICENSE-MIT` and `LICENSE-APACHE`.

**Top contributors** (from `git shortlog`), all apparently InfluxData employees: Trevor Hilton (93 commits), praveen-influx (39), wayne (29), Phil Bracikowski (26), Michael Gattozzi (24), peterbarnett03 (20), Jamie Strandboge (19), Stuart Carnie (17), Paul Dix (6, InfluxData CEO/founder). No external-company maintainers were identifiable.

**Community culture on new ports:** reactive, not structured. There is no public RFC or tiered-support process, and no `PLATFORMS.md`/`SUPPORT.md` policy document exists. Feature/platform requests are periodically reviewed and accepted or rejected at InfluxData's discretion. There is no evidence of active hostility toward a riscv64 port, but also no evidence of any interest expressed by a maintainer.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-08-28 | InfluxDB 2.x migrates from `boltdb/bolt` import path to `bbolt` (named imports) | [PR #14841](https://github.com/influxdata/influxdb/pull/14841) |
| 2019-09-18 | InfluxDB 2.x fully switches to `etcd-io/bbolt` as the storage dependency | [PR #13917](https://github.com/influxdata/influxdb/pull/13917) |
| 2021-01-20 | Issue opened proposing "Replace boltdb/bolt with etcd-io/bbolt" -- filed after the migration above had already happened; issue remains open/unclosed to date, effectively orphaned | [Issue #20559](https://github.com/influxdata/influxdb/issues/20559) |
| 2022-09-03 | Third-party Alpine Linux packaging bug report is filed; the pasted `APKBUILD` snippet contains `arch="all !riscv64"  # riscv64 blocked by boltdb dependency` -- the only riscv64 reference ever found in the repo's issue history, and it is downstream packaging metadata, not an InfluxData statement | [Issue #23709](https://github.com/influxdata/influxdb/issues/23709) |
| 2026-09-07 | Verification pass confirms `go.mod` on `main-2.x` already depends on `go.etcd.io/bbolt v1.3.6`, not `boltdb/bolt` -- the boltdb blocker claim quoted in #23709 is stale/incorrect as of today | Direct repo inspection, `main-2.x` `go.mod`, this research pass |

**Key contributors to any riscv64 work:** none. No individual or organization (InfluxData or external) has ever authored a riscv64-related commit, PR, or tracking issue in this repository. `search_pull_requests`, `search_commits`, and `search_code` for "riscv"/"riscv64" against `influxdata/influxdb` all return zero results.

**Is it fully upstream?** No. There is no riscv64 code, CI job, or release asset upstream at all. The single downstream artifact that exists (an Ubuntu `.deb`, see Section 8) is not from InfluxData and is not a current build.

## 3. Upstream Support Tier

No formal tier policy exists (no `SUPPORT.md`/`PLATFORMS.md`). In practice, support tiers are defined implicitly by the CircleCI build/release matrix, which InfluxData treats as release-blocking for the architectures it lists.

| Architecture | CI builds | CI tests | Official release binaries | Notes |
|---|---|---|---|---|
| amd64/x86_64 | Yes | Yes | Yes (linux, darwin, windows, .deb, .rpm) | Primary target |
| arm64/aarch64 | Yes | Yes | Yes (linux, darwin, .deb aarch64, .rpm aarch64) | Fully supported, identical release cadence to amd64 |
| riscv64 | No | No | No | Absent from CI matrix and from every recent release's asset list |

Source: [`.circleci/config.yml`](https://github.com/influxdata/influxdb/blob/main-2.x/.circleci/config.yml) (1005 lines) and [`.circleci/packages/config.yaml`](https://github.com/influxdata/influxdb) read directly at HEAD `693b1fd`; target list is exactly `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, `aarch64-apple-darwin`, `x86_64-pc-windows-gnu`/`msvc`. Release asset confirmation via the [GitHub releases page](https://github.com/influxdata/influxdb/releases) (v3.10.0, v2.9.1, v2.9.0, v1.12.4, v3.9.0 all checked).

## 4. Technical Architecture and RISC-V-Specific Subsystems

InfluxDB has **no hand-written, per-architecture source files for any architecture**, not just riscv64. Code search for `GOARCH`, per-arch Go build-tag filenames (`_amd64.go`, `_arm64.go`), and assembly (`extension:s`) against `influxdata/influxdb` all returned zero hits. Multi-architecture support in this project exists entirely at the build/release/CI layer (cross-compiled binaries and a CI asset matrix), not as arch-specific source code.

The current default branch (InfluxDB 3, Rust) does carry architecture-sensitive dependencies at the crate level, most notably a WASM JIT for user-defined-function hosting:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Query execution (DataFusion/Arrow, scalar+SIMD kernels) | Full | Full | Builds via portable scalar fallback; no known blocker (`apache/arrow-rs`, `apache/datafusion` issue search returns zero riscv64 hits) |
| Crypto (`ring`, under `rustls`) | Full | Full | Supported; riscv64gc issues in `briansmith/ring` are closed/resolved ([#2148](https://github.com/briansmith/ring/issues/2148), [#2468](https://github.com/briansmith/ring/issues/2468), [#2520](https://github.com/briansmith/ring/issues/2520)) |
| Hashing (BLAKE3) | Hand-tuned SIMD | Hand-tuned SIMD | Portable/scalar path only; no vector SIMD codepath yet, tracked as a performance (not correctness) gap ([BLAKE3-team/BLAKE3 #484](https://github.com/BLAKE3-team/BLAKE3/issues/484)) |
| WASM JIT for UDF hosting (`wasmtime`/`cranelift-codegen`) | Mature | Mature | **Immature and reported broken on real hardware.** Multiple open, unresolved codegen crashes: [wasmtime #13959](https://github.com/bytecodealliance/wasmtime/issues/13959) (Cranelift crash in riscv64 isle, repros on real Gentoo riscv64gc hardware), [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195) (ISLE panic in `gen_bitcast`), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078) (vxrm/vxsat registers not preserved -- a vector-extension correctness bug), [#9186](https://github.com/bytecodealliance/wasmtime/issues/9186) (`*_overflow` unsupported on riscv64) |
| Allocator (jemalloc) | Full | Full | Packaged and functional (Ubuntu 26.04 riscv64 ships `librust-tikv-jemalloc-sys-dev` etc.); a musl-specific gap exists ([tikv/jemallocator #118](https://github.com/tikv/jemallocator/issues/118)) but does not affect the glibc riscv64 build |

InfluxDB is not itself an optimization-purpose project (it is a database server/runtime, not a SIMD/allocator/compression library whose sole value proposition is raw speed over a naive baseline), so the Step 2 optimization-cap methodology does not apply to InfluxDB as a whole. The wasmtime/Cranelift risk above is a functional/correctness concern for one feature (WASM-hosted UDFs), not a performance-optimization gap.

## 5. Build System, Cross-Compilation, and Toolchain

InfluxDB 3 (current `main`) is a pure Rust/Cargo project. There is no CMake anywhere in the repository (`CMakeLists.txt` and `*.cmake` both absent).

- **Toolchain:** Rust, pinned via `rust-toolchain.toml` to `channel = "1.97.1"` (components: rustfmt, clippy, rust-analyzer, rust-src). No project-specific minimum GCC/Clang version is documented; the project does not compile C/C++ code itself beyond what Rust dependency build scripts invoke via the system `cc`/`clang`.
- **Build commands** (from `CONTRIBUTING.md`):
```
git clone https://github.com/influxdata/influxdb.git
cd influxdb
cargo build                      # default (unoptimized) profile
cargo build --profile release    # optimized release build
cargo build --profile quick-release
cargo build --profile quick-bench
```
- **System dependencies:** a working `python3` install and the `protoc` Protocol Buffers compiler.
- **Docker build** (root `Dockerfile`): base image `rust:1.92-slim-bookworm`, installs `binutils build-essential curl pkg-config libssl-dev clang lld git patchelf protobuf-compiler zstd libz-dev`, then runs `cargo build --target-dir /influxdb3/target --package="$PACKAGE" --profile="$PROFILE" --no-default-features --features="$FEATURES"` with default `FEATURES=aws,gcp,azure,jemalloc_replacing_malloc`.
- **QEMU usage:** none found anywhere in the repository.
- **Known build failures relevant to non-x86/arm64 architectures:** [Issue #22585](https://github.com/influxdata/influxdb/issues/22585) (open) reports the older Go+Rust `libflux` component failing to link on mips64le with `undefined reference to 'fmaf'/'fma'` -- a Rust-std math-intrinsic/libm linkage gap on an uncommon architecture. This is not riscv64 itself but illustrates the same class of risk for any Rust cdylib boundary on less-common targets. No riscv64-specific build failure has ever been reported, because no one has attempted the build (see Section 11).
- **No riscv64 build documentation exists.** `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, and any `docker/Dockerfile.riscv64` do not exist in the repository. A repository-wide, case-insensitive grep for "riscv" across all file types returns zero matches. Anyone building for riscv64 today would need to do so unofficially via plain Rust cross-compilation (`rustup target add riscv64gc-unknown-linux-gnu` plus a suitable linker), entirely undocumented and unsupported by upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles from upstream source | Yes | Yes | Untested by upstream; no upstream CI evidence either way |
| Official release binary | Yes | Yes | No |
| Official Docker image | Yes | Yes | No |
| WASM-hosted UDF feature (processing engine) | Functional | Functional | High risk: `wasmtime`/Cranelift has open, unresolved riscv64 codegen crash bugs on real hardware (Section 4) |
| Hashing performance (BLAKE3) | SIMD-accelerated | SIMD-accelerated | Scalar-only fallback; expected to be slower, though no InfluxDB-specific benchmark exists to quantify the delta (Section 8/11) |
| Security hardening posture | N/A -- no riscv64-specific finding | N/A | No data found either way; not evaluated by any source in this research |
| NaN / floating-point semantics | N/A -- no reported issue | N/A | No riscv64-specific floating-point issue found; note that the *only* open non-x86 architecture issue in the tracker is [#27278](https://github.com/influxdata/influxdb/issues/27278), an ARM64-vs-x86_64 performance comparison (not riscv64, and not FP-semantics related) |

Functional gap: the WASM UDF-hosting feature is the one concretely identified functional risk area for riscv64, rooted in upstream `wasmtime`/Cranelift immaturity on that architecture, not in InfluxDB's own code. Performance gap: cannot be quantified -- no InfluxDB riscv64 benchmark of any kind exists (Section 11). Security-hardening and NaN/floating-point gaps: no data found; not claimed either way.

## 7. CI/CD Infrastructure

**No riscv64 CI exists**, confirmed by direct reads of every CI configuration file present in the repository at HEAD `693b1fd1b96cdcb980cf76a1004c0b3f1b46db48` (2026-09-07):

- `.github/workflows/semantic.yml` -- the only GitHub Actions workflow present. It is a PR-title/commit-message linter (`uses: influxdata/validate-semantic-github-messages/.github/workflows/semantic.yml@main`), triggered on `pull_request: [opened, reopened, synchronize, edited]`. It has no build or test jobs and no runner matrix at all.
- `.circleci/config.yml` (1005 lines) and `core/.circleci/config.yml` (151 lines) -- InfluxDB's actual build/release CI. A direct grep (`grep -in "riscv" .circleci/config.yml .circleci/packages/config.yaml ...`) returns **zero matches**. Extended search for variants (`risc-v`, `riscv64`, `riscv32`, `rv64`, `rv32gc`) likewise returns zero matches.

No RISE runner references (`riseproject-dev`, RISE runner labels) appear anywhere in either CI system. No hardware of any kind is used for riscv64 because no riscv64 job exists.

| Architecture | CI system | Build job | Test job | Release-blocking | Runner |
|---|---|---|---|---|---|
| amd64 | CircleCI | Yes (`x86_64-unknown-linux-gnu`, plus package validation `check_package_deb_amd64`/`check_package_rpm_amd64` via `docker run --platform linux/amd64`) | Yes | Yes | CircleCI executor |
| arm64 | CircleCI | Yes (`aarch64-unknown-linux-gnu`, plus `check_package_deb_arm64`/`check_package_rpm_arm64` via `--platform linux/arm64`) | Yes | Yes | CircleCI executor |
| riscv64 | None | No | No | N/A | N/A |

## 8. Distribution and Release Status

**No official riscv64 binaries from InfluxData.** The last five GitHub releases (v3.10.0, v2.9.1, v2.9.0, v1.12.4, v3.9.0) ship linux amd64/arm64, darwin amd64, windows amd64, `.deb` (amd64/arm64), `.rpm` (x86_64/aarch64) only -- no asset filename in any of them contains "riscv". Source: [influxdata/influxdb releases](https://github.com/influxdata/influxdb/releases).

**PyPI (`influxdb` Python client):** current release 5.3.2, shipped only as a universal wheel (`influxdb-5.3.2-py2.py3-none-any.whl`) plus sdist. This is a pure-Python client with no compiled extensions, so it is architecture-independent and installs on riscv64 by construction; it does not represent a riscv64 build of the InfluxDB server. Full simple-index history (0.1.1 through 5.3.2) contains no riscv-specific artifact, as expected. Source: [pypi.org/pypi/influxdb/json](https://pypi.org/pypi/influxdb/json).

**RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/influxdb/` returns an HTTP 302 redirect straight to upstream PyPI -- RISE has not built a separate wheel for this package (unsurprising, since the PyPI package is already architecture-independent).

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/)): no `influxdb` package listed at all.

**Ubuntu 26.04 (resolute):** the only riscv64 binary package of the InfluxDB server that exists anywhere. Confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=InfluxDB&suite=resolute&searchon=names&section=all) and the direct riscv64 build page ([packages.ubuntu.com/resolute/riscv64/influxdb](https://packages.ubuntu.com/resolute/riscv64/influxdb)):
- Package `influxdb`, version **1.6.7~rc0-2build2**, classified `[ports] [universe]`, built by the Debian Go Packaging Team / Ubuntu MOTU Developers -- a third-party distro repackaging, not an InfluxData artifact.
- This version is roughly eight years old, an InfluxDB 1.6 release *candidate* that predates even the last official 1.x release (1.12.4) cited above and predates the 2019 boltdb-to-bbolt migration context entirely. It has no Flux, no 2.x/3.x API, and does not represent the software currently developed at [influxdata/influxdb](https://github.com/influxdata/influxdb) in any meaningful sense.
- The identical `1.6.7~rc0` version string has been carried unchanged (only Debian-revision bumps, e.g. `-2build2`) across jammy (22.04), noble (24.04), questing, and resolute (26.04) -- consistent with an unmaintained package riding along automatically rather than reflecting deliberate riscv64 enablement or re-verification.
- No evidence was found that this riscv64 build has been confirmed to run correctly. A structurally analogous boltdb runtime failure was documented on s390x in [Issue #22968](https://github.com/influxdata/influxdb/issues/22968) ("unable to open boltdb file invalid database on s390x"), indicating boltdb's byte-order/format sensitivity is a real risk class on uncommon architectures; whether it affects this specific riscv64 build is unverified either way.
- `python3-influxdb` and `python3-influxdb-client` are packaged `[all]` (architecture-independent) -- installable on riscv64 by nature of being noarch, but these are client libraries, not the server.

**What a user must do today to get a working riscv64 InfluxDB binary:** either (a) install the stale, third-party-packaged, eight-year-old Ubuntu `influxdb` 1.6.7~rc0 package with unverified riscv64 runtime correctness, which is not the actively developed codebase, or (b) build InfluxDB 3 from source via unofficial, undocumented Rust cross-compilation (`rustup target add riscv64gc-unknown-linux-gnu`), with no guarantee that all features (notably WASM-hosted UDFs, Section 4) will work correctly. There is no supported path to a current, InfluxData-built riscv64 binary.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| wasmtime / cranelift-codegen | WASM JIT for UDF hosting | Not packaged in Ubuntu 26.04 riscv64; buildable from source but immature backend | Reported broken on real hardware (mid-2026) | Not distro-packaged for any arch | 108 riscv64 issues total in `bytecodealliance/wasmtime`, most open. Highest-risk dependency identified in this research. |
| rustls (+ webpki, native-certs, platform-verifier) | Pure-Rust TLS | Not packaged in Ubuntu 26.04 riscv64 (packaging gap only) | N/A | N/A | Zero riscv64 issues in `rustls/rustls`; appears to be an archive-side packaging gap, not a code blocker -- builds from source via cargo |
| ring 0.17.14 | Crypto backend under rustls | Packaged in Ubuntu 26.04 riscv64 (`librust-ring-dev`) | -- | Packaged | riscv64gc issues [#2148](https://github.com/briansmith/ring/issues/2148), [#2468](https://github.com/briansmith/ring/issues/2468), [#2520](https://github.com/briansmith/ring/issues/2520) all closed/resolved |
| Apache Arrow (arrow-rs) 57.3.0 | Columnar format + SIMD compute kernels | Not distro-packaged for any arch (vendored via cargo) | -- | -- | Zero riscv64-specific bugs found; portable scalar fallback covers riscv64 |
| DataFusion 51.0.0 (InfluxData fork) | SQL/query execution engine | Not distro-packaged | -- | -- | Zero riscv64 issues in `apache/datafusion` |
| tikv-jemalloc (sys/ctl/allocator) | Global allocator, heap profiling | Packaged in Ubuntu 26.04 riscv64 | Likely tested via glibc CI | Packaged | [tikv/jemallocator #118](https://github.com/tikv/jemallocator/issues/118) is musl-only, does not affect Ubuntu's glibc riscv64 build |
| BLAKE3 1.8.5 | Content hashing (catalog/cache layer) | Packaged in Ubuntu 26.04 riscv64 | Runs correctly on real riscv64 hardware (Orange Pi RV2 / SpacemiT X60), scalar path only | Packaged | [BLAKE3-team/BLAKE3 #484](https://github.com/BLAKE3-team/BLAKE3/issues/484) (open): performance-only gap, no vector SIMD codepath yet, roughly 3-5x slower on `xof` benchmarks vs an accelerated architecture |
| zstd 0.13.3 binding | Parquet/object_store compression | Packaged in Ubuntu 26.04 riscv64 (`libzstd-dev`, `libzstd1`) | -- | Packaged | None found |
| brotli 8.0.2 (pure-Rust) | Parquet/object_store compression | Packaged in Ubuntu 26.04 riscv64 | -- | Packaged | None found |
| snap / crc32fast / flate2 | Additional compression codecs | Packaged in Ubuntu 26.04 riscv64 | -- | Packaged | None found |
| PyO3 0.29 | Embeds CPython for the Python processing-engine plugin | Packaged in Ubuntu 26.04 riscv64 (`librust-pyo3-dev`, `python3-dev`) | -- | Packaged | Only 1 issue hit in `PyO3/pyo3` search and it is s390x-related; zero riscv64 issues |
| SQLite / sqlx (libsqlite3-sys 0.30.1, sqlx 0.8.6) | Embedded metadata store | Packaged in Ubuntu 26.04 riscv64 | -- | Packaged | None found |

**Deep dive -- wasmtime/Cranelift (highest-risk dependency):** this is the WASM JIT hosting InfluxDB 3's processing-engine user-defined functions (`datafusion-udf-wasm-host`/`-query` crates). Ubuntu 26.04 does not package `wasmtime`/`librust-wasmtime-dev`/`librust-cranelift-dev` for riscv64 at all (only amd64/arm64), and upstream `bytecodealliance/wasmtime` has multiple **open, unresolved** riscv64 codegen bugs confirmed on real hardware as recently as July 2026, including a vector-extension register-preservation correctness bug ([#13078](https://github.com/bytecodealliance/wasmtime/issues/13078)). This is the dependency most likely to require a workaround (e.g., disabling the WASM UDF feature) for any riscv64 InfluxDB 3.x build attempt.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#20559](https://github.com/influxdata/influxdb/issues/20559) | Replace boltdb/bolt with etcd-io/bbolt | Open (orphaned) | Low (stale) | Migration already completed via [PR #13917](https://github.com/influxdata/influxdb/pull/13917)/[PR #14841](https://github.com/influxdata/influxdb/pull/14841) in 2019; issue never closed. Not a real current blocker. |
| [#23709](https://github.com/influxdata/influxdb/issues/23709) | Build Fails in Alpine Linux | Closed | N/A | Musl static-linking bug (libflux vs musl libc symbol collisions), unrelated to riscv64 except for a quoted, now-stale third-party `APKBUILD` comment |
| [#22968](https://github.com/influxdata/influxdb/issues/22968) | Unable to open boltdb file invalid database on s390x | Closed | Correctness | Demonstrates boltdb's format/byte-order fragility on uncommon architectures -- same dependency class relevant to any legacy-1.x riscv64 build, though not riscv64 itself |
| [#22585](https://github.com/influxdata/influxdb/issues/22585) | Build fail on loongson (mips64le): undefined reference to `fmaf`/`fma` | Open | Build | Rust-std libm linkage gap on an uncommon architecture; same risk class could affect riscv64 cross-compilation of Rust cdylib boundaries, unverified |
| [#27278](https://github.com/influxdata/influxdb/issues/27278) | [v2] Performance comparison between ARM64 and x86_64 for InfluxDB | Open | Info | Not RISC-V; the only open non-x86 architecture performance issue in the tracker, cited here to show the absence of any equivalent riscv64 issue |

**No riscv64-specific issue, PR, or commit exists anywhere in `influxdata/influxdb`** -- confirmed by `search_issues` ("riscv" 0, "riscv64" 5 results with none textually relevant except the quoted APKBUILD in #23709, "risc-v" 0), `search_pull_requests` ("riscv" 0, "riscv64" 0, "boltdb riscv" 0), `search_commits` ("riscv" 0, "riscv64" 0), and `search_code` ("riscv" 0, "riscv64" 0). There is consequently no correctness bug, performance bug, or benchmark to highlight for riscv64 specifically -- the absence reflects lack of any attempted riscv64 usage, not a confirmed-working state.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No InfluxData maintainer has commented on riscv64 anywhere in the issue tracker (the sole quoted riscv64 reference, in #23709, drew zero maintainer response).

**Technical blockers:**
- Primary: riscv64 was simply never added to the CircleCI build/release matrix -- this is a build-matrix gap, not a code-level blocker, as confirmed by direct reading of `.circleci/config.yml`.
- Secondary/real but narrower: the `wasmtime`/Cranelift WASM JIT dependency used for the processing-engine's WASM UDF hosting has open, unresolved upstream riscv64 codegen bugs (Section 9), which would need to be resolved or worked around (e.g., feature-gated off) for a full-featured riscv64 build of InfluxDB 3.
- The historically cited blocker ("riscv64 blocked by boltdb dependency", per the Alpine APKBUILD note quoted in #23709) is **verified stale**: InfluxDB 2.x replaced `boltdb/bolt` with `etcd-io/bbolt` in 2019, years before this note was written, and the current default-branch codebase (InfluxDB 3, Rust) contains no boltdb dependency at all.

**Organizational blockers:** InfluxData is a single-vendor, corporate-governed project with no external contributor community structure and no formal process for adding a new CI target. A riscv64 port would need either an InfluxData engineering decision to extend the CircleCI matrix, or an external contributor to submit and shepherd a PR through InfluxData's CLA-gated, maintainer-controlled review process -- neither has happened to date.

**Acceptance probability:** given the permissive MIT/Apache-2.0 license, the absence of any stated objection, and the fact that most of the Rust dependency stack is already riscv64-clean (Section 9), a well-formed riscv64 CI/build-matrix PR has no apparent technical reason to be rejected. However, with zero prior riscv64 activity, zero RISE involvement, and a purely reactive InfluxData review process, there is no evidence of institutional appetite to prioritize this work absent an external submission.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Ubuntu) -- and this release is a stale, third-party legacy artifact, not a current upstream build
- **Justification:** Upstream `influxdata/influxdb` has no riscv64 CI (`.circleci/config.yml`, direct-read confirmed zero riscv64 references) and publishes no riscv64 release binaries in any of its last five releases ([influxdata/influxdb releases](https://github.com/influxdata/influxdb/releases)). Per the distribution floor rule, the presence of an Ubuntu-packaged `influxdb` riscv64 binary ([packages.ubuntu.com/resolute/riscv64/influxdb](https://packages.ubuntu.com/resolute/riscv64/influxdb)) would ordinarily lift the project to yellow, but that package is an eight-year-old, unmaintained InfluxDB 1.6 release-candidate snapshot with no confirmed patch status and no evidence it has been verified to run correctly -- so the "patch status unknown" condition applies, capping the grade at orange (downstream-only) rather than yellow.
- InfluxDB is not an optimization-purpose project (it is a database server, not a SIMD/allocator/compression library whose sole value proposition is raw computational speed), so the Step 2 optimization-level cap does not apply; Optimization level is omitted from the header per the skill's own scoping rule.
- **Pending work that could change the grade:** none identified. There is no open riscv64 PR, no RISE engagement (InfluxData/InfluxDB is not a RISE member and has no RISE blog coverage, wheel-builder entry, or runner usage), and the only trace of forward motion is an unactioned entry in this repository's own internal project-evaluation backlog (`project-reports/.queue.yml`) queuing InfluxDB as a future candidate for evaluation -- not evidence of any external or upstream activity.

## 14. Investment Analysis

RISE has not funded or performed any work on InfluxDB riscv64 enablement to date (Section 12/13); nothing below is already covered.

### 14.1 Functional Enablement

- Add a `riscv64gc-unknown-linux-gnu` target to the CircleCI build matrix in `.circleci/config.yml` and validate a `cargo build --profile release` completes cleanly.
- Feature-gate or disable the WASM UDF-hosting feature (`wasmtime`/`cranelift-codegen`) on riscv64 until upstream Cranelift riscv64 codegen bugs ([#13959](https://github.com/bytecodealliance/wasmtime/issues/13959), [#13078](https://github.com/bytecodealliance/wasmtime/issues/13078), [#12195](https://github.com/bytecodealliance/wasmtime/issues/12195), [#9186](https://github.com/bytecodealliance/wasmtime/issues/9186)) are resolved, or track and validate upstream fixes as they land.
- Validate the full Rust dependency stack (Arrow, DataFusion, PyO3, sqlx/SQLite, jemalloc, BLAKE3, zstd, brotli) actually builds and passes tests end-to-end on riscv64 hardware -- individual crates look clean per Section 9, but no one has run the full InfluxDB 3 test suite on riscv64.
- Close or update the stale [#20559](https://github.com/influxdata/influxdb/issues/20559) boltdb/bbolt issue to remove the misleading "riscv64 blocked by boltdb" narrative that downstream packagers (Alpine) are still propagating.

### 14.2 Performance Optimization

- Not a current priority: functional enablement has not happened, so there is nothing to optimize yet. Once functional, BLAKE3's lack of a riscv64 vector SIMD codepath ([BLAKE3-team/BLAKE3 #484](https://github.com/BLAKE3-team/BLAKE3/issues/484)) is the one identified, quantifiable-in-principle performance gap (reported 3-5x slower on `xof` benchmarks vs an accelerated architecture), though no InfluxDB-level benchmark exists to translate that into an end-to-end database performance delta.

### 14.3 CI/CD Infrastructure

- Add a riscv64 executor/target to CircleCI (`.circleci/config.yml`, `core/.circleci/config.yml`) mirroring the existing arm64 build+test+package-validation jobs.
- Add riscv64 to `.circleci/packages/config.yaml` for `.deb`/`.rpm` package validation, and to `.circleci/scripts/fetch-python-standalone.bash`'s embedded-Python target-fetch list.
- Determine whether native riscv64 CI hardware (e.g., RISE-provided runners) or QEMU emulation is used, given real-hardware-only reproduction of some Cranelift bugs (Section 9).

### 14.4 Ecosystem Enablement

Not applicable -- Section 10 is omitted per the report template's rule, since InfluxDB (the server) has no significant dependent package ecosystem requiring separate riscv64 enablement; its Python client (`influxdb` on PyPI) is a pure-Python, architecture-independent package that already works on riscv64 by construction.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64gc-unknown-linux-gnu target to CircleCI build matrix, validate clean `cargo build --release` | 1-2 | InfluxData or external contributor | Critical |
| Functional | Validate full Rust dependency stack builds/tests on riscv64 hardware end to end | 2-3 | InfluxData or external contributor | Critical |
| Functional | Feature-gate WASM UDF hosting (wasmtime/Cranelift) off on riscv64 pending upstream fixes | 1 | InfluxData | High |
| Functional | Track/validate upstream wasmtime riscv64 Cranelift bug fixes as they land, re-enable WASM UDF feature | 1-2 (ongoing) | InfluxData or external contributor | Medium |
| CI/CD | Add riscv64 executor and package-validation (deb/rpm) jobs to CircleCI, mirroring arm64 | 1-2 | InfluxData | High |
| CI/CD | Add riscv64 official release assets (linux binary, .deb, .rpm) once CI is green | 0.5-1 | InfluxData | High |
| Ecosystem | Correct/close stale boltdb-blocker narrative in #20559 to stop downstream packagers propagating it | 0.1 | InfluxData | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [influxdata/influxdb repository](https://github.com/influxdata/influxdb)
- [influxdata/influxdb releases](https://github.com/influxdata/influxdb/releases)
- [Issue #23709 -- Build Fails in Alpine Linux](https://github.com/influxdata/influxdb/issues/23709)
- [Issue #20559 -- Replace boltdb/bolt with etcd-io/bbolt](https://github.com/influxdata/influxdb/issues/20559)
- [Issue #22968 -- Unable to open boltdb file invalid database on s390x](https://github.com/influxdata/influxdb/issues/22968)
- [Issue #22585 -- build fail on loongson (mips64le)](https://github.com/influxdata/influxdb/issues/22585)
- [Issue #27278 -- Performance comparison between ARM64 and x86_64 for InfluxDB](https://github.com/influxdata/influxdb/issues/27278)
- [PR #13917 -- fix(bolt): import bbolt as bolt](https://github.com/influxdata/influxdb/pull/13917)
- [PR #14841 -- fix(bolt): use named imports for bbolt](https://github.com/influxdata/influxdb/pull/14841)
- [.circleci/config.yml (main-2.x)](https://github.com/influxdata/influxdb/blob/main-2.x/.circleci/config.yml)
- [.github/workflows/semantic.yml](https://github.com/influxdata/influxdb/blob/main/.github/workflows/semantic.yml)
- [Ubuntu packages.ubuntu.com search -- InfluxDB, resolute suite](https://packages.ubuntu.com/search?keywords=InfluxDB&suite=resolute&searchon=names&section=all)
- [Ubuntu packages.ubuntu.com -- influxdb, resolute/riscv64](https://packages.ubuntu.com/resolute/riscv64/influxdb)
- [PyPI influxdb package JSON](https://pypi.org/pypi/influxdb/json)
- [PyPI influxdb simple index](https://pypi.org/simple/influxdb/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [InfluxData blog -- Apple M1 and RISC-V Support for Telegraf](https://www.influxdata.com/blog/apple-m1-and-risc-v-support-for-telegraf/)
- [FreeBSD ports review -- databases/influxdb2-cli: fix build on riscv64](https://reviews.freebsd.org/D39040)
- [Launchpad Ubuntu jammy/riscv64 influxdb-client package](https://launchpad.net/ubuntu/jammy/riscv64/influxdb-client/1.6.7~rc0-1)
- [InfluxData CLA](https://www.influxdata.com/legal/cla/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder -- influxdb (redirects to PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/influxdb/)
- [bytecodealliance/wasmtime #13959 -- Cranelift crash in riscv64 isle](https://github.com/bytecodealliance/wasmtime/issues/13959)
- [bytecodealliance/wasmtime #12195 -- ISLE panic gen_bitcast](https://github.com/bytecodealliance/wasmtime/issues/12195)
- [bytecodealliance/wasmtime #13078 -- vxrm/vxsat registers not preserved](https://github.com/bytecodealliance/wasmtime/issues/13078)
- [bytecodealliance/wasmtime #9186 -- *_overflow unsupported on riscv64](https://github.com/bytecodealliance/wasmtime/issues/9186)
- [briansmith/ring #2148](https://github.com/briansmith/ring/issues/2148), [#2468](https://github.com/briansmith/ring/issues/2468), [#2520](https://github.com/briansmith/ring/issues/2520)
- [BLAKE3-team/BLAKE3 #484 -- Improved RISC-V support + SIMD](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- [tikv/jemallocator #118 -- Add support for riscv64gc-unknown-linux-musl](https://github.com/tikv/jemallocator/issues/118)
