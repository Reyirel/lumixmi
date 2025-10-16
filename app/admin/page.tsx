'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

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

export default function AdminPage() {
  const router = useRouter()
  const [colonias, setColonias] = useState<Colonia[]>([])
  const [luminarias, setLuminarias] = useState<Luminaria[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [selectedColonia, setSelectedColonia] = useState<Colonia | null>(null)
  const [expandedWatt, setExpandedWatt] = useState<25 | 40 | 80 | null>(null)
  const [selectedLuminaria, setSelectedLuminaria] = useState<Luminaria | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Verificar autenticación
    const isAuth = localStorage.getItem('isAuthenticated')
    if (!isAuth) {
      router.push('/login')
      return
    }

    // Cargar datos inicialmente
    loadData()

    // Configurar auto-refresco cada 10 segundos
    const intervalId = setInterval(() => {
      loadData()
    }, 10000) // 10 segundos

    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(intervalId)
  }, [router])

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const [coloniasRes, luminariasRes] = await Promise.all([
        fetch('/api/colonias'),
        fetch('/api/luminarias')
      ])

      const coloniasData = await coloniasRes.json()
      const luminariasData = await luminariasRes.json()

      setColonias(coloniasData)
      setLuminarias(luminariasData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleManualRefresh = () => {
    loadData(true)
  }

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

  const closeModal = () => {
    setSelectedColonia(null)
    setExpandedWatt(null)
    setSelectedLuminaria(null)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Panel de Administrador</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>{localStorage.getItem('userEmail')}</span>
                  {lastUpdate && (
                    <>
                      <span>•</span>
                      <span className="text-gray-500">
                        Actualizado: {lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Botón de actualización */}
              <button 
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualizar datos"
              >
                <svg 
                  className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </button>
              
              {/* Botón de cerrar sesión */}
              <button 
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner de actualización automática */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-700">
                <span className="font-semibold">Actualización automática activada:</span> Los datos se actualizan cada 10 segundos automáticamente.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Luminarias" 
            value={stats.total} 
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            color="bg-black"
          />
          <StatCard 
            title="Luminarias 25W" 
            value={stats.watts25} 
            icon={<span className="text-xl font-bold">25W</span>}
            color="bg-blue-600"
          />
          <StatCard 
            title="Luminarias 40W" 
            value={stats.watts40} 
            icon={<span className="text-xl font-bold">40W</span>}
            color="bg-green-600"
          />
          <StatCard 
            title="Luminarias 80W" 
            value={stats.watts80} 
            icon={<span className="text-xl font-bold">80W</span>}
            color="bg-orange-600"
          />
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar comunidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Communities Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Comunidades ({filteredColonias.length})
          </h2>
        </div>

        {/* Communities Grid */}
        {filteredColonias.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredColonias.map(colonia => {
              const lumCount = getLuminariasForColonia(colonia.id).length
              return (
                <div
                  key={colonia.id}
                  onClick={() => setSelectedColonia(colonia)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-black hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {colonia.nombre}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(colonia.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Total de lámparas</span>
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-black text-white">
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
      {selectedColonia && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedColonia.nombre}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {coloniaLuminarias.length} lámpara{coloniaLuminarias.length !== 1 && 's'} registrada{coloniaLuminarias.length !== 1 && 's'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
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
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="inline-block w-2 h-2 bg-black rounded-full mr-2"></span>
                        Lámparas de {expandedWatt}W
                      </h3>
                      <div className="space-y-3">
                        {wattGroups.find(g => g.watts === expandedWatt)?.luminarias.map(lum => (
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
      )}

      {/* Modal Detalle Luminaria */}
      {selectedLuminaria && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4 animate-fadeIn"
          onClick={() => setSelectedLuminaria(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-black text-white flex items-center justify-between">
              <h2 className="text-xl font-bold">Detalles de Lámpara</h2>
              <button
                onClick={() => setSelectedLuminaria(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Image */}
              {selectedLuminaria.imagen_url && (
                <div className="mb-6 rounded-xl overflow-hidden border-2 border-gray-200 relative h-64">
                  <Image 
                    src={selectedLuminaria.imagen_url} 
                    alt={`Lámpara ${selectedLuminaria.numero_poste}`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

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
                  label="Latitud" 
                  value={selectedLuminaria.latitud.toFixed(6)}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            </div>
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

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </main>
  )
}

// Componentes auxiliares
function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center justify-center w-12 h-12 ${color} rounded-lg text-white`}>
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
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
