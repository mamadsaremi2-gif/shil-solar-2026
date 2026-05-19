import { z } from "zod";

export const projectSchema = z.object({

  projectName:
    z.string()
      .min(3, "حداقل ۳ کاراکتر"),

  clientName:
    z.string()
      .min(2, "نام کارفرما الزامی است"),

  city:
    z.string()
      .min(2, "شهر پروژه الزامی است"),

  projectType:
    z.string()
      .min(1, "نوع پروژه انتخاب نشده"),

  dailyEnergy:
    z.coerce.number()
      .min(1, "مصرف نامعتبر"),

  peakLoad:
    z.coerce.number()
      .min(1, "توان نامعتبر"),

  batteryVoltage:
    z.string(),

  backupHours:
    z.coerce.number()
      .min(1),

  notes:
    z.string()
      .optional(),

});
