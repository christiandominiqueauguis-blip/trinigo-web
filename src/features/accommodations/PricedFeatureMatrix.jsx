import { formatCurrencyInput, formatPhilippineCurrency } from "./accommodationHelpers";

export default function PricedFeatureMatrix({
  options,
  selected,
  toggle,
  onPriceChange,
  readOnly = false,
}) {
  const selectedMap = new Map((Array.isArray(selected) ? selected : []).map((item) => [item.key, item]));

  return (
    <div className="acm-priced-grid">
      {options.map((option) => {
        const selectedItem = selectedMap.get(option.key);
        const isSelected = Boolean(selectedItem);

        return (
          <div
            key={option.key}
            className={`acm-priced-card ${isSelected ? "acm-priced-card--active" : ""}`}
          >
            <button
              type="button"
              className={`acm-priced-toggle ${isSelected ? "acm-priced-toggle--active" : ""} ${
                readOnly ? "acm-priced-toggle--readonly" : ""
              }`}
              onClick={() => !readOnly && toggle(option.key)}
              aria-pressed={isSelected}
            >
              <div className="acm-priced-copy">
                <span className="acm-priced-title">{option.label}</span>
                <span className="acm-priced-caption">
                  {isSelected
                    ? "Selected option stored with a manual price"
                    : readOnly
                      ? "Not included in this listing"
                      : "Select this option to add a manual price"}
                </span>
              </div>
              <span className="acm-priced-state">{isSelected ? "Selected" : "Add"}</span>
            </button>

            {isSelected ? (
              readOnly ? (
                <div className="acm-price-display">{formatPhilippineCurrency(selectedItem.price)}</div>
              ) : (
                <label className="acm-price-field">
                  <span className="acm-price-label">Manual Price</span>
                  <div className="acm-price-input-wrap">
                    <span className="acm-price-prefix">PHP</span>
                    <input
                      className="acm-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={selectedItem.price || ""}
                      onChange={(event) => onPriceChange(option.key, formatCurrencyInput(event.target.value))}
                    />
                  </div>
                </label>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
