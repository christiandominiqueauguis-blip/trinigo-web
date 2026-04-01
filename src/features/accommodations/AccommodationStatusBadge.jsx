import { getStatusMeta } from "./accommodationHelpers";

export default function AccommodationStatusBadge({ status, className = "" }) {
  const meta = getStatusMeta(status);
  const nextClassName = ["acm-status-badge", `acm-status-badge--${meta.value}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={nextClassName}>
      <span className="acm-status-dot" />
      {meta.label}
    </span>
  );
}
