import { useEffect, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import usePagination from "../../hooks/usePagination";
import "./Notifications.css";

export default function Notifications() {
  const ownerId = localStorage.getItem("ownerId") || "";
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    setLoading(true);
    fetch(`${API_URL}/property-owner/${ownerId}/notifications`, {
      headers: buildAuthHeaders("propertyOwner"),
    })
      .then((response) => response.json())
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ownerId]);

  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(notifications, {
      initialPageSize: 6,
      resetKey: notifications.length,
    });

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`${API_URL}/property-owner/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: buildAuthHeaders("propertyOwner"),
      });
      setNotifications((current) =>
        current.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
      window.dispatchEvent(new Event("owner-profile-updated"));
    } catch (error) {
      console.error(error);
    }
  };

  const clearAll = async () => {
    if (!ownerId) return;

    try {
      await fetch(`${API_URL}/property-owner/${ownerId}/notifications`, {
        method: "DELETE",
        headers: buildAuthHeaders("propertyOwner"),
      });
      setNotifications([]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="notifications"
        isHidden={sidebarHidden}
        setIsHidden={setSidebarHidden}
      />

      <main className="property-owner-main owner-notifications-main">
        <div className="owner-notifications-shell">
          <header className="owner-notifications-header">
            <div className="owner-notifications-heading">
              {sidebarHidden ? <MenuButton onClick={() => setSidebarHidden(false)} /> : null}
              <div>
                <span className="owner-notifications-kicker">Inbox</span>
                <h1>Notifications</h1>
                <p>Review owner activity updates, mark items as read, or clear your full notification list.</p>
              </div>
            </div>

            <button type="button" className="owner-notifications-clear" onClick={clearAll}>
              Clear All
            </button>
          </header>

          {loading ? (
            <div className="owner-notifications-empty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="owner-notifications-empty">No notifications yet.</div>
          ) : (
            <>
              <section className="owner-notifications-list">
                {paginatedItems.map((notification) => (
                  <article
                    key={notification._id}
                    className={`owner-notification-card ${notification.isRead ? "" : "owner-notification-card--unread"}`}
                  >
                    <div className="owner-notification-copy">
                      <strong>{notification.title}</strong>
                      <p>{notification.message}</p>
                      <small>{new Date(notification.createdAt).toLocaleString()}</small>
                    </div>

                    <div className="owner-notification-actions">
                      {!notification.isRead ? (
                        <button type="button" className="owner-notification-mark" onClick={() => markAsRead(notification._id)}>
                          Mark as Read
                        </button>
                      ) : (
                        <span className="owner-notification-readstate">Read</span>
                      )}
                    </div>
                  </article>
                ))}
              </section>

              <Pagination
                currentPage={currentPage}
                itemLabel="notifications"
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSize={pageSize}
                totalItems={totalItems}
                totalPages={totalPages}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
