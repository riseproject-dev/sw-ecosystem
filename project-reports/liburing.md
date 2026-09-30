---
title: liburing
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: libbpf
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="liburing" %}

# liburing

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for liburing<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

liburing is a thin userspace wrapper library over the Linux `io_uring` asynchronous I/O subsystem (syscalls `io_uring_setup`, `io_uring_enter`, `io_uring_register`). Its design goal is to expose the full io_uring interface with minimal overhead: the entire architecture-specific surface of the library is a syscall trampoline (inline-asm `ecall`/`syscall`/`svc` invocation) and a page-size probe. There is no JIT, no SIMD, no cryptographic primitive, and no custom allocator anywhere in the codebase. Recursive dependency and code-search checks confirm this is by design, not an oversight: liburing has no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json`, because it is built with a hand-written `./configure` shell script plus GNU Make, and it ships zero third-party numerics/crypto/compression/allocator dependencies.

**Governance:** No foundation affiliation (no Linux Foundation, CNCF, or similar umbrella). No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `PLATFORMS.md`, or `docs/platforms/` file exists anywhere in the repository. Governance is effectively single-maintainer: Jens Axboe (`axboe@kernel.dk`) authored 2,264 of 3,749 all-time commits (about 60%) and 237 of roughly 373 commits in the trailing 12 months (about 64%), and personally merges essentially every external contribution. Development follows a Linux-kernel-style workflow coordinated on the `io-uring@vger.kernel.org` mailing list: one change per commit, mandatory DCO `Signed-off-by`, no squash-on-merge, patches accepted by GitHub PR or email, per `CONTRIBUTING.md`. Axboe is also the Linux kernel block-layer and io_uring subsystem maintainer.

**License:** Dual LGPL-2.1 (`COPYING`) / MIT (`LICENSE`) for the library; the kernel-derived uapi header is dual GPL-2.0-with-Linux-syscall-note / MIT.

**Corporate contributors (by commit-author email domain, all-time, 3,749 commits):** Meta/Facebook (`fb.com`/`meta.com`, 100 commits, incl. Dylan Yudaken, Stefan Roesch), Red Hat (`redhat.com`, 73, incl. Stefano Garzarella, Stefan Hajnoczi, Jeff Moyer), SUSE (`suse.de`, 32, incl. Gabriel Krisman Bertazi, still active as of August 2026), Pure Storage (`purestorage.com`, 31, Caleb Sander Mateos), Samsung (19), Alibaba (`linux.alibaba.com`, 12), KylinSoft (10), Tencent (9), Huawei (8), Codasip - a RISC-V IP vendor - (`codasip.com`, 8, general test fixes from Chris Hofer, Christian A. Ehrhardt, Chris Gellermann, Florian Schmaus, active September 2025 to July 2026 but not riscv-specific), and the gnuweeb.org community group (189 commits, Ammar Faizi, Alviro Iskandar Setiawan). No `FUNDING.yml` or GitHub Sponsors setup exists; all contribution is in-kind engineering time, not declared financial sponsorship. Jens Axboe's own commits are under his personal `kernel.dk` address; his employer cannot be determined from repository data [NEEDS VERIFICATION].

**RISE Project involvement:** None. All 35 RISE blog posts (2024-05-15 through 2026-09-28, full list checked via the WordPress sitemap and the blog's own search, which returns "no results" for both "liburing" and "io_uring") were checked; zero mention liburing or io_uring. The [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) lists 80+ packages; liburing is absent. The `riseproject-dev` GitHub org (26 repositories) has no liburing repository; code search across the org turns up liburing only as a third-party dependency documented in *other* projects' reports (memcached, redpanda, rocksdb, ceph, qemu, myrocks, dragonfly, postgresql, eclipse-zenoh, foundationdb, apache-age), and as a bundled sub-library inside the `nixl-cu12` Python wheel build, never as RISE's own funded work. RISE membership (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) is corporate, and no member is credited as liburing's steward. liburing's own CI uses no RISE build-farm runners.

**Community culture on new ports:** Architecture patches are accepted informally and quickly. The riscv64 port ([PR #928](https://github.com/axboe/liburing/pull/928), [PR #930](https://github.com/axboe/liburing/pull/930)) was submitted and merged within about 17 hours by a first-time, external contributor, with no preceding tracking issue and essentially no review discussion beyond one approving review on #928. `CONTRIBUTING.md` requires single-purpose commits, DCO sign-off, independent compilation, and testing, but there is no formal ports committee or architecture-tiering process gating new-arch contributions.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-07-26 | Commit `00c8a105` (Alviro Iskandar Setiawan, gnuweeb.org) - a portability fix incidentally relevant to riscv (`__NR_mmap2` preprocessor condition), not yet adding the architecture. | liburing history |
| 2023-08-22 | Commit `59d41ab9` - adds a riscv64 cross-compile job to the GitHub Actions CI matrix (`gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu`). First real riscv64 commit. Opened and merged same day. | [PR #928](https://github.com/axboe/liburing/pull/928) |
| 2023-08-23 | Commit `d305ed56` - adds `src/arch/riscv64/syscall.h` and `src/arch/riscv64/lib.h` (full nolibc syscall stubs via `ecall`, registers a0-a7), updates `configure`, `src/lib.h`, `src/syscall.h`, `test/nolibc.c`; adds `-lgcc` to `LINK_FLAGS` to resolve an `undefined reference to '__clzdi2'` linker error on riscv64 nolibc builds. This is the commit that makes riscv64 a supported architecture. | [PR #930](https://github.com/axboe/liburing/pull/930) |
| 2023-08-23 | Both PRs' merge commits (`2ac566f` for #928, `921c430` for #930) confirmed as ancestors of `origin/master` via direct git inspection. `2ac566f` (#928) landed first at 2023-08-23T00:11:12Z; `921c430` (#930) landed later the same day at 2023-08-23T15:27:10Z. This sequencing (about 15 hours apart) is the git-verified ground truth. GitHub's search-API metadata separately reported both PRs' `merged_at` as roughly one second apart (`...15:27:23Z` and `...15:27:24Z`); that figure does not match the commit graph and should be disregarded in favor of the direct git timestamps above. | Local clone verification (`git merge-base --is-ancestor`, `git log`) |
| 2023-11-04 | `liburing-2.5` tag - first stable release containing both riscv64 commits, confirmed via `git tag --contains`. (An earlier compilation of this report cited 2023-11-29 for this release without direct tag verification; the git-verified date above is authoritative.) | Local clone verification |
| 2026-06-09/10 | Commit `284b1a8be2ca2ea546204ed2c501414c89bea48f` (Jens Axboe) - "src/arch: use sysconf() for page size on aarch64/riscv64 libc builds," landed via the "fixes" branch merge commit `5290dd8` on 2026-06-09; first appears in tag `liburing-2.15-rc1` (2026-06-10 per `git tag --contains`). Fixes a silent fallback to a hardcoded 4096-byte page size when `/proc` is not mounted (chroots, minimal containers), which produced wrong ring size/offset math on 16K/64K-page kernels. | [Commit 284b1a8](https://github.com/axboe/liburing/commit/284b1a8be2ca2ea546204ed2c501414c89bea48f) |
| 2026-06-27 | `liburing-2.15` stable release, shipping the `sysconf()` page-size fix. | liburing GitHub releases |

**Key contributors:**
- **Michal Biesek** (`michalbiesek@gmail.com`): authored the entire riscv64 port (both PRs). His public GitHub forks include `pmem/pmdk`, `pmem/redis`, and `memkind/memkind` (Intel Persistent Memory Development Kit projects), which is suggestive of Intel employment at the time but is not confirmed by any repository metadata [NEEDS VERIFICATION].
- **Jens Axboe** (`axboe@kernel.dk`): merged both riscv64 PRs same-day with no formal review recorded, and personally authored the June 2026 page-size correctness fix, indicating ongoing (not one-off) maintenance of the riscv64 code path.

**Upstreaming status:** Fully upstream, no out-of-tree patches required. Independent confirmation: the Debian sid `liburing2`/`liburing-dev` 2.14-1 riscv64 packages were built from unmodified upstream source with no riscv64-specific packaging patches found.

## 3. Upstream Support Tier

liburing defines no explicit, written tier policy (no supported/community/unsupported classification document exists). The table below characterizes the de facto tier per architecture, based on direct inspection of `.github/workflows/ci.yml` (394 lines, fetched in full) and the repository tree.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated arch source files | Yes (`src/arch/x86/`) | Yes (`src/arch/aarch64/`) | Yes (`src/arch/riscv64/`) |
| CI build job | Yes | Yes | Yes (cross-compile) |
| CI runtime test execution | Yes, native, full suite | Yes, native, full suite | No, cross-compile only, no QEMU |
| Sanitizer builds in CI | Yes | Yes | No (`sanitize: 0`, `tsan: 0`) |
| Official upstream binaries | No, source-only releases | No | No |
| Distribution packages | Yes | Yes | Yes (Debian sid, Ubuntu 26.04 resolute) |
| nolibc build support | Yes | Yes | Yes (since 2.5) |

CI also cross-compiles i686, arm, powerpc64, powerpc, alpha, mips64, mips, and hppa in the same matrix; every non-x86_64 target, riscv64 included, receives identical build-only, no-sanitizer treatment. This is a general "CI host is x86_64" limitation of the project, not riscv64-specific neglect. riscv64, arm64, and x86/x86_64 are the only three architectures with a hand-written, ABI-correct `src/arch/<name>/` backend; all other listed targets (powerpc, mips, alpha, hppa, etc.) fall through to the generic libc `syscall()` wrapper in `src/arch/generic/syscall.h`. **De facto tier: riscv64 is first-class in source code and distribution packaging, second-class in CI** - it builds and links correctly and ships in real distro packages, but no compiled riscv64 binary is ever executed by upstream's own automation.

## 4. Technical Architecture and RISC-V-Specific Subsystems

liburing's architecture-sensitive surface is exactly two components: the syscall trampoline and the page-size probe. Nothing else in the codebase is architecture-specific; a grep across `src/` confirms no other file contains an arch `#ifdef` - the queue/submission logic (`queue.c` etc.) is fully generic C using compiler atomic builtins. There is no assembly (`.S`/`.s`) file anywhere in the repository for any architecture; all arch code is C headers with inline `__asm__`.

