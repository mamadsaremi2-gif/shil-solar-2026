import React from "react";
import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="dashboard-shell-v15" dir="rtl">
      <main className="dashboard-main-v15">
        <section className="notfound-card-v15">
          <AlertTriangle size={42} />

          <h1>صفحه پیدا نشد</h1>

          <p>
            مسیر وارد شده در اپ وجود ندارد یا هنوز فعال نشده است.
          </p>

          <Link to="/">
            <Home size={20} />
            بازگشت به داشبورد
          </Link>
        </section>
      </main>
    </div>
  );
}
