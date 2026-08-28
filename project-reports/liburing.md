---
title: liburing
parent: Project Reports
categories:
  - libraries
---

# liburing

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for liburing<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

liburing is a thin userspace wrapper library over the Linux `io_uring` async I/O subsystem (syscalls `io_uring_setup`, `io_uring_enter`, `io_uring_register`). Its design goal is to expose the full io_uring interface with minimal overhead: the library's architecture-specific code consists of inline-assembly syscall stubs and a page-size probe, nothing more. There is no JIT, no SIMD, no cryptographic primitive, and no custom allocator in the codebase.

**Governance:** liburing has no foundation affiliation and no formal governance structure. There is no MAINTAINERS, CODEOWNERS, steering committee, or TSC. The project is sole-maintainer-led.

**Corporate sponsors:** Jens Axboe (`axboe@kernel.dk`) is the sole maintainer and repository owner. His email domain is a personal domain. His GitHub profile links to Meta/Facebook. No corporate sponsor is named in the repository (CONTRIBUTING.md, SECURITY.md, or README). He is also the Linux kernel block-layer and io_uring subsystem maintainer.

**License:** Dual-licensed LGPL-2.1 (`COPYING`) and MIT (`LICENSE`), with a kernel-derived header under GPL-2.0 with Linux-syscall-note exception (`COPYING.GPL`).

**RISE Project involvement:** None. All 27 RISE blog posts from May 2024 through June 2026 were checked; zero mention liburing. The RISE wheel builder lists 80+ packages; liburing is absent. No RISE GitHub repository or RFP covers io_uring or liburing.

