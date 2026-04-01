import { useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import MenuButton from "../../components/MenuButton";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import "./Reports.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    value: "booking-status",
    label: "Total Bookings",
    endpoint: "booking-status",
    chartKind: "pie",
    description: "Breakdown of all bookings by status across the selected period.",
  },
  {
    value: "income",
    label: "Total Revenue",
    endpoint: "income",
    chartKind: "bar",
    description: "Revenue from online and walk-in bookings for the selected period.",
  },
  {
    value: "guest-count",
    label: "Total Guests",
    endpoint: "guest-count",
    chartKind: "line",
    description: "Guest volume and booking counts over the selected period.",
  },
];

const PERIODS = [
  { value: "daily",   label: "Daily" },
  { value: "weekly",  label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly",  label: "Yearly" },
];

const PIE_COLORS = ["#116735", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed"];

const CARD_LABELS = {
  totalGuests: "Total Guests",
  totalBookings: "Total Bookings",
  averageGuestsPerBooking: "Avg. Guests / Booking",
  totalIncome: "Total Revenue",
  onlineIncome: "Online Revenue",
  walkInIncome: "Walk-in Revenue",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency", currency: "PHP", maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PH").format(Number(value || 0));
}

function formatDateTimeStr(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  const lk = String(key).toLowerCase();
  if (lk.includes("income") || lk.includes("revenue") || lk.includes("amount") || lk.includes("total") && lk.includes("inc")) {
    return formatCurrency(value);
  }
  if (typeof value === "number") return Number.isInteger(value) ? formatNumber(value) : Number(value).toFixed(2);
  return String(value);
}

function toTitleCase(str) {
  return String(str || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function slugify(str) {
  return String(str).toLowerCase().replace(/\s+/g, "-");
}

function getColumns(rows) {
  const keys = new Set();
  rows.forEach((r) => Object.keys(r || {}).forEach((k) => keys.add(k)));
  return Array.from(keys);
}

function buildCardEntries(cards, reportType) {
  if (!cards) return [];

  if (reportType === "booking-status") {
    return ["pending", "completed", "cancelled", "rejected"]
      .filter((k) => cards[k] !== undefined && cards[k] !== null)
      .map((k) => ({ key: k, label: CARD_LABELS[k] || toTitleCase(k), value: formatNumber(cards[k]) }));
  }

  if (reportType === "income") {
    return ["totalIncome", "onlineIncome", "walkInIncome"]
      .filter((k) => cards[k] !== undefined)
      .map((k) => ({ key: k, label: CARD_LABELS[k] || toTitleCase(k), value: formatCurrency(cards[k]) }));
  }

  // guest-count
  return ["totalGuests", "totalBookings", "averageGuestsPerBooking"]
    .filter((k) => cards[k] !== undefined)
    .map((k) => ({ key: k, label: CARD_LABELS[k] || toTitleCase(k), value: formatNumber(cards[k]) }));
}

function buildChartData(reportType, report) {
  const series = Array.isArray(report?.series) ? report.series : [];
  const cards = report?.cards || {};

  if (reportType === "booking-status") {
    return {
      kind: "pie",
      data: ["pending", "completed", "cancelled", "rejected"]
        .filter((k) => Number(cards[k] || 0) > 0)
        .map((k) => ({ name: CARD_LABELS[k] || toTitleCase(k), value: Number(cards[k]) })),
    };
  }

  if (reportType === "income") {
    return {
      kind: "bar",
      data: series,
      xKey: "label",
      bars: [{ key: "income", label: "Revenue", color: "#116735" }],
    };
  }

  return {
    kind: "line",
    data: series,
    xKey: "label",
    lines: [
      { key: "guestCount",   label: "Guests",   color: "#116735" },
      { key: "bookingCount", label: "Bookings", color: "#2563eb" },
    ],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const ownerName        = localStorage.getItem("ownerFullName")    || "Property Owner";
  const accommodationName = localStorage.getItem("accommodationName") || "Your Accommodation";

  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [reportType, setReportType]       = useState("");
  const [period, setPeriod]               = useState("");
  const [isGenerating, setIsGenerating]   = useState(false);
  const [isExporting, setIsExporting]     = useState("");
  const [error, setError]                 = useState("");
  const [report, setReport]               = useState(null);
  const [generatedMeta, setGeneratedMeta] = useState(null); // { reportType, period, generatedAt }

  // Table controls
  const [search, setSearch]         = useState("");
  const [sortConfig, setSortConfig] = useState({ column: null, dir: "asc" });

  const canGenerate = reportType && period && !isGenerating;

  // Derive table data from series (time-series rows)
  const tableSource = useMemo(() => {
    if (!report) return [];
    if (Array.isArray(report.series) && report.series.length > 0) return report.series;
    if (Array.isArray(report.table)  && report.table.length  > 0) return report.table;
    return [];
  }, [report]);

  const tableColumns = useMemo(() => getColumns(tableSource), [tableSource]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tableSource;
    return tableSource.filter((row) =>
      Object.values(row || {}).some((v) => String(v || "").toLowerCase().includes(term))
    );
  }, [tableSource, search]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.column) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[sortConfig.column], bv = b[sortConfig.column];
      const an = Number(av), bn = Number(bv);
      if (!isNaN(an) && !isNaN(bn)) return sortConfig.dir === "asc" ? an - bn : bn - an;
      return sortConfig.dir === "asc"
        ? String(av || "").localeCompare(String(bv || ""))
        : String(bv || "").localeCompare(String(av || ""));
    });
  }, [filteredRows, sortConfig]);

  const cardEntries = useMemo(
    () => (report && generatedMeta ? buildCardEntries(report.cards, generatedMeta.reportType) : []),
    [report, generatedMeta]
  );

  const chartData = useMemo(
    () => (report && generatedMeta ? buildChartData(generatedMeta.reportType, report) : null),
    [report, generatedMeta]
  );

  const reportLabel = REPORT_TYPES.find((r) => r.value === (generatedMeta?.reportType || reportType))?.label || "Report";
  const periodLabel = PERIODS.find((p) => p.value === (generatedMeta?.period || period))?.label || "";

  // ── Sort helpers ──────────────────────────────────────────────────────────
  const handleSort = (col) => {
    setSortConfig((prev) =>
      prev.column === col
        ? { column: col, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { column: col, dir: "asc" }
    );
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setError("");
    setReport(null);
    setSearch("");
    setSortConfig({ column: null, dir: "asc" });

    try {
      const config = REPORT_TYPES.find((r) => r.value === reportType);
      const url    = `${API_URL}/analytics/reports/${config.endpoint}?period=${period}`;
      const res    = await fetch(url, { headers: buildAuthHeaders("propertyOwner") });
      const data   = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Failed to generate report.");

      setReport(data);
      setGeneratedMeta({ reportType, period, generatedAt: new Date().toISOString() });
    } catch (err) {
      setError(err.message || "Failed to generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Export helpers ────────────────────────────────────────────────────────
  const getExportTitle = () => `${reportLabel} — ${periodLabel} Report`;

  const getSummaryRows = () =>
    cardEntries.length > 0 ? cardEntries.map((e) => [e.label, e.value]) : [["No summary data", "—"]];

  const getTableRows = () =>
    sortedRows.length > 0
      ? sortedRows.map((row) => tableColumns.map((col) => formatValue(col, row[col])))
      : [["No data available"]];

  const exportPdf = async () => {
    setIsExporting("pdf");
    try {
      const pdf   = new jsPDF("p", "pt", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const title = getExportTitle();

      pdf.setFillColor(17, 103, 53);
      pdf.rect(0, 0, width, 100, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");   pdf.setFontSize(22); pdf.text(title, 40, 46);
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.text(accommodationName, 40, 66);
      pdf.text(`Generated ${formatDateTimeStr(generatedMeta?.generatedAt)}`, 40, 82);

      pdf.setTextColor(23, 49, 34);
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(14); pdf.text("Summary", 40, 130);

      autoTable(pdf, { startY: 144, theme: "grid", headStyles: { fillColor: [17, 103, 53] }, body: getSummaryRows(), margin: { left: 40, right: 40 } });

      pdf.setFont("helvetica", "bold"); pdf.setFontSize(14);
      pdf.text("Data Table", 40, pdf.lastAutoTable.finalY + 22);

      autoTable(pdf, {
        startY: pdf.lastAutoTable.finalY + 36,
        theme: "striped",
        head: [tableColumns.map(toTitleCase)],
        body: getTableRows(),
        headStyles: { fillColor: [17, 103, 53] },
        margin: { left: 40, right: 40 },
      });

      pdf.save(`${slugify(title)}.pdf`);
    } finally {
      setIsExporting("");
    }
  };

  const exportDocx = async () => {
    setIsExporting("docx");
    try {
      const title = getExportTitle();

      const summaryTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: getSummaryRows().map(([label, value]) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(String(label))] }),
              new TableCell({ children: [new Paragraph(String(value))] }),
            ],
          })
        ),
      });

      const dataTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: tableColumns.map((col) =>
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: toTitleCase(col), bold: true })] })] })
            ),
          }),
          ...getTableRows().map((row) =>
            new TableRow({
              children: row.map((val) => new TableCell({ children: [new Paragraph(String(val))] })),
            })
          ),
        ],
      });

      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: title,            heading: HeadingLevel.TITLE }),
            new Paragraph(accommodationName),
            new Paragraph(`Generated ${formatDateTimeStr(generatedMeta?.generatedAt)}`),
            new Paragraph({ text: "Summary",        heading: HeadingLevel.HEADING_1 }),
            summaryTable,
            new Paragraph({ text: "Data Table",     heading: HeadingLevel.HEADING_1 }),
            dataTable,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${slugify(title)}.docx`);
    } finally {
      setIsExporting("");
    }
  };

  const exportXlsx = async () => {
    setIsExporting("xlsx");
    try {
      const title = getExportTitle();
      const wb    = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Report",    title],
        ["Scope",     accommodationName],
        ["Generated", formatDateTimeStr(generatedMeta?.generatedAt)],
        [],
        ["Metric", "Value"],
        ...getSummaryRows(),
      ]);

      const dataSheet = XLSX.utils.json_to_sheet(
        sortedRows.length > 0
          ? sortedRows.map((row) =>
              Object.fromEntries(tableColumns.map((col) => [toTitleCase(col), formatValue(col, row[col])]))
            )
          : [{ Notice: "No data available" }]
      );

      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(wb, dataSheet, "Data");
      XLSX.writeFile(wb, `${slugify(title)}.xlsx`);
    } finally {
      setIsExporting("");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar active="reports" isHidden={sidebarHidden} setIsHidden={setSidebarHidden} />

      <main className="property-owner-main rpt-main">
        <div className="rpt-shell">

          {/* Page Header */}
          <header className="rpt-page-header">
            {sidebarHidden && <MenuButton onClick={() => setSidebarHidden(false)} />}
            <div>
              <span className="rpt-kicker">Analytics</span>
              <h1>Reports</h1>
              <p>Generate, filter, and export data reports for your property.</p>
            </div>

            <div className="rpt-owner-chip">
              <span className="rpt-owner-chip-name">{ownerName}</span>
              <span className="rpt-owner-chip-sub">{accommodationName}</span>
            </div>
          </header>

          {/* ── Configuration Card ── */}
          <div className="rpt-config-card">
            <div className="rpt-config-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <div>
                <strong>Configure Report</strong>
                <span>Select a report type and period to get started.</span>
              </div>
            </div>

            <div className="rpt-config-fields">
              {/* Report Type */}
              <div className="rpt-select-group">
                <label className="rpt-select-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Report Type
                </label>
                <div className="rpt-select-wrap">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    disabled={isGenerating}
                    className={reportType ? "rpt-select rpt-select--filled" : "rpt-select"}
                  >
                    <option value="">Select report type…</option>
                    {REPORT_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <svg className="rpt-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {reportType && (
                  <p className="rpt-select-hint">
                    {REPORT_TYPES.find((r) => r.value === reportType)?.description}
                  </p>
                )}
              </div>

              {/* Period */}
              <div className="rpt-select-group">
                <label className="rpt-select-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Period
                </label>
                <div className="rpt-select-wrap">
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    disabled={isGenerating}
                    className={period ? "rpt-select rpt-select--filled" : "rpt-select"}
                  >
                    <option value="">Select period…</option>
                    {PERIODS.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <svg className="rpt-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="button"
                className="rpt-generate-btn"
                onClick={handleGenerate}
                disabled={!canGenerate}
              >
                {isGenerating ? (
                  <>
                    <span className="rpt-spinner" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="rpt-error-card">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <strong>Could not generate report</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* ── Empty Prompt ── */}
          {!report && !isGenerating && !error && (
            <div className="rpt-empty-card">
              <div className="rpt-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <strong>No report yet</strong>
              <p>Choose a report type and period above, then click <em>Generate Report</em>.</p>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {isGenerating && (
            <div className="rpt-skeleton-wrap">
              <div className="rpt-skeleton rpt-skeleton--cards" />
              <div className="rpt-skeleton rpt-skeleton--chart" />
              <div className="rpt-skeleton rpt-skeleton--table" />
            </div>
          )}

          {/* ── Generated Report ── */}
          {report && !isGenerating && (
            <div className="rpt-result">

              {/* Result header + export */}
              <div className="rpt-result-header">
                <div className="rpt-result-header-left">
                  <div className="rpt-result-title-row">
                    <h2>{reportLabel}</h2>
                    <span className="rpt-period-badge">{periodLabel}</span>
                  </div>
                  <p className="rpt-result-meta">
                    Generated {formatDateTimeStr(generatedMeta?.generatedAt)} · {accommodationName}
                  </p>
                </div>

                <div className="rpt-export-group">
                  <span className="rpt-export-label">Export as</span>
                  <div className="rpt-export-btns">
                    <button
                      type="button"
                      className="rpt-export-btn rpt-export-btn--pdf"
                      onClick={exportPdf}
                      disabled={isExporting !== ""}
                    >
                      {isExporting === "pdf" ? <span className="rpt-spinner rpt-spinner--sm" /> : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      )}
                      PDF
                    </button>
                    <button
                      type="button"
                      className="rpt-export-btn rpt-export-btn--docx"
                      onClick={exportDocx}
                      disabled={isExporting !== ""}
                    >
                      {isExporting === "docx" ? <span className="rpt-spinner rpt-spinner--sm" /> : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
                      )}
                      DOCX
                    </button>
                    <button
                      type="button"
                      className="rpt-export-btn rpt-export-btn--xls"
                      onClick={exportXlsx}
                      disabled={isExporting !== ""}
                    >
                      {isExporting === "xlsx" ? <span className="rpt-spinner rpt-spinner--sm" /> : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="8 13 10 17 12 13 14 17 16 13"/></svg>
                      )}
                      XLS
                    </button>
                  </div>
                </div>
              </div>

              {/* Stat Cards */}
              {cardEntries.length > 0 && (
                <div className="rpt-cards">
                  {cardEntries.map((entry, i) => (
                    <div key={entry.key} className={`rpt-card${i === 0 ? " rpt-card--accent" : ""}`}>
                      <span>{entry.label}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Chart */}
              {chartData && (
                <div className="rpt-chart-card">
                  <div className="rpt-chart-header">
                    <h3>
                      {generatedMeta?.reportType === "booking-status" ? "Booking Status Distribution" :
                       generatedMeta?.reportType === "income"         ? "Revenue Over Time" :
                                                                        "Guest Trend"}
                    </h3>
                    <span className="rpt-period-badge">{periodLabel}</span>
                  </div>

                  <div className="rpt-chart-wrap">
                    {chartData.kind === "pie" && chartData.data.length > 0 && (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={chartData.data} dataKey="value" nameKey="name" outerRadius={110} innerRadius={60}>
                            {chartData.data.map((entry, i) => (
                              <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, k, p) => [formatNumber(v), p?.payload?.name || k]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}

                    {chartData.kind === "bar" && chartData.data.length > 0 && (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dde8e1" />
                          <XAxis dataKey={chartData.xKey} tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v, k) => [formatCurrency(v), toTitleCase(k)]} />
                          <Legend />
                          {chartData.bars.map((b) => (
                            <Bar key={b.key} dataKey={b.key} fill={b.color} radius={[6, 6, 0, 0]} name={b.label} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {chartData.kind === "line" && chartData.data.length > 0 && (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={chartData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dde8e1" />
                          <XAxis dataKey={chartData.xKey} tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          {chartData.lines.map((l) => (
                            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color} strokeWidth={2.5} name={l.label} dot={false} />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {((chartData.kind === "pie" && chartData.data.length === 0) ||
                      (chartData.kind !== "pie" && chartData.data.length === 0)) && (
                      <div className="rpt-chart-empty">No chart data for this period.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Table Section */}
              <div className="rpt-table-card">
                <div className="rpt-table-toolbar">
                  <div className="rpt-search-wrap">
                    <svg className="rpt-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      type="text"
                      className="rpt-search-input"
                      placeholder="Search table…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button type="button" className="rpt-search-clear" onClick={() => setSearch("")}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>

                  <div className="rpt-table-meta">
                    {sortConfig.column && (
                      <span className="rpt-sort-chip">
                        Sorted by {toTitleCase(sortConfig.column)} {sortConfig.dir === "asc" ? "↑" : "↓"}
                        <button type="button" onClick={() => setSortConfig({ column: null, dir: "asc" })}>×</button>
                      </span>
                    )}
                    <span className="rpt-row-count">{sortedRows.length} row{sortedRows.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {sortedRows.length === 0 ? (
                  <div className="rpt-table-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <span>No rows match your search.</span>
                  </div>
                ) : (
                  <div className="rpt-table-wrap">
                    <table className="rpt-table">
                      <thead>
                        <tr>
                          {tableColumns.map((col) => (
                            <th
                              key={col}
                              onClick={() => handleSort(col)}
                              className={`rpt-th${sortConfig.column === col ? " rpt-th--sorted" : ""}`}
                            >
                              {toTitleCase(col)}
                              <span className="rpt-sort-icon">
                                {sortConfig.column === col
                                  ? (sortConfig.dir === "asc" ? "↑" : "↓")
                                  : "↕"}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedRows.map((row, i) => (
                          <tr key={i}>
                            {tableColumns.map((col) => (
                              <td key={col}>{formatValue(col, row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
