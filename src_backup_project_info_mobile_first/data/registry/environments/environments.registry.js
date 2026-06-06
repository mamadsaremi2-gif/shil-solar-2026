export const environmentRegistry = Object.freeze([
  { id: 'indoor', label: 'داخلی', ipHint: 'IP40', corrosion: false },
  { id: 'outdoor', label: 'فضای باز', ipHint: 'IP54', corrosion: false },
  { id: 'roof', label: 'پشت‌بام', ipHint: 'IP65', corrosion: false },
  { id: 'industrial', label: 'صنعتی', ipHint: 'IP55/IP65', corrosion: false },
  { id: 'corrosive', label: 'خورنده / مرطوب', ipHint: 'IP65 + ضدخوردگی', corrosion: true },
]);
