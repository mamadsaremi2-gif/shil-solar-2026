export const EQUIPMENT_CATEGORIES = [
  { id: 'panel', title: 'پنل خورشیدی' },
  { id: 'battery', title: 'باتری' },
  { id: 'inverter', title: 'اینورتر' },
  { id: 'load', title: 'مصرف کننده' },
];

export const DEFAULT_EQUIPMENT_LIBRARY = [
  {
    id: 'load-led-lamp-12w', category: 'load', brand: 'عمومی', model: 'LED 12W', title: 'لامپ LED 12 وات', summary: 'روشنایی کم مصرف خانگی و اداری', specs: { name: 'لامپ LED', qty: 1, power: 12, hours: 6, powerFactor: 0.95, coincidenceFactor: 1, loadType: 'switching', surgeFactor: 1.1 },
  },
  {
    id: 'load-led-panel-60w', category: 'load', brand: 'عمومی', model: 'Panel 60W', title: 'پنل روشنایی LED 60 وات', summary: 'روشنایی سقفی پرتکرار', specs: { name: 'پنل روشنایی LED', qty: 1, power: 60, hours: 8, powerFactor: 0.95, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-tv-120w', category: 'load', brand: 'عمومی', model: 'TV 43-55', title: 'تلویزیون LED حدود 120 وات', summary: 'مصرف رایج تلویزیون خانگی', specs: { name: 'تلویزیون LED', qty: 1, power: 120, hours: 5, powerFactor: 0.9, coincidenceFactor: 0.8, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-fridge-250w', category: 'load', brand: 'عمومی', model: 'Refrigerator', title: 'یخچال خانگی 250 وات', summary: 'یخچال با کمپرسور؛ ضریب راه اندازی بالا', specs: { name: 'یخچال خانگی', qty: 1, power: 250, hours: 12, powerFactor: 0.82, coincidenceFactor: 0.55, loadType: 'motor', surgeFactor: 3.5 },
  },
  {
    id: 'load-freezer-300w', category: 'load', brand: 'عمومی', model: 'Freezer', title: 'فریزر 300 وات', summary: 'مصرف کننده موتوری برای خانه و فروشگاه', specs: { name: 'فریزر', qty: 1, power: 300, hours: 12, powerFactor: 0.82, coincidenceFactor: 0.55, loadType: 'motor', surgeFactor: 3.5 },
  },
  {
    id: 'load-water-pump-750w', category: 'load', brand: 'عمومی', model: '1HP Pump', title: 'پمپ آب 1 اسب حدود 750 وات', summary: 'پمپ خانگی یا کشاورزی سبک', specs: { name: 'پمپ آب 1 اسب', qty: 1, power: 750, hours: 2, powerFactor: 0.8, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-water-pump-1500w', category: 'load', brand: 'عمومی', model: '2HP Pump', title: 'پمپ آب 2 اسب حدود 1500 وات', summary: 'پمپ موتوری با جریان راه اندازی بالا', specs: { name: 'پمپ آب 2 اسب', qty: 1, power: 1500, hours: 2, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-split-12000-1200w', category: 'load', brand: 'عمومی', model: 'Split 12000', title: 'کولر گازی 12000 حدود 1200 وات', summary: 'بار سرمایشی پرتکرار؛ بهتر است اینورتر دار انتخاب شود', specs: { name: 'کولر گازی 12000', qty: 1, power: 1200, hours: 6, powerFactor: 0.85, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-computer-250w', category: 'load', brand: 'عمومی', model: 'Desktop PC', title: 'کامپیوتر رومیزی 250 وات', summary: 'بار اداری رایج', specs: { name: 'کامپیوتر رومیزی', qty: 1, power: 250, hours: 8, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-laptop-65w', category: 'load', brand: 'عمومی', model: 'Laptop', title: 'لپ تاپ 65 وات', summary: 'مصرف کننده اداری کم مصرف', specs: { name: 'لپ تاپ', qty: 1, power: 65, hours: 8, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.1 },
  },
  {
    id: 'load-router-camera-30w', category: 'load', brand: 'عمومی', model: 'Router/CCTV', title: 'مودم یا دوربین 30 وات', summary: 'تجهیزات مخابراتی و امنیتی دائم کار', specs: { name: 'مودم/دوربین', qty: 1, power: 30, hours: 24, powerFactor: 0.9, coincidenceFactor: 1, loadType: 'switching', surgeFactor: 1.1 },
  },
  {
    id: 'load-fan-80w', category: 'load', brand: 'عمومی', model: 'Fan', title: 'پنکه 80 وات', summary: 'بار موتوری سبک', specs: { name: 'پنکه', qty: 1, power: 80, hours: 8, powerFactor: 0.8, coincidenceFactor: 0.8, loadType: 'motor', surgeFactor: 2 },
  },

  // تجهیزات خانگی پرتکرار وارد شده از فایل اکسل کاربر
  {
    id: 'load-home-001', category: 'load', brand: 'خانگی', model: 'Home Appliance 01', title: 'کولر گازی ۱۲۰۰۰ - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۱۲۰۰۰', qty: 1, power: 1000, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-002', category: 'load', brand: 'خانگی', model: 'Home Appliance 02', title: 'کولر گازی ۱۸۰۰۰ - 1500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۱۸۰۰۰', qty: 1, power: 1500, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-003', category: 'load', brand: 'خانگی', model: 'Home Appliance 03', title: 'کولر گازی ۲۴۰۰۰ - 1800 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۲۴۰۰۰', qty: 1, power: 1800, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-004', category: 'load', brand: 'خانگی', model: 'Home Appliance 04', title: 'کولر گازی ۳۰۰۰۰ - 2100 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۳۰۰۰۰', qty: 1, power: 2100, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-005', category: 'load', brand: 'خانگی', model: 'Home Appliance 05', title: 'کولر گازی ۳۶۰۰۰ - 2800 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۳۶۰۰۰', qty: 1, power: 2800, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-006', category: 'load', brand: 'خانگی', model: 'Home Appliance 06', title: 'کولر گازی ۴۸۰۰۰ - 3500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۴۸۰۰۰', qty: 1, power: 3500, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-007', category: 'load', brand: 'خانگی', model: 'Home Appliance 07', title: 'کولر گازی ۶۰۰۰۰ - 4500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر گازی ۶۰۰۰۰', qty: 1, power: 4500, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-008', category: 'load', brand: 'خانگی', model: 'Home Appliance 08', title: 'کولر آبی 2500 - 350 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر آبی 2500', qty: 1, power: 350, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-009', category: 'load', brand: 'خانگی', model: 'Home Appliance 09', title: 'کولر آبی 6000 - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر آبی 6000', qty: 1, power: 1000, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-010', category: 'load', brand: 'خانگی', model: 'Home Appliance 10', title: 'کولر آبی 6000 به بالا - 1500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کولر آبی 6000 به بالا', qty: 1, power: 1500, hours: 6, powerFactor: 0.82, coincidenceFactor: 0.75, loadType: 'motor', surgeFactor: 2.8 },
  },
  {
    id: 'load-home-011', category: 'load', brand: 'خانگی', model: 'Home Appliance 11', title: 'بخاری برقی - 2000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'بخاری برقی', qty: 1, power: 2000, hours: 3, powerFactor: 0.98, coincidenceFactor: 0.7, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-012', category: 'load', brand: 'خانگی', model: 'Home Appliance 12', title: 'TV-LCD FULL - 170 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'TV-LCD FULL', qty: 1, power: 170, hours: 5, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-013', category: 'load', brand: 'خانگی', model: 'Home Appliance 13', title: 'TV-LED FULL - 100 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'TV-LED FULL', qty: 1, power: 100, hours: 5, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-014', category: 'load', brand: 'خانگی', model: 'Home Appliance 14', title: 'سینمای خانواده - 500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'سینمای خانواده', qty: 1, power: 500, hours: 5, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-015', category: 'load', brand: 'خانگی', model: 'Home Appliance 15', title: 'توستر نان-۲تکه ای - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'توستر نان-۲تکه ای', qty: 1, power: 1000, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-016', category: 'load', brand: 'خانگی', model: 'Home Appliance 16', title: 'توستر نان-۴تکه ای - 2500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'توستر نان-۴تکه ای', qty: 1, power: 2500, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-017', category: 'load', brand: 'خانگی', model: 'Home Appliance 17', title: 'قهوه ساز - 1400 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'قهوه ساز', qty: 1, power: 1400, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-018', category: 'load', brand: 'خانگی', model: 'Home Appliance 18', title: 'ماشین ظرفشویی - 1500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'ماشین ظرفشویی', qty: 1, power: 1500, hours: 1.5, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 2.5 },
  },
  {
    id: 'load-home-019', category: 'load', brand: 'خانگی', model: 'Home Appliance 19', title: 'یخچال فریزر - 400 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'یخچال فریزر', qty: 1, power: 400, hours: 12, powerFactor: 0.82, coincidenceFactor: 0.55, loadType: 'motor', surgeFactor: 3.5 },
  },
  {
    id: 'load-home-020', category: 'load', brand: 'خانگی', model: 'Home Appliance 20', title: 'یخچال - 300 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'یخچال', qty: 1, power: 300, hours: 12, powerFactor: 0.82, coincidenceFactor: 0.55, loadType: 'motor', surgeFactor: 3.5 },
  },
  {
    id: 'load-home-021', category: 'load', brand: 'خانگی', model: 'Home Appliance 21', title: 'ماکروویو - 1500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'ماکروویو', qty: 1, power: 1500, hours: 3, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-home-022', category: 'load', brand: 'خانگی', model: 'Home Appliance 22', title: 'پنکه سقفی - 80 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'پنکه سقفی', qty: 1, power: 80, hours: 8, powerFactor: 0.82, coincidenceFactor: 0.8, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'load-home-023', category: 'load', brand: 'خانگی', model: 'Home Appliance 23', title: 'سیستم صوتی خانگی - 100 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'سیستم صوتی خانگی', qty: 1, power: 100, hours: 5, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-024', category: 'load', brand: 'خانگی', model: 'Home Appliance 24', title: 'کرکره برقی درب پارکینگ - 500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کرکره برقی درب پارکینگ', qty: 1, power: 500, hours: 0.2, powerFactor: 0.82, coincidenceFactor: 0.5, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-home-025', category: 'load', brand: 'خانگی', model: 'Home Appliance 25', title: 'اجاق فر - 2000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'اجاق فر', qty: 1, power: 2000, hours: 1, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-026', category: 'load', brand: 'خانگی', model: 'Home Appliance 26', title: 'ماشین لباسشویی - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'ماشین لباسشویی', qty: 1, power: 1000, hours: 1.5, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 2.5 },
  },
  {
    id: 'load-home-027', category: 'load', brand: 'خانگی', model: 'Home Appliance 27', title: 'لامپ LED - 10 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'لامپ LED', qty: 1, power: 10, hours: 6, powerFactor: 0.95, coincidenceFactor: 1, loadType: 'switching', surgeFactor: 1.1 },
  },
  {
    id: 'load-home-028', category: 'load', brand: 'خانگی', model: 'Home Appliance 28', title: 'ریسه روشنایی - 10 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'ریسه روشنایی', qty: 1, power: 10, hours: 6, powerFactor: 0.95, coincidenceFactor: 1, loadType: 'switching', surgeFactor: 1.1 },
  },
  {
    id: 'load-home-029', category: 'load', brand: 'خانگی', model: 'Home Appliance 29', title: 'چرخ خیاطی - 80 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'چرخ خیاطی', qty: 1, power: 80, hours: 0.5, powerFactor: 0.82, coincidenceFactor: 0.6, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'load-home-030', category: 'load', brand: 'خانگی', model: 'Home Appliance 30', title: 'چایی ساز - 2000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'چایی ساز', qty: 1, power: 2000, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-031', category: 'load', brand: 'خانگی', model: 'Home Appliance 31', title: 'تردمیل - 900 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'تردمیل', qty: 1, power: 900, hours: 3, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-home-032', category: 'load', brand: 'خانگی', model: 'Home Appliance 32', title: 'جارو برقی - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'جارو برقی', qty: 1, power: 1000, hours: 0.5, powerFactor: 0.82, coincidenceFactor: 0.6, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'load-home-033', category: 'load', brand: 'خانگی', model: 'Home Appliance 33', title: 'هود - 170 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'هود', qty: 1, power: 170, hours: 4, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'load-home-034', category: 'load', brand: 'خانگی', model: 'Home Appliance 34', title: 'اتو بخار - 1800 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'اتو بخار', qty: 1, power: 1800, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-035', category: 'load', brand: 'خانگی', model: 'Home Appliance 35', title: 'اتو معمولی - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'اتو معمولی', qty: 1, power: 1000, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-036', category: 'load', brand: 'خانگی', model: 'Home Appliance 36', title: 'مودم - 20 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'مودم', qty: 1, power: 20, hours: 24, powerFactor: 0.9, coincidenceFactor: 1, loadType: 'switching', surgeFactor: 1.1 },
  },
  {
    id: 'load-home-037', category: 'load', brand: 'خانگی', model: 'Home Appliance 37', title: 'آبگرم کن برقی - 2500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'آبگرم کن برقی', qty: 1, power: 2500, hours: 3, powerFactor: 0.98, coincidenceFactor: 0.7, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-038', category: 'load', brand: 'خانگی', model: 'Home Appliance 38', title: 'رادیاتور برقی - 2500 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'رادیاتور برقی', qty: 1, power: 2500, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.7, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-039', category: 'load', brand: 'خانگی', model: 'Home Appliance 39', title: 'هیتر - 3000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'هیتر', qty: 1, power: 3000, hours: 3, powerFactor: 0.98, coincidenceFactor: 0.7, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-040', category: 'load', brand: 'خانگی', model: 'Home Appliance 40', title: 'چرخ گوشت - 350 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'چرخ گوشت', qty: 1, power: 350, hours: 0.5, powerFactor: 0.82, coincidenceFactor: 0.6, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'load-home-041', category: 'load', brand: 'خانگی', model: 'Home Appliance 41', title: 'پلوپز - 800 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'پلوپز', qty: 1, power: 800, hours: 1, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-042', category: 'load', brand: 'خانگی', model: 'Home Appliance 42', title: 'سماور برقی - 1000 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'سماور برقی', qty: 1, power: 1000, hours: 1, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-043', category: 'load', brand: 'خانگی', model: 'Home Appliance 43', title: 'کتری برقی - 450 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کتری برقی', qty: 1, power: 450, hours: 0.5, powerFactor: 0.98, coincidenceFactor: 0.8, loadType: 'resistive', surgeFactor: 1 },
  },
  {
    id: 'load-home-044', category: 'load', brand: 'خانگی', model: 'Home Appliance 44', title: 'پرینتر - 50 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'پرینتر', qty: 1, power: 50, hours: 1, powerFactor: 0.9, coincidenceFactor: 0.5, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-045', category: 'load', brand: 'خانگی', model: 'Home Appliance 45', title: 'اسکنر - 50 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'اسکنر', qty: 1, power: 50, hours: 1, powerFactor: 0.9, coincidenceFactor: 0.5, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-046', category: 'load', brand: 'خانگی', model: 'Home Appliance 46', title: 'لپتاپ - 80 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'لپتاپ', qty: 1, power: 80, hours: 6, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-047', category: 'load', brand: 'خانگی', model: 'Home Appliance 47', title: 'کامپیوتر - 120 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کامپیوتر', qty: 1, power: 120, hours: 6, powerFactor: 0.9, coincidenceFactor: 0.9, loadType: 'switching', surgeFactor: 1.2 },
  },
  {
    id: 'load-home-048', category: 'load', brand: 'خانگی', model: 'Home Appliance 48', title: 'پمپ آب - 650 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'پمپ آب', qty: 1, power: 650, hours: 2, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-home-049', category: 'load', brand: 'خانگی', model: 'Home Appliance 49', title: 'کف کش - 600 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'کف کش', qty: 1, power: 600, hours: 2, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 3 },
  },
  {
    id: 'load-home-050', category: 'load', brand: 'خانگی', model: 'Home Appliance 50', title: 'آبمیوه گیر - 800 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'آبمیوه گیر', qty: 1, power: 800, hours: 0.5, powerFactor: 0.82, coincidenceFactor: 0.6, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'load-home-051', category: 'load', brand: 'خانگی', model: 'Home Appliance 51', title: 'هوا کش (فن) - 150 وات', summary: 'مصرف‌کننده خانگی پرتکرار؛ توان نامی از فایل تجهیزات آپلود شده', specs: { name: 'هوا کش (فن)', qty: 1, power: 150, hours: 4, powerFactor: 0.82, coincidenceFactor: 0.7, loadType: 'motor', surgeFactor: 2 },
  },
  {
    id: 'panel-shil-550', category: 'panel', brand: 'SHIL', model: 'SHIL-550W', title: 'پنل SHIL 550W',
    summary: 'پنل خورشیدی 550 وات SHIL برای پروژه‌های خانگی، ویلایی و اداری.',
    specs: { panelWatt: 550, panelVoc: 49.5, panelVmp: 41.5, panelTempCoeffVoc: 0.0027 },
  },
  {
    id: 'panel-shil-620', category: 'panel', brand: 'SHIL', model: 'SHIL-620W', title: 'پنل SHIL 620W',
    summary: 'پنل خورشیدی 620 وات SHIL برای پروژه‌های خانگی، ویلایی و اداری.',
    specs: { panelWatt: 620, panelVoc: 53.5, panelVmp: 44.5, panelTempCoeffVoc: 0.0025 },
  },
  {
    id: 'panel-shil-700', category: 'panel', brand: 'SHIL', model: 'SHIL-700W', title: 'پنل SHIL 700W',
    summary: 'پنل خورشیدی 700 وات SHIL برای پروژه‌های خانگی، ویلایی و اداری.',
    specs: { panelWatt: 700, panelVoc: 58.5, panelVmp: 48.5, panelTempCoeffVoc: 0.0023 },
  },
  {
    id: 'battery-shil-lfp-12v6-100ah', category: 'battery', brand: 'SHIL', model: 'LFP-12.6V-100Ah', title: 'باتری لیتیوم SHIL 12.6V 100Ah',
    summary: 'باتری لیتیوم SHIL برای سیستم‌های خورشیدی و بکاپ.',
    specs: { batteryType: 'Lithium', batteryUnitVoltage: 12.6, batteryUnitAh: 100, batteryRoundTripEfficiency: 0.96, dod: 0.9 },
  },
  {
    id: 'battery-shil-lfp-25v-100ah', category: 'battery', brand: 'SHIL', model: 'LFP-25V-100Ah', title: 'باتری لیتیوم SHIL 25V 100Ah',
    summary: 'باتری لیتیوم SHIL برای سیستم‌های خورشیدی و بکاپ.',
    specs: { batteryType: 'Lithium', batteryUnitVoltage: 25, batteryUnitAh: 100, batteryRoundTripEfficiency: 0.96, dod: 0.9 },
  },
  {
    id: 'battery-shil-lfp-25v-200ah', category: 'battery', brand: 'SHIL', model: 'LFP-25V-200Ah', title: 'باتری لیتیوم SHIL 25V 200Ah',
    summary: 'باتری لیتیوم SHIL برای سیستم‌های خورشیدی و بکاپ.',
    specs: { batteryType: 'Lithium', batteryUnitVoltage: 25, batteryUnitAh: 200, batteryRoundTripEfficiency: 0.96, dod: 0.9 },
  },
  {
    id: 'battery-shil-lfp-51v-100ah', category: 'battery', brand: 'SHIL', model: 'LFP-51V-100Ah', title: 'باتری لیتیوم SHIL 51V 100Ah',
    summary: 'باتری لیتیوم SHIL برای سیستم‌های خورشیدی و بکاپ.',
    specs: { batteryType: 'Lithium', batteryUnitVoltage: 51, batteryUnitAh: 100, batteryRoundTripEfficiency: 0.96, dod: 0.9 },
  },
  {
    id: 'battery-shil-lfp-51v-200ah', category: 'battery', brand: 'SHIL', model: 'LFP-51V-200Ah', title: 'باتری لیتیوم SHIL 51V 200Ah',
    summary: 'باتری لیتیوم SHIL برای سیستم‌های خورشیدی و بکاپ.',
    specs: { batteryType: 'Lithium', batteryUnitVoltage: 51, batteryUnitAh: 200, batteryRoundTripEfficiency: 0.96, dod: 0.9 },
  },
  {
    id: 'battery-shil-lfp-51v-300ah', category: 'battery', brand: 'SHIL', model: 'LFP-51V-300Ah', title: 'باتری لیتیوم SHIL 51V 300Ah',
    summary: 'باتری لیتیوم SHIL برای سیستم‌های خورشیدی و بکاپ.',
    specs: { batteryType: 'Lithium', batteryUnitVoltage: 51, batteryUnitAh: 300, batteryRoundTripEfficiency: 0.96, dod: 0.9 },
  },
  {
    id: 'inverter-shil-offgrid-1-6kw-12v', category: 'inverter', brand: 'SHIL', model: 'OFFGRID-1.6KW-12V', title: 'اینورتر آفگرید SHIL 1.6kW 12V',
    summary: 'اینورتر آفگرید SHIL برای سیستم‌های مستقل از شبکه و بکاپ.',
    specs: { inverterMode: 'offgrid', systemVoltage: 12, inverterEfficiency: 0.95, ratedPowerW: 1600, surgePowerW: 3200 },
  },
  {
    id: 'inverter-shil-offgrid-3-2kw-24v', category: 'inverter', brand: 'SHIL', model: 'OFFGRID-3.2KW-24V', title: 'اینورتر آفگرید SHIL 3.2kW 24V',
    summary: 'اینورتر آفگرید SHIL برای سیستم‌های مستقل از شبکه و بکاپ.',
    specs: { inverterMode: 'offgrid', systemVoltage: 24, inverterEfficiency: 0.95, ratedPowerW: 3200, surgePowerW: 6400 },
  },
  {
    id: 'inverter-shil-offgrid-4kw-24v', category: 'inverter', brand: 'SHIL', model: 'OFFGRID-4KW-24V', title: 'اینورتر آفگرید SHIL 4kW 24V',
    summary: 'اینورتر آفگرید SHIL برای سیستم‌های مستقل از شبکه و بکاپ.',
    specs: { inverterMode: 'offgrid', systemVoltage: 24, inverterEfficiency: 0.95, ratedPowerW: 4000, surgePowerW: 8000 },
  },
  {
    id: 'inverter-shil-offgrid-6kw-48v', category: 'inverter', brand: 'SHIL', model: 'OFFGRID-6KW-48V', title: 'اینورتر آفگرید SHIL 6kW 48V',
    summary: 'اینورتر آفگرید SHIL برای سیستم‌های مستقل از شبکه و بکاپ.',
    specs: { inverterMode: 'offgrid', systemVoltage: 48, inverterEfficiency: 0.95, ratedPowerW: 6000, surgePowerW: 12000 },
  },
  {
    id: 'inverter-shil-offgrid-8kw-48v', category: 'inverter', brand: 'SHIL', model: 'OFFGRID-8KW-48V', title: 'اینورتر آفگرید SHIL 8kW 48V',
    summary: 'اینورتر آفگرید SHIL برای سیستم‌های مستقل از شبکه و بکاپ.',
    specs: { inverterMode: 'offgrid', systemVoltage: 48, inverterEfficiency: 0.95, ratedPowerW: 8000, surgePowerW: 16000 },
  },
  {
    id: 'inverter-shil-offgrid-10kw-48v', category: 'inverter', brand: 'SHIL', model: 'OFFGRID-10KW-48V', title: 'اینورتر آفگرید SHIL 10kW 48V',
    summary: 'اینورتر آفگرید SHIL برای سیستم‌های مستقل از شبکه و بکاپ.',
    specs: { inverterMode: 'offgrid', systemVoltage: 48, inverterEfficiency: 0.95, ratedPowerW: 10000, surgePowerW: 20000 },
  },
  {
    id: 'inverter-shil-hybrid-6kw-48v', category: 'inverter', brand: 'SHIL', model: 'HYBRID-6KW-48V', title: 'اینورتر هیبرید SHIL 6kW 48V',
    summary: 'اینورتر هیبرید SHIL برای کارکرد ترکیبی خورشیدی، باتری و شبکه.',
    specs: { inverterMode: 'hybrid', systemVoltage: 48, inverterEfficiency: 0.965, ratedPowerW: 6000, surgePowerW: 12000 },
  },
  {
    id: 'inverter-shil-hybrid-8kw-48v', category: 'inverter', brand: 'SHIL', model: 'HYBRID-8KW-48V', title: 'اینورتر هیبرید SHIL 8kW 48V',
    summary: 'اینورتر هیبرید SHIL برای کارکرد ترکیبی خورشیدی، باتری و شبکه.',
    specs: { inverterMode: 'hybrid', systemVoltage: 48, inverterEfficiency: 0.965, ratedPowerW: 8000, surgePowerW: 16000 },
  },
  {
    id: 'inverter-shil-hybrid-11kw-48v', category: 'inverter', brand: 'SHIL', model: 'HYBRID-11KW-48V', title: 'اینورتر هیبرید SHIL 11kW 48V',
    summary: 'اینورتر هیبرید SHIL برای کارکرد ترکیبی خورشیدی، باتری و شبکه.',
    specs: { inverterMode: 'hybrid', systemVoltage: 48, inverterEfficiency: 0.965, ratedPowerW: 11000, surgePowerW: 22000 },
  },
];