### Syscall trampoline

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| File | `src/arch/x86/syscall.h` | `src/arch/aarch64/syscall.h` | `src/arch/riscv64/syscall.h` (100 lines) |
| Instruction | `syscall` (64-bit) / `int $0x80` (i386) | `svc 0` | `ecall` |
| Syscall number register | `rax` | `x8` | `a7` |
| Argument registers | `rdi, rsi, rdx, r10, r8, r9` | `x0-x5` | `a0-a5` |
| Result register | `rax` | `x0` | `a0` |
| Coverage | `__do_syscall0`-`__do_syscall6` | `__do_syscall0`-`__do_syscall6` | `__do_syscall0`-`__do_syscall6` |
| ISA extensions required | None beyond base | None beyond base | None beyond RV64I |
| Quality | Hand-tuned inline asm, most extensive (296 lines, covers both 64-bit and i386 paths) | Hand-tuned inline asm | Hand-tuned inline asm, structural parity with aarch64 |

No stub markers exist: a search for `TODO|FIXME|stub|not implement|unimplement|unsupported` across `src/arch/riscv64/`, `aarch64/`, `x86/`, `generic/`, and `syscall-defs.h` returns zero hits in any of them. riscv64 falls back to `arch/generic/syscall.h` (the plain libc `syscall()` wrapper) only if its `#if defined(__riscv) && __riscv_xlen == 64` guard fails to match, exactly the same fallback pattern every other architecture has.

