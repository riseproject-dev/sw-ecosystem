---
title: CloudNativePG
parent: Project Reports
---

# CloudNativePG

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for CloudNativePG<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CloudNativePG is a Kubernetes operator, written entirely in Go, that manages the full lifecycle of PostgreSQL clusters running inside Kubernetes (provisioning, failover, backup/restore, in-place minor-version updates, monitoring). It does not embed or compile a database engine itself: the operator (control plane) and the PostgreSQL "operand" images (data plane, built in the separate `cloudnative-pg/postgres-containers` repository) are distinct artifacts.

**Governance:** CloudNativePG is a CNCF (Cloud Native Computing Foundation)-stewarded project, confirmed via `SECURITY-INSIGHTS.yml` (`steward.uri: https://www.cncf.io/`). Its maturity level is **Sandbox** (application [cncf/sandbox#128](https://github.com/cncf/sandbox/issues/128) opened 2024-09-24, accepted 2025-01-21). An **Incubation** application ([cncf/toc#1961](https://github.com/cncf/toc/issues/1961)) opened 2025-11-11 remains open/unratified as of 2026-08-14; the project's own `.project/project.yaml` explicitly flags this as in-progress and calls out an outstanding vendor-neutrality requirement. License is Apache 2.0; the codebase was donated by EDB to "The CloudNativePG Authors" and the project was renamed from "Cloud Native PostgreSQL" to avoid the PostgreSQL trademark.

**Corporate sponsors and maintainers:** The project originated inside 2ndQuadrant, later acquired by EDB (EnterpriseDB), which remains overwhelmingly dominant in governance. All 5 active maintainers (Gabriele Bartolini, Francesco Canovai, Leonardo Cecchi, Marco Nenciarini, Armando Ruocco) are EDB employees per their GitHub profiles and `SECURITY-INSIGHTS.yml`. Emeritus maintainers are Jonathan Gonzalez (EDB) and Philippe Scorsolini (moved to Upbound). Top code contributors by commit count are almost entirely EDB/EnterpriseDB-affiliated; only `phisco` (Upbound) and `jsilvela` (no listed company) break the pattern. The CNCF sandbox application itself names EnterpriseDB as the "Contributing/Sponsoring Org" and states the roadmap is chosen partly from "conversations with customers of our primary sponsoring organization" - this single-vendor concentration is exactly the gap the pending Incubation application must close. Adopters (`ADOPTERS.md`) include EDB, Google Cloud, Microsoft Azure, IBM, Akamai, Tesla, Ericsson, Bitnami, and ~40 others, but adopters are users, not maintainers.

**Community culture on new ports:** There is no written platform/architecture support-tier policy anywhere in the org (no `PLATFORMS.md`; nothing in `GOVERNANCE.md`, `ROADMAP.md`, or the docs site - `PLATFORMS.md` was checked directly and returns 404). In practice, architecture support is gated by a hard structural dependency: end-to-end (e2e) tests run on `kind`, which only publishes amd64/arm64 node images. The project's demonstrated posture (see Sections 2, 3, 12) is to **shrink**, not expand, its architecture matrix absent both upstream Kubernetes/`kind` support and a sponsoring organization willing to own CI/test hardware for a new architecture.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port history to report. Exhaustive org-wide search (code, issues, PRs, commits, discussions) for `riscv`, `riscv64`, and `"risc-v"` across all 32 (later confirmed 33) repositories in the `cloudnative-pg` GitHub org returned **zero genuine hits** in every category. The only string matches for "riscv64" anywhere in the org (7 raw hits) are Renovate-bot dependency-bump PR bodies where the *upstream tool being bumped* mentions riscv64 in its own changelog - not CloudNativePG code or discussion:

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V commit, issue, PR, or discussion exists anywhere in `cloudnative-pg` org history | Org-wide GitHub code/issue/PR/commit/discussion search, 0 results (see Section 11 methodology) |
| 2024-11-05 | False positive: [PR #6019](https://github.com/cloudnative-pg/cloudnative-pg/pull/6019)/[#6020](https://github.com/cloudnative-pg/cloudnative-pg/pull/6020)/[#6021](https://github.com/cloudnative-pg/cloudnative-pg/pull/6021)/[#6022](https://github.com/cloudnative-pg/cloudnative-pg/pull/6022) - Renovate bump of goreleaser to v2.4.4; PR body quotes goreleaser's own changelog mentioning its "ci: release to riscv64" feature. No CNPG code changed re: architecture. | Direct PR body inspection |
| 2026-06-16 / 2026-07-20 | False positive: [PR #912](https://github.com/cloudnative-pg/charts/pull/912) / [PR #916](https://github.com/cloudnative-pg/charts/pull/916) - Renovate bump of Helm dependency; Helm's own release notes mention a `linux-riscv64` download link. Irrelevant to CNPG. | Direct PR body inspection |
| 2026-03-31 (still open 2026-08-14) | False positive: [PR #437](https://github.com/cloudnative-pg/cloudnative-pg.github.io/pull/437) - Renovate bump of highlight.js; changelog mentions "added 3rd party riscv64 grammar" (syntax highlighting for riscv64 assembly text, not CNPG support). Still unmerged (`mergeable_state: blocked`) as of 2026-08-14. | Direct PR body inspection |

**Key contributors with orgs:** Not applicable - there are no riscv64 contributors because no riscv64 work has ever been proposed or attempted.

**Is it fully upstream?** Not applicable. There is nothing upstream to be "fully" or "partially" merged; riscv64 support does not exist in any form, proposed or implemented, in this project's history.

## 3. Upstream Support Tier

**Formal tier policy:** None exists. No `PLATFORMS.md` (confirmed 404), no architecture-tier language in `GOVERNANCE.md` or `ROADMAP.md`. `SUPPORT.md` lists commercial support vendors only (Axians, B1 Systems, CloudRaft, CYBERTEC, Dalibo, Data Bene, EDB, Linux Polska, Nibble-IT, Optimadata, PG Support, pgEdge, Verito Digital) and is not an architecture-policy document.

**Evidence (CI, release-blocking, official binaries):** All three independent build-declaration points confirm the same restriction:
- CI env var (`continuous-integration.yml` line 42, `continuous-delivery.yml` line 74, `release-publish.yml` lines 220-225): `PLATFORMS: "linux/amd64,linux/arm64"`, identical string with an identical comment ("adding more platforms will increase the building time") in all three files - indicating deliberate policy, not oversight.
- Go binary cross-compilation matrix (`.goreleaser.yml`): `manager`/`manager-race` build only for `goarch: [amd64, arm64]`; `kubectl-cnpg` CLI plugin builds for `goarch: [amd64, arm64, ppc64le, s390x]` plus `goarm: [5, 6, 7]`.
- Official container image (OCI index for `ghcr.io/cloudnative-pg/cloudnative-pg:1.30.0`, queried directly): platform manifests exist for `amd64` and `arm64` only (plus two `attestation-manifest` entries unrelated to platform).
- Krew plugin index (`https://raw.githubusercontent.com/kubernetes-sigs/krew-index/master/plugins/cnpg.yaml`): exactly 6 platform entries - `windows/amd64`, `windows/arm64`, `linux/amd64`, `linux/arm64`, `darwin/amd64`, `darwin/arm64`. No riscv64.

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Operator (`manager`) binary build | Yes | Yes | No |
| `manager-race` binary build | Yes | Yes | No |
| `kubectl-cnpg` CLI plugin build | Yes | Yes | No |
| Operator container image (ghcr.io) | Yes | Yes | No |
| PostgreSQL operand image (`postgres-containers`) | Yes | Yes | No |
| CI build/test coverage | Yes (native runner) | Yes (QEMU-emulated) | No |
| e2e test coverage (`kind`) | Yes | Yes | No (kind itself has no riscv64 node images) |
| Krew plugin distribution | Yes | Yes | No |
| Release-blocking status | N/A (primary target) | N/A (primary target) | N/A (not a target at all) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

CloudNativePG has **no architecture-specific subsystems of any kind** - no JIT, no SIMD, no hand-rolled crypto, no assembly. Direct inspection of the full repository tree (`gh api repos/.../git/trees/main?recursive=true`, 2,392 paths) found:
- **0 C/C++/assembly files** (`.c`, `.h`, `.cc`, `.cpp`, `.hpp`, `.s`, `.S`, `.asm`) anywhere in the repository.
- **0 Go files using the GOARCH-suffix naming convention** (`_amd64.go`, `_arm64.go`, `_riscv64.go`, etc.) - a regex sweep of all 993 `.go` files found zero matches.
- `go.mod` confirms a pure-Go dependency graph (Kubernetes client-go, controller-runtime, pgx, cobra, zap, etc.) with no cgo-bridging libraries, and `.goreleaser.yml` sets `CGO_ENABLED=0` globally.

The only "architecture" symbols in the Go source (`GoArch` field in `pkg/utils/discovery.go`; `internal/cmd/manager/debug/architectures/cmd.go`) are runtime-introspection plumbing that reports which pre-built `operator/manager_<GOARCH>` binaries are baked into a running container image (via `filepath.Glob("operator/manager_*")` and `runtime.GOARCH`) - this is generic Go runtime discovery, not an architecture-specific implementation. Both files were fetched in full; neither contains architecture-conditional logic beyond string matching on the discovered `GOARCH` value.

Code search for `#ifdef __riscv`, `__riscv`, `rvv`, `vfloat32m1_t`, and `"RISC-V"` scoped to the repo returned 0 results for every term - expected, since preprocessor guards are a C/C++ construct and the repo has no C/C++ files.

### Comparison table per component: amd64 vs arm64 vs riscv64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT | Not applicable (no JIT in this codebase) | Not applicable | Not applicable |
| SIMD / vectorized kernels | Not applicable (pure Go control-plane logic, no numeric kernels) | Not applicable | Not applicable |
| Crypto | Not applicable (relies on Go stdlib `crypto/*` and transitive deps, see Section 9) | Not applicable | Not applicable |
| Hand-written assembly | None (0 `.S`/`.asm` files in repo) | None | None |
| GC barriers | Not applicable (delegated entirely to the Go runtime/toolchain) | Not applicable | Not applicable |
| Per-arch source files | 0 | 0 | 0 |

**Conclusion:** because there is no per-architecture source code for any architecture - including the two that already ship (amd64, arm64) - a riscv64 port would require zero application-code changes. It is purely a build-matrix / cross-compilation exercise (see Sections 5 and 13).

## 5. Build System, Cross-Compilation, and Toolchain

**Toolchain:** Go 1.26.6 (`go.mod`), `CGO_ENABLED=0` (static binaries, no C compiler dependency for the operator itself). There is no CMake, autotools, or `configure` script anywhere in the repository - it is pure Go built via `go build` / GoReleaser / Docker Buildx. A full case-insensitive grep of a fresh shallow clone for `riscv` returned zero matches anywhere in the tree.

**Operator binary build matrix** (`.goreleaser.yml`):
```yaml
builds:
- id: manager
  goos: [linux]
  goarch: [amd64, arm64]
- id: kubectl-cnpg
  goos: [darwin, linux, windows]
  goarch: [amd64, arm64, ppc64le, s390x]
  goarm: [5, 6, 7]
```

**Operator container image** (`docker-bake.hcl`):
```hcl
target "default" {
  matrix = { distro = ["distroless", "ubi"] }
  platforms = ["linux/amd64", "linux/arm64"]
  dockerfile = "Dockerfile"
}
```

**Operator Dockerfile** (fetched in full):
```dockerfile
ARG BASE=gcr.io/distroless/static-debian13:nonroot@sha256:f7f8f729987ad0fdf6b05eeeae94b26e6a0f613bdf46feea7fc40f7bd72953e6

FROM gcr.io/distroless/static-debian13:debug-nonroot@sha256:484ecde2ed1526bebde050a7eb3bc57caef805165975602e44e445e1c20d8117 AS builder
ARG TARGETARCH
SHELL ["/busybox/sh", "-c"]
RUN ln -sf operator/manager_${TARGETARCH} manager

FROM ${BASE}
WORKDIR /
COPY --chown=nonroot:nonroot --chmod=0755 dist/manager/* operator/
COPY --from=builder /home/nonroot/ .
COPY licenses /licenses
COPY LICENSE /licenses
USER 65532:65532
ENTRYPOINT ["/manager"]
```
This uses a generic `$TARGETARCH` buildx pattern, so it could theoretically accept riscv64 without a rewrite - but no such target is declared anywhere in the release pipeline.

**QEMU usage:** `docker/setup-qemu-action@96fe6ef7f33517b61c61be40b68a1882f3264fb8 # v4` appears in `continuous-integration.yml`, `continuous-delivery.yml`, and `release-publish.yml`, always scoped to `platforms: ${{ env.PLATFORMS }}` = `"linux/amd64,linux/arm64"`. amd64 runs natively on the `ubuntu-24.04`/`ubuntu-latest-16-cores` GitHub-hosted runners; QEMU is used solely to cross-build/emulate **arm64**. No QEMU riscv64 registration exists anywhere in the repo.

**No `-DUSE_X=OFF`-style flags exist** (no CMake-style option flags anywhere in the codebase - not applicable to a Go project).

**Install script gap:** `hack/install-cnpg-plugin.sh`, which installs the `kubectl-cnpg` CLI, has a `uname_arch_check()` shell function whose case statement recognizes only `386, amd64, arm64, armv5/6/7, ppc64, ppc64le, mips*, s390x, amd64p32`. **riscv64 is not in this recognized-value list** - running the install script on a riscv64 host would fail with `log_crit "... is not a GOARCH value"` even before reaching the download step.

**Operand (PostgreSQL) image build** (`cloudnative-pg/postgres-containers`, `docker-bake.hcl`): `platforms = ["linux/amd64", "linux/arm64"]`, built from `debian:trixie-slim`/`bookworm-slim`/`bullseye-slim` base images via the `apt.postgresql.org.sh` PGDG-repo installer script. Its `BUILD.md` documents `docker buildx bake --push` and `--set "*.platform=linux/amd64"` style invocations; no riscv64 target exists or is mentioned.

**Known build failures:** None documented for riscv64, because no riscv64 build has ever been attempted. The one concrete failure mode identified is the CLI install script's architecture check described above.

**Dependency-chain blockers found during build-system research** (see also Section 9):
- The PGDG `apt.postgresql.org` repository that the operand Dockerfile actually installs PostgreSQL from supports only `amd64, arm64, loong64, ppc64el` for `trixie-pgdg` (confirmed via directory listing at `apt.postgresql.org/pub/repos/apt/dists/trixie-pgdg/main/` - no `binary-riscv64/` directory exists), even though Debian's own trixie archive (not the PGDG repo) does build `postgresql-17` for riscv64.
- Kubernetes itself has no official riscv64 release binaries or container images (open proposal [kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) explicitly states this; a prior implementation attempt, [kubernetes/kubernetes#116686](https://github.com/kubernetes/kubernetes/pull/116686), was closed unmerged).
- `kind` (CNPG's e2e cluster tool) has no riscv64 node images; [kubernetes-sigs/kind#3300](https://github.com/kubernetes-sigs/kind/issues/3300) was closed by a maintainer stating Kubernetes itself needs to support RISC-V first.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Feature matrix

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Operator deployable | Yes | Yes | **No - no image exists** |
| PostgreSQL operand deployable | Yes | Yes | **No - no operand image exists** |
| `kubectl-cnpg` CLI usable | Yes | Yes | **No - not built; install script would reject the architecture** |
| Mixed-architecture cluster in-place updates (`AvailableArchitectures` catalog, see [#3868](https://github.com/cloudnative-pg/cloudnative-pg/issues/3868)) | Yes | Yes | Not applicable - riscv64 instances cannot run at all |
| Backup/restore via barman-cloud | Yes | Yes | Not applicable - blocked at the operand-image layer |
| e2e test coverage | Yes | Yes | No (`kind` has no riscv64 node images) |

**Functional gaps:** CloudNativePG cannot run on riscv64 at all today - there is no operator image, no operand image, and the CLI installer explicitly rejects the architecture. This is a complete functional gap, not a partial one.

**Performance gaps:** Not applicable / no data. CloudNativePG's own code contains no SIMD or numerically-intensive kernels (Section 4), so there is no "missing SIMD" performance delta to analyze for the operator itself. Any riscv64 performance question would be a property of the underlying PostgreSQL operand and its dependencies (covered in [`project-reports/postgresql.md`](https://cloudnative-pg.io/) - see cross-reference in Section 9), not of CloudNativePG's own Go control-plane code. Data not available: no riscv64 vs arm64 benchmark of any kind exists for CloudNativePG or its operand images.

**Security hardening gaps:** Data not available: no security-hardening documentation or discussion specific to any architecture was found. The operator uses `gcr.io/distroless/static-debian13:nonroot` as its base image, which per [GoogleContainerTools/distroless#1925](https://github.com/GoogleContainerTools/distroless/issues/1925) gained riscv64 variants (static/base/cc) in February 2026 - so the base-image blocker for a hypothetical riscv64 operator image is now resolved, but this has not translated into an actual riscv64 build being added.

**NaN / floating-point semantics issues:** Not applicable. CloudNativePG performs no floating-point numerics of its own; any such concerns would apply to PostgreSQL itself (out of scope for this report; see [`project-reports/postgresql.md`](https://cloudnative-pg.io/)).

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Confirmed by reading all 21 files in `.github/workflows/` (`backport.yml`, `chatops.yml`, `close-inactive-issues.yml`, `codeql-analysis.yml`, `continuous-delivery.yml`, `continuous-integration.yml`, `k8s-versions-check.yml`, `latest-postgres-version-check.yml`, `osps_security_assessment.yml`, `ossf_scorecard.yml`, `pr_verify_linked_issue.yml`, `refresh-licenses.yml`, `registry-clean.yml`, `release-pr.yml`, `release-publish.yml`, `release-tag.yml`, `require-labels.yml`, `snyk.yml`, `spellcheck.yml`, `sync-api.yml`, `sync-docs.yml`), plus `.github/e2e-matrix-generator.py`, `.goreleaser.yml`, and `Makefile`. Grep for `riscv`, `riscv64`, `linux/riscv64`, `RISCV` (case-insensitive) across all 21 workflow files returned zero matches. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, `azure-pipelines.yml`, `.drone.yml`, `.travis.yml`, or `appveyor.yml` exist in the repo (all confirmed 404) - GitHub Actions is the only CI system used.

**RISE runners?** None. RISE (riseproject.dev) has no CloudNativePG, EDB, EnterpriseDB, or PostgreSQL entity in its Premier tier (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or General tier (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, SpacemiT, ZTE) membership lists. RISE's 10 working groups (Compilers/Toolchains, System Libraries, Kernel/Virtualization, Language Runtimes, Dev Infra, Linux Distro Integration, Simulators/Emulators, Firmware, Security Software, AI/ML) include no database/data-services group CloudNativePG could plausibly join. RISE's full funded-RFP list (16 projects, RP001-RP016, covering Go runtime accel, FFmpeg, libjpeg-turbo, Rust Tier-1 port, QEMU, LLVM, OpenOCD, GCC/LLVM SPEC2017, EDK2, Python packages, Linux kernel CI, PyTorch, llama.cpp/GGML, OpenSBI TEE) contains no CloudNativePG or database-related item. All 32-33 scanned RISE blog posts (full list checked by title/date/URL) contain zero references to CloudNativePG, CNPG, Postgres, or PostgreSQL.

**Hardware used:** Not applicable - no riscv64 CI job exists to run on any hardware.

### Comparison table: amd64 vs arm64 vs riscv64

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `continuous-integration.yml` (`PLATFORMS` env, line 42) | Yes (native) | Yes (via QEMU) | No |
| `continuous-delivery.yml` (E2E suite, `PLATFORMS` env, line 74) | Yes | Yes (via QEMU) | No |
| `release-publish.yml` ("Detect platforms" step, lines 220-225) | Yes | Yes (via QEMU) | No |
| Runner type | `ubuntu-latest-16-cores` / `ubuntu-24.04` (x86, native) | Same runner, arm64 emulated via `docker/setup-qemu-action` | N/A - never registered with QEMU |
| e2e test cluster (`kind`) | Yes | Yes | No - `kind` itself has no riscv64 node images |

## 8. Distribution and Release Status

**Official binaries for riscv64? None.** Confirmed via three independent, authoritative distribution-channel checks:

1. **Container image** (`ghcr.io/cloudnative-pg/cloudnative-pg`, primary distribution channel): direct OCI image-index query for tag `1.30.0` (`GET /v2/cloudnative-pg/cloudnative-pg/manifests/1.30.0`, `Accept: application/vnd.oci.image.index.v1+json`) returns platform manifests for **`amd64` and `arm64` only** (plus two unrelated `attestation-manifest` provenance entries). Full tag list (100 tags) contains zero tags with "riscv" in the name.
2. **GitHub Releases** (`kubectl-cnpg` CLI binaries): checked v1.30.0, v1.29.2, v1.28.4, v1.30.0-rc1, v1.29.1. Every release publishes `kubectl-cnpg` for darwin (arm64, x86_64), linux (**arm64, ppc64le, s390x, x86_64**), and windows (arm64, x86_64) - zero asset filenames across ~68 checked contain "riscv" or "riscv64". Notably ppc64le and s390x are supported but riscv64 is not, despite Go supporting riscv64 since 1.14.
3. **Krew plugin index** (`kubectl krew install cnpg`): exactly 6 platform entries (windows/linux/darwin x amd64/arm64), no `linux/riscv64`.

**PyPI, npm, Maven:** Not applicable in the conventional sense - CloudNativePG is not published to any of these. `GET https://pypi.org/pypi/cloudnativepg/json` and `.../cloudnative-pg/json` both return HTTP 404 (package does not exist under either name, on any architecture). This is unrelated to RISC-V; CNPG is a Go-based Kubernetes operator, not a Python/npm/Java package.

**Ubuntu/Debian/Fedora/Arch packages:**
- Ubuntu 24.04 (noble): `https://packages.ubuntu.com/search?keywords=CloudNativePG&suite=noble` returns "Sorry, your search gave no results." Package does not exist in the Ubuntu archive at all.
- Debian: `https://tracker.debian.org/pkg/cloudnativepg` returns HTTP 404; independently confirmed via `https://sources.debian.org/api/search/cloudnativepg/` (HTTP 200, `{"results":{"exact":null,"other":[]}}` - zero matches). No source package exists.
- Arch Linux (including Arch Linux RISC-V, `archriscv.felixc.at`): no upstream Arch x86_64 package exists for CloudNativePG in the first place, so a riscv64 "port" is not a meaningful question - there is nothing to port.
- Fedora: Data not available - not explicitly checked; consistent with the pattern above (CNPG is distributed exclusively as a container image + Kubernetes manifests + Go CLI, not as a traditional distro package).

**What must a user do to get a working binary on riscv64 today?** They cannot. There is no path: the operator container image has no riscv64 manifest, the PostgreSQL operand image has no riscv64 manifest, and the `kubectl-cnpg` CLI installer's own architecture-detection script does not even recognize `riscv64` as a valid value (it would fail at `log_crit` before attempting a download). A user would need to build the operator, the operand image, and the CLI entirely from source, and would first need a working riscv64 PostgreSQL container image to manage (none exists upstream from `cloudnative-pg/postgres-containers` either).

## 9. Dependencies

CloudNativePG is a pure-Go Kubernetes operator (`CGO_ENABLED=0`), so it has no C/C++ JIT, SIMD-intrinsic, or hand-rolled-crypto dependencies of the kind that dominate numerics-heavy projects. The dependency graph is approximately 90 Go modules plus one non-linked runtime dependency (PostgreSQL itself, provisioned via container image, not compiled in).

### Summary table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| Go toolchain (`golang/go`) | Compiler/runtime | Builds - first-class port since Go 1.22 (mature since 1.14) | Community builders only, no official Go-team riscv64 CI | Go ships riscv64 binaries | See [`project-reports/go.md`](https://cloudnative-pg.io/) |
| PostgreSQL (managed workload, not linked) | Database CNPG provisions/backs up/fails over | Green upstream (Debian trixie builds it) | Mostly green upstream | **No riscv64 target in `postgres-containers`** - `docker-bake.hcl` platforms = `linux/amd64,linux/arm64` only | See [`project-reports/postgresql.md`](https://cloudnative-pg.io/) |
| `sigs.k8s.io/controller-runtime` | Reconciliation-loop framework | Builds, pure Go | No riscv64 CI | Buildable | 1 historical closed issue (routine `x/sys` bump); no open riscv64 issues |
| `k8s.io/client-go`, `k8s.io/api`, `k8s.io/apimachinery` | Kubernetes API client/types | Builds, pure Go | No riscv64 CI | Buildable | 0 riscv64 issues in any of the three repos; see [`project-reports/kubernetes.md`](https://cloudnative-pg.io/) |
| `github.com/jackc/pgx/v5` | Postgres wire-protocol driver | Builds, pure Go, CGO-free (SCRAM auth via `xdg-go/scram`+`pbkdf2`+`stringprep`, all pure Go) | No riscv64 CI | Buildable | 0 riscv64 issues across pgx and xdg-go/* deps |
| `google.golang.org/grpc` (grpc-go) | CNPG-I plugin protocol transport | Builds, pure Go, no asm/cgo | No riscv64 CI | Buildable | 0 riscv64 issues. Distinct from the C++ `grpc/grpc` core in [`project-reports/grpc.md`](https://cloudnative-pg.io/) - BoringSSL/abseil riscv64 caveats there do not apply |
| `google.golang.org/protobuf` | Wire serialization | Builds, pure Go | No riscv64 CI | Buildable | 0 riscv64 issues. Distinct from `protocolbuffers/protobuf` C++ core in [`project-reports/protocol-buffers.md`](https://cloudnative-pg.io/), whose maintainers have declined riscv64 - that stance does not apply to the Go runtime CNPG uses |
| `github.com/cloudnative-pg/barman-cloud` | Backup/restore to S3/Azure/GCS | Go module builds, pure Go (`CGO_ENABLED=0`); wraps `pip install barman[cloud,azure,snappy,google,zstandard,lz4]` baked into `postgres-containers` | No riscv64 CI | Same ceiling as `postgres-containers` (amd64/arm64 only) | Go module is riscv64-clean, but Barman's Python `zstandard`/`lz4` extras publish **zero riscv64 wheels on PyPI**; Dockerfile already needs `build-essential`/`python3-dev` to compile `lz4` from source on arm64, so riscv64 would need the same untested path |
| `github.com/cloudnative-pg/cnpg-i`, `github.com/cloudnative-pg/machinery` | CNPG-authored plugin scaffolding/utilities | Builds, pure Go | No riscv64 CI | Buildable | 0 riscv64 mentions in either repo |
| `klauspost/compress`, `cespare/xxhash/v2` | Compression/hashing (transitively via `prometheus/client_golang`) | Builds - both have portable pure-Go fallback for non-amd64/arm64 (`xxhash_other.go`; generic `compress/internal/le` path) | No riscv64 CI | Buildable | klauspost/compress [#1036](https://github.com/klauspost/compress/issues/1036) (riscv64 unsafe little-endian loader) merged/closed. xxhash falls back to scalar Go (~2x slower than asm, not a correctness gap) |
| `go.uber.org/zap`, `spf13/cobra`, `onsi/ginkgo/v2`+`gomega` | Logging, CLI framework, e2e test framework | Builds, pure Go | Ginkgo/Gomega drive CNPG's e2e suite, but CNPG's own CI (`continuous-integration.yml`, `continuous-delivery.yml`) only exercises amd64/arm64 | Buildable | zap: 0 issues. cobra: 1 open issue, unrelated (Go 1.26 `%q` verb change). ginkgo: 1 closed issue re: riscv64/mips64le parallel-debug edge case, not build-blocking |
| `gcr.io/distroless/static-debian13:nonroot` | Container base image for operator binary | riscv64 variants (static/base/cc) merged February 2026 ([distroless#1925](https://github.com/GoogleContainerTools/distroless/issues/1925)) | N/A | N/A | Was the ecosystem-wide blocker until Feb 2026, now resolved for this specific base. The alternate `ubi` distro variant uses `registry.access.redhat.com/ubi9/ubi-micro`, which has **no riscv64 build at all** (Red Hat does not ship RHEL/UBI for riscv64) |

### Deep-dive: dependencies with numerics/crypto relevance

None of CloudNativePG's direct or transitive Go dependencies contain JIT, SIMD, or hand-rolled crypto that would require riscv64-specific work beyond what upstream Go/library maintainers have already addressed. The two dependencies flagged above with genuine multi-level nuance are:

- **`klauspost/compress`** - a riscv64-specific correctness issue ([#1036](https://github.com/klauspost/compress/issues/1036), an unsafe little-endian loader bug) was filed, fixed, and closed upstream; no open riscv64 issue remains.
- **Barman's Python compression extras (`zstandard`, `lz4`)** - these are the one genuine unresolved dependency gap: no riscv64 wheels are published on PyPI for either package. This only matters if/when a riscv64 `postgres-containers` operand image is built, since barman is baked into that image via pip, not linked into the Go operator binary.

### Cross-references to existing project-reports/scope.yml reports
- Go: [`project-reports/go.md`](https://cloudnative-pg.io/)
- Kubernetes: [`project-reports/kubernetes.md`](https://cloudnative-pg.io/)
- PostgreSQL: [`project-reports/postgresql.md`](https://cloudnative-pg.io/)
- PostGIS: [`project-reports/postgis.md`](https://cloudnative-pg.io/) (relevant since the `cloudnative-pg` org also maintains `postgis-containers`)
- Prometheus: [`project-reports/prometheus.md`](https://cloudnative-pg.io/) (covers `prometheus/client_golang`/`prometheus/procfs` riscv64 history in more depth, both already fixed)
- gRPC: [`project-reports/grpc.md`](https://cloudnative-pg.io/) (covers the C++ core, not the pure-Go `grpc-go` CNPG actually depends on)
- Protocol Buffers: [`project-reports/protocol-buffers.md`](https://cloudnative-pg.io/) (covers the C++ core, not the pure-Go runtime CNPG actually depends on)

**Bottom line:** CloudNativePG has no dependency-level obstacle to riscv64. Every dependency actually compiled into the operator binary is riscv64-clean (pure Go or has a portable fallback). The only reason CNPG has no riscv64 build today is that riscv64 is absent from hardcoded platform lists in three build files - not blocked by any dependency.

## 11. Known Bugs and Active Issues

**No RISC-V-specific bugs or issues exist.** This is a confirmed absence, not a search gap: `gh api search/issues` for `riscv64 performance repo:cloudnative-pg/cloudnative-pg`, `riscv64 bug ... is:open`, and `riscv nan floating ...` each returned 0 results; org-wide search for `"risc-v"` / `"risc v"` returned 0 results; GitHub Discussions (20 most recently updated checked) contain no RISC-V mentions.

The table below lists the architecture-support issues that exist (none are riscv64-specific, but they are the closest available signal for how a riscv64 request would be handled):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#8452](https://github.com/cloudnative-pg/cloudnative-pg/issues/8452) | Request for Operator Image Support on ppc64le Architecture | Closed (stale, no consensus), opened 2025-08-28, closed 2025-11-19 | N/A (feature request) | Maintainer `@sxd`: "Since we don't have a way to test ppc64le this doesn't seem like a good idea, kind ... is only built for amd64 and arm64 meaning that there's no way to run the e2e tests on that architecture." No maintainer follow-up; auto-closed by stale-bot after 60+14 days. Closest analog to a hypothetical riscv64 request. |
| [#7564](https://github.com/cloudnative-pg/cloudnative-pg/issues/7564) | Remove unneeded architectures in the release process | Closed, opened 2025-05-13 by maintainer `@sxd`, closed 2025-05-26 | N/A (chore) | Confirms the authoritative build-binary list as of May 2025 (no riscv64 anywhere); project trimmed 386/arm5/arm6 from the CLI plugin matrix in follow-up [PR #7648](https://github.com/cloudnative-pg/cloudnative-pg/pull/7648) (May 2025), reinforcing a narrowing, not broadening, posture. |
| [#3868](https://github.com/cloudnative-pg/cloudnative-pg/issues/3868) | Multi-arch in-place update through instance manager injection for multiple architectures | Closed/merged, opened 2024-02-23, closed 2024-03-05 | N/A (enhancement) | Introduced the `AvailableArchitectures` Cluster-status field and per-architecture binary embedding. This mechanism is architecture-agnostic by design and would be the plug-in point for a hypothetical riscv64 addition, but is currently populated only for amd64/arm64. |
| [#3717](https://github.com/cloudnative-pg/cloudnative-pg/issues/3717) | Inconsistent documentation on support status for multi-arch clusters | Closed, opened 2024-01-23, closed 2024-03-05 | N/A (documentation) | Folded into #3868's fix rather than a standalone doc change. |

**Correctness bugs:** None found for any architecture in connection with riscv64 (none exist, since no riscv64 build exists to have bugs in).

## 12. Objections and Upstream Blockers

**Stated objections:** No maintainer has ever stated an objection to riscv64 specifically, because no riscv64 request has ever been filed. The closest and most direct evidence of the project's likely stance comes from the ppc64le precedent (Issue #8452): maintainer `@sxd` (Jonathan Gonzalez, EDB) stated the blocker is purely infrastructural, not philosophical - *"Since we don't have a way to test ppc64le this doesn't seem like a good idea, kind (the main tool we use to test) it's only built for amd64 and arm64 meaning that there's no way to run the e2e tests on that architecture. I wouldn't discard the idea, but we have to ask to the other @cloudnative-pg/maintainers probably in the next community meeting."* No maintainer meeting discussion was ever documented, and the issue went stale.

**Technical blockers, layered:**
1. **e2e test infrastructure (`kind`):** only publishes amd64/arm64 node images. This is the operative, structural gate CNPG maintainers cite for any new architecture.
2. **Kubernetes upstream itself:** has no official riscv64 release binaries or container images ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836) is an open, unresolved 2025 proposal; a prior implementation PR [kubernetes/kubernetes#116686](https://github.com/kubernetes/kubernetes/pull/116686) was closed unmerged; [kubernetes/kubernetes#141291](https://github.com/kubernetes/kubernetes/issues/141291), "Add RISC-V build for the pause image," remains open). This means the `kind` blocker is itself downstream of a Kubernetes-core blocker, not an isolated CNPG or `kind` policy choice.
3. **PGDG apt repository:** the actual PostgreSQL package source used by `postgres-containers` (`apt.postgresql.org`) supports only `amd64, arm64, loong64, ppc64el` for `trixie-pgdg` - no riscv64, even though Debian's own (non-PGDG) trixie archive does build PostgreSQL for riscv64.
4. **Base image (largely resolved):** `gcr.io/distroless/static-debian13` gained riscv64 variants in February 2026 ([distroless#1925](https://github.com/GoogleContainerTools/distroless/issues/1925)) - this was an ecosystem-wide blocker until then and is no longer one for the `distroless` base. The alternate `ubi` distro variant (`registry.access.redhat.com/ubi9/ubi-micro`) remains blocked - Red Hat does not ship RHEL/UBI for riscv64 at all.
5. **CLI install script:** `hack/install-cnpg-plugin.sh`'s `uname_arch_check()` does not recognize riscv64 as a valid value at all - a distribution-layer blocker independent of the build matrix.

**Organizational blockers:** All five active maintainers are EDB employees; EDB has no visible RISE membership or public RISC-V initiative. The project's incubation-track governance concern (single-vendor concentration, flagged in its own CNCF Incubation application) means any riscv64 initiative would currently need to come from - and be resourced by - an outside contributor or sponsoring organization, since there is no internal champion.

**Acceptance probability:** [NEEDS VERIFICATION - inferred, not directly stated by any maintainer]. Based on the ppc64le precedent and the project's demonstrated preference for narrowing rather than broadening its architecture matrix (Issue #7564, PR #7648), a riscv64 request would likely face the identical procedural response as ppc64le: an initial maintainer acknowledgment that the idea "wouldn't be discarded," contingent on (a) someone else solving the `kind`/Kubernetes-upstream e2e-testing gap, and (b) a maintainer-team consensus vote that has, in the ppc64le case, never actually occurred. Given that Kubernetes itself has no riscv64 artifacts, the technical bar for a riscv64 request is measurably higher than it was for ppc64le (which at least had upstream Kubernetes and `kind` amd64/arm64-compatible precedent to point to as "the normal case"). No maintainer has given a percentage or qualitative probability estimate for riscv64 specifically, since no riscv64 request exists to have received a response.

## 13. Investment Analysis

**RISE-funded work check:** RISE's full RFP list (RP001-RP016) contains no CloudNativePG or database-related project. RISE's blog (32-33 posts scanned) contains zero CloudNativePG references. RISE's working groups have no database/data-services group. **No RISE-funded work overlaps with CloudNativePG-specific enablement** - all sizing below is unclaimed work. (Some of the underlying-layer dependencies, e.g. Go, distroless, and Kubernetes-adjacent tooling, may benefit indirectly from RISE-funded work tracked in other reports - e.g. [`project-reports/go.md`](https://cloudnative-pg.io/) - but nothing RISE has funded specifically targets CNPG, PostgreSQL container images, or `kind`.)

### 13.1 Functional Enablement

Work required to get CloudNativePG building and running on riscv64 at all:
- Add `riscv64` to `.goreleaser.yml` `goarch:` lists for `manager`, `manager-race`, and `kubectl-cnpg`.
- Add `riscv64` to the `PLATFORMS` env var in `continuous-integration.yml`, `continuous-delivery.yml`, and `release-publish.yml`, and to `docker-bake.hcl`.
- Add `riscv64` to `hack/install-cnpg-plugin.sh`'s `uname_arch_check()` allow-list.
- Add a `riscv64` target to `cloudnative-pg/postgres-containers`' `docker-bake.hcl` (separate repo, separate PR) - this is a hard prerequisite, since the operator alone is useless without a riscv64 PostgreSQL operand image.
- Validate that Barman's Python `zstandard`/`lz4` extras can be built from source on riscv64 (no riscv64 wheels exist on PyPI today), or find an alternative packaging path.
- None of this requires upstream fixes from third parties for the operator binary itself - the distroless base-image blocker was already resolved in February 2026.

### 13.2 Performance Optimization

Not applicable to CloudNativePG's own code - it contains no SIMD/numeric kernels to optimize (Section 4). Any performance work would occur in PostgreSQL itself (out of scope; see [`project-reports/postgresql.md`](https://cloudnative-pg.io/)) or in dependency libraries already shown to be riscv64-clean (Section 9).

### 13.3 CI/CD Infrastructure

This is the largest and most structurally difficult item, and it is **not solvable by CNPG alone**:
- `kind` needs riscv64 node-image support, which itself is blocked on Kubernetes upstream publishing riscv64 release artifacts ([kubernetes/kubernetes#132836](https://github.com/kubernetes/kubernetes/issues/132836), open/unresolved; [#141291](https://github.com/kubernetes/kubernetes/issues/141291), open).
- Without e2e coverage, CNPG maintainers have explicitly stated (via the ppc64le precedent) they are reluctant to accept a new architecture into the officially-supported build matrix, even if it builds successfully.
- A GitHub Actions self-hosted riscv64 runner (e.g., via RISE's RISC-V Runners program, announced 2026-03-24 per the RISE blog) could provide build/unit-test coverage independent of `kind`, but would not close the e2e gap.

### 13.4 Ecosystem Enablement

Not applicable as a distinct workstream beyond the operand-image and Barman-wheel items already captured in 13.1 - CloudNativePG has no npm/PyPI/Maven-style dependent package ecosystem of its own (see Section 10 omission rationale below).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to `.goreleaser.yml`, `PLATFORMS` env vars, `docker-bake.hcl`, and the CLI install script's arch-check allow-list | 1-2 | CNPG maintainers or external contributor | High |
| Functional | Add riscv64 target to `cloudnative-pg/postgres-containers` `docker-bake.hcl` (hard prerequisite for a usable operand) | 1-2 | CNPG maintainers or external contributor | Critical |
| Functional | Validate/patch Barman `zstandard`/`lz4` Python extras for riscv64 (build from source, or upstream wheel requests) | 1-3 | External contributor (Barman project or CNPG) | Medium |
| Performance | Not applicable - no SIMD/numeric code in CNPG itself | 0 | N/A | N/A |
| CI/CD | Stand up riscv64 build/unit-test coverage (e.g., RISE RISC-V Runners) independent of `kind` | 2-4 | External contributor / RISE-affiliated | High |
| CI/CD | Resolve `kind` riscv64 node-image support (blocked on Kubernetes upstream artifacts) | Not sizeable by CNPG alone - external, multi-quarter dependency | Kubernetes SIG / kind maintainers | Blocking, outside CNPG's control |
| Ecosystem | Not applicable - no dependent package ecosystem | 0 | N/A | N/A |
| Organizational | Secure a maintainer-team consensus vote and a sponsoring org willing to own riscv64 CI/test hardware (per the ppc64le precedent's stated requirement) | Not effort-sizeable; a process/relationship task | Requesting organization + CNPG maintainers | Critical (gates all of the above) |

**Overall assessment:** the code-level lift is small (build-matrix edits, no application-code changes needed per Section 4's finding of zero per-architecture source files). The real cost is organizational and infrastructural: CNPG's own precedent (ppc64le, Issue #8452) shows that even a low-effort, well-specified request stalls indefinitely without (a) someone else supplying working e2e test infrastructure and (b) an active maintainer-team consensus decision. A chip company wanting a riscv64 CloudNativePG would likely need to fund or directly contribute both the build-matrix PRs and a credible e2e-testing story (self-hosted riscv64 `kind`-compatible cluster or equivalent) to overcome the pattern already observed.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [CloudNativePG GitHub repository](https://github.com/cloudnative-pg/cloudnative-pg)
- [CloudNativePG homepage](https://cloudnative-pg.io/)
- [Issue #8452 - Request for Operator Image Support on ppc64le Architecture](https://github.com/cloudnative-pg/cloudnative-pg/issues/8452)
- [Issue #7564 - Remove unneeded architectures in the release process](https://github.com/cloudnative-pg/cloudnative-pg/issues/7564)
- [PR #7648 - architecture matrix trim (386/arm5/arm6 removal)](https://github.com/cloudnative-pg/cloudnative-pg/pull/7648)
- [Issue #3868 - Multi-arch in-place update through instance manager injection](https://github.com/cloudnative-pg/cloudnative-pg/issues/3868)
- [Issue #3717 - Inconsistent documentation on support status for multi-arch clusters](https://github.com/cloudnative-pg/cloudnative-pg/issues/3717)
- [PR #6019 - chore(deps): bump goreleaser to v2.4.4 (main)](https://github.com/cloudnative-pg/cloudnative-pg/pull/6019)
- [PR #6020 - chore(deps): bump goreleaser to v2.4.4 (release-1.22)](https://github.com/cloudnative-pg/cloudnative-pg/pull/6020)
- [PR #6021 - chore(deps): bump goreleaser to v2.4.4 (release-1.23)](https://github.com/cloudnative-pg/cloudnative-pg/pull/6021)
- [PR #6022 - chore(deps): bump goreleaser to v2.4.4 (release-1.24)](https://github.com/cloudnative-pg/cloudnative-pg/pull/6022)
- [cloudnative-pg/charts PR #912 - bump helm to v3.21.1](https://github.com/cloudnative-pg/charts/pull/912)
- [cloudnative-pg/charts PR #916 - bump helm to v4](https://github.com/cloudnative-pg/charts/pull/916)
- [cloudnative-pg/cloudnative-pg.github.io PR #437 - bump highlight.js to v11.12.0](https://github.com/cloudnative-pg/cloudnative-pg.github.io/pull/437)
- [cloudnative-pg/postgres-containers repository](https://github.com/cloudnative-pg/postgres-containers)
- [CNCF Sandbox application - cncf/sandbox#128](https://github.com/cncf/sandbox/issues/128)
- [CNCF Incubation application - cncf/toc#1961](https://github.com/cncf/toc/issues/1961)
- [klauspost/compress issue #1036 - riscv64 unsafe little-endian loader](https://github.com/klauspost/compress/issues/1036)
- [GoogleContainerTools/distroless issue #1925 - riscv64 debian13 variants](https://github.com/GoogleContainerTools/distroless/issues/1925)
- [Kubernetes issue #132836 - Proposal: Official Support for RISC-V Architecture](https://github.com/kubernetes/kubernetes/issues/132836)
- [Kubernetes issue #141291 - Add RISC-V build for the pause image](https://github.com/kubernetes/kubernetes/issues/141291)
- [Kubernetes PR #116686 - RISC-V implementation attempt (closed unmerged)](https://github.com/kubernetes/kubernetes/pull/116686)
- [kubernetes-sigs/kind issue #3300 - Please add support for RISCV64](https://github.com/kubernetes-sigs/kind/issues/3300)
- [PostgreSQL Apt (PGDG) wiki](https://wiki.postgresql.org/wiki/Apt)
- [Debian RISC-V port wiki](https://wiki.debian.org/RISC-V/)
- [Debian package tracker - postgresql-17 (trixie)](https://packages.debian.org/trixie/postgresql-17)
- [Go Minimum Requirements wiki](https://go.dev/wiki/MinimumRequirements)
- [krew-index plugin manifest for cnpg](https://raw.githubusercontent.com/kubernetes-sigs/krew-index/master/plugins/cnpg.yaml)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)