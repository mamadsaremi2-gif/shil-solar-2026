import React from "react";
import InputMask from "react-input-mask";

export default function PhoneMask() {

  return (

    <InputMask
      mask="0999-999-9999"
    >

      {(inputProps) => (

        <input
          {...inputProps}
          className="mask-input-v15"
          placeholder="شماره تماس"
        />

      )}

    </InputMask>

  );
}