### Page-size probe

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| File | `src/arch/x86/lib.h` | `src/arch/aarch64/lib.h` | `src/arch/riscv64/lib.h` (61 lines) |
| libc build path | Hardcodes `return 4096` | `sysconf(_SC_PAGESIZE)` | `sysconf(_SC_PAGESIZE)` (since commit `284b1a8`, June 2026) |
| nolibc build path | Hardcodes `return 4096` | Reads `/proc/self/auxv` for `AT_PAGESZ` | Reads `/proc/self/auxv` for `AT_PAGESZ` |
| Correctness | Correct, x86 is always 4K pages | Correct for all arm64 page sizes | Fixed June 2026; the libc path previously fell through to the same auxv-parsing code the nolibc path uses, silently defaulting to 4096 when `/proc` wasn't mounted (chroots, minimal containers), which broke ring size/offset math on 16K/64K-page kernels |

### Component inventory

| Component | Exists for riscv64 | ISA extensions | Quality |
|---|---|---|---|
| Syscall trampoline | Yes | RV64I base only | Complete, hand-tuned inline asm |
| Page-size probe | Yes | None | Complete after the June 2026 fix |
| JIT backend | N/A | N/A | liburing has no JIT of any kind |
| SIMD / RVV | N/A | N/A | No vector intrinsics, no `vfloat32m1_t`, no RVV type usage anywhere in the repo |
| Bit-manipulation (Zba/Zbb) | N/A | N/A | Not used |
| Cryptographic primitive | N/A | N/A | Absent by design |
| Custom allocator | N/A | N/A | Absent by design |

