import React from "react";
import { Swiper, SwiperSlide }
from "swiper/react";

import "swiper/css";

export default function MobileCards({
  items = [],
}) {

  return (

    <Swiper
      slidesPerView={1.12}
      spaceBetween={12}
    >

      {items.map((item) => (

        <SwiperSlide key={item.id}>

          <div className="mobile-card-v15">
            {item.title}
          </div>

        </SwiperSlide>

      ))}

    </Swiper>

  );
}
