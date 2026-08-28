---
title: RocksDB
---

# RocksDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for RocksDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

RocksDB is a persistent, embeddable key-value storage engine (LSM-tree based, forked from Google's LevelDB) developed and maintained by Meta (Facebook). It is hosted under "Meta Open Source" (opensource.fb.com), not under a neutral foundation such as Apache, the Linux Foundation, or CNCF. Copyright is held by Meta Platforms, Inc. License is dual Apache 2.0 / GPL-2.0 (the GitHub API reports GPL-2.0 as primary; the repo also ships a separate `LICENSE.Apache` file).

Governance is informal: there is no MAINTAINERS/OWNERS/CODEOWNERS file in the repository. Meta engineers merge changes through an internal Phabricator-to-GitHub pipeline, visible in every commit via `fbshipit-source-id` and `Differential Revision` trailers. External contributions require signing Meta's Contributor License Agreement via code.facebook.com/cla, enforced automatically by a `meta-cla[bot]` on every PR.

Key maintainers identified from commit "Pulled By" trailers (last 100 commits): Peter Dillinger (pdillinger, Meta) is by far the most active approver (24 of the last 100 commits); xingbowang is the dominant recent reviewer for infrastructure/build changes (company unlisted on GitHub profile); joshkang97 and anand1976 (Ranjan Banerjee) are also active Meta-side reviewers; laurynas-biveinis (company "VilniusDB") is a long-time independent external contributor.

Meta does not appear on the RISE Project's member list (checked [riseproject.dev/members](https://riseproject.dev/members/)), so RocksDB has no RISE affiliation through its corporate steward.

Community stance toward RISC-V contributions is receptive but informal and slow-moving, with no fast-tracked review tier. Adam Retter (company Evolved Binary) acts as an unofficial RISC-V advocate and has pushed back on duplicate submissions, noting "we do already have RISC-V support in the Makefiles ... releasing binaries for RISC-V RocksDB Java for some time." Maintainer xingbowang, faced with three overlapping RISC-V PRs (#14485/#14545/#14546), asked the submitter to consolidate rather than rejecting the work outright. There is no PLATFORMS.md or SUPPORT.md file; `INSTALL.md`'s "Supported platforms" section names only x86, ARM, PowerPC, s390x, Solaris, and AIX -- RISC-V is not mentioned there at all, despite functioning build-script support, which is a documentation gap.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-07-01 | [PR #7060](https://github.com/facebook/rocksdb/pull/7060) opened ("riscv64 need -latomic as library", author grooverdan) -- first RISC-V attempt | closed unmerged, superseded by #8183 |
| 2021-04-22 | [PR #8183](https://github.com/facebook/rocksdb/pull/8183) merged (commit `47b424f4b`) -- CMake `-latomic` link check | first release v6.22.1 (2021-07-12) |
| 2021-11-25 | [PR #9215](https://github.com/facebook/rocksdb/pull/9215) opened by XieJiSS ("fix: build on risc-v", ports a cycle-clock fix from LLVM/google-benchmark) | disputed status -- see note below |
| 2022-01-07 | [PR #9366](https://github.com/facebook/rocksdb/pull/9366) authored by Adam Retter (Evolved Binary), "Improve build detect for RISCV" (tested on SiFive Unmatched) | merged 2022-03-01, commit `7d7e88c7d`, first release v7.1.1 (2022-04-13) |
| 2022-05-18 | PR #9215 closed | see disputed status note |
| 2022-10-29 | [PR #10901](https://github.com/facebook/rocksdb/pull/10901) opened by XieJiSS ("fix: SIGILL caused by rdcycle prohibited by kernel on RISC-V") | closed unmerged 2024-01-18 |
| 2023-12-14 | [PR #12139](https://github.com/facebook/rocksdb/pull/12139) merged (commit `5502f0672`, author luhenry / Ludovic Henry) -- Java/JNI riscv64 support, Docker cross-build target | first release v8.10.0 (2024-01-10) |
| 2026-03-23 | [PR #14484](https://github.com/facebook/rocksdb/pull/14484) "cmake: Add RISC-V architecture support" opened and closed same day | superseded by #14485 |
| ~2026-03 to 2026-06-29 | [PR #14485](https://github.com/facebook/rocksdb/pull/14485) open ~3 months (adds RVV/Zbc `-march` tiers, tested on SG2044) | closed unmerged 2026-06-29 |
| 2026-03-30 | [PR #14530](https://github.com/facebook/rocksdb/pull/14530) opened by fengpengboa -- consolidates `-march` fix + LLD linker detection fix | still open |
| 2026-03-31 | [PR #14536](https://github.com/facebook/rocksdb/pull/14536) opened -- Zbc-accelerated CRC32C, benchmarked 16.9x speedup on SG2044 | still open |
| 2026-04-10 | [PR #14545](https://github.com/facebook/rocksdb/pull/14545) / [#14546](https://github.com/facebook/rocksdb/pull/14546) closed unmerged (CLA blocker cited in bot/comment thread) | folded into #14530 |
| 2026-04-11 | [PR #14604](https://github.com/facebook/rocksdb/pull/14604) opened by sunyuechi -- syncs vendored `xxhash.h` to an upstream dev SHA for RVV dispatch | still open |
| 2026-06-29 | [PR #14894](https://github.com/facebook/rocksdb/pull/14894) opened -- Zvbc vector-accelerated CRC32C, explicitly depends on #14536 and #14530 | still open, blocked |
| 2026-08-08 | Most recent recorded activity: fengpengboa pings xingbowang on #14530, "could you please help push this along?" | unanswered as of data pull |

**Disputed status note (contradiction in findings):** Two independent narrative descriptions in the research state PR #9215 was "closed unmerged" (item in the general PR list, and separately in the port-history narrative: "closed unmerged -- the change was apparently folded into the next PR"). However, a separate verification pass that checked `git tag --contains` against the actual landed commit reports PR #9215 as **merged** via commit `8b1df101d` on 2022-05-18, first shipping in v7.3.1 (2022-06-10). This verification pass explicitly notes that the GitHub REST API's `merged_at` field is unreliable for RocksDB PRs because Meta's `fbshipit` bot performs a squash-and-recommit rather than a native GitHub merge, which can cause the PR object itself to display as "closed" without a `merged_at` timestamp even when the code landed on `main`. Supporting circumstantial evidence: PR #10901's body states the SIGILL bug "affected `toku_time.h` code that XieJiSS himself had introduced earlier in PR #9215," implying #9215's code was present on `main` by the time #10901 was filed. On balance, the commit-ancestry verification is the more rigorous method and is presented as the corrected conclusion, but both claims are reported here per verification policy.

**Key contributors and organizations:** Adam Retter (Evolved Binary) -- PR #9366, informal RISC-V advocate; XieJiSS -- PR #9215, #10901; Ludovic Henry (luhenry) -- PR #12139 (Java/JNI); fengpengboa -- PR #14530/#14536/#14545/#14546 (company CLA registered under another individual, unresolved as of report); sunyuechi -- PR #14604; zhanchangbao-sanechips -- PR #14485.

**Is it fully upstream?** No. Core build-system enablement (Makefile riscv64 detection, `build_detect_platform` ISA flags, JNI Docker cross-build) is merged. CMake riscv64 support does not exist on `main` at all. All compute-path optimizations (CRC32C Zbc/Zvbc acceleration, XXH3 RVV dispatch) and the fixes for two live build-toolchain bugs are unmerged, sitting in open PRs stalled on CLA paperwork and unanswered maintainer review requests.

## 3. Upstream Support Tier

No formal platform-tier policy document exists (no PLATFORMS.md/SUPPORT.md). `INSTALL.md`'s "Supported platforms" section lists only x86, ARM, PowerPC, s390x, Solaris, and AIX; RISC-V is absent from user-facing documentation despite having build-script support. No riscv64 CI job exists anywhere (confirmed zero matches for "riscv" across all 14 `.github/workflows/*.yml` files). GitHub Releases publish zero binary assets for any architecture, including riscv64 -- RocksDB is a source-only release upstream. The RocksJava riscv64 JNI artifact is produced only via a manually-triggered Docker cross-build target (`make rocksdbjavastaticdockerriscv64`), not integrated into any automated release pipeline.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Yes (multiple workflow jobs) | Yes (`build-linux-arm`, `arm64large` self-hosted runner label) | None found in any workflow file |
| SIMD-accelerated CRC32C on `main` | Yes (SSE4.2/PCLMUL, `crc32c_3way`) | Yes (`crc32c_arm64.cc`, CRC32/PMULL instructions) | No -- falls through to generic scalar `ExtendImpl<DefaultCRC32>` |
| Documented as supported platform (INSTALL.md) | Yes | Yes | No |
| Official prebuilt binaries | None (source-only release policy applies to all arches) | None | None |
| JNI/RocksJava cross-build | Standard toolchain | Standard toolchain | Manual Docker target only, external image (`evolvedbinary/rocksjava`) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

| Component | riscv64 implementation exists? | ISA extensions | Quality | amd64 equivalent | arm64 equivalent |
|---|---|---|---|---|---|
| CRC32C checksum (merged, on `main`) | No | n/a | Scalar table-driven fallback only (`ExtendImpl<DefaultCRC32>`) | SSE4.2/PCLMULQDQ 3-way SIMD (~450 lines) | `crc32c_arm64.cc` (212 lines, CRC32/PMULL) |
| CRC32C checksum, scalar (open PR #14536) | Yes, not merged | Zbc (carry-less multiply) | Hand-written `.S` assembly with 3-tier runtime feature detection (`riscv_hwprobe` syscall to `/proc/cpuinfo` fallback, with caching); benchmarked 375.7 MB/s (software) to 6333.3 MB/s (Zbc), a ~16.9x improvement, on SG2044 hardware | -- | -- |
| CRC32C checksum, vector (open PR #14894) | Yes, not merged, blocked on #14536+#14530 | Zvbc (vector carry-less multiply) + Zbb | Second-tier hand-tuned path, 128-byte-per-iteration folding + Barrett reduction, requires runtime VLEN==128 check via `vlenb` CSR, falls back to Zbc scalar path otherwise; benchmarked ~10% further improvement over Zbc-only on VLEN=128 hardware | -- | -- |
| XXH3 hashing (vendored `util/xxhash.h`) | No, on `main` | n/a | No riscv/RVV references at all on `main` | SIMD dispatch built in | SIMD dispatch built in |
| XXH3 hashing, RVV (open PR #14604) | Pending, blocked externally | RVV | Version bump only (syncs vendored header to an upstream xxHash dev commit; no tagged xxHash release contains RVV yet, so this is an external upstream blocker, not a RocksDB-authored gap); tested on SG2044 (rv64gc and rv64gcv) with hash_test/bloom_test/db_bloom_filter_test passing | -- | -- |
| Cycle counter (`toku_time.h`, TokuDB/FractalTree range-lock sub-library) | Yes, merged, complete | Base RV32I/RV64I + Zicntr | Hand-tuned inline assembly (`rdcycleh`/`rdcycle` overflow-safe pair for RV32, single `rdcycle` for RV64); the one fully complete riscv arch-code path on `main` | `rdtsc` one-liner | `stckf`-equivalent one-liner (s390x cited as sibling pattern) |
| Java/JNI platform detection (`Environment.java`) | Yes, merged | n/a | `isRiscv64()` string check on `os.arch`, used for `.so` naming only; no ISA-extension awareness | equivalent `isAmd64` check | equivalent `isAarch64` check |

## 5. Build System, Cross-Compilation, and Toolchain

**CMake has no riscv64 support at all.** Direct inspection of `CMakeLists.txt` confirms `CMAKE_SYSTEM_PROCESSOR MATCHES` branches exist only for `powerpc/ppc64`, `arm64/aarch64`, `s390x`, and `loongarch64`. riscv64 falls into the generic `else()` branch, which emits `-march=native` -- meaningless and wrong when cross-compiling. No `cmake/riscv64.cmake` or toolchain file exists (both 404).

**The legacy Make/autoconf path (`build_tools/build_detect_platform`) has riscv64 branches, merged via [PR #9366](https://github.com/facebook/rocksdb/pull/9366):**
```bash
elif test -n "`echo $TARGET_ARCHITECTURE | grep ^riscv64`"; then
    RISC_ISA=$(cat /proc/cpuinfo | grep -E '^isa\s*:' | head -1 | cut --delimiter=: -f 2 | cut -b 2-)
    if [ -n "${RISCV_ISA}" ]; then
      COMMON_FLAGS="$COMMON_FLAGS -march=${RISC_ISA}"
    fi
```
Note the variable-name typo: the script assigns `RISC_ISA` but checks `RISCV_ISA`, making native `/proc/cpuinfo`-based `-march` detection dead code on `main` today. This is documented and fixed only in the still-open [PR #14530](https://github.com/facebook/rocksdb/pull/14530). Under `PORTABLE=1`, the script instead sets `-march=rv64gc` as a fixed baseline (no bit-manipulation or vector extensions).

**Exact commands:**
- Native build on riscv64 hardware: `make static_lib` or `make -j$(nproc) rocksdbjavastatic` -- attempts (but currently fails, due to the typo above) to auto-detect `-march=` from `/proc/cpuinfo`.
- Portable/cross build: `PORTABLE=1 make -jN rocksdbjavastatic` -- uses fixed `-march=rv64gc`.
- Docker cross-build (used for official RocksJava riscv64 artifacts): `make rocksdbjavastaticdockerriscv64`, which runs `docker run --platform linux/riscv64 ... evolvedbinary/rocksjava:ubuntu20_riscv64-be /rocksdb-host/java/crossbuild/docker-build-linux.sh`, which in turn runs `PORTABLE=1 make -j$J rocksdbjavastatic` inside the container. No explicit QEMU invocation exists in RocksDB's own scripts -- the `--platform linux/riscv64` flag relies implicitly on the host's `binfmt_misc`/QEMU user-mode emulation registered with Docker.
- Manual CMake cross-build (no built-in support): would require `cmake -DCMAKE_CXX_FLAGS="-march=rv64gc" ..` since no riscv64 detection branch exists.

**Toolchain:** `INSTALL.md` states a C++20 baseline requiring GCC >= 11 or Clang >= 10. The riscv64 Docker image (`evolvedbinary/docker-rocksjava`, `ubuntu20_riscv64/Dockerfile`, a repository separate from `facebook/rocksdb`) explicitly installs `gcc-11`/`g++-11` via the `ubuntu-toolchain-r/test` PPA, matching this baseline with no riscv-specific deviation. A newer Alpine 3.20 / OpenJDK 20 riscv64 image variant also exists; its own README states "This actually uses Alpine 3.20 and OpenJDK 20 as those are the minimum versions that support RISCV on Alpine" -- this variant builds `gflags` from source since Alpine's package repo lacks it for riscv64, and its exact musl-toolchain GCC version was not independently confirmed [NEEDS VERIFICATION].

**Known build failures (documented in PR/issue threads):**
- `undefined reference to __atomic_compare_exchange_1` / `__atomic_exchange_1` -- missing `-latomic` link, root-caused in closed [issue #7051](https://github.com/facebook/rocksdb/issues/7051), fixed by [PR #8183](https://github.com/facebook/rocksdb/pull/8183).
- `g++: error: missing argument to '-march='` -- reported in closed [issue #10500](https://github.com/facebook/rocksdb/issues/10500), fixed for the Docker/JNI path by [PR #12139](https://github.com/facebook/rocksdb/pull/12139).
- `g++: error: '-march=...': unexpected ISA string at end: 'sscofpmf_sstc_svinval_svnapot_svpbmt'` -- `/proc/cpuinfo` leaking privileged-mode ISA extension strings that GCC rejects; unresolved on `main`, addressed only in open PR #14530's whitelist-filtering approach.
- `Error: unrecognized opcode 'bseti a5,zero,63', extension 'zbs' required` -- older binutils rejecting newer `zi*`/`zbs` opcodes; same open-PR-only fix.
- `ld.lld: error: unknown relocation (60) against symbol .LLSDACSE6132` -- modern GCC emitting `R_RISCV_SET_ULEB128`/`R_RISCV_SUB_ULEB128` relocations for C++ exception tables that older LLD cannot link; unresolved on `main`, addressed only in the closed-unmerged #14545/#14546 and the still-open, CLA-stalled #14530.
- SIGILL from `rdcycle`/`rdcycleh` -- Linux kernels restricting userland `mcycle` register access for side-channel mitigation, documented extensively in closed [PR #10901](https://github.com/facebook/rocksdb/pull/10901); resolved not by a RocksDB code change but by an upstream kernel revert of the restricting commit, plus a QEMU update adding emulated `/proc/cpuinfo` in usermode.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CMake build support | Yes | Yes | No (no branch at all; falls to wrong `-march=native` default) |
| Make build support | Yes | Yes | Yes, but native `-march` auto-detect is dead code due to an unfixed typo |
| Hardware-accelerated CRC32C | Yes (merged) | Yes (merged) | No (merged); hand-tuned Zbc/Zvbc implementations exist but are unmerged (PR #14536, #14894) |
| SIMD-accelerated XXH3 hashing | Yes | Yes | No; RVV path pending on external upstream xxHash release tagging (PR #14604) |
| Automated CI | Yes | Yes | No |
| Prebuilt official binaries | None (source-only for all arches) | None | None |
| Documented "supported platform" status | Yes | Yes | No |

**Performance gap:** No independently published riscv64 benchmark numbers were found via multiple WebSearch queries (all returned empty result sets) or via the RISE Project blog (unrenderable template markup, no substantive content). The only performance data available is self-reported, in-PR benchmarking from unmerged PRs: #14536 reports 375.7 MB/s (scalar software CRC32C) versus 6333.3 MB/s (Zbc-accelerated), a ~16.9x improvement, on SG2044 hardware; #14894 reports a further ~10% improvement with the Zvbc vector path on VLEN=128 hardware. Because neither PR is merged, production riscv64 RocksDB today runs the unaccelerated scalar CRC32C path with no vectorized hashing, i.e. the current real-world throughput gap versus amd64/arm64 for checksum-heavy workloads is on the order of the 16.9x figure self-reported above, though this has not been independently reproduced or verified by a third party [NEEDS VERIFICATION].

**Security hardening gaps:** Data not available: no research findings addressed ASLR, stack-protector, CFI, or other hardening-flag behavior specific to riscv64 for RocksDB.

**NaN / floating-point semantics:** No RISC-V-specific NaN or floating-point correctness issues were found. A targeted search (`riscv nan floating repo:facebook/rocksdb`) returned zero hits; the only floating-point issue located (#8390, a `db_bench` benchmark floating-point exception) is closed and not RISC-V-specific.

## 7. CI/CD Infrastructure

No riscv64 CI exists. All 14 workflow files in `.github/workflows/` were fetched and grepped directly (`ai-review-analysis.yml`, `ai-review-comment.yml`, `benchmark-linux.yml`, `clang-tidy-comment.yml`, `clang-tidy.yml`, `claude-review-comment.yml`, `claude-review.yml`, `codex-review-analysis.yml`, `codex-review-comment.yml`, `nightly-candidate.yml`, `nightly.yml`, `pr-jobs-candidate.yml`, `pr-jobs.yml`, `weekly.yml`) -- zero matches for "riscv" in any form, in any file. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, Azure Pipelines, or Buildkite config exists anywhere in the repository; `.github/workflows/` is the only CI configuration present.

The only architecture-specific runner references found are `arm64large` self-hosted runner labels in `nightly-candidate.yml` (line 10) and `pr-jobs-candidate.yml` (lines 11/21/23) -- ARM64, not RISC-V. This confirms the search methodology works (it does find arm64 references) and that riscv is genuinely absent rather than a search artifact.

No RISE runner involvement was found: the RISE Python wheel builder's ~70-package build list (checked in full) does not include RocksDB. All riscv64 build/test claims in PRs (e.g. "tested on SG2044 rv64 hardware") are manual, author-self-reported, and never enforced by any automated pipeline.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes (`build-linux-arm`) | No |
| Self-hosted runner label | n/a (presumably GitHub-hosted) | `arm64large` | None |
| RISE runner usage | n/a | Not confirmed | Not confirmed, and RocksDB absent from RISE wheel-builder package list |

## 8. Distribution and Release Status

**GitHub Releases:** The 10 most recent releases (v11.8.1 down to v10.6.2) were checked via `gh api repos/facebook/rocksdb/releases` -- every release has an empty asset list. RocksDB publishes zero prebuilt binaries for any architecture; it is a source-only release upstream.

**PyPI:** The `rocksdb` package (`https://pypi.org/pypi/rocksdb/json`) is a third-party, effectively unmaintained binding (`python-rocksdb`, last real release `0.8.0rc2`). All wheel filenames are `manylinux2010_x86_64`/`manylinux2014_x86_64`; the remainder is an sdist tarball. No riscv64 wheel exists, and this package is not an official Meta artifact.

**RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/rocksdb/` redirects to PyPI directly -- no distinct RISE-built package exists, and RocksDB is absent from the wheel builder's published package list.

**Ubuntu 24.04 (noble):** All 6 matching packages have riscv64 builds present: `librocksdb-dev`, `librocksdb8.9`, `rocksdb-tools`, `mariadb-plugin-rocksdb` (ports build), `balboa-backend-rocksdb` (ports build), and `librust-oxrocksdb-sys-dev` (architecture-independent, covers riscv64 trivially).

**Debian sid/unstable:** `buildd.debian.org` confirms rocksdb 9.11.2-1 with riscv64 status "Installed" (successful build, host `rv-manda-01`). This is a directly verified, current riscv64 binary package.

**Arch Linux RISC-V:** Contradictory findings across two research passes. An earlier pass claimed a directory listing showed `rocksdb-11.1.1-1-riscv64.pkg.tar.zst` (+ `.sig`) present in the `extra` repository, dated 15-Jun-2026. A later, more rigorous adversarial verification pass directly queried the `core`, `extra`, and `unsupported` riscv64 repository directories at `archriscv.felixc.at` and found **no `rocksdb*` package file in any of the three repos** -- refuting the earlier claim. The direct repository-directory-listing method used in the second pass is the more authoritative check (it queries the actual package index rather than a search UI), so the corrected conclusion is that RocksDB is **not currently packaged** for Arch Linux RISC-V, though both results are reported here per verification policy.

**What a user must do to get a working binary:** On Debian sid or Ubuntu 24.04, `apt-get install librocksdb-dev` / `rocksdb-tools` works directly on riscv64. Everywhere else (Fedora/RHEL, Arch Linux RISC-V, official PyPI, or a Maven-published RocksJava riscv64 artifact) no confirmed prebuilt path exists in the findings; a user must build from source via `PORTABLE=1 make rocksdbjavastatic` or the `make rocksdbjavastaticdockerriscv64` Docker cross-build target.

## 9. Dependencies

Dependency list derived directly from `CMakeLists.txt` optional-feature flags (`WITH_JEMALLOC`, `WITH_LIBURING`, `WITH_SNAPPY`, `WITH_LZ4`, `WITH_ZLIB`, `WITH_ZSTD`, `WITH_BZ2`, `WITH_NUMA`) and `Makefile` (riscv64 `MACHINE` filter entries, JNI Docker target).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| RocksDB itself | -- | Native riscv64 support merged ([PR #12139](https://github.com/facebook/rocksdb/pull/12139), Dec 2023); `-latomic` auto-linked | No dedicated riscv64 CI job; manual QEMU/hardware testing only (per PR authors, e.g. 7h44m build at `-j2` under QEMU per PR discussion) | Debian sid 9.11.2-1 "Installed" | No riscv64-tier documentation in INSTALL.md |
| jemalloc | Optional allocator (`WITH_JEMALLOC`) | Works with community patches; no official riscv64 CI | Not verified upstream | No official riscv64 binary release confirmed | Open upstream issue on cross-build support for riscv64gc; see project-reports/jemalloc.md |
| liburing | Optional async I/O (`WITH_LIBURING`, default ON) | Builds on riscv64; CI job added upstream | riscv64 GitHub Actions bot added upstream | Distro riscv64 packages exist | Upstream riscv64 gaps closed; see project-reports/liburing.md |
| Snappy | Optional compression (`WITH_SNAPPY`) | Builds cleanly on riscv64 | No riscv64-specific gaps found | Available via Debian/Conan on riscv64 | See project-reports/snappy.md |
| zstd | Optional compression (`WITH_ZSTD`) | Builds on riscv64; some SIMD fast-path code not yet riscv-optimized upstream | Passes generic tests | Debian/Conan riscv64 builds available | Open upstream perf issue for 4-way fast loop on riscv64; see project-reports/zstd.md |
| LZ4 (and vendored xxHash origin) | Optional compression (`WITH_LZ4`) | Builds/passes correctness on riscv64; RVV vectorized paths proposed upstream but not yet merged there either | Generic tests pass | Debian/Conan riscv64 builds available | 4 open upstream RVV optimization proposals unmerged; see project-reports/lz4.md |
| zlib | Optional compression (`WITH_ZLIB`) | Builds on riscv64 without issue | No riscv64-specific gaps found | Widely available on riscv64 | No open riscv-specific upstream issues found |
| NUMA (libnuma/numactl) | Optional NUMA allocation (`WITH_NUMA`, default OFF) | Builds on riscv64 after upstream atomic-link fix | Not independently verified | Debian riscv64 package available | Upstream riscv64 build fixes already closed; see project-reports/libnuma.md |
| bzip2 (`WITH_BZ2`) | Optional compression | Not independently verified in this pass | -- | -- | Upstream is sourceware.org, not GitHub-search-indexed the same way; flagged as unverified |
| gflags | CLI-flags library (used by `db_bench`/tools) | Not checked in depth | -- | -- | Out of scope for this pass |
| folly / glog / fmt / boost (`USE_FOLLY`) | Optional coroutine support path, off by default | Not checked in depth | -- | -- | Out of scope for this pass |

**Deep-dive, XXH3/xxHash (critical for hashing):** RocksDB vendors `util/xxhash.h` directly rather than depending on a system package. The vendored copy currently pinned on `main` (snapshot of upstream 0.8.1, commit `fd911f965`) has no RVV dispatch path. Open [PR #14604](https://github.com/facebook/rocksdb/pull/14604) proposes bumping to an unreleased upstream dev commit (`668362bb8`) specifically because **no tagged xxHash release contains RVV support** -- this is an external upstream blocker on the xxHash project, not something fixable purely within RocksDB.

**Deep-dive, CRC32C dispatch (`util/crc32c.cc`):** Confirmed by direct source inspection: the dispatch function selects between x86 (`__SSE4_2__`/`__PCLMUL__`, via `nmmintrin.h`/`wmmintrin.h`), ARM64 (`HAVE_ARM64_CRC`), and PPC (`crc32c_ppc.c`/`crc32c_ppc_asm.S`). There is no riscv64 branch; riscv64 falls through to the portable software CRC table implementation. The unmerged riscv64 Zbc/Zvbc paths (Section 4) would, if merged, bring riscv64 to parity with the ARM64/PPC dispatch structure.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #14530](https://github.com/facebook/rocksdb/pull/14530) | Fix multiple RISC-V build issues (`-march` generation, LLD detection) | Open, stalled | High (build-portability blocker; not a runtime correctness bug for existing builds, but blocks correct native builds on modern ISA strings and blocks the entire dependent-PR chain) | Blocked on a CLA registration conflict for the author and 4+ months of unanswered maintainer pings (last: 2026-08-08) |
| [PR #14536](https://github.com/facebook/rocksdb/pull/14536) | RISC-V: Optimize CRC32C with Zbc extension | Open, stalled | Medium (performance only) | Same CLA/review-attention blocker |
| [PR #14894](https://github.com/facebook/rocksdb/pull/14894) | Vector-accelerated (Zvbc) CRC32C assembly for RISC-V | Open, blocked | Medium (performance only) | Explicitly cannot merge until #14536 and #14530 land -- stacked-PR bottleneck |
| [PR #14604](https://github.com/facebook/rocksdb/pull/14604) | Sync vendored xxhash.h for RISC-V RVV dispatch | Open, stalled | Medium (performance only) | Also blocked externally: no tagged upstream xxHash release has RVV yet |
| [PR #10901](https://github.com/facebook/rocksdb/pull/10901) | SIGILL from `rdcycle` prohibited by kernel on RISC-V | Closed, unmerged | **Correctness (crash bug, historical)** | Resolved not by a RocksDB patch but by an upstream Linux kernel revert of the restricting commit, plus a QEMU update; closed as no-longer-reproducible per author's own comment |
| [Issue #7051](https://github.com/facebook/rocksdb/issues/7051) | Build fails on riscv64 (`__atomic_*` link errors) | Closed | Build (historical) | Fixed by PR #8183 |
| [Issue #10500](https://github.com/facebook/rocksdb/issues/10500) | `-march=` missing argument error on riscv | Closed | Build (historical) | Fixed by PR #12139 |
| [Issue #11994](https://github.com/facebook/rocksdb/issues/11994) | Better `-march` selection for RISC-V (QEMU `/proc/cpuinfo` unrecognized strings) | Closed | Build (historical) | Fixed by PR #12139 |

**Correctness bugs highlighted separately:** Only one genuine riscv64 crash/correctness bug was found in the research (#10901, `rdcycle` SIGILL), and it was resolved upstream in the Linux kernel rather than in RocksDB. The `build_detect_platform` `RISC_ISA`/`RISCV_ISA` typo is a latent build-portability defect (silently disables native ISA auto-detection) rather than a runtime crash, and remains unfixed on `main` as of the data pull.

## 12. Objections and Upstream Blockers

**Organizational blocker -- CLA:** Contributor fengpengboa (author of the current #14530/#14536/#14545/#14546 patch series) reported that his company's Meta Corporate CLA is already registered under a different individual internally, that he could not locate the original signer, and that he emailed cla@meta.com with no recorded response as of the data pulled. This blocks merge regardless of code quality or review outcome.

**Organizational blocker -- maintainer bandwidth:** Maintainer xingbowang was pinged for review multiple times (2026-04-14, and again on 2026-08-08 with "could you please help push this along? If you can't review yourself, maybe you could point me to someone who can"). PRs #14536, #14604, and #14894 show similarly unanswered pings to maintainers pdillinger, hx235, and xingbowang, with zero recorded review comments across any of these open PRs despite months of activity.

**Technical/process blocker -- stacked dependencies:** PR #14894 explicitly cannot merge until PR #14536 and PR #14530 land first, meaning a single stalled PR (#14530) blocks the entire pending riscv64 compute-optimization pipeline.

**Technical/process blocker -- fragmentation:** Prior to consolidation, three separate near-identical CMake PRs (#14484, #14485, and content later folded into #14530) plus a split CMake/Makefile pair for the LLD fix (#14545/#14546) were submitted independently before a maintainer asked for consolidation -- a coordination problem among external contributors rather than a rejection of the work.

**No stated technical objection to RISC-V support in principle was found anywhere in the research.** All identified blockers are process, CLA, and maintainer-bandwidth issues, not a technical rejection of RISC-V as a target platform.

**Acceptance probability:** Historical precedent shows straightforward riscv64 build patches do get merged over time (#8183 in 2021, #9366 in 2022, #12139 in 2023, and per the disputed-status note in Section 2, possibly #9215 in 2022). However, the current batch (#14530/#14536/#14604/#14894) has been open since March-June 2026 with an unresolved CLA blocker and no recorded maintainer engagement as of the latest ping (2026-08-08). Whether these will land is [NEEDS VERIFICATION] -- no committer response was found in the record as of the data pulled, so I cannot state whether this batch is on a path to merge or effectively stalled indefinitely.

## 13. Investment Analysis

RISE Project involvement in RocksDB, checked before sizing any work: essentially none. The only documented RISE touchpoint is a single closed, uncommented tracking issue (`riseproject-dev/language-runtimes-wg#74`, opened and closed by the same user one day apart, referencing the unmerged upstream PR #12139), plus confirmation that RocksDB is absent from the RISE Python wheel builder's package list and has no RISE blog coverage. No RISE-funded engineering, CI runner usage, or packaging work was found. Consequently, none of the estimates below net out any prior RISE investment.

### 13.1 Functional Enablement
Baseline riscv64 build and JNI support is already merged upstream (Section 2). Remaining functional gaps: (a) the `RISC_ISA`/`RISCV_ISA` typo plus `-march` whitelist and LLD exception-table detection fixes are already authored in open PR #14530 -- the work needed is shepherding this PR to merge (CLA resolution, maintainer engagement), not re-implementation; (b) CMakeLists.txt has zero riscv64 branch and silently emits `-march=native` when cross-compiling -- no open PR addresses this specifically, so this is a genuine unclaimed gap; (c) INSTALL.md's "Supported platforms" list omits RISC-V despite working build support -- a trivial documentation fix.

### 13.2 Performance Optimization
Two hand-tuned, hardware-benchmarked implementations already exist and are pending merge: PR #14536 (Zbc scalar CRC32C, 16.9x self-reported speedup) and PR #14894 (Zvbc vector CRC32C, +10% further). PR #14604 (XXH3 RVV) is a RocksDB-side version bump only, blocked externally on upstream xxHash tagging a release with RVV support. Because this code is already written, reviewed-ready, and benchmarked, investment here should be reviewer/committer engagement and CLA facilitation (e.g., a RISE-affiliated engineer with commit history helping review, or directly assisting fengpengboa/sunyuechi resolve their CLA blockers), not new implementation effort.

### 13.3 CI/CD Infrastructure
Zero riscv64 CI exists today and no open PR in the findings addresses this. This is a genuine, unclaimed gap requiring net-new engineering: adding a riscv64 job (most plausibly QEMU-based, since no confirmed native riscv64 runner fleet was found for this project) to `pr-jobs.yml`/`nightly.yml`, following the existing `build-linux-arm` job as a template.

### 13.4 Ecosystem Enablement
Not applicable under this report's Section 10 scoping criteria -- RocksDB is an embeddable storage-engine library, not a project with a large dependent-package ecosystem requiring separate riscv64 enablement. Downstream consumers checked (MariaDB's `mariadb-plugin-rocksdb`, Debian's `librust-oxrocksdb-sys-dev`) already have riscv64 builds per Ubuntu 24.04 findings, so no additional ecosystem-side investment is indicated by current data.

### 13.5 Summary Table

Effort figures below are this report's own estimate based on the verified scope of remaining work; they are not sourced from the research findings and should be treated as planning inputs, not measured data.

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Shepherd PR #14530 to merge (CLA resolution + review push) | 1-2 (advocacy/review, not implementation) | RISE-affiliated committer or reviewer | Critical |
| Functional | Add riscv64 branch to CMakeLists.txt (no open PR covers this) | 1-2 | New contributor | High |
| Functional | Fix INSTALL.md "Supported platforms" documentation gap | <0.5 | New contributor | Low |
| Performance | Shepherd PR #14536 (Zbc CRC32C) to merge | 1 (advocacy/review) | RISE-affiliated committer or reviewer | High |
| Performance | Shepherd PR #14894 (Zvbc CRC32C) to merge, contingent on #14536/#14530 | 1 (advocacy/review) | RISE-affiliated committer or reviewer | Medium (blocked) |
| Performance | Shepherd PR #14604 (XXH3 RVV sync), contingent on upstream xxHash tagging RVV | 0.5 (advocacy/review) | RISE-affiliated committer or reviewer | Medium (externally blocked) |
| CI/CD | Add riscv64 CI job (QEMU-based, mirroring `build-linux-arm`) | 2-3 | New contributor | High |
| CI/CD | Investigate/enable native riscv64 CI runner (if RISE hardware available) | 2-4 | RISE infrastructure team | Medium |

## 14. Updates
(No updates yet -- initial report dated 2026-06-17.)

## 15. References

- [PR #12139 - Add support for linux-riscv64](https://github.com/facebook/rocksdb/pull/12139)
- [Commit 5502f0672 (PR #12139)](https://github.com/facebook/rocksdb/commit/5502f0672908ce2c5891a3290bdfb57182435ad)
- [PR #8183 - Add check to cmake to see if we need to link against -latomic](https://github.com/facebook/rocksdb/pull/8183)
- [PR #9366 - Improve build detect for RISCV](https://github.com/facebook/rocksdb/pull/9366)
- [Commit 7d7e88c7d (PR #9366)](https://github.com/facebook/rocksdb/commit/7d7e88c7d1b676274f6e77daff88e4b696ff7e06)
- [PR #7060 - riscv64 need -latomic as library](https://github.com/facebook/rocksdb/pull/7060)
- [PR #9215 - fix: build on risc-v](https://github.com/facebook/rocksdb/pull/9215)
- [PR #10901 - fix: SIGILL caused by rdcycle prohibited by kernel on RISC-V](https://github.com/facebook/rocksdb/pull/10901)
- [PR #14484 - cmake: Add RISC-V architecture support (superseded)](https://github.com/facebook/rocksdb/pull/14484)
- [PR #14485 - cmake: Add RISC-V architecture support](https://github.com/facebook/rocksdb/pull/14485)
- [PR #14545 - Fix LLD linker detection in CMake for C++ exceptions](https://github.com/facebook/rocksdb/pull/14545)
- [PR #14546 - Fix LLD linker detection in Makefile for C++ exceptions](https://github.com/facebook/rocksdb/pull/14546)
- [PR #14530 - Fix multiple RISC-V build issues](https://github.com/facebook/rocksdb/pull/14530)
- [PR #14536 - RISC-V: Optimize crc32c with Zbc extension](https://github.com/facebook/rocksdb/pull/14536)
- [PR #14604 - util: sync xxhash.h with upstream dev for RISC-V RVV](https://github.com/facebook/rocksdb/pull/14604)
- [PR #14894 - Add vector-accelerated assembly code for RISC-V 64-bit architecture](https://github.com/facebook/rocksdb/pull/14894)
- [Issue #7051 - RocksDB build fails on riscv64](https://github.com/facebook/rocksdb/issues/7051)
- [Issue #10500 - build on riscv: g++: error: missing argument to '-march='](https://github.com/facebook/rocksdb/issues/10500)
- [Issue #11994 - Better -march set for RISC-V](https://github.com/facebook/rocksdb/issues/11994)
- [facebook/rocksdb CMakeLists.txt](https://github.com/facebook/rocksdb/blob/main/CMakeLists.txt)
- [facebook/rocksdb build_tools/build_detect_platform](https://github.com/facebook/rocksdb/blob/main/build_tools/build_detect_platform)
- [facebook/rocksdb Makefile](https://github.com/facebook/rocksdb/blob/main/Makefile)
- [facebook/rocksdb java/crossbuild/docker-build-linux.sh](https://github.com/facebook/rocksdb/blob/main/java/crossbuild/docker-build-linux.sh)
- [facebook/rocksdb INSTALL.md](https://github.com/facebook/rocksdb/blob/main/INSTALL.md)
- [evolvedbinary/docker-rocksjava](https://github.com/evolvedbinary/docker-rocksjava)
- [evolvedbinary/docker-rocksjava ubuntu20_riscv64/Dockerfile](https://github.com/evolvedbinary/docker-rocksjava/blob/main/ubuntu20_riscv64/Dockerfile)
- [evolvedbinary/docker-rocksjava alpine3_riscv64/Dockerfile](https://github.com/evolvedbinary/docker-rocksjava/blob/main/alpine3_riscv64/Dockerfile)
- [riseproject-dev/language-runtimes-wg#74](https://github.com/riseproject-dev/language-runtimes-wg/issues/74)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [PyPI rocksdb package JSON](https://pypi.org/pypi/rocksdb/json)
- [Ubuntu package search: RocksDB (noble)](https://packages.ubuntu.com/search?keywords=RocksDB&suite=noble&searchon=names&section=all)
- [Debian buildd status: rocksdb](https://buildd.debian.org/status/package.php?p=rocksdb)
- [Debian package tracker: rocksdb](https://tracker.debian.org/pkg/rocksdb)
- [Arch Linux RISC-V repository mirror](https://archriscv.felixc.at/repo/extra/)
- [rocksdb.org](https://rocksdb.org/)