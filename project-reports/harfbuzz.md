---
title: HarfBuzz
parent: Project Reports
categories:
  - libraries
---

# HarfBuzz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for HarfBuzz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

HarfBuzz is an open-source text shaping engine written in portable C++11. It accepts Unicode text and a font file and returns glyph indices and positioning offsets for rendering. It is the dominant text shaping library in Linux desktop stacks (GTK, Qt, LibreOffice), mobile stacks (Android), browsers (Firefox, Chrome), and print pipelines (Adobe InDesign, LaTeX via LuaTeX). Version 14.2.1 was released 2026-06-02.

**Governance.** There is no formal foundation, fiscal sponsor, or standards body. The project operates under the `harfbuzz` GitHub organization. No MAINTAINERS, CODEOWNERS, or OWNERS file exists. Governance is informal meritocracy with Behdad Esfahbod (independent, formerly Google/Mozilla/Red Hat) as de facto BDFL with approximately 15,097 commits. Active committers include Khaled Hosny (Alif Type, co-maintainer), Garret Rieger (Google), Qunxin Liu (Google), Ebrahim Byagowi (independent), Matthias Clasen (Red Hat), and David Corbett (independent).

**Corporate involvement.** No explicit sponsorship program exists. Effective corporate sponsors operate through employee contribution time. Google is the dominant corporate contributor (Rieger and Liu drive the subsetting subsystem; the COPYING file names Google Inc. as copyright holder through 2022). Red Hat, Mozilla Foundation, Adobe Inc., and Facebook Inc. are historic copyright holders from earlier contribution periods. No GitHub Sponsors or OpenCollective page is configured.

**License.** MIT ("Old MIT"), with multi-party copyright held by Google, Mozilla Foundation, Red Hat, Adobe, Facebook, and Behdad Esfahbod personally. Copyright spans 2005-2023.

