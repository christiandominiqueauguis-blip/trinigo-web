import TourismManagerGuests from "./TourismManagerGuests";

export default function TourismManagerBookings() {
  return (
    <TourismManagerGuests
      activeNav="bookings"
      kicker="Booking Management"
      emptyMessage="No bookings matched this tourist spot view."
      emptyDescription="Try a different search or filter, or add a new walk-in booking for visitors arriving directly at your assigned tourist spot."
      actionLabel="Add Walk-in Booking"
    />
  );
}
