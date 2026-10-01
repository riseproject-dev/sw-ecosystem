---
title: OpenJDK
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: build-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: jtreg
    relation: test-dependency
    criticality: critical
  - name: jcstress
    relation: test-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: giflib
    relation: runtime-dependency
    criticality: optional
  - name: lcms2
    relation: runtime-dependency
    criticality: optional
  - name: HarfBuzz
    relation: runtime-dependency
    criticality: optional
  - name: FreeType
    relation: runtime-dependency
    criticality: optional
  - name: fontconfig
    relation: runtime-dependency
    criticality: optional
  - name: libffi
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg
    relation: runtime-dependency
    criticality: optional
  - name: CUPS
    relation: runtime-dependency
    criticality: optional
  - name: libX11
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: SLEEF
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="openjdk" %}

# OpenJDK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenJDK<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenJDK is the reference implementation of the Java SE Platform, source-hosted at [openjdk/jdk](https://github.com/openjdk/jdk) with a project homepage at [openjdk.org](https://openjdk.org/). It is licensed GPLv2 with the Classpath Exception (GPLv2+CE) and is not governed by an independent foundation; governance runs directly under openjdk.org via its own Bylaws.

The Governing Board has five seats: Chair (Oracle-appointed), Vice-Chair (IBM-appointed), OpenJDK Lead (Oracle-appointed), and two At-Large Members elected by OpenJDK Members. Oracle holds two of five seats by direct appointment. The contributor ladder is Participant to Contributor (requires signing the Oracle Contributor Agreement, OCA) to OpenJDK Member (peer-elected), with Author/Committer/Reviewer/Project Lead roles inside each Project. Decisions escalate from Lazy Consensus through Three-Vote Consensus, Simple and Two-Thirds Majority, up to the Board for bylaw-level matters. No GitHub-native MAINTAINERS, CODEOWNERS, or SUPPORT.md files exist in the repository; governance artifacts (Bylaws, Census, JEPs) live on openjdk.org and in the Java Bug System (JBS), not as repo metadata.

Top historical committers to openjdk/jdk include Phil Race (Oracle), Aleksey Shipilev (now Amazon Web Services), Jonathan Gibbons (Oracle), Coleen Phillimore, and Roland Westrelin (Red Hat). Oracle dominates overall commit volume; Red Hat/IBM and Amazon maintain meaningful ongoing presence.

