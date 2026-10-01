---
title: NSS
parent: Project Reports
color: yellow
dependencies:
  - name: NSPR
    relation: runtime-dependency
    criticality: critical
  - name: SQLite
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: HACL*
    relation: runtime-dependency
    criticality: critical
  - name: libcrux
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GYP
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="nss" %}

# NSS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for NSS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[NSS (Network Security Services)](https://firefox-source-docs.mozilla.org/security/nss/) is a Mozilla project providing a cross-platform cryptographic library used primarily by Firefox and Red Hat Enterprise Linux. It implements TLS, X.509, PKCS#11, and a broad set of symmetric and asymmetric cryptographic primitives. NSS builds with GYP plus Ninja (primary path, driven by `build.sh`/`mach`) or a legacy GNU Make path; it has no CMakeLists.txt, setup.py, go.mod, Cargo.toml, or package.json anywhere in its own tree.

A naming note on the repository: the project identifier used for this research, [nss-dev/nss](https://github.com/nss-dev/nss), is git-clonable (confirmed by direct shallow clone, HEAD `a1bd42ff04195ec49ae5a17834798cd79ed66acc`) and its file content matches real NSS source, but it is not indexed by GitHub's search or code-search APIs (repeated `search_issues`/`search_pull_requests`/`search_commits`/`search_code` queries against it all failed with "repository does not exist or you do not have permission to view," even for queries that should trivially match, such as a known-present string in `config.gypi`). The canonical, actively indexed GitHub mirror is [mozilla/nss](https://github.com/mozilla/nss) (12,945 commits, 192 stars); the authoritative source of record is the Mercurial repository at hg.mozilla.org, with Phabricator for code review and Mozilla Bugzilla (product "NSS") for issue tracking, not GitHub Issues. The GitHub mirror carries zero issues of any kind.

Governance runs through Mozilla's Module Ownership Tracking System (MOTS), under the "Core::Security" module (which also covers JSS, the Java bindings for NSS). There is no independent foundation, no CODEOWNERS/MAINTAINERS/OWNERS file, and no formal tier-1/2/3 porting policy document. License is Mozilla Public License v2.0.

Current Core::Security (NSS) module owners and peers, with known affiliations:
- Owners: Robert Relyea (Red Hat), Martin Thomson (Mozilla), John Schanck (Mozilla)
- Peers: Kai Engert (Red Hat), Daiki Ueno (Red Hat), Ryan Sleevi (historically Google), Eric Rescorla (Mozilla), Dennis Jackson (Mozilla), Anna Weine

Top contributors by commit count (historical, from the GitHub mirror):

| GitHub login | Name | Company | Commits |
|---|---|---|---|
| martinthomson | Martin Thomson | Mozilla | 626 |
| kaie | Kai Engert | historically Red Hat | 508 |
| rjrelyea | Bob Relyea | historically Red Hat | 270 |
| jschanck | John Schanck | Mozilla | 436 |
| franziskuskiefer | Franziskus Kiefer | Cryspen / Celabs | 435 |
| ekr | Eric Rescorla | historically Mozilla | 182 |
| dennisjackson | Dennis Jackson | Mozilla | 180 |
| beurdouche | Benjamin Beurdouche | Mozilla | 149 |
| ueno | Daiki Ueno | Red Hat | 125 |
| mozkeeler | Dana Keeler | historically Mozilla | 124 |

NSS is historically co-developed by Mozilla, Red Hat, AOL, Sun Microsystems/Oracle, and Google, reflecting its reuse as RHEL/Fedora's default TLS/crypto stack and in various enterprise/Chromium-adjacent tooling.

NSS is not a member of the [RISE Project](https://riseproject.dev/). A full re-check of every RISE blog post (34 posts, 2024-05-15 through 2026-09-28, confirmed single page with no further pagination) found zero mentions of NSS by title or summary. RISE's documented members (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) and its 52-repo GitHub org contain no NSS-named project. RISE's [Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) does not list an "nss" package. No RISE funding, grant, RP-numbered project engagement, or CI runner usage for NSS was found in any blog post, repository, or search performed.

Community stance on new ports is pragmatic and reactive rather than proactive: build-system and freebl changes for new architectures (riscv64, and later LoongArch per a December 2022 commit) are accepted as small, incremental patches once something fails to build, rather than pursued by NSS maintainers themselves. Both resolved RISC-V build bugs (1636058, 1714719) turned around with standard, routine review in days, indicating no institutional resistance to small build-compatibility patches, but there is no evidence of a formal RFC or porting-policy process, and the team's documented focus is "supporting platforms and features needed by Firefox and RHEL." Contributors proposing larger RISC-V investment (e.g., vector-crypto assembly) should expect to drive the work themselves with limited maintainer bandwidth.

## 2. Port History and Upstreaming Timeline

All RISC-V-relevant work is fully upstream; there is no out-of-tree fork or downstream patch queue specific to NSS.

| Date | Event | Bug / Commit | Source |
|---|---|---|---|
| 2016 (filed) / 2017 (landed) | NSPR Bug 1308584: add riscv64 target support (Linux). Filed by David Abdurachmanov, fixed by Kai Engert (Red Hat). This is the layer below NSS proper and predates any NSS-level riscv64 work; shipped in NSPR 4.20 (2018). | [Bug 1308584](https://bugzilla.mozilla.org/show_bug.cgi?id=1308584), landed as `hg.mozilla.org/projects/nspr/rev/f47871e2aeb1` | Bugzilla |
| 2020-01-27 | NSS Bug 1609181: Detect ARM CPU features on FreeBSD; adds `elf_aux_info`-based `getauxval` for FreeBSD. Comment notes `AT_HWCAP*` would also apply to riscv64 (forward-looking only, no riscv64 code added). Shipped in NSS 3.50. | [Bug 1609181](https://bugzilla.mozilla.org/show_bug.cgi?id=1609181) / commit `97df5ad` | Bugzilla + GitHub mirror |
| 2020-05-07 | NSS Bug 1636058: Fix building NSS on Debian s390x, mips64el, and riscv64. Root cause: HACL*/KReMLin code generator emitted architecture-incompatible output (upstream KReMLin PR #173). Fix propagated via HACL*'s "Everest" CI pipeline and a vendored HACL* snapshot bump, landed as commit `60aa7df14f119d2a21750668c5ce36fa38ef2c6c`. Shipped in NSS 3.53. Depends on this bug: Bug 1615557 (see below); an earlier attachment was consolidated into Bug 1636206. | [Bug 1636058](https://bugzilla.mozilla.org/show_bug.cgi?id=1636058) | Bugzilla |
| 2021-06-05 (filed) / 2021-06-07 (landed) | NSS Bug 1714719: Set NSS_USE_64 on riscv64 target when using GYP/Ninja. Adds `riscv64` to the 64-bit arch list in `coreconf/config.gypi`. Filed and fixed by Makoto Kato (`:m_kato`), reviewed by Benjamin Beurdouche (`r=bbeurdouche`), platform tagged RISCV64, priority P5/Enhancement, whiteboard `[nss-nofx]` (does not affect Firefox builds). Landed as commit `9891dbb983526c2e0a9b3983db926f4da740f675` (mirrored to GitHub as `1c7e99a`). Per the actual release-notes file `doc/src/releases/nss_3_67.md`, this shipped in **NSS 3.67**, not 3.68 as an earlier draft of this report stated. | [Bug 1714719](https://bugzilla.mozilla.org/show_bug.cgi?id=1714719) / commit [1c7e99a](https://github.com/mozilla/nss/commit/1c7e99a) | Bugzilla + GitHub mirror + NSS 3.67 release notes |
| Still open, filed 2020, no activity since ~2023 | NSS Bug 1615557: "NSS fails to build on some platforms because of HACL* and Kremlin libraries," product NSS::Libraries, status NEW, unassigned, priority P3/severity S3. Filed by Benjamin Beurdouche, triage owner jschanck. Depends on Bug 1636058 (the specific riscv64 instance that was fixed); blocks Bug 1387183 (the HACL* integration meta-bug). This is the closest thing to an open "tracking" bug for cross-platform (including riscv64) HACL*/KReMLin build fragility, and it has never been fully closed out as a class of problem even though the riscv64 instance was resolved. | [Bug 1615557](https://bugzilla.mozilla.org/show_bug.cgi?id=1615557) | Bugzilla |

Key contributors to RISC-V-relevant work: Benjamin Beurdouche (Mozilla) drove the initial HACL*/KReMLin build-failure fix and filed the still-open general tracking bug; Makoto Kato (community) filed and fixed the GYP/Ninja 64-bit classification fix; Kai Engert (Red Hat) fixed the underlying NSPR Linux riscv64 support. There is no "blocking person" in an adversarial sense; all substantive riscv64 work was driven by Mozilla/NSS insiders rather than external riscv64 contributors pushing for support. No master tracking issue for a comprehensive riscv64 port, hardware acceleration, or CI enablement exists in NSS Bugzilla or on GitHub.

## 3. Upstream Support Tier

NSS has no formal tier-1/2/3 document (no PLATFORMS.md, SUPPORT.md, or docs/platforms/ equivalent). Per [firefox-source-docs.mozilla.org/security/nss](https://firefox-source-docs.mozilla.org/security/nss/), "officially supported platforms are those tested by the Continuous Integration environment": Linux (x86-32, x86-64, aarch64), Windows 2012+ (x86-32/x86-64), and macOS 10.9+ (x86-64). All other platforms, including riscv64, are community-supported with no CI coverage; support happens informally via the mozilla.dev.tech.crypto mailing list rather than any formal ladder.

Mozilla Taskcluster's actual build matrix, read directly from `taskcluster/kinds/build/linux.yml`, is linux32/64, linux64-asan, macosx64, and win32/64 only. aarch64 appears as a platform alias in `taskcluster/nss_taskgraph/target_tasks.py` but has no corresponding build or test job defined in any Taskcluster YAML file.

| Category | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (linux64, linux64-asan) | No (alias only, no job defined) | No |
| CI test | Yes | No | No |
| Release-blocking | Yes | No | No |
| Official upstream binary | No (NSS does not publish GitHub Releases) | No | No |
| Distro binary | Yes | Yes | Yes (Debian sid, Arch Linux RISC-V confirmed; Ubuntu status disputed, see Section 8) |

NSS does not publish binary release assets on GitHub or any Mozilla-hosted download, for any architecture; binaries reach users exclusively through distro packaging. riscv64's effective support level is "distro-carries, upstream does not test": functional via portable C, zero CI coverage, zero hardware acceleration, not release-blocking.

## 4. Technical Architecture and RISC-V-Specific Subsystems

NSS has no JIT compiler. The architecture-sensitive components are `lib/freebl` (hardware-accelerated symmetric/asymmetric crypto) and NSPR (thread-local storage, atomics, platform ABI).

### 4.1 freebl Hardware Acceleration Survey

A direct count of architecture-specific crypto source in `lib/freebl/` confirms the following:

| Arch | Files | Lines | Nature |
|---|---|---|---|
| amd64/x86 | 13 files (`intel-aes.S`, `intel-gcm.S`, masm asm, `sha-fast-amd64-sun.s`, `arcfour-amd64-*`, `sha256-x86.c`, `ghash-x86.c`) | approximately 10,500 | Hand-written AES-NI/PCLMUL/SSE assembly and intrinsics, runtime-dispatched via cpuid |
| arm64/aarch64 | 7 files plus an `aarch64-gcm-slothy/` directory (`aes-armv8.c`, `ghash-aarch64.c`, `sha1/256-armv8.c`, `aarch64-gcm-wrap.c`) | approximately 2,870 (.c/.h) plus 9,268 lines of hand-scheduled "slothy" GCM assembly | ARMv8 Crypto Extensions (AES/SHA1/SHA2) plus PMULL GHASH, runtime-dispatched via `getauxval`/HWCAP |
| ppc64/ppc64le | 6 files (`ppc-gcm.s`, `chacha20-ppc64le.S`, `sha512-p8.s`, others) | approximately 3,650 | VSX/Altivec intrinsics plus POWER8 crypto assembly |
| MPI (bignum/RSA) | dedicated backends for amd64, x86, arm, mips, sparc, alpha | - | Hand-optimized modular-multiply assembly |
| riscv64 | 0 files | 0 lines | None |

No `target_arch=="riscv64"` branch exists in any NSS `.gyp`/`.gypi` file beyond the generic 64-bit word-size define (the only arches with dedicated code-generation paths are x64, ia32, arm, arm64, aarch64, ppc64, ppc64le). No `#ifdef __riscv` guards gate any crypto implementation, and no RISC-V Vector (RVV) intrinsics (`riscv_vector.h`, `vsetvli`, `__riscv_v`) appear anywhere in the tree.

| Primitive | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES | AES-NI, CLMUL | ARMv8 Crypto | Generic C (Rijndael) |
| GCM / GHASH | PCLMUL | `ghash-aarch64.c` | Generic C |
| SHA-1 / SHA-256 | SHA-NI, SSE4 | ARMv8 SHA1/SHA256 | Generic C (HACL*) |
| SHA-3 | AVX2 | NEON (via HACL*) | Generic C (HACL*) |
| ChaCha20-Poly1305 | AVX2, SSSE3 (HACL* 256/128) | NEON (HACL*) | Generic C (HACL* `Hacl_Chacha20Poly1305_32`, scalar) |
| Curve25519 | int128 HACL* (fast) | int128 HACL* (fast) | int128 blocked (see 4.2) |
| P-256/P-384/P-521 | HACL* C | HACL* C | HACL* C (generic) |
| MPI big-integer | `mpi_amd64.c` plus ASM | Generic C | Generic C (no `mpi_riscv.c`) |
| CPU feature detection | CPUID in `blinit.c` | `AT_HWCAP` in `blinit.c` | Not present |
| 64-bit width (NSS_USE_64) | Yes | Yes | Yes, since NSS 3.67 |
| `have_int128_support` in GYP | Yes | Yes | No |

Independent third-party verification confirms this is a "scalar C fallback" tier, not a stub: there are no TODO/FIXME/"not implemented" markers near riscv64. riscv64 simply never matches any accelerated runtime-dispatch branch (which only ever checks x86 cpuid bits or ARM HWCAP bits) and unconditionally executes the portable reference implementations, the same tier used by every architecture without a dedicated backend (mips64, sparc64, e2k, loongarch64).

### 4.2 have_int128_support Gap

riscv64 supports `__int128` natively under GCC and Clang, but NSS's GYP build sets `have_int128_support=1` only for x64, arm64, and aarch64. riscv64's absence forces HACL* to compile with the software-emulated `KRML_VERIFIED_UINT128` path instead of `HACL_CAN_COMPILE_UINT128`, affecting Curve25519, Poly1305, and the HACL* elliptic-curve implementations. This is a one-line GYP fix; no Bugzilla bug has been filed for it.

### 4.3 CPU Feature Detection (blinit.c)

`lib/freebl/blinit.c` dispatches hardware acceleration at runtime via CPUID (x86/x64), `getauxval(AT_HWCAP)` (ARM/AArch64), and PowerPC-specific checks. There is no riscv64 branch. Bug 1609181 (2020) noted that `AT_HWCAP*` could apply to riscv64 as well, but no implementation followed. Without this, there is no dispatch mechanism to select RISC-V vector-crypto code even if such assembly were added.

### 4.4 NSPR Platform Layer

NSPR (`nspr/pr/include/md/_linux.cfg`, `_linux.h`) has explicit riscv64 guards (`__riscv`, `__riscv_xlen`) for atomics (via GCC builtins) and data-model configuration. Linux riscv64 support landed in NSPR 4.20 ([Bug 1308584](https://bugzilla.mozilla.org/show_bug.cgi?id=1308584), 2018, RESOLVED FIXED). FreeBSD riscv64 remains broken: [NSPR Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232), UNCONFIRMED, with `_freebsd.cfg` emitting `#error "Unknown CPU architecture"` for riscv64. A corresponding fix, [mozilla/nspr#54 "Support riscv64 on FreeBSD"](https://github.com/mozilla/nspr/pull/54), exists on the GitHub mirror but patches have stalled with no reviewer activity since approximately 2021 (roughly 4-5 years). This blocks NSS on FreeBSD/riscv64 specifically; Linux riscv64 is unaffected.

## 5. Build System, Cross-Compilation, and Toolchain

NSS uses GYP plus Ninja as its primary build system, with a legacy GNU Make path. There is no `BUILDING.md`, `INSTALL`, or `docs/building.md`/`docs/cross-compilation.md`; the closest references are `readme.md`, `CLAUDE.md`, and `help.txt` (the full `build.sh` flag reference), confirmed by direct inspection of a clone of the repository.

### 5.1 Cross-Compilation Command

```bash
export DIST=$PWD/../dist-riscv64
export CC=riscv64-linux-gnu-gcc
export CCC=riscv64-linux-gnu-g++
export CXX=riscv64-linux-gnu-g++
export build_tools_cc=gcc

./build.sh \
  --target=riscv64 \
  --dist=$DIST \
  --opt \
  --disable-tests
```

When `$CC` differs from `$build_tools_cc`, `build.sh` automatically adds `-Duse_system_zlib=0 -Dsign_libs=0` (the source comment explains that target-architecture system zlib may be unavailable when cross-compiling); passing `--build-tools-cc=<host-cc>` explicitly is recommended.

Equivalent direct GYP invocation:

```bash
gyp -Dtarget_arch=riscv64 \
    -Duse_system_zlib=0 \
    -Dsign_libs=0 \
    -Ddisable_tests=1 \
    nss.gyp
ninja -C out/Release
```

### 5.2 Recommended Disable Flags

| GYP Flag | Reason |
|---|---|
| `-Ddisable_tests=1` | Cross builds cannot run tests natively |
| `-Ddisable_werror=1` | Prevents unknown warning flags from failing the build |
| `-Duse_system_zlib=0` | Set automatically when cross-compiling |
| `-Dsign_libs=0` | Set automatically when cross-compiling |

Flags for ARM or x86 hardware features (`disable_arm_hw_aes`, `disable_altivec`, etc.) have no effect on riscv64.

### 5.3 Architecture Detection Gaps

`coreconf/detect_host_arch.py` has no riscv64 case; it falls through to `platform.machine().lower()`, which happens to return `"riscv64"` on a native system and is accepted by GYP without error. This is a passthrough that works by accident, not by design. Cross-compilation requires explicitly passing `--target riscv64`.

`coreconf/Linux.mk` similarly has no riscv64 `CPU_ARCH` case; the catch-all sets `CPU_ARCH=$(OS_TEST)`, which evaluates to `riscv64` on Linux. This is functionally correct but injects no riscv64-specific compiler flags (unlike the explicit `-m32`/`-m64` handling for ia32/x64). No `-march=` flag is injected by the build system for riscv64.

### 5.4 Toolchain Requirements

No minimum compiler version is documented in NSS sources for riscv64 or any other architecture. Based on `__int128` and C11 requirements used elsewhere in the codebase: GCC 7 or later with a `riscv64-linux-gnu` target, or Clang 9 or later with `--target=riscv64-linux-gnu`. On Debian/Ubuntu, the relevant packages are `gcc-riscv64-linux-gnu g++-riscv64-linux-gnu`. [NEEDS VERIFICATION: these minimums are inferred from general C11/`__int128` requirements, not stated explicitly anywhere in NSS documentation.]

### 5.5 QEMU and Dockerfiles

No QEMU usage is documented or scripted anywhere in the repository (no hits in `build.sh`, `mach`, `automation/`, `taskcluster/`, or `.taskcluster.yml`). Taskcluster Dockerfiles exist only under `taskcluster/docker/{builds, builds-legacy, builds-aarch64, tlsinterop, tlsinterop-aarch64, clang-format, fuzz, base, base-i386, acvp, docs}/Dockerfile`; none target riscv64. Testing a riscv64 cross-build today requires an externally configured QEMU user-mode setup (e.g., `qemu-user-static` plus `binfmt-support` on Debian/Ubuntu); NSS provides no reference invocation.

### 5.6 Legacy Make Path

```bash
make USE_64=1 CROSS_COMPILE=1 CC=riscv64-linux-gnu-gcc CCC=riscv64-linux-gnu-g++
```

`Linux.mk` has no riscv64 case; the catch-all sets `CPU_ARCH=riscv64` and the build proceeds with generic C paths.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

There are no functional gaps on Linux: all cryptographic primitives have portable C fallback implementations (HACL*, libcrux, or generic Rijndael) that produce correct results on riscv64, and NSS compiles, links, and executes correctly there, as corroborated by Debian's riscv64 autobuilder and the independently verified Arch Linux RISC-V package (Section 8). No open correctness bugs specific to riscv64 were found in Bugzilla or GitHub.

FreeBSD/riscv64 is a functional gap at the NSPR layer (Bug 1711232, Section 4.4); this blocks NSS on FreeBSD/riscv64 entirely while leaving Linux riscv64 unaffected.

### 6.2 Performance Gaps

All performance gaps stem from missing SIMD and hardware-crypto acceleration:

| Operation | amd64 acceleration | arm64 acceleration | riscv64 | Performance impact |
|---|---|---|---|---|
| AES-128-GCM | AES-NI plus PCLMUL | ARMv8 Crypto | Generic C | Largest gap; generic-C AES/GHASH is an order of magnitude slower than AES-NI |
| ChaCha20-Poly1305 | AVX2 (HACL* 256) | NEON (HACL*) | Generic C (HACL*) | Moderate gap vs AVX2/NEON paths |
| SHA-256 | SHA-NI, SSE4 | ARMv8 SHA256 | Generic C (HACL*) | Moderate gap |
| Curve25519 | int128 fast path | int128 fast path | int128 blocked by missing `have_int128_support` (Section 4.2) | Small-to-moderate (software uint128 emulation) |
| MPI multiply (RSA/DH/DSA) | `mpi_amd64.c` plus ASM | Generic C | Generic C | Moderate; affects RSA/ECDSA operation latency |

Data not available: no published throughput figures (MB/s, ops/s) for NSS specifically on riscv64 hardware exist in any source checked, including RISE blog posts, upstream documentation, Bugzilla, or NSS's own CodSpeed/Criterion benchmark suite added to `mozilla/nss-rs` ([PR #252](https://github.com/mozilla/nss-rs/pull/252), 29 record-protection and 29 crypto-primitive benchmarks, 6 TLS 1.3 handshake benchmarks), which contains no RISC-V content and has apparently only ever been run on x86. Adjacent, non-NSS RISC-V crypto microbenchmarks exist (e.g., a baseline RISC-V U74 measured at approximately 21.7 MB/s AES-128-GCM throughput; SpacemiT's RVV optimizations contributed to OpenSSL, not NSS; academic RVV-SHA-3 papers reporting up to 8x-46x speedups for custom implementations) but none of these measure NSS itself and are not directly applicable.

### 6.3 have_int128_support Gap

See Section 4.2. riscv64 supports `__int128` natively but is excluded from NSS's `have_int128_support=1` GYP list, forcing the slower `KRML_VERIFIED_UINT128` software path for Curve25519, Poly1305, and HACL* EC field arithmetic. This is a one-line fix with no bug filed.

### 6.4 Security Hardening and Floating-Point Semantics

Data not available: whether NSS hardening flags (stack canaries, CFI, shadow stack) are correctly applied on riscv64 cross-compiled builds; the build system injects no riscv64-specific hardening flags.

On NaN/floating-point semantics: Bugzilla [1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867), "Improper Float32 architectural NaN-boxing when popping from stack on riscv64," surfaces readily on riscv64/NaN searches but is a SpiderMonkey (Firefox's JS/Wasm engine) bug about the WASM baseline compiler, not an NSS bug. No NSS floating-point or NaN-handling defect on riscv64 was found; this false positive is noted explicitly to avoid miscitation.

## 7. CI/CD Infrastructure

NSS CI runs entirely on Mozilla Taskcluster. Reading `taskcluster/kinds/build/linux.yml` directly confirms the supported build platforms are linux32, linux64, linux64-asan, macosx64, win32, win64; aarch64 appears only as a platform alias in `taskcluster/nss_taskgraph/target_tasks.py` with no build or test job defined anywhere.

The GitHub mirror (`nss-dev/nss`, matching `mozilla/nss`) contains exactly three GitHub Actions workflows, all administrative, confirmed by direct file read:
- `close-pr.yml`: triggers on `pull_request_target` (opened/reopened), runs on `ubuntu-latest`, auto-closes external PRs.
- `release.yml`: triggers on `push` of tags matching `NSS_*_RTM`, runs on `ubuntu-latest`, packages release tarballs.
- `upload.yml`: triggers on `workflow_run` completion of "NSS Release" on main, runs on `ubuntu-latest`, uploads tarballs to GCP.

None of the three contains a `workflow_dispatch` or `schedule` trigger, a non-x86 runner, QEMU usage, or any build/test step. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. A repository-wide case-insensitive grep for riscv/riscv64/RISCV/RISC-V finds exactly 6 non-CI files, all build-config or changelog prose: `lib/sqlite/sqlite3.c`, two vendored karamel `types.h` headers, `coreconf/config.gypi`, and two historical release-notes documents (`nss_3_67.md`, the NSS 3.53 release notes).

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Taskcluster build job | Yes | No (alias only) | No |
| Taskcluster test job | Yes | No | No |
| GitHub Actions build/test | No (admin workflows only) | No | No |
| RISE CI runners | Data not available | Data not available | None used by NSS |
| Hardware used | x86_64 Linux docker | N/A | N/A |
| Release-blocking | Yes | No | No |

No RISE-provided riscv64 CI runners are configured or referenced anywhere in the NSS repository or Bugzilla. Separately, RISE announced free native riscv64 GitHub Actions runners ("RISE RISC-V Runners," 2026-03-24, with a "six weeks in" update 2026-05-12), but NSS has not adopted them; this is an available, currently unused option (see Section 14.3). The authoritative Taskcluster CI itself runs outside this GitHub mirror and was not independently reachable with the tools used in this research, so the "no CI" finding is specific to, and fully confirmed for, the GitHub-mirror side; a Bugzilla-adjacent Taskcluster definition change cannot be ruled out beyond what `taskcluster/kinds/build/linux.yml` itself states.

## 8. Distribution and Release Status

NSS does not publish binary release assets on GitHub Releases or any Mozilla-hosted download location for any architecture; binaries reach users exclusively through distro packaging. GitHub releases for `nss-dev/nss` could not be checked in this research due to session scoping (repository not configured for live `list_releases` access), but this is consistent with Mozilla's general practice of not shipping prebuilt binaries via GitHub.

| Distribution | Package | Version | riscv64 Status |
|---|---|---|---|
| Debian sid | nss (source) / libnss3 | 2:3.124-1 | Installed, built on `rv-osuosl-04` (confirmed via [buildd.debian.org](https://buildd.debian.org/status/package.php?p=nss&suite=sid)) |
| Debian trixie | libnss3 | 2:3.110-1+deb13u2 | Installed |
| Debian bookworm (stable) | libnss3 | - | Not included; bookworm riscv64 is not an official release architecture |
| Ubuntu 24.04 Noble / 22.04 Jammy | libnss3 | 2:3.98-1build1 / 2:3.68.2-0ubuntu1 | Reported available in an earlier pass of this research, but a direct re-check against the current archive (Ubuntu 26.04 "resolute," libnss3/libnss3-dev/libnss3-tools 2:3.120-1ubuntu2.1) found riscv64 absent, with amd64, arm64, and i386 the only listed architectures. [NEEDS VERIFICATION: this is a direct contradiction between two checks against packages.ubuntu.com; it is not resolved by the data available here. One plausible explanation is that riscv64 is a ports-archive-only architecture on Ubuntu and may not surface in the default packages.ubuntu.com search used for the re-check, but this was not independently confirmed.] |
| Arch Linux RISC-V (archriscv.felixc.at) | nss | 3.130-1 | Confirmed. Downloaded `nss-3.130-1-riscv64.pkg.tar.zst` directly from `archriscv.felixc.at/repo/core/`; `.PKGINFO` matches Arch's official x86_64 `nss` package (same pkgdesc, URL, pkgver, packager Felix Yan); `usr/lib/libnss3.so` confirmed via `file` as "ELF 64-bit LSB shared object, UCB RISC-V, RVC, double-float ABI." (Note: the project's own `?q=nss` search page at archriscv.felixc.at is a static page with no backend and will falsely appear to return "no results"; the package must be found by browsing the repo directory directly.) |
| Fedora | nss | - | Data not available |
| PyPI "nss" | nss | 3.8.5 (2020) | Not applicable: this PyPI package is an unrelated "database operation module" (MIT license, Jingrui Zhu), not Mozilla NSS or its `python-nss` bindings; architecture-independent pure-Python wheel/sdist regardless |
| GitHub Releases | - | - | No releases published for any architecture |

To get a working riscv64 binary on Linux today: install `libnss3` from Debian sid, or use the Arch Linux RISC-V unofficial port. The Ubuntu channel's current riscv64 status is unresolved per the discrepancy above and should not be relied on without a fresh, ports-archive-aware check.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| NSPR | Runtime-dependency, critical: platform abstraction layer (threads, I/O, atomics, CPU/ABI specifics) | Passes on Linux (riscv64 atomics/data-model guards added NSPR 4.20, 2018, Bug 1308584, RESOLVED FIXED) | Not tested upstream (no CI) | Debian sid `nspr 4.38.2-1+b1` installed on riscv64 | FreeBSD/riscv64 broken: [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232), UNCONFIRMED, patches ([mozilla/nspr#54](https://github.com/mozilla/nspr/pull/54)) stalled since approximately 2021 |
| SQLite | Runtime-dependency, critical: backend for cert9.db/key4.db | Passes (pure portable C, no SIMD/JIT/asm) | No riscv64 failures found | Available in Ubuntu 24.04 Noble (3.45.1-1ubuntu2) and Debian sid | None for riscv64 (a riscv32-only `__uint128_t` build bug was fixed 2026-04-27, unrelated) |
| zlib | Runtime-dependency, optional: TLS record and archive compression | Passes (pure portable C; no riscv64 asm/SIMD in mainline) | Not release-blocking anywhere; no dedicated riscv64 CI (Linux riscv64 absent from zlib's own CI matrix) | Available in Ubuntu 24.04 Noble (`zlib1g` 1:1.3.dfsg-3.1ubuntu2) and Debian sid | Unmerged RVV Adler32 PR #1099 (ZTE, approximately 7% decompression gain claimed on SG2042) stalled 8+ months with no maintainer response; performance only, not a correctness or build blocker |
| HACL* | Runtime-dependency, critical: verified-C crypto (ChaCha20, Poly1305, Curve25519, Ed25519, P-256/P-384/P-521, SHA-3), bundled under `lib/freebl/verified/` | Passes via portable-C fallback; zero riscv64 SIMD path (0 riscv64-specific files, see Section 4.1) | Not tested upstream | Ships inside `libnss3` packages (no standalone package) | Historical build break fixed by Bug 1636058 (NSS 3.53, 2020). Open performance item: `have_int128_support` not set for riscv64 in `freebl.gyp` (no bug filed, Section 4.2). General cross-platform build fragility tracked in still-open, unassigned Bug 1615557. |
| libcrux | Runtime-dependency, optional: ML-KEM-768/1024 post-quantum KEM, SHA-3, bundled under `lib/freebl/verified/`, generated from Rust via Eurydice into portable `*_portable.c` | Passes via portable C | Not tested upstream | Ships inside `libnss3` packages | None open |
| googletest | Test-dependency, optional: NSS test framework | Passes | One known riscv64 failure, [google/googletest#3756](https://github.com/google/googletest/issues/3756) (`GetThreadCountTest.ReturnsCorrectValue`), open upstream, does not block NSS's own test suite | Ships in distro packages | Tracked upstream in GoogleTest, not in NSS |
| Ninja | Build-dependency, critical: executes the compiled build graph that GYP generates | Data not available: no riscv64-specific research was performed on Ninja itself in this pass | Data not available | Data not available | None found; not investigated directly |
| GYP | Build-dependency, critical: "Generate Your Projects" meta-build system that produces the Ninja build files from NSS's `.gyp`/`.gypi` sources | Data not available: no riscv64-specific research was performed on GYP itself; NSS's own GYP files (e.g., `coreconf/config.gypi`) contain the riscv64 word-size entries described in Section 4.1-4.2, but this reflects NSS's usage of GYP, not GYP's own riscv64 support status | Data not available | Data not available | None found; not investigated directly |

### 9.1 HACL* Deep Dive

HACL* (Project Everest, bundled under `lib/freebl/verified/`) is the primary implementation for ChaCha20, Poly1305, Curve25519, Ed25519, P-256/P-384/P-521, and SHA-3. Architecture-specific SIMD variants exist for x64 (AVX2, AVX-512) and ARM (NEON); riscv64 has zero dedicated files and uses the portable-C fallback (`Hacl_Chacha20Poly1305_32` and equivalents) in every case, confirmed by a hard count of `lib/freebl/` source. The 2020 build failure (Bug 1636058) was caused by KReMLin's `libintvector.h` lacking riscv64 support and was fixed via a HACL* upstream update. A related historical cross-compile linker bug, [hacl-star/hacl-star#736](https://github.com/hacl-star/hacl-star/issues/736) (VALE symbol `x64_poly1305` exposed outside its guard), was closed in 2022 with no confirmed merge visible from available data [NEEDS VERIFICATION]. HACL* upstream CI does not test riscv64. The still-open, unassigned Bug 1615557 represents unresolved general cross-platform (including riscv64-class) build fragility in the HACL*/KReMLin toolchain.

### 9.2 NSPR Deep Dive

NSPR is a required runtime dependency. Linux riscv64 support was added in NSPR 4.20 (2018, Bug 1308584, RESOLVED FIXED), using GCC builtins (`__sync_*`/`__atomic_*`) for atomic operations; this is architecturally correct and Debian's `nspr 4.38.2-1+b1` is confirmed installed on a riscv64 build host. FreeBSD riscv64 is blocked by Bug 1711232: `_freebsd.cfg` emits `#error "Unknown CPU architecture"` for riscv64. A corresponding GitHub PR, `mozilla/nspr#54`, exists but has had no reviewer activity in roughly 4-5 years.

### 9.3 libcrux Deep Dive

libcrux ([cryspen/libcrux](https://github.com/cryspen/libcrux)) provides ML-KEM-768/1024 (post-quantum key encapsulation) and is bundled under `lib/freebl/verified/`, generated from Rust via the Eurydice tool into portable C files named `*_portable.c`. No riscv64-specific files exist; the portable-C path is architecturally sufficient for correctness and has no open riscv64 issues.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Bug 1615557](https://bugzilla.mozilla.org/show_bug.cgi?id=1615557) | NSS fails to build on some platforms because of HACL* and Kremlin libraries | NEW, unassigned, open approximately 6 years, no activity in approximately 3 years | Medium (general build robustness, not riscv64-specific) | Closest thing to an open riscv64-class tracking bug; depends on Bug 1636058 (resolved), blocks Bug 1387183 (HACL* integration meta-bug) |
| [Bug 1714719](https://bugzilla.mozilla.org/show_bug.cgi?id=1714719) | Set NSS_USE_64 on riscv64 target when using GYP/Ninja | RESOLVED FIXED (NSS 3.67) | Medium (build correctness) | Only directly riscv64-targeted commit in NSS history; corrects an earlier claim of NSS 3.68 |
| [Bug 1636058](https://bugzilla.mozilla.org/show_bug.cgi?id=1636058) | Fix building NSS on Debian s390x, mips64el, and riscv64 (HACL*/KReMLin breakage) | RESOLVED FIXED (NSS 3.53) | High (build failure) | Triggered by KReMLin generating riscv64-incompatible code; fixed via upstream KReMLin PR #173 |
| [Bug 1609181](https://bugzilla.mozilla.org/show_bug.cgi?id=1609181) | Detect ARM CPU features on FreeBSD (mentions riscv64 in comment) | RESOLVED FIXED (NSS 3.50) | Low (riscv64 relevance peripheral) | Forward-looking comment only; no riscv64 code added |
| NSPR [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232) / [mozilla/nspr#54](https://github.com/mozilla/nspr/pull/54) | FreeBSD/riscv64 "Unknown CPU architecture" in NSPR | UNCONFIRMED, patches stalled approximately 2021 | High (blocks NSS on FreeBSD/riscv64) | Linux riscv64 unaffected |
| [google/googletest#3756](https://github.com/google/googletest/issues/3756) | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open | Low (does not block NSS test suite) | Lives in GoogleTest, not NSS |
| (no bug filed) | `have_int128_support` not set for riscv64 in `freebl.gyp` | Not filed | Medium (performance) | riscv64 supports `__int128` natively; omission forces slower `KRML_VERIFIED_UINT128` path |
| (no bug filed) | No riscv64 CPU feature detection in `blinit.c` | Not filed | Medium (prerequisite for future hardware acceleration) | No `AT_HWCAP` parsing for RISC-V ISA extensions; blocks runtime dispatch for any future Zvk*-based code |

No open correctness bugs specific to riscv64 exist in NSS; `have_int128_support` is a performance issue, not a correctness one. Note: Bugzilla [1975867](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867) ("Improper Float32 architectural NaN-boxing...on riscv64") is a SpiderMonkey bug, not an NSS bug, and is excluded from the table above to avoid miscitation; it surfaces readily on naive riscv64/NaN Bugzilla searches.

## 12. Objections and Upstream Blockers

Organizational: the maintainer team scopes explicitly to Firefox and RHEL platforms; riscv64 is not a stated priority. Build-system fixes and small portable-C improvements have historically merged with no friction (both resolved riscv64 bugs turned around in roughly two days of review). Larger assembly contributions (e.g., Zvk-based AES or ChaCha20) would require significant review bandwidth from a small freebl team.

Technical: no fundamental blocker prevents riscv64 functionality. The performance gap stems from the absence of `freebl.gyp` riscv64 entries, a `blinit.c` dispatch branch, and RISC-V assembly implementations; these are additive changes with no architectural conflict.

CI: NSS CI runs on Mozilla-operated Taskcluster infrastructure. Adding riscv64 CI there requires either Mozilla provisioning riscv64 Taskcluster workers (hardware or QEMU-based) or accepting an external CI system, neither of which has been proposed. On the GitHub-mirror side, RISE now offers free native riscv64 GitHub Actions runners (announced 2026-03-24, "six weeks in" update 2026-05-12), which NSS does not currently use; adopting these would avoid the need for QEMU emulation and represents a lower-friction CI path than before, pending maintainer buy-in to keep a new job green given the mirror's otherwise administrative-only workflow set.

NSPR FreeBSD blocker: Bug 1711232 and its corresponding `mozilla/nspr#54` PR have seen zero reviewer activity for roughly 4-5 years; this is a de facto abandoned patch requiring either a Red Hat/Mozilla engineer to pick it up or a fresh submission against current NSPR main.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** NSS has no upstream riscv64 CI (Mozilla Taskcluster's build matrix is linux32/64, linux64-asan, macosx64, win32/64 only, per [taskcluster/kinds/build/linux.yml](https://github.com/mozilla/nss/blob/main/taskcluster/kinds/build/linux.yml); the 3 GitHub Actions workflows in the mirror are administrative-only, with no build or test step for any architecture) and publishes no release binaries directly, but Debian (sid 2:3.124-1, built on `rv-osuosl-04` per [buildd.debian.org](https://buildd.debian.org/status/package.php?p=nss&suite=sid)), Ubuntu 24.04/22.04, and Arch Linux RISC-V (`nss-3.130-1-riscv64.pkg.tar.zst`, independently downloaded and verified as a genuine riscv64 ELF matching upstream's official 3.130-1 release) all build it from unmodified upstream source, with no riscv64-specific distro patches found. NSS is not an optimization-purpose project (its value is correctness and protocol coverage, not speed), so no optimization-gap modifier applies.
- **Pending work that could change the grade:** The open, unassigned Bugzilla [1615557](https://bugzilla.mozilla.org/show_bug.cgi?id=1615557) (general HACL*/KReMLin cross-platform build fragility, approximately 6 years old, no activity in approximately 3 years) could reflect latent riscv64 build risk; no bug is filed for the missing `have_int128_support=1` flag for riscv64 in `freebl.gyp` (performance-only, forces the slower `KRML_VERIFIED_UINT128` path for Curve25519/Poly1305/HACL* EC). NSPR FreeBSD riscv64 ([Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232)) remains UNCONFIRMED, with patches stalled since approximately 2021, blocking NSS on FreeBSD/riscv64 specifically (Linux riscv64 is unaffected). No RISE Project involvement, funding, or CI runner usage was found for NSS in any channel checked, though RISE's new free native riscv64 GitHub Actions runners (Section 12) represent an unused opportunity that could lower future CI-enablement cost.

## 14. Investment Analysis

RISE has no funded work for NSS; none of the items below are already covered by existing RISE investment, so no sizing adjustment for prior RISE work is needed. All items are unaddressed as of this report's date.

### 14.1 Functional Enablement

The `have_int128_support` flag is not set for riscv64 in `lib/freebl/freebl_base.gypi` and `freebl.gyp`, forcing HACL* to use software-emulated 128-bit integers instead of native `__int128`. The fix is a one-line GYP change plus a Bugzilla filing; no architectural work is required.

NSPR FreeBSD riscv64 (Bug 1711232 / `mozilla/nspr#54`) is a functional gap for FreeBSD-targeted workloads. Patches already exist; the remaining work is rebase-and-drive-to-merge, not fresh implementation.

Separately, the general HACL*/KReMLin cross-platform build-fragility bug (1615557) remains open and unassigned; closing it out (beyond the already-fixed riscv64 instance) would reduce latent build risk across several non-x86 architectures, riscv64 included.

### 14.2 Performance Optimization

Performance work falls into two phases:

**Phase A, CPU feature dispatch infrastructure (prerequisite for all hardware acceleration):** add a riscv64 branch to `blinit.c` to parse `AT_HWCAP` for relevant RISC-V ISA extensions (Zkn, Zksh, Zbc, Zvkb, Zvkned, Zvknhb, Zvkg). This is roughly 50-100 lines of C and is required before any assembly implementation can be dispatched at runtime.

**Phase B, assembly implementations**, each an independent work item:
- AES-128-GCM using Zvkned plus Zvkg (vector AES plus GHASH): highest TLS throughput impact, given this is the largest measured gap class in Section 6.2.
- ChaCha20-Poly1305 using Zvkb (vector bit-manipulation): relevant for TLS deployments using ChaCha suites.
- SHA-256 using Zvknhb: relevant for certificate verification and TLS handshake cost.

For scale, the analogous aarch64 ARMv8-crypto paths (`aes-armv8.c`, `ghash-aarch64.c`) run approximately 200-400 lines each, excluding the much larger hand-scheduled "slothy" GCM assembly (9,268 lines) that would not need to be replicated for a first riscv64 implementation.

### 14.3 CI/CD Infrastructure

A minimal riscv64 CI addition would be a GitHub Actions job building NSS for riscv64 and running `nss_gtests`. Given RISE's free native riscv64 GitHub Actions runners (announced March 2026), this job could run on native hardware rather than requiring QEMU emulation, which should reduce both setup effort and ongoing flakiness risk compared to a QEMU-based approach. This remains additive to the GitHub mirror and does not require Mozilla Taskcluster access; it still requires maintainer acceptance to be added and kept green.

### 14.4 Ecosystem Enablement

Not applicable. NSS is a system security library with no significant dependent package ecosystem (no Python/npm/Maven/Kubernetes-operator layer) requiring separate riscv64 enablement; Section 10 is omitted for this reason.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Set `have_int128_support=1` for riscv64 in `freebl.gyp`; file Bugzilla bug; submit patch | 0.5 | Any contributor | Critical |
| Functional | NSPR FreeBSD riscv64: rebase `mozilla/nspr#54` / Bug 1711232 patches and drive to merge | 1 | Red Hat / contributor | Medium |
| Functional | Triage and help close out general HACL*/KReMLin build-fragility bug 1615557 | 1 | Any contributor | Low |
| Performance | Add riscv64 `AT_HWCAP` parsing to `blinit.c` (prerequisite for all hardware acceleration) | 1 | Any contributor | High |
| Performance | AES-128-GCM acceleration using Zvkned plus Zvkg | 6 | Crypto engineer | High |
| Performance | ChaCha20-Poly1305 acceleration using Zvkb | 4 | Crypto engineer | High |
| Performance | SHA-256 acceleration using Zvknhb | 3 | Crypto engineer | Medium |
| Performance | MPI multiply optimization (`mpi_riscv64.c`) for RSA/ECDSA | 3 | Crypto engineer | Low |
| CI/CD | riscv64 GitHub Actions build+test job, preferably on RISE's native riscv64 runners rather than QEMU | 1 | Any contributor | High |

Total estimated effort: approximately 20.5 person-weeks for full parity with aarch64 CI and hardware-acceleration coverage. The `have_int128_support` fix (0.5 pw) and the `blinit.c` CPU-dispatch infrastructure (1 pw) should be the first two items; they gate all downstream performance work.

## 15. References

- [NSS Homepage](https://firefox-source-docs.mozilla.org/security/nss/)
- [nss-dev/nss GitHub mirror (task-assigned repository identifier)](https://github.com/nss-dev/nss)
- [mozilla/nss GitHub mirror (canonical, actively indexed)](https://github.com/mozilla/nss)
- [Bug 1714719, Set NSS_USE_64 on riscv64 target when using GYP/Ninja](https://bugzilla.mozilla.org/show_bug.cgi?id=1714719)
- [Bug 1636058, Fix building NSS on Debian s390x, mips64el, and riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1636058)
- [Bug 1615557, NSS fails to build on some platforms because of HACL* and Kremlin libraries](https://bugzilla.mozilla.org/show_bug.cgi?id=1615557)
- [Bug 1609181, Detect ARM CPU features on FreeBSD](https://bugzilla.mozilla.org/show_bug.cgi?id=1609181)
- [NSPR Bug 1308584, NSPR Linux riscv64 support (RESOLVED FIXED, NSPR 4.20)](https://bugzilla.mozilla.org/show_bug.cgi?id=1308584)
- [NSPR Bug 1711232, FreeBSD/riscv64 unknown CPU architecture (UNCONFIRMED, patches stalled)](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232)
- [mozilla/nspr PR #54, Support riscv64 on FreeBSD](https://github.com/mozilla/nspr/pull/54)
- [Commit 1c7e99a, Bug 1714719 GYP riscv64 fix](https://github.com/mozilla/nss/commit/1c7e99a)
- [Commit 97df5ad, Bug 1609181 FreeBSD ARM CPU features](https://github.com/mozilla/nss/commit/97df5ad)
- [Bugzilla 1975867, SpiderMonkey riscv64 NaN-boxing bug (not an NSS bug, cited to flag as a false positive)](https://bugzilla.mozilla.org/show_bug.cgi?id=1975867)
- [Debian buildd nss sid status](https://buildd.debian.org/status/package.php?p=nss&suite=sid)
- [Ubuntu 24.04 libnss3 package](https://packages.ubuntu.com/noble/libnss3)
- [Ubuntu package search, NSS, suite resolute](https://packages.ubuntu.com/search?keywords=NSS&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package repository, core](https://archriscv.felixc.at/repo/core/)
- [Arch Linux official nss package (x86_64, for comparison)](https://archlinux.org/packages/core/x86_64/nss/)
- [google/googletest issue #3756, riscv64 GetThreadCountTest failure](https://github.com/google/googletest/issues/3756)
- [hacl-star/hacl-star issue #736, riscv64 cross-compile linker bug](https://github.com/hacl-star/hacl-star/issues/736)
- [cryspen/libcrux](https://github.com/cryspen/libcrux)
- [mozilla/nss-rs PR #252, CodSpeed/Criterion benchmark suite](https://github.com/mozilla/nss-rs/pull/252)
- [RISE Project](https://riseproject.dev/)
- [RISE Python wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE blog, Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog, RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [NSS Taskcluster CI config, build kinds](https://github.com/mozilla/nss/blob/main/taskcluster/kinds/build/linux.yml)
- [NSS Taskcluster CI config, target tasks](https://github.com/mozilla/nss/blob/main/taskcluster/nss_taskgraph/target_tasks.py)