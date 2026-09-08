---
title: FIWARE Orion Context Broker
parent: Project Reports
color: orange
---

# FIWARE Orion Context Broker

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for FIWARE Orion Context Broker<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

FIWARE Orion Context Broker is a C++14 NGSI(-LD) context management server: it stores, updates, queries, and publishes notifications about "context" entities for IoT/smart-city platforms. It is the "Core Context Management" Generic Enabler of the FIWARE Catalogue, built on `libmicrohttpd` (embedded HTTP server), the MongoDB C driver (persistence), `librdkafka` and Eclipse Mosquitto (Kafka/MQTT notification sinks), and Boost (core utilities). It is a portable, generic C++ server application with no JIT, no SIMD/vectorized numeric kernels, and no architecture-specific hot-path code of any kind, for any CPU architecture.

**Governance:** Orion sits under the FIWARE Foundation e.V. (a Berlin-based non-profit) at the catalogue/brand level, with Platinum members Atos, Engineering, NEC, Red Hat, Telefonica, and Trigyn Technologies. However, repo-level governance is not foundation-run: there is no MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md, or SUPPORT.md file in the repository. `ContributionPolicy.txt` requires contributors to sign a copyright-assignment agreement to TSOL (Telefonica Soluciones de Informatica y Comunicaciones de Espana, S.A.U.), and the README copyright line reads "(c) 2026 Telefonica Investigacion y Desarrollo, S.A.U." De facto, Telefonica I+D controls the project (repo ownership, copyright holder, and the majority of commits/maintainers), operating under the FIWARE Foundation umbrella rather than direct foundation code governance. License: AGPL v3.0.

**Corporate sponsors / active maintainers:** Fermin Galan Marquez (Telefonica, current lead maintainer), Carlos Romero, Alvaro Vega, Ivan Arias Leon, Raquel Conte, Marcos Reyes (all Telefonica), Md Arqum Farooqui (NEC, a FIWARE Platinum sponsor, recent contributor), and Kazuhito Suda (independent, Japan-based FIWARE community lead).

