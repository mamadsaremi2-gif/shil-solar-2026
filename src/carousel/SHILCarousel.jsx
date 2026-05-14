import React from "react";
import useEmblaCarousel from
  "embla-carousel-react";

export default function SHILCarousel({
  children,
}) {

  const [ref] =
    useEmblaCarousel({
      loop: false,
      align: "start",
    });

  return (

    <div
      className="embla-v15"
      ref={ref}
    >

      <div className="embla-container-v15">
        {children}
      </div>

    </div>
  );
}
