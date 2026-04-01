import { useMemo, useState } from "react";
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
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { API_URL } from "../config/api";
import { buildAuthHeaders } from "../features/auth/roleSession";
import "./AnalyticsReportBuilder.css";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const REPORT_OPTIONS = [
  { value: "guest-count", label: "Guest Count" },
  { value: "income", label: "Income" },
  { value: "walk-in", label: "Walk-in" },
  { value: "booking-status", label: "Booking Status" },
  { value: "establishment-performance", label: "Establishment Performance" },
  { value: "tourist-origin", label: "Tourist Origin" },
];

const BOOKING_TYPE_OPTIONS = [
  { value: "", label: "All Booking Types" },
  { value: "Accommodation", label: "Accommodation" },
  { value: "TouristSpot", label: "Tourist Spot" },
];

const REPORT_CONFIG = {
  "guest-count": {
    endpoint: "guest-count",
    title: "Guest Count Report",
    description: "Track guest volume and booking counts for the selected period.",
    purpose: "Shows guest traffic and booking activity trends.",
    roles: "Admin, Property Owner, Tourism Site Manager",
    tableEmptyLabel: "No guest-count data is available for the selected filters.",
  },
  income: {
    endpoint: "income",
    title: "Income Report",
    description: "Review paid income totals from backend-computed booking data.",
    purpose: "Shows revenue trends and paid-booking performance.",
    roles: "Admin, Property Owner, Tourism Site Manager",
    tableEmptyLabel: "No income data is available for the selected filters.",
  },
  "walk-in": {
    endpoint: "walk-in",
    title: "Walk-in Report",
    description: "Monitor walk-in volume, paid totals, and related activity.",
    purpose: "Shows operational walk-in performance and unpaid counts.",
    roles: "Admin, Property Owner, Tourism Site Manager",
    tableEmptyLabel: "No walk-in data is available for the selected filters.",
  },
  "booking-status": {
    endpoint: "booking-status",
    title: "Booking Status Report",
    description: "Compare pending, approved, completed, rejected, and cancelled bookings.",
    purpose: "Shows booking lifecycle distribution and progression.",
    roles: "Admin, Property Owner, Tourism Site Manager",
    tableEmptyLabel: "No booking-status data is available for the selected filters.",
  },
  "establishment-performance": {
    endpoint: "establishment-performance",
    title: "Establishment Performance Report",
    description: "Compare establishments by bookings, guests, and paid income.",
    purpose: "Shows which establishments are performing best.",
    roles: "Admin, Property Owner, Tourism Site Manager",
    tableEmptyLabel: "No establishment performance data is available for the selected filters.",
  },
  "tourist-origin": {
    endpoint: "tourist-origin",
    title: "Tourist Origin Report",
    description: "Review where tourists are coming from and how that affects activity.",
    purpose: "Shows guest origin mix and origin-based volume.",
    roles: "Admin, Property Owner, Tourism Site Manager",
    tableEmptyLabel: "No tourist-origin data is available for the selected filters.",
  },
};

const CARD_LABELS = {
  totalGuests: "Total Guests",
  totalBookings: "Total Bookings",
  averageGuestsPerBooking: "Average Guests per Booking",
  totalIncome: "Total Income",
  onlineIncome: "Online Income",
  walkInIncome: "Walk-in Income",
  walkInBookings: "Walk-in Bookings",
  paidWalkIns: "Paid Walk-ins",
  unpaidWalkIns: "Unpaid Walk-ins",
  pending: "Pending Bookings",
  completed: "Completed Bookings",
  cancelled: "Cancelled Bookings",
  rejected: "Rejected Bookings",
  topEstablishment: "Top Establishment",
  topOrigin: "Top Origin",
  sourcesTracked: "Sources Tracked",
};

