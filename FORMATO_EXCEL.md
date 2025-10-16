# Formato de Excel para Importar Datos de Luminarias

## Estructura Requerida

El archivo Excel debe contener las siguientes columnas (en cualquier orden):

### Columnas Obligatorias:
- **Localidad** o **localidad**: Nombre de la localidad
- **Tipo_Watts** o **tipo_watts** o **Watts**: Tipo de foco (ej: "20W", "40W", "60W")
- **Cantidad** o **cantidad**: Número de focos

### Columnas Opcionales:
- **Ubicacion** o **ubicacion**: Dirección o ubicación específica
- **Estado** o **estado**: Estado del foco (Activo, Inactivo, etc.)
- **Fecha_Instalacion** o **fecha_instalacion**: Fecha de instalación

## Ejemplo de Formato:

| Localidad | Tipo_Watts | Cantidad | Ubicacion | Estado | Fecha_Instalacion |
|-----------|------------|----------|-----------|--------|-------------------|
| San Antonio | 20W | 25 | Calle Principal | Activo | 2024-01-15 |
| San Antonio | 40W | 15 | Plaza Central | Activo | 2024-01-16 |
| Rosario | 20W | 30 | Av. Libertad | Activo | 2024-01-17 |
| Rosario | 60W | 10 | Centro | Activo | 2024-01-18 |

## Notas Importantes:

1. **Múltiples registros por localidad**: Puedes tener varias filas para la misma localidad con diferentes tipos de focos
2. **Flexibilidad en nombres**: El sistema reconoce tanto mayúsculas como minúsculas en los nombres de columnas
3. **Datos faltantes**: Los campos opcionales pueden estar vacíos
4. **Formato de archivo**: Compatible con .xlsx y .xls

## Funcionalidades del Sistema:

1. **Vista Jerárquica**: 
   - Localidades → Tipos de foco → Detalles
   - Expansión/contracción de localidades

2. **Modal de Detalles**: 
   - Click en tipo de foco para ver detalles completos
   - Información de ubicación, estado y fecha

3. **Gestión de Datos**:
   - Exportar datos procesados
   - Limpiar datos cargados
   - Contadores automáticos de totales

## Ejemplo de Uso:

1. Sube tu archivo Excel con el formato indicado
2. El sistema agrupará automáticamente por localidad
3. Click en localidad para expandir y ver tipos de focos
4. Click en tipo de foco para ver modal con detalles
5. Usa los botones de exportar/limpiar según necesites