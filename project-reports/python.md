---
title: Python
parent: Project Reports
color: blue
dependencies:
  - name: libffi
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: libmpdec
    relation: runtime-dependency
    criticality: critical
  - name: expat
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: mimalloc
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="python" %}

# Python

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Python<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CPython is the reference implementation of the Python programming language, maintained by the Python Software Foundation (PSF), a 501(c)(3) non-profit. Homepage: [https://www.python.org/](https://www.python.org/). Repository: [https://github.com/python/cpython](https://github.com/python/cpython). License: Python Software Foundation License v2 (permissive, GPL-compatible).

Technical governance sits with a 5-person Steering Council (PEP 13), elected each feature release by core team members via Multi-winner Bloc STAR voting, which replaced Guido van Rossum's BDFL role after he stepped down in July 2018. The Council works with the PSF on project assets. Platform-support policy is formalized as PEP 11 ("Supported Platforms"), which defines a three-tier system (see Section 3).

PSF corporate sponsors by tier: Visionary - Bloomberg, Anthropic PBC, Meta, Hudson River Trading, NVIDIA, Google, Fastly. Sustainability - Microsoft. Maintaining - Anaconda Inc, Capital One, Vercel, Red Hat, SerpApi, AWS. Contributing - Cubist Systematic Strategies, OpenEDG Python Institute, Snowflake, JetBrains, Sentry, Netflix, Cloudflare, Jane Street, Posit PBC, Indeed, Malwarebytes and others. Supporting/Partner/Participating - Qube Research & Technologies, Hex, CodSpeed, Elastic, Apify, ClickHouse, marimo, Astral, Trail of Bits, Quansight, Six Feet Up and others.

Python is the dominant language for data science, machine learning and scientific computing. Its binary packaging ecosystem (PyPI, manylinux wheels) is critical to end-user productivity: an estimated ~15% of the top 10,000 PyPI packages are binary-only, including numpy, scipy, pandas and scikit-learn ([riseproject.dev, May 2025](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)).

Community stance on new ports: PEP 11's tier system is the formal on-ramp for new architectures. A new port is accepted at Tier 3 once a core developer volunteers and a reliable buildbot exists; there is no release-blocking obligation until the port proves itself and is promoted. This is a structured, low-bar-but-real, volunteer-driven stance.

**RISC-V status in one sentence:** CPython reached official PEP 11 Tier 3 status for `riscv64-unknown-linux-gnu` in August-September 2026, backed by RISE-funded buildbot hardware with reliable build and test results; CPython does not itself publish riscv64 binaries, so the consumable riscv64 Python today comes from Debian/Ubuntu and third-party channels, and two performance-facing subsystems (the copy-and-patch JIT and the Linux-perf JIT trampoline) remain unimplemented or unwired on riscv64.

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2018-03-13 | First issue requesting RISC-V platform triplets ([bpo-33377 / issue #77251](https://github.com/python/cpython/issues/77251)) |
| 2018-04-30 | [PR #6655](https://github.com/python/cpython/pull/6655) merged: adds autoconf triplets for mips-r6 and riscv to `config.sub`/`config.guess`. Author: Matthias Klose (doko42), Debian/Ubuntu maintainer. First RISC-V content in CPython. |
| 2018-04-30 to 05-01 | [PR #6660](https://github.com/python/cpython/pull/6660) merged: backport of the triplets to Python 3.7 |
| 2019-04-22 to 05-02 | [Issue #80880](https://github.com/python/cpython/issues/80880): riscv multilib build support, patch attached, closed |
| 2023-04-11 | [Issue #103438](https://github.com/python/cpython/issues/103438) / [PR #103439](https://github.com/python/cpython/pull/103439): `CTYPES_PASS_BY_REF_HACK` extended to riscv64; PR closed/merged 2024-06-26, issue itself left open for cleanup |
| 2023-12-05 to 12-08 | [Issue #112779](https://github.com/python/cpython/issues/112779) / [PR #112819](https://github.com/python/cpython/pull/112819): build failure, undefined reference to `__atomic_exchange_1` on riscv64 (StarFive board, GCC 12.2.0), fixed via configure-phase atomic-op detection |
| 2023-12-11 to 12-22 | [Issue #112951](https://github.com/python/cpython/issues/112951): mimalloc "unable to directly request hinted aligned OS memory" warning on riscv64, closed on the CPython side (upstream mimalloc issue remains open, see Section 9) |
| 2024-02-27 | [Issue #115988](https://github.com/python/cpython/issues/115988) opened: missing ARM64/RISC-V BCJ filter constant in the `lzma` module |
| 2024-06-05 to 06-12 | [PR #120089](https://github.com/python/cpython/pull/120089) merged: adds Linux-perf support for seeing Python calls on riscv64; backported to 3.13 via PR #120413 (2024-06-14); closes [Issue #120400](https://github.com/python/cpython/issues/120400). Lands in CPython 3.13.0. |
| 2024-07-01 | [Issue #121201](https://github.com/python/cpython/issues/121201) opened: riscv64 fails to build `Python/perf_jit_trampoline.c` ("Unsupported target architecture"); introduced by the above perf work (first-bad commit `56657f6`) |
| 2024-07-03 | [PR #121328](https://github.com/python/cpython/pull/121328) merged (author stefanor): disables perf_trampoline on riscv64 as a stopgap; backported to 3.13 via [PR #121336](https://github.com/python/cpython/pull/121336) (2024-07-04) |
| 2024-07-04 | [PR #121387](https://github.com/python/cpython/pull/121387) opened (author furkanonder): proper riscv64 perf-JIT DWARF register fix (`DWRF_REG_RA=1`, `DWRF_REG_SP=2`); pablogsal states on 2024-07-13 that it cannot be merged without validation on a machine with working `perf` |
| 2025-05-02 to 05-03 | [Issue #133304](https://github.com/python/cpython/issues/133304) / [PR #133328](https://github.com/python/cpython/pull/133328): `PyFloat_Pack4/Unpack4` NaN round-trip failure on the riscv64 buildbot, fixed |
| 2026-04-17 | PR #121387 auto-labeled stale after 30+ days of inactivity; no reviewer has engaged since |
| 2026-05-28 | [PR #115989](https://github.com/python/cpython/pull/115989) merged: adds `lzma.FILTER_RISCV`; targets CPython 3.16 |
| 2026-06-04 to 07-01 | [Issue #150919](https://github.com/python/cpython/issues/150919): `test_frame_pointer_unwind` fails on riscv64 in 3.15.0b1, closed (fix mechanism not separately documented in the sources reviewed) |
| 2026-06-07 to 07-01 | [Issue #151040](https://github.com/python/cpython/issues/151040): `test_c_stack_unwind` fails on riscv64, Fedora 44, 3.15.0b2, closed via [PR #152370](https://github.com/python/cpython/pull/152370) (merged 2026-06-27/29) |
| 2026-07-24 | [python/steering-council#360](https://github.com/python/steering-council/issues/360) opened by StanFromIreland: formal proposal for PEP 11 Tier 3 status for `riscv64-unknown-linux-gnu` |
| 2026-08-20 | Steering Council (Yhg1s) comments agreement on steering-council#360: "The SC agrees with the proposal for tier 3 support for this platform. Please send us a PR..." |
| 2026-08-21 | StanFromIreland notes PEP text written, [python/peps#5102](https://github.com/python/peps) |
| 2026-08-22 | steering-council#360 closed as approved; [cpython#156244](https://github.com/python/cpython/issues/156244) opened (implementation-tracking issue) |
| 2026-08-23 | [PR #156277](https://github.com/python/cpython/pull/156277) merged (StanFromIreland, emmatyping): marks `riscv64-*-linux-gnu/gcc` and `/clang` as `PY_SUPPORT_TIER=3` in `configure.ac`. Blog post "RISC-V is now officially supported by CPython!" published on [blog.python.org](https://blog.python.org/2026/08/riscv-now-officially-supported/) and ["Python Now Officially Supports RISC-V"](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/) on riseproject.dev (2026-08-24). Same day, StanFromIreland closes the 6-year-old [Issue #85518](https://github.com/python/cpython/issues/85518) ("not planned"), stating the underlying tests "now pass cleanly on CPython's four RISC-V buildbots." |
| 2026-08-27 | Follow-up commit `1b38ad1` by clin1234 on cpython#156244 |
| 2026-09-10 | cpython#156244 closed by hugovk. [PR #156358](https://github.com/python/cpython/pull/156358) (backport of #156277 to the 3.15 branch) **closed unmerged**; hugovk: "Let's not backport." |
| 2026-09-17 to 09-18 | [Issue #157688](https://github.com/python/cpython/issues/157688) / [PR #157690](https://github.com/python/cpython/pull/157690): `test_linux_ext_suffix` performs no assertions on riscv64, fixed |
| 2026-09-10 | ["CPython Officially Adds RISC-V Support As a Tier 3 Platform"](https://www.infoq.com/news/2026/09/riscv-cpython/), InfoQ |

The port began as autoconf triplet recognition (2018) and advanced through distro- and buildbot-driven bug reports for six years before reaching formal PEP 11 status in August 2026. Key individual contributors: Stan Ulbrych (StanFromIreland, primary architect of the Tier 3 push, supported by a Sovereign Tech Agency fellowship), Furkan Onder (RISE Project, original buildbot operator and perf-JIT fix author), Emma Smith (co-maintainer of the riscv64 tier per PEP 11), and Matthias Klose (initial 2018 triplet work, Debian/Ubuntu). RISE (RISC-V Software Ecosystem) funded/provided the physical hardware underpinning the buildbot fleet that justified the Tier 3 approval.

Governance status: the Tier 3 classification is formally and fully upstream in `configure.ac` on the `main` branch (merged, released toward 3.16). It is **not** present in the CPython 3.15 branch: the backport PR #156358 was explicitly rejected by core developer hugovk, so Python 3.15 ships without the formal Tier 3 marking even though the Steering Council's underlying governance approval (steering-council#360) predates and covers it.

## 3. Upstream Support Tier

PEP 11 defines three support tiers:

| Tier | Requirements | Release impact |
|---|---|---|
| 1 | All core devs responsible for the platform; CI failures block releases | x86_64-linux-gnu and other primary desktop/server targets |
| 2 | At least 2 core-dev sponsors plus a reliable buildbot; failures block releases | aarch64-linux-gnu (clang variant) and others |
| 3 | At least 1 core-dev sponsor plus a reliable buildbot; failures do **not** block releases | riscv64-unknown-linux-gnu (gcc and clang variants), Android, iOS, FreeBSD, Emscripten, s390x, powerpc64le, and others |

**riscv64-unknown-linux-gnu is Tier 3**, approved by the Steering Council on 2026-08-22 ([steering-council#360](https://github.com/python/steering-council/issues/360)) and implemented in `configure.ac` via [PR #156277](https://github.com/python/cpython/pull/156277) (merged 2026-08-23, first ships in CPython 3.16). It is maintained by Stan Ulbrych and Emma Smith [NEEDS VERIFICATION for the specific named-maintainer attribution; sourced from a single PEP 11 policy summary]. The `configure.ac` entries cover both GCC and Clang toolchains:

```
[riscv64-*-linux-gnu/gcc],   [PY_SUPPORT_TIER=3],
[riscv64-*-linux-gnu/clang], [PY_SUPPORT_TIER=3],
```

Evidence that this is a real, functioning Tier 3 rather than a paper classification: steering-council#360 cites "three stable Buildbots plus one semi-stable free-threading Buildbot" at approval time, and the closure comment on the 6-year-old [Issue #85518](https://github.com/python/cpython/issues/85518) (2026-08-23) states the relevant tests "now pass cleanly on CPython's four RISC-V buildbots" - i.e. build=yes and test=yes on buildbot.python.org infrastructure. These buildbots are not GitHub Actions; a full-repository grep of `.github/workflows/` (23 files) and the rest of the tree found zero riscv references, confirming riscv64 testing happens exclusively through the external buildbot fleet, not through CPython's own GitHub Actions matrix (see Section 7).

CPython does not publish riscv64 release binaries under any tier (see Section 8); Tier 3 governs build/test obligations, not official binary distribution.

Comparison:

| Architecture | PEP 11 tier | CI mechanism | Official binaries |
|---|---|---|---|
| x86_64-linux-gnu | Tier 1 | GitHub Actions | python.org source tarball (no official Linux binaries for any arch) |
| aarch64-linux-gnu | Tier 1/2 | GitHub Actions | Same as above |
| riscv64-unknown-linux-gnu | Tier 3 | buildbot.python.org (3 stable + 1 semi-stable/free-threading) | None from CPython; distro and third-party only |

## 4. Technical Architecture and RISC-V-Specific Subsystems

A fresh clone of `python/cpython` (HEAD `eb30e3d`, 2026-10-01) confirms there is no `arch/riscv/` directory, no RVV/vector intrinsics (`vfloat32m1_t` etc.) anywhere in the tree, and no RISC-V entries in the experimental copy-and-patch JIT's target list.

**`Python/asm_trampoline_riscv64.S`** - 12-line GAS assembly perf-profiling trampoline (`_Py_trampoline_func_start/_end`): `addi sp,sp,-16; sd ra,8(sp); jalr a3; ld ra,8(sp); addi sp,sp,16; jr ra`. Base RV64I only, no ISA extensions, no CFI/security notes. By comparison, `Python/asm_trampoline_x86_64.S` is 45 lines (adds CET `endbr64` and a `.note.gnu.property` security descriptor) and `Python/asm_trampoline_aarch64.S` is 77 lines (adds BTI/PAC/GCS feature detection and security notes). **This file is dead code**: `configure.ac`'s `AS_CASE($PLATFORM_TRIPLET)` block that sets `PERF_TRAMPOLINE_OBJ` only matches `x86_64-linux-{gnu,musl}` and `aarch64-linux-{gnu,musl}` (plus macOS); there is no `riscv64-*-linux-gnu` case, so the file and its `Makefile.pre.in` build rule are never invoked by `./configure`.

**`Python/perf_jit_trampoline.c`** (852 lines) - contains a working `EM_RISCV` (243) case in its ELF-machine-detection switch, but is wrapped in `#ifdef PY_HAVE_PERF_TRAMPOLINE`, which is never defined for riscv64 given the gap above. It compiles to an empty translation unit on riscv64. This is the root of open [Issue #121201](https://github.com/python/cpython/issues/121201).

**`Tools/jit/_targets.py`** (the experimental copy-and-patch JIT, PEP 744, headline 3.13+ performance feature) - host-triple regex matching covers only `aarch64-*` and `x86_64-*|i686-*` variants. Zero riscv64 entries. The architecture is not recognized by the JIT build tooling at all; this is a missing subsystem, not a scalar fallback.

**`Objects/floatobject.c`** - `#ifndef __riscv` guards (two sites) in `PyFloat_Pack4/Unpack4`. RISC-V's FPU canonicalizes/silences NaN payloads on float32-to-float64 widening differently from other architectures, so the optimized fast path is explicitly excluded on riscv64 and a portable fallback is used instead, with sign/payload restored from the raw packed bytes ([PR #133328](https://github.com/python/cpython/pull/133328)). Functionally correct, but not the native fast path other tier-1 architectures get.

**`Modules/_ctypes/callproc.c`** - `CTYPES_PASS_BY_REF_HACK` is enabled for `__riscv` alongside aarch64/mingw64/cygwin: structs larger than 8 bytes or of non-power-of-2 size are passed by reference through the libffi call path, matching RISC-V's calling convention. Functional but a shared heuristic, not riscv-tuned; cleanup tracked in open [Issue #103438](https://github.com/python/cpython/issues/103438).

**`Modules/_testinternalcapi.c`** - `FRAME_POINTER_NEXT_OFFSET`/`FRAME_POINTER_RETURN_OFFSET` set to `-2`/`-1` for `__riscv`, implementing the correct RISC-V ELF psABI frame-pointer convention for C-stack walking, fixed via [PR #152370](https://github.com/python/cpython/pull/152370).

**`Include/cpython/object.h`** - thread-id fast path uses `__builtin_thread_pointer()` (clang) or inline `mv %0, tp` asm to read RISC-V's `tp` register per the RISC-V ABI. Correct, native intrinsic path.

**`Modules/_hacl/include/krml/internal/types.h`** - vendored HACL* crypto header; `__riscv && __riscv_xlen==64` included in the `HAS_INT128` detection macro alongside s390x/mips64, enabling 128-bit integer support for the vendored hash/crypto implementations.

**`Modules/_lzmamodule.c` / `Lib/lzma.py`** - `lzma.FILTER_RISCV` (BCJ filter ID `0x0B`) exposed in the public API, same tier of support as the ARM64 filter; requires liblzma >= 5.6.0 at runtime; new in 3.16 ([PR #115989](https://github.com/python/cpython/pull/115989)).

**`Misc/platform_triplet.c`** - correct `riscv32`/`riscv64` detection via `__riscv_xlen` for extension-module filename suffixes.

**`Include/cpython/pyatomic_gcc.h`** - no arch-specific code for any architecture (generic `__atomic_*` builtins plus a configure-time `-latomic` check); this is a uniform gap, not riscv-specific.

Architecture-specific code-surface comparison (non-test files containing the platform guard): `__x86_64__` appears in 22 files, `__aarch64__` in 17 files, `__riscv` in 7 files. riscv64 carries roughly a third of x86_64's architecture-specific footprint, consistent with its 2026 Tier 3 status versus x86_64/aarch64's Tier 1/2 maturity.

| Component | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| Copy-and-patch JIT (`Tools/jit/`) | Full | Full | Missing - zero entries in `_targets.py` |
| Perf ASM trampoline | Full (CET) | Full (BTI/PAC/GCS) | Source present, unreachable - not wired into `configure.ac` |
| Perf JIT trampoline (DWARF CFI) | Full | Full | `EM_RISCV` detection present but gated by the unreachable trampoline (open Issue #121201) |
| Manual frame-pointer unwinding | Correct | Correct | Correct, fixed via PR #152370 |
| ctypes/libffi ABI | Native | Native | Functional via shared `PASS_BY_REF_HACK` heuristic |
| Float NaN packing | Native fast path | Native fast path | Correct via `#ifndef __riscv` portable fallback |
| HACL* 128-bit crypto ints | Full | Full | Full, same tier as s390x/mips64 |
| lzma BCJ filter | Full | Full | Full, added 3.16 |
| Thread-pointer read | Native | Native | Native (`__builtin_thread_pointer`/`tp` register) |

## 5. Build System, Cross-Compilation, and Toolchain

CPython uses GNU Autotools exclusively (`configure` generated from `configure.ac`, `Makefile.pre.in` -> `Makefile`). A direct repository inspection confirms there is **no CMakeLists.txt, no `cmake/` directory, no Dockerfile anywhere in the tree, and no QEMU usage anywhere in the repository** (`search_code` for `qemu riscv64`, `riscv64 Dockerfile`, and `riscv64 path:.github` each returned zero results). `BUILDING.md`, `INSTALL`, `docs/building.md`, and `docs/cross-compilation.md` do not exist; the build documentation lives at [docs.python.org/3/using/configure.html](https://docs.python.org/3/using/configure.html).

Standard native build (identical for riscv64, no special flags):

```
./configure
make
make test
sudo make install
```

Cross-compiling uses CPython's generic Autotools cross-build mechanism; there is no riscv64-specific wrapper or toolchain file. `configure.ac` requires both `--host` and `--build` when cross-compiling, and a `--with-build-python` matching the target Python version (the cross-build runs the host-architecture Python to freeze modules and generate headers):

```
./configure --host=riscv64-unknown-linux-gnu --build=<your-build-triple> \
            --with-build-python=<path-to-native-python-for-same-version>
make
```

**Toolchain versions:** `configure.ac` enforces **no riscv64-specific, and no general, minimum GCC/Clang version string**; compiler support is entirely feature-detected (checks for flags like `-fno-strict-aliasing`, `-fvisibility=hidden`, and builtins like `__builtin_thread_pointer`) rather than gated on a version number. In practice, whatever GCC or Clang a distro ships with a working `riscv64-unknown-linux-gnu`/`riscv64-linux-gnu` target (both are explicitly listed as supported in the Tier 3 `configure.ac` entries) is sufficient. The RISC-V backend first became available upstream in roughly GCC 7.1, GNU binutils 2.28, and glibc 2.27, which is the practical floor even though CPython's own `configure` does not check for it directly [NEEDS VERIFICATION for the exact version-numbers, carried from a single source].

The canonical riscv64 Linux ABI used across GCC, Clang, QEMU and all major riscv64 distributions is ISA `rv64gc` (IMAFD + Zicsr + Zifencei + C), ABI `lp64d`, triple `riscv64-unknown-linux-gnu` or `riscv64-linux-gnu`. The manylinux standard for binary wheel distribution uses `manylinux_2_39_riscv64` (glibc 2.39) or `manylinux_2_35_riscv64` (glibc 2.35, used by RISE's wheel_builder).

Flags to avoid on riscv64: `--enable-experimental-jit` (the JIT does not recognize riscv64 in any released or beta version); `--enable-optimizations` when cross-compiling (PGO requires running the target binary natively).

Debian/Ubuntu cross-compiler setup:

```
sudo dpkg --add-architecture riscv64
sudo apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
export CC=riscv64-linux-gnu-gcc
export CXX=riscv64-linux-gnu-g++
```

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| Copy-and-patch JIT (3.13+) | Full | Full | Missing entirely |
| Perf ASM trampoline | Full (CET) | Full (BTI/PAC/GCS) | Present on disk, not wired into configure.ac |
| Perf JIT trampoline (DWARF CFI) | Full | Full | Build fails without the disable workaround; real fix stalled (PR #121387) |
| Manual frame-pointer unwinding | Correct | Correct | Correct (fixed, PR #152370) |
| ctypes/libffi ABI | Native | Native | Functional via shared ABI workaround |
| Float SNaN handling | Native fast path | Native fast path | Correct via portable fallback (PR #133328) |
| lzma FILTER constant | Full | Full | Added in 3.16 |
| libatomic linking | Not needed | Not needed | Fixed via configure detection (2023) |
| SIMD/vector dispatch (hash/compression libs) | SSE/AVX2 | NEON | None |
| PEP 11 platform tier | Tier 1 | Tier 1/2 | Tier 3 |
| GitHub Actions CI | Yes | Yes | No - relies on buildbot.python.org |
| Official binary releases | None from CPython for any arch (source + distro) | Same | Same |

The JIT gap is the most significant performance item: on supported architectures the copy-and-patch JIT is CPython's primary 3.13+ performance investment. riscv64 runs the bytecode interpreter only, with no upstream issue or PR yet opened to begin riscv64 JIT work (confirmed by zero riscv references in `Tools/jit/`).

The perf-JIT trampoline gap is a tooling/observability issue, not a correctness bug: `perf record` cannot resolve Python call sites into JIT-generated frames on riscv64, because the real fix is blocked on validation hardware (see Section 12).

Correctness issues that existed in the 3.15 beta series (`test_frame_pointer_unwind`, `test_c_stack_unwind`) are now closed; stack unwinding on riscv64 is reported as working.

## 7. CI/CD Infrastructure

CPython's own GitHub Actions matrix has **zero riscv64 coverage**. A direct clone-and-grep of all 23 workflow files in `.github/workflows/` (`build.yml`, `jit.yml`, `lint.yml`, `mypy.yml`, `reusable-ubuntu.yml`, `reusable-macos.yml`, `reusable-windows.yml`, `reusable-wasi.yml`, `reusable-emscripten.yml`, `reusable-san.yml`, `reusable-cifuzz.yml`, `tail-call.yml`, `stale.yml`, and others) plus a repository-wide search for `.yml`/`.yaml` files found no mention of "riscv" in any form. There is no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` at the repository root. The CI matrix covers x86_64/arm64 Linux, Windows, macOS, i686 Windows, wasm32 (WASI/Emscripten), Android and iOS; RISC-V is absent, whether via native runner or QEMU emulation.

riscv64 testing instead runs on **buildbot.python.org**, external infrastructure not represented in this repository's workflow files. Per steering-council#360 (approved 2026-08-22), the riscv64 Tier 3 approval was backed by "three stable Buildbots plus one semi-stable free-threading Buildbot" - four buildbots total. The closure comment on [Issue #85518](https://github.com/python/cpython/issues/85518) (2026-08-23) independently corroborates "CPython's four RISC-V buildbots," confirming the fleet is operating and testing reliably as of the Tier 3 approval date. RISE supplied the physical riscv64 hardware behind this buildbot coverage ([riseproject.dev blog, 2026-08-24](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)). This coverage is a material increase from the project's early 2024-2026 state, when riscv64 CI ran on a single volunteer-operated board; the buildbot fleet's exact current operator/ownership structure is not independently documented in the sources reviewed here [NEEDS VERIFICATION].

RISE separately operates "RISE RISC-V Runners," free ephemeral GitHub Actions runners on physical riscv64 hardware (reported as bare-metal Scaleway servers). These runners back RISE's own adjacent projects - `riseproject-dev/python-wheels` (wheel building) and `riseproject-dev/python-versions` (prebuilt CPython binaries) - but are not wired into CPython's own `.github/workflows/`.

| | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| GitHub Actions in cpython repo | Yes | Yes | No |
| buildbot.python.org coverage | Extensive, Tier 1 | Extensive | 4 buildbots (3 stable + 1 semi-stable free-threading), Tier 3 |
| Release-blocking | Yes | Yes | No (Tier 3) |

## 8. Distribution and Release Status

CPython publishes **no riscv64 binaries from its own channels**. [python.org/downloads](https://www.python.org/downloads/) and the FTP mirror provide only source tarballs (`.tar.xz`/`.tgz`) plus Windows (amd64/arm64) and macOS installers - this is true for every architecture, including amd64 Linux; CPython has never shipped official Linux binaries for any architecture, so the absence of a riscv64 asset is not riscv64-specific.

Downstream distro and third-party channels confirmed directly:

- **Ubuntu 26.04 ("resolute")**: `python3` (version `3.14.3-0ubuntu2`), `python3-minimal`, and `python3-dev` are all present for riscv64, confirmed via direct fetch of [packages.ubuntu.com/resolute/riscv64/python3](https://packages.ubuntu.com/resolute/riscv64/python3) (HTTP 200; package `python3_3.14.3-0ubuntu2_riscv64.deb`, pool `pool/main/p/python3-defaults/`). riscv64 is tagged a `ports` architecture in Ubuntu, meaning it carries ports-tier (not primary-archive) support guarantees.
- **Debian sid**: `python3.13_3.13.14-1_riscv64.deb`, built by Debian buildd worker `rv-osuosl-03`, installed/up-to-date in the archive [carried from prior assessment, not re-verified this cycle].
- **Arch Linux RISC-V**: `python-3.14.7-1.1-riscv64.pkg.tar.zst` confirmed present in the `core` repository at [archriscv.felixc.at/repo/core/](https://archriscv.felixc.at/repo/core/) (dated 2026-09-08, 21.1MB, with detached signature).
- **RISE python-versions** ([riseproject-dev/python-versions](https://github.com/riseproject-dev/python-versions)): third-party channel publishing prebuilt CPython binaries for linux/riscv64 as GitHub Releases, built on `ubuntu-24.04-riscv` RISE runners, tracking upstream CPython version tags, compatible with the `setup-python` toolcache format.

PyPI itself has no package literally named "python" (CPython is not distributed as a PyPI package); this check is inapplicable by design, not evidence of a riscv64 gap.

**Bottom line for a user who wants riscv64 Python today:** install from Debian sid or Ubuntu 26.04's `python3` package, use Arch Linux RISC-V's `python` package, or pull a prebuilt interpreter from RISE's `python-versions` releases. Building from CPython source with `./configure && make` also works, backed by Tier 3 buildbot validation. There is no path to an "official" CPython-published riscv64 binary.

## 9. Dependencies

| Dependency | Role | Relation/Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| libffi | FFI backend for `ctypes` | runtime-dependency, critical | Builds, with correctness gaps | `struct_by_value_big` test **fails** on riscv64 (open) | Unclear - open linking issue | [libffi#466](https://github.com/libffi/libffi/issues/466) (small ints not promoted to `ffi_arg` on riscv64, open), [#777](https://github.com/libffi/libffi/issues/777) (linking `libffi.a` on riscv64 fails, open), [#694](https://github.com/libffi/libffi/issues/694) (`struct_by_value_big` fails on aarch64+riscv64, open) |
| OpenSSL | `ssl`/`hashlib` crypto backend | runtime-dependency, critical | Builds; RISC-V crypto-extension acceleration (Zknd/Zkne AES, SHA256) still maturing | Flaky: `test_lhash` intermittently fails on riscv64 CI (open) | No distinct riscv64 release gating; generic C fallback ships | [openssl#28118](https://github.com/openssl/openssl/issues/28118) (riscv ext. detection broken on musl, open), [#30880](https://github.com/openssl/openssl/issues/30880) (flaky riscv64 CI, open), [#29453](https://github.com/openssl/openssl/issues/29453) (intrinsics vs inline asm, open), [#28664](https://github.com/openssl/openssl/issues/28664) (SHA256 perf, open), [#25334](https://github.com/openssl/openssl/issues/25334) (AES needs Zknd+Zkne simultaneously, open) |
| zlib | `zlib`/`gzip` compression | runtime-dependency, optional | No riscv64-specific issues found | No riscv64-specific issues found | N/A, portable C | None found in search |
| bzip2 | `bz2` compression | runtime-dependency, optional | Not searchable via GitHub (hosted on sourceware.org) | Same | Same | Use sourceware Bugzilla directly |
| xz | `lzma` compression | runtime-dependency, optional | OK; unaligned-access perf path added | - | - | [tukaani-project/xz#146](https://github.com/tukaani-project/xz/issues/146) (`TUKLIB_FAST_UNALIGNED_ACCESS` for RISC-V, closed/merged); CPython-side [#115988](https://github.com/python/cpython/issues/115988) (missing `FILTER_RISCV`, closed/fixed) |
| zstd | `_zstd` module (new in 3.14) | runtime-dependency, optional | Builds; 4-way fast decompression loop not enabled | - | - | [zstd PR #4622](https://github.com/facebook/zstd/pull/4622): performance gap, open |
| libmpdec | `decimal` module C accelerator | runtime-dependency, critical | Not searchable via GitHub (hosted on bytereef.org) | Same | Same | Uses generic uint128 fallback on riscv64; no riscv64 asm path; no known correctness blockers |
| expat | `xml.parsers.expat`, vendored in CPython | runtime-dependency, optional | No riscv64-specific issues found | No riscv64-specific issues found | N/A | None found in search |
| SQLite | `sqlite3` module | runtime-dependency, optional | No riscv64-specific issues found | No riscv64-specific issues found | N/A | None found in search |
| mimalloc | Default allocator (3.13+, including free-threaded builds) | runtime-dependency, critical | Functional correctness gap on RISC-V | - | - | [microsoft/mimalloc#939](https://github.com/microsoft/mimalloc/issues/939): "Unable to obtain aligned memory on RISC-V systems with an SV39 MMU," open; corresponding CPython-side symptom closed as [Issue #112951](https://github.com/python/cpython/issues/112951) |
| LLVM | Alternate C/C++ toolchain (Clang), riscv64 explicitly listed in `configure.ac` Tier 3 entries | build-dependency, optional | `riscv64-*-linux-gnu/clang` is a Tier 3 PY_SUPPORT_TIER entry | - | - | No riscv64-specific LLVM/Clang blocking issues found in this research pass |
| glibc | C runtime, pthreads, math | runtime-dependency, critical | Builds; riscv64 upstream support since early glibc 2.2x releases | - | - | No blocking issues found; RVV-accelerated memset/libmvec work ongoing upstream for performance parity [NEEDS VERIFICATION, single-source] |
| GCC | Primary build toolchain | build-dependency, critical | No version minimum enforced by `configure.ac`; feature-detected | - | - | riscv64 GCC backend has been available for years; CPython relies on no specific version string |
| GNU binutils | Assembler/linker | build-dependency, critical | No version minimum enforced by `configure.ac`; relies on distro-provided `riscv64-linux-gnu` binutils | - | - | No CPython-side riscv64 binutils issues found |

Additional indirect/recursed dependencies surfaced by research but not in the direct-dependency list above:

| Dependency | Role | riscv64 status |
|---|---|---|
| GNU readline | `readline` module (interactive REPL) | Not searchable via GitHub (hosted on savannah.gnu.org); no issues independently located |
| ncurses | `curses` module | GitHub mirror (`mirror/ncurses`) is a read-only CVS mirror, not where real bugs are filed; not informative either way |
| Tcl/Tk | `tkinter` backend (optional) | No riscv64-specific issues found on GitHub; Tcl/Tk 9.0 reported available for RISC-V per a steering-council#360 comment from terryjreedy |
| util-linux (libuuid) | `uuid` module ctypes binding | Open build-porting issue [util-linux#1526](https://github.com/util-linux/util-linux/issues/1526) ("Trying to compile util-linux for RISC-V architecture," open); riscv64 test failures closed in [#4618](https://github.com/util-linux/util-linux/issues/4618)/[#2402](https://github.com/util-linux/util-linux/issues/2402); `lscpu` segfault on rv64 fixed in [#1401](https://github.com/util-linux/util-linux/issues/1401) |

Two dependencies with the most material riscv64-side risk: **libffi** (an open, unresolved test failure for struct-by-value ABI handling directly affects `ctypes` correctness) and **mimalloc** (an open upstream aligned-memory bug on SV39 MMU hardware affects the default allocator used by CPython 3.13+, including free-threaded builds).

## 10. Ecosystem Status

Python carries a large dependent-package ecosystem on PyPI that must independently gain riscv64 binary wheel support; this is distinct from CPython's own interpreter port and is the dominant practical barrier to a productive riscv64 Python experience.

An estimated ~15% of the top 10,000 PyPI packages are binary-only (numpy, scipy, pandas, pillow, scikit-learn and similar), and historically lacked riscv64 wheels ([riseproject.dev, May 2025](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)).

**RISE wheel_builder / python-wheels**: RISE's primary response to this gap. Initiated by Rivos Inc. (author Mark Ryan), funded/supported by RISE, developed and maintained by Rivos and Baylibre (a RISE RFP awardee). Provides a GitLab-hosted PyPI index (`pip install numpy --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple`) covering CPython 3.10-3.13, `manylinux_2_35`, and (per the May 2025 post) 49 projects. Measured install-time improvement: numpy installs in ~25 seconds via wheel_builder versus ~15 minutes building from source on a VisionFive 2 board (~36x faster). The project has been superseded/continued as [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels) (797 open issues as of this research, continuing wheel coverage via native riscv64 RISE Runners, index at `https://pypi.riseproject.dev/simple/`, dual MIT/Apache-2.0 license).

**RISC-V Wheels Dashboard**: tracks the 15,000 most-downloaded PyPI packages' riscv64 wheel coverage by color code (has wheel / built in RISE registry only / pure-Python / unavailable); no performance data, coverage tracking only ([stanfromireland.github.io/riscv-wheels/](https://stanfromireland.github.io/riscv-wheels/)).

**conda-forge**: 500+ packages built for `linux-riscv64` at `rv64gc` baseline (not RVA23), per [conda-forge's September 2026 blog post](https://conda-forge.org/blog/2026/09/15/riscv64/) [not a RISE source, included for ecosystem completeness; NEEDS VERIFICATION, single source].

**Community wheel efforts outside RISE**: [gounthar/riscv64-python-wheels](https://github.com/gounthar/riscv64-python-wheels) (independent community wheel-building project); [riseproject-dev/python-wheels issue tracker](https://github.com/riseproject-dev/python-wheels) requests wheel support for individual packages (e.g. typeid-python #1438, ecos #1135, vispy #1719); [python-pillow/Pillow#9462](https://github.com/python-pillow/Pillow/issues/9462) ("Add riscv64 wheel to PyPI releases," tracking a specific high-impact package).

**PyTorch on riscv64**: a RISE-adjacent milestone, not a Python-core item, but material to the ML-dependent ecosystem. PyTorch 2.13.0 wheels for riscv64 (`manylinux_2_39_riscv64`) are natively built (not emulated) on Scaleway EM-RV1 hardware for CPython 3.12/3.13/3.14/3.14t ([riseproject.dev, 2026-08-18](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)). A test run on 2026-08-14 recorded 212,038 test cases: 165,591 passed, 46,256 skipped, 191 failed (99.998% pass rate of enabled tests). Build time: ~20 hours cold-cache, ~1.5 hours hot-cache. RVV vectorization is not yet implemented in ATen (PR tracked upstream, open since February 2026, blocked on design); most tensor ops currently run scalar code, so this is not yet representative of RVV-optimized performance. oneDNN is disabled (`USE_MKLDNN=0`, falls back to OpenBLAS); an unmerged change reportedly shows an "8.85x speedup on elementwise multiply on SG2044" [NEEDS VERIFICATION, single source, not yet landed in CI].

**NumPy**: designated NEP 57 Tier-3 for riscv64, with riscv64 CI added in May 2026 [NEEDS VERIFICATION, single source].

**RISE packaging staffing**: RISE posted a call for a dedicated Python packaging contractor for riscv64 on [discuss.python.org](https://discuss.python.org/t/rise-is-looking-for-a-python-packaging-contractor-for-riscv64/66538), indicating continued, organizationally-backed investment in closing the wheel-coverage gap.

**Bottom line**: CPython's own Tier 3 status does not by itself make the Python ecosystem usable on riscv64; wheel coverage for the binary-heavy scientific/ML stack is the larger ongoing effort, and it is substantially RISE-funded and RISE-infrastructure-dependent (GitLab/GitHub wheel indices, RISE RISC-V Runners, a supplementary PyPI index) rather than upstream-PyPI-native.

## 11. Known Bugs and Active Issues

### Open

| Issue/PR | Title | Opened | Severity |
|---|---|---|---|
| [#121201](https://github.com/python/cpython/issues/121201) / [PR #121387](https://github.com/python/cpython/pull/121387) | riscv64 fails to build `Python/perf_jit_trampoline.c`: "Unsupported target architecture" | 2024-07-01 | Medium - perf profiling disabled on riscv64; correct fix written but unmerged, stale since 2026-04-17, blocked on perf-hardware validation |
| [#103438](https://github.com/python/cpython/issues/103438) | Don't define `CTYPES_PASS_BY_REF_HACK` on aarch64 or riscv64 | 2023-04-11 | Low - workaround is correct, cleanup pending; implementing PR #103439 already merged |

### Closed/resolved

| Issue/PR | Title | Resolution | Target version |
|---|---|---|---|
| [#85518](https://github.com/python/cpython/issues/85518) | `test_thousand`/`compileall` hang on riscv64 (6+ years open) | Closed 2026-08-23 as "not planned"; tests now pass cleanly on CPython's four RISC-V buildbots - resolved incidentally, no linked fix PR | - |
| [#157688](https://github.com/python/cpython/issues/157688) / [PR #157690](https://github.com/python/cpython/pull/157690) | `test_linux_ext_suffix` performs no assertions on riscv64 | Fixed | - |
| [#151040](https://github.com/python/cpython/issues/151040) / [PR #152370](https://github.com/python/cpython/pull/152370) | `test_c_stack_unwind` fails on riscv64, Fedora 44 (3.15.0b2) | Fixed | 3.15 |
| [#150919](https://github.com/python/cpython/issues/150919) | `test_frame_pointer_unwind` fails on riscv64 (3.15.0b1) | Closed | 3.15 |
| [#133304](https://github.com/python/cpython/issues/133304) / [PR #133328](https://github.com/python/cpython/pull/133328) | `test_pack_unpack_roundtrip_for_nans` failing on RISC-V buildbot | Fixed - RISC-V FP unit canonicalizes/silences NaN payloads on widening, breaking bit-exact round-trip; workaround restores sign/payload from raw bytes | 3.14 |
| [#115988](https://github.com/python/cpython/issues/115988) / [PR #115989](https://github.com/python/cpython/pull/115989) | ARM64/RISCV BCJ filter missing in `lzma` module | Fixed | 3.16 |
| [#120400](https://github.com/python/cpython/issues/120400) / [PR #120089](https://github.com/python/cpython/pull/120089) | Linux perf profiling can't see Python calls on RISC-V | Merged, then partially reverted/disabled for riscv64 by PR #121328 | 3.13 (feature disabled on riscv64) |
| [#112779](https://github.com/python/cpython/issues/112779) / [PR #112819](https://github.com/python/cpython/pull/112819) | Build error on RISC-V: undefined reference to `__atomic_exchange_1` (StarFive board) | Fixed - configure-phase atomic-op detection added | 2023-12-08 |
| [#112951](https://github.com/python/cpython/issues/112951) | mimalloc warning: unable to directly request hinted aligned OS memory [RISC-V] | Closed on CPython side; upstream [microsoft/mimalloc#939](https://github.com/microsoft/mimalloc/issues/939) remains open | - |
| [#121138](https://github.com/python/cpython/issues/121138) | riscv64 perf_jit_trampoline.c:491 "Unsupported target architecture" (duplicate of #121201) | Closed in favor of #121201 | - |

**Correctness bugs worth flagging separately:** #133304 was a silent data-corruption class bug (NaN bit-pattern loss on riscv64 float packing), now fixed. #85518 was a 6-year-standing multiprocessing hang with no root-cause fix identified in the closing comment - it resolved incidentally alongside other kernel/glibc/toolchain changes, which is a weaker form of resolution than a targeted patch.

## 12. Objections and Upstream Blockers

**Blocker 1 - Perf-JIT trampoline fix blocked on unavailable validation hardware.** The correct fix for [#121201](https://github.com/python/cpython/issues/121201) (DWARF register values `RA=1`, `SP=2`, matching the RISC-V psABI) has existed since July 2024 in [PR #121387](https://github.com/python/cpython/pull/121387). Maintainer pablogsal stated on 2024-07-13 that it cannot be merged without end-to-end validation on a machine with working Linux `perf` hardware performance counters, and no such riscv64 machine has been supplied as of the PR's 2026-04-17 stale marking. This is a hard, specific, named blocker, unresolved for over two years.

**Blocker 2 - 3.15 ships without the formal Tier 3 marking.** The backport of the Tier 3 `configure.ac` change to the 3.15 branch ([PR #156358](https://github.com/python/cpython/pull/156358)) was explicitly rejected by core developer hugovk ("Let's not backport"). Users and distros building CPython 3.15 on riscv64 do not get the formal Tier 3 declaration even though the governance decision (steering-council#360) predates the 3.15 release; the marking first appears in 3.16.

**Blocker 3 - No riscv64 entry in the experimental JIT's target list.** `Tools/jit/_targets.py` has zero riscv64 handling. Enabling the copy-and-patch JIT on riscv64 would require new ELF relocation-type handlers (`R_RISCV_*`), a new unwind configuration, and RISC-V frame-pointer convention support - substantial new work with no open upstream issue or PR tracking it as of this research.

**Blocker 4 - mimalloc SV39 MMU alignment bug remains open upstream.** [microsoft/mimalloc#939](https://github.com/microsoft/mimalloc/issues/939) affects CPython 3.13+'s default allocator (including free-threaded builds) on common riscv64 hardware with SV39 MMUs. This is an external dependency blocker, not something fixable inside CPython.

**Blocker 5 - libffi struct-by-value ABI test failure remains open upstream.** [libffi#694](https://github.com/libffi/libffi/issues/694) ("`struct_by_value_big` fails on aarch64+riscv64") directly affects `ctypes` correctness and is outside CPython's control.

**Resolved/substantially mitigated objections:** the earlier single-point-of-failure hardware concern (one volunteer, one board) is materially improved - the Tier 3 approval is backed by four buildbots, with RISE funding the physical hardware. The earlier "no named Tier 3 sponsor" objection is resolved: the Steering Council formally approved Tier 3 with named core-developer sponsorship.

**Acceptance probability for further promotion:** RISE has publicly stated its next goal is promotion to Tier 2 ([riseproject.dev, 2026-08-24](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)), which under PEP 11 requires at least 2 core-dev sponsors plus a reliable buildbot with release-blocking status - a materially higher bar than Tier 3's "no SLA" model. Given the active RISE investment in hardware and the existing 4-buildbot fleet, Tier 2 promotion appears organizationally plausible but is not yet proposed or scheduled in any source reviewed.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro

**Justification:** CPython's own CI infrastructure (buildbot.python.org, not GitHub Actions) builds and tests riscv64 reliably: the Steering Council's Tier 3 approval ([python/steering-council#360](https://github.com/python/steering-council/issues/360), closed 2026-08-22) cites "three stable Buildbots plus one semi-stable free-threading Buildbot," and StanFromIreland's 2026-08-23 closure of the 6-year-old hang ([python/cpython#85518](https://github.com/python/cpython/issues/85518)) states these tests "now pass cleanly on CPython's four RISC-V buildbots" - i.e. build=yes, test=yes. The implementing [PR #156277](https://github.com/python/cpython/pull/156277) (merged 2026-08-23) formally marks `riscv64-*-linux-gnu` as PEP 11 Tier 3 in `configure.ac`. However, CPython does not publish riscv64 binaries itself (python.org ships only source tarballs plus Windows/macOS installers for any architecture); the consumable riscv64 package comes from Debian sid and Ubuntu (release_provider = distro), with RISE's [riseproject-dev/python-versions](https://github.com/riseproject-dev/python-versions) also providing a third-party prebuilt-binary channel. Per the color model this is build=yes / test=yes / release=no, which maps to blue, not green. Python is a general-purpose language runtime, so the optimization-purpose modifier does not apply and no Optimization level is assigned.

**Pending work that could change the grade:**
- Open [cpython#121201](https://github.com/python/cpython/issues/121201) / [PR #121387](https://github.com/python/cpython/pull/121387): riscv64 has no Linux-perf JIT trampoline support (DWARF register fix written in 2024, stale since April 2026, blocked because no available riscv64 machine has working perf hardware counters for maintainer pablogsal to validate against).
- Open [cpython#103438](https://github.com/python/cpython/issues/103438): leftover `CTYPES_PASS_BY_REF_HACK` cleanup.
- RISE is actively funding buildbot/runner hardware and has stated the next goal is promotion to Tier 2 ([riseproject.dev, 2026-08-24](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)).
- Backport PR #156358 bringing the Tier 3 `configure.ac` marking to the 3.15 branch was explicitly rejected, so 3.15 ships without the formal marking even though 3.16 will have it.
- A path to green would require CPython (or a channel treated as sufficiently canonical) to actually publish riscv64 release binaries; given CPython's own release model ships no official Linux binaries for any architecture, this would most plausibly come via broader, more official recognition of a distro or RISE-backed binary channel rather than a change in CPython's own release practice.

## 14. Investment Analysis

Before sizing new work: RISE has already funded or executed the buildbot hardware behind the Tier 3 approval, the RISE RISC-V Runners infrastructure, the python-wheels/wheel_builder binary-wheel project, the python-versions prebuilt-CPython-binary project, the PyTorch riscv64 CI effort, and (per a discuss.python.org post) is actively hiring a dedicated Python packaging contractor for riscv64. None of the items below duplicate that funded work; they are the gaps that remain after it.

### 14.1 Functional Enablement

The interpreter builds, runs, and passes its test suite on riscv64 per the Tier 3 buildbot fleet. Standard library modules relying on libffi, OpenSSL, decimal, sqlite3 and most extension modules work, subject to the open upstream dependency bugs noted in Section 9 (libffi struct-by-value, mimalloc SV39 alignment). Remaining functional gaps:
- Perf JIT trampoline build failure on riscv64 (workaround disables the feature; real fix exists, blocked on validation hardware)
- `CTYPES_PASS_BY_REF_HACK` cleanup (cosmetic; workaround is already correct)
- 3.15-branch does not carry the formal Tier 3 `configure.ac` marking (rejected backport)

### 14.2 Performance Optimization

Three gaps relative to x86_64/aarch64:
1. **No JIT.** The copy-and-patch JIT has zero riscv64 entries in `Tools/jit/_targets.py`. Implementing a first-pass riscv64 JIT target requires new ELF relocation handling, DWARF unwind support, and stencil generation - no upstream work has started.
2. **No SIMD/RVV in hash and compression libraries.** zlib, zstd, lzma, and the HACL* hash library have no RVV paths; this affects throughput for cryptographic operations and compression.
3. **mimalloc SV39 MMU alignment.** Affects default-allocator performance/correctness on common riscv64 hardware; upstream fix pending at [microsoft/mimalloc#939](https://github.com/microsoft/mimalloc/issues/939).

### 14.3 CI/CD Infrastructure

Current state is materially sound for Tier 3: four buildbots (3 stable + 1 semi-stable free-threading) back the current status. The specific remaining infrastructure gap is a riscv64 machine with working Linux `perf` hardware performance counters, needed solely to unblock PR #121387's merge. RISE already operates `ubuntu-24.04-riscv` GitHub Actions runners for its own projects (python-wheels, python-versions); extending that runner class, or providing a perf-capable board to a CPython core developer, would be a comparatively low-cost unblock.

### 14.4 Ecosystem Enablement

The binary-wheel ecosystem gap is the larger remaining item relative to CPython-core work. RISE's wheel_builder/python-wheels already covers a substantial and growing package set; the outstanding work is per-package maintainer adoption (adding riscv64 to individual projects' CI via cibuildwheel, publishing to PyPI directly rather than relying solely on RISE's supplementary index) and continued investment in RVV-accelerated numerics (PyTorch ATen vectorization is explicitly not yet implemented for riscv64, per the open upstream PR noted in Section 10).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Provide/validate PR #121387 (perf JIT DWARF registers) on real perf hardware | 1 (if hardware available) | Requires a riscv64 machine with working Linux perf HPM counters | High |
| Functional | Cleanup `CTYPES_PASS_BY_REF_HACK` (issue #103438) | 1 | Open to any contributor | Low |
| Functional | Drive libffi#694/#466/#777 fixes upstream (struct-by-value, int promotion, static linking) | 2-4 | libffi maintainers, can be RISE-funded | Medium - directly affects ctypes correctness |
| Functional | Drive microsoft/mimalloc#939 (SV39 aligned-memory) to merge | 2-4 | mimalloc maintainers, RISE can sponsor | High for 3.13+ free-threaded deployments |
| Performance | Implement riscv64 target in `Tools/jit/_targets.py` | 20-40 (first pass) | Requires JIT subsystem expertise; no upstream work started | Medium - high payoff, large scope |
| Performance | RVV paths in OpenSSL for `_ssl`/`_hashlib` | 10-20 | OpenSSL community + hardware vendors | Medium |
| Performance | RVV vectorization in PyTorch ATen (adjacent ecosystem, not CPython-core) | 10-20+ | RISE/PyTorch upstream, PR open since Feb 2026 | Medium |
| CI/CD | Provide/identify a riscv64 machine with working Linux perf HPM counters for buildbot/maintainer use | 1-2 (setup) | RISE or hardware vendor | High - unblocks PR #121387 |
| CI/CD | Pursue Tier 2 promotion per RISE's stated goal (2 core-dev sponsors, release-blocking buildbot) | N/A | Steering Council approval required | Medium - RISE has stated intent |
| Ecosystem | Expand riscv64 wheel coverage for packages outside RISE's existing ~50-80 package set | Ongoing | RISE-funded contractor role already being recruited | High - anchors the practical user experience |

## 15. References

- [CPython repository](https://github.com/python/cpython)
- [PEP 11 - Supported Platforms](https://peps.python.org/pep-0011/)
- [python/steering-council#360 - PEP 11 Tier 3 proposal](https://github.com/python/steering-council/issues/360)
- [cpython#156244 - Update RISC-V's support tier in configure.ac](https://github.com/python/cpython/issues/156244)
- [cpython PR #156277 - Update configure for RISC-V support](https://github.com/python/cpython/pull/156277)
- [cpython PR #156358 - rejected 3.15 backport](https://github.com/python/cpython/pull/156358)
- [cpython#121201 - perf_jit_trampoline.c build failure on riscv64](https://github.com/python/cpython/issues/121201)
- [cpython PR #121387 - Support riscv64 architecture for Perf JIT](https://github.com/python/cpython/pull/121387)
- [cpython PR #121328 - Disable perf_trampoline on riscv64](https://github.com/python/cpython/pull/121328)
- [cpython PR #121336 - 3.13 backport of #121328](https://github.com/python/cpython/pull/121336)
- [cpython PR #120089 - Support Linux perf profile for RISC-V](https://github.com/python/cpython/pull/120089)
- [cpython#120400 - Linux perf profile can't see Python calls on RISC-V](https://github.com/python/cpython/issues/120400)
- [cpython#85518 - test_thousand/compileall hang on riscv64](https://github.com/python/cpython/issues/85518)
- [cpython#133304 - NaN roundtrip failure on RISC-V buildbot](https://github.com/python/cpython/issues/133304)
- [cpython PR #133328 - RISC-V NaN packing workaround](https://github.com/python/cpython/pull/133328)
- [cpython#115988 - missing ARM64/RISCV filter in lzma](https://github.com/python/cpython/issues/115988)
- [cpython PR #115989 - add FILTER_RISCV](https://github.com/python/cpython/pull/115989)
- [cpython#112779 - undefined reference to __atomic_exchange_1 on riscv64](https://github.com/python/cpython/issues/112779)
- [cpython PR #112819 - fix atomic-op detection](https://github.com/python/cpython/pull/112819)
- [cpython#112951 - mimalloc aligned memory warning on RISC-V](https://github.com/python/cpython/issues/112951)
- [cpython#103438 - CTYPES_PASS_BY_REF_HACK cleanup](https://github.com/python/cpython/issues/103438)
- [cpython PR #103439 - don't define CTYPES_PASS_BY_REF_HACK on aarch64/riscv64](https://github.com/python/cpython/pull/103439)
- [cpython#150919 - test_frame_pointer_unwind fails on riscv64](https://github.com/python/cpython/issues/150919)
- [cpython#151040 - test_c_stack_unwind fails on riscv64](https://github.com/python/cpython/issues/151040)
- [cpython PR #152370 - fix test_c_stack_unwind on riscv64](https://github.com/python/cpython/pull/152370)
- [cpython#157688 - test_linux_ext_suffix no assertions on riscv64](https://github.com/python/cpython/issues/157688)
- [cpython PR #157690 - fix test_linux_ext_suffix](https://github.com/python/cpython/pull/157690)
- [cpython PR #6655 - add triplets for mips-r6 and riscv](https://github.com/python/cpython/pull/6655)
- [cpython PR #6660 - 3.7 backport of triplets](https://github.com/python/cpython/pull/6660)
- [cpython#80880 - riscv multilib build support](https://github.com/python/cpython/issues/80880)
- [cpython#77251 - Add platform triplet for RISC-V](https://github.com/python/cpython/issues/77251)
- [blog.python.org - RISC-V is now officially supported by CPython](https://blog.python.org/2026/08/riscv-now-officially-supported/)
- [riseproject.dev - Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [riseproject.dev - Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [riseproject.dev - PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [InfoQ - CPython Officially Adds RISC-V Support As a Tier 3 Platform](https://www.infoq.com/news/2026/09/riscv-cpython/)
- [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels)
- [riseproject-dev/python-versions](https://github.com/riseproject-dev/python-versions)
- [RISE wheel_builder documentation](https://riseproject.gitlab.io/python/wheel_builder/)
- [gounthar/riscv64-python-wheels](https://github.com/gounthar/riscv64-python-wheels)
- [python-pillow/Pillow#9462 - riscv64 wheel for PyPI](https://github.com/python-pillow/Pillow/issues/9462)
- [RISC-V Wheels Dashboard](https://stanfromireland.github.io/riscv-wheels/)
- [conda-forge blog - Bringing RISC-V to conda-forge](https://conda-forge.org/blog/2026/09/15/riscv64/)
- [discuss.python.org - RISE is looking for a Python packaging contractor for riscv64](https://discuss.python.org/t/rise-is-looking-for-a-python-packaging-contractor-for-riscv64/66538)
- [Ubuntu packages - python3 (resolute/riscv64)](https://packages.ubuntu.com/resolute/riscv64/python3)
- [Arch Linux RISC-V core repository](https://archriscv.felixc.at/repo/core/)
- [libffi#466 - small ints not promoted to ffi_arg on riscv64](https://github.com/libffi/libffi/issues/466)
- [libffi#777 - linking libffi.a on riscv64 fails](https://github.com/libffi/libffi/issues/777)
- [libffi#694 - struct_by_value_big fails on aarch64+riscv64](https://github.com/libffi/libffi/issues/694)
- [openssl#28118 - riscv extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [openssl#30880 - flaky riscv64 CI test](https://github.com/openssl/openssl/issues/30880)
- [openssl#29453 - intrinsics vs inline asm](https://github.com/openssl/openssl/issues/29453)
- [openssl#28664 - SHA256 perf on RISC-V](https://github.com/openssl/openssl/issues/28664)
- [openssl#25334 - AES needs Zknd+Zkne simultaneously](https://github.com/openssl/openssl/issues/25334)
- [tukaani-project/xz#146 - TUKLIB_FAST_UNALIGNED_ACCESS for RISC-V](https://github.com/tukaani-project/xz/issues/146)
- [microsoft/mimalloc#939 - aligned memory on RISC-V SV39 MMU](https://github.com/microsoft/mimalloc/issues/939)
- [util-linux#1526 - compile util-linux for RISC-V](https://github.com/util-linux/util-linux/issues/1526)
- [RISC-V psABI frame pointer convention](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc#frame-pointer-convention)
- [CPython configure documentation](https://docs.python.org/3/using/configure.html)
- [Debian package tracker - python3.13 riscv64 sid](https://buildd.debian.org/status/package.php?p=python3.13&suite=sid)