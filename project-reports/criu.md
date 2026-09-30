---
title: CRIU
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: build-dependency
    criticality: critical
  - name: protobuf-c
    relation: runtime-dependency
    criticality: critical
  - name: libnl
    relation: runtime-dependency
    criticality: critical
  - name: libnet
    relation: runtime-dependency
    criticality: critical
  - name: libcap
    relation: runtime-dependency
    criticality: critical
  - name: UUID library
    relation: runtime-dependency
    criticality: critical
  - name: GnuTLS
    relation: runtime-dependency
    criticality: optional
  - name: libnftables
    relation: runtime-dependency
    criticality: optional
  - name: libbpf
    relation: runtime-dependency
    criticality: optional
  - name: libselinux
    relation: runtime-dependency
    criticality: optional
  - name: libdrm
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="criu" %}

# CRIU

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for CRIU<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION]. Where sources in this research disagree, both are cited and the discrepancy is noted explicitly.<br/>

## 1. Project Overview

CRIU (Checkpoint/Restore In Userspace) is a Linux utility that saves the state of a running process tree to disk and restores it later, on the same or a different host. It is the foundational technology behind live container migration, process snapshotting, and incremental checkpoint support in container runtimes (Podman, containerd, crun, Kubernetes), HPC schedulers, and game-streaming infrastructure. CRIU operates by injecting a parasite code blob into the target process via ptrace, capturing all kernel-visible state (memory maps, file descriptors, network sockets, signals, timers, credentials), serializing it to protobuf-encoded image files, and replaying the state sequence on restore.

