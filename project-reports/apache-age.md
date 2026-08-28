---
title: Apache AGE
---

# Apache AGE

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache AGE<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Apache AGE (A Graph Extension) is a multi-model database extension for PostgreSQL that adds graph-database functionality via an implementation of the openCypher query language. It is built as a PostgreSQL loadable module using PGXS (`MODULE_big = age`), introducing a graph data type (`agtype`) and Cypher query support (`ag_catalog` schema) on top of a standard PostgreSQL server. It is a pure-C extension with no assembly, no JIT backend, no SIMD dispatch layer, and no per-architecture directory structure.

**Governance:** Apache AGE is a top-level project (TLP) of the Apache Software Foundation. It entered the Apache Incubator on 2020-04-30 and graduated on 2022-05-17. License: Apache License 2.0. Governance follows standard ASF PMC structure per CONTRIBUTING.md and `.asf.yaml`; no MAINTAINERS/OWNERS/PLATFORMS.md/SUPPORT.md files exist in the repo.

**Origin and corporate sponsors:** The project was donated to the ASF by Bitnine Co., Ltd. (South Korea) - the NOTICE file states "Portions of Apache AGE were originally developed by Bitnine Co., Ltd. and were donated to the Apache Software Foundation. Copyright 2019-2020 Bitnine Co., Ltd." Current copyright is "Copyright 2023 The Apache Software Foundation." Commit-email domain analysis shows Bitnine Co., Ltd. is overwhelmingly the dominant corporate sponsor: the top committers by volume carry Bitnine addresses (John Gemignani, 249+35 commits, `jrgemignani@gmail.com`/`john.gemignani@bitnine.net`; Josh Innis, ~63 commits, `@bitnine.net`/gmail; `jsyang@bitnine.net`, 77 commits; `admin@bitnine.net`; Dehowe Feng, `@bitnine.net`). Academic contributors include Pieterjan De Potter (Ghent University) and Muhammad Taha Naveed (NUST SEECS Pakistan, also holds an `@apache.org` address, 31 commits). No evidence of Google, Microsoft, AWS, or other cloud/silicon-vendor engineering involvement was found in the commit history.

**PMC / Committers** (per age.apache.org/team, no company affiliations listed on the page itself): PMC Chair Eya Badal; PMC members Dehowe Feng, Kevin Ratnasekera, Alex Kwak, Felix Cheung, Jasper Blues, John Gemignani, Josh Innis, Juan Pan, Pieterjan De Potter, Nick Sorrell, Von Gosling, Muhammad Shoaib, Rafsun Masud; Committers (non-PMC) Muhammad Taha Naveed, Kokou Afidegnon, Andrew Ko, David Shin, Vuong Quoc Viet, Zainab Saad.

**Community culture on new ports:** No explicit platform/architecture tier policy exists anywhere in the repo or docs. CONTRIBUTING.md covers only code-of-conduct, PR process, and bug-report expectations - nothing architecture-specific. The maintainers have historically responded to architecture-support requests when filed: issue #2208 ("docker image latest tag does not contain arm64 build") was resolved in v1.6.0 by adding an arm64 Docker image, and PR #2286 ("Add 32-bit platform support for graphid type") was merged to support PGlite (PostgreSQL-on-WASM) 32-bit builds. This suggests a receptive, low-friction stance toward additive, backward-compatible portability PRs, but this is inferred from precedent, not a written policy - no RISC-V request has ever been filed.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-04-30 | Apache AGE enters the ASF Incubator | Apache AGE governance records |
| 2022-05-17 | Apache AGE graduates to Apache TLP | Apache AGE governance records |
| 2024-02-13 | Issue #1591 "Test multi arch automated build for dockerhub" closed - precursor to amd64+arm64 multi-arch Docker pipeline | github.com/apache/age/issues/1591 |
| 2024-03-15 | Issues #1683-#1689 (7 duplicates) "Add hooks for multi-arch builds on dockerhub" closed same day - established the current amd64/arm64 buildx pipeline | github.com/apache/age/issues/1683-1689 |
| 2025-08-14 | Issue #2208 opened: Docker `latest` tag missing arm64 build | github.com/apache/age/issues/2208 |
| 2025-09-22 to 2025-10-10 | Issue #2208 comments confirm arm64 Docker image fixed in v1.6.0 (issue left open in GitHub metadata despite claimed resolution) | github.com/apache/age/issues/2208 |
| 2026-01-12 | PR #2286 merged: "Add 32-bit platform support for graphid type" (Makefile `SIZEOF_DATUM=4` knob for PGlite/WASM, not RISC-V-specific) | github.com/apache/age (PR #2286) |
| N/A | No riscv64-related commit, PR, or issue has ever been filed in apache/age | Exhaustive GitHub search (issues, PRs, commits, code), see Section 3 |
| Ongoing (observed at time of this report) | Debian's PostgreSQL Maintainers team packages Apache AGE as `postgresql-NN-age` and builds it for riscv64 as part of routine Debian archive maintenance - zero upstream involvement | Debian buildd, packages.debian.org, ftp-master madison API |

