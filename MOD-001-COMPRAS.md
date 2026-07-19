# MOD-001 – Módulo de Compras de Cacao (MVP)

**Código:** MOD-001
**Nombre:** Compras de Cacao
**Versión:** 1.0
**Estado:** Aprobado para Desarrollo MVP
**Dependencias:** Productores, Caja Operativa, Lista de Precios Semanal

---

# 1. Objetivo del módulo

El módulo de Compras es el núcleo operativo del MVP de CacaoOS.

Su propósito es digitalizar completamente el proceso mediante el cual un productor entrega cacao húmedo al centro de acopio, el comprador evalúa el producto, determina el precio aplicable, realiza el pago y registra la transacción.

El sistema debe reemplazar el cuaderno físico utilizado actualmente, manteniendo exactamente la misma forma de trabajo del comprador.

El éxito del módulo consiste en que el comprador pueda realizar todas las compras del día únicamente desde la aplicación, sin volver a utilizar registros manuales.

---

# 2. Objetivos específicos

El módulo debe permitir:

* Registrar compras en menos de 30 segundos.
* Reducir errores de cálculo.
* Mantener un historial completo de compras.
* Actualizar automáticamente la caja operativa.
* Mantener trazabilidad de cada productor.
* Funcionar aun cuando no exista conexión a Internet.
* Sincronizar automáticamente con Supabase cuando la conexión sea restablecida.

---

# 3. Alcance del MVP

## Incluye

* Búsqueda de productor.
* Registro rápido de productor nuevo.
* Selección del tipo de cacao.
* Registro del peso.
* Evaluación del cacao.
* Aplicación automática del precio semanal.
* Modificación manual del precio por negociación.
* Cálculo automático del total.
* Confirmación del pago.
* Registro automático del movimiento de caja.
* Historial de compras.
* Dashboard diario.

## Fuera del alcance

* Fermentación.
* Secado.
* Inventario.
* Transporte.
* Venta.
* Facturación electrónica.
* Integración con balanzas digitales.

---

# 4. Actores

## Comprador

Responsable de:

* atender productores
* evaluar cacao
* negociar precio
* registrar compras
* pagar al productor

Permisos:

* crear compras
* editar compras antes del cierre diario
* anular compras con justificación
* registrar productores
* consultar historial

---

## Productor

Persona que vende cacao al centro de acopio.

Información mínima requerida:

* Nombre
* Comunidad
* Caserío
* Tipo principal de cacao

Información opcional:

* DNI
* Teléfono
* Hectáreas
* Observaciones

---

## Ayudantes

No interactúan con el sistema durante el MVP.

Participan únicamente en:

* descarga
* pesaje
* traslado de sacos

---

# 5. Flujo operativo

## Flujo principal

1. El productor llega al centro de acopio.
2. Los ayudantes descargan los sacos.
3. El comprador identifica al productor.
4. Si el productor no existe, se registra inmediatamente.
5. El cacao se pesa.
6. El comprador evalúa:

   * calidad
   * humedad
   * tipo de cacao
7. El sistema muestra el precio semanal vigente.
8. El comprador puede aceptar el precio o modificarlo.
9. El sistema calcula automáticamente el total.
10. El comprador paga en efectivo.
11. El sistema registra la compra.
12. El sistema descuenta automáticamente el monto de la caja operativa.
13. El cacao pasa a bolsas de urea.
14. Los sacos son devueltos o queda registrada una deuda de sacos (Backlog).
15. La compra queda en estado **COMPLETADA**.

---

# 6. Reglas de negocio

## BR-001

Todo productor debe existir antes de registrar una compra.

---

## BR-002

El peso debe ser mayor que cero.

---

## BR-003

El precio aplicado debe ser mayor que cero.

---

## BR-004

El total de la compra siempre será:

Total = Peso × Precio Aplicado

No puede modificarse manualmente.

---

## BR-005

Toda compra genera exactamente un movimiento de caja.

---

## BR-006

El pago es inmediato.

No existen compras a crédito durante el MVP.

---

## BR-007

El único medio de pago permitido es efectivo.

---

## BR-008

El precio sugerido proviene de la Lista de Precios Semanal.

---

## BR-009

El comprador puede modificar el precio cuando negocie con un productor.

Debe almacenarse tanto el precio sugerido como el precio finalmente aplicado.

---

## BR-010

Una compra completada no puede eliminarse.

Solo puede anularse dejando registrada la causa.

---