**Governance:** CRIU is an independent, community-run project with no foundation affiliation (not CNCF, not Linux Foundation as a member project). It is hosted on GitHub under the `checkpoint-restore` org and documented on the MediaWiki site [criu.org](https://criu.org/), governed by its own `MAINTAINERS` file and `MAINTAINERS_GUIDE.md` rather than a foundation charter. The stated design philosophy is "the repository is the source of truth": anyone can submit and discuss changes, but only maintainers accept or decline them. Merging is a two-stage process - the `criu-dev` branch requires at least two maintainer approvals, and `master` requires majority approval. A Chief Maintainer, currently **Andrey Vagin** (avagin), holds veto power over both branches and over adding or removing maintainers.

**License:** GPLv2 for the core, LGPLv2.1 for `lib/`, and MIT/Expat for `images/`. The criu.org wiki content itself is licensed under GNU FDL 1.3.

**Current maintainers** (per the `MAINTAINERS` file): Andrey Vagin (Chief Maintainer, historically Google-affiliated), Mike Rapoport (IBM history, now kernel.org), Dmitry Safonov (Arista history), Adrian Reber (Red Hat), Pavel Tikhomirov (Virtuozzo), Radostin Stoyanov (Fedora/Red Hat), Alexander Mikhalitsyn (Virtuozzo, then Canonical, now FuturFusion.io), and Pavel Emelyanov (retired; ex-Virtuozzo/OpenVZ founder, no longer an active maintainer).

**Corporate backing:** Highest commit-volume contributing organizations, drawn from full commit history and the wiki's Community page: Virtuozzo (project originator and infrastructure), Red Hat (Adrian Reber, Radostin Stoyanov, historically Oleg Nesterov), Google, Canonical, IBM, Igalia, AMD, NVIDIA, Sony, CloudLinux, Acronis (sponsors student contributors), and minor contributions from Samsung/Huawei. A Kubernetes "Checkpoint/Restore Working Group" was announced in January 2026 (kubernetes.io blog); this is a Kubernetes/CNCF working group that CRIU participates in, not a CRIU governance body or foundation membership.

**Community stance on new ports:** Formally open - any contributor can submit a new architecture port, and it is reviewed like any other patch; there is no documented tiering or gatekeeping specific to new architectures. In practice, the riscv64 case shows that new-port patches can sit unmerged for well over a year while waiting for maintainer bandwidth to rebase and land them (the original draft attempts, PRs [#1713](https://github.com/checkpoint-restore/criu/pull/1713) and [#1714](https://github.com/checkpoint-restore/criu/pull/1714), sat open for over a year before being abandoned), but once merged the community - a mix of volunteer and corporate contributors including Red Hat, Canonical, and independent engineers - actively continues hardening the port (tests, coredump support, CI fixes). LoongArch followed a similar community-driven pattern. avagin's merge comment on the primary port PR was: "Thanks to all involved in this work. This is a great starting point."

**RISE involvement:** None found. This was checked exhaustively: the full RISE blog post sitemap (35 posts, 2024-05 through 2026-09, spot-checked including "RISE RISC-V Runners" announcements), the [riseproject.dev members page](https://riseproject.dev/members/) (Premier members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE), the [RISE Python wheel builder index](https://riseproject.gitlab.io/python/wheel_builder/), the `riseproject-dev` GitHub org (26 repos, no CRIU-related repo or search hit), and the `kernel-and-virtualization-wg` working group README (lists Linux kernel, KVM, other hypervisors, lldb, Valgrind - not CRIU). No RISE funding, RFP, blog coverage, or runner usage ties to CRIU.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Dec 18, 2021 | Issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702) opened by rushi47 requesting RISC-V guidance | GitHub |
| Dec 26-27, 2021 | Two independent draft attempts opened: PR [#1713](https://github.com/checkpoint-restore/criu/pull/1713) (nirousseau) and PR [#1714](https://github.com/checkpoint-restore/criu/pull/1714) (rushi47) | GitHub |
| Jan 2022 | mihalicyn provides porting guidance via issue comments, directing contributors to `compel` first: "if you get compel working it will be about 80% of all job" | GitHub issue #1702 |
| Mar 14, 2023 | felicitia (Yixue Zhao) achieves first successful compel parasite injection under RISC-V QEMU | GitHub issue #1702 |
| Mar 2, 2023 | PRs #1713 and #1714 closed without merging; draft work by nirousseau and rushi47 abandoned in favor of a fresh effort by ancientmodern/felicitia | GitHub |
| Jun 15-17, 2023 | PR [#2192](https://github.com/checkpoint-restore/criu/pull/2192) merged: fixes a pass/fail logic error in the `compel/test` fdspy helper, found while adding riscv64 support | GitHub |
| Aug 1, 2023 | PR [#2234](https://github.com/checkpoint-restore/criu/pull/2234) opened by ancientmodern (Haorong Lu), co-authored by Yixue Zhao and "stove" (Rivos Inc.); 2,525 additions / 16 deletions across 73 files; initial run: 454 zdtm tests, 6 failing, 46 skipped | GitHub |
| Aug 2-3, 2023 | PR [#2235](https://github.com/checkpoint-restore/criu/pull/2235) merged: fixes an AppArmor `sizeof(char*)` path-truncation bug on riscv64, spun off from #2234's `apparmor_stacking` test failure | GitHub |
| Aug 2023 | ancientmodern identifies a critical RISC-V kernel ptrace/syscall-restart bug affecting kernels <= 6.4; demo at [ancientmodern/riscv-ptrace-bug-demo](https://github.com/ancientmodern/riscv-ptrace-bug-demo); fix later upstreamed to Linux as `torvalds/linux@ce4f78f` | GitHub PR #2234 |
| Oct 13, 2023 | Contributor Cryolitia PukNgae rebases PR #2234 onto CRIU v4.0 with additional Arch Linux RISC-V build fixes (page_size return type, membarrier() syscall table entries, GCC `__builtin_ffs` workaround) | GitHub PR #2234 |
| Oct 23, 2024 | mihalicyn, testing on a StarFive VisionFive 2 board (SV39 MMU), discovers `TASK_SIZE` is hardcoded for SV48: `"Unable to unmap (0x3f7f610000-0x800000000000): -22"`; decision made to merge as-is and fix in a follow-up | GitHub PR #2234 |
| Oct 27, 2024 | PR #2234 merged by avagin into `criu-dev`: "Thanks to all involved in this work. This is a great starting point." | GitHub |
| Nov 17-21, 2024 | PR [#2518](https://github.com/checkpoint-restore/criu/pull/2518) by mihalicyn merged: `compel_task_size()` rewritten to dynamically probe MMU mode (SV39/SV48/SV57) via repeated `munmap()` calls from 1<<38 up to 1<<56, mirroring the approach used for aarch64/ppc64le; tested on StarFive VisionFive 2 | GitHub |
| Nov 21, 2024 | Post-merge, avagin flags an unresolved safety concern on PR #2518: "this munmap can unmap something useful and trigger sigsegv"; mihalicyn proposes future alternatives (madvise, mmap-before-munmap); avagin suggests reviewing gVisor's approach. Not resolved in a follow-up PR as of this research date | GitHub PR #2518 |
| Mar 25, 2025 | CRIU v4.1, nicknamed "CRISC-V" in its release PR, ships riscv64 support as the headline feature | GitHub release tag v4.1 (see Section 8 for a caveat on release-page evidence) |
| Mar 16-20, 2026 | PR [#2969](https://github.com/checkpoint-restore/criu/pull/2969) by shauryarane05, merged by rst0git: `criu-coredump` Python tool gains riscv64 support (`EM_RISCV`, GP/FP register mapping), verified by the author on a riscv64 guest VM with `readelf` confirming correct `NT_PRSTATUS`/`NT_FPREGSET` notes | GitHub |
| Jul 15-16, 2026 | PR [#3091](https://github.com/checkpoint-restore/criu/pull/3091) merged: removes an unneeded `ncurses-dev:riscv64` install step that was causing flaky riscv64 cross-compile CI | GitHub |
| Jul 9-16, 2026 | PR [#3085](https://github.com/checkpoint-restore/criu/pull/3085) merged: deduplicates the riscv64 cross-compile Dockerfile template, sharing it with other cross-compiled architectures and improving error reporting | GitHub |

**Key contributors and organizations:**

- Haorong Lu (ancientmodern) - primary port author; no corporate affiliation stated in the PR.
- Yixue Zhao (felicitia) - co-author, led early compel bring-up; no affiliation stated.
- "stove" - co-author; Rivos Inc. (RISC-V silicon startup).
- Cryolitia PukNgae - co-author/rebaser [NEEDS VERIFICATION on specific org affiliation].
- Alexander Mikhalitsyn (mihalicyn) - review, rebase, and the SV39/SV48/SV57 follow-up fix; Virtuozzo/Canonical/FuturFusion.io across the port's timeline.
- Andrey Vagin (avagin) - merge authority; Google (historically).
- shauryarane05 - riscv64 coredump support (PR #2969), community contributor.

**Upstreaming status:** The riscv64 port is fully merged upstream on `criu-dev` (confirmed via a full clone at HEAD `4485a86d`, dated 2026-09-30, with `git log --grep=riscv -i` showing all riscv64 content present). Issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702), the original tracking issue, remains open as a catch-all discussion thread despite the substantive port work being complete. No downstream carry patches are required.

---

## 3. Upstream Support Tier

CRIU has no documented formal architecture-tier system: there is no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` in the repository, and `docs/comparison-to-other-cr-projects.md` lists supported architectures as equals (x86_64, ARM, AArch64, PPC64, s390, MIPS, RISC-V, LoongArch) with no tiering language. New-architecture support goes through the same generic PR review and maintainer-approval process as any other change.

Effective-tier evidence for riscv64:

- **CI inclusion:** `riscv64-stable-cross` is one of four targets in the `STABLE_CROSS_ARCHES` / non-experimental matrix entry in `.github/workflows/ci.yml`'s `cross-compile` job (`experimental: false`), alongside `armv7-stable-cross`, `aarch64-stable-cross`, and `ppc64-stable-cross`. Unlike armv7, aarch64, and ppc64, riscv64 has **no** additional `experimental: true` "unstable" variant in the matrix - it exists only as a stable, non-tolerant-of-failure target.
- **Code maturity, by line/file count** (direct inspection of the clone at HEAD `4485a86`): `criu/arch/riscv64` is 16 files / 727 lines and `compel/arch/riscv64` is 20 files / 660 lines, versus aarch64's 19 files / 1,206 lines (criu) and 19 files / 792 lines (compel), and x86's 23 files / 2,863 lines (criu) and 22 files / 2,965 lines (compel). riscv64 is smaller mainly because x86 and aarch64 carry legacy 32-bit compat-mode code that riscv64 has no equivalent of by design, not because the port is incomplete. `compel/arch/riscv64` actually has more files than aarch64's, including a complete hand-built syscall-table generator (`gen-syscalls.pl`, `gen-sys-exec-tbl.pl`, `syscall.def`, `Makefile.syscalls`). TODO/FIXME/stub markers: riscv64 has 3, versus x86's 5 and aarch64's 5 - not more incomplete than the established ports by this metric.
- **Release status:** riscv64 was the headline feature of CRIU v4.1, whose release PR was titled "CRISC-V."
- **Official binaries:** Upstream publishes no GitHub Release binary assets for any architecture (see Section 8 for a caveat on conflicting evidence about whether GitHub Release objects exist at all). riscv64 is not disadvantaged relative to x86_64 on this criterion specifically.
- **criu.org documentation tier labels:** Not independently re-confirmed in this research pass [NEEDS VERIFICATION - the criu.org Supported Architectures page listing riscv as "In development" versus aarch64/s390x/ppc64le/loongarch as "Maintained," reported previously, was not re-fetched].

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Merged upstream | Yes | Yes | Yes (v4.1, Mar 2025) |
| CI cross-compile (stable, non-experimental) | Yes | Yes | Yes |
| CI native/emulated runtime test | Yes | Yes | No |
| Official binary release asset | No (source only / disputed, see Sec. 8) | No (source only / disputed, see Sec. 8) | No (source only / disputed, see Sec. 8) |
| Debian binary package | Yes | Yes | Yes (sid/forky, per Debian archive metadata) |
| Ubuntu binary package | Yes | Yes | Yes (26.04 "resolute," confirmed live) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

CRIU's architecture-specific code lives in `criu/arch/riscv64/`, `compel/arch/riscv64/`, `include/common/arch/riscv64/`, and `test/zdtm/lib/arch/riscv64/`. There is no `riscv32`/ilp32 support - the port targets riscv64 (LP64) only, on the RV64GC baseline (base integer + D/F float "G" extension bundle).

**4.1 General-Purpose Register Save/Restore**

`criu/arch/riscv64/crtools.c` (171 lines) implements `save_task_regs()`, saving all 31 GP registers (pc, ra, sp, gp, tp, t0-t6, s0-s11, a0-a7) via ptrace into the protobuf `CoreEntry`, and the corresponding restore path. `restore_nonsigframe_gpregs()` in `criu/arch/riscv64/restorer.c` (14 lines) is a no-op returning 0; this was verified by diffing against aarch64's identical implementation - both architectures restore GP registers via `sigreturn`, so the no-op is structurally correct, not an incomplete stub. Quality: functional, at parity with aarch64.

**4.2 Floating-Point Register Save/Restore (D extension)**

32 FP registers plus `fcsr` are saved/restored via ptrace (`NT_PRFPREG`) into `UserRiscv64DExtEntry`, mirrored exactly in `images/core-riscv64.proto`. Quality: functional, D-extension (double-precision) only.

**4.3 Vector (RVV) Register Save/Restore**

**Not implemented.** Confirmed by repository-wide code search: zero hits for `rvv` or `vfloat32m1_t`-style intrinsics anywhere in `checkpoint-restore/criu`. `compel/arch/riscv64/src/lib/include/uapi/asm/sigframe.h` contains commented-out kernel `sigcontext` structure fields whose comment explicitly describes "4K + 128 reserved for vector state" - i.e., the kernel ABI reserves space for RVV context, but CRIU's sigframe handling does not read or write it. `sigreturn_prep_fpu_frame_plain()` in `compel/arch/riscv64/src/lib/infect.c` is a no-op stub. No vector-register protobuf message type exists in `images/core-riscv64.proto`. **No GitHub issue tracks this gap.** Any process using RISC-V Vector instructions will have its vector register state silently corrupted on restore.

**4.4 vDSO Patching**

`criu/arch/riscv64/vdso-pie.c` (158 lines) implements VDSO trampoline relocation/patching using RISC-V-specific instruction-encoding helpers (`riscv_b_imm`, `riscv_j_imm`, etc., in `compel/arch/riscv64/src/lib/include/uapi/asm/instruction_formats.h`), and issues `SYS_RISCV_FLUSH_ICACHE_ALL` for icache coherence. `criu/arch/riscv64/vdso-lookup.S` (14 lines) provides the VDSO symbol jump table. Both are base-RV64I, hand-written, and complete.

**4.5 Parasite Injection (compel)**

`compel/arch/riscv64/src/lib/infect.c` (224 lines) injects raw `ecall`/`ebreak` syscall trampoline bytes and follows the RISC-V ABI (a7 = syscall number, a0-a5 = args). `compel_task_size()` dynamically probes the active MMU mode (SV39/SV48/SV57) via repeated `munmap()` calls doubling from 1<<38 up to 1<<56, replacing the SV48-hardcoded logic that shipped at initial merge (PR #2518, Nov 2024) - this is the same technique used for aarch64/ppc64le. An unresolved, maintainer-acknowledged safety concern remains open on this approach: `munmap`-based probing can theoretically unmap live memory and trigger a SIGSEGV, a concern avagin raised immediately after merging PR #2518 and which has not been closed out with a safer alternative (madvise, mmap-before-munmap, or `/proc/self/maps` parsing were all proposed but not implemented as of this research date). `handle-elf.c` dispatches to a complete `handle_elf_riscv64()` for ELF64 relocation handling, even though `compel/Makefile` sets `-DNO_RELOCS` for riscv64 (shared with arm/aarch64/loongarch64) - this reflects a shared build-time code path choice across those architectures, not a riscv64-specific deficiency.

**4.6 CPU Feature Detection**

`criu/arch/riscv64/cpu.c` and `compel/arch/riscv64/src/lib/cpu.c` are complete stubs: all functions (`cpu_init`, `cpu_dump_cpuinfo`, `cpu_validate_cpuinfo`, `compel_set/clear/test_cpu_cap`, `compel_cpuid`) return 0 or `-ENOTSUP`. No ISA-extension probing exists, so the `--cpu-cap` migration-safety check (verifying source and destination hardware expose the same ISA extensions) is not enforced on riscv64. This is structural parity with aarch64, which has the same gap; both lag x86's CPUID-based validation.

**4.7 TLS / Thread Pointer, clone/clone3, Syscall Emulation**

TLS handling (`mv tp, %0` / `mv %0, tp`), `clone`/`clone3` wrappers (`RUN_CLONE_RESTORE_FN`, `RUN_CLONE3_RESTORE_FN`), and legacy-syscall emulation (`sys_open` via `sys_openat`, etc., in `compel/arch/riscv64/plugins/std/syscalls/syscall-aux.S`, needed because the RISC-V kernel omits several legacy syscalls present on other architectures) are all implemented and functional.

**Component quality matrix:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| GPR save/restore | Full | Full | Full |
| FPR save/restore | Full (x87/SSE) | Full (NEON) | Full (D ext) |
| Vector save/restore | Full (AVX-512) | Full (SVE) | Missing (RVV, no tracking issue) |
| vDSO patching | Full | Full | Full |
| Parasite injection | Full | Full | Full (1 open safety concern on TASK_SIZE probe) |
| CPU feature validation | Full (CPUID) | Scalar stub | Scalar stub |
| TLS handling | Full | Full | Full |
| clone/clone3 | Full | Full | Full |
| Coredump generation | Full | Full | Full (since PR #2969, Mar 2026) |

---

## 5. Build System, Cross-Compilation, and Toolchain

CRIU has no CMake, autoconf, or any other generator-based build system - it is a plain GNU Makefile project using a custom build engine ("nmk," at `scripts/nmk/`). There is no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json` anywhere in the tree, and no `BUILDING.md`/`docs/cross-compilation.md`.

**Native build:**

```
make                      # produces ./criu/criu
make install               # DESTDIR=, PREFIX=, BINDIR=, SBINDIR=, MANDIR=, LIBDIR=
```

**Architecture wiring:** the top-level `Makefile` gates `ARCH` to a fixed set (`x86 arm aarch64 ppc64 s390 mips loongarch64 riscv64`) and errors on anything else; `ARCH=riscv64` triggers `-DCONFIG_RISCV64`. `compel/Makefile` adds `-DNO_RELOCS` for `arm|aarch64|loongarch64|riscv64`. `criu/pie/Makefile` and `Makefile.library` add `-fno-stack-protector` for `ARCH=riscv64` and add `vdso-lookup.o` to the restorer object list.

**Cross-compilation command:**

```
make ARCH=riscv64 CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc)
```

**How CI actually builds riscv64:** it is entirely Docker-driven, not a static Dockerfile - `scripts/build/Makefile` assembles `Dockerfile.riscv64-stable-cross` at build time by concatenating `Dockerfile.riscv64-stable-cross.hdr` + `Dockerfile.stable-cross.tmpl`. The assembled container: `FROM ubuntu:jammy`, sets `CROSS_TRIPLET=riscv64-linux-gnu`, pulls riscv64 packages from `ports.ubuntu.com/ubuntu-ports` (since riscv64 is not in Ubuntu's primary archive) via `scripts/ci/riscv64-cross/riscv64-sources.list`, sets `CC=/usr/bin/riscv64-linux-gnu-gcc` and related cross tool env vars, then runs `make mrproper && make -j$(nproc) && make -j$(nproc) zdtm`. The riscv64 build **explicitly skips** `amdgpu_plugin` (`if [ "$ARCH" != "riscv64" ]; then make amdgpu_plugin; fi`), meaning `libdrm` is not part of the riscv64 cross package set even though it is an optional CRIU dependency elsewhere (see Section 9).

**Required cross packages** (`contrib/dependencies/apt-cross-packages.sh`): `crossbuild-essential-riscv64`, `iproute2:riscv64`, `libaio-dev:riscv64`, `libbz2-dev:riscv64`, `libc6-riscv64-cross`, `libc6-dev-riscv64-cross`, `libcap-dev:riscv64`, `libdrm-dev:riscv64`, `libelf-dev:riscv64`, `libexpat1-dev:riscv64`, `libgnutls28-dev:riscv64`, `liblz4-dev:riscv64`, `libnet-dev:riscv64`, `libnftables-dev:riscv64`, `libnl-3-dev:riscv64`, `libnl-route-3-dev:riscv64`, `libprotobuf-c-dev:riscv64`, `libprotobuf-dev:riscv64`, `libssl-dev:riscv64`, `libtraceevent-dev:riscv64`, `libtracefs-dev:riscv64`, `uuid-dev:riscv64`, plus native `build-essential pkg-config git protobuf-c-compiler protobuf-compiler python3-protobuf`. PR #3091 (Jul 2026) removed an `ncurses-dev:riscv64` entry that had been causing flaky CI; PR #3085 (Jul 2026, same date) deduplicated the Dockerfile template across architectures.

**Toolchain version:** Ubuntu Jammy (22.04) ships GCC 11.x by default; that is what `crossbuild-essential-riscv64` resolves to in CI. No explicit GCC/Clang minimum is documented or enforced for riscv64 anywhere in the build system - the only riscv64-relevant compiler notes are build-flag workarounds (`-fno-stack-protector`, `-DNO_RELOCS`), not version floors. There is no Clang cross-compile variant for riscv64 in the CI matrix.

**Feature toggles:** `Makefile.config` auto-probes optional features via `pkg-config` against the target sysroot and silently disables them if absent (`NO_GNUTLS=1`, `NO_LZ4=1`, and similar auto-detection for libselinux, libbpf, libnftables). This matters for cross-compiling, since riscv64 dev headers are installed under `:riscv64`-suffixed package names.

**QEMU:** Not used anywhere in the riscv64 pipeline. CRIU has a dedicated `loongarch64-qemu-test` CI job that runs loongarch64 binaries under `qemu-user` and does execute tests - there is no riscv64 equivalent. The riscv64 CI target only cross-compiles CRIU and the zdtm test binaries; it never executes them. Real-hardware validation for the port itself was done manually on a StarFive VisionFive 2 board (SV39 MMU) prior to merge, and PLCT Lab offered further hardware access (HiFive Unmatched, LicheePi 4A, SG2042) for post-merge follow-up work.

**Known build issue:** Issue [#2714](https://github.com/checkpoint-restore/criu/issues/2714) ("All templates for Debian-based cross Dockerfiles but the riscv64-stable one are missing libnftables-dev") was **closed as "not planned"** (opened 2025-08-15) - it questioned why only the riscv64 cross Dockerfile template includes `libnftables-dev:riscv64` while other architectures' templates do not; no fix was pursued. This affects CRIU developers doing containerized cross-builds, not end users of the resulting binaries.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**6.1 Functional gaps**

- **RVV (Vector) register save/restore is unimplemented.** Any process using RISC-V Vector extension instructions will have corrupted vector state after a CRIU restore. The kernel ABI already reserves the necessary sigcontext space; CRIU simply does not use it. No GitHub issue tracks this gap as of the research date.
- **CPU feature migration validation (`--cpu-cap`) is a complete stub** (`-ENOTSUP` everywhere). A process checkpointed on a riscv64 board with Zba/Zbb and restored on a board lacking those extensions is not rejected by CRIU - this mirrors aarch64's identical gap, so it is not riscv64-specific, but it is behind x86's CPUID-based enforcement.
- **`munmap`-based TASK_SIZE/MMU-mode probe carries an open, maintainer-flagged safety concern.** avagin explicitly noted after merging PR #2518 that the probe "can unmap something useful and trigger sigsegv." Proposed safer alternatives (madvise, mmap-before-munmap, parsing `/proc/self/maps`, or following gVisor's approach) were discussed but not implemented as of this research date. SV57 hardware does not yet exist in mainstream deployment, so that code path in particular is effectively untested on real hardware.
- **`arch_can_dump_task()` returns `true` unconditionally** rather than inspecting task capabilities - cosmetic, same behavior as aarch64.

**6.2 Performance gaps**

No benchmark data comparing CRIU checkpoint/restore latency or throughput on riscv64 versus arm64 or amd64 exists in any source checked (GitHub issues/PRs, web search, RISE blog). Data not available: CRIU checkpoint latency (ms/GB of process memory), restore latency, and throughput on riscv64 hardware. General (non-riscv64) CRIU latency figures exist in unrelated x86-64 literature but are not comparable.

**6.3 Security hardening gaps**

Data not available: no research comparing stack-protector coverage, ASLR effectiveness, or CFI support for riscv64 versus other architectures within CRIU specifically (beyond the noted `-fno-stack-protector` flag applied to riscv64's PIE restorer blob, which is a deliberate build choice rather than a gap - the parasite/restorer blob is position-independent code that cannot rely on a stack canary in that context, matching the pattern used for other non-x86 architectures).

**6.4 Floating-point / NaN correctness**

No NaN or floating-point correctness bugs specific to riscv64 were found in any issue, PR, or code search. PR #2969 (coredump) added `NT_FPREGSET` register mapping for riscv64; the author's test evidence (reviewed and accepted by maintainers) showed `readelf -a` correctly reporting `NT_PRSTATUS` and `NT_FPREGSET` notes on a riscv64 QEMU VM.

**Feature comparison matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Process C/R (basic) | Yes | Yes | Yes |
| FPR save/restore | Yes | Yes | Yes (D ext) |
| Vector save/restore | Yes (AVX/AVX-512) | Yes (SVE/NEON) | No (RVV missing, untracked) |
| Coredump generation | Yes | Yes | Yes (since Mar 2026) |
| CPU migration check (`--cpu-cap`) | Yes | No (stub) | No (stub) |
| Network namespace C/R | Yes | Yes | Yes |
| SV39/SV48/SV57 MMU detection | N/A | N/A | Yes (dynamic probe, since Nov 2024, with an open safety concern) |

---

## 7. CI/CD Infrastructure

riscv64 CI exists, confirmed by direct inspection of all 8 workflow files in `.github/workflows/` (`check-commits.yml`, `ci.yml`, `codeql.yml`, `cross-compile-daily.yml`, `lint.yml`, `linux-next.yml`, `manage-labels.yml`, `stale.yml`; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repo). Exactly two files reference riscv64, both via the `riscv64-stable-cross` target name.

**7.1 `ci.yml`, job `cross-compile` (every push/PR)**

Trigger: `on: [push, pull_request]`. Runner: `ubuntu-latest` (x86_64). `riscv64-stable-cross` is part of a matrix with `experimental: false` alongside `armv7-stable-cross`, `aarch64-stable-cross`, `ppc64-stable-cross` - riscv64 has no additional experimental variant, unlike the other three. Step: `sudo make -C scripts/ci riscv64-stable-cross BUILD_OPTIONS="--build-arg CI_CROSS_COMPILE=1"`.

**7.2 `cross-compile-daily.yml` (scheduled)**

Trigger: `schedule: cron: '30 12 * * *'` (daily, 12:30 UTC) - not push/PR-triggered. Runner: `ubuntu-latest`. Matrix includes `riscv64-stable-cross` run against both `criu-dev` and `master` branches.

**7.3 What the riscv64 CI job actually does**

Both jobs cross-compile CRIU and the zdtm test suite using a `riscv64-linux-gnu-gcc` toolchain inside a Docker container on an x86 runner (`make mrproper && make -j$(nproc) && make -j$(nproc) zdtm`). **No step executes the resulting riscv64 binaries.** There is no `qemu` invocation anywhere in the riscv64 cross-compile path - contrast with the separate `loongarch64-qemu-test` job in `ci.yml`, which explicitly runs loongarch64 binaries under QEMU emulation and does execute tests. riscv64 has no equivalent runtime-test job.

**7.4 Native/RISE runner usage**

No workflow in this repository uses a RISE native riscv64 GitHub Actions runner (e.g., `runs-on: ubuntu-24.04-riscv64` or similar) or any riscv64-labeled self-hosted runner. CRIU is not an identified adopter of RISE's free native riscv64 runner program.

**CI comparison table:**

| CI type | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Cross-compile (every push/PR) | Yes | Yes | Yes (stable, non-experimental) |
| Cross-compile (daily scheduled) | Yes | Yes | Yes |
| Native runtime tests | Yes | Yes | No |
| QEMU-based runtime tests | N/A | N/A | No (loongarch64 has this; riscv64 does not) |
| RISE native runner | N/A | No | No |

---

## 8. Distribution and Release Status

**GitHub Releases - conflicting evidence, flagged explicitly:** One line of research cites [https://github.com/checkpoint-restore/criu/releases/tag/v4.1](https://github.com/checkpoint-restore/criu/releases/tag/v4.1) as the source for the v4.1 "CRISC-V" release date (2025-03-25) and its follow-up 4.1.1 point release (July 2025). A separate, directly executed check fetched [https://github.com/checkpoint-restore/criu/releases](https://github.com/checkpoint-restore/criu/releases) and found the page content to be "There aren't any releases here," concluding that **the project has no GitHub Releases at all**, for any architecture. These two findings are contradictory and were not reconciled in this research pass [NEEDS VERIFICATION]. The computed readiness grade for this report treats the release page as showing zero GitHub Releases and classifies the release provider as distro rather than upstream on that basis. Regardless of which finding is correct, no riscv64-specific binary release asset was found attached to any CRIU release by any research pass - the only confirmed riscv64 binaries come from distro packaging below.

**PyPI:** `https://pypi.org/pypi/criu/json` and `https://pypi.org/simple/criu/` both return HTTP 404; a search of `https://pypi.org/search/?q=criu` returns zero matching packages. **No PyPI package named `criu` exists at all**, on any architecture. The Python bindings that do exist (`pycriu`) are distributed only via distro packaging (`python3-pycriu`), not PyPI.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/criu/` returns a 302 redirect to the same (404) upstream PyPI URL - no `criu` package on the RISE wheel builder index, consistent with there being no upstream PyPI package to mirror.

**Ubuntu:** Confirmed live via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=CRIU&suite=resolute&searchon=names&section=all): Ubuntu 26.04 ("resolute") ships `criu` 4.2-1ubuntu2, `libcriu-dev` 4.2-1ubuntu2, and `libcriu2` 4.2-1ubuntu2 for riscv64 (alongside amd64, arm64, ppc64el, s390x). `crac-criu` 4.2.1-0ubuntu1~26.04 is amd64-only, no riscv64. `golang-github-checkpoint-restore-go-criu-dev` and `python3-pycriu` are architecture-independent packages, trivially installable on riscv64.

**Debian:** Debian's own archive-metadata tool (`dak ls`/madison) confirms `criu` 4.2.1-1 present for riscv64 in both `forky` and `sid` (unstable). Not present in Debian stable or testing for riscv64 as of the research date.

**Arch Linux RISC-V:** **Refuted.** A direct fetch of `archriscv.felixc.at`'s package-search page and a case-insensitive grep of the raw HTML for "criu" returned zero matches - no `criu` package is listed in the Arch Linux RISC-V repository. This contradicts an earlier characterization (sourced only from Repology, itself [NEEDS VERIFICATION]) that a stale v4.0 build was available there; the direct-fetch result is treated as authoritative.

**Fedora riscv64:** Data not available - the Fedora package tracker and Koji build history were inaccessible (blocked by bot protection) in every research pass.

**Practical installation path for a user wanting CRIU on riscv64:**
1. Install from Debian sid/forky or Ubuntu 26.04 ("resolute") - the only confirmed, directly-verified binary packages.
2. Build from source using the cross-compilation toolchain documented in Section 5.

There is no confirmed production-stable (non-rolling/non-unstable) binary distribution channel for riscv64 CRIU, and no PyPI or GitHub Release asset of any kind.

---

## 9. Dependencies

| Dependency | Role | Relation | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking Issues |
|------------|------|----------|--------------|----------------|----------------|-------------------|---------------------------|
| GCC | Compiler toolchain (`riscv64-linux-gnu-gcc`, via `crossbuild-essential-riscv64`) | Build-dependency | Critical | Yes (GCC 11.x, Ubuntu jammy default) | N/A | N/A | No explicit minimum version documented or enforced for riscv64; version is whatever the Jammy cross-toolchain package resolves to. |
| Protocol Buffers | `protoc` compiler for wire-format code generation | Build-dependency | Critical | Library builds for riscv64; Google does not officially ship a prebuilt riscv64 `protoc` binary | N/A | `protobuf-compiler` packaged for riscv64 in Debian, sufficient for distro builds | No blocker for distro/from-source builds; upstream Google release gap does not affect CRIU's own build path. |
| protobuf-c | Checkpoint image (de)serialization | Runtime-dependency | Critical | Yes | Emulated CI added via protobuf-c PR #754 (merged Jan 2025) | Debian trixie: v1.5.1-1 for riscv64 | None found. |
| libnl | Netlink communication for network-namespace C/R | Runtime-dependency | Critical | Yes | No dedicated riscv64 CI upstream | Debian trixie: v3.7.0-2 for riscv64 | None found. |
| libnet | Raw packet injection | Runtime-dependency | Critical | Yes | No dedicated riscv64 CI | Debian trixie: v1.3+dfsg-2 for riscv64 | None found. |
| libcap | POSIX capability management | Runtime-dependency | Critical | Yes | No dedicated riscv64 CI | Debian trixie: v2.75-10+deb13u1 for riscv64 | None found. |
| UUID library | UUID generation (`uuid-dev`/`libuuid`) | Runtime-dependency | Critical | Yes | Standard libc-adjacent | Debian trixie: v2.41-5 for riscv64 | None found. |
| GnuTLS | TLS for remote checkpoint/restore transport | Runtime-dependency | Optional | Yes | Standard | Debian trixie: v3.8.9-3+deb13u4 for riscv64 | No riscv64-specific issues found (GnuTLS's canonical repo is GitLab, so GitHub search coverage is a non-signal, not a clean bill of health). GnuTLS has no `project-reports/gnutls.md` entry in this ecosystem's tracking despite being a required build input - a documentation gap, not a technical one. |
| libnftables | nftables rule checkpoint/restore | Runtime-dependency | Optional | Yes | No riscv64-specific CI | Debian trixie: v1.1.3-1 for riscv64 | Issue #2714 (closed, not planned): CRIU's own riscv64 cross Dockerfile template inconsistently includes `libnftables-dev:riscv64` versus other architecture templates. Affects CRIU developers doing containerized builds, not end users. |
| libbpf | BPF program loading for network-filter checkpoint/restore | Runtime-dependency | Optional | Yes | No explicit riscv64 CI upstream, no known failures | Debian trixie: v1:1.5.0-3 for riscv64 | BPF CO-RE on riscv64 requires `CONFIG_DEBUG_INFO_BTF=y` and pahole 1.16+ in the target kernel; not a CRIU-specific blocker. |
| libselinux | SELinux context preservation | Runtime-dependency | Optional | Yes | No riscv64 CI | Debian trixie: v3.8.1-1 for riscv64 | None found. |
| libdrm | AMD GPU memory checkpoint/restore plugin (`amdgpu_plugin`) | Runtime-dependency | Optional | Packaged for riscv64 in Debian (v2.4.124-2), but CRIU's own riscv64 CI build explicitly **skips** `amdgpu_plugin` | N/A | Debian trixie: v2.4.124-2 for riscv64 | AMD GPU hardware is not currently present in the riscv64 ecosystem CRIU's CI targets; the plugin using this dependency is disabled for riscv64 builds by design. |
| LZ4 (indirect, via `CONFIG_LZ4`) | Compression backend for checkpoint images | Build/runtime-dependency (indirect, disable-able via `NO_LZ4=1`) | Optional | Yes | Not CRIU-specific, but upstream LZ4 has active RISC-V/RVV vectorization work in progress | Debian/Ubuntu package riscv64 | LZ4 upstream issue `lz4/lz4#1635` ("RISC-V Architecture Optimizations") closed Sep 2025, folded into individual merged/open PRs (#1648 merged, #1734/#1738/#1739 open) - active upstream engagement, no blocker to CRIU. |
| bzip2 / libbz2 (indirect, cross-build package list only) | Used only to shell out to the `bzip2` CLI for `make dist` release tarball creation; `libbz2-dev:riscv64` appears in the cross-package list but no CRIU C source includes `bzip2.h` | Build-dependency (weak/indirect) | Low | N/A to CRIU's own functionality | N/A | N/A | bzip2's canonical repo is `sourceware.org`, not GitHub, limiting issue-tracker visibility; the C code itself has no architecture-specific assembly or SIMD, effectively a non-issue for any architecture. |
| OpenSSL (indirect, cross-build package list only) | Appears only in `apt-cross-packages.sh`; no `openssl`/`libssl` reference found anywhere in CRIU's `.c`/`.h`/Makefiles | Build-dependency (unconfirmed, likely transitive) | Low | Unclear whether actually linked against CRIU on riscv64 | N/A | Packaged for riscv64 broadly | OpenSSL upstream has an active, longer-running riscv64 port (started Feb 2022) with several open riscv64-related issues (e.g., musl riscv-extension detection, AES `_zknd`/`_zkne` capability flags) - none of these affect CRIU since CRIU does not appear to actually link against OpenSSL. |
| compel (internal) | Parasite injection engine | Bundled/internal | Critical | Yes (`compel/arch/riscv64/` in-tree) | Covered by CRIU's own cross-compile CI | N/A | None. |

No dependency in this list is a hard blocker for riscv64 deployment from source, Debian sid/forky, or Ubuntu 26.04.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1702](https://github.com/checkpoint-restore/criu/issues/1702) | Support for RISC-V | Open | Low (tracker only) | Original Dec 2021 tracking issue; substantive work is complete via PRs #2234/#2518/#2969. Remains open as a catch-all discussion thread despite the port being functionally complete. Assignees: mihalicyn, felicitia. |
| [#2433](https://github.com/checkpoint-restore/criu/issues/2433) | Enable coredump generation for all supported architectures | Open | Low | Filed Jul 2024; does not name RISC-V directly. PR #2969 (Mar 2026) addressed riscv64 specifically and is no longer a gap for this architecture; other architectures remain open. |
| [#2714](https://github.com/checkpoint-restore/criu/issues/2714) | Debian-based cross Dockerfiles inconsistently include libnftables-dev | **Closed (not planned)**, opened 2025-08-15 | Low | Cosmetic build-tooling inconsistency in CRIU's own cross Dockerfile templates; no fix pursued. Does not affect end users. |

**Resolved correctness bugs from the port:**

| Bug | Description | Resolution |
|-----|-------------|------------|
| TASK_SIZE SV48 hardcoding | `TASK_SIZE = 0x800000000000UL` hardcoded for SV48 broke SV39 hardware (StarFive VisionFive 2): `"Unable to unmap: -22"` | Fixed in PR #2518 (Nov 2024): dynamic `compel_task_size()` probing SV39/SV48/SV57 via `munmap` |
| Linux kernel ptrace/signal-restart bug | RISC-V kernels <= 6.4 mishandled syscall restart relative to ptrace-stop register observation, breaking CRIU parasite injection | Fixed upstream in Linux as `torvalds/linux@ce4f78f` |
| `__builtin_ffs` link failure | GCC's `__builtin_ffs` caused riscv64 link failures | Fixed during PR #2234 rebase (Cryolitia) |
| `AT_VECTOR_SIZE` mismatch | `zdtm/static/cmdlinenv00` failed; correct riscv64 Linux value is 64 | Fixed during PR #2234 |
| AppArmor path truncation | `sizeof(path)` on a `char*` returned pointer size (8 bytes) instead of buffer size on riscv64, truncating AppArmor policy paths | Fixed in PR #2235 (Aug 2023): `PATH_MAX` used instead |

**Active, unresolved concerns:**

- **`munmap`-based TASK_SIZE probe safety.** Raised by avagin immediately after merging PR #2518: the probe "can unmap something useful and trigger sigsegv." No follow-up fix confirmed committed as of this research date; not tracked by a dedicated issue. The same latent technique is used for aarch64 and ppc64le, so this is not riscv64-unique, but it remains open specifically for riscv64's newly-added use of the pattern.
- **RVV vector register save/restore is unimplemented,** with no tracking issue filed. This is a correctness gap for any RVV workload.

---

## 12. Objections and Upstream Blockers

**No stated maintainer objections to RISC-V support.** The disposition is positive: avagin's merge comment ("great starting point") and the "CRISC-V" release naming both signal active maintainer enthusiasm rather than resistance.

**Technical blockers resolved:**
- Kernel ptrace/syscall-restart bug: resolved upstream (`torvalds/linux@ce4f78f`).
- TASK_SIZE/MMU-mode hardcoding: resolved via dynamic probing (PR #2518), though with the open safety concern noted above.

**Remaining technical gaps, with no stated upstream opposition to closing them:**
- **RVV save/restore:** would require implementing vector-context save/restore using the sigcontext reservation space the kernel ABI already provides. No indication of maintainer opposition; the work is simply unstarted and untracked by any issue.
- **CPU feature migration validation (`--cpu-cap`):** would require ISA-extension probing analogous to x86 CPUID; aarch64 has the identical gap and it has been accepted as a known limitation rather than a blocker.
- **Native/QEMU riscv64 runtime CI:** adopting either a RISE native riscv64 runner or a QEMU-based test job (as loongarch64 already has) would close the runtime-test gap. Purely an infrastructure addition; no code or policy blocker identified.

**Organizational/process observation:** the roughly 14-15 month span between PR #2234's initial submission (Aug 2023) and its merge (Oct 2024) reflects review bandwidth and the real technical blockers above (the kernel fix had to land upstream first), not policy resistance to new architectures - consistent with the earlier, ultimately-abandoned draft attempts (#1713, #1714) that also stalled for over a year for lack of maintainer bandwidth rather than rejection.

**Kernel version requirement:** the critical ptrace/syscall-restart fix (`torvalds/linux@ce4f78f`) is required for correct operation on kernels <= 6.4. Separately, during PR #2518's review, mihalicyn noted that kernel 6.12-rc7 resolved crashes observed in earlier testing of the TASK_SIZE follow-up work. The exact minimum supported kernel version for riscv64 is not clearly documented in one place upstream [NEEDS VERIFICATION].

---

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

Upstream CI builds riscv64 - the stable, non-experimental `riscv64-stable-cross` cross-compile target runs on every push/PR via [ci.yml](https://github.com/checkpoint-restore/criu/blob/master/.github/workflows/ci.yml) and daily via `cross-compile-daily.yml` - but only cross-compiles on x86 runners, with no test execution and no native or QEMU-based riscv64 runtime CI. Per the grading methodology's CI evidence rule, this caps the color at yellow regardless of the completed architecture port. Upstream publishes no release artifacts at all for any architecture (no GitHub Releases, source-only), so the only consumable riscv64 package comes from a distro - Debian sid/forky and, more strongly, Ubuntu 26.04 (`criu` 4.2-1ubuntu2, confirmed live on [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=CRIU&suite=resolute&searchon=names&section=all)) - which is why the release provider is distro rather than upstream.

This project is not an optimization-purpose project (no JIT, SIMD-dispatch, or numerics-kernel architecture that would call for an optimization-level rating), so no optimization-level rating applies.

**Pending work that could change the grade:**
- Tracking issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702) remains open as a catch-all discussion thread despite the port being functionally complete - closing it with a clear summary would not itself change the grade but would clean up the signal.
- An unresolved post-merge safety concern on the `munmap`-based TASK_SIZE/SV39-SV57 probe, raised by maintainer avagin after PR #2518, has not been addressed with a safer implementation.
- RVV vector-register save/restore is unimplemented - a correctness gap for any RVV workload, with no tracking issue filed.
- No native or QEMU-based riscv64 runtime CI exists upstream; adding one (via a RISE runner or a QEMU job analogous to `loongarch64-qemu-test`) is the single change most likely to promote this project past build-only.
- No RISE involvement of any kind was found for this project.

---

## 14. Investment Analysis

Before sizing any work: RISE has not funded, blogged about, or otherwise pre-covered any part of the CRIU riscv64 effort (see Section 1). Nothing below is already covered by RISE and none of it should be discounted on that basis.

### 14.1 Functional Enablement

The RVV vector register gap is the highest-priority functional item. Any workload using RISC-V Vector instructions (linear algebra, media processing, inference) will produce a corrupted restore. The kernel sigcontext already reserves the correct buffer for this; the CRIU implementation simply does not read or write it. The aarch64 SVE implementation is the natural reference for scope and approach.

The `munmap`-based TASK_SIZE probe safety concern is a smaller, well-scoped fix: replace the current probing technique with one of the alternatives maintainers already proposed (madvise, mmap-before-munmap, `/proc/self/maps` parsing, or gVisor's approach) to eliminate the acknowledged SIGSEGV risk.

The CPU feature validation gap (`--cpu-cap`) is lower priority; it is a safety check x86 users rely on for migration across heterogeneous hardware. On riscv64 its absence means migration from a board with Zba/Zbb to one without is silently permitted. Implementing ISA-extension probing via `/proc/cpuinfo` or `getauxval(AT_HWCAP)` parsing is a bounded task with a clear x86/aarch64 precedent to follow.

### 14.2 Performance Optimization

No benchmark data exists for CRIU on riscv64 anywhere. Data not available: checkpoint latency, restore latency, and memory overhead on riscv64 hardware. Performance work cannot be sized without a baseline; the first step is running the full zdtm suite on real riscv64 hardware (or a well-configured QEMU target) and profiling checkpoint/restore latency for representative workloads.

### 14.3 CI/CD Infrastructure

Enabling a RISE native riscv64 runner, or adding a QEMU-based test job mirroring the existing `loongarch64-qemu-test` job, would close the native-runtime CI gap. This is primarily a CI configuration change reusing existing zdtm infrastructure, not new product code. The historically-known zdtm failures from the pre-merge manual validation run (apparmor_stacking - already fixed via PR #2235; netns_lock_iptables, socket-tcp-closed-last-ack, socket-tcp-nfconntrack, socket-tcp-syn-sent, transition/maps007 - attributed by the port author to disabled kernel configs rather than RISC-V-specific bugs) would need re-verification before such a job could be marked required rather than advisory.

### 14.4 Ecosystem Enablement

Not applicable as a distinct workstream - CRIU has no significant dependent package ecosystem requiring separate riscv64 enablement (see Section 10 omission rationale). The practically relevant downstream enabler is container-runtime integration: CRIU's riscv64 support is a prerequisite for live container migration in Podman, containerd, and crun on riscv64 (crun already re-enabled RISC-V CRIU support as of crun 1.22). That integration testing is outside the CRIU repository's own scope.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|------------------------|-------|----------|
| Functional | RVV vector register save/restore | 4-6 | CRIU community / Rivos | Critical |
| Functional | `munmap`-based TASK_SIZE probe safety fix | 1 | CRIU community | High |
| CI/CD | Enable native or QEMU-based riscv64 runtime CI (zdtm execution) | 1-2 | CRIU community / RISE | High |
| CI/CD | Re-verify the 6 historically-known zdtm failures on current riscv64 hardware/kernel | 1-2 | CRIU community | Medium |
| Functional | CPU feature migration validation (`--cpu-cap`) for riscv64 | 2-3 | CRIU community | Medium |
| Governance | Close or narrow the scope of tracking issue #1702 now that the port is functionally complete | 0.5 | Any maintainer | Low |
| Distribution | Push riscv64 binaries to Debian testing/stable (packaging work, no CRIU code) | 0 (distro-side) | Debian maintainer | Low |

---

## 15. References

- [Issue #1702: Support for RISC-V (open tracker)](https://github.com/checkpoint-restore/criu/issues/1702)
- [Issue #2433: Enable coredump generation for all supported architectures](https://github.com/checkpoint-restore/criu/issues/2433)
- [Issue #2714: Debian cross Dockerfiles missing libnftables-dev for riscv64-stable (closed, not planned)](https://github.com/checkpoint-restore/criu/issues/2714)
- [PR #1713: DRAFT: RISCV64 (closed, unmerged)](https://github.com/checkpoint-restore/criu/pull/1713)
- [PR #1714: DRAFT: RISCV64_support (closed, unmerged)](https://github.com/checkpoint-restore/criu/pull/1714)
- [PR #2192: compel/test: fix success condition check in fdspy](https://github.com/checkpoint-restore/criu/pull/2192)
- [PR #2234: port to riscv64 (merged Oct 27, 2024)](https://github.com/checkpoint-restore/criu/pull/2234)
- [PR #2235: apparmor: fix incorrect usage of sizeof on char ptr (merged Aug 3, 2023)](https://github.com/checkpoint-restore/criu/pull/2235)
- [PR #2518: RISC-V port fixes (part I) (merged Nov 21, 2024)](https://github.com/checkpoint-restore/criu/pull/2518)
- [PR #2969: coredump: enable coredump generation on riscv64 (merged Mar 20, 2026)](https://github.com/checkpoint-restore/criu/pull/2969)
- [PR #3085: ci: improve cross-compilation Dockerfile maintainability and resilience (merged Jul 16, 2026)](https://github.com/checkpoint-restore/criu/pull/3085)
- [PR #3091: ci: skip ncurses installation for cross compile (merged Jul 16, 2026)](https://github.com/checkpoint-restore/criu/pull/3091)
- [CRIU v4.1 "CRISC-V" release tag (date/existence disputed, see Section 8)](https://github.com/checkpoint-restore/criu/releases/tag/v4.1)
- [CRIU GitHub repository](https://github.com/checkpoint-restore/criu)
- [CRIU GitHub Actions CI workflow (ci.yml)](https://github.com/checkpoint-restore/criu/blob/master/.github/workflows/ci.yml)
- [CRIU homepage](https://criu.org/)
- [Debian sid/forky package: criu (riscv64)](https://packages.debian.org/sid/criu)
- [Ubuntu 26.04 "resolute" package search: CRIU (riscv64)](https://packages.ubuntu.com/search?keywords=CRIU&suite=resolute&searchon=names&section=all)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog (no CRIU entries found)](https://riseproject.dev/blog)
- [RISE Python wheel builder index (no criu package)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISC-V ptrace bug demo (ancientmodern)](https://github.com/ancientmodern/riscv-ptrace-bug-demo)
- [ssrg-vt/criu-riscv (independent, separate early-stage fork)](https://github.com/ssrg-vt/criu-riscv)