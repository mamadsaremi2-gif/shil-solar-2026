import React from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import Select from "react-select";

import {
  projectSchema,
} from "./projectSchema";

import FormSection from "./FormSection.jsx";
import InputField from "./InputField.jsx";
import FormStatusCard from "./FormStatusCard.jsx";

const options = [

  {
    value: "solar",
    label: "خورشیدی",
  },

  {
    value: "hybrid",
    label: "هیبرید",
  },

  {
    value: "backup",
    label: "برق اضطراری",
  },

];

export default function AdvancedProjectForm() {

  const {

    register,
    handleSubmit,
    setValue,
    formState: {
      errors,
    },

  } = useForm({

    resolver:
      zodResolver(projectSchema),

  });

  const onSubmit = (data) => {

    console.log(data);

  };

  return (

    <form
      className="advanced-form-v15"
      onSubmit={handleSubmit(onSubmit)}
    >

      <div className="advanced-form-status-grid-v15">

        <FormStatusCard
          title="Validation"
          value="ACTIVE"
          status="success"
        />

        <FormStatusCard
          title="Schema"
          value="ZOD"
          status="primary"
        />

        <FormStatusCard
          title="Inputs"
          value="READY"
          status="warning"
        />

        <FormStatusCard
          title="Realtime"
          value="SYNC"
          status="success"
        />

      </div>

      <FormSection
        title="اطلاعات پروژه"
        subtitle="Project Information"
      >

        <InputField
          label="نام پروژه"
          error={errors.projectName?.message}
        >

          <input
            {...register("projectName")}
            placeholder="مثلاً نیروگاه خورشیدی"
          />

        </InputField>

        <InputField
          label="نام کارفرما"
          error={errors.clientName?.message}
        >

          <input
            {...register("clientName")}
            placeholder="نام شخص یا شرکت"
          />

        </InputField>

        <InputField
          label="شهر پروژه"
          error={errors.city?.message}
        >

          <input
            {...register("city")}
            placeholder="مثلاً شیراز"
          />

        </InputField>

        <InputField
          label="نوع پروژه"
          error={errors.projectType?.message}
        >

          <Select
            options={options}
            onChange={(value) => {
              setValue(
                "projectType",
                value?.value
              );
            }}
          />

        </InputField>

      </FormSection>

      <FormSection
        title="پارامترهای انرژی"
        subtitle="Energy Parameters"
      >

        <InputField
          label="مصرف روزانه"
          error={errors.dailyEnergy?.message}
        >

          <input
            type="number"
            {...register("dailyEnergy")}
            placeholder="kWh/day"
          />

        </InputField>

        <InputField
          label="توان لحظه‌ای"
          error={errors.peakLoad?.message}
        >

          <input
            type="number"
            {...register("peakLoad")}
            placeholder="Watt"
          />

        </InputField>

        <InputField
          label="ولتاژ باتری"
        >

          <select
            {...register("batteryVoltage")}
          >

            <option value="12V">
              12V
            </option>

            <option value="24V">
              24V
            </option>

            <option value="48V">
              48V
            </option>

          </select>

        </InputField>

        <InputField
          label="ساعات بکاپ"
          error={errors.backupHours?.message}
        >

          <input
            type="number"
            {...register("backupHours")}
            placeholder="Hours"
          />

        </InputField>

      </FormSection>

      <FormSection
        title="توضیحات پروژه"
        subtitle="Technical Notes"
      >

        <InputField
          label="یادداشت فنی"
        >

          <textarea
            rows="6"
            {...register("notes")}
            placeholder="شرایط پروژه..."
          />

        </InputField>

      </FormSection>

      <button
        type="submit"
        className="advanced-submit-v15"
      >

        ذخیره و اعتبارسنجی فرم

      </button>

    </form>

  );
}
