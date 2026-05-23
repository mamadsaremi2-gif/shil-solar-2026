import React from "react";
import useEmblaCarousel
from "embla-carousel-react";

export default function SHILCarousel({
  children,
}) {

  const [emblaRef] =
    useEmblaCarousel({
      dragFree: true,
      align: "start",
    });

  return (

    <div
      className="embla-v15"
      ref={emblaRef}
    >

      <div className="embla-container-v15">
        {children}
      </div>

    </div>

  );
}
