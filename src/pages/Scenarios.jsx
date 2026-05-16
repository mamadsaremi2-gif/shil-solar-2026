import React from "react";
import { Link, useParams } from "react-router-dom";
import { Sun, BatteryCharging, Feather, Gauge, Factory } from "lucide-react";
import ShilPageShell from "../components/ShilPageShell.jsx";
import { getScenarioList } from "../data/scenarios/scenarioLibrary.js";

const domainLabel = { solar: "پروژه های انرژی خورشیدی", emergency: "پروژه های برق اضطراری" };
const weightLabel = { light: "سبک", medium: "متوسط", heavy: "سنگین" };

export default function Scenarios() {
  const { domain, weight } = useParams();

  if (domain && weight) {
    const scenarios = getScenarioList(domain, weight);
    return (
      <ShilPageShell title={`سناریوهای آماده ${weightLabel[weight]}`}>
        <section className="shil-scenario-list">
          {scenarios.map((item) => <article className="shil-scenario-row" key={item.id}><strong>{item.title}</strong><span>{item.description}</span></article>)}
        </section>
      </ShilPageShell>
    );
  }

  if (domain) {
    return (
      <ShilPageShell title={`سناریوهای آماده ${domainLabel[domain]}`}>
        <section className="shil-three-card-grid">
          <Link className="shil-nav-card" to={`/scenarios/${domain}/light`}><Feather size={40} /><h3>سناریوهای آماده سبک</h3></Link>
          <Link className="shil-nav-card" to={`/scenarios/${domain}/medium`}><Gauge size={40} /><h3>سناریوهای آماده متوسط</h3></Link>
          <Link className="shil-nav-card" to={`/scenarios/${domain}/heavy`}><Factory size={40} /><h3>سناریوهای آماده سنگین</h3></Link>
        </section>
      </ShilPageShell>
    );
  }

  return (
    <ShilPageShell title="سناریوهای آماده">
      <section className="shil-two-card-grid">
        <Link className="shil-nav-card" to="/scenarios/solar"><Sun size={44} /><h3>سناریو های آماده پروژه های انرژی خورشیدی</h3></Link>
        <Link className="shil-nav-card" to="/scenarios/emergency"><BatteryCharging size={44} /><h3>سناریو های آماده پروژه های برق اضطراری</h3></Link>
      </section>
    </ShilPageShell>
  );
}
