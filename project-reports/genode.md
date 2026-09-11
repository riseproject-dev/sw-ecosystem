---
title: Genode
parent: Project Reports
color: orange
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
---

# Genode

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Genode<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="genode" %}

## 1. Project Overview

Genode is a component-based operating-system framework and microkernel abstraction layer, developed primarily by [Genode Labs GmbH](https://genode.org/), a German commercial company. There is no independent non-profit foundation behind the project: the repository carries no MAINTAINERS, CONTRIBUTING, or GOVERNANCE file, and the [Codeberg README](https://codeberg.org/genodelabs/genode) states plainly that "the driving force behind the Genode OS Framework is the German company Genode Labs. The company offers commercial licensing, trainings, support, and contracted development work." The project is dual-licensed: GNU AGPLv3 for community use, with a Genode-Labs-granted linking exception, alongside commercial licenses sold by Genode Labs - a classic dual/commercial open-core model.

Nearly every core committer identified in commit history uses a `@genode-labs.com` address: Norman Feske, Christian Helmuth, Sebastian Sumpf (author of nearly all RISC-V port commits), and Stefan Kalkowski. External contributions are accepted - the sole external RISC-V contributor identified is Piotr Tworek, who added VirtIO driver support for RISC-V in 2022 ([PR #4533](https://github.com/genodelabs/genode/pull/4533)) - but the overwhelming majority of architecture-port work is done in-house by Genode Labs staff, not by a broad independent community following an open RFC process.

Community channels are informal: a mailing list, `genode.discourse.group`, and a community blog `genodians.org`. A separate community-maintained supplemental repository, `genode-world`, hosts contributions outside the core tree.

The canonical source repository was archived on GitHub on 2026-05-20 (`genodelabs/genode` is now read-only) and migrated to [Codeberg](https://codeberg.org/genodelabs/genode); the board-support satellite repo `genodelabs/genode-riscv` is archived as well. Genode is not a member of RISE - it does not appear in the [RISE members list](https://riseproject.dev/members/) (checked 2026-01-09 snapshot) among either Premier or General members, and no RISE blog post, working-group repo, or funded project references Genode anywhere.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2015-05-26 | First RISC-V commit: initial toolchain support, authored by Sebastian Sumpf | [commit 8cddd86](https://github.com/genodelabs/genode/commit/8cddd86a4c60f92ab94b2c6aca5fb8f7be482f6b) |
| 2016-02-11 | Founding umbrella issue "base-hw: add RISC-V support" opened | [issue #1880](https://github.com/genodelabs/genode/issues/1880) |
| 2017-05-26 | Ported base-hw riscv code to ISA spec v1.9.1 with GCC 6.3.0; kernel timer and dynamic linking explicitly noted as not-yet-working | [commit c3cf7f3](https://github.com/genodelabs/genode/commit/c3cf7f3c3ab61182bf9edac8caf6a26b9eedae9d) |
| 2019-03-19 | Fixed conflation of BBL machine-mode calls and kernel syscall IDs | [issue #3230](https://github.com/genodelabs/genode/issues/3230) |
| 2021-02-26 | Major rework: dropped Spike/BBL simulator+bootloader, moved to QEMU `virt` platform (>=4.2.1), updated to privileged ISA v1.10, adopted OpenSBI SBI calls | [issue #4012](https://github.com/genodelabs/genode/issues/4012) |
| 2021-03-12 | PLIC interrupt-controller support added to base-hw | [issue #4042](https://github.com/genodelabs/genode/issues/4042) |
| 2021-12-17 | RISC-V board support relocated out of the core `base-hw` tree into a separate `genode-riscv` supplemental repository (a demotion out of mainline) | [issue #4312](https://github.com/genodelabs/genode/issues/4312) |
| 2022-06-15 to 2022-08-17 | External contributor Piotr Tworek adds VirtIO (fb/input/nic) driver support for RISC-V, reviewed and landed by Christian Helmuth as a direct commit; first shipped in release 22.08 | [PR #4533](https://github.com/genodelabs/genode/pull/4533), [commit 9d417ee](https://github.com/genodelabs/genode/commit/9d417ee2f5ecc3f3dfa2eff41e1029e4f611a4c7) |
| 2023-05-30 | ld.lib.so breakage under GCC 12 (GOT-relative call to `strlen` before self-relocation completes) fixed | [issue #4867](https://github.com/genodelabs/genode/issues/4867) |
| 2025-05-28 | Page fault in `init` on bootup under GCC 14 fixed as part of the 25.05 toolchain update | [issue #5576](https://github.com/genodelabs/genode/issues/5576) |
| 2025-08-28 | ldso fails to resolve weak undefined symbols in stdcxx (RISC-V-specific ELF relocation typing bug in libitm/weak symbols) fixed | [issue #5607](https://github.com/genodelabs/genode/issues/5607) |
| 2025-10-30 | GCC `-shared` spec-string bug on arm_v8a/riscv fixed | [issue #5691](https://github.com/genodelabs/genode/issues/5691) |

**Key contributors:** Sebastian Sumpf (Genode Labs, author of nearly all RISC-V port commits), Christian Helmuth (Genode Labs, integrator), Norman Feske (Genode Labs), Stefan Kalkowski (Genode Labs), Piotr Tworek (external, VirtIO driver work).

**Is it fully upstream?** Partially. The kernel/core/CPU/MMU/trap/timer/dynamic-linker/libc code lives in Genode's mainline tree (`repos/base-hw/*/spec/riscv/`, `repos/base/*/spec/riscv/`, `repos/libports/*/spec/riscv/`). However, board-level glue was moved out of mainline into `genode-riscv` in 2021 ([issue #4312](https://github.com/genodelabs/genode/issues/4312)), and that repo is now itself archived. Live verification against the current mainline HEAD (`0f275e7`) found **no `virt_qemu_riscv` board directory** under `repos/base-hw/board/` (only `pbxa9`, `pc`, `virt_qemu_arm_v7a`, `virt_qemu_arm_v8a` exist), even though `virt_qemu_riscv` is the wired-in default `BOARD` value in `tool/builddir/build.conf/run_riscv`, and `RAM_BASE`/`PLIC_BASE` constants referenced in `bootstrap/spec/riscv/platform.cc` and `core/spec/riscv/pic.cc` are unresolved in this snapshot. This is a genuine gap between the CPU/core-level port (complete) and the board-integration layer (incomplete or relocated out-of-tree) - flagged for the packaging-pipeline owner in the source research.

## 3. Upstream Support Tier

No formal, written tier policy document was found (no MAINTAINERS file, no platform-support matrix). New-port work is tracked and merged via GitHub/Codeberg issue numbers by the Genode Labs core team, who also decide when a port is promoted into or demoted out of the core tree - as happened to RISC-V board support in 2021.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Board directory present in current tree | yes (`pc`) | yes (`pbxa9`, `virt_qemu_arm_v7a`, `virt_qemu_arm_v8a`) | **no** (`virt_qemu_riscv` referenced as default but directory absent) |
| Upstream CI (any kind) | none - repo has no CI config files at all | none | none |
| Official prebuilt OS/binary release | source-only releases (2 auto-generated GitHub assets per tag) | source-only | source-only; **no riscv64 artifact of any kind found in any channel checked** |
| SMP support | Data not available: not confirmed one way or the other in this research | Data not available | explicitly unsupported - source comment: "we don't support SMP on RISC-V yet" ([`hw/spec/riscv/cpu.h`](https://github.com/genodelabs/genode)) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Genode is a microkernel/OS component framework, not a language runtime - it has **no JIT infrastructure for any architecture**, and no SIMD-dispatch code path exists for riscv64. The ISA target is **RV64IMAC** (Integer, Multiply/Divide, Atomic, Compressed) with the **soft-float LP64 ABI**, set in `repos/base/mk/spec/riscv.mk`:
```
SPECS += 64bit
AS_OPT += -march rv64imac -mabi=lp64
```
No F/D (hardware float), no V (vector/RVV), and no B (bitmanip: Zba/Zbb/Zbc/Zbs) extensions are used or referenced anywhere in the tree.

**Inventory:** 50 riscv-specific files, approximately 2,850 lines total (dominated by a 1,836-line vendor-generated `c++config.h`; hand-written arch code is roughly 1,000 lines).

| Component | Path | Status |
|---|---|---|
| Boot/trap entry, exception vector | `base-hw/src/core/spec/riscv/exception_vector.s` | Complete; includes a documented **MIG-V silicon errata workaround** (7 NOPs after `wfi`) |
| MMU (Sv39 page tables) | `base-hw/src/include/hw/spec/riscv/page_table.h` | Complete |
| CPU/context switch | `base-hw/src/core/spec/riscv/cpu.cc`, `cpu.h` | Complete, single-hart only |
| Interrupt controller (PLIC) | `base-hw/src/core/spec/riscv/pic.cc`, `pic.h` | Complete for uniprocessor; `Global_interrupt_controller` is a dummy (no SMP/IPI) |
| SBI shim | `base/include/spec/riscv/sbi.h` | **Partial** - only `SET_TIMER` and `PUT_CHAR` SBI calls implemented, out of the full SBI call set |
| Dynamic linker (ldso) | `base/src/lib/ldso/spec/riscv/relocation.h`, `jmp_slot.s` | Complete, but has required repeated fixes across GCC upgrades (see Section 11) |
| Signal-receiver platform hooks | `base-hw/src/core/spec/riscv/dummies.c` | **Stub** - empty |
| Boot info | `base-hw/src/include/hw/spec/riscv/boot_info.h` | **Stub** - empty `Board::Boot_info {}` |
| Board memory-map wiring (`RAM_BASE`/`PLIC_BASE`) | referenced in `bootstrap/spec/riscv/platform.cc`, `core/spec/riscv/pic.cc` | **Missing in current tree** - no board directory to supply these constants |

The core CPU/MMU/trap/timer/dynamic-linker/libc path is complete and functional for a single-hart Sv39 target using OpenSBI, including two documented MIG-V-silicon errata workarounds. The gaps are structural: no SMP/IPI support, a minimal (2-of-many-calls) SBI shim, explicit stub files, and an unresolved board-integration layer in the current snapshot.

Comparison with arm64/amd64: those architectures have complete board directories (`pbxa9`, `pc`, `virt_qemu_arm_v7a`, `virt_qemu_arm_v8a`) present in the current tree; riscv64 does not.

## 5. Build System, Cross-Compilation, and Toolchain

Genode has **no CMake build system and no Dockerfiles**. It uses its own make + Tcl "run tool" build system. Confirmed by direct repository inspection: no `CMakeLists.txt` for the OS build (only two unrelated Qt5/Qt6 test-app CMake files), no `Dockerfile`, no `.ci/`, no `docker/`.

**Toolchain requirement (exact, not a floor):** GCC 14.2.0 and binutils 2.44, enforced by `tool/builddir/build.mk`:
```
REQUIRED_GCC_VERSION ?= 14.2.0
```
The build aborts (`$(error ...)`) if the cross `g++` reports any other version. This is a strict exact-version match, not a minimum. The custom toolchain exists because Genode requires specific thread-local-storage handling and a custom libc/stdint configuration - a Genode-specific patch (`repos/ports/src/noux-pkg/gcc/patches/config.patch`) replaces `newlib-stdint.h` with a Genode-specific `genode-stdint.h` for the `riscv*-*-elf*` target.

**Build sequence:**
```sh
./tool/create_builddir riscv BUILD_DIR=build/riscv
cd build/riscv
# edit etc/build.conf to enable REPOSITORIES (libports, ports, etc.)
make -C . <target>
make run/<scenario> KERNEL=hw BOARD=virt_qemu_riscv
```
Default kernel/board wiring (`tool/builddir/build.conf/run_riscv`):
```
KERNEL ?= hw
BOARD  ?= virt_qemu_riscv
```

**QEMU usage:** invoked via `tool/run/power_on/qemu` (Tcl/Expect), which selects `qemu-system-riscv64` when `have_spec riscv`, boots the built `boot/image.elf` via `-kernel`, and redirects serial via `-serial mon:stdio` unless overridden.

**Known build failures (toolchain-upgrade fragility, a recurring pattern):**
- GCC 12: `ld.lib.so` broke on RISC-V because an inline `strlen` optimize-attribute caused the compiler to emit a GOT-relative call executing before dynamic-linker self-relocation completes; the GOT is all-zero pre-relocation on RISC-V, causing a NULL-pointer jump ([issue #4867](https://github.com/genodelabs/genode/issues/4867)).
- GCC 14: page fault in `init` on bootup ([issue #5576](https://github.com/genodelabs/genode/issues/5576)).
- GCC (unspecified version): `-shared` link flag silently producing executables instead of shared libraries due to a spec-string typo (`%(shared:...)` vs `%{shared:...}`) affecting arm_v8a and riscv ([issue #5691](https://github.com/genodelabs/genode/issues/5691)).
- Live verification found that building `hw`+`virt_qemu_riscv` as-is in the current snapshot may fail to resolve the board entirely, since the `virt_qemu_riscv` board directory does not exist in the current tree (Section 4).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| VirtIO drivers (fb/input/nic) | yes | yes | yes, since release 22.08, using MMIO transport matching the ARM pattern ([PR #4533](https://github.com/genodelabs/genode/pull/4533)) |
| SMP/multi-hart support | Data not available (not directly confirmed in this research) | Data not available | **no** - explicitly unsupported per source comment |
| Board directory in current mainline tree | yes | yes | **no** (`virt_qemu_riscv` referenced but absent) |
| Hardware floating point | Data not available | Data not available | **no** - soft-float LP64 ABI only |
| Vector/SIMD (RVV) | n/a | Data not available | **no** - not used anywhere in the codebase |
| Full SBI call coverage | n/a | n/a | **no** - only 2 of the SBI call set implemented (timer, console putchar) |

**Performance gaps:** Data not available: no published Genode-specific riscv64 benchmark data exists in any source checked (RISE blog archive of 34 posts, `genode.org/documentation/articles/riscv`, `genodians.org/ssumpf/2021-02-24-riscv`, Genode mailing lists, GitHub search). Genode's soft-float ABI choice on riscv64 implies a floating-point performance cost relative to a hardware-float configuration, but no quantitative data exists to size this gap.

**Security hardening gaps:** Data not available: no ASLR, stack-protector, or hardening-flag comparison across architectures was found in this research.

**NaN / floating-point semantics:** No RISC-V-specific NaN or floating-point bug exists in the GitHub issue tracker. The only related closed bugs found are architecture-different: [#4879](https://github.com/genodelabs/genode/issues/4879) "arm_v8a: strange floating-point errors with GCC-12" (`FLT_EPSILON` reporting as `nan`, ARMv8a) and [#3723](https://github.com/genodelabs/genode/issues/3723) "ieee754 test fails on hw/imx8q_evk" (ARM/i.MX8). Since riscv64 runs soft-float exclusively, hardware-FP NaN edge cases are structurally avoided on that architecture, at an unquantified performance cost.

## 7. CI/CD Infrastructure

**Confirmed: no CI of any kind exists in `genodelabs/genode`, for any architecture, not just riscv64.** Direct inspection of the cloned repository (HEAD `0f275e7`) found no `.github/workflows/` directory, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`, and zero `*.yml`/`*.yaml` files anywhere in the tree. This was cross-checked against GitHub's own code-search API:
```
query: repo:genodelabs/genode path:.github/workflows extension:yml -> total_count: 0
query: repo:genodelabs/genode-riscv path:.github/workflows -> total_count: 0
```
The satellite board-support repo `genodelabs/genode-riscv` (also archived) likewise has zero workflow files.

Genode has its own internal "depot_autopilot" test-automation framework, run on Genode Labs' own infrastructure (not GitHub Actions, not publicly visible). [Issue #4351](https://github.com/genodelabs/genode/issues/4351) ("riscv: failed tests in depot_autopilot") shows riscv-specific autopilot test failures were tracked and disabled historically, which implies autopilot tests **do** run for riscv64 as part of Genode Labs' internal process - but no public artifact confirms current pass/fail state, and this is not verifiable third-party CI.

No RISE RISC-V runner usage was found anywhere - Genode has no relationship with RISE at all.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI (GitHub Actions/GitLab/Jenkins/Cirrus) | none | none | none |
| Internal Genode Labs autopilot testing | presumed yes (not publicly verifiable) | presumed yes (not publicly verifiable) | historically yes, per [issue #4351](https://github.com/genodelabs/genode/issues/4351); current state not publicly verifiable |
| RISE runner usage | none | none | none |

## 8. Distribution and Release Status

**No riscv64 binaries exist in any channel checked:**
- **GitHub Releases:** the 5 most recent releases (`sculpt-26.04`, `26.02`, `25.11`, `sculpt-25.10`, `25.08`) each show only "Assets 2" - GitHub's standard auto-generated source-code zip/tar.gz pair, with no additional uploaded binaries and no riscv64-named asset found.
- **PyPI:** `https://pypi.org/pypi/genode/json` returns HTTP 404 - not applicable, Genode is a C++ OS framework, not a Python package.
- **Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=genode&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no `genode` package exists for **any** architecture in Ubuntu, so riscv64 specifically is moot.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no `genode` package found via search or package listing.
- **project-graph database:** the query for Ubuntu 26.04 riscv64 binaries could not be executed - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) throughout this research. This is a tooling failure, not a confirmed-empty result, and should be retried.

**What a user must do to get a working binary:** build from source using Genode's own make+Tcl run-tool build system and a custom cross toolchain (GCC 14.2.0 / binutils 2.44, `genode-riscv-` prefix), either compiled from source via `tool/tool_chain riscv` or installed from a prebuilt multi-arch toolchain tarball published at genode.org (`genode-toolchain-25.05-debian-12.10.tar.xz` / `-ubuntu-24.04.tar.xz`) whose riscv64 content was **not independently verified in this research** [NEEDS VERIFICATION]. The user must then also resolve the missing `virt_qemu_riscv` board-directory gap identified in Section 4/5 before a `hw`+`virt_qemu_riscv` build can be expected to succeed against the current mainline snapshot.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| **GCC** (14.2.0, build-dependency, critical) | Cross-compiler toolchain | upstream GCC riscv64 support is mature, but Genode's exact-pinned 14.2.0 plus Genode-specific patches has repeatedly caused riscv-specific integration regressions | n/a (toolchain, not tested via Genode's suite) | Genode-built cross toolchain, not a distro package | Root cause of 3 closed Genode issues: GCC 12 `ld.lib.so` break ([#4867](https://github.com/genodelabs/genode/issues/4867)), GCC 14 page fault ([#5576](https://github.com/genodelabs/genode/issues/5576)), `-shared` spec-string bug ([#5691](https://github.com/genodelabs/genode/issues/5691)) |
| **QEMU** (test-dependency, critical) | Sole tested riscv64 execution target (`qemu-system-riscv64`) | n/a | this is the test harness itself, no board hardware target exists in-tree | n/a | Genode's 2021 rework specifically replaced Spike/BBL with QEMU's `virt` platform ([issue #4012](https://github.com/genodelabs/genode/issues/4012)) |
| **OpenSBI** (runtime-dependency, critical) | Supervisor Binary Interface provider at boot | Genode's SBI shim (`sbi.h`) implements only `SET_TIMER` and `PUT_CHAR` of the full SBI call set | n/a | n/a | Partial integration, not full SBI coverage; adopted alongside the QEMU rework ([issue #4012](https://github.com/genodelabs/genode/issues/4012)) |
| OpenSSL 1.1.1w | crypto (TLS) | found, riscv64 (Ubuntu resolute `libssl-dev` 3.5.5-1ubuntu3) | upstream riscv64 CI exists but flaky | released widely | Genode's pinned 1.1.1w is EOL upstream, independent of riscv64; upstream has open flaky-CI and perf/asm issues ([#28118](https://github.com/openssl/openssl/issues/28118), [#30880](https://github.com/openssl/openssl/issues/30880)) |
| zlib 1.3.2 | compression | found, riscv64 | no riscv-specific failures found | released | none riscv64-specific found |
| bzip2 1.0.6 | compression | found, riscv64 (distro-packaged) | tracker on sourceware.org, not searchable via GitHub | released | none found (tracker not on GitHub) |
| lz4 1.8.0 | compression | found, riscv64 | - | released | [#1635](https://github.com/lz4/lz4/issues/1635) RISC-V optimization proposal (closed) |
| xz / liblzma 5.2.3 | compression | found, riscv64 | - | released | [#146](https://github.com/tukaani-project/xz/issues/146) RISC-V unaligned-access flag (closed) |
| libarchive 3.3.2 | compression/archive | found, riscv64 | no riscv-specific issues | released | none found |
| **GMP** 6.1.2 | numerics (bignum) | Ubuntu riscv64 build is fine, but **Genode's own port** (`repos/libports/ports/gmp.port`) ships tuned `gmp-mparam.h` headers only for x86_32/x86_64/arm/arm_64, not riscv64 - falls back to generic, unoptimized C | n/a | n/a | Genode-side packaging gap, independent of upstream GMP |
| Mesa 24.0.8 | software 3D (llvmpipe) | Ubuntu builds it, riscv64 | - | released, software rendering only - no riscv64 GPU vendor driver exists | hosted on gitlab.freedesktop.org, not queryable via GitHub tooling |
| jpeg (IJG libjpeg v9d, not libjpeg-turbo) | image codec, non-SIMD in Genode's chosen fork | riscv64 SIMD status of libjpeg-turbo is not applicable since Genode uses plain IJG code | - | - | if Genode ever switches to libjpeg-turbo, relevant issues exist ([#620](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620), [#794](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/794)) |
| jitterentropy 3.4.1 | crypto (entropy/RNG) | found, riscv64 | neither of 2 total GitHub issues is riscv-specific | released | none found |
| curl 8.7.1 | networking | found, riscv64 | no riscv-specific issues | released | none found |
| libssh 0.8.4 | crypto (SSH) | hosted on gitlab.com, not searchable via GitHub tooling | - | released | untracked via GitHub |
| libgcrypt 1.8.2 | crypto | found, riscv64 | real tracker is dev.gnupg.org, not GitHub | released | none found via GitHub (real tracker not queried) |
| **libffi** 3.2.1 | FFI trampolines (used by language runtimes for native dispatch) | mixed - several **open** upstream riscv64 correctness bugs | riscv64 struct-passing tests known to fail | released, with known correctness gaps | [#466](https://github.com/libffi/libffi/issues/466) small ints not widened to ffi_arg on riscv64 (open); [#777](https://github.com/libffi/libffi/issues/777) static-link failure on riscv64 (open); [#694](https://github.com/libffi/libffi/issues/694) struct-by-value fails on aarch64 and riscv64 (open). 22 riscv-tagged issues total - the dependency with the most open, unresolved riscv64 correctness bugs in this table |
| libpng 1.6.55 | image codec | historically buggy RVV path, now mostly fixed | had real correctness bugs, now closed | released | [#769](https://github.com/pnggroup/libpng/issues/769) Paeth-filter RVV inaccuracy (closed/fixed); [#711](https://github.com/pnggroup/libpng/issues/711) crash on T-Head C920 (closed) |
| freetype 2.3.9 (Genode's fork is 16+ years old vs current 2.14.2) | font rendering | current upstream builds fine, riscv64 | GitHub mirror has 0 issues (real tracker on gitlab.freedesktop.org/Savannah) | released (current upstream) | Genode's pinned version is badly stale, independent of riscv64 |
| VirtualBox 6 | x86 hardware-virtualization hypervisor | **not found** - Ubuntu `virtualbox` package is amd64-only | n/a | **structurally cannot be released for riscv64** | architectural, not a bug - Intel VT-x/AMD-V dependent, x86 instruction emulation; the one dependency in this table that is fundamentally non-portable to RISC-V |
| Qt6 (qt6_base/qt6_declarative, QML's V4 engine is a JIT) | UI framework | Ubuntu builds/ships it, riscv64 | GitHub mirror `qt/qtdeclarative` returns 0 issues (real tracker is bugreports.qt.io) | released | untracked via GitHub tooling |

**Deep-dive - libffi:** the dependency with the clearest, currently-open riscv64 correctness risk in this table. Three open upstream bugs cover small-integer widening ABI mismatch, static-link failure, and struct-by-value passing - anything in Genode's dependency chain relying on libffi-based dynamic dispatch on riscv64 warrants direct testing before being relied on.

**Deep-dive - GMP:** not an upstream riscv64 problem (Ubuntu riscv64 GMP builds fine) but a Genode-specific packaging gap - Genode's own port lacks riscv64-tuned `gmp-mparam.h` parameters that exist for x86_32/x86_64/arm/arm_64, so any Genode component using GMP on riscv64 runs unoptimized generic-C bignum arithmetic.

**Deep-dive - VirtualBox 6:** structurally excluded from riscv64 by design (x86 hardware-virtualization dependency), not a porting gap. If any Genode riscv64 use case depends on VirtualBox-based virtualization, that capability is simply absent on this architecture and cannot be closed by porting effort.

Several dependencies (Mesa, libssh, libgcrypt's real tracker, freetype's real tracker, Qt6's real tracker) are hosted outside GitHub (GitLab, gnupg.org, Savannah, bugreports.qt.io), so GitHub issue search could not reach their actual bug trackers - a tooling gap in this research, not evidence of absence of issues.

*(Section 10, Ecosystem Status, is omitted: Genode is a systems framework with no dependent package ecosystem - its third-party dependencies are individually ported C/C++ libraries via Genode's own "ports" mechanism, covered in Section 9, not a broad package ecosystem like PyPI/npm/Maven that would need independent riscv64 enablement across many consumer packages.)*

## 11. Known Bugs and Active Issues

**Currently open RISC-V bugs: none found.** A search for `riscv` + `is:open` across all issue text in `genodelabs/genode` returned only one unrelated hit (#3509, explicitly x86-only).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#5691](https://github.com/genodelabs/genode/issues/5691) | gcc: support `-shared` link flag on arm_v8a/riscv | Closed | Correctness (toolchain) | GCC spec-string typo, cross-architecture |
| [#5607](https://github.com/genodelabs/genode/issues/5607) | riscv: ldso fails to resolve weak undefined symbols in stdcxx | Closed | Correctness | Architecture-specific ELF relocation-typing bug (RISC-V untyped weak symbols -> `R_RISCV_64` vs x86's `R_JUMP_SLOT`); root-caused to an upstream GCC symbol-typing discrepancy |
| [#5588](https://github.com/genodelabs/genode/issues/5588) | riscv: add support for backtrace | Closed | Feature gap | Missing `memset` prototype blocked compilation |
| [#5576](https://github.com/genodelabs/genode/issues/5576) | riscv: page fault in init on bootup with GCC 14 | Closed (fixed) | Correctness | Illegal READ at address 0x0 by `pager_object`, GCC-14-triggered |
| [#5431](https://github.com/genodelabs/genode/issues/5431) | arm_64, riscv: uint64_t/genode_uint64_t ambiguity | Closed | Build correctness | Cross-architecture type-ambiguity build error |
| [#4867](https://github.com/genodelabs/genode/issues/4867) | riscv: Fix ld.lib.so for GCC 12 | Closed | Correctness | GOT-relative call executes before self-relocation completes; NULL-pointer jump fault |
| [#4351](https://github.com/genodelabs/genode/issues/4351) | riscv: failed tests in depot_autopilot | Closed | Test infrastructure | riscv-specific autopilot failures tracked and disabled |
| [#4312](https://github.com/genodelabs/genode/issues/4312) | riscv_qemu: move to genode-riscv repository | Closed | Organizational | Board support demoted out of mainline into now-archived satellite repo |
| [#4042](https://github.com/genodelabs/genode/issues/4042) | riscv: Add interrupt controller support | Closed | Feature gap | PLIC support added |
| [#4012](https://github.com/genodelabs/genode/issues/4012) | riscv: Update to privileged spec v1.10 and replace Spike emulator | Closed | Major rework | Dropped Spike/BBL for QEMU |
| [#3230](https://github.com/genodelabs/genode/issues/3230) | hw riscv: do not interfere bbl machine calls and kernel syscalls | Closed | Correctness | Machine-mode/syscall ID conflation |
| [#3093](https://github.com/genodelabs/genode/issues/3093) | RISCV simulation on spike hangs | Closed | Correctness | Pre-QEMU-migration era |
| [#2481](https://github.com/genodelabs/genode/issues/2481) | riscv_spike: can't link hard-float modules with soft-float modules | Closed | Correctness | Linker ABI mismatch |
| [#2203](https://github.com/genodelabs/genode/issues/2203) | riscv: dynamically linked executables fail | Closed | Correctness | |
| [#2027](https://github.com/genodelabs/genode/issues/2027) | base-hw: RISC-V fix alignment error in core | Closed | Correctness | |

**Correctness bugs highlighted separately:** #4867 (GCC 12 GOT-relative call before self-relocation), #5607 (RISC-V-specific ELF weak-symbol relocation typing), #5576 (GCC 14 page fault at boot), and #2481 (hard-float/soft-float link mismatch) represent genuine architecture-specific correctness defects, not merely feature gaps. All are closed, but they form a recurring pattern: every recent major GCC upgrade (12, 14) has broken the RISC-V dynamic linker or boot path and required a dedicated fix.

No RISC-V-specific NaN/floating-point bug exists in the tracker (see Section 6).

## 12. Objections and Upstream Blockers

**Stated objections:** none found - no formal RFC/tiering process exists, and no maintainer statement objecting to riscv64 work was found.

**Technical blockers:**
- Missing `virt_qemu_riscv` board directory in the current mainline snapshot (Section 4/5) - `RAM_BASE`/`PLIC_BASE` constants are referenced but unresolved.
- No SMP/IPI support, explicitly stated as unsupported in source.
- Minimal SBI shim (2 of many calls implemented).
- Recurring GCC-upgrade fragility in the dynamic linker (three separate toolchain-upgrade breakages across 2023-2025).
- No public CI of any kind (structural, applies to the whole project, not riscv64-specific).

**Organizational blockers:**
- Single-vendor maintenance model: essentially all core RISC-V work is done by Genode Labs staff (Sebastian Sumpf in particular); resourcing and priority for the port are set by company decisions, not community consensus.
- RISC-V board support was demoted from mainline into a supplemental repository in 2021, and that repository is now archived along with the main repo's GitHub mirror (migration to Codeberg) - a pattern of infrastructure churn around the RISC-V port specifically.
- No RISE membership, funding, or engagement of any kind.

**Acceptance probability:** External contributions are accepted when submitted - the one external RISC-V PR ([#4533](https://github.com/genodelabs/genode/pull/4533)) was reviewed and landed within about two months. Friction for well-formed external patches to the existing riscv64 port appears low. The structural blockers (missing board directory, no CI, no SMP, minimal SBI coverage) are not maintainer-objection blockers but resourcing/backlog items that would need funded work (internal or external, e.g. RISE) to close, given the small, single-vendor maintainer pool.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none - no channel checked (GitHub Releases, PyPI, Ubuntu 26.04 resolute, Arch Linux RISC-V) publishes a riscv64 artifact for Genode, and Genode is not packaged by any distribution in any architecture.
- Genode is not an optimization-purpose project (it is a general-purpose OS/component framework, not a library whose stated value proposition is out-performing a simpler reference implementation), so the Step 2 optimization-coverage cap does not apply and no Optimization level is reported.
- **Justification:** No upstream CI of any kind exists in `genodelabs/genode` - confirmed by direct repository inspection (no `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`; zero YAML files repository-wide) and cross-verified via GitHub code search (`path:.github/workflows extension:yml` returns 0 results). No distribution ships a `genode` package for any architecture - [Ubuntu 26.04 resolute search](https://packages.ubuntu.com/search?keywords=genode&suite=resolute&searchon=names&section=all) returns no results, and no Arch Linux RISC-V package was found - so the distribution floor cannot upgrade the grade. This is the direct "no upstream CI, no distribution package" orange case from Step 1 of the color model. There is no evidence the riscv64 port is broken - it is an actively maintained, hand-written kernel/core/ldso/libc port with commits from 2015 through 2026, which rules out red - and there is substantial positive evidence (source code, commit history, closed-issue record) of a working, maintained port, which rules out grey/unknown.
- **Pending work that could change the grade:** only one external riscv64 PR has ever been filed ([#4533](https://github.com/genodelabs/genode/pull/4533), VirtIO drivers, landed in release 22.08); no open riscv64 issues or PRs were found. No RISE involvement, funding, or blog coverage exists for Genode in any RISE channel checked. Absent a deliberate investment - standing up public CI, publishing riscv64 binaries, or restoring the missing board-integration layer - nothing currently in flight would move this grade.

## 14. Investment Analysis

RISE has no existing involvement with Genode (Section 1, Section 12) - no RISE-funded work, RISE Runner usage, or blog coverage was found in any channel checked. All items below represent unclaimed work.

### 14.1 Functional Enablement
- Resolve the missing `virt_qemu_riscv` board directory in current mainline (`RAM_BASE`/`PLIC_BASE`/`PLIC_SIZE`/`RAM_SIZE` constants are referenced but unresolved) so a standard `make run/<scenario> KERNEL=hw BOARD=virt_qemu_riscv` build succeeds against the current tree without external out-of-tree files.
- Expand the SBI shim (`include/spec/riscv/sbi.h`) beyond the current 2-of-many implemented calls.
- Add riscv64-tuned GMP parameters to Genode's own `gmp.port` (currently falls back to unoptimized generic C).
- Evaluate and, if warranted, implement SMP/IPI support for riscv64 (currently explicitly unsupported).

### 14.2 Performance Optimization
- No performance data exists today (Section 6) - the first step is establishing a benchmark baseline for the existing soft-float LP64 riscv64 port before sizing any optimization work.
- Evaluate hardware-float (F/D extension) ABI as an alternative to the current soft-float-only configuration, given no quantified cost data currently exists to justify the tradeoff either way.
- RVV/vector extension use is entirely absent; whether it is worth investing in depends on target workloads not identified in this research.

### 14.3 CI/CD Infrastructure
- Stand up CI for the project generally (none exists for any architecture today) with a riscv64 QEMU-based job that runs the `depot_autopilot` suite publicly, closing the current visibility gap where riscv64 test results are only known internally to Genode Labs (Section 7).
- If pursued, this could be a natural point of engagement with RISE RISC-V Runners, given Genode currently has zero RISE relationship to build on.

### 14.4 Ecosystem Enablement
- Not applicable in the broad package-ecosystem sense (Section 10 omitted) - Genode has no dependent package ecosystem. The relevant enablement work is at the level of individual ported C/C++ dependencies (Section 9), most notably closing the open upstream libffi riscv64 correctness bugs if any Genode component depends on libffi-based dynamic dispatch, and validating riscv64 content of the prebuilt Genode toolchain tarballs [NEEDS VERIFICATION].

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Restore/complete `virt_qemu_riscv` board directory and memory-map constants in mainline | 2-4 | Genode Labs / external contributor | Critical |
| Functional | Expand SBI shim beyond timer/putchar | 1-2 | Genode Labs | High |
| Functional | Add riscv64-tuned GMP parameters | 1 | Genode Labs / external contributor | Medium |
| Functional | Evaluate/implement SMP support for riscv64 | 6-10 (data not available for a precise estimate; kernel-level scope) | Genode Labs | Medium |
| CI/CD | Stand up public CI (any kind) with a riscv64 QEMU job running depot_autopilot | 3-5 | Genode Labs / RISE (if engaged) | High |
| Performance | Establish riscv64 performance baseline (no data exists today) | 2-3 | Genode Labs / RISE (if engaged) | Medium |
| Performance | Evaluate hardware-float ABI tradeoff | 1-2 (evaluation only) | Genode Labs | Low |
| Dependencies | Validate/fix libffi riscv64 correctness bugs relevant to Genode's use | 1-2 | Genode Labs / upstream libffi | Medium |
| Distribution | Verify riscv64 content of published toolchain tarballs; publish riscv64 release artifacts | 1-2 | Genode Labs | Medium |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [genodelabs/genode (archived GitHub mirror)](https://github.com/genodelabs/genode)
- [genodelabs/genode (canonical, Codeberg)](https://codeberg.org/genodelabs/genode)
- [genodelabs/genode-riscv (archived board-support repo)](https://github.com/genodelabs/genode-riscv)
- [Genode homepage](https://genode.org/)
- [Genode: How Genode came to RISC-V](https://genode.org/documentation/articles/riscv)
- [genodians.org: Genode on RISC-V - an Update](https://genodians.org/ssumpf/2021-02-24-riscv)
- [Issue #1880: base-hw: add RISC-V support](https://github.com/genodelabs/genode/issues/1880)
- [Issue #2027: base-hw: RISC-V fix alignment error in core](https://github.com/genodelabs/genode/issues/2027)
- [Issue #2203: riscv: dynamically linked executables fail](https://github.com/genodelabs/genode/issues/2203)
- [Issue #2481: riscv_spike: can't link hard-float modules with soft-float modules](https://github.com/genodelabs/genode/issues/2481)
- [Issue #3093: RISCV simulation on spike hangs](https://github.com/genodelabs/genode/issues/3093)
- [Issue #3230: hw riscv: do not interfere bbl machine calls and kernel syscalls](https://github.com/genodelabs/genode/issues/3230)
- [Issue #3509](https://github.com/genodelabs/genode/issues/3509)
- [Issue #4012: riscv: Update to privileged spec v1.10 and replace Spike emulator](https://github.com/genodelabs/genode/issues/4012)
- [Issue #4021: riscv_qemu: autopilot adjustments](https://github.com/genodelabs/genode/issues/4021)
- [Issue #4042: riscv: Add interrupt controller support](https://github.com/genodelabs/genode/issues/4042)
- [Issue #4312: riscv_qemu: move to genode-riscv repository](https://github.com/genodelabs/genode/issues/4312)
- [Issue #4351: riscv: failed tests in depot_autopilot](https://github.com/genodelabs/genode/issues/4351)
- [Issue #4867: riscv: Fix ld.lib.so for GCC 12](https://github.com/genodelabs/genode/issues/4867)
- [Issue #4879: arm_v8a: strange floating-point errors with GCC-12](https://github.com/genodelabs/genode/issues/4879)
- [Issue #5431: arm_64, riscv: resolve ambiguity between libc's uint64_t and genode_uint64_t](https://github.com/genodelabs/genode/issues/5431)
- [Issue #5576: riscv: page fault in init on bootup with GCC 14](https://github.com/genodelabs/genode/issues/5576)
- [Issue #5588: riscv: add support for backtrace](https://github.com/genodelabs/genode/issues/5588)
- [Issue #5607: riscv: ldso fails to resolve weak undefined symbols in stdcxx](https://github.com/genodelabs/genode/issues/5607)
- [Issue #5691: gcc: support -shared link flag on arm_v8a/riscv](https://github.com/genodelabs/genode/issues/5691)
- [PR #4533: Allow Genode VirtIO drivers to be used on RISC-V](https://github.com/genodelabs/genode/pull/4533)
- [Commit 8cddd86: riscv: tool chain (first RISC-V commit)](https://github.com/genodelabs/genode/commit/8cddd86a4c60f92ab94b2c6aca5fb8f7be482f6b)
- [Commit 9d417ee: os: Allow VirtIO drivers to be built for RISC-V](https://github.com/genodelabs/genode/commit/9d417ee2f5ecc3f3dfa2eff41e1029e4f611a4c7)
- [Commit c3cf7f3: ISA spec v1.9.1 with GCC 6.3.0 port](https://github.com/genodelabs/genode/commit/c3cf7f3c3ab61182bf9edac8caf6a26b9eedae9d)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project: LLVM SPEC Optimization (RP009)](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Project: IREE Compilation and Object Detection Pipeline for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [RISE Project: A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [Ubuntu package search: genode, suite resolute](https://packages.ubuntu.com/search?keywords=genode&suite=resolute&searchon=names&section=all)
- [PyPI: genode (404, package does not exist)](https://pypi.org/pypi/genode/json)
- [Arch Linux RISC-V unofficial repository](https://archriscv.felixc.at/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Genode mailing list: performance benchmark thread](https://lists.genode.org/mailman3/hyperkitty/list/users@lists.genode.org/thread/EQ4WPNA4OJ5IECIJKANYFVIDDWQULY7U/)
- [Genode mailing list: Roadmap 2026](https://lists.genode.org/mailman3/hyperkitty/list/users@lists.genode.org/message/MBXMD3C4XW3XBD45YOPOKEAHNF3TSHZU/)
- [OpenSSL issue #28118: RISC-V extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #30880: flaky riscv64 CI test](https://github.com/openssl/openssl/issues/30880)
- [lz4 issue #1635: RISC-V arch optimization proposal](https://github.com/lz4/lz4/issues/1635)
- [xz issue #146: RISC-V unaligned-access flag request](https://github.com/tukaani-project/xz/issues/146)
- [libffi issue #466: small ints not widened to ffi_arg on riscv64](https://github.com/libffi/libffi/issues/466)
- [libffi issue #777: linking libffi.a on riscv64 fails](https://github.com/libffi/libffi/issues/777)
- [libffi issue #694: struct_by_value_big fails on aarch64 and riscv64](https://github.com/libffi/libffi/issues/694)
- [libpng issue #769: Paeth filter RVV implementation inaccurate](https://github.com/pnggroup/libpng/issues/769)
- [libpng issue #711: crashes on T-Head C920 core](https://github.com/pnggroup/libpng/issues/711)
- [libjpeg-turbo issue #620: RISC-V vector support](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620)