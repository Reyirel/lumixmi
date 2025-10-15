"use client"

import React, { useEffect, useState } from 'react'

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
    <main style={{ padding: 20 }}>
      <h1>Formulario de subida</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>Imagen (subir):</label>
          <input type="file" accept="image/*" onChange={handleImage} />
          {preview && (
            <div style={{ marginTop: 8 }}>
              <img src={preview} alt="preview" style={{ maxWidth: 300 }} />
            </div>
          )}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Ubicación (obtener exacta):</label>
          <div>
            <button type="button" onClick={useGeolocation}>
              Obtener ubicación actual
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            <label>Latitud:</label>
            <input
              type="number"
              step="any"
              value={coords?.lat ?? ''}
              onChange={(e) =>
                setCoords((c) => ({ lat: Number(e.target.value) || 0, lng: c?.lng ?? 0 }))
              }
            />
            <label style={{ marginLeft: 8 }}>Longitud:</label>
            <input
              type="number"
              step="any"
              value={coords?.lng ?? ''}
              onChange={(e) =>
                setCoords((c) => ({ lat: c?.lat ?? 0, lng: Number(e.target.value) || 0 }))
              }
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Watts:</label>
          <select value={watts} onChange={(e) => setWatts(Number(e.target.value))}>
            <option value={25}>25</option>
            <option value={40}>40</option>
            <option value={80}>80</option>
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Colonia:</label>
          <select
            value={selectedColonia ?? ''}
            onChange={(e) => setSelectedColonia(Number(e.target.value) || null)}
          >
            <option value="">-- Selecciona colonia --</option>
            {colonias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Barrio:</label>
          <select
            value={selectedBarrio ?? ''}
            onChange={(e) => setSelectedBarrio(Number(e.target.value) || null)}
            disabled={!selectedColonia}
          >
            <option value="">-- Selecciona barrio --</option>
            {barriosOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Número de poste:</label>
          <input value={poste} onChange={(e) => setPoste(e.target.value)} />
        </div>

        <div style={{ marginTop: 16 }}>
          <button type="submit">Enviar</button>
        </div>
      </form>
    </main>
  )
}
