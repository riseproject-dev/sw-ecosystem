---
title: CFU-Playground
---

# CFU-Playground

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for CFU-Playground<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CFU-Playground is Google's open-source framework for designing and evaluating custom FPGA opcodes ("Custom Function Units," or CFUs) that accelerate TensorFlow Lite for Microcontrollers (TFLM) inference on a soft RISC-V CPU. The primary soft core is VexRiscv (SpinalHDL-based), with SERV supported as a secondary option. This is a hardware/RTL co-design and benchmarking tool, not an operating system, language runtime, or Linux userspace project. All firmware produced by the project is bare-metal, running directly on a soft CPU instantiated inside FPGA gateware. There is no CMakeLists.txt, setup.py, go.mod, or Cargo.toml at the repo root; the build is driven by a Makefile, a Conda environment (conf/environment.yml, conf/requirements*.txt), 25 git submodules, and a vendored, version-pinned copy of TFLite Micro (conf/tflite-micro.version = commit 8746ec9).

**Critical architecture note:** CFU-Playground's target is 32-bit RISC-V only. The project's own documentation states explicitly: "The VexRiscV CPU is a 32 bit RISCV CPU and we use the GCC C/C++ toolchain" (docs/source/overview.rst, line 85). There is no RV64/XLEN=64 core variant anywhere in soc/vexriscv/src/main/scala/vexriscv/GenCoreDefault.scala or elsewhere in the tree. Every occurrence of the string "riscv64" in the repository (common/Makefile, scripts/Dockerfile, scripts/setup, docs/source/setup-guide.rst, docs/source/renode.rst, .github/workflows/fmax-trials.yml, proj/hps_accel/vizier_autotune.ipynb) refers only to the SiFive/RISC-V GNU toolchain package name (riscv64-unknown-elf-gcc), a multilib GCC/binutils bundle used here purely to cross-compile 32-bit RV32IM/RV32IMC binaries. No code in this repo executes in RV64 mode, and no riscv64 architecture port exists, is proposed, or is in progress. This report's nominal "riscv64/linux" framing therefore does not literally apply to CFU-Playground; it is addressed throughout by documenting the actual (RV32, bare-metal) RISC-V work, and by stating "not applicable" where the riscv64/Linux framing has no real analog for this project.

**Governance.** CFU-Playground is hosted under the `google` GitHub organization but is explicitly disclaimed as not an official Google product: "This is not an officially supported Google project. Support and/or new releases may be limited." License is Apache 2.0 (confirmed via repo metadata and community-profile API). Governance is informal: standard GitHub pull-request review, a Google Contributor License Agreement (CLA) required per CONTRIBUTING.md, and Google's Open Source Community Guidelines / Code of Conduct apply. No MAINTAINERS, OWNERS, or CODEOWNERS file exists (all return 404). The AUTHORS file lists only "Google LLC." No written support-tier policy document (no PLATFORMS.md or SUPPORT.md) exists. The closest analog is the GitHub wiki's "Supported Boards" page, which informally tiers FPGA boards rather than CPU architectures: the Arty A7-35T is described as "the first and still best supported board" (the implicit default `TARGET`), while the ULX3S, OrangeCrab, Fomu, and iCEBreaker carry explicit caveats (tiny RAM, special power-cycling requirements, only some example projects fit within their resource budgets). Because the project has used a single ISA (RISC-V via VexRiscv) since inception, this tiering is entirely about FPGA board/vendor toolchain support, not about CPU architecture width - there is no second architecture to compare against.

**Corporate sponsors.** By commit volume:

| Contributor | GitHub handle | Commits | Affiliation |
|---|---|---|---|
| Alan Green | alanvgreen | 802 | Google Inc |
| Tim Callahan | tcal-x | 397 | Google (tcal@google.com) - project originator |
| (automation bot) | cfu-playground-bot | 138 | Google |
| Dan Callaghan | danc86 | 80 | Unlisted |
| Shvetank Prakash | ShvetankPrakash | 74 | Harvard PhD student (independent) |
| Joseph Bushagour | JosephBushagour | 64 | Google Inc |
| Piotr Zierhoffer | PiotrZierhoffer | 45 | Antmicro Ltd |
| Robert Szczepanski | robertszczepanski | 38 | Antmicro |
| Krzysztof Gugala | kgugala | 7 | Antmicro |
| Alessandro Comodi | acomodi | 5 | Huxelerate |
| Tim "mithro" Ansell | mithro | 5 | wafer-space (ex-Google) |
| Filip Kokosinski, Marek Gielda, Krzysztof Boronski, Marcin Kurc | - | 1-2 each | Antmicro |

Google is the founding and dominant corporate backer: it originated the project, holds the copyright per AUTHORS, and supplies the core maintainers (alanvgreen, tcal-x, JosephBushagour) plus the automation bot. Antmicro is the clear secondary corporate contributor, concentrated on Renode co-simulation integration (the docs explicitly credit "Renode, an open source simulation framework by Antmicro") and board-support work. Huxelerate's contribution is minimal (5 commits).

**Community culture on new ports/boards.** Historically fast: PR #129 ("Add support for the iCEbreaker board") was reviewed and merged the same day (roughly 3 hours), explicitly designed to "make it easier to support other small boards," with no governance barrier beyond the standard CLA and PR review. However, recent activity shows materially reduced maintenance bandwidth. Commits from 2024-2026 are mostly CI/dependency maintenance performed by the google-admin bot and by Tim Callahan pinning Yosys/Renode versions. The most recent open PR (#822, opened 2026-03-09, "Increase IMGC tensor arena to 54 KiB") remains unmerged months later, and issue #818 ("OPENLANE Integration," opened 2024-08) is still unaddressed with only one reply. Repo stats (checked live): 561 stars, 159 forks, not archived, last push 2026-02-26, 125 open issues, 90 closed, 17 open PRs. [NEEDS VERIFICATION: one research pass separately recorded 142 open issues in a second live count; the discrepancy against the 125 figure above was not resolved.] Taken together, this indicates a project that is largely dormant/maintenance-only at present, despite a historically welcoming stance toward new board ports.

**RISE Project involvement: none.** RISE's members page lists Google LLC as a Premier Member (alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent), but that is a company-level relationship. No RISE blog post (all 33 posts enumerated via the sitemap and checked in full) mentions "CFU-Playground" or "CFU." No `riseproject-dev` GitHub repo (all 51 org repos enumerated) is related. No RISE working-group tracked-software list mentions it, including the AI/ML working group's 17-project list (SLEEF, OpenBLAS, Eigen, oneDNN, XNNPACK, PyTorch CPU, IREE, Triton, scikit-learn, LiteRT, ExecuTorch, NumPy, Knowhere, MNN, Milvus, Faiss, vLLM). No RISE Python wheel builder entry exists for it. `gh api search/repositories?q=CFU-Playground+org:riseproject-dev`, `search/code`, and `search/issues` all return `total_count: 0`. This project sits entirely outside RISE's funded/tracked scope.

