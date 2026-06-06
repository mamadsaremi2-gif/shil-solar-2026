import React from "react";
import { Toaster } from "react-hot-toast";

export default function AppToaster() {

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
    />
  );
}
