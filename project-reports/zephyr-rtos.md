---
title: Zephyr RTOS
parent: Project Reports
color: yellow
dependencies:
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: optional
  - name: TF-PSA-Crypto
    relation: runtime-dependency
    criticality: optional
  - name: mldsa-native
    relation: runtime-dependency
    criticality: optional
  - name: mcuboot
    relation: runtime-dependency
    criticality: optional
  - name: CMSIS-DSP
    relation: runtime-dependency
    criticality: optional
  - name: CMSIS-NN
    relation: runtime-dependency
    criticality: optional
  - name: picolibc
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="zephyr-rtos" %}

# Zephyr RTOS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Zephyr RTOS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Zephyr RTOS is a real-time operating system for resource-constrained and embedded systems, hosted by the **Linux Foundation** under the Apache 2.0 license, governed by a Technical Steering Committee (TSC). It is a source-distributed, build-yourself RTOS: applications are compiled and linked against Zephyr per target board using the `west` meta-tool, CMake, and the Zephyr SDK toolchain, rather than consumed as a prebuilt binary or system package.

Corporate membership spans three tiers ([zephyrproject.org/members](https://zephyrproject.org/members)):
- **Platinum (15):** Analog Devices, Antmicro, CARIAD SE, Carl Zeiss AG, Google, Infineon, Intel, Meta, Nordic Semiconductor, NXP, Qualcomm, Renesas, Silicon Labs, Texas Instruments, Wind River.
- **Silver (46, selected):** Arm, Arduino, BayLibre, Canonical, Linaro, Microchip Technology, Percepio, Realtek, STMicroelectronics, Synopsys, Tenstorrent.
- **Associate (11):** BeagleBoard.org, Eclipse Foundation, FIWARE Foundation, RISC-V International, several universities/research institutes.

RISC-V-relevant maintainer companies identified in `MAINTAINERS.yml`: Andes Technology, Microchip, Antmicro, Espressif, Qualcomm, and Intel (original architecture owners, still top committers on core arch code).

Community culture toward new architecture/board ports is explicitly low-friction: documentation states "If you want to contribute your board to Zephyr, first, thanks!" and directs contributors to a dedicated Architecture Porting Guide with technical (devicetree/Kconfig/test/doc) rather than committee-gatekept requirements. This is consistent with how RISC-V went from a bare architecture stub (January 2017) to dozens of active vendor SoC families today.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-12-15 | Commit `bfcdfaf` (Anas Nashif, Intel) references "riscv" in sanitycheck architecture recognition, before the real port lands | [Zephyr history, per repository research] |
| 2017-01-11 | Commit `cd83e85`, "arch: added support for the riscv32 architecture", authored by Jean-Paul Etienne | Repository commit history |
| 2017-01-13 | `cd83e85` merged by Andrew Boie (Intel); companion commits same day add the `qemu_riscv32` board and RISC-V QEMU timer/UART drivers, also by Jean-Paul Etienne | Repository commit history |
| 2019-06-13 | Issue [#16814](https://github.com/zephyrproject-rtos/zephyr/issues/16814), "support for RISCV64 and SMP", opened by thomascp, referencing a working fork on Renode-emulated HiFive Unleashed (v1.14 branch) | [Issue #16814](https://github.com/zephyrproject-rtos/zephyr/issues/16814) |
| Late 2019 | Zephyr 2.0 released, first release with native 32-bit and 64-bit RISC-V + SMP support; issue #16814 closed | [Zephyr docs: RISC-V architecture support](https://docs.zephyrproject.org/latest/hardware/arch/risc-v.html), [Zephyr blog: "When 32 bits isn't enough"](https://www.zephyrproject.org/when-32-bits-isnt-enough-porting-zephyr-to-riscv64/) |
| 2026-03-18 | Issue #105775 ("add Supervisor mode (S-mode) and in-tree SBI runtime support") closed via associated PR work | [Issue #105775](https://github.com/zephyrproject-rtos/zephyr/issues/105775) |
| 2026-07-16 | PR [#113656](https://github.com/zephyrproject-rtos/zephyr/pull/113656), "Add S-mode only support (external SBI)", merged | PR #113656 |
| 2026-09-08 (report cutoff) | PRs #105403 (MMU/Sv39/Sv48), #117751 (SMP via OpenSBI), #115702 (SMP boot race fix) remain open, unmerged | Verified via git-ref inspection against live clone, see Section 12 |

**Key contributors and organizations:** Jean-Paul Etienne (original riscv32 port author), Andrew Boie and Anas Nashif (Intel, original merge/CI integration), kgugala, tgorochowik, fkokosinski (assignees on the riscv64+SMP tracking issue #16814 and on nearly every current architecture-level RISC-V issue). **fkokosinski** is identified as the recurring, effectively sole reviewer/gatekeeper across all three major open RISC-V PRs (#105403, #117751, #115702) as of 2026-09-08 (see Section 12).

**Is it fully upstream?** Yes. RISC-V (32-bit and 64-bit) has been natively supported in mainline Zephyr since the 2.0 release (2019); there is no out-of-tree fork requirement. Current work (MMU, S-mode/SBI-based SMP, cache management, PLIC-based IPI, RVV) is incremental hardening of an already-mainlined port, tracked via individual issues rather than a master tracking issue.

## 3. Upstream Support Tier

Zephyr defines four formal hardware support tiers ([documented policy referenced in research findings]):
- **Tier 0 - Emulation platforms:** built and run in CI; a Tier 0 QEMU platform is required for every new architecture.
- **Tier 1 - Supported platforms:** a named team commits to device testing (Twister) and bug-fixing before releases; general commercial availability required.
- **Tier 2 - Community platforms:** a dedicated maintainer responds to issues/reviews patches, no testing/availability commitment.
- **Tier 3 - Deprecated platforms:** unowned or unresponsive, candidates for removal.

`qemu_riscv64` satisfies the Tier 0 requirement (it is exactly the platform used to validate the original riscv64+SMP port). Data not available: whether any specific riscv64 hardware board (SiFive HiFive Unleashed/Unmatched, Microchip PolarFire Icicle, BeagleV-Fire) has been formally elevated to Tier 1 with a named commercial-availability commitment; the research performed did not locate a Tier assignment table for individual boards.

Official binaries: none for any architecture, including riscv64. Zephyr does not publish prebuilt release binaries; GitHub Releases contain only auto-generated source `.zip`/`.tar.gz` archives (confirmed via the releases Atom feed showing latest release v4.4.2, 2026-08-07; per-asset filename confirmation was blocked by tooling restrictions, but this is consistent with Zephyr's documented build-yourself model for every architecture).

Release-blocking status of riscv64 CI: data not available. The only riscv64-referencing workflow (`hello_world_multiplatform.yaml`) is path-filtered to `scripts/**`/`SDK_VERSION` changes; whether it (or an unseen board-metadata-driven riscv64 path inside `twister.yaml`) is a required merge check could not be confirmed from the workflow files read.

**Comparison table: amd64 vs arm64 vs riscv64**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI hardware runner | Data not available (host runners in `hello_world_multiplatform.yaml` include `ubuntu-24.04`, which is x86_64, run natively) | Data not available (matrix includes `ubuntu-24.04-arm`, run natively) | None found anywhere in `.github/workflows/` (44 files checked); riscv64 always runs under QEMU emulation |
| Tier 0 QEMU platform | `native_sim`, `qemu_cortex_m3` referenced in the same smoke-test workflow (implies x86-class emulation target exists) | Data not available beyond the same workflow reference | `qemu_riscv64` confirmed present and used |
| Official upstream binaries | None (source-built for all architectures) | None | None |
| Release model | Build-yourself via west/CMake/Zephyr SDK, uniform across all architectures | Same | Same |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Zephyr's RISC-V port (`arch/riscv/`, 74 files, 8,407 lines in core+include, verified by direct clone at commit `bc2caf20dd0c7ca6c95c0dae66fd1ccb0e7e6147`) is mature and complete for scalar RV32/RV64:

| Subsystem | File(s) | Lines | Status |
|---|---|---|---|
| PMP (MPU equivalent) | `core/pmp.c`, `core/pmp.S`, `include/pmp.h` | 1328+116+35 | Complete |
| Trap/interrupt entry, syscall (`ecall`) | `core/isr.S` | 961 | Complete |
| ELF relocation for `llext` loadable-extension loader | `core/elf.c` | 534 | Complete - Zephyr's nearest analog to a dynamic loader/JIT backend; scalar-only |
| FPU (F/D) context save/restore | `core/fpu.c`, `core/fpu.S` | 485+69 | Complete |
| In-tree M-mode SBI runtime (S-mode support) | `core/sbi.S` | 221 | Complete (new; backs `CONFIG_RISCV_S_MODE`) |
| SMP secondary-core startup, per-CPU init | `core/smp.c` | 108 | Complete, but see open correctness bugs (Section 6, 11) |
| IPI via CLINT | `core/ipi_clint.c`, `core/ipi.c` | 101+14 | Complete for CLINT; no PLIC-routed IPI (issue #78917, open) |
| Vendor custom extensions (T-Head Xtheadcmo, Andes PMA/HSP, VexRiscv cache ops) | `arch/riscv/custom/*` | ~1,000 combined | Complete |

**Headline finding: no RVV (Vector extension) support.** Confirmed via GitHub code search for `vfloat32m1_t` (0 hits), `rvv` (13 hits, all false positives - unrelated substrings), and a full read of `arch/riscv/Kconfig.isa` (358 lines enumerating every ISA extension the port understands: base I/E, M, A, F, D, Q, G, C plus sub-extensions, Zicntr, Zicsr, Zifencei, Smcsrind, Zba, Zbb, Zbc, Zbkb, Zbs, Zmmul, Smaia/Ssaia, Zk, Zks). **There is no `RISCV_ISA_EXT_V` entry at all.** A repo-wide grep for `vfloat32|vint32|__riscv_v_intrinsic|riscv_vector\.h|vsetvli` found no match anywhere in the tree.

No JIT backend exists in Zephyr (it is a statically-linked RTOS), so this is not applicable as a comparison axis.

**Comparison table: amd64 vs arm64 vs riscv64 (architecture-specific code)**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MPU/memory protection | Data not available (not researched) | Data not available (not researched) | PMP, complete |
| MMU/paging | Data not available | Data not available | Absent - PR #105403 (Sv39/Sv48) open, unmerged |
| Vector/SIMD | Data not available | Data not available | Absent - no RVV support anywhere in the codebase |
| DSP/NN inference kernels (CMSIS-DSP/CMSIS-NN, as linked dependencies) | N/A (Arm-only libraries) | Native intrinsics-based support (structural, Arm-only design) | No backend exists upstream in CMSIS-DSP/CMSIS-NN; RISC-V targets using these modules have no accelerated path (structural ecosystem gap, not a Zephyr-arch defect) |
| S-mode/supervisor execution | Data not available | Data not available | New in-tree SBI runtime (`core/sbi.S`); full S-mode-only (hypervisor-style) execution still open (#52806) |

## 5. Build System, Cross-Compilation, and Toolchain

Verified against a clone at commit `bc2caf20dd0c7ca6c95c0dae66fd1ccb0e7e6147` (VERSION 4.4.99-dev, `SDK_VERSION` 1.0.1).

**Host dependencies** (`doc/develop/getting_started/index.rst`): CMake >= 3.28.0, Python >= 3.12, devicetree compiler (dtc) >= 1.4.6.

**Setup/build commands:**
```bash
python3 -m venv ~/zephyrproject/.venv
source ~/zephyrproject/.venv/bin/activate
pip install west
west init -m https://github.com/zephyrproject-rtos/zephyr ~/zephyrproject
cd ~/zephyrproject
west update
west packages pip --install
west zephyr-export
west sdk install
west build -p always -b qemu_riscv64 samples/hello_world
west build -t run
```

**Toolchain:** `riscv64-zephyr-elf` triple, selected via `ZEPHYR_TOOLCHAIN_VARIANT=zephyr`, installed by `west sdk install`. This checkout pins Zephyr SDK **1.0.1**, which per the SDK release notes bundles **GCC 14.3.0** (Zephyr-patched) and **LLVM/Clang 19.1.7** (Zephyr-patched) for `riscv64-zephyr-elf`. `boards/qemu/riscv64/doc/index.rst` states the historical minimum SDK for RISC-V64+QEMU support is v0.10.2.

**Why these versions:** `cmake/compiler/gcc/target_riscv.cmake` (line ~142-146) gates the `Zmmul` ISA extension flag behind `GCC_COMPILER_VERSION >= 13.0.0`; GCC's `limits.h`/`include-fixed` header layout changed at GCC 13.1.0, requiring a version-probe workaround in `cmake/compiler/gcc/target.cmake` (this is a general GCC-version workaround, not riscv-specific). No hard Clang minimum is enforced in-tree for riscv64.

**`-march`/`-mabi` construction** (`cmake/compiler/gcc/target_riscv.cmake`): built dynamically from Kconfig (`CONFIG_64BIT`, `CONFIG_RISCV_ISA_EXT_*`, `CONFIG_FPU`, `CONFIG_RISCV_CMODEL_*`), yielding e.g. `-mabi=lp64[d] -march=rv64i[m][a][f][d][c]..._zicsr..._xtheadxxx -mcmodel=medlow|medany|large`.

**QEMU boards** (`boards/qemu/riscv64/`): `qemu_riscv64` (plain M-mode), `qemu_riscv64/qemu_virt_riscv64/smode` (S-mode), `.../opensbi` (S-mode with external OpenSBI), `.../smp` (2-hart SMP). All builds route through the CMake `run_qemu` target, never a raw direct QEMU invocation from `west` itself.

**Known build-relevant flags:** `CONFIG_XIP=n` (QEMU RAM-loads the image), `CONFIG_QEMU_ICOUNT=n` (SMP timing), `CONFIG_RISCV_S_MODE`/`CONFIG_RISCV_S_MODE_EXTERNAL_SBI` (boot-mode toggles), `CONFIG_SHELL_BACKEND_SERIAL_INTERRUPT_DRIVEN=n` forced off in S-mode/OpenSBI variants (PLIC-context mismatch breaks interrupt-driven UART TX), `CONFIG_QEMU_DEVICE_LOADER=y` (multi-core ELF entry-point loading).

**Known build failures:** issue [#93708](https://github.com/zephyrproject-rtos/zephyr/issues/93708) documents that boards declaring `CONFIG_CPU_HAS_ICACHE`/`CONFIG_CPU_HAS_DCACHE` fail to build on RISC-V because no `arch_dcache_*`/`arch_icache_*` implementation exists in the architecture layer.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (cannot do X at all on riscv64 today):**
- No MMU/virtual memory (issue [#81717](https://github.com/zephyrproject-rtos/zephyr/issues/81717); PMP-based MPU only) - PR [#105403](https://github.com/zephyrproject-rtos/zephyr/pull/105403) (Sv39/Sv48 + S-mode SBI) is open but unmerged, and its author states it lacks SMP TLB shootdown, demand paging, and huge pages even once merged.
- No cache-management API (issue [#93708](https://github.com/zephyrproject-rtos/zephyr/issues/93708)) - causes build failures on boards declaring cache-capability Kconfig options; PR [#117598](https://github.com/zephyrproject-rtos/zephyr/pull/117598) (Zicbom cache management) is the in-flight fix, open, unmerged.
- No full supervisor-mode-only execution path needed for hypervisors like Bao (issue [#52806](https://github.com/zephyrproject-rtos/zephyr/issues/52806)).
- SMP IPI only supported via CLINT; PLIC-routed IPI unsupported (issue [#78917](https://github.com/zephyrproject-rtos/zephyr/issues/78917)) - PR [#117751](https://github.com/zephyrproject-rtos/zephyr/pull/117751) (SMP via OpenSBI) addresses this class of gap, open, changes requested.
- No RVV (vector) extension support at all (issue [#82131](https://github.com/zephyrproject-rtos/zephyr/issues/82131); confirmed absent in Section 4).
- `llext` (loadable extensions) does not support user-space threads on RISC-V (issue [#88507](https://github.com/zephyrproject-rtos/zephyr/issues/88507)).
- NVMe-over-PCIe fails under `qemu-system-riscv64` (issue [#76308](https://github.com/zephyrproject-rtos/zephyr/issues/76308)).

**Performance gaps (from missing SIMD/optimized paths):**
- No RVV means no vector-accelerated numeric or crypto kernels; dependencies that could use RVV (TF-PSA-Crypto, mldsa-native) fall back to portable scalar C on riscv64 (see Section 9).
- Issue [#96503](https://github.com/zephyrproject-rtos/zephyr/issues/96503) ("mcause handling inefficient") and [#96548](https://github.com/zephyrproject-rtos/zephyr/issues/96548) ("floating point exceptions checked on interrupt path") document hot-path inefficiencies in the trap/interrupt-exit path specific to RISC-V; issue [#96553](https://github.com/zephyrproject-rtos/zephyr/issues/96553) proposes rewriting `isr.S` in C to make it more maintainable/optimizable.
- Issue [#96551](https://github.com/zephyrproject-rtos/zephyr/issues/96551) ("Floating point decoding can be accelerated") was closed 2026-08-27 by collapsing a branch-heavy FP decoder in the exception path.

**Security hardening gaps:**
- No MMU means no full address-space isolation between memory domains beyond what PMP slots provide (issue #81717).
- Two open SMP-boot correctness/race bugs: [#113866](https://github.com/zephyrproject-rtos/zephyr/issues/113866) (global stack-pointer race with no memory barrier across harts under RVWMO) and [#113281](https://github.com/zephyrproject-rtos/zephyr/issues/113281) (secondary-hart hartid-lookup mismatch silently falls back to CPU 0). Both are documented as timing-dependent and not reliably reproducible under QEMU - they would surface on real weakly-ordered hardware. Fix PR [#115702](https://github.com/zephyrproject-rtos/zephyr/pull/115702) is open, changes requested.
- Issue [#101252](https://github.com/zephyrproject-rtos/zephyr/issues/101252) ("Remove lazy stacking for RISC-V") notes lazy FP stacking causes compatibility/correctness edge cases in illegal-instruction trap decoding.

**NaN / floating-point semantics:** Data not available - targeted search for NaN-canonicalization issues found none; the closest matches are the FPU-exception-handling and lazy-stacking issues listed above, which concern trap-path correctness/performance, not IEEE-754 NaN semantics specifically.

## 7. CI/CD Infrastructure

**Direct verification** (grep of all 44 `.github/workflows/*.yml` files, 4,156 total lines, at commit `bc2caf2`, case-insensitive for `riscv`/`risc-v`): only **2 of 44** files mention riscv anywhere, in exactly **3 lines total**:

1. **`hello_world_multiplatform.yaml`** - triggers on `push`/`pull_request` to `main`, `v*-branch`, `collab-*`, **path-filtered to `scripts/**`, this workflow file, and `SDK_VERSION`**. Runs on `ubuntu-24.04`, `ubuntu-24.04-arm`, `macos-14`, `windows-2025` host runners (matrix) - no riscv64 hardware runner anywhere. Installs toolchain `arm-zephyr-eabi:riscv64-zephyr-elf` and runs `west twister -p native_sim -p qemu_cortex_m3 -p qemu_riscv32 -p qemu_riscv64 ... -T samples/hello_world -T samples/cpp/hello_world`. This builds and boots two sample apps under QEMU emulation and checks output - real execution, not pure cross-compile, but scoped to exactly two sample applications and gated to fire only when tooling/script files change, **not** when `arch/riscv/`, drivers, or SoC source changes.
2. **`twister_tests_blackbox.yml`** - `pull_request`-only, path-filtered to `scripts/pylib/twister/**`, `scripts/twister`, `scripts/tests/twister_blackbox/**`, this workflow file. Runs on `ubuntu-24.04` (x86, single runner). Installs `riscv64-zephyr-elf` purely to test the **twister Python tool itself** via `pytest ./scripts/tests/twister_blackbox/`, not Zephyr's RISC-V architecture code.

**The main always-on CI gate, `twister.yaml`** (runs on every `push`/`pull_request`/weekly schedule, no path filter - the workflow that actually gates general PRs) **contains zero occurrences of "riscv" in its 403 lines**. It delegates platform selection to `scripts/ci/test_plan_v2.py` and per-board metadata files that live outside `.github/workflows/` and were not fetched or verified. **Whether `qemu_riscv64` is actually included in a given PR's test subset cannot be determined from the workflow YAML alone.**

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

**RISE runners:** no tie between the RISE RISC-V Runners (`riscv-runner` repo, `runs-on: ubuntu-24.04-riscv`, bare-metal Scaleway EM-RV1 hardware) and Zephyr CI/build jobs was found; RISE runners are a generic free CI service, unconnected to this project.

**Conclusion (adversarial-verification finding):** the claim "riscv64 CI exists" as a general, always-on, architecture-level test gate is **refuted** by direct file inspection. What is substantiated: a narrow, path-gated QEMU build+run smoke test of two sample apps that does not trigger on RISC-V architecture-code changes, plus a toolchain-install step used only to test the twister tool itself. No dedicated riscv64 hardware runner exists anywhere.

**Comparison table: amd64 vs arm64 vs riscv64 (CI infrastructure)**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native host runner in observed workflows | `ubuntu-24.04` (native) | `ubuntu-24.04-arm` (native) | None found (always QEMU-emulated) |
| Coverage in the always-on main gate (`twister.yaml`) | Data not available (no arch string appears at all; delegated to `test_plan_v2.py`) | Same | Same - not confirmable from workflow files |
| Scope of the only riscv-referencing workflow | Same narrow 2-sample smoke test (shared matrix) | Same narrow 2-sample smoke test (shared matrix) | Same narrow 2-sample smoke test, plus riscv64-elf toolchain install in a second, twister-tooling-only workflow |
| Dedicated architecture hardware runner | Data not available | Data not available | Confirmed absent |

## 8. Distribution and Release Status

- **GitHub Releases:** latest release `v4.4.2` (2026-08-07, bugfix/security release, per the releases Atom feed). Releases carry only GitHub's auto-generated source `.zip`/`.tar.gz` archives; Zephyr does not publish prebuilt architecture-specific binaries for any architecture, riscv64 included, because it is a build-yourself RTOS. Per-asset filename confirmation for the 5 most recent releases was blocked by session tooling restrictions (repo not attached with API access, WebFetch cannot execute the client-side JS that renders GitHub's asset list), but this is consistent with, not contradicted by, the project's documented distribution model.
- **PyPI:** `https://pypi.org/pypi/zephyr-rtos/json` returns HTTP 404 - no such package exists. Confirmed independently by two separate research passes.
- **RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/zephyr-rtos/` redirects to the same 404 PyPI page - no package there either.
- **Ubuntu 26.04 ("resolute"):** `https://packages.ubuntu.com/search?keywords=Zephyr%20RTOS&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results." No package by this name exists in any section, for any architecture.
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=zephyr%20rtos)): no results found.
- **Project-graph MCP (Ubuntu/Debian package graph):** could not be queried for this project - the connector failed to connect (`CONNECTION_CLOSED`) for the entire research session. This is a tooling outage, not confirmed evidence of package absence, and should be retried.

**What a user must do to get a working binary:** build it themselves. Install the host dependencies and Zephyr SDK (Section 5), `west init`/`west update` the manifest, then `west build -b qemu_riscv64 samples/hello_world` (or a real hardware board target such as `sifive_hifive_unleashed` or `microchip_mpfs_icicle`), then flash or run under QEMU. There is no "download a riscv64 binary" path for Zephyr itself, for any architecture - this is expected given the project's model, not a riscv64-specific deficiency.

## 9. Dependencies

Zephyr's manifest is `west.yml` (verified via clone at `bc2caf20`), not `CMakeLists.txt`/`setup.py`/`package.json`. The table below covers critical crypto/numerics/allocator-relevant modules identified in `west.yml`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| [mbedtls](https://github.com/Mbed-TLS/mbedtls) | TLS + crypto module | Architecture-generic C, no arch-gated code paths for RV64; builds in practice | No riscv64-specific CI gap found; only related issue is old/closed (#3066, 32-bit RV `gettimeofday()` overflow, fixed 2022) | No riscv64-specific release blocker | No accelerated (SIMD/crypto-extension) backend for RISC-V; only x86/AArch64 accelerated paths exist |
| [TF-PSA-Crypto](https://github.com/Mbed-TLS/TF-PSA-Crypto) | PSA crypto engine (mbedtls's actual primitive implementation) | Portable C reference builds/runs on riscv64 | No RVV-accelerated crypto backend | No release blocker | **Open, tracked:** [issue #611](https://github.com/Mbed-TLS/TF-PSA-Crypto/issues/611), "Support crypto in RISC-V platform" (RVV Zvk* acceleration request), labeled help-wanted, unassigned, no PR as of 2026-09-08 |
| [mldsa-native](https://github.com/pq-code-package/mldsa-native) | Post-quantum ML-DSA (FIPS 204) signatures | Portable C implementation | **Actively tested on riscv64 in upstream CI**: [issue #1185](https://github.com/pq-code-package/mldsa-native/issues/1185) (RISC-V64 RVV per-VLEN test matrix, closed/completed), [issue #624](https://github.com/pq-code-package/mldsa-native/issues/624) (RISCV32 cross tests, closed/completed); uses a RISE riscv64 hardware CI runner ([issue #1056](https://github.com/pq-code-package/mldsa-native/issues/1056), closed, was a temporary `apt-get`/dpkg-lock flake) | No blocker | Explicitly noted (issue #1322 comment, 2026-07): "there is no RVV backend in mldsa-native" - runs portable C on riscv64 today, unlike its SLOTHY-optimized Armv7-M/Armv8.1-M assembly |
| [mcuboot](https://github.com/mcu-tools/mcuboot) | Zephyr's bootloader, depends on mbedtls/tinycrypt/PSA crypto | No riscv64-labeled open issues found | RV32 (Espressif ESP32-C3) activity exists and is resolved ([issue #1866](https://github.com/mcu-tools/mcuboot/issues/1866), closed); riscv64-specific activity is comparatively thin vs. Cortex-M/Espressif RV32 | None open | General Cortex-M/Espressif bias in issue volume suggests riscv64 (specifically 64-bit) is less exercised than RV32 |
| [CMSIS-DSP](https://github.com/ARM-software/CMSIS-DSP) | SIMD/numerics DSP kernels | N/A by design - Arm-only, no RISC-V implementation upstream | 0 riscv64 issues found | Not published for riscv64 | Structural ecosystem gap, not a bug: Zephyr targets using CMSIS-DSP on riscv64 have no accelerated path |
| [CMSIS-NN](https://github.com/ARM-software/CMSIS-NN) | SIMD/numerics NN inference kernels | Same - Arm-only | 0 riscv64 issues found | Same | Same structural gap as CMSIS-DSP |
| [picolibc](https://github.com/picolibc/picolibc) | Embedded libc / heap allocator, Zephyr's default libc for many targets | RISC-V (32/64) is a first-class, actively maintained target (`scripts/cross-riscv64-*.txt` exist and are exercised) | Multiple riscv-labeled issues, mostly toolchain/codegen edge cases: [#1086](https://github.com/picolibc/picolibc/issues/1086) (closed, toolchain issue), [#819](https://github.com/picolibc/picolibc/issues/819) (open - `-fcf-protection=full` unsupported on RISC-V), [#1217](https://github.com/picolibc/picolibc/issues/1217) (Smrnmi support, closed/implemented 2026-03) | Released and used in production RISC-V embedded builds | Open, low-severity: issue #819 |

**Deep-dive - RVV crypto acceleration gap:** the single clearest, explicitly tracked "riscv64 optimization gap" affecting Zephyr's crypto stack is [TF-PSA-Crypto #611](https://github.com/Mbed-TLS/TF-PSA-Crypto/issues/611), requesting Zvk*-extension acceleration; it is `help wanted` and unassigned. mldsa-native shows the identical pattern one layer down the PQC stack - CI-verified correctness on riscv64, but portable-C-only performance.

**Deep-dive - CMSIS Arm-only structural gap:** CMSIS-DSP and CMSIS-NN have no RISC-V implementation at all upstream. This is not an open issue to be fixed incrementally; it is an architectural decision by Arm that leaves any Zephyr application relying on these modules for signal-processing or NN-inference acceleration without a RISC-V-native path.

**Note on the project-graph outage:** the Ubuntu 26.04 riscv64 package-availability check requested for every dependency above could not be performed - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) for the entire research session, confirmed on repeated retry. This should be re-run once that connector is reachable.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#113866](https://github.com/zephyrproject-rtos/zephyr/issues/113866) | SMP secondary boot uses single global stack pointer, lacks memory barrier | Open | Correctness (race) | RVWMO memory-ordering bug; timing-dependent, not reliably reproducible in QEMU; fix PR [#115702](https://github.com/zephyrproject-rtos/zephyr/pull/115702) open, changes requested |
| [#113281](https://github.com/zephyrproject-rtos/zephyr/issues/113281) | Secondary CPU hartid lookup falls back to CPU 0 on mismatch | Open | Correctness (regression) | `cpu_num` silently stays 0 on lookup miss; loop also lacks `break` after match |
| [#93708](https://github.com/zephyrproject-rtos/zephyr/issues/93708) | Architecture lacks cache management implementation | Open | Functional (build failure) | Causes build failures on boards declaring `CONFIG_CPU_HAS_ICACHE`/`DCACHE`; PR #117598 (Zicbom) in flight |
| [#81717](https://github.com/zephyrproject-rtos/zephyr/issues/81717) | MMU support for RISCV arch | Open | Functional | PR #105403 in flight, unmerged |
| [#52806](https://github.com/zephyrproject-rtos/zephyr/issues/52806) | RISC-V mode supervisor execution | Open | Functional | Needed for hypervisor-style guests (e.g. Bao) |
| [#78917](https://github.com/zephyrproject-rtos/zephyr/issues/78917) | SMP: support IPI via PLIC | Open | Functional | PR #117751 in flight, changes requested |
| [#82131](https://github.com/zephyrproject-rtos/zephyr/issues/82131) | RISC-V RVV Extension Support in Zephyr | Open | Functional/performance | No RVV code anywhere in the tree (Section 4) |
| [#88507](https://github.com/zephyrproject-rtos/zephyr/issues/88507) | llext: support user-space threads on RISC-V | Open | Functional | |
| [#101252](https://github.com/zephyrproject-rtos/zephyr/issues/101252) | Remove lazy stacking for RISC-V | Open | Correctness/performance | Illegal-instruction trap-decoding edge cases |
| [#96553](https://github.com/zephyrproject-rtos/zephyr/issues/96553) | Implement isr.S in C | Open | Maintainability/performance | |
| [#96503](https://github.com/zephyrproject-rtos/zephyr/issues/96503) | mcause handling inefficient | Open | Performance | |
| [#96548](https://github.com/zephyrproject-rtos/zephyr/issues/96548) | Floating point exceptions checked on interrupt path | Open | Performance | |
| [#105410](https://github.com/zephyrproject-rtos/zephyr/issues/105410) | Spurious interrupt reports wrong for SoCs not getting IRQ from mcause | Open | Correctness | Affects IT8xxx2-class SoCs |
| [#76308](https://github.com/zephyrproject-rtos/zephyr/issues/76308) | NVMe zephyr support with RISCV | Open | Functional | Fails under `qemu-system-riscv64` |

**Recently fixed (closed), for context:**

| ID | Title | Closed | Notes |
|---|---|---|---|
| [#113645](https://github.com/zephyrproject-rtos/zephyr/issues/113645) | `arch_float_disable()` didn't validate inputs/clear FPU state | 2026-08-03 | Correctness fix |
| [#113149](https://github.com/zephyrproject-rtos/zephyr/issues/113149) | Internal SBI SRST handler wrote error code to wrong register | 2026-07-22 | Correctness fix |
| [#96551](https://github.com/zephyrproject-rtos/zephyr/issues/96551) | Floating point decoding can be accelerated | 2026-08-27 | Performance fix |

## 12. Objections and Upstream Blockers

**Technical blockers:** none of the three major in-flight riscv64 PRs have merged as of 2026-09-08 (verified via git-ref inspection - `refs/pull/<N>/merge` present and current against today's `main` tip for all three, and no PR head commit is an ancestor of `main`):

- **PR [#105403](https://github.com/zephyrproject-rtos/zephyr/pull/105403)** (MMU Sv39/Sv48 + S-mode SBI): only minor style nits from reviewer fkokosinski ("use full allowed text width for comments"), resolved by the author; SonarCloud flagged 11 new code issues. No hard blocker identified.
- **PR [#117751](https://github.com/zephyrproject-rtos/zephyr/pull/117751)** (SMP via OpenSBI): **Changes Requested** by fkokosinski. Extensive review thread demands an SBI-ecall abstraction layer be added to the RISC-V arch layer before merge ("SBI ecalls should be abstracted away in the RISC-V arch layer"), plus errno-mapping and Kconfig-organization concerns (moving SBI symbols to a separate `Kconfig.sbi`). The author is actively engaged (7 commits, latest 2026-09-05) but the abstraction work is not yet complete.
- **PR [#115702](https://github.com/zephyrproject-rtos/zephyr/pull/115702)** (SMP boot race fix): changes requested; "multiple RISC-V architecture maintainers were tagged for review but remain pending approval."

**Organizational blockers:** **fkokosinski** is the recurring, effectively sole gatekeeper across all three open PRs and both root-cause issues (#93708, #113866) - RISC-V architecture review capacity is concentrated in one maintainer, which is the practical bottleneck for merging in-flight functional work, not any stated technical or policy objection to RISC-V itself.

**Stated objections to RISC-V as an architecture:** none found. Community documentation is explicitly welcoming of new architecture/board work (Section 1); no maintainer statement was found opposing RISC-V feature work on principle.

**Acceptance probability:** moderate-to-high for the specific PRs in flight - author engagement is active and reviewer feedback is substantive/addressable (abstraction layers, style, Kconfig organization) rather than fundamental design rejection - but timing is gated on a single maintainer's review bandwidth, and none of the three PRs carry a committed merge date in the data gathered.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** none
- **Justification:** Zephyr's only riscv64-referencing CI workflow, [`hello_world_multiplatform.yaml`](https://github.com/zephyrproject-rtos/zephyr/blob/main/.github/workflows/hello_world_multiplatform.yaml), builds and QEMU-runs exactly two sample apps and is path-filtered to `scripts/**`/`SDK_VERSION` changes only - it does not trigger on changes to `arch/riscv/`, drivers, or SoC code, and therefore does not function as a regression gate for RISC-V architecture work. The always-on main CI gate (`twister.yaml`, no path filter, gates every PR) contains zero references to riscv, so genuine, comprehensive test-suite execution on riscv64 as part of standard CI could not be confirmed from the workflow files (see Section 7 adversarial verification). Because Zephyr publishes no prebuilt binaries for any architecture, `release_provider` is `none` rather than `upstream` - this reflects Zephyr's build-yourself distribution model uniformly, not a riscv64-specific penalty.
- **Optimization level:** not applicable - Zephyr is a general-purpose RTOS kernel/scheduler, not an optimization-purpose project under the color-coding model's test (its value - scheduling, concurrency primitives, device drivers, portability - would still hold even running purely scalar C on riscv64). The Step 2 optimization-coverage cap therefore does not apply to Zephyr's own grade. It does apply, and matters, to specific dependencies: TF-PSA-Crypto ([issue #611](https://github.com/Mbed-TLS/TF-PSA-Crypto/issues/611), open, no RVV backend) and mldsa-native (explicitly no RVV backend per its issue #1322 comment), both of which are `absent`-level for RISC-V vector/crypto-extension optimization while being functionally correct on riscv64.
- **Pending work that could change the grade:** merging PR [#105403](https://github.com/zephyrproject-rtos/zephyr/pull/105403) (MMU) and PR [#117751](https://github.com/zephyrproject-rtos/zephyr/pull/117751) (SMP via OpenSBI) would close major functional gaps but would not by itself change the CI-based color, since neither PR adds a comprehensive, non-path-filtered riscv64 test gate. Extending `twister.yaml` (or confirming and documenting its indirect riscv64 coverage via `test_plan_v2.py`/board metadata) or widening `hello_world_multiplatform.yaml`'s trigger paths to include `arch/riscv/**` would be the concrete change needed to move this project to blue.

## 14. Investment Analysis

**What RISE has already done or funded for Zephyr specifically:** nothing found. Zephyr is not a RISE member or RISE-supported project ([riseproject.dev/members](https://riseproject.dev/members) confirmed, checked live). The single RISE-Zephyr connection is a $50,000 Gemini-compute-credit grant to UC Berkeley (Sophia Shao, Alvin Cheung, December 2025) for the [SALTyRN project](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/), which uses Zephyr's toolchain plus the Spike simulator purely as an internal build/verification gate for an unrelated Neon-to-RVV code-translation research pipeline (35 XNNPACK microkernels, 1.40x geomean speedup post-optimization, 3 merged XNNPACK contributions) - this is not investment in Zephyr's own riscv64 readiness and should not be counted against any of the gaps below.

### 14.1 Functional Enablement

The community is already actively closing the largest functional gaps (MMU via PR #105403, SMP-via-SBI via PR #117751, cache management via PR #117598, SMP-boot-race fix via PR #115702) - RISE effort here should focus on **unblocking the single-reviewer bottleneck** (fkokosinski) rather than duplicating the implementation work already in flight: e.g., funding a second qualified RISC-V-arch reviewer, or sponsoring focused engineering time to complete the SBI-ecall abstraction PR #117751's reviewers are requesting.

### 14.2 Performance Optimization

RVV (vector extension) support is completely absent from Zephyr's architecture layer (issue #82131, Section 4) and from its two most crypto-relevant dependencies (TF-PSA-Crypto #611, mldsa-native). This is the largest greenfield opportunity: adding a `RISCV_ISA_EXT_V` Kconfig entry, vector-register context-save/restore analogous to the existing FPU path (`core/fpu.c`/`core/fpu.S`), and RVV-accelerated crypto kernels in TF-PSA-Crypto would close a gap that currently has zero upstream engineering committed to it (issue #82131 is open with no linked PR).

### 14.3 CI/CD Infrastructure

The single highest-leverage, lowest-effort investment identified: widen `hello_world_multiplatform.yaml`'s path filters to include `arch/riscv/**` and relevant driver/SoC paths (or confirm and document `twister.yaml`'s actual riscv64 coverage via board metadata), so that RISC-V-specific changes are gated by CI rather than only tooling/script changes. A native riscv64 hardware CI runner (RISE already operates board-farm and bare-metal RISC-V runner infrastructure for other projects, e.g. mldsa-native's RISE-provided runner per issue #1056) would also directly upgrade Zephyr's evidence base beyond QEMU-only smoke testing.

### 14.4 Ecosystem Enablement

Not scored as a standalone section (Section 10 omitted - Zephyr does not have a large, RISC-V-relevant dependent package ecosystem in the PyPI/npm/Maven/Kubernetes-operator sense; its `west.yml` module dependencies were already assessed directly in Section 9).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Reviewer/maintainer capacity to unblock PR #117751 (SBI-ecall abstraction) and PR #105403 (MMU) merges | Data not available - depends on scope of requested SBI abstraction; not independently estimated in this research | Zephyr TSC / community, RISE could fund a dedicated reviewer | Critical |
| Functional | Complete PLIC-routed IPI support (#78917) and PLIC/CLINT unification for SMP boot fixes (#113866, #113281) | Data not available | Community (fix PR #115702 already open) | High |
| Performance | Implement RVV (Vector extension) support in `arch/riscv` (Kconfig entry, vector context save/restore, `vsetvl*` intrinsics support) | Data not available - no existing prior art in-tree to size against | New RISE-funded engineering effort | High |
| Performance | RVV-accelerated crypto kernels in TF-PSA-Crypto (closes issue #611) and mldsa-native | Data not available | Mbed-TLS / pq-code-package upstream, RISE-fundable | Medium |
| CI/CD | Widen `hello_world_multiplatform.yaml` triggers to `arch/riscv/**`, or document/verify `twister.yaml`'s actual riscv64 board-metadata coverage | Data not available - primarily a CI-configuration change, likely low effort but unverified without repo write access | Zephyr CI maintainers | High |
| CI/CD | Add a dedicated riscv64 hardware CI runner (leveraging RISE board-farm infrastructure already used by other RISE-adjacent projects) | Data not available | RISE infrastructure team | Medium |

## 15. Updates

No updates yet - initial report dated 2026-09-08.

## 16. References

- [Issue #16814 - "support for RISCV64 and SMP" (master tracking issue, closed)](https://github.com/zephyrproject-rtos/zephyr/issues/16814)
- [Issue #93708 - RISC-V lacks cache management implementation](https://github.com/zephyrproject-rtos/zephyr/issues/93708)
- [Issue #81717 - MMU Support for RISCV Arch](https://github.com/zephyrproject-rtos/zephyr/issues/81717)
- [Issue #52806 - RISC-V mode supervisor execution](https://github.com/zephyrproject-rtos/zephyr/issues/52806)
- [Issue #88507 - llext: support user-space threads on RISC-V](https://github.com/zephyrproject-rtos/zephyr/issues/88507)
- [Issue #78917 - riscv: smp: support IPI via PLIC](https://github.com/zephyrproject-rtos/zephyr/issues/78917)
- [Issue #82131 - RISCV RVV Extension Support in Zephyr](https://github.com/zephyrproject-rtos/zephyr/issues/82131)
- [Issue #101252 - Remove lazy stacking for RISC-V](https://github.com/zephyrproject-rtos/zephyr/issues/101252)
- [Issue #96553 - RISC-V: Implement isr.S in C](https://github.com/zephyrproject-rtos/zephyr/issues/96553)
- [Issue #96503 - RISC-V: mcause handling inefficient](https://github.com/zephyrproject-rtos/zephyr/issues/96503)
- [Issue #96548 - RISC-V: floating point exceptions checked on interrupt path](https://github.com/zephyrproject-rtos/zephyr/issues/96548)
- [Issue #105410 - spurious interrupt reports wrong for SoCs not getting IRQ from mcause](https://github.com/zephyrproject-rtos/zephyr/issues/105410)
- [Issue #113281 - secondary CPU hartid lookup falls back to CPU 0 on mismatch](https://github.com/zephyrproject-rtos/zephyr/issues/113281)
- [Issue #113866 - SMP secondary boot uses single global stack pointer, lacks memory barrier](https://github.com/zephyrproject-rtos/zephyr/issues/113866)
- [Issue #76308 - NVMe zephyr support with RISCV](https://github.com/zephyrproject-rtos/zephyr/issues/76308)
- [Issue #105775 - add Supervisor mode (S-mode) and in-tree SBI runtime support](https://github.com/zephyrproject-rtos/zephyr/issues/105775)
- [Issue #113645 - arch_float_disable() didn't validate inputs (closed)](https://github.com/zephyrproject-rtos/zephyr/issues/113645)
- [Issue #113149 - internal SBI SRST handler wrote error code to wrong register (closed)](https://github.com/zephyrproject-rtos/zephyr/issues/113149)
- [Issue #96551 - RISC-V floating point decoding can be accelerated (closed)](https://github.com/zephyrproject-rtos/zephyr/issues/96551)
- [PR #105403 - arch: riscv: add MMU support with Sv39/Sv48 and S-mode SBI](https://github.com/zephyrproject-rtos/zephyr/pull/105403)
- [PR #117751 - Add SMP support when using RISC-V OpenSBI](https://github.com/zephyrproject-rtos/zephyr/pull/117751)
- [PR #115702 - arch: riscv: fix SMP secondary boot handshake races](https://github.com/zephyrproject-rtos/zephyr/pull/115702)
- [PR #117598 - arch: riscv: add Zicbom cache management](https://github.com/zephyrproject-rtos/zephyr/pull/117598)
- [PR #113656 - arch: riscv: Add S-mode only support (external SBI), merged](https://github.com/zephyrproject-rtos/zephyr/pull/113656)
- [Zephyr docs - RISC-V architecture support](https://docs.zephyrproject.org/latest/hardware/arch/risc-v.html)
- [Zephyr blog - "When 32 bits isn't enough - Porting Zephyr to RISCV64"](https://www.zephyrproject.org/when-32-bits-isnt-enough-porting-zephyr-to-riscv64/)
- [RISC-V International mirror of the same post](https://riscv.org/blog/2020/09/when-32-bits-isnt-enough-porting-zephyr-to-riscv64)
- [Zephyr Project members page](https://zephyrproject.org/members)
- [Zephyr RTOS 4.1 release announcement](https://zephyrproject.org/zephyr-rtos-4-1-is-available/)
- [GitHub Discussion #79785 - Zephyr's Poor Real-Time Performance](https://github.com/zephyrproject-rtos/zephyr/discussions/79785)
- [PR #79570 - port thread_metric benchmark from ThreadX](https://github.com/zephyrproject-rtos/zephyr/pull/79570)
- [zephyrproject-rtos/rtos-benchmark](https://github.com/zephyrproject-rtos/rtos-benchmark)
- [Beningo Embedded - RTOS Performance Report 2024](https://www.beningo.com/rtos-performance-report-2024-now-available/)
- [Beningo Embedded - 2026 RTOS Benchmark Study](https://www.beningo.com/2026-rtos-benchmark-study)
- [RISE blog - SALTyRN: Turning Neon Kernels into Fast, Verified RVV Code with LLMs](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [RISE members page](https://riseproject.dev/members/)
- [TF-PSA-Crypto issue #611 - Support crypto in RISC-V platform](https://github.com/Mbed-TLS/TF-PSA-Crypto/issues/611)
- [mldsa-native issue #1185 - Run RISC-V64 RVV tests as per-VLEN matrix entries](https://github.com/pq-code-package/mldsa-native/issues/1185)
- [mldsa-native issue #624 - CI: Add cross tests for RISCV32](https://github.com/pq-code-package/mldsa-native/issues/624)
- [mldsa-native issue #1056 - RISE riscv64 CI runner flake (closed)](https://github.com/pq-code-package/mldsa-native/issues/1056)
- [mcuboot issue #1866 - ESP32-C3 RISC-V issue (closed)](https://github.com/mcu-tools/mcuboot/issues/1866)
- [picolibc issue #819 - -fcf-protection=full unsupported on RISC-V (open)](https://github.com/picolibc/picolibc/issues/819)
- [picolibc issue #1086 - link relocation overflow with riscv-gnu-toolchain (closed)](https://github.com/picolibc/picolibc/issues/1086)
- [picolibc issue #1217 - Smrnmi resumable-NMI support (closed)](https://github.com/picolibc/picolibc/issues/1217)
- [PyPI - zephyr-rtos (404, package does not exist)](https://pypi.org/pypi/zephyr-rtos/json)
- [Ubuntu packages search - Zephyr RTOS, resolute suite (no results)](https://packages.ubuntu.com/search?keywords=Zephyr%20RTOS&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search (no results)](https://archriscv.felixc.at/?q=zephyr%20rtos)
- [hello_world_multiplatform.yaml workflow file](https://github.com/zephyrproject-rtos/zephyr/blob/main/.github/workflows/hello_world_multiplatform.yaml)