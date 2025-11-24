# 📱 Modo Offline - Lumixmi

## 🌟 Características Implementadas

Tu aplicación ahora cuenta con **capacidades offline completas**:

### ✅ Funcionalidades

1. **Geolocalización Sin Internet**
   - La geolocalización GPS funciona sin conexión a internet
   - Solo necesitas tener el GPS del dispositivo activado

2. **Almacenamiento Offline**
   - Los registros se guardan localmente cuando no hay internet
   - Las imágenes se almacenan en IndexedDB del navegador
   - No se pierde ningún dato

3. **Sincronización Automática**
   - Cuando se detecta conexión, los registros pendientes se sincronizan automáticamente
   - Notificación cuando la sincronización se completa

4. **Indicador de Estado**
   - Muestra si estás conectado o en modo offline
   - Contador de registros pendientes de sincronizar
   - Botón manual para sincronizar cuando lo desees

## 🚀 Cómo Usar

### Primera Vez

1. **Instalar como PWA** (Opcional pero recomendado)
   ```bash
   npm run build
   npm start
   ```
   - En Chrome: Ícono de instalación en la barra de direcciones
   - En móvil: "Agregar a pantalla de inicio"

2. **Probar Modo Offline**
   - Activa el modo avión en tu dispositivo
   - O en Chrome DevTools: Network > Offline
   - El indicador mostrará "Sin conexión - Modo offline"

### Registro Offline

1. Completa el formulario normalmente
2. La geolocalización funcionará sin internet
3. Al enviar:
   - **Sin internet**: Se guarda localmente con mensaje "💾 Registro guardado offline"
   - **Con internet**: Se envía directamente

### Sincronización

**Automática:**
- Cuando recuperes la conexión, los registros se sincronizan solos

**Manual:**
- Presiona "Sincronizar ahora" en el indicador de conexión

## 🔧 Archivos Creados

```
lib/
├── offlineStorage.ts      # Gestión de IndexedDB
├── syncService.ts         # Lógica de sincronización
└── useOnlineStatus.ts     # Hook para detectar conexión

public/
├── manifest.json          # Configuración PWA
├── icon-192x192.svg       # Ícono app 192px
└── icon-512x512.svg       # Ícono app 512px

app/
└── form/
    └── page.tsx          # Formulario actualizado
```

## 📦 Dependencias Instaladas

- `@ducanh2912/next-pwa`: Service Worker y PWA
- `workbox-window`: Gestión de cache
- `idb`: Wrapper de IndexedDB

## 🔍 Cómo Verificar

### En el Navegador

1. **Abrir DevTools** (F12)
2. **Application Tab**:
   - Service Workers: Debe aparecer activo
   - IndexedDB: Verás "lumixmi-offline" con tus registros
   - Cache Storage: Archivos cacheados

### Probar Offline

```bash
# Terminal 1: Iniciar servidor
npm run dev

# En el navegador:
# 1. Abre la app
# 2. DevTools > Network > Throttling > Offline
# 3. Llena el formulario y envía
# 4. Ve a Application > IndexedDB > lumixmi-offline
# 5. Verás tu registro guardado
# 6. Vuelve a Online
# 7. El registro se sincroniza automáticamente
```

## 💡 Notas Importantes

1. **Geolocalización GPS**: Funciona sin internet, solo necesita GPS activo
2. **Capacidad**: IndexedDB puede almacenar cientos de registros con imágenes
3. **Persistencia**: Los datos se mantienen incluso si cierras el navegador
4. **Limpieza**: Los registros sincronizados se eliminan automáticamente después de 7 días

## 🐛 Solución de Problemas

### Service Worker no se activa
```bash
# En producción
npm run build
npm start
```
*El Service Worker está deshabilitado en desarrollo por defecto*

### IndexedDB no funciona
- Verifica que el navegador soporte IndexedDB
- Asegúrate de que no estés en modo incógnito
- Revisa permisos de almacenamiento del navegador

### Sincronización no funciona
- Verifica la conexión a internet
- Revisa la consola del navegador para errores
- Prueba sincronizar manualmente con el botón

## 📱 Instalación PWA

### Android/Chrome
1. Abre la app en Chrome
2. Menú (⋮) > "Agregar a pantalla de inicio"
3. Confirma instalación

### iOS/Safari
1. Abre la app en Safari
2. Botón compartir 
3. "Agregar a pantalla de inicio"

### Desktop/Chrome
1. Ícono de instalación en barra de direcciones
2. O: Configuración > "Instalar Lumixmi"

---

**¡Listo!** 🎉 Tu app ahora funciona completamente offline.
