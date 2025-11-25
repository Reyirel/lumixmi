"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { saveOfflineRecord, fileToBlob, getPendingCount, getRecordStats } from '@/lib/offlineStorage'
import { useAutoSync, syncAllPendingRecords } from '@/lib/syncService'
import { NotificationPermission } from '@/lib/NotificationPermission'

type Colonia = {
  id: number
  nombre: string
  barrios: { id: number; nombre: string }[]
}

export default function FormPage() {
  const [colonias, setColonias] = useState<Colonia[]>([])
  const [selectedColonia, setSelectedColonia] = useState<number | null>(null)
  const [watts, setWatts] = useState<number>(25)
  const [poste, setPoste] = useState<string>('')
  const [image, setImage] = useState<File | null>(null)
  const [imageWatts, setImageWatts] = useState<File | null>(null)
  const [imageFotocelda, setImageFotocelda] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewWatts, setPreviewWatts] = useState<string | null>(null)
  const [previewFotocelda, setPreviewFotocelda] = useState<string | null>(null)
  const [fotoceldaNueva, setFotoceldaNueva] = useState<string>('no')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSecureContext, setIsSecureContext] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  
  // Hooks personalizados para offline
  const isOnline = useOnlineStatus()
  const syncPending = useAutoSync(isOnline)

  useEffect(() => {
    fetch('/api/colonias')
      .then(async (r) => {
        if (!r.ok) {
          throw new Error('Error cargando colonias')
        }
        const contentType = r.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Respuesta inválida del servidor')
        }
        return r.json()
      })
      .then((data) => setColonias(data))
      .catch((e) => {
        console.error('Error cargando colonias', e)
        alert('Error al cargar las colonias. Verifica tu conexión o contacta al administrador.')
      })
    
    // Verificar si estamos en contexto seguro (HTTPS o localhost)
    if (typeof window !== 'undefined') {
      setIsSecureContext(window.isSecureContext)
    }
    
    // Cargar contador de registros pendientes
    updatePendingCount()
  }, [])

  // Actualizar contador de registros pendientes
  const updatePendingCount = async () => {
    const count = await getPendingCount()
    setPendingCount(count)
  }

  // Auto-sincronizar cuando se detecta conexión
  useEffect(() => {
    if (isOnline) {
      syncPending().then(() => {
        updatePendingCount()
      })
    }
  }, [isOnline, syncPending])

  // Sincronización periódica cada 60 segundos si hay registros pendientes
  useEffect(() => {
    const intervalId = setInterval(async () => {
      if (isOnline) {
        const count = await getPendingCount()
        if (count > 0) {
          console.log(`⏰ Sincronización periódica: ${count} registros pendientes`)
          await syncPending()
          await updatePendingCount()
        }
      }
    }, 60000) // Cada 60 segundos

    return () => clearInterval(intervalId)
  }, [isOnline, syncPending])

  useEffect(() => {
    if (!image) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => {
    if (!imageWatts) {
      setPreviewWatts(null)
      return
    }
    const url = URL.createObjectURL(imageWatts)
    setPreviewWatts(url)
    return () => URL.revokeObjectURL(url)
  }, [imageWatts])

  useEffect(() => {
    if (!imageFotocelda) {
      setPreviewFotocelda(null)
      return
    }
    const url = URL.createObjectURL(imageFotocelda)
    setPreviewFotocelda(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFotocelda])

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (file) setImage(file)
  }

  function handleImageWatts(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (file) setImageWatts(file)
  }

  function handleImageFotocelda(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (file) setImageFotocelda(file)
  }

  function useGeolocation() {
    if (!('geolocation' in navigator)) {
      alert('❌ Tu navegador no soporta geolocalización.\n\nPor favor ingresa las coordenadas manualmente.')
      return
    }
    
    setIsLoadingLocation(true)
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsLoadingLocation(false)
        console.log('✅ Ubicación obtenida:', pos.coords)
      },
      (err) => {
        setIsLoadingLocation(false)
        console.error('Error de geolocalización:', err)
        
        let mensaje = '❌ Error obteniendo ubicación:\n\n'
        
        // Mensajes específicos según el código de error
        switch(err.code) {
          case err.PERMISSION_DENIED:
            mensaje += '🔒 Permisos denegados.\n\n'
            mensaje += '⚠️ IMPORTANTE: Estás usando HTTP en lugar de HTTPS.\n'
            mensaje += 'La geolocalización requiere:\n'
            mensaje += '• HTTPS (conexión segura), O\n'
            mensaje += '• Acceder desde localhost\n\n'
            mensaje += '💡 SOLUCIÓN:\n'
            mensaje += '1. Accede desde el mismo dispositivo usando: http://localhost:3000/form\n'
            mensaje += '2. O activa el GPS y da permisos en la configuración del navegador\n'
            mensaje += '3. O ingresa las coordenadas manualmente abajo'
            break
          case err.POSITION_UNAVAILABLE:
            mensaje += 'No se puede determinar la ubicación.\n'
            mensaje += 'Verifica que el GPS esté activado.\n\n'
            mensaje += 'Puedes ingresar las coordenadas manualmente.'
            break
          case err.TIMEOUT:
            mensaje += 'Tiempo de espera agotado.\n\n'
            mensaje += 'Intenta nuevamente o ingresa las coordenadas manualmente.'
            break
          default:
            mensaje += err.message + '\n\n'
            mensaje += 'Puedes ingresar las coordenadas manualmente.'
        }
        
        alert(mensaje)
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Prevenir doble envío
    if (isSubmitting) {
      return
    }

    // Validar campos requeridos
    if (!selectedColonia) {
      alert('Por favor selecciona una colonia')
      return
    }
    if (!poste.trim()) {
      alert('Por favor ingresa el número de poste')
      return
    }
    if (!coords || !coords.lat || !coords.lng) {
      alert('Por favor obtén la ubicación GPS')
      return
    }
    if (!image) {
      alert('Por favor sube una imagen de la luminaria')
      return
    }
    if (!imageWatts) {
      alert('Por favor sube una imagen de los watts')
      return
    }
    if (!imageFotocelda) {
      alert('Por favor sube una imagen de la fotocelda')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Si no hay conexión, guardar offline
      if (!isOnline) {
        console.log('📡 Sin conexión - Guardando registro offline...')
        
        // Convertir Files a Blobs
        const imagenBlob = await fileToBlob(image)
        const imagenWattsBlob = await fileToBlob(imageWatts)
        const imagenFotoceldaBlob = await fileToBlob(imageFotocelda)
        
        const savedId = await saveOfflineRecord({
          colonia_id: selectedColonia,
          numero_poste: poste,
          watts,
          latitud: coords.lat,
          longitud: coords.lng,
          imagen: imagenBlob,
          imagen_watts: imagenWattsBlob,
          imagen_fotocelda: imagenFotoceldaBlob,
          fotocelda_nueva: fotoceldaNueva === 'si',
        })
        
        if (savedId === null) {
          alert('⚠️ Ya existe un registro similar pendiente de sincronización. No se guardará duplicado.')
        } else {
          alert('💾 Registro guardado offline. Se enviará automáticamente cuando tengas conexión.')
        }
        
        // Actualizar contador
        await updatePendingCount()
        
        // Limpiar formulario
        resetForm()
        return
      }
      
      // Si hay conexión, enviar normalmente
      console.log('🌐 Con conexión - Enviando registro...')
      
      // Paso 1: Subir las 3 imágenes
      const uploadPromises = [
        fetch('/api/upload', {
          method: 'POST',
          body: (() => {
            const fd = new FormData()
            fd.append('file', image)
            return fd
          })(),
        }),
        fetch('/api/upload', {
          method: 'POST',
          body: (() => {
            const fd = new FormData()
            fd.append('file', imageWatts)
            return fd
          })(),
        }),
        fetch('/api/upload', {
          method: 'POST',
          body: (() => {
            const fd = new FormData()
            fd.append('file', imageFotocelda)
            return fd
          })(),
        }),
      ]

      const uploadResponses = await Promise.all(uploadPromises)

      // Verificar que todas las subidas fueron exitosas y parsear respuestas
      const uploadResults = []
      
      for (let i = 0; i < uploadResponses.length; i++) {
        const response = uploadResponses[i]
        const imageName = i === 0 ? 'luminaria' : i === 1 ? 'watts' : 'fotocelda'
        
        try {
          if (!response.ok) {
            let errorMessage = `Error al subir imagen de ${imageName}`
            
            try {
              const contentType = response.headers.get('content-type')
              if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json()
                errorMessage = errorData.error || errorMessage
              } else {
                const textResponse = await response.text()
                console.error(`Respuesta no-JSON al subir ${imageName}:`, textResponse.substring(0, 200))
                errorMessage = 'El servidor no está respondiendo correctamente. Intenta de nuevo.'
              }
            } catch (parseError) {
              console.error(`Error parseando respuesta de ${imageName}:`, parseError)
              errorMessage = 'Error de conexión con el servidor. Verifica tu red.'
            }
            
            throw new Error(errorMessage)
          }
          
          // Parsear respuesta exitosa
          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text()
            console.error(`Respuesta no-JSON exitosa de ${imageName}:`, textResponse.substring(0, 200))
            throw new Error('El servidor retornó una respuesta inválida. Contacta al administrador.')
          }
          
          const result = await response.json()
          uploadResults.push(result)
          
        } catch (error) {
          // Si el error ya fue lanzado arriba, re-lanzarlo
          if (error instanceof Error) {
            throw error
          }
          // Error inesperado
          throw new Error(`Error procesando imagen de ${imageName}`)
        }
      }
      
      const [uploadResult1, uploadResult2, uploadResult3] = uploadResults

      console.log('Imágenes subidas:', { uploadResult1, uploadResult2, uploadResult3 })

      // Paso 2: Crear la luminaria con las URLs de las 3 imágenes
      const payload = {
        colonia_id: selectedColonia,
        numero_poste: poste,
        watts,
        latitud: coords.lat,
        longitud: coords.lng,
        imagen_url: uploadResult1.publicUrl,
        imagen_watts_url: uploadResult2.publicUrl,
        imagen_fotocelda_url: uploadResult3.publicUrl,
        fotocelda_nueva: fotoceldaNueva === 'si',
      }

      const response = await fetch('/api/luminarias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      let result
      
      try {
        const contentType = response.headers.get('content-type')
        
        if (!response.ok) {
          let errorMessage = 'Error al registrar la luminaria'
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json()
              errorMessage = errorData.error || errorMessage
            } catch (jsonError) {
              console.error('Error parseando JSON de error:', jsonError)
              errorMessage = 'Error de conexión con el servidor'
            }
          } else {
            const textResponse = await response.text()
            console.error('Respuesta no-JSON del servidor:', textResponse.substring(0, 200))
            
            // Detectar errores comunes de Next.js en producción
            if (textResponse.includes('404') || textResponse.includes('Not Found')) {
              errorMessage = 'Ruta API no encontrada. Verifica el despliegue.'
            } else if (textResponse.includes('500') || textResponse.includes('Internal Server Error')) {
              errorMessage = 'Error interno del servidor. Intenta de nuevo.'
            } else {
              errorMessage = 'El servidor no está respondiendo correctamente. Contacta al administrador.'
            }
          }
          
          throw new Error(errorMessage)
        }
        
        // Respuesta exitosa - parsear resultado
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text()
          console.error('Respuesta exitosa pero no-JSON:', textResponse.substring(0, 200))
          throw new Error('Respuesta inválida del servidor')
        }
        
        result = await response.json()
        
      } catch (error) {
        // Re-lanzar errores ya manejados
        if (error instanceof Error) {
          throw error
        }
        // Error inesperado
        throw new Error('Error procesando la respuesta del servidor')
      }
      console.log('Luminaria registrada:', result)
      
      alert('✅ Luminaria registrada exitosamente con 3 imágenes!')
      
      // Limpiar el formulario
      resetForm()
      
    } catch (error) {
      console.error('Error al enviar formulario:', error)
      
      // Si falla el envío online, preguntar si guardar offline
      if (isOnline) {
        const saveOffline = confirm(
          '❌ Error al enviar el registro. ¿Deseas guardarlo offline para enviarlo después?'
        )
        
        if (saveOffline && image && imageWatts && imageFotocelda) {
          try {
            const imagenBlob = await fileToBlob(image)
            const imagenWattsBlob = await fileToBlob(imageWatts)
            const imagenFotoceldaBlob = await fileToBlob(imageFotocelda)
            
            const savedId = await saveOfflineRecord({
              colonia_id: selectedColonia!,
              numero_poste: poste,
              watts,
              latitud: coords!.lat,
              longitud: coords!.lng,
              imagen: imagenBlob,
              imagen_watts: imagenWattsBlob,
              imagen_fotocelda: imagenFotoceldaBlob,
              fotocelda_nueva: fotoceldaNueva === 'si',
            })
            
            if (savedId === null) {
              alert('⚠️ Ya existe un registro similar pendiente de sincronización.')
            } else {
              alert('💾 Registro guardado offline.')
            }
            await updatePendingCount()
            resetForm()
          } catch (offlineError) {
            console.error('Error guardando offline:', offlineError)
            alert('❌ No se pudo guardar el registro')
          }
        }
      } else {
        alert('❌ Error: ' + (error instanceof Error ? error.message : 'Error desconocido'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  function resetForm() {
    setSelectedColonia(null)
    setPoste('')
    setWatts(25)
    setCoords(null)
    setImage(null)
    setImageWatts(null)
    setImageFotocelda(null)
    setPreview(null)
    setPreviewWatts(null)
    setPreviewFotocelda(null)
    setFotoceldaNueva('no')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Banner de notificaciones */}
      <NotificationPermission />
      
      <div className="max-w-3xl mx-auto">
        {/* Indicador de conexión */}
        <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
          isOnline 
            ? 'bg-green-50 border-l-4 border-green-500' 
            : 'bg-yellow-50 border-l-4 border-yellow-500'
        }`}>
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-700 font-medium">Conectado</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-yellow-700 font-medium">Sin conexión - Modo offline</span>
              </>
            )}
          </div>
          
          {pendingCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {pendingCount} registro{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''}
              </span>
              {isOnline && (
                <button
                  disabled={isSyncing}
                  onClick={async () => {
                    if (isSyncing) return;
                    setIsSyncing(true);
                    try {
                      console.log('🔄 Iniciando sincronización manual...');
                      
                      const result = await syncAllPendingRecords();
                      
                      if (result.success > 0) {
                        alert(`✅ ${result.success} registro(s) sincronizado(s) exitosamente${result.failed > 0 ? `\n⚠️ ${result.failed} pendiente(s)` : ''}`);
                      } else if (result.failed > 0) {
                        alert(`⏳ ${result.failed} registro(s) pendiente(s). Se reintentará automáticamente.`);
                      }
                      
                      await updatePendingCount();
                    } catch (error) {
                      console.error('❌ Error en sincronización:', error);
                    } finally {
                      setIsSyncing(false);
                    }
                  }}
                  className={`px-3 py-1 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                    isSyncing ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isSyncing && (
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  )}
                  {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Registro de Luminaria
          </h1>
          <p className="text-gray-600">
            Completa el formulario para registrar una nueva luminaria
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Sección: Imágenes */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Imágenes de la Luminaria
              </h3>
              
              {/* Imagen 1: Poste completo */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Imagen de la luminaria (Poste completo)
                </label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click para subir</span> o arrastra
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG o JPEG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImage}
                    />
                  </label>
                </div>
                {preview && (
                  <div className="mt-4 relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={preview}
                      alt="preview poste"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null)
                        setPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Imagen 2: Watts */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Imagen de los Wats
                </label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click para subir</span> o arrastra
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG o JPEG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageWatts}
                    />
                  </label>
                </div>
                {previewWatts && (
                  <div className="mt-4 relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={previewWatts}
                      alt="preview watts"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageWatts(null)
                        setPreviewWatts(null)
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Imagen 3: Fotocelda */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-900">
                  Imagen de Fotocelda
                </label>
                <div className="mt-2">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-600">
                        <span className="font-semibold">Click para subir</span> o arrastra
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG o JPEG</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageFotocelda}
                    />
                  </label>
                </div>
                {previewFotocelda && (
                  <div className="mt-4 relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={previewFotocelda}
                      alt="preview fotocelda"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFotocelda(null)
                        setPreviewFotocelda(null)
                      }}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sección: Ubicación */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-900">
                Ubicación GPS
              </label>
              
              {/* Aviso importante sobre HTTPS */}
              {!isSecureContext && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-lg mb-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>GPS automático no disponible:</strong> Estás usando HTTP en lugar de HTTPS. 
                        Puedes ingresar las coordenadas manualmente abajo.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <button
                type="button"
                onClick={useGeolocation}
                disabled={isLoadingLocation}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-black text-sm font-medium rounded-lg text-black bg-white hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingLocation ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Obteniendo ubicación...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Obtener ubicación automática
                  </>
                )}
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Latitud {!coords?.lat && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-12.046374"
                    value={coords?.lat ?? ''}
                    onChange={(e) =>
                      setCoords((c) => ({ lat: Number(e.target.value) || 0, lng: c?.lng ?? 0 }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-gray-900"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Ejemplo: -12.046374</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Longitud {!coords?.lng && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-77.042793"
                    value={coords?.lng ?? ''}
                    onChange={(e) =>
                      setCoords((c) => ({ lat: c?.lat ?? 0, lng: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-gray-900"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Ejemplo: -77.042793</p>
                </div>
              </div>
              
              {/* Ayuda para obtener coordenadas */}
              <details className="mt-3 bg-blue-50 rounded-lg p-3">
                <summary className="cursor-pointer text-sm font-medium text-blue-900">
                  💡 ¿Cómo obtener coordenadas manualmente?
                </summary>
                <div className="mt-2 space-y-2 text-xs text-blue-800">
                  <p><strong>Opción 1 - Google Maps:</strong></p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>Abre Google Maps en tu teléfono</li>
                    <li>Mantén presionado en tu ubicación</li>
                    <li>Copia las coordenadas que aparecen</li>
                  </ol>
                  <p className="mt-2"><strong>Opción 2 - App GPS:</strong></p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>Usa una app de GPS (GPS Status, GPS Test)</li>
                    <li>Lee las coordenadas mostradas</li>
                    <li>Introdúcelas en los campos arriba</li>
                  </ol>
                </div>
              </details>
            </div>

            {/* Sección: Especificaciones técnicas */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Especificaciones Técnicas
              </h3>
              
              {/* Watts - Radio buttons estilo moderno */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Potencia (Watts)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[25, 40, 80].map((w) => (
                    <label
                      key={w}
                      className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                        watts === w
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="watts"
                        value={w}
                        checked={watts === w}
                        onChange={() => setWatts(w)}
                        className="sr-only"
                      />
                      <span className="text-sm font-semibold">{w}W</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sección: Ubicación administrativa */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Ubicación Administrativa
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colonia
                </label>
                <select
                  value={selectedColonia ?? ''}
                  onChange={(e) => {
                    setSelectedColonia(Number(e.target.value) || null)
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none bg-white text-gray-900"
                  required
                >
                  <option value="">Selecciona una colonia</option>
                  {colonias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Poste
                </label>
                <input
                  type="text"
                  value={poste}
                  onChange={(e) => {
                    // Permitir solo números, letras, guiones y espacios
                    const sanitizedValue = e.target.value.replace(/[^a-zA-Z0-9\s\-]/g, '')
                    setPoste(sanitizedValue)
                  }}
                  placeholder="Ej: 100101 o P-12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-gray-900"
                  required
                  minLength={1}
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">Solo letras, números, guiones y espacios</p>
              </div>
            </div>

            {/* Sección: Fotocelda Nueva */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-900">
                Fotocelda Nueva
              </label>
              <select
                value={fotoceldaNueva}
                onChange={(e) => setFotoceldaNueva(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none bg-white text-gray-900"
                required
              >
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
              <div className="flex items-start space-x-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-blue-700">
                  <strong>Nota:</strong> Solo marca &quot;Sí&quot; si la capucha de la fotocelda es de color <strong>azul</strong>.
                </p>
              </div>
            </div>

            {/* Botón de envío */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? 'Enviando...' : 'Registrar Luminaria'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Todos los campos son requeridos para el registro completo
        </p>
      </div>
    </main>
  )
}
