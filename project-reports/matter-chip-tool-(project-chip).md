---
title: Matter / chip-tool (Project CHIP)
parent: Project Reports
color: orange
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: JsonCpp
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="matter-chip-tool-(project-chip)" %}

# Matter / chip-tool (Project CHIP)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Matter / chip-tool (Project CHIP)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Matter (formerly Connected Home over IP / "CHIP") is the smart-home interoperability standard stewarded by the Connectivity Standards Alliance (CSA, formerly the Zigbee Alliance). The upstream repository `project-chip/connectedhomeip` contains the reference SDK plus `chip-tool`, a host-side Linux/macOS command-line controller used to commission and interact with Matter devices. `chip-tool` is a standalone CLI/controller (GN/Ninja build), not a performance-optimization library, JIT, or numerics engine, so the Step 2 optimization modifier in Section 13 does not apply to it.

**License:** Apache 2.0.

**Governance:** Two-tiered per `CONTRIBUTING.md`: (1) Open Source Contributor - anyone, requires CoC + license agreement + Matter Working Group CLA; explicitly permitted to submit hardware/platform ports and bug fixes without touching the Matter specification; (2) CSA Matter Working Group Member - required only for changes to the spec itself. Platform ownership is decentralized through a 74-line `CODEOWNERS` file, with each silicon vendor (Espressif, Silicon Labs, NXP, Nordic, Google, Apple, ASR, Realtek/Ameba, Bouffalo Lab, Telink, STM32, Qorvo, Infineon, Tizen, NuttX, webOS) owning its own platform directory. No formal repo-wide GOVERNANCE.md or MAINTAINERS file exists.

**Corporate sponsors (by commit volume, all-time / last 12 months):** Apple (largest single contributor, 2,399+1,160+625+392+249 commits across named committers), Google (789/585/399/381/272), Silicon Labs (399+, active recently), Samsung (371 all-time / 64 recent), Nordic Semiconductor (386), Espressif (249 / 45 recent), NXP (platform-owner team), CSA-IOT staff (59 recent), Grid Dynamics contractor (42 recent). `dependabot[bot]` accounts for 658 all-time / 276 recent automated commits.

**Community stance on new ports:** Explicitly welcoming. `CONTRIBUTING.md` names "hardware ports" as a standard example of Open Source Contributor work that does not require CSA Working Group membership or spec approval - only the standard CLA - and platform-owner PRs get fast-track review (1-day wait, 1 approval, dropped after 3 days of staleness). This matches the observed organic, vendor-driven pattern of RISC-V support arriving one embedded SoC vendor at a time (Bouffalo Lab 2022, Telink 2024-2025) with no centralized RISC-V initiative.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-04-04 | First RISC-V-related commit: `366613816f628568a786357e44a05d6964057c38` "BL602 pull request (#16370)" - adds `build/config/riscv.gni` and the bare-metal `riscv_gcc` toolchain to support Bouffalo Lab's BL602 RISC-V Wi-Fi/BLE SoC as an embedded example-app platform | [commit 3666138](https://github.com/project-chip/connectedhomeip/commit/366613816f628568a786357e44a05d6964057c38) |
| 2024-08-20 | PR #34945 - Telink TLSR9528A flash-layout overlay for RISC-V-cored B92 eval board | [PR #34945](https://github.com/project-chip/connectedhomeip/pull/34945) |
| 2024-08-20 | PR #34958 - Telink B9x/W91 auto NVS sector-count calculation | [PR #34958](https://github.com/project-chip/connectedhomeip/pull/34958) |
| 2024-08-27 | PR #35118 - Telink OTA state-change event | [PR #35118](https://github.com/project-chip/connectedhomeip/pull/35118) |
| 2024-10-21 | PR #36143 - Telink Alexa auto-connect BLE stack-size fix | [PR #36143](https://github.com/project-chip/connectedhomeip/pull/36143) |
| 2025-08-07 | PR #40455 - Android NDK 28c upgrade; only PR in the repo containing the literal string `riscv64`, incidental to an ABI-path listing for `libc++_shared.so` (no riscv64 Android build actually enabled) | [PR #40455](https://github.com/project-chip/connectedhomeip/pull/40455) |
| 2026-09-02 | PR #73822 - Telink Zephyr SDK repo rename (`telink-semi/zephyr` -> `tl_zephyr`), removes stale `boards/riscv` doc links | [PR #73822](https://github.com/project-chip/connectedhomeip/commit/e3f3c18889d4004083edf8124ff7c5a4e115d630) |

