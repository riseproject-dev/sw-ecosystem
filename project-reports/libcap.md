---
title: libcap
parent: Project Reports
color: yellow
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: build-dependency
    criticality: critical
  - name: Linux-PAM
    relation: runtime-dependency
    criticality: optional
  - name: gperf
    relation: build-dependency
    criticality: optional
  - name: Go
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libcap" %}

# libcap

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libcap<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libcap is the reference C library for Linux POSIX capabilities (`capget`/`capset`/`prctl`). It also provides libpsx (POSIX semantics for Linux threads, making capability syscalls apply atomically across all threads of a process), `pam_cap` (a PAM module), and Go packages `cap` and `psx` under `kernel.org/pub/linux/libs/security/libcap`. The canonical source is [git.kernel.org/pub/scm/libs/libcap/libcap.git](https://git.kernel.org/pub/scm/libs/libcap/libcap.git), maintained by a single person and reachable by direct patch submission, not a pull-request workflow. Direct fetches of the kernel.org cgit pages are blocked by Anubis anti-bot protection; research in this report was conducted against the byte-identical read-only mirrors on [kernel.googlesource.com](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap) and the GitHub mirrors `sailfishos-mirror/libcap` and `AndrewGMorgan/libcap_mirror` (the latter is also where GitHub Issues are filed, since kernel.org itself has no issue tracker other than Bugzilla).

**Governance:** No foundation, no MAINTAINERS file, no formal governance document exists in the repository (the tree root holds only `.gitignore`, `CHANGELOG`, `License`, `Make.Rules`, `Makefile`, `README`, `cap/`, `contrib/`, `distcheck.sh`, `doc/`, `go/`, `goapps/`, `kdebug/`, `libcap/`, `pam_cap/`, `progs/`, `psx/`, `tests/`). libcap is a single-maintainer project: every commit, including both RISC-V-relevant ones, is authored or committed by Andrew G. Morgan (`morgan@kernel.org`). Morgan's day job is described as overseeing Google's machine fleet, but libcap itself carries no corporate sponsorship, employer affiliation, or foundation membership in any project document.

**License:** BSD-3-Clause OR GPL-2.0-only for the core library, libpsx, and the Go packages. `pam_cap.so` carries separate (GPL) terms.

**RISE Project:** libcap is not a RISE member project and has no dedicated RISE involvement. A full sitemap scan of [riseproject.dev/blog](https://riseproject.dev/blog) (33 posts as of 2026-09-30, including a site search for "libcap" returning zero results) found no post mentioning libcap. libcap is not listed among the 79 standalone packages on the [RISE Python wheel builder page](https://riseproject.gitlab.io/python/wheel_builder/). A code search of the RISE System Libraries working-group GitHub org (`riseproject-dev`, which took over working-group tracking from the blog on 2026-07-30) for "libcap" returned zero results. libcap's only documented RISE connection is as an **incidental, bundled copyleft dependency** pulled into riscv64 manylinux wheel builds for unrelated packages - `pycurl` ([PR #940](https://github.com/riseproject-dev/python-wheels/pull/940)), `hidapi` ([PR #1097](https://github.com/riseproject-dev/python-wheels/pull/1097)), `eckitlib` ([PR #2147](https://github.com/riseproject-dev/python-wheels/pull/2147)), and `libuuu` ([PR #2348](https://github.com/riseproject-dev/python-wheels/pull/2348)) - where it is tracked purely for GPL source-compliance metadata (via libcurl's, systemd's, or libudev's dependency closures), never as the subject of RISE-funded enablement work.

**Community stance on new ports:** Informal and low-ceremony. There is no written architecture-acceptance policy. In practice, architecture support is added ad hoc when a bug report (via kernel.org Bugzilla) identifies a gap, and the sole maintainer reviews and merges the fix personally. The riscv64 psx fix was prompted by Bugzilla #219687 and the CHERI-RISC-V pointer-alignment fix by Bugzilla #220415; neither originated from an organized porting initiative or corporate sponsor. No tiering, sponsorship requirement, or governance board gates new architecture support.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2025-02 | `psx/psx_calls.c`'s architecture-detection guard did not include `__riscv` (GCC defines `__riscv`, not `__riscv__`, which the original guard did not anticipate), so riscv64 builds of the psx mechanism failed to compile correctly. Reported as [kernel.org Bugzilla #219687](https://bugzilla.kernel.org/show_bug.cgi?id=219687) by David Runge (page itself is blocked by Anubis anti-bot protection; content confirmed only via the commit message and release notes). | [commit dfb0fc2](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/dfb0fc263bbc215e3bd86a412ab85effcf2c857a) |
| 2025-02-22 | Commit `dfb0fc263bbc215e3bd86a412ab85effcf2c857a`, "Add riscv support for the psx mechanism," authored and committed by Andrew G. Morgan. Adds `__riscv` to the psx architecture-detection guard alongside an explicit `__x86_64__` entry. Tagged `psx/v1.2.74-rc5`, `cap/v1.2.74-rc5`. | [commit dfb0fc2](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/dfb0fc263bbc215e3bd86a412ab85effcf2c857a) |
| 2025-03-02 | libcap 2.74 released; release notes explicitly list the riscv psx fix (Bugzilla #219687). | [release notes](https://sites.google.com/site/fullycapable/release-notes-for-libcap) |
| 2025-06-26 | Chris Hofer (Codasip) authors a fix for a pointer-alignment bug in the "raw container" offset calculation in `cap_alloc.c`/`libcap.h`, which hardcoded an 8-byte union offset that breaks on architectures with wider pointer-alignment requirements, explicitly called out as affecting CHERI RISC-V. Reported as [kernel.org Bugzilla #220415](https://bugzilla.kernel.org/show_bug.cgi?id=220415) (also blocked by Anubis; content confirmed only via commit message). | [commit 2d744fb](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/2d744fbaa440c59572893c2b63f717c6e4662d5f) |
| 2025-08-10 | Andrew G. Morgan commits `2d744fbaa440c59572893c2b63f717c6e4662d5f`, "libcap: Improve raw container calculation," replacing the hardcoded offset with an `offsetof()`/`__alignof__`-derived calculation plus static assertions verifying struct layout. General portable-C fix, not riscv-specific code, motivated by the CHERI-RISC-V case. | [commit 2d744fb](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/2d744fbaa440c59572893c2b63f717c6e4662d5f) |
| 2025-10-26 | libcap 2.77 released; release notes confirm the CHERI RISC-V fix tied to Bugzilla #220415. | [release notes](https://sites.google.com/site/fullycapable/release-notes-for-libcap) |
| 2026-04-06 | libcap 2.78 released (latest stable tag observed in the upstream repo as of this report). No further riscv-related commits were found between 2.77 and 2.78. | [git.kernel.org tags](https://git.kernel.org/pub/scm/libs/libcap/libcap.git) |

**Key contributors:** Andrew G. Morgan (`morgan@kernel.org`, sole maintainer) authored/committed the psx fix. Chris Hofer (`christian.hofer@codasip.com`, Codasip) authored the CHERI-RISC-V pointer-alignment fix, merged by Morgan. No RISE or other corporate-sponsored contributor drove the port.

**Upstreaming status:** Both fixes are merged into the upstream master branch and shipping in all releases from 2.74 (psx fix) and 2.77 (CHERI pointer-alignment fix) onward. A full-history grep of commit messages for "riscv" across the repository turned up exactly these two commits - there is no master or tracking issue for a "riscv64 port," because riscv64 support was never organized as a sustained porting effort, only two independent, externally-reported bug fixes.

**Discrepancy note:** An earlier version of this assessment additionally cited a commit `bbd8832` ("extend SA_RESTORER support to m68k and possibly sparc") as removing a `linux/riscv64` TODO comment on 2025-03-23, shipping in libcap 2.76. Current research, including an independent full-history grep for "riscv" across the repository and a deep adversarial re-verification of the CI/commit history, found only the two commits listed above as riscv-relevant and states explicitly that they are "the entirety of libcap's riscv64-related history." This `bbd8832` claim could not be corroborated this cycle and is flagged [NEEDS VERIFICATION] rather than restated as fact; it has been dropped from the milestone table pending independent confirmation.

---

## 3. Upstream Support Tier

libcap has no formal architecture-tier policy. Support is implicit: any architecture on which the Linux `capget`/`capset` syscalls and, for libpsx, `pthread_create` plus a compatible signal-struct layout are available is supported for the core library. There is no release-blocking test matrix of any kind (see Section 7), so "support" for any architecture, including x86_64, is asserted by the maintainer rather than demonstrated by CI.

On Linux/riscv64 the kernel handles signal-frame restoration natively; libpsx's architecture guard places riscv64 in the generic struct-layout branch with no `SA_RESTORER` field, matching the real riscv64 ABI (`asm-generic/signal.h`). The absence of a restorer trampoline for riscv64 is architecturally correct, not a gap.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core libcap (`capget`/`capset`) | Yes | Yes | Yes |
| libpsx PSX mechanism | Yes | Yes | Yes (since 2.74) |
| SA_RESTORER trampoline | Yes | Not needed (kernel handles) | Not needed (kernel handles) |
| CHERI pointer-alignment safe allocation | N/A (not a CHERI target) | N/A | Yes (since 2.77) |
| `pam_cap` module | Yes | Yes | Yes |
| Go `cap`/`psx` packages | Yes | Yes | Yes |
| Builds in upstream source | Yes | Yes | Yes |
| Release-blocking CI | No | No | No |
| Upstream distributes binary | No | No | No |

There is no upstream tier distinction between architectures. All architectures are effectively community-supported, because the project has no CI at all (Section 7).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libcap contains essentially no architecture-specific machine code. A full source-tree search (both the original clone and independent adversarial re-verification against `sailfishos-mirror/libcap`) found: no `arch/` or `arch/riscv/` directory anywhere in the tree; no RISC-V or any-architecture `.S`/`.s` assembly files (the only `.s` files in the repository are two Go assembly stubs for `linux_amd64`/`linux_arm` under a non-shipping example, `contrib/bug216610/go/fibber/`, unrelated to capability syscalls); no JIT backend; no SIMD dispatch. libcap is a thin syscall-wrapper library (`capget`/`capset`/`prctl` via glibc's `syscall()`), so it has no per-architecture compute kernels the way a JIT or crypto library would.

The one genuine RISC-V-specific fragment is in `psx/psx_calls.c`, a multi-architecture `#if defined(__x86_64__) || ... || defined(__riscv) || ...` preprocessor block (roughly lines 46-115) that manually redefines the kernel-header signal/sigaction layout (`_NSIG`, `SA_RESTORER`, `struct psx_sigaction` field order) per architecture, because glibc's own headers hide or alter these fields. RISC-V is correctly placed in the generic/default struct-layout branch and correctly excluded from the `SA_RESTORER` list (limited to x86_64/i386/arm/powerpc/arc), matching the real riscv64 kernel ABI, which needs no userspace restorer trampoline. This is researched, ABI-correct portability logic, not a placeholder or stub.

The CHERI-RISC-V pointer-alignment fix (`2d744fb`) is likewise architecture-agnostic portable C: it replaces a hardcoded `-2 + (__u32*)ptr` offset assumption with an `offsetof()`/`__alignof__`-derived, static-assert-verified calculation (`_CAP_STRUCTS_ALIGN`, `_CAP_ALLOC_OFF_TO_MAGIC`). It fixes the underlying bug for any architecture with greater than 8-byte pointer alignment, CHERI RISC-V being the motivating case, not a riscv-only code path. Verification of correctness here is at the static-assert level only; there is no evidence of runtime testing against real CHERI RISC-V hardware in this repository, which is a residual (low) risk worth noting rather than a defect.

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Core capability syscalls | Generic `syscall(SYS_capget, ...)`/`syscall(SYS_capset, ...)` in portable C | Scalar C | Scalar C | Scalar C |
| PSX signal propagation (`psx/psx_calls.c`) | Preprocessor-gated C; no assembly | Scalar C | Scalar C | Scalar C (since 2.74) |
| SA_RESTORER trampoline | Hand-coded stub for platforms that need a userspace restorer | x86_64/i386 need it | Not needed | Not needed |
| CHERI-safe alloc offset calc | `offsetof()`/`__alignof__`-based, static-assert verified | Portable C | Portable C | Portable C (since 2.77, CHERI motivated) |
| `cap`/`psx` Go packages | Pure Go; uses `syscall.AllThreadsSyscall()` on go1.16+ | Go | Go | Go |
| `pam_cap` | Portable C | C | C | C |

**ISA extensions:** None required or used. No floating-point, vector, or crypto extensions are used anywhere in libcap; it performs no floating-point arithmetic at all.

---

## 5. Build System, Cross-Compilation, and Toolchain

libcap uses a pure GNU Make build system. Independently re-verified against a fresh clone of the GitHub mirror: there is **no** `CMakeLists.txt`, **no** `configure` script (no autoconf/automake), and **no** `Dockerfile` anywhere in the repository. The only top-level build files are `Makefile` and `Make.Rules`.

**riscv64 cross-compile command** (Make variables, not CMake flags - the `-DUSE_X=OFF` convention does not apply to this project):

```
make CROSS_COMPILE=riscv64-linux-gnu- \
     BUILD_CC=gcc \
     PAM_CAP=no \
     GOLANG=no \
     SHARED=no \
     DYNAMIC=no \
     all
```

`CROSS_COMPILE` sets `CC`, `AR`, `RANLIB`, and `OBJCOPY`. `BUILD_CC`/`BUILD_CFLAGS` set the host-side compiler separately, required because the capability-name-table code generator runs on the build host during a cross build.

**Toolchain minimums:**
- **GCC:** No hard-documented minimum. Any GCC supporting C89 and standard Linux headers is sufficient.
- **Go (optional):** Hard minimum **go1.16**, because libpsx depends on `syscall.AllThreadsSyscall()`/`AllThreadsSyscall6()` (added in go1.16) to execute syscalls across all OS threads atomically. Pre-1.16 required CGo and is documented upstream as fragile and hang-prone; v2.72 dropped pre-go1.16 support entirely. `GOLANG=no` skips this build path.
- **gperf >= 3.1 (optional):** Build-time only, generates the capability-name lookup hash table; falls back to a linear scan if absent - never a hard blocker.

**QEMU:** Not used anywhere in libcap's own build system or documented in any project CI (because none exists). The only QEMU-related fact found is incidental: [GitHub Issue #12](https://github.com/AndrewGMorgan/libcap_mirror/issues/12), a `libcap_psx_test` hang, reproduces on riscv64 under QEMU in Yocto-built images. This is a downstream test-environment detail, not a documented or supported libcap build step.

**Known build failures on riscv64:** None found. [Debian Bug #1100408](https://bugs.debian.org/1100408) ("libcap2: FTBFS due to test suite failure on mips64el, powerpc") is open, but its full text does not mention riscv64; riscv64 builds are not implicated.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| `capget`/`capset` syscall interface | Full | Full | Full | None |
| libpsx POSIX thread semantics | Full | Full | Full (since 2.74) | None |
| CHERI-safe raw-container offset calc | N/A | N/A | Full (since 2.77) | None |
| `pam_cap` PAM module | Full | Full | Full | None |
| Go `cap` package | Full | Full | Full | None |
| Go `psx` package | Full | Full | Full | None |
| `setcap`/`getcap`/`capsh` utilities | Full | Full | Full | None |
| `contrib/bug216610` Go-asm example | `linux_amd64` stub present | `linux_arm` stub present (no arm64/riscv64 stub found) | No `linux_riscv64` stub | Example only; not part of the shipped library or any installed package |

**Functional gaps:** None in the shipping library or tools.

**Performance gaps:** Not applicable. libcap is a thin syscall wrapper with no compute-intensive code paths (no SIMD, no crypto, no JIT). Performance is bounded by kernel syscall latency, not by anything libcap itself does per architecture. No benchmark data for libcap exists on any architecture (confirmed across riseproject.dev's full blog sitemap, upstream, distro trackers, and general web/Phoronix searches - this is a confirmed absence, not a search gap).

**Floating-point/NaN semantics:** Not applicable. libcap performs no floating-point arithmetic.

**Security hardening:** No architecture-specific hardening flags exist in `Make.Rules`; all compiler flags are architecture-neutral.

---

## 7. CI/CD Infrastructure

**Upstream CI: none, for any architecture.** This was independently re-verified twice: once via a recursive scan of the mirrored tree for `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, and any file/directory containing "ci," and once adversarially via a fresh `git clone --depth 1` of `sailfishos-mirror/libcap` followed by `find . -iname "*ci*"` and a repo-wide `grep` for Jenkins/Travis/GitLab/Buildbot/CircleCI/Azure Pipelines/AppVeyor references. Both passes found zero matches; the only tangential hit was a code comment in `contrib/bug216610/go/fibber/fibs_linux_amd64.s` linking to an unrelated GitLab-hosted psABI wiki page. `distcheck.sh`, the repository's only "check" script, is a local sanity check against upstream Linux headers - it is not CI (no runner, no trigger, no matrix) and has no riscv64 content.

**RISE runners:** Not used. libcap does not appear among the projects using RISE's RISC-V Runners CI service in any search of `riseproject-dev` repositories (`riscv-runner`, `riscv-runner-app`, `riscv-runner-device-plugin`, `riscv-runner-images`, `riscv-runner-sample`).

**Distribution build automation:** Ubuntu's archive build infrastructure builds and publishes `libcap2`/`libcap-dev`/`libcap2-bin` for riscv64 in the 26.04 "resolute" release (confirmed directly, Section 8). This is distribution packaging automation, not upstream project CI, and the project graph's schema carries no autopkgtest/test-suite-pass signal - package presence in the archive confirms a successful build and publish, not a passing test suite. [NEEDS VERIFICATION - existing prior reporting additionally cited a Debian buildd riscv64 builder (`rv-osuosl-05`) building libcap2 1:2.78-1 in Debian sid; this specific builder/version detail was not reconfirmed in current research and should be treated as single-source pending a fresh check.]

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | No | No | No |
| Distribution build automation | Ubuntu archive, [NEEDS VERIFICATION] Debian buildd | Ubuntu archive, [NEEDS VERIFICATION] Debian buildd | Ubuntu archive (resolute, confirmed), [NEEDS VERIFICATION] Debian buildd |
| CI runs test suite | No (upstream) | No (upstream) | No (upstream); archive presence does not imply test pass |
| RISE runners | No | No | No |

---

## 8. Distribution and Release Status

**Upstream releases:** Source tarballs only, no pre-built binaries for any architecture. Latest tag observed: libcap 2.78.

**To get a working riscv64 binary:** Install from a Linux distribution package, or cross-compile from source with any standard riscv64-linux-gnu toolchain (Section 5) - no additional riscv64-specific steps are required.

| Distribution | Package(s) | Version | riscv64 Status | Notes |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libcap2`, `libcap-dev`, `libcap2-bin` | 1:2.75-10ubuntu2 | **Confirmed available.** Direct per-architecture page fetch of [packages.ubuntu.com/resolute/riscv64/libcap2](https://packages.ubuntu.com/resolute/riscv64/libcap2) returned HTTP 200 with a live download table (30.0 kB package size, 85.0 kB installed size). Built from unmodified upstream source with no riscv64-specific packaging patches. | Source package `libcap2` (orig tarball `libcap2_2.75.orig.tar.xz`) |
| Ubuntu 24.04 "noble" | `libcap2`, `libcap2-bin`, `libcap-dev` | 1:2.66-5ubuntu2 | Available, ports channel | [NEEDS VERIFICATION - not reconfirmed this cycle] Older than the amd64/i386 security patch level (1:2.66-5ubuntu2.4); whether riscv64-relevant CVE fixes from 2.74/2.77 are backported to this older base is not determinable from available data |
| Debian sid | `libcap2`, `libcap2-bin`, `libcap-dev`, `libpam-cap` | 1:2.78-1 [NEEDS VERIFICATION] | [NEEDS VERIFICATION - claimed installed/pass on builder `rv-osuosl-05`; not reconfirmed in current research pass] | |
| Arch Linux RISC-V | `libcap` | 2.78-1 [NEEDS VERIFICATION] | **Contradicted between sources.** An earlier assessment cited a direct download link at `archriscv.felixc.at/repo/core/` for `libcap-2.78-1-riscv64.pkg.tar.zst`. Adversarial re-verification found the site's `?q=` search parameter is inert (no client-side filter exists on that page; it renders the plain homepage regardless of query), so that specific claim's verification method does not work as described. Indirect signals (libcap absent from the 1,400-row out-of-date/discrepancy list and absent from the packaging blacklist, `core` repo 98.33% build-complete) suggest riscv64 availability is plausible, but no genuine repository listing or `.pkg.tar.zst` filename could be directly confirmed this cycle. | Treat availability as unconfirmed, not refuted |
| AlmaLinux Kitten 10 | `libcap` | 2.69-7.el10.riscv64 | [NEEDS VERIFICATION - single source, not reconfirmed] | |
| PyPI | N/A | N/A | **Confirmed not applicable.** `https://pypi.org/pypi/libcap/json` returns HTTP 404; no PyPI package named `libcap` exists. libcap is a C/POSIX library with no PyPI distribution. | |

---

## 9. Dependencies

All direct dependencies build and are published for riscv64 in at least one current distribution channel (Ubuntu 26.04 "resolute"). No blocking issues were found in the dependency tree.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| glibc | Runtime-dependency, critical. Provides the `capget`/`capset` syscall wrappers, the dynamic linker, and pthreads (libpsx requires `pthread_create`; `PSXLINKFLAGS := -lpthread`). `PTHREADS=no` drops Go/psx support entirely. | Present - `libc6`/`libc6-dev` 2.43-2ubuntu2 in resolute/riscv64 | Not modeled by the project graph schema (archive presence implies a successful build/publish, not a test-suite pass) | Published, resolute/riscv64/main | See `./project-reports/glibc.md` |
| Linux kernel | Build-dependency, critical. `linux/capability.h` and related kernel-header types define the capability syscall ABI that all of libcap's C sources compile against; also the ultimate source of the `capget`/`capset` kernel interface. | Present - `linux-libc-dev` 7.0.0-14.14 in resolute/riscv64 | Not modeled | Published, resolute/riscv64/main | See `./project-reports/linux-kernel.md` |
| Linux-PAM | Runtime-dependency, optional. `Make.Rules` auto-detects PAM via presence of `/usr/include/security/pam_modules.h` and builds `pam_cap.so`. Disable with `PAM_CAP=no`. | Present - `libpam0g`/`libpam0g-dev` 1.7.0-5ubuntu3; `libpam-cap` 1:2.75-10ubuntu2, in resolute/riscv64 | Not modeled | Published, resolute/riscv64/main | Transitive chain `libpam-cap` -> `{libcap2-bin, libpam0g, libc6, libcap2}` all confirmed present on resolute/riscv64. See `./project-reports/linux-pam.md` |
| gperf | Build-dependency, optional. Generates the capability-name lookup hash table (`Make.Rules`: `USE_GPERF ?= $(shell which gperf ...)`); falls back to a linear scan if absent - never a hard blocker. | Present - `gperf` 3.3-1 in resolute/riscv64 | Not modeled | Published, resolute/riscv64 | Not tracked as a separate project entry |
| Go | Build-dependency, optional. Builds the `cap` and `psx` Go modules (confirmed in `cap/go.mod`, `psx/go.mod`, and six `goapps/`/`contrib` consumers, at module version v1.2.78). Requires `syscall.AllThreadsSyscall()` (go1.16+) for libpsx's all-thread syscall semantics. Skippable with `GOLANG=no`. | Present - `golang-go` 2:1.26~1 in resolute/riscv64 | Not modeled | Published, resolute/riscv64 | See `./project-reports/go.md`. Transitive: `golang-go` -> `{gccgo-go, golang-1.26-go, git}` (not individually re-verified on riscv64/resolute this cycle) |
| pthreads (bundled in glibc) | Build-dependency, critical (indirect). libpsx's all-thread syscall mechanism requires `pthread_create`. | Present (part of glibc) | Not modeled | Published (part of glibc) | Tracked under the glibc report, not separately |
| `kernel.org/pub/linux/libs/security/libcap/psx` (Go module) | Indirect Go runtime dependency of the `cap` Go module. | Pure Go; architecture-independent | Not modeled | v1.2.78 | The `cap`/`psx` Go module graph is closed - neither module declares any external `require` beyond each other |

libcap's own C sources have no further third-party dependency beyond the above - no crypto, SIMD, or JIT libraries, and no vendored third-party code.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64 Relevance |
|---|---|---|---|---|
| [Issue #12](https://github.com/AndrewGMorgan/libcap_mirror/issues/12) | `libcap_psx_test: exit(0) in thread_fork_exit causing hangs` | Open (since 2026-06-12, no maintainer response) | Low, test-harness only | **Yes - the only riscv64-relevant open issue.** Reported on Yocto-built embedded images tested under QEMU across x86-64, arm64, and riscv64. `thread_fork_exit`'s forked child calls `exit(0)`, which runs atexit/stdio-flush handling and deadlocks in `futex_wait`; reproduces on riscv64 and arm64. Proposed fix: replace `exit(0)` with `_exit(0)`. Does not affect the library itself, only its test suite. |
| [Issue #15](https://github.com/AndrewGMorgan/libcap_mirror/issues/15) | `capsh: --groups= silently narrows values that do not fit a gid_t` | Open (2026-08-30) | N/A | Not riscv64-specific |
| [Issue #8](https://github.com/AndrewGMorgan/libcap_mirror/issues/8) | `libpsx.so linking fails on powerpc 464fp (psx_wrap.o)` | Open (2026-02-28) | N/A | powerpc only, not riscv64 |
| [Issue #7](https://github.com/AndrewGMorgan/libcap_mirror/issues/7) | `New Go libpsx versions break Go-Landlock` | Open | N/A | Not riscv64-specific |
| [Issue #6](https://github.com/AndrewGMorgan/libcap_mirror/issues/6) | `in a container psx_test hangs` | Open | N/A | No architecture specified |
| [Issue #5](https://github.com/AndrewGMorgan/libcap_mirror/issues/5) | `Support non-mainstream Linux architectures` | Open | N/A | Does not mention riscv64; riscv64 support was completed via the two commits in Section 2, outside this issue |
| [Issue #4](https://github.com/AndrewGMorgan/libcap_mirror/issues/4) | `Add BUILD_LDFLAGS to host targets in makefile` | Open | N/A | Not riscv64-specific |
| [Issue #3](https://github.com/AndrewGMorgan/libcap_mirror/issues/3) | `libpsx does not work when building with cgo but without libc` | Open | N/A | Not riscv64-specific |
| [Issue #2](https://github.com/AndrewGMorgan/libcap_mirror/issues/2) | `Integrate support for library and binary fuzzing` | Open | N/A | Not riscv64-specific |
| [Issue #11](https://github.com/AndrewGMorgan/libcap_mirror/issues/11) | `psx: possible mixed arm/thumb instructions due to inline asm` | Closed (2026-05-31) | N/A | ARM only |
| [Issue #1](https://github.com/AndrewGMorgan/libcap_mirror/issues/1) | `cap_setgroups() asserts` | Closed (2024-08-16) | N/A | Not riscv64-specific |
| [Debian #1100408](https://bugs.debian.org/1100408) | `libcap2: FTBFS due to test suite failure on mips64el, powerpc` | Open | Affects mips64el/powerpc only | riscv64 not mentioned; riscv64 builds in the archive are unaffected |

**Correctness bugs specific to riscv64:** None found. Issue #12 is the only riscv64-relevant open item, and it is a test-harness defect (`exit(0)` vs `_exit(0)`), not a library correctness or performance bug. No libcap RISC-V (or any-architecture) performance benchmark data exists in any source checked - a confirmed negative result, consistent with libcap having no compute-intensive code path to benchmark.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. The maintainer added riscv64 psx support in February 2025 (shipped in 2.74) and the CHERI-RISC-V pointer-alignment fix in August 2025 (shipped in 2.77). No objection to riscv64 or CHERI-RISC-V support has been stated in any accessible source.

**Technical blockers:** None. The library is portable C; riscv64 required no architecture-specific code beyond the two fixes already merged, both of which are general portability improvements rather than riscv-only hacks.

**Organizational blockers:** None. The project is a single-maintainer, kernel.org-hosted library with no governance body, no TSC, and no corporate sponsor with veto power over architecture support.

**Access limitation:** Both motivating Bugzilla reports (#219687 and #220415) are inaccessible - kernel.org's Bugzilla is behind Anubis anti-bot protection, and web.archive.org is unreachable from this research tooling - so their original reporter commentary and any discussion beyond the commit messages cannot be confirmed.

**Acceptance probability for future riscv64 patches:** High, based on the observed pattern - both riscv64-relevant bugs filed to date were accepted and merged by the sole maintainer within one to two release cycles of being reported, with no organizational friction. This is an individual-maintainer, bug-report-driven acceptance model, not a corporate or foundation-gated one.

---

## 13. Readiness Assessment

- **Color:** Yellow (clean-distro-build)
- **Release provider:** Distro
- **Justification:** libcap has zero upstream CI for any architecture, independently re-verified by cloning the repository and grepping for `.github/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.travis.yml`, and any "ci"-named file or directory - none exist - so it cannot qualify for blue or green. However, two riscv64-relevant fixes are merged into upstream source (psx `__riscv` support, [commit dfb0fc2](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/dfb0fc263bbc215e3bd86a412ab85effcf2c857a), shipped in 2.74; a CHERI-RISC-V pointer-alignment fix, [commit 2d744fb](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/2d744fbaa440c59572893c2b63f717c6e4662d5f), shipped in 2.77), and Ubuntu 26.04 "resolute" ships riscv64 binary packages (`libcap2`, `libcap-dev`, `libcap2-bin`, 1:2.75-10ubuntu2) built from that unmodified upstream source with no riscv64-specific packaging patches, confirmed via a live per-architecture package page at [packages.ubuntu.com/resolute/riscv64/libcap2](https://packages.ubuntu.com/resolute/riscv64/libcap2) (HTTP 200, arch=riscv64, size/install tables present). Per the distribution floor, a clean (unpatched) distro build upgrades an upstream-CI-less project from orange/unsupported to yellow, capped there because no upstream CI actually exercises riscv64.
- **Pending work that could change the grade:** One open, low-severity riscv64-relevant issue - [GitHub Issue #12](https://github.com/AndrewGMorgan/libcap_mirror/issues/12), a test-harness-only deadlock (`exit(0)` -> `_exit(0)`) that reproduces on riscv64/arm64 under QEMU in Yocto builds, open since 2026-06-12 with no maintainer response. No open PRs, no RISE involvement, and no tracked riscv64 porting effort exist beyond the two already-merged commits, so nothing currently in flight would raise this grade; adding upstream CI, which the project lacks entirely for any architecture, is the only path to blue or green.

(Not an optimization-purpose project; optimization level is not applicable and is omitted.)

---

## 14. Investment Analysis

libcap's riscv64 code path is functionally complete and shipping in at least one current distribution (Ubuntu 26.04 "resolute"). RISE has not funded or performed any dedicated work on libcap; its only documented RISE connection is incidental license-compliance bundling in four unrelated riscv64 Python-wheel PRs, which does not constitute enablement work and is not double-counted below.

### 14.1 Functional Enablement

No enablement work is required. Both riscv64-relevant fixes (psx `__riscv` support, CHERI-RISC-V pointer-alignment) are merged upstream and shipping since libcap 2.74 and 2.77 respectively. The only outstanding functional item is [Issue #12](https://github.com/AndrewGMorgan/libcap_mirror/issues/12), a one-line test-harness fix (`exit(0)` -> `_exit(0)`) that does not affect the library itself. Estimated effort: 0.1 person-weeks to prepare and submit the patch.

### 14.2 Performance Optimization

Not applicable. libcap is a thin syscall wrapper with no compute-intensive paths; no benchmark data exists for any architecture and none is needed. Performance is bounded by kernel syscall latency, an architecture-level concern outside libcap's scope.

### 14.3 CI/CD Infrastructure

libcap has no upstream CI for any architecture - adding riscv64-specific CI would first require establishing upstream CI at all, which the maintainer has not done despite the project being actively maintained (two merged commits in 2025 alone). If riscv64 coverage is a priority, the practical path is investing in distribution-level automated testing (e.g., Debian autopkgtest) rather than upstream CI, since Ubuntu's archive build process already produces and publishes riscv64 binaries today. Estimated effort to add riscv64 to a hypothetical upstream CI: 0.5 person-weeks. Probability of upstream acceptance: Low, given the project's demonstrated preference for having no CI at all.

### 14.4 Ecosystem Enablement

Not applicable. libcap is a standalone system C library with no dependent package ecosystem (Python, npm, Maven, Kubernetes, etc.) requiring separate riscv64 enablement. Its appearances in RISE's `python-wheels` repository are as an incidental, bundled runtime dependency of unrelated packages (pycurl, hidapi, eckitlib, libuuu) for GPL license-compliance tracking, not as a package that itself needs enabling.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix Issue #12: replace `exit(0)` with `_exit(0)` in `libcap_psx_test`'s `thread_fork_exit` | 0.1 | Community contribution | Low |
| CI/CD | Establish upstream CI, then add a riscv64 job (contingent on upstream CI existing at all) | 0.5 | Upstream | Low |
| Performance | No work required | 0 | N/A | N/A |
| Ecosystem | No work required | 0 | N/A | N/A |

**Assessment:** libcap requires minimal investment for riscv64. The functional port is complete, upstreamed, and shipping in Ubuntu 26.04. The single open test-harness bug is a trivial fix any contributor can submit. The grade is capped at yellow, not because of any riscv64-specific gap, but because the project has no upstream CI whatsoever for any architecture - closing that gap is a project-wide CI investment, not a riscv64-specific one, and is unlikely to be accepted by the sole maintainer based on the project's current trajectory.

---

## 15. References

- [Commit dfb0fc2 - "Add riscv support for the psx mechanism"](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/dfb0fc263bbc215e3bd86a412ab85effcf2c857a)
- [Commit 2d744fb - "libcap: Improve raw container calculation"](https://kernel.googlesource.com/pub/scm/libs/libcap/libcap/+/2d744fbaa440c59572893c2b63f717c6e4662d5f)
- [kernel.org Bugzilla #219687](https://bugzilla.kernel.org/show_bug.cgi?id=219687) (inaccessible, Anubis-blocked)
- [kernel.org Bugzilla #220415](https://bugzilla.kernel.org/show_bug.cgi?id=220415) (inaccessible, Anubis-blocked)
- [libcap release notes](https://sites.google.com/site/fullycapable/release-notes-for-libcap)
- [libcap homepage](https://sites.google.com/site/fullycapable/)
- [git.kernel.org libcap repository](https://git.kernel.org/pub/scm/libs/libcap/libcap.git)
- [GitHub mirror - AndrewGMorgan/libcap_mirror](https://github.com/AndrewGMorgan/libcap_mirror)
- [GitHub mirror - sailfishos-mirror/libcap](https://github.com/sailfishos-mirror/libcap)
- [Issue #12 - libcap_psx_test hang](https://github.com/AndrewGMorgan/libcap_mirror/issues/12)
- [Issue #15 - capsh --groups gid_t narrowing](https://github.com/AndrewGMorgan/libcap_mirror/issues/15)
- [Issue #8 - libpsx.so linking fails on powerpc 464fp](https://github.com/AndrewGMorgan/libcap_mirror/issues/8)
- [Issue #7 - Go libpsx breaks Go-Landlock](https://github.com/AndrewGMorgan/libcap_mirror/issues/7)
- [Issue #6 - psx_test hangs in container](https://github.com/AndrewGMorgan/libcap_mirror/issues/6)
- [Issue #5 - Support non-mainstream Linux architectures](https://github.com/AndrewGMorgan/libcap_mirror/issues/5)
- [Issue #4 - Add BUILD_LDFLAGS to host targets](https://github.com/AndrewGMorgan/libcap_mirror/issues/4)
- [Issue #3 - libpsx cgo without libc](https://github.com/AndrewGMorgan/libcap_mirror/issues/3)
- [Issue #2 - Integrate fuzzing support](https://github.com/AndrewGMorgan/libcap_mirror/issues/2)
- [Issue #11 - psx mixed arm/thumb inline asm](https://github.com/AndrewGMorgan/libcap_mirror/issues/11)
- [Issue #1 - cap_setgroups() asserts](https://github.com/AndrewGMorgan/libcap_mirror/issues/1)
- [Debian Bug #1100408 - FTBFS on mips64el/powerpc](https://bugs.debian.org/1100408)
- [Ubuntu packages - libcap2 (resolute/riscv64)](https://packages.ubuntu.com/resolute/riscv64/libcap2)
- [Ubuntu packages search - libcap (resolute)](https://packages.ubuntu.com/search?keywords=libcap&suite=resolute&searchon=names&section=all)
- [PyPI - libcap JSON API (404, no package exists)](https://pypi.org/pypi/libcap/json)
- [Arch Linux RISC-V build status](https://archriscv.felixc.at/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels PR #940 - pycurl riscv64 wheels](https://github.com/riseproject-dev/python-wheels/pull/940)
- [riseproject-dev/python-wheels PR #1097 - hidapi riscv64 wheels](https://github.com/riseproject-dev/python-wheels/pull/1097)
- [riseproject-dev/python-wheels PR #2147 - eckitlib version 2.1.1.26](https://github.com/riseproject-dev/python-wheels/pull/2147)
- [riseproject-dev/python-wheels PR #2348 - libuuu riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/2348)