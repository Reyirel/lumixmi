// Configuración de usuarios locales y sus comunidades asignadas
// Este archivo contiene la autenticación local para los encargados de zona

export type UserRole = 'admin' | 'encargado'

export type User = {
  email: string
  password: string
  name: string
  role: UserRole
  comunidades: string[] // Lista de comunidades asignadas (vacío = todas para admin)
}

// Usuarios del sistema
export const USERS: User[] = [
  // Administrador con acceso a todas las comunidades
  {
    email: 'admin@lumixmi.com',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin',
    comunidades: [] // Vacío significa acceso a todas
  },
  // ZONA NORTE
  {
    email: 'edgarlugo@lumixmi.com',
    password: 'edgarlugo123',
    name: 'Zona Norte',
    role: 'encargado',
    comunidades: [
      'AGUA FLORIDA',
      'CERRO BLANCO',
      'CUESTA COLORADA',
      'EL BOTHO',
      'EL BOYE',
      'EL DEFAY',
      'EL DEZHA',
      'EL ESPIRITU',
      'EL GUNDHO',
      'EL HUACRI DE LA PAZ',
      'EL MANANTIAL',
      'EL NOGAL',
      'EL OLIVO',
      'EL TAXTHO',
      'LOPEZ FLORES',
      'NEQUETEJE',
      'QUIXPEDHE',
    ]
  },
  // MARCO
  {
    email: 'marco@lumixmi.com',
    password: 'marco123',
    name: 'Marco',
    role: 'encargado',
    comunidades: [
      'ARENALITO REMEDIOS',
      'BANGANDHO',
      'BOTENGUEDHO',
      'CAPULA',
      'CERRITO CAPULA',
      'COL. LA JOYA',
      'COL. LA LIBERTAD',
      'COL. VALLE DE LOS REMEDIOS',
      'EX-HACIENDA DEBODHE',
      'EL MIRADOR CAPULA',
      'EL NITH',
      'EL ROSARIO CAPULA',
      'JAGUEY DE VAZQUEZ CAPULA',
      'JAHUEY CAPULA',
      'LA ESTACION',
      'LA HUERTA CAPULA',
      'LA LOMA DE LA CRUZ',
      'PUERTO BANGANDHO',
      'SAN PEDRO CAPULA',
      'COL. GRAL. FELIPE ANGELES',
    ]
  },
  // ARTURO
  {
    email: 'arturo@lumixmi.com',
    password: 'arturo123',
    name: 'Arturo',
    role: 'encargado',
    comunidades: [
      'ARBOLADO',
      'BOXHUADA',
      'EL BANXU',
      'EL HUACRI',
      'EL MEJE',
      'EL NANDHO',
      'LA LAGUNITA',
      'LA PALMA ORIZABITA',
      'LA PECHUGA',
      'LAS EMES',
      'NAXTHEY SAN JUANICO',
      'OJUELOS',
      'ORIZABITA',
      'SAN ANDRÉS ORIZABITA',
      'VILLA DE LA PAZ',
      'XAXNI'
    ]
  },
  // BRENDA
  {
    email: 'brenda@lumixmi.com',
    password: 'brenda123',
    name: 'Brenda',
    role: 'encargado',
    comunidades: [
      'BARRIO DE JESUS',
      'BARRIO DE SAN ANTONIO',
      'BONDHO',
      'COL. 20 DE NOVIEMBRE',
      'COL. BENITO JUAREZ',
      'COL. SANTA ALICIA',
      'COL. VICENTE GUERRERO',
      'EL CALVARIO',
      'EL CARMEN',
      'EL CARRIZAL',
      'FRACC. JOAQUIN BARANDA',
      'FRACC. VALLE DE SAN JAVIER',
      'SAN MIGUEL'
    ]
  },
  // ANETH
  {
    email: 'aneth@lumixmi.com',
    password: 'aneth123',
    name: 'Aneth',
    role: 'encargado',
    comunidades: [
      'BARRIO DE PROGRESO',
      'CRUZ BLANCA',
      'EL DECA',
      'EL DEXTHI ALBERTO',
      'EL DEXTHO',
      'EL MANDHO',
      'EL ORO',
      'IGNACIO LÓPEZ RAYÓN',
      'LA LOMA DEL ORO',
      'LA LOMA LÓPEZ RAYÓN',
      'LA MEDIA LUNA',
      'LA MESA LÓPEZ RAYÓN',
      'LA REFORMA',
      'PANALES',
      'SANTA ANA'
    ]
  },
  // AQUINO
  {
    email: 'aquino@lumixmi.com',
    password: 'aquino123',
    name: 'Aquino',
    role: 'encargado',
    comunidades: [
      'CERRITOS REMEDIOS',
      'COL. LÁZARO CÁRDENAS',
      'COL. SAMAYOA',
      'EL ESPINO',
      'GRANADITAS',
      'LA LOMA SAN PEDRO REMEDIOS',
      'LOS PINOS REMEDIOS',
      'POZO MIRADOR',
      'REMEDIOS',
      'SAN NICOLÁS',
      'VÁZQUEZ REMEDIOS'
    ]
  },
  // RIGO
  {
    email: 'rigo@lumixmi.com',
    password: 'rigo123',
    name: 'Rigo',
    role: 'encargado',
    comunidades: [
      'CANTAMAYE',
      'EL DEXTHI SAN JUANICO',
      'EL DURAZNO',
      'LA HEREDAD',
      'LOS MARTINEZ',
      'PUERTO DEXTHI',
      'SAN JUANICO',
      'USTHEJE',
      'LA PALMA',
    ]
  },
  // CASTELLANOS
  {
    email: 'castellanos@lumixmi.com',
    password: 'castellanos123',
    name: 'Castellanos',
    role: 'encargado',
    comunidades: [
      'CANADA CHICA',
      'COL. FELIPE ANGELES J.V.',
      'COL. INDEPENDENCIA J.V.',
      'EL TABLON',
      'EL TE-PATHE',
      'EL TEPHE',
      'EX-HACIENDA DE OCOTZA J.V.',
      'JULIAN VILLAGRAN CENTRO',
      'LA LOMA JULIAN VILLAGRAN',
      'LA LOMA PUEBLO NUEVO',
      'LOMA CENTRO JULIAN VILLAGRAN',
      'MAGUEY BLANCO',
      'PUEBLO NUEVO',
      'TAXOHO'
    ]
  },
  // DIEGO
  {
    email: 'diego@lumixmi.com',
    password: 'diego123',
    name: 'Diego',
    role: 'encargado',
    comunidades: [
      'CANTINELA',
      'COL. MIGUEL HIDALGO',
      'DIOS PADRE',
      'EL ALBERTO',
      'EL BARRIDO',
      'EL FITZHI',
      'EL MAYE',
      'EL VALANTE'
    ]
  }
]

// Función para autenticar un usuario
export function authenticateUser(email: string, password: string): User | null {
  const user = USERS.find(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.password === password
  )
  return user || null
}

// Función para obtener un usuario por email
export function getUserByEmail(email: string): User | null {
  return USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || null
}

// Función para normalizar nombres de comunidades para comparación
export function normalizeColoniaName(name: string): string {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
}

// Función para verificar si un usuario tiene acceso a una comunidad
export function userHasAccessToColonia(user: User, coloniaName: string): boolean {
  // Admin tiene acceso a todas
  if (user.role === 'admin' || user.comunidades.length === 0) {
    return true
  }
  
  const normalizedInput = normalizeColoniaName(coloniaName)
  return user.comunidades.some(c => normalizeColoniaName(c) === normalizedInput)
}

// Función para obtener las comunidades de un usuario
export function getUserComunidades(email: string): string[] {
  const user = getUserByEmail(email)
  if (!user) return []
  return user.comunidades
}

// Tipo para la información de sesión del usuario
export type UserSession = {
  email: string
  name: string
  role: UserRole
  comunidades: string[]
}

// Función para crear la sesión del usuario (sin password)
export function createUserSession(user: User): UserSession {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    comunidades: user.comunidades
  }
}
