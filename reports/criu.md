---
title: CRIU
categories:
  - containers
---

# CRIU
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for CRIU
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

CRIU (Checkpoint/Restore In Userspace) is a Linux utility that saves the state of a running process tree to disk and restores it later, on the same or different host. It is the foundational technology for live container migration, process snapshot, and incremental checkpoint in container runtimes (Podman, containerd, Kubernetes), HPC schedulers, and game streaming infrastructure. CRIU operates by injecting a parasite code blob into the target process via ptrace, capturing all kernel-visible state (memory maps, file descriptors, network sockets, signals, timers, credentials), serializing it to protobuf-encoded image files, and replaying the state sequence on restore.

**Governance:** CRIU has no foundation affiliation (not CNCF, not Linux Foundation). It operates as an informal community project using GitHub Issues, pull requests, and a mailing list. There is no TSC or steering committee. License is GPL v2 (core) and LGPL v2.1 (lib/).

**Corporate backing:** The maintainer list in the MAINTAINERS file as of the research date:

| Name | Role | Affiliation |
|------|------|-------------|
| Pavel Emelyanov | Chief maintainer | Virtuozzo |
| Andrey Vagin (avagin) | Core maintainer | Google |
| Adrian Reber | Maintainer | Red Hat |
| Pavel Tikhomirov | Maintainer | Virtuozzo |
| Radostin Stoyanov (rst0git) | Maintainer | Fedora Project |
| Mike Rapoport | Maintainer | kernel.org (IBM) |
| Dmitry Safonov | Maintainer | independent |
| Alexander Mikhalitsyn (mihalicyn) | Maintainer | independent |

Primary corporate sponsors are Virtuozzo (founding company, still active), Google (via avagin, driving Kubernetes C/R integration), and Red Hat (Adrian Reber, Podman/container integration). A Kubernetes Checkpoint/Restore Working Group was announced in January 2026, signaling growing Kubernetes ecosystem investment, but that is a Kubernetes SIG, not a CRIU governance body.

