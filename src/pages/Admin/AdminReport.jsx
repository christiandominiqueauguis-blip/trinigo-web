import { useState, useEffect } from "react";
import Pagination from "../../components/Pagination";
import Sidebar from "../../components/Sidebar";
import "./AdminReport.css";
import MenuButton from "../../components/MenuButton";
import { API_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";

export default function AdminReport() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Accommodation Reports state
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusValue, setStatusValue] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  // Tourist Spot Reports state
  const [activeTab, setActiveTab] = useState("accommodation");
  const [touristSpotReports, setTouristSpotReports] = useState([]);
  const [selectedTsReport, setSelectedTsReport] = useState(null);
  const [tsStatusValue, setTsStatusValue] = useState("");
  const [tsShowWarning, setTsShowWarning] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/reports`)
      .then((res) => res.json())
      .then((data) => {
        const grouped = {};

        data.forEach((report) => {
          const d = new Date(report.createdAt);
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
          const key = `${report.ownerId}_${report.accommodationName}_${dateKey}`;

          if (!grouped[key]) {
            grouped[key] = {
              ...report,
              files: [],
            };
          }

          grouped[key].files.push(report);
        });

        setReports(Object.values(grouped));
      });
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/tourist-spot-reports`)
      .then((res) => res.json())
      .then((data) => {
        // GROUP BY tourist spot name + submission minute
        const grouped = {};

        data.forEach((report) => {
          const d = new Date(report.createdAt);
          const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
          const key = `${report.managerId}_${report.touristSpotName}_${dateKey}`;

          if (!grouped[key]) {
            grouped[key] = {
              ...report,
              files: [],
            };
          }

          grouped[key].files.push(report);
        });

        setTouristSpotReports(Object.values(grouped));
      });
  }, []);
  const accommodationPagination = usePagination(reports, {
    initialPageSize: 6,
    resetKey: activeTab,
  });
  const touristSpotPagination = usePagination(touristSpotReports, {
    initialPageSize: 6,
    resetKey: activeTab,
  });

  return (
    <div className="admin-report-container">
      <Sidebar
        active="report"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      {isSidebarHidden && (
        <MenuButton onClick={() => setIsSidebarHidden(false)} />
      )}

      <main className="admin-report-main">
        <div className="admin-report-header">Report</div>

        <div className="admin-report-tabs">
          <button
            className={activeTab === "accommodation" ? "active-tab" : ""}
            onClick={() => setActiveTab("accommodation")}
          >
            Accommodation Reports
          </button>
          <button
            className={activeTab === "touristSpot" ? "active-tab" : ""}
            onClick={() => setActiveTab("touristSpot")}
          >
            Tourist Spot Reports
          </button>
        </div>

        {/* ======================== */}
        {/* ACCOMMODATION REPORTS TAB */}
        {/* ======================== */}
        {activeTab === "accommodation" && (
          <div className="admin-report-card">
            <h2>Accommodation Reports</h2>
            <p>List of reports submitted by Property Owners</p>

            <div className="admin-report-table-wrapper">
              <table className="admin-report-table">
                <thead>
                  <tr>
                    <th>Accommodation Name</th>
                    <th>Property Owner</th>
                    <th>Property Type</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 && (
                    <tr>
                      <td colSpan="6">No reports submitted yet.</td>
                    </tr>
                  )}

                  {accommodationPagination.paginatedItems.map((report) => {
                    const formattedDate = new Date(
                      report.createdAt
                    ).toLocaleDateString("en-US");

                    return (
                      <tr key={report._id}>
                        <td>{report.accommodationName}</td>
                        <td>{report.ownerName}</td>
                        <td>{report.propertyType}</td>
                        <td>{formattedDate}</td>
                        <td>
                          <span
                            className={
                              report.status === "Approved"
                                ? "status-approved"
                                : "status-pending"
                            }
                          >
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => setSelectedReport(report)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={accommodationPagination.currentPage}
              itemLabel="reports"
              onPageChange={accommodationPagination.setCurrentPage}
              onPageSizeChange={accommodationPagination.setPageSize}
              pageSize={accommodationPagination.pageSize}
              totalItems={accommodationPagination.totalItems}
              totalPages={accommodationPagination.totalPages}
            />
          </div>
        )}

        {/* ======================== */}
        {/* TOURIST SPOT REPORTS TAB */}
        {/* ======================== */}
        {activeTab === "touristSpot" && (
          <div className="admin-report-card">
            <h2>Tourist Spot Reports</h2>
            <p>List of reports submitted by Tourism Site Managers</p>

            <div className="admin-report-table-wrapper">
              <table className="admin-report-table">
                <thead>
                  <tr>
                    <th>Tourist Spot Name</th>
                    <th>Location</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {touristSpotReports.length === 0 && (
                    <tr>
                      <td colSpan="5">No reports submitted yet.</td>
                    </tr>
                  )}

                  {touristSpotPagination.paginatedItems.map((report) => {
                    const formattedDate = new Date(
                      report.createdAt
                    ).toLocaleDateString("en-US");

                    return (
                      <tr key={report._id}>
                        <td>{report.touristSpotName}</td>
                        <td>{report.touristSpotLocation}</td>
                        <td>{formattedDate}</td>
                        <td>
                          <span
                            className={
                              report.status === "Approved"
                                ? "status-approved"
                                : "status-pending"
                            }
                          >
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="view-btn"
                            onClick={() => setSelectedTsReport(report)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={touristSpotPagination.currentPage}
              itemLabel="reports"
              onPageChange={touristSpotPagination.setCurrentPage}
              onPageSizeChange={touristSpotPagination.setPageSize}
              pageSize={touristSpotPagination.pageSize}
              totalItems={touristSpotPagination.totalItems}
              totalPages={touristSpotPagination.totalPages}
            />
          </div>
        )}
      </main>

      {/* ======================== */}
      {/* ACCOMMODATION MODAL */}
      {/* ======================== */}
      {selectedReport && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
              >
                <option value="" disabled>
                  Status
                </option>
                <option value="Approved">Approved</option>
              </select>

              <span
                className="admin-modal-close"
                onClick={() => {
                  if (statusValue === "Approved") {
                    const allIds = selectedReport.files.map((f) => f._id);

                    fetch(`${API_URL}/reports/bulk-status`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ids: allIds,
                        status: "Approved",
                      }),
                    })
                      .then((res) => res.json())
                      .then(() => {
                        setReports((prevReports) =>
                          prevReports.map((r) =>
                            r._id === selectedReport._id
                              ? {
                                  ...r,
                                  status: "Approved",
                                  files: r.files.map((f) => ({
                                    ...f,
                                    status: "Approved",
                                  })),
                                }
                              : r
                          )
                        );
                        setSelectedReport(null);
                        setStatusValue("");
                      });
                  } else {
                    setShowWarning(true);
                  }
                }}
              >
                ×
              </span>
            </div>

            <div className="admin-modal-body">
              {selectedReport.files.map((file, index) => (
                <div key={index} className="admin-modal-file-row">
                  <span>{file.fileName}</span>

                  {showWarning && (
                    <div className="admin-modal-overlay">
                      <div className="system-message-modal">
                        <p>
                          Please approve the status first before closing.
                        </p>
                        <button onClick={() => setShowWarning(false)}>
                          OK
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="download-btn"
                    onClick={() =>
                      window.open(
                        `${API_URL.replace("/api", "")}${file.filePath}`
                      )
                    }
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* TOURIST SPOT MODAL */}
      {/* ======================== */}
      {selectedTsReport && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <select
                value={tsStatusValue}
                onChange={(e) => setTsStatusValue(e.target.value)}
              >
                <option value="" disabled>
                  Status
                </option>
                <option value="Approved">Approved</option>
              </select>

              <span
                className="admin-modal-close"
                onClick={() => {
                  if (tsStatusValue === "Approved") {
                    const allIds = selectedTsReport.files.map((f) => f._id);

                    fetch(`${API_URL}/tourist-spot-reports/bulk-status`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        ids: allIds,
                        status: "Approved",
                      }),
                    })
                      .then((res) => res.json())
                      .then(() => {
                        setTouristSpotReports((prev) =>
                          prev.map((r) =>
                            r._id === selectedTsReport._id
                              ? {
                                  ...r,
                                  status: "Approved",
                                  files: r.files.map((f) => ({
                                    ...f,
                                    status: "Approved",
                                  })),
                                }
                              : r
                          )
                        );
                        setSelectedTsReport(null);
                        setTsStatusValue("");
                      });
                  } else {
                    setTsShowWarning(true);
                  }
                }}
              >
                ×
              </span>
            </div>

            <div className="admin-modal-body">
              {selectedTsReport.files.map((file, index) => (
                <div key={index} className="admin-modal-file-row">
                  <span>{file.fileName}</span>

                  {tsShowWarning && (
                    <div className="admin-modal-overlay">
                      <div className="system-message-modal">
                        <p>
                          Please approve the status first before closing.
                        </p>
                        <button onClick={() => setTsShowWarning(false)}>
                          OK
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    className="download-btn"
                    onClick={() =>
                      window.open(
                        `${API_URL.replace("/api", "")}${file.filePath}`
                      )
                    }
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
