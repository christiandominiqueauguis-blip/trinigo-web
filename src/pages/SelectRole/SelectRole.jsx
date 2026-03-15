import "./SelectRole.css";
import { useNavigate } from "react-router-dom";
import trinigoLogo from "../../assets/trinigo-logo.png";

export default function SelectRole() {
  const navigate = useNavigate();

  const handleChange = (e) => {
    const role = e.target.value;

    if (role === "property-owner") {
      navigate("/property-owner/register");
    }

    if (role === "admin") {
      navigate("/admin/register");
    }

    if (role === "tourism-site-manager") {
      navigate("/tourism-site-manager/register");
    }
  };

  return (
    <div className="select-role-wrapper">
      <div className="select-role-card">
        <img
          src={trinigoLogo}
          alt="TriniGo Logo"
          className="logo"
        />

        <select className="role-dropdown" onChange={handleChange}>
          <option value="">Select Your Role</option>
          <option value="admin">Admin / Tourism Officer</option>
          <option value="property-owner">Property Owner</option>
          <option value="tourism-site-manager">Tourism Site Manager</option>
        </select>
      </div>
    </div>
  );
}