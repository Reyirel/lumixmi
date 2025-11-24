"use client"

import { useEffect, useState } from 'react'

/**
 * Componente de debugging para producción
 * Muestra información sobre errores de red y respuestas de API
 * 
 * IMPORTANTE: Solo activar temporalmente para debugging
 * Comentar o remover antes del deploy final
 */

interface DebugLog {
  timestamp: string
  type: 'fetch' | 'error' | 'response'
  url: string
  status?: number
  contentType?: string
  preview?: string
  error?: string
}

export function ProductionDebugger() {
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Interceptar fetch para loguear todas las peticiones
    const originalFetch = window.fetch
    
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' 
        ? args[0] 
        : args[0] instanceof URL 
        ? args[0].href 
        : (args[0] as Request).url
      
      // Solo loguear peticiones a APIs internas
      if (!url.includes('/api/')) {
        return originalFetch(...args)
      }

      const timestamp = new Date().toLocaleTimeString()
      
      // Log de la petición
      setLogs(prev => [...prev, {
        timestamp,
        type: 'fetch',
        url,
      }])

      try {
        const response = await originalFetch(...args)
        const clonedResponse = response.clone()
        
        const contentType = response.headers.get('content-type') || 'unknown'
        
        // Intentar leer el preview
        let preview = ''
        try {
          const text = await clonedResponse.text()
          preview = text.substring(0, 200)
        } catch {
          preview = 'No se pudo leer'
        }

        // Log de la respuesta
        setLogs(prev => [...prev, {
          timestamp,
          type: 'response',
          url,
          status: response.status,
          contentType,
          preview,
        }])

        return response
      } catch (error) {
        // Log del error
        setLogs(prev => [...prev, {
          timestamp,
          type: 'error',
          url,
          error: error instanceof Error ? error.message : 'Error desconocido',
        }])
        
        throw error
      }
    }

    // Restaurar fetch original al desmontar
    return () => {
      window.fetch = originalFetch
    }
  }, [])

  // Shortcut para mostrar/ocultar: Ctrl+Shift+D
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded-full shadow-lg text-xs font-mono z-50 opacity-50 hover:opacity-100"
        title="Presiona Ctrl+Shift+D para abrir/cerrar"
      >
        DEBUG
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-auto p-4">
      <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">🐛 Production Debugger</h2>
          <div className="space-x-2">
            <button
              onClick={() => setLogs([])}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
            >
              Limpiar
            </button>
            <button
              onClick={() => {
                const logText = logs.map(log => 
                  `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.url}\n` +
                  (log.status ? `Status: ${log.status}\n` : '') +
                  (log.contentType ? `Content-Type: ${log.contentType}\n` : '') +
                  (log.preview ? `Preview: ${log.preview}\n` : '') +
                  (log.error ? `Error: ${log.error}\n` : '') +
                  '---\n'
                ).join('\n')
                
                navigator.clipboard.writeText(logText)
                alert('Logs copiados al portapapeles')
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            >
              Copiar Logs
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-400 mb-4">
          Total de logs: {logs.length} | Presiona Ctrl+Shift+D para ocultar
        </div>

        <div className="space-y-2 max-h-[80vh] overflow-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No hay logs aún. Usa la aplicación y verás las peticiones aquí.</p>
          ) : (
            logs.map((log, idx) => (
              <div
                key={idx}
                className={`p-3 rounded border-l-4 ${
                  log.type === 'error' 
                    ? 'bg-red-900 border-red-500' 
                    : log.type === 'fetch'
                    ? 'bg-blue-900 border-blue-500'
                    : log.status && log.status >= 200 && log.status < 300
                    ? 'bg-green-900 border-green-500'
                    : 'bg-yellow-900 border-yellow-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-white">
                    {log.type.toUpperCase()}
                  </span>
                  <span className="text-gray-400">{log.timestamp}</span>
                </div>
                
                <div className="mb-1">
                  <span className="text-blue-300">URL:</span> {log.url}
                </div>

                {log.status && (
                  <div className="mb-1">
                    <span className="text-blue-300">Status:</span>{' '}
                    <span className={log.status >= 200 && log.status < 300 ? 'text-green-400' : 'text-red-400'}>
                      {log.status}
                    </span>
                  </div>
                )}

                {log.contentType && (
                  <div className="mb-1">
                    <span className="text-blue-300">Content-Type:</span>{' '}
                    <span className={log.contentType.includes('json') ? 'text-green-400' : 'text-red-400'}>
                      {log.contentType}
                    </span>
                  </div>
                )}

                {log.preview && (
                  <div className="mt-2 bg-black bg-opacity-50 p-2 rounded overflow-auto max-h-32">
                    <span className="text-blue-300">Preview:</span>
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                      {log.preview}
                    </pre>
                  </div>
                )}

                {log.error && (
                  <div className="mt-2">
                    <span className="text-red-300">Error:</span> {log.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
