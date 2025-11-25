import { NextResponse } from 'next/server'

// Placeholder endpoint - no implementado
export async function GET() {
  return NextResponse.json(
    { message: 'Endpoint no disponible' },
    { status: 501 }
  )
}
