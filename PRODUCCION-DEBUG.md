# Debugging en Producción - Error de JSON

## 🔍 Diagnóstico del Error

El error **"Unexpected token 'R', 'Request En'... is not valid JSON"** ocurre cuando:

1. Las APIs devuelven HTML en lugar de JSON
2. El Service Worker (PWA) está cacheando respuestas inválidas
3. Hay problemas de configuración en el servidor de producción
4. Las rutas API no están siendo reconocidas correctamente

## ✅ Cambios Implementados

### 1. Manejo Robusto de Errores en Frontend
- ✅ Verificación de `Content-Type` antes de parsear JSON
- ✅ Try-catch en todos los `.json()` calls
- ✅ Mensajes de error específicos para cada tipo de fallo
- ✅ Logging detallado en consola para debugging

### 2. Headers Explícitos en Todas las APIs
- ✅ `Content-Type: application/json` en todas las respuestas
- ✅ `Cache-Control: no-store` para evitar caching de errores
- ✅ Respuestas JSON garantizadas incluso en errores

### 3. Validación de Datos en APIs
- ✅ Try-catch al parsear request body
- ✅ Validación de tipos de archivo
- ✅ Mensajes de error descriptivos

## 🚀 Pasos para Desplegar en Producción

### 1. Limpiar Caché del Service Worker

```bash
# En la raíz del proyecto
rm -rf .next
rm -rf public/sw.js
rm -rf public/workbox-*.js
```

### 2. Rebuildar el Proyecto

```bash
npm run build
```

### 3. Variables de Entorno en Producción

Asegúrate de que estas variables estén configuradas en tu plataforma de hosting (Vercel, Netlify, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
```

### 4. Verificar Rutas API en Producción

Las rutas API deben estar en:
- `https://tudominio.com/api/colonias`
- `https://tudominio.com/api/luminarias`
- `https://tudominio.com/api/upload`

## 🔧 Debugging en Vivo

### Para Usuarios que Reporten el Error:

Pídeles que:

1. **Abran la consola del navegador** (F12 → Console)
2. **Reproduzcan el error**
3. **Copien todos los mensajes** que aparecen en rojo
4. **Busquen mensajes que empiecen con:**
   - `"Respuesta no-JSON del servidor:"`
   - `"Error parseando JSON:"`
   - `"Respuesta exitosa pero no-JSON:"`

### Información de Logs

Los nuevos cambios loguean:

```javascript
// Si una API devuelve HTML en lugar de JSON, verás:
"Respuesta no-JSON del servidor: <!DOCTYPE html>..."

// Si hay error parseando:
"Error parseando respuesta de luminaria: SyntaxError..."

// Con el contenido de la respuesta (primeros 200 caracteres)
```

## 🐛 Posibles Causas y Soluciones

### Causa 1: Service Worker Desactualizado

**Síntoma:** Errores intermitentes en algunos usuarios pero no en todos

**Solución:**
```javascript
// Pide a los usuarios que:
1. Abran la app
2. Presionen Ctrl+Shift+R (forzar recarga)
3. O vayan a Settings → Clear browsing data → Cached images and files
```

### Causa 2: Rutas API No Encontradas (404)

**Síntoma:** Error dice "404" o "Not Found" en los logs

**Solución:**
- Verifica que las carpetas `app/api/*` estén correctamente desplegadas
- Verifica la configuración de rewrites en tu hosting

### Causa 3: Variables de Entorno No Configuradas

**Síntoma:** Error dice "Error de configuración del servidor"

**Solución:**
- Verifica las variables de entorno en tu panel de hosting
- Redeploya después de configurarlas

### Causa 4: Timeout de Supabase

**Síntoma:** Error después de varios segundos de espera

**Solución:**
- Verifica el estado de Supabase: https://status.supabase.com
- Aumenta los timeouts si es necesario

## 📊 Monitoreo

### Mensajes de Error Mejorados

Ahora los usuarios verán mensajes específicos:

| Error Original | Nuevo Mensaje |
|---------------|---------------|
| `Unexpected token 'R'` | "El servidor no está respondiendo correctamente" |
| `Failed to fetch` | "Error de conexión con el servidor" |
| `404 Not Found` | "Ruta API no encontrada. Verifica el despliegue" |
| `500 Server Error` | "Error interno del servidor. Intenta de nuevo" |

### Logs para Desarrollador

En la consola del navegador aparecerán:
```
Error parseando respuesta de watts: SyntaxError: Unexpected token R
Respuesta no-JSON: Request Entity Too Large...
```

## 🔄 Testing en Producción

### Test Checklist

Después del despliegue, verifica:

- [ ] `/api/colonias` devuelve JSON válido
- [ ] `/api/luminarias` POST funciona correctamente
- [ ] `/api/upload` acepta imágenes
- [ ] Los errores muestran mensajes útiles
- [ ] No hay respuestas HTML en las APIs
- [ ] El Service Worker no cachea errores

### Comando de Test Rápido

```bash
# Test API de colonias
curl -I https://tudominio.com/api/colonias

# Debe mostrar:
# Content-Type: application/json
```

## 💡 Recomendaciones Adicionales

### 1. Implementar Logging en Servidor

Considera agregar un servicio de logging como:
- Sentry
- LogRocket
- Datadog

### 2. Implementar Rate Limiting

Para evitar que errores masivos saturen el servidor

### 3. Implementar Retry Logic

```javascript
// Ya implementado en el código:
- Intento 1: Envío online
- Si falla: Guardar offline
- Auto-sync cuando vuelva la conexión
```

## 📱 Para Usuarios Finales

### Si aparece el error:

1. **Cierra y vuelve a abrir la app**
2. **Verifica tu conexión a internet**
3. **Limpia la caché del navegador**
4. **Si persiste, contacta al administrador con:**
   - Captura de pantalla del error
   - Hora exacta en que ocurrió
   - Navegador y versión
   - Pasos para reproducirlo

## 🔐 Seguridad

Los nuevos cambios también mejoran la seguridad:
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño de archivos (5MB)
- ✅ Sanitización de input en número de poste
- ✅ Validación de content-type

## 📞 Próximos Pasos

Si el error persiste después de implementar estos cambios:

1. **Recopila logs** de la consola del navegador
2. **Verifica las variables de entorno** en producción
3. **Revisa los logs del servidor** en tu plataforma de hosting
4. **Considera agregar** un servicio de monitoring
5. **Implementa** un sistema de reportes de errores automático
