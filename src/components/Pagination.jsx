import "./Pagination.css";

const PAGINATION_GAP = "gap";

function getPageItems(totalPages, currentPage) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push(PAGINATION_GAP);
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push(PAGINATION_GAP);
  }

  items.push(totalPages);
  return items;
}

export default function Pagination({
  currentPage,
  itemLabel = "items",
  onPageChange,
  onPageSizeChange,
  pageSize,
  pageSizeOptions = [6, 9, 12],
  totalItems,
  totalPages,
}) {
  if (!totalItems) return null;

  const pageItems = getPageItems(totalPages, currentPage);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const isSinglePage = totalPages <= 1;

  return (
    <nav className="app-pagination" aria-label={`${itemLabel} pagination`}>
      <div className="app-pagination-summary">
        <strong>
          Showing {start}-{end}
        </strong>
        <span>
          of {totalItems} {itemLabel}
        </span>
      </div>

      <div className="app-pagination-actions">
        {onPageSizeChange ? (
          <label className="app-pagination-size">
            <span>Per page</span>
            <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="app-pagination-controls">
          <button
            type="button"
            className="app-pagination-nav"
            disabled={currentPage === 1 || isSinglePage}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          >
            Previous
          </button>

          <div className="app-pagination-pages">
            {pageItems.map((item, index) =>
              item === PAGINATION_GAP ? (
                <span key={`gap-${index + 1}`} className="app-pagination-gap">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`app-pagination-page ${item === currentPage ? "app-pagination-page--active" : ""}`}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="app-pagination-nav"
            disabled={currentPage === totalPages || isSinglePage}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </nav>
  );
}
