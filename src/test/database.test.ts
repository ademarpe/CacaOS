import { describe, it, expect } from "vitest";
import {
  calcularTotal,
  getSemanaInicio,
  formatMoney,
  formatKg,
} from "@/lib/types/database";

describe("calcularTotal", () => {
  it("calcula peso x precio correctamente", () => {
    expect(calcularTotal(10, 8.5)).toBe(85);
  });

  it("redondea a 2 decimales", () => {
    expect(calcularTotal(3.333, 2.5)).toBe(8.33);
  });

  it("retorna 0 cuando peso es 0", () => {
    expect(calcularTotal(0, 8.5)).toBe(0);
  });

  it("retorna 0 cuando precio es 0", () => {
    expect(calcularTotal(10, 0)).toBe(0);
  });
});

describe("getSemanaInicio", () => {
  it("retorna el lunes de la semana actual", () => {
    const result = getSemanaInicio(new Date("2026-07-16"));
    expect(result).toBe("2026-07-13");
  });

  it("retorna lunes cuando el día es lunes", () => {
    const result = getSemanaInicio(new Date("2026-07-13"));
    expect(result).toBe("2026-07-13");
  });

  it("retorna lunes cuando el día es domingo", () => {
    const result = getSemanaInicio(new Date("2026-07-19"));
    expect(result).toBe("2026-07-13");
  });
});

describe("formatMoney", () => {
  it("formatea en soles peruanos", () => {
    const result = formatMoney(85);
    expect(result).toContain("85");
    expect(result).toContain("S/");
  });

  it("formatea cero", () => {
    const result = formatMoney(0);
    expect(result).toContain("0");
  });
});

describe("formatKg", () => {
  it("formatea kilogramos", () => {
    expect(formatKg(10.5)).toBe("10.50 kg");
  });

  it("formatea cero", () => {
    expect(formatKg(0)).toBe("0.00 kg");
  });
});
