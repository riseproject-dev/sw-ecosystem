# Recommended RISC-V Software Ecosystem Expansion for Key Industry Markets

**Date:** August 2026  
**Scope:** Proposed expansion of tracked open-source projects in [scope.yml](file:///Users/gregsterling/repos/git/sw-ecosystem/scope.yml) to cover Virtualization, Machine Learning, IoT & Edge, Automotive, and Aerospace markets.

---

## Executive Summary

The current tracking list of 147 open-source projects covers core Linux OS tools, container engines, language runtimes, and baseline ML libraries. To support key growth markets for RISC-V hardware—specifically **Virtualization**, **Machine Learning**, **IoT & Edge**, **Automotive**, and **Aerospace**—the software tracking scope should be expanded to include critical industry-standard libraries, real-time operating systems (RTOS), and safety-critical middleware.

---

## 1. Virtualization Market

While the current scope tracks heavy-weight hypervisors ([QEMU](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/qemu.md), [libvirt](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/libvirt.md)) and container engines ([containerd](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/containerd.md), [runc](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/runc.md)), modern cloud and edge infrastructure relies on **Rust-based microVMs**, **user-space I/O drivers**, and **type-1 bare-metal hypervisors**:

- **Cloud Hypervisor** (`cloud-hypervisor/cloud-hypervisor`): A Rust-based Virtual Machine Monitor (VMM) built on KVM. It is the modern standard for lightweight cloud microVMs (offering faster boot times and lower memory overhead than QEMU).
- **Firecracker** (`firecracker-microvm/firecracker`): AWS-developed Rust microVM monitor for serverless/FaaS environments. Tracking RISC-V porting is critical for multi-tenant cloud/edge function execution.
- **crosvm** (`google/crosvm`): ChromeOS Virtual Machine Monitor (Rust), heavily used in Android Virtualization Framework (AVF) and automotive domain isolation.
- **DPDK (Data Plane Development Kit)** (`DPDK/dpdk`): High-speed packet processing drivers and libraries running in user space. Essential for Network Functions Virtualization (NFV) and virtual switches on RISC-V servers.
- **SPDK (Storage Performance Development Kit)** (`spdk/spdk`): User-space, polled-mode NVMe storage drivers. Crucial for high-throughput virtualized block storage backends.
- **Xen Hypervisor** (`xen-project/xen`): Type-1 bare-metal hypervisor. Critical for partitioning and safety-critical isolation in virtualized automotive and aerospace ECUs.

---

## 2. Machine Learning & AI Market

The current scope tracks key frameworks ([PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/pytorch.md), [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md), [llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/llama-cpp.md), [LiteRT](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/litert.md), [ONNX](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/onnx.md)), but lacks **ML compilers**, **classical scientific ML packages**, and **vector search databases**:

- **OpenAI Triton** (`triton-lang/triton`): A Python-like language and compiler for custom ML kernels. Triton is the primary backend engine for PyTorch 2.0 (`torch.compile` / Inductor); establishing RISC-V Triton support is a prerequisite for PyTorch compilation performance.
- **Apache TVM** (`apache/tvm`): An end-to-end deep learning compiler stack targeting embedded hardware and RISC-V vector extensions (RVV).
- **IREE** (`iree-org/iree`): An MLIR-based execution environment and compiler for embedded and CPU vector acceleration. A key target of the RISE AI/ML working group.
- **MNN (Alibaba MNN)** (`alibaba/MNN`): A lightweight mobile/embedded deep learning engine with dedicated RVV 1.0 assembly kernels.
- **Tencent NCNN** (`Tencent/ncnn`): High-performance neural network inference framework optimized for mobile and embedded devices.
- **scikit-learn** (`scikit-learn/scikit-learn`) & **SciPy** (`scipy/scipy`): Core Python classical machine learning and scientific computing libraries.
- **Milvus / Knowhere** (`milvus-io/milvus` / `knowhere`): Vector database engine and vector index library for production RAG and AI search workflows.

---

## 3. IoT & Edge Work Market

Edge and IoT devices operate under strict memory, power, and real-time constraints, requiring **real-time operating systems (RTOS)**, **TinyML frameworks**, and **embedded security/communication protocols**:

- **Zephyr RTOS** (`zephyrproject-rtos/zephyr`): The Linux Foundation's flagship real-time operating system for IoT devices. Has active RISC-V support, but requires continuous tracking for RVV and POSIX API compliance.
- **FreeRTOS** (`FreeRTOS/FreeRTOS`): The de-facto open-source microcontroller RTOS for low-power edge hardware.
- **TFLite for Microcontrollers (tflite-micro)** (`tensorflow/tflite-micro`): TinyML inference engine designed to run neural networks on microcontrollers with KB-level RAM (includes RVV microkernels).
- **mbedTLS** (`Mbed-TLS/mbedtls`) / **wolfSSL** (`wolfSSL/wolfssl`): Embedded TLS/crypto libraries designed for small-footprint hardware. Essential for validating hardware crypto ISA extensions (Zkn/Zks).
- **Eclipse Mosquitto** (`eclipse/mosquitto`): Lightweight MQTT message broker for IoT edge messaging.
- **micro-ROS** (`micro-ROS/micro_ros_setup`): ROS 2 runtime optimized for microcontrollers, bridging edge sensors to autonomous systems.
- **cJSON** (`DaveGamble/cJSON`): Ultra-lightweight C JSON parser used across millions of embedded IoT firmware builds.

---

## 4. Automotive Market

Automotive software demands **real-time responsiveness**, **CAN-bus networking**, **safety-critical domain isolation**, and **autonomous driving middleware**:

- **ROS 2 (Robot Operating System 2)** (`ros2/ros2`): The foundational middleware framework for autonomous driving, robotics, and ADAS (Advanced Driver Assistance Systems).
- **eProsima Fast DDS** (`eProsima/Fast-DDS`) / **Eclipse CycloneDDS** (`eclipse-cyclonedds/cyclonedds`): High-performance Data Distribution Service (DDS) implementations used as the real-time transport engine for ROS 2 in automotive ECUs.
- **SocketCAN / can-utils** (`linux-can/can-utils`): Linux kernel CAN-bus subsystem utilities and user-space libraries for vehicle network communication.
- **Jailhouse Hypervisor** (`siemens/jailhouse`): A Linux-based partitioning hypervisor designed specifically for real-time safety-critical automotive domain isolation.
- **openpilot** (`commaai/openpilot`): Open-source driver assistance system (ADAS) software stack.

---

## 5. Aerospace Market

Aerospace and avionics systems require **fault-tolerant flight software**, **satellite/UAV autopilot engines**, **space-grade RTOSs**, and **safety-critical language runtimes**:

- **cFS (NASA Core Flight System)** (`nasa/cFS`): NASA's reusable flight software framework used in satellite missions, cubesats, and deep-space instruments.
- **NASA FPrime / F'** (`nasa/fprime`): NASA JPL's component-driven flight software framework designed for small-scale space systems and CubeSats.
- **RTEMS (Real-Time Executive for Multiprocessor Systems)** (`RTEMS/rtems`): Open-source real-time OS designed for space exploration, avionics, and flight hardware (long history on SPARC and RISC-V harts).
- **PX4 Autopilot** (`PX4/PX4-Autopilot`) & **ArduPilot** (`ArduPilot/ardupilot`): Leading open-source autopilot software stacks for uncrewed aerial vehicles (UAVs) and drones.
- **MAVLink** (`mavlink/mavlink`): Micro Air Vehicle communication protocol for drone and spacecraft telemetry.
- **GNAT / Ada & SPARK Runtimes** (`AdaCore/gnat-community`): Formal verification and safety-critical language runtime required for DO-178C avionics certification.

---

## Summary Matrix & Strategic Roadmap

| Market Segment | Proposed Additions | Strategic Benefit to RISC-V Ecosystem |
| :--- | :--- | :--- |
| **Virtualization** | `cloud-hypervisor`, `firecracker`, `crosvm`, `DPDK`, `SPDK`, `Xen` | Unblocks modern Rust microVMs, high-speed NVMe/networking, and Type-1 bare-metal isolation. |
| **Machine Learning** | `Triton`, `Apache TVM`, `IREE`, `MNN`, `scikit-learn`, `SciPy`, `Milvus` | Enables PyTorch 2.0 `torch.compile` codegen, deep learning compilation, and vector search. |
| **IoT & Edge Work** | `Zephyr RTOS`, `FreeRTOS`, `tflite-micro`, `mbedTLS`, `wolfSSL`, `Mosquitto` | Secures embedded microcontroller RTOS support, TinyML execution, and hardware crypto ISA validation. |
| **Automotive** | `ROS 2`, `Fast DDS`, `CycloneDDS`, `can-utils`, `Jailhouse` | Provides the software foundation for autonomous driving (ADAS), vehicle CAN-bus, and ECU isolation. |
| **Aerospace** | `NASA cFS`, `NASA FPrime`, `RTEMS`, `PX4 Autopilot`, `ArduPilot`, `MAVLink`, `GNAT (Ada)` | Unblocks flight software for satellites/drones and enables safety-critical DO-178C avionics certification. |
