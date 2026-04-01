import { useCallback, useEffect, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import "./PropertyOwnerApplication.css";
import Sidebar from "../../components/Sidebar";
import { BASE_URL, API_URL } from "../../config/api";
import usePagination from "../../hooks/usePagination";

export default function PropertyOwnerApplication() {
  const adminAuthToken = localStorage.getItem("adminAuthToken") || "";
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [allApplications, setAllApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [loadingId, setLoadingId] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchApplications = useCallback(() => {
    if (!adminAuthToken) {
      setFeedback({
        type: "error",
        message: "Your admin session is missing. Please log in again.",
      });
      return;
    }

    fetch(`${API_URL}/admin/property-owners`, {
      headers: {
        Authorization: `Bearer ${adminAuthToken}`,
      },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load applications.");
        }

        setAllApplications(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Failed to load applications", err);
        setAllApplications([]);
        setFeedback({
          type: "error",
          message: err.message || "Failed to load applications.",
        });
      });
  }, [adminAuthToken]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const getApplicationId = (app) => app?.id || app?._id || "";

  const updateStatus = async (app, status) => {
    if (!adminAuthToken) {
      setFeedback({
        type: "error",
        message: "Your admin session expired. Please log in again.",
      });
      return;
    }

    const applicationId = getApplicationId(app);
    if (!applicationId) {
      setFeedback({
        type: "error",
        message: `Couldn't identify ${app?.fullName || "this application"}. Please refresh and try again.`,
      });
      return;
    }

    setLoadingId(applicationId);
    setFeedback({ type: "", message: "" });

    try {
      const response = await fetch(`${API_URL}/admin/property-owners/${applicationId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminAuthToken}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: result.message || `Failed to update ${app.fullName}.`,
        });
        return;
      }

      fetchApplications();
      if (getApplicationId(selectedApp) === applicationId) setSelectedApp(null);
      setFeedback({
        type: "success",
        message: result.message || `${app.fullName} was updated successfully.`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      setFeedback({
        type: "error",
        message: err.message || "Failed to update status.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const pending  = allApplications.filter((a) => a.status === "PENDING");
  const verified = allApplications.filter((a) => a.status === "VERIFIED");
  const rejected = allApplications.filter((a) => a.status === "REJECTED");

  const displayed =
    activeTab === "pending"  ? pending  :
    activeTab === "verified" ? verified : rejected;
  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(displayed, {
      initialPageSize: 6,
      resetKey: activeTab,
    });

  return (
    <div className="property-owner-layout">
      <Sidebar
        active="property"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      <main className="property-owner-main">
        {isSidebarHidden ? (
          <MenuButton
            className="menu-button--floating"
            onClick={() => setIsSidebarHidden(false)}
          />
        ) : null}

        <div className="property-owner-wrapper">
          <div className="property-owner-header">
            Establishment Applications
          </div>

          {feedback.message ? (
            <div
              className={`property-owner-feedback ${
                feedback.type === "success"
                  ? "property-owner-feedback--success"
                  : "property-owner-feedback--error"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {/* TABS */}
          <div className="property-owner-filter-buttons">
            <button
              className={`property-owner-btn ${activeTab === "pending" ? "active-tab" : "pending-btn"}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending Review
              {pending.length > 0 && (
                <span className="tab-count">{pending.length}</span>
              )}
            </button>
            <button
              className={`property-owner-btn ${activeTab === "verified" ? "active-tab" : "verified-btn"}`}
              onClick={() => setActiveTab("verified")}
            >
              Verified
            </button>
            <button
              className={`property-owner-btn ${activeTab === "rejected" ? "active-tab" : "reject"}`}
              onClick={() => setActiveTab("rejected")}
            >
              Rejected
            </button>
          </div>

          {/* CARDS */}
          <div className="property-owner-cards">
            {displayed.length === 0 && (
              <p style={{ color: "#6b7280", fontSize: 14 }}>
                No {activeTab} applications.
              </p>
            )}

            {paginatedItems.map((app) => {
              const applicationId = getApplicationId(app);

              return (
              <div className="property-owner-card" key={applicationId || app.email}>
                <div className="card-header">
                  <h4>{app.fullName}</h4>
                  <span
                    className="property-owner-status"
                    style={{
                      background:
                        app.status === "VERIFIED" ? "#116735" :
                        app.status === "REJECTED" ? "#dc2626" : undefined,
                    }}
                  >
                    {app.status === "VERIFIED" ? "Verified" :
                     app.status === "REJECTED" ? "Rejected" : "Pending Review"}
                  </span>
                </div>

                <div className="card-body">
                  <p className="application-date">
                    Application Date:{" "}
                    {new Date(app.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  <p className="application-date">{app.email}</p>
                </div>

                <div className="property-owner-actions">
                  {app.status === "PENDING" && (
                    <>
                      <button
                        className="verify"
                        disabled={loadingId === applicationId}
                        onClick={() => updateStatus(app, "VERIFIED")}
                      >
                        {loadingId === applicationId ? "Updating..." : "Verify"}
                      </button>
                      <button
                        className="reject"
                        disabled={loadingId === applicationId}
                        onClick={() => updateStatus(app, "REJECTED")}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {app.status === "VERIFIED" && (
                    <button
                      className="reject"
                      disabled={loadingId === applicationId}
                      onClick={() => updateStatus(app, "REJECTED")}
                    >
                      Revoke
                    </button>
                  )}
                  {app.status === "REJECTED" && (
                    <button
                      className="verify"
                      disabled={loadingId === applicationId}
                      onClick={() => updateStatus(app, "VERIFIED")}
                    >
                      Re-verify
                    </button>
                  )}
                  <button
                    className="details"
                    onClick={() => setSelectedApp(app)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )})}
          </div>

          <Pagination
            currentPage={currentPage}
            itemLabel="applications"
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSize={pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
          />

          {/* DETAILS MODAL */}
          {selectedApp && (
            <div className="details-modal">
              <div className="details-card">
                <h3>{selectedApp.fullName}</h3>

                <p><strong>Gender:</strong> {selectedApp.gender}</p>
                <p><strong>Email:</strong> {selectedApp.email}</p>
                <p><strong>Phone:</strong> {selectedApp.phone}</p>
                <p>
                  <strong>Applied on:</strong>{" "}
                  {new Date(selectedApp.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color:
                        selectedApp.status === "VERIFIED" ? "#116735" :
                        selectedApp.status === "REJECTED" ? "#dc2626" : "#92400e",
                      fontWeight: 600,
                    }}
                  >
                    {selectedApp.status}
                  </span>
                </p>

                <h4>Business Documents</h4>
                <div className="permit-list">
                  {selectedApp.businessPermits.map((file, index) => (
                    <a
                      key={index}
                      href={`${BASE_URL}${file}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Document {index + 1}
                    </a>
                  ))}
                </div>

                <button className="close" onClick={() => setSelectedApp(null)}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
