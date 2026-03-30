

# Plan: Insertar menú completo de Ricchezza en la base de datos

## Resumen
Insertar todos los productos del menú de Ricchezza (restaurant_id: `6eb5a2d6-11ed-42fa-b0a2-702f411f95ec`) en las tablas `categories` y `products`, siguiendo el patrón del restaurante de referencia donde cada tamaño de pizza es una categoría separada.

## Datos clave
- **Restaurant ID**: `6eb5a2d6-11ed-42fa-b0a2-702f411f95ec`
- **Owner/User ID**: `1ce0a025-5b21-4dbf-8118-161e1780202f`
- **Productos actuales**: 0 (tabla limpia)

## Categorías a crear (24 categorías)

| # | Categoría |
|---|-----------|
| 1 | Entradas |
| 2 | Pizzas Clásicas - Personal |
| 3 | Pizzas Clásicas - Mediana |
| 4 | Pizzas Clásicas - Grande |
| 5 | Pizzas Clásicas - Extragrande |
| 6 | Pizzas Especiales - Personal |
| 7 | Pizzas Especiales - Mediana |
| 8 | Pizzas Especiales - Grande |
| 9 | Pizzas Especiales - Extragrande |
| 10 | Pizzas Premium - Personal |
| 11 | Pizzas Premium - Mediana |
| 12 | Pizzas Premium - Grande |
| 13 | Pizzas Premium - Extragrande |
| 14 | Pizzas Supremas - Personal |
| 15 | Pizzas Supremas - Mediana |
| 16 | Pizzas Supremas - Grande |
| 17 | Pizzas Supremas - Extragrande |
| 18 | Pizzas Deluxe - Personal |
| 19 | Pizzas Deluxe - Mediana |
| 20 | Pizzas Deluxe - Grande |
| 21 | Pizzas Deluxe - Extragrande |
| 22 | Lasagnas |
| 23 | Espaguettis |
| 24 | Mazorcadas |
| 25 | Sándwiches |
| 26 | Hamburguesas |
| 27 | Salchipapas |
| 28 | Perros Calientes |
| 29 | Cortes y Asados |
| 30 | Combos |
| 31 | Jugos Naturales |
| 32 | Limonadas |
| 33 | Malteadas |
| 34 | Gaseosas y Agua |
| 35 | Cervezas |
| 36 | Postres |
| 37 | Adiciones |

## Productos por categoría (resumen)

### Entradas (10 productos)
Foster's Fries $21.600, Champiñones Gratinados $14.900, Especial $18.400, Severas Fries $39.600, Waffles de Pandebono $13.600, Nachos $15.600, Aros de Cebolla 180gr $5.200, Bruschettas $22.400, Patacones $15.600, Gratinar Nachos (adición) $5.800

### Pizzas Clásicas (6 sabores × 4 tamaños = 24 productos)
Sabores: Hawaiana, Queso con Bocadillo, Napolitana, Vegetariana, Margarita, Pepperoni
Precios: Personal $18.600 | Mediana $32.600 | Grande $51.900 | Extragrande $68.600

### Pizzas Especiales (8 sabores × 4 tamaños = 32 productos)
Sabores: Hawaiana con Tocineta, Campesina, Tropical, Pollo Champiñón, Extra Pepperoni Americano, Italiana, Montañera, Pepperoni
Precios: Personal $20.600 | Mediana $34.600 | Grande $55.600 | Extragrande $71.900

### Pizzas Premium (6 sabores × 4 tamaños = 24 productos)
Sabores: Colombiana, Carnes, Pollo BBQ, Pollo Champiñón Gourmet, Pollo Miel Mostaza
Precios: Personal $21.900 | Mediana $38.600 | Grande $61.600 | Extragrande $77.600

### Pizzas Supremas (6 sabores × 4 tamaños = 24 productos)
Sabores: Mexicana, House, Criolla, Barbacoa, Pork Loin
Precios: Personal $23.900 | Mediana $39.600 | Grande $64.600 | Extragrande $79.600

