import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { LuminariaInsert } from '@/lib/supabase'

// GET: Obtener todas las luminarias
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('luminarias')
      .select(`
        *,
        colonias (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error obteniendo luminarias:', error)
      return NextResponse.json(
        { error: 'Error al obtener luminarias' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en GET /api/luminarias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva luminaria
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar datos requeridos
    const { colonia_id, numero_poste, watts, latitud, longitud } = body
    
    if (!numero_poste || !watts || latitud === undefined || longitud === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Validar que watts sea uno de los valores permitidos
    if (![25, 40, 80].includes(watts)) {
      return NextResponse.json(
        { error: 'El valor de watts debe ser 25, 40 o 80' },
        { status: 400 }
      )
    }

    // Preparar datos para insertar
    const luminaria: LuminariaInsert = {
      colonia_id: colonia_id || null,
      numero_poste,
      watts,
      latitud: parseFloat(latitud),
      longitud: parseFloat(longitud),
      imagen_url: body.imagen_url || null,
    }

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('luminarias')
      .insert([luminaria])
      .select()
      .single()

    if (error) {
      console.error('Error insertando luminaria:', error)
      return NextResponse.json(
        { error: 'Error al crear la luminaria' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Luminaria creada exitosamente', data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en POST /api/luminarias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
