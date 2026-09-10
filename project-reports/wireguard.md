---
title: WireGuard
parent: Project Reports
color: blue
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: nftables
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="wireguard" %}

# WireGuard

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for WireGuard<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

WireGuard is a VPN protocol and its reference implementation, built on the Noise protocol framework with a fixed, modern cryptographic suite: ChaCha20Poly1305 for the AEAD data channel, Poly1305 for authentication, BLAKE2s for hashing/KDF, Curve25519 for the Diffie-Hellman handshake, and SipHash24 for internal hashtable protection. The kernel implementation has been part of mainline Linux since kernel 5.6 (`drivers/net/wireguard/`), replacing the earlier out-of-tree `wireguard-linux-compat` module.

**Governance.** WireGuard is a single-maintainer project. Jason A. Donenfeld holds the copyright and trademarks and is the sole named maintainer; there is no separate nonprofit foundation or standards body. The project is hosted under his "ZX2C4" identity, and he is also principal of Edge Security, an infosec research firm. Development happens via a public mailing list (all patches submitted there) and IRC (`#wireguard` on Libera.Chat). Security reports go to security@wireguard.com, private/team matters to team@wireguard.com. The kernel driver is licensed GPLv2 (matching the kernel license); companion tools/libraries use a mix of MIT, BSD, Apache 2.0, or GPL depending on component.

**Corporate sponsors.** There are no corporate co-maintainers. Funding is a mix of individual and company donations rather than a controlling sponsor: Private Internet Access (bronze donor since 2018), CyberGhost and ZenMate (both under parent Kape Technologies, bronze donors), a one-time EUR10,000 donation from OVPN, and an OpenSats Long-Term Support grant paid directly to Donenfeld. Historically the project also participated in Google Summer of Code. Donenfeld has stated he has deliberately kept WireGuard independent of any single large company.

