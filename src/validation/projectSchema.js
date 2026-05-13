import { z } from "zod";

export const projectSchema =
  z.object({

    projectName:
      z.string().min(2),

    city:
      z.string().min(2),

    clientName:
      z.string().min(2),

  });
