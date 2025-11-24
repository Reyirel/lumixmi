import { NextRequest, NextResponse } from 'next/server'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    let formData
    try {
      formData = await request.formData()
    } catch (parseError) {
      console.error('Error parseando FormData:', parseError)
      return NextResponse.json(
        { error: 'Error al procesar los datos del formulario' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }
    
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no válido. Solo se permiten: JPG, PNG, WEBP' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const fileName = `luminaria_${timestamp}_${randomString}.${extension}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('luminarias')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error subiendo imagen a Supabase:', error)
      return NextResponse.json(
        { error: 'Error al subir la imagen: ' + error.message },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    // Obtener URL pública de la imagen
    const { data: publicUrlData } = supabase.storage
      .from('luminarias')
      .getPublicUrl(fileName)

    return NextResponse.json({
      message: 'Imagen subida exitosamente',
      fileName: data.path,
      publicUrl: publicUrlData.publicUrl,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      }
    })
  } catch (error) {
    console.error('Error en POST /api/upload:', error)
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
