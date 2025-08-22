# Frontend Integration Tests

Este directorio contiene las pruebas de integración para los servicios del frontend de TaskMaster.

## Estructura de Pruebas

### Servicios Cubiertos

1. **API Client** (`api.integration.test.ts`)
   - Pruebas del cliente HTTP base
   - Manejo de headers de autenticación
   - Métodos HTTP (GET, POST, PUT, DELETE)
   - Manejo de errores y respuestas

2. **Auth Service** (`auth.integration.test.ts`)
   - Login y registro de usuarios
   - Gestión de tokens JWT
   - Almacenamiento en localStorage
   - Flujos de autenticación completos

3. **Tasks Service** (`tasks.integration.test.ts`)
   - CRUD de tareas
   - Filtrado y paginación
   - Búsqueda de tareas
   - Validación de datos

4. **Stats Service** (`stats.integration.test.ts`)
   - Estadísticas generales y analytics
   - Filtros por periodo
   - Datos de series temporales
   - Cálculos estadísticos

5. **Notifications Service** (`notifications.integration.test.ts`)
   - Gestión de notificaciones
   - Conexiones WebSocket
   - Marcado de leídas
   - Helpers de formato

## Configuración de Pruebas

### Dependencias

- **Vitest**: Framework de pruebas
- **Testing Library**: Utilidades de testing para React
- **MSW**: Mock Service Worker para interceptar llamadas HTTP
- **jsdom**: Entorno DOM para pruebas

### Archivos de Configuración

- `vitest.config.ts`: Configuración principal de Vitest
- `setup.ts`: Configuración global de pruebas
- `mocks/server.ts`: Servidor MSW para mocks
- `mocks/handlers.ts`: Handlers HTTP para simulación de API
- `utils.tsx`: Utilidades y helpers de pruebas

## Cómo Ejecutar las Pruebas

### Comandos Disponibles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo pruebas de integración
npm run test:integration

# Ejecutar pruebas con interfaz UI
npm run test:ui

# Ejecutar pruebas con coverage
npm run test:coverage

# Ejecutar pruebas en modo watch
npm test -- --watch
```

### Ejecutar Pruebas Específicas

```bash
# Solo pruebas del servicio de auth
npm test auth.integration.test.ts

# Solo pruebas del servicio de tareas
npm test tasks.integration.test.ts

# Ejecutar con patrón
npm test -- --grep "login"
```

## Estructura de Mocks

### MSW (Mock Service Worker)

Las pruebas utilizan MSW para interceptar y simular llamadas HTTP al backend:

- **Handlers**: Simulan endpoints de la API real
- **Datos Mock**: Datos de prueba consistentes
- **Estados de Error**: Simulación de errores de red y HTTP

### LocalStorage Mock

Se simula el comportamiento de localStorage para:
- Almacenamiento de tokens JWT
- Datos de usuario
- Configuraciones persistentes

### WebSocket Mock

Simulación de conexiones WebSocket para:
- Notificaciones en tiempo real
- Estados de conexión
- Manejo de reconexiones

## Patrones de Prueba

### Estructura Típica de Test

```typescript
describe('Service Name Integration Tests', () => {
  beforeEach(() => {
    resetLocalStorageMock()
    setupAuthMock(true, 'mock-jwt-token')
  })

  describe('method name', () => {
    it('should handle success case', async () => {
      const result = await service.method(params)
      expect(result).toMatchObject(expectedShape)
    })

    it('should handle error case', async () => {
      await expect(service.method(invalidParams)).rejects.toThrow()
    })
  })
})
```

### Casos de Prueba Cubiertos

1. **Casos Exitosos**: Flujos normales de uso
2. **Manejo de Errores**: Errores HTTP, de red, de autenticación
3. **Validación de Datos**: Tipos correctos, formatos esperados
4. **Estados Edge**: Datos vacíos, valores nulos, límites
5. **Concurrencia**: Múltiples requests simultáneos
6. **Integración**: Flujos completos de usuario

## Mejores Prácticas

### Configuración de Pruebas

1. **Isolation**: Cada prueba es independiente
2. **Reset**: Estado limpio entre pruebas
3. **Mocks Consistentes**: Datos de prueba realistas
4. **Cleanup**: Limpieza de recursos después de cada prueba

### Escritura de Pruebas

1. **Descriptive Names**: Nombres claros y específicos
2. **Arrange-Act-Assert**: Estructura clara de pruebas
3. **Single Responsibility**: Una expectativa por prueba
4. **Error Testing**: Verificar manejo de errores

### Mantenimiento

1. **Update Mocks**: Mantener mocks sincronizados con API real
2. **Review Coverage**: Verificar cobertura de código regularmente
3. **Refactor Tests**: Mantener pruebas legibles y mantenibles

## Debugging

### Logs de Debug

```bash
# Ejecutar con logs detallados
npm test -- --reporter=verbose

# Ver logs de MSW
npm test -- --env VITE_DEBUG_MSW=true
```

### Herramientas Útiles

- **Vitest UI**: Interfaz visual para debugging
- **Coverage Reports**: Reportes de cobertura HTML
- **MSW DevTools**: Inspección de requests mockeados

## Integración con CI/CD

Las pruebas están configuradas para ejecutarse en:
- Pre-commit hooks
- Pull Request checks
- Deploy pipelines

## Troubleshooting

### Problemas Comunes

1. **MSW no intercepta requests**: Verificar configuración en setup.ts
2. **localStorage errors**: Confirmar mock setup en beforeEach
3. **WebSocket tests fallan**: Revisar mock WebSocket en setup.ts
4. **Timeouts**: Ajustar timeouts en vitest.config.ts

### Debugging Tips

1. Usar `console.log` en handlers MSW para debug requests
2. Verificar que mocks estén activos con `server.listHandlers()`
3. Usar `--no-coverage` para debugging más rápido
4. Ejecutar una sola prueba con `it.only()`