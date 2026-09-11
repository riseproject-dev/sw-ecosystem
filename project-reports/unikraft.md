---
title: Unikraft
parent: Project Reports
color: orange
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: critical
  - name: Newlib
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
---

# Unikraft

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Unikraft<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="unikraft" %}

## 1. Project Overview

Unikraft is a unikernel build framework/toolkit: applications are compiled together with a minimal, configurable kernel into a single-purpose, single-address-space image, rather than run atop a general-purpose OS. It uses a Makefile + Kconfig build system (no CMake, no `docs/` directory, no `BUILDING.md`/`INSTALL` exists in the repository). Unikraft is a sub-project of the **Xen Project**, itself a Linux Foundation Collaborative Project; Xen's governance page lists Unikraft (alongside MirageOS) as a "specialized systems" sub-project operating under Xen's formation -> incubation -> maturation -> archival lifecycle, with local technical decision-making. **Unikraft GmbH** holds the Unikraft name/logo/mascot trademarks and also operates KraftCloud, a commercial unikernel-hosting platform, functioning as the project's de facto commercial steward alongside the Linux Foundation/Xen umbrella. Code is BSD-3-Clause; documentation is CC BY-NC 4.0. No standalone `MAINTAINERS`/`GOVERNANCE.md`/`CODEOWNERS` exists in the repo, and the linked "review process" governance sub-pages on unikraft.org return 404.

By commit volume (`git shortlog`), the dominant contributors are Unikraft GmbH staff (Michalis Pappas, Sergiu Moga, Andrei Tatar, Marco Schlumpp), Simon Kuenzer (Unikraft GmbH / **NEC Laboratories Europe**, project co-founder), Marc Rittinghaus (**Karlsruhe Institute of Technology (KIT)** / Unikraft GmbH), Alexander Jung (**Lancaster University**), Jia He (**Arm**), Sharan Santhanam (NEC Laboratories Europe), and Oleksii Moisieiev (**EPAM Systems**). `ADOPTERS.md` lists EPAM Systems, KIT, Lancaster University, NEC Laboratories Europe, University of Manchester, University of Liege, and University POLITEHNICA of Bucharest - predominantly research/academic adopters, with no hyperscaler listed.

