import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { LuminariaInsert } from '@/lib/supabase'

// GET: Obtener todas las luminarias
export async function GET() {
  try {
    // Verificar configuración de Supabase
    if (!isSupabaseConfigured) {
      console.error('Supabase no está configurado')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

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
    // Verificar configuración de Supabase
    if (!isSupabaseConfigured) {
      console.error('Supabase no está configurado')
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Error parseando body:', parseError)
      return NextResponse.json(
        { error: 'Datos inválidos en la solicitud' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }
    
    // Validar datos requeridos
    const { colonia_id, numero_poste, watts, latitud, longitud } = body
    
    if (!numero_poste || !watts || latitud === undefined || longitud === undefined) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    // Validar que watts sea uno de los valores permitidos
    if (![25, 40, 80].includes(watts)) {
      return NextResponse.json(
        { error: 'El valor de watts debe ser 25, 40 o 80' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
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
      imagen_watts_url: body.imagen_watts_url || null,
      imagen_fotocelda_url: body.imagen_fotocelda_url || null,
      fotocelda_nueva: body.fotocelda_nueva || false,
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
        { error: 'Error al crear la luminaria: ' + error.message },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    return NextResponse.json(
      { message: 'Luminaria creada exitosamente', data },
      { 
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        }
      }
    )
  } catch (error) {
    console.error('Error en POST /api/luminarias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Desconocido') },
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