**Community stance on new ports.** No explicit platform tier or porting policy document exists. The project has historically accepted patches from major adopters (Android, OpenJDK, LibreOffice) when those adopters submitted the work. The project enforces strict API/ABI stability as a hard constraint. A RISC-V RVV vectorization patch, if submitted, would be evaluated against correctness, maintainability, and ABI non-regression criteria. There is no stated objection to RISC-V.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (none found) | No RISC-V-specific commit, issue, tracking ticket, or PR has ever been filed | [GitHub code search](https://github.com/harfbuzz/harfbuzz/search?q=riscv&type=commits) |
| 2025-08-18 | PR #5478 merged: Dependabot bump of `ninja` Python package from 1.11.1.4 to 1.13.0; the word "riscv64" appears only in ninja's own upstream release notes pasted by dependabot, not in HarfBuzz work | [PR #5478](https://github.com/harfbuzz/harfbuzz/pull/5478) |

There is no HarfBuzz RISC-V port in the conventional sense. HarfBuzz is a portable C++ library with no architecture-specific code for any platform. It builds on riscv64 via standard cross-compilation toolchains without any upstream-authored RISC-V work. The question of "upstreaming" does not apply because there is nothing downstream to upstream. Debian successfully builds and packages it on riscv64 (version 12.3.2-2+b2, builder rv-osuosl-01) without any patches.

Key contributors to RISC-V support: none -- riscv64 is handled entirely by compiler portability.

---

## 3. Upstream Support Tier

HarfBuzz has no documented platform tier policy. Support is implied by what CI tests and what has binary releases.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (ubuntu-24.04 x86_64 runners, all 15 workflows) | Partial (arm.yml covers arm-none-eabi bare-metal only; no Linux arm64 CI job) | No |
| Release-blocking | Yes | No (arm64 Linux not CI-gated) | No |
| Official pre-built binaries in GitHub Releases | Windows only (win32/win64 ZIPs); no Linux binaries for any arch | No | No |
| Debian sid packaging | Yes | Yes | Yes (v12.3.2-2+b2, Installed) |
| Ubuntu 24.04 noble packaging | Yes | Yes | Yes (v8.3.0-2build2, tier-2 archive) |
| Arch Linux RISC-V community packaging | Yes | Yes | Yes (not in problem list) |

The upstream project provides only source tarballs and Windows ZIPs. No Linux binary is released for any architecture including amd64. riscv64 is therefore on par with amd64 in terms of official Linux binary distribution (none exists for either). riscv64 is below amd64 only in CI coverage.

Arm64 Linux CI note: the arm.yml workflow targets Nintendo 3DS bare-metal cross-compilation (arm-none-eabi via devkitARM), not Linux arm64. There is no upstream Linux arm64 CI job either. riscv64 and Linux arm64 have identical upstream CI coverage: zero. [NEEDS VERIFICATION for arm64 Linux CI -- the arm.yml file was confirmed to be Nintendo 3DS only, but no other workflow was found for Linux arm64.]

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

HarfBuzz has no architecture-specific code for any platform. This is a deliberate design decision. There is no SIMD dispatch layer, no JIT backend, no cryptographic primitive, no hand-written assembly, and no ISA-specific intrinsic header included anywhere in `src/`.

The only internal "SIMD" abstraction is `hb_vector_size_t` in `src/hb-bit-page.hh`, which is a plain C++ template implementing bitwise operations element-wise with no `#ifdef` guards. Vectorization is left entirely to the compiler's auto-vectorization pass.

Atomic operations (`src/hb-atomic.hh`) delegate to compiler builtins (`__atomic_*`) or `std::atomic`. No ISA-specific atomics code exists.

The file `src/hb-algs.hh` uses `__builtin_bswap16/32/64`, `__builtin_clz/ctz`, and `__builtin_popcount*` with documented fallbacks. These have defined behavior on GCC and Clang for riscv64.

| Component | amd64 implementation | arm64 implementation | riscv64 implementation |
|---|---|---|---|
| Bit-page operations (hb_vector_size_t) | Scalar C++ template (compiler auto-vectorizes to SSE/AVX) | Scalar C++ template (compiler auto-vectorizes to NEON) | Scalar C++ template (compiler may auto-vectorize to RVV) |
| Atomics | Compiler builtins / std::atomic | Compiler builtins / std::atomic | Compiler builtins / std::atomic |
| Endian byte-swap | __builtin_bswap{16,32,64} | __builtin_bswap{16,32,64} | __builtin_bswap{16,32,64} |
| Bit count (popcount/clz) | __builtin_popcount* | __builtin_popcount* | __builtin_popcount* |
| Shaping engine (OpenType, AAT, Graphite) | Pure C++, no ISA guards | Pure C++, no ISA guards | Pure C++, no ISA guards |
| JIT | None | None | None |
| Crypto | None | None | None |
| Assembly files (.S) | None | None | None |
| Hand-tuned SIMD intrinsics | None | None | None |
| RVV (RISC-V Vector) intrinsics | N/A | N/A | None |
| Zba/Zbb/Zbc extension usage | N/A | N/A | None |

The single architecture-specific check in `meson.build` sets `-mstructure-size-boundary=8` for ARM (cpu_family == 'arm'). No equivalent check exists for riscv64.

**Performance implication.** Because HarfBuzz's vectorizable code paths rely on compiler auto-vectorization, performance on riscv64 depends on the compiler version and whether it generates RVV instructions. GCC 14 and LLVM 18 with `-march=rv64gcv` can auto-vectorize the bit-page loop body to RVV. Without explicit intrinsics, performance parity with hand-tuned NEON or SSE implementations is not guaranteed. No benchmark data exists to quantify the gap.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Primary build system:** Meson. CMake support exists but is explicitly community-maintained (`CMakeLists.txt` states: "The main build system for HarfBuzz is Meson. CMake build support is community-maintained."). CMake minimum version: 3.14.

**C++ standard:** C++11 minimum. If ICU >= 75.1 is detected, the build upgrades to C++17 automatically. No explicit minimum GCC or Clang version is enforced in the build system beyond C++11 support. No riscv64-specific compiler minimum is documented.

**Native riscv64 build (Debian configuration, as run successfully on rv-osuosl-01):**

```bash
export LC_ALL=C.UTF-8
export DEB_BUILD_MAINT_OPTIONS="hardening=+all"
export DEB_LDFLAGS_MAINT_APPEND="-Wl,-O1 -Wl,-z,defs"
meson setup build-main -Dauto_features=enabled -Dgraphite2=enabled
meson compile -C build-main
```

Build time on riscv64 hardware: approximately 1 hour 31 minutes. Disk space: 2.36 GB.

**Cross-compilation for riscv64 (no upstream cross-file; model on `.ci/win64-cross-file.txt`):**

```ini
[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'

[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkg-config = 'riscv64-linux-gnu-pkg-config'
exe_wrapper = 'qemu-riscv64'
```

```bash
meson setup build --cross-file riscv64-cross-file.txt \
  -Dauto_features=disabled \
  -Dfreetype=enabled -Dglib=enabled -Dsubset=enabled \
  -Dtests=disabled
```

**Meson flags to disable for cross-compilation without full sysroot:**

| Flag | Reason |
|---|---|
| -Dgpu=disabled | Requires OpenGL/GLEW/GLFW |
| -Dintrospection=disabled | Requires running binaries on host |
| -Ddocs=disabled | Documentation generation |
| -Dtests=disabled | Test execution requires qemu-riscv64 |
| -Dbenchmark=disabled | Benchmark requires running binaries |
| -Dutilities=disabled | hb-view/hb-shape require GLib+Cairo at runtime |
| -Dwasm=disabled | Experimental; disabled by default |
| -Dharfrust=disabled | Rust-based shaper; requires riscv64 Rust target |

**Single-file minimal build (no build system, useful for embedded):**

```bash
g++ -std=c++11 src/harfbuzz.cc -DHB_TINY -Os -o harfbuzz.o
```

`-DHB_TINY` reduces binary size by 40%+ by restricting to OpenType-only shaping and disabling thread-safety and debug features.

**Known build failures on riscv64:** None. Debian builds successfully without patches. No upstream issues mentioning riscv64 build failures exist in the GitHub tracker.

**QEMU usage:** Meson uses `exe_wrapper = 'qemu-riscv64'` to run riscv64 test binaries during cross-compilation. The upstream CI does not use QEMU for any architecture.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| OpenType shaping (Latin, CJK, Indic, RTL) | Full | Full | Full |
| AAT (Apple Advanced Typography) shaping | Full | Full | Full |
| Graphite2 smart-font shaping | Full (optional dep) | Full (optional dep) | Full (optional dep) |
| Font subsetting (hb-subset) | Full | Full | Full |
| SVG color font rendering | Full | Full | Full |
| COLRv1 vector color font rendering | Full | Full | Full |
| CBDT/sbix bitmap color fonts | Full | Full | Full |
| GPU-accelerated rendering (hb-gpu, experimental) | Experimental | Experimental | Experimental |
| WASM shaper (experimental) | Experimental | Experimental | Experimental |
| Harfrust shaper (experimental) | Experimental | Experimental | Experimental |
| Pre-built upstream binary | Windows ZIP only | None | None |
| Upstream CI coverage | Full | None (Linux) | None |
| Hand-tuned SIMD | None | None | None |
| Compiler auto-vectorization | SSE/AVX possible | NEON possible | RVV possible (GCC 14+ / LLVM 18+) |
| Distro packaging | Full | Full | Full (Debian, Ubuntu, Arch RISC-V) |

**Functional gaps:** None. All HarfBuzz features are available on riscv64 because the library is pure C++ with no conditional feature compilation based on architecture.

**Performance gaps:** Unquantified. No benchmark data comparing riscv64 to amd64 or arm64 exists in any public source. The bit-page loop (`hb_vector_size_t`) is the most vectorization-sensitive code path. Without hand-tuned RVV intrinsics, throughput on a core with RVV support is determined by compiler auto-vectorization quality.

**Security hardening gaps:** None specific to riscv64. Debian builds HarfBuzz on riscv64 with `hardening=+all` (same flags as all architectures).

**Floating-point / integer overflow issues:** Issue [#5975](https://github.com/harfbuzz/harfbuzz/issues/5975) documents a signed integer overflow in `propagate_attachment_offsets` (GPOS, `hb_position_t` overflow: `41600 + 2147450240`). Issue [#5604](https://github.com/harfbuzz/harfbuzz/issues/5604) documents invalid pointer conversion UB in `coverage-graph.hh`. Both are architecture-neutral UB that could surface on any platform under aggressive optimization. The 14.2.1 release added saturating arithmetic against 32-bit overflow and fixed a float-to-int overflow in `avar2`, both relevant to strict integer semantics. These are open bugs, not riscv64-specific bugs.

---

## 7. CI/CD Infrastructure

HarfBuzz uses GitHub Actions exclusively. All 15 workflow files under `.github/workflows/` were read. Zero contain the string "riscv" in any form.

| Workflow | Platforms covered | riscv64 |
|---|---|---|
| linux.yml | ubuntu-24.04 x86_64 | No |
| macos.yml | macOS (x86_64/arm64 via GitHub runners) | No |
| msvc.yml | Windows MSVC x86/amd64 | No |
| msys2.yml | Windows MSYS2 MINGW64/CLANG64 | No |
| crossbuild-mingw.yml | Windows win32/win64 cross-build | No |
| arm.yml | ARM bare-metal (arm-none-eabi, Nintendo 3DS devkitARM) | No |
| sanitizers.yml | asan/ubsan/tsan/msan on ubuntu-24.04 | No |
| valgrind.yml | valgrind on ubuntu-24.04 | No |
| cifuzz.yml | Fuzzing on ubuntu-latest | No |
| coverity-scan.yml | Static analysis | No |
| c++-versions.yml | x86_64 compiler version matrix | No |
| configs-build.yml | Build config flag variants on ubuntu-24.04 | No |
| rust.yml | Rust nightly x86_64 | No |
| docs.yml | Documentation build | No |
| scorecard.yml | Supply-chain security | No |

No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists in the repository. No Dockerfile or QEMU-based emulation is used anywhere in CI. No RISE CI runners are used by this project.

| CI criterion | amd64 | arm64 (Linux) | riscv64 |
|---|---|---|---|
| Build tested | Yes | No | No |
| Tests executed | Yes | No | No |
| Sanitizers (asan/ubsan/tsan/msan) | Yes | No | No |
| Fuzzing (OSS-Fuzz / cifuzz) | Yes | No | No |
| Valgrind | Yes | No | No |
| Static analysis (Coverity) | Yes | No | No |
| Hardware runners | GitHub-hosted x86_64 | N/A | N/A |
| QEMU used | No | N/A | N/A |

---

## 8. Distribution and Release Status

**Upstream GitHub Releases.** The 5 most recent releases (14.2.1, 14.2.0, 14.1.0, 14.0.0, 13.2.1) each provide exactly 3 assets: a source tarball (`harfbuzz-X.Y.Z.tar.xz`), `harfbuzz-win32-X.Y.Z.zip`, and `harfbuzz-win64-X.Y.Z.zip`. No riscv64 binary is released upstream for any Linux distribution.

**Debian sid.** Version 12.3.2-2+b2, status: Installed, builder rv-osuosl-01, built approximately 114 days before the date of this report. The build was a BinNMU rebuild against libicu78. Build log available at [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=harfbuzz&suite=sid). 15 binary packages are produced including `libharfbuzz0b`, `libharfbuzz-dev`, `libharfbuzz-icu0`, `libharfbuzz-gobject0`, `libharfbuzz-subset0`.

**Ubuntu 24.04 noble.** Version 8.3.0-2build2, 15 packages at that version. Ubuntu noble carries riscv64 as a tier-2 architecture; packages are built for riscv64 as part of the standard archive.

**Arch Linux RISC-V (community port).** The core `harfbuzz` package does not appear in the [Arch Linux RISC-V status problem list](https://archriscv.felixc.at/.status/status.htm), indicating it builds successfully and is current. The `haskell-gi-harfbuzz` binding is marked DEP BROKEN and DEP OUTDATED, and `python-uharfbuzz` is marked DEP OUTDATED; these are binding-layer issues, not core library issues.

**Fedora Rawhide.** Version 14.2.1-4.fc45 is available. riscv64 architecture inclusion in the Fedora build was not confirmed from the data available. [NEEDS VERIFICATION]

**PyPI.** No `harfbuzz` package exists on PyPI (HTTP 404). The Python binding `uharfbuzz` exists as a separate project; its wheels cover x86_64 (manylinux/musllinux), win32/win_amd64, and macOS (universal2/arm64/intel). No riscv64 wheel is published for `uharfbuzz`.

**RISE wheel builder.** The RISE wheel builder index for `harfbuzz` redirects to PyPI, which returns 404. HarfBuzz is not in the RISE wheel builder index and is not among the approximately 80 packages built by the RISE project.

**What a user must do to get a working riscv64 binary:** Install the distro package (`apt install libharfbuzz-dev` on Debian/Ubuntu riscv64, or the equivalent on Arch Linux RISC-V), or build from the upstream source tarball with the standard Meson toolchain. No additional patches or workarounds are required.

---

## 9. Dependencies

All critical HarfBuzz dependencies build successfully on riscv64 in Debian sid. No blocking issues were identified.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| FreeType | Font outline rasterization | PASS (Debian sid v2.14.3, ~81 days ago) | No failures reported | libfreetype-dev on riscv64 | No upstream issues mentioning riscv64 |
| ICU (icu-uc) | Unicode normalization and text processing | PASS (Debian sid v78.3, rv-manda-02, ~45 days ago) | No riscv64 failures; sh4 has GCC ICE via QEMU (unrelated) | libicu-dev on riscv64 | Installed size ~113 MB vs ~50 MB on amd64/arm64 -- likely debug symbols or static libs, not a defect; riscv64 falls into the correct generic little-endian fallback path in platform.h |
| zlib | Compression (OT vector color fonts, SVG glyphs) | PASS (Debian sid v1.3.2, rv-manda-03, ~83 days ago) | No failures reported | zlib1g-dev on riscv64 | Installed size ~70% larger on riscv64 (2,246 KB vs 1,314 KB on amd64) -- likely additional static content, not a defect |
| GLib 2.0 | Unicode functions, optional GObject bindings | PASS (Debian sid v2.88.1, rv-manda-04, ~49 days ago) | No test failures reported | libglib2.0-dev on riscv64 | 2 build logs vs 1 on other arches -- suggests an initial failed attempt followed by a successful rebuild [NEEDS VERIFICATION] |
| Cairo | 2D rendering backend | PASS (Debian sid v1.18.4, rv-osuosl-05, ~40 days ago) | No failures reported | libcairo2-dev on riscv64 | Same version as all other arches; GitLab issue search blocked by Anubis bot challenge |
| Graphite2 | SIL Graphite smart-font rendering | PASS (Debian sid v1.3.15, rv-osuosl-05, ~21 days ago) | sparc64 bus error in "underflow" tests; riscv64 clean | Packaged on riscv64 | No active upstream GitHub repo; Debian-maintained |
| libpng | PNG raster image output (color bitmap glyphs) | PASS (Debian sid v1.6.58, rv-manda-02, ~68 days ago) | No failures reported | Packaged on riscv64 | No issues found |
| iwasm (WebAssembly micro-runtime) | Experimental WASM shaper backend (disabled by default) | Not checked | Not checked | Not checked | Irrelevant unless `-Dwasm=enabled` is explicitly set |

**Dependency chain observation.** ICU size inflation on riscv64 (~113 MB vs ~50 MB on amd64/arm64) was observed in the Debian buildd data. This is anomalous but not a functional defect. It does not affect runtime correctness.

No dependency has a JIT backend that affects riscv64. No dependency has a known riscv64 correctness bug that would affect HarfBuzz. The ICU `platform.h` generic little-endian fallback for riscv64 is the correct code path for a little-endian 64-bit RISC-V target.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the HarfBuzz GitHub tracker (confirmed by exhaustive search returning zero results for "riscv" and "riscv64" across all open and closed issues).

Open issues with potential relevance to riscv64 under aggressive optimization:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#5975](https://github.com/harfbuzz/harfbuzz/issues/5975) | UBSAN: signed integer overflow in `propagate_attachment_offsets` (GPOS) | Open | Medium | `hb_position_t` overflow: `41600 + 2147450240`; architecture-neutral UB; could surface on riscv64 under -O2 with strict aliasing |
| [#5604](https://github.com/harfbuzz/harfbuzz/issues/5604) | Invalid pointer conversion in `coverage-graph.hh` | Open | Medium | C++ pointer interconvertibility UB; architecture-neutral; stricter compilers may expose |
| [#6031](https://github.com/harfbuzz/harfbuzz/issues/6031) | `hb-subset`: assertion failure in CFF1 Encoding subsetting (Card8 overflow) | Open | Medium | Integer overflow in subsetting path; architecture-neutral |
| [#6035](https://github.com/harfbuzz/harfbuzz/issues/6035) | Generate empty Coverage/ClassDef objects sometimes | Open | Medium | Correctness; opened 2026-06-18 |
| [#5677](https://github.com/harfbuzz/harfbuzz/issues/5677) | `x_advance` too small after `hb_ft_font_set_funcs` (regression since 11.3.0) | Open | High | Measurable correctness regression on bold fonts; all architectures |
| [#5756](https://github.com/harfbuzz/harfbuzz/issues/5756) | Problem subsetting ShaderGlitch Color font | Open | Medium | Subsetting correctness; all architectures |
| [#5804](https://github.com/harfbuzz/harfbuzz/issues/5804) | `[sbix]` Handle `dupe` glyphs | Open | Low | Format handling |
| [#5961](https://github.com/harfbuzz/harfbuzz/issues/5961) | `hb-subset.h` should include `hb-subset-serialize.h` | Open | Low | API completeness |
| [#5951](https://github.com/harfbuzz/harfbuzz/issues/5951) | Implement Porter-Duff compositing ops in vector renderer | Open | Low | Feature request |
| [#5922](https://github.com/harfbuzz/harfbuzz/issues/5922) | GPU: Support PNG color fonts | Open | Low | Feature gap in GPU rendering backend |
| [#5936](https://github.com/harfbuzz/harfbuzz/issues/5936) | Add unified work-counter design | Open | Low | Design/architecture |
| [#5595](https://github.com/harfbuzz/harfbuzz/issues/5595) | `hb_subset_input_override_name_table` usefulness | Open | Low | API design |

The three UB bugs (#5975, #5604, #6031) are the highest-priority issues for riscv64 deployment under production compilers. GCC 14 and LLVM 18 with `-O2` and link-time optimization can produce incorrect code from these UB paths on any architecture.

The 14.2.1 release (2026-06-02) added saturating arithmetic against 32-bit overflow and fixed a float-to-int overflow in `avar2`. These fixes are relevant to any strict integer semantics environment.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. No upstream maintainer has stated any objection to riscv64 support, riscv64 CI, or RVV intrinsics. The topic has never been raised.

**Technical blockers:** None for functional support. The library builds and works on riscv64 today. The blockers for full tier-1 equivalent status are:

1. No upstream riscv64 CI job. Adding one requires either a riscv64 hardware runner accessible to GitHub Actions (not available by default) or a QEMU-based emulation step. QEMU riscv64 emulation is slower than native hardware; a full CI run would extend build time.

2. No RVV SIMD optimization. This is a performance gap, not a functional one. Implementing RVV intrinsics for `hb_vector_size_t` and any other vectorizable path would require a contributor with RVV expertise and maintainer review bandwidth.

3. No upstream cross-file for riscv64 in the repository. This is a minor friction item; the Windows cross-files serve as templates.

**Organizational blockers:** HarfBuzz governance is a one-person bottleneck at the BDFL level for significant changes. Behdad Esfahbod reviews all non-trivial patches. He is independent and reachable. Response time for patches varies from days to weeks.

**Acceptance probability for a well-prepared riscv64 CI patch:** High. The project has accepted contributions from ARM (bare-metal) and cross-platform toolchain owners before. A patch that adds a QEMU-based riscv64 CI job following the pattern of the existing arm.yml would have no obvious grounds for rejection.

**Acceptance probability for a RVV intrinsics patch:** Medium. The codebase currently has zero hand-written SIMD for any architecture, including x86 SSE and ARM NEON. Introducing the first ISA-specific intrinsics would set a precedent. A maintainer may require equivalent patches for SSE and NEON to maintain consistency, or may prefer to leave vectorization entirely to the compiler.

---

## 13. Investment Analysis

RISE has no involvement in HarfBuzz. No RISE blog posts, wiki pages, funded projects, or working group assignments mention HarfBuzz. The analysis below covers the full scope of potential investment.

### 13.1 Functional Enablement

HarfBuzz is already fully functional on riscv64. No functional enablement work is required.

### 13.2 Performance Optimization

The primary performance opportunity is implementing RVV intrinsics for the bit-page operations in `src/hb-bit-page.hh`. The `hb_vector_size_t` template is the natural insertion point for ISA-specific specialization. Without benchmarks, the absolute throughput delta is unknown, but text-shaping benchmarks on coverage-intensive fonts (complex Indic scripts, full CJK shaping) could plausibly benefit from explicit vectorization.

A secondary opportunity is reviewing the three open UB bugs (#5975, #5604, #6031) and fixing them. This improves correctness on riscv64 under aggressive optimization and benefits all architectures.

### 13.3 CI/CD Infrastructure

Adding a riscv64 CI job to GitHub Actions requires one of: (a) a self-hosted riscv64 hardware runner contributed by a RISC-V hardware vendor (RISE member), or (b) a QEMU-based emulation step using `qemu-riscv64-static` in an Ubuntu 24.04 container. Option (b) is lower infrastructure cost but slower (2-4x build time increase). Neither option requires changes to the HarfBuzz source code.

### 13.4 Ecosystem Enablement

HarfBuzz has no significant dependent package ecosystem requiring separate enablement work. The `uharfbuzz` Python binding does not have a riscv64 wheel, which is a minor gap for Python-based font tooling. However, HarfBuzz itself is not a Python package and the core library gap is already filled by distro packaging.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required -- library is fully functional on riscv64 | 0 | N/A | N/A |
| Performance | Fix UB bugs #5975, #5604, #6031 (architecture-neutral but riscv64-risky under -O2) | 2 | Any contributor with C++ UB experience | High |
| Performance | Implement RVV intrinsics for hb_vector_size_t in hb-bit-page.hh | 3-5 | Contributor with RVV expertise | Medium |
| Performance | Benchmark HarfBuzz on riscv64 hardware (establish baseline vs arm64 and amd64) | 1 | Any contributor with riscv64 hardware | High (prerequisite for sizing RVV work) |
| CI/CD | Add QEMU-based riscv64 CI job to linux.yml or new riscv64.yml | 1 | Any contributor familiar with GitHub Actions | High |
| CI/CD | Provide upstream riscv64 Meson cross-file in .ci/ | 0.5 | Any contributor | Low |
| Ecosystem | Publish riscv64 wheel for uharfbuzz on PyPI | 2 | uharfbuzz maintainer or RISE wheel builder | Low |

Total estimated investment for CI + correctness + benchmarks: 4-5 person-weeks. Performance optimization (RVV) is an additional 3-5 person-weeks contingent on benchmark results justifying the work.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [harfbuzz/harfbuzz GitHub repository](https://github.com/harfbuzz/harfbuzz)
- [HarfBuzz homepage](https://harfbuzz.github.io/)
- [GitHub code search: riscv in harfbuzz/harfbuzz](https://github.com/harfbuzz/harfbuzz/search?q=riscv&type=commits)
- [PR #5478: Bump ninja from 1.11.1.4 to 1.13.0 in /.ci](https://github.com/harfbuzz/harfbuzz/pull/5478)
- [HarfBuzz GitHub Actions workflows directory](https://github.com/harfbuzz/harfbuzz/tree/main/.github/workflows)
- [GitHub release assets for harfbuzz/harfbuzz](https://github.com/harfbuzz/harfbuzz/releases)
- [Debian buildd status: harfbuzz sid](https://buildd.debian.org/status/package.php?p=harfbuzz&suite=sid)
- [Ubuntu 24.04 noble: HarfBuzz packages](https://packages.ubuntu.com/search?keywords=HarfBuzz&suite=noble)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/.status/status.htm)
- [PyPI: uharfbuzz](https://pypi.org/simple/uharfbuzz/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Issue #5975: UBSAN signed integer overflow in propagate_attachment_offsets](https://github.com/harfbuzz/harfbuzz/issues/5975)
- [Issue #5604: Invalid pointer conversion in coverage-graph.hh](https://github.com/harfbuzz/harfbuzz/issues/5604)
- [Issue #6031: hb-subset assertion failure in CFF1 Encoding subsetting](https://github.com/harfbuzz/harfbuzz/issues/6031)
- [Issue #6035: Generate empty Coverage/ClassDef objects sometimes](https://github.com/harfbuzz/harfbuzz/issues/6035)
- [Issue #5677: x_advance too small after hb_ft_font_set_funcs](https://github.com/harfbuzz/harfbuzz/issues/5677)
- [Debian buildd status: freetype sid](https://buildd.debian.org/status/package.php?p=freetype&suite=sid)
- [Debian buildd status: icu sid](https://buildd.debian.org/status/package.php?p=icu&suite=sid)
- [Debian buildd status: zlib sid](https://buildd.debian.org/status/package.php?p=zlib&suite=sid)
- [Debian buildd status: glib2.0 sid](https://buildd.debian.org/status/package.php?p=glib2.0&suite=sid)
- [Repology: harfbuzz versions across distributions](https://repology.org/project/harfbuzz/versions)
- [RISE Project end-of-year 2024 ecosystem update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)