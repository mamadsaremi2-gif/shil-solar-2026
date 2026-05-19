import React from "react";
import Select from "react-select";

export default function SHILSelect() {

  return (

    <Select
      options={[
        {
          value: "ongrid",
          label: "آنگرید",
        },

        {
          value: "hybrid",
          label: "هیبرید",
        },

        {
          value: "offgrid",
          label: "آفگرید",
        },
      ]}
    />

  );
}