On new architecture ports specifically, OpenJDK's culture is inclusive but requires sustained corporate sponsorship rather than foundation decree. New ports are proposed and sponsored through the **Porters Group** (openjdk.org/groups/porters/), go through the standard Author to Committer to Reviewer review bylaws (OCA required), and a port is promoted into mainline only once it demonstrates sufficient maturity, review sign-off, and sustained engineering investment. OpenJDK currently hosts Port projects for AArch32, AArch64, BSD, Haiku, MIPS, Mobile, PowerPC/AIX, RISC-V, and s390x under this umbrella. RISC-V's own trajectory, from interpreter-only support in 2020 to a full JIT port by 2022, illustrates that port viability is driven by which companies keep showing up to do the work, not by a centralized platform-tier gate.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-04-07 | Earliest RISC-V-related commit: "8199138: Add RISC-V support to Zero" (interpreter-only, no JIT), authored by John Paul Adrian Glaubitz (sha edc4ffe5) | Commit search, openjdk/jdk |
| 2021-11-05 | Staging repository [openjdk/riscv-port](https://github.com/openjdk/riscv-port) created for full JIT port development | openjdk.org census |
| 2021-11-08 | JEP 422 ("Linux/RISC-V Port") filed, owner Fei Yang, reviewed by Aleksey Shipilev, endorsed by Vladimir Kozlov | [JDK-8276797](https://bugs.openjdk.org/browse/JDK-8276797) |
| 2022-03-24 | Full JIT port merged to mainline: "8276799: Implementation of JEP 422: Linux/RISC-V Port" (sha 5905b02c, 188 files changed), via [PR #6294](https://github.com/openjdk/jdk/pull/6294) | GitHub PR #6294 |
| 2022-03-30 | First post-integration maintenance commit by Xiaolin Zheng (Alibaba): "8283737: riscv: MacroAssembler::stop() should emit fixed-length instruction sequence" | Commit search |
| 2022-05-10 | First post-port breakage fix: "8286367: riscv: riscv port is broken after JDK-8284161" | Commit bf0dc4f |
| 2022-09-20 | JDK 19 General Availability, shipping JEP 422 as a listed feature | JDK-8276797 |

JDK-8276797 is Closed/Delivered (Type: JEP, Priority P2, Component HotSpot). It scoped the RV64GV configuration: template interpreter, C1, C2, and all then-current GCs, implemented as isolated platform-specific code gated by `#ifdef`s to minimize risk to other platforms. Validation used jtreg tiers 1-4 and jcstress on HiFive Unmatched hardware, with Huawei, Alibaba, and Red Hat all participating in testing. Huawei formally committed to ongoing maintenance in the JEP text.

PR #6294's review thread included David Holmes (Oracle, requested copyright-year corrections and raised a C++ atomics concern), Vladimir Kozlov (Oracle, confirmed C1/C2 changes "reasonable" pending internal validation), Aleksey Shipilev (final approval, "look okay"), and Roger Riggs (reviewed `test/jdk`, no objections). Co-authors carried `@huawei.com` email addresses, with Alibaba and Red Hat engineers also represented.

openjdk/jdk uses GitHub Issues in a disabled state; all bug/feature tracking lives in JBS (bugs.openjdk.org), and GitHub PR titles simply carry the JBS bug ID as a prefix (for example "8276799: ..."). JDK-8276797 is the canonical master tracking record for the port, with PR #6294 as its GitHub implementation record. No separate GitHub-native tracking issue exists or is needed.

The port is **fully upstream and mainlined**, not a pending or out-of-tree effort. Since JDK 19 it has received continuous maintenance: Float16 scalar and vectorized operations (2025), SIMD/crypto intrinsics, sv39/sv57 addressing work, and CI fixes, evidenced by 65+ matched commits through September 2026 and 11 currently open RISC-V-tagged PRs as of October 2026.

Corporate contributors identified in commit co-authorship and ongoing review activity: **Huawei** (Yadong Wang, Yanhong Zhu, Feilong Jiang, Kun Wang, Zhuxuan Ni, Taiping Guo, Kang He, Fei Yang, Gui Cao), **Alibaba** (Xiaolin Zheng, Kuai Wei), **ISCAS / PLCT Lab** (Dingli Zhang, plus co-author "zifeihan"), **Red Hat** (Aleksey Shipilev), and **Oracle** (Magnus Ihse Bursie on build system, Sacha Coppey on JVMCI, Vladimir Kozlov as C2 reviewer). Fei Yang (handle RealFYang/fyang@openjdk.org) is the de facto lead maintainer, appearing as reviewer or committer on nearly every sampled RISC-V commit. The project's census lists Fei Yang as Project Lead, Ed Nevill and Aleksey Shipilev as Reviewers, and Dingli Zhang, Gui Cao, Yadong Wang, Yanhong Zhu as Committers, sponsored by the Porters Group.

## 3. Upstream Support Tier

OpenJDK has no numbered Tier 1/2/3 scheme comparable to Rust or LLVM. Instead there is a two-tier informal structure:

- **Oracle-sponsored "Supported Build Platforms"** (per the Build Group wiki): Linux x86_64/aarch64/ppc64le, Linux musl, macOS x86_64/aarch64, Windows x86_64, and AIX ppc64 (backed by SAP) and Linux s390x (backed by IBM). **RISC-V does not appear on this list for any JDK version.**
- **Community/best-effort Port projects**: per `doc/building.md`, "the mainline JDK project supports Linux, macOS, AIX and Windows. Support for other operating systems... exists in separate 'port' projects." RISC-V is organized as a separate OpenJDK "Port: RISC-V" project under the Porters Group, built and tested by community/corporate volunteers rather than guaranteed by Oracle's own CI and release matrix.

Despite this formal classification, the RISC-V port functions as a de facto top-tier architecture in terms of code depth: it has full C1/C2 JIT backends, all four GC barrier sets, Panama FFI, Project Loom, and RVV vectorization, on par with x86_64 and aarch64 implementation breadth. What it lacks is the CI/release-infrastructure guarantee that formally-tiered platforms get.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Oracle "Supported Build Platforms" list | Yes | Yes | No |
| Native GitHub Actions test execution (jtreg/gtest) | Yes (`test.yml`) | Yes (`test.yml`) | No (build-only via `build-cross-compile.yml`) |
| Official upstream release artifacts | Via Oracle/jdk.java.net | Via Oracle/jdk.java.net | None from openjdk/jdk (0 GitHub Releases, any arch); third-party only |
| JIT/GC code completeness | Complete | Complete | Complete |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Status: complete, production-grade port, not a stub.** This is one of the most extensive architecture backends in the codebase, measured at roughly 82,300 lines across `src/hotspot/cpu/riscv/` and `src/hotspot/os_cpu/linux_riscv/` alone.

### 4.1 Source inventory

| Directory | Files | Lines (approx.) | Purpose |
|---|---|---|---|
| `src/hotspot/cpu/riscv/` | 110 | ~79,900 | HotSpot JIT backend: assembler, C1/C2, interpreter, stubs, GC barriers |
| `src/hotspot/os_cpu/linux_riscv/` | 17 (incl. 1 `.S`) | ~2,400 | Linux glue: signal handling, hwprobe, icache flush, atomics |
| `src/java.base/.../foreign/abi/riscv64/` | 4 | 955 | Foreign Function and Memory (Panama) ABI for riscv64 Linux |
| `src/jdk.hotspot.agent/.../riscv64/` (+ linux/remote variants) | ~10 | ~1,250 | Serviceability Agent debugger/stack-walker support |
| `src/jdk.incubator.vector/unix/native/libsleef/` | n/a | n/a | RVV-accelerated SLEEF vector math library |
| `src/java.desktop/.../libsplashscreen/libpng/riscv-rvv/` | n/a | n/a | Vendored libpng RVV SIMD decode path |

### 4.2 Key component sizes (exact, measured via `wc -l`)

| File | Lines | Purpose |
|---|---|---|
| `riscv.ad` | 12,417 | C2 architecture description (instruction selection/scheduling) |
| `stubGenerator_riscv.cpp` | 8,163 | Runtime stubs: array copy, CRC32, AES, intrinsic entry points |
| `macroAssembler_riscv.cpp` | 7,430 | Core macro-assembler, pseudo-instruction emission |
| `riscv_v.ad` | 6,024 | RVV-specific C2 vector instruction rules (SIMD/Vector API lowering) |
| `assembler_riscv.hpp` | 4,272 | Raw RV64GC instruction encoders |
| `c2_MacroAssembler_riscv.cpp` | 3,387 | C2-specific codegen helpers |
| `riscv_b.ad` | 666 | Zba/Zbb/Zbc/Zbs (bit-manipulation) C2 instruction rules |
| `vm_version_riscv.cpp` / `.hpp` | 625 + 579 | CPU feature detection, ISA-extension flag wiring |
| `globals_riscv.hpp` | 136 | ~30 `Use<Ext>` JVM flags |

The only hand-written RISC-V assembly file in the entire backend is `src/hotspot/os_cpu/linux_riscv/safefetch_linux_riscv.S` (52 lines, implementing `SafeFetch32`/`SafeFetchN` for crash-safe diagnostic reads). Everything else is generated at runtime through the C++ `MacroAssembler`/`Assembler` classes, consistent with HotSpot's standard pattern across all JIT architectures.

### 4.3 Execution tiers and GC barriers

Template interpreter, C1 (14 source files), and C2 are all fully implemented. All four GC barrier sets have RISC-V assembler stubs under `src/hotspot/cpu/riscv/gc/`: G1, ZGC, Shenandoah, and the shared CardTable/Serial barrier. ZGC and Shenandoah barrier correctness fixes continued to land through 2026 (PR #30893 missing inline-skipped-instructions counter in ZGC; PR #30990 Shenandoah calling the wrong barrier; PR #31106 `entry_barrier_offset` should consider `UseZtso`).

### 4.4 Panama FFI, Loom, and the Serviceability Agent

`src/java.base/share/classes/jdk/internal/foreign/abi/riscv64/` implements the full riscv64 Linux calling convention for `java.lang.foreign` (`RISCV64Architecture.java`, `LinuxRISCV64CallArranger.java`, `LinuxRISCV64Linker.java`, `TypeClass.java`, 955 lines total, referenced by `CABI.java`'s `LINUX_RISCV_64` case). Project Loom continuation freeze/thaw is implemented (`continuationFreezeThaw_riscv.inline.hpp` and related files). `jdk.hotspot.agent` carries a full riscv64 package tree for post-mortem/live debugger stack-walking and thread-context support (~1,250 lines).

### 4.5 ISA extensions and vectorization

Three hardware profiles are wired in: `UseRVA20U64` (default on), `UseRVA22U64`, `UseRVA23U64`. Extensions with dedicated JVM flags and codegen predicates: RVC, RVV, Zba, Zbb, Zbc, Zbkb, Zbs, Zfa, Zfh, Zfhmin, Zacas, Zabha, Zalasr, Zawrs, Zcb, Zic64b, Zicbom, Zicbop, Zicboz, Zicond, Zihintpause, Ztso, Zvbb, Zvbc, Zvfh, Zvfhmin, Zvkg, Zvkn. `riscv_v.ad` wires RVV into C2's scalable-vector type system (`TypeVectA`) alongside AArch64 SVE; `riscv_b.ad` gates roughly 15 instruction rules on `UseZba`/`UseZbb`. `vm_version_linux_riscv.cpp` plus `os_cpu/linux_riscv/riscv_hwprobe.{cpp,hpp}` perform runtime feature detection via the Linux `riscv_hwprobe` syscall, including a documented workaround for RVV 0.7-vs-1.0 version mismatches and a pre-6.8.5 kernel vector/signal bug.

SIMD math dispatch is handled by `src/jdk.incubator.vector/unix/native/libsleef/lib/vector_math_rvv.c` (126 lines), JNI-exported RVV-accelerated transcendental math backing `jdk.incubator.vector`'s native dispatch, built with `-march=rv64gcv` per `make/modules/jdk.incubator.vector/Lib.gmk`. Separately, the bundled libpng under `libsplashscreen` vendors upstream libpng's own RISC-V RVV PNG-decode path (`PNG_RISCV_RVV_IMPLEMENTATION`, added mid-2025).

Crypto intrinsics in `stubGenerator_riscv.cpp`:

| Intrinsic | ISA Extension |
|---|---|
| AES (CBC/ECB/CTR) | Zvkned (+ Zbb for CTR; ECB stubs scale to vector length, PR #32472 open) |
| SHA-256/512 | Zvkn (Zvknhb); SHA3 GPR intrinsic open (PR #32971) |
| GHASH/GCM | Zvkg + Zvkned (open PR #28894, stalled since December 2025) |
| CRC32 | Zvbc (carry-less multiply); scalar Zbc fast path open (PR #32899) |
| ChaCha20 | Zvbb rotate (open PR #32875) |

Build/platform plumbing: `make/autoconf/platform.m4` maps `riscv64` to `VAR_CPU_ARCH=riscv`; `make/autoconf/flags-cflags.m4` does RVV sigcontext detection; `make/conf/jib-profiles.js` and `doc/building.md` list `linux-riscv64` as a first-class build target; `src/hotspot/share/utilities/macros.hpp` defines `RISCV64_ONLY`/`NOT_RISCV64` macros used throughout shared HotSpot code (AOT code cache, Loom continuations, intrinsics).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Interpreter/C1/C2 | Complete | Complete | Complete |
| All 4 GC barrier sets | Complete | Complete | Complete, with ongoing correctness fixes through 2026 |
| Panama FFI | Complete | Complete | Complete |
| Loom continuations | Complete | Complete | Complete |
| GCM crypto intrinsic | Present | Present | Missing (PR #28894 open, stalled) |
| Vectorized mismatch intrinsic | Present | Present | Missing (PR #17750 stalled 2.5 yr; newer rewrite PR #32252 open since Aug 2026) |
| Hand-written `.S` assembly | N/A (macro-assembler generated) | N/A | 1 file, 52 lines (SafeFetch) |

## 5. Build System, Cross-Compilation, and Toolchain

OpenJDK uses GNU Autoconf (`configure`) plus GNU Make. There is no `CMakeLists.txt`, `go.mod`, `Cargo.toml`, or `package.json` anywhere in the repository, and no Dockerfile for riscv64 or any other target; confirmed by direct repository search.

### 5.1 Native build (on riscv64 hardware)

```
bash configure
make images
```

### 5.2 Cross-compile via devkit (documented, recommended method)

```
cd make/devkit
make TARGETS="riscv64-linux-gnu" BASE_OS=Fedora

bash configure --with-devkit=<devkit-path> --openjdk-target=riscv64-linux-gnu
make images
```
`riscv64-linux-gnu` is listed in `doc/building.md`'s supported devkit targets alongside x86_64, aarch64, arm, ppc64le, and s390x. The Fedora devkit pulls from Fedora RISC-V Koji build infrastructure.

### 5.3 Cross-compile via Debian sysroot (the exact method used by OpenJDK's own CI)

```
sudo apt-get install gcc-10 g++-10 gcc-10-riscv64-linux-gnu g++-10-riscv64-linux-gnu \
  libxrandr-dev libxtst-dev libcups2-dev libasound2-dev
sudo apt-get install debootstrap qemu-user-static

sudo debootstrap --no-merged-usr --arch=riscv64 --verbose \
  --include=fakeroot,symlinks,build-essential,libx11-dev,libxext-dev,libxrender-dev,libxrandr-dev,libxtst-dev,libxt-dev,libcups2-dev,libfontconfig1-dev,libasound2-dev,libfreetype-dev,libpng-dev \
  --resolve-deps --variant=minbase trixie sysroot https://httpredir.debian.org/debian/

bash configure \
  --with-conf-name=linux-riscv64 \
  --with-boot-jdk=<bootjdk-path> \
  --with-gtest=<gtest-path> \
  --with-zlib=system \
  --enable-debug \
  --disable-precompiled-headers \
  --openjdk-target=riscv64-linux-gnu \
  --with-sysroot=sysroot \
  --with-jmod-compress=zip-1 \
  --with-external-symbols-in-bundles=none \
  --with-native-debug-symbols-level=1 \
  CC=riscv64-linux-gnu-gcc-10 \
  CXX=riscv64-linux-gnu-g++-10

make hotspot
```
This is the literal recipe from [.github/workflows/build-cross-compile.yml](https://github.com/openjdk/jdk/blob/master/.github/workflows/build-cross-compile.yml), with `gcc-major-version: '10'` pinned by `main.yml`. Note the build target is `hotspot` only, not a full JDK/JRE image.

### 5.4 Toolchain requirements and why they matter for riscv64

| Requirement | Value | Notes |
|---|---|---|
| GCC minimum (global floor, all platforms) | 10.0 | "Older versions will not be accepted by configure" per `doc/building.md` |
| GCC used by Oracle's own daily builds | 14.2.0 | Reference version, not riscv64-specific |
| GCC pinned for riscv64 CI cross-compile | 10 | `gcc-major-version: '10'` in `main.yml` |
| Clang minimum | 13 | `--with-toolchain-type=clang` on Linux |
| C/C++ standard | C11 / C++14 | Global requirement |
| Autoconf | >= 2.69 | Global requirement |
| GNU Make | >= 3.81 (4.0+ recommended) | Global requirement |

No riscv64-specific minimum exists above this global floor. There is, however, a riscv64-only autoconf compile probe in `make/autoconf/flags-cflags.m4`:
```m4
if test "x$FLAGS_CPU" = xriscv64; then
  AC_COMPILE_IFELSE([AC_LANG_PROGRAM([#include <linux/ptrace.h>],
    [return (int)sizeof(struct __riscv_v_ext_state);])],
    [...],
    [$1_DEFINES_CPU_JVM="${$1_DEFINES_CPU_JVM} -DNO_RVV_SIGCONTEXT"])
fi
```
This checks whether the host's kernel headers expose `struct __riscv_v_ext_state` (RVV vector-extension signal context). If the toolchain/headers predate RVV sigcontext support, the build falls back to `-DNO_RVV_SIGCONTEXT`, disabling RVV-aware signal handling in HotSpot. This is a runtime autoconf probe, not a hard version gate.

### 5.5 QEMU usage

QEMU (`qemu-user-static`) appears exactly once in the entire CI configuration: it is installed alongside `debootstrap` so that `debootstrap --arch=riscv64` can execute riscv64 package postinstall scripts via `binfmt_misc` while populating the sysroot. **QEMU is not used to run, execute, or test the built JDK anywhere in openjdk/jdk's CI.**

### 5.6 JVM variants and Boot JDK

riscv64 supports all JVM variants (`server`, `client`, `minimal`, `core`, `zero`, `custom`), identical to x86_64 and aarch64; the `zero` interpreter-only fallback is not required for riscv64. Building JDK version N requires a Boot JDK of version N-1, which runs on the build host (x86_64 for cross-compilation); no riscv64 Boot JDK is needed to cross-compile.

### 5.7 riscv64-specific restrictions

Per `make/devkit/Tools.gmk`: the Gold linker is not available for riscv64 (BFD linker used instead), `--disable-libsanitizer` is enforced for riscv64 GCC builds, and `--disable-multilib` applies globally.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Implemented at parity with arm64/amd64:** template interpreter, C1, C2 with full ADL, all four GC barriers, Panama FFI, virtual threads (Loom), RVV vector backend, SLEEF transcendental math vectorization, AES-CBC/ECB/CTR, SHA-256/512, CRC32 crypto intrinsics, hardware profile auto-detection (RVA20/22/23U64), and support for Zabha, Zicboz, Zba, Zbb, Zbs, Zfh, Zvbb, Zvkn, Zvkg, Zacas, Zicond.

**Functional and performance gaps:**

| Gap | Status |
|---|---|
| GCM intrinsic (Zvkg+Zvkned) | Open PR [#28894](https://github.com/openjdk/jdk/pull/28894), stalled since December 2025, no substantive reviewer engagement |
| Vectorized `mismatch`/`_vectorizedMismatch` intrinsic | Original PR [#17750](https://github.com/openjdk/jdk/pull/17750) open 2.5 years, stalled on a small-array regression; a newer implementation, PR [#32252](https://github.com/openjdk/jdk/pull/32252) (opened 2026-08-07, last updated 2026-09-30), shows +611% to +12% speedups on large/mid arrays but regressions of -29% to -41% on small arrays near the match boundary |
| sv57 satp mode support | Open PR [#32001](https://github.com/openjdk/jdk/pull/32001), draft, flagged by the inactivity bot after 8+ weeks with no substantive human review |
| ChaCha20 (Zvbb rotate) | Open PR [#32875](https://github.com/openjdk/jdk/pull/32875) |
| SHA3 GPR intrinsic | Open PR [#32971](https://github.com/openjdk/jdk/pull/32971) |
| CRC32 Zbc scalar fast path | Open PR [#32899](https://github.com/openjdk/jdk/pull/32899) |
| AES ECB stubs scaled to vector length | Open PR [#32472](https://github.com/openjdk/jdk/pull/32472) |
| `String.indexOf` single-char optimization | Open PR [#32442](https://github.com/openjdk/jdk/pull/32442), carries an inactivity-closure warning (issued 2026-09-25) |
| libjpeg SIMD acceleration | OpenJDK bundles IJG libjpeg (not libjpeg-turbo); scalar C only on riscv64 |
| libpng RVV acceleration | Bundled copy lags upstream's 2025 riscv64/RVV correctness fixes; `--with-libpng=system` with libpng >= 1.6.45 recommended |
| sv39 pointer materialization | Open PR [#32346](https://github.com/openjdk/jdk/pull/32346), 2/2 required reviews approved |
| JEP 544 (Ahead-of-Time Code Compilation) riscv support | Open PR [#30778](https://github.com/openjdk/jdk/pull/30778), 2/2 reviewers approved, CSR cleared 2026-10-01, 96 commits; includes AOT code-caching support for RISC-V from Dingli Zhang (ISCAS) |

No cross-architecture (riscv64 vs arm64 vs x86_64) whole-JVM benchmark suite (SPECjvm2008, SPECjbb, Renaissance, DaCapo) was found in any accessible public source; all published numbers are riscv64 self-relative (optimization on vs off).

Floating-point/NaN semantics: a historical bug (JDK-8307446, fixed JDK 21 build b22) had RISC-V `FCVT.*` instructions return min/max value on NaN input where the Java spec requires 0; this is fixed, but it illustrates that RISC-V FP corner cases have required dedicated correctness work not needed on amd64/arm64.

## 7. CI/CD Infrastructure

**riscv64 CI exists only as a cross-compilation build check, never a test-executing job.** Verified directly from `.github/workflows/` file contents (7 files total: `build-alpine-linux.yml`, `build-cross-compile.yml`, `build-linux.yml`, `build-macos.yml`, `build-windows.yml`, `main.yml`, `test.yml`). `grep -ni riscv` across all seven files matches **only** `build-cross-compile.yml`; `test.yml`, the workflow that actually runs jtreg/gtest, contains zero riscv references. No `.gitlab-ci.yml` or `.cirrus.yml` exists at repo root; the only `Jenkinsfile` in the tree is a vendored third-party file inside the bundled SLEEF library, unrelated to OpenJDK's own CI.

`build-cross-compile.yml` is a reusable workflow (`workflow_call`) invoked from `main.yml`'s `build-linux-cross-compile` job. `main.yml` triggers on `push` (branches excluding `pr/*`) and `workflow_dispatch`; `linux-cross-compile` is not in the default `EXCLUDED_PLATFORMS` list (`alpine-linux-x64,macos-x64`), so it runs by default on every qualifying push. The job runs on `ubuntu-24.04`, a standard x86_64 GitHub-hosted runner; there is no native riscv64 runner. It cross-compiles with a `riscv64-linux-gnu-gcc-10`/`g++-10` toolchain against a Debian trixie riscv64 sysroot built via `debootstrap`, builds only the `hotspot` make target, and never executes or tests the resulting riscv64 binaries. riscv64 is one of four targets in the same matrix (`arm`, `s390x`, `ppc64le`, `riscv64`). This is confirmed by direct commit history: PR (JBS bug tied to commit 44e2d49, "8372705: The riscv-64 cross-compilation build is failing in the CI", December 2025) shows the CI does catch build failures, but no jtreg/jcstress test failure from this CI has ever been reported, because no tests run.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native GitHub-hosted runner | Yes | Yes (aarch64 runners) | No |
| Build verification | Yes | Yes | Yes (cross-compile, hotspot target only) |
| Test execution (jtreg/gtest) in openjdk/jdk CI | Yes (`test.yml`) | Yes (`test.yml`) | No |
| Native test execution anywhere | Yes | Yes | Only outside openjdk/jdk, via Adoptium CI on Scaleway EM-RV1 (RISE-provisioned); no public results URL documented |

The only known source of native riscv64 JDK testing is Adoptium's own CI, running partly on RISE-funded Scaleway EM-RV1 bare-metal RISC-V instances (per RISE's [Leveraging Scaleway](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/) blog post, 2024-09-09, and corroborated by Adoptium's `test-rise-ubuntu2404-riscv64` CI node naming). It is operated by Adoptium, not by openjdk/jdk's own GitHub Actions configuration, and its results are not published to a documented public URL.

## 8. Distribution and Release Status

The **openjdk/jdk source repository has zero GitHub Releases, of any architecture** ("There aren't any releases here" on github.com/openjdk/jdk/releases). OpenJDK does not distribute official binaries through GitHub Releases at all; it relies on jdk.java.net, Oracle, and downstream builds.

**Eclipse Adoptium Temurin** (primary enterprise binary channel): JDK 21 LTS has confirmed riscv64 availability with 23 riscv64 assets in its release (JDK, JRE, debug image, static libs, test image). RISE's partnership announcement with Adoptium (2024-05-29) states Java 17, 21, and 22 are available on RISC-V, but this could not be independently confirmed for 17/22 against Adoptium GitHub release asset data in this research pass [NEEDS VERIFICATION for JDK 17 and 22 Temurin riscv64 binaries].

**Debian**: riscv64 binary packages exist in Debian sid for openjdk-11 (11.0.32~3ea-1), openjdk-17 (17.0.20~5ea-1), openjdk-21 (21.0.12~5ea-1), openjdk-25 (25.0.4~4ea-1), and openjdk-26 (26.0.1+8-3). The `~Nea` suffixes denote Early Access milestones rather than GA releases.

**Ubuntu**: directly verified via packages.ubuntu.com for suite `resolute` (Ubuntu 26.04): `openjdk-11-jdk`, `openjdk-17-jdk`, `openjdk-21-jdk` (21.0.11~8ea-1), and `openjdk-25-jdk`, each with riscv64 listed in the "Download for all available architectures" table alongside amd64, arm64, armhf, i386, ppc64el, and s390x. **Material caveat**: every riscv64 entry is tagged `[ports]`, meaning it sits in Ubuntu's secondary ports architecture pool (built by ports infrastructure, not the primary release-blocking architecture set that amd64/arm64 belong to). This is real and buildable but not the same guarantee as a primary-architecture package. The same pattern holds on Ubuntu 24.04 (Noble): riscv64 JDK 11/17/21 packages are in the ports archive and not reachable via standard `apt` without explicitly adding that repository.

**Arch Linux RISC-V (archriscv.felixc.at, unofficial community port)**: confirmed via direct repository directory listing (`https://archriscv.felixc.at/repo/extra/`, HTTP 200) to carry `jdk-openjdk`, `jdk8-openjdk`, `jdk11-openjdk`, `jdk17-openjdk`, `jdk21-openjdk`, and `jdk25-openjdk` riscv64 package files, plus matching JRE and java-atk-wrapper packages. This is a genuine, currently-hosted set of riscv64 binary artifacts, but it is an unofficial third-party mirror (felixonmars' archriscv-packages), not an OpenJDK-project-published artifact.

**PyPI**: no `openjdk` package exists. `https://pypi.org/pypi/openjdk/json` and `https://pypi.org/simple/openjdk/` both return HTTP 404. This is expected and not a gap, since OpenJDK is a JVM runtime, not a Python package; PyPI/npm/Maven distribution channels are not applicable to the JDK itself.

**What a user must do to get a working riscv64 binary today**: use Eclipse Adoptium Temurin 21 (fully supported, 23 assets), or install from Debian sid, or explicitly add the Ubuntu ports repository for JDK 11/17/21/25, or use the unofficial Arch RISC-V mirror. No channel offers an upstream-published, release-blocking-tier riscv64 binary; all available binaries are third-party.

## 9. Dependencies

OpenJDK's riscv64-relevant dependencies span build-time toolchain components, test frameworks, and runtime/bundled libraries used by `java.desktop`, `java.base`, and the JSSE/PKCS11 crypto provider.

| Dependency | Role | Criticality | riscv64 Status |
|---|---|---|---|
| GCC | Build-dependency | Critical | Green. Global floor gcc 10.0; CI pins gcc-10 specifically for the riscv64 cross-compile matrix entry (`riscv64-linux-gnu-gcc-10`). No riscv64-specific GCC blockers found. |
| GNU binutils | Build-dependency | Critical | Green with caveat. The Gold linker is unavailable for riscv64 (`make/devkit/Tools.gmk`); the BFD linker is used instead. Devkit reference version 2.43. |
| QEMU | Build-dependency | Optional | Green, narrow scope. `qemu-user-static` is used only so `debootstrap --arch=riscv64` can execute foreign-arch package scripts during sysroot creation. Never used to execute or test built riscv64 JDK binaries in openjdk/jdk CI. |
| googletest | Test-dependency | Optional | Yellow (unexercised on riscv64). Fetched via the `get-gtest` action and passed to `configure --with-gtest` in the riscv64 cross-compile job, but since `build-cross-compile.yml` never executes the resulting binaries, riscv64 gtest coverage is built but not run in upstream CI. |
| jtreg | Test-dependency | Critical | Yellow. Used for the JEP 422 validation (tiers 1-4) on HiFive Unmatched hardware at integration time (2022) and for PR-level validation reported manually by reviewers (for example, Fei Yang reported tier1-tier3 fastdebug passing on linux-riscv64 for PR #32954). Not executed automatically in openjdk/jdk's own GitHub Actions CI; native execution today happens only via Adoptium CI on RISE-provisioned hardware. |
| jcstress | Test-dependency | Optional | Yellow, same pattern as jtreg: used at JEP 422 validation time, no evidence of ongoing automated riscv64 execution in upstream CI. |
| zlib | Runtime-dependency | Optional | Green. Bundled, version 1.3.2, pure C with no architecture-specific code. No issues. |
| libpng | Runtime-dependency | Optional | Yellow. Bundled copy lags upstream's 2025 riscv64/RVV correctness fixes (Paeth filter bug, C920 crash, fixed upstream December 2025 / July 2025 respectively but not yet pulled into OpenJDK's bundled copy). Recommend `--with-libpng=system` with libpng >= 1.6.45 on riscv64. Separately, OpenJDK's own `libsplashscreen` vendors upstream libpng's RISC-V RVV PNG-decode directory directly. |
| giflib | Runtime-dependency | Optional | Green. Bundled, pure C, no SIMD, no architecture-specific code at all. |
| lcms2 | Runtime-dependency | Optional | Green. Bundled, pure C. No issues reported. |
| HarfBuzz | Runtime-dependency | Optional | Green. Builds cleanly; no riscv64 issues filed; no SIMD optimization, but correctness is not SIMD-dependent. |
| FreeType | Runtime-dependency | Optional | Green. External, pure C, ships in Debian/Ubuntu riscv64 archives. |
| fontconfig | Runtime-dependency | Optional | Green. External, pure C. No issues known. |
| libffi | Runtime-dependency | Optional | Yellow, narrow blast radius. Only matters for the uncommon `--with-jvm-variants=zero` interpreter-only build. Three open upstream issues reconfirmed open: [#694](https://github.com/libffi/libffi/issues/694) (`struct_by_value_big` test failure on riscv64, also affects aarch64), [#777](https://github.com/libffi/libffi/issues/777) (build/link failure on some riscv64 configs), [#466](https://github.com/libffi/libffi/issues/466) (small integers not correctly promoted to `ffi_arg` on riscv64). Standard HotSpot builds are unaffected. |
| libjpeg | Runtime-dependency | Optional | Yellow (performance only). OpenJDK bundles the IJG reference libjpeg, not libjpeg-turbo; builds and functions correctly on riscv64 but runs scalar-only with no RVV SIMD paths, a persistent performance gap versus arm64 builds that get NEON-accelerated libjpeg-turbo. |
| CUPS | Runtime-dependency | Optional | Green. Header-only at JDK build time; runtime CUPS is independently packaged for riscv64 in Linux distributions. |
| libX11 | Runtime-dependency | Optional | Green. Architecture-independent; packaged for riscv64. |
| OpenSSL | Runtime-dependency | Optional | Yellow. Used by the optional JSSE PKCS#11 crypto provider. AES T-table implementation is not constant-time on riscv64 hardware lacking Zkn/Zvkned (a timing-safety concern); an SSL test hangs at high parallelism on riscv64 (open [openssl#22166](https://github.com/openssl/openssl/issues/22166)); mitigation PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) are open. Not a JDK build-time dependency, but affects runtime security posture. |
| glibc | Runtime-dependency | Critical | Mostly Green. Supplies the `riscv_hwprobe` syscall used for ISA-extension detection. A `riscv_hwprobe` prototype bug (glibc BZ #32932) was fixed May 2025; a vector-register syscall clobber bug was fixed September 2025. Requires glibc >= 2.39 (kernel 6.4+) for hwprobe; this is a version-floor requirement, not an open blocker, and is standard on current riscv64 distributions. |
| SLEEF | Runtime-dependency | Optional | Green, actively improving. Vendored into `jdk.incubator.vector`'s native libsleef, providing RVV-accelerated transcendental math for the Vector API. Integrated via PR #20781 (vendored headers) and PR #21083 (RVV Vector API math ops wired to SLEEF, preserving JDK rounding-mode invariants), with OpenJDK contributing fixes back upstream to SLEEF itself (SLEEF PR #536, #537). Reported ~2.38x average speedup for vector math on riscv64. Lead contributor Hamlin Li (Rivos), RISE-attributed work. |
| ALSA (additional, found via recursion) | Runtime-dependency | Optional | Green. Kernel-level Linux audio subsystem; riscv64 is supported generically by the Linux ALSA stack. No issues found. |

Of these, **none are hard riscv64 build blockers for a standard HotSpot build**. The two real gaps are libffi (Zero-variant only, 3 open upstream issues) and libpng (bundled copy lagging upstream RVV correctness fixes, workaround available via `--with-libpng=system`). OpenSSL's timing-safety and hang concerns are a soft runtime dependency (optional JSSE PKCS#11 path only), not a build blocker. jtreg, jcstress, and googletest are all technically wired into the riscv64 cross-compile path but are not actually executed against riscv64 output anywhere in openjdk/jdk's own CI, which is the central CI gap described in Section 7.

## 11. Known Bugs and Active Issues

### 11.1 Currently open JBS bugs (type: Bug)

| JBS ID | Title | Notes |
|---|---|---|
| [JDK-8392661](https://bugs.openjdk.org/browse/JDK-8392661) | `[s390x][riscv]` incorrectly reserves address space for compressed classes using unscaled encoding instead of below 4GiB | With compressed object headers (COH) enabled, `narrow_klass_pointer_bits = 22`, causing reservation below 4MiB instead of the intended 4GiB. Companion PR [#32954](https://github.com/openjdk/jdk/pull/32954) is open with 2/2 reviewer approvals (Thomas Stuefe, Fei Yang), effectively unblocked pending integration; Fei Yang reports hotspot tier1-tier3 fastdebug passing on linux-riscv64 |
| [JDK-8388550](https://bugs.openjdk.org/browse/JDK-8388550) | RISCV: C2: segfault in `serviceability/jvmti/RedefineClasses` test | Open |
| [JDK-8388547](https://bugs.openjdk.org/browse/JDK-8388547) | `jdk/jshell/VariablesTest.java` crash on riscv64 jdk-17.0.20 | Open |
| [JDK-8388479](https://bugs.openjdk.org/browse/JDK-8388479) | RISC-V: `compiler/vectorapi/TestMaskedNotAllOnes.java` fails | Open |

Additional open enhancements in flight (performance/correctness-adjacent, not correctness bugs): JDK-8392927 (narrow unsigned subword types in `extract_v`), JDK-8392812 (enable `UseZicond` by default), JDK-8392387 (Zvbb rotate for ChaCha20), JDK-8392333 (RVV `indexOf` intrinsic), JDK-8392322 (elide memory barriers under Ztso), JDK-8391598 (avoid call-patching I-cache flushes with Ziccid), JDK-8390922 (auto-enable RVV on pre-6.8.5 kernels), JDK-8388924 (Zbb andn/orn/xnor AD patterns never match in C2, a correctness-adjacent dead-code issue), JDK-8388838 (vectorization test failures under `UseUnalignedAccesses`).

### 11.2 Open pull requests, verified live status (as of 2026-10-01)

| PR | Title | Status |
|---|---|---|
| [#32252](https://github.com/openjdk/jdk/pull/32252) | 8387474: RISCV64: vectorized mismatch intrinsic with vector extension | Open |
| [#32001](https://github.com/openjdk/jdk/pull/32001) | 8388474: RISC-V: Relax satp mode check for sv57 | Open, draft, 0/2 reviews, inactivity warning issued 2026-09-22 |
| [#32442](https://github.com/openjdk/jdk/pull/32442) | 8390631: RISC-V: Optimize `String.indexOf(String)` for single-character search | Open, inactivity-closure warning issued 2026-09-25 |
| [#32954](https://github.com/openjdk/jdk/pull/32954) | 8392661: `[s390x][riscv]` compressed classes address space fix | Open, 2/2 reviews approved, ready to integrate |
| [#32875](https://github.com/openjdk/jdk/pull/32875) | 8392387: RISC-V: Use Zvbb rotate for ChaCha20 | Open, awaiting reviews |
| [#32346](https://github.com/openjdk/jdk/pull/32346) | 8390316: RISC-V: Materialize pointers with fewer instructions on sv39 | Open, 2/2 required reviews approved |
| [#32971](https://github.com/openjdk/jdk/pull/32971) | 8392747: RISC-V: Add SHA3 GPR intrinsic | Open, awaiting reviews |
| [#32899](https://github.com/openjdk/jdk/pull/32899) | 8392466: Scalar Zbc fast path for CRC32 intrinsic | Open, awaiting reviews |
| [#32472](https://github.com/openjdk/jdk/pull/32472) | 8391052: RISC-V: Add ECB AES stubs scaled to vector length | Open, awaiting reviews |
| [#30838](https://github.com/openjdk/jdk/pull/30838) | 8366531: Add vector size/type checks for IRNode.VECTOR_REINTERPRET | Open, reviewer comments addressed |
| [#30778](https://github.com/openjdk/jdk/pull/30778) | 8380476: JEP 544 AOT Code Compilation (touches riscv) | Open, 2/2 reviewers approved, CSR cleared 2026-10-01, 96 commits, includes RISC-V AOT caching support from Dingli Zhang (ISCAS) |

All 11 of these PRs were open and authored by established RISC-V port maintainers (Fei Yang, Hamlin Li, Gui Cao, kuaiwei, and others) as of the live verification pass on 2026-10-01; none has merged or closed since the initial search was compiled. OpenJDK uses the Skara bot workflow (an explicit `/integrate` command after reviewer sign-off, not GitHub's native merge button), which explains why several PRs with 2/2 approvals already in are still open awaiting that final step rather than being stalled on review itself.

### 11.3 Correctness bugs worth highlighting separately

**JDK-8369947, "Bytecode rewriting causes Java heap corruption on RISC-V"** (fixed via PR #27850, integrated October 2025): a memory-ordering hazard specific to RISC-V's weak memory model. The interpreter's `patch_bytecode` routine wrote bytecode with a plain store; a concurrent thread could observe the patched opcode before an associated class reference was resolved and made visible. On aarch64 a control dependency was sufficient protection; on RISC-V it is not. Fixed by adding `membar(MacroAssembler::StoreStore)`. Priority P2.

**JDK-8376572, "Interpreter: Load array index as signed int"** (fixed via PR #29458, integrated February 2026): the template interpreter used a 64-bit load (`ld`) instead of a 32-bit sign-extending load (`lw`) for array indices on the operand stack, causing negative indices to be reinterpreted as large positive 64-bit values and silently bypassing bounds checks. Priority P4.

Both bugs survived to production (tier1-tier4 passed on HiFive Unmatched at JDK 19 integration) and both are specific to RISC-V's weak memory model and load-semantics differences from x86 TSO/aarch64, a category of silent correctness bug that is non-obvious to reviewers trained primarily on other architectures.

## 12. Objections and Upstream Blockers

**No native riscv64 test execution in openjdk/jdk's own CI.** This is the central structural gap and the direct driver of the yellow readiness grade (Section 13). All riscv64 functional testing happens outside openjdk/jdk CI, in Adoptium's CI on Scaleway EM-RV1 hardware provisioned by RISE, with no publicly documented configuration or results URL. A regression in the riscv64 JIT or GC barriers could in principle go undetected until a downstream distribution surfaces it.

**Memory model correctness surface.** JDK-8369947 and JDK-8376572 (Section 11.3) demonstrate that RISC-V's weak memory model and load semantics create a recurring class of silent correctness bugs not present on x86 TSO or aarch64. Expect more such bugs as the port runs on more diverse hardware and workloads.

**Crypto intrinsic coverage gap.** GCM is the dominant AEAD cipher in TLS 1.3 and is performance-critical for server workloads. PR #28894 (GCM intrinsic with Zvkg+Zvkned) has been open since December 2025 with no substantive review. Until merged, GCM throughput on hardware with those extensions is left on the table; hardware without them falls back to a Java-layer implementation.

**sv57 satp support stalled.** PR #32001 has received only automated bot comments, is still in Draft state, has 0 of 2 required reviews satisfied, and was flagged by GitHub's inactivity bot after 8+ weeks without a substantive update. It is linked to a related PR, #33081 ("SATP mode validation for AOT code caching"), tying this fix to the JEP 544 AOT work.

**IJG libjpeg: no RVV SIMD.** OpenJDK bundles the IJG version of libjpeg, not libjpeg-turbo; JPEG decode in `java.desktop` runs at scalar C speed on riscv64, a persistent performance gap versus arm64 builds that benefit from NEON-accelerated libjpeg-turbo. Switching the bundled library requires cross-platform upstream consensus, since it affects all platforms, not just RISC-V.

**libffi issues affect Zero JVM only.** Three open libffi issues ([#694](https://github.com/libffi/libffi/issues/694), [#777](https://github.com/libffi/libffi/issues/777), [#466](https://github.com/libffi/libffi/issues/466)) affect only `--with-jvm-variants=zero` builds; standard HotSpot is unaffected.

**No organizational objection to RISC-V as a port.** No governance document or JEP discussion expresses opposition to RISC-V's presence in mainline. The blockers identified here are entirely resourcing and review-bandwidth constraints (stalled PRs awaiting a qualified reviewer) and CI-infrastructure gaps (no upstream riscv64 test execution), not acceptance-policy objections.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** third-party

OpenJDK is a general-purpose language runtime, not an optimization-purpose project, so no separate optimization-level modifier applies and no Optimization level field is reported.

**Justification:** Upstream CI (`openjdk/jdk`) has exactly one riscv64 job, [.github/workflows/build-cross-compile.yml](https://github.com/openjdk/jdk/blob/master/.github/workflows/build-cross-compile.yml), which cross-compiles only the `hotspot` make target on an x86_64 `ubuntu-24.04` runner via a Debian trixie sysroot. It never executes jtreg, jcstress, or any other test suite on riscv64, and there is no native riscv64 runner in openjdk/jdk's own GitHub Actions configuration. Per the color model's CI-evidence rule, a build-only riscv64 job with no test execution caps the primary grade at yellow regardless of release status. Upstream itself publishes no riscv64 release artifacts: openjdk/jdk has zero GitHub Releases of any architecture. The consumable riscv64 binaries all come from third parties: Eclipse Adoptium Temurin (JDK 21 LTS confirmed, 23 riscv64 assets) and Linux distributions (Debian sid, Ubuntu ports archive), so release_provider is third-party rather than upstream.

**Pending work that could change the grade:** Native riscv64 test execution for the port happens only outside openjdk/jdk CI, via Adoptium CI on RISE-provisioned Scaleway EM-RV1 hardware, with no public results URL documented. Adding a riscv64 test-executing job (even a QEMU-based jtreg tier-1 run) to openjdk/jdk's own CI would be the single change most likely to move this grade to blue. Several riscv64-relevant PRs remain open as of 2026-10-01: #28894 (GCM intrinsic, stalled since December 2025), #17750 (`_vectorizedMismatch` intrinsic, open 2.5 years), #32254/#32001/#32442 and others (ongoing performance/correctness work), and #30778 (JEP 544 AOT Code Compilation, with RISC-V-specific AOT caching support from Dingli Zhang/ISCAS). RISE funds Adoptium's riscv64 build/test infrastructure (Scaleway EM-RV1), and Rivos engineers (Hamlin Li) have published RISE-attributed RVV/SLEEF and CMoveX optimization work, but none of this is upstream openjdk/jdk CI or an upstream release channel today.

## 14. Investment Analysis

### 14.1 Functional Enablement

The riscv64 port is functionally complete for enterprise JVM workloads: all four execution tiers, all four GC implementations, Panama FFI, and Project Loom are implemented. The remaining material functional gaps are the GCM crypto intrinsic (PR #28894) and the vectorized mismatch intrinsic (PR #17750 / newer rewrite PR #32252), both of which are performance optimizations rather than functional blockers, and the sv57 satp support (PR #32001), which is a hardware-compatibility fix rather than a functional gap.

### 14.2 Performance Optimization

RISE/Rivos has already funded and published substantial RISC-V performance work; this should not be re-sized:

| Optimization | Result | Source |
|---|---|---|
| SLEEF vectorized math integration | ~2.38x average speedup | [RISE blog, Sep 2025](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/), PR #20781/#21083 |
| CMoveX / conditional-expression vectorization | >2.1x average, up to >4x | [RISE blog, Jul 2025](https://riseproject.dev/2025/07/23/cmovex-vectorization/), PR #24095/#24153/#24490/#25336/#25341 |
| AES ECB stubs scaled to vector length | 3.41x-4.72x depending on key size/data size | PR #32472 |
| Vectorized mismatch intrinsic (new) | +12% to +611% on large arrays; -29% to -41% regression on small arrays | PR #32252 |

Remaining performance work not yet done: land the GCM intrinsic (#28894), resolve the small-array regression in the vectorized mismatch intrinsic (#32252/#17750), and continue the open crypto-stub work (ChaCha20 Zvbb rotate #32875, SHA3 GPR #32971, CRC32 Zbc #32899). No riscv64-vs-arm64 cross-architecture whole-JVM benchmark exists; producing one is a gap, not a RISE-funded deliverable already in hand.

### 14.3 CI/CD Infrastructure

RISE already funds the only existing native riscv64 test execution (Adoptium CI on Scaleway EM-RV1); this infrastructure spend should not be duplicated. What is missing, and not covered by that funding, is integration of any riscv64 test execution into openjdk/jdk's own CI (currently build-only), and public documentation of the Adoptium/RISE test results so they can be audited by the wider community.

### 14.4 Ecosystem Enablement

RISE already funds the Adoptium partnership that produces Temurin 21 riscv64 binaries (23 assets). Not yet resolved: confirming and publicizing Temurin 17/22 riscv64 binary availability (claimed by RISE's 2024 announcement but not independently confirmed in this research pass), and clarifying the Ubuntu ports-tier status (riscv64 openjdk packages exist in Ubuntu 26.04 but sit outside the primary/release-blocking architecture pool).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 test-executing job (even QEMU-based jtreg tier-1) to openjdk/jdk's own GitHub Actions CI | 4-8 | Infrastructure contributor + a HotSpot maintainer | Critical |
| CI/CD | Publish Adoptium/RISE native riscv64 test results to a documented public URL | 1-2 | RISE / Adoptium | High |
| Functional | Land the GCM intrinsic (PR #28894): recruit reviewer time, unblock a PR stalled since December 2025 | 2-3 | Any qualified HotSpot C2/crypto reviewer | High |
| Functional | Land the sv57 satp fix (PR #32001): move out of Draft, secure 2 required reviews | 1-2 | Reviewer + author (zifeihan/April Ivy) | Medium |
| Performance | Resolve the small-array regression in the vectorized mismatch intrinsic (PR #32252, successor to #17750) | 3-5 | PR author + reviewer | Medium |
| Performance | Complete remaining open crypto stubs (ChaCha20 #32875, SHA3 #32971, CRC32 Zbc #32899, AES ECB #32472) | 2-4 total | HotSpot RISC-V contributors | Medium |
| Performance | Produce cross-architecture (riscv64 vs arm64 vs amd64) whole-JVM benchmark data (SPECjvm2008/SPECjbb/DaCapo) | 3-5 | Any contributor with access to comparable hardware | Medium |
| Correctness | Audit codebase for remaining weak-memory-model assumptions (interpreter, JIT, barriers), given JDK-8369947/JDK-8376572 history | 6-10 | HotSpot RISC-V reviewer with memory-model expertise | High |
| Dependency | Evaluate `--with-libpng=system` on riscv64 to pick up upstream RVV fixes; track bundled libpng version update | 1-2 | Build/portability contributor | Low |
| Dependency | Track open libffi issues (#694, #777, #466) for Zero JVM builds | 0.5 (monitoring) | - | Low |
| Ecosystem | Confirm and publicize Temurin 17/22 riscv64 binary availability | 1 | RISE / Adoptium | Medium |

## 15. References

- [JEP 422: Linux/RISC-V Port (JDK-8276797)](https://bugs.openjdk.org/browse/JDK-8276797)
- [openjdk/jdk GitHub repository](https://github.com/openjdk/jdk)
- [openjdk/riscv-port staging repository](https://github.com/openjdk/riscv-port)
- [openjdk.org homepage](https://openjdk.org/)
- [PR #6294: Implementation of JEP 422](https://github.com/openjdk/jdk/pull/6294)
- [build-cross-compile.yml CI workflow](https://github.com/openjdk/jdk/blob/master/.github/workflows/build-cross-compile.yml)
- [OpenJDK build documentation (doc/building.md)](https://github.com/openjdk/jdk/blob/master/doc/building.md)
- [PR #28894: GCM intrinsic with Zvkg and Zvkned](https://github.com/openjdk/jdk/pull/28894)
- [PR #17750: `_vectorizedMismatch` intrinsic](https://github.com/openjdk/jdk/pull/17750)
- [PR #32252: Vectorized mismatch intrinsic with vector extension](https://github.com/openjdk/jdk/pull/32252)
- [PR #32001: Relax satp mode check for sv57](https://github.com/openjdk/jdk/pull/32001)
- [PR #32442: Optimize String.indexOf for single-character search](https://github.com/openjdk/jdk/pull/32442)
- [PR #32954: Fix compressed classes address space reservation](https://github.com/openjdk/jdk/pull/32954)
- [PR #32875: Use Zvbb rotate for ChaCha20](https://github.com/openjdk/jdk/pull/32875)
- [PR #32346: Materialize pointers with fewer instructions on sv39](https://github.com/openjdk/jdk/pull/32346)
- [PR #32971: Add SHA3 GPR intrinsic](https://github.com/openjdk/jdk/pull/32971)
- [PR #32899: Scalar Zbc fast path for CRC32 intrinsic](https://github.com/openjdk/jdk/pull/32899)
- [PR #32472: Add ECB AES stubs scaled to vector length](https://github.com/openjdk/jdk/pull/32472)
- [PR #30838: Vector size/type checks for IRNode.VECTOR_REINTERPRET](https://github.com/openjdk/jdk/pull/30838)
- [PR #30778: Implement JEP 544: Ahead-of-Time Code Compilation](https://github.com/openjdk/jdk/pull/30778)
- [PR #27850: Bytecode rewriting causes Java heap corruption on RISC-V](https://github.com/openjdk/jdk/pull/27850)
- [PR #29458: Interpreter: Load array index as signed int](https://github.com/openjdk/jdk/pull/29458)
- [PR #30893: Missing InlineSkippedInstructionsCounter in ZGC barrier stubs](https://github.com/openjdk/jdk/pull/30893)
- [PR #30990: ShenandoahBarrierSetAssembler calls wrong barrier](https://github.com/openjdk/jdk/pull/30990)
- [PR #31106: entry_barrier_offset should consider UseZtso](https://github.com/openjdk/jdk/pull/31106)
- [PR #21083: SLEEF Vector API math ops for RISC-V](https://github.com/openjdk/jdk/pull/21083)
- [JDK-8307446: FCVT NaN handling bug](https://bugs.openjdk.org/browse/JDK-8307446)
- [RISE blog: OpenJDK Supercharging Vectorized Math with SLEEF](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [RISE blog: OpenJDK CMoveX and Vectorization](https://riseproject.dev/2025/07/23/cmovex-vectorization/)
- [RISE blog: Java on RISC-V, RISE and Eclipse Adoptium Partnership](https://riseproject.dev/2024/05/29/395/)
- [RISE blog: Leveraging Scaleway to support the RISC-V Software Ecosystem](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/)
- [RISE Project members page](https://riseproject.dev/)
- [Eclipse Adoptium temurin21-binaries releases](https://github.com/adoptium/temurin21-binaries/releases)
- [libffi struct_by_value_big failure on riscv64 (#694)](https://github.com/libffi/libffi/issues/694)
- [libffi riscv64 build failure (#777)](https://github.com/libffi/libffi/issues/777)
- [libffi small-integer promotion bug on riscv64 (#466)](https://github.com/libffi/libffi/issues/466)
- [OpenSSL riscv64 SSL test hang at high parallelism (#22166)](https://github.com/openssl/openssl/issues/22166)
- [OpenSSL mitigation PR #31080](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL mitigation PR #31082](https://github.com/openssl/openssl/pull/31082)
- [packages.ubuntu.com: openjdk-21-jdk, suite resolute](https://packages.ubuntu.com/resolute/openjdk-21-jdk)
- [archriscv.felixc.at repository listing](https://archriscv.felixc.at/repo/extra/)
- [openjdk/jdk GitHub Releases (empty)](https://github.com/openjdk/jdk/releases)