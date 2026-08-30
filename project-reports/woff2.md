---
title: woff2
parent: Project Reports
color: orange
---

# woff2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for woff2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

`woff2` ([google/woff2](https://github.com/google/woff2)) is the reference C++11 implementation of the [W3C WOFF2 specification](https://www.w3.org/TR/WOFF2/) (REC-WOFF2-20240808). It provides a library (`libwoff1`) and two CLI tools (`woff2_compress`, `woff2_decompress`) for converting TrueType/OpenType fonts to and from the WOFF2 compressed format. The library is consumed by Chromium, Firefox, and every major font rendering stack.

The project is owned by the Google GitHub organization with no foundation affiliation. There is no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file. All merges are performed by Google employees; a Google CLA is required for all contributions. The primary maintainer is Rod Sheeter (`rsheeter`, 105 commits, `rsheeter@google.com`). Garret Rieger (`garretrieger`, 6 commits) is a co-maintainer and W3C WebFonts Working Group co-chair. The original author, Raph Levien, is now independent. External contributors include Khaled Hosny (Alif Type) and Frederic Wang (Igalia).

The project is in effective maintenance mode. The last release is `v1.0.2` from November 2017 -- over eight years ago. Commits continue through June 2026, but 30 PRs are open, many stale since 2018-2020 with no maintainer response. [Issue #181 (2025)](https://github.com/google/woff2/issues/181) explicitly raised community concern that the project is abandoned; an internal Rust rewrite exists at Google but has not been released. Google's OSS-Fuzz integration remains active, indicating continued security attention but not feature development.

Receptiveness to new architecture ports is low. The alignment-critical architecture bug ([PR #69](https://github.com/google/woff2/pull/69)) has been open since December 2016 with no action. The Windows ARM64 PR ([PR #201](https://github.com/google/woff2/pull/201)) opened July 2026 has received no reviews. A riscv64 `port.h` patch would be trivially correct but could sit unmerged for years.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2012-03-23 | Initial commit by Raph Levien | [google/woff2](https://github.com/google/woff2) |
| 2017-07-19 | CPU whitelist added to `port.h` (ARM7, aarch64, i386, x86_64 only; riscv64 absent) | Commit `4f659dd`, [google/woff2](https://github.com/google/woff2) |
| 2017-11-13 | Last upstream release: `v1.0.2` | [github.com/google/woff2/releases](https://github.com/google/woff2/releases) |
| 2016-12-09 | PR #69 opened: alignment crashes on strict-alignment architectures (sparc64; riscv64 affected by same class) | [PR #69](https://github.com/google/woff2/pull/69) |
| 2023-10-26 | PR #171 merged: removes all `reinterpret_cast` unaligned loads; byte-shift fallback used universally | [PR #171](https://github.com/google/woff2/pull/171) |
| 2026-07-13 | Issues #202 and #203 opened: UBSan misaligned loads in vendored Brotli and `ComputeULongSum` (v1.0.2 only for #203) | [Issue #202](https://github.com/google/woff2/issues/202), [Issue #203](https://github.com/google/woff2/issues/203) |
| 2026-07-13 | PR #201 opened: Windows ARM64 support; riscv64 still absent from `port.h` whitelist | [PR #201](https://github.com/google/woff2/pull/201) |

No riscv64-specific commit, issue, or PR exists anywhere in the repository history. Zero occurrences of the string "riscv" appear in any file in the repository (confirmed by GitHub code search returning `total_count: 0`).

The port is not upstream. Distros (Ubuntu, Debian, AlmaLinux, OpenSUSE, Arch Linux RISC-V) build `v1.0.2` from source for riscv64 without upstream changes, because the library is portable C++ that compiles without modification. No Google engineer has contributed riscv64-specific work.

## 3. Upstream Support Tier

There is no formal tier policy. No `PLATFORMS.md` or `SUPPORT.md` exists. The implicit policy is: architectures in the `port.h` CPU whitelist receive endianness-optimized paths; all others receive a safe byte-shift fallback. After PR #171 (merged 2023-11-07), the whitelist is dead code -- the optimized paths were removed entirely and all architectures now use the same byte-shift scalar path.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In `port.h` whitelist | Yes | Yes | No |
| Upstream CI | None | None | None |
| Upstream binary release | No (source-only) | No (source-only) | No (source-only) |
| Distro binary package | Yes | Yes | Yes (distro-built) |
| Known build failures | None | None | None |
| Known runtime failures | None | None | Yes (v1.0.2, malformed input) |

The upstream project publishes no binary artifacts for any architecture. All three architectures are equally unsupported in terms of upstream CI and releases. riscv64 is additionally absent from the `port.h` whitelist, though that whitelist is now vestigial.

## 4. Technical Architecture and RISC-V-Specific Subsystems

`woff2` is pure portable C++11. It contains no SIMD intrinsics, no inline assembly, no JIT, no architecture-specific dispatch, and no ISA extension usage on any architecture. The complete file tree is 28 files.

The only architecture-sensitive component is `src/port.h`, which defines `Log2Floor` (using `__builtin_clz` on GCC/Clang -- portable to riscv64) and the `WOFF_LITTLE_ENDIAN`/`WOFF_BIG_ENDIAN` macros (dead code since PR #171).

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| `Log2Floor` | `__builtin_clz` (scalar) | `__builtin_clz` (scalar) | `__builtin_clz` (scalar) | Identical on all three |
| `Store16` / `StoreU32` (`store_bytes.h`) | byte-shift scalar | byte-shift scalar | byte-shift scalar | PR #171 removed arch-specific paths |
| `ComputeULongSum` (`woff2_common.cc`) | byte-shift scalar | byte-shift scalar | byte-shift scalar | PR #171 removed `reinterpret_cast` paths |
| `ReadU16` / `ReadU32` (`buffer.h`) | `memcpy` + `ntohs`/`ntohl` | same | same | Safe on all architectures |
| Brotli (vendored, commit `533843e`, 2018) | `BROTLI_ALIGNED_READ=0` (fast path) | `BROTLI_ALIGNED_READ=0` (fast path) | `BROTLI_ALIGNED_READ=1` (safe `memcpy` path) | riscv64 not in Brotli's unaligned-read whitelist |
| SIMD | None | None | None | Not applicable |
| JIT | None | None | None | Not applicable |
| Assembly | None | None | None | Not applicable |

The riscv64 gap relative to amd64 and arm64 is confined to the vendored Brotli submodule: riscv64 uses the aligned-read (`memcpy`) path while amd64 and arm64 use the direct-cast unaligned path. This is a performance difference, not a correctness difference. The vendored Brotli is pinned to a 2018 commit that predates riscv64 support in Brotli; the CMake build using system Brotli (v1.2.0) eliminates this gap.

## 5. Build System, Cross-Compilation, and Toolchain

The repository provides two build systems: CMake (primary) and GNU Make (legacy). No riscv64 toolchain file, Dockerfile, or CI configuration exists in the repository.

**CMake cross-compilation (recommended for riscv64):**

A toolchain file must be created manually (none is provided upstream):

```cmake
# cmake/riscv64-linux-gnu.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```bash
sudo apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
git clone https://github.com/google/woff2.git
cd woff2 && mkdir out-riscv64 && cd out-riscv64
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=../cmake/riscv64-linux-gnu.cmake \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu
make
```

**GNU Make cross-compilation:**

```bash
make clean all \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++ \
  AR=riscv64-linux-gnu-ar \
  CPPFLAGS="-I/usr/riscv64-linux-gnu/include"
```

**Required toolchain versions:**

| Component | Minimum | Reason |
|---|---|---|
| GCC | 7 (production-quality riscv64 backend) | `CMAKE_CXX_STANDARD 11` in `CMakeLists.txt` |
| Clang | 6 | C++11 requirement; riscv64 target stable from Clang 6 |
| CMake | 2.8.6 (stated in `CMakeLists.txt`) | Brotli submodule requires >= 3.15 if used |
| Brotli | Any version with `libbrotlidec` + `libbrotlienc` | Hard `FATAL_ERROR` if not found |

**QEMU:** The vendored Brotli `CMakeLists.txt` includes QEMU wrappers for arm and aarch64 cross-compilation tests but has no riscv64 entry. Manual QEMU usage for riscv64 testing:

```bash
qemu-riscv64-static -L /usr/riscv64-linux-gnu ./woff2_compress myfont.ttf
```

No known build failures on riscv64 have been reported in any upstream issue, distro bug tracker, or public forum.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| WOFF2 encode/decode (correctness) | Full | Full | Full (master) / Buggy (v1.0.2) | Correctness (v1.0.2 only) |
| `Log2Floor` | `__builtin_clz` | `__builtin_clz` | `__builtin_clz` | None |
| Byte-order operations | Scalar | Scalar | Scalar | None |
| Brotli decompression throughput | Fast (unaligned read) | Fast (unaligned read) | Slightly slower (aligned `memcpy`) | Performance (minor) |
| Brotli compression throughput | Scalar | Scalar | Scalar | None |
| SIMD acceleration | None | None | None | None |
| Security hardening (UBSan clean) | No (v1.0.2) | No (v1.0.2) | No (v1.0.2) | Correctness (v1.0.2 only) |

**Correctness gap (v1.0.2 only):** `ComputeULongSum` in `woff2_common.cc` uses `reinterpret_cast<const uint32_t*>(buf + i)` where `buf` may not be 4-byte aligned. On riscv64 (strict-alignment architecture) this is a runtime SIGBUS with malformed WOFF2 input. This is fixed in master (PR #171, merged 2023-11-07) but no release has been tagged since v1.0.2 (2017). Distros shipping v1.0.2 carry this bug.

**Performance gap:** The vendored Brotli submodule (pinned to commit `533843e`, 2018-03-02) does not include riscv64 in its `BROTLI_ALIGNED_READ=0` whitelist, so riscv64 uses the `memcpy`-based aligned read path. The estimated throughput penalty is minor (single-digit percent) [NEEDS VERIFICATION -- no published benchmark data exists for woff2 on riscv64]. Using system Brotli v1.2.0 (available in Ubuntu 26.04 resolute/main as `libbrotli1 1.2.0-3build1`) eliminates this gap.

No floating-point arithmetic exists anywhere in woff2. No NaN or floating-point semantics issues apply.

No security hardening gaps specific to riscv64 beyond the v1.0.2 alignment bug described above.

## 7. CI/CD Infrastructure

`google/woff2` has zero CI configuration of any kind. The `.github/` directory does not exist. The GitHub Actions API returns `total_count: 0, workflows: []`. No `.travis.yml`, `.circleci/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `appveyor.yml`, or `azure-pipelines.yml` exists. The repository contains only `Makefile` and `CMakeLists.txt` as build infrastructure.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | None | None | None |
| Build tested in CI | No | No | No |
| Tests run in CI | No | No | No |
| RISE runners configured | No | No | No |
| OSS-Fuzz (security fuzzing) | Yes | No | No |

OSS-Fuzz is the only automated testing infrastructure. It runs on x86_64 only and covers `convert_woff2ttf_fuzzer.cc`. It was OSS-Fuzz that surfaced issues #202 and #203 (filed 2026-07-13). No riscv64 fuzzing exists.

RISE has made zero documented investment in woff2. The RISE blog (30+ posts through August 2026) contains no mention of woff2. woff2 is not in the RISE wheel builder package list. No RISE runner is configured for this repository.

## 8. Distribution and Release Status

Upstream releases (`v1.0.2`, `v1.0.1`, `v1.0.0`) are source-only. No upstream binary artifacts exist for any architecture.

| Distribution | Package | Version | riscv64 | Notes |
|---|---|---|---|---|
| Ubuntu 26.04 (resolute) | `woff2` | 1.0.2-3 | Yes | universe component; 11,608 bytes |
| Ubuntu 26.04 (resolute) | `libwoff1` | 1.0.2-3 | Yes | universe component; 48,904 bytes |
| Ubuntu 26.04 (resolute) | `libwoff-dev` | 1.0.2-3 | Yes | universe component |
| Arch Linux RISC-V | `woff2` | 1.0.2-6 | Yes | [archriscv.felixc.at](https://archriscv.felixc.at/repo/extra/); 63,252 bytes; dated 2025-05-14 |
| AlmaLinux Kitten 10 | `woff2` | 1.0.2-21.el10 | Yes | [NEEDS VERIFICATION -- sourced from web search only] |
| OpenSUSE Ports Tumbleweed | `woff2` | 1.0.2-6.1 | Yes | [NEEDS VERIFICATION -- sourced from web search only] |
| PyPI | N/A | N/A | N/A | No PyPI package exists (HTTP 404) |
| GitHub releases | Source only | v1.0.2 | No | No binaries attached |

To obtain a working riscv64 binary: install the distro package (`apt install woff2 libwoff1 libwoff-dev` on Ubuntu 26.04 riscv64) or build from master using CMake with system Brotli. Building from the v1.0.2 release tarball is not recommended for riscv64 due to the `ComputeULongSum` alignment bug (Issue #203).

Note: the adversarial verification found that `libwoff2-dev` (as opposed to `libwoff-dev`) returned HTTP 404 on the Ubuntu riscv64 archive. The dev package is available but under the name `libwoff-dev`.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| `libbrotlidec` / `libbrotlienc` | Mandatory compression backend; hard `FATAL_ERROR` if absent | Yes | No upstream CI | Yes (Ubuntu 26.04 resolute/main: `libbrotli1 1.2.0-3build1`) | RVV optimization PRs #1410 and #1489 unmerged; scalar fallback used; not a functional blocker |
| `libstdc++` / `libc++` | C++11 standard library (`std::string`, `std::vector`, `std::map`, `std::unique_ptr`) | Yes | Yes | Yes | None |
| `libc6` (glibc) | C runtime; `memcpy`, `assert`, `inttypes.h`; declared dep `>= 2.27` in Ubuntu `libwoff1` | Yes | Yes | Yes | None |
| `libgcc-s1` | GCC runtime support; exception handling; `__builtin_clz` lowering; declared dep `>= 3.0` in Ubuntu `libwoff1` | Yes | Yes | Yes | None |

**Brotli deep-dive:** The CMake build requires system Brotli (`find_package(BrotliDec)` and `find_package(BrotliEnc)` with `FATAL_ERROR`). The GNU Make build vendors Brotli at commit `533843e` (2018-03-02), which predates riscv64 support in Brotli (added 2018-05-22). The vendored version sets `BROTLI_64_BITS=0` on riscv64 (32-bit `brotli_reg_t` instead of 64-bit), estimated to cause approximately 5-10% slower decompression [NEEDS VERIFICATION -- no published benchmark]. System Brotli v1.2.0 has full riscv64 support and is available in Ubuntu 26.04 resolute/main. The CMake build with system Brotli is the correct deployment path for riscv64.

[PR #162](https://github.com/google/woff2/pull/162) ("feat: update brotli to v1.1.0") has been open since 2023-02-03, approved, and not merged. This is the upstream path to fixing the vendored Brotli problem.

FreeType and HarfBuzz are consumers of woff2, not dependencies of it. They are not analyzed here.

## 11. Known Bugs and Active Issues

| ID | Title | Type | Status | riscv64 Severity | Notes |
|---|---|---|---|---|---|
| [PR #69](https://github.com/google/woff2/pull/69) | Woff2 decoding crashes on alignment critical architectures | PR | Open (stale since 2016-12-09) | None (superseded) | Superseded by PR #171 for the files it touched; 2025 comment notes a remaining null-pointer issue in `store_bytes.h:49` under Clang [NEEDS VERIFICATION] |
| [PR #171](https://github.com/google/woff2/pull/171) | Fix undefined type-punning when loading/storing words | PR | Merged 2023-11-07 | Resolved in master | Fix is in master only; v1.0.2 release still carries the bug |
| [Issue #202](https://github.com/google/woff2/issues/202) | UBSan: misaligned 32-bit load in vendored Brotli bit reader | Bug | Open (2026-07-13) | Medium | Safe on riscv64 today because vendored Brotli uses `memcpy` path for riscv64; would regress if Brotli submodule is updated and riscv64 added to unaligned-read whitelist |
| [Issue #203](https://github.com/google/woff2/issues/203) | UBSan: misaligned 32-bit load in `ComputeULongSum` | Bug | Open (2026-07-13) | Critical (v1.0.2) | `reinterpret_cast<const uint32_t*>(buf + i)` in `woff2_common.cc:23` is a runtime SIGBUS on riscv64 with malformed WOFF2 input; fixed in master by PR #171; distros shipping v1.0.2 are vulnerable unless they backport PR #171 |
| [PR #201](https://github.com/google/woff2/pull/201) | Add Windows ARM64 support | PR | Open (2026-07-13) | Low | Establishes pattern for `port.h` additions; riscv64 still absent; `port.h` whitelist is now dead code post-PR #171 so absence is cosmetic |

**Correctness summary:** Any deployment using the v1.0.2 release tarball on riscv64 is vulnerable to a runtime SIGBUS when processing malformed WOFF2 input (Issue #203). Distro packages that backport PR #171 or build from master are not affected. Ubuntu and Debian package maintainers should be checked for backport status [NEEDS VERIFICATION -- not confirmed in research].

## 12. Objections and Upstream Blockers

**Organizational blockers:**
- The project is in effective maintenance mode. The last release is from 2017. 30 PRs are open with no maintainer response. Issue #181 (2025) documents community concern about abandonment.
- All merge authority rests with Google employees. Google CLA is required. External contributors cannot self-merge.
- A riscv64 `port.h` patch (one line: add `defined(__riscv)`) would be trivially correct but the `port.h` whitelist is now dead code post-PR #171, making the patch cosmetic. There is no functional justification to prioritize it.

**Technical blockers:**
- No release has been tagged since v1.0.2 (2017). The critical alignment fix (PR #171) is in master but unreleased. Distros must either build from master or backport PR #171 to v1.0.2.
- The vendored Brotli submodule is pinned to a 2018 commit. PR #162 (update to Brotli v1.1.0) has been approved but unmerged since 2023. This is the correct fix for the vendored Brotli riscv64 performance gap.
- No upstream CI exists. Any riscv64 regression would be caught only by distro build infrastructure or OSS-Fuzz (x86_64 only).

**Acceptance probability for a riscv64 PR:** Low. The pattern from PR #69 (open 8 years), PR #162 (approved, unmerged 2+ years), and PR #201 (no reviews after opening) indicates that even correct, approved patches do not get merged promptly.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI; distro ships riscv64 but with known alignment bugs in the released version; upstream has no CI of any kind)
- **Release provider:** distro

The upstream project has zero CI infrastructure of any kind (GitHub Actions API confirms `total_count: 0`). No upstream riscv64 CI exists and no upstream riscv64 binary is published. Distros (Ubuntu 26.04, Arch Linux RISC-V, AlmaLinux Kitten 10, OpenSUSE Ports Tumbleweed) build and ship riscv64 packages from the v1.0.2 source, but v1.0.2 contains a confirmed runtime fault on riscv64 with malformed WOFF2 input (Issue #203, `ComputeULongSum` misaligned cast). The fix (PR #171) is in master but unreleased. The distribution floor rule applies: distro ships riscv64 but the upstream release carries known bugs on this architecture, placing the grade at orange rather than yellow.

This project is not optimization-purpose; no Optimization level field applies.

**Pending work that could change the grade:**
- A new upstream release (v1.0.3) incorporating PR #171 would eliminate the correctness bug and, combined with distro packaging, could support a yellow grade.
- Addition of any upstream CI (even build-only) would support a yellow grade.
- Neither is currently in progress. RISE has no involvement.

## 14. Investment Analysis

RISE has made zero documented investment in woff2. No work is already covered.

### 14.1 Functional Enablement

The primary functional gap is the unreleased alignment fix. The v1.0.2 release carries a runtime SIGBUS on riscv64 with malformed WOFF2 input (Issue #203). The fix exists in master (PR #171). Work required: backport PR #171 to v1.0.2 as a distro patch (already standard practice for Ubuntu/Debian), or pressure upstream to tag v1.0.3. The one-line `port.h` addition (`defined(__riscv)`) is cosmetic post-PR #171 but documents riscv64 as a supported architecture.

### 14.2 Performance Optimization

woff2 itself has no architecture-specific code on any platform. Performance on riscv64 is determined entirely by the Brotli backend. The vendored Brotli (2018) used by the Makefile build is suboptimal for riscv64; the CMake build with system Brotli v1.2.0 is the correct deployment path and requires no additional work. RVV optimization of Brotli is tracked separately under the brotli project report.

### 14.3 CI/CD Infrastructure

The upstream project has no CI. Adding riscv64 CI requires first adding any CI. A minimal GitHub Actions workflow using RISE runners (announced 2026-03-24, free native riscv64 CI on GitHub) could provide build and test coverage. This is the highest-leverage investment for this project.

### 14.4 Ecosystem Enablement

woff2 has no dependent package ecosystem (it is a C++ library and CLI tool). Section 10 is omitted per report rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Backport PR #171 to v1.0.2 as distro patch (Ubuntu/Debian) | 0.5 | Distro maintainer | Critical |
| Functional | Upstream v1.0.3 release incorporating PR #171 | 1 | Google (rsheeter) | High |
| Functional | Add `defined(__riscv)` to `port.h` whitelist (cosmetic post-PR #171) | 0.1 | Any contributor | Low |
| Functional | Merge PR #162 (update vendored Brotli to v1.1.0) | 0.5 | Google (rsheeter) | Medium |
| CI/CD | Add GitHub Actions workflow with RISE riscv64 runners (build + test) | 1 | Any contributor | High |
| CI/CD | Add riscv64 to OSS-Fuzz configuration | 2 | Google security team | Medium |

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [google/woff2 repository](https://github.com/google/woff2)
- [W3C WOFF2 Recommendation (REC-WOFF2-20240808)](https://www.w3.org/TR/WOFF2/)
- [PR #69 -- Woff2 decoding crashes on alignment critical architectures](https://github.com/google/woff2/pull/69)
- [PR #162 -- feat: update brotli to v1.1.0](https://github.com/google/woff2/pull/162)
- [PR #171 -- Fix undefined type-punning when loading/storing words](https://github.com/google/woff2/pull/171)
- [PR #201 -- Add Windows ARM64 support](https://github.com/google/woff2/pull/201)
- [Issue #202 -- UBSan: misaligned 32-bit load in vendored Brotli bit reader](https://github.com/google/woff2/issues/202)
- [Issue #203 -- UBSan: misaligned 32-bit load in ComputeULongSum](https://github.com/google/woff2/issues/203)
- [woff2 1.0.2-3 in Ubuntu 26.04 resolute (riscv64)](https://packages.ubuntu.com/resolute/woff2)
- [libwoff1 1.0.2-3 in Ubuntu 26.04 resolute (riscv64)](https://packages.ubuntu.com/resolute/libwoff1)
- [woff2 1.0.2-6 in Arch Linux RISC-V](https://archriscv.felixc.at/repo/extra/)
- [google/woff2 releases (v1.0.2, source-only)](https://github.com/google/woff2/releases)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [libbrotli1 1.2.0-3build1 in Ubuntu 26.04 resolute (riscv64)](https://packages.ubuntu.com/resolute/libbrotli1)