const PIE_COLORS = ["#116735", "#2563eb", "#f59e0b", "#dc2626", "#7c3aed", "#0f766e", "#334155"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-PH").format(Number(value || 0));
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

function formatValue(key, value) {
  if (value === null || typeof value === "undefined" || value === "") return "Not available";

  const lowerKey = String(key || "").toLowerCase();
  if (
    lowerKey.includes("income") ||
    lowerKey.includes("amount") ||
    lowerKey.includes("revenue") ||
    lowerKey === "subtotal" ||
    lowerKey === "total"
  ) {
    return formatCurrency(value);
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? formatNumber(value) : Number(value).toFixed(2);
  }

  return String(value);
}

function toTitleCase(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function downloadBlob(blob, fileName) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

function buildQueryString(params) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  return query.toString();
}

function getCardEntries(cards) {
  return Object.entries(cards || {})
    .filter(([, value]) => value !== null && typeof value !== "undefined" && value !== "")
    .map(([key, value]) => ({
      key,
      label: CARD_LABELS[key] || toTitleCase(key),
      value: formatValue(key, value),
    }));
}

function getTableColumns(rows) {
  const keys = new Set();
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => keys.add(key));
  });
  return Array.from(keys);
}

function filterRowsByKeyword(rows, keyword) {
  const term = String(keyword || "").trim().toLowerCase();
  if (!term) return rows;

  return rows.filter((row) =>
    Object.values(row || {}).some((value) => String(value || "").toLowerCase().includes(term))
  );
}

function buildChartPreset(reportType, analytics) {
  const series = Array.isArray(analytics?.series) ? analytics.series : [];
  const table = Array.isArray(analytics?.table) ? analytics.table : [];
  const cards = analytics?.cards || {};

  if (reportType === "guest-count") {
    return {
      kind: "line",
      title: "Trend Preview",
      data: series,
      xKey: "label",
      lines: [
        { key: "guestCount", label: "Guests", color: "#116735" },
        { key: "bookingCount", label: "Bookings", color: "#2563eb" },
      ],
    };
  }

  if (reportType === "income") {
    return {
      kind: "bar",
      title: "Income Preview",
      data: series,
      xKey: "label",
      bars: [{ key: "income", label: "Income", color: "#116735" }],
    };
  }

  if (reportType === "walk-in") {
    return {
      kind: "bar",
      title: "Walk-in Activity Preview",
      data: series,
      xKey: "label",
      bars: [
        { key: "walkInBookings", label: "Walk-ins", color: "#116735" },
        { key: "paidWalkIns", label: "Paid", color: "#2563eb" },
        { key: "unpaidWalkIns", label: "Unpaid", color: "#f59e0b" },
      ],
    };
  }

  if (reportType === "booking-status") {
    return {
      kind: "pie",
      title: "Status Mix Preview",
      data: [
        { name: "Pending", value: Number(cards.pending || 0) },
        { name: "Completed", value: Number(cards.completed || 0) },
        { name: "Cancelled", value: Number(cards.cancelled || 0) },
        { name: "Rejected", value: Number(cards.rejected || 0) },
      ].filter((item) => item.value > 0),
      pieLabelKey: "name",
      pieValueKey: "value",
    };
  }

  if (reportType === "establishment-performance") {
    return {
      kind: "bar",
      title: "Top Establishments Preview",
      data: table.slice(0, 6),
      xKey: "establishmentName",
      bars: [{ key: "income", label: "Income", color: "#116735" }],
    };
  }

  return {
    kind: "pie",
    title: "Origin Mix Preview",
    data: table.slice(0, 6).map((row) => ({
      name: row.origin || "Unknown",
      value: Number(row.guestCount || row.bookingCount || 0),
    })),
    pieLabelKey: "name",
    pieValueKey: "value",
  };
}

