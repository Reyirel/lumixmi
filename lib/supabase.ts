import { createClient } from '@supabase/supabase-js'

// Validar que las variables de entorno existan
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase. Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env.local'
  )
}

// Cliente de Supabase para uso general (lado cliente y servidor)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  created_at: string
  updated_at: string
}

// Tipo para inserción (sin campos auto-generados)
export type LuminariaInsert = Omit<Luminaria, 'id' | 'created_at' | 'updated_at'>
