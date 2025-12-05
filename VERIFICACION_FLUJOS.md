# ✅ Checklist de Verificación de Flujos - Conektao

## Estado General
- ✅ Error de sintaxis corregido en `update-inventory-from-receipt` (DESPLEGADO)
- ✅ Triggers de base de datos configurados correctamente
- ✅ No hay errores recientes en logs de Postgres

---

## 🔴 PRIORIDAD ALTA (Flujos Críticos) - LISTOS PARA PRUEBAS

### 1. Procesamiento de Facturas con IA
| Paso | Verificar | Estado |
|------|-----------|--------|
| 1.1 | Subir imagen de factura en Inventario > Procesar Factura | ⬜ |
| 1.2 | IA extrae proveedor, items, totales correctamente | ⬜ |
| 1.3 | Confirmar actualización de inventario | ⬜ |
| 1.4 | Ingredientes se actualizan con precio promedio ponderado | ⬜ |
| 1.5 | Si se paga en efectivo, se registra en caja | ⬜ |
| 1.6 | Movimientos de ingredientes quedan registrados | ⬜ |

**Cómo probar:**
1. Ir a Inventario > Procesar Factura
2. Subir foto de factura de proveedor
3. Verificar extracción de datos
4. Confirmar y revisar stock de ingredientes

---

### 2. POS y Descuento de Inventario al Vender
| Paso | Verificar | Estado |
|------|-----------|--------|
| 2.1 | Crear venta desde facturación (seleccionar mesa) | ⬜ |
| 2.2 | Agregar productos al carrito | ⬜ |
| 2.3 | Procesar pago (efectivo/tarjeta/transferencia) | ⬜ |
| 2.4 | Venta se guarda en tabla `sales` | ⬜ |
| 2.5 | Items se guardan en `sale_items` | ⬜ |
| 2.6 | Trigger descuenta ingredientes automáticamente | ⬜ |
| 2.7 | Movimientos de ingredientes registrados (tipo OUT) | ⬜ |
| 2.8 | Mesa se libera después de la venta | ⬜ |

**Cómo probar:**
1. Ir a Facturación
2. Seleccionar una mesa
3. Agregar productos con receta/ingredientes
4. Completar pago
5. Verificar en Inventario que los ingredientes disminuyeron

---

## 🟡 PRIORIDAD MEDIA

### 3. Autenticación
| Paso | Verificar | Estado |
|------|-----------|--------|
| 3.1 | Registro de nuevo propietario | ⬜ |
| 3.2 | Login con email/password | ⬜ |
| 3.3 | Logout | ⬜ |
| 3.4 | Perfil se crea correctamente | ⬜ |

### 4. Gestión de Empleados
| Paso | Verificar | Estado |
|------|-----------|--------|
| 4.1 | Crear empleado | ⬜ |
| 4.2 | Registrar rostro para reconocimiento facial | ⬜ |
| 4.3 | Empleado marca entrada (geo + facial) | ⬜ |
| 4.4 | Empleado marca salida (geo + facial) | ⬜ |
| 4.5 | Registros aparecen en historial | ⬜ |

### 5. Gestión de Productos
| Paso | Verificar | Estado |
|------|-----------|--------|
| 5.1 | Crear producto nuevo | ⬜ |
| 5.2 | Asignar ingredientes/receta | ⬜ |
| 5.3 | Editar producto existente | ⬜ |
| 5.4 | Eliminar producto | ⬜ |
| 5.5 | Disponibilidad se calcula según stock | ⬜ |

### 6. Cocina
| Paso | Verificar | Estado |
|------|-----------|--------|
| 6.1 | Enviar comanda desde facturación | ⬜ |
| 6.2 | Comanda aparece en dashboard cocina | ⬜ |
| 6.3 | Marcar items como preparados | ⬜ |
| 6.4 | Completar orden | ⬜ |

### 7. Caja
| Paso | Verificar | Estado |
|------|-----------|--------|
| 7.1 | Abrir caja del día | ⬜ |
| 7.2 | Ventas en efectivo se registran | ⬜ |
| 7.3 | Cerrar caja | ⬜ |
| 7.4 | Diferencias calculadas correctamente | ⬜ |

---

## 🟢 PRIORIDAD BAJA

### 8. AI Conektao
| Paso | Verificar | Estado |
|------|-----------|--------|
| 8.1 | Abrir chat de asistente | ⬜ |
| 8.2 | Hacer preguntas sobre el negocio | ⬜ |
| 8.3 | Respuestas coherentes | ⬜ |

### 9. Reportes/Dashboard
| Paso | Verificar | Estado |
|------|-----------|--------|
| 9.1 | Métricas del dashboard cargan | ⬜ |
| 9.2 | Ventas diarias correctas | ⬜ |
| 9.3 | Gráficos muestran datos | ⬜ |

---

## ⚠️ Errores Conocidos Corregidos

1. **`update-inventory-from-receipt`**: Error de sintaxis con llaves extra (CORREGIDO ✅)

---

## 📋 Queries de Verificación Rápida

### Ver últimas ventas:
```sql
SELECT id, total_amount, payment_method, created_at 
FROM sales 
ORDER BY created_at DESC 
LIMIT 10;
```

### Ver movimientos de ingredientes recientes:
```sql
SELECT im.*, i.name as ingredient_name
FROM ingredient_movements im
JOIN ingredients i ON i.id = im.ingredient_id
ORDER BY im.created_at DESC
LIMIT 20;
```

### Ver stock actual de ingredientes:
```sql
SELECT name, current_stock, unit, cost_per_unit
FROM ingredients
WHERE is_active = true
ORDER BY name;
```
