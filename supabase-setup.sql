-- =====================================================
-- LUMIXMI - Base de datos para gestión de luminarias
-- Ixmiquilpan, Hidalgo
-- =====================================================

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS luminarias CASCADE;
DROP TABLE IF EXISTS colonias CASCADE;

-- =====================================================
-- TABLA: colonias
-- =====================================================
CREATE TABLE colonias (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: luminarias
-- =====================================================
CREATE TABLE luminarias (
  id BIGSERIAL PRIMARY KEY,
  colonia_id BIGINT REFERENCES colonias(id) ON DELETE SET NULL,
  numero_poste TEXT NOT NULL,
  watts INTEGER NOT NULL CHECK (watts IN (25, 40, 80)),
  latitud DOUBLE PRECISION NOT NULL,
  longitud DOUBLE PRECISION NOT NULL,
  imagen_url TEXT,
  imagen_watts_url TEXT,
  imagen_fotocelda_url TEXT,
  fotocelda_nueva BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para mejorar rendimiento
-- =====================================================
CREATE INDEX idx_luminarias_colonia ON luminarias(colonia_id);
CREATE INDEX idx_luminarias_coords ON luminarias(latitud, longitud);

-- =====================================================
-- TRIGGER para actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_luminarias_updated_at
  BEFORE UPDATE ON luminarias
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Habilitar Row Level Security
ALTER TABLE colonias ENABLE ROW LEVEL SECURITY;
ALTER TABLE luminarias ENABLE ROW LEVEL SECURITY;

-- COLONIAS: Lectura pública (para el select del formulario)
CREATE POLICY "Permitir lectura pública de colonias"
  ON colonias
  FOR SELECT
  TO public
  USING (true);

-- LUMINARIAS: Inserción pública (para envío del formulario sin auth)
CREATE POLICY "Permitir inserción pública de luminarias"
  ON luminarias
  FOR INSERT
  TO public
  WITH CHECK (true);

-- LUMINARIAS: Lectura pública (para el mapa/admin)
CREATE POLICY "Permitir lectura pública de luminarias"
  ON luminarias
  FOR SELECT
  TO public
  USING (true);

-- LUMINARIAS: Actualización solo para usuarios autenticados (admin futuro)
CREATE POLICY "Permitir actualización para usuarios autenticados"
  ON luminarias
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- LUMINARIAS: Eliminación solo para usuarios autenticados (admin futuro)
CREATE POLICY "Permitir eliminación para usuarios autenticados"
  ON luminarias
  FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- DATOS INICIALES: Colonias de Ixmiquilpan, Hidalgo
-- =====================================================

INSERT INTO colonias (nombre) VALUES
  ('Centro'),
  ('El Fitzhi'),
  ('Benito Juárez'),
  ('San Nicolás'),
  ('La Estación'),
  ('Los Álamos'),
  ('El Carmen'),
  ('Santa Teresa'),
  ('El Tephé'),
  ('Progreso'),
  ('San Antonio'),
  ('Las Flores'),
  ('Pueblo Nuevo'),
  ('San Francisco'),
  ('Taxadho'),
  ('Maguey Blanco'),
  ('Panales Jamaica'),
  ('El Daxtha'),
  ('Bomintzhá'),
  ('Cañada Chica'),
  ('Cañada Grande'),
  ('El Nith'),
  ('San Javier'),
  ('Atengo'),
  ('Dios Padre'),
  ('La Cruz'),
  ('Bangandhó'),
  ('El Olivo'),
  ('Vicente Guerrero'),
  ('Emiliano Zapata');

-- =====================================================
-- FUNCIONES AUXILIARES (Opcional)
-- =====================================================

-- Función para obtener el total de luminarias por colonia
CREATE OR REPLACE FUNCTION luminarias_por_colonia()
RETURNS TABLE (
  colonia_nombre TEXT,
  total_luminarias BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.nombre as colonia_nombre,
    COUNT(l.id) as total_luminarias
  FROM colonias c
  LEFT JOIN luminarias l ON c.id = l.colonia_id
  GROUP BY c.nombre
  ORDER BY total_luminarias DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 
-- 1. Las políticas RLS permiten:
--    - Lectura pública de colonias (para el select)
--    - Inserción pública de luminarias (para el formulario)
--    - Lectura pública de luminarias (para visualización)
--    - Actualización/eliminación solo con autenticación (admin futuro)
--
-- 2. Para ejecutar este script:
--    - Ve a Supabase Dashboard > SQL Editor
--    - Copia y pega todo este código
--    - Ejecuta "Run"
--
-- 3. Para storage de imágenes (próximos pasos):
--    - Crear bucket público llamado "luminarias"
--    - Configurar políticas de subida
--
-- =====================================================