**Community culture on new ports:** The project accepts architecture patches informally. The riscv64 port (PRs [#928](https://github.com/axboe/liburing/pull/928) and [#930](https://github.com/axboe/liburing/pull/930)) was merged the same day it was submitted, with no preceding tracking issue and minimal review. CONTRIBUTING.md requires single-purpose commits, `Signed-off-by` (DCO), independent compilation, and testing. No formal review or approval gating is documented for new architecture ports.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-08-22 | Commit `59d41ab` -- adds riscv64 to GitHub Actions CI matrix (`gcc-riscv64-linux-gnu`). First RISC-V commit. | [PR #928](https://github.com/axboe/liburing/pull/928) |
| 2023-08-23 | Commit `d305ed5` -- adds `src/arch/riscv64/syscall.h` and `src/arch/riscv64/lib.h`. Full nolibc syscall stubs via `ecall` with registers a0-a7. Updates `configure`, `src/lib.h`, `src/syscall.h`, `test/nolibc.c`. Adds `-lgcc` to resolve `__clzdi2` linker error on nolibc riscv64 builds. | [PR #930](https://github.com/axboe/liburing/pull/930) |
| 2023-11-29 | liburing-2.5 released: first stable release containing both riscv64 PRs. | [GitHub releases](https://github.com/axboe/liburing/releases) |
| 2026-06-09 | Commit `284b1a8` by axboe -- `src/arch: use sysconf() for page size on aarch64/riscv64 libc builds`. Fixes incorrect page-size assumptions on non-4K-page kernels for libc builds; nolibc path retains the `/proc/self/auxv` scan. | [liburing master](https://github.com/axboe/liburing) |
| 2026-06-15 | liburing-2.15-rc1 released: first release to explicitly name riscv64 in the changelog ("use sysconf() for page size on aarch64/riscv64 libc builds"). | [GitHub releases](https://github.com/axboe/liburing/releases) |

**Key contributors:**

- **Michal Biesek** (`michalbiesek@gmail.com`): authored the entire riscv64 port (both PRs). His GitHub forks include `pmem/pmdk`, `pmem/redis`, and `memkind/memkind` -- all Intel Persistent Memory Development Kit projects -- indicating Intel employment at the time [NEEDS VERIFICATION: employer not confirmed in repository metadata].
- **Jens Axboe** (`axboe@kernel.dk`): merged both PRs on the same day with no formal review, and authored the June 2026 page-size fix.

**Upstreaming status:** Fully upstream. No out-of-tree patches are required. Arch Linux RISC-V builds cleanly from upstream with no patches ([felixonmars/archriscv-packages](https://github.com/felixonmars/archriscv-packages) has no liburing patch directory).

---

## 3. Upstream Support Tier

liburing defines no explicit tier policy. There is no documented supported/community/unsupported classification. The evidence below characterizes the de facto tier for each architecture.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated arch source files | Yes (`src/arch/x86/`) | Yes (`src/arch/aarch64/`) | Yes (`src/arch/riscv64/`) |
| CI build job exists | Yes | Yes | Yes (cross-compile) |
| CI runtime tests | Yes (native, full suite) | Yes (native, full suite) | No (cross-compile only) |
| Sanitizer builds in CI | Yes | Yes | No (`sanitize: 0`, `tsan: 0`) |
| Official binary releases | No (source-only releases) | No | No |
| Distribution packages | Yes | Yes | Yes (Debian, Ubuntu, Arch) |
| Changelog mentions | Yes | Yes | Only 2.15-rc1 |
| nolibc build support | Yes | Yes | Yes (since 2.5) |

**De facto tier:** riscv64 is treated as a first-class architecture in source and distribution packaging, but second-class in CI: it is cross-compile-only with no runtime test execution and no sanitizer builds. amd64 and arm64 run the full test suite natively.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

liburing's architecture-specific surface is intentionally minimal. The only architecture-sensitive components are: (1) the syscall trampoline, and (2) the page-size probe. There is no JIT, SIMD, cryptographic primitive, vector extension usage, assembly `.S` file, or GC barrier in the entire codebase.

### Syscall trampoline

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| File | `src/arch/x86/syscall.h` | `src/arch/aarch64/syscall.h` | `src/arch/riscv64/syscall.h` |
| Instruction | `syscall` | `svc 0` | `ecall` |
| Syscall number register | `rax` | `x8` | `a7` |
| Argument registers | `rdi`, `rsi`, `rdx`, `r10`, `r8`, `r9` | `x0`-`x5` | `a0`-`a5` |
| Result register | `rax` | `x0` | `a0` |
| Coverage | `__do_syscall0`-`__do_syscall6` | `__do_syscall0`-`__do_syscall6` | `__do_syscall0`-`__do_syscall6` |
| ISA extensions required | None beyond base | None beyond base | None beyond RV64I |
| Notable | Handles x86-64 and i386 in one file; GCC 32-bit bug workaround | Single variant | Two variants (`__do_syscallM`/`__do_syscallN`) splitting on whether `a1` is clobbered -- architecturally correct for RISC-V syscall ABI |
| Quality | Hand-tuned inline asm | Hand-tuned inline asm | Hand-tuned inline asm, parity with arm64 |

The riscv64 two-variant split in `syscall.h` (clobbers `a1` vs does not) is a RISC-V-specific refinement not present in the aarch64 implementation. It reflects the RISC-V Linux ABI where some syscalls return a second value in `a1`.

### Page-size probe

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| File | `src/arch/x86/lib.h` | `src/arch/aarch64/lib.h` | `src/arch/riscv64/lib.h` |
| libc path | Hardcodes `return 4096` | `sysconf(_SC_PAGESIZE)` | `sysconf(_SC_PAGESIZE)` |
| nolibc path | Hardcodes `return 4096` | Reads `/proc/self/auxv` for `AT_PAGESZ` | Reads `/proc/self/auxv` for `AT_PAGESZ` |
| Correctness note | Hardcoded 4096 is correct for x86 | Correct for all arm64 page sizes | Fixed in June 2026 (commit `284b1a8`); previously the libc path was missing, causing wrong ring offsets on non-4K kernels |

### Complete component inventory

| Component | Exists | ISA extensions | Quality | Notes |
|---|---|---|---|---|
| Syscall trampoline | Yes | RV64I base only | Complete, hand-tuned inline asm | Parity with arm64; minor improvement (two-variant clobber split) |
| Page-size probe | Yes | None | Complete after June 2026 fix | Bug in libc path fixed in 2.15-rc1 |
| JIT backend | N/A | N/A | N/A | liburing has no JIT |
| SIMD / RVV | N/A | N/A | N/A | No SIMD of any kind in the codebase |
| Cryptographic primitive | N/A | N/A | N/A | Absent by design |
| Custom allocator | N/A | N/A | N/A | Absent by design |
| Assembly `.S` files | None | N/A | N/A | Arch-specific code is header-only inline asm |

---

## 5. Build System, Cross-Compilation, and Toolchain

liburing uses a custom `./configure` shell script (not CMake, not Autoconf). There is no `CMakeLists.txt`, no `BUILDING.md`, and no cross-compilation guide in the repository.

**Cross-compilation command for riscv64 (from `.github/workflows/ci.yml`):**

```bash
sudo apt-get install -y gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
./configure --cc=riscv64-linux-gnu-gcc --cxx=riscv64-linux-gnu-g++
make -j$(nproc) V=1 CPPFLAGS="-Werror" CFLAGS="-g -O3 -Wall -Wextra -Werror -Wno-sign-compare"
sudo make install
```

**Available configure flags:**

| Flag | Effect |
|---|---|
| `--cc=CC` | C compiler to use |
| `--cxx=CXX` | C++ compiler to use |
| `--use-libc` | Use standard libc instead of the nolibc path |
| `--enable-sanitizer` | Compile with `-fsanitize=address,undefined` |
| `--enable-tsan` | Compile with `-fsanitize=thread` |

**Toolchain version:** No minimum version is documented. The CI uses `gcc-riscv64-linux-gnu` as shipped with Ubuntu 24.04 (GCC 13). No explicit version guard exists in `configure`.

**nolibc build:** Enabled by default when `--use-libc` is not passed. The `configure` script guards nolibc activation on `(defined(__riscv) && __riscv_xlen == 64)` alongside x86-64, x86 32-bit, and aarch64. The `-lgcc` addition (commit `d305ed5`) resolves an `__clzdi2` linker error specific to riscv64 nolibc builds.

**QEMU:** The upstream CI does not use QEMU. The riscv64 build job is cross-compilation only on an x86_64 `ubuntu-24.04` runner. Testing on riscv64 requires native hardware. No QEMU step appears in any workflow file (`.cirrus.yml`, `Jenkinsfile`, and `.gitlab-ci.yml` all return 404; the only active CI is `.github/workflows/ci.yml`).

**Known build failures:** None currently open. The only documented build issue for riscv64 was the `__clzdi2` linker error, resolved in the initial port (2023-08-23).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

liburing is a syscall-interface library. "Features" are io_uring operations exposed to userspace. Since all features are implemented via the same syscall wrappers regardless of architecture, there are no functional gaps between riscv64 and arm64/amd64 at the library level. The gaps are exclusively in CI coverage and tooling.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| All io_uring opcodes | Yes | Yes | Yes |
| nolibc build mode | Yes | Yes | Yes (since 2.5) |
| Full test suite execution | Yes (native CI) | Yes (native CI) | No (cross-compile only, no QEMU) |
| Sanitizer builds | Yes | Yes | No |
| Security hardening (ASan/UBSan) | Yes | Yes | Not tested in CI |
| BPF filter support (libbpf optional dep) | Yes | Yes | Yes (libbpf ships riscv64 packages) |
| Non-4K page-size kernels | Yes | Yes | Yes (fixed June 2026 in 2.15-rc1) |

**Functional gaps:** None. All io_uring operations available on Linux riscv64 are accessible through liburing.

**Performance gaps:** Data not available: no published benchmark comparing liburing throughput or latency on riscv64 vs arm64 or amd64 was found in any public source (GitHub, RISE blog, Phoronix, lore.kernel.org).

**Security hardening gaps:** ASan and UBSan are not run for riscv64 in upstream CI. Whether any latent memory-safety issues exist in the riscv64 code paths is untested upstream.

---

## 7. CI/CD Infrastructure

The only active CI file is [`.github/workflows/ci.yml`](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml). It triggers on every `push` and `pull_request` to any branch, with no branch filter.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes | Yes |
| Runner | `ubuntu-24.04` (native) | `ubuntu-24.04` (native) | `ubuntu-24.04` (x86 host, cross-compile) |
| Compilation | Yes | Yes | Yes |
| Runtime test suite | Yes | Yes | No |
| QEMU execution | N/A | N/A | No |
| ASan/UBSan | Yes | Yes | No (`sanitize: 0`) |
| TSan | Yes | Yes | No (`tsan: 0`) |
| Out-of-source build job | Yes | Yes | No (x86 only) |
| Alpine/musl build job | Yes | No | No |
| RISE build farm runners | No | No | No |

**riscv64 CI matrix entry (exact):**

```yaml
- arch: riscv64
  cc_pkg: gcc-riscv64-linux-gnu
  cxx_pkg: g++-riscv64-linux-gnu
  cc: riscv64-linux-gnu-gcc
  cxx: riscv64-linux-gnu-g++
  sanitize: 0
  tsan: 0
```

The CI installs the cross-compiler via `apt-get`, runs `./configure`, cross-compiles the library, runs `sudo make install`, and cross-compiles a test program (`test_build.c`) against the installed library. No compiled binary is executed.

**Latest CI run:** Run #524 (commit `650d8fb`) completed successfully [NEEDS VERIFICATION: run number cited from research findings, not independently re-checked].

---

## 8. Distribution and Release Status

**Official upstream binaries:** None. All GitHub releases (`liburing-2.15-rc1` through `liburing-2.5`) ship source archives only (auto-generated `.zip` and `.tar.gz`). No binary assets exist at any version.

**Obtaining a working riscv64 binary:**

| Channel | Version | riscv64 status | Notes |
|---|---|---|---|
| [GitHub releases](https://github.com/axboe/liburing/releases) | 2.15-rc1 (2026-06-15) | Source only -- no binaries | Build from source with `--cc=riscv64-linux-gnu-gcc` |
| [Ubuntu 24.04 Noble](https://packages.ubuntu.com/noble/liburing2) | 2.5-1build1 | Yes: `liburing2` and `liburing-dev` for riscv64 | Significantly behind upstream (2.5 vs 2.14) |
| [Debian sid](https://buildd.debian.org/status/package.php?p=liburing&suite=sid) | 2.14-1 | Yes: Installed on riscv64, built on `rv-osuosl-02` | Current upstream stable |
| [Arch Linux RISC-V](https://archriscv.felixc.at/repo/extra/) | 2.14-1 | Yes: `liburing-2.14-1-riscv64.pkg.tar.zst` (261 KB, 2026-02-10) | No patches; builds clean from upstream |
| [PyPI `liburing`](https://pypi.org/project/liburing/) | 2026.3.30 | No: x86_64 only (`manylinux_2_17_x86_64.whl`) | Separate Python binding project; no riscv64 wheel at any version |

**Ubuntu 24.04 ships version 2.5**, which predates the June 2026 page-size fix. Users on Ubuntu 24.04 with non-4K-page kernels on riscv64 will encounter the wrong-ring-offset bug until Ubuntu updates its package to 2.14 or later, or users build from source.

---

## 9. Dependencies

liburing is a thin syscall wrapper. Its dependency surface is intentionally minimal.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Linux kernel (io_uring) | Core: `io_uring_setup`, `io_uring_enter`, `io_uring_register` | Supported; dedicated `src/arch/riscv64/` since 2023-08-23 | Not tested in upstream CI | Ships in Debian sid, Ubuntu 24.04, Arch Linux RISC-V | None open. Page-size bug fixed June 2026 (commit `284b1a8`) |
| Linux kernel headers (build-time) | `linux/io_uring.h`, `linux/fs.h`, `linux/time_types.h`, etc. | All headers present in mainline for riscv64; `compat.h` provides fallbacks for missing symbols across kernel versions | N/A | N/A | None |
| libbpf (optional) | BPF filter support; required only for `io_uring_bpf` operations | Fully supported; riscv64 mapped as `ARCH=riscv` in libbpf Makefile; Debian ships `libbpf1` and `libbpf-dev` for riscv64 at 2.14-1 | Tested via Debian builds | Debian sid 2.14-1 for riscv64 | None |
| GCC cross-toolchain (`gcc-riscv64-linux-gnu`) | Cross-compilation in CI; any GCC supporting riscv64 ABI suffices for native builds | CI installs from Ubuntu 24.04 (GCC 13) | Build-only | N/A | None |
| nolibc (internal, optional) | Freestanding build mode (`CONFIG_NOLIBC=y`) eliminating libc dependency | Explicitly supported since 2023-08-23; `-lgcc` added to fix `__clzdi2` | Not runtime-tested in CI | Available in all liburing 2.5+ releases | None open |

**Recursive dependency analysis:** Not applicable. liburing has no JIT backend, no SIMD library dependency, no cryptographic library, and no compression library. Its entire dependency tree is: Linux kernel headers (build-time) and optionally libbpf.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Commit `284b1a8` | Page-size wrong on riscv64 (and aarch64) libc builds | Fixed in 2.15-rc1 (2026-06-09) | High -- caused wrong ring buffer offsets on non-4K-page kernels | Libc path in `src/arch/riscv64/lib.h` lacked `sysconf()` call; fixed by axboe. Ubuntu 24.04 (2.5-1build1) still carries the bug |
| [PR #1601](https://github.com/axboe/liburing/pull/1601) | Man page: document EAGAIN behavior for send/recv | Open (last activity 2026-06-21) | Low | Originally triggered by a real failure on a riscv64 box (Ceph/Seastar test suite); root cause is arch-independent O_NONBLOCK socket behavior, not riscv64-specific. PR reworked to document general EAGAIN/O_NONBLOCK semantics. No riscv64-specific code touched. |

**Open riscv64-specific issues:** Zero. GitHub issue searches for `riscv` and `riscv64` in `axboe/liburing` return no open issues.

**Correctness bugs:** The page-size bug (fixed June 2026) is the only correctness bug found. Its practical impact is limited to riscv64 systems running non-4K-page kernels (16K or 64K pages), which are uncommon in production but valid configurations. Users on Ubuntu 24.04 (package 2.5-1build1) are still exposed.

---

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found in any GitHub issue, PR discussion, or mailing list excerpt. The port was merged the day it was submitted with no resistance.

**Technical blockers:** None. The architecture is complete, upstream, and shipping in major Linux distributions.

**Organizational blockers:** None. Jens Axboe merged the port in under 24 hours and personally authored the follow-up page-size fix.

**Acceptance probability for future riscv64 work:** High. Given the zero-friction merge history and the maintainer's willingness to fix architecture-specific bugs (commit `284b1a8`), future riscv64 patches would face no apparent organizational resistance.

---

## 13. Investment Analysis

RISE has no involvement with liburing. The RISC-V port is complete and shipping. The remaining gaps are CI coverage and one distribution packaging version lag.

### 13.1 Functional Enablement

No functional work is needed. All io_uring opcodes are accessible on riscv64. The only outstanding functional issue (non-4K page-size bug) is fixed upstream in 2.15-rc1.

### 13.2 Performance Optimization

Data not available: no published benchmark data for liburing on riscv64 exists. liburing's architecture-specific code is limited to raw syscall dispatch (two inline-asm files), which is inherently minimal. There are no SIMD hot paths, no vectorizable loops, and no algorithmic components to optimize. Performance is determined by the Linux kernel's io_uring implementation, not the userspace library. Liburing-layer performance investment would yield negligible return.

### 13.3 CI/CD Infrastructure

The gap is real: riscv64 has no runtime test execution in upstream CI. A QEMU-based CI job would close this gap. RISE build farm hardware is an alternative if native riscv64 CI runners become available through RISE infrastructure.

Estimated effort: 1-2 person-weeks to add QEMU-based runtime test execution to the upstream CI, assuming upstream accepts the contribution (likely given the maintainer's receptiveness). This requires adding `qemu-user-static` to the CI runner and invoking the test suite via QEMU.

### 13.4 Ecosystem Enablement

The PyPI `liburing` package (a separate Python binding project) ships only an x86_64 manylinux wheel. There is no riscv64 wheel at any version. This is out of scope for liburing itself but is a gap for Python-based io_uring consumers on riscv64.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Update Ubuntu 24.04 package to 2.14+ to include page-size fix | 0.5 | Ubuntu / Canonical | High (correctness bug exposed on 16K/64K-page kernels) |
| CI/CD | Add QEMU-based runtime test job for riscv64 to upstream CI | 1-2 | Upstream contributor | Medium |
| CI/CD | Add riscv64 sanitizer builds (ASan/UBSan) to upstream CI | 1 | Upstream contributor | Low |
| Ecosystem | Build and publish riscv64 wheel for PyPI `liburing` Python binding | 2-3 | PyPI `liburing` maintainer | Low (Python binding is a separate project; liburing itself does not require it) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [axboe/liburing GitHub repository](https://github.com/axboe/liburing)
- [PR #928: .github: Add riscv64 build for GitHub bot](https://github.com/axboe/liburing/pull/928)
- [PR #930: Add nolibc riscv64 support](https://github.com/axboe/liburing/pull/930)
- [PR #931: github: update actions/checkout version v2 -> v3](https://github.com/axboe/liburing/pull/931)
- [PR #1601: man: document that send/recv can see -EAGAIN without MSG_DONTWAIT](https://github.com/axboe/liburing/pull/1601)
- [liburing CI workflow: .github/workflows/ci.yml](https://github.com/axboe/liburing/blob/master/.github/workflows/ci.yml)
- [liburing GitHub releases](https://github.com/axboe/liburing/releases)
- [Debian buildd status: liburing sid](https://buildd.debian.org/status/package.php?p=liburing&suite=sid)
- [Ubuntu packages: liburing2 Noble](https://packages.ubuntu.com/noble/liburing2)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/repo/extra/)
- [PyPI liburing package](https://pypi.org/project/liburing/)
- [RISE Project blog](https://riseproject.dev/blog)