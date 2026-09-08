---
title: Edge Impulse Ingestion SDK (C)
parent: Project Reports
color: orange
---

# Edge Impulse Ingestion SDK (C)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Ingestion SDK (C)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse Ingestion SDK (C) ([github.com/edgeimpulse/ingestion-sdk-c](https://github.com/edgeimpulse/ingestion-sdk-c)) is a small, header-only C99 library for buffering, CBOR-encoding, and optionally signing sensor data on embedded devices before uploading it to the Edge Impulse platform. It is not a compute or inference library - the actual RISC-V-relevant DSP/neural-network inference kernels for Edge Impulse live in separate repositories (`edgeimpulse/inferencing-sdk-c`, `edge-impulse-sdk`), not in this one.

The entire first-party codebase totals 1,447 lines across five files: `inc/ei_config.h`, `inc/sensor_aq.h`, `inc/signing/sensor_aq_mbedtls_hs256.h`, `inc/signing/sensor_aq_none.h`, and `test/main.c`. It links against two vendored git submodules: Mbed TLS (`Mbed-TLS/mbedtls`, for optional HMAC-SHA256 signing) and QCBOR (`laurencelundblade/QCBOR`, for CBOR payload encoding).

**Governance:** This is not a foundation-governed project. It is a single-vendor repository owned by Edge Impulse Inc., a commercial edge-AI company acquired by Qualcomm Technologies in March 2025. There is no MAINTAINERS, OWNERS, or CODEOWNERS file, and [docs.edgeimpulse.com's ingestion-sdk page](https://docs.edgeimpulse.com/docs/edge-impulse-studio/data-acquisition/ingestion-sdk) returns a 404 for a dedicated platform-support page. Effectively one person, Jan Jongboom (Edge Impulse co-founder/CTO), authored the entire substantive commit history in 2020; a single later commit ("Re-license to BSD 3-Clause", Feb 19, 2025) came from another Edge Impulse employee. No other companies or external contributors appear in the visible commit log.

**Corporate sponsors:** Edge Impulse Inc. / Qualcomm Technologies (post-acquisition parent). No other corporate involvement found.

**Community culture on new ports:** No contribution guide, platform-support tiering document, or stated policy on accepting new architecture ports exists anywhere in the repo or linked docs. The repository has had exactly one issue ever filed (unrelated to RISC-V, see Section 11) and zero pull requests in its history - there is effectively no active community to have a culture on this question.

**Repo profile:** Created 2020-01-24, last updated 2025-07-07, 27 stars, 3 forks, license BSD-3-Clause-Clear (changed from a more restrictive license on 2025-02-19, coinciding with the post-acquisition period).

## 2. Port History and Upstreaming Timeline

No riscv64 port work of any kind has been proposed, opened, discussed, merged, or closed in this repository.

| Date | Event | Source |
|---|---|---|
| - | No riscv64-related commit, issue, or PR exists | [search_commits](https://github.com/edgeimpulse/ingestion-sdk-c), [search_issues](https://github.com/edgeimpulse/ingestion-sdk-c/issues), [search_pull_requests](https://github.com/edgeimpulse/ingestion-sdk-c/pulls) - all `total_count: 0` for queries `riscv`, `riscv64`, `"risc-v"`, `rv64` |

**Key contributors:** Jan Jongboom (Edge Impulse, all substantive 2020 commits), one Edge Impulse employee (`automatiek`, single 2025 licensing commit). Neither has touched RISC-V-related work in this repo - there is none to touch.

**Is it fully upstream?** Not applicable - there is no riscv64 port to be upstream or out-of-tree. The project has never had any riscv64-specific code proposed against it.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. No document defines platform support tiers for this project.

**Evidence for CI, release-blocking status, or official binaries:** None. The repository has no CI system of any kind (see Section 7) and zero GitHub releases ("There aren't any releases here" - confirmed via [github.com/edgeimpulse/ingestion-sdk-c/releases](https://github.com/edgeimpulse/ingestion-sdk-c/releases)). There is consequently no release-blocking test gate for any architecture, riscv64 included.

| Architecture | Upstream CI build | Upstream CI test | Upstream release artifact |
|---|---|---|---|
| amd64 | No (no CI exists) | No | No (no releases exist) |
| arm64 | No (no CI exists) | No | No (no releases exist) |
| riscv64 | No (no CI exists) | No | No (no releases exist) |

All three architectures are treated identically: the project has no CI-gated or release-gated support tier for any of them. This is not a case of riscv64 being singled out for lesser treatment - the entire CI/release apparatus is absent for the whole project.

## 4. Technical Architecture and RISC-V-Specific Subsystems

This SDK contains no compute kernels, no CPU dispatch, and no architecture-specific code of any kind for any architecture. It is purely a data-acquisition/signing/transport library (ring buffers, JSON/CBOR framing, mbedTLS-based Ed25519/HMAC signing).

A repo-wide grep for architecture guard macros (`__riscv`, `__aarch64__`, `__arm__`, `__x86_64__`, `__i386__`, `_M_X64`, `_M_IX86`, `__mips__`, `__powerpc__`, `__wasm__`) across every `.c`/`.h`/`.cpp`/`.S`/Makefile returned **zero matches for every pattern**. This was independently corroborated via `mcp__github__search_code` for `__riscv`, `__aarch64__`, `__x86_64__`, and `__arm__`, each returning 0 results.

The only conditional compilation guards present anywhere in the codebase are:
- `__MBED__` (x5) - an RTOS/platform check (ARM Mbed OS presence), not a CPU-ISA check
- `__unix__` / `__APPLE__` && `__MACH__` (`sensor_aq.h:31`) - OS-family check to select a default stream type, treating Linux riscv64 identically to Linux x86_64/arm64
- `__cplusplus` - language check
- `EI_SENSOR_AQ_BLOCKDEVICE` - a build-time feature macro, not architecture-tied
- Makefile: `ifeq ($(OS),Windows_NT)` - links `-lws2_32` on Windows only

No `-march=`, `-mtune=`, CMSIS, NEON, SSE/AVX, or any SIMD/intrinsic reference exists anywhere in the repository. The build is a single portable-C99 compile: `$(CC) $(MACROS) $(CFLAGS) test/main.c $(LIB_CFILES) $(LDFLAGS) -o $(NAME)`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CBOR encoding (`sensor_aq.h`) | scalar (generic C) | scalar (generic C) | scalar (generic C) |
| HMAC-SHA256 signing (`sensor_aq_mbedtls_hs256.h`) | scalar (generic C, delegates to mbedTLS) | scalar (generic C, delegates to mbedTLS) | scalar (generic C, delegates to mbedTLS) |
| Unsigned/none signing (`sensor_aq_none.h`) | scalar (generic C) | scalar (generic C) | scalar (generic C) |
| Config/context layer (`ei_config.h`) | scalar (generic C) | scalar (generic C) | scalar (generic C) |

There is no "full (hand-tuned)" or "partial (C intrinsics)" tier for any architecture in this repo - all four architectures shown (including riscv64) receive identical architecture-agnostic scalar C. This is not the Edge Impulse *inference* SDK (which does contain CMSIS-NN/ESP-NN per-architecture kernels); it is the *ingestion* SDK, whose job (CBOR-encoding and signing sensor payloads) has no architecture-specific fast path to begin with. Consequently this is **not an optimization-purpose project** under the Step 2 modifier of the readiness color model - riscv64 carries no disadvantage relative to amd64 or arm64 because none of the three receives any hand-tuned code.

## 5. Build System, Cross-Compilation, and Toolchain

There is no CMake build system. No `CMakeLists.txt`, no `cmake/` directory, and no toolchain files (`cmake/riscv64.cmake` or equivalent) exist anywhere in the repository. The sole build mechanism is a flat GNU Makefile at the repo root:

```makefile
NAME = ingestion-sdk-example

CC ?= gcc
CFLAGS ?= -Wall

MACROS += -DEI_SENSOR_AQ_STREAM=FILE
CFLAGS += -I. -Imbedtls/include -Imbedtls/crypto/include -IQCBOR/inc -IQCBOR/src -Iinc -Iinc/signing
LIB_CFILES += QCBOR/src/*.c mbedtls/library/*.c

ifeq ($(OS),Windows_NT)
	LDFLAGS += -lws2_32
endif

all: build
build:
	$(CC) $(MACROS) $(CFLAGS) test/main.c $(LIB_CFILES) $(LDFLAGS) -o $(NAME)
clean:
	rm $(NAME)
```

**Documentation checked (none found):** `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md` - none exist. `README.md` exists but only documents building the example app for macOS/Linux (`make`) and Windows (MinGW-W64, `mingw32-make CC=gcc`); it does not mention cross-compilation, embedded targets, or any specific CPU architecture.

**Required toolchain versions:** Not documented anywhere - the build depends only on `$(CC)` (defaulting to `gcc`) and a C99-capable compiler; no minimum version is specified.

**QEMU usage:** None found anywhere in the repository.

**Known build failures:** Data not available - no CI has ever run a riscv64 build to surface one, and no issue in the repo's single-issue history concerns build failures on any non-x86/ARM platform.

**Conclusion:** This is a small header-only C99 SDK built with a plain `make` invocation intended for host-side development (encoding/signing sample data on the developer's own machine). It has no CMake-based configuration, no riscv64 toolchain integration, no Docker-based cross-compilation setup, and no QEMU-based testing infrastructure - because it has none of this infrastructure for any target, riscv64 included.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CBOR sensor payload encoding | Yes (generic C) | Yes (generic C) | Yes (generic C, untested) |
| HMAC-SHA256 signing via mbedTLS | Yes | Yes | Yes (mbedTLS itself is riscv64-packaged in Ubuntu 26.04, see Section 9) |
| Unsigned/"none" signing mode | Yes | Yes | Yes (generic C) |
| Windows sockets support (`-lws2_32`) | N/A (Windows-only path) | N/A | N/A |
| Build via plain `make` | Yes (documented) | Undocumented but should work (generic C) | Undocumented, never verified |

**Functional gaps:** None identified structurally - the source contains no architecture-conditional code that would exclude riscv64 from any feature. The gap is entirely a verification gap: no one has built or run this code on riscv64, upstream or otherwise (see Sections 2, 7, 11).

**Performance gaps:** N/A - there is no SIMD-accelerated or hand-tuned path on any architecture for this SDK to lose on riscv64 (see Section 4).

**Security hardening gaps:** Data not available - no riscv64-specific hardening flags, ASLR/stack-protector configuration, or security audit exists for this project on any architecture; none of this is documented in the repository for any target.

**NaN / floating-point semantics issues:** Data not available: searched GitHub issues (`riscv nan floating repo:edgeimpulse/ingestion-sdk-c`) and general web search for riscv floating-point bug reports involving this SDK - zero results. This SDK is not a numerically-intensive library (it is a CBOR/signing transport layer), so floating-point semantics divergence is a low-relevance risk for this specific project.

## 7. CI/CD Infrastructure

**No CI of any kind exists for this project.** Verified via a fresh `git clone --depth 1` of `https://github.com/edgeimpulse/ingestion-sdk-c` at HEAD `5e0c95b5bc49c5a6d303df44485a23e6a8b29fff` and direct filesystem inspection:

```
$ ls -la /home/user/edgeimpulse/ingestion-sdk-c/.github
ls: cannot access '/home/user/edgeimpulse/ingestion-sdk-c/.github': No such file or directory
```

There is no `.github` directory at all - not workflows, not any other subpath. The full repository tree (11 tracked files) is:

```
.gitignore
.gitmodules
LICENSE
Makefile
README.md
img/cborme.png
inc/ei_config.h
inc/sensor_aq.h
inc/signing/sensor_aq_mbedtls_hs256.h
inc/signing/sensor_aq_none.h
test/decode.js
test/encode.js
test/main.c
```

No `.yml`, `.yaml`, `Jenkinsfile*`, `.gitlab-ci.yml`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines*` file exists anywhere in the tree (confirmed via an unrestricted `find` across the full checkout). A repo-wide case-insensitive grep for `riscv|risc-v|rv64|rv32` across every file returned zero matches.

**RISE runners:** Not applicable - there is no CI to run on any runner, RISE or otherwise.

**Hardware used:** N/A - no CI exists.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | No (no CI exists) | No (no CI exists) | No (no CI exists) |
| CI runs tests | No | No | No |
| CI publishes release | No | No | No |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**GitHub releases:** Zero. Confirmed via [github.com/edgeimpulse/ingestion-sdk-c/releases](https://github.com/edgeimpulse/ingestion-sdk-c/releases): "There aren't any releases here." No release assets of any kind exist, for any architecture.

**PyPI:** Not applicable/not found. Fetched `https://pypi.org/pypi/edge-impulse-ingestion-sdk-(c)/json` -> HTTP 404. Fetched `https://pypi.org/simple/edge-impulse-ingestion-sdk-(c)/` -> HTTP 404. This is a C library, not published as a Python package under any tried name.

**RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-ingestion-sdk-(c)/` returns a 302 redirect to the (404) PyPI page - no entry in RISE's wheel-build registry.

**npm, Maven, OCI:** Not applicable - this is a header-only C library with no packages in any of these ecosystems (no manifest for any was found in the repository).

**Ubuntu/Debian/Fedora/Arch packages:** None found under any tried naming variant.
- Ubuntu 26.04 (resolute) via `packages.ubuntu.com` search: "No matching packages" / "keyword too generic."
- Project graph SPARQL query against `deb#BinaryPackage` filtered on riscv64 + resolute + this package's name variants: 0 bindings.
- Arch Linux RISC-V port tracker ([archriscv.felixc.at](https://archriscv.felixc.at/)): no listing or entry matching "Edge Impulse Ingestion SDK" found.
- Fedora, Debian: not separately checked but no evidence surfaced in any general search; treated as absent given the consistent zero-result pattern across every other channel.

**What must a user do to get a working binary?** There is no binary to obtain from any channel. A user targeting riscv64 (or any architecture) must clone the repository, initialize the `mbedtls` and `QCBOR` git submodules, and compile from source using `make` with a working C99 toolchain - this is also the only documented path for amd64 and arm64, since no distribution channel of any kind exists for this project.

## 9. Dependencies

The dependency manifest is `.gitmodules` + `Makefile`; the project declares exactly two git-submodule dependencies, both compiled directly into the SDK (`LIB_CFILES += QCBOR/src/*.c mbedtls/library/*.c`).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| [Mbed TLS](https://github.com/Mbed-TLS/mbedtls) | Crypto backend for optional HS256 signing (`inc/signing/sensor_aq_mbedtls_hs256.h`) | Portable C, no arch-specific asm blocking it; no dedicated riscv64 CI signal found for mbedTLS itself | No dedicated riscv64 CI signal found | Ships as a normal Debian riscv64 binary package in Ubuntu 26.04 (`libmbedtls-dev`, `libmbedtls21`, `libmbedcrypto16`, `libmbedx509-7` all present for riscv64/resolute per project graph query) | GitHub issue search for "riscv64"/"riscv" against `Mbed-TLS/mbedtls` returned only closed, unrelated issues (a 2020 32-bit RISC-V hardening-flag crash, #3066, long since closed); 0 open riscv-tagged issues |
| [QCBOR](https://github.com/laurencelundblade/QCBOR) | CBOR payload encoder, used unconditionally (`inc/sensor_aq.h`) | Source is portable C99 with no architecture-specific/SIMD code paths visible in this SDK's usage; not itself distro-packaged so no build signal exists | Not verified on real riscv64 hardware; no CI signal available | No Ubuntu (or any distro) package exists at all - QCBOR is consumed only as a vendored git-submodule source drop, not via apt or any package manager, on any architecture | GitHub issue search for "riscv"/"riscv64" against `laurencelundblade/QCBOR` returned 0 results (open or closed) - no evidence of a problem, but also no evidence anyone has exercised it there |

**Deep-dive: Mbed TLS.** This is the only dependency with meaningful crypto/numerics surface (HMAC-SHA256, Ed25519 signing paths). It is well-covered on riscv64: packaged for Ubuntu 26.04 riscv64 (`resolute` suite) with all transitive libraries present per the project graph, and no open riscv-tagged issues exist upstream. Mbed TLS is separately tracked in this ecosystem's `projects.yml` scope ("Mbed TLS", line 1523), though its own dedicated status report (`project-reports/mbed-tls.md`) has not yet been written as of this research pass - flagged here as a documentation gap in the broader ecosystem tracking, not a technical blocker for this SDK.

**Deep-dive: QCBOR.** Pure, portable C99 with no architecture-specific code, so lowest structural risk of any dependency here - but also the least-verified, since it is not part of any distribution's riscv64 build/test matrix and is not separately tracked in this ecosystem's `projects.yml` scope. Its "riscv64 status" is best described as "never distro-packaged, vendor-source-only, no known issues either way," which mirrors the parent SDK's own status.

Neither dependency is present in `projects.yml` under a name matching "Edge Impulse Ingestion SDK (C)" itself; the SDK is not separately tracked as an ecosystem entry.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1](https://github.com/edgeimpulse/ingestion-sdk-c/issues/1) | "Trying to get SDK work on Arduino Nano 33 BLE Sense" | Open (since 2020-03-02) | Unrelated to RISC-V | Concerns `FILE`/`fseek` aliasing failing to compile for Arduino Nano BLE 33 (ARM Cortex-M4) - not a RISC-V issue |

This is the repository's **entire** issue history - one issue, filed in 2020, still open, unrelated to RISC-V. The repository has never had a single pull request opened against it (`search_pull_requests` for `is:pr` returns `total_count: 0`). There are no riscv64-specific correctness bugs to report because no one has exercised this code on riscv64 to discover any.

**Correctness bugs:** None found for any architecture beyond the single unrelated Arduino compatibility issue above.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer statement, issue comment, or documentation anywhere addresses RISC-V, positively or negatively - the topic has simply never come up.

**Technical blockers:** None identified. The source is confirmed portable C99 with no architecture-specific guards (Section 4), and its only meaningful dependency with crypto/numerics surface (Mbed TLS) is already riscv64-clean per Ubuntu packaging and upstream issue tracking (Section 9).

**Organizational blockers:** The project is effectively single-maintainer (Jan Jongboom, Edge Impulse/Qualcomm) with a dormant commit history (no activity Dec 2020 - Feb 2025, one licensing commit since). There is no active community to propose or review a riscv64 addition, and no contribution process is documented. Getting any change merged - RISC-V or otherwise - would depend on reaching an Edge Impulse/Qualcomm employee directly, since the repository shows no evidence of routine external-PR review (zero PRs merged, ever).

**Acceptance probability:** Given the code is already architecture-neutral and would very likely "just work" on riscv64 without modification, a hypothetical PR adding riscv64 CI would face no technical objection basis found in the record. However, given the project's near-total dormancy (one issue and zero PRs in over five years) [NEEDS VERIFICATION: no direct maintainer statement on responsiveness could be found], there is no evidence either way of how quickly or whether such a contribution would be reviewed and merged.

## 13. Readiness Assessment

- **Color:** orange (no formal sub-type from the two named orange cases applies exactly - there is no upstream CI and no distribution package exists at all, so this is the base "no upstream CI, no test, no release" row rather than the `downstream-only` sub-type, since no distro ships this project under any name)
- **Release provider:** none
- **Optimization gap:** N/A - this is not an optimization-purpose project. The test is whether the project would still deliver its value proposition using only generic C on RISC-V; since it already uses only generic, architecture-agnostic C on every architecture it targets (Section 4), this test is trivially satisfied and the Step 2 modifier does not apply.
- **Justification:** No CI system of any kind exists in this repository - confirmed via a fresh clone at HEAD `5e0c95b5bc49c5a6d303df44485a23e6a8b29fff` showing no `.github` directory and no CI configuration files anywhere in the tree ([edgeimpulse/ingestion-sdk-c](https://github.com/edgeimpulse/ingestion-sdk-c)). No distribution channel (Ubuntu 26.04, PyPI, RISE wheel builder, Arch RISC-V) packages this project under any name, so the distribution floor from the color model does not apply - there is no downstream build to float on. The source is confirmed portable C99 with zero architecture-specific guards for any architecture (Section 4), so there is no known technical blocker to riscv64 support, but the project has simply never been built or tested on riscv64 by anyone, upstream or downstream. This combination - no CI, no test, no release, but no positive evidence of breakage - places it at orange per the color model's base row, not red (reserved for confirmed breakage) and not grey unknown-unknown (the source itself is fully visible and its architecture-neutrality is well-established, so this is not an unresolvable data gap).
- **Pending work that could change the grade:** None identified. There is no open PR, no tracking issue, and no RISE involvement or funding found anywhere in the research (RISE blog, RISE member list, RISE GitLab wheel builder - all checked, none reference this project). Neither Edge Impulse nor Qualcomm's RISE board membership extends to any RISC-V work on this specific SDK.

## 14. Investment Analysis

**RISE involvement check:** RISE has not funded or performed any work on this project. Checked: [riseproject.dev/blog](https://riseproject.dev/blog), the RISE member list, the RISE GitLab wheel builder package list, and all 25 repos in the `riseproject-dev` GitHub org - none reference Edge Impulse or this SDK. No work items below are already covered by RISE.

### 14.1 Functional Enablement

Given the code is already architecture-neutral C99 with no architecture-specific guards, functional enablement work is minimal: build and run the existing test suite (`test/main.c`) on riscv64 hardware or under emulation to confirm the assumption of "portable by construction" holds in practice, since it has never actually been verified.

### 14.2 Performance Optimization

Not applicable. This SDK has no hand-tuned or SIMD-accelerated code path on any architecture (Section 4); there is no performance-optimization work to do that would differentiate riscv64 from amd64/arm64, since none of them receive optimized code today.

### 14.3 CI/CD Infrastructure

The project has no CI at all for any architecture. Adding riscv64 CI would require first adding CI infrastructure for the project generally (a `.github/workflows` directory does not exist for amd64 or arm64 either) - this is a broader gap than a riscv64-specific one.

### 14.4 Ecosystem Enablement

Not applicable per Section 10 scope rule - this project is a standalone C library/tool with no dependent package ecosystem (no npm, PyPI, Maven, or Kubernetes-operator consumers found in research). Section 10 is omitted from this report accordingly.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Build and run existing `test/main.c` test suite on riscv64 hardware/QEMU to confirm portability holds in practice | 0.5-1 | Edge Impulse (upstream) or third-party contributor | Low |
| CI/CD | Add basic CI (currently absent for all architectures) with a riscv64 build+test job | 1-2 | Edge Impulse (upstream) | Low |
| Distribution | Publish a first GitHub release with build artifacts, or work with a distro to package it | 1 | Edge Impulse (upstream) | Low |

Given the project's low traffic (27 stars, one open issue in five years, zero merged PRs, near-total dormancy since 2020), the practical priority of any of this work is low relative to actively-maintained, higher-traffic projects in a RISC-V investment portfolio. The technical risk of enabling riscv64 is assessed as minimal (portable C99, no architecture-specific code, riscv64-clean crypto dependency), but the organizational path to landing any change is unclear given the repository's inactivity.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/ingestion-sdk-c repository](https://github.com/edgeimpulse/ingestion-sdk-c)
- [edgeimpulse/ingestion-sdk-c releases page](https://github.com/edgeimpulse/ingestion-sdk-c/releases) - "There aren't any releases here"
- [edgeimpulse/ingestion-sdk-c issue #1](https://github.com/edgeimpulse/ingestion-sdk-c/issues/1) - "Trying to get SDK work on Arduino Nano 33 BLE Sense"
- [Edge Impulse Ingestion SDK docs page](https://docs.edgeimpulse.com/docs/edge-impulse-studio/data-acquisition/ingestion-sdk) - referenced project homepage
- [Mbed-TLS/mbedtls repository](https://github.com/Mbed-TLS/mbedtls) - crypto dependency
- [laurencelundblade/QCBOR repository](https://github.com/laurencelundblade/QCBOR) - CBOR encoding dependency
- [PyPI JSON endpoint check](https://pypi.org/pypi/edge-impulse-ingestion-sdk-(c)/json) - HTTP 404, package not found
- [PyPI simple index check](https://pypi.org/simple/edge-impulse-ingestion-sdk-(c)/) - HTTP 404, package not found
- [RISE GitLab PyPI wheel mirror](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-ingestion-sdk-(c)/) - 302 redirect to (404) PyPI page
- [Ubuntu package search (resolute/26.04)](https://packages.ubuntu.com/search?keywords=Edge%20Impulse%20Ingestion%20SDK%20(C)&suite=resolute&searchon=names&section=all) - no matching packages
- [Arch Linux RISC-V port tracker](https://archriscv.felixc.at/) - no listing for this package
- [RISE Project blog](https://riseproject.dev/blog) - no posts referencing this project
- [RISE Project homepage / member list](https://riseproject.dev/) - premier and general member list, no reference to Edge Impulse
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/) - "Edge Impulse Ingestion SDK (C)" not listed