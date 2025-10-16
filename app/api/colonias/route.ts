import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Obtener colonias de Supabase ordenadas alfabéticamente
    const { data, error } = await supabase
      .from('colonias')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      console.error('Error obteniendo colonias:', error)
      return NextResponse.json(
        { error: 'Error al obtener colonias' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en GET /api/colonias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
