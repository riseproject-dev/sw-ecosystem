---
title: libvorbis
categories:
  - multimedia
---

# libvorbis

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libvorbis<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libvorbis is the reference implementation of the Vorbis audio codec, a lossy audio compression format defined by the [Vorbis I specification](https://xiph.org/vorbis/doc/Vorbis_I_spec.html). It provides encoding, decoding, and file-access APIs. The library is pure portable C (97.6% C per GitHub language stats) with no architecture-specific SIMD backends except a legacy x86 float-to-integer conversion path in `lib/os.h`.

**Governance:** The [Xiph.Org Foundation](https://xiph.org/) is a nonprofit corporation. Governance is community-run with no formal corporate membership tiers, no MAINTAINERS file, and no CODEOWNERS file in the repository. The primary named authority is "Monty" (monty@xiph.org). Active contributors (tmatth, petterreinholdtsen, and occasional others) have no disclosed corporate affiliations. The AUTHORS file credits only "Monty and the rest of the Xiph.org Foundation."

**License:** BSD 3-clause.

**RISE membership:** Xiph.Org Foundation is not a RISE project member. No RISE blog posts or sponsored projects covering libvorbis were found.

**Community culture on new ports:** The project has no formal platform tier policy or support matrix. The implicit stance is "any platform supported by a C compiler is supported." Maintainer bandwidth is low: the only open RISC-V PR (#127, opened 2026-06-19) has received zero review comments from any maintainer.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2020 | libvorbis builds on riscv64 via generic scalar C fallback; no upstream code change required | Inferred from absence of any riscv64-specific commit in repo history |
| 2020-07-04 | Last upstream release: v1.3.7 | [GitHub release](https://github.com/xiph/vorbis/releases/tag/v1.3.7) |
| 2026-06-19 | PR #127 opened: "Avoid leaking x86_64 SSE2 paths into forced RISC-V probes" | [PR #127](https://github.com/xiph/vorbis/pull/127) |

There is no RISC-V-specific port history in the conventional sense. The library has always compiled on riscv64 via the existing scalar fallback -- no dedicated enablement work was required or performed. PR #127 is the first explicit acknowledgment of riscv64 in the upstream repository.

**Key contributor:** carlosqwqqwq (external, no disclosed employer affiliation). No other contributor has touched riscv64-related code.

**Fully upstream:** The portability fix in PR #127 is not yet merged. The scalar fallback itself has always been upstream. There is no out-of-tree riscv64 patch set.

---

## 3. Upstream Support Tier

libvorbis has no formal tier policy. There is no CI matrix, no official binary distribution for any architecture, and no release-blocking test suite that targets specific architectures. Architecture support is implicit: if the C compiler works, the library works.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists upstream | Yes (.gitlab-ci.yml) | No | No |
| Release-blocking tests | 2/2 ctest on amd64 only | No | No |
| Official prebuilt binary | No (source tarballs only) | No | No |
| Architecture-specific code | Yes (x87 asm + SSE2 intrinsics) | No (scalar C) | No (scalar C) |
| Cross-compilation CI | Windows (mingw32) only | No | No |

riscv64 is at the same implicit support level as arm64: the library builds and runs correctly but is not explicitly tested in any upstream CI job.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libvorbis implements Vorbis audio decoding and encoding. The DSP-critical components are: MDCT (Modified Discrete Cosine Transform) in `lib/mdct.c`, FFT (small float FFT) in `lib/smallft.c`, LPC/LSP analysis in `lib/lpc.c` and `lib/lsp.c`, floor curve synthesis in `lib/floor1.c`, and residue decode in `lib/res0.c`. There is no SIMD dispatch infrastructure for any of these.

The only architecture-specific code in the entire codebase is the `vorbis_ftoi` float-to-integer conversion in `lib/os.h`:

| Implementation | Trigger condition | Method |
|---|---|---|
| x86 GCC i386 | `__i386__` | x87 inline assembly (`fnstcw`, `fldcw`, `fistl`) |
| x86 MSVC 32-bit | `_MSC_VER` + `_M_IX86` | `__asm { fld f; fistp i }` |
| x86-64 SSE2 | `__x86_64__` + `__SSE2_MATH__` + `!__riscv` (after PR #127) | `<emmintrin.h>`, `_mm_cvtsd_si32` |
| All others (riscv64, arm64, ppc64le, ...) | fallthrough | `(int)floor(f+.5)` in C |

**Component-level RISC-V status:**

| Component | File(s) | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Float-to-int conversion | `lib/os.h` | x87 asm + SSE2 intrinsics | scalar C | scalar C |
| MDCT | `lib/mdct.c` | scalar C | scalar C | scalar C |
| FFT (smallft) | `lib/smallft.c` | scalar C | scalar C | scalar C |
| LPC/LSP | `lib/lpc.c`, `lib/lsp.c` | scalar C | scalar C | scalar C |
| Floor synthesis | `lib/floor1.c` | scalar C | scalar C | scalar C |
| Residue decode | `lib/res0.c` | scalar C | scalar C | scalar C |

No RVV (RISC-V Vector) intrinsics exist anywhere in the source tree. No `.S` assembly files exist for any architecture (non-x86 platforms). No `arch/riscv/` or similar subdirectory exists. There are zero `#ifdef __riscv` guards in the codebase except what PR #127 proposes to add to the SSE2 guard condition.

The performance gap relative to x86 is structural: x86 gets hand-tuned x87 asm and SSE2 for `vorbis_ftoi`; riscv64 uses the scalar C fallback. For the MDCT and FFT -- the compute-dominant operations -- all architectures including amd64 use the same scalar C implementation. Compiler auto-vectorization with RVV (GCC `-march=rv64gcv`) is the only available mechanism for closing any performance gap, and it is untested upstream.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Autotools (primary build path):**

```sh
./autogen.sh
./configure --host=riscv64-linux-gnu
make -j$(nproc)
```

No riscv64-specific configure options exist. The `configure.ac` has architecture-matched CFLAGS for x86, PowerPC, SPARC, Darwin, IRIX, and Solaris. riscv64 falls through to the generic Linux case: `-O3 -Wall -Wextra -ffast-math -D_REENTRANT -fsigned-char`. There are no `-march=rv64gc`, `-mabi=lp64d`, or any other RISC-V-specific flags in `configure.ac`.

**CMake (secondary build path):**

```sh
cmake -G Ninja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_TOOLCHAIN_FILE=<riscv64-toolchain.cmake> \
  ..
ninja
```

No riscv64-specific CMake options exist. The only CMake boolean flags are `BUILD_SHARED_LIBS` (default ON) and `BUILD_FRAMEWORK` (Apple only).

**Required toolchain:** No explicit minimum compiler version is stated in the build system for any architecture. [NEEDS VERIFICATION] GCC 13+ is inferred as the minimum from Debian sid packaging (libvorbis 1.3.7-3+b2 builds with the Debian `gcc-riscv64-linux-gnu` cross toolchain, which is GCC 13+ as of 2024). Clang is also supported per `.gitlab-ci.yml`.

**QEMU:** No QEMU references exist in any upstream CI configuration (`.travis.yml`, `.gitlab-ci.yml`, `appveyor.yml`). No upstream riscv64 emulated testing is configured.

**Known build failures:** None documented. The Debian buildd (`rv-osuosl-01`) successfully built 1.3.7-3+b2 for riscv64. PR #127 author cross-compiled with `riscv64-linux-gnu-gcc` and confirmed both ctest targets passed and produced ELF binaries with `Machine: RISC-V`.

**Dockerfiles:** No Dockerfiles exist in the repository. The `.gitlab-ci.yml` uses the `gcc:14` Docker Hub image for all Linux CI jobs.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Vorbis decoding (correctness) | Complete | Complete | Complete | None |
| Vorbis encoding (correctness) | Complete | Complete | Complete | None |
| `vorbis_ftoi` conversion | x87 asm + SSE2 | Scalar C | Scalar C | Performance (minor) |
| MDCT throughput | Scalar C (compiler auto-vec possible) | Scalar C | Scalar C | Performance (RVV opportunity) |
| FFT throughput | Scalar C | Scalar C | Scalar C | Performance (RVV opportunity) |
| Floating-point semantics | IEEE 754 via SSE2 on x86-64 | IEEE 754 | IEEE 754 | None |
| Security hardening (stack protector, ASLR) | Depends on distro build flags | Depends on distro build flags | Depends on distro build flags | None specific to riscv64 |

**Functional gaps:** None. The library is functionally complete on riscv64.

**Performance gaps:** The `vorbis_ftoi` scalar path adds a function-call overhead compared to a single SSE2 instruction on x86-64, but this is a minor operation invoked during floor curve synthesis, not in the inner MDCT/FFT loop. The dominant performance opportunity is RVV-accelerated MDCT and FFT, which are not optimized for any architecture including amd64 in the current upstream codebase.

**Floating-point correctness:** Issue #118 (open) identifies a ~7 ULP discrepancy between the runtime-generated `floor1_inverse_dB_table` values and the values in the Vorbis spec. This is not architecture-specific and affects all platforms equally. No resolution has been merged.

**NaN / floating-point semantics:** No riscv64-specific floating-point anomalies were found. The library uses `-ffast-math` by default, which assumes no NaN/Inf inputs. This is the same assumption on all architectures.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists upstream, confirmed by reading the actual CI configuration files.

| File | Status | riscv64 job |
|---|---|---|
| `.github/workflows/` | Directory does not exist (HTTP 404) | N/A |
| [`.gitlab-ci.yml`](https://github.com/xiph/vorbis/blob/master/.gitlab-ci.yml) | Exists; jobs: autotools-gcc, autotools-gcc-builddir, autotools-clang, autotools-mingw, cmake | None |
| [`.travis.yml`](https://github.com/xiph/vorbis/blob/master/.travis.yml) | Exists; tests Linux + macOS with gcc/clang | None |
| [`appveyor.yml`](https://github.com/xiph/vorbis/blob/master/appveyor.yml) | Exists; Windows only (Win32, MSVC/CMake) | None |

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI job | Yes (gitlab-ci, travis) | No | No |
| QEMU-based emulation | No | No | No |
| RISE-provided runner | No | No | No |
| Downstream distro buildd | Debian, Ubuntu, Arch | Debian, Ubuntu | Debian sid (rv-osuosl-01), Ubuntu 24.04 |

RISE has no involvement with libvorbis CI infrastructure. No RISE-sponsored riscv64 CI job exists for xiph/vorbis.

---

## 8. Distribution and Release Status

**Upstream releases:** xiph/vorbis ships source tarballs only. The last release is v1.3.7 (2020-07-04). Assets: `libvorbis-1.3.7.tar.gz`, `libvorbis-1.3.7.tar.xz`, `libvorbis-1.3.7.zip`. No prebuilt binaries for any architecture are distributed by upstream.

**Debian sid:** libvorbis 1.3.7-3+b2, status "Installed" for riscv64, built on buildd host `rv-osuosl-01`. All binary packages (libvorbis0a, libvorbisenc2, libvorbisfile3, libvorbis-dev) are present. Source: [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=libvorbis&suite=sid).

**Ubuntu 24.04 Noble:** libvorbis0a v1.3.7-1build3 listed for architectures: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x. All four binary packages (libvorbis0a, libvorbisenc2, libvorbisfile3, libvorbis-dev) support riscv64. Source: [Ubuntu packages](https://packages.ubuntu.com/noble/libvorbis0a).

**Arch Linux RISC-V:** Direct confirmation from [archriscv.felixc.at](https://archriscv.felixc.at/) was not obtainable due to page content limitations during research. [NEEDS VERIFICATION]

**AUR / Android cross-compilation:** An `android-riscv64-libvorbis` package exists in the AUR as a cross-compilation target for Android on RISC-V. [NEEDS VERIFICATION - single source]

**PyPI:** libvorbis does not exist on PyPI. Not applicable (C library, not a Python package).

**What a user must do to get a working riscv64 binary:** On Debian sid or Ubuntu 24.04, `apt install libvorbis-dev` installs a riscv64 binary package with no additional steps required. On other distributions, build from the 1.3.7 source tarball using a standard cross-compilation toolchain.

---

## 9. Dependencies

libvorbis has a minimal dependency tree: one required runtime library (libogg) and the system math library (libm via glibc). No JIT backends, crypto libraries, compression libraries, or memory allocators are required.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| libogg (xiph/ogg) | Container/framing layer; required at link and runtime | Passing -- Debian sid 1.3.6-2+b1 "Installed" on rv-manda-01; Alpine edge 1.3.6-r0 available | No riscv64-specific CI upstream; main CI (GitHub Actions) passes | Shipping in Debian sid, Ubuntu, Alpine edge | None |
| libm / glibc | Math functions (`floor`, `cos`, and related DSP operations) | Passing -- Debian sid glibc 2.42-17 "Installed" on rv-osuosl-05 | riscv64 math tests pass in Debian buildd; no test-float64 failures reported | Shipping in all major distros | None; see `reports/glibc.md` |
| pthreads (optional) | Optional threading support via `AC_CHECK_LIB(pthread)` | Part of glibc; fully supported on riscv64 | Not exercised at the library level by vorbis | Shipping everywhere | None |

**libogg:** Pure bitstream framing library with no SIMD, no JIT, and no architecture-specific assembly. Not in this project's scope table but a clean riscv64 port with no known issues.

**glibc:** In scope with an existing status report. The `floor()` and `cos()` math functions used by the Vorbis DSP are available and correct on riscv64 in Debian sid.

**No SIMD gap from dependencies:** Unlike opus, aom, or libjpeg-turbo, libvorbis has no SIMD in its own source tree and no dependency on a SIMD-dispatching library (e.g., highway, simde). The riscv64 performance baseline is set entirely by compiler auto-vectorization of the C source, with no upstream-controlled SIMD to port.

---

## 10. (Omitted)

libvorbis is a C library with no dependent package ecosystem (no PyPI packages, no npm packages, no Maven JARs) that would require separate riscv64 enablement.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #127](https://github.com/xiph/vorbis/pull/127) | Avoid leaking x86_64 SSE2 paths into forced RISC-V probes | Open, 0 reviews | Low (build hygiene) | Portability fix for cross-compilation smoke builds; does not affect runtime behavior; correctness confirmed by author |
| [Issue #124](https://github.com/xiph/vorbis/issues/124) | Floating-Point Exception (Division by Zero) in res2_inverse and _01inverse during Ogg Vorbis decoding | Open | High (correctness) | SIGFPE triggered by crafted .ogg with malformed codebook data; `classwords` can be zero at res0.c:817 and res0.c:661; proposed guard not yet merged; not riscv64-specific |
| [Issue #118](https://github.com/xiph/vorbis/issues/118) | How floor1_inverse_dB_table is calculated? | Open | Low (precision) | ~7 ULP discrepancy between generated and spec dB table values; not architecture-specific; no resolution |
| [Issue #102](https://github.com/xiph/vorbis/issues/102) | Merging aoTuV encoder improvements | Open | Medium (quality) | Request to merge aoTuV encoder (better rate/quality tradeoff per HydrogenAudio); open since 2023-11-01 with no activity; not riscv64-specific |

**Correctness bugs:**

Issue #124 is the most significant open correctness issue: a SIGFPE triggered by malformed codebook data affects any platform including riscv64. The proposed fix is a one-line guard (`if (classwords == 0) return -1;`) that has not been merged. This is a denial-of-service vector for any decoder processing untrusted Vorbis streams.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None documented. No maintainer has commented on PR #127 or any riscv64-related item.

**Technical blockers:**

None blocking correctness. The library compiles and runs on riscv64 today. The only technical gap is performance -- no RVV-accelerated MDCT/FFT -- and this is not a blocker for functional use.

**Organizational blockers:**

- Maintainer bandwidth is demonstrably low. PR #127 has been open since 2026-06-19 with zero review activity from the xiph organization. The last upstream release was in 2020.
- There is no corporate sponsor. Any RISC-V optimization work submitted as a PR will wait in a queue behind other unreviewed contributions.
- The project has no formal architecture support tier, no CI infrastructure for riscv64, and no roadmap.

**Acceptance probability for an RVV optimization PR:**

A well-written RVV MDCT/FFT patch would likely be accepted eventually, given the project's "any platform a C compiler supports" stance and the precedent of the existing x86 optimizations. However, review latency is unpredictable and could be months to years given the maintenance velocity observed. A contributor should be prepared to shepherd the PR actively.

---

## 13. Investment Analysis

RISE has no existing involvement with libvorbis. No RISE-funded work has been identified in this area. All items below represent new work.

### 13.1 Functional Enablement

The library is already functionally complete on riscv64. PR #127 is the only open functional item and it is a hygiene fix for cross-compilation smoke tests, not a runtime correctness issue.

The one actionable functional item is fixing Issue #124 (SIGFPE on malformed codebook data). This is not riscv64-specific but affects all platforms equally and has no open fix. A one-line patch is proposed in the issue body. Effort: 0.25 person-weeks to write, test, and submit the fix; upstream review latency is the primary variable.

### 13.2 Performance Optimization

The primary optimization opportunity is RVV-accelerated MDCT and FFT. Neither is optimized for any architecture in the current codebase -- amd64 and arm64 also use scalar C for these operations. An RVV port would represent a net improvement over all existing platforms.

Scope of the MDCT/FFT:
- `lib/mdct.c`: butterfly-based MDCT using a precomputed twiddle table, approximately 300 lines of C
- `lib/smallft.c`: small float FFT, approximately 500 lines of C

Both are straightforward candidates for RVV intrinsic acceleration using RISC-V Vector 1.0 (ratified March 2022). The `vorbis_ftoi` scalar path in `lib/os.h` is a lower-priority target.

No benchmark data comparing riscv64 vs arm64 or x86-64 exists in any publicly accessible source. [Data not available: Phoronix blocks automated access; no openbenchmarking.org results for libvorbis on RISC-V hardware were found; RISE blog contains no libvorbis performance data.]

### 13.3 CI/CD Infrastructure

Zero upstream riscv64 CI exists. Adding a riscv64 job to `.gitlab-ci.yml` using QEMU emulation (via `qemu-user-static` in the `gcc:14` container) would be the minimum viable change. A hardware runner (SiFive, StarFive, or similar) would be preferable for performance testing.

### 13.4 Ecosystem Enablement

Not applicable. libvorbis has no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Merge PR #127 (SSE2 guard fix for cross-compilation) | 0.1 (shepherd only) | Upstream contributor | Low |
| Functional | Fix Issue #124 (SIGFPE on malformed codebook data) | 0.25 | Any contributor | High |
| Performance | RVV-accelerated MDCT (`lib/mdct.c`) | 3-4 | RISC-V specialist | Medium |
| Performance | RVV-accelerated FFT (`lib/smallft.c`) | 2-3 | RISC-V specialist | Medium |
| Performance | Benchmark riscv64 vs arm64/amd64 on real hardware | 0.5 | QA / benchmarking | Medium |
| CI/CD | Add riscv64 QEMU job to `.gitlab-ci.yml` | 0.5 | DevOps | Medium |
| CI/CD | Add riscv64 hardware runner (optional) | 1 | Infrastructure | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [xiph/vorbis GitHub repository](https://github.com/xiph/vorbis)
- [libvorbis 1.3.7 release (2020-07-04)](https://github.com/xiph/vorbis/releases/tag/v1.3.7)
- [PR #127: Avoid leaking x86_64 SSE2 paths into forced RISC-V probes](https://github.com/xiph/vorbis/pull/127)
- [Issue #124: SIGFPE in res2_inverse and _01inverse on malformed Ogg Vorbis](https://github.com/xiph/vorbis/issues/124)
- [Issue #118: floor1_inverse_dB_table floating-point precision discrepancy](https://github.com/xiph/vorbis/issues/118)
- [Issue #102: Request to merge aoTuV encoder improvements](https://github.com/xiph/vorbis/issues/102)
- [lib/os.h in xiph/vorbis (architecture-specific float-to-int conversion)](https://github.com/xiph/vorbis/blob/master/lib/os.h)
- [.gitlab-ci.yml in xiph/vorbis](https://github.com/xiph/vorbis/blob/master/.gitlab-ci.yml)
- [Debian buildd status for libvorbis (sid, riscv64)](https://buildd.debian.org/status/package.php?p=libvorbis&suite=sid)
- [Ubuntu 24.04 package listing for libvorbis0a](https://packages.ubuntu.com/noble/libvorbis0a)
- [Xiph.Org Foundation homepage](https://xiph.org/)
- [RISE Project blog](https://riseproject.dev/blog)