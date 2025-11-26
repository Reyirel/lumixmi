'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/lib/NotificationSystem'

type Colonia = {
  id: number
  nombre: string
  created_at: string
}

type Luminaria = {
  id: number
  colonia_id: number | null
  numero_poste: string
  watts: 25 | 40 | 80
  latitud: number
  longitud: number
  imagen_url: string | null
  imagen_watts_url: string | null
  imagen_fotocelda_url: string | null
  fotocelda_nueva: boolean
  created_at: string
  updated_at: string
  colonias?: {
    id: number
    nombre: string
  }
}

type WattGroup = {
  watts: 25 | 40 | 80
  count: number
  luminarias: Luminaria[]
}

// Metas de lámparas por comunidad
const METAS_LAMPARAS: { [key: string]: number } = {
  "Barrio de Progreso": 73,
  "Col. Vista Hermosa": 46,
  "Cruz Blanca": 46,
  "El Deca": 92,
  "La Loma López Rayón": 63,
  "La Mesa López Rayón": 27,
  "Ignacio López Rayón": 113,
  "El Dextli Alberto": 28,
  "El Dextho": 108,
  "El Mandho": 179,
  "El Oro": 105,
  "La Loma del Oro": 142,
  "La Media Luna": 122,
  "La Reforma": 304,
  "Panales": 340,
  "Santa Ana": 78,
  "Cerritos Remedios": 171,
  "Col. Samayoa": 29,
  "El Espino": 117,
  "Granaditas": 54,
  "La Loma San Pedro Remedios": 50,
  "Los Pinos Remedios": 51,
  "Pozo Mirador": 70,
  "Remedios": 187,
  "San Nicolás": 583,
  "Vázquez Remedios": 132,
  "Col. Lázaro Cárdenas": 27,
  "Boxhuada": 49,
  "El Banxu": 73,
  "El Huacri": 54,
  "El Meje": 20,
  "El Nandho": 12,
  "La Lagunita": 36,
  "La Palma Orizabita": 29,
  "La Pechuga": 40,
  "Las Emes": 5,
  "Naxthey San Juanico": 37,
  "Ojuelo": 9,
  "Orizabita": 249,
  "San Andrés Orizabita": 74,
  "Villa de la Paz": 62,
  "Xaxni": 4,
  "Barrio de Jesús": 103,
  "Barrio de San Antonio": 75,
  "Bondho": 75,
  "Col. 20 de Noviembre": 62,
  "Col. Benito Juárez": 140,
  "Col. Santa Alicia": 28,
  "Col. Vicente Guerrero": 38,
  "El Calvario": 77,
  "El Carmen": 64,
  "El Carrizal": 139,
  "Fracc. Joaquín Baranda": 69,
  "Fracc. Valle de San Javier": 147,
  "San Miguel": 121,
  "Canada Chica": 207,
  "Col. Felipe Ángeles J.V.": 42,
  "Col. Independencia J.V.": 13,
  "El Tablon": 68,
  "El Te-Pathe": 58,
  "El Tephe": 519,
  "Ex-Hacienda de Ocotza J.V.": 113,
  "Julian Villagran Centro": 141,
  "La Loma Julián Villagrán": 63,
  "La Loma Pueblo Nuevo": 74,
  "Loma Centro Julián Villagrán": 80,
  "Maguey Blanco": 412,
  "Pueblo Nuevo": 142,
  "Taxoho": 197,
  "Cantinela": 124,
  "Col. Miguel Hidalgo": 140,
  "Dios Padre": 132,
  "El Alberto": 78,
  "El Barrido": 156,
  "El Fitzhi": 585,
  "El Maye": 292,
  "El Valante": 68,
  "Arenalito Remedios": 138,
  "Bangandho": 92,
  "Botenguedho": 121,
  "Capula": 231,
  "Cerrito Capula": 52,
  "Col. La Joya": 65,
  "Col. La Libertad": 64,
  "Col. Valle de los Remedios - El Mirador Capula": 117,
  "El Nith": 347,
  "El Rosario Capula": 34,
  "Ex-Hacienda Debodhe": 89,
  "Jagüey de Vázquez Capula": 76,
  "Jahuey Capula": 76,
  "La Estación": 100,
  "La Huerta Capula": 77,
  "La Loma de la Cruz": 12,
  "La Palma": 66,
  "Puerto Bangandho": 79,
  "San Pedro Capula": 101,
  "Cantamaye": 6,
  "Col. Gral. Felipe Ángeles": 223,
  "El Bojay": 9,
  "El Dexthi San Juanico": 72,
  "El Durazno": 144,
  "La Heredad": 113,
  "Los Martínez": 7,
  "Puerto Dexthi": 89,
  "San Juanico": 58,
  "Ustheje": 19,
}

