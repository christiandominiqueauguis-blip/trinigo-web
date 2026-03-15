import { BrowserRouter, Routes, Route } from "react-router-dom";
import SelectRole from "../pages/SelectRole/SelectRole";
import PropertyOwnerRegister from "../pages/PropertyOwner/Register";
import AdminRegister from "../pages/Admin/AdminRegister";
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
import TouristSpots from "../pages/Admin/TouristSpots";
import AddTouristSpot from "../pages/Admin/AddTouristSpot";
import EditTouristSpot from "../pages/Admin/EditTouristSpot";
import Feedback from "../pages/PropertyOwner/Feedback";
import AdminFeedback from "../pages/Admin/AdminFeedback";
import Reports from "../pages/PropertyOwner/Reports";
import AdminReport from "../pages/Admin/AdminReport";
import TourismManagerRegister from "../pages/TourismSiteManager/TourismManagerRegister";
import TourismManagerLogin from "../pages/TourismSiteManager/TourismManagerLogin";
import TourismManagerReports from "../pages/TourismSiteManager/TourismManagerReports";
import EditAccommodation from "../pages/PropertyOwner/EditAccommodation";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SelectRole />} />

        <Route
          path="/property-owner/register"
          element={<PropertyOwnerRegister />}
        />
        <Route
          path="/property-owner/pending-approval"
          element={<PendingApproval />}
        />
        <Route
          path="/admin/register"
          element={<AdminRegister />}
        />
        <Route
          path="/admin/admin-register"
          element={<AdminRegister />}
        />
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />
        <Route
          path="/admin/dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/admin/property-owner-application"
          element={<PropertyOwnerApplication />}
        />
        <Route
          path="/property-owner/login"
          element={<PropertyOwnerLogin />}
        />
        <Route
          path="/property-owner/welcome"
          element={<Welcome />}
        />
        <Route
          path="/property-owner/create-accommodation"
          element={<CreateAccommodation />}
        />
        <Route
          path="/property-owner/select-room-type"
          element={<SelectRoomType />}
        />
        <Route
          path="/property-owner/dashboard"
          element={<PropertyOwnerDashboard />}
        />
        <Route
          path="/property-owner/booking-requests"
          element={<BookingRequests />}
        />
        <Route
          path="/admin/tourist-spots"
          element={<TouristSpots />}
        />
        <Route
          path="/admin/add-tourist-spot"
          element={<AddTouristSpot />}
        />
        <Route
          path="/admin/tourist-spots/:id"
          element={<EditTouristSpot />}
        />
        <Route
          path="/property-owner/feedback"
          element={<Feedback />}
        />
        <Route
          path="/admin/feedback"
          element={<AdminFeedback />}
        />
        <Route
          path="/property-owner/reports"
          element={<Reports />}
        />
        <Route
          path="/admin/report"
          element={<AdminReport />}
        />
        <Route
          path="/tourism-site-manager/register"
          element={<TourismManagerRegister />}
        />
        <Route
          path="/tourism-site-manager/login"
          element={<TourismManagerLogin />}
        />
        <Route
          path="/tourism-site-manager/dashboard"
          element={<TourismManagerReports />}
        />
        <Route
          path="/property-owner/accommodations/:id"
          element={<EditAccommodation />}
        />
      </Routes>
    </BrowserRouter>
  );
}