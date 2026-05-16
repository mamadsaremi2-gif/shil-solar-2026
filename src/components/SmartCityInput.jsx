import React, { useMemo, useState } from "react";
import { IRAN_CITIES } from "../data/seed/iranCities.js";

export default function SmartCityInput({ onPick, provinceName = "province", cityName = "city" }) {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const provinceMatches = useMemo(() => {
    const q = province.trim();
    if (!q) return [];
    return [...new Set(IRAN_CITIES.filter((item) => item.province.includes(q)).map((item) => item.province))].slice(0, 8);
  }, [province]);
  const cityMatches = useMemo(() => {
    const q = city.trim();
    if (!q) return [];
    return IRAN_CITIES.filter((item) => item.name.includes(q) || item.province.includes(q)).slice(0, 8);
  }, [city]);

  const pickCity = (item) => {
    setProvince(item.province);
    setCity(item.name);
    onPick?.(item);
  };

  return (
    <>
      <label className="shil-smart-field"><span>استان</span><input name={provinceName} value={province} onChange={(event) => setProvince(event.target.value)} placeholder="مثلاً فارس" data-required="true" />
        {provinceMatches.length ? <div className="shil-suggest-list">{provinceMatches.map((item) => <button type="button" key={item} onClick={() => setProvince(item)}>{item}</button>)}</div> : null}
      </label>
      <label className="shil-smart-field"><span>شهر</span><input name={cityName} value={city} onChange={(event) => setCity(event.target.value)} placeholder="مثلاً شیراز" data-required="true" />
        {cityMatches.length ? <div className="shil-suggest-list">{cityMatches.map((item) => <button type="button" key={item.id} onClick={() => pickCity(item)}>{item.name}، {item.province}</button>)}</div> : null}
      </label>
    </>
  );
}
