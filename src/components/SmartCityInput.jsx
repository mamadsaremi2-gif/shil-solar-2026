import * as React from "react";
import { IRAN_CITIES } from "../data/seed/iranCities.js";

function normalizePersian(value = "") {
  return String(value || "")
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/أ|إ|آ/g, "ا")
    .replace(/\s+/g, " ");
}

export function findIranCityByName(city = "", province = "") {
  const normalizedCity = normalizePersian(city);
  const normalizedProvince = normalizePersian(province);
  if (!normalizedCity && !normalizedProvince) return null;

  return IRAN_CITIES.find((item) => {
    const cityMatches = normalizedCity ? normalizePersian(item.name) === normalizedCity : true;
    const provinceMatches = normalizedProvince ? normalizePersian(item.province) === normalizedProvince : true;
    return cityMatches && provinceMatches;
  }) || null;
}

export function getDefaultIranCity() {
  return findIranCityByName("اصفهان", "اصفهان") || IRAN_CITIES[0];
}

export default function SmartCityInput({
  value = "",
  onChange = () => {},
  onPick = () => {},
  placeholder = "نام شهر را وارد کن؛ مثلاً اصفهان",
  name = "city",
}) {
  const [focused, setFocused] = React.useState(false);
  const query = normalizePersian(value);

  const matches = React.useMemo(() => {
    const scored = IRAN_CITIES.map((item) => {
      const city = normalizePersian(item.name);
      const province = normalizePersian(item.province);
      const label = `${item.name}، ${item.province}`;

      if (!query) return { item, score: item.name === "اصفهان" ? 0 : 50, label };
      if (city === query) return { item, score: 0, label };
      if (city.startsWith(query)) return { item, score: 1, label };
      if (city.includes(query)) return { item, score: 2, label };
      if (province.startsWith(query)) return { item, score: 3, label };
      if (province.includes(query)) return { item, score: 4, label };
      return null;
    }).filter(Boolean);

    return scored
      .sort((a, b) => a.score - b.score || a.item.name.localeCompare(b.item.name, "fa"))
      .slice(0, query ? 12 : 8);
  }, [query]);

  const pick = (match) => {
    onChange(match.item.name);
    onPick(match.item);
    setFocused(false);
  };

  return (
    <div className="shil-smart-field">
      <input
        className="shil-input"
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 140)}
        placeholder={placeholder}
        autoComplete="off"
        data-required="true"
      />

      {focused && matches.length ? (
        <div className="shil-suggest-list">
          {matches.map((match) => (
            <button type="button" key={match.item.id} onMouseDown={() => pick(match)}>
              <strong>{match.item.name}</strong>
              <span>{match.item.province}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