# 7. Estados de una compra

```text
BORRADOR
    │
    ▼
PENDIENTE DE PAGO
    │
    ▼
COMPLETADA
```

Estado alternativo:

```text
COMPLETADA
      │
      ▼
ANULADA
```

Nunca puede volver al estado anterior.

---

# 8. Modelo de datos

## Productor

| Campo         | Tipo      | Obligatorio |
| ------------- | --------- | ----------- |
| id            | UUID      | Sí          |
| nombre        | Texto     | Sí          |
| comunidad     | Texto     | Sí          |
| caserio       | Texto     | Sí          |
| tipo_cacao    | Enum      | Sí          |
| telefono      | Texto     | No          |
| hectareas     | Decimal   | No          |
| observaciones | Texto     | No          |
| created_at    | Timestamp | Sí          |

---

## Compra

| Campo           | Tipo    |
| --------------- | ------- |
| id              | UUID    |
| productor_id    | UUID    |
| fecha           | Date    |
| hora            | Time    |
| peso            | Decimal |
| calidad         | Enum    |
| tipo_cacao      | Enum    |
| precio_sugerido | Decimal |
| precio_aplicado | Decimal |
| total           | Decimal |
| observaciones   | Texto   |
| estado          | Enum    |

---

## Movimiento de Caja

| Campo     | Tipo      |
| --------- | --------- |
| id        | UUID      |
| compra_id | UUID      |
| tipo      | Compra    |
| monto     | Decimal   |
| fecha     | Timestamp |

---

# 9. Validaciones

El sistema no permitirá:

* pesos negativos
* pesos iguales a cero
* precio negativo
* productor inexistente
* compra sin caja abierta
* compra sin total
* compra duplicada en el mismo envío del formulario

---

# 10. Casos excepcionales

## EX-001

El productor llega sin estar registrado.

Resultado esperado:

Registrar productor y continuar la compra sin abandonar el flujo.

---

## EX-002

El comprador digitó mal el peso.

Resultado esperado:

Puede corregir mientras la compra esté en borrador.

---

## EX-003

El comprador pagó un monto incorrecto.

Resultado esperado:

Registrar corrección mediante anulación y nueva compra.

Nunca editar el monto pagado directamente.

---

## EX-004

No hay Internet.

Resultado esperado:

La compra se almacena localmente y queda pendiente de sincronización.

---

## EX-005

No hay energía eléctrica.

Resultado esperado:

El sistema debe seguir funcionando desde el dispositivo con batería.

---

## EX-006

Se rompe la balanza.

Resultado esperado:

No registrar compras hasta contar con un peso válido.

---

## EX-007

El productor llega dos veces en el mismo día.

Resultado esperado:

Permitir múltiples compras del mismo productor en el mismo día, registrándolas como operaciones independientes.

---

# 11. Historias de usuario

**US-001** Como comprador quiero buscar un productor rápidamente para iniciar una compra.

**US-002** Como comprador quiero registrar un productor nuevo sin abandonar el flujo de compra.

**US-003** Como comprador quiero ingresar el peso y que el sistema calcule automáticamente el total.

**US-004** Como comprador quiero modificar el precio cuando exista una negociación excepcional.

**US-005** Como comprador quiero registrar el pago para que la caja se actualice automáticamente.

**US-006** Como administrador quiero consultar el historial de compras por productor.

---

# 12. Criterios de aceptación

* Registrar una compra completa en menos de 30 segundos.
* El cálculo del total debe ser automático y exacto.
* La caja operativa debe actualizarse inmediatamente.
* Todas las compras deben quedar registradas aun sin conexión.
* Al recuperar Internet, las compras pendientes deben sincronizarse con Supabase sin duplicados.

---

# 13. KPIs del módulo

* Kilogramos comprados hoy.
* Número de productores atendidos.
* Total pagado.
* Precio promedio por kilogramo.
* Compras por tipo de cacao.
* Compras por comunidad.
* Compras por comprador.
* Tiempo promedio por compra.

---

# 14. Definición de Terminado (Definition of Done)

El módulo se considerará terminado cuando:

1. Sea posible registrar una compra completa desde un dispositivo móvil.
2. La compra actualice automáticamente la caja.
3. El sistema funcione sin conexión.
4. Las compras se sincronicen correctamente con Supabase.
5. Existan pruebas para el flujo principal y para los casos excepcionales documentados.
6. El comprador pueda operar toda una jornada sin necesidad del cuaderno físico.

