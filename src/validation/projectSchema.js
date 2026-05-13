import { z } from "zod";

export const projectSchema = z.object({
  projectName: z.string().min(2, "نام پروژه الزامی است"),
  clientName: z.string().min(2, "نام کارفرما الزامی است"),
  city: z.string().min(2, "شهر پروژه الزامی است"),
});
