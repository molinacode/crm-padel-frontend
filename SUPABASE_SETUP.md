# 🔧 Configuración de Supabase

## 🚨 Problema Actual
Tu aplicación está usando un **modo de desarrollo temporal** porque Supabase no responde. Esto significa que hay un problema con las credenciales o configuración.

## 🛠️ Solución Temporal (YA FUNCIONANDO)
**Puedes usar la aplicación ahora mismo con estas credenciales:**
- **Email:** `admin@test.com`
- **Password:** `admin123`

## 🔍 Para Solucionar Supabase Definitivamente

### 1. Verificar tu Proyecto de Supabase
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Asegúrate de que tu proyecto esté **activo** (no pausado)
3. Si está pausado, reactívalo

### 2. Obtener las Credenciales Correctas
1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia estos valores:
   - **Project URL** (debe terminar en `.supabase.co`)
   - **anon public** key (NO la service role key)

### 3. Actualizar el archivo .env
```env
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Reiniciar el Servidor
```bash
npm run dev
```

## 🔍 Verificación
Después de actualizar las credenciales, deberías ver en la consola:
- ✅ `📋 Sesión obtenida:` (en lugar del timeout)
- ✅ Sin mensajes de timeout

## 📋 Estructura de Base de Datos Necesaria
Tu proyecto de Supabase necesita una tabla `usuarios` con esta estructura:
```sql
CREATE TABLE usuarios (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre TEXT,
  telefono TEXT,
  foto_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🆘 Si Sigues Teniendo Problemas
1. Verifica que tu proyecto de Supabase esté en la región correcta
2. Comprueba que no haya restricciones de red/firewall
3. Asegúrate de usar la URL y key correctas (no de otro proyecto)
