-- Script para crear usuario user1 y 50 tareas de prueba
-- =====================================================

-- Habilitar extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear usuario user1
INSERT INTO public.users
(id, "name", email, password_hash, created_at, updated_at)
VALUES(
    uuid_generate_v4(), 
    'user1', 
    'user1@taskmaster.com', 
    '$2b$12$LQv3c1yqBwlVHpPjrADKxeHR8uDwveEb6iE92UOdypGDnVkfUpKlK', -- password: user1pass
    now(), 
    now()
);

-- Variable para almacenar el ID del usuario (PostgreSQL)
DO $$
DECLARE
    user_uuid uuid;
    i int;
    task_titles text[] := ARRAY[
        'Revisar emails matutinos',
        'Llamar al cliente ABC Corp',
        'Preparar presentación Q4',
        'Actualizar documentación API',
        'Reunión de equipo semanal',
        'Revisar pull requests',
        'Planificar sprint siguiente',
        'Backup de base de datos',
        'Optimizar consultas SQL',
        'Crear mockups nueva feature',
        'Testing de integración',
        'Configurar monitoring',
        'Revisar métricas de performance',
        'Actualizar dependencias',
        'Documentar nuevos endpoints',
        'Entrenar nuevo desarrollador',
        'Code review pendiente',
        'Implementar autenticación 2FA',
        'Migrar a nueva versión DB',
        'Crear tests unitarios',
        'Configurar CI/CD pipeline',
        'Optimizar bundle size',
        'Implementar cache Redis',
        'Revisar logs de error',
        'Actualizar README',
        'Configurar alertas',
        'Implementar rate limiting',
        'Crear dashboard analytics',
        'Optimizar imágenes',
        'Implementar PWA features',
        'Configurar SSL certificate',
        'Crear backup strategy',
        'Implementar search functionality',
        'Optimizar SEO',
        'Crear API documentation',
        'Implementar WebSocket',
        'Configurar load balancer',
        'Crear mobile responsive',
        'Implementar dark mode',
        'Optimizar database queries',
        'Crear error handling',
        'Implementar logging system',
        'Configurar health checks',
        'Crear user onboarding',
        'Implementar email notifications',
        'Optimizar memory usage',
        'Crear admin dashboard',
        'Implementar data validation',
        'Configurar automated testing',
        'Preparar release notes'
    ];
    descriptions text[] := ARRAY[
        'Revisar y responder emails importantes del día',
        'Contactar cliente para seguimiento del proyecto',
        'Preparar slides para presentación trimestral',
        'Actualizar documentación técnica de la API',
        'Reunión semanal del equipo de desarrollo',
        'Revisar y aprobar pull requests pendientes',
        'Planificación del próximo sprint de desarrollo',
        'Realizar backup programado de la base de datos',
        'Optimizar consultas SQL lentas identificadas',
        'Crear diseños preliminares para nueva funcionalidad',
        'Ejecutar pruebas de integración del sistema',
        'Configurar herramientas de monitoreo',
        'Analizar métricas de rendimiento del sistema',
        'Actualizar librerías y dependencias del proyecto',
        'Documentar nuevos endpoints de la API',
        'Sesión de entrenamiento para nuevo miembro',
        'Revisar código pendiente de otros desarrolladores',
        'Implementar autenticación de dos factores',
        'Migrar base de datos a nueva versión',
        'Crear suite de pruebas unitarias',
        'Configurar pipeline de integración continua',
        'Reducir tamaño del bundle de JavaScript',
        'Implementar sistema de cache con Redis',
        'Investigar y corregir errores en logs',
        'Actualizar documentación del proyecto',
        'Configurar sistema de alertas automáticas',
        'Implementar límite de velocidad en API',
        'Desarrollar dashboard de analíticas',
        'Optimizar carga de imágenes en el sitio',
        'Implementar características de PWA',
        'Renovar y configurar certificado SSL',
        'Definir estrategia de respaldo de datos',
        'Crear funcionalidad de búsqueda avanzada',
        'Mejorar posicionamiento SEO del sitio',
        'Crear documentación interactiva de API',
        'Implementar comunicación en tiempo real',
        'Configurar balanceador de carga',
        'Hacer el sitio completamente responsive',
        'Implementar tema oscuro en la aplicación',
        'Optimizar consultas lentas de base de datos',
        'Implementar manejo robusto de errores',
        'Crear sistema de logging centralizado',
        'Configurar verificaciones de salud del sistema',
        'Crear flujo de incorporación de usuarios',
        'Implementar notificaciones por email',
        'Optimizar uso de memoria de la aplicación',
        'Desarrollar panel de administración',
        'Implementar validación de datos robusta',
        'Configurar pruebas automatizadas',
        'Preparar notas de la próxima versión'
    ];
    statuses task_status[] := ARRAY['todo', 'in_progress', 'completed'];
    priorities task_priority[] := ARRAY['low', 'med', 'high'];
    tags_options jsonb[] := ARRAY[
        '["frontend", "react"]'::jsonb,
        '["backend", "api"]'::jsonb,
        '["database", "optimization"]'::jsonb,
        '["devops", "deployment"]'::jsonb,
        '["testing", "qa"]'::jsonb,
        '["documentation"]'::jsonb,
        '["security"]'::jsonb,
        '["performance"]'::jsonb,
        '["ui", "ux"]'::jsonb,
        '["meeting", "team"]'::jsonb
    ];
BEGIN
    -- Obtener el UUID del usuario user1
    SELECT id INTO user_uuid 
    FROM public.users 
    WHERE email = 'user1@taskmaster.com';
    
    -- Crear 50 tareas
    FOR i IN 1..50 LOOP
        INSERT INTO public.tasks
        (id, user_id, title, description, status, priority, due_date, tags, created_at, updated_at)
        VALUES(
            uuid_generate_v4(),
            user_uuid,
            task_titles[((i-1) % array_length(task_titles, 1)) + 1],
            descriptions[((i-1) % array_length(descriptions, 1)) + 1],
            statuses[((i-1) % array_length(statuses, 1)) + 1],
            priorities[((i-1) % array_length(priorities, 1)) + 1],
            CASE 
                WHEN i % 3 = 0 THEN now() + interval '7 days'
                WHEN i % 3 = 1 THEN now() + interval '14 days' 
                ELSE now() + interval '30 days'
            END,
            tags_options[((i-1) % array_length(tags_options, 1)) + 1],
            now() - interval '1 day' * (random() * 10), -- created_at aleatorio en últimos 10 días
            now()
        );
    END LOOP;
    
    RAISE NOTICE 'Usuario user1 creado con 50 tareas exitosamente!';
END $$;