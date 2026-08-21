# Stage 1: grab the oxigraph binary from the official image
FROM ghcr.io/oxigraph/oxigraph:latest AS oxigraph

# Stage 2: compile pg-collect, generate .nt data, build and optimize the DB
FROM rust:1-bookworm AS db-builder

COPY --from=oxigraph /usr/local/bin/oxigraph /usr/local/bin/oxigraph

RUN git clone --depth 1 https://github.com/packagegraph/platform.git /platform

WORKDIR /platform/etl/pg-collect

RUN cargo build --release

RUN cargo run --release -- deb-full \
      --repo http://deb.debian.org/debian \
      --dist trixie --component main \
      --arch amd64 --arch arm64 \
      --with-sources --with-salsa \
      -o /debian-trixie-full.nt

RUN oxigraph load \
      --location /project-graph \
      --file /debian-trixie-full.nt \
      --lenient

RUN oxigraph optimize --location /project-graph

# Stage 3: build Python venv
FROM python:3.12-slim AS py-builder

COPY requirements.txt .
RUN python -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install --no-cache-dir -r requirements.txt

# Final image: Python MCP server with pyoxigraph reading the pre-built database
FROM python:3.12-slim

COPY --from=db-builder /project-graph /app/project-graph
COPY --from=py-builder /venv /venv
COPY server.py /app/server.py

ENV PROJECT_GRAPH_DB=/app/project-graph
CMD ["/venv/bin/python", "/app/server.py"]