## 2. Port History and Upstreaming Timeline

There is no "port" to speak of in the riscv64 sense: RISC-V, via the VexRiscv soft core, has been CFU-Playground's sole target CPU architecture since 10 days after the repository's inception, and it has always been 32-bit. There is no non-RISC-V predecessor codebase, and no in-flight or proposed effort exists anywhere in the project's history to add 64-bit (RV64/XLEN=64) width.

| Date | Event | Source |
|---|---|---|
| 2020-10-27 | Initial commit (gitignore/LICENSE/README only, no RISC-V code yet), authored by Tim Callahan | GitHub commit history |
| 2020-11-06 | First RISC-V-bearing commit `41bb7b8`, "Complete CFU/CPU/SOC with 'basic_cfu' program to exercise it" - introduces a LiteX-based SoC with VexRiscv (SpinalHDL) soft RISC-V CPU as a submodule, plus `crt0-vexriscv.S` startup code | [Commit 41bb7b8](https://github.com/google/CFU-Playground) |
| 2020-11-06/07 | Follow-up commit, "Switch to using Charles' RISCV custom instruction macro" - refines the CFU/RISC-V instruction hookup | GitHub commit history |
| 2021-03-10 | Issue [#1](https://github.com/google/CFU-Playground/issues/1) filed: RISCV toolchain issues carried over from the pre-migration repo | GitHub |
| 2021-04-21 to 2021-05-05 | Issue [#57](https://github.com/google/CFU-Playground/issues/57) / PR [#63](https://github.com/google/CFU-Playground/pull/63): apt-installed `riscv64-unknown-elf-gcc` found to lack headers, causing build failures; fixed by pointing users to the official SiFive tarball instead of auto-installing via apt | GitHub |
| 2021-07-14/15 | PR [#160](https://github.com/google/CFU-Playground/pull/160): illegal-instruction handler added to emulate `div`/`divu`/`rem`/`remu` in software for the space-constrained Fomu VexRiscv variant (hardware division removed to save logic cells) | GitHub |
| 2021-09-27/29 | PR [#304](https://github.com/google/CFU-Playground/pull/304): LiteX version bump including a switch toward picolibc as the C library | GitHub |
| 2021-10-26 to 2021-11-11 | PR [#332](https://github.com/google/CFU-Playground/pull/332): adds the RISC-V (32-bit target) GCC toolchain and ice40 tools to the project's Conda environment | GitHub |
| Ongoing | No RV64/64-bit architecture work ever proposed | Exhaustive `gh search` over issues/PRs/commits for riscv64, rv64, RV64I, rv64gc, XLEN - all zero relevant hits |

**Key contributors and organizations** for this timeline: Tim Callahan (Google, project originator, authored the initial commit and the first RISC-V-bearing commit), Alan Green (Google, highest commit-volume maintainer overall), and the toolchain-fix contributors on issue #57/PR #63 (community-reported, Google-fixed).

**Is it fully upstream?** Not applicable in the conventional sense. There is nothing "upstream" of CFU-Playground for a RISC-V architecture port, because CFU-Playground is itself the top-level project, and RISC-V/VexRiscv has been its only target architecture since inception - there was never a non-RISC-V version to port from, nor a separate upstream RISC-V port that this project consumes. The one adjacent upstreaming data point found: issue [#582](https://github.com/google/CFU-Playground/issues/582) (a VexRiscv CfuPlugin correctness bug) was root-caused in CFU-Playground and fixed directly in the VexRiscv project itself by its maintainer Dolu1990 (commit `c242744d`) - but the CFU-Playground-side tracking issue remains open pending verification/closure. This is bugfix upstreaming into a dependency, not architecture-port upstreaming.

## 3. Upstream Support Tier

No formal tier policy for architecture width exists, and none is applicable: the project has never targeted anything but 32-bit RISC-V, so there is no multi-architecture tier system to document. Board-level tiering exists informally via the GitHub wiki's "Supported Boards" page: the Arty A7-35T is the de facto Tier-1 / best-supported / default board (implicit default `TARGET`), while the ULX3S, OrangeCrab, Fomu, and iCEBreaker carry documented caveats (tiny RAM, special power-cycling needs, only some example projects fit within their resource budgets). No PLATFORMS.md or SUPPORT.md file exists in the repository.

Because CFU-Playground has never had an amd64 or arm64 target - its only CPU target, from inception, has been the 32-bit RISC-V VexRiscv soft core - the conventional "amd64 vs arm64 vs riscv64" comparison does not describe a real situation for this project. The table below is adapted accordingly:

| Dimension | amd64 | arm64 | riscv64 (RV64) | RV32 (actual target) |
|---|---|---|---|---|
| Is it a CFU-Playground target? | No, never targeted | No, never targeted | No, never targeted, no port proposed | Yes, sole target since inception (2020-11-06) |
| CI coverage | N/A | N/A | N/A | Cross-compiled on x86_64 GitHub-hosted runners; see Section 7 |
| Official binaries/releases | N/A | N/A | N/A | None for any architecture; source-only, see Section 8 |
| Formal tier document | N/A | N/A | N/A | None; informal board-tiering via wiki only |

Note that the host build/CI machines are themselves x86_64 (amd64) - see Section 7 - but this is incidental infrastructure, not an amd64 port of CFU-Playground software; CFU-Playground produces firmware for the RV32 soft core, not a native amd64 or arm64 build target of its own.

## 4. Technical Architecture and RISC-V-Specific Subsystems

CFU-Playground is a bare-metal FPGA/soft-core project, not an OS or dynamic-dispatch library, so there is no Linux-style `arch/riscv/` tree and no JIT backend in the traditional sense (Renode's `tlib` CPU-emulation core does dynamic binary translation, a QEMU-TCG-derived JIT, but that is a third-party simulator dependency, not part of CFU-Playground's own code - see Section 9). All RISC-V arch code targets RV32I (plus optional M/A/C/F extensions), hand-assembled or hand-encoded. There is zero RVV/vector code and zero bitmanip (Zba/Zbb/Zbs) code anywhere in the repo, confirmed by targeted searches for `vfloat32m1_t`, `rvv`, `vsetvli`, `riscv_vector`, `__riscv_v`, `Zba`, `Zbb` (all zero hits).

**Hand-written RISC-V arch code (core, complete):**

| Path | Lines | Purpose | ISA/extensions | Status |
|---|---|---|---|---|
| `common/src/crt0-vexriscv.S` | 186 | RV32I assembly: `_start`, `trap_entry` (full x1-x31 save/restore for the software-divide path, or a minimal caller-saved set for normal interrupts), `crt_init` (data/bss init, `csrw mtvec`, `csrw mie`), calls `main` | RV32I, CSR (`mtvec`, `mie`) | Complete |
| `third_party/SaxonSoc/riscv.h` | 232 | Vendored (MIT, from SpinalHDL/SaxonSoc) privileged-arch header: `CAUSE_*`/`MSTATUS_*`/`SSTATUS_*`/`PMP_*`/`RDCYCLE`/`RDTIME`/`RDINSTRET` constants; `csr_read/write/swap/set/clear` inline-asm macros; register-number `.set` directives; `CUSTOM0`/`CUSTOM1` opcode constants (0x0B/0x2B); the `opcode_R()` macro that hand-encodes a 32-bit R-type custom instruction | RV32/64 privileged CSR ISA, custom-opcode encoding space | Complete (not a stub) |
| `common/src/cfu.h` | 79 | `cfu_op0`-`cfu_op7` macros wrapping `opcode_R(CUSTOM0,...)`, switchable to software emulation via `CFU_SOFTWARE_DEFINED` | Custom RISC-V R-type opcode (CUSTOM0) | Complete |
| `common/src/instruction_handler.cc` / `.h` | 190 / 34 | Illegal-instruction trap handler; decodes `funct3` from the trapped instruction word to emulate `div`/`divu`/`rem`/`remu` via `__divdi3`/`__udivdi3`/`__moddi3`/`__umoddi3`; reads `mcause`/`mtval`/`mepc` CSRs | RV32I trap handling, M-extension emulation | Complete (unit tests inside are commented out) |
| `common/src/software_cfu.cc` / `.h` | 32 / 35 | Software fallback for the custom function unit (returns 0; user-overridable template) | Custom opcode software model | Intentional stub/template |
| `common/src/functional_cfu_tests.cc` | 102 | Runtime test menu comparing hardware vs software custom-opcode results | Custom opcode | Complete |

**RISC-V core generation/configuration (RTL + build glue, not assembly but architecture-defining):**

| Path | Lines | Purpose | ISA/extensions | Status |
|---|---|---|---|---|
| `soc/vexriscv/src/main/scala/vexriscv/GenCoreDefault.scala` | 420 | SpinalHDL generator for custom VexRiscv cores: `CfuPlugin` (custom R-type instruction at opcode `0001011`, functionId from bits [14:12,31:25]), FPU plugin, PMP, MMU, perf-CSR plugin, mul/div plugins | RV32I[M][A][C][F], custom-opcode CfuPlugin | Complete |
| `soc/vexriscv/VexRiscv_*.v` + matching `.yaml` (~20 pairs, e.g. `VexRiscv_Custom.v` = 341 KB) | generated | Pre-generated/vendored synthesizable Verilog netlists for each CPU variant (Fomu, Breaker, Custom, Fpu, Hps[delta], Slim[opt/Perf], dbpl8, Min, Perf, each with/without CFU port) | RV32I[M][A][C][F] soft-core RTL | Complete (generated artifacts, checked in) |
| `soc/patch_cpu_variant.py` | 242 | Monkey-patches LiteX `CPU_VARIANTS`/`GCC_FLAGS` to register custom `.v` files with `-march=rv32i[m][f] -mabi=ilp32[-mno-div]`; builds new variants on demand via `sbt` and the Scala generator | RV32 GCC ABI/march flags | Complete |
| `soc/vexriscv/README.md` | doc | Manual/automated workflow for building custom VexRiscv variants | - | Complete |

**Toolchain/build-system wiring (RISC-V-specific, not architecture code per se):**
- `common/Makefile` selects `riscv32-elf-newlib-gcc` (preferred) or `riscv64-unknown-elf-gcc` (legacy) as CC/CXX/OBJDUMP/OBJCOPY; compiles `.S` via a `%.o : %.S` rule (`-x assembler-with-cpp`).
- `scripts/Dockerfile`, `scripts/setup`, `docs/source/setup-guide.rst` install `riscv64-unknown-elf-gcc-8.3.0` (SiFive prebuilt tarball) or `riscv32-elf-newlib-gcc`/`riscv32-elf-gdb` via Conda.
- `.github/workflows/fomu.yml`, `symbiflow.yml`, `oxide.yml`, `fmax-trials.yml` - CI installs/version-checks `riscv32-elf-gcc`, `riscv32-elf-newlib-gcc`, or `riscv64-unknown-elf-gcc`.
- `docs/source/renode.rst` - RISC-V GDB register-inspection walkthrough via the Renode simulator, notes the GDB binary may be named `riscv32-elf-gdb` or `riscv64-unknown-elf-gdb`.

**Important naming nuance:** despite the `riscv64-unknown-elf-gcc` toolchain-triple name appearing throughout, every actual `-march=` flag in the repo is `rv32i*` (rv32i, rv32im, rv32ima, rv32imf, rv32imc, rv32imac) - this is purely a multilib GCC triple convention; no code in this repo executes in RV64 mode.

**Vendored third-party RISC-V glue (not authored here):**
- `third_party/python/pythondata_cpu_vexriscv` (submodule) - upstream base VexRiscv Verilog that the custom `.v` files are copied/patched from.
- `third_party/tflite-micro/.../targets/riscv32_mcu_makefile.inc` - vendored copy of upstream tflite-micro's SiFive FE310 target (`-march=rv32imac -mabi=ilp32 -mcmodel=medany`, links SiFive Freedom-E-SDK `start.S`/`entry.S`); references `tensorflow/lite/micro/riscv32_mcu/*.cc` sources that are not actually present in this repo's vendored tflite-micro subtree (glue-only, dangling wildcard).
- `third_party/tflite-micro/.../ext_libs/vexriscv.inc` - present but 0 bytes (empty placeholder).
- `third_party/tflite-micro/.../targets/zephyr_vexriscv_makefile.inc` (3 lines) - Zephyr+VexRiscv SDK path glue, no arch code.
- `third_party/tflite-micro/.../ci_build/test_riscv.sh` - vendored upstream CI script for the riscv32_mcu target.

**Documentation (RISC-V-related, non-code):** `docs/source/crash-course/riscv.rst` (one-paragraph stub intro to "RISCV and Custom Function Units"), `docs/source/overview.rst` (high-level description of the VexRiscV 32-bit RISC-V CPU + CFU architecture), `docs/source/projects/z_customizing_vex.rst` (pointer to `soc/vexriscv/README.md`).

**Confirmed absent:** no `arch/riscv/` directory (bare-metal project, not an OS kernel); no RVV/vector code; no Zba/Zbb/Zbs bitmanip references; no riscv64 JIT or SIMD dispatch backend (the project has no JIT of its own; it cross-compiles a single static bare-metal image per RV32 soft-core variant).

| Component | amd64/arm64 | riscv64 (RV64) | RV32 (actual) |
|---|---|---|---|
| JIT | N/A, never targeted | N/A, never targeted | N/A, none in project (Renode's tlib JIT is a third-party dependency, not CFU-Playground code) |
| SIMD/vector intrinsics | N/A | N/A, no RVV anywhere | None; custom scalar CFU opcode used instead of vector extensions |
| Hand-written assembly | N/A | N/A | `crt0-vexriscv.S` (186 lines), complete |
| Custom-opcode encoding | N/A | N/A | Complete (`cfu.h`, `instruction_handler.cc`, `GenCoreDefault.scala`) |
| GC barriers | N/A, not applicable to bare-metal firmware | N/A | N/A |

## 5. Build System, Cross-Compilation, and Toolchain

CFU-Playground has no CMake or Autotools build system; it is driven by a Makefile plus a Conda-managed environment (`conf/environment.yml`, `conf/requirements*.txt`) and a `scripts/setup`/`scripts/Dockerfile` pair for environment bring-up. `common/Makefile` selects `riscv32-elf-newlib-gcc` (preferred) or `riscv64-unknown-elf-gcc` (legacy SiFive) as the CC/CXX/OBJDUMP/OBJCOPY toolchain, exposed via a Makefile variable literally named `RV64 := riscv64-unknown-elf-` - a naming holdover from the toolchain-triple convention, not a 64-bit target flag (see Section 4's naming-nuance note).

Data not available beyond this: the automated research pipeline that produced this report's underlying findings was cut off by a context-length limit before completing a full fetch of build-system documentation content. Specifically not independently confirmed in this pass: the exact full text of documented build commands beyond the Makefile/Conda mechanism already described, the complete toolchain-version-pinning history and rationale beyond the GCC 8.3.0-to-10.x transition already covered under issue #182/PR #63 in Sections 2 and 11, and any build-failure log beyond the two already documented (issue #57's missing-header apt-install failure, and issue #182's missing prebuilt `libstdc++.a` for `rv32im` in SiFive's GCC 10.2.0 release). Do not infer additional build-system specifics beyond what is stated here and in the other sections of this report.

**QEMU usage:** no QEMU usage was found directly within CFU-Playground's own build or CI scripts. QEMU riscv32 emulation is used one dependency layer down, inside the vendored TensorFlow Lite Micro's own CI (`suite_riscv.yml`/`run_riscv.yml`, via `test_with_qemu.sh riscv32 rv32`), which tests TFLM's own `riscv32_generic` target independently of CFU-Playground - see Section 9.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because CFU-Playground has never targeted amd64 or arm64 (its sole CPU target has been 32-bit RISC-V since inception), a feature-parity comparison against those architectures does not describe a real gap - there is no "amd64 version" or "arm64 version" of this project to compare against. The table below instead documents feature coverage for the project's actual target (RV32 on FPGA soft cores) versus the strict riscv64/Linux framing this report series otherwise uses.

| Feature | RV32 (actual target) | riscv64/Linux (this report's nominal framing) |
|---|---|---|
| Core CFU/TFLM acceleration functionality | Full - the project's entire purpose | Not applicable, no riscv64 target exists |
| Custom-opcode (CUSTOM0) hardware acceleration | Full, hand-encoded R-type instructions | Not applicable |
| GDB disassembly of custom opcodes | Partial/missing - GDB shows raw machine code instead of the CUSTOM0 mnemonic (issue #733, open) | Not applicable |
| Division/remainder on space-constrained variants | Full via software-emulation trap handler (Fomu variant) | Not applicable |
| Official prebuilt binaries | None, for any target - source-only project (Section 8) | Not applicable |
| Automated performance-regression CI (fMax tracking) | Broken since at least mid-2025 (see Section 11); no functioning regression data collected in over a year | Not applicable |

**Functional gaps:** there is no "cannot do X at all on riscv64" scenario to report, because riscv64 is not a target of this project in any sense; the appropriate framing is that the project's actual RV32 target has a few open functional gaps of its own (GDB CUSTOM0 disassembly, per issue #733; SlimoptCfu variant correctness, per issue #374), documented fully in Section 11.

**Performance gaps:** not meaningful to express as an amd64/arm64 delta, since there is no amd64/arm64 baseline. The project's own RV32 performance work is substantial and well-documented: adding a single custom SIMD MAC CFU instruction reduced person-detection inner-loop cycles from 113M to 22M (5.1x) on the Arty A7 FPGA + VexRiscv, per the official step-by-step tutorial (see Section 11 for the full benchmark table). This demonstrates the project's core value proposition (hardware acceleration via custom RISC-V opcodes) but says nothing about riscv64/Linux performance, since no such target exists.

**Security hardening gaps:** Data not available - no RISC-V-specific security-hardening discussion (stack protector, CFI, PMP-based isolation beyond the generic PMP plugin already noted in Section 4) was found in the research findings for either the RV32 target or any hypothetical riscv64 target.

**NaN/floating-point semantics issues:** Data not available - no NaN or floating-point-semantics-specific issue was found in the research findings. The `GenCoreDefault.scala` core generator does expose an FPU plugin option (Section 4), but no floating-point correctness or NaN-handling bug was surfaced by the searches performed.

## 7. CI/CD Infrastructure

**No riscv64 CI exists, and none is applicable**, because CFU-Playground has no riscv64 (or any 64-bit) target to test. All 14 files in `.github/workflows/` were fetched and read in full: `check-doc.yml`, `fmax-trials.yml`, `fomu.yml`, `hps.yml`, `manual-wf.yml`, `oxide.yml`, `projects_to_test.txt`, `run-pytests.yml`, `supported_targets.txt`, `symbiflow.yml`, `sync-renode.yml`, `sync-tflm.yml`, `test-projects.yml`, `verilate.yml`, plus the support files `.github/misc/test-environment.yml` and `.github/scripts/generate_ci_matrix.py`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist (all 404) - GitHub Actions is the sole CI system.

Four of the 14 files contain "riscv" text, in every case as a cross-compiler toolchain name run on an x86_64 GitHub-hosted runner to build 32-bit target firmware, not as an execution architecture for the CI job itself:

| File | Trigger | Runner | RISC-V reference |
|---|---|---|---|
| `fomu.yml` | `pull_request` | `ubuntu-latest` | Calls `riscv32-elf-gcc --version`; builds bitstream for the `kosagi_fomu` target |
| `fmax-trials.yml` | `workflow_dispatch` + daily `schedule` cron | `ubuntu-latest` | The **only** file containing the literal string `riscv64` - downloads SiFive's `riscv64-unknown-elf-gcc-8.3.0-2020.04.1` toolchain tarball by URL and runs `riscv64-unknown-elf-gcc --version`, then builds multiple `hps_accel`/`proj_template_v` bitstream variants measuring "Max frequency" (fMax) |
| `oxide.yml` | `pull_request` | `ubuntu-latest` | Calls `riscv32-elf-newlib-gcc --version`; builds via `nextpnr-nexus` |
| `symbiflow.yml` | `pull_request` | `ubuntu-latest` | Calls `riscv32-elf-newlib-gcc --version`; builds via F4PGA/SymbiFlow |

`test-projects.yml` (the main matrix-build/Renode-test workflow, running on `ubuntu-20.04`) contains no riscv string itself but pulls in `test-environment.yml`, which specifies the Conda dependency `litex-hub::gcc-riscv32-elf-newlib`.

**Runner-type analysis:** every job in every workflow declares `runs-on: ubuntu-latest` or `runs-on: ubuntu-20.04` - standard x86_64 GitHub-hosted runners. No workflow declares a riscv64 self-hosted runner label, no `arch: riscv64` runner group, and no QEMU/`docker/setup-qemu-action` step anywhere in the 14 workflow files. Every "riscv" occurrence is a bare-metal cross-compiler toolchain name used on the x86_64 host to cross-build firmware/bitstream software targeting CFU-Playground's soft RISC-V CPU cores instantiated inside FPGA gateware - not to execute the CI job on riscv64 hardware or emulation.

**RISE runners:** none used; no evidence found that CFU-Playground uses or has ever used any RISE-provided riscv64 CI infrastructure (see Section 1 for the full RISE-involvement finding).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build coverage | Yes - all CI hosts are x86_64 GitHub-hosted runners | No | No (not a target) |
| CI test coverage of CFU-Playground firmware itself | N/A - firmware is bare-metal for RV32 soft cores, tested via Renode/Verilator co-simulation or real FPGA hardware, not natively "on" any host CPU | No | No (not a target) |
| RISE-hosted runners | No | No | No |
| Hardware used | GitHub-hosted x86_64 runners (host); Arty A7, ULX3S, OrangeCrab, Fomu, iCEBreaker FPGAs (actual RV32 target) | None | None |

## 8. Distribution and Release Status

**No binary distribution channel of any kind exists for CFU-Playground, on any architecture.** This tracks with the project's nature as a source-only hardware-design/FPGA toolchain framework, built from source via its own Makefile/Conda tooling rather than distributed as installable packages.

| Channel | Checked via | Result |
|---|---|---|
| GitHub Releases | `gh api repos/google/CFU-Playground/releases` | Returns `[]` - zero releases exist. Repo has zero tags as well. |
| PyPI | [pypi.org/pypi/cfu-playground/json](https://pypi.org/pypi/cfu-playground/json) | HTTP 404 Not Found - no such package |
| RISE wheel builder (GitLab) | `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/cfu-playground/` | Redirects (302) to the same 404-ing PyPI page |
| Ubuntu 24.04 (noble) | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=cfu-playground) | "Sorry, your search gave no results" |
| Debian tracker | [tracker.debian.org/pkg/cfu-playground](https://tracker.debian.org/pkg/cfu-playground) | HTTP 404 Not Found |
| Arch Linux RISC-V port | [archriscv.felixc.at](https://archriscv.felixc.at/?q=cfu-playground) | Page loads (general port info) but no package index entry matches |

**What a user must do to get a working build:** clone the repository and use its own Makefile/Conda-environment toolchain (`bash scripts/setup`, `make env`, then `make TARGET=<board> bitstream` per project) to cross-compile RV32 firmware and synthesize an FPGA bitstream. There is no prebuilt binary, package, or release artifact of any kind, for any architecture, through any channel checked.

## 9. Dependencies

CFU-Playground is not a riscv64/Linux userspace project; it is an FPGA soft-core development framework that lets a user add custom instructions to a VexRiscv or SERV soft CPU (RV32IM/RV32I) to accelerate TFLM inference. "riscv64 status" for its dependencies applies in two distinct ways: (1) whether the ML runtime libraries vendored for the accelerated workload (ruy, gemmlowp, kissfft, FlatBuffers) have riscv64/RVV readiness, relevant only if this stack were ever retargeted from an FPGA soft core to real riscv64 silicon; and (2) whether the host build/simulation toolchain (Verilator, Yosys, nextpnr, Renode, NumPy/SciPy/SymPy for the SymbiFlow/F4PGA path) can run on a riscv64 Linux host. CFU-Playground itself is not listed in this project's `scope.yml`.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking issues |
|---|---|---|---|---|---|
| ruy (google/ruy) | Int8/float matmul kernel vendored into TFLM (pinned commit `d37128311b`); backs every TFLM conv/fully_connected op | Builds (scalar `kStandardCpp` fallback; no riscv64 CMake/Bazel branch) | No functional gaps; zero performance path (no RVV kernel, no `RUY_PLATFORM_RISCV` macro) | Source-only upstream; Debian/Ubuntu `libruy-dev` riscv64 package exists | None riscv-specific in google/ruy (0 issues). Transitively, cpuinfo #397 (ISA-detection gaps) exists but cpuinfo is **not** pulled into this MCU-targeted ruy build (no download rule in TFLM's `third_party_downloads.inc`). See `reports/ruy.md`. |
| gemmlowp (google/gemmlowp) | Legacy low-precision (int8) GEMM/fixed-point arithmetic, vendored into TFLM (pinned commit `719139ce75`) | Builds via generic `ReferenceKernel` fallback; platform macros exist only for `GEMMLOWP_ARM`, `GEMMLOWP_X86`, `GEMMLOWP_MIPS`, WASM SIMD - no riscv detection, no `kernel_riscv*.h` | Correctness-only, no performance path | Not on PyPI/GitHub releases (source-only); Debian `libgemmlowp-dev` riscv64 build available | 0 open GitHub issues mentioning riscv/riscv64 (repo has 20 open issues total, last push Jan 2024). Not in `scope.yml`. |
| kissfft (mborgerding/kissfft) | FFT library vendored into TFLM (pinned `v130`); used for audio feature extraction in the `micro_speech` reference benchmark | Builds; pure scalar C, only a generic user-defined `USE_SIMD` hook, no arch-specific SIMD/RVV path found | No riscv-specific test issues found | Debian `kissfft-tools`, `libkissfft-dev`, `libkissfft-float131` all ship riscv64 builds | 0 riscv/riscv64 issues. Not in `scope.yml`. |
| FlatBuffers (google/flatbuffers) | Serialization format for `.tflite` model files, vendored into TFLM (pinned `v25.9.23`) | Builds cleanly; pure C++, no SIMD/JIT | Functionally complete on riscv64 | No upstream riscv64 release binary; Debian/Arch riscv64 packages exist (lagging upstream) | 0 open riscv64 issues (2022-era cross-compile bugs fixed). See `reports/flatbuffers.md`. |
| TensorFlow Lite Micro (tensorflow/tflite-micro) | The ML inference engine CFU-Playground exists to accelerate; vendored wholesale | Has a dedicated `riscv32_generic_makefile.inc` target (`TARGET_TOOLCHAIN_PREFIX=riscv64-unknown-elf-`, `RISCV_ARCH=rv32imc`) - this is RV32 bare-metal, not riscv64/Linux | CI workflow `suite_riscv.yml`/`run_riscv.yml` runs a scheduled (daily cron) build+test via Docker against QEMU riscv32, using `test_with_qemu.sh riscv32 rv32` | N/A - no binary releases; source vendored per-project | Open PR #3280 "RISC-V 32-bit vector intrinsics kernels" (opened Jan 2026, still open/unreviewed as of Aug 2026) reports 4.1x cycle-count reduction on `person_detection` and 1.47x-2.5x on `micro_speech` using hand-written RV32 vector intrinsics - the single most directly relevant open item for CFU-Playground, since it targets the exact same two benchmark models CFU-Playground ships. Not in `scope.yml`. |
| Renode (renode/renode) | System-level simulator (pinned `conf/renode.version` = `1.14.0+20231102git998250fe`); one of CFU-Playground's three execution backends (board/Renode/Verilator). Its `tlib` CPU-emulation core does dynamic binary translation (QEMU TCG-derived), i.e. a JIT | .NET/Mono app; riscv64-host build status not directly verified [NEEDS VERIFICATION] | `tlib` has an open RISC-V correctness bug, issue #936, "pack, packh, packw produce incorrect results in Renode/tlib" (Zbkb-extension emulation bug, affects fidelity of the simulated target core, not host architecture) | N/A | #936 open; two related tlib RISC-V bugs (#925 misaligned SC.W, #926 mstatus TVM/TW/TSR) were closed. Not in `scope.yml`. |
| Verilator (verilator/verilator) | Cycle-accurate Verilog simulator; CFU-Playground's `verilate.yml` CI and local simulation path | 4 issues with "riscv64" in the title (mostly build/hang reports on riscv64 hosts); 62 broader "riscv" issues, but most concern simulating RISC-V target designs rather than riscv64 host execution - mixed signal [NEEDS VERIFICATION] | - | - | No single confirmed riscv64-host blocker found; not conclusively clean either. Not in `scope.yml`. |
| Yosys/nextpnr (YosysHQ) | RTL synthesis/place-and-route | 0 issues found for riscv64 in nextpnr; Yosys not deeply queried | - | - | No confirmed blockers found; low confidence, would need a dedicated pass. Neither in `scope.yml`. |
| NumPy | Required for the `USE_SYMBIFLOW=1` build path | Tier 3 (NEP 57), functional scalar build | Native-hardware CI is build-only (no test step); QEMU CI is non-blocking | No PyPI riscv64 wheels yet; RISE wheel builder plus Debian/Ubuntu/Arch riscv64 packages available | Tracking issue #30216 (PyPI wheels). See `reports/numpy.md`. |
| SciPy | Same SymbiFlow/F4PGA requirements path | Builds | 12 open riscv64-tagged issues, notably #22839 "Hanging tests on riscv64 (under qemu)" (open) and #22753 `special.sph_harm` NaN mismatch (open) | Depends on NumPy/OpenBLAS riscv64 wheel status | Not in `scope.yml`. |
| SymPy | Same SymbiFlow/F4PGA requirements path | Pure Python, builds trivially | 0 riscv64-tagged issues found | PyPI wheel is pure-Python (arch-independent) | None found. Not in `scope.yml`. |
| Meson | Build system, vendored as a git submodule and also used to build several native deps | Pure Python; runs anywhere Python runs | 16-21 open issues matching "riscv" (mostly cross-file/target-triple requests for compiling *to* riscv, not about running Meson itself *on* riscv64) | N/A (pure Python) | Not in `scope.yml`. |

**Explicitly excluded/checked-clear:** cpuinfo (pytorch/cpuinfo) is ruy's upstream runtime-ISA-detection dependency in the full/mobile ruy build, but CFU-Playground's vendored TFLM copy of ruy does **not** pull in cpuinfo (no download rule in `third_party_downloads.inc`), consistent with TFLM's per-target static configuration (no runtime CPU dispatch needed on a fixed MCU/FPGA target). LiteX/Migen/Amaranth/LiteDRAM/LiteEth (the roughly 20 `litex-hub`/`enjoy-digital`/`m-labs` git submodules) are Python HDL/SoC-integration frameworks with no SIMD/JIT/crypto/compression/allocator surface, and are excluded from the "critical dependency" filter accordingly.

**Cross-references to existing `scope.yml` reports:** ruy to `reports/ruy.md`; FlatBuffers to `reports/flatbuffers.md`; NumPy to `reports/numpy.md`; cpuinfo to `reports/cpuinfo.md` (relevant to ruy's upstream chain, not this vendored build); LiteRT to `reports/litert.md` (related TFLite/LiteRT project family, no direct CFU-Playground cross-reference found there). gemmlowp, kissfft, SciPy, SymPy, Verilator, Yosys, nextpnr, Renode, and Meson have no existing report in `reports/`.

## 11. Known Bugs and Active Issues

No riscv64-specific bug exists because riscv64 is not a target of this project. The table below documents the substantive open bugs against the project's actual RV32 target.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#582](https://github.com/google/CFU-Playground/issues/582) | Instruction after CFU instruction is getting wrong result | Open | Correctness | Confirmed VexRiscv CfuPlugin bug: CPU spuriously re-issues CFU function 0 immediately after a real CFU call completes, corrupting the next register write. Root-caused by David Lattimore with waveform traces; VexRiscv maintainer Dolu1990 pushed a fix to VexRiscv itself (commit `c242744d`) confirmed to resolve it, but the CFU-Playground-side issue is still open pending verification/closure. |
| [#374](https://github.com/google/CFU-Playground/issues/374) | VexRiscV - SlimoptCfu does not appear to be working | Open | Correctness | On the HPS Proto2 board, a minimal CFU with the SlimOptCfu VexRiscv variant always returns wrong results; confirmed to work correctly with the default (non-slim) VexRiscv variant. 13 comments, unresolved. |
| [#596](https://github.com/google/CFU-Playground/issues/596) | Latest VexRiscv CFU interaction is hanging | Open | Correctness | Bumping VexRiscv/pregenerated Verilog to upstream master causes hangs, traced to a new `en` bit (bit 31) in the `mcfu_selector` CSR (0xBC0) defaulting to false; also found a CSR-address conflict between LiteX's and VexRiscv's CfuPlugin definitions, reported upstream to the VexRiscv maintainer. Root cause understood but issue stays open; no CI regression test was ever added. |
| [#324](https://github.com/google/CFU-Playground/issues/324) | Placement of functions in application binary significantly affects performance | Open | Performance | Instruction-cache-set collisions from linker layout cause up to 8% cycle-count swings (203M vs 188M cycles on the same `hps_accel` inference) depending solely on where `LoadInput()` lands relative to `ConvPerChannel4x4()`. Companion PR #323 (open, unmerged) makes the linker script per-project overridable. |
| [#286](https://github.com/google/CFU-Playground/issues/286) | hps_accel on PLATFORM=hps fMax is low | Open | Performance | fMax stuck around 43-48 MHz for the full SlimPerfCfu config vs approximately 89 MHz for a minimal SoC; investigation inconclusive, open since 2021. |
| [#331](https://github.com/google/CFU-Playground/issues/331) | High-fanout nets in HPS design | Open | Performance | Top nets have fanout up to 4708 (clock), 3402 (a CFU-internal memdat signal), 2335 (reset), flagged as likely fMax-limiting congestion sources; unresolved. |
| [#635](https://github.com/google/CFU-Playground/issues/635) / #745 / #506 | Accuracy of perf_get_mcycle()/perf_get_mcycle64() | Open | Tooling | Multiple independent reports (Arty A7-100T, KWS model) of implausible/inflated cycle counts from the perf-counter CSRs. One reporter (bala122) self-identified the real root cause as D-cache misses from loads/stores, not a hardware or timer-accuracy bug; effectively resolved in-thread but issue #635 left open. |
| [#566](https://github.com/google/CFU-Playground/issues/566) | Renode: cycles for a long-running CFU instruction are not tallied in $mcycle | Open | Tooling | In Renode co-simulation, an N-cycle CFU instruction always reports an `$mcycle` delta of 2 regardless of N, versus a correct N+4 on real Arty hardware - Renode simulation cycle accounting is wrong for multi-cycle CFUs. No comments or fix. |
| [#733](https://github.com/google/CFU-Playground/issues/733) | GDB doesn't support CUSTOM0/cfu instruction on disassemble command | Open | Tooling | GDB's binutils-based disassembler doesn't decode the CUSTOM0 opcode space used for the CFU instruction; users must rely on a project-provided disassembly script instead of stock GDB. Maintainer tcal-x acknowledged but has not had time to follow up; blocked partly on prerequisite issue #470. |

**Correctness bugs highlighted separately:** #582, #374, and #596 are genuine hardware/RTL correctness bugs in the VexRiscv CfuPlugin custom-instruction interface, not toolchain or tooling issues. #582 has an upstream VexRiscv fix already landed (commit `c242744d`) but the CFU-Playground tracking issue remains open pending verification. #374 and #596 remain open and unresolved. None of these are riscv64-specific since riscv64 is not a target.

**Performance/CI-health issues:** the `oxide_fmax_conda` fMax regression-tracking CI workflow is confirmed broken: every scheduled run since at least mid-2025 through the most recent run checked (2026-08-19) fails at the `actions/setup-python@v3` step with "Version 3.7 with arch x64 not found" (GitHub Actions dropped hosted-tool support for Python 3.7). This is specifically the CI job that measures fMax/performance regression across CPU variants and seeds, meaning no automated performance-regression data has been collected in over a year. No open GitHub issue currently tracks this; it appears to be unnoticed CI rot. `verilate_ci` is also failing on every daily run through the same period (not yet root-caused in this research pass).

## 12. Objections and Upstream Blockers

**Stated objections:** none exist, because no riscv64/64-bit port has ever been proposed for maintainers to object to or accept. The concept does not apply to this project's actual scope (32-bit RISC-V soft cores on FPGAs).

**Technical blockers (to a hypothetical riscv64/64-bit variant, framed for completeness):** the VexRiscv soft core as configured and generated by `GenCoreDefault.scala` in this repo has no RV64 mode; enabling one would require upstream SpinalHDL/VexRiscv core-generator changes far outside CFU-Playground's own codebase, plus a new toolchain, new startup assembly (`crt0-vexriscv.S` is written for RV32 register width), and re-validation of the entire CFU custom-opcode encoding path (`opcode_R()`, `cfu.h`) for 64-bit register semantics. This is a substantial undertaking with no indication anyone has scoped or requested it.

**Organizational blockers:** the project shows materially reduced maintenance bandwidth in the current period (Section 1) - the most recent substantive PR (#822) has sat unmerged for months, and several architecture-adjacent correctness bugs (#374, #596) remain open without resolution despite root causes being understood. A hypothetical riscv64/64-bit proposal would compete for attention against this existing backlog and the apparent current focus on routine dependency/CI maintenance rather than new capability development.

**Acceptance probability:** not meaningfully assessable, since no such proposal exists and the project's own stated purpose (a 32-bit soft-core FPGA acceleration playground) does not obviously benefit from a 64-bit variant - TFLM inference workloads on microcontroller-class targets are not inherently constrained by 32-bit addressing or register width in the way a general-purpose OS workload might be. [NEEDS VERIFICATION: no maintainer statement exists either way on hypothetical 64-bit interest, since it has never been raised.]

## 13. Investment Analysis

**RISE prior work check:** RISE has not funded, tracked, or engaged with CFU-Playground in any capacity (Section 1). There is no existing RISE investment to net out of the estimates below.

**Framing caveat for this section:** because CFU-Playground has no riscv64 target and none is a natural fit for its stated purpose (32-bit soft-core FPGA acceleration for microcontroller-class TFLM inference), the investment items below are framed around what could plausibly be done, but this report does not recommend treating riscv64 enablement of CFU-Playground itself as a priority investment area. The more actionable RISC-V-adjacent investment opportunity visible in the research findings is the open TensorFlow Lite Micro PR #3280 ("RISC-V 32-bit vector intrinsics kernels"), which targets the identical benchmark models CFU-Playground ships and would benefit the broader TFLM-on-RISC-V ecosystem regardless of CFU-Playground's own architecture scope.

### 13.1 Functional Enablement

A 64-bit (RV64) variant of the VexRiscv-based soft core and CFU interface would require: (a) upstream changes to the VexRiscv/SpinalHDL core generator to emit an RV64 variant, well outside this repository's scope; (b) a new `crt0-vexriscv.S`-equivalent startup path for 64-bit register width; (c) re-validation of the `opcode_R()` custom-instruction encoding path and the `instruction_handler.cc` trap-based division emulation for 64-bit semantics; (d) a working RV64 GCC/toolchain path through the project's Conda environment. No party has scoped this work, and it is not clear it serves the project's stated purpose (microcontroller-class ML inference acceleration), where 32-bit addressing is not typically a binding constraint. This is a large, open-ended R&D effort with unclear payoff, not a small enablement task.

### 13.2 Performance Optimization

Not applicable in the riscv64 sense (no such target exists). Within the project's actual RV32 scope, the most concrete, already-identified performance opportunity is closing the automated fMax-regression-tracking CI gap (Section 11) so that ongoing hardware changes can be measured against a baseline again, and finishing the linker-layout-overridability work started in PR #323 to eliminate the cache-collision performance variance documented in issue #324.

### 13.3 CI/CD Infrastructure

Not applicable in the riscv64 sense (no riscv64 CI target exists to build). Within the project's actual scope, restoring the broken `fmax-trials.yml` and `verilate.yml` scheduled CI jobs (both failing since at least mid-2025 due to GitHub Actions dropping Python 3.7 hosted-tool support) is a small, well-defined fix that would restore the project's only automated performance-regression signal.

### 13.4 Ecosystem Enablement

Not applicable; Section 10 is omitted per this report's scope rules, since CFU-Playground has no dependent package ecosystem of its own. The one ecosystem-adjacent RISC-V opportunity visible in the research is not within CFU-Playground's own repository: TensorFlow Lite Micro's open PR #3280 ("RISC-V 32-bit vector intrinsics kernels," opened Jan 2026, still unreviewed as of Aug 2026) reports a 4.1x cycle-count reduction on `person_detection` and 1.47x-2.5x on `micro_speech` using hand-written RV32 vector intrinsics - the same two benchmark models CFU-Playground ships. Reviewing and merging this upstream PR would benefit CFU-Playground's benchmark baseline indirectly (via the vendored TFLM dependency) without requiring any CFU-Playground-side architecture work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD (RV32 scope) | Fix broken `fmax-trials.yml`/`verilate.yml` CI (Python 3.7 hosted-tool removal) | 0.5-1 | Any contributor with CI access | Medium (restores lost regression-tracking signal) |
| Performance (RV32 scope) | Complete linker-layout overridability (PR #323) to close the cache-collision variance in issue #324 | 1-2 | Any contributor | Low-Medium |
| Ecosystem (adjacent, not this repo) | Review/merge upstream TFLite Micro PR #3280 (RV32 vector intrinsics kernels) | Not sized here - this is upstream TFLM's own PR, not CFU-Playground's; effort belongs to that project | External to CFU-Playground | Low, as an indirect ecosystem benefit |
| Functional (hypothetical riscv64) | Scope and prototype an RV64 VexRiscv variant + toolchain path | Not sized - open-ended R&D with unclear payoff for this project's stated microcontroller-class use case | Unassigned | Low, not recommended without a clearer use case |

**Overall recommendation:** CFU-Playground is not a meaningful riscv64 investment target in the literal sense used by this report series, because it has no riscv64 (or any 64-bit) architecture target and its stated purpose does not obviously require one. Any RISC-V-focused investment interest adjacent to this project is better directed at the RV32-specific CI/performance items above, or at the upstream TensorFlow Lite Micro RISC-V vector-intrinsics PR (#3280), which benefits the broader TFLM-on-RISC-V ecosystem that CFU-Playground's benchmarks depend on.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/CFU-Playground repository](https://github.com/google/CFU-Playground)
- [CFU-Playground documentation homepage](https://cfu-playground.readthedocs.io/)
- [docs/source/overview.rst - "The VexRiscV CPU is a 32 bit RISCV CPU"](https://github.com/google/CFU-Playground/blob/main/docs/source/overview.rst)
- [docs/source/step-by-step.rst - performance tutorial](https://github.com/google/CFU-Playground/blob/main/docs/source/step-by-step.rst)
- [docs/source/projects/mnv2_first.rst - MobileNetV2 accelerator benchmark](https://github.com/google/CFU-Playground/blob/main/docs/source/projects/mnv2_first.rst)
- [Issue #1 - RISCV toolchain issues](https://github.com/google/CFU-Playground/issues/1)
- [Issue #11 - Enhancement: support RISCV:Renode / CFU:Verilator co-simulation](https://github.com/google/CFU-Playground/issues/11)
- [Issue #57 - Installing riscv64-unknown-elf-gcc from packages does not guarantee compilation](https://github.com/google/CFU-Playground/issues/57)
- [PR #63 - scripts/setup: Improve gcc versioning](https://github.com/google/CFU-Playground/pull/63)
- [Issue #89 - RISC-V toolchain, questions about setup guide](https://github.com/google/CFU-Playground/issues/89)
- [Issue #142 - Switch to newlib](https://github.com/google/CFU-Playground/issues/142)
- [Issue #182 - Upgrade to use GCC 10.x toolchain](https://github.com/google/CFU-Playground/issues/182)
- [PR #160 - Add illegal instruction handler for boards using "Fomu" CPU variant](https://github.com/google/CFU-Playground/pull/160)
- [PR #207 - common: add perf_get_mcycle64 function](https://github.com/google/CFU-Playground/pull/207)
- [PR #222 - docs: fix setup-guide instructions](https://github.com/google/CFU-Playground/pull/222)
- [PR #304 - LiteX bump including picolibc](https://github.com/google/CFU-Playground/pull/304)
- [PR #332 - Add ice40 and riscv toolchain support to the conda env](https://github.com/google/CFU-Playground/pull/332)
- [PR #339 - docs: recommend Sifive August 2020 toolchain](https://github.com/google/CFU-Playground/pull/339)
- [Issue #582 - Instruction after CFU instruction is getting wrong result](https://github.com/google/CFU-Playground/issues/582)
- [Issue #374 - VexRiscV - SlimoptCfu does not appear to be working](https://github.com/google/CFU-Playground/issues/374)
- [Issue #596 - Latest VexRiscv CFU interaction is hanging](https://github.com/google/CFU-Playground/issues/596)
- [Issue #324 - Placement of functions in application binary significantly affects performance](https://github.com/google/CFU-Playground/issues/324)
- [PR #323 - Optimize function layout in hps_accel project](https://github.com/google/CFU-Playground/pull/323)
- [Issue #286 - hps_accel on PLATFORM=hps fMax is low](https://github.com/google/CFU-Playground/issues/286)
- [Issue #331 - High-fanout nets in HPS design](https://github.com/google/CFU-Playground/issues/331)
- [Issue #635 - Accuracy of perf_get_mcycle() and perf_get_mcycle64() using Arty a7 100T board](https://github.com/google/CFU-Playground/issues/635)
- [Issue #566 - Renode: cycles for a long-running CFU instruction are not tallied in $mcycle](https://github.com/google/CFU-Playground/issues/566)
- [Issue #733 - GDB doesn't support CUSTOM0/cfu instruction on disassemble command](https://github.com/google/CFU-Playground/issues/733)
- [Issue #818 - OPENLANE Integration](https://github.com/google/CFU-Playground/issues/818)
- [PR #822 - Increase IMGC tensor arena to 54 KiB](https://github.com/google/CFU-Playground/pull/822)
- [PR #129 - Add support for the iCEbreaker board](https://github.com/google/CFU-Playground/pull/129)
- [google/ruy repository](https://github.com/google/ruy)
- [google/gemmlowp repository](https://github.com/google/gemmlowp)
- [mborgerding/kissfft repository](https://github.com/mborgerding/kissfft)
- [google/flatbuffers repository](https://github.com/google/flatbuffers)
- [tensorflow/tflite-micro repository](https://github.com/tensorflow/tflite-micro)
- [tflite-micro PR #3280 - RISC-V 32-bit vector intrinsics kernels](https://github.com/tensorflow/tflite-micro/pull/3280)
- [renode/renode repository](https://github.com/renode/renode)
- [renode/renode issue #936 - pack, packh, packw produce incorrect results in Renode/tlib](https://github.com/renode/renode/issues/936)
- [verilator/verilator repository](https://github.com/verilator/verilator)
- [PyPI JSON API - cfu-playground (404, package does not exist)](https://pypi.org/pypi/cfu-playground/json)
- [Debian package tracker - cfu-playground (404)](https://tracker.debian.org/pkg/cfu-playground)
- [Arch Linux RISC-V port overview](https://archriscv.felixc.at/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [NumPy issue #30216 - riscv64 wheels](https://github.com/numpy/numpy/issues/30216)
- [SciPy issue #22839 - riscv64 QEMU hanging tests](https://github.com/scipy/scipy/issues/22839)
- [SciPy issue #22753 - riscv64 sph_harm NaN mismatch](https://github.com/scipy/scipy/issues/22753)
