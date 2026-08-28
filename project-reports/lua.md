---
title: Lua
---

# Lua

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Lua<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Lua is a lightweight, embeddable scripting language implemented as a pure ISO C99 interpreter. The reference implementation (Lua 5.x) contains no JIT compiler, no assembly, and no architecture-specific code. Portability is achieved entirely through C standard type widths and POSIX interfaces; the explicit design goal since Lua 1.0 (1993) is "compiles unmodified on any platform with an ISO C compiler."

**Governance:** Lua is an academically-led project with no foundation and no corporate governance layer. The three-person core team - Roberto Ierusalimschy (professor, PUC-Rio), Waldemar Celes (professor, PUC-Rio/Tecgraf), and Luiz Henrique de Figueiredo (researcher, IMPA) - makes all decisions informally. The project is housed at LabLua, a research lab within PUC-Rio (Pontifical Catholic University of Rio de Janeiro, Brazil, non-profit). Donations flow through [Software in the Public Interest](https://www.spi-inc.org/) where Lua holds associated project status. No named corporate sponsors exist. Revenue comes from book sales (Programming in Lua), individual donations, and Zazzle merchandise. License: MIT.

**Community culture on new ports:** No formal tier policy and no port approval process exist. The stated stance is unconditional: any platform with a C compiler is supported. RISC-V required no community review, no approval, and no dedicated work.

**RISE membership:** Lua is not a RISE project member. No RISE blog posts mention Lua. The RISE Language Runtimes working group covers Java, Go, Python, .NET, and JavaScript (V8, SpiderMonkey) - Lua is out of scope.

**Development model:** Upstream development occurs via the [lua-l mailing list](https://www.lua.org/lua-l.html) and PUC-Rio infrastructure. The [lua/lua GitHub repository](https://github.com/lua/lua) is a read-only mirror. Issues are disabled on GitHub. This means any hypothetical RISC-V discussion would appear on the mailing list, not on GitHub.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 1993 | Lua 1.0 released as pure-C portable interpreter; architecture-agnostic by design from the start | [lua.org history](https://www.lua.org/history.html) |
| (no date) | No RISC-V-specific commit exists or has ever existed in lua/lua | [GitHub code search: `riscv repo:lua/lua` = 0 results](https://github.com/lua/lua) |
| ~2023 | Debian begins building lua5.4 for riscv64 as part of riscv64 port tier promotion | [Debian buildd sid](https://buildd.debian.org/status/package.php?p=lua5.4&suite=sid) |
| ~2024 | Debian sid lua5.4 5.4.8-2 confirmed "Installed" on riscv64 builder rv-osuosl-05 | [Debian buildd sid](https://buildd.debian.org/status/package.php?p=lua5.4&suite=sid) |
| 2024-09-08 | LuaJIT PR #1267 opened by IgnotaYun (PLCT Lab/ISCAS) adding full RISC-V 64 interpreter + JIT backend | [LuaJIT PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |
| 2024-11 | LuaJIT RISC-V packaged in Gentoo RISC-V overlay (from plctlab fork) | [plctlab/LuaJIT](https://github.com/plctlab/LuaJIT) |
| 2024-12-27 | LuaJIT RISC-V fix for fmin.d/fmax.d NaN semantics pushed to PR #1267 | [LuaJIT PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) |

**Key contributors:** The Lua 5.x RISC-V port has no named contributors because no dedicated porting work was required. The LuaJIT RISC-V port is authored by IgnotaYun (gns / ISRC, ISCAS) at PLCT Lab, Chinese Academy of Sciences.

**Upstreaming status for Lua 5.x:** Fully upstream and has been since the project's inception. No RISC-V patches exist because none were needed.

**Upstreaming status for LuaJIT:** Not upstream. PR #1267 has been open since September 2024 with 21 commits and 26 review comments, unmerged as of the last available data point.

---

## 3. Upstream Support Tier

Lua maintains no formal tier policy and publishes no platform support matrix. The project's documented portability stance - "Lua compiles unmodified in all platforms that have an ISO C compiler" - makes RISC-V implicitly first-class.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Official support statement | Yes (implicit) | Yes (implicit) | Yes (implicit) |
| CI in upstream repo | None | None | None |
| Release-blocking tests | None | None | None |
| Official upstream binaries | No (source-only) | No (source-only) | No (source-only) |
| Debian sid package | Yes | Yes | Yes (5.4.8-2, Installed) |
| Ubuntu 24.04 package | Yes | Yes | Yes |
| Arch Linux package | Yes | Yes | Likely [NEEDS VERIFICATION - status page 404] |

The upstream Lua project publishes source-only releases for all architectures equally. There are no official binary tarballs for any architecture on any platform. Distribution packages are the delivery mechanism for all architectures.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Lua 5.x has no architecture-specific subsystems. The following is the exhaustive inventory:

| Component | amd64 implementation | arm64 implementation | riscv64 implementation |
|-----------|---------------------|---------------------|----------------------|
| JIT compiler | Not present in Lua 5.x (separate project: LuaJIT) | Not present | Not present |
| Assembly | None | None | None |
| SIMD/intrinsics | None | None | None |
| Arch-specific #ifdefs | None (confirmed by code search) | None | None |
| GC barriers | Scalar C | Scalar C | Scalar C |
| Integer type selection | C standard `long long` / `double` | C standard `long long` / `double` | C standard `long long` / `double` |
| Float type selection | `double` (luaconf.h, arch-agnostic) | `double` | `double` |
| Pattern matcher (lstrlib.c) | Scalar C | Scalar C | Scalar C |
| UTF-8 library (lutf8lib.c) | Scalar C | Scalar C | Scalar C |

The `luaconf.h` configuration header contains platform guards only for Windows/Linux/macOS/iOS and C89 mode. Number type selection (`LUA_INT_TYPE`, `LUA_FLOAT_TYPE`) is based on C standard type widths, not CPU architecture. The `llimits.h` header is equally portable. GitHub code search for `#ifdef __riscv`, `#ifdef __aarch64`, and `#ifdef __x86_64` all return 0 results in the lua/lua repository - confirming no arch guards exist for any architecture.

**riscv64 LP64D ABI compatibility:** Lua's `lua_Integer` maps to `long long` (64-bit) and `lua_Number` maps to `double` (hardware FP). Both map cleanly to the riscv64 LP64D ABI (RV64GC baseline). No endianness-specific code exists; the standard C integer model applies directly.

**LuaJIT note:** LuaJIT is a separate project and is treated in Sections 9 and 11. Upstream LuaJIT has zero RISC-V support. The plctlab/LuaJIT fork has a full interpreter and JIT backend for RV64G LP64D (beta quality), implementing RVC, Zba, Zbb, Zicond, XTheadBa, XTheadBb, XTheadCondMov, XTheadMac extensions.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make exclusively. No CMakeLists.txt, no cmake toolchain files, no Dockerfiles, no Meson, no Autoconf. The build is a flat `makefile` at the repo root.

**Native build on riscv64:**

```
make MYCFLAGS="-std=c99 -DLUA_USE_LINUX" MYLIBS="-ldl" MYLDFLAGS="-Wl,-E"
```

**Cross-compilation from x86-64 host:**

```
make CC=riscv64-linux-gnu-gcc MYCFLAGS="-std=c99 -DLUA_USE_LINUX" MYLIBS="-ldl" MYLDFLAGS="-Wl,-E"
```

**Toolchain requirements:** Any GCC or Clang release that supports riscv64-linux-gnu target and C99. No minimum version is documented in the Lua source. No `-D` flags are RISC-V-specific; the Linux target flags above are identical for amd64 and arm64.

**QEMU:** No QEMU-specific documentation exists in the repository. Standard cross-testing via `qemu-riscv64-static` applies without modification.

**Known build failures:** None documented in any distro tracker. Debian sid lua5.4 5.4.8-2 built successfully on rv-osuosl-05 with no special patches. The Debian package requires `libc6 >= 2.36` on riscv64, slightly lower than the `>= 2.38` threshold on other architectures - this is a distro packaging detail, not a build failure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| Core interpreter | Full | Full | Full | None |
| Standard library (math, string, table, io, os, utf8) | Full | Full | Full | None |
| Dynamic module loading (package.loadlib) | Full | Full | Full | None |
| Coroutines | Full | Full | Full | None |
| 64-bit integers (lua_Integer) | Full | Full | Full | None |
| double-precision float (lua_Number) | Full | Full | Full | None |
| POSIX readline REPL | Full | Full | Full | None |
| JIT compilation | Via LuaJIT (separate project) | Via LuaJIT (separate project) | Partial (fork only, unmerged) | JIT gap in LuaJIT only |

**Functional gaps:** None in Lua 5.x itself. The only gap is in the separate LuaJIT project (see Section 9).

**Performance gaps:** Data not available: no riscv64 vs amd64 or riscv64 vs arm64 benchmark comparisons for Lua 5.x on native RISC-V hardware were found in any public source (Debian buildd logs, lua.org bugs page, lua-l mailing list, RISE blog, Phoronix, or the Benchmarks Game). The x86-64 reference data (AMD EPYC 7763, from [programming-language-benchmarks](https://programming-language-benchmarks.vercel.app/), dated 2025-08-01): lua 5.4.7 binarytrees n=15 = 817ms, nbody n=500000 = 1145ms. No riscv64 equivalents were found.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening analysis (stack canaries, CFI, shadow stack) was found for Lua on RISC-V.

**NaN / floating-point semantics:** No RISC-V-specific floating-point issues exist in Lua 5.x. A known bug (lua.org/bugs 5.4.2 #1) affects `table.sort` with NaN inputs on all architectures since 5.3 - this is not RISC-V-specific. The LuaJIT RISC-V fork had a NaN semantics bug in `math.min`/`math.max` (fmin.d/fmax.d return NaN when either operand is NaN, contradicting LuaJIT semantics); a fix was pushed December 27, 2024 using a comparison-based branch sequence because RISC-V lacks a flags register, conditional moves, and FPR bitwise operations. This bug does not affect Lua 5.x.

---

## 7. CI/CD Infrastructure

The lua/lua repository contains no CI infrastructure of any kind. This is confirmed by direct 404 responses on `.github/workflows/` (GitHub Actions), `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml`. The repo root contains only C source files, a makefile, and documentation.

| CI feature | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| GitHub Actions | No | No | No |
| RISE runners | No | No | No |
| Any CI | No | No | No |
| Release-blocking tests | No | No | No |

The absence of CI for all architectures equally reflects the upstream development model: Lua development occurs via PUC-Rio infrastructure and the lua-l mailing list, not via GitHub. The GitHub mirror is not a development target. Distribution build systems (Debian buildd, Ubuntu launchpad) provide the de facto per-architecture build validation.

---

## 8. Distribution and Release Status

**Upstream binaries:** The Lua project publishes source-only releases. GitHub releases v5.5.1, v5.5.0, v5.4.8, v5.4.7, and v5.4.6 each have an empty assets array - no binary tarballs for any architecture.

**Debian:** lua5.4 version 5.4.8-2 is available for riscv64 in Debian sid (unstable) with build status "Installed", built approximately 61 days ago on builder rv-osuosl-05. Packages: `lua5.4`, `liblua5.4-0`, `liblua5.4-dev`. Maintained by Debian Lua Team and Sergei Golovan. Debian bookworm (stable) does not include riscv64 for lua5.4 - bookworm predates Debian's riscv64 tier promotion.

**Ubuntu 24.04 (Noble):** lua5.4 and approximately 89 related packages (lua-lpeg, lua-expat, lua-filesystem, lua-cjson, and others) are listed as multi-architecture packages including riscv64, alongside amd64, arm64, armhf, ppc64el, and s390x.

**Arch Linux RISC-V:** The base `lua` package (version 5.5.1-1) does not appear in the [archriscv FTBFS list](https://archriscv.felixc.at/), suggesting it is available on the Arch RISC-V mirror. Direct confirmation via the status page was not obtained (page returned 404 during verification).

**LuaJIT distribution:** Debian sid ships LuaJIT on riscv64 in interpreter-fallback mode (version 2.1.0+openresty20251030) - JIT disabled. Gentoo RISC-V packages the plctlab/LuaJIT fork (packaged November 2024) from the `riscv64-v2.1-branch`. Gentoo explicitly masks all upstream LuaJIT versions as `-riscv` (unsupported).

**To get a working Lua 5.x binary on riscv64:** Install `lua5.4` from Debian sid or Ubuntu 24.04, or build from source with any riscv64-targeting C99 compiler. No patches, no special configuration, no additional steps.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|--------------|-------------|----------------|----------------|
| glibc (libm, libdl, libc) | C runtime; libm for math ops (lmathlib.c), libdl for dynamic module loading (loadlib.c), libc for I/O, strings, locale | Installed (Debian sid) | Green | Shipped | None known |
| readline (optional) | Interactive REPL line editing in lua.c; loaded at runtime via libreadline.so; soft dependency - Lua falls back if absent | Installed (Debian sid, readline 8.3-4) | Green | Shipped | None known |
| LuaJIT (separate project, not a dep of vanilla Lua 5.x) | JIT-compiled alternative runtime; required by embedders such as OpenResty, Neovim (LuaJIT mode), sysbench, KOReader | Interpreter-only mode in Debian sid (2.1.0+openresty20251030) | Partial (interpreter only; JIT disabled on riscv64) | Packaged without JIT | PR #1267 open since 2024-09-08, not merged; FFI struct passing partially broken in fork |

**LuaJIT deep-dive (critical dependency for performance-sensitive embedders):**

Upstream [LuaJIT/LuaJIT](https://github.com/LuaJIT/LuaJIT) has zero RISC-V support. The `src/lj_arch.h` file defines `LUAJIT_ARCH_*` values for x86, x64, ARM, ARM64, PPC, MIPS32, and MIPS64 only. Searching for "riscv" in the upstream repository returns 0 results. The `#else #error "Architecture not supported"` branch fires for any RISC-V compiler.

The active RISC-V port is [plctlab/LuaJIT](https://github.com/plctlab/LuaJIT) branch `riscv64-v2.1-branch`, authored by IgnotaYun (ISRC, ISCAS / PLCT Lab). Status: beta quality. Interpreter runtime complete, JIT compiler complete. Known remaining issue: FFI struct passing is partially broken.

Architecture constraints in the plctlab fork (`src/lj_arch.h`):
- Only RV64 (`__riscv_xlen == 64`); RV32 is not supported.
- Only little-endian. Big-endian riscv64 is not supported.
- Mandatory double-precision FPU ABI: `__riscv_float_abi_double` must be defined. Toolchain must target `lp64d` ABI. The `lp64` and `lp64f` ABIs produce a build error.
- `LJ_TARGET_GC64` is hardwired enabled (64-bit GC objects); `LUAJIT_DISABLE_GC64` has no effect on riscv64.
- Jump range: `LJ_TARGET_JUMPRANGE 30` (JAL +/-1 MB; AUIPC+JALR +/-2 GB).

Minimum toolchain for the plctlab fork: GCC >= 4.3 or Clang >= 3.5 per the source guards. In practice, GCC >= 12 or Clang >= 14 is required for a riscv64 toolchain with lp64d support and Zbb/Zba/Zicond ISA extension coverage used by the JIT backend. Binutils >= 2.35 is required for the `%got_pcrel_hi` relocation modifier; Yocto SDK 3.1.x (Binutils 2.34) fails to build.

Optional ISA extensions supported by the JIT backend: RVC, Zba, Zbb, Zicond, XTheadBa, XTheadBb, XTheadCondMov, XTheadMac.

**LuaJIT PR #1267 status:** Opened 2024-09-08, 21 commits, 26 comments, last updated 2026-08-11. Two correctness bugs were identified and fixed during review: (1) `pcall(pcall)` segfault due to register clobbering in `vm_riscv64.dasc` (fixed November 2024); (2) `math.min`/`math.max` NaN semantics broken because `fmin.d`/`fmax.d` return NaN when either operand is NaN, contradicting expected LuaJIT semantics. The fix requires a comparison-based branch sequence because RISC-V lacks a flags register, conditional moves, and FPR bitwise operations - unlike ARM64 which uses a multi-instruction sequence with existing support. Fix pushed December 27, 2024. PR is not yet merged. LuaJIT upstream issue [#628](https://github.com/LuaJIT/LuaJIT/issues/628) ("Add support for RISC-V") is the tracking umbrella, opened October 2020.

Downstream adoptions of the plctlab fork: Gentoo RISC-V overlay (November 2024), [OpenResty luajit2 fork PR #236](https://github.com/openresty/luajit2/pull/236), [ruyisdk/LuaJIT](https://github.com/ruyisdk/LuaJIT) mirror, KOReader tested on SiFive U74 hardware (March 2026) [NEEDS VERIFICATION].

The performance consequence of missing JIT on riscv64 is significant. On x86-64 AMD EPYC 7763: nbody n=500000 is 77ms with LuaJIT vs 1145ms with Lua 5.4 (15x gap). spectral-norm n=2000 times out (>4990ms) with Lua 5.4 but completes in 258ms with LuaJIT. Any embedder relying on LuaJIT for throughput (OpenResty/nginx, sysbench, Neovim with LuaJIT backend) operates at interpreter-only speeds on riscv64 today.

---

## 10. Ecosystem Status

Lua has a package ecosystem distributed via [LuaRocks](https://luarocks.org/) and via distribution package managers. The riscv64 status varies:

**Distribution packages (Ubuntu 24.04 Noble):** Approximately 89 Lua-related packages are listed as riscv64-compatible, including lua-lpeg, lua-expat, lua-filesystem, lua-cjson, lua-socket, and others. These packages follow the same pure-C or low-dependency pattern as Lua itself.

**Arch Linux RISC-V known failures:**
- `lua-language-server`: FTBFS (build() failed) - language server implemented in Lua + native components; the RISC-V failure is unrelated to Lua core.
- `lua-lut`: FTBFS (check() failed) - test suite failure on riscv64; nature of failure not documented in available research.

**LuaRocks:** Data not available: no riscv64-specific LuaRocks package availability survey was found. LuaRocks packages that are pure Lua work transparently. Packages with native C extensions follow standard C compilation patterns and would be expected to work on riscv64 without modification, though no survey data confirms this.

---

## 11. Known Bugs and Active Issues

**Lua 5.x (lua/lua):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [5.4.2 #1](https://www.lua.org/bugs.html) | `table.sort` with NaN produces wrong results | Open (known limitation) | Medium | Exists since 5.3; not riscv64-specific; affects all architectures |
| [5.4.3 #6](https://www.lua.org/bugs.html) | `luaV_shiftr` negation overflow (UB sanitizer) | Fixed in 5.4.4 | Low | Integer behavior; not riscv64-specific |
| [5.5.0 #2](https://www.lua.org/bugs.html) | `string.packsize` overflow (size_t wrap) | Fixed | Low | 64-bit integer builds; not riscv64-specific |
| [5.5.0 #3](https://www.lua.org/bugs.html) | `utf8.len` shift-exponent overflow (UB sanitizer, since 5.4.0) | Fixed | Low | Not riscv64-specific |

No riscv64-specific bugs exist in the Lua 5.x interpreter. The Debian bug tracker for lua5.4 on riscv64 shows "No reports found."

**LuaJIT (upstream and plctlab fork):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|---------|-------|
| [#628](https://github.com/LuaJIT/LuaJIT/issues/628) | Add support for RISC-V (umbrella) | Open since Oct 2020 | Critical | Upstream has zero RISC-V support; labels: 3.0, new port |
| [PR #1267](https://github.com/LuaJIT/LuaJIT/pull/1267) | Add support for RISC-V 64 Linux | Open (unmerged) since Sep 2024 | Critical | Full interpreter + JIT from plctlab; FFI struct passing partially broken; NaN semantics fix applied Dec 2024 |
| (no public ID) | `pcall(pcall)` segfault - register clobbering in `vm_riscv64.dasc` | Fixed in PR #1267 (Nov 2024) | High | Correctness bug; fixed during review |
| (no public ID) | `math.min`/`math.max` NaN semantics: `fmin.d`/`fmax.d` return NaN incorrectly | Fixed in PR #1267 (Dec 2024) | High | Correctness bug; branchless fix not available on RISC-V (no flags register, no FPR bitwise ops); branch sequence fix applied |
| (no public ID) | FFI struct passing partially broken | Open in plctlab fork | Medium | Workaround: `-DLUAJIT_DISABLE_FFI` |
| (no public ID) | Build failure with Binutils < 2.35 (Yocto SDK 3.1.x): missing `%got_pcrel_hi` | Open (toolchain constraint) | Medium | Upgrade Binutils to >= 2.35 (recommend >= 2.37) |
| (no public ID) | JIT mcode page allocation failures on some kernel versions (VA space issue on RISC-V) | Fixed in plctlab fork (`baf19cf2`: mremap non-moving) | Low | Specific to RISC-V Linux kernel VA space layout |

---

## 12. Objections and Upstream Blockers

**Lua 5.x:** No objections, no blockers. The project's design philosophy eliminates the need for any RISC-V-specific work. The core team has made no statements about RISC-V because no statements are needed. RISC-V support is unconditional and complete.

**LuaJIT upstream:**
- The LuaJIT upstream maintainer (Mike Pall) has previously stated that new architecture ports require sponsorship. This is a stated organizational blocker, not a technical objection.
- PR #1267 has 26 review comments over 10+ months with no merge signal. The upstream release cadence for LuaJIT is slow; the last official release was v2.1.0-beta3. The v2.1 rolling branch is the de facto production release, but merge authority remains with Mike Pall.
- The FFI struct passing bug is an open technical issue that must be resolved before merge is appropriate.
- **Acceptance probability:** Low-to-medium in the near term without sponsorship or a named maintainer committing to ongoing maintenance. The Debian and Gentoo packaging of the plctlab fork signals community confidence, but upstream merge is not guaranteed.

---

## 13. Investment Analysis

RISE has no involvement with Lua. No RISE funding, no RISE runners, no RISE blog posts. All work assessed below is unsponsored and not yet completed.

### 13.1 Functional Enablement

Lua 5.x: no work required. Fully functional today.

LuaJIT: the primary functional gap is the unmerged PR #1267. The interpreter and JIT backend are implemented (plctlab fork). The open work is: resolve the FFI struct passing bug, address any remaining reviewer comments, and coordinate with Mike Pall on merge conditions (which may require a sponsorship arrangement). If sponsorship is the gating condition, a direct approach to Mike Pall or the LuaJIT project may be more efficient than continued patch iteration.

### 13.2 Performance Optimization

Lua 5.x: no SIMD, no JIT, no architecture-specific optimization paths exist or are planned. Performance on riscv64 relative to amd64/arm64 is purely a function of hardware execution speed. No optimization work is applicable at the Lua source level.

LuaJIT: once PR #1267 is merged, further JIT optimization work could target RVV (RISC-V Vector Extension) for numeric loops. No such work exists today and would require significant LuaJIT internals expertise. Data not available: no benchmark comparing plctlab LuaJIT JIT performance on riscv64 hardware vs amd64 or arm64 was found.

### 13.3 CI/CD Infrastructure

The upstream lua/lua repository has no CI for any architecture and is unlikely to acquire it given the development model. The actionable CI investment is in distribution build systems (Debian buildd, Ubuntu Launchpad) which already cover riscv64 for Lua 5.x at no incremental cost.

For LuaJIT, adding a riscv64 CI job to the plctlab fork to gate future patches would reduce regression risk. Upstream LuaJIT has no CI infrastructure for any architecture.

### 13.4 Ecosystem Enablement

LuaRocks packages with native C extensions may need per-package validation on riscv64. Data not available: no riscv64 LuaRocks coverage survey was found. This is low-priority given that the packages likely build transparently, but a one-time audit would confirm coverage.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | Resolve LuaJIT PR #1267 FFI struct passing bug and drive upstream merge (includes sponsorship negotiation with Mike Pall) | 4-8 | PLCT Lab / prospective sponsor | Critical |
| Functional | Lua 5.x on riscv64 | 0 (complete) | - | Done |
| Performance | LuaJIT JIT backend tuning on riscv64 hardware (post-merge) | 8-16 | LuaJIT/RISC-V expert | Medium |
| Performance | RVV vectorization investigation for LuaJIT numeric loops | 16-24 | LuaJIT internals + RVV expert | Low |
| CI/CD | Add riscv64 CI to plctlab/LuaJIT fork | 1-2 | PLCT Lab | High |
| CI/CD | Lua 5.x riscv64 CI | 0 (not needed; distro buildd sufficient) | - | Not applicable |
| Ecosystem | riscv64 LuaRocks coverage audit for native-C packages | 2-4 | Distro maintainer | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [lua/lua GitHub mirror](https://github.com/lua/lua)
- [lua.org - official project homepage](https://www.lua.org/)
- [lua.org/bugs.html - upstream bug list](https://www.lua.org/bugs.html)
- [Debian buildd status: lua5.4, sid](https://buildd.debian.org/status/package.php?p=lua5.4&suite=sid)
- [Debian tracker: lua5.4](https://tracker.debian.org/pkg/lua5.4)
- [Ubuntu packages: Lua, Noble](https://packages.ubuntu.com/search?keywords=Lua&suite=noble)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/)
- [LuaJIT upstream repository](https://github.com/LuaJIT/LuaJIT)
- [LuaJIT issue #628: Add support for RISC-V (umbrella)](https://github.com/LuaJIT/LuaJIT/issues/628)
- [LuaJIT PR #1267: Add support for RISC-V 64 Linux](https://github.com/LuaJIT/LuaJIT/pull/1267)
- [plctlab/LuaJIT: RISC-V 64 fork, riscv64-v2.1-branch](https://github.com/plctlab/LuaJIT)
- [ruyisdk/LuaJIT: RISC-V fork mirror](https://github.com/ruyisdk/LuaJIT)
- [OpenResty luajit2 fork PR #236 (RISC-V)](https://github.com/openresty/luajit2/pull/236)
- [LabLua at PUC-Rio](http://www.lua.inf.puc-rio.br/)
- [Software in the Public Interest - Lua associated project](https://www.spi-inc.org/)
- [RISE Project - member list and blog](https://riseproject.dev/)
- [programming-language-benchmarks: Lua vs LuaJIT (x86-64 reference data)](https://programming-language-benchmarks.vercel.app/)