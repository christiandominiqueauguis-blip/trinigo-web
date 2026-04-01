import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import MenuButton from "../../components/MenuButton";
import { API_URL } from "../../config/api";
import "./AdminUserManagement.css";
import { buildAuthHeaders } from "../../features/auth/roleSession";

const DEFAULT_RESTRICTION_FORM = {
  durationUnit: "days",
  durationValue: 1,
  reason: "",
};

const DEFAULT_MANAGER_FORM = {
  fullName: "",
  username: "",
  password: "",
};

const ROLE_TABS = [
  { key: "propertyOwners", label: "Property Owners" },
  { key: "tourismManagers", label: "Tourism Site Managers" },
  { key: "mobileUsers", label: "Mobile Users" },
];

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

function getRestrictionPill(record) {
  if (record.deletedAt) return "Deleted";
  if (record.isRestricted) return "Restricted";
  return record.accountStatus || "Active";
}

export default function AdminUserManagement() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [activeTab, setActiveTab] = useState("propertyOwners");
  const [propertyOwners, setPropertyOwners] = useState([]);
  const [mobileUsers, setMobileUsers] = useState([]);
  const [tourismManagers, setTourismManagers] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [restrictionModal, setRestrictionModal] = useState(null);
  const [restrictionForm, setRestrictionForm] = useState(DEFAULT_RESTRICTION_FORM);
  const [managerModalOpen, setManagerModalOpen] = useState(false);
  const [managerForm, setManagerForm] = useState(DEFAULT_MANAGER_FORM);
  const [managerErrors, setManagerErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingAction, setLoadingAction] = useState("");

  const authHeaders = useMemo(() => buildAuthHeaders("admin"), []);

  const loadData = useCallback(async () => {
    try {
      const [ownersResponse, usersResponse, managersResponse] = await Promise.all([
        fetch(`${API_URL}/admin/property-owners`, { headers: authHeaders }),
        fetch(`${API_URL}/admin/mobile-users`, { headers: authHeaders }),
        fetch(`${API_URL}/admin/tourism-site-managers`, { headers: authHeaders }),
      ]);

      const ownersData = await ownersResponse.json();
      const usersData = await usersResponse.json();
      const managersData = await managersResponse.json();

      setPropertyOwners(Array.isArray(ownersData) ? ownersData : []);
      setMobileUsers(Array.isArray(usersData) ? usersData : []);
      setTourismManagers(Array.isArray(managersData) ? managersData : []);
    } catch (error) {
      console.error("Failed to load user management data", error);
      setPropertyOwners([]);
      setMobileUsers([]);
      setTourismManagers([]);
    }
  }, [authHeaders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeRecords = useMemo(() => {
    if (activeTab === "propertyOwners") return propertyOwners;
    if (activeTab === "tourismManagers") return tourismManagers;
    return mobileUsers;
  }, [activeTab, mobileUsers, propertyOwners, tourismManagers]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return activeRecords;

    return activeRecords.filter((record) =>
      [record.fullName, record.email, record.phone, record.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [activeRecords, searchTerm]);

  const openRestrictionModal = (record, type) => {
    setRestrictionModal({ record, type });
    setRestrictionForm(DEFAULT_RESTRICTION_FORM);
  };

  const closeManagerModal = () => {
    setManagerModalOpen(false);
    setManagerForm(DEFAULT_MANAGER_FORM);
    setManagerErrors({});
  };

  const submitRestriction = async () => {
    if (!restrictionModal) return;

    setLoadingAction(`${restrictionModal.type}-${restrictionModal.record.id}-restrict`);
    const basePath =
      restrictionModal.type === "propertyOwner" ? "property-owners" : "mobile-users";

    try {
      const response = await fetch(`${API_URL}/admin/${basePath}/${restrictionModal.record.id}/restrict`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(restrictionForm),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Unable to restrict account right now.");
        return;
      }

      await loadData();
      setRestrictionModal(null);
      setSelectedRecord(null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while restricting the account.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleLiftRestriction = async (record, type) => {
    const basePath = type === "propertyOwner" ? "property-owners" : "mobile-users";
    setLoadingAction(`${type}-${record.id}-lift`);

    try {
      const response = await fetch(`${API_URL}/admin/${basePath}/${record.id}/lift-restriction`, {
        method: "PATCH",
        headers: authHeaders,
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Unable to lift the restriction right now.");
        return;
      }

      await loadData();
      setSelectedRecord(null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while lifting the restriction.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleDelete = async (record, type) => {
    const basePath = type === "propertyOwner" ? "property-owners" : "mobile-users";
    const confirmed = window.confirm(`Delete ${record.fullName || record.email}? This will disable the account.`);
    if (!confirmed) return;

    setLoadingAction(`${type}-${record.id}-delete`);
    try {
      const response = await fetch(`${API_URL}/admin/${basePath}/${record.id}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete the account right now.");
        return;
      }

      await loadData();
      setSelectedRecord(null);
    } catch (error) {
      console.error(error);
      alert("Something went wrong while deleting the account.");
    } finally {
      setLoadingAction("");
    }
  };

  const handleManagerCreate = async () => {
    setManagerErrors({});
    setLoadingAction("tourismManager-create");

    try {
      const response = await fetch(`${API_URL}/admin/tourism-site-managers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(managerForm),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setManagerErrors(data.errors);
        } else {
          alert(data.message || "Unable to create the Tourism Site Manager account.");
        }
        return;
      }

      await loadData();
      closeManagerModal();
    } catch (error) {
      console.error(error);
      alert("Something went wrong while creating the Tourism Site Manager account.");
    } finally {
      setLoadingAction("");
    }
  };

  return (
    <div className="admin-user-layout">
      <Sidebar
        active="user-management"
        isHidden={isSidebarHidden}
        setIsHidden={setIsSidebarHidden}
      />

      <main className="admin-user-main">
        <section className="admin-user-header">
          {isSidebarHidden ? <MenuButton onClick={() => setIsSidebarHidden(false)} /> : null}
          <div>
            <span className="admin-user-kicker">User Administration</span>
            <h1>Manage property owners, tourism site managers, and mobile users from one admin panel.</h1>
            <p>
              Tourism Site Manager accounts are created by admin only, while property owners and
              mobile users remain manageable for restriction and deletion.
            </p>
          </div>
        </section>

        <section className="admin-user-toolbar">
          <div className="admin-user-tabs">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`admin-user-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-user-toolbar-actions">
            <label className="admin-user-search">
              <span>Search</span>
              <input
                type="search"
                placeholder="Search by name, username, email, or phone"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            {activeTab === "tourismManagers" ? (
              <button
                type="button"
                className="admin-user-btn admin-user-btn-primary"
                onClick={() => setManagerModalOpen(true)}
              >
                Create Tourism Site Manager
              </button>
            ) : null}
          </div>
        </section>

        {filteredRecords.length === 0 ? (
          <section className="admin-user-empty">
            <strong>No records matched this view.</strong>
            <p>Try a different search term or switch to another role tab.</p>
          </section>
        ) : (
          <section className="admin-user-grid">
            {filteredRecords.map((record) => {
            const type =
              activeTab === "propertyOwners"
                ? "propertyOwner"
                : activeTab === "mobileUsers"
                  ? "mobileUser"
                  : "tourismManager";
            const isBusy = loadingAction.startsWith(`${type}-${record.id}`) || loadingAction === "tourismManager-create";

            return (
              <article key={record.id} className="admin-user-card">
                <div className="admin-user-card-top">
                  <div>
                    <h3>{record.fullName || record.username || record.email}</h3>
                    <p>{record.email || record.username || record.phone || "No contact info"}</p>
                  </div>
                  <span
                    className={`admin-user-pill ${
                      record.isRestricted ? "restricted" : record.deletedAt ? "deleted" : "active"
                    }`}
                  >
                    {getRestrictionPill(record)}
                  </span>
                </div>

                <div className="admin-user-meta">
                  {activeTab === "propertyOwners" ? <span>Application Status: {record.status}</span> : null}
                  {activeTab === "tourismManagers" ? <span>Username: {record.username}</span> : null}
                  <span>Created: {formatDateTime(record.createdAt)}</span>
                  {"restrictionEndsAt" in record ? <span>Restriction ends: {formatDateTime(record.restrictionEndsAt)}</span> : null}
                </div>

                <div className="admin-user-actions">
                  {activeTab !== "tourismManagers" && !record.deletedAt ? (
                    <button
                      type="button"
                      className="admin-user-btn admin-user-btn-primary"
                      disabled={isBusy}
                      onClick={() => openRestrictionModal(record, type)}
                    >
                      Restrict
                    </button>
                  ) : null}

                  {activeTab !== "tourismManagers" && record.isRestricted && !record.deletedAt ? (
                    <button
                      type="button"
                      className="admin-user-btn admin-user-btn-secondary"
                      disabled={isBusy}
                      onClick={() => handleLiftRestriction(record, type)}
                    >
                      Lift Restriction
                    </button>
                  ) : null}

                  {activeTab !== "tourismManagers" && !record.deletedAt ? (
                    <button
                      type="button"
                      className="admin-user-btn admin-user-btn-danger"
                      disabled={isBusy}
                      onClick={() => handleDelete(record, type)}
                    >
                      Delete
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="admin-user-btn admin-user-btn-ghost"
                    onClick={() => setSelectedRecord({ ...record, type, roleTab: activeTab })}
                  >
                    View Details
                  </button>
                </div>
              </article>
              );
            })}
          </section>
        )}

        {selectedRecord ? (
          <div className="admin-user-modal-overlay" onClick={() => setSelectedRecord(null)}>
            <div className="admin-user-modal" onClick={(event) => event.stopPropagation()}>
              <h3>{selectedRecord.fullName || selectedRecord.username || selectedRecord.email}</h3>
              <p>Email: {selectedRecord.email || "Not available"}</p>
              {"phone" in selectedRecord ? <p>Phone: {selectedRecord.phone || "Not available"}</p> : null}
              {"username" in selectedRecord ? <p>Username: {selectedRecord.username || "Not available"}</p> : null}
              {"status" in selectedRecord ? <p>Application Status: {selectedRecord.status}</p> : null}
              <p>Account Status: {selectedRecord.accountStatus || "ACTIVE"}</p>
              {"isRestricted" in selectedRecord ? <p>Restricted: {selectedRecord.isRestricted ? "Yes" : "No"}</p> : null}
              {"restrictionReason" in selectedRecord ? (
                <p>Restriction Reason: {selectedRecord.restrictionReason || "None"}</p>
              ) : null}
              {"restrictionEndsAt" in selectedRecord ? (
                <p>Restriction Ends: {formatDateTime(selectedRecord.restrictionEndsAt)}</p>
              ) : null}
              {"deletedAt" in selectedRecord ? <p>Deleted At: {formatDateTime(selectedRecord.deletedAt)}</p> : null}
              {"createdByAdminId" in selectedRecord ? (
                <p>Created By Admin ID: {selectedRecord.createdByAdminId || "Not available"}</p>
              ) : null}
              <button
                type="button"
                className="admin-user-btn admin-user-btn-secondary"
                onClick={() => setSelectedRecord(null)}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

        {restrictionModal ? (
          <div className="admin-user-modal-overlay" onClick={() => setRestrictionModal(null)}>
            <div className="admin-user-modal" onClick={(event) => event.stopPropagation()}>
              <h3>Restrict {restrictionModal.record.fullName || restrictionModal.record.email}</h3>
              <label className="admin-user-label">
                Duration Unit
                <select
                  value={restrictionForm.durationUnit}
                  onChange={(event) =>
                    setRestrictionForm((current) => ({ ...current, durationUnit: event.target.value }))
                  }
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                </select>
              </label>
              <label className="admin-user-label">
                Duration Value
                <input
                  type="number"
                  min="1"
                  value={restrictionForm.durationValue}
                  onChange={(event) =>
                    setRestrictionForm((current) => ({
                      ...current,
                      durationValue: Number(event.target.value || 0),
                    }))
                  }
                />
              </label>
              <label className="admin-user-label">
                Reason
                <textarea
                  rows="4"
                  value={restrictionForm.reason}
                  onChange={(event) =>
                    setRestrictionForm((current) => ({ ...current, reason: event.target.value }))
                  }
                  placeholder="Describe why the account is being restricted."
                />
              </label>
              <div className="admin-user-modal-actions">
                <button
                  type="button"
                  className="admin-user-btn admin-user-btn-secondary"
                  onClick={() => setRestrictionModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-user-btn admin-user-btn-primary"
                  disabled={loadingAction.includes("-restrict")}
                  onClick={submitRestriction}
                >
                  Apply Restriction
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {managerModalOpen ? (
          <div className="admin-user-modal-overlay" onClick={closeManagerModal}>
            <div className="admin-user-modal" onClick={(event) => event.stopPropagation()}>
              <h3>Create Tourism Site Manager</h3>
              <p>Only administrators can create tourism site manager accounts.</p>
              <label className="admin-user-label">
                Full Name
                <input
                  type="text"
                  value={managerForm.fullName}
                  onChange={(event) =>
                    setManagerForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                />
                {managerErrors.fullName ? <small className="admin-user-error">{managerErrors.fullName}</small> : null}
              </label>
              <label className="admin-user-label">
                Username
                <input
                  type="text"
                  value={managerForm.username}
                  onChange={(event) =>
                    setManagerForm((current) => ({ ...current, username: event.target.value }))
                  }
                />
                {managerErrors.username ? <small className="admin-user-error">{managerErrors.username}</small> : null}
              </label>
              <label className="admin-user-label">
                Temporary Password
                <input
                  type="password"
                  value={managerForm.password}
                  onChange={(event) =>
                    setManagerForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
                {managerErrors.password ? <small className="admin-user-error">{managerErrors.password}</small> : null}
              </label>
              <div className="admin-user-modal-actions">
                <button
                  type="button"
                  className="admin-user-btn admin-user-btn-secondary"
                  onClick={closeManagerModal}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="admin-user-btn admin-user-btn-primary"
                  disabled={loadingAction === "tourismManager-create"}
                  onClick={handleManagerCreate}
                >
                  {loadingAction === "tourismManager-create" ? "Creating..." : "Create Account"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
