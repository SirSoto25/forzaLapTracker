import type { CarClass } from "../domain/piClass";

export interface Manufacturer {
  id: number;
  name: string;
  icon_path: string;
  is_builtin: number;
}

export interface Car {
  id: number;
  manufacturer_id: number;
  model: string;
  is_builtin: number;
  image_path: string | null;
  image_url: string | null;
  created_at: string;
  manufacturer_name?: string;
  manufacturer_icon_path?: string;
}

export interface Circuit {
  id: number;
  name: string;
  is_builtin: number;
  created_at: string;
}

export interface Lap {
  id: number;
  circuit_id: number;
  car_id: number;
  pi: number;
  class: CarClass;
  time_ms: number;
  notes: string | null;
  recorded_at: string;
  circuit_name?: string;
  car_model?: string;
  manufacturer_name?: string;
}

export interface LapFilters {
  circuitId?: number;
  carId?: number;
  class?: CarClass;
  dateFrom?: string;
  dateTo?: string;
  sort?: "time" | "date";
}

export interface NewLap {
  circuitId: number;
  carId: number;
  pi: number;
  timeMs: number;
  notes?: string | null;
}
