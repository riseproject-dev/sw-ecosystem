---
title: Wa-lang
parent: Project Reports
color: red
---

{% include dependency-graph.html slug="dependencies" subset="wa-lang" %}

# Wa-lang

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for Wa-lang<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wa-lang (also called "Wa" or 凹语言) is a WebAssembly-targeting programming language with a dual Chinese/English frontend, implemented in Go. It is self-hosted in the sense that it ships its own hand-written assembler and linker per target architecture (x64, arm64, loong64, riscv32/64) rather than depending on GCC or LLVM for native code generation.

**Governance.** There is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository (all three paths return 404). Governance is informal and centered on the original author. The project's copyright and contributor-agreement counterparty is a private company, Wuhan Wa Language Technology Co., Ltd. (武汉凹语言科技有限公司), stated on [wa-lang.org](https://wa-lang.org/) and in the Wa Contributor Agreement (`wca/wca.md`). This is not a nonprofit foundation; it functions as an IP-holding entity for the founders.

**Corporate/consortium affiliation.** Wa-lang is **not** a RISE Project member - the full member list at [riseproject.dev/members](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) contains no mention of Wa-lang. It is listed in the CNCF Landscape under "wasm-languages," which is a directory listing, not membership or sponsorship.

**License.** Dual-licensed: compiler source under AGPL-v3, standard library under MIT. The README explicitly offers custom licensing for commercial users who do not want AGPL's copyleft.

