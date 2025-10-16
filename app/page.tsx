"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'

type Colonia = {
  id: number
  nombre: string
  barrios: { id: number; nombre: string }[]
}

export default function Home() {
  const [colonias, setColonias] = useState<Colonia[]>([])
  const [selectedColonia, setSelectedColonia] = useState<number | null>(null)
  const [watts, setWatts] = useState<number>(25)
  const [poste, setPoste] = useState<string>('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetch('/api/colonias')
      .then((r) => r.json())
      .then((data) => setColonias(data))
      .catch((e) => console.error('Error cargando colonias', e))
  }, [])

  useEffect(() => {
    if (!image) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (file) setImage(file)
  }

  function useGeolocation() {
    if (!('geolocation' in navigator)) {
      alert('Geolocalización no soportada')
      return
    }
    setIsLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setIsLoadingLocation(false)
      },
      (err) => {
        alert('Error obteniendo ubicación: ' + err.message)
        setIsLoadingLocation(false)
      },
      { enableHighAccuracy: true }
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

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

    try {
      // Paso 1: Subir la imagen
      const formData = new FormData()
      formData.append('file', image)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Error al subir la imagen')
      }

      const uploadResult = await uploadResponse.json()
      console.log('Imagen subida:', uploadResult)

      // Paso 2: Crear la luminaria con la URL de la imagen
      const payload = {
        colonia_id: selectedColonia,
        numero_poste: poste,
        watts,
        latitud: coords.lat,
        longitud: coords.lng,
        imagen_url: uploadResult.publicUrl,
      }

      const response = await fetch('/api/luminarias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al enviar el formulario')
      }

      const result = await response.json()
      console.log('Luminaria registrada:', result)
      
      // Mostrar modal de éxito
      setShowSuccessModal(true)
      
      // Limpiar el formulario
      setSelectedColonia(null)
      setPoste('')
      setWatts(25)
      setCoords(null)
      setImage(null)
      setPreview(null)
      
    } catch (error) {
      console.error('Error al enviar formulario:', error)
      alert('❌ Error: ' + (error instanceof Error ? error.message : 'Error desconocido'))
    }
  }

  return (
    <>
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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
            
            {/* Sección: Imagen */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                Imagen de la luminaria
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
                    alt="preview"
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

            {/* Sección: Ubicación */}
            <div className="space-y-3 pt-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-900">
                Ubicación GPS
              </label>
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
                    Obtener ubicación actual
                  </>
                )}
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Latitud
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
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Longitud
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
                  />
                </div>
              </div>
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
                  onChange={(e) => setPoste(e.target.value)}
                  placeholder="Ej: P-12345"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none text-gray-900"
                />
              </div>
            </div>

            {/* Botón de envío */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-black text-white py-4 px-6 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                Registrar Luminaria
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

    {/* Modal de Éxito */}
    {showSuccessModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay con blur */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
            onClick={() => setShowSuccessModal(false)}
          ></div>

          {/* Centrar verticalmente */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          {/* Modal panel */}
          <div className="relative inline-block align-bottom bg-white rounded-2xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 animate-[slideUp_0.3s_ease-out]">
            <div>
              {/* Ícono de éxito con animación */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <svg className="h-10 w-10 text-green-600 animate-[checkmark_0.5s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              {/* Contenido del modal */}
              <div className="mt-3 text-center sm:mt-5">
                <h3 className="text-2xl leading-6 font-bold text-gray-900 mb-2" id="modal-title">
                  ¡Registro Exitoso!
                </h3>
                <div className="mt-2">
                  <p className="text-base text-gray-600">
                    La luminaria ha sido registrada correctamente en el sistema
                  </p>
                  <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-100">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Imagen cargada
                    </p>
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Ubicación GPS guardada
                    </p>
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Datos almacenados
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Botón de cierre */}
            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex justify-center w-full rounded-lg border border-transparent shadow-sm px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-base font-medium text-white hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-[1.02]"
              >
                ¡Perfecto!
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  )
}
