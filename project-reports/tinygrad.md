---
title: tinygrad
parent: Project Reports
color: green
dependencies:
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: NumPy
    relation: test-dependency
    criticality: optional
  - name: PyTorch
    relation: test-dependency
    criticality: optional
  - name: Z3
    relation: test-dependency
    criticality: optional
  - name: capstone
    relation: test-dependency
    criticality: optional
  - name: ONNX
    relation: test-dependency
    criticality: optional
  - name: safetensors
    relation: test-dependency
    criticality: optional
  - name: sentencepiece
    relation: test-dependency
    criticality: optional
  - name: OpenCV
    relation: test-dependency
    criticality: optional
  - name: pytest
    relation: test-dependency
    criticality: optional
  - name: dawn
    relation: runtime-dependency
    criticality: optional
  - name: Mesa
    relation: runtime-dependency
    criticality: optional
  - name: OpenCL
    relation: runtime-dependency
    criticality: optional
  - name: libusb
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="tinygrad" %}

# tinygrad

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-18<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for tinygrad<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

Method note: the GitHub issue and PR APIs were not readable for tinygrad/tinygrad in the research sessions (access denied). Code facts come from a local read-only clone at HEAD c04397442b179dc3ecca03229c8c90a7d0aa211c (v0.14.0). PR and issue bodies, review comments and the issue tracker were not read. No claim below was confirmed by running tinygrad on riscv64 hardware or QEMU.

## 1. Project Overview

