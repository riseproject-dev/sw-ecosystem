---
title: xbyak_riscv
parent: Project Reports
categories:
  - libraries
---

# xbyak_riscv

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for xbyak_riscv
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

[xbyak_riscv](https://github.com/herumi/xbyak_riscv) is a header-only C++ JIT assembler library for RISC-V, analogous to the original [Xbyak](https://github.com/herumi/xbyak) library for x86-64. It enables runtime code generation: a C++ program calls typed methods (e.g., `vadd_vv`, `sh1add`, `vsetvli`) which emit binary RISC-V machine code into a memory buffer that is then executed directly. The library is not a port to RISC-V -- it was created from scratch as a RISC-V-native project on 2022-12-31. Every line of code in the repository is RISC-V-specific.

**Governance:** Single-maintainer model. Mitsunari Shigeo (GitHub: herumi) is the sole maintainer. He lists no employer on his GitHub profile and holds copyright individually (BSD-3-Clause). No MAINTAINERS, OWNERS, CODEOWNERS, or PLATFORMS.md file exists. No formal tier policy, port acceptance policy, or architecture addition process is documented. The project is not a member of the RISE Project.

**Corporate sponsors:** None. The project solicits personal GitHub Sponsors support from individuals. No company holds copyright or a formal maintainer role. However, a disproportionate fraction of external contributions has come from Intel engineers (see Section 2), though Intel holds no formal role.

**Community culture:** The maintainer actively accepts external pull requests. Of the 13 PRs examined, 10 are merged (all within 1-30 days of opening). PR review is direct and technically engaged -- herumi identified a correctness bug in PR #25 before merge (pseudo-instructions `sext_b`/`sext_h` would emit illegal instructions on cores without Zba/Zbb) and resolved it by introducing a `supportBext()` guard rather than blocking the PR. When PR #21 contained a contested `/proc/cpuinfo` fallback, herumi absorbed the core changes directly into the dev branch and closed the PR rather than forcing a rewrite. The project is small (50 stars, 19 forks as of the research date).

---

## 2. Port History and Upstreaming Timeline

xbyak_riscv was created as a RISC-V-native project. There is no "port" -- the entire repository is the RISC-V implementation. Upstreaming is not applicable.

| Date | Event | Source |
|------|-------|--------|
| 2022-12-31 | Repository created. Commit `fb381c5` ("init") by herumi. RV32I/RV64I base, M, A, C extensions. | [commit fb381c5](https://github.com/herumi/xbyak_riscv/commit/fb381c5) |
| 2023-01-06 | Changelog v0.01: RV32 base instruction set. First tagged version. | [CHANGELOG](https://github.com/herumi/xbyak_riscv/blob/main/CHANGELOG.md) |
| 2023-02-15 | pazamelin contributes RVV (V extension) and Zicsr -- described in README as "a tremendous contribution." | [PR #1 discussion / README](https://github.com/herumi/xbyak_riscv) |
| 2023-02-27 | pazamelin adds F and Zfh (half-precision float) extensions. | [CHANGELOG](https://github.com/herumi/xbyak_riscv/blob/main/CHANGELOG.md) |
| 2023-09-06 | ViktoriaBolshakova contributes vector mask pseudoinstructions (PR #11, merged). | [PR #11](https://github.com/herumi/xbyak_riscv/pull/11) |
| 2023-09-15 | ViktoriaBolshakova contributes vfcmp pseudoinstructions (PR #13, merged). | [PR #13](https://github.com/herumi/xbyak_riscv/pull/13) |
| 2024-12-13 | eshoguli fixes V-extension target generation and compilation (PR #14, merged after ~7 months unreviewed). | [PR #14](https://github.com/herumi/xbyak_riscv/pull/14) |
| 2025-04-22 | a-sidorova adds vfneg.v and vfabs.v pseudoinstructions (PR #17, merged). | [PR #17](https://github.com/herumi/xbyak_riscv/pull/17) |
| 2025-08-08 | Vladislav-Denisov adds floating-point CSRs (PR #18, merged). | [PR #18](https://github.com/herumi/xbyak_riscv/pull/18) |
| 2025-08-20 | v1.00 released -- first stable tag, ~2.5 years after initial commit. | [v1.00 tag](https://github.com/herumi/xbyak_riscv/releases/tag/v1.00) |
| 2025-11-28 | xiazhuozhao opens PR #20 (merged 2025-12-01): fixes native RISC-V hardware builds (test scripts hardcoded cross-compilation tools, breaking native builds on SOPHON SG2044 / openEuler), C++11 strict constexpr compliance, and zifencei ASFLAGS for binutils >= 2.38. | [PR #20](https://github.com/herumi/xbyak_riscv/pull/20) |
| 2025-12-01 | v1.01 released. | [v1.01 tag](https://github.com/herumi/xbyak_riscv/releases/tag/v1.01) |
| 2025-12-08 | xiazhuozhao opens PR #21 (riscv_hwprobe support for Zvfh/Zvbb/Zvbc/Zvkg detection). Closed 2025-12-19 after herumi absorbs core changes into dev branch directly. | [PR #21](https://github.com/herumi/xbyak_riscv/pull/21) |
| 2025-12-17 | v1.02 released, incorporating hwprobe support. | [v1.02 tag](https://github.com/herumi/xbyak_riscv/releases/tag/v1.02) |
| 2026-06-15 | v1.10 released: D-extension (PR #23 by Ga1axy0) and Zvfbfwma / BFloat16 widening MAC (PR #22 by velonica0). | [PR #22](https://github.com/herumi/xbyak_riscv/pull/22), [PR #23](https://github.com/herumi/xbyak_riscv/pull/23) |
| 2026-06-17 | v1.20 released: whole-register vector load/store encoding bug fixed (commit `ce97383`); vsetvli/vsetivli default policy made explicit via `XBYAK_RISCV_VSETV_DEFAULT_OLD` macro (commit `97668f9`). | [commit ce97383](https://github.com/herumi/xbyak_riscv/commit/ce97383), [commit 97668f9](https://github.com/herumi/xbyak_riscv/commit/97668f9) |
| 2026-06-19 | v1.30 released: B-extension support -- Zba, Zbb, Zbc, Zbs (PR #25 by Ga1axy0). Validated 1,589 lines GAS vs. Xbyak with zero diffs. | [PR #25](https://github.com/herumi/xbyak_riscv/pull/25) |

**Key external contributors and inferred affiliations:**

| Contributor | Inferred affiliation | Contributions |
|-------------|---------------------|---------------|
| pazamelin | Intel [NEEDS VERIFICATION] | RVV, Zicsr, F, Zfh extensions (Feb 2023 -- the foundational vector work) |
| ViktoriaBolshakova / v.gromova | Intel [NEEDS VERIFICATION] | Vector mask pseudoinstructions (PR #11), vfcmp pseudoinstructions (PR #13) |
| a-sidorova | Intel [NEEDS VERIFICATION] | vfneg.v, vfabs.v pseudoinstructions (PR #17); identified putL() bug (Issue #16) |
| aobolensk | Intel [NEEDS VERIFICATION] | override specifiers on virtual methods (PR #19) |
| eshoguli (Edward Shogulin) | Intel [NEEDS VERIFICATION] | V-extension CMake target generation fix (PR #14) |
| xiazhuozhao / zhangfeiv0 | Alibaba/DAMO or similar [NEEDS VERIFICATION] | hwprobe detection (PR #21), native RISC-V build fixes and C++11 compliance (PR #20) |
| Ga1axy0 | Unknown | D-extension (PR #23), B-extension mnemonics with 1,589-line verified encoding (PR #25) |
| velonica0 | Unknown | Zvfbfwma support (PR #22) |
| Vladislav-Denisov | Unknown | Floating-point CSRs (PR #18) |

The Intel affiliation is inferred from commit co-authorship patterns across multiple Intel open-source engineers who regularly collaborate. No Intel employment is confirmed in GitHub profiles. Intel holds no formal maintainer or sponsor role.

**Is the project fully upstreamed?** The concept does not apply -- the project is RISC-V-native with no other upstream.

---

## 3. Upstream Support Tier

No formal tier policy exists. The following table characterizes support level by evidence rather than policy.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Formal support tier | N/A (project is riscv64-only) | N/A | N/A -- the project IS the riscv64 implementation |
| CI runs on architecture | N/A | N/A | Cross-compilation on x86_64; no native execution |
| Release blocking | N/A | N/A | All releases are riscv64 |
| Official binaries | N/A | N/A | None -- header-only, source distribution only |
| Version policy | N/A | N/A | Current: v1.30 (2026-06-19) |

xbyak_riscv has no amd64 or arm64 support -- it is exclusively a RISC-V library. The "support tier" question collapses to: how production-ready is the RISC-V implementation? Answer: substantially complete for ratified extensions relevant to AI/ML workloads (see Section 6), actively maintained with three PRs merged in June 2026 alone, and confirmed working on at least one RISC-V hardware platform (SOPHON SG2044 / openEuler, via PR #20).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

xbyak_riscv is organized as three header files and one utility header:

- [`xbyak_riscv.hpp`](https://github.com/herumi/xbyak_riscv/blob/main/xbyak_riscv/xbyak_riscv.hpp) (1,409 lines): code buffer, allocator, register types, CodeGenerator base class, RVC transparent compression, scalar instruction emitters.
- [`xbyak_riscv_mnemonic.hpp`](https://github.com/herumi/xbyak_riscv/blob/main/xbyak_riscv/xbyak_riscv_mnemonic.hpp) (302 lines): auto-generated scalar mnemonics (RV32I/RV64I, M, A, F, D, B-extension, Zicsr pseudos).
- [`xbyak_riscv_v.hpp`](https://github.com/herumi/xbyak_riscv/blob/main/xbyak_riscv/xbyak_riscv_v.hpp) (778 lines): auto-generated vector mnemonics from `gen/rvv_instr_dict.yaml` (4,893-line authoritative encoding dict).
- [`xbyak_riscv_util.hpp`](https://github.com/herumi/xbyak_riscv/blob/main/xbyak_riscv/xbyak_riscv_util.hpp) (301 lines): runtime CPU feature detection via `AT_HWCAP` (legacy) and `riscv_hwprobe` syscall 258 (Linux 6.4+).

**Component coverage table:**

| Component | amd64 | arm64 | riscv64 | Quality | Notes |
|-----------|-------|-------|---------|---------|-------|
| Base integer ISA | N/A | N/A | Full | Auto-generated, tested | RV32I/RV64I, M, A |
| Single-precision float (F) | N/A | N/A | Full | Auto-generated, tested | All FMA/fcvt/fmv variants |
| Double-precision float (D) | N/A | N/A | Full | Auto-generated, tested | Added PR #23, Jun 2026 |
| Half-precision float (Zfh) | N/A | N/A | Partial | Instructions present, FMA tests disabled | Arithmetic ops exist; FMA tests commented out in gen_test.py |
| Quad-precision float (Q) | N/A | N/A | Partial | Load/store only | No arithmetic Q-extension ops generated |
| Vector (RVV 1.0) | N/A | N/A | Full | Auto-generated from YAML dict, tested | All integer/FP/permute/mask/reduce/load/store formats |
| Bit-manipulation (Zba/Zbb/Zbc/Zbs) | N/A | N/A | Full | Auto-generated, validated 1,589 lines | `supportBext()` toggle for safe degradation on cores without B |
| BFloat16 vector MAC (Zvfbfwma) | N/A | N/A | Full | Tested (requires binutils >= 2.43) | `vfwmaccbf16_vv` / `vf` variants |
| Vector half-float (Zvfh) | N/A | N/A | Full (detection) / Partial (codegen) | hwprobe detection complete | V-inherited ops cover most use cases |
| Vector bitmanip/crypto (Zvbb/Zvbc/Zvkg) | N/A | N/A | Detection only | hwprobe detection only | No instruction emitters in .hpp files |
| Compressed (RVC) | N/A | N/A | Full (transparent) | Automatic compression | `supportRVC_` flag; no explicit user API |
| CSRs (Zicsr) | N/A | N/A | Full | 6 instructions + 7 pseudos | FP CSRs added PR #18; vector CSRs built-in |
| Hypervisor (H extension) | N/A | N/A | Missing | Not implemented | -- |
| Scalar crypto (Zbk/Zkn/Zks) | N/A | N/A | Missing | Not implemented | -- |
| Float-in-integer regs (Zfinx/Zdinx) | N/A | N/A | Missing | Not implemented | -- |
| Runtime CPU detection | N/A | N/A | Full | AT_HWCAP + riscv_hwprobe (Linux 6.4+) | Guarded by `#if defined(__linux__) && defined(__riscv)` |
| JIT runtime dispatch pattern | N/A | N/A | Full | Demonstrated in samples | `cpu.hasExtension(RISCVExtension::V)` with scalar fallback |

The `sample/vector_add_rvv.cpp` and `sample/vector_add_rvv_f32.cpp` samples demonstrate the full JIT dispatch pattern: runtime V-extension check, `vsetvli` with SEW::e32/LMUL::m8, vectorized loop, scalar fallback if V absent. This is the expected downstream integration pattern.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** CMake (primary), Make (for tests and samples), Meson (optional). The library is header-only; "building" means compiling tests and samples.

**Required toolchain for test/CI:**

```bash
# Debian/Ubuntu:
apt install make g++ binutils-riscv64-linux-gnu binutils-riscv64-unknown-elf python3 python3-yaml
# For Zvfbfwma test (requires binutils >= 2.43):
# Use debian:testing; Ubuntu 24.04 ships binutils 2.42 (insufficient)
```

**CMake build:**
```bash
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Debug -DXBYAK_RISCV_V=ON ..
make --build . --parallel 4
```
`-DXBYAK_RISCV_V=ON` is required to enable RVV support. Default is OFF.

**Test suite (cross-compilation methodology):**
```bash
make test                      # standard test, inside debian:testing container
make -C test test_vec          # Zvfbfwma test, requires binutils >= 2.43
make -C test test_vec_docker   # runs test_vec inside debian:testing Docker if host binutils < 2.43
```

The test methodology does NOT execute RISC-V code. `test/test.sh`:
1. Generates RISC-V assembly via Python (`gen_test.py` / `gen_test_vec.py`).
2. Cross-assembles with `riscv64-linux-gnu-as`.
3. Disassembles with `riscv64-unknown-elf-objdump`.
4. Compiles a native x86_64 C++ binary using xbyak_riscv to generate the same encodings.
5. Diffs the two disassembly outputs.

Assembler march flags used:
- Base: `-march=rv64imafdqv_zba_zbb_zbc_zbs_zifencei`
- Vector (Zvfbfwma): `-march=rv64imafdqv_zvfbfwma`

Overridable environment variables (added in PR #20, Dec 2025):
```bash
AS=${AS:-riscv64-linux-gnu-as}
CXX=${CXX:-g++}
OBJDUMP=${OBJDUMP:-riscv64-unknown-elf-objdump}
```

**Running samples natively via QEMU:**
```bash
env QEMU_LD_PREFIX=/usr/riscv64-linux-gnu ./add.exe
```

**Known build issues:**

1. **Zvfbfwma on Ubuntu 24.04 LTS:** binutils 2.42 cannot assemble `vfwmaccbf16`. The `test_vec` target fails. Workaround: use `debian:testing` (binutils >= 2.43) via Docker. No upstream binutils bug has been filed. Fix: Ubuntu 25.04+ or any distro providing binutils >= 2.43.

2. **Native RISC-V build before PR #20 (Dec 2025):** Test scripts hardcoded `riscv64-linux-gnu-as`, failing on native RISC-V hardware where the assembler is plain `as`. Fixed. Confirmed working on SOPHON SG2044 running openEuler 12.3.1-30.oe2403 [NEEDS VERIFICATION of other platforms].

3. **C++11 strict mode before PR #20 (Dec 2025):** Constexpr violations under `-std=c++11 --pedantic -DNDEBUG`. Fixed via `XBYAK_RISCV_CONSTEXPR` macro.

4. **Zifencei on binutils >= 2.38:** Assembler rejects `fence.i` without explicit `_zifencei` in `-march`. Fixed in PR #20 via ASFLAGS append.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

xbyak_riscv has no amd64 or arm64 equivalent. The meaningful comparison is: which RISC-V ISA extensions relevant to production workloads are implemented vs. missing?

**Functional coverage:**

| Extension | Status | Relevance |
|-----------|--------|-----------|
| RV64I + M + A | Full | Universal base |
| F + D (scalar float) | Full | Essential for general compute |
| Zfh (scalar half-float) | Partial -- FMA tests disabled | Relevant for mixed-precision |
| Q (quad-precision) | Partial -- load/store only | Rarely needed |
| V / RVV 1.0 | Full | Critical for AI/ML vector workloads |
| Zba/Zbb/Zbc/Zbs (B-extension) | Full | Useful for crypto and bit-twiddling |
| Zvfbfwma (BF16 widening MAC) | Full | AI/ML matrix operations |
| Zvfh (FP16 vectors) | Partial -- detection full, codegen via V-inherited ops | Relevant for inference |
| Zvbb/Zvbc/Zvkg | Detection only -- no emitters | Vector crypto; niche |
| C (compressed) | Full (transparent) | Code density |
| Zicsr | Full | FP and vector control |
| H (hypervisor) | Missing | Hypervisor use cases only |
| Zbk/Zkn/Zks (scalar crypto) | Missing | Accelerated AES/SHA on Zkn-capable cores |
| Zfinx/Zdinx | Missing | Embedded cores without FP registers |

**Performance gaps:**

The `vsetvli`/`vsetivli` default tail/mask policy was `VTA::tu, VMA::mu` (undisturbed) prior to v1.20. This caused measurable throughput degradation in oneDNN's RVV GEMM/BRGEMM JIT kernels on out-of-order vector cores with register renaming: undisturbed policy forces the hardware to preserve inactive destination elements even at VLMAX, increasing pipeline pressure and instruction latency. oneDNN worked around this in [PR #5253](https://github.com/uxlfoundation/oneDNN/pull/5253) and follow-on PRs #5294 and #5361 by explicitly passing `VTA::ta, VMA::ma` at every `vsetvli` call site. v1.20 (Jun 17, 2026) introduced the `XBYAK_RISCV_VSETV_DEFAULT_OLD` macro: defining it to 0 removes the default arguments entirely (requires explicit VTA/VMA at every call site -- safer for new code on OoO cores); leaving it undefined preserves the old `tu,mu` defaults for backward compatibility. No specific performance numbers (percentage improvement) were published.

**Correctness concerns (resolved):**

A bug in `gen_v.py` caused whole-register vector load/store instructions (`vl2re8_v`, `vl4re8_v`, `vl8re8_v` and their re16/re32/re64 variants, plus `vs2r_v`, `vs4r_v`, `vs8r_v`) to be encoded incorrectly -- all encoded as the `nf=1` variant because the code generator unconditionally zeroed the top 3 bits of the `nf` field. Correct encodings: `vl2re8_v` 0x22800007, `vl4re8_v` 0x62800007, `vl8re8_v` 0xe2800007. Fixed in commit [`ce97383`](https://github.com/herumi/xbyak_riscv/commit/ce97383) (v1.20, Jun 17, 2026).

**Security hardening:** Not applicable -- the library has no security hardening features. It emits whatever code the caller requests.

**Floating-point semantics:** No documented deviations from IEEE 754. The library emits the instructions the caller specifies; rounding mode is set via `fcsr`/`frm` CSR which the library exposes.

---

## 7. CI/CD Infrastructure

**Verdict: No riscv64 CI exists.** No RISC-V code is executed in CI. The CI validates instruction encoding correctness on an x86_64 host.

**`.github/workflows/main.yml` (the only workflow file):**
- Trigger: `on: [push]` -- runs on every push, no schedule, no pull_request trigger.
- Runner: `ubuntu-latest` (x86_64).
- Container: `debian:testing` (x86_64) -- required for binutils >= 2.43.
- RISC-V toolchain packages installed: `binutils-riscv64-linux-gnu`, `binutils-riscv64-unknown-elf` -- these are cross-assembler and cross-objdump tools, used only for text comparison.
- No QEMU installed (`qemu-user`, `qemu-user-static`, `qemu-riscv64` are absent).
- No self-hosted RISC-V runner.
- No native RISC-V execution of any kind.

**What CI actually validates:** An x86_64 binary generated from xbyak_riscv C++ emits byte sequences. The cross-assembler assembles reference RISC-V instructions to the same byte sequences. The test diffs the disassembled output. This is correct methodology for an assembler library -- encoding correctness is the relevant invariant, and execution is not needed to verify it.

**What CI does NOT validate:**
- Runtime behavior of the CPU detection code (`xbyak_riscv_util.hpp`) -- specifically the `riscv_hwprobe` syscall path, which requires Linux 6.4+ on RISC-V hardware.
- Actual execution of JIT-generated code.
- Native build compatibility (fixed in PR #20 but not tested in CI).

**RISE runners:** No RISE CI involvement. Confirmed: xbyak_riscv appears in zero RISE blog posts, zero RISE RFPs, and is not listed in the RISE wheel builder project list.

| CI dimension | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| Architecture runs in CI | x86_64 host only | None | Cross-compile/diff only -- no execution |
| Native execution | N/A (host is x86_64) | None | None |
| QEMU emulation | N/A | None | None |
| Hardware runner | None | None | None |
| PR trigger | No (push only) | No | No |
| Scheduled runs | No | No | No |

---

## 8. Distribution and Release Status

**GitHub releases:** Zero releases published. The repository has no GitHub Releases page entries, no release assets, and no riscv64 binaries.

**PyPI:** HTTP 404. xbyak_riscv is a C++ library, not a Python package. Not published.

**Debian:** Not packaged. `tracker.debian.org/pkg/xbyak_riscv` returns 404. The original x86 Xbyak (`libxbyak-dev`) is packaged but xbyak_riscv is not.

**Ubuntu:** Not packaged. Search on packages.ubuntu.com returns no results.

**Arch Linux RISC-V:** Not present in the Arch RISC-V porting overlay at archriscv.felixc.at.

**Repology:** No entry. Packaged by zero tracked distributions.

**What a user must do to get a working binary:**
1. `git clone https://github.com/herumi/xbyak_riscv`
2. Copy `xbyak_riscv/*.hpp` to the include path.
3. That is all -- the library is header-only. No compilation step required for the library itself.

To run tests, install `binutils-riscv64-linux-gnu` and `binutils-riscv64-unknown-elf` from apt. For the Zvfbfwma test, use `debian:testing` or equivalent (binutils >= 2.43).

**Versioning:** The project uses git tags directly. Current: v1.30 (2026-06-19). No GitHub Releases wrapping the tags.

---

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|------|------|---------------|--------------|-----------------|-----------------|
| GNU Binutils riscv64-linux-gnu | Cross-assembler for CI encoding tests | Available via apt | CI passes on debian:testing | N/A (no riscv64 release of xbyak_riscv) | **binutils 2.42 (Ubuntu 24.04) cannot assemble Zvfbfwma.** Requires >= 2.43. Workaround: debian:testing container. |
| binutils-riscv64-unknown-elf | Cross-objdump for CI disassembly comparison | Available via apt | Used in CI | N/A | Same 2.42/2.43 version gap for Zvfbfwma. |
| QEMU riscv64 | Required for running samples on non-RISC-V hosts | QEMU 8.x+ supports riscv64 user-mode and RVV | Not used in CI | Not used in CI | Not blocking -- QEMU is optional and mature for riscv64. |
| Python 3 | Code generation (gen_test.py, gen_v.py, bin2hex.py) | Available on all riscv64 Linux distros | Installed in CI container | Available everywhere | None. |
| PyYAML (python3-yaml) | Parses rvv_instr_dict.yaml for RVV test generation | Builds from source on riscv64 (no pre-built wheel [NEEDS VERIFICATION]) | Installed via apt in CI | No pre-built riscv64 wheel on PyPI per [pyyaml issue #924](https://github.com/yaml/pyyaml/issues/924) (open as of 2026-03) | Not a blocker for xbyak_riscv CI (apt provides binary). Only affects pip-based workflows on riscv64 hardware. |
| cybozu test.hpp (bundled) | Lightweight C++ unit test framework | Header-only C++11, no arch-specific code | Used by all C++ tests, passes CI | Bundled at `test/cybozu/test.hpp` | None. |
| CMake >= 2.6 | Optional build integration | Available on riscv64 | Not tested in CI | Universally available | None. |
| Meson 1.30 | Optional build integration | Available on riscv64 | Not tested in CI | Available | None. |

The only active blocker in the dependency tree is the binutils version gap for Zvfbfwma on Ubuntu 24.04 LTS. All other dependencies are clean.

---

## 11. Known Bugs and Active Issues

**Correctness bugs (closed -- check fix status before depending on old versions):**

| ID | Title | Status | Severity | Fix | Notes |
|----|-------|--------|----------|-----|-------|
| Commit ce97383 | Wrong encoding for whole-register vector load/store (vl2r/vl4r/vl8r and vs2r/vs4r/vs8r) | Fixed in v1.20 (Jun 17, 2026) | Critical -- silent wrong code generation | `gen_v.py` fixed to preserve `nf` bits | Any code using multi-register whole-register loads/stores on xbyak_riscv < v1.20 generates incorrect machine code. |
| Issue #15 | `li()` uses compile-time `XBYAK_RISCV64` macro instead of runtime `isRV32_` member | Closed (no visible fix comment) | Medium -- incorrect code when cross-compiling RV32 on RV64 host after `setRV32()` | Unknown -- issue closed without documented resolution | Affects RV32 code generation on 64-bit hosts. |
| Issue #16 | `putL()` before label definition emits `appendCode(0)` -- illegal instruction at runtime | Closed | Medium -- runtime crash | herumi documented two correct workarounds; sample `data-code.cpp` added | The existing `test_jmp` CI test exercises this pattern but does not execute generated code under QEMU, masking the bug. |

**Open bugs / limitations:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| PR #12 | Add sq, lq, c_ldq instructions | Open since Sep 6, 2023 | Low | Open without merge for ~3 years. No maintainer comment. |
| (none) | Zvbb/Zvbc/Zvkg -- detection only, no instruction emitters | No issue filed | Medium for vector crypto workloads | Extensions detected via hwprobe but no codegen methods exist. |
| (none) | No QEMU execution in CI -- runtime bugs in JIT dispatch and CPU detection go untested | No issue filed | Medium | `riscv_hwprobe` syscall path has no automated test coverage. |
| (none) | vsetvli/vsetivli default policy change is a breaking API change | Tracked via Issue #24 (closed) | Low -- opt-out available | Code using implicit `tu,mu` defaults and not defining `XBYAK_RISCV_VSETV_DEFAULT_OLD=1` gets silent behavior change in v1.20+. |

---

## 12. Objections and Upstream Blockers

**No stated objections to RISC-V** exist or could exist -- the project is RISC-V-only. The relevant blockers are:

1. **Single maintainer risk.** Mitsunari Shigeo is the sole reviewer and merger. PR #14 sat unreviewed for ~7 months before being noticed. The project has no co-maintainers or stated succession plan. If herumi becomes unavailable, the project stalls. Mitigation: the BSD-3-Clause license and header-only architecture make forking trivial.

2. **No execution testing.** The CI validates encoding correctness but not runtime behavior. The `riscv_hwprobe` detection path, RVC compression correctness at runtime, and CSR read/write sequences are untested in any automated pipeline. Bug discovery depends on downstream users (oneDNN found the vsetvli defaults issue; a-sidorova found the putL bug).

3. **binutils version dependency for Zvfbfwma.** Ubuntu 24.04 LTS (the dominant enterprise riscv64 platform for at least 3 more years) ships binutils 2.42. The Zvfbfwma test suite cannot run without a Docker workaround. Not a functional blocker for users who download headers, but a CI friction point.

4. **Missing extensions for specific workloads.** Zvbb/Zvbc/Zvkg (vector crypto), scalar crypto (Zbk/Zkn/Zks), and H-extension are absent. These are not blockers for general AI/ML workloads but would block cryptographic acceleration use cases.

5. **PR #12 (sq/lq/c_ldq) open 3 years.** No maintainer response documented. This implies either the instructions are incorrect or herumi has not reviewed it. No downstream user has filed a follow-up issue.

**Acceptance probability for contributions:** High. 10 of 13 examined PRs merged. Owner is technically engaged, responds within days to weeks, and absorbed controversial changes directly into dev branch rather than blocking contributors.

---

## 13. Investment Analysis

RISE has no involvement with xbyak_riscv. No prior funded work to avoid duplicating.

### 13.1 Functional Enablement

The primary functional gaps are:
- Zvbb/Zvbc/Zvkg instruction emitters (detection code exists, emitters do not).
- Scalar crypto (Zbk/Zkn/Zks) instruction emitters.
- Zfh FMA instruction test coverage (instructions present, tests disabled in gen_test.py).

The largest single functional gap with near-term hardware relevance is Zvbb/Zvbc (vector bit-manipulation and carry-less multiply) -- these appear on SpacemiT X60 and similar AI-targeted cores.

### 13.2 Performance Optimization

The vsetvli default policy issue has been addressed in v1.20 at the API level. The remaining performance work is in downstream libraries (oneDNN, mcl) that use xbyak_riscv, not in the library itself. No benchmark infrastructure exists in xbyak_riscv; adding a microbenchmark suite would benefit the ecosystem but is not blocking.

### 13.3 CI/CD Infrastructure

The highest-value CI investment is adding QEMU-based execution testing for:
- The CPU detection code path (`riscv_hwprobe` syscall requires Linux 6.4+ but can be tested under QEMU 8.2+ with `-cpu rv64,v=true,vext_spec=v1.0,zvfh=true,zba=true,...`).
- Actual execution of JIT-generated code via the sample binaries.

This would catch the class of bugs exemplified by Issue #16 (putL forward reference crash) and Issue #15 (li() macro vs runtime flag), which are invisible to the current diff-based CI.

Adding a `pull_request` trigger to the CI workflow would also prevent regressions from going undetected until the next push.

### 13.4 Ecosystem Enablement

The primary downstream of xbyak_riscv is expected to be the [mcl](https://github.com/herumi/mcl) pairing-based cryptography library, which already uses Xbyak for x86-64 JIT but uses a portable C++ path for RISC-V (no xbyak_riscv integration yet). Enabling mcl to use xbyak_riscv for native RISC-V JIT would be a high-value downstream integration. [oneDNN PR #5253](https://github.com/uxlfoundation/oneDNN/pull/5253) (merged Jun 4, 2026) represents active real-world use of xbyak_riscv in production AI/ML kernels.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Add Zvbb/Zvbc instruction emitters (vector bitmanip and carry-less multiply) | 1-2 | External contributor / chip company | High |
| Functional | Add Zvkg instruction emitters (vector GCM/GHASH) | 1 | External contributor | Medium |
| Functional | Add scalar crypto emitters (Zbk/Zkn/Zks) | 2-3 | External contributor | Medium |
| Functional | Resolve PR #12 (sq/lq/c_ldq) -- review and merge or close with explanation | 0.5 | herumi (maintainer) | Low |
| CI/CD | Add QEMU-based execution CI job (qemu-riscv64-static, execute JIT samples, test CPU detection) | 2 | External contributor | High |
| CI/CD | Add `pull_request` trigger to GitHub Actions workflow | 0.1 | External contributor | High |
| CI/CD | Add self-hosted riscv64 CI runner (hardware or QEMU) for native execution | 4-8 | Infrastructure provider | Medium |
| Performance | Add microbenchmark suite for key JIT patterns (RVV GEMM, B-ext throughput) | 2-3 | External contributor | Medium |
| Ecosystem | Integrate xbyak_riscv into mcl for native RISC-V JIT (pairing-based crypto) | 4-6 | herumi + external | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [herumi/xbyak_riscv repository](https://github.com/herumi/xbyak_riscv)
- [PR #25 -- Add RISC-V B extension mnemonic support](https://github.com/herumi/xbyak_riscv/pull/25)
- [PR #23 -- feat: support riscv D standard extension](https://github.com/herumi/xbyak_riscv/pull/23)
- [PR #22 -- add Zvfbfwma support](https://github.com/herumi/xbyak_riscv/pull/22)
- [PR #21 -- Feature: Add riscv_hwprobe support and Z-extension detection (closed)](https://github.com/herumi/xbyak_riscv/pull/21)
- [PR #20 -- Fix: Enable strict C++11 compatibility and support native RISC-V builds](https://github.com/herumi/xbyak_riscv/pull/20)
- [PR #19 -- Add override specifiers to virtual methods](https://github.com/herumi/xbyak_riscv/pull/19)
- [PR #18 -- Added Floating-Point CSRs](https://github.com/herumi/xbyak_riscv/pull/18)
- [PR #17 -- Added pseudoinstruction vfneg_v and vfabs_v support](https://github.com/herumi/xbyak_riscv/pull/17)
- [PR #14 -- CPU/RISCV64 target generation and compilation quick fix for V extension](https://github.com/herumi/xbyak_riscv/pull/14)
- [PR #13 -- Add vfcmp pseudoinstructions](https://github.com/herumi/xbyak_riscv/pull/13)
- [PR #12 -- Add sq, lq, c_ldq (open)](https://github.com/herumi/xbyak_riscv/pull/12)
- [PR #11 -- Add vector mask pseudoinstructions](https://github.com/herumi/xbyak_riscv/pull/11)
- [Issue #24 -- Change default tail/mask policy in vsetvli/vsetivli to ta,ma](https://github.com/herumi/xbyak_riscv/issues/24)
- [Issue #16 -- putL() before label definition crashes](https://github.com/herumi/xbyak_riscv/issues/16)
- [Issue #15 -- li() uses compile-time macro instead of runtime isRV32_ member](https://github.com/herumi/xbyak_riscv/issues/15)
- [Commit ce97383 -- fix whole-register vector load/store encoding](https://github.com/herumi/xbyak_riscv/commit/ce97383)
- [Commit 97668f9 -- vsetvli default policy macro](https://github.com/herumi/xbyak_riscv/commit/97668f9)
- [oneDNN PR #5253 -- RISC-V GEMM VTA/VMA fix](https://github.com/uxlfoundation/oneDNN/pull/5253)
- [PyYAML issue #924 -- no pre-built riscv64 wheel](https://github.com/yaml/pyyaml/issues/924)
- [xbyak_riscv CHANGELOG](https://github.com/herumi/xbyak_riscv/blob/main/CHANGELOG.md)
- [xbyak_riscv .github/workflows/main.yml](https://github.com/herumi/xbyak_riscv/blob/main/.github/workflows/main.yml)
- [xbyak_riscv_util.hpp -- CPU detection](https://github.com/herumi/xbyak_riscv/blob/main/xbyak_riscv/xbyak_riscv_util.hpp)
- [xbyak_riscv_v.hpp -- RVV mnemonics](https://github.com/herumi/xbyak_riscv/blob/main/xbyak_riscv/xbyak_riscv_v.hpp)
- [gen/rvv_instr_dict.yaml -- RVV encoding dictionary](https://github.com/herumi/xbyak_riscv/blob/main/gen/rvv_instr_dict.yaml)