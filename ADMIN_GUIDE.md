# Guía del Panel de Administrador - Lumixmi

## 🔐 Sistema de Login

### Acceso
- **URL**: `http://localhost:3000/login`
- **Credenciales de prueba**:
  - Email: `admin@lumixmi.com`
  - Contraseña: `admin123`

### Características
- Autenticación mediante localStorage (simple pero funcional)
- Validación de credenciales
- Redirección automática al panel de administrador
- Protección de rutas (redirección al login si no está autenticado)

---

## 📊 Panel de Administrador

### URL
`http://localhost:3000/admin`

### Funcionalidades Principales

#### 1. Vista de Comunidades
- **Descripción**: Muestra todas las comunidades/colonias registradas en el sistema
- **Información mostrada**: 
  - Nombre de la comunidad
  - Total de lámparas registradas
- **Interacción**: Click en cualquier tarjeta para ver detalles

#### 2. Modal de Resumen por Comunidad
Al hacer click en una comunidad, se abre un modal que muestra:

##### Tabla Resumen
| Total | 25W | 40W | 80W |
|-------|-----|-----|-----|
| X     | X   | X   | X   |

- **Total**: Número total de lámparas en la comunidad
- **25W, 40W, 80W**: Cantidad de lámparas de cada potencia
- **Interacción**: Click en cualquier columna de watts para expandir el detalle

#### 3. Vista Detallada por Potencia
Al hacer click en una columna de watts (25W, 40W u 80W):
- Se despliega una lista de todas las lámparas de esa potencia
- Información mostrada:
  - Número de poste
  - Coordenadas (latitud, longitud)
- **Interacción**: Click en cualquier lámpara para ver información completa

#### 4. Modal de Información Completa
Al hacer click en una lámpara específica, se muestra:
- 📸 **Imagen de la lámpara** (si está disponible)
- 🔢 **Número de poste**
- ⚡ **Potencia** (25W, 40W u 80W)
- 📍 **Coordenadas GPS** (latitud y longitud con 6 decimales)
- 📅 **Fecha de registro**
- 🔄 **Última actualización** (si aplica)
- 🗺️ **Botón para ver en Google Maps**

---

## 🎨 Características de Diseño

### Tema Visual
- Gradiente púrpura (#667eea a #764ba2)
- Diseño moderno y responsive
- Animaciones suaves
- Efectos hover interactivos

### Elementos Interactivos
- ✅ Tarjetas de comunidades con efecto hover
- ✅ Tabla resumen con columnas clicables
- ✅ Lista expandible de lámparas por potencia
- ✅ Modales con overlay oscuro
- ✅ Animaciones de entrada (fadeIn)
- ✅ Botones con efectos visuales

---

## 🔄 Flujo de Uso

```
1. Login (admin@lumixmi.com / admin123)
   ↓
2. Panel Principal → Ver todas las comunidades
   ↓
3. Click en comunidad → Modal con tabla resumen
   ↓
4. Click en columna de watts → Lista de lámparas
   ↓
5. Click en lámpara → Ver información completa + imagen
```

---

## 🛠️ Tecnologías Utilizadas

- **Next.js 15** con App Router
- **TypeScript** para tipado fuerte
- **Supabase** como base de datos
- **React Hooks** (useState, useEffect)
- **Next/Image** para optimización de imágenes
- **CSS-in-JS** con estilos inline dinámicos

---

## 📱 Responsive Design

El sistema está optimizado para:
- 💻 Desktop (grid adaptativo)
- 📱 Tablet (ajuste automático de columnas)
- 📞 Mobile (vista en columna única)

---

## 🔒 Seguridad

### Actual (Desarrollo)
- Autenticación simple con localStorage
- Credenciales hardcodeadas

### Recomendaciones para Producción
- Implementar Supabase Auth
- Usar JWT tokens
- Protección de rutas con middleware
- Variables de entorno para credenciales
- Cifrado de passwords
- Sesiones con expiración

---

## 🚀 Próximas Mejoras Sugeridas

1. **Filtros y Búsqueda**
   - Buscar comunidades por nombre
   - Filtrar lámparas por múltiples criterios
   - Ordenamiento personalizado

2. **Exportación de Datos**
   - Exportar a Excel/CSV
   - Generar reportes PDF
   - Estadísticas avanzadas

3. **Edición en Línea**
   - Modificar información de lámparas
   - Actualizar imágenes
   - Cambiar potencia de lámparas

4. **Mapas Interactivos**
   - Vista de mapa con todas las lámparas
   - Clustering de puntos
   - Rutas de mantenimiento

5. **Notificaciones**
   - Alertas de mantenimiento
   - Recordatorios
   - Sistema de tareas

---

## 📞 Soporte

Para cualquier problema o pregunta sobre el sistema, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025
