---
title: sysdig
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="sysdig" %}

# sysdig

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for sysdig<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

sysdig is a C/C++ system-level troubleshooting and observability tool that captures Linux syscalls and system events via a kernel driver or eBPF probe, exposing them through a CLI (`sysdig`) and a text-mode UI (`csysdig`). It is not a pure userspace tool: its value depends on an in-kernel capture component (kernel module or eBPF probe), currently sourced from the separate `falcosecurity/libs` project rather than maintained inside `draios/sysdig` itself.

**Governance.** `draios/sysdig` is not a foundation project. It is single-vendor, corporate open source governed by Sysdig Inc.: the README states "Open source sysdig is proudly supported by Sysdig Inc." CNCF governance applies only to Falco, a separate, later Sysdig-created project - not to this repository. License is Apache 2.0 with a mandatory DCO (`Signed-off-by`) sign-off; there is no CLA/foundation IP assignment. There is no MAINTAINERS/GOVERNANCE.md, no PLATFORMS.md or SUPPORT.md, and no documented platform-tiering policy. The only structural governance artifact is a flat, unweighted `.github/CODEOWNERS` list: `@fededp @gnosek @jasondellaluce @ldegio @leogr @loresuso @lucaguerra @mstemm @nathan-b @therealbobo`.

**Corporate maintainers.** The most active current committer is Roberto Scolaro (`therealbobo`, Sysdig, ~30 of the last 30 commits). Other CODEOWNERS with a listed company: `leogr` (Sysdig), `ldegio` (Sysdig), `fededp` (Cisco, Falco/CNCF Runtime Security), `jasondellaluce` (Replit, ex-Sysdig, ex-Datadog, CNCF Core Maintainer for Falco). Co-founders Loris Degioanni and Gianluca Borello are the all-time top committers (1288 and 629+175+65 commits respectively, by sysdig.com/draios.com email). External, non-maintainer contributions occur occasionally (e.g. a Shopify engineer landed a bugfix in 2026) but do not indicate a broader community-governance process.

