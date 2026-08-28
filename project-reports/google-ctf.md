---
title: google-ctf
parent: Project Reports
---

# google-ctf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for google-ctf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/google-ctf](https://github.com/google/google-ctf) is a public archive of competition challenge source code from the annual Google Capture The Flag security competition, running since 2017. It is not a software library, runtime, or tool. It contains challenge infrastructure (Docker environments, kernel patches, challenge binaries) and player-facing source files for post-competition learning.

**License:** Apache License 2.0.

**Governance:** Google internal security team (Google Security Team). Contributions require signing [Google's Contributor License Agreement](https://cla.developers.google.com). The README states explicitly "Note this is not an official Google product." No MAINTAINERS, OWNERS, or CODEOWNERS file exists in the repository.

**Top contributors by commit count (from research findings):**
- sirdarckcat (Eduardo Vela Nava, Google) -- 167 commits
- sroettger (Stephen Roettger, @google.com) -- 100 commits
- stephenR -- 66 commits [NEEDS VERIFICATION: affiliation not confirmed in findings]
- zetatwo (Carl Svensson, @google.com) -- large contributor, 2022-2024 challenges
- erikvarga (Erik Varga, @google.com) -- Hackceler8 game engine lead
- Kevin Hamacher (hamacher@google.com) -- author of the 2021 RISC-V hardware challenge

**RISE membership:** Google LLC is a Premier Member of the [RISE Project](https://riseproject.dev). The google-ctf repository itself is not a RISE-funded or RISE-tracked project; it does not appear in any RISE repository, blog post, or wheel builder list.

**Community posture on new ports:** Not applicable. google-ctf is a challenge archive. It has no platform support policy, no architecture tier system, and no end-user distribution. RISC-V appears in this repository exclusively as the subject of CTF challenges, not as a deployment target for the project infrastructure.

---

## 2. Port History and Upstreaming Timeline

There is no "RISC-V port" of google-ctf. The framework itself has no architecture-specific code and no concept of a supported platform matrix. RISC-V appears as the instruction set architecture used inside specific CTF puzzles.

| Date | Event | Source |
|------|-------|--------|
| 2019-11-27 | First RISC-V content committed: `other/re-risky/`, a guest challenge originally from Winja CTF 2018. Includes a custom 648-line RV64I software interpreter in C and cross-compiled challenge binaries. Author: Gynvael Coldwind (gynvael@coldwind.pl). | [google/google-ctf commit 005d4ff5](https://github.com/google/google-ctf) |
| 2021-06-15 | `2021/quals/hw-pcivault/` challenge authored: patches xv6-riscv kernel, implements a Rust-based RISC-V emulator (using `takahirox/riscv-rust` at commit b4895fc5) with a virtual PCIe device. Author: Kevin Hamacher (hamacher@google.com). | [google/google-ctf](https://github.com/google/google-ctf) |
| 2021-07-18 | `hw-pcivault` committed to the public repo as part of "opensource 2021 quals" by Stephen Roettger (sroettger@google.com). | [google/google-ctf](https://github.com/google/google-ctf) |
| 2024-06-24 | `2024/quals/pwn-unicornel/` committed by Carl Svensson (zetatwo@google.com). Implements a multi-architecture emulator server using Unicorn Engine; RISC-V is one of 10 supported guest ISAs. | [google/google-ctf](https://github.com/google/google-ctf) |

No RISC-V challenges appear in the 2022, 2023, or 2025 qualifier sets. The 2025 `rev-multiarch-1` and `pwn-multiarch-2` challenges use fully custom fictional ISAs, not RISC-V.

**Fully upstream:** Yes, in the sense that all RISC-V challenge code is already in the main branch of the public repository. There is no separate RISC-V branch or pending upstreaming work.

---

## 3. Upstream Support Tier

No formal tier policy exists. google-ctf is a source archive, not a distributed software product. The concepts of "supported platform," "release-blocking," and "official binaries" do not apply to this repository.

The table below characterizes what exists for each architecture in terms of CI, releases, and challenge presence.

| Capability | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI pipeline | None | None | None |
| Binary releases | None | None | None |
| Package (PyPI/Debian/etc.) | None | None | None |
| Challenge target (puzzle ISA) | Yes (misc-shellcode 2021, others) | Yes (misc-shellcode 2021) | Yes (re-risky 2018/2019, hw-pcivault 2021, pwn-unicornel 2024) |
| Infrastructure host platform | Yes (Docker base images) | Not confirmed | Not confirmed |

The `.github/workflows` directory does not exist (GitHub API returns HTTP 404). The repository has no automated build, test, or CI pipeline of any kind.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

google-ctf has no JIT compiler, no SIMD dispatch, no crypto library, and no GC. The RISC-V content consists entirely of CTF challenge components: a software emulator, challenge payloads, and a register-mapping table. Each is described below.

### 4.1 RV64I Software Interpreter (re-risky, 2018/2019)

**File:** `other/re-risky/directors-cut/spoilers_and_source/src/riscv-emu.c` (648 lines)

A complete software interpreter for a subset of RV64I. Implements instruction decode for R/I/S/B/U/UJ formats and execution for 25+ opcodes: LW, LBU, ADDI, SLLI, SLTIU, SRLI, ANDI, ADDIW, SLLIW, SRLIW, SB, SW, SD, ADD, SUB, XOR, OR, LUI, ADDW, SLLW, SRAW, BEQ, BNE, JALR, JAL. Does not support compressed instructions (RVC). No ISA extensions beyond RV64I. No TODO/FIXME/stub comments. Fully functional -- used as a distributed CTF challenge artifact.

The emulator API is defined in `riscv-emu.h` (76 lines): `rv_ctx_t` (32 x-registers, PC, memory regions), plus `rv_init`, `rv_mem_add`, `rv_mem_translate`, `rv_mem_read`, `rv_mem_write`, `rv_execute_instruction`, `rv_run`.

**Quality:** Scalar C, hand-written for the challenge. Not optimized for performance. No SIMD, no JIT, no extension support beyond what the challenge payload requires.

### 4.2 Challenge Payload Binary (re-risky)

**File:** `other/re-risky/directors-cut/spoilers_and_source/src/checker.c` (42 lines)

A flag-checker compiled to a RISC-V RV64 flat binary. Uses bit-permutation tables (`mix_bits`, `mix_flips`) and compares against a stored flag. Cross-compiled with `riscv64-unknown-elf-gcc -march=rv64imfd`. Linked with `-nostdlib -e checker -Ttext 0x1000 -Tdata 0x2000`. Precompiled binary `checker.flat` (12288 bytes) is committed.

A separate variant exists at `other/re-risky/split-version/task4/spoilers_and_source/src/carbon.c` (~100 lines): a RISC-V flag-checker with per-character XOR checks. Runs via `spike pk`. Precompiled binary `carbon` (22272 bytes) committed.

### 4.3 xv6-RISCV Kernel + Rust Emulator (hw-pcivault, 2021)

**Files:** `2021/quals/hw-pcivault/challenge/build.dockerfile`, `xv6-riscv.patch` (306 lines), `emulator/src/main.rs` (322 lines)

The challenge patches the [mit-pdos/xv6-riscv](https://github.com/mit-pdos/xv6-riscv) kernel to add a PCI driver (`kernel/pci.c`, 62 lines), modify memory layout, and reduce the user-space image to `init` plus challenge firmware. Build flags: `-mcmodel=medany -ffreestanding -fno-common -nostdlib -mno-relax` (standard xv6-riscv flags). ISA: RV64GC (xv6-riscv default).

The Rust emulator (`main.rs`) wraps the `riscv_emu_rust` crate (`takahirox/riscv-rust` at commit b4895fc5) and implements a virtual PCI device interface via libvfio_user. No stubs. The challenge firmware `firmware.c` (9747 bytes) runs inside the emulated xv6-riscv system.

### 4.4 Unicorn Engine RISC-V Register Map (pwn-unicornel, 2024)

**File:** `2024/quals/pwn-unicornel/challenge/unicornel.h` (94 lines)

RISC-V is one of 10 architectures in a multi-architecture emulator server built on the [Unicorn Engine](https://github.com/unicorn-engine/unicorn). The only RISC-V-specific code is a register-mapping table:
- `call_regs[UC_ARCH_RISCV]`: `{UC_RISCV_REG_A0, UC_RISCV_REG_A1, UC_RISCV_REG_A2, UC_RISCV_REG_A3}`
- `ip_reg[UC_ARCH_RISCV]`: `UC_RISCV_REG_PC`

No RISC-V-specific logic beyond register mapping. Uses Unicorn's generic RISC-V backend.

### 4.5 Component Comparison Table

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Software ISA interpreter | Not present | Not present | RV64I subset, 648 lines, complete |
| Challenge payload binary | Yes (misc-shellcode) | Yes (misc-shellcode) | re-risky (flat binary, bare-metal) |
| Full OS kernel target | Not as challenge | Not as challenge | xv6-riscv (RV64GC, patched) |
| Multi-arch emulator entry | Yes | Yes | Yes (UC_ARCH_RISCV) |
| SIMD/vector optimization | n/a | n/a | n/a |
| JIT backend | n/a | n/a | n/a |
| ISA extensions used | n/a | n/a | RV64I only (emulator), rv64imfd (compile flag only, no FP in C code), RV64GC (xv6-riscv) |

No `#ifdef __riscv` architecture guards exist anywhere in the repository. All RISC-V code is self-contained within challenge directories.

---

## 5. Build System, Cross-Compilation, and Toolchain

There is no repository-wide build system. Each challenge has independent build infrastructure. Only the re-risky and hw-pcivault challenges involve RISC-V cross-compilation.

### 5.1 re-risky RV64 build (exact commands from source)

```sh
# Cross-compile RV64 flag-checker to ELF
riscv64-unknown-elf-gcc -march=rv64imfd -Wall -Wextra -nostdlib \
  -c checker.c -o checker.o

riscv64-unknown-elf-gcc -Wall -Wextra -nostdlib \
  -e checker -Ttext 0x1000 -Tdata 0x2000 \
  checker.o -o checker.riscvelf

# Disassemble and convert to flat binary
riscv64-unknown-elf-objdump -d -Mnumeric,no-aliases checker.riscvelf
python elf_to_flat.py checker.riscvelf checker.flat
```

**Required toolchain:** `riscv64-unknown-elf-gcc` (bare-metal/ELF target). Source: [riscv/riscv-gnu-toolchain](https://github.com/riscv/riscv-gnu-toolchain). No minimum version is specified. The challenge dates from 2018; any GCC version supporting `-march=rv64imfd` (GCC 7+) is expected to work.

**Host emulator build (x86_64):**

```sh
gcc -Wall -Wextra riscv-emu.c -o riscv-emu -DTEST -O2
```

No QEMU usage in re-risky. The challenge ships its own x86 RISC-V emulator. The flat binary is not an OS-runnable ELF.

### 5.2 hw-pcivault xv6-riscv build (Dockerfile)

Toolchain installed via apt: `gcc-riscv64-unknown-elf`. Build command: `make TOOLPREFIX=riscv64-unknown-elf-` inside the cloned `xv6-riscv` tree with the applied patch. Cross-compilation environment also available as Nix (`riscv64-none-elf`/newlib libc) via `cross-shell.nix`.

QEMU is used at runtime (not build time) to boot the xv6-riscv kernel.

### 5.3 pwn-unicornel build

Host binary only (x86_64): `gcc -o chal chal.c syscalls.c unicorn/build/*.a -I unicorn/include -lpthread -lm`. The challenge accepts player-submitted machine code including RISC-V; no cross-compiler is needed to build the challenge server itself.

### 5.4 Known build issues on riscv64 hosts

Data not available: no issues or reports of building the challenge infrastructure on a riscv64 Linux host were found. The challenge server binaries (Dockerfiles) are built for and executed on x86_64. Building on riscv64 is not a tracked use case.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

google-ctf is a CTF challenge archive. Feature coverage in the software-product sense does not apply. The relevant question for this section is: which architectures appear as first-class CTF challenge targets?

| Challenge | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| re-risky (reverse-engineering, RV64I emulator) | No | No | Yes |
| hw-pcivault (hardware pwn, xv6-riscv kernel) | No | No | Yes |
| pwn-unicornel (multi-arch emulator) | Yes | Yes | Yes |
| misc-shellcode 2021 (polyglot shellcode) | Yes | Yes | No |
| 2025 multiarch (custom fictional ISAs) | No | No | No |

No security hardening gaps, floating-point semantics issues, or NaN-handling differences are documented in the research findings for this project. These are not relevant concerns for a CTF challenge archive.

**Functional gaps:** No RISC-V Linux userspace binaries (riscv64-linux-gnu targets) exist anywhere in the repo. All RISC-V use is either bare-metal (`riscv64-unknown-elf`) or via emulation layers (Unicorn Engine, custom C emulator, riscv_emu_rust). This is by design -- CTF challenges use embedded/bare-metal targets for challenges requiring full system control.

---

## 7. CI/CD Infrastructure

No CI pipeline exists. The `.github/workflows` directory is absent (GitHub API returns HTTP 404). No `.travis.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `appveyor.yml` exists at the repository root. No CI configuration of any kind was found in the research.

| CI capability | amd64 | arm64 | riscv64 |
|---------------|-------|-------|---------|
| Automated build | None | None | None |
| Automated test | None | None | None |
| RISE runners | None | None | None |
| Release automation | None | None | None |

The only CI-adjacent files in the repository are inside `third_party/edk2/` (vendored upstream code). These are not google-ctf's own CI.

---

## 8. Distribution and Release Status

No releases, no packages, no binaries are distributed.

| Channel | Status |
|---------|--------|
| GitHub Releases | Empty array -- zero releases published, zero assets |
| GitHub Tags | No versioned tags found |
| PyPI (`google-ctf`) | HTTP 404 -- package does not exist |
| RISE wheel builder | Not listed -- package does not exist on PyPI |
| Ubuntu 24.04 noble | Not packaged |
| Debian tracker | HTTP 404 -- no Debian source package |
| Arch Linux RISC-V (archriscv.felixc.at) | Not listed |

google-ctf is a source-only repository. A user wanting to run CTF challenges clones the repo and builds each challenge independently using the challenge-local Dockerfile or Makefile. No riscv64 binary is available from any channel, nor is any expected.

---

## 9. Dependencies

The table below covers the transitive dependencies identified across all challenges in the repository. Dependencies are challenge-local -- there is no monorepo dependency manifest.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Open Issues |
|-----------|------|--------------|-------------|----------------|-------------|
| [Unicorn Engine](https://github.com/unicorn-engine/unicorn) | CPU emulation in pwn-unicornel (RISC-V is a supported guest ISA) | Builds; RISC-V guest emulation present | riscv64 host not in CI matrix | No riscv64 host release binaries or wheels | [#2402](https://github.com/unicorn-engine/unicorn/issues/2402) open: RISC-V guest trap handler exceptions not delivered; [#2390](https://github.com/unicorn-engine/unicorn/issues/2390) open: execution from odd PC (IALIGN=16 violation); [PR #2394](https://github.com/unicorn-engine/unicorn/pull/2394) open: odd address rejection |
| [NumPy](https://github.com/numpy/numpy) | Crypto challenge solver math (filtermaze, LWE) | Builds from source | Not in upstream CI | No PyPI riscv64 wheels | [#30216](https://github.com/numpy/numpy/issues/30216) open: no manylinux riscv64 wheels (cibuildwheel support added summer 2025, wheel distribution pending) |
| [Pillow](https://github.com/python-pillow/Pillow) | Image rendering in hackceler8 Python game | Builds from source (~5 min on 1.6 GHz RISC-V) | Not in upstream CI | No PyPI riscv64 wheels | [#9462](https://github.com/python-pillow/Pillow/issues/9462) open: add riscv64 wheel to PyPI; [#9463](https://github.com/python-pillow/Pillow/issues/9463) open: riscv64 build matrix |
| [MAME](https://github.com/mamedev/mame) | Emulates Mega Drive/Sega hardware in misc-mega-rust-1 challenge | Buildable on riscv64 with workaround; clang `-m64` flag bug affects build | No riscv64 CI | PPA packages for Ubuntu only; no official riscv64 binaries | [#15039](https://github.com/mamedev/mame/issues/15039) open: fix clang build on aarch64 and riscv64 (`-m64` vs empty ARCHITECTURE flag) |
| [nsjail](https://github.com/google/nsjail) | Sandboxing for all challenge Dockerfiles via kctf-docker | Builds on riscv64 (kafel riscv64 support merged 2021-10-27) | No riscv64 CI | No riscv64 binary releases | [kafel PR #32](https://github.com/google/kafel/pull/32) closed/merged: "Fix riscv64 judgment" (2021). No remaining blockers known. |
| [z3-solver](https://github.com/Z3Prover/z3) | Constraint solving in misc-hwsim challenge | Builds from source; cross-build CI exists | Not in standard CI | RISE project publishes riscv64 z3 wheels | [#9147](https://github.com/Z3Prover/z3/issues/9147) closed: riscv64 wheel on PyPI; resolved via RISE |
| [xxHash](https://github.com/Cyan4973/xxHash) | Hash library in hackceler8 2024 (`xxhash==3.4.1`) | Builds; RVV optimization path exists | RVV-optimized path not in upstream CI | PyPI source builds fine; no riscv64 binary wheel | [#1018](https://github.com/Cyan4973/xxHash/issues/1018) open: RVV optimization; [PR #1069](https://github.com/Cyan4973/xxHash/pull/1069)/[#1070](https://github.com/Cyan4973/xxHash/pull/1070) closed: RVV implementation merged |
| [libjpeg-turbo](https://github.com/libjpeg-turbo/libjpeg-turbo) | Image decoding in hackceler8 (apt dep `libjpeg-dev`) | Builds; no RISC-V SIMD optimization | No riscv64 SIMD tests | Binary releases lack riscv64 | [#885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885) closed: riscv64 release request (scalar fallback); [#620](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620) closed: RVV path added |
| [libtommath](https://github.com/libtom/libtommath) | Big-integer arithmetic (vendored in `third_party/libtommath`) | Builds (arch-independent C) | Architecture-neutral | n/a (vendored source) | None -- pure portable C |
| [ModernGL / moderngl-window](https://github.com/moderngl/moderngl) | OpenGL rendering in hackceler8 2024 game | Depends on Mesa/OpenGL driver | No riscv64 CI | No riscv64 binary wheels | No riscv64 issues filed; Mesa on riscv64 is functional but GPU-dependent |
| [gmpy2](https://github.com/aleaxit/gmpy) | GMP-based big integers in h8-teaser crypto challenge | Builds if GMP is available (GMP supports riscv64) | Not in CI | No riscv64 binary wheels | None -- GMP has riscv64 support |
| [takahirox/riscv-rust](https://github.com/takahirox/riscv-rust) | Rust-based RISC-V emulator used in hw-pcivault (at commit b4895fc5) | Rust crate; compiles on any Rust-supported host | Not in google-ctf CI | n/a (vendored at fixed commit via patch) | Challenge-specific patch applied; no upstream CI concern for this challenge |
| [mit-pdos/xv6-riscv](https://github.com/mit-pdos/xv6-riscv) | RISC-V teaching OS kernel used in hw-pcivault | Cross-compiled for riscv64-unknown-elf from any host | Not in google-ctf CI | n/a (built from source per challenge) | None for the challenge use case |
| [edk2](https://github.com/tianocore/edk2) (vendored) | UEFI firmware base in `third_party/edk2/` | edk2 has riscv64 support upstream | Not tested by google-ctf | n/a (vendored) | No google-ctf-specific issues; upstream edk2 riscv64 port is active |
| dill, pyrr, imgui (pyimgui) | Python serialization, 3D math, GUI overlay in hackceler8 2024 | Pure Python or builds from source | No riscv64 CI | No riscv64 binary wheels | No riscv64 issues filed |
| Rust crates (heapless, libm, handlebars, serde, etc.) | 2025 hackceler8 game logic (m68k cross-compile target, not native) | Host-agnostic; cross-compile to m68k from any host including riscv64 | n/a | n/a | None |

**Critical dependency deep-dive -- Unicorn Engine:**

Unicorn Engine is the only dependency where RISC-V correctness bugs directly affect google-ctf challenge behavior. The pwn-unicornel challenge accepts player-submitted RISC-V machine code and executes it via Unicorn. Two open bugs affect RISC-V guest execution:

- [#2402](https://github.com/unicorn-engine/unicorn/issues/2402): RISC-V guest trap handlers do not receive exceptions correctly. This means guest code that relies on exception delivery behaves incorrectly under Unicorn.
- [#2390](https://github.com/unicorn-engine/unicorn/issues/2390): Execution from an odd PC (IALIGN=16 violation) proceeds without raising an exception, violating the ISA spec. [PR #2394](https://github.com/unicorn-engine/unicorn/pull/2394) is open to fix this.

These are correctness bugs in RISC-V guest emulation. They affect any user of Unicorn who runs RISC-V guest code, including the pwn-unicornel challenge design. Whether the challenge intentionally relies on these bugs as part of the puzzle is not determinable from the research findings.

---

## 11. Known Bugs and Active Issues

No RISC-V issues exist in the google/google-ctf issue tracker (zero results for searches on "riscv", "riscv64" across issues and PRs).

The following table covers open RISC-V bugs in critical dependencies that affect google-ctf challenge correctness or buildability:

| ID | Project | Title | Status | Severity | Notes |
|----|---------|-------|--------|---------|-------|
| [#2402](https://github.com/unicorn-engine/unicorn/issues/2402) | Unicorn Engine | RISC-V guest trap handler exceptions not delivered | Open | High | Breaks RISC-V guest exception semantics in pwn-unicornel challenge |
| [#2390](https://github.com/unicorn-engine/unicorn/issues/2390) | Unicorn Engine | Execution from odd PC (IALIGN=16 violation) allowed | Open | High | ISA spec violation; [PR #2394](https://github.com/unicorn-engine/unicorn/pull/2394) pending |
| [#15039](https://github.com/mamedev/mame/issues/15039) | MAME | Fix clang build on aarch64 and riscv64 (`-m64` flag) | Open | High | Prevents building misc-mega-rust-1 challenge server with clang on riscv64 hosts |
| [#30216](https://github.com/numpy/numpy/issues/30216) | NumPy | No manylinux riscv64 wheels on PyPI | Open | Medium | Source build required; ~5 min build time on 1.6 GHz RISC-V hardware |
| [#9462](https://github.com/python-pillow/Pillow/issues/9462) | Pillow | Add riscv64 wheel to PyPI releases | Open | Medium | Source build required for hackceler8 game setup |
| [#9463](https://github.com/python-pillow/Pillow/issues/9463) | Pillow | riscv64 build matrix | Open | Medium | Related to #9462 |
| [#9147](https://github.com/Z3Prover/z3/issues/9147) | z3-solver | Add riscv64 wheel on PyPI | Closed | Low | Resolved -- RISE project publishes riscv64 z3 wheels |
| [kafel #32](https://github.com/google/kafel/pull/32) | kafel (nsjail dep) | Fix riscv64 judgment | Closed/merged | Low | Resolved 2021-10-27; nsjail builds on riscv64 |

**Correctness bugs specifically:** The Unicorn Engine issues (#2402, #2390) are RISC-V correctness bugs with direct impact on the challenge emulator. All other open issues are distribution/packaging gaps (no riscv64 binary wheels) rather than functional defects.

---

## 12. Objections and Upstream Blockers

There are no objections to RISC-V in the google/google-ctf issue tracker or public discussion, and none are expected. The project is a challenge archive that already uses RISC-V as a CTF subject.

The relevant blockers are in upstream dependencies:

**Unicorn Engine RISC-V correctness (#2402, #2390):** Two open correctness bugs in RISC-V guest execution. These are not google-ctf objections but upstream Unicorn bugs. If the pwn-unicornel challenge were to be re-run on riscv64 hardware as the host, or if future challenges depend on correct RISC-V exception semantics in Unicorn, these bugs would need fixes upstream before deployment.

**MAME clang build (#15039):** Prevents building MAME on riscv64 with clang. The MAME project has not assigned priority. GCC builds reportedly work; the issue is clang-specific.

**No RISC-V CI infrastructure:** The repository has no CI pipeline at all. Adding riscv64 CI would require building the CI system from scratch, not porting an existing configuration.

**Acceptance probability of RISC-V contributions:** High. Google (project owner) is a RISE Premier Member. The project already has three RISC-V challenges demonstrating intentional use of the ISA. No organizational resistance is documented or expected.

---

## 13. Investment Analysis

google-ctf is a security competition archive. It is not a production software component, and its RISC-V content already exists as challenge material. Investment analysis focuses on the realistic scenarios where RISC-V enablement would have value: (1) running future CTF challenge infrastructure on riscv64 hardware, and (2) fixing correctness bugs in RISC-V-supporting dependencies.

RISE has already resolved z3-solver (riscv64 wheels now available). kafel/nsjail riscv64 support was resolved in 2021.

### 13.1 Functional Enablement

The only functional gap relevant to running google-ctf challenges on riscv64 hosts is the MAME clang build failure (#15039). If the challenge infrastructure is built with GCC, this is not blocking. No google-ctf-specific functional enablement work is required.

### 13.2 Performance Optimization

Data not available: no performance benchmarks or optimization opportunities were identified in the research findings. The project has no performance-sensitive code paths.

### 13.3 CI/CD Infrastructure

No CI exists for any architecture. Adding riscv64 CI would require creating the CI system from scratch (GitHub Actions). Estimated scope: the repository has 8+ years of challenge archives with heterogeneous per-challenge build systems. A meaningful CI covering challenge build verification across all years is a substantial project independent of architecture.

### 13.4 Ecosystem Enablement

The challenge infrastructure pulls in several Python packages without riscv64 binary wheels (NumPy, Pillow, imgui). These affect setup time on riscv64 (source builds of ~5 min each) but do not block functionality. RISE has already addressed z3-solver.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | Fix MAME clang build on riscv64 (#15039, upstream MAME) | 1 | MAME upstream / Qualcomm | Medium |
| Functional | Fix Unicorn Engine RISC-V trap handler correctness (#2402, upstream) | 2-3 | Unicorn upstream / RISE | High |
| Functional | Fix Unicorn Engine RISC-V odd PC bug (#2390, PR #2394 pending) | 1 | Unicorn upstream | High |
| CI/CD | Create any CI at all for google-ctf (no per-arch work until base CI exists) | 4-6 | Google / contributor | Low |
| Ecosystem | NumPy riscv64 PyPI wheels (#30216) | 2 | NumPy / RISE (already in scope) | Medium |
| Ecosystem | Pillow riscv64 PyPI wheels (#9462, #9463) | 2 | Pillow / RISE | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/google-ctf repository](https://github.com/google/google-ctf)
- [google-ctf project homepage](https://google.github.io/google-ctf/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Unicorn Engine issue #2402: RISC-V trap handler exceptions](https://github.com/unicorn-engine/unicorn/issues/2402)
- [Unicorn Engine issue #2390: RISC-V odd PC IALIGN violation](https://github.com/unicorn-engine/unicorn/issues/2390)
- [Unicorn Engine PR #2394: RISC-V odd address rejection](https://github.com/unicorn-engine/unicorn/pull/2394)
- [MAME issue #15039: clang build failure on aarch64 and riscv64](https://github.com/mamedev/mame/issues/15039)
- [NumPy issue #30216: manylinux riscv64 wheels](https://github.com/numpy/numpy/issues/30216)
- [Pillow issue #9462: riscv64 wheel on PyPI](https://github.com/python-pillow/Pillow/issues/9462)
- [Pillow issue #9463: riscv64 build matrix](https://github.com/python-pillow/Pillow/issues/9463)
- [z3-solver issue #9147: riscv64 wheel on PyPI (closed)](https://github.com/Z3Prover/z3/issues/9147)
- [kafel PR #32: Fix riscv64 judgment (merged 2021)](https://github.com/google/kafel/pull/32)
- [xxHash issue #1018: RVV optimization](https://github.com/Cyan4973/xxHash/issues/1018)
- [xxHash PR #1069: RVV implementation (merged)](https://github.com/Cyan4973/xxHash/pull/1069)
- [riscv/riscv-gnu-toolchain](https://github.com/riscv/riscv-gnu-toolchain)
- [mit-pdos/xv6-riscv](https://github.com/mit-pdos/xv6-riscv)
- [takahirox/riscv-rust](https://github.com/takahirox/riscv-rust)