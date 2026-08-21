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

# Final image: oxigraph serving the pre-built database
FROM ghcr.io/oxigraph/oxigraph:latest

COPY --from=db-builder /project-graph /project-graph