**Community stance on new ports.** No explicit public statement on new architecture ports was found. The evidence points to an implicit "no special treatment needed" posture: because the driver and its crypto dependencies are written to be portable, new architectures such as RISC-V are supported automatically through mainline kernel support and generic-C fallback, requiring only occasional CI/build-config maintenance rather than dedicated porting effort.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-08-09 (merged 2022-08-12, shipped in v6.0, released 2022-10-02) | `wireguard: selftests: set CONFIG_NONPORTABLE on riscv32` (Jason A. Donenfeld) - restores boot of the riscv32 QEMU selftest kernel after the upstream RISC-V `CONFIG_PORTABLE`/`CONFIG_NONPORTABLE` split | [commit 9019b4f6d9bd88524ecd95420cf9cd4aaed7a125](https://git.zx2c4.com/wireguard-linux/commit/?id=9019b4f6d9bd88524ecd95420cf9cd4aaed7a125), [mailing-list mirror](https://lkml.rescloud.iu.edu/2208.1/08550.html) |
| 2023-09-12 | RFC "RISC-V BLAKE2s Vector implementation" (Bjorn Topel, with Andy Chiu and Greentime Hu) - explicitly framed as "a first step towards a Vector aided WireGuard"; never merged, blocked on Andy Chiu's separate, then-unmerged kernel-mode-vector series | [LWN summary](https://lwn.net/Articles/944288/), [list thread](https://lkml.iu.edu/hypermail/linux/kernel/2309.1/07923.html) |
| ~January 2024 | General RISC-V vector-crypto instruction-set support lands in mainline (`arch/riscv/crypto`, `lib/crypto/riscv`), authored primarily by Jerry Shih (SiFive) - not WireGuard-specific, but the ChaCha20 piece is what WireGuard's data path rides on | [LWN summary](https://lwn.net/Articles/948871/) |
| 2024-03-13 (merged 2024-03-19, shipped in v6.9, released 2024-05-12) | `wireguard: selftests: set RISCV_ISA_FALLBACK on riscv{32,64}` (Jason A. Donenfeld) - fixes a QEMU boot regression in WireGuard's own selftest harness caused by an upstream RISC-V ISA-string parsing change | [commit aee4de74523d555025d308940d9db5f8d7d2bc28](https://git.zx2c4.com/wireguard-linux/commit/?id=aee4de74523d555025d308940d9db5f8d7d2bc28) |

**Key contributors:** Jason A. Donenfeld (WireGuard maintainer, author of both merged riscv CI fixes); Bjorn Topel, Andy Chiu, Greentime Hu (Rivos-affiliated, unmerged BLAKE2s vector RFC); Jerry Shih and other SiFive contributors (general RISC-V vector-crypto extension support, used transitively by WireGuard's ChaCha20 data path).

**Fully upstream?** Yes, in the sense that matters for the kernel driver: WireGuard has been in mainline Linux since 5.6 (2020) and required no riscv-specific porting because the driver is architecture-agnostic C. The only riscv-tagged work in WireGuard's own tree is the two CI/Kconfig maintenance commits above, both merged. No master tracking issue or open riscv64 port request exists anywhere: the GitHub mirror (`github.com/WireGuard/wireguard-linux`) is read-only and returns zero riscv issues, and no dedicated mailing-list thread for a "riscv64 port" was found.

## 3. Upstream Support Tier

WireGuard has no formal, published tier policy (no "tier 1/2/3" platform classification on wireguard.com or in its repositories).

**CI evidence.** WireGuard maintains a QEMU-based kernel selftest harness at `tools/testing/selftests/wireguard/qemu/` with a dedicated riscv64 target (`arch/riscv64.config` plus an `ARCH=riscv64` branch in the harness `Makefile`). This harness cross-compiles a kernel and a musl-based userspace image, boots it under `qemu-system-riscv64`, and gates pass/fail on a `wg.success` marker written over virtio-serial - i.e. it builds and functionally exercises WireGuard on riscv64, not merely a build-only cross-compile. However, no automated trigger was found for it: no GitHub Actions workflow, Jenkinsfile, GitLab CI file, cron job, or webhook invokes this harness. It is run manually by Donenfeld and referred to informally as "WireGuard CI" in his own commit messages (e.g. "WireGuard CI has been broken" in [commit aee4de745](https://git.zx2c4.com/wireguard-linux/commit/?id=aee4de74523d555025d308940d9db5f8d7d2bc28)). No public dashboard or pass/fail history is exposed anywhere. The same `Makefile` also supports x86_64, arm, riscv32, mips, powerpc, m68k, and s390x as test targets through the same mechanism; whether those other architectures' targets are exercised any more frequently or automatically than riscv64 was not established by this research. Data not available: explicit confirmation of automated (bot-driven) CI for amd64/arm64 beyond the same manual harness.

**Release artifact.** WireGuard the kernel driver is not distributed as a separate binary by upstream; it ships as in-tree source built into whatever riscv64 kernel image a distribution or user compiles. The userspace `wireguard-tools` package is likewise upstream source only (`git.zx2c4.com/wireguard-tools`) - Donenfeld does not publish riscv64 (or any architecture's) binaries directly. Confirmed working riscv64 binaries come from Ubuntu (`wireguard-tools` 1.0.20250521-1ubuntu1 for riscv64/resolute, confirmed via direct fetch of the [Ubuntu package page](https://packages.ubuntu.com/resolute/riscv64/wireguard-tools)).

| Architecture | Upstream CI: build | Upstream CI: test | Upstream riscv64-style artifact |
|---|---|---|---|
| amd64 (x86_64) | Same manual QEMU harness supports it | Same harness | No upstream binary; distro-provided |
| arm64 | Data not available (harness lists `arm`, not confirmed whether this covers arm64) | Data not available | No upstream binary; distro-provided |
| riscv64 | Yes (manual, QEMU harness) | Yes (manual, boots and checks `wg.success`) | No upstream binary; distro-provided (Ubuntu confirmed) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**The WireGuard driver itself (`drivers/net/wireguard/`) contains zero architecture-specific code.** No `arch/riscv` references, no `.S` assembly files, no per-arch `#ifdef`s in `allowedips.c`, `cookie.c`, `device.c`, `noise.c`, `receive.c`, `send.c`, `socket.c`, `timers.c`, or the selftest sources. All crypto is delegated to the generic kernel crypto library API (`lib/crypto/`), which is where architecture dispatch actually lives.

Verified directly against `lib/crypto/riscv/` and `lib/crypto/Kconfig` in the mainline `torvalds/linux` tree, WireGuard's four cryptographic primitives break down as follows:

| Primitive | Role in WireGuard | RISC-V implementation | Quality |
|---|---|---|---|
| ChaCha20 | Data-plane stream cipher (per packet) | `lib/crypto/riscv/chacha-riscv64-zvkb.S` | **Full** - hand-written RISC-V Vector (Zvkb) assembly, gated on `TOOLCHAIN_HAS_VECTOR_CRYPTO && RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`; falls back to generic C automatically when unavailable |
| Poly1305 | Data-plane MAC (per packet) | `lib/crypto/riscv/poly1305-riscv.pl` (generates `poly1305-core.S`) | **Full** - hand-written scalar RV64 perlasm (OpenSSL-derived), unconditional on all riscv64 (`Kconfig: default y if RISCV`), no vector extension required |
| BLAKE2s | Handshake hashing/KDF (per session/rekey) | None | **Absent** - only `lib/crypto/blake2s.c` generic C exists; the 2023-09 RFC by Bjorn Topel ("first step towards a Vector aided Wireguard") was never merged and has no active successor |
| Curve25519 | Handshake ECDH key exchange (per session/rekey) | None | **Absent** - `CRYPTO_LIB_CURVE25519_ARCH` in `lib/crypto/Kconfig` only defaults `y` for ARM, PPC64, X86_64; no RISCV line exists; falls back to generic `curve25519-fiat32.c`/`curve25519-hacl64.c` |

Build wiring, confirmed directly:
```
libchacha-$(CONFIG_RISCV) += riscv/chacha-riscv64-zvkb.o
libpoly1305-y += riscv/poly1305-core.o   # generated from poly1305-riscv.pl
```
```
config CRYPTO_LIB_CHACHA_ARCH
    default y if RISCV && 64BIT && TOOLCHAIN_HAS_VECTOR_CRYPTO && RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS
config CRYPTO_LIB_POLY1305_ARCH
    default y if RISCV
```

**Comparison with amd64/arm64.** The two Kconfig lines checked directly (`CRYPTO_LIB_CURVE25519_ARCH`, `CRYPTO_LIB_BLAKE2S_ARCH`) name "ARM" and "X86_64" as the architectures that default to accelerated implementations for Curve25519 and BLAKE2s. Whether "ARM" in these lines denotes 32-bit ARM specifically, or whether a separate ARM64-specific accelerated path exists elsewhere in `lib/crypto/arm64/`, was not confirmed in this research. Data not available: direct confirmation of arm64-specific Curve25519/BLAKE2s acceleration files. What is confirmed is that X86_64 gets accelerated Curve25519 and BLAKE2s where riscv64 does not.

**Net effect:** the two per-packet, throughput-dominant primitives (ChaCha20, Poly1305) are hand-tuned on riscv64. The two per-session, infrequent primitives (BLAKE2s, Curve25519) run generic scalar C on riscv64, unlike on x86_64 where both are accelerated.

## 5. Build System, Cross-Compilation, and Toolchain

WireGuard uses **no CMake and no autoconf `configure` script anywhere**, for any architecture, including riscv64, and there is no official Dockerfile. Confirmed by checking the roots of `wireguard-linux`, `wireguard-tools`, and the legacy `wireguard-linux-compat`.

- **Kernel** (`wireguard-linux`): standard Kbuild/Kconfig (plain `make`). WireGuard is in-tree `drivers/net/wireguard`.
- **wireguard-tools** (`wg`/`wg-quick`): a hand-written POSIX Makefile in `src/`. The README states: "There are no dependencies other than a good C compiler and a sane libc." Build is `cd src && make`; the only toggles are `WITH_BASHCOMPLETION`, `WITH_WGQUICK`, `WITH_SYSTEMDUNITS` - there is no `-DUSE_X=OFF`-style flag surface anywhere in the project.

**riscv64 test/build commands** (`tools/testing/selftests/wireguard/qemu/`):
```sh
ARCH=riscv64 make            # builds kernel+userspace, boots under QEMU, runs the wg selftest
ARCH=riscv64 make menuconfig
ARCH=riscv64 make clean
ARCH=riscv64 make distclean
```
The Makefile cross-compiles via `make -C $(KERNEL_PATH) O=$(BUILD_PATH) ARCH=riscv KERNEL_ARCH=riscv CROSS_COMPILE=riscv64-linux-musl-`, producing `arch/riscv/boot/Image`, then boots it:
```sh
timeout --foreground 20m qemu-system-riscv64 \
  -nodefaults -nographic -smp 4 -cpu rv64 -machine virt -m 256M \
  -serial stdio -chardev file,path=$(BUILD_PATH)/result,id=result \
  -device virtio-serial-device -device virtserialport,chardev=result \
  -no-reboot -monitor none -kernel arch/riscv/boot/Image
```
Rather than trust the system compiler, the harness downloads a pinned prebuilt `riscv64-linux-musl-cross` toolchain snapshot (dated 20211123, sha256-verified) from `download.wireguard.com`.

**riscv64.config kernel fragment:**
```
CONFIG_ARCH_RV64I=y
CONFIG_MMU=y
CONFIG_FPU=y
CONFIG_ARCH_VIRT=y
CONFIG_RISCV_ISA_FALLBACK=y
CONFIG_SERIAL_8250=y
CONFIG_SERIAL_8250_CONSOLE=y
CONFIG_SERIAL_OF_PLATFORM=y
CONFIG_VIRTIO_MENU=y
CONFIG_VIRTIO_MMIO=y
CONFIG_VIRTIO_CONSOLE=y
CONFIG_CMDLINE="console=ttyS0 wg.success=vport0p1 panic_on_warn=1"
CONFIG_CMDLINE_FORCE=y
```

**Toolchain minimums and rationale.** Kernel-wide floor (`Documentation/process/changes.rst`): GCC 8.1, Clang/LLVM 17.0.1, binutils 2.30, GNU Make 4.0. RISC-V-specific overrides in `arch/riscv/Kconfig`:
- binutils >= 2.36 - required for the assembler to accept explicit `zicsr`/`zifencei` extension strings in `-march=`.
- GCC < 11.3.0 gets a special-cased compatibility branch, because older GCC auto-appended `zicsr`/`zifencei` to `-march` itself; GCC >= 11.3 requires them spelled out explicitly.
- binutils >= 2.38 (or LLD) - needed to link Vector-extension (`V`) code paths.
- binutils >= 2.39 (or LLD) - needed for bit-manipulation extensions (Zba/Zbb/Zbc/Zbkb).
- A tracked ClangBuiltLinux issue disables `HAVE_LD_DEAD_CODE_DATA_ELIMINATION` when linking riscv with LLD.

**Known build failures.** None found beyond the two already-fixed CI/Kconfig breakages (`CONFIG_NONPORTABLE`, `CONFIG_RISCV_ISA_FALLBACK`), both merged. No open, unresolved riscv64 build failure was identified in this research.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps.** None identified. The driver is fully portable and no missing kernel subsystem, syscall, or feature restriction specific to riscv64 was found in this research.

**Performance gaps.** Curve25519 (handshake ECDH) and BLAKE2s (handshake hashing/KDF) run generic scalar C on riscv64, versus accelerated implementations on x86_64 (confirmed via Kconfig) and possibly ARM (Kconfig names "ARM," 32-bit-vs-64 not confirmed). Because these two primitives execute only once per session or rekey - not per packet - this is a handshake-latency/CPU-cost gap, not a steady-state throughput gap. No quantitative benchmark data (throughput, latency, cycles/byte) for WireGuard on RISC-V hardware was found anywhere in this research; general (non-RISC-V) WireGuard performance figures from wireguard.com and various VPN blogs exist but are not RISC-V-specific and are not cited here per the verification policy. An unverified academic claim (a 2021 IACR paper on a custom ChaCha instruction-set extension, not the mainline Zvkb implementation and not about WireGuard) was found but could not be verified against a second source and is excluded as evidence [NEEDS VERIFICATION - excluded].

**Security hardening gaps.** Data not available: no RISC-V-specific security hardening comparison (e.g. CFI, shadow stacks, KASLR parity) for WireGuard was found in this research.

**NaN/floating-point semantics.** Not applicable. WireGuard's cryptographic code paths are integer/bitwise operations; no floating-point-sensitive logic was identified.

## 7. CI/CD Infrastructure

Confirmed by direct file fetch (not inferred from README or commit-message claims alone, though the commit messages corroborate):

- `tools/testing/selftests/wireguard/qemu/arch/riscv64.config` exists with the content shown in Section 5.
- `tools/testing/selftests/wireguard/qemu/Makefile` contains an explicit `else ifeq ($(ARCH),riscv64)` branch (CHOST=riscv64-linux-musl, QEMU_ARCH=riscv64, KERNEL_ARCH=riscv, boots `arch/riscv/boot/Image` under `qemu-system-riscv64`), with a sibling `riscv32` branch, both listed in the Makefile's supported-architecture list alongside x86_64, arm, mips, powerpc, m68k, s390x.
- Two merged commits ([2022](https://git.zx2c4.com/wireguard-linux/commit/?id=9019b4f6d9bd88524ecd95420cf9cd4aaed7a125), [2024](https://git.zx2c4.com/wireguard-linux/commit/?id=aee4de74523d555025d308940d9db5f8d7d2bc28)) show this harness has been actively exercised and repaired over a 19-month span, not abandoned.

What is **not** present: no GitHub Actions workflow, Jenkinsfile, `.gitlab-ci.yml`, cron schedule, or webhook triggers this harness automatically. No public build-status badge or dashboard exists. The word "CI" traces to Donenfeld's own commit-message prose calling his manually-run QEMU harness "WireGuard CI" - an informal name for a maintainer-run pre-release test routine, not evidence of a continuously-triggered pipeline.

**RISE runners.** No RISE (RISC-V Software Ecosystem) involvement specific to WireGuard itself was found: no RISE blog post, no RISE repository, no funded RISE work item for WireGuard. WireGuard is queued but not yet written as a standalone RISE project-report (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`). The one indirect touchpoint: RISE's `python-wheels` repository builds and smoke-tests `mitmproxy-rs` (an unrelated package) on RISE RISC-V runners (`ubuntu-24.04-riscv`, Scaleway hardware), and that package's test suite happens to exercise its bundled `wireguard` key-generation submodule (`wireguard.genkey()`, `wireguard.pubkey()`) - this tests mitmproxy-rs's own WireGuard-key-generation bindings, not upstream WireGuard itself, and is not evidence of RISE CI for the actual WireGuard project.

| Architecture | CI exists | Automated trigger | Test execution | Public dashboard |
|---|---|---|---|---|
| amd64 | Yes (same harness) | No | Yes (manual) | No |
| arm64 | Data not available (harness targets "arm," arm64-specific status not confirmed) | No | Data not available | No |
| riscv64 | Yes (QEMU harness, confirmed by file fetch) | No | Yes (manual, `wg.success` gate) | No |

## 8. Distribution and Release Status

**Kernel driver.** No separate binary release exists or is expected - WireGuard ships as in-tree source, compiled into whatever riscv64 kernel image a distribution or user builds.

**PyPI.** The PyPI package named `wireguard` (`https://pypi.org/pypi/wireguard/json`) is an unrelated third-party Python config-generation helper by Fictive Kin LLC, not the real WireGuard project. It ships only a source sdist (`wireguard-1.0.2.tar.gz`), no wheels of any architecture, so "riscv64 wheel availability" does not apply to it. Citing this package as evidence of WireGuard riscv64 binary availability would be a category error.

**Ubuntu 26.04 (resolute).** Confirmed via direct fetch of the [package page](https://packages.ubuntu.com/resolute/riscv64/wireguard-tools) (not just the search index):

| Package | Architectures | riscv64 |
|---|---|---|
| `wireguard-tools` | amd64, arm64, armhf, ppc64el, riscv64, s390x | Yes, version 1.0.20250521-1ubuntu1 |
| `wireguard-go` | amd64, arm64, armhf, ppc64el, riscv64, s390x | Yes |
| `librust-netlink-packet-wireguard-dev` | amd64, arm64, armhf, ppc64el, riscv64, s390x | Yes |
| `wireguard` (metapackage) | all (arch-independent) | N/A - depends on the above |

**Arch Linux RISC-V.** Unconfirmed. The proposed search endpoint (`archriscv.felixc.at/?q=`) is non-functional - it returns the same static landing page regardless of query string. Direct mirror-path browsing (`riscv.mirror.pkgbuild.com/extra/os/riscv64/`, etc.) returned bare nginx 404s with no directory listing. A code search of the `archriscv-packages` override repository for "wireguard" returned zero matches, and the official Arch package page lists `wireguard-tools` as `x86_64`-only, meaning no riscv64-specific packaging override is known to exist. Any claim of Arch Linux RISC-V WireGuard availability should be treated as unsupported pending a working verification method.

**What a user does today.** On Ubuntu 26.04 riscv64, `apt install wireguard` (or `wireguard-tools` directly) installs a working userspace toolchain; the kernel module is already built into standard riscv64 Ubuntu kernel images with no manual compilation required. Data not available: this session's `project-graph` MCP tool failed to connect (`CONNECTION_CLOSED`), so the equivalent SPARQL-backed cross-check for other suites/architectures in the project's own dependency graph could not be run; the Ubuntu findings above rely on direct `packages.ubuntu.com` fetches instead.

## 9. Dependencies

Source: `drivers/net/wireguard/Kconfig` in [git.zx2c4.com/wireguard-linux](https://git.zx2c4.com/wireguard-linux), plus direct Ubuntu 26.04 (resolute) package lookups.

```
config WIREGUARD
    depends on NET && INET
    select NET_UDP_TUNNEL
    select DST_CACHE
    select CRYPTO_LIB_CURVE25519
    select CRYPTO_LIB_CHACHA20POLY1305
    select CRYPTO_LIB_UTILS
```

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Linux kernel (in-tree driver) | Hosts the WireGuard driver | Present - riscv64 is a first-class upstream kernel port | Kernel selftests are arch-generic and run on riscv64 CI elsewhere in the kernel project | Ships with every riscv64 kernel flavor | Not in `projects.yml`, no dedicated report |
| `CRYPTO_LIB_CURVE25519` | X25519 key exchange | Generic C, arch-independent, always buildable | Covered by generic `lib/crypto` self-tests | Built-in | No riscv64-accelerated backend (Section 4) |
| `CRYPTO_LIB_CHACHA20POLY1305` / `CRYPTO_LIB_UTILS` | AEAD cipher + shared helpers | Generic + riscv64 Zvkb accel path when available | Generic self-tests | Built-in | Accelerated on riscv64 with vector-crypto extension (Section 4) |
| `NET_UDP_TUNNEL`, `DST_CACHE` | UDP encapsulation, route caching | Arch-independent kernel core | Standard net-core coverage | Built-in | None |
| `wireguard-tools` (`wg`, `wg-quick`) | Userspace control plane | Confirmed built for riscv64 (Ubuntu) | Own test suite (`src/tests`); distro autopkgtest | Actively published for riscv64 (Ubuntu 26.04) | No dedicated report |
| `libc6`/glibc | Runtime C library | Confirmed present, riscv64/resolute | Covered by glibc's own riscv64 test matrix | Shipped | Tracked separately at `project-reports/glibc.md` |
| `nftables` (or `iptables`) | Firewall-mark policy routing for `wg-quick` | Confirmed present, riscv64/resolute | Own riscv64 CI/autopkgtest | Shipped | Tracked separately at `project-reports/nftables.md` |
| `openresolv`/`resolvconf` (Recommends) | Optional DNS push-down for `wg-quick` | Unresolved - dangling package reference in graph query, `packages.ubuntu.com` lookup hit a transient error during this research | N/A (soft dependency; `wg-quick` degrades gracefully without it) | Unconfirmed for riscv64 | Not install-blocking; worth a manual archive re-check |
| GCC, binutils, GNU Make (toolchain) | Compile kernel and `wireguard-tools` | Confirmed present, riscv64/resolute; riscv64 is a native Ubuntu port | Own extensive riscv64 test suites | Shipped natively | Tracked in `projects.yml` but no report file yet |
| `wireguard-dkms` (legacy, pre-5.6) | Out-of-tree fallback module | Not found/needed for riscv64 | N/A | Not shipped | Obsolete - Ubuntu 26.04's kernel is well past 5.6 |

Every hard dependency confirmed in this research (kernel, `wireguard-tools`, `libc6`, `nftables`/`iptables`, GCC, binutils, make) is present in Ubuntu 26.04 riscv64. The one soft dependency that did not resolve cleanly (`openresolv`/`resolvconf`) is Recommends-only and non-blocking. No riscv64-specific blocking issues were identified for WireGuard's build, test, or release status.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [commit 9019b4f6d](https://git.zx2c4.com/wireguard-linux/commit/?id=9019b4f6d9bd88524ecd95420cf9cd4aaed7a125) | riscv32 QEMU selftest kernel fails to boot after `CONFIG_PORTABLE`/`NONPORTABLE` split | Fixed (merged, in v6.0) | CI-breaking, not a correctness bug | Test-harness config gap, not a functional defect |
| [commit aee4de745](https://git.zx2c4.com/wireguard-linux/commit/?id=aee4de74523d555025d308940d9db5f8d7d2bc28) | riscv32/riscv64 QEMU selftest kernel fails to boot after ISA-string parsing change | Fixed (merged, in v6.9) | CI-breaking, not a correctness bug | Test-harness config gap, not a functional defect |

No open GitHub issue, kernel Bugzilla entry, or CVE specific to WireGuard-on-RISC-V correctness or performance was found. There is no open, unresolved riscv64 bug of any kind identified in this research; both known items are historical, fixed CI/config breakages.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found anywhere in this research (mailing list, commit messages, GitHub mirror). No organizational blocker exists: the driver has been in mainline since kernel 5.6 and required no architecture-specific acceptance decision because it is portable by construction. The only technical gap - absent RISC-V acceleration for Curve25519 and BLAKE2s - is not a blocker to functionality, only to handshake-path performance; the closest prior attempt (Bjorn Topel's 2023 BLAKE2s vector RFC) stalled on a dependency (the in-kernel-vector infrastructure) rather than on any WireGuard-specific objection, and that infrastructure has since landed in other forms (the general vector-crypto series). Acceptance probability for future RISC-V-specific optimization work is not meaningfully at risk from a governance standpoint - Donenfeld's own commits show he actively maintains the riscv64 CI/config surface when it breaks.

## 13. Readiness Assessment

- **Color:** Blue
- **Release provider:** Ubuntu (distro) - upstream (Jason A. Donenfeld / git.zx2c4.com) does not publish riscv64 (or any architecture's) binaries directly; the working, confirmed riscv64 `wireguard-tools`/`wireguard-go` binaries come from Ubuntu 26.04 (resolute).
- **Optimization gap:** partial - the per-packet, throughput-dominant data-plane primitives (ChaCha20 via RISC-V Vector Zvkb assembly, Poly1305 via scalar RV64 perlasm) are hand-tuned and merged in mainline `lib/crypto/riscv/`. The per-session handshake primitives (BLAKE2s, Curve25519) have no RISC-V-specific implementation anywhere in mainline and run generic scalar C. Zvkb (vector-crypto) closes the ChaCha20 gap already; a merged successor to Bjorn Topel's 2023 BLAKE2s vector RFC, plus a new RVV/Zvkned-class Curve25519 implementation, would close the remaining gap.
- **Justification:** WireGuard's own QEMU-based selftest harness genuinely builds and boots the kernel driver on riscv64 and gates on `wg.success` ([Makefile](https://git.zx2c4.com/wireguard-linux/plain/tools/testing/selftests/wireguard/qemu/Makefile), [riscv64.config](https://git.zx2c4.com/wireguard-linux/tree/tools/testing/selftests/wireguard/qemu/arch/riscv64.config)), which satisfies the "builds and tests pass" bar even though invocation is manual rather than automated. No upstream riscv64 binary artifact exists for any distribution channel checked; the working riscv64 package is published by Ubuntu, not upstream, which rules out green ([Ubuntu package page](https://packages.ubuntu.com/resolute/riscv64/wireguard-tools)). The partial optimization gap (2 of 4 crypto primitives accelerated) caps at blue, which matches the CI-derived primary grade - no further downgrade applies.
- **Pending work that could change the grade:** none identified that is currently in flight. No open PR or RISE-funded initiative targets WireGuard's riscv64 status specifically; WireGuard is only queued (unwritten) as a future RISE project-report. Converting the existing manual QEMU harness into an automated, RISE-runner-backed CI job, and completing RISC-V-vector implementations of BLAKE2s and Curve25519, are the two concrete levers that would move this project toward green (release-provider caveat aside) and toward a "full" optimization rating respectively - see Section 14.

## 14. Investment Analysis

RISE has no WireGuard-specific work in flight or funded (Section 7, Section 8). The only RISE touchpoint is incidental (WireGuard key-generation bindings inside the unrelated `mitmproxy-rs` package, tested on RISE runners) and does not reduce the scope below. All items below are therefore unclaimed.

### 14.1 Functional Enablement
No functional enablement work is required. WireGuard's kernel driver is architecture-agnostic and already builds, boots, and passes its own selftest on riscv64; userspace tooling is already packaged for riscv64 by Ubuntu.

### 14.2 Performance Optimization
Implement RISC-V Vector (RVV) accelerated BLAKE2s and Curve25519 in `lib/crypto/riscv/`, closing the two remaining unaccelerated primitives identified in Section 4. Bjorn Topel's 2023 RFC is a starting point for BLAKE2s but would need to be rebased onto the since-landed in-kernel-vector and vector-crypto infrastructure and carried through to merge; Curve25519 has no prior attempt to build on and would be new work. Both require kernel crypto-API familiarity and RISC-V vector-extension (RVV/Zvkb-class) assembly or intrinsics expertise, plus upstream kernel patch review cycles via the mailing list (Donenfeld as WireGuard maintainer, plus `lib/crypto` maintainers).

### 14.3 CI/CD Infrastructure
Convert the existing, already-working QEMU riscv64 selftest harness into an automated job (e.g. triggered on every patch series via a bot, using RISE RISC-V runners for native or QEMU execution) with a public pass/fail record. This is comparatively low effort since the harness itself already works and needs no new test logic - only automation and a visible dashboard.

### 14.4 Ecosystem Enablement
Not applicable - WireGuard has no dependent package ecosystem of its own (no PyPI/npm/Maven consumers depend on it as a library; it is a kernel driver plus a small standalone CLI). Section 10 is omitted per scope.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | RVV-accelerated Curve25519 for `lib/crypto/riscv/` | 3-6 | Kernel crypto contributor with RVV assembly experience | Medium |
| Performance | Revive and merge RVV-accelerated BLAKE2s (rebase Topel's 2023 RFC onto current vector infra) | 2-4 | Kernel crypto contributor with RVV assembly experience | Medium |
| CI/CD | Automate the existing QEMU riscv64 selftest harness (bot trigger + public dashboard) | 1-2 | Infrastructure engineer, coordinate with Donenfeld | Low |
| CI/CD | Confirm/extend Arch Linux RISC-V packaging (currently unconfirmed) | 0.5-1 | Distro packaging contributor | Low |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [WireGuard kernel source tree](https://git.zx2c4.com/wireguard-linux)
- [WireGuard homepage](https://www.wireguard.com/)
- [wireguard-tools source](https://git.zx2c4.com/wireguard-tools)
- [Commit 9019b4f6d9bd88524ecd95420cf9cd4aaed7a125 - set CONFIG_NONPORTABLE on riscv32](https://git.zx2c4.com/wireguard-linux/commit/?id=9019b4f6d9bd88524ecd95420cf9cd4aaed7a125)
- [Mailing-list mirror of the CONFIG_NONPORTABLE patch](https://lkml.rescloud.iu.edu/2208.1/08550.html)
- [Commit aee4de74523d555025d308940d9db5f8d7d2bc28 - set RISCV_ISA_FALLBACK on riscv{32,64}](https://git.zx2c4.com/wireguard-linux/commit/?id=aee4de74523d555025d308940d9db5f8d7d2bc28)
- [tools/testing/selftests/wireguard/qemu/Makefile](https://git.zx2c4.com/wireguard-linux/plain/tools/testing/selftests/wireguard/qemu/Makefile)
- [tools/testing/selftests/wireguard/qemu/arch/riscv64.config](https://git.zx2c4.com/wireguard-linux/tree/tools/testing/selftests/wireguard/qemu/arch/riscv64.config)
- [arch/riscv/Kconfig (toolchain version gating)](https://git.zx2c4.com/wireguard-linux/tree/arch/riscv/Kconfig)
- [Documentation/process/changes.rst (kernel toolchain minimums)](https://git.zx2c4.com/wireguard-linux/tree/Documentation/process/changes.rst)
- [lib/crypto/riscv directory listing](https://git.zx2c4.com/wireguard-linux/tree/lib/crypto/riscv)
- [LWN: RISC-V BLAKE2s Vector implementation RFC](https://lwn.net/Articles/944288/)
- [Mailing-list thread on the BLAKE2s RFC](https://lkml.iu.edu/hypermail/linux/kernel/2309.1/07923.html)
- [LWN: RISC-V vector cryptographic instruction set support](https://lwn.net/Articles/948871/)
- [Ubuntu 26.04 (resolute) wireguard-tools riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/wireguard-tools)
- [PyPI wireguard package JSON API (unrelated third-party package)](https://pypi.org/pypi/wireguard/json)
- [RISE project blog](https://riseproject.dev/blog)
- [riseproject-dev/sw-ecosystem project-reports queue](https://github.com/riseproject-dev/sw-ecosystem) (internal repository reference; `project-reports/.queue.yml`)
- [riseproject-dev/python-wheels build-mitmproxy-rs.yml workflow](https://github.com/riseproject-dev/python-wheels) (internal repository reference)
