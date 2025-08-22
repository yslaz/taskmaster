# Dockerfile para TaskMaster Backend (Rust + Actix-web)

# ============================================
# Build Stage - Compilación optimizada
# ============================================
FROM rustlang/rust:nightly-slim as builder

# Instalar dependencias del sistema necesarias para compilar
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración de Rust
COPY Cargo.toml Cargo.lock ./

# Crear un proyecto dummy para cachear dependencias
RUN mkdir -p src/bin && \
    echo "fn main() {}" > src/main.rs && \
    echo "fn main() {}" > src/bin/check_db.rs

# Compilar dependencias (se cachea esta capa)
RUN cargo build --release && rm src/main.rs src/bin/check_db.rs

# Copiar código fuente real
COPY . .

# Compilar aplicación optimizada
RUN cargo build --release

# ============================================
# Runtime Stage - Imagen de producción
# ============================================
FROM debian:bookworm-slim

# Instalar dependencias de runtime
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libpq5 \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Crear usuario no-root para seguridad
RUN useradd -r -s /bin/false taskmaster

# Crear directorio de trabajo
WORKDIR /app

# Copiar binario compilado desde build stage
COPY --from=builder /app/target/release/taskmaster-backend /app/

# Cambiar ownership al usuario taskmaster
RUN chown taskmaster:taskmaster /app/taskmaster-backend

# Cambiar a usuario no-root
USER taskmaster

# Exponer puerto
EXPOSE 8000

# Configurar variables de entorno por defecto
ENV RUST_LOG=info
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Comando de inicio
CMD ["./taskmaster-backend"]