import { createClient } from '@supabase/supabase-js'

// Validar que las variables de entorno existan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar si Supabase está configurado
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Cliente de Supabase para uso general (lado cliente y servidor)
// Si no está configurado, crear un cliente dummy que no funcionará
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Tipos TypeScript para las tablas
export type Colonia = {
  id: number
  nombre: string
  created_at: string
}

export type Luminaria = {
  id: number
  colonia_id: number | null
  numero_poste: string
  watts: 25 | 40 | 80
  latitud: number
  longitud: number
  imagen_url: string | null
  imagen_watts_url: string | null
  imagen_fotocelda_url: string | null
  fotocelda_nueva: boolean
  created_at: string
  updated_at: string
}

// Tipo para inserción (sin campos auto-generados)
export type LuminariaInsert = Omit<Luminaria, 'id' | 'created_at' | 'updated_at'>
