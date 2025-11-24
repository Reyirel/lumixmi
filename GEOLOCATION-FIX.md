# 🔒 Problema de Geolocalización en HTTP

## ❌ El Problema

El error que ves: **"Only secure origins are allowed"** ocurre porque:

- Estás accediendo desde **HTTP** (no seguro): `http://149.198.1.64:3000`
- Los navegadores modernos **solo permiten geolocalización** en:
  - ✅ **HTTPS** (conexión segura)
  - ✅ **localhost** o **127.0.0.1**

## ✅ Soluciones

### **Opción 1: Acceder desde localhost (RECOMENDADO)** 🏠

Si estás probando en el **mismo dispositivo** donde corre el servidor:

1. En lugar de `http://149.198.1.64:3000`
2. Usa: `http://localhost:3000/form`
3. O: `http://127.0.0.1:3000/form`

**Ventaja:** La geolocalización funcionará normalmente.

---

### **Opción 2: Usar HTTPS con certificado local** 🔐

Para acceder desde otros dispositivos en tu red local con geolocalización:

1. **Instalar mkcert:**
   ```powershell
   # Con Chocolatey
   choco install mkcert
   
   # O descargar desde: https://github.com/FiloSottile/mkcert/releases
   ```

2. **Crear certificados:**
   ```powershell
   mkcert -install
   mkcert localhost 149.198.1.64 192.168.1.* 10.0.0.*
   ```

3. **Actualizar package.json:**
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "dev:https": "next dev --experimental-https"
     }
   }
   ```

4. **Iniciar con HTTPS:**
   ```powershell
   npm run dev:https
   ```

5. **Acceder desde:** `https://149.198.1.64:3000/form`

---

### **Opción 3: Modo Offline - Entrada Manual** 📝

**La aplicación ya está configurada para trabajar offline:**

1. Puedes **ingresar las coordenadas manualmente** en los campos de Latitud y Longitud
2. Los datos se guardan localmente
3. Se sincronizan cuando hay internet

**Cómo obtener coordenadas manualmente:**

**Método A - Google Maps en otro dispositivo:**
1. Abre Google Maps en un teléfono con GPS
2. Presiona y mantén presionado en tu ubicación
3. Verás las coordenadas (ej: -12.046374, -77.042793)

**Método B - Aplicación de GPS:**
1. Usa cualquier app de GPS (GPS Status, GPS Test, etc.)
2. Copia las coordenadas
3. Pégalas en el formulario

---

### **Opción 4: Túnel con HTTPS (ngrok/cloudflared)** 🌐

Para acceso remoto con HTTPS:

**Con ngrok:**
```powershell
# Instalar ngrok
choco install ngrok

# En la terminal donde corre tu app
ngrok http 3000
```

**Con cloudflared:**
```powershell
# Descargar cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

cloudflared tunnel --url http://localhost:3000
```

Te dará una URL HTTPS pública (ej: `https://abc123.ngrok.io`)

---

## 🎯 Recomendación por Escenario

| Escenario | Solución Recomendada |
|-----------|---------------------|
| Probando en la misma PC | **Opción 1**: localhost |
| Red local (trabajo de campo) | **Opción 3**: Entrada manual + Offline |
| Desarrollo con equipo | **Opción 2**: HTTPS local |
| Demo/Presentación | **Opción 4**: ngrok/cloudflared |

---

## 🔍 Verificar Contexto Seguro

Abre la consola del navegador y ejecuta:

```javascript
console.log('isSecureContext:', window.isSecureContext)
```

- **true** → Geolocalización funcionará ✅
- **false** → Necesitas HTTPS o localhost ❌

---

## 💡 Modo Offline Actual

**Tu app YA funciona offline** con las siguientes características:

1. ✅ Formulario completo funcional sin internet
2. ✅ Imágenes se guardan localmente
3. ✅ Entrada manual de coordenadas disponible
4. ✅ Sincronización automática cuando vuelve internet
5. ⚠️ Geolocalización automática requiere HTTPS o localhost

**Para trabajo de campo:**
- Usa entrada manual de coordenadas
- Todo se guarda offline
- Se sincroniza después

---

## 🚀 Inicio Rápido para Pruebas Locales

```powershell
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: En el dispositivo móvil
# Conectar a la misma red WiFi
# Abrir Chrome y escribir en la barra de direcciones:
chrome://flags/#unsafely-treat-insecure-origin-as-secure

# Agregar: http://149.198.1.64:3000
# Reiniciar Chrome
```

⚠️ **Nota:** Esta última opción es solo para desarrollo, no para producción.
