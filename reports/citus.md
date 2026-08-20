---
title: Citus
---

# Citus

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Citus<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Citus is a PostgreSQL extension that transforms PostgreSQL into a distributed database, adding sharding, distributed query planning, and columnar storage on top of a standard PostgreSQL server. It is a pure C extension built via PostgreSQL's PGXS build system, not a standalone database engine.

**Governance:** Citus has no independent foundation. It is owned outright by Microsoft ("Citus Data, a Microsoft Company," per citusdata.com), with no separate non-profit board or steering committee - governance is de facto corporate, not community-based. License is AGPL-3.0. The NOTICE file attributes vendored third-party code (Intel `safestringlib`, PostgreSQL itself, Cisco code, `libbacktrace`) and routes open-source-compliance requests to Microsoft's Source Code Compliance Team. Contributors must sign the Microsoft CLA per CONTRIBUTING.md, and the project follows the Microsoft Open Source Code of Conduct. No MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md, SUPPORT.md, or docs/platforms/ files exist in the repo (all 404).

**Corporate contributors** (by commit count and GitHub profile company field):

| Contributor | Commits | Company |
|---|---|---|
| Onder Kalaci (onderkalaci) | 817 | Not listed, long-time Citus core team |
| Onur Tirtir (onurctirtir) | 560 | Microsoft |
| Marco Slot (marcoslot/marcocitus) | 525+401 | Citus Data / Microsoft; recent commit emails show `marco.slot@snowflake.com` |
| Jelte Fennema-Nio (JelteF) | 385 | @motherduckdb (departed Microsoft) |
| Talha Nisanci (SaitTalhaNisanci) | 313 | Microsoft |
| Jason Petersen (jasonmp85) | 306 | @DataDog |
| Hanefi Onaldi (hanefi) | 304 | @supabase (email still @microsoft.com) |
| Murat Tuncer (mtuncer) | 195 | Microsoft |
| Naisila Puka (naisila) | 220 | Snowflake |
| Nils Dijk (thanodnl) | 160 | Microsoft |
| Hadi Moshayedi (pykello) | 195 | @ubicloud |
| Brian Cloutier (lithp) | 127 | Ethereum Foundation |
| Aykut Bozkurt | 89 | Snowflake |
| Ibrahim Halatci (ihalatci) | 14 (recent, high-signal) | Microsoft - currently the most active committer on cross-architecture/packaging work |

A notable pattern: several long-time Citus/Microsoft engineers have moved to other database companies (Snowflake, MotherDuck, Supabase, Ethereum Foundation) while continuing to contribute, but the project remains Microsoft-controlled, and Microsoft engineers (onurctirtir, SaitTalhaNisanci, mtuncer, thanodnl, ihalatci) do the majority of current work, especially all recent architecture-support PRs.

**RISE membership:** not a member. Checked riseproject.dev/members directly - Premier members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members are Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, SpacemiT, ZTE. Neither Citus, Citus Data, nor Microsoft appears. Microsoft is a known RISC-V International member in other contexts, but that is unrelated to RISE and does not cover Citus specifically.

