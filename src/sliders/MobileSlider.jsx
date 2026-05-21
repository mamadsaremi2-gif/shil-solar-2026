import React from "react";
import { Swiper, SwiperSlide }
from "swiper/react";

import "swiper/css";

export default function MobileSlider({
  slides = [],
}) {

  return (

    <Swiper
      spaceBetween={12}
      slidesPerView={1.1}
    >

      {slides.map((slide) => (

        <SwiperSlide key={slide.id}>

          <div className="mobile-slide-v15">
            {slide.title}
          </div>

        </SwiperSlide>

      ))}

    </Swiper>
  );
}