### Pizzas Deluxe (4 sabores × 4 tamaños = 16 productos + Mega Carnes solo Med/Gde/XG)
Sabores: Capricciosa, Pera Sweet, Pollo Carbonara, Mega Carnes
Precios: Personal $25.900 | Mediana $44.900 | Grande $68.900 | Extragrande $87.900

### Lasagnas (3 × 2 tamaños = 6 productos)
Mixta, Bolognesa, Pollo y Champiñón — 350gr $17.900 | 550gr $25.900

### Espaguettis (2 productos)
Napolitano $27.600, Pollo Cremoso y Tocineta $26.900

### Mazorcadas (2 productos)
Pollo Carne $24.900, Pollo/Lomo de Cerdo $24.600

### Sándwiches (3 productos)
Fusión $26.900, Pollo Gourmet $28.600, Pulled Pork BBQ $26.600

### Hamburguesas (14 productos)
Clásica $15.900, Especial $23.900, Doble $35.900, Pollo $23.900, De la Casa $30.600, Ranchera $29.600, Tropical Jam $27.900, Filet Mignon $30.900, Mixta $31.600, Full House $32.900, Crispy Chicken $26.900, Super Especial $32.900, Gratinada $30.900, De Mi Tierra $29.600

### Salchipapas (3 productos)
Clásica $11.400, Especial $18.400, Severas Fries $39.600

### Perros Calientes (4 productos)
Clásico $11.600, Americano $15.600, Americano Super Especial $27.900, Legendario $24.900

### Cortes y Asados (12 productos)
Churrasco $45.600, Churrasco Gratinado $51.600, Punta de Anca 200gr $27.900, Punta de Anca 400gr $44.600, Carne de la Casa 200gr $30.900, Carne de la Casa 400gr $49.900, Parrilla Mixta 1 $48.600, Parrilla Mixta 2 $46.900, Costillas de Cerdo $41.900, Costillas Gratinadas $45.600, Alitas Crocantes $26.900, Pechuga a la Plancha 200gr $22.600, Pechuga a la Plancha 380gr $34.900, Pechuga Gratinada 200gr $29.600, Pechuga Gratinada 380gr $40.600, Pechuga Gratinada con Champiñones 200gr $31.900, Pechuga Gratinada con Champiñones 380gr $44.900

### Combos (2 productos)
Combo Estándar $8.900, Combo Foster's $14.400

### Bebidas (Jugos, Limonadas, Malteadas, Gaseosas, Cervezas)

### Postres (1 producto)
Brownie con Helado $14.900

### Adiciones (~25 productos únicos, sin repetir)
Queso fundido 180gr $8.900, Aros de cebolla x3 $2.700, Huevos de codorniz x5 $2.400, Salchicha americana $4.900, Salchicha ranchera x2 $4.900, Salsa cheddar $6.900, Guacamole $4.200, Nuggets x4 $7.900, Pechuga trozos 200gr $9.600, Plátano maduro $5.200, Carne desmechada 100gr $8.900, Carne de hamburguesa 180gr $8.900, Gratinar hamburguesa 180gr queso $4.900, Tocineta premium x2 $6.900, Gratinar con cheddar 180gr $4.200, Mermelada de tocineta $7.900, Queso criollo asado $5.400, Queso crema $4.600, Porción papa francesa $6.200, Porción papa en casco $5.900, Queso adicional $5.200, Borde de queso o bocadillo (Med $4.900 / Gde $7.500 / XG $9.600), Porción ensalada $4.600, Hogao $4.400, Arepa $2.500, Chorizo o morcilla $3.900, Carne desmechada patacones $8.900, Michela $2.500

## Implementación técnica

1. **Crear todas las categorías** con INSERT en tabla `categories` (user_id, restaurant_id, name)
2. **Insertar todos los productos** con INSERT en tabla `products` referenciando las categorías recién creadas (name, price, description, category_id, user_id, restaurant_id, sku, is_active)
3. Se usará el `supabase--analytics_query` tool (INSERT) para ambas operaciones
4. Los SKU se generarán con prefijos por categoría (ENT-, PCL-, PES-, etc.)

**Total estimado: ~37 categorías, ~200+ productos**

