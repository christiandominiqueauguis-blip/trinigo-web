import "./PropertyOwnerDashboard.css";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { useState, useEffect } from "react";
import MenuButton from "../../components/MenuButton";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

/* ── Sample data for preview (replaced by real API data when available) ── */
const SAMPLE = {
  activeBookings: 24,
  totalRevenue: 128500,
  upcomingCheckIns: 7,
  totalRoomTypes: 5,
  bookingsByMonth: [
    { month: "Jan", count: 4 },
    { month: "Feb", count: 7 },
    { month: "Mar", count: 5 },
    { month: "Apr", count: 10 },
    { month: "May", count: 8 },
    { month: "Jun", count: 13 },
    { month: "Jul", count: 11 },
    { month: "Aug", count: 16 },
    { month: "Sep", count: 9 },
    { month: "Oct", count: 14 },
    { month: "Nov", count: 18 },
    { month: "Dec", count: 24 },
  ],
  monthlyIncome: [
    { period: "Jan", income: 8000 },
    { period: "Feb", income: 12500 },
    { period: "Mar", income: 9200 },
    { period: "Apr", income: 15000 },
    { period: "May", income: 11300 },
    { period: "Jun", income: 18700 },
    { period: "Jul", income: 14400 },
    { period: "Aug", income: 21000 },
    { period: "Sep", income: 13600 },
    { period: "Oct", income: 17800 },
    { period: "Nov", income: 22500 },
    { period: "Dec", income: 128500 },
  ],
  yearlyIncome: [
    { period: "2020", income: 45000 },
    { period: "2021", income: 72000 },
    { period: "2022", income: 98000 },
    { period: "2023", income: 115000 },
    { period: "2024", income: 128500 },
  ],
  paymentTypes: [
    { name: "Online Payment", value: 17 },
    { name: "Walk-in", value: 7 },
  ],
};

const WAVE = "M0,20 C45,5 90,35 135,20 C180,5 225,35 270,20 C315,5 360,35 405,20 L405,55 L0,55 Z";

const CARDS = [
  {
    key: "bookings",
    label: "Active Bookings",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
    getValue: (s) => s.activeBookings,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M9 16l2 2 4-4"/>
      </svg>
    ),
  },
  {
    key: "revenue",
    label: "Total Revenue",
    gradient: "linear-gradient(135deg, #0891b2 0%, #22d3ee 100%)",
    getValue: (s) => `₱${s.totalRevenue.toLocaleString()}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    key: "checkins",
    label: "Upcoming Check-ins",
    gradient: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
    getValue: (s) => s.upcomingCheckIns,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    key: "rooms",
    label: "Total Room Types",
    gradient: "linear-gradient(135deg, #116735 0%, #4caf7d 100%)",
    getValue: (s) => s.totalRoomTypes,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" width="26" height="26">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
];

const PIE_COLORS = ["#116735", "#4caf7d"];

const CustomTooltipLine = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pod-tooltip">
      <p className="pod-tooltip-label">{label}</p>
      <p className="pod-tooltip-value">{payload[0].value} bookings</p>
    </div>
  );
};

const CustomTooltipBar = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="pod-tooltip">
      <p className="pod-tooltip-label">{label}</p>
      <p className="pod-tooltip-value">₱{payload[0].value.toLocaleString()}</p>
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
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PropertyOwnerDashboard() {
  const ownerId = localStorage.getItem("ownerId") || "";
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [stats, setStats] = useState(SAMPLE);
  const [incomeView, setIncomeView] = useState("monthly");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    setTimeout(() => setChartsReady(true), 150);
    const query = ownerId ? `?ownerId=${encodeURIComponent(ownerId)}` : "";
    fetch(`${API_URL}/property-owner/dashboard-stats${query}`, {
      headers: buildAuthHeaders("propertyOwner"),
    })
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {}); // keep sample data on error
  }, [ownerId]);

  const incomeData = incomeView === "monthly" ? stats.monthlyIncome : stats.yearlyIncome;

  const axisStyle = { fontSize: 11, fill: "#9ca3af" };
  const gridColor = "#f3f4f6";

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="dashboard"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main">

        {/* ── HEADER ── */}
        <div className="pod-header">
          <div className="pod-header-text">
            {sidebarHidden && (
              <MenuButton onClick={(e) => { e.stopPropagation(); setSidebarHidden(false); }} />
            )}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="pod-stats-grid">
          {CARDS.map((c) => (
            <div key={c.key} className="pod-stat-card" style={{ background: c.gradient }}>
              <div className="pod-stat-top">
                <div>
                  <h3 className="pod-stat-value">{c.getValue(stats)}</h3>
                  <p className="pod-stat-label">{c.label}</p>
                </div>
                <div className="pod-stat-icon">{c.icon}</div>
              </div>
              <div className="pod-stat-wave">
                <svg viewBox="0 0 405 55" preserveAspectRatio="none" width="100%" height="55">
                  <path d={WAVE} fill="rgba(255,255,255,0.15)" />
                </svg>
              </div>
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div className="pod-charts-grid">

          {/* LINE CHART */}
          <div className="pod-chart-card pod-chart-card--wide">
            <div className="pod-chart-header">
              <div>
                <h4 className="pod-chart-title">Bookings by Month</h4>
                <p className="pod-chart-sub">Real-time booking activity (last 12 months)</p>
              </div>
              <span className="pod-live-dot" />
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={chartsReady ? stats.bookingsByMonth : []}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipLine />} />
                <Line
                  type="monotone" dataKey="count" stroke="#116735" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#116735", strokeWidth: 2, stroke: "white" }}
                  activeDot={{ r: 6, fill: "#116735" }}
                  isAnimationActive animationDuration={1400} animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* PIE CHART */}
          <div className="pod-chart-card">
            <div className="pod-chart-header">
              <div>
                <h4 className="pod-chart-title">Payment Method</h4>
                <p className="pod-chart-sub">Online vs Walk-in</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={chartsReady ? stats.paymentTypes : []}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={renderPieLabel}
                  isAnimationActive animationDuration={1200} animationEasing="ease-out"
                >
                  {stats.paymentTypes.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} bookings`]}
                  contentStyle={{ background: "#1f2937", border: "none", borderRadius: 8, color: "white", fontSize: 13 }}
                />
                <Legend
                  iconType="circle"
                  formatter={(v) => <span style={{ fontSize: 12, color: "#374151" }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BAR CHART */}
          <div className="pod-chart-card pod-chart-card--wide">
            <div className="pod-chart-header">
              <div>
                <h4 className="pod-chart-title">Income Overview</h4>
                <p className="pod-chart-sub">Revenue from approved bookings</p>
              </div>
              <select
                className="pod-income-select"
                value={incomeView}
                onChange={(e) => setIncomeView(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={chartsReady ? incomeData : []}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="period" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => v === 0 ? "₱0" : `₱${(v / 1000).toFixed(0)}k`}
                  tick={axisStyle} axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltipBar />} />
                <Bar dataKey="income" radius={[6, 6, 0, 0]}
                  isAnimationActive animationDuration={1400} animationEasing="ease-out">
                  {incomeData.map((_, i) => (
                    <Cell key={i} fill={i === incomeData.length - 1 ? "#4caf7d" : "#116735"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </main>
    </div>
  );
}
