import React from "react";
import { useForm } from "react-hook-form";

export default function ProjectForm() {

  const {
    register,
    handleSubmit,
  } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (

    <form
      className="project-form-v15"
      onSubmit={handleSubmit(onSubmit)}
    >

      <input
        {...register("project")}
        placeholder="??? ?????"
      />

      <input
        {...register("city")}
        placeholder="???"
      />

      <button type="submit">
        ?????
      </button>

    </form>

  );
}
