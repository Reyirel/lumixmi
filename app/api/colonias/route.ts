import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function GET() {
  try {
    // Verificar configuración de Supabase
    if (!isSupabaseConfigured) {
      console.error('Supabase no está configurado')
      return NextResponse.json(
        { error: 'Error de configuración del servidor. Contacta al administrador.' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      )
    }

    // Obtener colonias de Supabase ordenadas alfabéticamente
    const { data, error } = await supabase
      .from('colonias')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error obteniendo colonias:', error)
      return NextResponse.json(
        { error: 'Error al obtener colonias' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    return NextResponse.json(data || [], {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      }
    })
  } catch (error) {
    console.error('Error en GET /api/colonias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      }
    )
  }
}
