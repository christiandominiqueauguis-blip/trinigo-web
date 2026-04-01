import { useEffect, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { API_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";
import "./Income.css";

const PERIOD_OPTIONS = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

function formatCurrency(value) {
  return `PHP ${Number(value || 0).toLocaleString()}`;
}

export default function Income() {
  const ownerId = localStorage.getItem("ownerId") || "";
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [period, setPeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState({
    summary: {
      totalEarnings: 0,
      onlineEarnings: 0,
      walkInEarnings: 0,
      transactionCount: 0,
    },
    groupedEarnings: [],
    transactions: [],
  });

  useEffect(() => {
    if (!ownerId) return;
    setLoading(true);

    fetch(`${API_URL}/property-owner/${ownerId}/income?period=${period}`)
      .then((response) => response.json())
      .then((data) => {
        setIncomeData(data);
      })
      .catch(() => {
        setIncomeData({
          summary: {
            totalEarnings: 0,
            onlineEarnings: 0,
            walkInEarnings: 0,
            transactionCount: 0,
          },
          groupedEarnings: [],
          transactions: [],
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId, period]);

  const earningsPagination = usePagination(incomeData.groupedEarnings, {
    initialPageSize: 6,
    resetKey: period,
  });

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
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
                <p>Track online payments and walk-in earnings, grouped by day, week, month, or year.</p>
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
              <strong>{formatCurrency(incomeData.summary.totalEarnings)}</strong>
            </article>
            <article className="owner-income-card owner-income-card--online">
              <span>Online Payments</span>
              <strong>{formatCurrency(incomeData.summary.onlineEarnings)}</strong>
            </article>
            <article className="owner-income-card owner-income-card--walkin">
              <span>Walk-in Earnings</span>
              <strong>{formatCurrency(incomeData.summary.walkInEarnings)}</strong>
            </article>
            <article className="owner-income-card">
              <span>Total Transactions</span>
              <strong>{incomeData.summary.transactionCount}</strong>
            </article>
          </section>

          <section className="owner-income-list">
            <div className="owner-income-list-header">
              <div>
                <h2>Earnings by {PERIOD_OPTIONS.find((item) => item.value === period)?.label}</h2>
                <p>Each row shows the total revenue and payment split for that period.</p>
              </div>
            </div>

            {loading ? (
              <div className="owner-income-empty">Loading income data...</div>
            ) : incomeData.groupedEarnings.length === 0 ? (
              <div className="owner-income-empty">No earnings recorded yet for this owner account.</div>
            ) : (
              <>
                <div className="owner-income-rows">
                  {earningsPagination.paginatedItems.map((entry) => (
                    <article key={entry.key} className="owner-income-row">
                      <div>
                        <h3>{entry.label}</h3>
                        <p>{entry.transactionCount} transaction(s)</p>
                      </div>
                      <div className="owner-income-row-metrics">
                        <span>Total: {formatCurrency(entry.totalEarnings)}</span>
                        <span>Online: {formatCurrency(entry.onlineEarnings)}</span>
                        <span>Walk-in: {formatCurrency(entry.walkInEarnings)}</span>
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
