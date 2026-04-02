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
import TourismManagerSidebar from "../../components/TourismManagerSidebar";
import MenuButton from "../../components/MenuButton";
import AnalyticsReportBuilder from "../../components/AnalyticsReportBuilder";
import "./TourismManagerReports.css";
import { API_URL, BASE_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

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

function formatDateTime(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(size) {
  const numeric = Number(size || 0);

  if (numeric < 1024 * 1024) {
    return `${(numeric / 1024).toFixed(2)} KB`;
  }

  return `${(numeric / (1024 * 1024)).toFixed(2)} MB`;
}

function getReportPreviewPath(filePath) {
  if (!filePath) return "";
  if (String(filePath).startsWith("http")) return filePath;
  return `${BASE_URL}${filePath}`;
}

function createEmptyProvinceCards() {
  return {
    totalReports: 0,
    pendingReports: 0,
    approvedReports: 0,
    sourcesTracked: 0,
  };
}

export default function TourismManagerReports() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [touristSpots, setTouristSpots] = useState([]);
  const [selectedSpotId, setSelectedSpotId] = useState("");
  const [myUploads, setMyUploads] = useState([]);
  const [provinceReports, setProvinceReports] = useState([]);
  const [provinceCards, setProvinceCards] = useState(createEmptyProvinceCards());
  const [analytics, setAnalytics] = useState({
    guestCount: null,
    income: null,
    bookingStatus: null,
    establishmentPerformance: null,
    touristOrigin: null,
    walkIn: null,
  });
  const [period, setPeriod] = useState("monthly");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);

  const managerId = localStorage.getItem("tourismManagerId") || "";
  const authHeaders = useMemo(() => buildAuthHeaders("tourismManager"), []);
  const selectedSpot = touristSpots.find((spot) => spot._id === selectedSpotId);

  const loadUploads = useCallback(async () => {
    const response = await fetch(`${API_URL}/tourist-spot-reports`, {
      headers: authHeaders,
    });

    const data = await response.json();
    const reports = Array.isArray(data) ? data : [];
    const mine = reports
      .filter((item) => String(item.managerId || "") === String(managerId))
      .map((item) => ({
        _id: item._id,
        file: {
          name: item.fileName,
          size: item.fileSize,
          type: item.fileType,
        },
        preview: getReportPreviewPath(item.filePath),
        uploadedAt: new Date(item.createdAt),
        status: item.status,
        touristSpotName: item.touristSpotName,
      }));

    setMyUploads(mine);
  }, [authHeaders, managerId]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setDashboardError("");

    try {
      const query = `?period=${encodeURIComponent(period)}`;
      const [
        touristSpotsResponse,
        guestCountResponse,
        incomeResponse,
        bookingStatusResponse,
        establishmentResponse,
        originResponse,
        walkInResponse,
        provinceReportsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/tourist-spots`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/guest-count${query}`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/income${query}`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/booking-status${query}`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/establishment-performance${query}`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/tourist-origin${query}`, { headers: authHeaders }),
        fetch(`${API_URL}/analytics/reports/walk-in${query}`, { headers: authHeaders }),
        fetch(`${API_URL}/tourism-site-manager/report-monitor`, { headers: authHeaders }),
      ]);

      const responses = [
        touristSpotsResponse,
        guestCountResponse,
        incomeResponse,
        bookingStatusResponse,
        establishmentResponse,
        originResponse,
        walkInResponse,
        provinceReportsResponse,
      ];
      const failedResponse = responses.find((response) => !response.ok);

      if (failedResponse) {
        const failedPayload = await failedResponse.json().catch(() => ({}));
        throw new Error(failedPayload.message || "Failed to load tourism manager dashboard data.");
      }

      const touristSpotsData = await touristSpotsResponse.json();
      const guestCountData = await guestCountResponse.json();
      const incomeData = await incomeResponse.json();
      const bookingStatusData = await bookingStatusResponse.json();
      const establishmentData = await establishmentResponse.json();
      const originData = await originResponse.json();
      const walkInData = await walkInResponse.json();
      const provinceMonitorData = await provinceReportsResponse.json();

      setTouristSpots(Array.isArray(touristSpotsData) ? touristSpotsData : []);
      setAnalytics({
        guestCount: guestCountData,
        income: incomeData,
        bookingStatus: bookingStatusData,
        establishmentPerformance: establishmentData,
        touristOrigin: originData,
        walkIn: walkInData,
      });
      setProvinceCards(provinceMonitorData.cards || createEmptyProvinceCards());
      setProvinceReports(Array.isArray(provinceMonitorData.reports) ? provinceMonitorData.reports : []);

      await loadUploads();
    } catch (error) {
      console.error("Failed to load tourism manager dashboard data", error);
      setDashboardError(error.message || "Failed to load dashboard data.");
      setTouristSpots([]);
      setProvinceReports([]);
      setMyUploads([]);
      setProvinceCards(createEmptyProvinceCards());
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders, loadUploads, period]);

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

  const topOrigins = useMemo(
    () => (analytics.touristOrigin?.table || []).slice(0, 5),
    [analytics.touristOrigin]
  );

  const topEstablishments = useMemo(
    () => (analytics.establishmentPerformance?.table || []).slice(0, 5),
    [analytics.establishmentPerformance]
  );

  const handleUpload = async () => {
    if (!selectedFiles.length) return;

    if (!selectedSpot) {
      alert("Please select a tourist spot first.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    const managerName =
      localStorage.getItem("tourismManagerName") ||
      localStorage.getItem("tourismManagerFullName") ||
      "";

    formData.append("managerId", managerId);
    formData.append("managerName", managerName);
    formData.append("touristSpotName", selectedSpot.name);
    formData.append("touristSpotLocation", selectedSpot.address);

    selectedFiles.forEach((item) => {
      formData.append("reports", item.file);
    });

    try {
      const response = await fetch(`${API_URL}/tourist-spot-reports`, {
        method: "POST",
        headers: authHeaders,
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Failed to upload reports.");
        return;
      }

      setSelectedFiles([]);
      setSelectedSpotId("");
      await loadDashboardData();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="property-owner-layout">
      <TourismManagerSidebar
        active="reports"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className={`tm-dashboard-main ${sidebarHidden ? "full-width" : ""}`}>
        <section className="tm-compact-toolbar">
          <div className="tm-compact-toolbar-left">
            {sidebarHidden ? (
              <MenuButton
                onClick={(event) => {
                  event.stopPropagation();
                  setSidebarHidden(false);
                }}
              />
            ) : null}
            <span className="tm-compact-kicker">Report Center</span>
          </div>

          <div className="tm-dashboard-controls tm-dashboard-controls--inline">
            <label>
              <span>Reporting Period</span>
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

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
              <article className="tm-dashboard-card">
                <span>Total Guests</span>
                <strong>{analytics.guestCount?.cards?.totalGuests || 0}</strong>
                <small>Guest count from the analytics backend</small>
              </article>
              <article className="tm-dashboard-card">
                <span>Total Income</span>
                <strong>{formatCurrency(analytics.income?.cards?.totalIncome || 0)}</strong>
                <small>Paid booking income for the selected period</small>
              </article>
              <article className="tm-dashboard-card">
                <span>Walk-in Bookings</span>
                <strong>{analytics.walkIn?.cards?.walkInBookings || 0}</strong>
                <small>Province-wide walk-in booking activity</small>
              </article>
              <article className="tm-dashboard-card">
                <span>Province Reports</span>
                <strong>{provinceCards.totalReports || 0}</strong>
                <small>Combined owner and tourist spot submissions</small>
              </article>
              <article className="tm-dashboard-card tm-dashboard-card--accent">
                <span>Pending Reports</span>
                <strong>{provinceCards.pendingReports || 0}</strong>
                <small>Items that still need follow-up or review</small>
              </article>
              <article className="tm-dashboard-card tm-dashboard-card--accent">
                <span>Approved Reports</span>
                <strong>{provinceCards.approvedReports || 0}</strong>
                <small>Submissions already approved in the system</small>
              </article>
              <article className="tm-dashboard-card tm-dashboard-card--accent">
                <span>Sources Tracked</span>
                <strong>{provinceCards.sourcesTracked || 0}</strong>
                <small>Separate report streams feeding the province monitor</small>
              </article>
            </section>

            <section className="tm-dashboard-chart-grid">
              <article className="tm-dashboard-panel tm-dashboard-panel--wide">
                <div className="tm-panel-header">
                  <div>
                    <h3>Guest Count Trend</h3>
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
                    <p>Status mix across the tracked period.</p>
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
                    <h3>Income Overview</h3>
                    <p>Recognized booking income from the backend income report.</p>
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

            <section className="tm-dashboard-table-grid">
              <article className="tm-dashboard-panel">
                <div className="tm-panel-header">
                  <div>
                    <h3>Top Tourist Origins</h3>
                    <p>Most common origins based on the analytics report.</p>
                  </div>
                </div>

                <div className="tm-rank-list">
                  {topOrigins.length === 0 ? (
                    <p className="tm-empty-copy">No tourist origin data is available for this period.</p>
                  ) : (
                    topOrigins.map((entry) => (
                      <div key={entry.origin} className="tm-rank-row">
                        <div>
                          <strong>{entry.origin}</strong>
                          <small>{entry.bookingCount} bookings</small>
                        </div>
                        <span>{entry.guestCount} guests</span>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="tm-dashboard-panel">
                <div className="tm-panel-header">
                  <div>
                    <h3>Top Establishments</h3>
                    <p>Performance based on bookings, guests, and paid income.</p>
                  </div>
                </div>

                <div className="tm-rank-list">
                  {topEstablishments.length === 0 ? (
                    <p className="tm-empty-copy">No establishment performance data is available yet.</p>
                  ) : (
                    topEstablishments.map((entry) => (
                      <div key={entry.establishmentName} className="tm-rank-row">
                        <div>
                          <strong>{entry.establishmentName}</strong>
                          <small>{entry.bookingCount} bookings · {entry.guestCount} guests</small>
                        </div>
                        <span>{formatCurrency(entry.income)}</span>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="tm-report-builder-section">
              <AnalyticsReportBuilder
                role="tourismManager"
                scopeLabel="Province-wide tourism analytics"
                embedded
              />
            </section>

            <section className="tm-dashboard-panel">
              <div className="tm-panel-header">
                <div>
                  <h3>Province Report Monitoring</h3>
                  <p>
                    Legacy uploaded-file reports from property owners and tourist spot submissions stay
                    visible here for province monitoring.
                  </p>
                </div>
                <div className="tm-report-monitor-cards">
                  <span>Total: {provinceCards.totalReports || 0}</span>
                  <span>Pending: {provinceCards.pendingReports || 0}</span>
                  <span>Approved: {provinceCards.approvedReports || 0}</span>
                </div>
              </div>

              <div className="tm-monitor-table">
                {provinceReports.length === 0 ? (
                  <p className="tm-empty-copy">No province-level report submissions are available yet.</p>
                ) : (
                  provinceReports.slice(0, 12).map((report) => (
                    <div key={`${report.reportSource}-${report.id}`} className="tm-monitor-row">
                      <div className="tm-monitor-primary">
                        <strong>{report.fileName}</strong>
                        <small>{report.reportSource} · {report.submittedBy}</small>
                      </div>
                      <div className="tm-monitor-secondary">
                        <span>{report.locationLabel}</span>
                        <small>{report.secondaryLabel || "Province record"}</small>
                      </div>
                      <div className="tm-monitor-meta">
                        <span className={`tm-report-pill tm-report-pill--${String(report.status || "pending").toLowerCase()}`}>
                          {report.status || "Pending"}
                        </span>
                        <small>{formatDateTime(report.createdAt)}</small>
                      </div>
                      <a
                        href={getReportPreviewPath(report.filePath)}
                        target="_blank"
                        rel="noreferrer"
                        className="tm-report-link"
                      >
                        Open
                      </a>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="tm-dashboard-panel">
              <div className="tm-panel-header">
                <div>
                  <h3>Tourist Spot Upload Workflow</h3>
                  <p>
                    The existing upload flow is preserved here so tourism site managers can still submit
                    tourist spot report files when needed.
                  </p>
                </div>
              </div>

              <div className="tm-upload-grid">
                <div className="tm-upload-box">
                  <h4>Submit New Tourist Spot Report</h4>
                  <p>Select a tourist spot, upload supporting files, and submit them into the existing report collection.</p>

                  <select
                    value={selectedSpotId}
                    onChange={(event) => setSelectedSpotId(event.target.value)}
                    className="tm-spot-select"
                  >
                    <option value="">-- Select Tourist Spot --</option>
                    {touristSpots.map((spot) => (
                      <option key={spot._id} value={spot._id}>
                        {spot.name}
                      </option>
                    ))}
                  </select>

                  <div className="tm-upload-actions">
                    <input
                      type="file"
                      id="tmReportUpload"
                      multiple
                      hidden
                      onChange={(event) => {
                        const files = Array.from(event.target.files || []).map((file) => ({
                          file,
                          preview: URL.createObjectURL(file),
                        }));
                        setSelectedFiles((current) => [...current, ...files]);
                        event.target.value = null;
                      }}
                    />
                    <button
                      type="button"
                      className="upload-btn"
                      onClick={() => document.getElementById("tmReportUpload")?.click()}
                    >
                      + Upload Files
                    </button>
                    <button type="button" className="submit-btn" onClick={handleUpload} disabled={isUploading}>
                      {isUploading ? "Submitting..." : "Submit"}
                    </button>
                  </div>

                  {selectedFiles.length > 0 ? (
                    <div className="selected-files">
                      {selectedFiles.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} className="selected-file-item">
                          <button
                            type="button"
                            className="remove-file"
                            onClick={() =>
                              setSelectedFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
                            }
                          >
                            ×
                          </button>

                          {item.file.type.startsWith("image/") ? (
                            <img src={item.preview} alt={item.file.name} className="file-preview-image" />
                          ) : (
                            <span className="file-name">{item.file.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="tm-upload-box">
                  <h4>My Submitted Reports</h4>
                  <p>Your recent uploads remain visible here for easy follow-up and cleanup.</p>

                  <div className="tm-my-uploads">
                    {myUploads.length === 0 ? (
                      <p className="tm-empty-copy">No uploads yet.</p>
                    ) : (
                      myUploads.slice(0, 8).map((item, index) => (
                        <div key={item._id} className="upload-item" style={{ cursor: "pointer", position: "relative" }}>
                          <span className={`report-status-badge ${item.status === "Approved" ? "status-confirmed" : "status-pending"}`}>
                            {item.status === "Approved" ? "Confirmed" : "Pending"}
                          </span>

                          <div
                            className="menu-dots"
                            onClick={(event) => {
                              event.stopPropagation();
                              setActiveMenuIndex(index);
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                              <circle cx="12" cy="5" r="2" fill="#555" />
                              <circle cx="12" cy="12" r="2" fill="#555" />
                              <circle cx="12" cy="19" r="2" fill="#555" />
                            </svg>
                          </div>

                          {activeMenuIndex === index ? (
                            <div className="delete-modal" onClick={(event) => event.stopPropagation()}>
                              <button className="cancel-btn" onClick={() => setActiveMenuIndex(null)}>
                                Cancel
                              </button>
                              <button
                                className="confirm-delete-btn"
                                onClick={async () => {
                                  await fetch(`${API_URL}/tourist-spot-reports/${item._id}`, {
                                    method: "DELETE",
                                    headers: authHeaders,
                                  });
                                  await loadDashboardData();
                                  setActiveMenuIndex(null);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          ) : null}

                          <div className="file-icon" onClick={() => window.open(item.preview, "_blank", "noopener,noreferrer")}>
                            {item.file.type.includes("pdf") ? (
                              <svg viewBox="0 0 24 24" width="40" height="40">
                                <path fill="#E53935" d="M6 2h7l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                                <text x="12" y="17" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">PDF</text>
                              </svg>
                            ) : item.file.type.startsWith("image/") ? (
                              <img src={item.preview} alt={item.file.name} className="recent-image-thumb" />
                            ) : (
                              <svg viewBox="0 0 24 24" width="40" height="40">
                                <path fill="#1E88E5" d="M6 2h7l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                                <text x="12" y="17" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">DOCX</text>
                              </svg>
                            )}
                          </div>

                          <div className="file-info">
                            <p>{item.file.name}</p>
                            <span>{item.touristSpotName || "Tourist spot"} · {formatFileSize(item.file.size)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
