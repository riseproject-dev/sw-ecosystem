---
title: seL4
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: dtc
    relation: build-dependency
    criticality: optional
  - name: Spike
    relation: test-dependency
    criticality: optional
---

# seL4

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for seL4<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="sel4" %}

## 1. Project Overview

seL4 is a formally verified microkernel: a freestanding C99 binary with no libc, custom `memcpy`/`memset`, and no runtime allocator, crypto, or compression by design. It is dual licensed, GPL-2.0-only for kernel-level code and 2-clause BSD for user-level code, with per-file SPDX tags and DCO sign-off required on contributions (same model as the Linux kernel).

Governance sits under the **seL4 Foundation** ("seL4 International"), a Swiss association operating as a Series of LF Projects, LLC (Linux Foundation umbrella); "seL4" is an LF Projects trademark. Two bodies govern the project: a Governing Board (outreach, funds, brand) and a Technical Steering Committee (TSC) that owns all technical direction per `CONTRIBUTING.md`. There is no `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file in `seL4/seL4`; the TSC substitutes for one. The current 13-seat TSC is concentrated in three organizations: **Proofcraft** (formal-methods consulting spin-off, chaired by Gerwin Klein), **Kry10** (commercial seL4 OS vendor), and **UNSW Sydney** (the kernel's academic origin), plus one NIO seat and two unaffiliated members.

The Foundation lists 22 member organizations including Apple, Autoware Foundation, ETH Zurich, DornerWorks Ltd, UNSW Sydney, Proofcraft, and RTX Corporation. `CONTRIBUTORS.md` shows the heaviest code contribution comes from Data61/CSIRO/NICTA (the original creators), followed by Proofcraft, Kry10, DornerWorks, Genode Labs, Antmicro, Hensoldt Cyber, TII (UAE), NIO, Codasip, Colias Group, Cap Gemini, and Brown University.

**Community stance on new ports:** explicitly open but gated. `sel4.systems/platforms.html` and the docsite state new-port contributions need "compelling arguments, discussion with the technical community (including through Request-for-Comments), as well as testing requirements and a maintenance/expertise commitment," or a contributor can contract an "Endorsed Service Provider" (e.g. DornerWorks, Proofcraft) to do a port commercially. `CONTRIBUTING.md` further requires that mainline contributions either be invisible to the `l4v` formal-proof toolchain (docs, comments, unverified platforms) or ship with matching proof updates, meaning a new *verified* platform is a materially higher bar than a new *unverified* one.

**seL4 is not a RISE member or ecosystem beneficiary.** Exhaustive checking (RISE blog, all 34 posts scanned; RISE member list; `riseproject-dev` GitHub org repo listing and code search; multiple web searches) found zero RISE coverage of, or funding for, seL4. Details in Section 12.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2015-2016 | Hesham Almatary begins an independent/academic RISC-V port; file headers in `src/arch/riscv/*.c` still carry "Copyright 2015, 2016 Hesham Almatary" | [Almatary's blog: "Porting seL4 to RISC-V - Status Report No.1"](https://github.com/heshamelmatary/seL4-riscv-mk) |
| 2018-02-22 | Commit `6af207a`, "RISC-V: Port FDT from riscv-pk (priv-1.10)", authored by Hesham Almatary | GitHub commit search, repo:seL4/seL4 |
| 2018-04-18 | Approximately 30 finishing/cleanup commits authored 2018-04-03/04 by Adrian Danis and Anna Lyons (Data61), committed 2018-04-18 | GitHub commit search, repo:seL4/seL4 |
| 2018-04-19 | Public announcement of the merged port; Data61's Trustworthy Systems group described it as an early prototype (64-bit only, no FPU, no multicore, Spike-only, unverified); CSIRO joined the RISC-V Foundation the same period | [Computerworld, "Data61 ports seL4 microkernel to RISC-V architecture"](https://github.com/heshamelmatary/seL4-riscv-mk) [NEEDS VERIFICATION - original article URL not captured, only referenced via research summary] |
| 2021-04-26 | PR #354, "gcc.make: Add support for `riscv64-elf-` toolchain", merged | [PR #354](https://github.com/seL4/seL4/pull/354) |
| 2022-02-01 | PR #759, "RISC-V: reserve memory for SBI in device tree", merged | [PR #759](https://github.com/seL4/seL4/pull/759) |
| 2024-01-04 | PR #1154, "CI: build and test kernel for RISCV64 with LLVM", merged | [PR #1154](https://github.com/seL4/seL4/pull/1154) |
| 2025-02-11 to 2025-04-02 | PR #1397, "Add support for SiFive Premier P550 platform", merged (merge commit `58f0e87`, merged by lsf37 into `master` on 2025-04-02); first release containing it is **14.0.0** | [PR #1397](https://github.com/seL4/seL4/pull/1397) |
| 2025-05-29 | PR #1469, "Minimal CHERI support" (spans Morello and CHERI-RISC-V RV32/RV64), still **open** | [PR #1469](https://github.com/seL4/seL4/pull/1469) |
| 2025-10-24 | PR #1532, "Add SBI cap (RFC-22)", merged | [PR #1532](https://github.com/seL4/seL4/pull/1532) |
| 2025-10-28 | PR #1535, "Add support for the Banana Pi BPI-F3" (SpacemiT K1, RV64GCVB), merged | [PR #1535](https://github.com/seL4/seL4/pull/1535) |
| 2026-03-05 | PR #1603, "RISC-V: Implement hardware-assisted safe user memory access", **closed, not merged** - rejected by maintainer Indanz on process/trust grounds, not technical review | [PR #1603](https://github.com/seL4/seL4/pull/1603) |

**Key contributors by organization:** Hesham Almatary (original prototype author, independent/academic), Adrian Danis and Anna Lyons (Data61, mainline merge), Kent McLeod (Kry10, e.g. issue #604), Ivan Velickovic (UNSW, e.g. issue #1442), Gerwin Klein (Proofcraft, e.g. commit `ddfd667878`), Indan Zupancic (maintainer, RISC-V PR review).

**Fully upstream:** yes. The port merged into `seL4/seL4` master in April 2018 and has been continuously maintained since; the repo's commit search matched 393 commits touching `riscv/` paths on the default branch, with recent activity through mid-2026.

## 3. Upstream Support Tier

seL4 defines four formal verification tiers (`CAVEATS.md`, [docs.sel4.systems Verified Configurations](https://docs.sel4.systems/projects/sel4/verified-configurations.html)): **Unverified** (not scheduled), **Ongoing**, **FC** (functional-correctness proofs complete), and **Verified** (functional correctness + integrity + information-flow/non-interference proofs complete).

Only **HiFive Unleashed** (64-bit RISC-V, no FPU, no fastpath), plus its MCS-configuration variant, sits in the fully **Verified** tier among RISC-V boards. `CAVEATS.md` states proof support for additional RISC-V platforms "is on the roadmap and expected in 2026." Other supported-but-not-fully-verified RISC-V platforms: Ariane/CVA6, Banana Pi BPI-F3 (SpacemiT K1), Cheshire, HiFive Premier P550, Microchip PolarFire Icicle, Pine64 Star64 (StarFive JH7110), Rocketchip, plus the QEMU virt and Spike simulators.

**CI evidence:** `.github/workflows/compilation-checks.yml` cross-compiles the standalone kernel for RISCV64 (alongside ARM, ARM_HYP, AARCH64, X64) on every push to master and every pull request, via the external `seL4/ci-actions` action. `.github/workflows/proof.yml` runs formal CRefine (and, for the base RISCV64 config, SimplExportAndRefine) proofs against RISCV64 and RISCV64+MCS, but only when the `proof-test` label is present on the PR - i.e. label-gated, not automatic. No workflow in `seL4/seL4` boots and runs the sel4test functional test suite under QEMU riscv64; that execution path exists only in the external `seL4/ci-actions/sel4test-sim` Dockerfile and is not wired into `seL4/seL4`'s own CI as a scheduled or PR-required job.

**Release evidence:** seL4 GitHub releases (16.0.0, 15.0.0, 14.0.0) ship source tarballs and a manual PDF only - no compiled binaries for **any** architecture, not just riscv64.

| Axis | amd64 (X64) | arm64 (AARCH64) | riscv64 (RISCV64) |
|---|---|---|---|
| In compilation-checks.yml matrix | yes | yes | yes |
| In proof.yml matrix (label-gated) | yes (CRefine) | yes (CRefine) | yes, twice: base (CRefine + SimplExportAndRefine) and MCS (CRefine) |
| RISCV64-only CI jobs | n/a | n/a | `preprocess-mcs`/`deploy-mcs` in `preprocess-deploy.yml` exist only for RISCV64 |
| LLVM compiler in CI matrix | included | included | nominally included in the matrix, but `seL4/ci-actions/standalone-kernel/README.md` states "llvm RISCV64 compilation is not currently supported" - contradicts PR #1154's title ("CI: build and test kernel for RISCV64 with LLVM", merged) |
| Fully-Verified-tier hardware platform | Data not available: no amd64 verified-platform detail was gathered in this research | Data not available: no arm64 verified-platform detail was gathered in this research | HiFive Unleashed (+ MCS variant) only |
| Upstream binary release | none (source-only for all arches) | none | none |

## 4. Technical Architecture and RISC-V-Specific Subsystems

seL4 has **no JIT** anywhere (not applicable to a microkernel; a repo-wide grep for `jit` returned nothing) and **no SIMD/RISC-V-Vector (RVV) code**: GitHub code search for `vfloat32m1_t` and `rvv` in repo:seL4/seL4 both returned zero hits, and a repo-wide grep for `vfloat|vint|__riscv_v|rvv|zba|zbb|zicsr|vector extension` found exactly one incidental match (`zicsr` inside an OpenSBI ISA string, not kernel code).

**ISA extensions actually compiled against** (from `CMakeLists.txt`): `rv{32,64}i` + `m` + `a` (always) + `f`/`fd` (config-gated on `KernelRiscvExtF`/`KernelRiscvExtD`) + `c` (always) + `_zicsr_zifencei` (auto-appended for GCC >=11.3/binutils >=2.38). That is: I, M, A, F/D, C, Zicsr, Zifencei. No V (vector), no B (bitmanip/Zba/Zbb), no K (crypto).

**Architecture-specific code inventory:**

| Area | File(s) | Lines | Status |
|---|---|---|---|
| Boot entry | `src/arch/riscv/head.S` | 63 | Complete |
| Trap entry/dispatch | `src/arch/riscv/traps.S`, `c_traps.c` | 147 + 215 | Complete, but assumes all traps originate in user mode (see issue #1374) |
| Idle thread | `idle.S`, `idle.c` | 14 + 24 | Complete |
| Boot sequence | `kernel/boot.c` | 499 | Complete |
| Paging (Sv32/Sv39/Sv48) | `kernel/vspace.c` | 1242 | Complete for Sv32/Sv39; **Sv48 is stubbed** - `arch/64/mode/object/structures.bf` hardcodes `PT_LEVELS == 3` and errors (`#error "Only PT_LEVELS == 3 is currently supported on RISCV64"`) despite `KernelPTLevels` nominally allowing 4 |
| Timer/console/CSR access | `machine/hardware.c` | 276 | Complete |
| FPU (scalar F/D only) | `include/arch/riscv/arch/machine/fpu.h` | 182 | Complete for scalar float; no SIMD/vector registers touched |
| SBI wrappers, IPI | `arch/sbi.h`, `smp/ipi.c` | 157 + 75 | Complete, "lazy... until SBI is finalized" per in-code comment |
| PLIC interrupt controller | `arch/machine/plic.h`, `object/interrupt.c` | 111 + 89 | Interface complete, but `plic_init_controller` has a known bug (issue #1482) |
| Fastpath IPC | `arch/fastpath/fastpath.h` | 180 | Functional but flagged for possible optimization (issue #345) and a fastpath/slowpath LR/SC inconsistency (issue #604) |
| clz/ctz | build config | - | Falls back to library implementations pending B-extension (bitmanip) hardware support |

**Platform overlays** (`src/plat/`): `spike`, `hifive`, `ariane`, `cheshire`, `polarfire`, `rocketchip` (+ `rocketchip-zcu102`), `eswin` (hifive-p550), `star64`, `spacemit-k1` (bananapi-f3), `qemu-riscv-virt` (+ 32-bit variant) - each is a `config.cmake` plus device-tree overlay, no arch code of its own.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | Data not available (not applicable to a microkernel on any architecture) | Data not available | Not applicable - no JIT anywhere in seL4 |
| SIMD/vector | Data not available | Data not available | None (no RVV usage found) |
| Crypto | Data not available | Data not available | None (no K-extension usage found) |
| Multi-level paging | Data not available: no amd64-specific paging-depth detail gathered | Data not available: no arm64-specific paging-depth detail gathered | Sv32/Sv39 complete; **Sv48 stubbed/unsupported** |
| Hypervisor extension | Data not available | ARM_HYP exists as a distinct kernel arch in the CI matrix, implying dedicated hypervisor support | RISC-V H-extension **not mainlined**; used only experimentally in the P550 platform port (issue #812 open: "Clean up RISC-V H-Extension branches") |
| Safe kernel-mode fault recovery | Data not available | ARM64's `traps.S` calls `kernelDataAbort()` for kernel-mode traps (cited directly in issue #1374 as the model RISC-V lacks) | Missing - kernel-mode traps are mishandled as if user-mode (issue #1374); a fix attempt (PR #1603) was rejected on non-technical grounds |

## 5. Build System, Cross-Compilation, and Toolchain

**Standard project build** (via `seL4_tools/cmake-tool/init-build.sh`):
```sh
mkdir build && cd build
../init-build.sh -DPLATFORM=qemu-riscv-virt -DRISCV64=TRUE -DSIMULATION=TRUE
ninja
./simulate
```

**Standalone kernel-only build** (used by CI, `ci-actions/standalone-kernel/compile_kernel.sh`):
```sh
cmake -G Ninja -B build \
      -DCMAKE_INSTALL_PREFIX=build/install \
      -C configs/RISCV64_verified.cmake \
      -DCMAKE_TOOLCHAIN_FILE=gcc.cmake -DRISCV64=TRUE
ninja -C build kernel.elf
ninja -C build install
```
An MCS variant substitutes `configs/RISCV64_MCS_verified.cmake` and a `build-MCS` directory. For LLVM: `-DCMAKE_TOOLCHAIN_FILE=llvm.cmake -DTRIPLE=riscv64-unknown-elf`, though this path is explicitly excluded from CI per `standalone-kernel/README.md`: "llvm RISCV64 compilation is not currently supported."

**Toolchain minimum: GCC >=11.3 (implies binutils >=2.38).** From `CMakeLists.txt`:
```cmake
if(CMAKE_ASM_COMPILER_ID STREQUAL "GNU" AND CMAKE_C_COMPILER_VERSION VERSION_GREATER_EQUAL "11.3")
    string(APPEND _riscv_march "_zicsr_zifencei")
endif()
```
**Why:** binutils 2.38 changed the default RISC-V ISA spec version, silently dropping the previously-implicit Zicsr/Zifencei extensions from a bare `rv64gc`-style `-march=` string; seL4 detects GCC >=11.3 and manually appends `_zicsr_zifencei` to compensate. Without this, CSR/fence.i instructions fail to assemble correctly on newer binutils. This is also the root cause of open issue #1394 ("gcc-12 riscv64 multilib toolchain mishandles `_zicsr_zifencei` march extensions").

**What CI actually pins** (`seL4-CAmkES-L4v-dockerfiles`, Debian trixie-slim base): `gcc-riscv64-unknown-elf`, `binutils-riscv64-unknown-elf`, `llvm-19`/`clang-19`/`lld-19` (installed but not exercised for RISCV64 per the exclusion noted above), `gcc-14`/`g++-14` (host/ARM cross), `device-tree-compiler`, `qemu-system-misc` (covers riscv), `protobuf-compiler`, `libarchive-dev`.

**Ubuntu native (no Docker) path does not apt-install a riscv64 GCC package at all** - `docs/projects/buildsystem/host-dependencies.md` lists only ARM cross packages via apt and defers to a from-source build (`riscv-gnu-toolchain`, `./configure --enable-multilib && make linux`) for RISC-V.

**QEMU minimum version: 5.1.0**, enforced at configure time in `src/plat/qemu-riscv-virt/config.cmake`. The build invokes `qemu-system-riscv64 -machine virt,dumpdtb=... -cpu rv64 -smp <N> -m 3072 -nographic -bios none` to extract the target device tree at configure time.

**Known build failures:** issue #1394 (gcc-12 riscv64 multilib toolchain, `_zicsr_zifencei` mismatch, worked around in-tree); the LLVM-RISCV64 CI exclusion noted above is a build-path gap rather than a failure, but represents a documented inconsistency between the nominal CI matrix and actual coverage.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | Comparison |
|---|---|---|
| Kernel-mode fault recovery | Missing - trap handler assumes all faults originate in user mode (issue #1374) | ARM64's `traps.S` explicitly calls `kernelDataAbort()` for kernel-mode traps (cited in #1374 as the reference pattern) |
| Hardware ASID isolation | Software ASID written to `satp` but functionally dead - an unconditional `sfence.vma` flushes the whole TLB regardless of ASID (issue #1496) | ARM has a `findFreeHWASID()`-style allocation/recycling mechanism cited in #1496 as the model to follow |
| 4-level paging (Sv48) | Stubbed / hard error (`#error "Only PT_LEVELS == 3 is currently supported"`) | Data not available: no equivalent amd64/arm64 paging-depth limitation found in this research |
| Hypervisor extension | Not mainlined; experimental only in the P550 platform port (issue #812 open) | ARM_HYP is a first-class, separate kernel architecture in seL4's own CI matrix |
| Hardware debugging support | Absent, no committed timeline (issue #1719, closed without a roadmap) | Data not available: no amd64/arm64 debug-support comparison gathered |
| L2 cache maintenance | Unsupported (issue #470, open since 2021, affects HiFive Unleashed u54 / HiFive Unmatched u74) | Data not available: no amd64/arm64 comparison gathered |
| PLIC interrupt controller init | `plic_init_controller` fails to clear pending interrupts (issue #1482, open) | n/a - PLIC is RISC-V-specific hardware |
| Spurious IRQ handling under SMP | Confirmed reproducible on HiFive Premier P550 during PR #1397 bring-up (issue #1442, open) | Data not available |
| Fastpath IPC optimization | Open question whether register reuse (`t3`) in `traps.S` blocks pipelining (issue #345); LR/SC reservation state not cleared on fastpath, inconsistent with slowpath (issue #604, a prior fix in PR #276 was rejected for adding a serializing instruction to the fastpath) | Data not available: no amd64/arm64 fastpath comparison gathered |
| NaN-boxing / floating-point semantics | **No RISC-V-specific NaN-boxing issue found** - a dedicated search ("riscv nan floating", "NaN boxing floating point riscv") returned only false positives (substring "nan" inside "maintenance"/"nanoseconds"); only scalar F/D context save/restore is implemented, no SIMD | This is a known general RISC-V FPU subtlety elsewhere (e.g. [CVA6 core issue #2449](https://github.com/openhwgroup/cva6/issues/2449), [unicorn-engine #2314](https://github.com/unicorn-engine/unicorn/issues/2314)) but not filed against seL4 specifically |
| Kernel cache-line assumptions | Hardcoded to HiFive Unleashed's values in `hardware.h` (issue #1588); not a correctness bug since RISC-V has no in-kernel cache ops, but affects fastpath structure alignment on other platforms | Data not available |
| `seL4_UserTop` constant | Appears copied unmodified from x64, leaving an unused top-level page-table slot (issue #1697); cosmetic per maintainer, not functional | n/a |

## 7. CI/CD Infrastructure

`seL4/seL4` uses GitHub Actions exclusively - no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. Of 12 workflow files under `.github/workflows/`, exactly 4 reference RISCV64: `compilation-checks.yml`, `pr.yml`, `preprocess-deploy.yml`, `proof.yml`. `cparser.yml`, `hw-tests.yml`, `manual.yml`, `push.yml`, `sel4test-deploy.yml`, `sel4test-sim.yml`, `trigger.yml`, and `xml_lint.yml` contain no riscv64 reference.

- **`compilation-checks.yml`**: runs on every push to master and every pull request; matrix `arch: [ARM, ARM_HYP, AARCH64, RISCV64, X64]` x `compiler: [gcc, llvm]`, cross-compiling the standalone kernel on `ubuntu-latest` (x86) via the external `seL4/ci-actions/standalone-kernel@master` action. Build-only, no test execution, no riscv64 hardware or QEMU runner.
- **`pr.yml`**: preprocess matrix includes RISCV64 with and without the MCS feature (proof preprocessing, still build-time).
- **`preprocess-deploy.yml`**: `preprocess-mcs`/`deploy-mcs` jobs are **RISCV64-only** - MCS-feature proof-preprocessing/deployment exists exclusively for riscv64 among the five kernel architectures.
- **`proof.yml`**: label-gated (`proof-test` label) formal proof CI; matrix includes RISCV64 twice (base: CRefine + SimplExportAndRefine; MCS: CRefine). Proof execution happens on AWS via `seL4/ci-actions/aws-proofs@master`, gated to `github.repository_owner == 'seL4'`.

**No self-hosted riscv64 runner and no QEMU-based riscv64 execution exists in `seL4/seL4`'s own CI configuration.** Actual QEMU riscv64 boot/run of sel4test happens only in the external `seL4/ci-actions/sel4test-sim` Dockerfile, which is not wired into `seL4/seL4`'s own workflow files as a scheduled or PR-required job.

**RISE runners:** not used. No reference to `riseproject-dev` or a RISE runner label was found in any workflow file, and no RISE involvement with seL4 was found anywhere (Section 12).

| Axis | amd64 (X64) | arm64 (AARCH64) | riscv64 (RISCV64) |
|---|---|---|---|
| Cross-compile on every push/PR | yes | yes | yes |
| Label-gated formal proof CI | yes | yes | yes (twice: base + MCS) |
| Architecture-exclusive CI job | none found | none found | `preprocess-mcs`/`deploy-mcs` (RISCV64-only) |
| Native/self-hosted runner in this repo | no (`ubuntu-latest`) | no | no |
| Runtime QEMU/hardware test execution wired into this repo's own CI | Data not available (no dedicated x64 QEMU-execution workflow found in the files examined) | Data not available | none found - only cross-compilation and label-gated proofs |

## 8. Distribution and Release Status

seL4 ships **no compiled binaries for any architecture**, by design - it is a kernel meant to be built into a specific target image, not a standalone installable package.

- **GitHub releases**: the three most recent (16.0.0, 15.0.0, 14.0.0) contain only `seL4-manual-<version>.pdf`, a source zip, a source tar.gz, and (for the two most recent) an attestation JSON. No riscv64 or any-architecture binary asset filenames were found.
- **PyPI**: `https://pypi.org/pypi/sel4/json` returns HTTP 404 - no package named "sel4" exists.
- **RISE wheel builder**: the GitLab package index for "sel4" 302-redirects to PyPI, which also 404s - no package present there either.
- **Ubuntu 26.04 (resolute)**: `https://packages.ubuntu.com/search?keywords=seL4&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" - no `sel4`/`libsel4`/`python3-sel4` package exists for any architecture.

**To obtain a working riscv64 build**, a user must build from source using seL4's own CMake-based build system (Section 5), targeting one of the supported RISC-V platform overlays (`qemu-riscv-virt`, `hifive`, `hifive-p550`, `ariane`, `bananapi-f3`, `cheshire`, `polarfire`, `rocketchip`, `star64`) with a pinned GCC >=11.3 (or the excluded-from-CI LLVM path) toolchain.

**Data gap:** the project-graph MCP server (Docker-backed) was unreachable for the entire research session (`CONNECTION_CLOSED`, Docker daemon unreachable in the sandbox), so no SPARQL-based Ubuntu 26.04 riscv64 package-availability cross-check could be run for seL4's dependencies (Section 9). This should be re-run once that server is reachable.

## 9. Dependencies

seL4's kernel itself is freestanding and dependency-free; everything below is a **build/test/tooling-time** dependency pulled in by `CMakeLists.txt`, `tools/internal.cmake`, or the CI Docker images.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| GCC | Build-dependency, critical | Fully upstream, tier-1 GCC target | seL4's own CI builds/tests with GCC on riscv64 | Ubuntu ships riscv64 GCC/binutils as a primary arch | Open issue **[#1394](https://github.com/seL4/seL4/issues/1394)**: gcc-12 riscv64 multilib toolchain mishandles `_zicsr_zifencei`, worked around in `CMakeLists.txt` |
| LLVM | Build-dependency, critical | Upstream LLVM RISC-V backend is tier-1 and actively developed | LLVM builds/tests riscv64 routinely in its own CI | riscv64 clang/LLVM releases ship upstream | Within seL4 itself, riscv64+LLVM is **excluded from CI** per `ci-actions/standalone-kernel/README.md`, contradicting merged PR #1154's stated intent (see Section 3) |
| CMake | Build-dependency, critical | Data not available: no riscv64-specific research was conducted on CMake's own packaging/build status | Data not available | Data not available | Host-side build tool; analogous in role to `dtc` below (not compiled for the target architecture) |
| QEMU | Test-dependency, critical | `virt`/riscv64 is one of QEMU's most actively maintained system targets; seL4 enforces a minimum QEMU version of 5.1.0 | seL4's principal riscv64 execution target via `qemu-system-riscv64` outside this repo's own CI (Section 7) | riscv64 system emulation ships in every QEMU release | The GitHub mirror `qemu/qemu` has Issues disabled (QEMU tracks bugs on GitLab); this venue mismatch means no issue-level riscv64 health signal was independently obtained this run |
| OpenSBI | Runtime-dependency, critical | Data not available: no dedicated riscv64 build/test/release research was conducted on OpenSBI itself | Data not available | Data not available | seL4 integrates it via the `KernelOpenSBIPlatform` config option and boots through it on real hardware platforms; a RISE blog post ("Advancing OpenSBI Interrupt Handling", 2026-07-16) shows general RISE ecosystem activity on OpenSBI, but no seL4-specific integration issue was found [NEEDS VERIFICATION] |
| dtc | Build-dependency, optional | Architecture-agnostic host tool (text/DTB compiler, not target-compiled code) | N/A (host tool) | Ubuntu ships `device-tree-compiler` broadly, including on riscv64 as a build arch | 0 riscv64-tagged issues found on the GitHub mirror `dgibson/dtc`; canonical repo is git.kernel.org and mirror issue-indexing status was not independently confirmed |
| Spike | Test-dependency, optional | Data not available: the standalone Spike ISA simulator's own riscv64 packaging/release status was not researched | Data not available | Data not available | seL4's build system references a "spike" QEMU machine type (`qemu-system-riscv64 -M spike`) for certain platform simulation configs (e.g. `rocketchip`); whether this equates to invoking the actual upstream Spike (`riscv-isa-sim`) binary was not confirmed |

**Additional indirect dependencies found via research** (pulled in by the `sel4-deps` Python metapackage or CI images, filtered to those with JIT/SIMD/numerics/crypto/compression/allocator relevance):

| Dependency | Role | riscv64 status |
|---|---|---|
| binutils | Paired with GCC, minimum 2.38 required (see Section 5) | Fully upstream riscv64 target, same tier as GCC |
| musl libc | C library for seL4 userland (`libsel4muslcsys`, used by seL4_libs/CAmkES/sel4test) | riscv64 port long-upstream; GitHub mirror returned HTTP 422 on issue search (development happens via mailing list, not GitHub-issue-indexed), so no independent issue-level signal was obtainable |
| libarchive | Compression/archive handling via the `libarchive-c` Python binding in `sel4-deps` | Portable C; of 5 issues matching "riscv64" on the GitHub repo, none report riscv64-specific failures |
| protobuf | Serialization, pulled in by `sel4-deps` for CAmkES/nanopb tooling | riscv64 support added upstream: historical issue **#12266** ("Add riscv64 support") and **#14549** ("Build fails on RISCV") are both closed/resolved; riscv64 now builds cleanly |

**Excluded as non-major** (pure Python or thin portable wrappers, no arch-specific runtime component, no open riscv64 signal found): `jinja2`, `ply`, `six`, `future`, `lxml`/`libxml2`, `pyyaml`, `jsonschema`, `pyfdt`, `psutil`, `bs4`, `sh`, `pexpect`, `pyelftools`, `cmake-format`, `guardonce`, `autopep8`, `typing_extensions`.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1496](https://github.com/seL4/seL4/issues/1496) | riscv software ASIDs incorrectly mapped to hardware ASIDs | Open | Correctness | Unconditional `sfence.vma` flushes whole TLB, making the software ASID functionally dead code; not yet biting because current hardware supports at most one usable hardware ASID |
| [#1374](https://github.com/seL4/seL4/issues/1374) | Riscv, kernel trapping, and "double" faults | Open | Correctness | Root cause: trap handler assumes all traps originate in user mode; a proposed fix (PR #1603) was rejected on process grounds, so this remains unresolved |
| [#1442](https://github.com/seL4/seL4/issues/1442) | Spurious IRQs on RISC-V SMP | Open | Correctness | Reproducible on SiFive Premier P550 during cross-core IPC sel4test cases; surfaced during PR #1397 bring-up |
| [#1482](https://github.com/seL4/seL4/issues/1482) | riscv: plic: `plic_init_controller` won't clear any pending interrupt | Open | Correctness | |
| [#1485](https://github.com/seL4/seL4/issues/1485) | riscv: kernel fault during development not handled nicely by `trap_entry` | Open | Robustness | |
| [#1394](https://github.com/seL4/seL4/issues/1394) | gcc-12 riscv64 multilib toolchain mishandles `_zicsr_zifencei` march extensions | Open | Toolchain | Worked around in-tree; underlying toolchain fragility remains |
| [#1345](https://github.com/seL4/seL4/issues/1345) | QEMU riscv32 SMP stucks | Open | Correctness (emulation hang) | |
| [#1031](https://github.com/seL4/seL4/issues/1031) | Read RISC-V PLIC config data from DTS during build process | Open | Feature | |
| [#1020](https://github.com/seL4/seL4/issues/1020) | Select RISC-V PLIC driver based on DTS | Open | Feature | |
| [#972](https://github.com/seL4/seL4/issues/972) | Analyze and clarify RISC-V memory alignment/usage effects | Open | Performance | "quirk with memory usage in RISC-V... only on some platforms" |
| [#812](https://github.com/seL4/seL4/issues/812) | Clean up RISC-V H-Extension branches | Open | Feature/hypervisor | H-extension not mainlined |
| [#604](https://github.com/seL4/seL4/issues/604) | RISC-V: Load-Reserved/Store-Conditional reservation state not cleared in fastpath | Open | Performance/correctness tradeoff | Prior fix (PR #276) was rejected for adding a serializing instruction to the fastpath |
| [#470](https://github.com/seL4/seL4/issues/470) | Support L2 cache maintenance on RISC-V | Open | Missing feature | Affects HiFive Unleashed u54 / HiFive Unmatched u74 |
| [#464](https://github.com/seL4/seL4/issues/464) | Clarify RISC-V PLIC interrupt handling | Open | Documentation/correctness | |
| [#345](https://github.com/seL4/seL4/issues/345) | Evaluate RISC-V fastpath assembly optimization | Open | Performance | Possible `t3` register-reuse pipelining issue |
| [#1588](https://github.com/seL4/seL4/issues/1588) | riscv hardcodes cache information to that of the HiFive Unleashed | Open | Performance | Not a correctness bug (RISC-V has no in-kernel cache ops) but affects fastpath alignment on other platforms |
| [#1697](https://github.com/seL4/seL4/issues/1697) | RISC-V `seL4_UserTop` value leads to an unused top-level slot | Open | Cosmetic/design | Maintainer confirms value is "bogus," likely copy-pasted from x64 |
| [#1719](https://github.com/seL4/seL4/issues/1719) | Question re timeline/plans for RISC-V hardware debugging support | Closed (answered, no roadmap) | Feature gap | Confirms no committed plan for RISC-V hardware debug support |
| [#1350](https://github.com/seL4/seL4/issues/1350) | QEMU RISC-V logging "Invalid register read/write" for SiFive PLIC | Closed | Correctness | |
| [#1128](https://github.com/seL4/seL4/issues/1128) | seL4 boot fails on riscv64 when higher address values are used | Closed | Correctness | Cap fault at boot when DTS memory node used a high physical address (e.g. `0x1800000000`); fixed after diagnosis |
| [#879](https://github.com/seL4/seL4/issues/879) | RISC-V issues with QEMU v7.0.0 | Closed | Correctness | Reproduced/fixed in seL4's QEMU handling |

**Correctness bugs to highlight separately:** #1496 (ASID), #1374 (kernel-mode fault misrouting, with its fix attempt rejected), #1442 (spurious SMP IRQs), and #1482 (PLIC pending-interrupt clearing) are the four currently open items that affect functional correctness rather than performance, documentation, or missing (non-blocking) features.

## 12. Objections and Upstream Blockers

**PR #1603 rejection (process, not technical).** A contribution implementing hardware-assisted safe user-memory access on RISC-V - directly addressing root-cause issue #1374 - was closed by maintainer Indanz with: "Please don't do this again. If you do, you may be blocked from opening future seL4 pull requests altogether." No technical review comments preceded this. The submitting account was a deleted/ghost account, and the tone strongly suggests the PR was treated as spam, low-effort, or AI-generated rather than reviewed on engineering merit. **The underlying architectural gap (#1374) remains open and unresolved** - this is the single clearest data point that a real, identified RISC-V correctness gap has an unmerged fix path.

**New-platform-port policy.** Per `sel4.systems/platforms.html` and `CONTRIBUTING.md`, adding a new RISC-V platform requires RFC-style community discussion, testing requirements, and an ongoing maintenance/expertise commitment, or the alternative of contracting an Endorsed Service Provider (DornerWorks, Proofcraft). Adding a new **verified** platform is a substantially higher bar still, requiring matching `l4v` formal-proof updates alongside the code.

**No formal RISC-V roadmap.** No master tracking issue for the RISC-V port exists (searched extensively); RISC-V is tracked only through the `RISC-V` label across many independent issues. Issue #1719, the closest thing to a roadmap question (hardware debugging support timeline), was closed as answered without a committed date.

**No RISE involvement whatsoever.** Checked exhaustively: all 34 RISE blog posts (2024-05-15 through 2026-08-24) scanned, none mention seL4; RISE's own site search for "seL4" returns zero results; the RISE Python wheel builder does not list seL4/sel4 among its ~80+ riscv64 targets; the `riseproject-dev` GitHub org's 25 repositories are unrelated by name, and `search_code` across that org for "seL4"/"sel4" returned exactly one hit - a queued-but-not-yet-researched entry in `riseproject-dev/sw-ecosystem`'s own tracking file, not evidence of funding or engagement. seL4, the seL4 Foundation, UNSW, and Proofcraft do not appear in either RISE membership tier (Premier or General). **This means no RISE-funded runner, board-farm, or engineering work currently exists for seL4, and there is no pending RISE-driven change that would improve the grade.**

**Acceptance probability for future RISC-V correctness fixes:** likely favorable on technical merit given the active, ongoing RISC-V commit history (393 commits, recent activity), but PR #1603's rejection shows the project enforces a real trust/process bar for contributions from unfamiliar or low-signal accounts, independent of the technical content.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** none
- **Justification:** seL4/seL4's own CI cross-compiles the kernel for RISCV64 on every push and pull request via [`compilation-checks.yml`](https://github.com/seL4/seL4/blob/master/.github/workflows/compilation-checks.yml), and its formal-proof CI runs CRefine (and, for the base config, SimplExportAndRefine) proofs against RISCV64 and RISCV64+MCS via [`proof.yml`](https://github.com/seL4/seL4/blob/master/.github/workflows/proof.yml) - a rigorous functional-correctness check that CONTRIBUTING.md effectively requires for substantive changes touching verified architectures, even though it is technically gated behind a `proof-test` label rather than running unconditionally on every push. No riscv64 (or any-architecture) binary is published in seL4's GitHub releases - the project ships source tarballs and a manual PDF only, for every architecture, by design - so `release_provider` is `none` and green (which requires an upstream-published riscv64 artifact) is unreachable regardless of CI strength.
- **Pending work that could change the grade:** wiring actual QEMU riscv64 sel4test execution into `seL4/seL4`'s own default CI (currently only cross-compilation runs automatically; runtime testing lives in the external, non-wired-in `seL4/ci-actions/sel4test-sim`) would strengthen confidence in the "test" axis. Resolving the LLVM-RISCV64 CI exclusion contradiction (PR #1154 claims LLVM riscv64 build+test, but `standalone-kernel/README.md` currently disclaims it) is a smaller open item. PR #1603 remains a live, unresolved fix attempt for issue #1374 (kernel-mode fault handling) - if a properly vetted version of that work lands, it would close one of the four open correctness bugs. No RISE involvement exists to accelerate any of this.

## 14. Investment Analysis

No RISE-funded or otherwise externally-funded work on seL4's RISC-V port was found (Section 12) - every item below is unaddressed by any outside party as of this research.

### 14.1 Functional Enablement
- Fix ASID mapping so software ASIDs correspond to real hardware ASIDs, or explicitly disable the hardware-ASID code path until fixed (issue #1496).
- Resolve kernel-mode fault misrouting: adopt a `sscratch`-sentinel pattern (as Linux's RISC-V port does) to distinguish kernel-mode from user-mode traps and route kernel-mode faults to a proper kernel-abort path, closing issue #1374; this requires re-submitting the substance of the rejected PR #1603 through a trusted contributor or an Endorsed Service Provider.
- Fix `plic_init_controller` to clear pending interrupts correctly (issue #1482).
- Root-cause the SMP spurious-IRQ behavior seen on the P550 (issue #1442).
- Decide and implement Sv48 (4-level paging) support, or formally document it as out of scope.
- Mainline the H-extension work currently confined to experimental platform branches (issue #812), if virtualization use cases are a target.

### 14.2 Performance Optimization
- Evaluate and, if warranted, implement the fastpath assembly optimization flagged in issue #345 (register-reuse/pipelining).
- Resolve the LR/SC fastpath/slowpath inconsistency (issue #604) via the synchronize-not-serialize approach the issue proposes.
- Generalize the hardcoded HiFive-Unleashed cache-line assumptions (issue #1588) for non-HiFive riscv64 platforms.

### 14.3 CI/CD Infrastructure
- Add an automatic (non-label-gated) riscv64 QEMU boot-and-run of the sel4test suite to `seL4/seL4`'s own GitHub Actions, closing the gap between "compiles" and "functionally verified on every PR."
- Resolve the LLVM-RISCV64 exclusion so the CI matrix's stated coverage matches actual behavior.
- Evaluate whether RISE RISC-V Runners (native riscv64 GitHub Actions, announced by RISE 2026-03-24) could replace the current x86-hosted cross-compilation-only approach with genuine native riscv64 execution, given RISE currently has zero involvement with seL4.

### 14.4 Ecosystem Enablement
Not applicable in the conventional sense (Section 10 omitted: seL4 has no dependent package ecosystem - no PyPI, npm, or Maven consumers). The closest analog is binary distribution: since seL4 ships no compiled artifacts for **any** architecture by design, achieving riscv64 binary availability would require either (a) a downstream distro packaging seL4 for a specific target image, which does not currently exist for any architecture, or (b) accepting that seL4 remains source-only across the board, making this a project-wide characteristic rather than a riscv64-specific gap to close.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix kernel-mode fault misrouting (#1374 / resurrect #1603 through a trusted channel) | 3-5 | Kernel/trap-handling engineer, coordinated with TSC | Critical |
| Functional | Fix hardware ASID mapping (#1496) | 2-3 | Kernel/MMU engineer | High |
| Functional | Fix PLIC pending-interrupt clearing (#1482) | 1-2 | Platform/interrupt engineer | High |
| Functional | Root-cause SMP spurious IRQs on P550 (#1442) | 2-4 | Platform bring-up engineer | Medium |
| Functional | Sv48 (4-level paging) support or explicit scope decision | 4-8 | Kernel/MMU engineer | Medium |
| Functional | Mainline RISC-V H-extension (#812) | 6-10 | Kernel engineer, hypervisor experience | Low-Medium (depends on virtualization roadmap) |
| Performance | Fastpath assembly review (#345) and LR/SC fix (#604) | 2-4 | Kernel engineer, assembly-level RISC-V experience | Medium |
| Performance | Generalize cache-line constants beyond HiFive (#1588) | 1 | Kernel engineer | Low |
| CI/CD | Wire automatic riscv64 QEMU sel4test execution into seL4/seL4's own CI | 2-3 | CI/build engineer | High |
| CI/CD | Resolve LLVM-RISCV64 CI exclusion | 1-2 | CI/build engineer | Low |
| CI/CD | Evaluate RISE RISC-V Runners for native execution | 1 (evaluation only) | CI/build engineer | Low |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [seL4/seL4 GitHub repository](https://github.com/seL4/seL4)
- [seL4 homepage](https://sel4.systems/)
- [seL4 Verified Configurations](https://docs.sel4.systems/projects/sel4/verified-configurations.html)
- [seL4 Supported platforms](https://docs.sel4.systems/Hardware/)
- [seL4 QEMU RISC-V virtual platform docs](https://docs.sel4.systems/Hardware/qemu-riscv-virt.html)
- [seL4 Performance page](https://sel4.systems/performance.html)
- [seL4 Summit 2025 Abstracts](https://sel4.systems/Summit/2025/abstracts2025.html)
- [seL4-riscv-mk (outdated, merged upstream 2018)](https://github.com/heshamelmatary/seL4-riscv-mk)
- [seL4/l4v proofs repository](https://github.com/sel4/l4v)
- [sel4-riscv-vmm-manifest](https://github.com/SEL4PROJ/sel4-riscv-vmm-manifest)
- [seL4/sel4bench repository](https://github.com/seL4/sel4bench)
- [Issue #1588 - riscv hardcodes cache information](https://github.com/seL4/seL4/issues/1588)
- [Issue #1697 - RISC-V seL4_UserTop unused slot](https://github.com/seL4/seL4/issues/1697)
- [Issue #1496 - riscv software ASIDs incorrectly mapped](https://github.com/seL4/seL4/issues/1496)
- [Issue #1485 - riscv kernel fault not handled nicely by trap_entry](https://github.com/seL4/seL4/issues/1485)
- [Issue #1482 - riscv plic_init_controller won't clear pending interrupt](https://github.com/seL4/seL4/issues/1482)
- [Issue #1442 - Spurious IRQs on RISC-V SMP](https://github.com/seL4/seL4/issues/1442)
- [Issue #1436 - clang rv64/rv32 simulations taking 12min+](https://github.com/seL4/seL4/issues/1436)
- [Issue #1394 - gcc-12 riscv64 multilib toolchain mishandles march extensions](https://github.com/seL4/seL4/issues/1394)
- [Issue #1374 - Riscv, kernel trapping, and double faults](https://github.com/seL4/seL4/issues/1374)
- [Issue #1345 - QEMU riscv32 SMP stucks](https://github.com/seL4/seL4/issues/1345)
- [Issue #1031 - Read RISC-V PLIC config data from DTS](https://github.com/seL4/seL4/issues/1031)
- [Issue #1020 - Select RISC-V PLIC driver based on DTS](https://github.com/seL4/seL4/issues/1020)
- [Issue #972 - Analyze RISC-V memory alignment/usage effects](https://github.com/seL4/seL4/issues/972)
- [Issue #812 - Clean up RISC-V H-Extension branches](https://github.com/seL4/seL4/issues/812)
- [Issue #604 - RISC-V LR/SC reservation state not cleared in fastpath](https://github.com/seL4/seL4/issues/604)
- [Issue #470 - Support L2 cache maintenance on RISC-V](https://github.com/seL4/seL4/issues/470)
- [Issue #464 - Clarify RISC-V PLIC interrupt handling](https://github.com/seL4/seL4/issues/464)
- [Issue #345 - Evaluate RISC-V fastpath assembly optimization](https://github.com/seL4/seL4/issues/345)
- [Issue #1719 - RISC-V hardware debugging support timeline](https://github.com/seL4/seL4/issues/1719)
- [Issue #1350 - QEMU RISC-V SiFive PLIC invalid register logging](https://github.com/seL4/seL4/issues/1350)
- [Issue #1128 - seL4 boot fails on riscv64 with higher addresses](https://github.com/seL4/seL4/issues/1128)
- [Issue #879 - RISC-V issues with QEMU v7.0.0](https://github.com/seL4/seL4/issues/879)
- [PR #1603 - RISC-V hardware-assisted safe user memory access (rejected)](https://github.com/seL4/seL4/pull/1603)
- [PR #1592 - Add support for stm32mp2 SoC family](https://github.com/seL4/seL4/pull/1592)
- [PR #1535 - Add support for the Banana Pi BPI-F3](https://github.com/seL4/seL4/pull/1535)
- [PR #1532 - Add SBI cap (RFC-22)](https://github.com/seL4/seL4/pull/1532)
- [PR #1469 - Minimal CHERI support (open)](https://github.com/seL4/seL4/pull/1469)
- [PR #1397 - Add support for SiFive Premier P550 platform](https://github.com/seL4/seL4/pull/1397)
- [PR #1392 - riscv default FPU extensions OFF to ON](https://github.com/seL4/seL4/pull/1392)
- [PR #1322 - Experimental CHERI support (draft, merged)](https://github.com/seL4/seL4/pull/1322)
- [PR #1154 - CI build and test kernel for RISCV64 with LLVM](https://github.com/seL4/seL4/pull/1154)
- [PR #759 - RISC-V reserve memory for SBI in device tree](https://github.com/seL4/seL4/pull/759)
- [PR #680 - riscv pass hart mask by value to SBI wrappers](https://github.com/seL4/seL4/pull/680)
- [PR #354 - gcc.make Add support for riscv64-elf- toolchain](https://github.com/seL4/seL4/pull/354)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Hesham Almatary - IPC Performance of seL4 on RISC-V Platforms (2018)](http://heshamelmatary.blogspot.com/2018/06/ipc-perfoamnce-of-sel4-microkernel-on.html)
- [CVA6 issue #2449 - RISC-V FPU NaN-boxing (general ecosystem reference, not seL4-specific)](https://github.com/openhwgroup/cva6/issues/2449)
- [unicorn-engine issue #2314 - RISC-V FPU NaN-boxing (general ecosystem reference, not seL4-specific)](https://github.com/unicorn-engine/unicorn/issues/2314)