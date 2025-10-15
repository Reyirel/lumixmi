import { NextResponse } from 'next/server'

export async function GET() {
  // Simulamos datos que vendrían de una base de datos
  const colonias = [
    {
      id: 1,
      nombre: 'Colonia Centro',
      barrios: [
        { id: 1, nombre: 'Barrio A' },
        { id: 2, nombre: 'Barrio B' },
      ],
    },
    {
      id: 2,
      nombre: 'Colonia Norte',
      barrios: [
        { id: 3, nombre: 'Barrio C' },
        { id: 4, nombre: 'Barrio D' },
      ],
    },
    {
      id: 3,
      nombre: 'Colonia Sur',
      barrios: [
        { id: 5, nombre: 'Barrio E' },
        { id: 6, nombre: 'Barrio F' },
      ],
    },
  ]

  return NextResponse.json(colonias)
}
