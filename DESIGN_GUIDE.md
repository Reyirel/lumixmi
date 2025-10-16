# 🎨 Guía Visual Rápida - Lumixmi UI/UX

## 🌈 Paleta de Colores

```
┌─────────────────────────────────────────┐
│ PRIMARY                                 │
│ Negro: #000000                          │
│ Uso: Botones, headers, iconos          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ BACKGROUND                              │
│ Gris claro: #f9fafb → #f3f4f6          │
│ Uso: Fondos de páginas                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ CARDS                                   │
│ Blanco: #ffffff                         │
│ Border: #e5e7eb                         │
│ Uso: Tarjetas, modales                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ TEXT                                    │
│ Principal: #111827                      │
│ Secundario: #6b7280                     │
│ Terciario: #9ca3af                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ACCENT COLORS (Stats)                   │
│ Azul: #2563eb (25W)                     │
│ Verde: #16a34a (40W)                    │
│ Naranja: #ea580c (80W)                  │
└─────────────────────────────────────────┘
```

---

## 📐 Espaciado

```
Pequeño:  4px  → p-1, gap-1
Mediano:  16px → p-4, gap-4
Grande:   24px → p-6, gap-6
XGrande:  32px → p-8, gap-8
```

---

## 🔘 Botones

### Primario (Negro)
```jsx
className="bg-black text-white py-4 px-6 rounded-lg font-semibold 
           hover:bg-gray-800 transition-all transform hover:scale-[1.02]"
```

### Secundario (Borde)
```jsx
className="bg-white text-black border-2 border-gray-300 py-4 px-6 
           rounded-lg font-semibold hover:border-black"
```

---

## 📦 Cards/Tarjetas

### Card Básica
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 
                hover:shadow-lg hover:border-black transition-all hover:-translate-y-1">
  {/* Contenido */}
</div>
```

### Card de Estadística
```jsx
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex items-center justify-center w-12 h-12 bg-black rounded-lg text-white mb-4">
    {/* Ícono */}
  </div>
  <h3 className="text-sm font-medium text-gray-600">Título</h3>
  <p className="text-3xl font-bold text-gray-900">Valor</p>
</div>
```

---

## 🎭 Modales

### Modal Base
```jsx
{/* Overlay */}
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 animate-fadeIn">
  
  {/* Modal Container */}
  <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full 
                  max-h-[90vh] overflow-hidden animate-slideUp">
    
    {/* Header */}
    <div className="px-6 py-5 border-b border-gray-200 flex justify-between">
      <h2 className="text-2xl font-bold">Título</h2>
      <button>×</button>
    </div>
    
    {/* Content */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* Contenido */}
    </div>
  </div>
</div>
```

---

## 🔍 Input Fields

### Input de Texto
```jsx
<input 
  className="w-full px-4 py-3 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-black focus:border-transparent 
             transition-all outline-none text-gray-900"
  placeholder="Texto..."
/>
```

### Search Input
```jsx
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
    {/* Ícono lupa */}
  </div>
  <input 
    className="block w-full pl-10 pr-3 py-3 border border-gray-300 
               rounded-lg focus:ring-2 focus:ring-black"
    placeholder="Buscar..."
  />
</div>
```

---

## 📊 Tabla Moderna

```jsx
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-black text-white">
      <th className="px-6 py-4 text-left font-semibold">Columna 1</th>
      <th className="px-6 py-4 text-center font-semibold">Columna 2</th>
    </tr>
  </thead>
  <tbody className="bg-white">
    <tr className="hover:bg-gray-50 cursor-pointer transition-all">
      <td className="px-6 py-4 text-gray-900">Dato 1</td>
      <td className="px-6 py-4 text-center font-bold">Dato 2</td>
    </tr>
  </tbody>
</table>
```

---

## 🎨 Iconos Comunes

### Bombilla/Luminaria
```jsx
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
</svg>
```

### Ubicación
```jsx
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
```

### Búsqueda
```jsx
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
</svg>
```

### Engranaje/Config
```jsx
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
```

---

## 🎬 Animaciones CSS

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Uso */
.animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

.animate-slideUp {
  animation: slideUp 0.3s ease-out;
}
```

---

## 📱 Responsive Breakpoints

