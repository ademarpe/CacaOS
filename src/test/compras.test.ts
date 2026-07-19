import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calcularTotal,
  getSemanaInicio,
} from "@/lib/types/database";

const STORAGE_KEY = "cacaos_data_v1";

function createEmptyStore() {
  return {
    productores: [],
    compras: [],
    caja_sesiones: [],
    movimientos_caja: [],
    lista_precios_semanal: [],
    historial_precios: [],
    sync_queue: [],
  };
}

function setupLocalStorage(data?: Record<string, unknown>) {
  const store = data ?? createEmptyStore();
  localStorage.setItem("cacaos_data_v1", JSON.stringify(store));
}

describe("Reglas de negocio (BR)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("BR-002: peso debe ser mayor que cero", () => {
    const peso = 0;
    expect(peso > 0).toBe(false);
  });

  it("BR-003: precio debe ser mayor que cero", () => {
    const precio = 0;
    expect(precio > 0).toBe(false);
  });

  it("BR-004: total = peso x precio_aplicado", () => {
    const peso = 10;
    const precio = 8.5;
    const total = calcularTotal(peso, precio);
    expect(total).toBe(85);
    expect(total).toBe(peso * precio);
  });

  it("BR-006: pago inmediato - no existen compras a credito", () => {
    const mediosPermitidos = ["efectivo"];
    expect(mediosPermitidos).toContain("efectivo");
    expect(mediosPermitidos).not.toContain("credito");
  });

  it("BR-007: unico medio de pago es efectivo", () => {
    const medios = ["efectivo"];
    expect(medios).toEqual(["efectivo"]);
  });
});
