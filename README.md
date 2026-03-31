# 🏋️ KLYRO — El Duolingo del Fitness

App fitness mobile-first con sistema de XP, streaks, ligas y entrenamientos diarios generados automáticamente.

---

## 🚀 Stack

- **React + Vite** — Frontend rápido
- **Supabase** — Auth + Base de datos PostgreSQL
- **TailwindCSS** — Estilos utility-first
- **React Router** — Navegación SPA

---

## 📁 Estructura del proyecto

```
klyro/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BottomNav.jsx     # Navegación inferior
│   │   ├── Loader.jsx        # Pantalla de carga
│   │   ├── StatCard.jsx      # Tarjeta de estadística
│   │   └── XPBar.jsx         # Barra de progreso XP
│   ├── context/
│   │   └── AuthContext.jsx   # Estado global de autenticación
│   ├── lib/
│   │   ├── supabase.js       # Cliente Supabase
│   │   └── workouts.js       # Generador de entrenamientos
│   ├── pages/
│   │   ├── Home.jsx          # Pantalla principal
│   │   ├── Leagues.jsx       # Ligas y ranking
│   │   ├── Login.jsx         # Login / Registro
│   │   └── Profile.jsx       # Perfil y historial
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── supabase_schema.sql       # SQL para crear las tablas
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## ⚙️ Paso 1 — Instalar dependencias

```bash
cd klyro
npm install
```

---

## 🗄️ Paso 2 — Configurar Supabase

### 2.1 Crear proyecto

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un **New Project** (guarda la contraseña de la DB)
3. Espera a que termine de provisionar (~1 minuto)

### 2.2 Crear las tablas

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Crea un **New query**
3. Copia y pega el contenido de `supabase_schema.sql`
4. Haz clic en **Run** ✅

Esto crea las tablas `users`, `workouts`, `leagues`, `league_members` con todas las políticas de seguridad (RLS).

### 2.3 Obtener las credenciales

1. Ve a **Settings → API** en tu proyecto Supabase
2. Copia:
   - **Project URL** → `https://xxxxxxxx.supabase.co`
   - **anon / public key** → la clave larga que empieza por `eyJ...`

### 2.4 Crear el archivo .env

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
VITE_SUPABASE_URL=https://TU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR...
```

---

## 🔐 Paso 3 — Configurar Auth (opcional: Google)

### Email/Password (ya funciona por defecto)

En Supabase → **Authentication → Providers → Email**: activado por defecto ✅

Para confirmar emails automáticamente en desarrollo:
- Ve a **Authentication → Settings**
- Desactiva **"Enable email confirmations"** (para desarrollo)

### Google OAuth (opcional)

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Ve a **APIs & Services → Credentials → Create OAuth Client ID**
3. Tipo: **Web Application**
4. Authorized redirect URIs: `https://TU_PROJECT_ID.supabase.co/auth/v1/callback`
5. Copia **Client ID** y **Client Secret**
6. En Supabase → **Authentication → Providers → Google**: pega las credenciales

---

## ▶️ Paso 4 — Ejecutar en local

```bash
npm run dev
```

La app estará en `http://localhost:5173` 🎉

---

## 📦 Paso 5 — Build para producción

```bash
npm run build
npm run preview  # para probar el build localmente
```

Para desplegar, sube la carpeta `dist/` a:
- **Vercel**: `vercel --prod`
- **Netlify**: arrastra la carpeta `dist/`
- **Cloudflare Pages**: conecta el repo

---

## 🎮 Cómo funciona la app

| Acción | Resultado |
|--------|-----------|
| Completar entrenamiento | +20 XP |
| Cada 100 XP | Sube de nivel |
| Completar día consecutivo | Streak +1 |
| No completar | Streak se reinicia |
| Nivel 1-2 | Beginner (rutinas básicas) |
| Nivel 3+ | Intermediate (más volumen) |

### Rotación de entrenamientos
La app sigue la rotación clásica **Push → Pull → Legs** y se adapta al nivel del usuario.

---

## 🏆 Sistema de ligas

1. **Crear liga**: introduce un nombre → se genera un código de 6 letras
2. **Unirse**: introduce el código de otra persona
3. **Ranking**: ordenado por XP total descendente

---

## 🐛 Troubleshooting

**Error "relation does not exist"**: Ejecuta el SQL del schema en Supabase.

**No se guarda el perfil**: Verifica que las políticas RLS estén creadas correctamente (el SQL las incluye).

**Google auth no funciona**: Verifica que el redirect URI en Google Cloud coincide exactamente con el de Supabase.

**Pantalla en blanco**: Revisa la consola del navegador y verifica que `.env` tiene los valores correctos.
