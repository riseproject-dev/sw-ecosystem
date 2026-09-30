---
title: BuildKit
parent: Project Reports
color: yellow
categories:
  - containers
dependencies:
  - name: Go
    relation: build-dependency
    criticality: critical
  - name: containerd
    relation: runtime-dependency
    criticality: critical
  - name: runc
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: runtime-dependency
    criticality: critical
  - name: musl
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: xx
    relation: build-dependency
    criticality: critical
  - name: golang.org/x/sys
    relation: runtime-dependency
    criticality: optional
  - name: Alpine Linux
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="buildkit" %}

# BuildKit

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for BuildKit<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

BuildKit is the daemon and library that powers `docker build`. It provides a low-level build graph execution engine (LLB, Low-Level Builder), a Dockerfile frontend, a content-addressable cache, and a gRPC API consumed by Docker CLI, Buildx, and Kubernetes build infrastructure. It is the de-facto standard build backend for OCI container images in the open-source ecosystem. Repository: [moby/buildkit](https://github.com/moby/buildkit). Homepage: [docs.docker.com/build/buildkit](https://docs.docker.com/build/buildkit/). License: Apache License 2.0.

**Governance.** BuildKit lives under the [Moby Project](https://mobyproject.org) GitHub org. It is not affiliated with any foundation: no CNCF membership, no Linux Foundation project status, no independent foundation. No `GOVERNANCE.md` exists in the repo (confirmed 404); governance rules are documented informally in the `MAINTAINERS` file. Maintainer candidacy requires roughly 3 months of sustained contribution/review/triage before nomination; existing maintainers vote, requiring 66% approval over 5 business days. Inactivity (3 months) triggers a removal process, also resolvable by 66% vote. All changes require PR review; no direct pushes to master, including by maintainers.

The `MAINTAINERS` file lists 11 maintainers and 2 curators (Sebastiaan van Stijn `thaJeztah` and Shaun Thompson `thompson-shaun`).

| Maintainer | Handle | Company |
|---|---|---|
| Tonis Tiigi | tonistiigi | Docker |
| Ian Campbell | ijc | Docker |
| Tibor Vass | tiborvass | Docker |
| Shaun Thompson (curator) | thompson-shaun | Docker |
| Sebastiaan van Stijn (curator) | thaJeztah | Docker (known employee; personal email listed in `MAINTAINERS`) |
| Akihiro Suda | AkihiroSuda | NTT |
| Gabriel Adrian Samfira | gabriel-samfira | Cloudbase Solutions |
| Cory Bennett | coryb | Independent / unaffiliated |
| Kevin Alvarez | crazy-max | Independent / unaffiliated |
| Edgar Lee | hinshun | Independent / unaffiliated |
| Justin Chadwell | jedevc | Independent / unaffiliated |
| Kohei Tokunaga | ktock | Independent / unaffiliated |
| Erik Sipsma | sipsma | Independent / unaffiliated |

Docker effectively controls the maintainer majority (3 to 4 of 11 maintainer seats plus 1 of 2 curator seats); NTT and Cloudbase Solutions each hold one seat; the remainder are independent. Tonis Tiigi is the de-facto technical lead for riscv64: he authored the first riscv64 CI commit (2019), the original build-enablement PR (2021), and reviewed or merged most subsequent riscv64 PRs.

**Community posture on new ports.** Practice, not written policy, governs new architecture acceptance: cross-compilation works, CI builds pass, then a contributor provides hardware access or testing. When klecouvey asked in [Discussion #6485](https://github.com/moby/buildkit/discussions/6485) why `LinuxRiscv64` was absent from the LLB client platform constants, AkihiroSuda replied: "riscv64 wasn't popular in the past, and nobody has bothered to submit a PR to support riscv64 yet," and invited a contribution, which became [PR #6523](https://github.com/moby/buildkit/pull/6523). riscv64 (2019 binfmt, 2021 build enablement, 2026 LLB platform constant) and loong64 (archutil support added Dec 2024, [PR #5599](https://github.com/moby/buildkit/pull/5599)/[#5600](https://github.com/moby/buildkit/pull/5600)) were both added via ordinary PRs merged quickly with no recorded objections. No written port-acceptance policy exists, and no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` directory exists in the repo. `docs/freebsd.md` labels FreeBSD support explicitly "experimental," illustrating the project's informal, ad hoc way of signaling platform immaturity rather than a formal tier system; no equivalent label is applied to riscv64.

**RISE membership.** Not a member and no dedicated engagement. Confirmed by checking [riseproject.dev/blog](https://riseproject.dev/blog) (36 posts, May 2024 through Sep 2026, full sitemap scan plus the site's own search for "BuildKit" returning zero results), [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) (BuildKit not listed; not applicable since BuildKit ships no Python wheel), and a full listing of the `riseproject-dev` GitHub org's 26 repositories (no BuildKit-specific repo). The closest tangential mention is in RISE's [RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (2026-03-24, author Ludovic Henry, RISE): "Docker-in-Docker is available out of the box, so `docker build`, `docker run`, Docker Compose, and Buildx all work as expected" -- Buildx's engine is BuildKit, but the post never names BuildKit directly and gives no performance data. Routine dependabot PRs bumping `docker/setup-buildx-action` exist in `riseproject-dev/riscv-runner` (PR #116) and `riseproject-dev/pytorch-ci` (PR #15); these are CI dependency version bumps, not a funded BuildKit deliverable. The one direct "BuildKit RISC-V" search hit belongs to an unrelated third-party org, [gounthar/docker-for-riscv64](https://github.com/gounthar/docker-for-riscv64), not RISE.

## 2. Port History and Upstreaming Timeline

All riscv64 work is fully upstream in `moby/buildkit`. There is no downstream-only fork carrying riscv64 patches and no outstanding unmerged riscv64 patch.

| Date | Event | Source |
|---|---|---|
| 2019-06-04 | `binfmt_misc: add riscv64 detection` -- earliest riscv64 code in the repo, author tonistiigi (Docker) | [PR #1038](https://github.com/moby/buildkit/pull/1038) |
| 2021-07-05 | `enable riscv64 build` -- riscv64 added as a cross-compilation build target; author tonistiigi noted he lacked riscv64 hardware and asked community member carlosedp to test on real hardware; AkihiroSuda approved | [PR #2222](https://github.com/moby/buildkit/pull/2222) |
| 2023-02-12 | Earlier occurrence of a musl/clang linker failure ("unknown z ISA extension `zmmul`") cross-building runc/libseccomp for riscv64 via `xx` | [Issue #3625](https://github.com/moby/buildkit/issues/3625) |
| 2023-10-10 | riscv64 cross-build breaks: `clang-16: unable to execute command: Segmentation fault` in the `riscv64-alpine-linux-musl-clang` linker, opened by crazy-max; regression window pinpointed to ~2023-10-06, cross-referenced to [tonistiigi/xx#121](https://github.com/tonistiigi/xx) | [Issue #4316](https://github.com/moby/buildkit/issues/4316) |
| 2023-10-13 | `dockerfile: use glibc to build riscv64` -- workaround attempt switching riscv64 to glibc; abandoned draft, closed unmerged in favor of PR #4348 | [PR #4332](https://github.com/moby/buildkit/pull/4332) |
| 2023-10-17 | riscv64 temporarily removed from the build matrix while root-causing #4316 | [PR #4344](https://github.com/moby/buildkit/pull/4344) |
| 2023-10-18 | riscv64 re-enabled; root cause identified as the linker itself (`ld`), not musl as first suspected; fix bumps the `xx` cross-compilation helper to v1.3.0, which bundles binutils 2.41; backported same day to the v0.12 branch | [PR #4348](https://github.com/moby/buildkit/pull/4348), [PR #4351](https://github.com/moby/buildkit/pull/4351) |
| 2024-06-21 | riscv64 `archutil` probe binary regenerated by cyphar (SUSE) after a Debian package update changed assembler output | [PR #5068](https://github.com/moby/buildkit/pull/5068) |
| 2024-06-25 | Second archutil binary refresh (companion fix, same underlying cause) | [PR #5069](https://github.com/moby/buildkit/pull/5069) |
| 2026-01-22 | Community discussion opened: `LinuxRiscv64` absent from `client/llb/state.go` while other GA architectures have the constant | [Discussion #6485](https://github.com/moby/buildkit/discussions/6485) |
| 2026-02-16 | PR submitted to add the `LinuxRiscv64` platform constant, author klecouvey | [PR #6523](https://github.com/moby/buildkit/pull/6523) |
| 2026-02-19 | PR #6523 merged (after a squash-history revision requested by crazy-max and tonistiigi); merge commit `ff04044e4` | [PR #6523](https://github.com/moby/buildkit/pull/6523) |
| 2026-03-12 | Issue filed by gounthar (maintainer of the community `docker-for-riscv64` project) requesting official `linux/riscv64` release binaries; self-closed same day once the author verified BuildKit's official releases already ship `linux/riscv64` (example cited: `buildkit-v0.28.0.linux-riscv64.tar.gz`) | [Issue #6577](https://github.com/moby/buildkit/issues/6577) |
| 2026-09-30 | Latest release verified to still ship an official riscv64 tarball | [v0.33.0 release](https://github.com/moby/buildkit/releases/tag/v0.33.0) |

**On the exact version that introduced official riscv64 release binaries, the research is contradictory and should be flagged:** one line of research states the official riscv64 release-binary tarball was "introduced at v0.31.0 (Jun 2026)"; a separate, directly-verified check (HTTP 200 download of `buildkit-v0.28.0.linux-riscv64.tar.gz`, matching the exact filename cited in Issue #6577's own body from March 2026) shows the tarball was already being published at v0.28.0, which predates v0.31.0. The v0.28.0 availability is the better-evidenced claim (a live, successful download of the named artifact) and is treated as authoritative here; the "introduced at v0.31.0" claim is contradicted by it. [NEEDS VERIFICATION: the exact first release version is not independently pinned down beyond "no later than v0.28.0."]

**Key contributors and affiliations:**
- Tonis Tiigi (`tonistiigi`, Docker): initial port (2019-2021), archutil review, approvals of most riscv64 PRs
- Kevin Alvarez (`crazy-max`, independent): 2023 cross-build bug fix, riscv64 CI enable/disable commits, PR #6523 review
- Akihiro Suda (`AkihiroSuda`, NTT): maintainer, Discussion #6485 response, PR #6523 approval
- Aleksa Sarai (`cyphar`, SUSE) [NEEDS VERIFICATION on current employer]: archutil binary fix (PR #5068, 2024)
- klecouvey (independent): `LinuxRiscv64` constant (PR #6523, 2026)
- gounthar (independent, `docker-for-riscv64` maintainer, 117+ downstream riscv64 BuildKit releases on BananaPi F3 / SpacemiT K1 hardware): drove Issue #6577

## 3. Upstream Support Tier

BuildKit has no written tiered platform-support policy. Tier status must be inferred from CI coverage, release artifacts, and maintainer statements.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cross-compiled release binary | Yes | Yes | Yes (confirmed through v0.33.0, no later than v0.28.0) |
| Official Docker Hub image layer | Yes | Yes | Present in official binary tarballs; multi-arch `buildx-stable-1` image tag coverage for riscv64 is unconfirmed [NEEDS VERIFICATION, see Section 8] |
| Integration test CI | Yes (`ubuntu-24.04`) | No native runner; no riscv64-style test execution either | No: zero riscv64 references in `.test.yml`, `test-os.yml`, `dockerd.yml` |
| Native CI runner | Yes | Yes (`ubuntu-24.04-arm`, `validate.yml` only) | No |
| Build/publish CI | Yes | Yes | Yes: `docker-bake.hcl`'s `binaries-cross`, `image-cross`, `frontend-image-cross` targets, built on every push/PR/tag/daily schedule |
| Lint target inclusion | Yes | Yes | Conditional (`GOLANGCI_LINT_MULTIPLATFORM` gate) |
| `validate-archutil` CI target | Yes | Yes | No, explicitly absent |
| LLB client platform constant | Yes | Yes | Yes, since Feb 2026 (PR #6523) |

**Assessment.** riscv64 is a second-tier release platform: official binaries are published and it is treated equivalently to s390x and ppc64le in the platform matrix. It is not first-tier because there is no native CI runner and no functional test execution against riscv64 anywhere upstream. This is the basis for the yellow (build-only-ci) readiness grade (Section 13).

## 4. Technical Architecture and RISC-V-Specific Subsystems

BuildKit is written entirely in Go. There is no C++, Rust, or hand-written SIMD/assembly compute path in the core BuildKit codebase (`buildkitd`, `buildctl`). Confirmed by code search for `__riscv`, `vfloat32m1_t`, `rvv` against `moby/buildkit`: zero hits for all three, and no `arch/riscv/` directory, no RVV intrinsics, no Zba/Zbb usage, and no JIT/SIMD dispatch code anywhere in the tree. Architecture-specific behavior surfaces only through the `util/archutil` package, a QEMU-arch-name mapping table, and the LLB platform-constant list. There is no JIT, no architecture-specific crypto, and no GC barriers to implement (Go's runtime owns those).

### 4.1 util/archutil -- Architecture Probe

This package detects whether a host can execute binaries of each supported architecture, so BuildKit can report which platforms are available for multi-platform builds. The pattern is identical in shape across all 10 supported architectures (amd64, arm64, arm, 386, ppc64, ppc64le, s390x, mips64, mips64le, loong64, riscv64):

- `ARCH_binary.go` (build tag `!ARCH`): embeds a gzip-compressed pre-compiled ELF probe binary as a Go string constant.
- `ARCH_check.go` (build tag `!ARCH`): on non-native hosts, decompresses and runs the probe in a chroot to verify binfmt_misc / QEMU support.
- `ARCH_check_ARCH.go` (build tag `ARCH`): on native hosts, returns `("", nil)` without running a probe.

**riscv64 implementation:**
- `util/archutil/fixtures/exit.riscv64.s`: 5-line RV64I assembly (`li a0,0; li a7,93; ecall`), just `exit(0)`. No ISA extensions beyond baseline RV64I -- the only actual riscv64 machine instructions in the repository.
- `util/archutil/riscv64_binary.go`: generated by `make archutil`, embeds the gzip-compressed compiled probe.
- `util/archutil/riscv64_check.go`: non-native host probe runner (6 lines), structurally identical to the arm64/s390x/ppc64le equivalents.
- `util/archutil/riscv64_check_riscv64.go`: 6-line native-host stub, always reports supported. This is the correct implementation for riscv64, which (unlike amd64's v2/v3/v4 microarchitecture levels) has no sub-variant to detect; the same trivial-stub pattern is used by arm64, s390x, ppc64le.
- `util/archutil/detect.go` (207 lines, arch-agnostic): one `riscv64` branch in `SupportedPlatforms()` and one in `WarnIfUnsupported()`, both calling `riscv64Supported()` with no special-casing, no TODO, no early return.

A repository-wide search for `TODO riscv`, `FIXME riscv`, and `"not implemented" riscv` in this repo returns zero genuine hits (the one `TODO` match is Go's standard `context.TODO()` idiom appearing incidentally near an unrelated `riscv64` map entry in `exec_binfmt.go`).

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Probe binary | Yes (with feature-detecting fixture) | Yes | Yes (5-line, baseline RV64I only) |
| Native fast-path | `archvariant.AMD64Variant()` for v2/v3/v4 | `return "", nil` | `return "", nil` |
| Sub-variant detection | Yes (v2/v3/v4) | No | No |
| Implementation completeness | Full | Full | Full -- no gaps relative to arm64, s390x, or ppc64le |

### 4.2 LLB Client Platform Constants

`client/llb/state.go` defines named platform constants used by programmatic LLB graph builders. Before Feb 2026, `LinuxRiscv64` was absent -- a historical oversight (per AkihiroSuda's own account in Discussion #6485: "riscv64 wasn't popular in the past"), not a deliberate exclusion. PR #6523 added `LinuxRiscv64 = Platform(ocispecs.Platform{OS: "linux", Architecture: "riscv64"})`, giving full parity with `LinuxS390x`, `LinuxPpc64le`, and `LinuxArm64`. No variant field is set, correctly matching s390x and ppc64le.

### 4.3 binfmt_misc and QEMU

PR #1038 (Jun 2019) added riscv64 detection to the binfmt_misc component, enabling QEMU-based riscv64 execution from x86 hosts; this is the earliest riscv64 code in the repository, predating build enablement by two years. `solver/llbsolver/ops/exec_binfmt.go` maps `qemuArchMap["riscv64"] = "riscv64"` alongside every other emulated architecture (`arm64` to `aarch64`, `amd64` to `x86_64`, `s390x`, `ppc64le`), used when mounting a static QEMU emulator for cross-arch `RUN` execution -- full parity, no special-casing. The `binfmt-filter` Dockerfile stage still bundles `buildkit-qemu-riscv64`.

### 4.4 Release Packaging

The `Dockerfile` release stage builds `buildkit-$(version).$(TARGETPLATFORM).tar.gz` generically from `$TARGETPLATFORM`, with no per-architecture allowlist or exclusion -- riscv64 receives the same release-binary packaging as every other platform in BuildKit's cross-build matrix.

### 4.5 Vendored riscv64 Code (Not BuildKit's Own)

A repo-wide scan found riscv64 `.s` assembly files under `vendor/`, all belonging to third-party Go dependencies rather than authored by BuildKit: `vendor/golang.org/x/crypto/internal/poly1305/sum_riscv64.s`, `vendor/golang.org/x/sys/cpu/cpu_riscv64.s`, `vendor/golang.org/x/sys/unix/asm_linux_riscv64.s`, `vendor/golang.org/x/sys/unix/asm_bsd_riscv64.s`. These are standard Go toolchain/stdlib-adjacent syscall stubs and poly1305 crypto, unrelated to any BuildKit-authored SIMD/JIT logic.

### 4.6 ISA-Specific Optimizations

None in BuildKit's own code. The project performs no SIMD dispatch, no RVV intrinsics, and no vectorized compression or hashing directly; it delegates all compute-intensive work (compression, hashing, crypto) to external Go modules, which themselves fall back to pure-Go scalar code on riscv64 (Section 9).

**Overall:** on every axis this codebase actually has architecture-specific code for (the `archutil` check/binary/fixture triad, platform-constant wiring, QEMU arch-name mapping, release packaging), riscv64 has full structural parity with every other GA architecture except amd64, and amd64's extra code (microarchitecture-level ABI detection) is amd64-specific by definition, not a riscv64 deficiency. A "hand-tuned / intrinsics / scalar-fallback / missing" rubric, appropriate for a codec or crypto library, is a category error for BuildKit: it has no CPU-bound numerical/codec kernels of its own for any architecture.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** `make` (thin wrapper) delegating to `docker buildx bake`, with `docker-bake.hcl` as the platform-matrix source of truth. No CMake, Meson, or autoconf anywhere in the repo (`CMakeLists.txt`, `BUILDING.md`, `cmake/riscv64.cmake`, and equivalents do not exist; confirmed via direct fetch, all 404).

**Go toolchain:** `go 1.26.8` (from `go.mod`), Dockerfile base image `golang:1.26-alpine3.23`. This is bumped from `go 1.25.9` used earlier in 2026; the bump is generic and not riscv64-specific.

**Cross-compilation toolchain:** `tonistiigi/xx:1.9.0` (`ARG XX_VERSION=1.9.0` in `Dockerfile`, unchanged across this reporting period). The `xx` helper provides `xx-go`, `xx-apk`, `xx-clang`, `xx-verify` wrappers for transparent cross-compilation, and depends on Alpine's `musl` libc and LLVM's `clang`/`lld` for the CGo cross-compile path.

**Critical toolchain version dependency.** In October 2023, riscv64 builds broke with `clang-16: unable to execute command: Segmentation fault` in the `riscv64-alpine-linux-musl-clang` linker step while cross-building runc. The regression was initially suspected to be an Alpine `musl` package change (`1.2.4-r1` to `1.2.4-r2`) but PR #4348's author identified the actual fault as being in the linker (`ld`) itself, not musl. The fix bumped `xx` to v1.3.0, which bundles binutils 2.41. Builds using `xx` below v1.3.0 will fail for riscv64 with this linker segfault. An earlier, same-class failure ("unknown z ISA extension `zmmul`") was reported in Feb 2023 (Issue #3625). [Issue #4316](https://github.com/moby/buildkit/issues/4316), [PR #4348](https://github.com/moby/buildkit/pull/4348).

**CGo status by component:**
- `buildkitd`, `buildctl`, `rootlesskit`, `stargz-snapshotter`: `CGO_ENABLED=0`, pure Go, no C dependency.
- `runc`: `CGO_ENABLED=1` with `musl-dev gcc libseccomp-dev libseccomp-static` installed via `xx-apk`, linked with `lld` (`-fuse-ld=lld`). Build tags: `apparmor seccomp netgo cgo static_build osusergo`.
- `containerd-build`: `CGO_ENABLED=1 CGO_LDFLAGS="-fuse-ld=lld"` with `musl-dev gcc` via `xx-apk`.

`lld` (LLVM's linker) is required for all CGo cross-compilation targets, and Alpine's `musl` libc is the C library used for the CGo build.

**Build commands for riscv64:**

Cross-compiled binary from any host:
```
docker buildx bake binaries-cross
```

Single-platform targeted build:
```
docker buildx build --platform linux/riscv64 --target binaries -o ./bin .
```

Multi-arch Docker image including riscv64:
```
docker buildx bake image-cross
```

Download the pre-built release binary directly:
```
wget https://github.com/moby/buildkit/releases/download/v0.33.0/buildkit-v0.33.0.linux-riscv64.tar.gz
tar -xvf buildkit-v0.33.0.linux-riscv64.tar.gz
```

**QEMU requirement for cross-build:** `docker/setup-qemu-action` must be active on the build host to assemble riscv64 image layers via buildx; the CI workflow enables QEMU for its multi-platform build jobs. Actual binary compilation is native Go cross-compilation on the x86 host (`GOARCH=riscv64`), not QEMU-executed; QEMU is used for image assembly and for the archutil host-support probe, not for compiling Go code.

**Known build fragility.** The pre-compiled riscv64 ELF probe binary in `util/archutil/riscv64_binary.go` is checked into the repository. When the host assembler produces different output (due to upstream Debian/Alpine package updates), the stored binary goes stale and CI fails. This happened twice in June 2024 (PRs #5068, #5069); in both cases only ELF metadata (e.g. a `.riscv.attributes` section) changed, not the `.text` section. Tonis Tiigi flagged this pattern as fragile in review. There is no automated test that detects binary staleness before CI fails on it.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build and run `buildkitd` / `buildctl` | Yes | Yes | Yes |
| Multi-platform image build (as host) | Yes | Yes | Yes |
| LLB client `Linux*` platform constant | Yes | Yes | Yes, since Feb 2026 |
| binfmt_misc detection | Yes | Yes | Yes, since Jun 2019 |
| QEMU emulation of foreign arches | Yes | Yes | Yes (bundled in image) |
| Official release binary tarball | Yes | Yes | Yes, confirmed through v0.33.0 |
| Docker Hub multi-arch image | Yes | Yes | Present in binary tarballs; image-tag coverage unconfirmed [NEEDS VERIFICATION] |
| Official Debian/Ubuntu package | No (Docker ships its own apt repo, not a distro package) | No | No |
| CGo components (runc, containerd-shim) | Yes | Yes | Yes, cross-compiled, not CI-tested |
| Microarchitecture sub-variant detection | Yes (v2/v3/v4) | No | No |
| `validate-archutil` CI target | Yes | Yes | No |
| Native CI runner | Yes | Yes (`validate.yml` only) | No |
| Integration test execution in CI | Yes | No | No |
| RVV / SIMD acceleration | N/A | NEON (via deps) | No RVV path anywhere |

**Functional gaps:** None found. Every BuildKit feature is available on riscv64. The one historical functional gap -- absence of `LinuxRiscv64` in `client/llb/state.go` -- was closed in Feb 2026 (PR #6523).

**Performance gaps:** Compression throughput (zstd, gzip, snappy via `klauspost/compress`) will be lower than on amd64 (AVX2/AVX-512 paths) or arm64 (NEON path) because there is no RVV path for riscv64; pure-Go scalar code runs instead. No exact-number benchmark (build-time comparison, throughput, or riscv64-vs-arm64 delta) could be located in any source checked: the RISE blog (36 posts scanned), the `gounthar/docker-for-riscv64` project's `BUILDKIT-TESTING.md` (qualitative claims only: "performance comparable to native Docker builds," "no significant overhead," CI packaging time of "~10-20 minutes" on a BananaPi F3 -- not a build-execution benchmark), and general web search (budget-limited this session; DuckDuckGo/Bing fallbacks were blocked by CAPTCHA). This is a genuine data gap, not a number to be estimated.

**Security hardening gaps:** seccomp and AppArmor are applied to runc identically on amd64/arm64/riscv64. No riscv64-specific hardening gap was identified.

**NaN / floating-point semantics:** Data not available. No riscv64-specific floating-point issue was found in the `moby/buildkit` issue tracker (a targeted "riscv nan floating" search returned the same generic issue set as a plain riscv64 search, indicating no such issue exists), and no compliance or benchmark data exists for riscv64 floating-point behavior in BuildKit.

## 7. CI/CD Infrastructure

**Literal grep of workflow YAML is misleading and must not be used alone.** `grep -rniH "riscv" .github/workflows/` across all 12 files (`buildkit.yml`, `buildx-image.yml`, `compatibility-releases.yml`, `dockerd.yml`, `docs-upstream.yml`, `frontend.yml`, `labeler.yml`, `pr-assign-author.yml`, `test-os.yml`, `.test.yml`, `validate.yml`, `zizmor.yml`) returns zero matches. No workflow file contains the literal string "riscv" anywhere.

**riscv64 is nonetheless built in CI, injected at runtime from `docker-bake.hcl`.** `docker-bake.hcl` defines:
- `binaries-cross` (inherited by `release`): platforms include `linux/riscv64` alongside `darwin/amd64`, `darwin/arm64`, `linux/amd64`, `linux/arm/v7`, `linux/arm64`, `linux/s390x`, `linux/ppc64le`, `windows/amd64`, `windows/arm64`.
- `image-cross`: platforms include `linux/riscv64` alongside `linux/amd64`, `linux/arm/v7`, `linux/arm64`, `linux/s390x`, `linux/ppc64le`.
- `frontend-image-cross` (consumed by `frontend.yml`): also includes `linux/riscv64`.
- `lint` (consumed by `validate.yml`): conditionally includes `linux/riscv64` in a multiplatform golangci-lint matrix, gated behind `GOLANGCI_LINT_MULTIPLATFORM != null`.

`.github/workflows/buildkit.yml` triggers on `schedule: '0 10 * * *'` (daily), `workflow_dispatch`, `push` to `master`/`v[0-9]+.[0-9]+` branches and `v*` tags, and `pull_request`. Its `binaries` job (bake target `release`, which inherits `binaries-cross`) and `image` job (bake target `image-cross`) both therefore build `linux/riscv64` on every push, every PR, every tag, and daily. `.github/workflows/frontend.yml` has the same trigger shape and invokes `frontend-image-cross`, likewise building riscv64. This is a real, verified CI-build path for riscv64, not a false positive from a naive text search.

**All jobs run on `ubuntu-24.04` (standard x86_64 GitHub-hosted runners).** There is no dedicated riscv64 runner and no native riscv64 execution anywhere in these workflows; riscv64 outputs (Go binaries and OCI image layers) are produced via Go's native cross-compilation (`GOARCH=riscv64`) and buildx cross-platform image assembly on x86 hosts. By contrast, `test-os.yml`'s `sandbox-build` job does have a conditional `ubuntu-24.04-arm` runner for `linux/arm64` -- riscv64 has no such counterpart.

**Build/publish only, never test.** The `binaries` job cross-builds release binaries (a build artifact) and signs them only when `github.event_name != 'pull_request'`. The `image` job cross-builds OCI images and pushes only on schedule, master, or tag events. Separately, `.test.yml`, `test-os.yml`, and `dockerd.yml` (the actual test-execution workflows) contain zero riscv64 references; their platform/OS matrices are limited to `windows/amd64`, `freebsd/amd64`, `linux/amd64`, `linux/arm64`, `windows-2022`. No unit test, integration test, or sandbox test ever runs on or against riscv64. [NEEDS VERIFICATION: whether the external reusable workflow `docker/github-builder/.github/workflows/bake.yml`, which lives in a different repository, uses QEMU or a native Go cross-compiler internally for the riscv64 leg -- not fetched in this research.]

**RISE runners.** RISE announced free, native RISC-V GitHub Actions CI runners in March 2026 ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). No evidence exists that BuildKit maintainers have applied for or adopted them; there is no RISE involvement with this project at all (Section 1).

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (`ubuntu-24.04`) | Yes (`ubuntu-24.04-arm`, `validate.yml` only) | No |
| Cross-compile build CI | Yes | Yes | Yes |
| Integration tests | Yes | No | No |
| `validate-archutil` | Yes | Yes | No |
| Lint (conditional) | Yes | Yes | Yes (conditional) |

## 8. Distribution and Release Status

**Official upstream GitHub release binaries: confirmed available, highest-confidence evidence.** Direct HTTP checks against the real GitHub release-download endpoint (not a scraped HTML page, which lazy-loads and can under-report the asset list) confirm: `buildkit-v0.33.0.linux-riscv64.tar.gz` (current latest release) returns HTTP 200; `buildkit-v0.28.0.linux-riscv64.tar.gz` (the filename cited in Issue #6577's own body) also returns HTTP 200. A deliberately fabricated filename and a fake tag both correctly returned HTTP 404, ruling out a proxy/redirect false positive. The v0.33.0 archive (90.5 MB) was downloaded and extracted; every binary inside (`bin/buildkitd`, `bin/buildctl`, `bin/buildkit-runc`, `bin/buildkit-cni-*`) reports as `ELF 64-bit LSB ... UCB RISC-V ... statically linked` via `file` -- these are genuine compiled riscv64 binaries, not placeholders. Per-asset SBOM/provenance/sigstore filenames for the riscv64 artifact specifically could not be confirmed (guessed filenames 404'd; inconclusive, not a confirmed regression) [NEEDS VERIFICATION].

**Docker Hub multi-arch image: a real discrepancy in the research, flagged rather than resolved.** Search snippets indicate the official `moby/buildkit:buildx-stable-1` container *image* tag may not currently include a riscv64 manifest variant, even though the official *binary tarballs* do include riscv64. Binary-artifact support and multi-arch image-tag support appear to be at different states of completeness. This was not independently re-confirmed against the current manifest in this research pass and should be checked directly (`docker buildx imagetools inspect moby/buildkit:buildx-stable-1`) before being relied on for a riscv64 Kubernetes build-infrastructure deployment decision. [NEEDS VERIFICATION.]

**Ubuntu 26.04 ("resolute"): contradictory findings, cite both.** One research pass, using a direct `curl` fallback after transient 503s on `packages.ubuntu.com`, got a clean result: "Sorry, your search gave no results" for `buildkit`/`python3-buildkit`/`libbuildkit` in resolute, for any architecture -- and separately confirmed the search page does list riscv64 as a valid, selectable architecture for resolute, meaning the absence is specific to this package rather than a platform gap. A second, later adversarial-verification pass got persistent HTTP 503 from both WebFetch and `curl` on every attempt and could not reach a verdict, explicitly marking the channel "unverified" rather than "no package." Given the first pass's successful (non-503) response with an explicit "no results" page, "no riscv64 Ubuntu 26.04 package for BuildKit" is treated as the better-supported conclusion here, with the caveat that a later check hit an unrelated availability problem with the packages.ubuntu.com service itself.

**Debian:** Not packaged. `tracker.debian.org/pkg/buildkit` returns 404; `packages.debian.org` search returns zero results.

**PyPI:** The `buildkit` package on PyPI (currently v0.2.2, 3 releases total, last published circa 2011 by an unrelated author) is a defunct, unrelated Python project ("Cloud infrastructure and .deb file management software"). Not applicable to moby/buildkit.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/buildkit/` 302-redirects to the same unrelated PyPI project. No riscv64 wheel exists because there is nothing Python here to wheel; confirms RISE has not built anything under this package name.

**Arch Linux RISC-V port:** Not listed at `archriscv.felixc.at` (fetched site search and root page directly). Does not contradict GitHub-release availability; the Arch RISC-V porters simply have not repackaged upstream's own binaries.

**What a user must do to get a working binary on riscv64 today:**
- Option A (recommended): download `buildkit-v0.33.0.linux-riscv64.tar.gz` from the [GitHub Releases page](https://github.com/moby/buildkit/releases/tag/v0.33.0).
- Option B: build from source with `docker buildx bake binaries-cross` on any x86/arm64 host with Docker and QEMU configured.
- Option C: pull the `moby/buildkit` Docker image and select the `linux/riscv64` variant, after first confirming (Section 8's flagged discrepancy) that the specific tag in use actually carries a riscv64 manifest.

## 9. Dependencies

**Direct dependencies:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| Go | Build toolchain (`go 1.26.8`, Dockerfile base `golang:1.26-alpine3.23`) | N/A (toolchain itself) | N/A | Official Go riscv64 toolchain/port | Critical: every BuildKit binary is compiled by it |
| containerd | Container runtime: image pull, snapshot, layer unpack (`containerd/containerd` v2, v2.2.5) | Builds (Go, generic) | Not tested upstream | No official upstream riscv64 release binary | Critical, runtime path. Open: [containerd#13020](https://github.com/containerd/containerd/issues/13020), [containerd#13124](https://github.com/containerd/containerd/issues/13124) requesting riscv64 in the CI matrix, neither acted on |
| runc | OCI runtime invoked for every `RUN` instruction (via `go-runc` v1.1.0) | Builds, CGo + seccomp, cross-compiled via `xx` | Not CI-tested by either project | Yes, official `runc.riscv64` release binary since v1.2.0 | Critical, security-sensitive. [runc#5166](https://github.com/opencontainers/runc/issues/5166) requesting riscv64 CI closed without action; CGo/seccomp path is untested on riscv64 by either upstream project |
| QEMU | Provides the binfmt_misc riscv64 emulator bundled in the BuildKit image, and cross-arch `RUN` execution | N/A (bundled emulator) | N/A | `buildkit-qemu-riscv64` retained in the `binfmt-filter` Dockerfile stage | Critical for foreign-arch image builds and for the archutil non-native probe |
| musl | C library used for the CGo cross-compile path (`riscv64-alpine-linux-musl-clang`) via Alpine/`xx-apk` | Directly implicated in the Oct 2023 and Feb 2023 riscv64 linker failures | N/A | N/A (build-time only) | Critical: the 2023 riscv64 build breakage traced to this toolchain layer (root cause ultimately the linker, not musl itself) |
| LLVM | Provides `clang`/`lld`, the compiler and linker used for all riscv64 CGo cross-compilation (via `xx`) | The Oct 2023 fix was an `xx` bump bundling binutils 2.41 to work around a `clang`/`lld` linker segfault | N/A | N/A (build-time only) | Critical, same incident as musl above |
| xx (`tonistiigi/xx`) | Cross-compilation helper toolchain (`xx-go`, `xx-apk`, `xx-clang`, `xx-verify`), pinned at v1.9.0 | riscv64 support has historically trailed fixes in this upstream project (`tonistiigi/xx#121` for 2021 enablement; v1.3.0/binutils 2.41 for the 2023 fix) | N/A | N/A (build-time only) | Critical: every riscv64 CGo cross-compile depends on this project's own riscv64 support being correct |
| golang.org/x/sys | Low-level syscall bindings; includes vendored riscv64 assembly (`cpu_riscv64.s`, `asm_linux_riscv64.s`, `asm_bsd_riscv64.s`) | Builds, native riscv64 assembly (Go stdlib-adjacent, not BuildKit-authored) | Covered by upstream Go project testing, not BuildKit-specific | Go module | Optional in the sense that no BuildKit-specific riscv64 issue traces to it |
| Alpine Linux | Base image and package source for `xx-apk`-installed build dependencies (`musl-dev`, `gcc`, `libseccomp-dev`) | riscv64 package availability directly implicated in the 2023 linker regression (musl package version bump was the initial suspect) | N/A | riscv64 is a supported Alpine architecture | Optional/build-time, but the version of Alpine in use gates which musl/gcc versions are available for riscv64 cross-builds |

**Additional indirect dependencies found via research (not in the direct list, recursed one level from `go.mod`):**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| klauspost/compress v1.18.6 | zstd/gzip/snappy for layer blobs and cache | Builds; pure-Go fallback | No riscv64 CI | Go module | No blocking issues; no RVV path (performance gap, Section 6) |
| containerd/stargz-snapshotter v0.18.2 | Lazy image loading (optional, bundled) | Builds | Not tested | No riscv64 binary | No functional issues found |
| ProtonMail/go-crypto v1.3.0 | OpenPGP, SSH auth, sigstore | Builds (pure Go) | No riscv64 tests | Go module | None found |
| sigstore/sigstore-go v1.2.1 | SLSA provenance, SBOM attestation | Builds (pure Go) | No riscv64 tests | Go module | None found |
| cespare/xxhash/v2 v2.3.0 | Non-crypto hash for cache keys | Builds; pure-Go fallback (x86 asm absent on riscv64) | No riscv64 CI | Go module | Minor perf gap; separately tracked as [xxHash](project-reports/xxhash.md) in `projects.yml` |
| go.etcd.io/bbolt v1.4.3 | Embedded KV store for content metadata | Builds | No riscv64 CI | Go module | None found |
| containerd/nydus-snapshotter v0.15.15 | FUSE lazy loading (optional) | Go wrapper builds; Rust `nydusd` daemon status unclear | Not tested | No riscv64 binary upstream | `nydusd` Rust daemon has incomplete riscv64 support; not in the default `buildkitd` configuration |
| planetscale/vtprotobuf v0.6.1 | Protobuf codegen for the LLB wire format | Builds (codegen only) | N/A | Go module | None found |

**Deep-dive on the two critical runtime dependencies.**

**containerd (critical path).** Every `buildkitd` operation that pulls or unpacks an image invokes containerd. Two open issues, [containerd#13020](https://github.com/containerd/containerd/issues/13020) and [containerd#13124](https://github.com/containerd/containerd/issues/13124), request riscv64 in containerd's own Linux integration test matrix; neither has been acted on. There is no upstream containerd riscv64 release binary. This means riscv64 `buildkitd` depends on a containerd binary that has never been integration-tested on riscv64 by the upstream containerd project itself. Community operators report this working (gounthar's native-hardware testing referenced in Issue #6577), but it is unverified by either upstream project. See [project-reports/containerd.md](project-reports/containerd.md) for containerd's own riscv64 status.

**runc (critical path, CGo).** Every `RUN` Dockerfile instruction invokes runc. The runc riscv64 binary has been published in official releases since v1.2.0. [runc#5166](https://github.com/opencontainers/runc/issues/5166) requesting riscv64 CI was closed without action. The CGo-compiled seccomp and AppArmor paths have not been tested on riscv64 by the upstream runc project. Risk: a bug in the seccomp filter table or the CGo/musl linkage on riscv64 would cause container sandbox failures with no upstream CI gate catching it. See [project-reports/runc.md](project-reports/runc.md).

**musl / LLVM / xx toolchain chain.** riscv64 support in BuildKit has, historically, always trailed fixes or features in the `tonistiigi/xx` cross-compilation project, which itself sits on top of Alpine's `musl` and LLVM's `clang`/`lld`. Both riscv64 correctness incidents found in this repo's history (#3625 in Feb 2023, #4316 in Oct 2023) were toolchain/linker problems in this musl-based cross-compiler chain, not BuildKit logic bugs. This is a structural dependency risk: a future Alpine `musl` or LLVM update could reproduce the same class of failure, and BuildKit has no riscv64 CI to catch a regression before it reaches a tagged release (Section 7).

## 11. Known Bugs and Active Issues

No open riscv64-specific correctness or performance bug exists in `moby/buildkit` as of 2026-09-30. All riscv64-relevant issues found are closed.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #3625](https://github.com/moby/buildkit/issues/3625) | Error cross building runc for riscv64 arch | Closed (2023-02-12) | Was high (build broken) | musl/clang linker rejected the `zmmul` ISA extension; predecessor of #4316 |
| [Issue #4316](https://github.com/moby/buildkit/issues/4316) | Error cross building for riscv64 arch | Closed, fixed by PR #4348 (2023-10-18) | Was high (builds broken) | Root cause: linker (`ld`) fault surfaced through the `xx` toolchain, not musl itself as initially suspected; fix: `xx` v1.3.0 |
| [Discussion #6485](https://github.com/moby/buildkit/discussions/6485) | RISCV64 architecture and the LLB client | Resolved by PR #6523 (2026-02-19) | Was low (API completeness) | `LinuxRiscv64` platform constant added |
| [Issue #6577](https://github.com/moby/buildkit/issues/6577) | Add linux/riscv64 to official release binaries | Closed, self-resolved same day (2026-03-12) | Was medium | Author verified official releases already ship `linux/riscv64`; no maintainer action needed |

**Open general (non-riscv64-specific) issues surfaced by broader searches, included for completeness and explicitly not riscv64 bugs:** [Issue #1961](https://github.com/moby/buildkit/issues/1961) (s390x QEMU segfault), [Issue #4082](https://github.com/moby/buildkit/issues/4082) (linux/arm64 variant ignored), [Issue #5129](https://github.com/moby/buildkit/issues/5129) (fails to build on mips64), [Issue #6871](https://github.com/moby/buildkit/issues/6871) (bind mounts + chroot, opened 2026-06-14), [Issue #6380](https://github.com/moby/buildkit/issues/6380) (ADD --checksum HTTP error hiding), [Issue #6055](https://github.com/moby/buildkit/issues/6055) (rootless config file not accepted). None of these are riscv64-specific.

**Latent risk, not an open bug: archutil binary staleness.** The pre-compiled riscv64 ELF probe binary checked into `util/archutil/riscv64_binary.go` must be manually regenerated whenever the upstream assembler changes its output format; this broke CI twice in June 2024 (PRs #5068, #5069) over ELF metadata changes alone. There is no automated staleness detector.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. The maintainer response to the missing `LinuxRiscv64` constant (Discussion #6485) was explicitly welcoming ("nobody has bothered to submit a PR... yet"), and every riscv64 PR examined in this research was merged without recorded maintainer resistance. The October 2023 temporary disable (PR #4344) was a pragmatic "fix CI first" move, resolved within a day.

**Technical blockers:** None currently open. riscv64 builds, runs per community operator reports, and ships in official releases. The main technical risk is the archutil binary-staleness pattern (Section 5) and the untested CGo/seccomp path in runc (Section 9), not any BuildKit-side objection.

**Organizational blockers:** The absence of native riscv64 CI is the primary structural gap between riscv64 and first-tier status. Closing it requires either RISE runners (announced, not adopted by BuildKit; Section 7) or an equivalent hardware sponsorship; the project has no independent mechanism to fund runners itself.

**Acceptance probability for new riscv64 contributions: high.** Every technically sound riscv64 PR examined was accepted quickly: PR #6523 (LLB platform constant) merged in 3 days; PR #4348 (2023 build fix) merged same-day as its identifying issue. No policy barrier was found in governance documents or PR history.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Justification:** BuildKit's upstream CI (`docker-bake.hcl`'s `binaries-cross`/`image-cross`/`frontend-image-cross` targets, invoked by [`.github/workflows/buildkit.yml`](https://github.com/moby/buildkit/blob/master/.github/workflows/buildkit.yml) and [`.github/workflows/frontend.yml`](https://github.com/moby/buildkit/blob/master/.github/workflows/frontend.yml)) builds `linux/riscv64` on every push, PR, and daily schedule, but no upstream job ever runs the test suite against riscv64 (`.test.yml`, `test-os.yml`, `dockerd.yml` have zero riscv64 references; every runner is `ubuntu-24.04` x86_64 with no native or QEMU-executed riscv64 test path). Per the project-color-coding CI evidence rule, build-without-test caps the primary grade at yellow regardless of release status. Upstream does publish official riscv64 release binaries directly (continuously through [v0.33.0](https://github.com/moby/buildkit/releases/tag/v0.33.0)) and a Docker Hub multi-arch image, so `release_provider` is upstream, not a mitigating factor that can raise the grade past yellow on its own. BuildKit is a build-graph execution engine, not a performance-optimization library, so the Step 2 optimization modifier does not apply.
- **Pending work that could change the grade:** No open PR or issue would change this grade -- [Issue #6577](https://github.com/moby/buildkit/issues/6577), the last riscv64-relevant issue, is already closed as resolved. Applying for RISE's free native RISC-V GitHub Actions runners and wiring them into `.test.yml` is the single highest-value change that would move riscv64 past build-only CI (Section 14); no evidence was found that BuildKit maintainers have taken this up. There is no RISE involvement in this project currently (Section 1).

## 14. Investment Analysis

RISE has not funded or contributed any BuildKit work (Section 1). The community contributor gounthar drove the inclusion of riscv64 official release binaries with native-hardware validation on his own downstream project. All investment sizing below starts from the current state: official riscv64 binaries through v0.33.0, no upstream riscv64 CI test execution, `LinuxRiscv64` platform parity already complete.

### 14.1 Functional Enablement

No functional gaps exist. Every BuildKit feature, including the LLB client platform constant, is available on riscv64 (Section 6).

### 14.2 Performance Optimization

The only identified performance gap is compression throughput: `klauspost/compress` has no RVV path for riscv64 and falls back to pure-Go scalar code, versus AVX2/AVX-512 on amd64 and NEON on arm64 (Section 6, Section 9). This work belongs to the `klauspost/compress` project, not BuildKit itself; no exact-number benchmark exists to size the real-world impact, which is itself a research gap worth closing before committing engineering effort here. Within BuildKit's own code there is no SIMD dispatch to add -- the project defers all compute to external libraries by design (Section 4).

### 14.3 CI/CD Infrastructure

The highest-value investment is applying for RISE's free native riscv64 GitHub Actions runners and wiring them into `.test.yml` so the existing integration test suite actually executes against riscv64, closing the single gap that caps the readiness grade at yellow (Section 13). Secondary, lower-priority item: add riscv64 to the `validate-archutil` CI target (the probe-binary pattern already works without it; this would only reduce the archutil-staleness maintenance burden, Section 5).

### 14.4 Ecosystem Enablement

BuildKit itself has no dependent package ecosystem (no plugins, no extensions, no language bindings requiring separate riscv64 builds) -- see the omission of a dedicated Ecosystem Status section. However, BuildKit is infrastructure for producing other software, so its two critical runtime dependencies are the real ecosystem-enablement lever: driving riscv64 CI in containerd ([containerd#13020](https://github.com/containerd/containerd/issues/13020), [containerd#13124](https://github.com/containerd/containerd/issues/13124)) and adding riscv64 CI to runc ([runc#5166](https://github.com/opencontainers/runc/issues/5166)) would close the two largest correctness-confidence gaps in the stack BuildKit sits on. This is upstream containerd/runc work, not BuildKit work, and should be sized and owned separately (see their own reports).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Apply for RISE runners; wire riscv64 into `.test.yml` integration test matrix | 1-2 | BuildKit maintainer or contributor | High |
| CI/CD | Add riscv64 to `validate-archutil` target | 0.5 | BuildKit contributor | Medium |
| Functional | None -- no functional gaps | 0 | N/A | N/A |
| Performance | Size and, if justified, implement RVV paths in `klauspost/compress` (zstd, gzip) | 1 (sizing/benchmarking first) + 8-16 (implementation, contingent) | `klauspost/compress` contributor | Low until a benchmark justifies it |
| Dependencies | Drive riscv64 CI in containerd (#13020, #13124) | 4-8 | containerd contributor | High |
| Dependencies | Verify runc seccomp/CGo path on riscv64 native hardware; add riscv64 to runc CI (#5166) | 2-4 | runc contributor | High (security correctness gate) |
| Distribution | Confirm (or fix) riscv64 manifest coverage on the `moby/buildkit` Docker Hub multi-arch image tags | 0.5 (verification) | BuildKit maintainer | Medium |

**Highest-return item:** RISE runner integration into `.test.yml` (1-2 person-weeks) closes the single gap holding the readiness grade at yellow, at near-zero cost given the runners are free. The containerd and runc CI gaps are the most significant correctness risks in the dependency stack; they sit in dependency repositories, not in BuildKit itself, and should be tracked as separate investment items against those projects.

## 15. References

- [BuildKit documentation](https://docs.docker.com/build/buildkit/)
- [moby/buildkit repository](https://github.com/moby/buildkit)
- [moby/buildkit MAINTAINERS file](https://raw.githubusercontent.com/moby/buildkit/master/MAINTAINERS)
- [docker-bake.hcl -- platform matrix source of truth](https://raw.githubusercontent.com/moby/buildkit/master/docker-bake.hcl)
- [util/archutil directory](https://github.com/moby/buildkit/tree/master/util/archutil)
- [PR #1038 -- binfmt_misc: add riscv64 detection (Jun 2019)](https://github.com/moby/buildkit/pull/1038)
- [PR #2222 -- enable riscv64 build (Jul 2021)](https://github.com/moby/buildkit/pull/2222)
- [Issue #3625 -- Error cross building runc for riscv64 arch (Feb 2023)](https://github.com/moby/buildkit/issues/3625)
- [Issue #4316 -- Error cross building for riscv64 arch (Oct 2023)](https://github.com/moby/buildkit/issues/4316)
- [PR #4332 -- dockerfile: use glibc to build riscv64 (abandoned, Oct 2023)](https://github.com/moby/buildkit/pull/4332)
- [PR #4344 -- chore: temporarily disable riscv64 build (Oct 2023)](https://github.com/moby/buildkit/pull/4344)
- [PR #4348 -- fix riscv64 build (Oct 2023)](https://github.com/moby/buildkit/pull/4348)
- [PR #4351 -- 0.12 backport: fix riscv64 build (Oct 2023)](https://github.com/moby/buildkit/pull/4351)
- [PR #5068 -- archutil: update riscv64 binary (Jun 2024)](https://github.com/moby/buildkit/pull/5068)
- [PR #5069 -- archutil: update riscv binary (Jun 2024)](https://github.com/moby/buildkit/pull/5069)
- [Discussion #6485 -- RISCV64 architecture and the LLB client (Jan-Feb 2026)](https://github.com/moby/buildkit/discussions/6485)
- [PR #6523 -- Add support for riscv64 architecture in llb client (Feb 2026)](https://github.com/moby/buildkit/pull/6523)
- [Issue #6577 -- Add linux/riscv64 to official release binaries (Mar 2026)](https://github.com/moby/buildkit/issues/6577)
- [BuildKit v0.33.0 release](https://github.com/moby/buildkit/releases/tag/v0.33.0)
- [moby/buildkit Docker Hub image](https://hub.docker.com/r/moby/buildkit)
- [containerd Issue #13020 -- Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [containerd Issue #13124 -- ci: add riscv64 to Linux integration test matrix](https://github.com/containerd/containerd/issues/13124)
- [runc Issue #5166 -- Add linux/riscv64 to CI and release artifacts](https://github.com/opencontainers/runc/issues/5166)
- [gounthar/docker-for-riscv64 -- community BuildKit riscv64 binaries and testing](https://github.com/gounthar/docker-for-riscv64)
- [RISE project website](https://riseproject.dev)
- [RISE -- Announcing the RISE RISC-V Runners: free, native RISC-V CI on GitHub (Mar 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE -- RISE RISC-V Runners: six weeks in (May 2026)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Python wheel builder coverage page](https://riseproject.gitlab.io/python/wheel_builder/)
- [project-reports/containerd.md](project-reports/containerd.md)
- [project-reports/runc.md](project-reports/runc.md)
- [project-reports/xxhash.md](project-reports/xxhash.md)
