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

    const body = await request.json()
    const { uploadId, fileName, chunks, totalChunks, fileSize, mimeType } = body

    if (!uploadId || !fileName || !chunks || !Array.isArray(chunks) || chunks.length !== totalChunks) {
      return NextResponse.json(
        { error: 'Datos de reconstrucción inválidos' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

    console.log(`🔧 Reconstruyendo archivo: ${fileName} desde ${totalChunks} chunks`)

    try {
      // Descargar todos los chunks desde Supabase
      const chunkBuffers: ArrayBuffer[] = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkUrl = chunks[i]
        console.log(`📥 Descargando chunk ${i + 1}/${totalChunks}`)
        
        // Extraer el path del chunk desde la URL
        const chunkPath = chunkUrl.split('/').pop()
        
        if (!chunkPath) {
          throw new Error(`No se pudo extraer el path del chunk ${i + 1}`)
        }

        // Descargar el chunk desde Supabase Storage
        const { data: chunkData, error: downloadError } = await supabase.storage
          .from('luminarias')
          .download(chunkPath)

        if (downloadError) {
          console.error(`Error descargando chunk ${i + 1}:`, downloadError)
          throw new Error(`Error descargando chunk ${i + 1}: ${downloadError.message}`)
        }

        // Convertir a ArrayBuffer
        const arrayBuffer = await chunkData.arrayBuffer()
        chunkBuffers.push(arrayBuffer)
      }

      // Combinar todos los chunks en un solo buffer
      console.log(`🔗 Combinando ${chunkBuffers.length} chunks...`)
      const totalLength = chunkBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
      const combinedBuffer = new Uint8Array(totalLength)
      
      let offset = 0
      for (const buffer of chunkBuffers) {
        combinedBuffer.set(new Uint8Array(buffer), offset)
        offset += buffer.byteLength
      }

      // Verificar que el tamaño coincida
      if (combinedBuffer.length !== fileSize) {
        console.warn(`⚠️ Tamaño no coincide: esperado ${fileSize}, obtenido ${combinedBuffer.length}`)
      }

      // Crear el archivo reconstruido
      const reconstructedFile = new File([combinedBuffer], fileName, { type: mimeType })
      
      console.log(`✅ Archivo reconstruido: ${fileName} (${(reconstructedFile.size / 1024 / 1024).toFixed(2)}MB)`)

      // Subir el archivo reconstruido
      const timestamp = Date.now()
      const finalFileName = `${timestamp}-${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('luminarias')
        .upload(finalFileName, reconstructedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType
        })

      if (uploadError) {
        console.error('Error subiendo archivo reconstruido a Supabase:', uploadError)
        throw new Error(`Error subiendo archivo reconstruido: ${uploadError.message}`)
      }

      // Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from('luminarias')
        .getPublicUrl(finalFileName)

      // Limpiar los chunks (opcional)
      console.log(`🧹 Limpiando ${chunks.length} chunks temporales...`)
      for (const chunkUrl of chunks) {
        try {
          const chunkPath = chunkUrl.split('/').pop()
          if (chunkPath) {
            await supabase.storage.from('luminarias').remove([chunkPath])
          }
        } catch (cleanupError) {
          // No es crítico si la limpieza falla
          console.warn('Error limpiando chunk:', cleanupError)
        }
      }

      console.log(`✅ Reconstrucción completada: ${fileName}`)

      return NextResponse.json(
        { 
          publicUrl: urlData.publicUrl,
          message: 'Archivo reconstruido exitosamente',
          originalSize: fileSize,
          finalSize: reconstructedFile.size,
          chunks: totalChunks
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )

    } catch (reconstructionError) {
      console.error('Error en reconstrucción:', reconstructionError)
      
      // Intentar limpiar chunks en caso de error
      for (const chunkUrl of chunks) {
        try {
          const chunkPath = chunkUrl.split('/').pop()
          if (chunkPath) {
            await supabase.storage.from('luminarias').remove([chunkPath])
          }
        } catch {
          // Ignorar errores de limpieza
        }
      }

      return NextResponse.json(
        { 
          error: 'Error reconstruyendo archivo',
          details: reconstructionError instanceof Error ? reconstructionError.message : 'Error desconocido'
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          }
        }
      )
    }

  } catch (error) {
    console.error('Error general en reconstrucción:', error)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
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
