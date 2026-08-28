---
title: BuildKit
parent: Project Reports
categories:
  - containers
---

# BuildKit
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-23
**Scope:** RISC-V (riscv64/linux) support status for BuildKit
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

BuildKit is the daemon and library that powers `docker build`. It provides a low-level build graph execution engine (LLB -- Low-Level Builder), a Dockerfile frontend, content-addressable cache, and a gRPC API consumed by Docker CLI, BuildX, and Kubernetes build infrastructure. It is the de-facto standard build backend for OCI container images in the open-source ecosystem.

**Governance.** BuildKit lives under the [Moby Project](https://mobyproject.org) GitHub org (`moby/buildkit`). It is Docker-owned and Docker-driven. It is not affiliated with CNCF, the Linux Foundation (as a project), or any independent foundation. The MAINTAINERS file lists 11 maintainers and 2 curators. Corporate breakdown: Docker holds three seats (Tonis Tiigi `tonistiigi`, Ian Campbell `ijc`, Tibor Vass `tiborvass`); NTT holds one (Akihiro Suda `AkihiroSuda`); Cloudbase Solutions holds one (Gabriel Samfira); the remaining six are independent or unaffiliated. Tonis Tiigi is the de-facto lead: he authored the first RISC-V CI commits, performed the first archutil binary refreshes, and approved/merged most of the riscv64-relevant PRs. Process changes require a 66% maintainer vote. No LTS releases exist; only the latest feature release is supported.

**Community posture on new ports.** Practice, not written policy, governs new architecture acceptance. The standard pattern is: (1) cross-compilation works, (2) CI builds pass, (3) a contributor provides hardware access or testing results. When @klecouvey asked in [discussion #6485](https://github.com/moby/buildkit/discussions/6485) why `LinuxRiscv64` was absent from the LLB client platform constants, AkihiroSuda replied: "Simply because riscv64 wasn't popular in the past, and nobody has bothered to submit a PR to support riscv64 yet" -- and immediately invited a contribution. This is representative of the project's posture: no stated objection to riscv64, but no proactive investment either.

**RISE membership.** Not a member. No BuildKit mention appears in any of the 27 RISE project blog posts (2024-05-15 through 2026-06-05).

---

## 2. Port History and Upstreaming Timeline

All riscv64 work is fully upstream in `moby/buildkit`. There is no downstream-only fork carrying riscv64 patches, and no outstanding unmerged riscv64 patches.

| Date | Event | Source |
|---|---|---|
| 2019-06-04 | `binfmt_misc` detection for riscv64 added -- earliest riscv64 code in the repo | [PR #1038](https://github.com/moby/buildkit/pull/1038) |
| 2021-07-06 | "enable riscv64 build" -- riscv64 added as a cross-compilation target; tonistiigi noted he lacked riscv64 hardware and asked @carlosedp to test | [PR #2222](https://github.com/moby/buildkit/pull/2222) |
| 2023-10-10 | riscv64 cross-build breaks: linker segfault in `riscv64-alpine-linux-musl-clang` due to incompatible binutils in `xx` toolchain after a musl package upgrade | [Issue #4316](https://github.com/moby/buildkit/issues/4316) |
| 2023-10-16 | riscv64 temporarily removed from build targets | [PR #4344](https://github.com/moby/buildkit/pull/4344) |
| 2023-10-18 | riscv64 re-enabled: `xx` updated to v1.3.0 (bundles binutils 2.41); backported to v0.12 and v0.11 | [PR #4348](https://github.com/moby/buildkit/pull/4348) |
| 2024-06-21 | riscv64 `archutil` probe binary regenerated to fix CI mismatch with assembler output | [PR #5068](https://github.com/moby/buildkit/pull/5068) |
| 2024-06-25 | Second archutil binary refresh after Debian package update changed assembler metadata (.riscv.attributes ELF section) -- binary `.text` section unchanged | [PR #5069](https://github.com/moby/buildkit/pull/5069) |
| 2026-01-22 | Community discussion: `LinuxRiscv64` absent from `client/llb/state.go` | [Discussion #6485](https://github.com/moby/buildkit/discussions/6485) |
| 2026-02-16 | PR submitted to add `LinuxRiscv64` platform constant | [PR #6523](https://github.com/moby/buildkit/pull/6523) |
| 2026-02-19 | PR #6523 merged by crazy-max; first release shipping it: v0.28.0 (2026-03-04) | [PR #6523](https://github.com/moby/buildkit/pull/6523) |
| 2026-03-12 | Issue filed requesting `linux/riscv64` in official upstream release binary tarballs; author documented 117+ independent riscv64 BuildKit releases from native BananaPi F3 / SpacemiT K1 hardware | [Issue #6577](https://github.com/moby/buildkit/issues/6577) |
| 2026-06-17 | v0.31.0 released with `buildkit-v0.31.0.linux-riscv64.tar.gz` as an official release artifact alongside provenance, SBOM, and sigstore signatures | [v0.31.0 release](https://github.com/moby/buildkit/releases/tag/v0.31.0) |

**Key contributors and affiliations:**
- Tonis Tiigi (`tonistiigi`, Docker): initial port (2019-2021), archutil binary maintenance (2024), PR approvals
- Kevin Alvarez (`crazy-max`, independent): cross-build bug discovery and fix (2023), PR #6523 merge (2026)
- Akihiro Suda (`AkihiroSuda`, NTT): maintainer, discussion guidance (#6485)
- Aleksa Sarai (`cyphar`, SUSE): archutil binary fix (#5068, 2024)
- klecouvey (independent): `LinuxRiscv64` constant (#6523, 2026)
- gounthar (independent, `docker-for-riscv64` project): native hardware validation, issue #6577 driver

---

## 3. Upstream Support Tier

BuildKit has no written tiered platform support policy. Tier status must be inferred from CI coverage, release artifacts, and maintainer statements.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Cross-compiled release binary | Yes | Yes | Yes (v0.31.0, Jun 2026) |
| Official Docker Hub image layer | Yes | Yes | Yes (`moby/buildkit:latest`) |
| Integration test CI | Yes (x86 runner) | No native runner; arm64 runner exists for validate | No -- no native or QEMU runner in test jobs |
| Native CI runner | Yes | Yes (ubuntu-24.04-arm for validate) | No |
| SBOM + provenance + sigstore in release | Yes | Yes | Yes (v0.31.0) |
| Lint target inclusion | Yes | Yes | Yes (conditional: `GOLANGCI_LINT_MULTIPLATFORM=1`) |
| validate-archutil target | Yes | Yes | No -- explicitly absent |
| LLB client platform constant | Yes | Yes | Yes (since Feb 2026) |

**Assessment.** riscv64 is a second-tier release platform: official binaries are published, the Docker Hub multi-arch image includes it, and it is treated equivalently to ppc64le and s390x in the platform matrix. It is not a first-tier platform because it has no native CI runner and no functional test execution in upstream CI. The gap relative to arm64 is that arm64 now has a native runner for at least the validate job; riscv64 has no runner of any kind.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

BuildKit is written entirely in Go. There is no C++, Rust, or assembly in the core BuildKit codebase (the main `buildkitd` and `buildctl` binaries). Architecture-specific behavior surfaces only through the `util/archutil` package and through CGo-enabled bundled dependencies (runc, containerd-shim). There is no JIT, no SIMD dispatch, no architecture-specific crypto, and no GC barriers to implement.

### 4.1 util/archutil -- Architecture Probe

This package detects whether a host can execute binaries of each supported architecture, enabling BuildKit to report which platforms are available for multi-platform builds.

**Three-file pattern per architecture:**
- `ARCH_binary.go` (build tag `!ARCH`): embeds a gzip-compressed pre-compiled ELF probe binary as a Go string constant.
- `ARCH_check.go` (build tag `!ARCH`): on non-native hosts, decompresses and runs the probe in a chroot to verify binfmt_misc / QEMU support.
- `ARCH_check_ARCH.go` (build tag `ARCH`): on native hosts, returns `("", nil)` without running a probe.

**riscv64 implementation:**
- `util/archutil/fixtures/exit.riscv64.s`: 6-line RV64I assembly; executes Linux `exit(0)` syscall via `ecall`. No ISA extensions beyond baseline RV64I.
- `util/archutil/riscv64_binary.go`: embeds the compiled probe blob (241 bytes gzipped / 616 bytes raw). Refreshed twice in June 2024 (PRs #5068, #5069) when assembler metadata format changed.
- `util/archutil/riscv64_check.go`: non-native host probe runner, identical structure to arm64/s390x/ppc64le equivalents.
- `util/archutil/riscv64_check_riscv64.go`: returns `("", nil)` unconditionally on native riscv64 hosts. This is the correct implementation: riscv64 has no microarchitecture sub-variants to detect (unlike amd64 v2/v3/v4 or arm v6/v7). This matches the pattern for arm64, s390x, ppc64le.

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Probe binary | RV64I `exit(0)` equivalent | Yes | Yes (6-line RV64I) |
| Native fast-path | `archvariant.AMD64Variant()` for v2/v3/v4 | `return "", nil` | `return "", nil` |
| Sub-variant detection | Yes (v2/v3/v4) | No | No |
| Implementation quality | Full | Full | Full -- no gaps relative to arm64 |

### 4.2 LLB Client Platform Constants

`client/llb/state.go` defines named platform constants used by programmatic LLB graph builders. Prior to Feb 2026, `LinuxRiscv64` was absent -- a historical oversight, not a deliberate exclusion. PR #6523 added:

```
LinuxRiscv64 = Platform(ocispecs.Platform{OS: "linux", Architecture: "riscv64"})
```

This is complete parity with LinuxS390x, LinuxPpc64le, and LinuxArm64. No variant field is set (correct for riscv64, same as s390x and ppc64le).

### 4.3 binfmt_misc

PR #1038 (Jun 2019) added riscv64 detection to the binfmt_misc component, enabling QEMU-based riscv64 container execution from x86 hosts. This predates all other riscv64 work in the repo by two years.

### 4.4 QEMU Integration

The BuildKit container image bundles QEMU binaries for emulation of foreign architectures via `tonistiigi/binfmt`. The Dockerfile explicitly retains `buildkit-qemu-riscv64` (only loongarch64, mips64, and mips64el are stripped). riscv64 emulation is part of the default bundled set.

### 4.5 ISA-Specific Optimizations

None. BuildKit performs no SIMD dispatch, no RVV intrinsics, no vectorized compression or hashing in architecture-specific code. The project delegates all compute-intensive work (compression, hashing, crypto) to external Go modules, which themselves fall back to pure-Go on riscv64 (see Section 9).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** `make` (thin wrapper) delegating to `docker buildx bake`, with `docker-bake.hcl` as the platform matrix source of truth. No CMake, no Meson, no autoconf.

**Go version required:** `go 1.25.9` (from `go.mod`).

**Cross-compilation toolchain:** `tonistiigi/xx:1.9.0` (from `ARG XX_VERSION=1.9.0` in `Dockerfile`). The `xx` helper provides `xx-go`, `xx-apk`, `xx-clang`, `xx-verify` wrappers for transparent cross-compilation.

**Critical toolchain version dependency:** In October 2023, riscv64 builds broke because `xx` bundled a linker (binutils) version incompatible with the musl Alpine package available at the time. The fix required `xx` >= v1.3.0 (bundles binutils 2.41). Builds using xx < v1.3.0 will fail for riscv64 with a linker segfault. [Issue #4316](https://github.com/moby/buildkit/issues/4316), [PR #4348](https://github.com/moby/buildkit/pull/4348).

**CGo status by component:**
- `buildkitd`, `buildctl`, `rootlesskit`, `stargz-snapshotter`: `CGO_ENABLED=0` -- pure Go, no C dependency.
- `runc`: `CGO_ENABLED=1` with `musl-dev gcc libseccomp-dev libseccomp-static` via `xx-apk`. Uses `-fuse-ld=lld`. Build tags: `apparmor seccomp netgo cgo static_build osusergo`.
- `containerd-build`: `CGO_ENABLED=1 CGO_LDFLAGS="-fuse-ld=lld"` with `musl-dev gcc` via `xx-apk`.

**lld** is required as the linker for all CGo cross-compilation targets.

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

Download pre-built release binary directly:
```
wget https://github.com/moby/buildkit/releases/download/v0.31.0/buildkit-v0.31.0.linux-riscv64.tar.gz
tar -xvf buildkit-v0.31.0.linux-riscv64.tar.gz
```

**QEMU requirement for cross-build:** `docker/setup-qemu-action` must be active on the build host. The CI workflow (`buildkit.yml`) sets `setup-qemu: true` for all multi-platform build jobs.

**Known build fragility:** The `util/archutil` package contains a pre-compiled riscv64 ELF probe binary checked into the repository. When the host assembler produces different output (due to upstream Debian/Alpine package updates), the stored binary goes stale and CI fails. This happened twice in June 2024 (PRs #5068 and #5069). Tonistiigi noted reservations about this pattern and mentioned that support might need to be reverted if the situation does not improve. [PR #5069](https://github.com/moby/buildkit/pull/5069).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build and run `buildkitd` | Yes | Yes | Yes |
| Build and run `buildctl` | Yes | Yes | Yes |
| Multi-platform image build (as host) | Yes | Yes | Yes |
| LLB client `LinuxRiscv64` constant | Yes | Yes (LinuxArm64) | Yes (since Feb 2026) |
| binfmt_misc detection | Yes | Yes | Yes (since Jun 2019) |
| QEMU emulation of foreign arches | Yes | Yes | Yes (bundled in image) |
| Official release binary tarball | Yes | Yes | Yes (since v0.31.0, Jun 2026) |
| Docker Hub multi-arch image | Yes | Yes | Yes |
| Official Debian/Ubuntu package | Yes (via docker.io) | Yes | No |
| CGo components (runc, containerd-shim) | Yes | Yes | Yes (cross-compiled, not CI-tested) |
| Microarchitecture sub-variant detection | Yes (v2/v3/v4) | No | No |
| validate-archutil CI target | Yes | Yes | No |
| Native CI runner | Yes | Yes (arm64 for validate) | No |
| Integration test execution in CI | Yes | No | No |
| RVV / SIMD acceleration | N/A | NEON (via deps) | No RVV path anywhere |

**Functional gaps:** None. All BuildKit features are available on riscv64. The only historical functional gap -- absence of `LinuxRiscv64` in `client/llb/state.go` -- was resolved in Feb 2026.

**Performance gaps:** Compression throughput (zstd, gzip) will be lower than on amd64 or arm64 because `klauspost/compress` has no RVV path for riscv64. On amd64, AVX-512 and AVX2 paths are used; on arm64, NEON paths are used. On riscv64, pure-Go scalar code runs. Magnitude of this gap depends on workload; no benchmark data exists.

**Security hardening gaps:** seccomp and AppArmor are applied to runc, same as on amd64/arm64. No riscv64-specific gap identified.

**NaN / floating-point:** Data not available: no riscv64-specific floating-point issues were found in the issue tracker, and no benchmark or compliance test results exist for riscv64 floating-point behavior in BuildKit.

---

## 7. CI/CD Infrastructure

**Direct finding from CI YAML files:** Zero "riscv" strings appear in any `.github/workflows/*.yml` file. riscv64 is never named in any workflow file. The CI files and what they cover:

- `.test.yml`: integration test suite, runs on `ubuntu-24.04` (x86) only. No riscv64 matrix entry.
- `buildkit.yml`: release binary and image builds, delegates platform lists to `docker-bake.hcl`. Triggers: push to master/version branches/tags, daily schedule, `workflow_dispatch`. Invokes `binaries-cross` and `image-cross` bake targets, which include `linux/riscv64`.
- `frontend.yml`: Dockerfile frontend image, invokes `frontend-image-cross`, which includes `linux/riscv64`.
- `validate.yml`: runs linters; assigns arm platforms to `ubuntu-24.04-arm`, all others to `ubuntu-24.04`. riscv64 lint runs on an x86 runner inside an emulated container. The lint target includes `linux/riscv64` only when `GOLANGCI_LINT_MULTIPLATFORM=1`.
- `test-os.yml`: Windows and FreeBSD amd64 only.
- `compatibility-releases.yml`: sets up QEMU for arm64 only.

**What riscv64 actually gets in CI:**
1. Cross-compiled release binary on `ubuntu-24.04` (x86) with QEMU available. Verifies the binary can be compiled, not that it runs correctly.
2. Cross-compiled multi-arch Docker image layer. Same caveat.
3. Conditional lint (golangci-lint built for riscv64 inside a container) -- not functional BuildKit CI.

**What riscv64 does not get in CI:**
- Any integration test execution (containerd/OCI/snapshotter workers).
- Any native riscv64 runner.
- The `validate-archutil` target (explicitly lists only amd64 and arm64).

**RISE runners:** The RISE project announced free GitHub Actions RISC-V CI runners for open-source projects in a March 2026 blog post. No evidence exists that BuildKit has applied for or is using RISE runners. Data not available: whether maintainers have discussed adopting RISE runners in issues or off-channel.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (ubuntu-24.04) | Yes (ubuntu-24.04-arm, validate only) | No |
| Cross-compile build CI | Yes | Yes | Yes |
| Integration tests | Yes | No | No |
| validate-archutil | Yes | Yes | No |
| Lint (conditional) | Yes | Yes | Yes (conditional) |

---

## 8. Distribution and Release Status

**Official upstream release binaries:** Present in v0.31.0 (released 2026-06-17). The GitHub Releases page includes `buildkit-v0.31.0.linux-riscv64.tar.gz` with associated provenance, SBOM, and sigstore attestation files. Same pattern confirmed for v0.30.0. This resolves [issue #6577](https://github.com/moby/buildkit/issues/6577), which was filed in March 2026 noting that riscv64 was in `docker-bake.hcl` but absent from release artifacts.

**Docker Hub official image:** `moby/buildkit:latest` includes a `linux/riscv64` manifest layer (~109.6 MB). Digest: `sha256:b096545f9c88c1a44540a160cb1d84d30fe8188093e5eb63ef787035c4346f33` [NEEDS VERIFICATION -- confirm digest in current latest tag]. This image is the standard deployment mechanism for Kubernetes-based build infrastructure.

**Debian:** Not packaged. `tracker.debian.org/pkg/buildkit` returns 404. `packages.debian.org` search returns zero results.

**Ubuntu:** Not packaged in Ubuntu noble (24.04) official repositories. Docker CE (from `apt.docker.com`) ships as a Debian package for Ubuntu but riscv64 availability in that channel was not determined from the research findings.

**Arch Linux RISC-V:** Data not available: the Arch RISC-V porting status page query returned no match for BuildKit, but the site does not provide reliable per-package absence confirmation.

**PyPI:** The `buildkit` package on PyPI (v0.2.2) is an unrelated Python project. Not applicable.

**What a user must do to get a working binary on riscv64 today:**
- Option A: Download `buildkit-v0.31.0.linux-riscv64.tar.gz` from the GitHub Releases page. This is the recommended path as of Jun 2026.
- Option B: Build from source with `docker buildx bake binaries-cross` on any x86/arm64 host with Docker and QEMU configured.
- Option C: Pull `moby/buildkit:latest` Docker image and run the `linux/riscv64` variant.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| containerd/containerd v2 v2.2.5 | Container runtime, image pull, snapshot, layer unpack | Builds (Go generic) | Not tested upstream | No official upstream binary | [#13020](https://github.com/containerd/containerd/issues/13020), [#13124](https://github.com/containerd/containerd/issues/13124) open |
| opencontainers/runc (via go-runc v1.1.0) | OCI runtime for each RUN step | Builds; CGo + seccomp | Not CI-tested | Yes, `runc.riscv64` since v1.2.0 | [#5166](https://github.com/opencontainers/runc/issues/5166) closed without action; untested CGo path |
| klauspost/compress v1.18.6 | zstd, gzip, snappy for layer blobs and cache | Builds; pure-Go fallback | No riscv64 CI | Go module | No blocking issues; no RVV path (performance gap) |
| containerd/stargz-snapshotter v0.18.2 | Lazy image loading (optional, bundled) | Builds | Not tested | No riscv64 binary | No functional issues found |
| ProtonMail/go-crypto v1.3.0 | OpenPGP, SSH auth, sigstore | Builds (pure Go) | No riscv64 tests | Go module | None |
| sigstore/sigstore-go v1.2.1 | SLSA provenance, SBOM attestation | Builds (pure Go) | No riscv64 tests | Go module | None |
| cespare/xxhash/v2 v2.3.0 | Non-crypto hash for cache keys | Builds; pure-Go fallback (x86 asm absent on riscv64) | No riscv64 CI | Go module | None; minor perf gap |
| go.etcd.io/bbolt v1.4.3 | Embedded KV store for content metadata | Builds | No riscv64 CI | Go module | None |
| containerd/nydus-snapshotter v0.15.15 | FUSE lazy loading (optional) | Go wrapper builds; Rust daemon status unknown | Not tested | No riscv64 binary upstream | Nydus Rust daemon (`nydusd`) has incomplete riscv64 support; not in default buildkitd config |
| planetscale/vtprotobuf v0.6.1 | Protobuf codegen for LLB wire format | Builds (codegen only) | N/A | Go module | None |

**Deep-dives on high-risk dependencies:**

**containerd v2 (critical path).** Every `buildkitd` operation that pulls or unpacks images invokes containerd. Two open issues ([#13020](https://github.com/containerd/containerd/issues/13020) and [#13124](https://github.com/containerd/containerd/issues/13124)) request riscv64 in the Linux integration test matrix; neither has been acted on. There is no upstream containerd riscv64 release binary. This means riscv64 buildkitd depends on a containerd binary that has never been integration-tested on riscv64 by the upstream project. Community users have reported this working (gounthar's hardware testing referenced in issue #6577), but it is unverified upstream.

**runc (critical path, CGo).** Every `RUN` Dockerfile instruction invokes runc. The runc riscv64 binary has been published in official releases since v1.2.0 (2022). [Issue #5166](https://github.com/opencontainers/runc/issues/5166) requesting riscv64 CI was closed without action. The CGo-compiled seccomp and apparmor paths have not been tested on riscv64 by the upstream project. Risk: a bug in the seccomp filter table or the CGo/musl linkage on riscv64 would cause container sandbox escapes or runtime failures with no upstream CI gate.

**klauspost/compress (performance).** This is the compression library for all layer blob transfers (zstd, gzip). On amd64, it uses AVX2/AVX-512 SIMD paths. On arm64, it uses NEON. On riscv64, it falls back to pure-Go scalar code. No RVV extension paths exist or are planned [NEEDS VERIFICATION -- no issue or PR for RVV in klauspost/compress was found in the research]. The performance delta will be most visible in cache-heavy builds with large layer exports.

**nydus-snapshotter / nydusd (optional, high risk if used).** The `nydusd` daemon is written in Rust. Its riscv64 support is incomplete as of mid-2026. This dependency is not in the default `buildkitd` configuration and is only relevant for environments that explicitly enable the nydus snapshotter. For standard BuildKit deployments, this is not a blocker.

---

## 11. Known Bugs and Active Issues

No open riscv64-specific bugs exist in `moby/buildkit` as of June 2026.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4316](https://github.com/moby/buildkit/issues/4316) | Error cross building for riscv64 arch | Closed (fixed Oct 2023) | Was high (builds broken) | Root cause: outdated binutils in `xx` toolchain; fix: `xx` v1.3.0 |
| [#6577](https://github.com/moby/buildkit/issues/6577) | Add linux/riscv64 to official release binaries | Closed (resolved Jun 2026) | Was medium | Resolved: riscv64 in v0.31.0 release |
| [#6485](https://github.com/moby/buildkit/discussions/6485) | RISCV64 architecture and the LLB client | Closed (resolved Feb 2026) | Was low (API completeness) | Resolved: PR #6523 |

**Open general bugs with potential riscv64 relevance** (no riscv64 label, but noted for completeness):
- [#6871](https://github.com/moby/buildkit/issues/6871): bind mounts + chroot issue (opened 2026-06-14) -- general, not riscv64-specific.
- [#6380](https://github.com/moby/buildkit/issues/6380): ADD --checksum HTTP error hiding -- general.
- [#6055](https://github.com/moby/buildkit/issues/6055): rootless config file not accepted -- general.

None of the above are riscv64-specific. There are no open correctness bugs for riscv64.

**Latent risk: archutil binary staleness.** The pre-compiled ELF probe binary in `util/archutil/riscv64_binary.go` is stored in the repository and must be manually regenerated when the upstream assembler changes its output format. This broke CI twice in June 2024 (PRs #5068 and #5069). The binary's `.text` section was identical in both cases; only ELF metadata changed. Tonistiigi flagged this pattern as fragile. There is no automated test that detects binary staleness before CI fails.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. The maintainer response to the missing `LinuxRiscv64` constant (discussion #6485) was explicitly welcoming, and the pattern across all riscv64 PRs shows no resistance from core maintainers. The October 2023 temporary disable (PR #4344) was pragmatic (fix the CI) and resolved within 24 hours.

**Technical blockers:** None currently. riscv64 builds, runs (per community testing), and ships in official releases. The main technical risk is the archutil binary staleness pattern described above.

**Organizational blockers:** The absence of native riscv64 CI is the primary gap between riscv64 and first-tier status. Adding native CI would require either RISE runners (announced but not adopted by BuildKit) or a hardware sponsorship. The project has no mechanism to fund runners directly; this requires external contribution.

**Acceptance probability for riscv64 contributions:** High. The project accepted every riscv64 PR that was technically sound. The `LinuxRiscv64` PR (#6523) was merged in 3 days. The 2023 fix (#4348) was merged same-day. No policy barrier exists.

---

## 13. Investment Analysis

RISE has not funded or contributed any BuildKit work. The community contributor @gounthar drove the inclusion of riscv64 in official releases with native hardware validation. All incremental investment below starts from the current state (v0.31.0 with official riscv64 binaries, no CI).

### 13.1 Functional Enablement

No functional gaps exist. All BuildKit features are available on riscv64.

### 13.2 Performance Optimization

The primary performance gap is compression throughput. `klauspost/compress` has no RVV path for riscv64. Implementing zstd and/or gzip RVV acceleration in `klauspost/compress` would reduce cache export/import time and image push/pull latency on riscv64. This is upstream library work, not BuildKit work directly.

Within BuildKit itself, there is no SIMD dispatch to add; the project defers all compute to external libraries by design.

### 13.3 CI/CD Infrastructure

The highest-value investment is adding a native riscv64 CI runner to the integration test matrix (`.test.yml`). Currently no riscv64 functional test runs anywhere in upstream CI. The RISE project offers free GitHub Actions RISC-V runners for open-source projects (announced March 2026). Applying for RISE runners and wiring them into `.test.yml` is the single change that would bring riscv64 to parity with the arm64 test posture.

Secondary: adding riscv64 to `validate-archutil` target. Lower priority; the probe binary pattern already works.

### 13.4 Ecosystem Enablement

BuildKit itself has no package ecosystem (no plugins, no extensions, no language bindings that require separate riscv64 builds). However, BuildKit is infrastructure for producing other software. Ensuring that `containerd` v2 has riscv64 integration tests (open issues #13020 and #13124) is a prerequisite for full confidence in riscv64 buildkitd. This is upstream containerd work, not BuildKit work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Apply for RISE runners; wire riscv64 into `.test.yml` integration test matrix | 1-2 | BuildKit maintainer or contributor | High |
| CI/CD | Add riscv64 to `validate-archutil` target | 0.5 | BuildKit contributor | Medium |
| Functional | None -- no functional gaps | 0 | N/A | N/A |
| Performance | Implement RVV paths in klauspost/compress (zstd, gzip) | 8-16 | klauspost/compress contributor | Low (no production data justifying the delta) |
| Dependencies | Drive riscv64 CI in containerd v2 (#13020, #13124) | 4-8 | containerd contributor | High (confidence in runtime correctness) |
| Dependencies | Verify runc seccomp/CGo path on riscv64 native hardware; open issue or PR to add riscv64 to runc CI | 2-4 | runc contributor | High (security correctness gate) |

**Highest return items:** The RISE runner integration (1-2 person-weeks) would close the single largest gap -- no CI testing -- at minimal cost, given runners are available for free. The containerd and runc CI gaps are the most significant correctness risks; they are in dependency repositories, not BuildKit itself.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-23.

---

## 15. References

- [BuildKit documentation](https://docs.docker.com/build/buildkit/)
- [moby/buildkit repository](https://github.com/moby/buildkit)
- [PR #1038 -- binfmt_misc: add riscv64 detection (Jun 2019)](https://github.com/moby/buildkit/pull/1038)
- [PR #2222 -- enable riscv64 build (Jul 2021)](https://github.com/moby/buildkit/pull/2222)
- [Issue #4316 -- Error cross building for riscv64 arch (Oct 2023)](https://github.com/moby/buildkit/issues/4316)
- [PR #4344 -- chore: temporarily disable riscv64 build (Oct 2023)](https://github.com/moby/buildkit/pull/4344)
- [PR #4348 -- fix riscv64 build (Oct 2023)](https://github.com/moby/buildkit/pull/4348)
- [PR #5068 -- archutil: update riscv64 binary (Jun 2024)](https://github.com/moby/buildkit/pull/5068)
- [PR #5069 -- archutil: update riscv binary (Jun 2024)](https://github.com/moby/buildkit/pull/5069)
- [Discussion #6485 -- RISCV64 architecture and the LLB client (Jan 2026)](https://github.com/moby/buildkit/discussions/6485)
- [PR #6523 -- Add support for riscv64 architecture in llb client (Feb 2026)](https://github.com/moby/buildkit/pull/6523)
- [Issue #6577 -- Add linux/riscv64 to official release binaries (Mar 2026)](https://github.com/moby/buildkit/issues/6577)
- [BuildKit v0.31.0 release (Jun 2026)](https://github.com/moby/buildkit/releases/tag/v0.31.0)
- [moby/buildkit MAINTAINERS file](https://raw.githubusercontent.com/moby/buildkit/master/MAINTAINERS)
- [docker-bake.hcl -- platform matrix source of truth](https://raw.githubusercontent.com/moby/buildkit/master/docker-bake.hcl)
- [util/archutil directory](https://github.com/moby/buildkit/tree/master/util/archutil)
- [containerd issue #13020 -- Add linux/riscv64 to CI test matrix](https://github.com/containerd/containerd/issues/13020)
- [containerd issue #13124 -- ci: add riscv64 to Linux integration test matrix](https://github.com/containerd/containerd/issues/13124)
- [runc issue #5166 -- Add linux/riscv64 to CI and release artifacts](https://github.com/opencontainers/runc/issues/5166)
- [moby/buildkit Docker Hub image](https://hub.docker.com/r/moby/buildkit)
- [RISE project website](https://riseproject.dev)
- [RISE project -- Announcing RISE RISC-V Runners (Mar 2026)](https://riseproject.dev/blog)