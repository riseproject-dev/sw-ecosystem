---
title: SWUpdate
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: build-dependency
    criticality: critical
  - name: wolfSSL
    relation: build-dependency
    criticality: optional
  - name: Mbed TLS
    relation: build-dependency
    criticality: optional
  - name: GPGME
    relation: build-dependency
    criticality: optional
  - name: p11-kit
    relation: build-dependency
    criticality: optional
  - name: zlib
    relation: build-dependency
    criticality: optional
  - name: xz
    relation: build-dependency
    criticality: optional
  - name: zstd
    relation: build-dependency
    criticality: optional
  - name: LZ4
    relation: build-dependency
    criticality: optional
  - name: libarchive
    relation: build-dependency
    criticality: critical
  - name: zchunk
    relation: build-dependency
    criticality: optional
  - name: librsync
    relation: build-dependency
    criticality: optional
  - name: Lua
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="swupdate" %}

# SWUpdate

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for SWUpdate<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SWUpdate is a Linux userspace OTA (over-the-air) update agent for embedded devices: it flashes update images (via handlers for raw partitions, UBI, filesystems, bootloader environments, etc.), verifies signatures/checksums, and integrates with device-management backends (notably Eclipse hawkBit via its "suricatta" client mode). It is written in C, licensed GPL-2.0-only for the core with LGPL-2.1-or-later for `libswupdate`, and vendors a third-party embedded HTTP/web server library (Mongoose) for its built-in web UI/API.

**Governance:** SWUpdate has no formal foundation membership. It is a BDFL-style, single-maintainer project led by Stefano Babic (copyright holder since 2013), whose affiliation moved from DENX Software Engineering (commits under `sbabic@denx.de` through 2023) to his own consultancy (`stefano.babic@swupdate.org` / `security@nabladev.com`). It is recognized by the Civil Infrastructure Platform (CIP), a Linux Foundation project, as an endorsed OTA-update mechanism, but SWUpdate itself is not governed by CIP, the Linux Foundation, Apache, or Eclipse.