**Community culture on new ports.** No written stance exists. The one historical new-architecture attempt (RISC-V/MIPS/etc. build fixes) received zero maintainer engagement over four years before being auto-closed by a stale bot - see Section 2.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-08-20 | Issue #1203 opened: sysdig 0.22 fails to build on arm64/mips/mipsel/mips64el/alpha/riscv because `driver/syscall_table.c` references undefined `__NR_*` syscall-number macros (e.g. `__NR_open`). Cross-referenced to Debian bug #905929. | [Issue #1203](https://github.com/draios/sysdig/issues/1203) |
| 2019-02-18 | PR #1318 opened by sforshee (Seth Forshee, Canonical Ltd.), wrapping ~30 syscall-table entries in `#ifdef __NR_x` guards. Author states explicitly the fix was "only actually tested for arm64," not RISC-V. | [PR #1318](https://github.com/draios/sysdig/pull/1318) |
| 2019-02-18 to 2023-02-22 | Zero maintainer review or comments on PR #1318 for four years. | [PR #1318](https://github.com/draios/sysdig/pull/1318) |
| 2023-02-22 | `github-actions` stale-bot posts a stale-PR warning. | [PR #1318](https://github.com/draios/sysdig/pull/1318) |
| 2023-03-03 | Issue #1203 closed (`not planned`/stale) and PR #1318 auto-closed by the stale bot, unmerged. Neither the build failure nor the proposed fix was ever formally accepted or rejected by a draios maintainer. | [Issue #1203](https://github.com/draios/sysdig/issues/1203), [PR #1318](https://github.com/draios/sysdig/pull/1318) |
| 2023-10 (approx.) | `falcosecurity/libs` (the separate repo that now supplies sysdig's capture driver) merges experimental riscv64 kernel-module driver support via PR #1181 - outside `draios/sysdig`'s own scope. | Noted in dependency research; [falcosecurity/libs test matrix](https://falcosecurity.github.io/libs/matrix/) |
| Undated (present) | Debian sid ships `sysdig_0.41.4+repack-4_riscv64.deb` as a downstream package build, unconnected to any upstream issue/PR tracking. | [Debian package page](https://packages.debian.org/sid/riscv64/sysdig) |

**Key contributors:** hlieberman (issue author, no listed org [NEEDS VERIFICATION]); sforshee, Canonical Ltd. (PR author, CLA-confirmed).

**Is it fully upstream?** No. Zero riscv/riscv64 references exist anywhere in the current `draios/sysdig` source tree (confirmed by repo-wide grep and by GitHub `search_code` returning `total_count: 0` for `riscv`, `riscv64`, `__riscv`, `RISCV`, while equivalent queries for `aarch64`/`arm64`/`amd64` return thousands of hits, confirming the search tooling itself works). No riscv64-related commit has ever landed in this repository.

## 3. Upstream Support Tier

No formal tier policy exists (no PLATFORMS.md/SUPPORT.md/docs-platforms directory in the repo). The de facto tier structure is entirely implicit in the CI matrices and CMake architecture branches.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ci.yaml`, `build-drivers.yaml`, release workflows) | Yes (same workflows) | No |
| CI runs tests | Yes | Yes | No CI exists at all |
| CI release-blocking | Yes (part of the same required matrix) | Yes | N/A |
| Official GitHub release binaries | Yes (v0.41.4: `x86_64`/`AMD64` `.deb`/`.rpm`/`.tar.gz`/`.exe`) | Yes (v0.41.4: `aarch64`/`arm64` `.deb`/`.rpm`/`.tar.gz`/`.dmg`) | None |
| Explicit CMake arch branch | Yes (`x86_64` -> `amd64` Debian arch) | Yes (`aarch64` -> `arm64` Debian arch) | None |
| Kernel driver/eBPF probe support | Full, dedicated driverkit configs across kernel versions 5.4-6.17 | Full, same driverkit configs | Experimental kmod only (via falcosecurity/libs PR #1181), no CI; modern eBPF driver (sysdig's default) unported |

Evidence: [`ci.yaml`](https://github.com/draios/sysdig) (matrix `platform: [amd64, arm64]`), [`build-drivers.yaml`](https://github.com/draios/sysdig) (matrix `name: [amd64, arm64]`), release asset listing for v0.41.4.

## 4. Technical Architecture and RISC-V-Specific Subsystems

sysdig itself has no vectorized/SIMD numeric hot paths (it is not an optimization-purpose project - see Section 13). Its architecture-specific surface consists of:

- **Kernel syscall table (`driver/syscall_table.c`):** Two static tables (`g_syscall_table`, `g_syscall_code_routing_table`) index syscalls by `__NR_*` macros. These macros are undefined for a set of syscalls on RISC-V's kernel UAPI headers, causing a hard compile failure (`error: '__NR_open' undeclared here`). This is the concrete architecture-specific blocker documented in Issue #1203, and it has never been fixed upstream.
- **Kernel capture driver / eBPF probe:** Not maintained in this repo at all; sourced from `falcosecurity/libs`. riscv64 kernel-module support is merged there but experimental/uncovered by CI; the modern eBPF driver (sysdig's default `BUILD_SYSDIG_MODERN_BPF=ON`) has no riscv64 implementation.
- **LuaJIT (chisel scripting engine):** JIT-compiled, architecture-specific by nature. Upstream `LuaJIT/LuaJIT` has no merged RISC-V JIT backend (an open PR, #1267, has sat unmerged since September 2024). A default sysdig build bundling upstream LuaJIT will fail to build on riscv64.
- No GC barriers apply (sysdig is not a garbage-collected runtime). No custom cryptography or hand-written assembly was found in `draios/sysdig` itself for any architecture.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Syscall table (`driver/syscall_table.c`) | Complete, all `__NR_*` defined | Complete, all `__NR_*` defined | Incomplete - undefined `__NR_*` macros cause build failure ([Issue #1203](https://github.com/draios/sysdig/issues/1203)) |
| Kernel driver / eBPF probe | Full, driverkit configs for many kernel versions | Full, driverkit configs for many kernel versions | Kmod only, experimental, no CI (falcosecurity/libs); modern eBPF driver missing |
| LuaJIT (chisels) | Full JIT | Full JIT | No upstream JIT backend merged (PR #1267 open) |

## 5. Build System, Cross-Compilation, and Toolchain

Build system: CMake >= 3.12, C++17 standard (`CMakeLists.txt`). CI uses Zig as the C/C++ compiler shim (`zig-cc`/`zig-c++`, `ZIG_VERSION: 0.14.1`) with the command:
```
cmake -DUSE_BUNDLED_DEPS=ON -DBUILD_BPF=OFF -DBUILD_DRIVER=OFF -DCMAKE_BUILD_TYPE=Release -S . -B build -G Ninja
cmake --build build --target package --config Release
```
No `CMAKE_TOOLCHAIN_FILE` exists anywhere in the repository for any architecture, riscv64 included; cross-arch CI builds use the Zig compiler shim rather than a dedicated toolchain file. No QEMU usage exists anywhere in the repo (build, CI, or docs). No riscv64 Dockerfile exists; the only Dockerfiles present (`docker/scap-driver-toolchains/Dockerfile`, `docker/sysdig/Dockerfile`) are not architecture-specific.

**Known build failures on riscv64 (from research):**
1. `driver/syscall_table.c` fails to compile due to undefined `__NR_*` macros ([Issue #1203](https://github.com/draios/sysdig/issues/1203)).
2. The Falco container-enrichment plugin is fetched as a prebuilt binary via `cmake/modules/container_plugin.cmake` (`ExternalProject_Add`), downloading `container-0.6.0-linux-${CMAKE_HOST_SYSTEM_PROCESSOR}.tar.gz` from `download.falco.org`. `container-0.6.0-linux-riscv64.tar.gz` returns **HTTP 404** (verified live), while the x86_64 equivalent returns 200. A default riscv64 build fails at this `ExternalProject_Add` step. Additionally, `CONTAINER_HASH` is only defined for `x86_64` with a fallback branch that assumes arm64 - wrong for riscv64 even were the file to exist.
3. Bundled upstream LuaJIT (`USE_BUNDLED_LUAJIT=ON` by default) has no riscv64 port and will fail to build from the pinned upstream commit.

No documented minimum GCC/Clang version tied to architecture exists anywhere in the repo (no `BUILDING.md`, `INSTALL`, or `docs/` directory is present at all).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel-module capture driver | Yes, CI-built, released | Yes, CI-built, released | Experimental only (falcosecurity/libs), no CI, not built/released by draios/sysdig |
| Modern eBPF driver (sysdig default) | Yes | Yes | No implementation exists in falcosecurity/libs |
| Container-metadata enrichment plugin | Yes (prebuilt binary ships) | Yes (prebuilt binary ships) | No - `container-0.6.0-linux-riscv64.tar.gz` returns HTTP 404 |
| Chisel scripting (LuaJIT) | Full JIT | Full JIT | Fails to build with bundled upstream LuaJIT; requires manual override to a system OpenResty-fork LuaJIT package (available on Ubuntu riscv64 as `libluajit-5.1-2`, not upstream `LuaJIT/LuaJIT`) |
| CLI/TUI build (`sysdig`, `csysdig`) | Yes | Yes | Blocked by the above build failures unless worked around |
| Official release packages | `.deb`/`.rpm`/`.tar.gz`/`.exe` | `.deb`/`.rpm`/`.tar.gz`/`.dmg` | None |

**Functional gaps:** on riscv64, a default build cannot complete due to the container-plugin 404 and, historically, the undefined `__NR_*` syscall macros. Even if those are worked around, the default modern eBPF capture path is unavailable, leaving only the experimental, CI-less kernel-module driver.

**Performance gaps:** Data not available - no published riscv64 performance benchmarks for sysdig exist anywhere that could be located (GitHub issues, general web search, riseproject.dev/blog, the RISC-V Optimization Guide, FOSDEM 2026 abstracts, The New Stack). The closest available data is generic, non-sysdig-specific eBPF-tooling commentary: a FOSDEM 2026 talk abstract ("eBPF Observability on RISC: What Works, What Breaks, and How to Test It") states RISC-V eBPF support "exists but remains incomplete," and a The New Stack article quotes sources describing RISC-V's eBPF JIT as "still catching up" to ARM64/x86_64, with "slightly higher CPU usage per probe execution" in high-frequency profiling - neither is sysdig-specific or backed by real-silicon numbers (testing described as QEMU-based).

**Security hardening gaps:** Data not available - no research was found addressing riscv64-specific hardening differences for sysdig.

**NaN/floating-point semantics:** Data not available - a targeted GitHub issue search ("riscv nan floating") against `draios/sysdig` returned zero results; no floating-point correctness issue for sysdig on RISC-V exists in the tracker.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by reading the complete, literal content of all 7 workflow files in `.github/workflows/`: `ci.yaml`, `build-drivers.yaml`, `release-draft.yaml`, `release-final.yaml`, `ci-check.yaml`, `dco-check.yaml`, `stale.yaml`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `azure-pipelines.yml`, or `.drone.yml` exists anywhere in the tree.

| File | Trigger | Matrix / runners | riscv64? |
|---|---|---|---|
| `ci.yaml` (main CI) | `pull_request`/`push` on `dev`, `workflow_dispatch` | `ubuntu-24.04` / `ubuntu-24.04-arm`; matrix `platform: [amd64, arm64]`; second job on `windows-latest`, `macos-15-intel`, `macos-14` | No |
| `build-drivers.yaml` | `push` (paths-filtered) + `workflow_dispatch` | matrix `name: [amd64, arm64]`, native runners | No |
| `release-draft.yaml` | `push` on version tags | matrix `platform: [amd64, arm64]` (plus windows/macos) | No |
| `release-final.yaml` | `release: published` / `workflow_dispatch` | matrix `name: [amd64, arm64]` throughout | No |
| `ci-check.yaml` | `pull_request`/`workflow_dispatch` | `ubuntu-latest`, `actionlint` (lint only) | No |
| `dco-check.yaml` | `pull_request` | reusable `cncf/dcochecker` workflow, no platform matrix | No |
| `stale.yaml` | cron | `ubuntu-latest`, bot housekeeping | No |

No job uses a riscv64 runner label, no QEMU/binfmt emulation targeting riscv64, and no `linux/riscv64` Docker buildx platform target anywhere in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Yes | No |
| CI tests | Yes | Yes | No CI exists |
| CI publishes release | Yes | Yes | No |
| RISE runners in use | No | No | No - sysdig is not a RISE member and no RISE-related CI reference exists anywhere in the repo (see Section 12) |

## 8. Distribution and Release Status

- **GitHub releases (upstream):** No riscv64 binary in any recent release. v0.41.4 assets are `aarch64`/`arm64` and `x86_64`/`AMD64` only (`.deb`, `.rpm`, `.tar.gz`, `.exe`, `.dmg`).
- **PyPI:** No package named `sysdig` exists at all - `https://pypi.org/pypi/sysdig/json` and `https://pypi.org/simple/sysdig/` both return **404**. sysdig is not distributed via PyPI in any form.
- **RISE Python wheel builder:** Not applicable - the GitLab mirror redirects to the (nonexistent) PyPI page; `sysdig` is not among the ~80 packages the RISE wheel builder lists.
- **Debian sid:** ships `sysdig` version `0.41.4+repack-4` for riscv64. Verified live via direct HTTP HEAD request on `deb.debian.org` and `ftp.debian.org` mirrors: **HTTP 200**, `content-type: application/vnd.debian.binary-package`, `content-length: 401660`, `last-modified: Wed, 05 Aug 2026`. Depends on `falcosecurity-scap-dkms` for the kernel driver. [Debian package page](https://packages.debian.org/sid/riscv64/sysdig)
- **Ubuntu:** `sysdig` version `0.40.0+repack-3` (section `admin`, repository `universe`) is available for riscv64 on Ubuntu 26.04 "resolute," and the same package is also listed for jammy, noble, questing, and stonking riscv64 suites. [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=sysdig&suite=resolute&searchon=names&section=all)
- **Arch Linux RISC-V (archriscv.felixc.at):** No `sysdig` match found in the `riscv64/extra` listing - not confirmed present [NEEDS VERIFICATION].
- **Fedora:** Data not available - not checked in this research.

**What a user must do to get a working binary today:** On Debian sid or a recent Ubuntu release, `apt install sysdig` on riscv64 pulls a real, distro-built package. Building from upstream source on riscv64 directly is very likely to fail without manual intervention, given three confirmed build blockers in the default CMake configuration (Section 5) - the container plugin download returning 404, undefined syscall macros historically reported, and bundled LuaJIT lacking a riscv64 port. There is no evidence in the research that Debian/Ubuntu's packaging carries riscv64-specific patches or CMake-option overrides to work around these issues, or that it does not - patch status is unconfirmed.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| **falcosecurity/libs** | Build-dependency, critical - core syscall-capture engine (libscap/libsinsp) and kernel-module/eBPF driver | Kernel-module (kmod) driver: riscv64 merged via [PR #1181](https://github.com/falcosecurity/libs/pull/1181) (Oct 2023), marked "experimental." Modern eBPF driver (sysdig's default): no riscv64 support merged, no follow-up PR found. | Official [test matrix](https://falcosecurity.github.io/libs/matrix/) lists only AMD64 and ARM64 - riscv64 absent from CI entirely. Debian package `falcosecurity-libs` 0.23.2-4 currently shows "missing build on riscv64" per tracker.debian.org. | No official upstream binaries for any arch (source/distro builds only); Debian riscv64 build currently failing/missing. | Modern eBPF driver (sysdig's default build option) has no riscv64 implementation at all; only the untested, CI-less kmod path exists. |
| **CMake** | Build-dependency, critical - the entire sysdig build system | Data not available: CMake's own riscv64 packaging/build status was not specifically investigated in this research. CMake is not architecture-specific to the project's build failures identified (the failures are in sysdig's own `CMakeLists.txt` architecture branches, not in CMake itself). | Data not available | Data not available | None identified specific to CMake itself; the blocking issues found are in sysdig's *use* of CMake (missing riscv64 arch branch, container-plugin download URL), not in CMake as a tool. |
| **LuaJIT** (`LuaJIT/LuaJIT`, bundled by default) | Chisel scripting JIT engine | Upstream has zero merged riscv64 support; RISC-V JIT backend exists only in unmerged [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) (open since Sep 2024). Default `USE_BUNDLED_LUAJIT=ON` build fails on riscv64. | N/A upstream | Ubuntu riscv64 ships `libluajit-5.1-2` at `2.1.0+openresty20251030-1` - the **OpenResty fork**, not upstream `LuaJIT/LuaJIT`. | Historical precedent: Debian bug [#1068731](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1068731) documented `falcosecurity-libs`' chisel-related LuaJIT-API code FTBFS on riscv64 when the LuaJIT-dev package was unavailable, silently linking stock Lua instead and failing on `luaL_setfuncs`; fixed downstream in falcosecurity-libs 0.18.1-1 (Oct 2024) by using the system package. |
| **oneTBB** | Threading/scalable-allocator runtime, bundled via falcosecurity/libs | Fully upstream since [PR #1086](https://github.com/oneapi-src/oneTBB/pull/1086) (Apr 2023); GCC builds need manual `-latomic` (stalled [PR #987](https://github.com/oneapi-src/oneTBB/pull/987), open since Dec 2022). | No continuous riscv64 CI upstream; Debian buildd builds it. | Ubuntu ships `libtbb12`/`libtbb-dev` for riscv64. | Non-blocking: `-latomic` link friction (workaround exists); `machine_pause()` degrades to `sched_yield()` on riscv64 (perf-only). |
| **RE2** | Regex engine for filter expressions, bundled via falcosecurity/libs | Pure portable C++17, builds cleanly on riscv64. | No upstream CI for non-x86_64; Debian buildd builds it successfully. | Ubuntu ships `libre2-dev`/`libre2-10` for riscv64. | Its required dependency **Abseil-cpp** has two open riscv64-relevant bugs: [abseil#2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT in hashtablez sampler on riscv64-linux-gnu) and [abseil#2142](https://github.com/abseil/abseil-cpp/issues/2142) (SwissTable collision-count OOB affecting `kWidth==8` platforms, riscv64 included). Whether RE2's `flat_hash_map` usage inside libsinsp filters triggers these is unconfirmed. |
| **zlib** | Compression, direct dependency | Pure portable C, builds cleanly on riscv64. | No dedicated riscv64 Linux CI upstream. | Ubuntu ships `zlib1g`/`zlib1g-dev` for riscv64. | Perf gap only - no RVV Adler32/CRC32 acceleration merged ([PR #1099](https://github.com/madler/zlib/pull/1099), open 8+ months, unreviewed). |
| **Falco container plugin** (`falcosecurity/plugins`, pinned v0.6.0) | Container-metadata enrichment, fetched as a prebuilt binary | N/A - not built from source; downloaded from `download.falco.org`. | N/A | **Confirmed HTTP 404** for `container-0.6.0-linux-riscv64.tar.gz`, while x86_64 returns 200. No riscv64 binary is published. | Hard, currently-reproducible build blocker - the CMake `ExternalProject_Add` step fails outright for a default riscv64 build. |
| ncurses, yaml-cpp, nlohmann/json, JsonCpp, valijson, aklomp/base64 | csysdig TUI; YAML/JSON config and schema parsing; base64 codec | All pure/portable C or C++, no architecture-specific code paths identified as blocking. `yaml-cpp` and `libjsoncpp-dev` confirmed on Ubuntu riscv64; `nlohmann-json` is header-only. `aklomp/base64`'s SIMD dispatcher (scalar/AVX/NEON) has no RVV path but falls back to scalar correctly. | Not individually tracked; low risk. | Standard Debian/Ubuntu riscv64 packages exist for all of these. | None identified as blocking. |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1203](https://github.com/draios/sysdig/issues/1203) | Multiple Build Failures on arm64/mips/mipsel/mips64el/alpha/riscv | Closed (not planned/stale, 2023-03-03) | High (build-blocking) | Root cause: `driver/syscall_table.c` references undefined `__NR_*` syscall macros on riscv64. Closed without resolution; underlying cause presumably still present in current source (zero riscv references anywhere in the repo today). |
| [PR #1318](https://github.com/draios/sysdig/pull/1318) | Fix build failures due to undefined syscall numbers (#1203) | Closed, unmerged (auto-closed stale, 2023-03-03) | N/A (fix attempt) | Author (sforshee, Canonical) explicitly notes the fix was untested on RISC-V, only arm64. Received zero maintainer review in four years. |
| N/A (live-verified condition) | `container-0.6.0-linux-riscv64.tar.gz` returns 404 on `download.falco.org` | Active, unresolved, not tracked by any GitHub issue found | High (build-blocking for default config) | Verified live this research cycle; no `falcosecurity/plugins` issue tracking riscv64 was found. |
| N/A (Debian tracker) | `falcosecurity-libs` 0.23.2-4 "missing build on riscv64" | Active | High (blocks the driver dependency chain) | Per tracker.debian.org, blocking testing migration for the Debian package. |

**Correctness bugs:** None found specific to RISC-V. A targeted search for "riscv nan floating" returned zero results, and no currently open GitHub issue in `draios/sysdig` mentions riscv/riscv64 at all. (Issue #2175, surfaced by semantic search on "riscv64 performance," is a false positive - its dmesg trace shows an x86_64 QEMU VM, not RISC-V.)

## 12. Objections and Upstream Blockers

**Technical blockers:**
- Undefined `__NR_*` syscall macros in `driver/syscall_table.c` (Issue #1203, unresolved since 2018).
- No riscv64 implementation of the modern eBPF driver (sysdig's default capture path) in `falcosecurity/libs`.
- `container-0.6.0-linux-riscv64.tar.gz` returns HTTP 404 - a hard, currently-reproducible build failure for the default configuration.
- Bundled upstream LuaJIT has no riscv64 JIT backend merged (`LuaJIT/LuaJIT` PR #1267 open since Sep 2024, no maintainer comment found from Mike Pall, the sole maintainer, per prior research).

**Organizational blockers:**
- Single-vendor (Sysdig Inc.) governance with a small, flat CODEOWNERS list and no documented tiering/RFC process for new platform ports.
- Historical precedent of non-engagement: PR #1318 received zero human review or comment from any draios maintainer across four years before being auto-closed by a stale bot.
- sysdig/draios is **not a RISE project member** (checked against both the Premier tier - Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent - and the General tier - Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). No RISE blog post, wiki page, GitHub repo, or wheel-builder entry references sysdig. The only trace found is an unauthored placeholder entry in this project-report repository's own `.queue.yml` backlog.

**Stated objections:** None found - there is no recorded maintainer statement, for or against, on riscv64 support for sysdig.

**Acceptance probability:** Low, absent a dedicated, funded push. The repository shows no precedent of a non-x86/arm64 architecture being accepted (the equivalent MIPS build-failure issue, #1644, was fixed; the RISC-V one, #1203, was not), and the sole RISC-V-specific PR received no engagement whatsoever before expiring. A new riscv64 port would additionally require upstream fixes to land first in `falcosecurity/libs` (modern eBPF driver) and `falcosecurity/plugins` (container plugin riscv64 binary), which are outside `draios/sysdig` maintainers' direct control.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Debian sid and Ubuntu build and ship riscv64 packages; no upstream-published riscv64 CI or release artifact exists)
- **Optimization level:** not applicable - sysdig is not an optimization-purpose project (it is a syscall-tracing observability tool, not a library whose value proposition is architecture-specific numeric/SIMD performance), so the Step 2 optimization modifier is not applied.
- **Justification:** No upstream riscv64 CI exists anywhere in `draios/sysdig` - every GitHub Actions workflow (`ci.yaml`, `build-drivers.yaml`, `release-draft.yaml`, `release-final.yaml`) has a build matrix limited to `amd64`/`arm64` (plus windows/macos), confirmed by reading the complete content of all 7 workflow files. No riscv64 asset appears in any GitHub release. The distribution floor applies because Debian sid and Ubuntu both ship real, downloadable riscv64 `.deb` packages ([Debian package page](https://packages.debian.org/sid/riscv64/sysdig), verified live via HTTP 200 HEAD request), but the vanilla upstream build is confirmed to fail on riscv64 via at least one live, reproducible blocker (the Falco container-plugin download 404) plus a historically documented syscall-table build failure (Issue #1203) - patch status of the Debian/Ubuntu packages was not directly confirmed as either clean or patched, but the confirmed build blockers make an unpatched build implausible. Per the skill's distribution-floor rule, a patched-or-uncertain downstream build caps at **orange**, not yellow.
- **Pending work that could change the grade:** None identified. PR #1318 (the only historical riscv64 fix attempt) is closed and unmerged with no successor PR. sysdig is not a RISE member and no RISE involvement, funding, or runner usage was found. The only forward motion visible is entirely downstream (Debian/Ubuntu packaging) and in the separate `falcosecurity/libs` project (experimental kmod driver, no CI), neither of which is tracked by or connected to `draios/sysdig` itself.

## 14. Investment Analysis

RISE has no existing involvement with sysdig to build on or avoid duplicating (confirmed: not a RISE member, no RISE blog post, no RISE-funded work, no RISE runner usage - see Sections 1 and 12). All estimates below are original sizing by this report's author, not sourced from research findings, and are flagged as such.

### 14.1 Functional Enablement
Work required to get sysdig building and passing its own test coverage on riscv64 from vanilla upstream source: (a) fix the `driver/syscall_table.c` `__NR_*` macro guards (a revived/re-tested version of PR #1318, since the original was never validated on real RISC-V hardware); (b) either disable the Falco container plugin for riscv64 builds or get a riscv64 binary published to `download.falco.org` (falcosecurity/plugins side); (c) either switch the default LuaJIT dependency to a system/OpenResty-fork package on riscv64 or wait on upstream `LuaJIT/LuaJIT` PR #1267; (d) land and stabilize the modern eBPF driver for riscv64 in `falcosecurity/libs`, or accept the experimental kmod-only path.

### 14.2 Performance Optimization
Not applicable in the Section 13 sense (sysdig is not optimization-purpose), but observability-tool overhead is directly affected by eBPF JIT maturity on RISC-V, which multiple qualitative sources describe as behind x86_64/ARM64 (Section 6). No sysdig-specific benchmarking has been done; establishing a baseline would be a prerequisite to any tuning work.

### 14.3 CI/CD Infrastructure
Add a riscv64 entry to the `platform`/`name` matrices in `ci.yaml`, `build-drivers.yaml`, `release-draft.yaml`, and `release-final.yaml`, ideally using RISE-provided native riscv64 runners (RISE's blog references a "RISE RISC-V Runners" program as of March 2026, per prior RISE-blog enumeration in this research, though no confirmation that sysdig has requested or received access to it).

### 14.4 Ecosystem Enablement
Not applicable - Section 10 is omitted because sysdig has no dependent package ecosystem (it is a standalone CLI/observability tool, not a library with downstream package consumers).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix/re-validate `driver/syscall_table.c` `__NR_*` guards on real riscv64 hardware (revive PR #1318) | 1-2 | draios/sysdig maintainer or contributor | Critical |
| Functional | Resolve Falco container-plugin riscv64 binary (publish to download.falco.org or gate the CMake step) | 1-2 | falcosecurity/plugins maintainer, coordinated with sysdig | Critical |
| Functional | Switch default LuaJIT dependency handling for riscv64 (system-package override) or track upstream PR #1267 | 1 | draios/sysdig maintainer | High |
| Functional | Stabilize/land modern eBPF driver support for riscv64 in falcosecurity/libs | 4-8 | falcosecurity/libs maintainer | High (blocks sysdig's default capture path) |
| CI/CD | Add riscv64 to ci.yaml, build-drivers.yaml, release-draft.yaml, release-final.yaml matrices, ideally on native RISE runners | 2-3 | draios/sysdig maintainer | High |
| Distribution | Publish official upstream riscv64 release artifacts once build is stable | 1 | draios/sysdig maintainer | Medium |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [draios/sysdig repository](https://github.com/draios/sysdig)
- [sysdig homepage](https://sysdig.com/)
- [Issue #1203 - Multiple Build Failures on arm64/mips/mipsel/mips64el/alpha/riscv](https://github.com/draios/sysdig/issues/1203)
- [PR #1318 - Fix build failures due to undefined syscall numbers (#1203)](https://github.com/draios/sysdig/pull/1318)
- [Issue #2175 - UBSAN array-index-out-of-bounds (false positive, x86_64 QEMU, not RISC-V)](https://github.com/draios/sysdig/issues/2175)
- [Issue #427 - system crash caused by sysdig_probe on RHEL6 (unrelated)](https://github.com/draios/sysdig/issues/427)
- [Issue #1644 - FTBFS on MIPS architectures (unrelated)](https://github.com/draios/sysdig/issues/1644)
- [Debian bug #905929 - referenced by Issue #1203](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=905929)
- [Debian sysdig riscv64 package page](https://packages.debian.org/sid/riscv64/sysdig)
- [Debian sysdig riscv64 download listing](https://packages.debian.org/sid/riscv64/sysdig/download)
- [Ubuntu packages search - sysdig, resolute, riscv64](https://packages.ubuntu.com/search?keywords=sysdig&suite=resolute&searchon=names&section=all)
- [PyPI sysdig JSON API - 404, no package exists](https://pypi.org/pypi/sysdig/json)
- [falcosecurity/libs PR #1181 - riscv64 kernel-module driver](https://github.com/falcosecurity/libs/pull/1181)
- [falcosecurity/libs official test matrix](https://falcosecurity.github.io/libs/matrix/)
- [falcosecurity-libs Debian tracker](https://tracker.debian.org)
- [LuaJIT/LuaJIT PR #1267 - RISC-V JIT backend, open unmerged](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [Debian bug #1068731 - falcosecurity-libs chisel/LuaJIT FTBFS on riscv64](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1068731)
- [oneTBB PR #1086 - riscv64 Clang cross-toolchain](https://github.com/oneapi-src/oneTBB/pull/1086)
- [oneTBB PR #987 - GCC -latomic (stalled)](https://github.com/oneapi-src/oneTBB/pull/987)
- [abseil-cpp issue #2002 - riscv64 SEGFAULT in hashtablez sampler](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #2142 - SwissTable collision-count OOB, kWidth==8 platforms](https://github.com/abseil/abseil-cpp/issues/2142)
- [zlib PR #1099 - RVV Adler32/CRC32 acceleration (open, unreviewed)](https://github.com/madler/zlib/pull/1099)
- [RISE project - members page](https://riseproject.dev/members/)
- [RISE project - blog index](https://riseproject.dev/blog)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
