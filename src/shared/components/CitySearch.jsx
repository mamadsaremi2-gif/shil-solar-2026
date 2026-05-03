import { useMemo, useState } from "react";
import { IRAN_CITIES } from "../../data/seed/iranCities";

export function CitySearch({ value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) return IRAN_CITIES.slice(0, 8);
    return IRAN_CITIES
      .filter((city) => city.keywords.includes(normalized) || city.name.includes(normalized) || city.province.includes(normalized))
      .slice(0, 10);
  }, [query]);

  function chooseCity(city) {
    setQuery(city.name);
    setOpen(false);
    onSelect?.(city);
  }

  return (
    <div className="city-search">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="جستجوی شهر..."
        autoComplete="off"
      />
      {open ? (
        <div className="city-search__menu">
          {results.length ? results.map((city) => (
            <button key={city.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => chooseCity(city)}>
              <strong>{city.name}</strong>
              <span>{city.province} | PSH {city.sunHours} | ارتفاع {city.altitude}m</span>
            </button>
          )) : (
            <div className="city-search__empty">شهری پیدا نشد. نام شهر را دستی وارد کنید.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
