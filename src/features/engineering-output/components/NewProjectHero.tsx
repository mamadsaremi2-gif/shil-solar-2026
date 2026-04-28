"use client";

import Image from "next/image";

export default function NewProjectHero() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-lg mb-6">

      {/* Background Image */}
      <Image
        src="/images/solar-hero.jpg"
        alt="SHIL Solar"
        width={1600}
        height={600}
        className="w-full h-[320px] md:h-[420px] object-cover"
        priority
      />

      {/* Overlay گرادیانت */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/60 to-transparent"></div>

      {/* لوگو بکگراند */}
      <div className="absolute top-10 right-10 opacity-20">
        <Image
          src="/images/shil-logo-purple.png"
          alt="SHIL"
          width={220}
          height={120}
        />
      </div>

      {/* متن */}
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12">

        <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-3">
          انرژی پاک ، <span className="text-green-600">آینده ای پایدار</span>
        </h1>

        <p className="text-sm md:text-base text-gray-600 max-w-xl mb-4">
          با محصولات باکیفیت SHIL سیستم خود را هوشمند، ایمن و بهینه طراحی کنید.
        </p>

        {/* ویژگی‌ها */}
        <div className="flex gap-4 flex-wrap text-xs md:text-sm">

          <div className="bg-white/80 px-3 py-2 rounded-lg shadow-sm">
            انرژی پاک
          </div>

          <div className="bg-white/80 px-3 py-2 rounded-lg shadow-sm">
            ایمنی بالا
          </div>

          <div className="bg-white/80 px-3 py-2 rounded-lg shadow-sm">
            عملکرد هوشمند
          </div>

          <div className="bg-white/80 px-3 py-2 rounded-lg shadow-sm">
            بازدهی بیشتر
          </div>

        </div>
      </div>
    </div>
  );
}