An adversarial re-check specifically tested the hypothesis that riscv64 support is a stub. It is refuted: riscv64 has a complete, hand-written, ABI-correct syscall backend and nolibc page-size handling, wired into the build identically to aarch64 at the only two arch-dispatch points in the codebase (`src/lib.h`, `src/syscall.h`), validated in CI at the same build-only level applied to every cross-compiled target, with zero stub markers and an active 2026 upstream maintenance fix. riscv64 sits in the same tier as aarch64 and x86/x86_64, strictly above the majority of listed architectures (powerpc, mips, alpha, hppa), which only get the generic fallback.

## 5. Build System, Cross-Compilation, and Toolchain

liburing uses a custom `./configure` shell script plus GNU Make. There is no CMake, no `CMakeLists.txt`, no `BUILDING.md`, no `INSTALL` file, and no `docs/` directory anywhere in the repository - confirmed by a fresh clone's directory listing at HEAD `78dce99b`.

**Exact cross-compile sequence for riscv64** (from `.github/workflows/ci.yml`, the only authoritative source):

```bash
sudo apt-get update -y
sudo apt-get install -y gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
./configure --cc=riscv64-linux-gnu-gcc --cxx=riscv64-linux-gnu-g++
make -j$(nproc) V=1 CPPFLAGS="-Werror" CFLAGS="-g -O3 -Wall -Wextra -Werror -Wno-sign-compare" CXXFLAGS="-g -O3 -Wall -Wextra -Werror -Wno-sign-compare"
sudo make install
```

**All `configure` flags:** `--prefix`, `--includedir`, `--libdir`, `--libdevdir`, `--mandir`, `--datadir`, `--cc`, `--cxx`, `--use-libc` (forces standard libc instead of the default nolibc path), `--enable-sanitizer` (`-fsanitize=address,undefined`), `--enable-tsan` (`-fsanitize=thread`). There is no `--host` or toolchain-file mechanism and no riscv64-specific flag; cross-compilation is driven purely by pointing `--cc`/`--cxx` at the riscv64 cross-gcc.

**Toolchain version:** No minimum GCC/Clang version is documented anywhere (no version check in `configure`, README, or CONTRIBUTING.md). CI simply uses whatever `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu` Ubuntu 24.04 ships (GCC 13.x line), with no pin and no stated rationale.

**nolibc build:** Enabled by default unless `--use-libc` is passed. `configure`'s nolibc probe explicitly allows `x86_64`, `x86` (32-bit), `aarch64`, and riscv64 (`__riscv_xlen == 64`). The `-lgcc` addition from commit `d305ed56` resolves the riscv64-specific `__clzdi2` (count-leading-zeros intrinsic) linker error.

**QEMU:** None anywhere in the repository. A full-repository grep for "qemu" returns zero matches, and the complete 394-line `ci.yml` (read end to end) contains no `qemu-user-static`, no `docker/setup-qemu-action`, no `uraimo/run-on-arch-action`, and no container `arch:` directive. The "Test build against the installed liburing" CI step only compiles `test_build.c` against the cross-compiled library; it never executes the resulting riscv64 binary.

**Dockerfiles:** None found; no `Dockerfile*` and no `docker/` directory exist in the repository.

**Known build failures:** None currently open. The only documented riscv64 build issue was the `__clzdi2` linker error, resolved in the original port (2023-08-23).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

liburing is a syscall-interface library: every io_uring opcode is exposed through the same syscall wrappers regardless of host architecture, so there are no functional gaps between riscv64 and arm64/amd64 at the library level. The gaps that exist are entirely in CI coverage and packaging currency.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| All io_uring opcodes | Yes | Yes | Yes |
| nolibc build mode | Yes | Yes | Yes (since 2.5) |
| Full test suite execution | Yes (native CI) | Yes (native CI) | No (cross-compile only, no QEMU) |
| Sanitizer builds (ASan/UBSan/TSan) | Yes | Yes | No (`sanitize: 0`, `tsan: 0`) |
| BPF filter support (libbpf, optional) | Yes | Yes | Yes (libbpf maps riscv64 to `ARCH=riscv`; Debian ships `libbpf1`/`libbpf-dev` riscv64 at 2.14-1) |
| Non-4K page-size kernel correctness | Yes | Yes | Fixed June 2026 (`284b1a8`), shipped in 2.15 |