**Key contributors:** jczhang777 (Bouffalo Lab, first RISC-V commit), Haiwen Xia / s07641069 (Telink Semiconductor, all five Telink RISC-V PRs above), reviewed by andy31415, arkq, jmartinez-silabs, bzbarsky-apple, axelnxp, kiel-apple, interfer.

**Is it fully upstream?** All six listed items are merged into `main` and shipped in tagged releases (the first four Telink PRs shipped in v1.4.0.0, 2024-12-10; PR #73822 has not yet appeared in a tagged release as of v1.6.0.0, 2026-08-19). However, none of this is a chip-tool/host riscv64 port. Every genuine "riscv" hit in the repository is embedded-firmware build/toolchain plumbing for Telink (Zephyr, TLSR9518/B91/B92/W91), Bouffalo Lab (BL602/BL702/BL702L), and ASR595x - RISC-V-cored IoT peripheral silicon running FreeRTOS/Zephyr on a completely separate `target_os`/`target_cpu` build path from chip-tool's Linux host build. No tracking issue, no PR, and no `target_cpu="riscv64"` GN configuration for a chip-tool/Linux-controller riscv64 port exists anywhere in the repository.

## 3. Upstream Support Tier

No formal Tier 1/2/3 support classification exists in the repository (confirmed: no `PLATFORMS.md`, `SUPPORT.md`, or tier policy document found; platform docs live flatly under `docs/platforms/{android,asr,bouffalolab,esp32,infineon,linux,nrf,nxp,openthread,silabs,stm32,ti}`). Support is a flat, decentralized, per-platform-vendor model governed by `CODEOWNERS`.

`scripts/build/builders/host.py`, the builder that actually produces the `chip-tool` binary, enumerates only `arm`, `arm64`, native `x64`, and `x86` - there is no riscv64 branch of any kind.

| Architecture | Host build support (`host.py`) | GN `target_cpu` toolchain | Upstream CI | Official binary/release |
|---|---|---|---|---|
| amd64 (x64/x86) | Yes, native | Yes (`linux_x64_gcc`/`clang`, `linux_x86_gcc`/`clang`) | Yes (`ubuntu-latest` runners across `build.yaml`, `examples-linux-standalone.yaml`) | Built from source per release; no prebuilt binary shipped, standard for this project |
| arm64 | Yes (`target_cpu="arm64"`, SYSROOT_AARCH64 cross toolchain) | Yes (`linux_arm64_gcc`/`clang`) | Yes (`examples-linux-arm.yaml`) | Built from source; same model as amd64 |
| arm (32-bit) | Yes (SYSROOT_ARMHF) | Yes (`linux_arm_gcc`/`clang`) | Yes | Built from source |
| riscv64 | **Absent** - no branch in `host.py` | **Absent** - no `linux_riscv64_gcc`/`clang` toolchain target in `build/toolchain/linux/BUILD.gn`; `gn gen` with `target_cpu="riscv64" target_os="linux"` fails at generation time with an unresolved-toolchain error | **Absent** - zero riscv/riscv64 references in any of the 69 `.github/workflows/*.yaml` files | None |

Evidence: [`build/toolchain/linux/BUILD.gn`](https://github.com/project-chip/connectedhomeip) (traced locally, no `linux_riscv64_*` target defined); [`.github/workflows/`](https://github.com/project-chip/connectedhomeip/tree/master/.github/workflows) (69 files, literal repo-scoped `search_code` for `riscv64 path:.github` returns 0 results).

## 4. Technical Architecture and RISC-V-Specific Subsystems

`chip-tool` itself has zero architecture-specific code of any kind (no JIT, no SIMD, no hand-tuned crypto). Its default Linux crypto backend is system OpenSSL (`chip_crypto=="openssl"`, resolved via `pkg_config("openssl")` in `src/crypto/crypto.gni`); mbedTLS is the default only for android/freertos/zephyr/webos/cmsis-rtos targets, and BoringSSL only for `darwin` or explicit `chip_crypto=="boringssl"`. No `#ifdef __riscv` or `#if defined(__riscv)` guard exists anywhere in the repository (`search_code` for `__riscv repo:project-chip/connectedhomeip` returns 0 results).

`vfloat32m1_t` (RVV intrinsic type): 0 matches repo-wide. `rvv`: 9 matches, all false positives (base64 PEM substrings, a variable name `icacOrVvscBuf`). No RISC-V Vector extension code exists anywhere in the codebase.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| chip-tool controller logic | Generic C++, no arch-specific code | Generic C++, no arch-specific code | Generic C++, no arch-specific code (but no host build path exists at all) |
| Crypto backend (Linux default) | System OpenSSL | System OpenSSL | System OpenSSL is riscv64-capable upstream (see Section 9), but moot - chip-tool has no riscv64 build path to link against it |
| Bouffalo Lab BL602/BL702/BL702L embedded target | N/A | N/A | `-DCONFIG_ARCH_RISCV` compile flag, bare-metal `riscv64-unknown-elf-` toolchain, `OUTPUT_ARCH("riscv")` linker scripts - embedded firmware only, not chip-tool |
| ASR595x embedded target | N/A | N/A | `target_cpu="riscv"`, `ASR_ARCH="riscv"` - embedded firmware only, not chip-tool |
| Telink TLSR9518/B91/B92/W91 embedded target | N/A | N/A | Zephyr SDK `riscv64-zephyr-elf` toolchain (SDK v0.17.0 pinned) - embedded firmware only, not chip-tool |
| Android JNI controller lib ABI mapping | `x64`/`x86` mapped | `arm64-v8a` mapped | `riscv64` string appears once, dormant, in `build/config/android_abi.gni`/`build/chip/java/BUILD.gn`; never invoked by any CI workflow (verified: `examples-android.yaml`/`full-android.yaml` build only `arm`/`arm64`/`x64`/`x86`) |

Source: [architecture verification summary](https://github.com/project-chip/connectedhomeip) (local clone at commit `c18068ff2e73e53658b2242d5f2b9f606b652aef`, `scripts/build/builders/host.py`, `build/config/BUILDCONFIG.gn`, `build/config/android_abi.gni`).

## 5. Build System, Cross-Compilation, and Toolchain

`chip-tool` builds with GN + Ninja, not CMake (`docs/guides/BUILDING.md`, `examples/chip-tool/README.md`; `src/CMakeLists.txt` exists but is empty/unused). Standard build:

```shell
source scripts/activate.sh
gn gen out/host
ninja -C out/host
```
or
```shell
scripts/examples/gn_build_example.sh examples/chip-tool SOME-PATH/
```

GN toolchain resolution for `target_os=="linux"` (`build/config/BUILDCONFIG.gn:73-79`) dispatches to `build/toolchain/linux:linux_${target_cpu}_${_target_compiler}`. The only toolchains actually defined in `build/toolchain/linux/BUILD.gn` are `linux_x64_gcc/clang`, `linux_x86_gcc/clang`, `linux_arm_gcc/clang` (`arm-linux-gnueabihf-`), and `linux_arm64_gcc/clang` (`aarch64-linux-gnu-`). **No `linux_riscv64_gcc`/`clang` target exists.** Passing `target_cpu="riscv64" target_os="linux"` to `gn gen` fails at generation time with an unresolved-toolchain error - this is unimplemented, not merely undocumented.

The repository's only riscv toolchain support (`build/toolchain/riscv_gcc/riscv_toolchain.gni`) is special-cased for `target_cpu == "riscv"` (note: not `"riscv64"`) with `target_os == "freertos"`, hardcoding a bare-metal `riscv64-unknown-elf-` compiler prefix (freestanding/newlib, not a Linux glibc target). It is consumed only by ASR595x, Bouffalo Lab, and Telink embedded example apps - never by chip-tool.

**QEMU:** The only QEMU Docker image (`chip-build-linux-qemu`) is x86_64-only - builds a `linux-6.7.3` kernel via `make x86_64_defconfig`, downloads an `ubuntu-24.04-minimal-cloudimg-amd64.img`, runs `qemu-system-x86_64`. No `qemu-system-riscv64` usage, no riscv64 kernel config, no riscv64 rootfs exists anywhere in the repository.

**Known build failures:** N/A in the conventional sense - there is no partially-working riscv64 build to fail; the toolchain resolution step itself has no riscv64 target to select.

Full trace: [BUILDCONFIG.gn / toolchain analysis](https://github.com/project-chip/connectedhomeip) (files examined listed in Section 16).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `chip-tool` builds from source | Yes | Yes | No - GN toolchain resolution fails |
| `chip-tool` runs in CI | Yes (`ubuntu-latest`) | Yes (`examples-linux-arm.yaml`) | No |
| Prebuilt binary/package | None (source-build model for all arches) | None | None |
| Commission/control Matter devices | Yes | Yes | Not possible - no working binary exists |
| Interactive mode (websocket-server, editline) | Yes | Yes | N/A - build never reaches this stage |

**Functional gap:** Complete - there is no working riscv64 build of chip-tool at any level (source build fails at GN generation). This is not a performance or feature-parity gap; it is total absence of the capability.

**Performance gaps:** Not applicable - no binary exists to benchmark. No SIMD/vector code is missing from chip-tool because chip-tool contains no SIMD/vector code on any architecture (Section 4).

**Security hardening gaps:** Not applicable to chip-tool riscv64 directly (no build exists), but see Section 9: the default Linux crypto backend (OpenSSL) that chip-tool would link against carries an open, unresolved security gap on riscv64 hardware lacking Zkn/Zvkned extensions (non-constant-time AES fallback), relevant context should a port ever be attempted.

**NaN/floating-point semantics issues:** None found or applicable - no floating-point-sensitive code path specific to chip-tool was identified in any research pass.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified directly, not by fuzzy search: `mcp__github__search_code` for `riscv64 repo:project-chip/connectedhomeip path:.github` returns 0 results; `riscv repo:project-chip/connectedhomeip path:.github/workflows` returns 0 results. All 69 files in `.github/workflows/` were read (case-insensitive search for riscv/riscv64/RISCV) with zero matches, including the chip-tool build job in `build.yaml` (runs exclusively on `ubuntu-latest`, x86_64, no riscv64 runner, no QEMU riscv64 step, no `linux/riscv64` platform target anywhere in the build matrix). The only riscv occurrence in the entire `.github/` tree is `.github/.wordlist.txt:1332: riscv`, a spellcheck dictionary entry, not CI configuration. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository.

No RISE runner references (`riseproject-dev` or RISE runner labels) found in any workflow file.

| Architecture | CI build | CI test execution | CI release-blocking | Hardware |
|---|---|---|---|---|
| amd64 | Yes (`ubuntu-latest`) | Yes | Yes | GitHub-hosted x86_64 VM |
| arm64 | Yes (`examples-linux-arm.yaml`) | Yes | Yes | GitHub-hosted / cross-compile |
| riscv64 | No | No | N/A | N/A |

Source: [`.github/workflows/build.yaml`](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/build.yaml), [`.github/workflows/examples-linux-arm.yaml`](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/examples-linux-arm.yaml), [`.github/workflows/examples-bouffalolab.yaml`](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/examples-bouffalolab.yaml) (Bouffalolab boards are RISC-V silicon but the workflow YAML itself never mentions riscv - the toolchain is invoked indirectly via board-name build targets).

## 8. Distribution and Release Status

No riscv64 binary or package exists for chip-tool through any channel checked:

- **GitHub Releases:** Recent tags visible (v1.6.0.0 through v1.2.0.0) show "Assets 2" per release - the standard auto-generated `Source code (zip)`/`Source code (tar.gz)` pair, consistent with connectedhomeip's build-from-source distribution model. No riscv64 (or any-architecture) prebuilt binary asset was found in any release. Full byte-for-byte asset enumeration was not possible in this session (GitHub API scoped to a different repo; WebFetch DOM rendering did not expose the asset list), so this channel is "no evidence found" rather than an exhaustively confirmed negative for asset naming, though it is consistent with the documented source-build model. [GitHub Releases](https://github.com/project-chip/connectedhomeip/releases)
- **PyPI:** `https://pypi.org/pypi/chip-tool/json` returns HTTP 404 - chip-tool is a C++ CLI, never published to PyPI. No package under any tried variant name exists.
- **Ubuntu archive (26.04 "resolute" and all other suites):** Search for `chip-tool` across all suites/sections/architectures returns "Sorry, your search gave no results." The package does not exist in the Ubuntu archive at all, for any architecture, not just riscv64.
- **Project graph (Ubuntu riscv64 SPARQL query):** Empty binding set for all tried package-name variants; a permissive substring query surfaced only `libksysguardformatter2` (false positive - matches "matter" only via "formatter2" substring, unrelated project).
- **Arch Linux RISC-V (archriscv.felixc.at):** No package named `chip-tool` or `matter` listed with any version.
- **RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/chip-tool/` redirects to the (non-existent) PyPI page - no independent RISE-built artifact.

**What a user must do to get a working binary today:** There is no path. Building from source requires selecting a GN toolchain, and no riscv64 Linux toolchain target is defined in the build system (Section 5) - `gn gen` itself fails before compilation can begin.

## 9. Dependencies

`chip-tool` uses GN/Ninja, not CMake/setup.py/go.mod/Cargo.toml/package.json. Dependency manifest traced via `examples/chip-tool/BUILD.gn`, `src/crypto/BUILD.gn`/`crypto.gni`, `examples/common/websocket-server/BUILD.gn`, and `.gitmodules`.

| Dependency | Role in chip-tool | Ubuntu 26.04 riscv64 | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|---|
| OpenSSL (`openssl/openssl`) | Default Linux crypto backend (`chip_crypto=="openssl"`) - TLS/PASE/CASE, SPAKE2+, certs | Found (`libssl-dev`) | Green - active riscv64 port since 2022 (Zba/Zbb/Zbc/Zbs, Zkn, full Zvk vector-crypto suite); dedicated `riscv-more-cross-compiles.yml` CI (13 configs) | Mostly green, QEMU-only, no native riscv64 runner; open reliability issue [#22166](https://github.com/openssl/openssl/issues/22166); musl ISA-detection broken [#28118](https://github.com/openssl/openssl/issues/28118) | Green - Debian sid, Ubuntu package riscv64 | Security-critical open gap: non-constant-time AES T-table fallback on hardware lacking Zkn/Zvkned (fix PRs [#31080](https://github.com/openssl/openssl/pull/31080)/[#31082](https://github.com/openssl/openssl/pull/31082) open); no native riscv64 CI runner; recent flaky test [#30880](https://github.com/openssl/openssl/issues/30880) (Apr 2026) |
| libwebsockets (`warmcat/libwebsockets`, pinned v4.4-stable) | Backs interactive-mode local WS server | Found (`libwebsockets-dev` + transitive deps) | No riscv64-specific issues found - portable C | No riscv64-specific issues found | Debian/Ubuntu ship it (connectedhomeip vendors and builds from git submodule, not system lib) | None identified |
| jsoncpp (`open-source-parsers/jsoncpp`) | JSON parsing for chip-tool output/config (vendored) | Found (`libjsoncpp-dev`) | No riscv64 issues - pure portable C++ | No riscv64 issues found | Debian/Ubuntu ship it | None identified |
| mbedTLS (`ARMmbed/mbedtls`, pinned mbedtls-2.28) | Not on chip-tool's default Linux path (used for embedded/RTOS targets that chip-tool commissions against) | Found (`libmbedtls-dev`) | No open riscv64 issues (1 historical, fixed Dec 2022: [#3066](https://github.com/Mbed-TLS/mbedtls/issues/3066)) | No data surfaced | Debian/Ubuntu ship it | None open |
| BoringSSL (`google/boringssl`) | Alternate backend, `darwin`-only or explicit opt-in - not on default Linux/riscv64 path | Only as Android fork (`android-libboringssl`), no standalone Debian/Ubuntu package | Compile-only: 0 riscv64 assembly files, scalar-C fallback for all crypto; CI is Android-NDK compile-only, QEMU staged but gated off (`checkout_riscv64: False`) | No test execution on riscv64 (both LUCI builders compile-only) | Source-only upstream; only Android fork packaged for riscv64 | No `crypto/cpu_riscv.cc`; effectively irrelevant to chip-tool since not the Linux default |
| editline (`troglobit/editline`, vendored) | Interactive-shell line editing | Approximate match only (Ubuntu's `libedit-dev` is a different, API-compatible NetBSD codebase; connectedhomeip compiles the vendored source directly) | No riscv64 issues found (0 results) - tiny portable C | No data (no CI/test infra visible) | N/A (built from vendored source) | None identified |
| Pigweed (`google/pigweed`) | Build-tooling only (`pw_tokenizer` linked only if `chip_pw_tokenizer_logging` enabled, non-default) | Not applicable - consumed as source submodule, not an Ubuntu package | No data (GitHub search scoping rejected `repo:google/pigweed` this session) | No data | N/A | Not on chip-tool's default runtime path |

**Summary:** All 6 packageable dependencies are available on Ubuntu 26.04 riscv64 - no dependency-side packaging blocker. This is entirely moot for chip-tool's own riscv64 availability, however, since the build system itself has no riscv64 target to link these dependencies into (Section 5). The one real risk item, independent of chip-tool, is OpenSSL's open non-constant-time-AES security gap on riscv64 hardware without Zkn/Zvkned - relevant background should a port ever be undertaken.

## 11. Known Bugs and Active Issues

No open or closed GitHub issue in `project-chip/connectedhomeip` addresses RISC-V-specific correctness, performance, or floating-point/NaN behavior. Confirmed via multiple independent query strategies: `riscv64 performance` (6 semantic matches, all false positives - unrelated ARM/aarch64 cross-compile issues), `riscv64 bug` (19 semantic matches, all false positives), `riscv nan floating` (0 results), literal `"riscv" repo:project-chip/connectedhomeip` (4 results, still all false positives). No benchmark data (numeric or otherwise) for chip-tool/Matter SDK on riscv64 was found on the web or in the RISE blog.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issue exists | N/A | N/A | This is a genuine gap (untested/unbenchmarked), not a search failure - confirmed by GitHub semantic search, literal phrase search, general web search, and the RISE blog all converging on zero relevant hits |

**Correctness bugs:** None found (none can exist for a target with no build path).

## 12. Objections and Upstream Blockers

**Stated objections:** None found - no maintainer or contributor has stated an objection to a riscv64 host port.

**Technical blockers:**
- No `linux_riscv64_gcc`/`clang` GN toolchain target defined; `build/toolchain/linux/BUILD.gn` would need a new toolchain block analogous to the existing `linux_arm64_*` entries.
- `scripts/build/builders/host.py` has no riscv64 branch and would need one added, analogous to its existing arm64 branch (SYSROOT_AARCH64-style cross-sysroot handling).
- No CI workflow (`build.yaml`, `examples-linux-standalone.yaml`, or a new dedicated workflow) currently references riscv64; a new CI lane would need to be added and would need a runner (self-hosted riscv64, RISE runner, or QEMU) since none of the existing infrastructure provides one.

**Organizational blockers:** None identified. `CONTRIBUTING.md` explicitly classifies "hardware ports" as standard Open Source Contributor work requiring only the CLA - no CSA Working Group approval needed for a riscv64 host port, since it does not touch the Matter specification. Fast-track review (1-day wait, 1 approval) applies to platform-owner-style changes.

**Acceptance probability:** High if a well-formed PR were submitted, based on the project's demonstrated pattern of accepting vendor-driven RISC-V embedded ports (Bouffalo Lab 2022, Telink 2024-2025) with standard review, and the explicit low-friction policy for hardware/platform ports. No evidence of resistance exists; the gap is purely that no one has proposed the work - zero tracking issues, zero PRs, zero community requests were found anywhere in the repository or its issue/PR history. [NEEDS VERIFICATION: acceptance probability is an inference from observed pattern and stated policy, not a maintainer statement specific to a riscv64 host port, since no such proposal has ever been made to test against.]

## 13. Readiness Assessment

- **Color:** orange (no upstream CI, no distribution)
- **Release provider:** none - no upstream release, no RISE artifact, no distro package (Ubuntu, Debian, Arch RISC-V all confirmed absent), no third-party artifact exists for chip-tool on riscv64
- **Optimization gap:** N/A - chip-tool is not an optimization-purpose project (Step 2 of the color model does not apply; it is a controller CLI, not a SIMD/JIT/allocator/compression/crypto-performance library)

**Justification:** Per the color model's Step 1 table, "no upstream CI" with "no release" maps to orange. This is confirmed directly: zero riscv/riscv64 references exist in any of the 69 `.github/workflows/*.yaml` files ([`build.yaml`](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/build.yaml) and peers), and the GN build system itself has no `linux_riscv64_*` toolchain target, so `gn gen target_cpu="riscv64" target_os="linux"` fails at generation time - this is unimplemented, not merely untested. The distribution floor (which could raise a no-upstream-CI project to yellow or orange based on distro packaging) does not apply here in the upgrading direction: no distro (Ubuntu 26.04/resolute, Debian, Arch Linux RISC-V) ships a `chip-tool` package for **any** architecture, let alone riscv64 (confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=chip-tool&suite=resolute) returning zero results and the project graph's empty SPARQL binding set), so the project remains at the base "no upstream CI, no release" orange rather than being pulled down to red (no confirmed breakage - just total absence) or up to yellow (no clean unpatched distro build exists to confirm).

**Pending work that could change the grade:** None identified. No open PR, no open issue, and no RISE involvement (not a RISE member project; zero RISE blog posts, zero `riseproject-dev` GitHub repos, zero RISE wheel-builder listing found across exhaustive search) exists that targets a chip-tool/host riscv64 port. The only lever available is a new community or vendor-driven contribution, consistent with how Bouffalo Lab (2022) and Telink (2024-2025) each introduced their own RISC-V embedded support with no centralized push.

## 14. Investment Analysis

RISE has not funded or otherwise touched this project in any way (Section 2, Section 13) - there is nothing already covered to exclude from sizing below.

### 14.1 Functional Enablement

Three concrete engineering steps are required to get `chip-tool` building on riscv64 at all:
1. Add a `linux_riscv64_gcc`/`linux_riscv64_clang` toolchain block to `build/toolchain/linux/BUILD.gn`, modeled on the existing `linux_arm64_*` entries.
2. Add a riscv64 branch to `scripts/build/builders/host.py` (cross-sysroot handling analogous to the existing `arm64`/`SYSROOT_AARCH64` branch).
3. Validate the full dependency chain links and runs under `target_cpu="riscv64"` - OpenSSL, libwebsockets, jsoncpp, mbedTLS, editline are all confirmed available/buildable on Ubuntu riscv64 (Section 9), so this is expected to be low-risk integration work rather than a dependency-blocked effort.

### 14.2 Performance Optimization

Not applicable - chip-tool contains no architecture-specific hot paths (Section 4). No optimization work is meaningful here beyond what upstream OpenSSL already provides for the crypto backend (tracked separately in `project-reports/openssl.md`, outside this project's scope).

### 14.3 CI/CD Infrastructure

A new CI lane is required: either a self-hosted riscv64 runner (e.g. a RISE-provided runner), a QEMU riscv64 cross-compile-and-test step added to `build.yaml` or a new dedicated workflow, or, at minimum, a compile-only cross-compilation check. No existing infrastructure (self-hosted runner, QEMU riscv64 image, or CI job template) exists in the repository to build on - this is new work end to end.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the reporting rule, since chip-tool has no dependent package ecosystem (it is a standalone controller CLI, not a library with downstream consumers on PyPI/npm/Maven/etc.).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `linux_riscv64_gcc`/`clang` GN toolchain block | 1-2 | Upstream contributor / vendor | Critical |
| Functional | Add riscv64 branch to `scripts/build/builders/host.py` | 1-2 | Upstream contributor / vendor | Critical |
| Functional | Validate full dependency build/link on riscv64 (OpenSSL, libwebsockets, jsoncpp, mbedTLS, editline) | 1-2 | Upstream contributor | High |
| CI/CD | Stand up riscv64 CI lane (self-hosted runner or QEMU) and wire into `build.yaml`/new workflow | 2-4 | Upstream contributor / RISE (if runner support sought) | High |
| Functional | Submit and shepherd upstream PR(s) through fast-track platform-port review | 1 (process overhead) | Upstream contributor | Medium |

Total estimated effort to reach a working, CI-verified riscv64 `chip-tool` build: approximately 5-9 person-weeks, contingent on no unforeseen build-system issues once a toolchain target exists.

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [project-chip/connectedhomeip repository](https://github.com/project-chip/connectedhomeip)
- [CSA Matter solution page](https://csa-iot.org/all-solutions/matter/)
- [CONTRIBUTING.md](https://github.com/project-chip/connectedhomeip/blob/master/CONTRIBUTING.md)
- [CODEOWNERS](https://github.com/project-chip/connectedhomeip/blob/master/CODEOWNERS)
- [First RISC-V commit 3666138 - BL602 pull request (#16370)](https://github.com/project-chip/connectedhomeip/commit/366613816f628568a786357e44a05d6964057c38)
- [PR #34945 - Telink tlsr9528a_4m_flash.overlay](https://github.com/project-chip/connectedhomeip/pull/34945)
- [PR #34958 - Telink B9x/W91 auto NVS sector-count calc](https://github.com/project-chip/connectedhomeip/pull/34958)
- [PR #35118 - Telink OTA state-change event](https://github.com/project-chip/connectedhomeip/pull/35118)
- [PR #36143 - Telink Alexa auto-connect fix](https://github.com/project-chip/connectedhomeip/pull/36143)
- [PR #40455 - Android NDK 28c upgrade (incidental riscv64 ABI path mention)](https://github.com/project-chip/connectedhomeip/pull/40455)
- [PR #73822 / commit e3f3c18 - Telink Zephyr SDK repo rename, removes stale boards/riscv doc links](https://github.com/project-chip/connectedhomeip/commit/e3f3c18889d4004083edf8124ff7c5a4e115d630)
- [Issue #73452 - chip-build TSAN glib arm64 blockers (false-positive riscv search hit, ruled out)](https://github.com/project-chip/connectedhomeip/issues/73452)
- [.github/workflows/build.yaml](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/build.yaml)
- [.github/workflows/examples-linux-arm.yaml](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/examples-linux-arm.yaml)
- [.github/workflows/examples-bouffalolab.yaml](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/examples-bouffalolab.yaml)
- [.github/workflows/examples-asr.yaml](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/examples-asr.yaml)
- [.github/workflows/full-android.yaml](https://github.com/project-chip/connectedhomeip/blob/master/.github/workflows/full-android.yaml)
- [.github/.wordlist.txt](https://github.com/project-chip/connectedhomeip/blob/master/.github/.wordlist.txt)
- [Ubuntu package search - chip-tool, suite resolute (zero results)](https://packages.ubuntu.com/search?keywords=chip-tool&suite=resolute)
- [PyPI JSON API - chip-tool (404)](https://pypi.org/pypi/chip-tool/json)
- [RISE Python wheel builder listing (chip-tool not present)](https://riseproject.gitlab.io/python/wheel_builder/)
- [Arch Linux RISC-V package search (archriscv.felixc.at)](https://archriscv.felixc.at/?q=chip-tool)
- [RISE Project homepage / members](https://riseproject.dev)
- [RISE Project blog feed](https://riseproject.dev/feed/)
- [OpenSSL issue #22166 - SSL tests hang at HARNESS_JOBS>=38](https://github.com/openssl/openssl/issues/22166)
- [OpenSSL issue #28118 - musl ISA-detection broken](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL PR #31080 - AES constant-time fix](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - AES constant-time fix](https://github.com/openssl/openssl/pull/31082)
- [OpenSSL issue #30880 - test_lhash flaky on linux-riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [Mbed-TLS issue #3066 - RISC-V gettimeofday/-ftrapv overflow (fixed)](https://github.com/Mbed-TLS/mbedtls/issues/3066)
