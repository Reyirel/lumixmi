# 💡 Lumixmi - Sistema de Gestión de Luminarias

Sistema moderno y profesional para el registro, administración y monitoreo de luminarias públicas organizadas por comunidades.

## 🌟 Características Principales

### ✅ Registro de Luminarias
- Formulario intuitivo y responsive
- Captura de imagen de la luminaria
- Geolocalización GPS automática o manual
- Especificaciones técnicas (25W, 40W, 80W)
- Organización por colonias

### 📊 Panel de Administrador
- Dashboard con estadísticas en tiempo real
- **🔄 Actualización automática cada 10 segundos**
- **⚡ Botón de actualización manual**
- **🕐 Indicador de última actualización**
- Vista de todas las comunidades
- Búsqueda y filtrado de comunidades
- Vista detallada por comunidad con tabla resumen
- Desglose por tipo de potencia (25W, 40W, 80W)
- Información completa de cada lámpara con imagen
- Integración con Google Maps

### 🔐 Sistema de Login
- Autenticación segura
- Sesión persistente
- Protección de rutas administrativas
- **🔒 Credenciales ocultas en producción** (solo visibles en desarrollo)

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+ instalado
- Cuenta de Supabase (para base de datos)

### Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/Reyirel/lumixmi.git
cd lumixmi
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima
```

4. **Configurar base de datos**

Ejecuta el script SQL en tu proyecto de Supabase:
```bash
# El archivo supabase-setup.sql contiene la estructura necesaria
```

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

6. **Abrir en el navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
lumixmi/
├── app/
│   ├── admin/          # Panel de administrador
│   ├── api/            # API Routes
│   │   ├── colonias/   # Endpoints de colonias
│   │   ├── luminarias/ # Endpoints de luminarias
│   │   └── upload/     # Subida de imágenes
│   ├── form/           # Formulario de registro
│   ├── login/          # Página de login
│   ├── globals.css     # Estilos globales
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página de inicio
├── lib/
│   └── supabase.ts     # Cliente de Supabase
├── public/             # Archivos estáticos
├── ADMIN_GUIDE.md      # Guía de uso del panel
├── DESIGN_GUIDE.md     # Guía de diseño UI/UX
├── IMPLEMENTATION_SUMMARY.md  # Resumen de implementación
└── UI_UX_IMPROVEMENTS.md      # Mejoras de diseño
```

## 🎨 Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: Supabase (PostgreSQL)
- **Almacenamiento**: Supabase Storage
- **Despliegue**: Vercel (recomendado)

## 📖 Uso

### Registrar una Luminaria

1. Navegar a `/form`
2. Subir imagen de la luminaria
3. Obtener ubicación GPS (automática o manual)
4. Seleccionar potencia (25W, 40W, 80W)
5. Elegir colonia
6. Ingresar número de poste
7. Enviar formulario

### Administrar Luminarias

1. Ir a `/login`
2. Credenciales:
   - Email: `admin@lumixmi.com`
   - Password: `admin123`
3. Explorar el dashboard con estadísticas
4. Buscar comunidades
5. Ver detalles de cada comunidad
6. Expandir por tipo de potencia
7. Ver información completa de cada lámpara

## 🎯 Características del Diseño

### Paleta de Colores
- **Primary**: Negro (#000000)
- **Background**: Gris claro (#f9fafb - #f3f4f6)
- **Text**: Gris oscuro (#111827)
- **Borders**: Gris medio (#d1d5db)

### Principios de Diseño
- ✅ Diseño minimalista y moderno
- ✅ Consistencia visual en todas las páginas
- ✅ Responsive (Mobile First)
- ✅ Accesibilidad (WCAG AA)
- ✅ Animaciones suaves
- ✅ Feedback visual claro

## 📚 Documentación

- **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** - Guía completa del panel de administrador
- **[AUTO_UPDATE_GUIDE.md](./AUTO_UPDATE_GUIDE.md)** - 🆕 Actualización automática y seguridad
- **[DESIGN_GUIDE.md](./DESIGN_GUIDE.md)** - Guía de diseño y componentes
- **[UI_UX_IMPROVEMENTS.md](./UI_UX_IMPROVEMENTS.md)** - Mejoras de diseño implementadas
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen de implementación

## 🔧 Comandos Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar en producción
npm start

# Linting
npm run lint
```

## 🌐 Despliegue

### Vercel (Recomendado)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Otras Plataformas

El proyecto es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Digital Ocean
- AWS Amplify

## 🔒 Seguridad

**Nota**: Las credenciales actuales son para desarrollo. En producción:

- Implementar Supabase Auth
- Usar variables de entorno seguras
- Configurar Row Level Security (RLS) en Supabase
- Implementar rate limiting
- Usar HTTPS siempre

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es privado y de uso interno.

## 👥 Equipo

- **Desarrollo**: Equipo Lumixmi
- **Diseño**: Sistema basado en Tailwind UI
- **Iconos**: Heroicons

## 📞 Soporte

Para reportar bugs o solicitar funcionalidades, abre un issue en GitHub.

## 🎉 Agradecimientos

- Next.js por el framework
- Supabase por el backend
- Tailwind CSS por el sistema de diseño
- Vercel por el hosting

---

**Versión**: 1.0.0  
**Última actualización**: Octubre 2025  
**Estado**: En desarrollo activo

---

Made with 💡 by Lumixmi Team
