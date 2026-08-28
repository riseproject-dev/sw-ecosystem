---
title: OpenJDK
parent: Project Reports
categories:
  - runtimes
  - llm-inference
  - data-analytics
---

# OpenJDK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenJDK<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OpenJDK is the reference implementation of the Java SE Platform. It is stewarded by Oracle Corporation under the GPLv2 with Classpath Exception. The upstream source repository is [openjdk/jdk](https://github.com/openjdk/jdk). Binary distributions are shipped through downstream channels including Eclipse Adoptium (Temurin) and Linux distribution package managers.

OpenJDK is not governed by an independent foundation. The Governing Board is defined by bylaws ratified June 28, 2011:

- Chair: appointed by Oracle
- Vice-Chair: appointed by IBM
- OpenJDK Lead: appointed by Oracle
- Two At-Large Members: elected by OpenJDK Members

Oracle holds two of five seats by appointment. All contributors must sign the Oracle Contributor Agreement (OCA).

The top commit contributors to openjdk/jdk by commit count include Phil Race (Oracle, ~1,350), Aleksey Shipilev (Amazon Web Services, ~1,350), Jonathan Gibbons (Oracle, ~1,318), Coleen Phillimore (~1,216), and Roland Westrelin (Red Hat, ~682). Oracle dominates the top contributor list. Red Hat/IBM and Amazon (AWS Corretto team) have meaningful presence.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port was developed in the staging repository [openjdk/riscv-port](https://github.com/openjdk/riscv-port), created November 5, 2021.

**JEP 422 -- Linux/RISC-V Port**

- JEP filed: November 8, 2021
- JEP author/owner: Fei Yang (handle: fyang)
- Reviewed by: Aleksey Shipilev (Amazon Web Services)
- Endorsed by: Vladimir Kozlov
- Target: JDK 19
- Status: Closed/Delivered

The main integration commit was authored by Fei Yang with SHA `5905b02c`, message "8276799: Implementation of JEP 422: Linux/RISC-V Port", dated March 24, 2022, changing 188 files. Co-authors on that commit carried email addresses at `huawei.com`, with Aleksey Shipilev (shade@openjdk.org, Amazon) also listed. Xiaolin Zheng (Alibaba) is listed in co-authors based on email patterns.

The first maintenance commit after the main integration was authored by Xiaolin Zheng, SHA `b82b0090`, dated March 30, 2022: "8283737: riscv: MacroAssembler::stop() should emit fixed-length instruction sequence."

JDK 19 General Availability was September 20, 2022. JEP 422 is listed as a feature of that release. Since JDK 19, the riscv64 port is a first-class supported platform in mainline openjdk/jdk.

**Corporate sponsors declared in JEP 422:**
- Huawei Technologies: primary driver; committed to fully support (regularly update, enhance, and test) the port
- Alibaba: regularly builds and tests the port
- Red Hat: regularly builds and tests the port

The riscv-port Project census at openjdk.org lists:

| Role | Handle | Name |
|---|---|---|
| Project Lead | fyang | Fei Yang |
| Reviewer | enevill | Ed Nevill |
| Reviewer | shade | Aleksey Shipilev (AWS) |
| Committer | dzhang | Dingli Zhang |
| Committer | gcao | Gui Cao |
| Committer | yadongwang | Yadong Wang |
| Committer | yzhu | Yanhong Zhu |
| Author | fjiang | Feilong Jiang |
| Author | tguo | Taiping Guo |
| Author | xlinzheng | Xiaolin Zheng |

The project is sponsored by the Porters Group (openjdk.org/groups/porters/).

---

## 3. Upstream Support Tier

OpenJDK does not publish a numbered tier system equivalent to Rust or LLVM. Ports are managed under the Porters Group as separate OpenJDK Projects. Acceptance requires a proposal to the porters-dev mailing list, OCA/legal compliance, and a sponsoring organization committing to ongoing maintenance.

JEP 422 is a "Feature" type JEP (not informational), delivered into mainline. The acceptance criteria included passing jtreg tiers 1-4 and jcstress on a HiFive Unmatched development board. The implicit maintenance expectation is that the sponsoring organization keeps the port from breaking other platforms.

The RISC-V port is de facto a top-tier port: it receives the same classes of work as x86_64 and aarch64, including full C1/C2 JIT backends, all four GC barrier sets, Panama FFI, Project Loom (virtual threads), and RVV vectorization. There is no public document that formally classifies it as equivalent to x86_64, but its integration depth and maintenance cadence are equivalent.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Status: Complete production port, not a stub.**

### 4.1 Source File Inventory

RISC-V architecture-specific code lives primarily in two directories:

- `src/hotspot/cpu/riscv/` -- 79 files + 4 GC subdirectories (27 additional files)
- `src/hotspot/os_cpu/linux_riscv/` -- 16 files + 1 GC file

### 4.2 JVM Execution Tiers

All four JVM execution tiers have full RISC-V implementations:

**Template Interpreter** (`templateInterpreterGenerator_riscv.cpp`, ~1,500 lines): generates bytecode dispatch table stubs at JVM startup; ISA: base RV64GC.

**C1 (client/tier-1 JIT)**: 14 source files including `c1_LIRAssembler_riscv.cpp` (~1,350 lines) and `c1_LIRGenerator_riscv.cpp` (~950 lines). Translates C1 LIR to RISC-V machine code. Includes specialized files for arraycopy and arithmetic lowering.

**C2 (server/tier-2 JIT)**: Primary files are `riscv.ad` (~15,000-20,000 lines ADL), `riscv_b.ad` (bit-manipulation), `riscv_v.ad` (RVV vector), and `c2_MacroAssembler_riscv.cpp`. Full instruction selection, register allocation (32 GPR, 32 FPR, 32 VPR), and cost model are defined.

**Shared Runtime** (`sharedRuntime_riscv.cpp`, ~2,200 lines): Java/C calling convention adapters (i2c/c2i), native wrappers, deoptimization blob, safepoint/resolution stubs, virtual thread entry/yield.

### 4.3 Garbage Collector Support

All four GC barrier sets have RISC-V assembler stubs under `src/hotspot/cpu/riscv/gc/`:

- G1 (4 files: `g1BarrierSetAssembler_riscv.cpp/.hpp`, `g1Globals_riscv.hpp`, `g1_riscv.ad`)
- ZGC (7 files: address, barrier assembler, globals, ADL)
- Shenandoah (3 files: `shenandoahBarrierSetAssembler_riscv.cpp/.hpp`, `shenandoah_riscv.ad`)
- CardTable/shared (5 files)

ZGC and Shenandoah barrier correctness fixes are actively being merged in 2026 (see section 11).

### 4.4 Panama FFI (Foreign Function Interface)

Both downcall and upcall linkers are implemented:

- `downcallLinker_riscv.cpp` -- Java-to-native stubs (LP64D ABI)
- `upcallLinker_riscv.cpp` -- native-to-Java stubs; includes NaN-boxing pre-fill for RISC-V float specification

### 4.5 Virtual Threads (Project Loom)

Continuation freeze/thaw is implemented:

- `continuationFreezeThaw_riscv.inline.hpp`
- `continuationHelper_riscv.inline.hpp`
- `continuationEntry_riscv.hpp`
- `stackChunkFrameStream_riscv.inline.hpp`

### 4.6 Cryptographic Intrinsics

Implemented via `stubGenerator_riscv.cpp` (~3,000-4,500+ lines):

| Intrinsic | ISA Extension |
|---|---|
| AES (CBC) | Zvkned |
| AES (CTR) | Zvkned + Zbb |
| SHA-256/512 | Zvkn (Zvknhb) |
| GHASH/GCM | Zvkg + Zvkned (open PR #28894) |
| CRC32 | Zvbc (carryless multiply) |

### 4.7 RVV Vectorization

The `riscv_v.ad` ADL file implements the full C2 SIMD backend using RISC-V Vector (RVV) extension including:

- Arithmetic: vadd, vsub, vmul, vmax, vmin, vfadd, vfsub, vfmul, FMA
- Reductions, mask operations, load/store
- Zvbb extensions: vandn, vctz, vclz, vrev8, vbrev, vcpop, vrol, vror
- Float16 (Zvfh)
- Saturating arithmetic: SUADD, SADD, SUSUB, SSUB (merged May 2025)
- SLEEF integration for vectorized transcendental math (sin, cos, log, exp -- merged 2024, PR #21083)

### 4.8 CPU Feature Detection

`vm_version_riscv.hpp` declares flag support for the following extensions:

A, C, D, F, H, I, M, Q, V, Zacas, Zba, Zbb, Zbc, Zbkb, Zbs, Zcb, Zfa, Zfh, Zfhmin, Zicbom, Zicbop, Zicboz, Zicntr, Zicond, Zicsr, Zic64b, Zifencei, Zihintpause, Ztso, Zvbb, Zvbc, Zvfh, Zvkn, Zvkg

Hardware profiles supported: RVA20U64, RVA22U64, RVA23U64.

Detection uses the Linux `riscv_hwprobe` syscall (kernel 6.4+) via `riscv_hwprobe.cpp`. A known guard blocks Vector extension auto-enable on kernels older than 6.8.5 due to a signal-handling bug. Vendor-specific tuning exists: Rivos hardware gets Zba/Zbb/Zbs/Ztso/Zvfh auto-enabled.

Zabha was added in PR [#25252](https://github.com/openjdk/jdk/pull/25252) (merged June 2025). Zicboz block-size detection via hwprobe was added in PR [#27155](https://github.com/openjdk/jdk/pull/27155) (merged September 2025). CPU features were refactored to use a bitmap representation in PR [#27152](https://github.com/openjdk/jdk/pull/27152) (merged September 2025).

### 4.9 ICache Flush and OS Integration

`riscv_flush_icache.cpp` implements ICache flush via the `riscv_flush_icache` syscall with both local-hart (`SYS_RISCV_FLUSH_ICACHE_LOCAL`) and all-harts (`SYS_RISCV_FLUSH_ICACHE_ALL`) modes. `os_linux_riscv.cpp` (~450 lines) handles signal handling with RVV context via `__riscv_v_ext_state`, SpinPause using Zihintpause, and stack walking.

---

## 5. Build System, Cross-Compilation, and Toolchain

OpenJDK uses GNU autoconf (`configure` + `make`). There is no CMakeLists.txt, go.mod, Cargo.toml, or package.json for the JDK build itself.

### 5.1 Toolchain Requirements

| Component | Minimum | Reference version |
|---|---|---|
| GCC | 10.0 | 14.2.0 |
| Clang | 13 | 15.0.0 (Xcode 15.4) |
| Binutils (devkit) | -- | 2.43 |
| GDB (devkit) | -- | 15.2 |

Language standards required: C11 and C++14.

### 5.2 riscv64-specific Restrictions

From `make/devkit/Tools.gmk`:

- Gold linker is not available for riscv64 (BFD linker is used instead)
- `--disable-libsanitizer` is enforced for riscv64 GCC builds
- `--disable-multilib` applied globally

### 5.3 Supported Build Methods

**Method A: riscv-collab GNU toolchain (manual)**

```sh
git clone --recursive https://github.com/riscv-collab/riscv-gnu-toolchain
cd riscv-gnu-toolchain && ./configure --prefix=<path> && make linux
bash configure \
  --with-boot-jdk=$BOOT_JDK \
  --openjdk-target=riscv64-linux-gnu \
  --with-sysroot=<path>/sysroot \
  --with-toolchain-path=<path>/bin \
  --with-extra-path=<path>/bin
make images
```

**Method B: OpenJDK devkit (pre-built cross-compiler bundle)**

The devkit is an officially supported build artifact for `riscv64-linux-gnu`. The Fedora devkit for riscv64 pulls from Fedora RISC-V Koji build infrastructure at `https://riscv-koji.fedoraproject.org`. Default: BASE_OS_VERSION=43, BASE_OS_BUILD=6640.

```sh
cd make/devkit && make TARGETS="riscv64-linux-gnu" BASE_OS=Fedora
bash configure --with-devkit=<devkit-path> --openjdk-target=riscv64-linux-gnu
make images
```

**Method C: Debian debootstrap sysroot (CI method)**

The method used in OpenJDK's own GitHub Actions CI:

- Debian version: `trixie`
- Cross-compiler: `gcc-riscv64-linux-gnu` from Ubuntu apt
- Sysroot packages include: `build-essential`, `libx11-dev`, `libxext-dev`, `libxrender-dev`, `libxrandr-dev`, `libxtst-dev`, `libxt-dev`, `libcups2-dev`, `libfontconfig1-dev`, `libasound2-dev`, `libfreetype-dev`, `libpng-dev`
- Build target: `make hotspot` (not a full JDK build)

QEMU is installed as part of debootstrap sysroot setup (`qemu-user-static`) to allow debootstrap to execute riscv64 binaries during sysroot construction only. QEMU is not used to execute the final JDK binaries.

No Dockerfiles for riscv64 exist in openjdk/jdk. The CI uses GitHub Actions runners directly.

### 5.4 JVM Variants

riscv64 supports all JVM variants (`server`, `client`, `minimal`, `core`, `zero`, `custom`) -- same as x86_64 and aarch64. The `zero` interpreter-only fallback is not required.

### 5.5 Boot JDK Requirement

Building JDK version N requires a Boot JDK of version N-1. The Boot JDK must run on the build host (x86_64 for cross-compilation). No riscv64 Boot JDK is needed for cross-compilation.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Implemented and parity with arm64/amd64:**

- Template interpreter
- C1 JIT compiler
- C2 JIT compiler with full ADL
- All four GC barriers (G1, ZGC, Shenandoah, CardTable)
- Panama FFI (downcall and upcall)
- Virtual threads (Loom)
- RVV vector backend (riscv_v.ad)
- SLEEF transcendental math vectorization (integrated 2024)
- Crypto intrinsics: AES-CBC, AES-CTR, SHA-256, SHA-512, CRC32
- Hardware profile auto-detection (RVA20/22/23U64)
- Zabha, Zicboz, Zba, Zbb, Zbs, Zfh, Zvbb, Zvkn, Zvkg, Zacas, Zicond support

**Gaps and in-progress items:**

| Gap | Status |
|---|---|
| GCM intrinsic (Zvkg+Zvkned) | Open PR [#28894](https://github.com/openjdk/jdk/pull/28894), stalled awaiting review since December 2025 |
| `_vectorizedMismatch` intrinsic | Open PR [#17750](https://github.com/openjdk/jdk/pull/17750), stalled since February 2024, small-array regression unresolved |
| Zvbb auto-enable via hwprobe | Open PR [#31588](https://github.com/openjdk/jdk/pull/31588), June 2026, 2 approvals, pending merge |
| libjpeg SIMD acceleration | OpenJDK bundles IJG libjpeg (not libjpeg-turbo), no RVV paths; scalar C only |
| libpng RVV acceleration | Requires `--with-libpng=system` with libpng >= 1.6.45; bundled version lacks 2025 RVV fixes |
| IR test coverage | Active work to enable riscv64-gated IR matching tests in jtreg (dozens of PRs March 2026) |
| async-profiler coverage | Only "basic" riscv64 support merged November 2023 [NEEDS VERIFICATION] |

No cross-architecture (riscv64 vs arm64 vs x86_64) whole-JVM benchmark data (SPECjvm2008, SPECjbb, Renaissance, DaCapo) was found in any accessible public source.

---

## 7. CI/CD Infrastructure

### 7.1 GitHub Actions (openjdk/jdk)

openjdk/jdk has **exactly one riscv64 CI job**: a cross-compilation build of Hotspot only.

- File: `.github/workflows/build-cross-compile.yml`
- Trigger: `workflow_call` from `main.yml`, fires on push to master (excludes `pr/*` branches)
- Runner: `ubuntu-24.04` (x86_64 GitHub-hosted runner; no native riscv64 runner)
- Build target: `make hotspot` -- not a full JDK build
- No test execution: there is no `test-linux-cross-compile` job in main.yml or test.yml
- No QEMU-based test execution
- QEMU is installed only for debootstrap sysroot construction

riscv64 is one of four targets in the cross-compile matrix alongside `arm`, `s390x`, and `ppc64le`.

The test jobs that do run (x86_64, aarch64, macOS aarch64, Windows) have no riscv64 equivalent.

**Adversarial confirmation:** PR [#28619](https://github.com/openjdk/jdk/pull/28619) ("The riscv-64 cross-compilation build is failing in the CI", December 2025) confirms the CI catches build failures. No test failure (jtreg, jcstress) from CI has been reported because no tests run.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in openjdk/jdk.

### 7.2 Adoptium / RISE CI

Per RISE blog post dated September 9, 2024 ([Leveraging Scaleway to support the RISC-V Software Ecosystem](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/)), RISE provisions Scaleway EM-RV1 bare-metal RISC-V instances for Eclipse Adoptium to run "extensive tests and builds of the OpenJDK." No runner configuration files, specific test suite, or result publication URL is disclosed in the blog post.

This is the only known source of native riscv64 JDK testing. It is operated by Adoptium, not by openjdk/jdk CI.

---

## 8. Distribution and Release Status

**openjdk/jdk source repository** has zero GitHub Releases. The repository uses tags only (e.g., `jdk-28+3`). No binary assets are attached.

**Adoptium Eclipse Temurin (primary binary distribution)**

| JDK Version | riscv64 Available | Example Release |
|---|---|---|
| JDK 21 (LTS) | Yes | `OpenJDK21U-jdk_riscv64_linux_hotspot_21.0.9_10.tar.gz` in release `jdk-21.0.9+10` -- 23 riscv64 assets including JDK, JRE, debug image, static libs, test image |
| JDK 17 (LTS) | No | 0 riscv64 assets in `jdk-17.0.9+9.1` |
| JDK 11 (LTS) | No | 0 riscv64 assets in `jdk-11.0.31+11` |

The RISE-Adoptium partnership (announced May 29, 2024) added Temurin builds for Java 17, 21, and 22. However, the verified Adoptium GitHub release data shows JDK 17 and 11 have zero riscv64 assets. There is a discrepancy between the RISE blog announcement and the observed Adoptium release assets. The RISE blog post states Java 17, 21, and 22 are available; the GitHub release asset data only confirms JDK 21 riscv64 assets [NEEDS VERIFICATION for JDK 17 and 22 Temurin riscv64 binaries].

**Debian**

`openjdk-21` source package lists riscv64 in its supported architectures alongside amd64, aarch64, and 15 other architectures. Buildd reports status "Installed" for version `21.0.12~5ea-1` on buildd host `rv-manda-03`. Note: `~5ea` denotes Early Access milestone 5, not a GA release.

riscv64 binary packages are available in Debian sid for:
- openjdk-11-jdk: `11.0.32~3ea-1`
- openjdk-17-jdk: `17.0.20~5ea-1`
- openjdk-21-jdk: `21.0.12~5ea-1`
- openjdk-25-jdk: `25.0.4~4ea-1`
- openjdk-26-jdk: `26.0.1+8-3`

**Ubuntu 24.04 (Noble)**

riscv64 JDK packages (JDK 11, 17, 21) are available in the Ubuntu **ports** archive, not the main archive. They are not accessible via `apt` on standard Ubuntu 24.04 riscv64 installs without explicitly adding the ports repository.

**Arch Linux RISC-V** [NEEDS VERIFICATION -- archriscv.felixc.at was unreachable during verification]

The research findings describe JDK 8, 11, 17, 21, and 26 as available via `https://riscv.mirror.pkgbuild.com/repo/extra/`, but the primary Arch RISC-V status site returned 404 during adversarial verification.

**PyPI** -- no `openjdk` package exists on PyPI. The endpoint `https://pypi.org/pypi/openjdk/json` returns HTTP 404.

---

## 9. Dependencies

OpenJDK's build dependencies fall into three categories: external system libraries, bundled third-party sources, and the Boot JDK.

| Dependency | Role | riscv64 Status | Notes |
|---|---|---|---|
| HotSpot C1/C2 JIT (internal) | Tiered JIT | Green -- full riscv64 backend in mainline | See section 4 |
| zlib 1.3.2 (bundled) | JAR/class decompression | Green -- pure C, no arch-specific code | No issues |
| libjpeg IJG (bundled) | JPEG decode in java.desktop | Green (functional), Yellow (performance) | No RVV paths; scalar C only. OpenJDK bundles IJG, not libjpeg-turbo |
| libpng (bundled) | PNG decode in java.desktop | Yellow -- bundled version predates 2025 RVV correctness fixes | Use `--with-libpng=system` with libpng >= 1.6.45 on riscv64; correctness bugs (Paeth filter, C920 crash) fixed upstream Dec 2025 / Jul 2025 |
| giflib (bundled) | GIF decode | Green -- pure C | No issues |
| lcms2 / Little CMS (bundled) | ICC color profile | Green -- pure C | No issues |
| HarfBuzz (bundled) | OpenType font shaping | Green -- builds cleanly, no riscv64 issues filed | No SIMD optimization but not required for correctness |
| FreeType (external) | Font rasterization | Green -- pure C, ships in Debian/Ubuntu riscv64 | No riscv64-specific optimizations; correctness is arch-independent |
| ALSA (external) | Audio | Green -- kernel subsystem | Linux ALSA supports riscv64 |
| Fontconfig (external) | Font discovery | Green -- pure C | No issues |
| CUPS (external) | Print system | Green -- header-only at build time | No issues |
| X11/libX11 (external) | AWT windowing | Green -- arch-independent | No issues |
| libffi (external, Zero variant only) | FFI for interpreter-only Zero JVM | Yellow -- struct_by_value_big test fails on riscv64 (open [#694](https://github.com/libffi/libffi/issues/694)); build failure on some configs (open [#777](https://github.com/libffi/libffi/issues/777)) | Affects only `--with-jvm-variants=zero` builds; standard HotSpot is unaffected |
| OpenSSL (runtime, optional PKCS11) | TLS via JSSE PKCS#11 provider | Yellow -- AES T-table is not constant-time on hardware without Zkn/Zvkned; SSL test hangs at high parallelism (open [#22166](https://github.com/openssl/openssl/issues/22166)); mitigations in open PRs [#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082) | Not a build-time dep; affects runtime security posture |
| glibc (system) | C runtime, riscv_hwprobe | Mostly Green -- `riscv_hwprobe` prototype fixed May 2025 (BZ #32932); vector register syscall clobber fixed Sep 2025 | Requires glibc >= 2.39 for hwprobe (kernel 6.4+) |

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

RISE (RISC-V Software Ecosystem) has explicit organizational involvement in OpenJDK on RISC-V:

- **Eclipse Adoptium partnership** (announced May 29, 2024, [blog post](https://riseproject.dev/2024/05/29/395/)): RISE and Eclipse Adoptium deliver Temurin binaries for Java on RISC-V.
- **Scaleway infrastructure** (announced September 9, 2024, [blog post](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/)): RISE provisions Scaleway EM-RV1 bare-metal RISC-V instances for Adoptium's OpenJDK build and test workloads.
- **Optimization work** (RISE blog, 2025): Rivos employees Hamlin Li and Ludovic Henry have published RISE-attributed technical work on CMoveX vectorization and SLEEF math intrinsics.
- The RISE blog explicitly lists "JDK backporting" alongside Go and Python as a RISE-supported software area.

No RFP number specifically for OpenJDK was recoverable from public RISE pages. No funding amounts are disclosed. Rivos is a RISE member; its employees conduct the active optimization work attributed to RISE.

RISE Premier Members relevant to OpenJDK RISC-V: Red Hat, DAMO Academy (Alibaba) -- both were JEP 422 co-sponsors.

OpenJDK itself is not listed as a RISE member project.

### 10.2 Activity Cadence

From GitHub search (June 2026): approximately 1,200+ RISC-V-matching PRs total in openjdk/jdk (8 open, 1,183+ closed). Consistent pace of 5-15 RISC-V-specific PRs merged per month since 2022.

Active areas as of mid-2026: ISA extension auto-detection (Zvbb, Zvkn, Zvkg), vector (RVV) intrinsics, cryptographic intrinsics (AES/GCM), C2 code generation, test enablement (IR matching tests for riscv64), ZGC and Shenandoah barrier correctness.

---

## 11. Known Bugs and Active Issues

All formal bug tracking is at [bugs.openjdk.org](https://bugs.openjdk.org). GitHub Issues are disabled for openjdk/jdk. The JDK-XXXXXXXX identifiers embedded in PR titles correspond to entries in that tracker.

### 11.1 Open Pull Requests (RISC-V specific, as of June 2026)

| PR | JDK Bug | Title | Type | Age | Status |
|---|---|---|---|---|---|
| [#31588](https://github.com/openjdk/jdk/pull/31588) | JDK-8386945 | RISC-V: Auto-enable Zvbb extension features | Performance | < 1 week | 2 reviews, all checks pass, ready to merge |
| [#31424](https://github.com/openjdk/jdk/pull/31424) | JDK-8385323 | Support capstone on riscv64 | Tooling | 10 days | Open, rfr |
| [#31246](https://github.com/openjdk/jdk/pull/31246) | JDK-8384404 | RISCV: Do less implicit narrowing conversions | Code quality | 4 weeks | Open, rfr |
| [#28894](https://github.com/openjdk/jdk/pull/28894) | JDK-8374184 | RISC-V: implement GCM intrinsic with Zvkg and Zvkned | Crypto perf | 6 months | Stalled, 0 reviews; auto-closed May 2026, reopened Jun 9 2026 |
| [#28541](https://github.com/openjdk/jdk/pull/28541) | JDK-8372701 | Randomized profile counters | Performance | 7 months | Open |
| [#26823](https://github.com/openjdk/jdk/pull/26823) | JDK-8364407 | [REDO] Consolidate Identity of self-inverse operations | Correctness | 10 months | IR test failure on riscv64 without UseZbb, confirmed on physical hardware |
| [#17750](https://github.com/openjdk/jdk/pull/17750) | JDK-8324124 | RISC-V: implement _vectorizedMismatch intrinsic | Performance | 2.5 years | Stalled; small-array regression (scalar peel fallback missing); author pinging `/keepalive` monthly; requires rebase |
| [#29844](https://github.com/openjdk/jdk/pull/29844) | JDK-8378094 | Consolidate JFR stack-walkers | Cross-platform | 4 months | Draft |

### 11.2 Noteworthy Fixed Bugs (selected, merged 2025-2026)

**JDK-8369947 -- Bytecode rewriting causes Java heap corruption on RISC-V** ([PR #27850](https://github.com/openjdk/jdk/pull/27850), integrated October 2025)

A memory ordering hazard specific to RISC-V's weak memory model. The interpreter's `patch_bytecode` routine wrote bytecode with a plain store; a concurrent executing thread could see the patched opcode before the associated reference (e.g., class) had been resolved and made visible. On aarch64, a control dependency from the bytecode fetch was sufficient protection. On RISC-V, that control dependency does not prevent reordering under the weak memory model. The fix adds `membar(MacroAssembler::StoreStore)` before the bytecode rewrite to guarantee the slow-path resolution result is visible before the patched opcode. Priority: P2 (Bug).

This is a correctness bug with potential for Java heap corruption. The fix required understanding of the RISC-V memory model vs. aarch64 -- a category of issue that will recur as more RISC-V-weak-memory-model assumptions propagate through the codebase.

**JDK-8376572 -- Interpreter: Load array index as signed int** ([PR #29458](https://github.com/openjdk/jdk/pull/29458), integrated February 2026)

The template interpreter was using `ld` (64-bit load) instead of `lw` (32-bit sign-extending load) for array indices stored on the operand stack. On RISC-V 64, this caused negative indices (e.g., -1 stored as `0xFFFFFFFF`) to be loaded as large positive 64-bit values (`0x00000000FFFFFFFF`), bypassing bounds checks and allowing silent out-of-bounds array access without throwing `ArrayIndexOutOfBoundsException`. Priority: P4 (Bug).

**JDK-8365206 / JDK-8365772 -- float16 NaN payload corruption** ([PR #26838](https://github.com/openjdk/jdk/pull/26838) and [PR #26883](https://github.com/openjdk/jdk/pull/26883), merged August-September 2025)

NaN payload bits were incorrectly truncated in both the scalar (slow path) and vector paths for float-to-float16 conversion on riscv64. Both fixed.

**JDK-8349632 -- Add Zfa fminm/fmaxm for correct NaN-propagating min/max** ([PR #23509](https://github.com/openjdk/jdk/pull/23509), merged March 2025)

Added `fminm`/`fmaxm` from the Zfa extension for IEEE 754-2019-compliant NaN-propagating min/max semantics, replacing a software workaround requiring branching.

**ZGC and Shenandoah barrier fixes (2026)**

- [PR #30893](https://github.com/openjdk/jdk/pull/30893): RISC-V: Missing InlineSkippedInstructionsCounter in ZGC barrier stubs (merged April 2026)
- [PR #30990](https://github.com/openjdk/jdk/pull/30990): RISC-V: ShenandoahBarrierSetAssembler calls wrong barrier (merged April 2026)
- [PR #31106](https://github.com/openjdk/jdk/pull/31106): RISC-V: entry_barrier_offset should consider UseZtso (merged May 2026)

### 11.3 Stalled PRs: Risk Assessment

**PR #17750 (_vectorizedMismatch intrinsic)** is the oldest open RISC-V PR (2.5 years). The blocker is a small-array performance regression: RVV setup overhead exceeds scalar cost for inputs smaller than ~64 elements. A scalar peel/fallback path is needed before any reviewer will approve. No reviewer has committed to this. The author is keeping the PR alive with monthly `/keepalive` pings. As of June 2026, the PR has merge conflicts. This is a medium-priority optimization (Enhancement P4) but the stall reflects a broader pattern: RISC-V PRs with performance regressions require hardware-backed micro-architecture analysis that not all reviewers can perform.

**PR #28894 (GCM intrinsic)** was auto-closed by the OpenJDK bot for inactivity after 6 months and no reviews. The author reopened it June 9, 2026. Companion PR [#31423](https://github.com/openjdk/jdk/pull/31423) (Zvkn/Zvkg auto-enable) merged June 10, 2026, improving the relevance of this intrinsic. Still needs 2 reviews.

---

## 12. Objections and Upstream Blockers

**Memory model correctness surface.** The `patch_bytecode` heap corruption bug (JDK-8369947) and the array index sign extension bug (JDK-8376572) both reflect that RISC-V's weak memory model and 64-bit load semantics create a category of silent correctness bugs that are non-obvious to reviewers familiar only with x86 TSO or aarch64. These bugs survived to production (tier1-tier4 passed on HiFive Unmatched at JDK 19 integration). Expect more such bugs to surface as the port runs on more diverse hardware with more workloads.

**No native riscv64 test execution in openjdk/jdk CI.** The upstream CI catches cross-compilation failures only. All riscv64 functional testing occurs outside openjdk/jdk -- in Adoptium CI on Scaleway EM-RV1 hardware operated by RISE, with no publicly documented configuration or results. A regression in the riscv64 JIT or GC barriers could go undetected until a downstream distribution catches it.

**Crypto intrinsic coverage gap.** The GCM intrinsic (PR #28894) has been open since December 2025 with no reviews. GCM is the dominant AEAD cipher in TLS 1.3 and is performance-critical for server workloads. Until merged, GCM throughput on hardware with Zvkg+Zvkned is left on the table. On hardware without those extensions, GCM falls back to a Java-layer implementation.

**IJG libjpeg: no RVV SIMD.** OpenJDK bundles the IJG version of libjpeg, not libjpeg-turbo. All JPEG decode in java.desktop runs at scalar C speed on riscv64. This is a persistent performance gap vs. arm64 builds that use libjpeg-turbo with NEON SIMD. Switching the bundled library requires upstream consensus (affects all platforms, not just RISC-V).

**Zvbb not yet auto-enabled.** PR #31588 has two approvals and is ready to merge as of June 19, 2026. Until merged, AES-GCM and vector rotate operations do not benefit from Zvbb on hardware that supports it (measured 10x improvement for AES-GCM decrypt at 1024 bytes on SpacemiT Key Stone K3). This is days from resolution, not a structural blocker.

**libffi issues affect Zero JVM only.** Two open libffi issues ([#694](https://github.com/libffi/libffi/issues/694), [#777](https://github.com/libffi/libffi/issues/777)) affect `--with-jvm-variants=zero` builds. Standard HotSpot is unaffected.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 port is functionally complete for enterprise workloads. All four JVM execution tiers, all four GC implementations, Panama FFI, and Project Loom are implemented. The only material functional gaps are:

- GCM intrinsic (PR #28894, needs reviewer)
- `_vectorizedMismatch` intrinsic (PR #17750, needs scalar fallback implementation)

Both are performance optimizations, not functional blockers.

### 13.2 Performance Optimization

Published data points (all self-relative, riscv64 with vs. without optimization):

| Optimization | Speedup | Source |
|---|---|---|
| Zvbb auto-enable (AES-GCM decrypt 1024 bytes) | ~10x | [PR #31588](https://github.com/openjdk/jdk/pull/31588), SpacemiT Key Stone K3 |
| Zvbb auto-enable (vector rotate +93-95%) | ~2x | [PR #31588](https://github.com/openjdk/jdk/pull/31588) |
| GCM intrinsic (Zvkg+Zvkned, 16384 bytes) | +20.6% | [PR #28894](https://github.com/openjdk/jdk/pull/28894) |
| CMoveF/D vectorization (average) | ~2.2x | [RISE blog](https://riseproject.dev/2025/07/23/cmovex-vectorization/) |
| SLEEF vectorized math (average) | ~2.4x | [RISE blog](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/) |
| SLEEF vectorized math (ATAN2 float, max width) | ~7.7x | [PR #21083](https://github.com/openjdk/jdk/pull/21083) |

No riscv64 vs. arm64 cross-architecture whole-JVM benchmark data is available in any public source found by this research.

### 13.3 CI/CD Infrastructure

The most significant gap for engineering confidence is the absence of native riscv64 test execution in openjdk/jdk CI. The current state:

- openjdk/jdk CI: cross-compile build of Hotspot only, no tests run
- Adoptium CI: native riscv64 build and test on Scaleway EM-RV1 (RISE-provisioned), no public results URL documented

Recommendation: investing in a native riscv64 runner attached to openjdk/jdk CI (or at minimum a QEMU-based jtreg tier-1 job) would provide catch-up for the class of bugs (JDK-8369947, JDK-8376572) that currently reach downstream distributions before being detected. The Scaleway EM-RV1 is a known working platform.

### 13.4 Ecosystem Enablement

| Channel | Status |
|---|---|
| Eclipse Adoptium Temurin 21 | Available with 23 riscv64 assets |
| Debian sid | JDK 11/17/21/25/26 riscv64 packages present |
| Ubuntu 24.04 ports | JDK 11/17/21 (requires adding ports repo) |
| Arch Linux RISC-V | [NEEDS VERIFICATION -- primary site unreachable] |

The Adoptium Temurin distribution is the primary enterprise-grade binary. JDK 21 LTS is covered. JDK 17 LTS riscv64 Temurin availability is claimed by RISE but not confirmed in Adoptium GitHub release assets.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land GCM intrinsic (PR #28894): add reviewer time, unblock stalled PR | 2-3 | Any qualified HotSpot reviewer | High |
| Functional | Land _vectorizedMismatch (PR #17750): implement scalar peel fallback, rebase, land | 4-6 | PR author + reviewer | Medium |
| Performance | Track and validate Zvbb auto-enable (PR #31588) merge | < 1 (monitoring) | -- | High (near-done) |
| Performance | Audit remaining crypto intrinsic gaps vs. arm64 (ChaCha20-Poly1305, etc.) | 2-4 | HotSpot RISC-V contributor | Medium |
| Performance | Obtain and publish cross-architecture (riscv64 vs arm64) benchmark data | 3-5 | Any contributor with access to both platforms | Medium |
| CI/CD | Add QEMU-based jtreg tier-1 job to openjdk/jdk CI for riscv64 | 4-8 | Infrastructure + a maintainer | High |
| CI/CD | Document and make public the Adoptium/RISE native riscv64 test results | 1-2 | RISE / Adoptium | Medium |
| Ecosystem | Confirm and publicize Temurin 17/22 riscv64 binary availability (resolve discrepancy) | 1 | RISE / Adoptium | Medium |
| Correctness | Audit codebase for remaining weak-memory-model assumptions (focus: interpreter, JIT, barriers) | 6-10 | HotSpot RISC-V reviewer with memory model expertise | High |
| Dependency | Evaluate --with-libpng=system on riscv64 to pick up RVV fixes; track libpng bundled version update | 1-2 | Build/portability contributor | Low |
| Dependency | Track libffi open issues (#694, #777) for Zero JVM builds | 0.5 (monitoring) | -- | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [JEP 422: Linux/RISC-V Port](https://openjdk.org/jeps/422)
- [openjdk/jdk GitHub repository](https://github.com/openjdk/jdk)
- [openjdk/riscv-port staging repository](https://github.com/openjdk/riscv-port)
- [OpenJDK census -- riscv-port project](https://openjdk.org/census#riscv-port)
- [OpenJDK bug tracker](https://bugs.openjdk.org)
- [PR #31588: RISC-V: Auto-enable Zvbb extension features](https://github.com/openjdk/jdk/pull/31588)
- [PR #31423: RISC-V: Auto-enable Zvkn/Zvkg extension features](https://github.com/openjdk/jdk/pull/31423)
- [PR #31106: RISC-V: entry_barrier_offset should consider UseZtso](https://github.com/openjdk/jdk/pull/31106)
- [PR #30990: RISC-V: ShenandoahBarrierSetAssembler](https://github.com/openjdk/jdk/pull/30990)
- [PR #30893: RISC-V: Missing InlineSkippedInstructionsCounter in ZGC barrier stubs](https://github.com/openjdk/jdk/pull/30893)
- [PR #29458: RISC-V: Interpreter: Load array index as signed int](https://github.com/openjdk/jdk/pull/29458)
- [PR #28894: RISC-V: implement GCM intrinsic with Zvkg and Zvkned extension](https://github.com/openjdk/jdk/pull/28894)
- [PR #27850: Bytecode rewriting causes Java heap corruption on RISC-V](https://github.com/openjdk/jdk/pull/27850)
- [PR #25252: RISC-V: Add Zabha](https://github.com/openjdk/jdk/pull/25252)
- [PR #25181: RISC-V: Add riscv backend for Float16 operations - vectorization](https://github.com/openjdk/jdk/pull/25181)
- [PR #17750: RISC-V: implement _vectorizedMismatch intrinsic](https://github.com/openjdk/jdk/pull/17750)
- [RISE blog: Java on RISC-V: RISE and Eclipse Adoptium Partnership (May 2024)](https://riseproject.dev/2024/05/29/395/)
- [RISE blog: Leveraging Scaleway to support the RISC-V Software Ecosystem (Sep 2024)](https://riseproject.dev/2024/09/09/leveraging-scaleway-to-support-the-risc-v-software-ecosystem/)
- [RISE blog: OpenJDK: CMoveX and Vectorization (Jul 2025)](https://riseproject.dev/2025/07/23/cmovex-vectorization/)
- [RISE blog: OpenJDK: Supercharging Vectorized Math with SLEEF (Sep 2025)](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [Adoptium temurin21-binaries releases](https://github.com/adoptium/temurin21-binaries/releases)
- [OpenJDK build documentation (doc/building.md)](https://github.com/openjdk/jdk/blob/master/doc/building.md)
- [OpenJDK cross-compile CI workflow](https://github.com/openjdk/jdk/blob/master/.github/workflows/build-cross-compile.yml)
- [libffi riscv64 struct_by_value_big test failure #694](https://github.com/libffi/libffi/issues/694)
- [libffi riscv64 build failure #777](https://github.com/libffi/libffi/issues/777)
- [OpenSSL riscv64 test hang at high parallelism #22166](https://github.com/openssl/openssl/issues/22166)