**Canonical repository.** The project states its canonical repo is `gitcode.com/wa-lang/wa` (a Chinese CI/CD platform); GitHub ([github.com/wa-lang/wa](https://github.com/wa-lang/wa)) is stated to be a mirror.

**Founders and contributors.** The project was founded by three individuals described in `docs/goals.md` as "Gophers" pursuing a hobby/side project with no KPI targets or corporate mandate: Chai Shushan (柴树杉), Ding Ernan (丁尔男), Shi Bin (史斌). Commit-history analysis described in the underlying research as covering "the last 500 commits on master" reports chai2010 / Chai Shushan (chaishushan@gmail.com) - 610 commits and DingErNan (476582@qq.com) - 109 commits, plus a single commit from `imalasong` [note: these per-author counts sum to more than 500, a discrepancy in the underlying source data as reported - flagged per verification policy]. No corporate email domains appear among committers. Contribution is gated by the Wa Contributor Agreement (WCA), which every PR author must sign by email before any PR is reviewed or merged; it assigns joint/co-ownership of copyright to Wuhan Wa Language Technology Co., Ltd. under PRC law. The README also states "we no longer accept PRs for modifications to third-party libraries."

**Community culture on new ports.** There is no RFC/proposal process, port-acceptance checklist, or public roadmap issue governing new architecture ports. RISC-V support was added unilaterally by the founder (chai2010) over roughly 2.5 months with no external contributor involvement, consistent with the project's stated personal-side-project framing.

## 2. Port History and Upstreaming Timeline

All RISC-V work landed as direct commits to `master` by a single author; none went through a pull request or a tracking issue (confirmed by two independent zero-result searches of `search_issues`/`search_pull_requests` for "riscv"/"riscv64" against `wa-lang/wa`, and by GitHub's own issue-search UI).

| Date | Event | Source |
|---|---|---|
| 2025-06-30 | Initial `exp/riscv` package scaffold | [commit 51c5a549](https://github.com/wa-lang/wa/commit/51c5a549f76b8d9835d8f0cb98c4fcd88a1e347f) |
| 2025-07-10 | Moved to `p9asm/riscv` (Plan9-style assembler layout) | [commit aafc3146](https://github.com/wa-lang/wa/commit/aafc3146515b73bbfa6c8daea1b6f15ad6143673) |
| Aug 2025 (~20 commits) | Instruction encoding/decoding, pseudo-instructions, formatting, Chinese mnemonics, tests under `native/riscv` | representative: commit 9c66a4bc (08-20), commit 2e583fc4 (08-22), commit f930032c (08-26) |
| 2025-11-06 | Added internal `riscv-native` flag to `wa build` | [commit 70f09b48](https://github.com/wa-lang/wa/commit/70f09b48e0628309a979872ab0dbe2216bf36dd2) |
| 2025-11-16 | Chinese-name support for RISCV assembly instructions | [commit ff28d4bd](https://github.com/wa-lang/wa/commit/ff28d4bde759c56a3a23243225db3060e649e636) |
| 2025-12-10 | Fixed a broken RISCV example | [commit b87160d1](https://github.com/wa-lang/wa/commit/b87160d1d82bdecdc23b3867f82be4ed8db4d3c7) |
| 2025-12-27 | Improved RISCV assembler stack-frame handling | [commit a7aa92fd](https://github.com/wa-lang/wa/commit/a7aa92fdc57ea822ede0ca5bf36b530c8531f98e) |
| 2026-02-10 | "Restore RISCV support" cluster (native/asm, wat2rv skeleton, RISCV assembler) - same-day, implying a regression had occurred | commits [4c1143e6](https://github.com/wa-lang/wa/commit/4c1143e62443d18dbbc884ec550d29d7ea89b479), [6d55d3f5](https://github.com/wa-lang/wa/commit/6d55d3f5a4c3915f65c463c2d194bbfd3a34a43b), [d420a647](https://github.com/wa-lang/wa/commit/d420a647b02c78ec413386bbff9cbb62dd77157d) |

**Key contributor:** chai2010 (Chai Shushan, chaishushan@gmail.com) authored all ~38 identified RISC-V-related commits. No other contributor has touched RISC-V code. No organizational affiliation is documented for this individual beyond the personal-side-project framing described in Section 1.

**Is it fully upstream?** There is only one upstream (wa-lang/wa is itself the project), so in that narrow sense yes. However, the port was never routed through GitHub's review process: no tracking issue, no design-discussion issue, no pull request, and therefore no review comments exist for any of this work.

## 3. Upstream Support Tier

No formal tier policy document exists (no PLATFORMS.md or SUPPORT.md). The closest equivalent is the support matrix in [`docs/target.md`](https://github.com/wa-lang/wa/blob/master/docs/target.md):

| OS \ Arch | wasm | clang | loong64 | RISCV | X64 | ARM64 |
|---|---|---|---|---|---|---|
| linux | OK | OK | OK | **TODO** | OK | **TODO** |
| windows | OK | OK | | | OK | TODO |
| arduino | | OK | | | | |
| wasm4 | OK | | | | | |
| js | OK | | | | | |

RISC-V/Linux is marked TODO, not OK. Notably, ARM64/Linux carries the identical TODO marking in this same table - this is corroborated in Section 4 below, where the arm64 native-compiler backend (`wat2arm64`) was independently found to be dead code in the same state as the riscv64 backend. RISC-V is not singled out among the maintainer's own "not yet done" targets.

**Comparison table:**

| | amd64 (X64) | arm64 | riscv64 |
|---|---|---|---|
| docs/target.md status | OK | TODO | TODO |
| Upstream CI builds/tests | Yes (ubuntu-latest, windows-2022, macos-latest runners) | Data not available: runner architecture for `macos-latest` not confirmed in research; no explicit arm64 cross-build/test step found | No (confirmed by direct read of all 4 workflow files + grep) |
| Official release binaries | Yes (linux-amd64, windows-amd64, darwin-amd64) | Yes (darwin-arm64, linux-arm64) | Yes (linux-riscv64, since at least v1.1.0 per release notes) |
| Native "compile-to-target" backend (`wat2xx`) functional | Yes (implied working; only x64 and loong64 confirmed wired/real) | No - confirmed dead code, copy of loong64 backend | No - confirmed dead code, copy of loong64 backend |

## 4. Technical Architecture and RISC-V-Specific Subsystems

| Component | Files / lines | Wired to a CLI command? | Grade |
|---|---|---|---|
| Instruction encoder/decoder/assembler (`internal/native/riscv/`: a_out.go, opcode.go, encode.go, decode.go, anames.go, lookup.go, asm.go, utils.go) | 12 files, 3,217 lines | Yes - `wa objdump` (`riscv.Decode`), `wa asm2elf -arch=riscv64`, `wa fmt`, inline-asm path (`asmFuncBody_inst_riscv`) | **Full** - hand-tuned R/I/S/B/U/R4-type bit-layout encoding, full X0-X31 register set, own unit tests pass (`go test ./internal/native/riscv/...`) |
| CPU emulator (`internal/native/wemu/riscv32`, `riscv64`, `cpu.go`) | 4 files, 796 lines | Yes - `internal/native/wemu/vm.go` dispatches `abi.RISCV32/64` to `NewCPU()`, exposed via `wa wemu` | **Partial** - genuinely wired step-interpreter (~71 opcode cases) but zero test files (`go test ./internal/native/wemu/...` -> "no test files"), unverified against real hardware or a reference toolchain |
| WASM-to-native RISC-V compiler backend (`internal/native/wat2rv/`) | 14 files, 5,999 lines | **No** - zero importers anywhere in the repo (`grep -rln "native/wat2rv"` outside its own directory returns nothing) | **Missing/dead** - the entry function is literally named `Wat2LA64` with comment "translate Wat program to LoongArch assembly," calling `newWat2LAWorker`; it still emits LoongArch mnemonics (`st.w`, `ld.d`, `lu12i.w`, `add.d`, `jirl` - 593 total occurrences of LoongArch-specific mnemonics) and LoongArch panic strings ("wat2la: empty local name" etc.); zero genuine RISC-V mnemonics (`addi`, `ld`, `sd`, `jalr`, `auipc`, `lw`, `sw` all return 0 matches) |
| CLI entry point `wa wat2xx riscv` (`internal/app/appwat2xx/riscv.go`) | 23 lines | N/A - it is the entry point | **Missing** - literal body `fmt.Println("TODO"); os.Exit(1)` |
| Native build pipeline (`internal/app/appnative/native_riscv/`) | - | Does not exist (compare `native_x64/`, `native_loong64/`, both of which have `build_wa_wz.go` + `build_wat_x.go`) | **Missing** |
| Calling-convention/stack-frame layout (`internal/native/ast/astutil/frame_riscv_x.go`) | 207 lines | Yes | **Full** |
| Assembler pipeline wiring (`internal/native/asm/asm_func_riscv_x.go`) | 166 lines | Yes - wires `EncodeRV32`/`EncodeRV64` into the generic pipeline | **Full** |
| Hand-written RISC-V assembly parser (`internal/native/parser/parser_inst_riscv_x.go`) | 1,276 lines | Yes | **Full** |
| ESP32-C3 bare-metal build (`internal/app/appesp32/build.go`) | - | Yes - `wa esp32build -arch=riscv32|riscv64` | **Present**, uses the working asm/link pipeline |
| ABI/target plumbing (`abi/abi.go`, `abi/target.go`, `internal/native/abi/abi.go`, `internal/types/sizes.go`, `internal/native/link/link.go`, `internal/native/link/elf/elf.go`, `EM_RISCV=243`) | - | Yes | **Full** |

**ISA extensions implemented** (confirmed by reading `opcode.go`'s `_AOpContextTable`): RV32I, RV64I, Zicsr, M/RV64M, F, D, plus standard pseudo-instructions (`nop`, `mv`, `li`-family, branches, CSR pseudo-ops).

**Not implemented anywhere:**
- **RVV (Vector)** - zero real support. The only RVV artifact is `internal/native/riscv/testdata/plan9cases.txt`, a Go-assembler-style test fixture containing `VSETVLI`/`VANDVV`/`VORVV`/`VXORVV`/`VRGATHERVV` encodings, but none of these have corresponding entries in `opcode.go`, `anames.go`, or the decoder - not recognized by the assembler. Search for `vfloat32m1_t`-style RVV intrinsics: 0 matches.
- **A (Atomics)** - no `AMOADD`/`LR`/`SC`.
- **C (Compressed)** - none.
- **B/Zba/Zbb/Zbc/Zbs (Bitmanip)** - zero matches anywhere in the repo.
- No SIMD dispatch or multiversioning of any kind for riscv64.

This is not unique to RISC-V: `internal/native/wat2arm64/` is in an identical state - unwired, zero importers, `a64_ins.go` carries a `// TODO: 改成 ARM64` comment and the same LoongArch mnemonics, and its CLI entry point also just prints "TODO." Of the four `wat2xx` native compiler backends, only **x64** and **loong64** are real/wired; **arm64 and riscv64 compiler codegen are both non-functional dead code.**

## 5. Build System, Cross-Compilation, and Toolchain

Wa-lang is a Go program (`go.mod`, `main.go`, `Makefile`, one top-level `Dockerfile`). There is no CMake-based build system: no `CMakeLists.txt` at the root, no `cmake/riscv64.cmake`, no `-DUSE_X=OFF`-style CMake cache flags, no `BUILDING.md`/`docs/building.md`/`docs/cross-compilation.md`, and no riscv64 Dockerfile (`search_code` for `riscv64 filename:Dockerfile` returned 0 results). The only three `CMakeLists.txt` files in the tree are unrelated: a generic host-app template and standard ESP-IDF boilerplate for the `esp32-c3-hello` example (which targets riscv32, not riscv64).

**Building the `wa` compiler itself** (host toolchain): `Makefile` target `wa: go build -o ./build/bin/wa`. CI uses Go 1.17 (linux/windows jobs) or Go 1.24 (macOS/publish/docker jobs - a workflow comment notes "go1.21 support wasip1/wasm, go1.24 support wasmexport"). Top-level `Dockerfile`: `FROM --platform=linux/amd64 ubuntu:22.04`, installs `git`, copies the prebuilt `wa` binary. `.devcontainer/Dockerfile`: `FROM --platform=linux/amd64 golang:1.17`.

**RISC-V64 code generation is native to the compiler**, not GCC/Clang cross-compilation: `internal/native/riscv/` (encoder/decoder/assembler), `internal/native/wat2rv/` (dead code, Section 4), `internal/native/wemu/riscv64`/`riscv32` (software CPU emulator). `wa asm2elf -arch=riscv64 <file>.s` compiles hand-written wa-assembly directly to a bare-metal ELF; the `-arch` flag (`internal/app/appasm2xx/elf.go`) accepts only `loong64|riscv32|riscv64` - notably, x64 and arm64 are not options for this hand-written-assembly path.

**Exact toolchain and QEMU commands** (from `internal/native/examples/hello-riscv/{Makefile,readme.md}` and `hello-riscv-v3/Makefile`):

External toolchain (for hand-written `.S` assembly, Windows-hosted per the readme): SiFive `freedom-tools` release `riscv64-unknown-elf-toolchain-10.2.0-2020.12.8` (GCC-based bare-metal ELF toolchain, bundling GNU binutils' `riscv64-unknown-elf-as`/`riscv64-unknown-elf-ld`), plus `qemu-w64-setup-20250814.exe`. No other minimum GCC/Clang version is documented anywhere in the repo.

```
riscv64-unknown-elf-as hello.S -o hello.o
riscv64-unknown-elf-ld -Ttext=0x80000000 hello.o -o hello.elf.exe
qemu-system-riscv64 -machine virt -nographic -bios none -kernel hello.elf.exe
```

(riscv32 variant identical with `riscv32-unknown-elf-*`/`qemu-system-riscv32`.)

Using wa's own toolchain instead of an external one (`hello-riscv-v3/Makefile`):

```
go run ../../../../main.go asm2elf -arch=riscv64 hello_riscv64.ws
go run ../../../../main.go objdump -prog hello_riscv64.ws.elf.exe
go run ../../../../main.go wemu hello_riscv64.ws.elf.exe
qemu-system-riscv64 -machine virt -nographic -bios none -kernel hello_riscv64.ws.elf.exe
```

`hello-riscv-elf/Makefile`: `go run main.go && qemu-system-riscv64 -machine virt -nographic -bios none -kernel a.out.exe`. wa's own debugger/emulator is invoked as `wa wemu hello.elf.exe` / `wa wemu -d hello.elf.exe` (interactive `step/jump/xregs/fregs/trace`).

No `-DUSE_X=OFF`-style flags exist (no CMake). The closest analog is the compiler's own CLI flags: `wa asm2elf -arch=<loong64|riscv32|riscv64>`, `-DRAM-base`, `-DRAM-size`, `-entry`, `-debug`.

**Known build failures:** Data not available beyond the confirmed-dead `wat2rv` backend (Section 4), which is not a build-time failure per se - it compiles as valid Go source and only produces incorrect output if ever invoked at runtime through a path that does not currently exist.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compile Wa/WASM source to native machine code (`wat2xx`) | Working (x64 backend confirmed wired) | Dead/stub (`wat2arm64`) | Dead/stub (`wat2rv`) |
| Hand-written assembly -> ELF (`asm2elf`) | Not offered (flag accepts only loong64/riscv32/riscv64) | Not offered | Working, tested (`go test` passes) |
| CPU emulator (`wemu`) | Data not available (not mentioned in research for amd64) | Data not available | Present, untested (0 test files), known correctness bugs (below) |
| Upstream CI test execution | Yes | Data not available (macOS runner architecture unconfirmed) | No (0 riscv references in any of 4 workflow files) |
| Official release binary | Yes | Yes | Yes |
| ISA extensions covered by assembler | Full x86-64 (implied, not itemized in research) | Data not available | RV32I, RV64I, Zicsr, M, F, D only - RVV, A, C, B all absent |

**Functional gaps.** Wa/WASM source cannot be compiled directly to riscv64 machine code via `wa build`/`wa wat2xx` (dead stub); only hand-assembled `.ws` riscv64 files can be produced via `asm2elf`. Any hand-written riscv64 assembly using Vector, Atomics, Compressed, or Bitmanip extensions cannot be assembled at all - the encoder has no entries for them. In the emulator, F/D instructions, CSR instructions (`ECALL`/`EBREAK`/`CSRRW`/etc.), and `MULH`/`MULHSU`/`MULHU` all return "unsupport" errors.

**Performance gaps.** No RVV/SIMD support exists at the encoder level (not just the emulator), so no performance-oriented riscv64 code path exists to measure. Data not available: no quantified performance delta, because no benchmark of any kind was found to exist for Wa-lang on RISC-V (Section 11 confirms this exhaustively).

**Security hardening gaps.** Data not available: research did not address stack protection, CFI, ASLR, or comparable hardening features for any architecture in Wa-lang.

**NaN / floating-point semantics.** No NaN-specific bugs were found, but only because F/D floating-point instructions are entirely unimplemented in the `wemu` emulator (falls through to a default "unsupported" error with no `case riscv.AF...` present at all) - there is no execution path in which a NaN-handling bug could occur. Whether the assembler-encoded F/D instructions behave correctly on real riscv64 hardware or under QEMU is untested; the README itself states RISC-V "has not yet undergone hardware testing due to the lack of a physical environment."

## 7. CI/CD Infrastructure

Confirmed by cloning `wa-lang/wa` fresh (HEAD `68289efad08785938a1ea5225c23d0fcbf5bb9cb`) and reading all four GitHub Actions workflow files byte-for-byte, plus `grep -rniE "riscv|risc-v|qemu" .github/workflows/` (exit code 1, zero matches). No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` exist anywhere in the repository.

- **`cla.yml`** ("Check CLA") - triggers on `pull_request`/`push` to `main`/`master`/`releases/*`, runs on `ubuntu-latest`, runs `go run ./wca/check-cla.go`.
- **`wa.yml`** ("Wa", the main build/test workflow) - triggers on `pull_request`/`push` to `main`/`master`/`releases/*`, three jobs: `build-and-test-ubuntu` (`ubuntu-latest`), `build-and-test-windows` (`windows-2022`), `build-and-test-macos` (`macos-latest`). Each runs `make ci-test-all`, `go test ./...`, `go install`, then `wa run` on example files. No riscv target flag, no cross-compilation step, no QEMU, no alternate runner.
- **`release.yml`** ("Release," triggered on `v*` tags) - `Test` and `Publish` jobs, both `ubuntu-latest`. Builds a single Docker image via plain `docker build ... --tag ghcr.io/wa-lang/wa:${{ github.ref_name }}` - no `--platform`, no buildx, no multi-arch manifest.
- **`publish.yml`** ("Deploy") - `deploy` and `build-push-docker` jobs, both `ubuntu-latest`. Builds wasm/JS examples and a single-arch Docker image.

No `docker/setup-qemu-action` or equivalent appears anywhere. No RISE RISC-V runner label (`ubuntu-24.04-riscv` or similar) is referenced in any workflow, and no reference to `riseproject-dev` infrastructure was found in the repository.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (native runner) | Data not available (macOS runner architecture unconfirmed) | No |
| CI test | Yes | Data not available | No |
| Release artifact | Yes | Yes (darwin-arm64, linux-arm64) | Yes (linux-riscv64, built via a mechanism not visible in any of the 4 workflow files) |
| Hardware used | GitHub-hosted x86_64 (`ubuntu-latest`, `windows-2022`) | GitHub-hosted (`macos-latest`) | None - no riscv64 runner, self-hosted or otherwise |
| RISE runner usage | No | No | No |

The absence of a riscv64 CI runner does not, by itself, disprove the existence of the riscv64 release artifact examined in Section 8 - Go trivially cross-compiles to `GOARCH=riscv64` from an amd64 host with no native riscv64 hardware or QEMU required, so it is possible the release zip is produced by a step or process not captured in these four workflow files, or built and uploaded manually by the maintainer. Data not available: the exact mechanism producing `wa_v1.8.0_linux-riscv64.zip` was not located in any CI configuration file.

## 8. Distribution and Release Status

**GitHub Releases** (verified directly, not inferred): release `v1.8.0` (2026-03-02) and `v1.7.0` (2026-02-16) both list an asset `wa_vX.X.X_linux-riscv64.zip` (~12.2-12.3 MB) alongside darwin-amd64/arm64, linux-amd64/arm64/loong64, wasip1-wasm, windows-amd64, and source archives. The v1.8.0 asset was downloaded directly (`release-assets.githubusercontent.com`, HTTP 200, 12,884,872 bytes), its MD5 (`627a797b36d2032bf75bcda1a4d87a71`) matched the value published in the release's own `wa-v1.8.0.checksums.txt`, and `readelf -h` on the extracted `wa/bin/wa` confirmed: `ELF 64-bit LSB executable, UCB RISC-V, double-float ABI, version 1 (SYSV), statically linked, not stripped`. This is a genuine, correctly-built riscv64 binary of the `wa` tool itself (i.e., the toolchain runs on a riscv64 Linux host). Release notes trace riscv64 binary packaging back to `v1.1.0` ("增加 linux/riscv64 和 linux/loong64 平台的二进制打包").

This host-execution capability is distinct from the "compile Wa/WASM source to riscv64 machine code" compiler-target capability addressed in Sections 4 and 6, which is confirmed non-functional.

**PyPI:** `https://pypi.org/pypi/wa-lang/json` returns HTTP 404 - no package named `wa-lang` exists. Not applicable; Wa-lang is a Go toolchain, not a Python package.

**RISE wheel builder / GitLab PyPI proxy:** 404 (redirects to `pypi.org/simple/wa-lang/`, itself 404).

**Ubuntu 26.04 "resolute":** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Wa-lang&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results." No Ubuntu binary package exists.

**Arch Linux RISC-V** (archriscv.felixc.at): not confirmed present; the fetched page was not a searchable package database in the form retrieved - weakest-confidence channel, treated as unconfirmed rather than a rigorous negative.

**npm / Maven / OCI:** no riscv64-platform artifacts found; the Docker images built in `release.yml`/`publish.yml` are single default-platform (amd64) only, with no `--platform linux/riscv64` or buildx multi-arch step.

**What a user must do to get a working binary:** download `wa_v1.8.0_linux-riscv64.zip` (or a later release) directly from [GitHub Releases](https://github.com/wa-lang/wa/releases) and extract it - no package-manager path exists on any distribution checked. Alternatively, build from source with any riscv64-capable Go toolchain, since `go.mod` declares zero external dependencies.

## 9. Dependencies

`go.mod` declares zero external Go module requirements (no `go.sum` either) - Wa-lang vendors everything it needs under `internal/3rdparty/`. No `import "C"` (cgo) was found anywhere in the tree, so there is no native-library riscv64 packaging risk from vendored utilities.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Go | Build-dependency, critical - the language/toolchain Wa-lang is written in and built with | Native `linux/riscv64` GOARCH port; used to cross-compile the `wa` binary itself | Data not available: `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) this session, so Go's own riscv64 CI/test status was not independently re-verified [NEEDS VERIFICATION] | Full official riscv64 toolchain releases (per prior knowledge, not independently re-verified this session) | No blocking issues identified against Wa-lang's specific use of Go |
| QEMU | Test-dependency, optional | N/A (runtime tool, not compiled) | Used in example Makefiles (`hello-riscv`, `hello-riscv-v3`, `hello-riscv-elf`) via `qemu-system-riscv64` to run hand-assembled riscv64 ELF binaries locally | N/A | Not invoked anywhere in CI (confirmed: 0 matches for "qemu" across all 4 workflow files); purely a local developer-verification tool, and per the maintainer's own statement riscv64 has "not yet undergone hardware testing," implying this path is not routinely exercised even locally |
| GNU binutils | Test-dependency, optional | N/A | Bundled inside the SiFive `freedom-tools riscv64-unknown-elf-toolchain-10.2.0-2020.12.8` (`riscv64-unknown-elf-as`/`-ld`), used as an alternative to Wa's own hand-written assembler for the hand-written `.S` example in `hello-riscv/Makefile` | N/A | Not used in CI; developer-local only |
| wazero (vendored, `internal/3rdparty/wazero`) | Indirect - embedded WebAssembly runtime with an optimizing JIT ("compiler"/"wazevo") backend, drives `wa run`, `appplay`, `appwemu`, LSP, WASI imports | Interpreter engine (pure Go, no arch-specific code) builds and runs on riscv64 without issue | Upstream wazero's interpreter is tested on riscv64 via emulation in upstream CI (general finding, not Wa-lang-specific); no riscv64 CI signal exists for Wa-lang's own vendored copy | N/A (embedded source, not separately released) | The JIT/"compiler" engine (`internal/engine/compiler`, files `arch_amd64.go`/`arch_arm64.go`/`arch_arm64.s`) and the newer wazevo optimizing compiler both implement only amd64 and arm64; `arch_other.go` is the generic riscv64 fallback. riscv64 silently falls back to the non-JIT interpreter - functionally correct, but materially slower (no native-code JIT, no SIMD vector-ops path). Not listed in RISE's `projects.yml`; no dedicated status report was found |

**Deep-dive on the one critical dependency.** With `go.mod` empty, wazero is the only vendored component matching JIT/SIMD/numerics screening criteria. Its riscv64 gap is a performance gap, not a correctness gap: the interpreter execution path is functionally correct on riscv64, it simply cannot use the accelerated JIT/wazevo path that amd64 and arm64 get. Separately, Wa-lang's own riscv64 native-codegen backend (`wat2rv`/`wemu/riscv64`, Section 4) has no CI coverage today, so its riscv64 correctness is unverified by automation - this is a Wa-lang-specific gap, not a dependency issue.

Section 10 (Ecosystem Status) is omitted: Wa-lang is a standalone Go-based compiler toolchain distributed as OS/arch zip archives, with no PyPI, npm, Maven, or Kubernetes-operator style dependent package ecosystem that would need separate riscv64 enablement.

## 11. Known Bugs and Active Issues

No GitHub issues mentioning "riscv" exist for `wa-lang/wa` - confirmed by two independent rounds of `search_issues`/`search_pull_requests` (0 results for "riscv", "riscv64", "riscv汇编", "RISC-V support", and other phrasings) and by GitHub's own issue-search UI ("Your search did not match any issues"). Bug tracking for this subsystem happens through commit messages and source code, not the issue tracker. The following were found by direct source inspection of `internal/native/wemu/riscv64/cpu.go`:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (no issue tracked) | `SD` (store doubleword) is a silent no-op | Open, unfixed | Critical - correctness | Line 258: `case riscv.ASD:` has an empty body, unlike `SB`/`SH`/`SW` which correctly call `bus.Write(...)`. Any RV64 program storing a 64-bit value/pointer via `sd` does nothing; the write is silently dropped |
| (no issue tracked) | `REM` (64-bit signed remainder) truncates to 32 bits | Open, unfixed | Critical - correctness | Lines 326-331: `AREM` computes `int32(Rs1) % int32(Rs2)`, identical to the 32-bit `REMW` implementation, instead of using `int64` |
| (no issue tracked) | All F/D floating-point instructions unimplemented in the emulator | Open, unfixed | High - missing feature | No `case riscv.AF...` exists in the switch at all; falls to a default "unsupported" error |
| (no issue tracked) | CSR instructions unsupported (`ECALL`/`EBREAK`/`CSRRW/S/C/WI/SI/CI`) | Open, unfixed (explicit by design per source comment) | High | Lines 235-298 explicitly `return fmt.Errorf("...: unsupport")`, comment "涉及 CSR, 暂不支持" |
| (no issue tracked) | `MULH`/`MULHSU`/`MULHU` (high-bits multiply) unsupported | Open, unfixed | Medium | Lines 306-310, all `return fmt.Errorf("...: unsupport")` |
| (no issue tracked) | WASM-to-native RISC-V compiler backend (`wat2rv`) is dead/non-functional | Open, unfixed | Critical - core feature | Zero importers repo-wide; emits LoongArch mnemonics instead of RISC-V mnemonics; CLI entry `wa wat2xx riscv` is a literal `TODO`/`os.Exit(1)` stub |
| commit b87160d1 | "修复 RISCV 例子不能运行的问题" (fixed a broken RISCV example) | Fixed, 2025-12-10 | Historical | [commit b87160d1](https://github.com/wa-lang/wa/commit/b87160d1d82bdecdc23b3867f82be4ed8db4d3c7) |
| commits 4c1143e6 / 6d55d3f5 / d420a647 | "Restore RISCV support" cluster | Fixed (restored), 2026-02-10 | Historical | Same-day cluster implying a prior regression; the regression itself was never tracked in an issue |

**Correctness bugs highlighted separately:** the `SD` silent no-op and `REM` 32-bit truncation are silent-data-corruption-class bugs in the emulator, both confirmed by direct source reading, and neither has ever been reported or tracked because riscv64 has no issue-tracker presence at all.

**Benchmarks:** exhaustive search (GitHub issue search, general web search, riseproject.dev/blog) found zero published performance benchmarks for Wa-lang on RISC-V - no CoreMark/MIPS numbers, no cycle counts, no comparison tables. The only "RISC-V execution" capability is `wa wemu`, described in its own doc (`internal/native/wemu/readme.md`) as "这是一个非常简陋的实现" ("a very crude/rudimentary implementation") intended only for debugging during development, not a performance-representative environment.

## 12. Objections and Upstream Blockers

- **Stated technical blocker (maintainer's own words):** "The RISC-V platform has not yet undergone hardware testing due to the lack of a physical environment" (README) - the maintainer lacks riscv64 hardware to validate the port.
- **Process blocker:** no design-discussion issue, no RFC, no port-acceptance checklist exists for any architecture port; all riscv64 work was unilateral and founder-driven (chai2010), with zero external contributor involvement in this subsystem specifically.
- **Organizational/contribution-model blocker:** contribution is gated by the WCA, requiring signature and assignment of joint copyright to Wuhan Wa Language Technology Co., Ltd., and the README states "we no longer accept PRs for modifications to third-party libraries." Whether this would extend to refusing external riscv64 contributions specifically is not directly evidenced in the research and is marked [NEEDS VERIFICATION].
- **No RISE involvement or funding:** confirmed absent. Wa-lang is not a RISE member (Section 1), has no RISE blog coverage (9 posts checked at [riseproject.dev/blog](https://riseproject.dev/blog), none mention Wa-lang), is not in the RISE wheel builder (82 packages checked at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), Wa-lang absent), and the only GitHub-org trace is a single, unwritten queue entry in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` alongside ~80 other candidate projects, with no corresponding report file produced.
- **Acceptance probability of a hypothetical external fix:** Data not available - no historical precedent of an external contributor submitting a reviewed, PR-based change to this codebase was found in the research; the observed contribution model for riscv64 specifically is closed and founder-driven, so no evidence-based probability estimate can be given.

## 13. Readiness Assessment

- **Color:** red (no sub-case; red has no `color_case` value in the model)
- **Release provider:** upstream - a genuine riscv64 release artifact (`wa_v1.8.0_linux-riscv64.zip`) is published directly by the maintainer via GitHub Releases, independently verified via checksum match and `readelf` inspection (Section 8). This is not an optimization-purpose project, so no Optimization level applies.
- **Justification:** Wa-lang's own documentation explicitly marks RISCV/Linux as "TODO," not "OK," in its platform-support matrix ([`docs/target.md`](https://github.com/wa-lang/wa/blob/master/docs/target.md)), and its README states RISC-V "has not yet undergone hardware testing due to the lack of a physical environment." More decisively, direct source inspection confirms the project's WASM-to-native-RISC-V compiler backend (`internal/native/wat2rv/`) is dead, unreachable code - a mechanical copy of the LoongArch backend that still emits LoongArch mnemonics (`st.w`, `ld.d`, `lu12i.w`) and LoongArch panic strings, behind a CLI entry point (`wa wat2xx riscv`) that is a literal `fmt.Println("TODO"); os.Exit(1)` stub. No upstream CI builds or tests riscv64 in any form (zero matches across all 4 GitHub Actions workflow files, confirmed by direct read and grep). This combination - an explicit upstream "not supported" statement plus source-verified non-functional code for the project's core riscv64 value proposition (compiling to riscv64) - meets the red bar of "confirmed broken/non-functional," not merely "untested."
- **Nuance:** a genuinely working riscv64 host binary of the `wa` tool itself does exist and was independently verified (real RISC-V ELF, checksum-matched). This means the toolchain can run on a riscv64 Linux machine; it does not mean the toolchain can compile programs to riscv64 machine code, which is the capability that is confirmed broken.
- **Pending work that could change the grade:** none identified. There is no open PR addressing `wat2rv`, no tracking issue for the riscv64 gap, and no RISE involvement of any kind (Section 12). The one available lever not currently used is the RISE RISC-V Runners (announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)), which Wa-lang's workflows do not reference.

## 14. Investment Analysis

RISE has no funded work, CI runner usage, or engagement with Wa-lang today (Section 12) - all of the following is net-new scope, not work already covered by RISE.

### 14.1 Functional Enablement

The single largest gap is that the "compile to riscv64" capability does not functionally exist despite ~6,000 lines of `wat2rv` scaffold code. Closing it requires rewriting the WASM-to-native lowering to emit genuine RISC-V mnemonics (currently 0 matches for `addi`/`ld`/`sd`/`jalr`/`auipc`/`lw`/`sw`) and wiring the `wa wat2xx riscv` CLI stub to the fixed backend. Secondary work: fix the two silent-data-corruption bugs in the emulator (`SD` no-op, `REM` truncation) and implement F/D/CSR/MULH* execution.

### 14.2 Performance Optimization

No RVV, Atomics, Compressed, or Bitmanip extension support exists in the instruction encoder itself (not just the emulator), and no benchmark of any kind exists to establish a baseline. Baseline benchmarking on real riscv64 hardware is a prerequisite for any performance work, and the maintainer has stated no such hardware is available to them. Separately, wazero's JIT/wazevo lack of a riscv64 backend is an upstream `tetratelabs/wazero` concern, not a Wa-lang-specific fix, though Wa-lang vendors its own copy and could in principle upstream a contribution there.

### 14.3 CI/CD Infrastructure

Zero riscv64 signal exists across all 4 GitHub Actions workflow files today. RISE's [RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (generic `ubuntu-24.04-riscv` GitHub Actions label, Docker-in-Docker) are available infrastructure Wa-lang is not currently using; adopting them for a build-only or build+test job is comparatively low effort and separate from writing new riscv64 codegen.

### 14.4 Ecosystem Enablement

Not applicable - Wa-lang has no dependent package ecosystem (Section 10 omitted per the project's nature as a standalone toolchain).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Rewrite `wat2rv` to emit genuine RISC-V mnemonics and wire `wa wat2xx riscv` CLI to it | 6-10 | Wa-lang upstream (chai2010) or a funded contractor | Critical |
| Functional | Fix `wemu` correctness bugs (`SD` no-op, `REM` truncation, F/D execution, CSR/ECALL/EBREAK/MULH*) | 3-5 | Wa-lang upstream | High |
| Functional | Add RVV/A/C/B extension support to the `riscv/` encoder-decoder | 4-8 | Wa-lang upstream | Medium |
| Performance | Baseline riscv64 benchmarking on real hardware (none exists today) | 1-2 | Wa-lang upstream, requires hardware access (e.g. a RISE board farm) | High (prerequisite for any perf work) |
| Performance | wazero riscv64 JIT/wazevo backend | 8-12 (outside Wa-lang's direct ownership) | `tetratelabs/wazero` upstream | Medium |
| CI/CD | Add a riscv64 build(+test) job to `wa.yml` using RISE RISC-V Runners | 0.5-1 | Wa-lang upstream | High |
| CI/CD | Add `linux/riscv64` platform to Docker release builds (`release.yml`/`publish.yml`) | 0.5-1 | Wa-lang upstream | Low |

Effort figures are engineering-judgment estimates derived from the scope of the gaps documented in this report; they are not sourced from any estimate published by the project or by RISE, neither of which has published a scoped plan for this work.

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [wa-lang/wa GitHub repository](https://github.com/wa-lang/wa)
- [Wa-lang homepage](https://wa-lang.org/)
- [docs/target.md - platform support matrix](https://github.com/wa-lang/wa/blob/master/docs/target.md)
- [docs/asm_abi_rsicv.md - RISC-V calling convention (TODO stub)](https://github.com/wa-lang/wa/blob/master/docs/asm_abi_rsicv.md)
- [commit 51c5a549 - initial exp/riscv scaffold](https://github.com/wa-lang/wa/commit/51c5a549f76b8d9835d8f0cb98c4fcd88a1e347f)
- [commit aafc3146 - moved to p9asm/riscv](https://github.com/wa-lang/wa/commit/aafc3146515b73bbfa6c8daea1b6f15ad6143673)
- [commit 70f09b48 - added riscv-native build flag](https://github.com/wa-lang/wa/commit/70f09b48e0628309a979872ab0dbe2216bf36dd2)
- [commit ff28d4bd - Chinese-name support for RISCV mnemonics](https://github.com/wa-lang/wa/commit/ff28d4bde759c56a3a23243225db3060e649e636)
- [commit b87160d1 - fixed broken RISCV example](https://github.com/wa-lang/wa/commit/b87160d1d82bdecdc23b3867f82be4ed8db4d3c7)
- [commit a7aa92fd - improved RISCV stack-frame handling](https://github.com/wa-lang/wa/commit/a7aa92fdc57ea822ede0ca5bf36b530c8531f98e)
- [commit 4c1143e6 - restore RISCV support](https://github.com/wa-lang/wa/commit/4c1143e62443d18dbbc884ec550d29d7ea89b479)
- [commit 6d55d3f5 - add RISCV wat2rv skeleton](https://github.com/wa-lang/wa/commit/6d55d3f5a4c3915f65c463c2d194bbfd3a34a43b)
- [commit d420a647 - restore RISCV assembler](https://github.com/wa-lang/wa/commit/d420a647b02c78ec413386bbff9cbb62dd77157d)
- [wa-lang/wa releases](https://github.com/wa-lang/wa/releases)
- [wa-lang/wa v1.8.0 release](https://github.com/wa-lang/wa/releases/tag/v1.8.0)
- [wa-lang/wa v1.7.0 release](https://github.com/wa-lang/wa/releases/tag/v1.7.0)
- [wa-lang/wa issues search for "riscv" - 0 results](https://github.com/wa-lang/wa/issues?q=is%3Aissue+riscv)
- [PyPI wa-lang lookup - 404](https://pypi.org/pypi/wa-lang/json)
- [Ubuntu 26.04 resolute package search - no results](https://packages.ubuntu.com/search?keywords=Wa-lang&suite=resolute&searchon=names&section=all)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/sw-ecosystem project-reports queue (Wa-lang entry, unwritten)](https://github.com/riseproject-dev/sw-ecosystem)
