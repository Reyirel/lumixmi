# 🐛 Uso del Production Debugger

## ¿Qué es?

El **ProductionDebugger** es un componente temporal que intercepta todas las peticiones HTTP de la aplicación y muestra información detallada sobre ellas. Es especialmente útil para diagnosticar el error "Unexpected token 'R'" en producción.

## 📦 Instalación Temporal

### 1. Agregar al Formulario

Edita `app/form/page.tsx` y agrega el componente al final:

```tsx
import { ProductionDebugger } from '@/lib/ProductionDebugger'

export default function FormPage() {
  // ... resto del código

  return (
    <>
      <main className="min-h-screen...">
        {/* Todo tu contenido actual */}
      </main>
      
      {/* SOLO PARA DEBUGGING - REMOVER DESPUÉS */}
      <ProductionDebugger />
    </>
  )
}
```

### 2. Desplegar Temporalmente

```bash
npm run build
# Despliega a producción
```

## 🎮 Cómo Usar

### Para Desarrolladores:

1. **Abrir la app** en producción
2. **Presionar `Ctrl + Shift + D`** para abrir el debugger
3. **Usar la aplicación normalmente** (llenar formulario, enviar, etc.)
4. **Ver los logs** en tiempo real
5. **Copiar logs** con el botón "Copiar Logs"
6. **Cerrar** con el botón "Cerrar" o `Ctrl + Shift + D`

### Para Usuarios que Reporten Errores:

Pídeles que:

1. Abran la app
2. Hagan clic en el botón rojo "DEBUG" en la esquina inferior derecha
3. Reproduzcan el error
4. Presionen "Copiar Logs"
5. Te envíen los logs copiados

## 📊 Qué Muestra

El debugger muestra:

- ✅ **Timestamp**: Hora exacta de cada petición
- ✅ **Tipo**: FETCH, RESPONSE, o ERROR
- ✅ **URL**: Ruta de la API llamada
- ✅ **Status**: Código HTTP (200, 404, 500, etc.)
- ✅ **Content-Type**: Tipo de contenido de la respuesta
- ✅ **Preview**: Primeros 200 caracteres de la respuesta

## 🎨 Código de Colores

- 🔵 **Azul**: Petición iniciada (FETCH)
- 🟢 **Verde**: Respuesta exitosa (200-299)
- 🟡 **Amarillo**: Respuesta con error (400-599)
- 🔴 **Rojo**: Error de red (timeout, no conexión, etc.)

## 🔍 Ejemplo de Log

```
[10:21:45] FETCH: /api/upload
---
[10:21:46] RESPONSE: /api/upload
Status: 200
Content-Type: application/json
Preview: {"message":"Imagen subida exitosamente","fileName":"luminaria_1732461706_abc123.jpg"...
---
[10:21:47] ERROR: /api/luminarias
Error: Failed to fetch
---
```

## 🚨 Interpretación de Errores

### Si ves: `Content-Type: text/html`
**Problema:** La API está devolviendo HTML en lugar de JSON
**Causa:** Probablemente error 404 o 500 en Next.js
**Solución:** Verifica que las rutas API estén desplegadas correctamente

### Si ves: `Status: 404`
**Problema:** Ruta API no encontrada
**Causa:** Falta la carpeta en el deploy o problema de routing
**Solución:** Verifica la estructura de carpetas en producción

### Si ves: `Preview: <!DOCTYPE html>`
**Problema:** El servidor devolvió una página HTML
**Causa:** Error de Next.js o página de error del hosting
**Solución:** Revisa los logs del servidor

### Si ves: `Preview: Request Entity Too Large`
**Problema:** Archivo demasiado grande
**Causa:** La imagen supera el límite del servidor
**Solución:** Reduce el tamaño de las imágenes (actualmente límite: 5MB)

### Si ves: `Error: Failed to fetch`
**Problema:** No se pudo conectar con el servidor
**Causa:** Sin internet, servidor caído, CORS, timeout
**Solución:** Verifica conexión y estado del servidor

## ⚠️ IMPORTANTE

### Remover Antes del Deploy Final

**Este componente es SOLO para debugging temporal**

Una vez resuelto el problema:

1. Comenta o elimina `<ProductionDebugger />` de `app/form/page.tsx`
2. Rebuildeay redeploya

```tsx
// COMENTADO - Ya no necesario
// <ProductionDebugger />
```

### Por qué removerlo:

- Consume memoria interceptando todas las peticiones
- Muestra información sensible en el frontend
- Agrega peso extra al bundle
- Solo necesario para debugging

## 📱 Ejemplo de Uso Real

### Escenario: Usuario reporta error al enviar formulario

1. **Activa el debugger** (deploy temporal)
2. **Pide al usuario** que reproduzca el error
3. **El usuario copia los logs** y te los envía
4. **Analizas los logs**:

```
[10:21:45] RESPONSE: /api/upload
Status: 200
Content-Type: application/json
✅ Primera imagen OK

[10:21:46] RESPONSE: /api/upload  
Status: 500
Content-Type: text/html
Preview: <!DOCTYPE html><html><head><title>Application Error</title>...
❌ Segunda imagen falló - devolvió HTML

[10:21:47] ERROR: /api/luminarias
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
❌ El error ocurrió al intentar parsear el HTML como JSON
```

5. **Diagnóstico**: La segunda subida de imagen está fallando y devolviendo HTML
6. **Solución**: Revisar logs del servidor para ver por qué la API `/api/upload` falla
7. **Desactiva el debugger** una vez resuelto

## 🔧 Personalización

Si necesitas más información, puedes modificar el componente:

```tsx
// En lib/ProductionDebugger.tsx

// Para ver más caracteres del preview:
preview = text.substring(0, 500) // cambiar de 200 a 500

// Para loguear también peticiones externas:
if (!url.includes('/api/')) {
  return originalFetch(...args) // remover esta línea
}
```

## 📞 Troubleshooting

### El debugger no aparece
- Verifica que importaste correctamente el componente
- Verifica que no haya errores de compilación
- Verifica que el componente esté dentro del return JSX

### No veo ningún log
- Verifica que estés haciendo peticiones a `/api/*`
- Abre la consola del navegador y busca errores
- Prueba presionando Ctrl+Shift+D para abrir/cerrar

### Los logs desaparecen al recargar
- Es comportamiento normal, los logs se guardan solo en memoria
- Copia los logs antes de recargar la página
- Considera agregar localStorage si necesitas persistencia

## 💡 Tips

1. **Usa "Copiar Logs"** para compartir fácilmente con el equipo
2. **Limpia logs** regularmente para no saturar la vista
3. **Compara logs** de usuarios que SÍ pueden enviar vs los que NO pueden
4. **Documenta** los patrones de error que encuentres
5. **Remover SIEMPRE** antes del deploy final

## 🎯 Próximos Pasos

Una vez identifiques el patrón de error con este debugger:

1. Implementa la corrección específica
2. Remueve el debugger
3. Considera implementar un servicio de logging profesional (Sentry, LogRocket)
4. Agrega tests automatizados para prevenir regresiones