```
sm:  640px  → Tablet pequeña
md:  768px  → Tablet
lg:  1024px → Desktop
xl:  1280px → Desktop grande
2xl: 1536px → Desktop extra grande

Ejemplo:
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1 col mobile, 2 cols tablet, 3 cols desktop */}
</div>
```

---

## ✨ Efectos Hover Comunes

### Elevación
```jsx
className="hover:-translate-y-1 transition-all duration-200"
```

### Escala
```jsx
className="hover:scale-[1.02] transition-transform duration-200"
```

### Borde
```jsx
className="border-2 border-gray-200 hover:border-black transition-colors"
```

### Fondo
```jsx
className="bg-white hover:bg-gray-50 transition-colors"
```

### Sombra
```jsx
className="shadow-sm hover:shadow-lg transition-shadow"
```

---

## 🎯 Estados de Botones

```jsx
{/* Normal */}
className="bg-black text-white"

{/* Hover */}
className="hover:bg-gray-800"

{/* Active */}
className="active:scale-[0.98]"

{/* Disabled */}
className="disabled:opacity-50 disabled:cursor-not-allowed"

{/* Focus */}
className="focus:outline-none focus:ring-2 focus:ring-black"
```

---

## 📋 Loading States

### Spinner
```jsx
<div className="animate-spin rounded-full h-12 w-12 border-4 
                border-gray-300 border-t-black"></div>
```

### Button Loading
```jsx
<button disabled={loading}>
  {loading ? (
    <span className="flex items-center">
      <svg className="animate-spin h-5 w-5 mr-2">
        <circle className="opacity-25" cx="12" cy="12" r="10" 
                stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Cargando...
    </span>
  ) : (
    'Acción'
  )}
</button>
```

---

## 🎨 Badges/Pills

```jsx
{/* Badge básico */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-sm font-bold bg-black text-white">
  42
</span>

{/* Badge con color */}
<span className="inline-flex items-center px-3 py-1 rounded-full 
                 text-sm font-semibold bg-blue-100 text-blue-800">
  Nuevo
</span>
```

---

## 🔔 Estados Vacíos

```jsx
<div className="text-center py-12">
  {/* Ícono grande */}
  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4">
    {/* SVG path */}
  </svg>
  
  {/* Mensaje principal */}
  <h3 className="text-lg font-medium text-gray-900 mb-2">
    No hay elementos
  </h3>
  
  {/* Mensaje secundario */}
  <p className="text-sm text-gray-500">
    Intenta agregando uno nuevo
  </p>
  
  {/* CTA opcional */}
  <button className="mt-4 bg-black text-white px-6 py-2 rounded-lg">
    Agregar
  </button>
</div>
```

---

## 📖 Tipografía

```jsx
{/* Headings */}
<h1 className="text-4xl font-bold text-gray-900">Título Principal</h1>
<h2 className="text-3xl font-bold text-gray-900">Título Secundario</h2>
<h3 className="text-2xl font-bold text-gray-900">Título Terciario</h3>

{/* Body */}
<p className="text-base text-gray-600">Texto normal</p>
<p className="text-sm text-gray-500">Texto pequeño</p>
<p className="text-xs text-gray-400">Texto muy pequeño</p>

{/* Bold */}
<span className="font-semibold">Semi negrita</span>
<span className="font-bold">Negrita</span>
```

---

## ✅ Checklist de Uso

Antes de crear un componente nuevo, verifica:

- [ ] Usa Tailwind CSS (no inline styles)
- [ ] Colores de la paleta definida
- [ ] Bordes redondeados (rounded-lg o rounded-xl)
- [ ] Transiciones suaves (transition-all)
- [ ] Focus ring visible (accesibilidad)
- [ ] Responsive (sm:, md:, lg:)
- [ ] Hover effects apropiados
- [ ] Espaciado consistente (p-4, p-6, gap-4)
- [ ] Tipografía jerárquica
- [ ] Iconos de Heroicons

---

## 🎓 Ejemplos Completos

Ver archivos:
- `app/login/page.tsx` - Login completo
- `app/admin/page.tsx` - Panel admin completo
- `app/form/page.tsx` - Formulario completo
- `app/page_landing.tsx` - Landing page

---

¡Listo! Con esta guía puedes crear componentes consistentes en todo el sistema. 🎨✨
