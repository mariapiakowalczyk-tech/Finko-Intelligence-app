# Finko-Intelligence
Sistema inteligente para analizar el rendimiento de las publicaciones de Instagram de Finko Real Estate.

## Variables de entorno

Copia `.env.example` como `.env` y completá los valores. En Vercel configurá estas mismas variables en el proyecto (Settings > Environment Variables):

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` — clave pública (anon) de Supabase. La usan los endpoints de `/api` del lado del servidor y, a través de `/api/config`, también el login del lado del navegador. Es segura de exponer: está protegida por las políticas de Row Level Security.
- `ANTHROPIC_API_KEY` — clave de la API de Claude (console.anthropic.com), usada por `/api/resumen-ejecutivo` para generar el resumen ejecutivo de Dirección Comercial. Si falta, el dashboard sigue funcionando con el resumen generado por reglas (ver `js/executive.js`).

La `SUPABASE_SERVICE_KEY` (clave de escritura) **no** va en Vercel ni en `.env`: solo se usa localmente para correr `guardar_metricas.py`, exportándola en la terminal (`export SUPABASE_SERVICE_KEY="..."`).

## Autenticación

Marketing y Dirección Comercial inician sesión con un usuario y contraseña (Supabase Auth). Para dar de alta un usuario nuevo:

1. En Supabase: Authentication > Users > **Add user**, con su email y una contraseña.
2. Copiá su UID (aparece en esa misma pantalla).
3. En el SQL Editor, corré (una vez por usuario):
   ```sql
   insert into perfiles (user_id, rol, nombre)
   values ('UID-DEL-USUARIO', 'marketing', 'Nombre a mostrar');
   -- rol también puede ser 'direccion_comercial'
   ```

Ver `sql/002_perfiles.sql` para el detalle del esquema.
