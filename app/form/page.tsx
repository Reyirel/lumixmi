"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Lightbulb } from 'lucide-react'

type Colonia = {
  id: number
  nombre: string
  barrios: { id: number; nombre: string }[]
}

export default function FormPage() {
  const [colonias, setColonias] = useState<Colonia[]>([])
  const [selectedColonia, setSelectedColonia] = useState<number | null>(null)
  const [selectedBarrio, setSelectedBarrio] = useState<number | null>(null)
  const [watts, setWatts] = useState<number>(25)
  const [poste, setPoste] = useState<string>('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        alert('Error obteniendo ubicación: ' + err.message)
      },
      { enableHighAccuracy: true }
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      watts,
      poste,
      coloniaId: selectedColonia,
      barrioId: selectedBarrio,
      coords,
      imageName: image?.name ?? null,
    }
    // Aquí enviarías al servidor. De momento solo lo mostramos en consola.
    console.log('Enviar payload:', payload)
    alert('Formulario listo (revisa consola)')
  }

  const barriosOptions =
    colonias.find((c) => c.id === selectedColonia)?.barrios ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/admin"
                className="inline-flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver al Admin
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black rounded-lg">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nueva Luminaria</h1>
                <p className="text-sm text-gray-500">Registro de nueva instalación</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de la luminaria
              </label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImage}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800"
              />
              {preview && (
                <div className="mt-4">
                  <img 
                    src={preview} 
                    alt="Vista previa" 
                    className="max-w-xs rounded-lg shadow-sm border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Ubicación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ubicación GPS
              </label>
              <button 
                type="button" 
                onClick={useGeolocation}
                className="mb-4 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                📍 Obtener ubicación actual
              </button>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Latitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={coords?.lat ?? ''}
                    onChange={(e) =>
                      setCoords((c) => ({ lat: Number(e.target.value) || 0, lng: c?.lng ?? 0 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Ej: 25.686613"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Longitud
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={coords?.lng ?? ''}
                    onChange={(e) =>
                      setCoords((c) => ({ lat: c?.lat ?? 0, lng: Number(e.target.value) || 0 }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Ej: -100.316110"
                  />
                </div>
              </div>
            </div>

            {/* Watts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Potencia (Watts)
              </label>
              <select 
                value={watts} 
                onChange={(e) => setWatts(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value={25}>25W</option>
                <option value={40}>40W</option>
                <option value={80}>80W</option>
              </select>
            </div>

            {/* Colonia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colonia
              </label>
              <select
                value={selectedColonia ?? ''}
                onChange={(e) => setSelectedColonia(Number(e.target.value) || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="">-- Selecciona colonia --</option>
                {colonias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Barrio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barrio
              </label>
              <select
                value={selectedBarrio ?? ''}
                onChange={(e) => setSelectedBarrio(Number(e.target.value) || null)}
                disabled={!selectedColonia}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">-- Selecciona barrio --</option>
                {barriosOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Número de poste */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de poste
              </label>
              <input 
                type="text"
                value={poste} 
                onChange={(e) => setPoste(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Ej: P-001"
              />
            </div>

            {/* Botón de envío */}
            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                💾 Guardar Luminaria
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
