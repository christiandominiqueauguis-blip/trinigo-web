import { useEffect, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import TourismManagerSidebar from "../../components/TourismManagerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import usePagination from "../../hooks/usePagination";
import "../PropertyOwner/Income.css";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function TourismManagerIncome() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState({
    cards: {
      totalIncome: 0,
      onlineIncome: 0,
      walkInIncome: 0,
    },
    series: [],
  });

  useEffect(() => {
    setLoading(true);

    fetch(`${API_URL}/analytics/reports/income?period=${period}`, {
      headers: buildAuthHeaders("tourismManager"),
    })
      .then((response) => response.json())
      .then((data) => {
        setIncomeData({
          cards: data?.cards || {
            totalIncome: 0,
            onlineIncome: 0,
            walkInIncome: 0,
          },
          series: Array.isArray(data?.series) ? data.series : [],
        });
      })
      .catch(() => {
        setIncomeData({
          cards: {
            totalIncome: 0,
            onlineIncome: 0,
            walkInIncome: 0,
          },
          series: [],
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [period]);

  const earningsPagination = usePagination(incomeData.series, {
    initialPageSize: 6,
    resetKey: period,
  });

  return (
    <div className="property-owner-layout">
      <TourismManagerSidebar
        active="income"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main owner-income-main">
        <div className="owner-income-shell">
          <header className="owner-income-header">
            <div className="owner-income-heading">
              {sidebarHidden ? <MenuButton onClick={() => setSidebarHidden(false)} /> : null}
              <div>
                <span className="owner-income-kicker">Revenue</span>
                <h1>Income Overview</h1>
                <p>Track tourism-manager revenue analytics by day, week, month, or year.</p>
              </div>
            </div>

            <div className="owner-income-periods">
              {PERIOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`owner-income-period ${period === option.value ? "owner-income-period--active" : ""}`}
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </header>

          <section className="owner-income-summary">
            <article className="owner-income-card">
              <span>Total Earnings</span>
              <strong>{formatCurrency(incomeData.cards.totalIncome)}</strong>
            </article>
            <article className="owner-income-card owner-income-card--online">
              <span>Online Payments</span>
              <strong>{formatCurrency(incomeData.cards.onlineIncome)}</strong>
            </article>
            <article className="owner-income-card owner-income-card--walkin">
              <span>Walk-in Earnings</span>
              <strong>{formatCurrency(incomeData.cards.walkInIncome)}</strong>
            </article>
            <article className="owner-income-card">
              <span>Total Periods</span>
              <strong>{incomeData.series.length}</strong>
            </article>
          </section>

          <section className="owner-income-list">
            <div className="owner-income-list-header">
              <div>
                <h2>Revenue by {PERIOD_OPTIONS.find((item) => item.value === period)?.label}</h2>
                <p>Each row summarizes recorded tourism income for the selected period grouping.</p>
              </div>
            </div>

            {loading ? (
              <div className="owner-income-empty">Loading income data...</div>
            ) : incomeData.series.length === 0 ? (
              <div className="owner-income-empty">No income records are available for this period.</div>
            ) : (
              <>
                <div className="owner-income-rows">
                  {earningsPagination.paginatedItems.map((entry) => (
                    <article key={entry.label} className="owner-income-row">
                      <div>
                        <h3>{entry.label}</h3>
                        <p>{Number(entry.bookingCount || 0)} booking(s)</p>
                      </div>
                      <div className="owner-income-row-metrics">
                        <span>Total: {formatCurrency(entry.income)}</span>
                        <span>Online: {formatCurrency(entry.onlineIncome)}</span>
                        <span>Walk-in: {formatCurrency(entry.walkInIncome)}</span>
                      </div>
                    </article>
                  ))}
                </div>

                <Pagination
                  currentPage={earningsPagination.currentPage}
                  itemLabel="income periods"
                  onPageChange={earningsPagination.setCurrentPage}
                  onPageSizeChange={earningsPagination.setPageSize}
                  pageSize={earningsPagination.pageSize}
                  totalItems={earningsPagination.totalItems}
                  totalPages={earningsPagination.totalPages}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
