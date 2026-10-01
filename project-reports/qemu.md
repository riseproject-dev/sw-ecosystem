---
title: QEMU
parent: Project Reports
color: yellow
dependencies:
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: Python
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: dtc
    relation: runtime-dependency
    criticality: critical
  - name: GLib
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: pixman
    relation: runtime-dependency
    criticality: critical
  - name: libslirp
    relation: runtime-dependency
    criticality: optional
  - name: libseccomp
    relation: runtime-dependency
    criticality: critical
  - name: GnuTLS
    relation: runtime-dependency
    criticality: optional
  - name: Nettle
    relation: runtime-dependency
    criticality: optional
  - name: libgcrypt
    relation: runtime-dependency
    criticality: optional
  - name: liburing
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: capstone
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: snappy
    relation: runtime-dependency
    criticality: optional
  - name: virglrenderer
    relation: runtime-dependency
    criticality: optional
  - name: spice-server
    relation: runtime-dependency
    criticality: optional
  - name: libusb
    relation: runtime-dependency
    criticality: optional
  - name: libssh
    relation: runtime-dependency
    criticality: optional
  - name: libpng
    relation: runtime-dependency
    criticality: optional
  - name: SDL2
    relation: runtime-dependency
    criticality: optional
  - name: GTK4
    relation: runtime-dependency
    criticality: optional
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="qemu" %}

# QEMU

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for QEMU<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

