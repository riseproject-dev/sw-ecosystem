---
title: oss-fuzz
---

# oss-fuzz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for oss-fuzz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

OSS-Fuzz is a continuous fuzzing service operated by Google that runs sanitizer-instrumented fuzz targets for open-source projects at scale on Google-managed infrastructure (ClusterFuzz). It is not a library or distributable binary; it is a CI service that projects opt into by submitting a Dockerfile and build script to the [google/oss-fuzz](https://github.com/google/oss-fuzz) repository.

**Governance:** Google-owned and operated. Google retains primary governance and all infrastructure control. The project cooperates with the OpenSSF (Open Source Security Foundation) and the Linux Foundation Core Infrastructure Initiative on coverage goals, but there is no independent foundation, steering committee, or community governance model. Major architectural decisions (supported architectures, sanitizer modes, engine selection) are made unilaterally by Google engineers.

**License:** Apache-2.0.

**Corporate maintainers and top contributors by commit count:**

| Contributor | Commits | Affiliation |
|---|---|---|
| DavidKorczynski | ~1,900 | Ada Logics |
| jonathanmetzman | ~832 | Google |
| oliverchang | ~789 | Google |
| mikea | ~624 | Google (historical) |
| AdamKorcz | ~591 | Ada Logics |
| inferno-chromium (Abhishek Arya) | ~406 | Google |
| Dor1s (Max Moroz) | ~406 | Instacart (formerly Google) |
| arthurscchan | ~363 | not listed |
| guidovranken | ~253 | independent security researcher |
| kcc (Kostya Serebryany) | ~244 | Google (original creator) |

**Community stance on new architecture ports:** Unfavorable. The maintainers' stated position (documented in [issue #8164](https://github.com/google/oss-fuzz/issues/8164), opened 2022-08-05 and still open as of the research date) is that new architectures require Google Cloud Build (GCB) support first, and that cross-compilation approaches have proven unreliable in practice. maintainer jonathanmetzman explicitly warned contributors against preparing projects for aarch64 while the infrastructure was unresolved. The aarch64 issue has remained open for four years without resolution. There is no tracking issue requesting riscv64 support anywhere in the repository.

**RISE involvement:** None. OSS-Fuzz is not a RISE member project. No RISE blog post (across all 34 posts scanned from May 2024 through August 2026) mentions OSS-Fuzz or fuzzing infrastructure. The [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (March 2026) does not name OSS-Fuzz as an adopter.

Note: The [riseproject-dev/compiler-fuzz-ci](https://github.com/riseproject-dev/compiler-fuzz-ci) repository is a csmith-based compiler fuzzer for GCC and LLVM targeting RISC-V vector ISA extensions. It shares no infrastructure with google/oss-fuzz; it is a standalone continuous fuzzing CI harness forked from a personal repository and is unrelated to this report.

---

## 2. Port History and Upstreaming Timeline

There is no RISC-V port of OSS-Fuzz infrastructure. The following table records the complete set of relevant events.

| Date | Event | Source |
|---|---|---|
| 2022-08-05 | Issue #8164 opened requesting aarch64 support -- the only non-x86 architecture ever requested | [#8164](https://github.com/google/oss-fuzz/issues/8164) |
| 2022-08-05 | PR #8165 adds aarch64 to `ARCHITECTURES` in `infra/constants.py` | [#8165](https://github.com/google/oss-fuzz/pull/8165) [NEEDS VERIFICATION - PR number inferred from context, not directly confirmed in search results] |
| Never | riscv64 added to `ARCHITECTURES` | N/A -- no commit, PR, or issue found |
| Never | riscv64 tracking issue opened | N/A -- search confirmed zero results |

The three GitHub search results that returned false positives for "riscv" in google/oss-fuzz were:
- [Issue #11821](https://github.com/google/oss-fuzz/issues/11821): ESP32-H2 user support question with a build log containing `riscv32-esp-elf-gcc.exe`
- [PR #8108](https://github.com/google/oss-fuzz/pull/8108): Clang-17 update where RISC-V backend targets appeared incidentally in changelogs
- [PR #3418](https://github.com/google/oss-fuzz/pull/3418): llvm-libc OSS-Fuzz integration where riscv appeared in comments about llvm-libc's own codebase

None represent work on riscv64 as an OSS-Fuzz host platform.

**Key contributors for a riscv64 port:** None identified. No individual has done any preparatory work.

**Is it fully upstream?** The question is not applicable -- there is no port to upstream.

---

## 3. Upstream Support Tier

OSS-Fuzz does not publish a formal tier policy document. Architecture support is entirely determined by what Google Cloud Build and Google Compute Engine natively provide. The authoritative definition is `infra/constants.py`:

```python
DEFAULT_ARCHITECTURE = 'x86_64'
ARCHITECTURES = ['i386', 'x86_64', 'aarch64']
```

aarch64 is listed in `ARCHITECTURES` but is not in the CI matrix in `.github/workflows/project_tests.yml`, which tests only `x86_64` and `i386`. The practical distinction between aarch64 and riscv64 is therefore narrow: aarch64 has a code path in `infra/helper.py` (`prepare_aarch64_emulation()`) and appears in the constant list, but does not have production CI. riscv64 has neither.

**Comparison table:**

| Dimension | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| In `ARCHITECTURES` constant | yes | yes | no |
| `DEFAULT_ARCHITECTURE` | yes | no | no |
| Docker platform mapping | `linux/amd64` (default) | `linux/arm64` (explicit) | missing |
| QEMU emulation path in `infra/helper.py` | native | `prepare_aarch64_emulation()` exists | missing |
| GitHub Actions CI matrix | tested (`project_tests.yml`) | not tested | missing |
| Production ClusterFuzz workers | yes | no (GCE does not offer arm64) | no (GCE does not offer riscv64) |
| Official documentation coverage | primary | not documented | not mentioned |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OSS-Fuzz itself contains no JIT, SIMD, crypto, or assembly code. It is an orchestration framework. Architecture-specific behavior lives entirely in the base Docker images and the fuzzing engines (LLVM/compiler-rt, AFL++, honggfuzz, Centipede) that are installed into those images.

The four files in the repository that contain the string "riscv" all reference RISC-V as a **target architecture being fuzzed**, not as a host platform:

| File | riscv content | Host arch | What it does |
|---|---|---|---|
| `projects/llvm/build.sh` | copies `llvm-isel-fuzzer` binary as `llvm-isel-fuzzer--riscv64-O2` | x86_64 | Fuzzes LLVM's RISC-V instruction-selector backend |
| `projects/binutils/generate_seeds.py` | `"riscv64": (243, ELFCLASS64, ...)` and `"riscv32": (243, ELFCLASS32, ...)` in `ARCHES` dict | x86_64 | Generates ELF seed corpus for binutils fuzzing |
| `projects/unicorn/build.sh` | links `libriscv32-softmmu.a` and `libriscv64-softmmu.a` | x86_64 | Fuzzes Unicorn's RISC-V emulation code |
| `projects/xnnpack/build.sh` | `-DXNN_ENABLE_RISCV_VECTOR=1` compile flag | x86_64 | Enables XNNPACK's RVV codepath for fuzzing |

Code search for `#ifdef __riscv` in google/oss-fuzz returned zero results. There are no `.S` assembly files, no RVV intrinsics, no JIT backends, and no architecture-dispatch logic in the oss-fuzz codebase itself.

**Component table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compilation | N/A (no JIT in oss-fuzz) | N/A | N/A |
| SIMD / vector | N/A | N/A | N/A |
| Assembly stubs | N/A | N/A | N/A |
| Sanitizer runtime (ASAN) | full | full (via compiler-rt) | compiler-rt builds it, but not exercised in oss-fuzz CI |
| Sanitizer runtime (MSAN) | full | full | not supported in LLVM compiler-rt for riscv64 |
| Sanitizer runtime (TSAN) | full | full | `tsan_rtl_riscv64.S` merged 2023-10-12, but not exercised in oss-fuzz CI |
| libFuzzer | full | full | in `ALL_FUZZER_SUPPORTED_ARCH` in LLVM, but not deployed in oss-fuzz |
| Centipede | full | partial | hard `#error` on riscv64, blocked |

---

## 5. Build System, Cross-Compilation, and Toolchain

OSS-Fuzz uses Docker-based builds. The image chain is:

```
ubuntu:20.04 (base-image)
  -> gcr.io/oss-fuzz-base/base-image
     -> gcr.io/oss-fuzz-base/base-clang  (builds LLVM from source)
        -> gcr.io/oss-fuzz-base/base-builder  (installs fuzzing engines)
           -> gcr.io/oss-fuzz-base/base-builder-{go,rust,jvm,python,...}
              -> gcr.io/oss-fuzz/<project>
```

**LLVM build:** `infra/base-images/base-clang/checkout_build_install_llvm.sh` contains an explicit architecture gate:

```bash
case $(uname -m) in
    x86_64)
      TARGET_TO_BUILD=X86
      ...
    aarch64)
      TARGET_TO_BUILD=AArch64
      ...
    *)
      echo "Error: unsupported target $(uname -m)"
      exit 1
      ;;
esac
```

A riscv64 host would reach the `*)` branch and exit with error code 1. There is no cross-compilation path; oss-fuzz builds LLVM natively on the host. The pinned LLVM revision is `cb2f0d0a5f14`.

**CMake:** Downloaded as a pre-built binary via `cmake-$VERSION-Linux-${arch}.sh` where `arch` defaults to `x86_64`. Kitware does publish riscv64 CMake binaries, so the Dockerfile `ARG arch` mechanism could in principle be extended, but no such extension exists.

**Bazelisk:** Downloaded as a hardcoded `bazelisk-linux-amd64` binary. Bazelisk v1.29.0 ships only `linux-amd64` and `linux-arm64` -- no `linux-riscv64` asset. This is a hard gap for all Bazel-based fuzz targets.

**QEMU usage:** Docker buildx with QEMU is used only for building aarch64 images on x86_64 hosts (`docker buildx create --platform linux/arm64`). The platform mapping in `infra/helper.py` is binary: `'linux/arm64' if architecture == 'aarch64' else 'linux/amd64'`. There is no `linux/riscv64` path.

**Language-mode architecture gates in the `compile` script:**

```bash
if [[ $ARCHITECTURE == "i386" ]]; then
    export CFLAGS="-m32 $CFLAGS"
```

JVM, JavaScript, and Python fuzzing modes are hard-gated to `$ARCHITECTURE == x86_64` via explicit conditionals in the compile script. These modes are unavailable on any non-x86_64 architecture, including aarch64.

**Known build failures for riscv64:**
- `checkout_build_install_llvm.sh` exits with error on `uname -m == riscv64`
- Bazelisk has no riscv64 binary
- Centipede (fuzztest) has a compile-time `#error` on non-x86/arm targets
- Python, JVM, and JavaScript fuzz modes hard-blocked at script level

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| C/C++ fuzzing (libFuzzer) | full | full (code path exists) | blocked (LLVM build script exits) |
| C/C++ fuzzing (AFL++) | full | full | builds with `AFL_NO_X86=1`; no oss-fuzz deployment |
| C/C++ fuzzing (honggfuzz) | full | partial | riscv64 struct added 2022-01-07 but marked "untested" by author; no validation in 3+ years |
| C/C++ fuzzing (Centipede) | full | partial | hard `#error`, blocked |
| Go fuzzing | full | partial | Go 1.21+ supports riscv64/linux; `compile_go_fuzzer` path should work in principle but not deployed |
| Rust fuzzing | full | partial | `riscv64gc-unknown-linux-gnu` tier 2; sanitizer flags on riscv64 require nightly for some modes |
| Python fuzzing | full | not available | not available |
| JVM fuzzing | full | not available | not available |
| JavaScript fuzzing | full | not available | not available |
| ASAN | full | full | compiler-rt builds ASAN for riscv64; not deployed in oss-fuzz |
| MSAN | full | full | **not supported** in LLVM compiler-rt for riscv64 |
| TSAN | full | full | `tsan_rtl_riscv64.S` merged 2023-10-12 [#68735](https://github.com/llvm/llvm-project/pull/68735); not deployed in oss-fuzz |
| HWASAN | full (partial) | full | unknown; not deployed |
| UBSAN | full | full | compiler-rt builds it; not deployed |
| Coverage instrumentation | full | full | not deployed |
| Corpus storage / ClusterFuzz | full | full | not available (no GCE riscv64 instance type) |

**Security hardening gaps:** MSAN is not supported on riscv64 in LLVM compiler-rt. MSAN is the most detection-sensitive sanitizer for memory-safety bugs; its absence is a material gap relative to amd64 and arm64.

**NaN / floating-point semantics:** Data not available: no riscv64 floating-point conformance testing data was found for oss-fuzz fuzz targets.

---

## 7. CI/CD Infrastructure

All 10 GitHub Actions workflow files in `.github/workflows/` were read and grepped for "riscv". Zero matches in any file.

**GitHub Actions matrix (`project_tests.yml`):**
- `runs-on: ubuntu-latest` (x86_64 only)
- `architecture` matrix: `x86_64` and `i386` only
- No arm64 runner, no riscv64 runner, no QEMU layer

**CI comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions runner | yes | no | no |
| Architecture in CI matrix | yes | no | no |
| ClusterFuzz production workers | yes | no (GCE lacks arm64) | no (GCE lacks riscv64) |
| RISE RISC-V Runners adopted | N/A | N/A | no |
| Nightly fuzzing coverage | full | none | none |

**RISE RISC-V Runners** (launched March 2026, providing free native riscv64 CI via Scaleway EM-RV1 bare-metal GitHub Actions runners) are not used by OSS-Fuzz. The announcement post does not name OSS-Fuzz as an adopter, and OSS-Fuzz's own build and fuzzing fleet is GCE-based and independent of GitHub Actions runners for production fuzzing.

---

## 8. Distribution and Release Status

OSS-Fuzz has no distributable binary packages of any kind:

- **GitHub Releases:** `gh api repos/google/oss-fuzz/releases?per_page=5` returned `[]`. No releases, no tags, no binary assets.
- **PyPI:** Package `oss-fuzz` returns HTTP 404. No package exists.
- **Ubuntu/Debian:** `oss-fuzz` is not packaged. Ubuntu noble search returned no results; `tracker.debian.org/pkg/oss-fuzz` returns HTTP 404.
- **Arch Linux RISC-V:** `archriscv.felixc.at/?q=oss-fuzz` returned no results.

OSS-Fuzz is consumed by cloning the repository and running its Python scripts and Docker containers directly. There are no riscv64 binary packages because there are no binary packages of any architecture.

**What a user must do to get a working riscv64 instance:** There is no path to a working riscv64 oss-fuzz instance today. The user would need to resolve all blockers in Section 5 (LLVM build script, Bazelisk, Centipede), add riscv64 to `infra/constants.py`, add a Docker platform mapping in `infra/helper.py`, and have access to riscv64 compute infrastructure (GCE does not provide it; RISE Runners could serve as a substitute for CI purposes only).

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| LLVM/Clang (pinned `cb2f0d0a5f14`) | Compiler for all C/C++ fuzz targets | builds on riscv64 host | not tested in oss-fuzz | no oss-fuzz binary | `checkout_build_install_llvm.sh` exits on riscv64; open RISC-V codegen bugs |
| compiler-rt / libFuzzer | Fuzzing engine; ASAN/TSAN/UBSAN/HWASAN runtimes | libFuzzer: yes (in `ALL_FUZZER_SUPPORTED_ARCH`); ASAN/TSAN: yes; MSAN: no | not tested | no oss-fuzz binary | MSAN not supported; LSan false-leak regression [llvm#216580](https://github.com/llvm/llvm-project/issues/216580) open 2026-08-16 |
| AFL++ (pinned `eadc8a2a`) | Fuzzing engine (AFL++ mode) | builds with `AFL_NO_X86=1` | historical issues all closed | no oss-fuzz binary | no open riscv64 blockers |
| honggfuzz (pinned `oss-fuzz` branch) | Fuzzing engine (honggfuzz mode) | builds; riscv64 register structs added 2022-01-07 commit `a9ce350`, author marked "untested" | never tested | no binary | commit explicitly says "untested"; no follow-up validation in 3+ years |
| fuzztest / Centipede (pinned `a37d133f`) | Fuzzing engine (Centipede mode) | blocked: hard `#error` on non-x86/arm | not tested | no binary | compile-time `#error` is a hard block |
| fuzz-introspector (pinned `341ebbd7`) | Static analysis and coverage reporting | unknown | not tested | no binary | no riscv64 issues found; no architecture support policy |
| Python 3.11 (built from source, `3.11.13`) | Infrastructure runtime; Python fuzzing | builds on riscv64 | not tested in oss-fuzz | source-only in base images | oss-fuzz `compile` script hard-gates Python fuzz mode to `$ARCHITECTURE == x86_64` |
| Bazelisk (v1.9.0, amd64 binary) | Bazel bootstrap for Bazel-based fuzz targets | no riscv64 binary exists in any Bazelisk release | N/A | no | hard-coded `bazelisk-linux-amd64`; no workaround without building Bazel from source |
| ccache (v4.10.2, built from source) | Compiler cache | builds from source on riscv64 | N/A (build tool) | source-built | no blocking issues |
| CMake (v3.29.2, downloaded amd64 binary) | Build system for C/C++ fuzz targets | Dockerfile fetches `cmake-...-Linux-${arch}.sh`; Kitware does publish riscv64 CMake | N/A | riscv64 binary exists at Kitware | Dockerfile `ARG arch` defaults to `x86_64`; needs update |
| patchelf (v0.19.1, built from source) | ELF patching for binary relocation | builds from source; riscv64 `.rela` sections supported | N/A (build tool) | source-built | no open blockers |
| atheris (pip-installed) | Python fuzzing via libFuzzer linkage | requires libFuzzer on riscv64 | not tested | no riscv64 wheel | hard-gated to `$ARCHITECTURE == x86_64` in `compile` script |
| Go toolchain | Go language fuzzing | Go 1.21+ supports `riscv64/linux` natively | partial | yes (Go ships riscv64 tarballs) | no blocking issues in Go itself; clang riscv64 codegen bugs may surface |
| Rust toolchain | Rust language fuzzing | `riscv64gc-unknown-linux-gnu` tier 2 in rustup | partial | yes (rustup installs riscv64) | sanitizer flags (`-Zsanitizer=address`) require nightly on riscv64 |

### Critical dependency deep-dives

**LLVM/compiler-rt:** The most important dependency. libFuzzer is included in `ALL_FUZZER_SUPPORTED_ARCH` for Linux on riscv64 in LLVM's `AllSupportedArchDefs.cmake`. ASAN, UBSAN, and TSAN (since October 2023) build for riscv64. MSAN is absent from `ALL_MSAN_SUPPORTED_ARCH` for riscv64 and is not being worked on for riscv64 as of the research date. An open LSan false-leak regression [llvm#216580](https://github.com/llvm/llvm-project/issues/216580) was reported 2026-08-16. Multiple RISC-V codegen bugs are open ([llvm#80792](https://github.com/llvm/llvm-project/issues/80792), [llvm#171978](https://github.com/llvm/llvm-project/issues/171978)).

**Centipede (fuzztest):** Contains a hard compile-time `#error` on non-x86/arm architectures. This is not a configuration issue; it is a deliberate block. Enabling Centipede on riscv64 requires upstream code changes.

**Bazelisk:** No riscv64 asset in any released version as of the research date. This blocks all Bazel-based fuzz targets. Resolving this requires either a Bazelisk riscv64 release from the Bazel team or building Bazel from source in the base image, which is a multi-hour build and significant maintenance burden.

---

## 11. Known Bugs and Active Issues

No riscv64-specific issues or PRs exist in google/oss-fuzz. The issue tracker was searched exhaustively (10+ search queries). Zero results.

The relevant open upstream issues affecting a hypothetical riscv64 deployment are in dependencies:

| ID | Project | Title | Status | Severity | Notes |
|---|---|---|---|---|---|
| [#8164](https://github.com/google/oss-fuzz/issues/8164) | oss-fuzz | Support AArch64 | open since 2022-08-05 | high | Analogous blocker for aarch64 -- still unresolved after 4 years; sets expectations for riscv64 timeline |
| [llvm#216580](https://github.com/llvm/llvm-project/issues/216580) | LLVM | LSan false-leak regression on riscv64 | open 2026-08-16 | high | Direct correctness impact; LeakSanitizer produces false positives on riscv64 |
| [llvm#80792](https://github.com/llvm/llvm-project/issues/80792) | LLVM | RISC-V codegen bug | open | medium | Codegen correctness; would affect fuzz target compilation |
| [llvm#171978](https://github.com/llvm/llvm-project/issues/171978) | LLVM | RISC-V codegen bug | open | medium | Codegen correctness |

No correctness bugs in OSS-Fuzz itself for riscv64 (because it has never been run on riscv64).

---

## 12. Objections and Upstream Blockers

**Stated organizational objection:** jonathanmetzman (Google, maintainer) stated in [issue #8164](https://github.com/google/oss-fuzz/issues/8164) that new architectures are blocked on Google Cloud Build support and that cross-compilation approaches have been unreliable. This position has not changed in four years. The maintainers have not engaged with riscv64 at all.

**Infrastructure blocker (hard):** Google Compute Engine does not offer riscv64 instance types. ClusterFuzz, the fuzzing execution backend, runs on GCE VMs. Without riscv64 GCE instances, production fuzzing on riscv64 is impossible within the OSS-Fuzz/ClusterFuzz system as currently designed. This is not an oss-fuzz code problem; it is a GCE product gap.

**Technical blockers (hard, requiring code changes):**
1. `checkout_build_install_llvm.sh` exits with error on riscv64 -- requires adding a new `case` branch
2. Bazelisk has no riscv64 binary -- blocks all Bazel-based fuzz targets; requires upstream Bazelisk release or source build
3. Centipede (fuzztest) has a hard `#error` on riscv64 -- requires upstream code removal
4. MSAN not supported in LLVM compiler-rt for riscv64 -- requires significant upstream LLVM work

**Technical blockers (medium, configuration changes):**
5. `infra/constants.py` must add `'riscv64'` to `ARCHITECTURES`
6. `infra/helper.py` must add a `linux/riscv64` Docker platform mapping
7. `compile` script hard-gates for Python/JVM/JavaScript modes must be extended or documented as not supported
8. CMake Dockerfile must fetch riscv64 binary

**Acceptance probability:** Low for the near term. The aarch64 precedent (open for 4 years, never resolved, Google infrastructure did not catch up) suggests that riscv64 support in OSS-Fuzz depends on Google's internal infrastructure roadmap, not on external contributions. External contributors cannot unblock the GCE instance type gap.

---

## 13. Investment Analysis

RISE has no prior investment in OSS-Fuzz. All items below are unaddressed.

### 13.1 Functional Enablement

The minimum viable path to riscv64 oss-fuzz support requires resolving four hard blockers: the LLVM build script gate, Bazelisk availability, Centipede `#error`, and the `infra/constants.py` / `infra/helper.py` plumbing changes. These are necessary but not sufficient; compute infrastructure (GCE or equivalent) is also required.

### 13.2 Performance Optimization

Data not available: no riscv64 fuzzing performance data exists. Performance optimization work cannot be scoped until the platform is functional.

### 13.3 CI/CD Infrastructure

RISE RISC-V Runners (Scaleway EM-RV1) could provide native riscv64 GitHub Actions runners for oss-fuzz CI (build and integration tests), but cannot replace ClusterFuzz for production fuzzing. A hybrid model where builds and basic tests run on RISE Runners and production fuzzing is deferred until GCE riscv64 is available is technically feasible.

### 13.4 Ecosystem Enablement

Not applicable. OSS-Fuzz has no dependent package ecosystem (Section 10 omitted per rules).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 `case` branch to `checkout_build_install_llvm.sh` | 1 | LLVM/oss-fuzz contributor | Critical |
| Functional | Add `riscv64` to `infra/constants.py` `ARCHITECTURES` and Docker platform mapping in `infra/helper.py` | 1 | oss-fuzz contributor | Critical |
| Functional | Remove or conditionalize Centipede `#error` on riscv64 in fuzztest | 2-4 | fuzztest/Centipede team | Critical |
| Functional | Produce riscv64 Bazelisk binary or add from-source Bazel build to base image | 4-8 | Bazel team or oss-fuzz contributor | Critical |
| Functional | MSAN support for riscv64 in LLVM compiler-rt | 20-40 | LLVM compiler-rt team | High |
| Functional | Resolve LSan false-leak regression on riscv64 (llvm#216580) | 1-2 | LLVM contributor | High |
| CI/CD | Add riscv64 to GitHub Actions CI matrix using RISE Runners | 1 | oss-fuzz contributor | High |
| CI/CD | Engage Google to add riscv64 GCE instance type (prerequisite for production fuzzing) | 0 (advocacy, not engineering) | Qualcomm/RISC-V ecosystem leads | Critical |
| Functional | Validate honggfuzz riscv64 register struct and stack unwinding | 2 | honggfuzz contributor | Medium |

Total engineering estimate (excluding GCE advocacy and MSAN work): approximately 12-20 person-weeks of focused engineering, not counting upstream negotiation time. The GCE instance type gap is the single largest blocker and is outside the scope of any contributor's control.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/oss-fuzz repository](https://github.com/google/oss-fuzz)
- [OSS-Fuzz homepage](https://google.github.io/oss-fuzz/)
- [infra/constants.py -- ARCHITECTURES definition](https://github.com/google/oss-fuzz/blob/master/infra/constants.py)
- [issue #8164 -- Support AArch64 (open since 2022-08-05)](https://github.com/google/oss-fuzz/issues/8164)
- [issue #11821 -- false positive riscv search hit (ESP32-H2 support question)](https://github.com/google/oss-fuzz/issues/11821)
- [PR #8108 -- false positive riscv search hit (Clang-17 update)](https://github.com/google/oss-fuzz/pull/8108)
- [PR #3418 -- false positive riscv search hit (llvm-libc integration)](https://github.com/google/oss-fuzz/pull/3418)
- [projects/llvm/build.sh -- llvm-isel-fuzzer--riscv64-O2](https://github.com/google/oss-fuzz/blob/ed02494ca691a97bc0b4ec937648a32712ec3f7e/projects/llvm/build.sh)
- [projects/binutils/generate_seeds.py -- riscv32/riscv64 ELF seed entries](https://github.com/google/oss-fuzz/blob/ed02494ca691a97bc0b4ec937648a32712ec3f7e/projects/binutils/generate_seeds.py)
- [projects/unicorn/build.sh -- libriscv32/riscv64-softmmu.a](https://github.com/google/oss-fuzz/blob/ed02494ca691a97bc0b4ec937648a32712ec3f7e/projects/unicorn/build.sh)
- [projects/xnnpack/build.sh -- XNN_ENABLE_RISCV_VECTOR](https://github.com/google/oss-fuzz/blob/ed02494ca691a97bc0b4ec937648a32712ec3f7e/projects/xnnpack/build.sh)
- [LLVM compiler-rt PR #68735 -- TSAN riscv64 support merged 2023-10-12](https://github.com/llvm/llvm-project/pull/68735)
- [LLVM issue #216580 -- LSan false-leak regression on riscv64 (open 2026-08-16)](https://github.com/llvm/llvm-project/issues/216580)
- [LLVM issue #80792 -- RISC-V codegen bug](https://github.com/llvm/llvm-project/issues/80792)
- [LLVM issue #171978 -- RISC-V codegen bug](https://github.com/llvm/llvm-project/issues/171978)
- [riseproject-dev/compiler-fuzz-ci -- unrelated csmith-based RISC-V compiler fuzzer](https://github.com/riseproject-dev/compiler-fuzz-ci)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)