import { NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

// GET: Obtener una luminaria específica por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!isSupabaseConfigured) {
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error obteniendo luminaria:', error)
      return NextResponse.json(
        { error: 'Luminaria no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error en GET /api/luminarias/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT: Actualizar una luminaria existente
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Verificar token de admin en el header
    const adminToken = request.headers.get('X-Admin-Token')
    if (!adminToken || adminToken !== 'authenticated') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere autenticación de administrador.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    console.log('Body recibido:', JSON.stringify(body, null, 2))

    // Validar datos requeridos
    const { colonia_id, numero_poste, watts, latitud, longitud, imagen_url, imagen_watts_url, imagen_fotocelda_url, fotocelda_nueva } = body

    if (!numero_poste || watts === undefined || watts === null || latitud === undefined || longitud === undefined) {
      return NextResponse.json(
        { error: `Faltan campos requeridos: numero_poste=${numero_poste}, watts=${watts}, latitud=${latitud}, longitud=${longitud}` },
        { status: 400 }
      )
    }

    // Convertir watts a número si es string
    const wattsNum = typeof watts === 'number' ? watts : parseInt(watts)
    
    // Validar que watts sea uno de los valores permitidos
    if (![25, 40, 80].includes(wattsNum)) {
      return NextResponse.json(
        { error: `El valor de watts debe ser 25, 40 o 80. Recibido: ${watts} (tipo: ${typeof watts})` },
        { status: 400 }
      )
    }

    // Preparar datos para actualizar
    const updateData = {
      colonia_id: colonia_id || null,
      numero_poste: String(numero_poste),
      watts: wattsNum,
      latitud: typeof latitud === 'number' ? latitud : parseFloat(latitud),
      longitud: typeof longitud === 'number' ? longitud : parseFloat(longitud),
      imagen_url: imagen_url || null,
      imagen_watts_url: imagen_watts_url || null,
      imagen_fotocelda_url: imagen_fotocelda_url || null,
      fotocelda_nueva: fotocelda_nueva === true,
    }

    console.log('Actualizando luminaria ID:', id, 'con datos:', JSON.stringify(updateData, null, 2))

    // Usar supabase normal (con las políticas públicas de UPDATE)
    const { data, error } = await supabase
      .from('luminarias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando luminaria:', error)
      return NextResponse.json(
        { error: 'Error al actualizar la luminaria: ' + error.message },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Luminaria no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: 'Luminaria actualizada exitosamente', data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en PUT /api/luminarias/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Desconocido') },
      { status: 500 }
    )
  }
}

// Función auxiliar para extraer el path del archivo desde la URL de Supabase Storage
function extractFilePathFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    // Las URLs de Supabase Storage tienen el formato:
    // https://xxx.supabase.co/storage/v1/object/public/bucket-name/path/to/file.jpg
    const match = url.match(/\/storage\/v1\/object\/public\/([^?]+)/)
    if (match && match[1]) {
      // Retorna "bucket-name/path/to/file.jpg"
      return match[1]
    }
    return null
  } catch {
    return null
  }
}

// DELETE: Eliminar una luminaria
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!isSupabaseConfigured) {
      return NextResponse.json(
        { error: 'Error de configuración del servidor' },
        { status: 500 }
      )
    }

    // Verificar token de admin en el header
    const adminToken = request.headers.get('X-Admin-Token')
    if (!adminToken || adminToken !== 'authenticated') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere autenticación de administrador.' },
        { status: 401 }
      )
    }

    // Primero obtener la luminaria con sus URLs de imágenes
    const { data: existing, error: findError } = await supabase
      .from('luminarias')
      .select('id, imagen_url, imagen_watts_url, imagen_fotocelda_url')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Luminaria no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar imágenes del storage si existen
    const imageUrls = [
      existing.imagen_url,
      existing.imagen_watts_url,
      existing.imagen_fotocelda_url
    ].filter(Boolean)

    for (const url of imageUrls) {
      const fullPath = extractFilePathFromUrl(url as string)
      if (fullPath) {
        // Separar bucket del path del archivo
        const [bucket, ...pathParts] = fullPath.split('/')
        const filePath = pathParts.join('/')
        
        if (bucket && filePath) {
          try {
            const { error: deleteError } = await supabase
              .storage
              .from(bucket)
              .remove([filePath])
            
            if (deleteError) {
              console.warn(`No se pudo eliminar imagen ${filePath}:`, deleteError.message)
              // Continuar con la eliminación aunque falle eliminar una imagen
            } else {
              console.log(`Imagen eliminada: ${bucket}/${filePath}`)
            }
          } catch (storageError) {
            console.warn(`Error eliminando imagen del storage:`, storageError)
            // Continuar con la eliminación aunque falle
          }
        }
      }
    }

    // Eliminar SOLO el registro de la tabla luminarias (no toca colonias)
    const { error } = await supabase
      .from('luminarias')
      .delete()
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error eliminando luminaria:', error)
      return NextResponse.json(
        { error: 'Error al eliminar la luminaria: ' + error.message },
        { status: 500 }
      )
    }

    console.log(`Luminaria ID ${id} eliminada correctamente. Solo se eliminó el registro de luminarias y sus imágenes.`)

    return NextResponse.json(
      { message: 'Luminaria eliminada exitosamente (solo luminaria e imágenes, colonias intactas)' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error en DELETE /api/luminarias/[id]:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error instanceof Error ? error.message : 'Desconocido') },
      { status: 500 }
    )
  }
}
