import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MenuButton from "../../components/MenuButton";
import TourismManagerSidebar from "../../components/TourismManagerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import "../PropertyOwner/PropertyOwnerDashboard.css";
import "./TourismManagerReports.css";

const STATUS_COLORS = {
  Pending: "#f59e0b",
  Approved: "#16a34a",
  Completed: "#2563eb",
  Cancelled: "#64748b",
  Rejected: "#dc2626",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function createEmptyProvinceCards() {
  return {
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
  };
}

export default function TourismManagerDashboard() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [analytics, setAnalytics] = useState({
    guestCount: null,
    income: null,
    bookingStatus: null,
    walkIn: null,
  });
  const [provinceCards, setProvinceCards] = useState(createEmptyProvinceCards());
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const authHeaders = useMemo(() => buildAuthHeaders("tourismManager"), []);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setDashboardError("");

    try {
      const [
        guestCountResponse,
        incomeResponse,
        bookingStatusResponse,
        walkInResponse,
        provinceReportsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/analytics/reports/guest-count?period=monthly`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/income?period=monthly`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/booking-status?period=monthly`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/walk-in?period=monthly`, { headers: authHeaders }),
        fetch(`${API_URL}/tourism-site-manager/report-monitor`, { headers: authHeaders }),
      ]);

      const responses = [
        guestCountResponse,
        incomeResponse,
        bookingStatusResponse,
        walkInResponse,
        provinceReportsResponse,
      ];
      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        const failedPayload = await failedResponse.json().catch(() => ({}));
        throw new Error(failedPayload.message || "Failed to load tourism manager dashboard data.");
      }

      const guestCountData = await guestCountResponse.json();
      const incomeData = await incomeResponse.json();
      const bookingStatusData = await bookingStatusResponse.json();
      const walkInData = await walkInResponse.json();
      const provinceMonitorData = await provinceReportsResponse.json();

      setAnalytics({
        guestCount: guestCountData,
        income: incomeData,
        bookingStatus: bookingStatusData,
        walkIn: walkInData,
      });
      setProvinceCards(provinceMonitorData.cards || createEmptyProvinceCards());
    } catch (error) {
      console.error("Failed to load tourism manager dashboard data", error);
      setDashboardError(error.message || "Failed to load dashboard data.");
      setProvinceCards(createEmptyProvinceCards());
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const bookingStatusChart = useMemo(() => {
    const cards = analytics.bookingStatus?.cards || {};

    return [
      { name: "Pending", value: cards.pending || 0 },
      { name: "Approved", value: cards.approved || 0 },
      { name: "Completed", value: cards.completed || 0 },
      { name: "Cancelled", value: cards.cancelled || 0 },
      { name: "Rejected", value: cards.rejected || 0 },
    ].filter((item) => item.value > 0);
  }, [analytics.bookingStatus]);

  return (
    <div className="property-owner-layout">
      <TourismManagerSidebar
        active="dashboard"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className={`tm-dashboard-main tm-dashboard-main--owner ${sidebarHidden ? "full-width" : ""}`}>
        <div className="pod-header tm-dashboard-toolbar">
          <div className="pod-header-text">
            {sidebarHidden ? (
              <MenuButton
                onClick={(event) => {
                  event.stopPropagation();
                  setSidebarHidden(false);
                }}
              />
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <section className="tm-dashboard-empty">
            <p>Loading tourism manager dashboard...</p>
          </section>
        ) : dashboardError ? (
          <section className="tm-dashboard-empty tm-dashboard-empty--error">
            <p>{dashboardError}</p>
            <button type="button" className="tm-secondary-btn" onClick={loadDashboardData}>
              Try Again
            </button>
          </section>
        ) : (
          <>
            <section className="tm-dashboard-card-grid">
              <article className="tm-dashboard-card tm-dashboard-card--visits">
                <div className="tm-dashboard-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span>Total Visits</span>
                <strong>{analytics.guestCount?.cards?.totalGuests || 0}</strong>
                <small>Guest visits recorded from tourism activity this month.</small>
              </article>

              <article className="tm-dashboard-card tm-dashboard-card--revenue">
                <div className="tm-dashboard-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <span>Monthly Revenue</span>
                <strong>{formatCurrency(analytics.income?.cards?.totalIncome || 0)}</strong>
                <small>Paid tourism income recognized from the current monthly data.</small>
              </article>

              <article className="tm-dashboard-card tm-dashboard-card--walkin">
                <div className="tm-dashboard-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <path d="M3 11l9-8 9 8" />
                    <path d="M5 10v10a1 1 0 0 0 1 1h3" />
                    <path d="M15 21h3a1 1 0 0 0 1-1V10" />
                    <path d="M9 21h6" />
                  </svg>
                </div>
                <span>Walk-in Bookings</span>
                <strong>{analytics.walkIn?.cards?.walkInBookings || 0}</strong>
                <small>Walk-in guest bookings captured for the tourism manager scope.</small>
              </article>

              <article className="tm-dashboard-card tm-dashboard-card--reports">
                <div className="tm-dashboard-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <span>Province Reports</span>
                <strong>{provinceCards.totalReports || 0}</strong>
                <small>Combined uploaded reports visible to the tourism manager role.</small>
              </article>

              <article className="tm-dashboard-card tm-dashboard-card--pending">
                <div className="tm-dashboard-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span>Pending Reports</span>
                <strong>{provinceCards.pendingReports || 0}</strong>
                <small>Report files still waiting for review or approval.</small>
              </article>

              <article className="tm-dashboard-card tm-dashboard-card--approved">
                <div className="tm-dashboard-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <span>Approved Reports</span>
                <strong>{provinceCards.approvedReports || 0}</strong>
                <small>Report files already approved in the monitoring stream.</small>
              </article>
            </section>

            <section className="tm-dashboard-chart-grid">
              <article className="tm-dashboard-panel tm-dashboard-panel--wide">
                <div className="tm-panel-header">
                  <div>
                    <h3>Total Visits Trend</h3>
                    <p>Guest volume and booking counts from the analytics API.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analytics.guestCount?.series || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e4db" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="guestCount" stroke="#116735" strokeWidth={2.5} name="Guests" />
                    <Line type="monotone" dataKey="bookingCount" stroke="#2563eb" strokeWidth={2.5} name="Bookings" />
                  </LineChart>
                </ResponsiveContainer>
              </article>

              <article className="tm-dashboard-panel">
                <div className="tm-panel-header">
                  <div>
                    <h3>Booking Status</h3>
                    <p>Status mix across the current monthly records.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={bookingStatusChart} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
                      {bookingStatusChart.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </article>

              <article className="tm-dashboard-panel tm-dashboard-panel--wide">
                <div className="tm-panel-header">
                  <div>
                    <h3>Revenue Statistics</h3>
                    <p>Revenue history from the backend income report.</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.income?.series || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d9e4db" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="income" fill="#116735" radius={[6, 6, 0, 0]} name="Income" />
                  </BarChart>
                </ResponsiveContainer>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
