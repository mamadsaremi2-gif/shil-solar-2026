"use client";

import NewProjectHero from "@/components/NewProjectHero";

export default function Page() {
  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* 🔥 Hero حرفه‌ای بالا */}
      <NewProjectHero />

      {/* 🧾 فرم پروژه */}
      <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">

        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          📋 اطلاعات پروژه
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* نام پروژه */}
          <input
            type="text"
            placeholder="نام پروژه (مثلاً: ویلا شمال)"
            className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          {/* نوع پروژه */}
          <select className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>انتخاب نوع پروژه</option>
            <option>آفگرید</option>
            <option>آنگرید</option>
            <option>هیبرید</option>
          </select>

          {/* موقعیت */}
          <select className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option>انتخاب استان</option>
            <option>تهران</option>
            <option>اصفهان</option>
            <option>مازندران</option>
          </select>

          {/* تاریخ */}
          <input
            type="date"
            className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

        </div>
      </div>

      {/* 👤 اطلاعات کاربر */}
      <div className="bg-white rounded-2xl shadow-md p-4 md:p-6">

        <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
          👤 اطلاعات کارفرما (بازدیدکننده)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <input
            type="text"
            placeholder="نام"
            className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="text"
            placeholder="شماره تماس"
            className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="text"
            placeholder="شهر"
            className="border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

        </div>
      </div>

      {/* ➕ ادامه فرم‌های اصلی خودت */}
      {/* اینجا هر چی تو پروژه خودت داری بذار */}
      {/* مثلاً مصرف، محاسبات، تنظیمات سیستم و ... */}

    </div>
  );
}import NewProjectHero from "@/components/NewProjectHero";<NewProjectHero />