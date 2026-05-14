import * as yup from "yup";

export const projectSchema = yup.object({

  projectName:
    yup.string().required(),

  city:
    yup.string().required(),

  load:
    yup.number().required(),

});
