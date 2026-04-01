import { useEffect, useMemo, useState } from "react";
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
import Sidebar from "../../components/Sidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import "./Dashboard.css";

const SAMPLE = {
  totalAccommodations: 0,
  totalTouristSpots: 0,
  totalApplications: 0,
  totalFeedback: 0,
  applicationsByMonth: [
    { month: "Jan", count: 0 },
    { month: "Feb", count: 0 },
    { month: "Mar", count: 0 },
    { month: "Apr", count: 0 },
    { month: "May", count: 0 },
    { month: "Jun", count: 0 },
    { month: "Jul", count: 0 },
    { month: "Aug", count: 0 },
    { month: "Sep", count: 0 },
    { month: "Oct", count: 0 },
    { month: "Nov", count: 0 },
    { month: "Dec", count: 0 },
  ],
  accommodationGrowth: [
    { period: "Jan", value: 0 },
    { period: "Feb", value: 0 },
    { period: "Mar", value: 0 },
    { period: "Apr", value: 0 },
    { period: "May", value: 0 },
    { period: "Jun", value: 0 },
    { period: "Jul", value: 0 },
    { period: "Aug", value: 0 },
    { period: "Sep", value: 0 },
    { period: "Oct", value: 0 },
    { period: "Nov", value: 0 },
    { period: "Dec", value: 0 },
  ],
  applicationStatus: [
    { name: "Pending", value: 0 },
    { name: "Verified", value: 0 },
    { name: "Rejected", value: 0 },
  ],
};

const WAVE = "M0,20 C45,5 90,35 135,20 C180,5 225,35 270,20 C315,5 360,35 405,20 L405,55 L0,55 Z";
const PIE_COLORS = ["#f59e0b", "#116735", "#dc2626"];

const CARDS = [
  {
    key: "accommodations",
    label: "Total Accommodations",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    getValue: (stats) => stats.totalAccommodations,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    key: "touristSpots",
    label: "Total Tourist Spots",
    gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    getValue: (stats) => stats.totalTouristSpots,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M12 2l4 7h-8l4-7z" />
        <path d="M5 10l4 12H1L5 10z" />
        <path d="M19 10l4 12h-8l4-12z" />
      </svg>
    ),
  },
  {
    key: "applications",
    label: "Owner Applications",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    getValue: (stats) => stats.totalApplications,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: "feedback",
    label: "Total Feedback",
    gradient: "linear-gradient(135deg, #116735 0%, #4caf7d 100%)",
    getValue: (stats) => stats.totalFeedback,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const axisStyle = { fontSize: 11, fill: "#9ca3af" };
const gridColor = "#f3f4f6";

function buildMonthlyCounts(items, dateKey) {
  const monthMap = new Map(
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => [
      month,
      0,
    ])
  );

  items.forEach((item) => {
    const rawDate = item?.[dateKey];
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return;
    const month = date.toLocaleDateString("en-US", { month: "short" });
    monthMap.set(month, (monthMap.get(month) || 0) + 1);
  });

  return Array.from(monthMap.entries()).map(([month, count]) => ({ month, count }));
}

