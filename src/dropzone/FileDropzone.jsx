import React from "react";
import { useDropzone }
from "react-dropzone";

export default function FileDropzone() {

  const { getRootProps,
    getInputProps } =
    useDropzone();

  return (

    <div
      {...getRootProps()}
      className="dropzone-v15"
    >

      <input {...getInputProps()} />

      <p>
        ??????? ?? ????? ??? ????
      </p>

    </div>

  );
}
