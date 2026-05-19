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
    label: "Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ",
  },

  {
    value: "hybrid",
    label: "Ù‡ÛŒØ¨Ø±ÛŒØ¯",
  },

  {
    value: "backup",
    label: "Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ",
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
        title="Ø§Ø·Ù„Ø§Ø¹Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡"
        subtitle="Project Information"
      >

        <InputField
          label="Ù†Ø§Ù… Ù¾Ø±ÙˆÚ˜Ù‡"
          error={errors.projectName?.message}
        >

          <input
            {...register("projectName")}
            placeholder="Ù…Ø«Ù„Ø§Ù‹ Ù†ÛŒØ±ÙˆÚ¯Ø§Ù‡ Ø®ÙˆØ±Ø´ÛŒØ¯ÛŒ"
          />

        </InputField>

        <InputField
          label="Ù†Ø§Ù… Ú©Ø§Ø±ÙØ±Ù…Ø§"
          error={errors.clientName?.message}
        >

          <input
            {...register("clientName")}
            placeholder="Ù†Ø§Ù… Ø´Ø®Øµ ÛŒØ§ Ø´Ø±Ú©Øª"
          />

        </InputField>

        <InputField
          label="Ø´Ù‡Ø± Ù¾Ø±ÙˆÚ˜Ù‡"
          error={errors.city?.message}
        >

          <input
            {...register("city")}
            placeholder="Ù…Ø«Ù„Ø§Ù‹ Ø´ÛŒØ±Ø§Ø²"
          />

        </InputField>

        <InputField
          label="Ù†ÙˆØ¹ Ù¾Ø±ÙˆÚ˜Ù‡"
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
        title="Ù¾Ø§Ø±Ø§Ù…ØªØ±Ù‡Ø§ÛŒ Ø§Ù†Ø±Ú˜ÛŒ"
        subtitle="Energy Parameters"
      >

        <InputField
          label="Ù…ØµØ±Ù Ø±ÙˆØ²Ø§Ù†Ù‡"
          error={errors.dailyEnergy?.message}
        >

          <input
            type="number"
            {...register("dailyEnergy")}
            placeholder="kWh/day"
          />

        </InputField>

        <InputField
          label="ØªÙˆØ§Ù† Ù„Ø­Ø¸Ù‡â€ŒØ§ÛŒ"
          error={errors.peakLoad?.message}
        >

          <input
            type="number"
            {...register("peakLoad")}
            placeholder="Watt"
          />

        </InputField>

        <InputField
          label="ÙˆÙ„ØªØ§Ú˜ Ø¨Ø§ØªØ±ÛŒ"
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
          label="Ø²Ù…Ø§Ù† Ø¨Ø±Ù‚ Ø§Ø¶Ø·Ø±Ø§Ø±ÛŒ Ù…ÙˆØ±Ø¯ Ù†ÛŒØ§Ø²"
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
        title="ØªÙˆØ¶ÛŒØ­Ø§Øª Ù¾Ø±ÙˆÚ˜Ù‡"
        subtitle="Technical Notes"
      >

        <InputField
          label="ÛŒØ§Ø¯Ø¯Ø§Ø´Øª ÙÙ†ÛŒ"
        >

          <textarea
            rows="6"
            {...register("notes")}
            placeholder="Ø´Ø±Ø§ÛŒØ· Ù¾Ø±ÙˆÚ˜Ù‡..."
          />

        </InputField>

      </FormSection>

      <button
        type="submit"
        className="advanced-submit-v15"
      >

        Ø°Ø®ÛŒØ±Ù‡ Ùˆ Ø§Ø¹ØªØ¨Ø§Ø±Ø³Ù†Ø¬ÛŒ ÙØ±Ù…

      </button>

    </form>

  );
}
