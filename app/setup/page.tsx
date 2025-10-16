import CreateAdminAccount from '@/components/CreateAdminAccount'
import { Lightbulb, Settings } from 'lucide-react'
import Link from 'next/link'

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-black rounded-lg">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LumiXMI Setup</h1>
                <p className="text-sm text-gray-500">Configuración inicial del sistema</p>
              </div>
            </div>
            <Link 
              href="/login"
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Volver al Login
            </Link>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-100 rounded-2xl">
              <Settings className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Configuración Inicial
          </h1>
          <p className="text-lg text-gray-600">
            Crea la cuenta de administrador para comenzar a usar LumiXMI
          </p>
        </div>

        <CreateAdminAccount />

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Una vez creada la cuenta, podrás acceder al{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              panel de login
            </Link>
            {' '}con las credenciales generadas.
          </p>
        </div>
      </div>
    </div>
  )
}