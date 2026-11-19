# Nexo 2 · Organización personal sincronizada

Versión 2 de Nexo, con dos novedades sobre la v1:

- **Sincronización entre dispositivos:** entra con tu cuenta en el iPhone y en el Mac y los cambios aparecen en el otro al instante. Funciona también sin conexión: los cambios se suben al volver.
- **Recordatorios por Telegram:** un bot te escribe a la hora de cada tarea. Tiene botones **✅ Hecho**, **⏰ 15 min / 1 h** y **📅 Mañana**, y lo que pulses se refleja en la app. Además, cada mañana te manda un resumen del día.

Todo lo demás es igual que en la v1: Bandeja, Hoy, Semana, Mes, Áreas, 4 temas y saludos variados.

> La **v1** sigue publicada en `https://unaaiii06.github.io/nexo/` (repositorio `nexo`) y no cambia.
> Esta v2 vive en `https://unaaiii06.github.io/nexo-v2/` y guarda sus datos en otras claves, así que una no toca los datos de la otra.

---

## Personalización

- **13 temas** en Ajustes → Apariencia:
  - **Oscuros:** Obsidian, Titanium, Océano, Bosque y Grafito.
  - **Vivos (con fondo animado):** Vision, Aurora, Atardecer y Neón Cyber.
  - **Claros:** Alabaster, Cuarzo Rosa, Lavanda y Papel.
- **Logo «NE»** (la N y la E comparten el trazo central) con una versión para cada tema. Dentro de la app y en la pestaña del navegador cambia al instante; el icono de la pantalla de inicio del iPhone es el del tema activo al «Añadir a pantalla de inicio». Se regeneran con `npm run icons` (`scripts/generate-icons.mjs`).
- **Personalización encima del tema:** color de acento (12 colores o cualquiera con el selector), tipografía (sistema, redondeada, serif o mono), esquinas, efecto cristal (sólido, cristal o intenso), fondo (liso, luces o animado) y animaciones.
- **Perfil (Ajustes → Cuenta):** foto de perfil (cámara o fototeca; se recorta a 256 px), color del avatar o del borde de la foto y color de tu nombre en el saludo y en la barra lateral. Se sincroniza entre dispositivos.
- **Funciones (Ajustes → Funciones):** activa o desactiva apartados (Bandeja, Semana, Mes, Áreas) y bloques (hábitos, objetivos, hitos, agenda, prioridades, duración, enfoque semanal, revisión, saludos, progreso, Telegram, celebraciones). Al desactivar algo no se borra ningún dato.
- El tema, la personalización y las funciones se **sincronizan** entre tus dispositivos. Los temas están en `src/lib/themes.js` y las funciones en `src/lib/features.js`.

## Cómo funciona

```
 iPhone ─┐                         ┌─► Bot de Telegram ─► 🔔 aviso + botones
         ├─► Supabase (base de datos + cuentas)
   Mac ──┘        │  tiempo real        ▲
                  └─ cada minuto ─► función «send-reminders»
                                    función «telegram-webhook» ◄─ botones y /comandos
```

- **Datos:** cada tarea, hábito, hito u objetivo es una fila en la tabla `items`. Si editas lo mismo en dos sitios, gana el cambio más reciente.
- **Privacidad:** las reglas de la base de datos (RLS) hacen que cada cuenta solo pueda leer y escribir lo suyo.
- **Sin conexión:** la app guarda todo en el dispositivo (`localStorage`) y lleva una «bandeja de salida» con los cambios pendientes de subir.
- **Recordatorios:** cada tarea o bloque puede tener un aviso («A la hora», «15 min antes», «1 h antes», «A las 9:00» u otra fecha y hora). Cada minuto, `pg_cron` llama a la función `send-reminders`, que envía los avisos que tocan. Nunca envía el mismo aviso dos veces.

## Puesta en marcha (una sola vez)