tinygrad is a deep-learning framework written in pure Python. The PyPI release [0.14.0](https://pypi.org/pypi/tinygrad/json) is a `py3-none-any` wheel plus an sdist, and `pyproject.toml` has `dependencies = []`. Kernels are JIT-compiled at runtime for a device selected through the `DEV` environment variable. Backends listed in the README are OpenCL, CPU, METAL, CUDA, AMD, NV, QCOM and WebGPU. The README says a new accelerator "only needs to support a total of ~25 low level ops". Python 3.11 or newer is required.

The CPU backend works in two ways:
- It runs `clang` via subprocess with `--target=<arch>-none-unknown-elf`, then loads the resulting ELF with tinygrad's own loader (`elf.py`).
- It can instead compile LLVM IR through a system libLLVM loaded via ctypes (`compiler_llvm.py`).

Governance and sponsors:
- tinygrad is a company-run project of "the tiny corp" (LICENSE header: "Copyright (c) 2024, the tiny corp"). It is not under any foundation (LF, CNCF or similar).
- Governance is benevolent-dictator, led by George Hotz (geohot). No MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md or SUPPORT.md file exists.
- The license is MIT. The SPDX name was not shown in what was read, only the standard MIT grant.
- Funding is tiny corp product sales (tinybox) and cash bounties. No corporate sponsor list was found. The [project homepage](https://tinygrad.org/) is only the tiny corp store and tinybox configurator.
- Commit counts over the last 1000 commits (roughly Aug to Oct 2026): chenyu 270, nimlgen 210, George Hotz 171, qazal 160, Christopher Milan 67, wozeparrot 45, b1tg 24, Teddy Tennant 18. No company affiliations are declared in the repo, and almost no outside company contributions were seen.

Community stance on new ports:
- Backends are welcome in principle. The Contributing rules are strict. Large or complex diffs are not reviewed. PRs must be small and incremental. Features need regression tests. Speedup claims must be benchmarked. Code outside `tinygrad/` is "not well tested" and should not be changed.
- AI-looking PRs from new contributors are closed without feedback and may lead to a ban.
- The riscv64 CPU support was accepted as a 2-line outside contribution.
- On 2026-10-16 the project committed "remove windows support from tinygrad (#18849)". Platform support is dropped readily.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-06-07 | geohot commit "FPGA Based Accelerator for Tinygrad (#258)": experimental `ops_risk` backend with a RISC-V assembler and soft-core FPGA simulation. Historical, not a riscv64 host port. | [commit 2075fde](https://github.com/tinygrad/tinygrad/commit/2075fdeb4f1498da9b529ca31f060b8b9e5e1f10) |
| 2025-03-16 | Issue #9465 "Support for RISC-V ?" opened. Seen only via a search snippet, which shows it as closed. The page returned 404 to WebFetch, so its content and outcome are unread. [NEEDS VERIFICATION] | [issue #9465](https://github.com/tinygrad/tinygrad/issues/9465) |
| 2025-06-25 | Commit "start nvpci (#10521)" mentions "riscv core bootted". This is NVIDIA's GSP RISC-V core, unrelated to host support. | [commit 1c45b9f](https://github.com/tinygrad/tinygrad/commit/1c45b9f7fbd06887e54eb4d5e6dcbb74d9b8b85b) |
| 2025-08-19 | v0.11.0 tagged. It predates riscv64 support and does not contain it. | Local clone, tag fetch and grep |
| 2025-09-12 | PR #12136 "add cpu support for riscv64" opened by mengzhuo (Meng Zhuo). | [PR #12136](https://github.com/tinygrad/tinygrad/pull/12136) |
| 2025-09-14 | PR #12136 squash-merged as commit 4b7904e (author date 2025-09-14 11:40:58 +0800). The diff is 2 insertions and 2 deletions in `compiler_cpu.py`. The PR's `merged_at` is 2025-09-14T03:40:58Z, confirmed via GitHub search. | [commit 4b7904e](https://github.com/tinygrad/tinygrad/commit/4b7904eca91b4a9612d9b423f5e2ca4191830814) |
| 2026-01-12 | v0.12.0 tagged. First release containing riscv64 support. | Local clone, tag fetch and grep |
| 2026-02-10 to 2026-02-12 | PR #14664 "[bounty]: Tenstorrent backend" opened and closed. Merged state unknown. Separate accelerator backend, not a riscv64 port. | [PR #14664](https://github.com/tinygrad/tinygrad/pull/14664) |
| 2026-04-25 to 2026-04-27 | PR #15926 "cpu: normalize ARM64 arch alias" closed without being merged (no merged_at). ARM64 only. | [PR #15926](https://github.com/tinygrad/tinygrad/pull/15926) |
| 2026-10-16 | Windows support removed (#18849). | Local clone history |
| 2026-10-18 | HEAD c04397442b used for this report. PyPI latest is 0.14.0. | Local clone, [PyPI](https://pypi.org/pypi/tinygrad/json) |

Key contributor: Meng Zhuo (mengzhuo, mengzhuo1203@gmail.com), author of the only riscv64 host change. No organization is declared in the sources read.

Fully upstream: yes. The riscv64 code is in the default branch and in releases v0.12.0 and later. At HEAD, `compiler_cpu.py:14` is a rewrite of the PR's two-line version, as a `case "riscv64"` that builds `-march=` from `rv64g` or the given cpu plus feature flags.

## 3. Upstream Support Tier

There is no formal tier policy and no platform support matrix. The README lists supported accelerators (OpenCL, CPU, METAL, CUDA, AMD, NV, QCOM, WEBGPU) and does not list RISC-V as a platform. RISC-V appears only as a CPU arch value in `DEV` ([docs/runtime.md:85](https://github.com/tinygrad/tinygrad/blob/master/docs/runtime.md)). Official binaries are the pure-Python wheel and sdist. Nothing is release-blocking per architecture.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal tier | None | None | None |
| Documented in `docs/runtime.md` | Yes (x86_64) | Yes (arm64) | Yes (line 85) |
| CI | Yes (`testlinux` matrix on x86 runners: CPU:CLANG, CPU:LLVM, CPU:LVP, CPU:X86, CL, WEBGPU) | No explicit arm64 runner label found in workflow grep; QEMU is used for Qualcomm DSP and QCOMCL jobs [NEEDS VERIFICATION] | None |
| Native ISA renderer | Yes (`tinygrad/renderer/isa/x86.py`, 782 lines) | No (clang path) | No |
| Tests mentioning arch | `test_isel.py`, `test_encodings.py`, `test_cpu.py` | `test_qcom.py` (inline asm) | None in `test/` |
| Release artifact | py3-none-any wheel | py3-none-any wheel | py3-none-any wheel |

## 4. Technical Architecture and RISC-V-Specific Subsystems

tinygrad has no hand-written assembly or intrinsics for any CPU architecture. The only assembly file is `extra/gemm/amd_seb/kernel8_batched_gmem.s`, which is AMD gfx1100. The tree has no `#ifdef __riscv` guards and no `arch/riscv/` directory.

| Component | amd64 | arm64 | riscv64 | riscv64 quality |
|---|---|---|---|---|
| Clang C compile path (`compiler_cpu.py`) | `-march=native` style flags | `-ffixed-x18 -mcpu=...` | `-march=rv64g` (when cpu is `native`), or `-march=<cpu>_<feat>...`; target `riscv64-none-unknown-elf` | Scalar, clang flag pass-through. RVV, Zba, Zbb etc. only if the user passes them as feature flags. |
| LLVM renderer (`compiler_llvm.py`) | Works | Works (`+reserve-x18`) | Broken, see below | Missing/broken |
| Native ISA renderer | `x86.py` | None | None | Missing |
| ELF JIT relocations (`elf.py`) | `R_X86_64_PC32`, `R_X86_64_PLT32` plus trampoline | 7 AArch64 cases plus trampoline | None | Missing |
| Disassembly (`capstone_flatdump` in `helpers.py`) | x86_64 mode | ARM64 mode | Not handled (`NotImplementedError`) | Missing |
| Hand-tuned asm / intrinsics | None | None | None | Missing everywhere |
| Cache flush | `__clear_cache` from libgcc_s via `ops_cpu.py` | same | same | Present (libgcc-s1 packaged for riscv64) |
| Host arch detection (`ops_cpu.py:75`) | maps `amd64` to `x86_64` | maps `aarch64` to `arm64` | `riscv64` falls through unchanged | Probably fine, picks `riscv64,native` |

Defects found by code reading (not run on riscv64 hardware):
1. LLVM renderer. `compiler_llvm.py:15` maps `'riscv64': 'riscv64'` and builds the name `LLVMInitializeriscv64Target`. The autogen bindings in `llvm.py` expose `LLVMInitializeRISCV*`. One source reads this as an `AttributeError`. Another notes the PR #12136 diff added the map entry and describes it as initializing the target, without checking the symbol name. The sources disagree on whether line 15 works, and the symbol-name mismatch favors failure. Separately, the triple dict at line 17 has only arm64, x86_64 and AMDGPU, so a `KeyError` is expected on riscv64 either way.
2. ELF relocations. `jit_loader` (`elf.py`, lines 55-86) raises `NotImplementedError("Encountered unknown relocation type")` for anything outside x86_64 and AArch64. The verification run compiled a test kernel with the exact `ClangCompiler` flags using clang-18. A float constant produced `R_RISCV_PCREL_HI20` and `R_RISCV_PCREL_LO12_I`, and a `sinf` call produced `R_RISCV_CALL_PLT`. `libc.py` defines `R_RISCV_*` constants but nothing uses them. Float literals and libm calls are common, so most non-trivial Clang-compiled kernels would be expected to fail to load. This was shown at the object-file level only; loading was not run.
3. Disassembler. `capstone_flatdump` supports only x86_64 and arm64.

ISA extensions: only the base `rv64g` is selected by default. No extension is hard-coded.

## 5. Build System, Cross-Compilation, and Toolchain

- tinygrad has no build system: no CMakeLists.txt, go.mod, Cargo.toml or package.json. It installs as pure Python. Exact riscv64 install commands were not found. Likely usage, inferred and not run, is `pip install tinygrad` and a `DEV` value of the form `<arch>,<cpu>,<feats>`, for example `riscv64,native`. See `docs/env_vars.md#dev-variable`, which was not read.
- Per `docs/runtime.md`, the arch list needs at least two values: the arch family and the cpu type as accepted by clang `-march`. `native` makes tinygrad (or its delegate compiler) query the host CPU. Further values are feature flags. A `-` prefix disables a flag, and enabled flags must not be prefixed with `+`.
- Toolchain: a `clang` that accepts `--target=riscv64-none-unknown-elf -march=rv64g[_ext]` is needed on PATH. No minimum version is stated in any file seen. The verification test used clang-18. Ubuntu 26.04 (resolute) riscv64 ships clang-21. The LLVM path needs a system libLLVM with the RISCV target. Ubuntu 26.04 riscv64 provides libllvm20, libllvm21 and libllvm22.
- QEMU: the only QEMU use is `qemu-user-static` in `.github/actions/setup-tinygrad/action.yml`. It serves the Qualcomm DSP job (`MOCKDSP=1 DEV=DSP`) and QCOMCL tests. None of it targets riscv64.
- Dockerfiles: only `extra/dsp/Dockerfile` exists (Hexagon DSP). It was not read. No riscv64 Dockerfile was found.
- Known build failures: not applicable to the package itself. Runtime failures are listed in Section 4.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Import and pure-Python operation | Yes | Yes | Expected yes (py3-none-any wheel; not run) |
| CPU backend via Clang | Yes, in CI | Yes | Only for relocation-free kernels |
| CPU backend via LLVM IR | Yes, in CI | Yes | Broken (Section 4) |
| Native ISA renderer | Yes | No | No |
| Disassembly/debug dump | Yes | Yes | No |
| Documented | Yes | Yes | One line in `docs/runtime.md` |
| CI coverage | Yes | Not confirmed | None |
| GPU backends (OpenCL, AMD, NV, WebGPU) | Yes | Mixed | Not assessed |

- Functional gaps: relocation-bearing Clang kernels, the LLVM path and the disassembler cannot work on riscv64 as the code stands.
- Performance gaps: Data not available. Searches for tinygrad riscv64 benchmarks found nothing. The default is scalar `rv64g`. RVV would be reachable only through user-supplied feature flags, and no vectorization work for it was found. Generic RISC-V vs ARM data exists but is not about tinygrad and is not used here.
- Security hardening gaps: Data not available. Nothing was searched or found for riscv64-specific hardening in tinygrad.
- NaN / floating-point semantics: Data not available. Not searched in the issue tracker (unreadable) or in the code.

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was confirmed by grep over all of `.github` (workflows `autogen.yml`, `benchmark.yml`, `benchmark_search.yml`, `docs.yml`, `mlperf.yml`, `platform.yml`, `python-publish.yml`, `szdiff.yml`, `test.yml`, plus the composite actions `process-replay` and `setup-tinygrad`). The grep for `riscv|risc-v|rv64` returned zero matches. The workflows were grepped, not read in full. `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis*`, `.circleci` and Azure pipeline files do not exist.

Runner labels: `ubuntu-24.04`, `macos-26`, `turin` (collaborator PRs), and self-hosted `tinybox`, `tinyboxgreen`, `comma4`, `framework` and `macOS`. The architectures of the self-hosted and macOS runners are not stated in the findings.

RISE: the RISE runners post names 17 users, and tinygrad is not among them. See [RISE runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) and the [RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | `ubuntu-24.04`, `turin` | Not confirmed [NEEDS VERIFICATION] | None |
| QEMU emulation job | n/a | `qemu-user-static` for DSP/QCOMCL (Qualcomm targets) | None |
| Test matrix entry | `testlinux` (CPU:CLANG, CPU:LLVM, CPU:LVP, CPU:X86, CL, WEBGPU) | Not confirmed | None |
| riscv64 tests in `test/` | n/a | n/a | None |

## 8. Distribution and Release Status

| Channel | riscv64 | Evidence |
|---|---|---|
| PyPI | Pure-Python only | `tinygrad-0.14.0-py3-none-any.whl` and sdist; no riscv64-tagged file. The [PyPI JSON](https://pypi.org/pypi/tinygrad/json) lists only these two files. |
| RISE GitLab PyPI index | No riscv64 wheels | The request redirects to pypi.org, which lists 21 versions (0.1.0 to 0.14.0), each with a py3-none-any wheel and a tarball. tinygrad is not on the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) page. |
| Ubuntu 26.04 (resolute) | No | The [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=tinygrad&suite=resolute&searchon=names&section=all) found no `tinygrad`, `python3-tinygrad` or `libtinygrad`. |
| Arch Linux RISC-V | Not confirmed | The [index page](https://archriscv.felixc.at/?q=tinygrad) returned no result, but it does not settle whether a package exists. |
| GitHub releases | Not checked | Access denied. Release asset names are unchecked. |
| Project graph | Not checked | The `project_graph_query` tool was not available. |

What a user must do: install the pure-Python wheel from PyPI on a riscv64 Python 3.11 or newer, install `clang` from the distro, and select a CPU device through `DEV`. Because of the defects in Section 4, only the subset of kernels that avoids relocations is expected to run via Clang. This has not been run.

## 9. Dependencies

tinygrad has no hard dependencies. The table covers runtime dependencies and the optional test extras, from the project-graph substitute check: Ubuntu `resolute` riscv64 `main` and `universe` Packages indexes matched by exact package name. "Found" below refers to those indexes. Only the Ubuntu index match is available for most rows. Build, test and community status come from existing project reports where cited, and "Not assessed" means no report was read.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community / pointer |
|---|---|---|---|---|---|
| LLVM | CPU/AMDGPU JIT codegen, loaded via ctypes | Supported (RISC-V is an official LLVM backend) | Upstream buildbots; the report grades it yellow | Found: libllvm20, libllvm21, libllvm22 | tinygrad's LLVM triple map lacks riscv64. See project-reports/llvm.md in the sw-ecosystem repo. |
| Clang (additional) | CPU backend compiler, invoked as `clang` | Supported | Via LLVM | Found: clang-21, libclang1-21, libclang-cpp21 | Part of the LLVM project. See project-reports/llvm.md. |
| Python | Runtime, 3.11 or newer | CPython Tier 3 | Tier 3 buildbot | Found: python3 3.14.3 | See project-reports/python.md. |
| GCC | Runtime, via libgcc_s for `__clear_cache`; sentencepiece needs GCC 14 or newer | Present | n/a | Found: libgcc-s1 | No blocker. The `gcc` package itself was not queried. |
| NumPy | `ops_npy`, tests | Works | Native riscv64 CI merged May 2026 (PR #31488) | Found: python3-numpy | See project-reports/numpy.md. |
| PyTorch | Test oracle (`torch==2.9.1`) | Available | Not stated | Found: python3-torch 2.9.1. RISE announced it on 2026-08-18 | Triton/Inductor phases unbuilt. See project-reports/pytorch.md and the [RISE post](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/). |
| Z3 | Uop symbolic checks (`z3-solver<4.15.4`) | Not assessed | Not assessed | Found: python3-z3, libz3-4, both 4.13.3 | No report; Z3 is in `projects.yml` without a report. |
| capstone | Disassembly helper (tests) | RISC-V disassembly is upstream | Not captured | Found: python3-capstone, libcapstone5, libcapstone-dev (5.0.7); libcapstone4 not found | tinygrad's own `capstone_flatdump` does not use the RISC-V mode. See project-reports/capstone.md. |
| ONNX | Tests (`onnx==1.19.0`) | Not captured | Not captured | Found: python3-onnx 1.20.0 (differs from pin) | Report grades it orange. See project-reports/onnx.md. |
| onnxruntime (additional) | Tests (`==1.24.1`) | Not captured | Not captured | Found: python3-onnxruntime 1.23.2 (below pin) | `projects.yml` has no ONNX Runtime entry. See project-reports/onnx.md. |
| safetensors | Weights loading (tests) | Wheel build added to CI (PR #708) | Not captured | Found: python3-safetensors | See project-reports/safetensors.md. |
| sentencepiece | Tokenizer (tests) | Builds (needs GCC 14 or newer) | Not captured | Found: python3-sentencepiece; upstream reverted riscv64 wheels (PR #1226) | Issue #1250 is open. See project-reports/sentencepiece.md. |
| OpenCV | Test extra | Blue in report | Not captured | Found: python3-opencv 4.10.0 | See project-reports/opencv.md. |
| pytest | Test runner | Not assessed | Not assessed | Found as a riscv64 package | `projects.yml` lists pytest without a report. |
| dawn | WebGPU backend (`webgpu_dawn` lib via ctypes) | Platform macros only | Zero upstream riscv64 CI | Not found (`libwebgpu-dev`, `libdawn-dev` absent) | Only community PR #78 touches riscv64, and its merge status is disputed. See project-reports/dawn.md. |
| Mesa | NIR/LVP software rasterizer (`tinymesa==25.2.7.2` extra) | Not assessed | Not assessed | Found: mesa-libgallium, libgl1-mesa-dri, libegl-mesa0 (26.0.3) | The pip wheel `tinymesa` is separate from distro Mesa. Whether `tinymesa` publishes riscv64 wheels is unverified. `projects.yml` has Mesa without a report. |
| OpenCL | `ops_cl` GPU backend (ICD loader) | Not assessed | Not assessed | Found: ocl-icd-libopencl1, ocl-icd-opencl-dev, pocl-opencl-icd (libpocl2t64 6.0) | `projects.yml` has OpenCL without a report. |
| libusb | `runtime/support/usb.py` | Not assessed | Not assessed | Found: libusb-1.0-0 | `projects.yml` has libusb without a report. |
| Triton (additional) | Mentioned only as a comment in the pyproject | None | None | Not found (`python3-triton` absent) | Orange in report; no riscv64 port or tracking issue. See project-reports/triton.md. |

Other test-extra packages found as riscv64 packages: hypothesis, tqdm, networkx, pandas, boto3, tiktoken, numba, nibabel, mypy, typeguard, pytest-xdist, mako, pyyaml, openai, gguf, bottle, tabulate. Not found: ruff, pylint, pre-commit, mkdocs, transformers, librosa, pycocotools, blobfile.

Deep-dive on dependencies that carry the CPU backend:
- LLVM and Clang are the critical path. Both are packaged and the RISC-V backend is official upstream, so toolchain availability is not the problem. The problems are in tinygrad's own glue (Section 4).
- Numerics and version pins: Z3 4.13.3, ONNX 1.20.0 and onnxruntime 1.23.2 in the distro differ from tinygrad's pins (Z3 below the `<4.15.4` ceiling, ONNX newer than 1.19.0, onnxruntime below 1.24.1). Whether these differences break tinygrad's tests on riscv64 was not tested.
- The transitive `hasDependency` graph queries were not run. Depth beyond the first level is therefore not covered.

## 11. Known Bugs and Active Issues

The tinygrad issue tracker could not be read. Issue searches for "riscv", "riscv64" and "RISC-V support" returned zero results, but this is not trustworthy because access to the repository was denied. A WebFetch of the GitHub search page for "riscv" returned only two PRs and no issues (from a summarized page, not independently verified). That result conflicts with the existence of issue #9465, which was seen in a web search snippet. No master tracking issue for a riscv64 port was found.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#9465](https://github.com/tinygrad/tinygrad/issues/9465) | Support for RISC-V ? | Closed per search snippet; content unread | Unknown | Opened 2025-03-16. [NEEDS VERIFICATION] |
| None (code reading) | `elf.py` has no `R_RISCV_*` relocation handling | Unreported as far as found | High | Section 4, defect 2. Not run. |
| None (code reading) | `compiler_llvm.py` riscv64 init name and missing triple | Unreported as far as found | Medium | Section 4, defect 1. Sources disagree on the exact failure (`AttributeError` vs `KeyError`). |
| None (code reading) | `capstone_flatdump` lacks riscv64 | Unreported as far as found | Low | Debug tooling only. |

Correctness bugs: none found in an issue tracker. Data not available for NaN or floating-point issues, since the tracker could not be searched for them.

## 12. Objections and Upstream Blockers

- Stated objections: none found. The one riscv64 PR was merged two days after opening (2025-09-12 to 2025-09-14). Review comments were not readable.
- Technical blockers: the missing relocation support and the LLVM glue gaps (Section 4). The upstream contribution rules favor small, tested diffs, so a relocation implementation would need to be split and come with regression tests. Tests that depend on riscv64 hardware would also need CI to run.
- Organizational blockers: there is no foundation, tier policy or maintainer for riscv64, and no company affiliation is declared. The project has dropped platforms before (Windows, 2026-10-16), so riscv64 support without CI could be removed.
- Acceptance probability: no direct evidence beyond the single accepted 2-line PR and the README's stance that new backends are welcome. Treat as favorable for small, tested patches. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream
- **Optimization-purpose project:** no

Justification: this is the Step 0 shortcut, since the project is architecture-independent and inherits riscv64 from its runtime. The upstream [PyPI release 0.14.0](https://pypi.org/pypi/tinygrad/json) is a pure-Python `py3-none-any` wheel plus sdist with no compiled code and no dependencies. Support for the CPU architecture arrived in [PR #12136](https://github.com/tinygrad/tinygrad/pull/12136), first released in v0.12.0.

Caveat from code reading only (not run on hardware): the CPU backend's riscv64 path looks incomplete. `compiler_cpu.py` passes `-march=rv64g`, but `elf.py` has no `R_RISCV_*` relocation handling, so most Clang-compiled kernels would likely fail to load. The LLVM path (`compiler_llvm.py`) lacks a riscv64 triple, and there is no riscv64 CI or tests. A separate code-level verification judged this "builds and imports; CPU backend unreliable". That wording is stronger than the grade's, and both rest on reading code. This is not confirmed breakage (no run, no issue), so it is not red.

Pending work that could change the grade:
- No open riscv64 PRs or issues were found, but the issue tracker could not be read, so this is unverified. Issue #9465 was not read.
- No RISE involvement: RISE has no tinygrad posts, repos or funded work, and tinygrad does not use RISE runners.
- If someone runs tinygrad on riscv64 hardware or QEMU and confirms that the CPU/Clang kernels fail to load, the grade should be reconsidered (red or orange). Fixes would be `R_RISCV_*` relocations in `elf.py`, a riscv64 triple in `compiler_llvm.py`, and a riscv64 CI job.
- tinygrad is not in `projects.yml` and has no project-reports entry yet.

## 14. Investment Analysis

RISE check: RISE has no tinygrad blog posts (36 posts in the sitemap, none mention tinygrad; the feed was read except one stretch), no repo, no funded work and no runner usage. The only trace is the line `tinygrad` in `riseproject-dev/sw-ecosystem/project-graph-mcp/pypi-packages.txt`. No work in this section is already covered by RISE. The effort figures below are engineering estimates by the author, not derived from the research findings. They assume an engineer familiar with ELF and the tinygrad runtime, and they have not been validated against riscv64 hardware.

### 14.1 Functional Enablement

- Confirm the failure first: run the CPU backend on riscv64 hardware or QEMU, and capture which relocations kernels produce. The compile-only evidence shows `R_RISCV_PCREL_HI20`, `R_RISCV_PCREL_LO12_I` and `R_RISCV_CALL_PLT`.
- Implement `R_RISCV_*` handling in `elf.py` (HI20/LO12 pairs, CALL/CALL_PLT, plus a trampoline as for AArch64), with regression tests, in small PRs per upstream rules.
- Fix `compiler_llvm.py`: use the `LLVMInitializeRISCV*` names and add a riscv64 triple.
- Add a RISC-V mode to `capstone_flatdump`.

### 14.2 Performance Optimization

No benchmark data exists, so sizing starts with measurement. After functionality works, evaluate passing RVV and bit-manipulation feature flags (for example Zba, Zbb) through the existing `DEV` feature mechanism on real RVV hardware, and compare against arm64. A native ISA renderer like `x86.py` (782 lines) is a large, speculative item, and upstream is strict about line count and benchmarked speedups.

### 14.3 CI/CD Infrastructure

Add a riscv64 job running the existing CPU tests (`CPU:CLANG`, `CPU:LLVM`) on the free [RISE native runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/). Without CI, the support is exposed to removal, as the Windows removal shows. tinygrad's own pytest extras are mostly packaged for riscv64, but the runner image still needs `clang` and Python 3.11 or newer.

### 14.4 Ecosystem Enablement

tinygrad is a standalone framework with no significant dependent package ecosystem (Section 10 omitted). Work here is limited to its optional test dependencies: `tinymesa` riscv64 wheels (unverified), Dawn (no riscv64 package), and pin mismatches for Z3, ONNX and onnxruntime. These are Low priority because they affect optional tests and backends only.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Reproduce on riscv64 hardware or QEMU, catalog failing relocations | 1 | Chip company engineer | Critical |
| Functional | `R_RISCV_*` relocations and trampoline in `elf.py`, with tests | 3-4 | Chip company engineer, upstream PR | Critical |
| Functional | LLVM path: `LLVMInitializeRISCV*` names, riscv64 triple | 1 | Chip company engineer, upstream PR | High |
| Functional | Capstone RISC-V mode in `capstone_flatdump` | 0.5 | Chip company engineer | Low |
| CI/CD | riscv64 job on RISE runners | 1-2 | Chip company engineer with RISE | High |
| Performance | Benchmark baseline vs arm64, RVV feature-flag evaluation | 3-6 | Chip company performance team | Medium |
| Performance | Native RISC-V ISA renderer | 12-20 | Chip company compiler team | Low |
| Ecosystem | `tinymesa`, Dawn, version-pin checks for optional extras | 2-3 | RISE ecosystem / chip company | Low |

## 15. References

- [tinygrad repository](https://github.com/tinygrad/tinygrad)
- [tinygrad homepage](https://tinygrad.org/)
- [PR #12136, add cpu support for riscv64](https://github.com/tinygrad/tinygrad/pull/12136)
- [Commit 4b7904e, add cpu support for riscv64 (#12136)](https://github.com/tinygrad/tinygrad/commit/4b7904eca91b4a9612d9b423f5e2ca4191830814)
- [Issue #9465, Support for RISC-V ?](https://github.com/tinygrad/tinygrad/issues/9465)
- [PR #14664, Tenstorrent backend bounty](https://github.com/tinygrad/tinygrad/pull/14664)
- [PR #15926, cpu: normalize ARM64 arch alias](https://github.com/tinygrad/tinygrad/pull/15926)
- [Commit 1c45b9f, start nvpci (#10521)](https://github.com/tinygrad/tinygrad/commit/1c45b9f7fbd06887e54eb4d5e6dcbb74d9b8b85b)
- [Commit 2075fde, FPGA Based Accelerator for Tinygrad (#258)](https://github.com/tinygrad/tinygrad/commit/2075fdeb4f1498da9b529ca31f060b8b9e5e1f10)
- [docs/runtime.md](https://github.com/tinygrad/tinygrad/blob/master/docs/runtime.md)
- [tinygrad on PyPI (JSON)](https://pypi.org/pypi/tinygrad/json)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 package search for tinygrad](https://packages.ubuntu.com/search?keywords=tinygrad&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/?q=tinygrad)
- [RISE Project](https://riseproject.dev/)
- [RISE runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE runners six weeks in (2026-05-12)](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [PyTorch is available on riscv64 (RISE, 2026-08-18)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [Announcing the 2025 AI and RISC-V Gemini credit recipients (RISE)](https://riseproject.dev/2025/12/17/announcing-the-2025-ai-risc-v-gemini-credit-recipients/)
- [RISE members](https://riseproject.dev/members/)
- [RISE feed](https://riseproject.dev/feed/)