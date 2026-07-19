# CacaoOS – Módulo de Compras (MOD-001)

Aplicación MVP para digitalizar el proceso de compra de cacao húmedo en centros de acopio.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** – UI mobile-first
- **Supabase** – PostgreSQL, sync en la nube
- **localStorage** – modo offline/demo sin Supabase

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

La app funciona **sin Supabase** usando almacenamiento local con datos de demostración.

## Configurar Supabase (producción)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia `.env.local.example` → `.env.local` y completa las credenciales
3. Ejecuta la migración en el SQL Editor:

```bash
# Contenido de supabase/migrations/001_initial_schema.sql
```

## Estructura

```
src/
├── app/
│   ├── page.tsx              # Dashboard diario (KPIs)
│   ├── compras/
│   │   ├── page.tsx          # Historial del día
│   │   └── nueva/page.tsx    # Flujo de compra (wizard)
│   ├── caja/page.tsx         # Apertura de caja
│   └── productores/page.tsx  # Listado de productores
├── components/               # UI reutilizable
└── lib/
    ├── services/compras.ts   # Lógica de negocio
    ├── offline/store.ts      # Cola de sync offline
    ├── supabase/client.ts    # Cliente Supabase
    └── types/database.ts     # Tipos y utilidades
```

## Flujo de compra

1. **Productor** – búsqueda o registro inline (EX-001)
2. **Datos** – peso, calidad, humedad, tipo, precio
3. **Pago** – confirmación → descuento automático en caja

## Reglas de negocio implementadas

| Regla | Descripción |
|-------|-------------|
| BR-001 | Productor debe existir antes de comprar |
| BR-004 | Total = Peso × Precio (automático) |
| BR-005 | Una compra = un movimiento de caja |
| BR-006/007 | Pago inmediato en efectivo |
| BR-008/009 | Precio sugerido + precio aplicado |
| BR-010 | Anulación con motivo (no eliminación) |

## Scripts

```bash
npm run dev        # Servidor de desarrollo
npm run build      # Build de producción
npm run typecheck  # Verificación de tipos
npm run lint       # ESLint
```

## Spec

Ver [MOD-001-COMPRAS.md](./MOD-001-COMPRAS.md) para la especificación completa.
