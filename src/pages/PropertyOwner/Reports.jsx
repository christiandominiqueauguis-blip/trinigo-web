import { useState, useEffect } from "react";
import PropertyOwnerSidebar from "../../components/PropertyOwnerSidebar";
import MenuButton from "../../components/MenuButton";
import "./Reports.css";
import { API_URL, BASE_URL } from "../../config/api";

export default function Reports() {
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [recentUploads, setRecentUploads] = useState([]);
  const [activeMenuIndex, setActiveMenuIndex] = useState(null);

  useEffect(() => {
  fetch(`${API_URL}/reports`)
    .then(res => res.json())
    .then(data => {
      const formatted = data.map(item => ({
  _id: item._id,
  file: {
    name: item.fileName,
    size: item.fileSize,
    type: item.fileType,
  },
  preview: `${BASE_URL}${item.filePath}`,
  uploadedAt: new Date(item.createdAt),
  status: item.status,
}));

      setRecentUploads(formatted);
    });
}, []);

  return (
    <div className="property-owner-layout">
      <PropertyOwnerSidebar
        active="reports"
        isHidden={sidebarHidden}
      />

      <div
        className={`po-content ${sidebarHidden ? "full-width" : ""}`}
        onClick={() => setSidebarHidden(true)}
      >
        {/* HEADER */}
        <div className="po-report-header">
          {sidebarHidden && (
            <MenuButton
              onClick={(e) => {
                e.stopPropagation();
                setSidebarHidden(false);
              }}
            />
          )}

          <h1>Report</h1>
        </div>

        {/* UPLOAD SECTION */}
        <div className="po-report-upload-box">
          <div className="upload-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 16V8M12 8l-4 4M12 8l4 4"
                stroke="#2e7d32"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="3"
                stroke="#2e7d32"
                strokeWidth="2"
              />
            </svg>
          </div>

          <h3>Ready to submit new reports?</h3>
          <p>
            Click to browse your computer.
            Supports PDF, DOCX, and high-resolution images.
          </p>

          <div className="upload-actions">
            <>
  <input
    type="file"
    id="reportUpload"
    multiple
    hidden
    onChange={(e) => {
  const files = Array.from(e.target.files).map(file => ({
    file,
    preview: URL.createObjectURL(file)
  }));

  setSelectedFiles(prev => [...prev, ...files]);

  e.target.value = null;
}}
  />

  <button
    className="upload-btn"
    onClick={(e) => {
      e.stopPropagation();
      document.getElementById("reportUpload").click();
    }}
  >
    + Upload Files
  </button>
</>
            <button
  className="submit-btn"
  onClick={async (e) => {
  e.stopPropagation();

  if (selectedFiles.length === 0) return;

  const formData = new FormData();
  const ownerId = localStorage.getItem("ownerId");
  const ownerName = localStorage.getItem("ownerFullName");
  const accommodationName = localStorage.getItem("accommodationName");
  const propertyType = localStorage.getItem("propertyType");

  formData.append("ownerId", ownerId);
  formData.append("ownerName", ownerName);
  formData.append("accommodationName", accommodationName);
  formData.append("propertyType", propertyType);

  selectedFiles.forEach(item => {
    formData.append("reports", item.file);
  });

  try {
    const res = await fetch(`${API_URL}/reports`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(data.message);
      return;
    }

    const formatted = data.reports.map(item => ({
  _id: item._id,
  file: {
    name: item.fileName,
    size: item.fileSize,
    type: item.fileType,
  },
  preview: `${BASE_URL}${item.filePath}`,
  uploadedAt: new Date(item.createdAt),
  status: item.status,
}));

    setRecentUploads(prev => [...formatted, ...prev]);
    setSelectedFiles([]);
  } catch (error) {
    console.error("Upload failed:", error);
  }
}}
>
  Submit
</button>
          </div>

          {selectedFiles.length > 0 && (
  <div className="selected-files">
    {selectedFiles.map((item, index) => (
  <div
    key={index}
    className="selected-file-item"
  >
    <span
      className="remove-file"
      onClick={(e) => {
        e.stopPropagation();
        setSelectedFiles(prev =>
          prev.filter((_, i) => i !== index)
        );
      }}
    >
      ×
    </span>

    {item.file.type.startsWith("image/") ? (
      <img
        src={item.preview}
        alt={item.file.name}
        className="file-preview-image"
      />
    ) : (
      <span className="file-name">{item.file.name}</span>
    )}
  </div>
))}
  </div>
)}
        </div>

        {/* RECENT UPLOADS */}
        <div className="po-recent-uploads">
  <div className="recent-header">
    <h3>Recent Uploads</h3>
    {recentUploads.length > 0 && (
      <span className="file-total-badge">
        {recentUploads.length} {recentUploads.length === 1 ? "File" : "Files"} Total
      </span>
    )}
  </div>

          {recentUploads.length === 0 && (
  <p style={{ color: "#777" }}>No uploads yet.</p>
)}

  {recentUploads.map((item, index) => {
  const file = item.file;

  let fileSize = "";

if (file.size < 1024 * 1024) {
  fileSize = (file.size / 1024).toFixed(2) + " KB";
} else {
  fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";
}

  const formattedDate = item.uploadedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  let fileTypeClass = "";
  if (file.type.includes("pdf")) fileTypeClass = "pdf";
  else if (file.type.includes("word") || file.name.endsWith(".docx"))
    fileTypeClass = "doc";
  else if (file.type.startsWith("image/"))
    fileTypeClass = "doc"; // reuse blue style for images

  return (
    <div
  key={index}
  className="upload-item"
  onClick={() => window.open(item.preview)}
  style={{ cursor: "pointer", position: "relative" }}
>

  <span
  className={`report-status-badge ${item.status === "Approved" ? "status-confirmed" : "status-pending"}`}
>
  {item.status === "Approved" ? "Confirmed" : "Pending"}
</span>

  <div
  className="menu-dots"
  onClick={(e) => {
    e.stopPropagation();
    setActiveMenuIndex(index);
  }}
>
  <svg width="18" height="18" viewBox="0 0 24 24">
    <circle cx="12" cy="5" r="2" fill="#555" />
    <circle cx="12" cy="12" r="2" fill="#555" />
    <circle cx="12" cy="19" r="2" fill="#555" />
  </svg>
</div>

{activeMenuIndex === index && (
  <div
    className="delete-modal"
    onClick={(e) => e.stopPropagation()}
  >
    <button
      className="cancel-btn"
      onClick={() => setActiveMenuIndex(null)}
    >
      Cancel
    </button>

    <button
      className="confirm-delete-btn"
      onClick={async () => {
  await fetch(`${API_URL}/reports/${item._id}`, {
    method: "DELETE",
  });

  setRecentUploads(prev =>
    prev.filter(upload => upload._id !== item._id)
  );

  setActiveMenuIndex(null);
}}
    >
      Delete
    </button>
  </div>
)}

      <div className="file-icon">
  {file.type.includes("pdf") && (
    <svg viewBox="0 0 24 24" width="40" height="40">
      <path fill="#E53935" d="M6 2h7l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
        PDF
      </text>
    </svg>
  )}

  {(file.type.includes("word") || file.name.endsWith(".docx")) && (
    <svg viewBox="0 0 24 24" width="40" height="40">
      <path fill="#1E88E5" d="M6 2h7l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
      <text x="12" y="17" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
        DOCX
      </text>
    </svg>
  )}

  {file.type.startsWith("image/") && (
    <img
      src={item.preview}
      alt={file.name}
      className="recent-image-thumb"
    />
  )}
</div>
      <div className="file-info">
        <p>{file.name}</p>
        <span>
          {fileSize} • Uploaded on {formattedDate}
        </span>
      </div>
    </div>
  );
})}
        </div>
      </div>
    </div>
  );
}