// Función para normalizar nombres de comunidades para comparación
const normalizeName = (name: string): string => {
  return name
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
}

// Función para obtener la meta de una comunidad
const getMetaForColonia = (nombreColonia: string): number | null => {
  // Primero buscar coincidencia exacta
  if (METAS_LAMPARAS[nombreColonia]) {
    return METAS_LAMPARAS[nombreColonia]
  }
  
  // Si no hay coincidencia exacta, buscar con normalización
  const normalizedInput = normalizeName(nombreColonia)
  for (const [key, value] of Object.entries(METAS_LAMPARAS)) {
    if (normalizeName(key) === normalizedInput) {
      return value
    }
  }
  
  return null
}

export default function AdminPage() {
  const router = useRouter()
  const { showNotification } = useNotifications()
  const [colonias, setColonias] = useState<Colonia[]>([])
  const [luminarias, setLuminarias] = useState<Luminaria[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedColonia, setSelectedColonia] = useState<Colonia | null>(null)
  const [expandedWatt, setExpandedWatt] = useState<25 | 40 | 80 | null>(null)
  const [selectedLuminaria, setSelectedLuminaria] = useState<Luminaria | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({})
  
  // Estados para ordenamiento de luminarias
  const [sortField, setSortField] = useState<'numero_poste' | 'latitud' | 'longitud' | 'created_at'>('numero_poste')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Estados para edición y eliminación
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState<Partial<Luminaria>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Función para verificar si una URL de imagen es válida
  const isValidImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    if (typeof url !== 'string') return false
    if (url.trim() === '') return false
    // Verificar que sea una URL válida (http, https o data URI)
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')
  }

  // Función para manejar errores de carga de imagen
  const handleImageError = (imageKey: string) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }))
  }

  // Función para resetear errores cuando cambia la luminaria seleccionada
  useEffect(() => {
    if (selectedLuminaria) {
      setImageErrors({})
    }
  }, [selectedLuminaria])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      const [coloniasRes, luminariasRes] = await Promise.all([
        fetch('/api/colonias'),
        fetch('/api/luminarias')
      ])

      const coloniasData = await coloniasRes.json()
      const luminariasData = await luminariasRes.json()

      setColonias(coloniasData)
      setLuminarias(luminariasData)
      
      showNotification('success', 'Datos cargados exitosamente', 
        `${coloniasData.length} colonias y ${luminariasData.length} luminarias`, 3000)
    } catch (error) {
      showNotification('error', 'Error cargando datos', 
        error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [showNotification])

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated')
    if (!isAuth) {
      router.push('/login')
      return
    }

    // Cargar datos inicialmente
    loadData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    router.push('/login')
  }

  const getLuminariasForColonia = (coloniaId: number): Luminaria[] => {
    return luminarias.filter(l => l.colonia_id === coloniaId)
  }

  const getWattGroups = (coloniaLuminarias: Luminaria[]): WattGroup[] => {
    const groups: WattGroup[] = [
      { watts: 25, count: 0, luminarias: [] },
      { watts: 40, count: 0, luminarias: [] },
      { watts: 80, count: 0, luminarias: [] }
    ]

    coloniaLuminarias.forEach(lum => {
      const group = groups.find(g => g.watts === lum.watts)
      if (group) {
        group.count++
        group.luminarias.push(lum)
      }
    })

    return groups
  }

  // Función para ordenar luminarias
  const sortLuminarias = (luminariasToSort: Luminaria[]): Luminaria[] => {
    return [...luminariasToSort].sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'numero_poste':
          // Intentar ordenar numéricamente si es posible
          const numA = parseInt(a.numero_poste)
          const numB = parseInt(b.numero_poste)
          if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB
          } else {
            comparison = a.numero_poste.localeCompare(b.numero_poste, 'es', { numeric: true })
          }
          break
        case 'latitud':
          comparison = a.latitud - b.latitud
          break
        case 'longitud':
          comparison = a.longitud - b.longitud
          break
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const closeModal = () => {
    setSelectedColonia(null)
    setExpandedWatt(null)
    setSelectedLuminaria(null)
    setIsEditing(false)
    setEditFormData({})
    setShowDeleteConfirm(false)
  }

  // Función para iniciar la edición
  const startEditing = () => {
    if (selectedLuminaria) {
      setEditFormData({
        ...selectedLuminaria
      })
      setIsEditing(true)
    }
  }

  // Función para cancelar la edición
  const cancelEditing = () => {
    setIsEditing(false)
    setEditFormData({})
  }

  // Función para guardar los cambios
  const handleSaveEdit = async () => {
    if (!selectedLuminaria || !editFormData) return

    setIsSaving(true)
    try {
      // Preparar solo los campos necesarios para la actualización (sin URLs de imágenes)
      const dataToSend = {
        colonia_id: editFormData.colonia_id,
        numero_poste: editFormData.numero_poste,
        watts: editFormData.watts,
        latitud: editFormData.latitud,
        longitud: editFormData.longitud,
        imagen_url: selectedLuminaria.imagen_url, // Mantener imagen original
        imagen_watts_url: selectedLuminaria.imagen_watts_url, // Mantener imagen original
        imagen_fotocelda_url: selectedLuminaria.imagen_fotocelda_url, // Mantener imagen original
        fotocelda_nueva: editFormData.fotocelda_nueva
      }

      const response = await fetch(`/api/luminarias/${selectedLuminaria.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'authenticated'
        },
        body: JSON.stringify(dataToSend)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al actualizar')
      }

      await response.json()
      
      // Actualizar la lista de luminarias localmente
      setLuminarias(prev => 
        prev.map(l => l.id === selectedLuminaria.id ? { ...l, ...editFormData } : l)
      )
      
      // Actualizar la luminaria seleccionada
      setSelectedLuminaria({ ...selectedLuminaria, ...editFormData } as Luminaria)
      
      setIsEditing(false)
      setEditFormData({})
      
      showNotification('success', 'Luminaria actualizada', 
        `El poste ${editFormData.numero_poste} ha sido actualizado correctamente`, 3000)
    } catch (error) {
      showNotification('error', 'Error al actualizar', 
        error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  // Función para eliminar luminaria
  const handleDelete = async () => {
    if (!selectedLuminaria) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/luminarias/${selectedLuminaria.id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': 'authenticated'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar')
      }

      // Eliminar de la lista local
      setLuminarias(prev => prev.filter(l => l.id !== selectedLuminaria.id))
      
      showNotification('success', 'Luminaria eliminada', 
        `El poste ${selectedLuminaria.numero_poste} ha sido eliminado correctamente`, 3000)
      
      // Cerrar modales
      setSelectedLuminaria(null)
      setShowDeleteConfirm(false)
    } catch (error) {
      showNotification('error', 'Error al eliminar', 
        error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredColonias = colonias.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalLuminarias = luminarias.length
  const stats = {
    total: totalLuminarias,
    watts25: luminarias.filter(l => l.watts === 25).length,
    watts40: luminarias.filter(l => l.watts === 40).length,
    watts80: luminarias.filter(l => l.watts === 80).length,
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-black mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando datos...</p>
        </div>
      </div>
    )
  }

  const coloniaLuminarias = selectedColonia ? getLuminariasForColonia(selectedColonia.id) : []
  const wattGroups = selectedColonia ? getWattGroups(coloniaLuminarias) : []

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg flex-shrink-0">
                <svg 
                  className="w-6 h-6 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Panel de Administrador</h1>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                  <span className="truncate max-w-[200px] sm:max-w-none">{localStorage.getItem('userEmail')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              {/* Botón de ir al formulario */}
              <button 
                onClick={() => router.push('/form')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-black text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-800 transition-all"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden xs:inline">Registrar Luminaria</span>
                <span className="xs:hidden">Registrar</span>
              </button>
              
              {/* Botón de cerrar sesión */}
              <button 
                onClick={handleLogout}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <StatCard 
            title="Total Luminarias" 
            value={stats.total} 
            icon={
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            color="bg-black"
          />
          <StatCard 
            title="Luminarias 25W" 
            value={stats.watts25} 
            icon={<span className="text-lg sm:text-xl font-bold">25W</span>}
            color="bg-blue-600"
          />
          <StatCard 
            title="Luminarias 40W" 
            value={stats.watts40} 
            icon={<span className="text-lg sm:text-xl font-bold">40W</span>}
            color="bg-green-600"
          />
          <StatCard 
            title="Luminarias 80W" 
            value={stats.watts80} 
            icon={<span className="text-lg sm:text-xl font-bold">80W</span>}
            color="bg-orange-600"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar comunidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base text-gray-900"
            />
          </div>
        </div>

        {/* Communities Section */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
            Comunidades ({filteredColonias.length})
          </h2>
        </div>

        {/* Communities Grid */}
        {filteredColonias.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredColonias.map(colonia => {
              const lumCount = getLuminariasForColonia(colonia.id).length
              const meta = getMetaForColonia(colonia.nombre)
              const porcentaje = meta ? Math.min((lumCount / meta) * 100, 100) : 0
              const excedido = meta ? lumCount > meta : false
              const porcentajeReal = meta ? (lumCount / meta) * 100 : 0
              
              return (
                <div
                  key={colonia.id}
                  onClick={() => setSelectedColonia(colonia)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-black hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 truncate">
                        {colonia.nombre}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(colonia.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex-shrink-0 ml-2">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  {meta && (
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Progreso</span>
                        <span className={`text-xs font-semibold ${excedido ? 'text-red-600' : porcentajeReal >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
                          {porcentajeReal.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            excedido 
                              ? 'bg-red-500' 
                              : porcentajeReal >= 100 
                                ? 'bg-green-500' 
                                : porcentajeReal >= 75 
                                  ? 'bg-yellow-500' 
                                  : 'bg-blue-500'
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">{lumCount} / {meta}</span>
                        {excedido && (
                          <span className="text-xs font-semibold text-red-600 flex items-center">
                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            +{lumCount - meta} excedido
                          </span>
                        )}
                        {!excedido && porcentajeReal >= 100 && (
                          <span className="text-xs font-semibold text-green-600 flex items-center">
                            <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Completado
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 ${!meta ? '' : ''}`}>
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Total de lámparas</span>
                    <span className={`inline-flex items-center justify-center px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${
                      excedido 
                        ? 'bg-red-100 text-red-700' 
                        : meta && porcentajeReal >= 100 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-black text-white'
                    }`}>
                      {lumCount}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No se encontraron comunidades</h3>
            <p className="text-sm text-gray-500">
              {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay comunidades registradas'}
            </p>
          </div>
        )}
      </div>

      {/* Modal Comunidad */}
      {selectedColonia && (() => {
        const metaModal = getMetaForColonia(selectedColonia.nombre)
        const porcentajeModal = metaModal ? Math.min((coloniaLuminarias.length / metaModal) * 100, 100) : 0
        const excedidoModal = metaModal ? coloniaLuminarias.length > metaModal : false
        const porcentajeRealModal = metaModal ? (coloniaLuminarias.length / metaModal) * 100 : 0
        
        return (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 animate-fadeIn"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{selectedColonia.nombre}</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {coloniaLuminarias.length} lámpara{coloniaLuminarias.length !== 1 && 's'} registrada{coloniaLuminarias.length !== 1 && 's'}
                  {metaModal && ` de ${metaModal} (meta)`}
                </p>
                
                {/* Barra de progreso en el modal */}
                {metaModal && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Progreso de instalación</span>
                      <span className={`text-xs font-semibold ${excedidoModal ? 'text-red-600' : porcentajeRealModal >= 100 ? 'text-green-600' : 'text-gray-600'}`}>
                        {porcentajeRealModal.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          excedidoModal 
                            ? 'bg-red-500' 
                            : porcentajeRealModal >= 100 
                              ? 'bg-green-500' 
                              : porcentajeRealModal >= 75 
                                ? 'bg-yellow-500' 
                                : 'bg-blue-500'
                        }`}
                        style={{ width: `${porcentajeModal}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{coloniaLuminarias.length} / {metaModal} lámparas</span>
                      {excedidoModal && (
                        <span className="text-xs font-semibold text-red-600 flex items-center">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Excedido por {coloniaLuminarias.length - metaModal} lámparas
                        </span>
                      )}
                      {!excedidoModal && porcentajeRealModal >= 100 && (
                        <span className="text-xs font-semibold text-green-600 flex items-center">
                          <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          ¡Meta alcanzada!
                        </span>
                      )}
                      {!excedidoModal && porcentajeRealModal < 100 && (
                        <span className="text-xs text-gray-500">
                          Faltan {metaModal - coloniaLuminarias.length} lámparas
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0 ml-2"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {coloniaLuminarias.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">No hay lámparas registradas en esta comunidad</p>
                </div>
              ) : (
                <>
                  {/* Summary Table */}
                  <div className="bg-gray-50 rounded-xl overflow-hidden mb-6 border border-gray-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-black text-white">
                          <th className="px-6 py-4 text-left text-sm font-semibold">Total</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold">25W</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold">40W</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold">80W</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        <tr>
                          <td className="px-6 py-4 text-2xl font-bold text-gray-900">
                            {coloniaLuminarias.length}
                          </td>
                          {wattGroups.map(group => (
                            <td
                              key={group.watts}
                              onClick={() => setExpandedWatt(expandedWatt === group.watts ? null : group.watts)}
                              className={`px-6 py-4 text-center text-2xl font-bold cursor-pointer transition-all ${
                                expandedWatt === group.watts 
                                  ? 'bg-gray-100 text-black' 
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {group.count}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Expanded Watt List */}
                  {expandedWatt && (
                    <div className="animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <span className="inline-block w-2 h-2 bg-black rounded-full mr-2"></span>
                          Lámparas de {expandedWatt}W
                        </h3>
                        
                        {/* Controles de ordenamiento */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-600">Ordenar por:</span>
                          <select
                            value={sortField}
                            onChange={(e) => setSortField(e.target.value as 'numero_poste' | 'latitud' | 'longitud' | 'created_at')}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="numero_poste">Número de Poste</option>
                            <option value="latitud">Latitud</option>
                            <option value="longitud">Longitud</option>
                            <option value="created_at">Fecha de Registro</option>
                          </select>
                          
                          <button
                            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                            title={sortDirection === 'asc' ? 'Menor a Mayor' : 'Mayor a Menor'}
                          >
                            {sortDirection === 'asc' ? (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                </svg>
                                <span className="hidden sm:inline">Ascendente</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                                </svg>
                                <span className="hidden sm:inline">Descendente</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {sortLuminarias(wattGroups.find(g => g.watts === expandedWatt)?.luminarias || []).map(lum => (
                          <div
                            key={lum.id}
                            onClick={() => setSelectedLuminaria(lum)}
                            className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-black hover:shadow-md transition-all group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg group-hover:bg-black group-hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">Poste: {lum.numero_poste}</p>
                                    <p className="text-sm text-gray-600">
                                      {lum.latitud.toFixed(6)}, {lum.longitud.toFixed(6)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        )
      })()}

      {/* Modal Detalle Luminaria */}
      {selectedLuminaria && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 animate-fadeIn"
          onClick={() => { setSelectedLuminaria(null); setIsEditing(false); setShowDeleteConfirm(false); }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-black text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isEditing ? 'Editar Lámpara' : 'Detalles de Lámpara'}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && !showDeleteConfirm && (
                  <>
                    <button
                      onClick={startEditing}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 hover:bg-red-500/50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setSelectedLuminaria(null); setIsEditing(false); setShowDeleteConfirm(false); }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Confirmación de eliminación */}
              {showDeleteConfirm && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-800 mb-2">¿Eliminar esta luminaria?</h3>
                      <p className="text-red-700 mb-4">
                        Esta acción no se puede deshacer. Se eliminará permanentemente el poste <strong>{selectedLuminaria.numero_poste}</strong> y todos sus datos asociados.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isDeleting ? (
                            <>
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Eliminando...
                            </>
                          ) : (
                            'Sí, eliminar'
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={isDeleting}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Formulario de edición */}
              {isEditing && !showDeleteConfirm && (
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Número de Poste */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Poste *</label>
                      <input
                        type="text"
                        value={editFormData.numero_poste || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, numero_poste: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    {/* Watts */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Potencia (Watts) *</label>
                      <select
                        value={editFormData.watts || 25}
                        onChange={(e) => setEditFormData({ ...editFormData, watts: parseInt(e.target.value) as 25 | 40 | 80 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      >
                        <option value={25}>25W</option>
                        <option value={40}>40W</option>
                        <option value={80}>80W</option>
                      </select>
                    </div>

                    {/* Latitud */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitud *</label>
                      <input
                        type="number"
                        step="any"
                        value={editFormData.latitud || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, latitud: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    {/* Longitud */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitud *</label>
                      <input
                        type="number"
                        step="any"
                        value={editFormData.longitud || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, longitud: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    {/* Colonia */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Comunidad</label>
                      <select
                        value={editFormData.colonia_id || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, colonia_id: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                      >
                        <option value="">Sin comunidad</option>
                        {colonias.map(colonia => (
                          <option key={colonia.id} value={colonia.id}>{colonia.nombre}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fotocelda Nueva */}
                    <div className="flex items-center">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.fotocelda_nueva || false}
                          onChange={(e) => setEditFormData({ ...editFormData, fotocelda_nueva: e.target.checked })}
                          className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Fotocelda Nueva (Capucha Azul)</span>
                      </label>
                    </div>
                  </div>

                  {/* Nota informativa sobre imágenes */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-700">
                        Las imágenes no pueden ser editadas. Para cambiar las imágenes, elimine este registro y cree uno nuevo.
                      </p>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSaving || !editFormData.numero_poste || !editFormData.watts || editFormData.latitud === undefined || editFormData.longitud === undefined}
                      className="flex-1 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Vista normal de detalles */}
              {!isEditing && !showDeleteConfirm && (
                <>
                  {/* Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Imagen 1: Poste completo */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 uppercase">Poste Completo</p>
                  <div 
                    className="rounded-xl overflow-hidden border-2 border-gray-200 relative h-64 md:h-72 cursor-pointer hover:border-black transition-all bg-white"
                    onClick={() => isValidImageUrl(selectedLuminaria.imagen_url) && !imageErrors['poste'] && setFullscreenImage(selectedLuminaria.imagen_url)}
                  >
                    {isValidImageUrl(selectedLuminaria.imagen_url) && !imageErrors['poste'] ? (
                      <img 
                        src={selectedLuminaria.imagen_url!} 
                        alt="Poste completo"
                        className="w-full h-full object-contain"
                        onError={() => handleImageError('poste')}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Imagen no disponible</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Imagen 2: Watts */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 uppercase">Watts</p>
                  <div 
                    className="rounded-xl overflow-hidden border-2 border-gray-200 relative h-64 md:h-72 cursor-pointer hover:border-black transition-all bg-white"
                    onClick={() => isValidImageUrl(selectedLuminaria.imagen_watts_url) && !imageErrors['watts'] && setFullscreenImage(selectedLuminaria.imagen_watts_url)}
                  >
                    {isValidImageUrl(selectedLuminaria.imagen_watts_url) && !imageErrors['watts'] ? (
                      <img 
                        src={selectedLuminaria.imagen_watts_url!} 
                        alt="Watts"
                        className="w-full h-full object-contain"
                        onError={() => handleImageError('watts')}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Imagen no disponible</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Imagen 3: Fotocelda */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700 uppercase">Fotocelda</p>
                  <div 
                    className="rounded-xl overflow-hidden border-2 border-gray-200 relative h-64 md:h-72 cursor-pointer hover:border-black transition-all bg-white"
                    onClick={() => isValidImageUrl(selectedLuminaria.imagen_fotocelda_url) && !imageErrors['fotocelda'] && setFullscreenImage(selectedLuminaria.imagen_fotocelda_url)}
                  >
                    {isValidImageUrl(selectedLuminaria.imagen_fotocelda_url) && !imageErrors['fotocelda'] ? (
                      <img 
                        src={selectedLuminaria.imagen_fotocelda_url!} 
                        alt="Fotocelda"
                        className="w-full h-full object-contain"
                        onError={() => handleImageError('fotocelda')}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm">Imagen no disponible</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-4">
                <InfoField 
                  label="Número de Poste" 
                  value={selectedLuminaria.numero_poste}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  }
                />
                <InfoField 
                  label="Potencia" 
                  value={`${selectedLuminaria.watts}W`}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
                <InfoField 
                  label="Fotocelda Nueva" 
                  value={selectedLuminaria.fotocelda_nueva ? 'Sí' : 'No'}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <InfoField 
                  label="Longitud" 
                  value={selectedLuminaria.longitud.toFixed(6)}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <InfoField 
                  label="Fecha de Registro" 
                  value={new Date(selectedLuminaria.created_at).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>

              {/* Action Button */}
              <a
                href={`https://www.google.com/maps?q=${selectedLuminaria.latitud},${selectedLuminaria.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 w-full inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all transform hover:scale-[1.02]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver en Google Maps
              </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[70] p-4 animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-3 bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full transition-all z-10"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div 
            className="relative w-full h-full max-w-6xl max-h-[90vh] animate-scaleIn flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={fullscreenImage} 
              alt="Imagen en pantalla completa"
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<div class="text-white text-center"><svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p>Error al cargar la imagen</p></div>';
              }}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
            Haz clic fuera de la imagen para cerrar
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </main>
  )
}

// Componentes auxiliares
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function InfoField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-shrink-0 text-gray-600 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
      </div>
    </div>
  )
}
