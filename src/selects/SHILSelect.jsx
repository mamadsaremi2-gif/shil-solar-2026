import React from "react";
import Select from "react-select";

export default function SHILSelect() {

  return (

    <Select
      options={[
        {
          value: "ongrid",
          label: "??????",
        },

        {
          value: "hybrid",
          label: "??????",
        },

        {
          value: "offgrid",
          label: "??????",
        },
      ]}
    />

  );
}
