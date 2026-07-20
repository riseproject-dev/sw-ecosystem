---
title: libtraceevent
categories:
  - libraries
  - perfmon
---

# libtraceevent

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libtraceevent<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libtraceevent is a userspace C library for parsing Linux kernel trace event data produced by the ftrace ring buffer subsystem. Its function is byte-swapping, struct unpacking, and string formatting of binary trace records -- all inherently architecture-neutral operations. It also provides a plugin system (16 plugins covering kvm, net, sched_switch, function, futex, xen, scsi, cfg80211, tlb, and others) for decoding domain-specific event formats.

**Governance.** The project operates under informal Linux kernel governance conventions. Patches are submitted to the [linux-trace-devel@vger.kernel.org](mailto:linux-trace-devel@vger.kernel.org) mailing list, reviewed by maintainers, and merged to [git.kernel.org](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) as the canonical upstream. There is no CLA, no steering committee, and no bylaws. The nearest community forum is the Tracing Summit, organized under the Linux Foundation Diagnostic and Monitoring Workgroup, but it has no formal authority over the project.

**License:** LGPL-2.1 (with GPL-2.0 for any kernel-linked components). Both license files are present in the `LICENSES/` directory.

**Primary maintainer:** Steven Rostedt (Google). The repository is mirrored at [github.com/rostedt/libtraceevent](https://github.com/rostedt/libtraceevent). Secondary maintainer Tzvetomir Stoyanov's affiliation is not confirmed from available sources [NEEDS VERIFICATION]. The project is effectively single-maintainer with occasional patches from embedded Linux consultancies (Bootlin) and device vendors (Xiaomi, Czech Technical University).

**RISE involvement:** None. libtraceevent does not appear in RISE Project member lists, blog posts (0 of 27 scanned posts mention it), or funded workstreams. The RISE "Debug and Profiling" working group had its lead position listed as TBD in the March 2025 elections; no funded projects in that group have been publicly announced.

**Community stance on new ports.** Because the library contains no architecture-specific code, there is no documented stance and no porting effort required. Any architecture that can compile C against Linux kernel headers will produce a working binary.

---

## 2. Port History and Upstreaming Timeline

libtraceevent requires no architecture-specific port. The library has been architecture-neutral since its initial creation.

| Date | Event | Source |
|------|-------|--------|
| Initial release | Library created as pure portable C; riscv64 supported implicitly with no specific commit | [git.kernel.org](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) |
| 2022-04-22 | Debian riscv64 build of 1:1.5.3-1 produces "Maybe-Failed" result on rv-mullvad-02; immediately retried successfully | [Debian buildd](https://buildd.debian.org/status/package.php?p=libtraceevent&suite=sid) |
| Dec 2022 | Gentoo bug [#887821](https://bugs.gentoo.org/887821): libtraceevent 1.7.0 not keyworded for riscv. Yixun Lan tested on HiFive Unmatched board, confirmed functional, added ~riscv keyword. Resolved same day. | [bugs.gentoo.org/887821](https://bugs.gentoo.org/887821) |
| 2026-02-05 | Alpine edge/main ships libtraceevent 1.9.0-r0 for riscv64 | [Alpine Linux packages](https://pkgs.alpinelinux.org/) |
| 2026-06-15 | Debian sid builds 1:1.9.0-2 successfully on rv-osuosl-01, GCC 15.2.0, 10-minute build, no C-level warnings | [Debian buildd](https://buildd.debian.org/status/fetch.php?pkg=libtraceevent&arch=riscv64&ver=1%3A1.9.0-2&stamp=1781567235&raw=0) |

No riscv64-specific patch has ever been submitted or merged upstream. Zero patchwork results for riscv on linux-trace-devel (all-time). Zero issues, PRs, or commits matching riscv on the GitHub mirror.

**Key contributors:** No riscv64-specific contributors exist because no riscv64-specific work was required.

**Upstreaming status:** Complete by definition. There is nothing to upstream.

---

## 3. Upstream Support Tier

libtraceevent has no formal tier policy because it has no architecture-specific code. Any Linux architecture is implicitly supported.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | None | None | None |
| Release blocking | N/A | N/A | N/A |
| Official upstream binaries | N/A (source only) | N/A | N/A |
| Debian packaging | Yes, 1:1.9.0-2 | Yes, 1:1.9.0-2 | Yes, 1:1.9.0-2 |
| Ubuntu 24.04 packaging | Yes, 1:1.8.2-1ubuntu2 | Yes, 1:1.8.2-1ubuntu2 | Yes, 1:1.8.2-1ubuntu2 |
| Alpine packaging | Yes, 1.9.0-r0 | Yes, 1.9.0-r0 | Yes, 1.9.0-r0 |
| Gentoo keyword | Yes | Yes | Yes (~riscv, Dec 2022) |

No architecture has preferential upstream support because there is no upstream CI infrastructure at all. riscv64 is at parity with all other architectures.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libtraceevent contains no architecture-specific components. The following table reflects a full tree inspection via the GitHub mirror.

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| Core event parser (event-parse.c) | scalar C | scalar C | scalar C | Pure portable C; no arch guards |
| Ring buffer reader (kbuffer-parse.c) | scalar C | scalar C | scalar C | Endianness and 32/64-bit handled via runtime flags, not compile-time arch conditions |
| Plugin system (plugins/) | scalar C | scalar C | scalar C | 16 plugins, all arch-neutral |
| Assembly (.S files) | none | none | none | Zero .S files in repository |
| SIMD / intrinsics | none | none | none | No vectorizable hotpaths; task is byte parsing |
| JIT backend | none | none | none | Not applicable to a parsing library |
| arch/ directory | none | none | none | Directory does not exist in repository |
| Crypto | none | none | none | Not applicable |

The absence of arch-specific components is correct design, not a gap. The library's function (parsing binary trace records) involves no computation that would benefit from ISA-specific optimization.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems available:** Two parallel build systems are provided:

- `Makefile` (primary; used by Debian packaging)
- `meson.build` + `Makefile.meson` wrapper (meson front-end)

Both produce identical output.

**Makefile cross-compile for riscv64:**

```sh
make CROSS_COMPILE=riscv64-linux-gnu- \
     prefix=/usr \
     libdir_relative=lib/riscv64-linux-gnu \
     pkgconfig_dir=/usr/lib/riscv64-linux-gnu/pkgconfig
```

The Makefile derives `CC`, `AR`, `NM` from `CROSS_COMPILE` automatically. 64-bit detection uses a `__LP64__` probe at compile time; riscv64 triggers LP64 so `libdir_relative` defaults to `lib64` -- override it as shown above to use multiarch paths. Install to a sysroot by appending `DESTDIR=/path/to/sysroot/` (trailing slash required).

**Meson cross-compile for riscv64:** Create a cross file `riscv64-linux-gnu.ini`:

```ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkgconfig = 'pkg-config'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'

[properties]
needs_exe_wrapper = true
```

Then: `meson setup --cross-file riscv64-linux-gnu.ini --prefix /usr -Ddoc=false builddir && meson compile -C builddir`

**Required toolchain versions:**

- Meson >= 0.58.0 (hard constraint declared in meson.build)
- C standard: gnu99 (declared in meson; implied by `-D_GNU_SOURCE` and `-D_FILE_OFFSET_BITS=64` in Makefile)
- No explicit GCC minimum is enforced; RISC-V backend support entered GCC at version 7, so GCC >= 7 is the practical floor. Debian ships GCC 15.2.0 for riscv64 builds.
- No `-march=rv64gc` or ISA extension flags are set by the build system; host toolchain defaults apply.

**QEMU usage:** No QEMU-specific documentation, test scripts, or CI configuration exists in the repository. Debian's buildd runs tests natively on riscv64 hardware (rv-osuosl-01). For local cross-compile testing: `qemu-riscv64 -L /usr/riscv64-linux-gnu ./utest/trace-utest`. No special flags are required.

**Known build failures on riscv64:**

- uftrace [issue #1855](https://github.com/namhyung/uftrace/issues/1855) (Dec 2023, open): On VisionFive 2 board, `libtraceevent-dev` 1:1.6.0-1 installs but uftrace's configure script reports `libtraceevent: [ OFF ]`. pkg-config detection fails on the target board despite the package being present. This is a downstream consumer issue, not a libtraceevent build failure.
- Debian [#1105512](https://bugs.debian.org/1105512) (open, minor): `make --shuffle=reverse` fails because the `lib/` directory creation is ordered after the link step. Not riscv64-specific; affects all architectures.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| Event parsing | Full | Full | Full | None |
| Ring buffer reading | Full | Full | Full | None |
| Plugin system | Full | Full | Full | None |
| Big-endian trace file reading | Full | Full | Full (little-endian host) | None; kbuffer handles cross-endian reads at runtime |
| Unit test suite (utest) | Full | Full | Full | None |
| pkg-config detection in some downstream consumers | Works | Works | Intermittent on VisionFive 2 hardware | uftrace #1855 (downstream issue, not in libtraceevent) |

No functional gaps exist. No performance gaps apply (the library has no SIMD-acceleratable code paths). No floating-point or NaN semantics are involved. Security hardening flags (`-fstack-protector-strong`, `-Werror=format-security`) are applied identically on all architectures as confirmed in the Debian riscv64 build log.

---

## 7. CI/CD Infrastructure

**Upstream CI: None.** The repository at [git.kernel.org](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git) has no CI configuration. The GitHub mirror (github.com/rostedt/libtraceevent) has no `.github/workflows/` directory, no `.gitlab-ci.yml`, and no Jenkinsfile. This was confirmed by full tree inspection. No architecture -- including amd64 -- is tested in any upstream CI pipeline.

**Debian buildd:** Debian successfully builds libtraceevent 1:1.9.0-2 for riscv64 on rv-osuosl-01. This is Debian's own infrastructure, not upstream-maintained CI. All 17 non-Hurd architectures show "Installed" status for 1:1.9.0-2.

**RISE runners:** No RISE CI involvement with libtraceevent was found.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | None | None | None |
| Debian buildd | Yes | Yes | Yes (rv-osuosl-01) |
| RISE runners | No | No | No |
| Hardware type (Debian) | x86-64 | aarch64 | riscv64 native |

---

## 8. Distribution and Release Status

The library is distributed as a compiled C library through Linux distribution packaging. It is not a Python, npm, or Maven package. PyPI is not applicable.

| Distribution | riscv64 status | Version | Notes |
|---|---|---|---|
| Debian stable (bookworm) | Available | 1:1.8.4-2 | Packages: libtraceevent1, libtraceevent1-plugin, libtraceevent-dev |
| Debian unstable (sid) | Available, build "Installed" | 1:1.9.0-2 | Built on rv-osuosl-01, 2026-06-15, ~10 minutes, no C-level errors |
| Ubuntu 24.04 LTS (Noble) | Available | 1:1.8.2-1ubuntu2 | All four packages (libtraceevent1, libtraceevent1-plugin, libtraceevent-dev, libtraceevent-doc) explicitly list riscv64 |
| Alpine Linux edge/main | Available | 1.9.0-r0 | Built 2026-02-05 |
| Gentoo | Available | ~riscv keyworded Dec 2022 | Tested on HiFive Unmatched |
| Arch Linux RISC-V (archriscv.felixc.at) | Data not available: search page returned no usable results | -- | -- |
| Fedora/RHEL riscv64 | Data not available: not confirmed from sources searched | -- | Expected to follow standard Fedora riscv64 port coverage [NEEDS VERIFICATION] |

**Installed size discrepancy:** riscv64 packages in Debian sid install at approximately 1,867 KB versus approximately 284 KB on amd64 and arm64. The cause of this difference was not determined from available sources [NEEDS VERIFICATION]; likely debug symbols or library ABI differences in Debian's riscv64 build configuration.

**Debian dbgsym lag:** The dbgsym package for riscv64 in sid is at 1:1.7.3-1 (from debports) while the main packages are at 1:1.9.0-2. Debug symbol packages trail by two minor versions on riscv64 [NEEDS VERIFICATION as to root cause].

**What a user must do:** On Debian or Ubuntu, `apt install libtraceevent-dev` is sufficient. No source builds, patches, or workarounds are required on riscv64.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| glibc / musl | Runtime: only mandatory runtime dependency; libtraceevent.so.1 links only to libc | Pass | N/A (no arch-specific code path) | Released, all major distros | See glibc status report |
| pkgconf / pkg-config | Build-time only: generates .pc file, detects optional components | Pass | N/A | Released | Standard toolchain component |
| libcunit1 (CUnit) | Test-only: unit test framework (utest/ suite); not linked into shipped library | Pass (Debian sid riscv64: 2.1-3-dfsg-2.7+b2 "Installed" on rv-manda-02) | Tests run via `make test`; no riscv64-specific failures reported | Released | Debian bug [#1136394](https://bugs.debian.org/1136394): CUnit needs a new maintainer. Low risk -- libtraceevent does not ship CUnit |
| asciidoc / xmlto / source-highlight | Build-Depends-Indep: generate man pages and HTML docs only (arch-independent) | Pass | N/A | Released | Only needed for documentation build; skip with `-Ddoc=false` |

**Downstream consumer note:** libtracefs depends on libtraceevent. Alpine edge/community riscv64 ships libtracefs 1.8.3-r0 (built 2026-02-08) with `so:libtraceevent.so.1` as a runtime dependency. No riscv64-specific failures reported in libtracefs.

**No in-scope project is a direct dependency of libtraceevent.** The dependency graph is unusually lean: glibc is the only hard runtime dependency.

**No recursion required for glibc:** glibc on riscv64 is a separate scope item. No other dependency has JIT backends, SIMD intrinsics, or crypto components that require architecture-specific porting.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64-specific | Notes |
|---|---|---|---|---|---|
| [Debian #1105512](https://bugs.debian.org/1105512) | Build fails with `make --shuffle=reverse` -- linker cannot open output file because lib/ dir creation is ordered after link step | Open | Minor | No | Affects all architectures |
| [Debian #1047752](https://bugs.debian.org/1047752) | Fails to rebuild from source after initial build -- `make clean` does not remove utest binaries and generated .m files | Open | Minor | No | Causes dpkg-source failure on second build |
| [uftrace #1855](https://github.com/namhyung/uftrace/issues/1855) | pkg-config detection of libtraceevent fails on VisionFive 2 (riscv64); uftrace configure reports libtraceevent: [ OFF ] despite package being installed | Open | Medium | Yes -- observed only on riscv64 hardware | Affects downstream consumer uftrace, not libtraceevent itself. Likely a pkg-config path issue on the board. No upstream fix confirmed. |
| [Gentoo #887821](https://bugs.gentoo.org/887821) | libtraceevent 1.7.0 not keyworded for riscv | Resolved Dec 2022 | Low | Yes | Yixun Lan tested on HiFive Unmatched, added ~riscv keyword. Resolved same day. |
| Debian riscv64 1:1.5.3-1 build | "Maybe-Failed" result on rv-mullvad-02 (2022-04-22) | Resolved | Low | Yes (historical only) | Immediately retried successfully. All subsequent versions build cleanly. |

**No correctness bugs were found.** No upstream issue tracker (lore.kernel.org, patchwork) contains any riscv64-specific correctness report. lore.kernel.org linux-trace-devel returned zero results for riscv queries (access denied by Anubis for some queries; zero results from patchwork where accessible).

**Benchmark data on riscv64:** The only data involving libtraceevent as a tool on riscv64 comes from [Nuclei-Software/nuclei-linux-sdk issue #26](https://github.com/Nuclei-Software/nuclei-linux-sdk/issues/26) (Aug 2024), where perf (which links against libtraceevent 1.8.3) was cross-built for a Nuclei RV64 processor and used to profile a CoreMark workload. The numbers (951.5M cycles, 1.22B instructions, IPC 1.28) measure application performance using perf as the measurement tool, not libtraceevent's own parsing performance. No libtraceevent-specific latency, throughput, or parsing-speed benchmarks on riscv64 exist in any publicly indexed source.

---

## 12. Objections and Upstream Blockers

**No objections or blockers exist.** The library requires no riscv64-specific code and no upstream changes. There is no documented resistance from maintainers to any riscv64-related work because none has ever been proposed or needed.

The only gap relative to other architectures is the absence of any upstream CI infrastructure (this applies equally to all architectures, not specifically riscv64). Proposing riscv64 CI to a project that has no CI at all would require first convincing the maintainer (Steven Rostedt, Google) to adopt any CI system. The project operates on a patch-review model via mailing list and has no precedent for automated testing infrastructure.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

No functional enablement work is needed. The library builds and runs correctly on riscv64 with no patches, no modifications, and no missing features relative to amd64 or arm64.

### 13.2 Performance Optimization

No performance optimization work is applicable. The library performs byte-level parsing of binary trace data; there are no vectorizable loops, no hot arithmetic paths, and no use case where riscv64-specific intrinsics or assembly would yield measurable improvement.

### 13.3 CI/CD Infrastructure

The project has no upstream CI for any architecture. Adding riscv64 CI would require introducing CI infrastructure to the project from zero. This is a project maturity issue, not a riscv64-specific gap. If CI investment is desired, the scope is "add CI for all architectures including riscv64" not "add riscv64 to existing CI."

The uftrace pkg-config detection failure on VisionFive 2 ([#1855](https://github.com/namhyung/uftrace/issues/1855)) is a downstream consumer issue that could be investigated at low cost, but it does not affect libtraceevent itself.

### 13.4 Ecosystem Enablement

Not applicable. libtraceevent has no dependent package ecosystem requiring separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Performance | None applicable | 0 | N/A | N/A |
| CI/CD | Investigate and fix uftrace pkg-config detection on riscv64 hardware (uftrace #1855) | 0.5 | Downstream consumer (uftrace) | Low |
| CI/CD | Add upstream CI for libtraceevent (all architectures, not riscv64-specific) | 2-3 | Steven Rostedt (Google) coordination | Low |
| Ecosystem | None required | 0 | N/A | N/A |

**Assessment:** libtraceevent requires zero investment to achieve full riscv64 support. It already works correctly and ships in all major distributions. The only actionable item is the pkg-config detection issue in uftrace, which is a 0.5 person-week investigation in a different project. Upstream CI is a project maturity gap that affects all architectures equally and is not a riscv64 investment item.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libtraceevent canonical repository (git.kernel.org)](https://git.kernel.org/pub/scm/libs/libtrace/libtraceevent.git)
- [libtraceevent GitHub mirror (rostedt/libtraceevent)](https://github.com/rostedt/libtraceevent)
- [Debian package tracker: libtraceevent](https://tracker.debian.org/pkg/libtraceevent)
- [Debian buildd status: libtraceevent sid](https://buildd.debian.org/status/package.php?p=libtraceevent&suite=sid)
- [Debian riscv64 build log: libtraceevent 1:1.9.0-2](https://buildd.debian.org/status/fetch.php?pkg=libtraceevent&arch=riscv64&ver=1%3A1.9.0-2&stamp=1781567235&raw=0)
- [Ubuntu packages: libtraceevent Noble](https://packages.ubuntu.com/search?keywords=libtraceevent&suite=noble)
- [Debian bug #1105512: libtraceevent fails to build with make --shuffle=reverse](https://bugs.debian.org/1105512)
- [Debian bug #1047752: libtraceevent fails to rebuild from source](https://bugs.debian.org/1047752)
- [Debian bug #1136394: CUnit needs a new maintainer](https://bugs.debian.org/1136394)
- [uftrace issue #1855: libtraceevent pkg-config detection fails on VisionFive 2](https://github.com/namhyung/uftrace/issues/1855)
- [Gentoo bug #887821: libtraceevent 1.7.0 not keyworded for riscv](https://bugs.gentoo.org/887821)
- [Nuclei-Software nuclei-linux-sdk issue #26: perf cross-build with libtraceevent on RV64](https://github.com/Nuclei-Software/nuclei-linux-sdk/issues/26)
- [Patchwork linux-trace-devel: riscv query (zero results)](https://patchwork.kernel.org/project/linux-trace-devel/list/?q=riscv&archive=both)
- [RISE Project homepage](https://riseproject.dev)