**Community culture on new ports:** No formal platform-support policy exists (no PLATFORMS.md/SUPPORT.md). The one precedent for a non-x86 port is aarch64/Raspberry Pi support, added as a community-contributed, docs-only Docker convenience by an independent individual contributor (Kazuhito Suda) years after ARM64 was already mainstream, and it received no CI validation. This suggests maintainers are reactive/accepting of external platform-support PRs but do not proactively drive porting work themselves. No RISC-V request, issue, or roadmap item was found on record ([doc/roadmap.md](https://github.com/telefonicaid/fiware-orion/blob/master/doc/roadmap.md), last updated August 2023, contains only NGSI/API feature items).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-02-17 | Community-contributed aarch64 (Raspberry Pi) Docker support added, docs only, no CI validation | [Commit 7dfe988](https://github.com/telefonicaid/fiware-orion/commit/7dfe988df0223a8ea8cbc5eb29921b131077a010), author Kazuhito Suda |
| N/A | No riscv64 port has ever been proposed | Full-history commit-message search, `git log -S"riscv"` content pickaxe, and full working-tree text search all return zero matches |

**Key contributors and orgs:** Telefonica I+D (repo owner, majority of maintainers and commits), NEC (recent contributor via Md Arqum Farooqui, FIWARE Platinum sponsor), Kazuhito Suda (independent, added the only non-x86 architecture support that exists, aarch64).

**Is it fully upstream?** There is no riscv64 port to be "upstream" or not - the topic has never been raised in 14,439 commits of repository history. This is not a case of a port sitting in a fork or a stalled PR; it is a complete absence of any riscv64-related activity.

## 3. Upstream Support Tier

No formal tier policy document exists (no PLATFORMS.md/SUPPORT.md). Tier is inferred from CI and release evidence, all confirmed by direct file inspection.

| Architecture | CI builds it | CI tests it | Official release artifact | Notes |
|---|---|---|---|---|
| amd64 (x86_64) | Yes, all 8 workflows | Yes (unit, functional, compliance, valgrind) | Docker image only (`telefonicaiot/fiware-orion`); GitHub releases are source-only | Sole architecture actually validated by CI |
| arm64 (aarch64) | No dedicated CI job or runner | No | No | Named in CMakeLists.txt linker-path branch and documented for Raspberry Pi ([docker/raspberry_pi.md](https://github.com/telefonicaid/fiware-orion/blob/master/docker/raspberry_pi.md)), but never CI-validated; support is aspirational/build-system-only |
| riscv64 | No | No | No | Zero mentions anywhere in the repository (source, docs, CI, commits, issues, PRs) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Orion has no architecture-specific compute components. A `search_code` sweep for `#ifdef __riscv`, `__aarch64__`, and `__x86_64__` preprocessor guards each returned zero hits - **the codebase contains no CPU-architecture preprocessor guards anywhere, for any architecture**. There is no hand-tuned SIMD, no JIT, no crypto acceleration code, and no inline assembly in the C++ source tree.

The only architecture-aware code in the entire repository is a five-line linker-path branch in [CMakeLists.txt](https://github.com/telefonicaid/fiware-orion/blob/master/CMakeLists.txt) (lines 295-303):

```cmake
if ("${BUILD_ARCH}" STREQUAL "x86_64")
    link_directories("/usr/lib64")
elseif ("${BUILD_ARCH}" STREQUAL "aarch64")
    link_directories("/usr/lib64")
else (NOT "${BUILD_ARCH}" STREQUAL "x86_64")
    link_directories("/usr/lib")
endif (...)
link_directories("/usr/lib/x86_64-linux-gnu")   # appended unconditionally, all architectures
```

`BUILD_ARCH` defaults to `uname -m` (set in `makefile` and `ci/deb/makefile`) when not explicitly overridden. riscv64 is not named in this branch; it would fall into the generic `else` (`/usr/lib`) purely as an accident of the default fallthrough, never as a deliberate accommodation - and the trailing unconditional `link_directories("/usr/lib/x86_64-linux-gnu")` line is an x86_64-specific assumption baked into every build regardless of target.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linker-path selection (CMakeLists.txt) | Explicit branch (`/usr/lib64`) | Explicit branch (`/usr/lib64`) | Not named; falls through to generic `else` (`/usr/lib`), never verified |
| SIMD/vectorized code | None (project has none for any arch) | None | None |
| JIT | None | None | None |
| Crypto acceleration | None in Orion itself (delegated to OpenSSL/GnuTLS/libgcrypt, see Section 9) | Same | Same |
| Arch-specific `#ifdef` guards | 0 | 0 | 0 |
| Dedicated source files | 0 | 0 | 0 |

This is not a case of riscv64 having a degraded (scalar) implementation while amd64/arm64 get optimized code paths - the entire codebase is architecture-generic C++. What riscv64 specifically lacks is not optimized code but any build validation, packaging, or official support signal whatsoever.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake >= 3.5, C++14 (`CMAKE_CXX_STANDARD 14`), GCC version gating only (no Clang support found anywhere):
- GCC < 6.3: base flags only
- GCC 6.3-8.3: adds `-Wno-deprecated-declarations`
- GCC > 8.3: adds `-Wno-deprecated-declarations -Wno-format-truncation -Wno-stringop-truncation`

**Official build docs** ([doc/manuals/admin/build_source.md](https://github.com/telefonicaid/fiware-orion/blob/master/doc/manuals/admin/build_source.md)) target Debian 13 x86_64 only, with one non-x86 aside for aarch64 (gmock/gtest `--build=arm-linux` configure flag for Raspberry Pi builds). No riscv64 guidance exists anywhere.

**Cross-compilation toolchain:** No toolchain file exists (`cmake/riscv64.cmake` or equivalent) - there is no `cmake/` directory in the repository at all.

**QEMU:** No QEMU usage anywhere in the repository (`grep -rn "qemu\|QEMU"` returns zero matches).

**Docker:** Two Dockerfiles exist (`docker/Dockerfile`, Debian 13.3-slim base; `docker/Dockerfile.alpine`). Neither contains `TARGETARCH`/`TARGETPLATFORM`/`BUILD_ARCH` logic or any architecture branching. The publish workflows run plain `docker build` (not `docker buildx build`) with no `--platform` flag and no QEMU setup step, despite invoking `docker/setup-buildx-action@v2` - buildx here is used only as the modern single-arch (amd64) build engine, not for cross-architecture output.

**Known build failures on riscv64:** None documented, because no one has attempted the build and reported results. One historical, unrelated toolchain issue noted for `libmicrohttpd` (riscv64 GCC not defining `_REENTRANT` with `-pthread`) is long since fixed in modern riscv64 toolchains and is not a current blocker for that dependency.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds via official CI | Yes | No (untested) | No (untested) |
| Test suite passes | Yes (unit/functional/compliance/valgrind) | No (never run) | No (never run) |
| Official Docker image | Yes (`telefonicaiot/fiware-orion`, single-arch) | No | No |
| Documented manual build path | Yes | Partial (Raspberry Pi Docker note) | None |
| Distro package | Not found (see Section 8) | Not found | Not found |

**Functional gaps:** None specific to riscv64 beyond total absence of a validated build - the same is essentially true for arm64, which also has no official CI validation despite being named in the build system. There is no evidence riscv64 "can't do X" functionally; there is simply no evidence it has ever been built or run at all.

**Performance gaps:** Not applicable - Orion has no architecture-specific optimized code paths on any platform (Section 4), so there is no SIMD/vectorization delta to measure between amd64, arm64, and riscv64.

**Security hardening gaps:** No riscv64-specific hardening analysis exists because no riscv64 build has ever been produced or tested.

**NaN/floating-point semantics issues:** No evidence found. No issue, PR, or benchmark report referencing floating-point or NaN behavior on riscv64 for this project was located in any search performed.

## 7. CI/CD Infrastructure

**Riscv64 CI does not exist.** All 8 GitHub Actions workflows were read in full, and confirmed via full-tree `grep -riI "riscv"` (zero matches) plus GitHub code search (`riscv repo:telefonicaid/fiware-orion` -> `total_count: 0`).

| Workflow file | Trigger | Runner |
|---|---|---|
| [codeql.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/codeql.yml) | push/PR to master, weekly cron | `ubuntu-latest` (macos-latest unused swift matrix entry) |
| [compliance.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/compliance.yml) | push/PR to master | `ubuntu-22.04` |
| [functional.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/functional.yml) | push/PR to master | `ubuntu-22.04` |
| [publishimage-master.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/publishimage-master.yml) | push to master | `ubuntu-latest` |
| [publishimage-tag.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/publishimage-tag.yml) | push tag x.y.z | `ubuntu-latest` |
| [unit.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/unit.yml) | push/PR to master | `ubuntu-22.04` |
| [valgrind.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/valgrind.yml) | push to `checkvalgrind**` only | `ubuntu-22.04` |
| [valgrind-nocache.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/valgrind-nocache.yml) | push to `checkvalgrind**` only | `ubuntu-22.04` |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository. No RISE RISC-V runners are referenced anywhere (no `riseproject-dev` mentions, no RISC-V runner labels). No hardware of any kind is used for riscv64 because no riscv64 job exists.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | No | No |
| CI test | Yes | No | No |
| CI release-blocking gate | Yes (unit/functional/compliance/valgrind all gate master) | No | No |
| Docker multi-arch build | No (single-arch, no `--platform` flag, no QEMU) | No | No |

## 8. Distribution and Release Status

**GitHub releases:** Only two assets per release (`x.y.z.zip`, `x.y.z.tar.gz`) - auto-generated source archives. No compiled binaries of any kind are shipped, for any architecture, so there is no amd64, arm64, or riscv64 binary release to compare. Confirmed via the release-assets fragment endpoint for [release 4.7.0](https://github.com/telefonicaid/fiware-orion/releases/expanded_assets/4.7.0).

**Docker (OCI):** `telefonicaiot/fiware-orion:latest` and per-tag images are published on push to master / version tags, single-arch (amd64) only, no `linux/riscv64` platform tag.

**PyPI:** No package exists. `https://pypi.org/pypi/fiware-orion-context-broker/json` returns HTTP 404; `https://pypi.org/simple/fiware-orion-context-broker/` also 404s. This is expected - Orion is a C++ project, not distributed via PyPI upstream. (Confirms the project graph DB's independently-empty PyPI query result.)

**RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/fiware-orion-context-broker/` redirects to pypi.org's simple index, which 404s per above. No package present.

**Ubuntu 26.04 "resolute":** Project graph DB query for binary packages named `fiware orion context broker`, `python3-fiware-orion-context-broker`, or `libfiware-orion-context-broker` returns an empty result set for any architecture. Confirmed live via [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=FIWARE%20Orion%20Context%20Broker&suite=resolute&searchon=names&section=all): "Sorry, your search gave no results." The project is not packaged in Ubuntu at all, on any architecture, let alone riscv64.

**Arch Linux RISC-V port:** `https://archriscv.felixc.at/?q=fiware%20orion%20context%20broker` shows no listing.

**What a user must do to get a working binary today:** Build from source manually. There is no documented riscv64 build procedure, no toolchain file, and no CI evidence the source even compiles on riscv64 - a user would be doing first-of-its-kind porting work, not following an existing (even unofficial) recipe.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/blocking issues |
|---|---|---|---|---|---|
| mongo-c-driver / bson (pinned 2.2.1 EXACT) | MongoDB client, persistence layer | Available in Ubuntu 26.04 resolute riscv64 (`libmongoc-dev`, `libmongoc2-2`, `libbson-dev`, `libbson2-2`) | Implied by archive autopkgtest gate; no dedicated report | Upstream mongodb/mongo-c-driver publishes no riscv64 release artifacts (x86_64/arm64/arm only); Debian/Ubuntu build from source | None found |
| librdkafka | Kafka notification sink | Available in Ubuntu 26.04 resolute riscv64 (`librdkafka-dev`, `librdkafka1`) | Archive-gated only | No official riscv64 release tarball; distro-built | None found riscv64-specific |
| libmicrohttpd (static) | Embedded HTTP server, core of REST API | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | No upstream binary releases (source-only project) | Historical `_REENTRANT`/`-pthread` toolchain issue, long fixed |
| Eclipse Mosquitto (static) | MQTT notification sink | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Ships in Debian/Ubuntu; no standalone riscv64 release binaries | `eclipse-mosquitto/mosquitto#3183` (build failure with `WITH_THREADING=no` on riscv64-buildroot-uclibc toolchain) - edge-case config, not an architecture blocker |
| OpenSSL | TLS backend | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Full riscv64 release support upstream | `openssl/openssl#22871` (riscv64 build error in 3.2.0, since fixed), `#23011` ("unknown CSR vlenb" in vector-crypto codepath on certain toolchains) - both edge cases in newer RVV vector-crypto acceleration; generic C fallback used otherwise |
| GnuTLS | Alternate TLS backend | Available in Ubuntu 26.04 resolute riscv64; Launchpad shows continuous riscv64 build success from Ubuntu 21.10 through 26.04 | Distro-built only | Distro-built only | None found |
| libgcrypt | Crypto primitives | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Distro-built only | None found |
| Cyrus SASL | SASL auth for MongoDB | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Distro-built only | None riscv64-specific found |
| Boost (thread/filesystem/system/regex) | Core C++ utilities | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Distro-built; no official upstream riscv64 binaries | `boostorg/test#345` (cosmetic warning, `fedisableexcept` unimplemented on RISC-V); `boostorg/atomic#65` added RISC-V `pause()` support (merged, perf improvement, not a blocker) |
| libcurl | Outbound HTTP notifications | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Full riscv64 release support upstream | None found |
| libuuid (util-linux) | UUID generation | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Distro-built | None found |
| zlib / zstd / lz4 / snappy (transitive via mongoc/librdkafka) | Wire compression | Available in Ubuntu 26.04 resolute riscv64 | Archive-gated | Distro-built | None found |
| cjexl (optional, `HAVE_CJEXL`) | Telefonica-internal JEXL expression evaluator | Not packaged/public, no upstream GitHub presence | N/A | N/A | Non-blocking: Orion falls back to `-DEXPR_BASIC` when absent |

**Summary:** Every non-optional dependency Orion links against resolves as an available riscv64 binary package in Ubuntu 26.04 (resolute) per the project graph DB, with no currently-open riscv64-specific blocking issues on any of them - the few riscv64 items that exist (OpenSSL vector-crypto assembler edge cases, Mosquitto's threading-disabled build, Boost's cosmetic warning) are historical/fixed or non-blocking edge cases in uncommon configurations, not general support gaps. This means the *transitive dependency chain is not the obstacle* to a riscv64 Orion build; the obstacle is that Orion itself has never been built, tested, or packaged for riscv64 by anyone.

Section 10 (Ecosystem Status) is omitted. Orion Context Broker is a standalone server application with no dependent package ecosystem (no PyPI, npm, Maven, or plugin ecosystem tied to it) that would itself require separate riscv64 enablement.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | No riscv64-related issues exist | - | GitHub `search_issues` for "riscv", "riscv64", "risc-v" scoped to `telefonicaid/fiware-orion` all return `total_count: 0` |

No correctness bugs, benchmark reports, or NaN/floating-point issues tied to riscv64 were found for this project. WebSearch queries for "FIWARE Orion Context Broker riscv64 benchmark," "...riscv performance," and related terms returned no relevant results.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or contributor has commented for or against riscv64 support anywhere in the repository's history.

**Technical blockers:** None identified as blocking - all critical dependencies are available as riscv64 binaries in Ubuntu 26.04 (Section 9). The one structural issue is the unconditional `link_directories("/usr/lib/x86_64-linux-gnu")` line in CMakeLists.txt (Section 4), which would need to be made conditional or removed to avoid pulling in an incorrect library path on riscv64 - a small, low-risk fix, not a fundamental blocker.

**Organizational blockers:** The project's de facto single-corporate-owner model (Telefonica I+D holds the copyright-assignment CLA and dominates commits) combined with a demonstrated pattern of only accepting, not initiating, new-architecture support (the aarch64 precedent was community-contributed and took years past ARM64's mainstream adoption) suggests low organizational appetite to proactively drive a riscv64 port. There is no roadmap item, RFC, or foundation-level RISC-V initiative referencing FIWARE or Orion.

**Acceptance probability:** [NEEDS VERIFICATION] - no direct evidence either way, since the topic has never been raised. Based on the aarch64 precedent (accepted after external contribution, never CI-validated), a well-formed external riscv64 PR (build-system fix + Docker doc, similar in scope to the aarch64 contribution) would likely be merged, but is unlikely to be initiated or CI-validated by the current maintainers without external pressure or a dedicated contributor.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, and no distribution ships a riscv64 - or any-architecture - package to trigger the distribution floor)
- **Release provider:** none (GitHub releases are source-only for every architecture; the only compiled artifact, the Docker image, is published single-arch amd64 only; no PyPI, no distro package, no RISE wheel)
- Not an optimization-purpose project (Orion has no architecture-specific hot-path code for any ISA, per Section 4), so the Step 2 optimization modifier does not apply and Optimization level is omitted.
- **Justification:** Orion Context Broker has zero riscv64 CI - all 8 GitHub Actions workflows run exclusively on x86_64 (`ubuntu-latest`, `ubuntu-22.04`) or macos-latest runners with no QEMU cross-arch step and no multi-arch Docker buildx target ([codeql.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/codeql.yml) et al.). No Linux distribution packages the project at all, on any architecture (confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=FIWARE%20Orion%20Context%20Broker&suite=resolute&searchon=names&section=all): "Sorry, your search gave no results"), so the distribution floor that would otherwise upgrade to yellow does not apply - there is no downstream build to floor on. There is no evidence of confirmed breakage (which would warrant red) and no basis for grey (unknown-unknown), since exhaustive searching (issues, PRs, commits, code search, CI files, package registries, RISE) positively establishes complete absence of any riscv64 activity rather than uncertainty about its status. This is a baseline orange: no upstream CI, no distro package, not broken, not unknown - simply never attempted.
- **Pending work that could change the grade:** None found. No open PR, issue, or RISE-tracked project references riscv64 for this repository or for FIWARE/Telefonica generally (checked the full RISE blog post index, the RISE Python wheel builder listing, and the `riseproject-dev` GitHub org's full 25-repository listing - none relate to FIWARE or Orion). Any grade change would require a first, currently-nonexistent, external contribution.

## 14. Investment Analysis

RISE has done and funded no work on this project (confirmed: no RISE blog post, wheel-builder entry, or `riseproject-dev` org repository references FIWARE or Orion Context Broker in any form). All sizing below assumes work starting from zero.

### 14.1 Functional Enablement
- Fix the unconditional x86_64-specific linker path in `CMakeLists.txt` (Section 4) to not break riscv64 builds.
- Perform and validate a first riscv64 source build (no toolchain file, cross-compilation guidance, or prior build attempt exists to build on).
- Verify the full dependency chain (Section 9) resolves and links correctly on a real riscv64 target, since only distro-package *availability* was confirmed, not an actual Orion build against them.

### 14.2 Performance Optimization
Not applicable. Orion has no architecture-specific optimized code paths for any platform (Section 4); there is no SIMD/vectorization gap to close on riscv64 specifically.

### 14.3 CI/CD Infrastructure
- Add a riscv64 job to the existing GitHub Actions workflows (unit.yml, functional.yml at minimum) - either native RISC-V runners or QEMU-based cross-arch emulation, following the pattern already used for x86_64/`ubuntu-22.04`.
- Add `linux/riscv64` to the Docker publish workflows (`publishimage-master.yml`, `publishimage-tag.yml`), which already invoke `docker/setup-buildx-action@v2` but do not pass a `--platform` flag.

### 14.4 Ecosystem Enablement
Not applicable - Section 10 was omitted; Orion has no dependent package ecosystem requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix CMakeLists.txt unconditional x86_64 linker path; validate first riscv64 source build against existing dependency chain | 1-2 | Upstream (Telefonica) or external contributor | High |
| Functional | Manual/local validation of unit and functional test suites on riscv64 hardware/QEMU | 1-2 | Upstream or external contributor | Medium |
| CI/CD | Add riscv64 job to unit.yml and functional.yml (native runner or QEMU) | 1 | Upstream (Telefonica) | Medium |
| CI/CD | Add `linux/riscv64` target to publishimage-master.yml / publishimage-tag.yml Docker builds | 0.5 | Upstream (Telefonica) | Low |
| Distribution | Package Orion for a Linux distribution (none currently package it, on any architecture) - a prerequisite independent of riscv64 | 2-4 | Upstream or distro packagers | Low (blocked on broader packaging decision, not riscv64-specific) |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [telefonicaid/fiware-orion repository](https://github.com/telefonicaid/fiware-orion)
- [FIWARE Orion Context Broker documentation](https://fiware-orion.readthedocs.io/)
- [Commit 7dfe988 - aarch64/Raspberry Pi support](https://github.com/telefonicaid/fiware-orion/commit/7dfe988df0223a8ea8cbc5eb29921b131077a010)
- [docker/raspberry_pi.md](https://github.com/telefonicaid/fiware-orion/blob/master/docker/raspberry_pi.md)
- [doc/roadmap.md](https://github.com/telefonicaid/fiware-orion/blob/master/doc/roadmap.md)
- [doc/manuals/admin/build_source.md](https://github.com/telefonicaid/fiware-orion/blob/master/doc/manuals/admin/build_source.md)
- [CMakeLists.txt](https://github.com/telefonicaid/fiware-orion/blob/master/CMakeLists.txt)
- [.github/workflows/codeql.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/codeql.yml)
- [.github/workflows/compliance.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/compliance.yml)
- [.github/workflows/functional.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/functional.yml)
- [.github/workflows/publishimage-master.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/publishimage-master.yml)
- [.github/workflows/publishimage-tag.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/publishimage-tag.yml)
- [.github/workflows/unit.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/unit.yml)
- [.github/workflows/valgrind.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/valgrind.yml)
- [.github/workflows/valgrind-nocache.yml](https://github.com/telefonicaid/fiware-orion/blob/master/.github/workflows/valgrind-nocache.yml)
- [GitHub release 4.7.0 assets](https://github.com/telefonicaid/fiware-orion/releases/expanded_assets/4.7.0)
- [GitHub releases page](https://github.com/telefonicaid/fiware-orion/releases)
- [PyPI JSON API for fiware-orion-context-broker (404)](https://pypi.org/pypi/fiware-orion-context-broker/json)
- [PyPI simple index for fiware-orion-context-broker (404)](https://pypi.org/simple/fiware-orion-context-broker/)
- [RISE GitLab PyPI wheel mirror redirect](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/fiware-orion-context-broker/)
- [Ubuntu packages.ubuntu.com search, resolute, no results](https://packages.ubuntu.com/search?keywords=FIWARE%20Orion%20Context%20Broker&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search, no listing](https://archriscv.felixc.at/?q=fiware%20orion%20context%20broker)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [openssl/openssl#22871](https://github.com/openssl/openssl/issues/22871)
- [openssl/openssl#23011](https://github.com/openssl/openssl/issues/23011)
- [eclipse-mosquitto/mosquitto#3183](https://github.com/eclipse/mosquitto/issues/3183)
- [boostorg/test#345](https://github.com/boostorg/test/issues/345)
- [boostorg/atomic#65](https://github.com/boostorg/atomic/pull/65)
- [ContributionPolicy.txt](https://github.com/telefonicaid/fiware-orion/blob/master/ContributionPolicy.txt)