**Community stance on new ports:** The 14-month review cycle for the riscv64 port (PR [#2234](https://github.com/checkpoint-restore/criu/pull/2234) opened August 2023, merged October 2024) reflects thoroughness rather than hostility. Key blockers were a kernel ptrace bug requiring an upstream Linux fix and a hardware-specific MMU misconfiguration. The port shipped with dedicated CI from day one. avagin's merge comment was: "Thanks to all involved in this work. This is a great starting point." Community stance is welcoming to new architecture ports provided they include test coverage and CI.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Dec 18, 2021 | Issue [#1702](https://github.com/checkpoint-restore/criu/issues/1702) opened by rushi47 requesting RISC-V guidance | GitHub |
| Jan 2022 | mihalicyn provides detailed porting guide via issue comments; rushi47 begins compel work; early compile errors exposed (wrong `ARCH_RT_SIGRETURN` macro, aarch64 opcodes in `parasite-head.S`) | GitHub issue #1702 |
| Apr 2022 | Linker error (`cannot represent machine riscv64`) fixed by adding `OUTPUT_ARCH(riscv)` to `compel-pack.lds.S`; mihalicyn provides ELF relocation handling sample for `R_RISCV_BRANCH`, `R_RISCV_JAL`, `R_RISCV_CALL_PLT` | GitHub issue #1702 |
| Mar 2, 2023 | PRs [#1713](https://github.com/checkpoint-restore/criu/pull/1713) and [#1714](https://github.com/checkpoint-restore/criu/pull/1714) closed without merging; 14+ months of draft work by nirousseau and rushi47 abandoned after felicitia/mihalicyn coordinated a fresh effort | GitHub |
| Mar 14, 2023 | felicitia achieves first successful compel parasite injection under RISC-V QEMU; announces active porting group with mihalicyn | GitHub issue #1702 |
| Jul 7, 2023 | First indirect RISC-V reference merged: commit `b2d74fb` replaces `NR_fstat` with `NR_statx`, noting "modern architectures such as riscv and loongarch64 no longer support this syscall" | GitHub |
| Aug 1, 2023 | PR [#2234](https://github.com/checkpoint-restore/criu/pull/2234) opened by ancientmodern (Haorong Lu) with co-authors Yixue Zhao (felicitia), stove (Rivos Inc.), Cryolitia PukNgae; 7 commits, +2525/-16, 73 files; 454 zdtm tests, 6 failures on StarFive VisionFive 2 | GitHub |
| Aug 1, 2023 | ancientmodern identifies required Linux kernel ptrace/signal fix; patch later merged upstream as `torvalds/linux@ce4f78f` | GitHub PR #2234 |
| Oct 13, 2024 | Cryolitia rebases PR #2234 on CRIU v4.0; mihalicyn takes over final import | GitHub PR #2234 |
| Oct 23, 2024 | mihalicyn discovers `TASK_SIZE` SV48 hardcoding bug on StarFive VisionFive 2 (SV39 MMU): `Unable to unmap (0x3f7f610000-0x800000000000): -22`; decision to merge as-is and fix in follow-up | GitHub PR #2234 |
| Oct 27, 2024 | PR [#2234](https://github.com/checkpoint-restore/criu/pull/2234) merged by avagin into `criu-dev` | GitHub |
| Nov 17-21, 2024 | PR [#2518](https://github.com/checkpoint-restore/criu/pull/2518) by mihalicyn merged: fixes `compel_task_size()` to dynamically detect SV39/SV48/SV57 via `munmap` probing; tested on StarFive VisionFive 2 with SV39 | GitHub |
| Mar 25, 2025 | PR [#2631](https://github.com/checkpoint-restore/criu/pull/2631) merged: CRIU v4.1 released, nicknamed "CRISC-V" to highlight RISC-V as headline feature | GitHub |
| Mar 16-20, 2026 | PR [#2969](https://github.com/checkpoint-restore/criu/pull/2969) by shauryarane05 merged by rst0git: `criu-coredump` enabled on riscv64, adding `EM_RISCV`, `NT_PRSTATUS`/`NT_FPREGSET` register mapping | GitHub |

**Key contributors and orgs:**

- ancientmodern (Haorong Lu) -- primary port author; affiliation not stated in PR
- Yixue Zhao (felicitia) -- co-author; no affiliation stated
- stove -- co-author; Rivos Inc.
- Cryolitia PukNgae -- co-author, rebaser; PLCT Lab affiliation [NEEDS VERIFICATION]
- mihalicyn -- fixes and rebasing; independent
- avagin -- merge authority; Google

**Upstreaming status:** The port is fully upstream as of CRIU v4.1 (March 2025). No downstream carry patches are required.

---

## 3. Upstream Support Tier

CRIU has no documented formal tier policy. The following evidence characterizes the effective tier for riscv64:

- **CI inclusion:** `riscv64-stable-cross` is listed in `STABLE_CROSS_ARCHES` in `scripts/build/Makefile`, not in `UNSTABLE_CROSS_ARCHES`. It is a stable cross-compile target, tested on every push/PR and daily.
- **Experimental flag:** In `.github/workflows/cross-compile.yml`, riscv64 is listed with `experimental: false`. Other architectures (armv7, aarch64, ppc64, mips64el) each have an `experimental: true` unstable variant in addition to their stable variant; riscv64 has only the stable variant.
- **Release status:** riscv64 was the headline feature of v4.1; the release PR was titled "CRISC-V."
- **Official binaries:** None distributed for any architecture via GitHub Releases (source-only releases). riscv64 is not disadvantaged relative to x86_64 on this criterion.
- **criu.org documentation:** The Supported Architectures page lists riscv as "In development." By contrast, aarch64, s390x, ppc64le, and loongarch are listed as "Maintained." [NEEDS VERIFICATION -- criu.org page was not directly fetched and confirmed during this research run.]

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Merged upstream | Yes | Yes | Yes (v4.1, Mar 2025) |
| CI cross-compile | Yes | Yes | Yes (stable, non-experimental) |
| CI native runtime | Yes | Yes | No |
| Official binary release | No (source only) | No (source only) | No (source only) |
| Debian binary package | Yes (stable) | Yes (stable) | sid/unstable only |
| criu.org tier | Maintained | Maintained | In development |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

CRIU's architecture-specific code lives in two trees: `criu/arch/riscv64/` and `compel/arch/riscv64/`. The compel library handles parasite injection (ptrace-based code injection into the target process); the criu arch tree handles register save/restore and vDSO patching.

**4.1 General-Purpose Register Save/Restore**

`criu/arch/riscv64/crtools.c` implements `save_task_regs()` which saves all 32 GPRs via ptrace into the protobuf `CoreEntry`, and `restore_gpregs()` which maps named registers to `__gregs[]` slots in `rt_sigframe`. Quality: functional. Structural parity with aarch64.

**4.2 Floating-Point Register Save/Restore (D extension)**

`criu/arch/riscv64/crtools.c` saves 32 FP registers and `fcsr` via `restore_fpu()` into `UserRiscv64DExtEntry`. `compel/arch/riscv64/src/lib/infect.c` captures FP state via `PTRACE_GETREGSET`/`PTRACE_SETREGSET` with `NT_PRFPREG`. Quality: functional. D-extension only.

**4.3 Vector (RVV) Register Save/Restore**

Not implemented. The `sigframe.h` comment in `compel/arch/riscv64/src/lib/include/uapi/asm/sigframe.h` explicitly notes the 4224-byte `__reserved` space in the kernel `sigcontext` is "enough to store the vector context whose VLENB is less or equal to 128," but CRIU does not checkpoint or restore vector register state. `sigreturn_prep_fpu_frame()` in `criu/arch/riscv64/sigframe.c` is a stub returning 0. There is no `NT_RISCV_VECTOR` note in the coredump generator. Any process using RVV will have its vector state corrupted on restore.

**4.4 vDSO Patching**

`criu/arch/riscv64/vdso-pie.c` (approximately 160 lines) implements `vdso_redirect_calls()` with RISC-V-specific instruction encoding using `riscv_b_imm()`, `riscv_j_imm()`, and related bit-field encoder utilities in `compel/arch/riscv64/src/lib/include/uapi/asm/instruction_formats.h`. Cache flushing uses `ecall` with `SYS_RISCV_FLUSH_ICACHE_ALL`. Quality: hand-tuned RISC-V assembly, functional.

`criu/arch/riscv64/vdso-lookup.S` implements VDSO symbol table lookup using `la`/`slli`/`ld`/`jr` instructions. Base RV64I only. Functional.

**4.5 Parasite Injection (compel)**

`compel/arch/riscv64/src/lib/infect.c` (~200 lines): syscall injection bytes encode `ecall` (`0x73,0x00,0x00,0x00`) and `ebreak` (`0x73,0x00,0x10,0x00`). `compel_syscall()` follows the RISC-V ABI (a7=syscall number, a0-a5=args). `compel_task_size()` probes the MMU mode (SV39/SV48/SV57) dynamically via `munmap`-based ceiling detection (same approach as aarch64 and ppc64le). One `TODO` in `arch_can_dump_task()`: the function returns `true` unconditionally rather than inspecting capabilities; this is cosmetic as aarch64 also returns true in practice. Quality: functional.

**4.6 CPU Feature Detection**

`criu/arch/riscv64/cpu.c` and `compel/arch/riscv64/src/lib/cpu.c` are stubs. All functions (`cpu_init`, `cpu_dump_cpuinfo`, `cpu_validate_cpuinfo`, `compel_set/clear/test_cpu_cap`, `compel_cpuid`) return 0 or `-ENOTSUP`. No ISA extension probing is implemented. This is structural parity with aarch64, but both are behind x86, where CPUID-based feature validation enables `--cpu-cap` migration safety checks.

**4.7 TLS and Thread Pointer**

`criu/arch/riscv64/include/asm/parasite.h` implements `arch_get_tls()` as a one-line inline wrapping `mv %0, tp`. `compel/arch/riscv64/src/lib/include/uapi/asm/restorer.h` implements `restore_tls()` as `mv tp, %0`. Functional.

**4.8 clone/clone3 Wrappers**

`RUN_CLONE_RESTORE_FN` and `RUN_CLONE3_RESTORE_FN` macros in `compel/arch/riscv64/src/lib/include/uapi/asm/restorer.h` provide full inline assembly for `clone` and `clone3` syscalls using RISC-V ABI register assignments. Functional.

**4.9 Syscall Emulation**

`compel/arch/riscv64/plugins/std/syscalls/syscall-aux.S` emulates legacy syscalls absent from riscv64: `sys_open` via `sys_openat`, `sys_mkdir` via `sys_mkdirat`, `sys_rmdir`/`sys_unlink` via `sys_unlinkat`. This handles the RISC-V kernel's deliberate omission of obsolete syscalls. Functional.

**Component quality matrix:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| GPR save/restore | Full | Full | Full |
| FPR save/restore | Full (x87/SSE) | Full (NEON) | Full (D ext) |
| Vector save/restore | Full (AVX-512) | Full (SVE) | Missing (RVV) |
| vDSO patching | Full | Full | Full |
| Parasite injection | Full | Full | Full (1 cosmetic TODO) |
| CPU feature validation | Full (CPUID) | Scalar stub | Scalar stub |
| TLS handling | Full | Full | Full |
| clone/clone3 | Full | Full | Full |
| Coredump generation | Full | Full | Full (since Mar 2026) |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CRIU uses a custom Make-based system called `nmk`. There are no CMakeLists.txt or autoconf files.

**Architecture detection:** `scripts/nmk/scripts/include.mk` normalizes `uname -m` output: the sed pattern `s/riscv64.*/riscv64/` maps `riscv64` (and any variant) to the canonical `riscv64` token. `ARCH=riscv64` triggers `DEFINES := -DCONFIG_RISCV64` in the top-level `Makefile`. No `ARCHCFLAGS` or `LDARCH` override is needed for riscv64; `LDARCH` defaults to `$(ARCH)`.

**Cross-compilation command:**

```
make ARCH=riscv64 CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc)
```

The CI Docker container (`scripts/build/Dockerfile.riscv64-stable-cross.hdr` + `.tmpl`) uses `FROM ubuntu:jammy`, sets `CROSS_TRIPLET=riscv64-linux-gnu`, installs `crossbuild-essential-riscv64` from `ports.ubuntu.com`, and runs:

```
make mrproper && make -j $(nproc) zdtm
```

The final build command `make zdtm` compiles the zdtm test suite binaries cross-compiled for riscv64; it does not execute them.

**Required cross packages** (from `contrib/dependencies/apt-cross-packages.sh`): `crossbuild-essential-riscv64`, `iproute2:riscv64`, `libaio-dev:riscv64`, `libbz2-dev:riscv64`, `libc6-riscv64-cross`, `libc6-dev-riscv64-cross`, `libcap-dev:riscv64`, `libdrm-dev:riscv64`, `libelf-dev:riscv64`, `libexpat1-dev:riscv64`, `libgnutls28-dev:riscv64`, `libnet-dev:riscv64`, `libnftables-dev:riscv64`, `libnl-3-dev:riscv64`, `libnl-route-3-dev:riscv64`, `libprotobuf-c-dev:riscv64`, `libprotobuf-dev:riscv64`, `libssl-dev:riscv64`, `libtraceevent-dev:riscv64`, `libtracefs-dev:riscv64`, `ncurses-dev:riscv64`, `uuid-dev:riscv64`. Native build tools: `build-essential`, `pkg-config`, `protobuf-c-compiler`, `protobuf-compiler`, `python3-protobuf`.

**Toolchain version:** The CI uses Ubuntu Jammy which ships GCC 11 and the `riscv64-linux-gnu-gcc` cross-compiler from the same release. No explicit minimum GCC version is stated in the build system. No Clang variant exists for riscv64 in the CI matrix (a `%-clang` rule exists for other architectures).

**QEMU usage:** None in the riscv64 build pipeline. The `riscv64-stable-cross` CI target is compile-only. Runtime testing requires physical hardware; the initial validation was performed on a StarFive VisionFive 2 board (mmu sv39, sifive,u74-mc).

**Known build issues:** Issue [#2714](https://github.com/checkpoint-restore/criu/issues/2714) (open, labeled stale): the riscv64-stable cross Dockerfile template includes `libnftables-dev:riscv64`, but the other architecture Dockerfiles (armv7, aarch64, ppc64, mips64el) were not updated consistently. This affects CRIU developers doing containerized cross-builds, not end users. No fix PR has been filed.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**6.1 Functional gaps**

- **RVV (Vector) register save/restore:** Processes that use RISC-V Vector extensions will have vector state corrupted on restore. The kernel sigcontext reserves 4224 bytes for vector state (sufficient for VLENB <= 128), but CRIU does not read or write those bytes. `sigreturn_prep_fpu_frame()` is a stub returning 0. This is a correctness bug for any workload using RVV intrinsics.

- **CPU feature migration validation (`--cpu-cap`):** The `cpu.c` implementation is a complete stub returning `-ENOTSUP`. Migration safety checks based on ISA extension presence are not enforced. A process checkpointed on a board with Zba/Zbb and restored on a board without those extensions will not be rejected by CRIU. This is a parity gap with x86 only; aarch64 has the same limitation.

- **`arch_can_dump_task()` check:** Returns `true` unconditionally instead of inspecting task capabilities. Cosmetic gap; same behavior as aarch64.

- **SV57 MMU dynamic detection:** `compel_task_size()` in PR [#2518](https://github.com/checkpoint-restore/criu/pull/2518) was written to probe SV39/SV48/SV57. SV57 hardware does not yet exist in mainstream deployments, but the code path is untested. Post-merge, avagin raised a concern about the `munmap`-based probe potentially unmapping useful pages and triggering SIGSEGV, noting the same concern exists for aarch64 and ppc64le. The proposed alternatives (madvise, mmap before munmap, or parsing `/proc/self/maps`) were left as future work [NEEDS VERIFICATION -- the concern was raised in PR #2518 comments; a fix has not been confirmed committed].

**6.2 Performance gaps**

No benchmark data comparing CRIU operation speed on riscv64 versus arm64 or amd64 exists in any public source as of the research date. Data not available: CRIU checkpoint latency (milliseconds per GB of process memory), restore latency, and throughput on riscv64 hardware.

**6.3 Security hardening gaps**

Data not available: no research on stack protector, ASLR effectiveness, or CFI coverage differences for riscv64 vs other architectures in CRIU.

**6.4 Floating-point correctness**

No NaN or floating-point correctness bugs reported for riscv64. PR [#2969](https://github.com/checkpoint-restore/criu/pull/2969) (coredump) added `NT_FPREGSET` register mapping for riscv64; PR review confirmed the ELF core files pass `readelf -a` with correct `NT_PRSTATUS` and `NT_FPREGSET` notes on a riscv64 QEMU VM.

**6.5 Feature comparison matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Process C/R (basic) | Yes | Yes | Yes |
| FPR save/restore | Yes | Yes | Yes (D ext) |
| Vector save/restore | Yes (AVX/AVX-512) | Yes (SVE/NEON) | No (RVV missing) |
| Coredump generation | Yes | Yes | Yes (since Mar 2026) |
| CPU migration check (`--cpu-cap`) | Yes | No (stub) | No (stub) |
| Network namespace C/R | Yes | Yes | Yes |
| Container (Podman/ctr) integration | Yes | Yes | Depends on container runtime stack |
| CUDA checkpoint | Yes | No | No |
| SV39/SV48/SV57 MMU detection | N/A | N/A | Yes (since Nov 2024) |

---

## 7. CI/CD Infrastructure

**7.1 Cross-compile CI (every push/PR)**

File: `.github/workflows/cross-compile.yml`
Runner: `ubuntu-latest` (x86_64)
Trigger: `push`, `pull_request`
Target: `riscv64-stable-cross` with `experimental: false`
Step: `sudo make -C scripts/ci riscv64-stable-cross`
What it does: builds CRIU and the zdtm test suite cross-compiled for riscv64 using `riscv64-linux-gnu-gcc`. Does not execute any test.

**7.2 Cross-compile daily CI**

File: `.github/workflows/cross-compile-daily.yml`
Runner: `ubuntu-latest` (x86_64)
Trigger: `schedule: cron: '30 12 * * *'`
Branches: `criu-dev` and `master`
Same `riscv64-stable-cross` target as above.

**7.3 No native riscv64 runtime CI**

There is no workflow that runs zdtm tests on riscv64 hardware or under QEMU emulation. The loongarch64 architecture has a QEMU-based test job (`loongarch64-qemu-test.yml`); no equivalent exists for riscv64. The 454-test zdtm run that validated the port (6 failures) was performed manually on a StarFive VisionFive 2 prior to PR [#2234](https://github.com/checkpoint-restore/criu/pull/2234) merge. There is no automated regression test for riscv64.

**7.4 RISE runners**

CRIU is not listed among adopters of the RISE Project's free native riscv64 GitHub Actions runners (launched March 2026, processing approximately 445 jobs/day across 197 repos as of May 2026). No CRIU workflow uses a `runs-on: ubuntu-24.04-riscv64` runner or equivalent.

**CI comparison table:**

| CI type | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Cross-compile (every PR) | Yes | Yes | Yes (stable) |
| Cross-compile (daily) | Yes | Yes | Yes |
| Native runtime tests | Yes | Yes | No |
| QEMU-based tests | N/A | Yes | No |
| RISE native runner | N/A | No | No |

---

## 8. Distribution and Release Status

**GitHub Releases:** CRIU does not ship pre-built binaries for any architecture via GitHub Releases. All releases (including v4.1 "CRISC-V" and v4.2) expose only two assets: a `.zip` and a `.tar.gz` source archive. riscv64 is not disadvantaged relative to x86_64 on this criterion -- no pre-built binaries exist for any architecture.

**PyPI:** HTTP 404 for any `criu` package on PyPI. No wheel exists for any architecture. The Python bindings (`pycriu`) are distributed as part of the source tree only.

**Debian:** `criu` (v4.2-4) is present in Debian sid (unstable) for riscv64, arm64, amd64, ppc64el, and s390x. Debian buildd host `rv-manda-02` shows status "Installed" for riscv64, built approximately 37 days before the research date. The package does not exist in Debian stable (bookworm) or testing for riscv64. Ubuntu 24.04 (Noble) does not carry a `criu` binary package for any architecture.

**ArchPOWER riscv64:** Version 4.0 is available according to Repology. This is two major releases behind current v4.2 and predates the riscv64 port [NEEDS VERIFICATION -- `archriscv.felixc.at` was unreachable during the research run; Repology was the sole source].

**Fedora riscv64:** Not confirmed. The Fedora package tracker and Koji build history were inaccessible during the research run (blocked by Anubis bot protection). Data not available.

**Practical installation path for a user wanting CRIU on riscv64:**
1. Build from source using the cross-compilation toolchain above, or
2. Use Debian sid (not production-stable), or
3. Use ArchPOWER riscv64 (v4.0, stale, unverified).

There is no straightforward production-grade binary distribution for riscv64.

---

## 9. Dependencies

All required and optional CRIU dependencies ship riscv64 packages in Debian trixie (sid/unstable).

| Dependency | Role | Required | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|----------|---------------|--------------|-----------------|-----------------|
| protobuf-c (`libprotobuf-c-dev`) | Checkpoint image serialization | Required | Yes | Emulated CI via `run-on-arch-action` (PR [#754](https://github.com/protobuf-c/protobuf-c/pull/754), merged Jan 2025) | Debian trixie: v1.5.1-1 for riscv64 | None. Note: Google does not ship riscv64 `protoc` prebuilt binary; Debian packages `protobuf-compiler` for riscv64, which is sufficient for distro builds |
| protobuf (`protoc` compiler) | Build-time code generation | Required (build-time) | Library builds; `protoc` binary not officially released by Google for riscv64 | N/A | `protobuf-compiler` riscv64 in Debian | No blocker for distro builds; Google upstream does not ship riscv64 `protoc` (multiple contributor PRs closed unmerged) |
| libnl-3 (`libnl-3-dev`) | Netlink communication for network namespace C/R | Required | Yes | No riscv64 CI in upstream | Debian trixie: v3.7.0-2 for riscv64 | None |
| libnet (`libnet1-dev`) | Raw packet injection | Required | Yes | No riscv64 CI | Debian trixie: v1.3+dfsg-2 for riscv64 | None |
| libcap (`libcap-dev`) | POSIX capability management | Required | Yes | No riscv64 CI | Debian trixie: v2.75-10+deb13u1+b1 for riscv64 | None |
| libuuid (`uuid-dev`) | UUID generation | Required | Yes | Standard libc | Debian trixie: v2.41-5 for riscv64 | None |
| GnuTLS (`libgnutls28-dev`) | TLS for remote C/R | Optional | Yes | Standard | Debian trixie: v3.8.9-3+deb13u4 for riscv64 | None |
| libnftables (`libnftables-dev`) | nftables rule C/R | Optional | Yes | No riscv64-specific CI | Debian trixie: v1.1.3-1 for riscv64 | Issue [#2714](https://github.com/checkpoint-restore/criu/issues/2714): CRIU's own Docker cross-build templates inconsistently include this package; affects developers only |
| libbpf (`libbpf-dev`) | BPF-based network filtering | Optional | Yes | No explicit riscv64 CI | Debian trixie: v1:1.5.0-3 for riscv64 | BPF CO-RE on riscv64 requires `CONFIG_DEBUG_INFO_BTF=y` and pahole 1.16+; no blocker |
| libselinux (`libselinux1-dev`) | SELinux context preservation | Optional | Yes | No riscv64 CI | Debian trixie: v3.8.1-1 for riscv64 | None |
| libdrm (`libdrm-dev`) | AMD GPU memory C/R plugin | Optional | Yes | N/A | Debian trixie: v2.4.124-2 for riscv64 | AMD GPU on riscv64 hardware is uncommon |
| compel (internal) | Parasite injection engine | Bundled | Yes (`compel/arch/riscv64/` in-tree) | Covered by CRIU cross-compile CI | N/A | None |

No dependency in this list is a hard blocker for riscv64 deployment from source or Debian sid.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1702](https://github.com/checkpoint-restore/criu/issues/1702) | Support for RISC-V | Open | Low (tracker only) | Original Dec 2021 tracking issue; substantive work is complete via PRs #2234/#2518/#2969. Remains open as a catch-all for remaining gaps. Assigned to felicitia and mihalicyn. |
| [#2433](https://github.com/checkpoint-restore/criu/issues/2433) | Enable coredump generation for all supported architectures | Open | Low | Filed Jul 2024 for aarch64/arm/loongarch64/mips/ppc64. riscv64 coredump support added in PR #2969 (Mar 2026) and is no longer a gap. Remaining architectures still need coredump support but that is not riscv64-specific. |
| [#2714](https://github.com/checkpoint-restore/criu/issues/2714) | Debian cross Dockerfiles missing libnftables-dev for non-riscv64 arches | Open (stale label) | Low | Cosmetic build tooling inconsistency. No maintainer response. No fix PR filed. Does not affect end users. |

**Resolved correctness bugs from the port:**

| Bug | Description | Resolution |
|-----|-------------|------------|
| TASK_SIZE SV48 hardcoding | `TASK_SIZE = 0x800000000000UL` hardcoded for SV48 MMU broke SV39 hardware (StarFive VisionFive 2) with `Unable to unmap: -22` | Fixed in PR [#2518](https://github.com/checkpoint-restore/criu/pull/2518) (Nov 2024): dynamic `compel_task_size()` probing SV39/SV48/SV57 |
| Linux kernel ptrace/signal restart bug | `arch_do_signal_or_restart()` handled syscall restart before ptrace-stop register observation; CRIU parasite injection was affected on kernels <= 6.4 | Upstreamed to Linux as `torvalds/linux@ce4f78f`; requires kernel 6.12-rc7 or later |
| `__builtin_ffs` link failure | GCC's `__builtin_ffs` caused riscv64 link failures | Fixed in PR #2234 |
| `AT_VECTOR_SIZE` mismatch | `zdtm/static/cmdlinenv00` failed; correct value for riscv64 Linux is 64 | Fixed in PR #2234 |

**Active correctness concern (unresolved):**

`munmap`-based TASK_SIZE probe in `compel_task_size()` may unmap useful pages and trigger SIGSEGV. Raised by avagin post-merge of PR #2518. Proposed alternatives (madvise, mmap before munmap, parsing `/proc/self/maps`) were left as future work. Same latent issue exists for aarch64 and ppc64le. Not tracked as an open issue.

**Critical functional gap (no issue filed):**

RVV vector register save/restore is not implemented. No open issue tracks this gap in `checkpoint-restore/criu`. Processes using RVV will have vector state silently corrupted on restore.

---

## 12. Objections and Upstream Blockers

**No stated objections.** The maintainer stance is welcoming. avagin's merge comment ("great starting point") and the "CRISC-V" release naming indicate positive disposition.

**Technical blockers resolved:**
- Kernel ptrace bug: resolved upstream (`torvalds/linux@ce4f78f`).
- TASK_SIZE MMU detection: resolved (PR #2518).

**Remaining technical gaps:**
- **RVV save/restore:** Requires implementing vector context save/restore using the 4224-byte `__reserved` field already present in the kernel sigcontext. No upstream opposition is anticipated; the sigcontext reservation was explicitly designed for this. Work is unstarted and no issue tracks it.
- **CPU feature migration validation:** Requires ISA extension probing infrastructure analogous to x86 CPUID. No upstream opposition anticipated; aarch64 has the same gap and it is considered acceptable.
- **Native runtime CI:** Adoption of RISE native riscv64 GitHub Actions runners would enable automated zdtm test execution. RISE runners are free for open-source projects. No upstream opposition; purely an infrastructure addition.

**Kernel version requirement:** The riscv64 port requires Linux 6.12-rc7 or newer (for the `ce4f78f` ptrace fix). Older kernels will produce CRIU failures during parasite injection. This is a hard deployment constraint on riscv64.

---

## 13. Investment Analysis

**RISE involvement:** CRIU is not a RISE funded project. RISE has not published any blog posts, RFPs, or working group assignments related to CRIU as of June 2026. No work has been pre-covered by RISE for this project.

### 13.1 Functional Enablement

The RVV vector register gap is the highest-priority functional item. Any workload using RISC-V Vector instructions (linear algebra, media, inference) will produce a corrupt restore. This affects CRIU's value proposition in HPC and AI inference deployment scenarios on riscv64 hardware. The kernel sigcontext already reserves the correct buffer; the CRIU implementation simply does not read or write it. The aarch64 SVE implementation is the correct reference.

The CPU feature validation gap (`--cpu-cap`) is lower priority; it is a safety check that x86 users rely on for migration across heterogeneous hardware. On riscv64 the absence of this check means migration from a board with Zba/Zbb to one without is silently permitted. Implementing ISA extension probing via `/proc/cpuinfo` parsing or `getauxval(AT_HWCAP)` is a bounded task.

### 13.2 Performance Optimization

No benchmark data exists. Data not available: checkpoint latency, restore latency, memory overhead on riscv64 hardware. Performance optimization work cannot be sized without establishing a baseline. The first step is running the full zdtm suite on riscv64 hardware and profiling checkpoint/restore latency for representative workloads.

### 13.3 CI/CD Infrastructure

Enabling RISE native riscv64 runners in the CRIU GitHub Actions workflow would close the native runtime CI gap. This is a configuration change (adding a `runs-on: ubuntu-24.04-riscv64` job using existing zdtm infrastructure), not a code change. RISE runner onboarding is self-service for open-source projects. The zdtm suite currently has 6 known failures on riscv64 from the Oct 2024 manual run; those would need investigation before the CI job can be marked required.

### 13.4 Ecosystem Enablement

CRIU has no significant package ecosystem of plugins or extensions requiring separate riscv64 enablement. Section 10 is omitted per the formatting rules.

The critical downstream enabler is container runtime integration. CRIU's riscv64 support is a prerequisite for live container migration in Podman and containerd on riscv64. Container runtime integration testing on riscv64 is the logical follow-on once CRIU itself is stable, but that work is outside the CRIU repository scope.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | RVV vector register save/restore | 4-6 | CRIU community / Rivos | Critical |
| Functional | CPU feature migration validation (`--cpu-cap`) | 2-3 | CRIU community | Medium |
| Functional | `munmap`-based TASK_SIZE probe safety fix | 1 | CRIU community | Medium |
| CI/CD | Enable RISE native riscv64 runtime CI (zdtm execution) | 1 | CRIU community / RISE | High |
| CI/CD | Investigate and fix 6 zdtm test failures from Oct 2024 run | 2-3 | CRIU community | High |
| Functional | Issue #2714 fix (libnftables-dev in cross Dockerfiles) | 0.5 | Any contributor | Low |
| Distribution | Push riscv64 binary to Debian testing/stable | 0 (Debian packaging, no CRIU code) | Debian maintainer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #1702: Support for RISC-V (open tracker)](https://github.com/checkpoint-restore/criu/issues/1702)
- [Issue #2433: Enable coredump generation for all supported architectures](https://github.com/checkpoint-restore/criu/issues/2433)
- [Issue #2714: Debian cross Dockerfiles missing libnftables-dev for riscv64-stable](https://github.com/checkpoint-restore/criu/issues/2714)
- [PR #1713: DRAFT: RISCV64 (closed unmerged)](https://github.com/checkpoint-restore/criu/pull/1713)
- [PR #1714: DRAFT: RISCV64_support (closed unmerged)](https://github.com/checkpoint-restore/criu/pull/1714)
- [PR #2234: port to riscv64 (merged Oct 27, 2024)](https://github.com/checkpoint-restore/criu/pull/2234)
- [PR #2518: RISC-V port fixes (part I) (merged Nov 21, 2024)](https://github.com/checkpoint-restore/criu/pull/2518)
- [PR #2631: criu: Version 4.1 CRISC-V (merged Mar 25, 2025)](https://github.com/checkpoint-restore/criu/pull/2631)
- [PR #2969: coredump: enable coredump generation on riscv64 (merged Mar 20, 2026)](https://github.com/checkpoint-restore/criu/pull/2969)
- [CRIU GitHub repository](https://github.com/checkpoint-restore/criu)
- [CRIU homepage](https://criu.org/)
- [Debian sid package: criu 4.2-4 riscv64](https://packages.debian.org/sid/criu)
- [Repology: criu across distributions](https://repology.org/project/criu/versions)
- [RISE Project blog (no CRIU entries)](https://riseproject.dev/blog)
- [RISE native riscv64 GitHub Actions runners](https://riseproject.dev)