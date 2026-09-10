---
title: OP-TEE
parent: Project Reports
color: yellow
dependencies:
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: critical
  - name: LibTomCrypt
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="op-tee" %}

# OP-TEE

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for OP-TEE<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OP-TEE (`optee_os`, [github.com/OP-TEE/optee_os](https://github.com/OP-TEE/optee_os)) is a bare-metal Trusted Execution Environment (TEE) operating system implementing the GlobalPlatform TEE specifications, historically built for Arm TrustZone. It is a Make-based, source-only C codebase with no CMake, Cargo, or package-manager-mediated dependencies; third-party libraries (Mbed TLS, LibTomCrypt, zlib, libfdt, qcbor) are vendored under `lib/` and `core/lib/` and cross-compiled in-tree.

**Governance:** Hosted by TrustedFirmware.org, a Linux Foundation project. Ownership passed from STMicroelectronics + Linaro (2014-2015) to Linaro (2015-2019) to TrustedFirmware.org in September 2019. Per [optee.readthedocs.io](https://optee.readthedocs.io), "Maintenance is a shared responsibility between the members for TrustedFirmware.org and some community maintainers representing other companies who are using OP-TEE."

**Corporate sponsors (TrustedFirmware.org membership tiers, from trustedfirmware.org/join):**
- Diamond (board seats): Arm, Google
- Platinum (board rep): Linaro, ST, Renesas, NXP, Qualcomm (Qualcomm joined recently, per a news item dated 2026-03-23)
- General: Futurewei, ProvenRun, Nordic Semiconductor, Texas Instruments
- Project Partners: BUGSENG, CloudBees

**License:** BSD-2-Clause.

**Community culture on new ports:** No formal numeric tier system. The `MAINTAINERS` file uses per-platform status labels (Maintained vs. Orphan) plus sub-maintainer assignment, the same model as the Linux kernel `MAINTAINERS` file. RISC-V went from first patch to merged, full-architecture "Maintained" status in roughly six months with sign-off from senior Linaro maintainers (Jens Wiklander, Etienne Carriere), and the project has since accepted four distinct RISC-V platform back-ends (spike, virt, cva6, sifive) from four different companies (NXP, Bootlin, Andes, SiFive) between 2021 and 2026. This indicates a genuinely welcoming, review-gated (not closed/Arm-only) process, despite Arm's historical dominance (40+ Arm platforms vs. 4 RISC-V platforms today).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-12-27 | First RISC-V commit (`ad0ae80`, "riscv: create makefiles and directories tree for riscv", adds `plat-spike`), authored by Marouene Boubakri (NXP) | Local clone, git log |
| 2022-06-16 | PR [#5080](https://github.com/OP-TEE/optee_os/pull/5080) ("optee_os risc-v port") closed unmerged; content cherry-picked to master separately | [PR #5080](https://github.com/OP-TEE/optee_os/pull/5080) |
| 2022-12-19 | PR [#5606](https://github.com/OP-TEE/optee_os/pull/5606) ("A set of commits to start compiling for RISC-V") closed unmerged, split into successor PRs | [PR #5606](https://github.com/OP-TEE/optee_os/pull/5606) |
| 2023-01-03 | PR [#5731](https://github.com/OP-TEE/optee_os/pull/5731) merged - kernel makefiles/linker scripts (first release: 3.20.0) | [PR #5731](https://github.com/OP-TEE/optee_os/pull/5731) |
| 2023-01-31 | PR [#5714](https://github.com/OP-TEE/optee_os/pull/5714) merged - initial thread management routines (first release: 3.21.0) | [PR #5714](https://github.com/OP-TEE/optee_os/pull/5714) |
| 2023-06-19 | PR [#6076](https://github.com/OP-TEE/optee_os/pull/6076) merged - TA stack unwinding (first release: 3.22.0) | [PR #6076](https://github.com/OP-TEE/optee_os/pull/6076) |
| 2023-07-13 | Issue [#6173](https://github.com/OP-TEE/optee_os/issues/6173) - Nuclei announces complete OpenSBI+OP-TEE+U-Boot+Linux stack on UX900 FPGA, passing xtest except networking; becomes de facto reference discussion | [Issue #6173](https://github.com/OP-TEE/optee_os/issues/6173) |
| 2023-08-26 | Issue #6173 closed stale, no formal upstreaming decision recorded | [Issue #6173](https://github.com/OP-TEE/optee_os/issues/6173) |
| 2023-09-06 | Issue [#6075](https://github.com/OP-TEE/optee_os/issues/6075) (SMP interrupt-context problem) closed stale, unresolved | [Issue #6075](https://github.com/OP-TEE/optee_os/issues/6075) |
| 2024-02-26 | PR [#6705](https://github.com/OP-TEE/optee_os/pull/6705) merged - RISC-V build added to CI (first release: 4.2.0) | [PR #6705](https://github.com/OP-TEE/optee_os/pull/6705) |
| 2024-11-29 | PR [#6913](https://github.com/OP-TEE/optee_os/pull/6913) merged - VS Code devcontainer with riscv64 cross-compiler (first release: 4.5.0) | [PR #6913](https://github.com/OP-TEE/optee_os/pull/6913) |
| 2025-01-05 | SiFive Unleashed/Unmatched board support added (commit `49c6ad2`) | Commit search |
| 2025-04-11 | Sv48/Sv57 address translation support added (commit `71214c1`) | Commit search |
| 2025-09-19 to 2025-10-28 | Issue [#7537](https://github.com/OP-TEE/optee_os/issues/7537) reopens the "what's the plan" question from #6173, closed not-planned/stale without maintainer follow-up | [Issue #7537](https://github.com/OP-TEE/optee_os/issues/7537) |
| 2026-08-12 | PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) opened - QEMU RISC-V64 xtest CI workflow (still open) | [PR #7927](https://github.com/OP-TEE/optee_os/pull/7927) |
| 2026-09-02 | PR [#7980](https://github.com/OP-TEE/optee_os/pull/7980) opened as draft - Zvkned/Zvkb vector-crypto AES acceleration | [PR #7980](https://github.com/OP-TEE/optee_os/pull/7980) |
| 2026-09-03 | Issue [#7985](https://github.com/OP-TEE/optee_os/issues/7985) opened - RV32 MMU/ldelf support still missing | [Issue #7985](https://github.com/OP-TEE/optee_os/issues/7985) |

**Key contributors by organization:** NXP (Marouene Boubakri, port initiator and current arch maintainer), Bootlin (Clement Leger, CVA6 platform), Andes Technology (Alvin Chang / gagachang, Randolph Lin, active 2023-2025), SiFive (Yu-Chien Peter Lin, 2025-2026 SiFive platform), Nuclei (fanghuaqi, out-of-tree reference stack), RISCstar Solutions (Ray Mao / dave-patel-riscstar, 2026 vector-crypto and MPXY work).

**Is it fully upstream?** Partially. The core architecture (boot, MMU, threads, SBI, exceptions, 4 platforms) is merged to master and marked "Maintained" in `MAINTAINERS`. However, RV32 lacks MMU/ldelf support ([#7985](https://github.com/OP-TEE/optee_os/issues/7985), open), the SMP foreign-interrupt-to-different-core problem remains architecturally unresolved ([#6075](https://github.com/OP-TEE/optee_os/issues/6075), closed stale without a merged fix), and vector-crypto acceleration is still in draft ([#7980](https://github.com/OP-TEE/optee_os/pull/7980)).

## 3. Upstream Support Tier

`MAINTAINERS` uses per-platform status labels (Maintained vs. Orphan), the same model for every architecture - no separate numeric tier system exists. `core/arch/riscv/` is listed as **Maintained**, the same status class as ARM, with Marouene Boubakri (NXP) as the named arch maintainer.

**Evidence for tier placement:**
- CI: exactly one riscv entry in the `builds` job matrix of `.github/workflows/ci.yml`, running on every push/PR since PR [#6705](https://github.com/OP-TEE/optee_os/pull/6705) (merged 2024-02-26). This is release-gating in the sense that it runs on every PR, but it is a compile check only - no boot/execution.
- Release-blocking: the riscv build step must pass on every PR (part of the required `builds` job), but this only proves compilation, not correctness.
- Official binaries: none exist for OP-TEE on **any** architecture - `optee_os` has zero GitHub Releases published ("There aren't any releases here"), confirmed by direct fetch of [github.com/OP-TEE/optee_os/releases](https://github.com/OP-TEE/optee_os/releases).

**Comparison table:**

| Architecture | Upstream CI build | Upstream CI test execution | Official binary release | Platforms |
|---|---|---|---|---|
| amd64 | N/A - not a supported target | N/A | N/A | OP-TEE has never supported x86/amd64; `core/arch/x86` does not exist |
| arm64 | Yes (`builds` job matrix, many entries) | Yes (`QEMUv8_checks`, `QEMUv8_checks_arm64` boot + run xtest under QEMU) | No (source-only project; no GitHub Releases for any arch) | 40+ platforms |
| riscv64 | Yes (`builds` job matrix, 1 entry, cross-compile only) | **No** - no `QEMUriscv64_checks` job exists on master; PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) would add it but is unmerged | No | 4 platforms (virt, spike, sifive, cva6) |

Source: [`.github/workflows/ci.yml`](https://github.com/OP-TEE/optee_os/blob/master/.github/workflows/ci.yml), verified at master HEAD `9ad4a528e8` (2026-09-02).

## 4. Technical Architecture and RISC-V-Specific Subsystems

OP-TEE has no JIT, no SIMD-accelerated numeric kernels, and no GC (it is a static-compiled TEE kernel/TA runtime, not a JIT-hosting engine or managed runtime). The relevant architecture-specific subsystems are boot/trap handling, MMU, SBI firmware interface, and optional hardware crypto acceleration.

**File/line counts (ground truth from clone of master `9ad4a52`):**

| Arch | Source files (.c/.h/.S) | Total lines |
|---|---|---|
| `core/arch/arm` (arm32+aarch64) | 385 | 73,090 |
| `core/arch/riscv` (rv32+rv64) | 62 | 15,212 |
| `core/arch/x86` | does not exist | 0 |

A `grep -rniE "TODO|FIXME|stub|not implement|placeholder"` scan across `core/arch/riscv` found **no placeholder markers** - only legitimate `panic()` calls on real fault paths. This is a genuine, non-stub architecture port, roughly one-fifth the size of the arm tree but covering a functioning core.

**Component inventory (`core/arch/riscv/`):**
- Kernel: `entry.S`, `thread_rv.S` (context switch/exception dispatch), `thread_arch.c`, `boot.c`, `abort.c`, `arch_scall.c`/`arch_scall_rv.S` (ecall/syscall dispatch), `csr_detect.S` (trap-and-recover CSR probing)
- SBI: `sbi.c`, `sbi_console.c`, `sbi_mpxy.c`, `sbi_mpxy_rpmi.c` (MPXY/RPMI mailbox protocol, added 2025)
- MMU: `core_mmu_arch.c` (1,129 lines - Sv32/Sv39/Sv48/Sv57 page tables), `tlb_helpers_rv.S`
- Crypto/RNG: `core/drivers/riscv_zkr_rng.c` (Zkr entropy-source CSR poll, gated by `CFG_RISCV_ZKR_RNG`)
- 4 platform ports: `plat-virt` (QEMU, with PLIC/APLIC/IMSIC variants), `plat-spike`, `plat-sifive`, `plat-cva6`

**ISA extensions used** (from `core/arch/riscv/riscv.mk`): base `rv64ima`/`rv32ima` plus always-on Zicsr/Zifencei; optional D (float), C (compressed), Zbb (bit-manipulation, the only bitmanip extension wired in - no Zba/Zbs), and Zkr (entropy source). **Zero RISC-V Vector (RVV) code exists in the merged tree** - confirmed by `vfloat32m1_t` and `rvv` code searches both returning 0 hits.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture support | Not supported (does not exist) | Full (Maintained, 40+ platforms) | Full for RV64 (Maintained, 4 platforms); RV32 missing MMU/ldelf ([#7985](https://github.com/OP-TEE/optee_os/issues/7985)) |
| MMU | N/A | Full | Sv32/Sv39/Sv48/Sv57 (`core_mmu_arch.c`) |
| Hardware RNG | N/A | Platform-specific TRNG drivers | Zkr CSR-based (`riscv_zkr_rng.c`), runtime-probed |
| Vector/SIMD crypto acceleration | N/A | Yes (NEON-based, mature) | **None merged** - Zvkned/Zvkb AES acceleration is an unmerged draft ([PR #7980](https://github.com/OP-TEE/optee_os/pull/7980)), itself blocked on unmerged FP/vector context-switch PRs #7951/#7961 |
| SMP/interrupt world-switch | N/A | Mature (foreign-interrupt + thread-ID RPC model) | Architecturally incomplete - [issue #6075](https://github.com/OP-TEE/optee_os/issues/6075) documents an unresolved core-affinity resume gap in the M-mode monitor design |

## 5. Build System, Cross-Compilation, and Toolchain

OP-TEE uses a recursive-Make build system (no CMake/Autotools). No `BUILDING.md` exists in-repo; documentation lives at [optee.readthedocs.io](https://optee.readthedocs.io).

**Cross-compiler prefixes** (`optee_os/mk/config.mk`):
```
ifeq ($(ARCH),riscv)
CROSS_COMPILE ?= riscv-linux-gnu-
CROSS_COMPILE64 ?= riscv64-linux-gnu-
endif
```

**Pinned reference toolchain** (`build/toolchain.mk`): a specific riscv-gnu-toolchain nightly (`riscv64-glibc-ubuntu-22.04-gcc-nightly-2023.07.07`), fetched via `make toolchains`. This specific vintage is required because the ISA string OP-TEE constructs (`rv64ima[fd][c][_zbb]_zicsr_zifencei`) needs a toolchain generation that accepts Zicsr/Zifencei as separate `-march` tokens (GCC >= 11 / binutils >= 2.36) and, when `CFG_RISCV_ISA_ZBB=y`, the `_zbb` token (GCC >= 12 / binutils >= 2.38). The `plat-virt` platform additionally forces `CFG_RISCV_ZKR_RNG=y`, requiring a toolchain and QEMU CPU model (`QEMU_CPU ?= rv64,zkr=on`) new enough to support the `Zkr` extension.

**CI build commands** (`.github/workflows/ci.yml`, lines 347-356):
```
export ARCH=riscv
export CROSS_COMPILE64="riscv64-linux-gnu-"
make -j$(nproc) O=out PLATFORM=virt
make -j$(nproc) O=out PLATFORM=virt CFG_RISCV_PLIC=n CFG_RISCV_APLIC=y
make -j$(nproc) O=out PLATFORM=virt CFG_RISCV_PLIC=n CFG_RISCV_APLIC_MSI=y CFG_RISCV_IMSIC=y
make -j$(nproc) O=out PLATFORM=sifive
make -j$(nproc) O=out PLATFORM=cva6
```
This CI job compiles only (no boot, no test) and uses the lighter Ubuntu 22.04 stock `gcc-riscv64-linux-gnu` (GCC 11.x) via the `jforissier/optee_os_ci` container - sufficient for this build matrix since it does not enable Zbb/Zkr, but not sufficient for the full pinned-toolchain QEMU flow below.

**QEMU usage** (from `OP-TEE/build`'s `qemu_riscv64.mk`, a manual/downstream flow, not exercised in CI):
```
make -f qemu_riscv64.mk toolchains
make -f qemu_riscv64.mk         # builds opensbi, optee-os, u-boot, linux, buildroot, qemu
make -f qemu_riscv64.mk run
make -f qemu_riscv64.mk check   # boots QEMU and runs xtest via an expect script
```
Boot flow: OpenSBI -> U-Boot SPL/ITB (embedding `tee.bin` + Linux `Image`) -> Linux with Buildroot rootfs -> automated `xtest` execution.

**Known build failures / caveats:**
- TLS-specific xtest cases are explicitly disabled (`WITH_TLS_TESTS := n`) due to an unresolved `ldelf` relocation bug (`R_RISCV_TLS_DTPMOD64` -> "Unknown relocation type 7"), documented inline in `qemu_riscv64.mk`.
- No RISC-V entry exists in `build`'s own `.github/workflows/` - the QEMU-riscv64 flow described above is not exercised in any CI, only manually.
- Historical build failures, now fixed: [#6213](https://github.com/OP-TEE/optee_os/issues/6213) (`CLINT_BASE` undefined on spike), [#6245](https://github.com/OP-TEE/optee_os/issues/6245) (illegal assembler operand in `thread_rv.S` on virt).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

amd64 is not a supported OP-TEE target at all (`core/arch/x86` does not exist), so the meaningful comparison is riscv64 vs arm64.

**Feature matrix:**

| Feature | arm64 | riscv64 |
|---|---|---|
| Base boot/trap/MMU | Full | Full (Sv39/Sv48/Sv57) |
| SMP with foreign-interrupt world-switch | Full | **Functional gap** - [#6075](https://github.com/OP-TEE/optee_os/issues/6075): a core interrupted while in TEE-world cannot be resumed if the REE scheduler reassigns the pending task to a different core; maintainer-suggested fix (a proper RISC-V Secure Monitor layer) was never shown implemented |
| RV32 (32-bit) support | N/A (arm32 is separate, mature) | **Functional gap** - [#7985](https://github.com/OP-TEE/optee_os/issues/7985) (open): RV32 TAs can build but lack MMU/ldelf support, so cannot be loaded/validated on real hardware |
| Hardware AES acceleration | Yes (NEON) | **Missing** - [PR #7980](https://github.com/OP-TEE/optee_os/pull/7980) (Zvkned/Zvkb) is an unbuildable draft, blocked on unmerged prerequisite PRs #7951/#7961 |
| ASLR, stack canary | Full | Present (commits `04d6aec`/`71ee6d2`/`911f059`, 2025-03) |
| CI runtime test execution | Full (QEMUv7/v8 boot+xtest) | **Absent** - build-only CI; PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) open, unmerged |

**Performance gaps from missing SIMD/vector:** No RVV code exists anywhere in the merged tree. AES acceleration via Zvkned/Zvkb is in-flight but unmerged and admittedly not yet linkable (missing `crypto_accel_aes_xts_enc()`, `crypto_accel_aes_dec()`, `crypto_accel_aes_expand_keys()` per the PR #7980 author's own notes). No quantitative benchmark data comparing riscv64 vs arm64 OP-TEE performance was found in any searched source (GitHub, RISC-V International, RISE blog/wiki, RISC-V Summit Europe 2025 proceedings) - **Data not available: OP-TEE riscv64-vs-arm64 performance benchmarks**.

**Security hardening gaps:** The SMP interrupt-context problem ([#6075](https://github.com/OP-TEE/optee_os/issues/6075)) is a genuine architectural gap relative to arm64's more mature foreign-interrupt/thread-ID RPC resume model, not merely a missing feature.

**NaN / floating-point semantics issues:** **Data not available** - a targeted search for "riscv nan floating" against `OP-TEE/optee_os` issues returned only general RISC-V architecture/support issues, none touching floating-point or NaN handling.

## 7. CI/CD Infrastructure

Verified directly from `.github/workflows/ci.yml` at master HEAD `9ad4a528e874f31e3ac988f550e53187a5835033` (2026-09-02). The repository has exactly three workflow files (`ci.yml`, `notify.yml`, `stales.yml`); `riscv` appears only in `ci.yml`, exactly once, as one matrix entry in the `builds` job.

**No riscv64 test-execution CI exists today.** The `builds` job runs on `ubuntu-latest` (a standard x86_64 GitHub-hosted runner, not native or QEMU-emulated riscv64) inside container `jforissier/optee_os_ci`, invoking a bare `make -j$(nproc) -s O=out $*` for five `PLATFORM=` targets. No binary is ever executed - no QEMU, no boot, no xtest. By contrast, `QEMUv7_checks`/`QEMUv8_checks`/`QEMUv8_checks_arm64` build a Docker image containing QEMU and run `make check` (xtest) for Arm; grepping the full job-name list confirms no `QEMUriscv64_checks` job of any kind exists.

PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) ("ci: enable QEMU RISC-V64 xtest workflow") would add exactly this capability but is confirmed **not merged** (`git merge-base --is-ancestor` against the PR head commit returned `NOT_MERGED_INTO_MASTER`), and is additionally gated on three external cross-repo prerequisite PRs: `OP-TEE/manifest#353`, `jforissier/docker_optee_os_ci#1`, `OP-TEE/build#870`. The PR branch is also visibly stale relative to master (reverts unrelated recent changes, drops platforms present on master), indicating it has not been actively rebased.

RISE runners: no reference to `riseproject-dev` runner labels or RISE RISC-V Runners infrastructure was found in any OP-TEE workflow file; the general-purpose [RISE Runners service](https://riscv-runners.riseproject.dev/) was checked directly and has no OP-TEE-specific tie-in.

**Comparison table:**

| Architecture | Build CI | Test CI | Runner type | Release-blocking |
|---|---|---|---|---|
| amd64 | N/A | N/A | N/A | N/A |
| arm64 | Yes | Yes (`QEMUv7_checks`, `QEMUv8_checks`, `QEMUv8_checks_arm64`) | x86_64 host running QEMU-emulated Arm | Yes |
| riscv64 | Yes (5 `PLATFORM=` targets) | **No** | x86_64 host, cross-compile only, no execution | Build step is release-blocking (must compile); no test gating exists |

## 8. Distribution and Release Status

**No official binaries exist for OP-TEE on any architecture.** Direct fetch of [github.com/OP-TEE/optee_os/releases](https://github.com/OP-TEE/optee_os/releases) returns "There aren't any releases here" - zero GitHub Releases, zero assets, for any architecture. OP-TEE is versioned via git tags only, consistent with it being a source-built embedded TEE OS rather than a package with prebuilt binaries.

**Channel-by-channel checks:**
- PyPI: `https://pypi.org/pypi/op-tee/json`, `optee/json`, `optee-os/json` all return **HTTP 404** - no package exists under any plausible name (not a Python distribution model).
- Ubuntu 26.04 (resolute): searching for `op-tee` returns "Sorry, your search gave no results." The real package names (`optee-client-dev`, `optee-client-s32-dev`, `optee-os`, `optee-os-dev`, `optee-test-qemu`) exist but list architectures as **arm64, armhf only** across jammy, noble, questing, resolute, and the newer "stonking" suite - riscv64 does not appear for any of these packages in any suite.
- Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at)): no package named `op-tee` or `optee` exists in the index at all.
- RISE GitLab wheel mirror: proxies to the same absent PyPI package - nothing found.

**What a user must do to get a working riscv64 binary:** Build from source. There is no packaged distribution path for OP-TEE on riscv64 (or on any other architecture) - the only route is the manual `OP-TEE/build` repo-tool workflow (`make -f qemu_riscv64.mk`) described in Section 5, or a custom Yocto/Buildroot integration.

## 9. Dependencies

OP-TEE vendors third-party libraries under `lib/` and `core/lib/` rather than consuming them via a package manager. Of these, the ones matching crypto/compression/numerics categories are Mbed TLS, LibTomCrypt, and zlib.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Mbed TLS (`lib/libmbedtls/mbedtls`) | Primary software crypto backend | Packaged for riscv64 in Ubuntu 26.04 resolute (`libmbedtls21`/`libmbedtls-dev` v3.6.5-0.1ubuntu2) per direct package search (project-graph SPARQL query could not be run - see note below) | No open riscv64-specific test failures found in upstream tracker | Ships via normal Mbed TLS releases (arch-agnostic C) | No open riscv64 issues; not tracked in `project-reports/` |
| LibTomCrypt (`core/lib/libtomcrypt`) | Legacy/secondary crypto backend | Packaged for riscv64 in Ubuntu 26.04 resolute (`libtomcrypt1`/`libtomcrypt-dev` v1.18.2+dfsg-7build2) per direct package search | No open riscv64 issues found; one historical closed issue ([libtom/libtomcrypt#578](https://github.com/libtom/libtomcrypt/issues/578), cross-compile answer mismatch, closed) | Debian/Ubuntu-packaged, public domain | Not present in `projects.yml` at all |
| zlib (`core/lib/zlib`) | Compression | Packaged for riscv64 across Ubuntu/Debian/Arch RISC-V/Alpine per direct package search | Builds and passes cleanly wherever tested; no dedicated Linux riscv64 CI (only OpenBSD/riscv64 QEMU CI merged Jan 2026) | Source-only releases, arch-agnostic | Unmerged RVV-accelerated Adler32 PR ([madler/zlib#1099](https://github.com/madler/zlib/pull/1099)) sitting with zero maintainer response since Oct 2025 - performance gap only, not a build/test blocker; see `project-reports/zlib.md` for depth |

**Tooling caveat:** the `project-graph` MCP server (SPARQL-backed Ubuntu 26.04 package graph) failed to connect (`CONNECTION_CLOSED`) during research. The riscv64 package findings above come from direct `packages.ubuntu.com` lookups as a substitute and should be re-verified against the graph once it reconnects.

No dependency in this set has JIT, SIMD-hot-path, or numerics code whose riscv64 status changes OP-TEE's own grade - none carry an open riscv64 build or correctness blocker.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7985](https://github.com/OP-TEE/optee_os/issues/7985) | Request: RISC-V RV32 MMU and ldelf Support | Open (0 comments, filed 2026-09-03) | Functional gap | RV32 TAs build but cannot be loaded/validated on real hardware; no maintainer response yet |
| [#6075](https://github.com/OP-TEE/optee_os/issues/6075) | riscv smp interrupt context problem | Closed stale (2023-09-06), **unresolved** | **Correctness/architecture** | 43-comment design discussion; maintainer-suggested fix (a real RISC-V Secure Monitor layer) never shown implemented. Highlighted separately below. |
| [#7237](https://github.com/OP-TEE/optee_os/issues/7237) | core_mmu: riscv: Infinite recursion during `init_external_dt()` | Closed (fixed, 2025-01-28) | Correctness (resolved) | Infinite recursion via `phys_to_virt_tee_ram()`, introduced by commit `7c9b8543` |
| [#6213](https://github.com/OP-TEE/optee_os/issues/6213) | riscv on spike platform build failure | Closed (fixed) | Build (resolved) | `CLINT_BASE` undefined for spike |
| [#6245](https://github.com/OP-TEE/optee_os/issues/6245) | riscv on qemu platform build failure | Closed (fixed) | Build (resolved) | Illegal assembler operand in `thread_rv.S` |
| [#6173](https://github.com/OP-TEE/optee_os/issues/6173) | Introduce OpTEE complete solution for RISC-V | Closed stale (2023-08-26) | Reference discussion | De facto master tracking issue; no formal upstreaming decision recorded |
| [#7537](https://github.com/OP-TEE/optee_os/issues/7537) | Support for RISC-V Architecture | Closed not-planned (2025-10-28) | Reference discussion | Re-asks #6173's question, no maintainer follow-up before closing |

**Correctness bug highlighted separately:** [#6075](https://github.com/OP-TEE/optee_os/issues/6075) is the single most significant unresolved technical issue in this report. RISC-V's PLIC routes unhandled interrupts to M-mode; when a core executing TEE-world code takes a foreign interrupt, the M-mode monitor restores that core's REE context, but if the REE scheduler subsequently dispatches the same task to a *different* core, there is no mechanism to resume the suspended TEE context there - unlike arm64, where OP-TEE itself handles the trap and can resume any thread on any core via a thread-ID keyed RPC. The maintainer-proposed structural fix (a genuine RISC-V Secure Monitor layer, analogous to Arm's Monitor mode / TF-A BL31) was never shown as implemented in any source reviewed for this report.

## 12. Objections and Upstream Blockers

**Stated objections / technical blockers:**
- The SMP interrupt-context design gap ([#6075](https://github.com/OP-TEE/optee_os/issues/6075)) remains open with no committed fix - this is the reason SMP RISC-V configurations were not upstreamed wholesale after Nuclei's 2023 out-of-tree demonstration ([#6173](https://github.com/OP-TEE/optee_os/issues/6173)).
- PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) (QEMU riscv64 xtest CI) is blocked on three external cross-repo prerequisite PRs (`OP-TEE/manifest#353`, `jforissier/docker_optee_os_ci#1`, `OP-TEE/build#870`) that have not landed - an organizational/sequencing blocker, not a technical rejection.
- PR [#7980](https://github.com/OP-TEE/optee_os/pull/7980) (Zvkned/Zvkb AES acceleration) is explicitly self-described by its author as not-ready: missing three required entry points and hard-dependent on two other unmerged PRs (#7951, #7961) for FP/vector context switching.
- PR [#7872](https://github.com/OP-TEE/optee_os/pull/7872) ("Riscv fp state ctx") was closed unmerged by its own author, citing scope drift, and re-opened as a fresh PR - indicating churn in the FP/vector context-switch design that both #7927's test infrastructure and #7980's crypto work ultimately depend on.

**Organizational blockers:** None found beyond the sequencing dependencies above; no maintainer statement rejecting RISC-V or declaring it unsupported was found in any source.

**Acceptance probability:** High for incremental, well-scoped patches (evidenced by 250 total matching commits landing continuously since 2021, and PRs #6705/#6076/#5731/#5714/#6913 all merging cleanly with maintainer Acked-by/Reviewed-by tags). Lower in the near term for the two "next big steps" - QEMU xtest CI (#7927) and vector-crypto acceleration (#7980) - both of which are gated on prerequisite work outside this repo or still in flux.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** none
- **Justification:** Upstream CI builds RISC-V for five platform targets on every push/PR ([`.github/workflows/ci.yml`](https://github.com/OP-TEE/optee_os/blob/master/.github/workflows/ci.yml), matrix entry `riscv`, lines 347-356) but does not execute the resulting binaries - no QEMU boot, no `xtest` run - unlike the arm64 side, which has dedicated `QEMUv7_checks`/`QEMUv8_checks` functional-test jobs. Per the color model's CI evidence rule, build-only CI sets the primary color to yellow regardless of code maturity. No upstream release artifact exists for riscv64 or any other architecture ([github.com/OP-TEE/optee_os/releases](https://github.com/OP-TEE/optee_os/releases) has zero releases), so `release_provider` is `none` rather than `upstream`. OP-TEE is a TEE OS, not an optimization-purpose project (its value proposition is correct isolation/security semantics, not raw speed), so the Step 2 optimization modifier does not apply and no optimization level is assigned.
- **Pending work that could change the grade:** PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) ("ci: enable QEMU RISC-V64 xtest workflow") would add real test execution and could move this to blue once merged - it is currently open, blocked on three external cross-repo prerequisite PRs. RISE's tracking issue ([riseproject-dev/security-software-wg#1](https://github.com/riseproject-dev/security-software-wg/issues/1)) lists CI support for QEMU RV64 virt as an explicit in-scope goal but carries milestone "future" with no completion date and no comments recorded. The unresolved SMP interrupt-context design gap ([#6075](https://github.com/OP-TEE/optee_os/issues/6075)) would need a structural fix before SMP-capable RISC-V configurations could be considered fully mature regardless of CI color.

## 14. Investment Analysis

RISE has already opened a tracking issue ([riseproject-dev/security-software-wg#1](https://github.com/riseproject-dev/security-software-wg/issues/1)) scoping OP-TEE-on-RISC-V work (PoC on QEMU virt + Andes AE350, MPXY/RPMI domain context switching, CI, U-Boot integration, dynamic shared memory) and maintains a GitLab fork set (`gitlab.com/riseproject/riscv-optee`: optee_os, optee_build, opensbi, u-boot, linux, buildroot), but the `optee_build` repo shows only 1 commit - this is PoC-stage scoping, not delivered work. The sizing below assumes none of the items are complete and should be adjusted downward once RISE's actual delivered output against that tracking issue is confirmed.

### 14.1 Functional Enablement
- Implement a genuine RISC-V Secure Monitor layer to resolve the SMP foreign-interrupt/cross-core resume gap ([#6075](https://github.com/OP-TEE/optee_os/issues/6075)) - the largest unresolved architectural item.
- Add MMU + ldelf support for RV32 ([#7985](https://github.com/OP-TEE/optee_os/issues/7985)) so `ta_rv32` TAs can actually load on real hardware.
- Land the FP/vector context-switch prerequisite PRs (#7951, #7961) that both the CI test workflow discussion and the AES acceleration work depend on.

### 14.2 Performance Optimization
- Complete and land PR [#7980](https://github.com/OP-TEE/optee_os/pull/7980) (Zvkned/Zvkb AES acceleration) - requires the three missing entry points (`crypto_accel_aes_xts_enc()`, `crypto_accel_aes_dec()`, `crypto_accel_aes_expand_keys()`) plus its FP/vector context-switch dependencies.
- No RVV code exists anywhere in the tree today - any broader vector-acceleration investment (beyond AES) starts from zero.

### 14.3 CI/CD Infrastructure
- Land PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) and its three external prerequisites (`OP-TEE/manifest#353`, `jforissier/docker_optee_os_ci#1`, `OP-TEE/build#870`) to get QEMU riscv64 xtest execution into CI - this is the single highest-leverage item to move the color from yellow to blue.
- No RISE RISC-V Runners integration exists for OP-TEE specifically; evaluate whether native riscv64 runners would benefit this workflow once QEMU xtest is merged.

### 14.4 Ecosystem Enablement
Not applicable - OP-TEE has no dependent package ecosystem (Section 10 omitted; see below).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Design and implement RISC-V Secure Monitor layer to fix SMP interrupt-context resume gap ([#6075](https://github.com/OP-TEE/optee_os/issues/6075)) | [NEEDS VERIFICATION] - no sizing data found in sources | Unassigned (maintainers proposed direction, no owner) | Critical |
| Functional | RV32 MMU + ldelf support ([#7985](https://github.com/OP-TEE/optee_os/issues/7985)) | [NEEDS VERIFICATION] | Unassigned | Medium |
| CI/CD | Merge PR [#7927](https://github.com/OP-TEE/optee_os/pull/7927) plus 3 external prerequisite PRs (QEMU riscv64 xtest CI) | [NEEDS VERIFICATION] | raymo200915 (RISCstar), gated on manifest/build/docker-image maintainers | High |
| Performance | Land FP/vector context-switch PRs #7951/#7961, then complete Zvkned/Zvkb AES acceleration ([#7980](https://github.com/OP-TEE/optee_os/pull/7980)) | [NEEDS VERIFICATION] | dave-patel-riscstar (RISCstar Solutions) | Medium |
| Release | Establish any riscv64 packaging/release channel (none exists for OP-TEE on any architecture today) | [NEEDS VERIFICATION] | Unassigned | Low (matches existing all-architecture practice, not riscv64-specific) |

Data not available for person-week estimates on any item above: no sizing/effort figures were found in any searched source (GitHub issues/PRs, RISE tracking issue, RISC-V International blog, RISC-V Summit Europe proceedings). All effort figures are marked [NEEDS VERIFICATION] pending direct estimation from engineers familiar with the OP-TEE codebase.

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [OP-TEE/optee_os repository](https://github.com/OP-TEE/optee_os)
- [OP-TEE documentation](https://optee.readthedocs.io)
- [Issue #6173 - Introduce OpTEE complete solution for RISC-V](https://github.com/OP-TEE/optee_os/issues/6173)
- [Issue #7537 - Support for RISC-V Architecture](https://github.com/OP-TEE/optee_os/issues/7537)
- [Issue #6075 - riscv smp interrupt context problem](https://github.com/OP-TEE/optee_os/issues/6075)
- [Issue #7985 - Request: RISC-V RV32 MMU and ldelf Support](https://github.com/OP-TEE/optee_os/issues/7985)
- [Issue #7237 - core_mmu: riscv: Infinite recursion during init_external_dt()](https://github.com/OP-TEE/optee_os/issues/7237)
- [Issue #6213 - riscv on spike platform build failure](https://github.com/OP-TEE/optee_os/issues/6213)
- [Issue #6245 - riscv on qemu platform build failure](https://github.com/OP-TEE/optee_os/issues/6245)
- [Issue #6704 - Add RISC-V build to CI](https://github.com/OP-TEE/optee_os/issues/6704)
- [PR #7980 - core: riscv: accelerate AES with Zvkned/Zvkb vector crypto extension](https://github.com/OP-TEE/optee_os/pull/7980)
- [PR #7927 - ci: enable QEMU RISC-V64 xtest workflow](https://github.com/OP-TEE/optee_os/pull/7927)
- [PR #7872 - Riscv fp state ctx](https://github.com/OP-TEE/optee_os/pull/7872)
- [PR #6913 - VSCode: Enable Development inside Docker Container](https://github.com/OP-TEE/optee_os/pull/6913)
- [PR #6705 - Add RISC-V build to CI](https://github.com/OP-TEE/optee_os/pull/6705)
- [PR #6076 - RISC-V: Implement TA stack unwinding](https://github.com/OP-TEE/optee_os/pull/6076)
- [PR #5731 - riscv: kernel: add makefiles/linker scripts](https://github.com/OP-TEE/optee_os/pull/5731)
- [PR #5714 - riscv: kernel: initial thread management routines](https://github.com/OP-TEE/optee_os/pull/5714)
- [PR #5606 - A set of commits to start compiling for RISC-V](https://github.com/OP-TEE/optee_os/pull/5606)
- [PR #5080 - optee_os risc-v port](https://github.com/OP-TEE/optee_os/pull/5080)
- [PR #4240 - ldelf: Add CFG_TA_PIE](https://github.com/OP-TEE/optee_os/pull/4240)
- [.github/workflows/ci.yml (master, riscv matrix entry)](https://github.com/OP-TEE/optee_os/blob/master/.github/workflows/ci.yml)
- [GitHub Releases page for optee_os (zero releases)](https://github.com/OP-TEE/optee_os/releases)
- [PyPI op-tee package lookup (404)](https://pypi.org/pypi/op-tee/json)
- [Ubuntu resolute package search for OP-TEE](https://packages.ubuntu.com/search?keywords=OP-TEE&suite=resolute&searchon=names&section=all)
- [libtom/libtomcrypt#578 - RISC-V cross-compile issue (closed)](https://github.com/libtom/libtomcrypt/issues/578)
- [madler/zlib#1099 - RVV-accelerated Adler32 (unmerged)](https://github.com/madler/zlib/pull/1099)
- [riseproject-dev/security-software-wg Issue #1 - OP-TEE support tracking](https://github.com/riseproject-dev/security-software-wg/issues/1)
- [RISE Project blog - Advancing OpenSBI Interrupt Handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISC-V International blog - Towards Generic RISC-V TEE Ecosystem with Penglai and OP-TEE](https://riscv.org/blog/towards-generic-risc-v-tee-ecosystem-with-penglai-and-op-tee/)
- [linaro-swg/optee_benchmark](https://github.com/linaro-swg/optee_benchmark)
- [optee_test benchmark_1000.c](https://github.com/OP-TEE/optee_test/blob/master/host/xtest/benchmark_1000.c)
- [RISC-V Summit Europe 2025 abstract P3.2.04 (Cunha et al.)](https://riscv-europe.org/summit/2025/media/proceedings/2025-05-14-RISC-V-Summit-Europe-P3.2.04-CUNHA-abstract.pdf)
- [TrustedFirmware.org membership](https://www.trustedfirmware.org/join/)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/)
- [RISE Runners service](https://riscv-runners.riseproject.dev/)