QEMU is a machine emulator and virtualizer supporting full system emulation (softmmu) and user-mode process emulation (linux-user). It is the de facto standard open-source emulator used for cross-architecture CI, OS bootstrapping, and embedded hardware prototyping. Development is hosted at [gitlab.com/qemu-project/qemu](https://gitlab.com/qemu-project/qemu); the GitHub repository at [github.com/qemu/qemu](https://github.com/qemu/qemu) is a read-only mirror. It hosts documentation files but has pull requests and issues disabled - a `.github/workflows/lockdown.yml` bot auto-closes any PR opened there and redirects contributors to GitLab.

**Governance.** QEMU is a member project of the [Software Freedom Conservancy](https://sfconservancy.org/) (SFC), which provides fiscal sponsorship, legal, and administrative support. There is no steering committee, board, bylaws, or formal voting process. Governance is informal and meritocratic: a small group of core maintainers plus per-subsystem maintainers listed in the [MAINTAINERS file](https://gitlab.com/qemu-project/qemu/-/blob/master/MAINTAINERS), with decisions made via patch review/consensus on the qemu-devel mailing list. License is GNU GPL v2 (or later) for the core, with other compatible licenses noted per-component in the LICENSE file.

The MAINTAINERS file defines a five-level status taxonomy applied per subsystem/target: **Supported** (someone is paid to look after it), **Maintained** (someone actively looks after it as a volunteer), **Odd Fixes** (has a maintainer but little active time), **Orphan** (no current maintainer), and **Obsolete** (replaced by newer code).

**Corporate involvement.** RISC-V-relevant MAINTAINERS entries: RISC-V TCG CPUs is **Supported** by Palmer Dabbelt and Alistair Francis (Western Digital), with reviewers Weiwei Li, Daniel Henrique Barboza (Qualcomm), Liu Zhiwei (Alibaba), and Chao Liu (ProcessMission). RISC-V Architecture Support is **Maintained** by Philippe Mathieu-Daude (Qualcomm). RISC-V XThead Extensions is **Supported** by Christoph Muellner and Liu Zhiwei. RISC-V XVentanaCondOps is **Maintained** by Philipp Tomsich (VRULL). Palmer Dabbelt's MAINTAINERS entry lists only a personal email with no corporate domain, though he has historically been affiliated with SiFive, Google, and Rivos [NEEDS VERIFICATION on current affiliation]. CI/infrastructure sponsors listed at [qemu.org/sponsors](https://www.qemu.org/) are AWS, DigitalOcean, Linaro, IBM (LinuxONE Community Cloud), Oregon State University Open Source Lab, GNOME (download hosting), and GitLab (open-source program); these sponsorships are not tiered or RISC-V-specific.

**RISE project membership.** QEMU is not listed as a RISE member project; the riseproject.dev home page names RISC-V International, Scaleway, OSU OSL, Linux Foundation, and Yocto Project as infrastructure partners, not QEMU. RISE organizes work into ten focus/working groups, one of which is Simulator/Emulators - QEMU work sits there, but QEMU itself is not a funded RISE deliverable (see Section 13 and 14).

**Community stance on new ports.** No formal written acceptance policy exists. The practical bar is high: a new architecture target requires a complete, well-reviewed patch series through the qemu-devel mailing list (git pull requests are disabled on GitLab and GitHub both - patches only), typically dozens of patches across many revisions, and critically a committed long-term maintainer willing to carry ongoing "Supported"/"Maintained" status. The LoongArch port is the closest recent precedent: proposed September 2021, reached v9 (31 patches) by December 2021, merged for QEMU 7.1 (August 2022), with Song Gao and Bibo Mao as ongoing maintainers. This shows openness to new ports conditioned on sustained maintainership, not a one-time code drop.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-01-03 to 2018-03-02 | Michael Clark's (SiFive) "RISC-V QEMU Port Submission" patch series posted to qemu-devel, reaching v8 | [patchew.org](https://patchew.org/QEMU/1519344729-73482-1-git-send-email-mjc@sifive.com/) |
| 2018-03-07 | MAINTAINERS entry for RISC-V merged (commit `4dc62b15323bb6338c4b426f76e92be5f87db8c`), authored by Michael Clark | [QEMU commit 4dc62b15](https://gitlab.com/qemu-project/qemu/-/commit/4dc62b15) |
| 2018-04 | QEMU 2.12.0 released - first official release containing the RISC-V target | GitLab tag history |
| 2024-04-23 | QEMU 9.0: Zacas, amocas, RVA22 profiles, Zaamo, Zalrsc, Ztso, SMBIOS, ACPI (SRAT, SLIT, AIA, PLIC) | [QEMU 9.0 changelog](https://wiki.qemu.org/ChangeLog/9.0) |
| 2024-09-03 | QEMU 9.1: Privileged spec v1.13, Zve32x, Zve64x, Zimop, Zcmop, Zama16b, Zabha, Zawrs, Smcntrpmf | [QEMU 9.1 changelog](https://wiki.qemu.org/ChangeLog/9.1) |
| 2024-12-11 | QEMU 9.2: IOMMU on virt machine, control-flow integrity, Svvptc, OpenTitan Zb*, vector ld/st performance work | [QEMU 9.2 changelog](https://wiki.qemu.org/ChangeLog/9.2) |
| 2025-04-23 | QEMU 10.0: riscv-iommu-sys devices, svukte, ssstateen, smrnmi, smdbltrp/ssdbltrp, supm/sspm, Ascalon and Xiangshan Nanhu CPU models | [QEMU 10.0 changelog](https://wiki.qemu.org/ChangeLog/10.0) |
| 2025-08-26 | QEMU 10.1: Ziccif, Svrsw60t59b, Kunminghu CPU and platform support | [QEMU 10.1 changelog](https://wiki.qemu.org/ChangeLog/10.1) |
| 2025-12 | QEMU 10.2: io_uring main-loop support, VFIO post-migration fixes, multiple RISC-V correctness fixes (control-flow integrity, configurable PMP granularity, timer/MMU fixes) | [linuxiac.com QEMU 10.2 coverage](https://linuxiac.com/qemu-10-2-expands-risc-v-powerpc-and-s390x-emulation-capabilities/) |
| 2026-04-22 | QEMU 11.0: Zilsd, Zclsd, Zalasr, Smpmpmt, CSR register visibility in `info registers` | [QEMU 11.0 changelog](https://wiki.qemu.org/ChangeLog/11.0) |
| 2026-06 | T-Head C908 CPU, K230 board, big-endian RISC-V support, PMA access-fault fix, mstatus.FS dirty-on-FP-exception fixes merged | [qemu/qemu commit history](https://github.com/qemu/qemu/commits/master) |
| 2026-08 | `[PATCH v11] target/riscv: Fix riscv64 KVM migration` merged to master (commits preserving vCPU privilege mode and mp_state across live migration), validated on native riscv64 KVM hardware with 4-vCPU, 24-hour sustained migration testing | [ratatoskr.run thread](https://ratatoskr.run/qemu-devel/2025/09/14395153/t) |

The RISC-V port originated as an out-of-tree fork (~2014-2016, contributors including Sagar Karandikar, Michael Clark, Bastian Koppelmann) before the 2018 upstream merge, and has been fully upstream since QEMU 2.12. RISE-funded QEMU work completed to date (per RISE's internal project tracking, cross-checked against release notes): **SE_01_001** - linux-user `riscv_hwprobe` syscall support (merged QEMU 8.1); **SE_01_017** - ACPI SPCR support for RISC-V (merged QEMU 10.0); **SE_01_021** - RVA23 profile support (merged QEMU 10.0); **EDK2_00_18** - RISC-V QEMU Server Reference Platform (firmware project, UEFI-side). Daniel Barboza (QEMU RISC-V/virtualization contributor since 2017, Qualcomm) was elected RISE Technical Lead for the Simulator/Emulator working group for 2026-2027, but his ongoing QEMU patch work (KVM-only CI job, `--disable-tcg` refactor) is tracked as individual contributor activity, not a line-itemed RISE deliverable.

## 3. Upstream Support Tier

Per the MAINTAINERS file, the RISC-V TCG target (`target/riscv`) is **Supported**, meaning a paid person is responsible for it. XThead extensions are also Supported; XVentana is Maintained (volunteer). The virt, sifive_u, and sifive_e machines are the primary Supported targets. The Shakti C machine was deprecated in May 2026, evidence of active curation rather than accretion.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MAINTAINERS tier | Supported | Supported | Supported |
| Release-blocking | Yes | Yes | Yes [NEEDS VERIFICATION - no explicit statement found] |
| Dedicated maintainer | Peter Maydell / core team | Peter Maydell + team | Palmer Dabbelt, Alistair Francis |
| Native CI runner | Yes (shared x86 runners) | Yes (`ubuntu-24.04-aarch64.yml` custom runner) | No |
| KVM CI job | Yes | Yes | Cross-build only (`cross-riscv64-kvm-only`, no execution) |
| check-tcg test execution in CI | Yes | Yes | Yes, via `build-some-softmmu` (riscv64-softmmu target) |
| Official upstream binaries | Source tarball only | Source tarball only | Source tarball only |
| Downstream packages | Debian, Fedora, Arch, Ubuntu | Debian, Fedora, Arch, Ubuntu | Ubuntu 26.04 resolute (ports), Debian sid, Arch RISC-V overlay (patched, one release behind) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

QEMU's RISC-V implementation spans guest emulation, a native JIT backend for riscv64 hosts, host-side feature detection, user-mode emulation, and a disassembler. This is an extensive, mature architecture-specific codebase, not a thin or stub port.

### 4.1 Guest CPU/Device Emulation (`target/riscv/`, `hw/riscv/`)

`target/riscv/` contains roughly 62 files (~1.24 MB), implementing all ratified RISC-V extensions current as of QEMU 11.0. Core files: `cpu.c`, `cpu.h`, `cpu_bits.h`, `translate.c` (1,505 lines, no TODOs or stubs found). Instruction decode tables: `insn16.decode`, `insn32.decode`, plus vendor-extension decode tables `xthead.decode`, `xmips.decode`, `xlrbr.decode`, `XVentanaCondOps.decode`. The `tcg/insn_trans/` subdirectory holds roughly 30 `trans_*.c.inc` files, one per extension group (RVI, RVM, RVA, RVF, RVD, RVH, RVB, RVV, RVK, Zc*, Zfa, Zfh, Zicbo, Zicond, Zimop, XThead*, XVentanaCondOps, and others). `vector_helper.c` (5,873 lines, 236 KB, the largest single file) and `vcrypto_helper.c`/`vector_internals.c` implement the RISC-V Vector (RVV) extension in scalar C with TCG IR, with no RVV C intrinsics anywhere in this tree - correct and complete but unable to exploit host RVV acceleration when QEMU itself runs on riscv64 hardware. A minor TODO exists in `csr.c` (6,795 lines) for RV128 SXL/MXL handling; it does not affect RV64 operation.

`hw/riscv/` (27-28 files, ~486 KB) covers board/SoC models: `virt.c` and `virt-acpi-build.c` (generic board, PCI/virtio/AIA/IOMMU/ACPI support, the primary development target), `spike.c`, `sifive_e.c`, `sifive_u.c`, `microchip_pfsoc.c`, `opentitan.c`, `shakti_c.c`, `k230.c` (added June 2026), `tt_atlantis.c`, `xiangshan_kmh.c`, `microblaze-v-generic.c`, `boston-aia.c`, plus `aia.c` (interrupt controller), `riscv-iommu*.c` (97 KB, spec-compliant with active development - 23 open conformance bugs as of this writing, Section 11), `riscv_hart.c`, `boot.c`, `numa.c`. ARM's `hw/arm/` has roughly 124 files / 2.13 MB; RISC-V board coverage is thinner by comparison but covers all development-relevant targets.

### 4.2 Native JIT Backend for riscv64 Hosts (`tcg/riscv64/`)

This is QEMU's TCG code generator for *running on* riscv64 as a host - a materially different capability from guest emulation. Files: `tcg-target.c.inc`, `tcg-target.h`, `tcg-target-has.h`, `tcg-target-con-set.h`, `tcg-target-con-str.h`, `tcg-target-mo.h`, `tcg-target-opc.h.inc`, totaling roughly 3,147-3,232 lines of hand-written machine-code emission using raw RISC-V opcode encodings, with its own register-allocator constraint tables. This is comparable in scale to x86_64 (4,599-4,657 lines), aarch64 (3,592-3,760 lines), s390x (3,909 lines), and ppc64 (4,410 lines), and is categorically different from - and far larger than - the generic interpreter fallback (`tcg/tci.c`, ~1,033 lines) QEMU uses for architectures with no real backend.

| Component | Status | Notes |
|---|---|---|
| Core TCG ops | Full | `tcg_out_op` covers all standard IR ops |
| i128 atomic load/store | Missing | `TCG_TARGET_HAS_qemu_ldst_i128 = 0`; x86_64 has this |
| Vector bitwise ops | Partial | `andc_vec`, `orc_vec`, `nand_vec`, `nor_vec` all unset |
| Host CPU feature detection | Present | `util/cpuinfo-riscv.c` and `host/include/riscv64/host/cpuinfo.h` detect Zba, Zbb, Zbs, Zicond, Zve64x at runtime |
| Zba/Zbb codegen | Present | Uses host Zba/Zbb instructions when available |

Supporting host-side code: `common-user/host/riscv64/safe-syscall.inc.S` (assembly trampoline for safe syscalls on riscv64 host), `linux-user/riscv/vdso.S` (vDSO assembly), and roughly 13 test assembly files under `tests/tcg/riscv64/*.S`.

### 4.3 KVM Backend (`target/riscv/kvm/`)

3 files, ~2,231 lines. Functional for basic KVM guest execution: 65+ ISA extensions synced via `KVM_GET/SET_ONE_REG`, AIA interrupt controller support, vector register sync with dynamic VLENB, SBI exit handling, and a KVM migration path recently fixed (see Section 2, v11 patch merged August 2026, correcting vCPU privilege mode and `mp_state` loss across migration).

Known stubs in `kvm-cpu.c`: `kvm_arch_insert_hw_breakpoint()` returns `-EINVAL`, `kvm_arch_remove_hw_breakpoint()` returns `-EINVAL`, `kvm_arch_remove_all_hw_breakpoints()` is an empty function. Hardware watchpoint/breakpoint support via KVM is completely absent. By contrast the x86_64 KVM backend (~20 files / 391 KB) has TDX, Xen emulation, and HyperV stubs; RISC-V has no equivalent advanced virtualization feature set.

| Backend | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TCG JIT backend | Full (~4,600 lines) | Full (~3,600-3,760 lines) | Partial (~3,147-3,232 lines; missing i128 atomics, 4 vector bitwise ops) |
| KVM support | Full + TDX + HyperV | Full | Partial (no hardware breakpoints/watchpoints) |
| Host SIMD use in TCG | AVX2/SSE4 | NEON | None (no RVV intrinsics used) |
| KVM migration correctness | Mature | Mature | Fixed Aug 2026 (vCPU priv mode + mp_state bug, merged after years in production use) |

### 4.4 Disassembler (`disas/riscv.c`)

Over 2,000 lines, full coverage of base ISA, V, Zb*, Zk*, Zvk*, Zicfiss, CMO, Zimop, Zcmop, Zawrs, BF16, Zacas, plus separate files for XThead, XVentana, and XLRBR vendor extensions (`riscv-xthead.c`, `riscv-xventana.c`, `riscv-xlrbr.c`). Capstone is used as an alternate disassembler backend and carries its own RISC-V support (Section 9.2); Capstone's RISC-V `arch/RISCV/` is auto-generated from `capstone-engine/llvm-capstone` (an LLVM-18 fork) via an Auto-Sync pipeline, with decoder and printer both marked complete.

### 4.5 User-Mode Emulation

`linux-user/riscv/` (20 files: `cpu_loop.c`, `elfload.c`, `signal.c`, `syscall.tbl`, target headers, vDSO build artifacts) and `bsd-user/riscv/` (13 files, *BSD user-mode emulation).

## 5. Build System, Cross-Compilation, and Toolchain

QEMU does not use CMake. The build is a three-stage pipeline: `./configure` (a POSIX-shell script that detects host arch, selects compilers, creates a Python venv, and invokes Meson) feeds **Meson**, which generates the build graph (feature-typed options set with `-Dname=enabled|disabled|auto`, not `-DUSE_X=OFF`), and **Make** wraps **Ninja** to drive the generated `build.ninja` plus firmware/test targets.

**Native build:**
```sh
./configure
make -j$(nproc)
```
Restricted to riscv64 only:
```sh
./configure --target-list=riscv64-softmmu,riscv64-linux-user
make -j$(nproc)
```

**Cross build (x86_64 host to riscv64 target), per CI:**

System emulation job (`cross-riscv64-system`, extends `.cross_system_build_job`):
```sh
mkdir build && cd build
../configure --enable-werror --disable-docs --enable-fdt=system --disable-user \
  --cross-prefix=riscv64-linux-gnu-
make -j"$JOBS" all check-build
```
User-mode emulation job (`cross-riscv64-user`, extends `.cross_user_build_job`):
```sh
../configure --disable-system --cross-prefix=riscv64-linux-gnu- \
  --target-list-exclude="aarch64_be-linux-user alpha-linux-user ..."
make -j"$JOBS" all check-build
```
KVM-only job (`cross-riscv64-kvm-only`, extends `.cross_accel_build_job`), merged into `.gitlab-ci.d/crossbuilds.yml` since the prior reporting cycle:
```sh
../configure --enable-werror --disable-docs --disable-tools --enable-${ACCEL:-kvm} \
  --cross-prefix=riscv64-linux-gnu- --disable-tcg --without-default-features
```
All three jobs run inside the `debian-riscv64-cross` container (Debian 13-slim base), depend on container job `riscv64-debian-cross-container`, and set `MAKE_CHECK_ARGS` unset for the system/user jobs - meaning the test step is a no-op for those two.

Meson cross-file baked into the container at `/usr/local/share/meson/cross/riscv64-linux-gnu`:
```ini
[binaries]
c = '/usr/bin/riscv64-linux-gnu-gcc'
ar = '/usr/bin/riscv64-linux-gnu-gcc-ar'
strip = '/usr/bin/riscv64-linux-gnu-strip'
pkgconfig = '/usr/bin/riscv64-linux-gnu-pkg-config'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

**Required toolchain versions** (from `meson.build` and `configure`):

| Component | Minimum | Notes |
|---|---|---|
| GCC | 10.4 | Version gate exists in `meson.build`; no documented rationale beyond the error string itself |
| Clang | 10.0 (Xcode Clang 15.0 on macOS) | Same |
| Meson | 1.6.0 (general); the riscv64 cross container pins 1.12.0 via pip, needed for Rust support | `docs/devel/build-system.rst` |
| Python | 3.12 effective (configure checks `sys.version_info < (3,12)`); `docs/about/build-platforms.rst` separately states 3.9 as the documented floor - configure is stricter than the docs page on current master | Treat 3.12 as the effective requirement |
| Rust | 1.83.0 | Only required with `--enable-rust`/`ENABLE_RUST=1` |
| bindgen | 0.60.0 | Rust FFI bindings generation |
| libfdt | 1.5.1 | FDT overlay API, specifically relevant to RISC-V/ARM machine models |

The cross-compiler is `gcc-riscv64-linux-gnu` from Debian 13; the `debian-riscv64-cross.docker` file (auto-generated by `lcitool` from `libvirt-ci`, not hand-maintained in-repo) installs roughly 70 `*-dev:riscv64` packages via `apt-get` after `dpkg --add-architecture riscv64`, deliberately using native GCC for the actual riscv64 compile rather than a vendor-provided cross toolchain.

**Known build issues.** No open riscv64-specific FTBFS (fails-to-build-from-source) issue was located in the live findings for this cycle beyond the general correctness/build tracking covered in Section 11; the prior `--disable-tcg` build failure tracked as GitLab issue #3483 is not re-confirmed as still-open in current research and should be re-verified directly against the tracker before being cited as current. The Arch RISC-V overlay still carries QEMU with an `updpatch` tag (riscv64-specific patches required to build in that environment), confirming the package is not a drop-in upstream build even where a working binary exists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| System emulation (softmmu) | Full | Full | Full | None |
| User-mode emulation (linux-user) | Full | Full | Full | None |
| KVM guest virtualization | Full | Full | Partial (no hardware breakpoints) | Functional |
| KVM live migration | Mature | Mature | Fixed Aug 2026 (vCPU priv mode/mp_state bug) | None (recently closed) |
| TCG JIT to host | Full | Full | Partial (missing i128 atomic, 4 vector bitwise ops) | Functional/Performance |
| Host SIMD acceleration of TCG | AVX2/SSE4 | NEON | None (no RVV intrinsics used) | Performance |
| Hardware debug via KVM | Full | Full | Stub (returns -EINVAL) | Functional |
| GUI/graphical display on `virt` machine | Works | Works | Reported broken without `-nographic` (issue #2145, open) | Functional |
| TPM support | Yes | Yes | No (issue #942, open) | Functional |
| Big-endian execution | Full | Full | Added June 2026 | None (closed) |
| ACPI support | Full | Full | virt machine only | Minor |
| Native CI runner | Yes | Yes | No | CI |
| Vector extension emulation (RVV) | N/A | N/A | Full (5,873-line helper) | None |
| Crypto extensions (Zk*, Zvk*) | N/A | N/A | Full | None |
| Hypervisor extension (H) | N/A | N/A | Partial (open conformance bugs, Section 11) | Correctness |
| IOMMU emulation | N/A | N/A | Partial (multiple open conformance bugs) | Correctness |

**Performance data.** No official QEMU-published riscv64 performance benchmark exists. Independent third-party measurements found:

- RISE/Igalia LLVM CI (Oct 2024): full two-stage LLVM toolchain build+test on real RISC-V SBC hardware takes roughly 24+ hours; the equivalent via QEMU system emulation on x86 CI hosts takes roughly 8 hours; a newer pipeline that cross-compiles natively on x86 and runs only the test suite under `qemu-system` reduces stage-2 to 30 minutes to 1 hour. [Source](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)
- arXiv 2501.03427 (Jan 2025), a branch-free 2-million-instruction microbenchmark designed to isolate IR-translation overhead: a non-IR prototype emulator (riscv-um) completed in 77 ms real time versus QEMU riscv64 user-mode at 246 ms (QEMU roughly 3.2x slower on this synthetic, IR-overhead-isolating test). [Source](https://arxiv.org/html/2501.03427v1) [single-source, NEEDS VERIFICATION]
- fluxcoil.net (Feb 2025): NetBSD guest emulation benchmark across architectures including riscv64 on an x86 host; qualitative conclusion is that riscv64 emulation was the slowest architecture tested for disk-read-heavy workloads but otherwise performed well, attributed to RISC-V's branch/compare model being cheaper to emulate than ARM's condition-code model; exact riscv64 numeric values were not extractable (client-side rendered charts). [Source](https://blog.fluxcoil.net/posts/2025/02/emulation-performance-and-consumption/) [NEEDS VERIFICATION - numbers not recovered]
- Linaro Android-boot-time study: x86-64 guest ~8x slower under TCG vs. KVM; aarch64 guest ~12x slower under TCG vs. KVM. No riscv64 data in this source. [Source](https://www.linaro.org/blog/qemu-a-tale-of-performance-analysis/)
- SPEC CPU2017 benchmarking of `qemu-system-riscv64` v8.2.2 exists (cloud-v.co/10xEngineers, June 2026) but exact SPECrate scores could not be extracted from the client-rendered page; methodology (4 vCPU, AMD EPYC 7713 host, Ubuntu 22.04.4 guest) is confirmed. [Source](https://cloud-v.co/blog/risc-v-1/benchmarking-risc-v-qemu-emulator-with-spec-cpu2017multi-corefprate-61) [NEEDS VERIFICATION - scores not recovered]

No RVV SIMD backend exists in pixman (the pixel-manipulation library QEMU's display path uses) for riscv64; all rendering falls back to scalar C. This is a performance gap for interactive QEMU sessions on riscv64 hardware; it does not affect headless server emulation, and no upstream pixman issue has been filed for it.

## 7. CI/CD Infrastructure

QEMU's CI is on GitLab ([gitlab.com/qemu-project/qemu](https://gitlab.com/qemu-project/qemu)); the GitHub mirror carries only `.github/workflows/lockdown.yml`, which auto-closes PRs with a redirect to GitLab - there is no CI on GitHub. The include chain was verified directly: `.gitlab-ci.yml` includes `.gitlab-ci.d/qemu-project.yml`, which includes `base.yml`, `crossbuilds.yml`, `buildtest.yml`, `static_checks.yml`, `custom-runners.yml`, `windows.yml`, `macos.yml`, `containers.yml`, and `stages.yml` - `crossbuilds.yml` and `buildtest.yml` are live, wired-in files, not orphaned configuration.

**Cross-compilation jobs** (`.gitlab-ci.d/crossbuilds.yml`), confirmed by direct fetch of the raw YAML:
```yaml
cross-riscv64-system:
  extends: .cross_system_build_job
  needs: [job: riscv64-debian-cross-container]
  variables: { IMAGE: debian-riscv64-cross }

cross-riscv64-user:
  extends: .cross_user_build_job
  needs: [job: riscv64-debian-cross-container]
  variables: { IMAGE: debian-riscv64-cross }

cross-riscv64-kvm-only:
  extends: .cross_accel_build_job
  needs: [job: riscv64-debian-cross-container]
  variables: { IMAGE: debian-riscv64-cross, EXTRA_CONFIGURE_OPTS: --disable-tcg --without-default-features }
```
All three run on x86 shared runners. `MAKE_CHECK_ARGS` is unset for `cross-riscv64-system` and `cross-riscv64-user`, so their test step is a no-op - they produce riscv64 binaries but do not execute them. `cross-riscv64-kvm-only` builds a KVM-only riscv64 binary with `--disable-tcg`; this job did not exist as of the prior reporting cycle (it was a pending patch proposed by Daniel Henrique Barboza) and has since merged - it narrows but does not close the CI gap, since it is still build-only with no execution step.

**Build+test jobs** (`.gitlab-ci.d/buildtest.yml`), grep-confirmed:
- `build-system-debian`: targets include `riscv64-softmmu`, `MAKE_CHECK_ARGS: check-build` (compile check only)
- `build-system-fedora`: targets include `riscv32-softmmu` (not riscv64), `check-build check-doc`
- `build-some-softmmu`: targets include `riscv64-softmmu`, `MAKE_CHECK_ARGS: check-tcg` - this is the one job that executes real functional/TCG correctness tests against riscv64, though it validates QEMU's TCG emulation of the riscv64 guest ISA on an x86 host, not execution of QEMU's own riscv64 host binaries
- `tsan-build`: targets include `riscv64-softmmu`, built with ThreadSanitizer + Clang, check-build only

**Firmware build** (`.gitlab-ci.d/opensbi.yml`): a dedicated job builds `opensbi-riscv32-generic-fw_dynamic.bin` and `opensbi-riscv64-generic-fw_dynamic.bin`, used by the riscv64 `virt` machine's default `-bios` path.

**Custom runners** (`.gitlab-ci.d/custom-runners/`): contains `ubuntu-24.04-aarch64.yml`, `ubuntu-24.04-s390x.yml`, `debian-13-ppc64le.yml`. No riscv64 file exists - confirming there is no native riscv64 runner; all riscv64 CI runs as cross-compilation on x86 hosts.

**RISE runners.** RISE's native RISC-V CI runners (announced March 2026, Scaleway EM-RV1 bare-metal hardware via Kubernetes) are explicitly positioned as an alternative to QEMU emulation, not infrastructure for QEMU itself: "Emulators like QEMU are invaluable for development, but they can't catch the real-world issues...that only show up on actual silicon." QEMU is not a RISE-supported project and does not use RISE runners.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | Yes (cross-build on x86) |
| Test execution in CI | Yes | Yes | Partial (`check-tcg` in `build-some-softmmu` only; cross jobs are build-only) |
| Native runner | Yes | Yes | No |
| KVM-specific CI job | Yes | Yes | Cross-build only, no execution (`cross-riscv64-kvm-only`, merged) |
| TSAN CI | Yes | No | Yes (included in `tsan-build`) |
| RISE runners | No | No | No (QEMU not a RISE project) |

## 8. Distribution and Release Status

**Official binaries.** The QEMU project distributes source tarballs only via [download.qemu.org](https://download.qemu.org/). The GitLab project page states pull requests are ignored and directs users to qemu.org for official releases. There are no architecture-specific pre-built binaries distributed by the QEMU project for any architecture, including riscv64.

**PyPI.** The `qemu` package on PyPI (`https://pypi.org/pypi/qemu/json`) is a stub at version 0.0.0a1, "QEMU Python Build, Debug and SDK tooling," distributed only as a pure-Python wheel (`qemu-0.0.0a1-py3-none-any.whl`) and sdist (`qemu-0.0.0a1.tar.gz`). Neither filename references any CPU architecture. This package holds no compiled QEMU emulator binaries of any architecture and is unrelated to the actual QEMU emulator. A separate check of the RISE wheel-builder PyPI index (`gitlab.com` project 56254198) simply redirects to the real PyPI index for this package name, confirming no RISE-built wheel exists either.

**Ubuntu 26.04 (resolute).** Confirmed live against `packages.ubuntu.com/resolute/riscv64/`: `qemu-system`, `qemu-system-common`, `qemu-system-misc`, `qemu-system-riscv`, `qemu-utils`, `qemu-block-extra`, `qemu-block-supplemental` all build for riscv64 (alongside amd64, arm64, armhf, ppc64el, s390x) at version `1:10.2.1+ds-1ubuntu3`. `qemu-efi-riscv64` (UEFI firmware for RISC-V VMs) is a dedicated riscv64-specific package. These packages live in Ubuntu's ports archive, the standard location for riscv64/armhf/ppc64el/s390x builds. There is no single package literally named `qemu`; the project splits into `qemu-system-*`/`qemu-utils`/`qemu-user`, a naming convention, not an architecture gap.

**Debian.** `qemu` builds successfully on riscv64 in Debian sid per the buildd infrastructure.

**Arch Linux RISC-V.** The community overlay at [archriscv.felixc.at](https://archriscv.felixc.at) carries roughly 80 QEMU-related riscv64 binary packages (`qemu-system-riscv`, `qemu-full`, `qemu-base`, `qemu-img`, `qemu-user`, `qemu-user-static`, `qemu-system-x86`, `qemu-system-aarch64`, etc.) at version **10.1.0-1**, dated 25-Sep-2025, each with a detached signature, tagged `updpatch` (requiring RISC-V-specific patches to build). Current upstream is past QEMU 11.0 as of this report - the overlay is roughly one full release behind, consistent with the `updpatch` tag reflecting ongoing packaging friction rather than a one-time divergence.

**Bottom line.** QEMU's own release process ships no riscv64 binary of any kind. The consumable riscv64 binary comes entirely from distributions - Ubuntu 26.04, Debian sid, and the Arch RISC-V overlay - not from upstream QEMU. A user wanting a working riscv64 QEMU binary should install from a distro package (Ubuntu `qemu-system-riscv`/`qemu-system-misc`, Debian `qemu`, or the Arch RISC-V overlay) or build from source using the cross-toolchain described in Section 5.

## 9. Dependencies

### 9.1 Direct Dependencies

| Dependency | Role | Relation | Criticality | riscv64 status |
|---|---|---|---|---|
| Meson | Build-graph generator | build-dependency | critical | Portable Python tool; no architecture dependency. CI container pins 1.12.0 |
| Ninja | Build execution (wrapped by Make) | build-dependency | critical | Portable C++ tool; builds and runs on riscv64 without issue |
| GCC | Primary compiler (riscv64 cross and native) | build-dependency | critical | `gcc-riscv64-linux-gnu` is the actual compiler used for riscv64 cross-builds in CI; floor is GCC 10.4 |
| LLVM | Alternate compiler toolchain (Clang) | build-dependency | optional | Clang 10.0 minimum (Xcode Clang 15.0 on macOS); CI container also installs `llvm` for sanitizer/tsan builds |
| Python | Build orchestration (`configure`, Meson, test scripts) | build-dependency | critical | Effective floor is 3.12 per `configure`, stricter than the documented 3.9 floor in `docs/about/build-platforms.rst` |
| Rust | Optional Rust-language device/backend code | build-dependency | optional | Floor 1.83.0, only required with `--enable-rust`; riscv64 cross container sets `ENABLE_RUST=1` and `RUST_TARGET=riscv64gc-unknown-linux-gnu`, confirming active riscv64 Rust-toolchain use in CI |
| dtc | Device-tree compiler / `libfdt`, critical for RISC-V and ARM machine models | runtime-dependency | critical | `libfdt-dev:riscv64` installed in the CI cross container; floor libfdt 1.5.1 |
| GLib | Core event loop, object model, used throughout QEMU | runtime-dependency | critical | `libglib2.0-dev:riscv64` present in CI container; floor glib-2.0 >= 2.66; widely packaged and tested on riscv64 Debian/Ubuntu ports |
| zlib | Block/compression | runtime-dependency | optional | `zlib1g-dev:riscv64` present in CI container; pure C, builds and is packaged everywhere on riscv64 |
| pixman | Pixel manipulation for display backends | runtime-dependency | critical | `libpixman-1-dev:riscv64` present in CI container; floor >= 0.21.8; builds as portable C, but no RVV SIMD backend exists (Section 6), so display rendering is scalar-only on riscv64 |
| libslirp | User-mode (SLIRP) networking | runtime-dependency | optional | `libslirp-dev:riscv64` present in CI container; floor >= 4.7; portable C |
| libseccomp | Sandboxing (`--sandbox`) | runtime-dependency | critical | `libseccomp-dev:riscv64` present in CI container; floor >= 2.3.0; riscv64 support has existed in libseccomp since v2.4.0 (2019) |
| GnuTLS | TLS/crypto backend (VNC, NBD) | runtime-dependency | optional | `libgnutls28-dev:riscv64` present in CI container; floor >= 3.7.5 |
| Nettle | Crypto primitives, GnuTLS backend | runtime-dependency | optional | `nettle-dev:riscv64` present in CI container |
| libgcrypt | Alternate crypto backend | runtime-dependency | optional | `libgcrypt20-dev:riscv64` present in CI container; weaker upstream riscv64 engineering investment than Nettle/GnuTLS, present mainly via downstream packaging |
| liburing | Linux io_uring AIO backend | runtime-dependency | optional | `liburing-dev:riscv64` present in CI container; floor >= 0.3; io_uring has been available on riscv64 since Linux 5.1 |
| libcurl | HTTP support (curl block driver, VNC) | runtime-dependency | optional | `libcurl4-gnutls-dev:riscv64` present in CI container; builds on riscv64 but CI validation is build-only, consistent with the project's own color grade |
| capstone | Disassembler used by QEMU's `-d in_asm`/TCG debug output | runtime-dependency | optional | `libcapstone-dev:riscv64` present in CI container; RISC-V decoder/printer marked complete upstream, auto-generated from an LLVM-18 Capstone fork |
| zstd | Compression (migration, qcow2) | runtime-dependency | optional | `libzstd-dev:riscv64` present in CI container; floor >= 1.4.0; an open upstream zstd PR (riscv64 4-way HUF decompression fast loop) targets migration-path throughput, performance-only, not a correctness blocker |
| snappy | Optional block compression | runtime-dependency | optional | `libsnappy-dev:riscv64` present in CI container |
| virglrenderer | GPU virtualization (virtio-gpu) | runtime-dependency | optional | `libvirglrenderer-dev:riscv64` present in CI container; builds, but no riscv64 GPU hardware exists for runtime testing, and the dependency chain (Mesa, EGL) is complex enough to plausibly carry weaker riscv64 coverage than core libraries [NEEDS VERIFICATION] |
| spice-server | SPICE remote display | runtime-dependency | optional | `libspice-server-dev:riscv64` and `libspice-protocol-dev:riscv64` present in CI container; floor >= 0.15.0; a Launchpad SRU request (bug #2096705) to enable Spice on riscv64 in Ubuntu indicates real-world packaging gaps beyond pure upstream build status |
| libusb | USB passthrough | runtime-dependency | optional | `libusb-1.0-0-dev:riscv64` present in CI container; floor >= 1.0.13 |
| libssh | SSH block driver | runtime-dependency | optional | `libssh-dev:riscv64` present in CI container; floor >= 0.8.7 |
| libpng | PNG support (screenshots, VNC) | runtime-dependency | optional | `libpng-dev:riscv64` present in CI container; floor >= 1.6.34; no RVV SIMD backend, no known build gaps |
| SDL2 | Default display/GUI backend | runtime-dependency | optional | `libsdl2-dev:riscv64` and `libsdl2-image-dev:riscv64` present in CI container; builds on riscv64, but issue #2145 (open, Section 11) reports `qemu-system-riscv64` failing to open a working graphical window without `-nographic` on the `virt` machine, an unresolved gap in the display path this dependency feeds |
| GTK4 | Alternate GUI frontend | runtime-dependency | optional | The riscv64 cross CI container installs `libgtk-3-dev:riscv64` and `libgtk-vnc-2.0-dev:riscv64` (GTK3-based), not GTK4 - a version discrepancy against the GTK4 dependency named here [NEEDS VERIFICATION, flagged as a discrepancy rather than resolved]. Either way, the dependency chain through GLib/Pango/Cairo is large and was not independently stress-tested on riscv64 this cycle |
| OpenSBI | RISC-V firmware, built from a submodule/pinned source and bundled as `pc-bios/opensbi-riscv{32,64}-generic-fw_dynamic.bin` | runtime-dependency | critical | Dedicated `.gitlab-ci.d/opensbi.yml` CI job builds both riscv32 and riscv64 firmware blobs; this is the default `-bios` firmware QEMU's `virt`/`sifive_u` machines load, making it a hard runtime dependency specifically for the riscv64 target itself, not a generic cross-arch library |

### 9.2 Indirect/Recursed Dependencies

| Dependency | Role | riscv64 status |
|---|---|---|
| libfdt (part of dtc) | FDT overlay API consumed via `dtc` | Floor 1.5.1; present in CI container as `libfdt-dev:riscv64` |
| libcap-ng | Capability handling (used by libseccomp/sandboxing paths) | `libcap-ng-dev:riscv64` present in CI container; small library, almost certainly packaged everywhere |
| libaio | Linux AIO backend (alternate to liburing) | Small, kernel-adjacent library, not independently verified this cycle but almost certainly packaged on riscv64 |
| libbpf | eBPF support (vhost, io_uring probing) | `libbpf-dev:riscv64` present in CI container; builds cleanly on distro riscv64 per existing project tracking |
| libxdp | XDP networking | `libxdp-dev:riscv64` present in CI container; niche dependency, may lag on less common architectures, not independently verified |
| libiscsi | iSCSI block driver | `libiscsi-dev:riscv64` present in CI container |
| libnfs | NFS block driver | `libnfs-dev:riscv64` present in CI container; floor >= 1.9.3 |
| fuse3 | virtiofsd backend | `libfuse3-dev:riscv64` present in CI container; floor >= 3.1 |

### 9.3 Deep-Dive: pixman

pixman provides CPU-accelerated pixel operations for QEMU's VGA framebuffer and VNC display path. The library has SIMD backends for x86 (MMX, SSE2, SSSE3) and ARM (NEON, Helium), but no RVV backend for riscv64. On a riscv64 host, all display rendering falls back to scalar C. No upstream pixman issue has been filed specifically for an RVV backend. This is a performance gap for interactive QEMU sessions on riscv64 hardware; it does not affect headless server emulation.

### 9.4 Deep-Dive: zstd

zstd is used for live migration compression and block snapshot compression. One open upstream performance PR, [#4622](https://github.com/facebook/zstd/pull/4622) ("huf_decompress: enable 4-way fast loop on riscv64"), targets improved Huffman decompression throughput on riscv64. Live migration compression is functional today on riscv64; this PR is a performance improvement, not a correctness fix.

### 9.5 Deep-Dive: capstone

Three open Capstone issues affect riscv64 disassembly: [#2887](https://github.com/capstone-engine/capstone/issues/2887) (crash when RISC-V support disabled at compile time), [#2959](https://github.com/capstone-engine/capstone/issues/2959) (compressed instruction alias handling), and [#2407](https://github.com/capstone-engine/capstone/issues/2407) (incorrect operand data for `ret`). None are build blockers; they affect debug/developer experience when using QEMU's `-d in_asm` disassembler or `qemu-user` instruction tracing on riscv64.

### 9.6 Deep-Dive: libcurl

libcurl's riscv64 CI coverage is itself build-only (not a full test matrix), and upstream riscv64 build/CI maintenance is effectively carried by a single contributor. This mirrors QEMU's own yellow (build-only-ci) status and is not independently a blocker for QEMU's riscv64 build, since libcurl support in QEMU is optional.

## 11. Known Bugs and Active Issues

### 11.1 Open Issues on QEMU's GitLab Tracker (gitlab.com/qemu-project/qemu)

| # | Title | Status | Notes |
|---|---|---|---|
| [#942](https://gitlab.com/qemu-project/qemu/-/work_items/942) | No TPM support for riscv64 in QEMU | Open | Functional gap, no TPM backend wired to riscv64 targets |
| [#2145](https://gitlab.com/qemu-project/qemu/-/issues/2145) | Graphical interface fails on RISC-V `virt` machine without `-nographic` | Open | Identical invocation works on x86_64; display-path gap, feeds back to the SDL2 dependency (Section 9.1) |
| [#2245](https://gitlab.com/qemu-project/qemu/-/issues/2245) | RISC-V extensions query API for QEMU System | Open | |
| [#2223](https://gitlab.com/qemu-project/qemu/-/issues/2223) | Weird/unexpected behavior running code on RISC-V under QEMU | Open | Under-specified report |
| [#691](https://gitlab.com/qemu-project/qemu/-/work_items/691) | `-nic model=help` on qemu-system-riscv64 doesn't list supported NIC models | Open since 2021 | Low-priority CLI/UX papercut |
| [#3224](https://gitlab.com/qemu-project/qemu/-/issues/3224) | Illegal instruction (SIGILL) in glibc's vectorized `memset` under qemu-user for riscv64 | Open | Intermittent (~50% repro rate), triggered by `vse64.v`; does not reproduce under qemu-system; likely a TCG vector-extension codegen/state bug |
| [#2711](https://gitlab.com/qemu-project/qemu/-/issues/2711) | TCG optimizer (TSTEQ) incorrectly eliminates an opcode due to stale temp reuse | Open | Surfaces running the x86_64 TCG test suite on a riscv64 host |
| [#1458](https://gitlab.com/qemu-project/qemu/-/work_items/1458) | `ns16550a` UART `reg-shift` not declared in device-tree for `qemu-system-riscv64`, defaults to 0 | Open | Inconsistent with other RISC-V boards (e.g. SiFive Unmatched uses reg-shift 2) |

### 11.2 Recently Closed (illustrative of active correctness maintenance)

| # | Title | Resolution |
|---|---|---|
| [#1060](https://gitlab.com/qemu-project/qemu/-/work_items/1060) | `mtval`/`stval` not set to the faulting instruction on illegal instructions | Closed/Fixed by Richard Henderson |
| [#1093](https://gitlab.com/qemu-project/qemu/-/work_items/1093) | Signal frame misaligned (4-byte instead of ABI-required 16-byte alignment) in linux-user signal handlers | Closed/Fixed by Richard Henderson |
| [#1793](https://gitlab.com/qemu-project/qemu/-/work_items/1793) | `getauxval(AT_HWCAP)` RVV bit differs between system-mode and user-mode | Closed/Fixed, landed in QEMU 8.1 |
| [#2371](https://gitlab.com/qemu-project/qemu/-/work_items/2371) | `froundnx.h` helper called the wrong NaN-boxing check (`check_nanbox_s` instead of `check_nanbox_h`) | Closed/Fixed by Richard Henderson |
| [#1647](https://gitlab.com/qemu-project/qemu/-/issues/1647) | Hypervisor-extension timer interrupt handling bug, `mip`/`[V]STIP` not cleared, causing infinite loop under H-ext+AIA testing | Closed (Needs Info) by Alistair Francis after nearly 3 years open - low-traction, specialized interaction |

### 11.3 Active Mailing-List Correctness Work (2025-2026)

- **KVM migration fix** (v9 to v11, Xie Bo, reviewed by Daniel Henrique Barboza/Andrew Jones/Radim Krcmar, applied by Alistair Francis): fixed vCPU privilege mode and `mp_state` loss across live migration of multi-vCPU riscv64 KVM guests. Merged to master around August 2026; flagged for stable-11.1 backport. Validated on native riscv64 KVM hardware with 24-hour sustained, repeated-migration testing. [Thread](https://ratatoskr.run/qemu-devel/2025/09/14395153/t)
- **"[PATCH v2 00/14] RISC-V TCG PMU correctness fixes"** (Sept 2026): PMU accounting, overflow notification, migration fixes. [Thread](https://ratatoskr.run/qemu-devel/2026/09/17546843/t)
- **"Fix PC sync in trans_sspopchk"** (July 2026): `auipc` following a matching `sspopchk` returned an address 4 bytes too low within the same translation block, a shadow-stack/CFI interaction bug. [Thread](https://ratatoskr.run/qemu-devel/2026/07/17345231/t)
- **"Fix clobbering of TCG_REG_TMP0 (t6)"** (Dec 2025): t6, used as the destination register for `vsetvli`/`vsetvl`, could be clobbered by a later temp use in vector codegen. [Thread](https://ratatoskr.run/qemu-devel/2025/12/14415820/t)

### 11.4 Distro-Tracker Bugs (Ubuntu/Launchpad, not upstream)

- [Bug #2096705](https://bugs.launchpad.net/bugs/2096705): request to enable Spice on riscv64
- [Bug #1923162](https://bugs.launchpad.net/ubuntu/+source/u-boot/+bug/1923162): riscv64 images fail to boot in qemu (u-boot/fdt loading issue)
- [Bug #2127111](https://bugs.launchpad.net/bugs/2127111): `systemd-detect-virt` misdetects under qemu-riscv64 because `/proc/device-tree` is a symlink
- [Bug #1992653](https://bugs.launchpad.net/bugs/1992653): `qemu-riscv64-static` crashes with SIGSEGV on chroot transition

None of the open issues above block basic riscv64 emulation. The clearest functional gaps are TPM support (#942) and the GUI/display path (#2145); the clearest correctness risk is the intermittent SIGILL in vectorized memset under qemu-user (#3224), which is reproducible roughly half the time and affects any riscv64-guest workload exercising glibc's vectorized memset path under user-mode emulation.

## 12. Objections and Upstream Blockers

**No organizational objections** to RISC-V in QEMU were found. The port has been upstream since 2018, both primary RISC-V TCG maintainers hold "Supported" (paid) status, and correctness work continues at a steady cadence (Section 11.3).

**Technical blockers:**

1. **No native riscv64 CI runner.** All riscv64 CI, including the newly merged KVM-only cross-build job, runs as cross-compilation on x86 shared runners. This is the single largest structural gap versus arm64/s390x/ppc64le, which each have a dedicated custom runner.
2. **Intermittent memset SIGILL under qemu-user** (#3224): a ~50% reproduction-rate SIGILL in glibc's vectorized `memset` is an active correctness risk for any workload using qemu-user (binfmt_misc) on riscv64 guests, not yet root-caused to a merged fix.
3. **KVM hardware breakpoints absent.** Three stub functions in `kvm-cpu.c` return `-EINVAL` or are no-ops; any toolchain or debugger relying on hardware watchpoints via KVM on a riscv64 host receives errors. This requires coordinated kernel-side KVM-RISC-V work and is not solely a QEMU-side fix.
4. **GUI/display path broken on `virt`** (#2145, open) and **no TPM support** (#942, open): both are functional gaps with no patch in flight as of this research.
5. **TCG JIT backend gaps**: missing i128 atomic load/store and four vector bitwise ops (`andc_vec`, `orc_vec`, `nand_vec`, `nor_vec`) in the riscv64 host JIT backend.

**Acceptance probability for incremental fixes.** High for well-scoped correctness bugs - the pattern of recently closed issues (#1060, #1093, #1793, #2371, and the Aug 2026 KVM migration fix) shows the maintainer team (Palmer Dabbelt, Alistair Francis, Daniel Henrique Barboza) actively reviews and merges riscv64-specific patches on a normal cadence. The structural CI gap (no native runner) is a different category of blocker: it requires hardware and GitLab runner registration, not just code review, and no native riscv64 runner work is currently in progress.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification.** QEMU's GitLab CI ([.gitlab-ci.d/crossbuilds.yml](https://gitlab.com/qemu-project/qemu/-/blob/master/.gitlab-ci.d/crossbuilds.yml)) cross-compiles riscv64 system/user binaries via `cross-riscv64-system`/`cross-riscv64-user` on x86 runners but runs no test step (`MAKE_CHECK_ARGS` is unset, so the step is a no-op); no native riscv64 CI runner exists (`.gitlab-ci.d/custom-runners/` has aarch64, s390x, and ppc64le only), and upstream publishes source tarballs only, no riscv64 binaries, from download.qemu.org. This is the classic "builds riscv64, does not test it, upstream does not release it" pattern that defines yellow/build-only-ci, consistent with this project's prior stored grade. The consumable riscv64 binary comes from distributions instead: Ubuntu 26.04 resolute ships `qemu-system`, `qemu-system-riscv`, `qemu-efi-riscv64`, and related packages for riscv64 at `1:10.2.1+ds-1ubuntu3`, Debian sid builds `qemu` successfully on riscv64, and the Arch RISC-V overlay carries it with an `updpatch` tag (riscv64-specific patches required, one release behind) - so the release provider is distro, not upstream. The `build-some-softmmu` job does run `check-tcg`, but that validates QEMU's emulation of the riscv64 *guest* ISA on an x86 host, not execution of QEMU's own riscv64 host binaries, so it does not change the grade. QEMU is a general-purpose emulator/virtualizer focused on correctness and compatibility, not a project whose value proposition is "faster than a reference implementation," so the optimization-purpose modifier does not apply and no optimization-level rating is assigned.

**Pending work that could change the grade.** A KVM-only cross-build job (`cross-riscv64-kvm-only`), proposed by Daniel Henrique Barboza, has since merged into `.gitlab-ci.d/crossbuilds.yml`, narrowing but not closing the CI gap - it remains build-only with no execution step. No native riscv64 runner is in progress. Active correctness work continues: a merged riscv64 KVM live-migration fix (August 2026), several open GitLab issues (#2371-class work resolved; #942 no-TPM-support and #2145 display-path issues remain open). RISE project involvement with QEMU is minimal and largely contrastive - RISE's native RISC-V runners announcement explicitly frames QEMU emulation as the thing native-hardware CI is meant to replace, and QEMU is not a funded RISE deliverable, so no RISE-driven CI or release-process upgrade is expected soon.

## 14. Investment Analysis

RISE has no funded, ongoing deliverable on QEMU itself. The completed RISE-attributed work (SE_01_001 riscv_hwprobe, SE_01_017 ACPI SPCR, SE_01_021 RVA23 profile support, EDK2_00_18 firmware reference platform; Section 2) is already merged and should not be re-sized here. Daniel Barboza's RISE Technical Lead role for the Simulator/Emulator working group is individual volunteer/employer-funded activity (Qualcomm), not a tracked RISE budget line, and his in-flight CI and `--disable-tcg` work is likewise not a RISE deliverable to size.

### 14.1 Functional Enablement

- **Fix the GUI/display-path gap on the `virt` machine** (#2145, open): no patch in flight. Affects any interactive use of `qemu-system-riscv64` without `-nographic`.
- **Add TPM support for riscv64** (#942, open): no patch in flight; this is a device-model gap, not a correctness bug, and would require wiring an existing TPM backend (already supported on other targets) to the riscv64 `virt`/other boards.
- **Root-cause the intermittent memset SIGILL under qemu-user** (#3224, ~50% repro rate): highest-priority correctness item in Section 11 given its nondeterministic nature and that it affects a common libc codepath (vectorized `memset`) under a common usage mode (qemu-user/binfmt_misc).
- **KVM hardware breakpoints** (`kvm-cpu.c` stubs): requires coordinated QEMU + Linux kernel KVM-RISC-V work; not solely closable from the QEMU side.

### 14.2 Performance Optimization

- **RVV SIMD backend for pixman**: no upstream issue exists; would benefit interactive/graphical QEMU sessions on riscv64 hardware. Effort is moderate given pixman's existing NEON/SSE2 backend structure to follow as a template.
- **TCG JIT backend: add the four missing vector bitwise ops** (`andc_vec`, `orc_vec`, `nand_vec`, `nor_vec`) and **i128 atomic load/store** (`TCG_TARGET_HAS_qemu_ldst_i128`, requiring `amocas.q`/Zacas on the host): closes the remaining gap versus the x86_64/aarch64 TCG backends.
- **Upstream zstd riscv64 4-way HUF decompression fast loop** (PR #4622, in the zstd project, not QEMU): reviewing/landing this benefits QEMU's live-migration throughput on riscv64 hosts but is work in a different upstream repository.

### 14.3 CI/CD Infrastructure

- **Register a native riscv64 CI runner**: the largest single gap preventing a color upgrade. Requires hardware (the RISE Runners infrastructure, Scaleway EM-RV1 or equivalent, could in principle serve this if a QEMU-specific runner were registered, but QEMU is explicitly not currently a RISE-supported project) and a GitLab runner registration, following the existing pattern in `.gitlab-ci.d/custom-runners/` for aarch64/s390x/ppc64le.
- **Add an execution step to `cross-riscv64-system`/`cross-riscv64-user`**: currently `MAKE_CHECK_ARGS` is unset for both; wiring in even a `check-build`-plus-boot-smoke-test step (which requires either QEMU-under-QEMU or a native runner) would materially strengthen the CI signal independent of the native-runner question.
- Monitor whether `cross-riscv64-kvm-only` gains an execution step over time now that it has merged in build-only form.

## 15. References

- [QEMU GitLab repository](https://gitlab.com/qemu-project/qemu)
- [QEMU GitHub mirror (read-only, PRs disabled)](https://github.com/qemu/qemu)
- [QEMU homepage](https://www.qemu.org/)
- [QEMU MAINTAINERS file](https://gitlab.com/qemu-project/qemu/-/blob/master/MAINTAINERS)
- [QEMU sponsors](https://www.qemu.org/)
- [crossbuilds.yml CI config](https://gitlab.com/qemu-project/qemu/-/blob/master/.gitlab-ci.d/crossbuilds.yml)
- [buildtest.yml CI config](https://gitlab.com/qemu-project/qemu/-/blob/master/.gitlab-ci.d/buildtest.yml)
- [opensbi.yml CI config](https://gitlab.com/qemu-project/qemu/-/blob/master/.gitlab-ci.d/opensbi.yml)
- [QEMU 2018 RISC-V port submission (patchew)](https://patchew.org/QEMU/1519344729-73482-1-git-send-email-mjc@sifive.com/)
- [QEMU commit 4dc62b15 - RISC-V MAINTAINERS entry](https://gitlab.com/qemu-project/qemu/-/commit/4dc62b15)
- [QEMU 9.0 changelog](https://wiki.qemu.org/ChangeLog/9.0)
- [QEMU 9.2 changelog](https://wiki.qemu.org/ChangeLog/9.2)
- [QEMU 10.0 changelog](https://wiki.qemu.org/ChangeLog/10.0)
- [QEMU 10.1 changelog](https://wiki.qemu.org/ChangeLog/10.1)
- [QEMU 11.0 changelog](https://wiki.qemu.org/ChangeLog/11.0)
- [QEMU 10.2 coverage (linuxiac.com)](https://linuxiac.com/qemu-10-2-expands-risc-v-powerpc-and-s390x-emulation-capabilities/)
- [KVM riscv64 migration fix thread](https://ratatoskr.run/qemu-devel/2025/09/14395153/t)
- [RISC-V TCG PMU correctness fixes thread](https://ratatoskr.run/qemu-devel/2026/09/17546843/t)
- [Fix PC sync in trans_sspopchk thread](https://ratatoskr.run/qemu-devel/2026/07/17345231/t)
- [Fix clobbering of TCG_REG_TMP0 thread](https://ratatoskr.run/qemu-devel/2025/12/14415820/t)
- [Issue #942: No TPM support for riscv64](https://gitlab.com/qemu-project/qemu/-/work_items/942)
- [Issue #2145: Graphical interface fails on RISC-V](https://gitlab.com/qemu-project/qemu/-/issues/2145)
- [Issue #2245: RISC-V extensions query](https://gitlab.com/qemu-project/qemu/-/issues/2245)
- [Issue #2223: Weird behavior on RISC-V](https://gitlab.com/qemu-project/qemu/-/issues/2223)
- [Issue #691: -nic model=help doesn't list NIC models](https://gitlab.com/qemu-project/qemu/-/work_items/691)
- [Issue #3224: Illegal instruction in memset under qemu-user](https://gitlab.com/qemu-project/qemu/-/issues/3224)
- [Issue #2711: TSTEQ lowering/optimization bug](https://gitlab.com/qemu-project/qemu/-/issues/2711)
- [Issue #1458: ns16550a reg-shift incorrect](https://gitlab.com/qemu-project/qemu/-/work_items/1458)
- [Issue #1060: mtval/stval not correctly set](https://gitlab.com/qemu-project/qemu/-/work_items/1060)
- [Issue #1093: signal frame misaligned](https://gitlab.com/qemu-project/qemu/-/work_items/1093)
- [Issue #1793: getauxval(AT_HWCAP) differs](https://gitlab.com/qemu-project/qemu/-/work_items/1793)
- [Issue #2371: froundnx.h bug](https://gitlab.com/qemu-project/qemu/-/work_items/2371)
- [Issue #1647: Hypervisor timer interrupt handling bug](https://gitlab.com/qemu-project/qemu/-/issues/1647)
- [Ubuntu resolute riscv64 qemu-system-misc package page](https://packages.ubuntu.com/resolute/riscv64/qemu-system-misc)
- [Ubuntu package search, resolute, QEMU](https://packages.ubuntu.com/search?keywords=QEMU&suite=resolute&searchon=names&section=all)
- [Arch RISC-V overlay repository](https://mirrors.felixc.at/archriscv/repo/extra/)
- [PyPI qemu package JSON API](https://pypi.org/pypi/qemu/json)
- [RISE: Working with Igalia to improve RISC-V LLVM CI](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)
- [RISE: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE: Advancing OpenSBI interrupt handling](https://riseproject.dev/2026/07/16/advancing-opensbi-interrupt-handling/)
- [RISE: PyTorch is available on riscv64](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE FAQ](https://riseproject.dev/faq/)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [zstd PR #4622: huf_decompress riscv64 4-way fast loop](https://github.com/facebook/zstd/pull/4622)
- [capstone issue #2887: crash when RISC-V disabled](https://github.com/capstone-engine/capstone/issues/2887)
- [capstone issue #2959: compressed instruction alias handling](https://github.com/capstone-engine/capstone/issues/2959)
- [capstone issue #2407: incorrect operand data for ret](https://github.com/capstone-engine/capstone/issues/2407)
- [arXiv 2501.03427: Boosting Cross-Architectural Emulation Performance](https://arxiv.org/html/2501.03427v1)
- [fluxcoil.net: Emulating architectures with qemu](https://blog.fluxcoil.net/posts/2025/02/emulation-performance-and-consumption/)
- [Linaro: QEMU - A Tale of Performance Analysis](https://www.linaro.org/blog/qemu-a-tale-of-performance-analysis/)
- [cloud-v.co SPEC CPU2017 QEMU riscv64 benchmark](https://cloud-v.co/blog/risc-v-1/benchmarking-risc-v-qemu-emulator-with-spec-cpu2017multi-corefprate-61)
- [embecosm rise-rvv-tcg-qemu-tooling](https://github.com/embecosm/rise-rvv-tcg-qemu-tooling)
- [Launchpad bug #2096705: enable Spice on riscv64](https://bugs.launchpad.net/bugs/2096705)
- [Launchpad bug #1923162: riscv64 images fail to boot (u-boot)](https://bugs.launchpad.net/ubuntu/+source/u-boot/+bug/1923162)
- [Launchpad bug #2127111: systemd-detect-virt misdetects under qemu-riscv64](https://bugs.launchpad.net/bugs/2127111)
- [Launchpad bug #1992653: qemu-riscv64-static SIGSEGV on chroot](https://bugs.launchpad.net/bugs/1992653)