**Community culture on new ports:** Citus has an explicit, official policy of not supporting non-x86_64 architectures. Maintainer ihalatci (Microsoft) stated directly on [issue #7851](https://github.com/citusdata/citus/issues/7851) (closed 2025-02-25): "We do not plan on supporting ARM architectures. Please feel free to report any Citus related issues that you would run into, we would do our best to help, but we are not officially supporting the platform." This is the clearest, most authoritative maintainer statement on Citus's non-x86_64 stance, and by extension governs how a RISC-V request would likely be received, since RISC-V has never even reached the point of a tracking issue. A very recent (July-August 2026) effort has begun to add cautious, feature-flag-gated ARM64 packaging (see Section 2), but this remains ARM64-only with no RISC-V mention anywhere in its scope.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port history. Exhaustive search across GitHub issues, PRs, commits, discussions, and code search - scoped to `citusdata/citus` and the entire `citusdata` GitHub organization (69 repos, including `citusdata/postgres` and `citusdata/packaging`) - found zero results for "riscv", "riscv64", or "risc-v" in any state. The only occurrence of the string "riscv" anywhere in the codebase is a generic, unmodified GNU Autoconf `config.guess` boilerplate line (`riscv32:Linux:*:* | riscv64:Linux:*:*)`), imported wholesale from upstream GNU config as part of an unrelated commit and never touched by Citus engineers since.

| Date | Event | Source |
|---|---|---|
| 2017-10-12 | Commit `8544878c4b2e752d2b03df47f5ee5f58a3b6bc5b` ("Add citus_version(), analogous to PG's version()") by Jason Petersen imports the entire upstream GNU `config.guess` script verbatim for host-triplet reporting. RISC-V detection was already present in that upstream script at import time; it was not added by Citus and has never been modified since. | [config/config.guess](https://github.com/citusdata/citus/blob/main/config/config.guess) |
| 2020-07-12 | Commit `d05c6c55b` ("vendor libbacktrace") by Sait Talha Nisanci brings in a second copy of the same generic `config.guess` under `vendor/libbacktrace/`, again carrying the riscv32/riscv64 case through from upstream unmodified. | GitHub commit history |
| 2020-05-24 | Issue [#3854](https://github.com/citusdata/citus/issues/3854) "ARM architecture support" opened; still open 6+ years later as of this research. | [issue #3854](https://github.com/citusdata/citus/issues/3854) |
| 2021-06-20 | Issue [#5063](https://github.com/citusdata/citus/issues/5063) "arm64 package and docker image?" opened. Maintainer gurkanindibay (2021-06-23): "Currently arm64 support is not in our plans." | [issue #5063](https://github.com/citusdata/citus/issues/5063) |
| 2025-01-18 to 2025-02-25 | Issue [#7851](https://github.com/citusdata/citus/issues/7851) "Citus support for non-x86_64 architectures" opened and closed; maintainer ihalatci states plainly Citus does not plan to support ARM architectures and is "not officially supporting the platform." | [issue #7851](https://github.com/citusdata/citus/issues/7851) |
| 2025-01-12 | Issue #5063 closed after a third-party community packager (Vonng, via the Pigsty project, ext.pigsty.io) independently produces unofficial aarch64/x86_64 RPM/DEB packages - not an official Citus resolution. | [issue #5063](https://github.com/citusdata/citus/issues/5063) |
| 2026-06-06 | Issue [#8612](https://github.com/citusdata/citus/issues/8612) "Please provide an arm64 Docker image as well" opened; still open, unaddressed as of this research. | [issue #8612](https://github.com/citusdata/citus/issues/8612) |
| 2026-08-12 | `citusdata/tools#414` merged (buildx multi-arch support for Alpine Docker images) and `citusdata/packaging#1198` merged (gated arm64 nightly .deb leg) - both ARM64-only, gated behind `DOCKER_BUILD_MULTI_ARCH`/`DEB_BUILD_MULTI_ARCH` flags, no RISC-V involvement. | [citusdata/tools#414](https://github.com/citusdata/tools/pull/414), [citusdata/packaging#1198](https://github.com/citusdata/packaging/pull/1198) |

**Key contributors to non-x86_64 work (all ARM64, none RISC-V):** ihalatci (Microsoft) is the sole active driver of the 2026 ARM64 packaging effort. No individual or organization has opened a RISC-V tracking issue, PR, or discussion at any point in the project's history.

**Is it fully upstream?** Not applicable for RISC-V specifically, since no port exists. For context, even the more mature ARM64 effort is not fully upstream: it is gated off by default via feature flags (`DEB_BUILD_MULTI_ARCH`, `DOCKER_BUILD_MULTI_ARCH`) and several packaging PRs (#1204-#1207) remain open/unmerged as of this research.

## 3. Upstream Support Tier

**Formal tier policy:** Citus has an explicit, official policy of not supporting non-x86_64 architectures. Maintainer ihalatci (Microsoft) on [issue #7851](https://github.com/citusdata/citus/issues/7851) (2025-02-25): "We do not plan on supporting ARM architectures... we are not officially supporting the platform." No tier document exists (no PLATFORMS.md or equivalent); the policy is expressed only through issue-comment precedent. There is no RISC-V-specific statement, but the ARM64 decline is the governing precedent and RISC-V has never even reached the point of a tracking issue.

**Evidence:**
- **CI:** No riscv64 (or any non-x86_64) CI leg exists. All 7 GitHub Actions workflow files (`build_and_test.yml`, `codeql.yml`, `devcontainer.yml`, `flaky_test_debugging.yml`, `nightly_cassert.yml`, `packaging-test-pipelines.yml`, `run_tests.yml`) run exclusively on `ubuntu-latest`/`ubuntu-22.04` GitHub-hosted runners, verified by direct content fetch and case-insensitive grep for "riscv" and "risc" (zero matches) across all workflow files, all 5 composite actions, and both packaging scripts.
- **Release-blocking:** Not applicable; there is no architecture matrix in CI to block on.
- **Official binaries:** None for any non-x86_64 architecture. Citus's own apt/yum repos (`packagecloud.io/citusdata/community`, `install.citusdata.com/community/deb.sh`) publish amd64 only; the install script contains an explicit `arch_check()` function that hard-fails with "the Citus repository does not contain packages for non-x86_64 architectures" on any `uname -m` other than `x86_64`. The published Docker Hub image (`citusdata/citus`, built from `citusdata/docker/Dockerfile`) is `linux/amd64` only across every tag.

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official CI coverage | Yes (all 7 workflows, `ubuntu-latest`) | No | No |
| Official binary packages (deb/rpm) | Yes (packagecloud.io/citusdata/community) | No (blocked by `arch_check()` in install script) | No |
| Official Docker image | Yes (`linux/amd64`) | No | No |
| Third-party community packages | N/A (redundant with official) | Yes (Pigsty project, ext.pigsty.io, unofficial) | None found |
| Maintainer support stance | Official, default | Explicitly declined ("not officially supporting the platform," #7851); cautious opt-in ARM64 packaging work started July 2026, gated off by default | No stance exists; never requested |
| Known correctness issues surfaced | N/A (baseline) | Yes: stack-buffer-overflow bug (#7933/#7515/PR #7950), surfaced only by arm64's stricter stack-protector behavior | Unknown; untested |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Citus contains no CPU-architecture-specific subsystems of its own. This was confirmed by an adversarial code-level audit of the entire repository:

- No `arch/`, `port/`, or `cpu/` subtree anywhere in Citus's own source (`src/include/` contains only `columnar/`, `distributed/`, `pg_version_compat.h`, `pg_version_constants.h`; `src/backend/` contains only `columnar/` and `distributed/`).
- No hand-written assembly: zero `.S`/`.s` files anywhere in the repository.
- No SIMD/intrinsics usage: searches for `immintrin.h`, `arm_neon.h`, `riscv_vector.h`, `simd`, `crc32`, `bswap`, `__builtin_popcount`, `__builtin_clz`, `vfloat32m1_t` all returned zero matches.
- No architecture preprocessor guards: searches for `__riscv`, `__x86_64__`, `__aarch64__`, `__arm__` all returned zero matches; `amd64` and `x86_64` string searches each returned exactly one hit, both the same `config/config.guess` boilerplate line.
- No JIT of its own: `pg_atomic` appears in 5 files, but these are calls into PostgreSQL core's portable atomics abstraction, not Citus-authored architecture code. Citus's own `shard_pruning.c` contains clang-specific pragma handling tied to PostgreSQL's `--with-llvm` JIT bitcode compilation, but this is a build-flag interaction, not Citus architecture code.
- Vendored code (`vendor/safestringlib`, Intel's hardened string library, statically linked as `libsafestring_static.a`) is also architecture-agnostic pure portable C with zero per-architecture `#ifdef` branches (confirmed by reviewing `mem_primitives_lib.c` directly).

### Comparison table per component: amd64 vs arm64 vs riscv64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned assembly (Citus-authored) | None | None | None |
| SIMD/intrinsics (Citus-authored) | None | None | None |
| JIT (Citus-authored) | None (inherited from PostgreSQL core JIT) | None (inherited) | None (inherited) |
| Crypto/GC barriers (Citus-authored) | Not applicable; Citus has no GC and delegates SSL/crypto to OpenSSL via PostgreSQL | Not applicable | Not applicable |
| Atomics (Citus-authored) | None (uses `pg_atomic`, a PostgreSQL core abstraction) | None | None |

**Conclusion:** riscv64 architecture support in Citus is rated missing, but this is not distinguishable from arm64, which is also rated missing at the code level (0 architecture-specific files for either). The practical difference between arm64 and riscv64 is entirely in CI/packaging/community engagement (Section 3, Section 7), not in source code, since Citus has no per-architecture code layer to begin with.

## 5. Build System, Cross-Compilation, and Toolchain

Citus is built with autoconf plus PostgreSQL's PGXS, not CMake. Confirmed by fetching `configure.ac` (284 lines, no arch-specific logic), `Makefile`, `Makefile.global.in` (PGXS-based, `include $(PGXS)`), and `config/config.guess`/`config/general.m4` (standard GNU autotools infrastructure). `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, and a top-level `CMakeLists.txt` are all confirmed absent (404); there is no `docs/` directory in the repo at all.

The only `CMakeLists.txt` in the whole repository belongs to the vendored third-party dependency `vendor/safestringlib/CMakeLists.txt` (Intel's safestringlib, manually vendored per `vendor/README.md`, not a submodule). It contains zero riscv/architecture-specific logic - only generic GCC feature flags (`-fstack-protector-strong`, `-D_FORTIFY_SOURCE=2`, `-mmitigate-rop` gated on GCC version), applied unconditionally without a compiler-support probe, unlike the main `configure.ac`, which uses `CITUSAC_PROG_CC_CFLAGS_OPT` to test flags before adding them.

**Documented build (from CONTRIBUTING.md, identical for all architectures, no riscv64 variant exists):**
```bash
git clone https://github.com/citusdata/citus.git
cd citus
PG_CONFIG=/path/to/pg_config ./configure
make clean   # if previously built
make
sudo make install       # or: sudo make install-all
```

**CI's actual build script (`ci/build-citus.sh`), also architecture-agnostic:**
```bash
CFLAGS=-Werror ./configure PG_CONFIG="/usr/lib/postgresql/${PG_MAJOR}/bin/pg_config" \
    --enable-coverage --with-security-flags
make -j$(nproc) && make DESTDIR="${installdir}" install-all
```

No `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, or any `cmake/` directory exists - there is nothing to cross-compile with, since there is no CMake build for Citus itself.

**Toolchain version requirements (generic, not riscv-specific):** the RPM spec in `citusdata/packaging` (`citus.spec`) hard-checks `requiredgccver="4.8.2"` ("ERROR: At least GCC version 4.8.2 is needed to build with security flags"), a blanket minimum unrelated to RISC-V. `configure.ac` does not hardcode a GCC/Clang version; it dynamically probes flag support via `CITUSAC_PROG_CC_CFLAGS_OPT` (for example, `-fstack-clash-protection` is only added if the compiler accepts it). No RISC-V ISA/extension requirement (`rv64gc`, `-march=rv64gc`, etc.) appears anywhere in the repository.

**`--with`/`--without` flags (the autoconf equivalent of `-DUSE_X=OFF`; no CMake `-D` flags exist):**
```
--with-extra-version=STRING     append STRING to version
--with-pg-version-check=no      skip PG major-version compatibility check
--with-lz4=no / --without-lz4   disable lz4 support (else AC_MSG_ERROR if lib/header missing)
--with-zstd=no / --without-zstd disable zstd support (else AC_MSG_ERROR if lib/header missing)
--with-security-flags=yes       opt-in extra hardening flags (off by default)
```
None of these are architecture-gated; none mention riscv64.

**Dockerfiles:** only two exist in the entire `citusdata` organization, neither riscv64-related. `citusdata/citus/.devcontainer/Dockerfile` (`FROM ubuntu:22.04`, builds PostgreSQL 16/17/18 via `pgenv`, amd64-implicit devcontainer only). `citusdata/docker/Dockerfile` (the published `citusdata/citus` Docker Hub image, `FROM postgres:18.4`, installs a prebuilt `.deb` via `curl -s https://install.citusdata.com/community/deb.sh | bash`). That install script hard-fails on non-x86_64:
```
arch_check () {
  if [ "$(uname -m)" != 'x86_64' ]; then
    echo "Unfortunately, the Citus repository does not contain packages for non-x86_64 architectures."
```
So even though the upstream `postgres` base image natively supports `linux/riscv64`, Citus's own image build is blocked at the `curl | bash` install step for any non-amd64 architecture. The `citusdata/tools` Docker-publishing pipeline (`packaging_automation/publish_docker.py`) defines `PLATFORM_AMD64 = "linux/amd64"` and `PLATFORM_MULTI_ARCH = "linux/amd64,linux/arm64"` - riscv64 is not a defined platform constant anywhere.

**QEMU usage:** the only QEMU reference in the entire `citusdata` organization is `citusdata/tools/.github/workflows/publish-docker-image-tests.yml`, which uses `docker/setup-qemu-action@v3` and `docker/setup-buildx-action@v3` to test multi-arch Docker image publishing for the existing amd64/arm64 matrix. Nothing riscv64-related; QEMU is not used anywhere to build or test the Citus C extension itself.

**Known build failures:** none are riscv64-specific, since riscv64 has never been attempted. For context, [issue #7707](https://github.com/citusdata/citus/issues/7707) documents link errors ("symbol(s) not found for architecture arm64") building the PG17 branch on macOS arm64, unresolved as of the last maintainer response.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core distributed-query/sharding functionality | Full, official | Builds from source with reported success (community-verified, see #3854); not officially supported | Untested; no report of anyone attempting it |
| Official binary packages | Yes | No | No |
| Official Docker image | Yes | No | No |
| CI build/test coverage | Yes (all 7 workflows) | No | No |
| Regression test pass rate on non-default architecture | 100% (baseline) | 4 of 5 regression tests pass on arm64/Raspberry Pi after setting `LC_ALL=C` to eliminate locale-related false failures (per issue #3854, techhazard, 2021) | Unknown |

**Functional gaps:** none identified as architecture-specific at the code level, since Citus has zero architecture-conditional logic (Section 4). The practical functional gap for a hypothetical riscv64 deployment is entirely about distribution and validation, not code: no official package, no CI verification, no community report of anyone having tried it.

**Performance gaps:** Data not available - no riscv64 (or arm64) performance benchmark for Citus itself exists anywhere searched (GitHub issues/PRs, RISE blog, general web search). Citus has no SIMD-accelerated code of its own to lose on any architecture; any performance characteristics would come from PostgreSQL core and Citus's own dependency chain (Section 9), not from Citus-authored vectorized paths.

**Security hardening gaps:** the one significant, verified security-relevant gap found is transitive: OpenSSL's AES T-table fallback is not constant-time on riscv64 hardware lacking the Zkn/Zvkned crypto extensions (the majority of current riscv64 silicon, including SG2042, TH1520, JH7110, and SpacemiT K1), creating a cache-timing key-extraction risk for any Citus deployment using SSL on such hardware. Upstream OpenSSL fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) are open and unmerged; FIPS mode is untested on riscv64 in any CI matrix. This is a dependency-level gap (Section 9), not a Citus-authored one.

**NaN / floating-point semantics issues:** no RISC-V-specific NaN or floating-point-semantics issue exists for Citus. The one architecture-sensitive correctness bug found in the research (Section 11) is a stack-buffer overflow, not a floating-point issue.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was independently re-verified via direct GitHub API file reads (not just search), fetching and grepping the full content of all 7 workflow files plus all composite actions and packaging scripts.

**All 7 workflow files fetched and grepped for "riscv" (case-insensitive): zero matches.** Every `runs-on:` line (26 total occurrences across the 7 files) is x86_64 GitHub-hosted: `ubuntu-22.04` (in `codeql.yml`) or `ubuntu-latest` (all other 25 occurrences). No self-hosted runners and no riscv64 runner labels exist. `devcontainer.yml` uses `docker/setup-buildx-action@v3`, but builds a single-platform devcontainer image with no `platforms:` key set (defaults to the runner's native amd64) - no `docker/setup-qemu-action` and no multi-platform `platforms: linux/riscv64` string appears anywhere. All 9 `strategy: matrix:` blocks across the 7 files matrix only over PostgreSQL version, packaging distro name, parallel-shard index, or CodeQL language - zero architecture axes in any matrix. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml` exists at the repo root (all 404).

**RISE runners:** no evidence found that Citus uses or has ever used any RISE-provided riscv64 CI infrastructure (see Section 1 for the full RISE-involvement finding: zero mentions across 33 RISE blog posts, the `riseproject-dev` GitHub org's 54 repos, and the RISE Python wheel builder).

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI job | Yes (all 7 workflows) | No | No |
| QEMU/buildx multi-arch step | N/A (native) | Yes, but only for Docker image publishing in `citusdata/tools`, not for building/testing Citus itself | No |
| RISE-provided runners | No | No | No |
| Architecture dimension in any test matrix | Implicit (default) | None | None |

## 8. Distribution and Release Status

**No riscv64 binary or package exists for Citus, on any channel checked, and Citus has almost no binary-packaging story at all outside its own amd64-only apt/yum repos.**

- **GitHub Releases:** the 5 most recent releases (v14.2.0, v13.4.0, v12.1.14, v12.1.13, v14.1.0) all have empty `assets` arrays - only auto-generated source tarballs exist, no binary artifacts of any kind, for any architecture.
- **PyPI** (`pypi.org/pypi/citus/json`): a package named "citus" exists (v0.0.3), but it is an unrelated, name-squatted pure-Python package (not citusdata's PostgreSQL extension); Citus is a C extension and is not distributed via PyPI. All files are `py3-none-any`/`py3.9`, platform-independent, and irrelevant to this project.
- **RISE wheel builder:** the GitLab package-registry URL for "citus" 302-redirects to the same unrelated public PyPI package; no dedicated RISE-built wheel exists.
- **Ubuntu 24.04 (noble):** `packages.ubuntu.com` search returns "Sorry, your search gave no results." No Citus package exists for any architecture.
- **Debian tracker:** states explicitly "This package is not part of any Debian distribution." It was removed from testing/unstable in 2019 (log entries: "citus REMOVED from testing" 2019-08-14). Debian's buildd status page shows "No entry in riscv64 database" for Citus - but this is identical to every other architecture's status, including amd64, confirming no build has ever been attempted for Citus on any architecture in Debian, not a riscv64-specific gap.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): "No results for 'citus'" - package not found at all.
- **PGDG APT repo** (`apt.postgresql.org`, the primary real-world PostgreSQL extension distribution channel): direct checks of `dists/{bookworm,bullseye,jammy,noble,focal}-pgdg/main/binary-riscv64/Packages` return HTTP 404 for every release - the `binary-riscv64` component does not exist in the repo at all; PGDG's `Architectures:` field lists only `amd64 arm64 ppc64el`. Grepping the amd64 `Packages` file for `^Package: postgresql-.*-citus$` returns zero matches either - Citus is not published as a standard PGDG package under any architecture, including amd64; only sibling citusdata projects (pg_auto_failover, pg_cron, postgresql-hll) appear, and only via `Homepage:` references.

**What a user must do to get a working riscv64 binary:** there is no packaging channel through which a riscv64 Citus build could even appear today, since PGDG itself does not yet offer riscv64 as a target architecture for any package. A user would need to build entirely from source against a riscv64-built PostgreSQL install, using the generic `./configure && make && make install` path described in Section 5. No party has been found to have attempted or documented this.

## 9. Dependencies

Citus is a PGXS-based, pure C PostgreSQL extension with no `package.json`/`Cargo.toml`/`go.mod` - the dependency manifest is `configure.ac` plus Makefiles plus `cgmanifest.json` (Microsoft's Component Governance manifest) plus `vendor/`. Citus's own source contains zero architecture-specific code (Section 4); all architecture risk is inherited from its dependencies.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| PostgreSQL | Hard host dependency; Citus is a PGXS extension requiring `pg_config` from PG 16/17/18 | Green | Green | Green | No correctness blockers. riscv64 is a documented supported CPU architecture, builds and passes the PostgreSQL Build Farm. Binary parity with amd64/arm64 but no performance parity (no riscv64-specific atomics/CRC32C/popcount paths). See `reports/postgresql.md`. |
| libpq | Linked into the Citus shared object (`SHLIB_LINK = $(libpq)`); used throughout `src/backend/distributed/*` for inter-node connections | Inherited from PostgreSQL core | Not independently verified | Inherited | Ships inside the PostgreSQL source tree, not a separate upstream project. `reports/postgresql.md` explicitly flags riscv64 status of PostgreSQL client drivers (psycopg2, psycopg3, libpq, JDBC) as an unresearched gap - a genuine gap in current ecosystem coverage. |
| LZ4 | Optional, default-on (`configure.ac`: `PGAC_ARG_BOOL(with, lz4, yes)`) compression backend for `columnar_compression.c` | Green | Green | Green | None. Builds and passes the full test suite under QEMU on riscv64; available in Debian sid and Ubuntu 24.04 (`liblz4-1`). A merged Zicclsm unaligned-access optimization ([PR #1648](https://github.com/lz4/lz4/pull/1648)) remains unreleased since v1.10.0 - a performance-only gap, not a correctness one. See `reports/lz4.md`. |
| zstd | Optional, default-on (`configure.ac`: `PGAC_ARG_BOOL(with, zstd, yes)`) compression backend for `columnar_compression.c` | Green | Green | Green | No correctness blockers. Several open, unreviewed performance PRs (4-way Huffman decode [#4622](https://github.com/facebook/zstd/pull/4622), Zicclsm unaligned access [#4596](https://github.com/facebook/zstd/pull/4596), RVV `ZSTD_count` [#4629](https://github.com/facebook/zstd/pull/4629)) - all performance-only gaps versus arm64/amd64. Available in Debian sid and Ubuntu 24.04. See `reports/zstd.md`. |
| OpenSSL | Optional, auto-detected from the PostgreSQL build (`USE_OPENSSL`); used in `src/backend/distributed/utils/enable_ssl.c` for Citus's automatic SSL/certificate-generation UDFs | Green | Mostly green | Green | **Critical security gap, not a build gap:** the AES T-table fallback is not constant-time on riscv64 hardware lacking Zkn/Zvkned (the majority of current silicon - SG2042, TH1520, JH7110, SpacemiT K1), creating a cache-timing key-extraction risk for any Citus deployment using SSL on such hardware. Fix PRs [#31080](https://github.com/openssl/openssl/pull/31080)/[#31082](https://github.com/openssl/openssl/pull/31082) are open and unmerged. FIPS is untested on riscv64 in any CI matrix. See `reports/openssl.md`. |
| Intel safestringlib | Vendored in-tree (`vendor/safestringlib`, pinned via `cgmanifest.json`), statically linked (`libsafestring_static.a`) for hardened `mem*_s`/`str*_s` bounds-checked functions in `columnar_tableam.c` and related code | Green (inferred) | No CI evidence found | Green (inferred) | Not in `scope.yml`; no dedicated report. Pure portable C with zero architecture-specific `#ifdef`s (`mem_primitives_lib.c` reviewed directly - no `__x86_64__`/`__arm__`/`__riscv`/SIMD paths). Zero riscv64/riscv issues in 21 open issues on `intel/safestringlib`. Separate risk: the upstream repository is archived (no commits/releases since archival) - a supply-chain/maintenance risk independent of riscv64. |
| LLVM (indirect, via PostgreSQL JIT) | Not a direct Citus dependency; inherited transitively because `shard_pruning.c` contains clang-specific pragma handling tied to PostgreSQL's `--with-llvm` JIT bitcode compilation | Inherited (Tier 2 backend) | Inherited | Inherited | No Citus-specific riscv64 blocker found. Distro PostgreSQL packages disable LLVM JIT on riscv64 due to segfaults (per `reports/postgresql.md`), which transitively means Citus builds against PG never exercise this path on riscv64 in practice. See `reports/lldb.md` for the related LLVM/LLDB riscv64 port status (LLVM itself is not separately tracked in `scope.yml`). |

**Citus itself, synthesized:** no riscv64/riscv artifact exists anywhere in the Citus project - no CI job, no Docker image, no Debian/Ubuntu riscv64 package, no GitHub issue or PR mentioning RISC-V. Citus explicitly does not support any non-x86_64 architecture as policy. Issue [#3854](https://github.com/citusdata/citus/issues/3854) ("ARM architecture support," open since 2020) shows community members successfully building from source on arm64 (Raspberry Pi/Debian) with only 1 of 5 regression tests failing (locale-related, not architecture-related) - the closest available analog for what an unofficial riscv64 build might encounter, since Citus's own code has no architecture-specific branches.

**Bottom line:** Citus's riscv64 viability is bottlenecked entirely by its dependency chain, not by its own code. Every hard/default-on dependency (PostgreSQL, LZ4, zstd, OpenSSL) is buildable and testable on riscv64 today with no correctness blockers - only performance gaps and, in OpenSSL's case, one unresolved constant-time security gap. Given that, Citus itself would very likely compile and pass its regression suite on riscv64 if attempted, but this has never been tried, verified, packaged, or officially supported by upstream.

## 11. Known Bugs and Active Issues

No riscv64-specific bug, issue, or correctness report has ever been filed against Citus. Since no riscv64 content exists to report on directly, the table below documents the closest available proxy: the non-x86_64/arm64 architecture-support issues, which are the only place Citus's maintainers and community discuss portability beyond x86_64, and which reveal structural gaps (no packages, no CI, an unofficial "works if you build from source" stance, and one real portability correctness bug) that would apply equally to a hypothetical riscv64 port.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7933](https://github.com/citusdata/citus/issues/7933) / [#7515](https://github.com/citusdata/citus/issues/7515) (duplicate) | `multi_extension` test crashes on arm64 with `__stack_chk_fail` | Closed (partially fixed by [PR #7950](https://github.com/citusdata/citus/pull/7950), merged 2025-08-05) | **Correctness (memory safety)** | Root cause: PostgreSQL marks dropped columns as `pg.dropped.N` in the catalog rather than physically removing them; Citus hardcoded the expected column count (`Natts_pg_dist_partition`), so after a downgrade+upgrade cycle that re-adds a column, `tupleDescriptor->natts` exceeds the hardcoded constant, causing `heap_deform_tuple()` to write past a fixed-size stack array. This is undefined behavior that x86_64's looser stack layout happened not to trip into a visible crash, but arm64's stricter stack-canary/alignment checks caught as `__stack_chk_fail`. **The fix is incomplete:** issue #7515's reporter (Green-Chan) identified 5 additional vulnerable tables with the same hardcoded-column-count hazard (`columnar.stripe`, `pg_dist_rebalance_strategy`, `pg_dist_background_task`, `citus.pg_dist_object`, `pg_dist_transaction`) that remain unpatched as of the issue's last activity (2025-08-06 reopen request, disputing the closure). This class of bug is architecture-dependent in exactly the way that would also matter for riscv64: any RISC-V port exercising Citus extension downgrade/upgrade cycles could hit the same latent overflow. |
| [#3854](https://github.com/citusdata/citus/issues/3854) | ARM architecture support | Open (since 2020-05-24) | Portability/packaging | Longest-running architecture-portability thread; sustained community demand over 6+ years met only by build-from-source workarounds (Raspberry Pi, Apple M1/Homebrew), never resolved by official packages. |
| [#7851](https://github.com/citusdata/citus/issues/7851) | Citus support for non-x86_64 architectures | Closed (2025-02-25) | Policy | Maintainer explicitly declines official ARM support; this is the clearest statement of Citus's non-x86_64 policy and the closest available signal for how RISC-V would be received. |
| [#5063](https://github.com/citusdata/citus/issues/5063) | arm64 package and docker image? | Closed (2025-01-12, resolved only by a third-party packager) | Packaging | Open nearly 4.5 years; resolved not by Citus but by the third-party Pigsty project producing unofficial RPM/DEB packages, illustrating the likely pattern for any future riscv64 packaging effort. |
| [#8612](https://github.com/citusdata/citus/issues/8612) | Please provide an arm64 Docker image as well | Open (since 2026-06-06) | Packaging | No maintainer response as of this research; the most current evidence that Citus's official non-x86_64 distribution story has not materially progressed. |
| [#7707](https://github.com/citusdata/citus/issues/7707) | Undefined symbols for architecture arm64 when compiling | Open (since 2024-10-16) | Build | Link errors building the PG17 branch on macOS arm64; no confirmed resolution posted. |

**Correctness bugs highlighted separately:** #7933/#7515 is the single most technically important finding in this research - a genuine, only-partially-fixed memory-safety bug (stack buffer overflow) that was surfaced exclusively by non-x86_64 hardware's stricter stack-protector behavior. This is directly relevant to riscv64 risk assessment: 5 of the 6 originally-flagged vulnerable tables remain unpatched, and any riscv64 deployment exercising the same downgrade/upgrade code path could encounter the same class of corruption, contingent on riscv64's own stack-protector and alignment enforcement behavior (not independently characterized in this research pass).

## 12. Objections and Upstream Blockers

**Stated objections:** no RISC-V-specific objection exists, because no RISC-V request has ever been filed. The governing precedent is the explicit ARM64 decline (Section 1, Section 3): maintainer ihalatci states Citus does "not plan on supporting ARM architectures" and is "not officially supporting the platform" (issue #7851, closed 2025-02-25).

**Technical blockers:** none identified in Citus's own code, which has zero architecture-specific logic (Section 4). The real technical risk sits in the dependency chain (Section 9): OpenSSL's non-constant-time AES fallback on riscv64 hardware lacking crypto extensions is the one concrete, unresolved security-relevant gap; the partially-fixed stack-overflow bug (#7933/#7515, Section 11) is a latent correctness risk that riscv64 could also trigger, though this has never been tested.

**Organizational blockers:**
- Citus's official install/packaging pipeline has an active `arch_check()` gate that hard-fails on any non-x86_64 architecture, meaning even a hypothetical working riscv64 build could not be distributed through Citus's own official channels without a deliberate packaging change.
- Even the more mature, more widely requested ARM64 effort remains gated off by default via feature flags (`DEB_BUILD_MULTI_ARCH`, `DOCKER_BUILD_MULTI_ARCH`) as of August 2026, five-plus years after the first community request (#3854, 2020). RISC-V would need to clear the same multi-repository (tools, packaging, docker) effort ARM64 has required, with no existing champion or tracking issue to build from.
- PGDG itself, the primary real-world PostgreSQL extension distribution channel that Citus's own build instructions depend on, does not yet offer riscv64 as an architecture at all - a prerequisite gap entirely outside Citus's control.

**Acceptance probability:** low in the near term, based on direct precedent. Citus's maintainers have explicitly declined ARM64 support multiple times over 5+ years despite sustained community demand, and only began a cautious, feature-flag-gated ARM64 effort in mid-2026 after a specific external champion (ihalatci) took it on. No RISC-V analog to that champion exists. [NEEDS VERIFICATION: no explicit maintainer statement about RISC-V specifically exists, since it has never been raised; this assessment is inferred entirely from the ARM64 precedent.]

## 13. Investment Analysis

**RISE prior work check:** RISE has not funded, tracked, or engaged with Citus in any capacity. Checked exhaustively: all 33 RISE blog posts (none mention Citus, PostgreSQL, or databases), the `riseproject-dev` GitHub org (54 repos enumerated, none related; a code search for "citus" returns only hits inside this very sw-ecosystem repository's own prior vertical report), and the RISE Python wheel builder (Citus not listed, and not applicable regardless since Citus is not a Python package). There is no existing RISE investment to net out of the estimates below.

### 13.1 Functional Enablement

Citus's own code requires no functional changes for riscv64, since it has zero architecture-specific logic (Section 4). The concrete functional-enablement work is entirely at the dependency and validation layer: (a) verify Citus builds and passes its regression suite against a riscv64-built PostgreSQL install, since this has never been attempted or documented by any party; (b) specifically re-run the extension downgrade/upgrade regression tests that previously exposed the #7933/#7515 stack-overflow bug on arm64, to determine whether riscv64's stack-protector/alignment behavior surfaces the same latent corruption in the 5 still-unpatched tables.

### 13.2 Performance Optimization

No Citus-specific performance optimization is applicable, since Citus has no SIMD/vectorized code of its own (Section 4). Performance work would occur entirely in the dependency chain: LZ4 and zstd both have open, unmerged riscv64-specific performance PRs (Zicclsm unaligned-access optimizations, RVV-accelerated routines) that would benefit Citus's columnar compression path if merged upstream, but this work belongs to those projects, not Citus.

### 13.3 CI/CD Infrastructure

Add a riscv64 build-and-test leg to `build_and_test.yml`, most likely via a QEMU-emulated or RISE-provided native riscv64 runner, mirroring the same low-complexity approach Citus's own tooling already uses for arm64 image-publishing tests (`docker/setup-qemu-action` in `citusdata/tools`). This is a mechanically small change but would require the same kind of organizational sign-off that has stalled the ARM64 CI effort.

### 13.4 Ecosystem Enablement

Not applicable; Section 10 is omitted since Citus has no dependent package ecosystem of its own (it is a single PostgreSQL extension, not a package-manager-distributed library with downstream consumers). The one true prerequisite outside Citus's control is PGDG itself adding riscv64 as a supported architecture, without which no official Citus riscv64 package could exist regardless of what Citus itself does.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify Citus build and full regression-test pass against a riscv64-built PostgreSQL | 1-2 | Unassigned; no existing champion | Medium |
| Functional | Specifically re-test the #7933/#7515 downgrade/upgrade stack-overflow class of bug on riscv64 | 0.5-1 | Unassigned | High (latent memory-safety risk) |
| CI/CD | Add a riscv64 build+test job to `build_and_test.yml` (QEMU or RISE-runner based) | 1-2 | Unassigned; requires the same organizational sign-off that has slowed the ARM64 CI effort | Medium |
| Organizational | Remove or adapt the `arch_check()` gate in `install.citusdata.com/community/deb.sh` to allow a riscv64 path once binaries exist | 0.5 | Requires Microsoft/Citus maintainer buy-in | Low until functional/CI work lands |
| External prerequisite | PGDG adding riscv64 as a supported architecture | Not sized here; outside Citus's control | PGDG maintainers | Blocking prerequisite for any official distribution path |

**Overall assessment:** Citus is a low-code-risk, high-organizational-risk RISC-V investment target. The extension itself has no architecture-specific code and would very likely build and largely function on riscv64 today if attempted, but Citus's maintainers have a five-plus-year track record of declining non-x86_64 support (only recently and cautiously reversing course for ARM64, the more commercially pressing architecture), and a real, only-partially-fixed cross-architecture memory-safety bug (#7933/#7515) demonstrates that "builds cleanly" does not guarantee "runs correctly" on a stricter-architecture target. Any investment here should budget for organizational advocacy (finding or funding a champion analogous to ihalatci's ARM64 effort) as heavily as for the engineering work itself.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [citusdata/citus repository](https://github.com/citusdata/citus)
- [Issue #7851 - Citus support for non-x86_64 architectures](https://github.com/citusdata/citus/issues/7851)
- [Issue #3854 - ARM architecture support](https://github.com/citusdata/citus/issues/3854)
- [Issue #5063 - arm64 package and docker image?](https://github.com/citusdata/citus/issues/5063)
- [Issue #8612 - Please provide an arm64 Docker image as well](https://github.com/citusdata/citus/issues/8612)
- [Issue #7707 - Undefined symbols for architecture arm64 when compiling](https://github.com/citusdata/citus/issues/7707)
- [Issue #8112 - Citus docker image for linux/arm64 platforms](https://github.com/citusdata/citus/issues/8112)
- [Issue #7933 - multi_extension test crashes on arm64](https://github.com/citusdata/citus/issues/7933)
- [Issue #7515 - duplicate stack-overflow report, 5 tables still unpatched](https://github.com/citusdata/citus/issues/7515)
- [PR #7950 - fix for pg_dist_partition stack overflow](https://github.com/citusdata/citus/pull/7950)
- [citusdata/tools PR #414 - buildx multi-arch support](https://github.com/citusdata/tools/pull/414)
- [citusdata/packaging PR #1198 - gated arm64 nightly .deb leg](https://github.com/citusdata/packaging/pull/1198)
- [config/config.guess - generic autoconf boilerplate containing the only "riscv" string in the repo](https://github.com/citusdata/citus/blob/main/config/config.guess)
- [Citus homepage](https://www.citusdata.com/)
- [Debian package tracker - citus (not part of any Debian distribution)](https://tracker.debian.org/pkg/citus)
- [Debian buildd status - citus](https://buildd.debian.org/status/package.php?p=citus)
- [Ubuntu package search - Citus](https://packages.ubuntu.com/search?keywords=Citus&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/?q=citus)
- [PyPI - citus (unrelated namesake package)](https://pypi.org/pypi/citus/json)
- [Pigsty project - unofficial Citus RPM/DEB packages](https://ext.pigsty.io/#/citus)
- [RISE Project members page](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [OpenSSL PR #31080 - constant-time AES fallback for riscv64](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - related constant-time fix](https://github.com/openssl/openssl/pull/31082)
- [LZ4 PR #1648 - Zicclsm unaligned-access optimization](https://github.com/lz4/lz4/pull/1648)
- [zstd PR #4622 - 4-way Huffman decode](https://github.com/facebook/zstd/pull/4622)
- [zstd PR #4596 - Zicclsm unaligned access](https://github.com/facebook/zstd/pull/4596)
- [zstd PR #4629 - RVV ZSTD_count](https://github.com/facebook/zstd/pull/4629)
- [Intel safestringlib repository](https://github.com/intel/safestringlib)
