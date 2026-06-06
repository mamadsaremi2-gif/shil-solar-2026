# گزارش اصلاح ایرادهای باقی مانده مسیر پنل خورشیدی

## اصلاحات انجام شده

1. منبع راندمان محیطی اصلاح شد.
   - موتور اکنون `effectiveEfficiency`، `finalEfficiency`، `assessment.effectiveEfficiency` و `solarDefaults.effectiveEfficiency` را می خواند.
   - در نتیجه برای اصفهان راندمان `0.92` به جای مقدار پیش فرض قدیمی `0.82` اعمال می شود.

2. فرمول توان پایه آرایه پنل تثبیت شد:

```txt
PV Array Base Power = Daily Energy / (PSH × Environmental Efficiency)
```

3. تعداد پنل فقط از توان پایه آرایه و توان پنل محاسبه می شود:

```txt
Panel Count = ceil(PV Array Base Power / Panel Power)
```

4. درصد افزایش/کاهش فقط برای توان مبنای انتخاب اینورتر استفاده می شود، نه برای تعداد پنل.

5. تست مبنا برای اصفهان انجام شد:

```txt
Load = 20 kW
PSH = 5.7
Efficiency = 0.92
Panel = 620 W
Adjustment = 20% decrease
```

خروجی مورد انتظار و تست شده:

```txt
Daily Energy = 114 kWh/day
PV Array Base = 21.74 kW
Panel Count = 36
Actual PV Array = 22.32 kW
Inverter Target = 17.39 kW
Suggested Inverter = 3 × 6 kW
```

## نکته

اگر در UI همچنان عددی مثل 40 یا 48 پنل دیده شود، آن صفحه از خروجی قدیمی یا Cache مرورگر/LocalStorage تغذیه می شود. در این حالت باید LocalStorage مربوط به `shil:*` پاک شود و مسیر پروژه دوباره از ابتدا اجرا شود.
