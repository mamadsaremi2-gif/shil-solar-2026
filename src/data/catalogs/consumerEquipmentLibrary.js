const categories = ["روشنایی", "سرمایش", "گرمایش", "آشپزخانه", "اداری", "شبکه", "امنیتی", "صنعتی", "پمپ", "عمومی"];
const names = ["لامپ LED", "یخچال", "فریزر", "تلویزیون", "مودم", "روتر", "کامپیوتر", "لپ تاپ", "پمپ آب", "کولر آبی", "کولر گازی", "دوربین مداربسته", "پرینتر", "سرور", "فن", "مایکروویو", "چای ساز", "ماشین لباسشویی", "روشنایی اضطراری", "درب اتوماتیک"];

export const consumerEquipmentLibrary = Array.from({ length: 250 }, (_, i) => {
  const id = i + 1;
  const name = names[i % names.length];
  const category = categories[i % categories.length];

  return {
    id,
    title: `${name} ${id}`,
    category,
    defaultPowerW: [10, 20, 50, 100, 150, 250, 500, 750, 1000, 1500, 2000][i % 11],
    surgeFactor: [1, 1.2, 1.5, 2, 3][i % 5],
    priority: ["حیاتی", "عادی", "غیرضروری"][i % 3]
  };
});

export function searchConsumerEquipment(query = "") {
  const q = query.trim();
  if (!q) return consumerEquipmentLibrary;
  return consumerEquipmentLibrary.filter((item) =>
    item.title.includes(q) || item.category.includes(q)
  );
}
