---
title: AppArmor
parent: Project Reports
color: orange
dependencies:
  - name: Linux kernel
    relation: build-dependency
    criticality: critical
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: Linux-PAM
    relation: runtime-dependency
    criticality: optional
  - name: libaudit
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="apparmor" %}

# AppArmor

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for AppArmor<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

AppArmor is a Linux Security Module (LSM) providing mandatory access control (MAC) via per-application security profiles. The project has two parts: a kernel-resident LSM (`security/apparmor/` in the Linux kernel tree) and a userspace component hosted at [gitlab.com/apparmor/apparmor](https://gitlab.com/apparmor/apparmor) containing the policy compiler/parser, `libapparmor`, PAM/Apache modules, and command-line tooling (`aa-status`, `aa-genprof`, `aa-logprof`, `aa-notify`, etc.).

**Governance:** There is no formal foundation. AppArmor is not a Linux Foundation, Apache, or CNCF project, and the repository contains no `MAINTAINERS` or `GOVERNANCE` file (confirmed by a full clone and history/tree search). [apparmor.net](https://apparmor.net/) states only that "development has been supported by Canonical since 2009." Governance is informal: a public mailing list (lists.ubuntu.com/apparmor) plus GitLab issues/merge requests, with de facto technical leadership rather than a documented process. Licensing is GPLv2+ for the kernel module, parser, and tools, and LGPL for `libapparmor` (so `change_hat(2)`/`change_profile(2)` can be called from non-GPL binaries).

**Corporate sponsors (from `git shortlog -sne --all` on a local clone):**

| Company | Contributors | Notes |
|---|---|---|
| Canonical (dominant) | John Johansen, Steve Beattie, Tyler Hicks, Seth Arnold, Kees Cook, Zygmunt Krynicki, Georgia Garcia, Ryan Lee, Maxime Belair, Alex Murray, Jamie Strandboge | John Johansen is the de facto technical/security lead (AppArmor kernel maintainer) |
| SUSE/Novell (historical) | Andreas Gruenbacher, Matt Barringer, Dominic Reynolds | From AppArmor's SUSE/Novell stewardship era, 2005-2009, before Canonical took over |
| Independent | Christian Boltz (top all-time committer by volume) | Not tied to a corporate email domain despite being the single most active contributor; acts as merger/release manager |

**RISE affiliation:** AppArmor is not a listed [RISE Project](https://riseproject.dev) member or initiative. Canonical (AppArmor's dominant sponsor) appears as a RISE General Member, but that is a corporate membership, not an AppArmor project affiliation. No RISE blog post, wiki page, working group, or funded engineering effort mentions AppArmor.

**Community culture on new ports:** Reactive, not proactive. The only riscv64-related work in the project's history arrived as a downstream-driven bugfix (Debian release-team pressure to keep the package building on riscv64), not an upstream or RISE-sponsored porting initiative. The fix was authored by a Debian porter, carried upstream by an independent volunteer, and merged without ceremony by a Canonical maintainer, consistent with AppArmor treating riscv64 as "just another generic Linux target" rather than a tiered platform requiring dedicated engineering investment.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-02-28 | Debian bug #1099085 filed: `test-logprof.py`'s `test_allow_all` times out at 0.3s on slow riscv64 build hardware (SiFive HiFive Unmatched) | [Debian bug #1099085](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1099085) |
| 2025-03-04 | Debian package 4.1.0~beta5-3 ships downstream fix (timeout raised to 0.6s); bug closed | [Debian bug #1099085](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1099085) |
| 2025-03-04 | GitLab MR !1567 ("Increase timeout for test_allow_all") opened by Bo YU, merged by John Johansen into master (commit `6faa8950`) | [GitLab MR !1567](https://gitlab.com/apparmor/apparmor/-/merge_requests/1567) |
| 2025-07-31 | MR !1567's fix first ships in an upstream pre-release, v5.0.0-alpha1; first stable release v5.0.0 on 2026-04-23 | GitLab tags API (apparmor project) |
| 2026-04-17 | Debian bug #1134203 filed: package stuck 31 days migrating from unstable to testing, root-caused to riscv64 FTBFS from timeouts still too tight | [Debian bug #1134203](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203) |
| 2026-04-20/21 | Aurelien Jarno (Debian) diagnoses and proposes wider timeouts (0.3->0.6s, 0.6->1.2s) | [Debian bug #1134203](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203) |
| 2026-04-21 | GitLab MR !2063 ("Test suite: increase a couple timeouts to make the tests robust on riscv64") merged into master (commit `cb2fca97`) | [GitLab MR !2063](https://gitlab.com/apparmor/apparmor/-/merge_requests/2063) |
| 2026-05-24 | Debian bug #1134203 closed after apparmor 4.1.7-2 (Debian's own downstream-patched package, not an upstream 4.1.x tag) migrates to testing | [Debian bug #1134203](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203) |
| 2026-08-20 | MR !2063's fix first ships in an upstream pre-release, v6.0.0-alpha1 (not yet in any stable tag as of this report) | GitLab tags API (apparmor project) |

**Key contributors:** Bo YU (independent, filed and authored the first timeout fix), intrigeri (`intrigeri@riseup.net`, Tails/Debian-affiliated independent developer, committer of record for the first patch), Aurelien Jarno (`aurel32@debian.org`, Debian developer/porter, authored the second timeout fix), Maxime Belair (Canonical, merged the upstream-side commit for the second fix).

**Fully upstream?** Partially. MR !1567 (the first timeout widening) is in upstream master and shipped starting with stable release v5.0.0. MR !2063 (the second, larger widening, which is what actually resolved Debian's 31-day testing-migration block) is merged into upstream master but as of the research date (2026-09-08) has only reached a pre-release tag (v6.0.0-alpha1), not a stable release. Debian's "fixed in 4.1.7-2" refers to a Debian-carried downstream backport, not an upstream 4.1.x release, since v4.1.7 was tagged 2026-03-10, before MR !2063 merged. [NEEDS VERIFICATION: whether v6.0.0 has since gone stable, as this was checked prior to any subsequent stable tag.]

## 3. Upstream Support Tier

**No formal tier policy exists.** No documented architecture-support tiers (of the kind LLVM or Rust maintain) were found in the repository, wiki, or website. AppArmor's kernel LSM code has never had per-architecture code paths for any CPU architecture (see Section 4), so there is no tiering concept to apply in the first place.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitLab CI build | Yes ([.gitlab-ci.yml](https://gitlab.com/apparmor/apparmor/-/raw/master/.gitlab-ci.yml)) | Not found in CI config | No |
| Upstream GitLab CI test execution | Yes (`test-libapparmor`, `test-parser`, `test-binutils`, `test-utils`, etc.) | Not found in CI config | No |
| Upstream spread integration tests | Yes (Ubuntu/Debian/Fedora/openSUSE cloud images) | Not found | No |
| Upstream-published binary release | No (source tarballs only; GitLab Releases carry no per-arch binaries) | No | No |
| Debian/Ubuntu distro package | Yes | Yes (by convention; not separately re-verified this report) | Yes (Ubuntu 26.04 resolute, version `5.0.0~beta1-0ubuntu7`) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**There are none, for any architecture.** This is the central technical fact governing AppArmor's riscv64 status: AppArmor was never built with per-architecture code paths, so riscv64 is not "missing" an optimization tier that x86_64 or arm64 possess. Verified directly:

- **Kernel LSM** (`security/apparmor/*.c` in the Linux kernel, ~30 files: `lsm.c`, `policy.c`, `domain.c`, `label.c`, `file.c`, `af_inet.c`, `af_unix.c`, `net.c`, `audit.c`, `capability.c`, `crypto.c`, `mount.c`, `resource.c`, `task.c`, `ipc.c`, `path.c`): no `arch/`-style subdirectory, no `.S` assembly files, no `#ifdef CONFIG_RISCV`/`CONFIG_ARM`/`CONFIG_X86` anywhere.
- **Userspace parser and DFA/regex matching engine** (`parser/`, `parser/libapparmor_re/`): full recursive repository tree fetched via the GitLab API and grepped for `riscv|neon|avx|sse|simd|.asm|rvv|arch_` -- zero matches anywhere in the repository (`changehat/`, `libraries/libapparmor/`, `parser/`, `utils/`).
- **`libapparmor`**: plain portable C plus SWIG-generated Perl/Python/Ruby bindings, arch-neutral.
- **Policy hashing** (`crypto.c`) delegates to the kernel's generic Crypto API (`crypto_shash`); any riscv64 vector-crypto acceleration would live in the kernel crypto subsystem, not in AppArmor code, and was out of scope for this research.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Kernel LSM hooks | Scalar generic C | Scalar generic C | Scalar generic C (identical implementation) |
| Policy DFA/regex matcher | Scalar generic C, no SIMD variant | Scalar generic C, no SIMD variant | Scalar generic C, no SIMD variant |
| Userspace parser | Portable C++ | Portable C++ | Portable C++ |
| Policy hashing | Kernel generic Crypto API | Kernel generic Crypto API | Kernel generic Crypto API |

**Conclusion:** AppArmor is not an optimization-purpose project (see Section 13); its value proposition is correctness of access-control mediation, not throughput. Since no architecture, including the reference amd64/arm64 platforms, has a hand-tuned or SIMD-accelerated code path, riscv64's identical scalar C implementation represents functional parity, not a gap.

## 5. Build System, Cross-Compilation, and Toolchain

Verified by fetching the raw README, the complete `.gitlab-ci.yml`, the full repository tree (4,797 files, paginated via GitLab API), and the wiki page index.

- **No CMake.** Zero `CMakeLists.txt` files exist anywhere in the tree. The build system is GNU Autotools plus hand-written Makefiles (`autogen.sh` / `configure` / `make`). There are no `-DUSE_X=OFF`-style flags to report; that is a CMake convention this project does not use. The closest analog is autoconf `--enable-x`/`--disable-x`/`--with-x` flags in various `configure.ac` files (e.g. `libapparmor/configure.ac`), none of which are riscv-specific.
- **Build order** (from the README): `libapparmor` -> `binutils` -> `parser` -> `init` -> `utils` -> `mod_apparmor` -> `pam_apparmor` -> `profiles`. This sequence is architecture-agnostic and never mentions RISC-V, riscv64, or any target-architecture flags.
- **No documented toolchain minimums.** The README's "Required versions" section pins only Python (>=3.3) and bash (>=3.2, for `aa-decode`). No GCC/Clang minimum version is stated for any architecture.
- **No Dockerfile exists** in the repository (confirmed by full recursive tree search).
- **QEMU is used only for x86_64.** The README's spread/image-garden testing section directs users to `apt install qemu-utils qemu-system` to build x86_64 VM disk images for regression testing via the `spread` tool. `.gitlab-ci.yml` hardcodes `ARCH: x86_64` throughout and defines only `.image-garden-x86_64` / `spread-ubuntu-cloud-24.04-x86_64` jobs. There is no riscv64 CI job, QEMU cross-arch build target, or riscv64 image-garden target anywhere.
- **Known riscv64 build failures:** two, both test-suite timeout issues, not toolchain or compilation failures -- Debian bug [#1099085](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1099085) and Debian bug [#1134203](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203) (see Section 2). A closed AppArmor GitLab issue #463 ("test `test-logprof` timeout on riscv64", Nov 2024) reports the same class of issue, tested via a third-party Arch Linux RISC-V CI (archriscv.felixc.at) and a physical Litchi Pi 4A board.
- **Wiki:** contains only a `home` page and per-release "Signatures" pages -- no build, architecture, cross-compilation, toolchain, or Docker/QEMU documentation exists for any architecture, riscv64 included.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because AppArmor's implementation is single-tier and architecture-generic (Section 4), there is no functional or performance feature matrix to construct: the code that runs on riscv64 is byte-identical in capability to what runs on amd64 or arm64. No SIMD-dependent performance gap, no NaN/floating-point semantics issue, and no security-hardening code path is architecture-conditional.

The gaps that do exist are downstream/integration issues, not core-AppArmor functional gaps:

- **libvirt AppArmor QEMU profile:** a ~2019-04 mailing-list patch added `qemu-system-riscv32`/`riscv64` binaries with `rmix` permission to libvirt's AppArmor QEMU security-driver profile, present today in `src/security/apparmor/libvirt-qemu` [NEEDS VERIFICATION: mailing-list URL unreachable on refetch, found only via search snippet] ([libvir-list, ~2019-04](https://listman.redhat.com/archives/libvir-list/2019-April/msg00003.html)).
- **Launchpad #1990499** (libvirt, Fix Released Oct 2022): `virt-aa-helper` denied read access to riscv64-specific bootloader/firmware paths (`/usr/lib/u-boot/qemu-riscv64_smode/uboot.elf`, `/usr/lib/riscv64-linux-gnu/opensbi/`) because the AppArmor profile lacked rules for paths that only exist on riscv64 boot flows.
- **Launchpad #2099990** (Ubuntu apparmor, Fix Released in 4.1.0~beta5-0ubuntu6): the `lsusb` AppArmor profile lacked rules for `/sys/devices/platform/...` paths used by non-PCI USB controllers present on some riscv64 boards (Microchip Icicle Kit) but absent on x86.

Both are profile-completeness gaps (missing path rules for riscv64-specific hardware/firmware layouts), not core mediation-engine defects, and both are already fixed.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for AppArmor upstream.** Confirmed by direct read of the two files that define the pipeline:

- **[`.gitlab-ci.yml`](https://gitlab.com/apparmor/apparmor/-/raw/master/.gitlab-ci.yml):** stages `build`, `test`, `spread`, `.post`; jobs `build-all`, `test-libapparmor`, `test-parser`, `test-binutils`, `test-utils`, `test-mod-apparmor`, `test-profiles`, `shellcheck`, `image-ubuntu-cloud-24.04-x86_64`, `spread-ubuntu-cloud-24.04-x86_64`, `coverity`; runner tags `linux`, `x86_64`, `kvm`. Zero occurrences of "riscv" anywhere.
- **[`spread.yaml`](https://gitlab.com/apparmor/apparmor):** backend `garden` (QEMU-based via image-garden), architecture `x86_64` only; systems Ubuntu Cloud 22.04/24.04/24.10, Debian Cloud 12/13, Fedora Cloud 41, openSUSE Cloud Tumbleweed -- all x86_64, none riscv64. Zero occurrences of "riscv" anywhere.
- No `.gitlab-ci/` directory exists (404) -- no separate per-architecture CI include files.

The only riscv64-related GitLab artifact is branch `fix-test-suite-timeout-on-riscv64` (the source branch of merged MR !2063), which edits only `utils/test/test-logprof.py` -- a test-code timeout change, not a CI pipeline, runner, or job definition. The actual riscv64 test failures that motivated it (Debian bugs #1099085, #1134203) were caught by Debian's own buildd/autopkgtest infrastructure, which is not owned, defined, or run by the AppArmor project and has no config file in the AppArmor repository.

No use of RISE RISC-V runners was found (no reference to `riseproject-dev` or RISE runner labels in any CI config).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes | Not present in CI config | No |
| CI runs tests | Yes | Not present in CI config | No |
| CI publishes artifact | No (source-only project) | No | No |
| Hardware/backend | QEMU (image-garden), GitLab shared/KVM runners | N/A | N/A |

## 8. Distribution and Release Status

**No upstream binary releases for any architecture.** AppArmor's GitLab Releases page (73 releases, 137 tags) ships source tarballs only; there are no per-architecture binary assets to inspect, consistent with a project distributed exclusively through Linux distributions.

**PyPI:** no package named `apparmor` exists. `https://pypi.org/pypi/apparmor/json` returns HTTP 404, as does `https://pypi.org/simple/apparmor/`. This is expected -- AppArmor is a kernel-LSM-plus-C-userspace project, not a Python package, so PyPI is not a meaningful distribution channel for it.

**RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/apparmor/` 302-redirects to the (404) PyPI simple index above. No RISE-built wheels exist, consistent with there being no PyPI package to wheel-build in the first place.

**Ubuntu 26.04 (resolute):** confirmed via direct fetch of `packages.ubuntu.com/resolute/riscv64/apparmor` -- **riscv64 package exists**, version `5.0.0~beta1-0ubuntu7`, package size 364.5 kB, installed size 2,308.0 kB, depending on `libapparmor1`, `libc6`, `libstdc++6`. The broader search page lists riscv64 builds for `apparmor`, `libapparmor1`, `libapparmor-dev`, `libapache2-mod-apparmor`, `libpam-apparmor`, `python3-libapparmor`, and `uwsgi-plugin-apparmor`, alongside amd64/arm64/armhf/i386/ppc64el/s390x. `python3-apparmor` is architecture-independent (`all`) and installs on riscv64 by virtue of depending on the riscv64-built `python3-libapparmor`.

**Debian:** ships and actively maintains `apparmor` on riscv64 via its own buildd/autopkgtest infrastructure; two riscv64-specific FTBFS bugs were filed and fixed within days to weeks (#1099085, #1134203; see Section 2), and the package version currently used by Ubuntu (`5.0.0~beta1`) is a pre-release beta, not a stable-tagged upstream release.

**Arch Linux riscv64 (unofficial port, archriscv.felixc.at):** checked the authoritative porting-status table directly -- neither `apparmor` nor `libapparmor` appear anywhere in it. No riscv64 build exists for this port.

**What a user must do to get a working binary:** install from Ubuntu's or Debian's riscv64 archive (`apt install apparmor`); there is no upstream-published binary, and no working path via PyPI, RISE wheels, or the Arch riscv64 port.

## 9. Dependencies

Identified from AppArmor's actual build files (README, INSTALL, `libraries/libapparmor/configure.ac`, `parser/Makefile`). The [project-graph](https://gitlab.com) MCP server failed to connect for this research (`CONNECTION_CLOSED`) across all attempts, so no live SPARQL cross-check against the Ubuntu 26.04 package graph could be run for any row below; this is a tool-connectivity failure, not evidence of absence, and should be retried separately.

| # | Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| 1 | Linux kernel (LSM framework) | Hosts the AppArmor LSM module; some functionality lives out-of-tree in `kernel-patches/` pending upstream acceptance | Not independently verified; LSM hooks are architecture-generic C, mainlined for all architectures including riscv64 | Not verified this session | Built into mainline kernel, not a separately versioned distro binary | No riscv64-specific gaps documented; `kernel-patches/` backlog is architecture-agnostic |
| 2 | GNU bison / flex | Generates the AppArmor policy-language parser/lexer (`parser/`) | Base-toolchain packages, built for every Ubuntu architecture including riscv64 (not independently re-verified this report) | Not verified | Not verified | No known blockers; pure-C, arch-independent build tools |
| 3 | Perl | Language bindings and profile/testing helper scripts | Priority:required/base package on every Ubuntu port including riscv64 (not independently re-verified) | Not verified | Not verified | No known blockers |
| 4 | Python (CPython) >=3.3 | Runtime for nearly all user-facing utilities (`aa-status`, `aa-genprof`, `aa-logprof`, `aa-notify`) and SWIG-generated bindings | See existing status report at `project-reports/python.md`, referenced by this project's dependency chain (not independently re-verified in this report) | Referenced report flags Tier-2 JIT and perf-trampoline gaps on riscv64, and no official PEP 11 riscv64 support tier | Referenced report | Not AppArmor-specific but a real dependency-chain risk for AppArmor's Python-based tooling |
| 5 | SWIG | Generates Perl/Python/Ruby bindings from `libapparmor` at build time | Host-arch build tool; target-arch status is not a meaningful constraint | Not verified | Not verified | No known riscv64-specific issues |
| 6 | zstd (libzstd) | Linked by `parser/Makefile` to compress/decompress the AppArmor policy cache | See existing status report at `project-reports/zstd.md` (not independently re-verified in this report) | Referenced report notes active RVV vectorization work but maintainer-review latency (3-6 months) on riscv64 performance PRs, and no dedicated riscv64 CI runner (QEMU-based only) | Referenced report | Functionally builds/runs on riscv64 today per referenced report; the risk flagged there is upstream responsiveness, not baseline support |
| 7 | Linux-PAM | `pam_apparmor` module for hat-switching on login | Base-system package on all Ubuntu ports (not independently re-verified) | Not verified | Not verified | No known blockers |
| 8 | libaudit (audit-userspace) | Optional audit-subsystem integration for policy-load/audit-event logging | Not independently verified this report | Not verified | Not verified | No known blockers identified from sources reviewed |
| 9 | gawk | Used by the build system for text/codegen processing (e.g. capability tables) | Build-host tool only | Not verified | Not verified | No known blockers |

Of these nine, only Python and zstd have dedicated RISC-V status reports already in this registry; the other seven have no dedicated report file. None could be checked against the live Ubuntu 26.04 riscv64 package graph in this research pass due to the project-graph MCP connection failure.

## 11. Known Bugs and Active Issues

All riscv64-related bugs found are closed/fixed; none are currently open.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Debian #1099085 | apparmor: FTBFS on riscv64: subprocess.TimeoutExpired | Fixed (4.1.0~beta5-3, 2025-03-04) | Serious (release-blocking) | Test-suite timeout too tight for riscv64 CI hardware (SiFive HiFive Unmatched); see [bug](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1099085) |
| Debian #1134203 | src:apparmor: fails to migrate to testing for too long: FTBFS on riscv64 | Fixed (4.1.7-2 Debian-downstream patch, closed 2026-05-24) | Serious (release-blocking) | Same class of issue recurring with a still-too-tight timeout; see [bug](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203) |
| Launchpad #2099990 | lsusb fails due to apparmor | Fix Released (4.1.0~beta5-0ubuntu6) | Medium | riscv64 (Microchip Icicle Kit): profile lacked rules for non-PCI USB controller sysfs paths |
| Launchpad #1990499 | Cannot use `/usr/lib/u-boot/qemu-riscv64_smode/uboot.elf` as bootloader due to AppArmor | Fix Released (Oct 2022, libvirt 8.6.0-0ubuntu3 / 8.0.0-1ubuntu7.3) | Medium | virt-aa-helper denied access to riscv64-specific bootloader/firmware paths |
| GitLab issue #463 | test `test-logprof` timeout on riscv64 | Closed (Nov 2024) | Low | Same class as Debian #1099085; reported via a third-party Arch riscv64 CI and a Litchi Pi 4A board |
| CRIU PR #2235 | apparmor: fix incorrect usage of sizeof on char ptr | Merged (2023-08-03, first shipped in CRIU v3.19) | Correctness bug | The one genuine AppArmor-riscv64 code bug found across all searches, but lives in CRIU's `criu/apparmor.c` (a downstream consumer), not in AppArmor's own codebase; `sizeof(path)` on a `char *` evaluated to pointer size instead of `PATH_MAX`, truncating AppArmor policy paths and breaking CRIU's `apparmor_stacking` test on riscv64 |

**Correctness bugs highlighted:** only one exists in the entire search -- CRIU PR #2235 above -- and it is in a third-party consumer's code, not AppArmor's own. No open or unresolved riscv64 bugs were found in Debian BTS, Ubuntu Launchpad, or the AppArmor GitLab issue tracker.

Excluded as not relevant: Launchpad #1989073 ("AppArmor DENIES reading of /sys/devices/system/cpu/possible") is a qemu-system-x86/libnuma/glibc-2.36 issue, not riscv64-specific. moby/buildkit #3625 mentions AppArmor only in an unrelated build-tag string; root cause was an Alpine/musl toolchain ISA-extension mismatch.

## 12. Objections and Upstream Blockers

**No stated objections found.** No upstream maintainer statement opposing riscv64 support was located in any source reviewed (GitLab issues/MRs, mailing list, Debian/Launchpad bugs).

**Technical blockers:** none beyond the two now-fixed test-suite timeout issues (Debian #1099085, #1134203), both closed. No architecture-specific code exists to port (Section 4), so there is no structural blocker of the kind seen in projects with JIT/SIMD/assembly.

**Organizational blockers:** the absence of any upstream riscv64 CI (Section 7) means future riscv64 regressions will continue to be caught downstream (Debian/Ubuntu buildds) rather than pre-merge, as already happened twice. There is no RISE involvement or funded engineering effort tracking AppArmor specifically (Section 1), so there is no organizational sponsor pushing for a CI upgrade.

**Acceptance probability for future riscv64-related patches:** high, based on observed history -- both timeout fixes were accepted quickly and without pushback (MR !1567 merged same day as opened cause identified; MR !2063 merged the day it was proposed). The blocker is not maintainer resistance but the complete absence of upstream riscv64 CI to catch issues before they reach downstream buildds.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Ubuntu/Debian; no upstream-published riscv64 artifact exists)
- **Optimization gap:** N/A -- AppArmor is not an optimization-purpose project. It is a security-mediation LSM whose value proposition is correctness of access control, not throughput; it has no architecture-specific optimization code (JIT, SIMD, hand-tuned assembly) for any architecture, including the amd64/arm64 reference platforms (Section 4), so the Step 2 optimization-coverage cap does not apply.
- **Justification:** AppArmor's own upstream GitLab CI (`.gitlab-ci.yml`, `spread.yaml`) runs no riscv64 job at all -- confirmed by direct read of both files, which reference only `x86_64`/`amd64` ([`.gitlab-ci.yml`](https://gitlab.com/apparmor/apparmor/-/raw/master/.gitlab-ci.yml)). Under the distribution floor, this would ordinarily place the project at yellow if a distro built cleanly from unpatched upstream source, but the record shows the opposite: Debian repeatedly needed distro-carried patches to fix riscv64-specific test-suite timeout failures (Debian bugs [#1099085](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1099085) and [#1134203](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203)), and the second fix (MR !2063) had, as of this report, only reached an upstream pre-release tag (v6.0.0-alpha1) rather than a stable release, meaning Debian's shipped 4.1.7-2 package carries a downstream backport not present in any upstream stable tag at that time. This patched/uncertain-on-vanilla-source status places the project at the orange (downstream-only) floor rather than yellow.
- **Pending work that could change the grade:** if MR !2063's fix reaches an upstream stable release tag (confirming clean builds from unpatched source across Debian/Ubuntu), and if a distro package is subsequently verified to build without additional riscv64 patches, the grade would move to yellow (clean-distro-build). Adding an actual riscv64 job to `.gitlab-ci.yml` (even build-only) would move the grade to yellow via the CI path directly; adding riscv64 test execution to that CI would move it to blue. No such CI work or RISE involvement was found in progress. [NEEDS VERIFICATION: current status of v6.0.0/6.x stable release and whether Ubuntu resolute's package has since dropped its downstream patch delta, as this was not re-checked after the research date.]

## 14. Investment Analysis

RISE has funded no work on AppArmor (Section 1); nothing here overlaps with existing RISE investment, so all items below represent net-new work.

### 14.1 Functional Enablement

No functional enablement work is required. AppArmor's kernel LSM and userspace code are already architecture-generic and build/run correctly on riscv64 today via Debian and Ubuntu; the only defects found (two test-suite timeout bugs) are already fixed upstream (Sections 2, 11).

### 14.2 Performance Optimization

Not applicable. AppArmor has no architecture-specific optimization code for any platform, so there is no riscv64-specific performance gap to close relative to amd64/arm64 (Section 4).

### 14.3 CI/CD Infrastructure

This is the primary gap. Upstream AppArmor GitLab CI has zero riscv64 presence (Section 7). Recommended work:
- Add a riscv64 build job to `.gitlab-ci.yml` (cross-compile or native runner), gated similarly to the existing `x86_64`/`kvm`-tagged jobs.
- Extend the `test` stage jobs (`test-libapparmor`, `test-parser`, `test-binutils`, `test-utils`, `test-mod-apparmor`, `test-profiles`) to run on riscv64, using timeouts already widened for riscv64 hardware in `test-logprof.py` (MRs !1567, !2063) as a precedent for tolerance-setting elsewhere in the suite.
- Add a riscv64 `spread` target (`spread.yaml`) mirroring the existing Ubuntu/Debian/Fedora/openSUSE cloud-image jobs, using riscv64 cloud images once available from those distros.

### 14.4 Ecosystem Enablement

Not applicable (see Section 10 omission rationale below) and covered by Section 9's dependency review -- no additional package-ecosystem enablement work beyond the already-tracked Python and zstd dependency reports was identified.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 build job to `.gitlab-ci.yml` | 1-2 | Upstream AppArmor maintainer or contributed patch | High |
| CI/CD | Add riscv64 test execution to existing test-stage jobs | 1-2 | Upstream AppArmor maintainer or contributed patch | High |
| CI/CD | Add riscv64 `spread` integration-test target | 2-3 | Upstream AppArmor maintainer or contributed patch | Medium |
| Distribution | Verify/confirm Ubuntu and Debian riscv64 packages build from unpatched upstream source once v6.x reaches stable, drop any residual downstream patches | 0.5-1 | Debian/Ubuntu package maintainers | Medium |
| Functional | None required | 0 | N/A | N/A |
| Performance | None applicable | 0 | N/A | N/A |

(Section 10, Ecosystem Status, is omitted: AppArmor is a system security tool with no dependent package ecosystem of the kind described in the reporting instructions -- e.g., no PyPI/npm/Maven package tree or Kubernetes operator set depends on AppArmor being riscv64-enabled to function; its only ecosystem-adjacent dependency chain is covered in Section 9.)

## 15. Updates

No updates yet -- initial report dated 2026-09-08.

## 16. References

- [Debian bug #1099085 - apparmor: FTBFS on riscv64: subprocess.TimeoutExpired](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1099085)
- [Debian bug #1134203 - src:apparmor: fails to migrate to testing for too long: FTBFS on riscv64](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1134203)
- [GitLab MR !1567 - Increase timeout for test_allow_all](https://gitlab.com/apparmor/apparmor/-/merge_requests/1567)
- [GitLab MR !2063 - Test suite: increase a couple timeouts to make the tests robust on riscv64](https://gitlab.com/apparmor/apparmor/-/merge_requests/2063)
- [GitLab branch fix-test-suite-timeout-on-riscv64](https://gitlab.com/apparmor/apparmor/-/tree/fix-test-suite-timeout-on-riscv64)
- [AppArmor .gitlab-ci.yml (raw, master)](https://gitlab.com/apparmor/apparmor/-/raw/master/.gitlab-ci.yml)
- [AppArmor GitLab project](https://gitlab.com/apparmor/apparmor)
- [AppArmor homepage](https://apparmor.net/)
- [CRIU PR #2234 - port to riscv64](https://github.com/checkpoint-restore/criu/pull/2234)
- [CRIU PR #2235 - apparmor: fix incorrect usage of sizeof on char ptr](https://github.com/checkpoint-restore/criu/pull/2235)
- [libvirt AppArmor QEMU riscv patch, libvir-list ~2019-04](https://listman.redhat.com/archives/libvir-list/2019-April/msg00003.html)
- [Launchpad #2099990 - lsusb fails due to apparmor](https://bugs.launchpad.net/ubuntu/+source/apparmor/+bug/2099990)
- [Launchpad #1990499 - Cannot use riscv64 bootloader due to AppArmor](https://bugs.launchpad.net/ubuntu/+source/libvirt/+bug/1990499)
- [Launchpad #1989073 - AppArmor DENIES reading of /sys/devices/system/cpu/possible (not riscv64-specific, excluded)](https://bugs.launchpad.net/ubuntu/+source/apparmor/+bug/1989073)
- [Ubuntu packages.ubuntu.com search - AppArmor, resolute suite](https://packages.ubuntu.com/search?keywords=AppArmor&suite=resolute&searchon=names&section=all)
- [PyPI JSON API - apparmor (404, no such package)](https://pypi.org/pypi/apparmor/json)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [Arch Linux riscv64 port status table](https://archriscv.felixc.at/.status/status.htm)
- [Phoronix - The AppArmor Performance Impact In 70+ Benchmarks On Linux 5.5 Git (x86, not riscv64)](https://www.phoronix.com/news/AppArmor-Linux-5.5-72-Tests)
- [moby/buildkit #3625 (false positive, excluded)](https://github.com/moby/buildkit)