### 1. Supabase (gratis)
1. Crea una cuenta en https://supabase.com y un proyecto nuevo (región: *West EU* o *Central EU*).
2. **Authentication → Sign In / Providers → Email:** desactiva **«Confirm email»**. Así puedes entrar nada más crear la cuenta, sin abrir el correo.
3. **SQL Editor → New query:** pega `supabase/setup.sql` y pulsa **Run**.
4. **Project Settings → API:** copia la *Project URL* y la clave *anon* / *publishable*. Son públicas: están pensadas para ir dentro de la app.
5. En la Terminal, dentro de la carpeta del proyecto:
   ```bash
   npm run supabase:setup -- https://TU-PROYECTO.supabase.co TU_CLAVE_ANON
   supabase login
   supabase functions deploy --project-ref TU-PROYECTO
   ```
6. **SQL Editor:** pega `supabase/cron.generated.sql` (lo genera el paso 5) y pulsa **Run**.

### 2. Bot de Telegram
1. En Telegram, abre **@BotFather** → `/newbot` → elige un nombre y un usuario que acabe en `bot`. Copia el **token** que te da.
2. En la Terminal: `npm run telegram:setup` y pega el token cuando te lo pida.
   El token va directo a Supabase y no se guarda en el proyecto.

### 3. Publicar en GitHub Pages
```bash
gh variable set VITE_SUPABASE_URL --body https://TU-PROYECTO.supabase.co
gh variable set VITE_SUPABASE_ANON_KEY --body TU_CLAVE_ANON
gh variable set VITE_TELEGRAM_BOT --body TuBot
git push        # o: gh workflow run deploy.yml
```

### 4. En el iPhone y en el Mac
1. Abre `https://unaaiii06.github.io/nexo-v2/` (en el iPhone, con Safari → Compartir → **Añadir a pantalla de inicio**).
2. **Crear cuenta** en un dispositivo y **Entrar** con la misma cuenta en el otro.
3. **Ajustes → Recordatorios por Telegram → Conectar Telegram** → en Telegram pulsa **Iniciar**.
4. Para pasarte tus datos de la v1: en la v1, **Ajustes → Exportar**; en la v2, **Ajustes → Importar copia**. En el Mac, si usaste la v1 en el mismo navegador, aparece directamente **«Importar … de Nexo 1»**.

## Desarrollo

```bash
npm install
npm run dev        # sin .env.local funciona en «modo local» (sin cuenta ni sincronización)
npm run build
npm run lint
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` / `preview` | Servidor accesible desde la red (`--host`) |
| `npm run build` | Compila a `dist/` con el Service Worker y el manifest |
| `npm run supabase:setup -- URL CLAVE` | Escribe `.env.local` y genera el SQL del programador |
| `npm run telegram:setup` | Conecta el bot: guarda los secretos, configura el webhook y los comandos |
| `npm run icons` | Regenera los iconos PNG |

## Estructura

```
nexo-v2/
├── supabase/
│   ├── setup.sql                 # tablas, seguridad (RLS), sincronización y recordatorios
│   ├── cron.sql                  # programador cada minuto (plantilla)
│   ├── config.toml               # funciones sin JWT (las protege su propio secreto)
│   └── functions/
│       ├── send-reminders/       # envía recordatorios y el resumen diario
│       ├── telegram-webhook/     # /start, /hoy, /desconectar y botones
│       └── _shared/telegram.ts
├── scripts/                      # supabase-setup, telegram-setup, iconos
└── src/
    ├── lib/supabase.js           # cliente (modo local si no hay configuración)
    ├── lib/reminders.js          # cálculo de la hora del aviso
    ├── store/auth.jsx            # cuenta: entrar, crear, salir, nombre
    ├── store/AppStore.jsx        # estado + seguimiento de cambios
    ├── sync/tracking.js          # bandeja de salida, fusión de cambios remotos
    ├── sync/useSync.js           # subida, descarga, tiempo real y reintentos
    └── components/ views/        # interfaz (igual que la v1 + Ajustes/Telegram)
```

## Comandos del bot

- `/hoy` · tareas de hoy con su estado
- `/desconectar` · deja de recibir avisos
- Botones de cada aviso: **✅ Hecho**, **⏰ 15 min**, **⏰ 1 h**, **📅 Mañana**
