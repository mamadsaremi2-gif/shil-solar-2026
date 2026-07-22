import React from "react";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

export default function SHILDatePicker({
  selected,
  onChange,
}) {

  return (

    <DatePicker
      selected={selected}
      onChange={onChange}
      className="datepicker-v15"
    />

  );
}
