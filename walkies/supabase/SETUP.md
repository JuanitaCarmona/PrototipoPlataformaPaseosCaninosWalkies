# Supabase — configuración Walkies

Ejecutá estos scripts **en orden** en el proyecto **Walkies Maps** (o el que uses):  
**Supabase Dashboard → SQL Editor → New query → pegar → Run**.

## Orden de ejecución

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `schema.sql` | Tablas, RLS base, trigger inicial de perfil |
| 2 | `trigger_profile_role.sql` | Guarda `role` (owner/walker) al registrarse |
| 3 | `trigger_walker_on_profile.sql` | Crea fila en `walkers` si `role = walker` |
| 4 | `profile_insert_policy.sql` | Permite insertar el propio perfil |
| 5 | `walks_walker_update_policy.sql` | Paseador puede actualizar estado del paseo |
| 6 | `pickup_and_walker_location.sql` | Columnas de recogida y ubicación del paseador (si aplica) |
| 8 | `mvp_features.sql` | Valoraciones, chat, notificaciones, lectura de perfiles y timestamps de paseo |

Si `schema.sql` ya se ejecutó antes, podés correr solo los scripts **2–5** sin repetir todo.

## Probar RLS (punto 2)

Con **dos usuarios** (dueño A, paseador B):

1. **Dueño A:** solo ve/edita sus `pets` y `walks` de sus mascotas.
2. **Paseador B:** ve fila en `walkers` con su `user_id`; ve `walks` donde `walker_id` es el suyo; puede `update` estado (`pending` → `confirmed` → `in_progress` → `completed`).
3. **Dueño A** no debe poder actualizar paseos de mascotas ajenas.
4. Tabla `walkers`: lectura pública (`select` para todos) — correcto para listar paseadores en la app.

En **Table Editor**, comprobá que un paseo tenga `walker_id` = `walkers.id` del paseador B (no el `user_id`).

## Variables en la app

Archivo **`walkies/.env`** (no subir a Git):

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_MAPS_ANDROID_API_KEY=...
```

## Auth (desarrollo)

Si el registro pide **confirmar email**, en Supabase:  
**Authentication → Providers → Email** → desactivar “Confirm email” para pruebas locales, o confirmar el correo antes de probar el paseador.

## Flujo de prueba con 2 cuentas (dueño + paseador)

Usá **dos correos distintos** (ej. `tu+walker@gmail.com` y `tu+dueno@gmail.com`).

### Antes de empezar

- En Supabase: **Authentication → Providers → Email** → desactivar **Confirm email** (solo para pruebas).
- Verificá que corriste los scripts SQL **2–5** (triggers de perfil y paseador).

### Paso 1 — Cuenta paseador

1. En la app: **Regístrate** → rol **Paseador**.
2. **Perfil** → completar **bio** y **tarifa por hora** → guardar.
3. **Cerrar sesión**.

### Paso 2 — Cuenta dueño

1. **Regístrate** → rol **Dueño de mascotas** (otro correo).
2. **Mis mascotas** → agregar una mascota.
3. **Agendar** → elegir mascota, fecha/hora, punto de recogida y **seleccionar al paseador** del paso 1.
4. Confirmar el paseo (estado inicial: `pending`).

### Paso 3 — Volver al paseador

1. Cerrar sesión e ingresar con la cuenta paseador.
2. **Mis paseos** → **Confirmar** → **Iniciar** → **Completar**.

### Paso 4 — Verificar en dueño

1. Cerrar sesión e ingresar como dueño.
2. **Agendar → historial** → el paseo debe mostrar el estado final (`completed`).

### Comprobar en Supabase (opcional)

| Tabla | Qué revisar |
|-------|-------------|
| `profiles` | 2 filas (owner + walker) |
| `walkers` | 1 fila con `user_id` del paseador |
| `pets` | 1 mascota del dueño |
| `walks` | 1 paseo con `walker_id` = `walkers.id` (no el `user_id`) |

### Si algo falla

| Síntoma | Causa probable |
|---------|----------------|
| No aparece el paseador al agendar | Falta bio/tarifa o no hay fila en `walkers` |
| Paseador no ve el paseo | `walker_id` mal asignado o RLS sin script 5 |
| Registro “no hace nada” | Correo ya usado o falta confirmar email |
| `profiles` vacío | Falta `trigger_profile_role.sql` |
