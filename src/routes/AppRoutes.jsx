import { BrowserRouter, Routes, Route } from "react-router-dom";
import SelectRole from "../pages/SelectRole/SelectRole";
import PropertyOwnerRegister from "../pages/PropertyOwner/Register";
import AdminLogin from "../pages/Admin/AdminLogin";
import Dashboard from "../pages/Admin/Dashboard";
import PropertyOwnerApplication from "../pages/Admin/PropertyOwnerApplication";
import PendingApproval from "../pages/PropertyOwner/PendingApproval";
import PropertyOwnerLogin from "../pages/PropertyOwner/PropertyOwnerLogin";
import Welcome from "../pages/PropertyOwner/Welcome";
import CreateAccommodation from "../pages/PropertyOwner/CreateAccommodation";
import SelectRoomType from "../pages/PropertyOwner/SelectRoomType";
import PropertyOwnerDashboard from "../pages/PropertyOwner/PropertyOwnerDashboard";
import BookingRequests from "../pages/PropertyOwner/BookingRequests";
import Profile from "../pages/PropertyOwner/Profile";
import Notifications from "../pages/PropertyOwner/Notifications";
import TouristSpots from "../pages/Admin/TouristSpots";
import Accommodations from "../pages/Admin/Accommodations";
import AddTouristSpot from "../pages/Admin/AddTouristSpot";
import EditTouristSpot from "../pages/Admin/EditTouristSpot";
import Feedback from "../pages/PropertyOwner/Feedback";
import Income from "../pages/PropertyOwner/Income";
import AdminFeedback from "../pages/Admin/AdminFeedback";
import Reports from "../pages/PropertyOwner/Reports";
import AdminReport from "../pages/Admin/AdminReport";
import TourismManagerLogin from "../pages/TourismSiteManager/TourismManagerLogin";
import TourismManagerDashboard from "../pages/TourismSiteManager/TourismManagerDashboard";
import TourismManagerNotifications from "../pages/TourismSiteManager/TourismManagerNotifications";
import TourismManagerIncome from "../pages/TourismSiteManager/TourismManagerIncome";
import TourismManagerFeedback from "../pages/TourismSiteManager/TourismManagerFeedback";
import TourismManagerBookings from "../pages/TourismSiteManager/TourismManagerBookings";
import TourismManagerGuests from "../pages/TourismSiteManager/TourismManagerGuests";
import TourismManagerReports from "../pages/TourismSiteManager/TourismManagerReports";
import EditAccommodation from "../pages/PropertyOwner/EditAccommodation";
import AdminAccommodationDetail from "../pages/Admin/AdminAccommodationDetail";
import AdminUserManagement from "../pages/Admin/AdminUserManagement";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectRole />} />

        <Route
          path="/property-owner/pending-approval"
          element={<PendingApproval />}
        />
        <Route element={<PublicOnlyRoute />}>
          <Route
            path="/property-owner/register"
            element={<PropertyOwnerRegister />}
          />
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />
          <Route
            path="/property-owner/login"
            element={<PropertyOwnerLogin />}
          />
          <Route
            path="/tourism-site-manager/login"
            element={<TourismManagerLogin />}
          />
        </Route>

        <Route element={<ProtectedRoute role="admin" />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/property-owner-application" element={<PropertyOwnerApplication />} />
          <Route path="/admin/user-management" element={<AdminUserManagement />} />
          <Route path="/admin/tourist-spots" element={<TouristSpots />} />
          <Route path="/admin/accommodations" element={<Accommodations />} />
          <Route path="/admin/add-tourist-spot" element={<AddTouristSpot />} />
          <Route path="/admin/tourist-spots/:id" element={<EditTouristSpot />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/admin/report" element={<AdminReport />} />
          <Route path="/admin/accommodations/:id" element={<AdminAccommodationDetail />} />
        </Route>

        <Route element={<ProtectedRoute role="propertyOwner" />}>
          <Route path="/property-owner/welcome" element={<Welcome />} />
          <Route path="/property-owner/create-accommodation" element={<CreateAccommodation />} />
          <Route path="/property-owner/select-room-type" element={<SelectRoomType />} />
          <Route path="/property-owner/dashboard" element={<PropertyOwnerDashboard />} />
          <Route path="/property-owner/booking-requests" element={<BookingRequests />} />
          <Route path="/property-owner/notifications" element={<Notifications />} />
          <Route path="/property-owner/profile" element={<Profile />} />
          <Route path="/property-owner/income" element={<Income />} />
          <Route path="/property-owner/feedback" element={<Feedback />} />
          <Route path="/property-owner/reports" element={<Reports />} />
          <Route path="/property-owner/accommodations/:id" element={<EditAccommodation />} />
        </Route>

        <Route element={<ProtectedRoute role="tourismManager" />}>
          <Route path="/tourism-site-manager/dashboard" element={<TourismManagerDashboard />} />
          <Route path="/tourism-site-manager/bookings" element={<TourismManagerBookings />} />
          <Route path="/tourism-site-manager/guests" element={<TourismManagerGuests />} />
          <Route path="/tourism-site-manager/notifications" element={<TourismManagerNotifications />} />
          <Route path="/tourism-site-manager/income" element={<TourismManagerIncome />} />
          <Route path="/tourism-site-manager/feedback" element={<TourismManagerFeedback />} />
          <Route path="/tourism-site-manager/reports" element={<TourismManagerReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
