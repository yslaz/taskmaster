# Testing Frontend - TaskMaster

## 🧪 Tests de Integración Real

Este documento describe la configuración y ejecución de las pruebas de integración del frontend que se conectan al backend real.

### 📋 Configuración

#### Archivos Clave

- `src/services/api.integration.test.ts` - Pruebas de integración principales
- `src/test/integration.setup.ts` - Configuración especial sin mocks
- `vitest.config.ts` - Configuración dual para tests unitarios e integración
- `package.json` - Scripts de ejecución

#### Variables de Entorno

```bash
VITEST_INTEGRATION=true  # Activa modo integración (sin MSW)
VITE_API_BASE_URL=http://192.168.200.4:8000/api/v1  # URL del backend
```

### 🚀 Ejecución

#### Comandos Disponibles

```bash
# Tests de integración (backend real)
npm run test:integration

# Tests de integración en modo watch
npm run test:integration:watch

# Tests unitarios solamente
npm run test:unit

# Todos los tests (incluye integración)
npm test

# UI de tests
npm run test:ui

# Coverage
npm run test:coverage
```

#### Prerrequisitos

1. ✅ Backend corriendo en `http://192.168.200.4:8000`
2. ✅ PostgreSQL activo y accesible
3. ✅ Variables de entorno configuradas

### 📊 Estructura de Tests

#### Categorías de Pruebas (32 tests total)

| Categoría | Tests | Descripción |
|-----------|-------|-------------|
| **Autenticación** | 5 | Registro, login, perfil, errores de auth |
| **CRUD Tareas** | 12 | Create, Read, Update, Delete con validaciones |
| **Respuestas** | 3 | Manejo de formatos de respuesta del backend |
| **Errores** | 6 | Códigos HTTP 400, 401, 403, 404, 5xx |
| **Datos** | 2 | Integridad de tipos y campos opcionales |
| **Performance** | 2 | Tiempos de respuesta y concurrencia |
| **Edge Cases** | 3 | Casos extremos y caracteres especiales |

#### Flujo de Cada Test

1. **Setup**: Crear usuario de prueba y obtener token real
2. **Ejecución**: Realizar operaciones contra el backend real  
3. **Validación**: Verificar respuestas y códigos de estado
4. **Cleanup**: Eliminar datos de prueba creados

### 🔧 Diferencias con Tests Unitarios

#### Tests de Integración (Real)
- ✅ Se conecta al backend real
- ✅ Sin MSW ni mocks
- ✅ Datos reales de PostgreSQL
- ✅ Timeout: 60 segundos
- ✅ Setup: `integration.setup.ts`

#### Tests Unitarios (Mock)
- 🔄 Usa MSW para mocks
- 🔄 Datos simulados
- 🔄 Timeout: 30 segundos  
- 🔄 Setup: `setup.ts`

### ⚡ Ejemplo de Uso

```bash
# 1. Asegurar que el backend esté corriendo
curl http://192.168.200.4:8000/api/v1/health

# 2. Ejecutar tests de integración
npm run test:integration

# 3. Ver resultados
✓ Authentication - Real Backend Tests (5)
✓ Tasks CRUD - Real Backend Tests (12)
✓ Response Handling - Real Backend Tests (3)
✓ Error Handling - Real Backend Tests (6)
✓ Data Integrity - Real Backend Tests (2)
✓ Performance - Real Backend Tests (2)  
✓ Edge Cases - Real Backend Tests (3)

Test Files  1 passed (1)
Tests  32 passed (32)
```

### 🐛 Troubleshooting

#### Backend No Disponible
```bash
❯ fetch failed
→ Verificar que el backend esté corriendo en el puerto 8000
```

#### Error de Autenticación
```bash
❯ Invalid JSON response  
→ Verificar campos de API (name vs full_name, email vs username)
```

#### Timeout de Tests
```bash
❯ Test timeout
→ Backend puede estar lento, verificar conexión a PostgreSQL
```

### 📝 Notas de Desarrollo

- Los tests crean usuarios únicos usando timestamps para evitar conflictos
- Se utiliza cleanup automático en `afterEach` para eliminar datos de prueba
- El campo `name` es requerido en registro (no `full_name`)
- Login requiere `email` (no `username`)
- Todas las respuestas siguen el formato `{success: boolean, data: any, message: string}`