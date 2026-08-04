import { z } from "zod";

const carClassSchema = z.enum(["D", "C", "B", "A", "S1", "S2", "R", "X"]);

export const BACKUP_FORMAT = "forza-lap-tracker-backup" as const;

const manufacturerSchema = z.object({
  name: z.string().trim().min(1),
  icon_path: z.string().min(1),
  is_builtin: z.union([z.literal(0), z.literal(1)]),
});

const carSchema = z.object({
  manufacturer_name: z.string().trim().min(1),
  model: z.string().trim().min(1),
  is_builtin: z.union([z.literal(0), z.literal(1)]),
  image_url: z.string().nullable(),
});

const circuitSchema = z.object({
  name: z.string().trim().min(1),
  is_builtin: z.union([z.literal(0), z.literal(1)]),
});

const lapSchema = z.object({
  circuit_name: z.string().trim().min(1),
  manufacturer_name: z.string().trim().min(1),
  car_model: z.string().trim().min(1),
  pi: z.number().int().min(0).max(999),
  class: carClassSchema,
  time_ms: z.number().int().min(0),
  notes: z.string().nullable(),
  recorded_at: z.string().min(1),
});

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
});

const dataSchema = z.object({
  manufacturers: z.array(manufacturerSchema),
  cars: z.array(carSchema),
  circuits: z.array(circuitSchema),
  laps: z.array(lapSchema),
  settings: z.array(settingSchema),
});

export const backupFileSchema = z
  .object({
    format: z.literal(BACKUP_FORMAT),
    schemaVersion: z.literal(1),
    exportedAt: z.string().min(1),
    appVersion: z.string().min(1),
    data: dataSchema,
  })
  .strict()
  .superRefine((file, ctx) => {
    const mfg = new Set(file.data.manufacturers.map((m) => m.name));
    for (const [i, car] of file.data.cars.entries()) {
      if (!mfg.has(car.manufacturer_name)) {
        ctx.addIssue({
          code: "custom",
          message: `cars[${i}] unknown manufacturer`,
          path: ["data", "cars", i, "manufacturer_name"],
        });
      }
    }
    const carKeys = new Set(
      file.data.cars.map((c) => `${c.manufacturer_name}::${c.model}`),
    );
    const circuits = new Set(file.data.circuits.map((c) => c.name));
    for (const [i, lap] of file.data.laps.entries()) {
      if (!circuits.has(lap.circuit_name)) {
        ctx.addIssue({
          code: "custom",
          message: `laps[${i}] unknown circuit`,
          path: ["data", "laps", i, "circuit_name"],
        });
      }
      const ck = `${lap.manufacturer_name}::${lap.car_model}`;
      if (!carKeys.has(ck)) {
        ctx.addIssue({
          code: "custom",
          message: `laps[${i}] unknown car`,
          path: ["data", "laps", i, "car_model"],
        });
      }
    }
  });

export type BackupFileV1 = z.infer<typeof backupFileSchema>;

export function parseBackupJson(
  text: string,
): { ok: true; data: BackupFileV1 } | { ok: false; message: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, message: "invalid_json" };
  }
  const parsed = backupFileSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      message: first
        ? `${first.path.join(".")}: ${first.message}`
        : "invalid_schema",
    };
  }
  return { ok: true, data: parsed.data };
}
