import React,
{
  useState
} from "react";

import Calendar
from "react-calendar";

import "react-calendar/dist/Calendar.css";

export default function SHILCalendar() {

  const [value, setValue] =
    useState(new Date());

  return (

    <div className="calendar-v15">

      <Calendar
        onChange={setValue}
        value={value}
      />

    </div>

  );
}
