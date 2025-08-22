#!/bin/bash

echo "🔍 Diagnóstico de Conectividad PostgreSQL"
echo "=========================================="

# Leer variables de entorno
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Extraer componentes de la URL
DB_URL=${DATABASE_URL:-"postgresql://admin:YWRtaW4=@localhost:5432/taskmaster"}
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_USER=$(echo $DB_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📍 Configuración:"
echo "   Host: $DB_HOST"
echo "   Puerto: $DB_PORT"
echo "   Usuario: $DB_USER"
echo "   Base de datos: $DB_NAME"
echo ""

# 1. Ping al servidor
echo "🏓 Probando conectividad básica..."
if ping -c 3 $DB_HOST > /dev/null 2>&1; then
    echo "✅ Host $DB_HOST es alcanzable"
else
    echo "❌ Host $DB_HOST NO es alcanzable"
fi
echo ""

# 2. Probar puerto con netcat/telnet
echo "🔌 Probando puerto $DB_PORT..."
if command -v nc > /dev/null; then
    if nc -z -w3 $DB_HOST $DB_PORT; then
        echo "✅ Puerto $DB_PORT está abierto"
    else
        echo "❌ Puerto $DB_PORT está cerrado o bloqueado"
    fi
elif command -v telnet > /dev/null; then
    timeout 3 telnet $DB_HOST $DB_PORT && echo "✅ Puerto conectado" || echo "❌ Puerto no disponible"
else
    echo "⚠️  nc/telnet no disponible para probar puerto"
fi
echo ""

# 3. Probar con psql si está disponible
echo "🗄️  Probando conexión PostgreSQL..."
if command -v psql > /dev/null; then
    PGPASSWORD=${DATABASE_URL#*:*:} psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Conexión PostgreSQL exitosa"
    else
        echo "❌ Conexión PostgreSQL falló"
    fi
else
    echo "⚠️  psql no disponible"
fi
echo ""

# 4. Probar con Docker si está disponible
echo "🐳 Probando con Docker..."
if command -v docker > /dev/null; then
    docker run --rm postgres:15 pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL responde (via Docker)"
    else
        echo "❌ PostgreSQL no responde (via Docker)"
    fi
else
    echo "⚠️  Docker no disponible"
fi
echo ""

echo "📋 Resumen de verificaciones completado"
echo "Si hay problemas, revisa:"
echo "  1. Firewall del servidor"
echo "  2. Configuración de Docker"
echo "  3. Variables de entorno"
echo "  4. Credenciales de base de datos"
