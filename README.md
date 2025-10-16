# Lumixmi

Este es un proyecto [Next.js](https://nextjs.org) con integración de Firebase.

## 🔥 Firebase Configuración

Este proyecto está configurado con Firebase para autenticación, base de datos y analytics.

### Variables de Entorno

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Completa las variables con tu configuración de Firebase:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_project_id.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=tu_measurement_id
   ```

### Servicios Incluidos

- **Authentication**: Autenticación con Firebase Auth
- **Firestore**: Base de datos NoSQL
- **Storage**: Almacenamiento de archivos
- **Analytics**: Google Analytics

## 🚀 Comenzar

Primero, instala las dependencias:

```bash
npm install
```

Luego, ejecuta el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## 📁 Estructura del Proyecto

```
├── app/                 # Páginas de Next.js (App Router)
├── components/          # Componentes React reutilizables
├── hooks/              # Custom hooks para Firebase
├── lib/                # Configuración de Firebase
├── services/           # Servicios de Firestore
├── types/              # Tipos TypeScript
├── .env                # Variables de entorno (no subir a git)
├── .env.example        # Ejemplo de variables de entorno
└── README.md
```

## 🛠️ Uso de Firebase

### Autenticación

```typescript
import { useAuth } from '@/hooks/useFirebase';

function MiComponente() {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>No autenticado</div>;
  
  return <div>Hola, {user.email}</div>;
}
```

### Firestore

```typescript
import { FirestoreService } from '@/services/firestore';

const usersService = new FirestoreService('users');

// Crear usuario
await usersService.create({ name: 'Juan', email: 'juan@example.com' });

// Obtener usuario
const user = await usersService.getById('user-id');

// Actualizar usuario
await usersService.update('user-id', { name: 'Juan Actualizado' });
```

### Analytics

```typescript
import { useAnalytics } from '@/hooks/useFirebase';
import { logEvent } from 'firebase/analytics';

function MiComponente() {
  const analytics = useAnalytics();
  
  const trackClick = () => {
    if (analytics) {
      logEvent(analytics, 'button_click', { button_name: 'mi_boton' });
    }
  };
  
  return <button onClick={trackClick}>Hacer clic</button>;
}
```

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Tutorial interactivo de Next.js](https://nextjs.org/learn)

## 🚀 Despliegue

La forma más fácil de desplegar tu aplicación Next.js es usar [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Consulta la [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para más detalles.