export default function AnalyticsReportBuilder({ role, scopeLabel, embedded = false, className = "" }) {
  const [selectedReportType, setSelectedReportType] = useState("guest-count");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bookingTypeFilter, setBookingTypeFilter] = useState("");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [generatedReport, setGeneratedReport] = useState(null);
  const [generatedParams, setGeneratedParams] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState("");
  const [error, setError] = useState("");

  const reportConfig = REPORT_CONFIG[selectedReportType];
  const cardEntries = useMemo(() => getCardEntries(generatedReport?.cards || {}), [generatedReport]);
  const filteredTableRows = useMemo(
    () => filterRowsByKeyword(generatedReport?.table || [], keywordFilter),
    [generatedReport, keywordFilter]
  );
  const tableColumns = useMemo(() => getTableColumns(filteredTableRows), [filteredTableRows]);
  const exportColumns = tableColumns.length > 0 ? tableColumns : ["notice"];
  const chartPreset = useMemo(
    () => buildChartPreset(generatedParams?.reportType || selectedReportType, generatedReport),
    [generatedParams, generatedReport, selectedReportType]
  );

  const reportTitle = REPORT_CONFIG[generatedParams?.reportType || selectedReportType]?.title || "Analytics Report";

  const loadReport = async (params) => {
    setIsLoading(true);
    setError("");

    try {
      const config = REPORT_CONFIG[params.reportType];
      const query = buildQueryString({
        period: params.period,
        startDate: params.startDate,
        endDate: params.endDate,
        bookingType: params.bookingType,
      });

      const response = await fetch(`${API_URL}/analytics/reports/${config.endpoint}?${query}`, {
        headers: buildAuthHeaders(role),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.message || "Failed to load analytics report.");
      }

      setGeneratedReport(payload);
      setGeneratedParams(params);
    } catch (loadError) {
      console.error("Failed to load analytics report:", loadError);
      setGeneratedReport(null);
      setGeneratedParams(null);
      setError(loadError.message || "Failed to load analytics report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = () => {
    loadReport({
      reportType: selectedReportType,
      period,
      startDate,
      endDate,
      bookingType: "",
    });
    setBookingTypeFilter("");
    setKeywordFilter("");
  };

  const handleRefine = () => {
    if (!generatedParams) return;

    loadReport({
      ...generatedParams,
      bookingType: bookingTypeFilter,
    });
  };

  const getSummaryRows = () =>
    cardEntries.length > 0 ? cardEntries.map((entry) => [entry.label, entry.value]) : [["No summary data", "Not available"]];

  const getExportRows = () => {
    if (!filteredTableRows.length || !tableColumns.length) return [["No data available for current filters"]];
    return filteredTableRows.map((row) => exportColumns.map((column) => formatValue(column, row[column])));
  };

  const exportPdf = async () => {
    setIsExporting("pdf");

    try {
      const pdf = new jsPDF("p", "pt", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(17, 103, 53);
      pdf.rect(0, 0, pageWidth, 112, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.text(reportTitle, 40, 50);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(scopeLabel, 40, 74);
      pdf.text(`Generated ${formatDateTime(new Date())}`, 40, 92);

      pdf.setTextColor(23, 49, 34);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("Summary", 40, 145);

      autoTable(pdf, {
        startY: 160,
        theme: "grid",
        headStyles: { fillColor: [17, 103, 53] },
        body: getSummaryRows(),
        margin: { left: 40, right: 40 },
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("Preview Table", 40, pdf.lastAutoTable.finalY + 24);

      autoTable(pdf, {
        startY: pdf.lastAutoTable.finalY + 38,
        theme: "striped",
        head: [exportColumns.map((column) => toTitleCase(column))],
        body: getExportRows(),
        headStyles: { fillColor: [17, 103, 53] },
        margin: { left: 40, right: 40 },
      });

      pdf.save(`${reportTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    } finally {
      setIsExporting("");
    }
  };

  const exportDocx = async () => {
    setIsExporting("docx");

    try {
      const summaryTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: getSummaryRows().map(
          ([label, value]) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(String(label))] }),
                new TableCell({ children: [new Paragraph(String(value))] }),
              ],
            })
        ),
      });

      const previewRows = [
        new TableRow({
          children: exportColumns.map(
            (column) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: toTitleCase(column), bold: true })] })],
              })
          ),
        }),
        ...getExportRows().map(
          (row) =>
            new TableRow({
              children: row.map((value) => new TableCell({ children: [new Paragraph(String(value))] })),
            })
        ),
      ];

      const previewTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: previewRows,
      });

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                text: reportTitle,
                heading: HeadingLevel.TITLE,
              }),
              new Paragraph(scopeLabel),
              new Paragraph(`Generated ${formatDateTime(new Date())}`),
              new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_1 }),
              summaryTable,
              new Paragraph({ text: "Preview Table", heading: HeadingLevel.HEADING_1 }),
              previewTable,
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      downloadBlob(blob, `${reportTitle.toLowerCase().replace(/\s+/g, "-")}.docx`);
    } finally {
      setIsExporting("");
    }
  };

  const exportXlsx = async () => {
    setIsExporting("xlsx");

    try {
      const workbook = XLSX.utils.book_new();

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Report", reportTitle],
        ["Scope", scopeLabel],
        ["Generated", formatDateTime(new Date())],
        [],
        ["Summary Label", "Value"],
        ...getSummaryRows(),
      ]);

      const tableSheet = XLSX.utils.json_to_sheet(
        filteredTableRows.length > 0
          ? filteredTableRows.map((row) =>
              Object.fromEntries(
                Object.entries(row).map(([key, value]) => [toTitleCase(key), formatValue(key, value)])
              )
            )
          : [{ Notice: "No data available" }]
      );

      const seriesSheet = XLSX.utils.json_to_sheet(
        Array.isArray(generatedReport?.series) && generatedReport.series.length > 0
          ? generatedReport.series
          : [{ Notice: "No trend data available" }]
      );

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
      XLSX.utils.book_append_sheet(workbook, tableSheet, "Preview");
      XLSX.utils.book_append_sheet(workbook, seriesSheet, "Series");
      XLSX.writeFile(workbook, `${reportTitle.toLowerCase().replace(/\s+/g, "-")}.xlsx`);
    } finally {
      setIsExporting("");
    }
  };

  return (
    <section className={`analytics-builder ${embedded ? "analytics-builder--embedded" : ""} ${className}`.trim()}>
      <div className="analytics-builder__hero">
        <div>
          <span className="analytics-builder__kicker">Report Generator</span>
          <h2>{reportConfig.title}</h2>
          <p>{reportConfig.description}</p>
        </div>

        <div className="analytics-builder__meta">
          <span>{scopeLabel}</span>
          <small>{reportConfig.roles}</small>
        </div>
      </div>

      <div className="analytics-builder__controls">
        <div className="analytics-builder__field">
          <label htmlFor={`${role}-report-type`}>Report Type</label>
          <select
            id={`${role}-report-type`}
            value={selectedReportType}
            onChange={(event) => setSelectedReportType(event.target.value)}
          >
            {REPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="analytics-builder__field">
          <label htmlFor={`${role}-report-period`}>Period</label>
          <select id={`${role}-report-period`} value={period} onChange={(event) => setPeriod(event.target.value)}>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="analytics-builder__field">
          <label htmlFor={`${role}-start-date`}>Start Date</label>
          <input id={`${role}-start-date`} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </div>

        <div className="analytics-builder__field">
          <label htmlFor={`${role}-end-date`}>End Date</label>
          <input id={`${role}-end-date`} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <button type="button" className="analytics-builder__generate-btn" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      <div className="analytics-builder__definition">
        <div>
          <strong>Purpose</strong>
          <p>{reportConfig.purpose}</p>
        </div>
        <div>
          <strong>Output</strong>
          <p>Cards, charts, and tables ready for dashboard preview and export.</p>
        </div>
      </div>

      {generatedReport ? (
        <div className="analytics-builder__refinement">
          <div className="analytics-builder__field">
            <label htmlFor={`${role}-booking-type`}>Refine by Booking Type</label>
            <select id={`${role}-booking-type`} value={bookingTypeFilter} onChange={(event) => setBookingTypeFilter(event.target.value)}>
              {BOOKING_TYPE_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="analytics-builder__field">
            <label htmlFor={`${role}-keyword-filter`}>Refine Preview by Keyword</label>
            <input
              id={`${role}-keyword-filter`}
              type="text"
              value={keywordFilter}
              onChange={(event) => setKeywordFilter(event.target.value)}
              placeholder="Search rows in the preview table"
            />
          </div>

          <button type="button" className="analytics-builder__secondary-btn" onClick={handleRefine} disabled={isLoading}>
            Apply Refinement
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="analytics-builder__empty analytics-builder__empty--error">
          <strong>Report could not be generated.</strong>
          <p>{error}</p>
        </div>
      ) : null}

      {!generatedReport && !isLoading && !error ? (
        <div className="analytics-builder__empty">
          <strong>No report generated yet.</strong>
          <p>Select a report type and period, then generate the backend-powered preview first.</p>
        </div>
      ) : null}

      {generatedReport ? (
        <>
          <div className="analytics-builder__export-strip">
            <div>
              <strong>{reportTitle}</strong>
              <span>Preview generated {formatDateTime(generatedReport?.meta?.generatedAt || new Date())}</span>
            </div>

            <div className="analytics-builder__export-actions">
              <button type="button" onClick={exportPdf} disabled={isExporting !== ""}>
                {isExporting === "pdf" ? "Exporting..." : "Export PDF"}
              </button>
              <button type="button" onClick={exportDocx} disabled={isExporting !== ""}>
                {isExporting === "docx" ? "Exporting..." : "Export DOCX"}
              </button>
              <button type="button" onClick={exportXlsx} disabled={isExporting !== ""}>
                {isExporting === "xlsx" ? "Exporting..." : "Export XLSX"}
              </button>
            </div>
          </div>

          <div className="analytics-builder__cards">
            {cardEntries.map((entry) => (
              <article key={entry.key} className="analytics-builder__card">
                <span>{entry.label}</span>
                <strong>{entry.value}</strong>
              </article>
            ))}
          </div>

          <div className="analytics-builder__preview-grid">
            <article className="analytics-builder__panel analytics-builder__panel--chart">
              <div className="analytics-builder__panel-head">
                <div>
                  <h3>{chartPreset.title}</h3>
                  <p>Generated from the backend analytics endpoint for the selected filters.</p>
                </div>
                <div className="analytics-builder__badge-group">
                  <span>{toTitleCase(generatedParams?.period || period)}</span>
                  <span>{generatedParams?.bookingType || "All Types"}</span>
                </div>
              </div>

              <div className="analytics-builder__chart-wrap">
                {chartPreset.kind === "line" ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartPreset.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8e7dc" />
                      <XAxis dataKey={chartPreset.xKey} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      {chartPreset.lines.map((line) => (
                        <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2.5} name={line.label} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : null}

                {chartPreset.kind === "bar" ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartPreset.data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#d8e7dc" />
                      <XAxis dataKey={chartPreset.xKey} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value, key) => [formatValue(key, value), toTitleCase(key)]} />
                      <Legend />
                      {chartPreset.bars.map((bar) => (
                        <Bar key={bar.key} dataKey={bar.key} fill={bar.color} radius={[6, 6, 0, 0]} name={bar.label} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}

                {chartPreset.kind === "pie" ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={chartPreset.data} dataKey={chartPreset.pieValueKey} nameKey={chartPreset.pieLabelKey} outerRadius={96} innerRadius={56}>
                        {chartPreset.data.map((entry, index) => (
                          <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, key, payload) => [formatValue(key, value), payload?.payload?.name || key]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </article>

            <article className="analytics-builder__panel">
              <div className="analytics-builder__panel-head">
                <div>
                  <h3>Preview Table</h3>
                  <p>Review the generated dataset before exporting.</p>
                </div>
                <div className="analytics-builder__badge-group">
                  <span>{filteredTableRows.length} Rows</span>
                </div>
              </div>

              {filteredTableRows.length === 0 ? (
                <p className="analytics-builder__inline-empty">{reportConfig.tableEmptyLabel}</p>
              ) : (
                <div className="analytics-builder__table-wrap">
                  <table className="analytics-builder__table">
                    <thead>
                      <tr>
                        {tableColumns.map((column) => (
                          <th key={column}>{toTitleCase(column)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableRows.map((row, index) => (
                        <tr key={`${index}-${Object.values(row).join("-")}`}>
                          {tableColumns.map((column) => (
                            <td key={`${index}-${column}`}>{formatValue(column, row[column])}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
