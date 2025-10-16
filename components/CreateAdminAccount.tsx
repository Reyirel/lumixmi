'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { User, Shield, Check } from 'lucide-react'

export default function CreateAdminAccount() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const createAdmin = async () => {
    setLoading(true)
    setError('')
    
    const adminEmail = 'admin@lumixmi.com'
    const adminPassword = 'Admin123456'

    try {
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
      setSuccess(true)
      console.log('Cuenta de admin creada exitosamente')
      console.log(`Email: ${adminEmail}`)
      console.log(`Password: ${adminPassword}`)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'auth/email-already-in-use') {
        setError('La cuenta de admin ya existe')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        setError(`Error: ${errorMessage}`)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800">
            ¡Cuenta de Admin Creada!
          </h3>
        </div>
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Credenciales de acceso:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-600">Email:</span>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">admin@lumixmi.com</code>
            </div>
            <div>
              <span className="font-medium text-gray-600">Contraseña:</span>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">Admin123456</code>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Importante:</strong> Cambia la contraseña después del primer login por seguridad.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Crear Cuenta de Administrador
        </h3>
      </div>
      
      <p className="text-gray-600 mb-6">
        Crea una cuenta de administrador predeterminada para acceder al sistema.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Credenciales que se crearán:</h4>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">Email:</span>
            <code className="ml-2 bg-white px-2 py-1 rounded border">admin@lumixmi.com</code>
          </div>
          <div>
            <span className="font-medium text-gray-600">Contraseña:</span>
            <code className="ml-2 bg-white px-2 py-1 rounded border">Admin123456</code>
          </div>
        </div>
      </div>

      <button
        onClick={createAdmin}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Creando cuenta...</span>
          </>
        ) : (
          <>
            <User className="h-5 w-5" />
            <span>Crear Cuenta de Admin</span>
          </>
        )}
      </button>
    </div>
  )
}