const CustomTooltipLine = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pod-tooltip">
      <p className="pod-tooltip-label">{label}</p>
      <p className="pod-tooltip-value">{payload[0].value} applications</p>
    </div>
  );
};

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pod-tooltip">
      <p className="pod-tooltip-label">{label}</p>
      <p className="pod-tooltip-value">{payload[0].value} listings</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent === 0) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [chartsReady, setChartsReady] = useState(false);
  const [stats, setStats] = useState(SAMPLE);
  const [notifications, setNotifications] = useState([]);
  const adminAuthHeaders = useMemo(() => buildAuthHeaders("admin"), []);

  useEffect(() => {
    setTimeout(() => setChartsReady(true), 150);

    const loadDashboardStats = async () => {
      try {
        const [applicationsRes, touristSpotsRes, accommodationsRes, notificationsRes] = await Promise.all([
          fetch(`${API_URL}/admin/property-owners`, { headers: adminAuthHeaders }),
          fetch(`${API_URL}/tourist-spots`, { headers: adminAuthHeaders }),
          fetch(`${API_URL}/accommodations`, { headers: adminAuthHeaders }).catch(() => null),
          fetch(`${API_URL}/admin/notifications`, { headers: adminAuthHeaders }).catch(() => null),
        ]);

        const applications = applicationsRes.ok ? await applicationsRes.json() : [];
        const touristSpots = touristSpotsRes.ok ? await touristSpotsRes.json() : [];
        const accommodations = accommodationsRes?.ok ? await accommodationsRes.json() : [];

        const reviewCollections = await Promise.all(
          touristSpots.map(async (spot) => {
            try {
              const response = await fetch(`${API_URL}/tourist-reviews/${spot._id}`);
              return response.ok ? await response.json() : { reviews: [] };
            } catch {
              return { reviews: [] };
            }
          })
        );

        const totalFeedback = reviewCollections.reduce(
          (sum, collection) => sum + (Array.isArray(collection.reviews) ? collection.reviews.length : 0),
          0
        );

        const totalAccommodations = Array.isArray(accommodations) ? accommodations.length : 0;

        const applicationsByMonth = buildMonthlyCounts(applications, "createdAt");
        const accommodationGrowth = buildMonthlyCounts(
          Array.isArray(accommodations) && accommodations.length > 0 ? accommodations : applications,
          "createdAt"
        ).map((item) => ({ period: item.month, value: item.count }));

        const statusTotals = {
          Pending: applications.filter((item) => item.status === "PENDING").length,
          Verified: applications.filter((item) => item.status === "VERIFIED").length,
          Rejected: applications.filter((item) => item.status === "REJECTED").length,
        };

        setStats({
          totalAccommodations,
          totalTouristSpots: Array.isArray(touristSpots) ? touristSpots.length : 0,
          totalApplications: Array.isArray(applications) ? applications.length : 0,
          totalFeedback,
          applicationsByMonth,
          accommodationGrowth,
          applicationStatus: [
            { name: "Pending", value: statusTotals.Pending },
            { name: "Verified", value: statusTotals.Verified },
            { name: "Rejected", value: statusTotals.Rejected },
          ],
        });
        setNotifications(notificationsRes?.ok ? await notificationsRes.json() : []);
      } catch (error) {
        console.error("Failed to load admin dashboard stats:", error);
      }
    };

    loadDashboardStats();
  }, [adminAuthHeaders]);

  const chartStatusData = useMemo(() => stats.applicationStatus || [], [stats.applicationStatus]);
  const unreadNotifications = notifications.filter((item) => !item.isRead).length;

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/admin/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: adminAuthHeaders,
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) =>
        current.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
      );
    } catch (error) {
      console.error("Failed to mark admin notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/notifications/read-all`, {
        method: "PATCH",
        headers: adminAuthHeaders,
      });

      if (!response.ok) {
        return;
      }

      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all admin notifications as read:", error);
    }
  };

  return (
    <div className="property-owner-layout admin-dashboard-layout">
      <Sidebar active="dashboard" isHidden={isSidebarHidden} setIsHidden={setIsSidebarHidden} />

      <main className="property-owner-main admin-dashboard-main">
        <div className="pod-header">
          <div className="pod-header-text">
            {isSidebarHidden ? (
              <MenuButton
                onClick={(event) => {
                  event.stopPropagation();
                  setIsSidebarHidden(false);
                }}
              />
            ) : null}
          </div>
        </div>


        <div className="pod-stats-grid">
          {CARDS.map((card) => (
            <div key={card.key} className="pod-stat-card" style={{ background: card.gradient }}>
              <div className="pod-stat-top">
                <div>
                  <h3 className="pod-stat-value">{card.getValue(stats)}</h3>
                  <p className="pod-stat-label">{card.label}</p>
                </div>
                <div className="pod-stat-icon">{card.icon}</div>
              </div>

              <div className="pod-stat-wave">
                <svg viewBox="0 0 405 55" preserveAspectRatio="none" width="100%" height="55">
                  <path d={WAVE} fill="rgba(255,255,255,0.15)" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="pod-charts-grid">
          <div className="pod-chart-card pod-chart-card--wide">
            <div className="pod-chart-header">
              <div>
                <h4 className="pod-chart-title">Applications by Month</h4>
                <p className="pod-chart-sub">Property owner applications received across the year</p>
              </div>
              <span className="pod-live-dot" />
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={chartsReady ? stats.applicationsByMonth : []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipLine />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#116735"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#116735", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6, fill: "#116735" }}
                  isAnimationActive
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pod-chart-card">
            <div className="pod-chart-header">
              <div>
                <h4 className="pod-chart-title">Application Status</h4>
                <p className="pod-chart-sub">Pending, verified, and rejected submissions</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={chartsReady ? chartStatusData : []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                  isAnimationActive
                  animationDuration={1200}
                  animationEasing="ease-out"
                >
                  {chartStatusData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} applications`]}
                  contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "white", fontSize: 13 }}
                />
                <Legend iconType="circle" formatter={(value) => <span style={{ fontSize: 12, color: "#374151" }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pod-chart-card pod-chart-card--wide">
            <div className="pod-chart-header">
              <div>
                <h4 className="pod-chart-title">Listings Added by Month</h4>
                <p className="pod-chart-sub">Accommodation growth trend based on available listing records</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartsReady ? stats.accommodationGrowth : []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="period" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipBar />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={1400} animationEasing="ease-out">
                  {stats.accommodationGrowth.map((_, index) => (
                    <Cell key={index} fill={index === stats.accommodationGrowth.length - 1 ? "#4caf7d" : "#116735"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <section className="admin-activity-card">
          <div className="admin-activity-header">
            <div>
              <span className="admin-dashboard-kicker">Status Events</span>
              <h2>Recent booking and report activity</h2>
              <p>
                Stored admin notifications surface tourist-spot booking edits and status changes without
                requiring a real-time system.
              </p>
            </div>

            <button type="button" className="admin-activity-read-all" onClick={markAllNotificationsAsRead}>
              Mark All Read{unreadNotifications ? ` (${unreadNotifications})` : ""}
            </button>
          </div>

          <div className="admin-activity-list">
            {notifications.length === 0 ? (
              <div className="admin-activity-empty">No admin notifications yet.</div>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <article
                  key={notification._id}
                  className={`admin-activity-item ${notification.isRead ? "" : "admin-activity-item--unread"}`}
                >
                  <div>
                    <strong>{notification.title || "System update"}</strong>
                    <p>{notification.message || "No message available."}</p>
                    <small>{new Date(notification.createdAt).toLocaleString("en-PH")}</small>
                  </div>

                  <div className="admin-activity-meta">
                    {notification.status ? <span>{notification.status}</span> : null}
                    {!notification.isRead ? (
                      <button type="button" onClick={() => markNotificationAsRead(notification._id)}>
                        Mark as Read
                      </button>
                    ) : (
                      <small>Read</small>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