**Review process:** Contributions go through a mailing-list/patch workflow, not GitHub PRs -- the repository explicitly states GitHub PRs are ignored. Patches are sent to `swupdate@googlegroups.com` and tracked on Patchwork ([patchwork.ozlabs.org/project/swupdate](https://patchwork.ozlabs.org/project/swupdate)), requiring DCO sign-off, kernel-style codestyle, and a successful build across all `configs/`.

**Corporate sponsors and top contributors (by commit volume, `git shortlog` on `sbabic/swupdate`):**

| Contributor | Company | Commits |
|---|---|---|
| Stefano Babic | DENX Software Engineering -> independent | 1090 + 321 |
| Christian Storm | Siemens (formerly TNG Technology Consulting) | 379 + 72 + 21 |
| Dominique Martinet | Atmark Techno | 89 |
| Jorg Krause | embedded.rocks (consultancy) | 63 |
| Michael Adler | Siemens | 57 |
| Bastian Germann | Debian / Linutronix | 35 + 35 |
| Stefan Herbrechtsmeier / Roland Gaudig | Weidmuller | 27 / 15 |
| Christian Eggers | ARRI | 25 |
| Michael Glembotzki | iris-GmbH (iris-sensing) | 25 + 38 |
| Philippe Reynes | SoftAtHome | 19 |
| Sava Jakovljev | Teufel | 19 |
| Maciej Borzecki | Open-RnD | 17 |
| Denis Osterland | Diehl | 14 |
| Felix Moessbauer | Siemens | 11 |
| Ayoub Zaki | Embetrix | 10 |
| Diego Rondini | Kynetics | 10 |

Some already-shipped features are funded/sponsored by adopters and disclosed in the project's public roadmap (`doc/source/improvement_proposals.rst`), e.g. update-types and asymmetric decryption sponsored by iris-GmbH, and hawkBit delta-update backend work sponsored by Orica Digital Solutions. This is effectively a "sponsor the feature or contribute the patch" model rather than a formal architecture-tier system; there is no PLATFORMS.md/SUPPORT.md/OWNERS/MAINTAINERS/CODEOWNERS file governing which CPU architectures are supported.

Adopters cited on the project homepage ([sbabic.github.io/swupdate](https://sbabic.github.io/swupdate/)) include Victron Energy, Weidmuller, Viessmann, Lafon Technologies, GARDENA, Kynetics, and ChirpStack.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port to timeline. `git log --all -i --grep="risc"` across the full 3005-commit history returns zero matches. `git log --all -S"riscv"` (pickaxe, diff-content search) returns exactly two matches, both routine version bumps of the vendored third-party Mongoose library, unrelated to SWUpdate's own code or portability:

| Date | Event | Source |
|---|---|---|
| 2024-06-15 | Commit `54acab7c` (Michael Glembotzki, iris-sensing): "mongoose: Update to version 7.14" -- pulls in Mongoose's own `__riscv` microcontroller guards | [sbabic/swupdate](https://github.com/sbabic/swupdate) commit history (GitHub `search_commits`) |
| 2025-03-21 | Commit `e6f45638` (Michael Glembotzki): "mongoose: Update to version 7.14->7.17" -- same, further Mongoose version bump | [sbabic/swupdate](https://github.com/sbabic/swupdate) commit history (GitHub `search_commits`) |

No riscv64-related issue, pull request, or dedicated code change has ever been opened in `sbabic/swupdate`, confirmed by repeated, independently-verified zero-result searches across `search_issues`, `search_pull_requests`, `search_commits`, and `search_code` (queries "riscv", "riscv64", "RISC-V", "risc"), and by a direct repo-wide case-insensitive grep at commit `ca6a85de51166d9774429d3bb2f7cd17e39540c5`.

**Is it fully upstream?** There is nothing to upstream. SWUpdate is architecture-agnostic Linux userspace C code with no per-CPU-architecture source tree (see Section 4). RISC-V "support" was never a porting project because no CPU-specific code exists to port -- the project builds on any target for which a standard Linux cross-toolchain and its library dependencies (OpenSSL/mbedTLS/WolfSSL, libconfig, zlib, etc.) are available.

## 3. Upstream Support Tier

There is no formal, written tier policy distinguishing architectures. In practice, architecture support is an emergent property of SWUpdate's design (generic POSIX/Linux code, no CPU-specific branches) rather than a declared policy. Evidence:

- **CI:** builds and tests exclusively on x86_64 containers (see Section 7). No architecture matrix of any kind exists in CI -- amd64 is not distinguished from any other architecture as a "supported tier," it is simply the only one exercised.
- **Release-blocking:** no CI job is architecture-gated; the only branch-restricted job is `coverity` (static analysis), unrelated to target architecture.
- **Official binaries:** GitHub Releases ship source archives only (`.zip`/`.tar.gz`), for every architecture including amd64 -- there are no upstream-built binaries for any target architecture, arm64 included.

| Architecture | Upstream CI build | Upstream CI test | Upstream release binary | Distro binary available |
|---|---|---|---|---|
| amd64 | Yes (native GitHub/GitLab runners) | Yes | No (source-only releases) | Yes (all major distros) |
| arm64 | No (not present in any CI matrix) [NEEDS VERIFICATION -- not exhaustively searched for this report, inferred from the absence of any arch matrix in CI] | No | No (source-only releases) | Yes (Ubuntu 26.04 "resolute": `amd64 arm64 armhf ppc64el riscv64 s390x`) |
| riscv64 | No (confirmed, see Section 7) | No | No (source-only releases) | Yes, Ubuntu 26.04 "resolute" only, unpatched build (see Section 8) |

Because SWUpdate has no CPU-architecture abstraction layer, this table primarily reflects "which architectures has anyone bothered to test/package," not differing levels of source-code readiness -- amd64's only structural advantage is that it is the one architecture CI actually exercises.

## 4. Technical Architecture and RISC-V-Specific Subsystems

SWUpdate has essentially no CPU-architecture-specific code. Confirmed via targeted GitHub code search against `sbabic/swupdate` at commit `ca6a85de51166d9774429d3bb2f7cd17e39540c5`:

| Query | Result |
|---|---|
| `riscv repo:sbabic/swupdate` | 0 hits |
| `__riscv repo:sbabic/swupdate` | 0 hits |
| `__aarch64__ repo:sbabic/swupdate` | 1 hit |
| `__x86_64__ repo:sbabic/swupdate` | 0 hits |
| `__arm__ repo:sbabic/swupdate` | 1 hit |
| `uname -m repo:sbabic/swupdate` | 0 hits |

The **only** file in the entire repository containing any CPU-architecture `#ifdef` is `mongoose/mongoose.h` -- the vendored, third-party Cesanta Mongoose embedded web-server library (bundled for the built-in web UI/API), not code authored or maintained by the SWUpdate project. Inside it, the sole arch-specific logic selects an assembly-optimized backend for the bundled micro-ecc (uECC) crypto library:

```c
#elif defined(__arm_thumb2__) ...
#define MG_UECC_PLATFORM mg_uecc_arm_thumb
#elif defined(__arm__) || defined(_M_ARM)
#define MG_UECC_PLATFORM mg_uecc_arm
#elif defined(__aarch64__)
#define MG_UECC_PLATFORM mg_uecc_arm64
#elif defined(__amd64__) || defined(_M_X64)
#define MG_UECC_PLATFORM mg_uecc_x86_64
#else
/* generic/default C fallback */
```

RISC-V is not a named branch; it falls into the trailing `#else`, the same generic-C fallback used by any architecture Mongoose does not specifically recognize. This is a minor, isolated performance-only gap in one vendored dependency's crypto backend -- not a functional gap, and not part of SWUpdate's own code.

A separate grep for `CONFIG_ARCH` in `Kconfig` returned 28 hits, all of which are substring false-positives on `CONFIG_ARCHIVE` (the libarchive-support option) -- SWUpdate's Kconfig has no CPU-architecture selection symbol at all. There is no `arch/` directory, no per-arch `Makefile` fragment, and `handlers/Makefile` selects objects purely by feature flag (`CONFIG_BOOTLOADERHANDLER`, `CONFIG_EMMC_HANDLER`, etc.), never by target CPU.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core update engine, handlers, parsers, suricatta client | Generic C (not applicable to rate per-arch) | Generic C (not applicable to rate per-arch) | Generic C (not applicable to rate per-arch) |
| Vendored Mongoose uECC crypto backend | Hand-selected asm-assisted path (`mg_uecc_x86_64`) | Hand-selected asm-assisted path (`mg_uecc_arm64`) | Scalar (falls through to generic C fallback; no dedicated backend) |

There is no JIT, no SIMD dispatch, no GC, and no assembly authored by the SWUpdate project itself anywhere in the codebase -- this project has no architecture-specific "porting" surface by design, which is consistent with Debian/Ubuntu shipping it for riscv64 with zero source patches (Section 8).

## 5. Build System, Cross-Compilation, and Toolchain

SWUpdate does not use CMake -- there is no `CMakeLists.txt` anywhere in the repository. It uses a Linux-kernel-style Kconfig + Kbuild Makefile system.

**Documented build commands** (`doc/source/swupdate.rst`):
```
make menuconfig      # configure options, including CROSS_COMPILE prefix
make                 # builds ./swupdate and ./tools/swupdate-progress
```
Cross-compilation is generic (architecture-agnostic) via Kconfig:
```
config CROSS_COMPILE
    string "Cross Compiler prefix"
    default ""
config SYSROOT
    string "Path to sysroot"
    default ""
```
`Makefile` derives all toolchain binaries (`AS`, `LD`, `CC`, `AR`, `NM`, `STRIP`, `OBJCOPY`, `OBJDUMP`) from `CROSS_COMPILE`. For a riscv64 target this would be, e.g.:
```
make CC=riscv64-linux-gnu-gcc CXX=riscv64-linux-gnu-g++
```
or via `make menuconfig` setting `CONFIG_CROSS_COMPILE="riscv64-linux-gnu-"` and `CONFIG_SYSROOT`. CI's out-of-tree variant (`ci/test-configs.sh`) uses:
```
make O=$BUILD_DIR <name>_defconfig
make O=$BUILD_DIR -j$(nproc)
```

**No riscv64-specific documentation, defconfig, toolchain file, or Dockerfile exists anywhere in the repository.** Confirmed by: full recursive `grep -rli riscv .` (only the vendored Mongoose hit noted in Section 4); `find . -iname "*riscv*"` (zero matches); GitHub code search `riscv64 repo:sbabic/swupdate filename:Dockerfile` (0 results, and no Dockerfile of any kind exists in the repo). There is also **no QEMU usage anywhere in the repository** (`grep -rli qemu .` returns empty).

A vestigial, commented-out line remains in `Makefile` (`#include $(srctree)/arch/$(SRCARCH)/Makefile`), a leftover from the Busybox/kernel-derived Kbuild template -- no `arch/` directory exists and `SRCARCH` is never assigned. The build is architecture-agnostic at the Makefile level; there is no per-arch build logic to "riscv64-enable."

**Toolchain version requirements:** nothing riscv64-specific is documented. The only compiler-version gating in `Makefile.flags` is cosmetic warning-flag selection (e.g. `-Wno-format-truncation` at GCC >= 7.0), skipped entirely under Clang. No minimum GCC/Clang version is stated for any architecture; any riscv64 minimum would come from the toolchain itself, not from SWUpdate's own documentation.

**Kconfig options:** SWUpdate uses `CONFIG_*` boolean toggles (`make menuconfig`), not CMake `-D` flags -- e.g. `CONFIG_WEBSERVER`, `CONFIG_SURICATTA`, `CONFIG_LUA`, `CONFIG_SIGNED_IMAGES`, `CONFIG_ENCRYPTED_IMAGES`, `CONFIG_UBOOT`. None of the 22 files in `configs/*_defconfig` are architecture-specific; they toggle features, not target CPU.

**Bottom line:** any riscv64 build of SWUpdate today comes from an external cross-toolchain/sysroot -- typically supplied via Yocto's `meta-swupdate` layer or Buildroot's `package/swupdate` (both referenced in the project's `README.md` as the primary build integrations) -- feeding the generic `CROSS_COMPILE`/`SYSROOT` mechanism. None of that riscv64 tooling lives in `sbabic/swupdate` itself.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core update engine (image flashing, handlers) | Full | Full (architecture-agnostic C) | Full (architecture-agnostic C) |
| Signature verification (OpenSSL/wolfSSL/mbedTLS/GPGME backends) | Full | Full | Full, functionally; see Section 9 for backend-level RISC-V optimization status |
| Web UI / suricatta hawkBit client (Mongoose) | Full, with asm-assisted uECC path | Full, with asm-assisted uECC path | Full functionally; uECC crypto falls back to scalar/generic-C path (Section 4) |
| Bootloader env handling (U-Boot, EFI Boot Guard) | Full | Full | Full (architecture-agnostic; `libebgenv-dev`/`CONFIG_BOOTLOADER_EBG` covers riscv64 per Debian packaging) |
| Compression handlers (zlib, xz/lzma, zstd, lz4) | Full | Full | Full at the SWUpdate integration level; see Section 9 for each library's own riscv64 optimization status |

**Functional gaps:** none identified. There is no reported case of a SWUpdate feature that cannot run on riscv64.

**Performance gaps:** the only architecture-differentiated performance path identified anywhere in the codebase is the vendored Mongoose uECC crypto backend (Section 4), which uses a generic scalar C fallback on riscv64 versus hand-tuned assembly-assisted paths on amd64/arm64/arm. This affects only the built-in web UI's own TLS/ECC operations, not SWUpdate's primary signature-verification path (which goes through OpenSSL/wolfSSL/mbedTLS/GPGME, each with independent RISC-V optimization status -- see Section 9).

**Security hardening gaps:** none identified specific to riscv64; no riscv64-related CVE, hardening-flag issue, or ASLR/stack-protector gap was found in the research (searches returned zero riscv-related issues of any kind in the repository).

**NaN / floating-point semantics issues:** not applicable -- SWUpdate performs no floating-point-sensitive numerical computation; it is an image-flashing/update-orchestration tool.

## 7. CI/CD Infrastructure

**There is no riscv64 CI for SWUpdate.** Verified by reading every CI definition file in the repository at commit `ca6a85de51166d9774429d3bb2f7cd17e39540c5`:

| File | Trigger | Runner | What it does |
|---|---|---|---|
| [`.github/workflows/ci_tests.yml`](https://github.com/sbabic/swupdate/blob/master/.github/workflows/ci_tests.yml) | `on: push` | `ubuntu-24.04` (GitHub-hosted, x86_64) | Matrix of 3 containers (`ubuntu:24.04`, `debian:bookworm-slim`, `debian:sid-slim`), all x86_64 -- runs `ci/setup.sh` then `ci/test-configs.sh` |
| [`.github/workflows/contributing.yml`](https://github.com/sbabic/swupdate/blob/master/.github/workflows/contributing.yml) | `pull_request_target: opened` | `ubuntu-latest` | Posts a bot comment from `contributing.rst`; not a build/test job |
| [`.github/workflows/reuse.yml`](https://github.com/sbabic/swupdate/blob/master/.github/workflows/reuse.yml) | `on: push` | `ubuntu-24.04` | License-compliance lint only (`reuse lint`) |
| [`.gitlab-ci.yml`](https://github.com/sbabic/swupdate/blob/master/.gitlab-ci.yml) | GitLab CI | `image: ubuntu:noble` (x86_64) | Jobs: `ubuntu-noble` (build+test), `coverity` (branch-restricted static analysis), `clang` (build+test with clang), `reuse` (lint) |

No `Jenkinsfile` or `.cirrus.yml` exists. No job sets `runs-on`/`image` to anything riscv64, uses `docker buildx --platform`, QEMU, `uses: uraimo/run-on-arch-action`, or any cross-compilation toolchain. The scripts these workflows call (`ci/setup.sh`, `ci/test-configs.sh`, `ci/coverity.sh`) contain no architecture-conditional logic -- they install a fixed x86 dependency list and run the same test-config script regardless of host.

No reference to RISE RISC-V runners (`riseproject-dev`, RISE runner labels) exists anywhere in CI configuration. No hardware (native or QEMU) of any kind is used for riscv64, because no riscv64 job exists.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (GitHub Actions + GitLab CI, native x86_64) | No (not present in matrix) [NEEDS VERIFICATION] | No |
| CI tests | Yes | No | No |
| Release-blocking | No jobs are release-gated by architecture | N/A | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**No upstream binaries of any kind.** GitHub Releases for `sbabic/swupdate` are source-archive-only. Checked the two most recent releases via the raw asset-fragment endpoint:
- **2026.05.1** (Jun 2026): assets = `2026.05.1.zip`, `2026.05.1.tar.gz`
- **2025.12** (Dec 2025): assets = `2025.12.zip`, `2025.12.tar.gz`

No riscv64 (or any architecture-specific) binary asset is attached to any release -- consistent with SWUpdate being a source-built embedded Linux component.

**PyPI:** not applicable. `https://pypi.org/pypi/swupdate/json` and `https://pypi.org/simple/swupdate/` both return HTTP 404 -- no such package exists (SWUpdate is a C-based framework, not a Python package). The RISE wheel builder mirror (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/swupdate/`) 302-redirects to the same 404 PyPI page.

**Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/)): no `swupdate` package listed.

**Ubuntu 26.04 "resolute": confirmed riscv64 binaries exist**, built from unmodified upstream source:

| Package | Architectures |
|---|---|
| swupdate | amd64, arm64, armhf, ppc64el, riscv64, s390x |
| libswupdate0.1 | amd64, arm64, armhf, ppc64el, riscv64, s390x |
| libswupdate-dev | amd64, arm64, armhf, ppc64el, riscv64, s390x |
| lua-swupdate | amd64, arm64, armhf, ppc64el, riscv64, s390x |
| swupdate-doc | all (noarch docs) |
| swupdate-www | all (noarch web assets) |

Verified live at the raw HTTP level (not merely via a summarized fetch): [packages.ubuntu.com/resolute/riscv64/swupdate](https://packages.ubuntu.com/resolute/riscv64/swupdate) shows a fully resolved riscv64 dependency graph and a download entry for `swupdate_2025.12+dfsg-4ubuntu1_riscv64.deb` (460.6 kB package, 1,352.0 kB installed). A direct `curl -I` against the actual mirror file returned:
```
HEAD http://ports.ubuntu.com/ubuntu-ports/pool/universe/s/swupdate/swupdate_2025.12+dfsg-4ubuntu1_riscv64.deb
HTTP/1.1 200 OK
last-modified: Fri, 27 Feb 2026
```
This is a real, downloadable riscv64 binary. No riscv64-specific patches were required in the Ubuntu/Debian packaging diff -- the build is from vanilla upstream source, which is expected given SWUpdate's architecture-agnostic design (Section 4).

**What a user must do to get a working riscv64 binary today:** install from Ubuntu 26.04 "resolute" (`apt install swupdate`), or build from source using a riscv64 cross-toolchain via the generic `CROSS_COMPILE` mechanism (Section 5), most practically through Yocto's `meta-swupdate` layer or Buildroot's `package/swupdate`. There is no upstream-published riscv64 binary and no PyPI/npm/Maven/OCI channel applicable to this project.

## 9. Dependencies

SWUpdate has no `CMakeLists.txt`/`setup.py`/`go.mod`; its dependency list comes from `Kconfig` (`HAVE_*` options) and `Makefile.deps`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| OpenSSL | Default TLS backend + signature/hash verification | Data not available: project-graph query failed (CONNECTION_CLOSED) | Data not available: project-graph query failed | Data not available: project-graph query failed | Active RISC-V crypto-extension (Zknd/Zkne/Zbb) asm paths exist. Open GitHub issues include [#28118](https://github.com/openssl/openssl/issues/28118) (riscv extension detection broken on musl), [#30880](https://github.com/openssl/openssl/issues/30880) (flaky `test_lhash` on linux-riscv64 CI), [#29453](https://github.com/openssl/openssl/issues/29453) (intrinsics vs inline asm for RISC-V), [#25334](https://github.com/openssl/openssl/issues/25334) (Zknd/Zkne extension-pairing bug for AES); closed: [#32229](https://github.com/openssl/openssl/issues/32229), [#29357](https://github.com/openssl/openssl/issues/29357). Issues are optimization/CI-flakiness, not fundamental breakage. |
| wolfSSL | Alternative embedded-footprint TLS/crypto backend | Data not available (project-graph down) | Data not available | Data not available | Has dedicated RISC-V asm acceleration. 9 riscv-related issues, all closed: alignment bugs ([#10525](https://github.com/wolfSSL/wolfssl/issues/10525)), extension-selection inaccuracy ([#10526](https://github.com/wolfSSL/wolfssl/issues/10526)), SHA3 asm debug-build failure ([#10515](https://github.com/wolfSSL/wolfssl/issues/10515)), unaligned-load fault ([#10043](https://github.com/wolfSSL/wolfssl/issues/10043)), riscv QEMU test thread ([#7943](https://github.com/wolfSSL/wolfssl/issues/7943)). Bugs found via active RISC-V testing and already fixed. |
| Mbed TLS | Alternative lightweight TLS/crypto backend | Data not available | Data not available | Data not available | Only 1 riscv-adjacent GitHub issue, closed, and it is riscv32 not riscv64 ([#3066](https://github.com/Mbed-TLS/mbedtls/issues/3066)). No riscv64-specific issues surfaced -- likely untested rather than confirmed clean. |
| GPGME | Optional PGP-based signature verification | Data not available | Data not available | Data not available | 0 riscv-related results on GitHub (canonical tracker is dev.gnupg.org, under-covered by GitHub search). |
| p11-kit | PKCS#11 module loading (HSM/TPM-backed signing keys) | Data not available | Data not available | Data not available | 1 unrelated hit (closed IRIX build issue); pure portable C, no riscv concerns found. |
| zlib | DEFLATE compression of update images | Data not available | Data not available | Data not available | 0 riscv64 GitHub hits (only s390x/ARM64/Windows issues found). |
| xz / liblzma | LZMA compression of update images | Data not available | Data not available | Data not available | 2 hits, both closed: [#146](https://github.com/tukaani-project/xz/issues/146) (enable `TUKLIB_FAST_UNALIGNED_ACCESS` for RISC-V, resolved). |
| zstd | Zstandard compression of update images | Data not available | Data not available | Data not available | Open, non-blocking perf requests: [#4471](https://github.com/facebook/zstd/issues/4471) (add RVV support for XXH3), [#4546](https://github.com/facebook/zstd/issues/4546) (add RISC-V unaligned access); closed: [#4069](https://github.com/facebook/zstd/issues/4069), [#3134](https://github.com/facebook/zstd/issues/3134) (contrib build fail on riscv64 hw, closed). Builds/runs on riscv64 today. |
| LZ4 | LZ4 compression of update images | Data not available | Data not available | Data not available | 1 hit, closed: [#1635](https://github.com/lz4/lz4/issues/1635) ("[Proposal] RISC-V Architecture Optimizations"). No open blocker. |
| libarchive | Extracts cpio/tar `.swu` bundle content | Data not available | Data not available | Data not available | 0 riscv64-specific GitHub hits (top hits: ppc64le, ARMv8 aarch64 CRC32 accel, Interix, x86_64). No riscv64 acceleration path and no reported breakage. |
| zchunk (zck) | Chunked/delta-friendly compression for partial downloads | Data not available | Data not available | Data not available | 0 results; small, low-activity project, no riscv64 signal either way. |
| librsync | Binary delta/rdiff patching for bandwidth-efficient delta updates | Data not available | Data not available | Data not available | 0 results; pure portable C (MD4 + rolling checksum). |
| Lua (lua5.2) | Embedded scripting for custom pre/post-install handlers | Data not available | Data not available | Data not available | Confirmed the reference tree-walking interpreter, not LuaJIT (Kconfig default `LUAPKG=lua5.2`) -- no JIT backend risk. |

**Methodology caveat:** the `project-graph` MCP server failed to connect for the entire research session (`CONNECTION_CLOSED`), including a retry -- this is a tooling failure, not evidence of absence, and the riscv64 build/test/release columns above should be re-populated once that server is reachable.

**Deep-dive, dependencies with crypto/compression/numerics relevance:** OpenSSL, wolfSSL, and zstd each have active, in-progress RISC-V-specific optimization work (RVV vectorization requests, Zk-extension crypto acceleration) tracked in their own upstream issue trackers, none of which are currently release-blocking for those projects. Mbed TLS shows no riscv64-specific signal at all in either direction. None of these dependency-level findings constitute a functional blocker for SWUpdate's own riscv64 support, since SWUpdate treats them as opaque, feature-selectable backends.

**Other build dependencies noted but out of scope for the table above:** `libcurl` (network transport), `libwebsockets` (websocket progress/suricatta interface), `uriparser` (URI parsing), and Linux-storage libraries `libblkid`/`libfdisk`/`libext2fs`/`libbtrfs`/`libmtd`/`libubi`/`libubootenv` (partition/filesystem management -- core to SWUpdate's purpose). Worth flagging: `util-linux` (source of libblkid/libfdisk) has an **open** riscv64-related GitHub issue, [#1526](https://github.com/util-linux/util-linux/issues/1526) ("Trying to compile util-linux for RISC-V architecture"), and a closed riscv64-specific test failure, [#2402](https://github.com/util-linux/util-linux/issues/2402).

SWUpdate has no dependent package ecosystem (no plugin/extension marketplace, no PyPI/npm/Maven consumers) -- Section 10 is omitted per the report template's scope rule.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| -- | -- | -- | -- | No riscv64-related issues, PRs, or commits exist in `sbabic/swupdate`. Confirmed via `search_issues`, `search_pull_requests`, `search_commits`, `search_code` (queries: "riscv", "riscv64", "RISC-V", "risc", each independently re-verified twice), and a direct file-content grep of the full repository at commit `ca6a85de51166d9774429d3bb2f7cd17e39540c5`. |

**Correctness bugs:** none found (zero population, not under-searched -- verified with control queries for "arm" and "SWUpdate" returning 28 and 3 matches respectively, confirming search functionality itself is working against this repo).

**Performance benchmarks:** none found. No RISE blog post, GitHub artifact, or indexed web content contains SWUpdate-specific riscv64-vs-arm64 (or any) performance data. A tangential 2021 IEEE/ResearchGate paper, "An open-source SWUpdate and Hawkbit framework for OTA Updates of RISC-V based resource constrained devices," exists but is unaffiliated with RISE, predates RISE's current form, and is a feasibility/implementation paper rather than a performance benchmark [NEEDS VERIFICATION -- full text not retrievable via search alone].

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer statement, issue, or roadmap entry (`doc/source/improvement_proposals.rst`) expresses any objection to, or discussion of, riscv64 support.

**Technical blockers:** none identified. SWUpdate's architecture-agnostic design (Section 4) means there is no technical work required for riscv64 support at the SWUpdate level -- it already builds and runs there, as demonstrated by Ubuntu's unpatched packaging (Section 8).

**Organizational blockers:** the project's single-maintainer, mailing-list-based contribution model (GitHub PRs are explicitly ignored) means any future riscv64-specific work (e.g., adding riscv64 to CI) would need to go through the Patchwork/mailing-list process, not a GitHub PR -- a structural friction point for external contributors unfamiliar with that workflow, though not a blocker specific to RISC-V.

**Acceptance probability:** high, if anyone submitted it. Since there is no technical objection and no architecture-gating precedent anywhere in the codebase, a patch adding a riscv64 CI job (e.g., cross-compile-only via `ci/test-configs.sh` on a riscv64 runner, or QEMU) would face no known structural resistance -- but no such patch has ever been proposed, and none is expected to appear without explicit organizational sponsorship, given the sponsor-funded feature model described in Section 1.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro (Ubuntu)
- **Justification:** No upstream riscv64 CI exists -- every CI file (`.github/workflows/ci_tests.yml`, `contributing.yml`, `reuse.yml`, `.gitlab-ci.yml`) runs exclusively on x86_64 containers, confirmed by direct file inspection at commit `ca6a85de51166d9774429d3bb2f7cd17e39540c5`. Applying the distribution floor: Ubuntu 26.04 "resolute" ships riscv64 binaries (`swupdate`, `libswupdate0.1`, `libswupdate-dev`, `lua-swupdate`) built from unmodified upstream source with no riscv64-specific patches, verified via a direct HTTP 200 on [`swupdate_2025.12+dfsg-4ubuntu1_riscv64.deb`](http://ports.ubuntu.com/ubuntu-ports/pool/universe/s/swupdate/swupdate_2025.12+dfsg-4ubuntu1_riscv64.deb) at ports.ubuntu.com. A clean (unpatched) distro build with no upstream CI upgrades the project from "no CI" to yellow per the color model's distribution floor.
- **Optimization gap:** N/A -- SWUpdate is not an optimization-purpose project (it is an OTA update orchestration agent, not a compute/SIMD/crypto-acceleration library); the Step 2 modifier does not apply and does not cap the color.
- **Pending work that could change the grade:** none identified. SWUpdate is not a RISE member or sponsored project; no RISE blog post, wheel-builder entry, or funded RP-numbered project references SWUpdate (confirmed against the full RISE blog post inventory, all 33 posts through 2026-08-24, and all 25 `riseproject-dev` GitHub org repos). No open PR or issue proposes riscv64 CI. Advancing to blue would require upstream CI that builds and runs the test suite on riscv64 (even without an upstream-published binary); advancing to green would additionally require upstream itself to publish a riscv64 release artifact, which the project currently does not do for any architecture (releases are source-only).

## 14. Investment Analysis

RISE has done no work on SWUpdate: it is not a RISE member project, has no RISE blog coverage, no wheel-builder entry (not applicable -- not a Python package), and no funded RP-numbered project. All investment items below are therefore fully unaddressed and not already covered by RISE.

### 14.1 Functional Enablement

No functional enablement work is required. SWUpdate already builds and runs on riscv64 via Ubuntu's unpatched packaging (Section 8), and its architecture-agnostic design (Section 4) means no source-level porting is needed. The only outstanding functional item is verifying the full `configs/*_defconfig` build matrix (22 configs) against a riscv64 cross-toolchain to confirm no configuration-specific build failure exists that Ubuntu's default configuration happens not to exercise.

### 14.2 Performance Optimization

Not a priority for this project's own code, which has no performance-critical architecture-specific paths of its own (Section 4). The one identified gap -- the vendored Mongoose uECC crypto backend falling back to scalar C on riscv64 versus hand-tuned asm on amd64/arm64 -- affects only the built-in web UI's own TLS handshake performance, not SWUpdate's primary signature-verification path. Any meaningful performance work belongs upstream in the individual crypto/compression dependencies (OpenSSL, wolfSSL, zstd), which already have active RVV/Zk-extension optimization efforts in progress independent of SWUpdate (Section 9).

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `.github/workflows/ci_tests.yml` or `.gitlab-ci.yml` (cross-compile build, or QEMU-based build+test) is the single highest-leverage investment: it would upgrade the color from yellow (clean-distro-build) toward blue (upstream CI builds and tests) without requiring any source change, since the code is already architecture-agnostic. This must go through the project's mailing-list/Patchwork contribution process (GitHub PRs are ignored), not a direct GitHub PR.

### 14.4 Ecosystem Enablement

Not applicable -- SWUpdate has no dependent package ecosystem (Section 10 omitted).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify all 22 `configs/*_defconfig` build cleanly with a riscv64 cross-toolchain (beyond Ubuntu's default config) | 1 | External contributor / distro maintainer | Low |
| CI/CD | Add a riscv64 cross-compile build job to `.github/workflows/ci_tests.yml` and/or `.gitlab-ci.yml`, submitted via the mailing-list/Patchwork process | 1-2 | External contributor (mailing-list submission required) | Medium |
| CI/CD | Extend the riscv64 CI job to run the existing test suite (not just build), closing the gap to blue | 1-2 | External contributor | Medium |
| Performance | Track upstream OpenSSL/wolfSSL/zstd RISC-V optimization issues (Section 9); no direct SWUpdate work needed | 0 (monitoring only) | N/A | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [sbabic/swupdate GitHub repository](https://github.com/sbabic/swupdate)
- [SWUpdate homepage](https://sbabic.github.io/swupdate/)
- [.github/workflows/ci_tests.yml](https://github.com/sbabic/swupdate/blob/master/.github/workflows/ci_tests.yml)
- [.github/workflows/contributing.yml](https://github.com/sbabic/swupdate/blob/master/.github/workflows/contributing.yml)
- [.github/workflows/reuse.yml](https://github.com/sbabic/swupdate/blob/master/.github/workflows/reuse.yml)
- [.gitlab-ci.yml](https://github.com/sbabic/swupdate/blob/master/.gitlab-ci.yml)
- [SWUpdate improvement proposals roadmap](https://github.com/sbabic/swupdate/blob/master/doc/source/improvement_proposals.rst)
- [SWUpdate Patchwork project](https://patchwork.ozlabs.org/project/swupdate)
- [GitHub Releases: sbabic/swupdate 2026.05.1 assets](https://github.com/sbabic/swupdate/releases/expanded_assets/2026.05.1)
- [GitHub Releases: sbabic/swupdate 2025.12 assets](https://github.com/sbabic/swupdate/releases/expanded_assets/2025.12)
- [PyPI swupdate (404, package does not exist)](https://pypi.org/pypi/swupdate/json)
- [RISE PyPI wheel builder mirror for swupdate (redirects to 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/swupdate/)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=swupdate)
- [Ubuntu 26.04 (resolute) package search for SWUpdate](https://packages.ubuntu.com/search?keywords=SWUpdate&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute riscv64 swupdate package page](https://packages.ubuntu.com/resolute/riscv64/swupdate)
- [swupdate_2025.12+dfsg-4ubuntu1_riscv64.deb (ports.ubuntu.com, verified HTTP 200)](http://ports.ubuntu.com/ubuntu-ports/pool/universe/s/swupdate/swupdate_2025.12+dfsg-4ubuntu1_riscv64.deb)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [OpenSSL issue #28118: riscv extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #30880: flaky test_lhash on linux-riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL issue #29453: use intrinsic instead of inline asm for RISC-V](https://github.com/openssl/openssl/issues/29453)
- [OpenSSL issue #25334: Zknd/Zkne extension-pairing bug for AES](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #32229 (closed): CI fails on RISC-V runner](https://github.com/openssl/openssl/issues/32229)
- [OpenSSL issue #29357 (closed): riscv64 cross-compile failure w/ no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [wolfSSL issue #10525: alignment bugs in RISC-V asm routines](https://github.com/wolfSSL/wolfssl/issues/10525)
- [wolfSSL issue #10526: extension-selection inaccuracy](https://github.com/wolfSSL/wolfssl/issues/10526)
- [wolfSSL issue #10515: SHA3 asm debug-build failure](https://github.com/wolfSSL/wolfssl/issues/10515)
- [wolfSSL issue #10043: unaligned-load fault](https://github.com/wolfSSL/wolfssl/issues/10043)
- [wolfSSL issue #7943: Riscv Qemu test thread](https://github.com/wolfSSL/wolfssl/issues/7943)
- [Mbed-TLS issue #3066: hardening-flag crash (riscv32)](https://github.com/Mbed-TLS/mbedtls/issues/3066)
- [tukaani-project/xz issue #146: enable TUKLIB_FAST_UNALIGNED_ACCESS for RISC-V](https://github.com/tukaani-project/xz/issues/146)
- [facebook/zstd issue #4471: add RVV support for XXH3](https://github.com/facebook/zstd/issues/4471)
- [facebook/zstd issue #4546: add RISC-V unaligned access](https://github.com/facebook/zstd/issues/4546)
- [facebook/zstd issue #4069 (closed): weak-symbol support](https://github.com/facebook/zstd/issues/4069)
- [facebook/zstd issue #3134 (closed): contrib build fail on riscv64 hw](https://github.com/facebook/zstd/issues/3134)
- [lz4/lz4 issue #1635 (closed): RISC-V Architecture Optimizations proposal](https://github.com/lz4/lz4/issues/1635)
- [util-linux issue #1526 (open): compiling util-linux for RISC-V architecture](https://github.com/util-linux/util-linux/issues/1526)
- [util-linux issue #2402 (closed): riscv64-specific test failure](https://github.com/util-linux/util-linux/issues/2402)