**Functional gaps:** None. Every io_uring operation available on Linux riscv64 is reachable through liburing.

**Performance gaps:** Data not available. Extensive searching (GitHub issue/code search on `axboe/liburing`, a full crawl of the RISE blog's WordPress sitemap covering all 35 posts, and general web search) found no published benchmark comparing liburing/io_uring throughput or latency on riscv64 versus arm64 or amd64, from liburing, RISE, or any third party. One open, unrelated issue ([#912](https://github.com/axboe/liburing/issues/912)) reports a generic (non-architecture-specific) 67x gap between raw `write()` and liburing for single-byte writes, attributed to per-submission syscall overhead; it is not riscv64-specific and carries no maintainer response.

**Security hardening gaps:** ASan, UBSan, and TSan are not run for riscv64 in upstream CI (`sanitize: 0`, `tsan: 0` in the matrix entry). Whether latent memory-safety issues exist in the riscv64 code paths is untested by upstream automation. Given the architecture's code footprint is limited to the two files described in Section 4, the practical exposure is small, but it is unverified.

**Floating-point/NaN semantics:** Not applicable. liburing performs no floating-point computation.

## 7. CI/CD Infrastructure

The only active CI configuration is [`.github/workflows/ci.yml`](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml) (confirmed via direct fetch of the raw file, 394 lines, and via negative-probing of a dozen plausible alternate workflow filenames, all returning 404). No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, or `.travis.yml` exists. The workflow triggers on every `push` and `pull_request`, with no branch filter, no `workflow_dispatch`, and no `schedule`.

The riscv64 matrix entry was added by [PR #928](https://github.com/axboe/liburing/pull/928) (originally against `.github/workflows/build.yml`; the workflow has since been consolidated into `ci.yml`), and currently reads (lines 122-129):

```yaml
- arch: riscv64
  cc_pkg: gcc-riscv64-linux-gnu
  cxx_pkg: g++-riscv64-linux-gnu
  cc: riscv64-linux-gnu-gcc
  cxx: riscv64-linux-gnu-g++
  sanitize: 0
  tsan: 0
```

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes | Yes |
| Runner | `ubuntu-24.04`, native | `ubuntu-24.04`, cross-compile | `ubuntu-24.04`, cross-compile |
| Compilation | Yes | Yes | Yes |
| Runtime test suite execution | Yes | No | No |
| QEMU execution | N/A | No | No, zero matches for "qemu" anywhere in the repo |
| ASan/UBSan | Yes | No | No (`sanitize: 0`) |
| TSan | Yes | No | No (`tsan: 0`) |
| Out-of-source build job | Yes (x86 only) | No | No |
| Alpine/musl build job | Yes (x86 only) | No | No |
| RISE build farm runners | No | No | No |

**Verdict:** the narrow claim "a riscv64 build target exists in CI" is true and verified directly from the file. The stronger claim "riscv64 CI tests/validates correctness" is false: no riscv64 binary is ever executed by upstream automation, under QEMU or on real hardware. A runtime-only defect on riscv64 (such as the page-size bug fixed in commit `284b1a8`) would pass this CI unconditionally; that bug was in fact caught and fixed manually by the maintainer, not by CI.

## 8. Distribution and Release Status

**Official upstream binaries:** None. Every GitHub release from 2.5 through 2.15 ships auto-generated source archives (`.zip`/`.tar.gz`) only.

| Channel | Version | riscv64 status | Notes |
|---|---|---|---|
| [GitHub releases](https://github.com/axboe/liburing/releases) | 2.15 (latest), plus 2.14, 2.13, 2.12, 2.11, 2.10, 2.9 | Source only, no binary assets at any version | Build from source with `--cc=riscv64-linux-gnu-gcc` |
| [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=liburing&suite=resolute&searchon=names&section=all) | 2.14-1 | Yes. Directly confirmed by downloading `liburing2_2.14-1_riscv64.deb` from `ports.ubuntu.com` (26,822 bytes, HTTP 200) and inspecting the extracted `liburing.so.2.14`: `file` reports "ELF 64-bit LSB shared object, UCB RISC-V, RVC, double-float ABI," a genuine riscv64 binary, not a placeholder | `liburing2` and `liburing-dev` both list architectures `amd64 arm64 armhf i386 ppc64el riscv64 s390x` |
| Debian sid | 2.14-1 | Yes, `liburing1`/`liburing-dev` built and installed for riscv64 | Current upstream stable |
| Ubuntu 24.04 "noble" | 2.5-1build1 [NEEDS VERIFICATION: not re-confirmed this cycle] | Reported as shipping `liburing2`/`liburing-dev` for riscv64 in an earlier pass of this research | If accurate, this predates the June 2026 page-size fix; riscv64 users on 16K/64K-page kernels on Noble would be exposed until the fix is backported or they build from source |
| Arch Linux RISC-V port | - | Contradictory: an earlier research pass reported `liburing-2.14-1-riscv64.pkg.tar.zst` on `archriscv.felixc.at`; a later, direct search of `archriscv.felixc.at/repo/extra/?q=liburing` in this cycle found **no matching package**. This discrepancy is unresolved [NEEDS VERIFICATION] | Do not treat Arch riscv64 availability as confirmed until re-checked directly |
| [PyPI `liburing`](https://pypi.org/project/liburing/) (Python bindings, a separate project) | 2026.3.30 | No. `pypi.org/pypi/liburing/json` lists exactly one wheel, `liburing-2026.3.30-cp38-abi3-manylinux_2_17_x86_64.whl`; the full simple-index (13 files, sdists back to 0.0.1) shows no riscv64 artifact at any version | The RISE GitLab wheel-builder project index for `liburing` (`gitlab.com/.../packages/pypi/simple/liburing/`) itself redirects (HTTP 302) to plain PyPI, i.e. RISE does not host or build this wheel |

**Release provider for riscv64:** distro, not upstream. Upstream GitHub Releases are source-only; the separate PyPI Python-binding wheel is x86_64-only; Ubuntu 26.04 resolute and Debian sid independently package and ship genuine riscv64 `.deb` binaries built from unmodified upstream source.

## 9. Dependencies

liburing's dependency surface is intentionally minimal, by design of a thin syscall-wrapper library. `project-graph` MCP queries against the Ubuntu 26.04 package graph could not be executed in several research passes (`CONNECTION_CLOSED`); this is a tooling gap, not evidence of absence, and is noted rather than papered over. All figures below come from direct inspection (source code, CI config, and live distro/package-index fetches).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Linux kernel | Runtime-dependency, critical. Provides the `io_uring_setup`/`io_uring_enter`/`io_uring_register` syscalls liburing wraps, plus build-time headers (`linux/io_uring.h`, `linux/fs.h`, `linux/time_types.h`, etc., with `compat.h` fallbacks for symbols missing on older kernels) | Full mainline riscv64 support; liburing has had a dedicated `src/arch/riscv64/` syscall backend since 2023-08-23 | Not exercised by liburing's own CI (cross-compile only, no QEMU) | Ships as part of every riscv64 Linux distribution | None open. The one correctness bug (wrong page size on non-4K-page riscv64/aarch64 libc builds in chroots without `/proc`) was fixed in commit [284b1a8](https://github.com/axboe/liburing/commit/284b1a8be2ca2ea546204ed2c501414c89bea48f), shipped in liburing 2.15 (2026-06-27) |
| libbpf | Runtime-dependency, optional. Supplies BPF filter support for `io_uring_bpf` operations; only needed when a user invokes that subset of the API | riscv64 mapped as `ARCH=riscv` in libbpf's own Makefile | Tested via Debian's own package builds, not through liburing's CI | Debian sid ships `libbpf1`/`libbpf-dev` for riscv64 at 2.14-1 | None known. A separate project report (`project-reports/libbpf.md`) tracks libbpf's own riscv64 readiness in more depth; not re-derived here |
| GCC | Build-dependency, critical. Both native builds and the CI cross-compile path (`gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu`) depend on GCC targeting riscv64 | CI installs it from Ubuntu 24.04's apt repos (GCC 13.x line); no minimum version is pinned or documented anywhere in the repo | Build-only use in CI | N/A, it is a toolchain, not a shipped runtime artifact | None |

**Recursive dependency analysis:** Not applicable beyond the table above. liburing has no JIT backend, no SIMD library dependency, no cryptographic library, and no compression library; its entire external dependency surface is Linux kernel/kernel-headers (always required) and libbpf (required only for the optional BPF-filter API). The internal `nolibc` mode is a *removal* of the libc dependency for freestanding builds, not an added dependency; it has been explicitly supported for riscv64 since liburing 2.5 (commit `d305ed56`, with the `-lgcc` fix for the `__clzdi2` linker error).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Commit [284b1a8](https://github.com/axboe/liburing/commit/284b1a8be2ca2ea546204ed2c501414c89bea48f) | Wrong page size on riscv64 (and aarch64) libc builds | Fixed, shipped in 2.15 (2026-06-27); first appeared in 2.15-rc1 (2026-06-10) | High while open - caused incorrect ring buffer size/offset math on 16K/64K-page kernels in chroots/minimal containers lacking `/proc` | `sysconf(_SC_PAGESIZE)` now used for libc builds; nolibc builds retain the `/proc/self/auxv` `AT_PAGESZ` path since they have no libc `sysconf` to call. Not caught by CI (build-only, no execution); found and fixed manually by the maintainer |

**Open riscv64-specific issues:** Zero. Every GitHub issue-search query for "riscv," "riscv64," and "RISC-V" against `axboe/liburing` returns either no results or false-positive semantic matches unrelated to RISC-V (for example #1207 ppc64le test failures, #1390 a 6.11 kernel lockup, #163 a 2020 NULL-deref bug). No master or tracking issue for the riscv64 port was ever opened; the work was delivered directly as the two implementation PRs in Section 2.

**Correction on PR #1601:** [PR #1601](https://github.com/axboe/liburing/pull/1601) (a send/recv man-page documentation fix for EAGAIN/O_NONBLOCK semantics) is a general, architecture-independent documentation change. It is not connected to riscv64, Ceph, or Seastar; it surfaces only as a semantic false-positive under a "riscv64" search query, the same way #1207/#1390/#163 do under issue search. It is listed here only to rule it out, not as riscv64-relevant.

**Correctness bugs affecting riscv64 today:** None open. The only correctness bug found (the page-size issue above) is fixed as of liburing 2.15.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found in any GitHub issue, PR discussion, or commit message. The port was reviewed by exactly one approver ([PR #928](https://github.com/axboe/liburing/pull/928), @ammarfaizi2) and merged the day it was opened, with [PR #930](https://github.com/axboe/liburing/pull/930) merged with no review comments at all.

**Technical blockers:** None. The architecture is complete, fully upstream, and shipping in Debian sid and Ubuntu 26.04 resolute.

**Organizational blockers:** None. Jens Axboe merged the entire port within roughly 17 hours of first submission and personally authored the June 2026 correctness fix, indicating active, ongoing maintenance rather than one-time acceptance.

**Acceptance probability for future riscv64 work:** High. The merge history shows zero friction for a first-time external contributor, and the maintainer has since independently fixed a riscv64-affecting bug without being asked via a tracking issue.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

Upstream CI ([`.github/workflows/ci.yml`](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml), lines 122-129) cross-compiles riscv64 with `gcc-riscv64-linux-gnu` on a standard x86_64 `ubuntu-24.04` runner but never executes the resulting binaries - no QEMU, no riscv64 hardware runner - so per the "build yes / test no" classification this is yellow (build-only-ci), not blue or green. Upstream itself publishes no riscv64 binary: GitHub Releases are source-only tarballs, and the separate PyPI `liburing` Python-binding wheel is x86_64-only. The release provider is therefore the distro, not upstream: Ubuntu 26.04 "resolute" and Debian sid ship `liburing2`/`liburing-dev` 2.14-1 for riscv64, independently confirmed as a genuine riscv64 ELF shared object (`file` reports "ELF 64-bit LSB shared object, UCB RISC-V") built from unmodified upstream source with no riscv64-specific packaging patches found. liburing is a thin io_uring syscall-wrapper library (syscall trampoline plus page-size probe only, no JIT/SIMD/crypto/allocator), so it does not qualify as an optimization-purpose project: it delivers its value (the io_uring interface) through plain generic C, and no optimization-level modifier applies.

**Pending work that could change the grade:** No open PRs or issues threaten the grade. The one known correctness bug (wrong page size on non-4K-page riscv64/aarch64 libc builds, affecting chroots without `/proc`) was already fixed upstream by Jens Axboe in commit [284b1a8](https://github.com/axboe/liburing/commit/284b1a8be2ca2ea546204ed2c501414c89bea48f), shipped in liburing 2.15 (2026-06-27). The only lever that could raise the color is upstream adding QEMU-based riscv64 test execution to CI; there is no evidence of that in progress. No RISE involvement exists (blog, wheel builder, and `riseproject-dev` GitHub org all checked, zero matches), so there is no RISE-side pending work either.

## 14. Investment Analysis

RISE has no involvement with liburing today (Section 1); nothing below overlaps with existing RISE-funded work.

### 14.1 Functional Enablement

No functional work is needed. All io_uring opcodes are accessible on riscv64 today, and the one outstanding functional/correctness issue (the non-4K page-size bug) is already fixed upstream in 2.15. The only residual action is distro-side: if Ubuntu 24.04 "noble" is still carrying the pre-fix 2.5-1build1 package [NEEDS VERIFICATION], riscv64 users on that release with 16K/64K-page kernels remain exposed until the package is updated or they build from source.

### 14.2 Performance Optimization

Data not available: no published benchmark for liburing/io_uring on riscv64 exists in any searched source (GitHub, RISE blog full sitemap crawl, general web search). This is expected given the architecture: liburing's per-arch code is limited to two small header files implementing syscall dispatch and a page-size probe, with no SIMD hot paths, no vectorizable loops, and no algorithmic surface to optimize. Actual I/O performance is determined by the Linux kernel's io_uring implementation on riscv64, not by liburing. Investment in liburing-layer performance work would yield negligible return; any performance investigation belongs at the kernel io_uring level, out of scope for this library.

### 14.3 CI/CD Infrastructure

This is the real, quantifiable gap: riscv64 has zero runtime test execution in upstream CI, and zero sanitizer coverage. A QEMU-based CI job, or use of riscv64 hardware CI runners (RISE-operated or otherwise), would close it and would also have caught the June 2026 page-size bug automatically rather than requiring manual discovery.

Estimated effort: 1-2 person-weeks to add QEMU-based runtime test execution to upstream CI (installing `qemu-user-static` and invoking the existing test suite under user-mode emulation for the riscv64 leg of the matrix), assuming upstream accepts the contribution - likely, given the project's demonstrated speed in accepting the original architecture port. A further 0.5-1 person-week to add ASan/UBSan riscv64 coverage once execution is possible.

### 14.4 Ecosystem Enablement

Not applicable as a distinct workstream: liburing itself is a C library with no dependent package ecosystem of its own (see Section 9's note that Section 10 is omitted). The one adjacent gap is the separate PyPI `liburing` Python-binding project, which ships only an x86_64 manylinux wheel with no riscv64 wheel at any version; that project is maintained independently of liburing and is out of scope for this report's core subject.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Distribution | Verify and, if needed, backport the 2.14+/2.15 page-size fix to Ubuntu 24.04 "noble"'s riscv64 package | 0.5 | Ubuntu / Canonical | Medium (pending re-verification of noble's current version) |
| CI/CD | Add QEMU-based runtime test execution for the riscv64 CI leg | 1-2 | Upstream contributor | Medium |
| CI/CD | Add riscv64 sanitizer builds (ASan/UBSan) once execution exists | 0.5-1 | Upstream contributor | Low |
| Verification | Resolve the Arch Linux riscv64 package-availability discrepancy (Section 8) | 0.1 | Any contributor | Low |
| Ecosystem (adjacent) | Build and publish a riscv64 wheel for the separate PyPI `liburing` Python binding | 2-3 | PyPI `liburing` maintainer | Low, not a liburing-core blocker |

## 15. References

- [axboe/liburing GitHub repository](https://github.com/axboe/liburing)
- [PR #928: .github: Add riscv64 build for GitHub bot](https://github.com/axboe/liburing/pull/928)
- [PR #930: Add nolibc riscv64 support](https://github.com/axboe/liburing/pull/930)
- [Commit 284b1a8: use sysconf() for page size on aarch64/riscv64 libc builds](https://github.com/axboe/liburing/commit/284b1a8be2ca2ea546204ed2c501414c89bea48f)
- [PR #1601: man: document that send/recv can see -EAGAIN without MSG_DONTWAIT (unrelated to riscv64)](https://github.com/axboe/liburing/pull/1601)
- [Issue #912: performance difference between write() and liburing for small writes (not riscv64-specific)](https://github.com/axboe/liburing/issues/912)
- [liburing CI workflow: .github/workflows/ci.yml](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml)
- [liburing GitHub releases](https://github.com/axboe/liburing/releases)
- [Ubuntu packages: liburing2, resolute (26.04)](https://packages.ubuntu.com/search?keywords=liburing&suite=resolute&searchon=names&section=all)
- [PyPI liburing package (Python bindings)](https://pypi.org/project/liburing/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members](https://riseproject.dev/members/)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/repo/extra/)