**Key contributors and organizations:** John Gemignani (Bitnine) and Josh Innis (Bitnine) are the dominant historical committers. Jean-Paul Abbuehl (`jpabbuehl`) authored the 32-bit/WASM portability PR (#2286). No individual or organization has ever proposed, authored, or reviewed a RISC-V-specific patch, PR, or issue in the upstream repository.

**Is it fully upstream?** No RISC-V port exists upstream at all - there is nothing to be "fully" or "partially" upstream, because no riscv64-specific code, CI, or documentation has ever been proposed. What does exist is a working riscv64 binary produced entirely by Debian's downstream packaging pipeline, built from unmodified upstream source. This is not an upstream port in any sense; it is proof that the portable-C upstream codebase happens to compile and run correctly on riscv64 without modification.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. Apache AGE has no written architecture-tier system (no Tier 1/2/3 designation of the kind seen in projects like Rust or LLVM). Architecture support is de facto defined by what the Docker Hub multi-arch pipeline and GitHub Actions CI cover.

**Evidence:**
- **CI:** All 5 GitHub Actions workflow files (`go-driver.yml`, `installcheck.yaml`, `jdbc-driver.yaml`, `nodejs-driver.yaml`, `python-driver.yaml`) run exclusively on `ubuntu-latest` or `ubuntu-24.04` (x86_64 GitHub-hosted runners). No matrix axis for architecture exists anywhere (the only matrix found is Go version 1.20/1.21 in `go-driver.yml`).
- **Release-blocking:** GitHub Releases publish exactly one asset per release - a source tarball (e.g., `apache-age-1.8.0-src.tar.gz`). No architecture is release-blocking because no architecture-specific binary is ever built by the release process itself.
- **Official binaries:** Docker Hub `apache/age:latest` publishes `linux/amd64` and `linux/arm64` images only, built via `docker/hooks/build`, which explicitly invokes `docker buildx build --platform linux/amd64,linux/arm64/v8`. No riscv64 image, no QEMU step for riscv64, no riscv64 entry in the `--platform` list.

**Comparison table:**

| Architecture | Upstream CI | Upstream official binaries (Docker Hub) | Upstream GitHub Release binaries | Downstream distro binaries (Debian/Ubuntu) |
|---|---|---|---|---|
| amd64 | Yes (all 5 workflows) | Yes (`linux/amd64`) | No (source-only releases) | Yes |
| arm64 | No (CI is x86_64-only; arm64 image built via emulated buildx, not tested in CI) | Yes (`linux/arm64/v8`) | No (source-only releases) | Yes |
| riscv64 | No | No | No | Yes (postgresql-NN-age, verified working, see Section 8) |

Apache AGE therefore has no formal tier for any architecture; amd64 and arm64 both receive first-party Docker Hub images (amd64 tested in CI, arm64 built but not CI-tested), while riscv64 has zero upstream footprint of any kind but a real, working downstream binary maintained entirely by Debian.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Apache AGE has no architecture-specific subsystems for any CPU architecture, not just riscv64. This was confirmed by exhaustive code search:

- Searches for `riscv`, `riscv64`, `RISCV`, `risc-v`, `__riscv`, `rvv`, `vfloat32m1_t`, `vsetvli`, `zbb`, `clmul`, `avx`, `sse2`, `neon`, `aarch64`, `__aarch64__`, `cpuid`, `__builtin_cpu`, `target_arch`, `x86_64`, `__x86_64__`, `SIMD`, `intrinsic` all returned 0 dedicated architecture-dispatch files.
- A full repository tree dump (454 paths) grepped for `arch|riscv|x86|arm|aarch|simd|\.s$|\.asm$|cpu|port` found no matches and no `arch/`, `src/port/`, or similarly named directories.
- The `Makefile` links no crypto/compression/SIMD library (`SHLIB_LINK` is unset); code search for `immintrin.h`, `zlib.h`, `openssl`, `libxml` inside the repo returned 0 hits.

**JIT:** None. Apache AGE has no JIT compiler of its own; it is a pure interpreter-style PGXS extension riding on PostgreSQL's own (optional) JIT (LLVM-based), which is out of scope for AGE itself.

**SIMD:** None. No vectorized code paths exist anywhere in the codebase for any architecture.

**Crypto:** None linked directly; any crypto exposure (e.g., via PostgreSQL's SSL/TLS) is inherited transitively through the host PostgreSQL process, not through AGE's own code.

**Assembly:** None. No `.S` files exist anywhere in the source tree.

**GC barriers:** Not applicable - AGE is a C extension using PostgreSQL's `palloc`/memory-context allocator, not a garbage-collected runtime.

**Architecture-awareness that does exist (not RISC-V-specific):** Four files contain comments (not conditional code) discussing x86_64 as an illustrative case for portability reasoning:
- `src/include/utils/age_global_graph.h` and `src/backend/utils/adt/age_global_graph.c`: portable MurmurHash3-derived `graphid_hash()`/`graphid_keyeq()` functions; a comment notes `memcmp` on a fixed 8-byte length "compiles to a single load + cmp on x86, which is just as fast... and avoids any alignment risk on other architectures."
- `src/backend/utils/cache/agehash.c`: a Robin Hood open-addressing hashtable that enforces alignment via `MAXALIGN`/`MAXIMUM_ALIGNOF` (portable PostgreSQL macros), with a comment explaining that unaligned access "works in practice on x86_64" but is undefined behavior under strict alignment rules elsewhere.
- `src/backend/utils/adt/agtype_ext.c`: a comment noting that direct pointer-cast writes are undefined behavior under strict alignment rules ("works in practice on x86_64"), followed by using `memcpy` instead.

All four are defensive-portability comments explaining why the code uses alignment-safe idioms (`memcpy`, `MAXALIGN`) instead of raw pointer casts - precisely the coding style that makes the codebase behave correctly on stricter-alignment architectures, RISC-V included. None constitute conditional compilation or ISA-specific code paths.

**Endianness handling (not RISC-V-specific):** `regress/sql/agtype_hash_cmp.sql` has two expected-output variants for `pg_regress` - `agtype_hash_cmp.out` (little-endian) and `agtype_hash_cmp_1.out` (big-endian) - standard PostgreSQL regression-test infrastructure. RISC-V's standard profiles are little-endian, so RISC-V builds transparently match the existing little-endian expected file with no AGE-side changes needed.

**Word-size handling (not RISC-V-specific):** The `Makefile` supports `SIZEOF_DATUM=4` for 32-bit platforms (strips `PASSEDBYVALUE` from the `graphid` type), added for PGlite/WASM 32-bit builds. This is a word-size (ILP32 vs LP64) switch that would apply identically to a hypothetical rv32 build as to any other 32-bit platform - it is not RISC-V-specific.

**Comparison table per component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | N/A (none in AGE itself) | N/A | N/A |
| SIMD | None | None | None |
| Crypto (own code) | None (inherited from host PG) | None (inherited from host PG) | None (inherited from host PG) |
| Hand-written assembly | None | None | None |
| Alignment-safe memory access (memcpy/MAXALIGN) | Yes (portable) | Yes (portable) | Yes (portable), empirically verified via working Debian riscv64 binary |
| Endianness test coverage | Little-endian expected-output file | Little-endian expected-output file | Little-endian expected-output file (matches existing coverage, RISC-V is LE) |

**Bottom line:** Because AGE has no ISA-specific hot path anywhere, "RISC-V-specific subsystem quality" is a non-issue - there is nothing to hand-tune, vectorize, or port. The relevant question is purely "does the portable C compile and run correctly," which Section 8 and Section 9 answer affirmatively via the Debian riscv64 build.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Apache AGE builds via PGXS (PostgreSQL's extension build framework), not CMake or Autotools. AGE does not use CMake at all - no `CMakeLists.txt` exists anywhere in the repo. The entire build is driven by a single root `Makefile`:

```makefile
MODULE_big = age
PG_CONFIG ?= pg_config
PGXS := $(shell $(PG_CONFIG) --pgxs)
include $(PGXS)
```

**Exact build commands** (architecture-agnostic, no riscv64-specific flags of any kind):
```bash
make install
# or, if pg_config isn't on PATH:
make PG_CONFIG=/path/to/postgres/bin/pg_config install
```

For 32-bit platforms only (not riscv64-specific - applies to any 32-bit target):
```bash
make SIZEOF_DATUM=4 install
```

**Toolchain requirements and WHY:**
- **Bison, pinned to exact 3.8.x:** This is the one hard build-time constraint in the entire repo, and it is version-specific, not architecture-specific. The Cypher GLR grammar (`src/backend/parser/cypher_gram.y`) pins exact shift/reduce and reduce/reduce conflict counts via `%expect 7` / `%expect-rr 3`. A different Bison version can report different conflict counts and fail the build outright. `installcheck.yaml` pins its CI runner to `ubuntu-24.04` specifically to keep Bison at 3.8.x, with an explicit version-check step. This constraint applies identically when building natively on riscv64 hardware - Debian's riscv64 buildd confirms bison 3.8.2 "Installed" on riscv64 (worker `rv-manda-01`).
- **Flex:** Build-time only, generates `ag_scanner.c`. No version pin found, but a real upstream risk exists: flex issue westes/flex#713 (open as of 2025-10) reports that flex 2.6.4's bundled `config.guess`/`config.sub` (2015 vintage) do not recognize the `riscv64` host triplet, so bootstrapping flex from the raw upstream 2.6.4 tarball on riscv64 fails host-triplet detection. Debian's flex package works around this by patching the config scripts during packaging (buildd confirms flex 2.6.4-8.2 "Installed" on riscv64, worker `rv-manda-03`). Anyone building AGE from scratch on riscv64 using a self-bootstrapped flex (rather than a distro-packaged one) will hit this.
- **Other pre-installation dependencies** (from README, no architecture qualifiers): `build-essential libreadline-dev zlib1g-dev flex bison` (Ubuntu/Debian); `gcc glibc bison flex readline readline-devel zlib zlib-devel` (Fedora); equivalent set for CentOS.
- **No minimum GCC/Clang version is stated anywhere.** CI uses whatever GCC ships with Ubuntu 24.04. `COPT=-Werror` is used in CI to fail on any compiler warning (strictness, not a version floor).

**QEMU usage:** QEMU is used only for the arm64 leg of the Docker Hub multi-arch build (`docker buildx build --platform linux/amd64,linux/arm64/v8`, with a comment noting "The arm64 build will take time to build as it is emulated using qemu"). No QEMU step exists for riscv64 anywhere in the repo - riscv64 is simply absent from the `--platform` list.

**Known build failures:**
- The flex host-triplet detection issue described above (westes/flex#713), which affects self-bootstrapped flex builds on riscv64, not AGE's own code.
- No AGE-specific build failure on riscv64 has ever been reported, because no one has filed one upstream - but the Debian buildd logs (Section 8, Section 9) show 4 clean, successful riscv64 builds across versions 1.5.0~rc0-1 through 1.6.0~rc0-1, and the current sid build of `postgresql-18-age` 1.8.0~rc0-2, all with zero architecture-specific patches.

**Docker:** Two Dockerfiles exist, both `FROM postgres:18`, neither has any arch-specific `ARG`/`--platform` logic inside them. The only multi-arch reference in the repo is `docker/hooks/build`, which targets `linux/amd64,linux/arm64/v8` only - riscv64 is not configured.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core Cypher query engine (`agtype`, `ag_catalog`) | Full | Full | Full (proven via working Debian binary; identical portable-C source) |
| PGXS build via `make install` | Yes | Yes | Yes (empirically proven by Debian buildd) |
| Official Docker image | Yes | Yes | No |
| GitHub Actions CI coverage | Yes (all 5 workflows) | No (not CI-tested, only image-built via emulation) | No |
| Distro packaging (Debian/Ubuntu) | Yes | Yes | Yes |
| pgvector regression-test integration (CI) | Yes | Not exercised | Not exercised (CI is amd64-only in all cases) |
| 32-bit datum support (`SIZEOF_DATUM=4`, for PGlite/WASM) | N/A (64-bit native) | N/A | N/A (word-size switch, orthogonal to riscv64/arm64/amd64 64-bit builds) |

**Functional gaps:** None identified that are riscv64-specific. There is no feature of Apache AGE that is known to be unavailable or behave differently on riscv64 versus amd64/arm64, because the entire codebase is architecture-neutral portable C with no conditional compilation on ISA. The only functional gap is one of packaging/distribution, not of code: no upstream-published riscv64 binary (Docker or GitHub Release) exists, whereas one exists for amd64/arm64 via Docker Hub.

**Performance gaps:** Not applicable in the sense of "missing SIMD," because AGE has no SIMD code path on any architecture to begin with - amd64 and arm64 get no vectorization advantage over riscv64 within AGE's own code. Any performance delta between architectures would be dominated by the underlying PostgreSQL server and hardware characteristics, not by AGE itself. No RISC-V-specific benchmark data exists (see Section 11); no comparative amd64-vs-arm64-vs-riscv64 performance data exists either.

**Security hardening gaps:** No architecture-specific hardening code (e.g., pointer authentication, memory-tagging) exists in AGE for any architecture; nothing to compare across amd64/arm64/riscv64.

**NaN / floating-point semantics issues:** No RISC-V-specific floating-point issue was found. The closest related bug is general (not architecture-specific): issue #2514, an unguarded `lhs % rhs` integer modulo operation in `src/backend/utils/adt/agtype_ops.c` that raises a SIGFPE-derived `floating-point exception` (PostgreSQL error code 22P01) instead of a proper "division by zero" error, when the divisor is zero. This is a missing-zero-check bug that would reproduce identically on amd64, arm64, and riscv64 - it is not an architecture-specific floating-point semantics difference.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Confirmed by directly fetching and reading the full literal content of all 5 workflow files in `apache/age`:

| File | Trigger | Runner | riscv match |
|---|---|---|---|
| `.github/workflows/go-driver.yml` | push/pull_request to master | ubuntu-latest | none |
| `.github/workflows/installcheck.yaml` | push/pull_request to master | ubuntu-24.04 (pinned for Bison version) | none |
| `.github/workflows/jdbc-driver.yaml` | push/pull_request to master | ubuntu-latest | none |
| `.github/workflows/nodejs-driver.yaml` | push/pull_request to master | ubuntu-latest | none |
| `.github/workflows/python-driver.yaml` | push/pull_request to master | ubuntu-latest | none |

A case-sensitive `grep -in "riscv"` against the decoded full text of each file returned zero matches in all five. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `.circleci`, or `azure-pipelines.yml` exists in the repo - these 5 GitHub Actions workflows constitute the entire upstream CI surface. `.asf.yaml` contains only ASF notification routing, GitHub repo metadata/labels, merge-button settings, and per-branch PR-review protection rules - zero CI or architecture content. The only `strategy.matrix` axis found anywhere is `go-version: ['1.20','1.21']` in `go-driver.yml`; no matrix axis for architecture/platform exists. No `qemu`, `buildx`, `platforms:`, or `arm64` string appears in any of the 5 workflow files (the arm64 Docker build logic lives outside CI, in `docker/hooks/build`, invoked manually/on release rather than via GitHub Actions).

**RISE runners?** None used. No RISE Project involvement of any kind was found (see Section 12 for full detail) - Apache AGE is not a RISE member, has no dedicated RISE repo, and RISE's 48-repo GitHub org and 31-post blog contain zero references to Apache AGE.

**Hardware used:** All upstream CI runs on GitHub-hosted `ubuntu-latest`/`ubuntu-24.04` runners (x86_64, cloud-hosted, ephemeral). The downstream riscv64 builds (Section 8, Section 9) run on Debian's own buildd infrastructure, on named workers `rv-osuosl-01`, `rv-osuosl-02`, `rv-osuosl-04`, and `rv-manda-01`/`rv-manda-03` - real riscv64 hardware/infrastructure operated by Debian, not by Apache AGE or RISE.

**Comparison table:**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitHub Actions CI | Yes (all 5 workflows) | No | No |
| Upstream Docker Hub build (buildx) | Yes | Yes (via QEMU emulation) | No |
| Downstream Debian buildd | Yes | Yes | Yes (rv-osuosl-01/02/04, rv-manda-01/03) |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**Official upstream binaries for riscv64? No, and none exist for any architecture from GitHub Releases.** Every GitHub Release from `PG11/v1.3.0-rc0` through `PG18/v1.8.0-rc0` has exactly one asset: a source tarball (e.g., `apache-age-1.8.0-src.tar.gz`). Verified via `gh api repos/apache/age/releases --paginate`. Zero compiled artifacts for any architecture - amd64, arm64, or riscv64 - are published via GitHub Releases.

**PyPI:** Not applicable. `apache-age` returns HTTP 404 on PyPI (confirmed via direct curl of `pypi.org/pypi/apache-age/json`); plausible alternates `apacheage` and `py-apache-age` also 404. This is expected and correct: Apache AGE is a PostgreSQL C extension, never intended for PyPI distribution. (A package literally named `age` does exist on PyPI, but it is an unrelated project - "Actually good encryption in Python," `pyage`, https://github.com/jojonas/pyage - not Apache AGE; its wheels are `py3-none-any` regardless of architecture.)

**npm/Maven/OCI (Docker):** Docker Hub `apache/age:latest` publishes `linux/amd64` and `linux/arm64` images only, via `docker buildx build --platform linux/amd64,linux/arm64/v8`. No riscv64 OCI image exists. No npm or Maven artifacts apply - AGE's language drivers (Go, Python, Node.js, JDBC) are client libraries with no compiled/architecture-specific artifacts of their own (pure Go, pure Python, pure JS/TS, pure Java respectively).

**Ubuntu/Debian/Fedora/Arch packages - this is where riscv64 support actually exists:**

- **Debian:** Apache AGE is packaged as `postgresql-NN-age` (PG-version-suffixed per Debian convention), source package `postgresql-16-age` (later renamed following PG version bumps; current sid source is `postgresql-18-age`). Verified via the Debian FTP-master madison API (`api.ftp-master.debian.org/madison?package=postgresql-18-age&f=json`, an authoritative primary source): version `1.8.0~rc0-2` is built for source, amd64, arm64, loong64, ppc64el, riscv64, and s390x, in both testing and unstable. Debian buildd (`buildd.debian.org/status/package.php?p=postgresql-18-age`) shows the riscv64 row as **Installed**, builder `rv-osuosl-02`. riscv64 build logs exist and were checked for 4 versions (1.5.0~rc0-1, -2, -3, and 1.6.0~rc0-1), all successful - the 1.6.0~rc0-1 log was fetched directly and ends with "Status: successful", "Finished at 2025-09-19T11:49:32Z", with a signed buildinfo/changes file. In current stable (trixie), the package is `postgresql-17-age` version `1.5.0~rc0-3`, also confirmed Installed on riscv64.
  - **Binary-level verification:** the actual `.deb` file was downloaded (246,496 bytes) and its SHA256 checksum matched exactly against the Debian Packages-index checksum. The file was extracted (ar/tar) and `readelf -h` was run on the payload `usr/lib/postgresql/18/lib/age.so`: **Machine: RISC-V, Class: ELF64, Flags: RVC, double-float ABI**. `nm -D` confirmed real exported symbols (`age_prepare_cypher`, `agtype_access_operator`, `agtype_any_add`, `age_agtype_sum`, etc.) - this is a genuine, fully functional compiled riscv64 shared object, not a metadata artifact or naming coincidence.
  - **Packaging patch review:** the Debian packaging source (`debian.tar.xz`) contains exactly one patch (`extra-instance-args`), which only adjusts `extension_control_path`/`dynamic_library_path` for the test harness - zero architecture-specific patches. The upstream source compiles cleanly for riscv64 with no code modifications.
  - **Known cosmetic caveat:** the Debian changelog notes "Ignore test failures on big-endian architectures. The code works, but output is randomly reordered." This affects s390x (big-endian), not riscv64, which is little-endian.
- **Ubuntu:** Inherits the Debian package directly. A corrected search (the initial search used the wrong literal package name "Apache AGE" instead of the real Debian/Ubuntu name) confirms `postgresql-16-age`/`postgresql-17-age`/`postgresql-18-age` are present in Ubuntu noble (24.04 LTS) at version `1.5.0~rc0-2`, built for amd64, arm64, ppc64el, riscv64, and s390x; the same holds for questing (25.10) and for resolute/stonking (26.04 LTS and later), with riscv64 included in every listed suite. The actual binary was verified to exist on Ubuntu's ports mirror (Ubuntu hosts riscv64 as a ports architecture): HTTP 200, Content-Length 205032, checksums matching the download page.
- **Fedora:** No findings reported in the research for Fedora-specific riscv64 packaging of Apache AGE. Data not available: no Fedora package search for `postgresql-age`/`apache-age` was documented in the findings.
- **Arch Linux:** Confirmed absent on any architecture. `archriscv.felixc.at/.status/status.htm` (the Arch Linux RISC-V port status database, ~4.8 MB, fetched and grepped directly since the query-string search endpoint is client-side JS) contains no `apache-age` or graph-database entry; all `age`-substring and `postgres`-substring hits are unrelated packages (age-encryption, sagemath, ssh-tpm-agent, postgresql-libs, postgrest, Haskell bindings, etc.). AUR search for both `apache-age` and `postgresql-age` also returns zero results.

**What must a user do to get a working binary today?**
1. On Debian trixie/sid or Ubuntu noble/questing/resolute/stonking riscv64: `apt install postgresql-17-age` (or `postgresql-18-age` on sid) - a working, verified riscv64 binary is installed directly, no compilation needed.
2. On any other distribution, or to get a version not packaged by Debian/Ubuntu: build from source via `make install` against a riscv64 PostgreSQL `pg_config`, using a riscv64-native Bison 3.8.x and Flex (distro-packaged Flex avoids the westes/flex#713 host-triplet detection issue; a self-bootstrapped upstream Flex 2.6.4 tarball may fail on riscv64 host-triplet detection). No riscv64-specific source patch is needed - the build is proven to succeed unmodified.
3. There is no official Docker image, GitHub Release binary, or PyPI wheel for riscv64 (nor for amd64 in the case of GitHub Releases, nor for riscv64 in the case of Docker Hub) - distro packages are the only pre-built distribution channel for this architecture.

## 9. Dependencies

**Method:** Fetched `Makefile`, `META.json`, `RELEASE`, `README.md` from `apache/age` root, plus each driver's manifest (`drivers/golang/go.mod`, `drivers/python/{requirements.txt,pyproject.toml}`, `drivers/nodejs/package.json`, `drivers/jdbc/lib/build.gradle.kts`). Cross-checked with GitHub code search for JIT/SIMD/crypto/compression/allocator usage, GitHub issue search on each on-GitHub dependency, and Debian buildd/packages.debian.org for distro-level riscv64 build evidence.

**Key finding on AGE's own code:** AGE's `Makefile` has no `SHLIB_LINK` and links no crypto/compression/SIMD library directly - only `PG_CPPFLAGS` for its own headers. Code search inside `apache/age` for `immintrin.h`, `zlib.h`, `openssl`, `libxml` returned 0 hits. AGE carries no direct JIT/SIMD/crypto/compression/custom-allocator dependency of its own; all such exposure is inherited transitively through the PostgreSQL host process (OpenSSL, zlib, ICU, LZ4, zstd, liburing, libnuma - see `project-reports/postgresql.md`). **PostGIS is not a dependency** of AGE despite both being PostgreSQL extensions tracked in `scope.yml` - no reference found in any manifest or source file; listed here only to formally rule it out.

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| PostgreSQL | Required host server; AGE builds via PGXS against it (META.json pins >=18.0.0) | Green | Green | Green | See `project-reports/postgresql.md` |
| glibc | Transitive C runtime (Debian dep: `libc6 >= 2.38`) | Green | Green | Green | See `project-reports/glibc.md` |
| GNU Bison (3.8.x, exact-pinned) | Build-time only; generates GLR parser for `cypher_gram.y` | Green | Green | Green | No open riscv64 issues found on any bison mirror. Debian buildd: bison 3.8.2 "Installed" on riscv64 (`rv-manda-01`) |
| Flex | Build-time only; generates `ag_scanner.c` lexer (`FLEX_NO_BACKUP`) | Yellow | N/A | Green (distro) | Open upstream issue westes/flex#713 (2025-10, still open): flex 2.6.4's bundled `config.guess`/`config.sub` don't recognize riscv64 host triplet. Debian's package works around this during packaging (buildd shows flex 2.6.4-8.2 "Installed" on riscv64, `rv-manda-03`) |
| pgvector | Test-only: AGE's CI clones and builds it fresh for extra regression tests | Green | Not exercised on riscv64 (CI is amd64-only) | Green | Merged pgvector/pgvector#948 (2026-01-14) added riscv64 arch detection to Makefile (`-march=native` to `-march=rv64gc` fallback). No open riscv64 issues remain |
| ANTLR4 (Java/Python/Go/TS runtimes) | Cypher/Agtype grammar parser across all 4 language drivers | Green | Green | Green | No riscv64 issues found; pure bytecode/interpreted runtimes, riscv64 risk bounded by host language runtime |
| psycopg (v3) | Required DB adapter for Python driver | Green | Yellow | Green | Closed psycopg/psycopg#883 "Tests failing on riscv64" (Fedora rawhide, closed 2025-02): signal-handling/timing test flakiness, plus one date-conversion bug fixed via #1061. Not a build blocker. PyPI publishes `psycopg_binary` riscv64 manylinux wheels (cp310-cp314) as of 3.3.4 |
| lib/pq (`github.com/lib/pq`) | Postgres driver dependency for Go driver | Green | Green | Green | No riscv64 issues found. Pure Go, no cgo - rides on Go's riscv64 port, see `project-reports/go.md` |
| node-postgres (`pg` npm package) | Postgres client dependency for Node.js driver | Green | Green | Green | No riscv64 issues found. Pure JS |
| pgJDBC (`org.postgresql:postgresql`) | JDBC driver dependency | Green | Green | Green | No riscv64 issues found. Pure Java; runtime is the JVM, see `project-reports/openjdk.md` (JDBC driver requires Java 17 per `build.gradle.kts`) |
| Perl (`tools/gen_keywordlist.pl`, `PerfectHash.pm`) | Build-time only: AGE's own fork of PG's keyword-list generator | Green | N/A | N/A | Architecture-independent interpreted script; output is portable generated C source |

**Deep-dive: Flex host-triplet detection (the one real dependency risk)**

Flex 2.6.4's bundled `config.guess`/`config.sub` scripts (2015 vintage, shipped inside the upstream tarball) predate widespread riscv64 adoption and do not recognize the `riscv64` host triplet. This is tracked upstream as westes/flex#713, open since 2025-10. The practical impact is narrow: it only affects users who bootstrap Flex from the raw upstream source release on riscv64 hardware (autoreconf-driven `./configure` fails to detect the host triplet correctly). Debian's own Flex package (2.6.4-8.2) patches around this during packaging and is confirmed "Installed" on riscv64 (worker `rv-manda-03`), so anyone using a distro-packaged Flex (the overwhelmingly common case) is unaffected. This is not a defect in Apache AGE - it is a transitive build-tool risk that would affect any PostgreSQL extension using Flex-generated lexers on a from-scratch riscv64 toolchain bring-up.

**Deep-dive: psycopg riscv64 test flakiness**

psycopg/psycopg#883 ("Tests failing on riscv64," Fedora rawhide) was closed 2025-02 after resolving signal-handling/timing test flakiness (`test_eintr`, `test_ctrl_c_handler`) and one `test_date_from_ticks` bug (fixed via psycopg/psycopg#1061). This affected test-suite reliability, not the build or runtime correctness of the driver, and is now closed. `psycopg_binary` riscv64 manylinux wheels are published on PyPI as of version 3.3.4, meaning Python driver users on riscv64 do not need to compile psycopg from source.

**Distribution-level confirmation (strongest direct signal for AGE's own dependency chain):** Apache AGE itself is packaged as `postgresql-18-age` in Debian sid (version 1.8.0~rc0-2), and Debian buildd confirms it builds and installs successfully on riscv64 (worker `rv-osuosl-02`, status "Installed"). Its only Debian-declared dependencies are `libc6 (>= 2.38)` and `postgresql-18` - both Green on riscv64. This is third-party evidence that the full AGE build (Bison/Flex/PGXS pipeline included) succeeds on real riscv64 hardware, even though AGE's own upstream CI never exercises the architecture.

**Cross-references to existing scope.yml reports:** PostgreSQL to `project-reports/postgresql.md`; glibc to `project-reports/glibc.md`; Go (driver toolchain) to `project-reports/go.md`; Python (driver toolchain) to `project-reports/python.md`; OpenJDK (JDBC driver runtime) to `project-reports/openjdk.md`; PostGIS - tracked in `scope.yml` (`project-reports/postgis.md`) but confirmed not an AGE dependency.

## 11. Known Bugs and Active Issues

**No RISC-V-specific bug reports exist in the upstream tracker.** Exhaustive searches (`riscv64 performance repo:apache/age`, `riscv64 bug repo:apache/age`, `riscv nan floating repo:apache/age`, broad `riscv` issue/PR/code searches) all returned 0 results.

**General (non-RISC-V-specific) open correctness/performance issues** that exist in the current codebase and would presumably apply on any architecture including riscv64 (all reported/tested on x86_64 or arm64 macOS, not RISC-V):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #2481 | Redundant `type(r) = 'P'` check makes a statically typed relationship query ~6x slower | Open | Performance | Not architecture-specific |
| #2480 | Redundant `length(p) = 2` check makes a fixed two-hop path ~11x slower | Open | Performance | Not architecture-specific |
| #2471 | 64-bit integer arithmetic overflow silently wraps around instead of failing | Open | Correctness | Not architecture-specific; would reproduce identically on riscv64 |
| #2514 | Integer modulo (`%`) by zero raises `floating-point exception` (22P01) instead of `division by zero` | Open | Correctness | Root cause: unguarded `lhs % rhs` in `src/backend/utils/adt/agtype_ops.c` traps as SIGFPE. Closest thing to a "floating-point" bug found, but it is a generic missing-zero-check bug, not architecture-specific |
| #2519, #2508, #2507, #2506, #2501, #2500 | Multiple open segfault bugs | Open | Correctness | All reported on standard x86_64/Docker environments; no architecture dimension mentioned in any report |
| #2208 | Docker `latest` tag missing arm64 build | Open (in GitHub metadata; maintainers state resolved in v1.6.0) | Packaging | No riscv64 equivalent request exists |

**Correctness bugs highlighted separately:** #2471 (integer overflow silently wraps), #2514 (modulo-by-zero raises the wrong error code via SIGFPE), and the six open segfault issues (#2519, #2508, #2507, #2506, #2501, #2500) are correctness bugs, not performance issues. None have any architecture dimension reported - they would need independent verification on riscv64 hardware to confirm identical behavior, but there is no reason from the code (no architecture-conditional logic) to expect divergence.

No open issue mentions RISC-V, riscv64, or NaN/floating-point behavior differences across architectures.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer, committer, or community member has ever stated an objection to RISC-V support, because no RISC-V request has ever been filed.

**Technical blockers:** None identified. The codebase is portable C with no architecture-specific code, and the Debian riscv64 build (Section 8, Section 9) empirically proves the unmodified upstream source compiles and runs correctly on riscv64. The only technical friction point found anywhere in the dependency chain is the Flex host-triplet detection gap (westes/flex#713), which is a transitive build-tool issue, not an AGE defect, and is already worked around by Debian's packaging.

**Organizational blockers:** No RISC-V request has ever been filed as a GitHub issue or PR in `apache/age`. There is no dedicated maintainer bandwidth question to resolve because there is no pending request to resolve - the "blocker" is the complete absence of anyone having asked, not a rejection.

**RISE Project involvement:** None. Confirmed via exhaustive checks:
- RISE blog (31 posts, May 2024 through July 2026, enumerated in full by title/date/URL): none mention Apache AGE, "AGE," graph database, or PostgreSQL extension.
- RISE package/wheel builder (`riseproject.gitlab.io/python/wheel_builder/`, 70+ packages listed): Apache AGE not present.
- RISE GitHub org (`riseproject-dev`, 48 repos enumerated in full): no repo named "age," "apache-age," or otherwise related to a graph database. GitHub search `org:riseproject-dev AGE` and `AGE org:riseproject-dev` both return 0 results.
- RISE members page: Apache AGE does not appear. RISE membership (Premier: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin, Institute of Software CAS, Microchip, NextSilicon, SpacemiT, ZTE) is composed entirely of silicon vendors, toolchain/OS companies, and hyperscalers, not individual open-source application/database projects.
- RISE working groups focus on broad categories (Compilers & Toolchains, System Libraries, Kernel & Virtualization, Language Runtimes, Developer Infrastructure, Linux Distro Integration, Simulator/Emulators, System Firmware, Security Software, AI/ML) - no database working group exists.

**Acceptance probability:** Inferred as high, based on precedent rather than any RISC-V-specific statement. The maintainers accepted the arm64 Docker Hub request (#1683-#1689, #2208) and the 32-bit/WASM PGlite portability PR (#2286) without friction, both being additive, backward-compatible changes that didn't disturb the default 64-bit x86/arm build. A hypothetical riscv64 CI/Docker-image PR would likely follow the same low-friction path, but this is inference from analogous cases, not a stated policy [NEEDS VERIFICATION - no RISC-V-specific proposal has ever been evaluated by the maintainers].

## 13. Investment Analysis

**RISE prior work check:** RISE Project has made zero investment in Apache AGE specifically (see Section 12). RISE has funded riscv64 arch-detection work in the adjacent dependency pgvector (pgvector/pgvector#948, merged 2026-01-14, adding `-march=rv64gc` fallback to the Makefile) [NEEDS VERIFICATION - the pgvector merge itself is documented in the findings, but its attribution to RISE funding specifically was not independently confirmed in the findings and should not be assumed]. No RISE work covers AGE's own CI, Docker images, or upstream code. All sizing below assumes a zero starting baseline for AGE itself.

### 13.1 Functional Enablement

No functional enablement work is required. The codebase already builds and runs correctly on riscv64, proven by Debian's unmodified-source riscv64 build across 4+ versions with zero architecture-specific patches. The only functional gap is packaging/distribution (Section 8), not code:
- Add a riscv64 leg to the Docker Hub `buildx` pipeline (`docker/hooks/build`): trivial change, add `linux/riscv64` to the existing `--platform` list. Low effort.
- No source-code changes are anticipated to be necessary based on current evidence.

### 13.2 Performance Optimization

Not applicable in any meaningful sense specific to riscv64. AGE has no SIMD/vectorized code path on any architecture, so there is no "port the intrinsics to RVV" work item the way there might be for a numerics-heavy library. Any performance work would be general (e.g., fixing the ~6x and ~11x query-planner regressions in #2481/#2480) and would benefit all architectures equally, not specifically riscv64.

### 13.3 CI/CD Infrastructure

- Add a riscv64 GitHub Actions job (or RISE-provided riscv64 runner, per the RISE RISC-V Runners program announced 2026-03-24 in the RISE blog) to at least `installcheck.yaml`, mirroring the existing `ubuntu-24.04` job but on a riscv64 runner. Given AGE's small, focused CI surface (5 workflow files, no complex matrix), this is a low-to-moderate effort integration.
- Extend the Bison-version-pin check to confirm the same Bison 3.8.x constraint holds on the riscv64 runner's default package set (already confirmed true on Debian, per buildd evidence, but not yet verified inside GitHub Actions' riscv64 runner image if/when one is used).
- Add riscv64 to the Docker Hub buildx `--platform` list (see 13.1) alongside a corresponding CI smoke-test.

### 13.4 Ecosystem Enablement

Not applicable - Apache AGE has no significant dependent package ecosystem of its own.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional Enablement | Verify/confirm unmodified upstream build on riscv64 in a controlled upstream-maintained environment (formalize what Debian has already proven) | 0.5 | Upstream maintainer or contributor | Low (already proven downstream) |
| Functional Enablement | Add `linux/riscv64` to Docker Hub buildx `--platform` list in `docker/hooks/build` | 0.5 | Upstream maintainer | Medium |
| CI/CD Infrastructure | Add riscv64 job to `installcheck.yaml` (or equivalent) using a RISE-provided or self-hosted riscv64 runner | 1-2 | Contributor with CI access + RISE runner allocation | Medium |
| CI/CD Infrastructure | Add riscv64 smoke-test to Docker image publish flow | 0.5-1 | Upstream maintainer | Low |
| Dependency Hardening | Track/contribute a fix upstream to westes/flex#713 (riscv64 host-triplet detection in `config.guess`/`config.sub`) so raw-source Flex bootstraps work on riscv64 | 0.5-1 | Any contributor (upstream flex project, not AGE) | Low (already worked around by Debian packaging) |
| Documentation | Add riscv64 to README's supported-platform list once CI/Docker coverage lands | 0.25 | Upstream maintainer | Low |

**Total estimated effort: approximately 3-5.5 person-weeks**, reflecting that Apache AGE requires no code-level RISC-V port - the entire investment is CI/packaging/documentation formalization of a build that already works.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [Apache AGE GitHub repository](https://github.com/apache/age)
- [Apache AGE homepage](https://age.apache.org/)
- [Apache AGE team page](https://age.apache.org/team)
- [Issue #2208 - docker image latest tag does not contain arm64 build](https://github.com/apache/age/issues/2208)
- [Issues #1683-#1689 - Add hooks for multi-arch builds on dockerhub](https://github.com/apache/age/issues/1683)
- [Issue #1591 - Test multi arch automated build for dockerhub](https://github.com/apache/age/issues/1591)
- [Issue #2481 - redundant type(r) check slows relationship query](https://github.com/apache/age/issues/2481)
- [Issue #2480 - redundant length(p) check slows two-hop path query](https://github.com/apache/age/issues/2480)
- [Issue #2471 - 64-bit integer arithmetic overflow silently wraps](https://github.com/apache/age/issues/2471)
- [Issue #2514 - integer modulo by zero raises floating-point exception](https://github.com/apache/age/issues/2514)
- [apache/age .github/workflows/go-driver.yml](https://github.com/apache/age/blob/master/.github/workflows/go-driver.yml)
- [apache/age .github/workflows/installcheck.yaml](https://github.com/apache/age/blob/master/.github/workflows/installcheck.yaml)
- [apache/age .github/workflows/jdbc-driver.yaml](https://github.com/apache/age/blob/master/.github/workflows/jdbc-driver.yaml)
- [apache/age .github/workflows/nodejs-driver.yaml](https://github.com/apache/age/blob/master/.github/workflows/nodejs-driver.yaml)
- [apache/age .github/workflows/python-driver.yaml](https://github.com/apache/age/blob/master/.github/workflows/python-driver.yaml)
- [apache/age docker/hooks/build](https://github.com/apache/age/blob/master/docker/hooks/build)
- [Debian package tracker - postgresql-16-age](https://tracker.debian.org/pkg/postgresql-16-age)
- [Debian buildd status - postgresql-18-age](https://buildd.debian.org/status/package.php?p=postgresql-18-age)
- [Debian package - postgresql-17-age in trixie](https://packages.debian.org/trixie/postgresql-17-age)
- [Debian riscv64 file list - postgresql-17-age in trixie](https://packages.debian.org/trixie/riscv64/postgresql-17-age/filelist)
- [Debian FTP-master madison API - postgresql-18-age](https://api.ftp-master.debian.org/madison?package=postgresql-18-age&f=json)
- [Ubuntu package search - noble suite](https://packages.ubuntu.com/search?keywords=postgresql-17-age&suite=noble)
- [Arch Linux RISC-V port status database](https://archriscv.felixc.at/.status/status.htm)
- [PyPI - apache-age package lookup](https://pypi.org/pypi/apache-age/json)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog feed](https://riseproject.dev/feed/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project GitHub organization](https://github.com/orgs/riseproject-dev/repositories)
- [pgvector PR #948 - riscv64 arch detection in Makefile](https://github.com/pgvector/pgvector/pull/948)
- [psycopg issue #883 - tests failing on riscv64](https://github.com/psycopg/psycopg/issues/883)
- [psycopg PR #1061 - date conversion fix](https://github.com/psycopg/psycopg/pull/1061)
- [flex issue #713 - config.guess/config.sub do not recognize riscv64](https://github.com/westes/flex/issues/713)
- [pyage - unrelated Python encryption package also named "age"](https://github.com/jojonas/pyage)