No formal tier system or written RISC-V acceptance policy exists. The evidence is consistent with a **stated-but-unstaffed intent**: the repo's own `README.md` names RISC-V as a roadmap item ("With support for multiple hardware architectures including x86, ARM, and soon [RISC-V](https://riscv.org/)"), but no contributor or sponsoring organization (Unikraft GmbH, NEC, KIT, Arm, EPAM) has completed the actual port, and Unikraft has no funded channel into RISC-V engineering - it is not a RISE member. There is no evidence of community resistance to a RISC-V port; the gap is prioritization and review follow-through, not objection.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-09-15 | Issue #60 "RISC-V Support" opened (umbrella tracking issue), assignees michpappas/eduardvintila | [unikraft/unikraft#60](https://github.com/unikraft/unikraft/issues/60) |
| 2022-05-12 | PR #461 "Introduce initial riscv64 support" opened by eduardvintila (Unikraft member) | [unikraft/unikraft#461](https://github.com/unikraft/unikraft/pull/461) |
| 2023-03-16 | PR #804 "plat/pci_ecam: Fix FDT interrupt node lacking address-cells" opened by eduardvintila | [unikraft/unikraft#804](https://github.com/unikraft/unikraft/pull/804) |
| 2023-03-16 | PR #461 commit history rewritten, adapted to v0.12 and to `lib-musl` | [unikraft/unikraft#461](https://github.com/unikraft/unikraft/pull/461) |
| 2023-03-17 | Automated checkpatch report on PR #461 (style warnings only) | [unikraft/unikraft#461](https://github.com/unikraft/unikraft/pull/461) |
| 2023-04-21 | CONFIG-option errata implemented in PR #804 | [unikraft/unikraft#804](https://github.com/unikraft/unikraft/pull/804) |
| 2023-05-02 | Design consensus reached in #804: move `#address-cells` errata into a shared `ofw` helper (never implemented) | [unikraft/unikraft#804](https://github.com/unikraft/unikraft/pull/804) |
| 2024-04-29 / 2024-05-13 | michpappas asks to revive #804 for v0.17; eduardvintila retargets to v0.18 | [unikraft/unikraft#804](https://github.com/unikraft/unikraft/pull/804) |
| 2024-06-26 | Commit `70c4f47` - trivial doc-link fix, "Fix RISC-V url in the Features section" | [commit 70c4f47](https://github.com/unikraft/unikraft/commit/70c4f473240f9eefa4c52429890d97df79e89c19) |
| 2025-08-28 | PR #1698 "Port initial riscv64 support to latest staging branch" opened by zzSunil (external, NONE association) | [unikraft/unikraft#1698](https://github.com/unikraft/unikraft/pull/1698) |
| 2026-02-01 / 2026-02-11 | Mainline SMP/per-CPU refactor commits mention RISC-V in passing only, explicitly leave RISC-V bring-up out of scope | [commit 61a227c](https://github.com/unikraft/unikraft/commit/61a227cbd1ad03c12791a282d436e763ef14a6f3), [commit 1a8976f](https://github.com/unikraft/unikraft/commit/1a8976fa4fa0c7575b6c5642a2513dd3c1d58ae2) |
| 2026-05-08 | PR #1698 closed | [unikraft/unikraft#1698](https://github.com/unikraft/unikraft/pull/1698) |
| 2026-06-15 | PR #1698 reopened by zzSunil after rework to match architecture refactoring | [unikraft/unikraft#1698](https://github.com/unikraft/unikraft/pull/1698) |
| 2026-09-11 (research date) | #60, #461, #804, #1698 all still open; zero riscv64 code merged to mainline | see Section 7 |

**Key contributors:** eduardvintila (Unikraft member) implemented #461 and #804 and repeatedly acknowledged/implemented requested review changes. michpappas (Unikraft GmbH) drove design review on #804 and is assigned on #60 and #586, but the agreed `ofw`-helper refactor was never delivered. skuenzer (Unikraft GmbH/NEC) was a named reviewer on #461 whose review was never completed. zzSunil (external, NONE association) is the sole active contributor since August 2025, rebasing the port roughly once a year.

**Is it fully upstream?** No. Zero riscv64-related PRs have merged into `unikraft/unikraft` as of the research date; all three (#461, #804, #1698) remain open, confirmed directly against the GitHub PR pages (`merged_at: null` for all three).

## 3. Upstream Support Tier

No formal tier policy or RFC document was found publicly for Unikraft (the linked "review process" pages 404). Tier is assessed here from direct evidence:

| Aspect | x86_64 | arm64 | riscv64 |
|---|---|---|---|
| Merged in mainline/`staging` | Yes | Yes | **No** - `arch/` contains only `arm`, `arm64`, `x86`, `x86_64` |
| CI build | Yes | Yes | No riscv64 job in any of 9 workflow files |
| CI test execution | Yes (`libc-test`, `self-test`, `helloworld`, all `qemu`) | Partial (`helloworld` job only, `qemu`) | No |
| CI release-blocking | Yes (qemu/xen/fc matrix) | Yes (qemu, helloworld only) | Not applicable - no job exists |
| Official release artifact | Source-archive only per release (no per-arch prebuilt binaries for any arch - Unikraft is source-built per application) | Same | Same, and no riscv64 arch code exists to build regardless |

Evidence base: direct reading of all 9 GitHub Actions workflow files at `staging` HEAD `ee652d8d94121e0099131c6a5b1d32c258ef781c` ([integration.yaml](https://github.com/unikraft/unikraft/blob/staging/.github/workflows/integration.yaml) and 8 others), and direct inspection of `arch/` and `arch/Arch.uk` in the same clone.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Unikraft's core is architecture-specific by construction (per-arch boot, trap handling, paging, atomics). All riscv64-specific code exists **only in the unmerged PR #461/#1698 branches**, not in mainline. A dedicated completeness review of the PR #461 branch found this is a genuine, hand-written architecture port (42 files, 4,765 lines), not a stub - confirmed by PR #1698's independent rebase remaining the same order of magnitude (61 files, 4,664 lines).

| Component | riscv64 status (unmerged PR) | Detail |
|---|---|---|
| Boot/entry (`entry64.S`, `setup.c`) | Full | Hand-tuned assembly entry + real DTB-driven memory-region/heap bring-up |
| Trap/exception dispatch (`traps.c`, `exceptions.S`) | Full | Real `scause`-based dispatch (PLIC ext interrupts, timer interrupts, page faults, unknown-exception crash path) |
| Interrupt controller (PLIC + CLINT/ACLINT) | Full | Real PLIC claim/complete and CLINT timer wiring |
| Timer | Full | SBI-based timer calls implemented |
| Context switch / TLS (`ctx.S`, `ctx.c`, `tls.c`) | Full | Complete register save/restore and TLS; one TODO on ectx (FPU) alignment |
| Atomics | Full | Native RISC-V `lr/sc`/AMO-based, hand-tuned (not a generic fallback) |
| Paging/MMU (Sv39) | Partial | Boots and identity-maps correctly; no demand paging, no dynamic VMA/mmap - static pre-mapped heap only, by the authors' own TODO |
| PCI/MMIO discovery (DTB-based) | Partial | Functional enumeration via `pci-host-ecam-generic`, but device-id/host-bridge heuristics are TODO; needs companion fix PR #804 for QEMU DTB errata |
| SMP / multicore | Missing | No secondary-CPU boot path; explicitly excluded via `!HAVE_SMP` requirement in `plat/kvm/Config.uk`, and an open checklist item on tracking issue #60 |
| Syscall shim / binary-compat under KVM | Missing | Syscall number table exists (302-line groundwork file) but `PLAT_KVM` Kconfig forbids `HAVE_SYSCALL` combined with `ARCH_RISCV_64` |
| CI / build verification | Missing | Zero riscv64 references in any upstream workflow file |
| Mainline merge | Missing | Zero riscv64 files anywhere in `staging`/mainline |

ISA/platform specifics from the port: RISCV64GC ISA, S-mode boot via an SBI implementation, Sv39 paging (3-level page tables), direct-map region starting at 256GiB, first 2GiB identity-mapped for MMIO, Goldfish RTC clock driver, VirtIO over MMIO, cross-compiled with the standard `riscv64-linux-gnu-` toolchain (`-mabi=lp64d -march=rv64gc -mcmodel=medany`). The port targets **KVM/QEMU `virt` only** - no Xen hypervisor support (notable given Unikraft's Xen Project lineage) and no hardware virtualization available on current RISC-V boards (QEMU-only testing per the PR). Twelve TODO/FIXME comments exist in the riscv64 tree, all narrowly scoped (ectx alignment, PCI device-id heuristics, address-space layout, crash-time register dump); one is identical to and copy-pasted from arm64's own `lcpu.c` in the same snapshot, i.e. a shared cross-architecture gap, not riscv-specific.

**Comparison of port scale** (same PR #461 snapshot): x86_64 = 59 files / 7,865 lines; arm64 = 81 files / 9,593 lines; riscv64 = 42 files / 4,765 lines (roughly 50-60% the size of the other two ports, consistent with a younger but real port).

## 5. Build System, Cross-Compilation, and Toolchain

Unikraft uses a **Makefile + Kconfig** build system (`make menuconfig`, `.config`, `CONFIG_*` symbols) - not CMake; org-wide code search for `CMakeLists.txt` or `path:cmake` containing "riscv" across all `unikraft/*` repos returned zero results. The repository has **no `docs/` directory, no `BUILDING.md`, no `INSTALL` file, and no `Dockerfile`** anywhere. `arch/Arch.uk` (the file selecting `CONFIG_UK_ARCH`) currently only branches on `CONFIG_ARCH_X86_64`, `CONFIG_ARCH_ARM_64`, and `CONFIG_ARCH_ARM_32` - no riscv64 branch exists in mainline.

**Toolchain (in the unmerged port):** standard `riscv64-linux-gnu-` GNU cross-compiler prefix, with flags `-mabi=lp64d -march=rv64gc -mcmodel=medany`. No minimum GCC/toolchain version is documented anywhere for it (the arch isn't wired into mainline `Config.uk`).

**QEMU usage:** PR #461 was tested with `qemu-system-riscv64`; PR #1698 was tested on QEMU 10.0.3. The companion CLI/orchestrator `unikraft/kraftkit` (Go) already has scaffolding recognizing `riscv64` ahead of kernel-source support: `ArchitectureRISCV64 = ArchitectureName("riscv64")`, `QemuSystemRiscv64 = "qemu-system-riscv64"`, and a QEMU invocation of `qemu-system-riscv64 -machine virt -cpu max` in `machine/qemu/v1alpha1.go` - this scaffolding is currently non-functional without the actual kernel-source arch port.

**Known build/runtime failure:** `gen_pci_irq_parse` fails to parse the PCI interrupt-parent DTB node when `#address-cells` is absent - true of QEMU's RISC-V `virt` DTB on QEMU <=7.1 (fixed upstream in QEMU 7.2+), and Unikraft's own errata-handling PR for it ([#804](https://github.com/unikraft/unikraft/pull/804)) remains unmerged 3+ years after a design fix was agreed.

**Only riscv64 Dockerfile in the org** is `unikraft/wayfinder`'s `examples/linux-riscv/Dockerfile`, which builds a **vanilla Linux kernel** (not Unikraft) for riscv64 using `gcc-riscv64-linux-gnu` (no pinned version) - unrelated to building a Unikraft image.

**Bottom line:** there is currently no way to build Unikraft itself for riscv64 from mainline - no `defconfig`, no arch `Makefile.uk`, no toolchain file, no documentation. A user must check out the PR #461 or PR #1698 branch directly and build from source.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86_64 | arm64 | riscv64 |
|---|---|---|---|
| SMP/multicore | Yes | Yes | **Missing** - explicitly Kconfig-gated out |
| Xen hypervisor platform | Yes | Data not available in findings for arm64/Xen specifically | **Missing** - KVM/QEMU only |
| Firecracker platform | Yes (CI matrix) | No (not in CI matrix) | **Missing** |
| Demand paging / dynamic VMA / mmap | Yes | Yes | **Missing** - static pre-mapped Sv39 heap only |
| Syscall shim / binary-compat under KVM | Data not available for x86_64/arm64 in these findings | Data not available | **Missing / not wired** - Kconfig explicitly forbids the combination |
| Hardware virtualization (KVM accel) | Yes | Yes | **Missing** - no hardware virtualization available on current RISC-V boards; QEMU software emulation only, per PR #461 |
| CI-tested | Yes | Yes (helloworld job) | **No** |
| Merged to mainline | Yes | Yes | **No** |

**Performance gaps:** Data not available - no published benchmark numbers exist for Unikraft on riscv64 of any kind. PR #461's description states that Redis, NGINX, SQLite, and Python run successfully on the port but explicitly includes "no performance numbers." General (non-RISC-V) Unikraft performance figures exist as context only (boot time "tens to hundreds of microseconds" guest-only on QEMU/Solo5, total VM boot ~3ms-40ms; memory footprint 2-6MB typical; Redis "30-80% faster than containers") but these are x86/ARM baselines, not RISC-V data - [Unikraft Performance docs](https://unikraft.org/docs/concepts/performance).

**Security hardening gaps:** Data not available: no research into riscv64-specific hardening (ASLR coverage, stack protector, equivalent of PAC/BTI) was performed or surfaced.

**NaN / floating-point semantics issues:** Searched specifically for a riscv64 NaN/floating-point bug in `unikraft/unikraft` - zero results. No such issue exists in the repository based on the research performed.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by reading the raw content of all 9 GitHub Actions workflow files (`actcheck.yaml`, `checkpatch.yaml`, `commit-format-check.yaml`, `integration.yaml`, `label.yaml`, `merge.yaml`, `pychecks.yaml`, `shellcheck.yaml`, `static-analysis.yaml`) at `staging` HEAD `ee652d8d94121e0099131c6a5b1d32c258ef781c` - zero occurrences of "riscv" anywhere. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

`integration.yaml` matrices, verbatim: `libc-test` job = `qemu`/`x86_64` only; `self-test` job = `qemu`/`x86_64` only; `helloworld` job = four entries, `qemu`/`x86_64`, `qemu`/`arm64`, `xen`/`x86_64`, `fc`/`x86_64`; `static-analysis` = elfloader build with no arch axis. Every job across all 9 files runs on `runs-on: ubuntu-latest` (standard GitHub-hosted x86_64 runners) - no self-hosted riscv64 runner, no RISE runner reference, no `linux/riscv64` container platform anywhere in the repo.

Triggers are active, not dormant: `push` (staging, stable branches), `pull_request` (to staging), `pull_request_target`, `workflow_dispatch`, `workflow_run`, and a daily cron for `static-analysis`.

**Even the actively-developed port does not add CI.** PR #1698's own branch (`.github/workflows/*.yaml`) was diffed against "riscv" - zero matches on that branch too, as of its last update (2026-06-15). The contributors actively working on the riscv64 port have not proposed a CI job for it in their own pending patch.

| Aspect | x86_64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job exists | Yes | Yes | No |
| CI test execution | Yes (libc-test, self-test, helloworld) | Partial (helloworld only) | No |
| Runner type | GitHub-hosted `ubuntu-latest` | GitHub-hosted `ubuntu-latest` | N/A - no job |
| RISE runner usage | No | No | No - not found anywhere in the org |

Source: [unikraft/unikraft/.github/workflows/](https://github.com/unikraft/unikraft/tree/staging/.github/workflows), [PR #1698](https://github.com/unikraft/unikraft/pull/1698).

## 8. Distribution and Release Status

**No official riscv64 binaries exist through any channel checked.**

- **GitHub Releases:** recent tags v0.21.0 "Ijiraq", v0.20.0 "Kiviuq", v0.19.1/v0.19.0 "Pan", v0.18.0 "Helene", v0.17.0 "Calypso", v0.16.x "Telesto". Each release consistently shows "Assets 2" (GitHub's auto-attached `Source code (zip)` + `Source code (tar.gz)` only - not per-arch prebuilt binaries). The releases' Atom-feed changelog text through v0.21.0 mentions only x86_64/arm64 work (e.g. "Adapt to PAL (arm64 & x86_64)", "plat/kvm/x86: Enable AVX512") with zero riscv/riscv64/RISC-V occurrences. [github.com/unikraft/unikraft/releases](https://github.com/unikraft/unikraft/releases)
- **PyPI:** [https://pypi.org/pypi/unikraft/json](https://pypi.org/pypi/unikraft/json) returns HTTP 404 - "unikraft" is not a PyPI package at all (expected: Unikraft is a C-based build system, not Python-distributed).
- **RISE wheel builder (GitLab):** redirects to the same 404'ing PyPI path - no wheels exist.
- **Ubuntu 26.04 "resolute":** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Unikraft&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" for any architecture.
- **Arch Linux RISC-V unofficial repo (archriscv.felixc.at):** package not listed.

**What a user must do to get a working binary:** there is no packaged path for riscv64 on any channel. Because Unikraft is fundamentally a source-build-per-application framework (true for every architecture, not just riscv64), the only route today is to check out the unmerged PR #461 or PR #1698 branch and build from source with the Makefile/Kconfig system and a `riscv64-linux-gnu-` cross toolchain, targeting KVM/QEMU only.

## 9. Dependencies

Unikraft's core repository has no `CMakeLists.txt`/`setup.py`/`go.mod`/`Cargo.toml`/`package.json` - dependencies are pulled in per-application as separate `unikraft/lib-<name>` "port" repositories (108 found via org search) through KraftKit/Kraftfile, not vendored in-repo.

**Overriding fact:** none of the dependencies below are exercised in Unikraft's own riscv64 CI, because no such CI exists (Section 7), and the core arch port itself is unmerged (Section 3). Every targeted `unikraft/lib-*` riscv64 issue search returned 0 results - no one has gotten far enough into the port to hit dependency-specific riscv64 bugs.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| **GCC** | build-dependency, critical | Used via the `riscv64-linux-gnu-` cross-compiler prefix (PR #461/#1698) and `gcc-riscv64-linux-gnu` in `unikraft/wayfinder`'s Dockerfile (unpinned version). Data not available: no direct research into GCC upstream's own riscv64 CI/test/release status was performed in this research set - [NEEDS VERIFICATION]. | Data not available | Data not available | Standard GNU toolchain package name used; no version pin found anywhere in the org. |
| **GNU binutils** | build-dependency, critical | Implied by the same `riscv64-linux-gnu-` toolchain prefix (assembler/linker). Data not available: no direct research into binutils' riscv64 status was performed - [NEEDS VERIFICATION]. | Data not available | Data not available | No dedicated findings. |
| **QEMU** | test-dependency, critical | Riscv64 system emulation (`qemu-system-riscv64`) is the test vehicle for the entire port, used across QEMU versions from <=7.1 through 10.0.3 per PR #461/#1698 testing notes. The DTB `#address-cells` bug (present in QEMU <=7.1, fixed upstream in QEMU 7.2+) confirms active upstream riscv64 QEMU development. | Used directly as the Unikraft port's test harness (PR #461, PR #1698 both QEMU-tested) | Data not available on QEMU's own release process beyond version numbers cited | Confirmed functional and actively maintained for riscv64 across the version range observed. |
| **musl** | runtime-dependency, critical | Companion port `unikraft/lib-musl` (issue #39 referenced in PR #461). Upstream musl has shipped a riscv64 port since 1.1.24 (2019). | Unikraft port: 0 riscv64 issues filed; untested in-tree, blocked on core arch support | No riscv64 release from the Unikraft port | Upstream musl is riscv64-mature. |
| **Newlib** | runtime-dependency, critical | Companion port `unikraft/lib-newlib` (issue #18 referenced in PR #461). Upstream newlib has long-standing riscv support (widely used for bare-metal RISC-V embedded toolchains). | Unikraft port: 0 riscv64 issues; untested | No riscv64 release from the port | Upstream is mature; port itself has zero riscv64 activity. |
| **OpenSBI** | runtime-dependency, critical | The riscv64 port's S-mode trap/timer/shutdown handling and boot are built on an SBI implementation (referred to generically as "SBI" throughout PR #461/#1698 - "runs in S-mode via an SBI implementation, supports S/VS-mode for virtualized instances"; "SBI timer calls implemented"). Data not available: no dedicated research into OpenSBI's own riscv64 CI/release status (inherently riscv64-only by design) or its specific version requirement was performed - [NEEDS VERIFICATION]. | Data not available | Data not available | Integration details with the Unikraft port beyond generic "SBI" usage are not documented in the sources gathered. |
| compiler-rt (`unikraft/lib-compiler-rt`, indirect) | Soft-float/builtin intrinsics runtime, critical on boards lacking hardware FP/mul-div | Upstream LLVM compiler-rt has years-established riscv32/64 support | Unikraft port: 0 riscv64 issues; untested | None | Port blocked on core arch. |
| OpenSSL (`unikraft/lib-openssl`, indirect) | TLS/crypto | Upstream: riscv64 actively used in CI (66 issues mention riscv64, incl. live CI failures e.g. #30880, musl/riscv extension-detection bug #28118) | Upstream riscv64 CI exists; Unikraft port untested | None from the port | Strong upstream riscv64 support; port itself inactive. |
| mbedTLS (`unikraft/lib-mbedtls`, indirect) | Lightweight TLS/crypto alternative | Upstream Mbed TLS supports riscv64 generically (portable C) | Unikraft port: 0 riscv64 issues; untested | None | Low architectural risk upstream. |
| zlib (`unikraft/lib-zlib`, indirect) | Compression | Upstream zlib is portable C, riscv64-clean, released widely | Unikraft port: 0 riscv64 issues; untested | None | Low architectural risk upstream. |
| mimalloc (`unikraft/lib-mimalloc`, indirect) | Memory allocator | Upstream microsoft/mimalloc has an open riscv64 issue [#939](https://github.com/microsoft/mimalloc/issues/939) "Unable to obtain aligned memory on RISC-V systems with an SV39 MMU" - a real, unresolved correctness gap | Unikraft port: 0 riscv64 issues; untested | Upstream released, with known riscv64 caveat | Concrete upstream correctness caveat (SV39 alignment). |
| TLSF (`unikraft/lib-tlsf`, mattconte/tlsf, indirect) | Real-time/general-purpose memory allocator | Upstream: 0 riscv64 issues (small, portable C, low activity - likely untested rather than broken) | Untested anywhere on riscv64 | Header/source-only, no arch-specific releases | Low activity upstream. |
| WAMR (`unikraft/lib-wamr`, indirect) | WASM JIT/AOT runtime - only JIT-class dependency in scope | Unikraft port: 0 riscv64 issues. Upstream `bytecodealliance/wasm-micro-runtime` could not be queried at all (hard permission error, distinct from "no results") | Unknown (query blocked) | Unknown (query blocked) | Flagged for retry - the one dependency with actual JIT-backend relevance and the least-understood riscv64 status. |
| lwIP (`unikraft/lib-lwip`, indirect) | TCP/IP network stack | Pure portable C, no arch-specific code paths | Unikraft port: 0 riscv64 issues; untested | No arch-specific releases | Architecturally low-risk. |
| libsodium (`unikraft/lib-libsodium`, indirect) | Crypto with optional SIMD-accelerated primitives | Upstream jedisct1/libsodium: 12 riscv64/cross-compile-adjacent issues, none blocking; falls back to portable reference implementation where no SIMD backend exists (true for riscv64) | Unikraft port: 0 riscv64 issues; untested | Upstream released, riscv64 builds exist in the wild (e.g. Debian/Ubuntu) | Generic-C fallback path should build cleanly. |

**Deep-dive, dependencies with JIT/SIMD/crypto/numerics relevance:**
- **WAMR (JIT/AOT):** the only JIT-class dependency in this list. Its upstream riscv64 maturity could not be determined in this research (query blocked with a hard permission error, not a "0 results" answer) - this is the single largest unresolved data gap in the dependency chain and should be re-checked with broader repo access before any investment decision assumes WAMR "just works" on riscv64.
- **mimalloc (numerics/MMU):** upstream issue #939 documents a concrete SV39-address-space assumption bug affecting alignment guarantees on RISC-V - this is a genuine correctness risk, not a hypothetical one, and is unresolved as of the last check.
- **OpenSSL / libsodium (crypto/SIMD):** both have riscv64-mature upstreams. OpenSSL runs riscv64 CI directly upstream; libsodium's SIMD-accelerated primitives fall back to portable reference C on riscv64 (no dedicated SIMD backend), which is the expected and low-risk path.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#60](https://github.com/unikraft/unikraft/issues/60) | RISC-V Support (tracking) | Open since 2020-09-15 | Tracking issue | Blocked on #586; checklist incomplete (SMP, post-rearchitecting cleanup, feature parity) |
| [#461](https://github.com/unikraft/unikraft/pull/461) | Introduce initial riscv64 support | Open since 2022-05-12 | Feature PR | Substantial hand-written port; stalled on maintainer review (skuenzer review never completed), 4+ years unmerged |
| [#804](https://github.com/unikraft/unikraft/pull/804) | plat/pci_ecam: Fix FDT interrupt node lacking address-cells | Open since 2023-03-16 | Blocks riscv64 PCI/MMIO path | Design consensus reached 2023-05-02 (move logic into shared `ofw` helper); refactor never implemented/merged |
| [#1698](https://github.com/unikraft/unikraft/pull/1698) | Port initial riscv64 support to latest staging branch | Open since 2025-08-28, reopened 2026-06-15 | Feature PR | External contributor (zzSunil) revival of #461; listed "In Progress" on the Unikraft Core Roadmap |
| [#586](https://github.com/unikraft/unikraft/issues/586) | Platform Rearchitecting | Open, priority/high, "In Progress" on roadmap | Root architectural blocker | Zero visible progress/comments despite #60 and #461's checklist depending on it |

**Correctness bugs, highlighted separately:** a specific search for a riscv64 NaN/floating-point bug in `unikraft/unikraft` returned zero results - no such issue exists based on this research. The only concrete correctness bug found anywhere in the riscv64 chain is at the dependency level, external to `unikraft/unikraft` itself: upstream mimalloc [#939](https://github.com/microsoft/mimalloc/issues/939) (SV39 MMU alignment issue, unresolved) - see Section 9. For context, `unikraft/unikraft` currently has 21 open `kind/bug` issues in total (e.g. #1882 pl011 console boot failure on ARM64, #1873 ARM64/Clang build error, #1616 IRQ-disable assumption, #1542 scheduler assertion failure, #823/#815 elfloader exec faults) - none of these are riscv64-specific.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No comment in any thread expresses opposition to a RISC-V port; the community's posture is closer to "nobody has finished the work yet" than resistance.

**Technical blockers:**
1. `gen_pci_irq_parse` DTB `#address-cells` parsing bug ([#804](https://github.com/unikraft/unikraft/pull/804)) - unresolved because the agreed refactor into a shared `ofw` helper (design consensus reached 2023-05-02) was never implemented, over 3 years later.
2. Root architectural blocker: issue [#586](https://github.com/unikraft/unikraft/issues/586) "Platform Rearchitecting" - the generic arch/platform code the riscv64 port should be restructured around has not itself been rearchitected; zero comments/progress despite being marked priority/high and "In Progress," and explicitly named as a dependency of #60 and a checklist item of #461.
3. No SMP/multicore support in the port - explicitly excluded via a `!HAVE_SMP` Kconfig requirement, and an open checklist item on #60.
4. No syscall-shim/binary-compat wiring under KVM for riscv64 - Kconfig explicitly forbids combining `HAVE_SYSCALL` with `ARCH_RISCV_64` under `PLAT_KVM`.
5. No hardware virtualization available on current RISC-V boards - QEMU software-emulation-only testing to date; no Xen hypervisor support for riscv64 despite Unikraft's Xen Project lineage.

**Organizational blockers:**
- Named reviewers (skuenzer, michpappas) never completed review of PR #461, despite the implementer (eduardvintila) repeatedly acknowledging and implementing requested changes.
- No dedicated riscv64 engineering headcount is visible: none of the primary corporate sponsors (Unikraft GmbH, NEC Laboratories Europe, KIT, Arm, EPAM Systems) show commits implementing riscv64 architecture code in the commit-volume data gathered.
- Unikraft is not a RISE member (RISE's Premier and General member lists, checked directly, do not include Unikraft) - no external funded channel is pushing the port forward, and no RISE blog post, wiki page, or runner-usage evidence mentions Unikraft.
- The active revival effort since 2025 is driven by an external, NONE-association contributor (zzSunil), not by a core maintainer or corporate sponsor.

**Acceptance probability:** design consensus already exists on the PR #804 approach, and PR #461/#1698 represent genuine, substantial (not stub) implementation work comparable in structure to the arm64/x86_64 ports at roughly half their line count. Technical acceptance risk is therefore low once the work is resourced; the actual blocker is prioritization and review bandwidth (the unresolved #586 dependency and the unfinished #804 refactor), not upstream resistance to RISC-V as an architecture.

## 13. Readiness Assessment

- **Color:** orange (base orange case: no upstream riscv64 CI, no distribution package of any kind, no release channel - `/project-color-coding` skill output)
- **Release provider:** none
- Unikraft is **not** an optimization-purpose project under the skill's Step 2 test (it is a full unikernel/OS build framework, not a library whose sole value proposition is accelerating an already-functional generic path - without `arch/riscv`, riscv64 does not run at all, so there is no generic fallback to be "optimized"). The Step 2 optimization-coverage cap therefore does not apply; Optimization level is omitted from the header per rule 7.
- **Justification:** No riscv64 references exist in any of the 9 GitHub Actions workflow files at `unikraft/unikraft` `staging` HEAD `ee652d8d94121e0099131c6a5b1d32c258ef781c` (confirmed by reading raw file content, not search) - see [integration.yaml](https://github.com/unikraft/unikraft/blob/staging/.github/workflows/integration.yaml). No riscv64 architecture code has ever merged to mainline; `arch/` contains only `arm`, `arm64`, `x86`, `x86_64`. The riscv64 port exists solely as long-open, unmerged PRs [#461](https://github.com/unikraft/unikraft/pull/461) (2022) and its 2025 rebase [#1698](https://github.com/unikraft/unikraft/pull/1698), both gated behind umbrella tracking issue [#60](https://github.com/unikraft/unikraft/issues/60) (open since 2020) and blocking dependency [#586](https://github.com/unikraft/unikraft/issues/586). No official riscv64 release exists on GitHub Releases, PyPI, Ubuntu 26.04, or Arch riscv64 (Section 8). The distribution floor described by the color model does not raise this above orange, because Unikraft is not distributed as an OS package at all on any architecture - there is no unpatched or patched distro build to fall back on.
- **Pending work that could change the grade:** merging PR #1698 (or a successor) to mainline, contingent on completing the agreed `ofw`-helper refactor from PR #804 and resolving or bypassing the #586 platform-rearchitecting dependency, would move Unikraft from orange toward yellow or blue depending on whether CI is added alongside the merge (Section 7 shows the active port PR still adds no CI of its own). No RISE involvement currently exists to accelerate this.

## 14. Investment Analysis

### 14.1 Functional Enablement

RISE has no involvement in Unikraft (Section 12) - no funded work to net out. Substantial functional work already exists but is unmerged: PR #461 (4,765 lines, 42 files) and its PR #1698 rebase (4,664 lines, 61 files) already implement boot/entry, trap/exception dispatch, PLIC/CLINT interrupt handling, SBI-based timers, context switch/TLS, and native atomics, all rated "Full" in the Section 4 completeness review. Remaining functional gaps: merging the existing port (completing the agreed `#804` `ofw`-helper refactor and resolving the `#586` dependency), adding SMP/multicore support (currently Kconfig-excluded entirely), wiring syscall-shim/binary-compat under KVM, and implementing demand paging/dynamic VMA beyond the current static pre-mapped Sv39 heap.

### 14.2 Performance Optimization

No riscv64 performance data exists to optimize against (Section 6) - functional merge must land first before any optimization work is meaningful. Once merged, a baseline should be established using the same workloads already used for functional validation in PR #461 (Redis, NGINX, SQLite, Python).

### 14.3 CI/CD Infrastructure

Zero riscv64 CI exists anywhere, including on the actively-developed PR #1698 branch itself (Section 7). No riscv64 GitHub-hosted or self-hosted runner is referenced anywhere in the `unikraft` org, and no RISE runner engagement exists to draw on.

### 14.4 Ecosystem Enablement

Not scored as a separate ecosystem section (Unikraft has no dependent package ecosystem comparable to PyPI/npm/Maven - it is not itself distributed as a package on any channel, per Section 8). 108 `unikraft/lib-*` companion port repositories exist as build-time dependencies (Section 9); every one shows zero riscv64 issue activity because nobody has reached the point of exercising them on riscv64. Most upstream libraries behind these ports (musl, OpenSSL, zlib, mbedTLS, lwIP, libsodium, Newlib, compiler-rt) are already riscv64-mature upstream; the two exceptions are mimalloc (unresolved upstream SV39 alignment bug, #939) and WAMR (upstream riscv64 status could not be determined - query blocked).

### 14.5 Summary Table

Effort estimates below are engineering-judgment ranges scoped from the code and process gaps documented in this report; they are not sourced figures and should be treated as planning-order-of-magnitude, not committed estimates.

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Complete #804 `ofw`-helper refactor and land it | 2-3 | Unikraft core maintainers (michpappas/eduardvintila) | Critical |
| Functional | Resolve or bypass #586 platform-rearchitecting dependency for riscv64's sake | 2-5 (coordination-heavy, scope owned by #586) | Unikraft core maintainers (michpappas) | Critical |
| Functional | Rebase and merge PR #1698 to staging once the above land | 2-4 | eduardvintila / zzSunil / reviewers | Critical |
| Functional | Add SMP/multicore support | 8-12 | Unikraft core + riscv64 port owner | High |
| Functional | Wire syscall-shim/binary-compat under KVM for riscv64 | 3-5 | Unikraft core | Medium |
| Functional | Implement demand paging / dynamic VMA beyond static Sv39 heap | 4-6 | Unikraft core | Medium |
| CI/CD | Add riscv64 to `integration.yaml` (QEMU-based, matching the arm64 helloworld pattern) | 1-2 | Unikraft CI maintainers | High |
| Performance | Establish riscv64 baseline benchmarks (Redis/NGINX/SQLite/Python) post-merge | 2-3 | Unikraft core / port owner | Medium |
| Ecosystem | Dependency verification pass across lib-musl, lib-newlib, lib-openssl, etc. once core lands | 3-4 | Unikraft lib-* maintainers | Medium |
| Ecosystem | Track/contribute to upstream mimalloc #939 (SV39 alignment) | 1-2 (upstream-side, not Unikraft-side) | mimalloc upstream / interested adopter | Low-Medium |
| Data gap | Determine WAMR (`bytecodealliance/wasm-micro-runtime`) upstream riscv64 JIT/AOT status | 0.5-1 (research only) | Any contributor with broader GitHub API access | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [unikraft/unikraft#60 - "RISC-V Support" (tracking issue)](https://github.com/unikraft/unikraft/issues/60)
- [unikraft/unikraft#461 - "Introduce initial riscv64 support"](https://github.com/unikraft/unikraft/pull/461)
- [unikraft/unikraft#804 - "plat/pci_ecam: Fix FDT interrupt node lacking address-cells"](https://github.com/unikraft/unikraft/pull/804)
- [unikraft/unikraft#1698 - "Port initial riscv64 support to latest staging branch"](https://github.com/unikraft/unikraft/pull/1698)
- [unikraft/unikraft#586 - "Platform Rearchitecting"](https://github.com/unikraft/unikraft/issues/586)
- [Commit 70c4f47 - docs/README.md doc-link fix](https://github.com/unikraft/unikraft/commit/70c4f473240f9eefa4c52429890d97df79e89c19)
- [Commit 61a227c - SMP/CPU-PM rework](https://github.com/unikraft/unikraft/commit/61a227cbd1ad03c12791a282d436e763ef14a6f3)
- [Commit 1a8976f - per-CPU variables library](https://github.com/unikraft/unikraft/commit/1a8976fa4fa0c7575b6c5642a2513dd3c1d58ae2)
- [unikraft/unikraft/.github/workflows/ (all 9 workflow files, staging HEAD ee652d8d)](https://github.com/unikraft/unikraft/tree/staging/.github/workflows)
- [unikraft/unikraft releases](https://github.com/unikraft/unikraft/releases)
- [PyPI unikraft/json (404)](https://pypi.org/pypi/unikraft/json)
- [Ubuntu 26.04 "resolute" package search (no results)](https://packages.ubuntu.com/search?keywords=Unikraft&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V unofficial repository](https://archriscv.felixc.at/?q=unikraft)
- [Unikraft Performance documentation](https://unikraft.org/docs/concepts/performance)
- [eduardvintila/unikraft_riscv64 - personal fork used for RISC-V porting development](https://github.com/eduardvintila/unikraft_riscv64)
- [unikraft/wayfinder examples/linux-riscv/Dockerfile](https://github.com/unikraft/wayfinder)
- [riseproject.dev - RISE member list](https://riseproject.dev/)
- [riseproject.dev blog index](https://riseproject.dev/blog)
- [riscv-runners.riseproject.dev - RISE RISC-V Runners](https://riscv-runners.riseproject.dev/)
- [github.com/riseproject-dev - RISE GitHub organization](https://github.com/riseproject-dev)
- [Microsoft mimalloc#939 - "Unable to obtain aligned memory on RISC-V systems with an SV39 MMU"](https://github.com/microsoft/mimalloc/issues/939)
- [Exploring the Viability of Unikernels for ARM-powered Edge Computing (arXiv 2412.03030)](https://arxiv.org/pdf/2412.03030)
- Xen Project governance page (Unikraft sub-project lifecycle model) [NEEDS VERIFICATION - specific URL not captured in findings]
- `unikraft/unikraft` `ADOPTERS.md`, `README.md`, `CONTRIBUTING.md`, `arch/Config.uk`, `.github/labels/arch.yaml`, `.github/labels/plat.yaml` (local clone, HEAD `ee652d8d94121e0099131c6a5b1d32c258ef781c`)