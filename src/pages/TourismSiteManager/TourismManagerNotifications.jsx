import { useEffect, useState } from "react";
import MenuButton from "../../components/MenuButton";
import Pagination from "../../components/Pagination";
import TourismManagerSidebar from "../../components/TourismManagerSidebar";
import { API_URL } from "../../config/api";
import { buildAuthHeaders } from "../../features/auth/roleSession";
import usePagination from "../../hooks/usePagination";
import {
  applyTourismManagerNotificationState,
  buildTourismManagerNotifications,
  hideTourismManagerNotifications,
  markTourismManagerNotificationsRead,
} from "../../features/tourismManager/notificationState";
import "../PropertyOwner/Notifications.css";

export default function TourismManagerNotifications() {
  const managerId = localStorage.getItem("tourismManagerId") || "";
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/tourist-spot-reports`, {
      headers: buildAuthHeaders("tourismManager"),
    })
      .then((response) => response.json())
      .then((data) => {
        const built = buildTourismManagerNotifications(Array.isArray(data) ? data : [], managerId);
        setNotifications(applyTourismManagerNotificationState(built, managerId));
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [managerId]);

  const { currentPage, pageSize, paginatedItems, setCurrentPage, setPageSize, totalItems, totalPages } =
    usePagination(notifications, {
      initialPageSize: 6,
      resetKey: notifications.length,
    });

  const markAsRead = (notificationId) => {
    markTourismManagerNotificationsRead(managerId, [notificationId]);
    setNotifications((current) =>
      current.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
    );
  };

  const clearAll = () => {
    hideTourismManagerNotifications(
      managerId,
      notifications.map((item) => item._id)
    );
    setNotifications([]);
  };

  return (
    <div className="property-owner-layout">
      <TourismManagerSidebar
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
                <p>Review updates from your tourist spot report submissions and approval activity.</p>
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
