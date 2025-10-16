'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  FileSpreadsheet, 
  Eye,
  X,
  Download,
  Trash2,
  Lightbulb,
  MapPin,
  BarChart3,
  Settings,
  Database,
  Plus,
  LogOut
} from 'lucide-react'

// Tipos de datos
interface FocoData {
  localidad: string
  tipoWatts: string
  cantidad: number
  detalles?: {
    ubicacion?: string
    estado?: string
    fechaInstalacion?: string
  }
}

interface LocalidadGroup {
  localidad: string
  tipos: {
    [watts: string]: FocoData[]
  }
  totalFocos: number
}

export default function AdminPage() {
  const router = useRouter()
  const [datos, setDatos] = useState<LocalidadGroup[]>([])
  const [expandedLocalidades, setExpandedLocalidades] = useState<Set<string>>(new Set())
  const [modalData, setModalData] = useState<{
    localidad: string
    tipoWatts: string
    focos: FocoData[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  // Función para procesar archivo Excel
  const procesarExcel = useCallback((file: File) => {
    setIsLoading(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Procesar datos del Excel
        const focoDataArray: FocoData[] = (jsonData as Record<string, unknown>[]).map((row) => ({
          localidad: String(row['Localidad'] || row['localidad'] || ''),
          tipoWatts: String(row['Tipo_Watts'] || row['tipo_watts'] || row['Watts'] || ''),
          cantidad: parseInt(String(row['Cantidad'] || row['cantidad'] || '0')),
          detalles: {
            ubicacion: String(row['Ubicacion'] || row['ubicacion'] || ''),
            estado: String(row['Estado'] || row['estado'] || 'Activo'),
            fechaInstalacion: String(row['Fecha_Instalacion'] || row['fecha_instalacion'] || '')
          }
        }))

        // Agrupar por localidad
        const groupedData = agruparPorLocalidad(focoDataArray)
        setDatos(groupedData)
        
      } catch (error) {
        console.error('Error procesando Excel:', error)
        alert('Error procesando el archivo Excel. Verifique el formato.')
      } finally {
        setIsLoading(false)
      }
    }
    
    reader.readAsArrayBuffer(file)
  }, [])

  // Función para agrupar datos por localidad
  const agruparPorLocalidad = (focoData: FocoData[]): LocalidadGroup[] => {
    const grouped: { [localidad: string]: LocalidadGroup } = {}

    focoData.forEach(foco => {
      if (!foco.localidad || !foco.tipoWatts) return

      if (!grouped[foco.localidad]) {
        grouped[foco.localidad] = {
          localidad: foco.localidad,
          tipos: {},
          totalFocos: 0
        }
      }

      if (!grouped[foco.localidad].tipos[foco.tipoWatts]) {
        grouped[foco.localidad].tipos[foco.tipoWatts] = []
      }

      grouped[foco.localidad].tipos[foco.tipoWatts].push(foco)
      grouped[foco.localidad].totalFocos += foco.cantidad
    })

    return Object.values(grouped)
  }

  // Configuración de dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        procesarExcel(acceptedFiles[0])
      }
    }
  })

  // Función para expandir/colapsar localidad
  const toggleLocalidad = (localidad: string) => {
    const newExpanded = new Set(expandedLocalidades)
    if (newExpanded.has(localidad)) {
      newExpanded.delete(localidad)
    } else {
      newExpanded.add(localidad)
    }
    setExpandedLocalidades(newExpanded)
  }

  // Función para abrir modal
  const abrirModal = (localidad: string, tipoWatts: string, focos: FocoData[]) => {
    setModalData({ localidad, tipoWatts, focos })
  }

  // Función para cerrar modal
  const cerrarModal = () => {
    setModalData(null)
  }

  // Función para limpiar datos
  const limpiarDatos = () => {
    setDatos([])
    setExpandedLocalidades(new Set())
  }

  // Función para exportar datos
  const exportarDatos = () => {
    const exportData = datos.flatMap(localidad => 
      Object.entries(localidad.tipos).flatMap(([tipoWatts, focos]) =>
        focos.map(foco => ({
          Localidad: foco.localidad,
          Tipo_Watts: tipoWatts,
          Cantidad: foco.cantidad,
          Ubicacion: foco.detalles?.ubicacion || '',
          Estado: foco.detalles?.estado || '',
          Fecha_Instalacion: foco.detalles?.fechaInstalacion || ''
        }))
      )
    )

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos_Focos')
    XLSX.writeFile(workbook, 'luminarias_export.xlsx')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header con diseño negro elegante */}
      <div className="bg-black text-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Lightbulb className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Panel de Administración</h1>
                <p className="text-gray-300 mt-1">Gestión inteligente de luminarias públicas</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{datos.length}</div>
                  <div className="text-sm text-gray-300">Localidades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {datos.reduce((sum, loc) => sum + loc.totalFocos, 0)}
                  </div>
                  <div className="text-sm text-gray-300">Total Focos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {datos.reduce((sum, loc) => sum + Object.keys(loc.tipos).length, 0)}
                  </div>
                  <div className="text-sm text-gray-300">Tipos</div>
                </div>
              </div>
              
              {/* Botón de logout */}
              <button
                onClick={handleLogout}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors duration-200 flex items-center space-x-2"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5 text-white" />
                <span className="hidden sm:block text-white text-sm">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de navegación */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
            <div className="flex space-x-3">
              <Link 
                href="/form" 
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar Nueva Luminaria
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Área de subida con diseño blanco y negro */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 border-b">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Database className="mr-3 h-6 w-6" />
                Importar Datos de Luminarias
              </h2>
            </div>
            
            <div className="p-8">
              <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive 
                    ? 'border-gray-900 bg-gray-50 scale-105' 
                    : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto h-16 w-16 bg-black rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                  {isDragActive ? (
                    <div>
                      <p className="text-xl font-semibold text-gray-900 mb-2">
                        ¡Suelta el archivo aquí!
                      </p>
                      <p className="text-gray-600">
                        Procesaremos tu archivo Excel inmediatamente
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-semibold text-gray-900 mb-2">
                        Sube tu archivo Excel de luminarias
                      </p>
                      <p className="text-gray-600 mb-4">
                        Arrastra y suelta aquí, o haz clic para seleccionar
                      </p>
                      <div className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-all duration-200 hover:shadow-lg">
                        <FileSpreadsheet className="mr-2 h-5 w-5" />
                        Seleccionar Archivo
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Formatos soportados: .xlsx, .xls (máx. 10MB)
                  </p>
                </div>
              </div>

              {/* Controles con diseño blanco y negro */}
              {datos.length > 0 && (
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-black rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {datos.length} localidades cargadas
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 bg-gray-600 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {datos.reduce((sum, loc) => sum + loc.totalFocos, 0)} focos totales
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={exportarDatos}
                      className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors shadow-md hover:shadow-lg"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </button>
                    <button
                      onClick={limpiarDatos}
                      className="inline-flex items-center px-4 py-2 bg-white text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-colors shadow-md hover:shadow-lg"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading con diseño blanco y negro */}
        {isLoading && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6 text-black" />
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">Procesando archivo Excel</h3>
              <p className="mt-2 text-gray-600">Analizando datos y organizando por localidades...</p>
            </div>
          </div>
        )}

        {/* Tabla con diseño blanco y negro */}
        {datos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <BarChart3 className="mr-3 h-6 w-6" />
                Datos de Luminarias por Localidad
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Localidad
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Total Focos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tipos Disponibles
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {datos.map((localidadData, index) => (
                    <React.Fragment key={localidadData.localidad}>
                      {/* Fila principal de localidad */}
                      <tr className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleLocalidad(localidadData.localidad)}
                            className="flex items-center group"
                          >
                            <div className="mr-3 p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors border border-gray-300">
                              {expandedLocalidades.has(localidadData.localidad) ? (
                                <ChevronDown className="h-4 w-4 text-gray-700" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-700" />
                              )}
                            </div>
                            <div className="flex items-center">
                              <div className="mr-3 p-2 rounded-lg bg-black">
                                <MapPin className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {localidadData.localidad}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Zona #{index + 1}
                                </div>
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="text-lg font-bold text-gray-900">
                              {localidadData.totalFocos}
                            </div>
                            <div className="ml-2 text-sm text-gray-600">focos</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {Object.keys(localidadData.tipos).slice(0, 3).map((tipo) => (
                              <span
                                key={tipo}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300"
                              >
                                {tipo}
                              </span>
                            ))}
                            {Object.keys(localidadData.tipos).length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white">
                                +{Object.keys(localidadData.tipos).length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleLocalidad(localidadData.localidad)}
                            className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
                          >
                            {expandedLocalidades.has(localidadData.localidad) ? 'Colapsar' : 'Expandir'}
                          </button>
                        </td>
                      </tr>

                      {/* Filas expandidas de tipos de focos */}
                      {expandedLocalidades.has(localidadData.localidad) && (
                        <>
                          {Object.entries(localidadData.tipos).map(([watts, focos]) => {
                            const totalCantidad = focos.reduce((sum, foco) => sum + foco.cantidad, 0)
                            return (
                              <tr key={`${localidadData.localidad}-${watts}`} className="bg-gray-50 border-l-4 border-l-black">
                                <td className="pl-16 pr-6 py-3">
                                  <div className="flex items-center">
                                    <div className="mr-3 p-2 rounded-lg bg-gray-200 border border-gray-300">
                                      <Lightbulb className="h-4 w-4 text-gray-700" />
                                    </div>
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        Focos de {watts}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        Tipo de luminaria
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-3">
                                  <div className="flex items-center">
                                    <div className="text-lg font-bold text-gray-900">
                                      {totalCantidad}
                                    </div>
                                    <div className="ml-2 text-sm text-gray-600">unidades</div>
                                  </div>
                                </td>
                                <td className="px-6 py-3">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black text-white">
                                    {focos.length} registro(s)
                                  </span>
                                </td>
                                <td className="px-6 py-3">
                                  <button
                                    onClick={() => abrirModal(localidadData.localidad, watts, focos)}
                                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-black transition-colors"
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    Ver Detalle
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de detalles con diseño blanco y negro */}
        {modalData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl border-2 border-gray-200">
              {/* Header del modal negro */}
              <div className="bg-black px-6 py-6 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                      <Lightbulb className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Detalle de Luminarias</h3>
                      <p className="text-gray-300">
                        {modalData.localidad} • {modalData.tipoWatts}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={cerrarModal}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Estadísticas rápidas con diseño blanco y negro */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-black">
                      {modalData.focos.reduce((sum, foco) => sum + foco.cantidad, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total de focos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">
                      {modalData.focos.length}
                    </div>
                    <div className="text-sm text-gray-600">Registros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {modalData.tipoWatts}
                    </div>
                    <div className="text-sm text-gray-600">Tipo de foco</div>
                  </div>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6 overflow-y-auto max-h-[55vh]">
                <div className="grid gap-6">
                  {modalData.focos.map((foco, index) => (
                    <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow hover:border-gray-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-black rounded-lg">
                            <Lightbulb className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Registro #{index + 1}</h4>
                            <p className="text-sm text-gray-600">
                              {modalData.localidad} - {modalData.tipoWatts}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-black">
                            {foco.cantidad}
                          </div>
                          <div className="text-sm text-gray-600">focos</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Ubicación
                          </label>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-900">
                              {foco.detalles?.ubicacion || 'No especificada'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Estado
                          </label>
                          <div className="flex items-center space-x-2">
                            <div className={`h-3 w-3 rounded-full ${
                              foco.detalles?.estado === 'Activo' ? 'bg-black' : 
                              foco.detalles?.estado === 'Inactivo' ? 'bg-gray-400' : 'bg-gray-300'
                            }`}></div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                              foco.detalles?.estado === 'Activo' ? 'bg-black text-white border-black' : 
                              foco.detalles?.estado === 'Inactivo' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-gray-50 text-gray-600 border-gray-200'
                            }`}>
                              {foco.detalles?.estado || 'N/A'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Fecha Instalación
                          </label>
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4 text-gray-600" />
                            <p className="text-sm font-medium text-gray-900">
                              {foco.detalles?.fechaInstalacion || 'No registrada'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer del modal */}
              <div className="flex justify-between items-center p-6 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Mostrando {modalData.focos.length} registro(s) de {modalData.localidad}
                </div>
                <button
                  onClick={cerrarModal}
                  className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
