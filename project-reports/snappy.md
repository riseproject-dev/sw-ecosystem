---
title: snappy
parent: Project Reports
categories:
  - libraries
---

# snappy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for snappy
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Snappy is a fast byte-oriented compression/decompression library written in C++11, developed and maintained by Google. It does not aim for maximum compression ratio; it targets high throughput on commodity CPUs. The upstream README states target speeds of 250 MB/s or more for compression and 500 MB/s or more for decompression on a single core.

**Governance:** The project is a Google-owned open-source repository at [github.com/google/snappy](https://github.com/google/snappy). There is no foundation affiliation (not Apache, CNCF, or any other foundation). Development occurs internally in Google's Piper monorepo and is mirrored to GitHub; commits carry `PiperOrigin-RevId` tags. External contributions are accepted via GitHub PRs with a Google CLA requirement.

**Primary maintainer:** `danilak-G` (Danila Kutenin, Google affiliation inferred from PiperOrigin-RevId commit pattern; 39 merged commits). He is the sole reviewer and merger for external contributions.

**Top historical contributors by commit count:** `pwnall` (Victor Costan, Google, 105 commits), `danilak-G` (39 commits), `sesse` (Steinar H. Gunderson, external, 19 commits).

**License:** BSD-type (COPYING file in repo).

**Official supported architectures per CONTRIBUTING.md:** x86, x86-64, ARMv7, AArch64. RISC-V is explicitly absent from this list. The CONTRIBUTING.md states: "Changes adding features or dependencies outside of the core area of focus listed above might not be accepted."

**Community stance on RISC-V:** Despite the formal exclusion from scope, `danilak-G` has merged five RISC-V PRs since July 2025 and the repository contains a dedicated `riscv64-qemu-test.yaml` CI workflow, indicating de-facto acceptance. A note by `danilak-G` on PR #212 described the project as "mostly in maintenance mode," explaining the slow review cadence (PR #220 sat unreviewed for five months). Active RISC-V contributors are predominantly affiliated with Chinese industry and research organizations: Sanechips/ZTE (`wanghan-sanechips`, `zhanchangbao-sanechips`), Alibaba (`yunfeizhou2025`), and one unaffiliated contributor (`anthony-zy`) who has driven the majority of optimization work.

**RISE Project involvement:** Google is a Premier Member of RISE. ZTE and ISCAS (Institute of Computing Technology, Chinese Academy of Sciences) are General Members. However, no RISE-funded workstream, blog post, RFP, or wheel-builder entry exists for snappy. The RISE public blog (39 posts through June 2026) contains zero mentions of snappy. RISE has no involvement in this project.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the main branch. No out-of-tree fork or vendor tree exists.

| Date | Event | Source |
|---|---|---|
| Jul 1, 2025 | PR #208 opened: benchmark submodule crash on riscv64 (Linux 6.6+ blocks `rdcycle`), fix updates submodule to use `rdtime` | [PR #208](https://github.com/google/snappy/pull/208) |
| Jul 29, 2025 | PR #208 merged by danilak-G | [PR #208](https://github.com/google/snappy/pull/208) |
| Aug 28, 2025 | PR #212 opened: RVV `MemCopy64` claiming +49.5% decompression; maintainer notes "mostly in maintenance mode" | [PR #212](https://github.com/google/snappy/pull/212) |
| Sep 12, 2025 | PR #212 closed by author (no merge timeline offered by maintainer) | [PR #212](https://github.com/google/snappy/pull/212) |
| Oct 2025 | Commit `cbea40d`: `danilak-G` fixes unused-variable compiler warning on riscv64 in `snappy.cc` | [commit cbea40d](https://github.com/google/snappy/commit/cbea40d) |
| Nov 10, 2025 | PR #214 opened: gate `__builtin_ctzll` behind Zbb to prevent 10% compression regression | [PR #214](https://github.com/google/snappy/pull/214) |
| Nov 20, 2025 | PR #214 merged: first functional RISC-V optimization in tree | [PR #214](https://github.com/google/snappy/pull/214) |
| Dec 12, 2025 | PRs #216-#219 opened and closed same day (duplicate CLA-unsigned attempts for 64-bit FindMatchLength guard) | [PR #216](https://github.com/google/snappy/pull/216), [#217](https://github.com/google/snappy/pull/217), [#218](https://github.com/google/snappy/pull/218), [#219](https://github.com/google/snappy/pull/219) |
| Dec 12, 2025 | PR #220 opened: `__riscv_xlen == 64` guard on FindMatchLength fast path | [PR #220](https://github.com/google/snappy/pull/220) |
| Apr 15, 2026 | PR #232 opened: align RISC-V with AArch64 branchless mask extraction (~1% decompression gain) | [PR #232](https://github.com/google/snappy/pull/232) |
| Apr 16, 2026 | PR #233 opened: RVV vectorized `FindMatchLength` (+3.3% ZFlat avg on SpacemiT X60) | [PR #233](https://github.com/google/snappy/pull/233) |
| Apr 17, 2026 | PR #234 opened: branchless `AdvanceToNextTagRVOptimized` via Zicond (+13.7% decompression) | [PR #234](https://github.com/google/snappy/pull/234) |
| Apr 17, 2026 | PR #235 opened: RVV short-memcpy mirrors AVX fixed 32-byte path (+15% decompression) | [PR #235](https://github.com/google/snappy/pull/235) |
| Apr 28, 2026 | PR #236 opened: `AdvanceToNextTagRISCVOptimized` (duplicate of #234) | [PR #236](https://github.com/google/snappy/pull/236) |
| May 7, 2026 | PR #239 opened: RVV `FindMatchLengthPlain` (maintainer rejected as AI-generated copy) | [PR #239](https://github.com/google/snappy/pull/239) |
| May 9, 2026 | PRs #220, #232, #234, #236, #239, #240 all acted on by danilak-G: #220, #232, #234 merged; #236, #239, #240 closed as duplicates or AI-generated | [PR #220](https://github.com/google/snappy/pull/220), [#232](https://github.com/google/snappy/pull/232), [#234](https://github.com/google/snappy/pull/234) |
| May 14, 2026 | PR #235 updated with macro-style fix requested by danilak-G; awaiting final approval | [PR #235](https://github.com/google/snappy/pull/235) |

**Key contributors and affiliations:**

| Contributor | Affiliation | Contributions |
|---|---|---|
| wanghan-sanechips | Sanechips/ZTE (inferred from username) | PR #208 (benchmark submodule fix) |
| anthony-zy | Unknown | PRs #214, #232, #234, #235 (bulk of optimization work) |
| yunfeizhou2025 | Alibaba | PRs #216-#220 (FindMatchLength 64-bit guard) |
| zhanchangbao-sanechips | Sanechips/ZTE | PRs #233, #236, #239, #240 |
| danilak-G | Google | Maintainer; commit cbea40d (warning fix) |

**All merged work is fully upstream.** The latest release is v1.2.2 (March 26, 2025). All five merged RISC-V patches (PRs #208, #214, #220, #232, #234) landed after that tag and have not shipped in any tagged release.

---

## 3. Upstream Support Tier

There is no formal tier policy document in snappy. The CONTRIBUTING.md defines the scope of accepted changes as x86, x86-64, ARMv7, and AArch64. RISC-V is not listed. Despite this, the maintainer has merged RISC-V optimizations and the repository carries a dedicated RISC-V CI workflow.

**De-facto tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in CONTRIBUTING.md scope | Yes | Yes | No |
| CI on every push/PR | Yes (build.yml) | Yes (build.yml) | Yes (riscv64-qemu-test.yaml) |
| Native runner | Yes | Yes (macOS) | No (QEMU emulation) |
| RVV/vector CI coverage | Yes (AVX2) | Implicit (NEON) | No (no `-march=rv64gcv` in CI) |
| Official binary releases | No (source-only upstream) | No | No |
| Distro binary packages | Yes | Yes | Yes (Debian, Ubuntu, Arch) |
| Optimization PRs merged | Yes | Yes | Yes (5 PRs since Jul 2025) |
| Blocking release | Unknown | Unknown | No (no tagged release since optimizations landed) |

**Conclusion:** RISC-V is an unofficial but actively maintained third platform. It has CI coverage and merged optimizations but lacks formal scope recognition, native runners, and any shipped tagged release containing the RISC-V work.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Snappy has no JIT compiler, no garbage collector, and no cryptographic primitives. Architecture-specific work is confined to: (1) hash-function acceleration using hardware CRC32, (2) vector shuffle operations in the decompression loop, (3) vectorized memory copy in `MemCopy64`, (4) branchless tag advancement in `AdvanceToNextTag`, (5) 64-bit word-size `FindMatchLength`, (6) packed-constant offset extraction in `ExtractOffset`, and (7) count-trailing-zeros for match length computation.

All architecture-specific code is in `snappy.cc` and `snappy-internal.h` as inline C++ with preprocessor guards. There are no `.S` assembly files, no `arch/riscv/` directory, and no JIT backend.

**Per-component comparison:**

| Component | amd64 | arm64 | riscv64 | riscv64 ISA needed |
|---|---|---|---|---|
| Hash (CRC32) | SSE4.2 `_mm_crc32_u32` - hardware | ARM `__crc32cw` - hardware | Multiplicative scalar fallback | Zbc (`clmul`) - not implemented |
| Vector shuffle (V128) | SSSE3 `_mm_shuffle_epi8` - full | NEON `vqtbl1q_u8` - full | Missing entirely (no `vrgather` path) | RVV `vrgather` - not implemented |
| MemCopy64 | AVX fixed 32-byte load/store | memmove (scalar) | RVV `e8m2` loop (merged PR #234 area, originally PR #212 scope); fixed 32-byte path in open PR #235 | RVV 1.0 |
| FindMatchLength | 64-bit LE word loop + inline `cmovzq` asm | 64-bit LE word loop (no asm) | 64-bit LE word loop (merged PR #220); RVV vectorized loop in open PR #233 | Base RV64I; RVV (open) |
| AdvanceToNextTag | ~40 lines with inline GCC asm and `cmovzq` | ~22 lines, csinc-friendly C | ~22 lines, Zicond-friendly C (merged PR #234) | Zicond (`czero.eqz`/`czero.nez`) |
| ExtractOffset | Dedicated x86 Load32+shift path | Shared mask-trick path with riscv64 | Shared path with AArch64 (merged PR #232) | Base RV64I |
| ctzll / FindLSBSetNonZero64 | `__builtin_ctzll` unconditional | `__builtin_ctzll` unconditional | `__builtin_ctzll` only if Zbb (PR #214); portable bit-loop otherwise | Zbb (`ctz`) |

**Quality ratings:**

- **CRC32 hash:** riscv64 uses a multiplicative constant fallback (`kMagic * bytes`). Zbc provides `clmul`/`crc32` instructions. No RISC-V PR for this component exists or is planned. **Missing.**
- **V128 shuffle:** Used in the decompression fast path for byte rearrangement. SSSE3 and NEON paths are both present. No `vrgather`-based RVV path exists or is in progress. **Missing.**
- **MemCopy64:** The merged RVV path is a variable-length loop using `VSETVL_E8M2`/`VLE8_V_U8M2`/`VSE8_V_U8M2`. PR #235 (open) would replace it with a fixed 32-byte two-segment path mirroring AVX. Current merged code is functional. **Intrinsics, partial** (AVX-mirrored path open).
- **FindMatchLength:** The 64-bit word-comparison path is enabled for riscv64 (PR #220). A vectorized RVV loop using `vmsne`/`vfirst` is in PR #233 (open, +3-14% on compressible data). **Scalar 64-bit, partial** (RVV open).
- **AdvanceToNextTag:** Merged branchless implementation relies on the compiler to emit Zicond instructions from conditional-zero-friendly C code. Benchmarks show +13.7% decompression on SpacemiT X60. Not hand-tuned assembly. **C intrinsics-level, functional.**
- **ExtractOffset:** Shares the AArch64 mask-trick path after PR #232. Not architecture-specific asm. **Shared C, functional.**
- **ctzll:** Gated behind Zbb. Without Zbb, the library falls back to a portable bit-loop. This is a correct behavior but a performance penalty on pre-Zbb hardware. **Conditional, functional with Zbb.**

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** cmake >= 3.10, C++11.

**cmake options relevant to riscv64:**

| Option | Default | riscv64 action |
|---|---|---|
| `SNAPPY_REQUIRE_AVX` | OFF | Leave OFF (x86 only) |
| `SNAPPY_REQUIRE_AVX2` | OFF | Leave OFF (x86 only) |
| `SNAPPY_BUILD_TESTS` | ON | Functional on riscv64 |
| `SNAPPY_BUILD_BENCHMARKS` | ON | Functional on riscv64 (after PR #208) |
| `BUILD_SHARED_LIBS` | OFF | No riscv64-specific concern |

**Feature detection at cmake configure time:**

1. `SNAPPY_RVV_1`: probes `__riscv_vsetvl_e8m1` and `__riscv_vmv_v_x_u8m1` from `<riscv_vector.h>`. Set when the compiler supports RVV 1.0 intrinsics (GCC >= 14 or Clang >= 17 with `-march=rv64gcv`). [NEEDS VERIFICATION on exact minimum compiler version]
2. `SNAPPY_RVV_0_7`: fallback probe using unprefixed intrinsics (`vsetvl_e8m1`, `vmv_v_x_u8m1`) for older toolchains with RVV 0.7.1 support.
3. `HAVE_BUILTIN_CTZ`: on RISC-V, this probe requires `__riscv_zbb` to be defined; otherwise the check fails and the portable fallback is used. This means the `-march` flag must include `_zbb` to unlock `__builtin_ctzll`.

**Cross-compilation procedure (from official CI):**

```bash
# Download and install toolchain
wget https://github.com/riscv-collab/riscv-gnu-toolchain/releases/download/2025.07.03/riscv64-glibc-ubuntu-24.04-gcc-nightly-2025.07.03-nightly.tar.xz -O riscv-toolchain.tar.xz
sudo tar -xvf riscv-toolchain.tar.xz -C /opt/riscv --strip-components=1
# Fix hardcoded libdir path in libatomic.la
sudo sed -i "s|libdir='/mnt/riscv/riscv64-unknown-linux-gnu/lib'|libdir='/opt/riscv/riscv64-unknown-linux-gnu/lib'|g" \
  /opt/riscv/riscv64-unknown-linux-gnu/lib/libatomic.la

export PATH=/opt/riscv/bin:$PATH
export LD_LIBRARY_PATH=/opt/riscv/lib:$LD_LIBRARY_PATH
export QEMU_LD_PREFIX=/opt/riscv/sysroot

mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ../
make -j$(nproc)
make test
./snappy_benchmark
```

**Toolchain:** The official CI uses the riscv-collab/riscv-gnu-toolchain GCC nightly (2025.07.03 release, `riscv64-glibc-ubuntu-24.04`). No minimum version is enforced by CMakeLists.txt. RVV 1.0 intrinsics require GCC >= 14 or Clang >= 17.

**QEMU:** `qemu-user` and `qemu-user-static` provide transparent user-mode emulation via binfmt_misc. Tests run via `make test` with no special invocation; QEMU intercepts riscv64 binary execution automatically once `QEMU_LD_PREFIX` is set.

**Known issue in CI cmake invocation:** The workflow sets `PATH` to include `/opt/riscv/bin` but does not pass `-DCMAKE_C_COMPILER=riscv64-unknown-linux-gnu-gcc` to cmake. cmake's default compiler detection on an Ubuntu x86-64 runner will find the host `cc`, not the cross-compiler, unless the cross-compiler provides a `cc` symlink or cmake is told explicitly. This is a potential latent bug in the CI workflow. [NEEDS VERIFICATION - actual CI run logs not available]

**RVV build:** The CI cmake invocation has no explicit `-march=rv64gcv`. Without this flag, `SNAPPY_RVV_1` will not be set and RVV code paths will not be compiled. The CI effectively tests the base scalar/Zicond path only. PR #233 and PR #235 RVV optimizations are not exercised by the existing CI. [NEEDS VERIFICATION against actual cmake configure output from CI runs]

**To enable RVV and Zbb:**

```bash
cmake -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_C_COMPILER=riscv64-unknown-linux-gnu-gcc \
      -DCMAKE_CXX_COMPILER=riscv64-unknown-linux-gnu-g++ \
      -DCMAKE_C_FLAGS="-march=rv64gcv_zbb_zicond" \
      -DCMAKE_CXX_FLAGS="-march=rv64gcv_zbb_zicond" \
      ../
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (cannot do X at all):**

| Feature | amd64 | arm64 | riscv64 | Impact |
|---|---|---|---|---|
| Hardware CRC32 hash | Yes (SSE4.2) | Yes (ARMv8 CRC) | No | Hash quality and speed; no correctness impact |
| V128 byte shuffle in decompressor | Yes (SSSE3) | Yes (NEON) | No | Decompression fast path unavailable |
| RVV vectorized FindMatchLength | Yes (scalar fast path + AVX gains) | Yes (scalar fast path) | Open PR #233 | Compression throughput gap |
| RVV fixed-size MemCopy64 | Yes (AVX) | No (memmove) | Open PR #235 | Decompression throughput gap |

**Performance gaps (delta from missing SIMD):**

- Without Zbb: compression speed approximately 10% lower than Zbb-equipped riscv64 (PR #214 data: 42.5 MB/s vs 47.4 MB/s non-Zbb baseline).
- Decompression on current main (post PR #234): 265 MB/s on SpacemiT X60. PR #235 open would bring this to 310 MB/s (+15%).
- Compression (ZFlat) on SpacemiT X60 after PR #234: no aggregate number available. PR #233 (open) claims +3.3% ZFlat average, up to +13.8% on pdf/pb workloads.
- No head-to-head riscv64 vs amd64 or riscv64 vs arm64 benchmark exists in the public record. The upstream README states amd64 achieves 250+ MB/s compression and 500+ MB/s decompression. The SpacemiT X60 decompression result of 265 MB/s (post #234) on a 1.6 GHz 8-core chip is plausible but not directly comparable without identical workload and frequency normalization. Data not available: per-frequency-normalized riscv64 vs amd64 head-to-head on identical workloads.

**Security hardening:** No RISC-V-specific security hardening gaps identified in the research. Snappy has no cryptographic code paths. Stack canaries and ASLR are controlled by the OS and compiler, not snappy. No snappy-specific hardening differences between architectures found.

**Floating-point / NaN:** Not applicable. Snappy performs no floating-point operations.

---

## 7. CI/CD Infrastructure

**riscv64 CI exists.** File: [`.github/workflows/riscv64-qemu-test.yaml`](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml).

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI file | build.yml | build.yml (macOS runner provides arm64) | riscv64-qemu-test.yaml |
| Trigger | push, pull_request | push, pull_request | push, pull_request |
| Runner | ubuntu-latest (x86-64) | macos-latest (arm64) | ubuntu-latest (x86-64, QEMU) |
| Native execution | Yes | Yes | No (QEMU user-mode) |
| Build tested | Yes | Yes | Yes |
| Unit tests run | Yes | Yes | Yes (`make test`) |
| Benchmarks run | Yes | Yes | Yes (`snappy_benchmark`) |
| AVX/NEON/RVV vectors tested | Yes (avx, avx2 matrix) | Yes (implicit) | No (no `-march=rv64gcv` in cmake invocation) |
| RISE runners | No | No | No |

**CI note:** The main `build.yml` has zero riscv64 content. It covers only x86 CPU levels (baseline, avx, avx2) on ubuntu/macOS/Windows. The `riscv64-qemu-test.yaml` is the sole riscv64 test path.

**QEMU limitation:** QEMU user-mode emulation may not fully model all timing characteristics. More critically, without explicit `-march=rv64gcv` in the cmake invocation, RVV intrinsics will not be compiled and the CI does not test any merged or pending RVV code paths.

---

## 8. Distribution and Release Status

**Upstream releases:** The google/snappy GitHub releases (v1.2.2, v1.2.1, v1.2.0, v1.1.10, v1.1.9) publish zero binary assets. All releases are source-only (auto-generated zip and tar.gz). No upstream binary exists for any architecture.

**All five merged RISC-V patches post-date the v1.2.2 release (March 26, 2025).** A user installing snappy from the v1.2.2 source tag does not get the Zbb fix (PR #214), the FindMatchLength guard (PR #220), the AArch64 alignment refactor (PR #232), or the Zicond branchless decompression (PR #234).

**Downstream package availability:**

| Distro | Package | Version | riscv64 | Notes |
|---|---|---|---|---|
| Debian sid | libsnappy-dev, libsnappy1v5 | 1.2.2-2+b2 | Yes, "Installed" | Built by Debian on rv-osuosl-01; Debian-produced binary, not upstream |
| Ubuntu 24.04 (Noble) | libsnappy-dev, libsnappy1v5 | 1.1.10-1build1 | Yes | ports.ubuntu.com |
| Arch Linux RISC-V | snappy | 1.2.2-3 | Yes | Built 2026-03-04; archriscv.felixc.at |
| PyPI (python-snappy) | snappy | 3.3.2 | No | x86_64 and aarch64 wheels only; riscv64 requires source build |

**To get a working riscv64 binary:**
- For C/C++ users: install `libsnappy-dev` from Debian or Ubuntu (riscv64 available), or build from source with `cmake`.
- For Python users: no riscv64 wheel on PyPI; must compile python-snappy from source with a working C toolchain. Arch RISC-V mirror carries `python-snappy-0.7.2-3-any.pkg.tar.zst` (noarch, works on riscv64).

---

## 9. Dependencies

All snappy dependencies are either optional benchmark-only codecs or build/test infrastructure. There is no runtime dependency.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking |
|---|---|---|---|---|---|
| zlib | Benchmark comparison codec (optional, `HAVE_LIBZ`) | Yes (pure portable C) | No dedicated riscv64 CI upstream | Debian: `zlib1g 1:1.3.dfsg+really1.3.1-1` | No |
| LZO2 | Benchmark comparison codec (optional, `HAVE_LIBLZO2`) | Yes (pure C) | No dedicated riscv64 CI | Debian riscv64 available | No |
| LZ4 | Benchmark comparison codec (optional, `HAVE_LIBLZ4`) | Yes (basic riscv64 support merged) | riscv64 added to LZ4 CI (QEMU) | Debian: `liblz4-dev` available | No (benchmark-only dep); see `project-reports/lz4.md` for detail |
| google/benchmark | Build-time benchmark framework (`third_party/benchmark` submodule) | Yes | Yes | Yes (riscv64 `rdtime` support merged 2019, PR #833) | No |
| google/googletest | Build-time test framework (`third_party/googletest` submodule) | Yes | Yes (with caveat) | Yes | Minor: Issue #3756 (open since Feb 2022) - `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64; does not affect snappy library functionality |

**google/benchmark deep-dive:** The benchmark submodule crash on riscv64 (snappy PR #208, Jul 2025) was caused by an older google/benchmark version using the privileged `rdcycle` instruction, blocked by Linux kernel 6.6+. The upstream google/benchmark had already fixed this (switching to `rdtime`, PR #833, merged 2019). Updating the submodule resolved the crash. No further riscv64 issues in google/benchmark.

No dependency has a JIT compiler, cryptographic accelerator, or numerics library with riscv64-specific concerns relevant to snappy usage.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #209](https://github.com/google/snappy/issues/209) | Performance Issue with Snappy FindMatchLength on RISC-V | Open (Jul 2025) | Performance | RISC-V uses 32-bit scalar fallback path for `FindMatchLength` while x86-64/PPC/LE-ARM use 64-bit word path. Root cause acknowledged; partially addressed by PR #220 (merged, adds 64-bit guard). RVV vectorized path in open PR #233 would further address this. No assignee. |
| [PR #233](https://github.com/google/snappy/pull/233) | RISC-V: Add RVV vectorized FindMatchLength | Open (Apr 2026) | Performance | +3.3% ZFlat average, up to +13.8% on pdf. No maintainer review after community reviewer feedback addressed Apr 24, 2026. |
| [PR #235](https://github.com/google/snappy/pull/235) | RISC-V: RVV short memcpy mirrors AVX fast-path +15% | Open (Apr 2026) | Performance | Maintainer's macro-style fix applied May 14, 2026. No subsequent merge. ~2 months without action. |

**No correctness bugs** affecting riscv64 are open. PR #220 (correctness fix: 64-bit FindMatchLength guard) was merged May 9, 2026.

**Issue #206** (correctness regression between v1.2.1 and v1.2.2 on split-prefix headers) is open but not riscv64-specific.

---

## 12. Objections and Upstream Blockers

**Stated objection (PR #212, Sep 2025):** `danilak-G` wrote that snappy is "mostly in maintenance mode" and could not provide a review timeline for the RVV MemCopy64 contribution. This caused the author to withdraw the PR.

**Structural objection (CONTRIBUTING.md):** RISC-V is outside the formally listed scope. This has not prevented merges in practice but means there is no commitment to accept or maintain RISC-V contributions.

**Review bottleneck:** `danilak-G` is the sole merger. In the May 9, 2026 batch he merged four PRs simultaneously (suggesting reviews accumulate and land in bursts). PRs #233 and #235 have been open since April 2026 with no maintainer action despite community reviewer feedback being addressed. The "maintenance mode" characterization and single-maintainer bottleneck are the primary organizational blockers.

**Technical gap:** The CI does not test RVV code paths (no `-march=rv64gcv`). If a contribution breaks RVV functionality without breaking non-RVV paths, the CI will not catch it. This weakens the case for accepting RVV contributions under a low-review-bandwidth maintainer.

**CLA friction:** PRs #216-#219 show that at least one contributor (yunfeizhou2025, Alibaba) had CLA issues that caused multiple duplicate PR submissions. The Google CLA process creates friction for contributors from organizations without existing CLA agreements.

**Acceptance probability for pending PRs:** PR #235 has received direct feedback from `danilak-G` and a fix was applied - acceptance probability is high [NEEDS VERIFICATION]. PR #233 has received no maintainer response - acceptance probability unknown, medium-low given maintenance mode stance and lack of engagement.

---

## 13. Investment Analysis

RISE has no existing investment in snappy. All RISC-V work to date is community-driven (Sanechips/ZTE, Alibaba, unaffiliated contributors).

### 13.1 Functional Enablement

No functional gaps block riscv64 usage. Snappy builds, tests, and runs correctly on riscv64 today. The library is usable on riscv64 without any new investment. The only functional concern is the Zbb dependency for `__builtin_ctzll`; without Zbb, the library falls back to a portable implementation (correct but slower). Zbb is present on all current production-grade RISC-V application cores.

### 13.2 Performance Optimization

Two open PRs represent actionable near-term gains:

- **PR #235** (RVV short-memcpy, +15% decompression): Code complete, maintainer feedback addressed, awaiting final approval. Effort to push to merge: 1-2 person-weeks for follow-up, benchmark reproduction, and reviewer engagement. High return.
- **PR #233** (RVV FindMatchLength, +3.3% ZFlat avg / +13.8% on pdf/pb): Code complete after community review. No maintainer engagement. Effort to push to merge: 1-2 person-weeks.
- **CRC32 hash acceleration via Zbc**: Not yet started. Zbc is available on SiFive P670 and Alibaba Xuantie C910+ cores. Effort: 2-3 person-weeks for implementation plus 1-2 person-weeks for upstream review cycle.
- **V128 byte shuffle via RVV `vrgather`**: Not yet started. This closes the largest remaining gap vs SSSE3/NEON decompression paths. Effort: 3-4 person-weeks for implementation plus review cycle.

### 13.3 CI/CD Infrastructure

The existing `riscv64-qemu-test.yaml` does not test RVV code paths. Adding `-march=rv64gcv_zbb_zicond` to the cmake invocation and fixing the potential cross-compiler detection issue would cost less than 1 person-week and would make the CI validate the merged and pending RVV work. This is low-effort, high-value.

Adding a native riscv64 runner (e.g., via RISE infrastructure or a SiFive/SpacemiT board) would give accurate timing and remove QEMU limitations. Effort: 1-2 person-weeks for runner setup if hardware is available.

### 13.4 Ecosystem Enablement

The primary ecosystem gap is the absence of riscv64 wheels on PyPI for python-snappy. This affects Python users who cannot run pip install without a build toolchain. A riscv64 wheel build would require either a native build host or cross-compilation in CI. Effort: 2-3 person-weeks (python-snappy has its own repo and build pipeline separate from google/snappy). Low priority given that python-snappy is not a high-deployment Python package and Arch RISC-V already provides a working noarch package.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI | Add `-march=rv64gcv_zbb_zicond` to riscv64-qemu-test.yaml; fix CC/CXX detection | 0.5 | Contributor (community or RISE) | High |
| Performance | Land PR #235 (RVV short-memcpy +15% decompression) | 1-2 | anthony-zy or RISE follow-up | High |
| Performance | Land PR #233 (RVV FindMatchLength +3-14% compression) | 1-2 | zhanchangbao-sanechips or RISE follow-up | High |
| Performance | Implement Zbc CRC32 hash acceleration | 2-3 | New contributor | Medium |
| Performance | Implement RVV `vrgather` V128 byte shuffle for decompressor | 3-4 | New contributor | Medium |
| CI | Add native riscv64 runner (RISE infrastructure) | 1-2 | RISE | Low |
| Ecosystem | Build and publish riscv64 wheels for python-snappy on PyPI | 2-3 | RISE wheel builder | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/snappy repository](https://github.com/google/snappy)
- [snappy homepage](https://google.github.io/snappy/)
- [PR #208: build: Update benchmark submodule for RISC-V](https://github.com/google/snappy/pull/208)
- [PR #212: Add RVV support for RISC-V and optimize decompression speed with an enhanced Memcopy64 function](https://github.com/google/snappy/pull/212)
- [PR #214: RISC-V: gate __builtin_ctzll behind Zbb to avoid 10% slowdown](https://github.com/google/snappy/pull/214)
- [PR #220: limit RISC-V FindMatchLength optimizations to 64-bit](https://github.com/google/snappy/pull/220)
- [PR #232: refactor: Align RISC-V implementation with AArch64 branchless mask extraction](https://github.com/google/snappy/pull/232)
- [PR #233: RISC-V: Add RVV vectorized FindMatchLength optimization](https://github.com/google/snappy/pull/233)
- [PR #234: RISC-V: Optimize decompression with branchless AdvanceToNextTagRVOptimized +13.7%](https://github.com/google/snappy/pull/234)
- [PR #235: RISC-V: Optimize decompression throughput by mirroring AVX fast-path for RVV short memcpy +15%](https://github.com/google/snappy/pull/235)
- [PR #236: RISC-V: Add optimized decompression path (closed as duplicate)](https://github.com/google/snappy/pull/236)
- [PR #239: RISC-V: Add RVV vectorized FindMatchLengthPlain optimization (rejected)](https://github.com/google/snappy/pull/239)
- [PR #240: RISCV: enable ExtractOffset optimization for RISC-V (closed)](https://github.com/google/snappy/pull/240)
- [Issue #209: Performance Issue with Snappy FindMatchLength on RISC-V](https://github.com/google/snappy/issues/209)
- [snappy CI: riscv64-qemu-test.yaml](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml)
- [snappy CI: build.yml](https://github.com/google/snappy/blob/main/.github/workflows/build.yml)
- [riscv-collab/riscv-gnu-toolchain release 2025.07.03](https://github.com/riscv-collab/riscv-gnu-toolchain/releases/tag/2025.07.03)
- [Debian buildd snappy package status](https://buildd.debian.org/status/package.php?p=snappy)
- [Ubuntu 24.04 snappy packages](https://packages.ubuntu.com/search?keywords=snappy&suite=noble)
- [PyPI python-snappy](https://pypi.org/project/snappy/)
- [RISE Project member list](https://riseproject.dev)
- [google/googletest Issue #3756: GetThreadCountTest.ReturnsCorrectValue fails on riscv64](https://github.com/google/googletest/issues/3756)