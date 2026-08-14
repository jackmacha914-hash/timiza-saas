// =====================================================
// RESOURCES.JS
// =====================================================

// =====================================================
// API BASE URL
// =====================================================

if (typeof window.API_BASE_URL === "undefined") {
  window.API_BASE_URL = "https://timiza-saas.onrender.com";
}

const API_BASE_URL = window.API_BASE_URL;

// =====================================================
// GLOBAL VARIABLES
// =====================================================

let availableClasses = [];
let userClass = null;

// =====================================================
// HELPERS
// =====================================================

function getToken() {
  return localStorage.getItem("token");
}

function getUserProfile() {
  try {
    return JSON.parse(
      localStorage.getItem("userProfile") || "{}"
    );
  } catch (error) {
    console.error(
      "[RESOURCES] Failed to parse userProfile:",
      error
    );

    return {};
  }
}

function getUserRole() {
  const profile = getUserProfile();

  // Prefer stored profile
  if (profile.role) {
    return String(profile.role).toLowerCase();
  }

  // Fallback to JWT
  const token = getToken();

  if (!token) {
    return "student";
  }

  try {
    const parts = token.split(".");

    if (parts.length === 3) {
      const payload = JSON.parse(
        atob(parts[1])
      );

      return String(
        payload.role || "student"
      ).toLowerCase();
    }
  } catch (error) {
    console.error(
      "[RESOURCES] Failed to decode token:",
      error
    );
  }

  return "student";
}

// =====================================================
// IMPORTANT:
// NORMALIZE RESOURCE FILE PATH
// =====================================================
//
// Handles all of these:
//
// filename.docx
// /filename.docx
// uploads/resources/filename.docx
// /uploads/resources/filename.docx
//
// Final result:
//
// https://timiza-saas.onrender.com/uploads/resources/filename.docx
// =====================================================

function getResourceUrl(resourcePath) {
  if (!resourcePath) {
    return "#";
  }

  let cleanPath = String(resourcePath).trim();

  // Remove full API domain if accidentally stored
  cleanPath = cleanPath.replace(
    /^https?:\/\/[^/]+/i,
    ""
  );

  // Decode repeatedly if necessary
  try {
    cleanPath = decodeURIComponent(cleanPath);
  } catch (error) {
    // Ignore invalid URI encoding
  }

  // Remove leading slash
  cleanPath = cleanPath.replace(/^\/+/, "");

  // Remove duplicate uploads/resources prefixes
  cleanPath = cleanPath.replace(
    /^(?:uploads\/resources\/)+/i,
    ""
  );

  // Final URL
  return `${API_BASE_URL}/uploads/resources/${cleanPath}`;
}

// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =====================================================
// INLINE MESSAGE
// =====================================================

function showInlineMessage(
  message,
  type = "error"
) {
  let element =
    document.getElementById("resource-upload-msg");

  if (!element) {
    element = document.createElement("div");
    element.id = "resource-upload-msg";

    const container =
      document.getElementById(
        "upload-form-container"
      );

    if (container) {
      container.appendChild(element);
    } else {
      document.body.appendChild(element);
    }
  }

  element.textContent = message;

  element.style.display = "block";
  element.style.marginTop = "10px";
  element.style.padding = "10px";
  element.style.borderRadius = "5px";

  if (type === "success") {
    element.style.color = "#2e7d32";
    element.style.backgroundColor = "#e8f5e9";
  } else {
    element.style.color = "#d32f2f";
    element.style.backgroundColor = "#ffebee";
  }

  clearTimeout(
    element._hideTimer
  );

  element._hideTimer = setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}

function showInlineError(message) {
  showInlineMessage(message, "error");
}

function showInlineSuccess(message) {
  showInlineMessage(message, "success");
}

// =====================================================
// AUTH CHECK
// =====================================================

function requireAuthentication() {
  const token = getToken();

  if (!token) {
    console.warn(
      "[RESOURCES] No authentication token"
    );

    window.location.href = "/login.html";

    return false;
  }

  return true;
}

// =====================================================
// RESOURCE UPLOAD BUTTON
// =====================================================

function initializeUploadButton() {
  const uploadBtn =
    document.getElementById(
      "upload-resource-btn"
    );

  const uploadContainer =
    document.getElementById(
      "upload-form-container"
    );

  const classSelector =
    document.getElementById(
      "resource-class"
    );

  const classSelect =
    document.getElementById(
      "class-select"
    );

  if (!uploadBtn) {
    console.warn(
      "[RESOURCES] upload-resource-btn not found"
    );

    return;
  }

  uploadBtn.style.display = "block";
  uploadBtn.style.visibility = "visible";

  uploadBtn.addEventListener(
    "click",
    function (event) {
      event.preventDefault();

      console.log(
        "[RESOURCES] Upload Resource clicked"
      );

      if (uploadContainer) {
        uploadContainer.style.display = "block";
        uploadContainer.style.visibility = "visible";
        uploadContainer.style.opacity = "1";
      }

      if (classSelector) {
        classSelector.style.display = "block";
        classSelector.style.visibility = "visible";
        classSelector.style.opacity = "1";
      }

      if (classSelect) {
        classSelect.style.display = "block";
        classSelect.style.visibility = "visible";
        classSelect.style.opacity = "1";
        classSelect.style.pointerEvents = "auto";
      }
    }
  );
}

// =====================================================
// CANCEL UPLOAD
// =====================================================

function initializeCancelButton() {
  const cancelBtn =
    document.getElementById(
      "cancel-upload-btn"
    );

  if (!cancelBtn) {
    return;
  }

  cancelBtn.addEventListener(
    "click",
    function (event) {
      event.preventDefault();

      const container =
        document.getElementById(
          "upload-form-container"
        );

      const form =
        document.getElementById(
          "upload-form"
        );

      if (container) {
        container.style.display = "none";
      }

      if (form) {
        form.reset();
      }

      const status =
        document.getElementById(
          "upload-status"
        );

      if (status) {
        status.style.display = "none";
      }

      const message =
        document.getElementById(
          "resource-upload-msg"
        );

      if (message) {
        message.style.display = "none";
      }
    }
  );
}

// =====================================================
// HANDLE FILE UPLOAD
// =====================================================

async function handleFileUpload(event) {
  event.preventDefault();

  console.log(
    "[RESOURCES] File upload started"
  );

  const form =
    document.getElementById(
      "upload-form"
    );

  if (!form) {
    console.error(
      "[RESOURCES] Upload form not found"
    );

    return;
  }

  const fileInput =
    document.getElementById(
      "resource-file"
    ) ||
    form.querySelector(
      'input[type="file"]'
    );

  const classSelect =
    document.getElementById(
      "class-select"
    ) ||
    form.querySelector(
      "select"
    );

  const uploadBtn =
    document.getElementById(
      "submit-resource-btn"
    ) ||
    form.querySelector(
      'button[type="submit"]'
    );

  console.log(
    "[RESOURCES] Form elements:",
    {
      fileInput:
        fileInput
          ? "found"
          : "not found",

      classSelect:
        classSelect
          ? "found"
          : "not found",

      uploadBtn:
        uploadBtn
          ? "found"
          : "not found",

      class:
        classSelect
          ? classSelect.value
          : null
    }
  );

  try {
    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    const token = getToken();

    if (!token) {
      alert(
        "Please log in to upload resources."
      );

      window.location.href =
        "/login.html";

      return;
    }

    // -------------------------------------------------
    // FILE VALIDATION
    // -------------------------------------------------

    if (
      !fileInput ||
      !fileInput.files ||
      !fileInput.files.length
    ) {
      throw new Error(
        "Please select a file to upload."
      );
    }

    const file =
      fileInput.files[0];

    console.log(
      "[RESOURCES] Selected file:",
      {
        name: file.name,
        size: file.size,
        type: file.type
      }
    );

    // -------------------------------------------------
    // CLASS VALIDATION
    // -------------------------------------------------

    if (!classSelect) {
      throw new Error(
        "Class selector was not found."
      );
    }

    const classAssigned =
      String(
        classSelect.value || ""
      ).trim();

    if (!classAssigned) {
      throw new Error(
        "Please select a class."
      );
    }

    // -------------------------------------------------
    // FILE SIZE
    // -------------------------------------------------

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new Error(
        "File is too large. Maximum size is 10 MB."
      );
    }

    // -------------------------------------------------
    // ALLOWED EXTENSIONS
    // -------------------------------------------------

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const allowedExtensions = [
      "pdf",
      "doc",
      "docx"
    ];

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      throw new Error(
        "Only PDF, DOC and DOCX files are allowed."
      );
    }

    // -------------------------------------------------
    // DISABLE BUTTON
    // -------------------------------------------------

    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.textContent =
        "Uploading...";
    }

    const statusElement =
      document.getElementById(
        "upload-status"
      );

    if (statusElement) {
      statusElement.textContent =
        "Uploading...";
      statusElement.style.color =
        "blue";
      statusElement.style.display =
        "block";
    }

    // -------------------------------------------------
    // FORM DATA
    // -------------------------------------------------

    const formData =
      new FormData();

    formData.append(
      "resource",
      file
    );

    formData.append(
      "classAssigned",
      classAssigned
    );

    console.log(
      "[RESOURCES] Uploading to:",
      `${API_BASE_URL}/api/resources/upload`
    );

    console.log(
      "[RESOURCES] Class:",
      classAssigned
    );

    // -------------------------------------------------
    // UPLOAD
    // -------------------------------------------------

    const response =
      await fetch(
        `${API_BASE_URL}/api/resources/upload`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`
          },

          body: formData
        }
      );

    let result = {};

    try {
      result =
        await response.json();
    } catch (error) {
      console.warn(
        "[RESOURCES] Server returned non-JSON response"
      );
    }

    console.log(
      "[RESOURCES] Upload response:",
      response.status,
      result
    );

    if (!response.ok) {
      throw new Error(
        result.message ||
        `Upload failed (HTTP ${response.status})`
      );
    }

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    console.log(
      "[RESOURCES] Upload successful:",
      result
    );

    showInlineSuccess(
      "Resource uploaded successfully."
    );

    if (statusElement) {
      statusElement.textContent =
        "Upload successful!";
      statusElement.style.color =
        "green";
      statusElement.style.display =
        "block";
    }

    // Reset form
    form.reset();

    // Hide upload form
    const uploadContainer =
      document.getElementById(
        "upload-form-container"
      );

    if (uploadContainer) {
      uploadContainer.style.display =
        "none";
    }

    // Reload resources
    await loadResources();

  } catch (error) {
    console.error(
      "[RESOURCES] Upload error:",
      error
    );

    showInlineError(
      error.message ||
      "Failed to upload resource."
    );

    const statusElement =
      document.getElementById(
        "upload-status"
      );

    if (statusElement) {
      statusElement.textContent =
        `Error: ${
          error.message ||
          "Upload failed"
        }`;

      statusElement.style.color =
        "red";

      statusElement.style.display =
        "block";
    }

  } finally {

    const uploadBtn =
      document.getElementById(
        "submit-resource-btn"
      );

    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.textContent =
        "Upload Resource";
    }
  }
}

// =====================================================
// INITIALIZE UPLOAD FORM
// =====================================================

function initializeUploadForm() {
  const form =
    document.getElementById(
      "upload-form"
    );

  if (!form) {
    console.warn(
      "[RESOURCES] Upload form not found"
    );

    return;
  }

  // IMPORTANT:
  // Only ONE submit listener.
  form.addEventListener(
    "submit",
    handleFileUpload
  );

  console.log(
    "[RESOURCES] Upload form initialized"
  );
}

// =====================================================
// LOAD RESOURCES
// =====================================================

async function loadResources(
  selectedClass = null
) {
  if (!requireAuthentication()) {
    return;
  }

  const token = getToken();
  const role = getUserRole();
  const userProfile =
    getUserProfile();

  console.log(
    "[RESOURCES] Loading resources",
    {
      role,
      selectedClass
    }
  );

  const url =
    new URL(
      `${API_BASE_URL}/api/resources`
    );

  // -------------------------------------------------
  // STUDENT
  // -------------------------------------------------

  if (role === "student") {

    let studentClass =
      userProfile.class ||
      userProfile.profile?.class ||
      userProfile.classAssigned ||
      null;

    if (!studentClass) {
      console.warn(
        "[RESOURCES] Student class missing from localStorage"
      );

      // Backend will resolve the actual class.
      // Do not force an incorrect query parameter.
    } else {
      studentClass =
        String(
          studentClass
        ).trim();

      url.searchParams.set(
        "class",
        studentClass
      );

      userClass =
        studentClass;
    }

    // Hide class filter
    const classFilter =
      document.getElementById(
        "class-filter"
      );

    if (classFilter) {
      classFilter.style.display =
        "none";

      const label =
        classFilter.previousElementSibling;

      if (
        label &&
        label.tagName === "LABEL"
      ) {
        label.style.display =
          "none";
      }
    }

  }

  // -------------------------------------------------
  // TEACHER / ADMIN
  // -------------------------------------------------

  else {

    if (
      selectedClass &&
      selectedClass !== "all"
    ) {
      url.searchParams.set(
        "class",
        String(
          selectedClass
        ).trim()
      );
    }
  }

  console.log(
    "[RESOURCES] Fetching:",
    url.toString()
  );

  try {

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch (error) {
      throw new Error(
        "Server returned an invalid response."
      );
    }

    console.log(
      "[RESOURCES] Response:",
      response.status,
      data
    );

    if (!response.ok) {
      throw new Error(
        data.message ||
        `Failed to load resources (HTTP ${response.status})`
      );
    }

    // -------------------------------------------------
    // STORE CLASSES
    // -------------------------------------------------

    availableClasses =
      Array.isArray(data.classes)
        ? data.classes
        : [];

    if (data.userClass) {
      userClass =
        data.userClass;
    }

    // -------------------------------------------------
    // UPDATE FILTER
    // -------------------------------------------------

    if (
      role === "teacher" ||
      role === "admin" ||
      role === "superadmin"
    ) {
      updateClassFilter();
    }

    // -------------------------------------------------
    // DISPLAY
    // -------------------------------------------------

    renderResources(
      data.resources || []
    );

  } catch (error) {

    console.error(
      "[RESOURCES] Load error:",
      error
    );

    const resourceList =
      document.getElementById(
        "resource-list"
      );

    if (resourceList) {
      resourceList.innerHTML = `
        <div
          class="error-message"
          style="
            color:#d32f2f;
            padding:15px;
            background:#ffebee;
            border-radius:4px;
            margin:10px 0;
          "
        >
          ${escapeHtml(
            error.message ||
            "Failed to load resources."
          )}
        </div>
      `;
    }
  }
}

// =====================================================
// RENDER RESOURCES
// =====================================================

function renderResources(
  resources
) {
  const resourceList =
    document.getElementById(
      "resource-list"
    );

  if (!resourceList) {
    console.error(
      "[RESOURCES] resource-list not found"
    );

    return;
  }

  resourceList.innerHTML = "";

  if (
    !Array.isArray(resources) ||
    resources.length === 0
  ) {
    resourceList.innerHTML = `
      <li>
        No resources available.
      </li>
    `;

    return;
  }

  // -------------------------------------------------
  // GROUP BY CLASS
  // -------------------------------------------------

  const resourcesByClass = {};

  resources.forEach(
    resource => {

      const className =
        String(
          resource.classAssigned ||
          "General"
        ).trim();

      if (
        !resourcesByClass[className]
      ) {
        resourcesByClass[className] =
          [];
      }

      resourcesByClass[className]
        .push(resource);
    }
  );

  // -------------------------------------------------
  // SORT CLASSES
  // -------------------------------------------------

  const sortedClasses =
    Object.keys(
      resourcesByClass
    ).sort(
      (a, b) =>
        a.localeCompare(b)
    );

  // -------------------------------------------------
  // RENDER
  // -------------------------------------------------

  sortedClasses.forEach(
    className => {

      const classResources =
        resourcesByClass[
          className
        ];

      const classSection =
        document.createElement(
          "div"
        );

      classSection.className =
        "resource-class-section";

      // Header
      const classHeader =
        document.createElement(
          "div"
        );

      classHeader.className =
        "resource-class-header";

      classHeader.innerHTML = `
        <h3>
          ${escapeHtml(
            className
          )}
        </h3>

        <span class="resource-count">
          ${
            classResources.length
          }
          ${
            classResources.length === 1
              ? "resource"
              : "resources"
          }
        </span>
      `;

      classSection.appendChild(
        classHeader
      );

      // Grid
      const resourcesContainer =
        document.createElement(
          "div"
        );

      resourcesContainer.className =
        "resources-grid";

      // Sort resources
      classResources.sort(
        (a, b) => {

          const dateA =
            new Date(
              a.createdAt || 0
            );

          const dateB =
            new Date(
              b.createdAt || 0
            );

          return dateB - dateA;
        }
      );

      classResources.forEach(
        resource => {

          const resourceCard =
            createResourceCard(
              resource
            );

          resourcesContainer.appendChild(
            resourceCard
          );
        }
      );

      classSection.appendChild(
        resourcesContainer
      );

      resourceList.appendChild(
        classSection
      );
    }
  );
}

// =====================================================
// CREATE RESOURCE CARD
// =====================================================

function createResourceCard(
  resource
) {
  const card =
    document.createElement(
      "div"
    );

  card.className =
    "resource-card";

  const name =
    String(
      resource.name ||
      "Unnamed resource"
    );

  const ext =
    name
      .split(".")
      .pop()
      .toLowerCase();

  let icon = "📄";
  let type = "Document";

  if (ext === "pdf") {
    icon = "📄";
    type = "PDF";
  } else if (
    ext === "doc" ||
    ext === "docx"
  ) {
    icon = "📝";
    type = "Word";
  } else if (
    ext === "xls" ||
    ext === "xlsx"
  ) {
    icon = "📊";
    type = "Excel";
  } else if (
    ext === "ppt" ||
    ext === "pptx"
  ) {
    icon = "📑";
    type = "PowerPoint";
  } else if (
    [
      "jpg",
      "jpeg",
      "png",
      "gif"
    ].includes(ext)
  ) {
    icon = "🖼️";
    type = "Image";
  }

  // -------------------------------------------------
  // FIX FILE URL
  // -------------------------------------------------

  const fileUrl =
    getResourceUrl(
      resource.path
    );

  console.log(
    "[RESOURCES] File URL:",
    {
      name,
      storedPath:
        resource.path,
      finalUrl:
        fileUrl
    }
  );

  // -------------------------------------------------
  // DATE
  // -------------------------------------------------

  let uploadDate =
    "";

  if (resource.createdAt) {
    const date =
      new Date(
        resource.createdAt
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      uploadDate =
        date.toLocaleDateString();
    }
  }

  // -------------------------------------------------
  // SIZE
  // -------------------------------------------------

  let sizeText = "";

  if (
    resource.size &&
    Number(resource.size) > 0
  ) {
    sizeText =
      `${(
        Number(resource.size) /
        1024
      ).toFixed(1)} KB`;
  }

  const resourceType =
    sizeText
      ? `${type} • ${sizeText}`
      : type;

  // -------------------------------------------------
  // UPLOADER
  // -------------------------------------------------

  let uploaderInfo =
    `Uploaded on ${uploadDate}`;

  if (
    resource.uploadedBy &&
    resource.uploadedBy.name
  ) {
    uploaderInfo =
      `Uploaded by ${
        escapeHtml(
          resource.uploadedBy.name
        )
      } on ${uploadDate}`;
  }

  // -------------------------------------------------
  // CARD
  // -------------------------------------------------

  card.innerHTML = `
    <div class="resource-icon">
      ${icon}
    </div>

    <div class="resource-content">

      <div
        class="resource-name"
        title="${escapeHtml(
          name
        )}"
      >
        <a
          href="${fileUrl}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${escapeHtml(
            name
          )}
        </a>
      </div>

      <div class="resource-type">
        ${resourceType}
      </div>

      <div class="resource-meta">
        ${uploaderInfo}
      </div>

    </div>

    <div class="resource-actions">

      <a
        href="${fileUrl}"
        download="${escapeHtml(
          name
        )}"
        class="download-btn"
        title="Download"
      >
        <i class="fas fa-download"></i>
      </a>

      ${
        resource.canDelete
          ? `
            <button
              type="button"
              class="delete-btn"
              data-id="${escapeHtml(
                resource._id
              )}"
              title="Delete"
            >
              <i class="fas fa-trash"></i>
            </button>
          `
          : ""
      }

    </div>
  `;

  return card;
}

// =====================================================
// DELETE RESOURCE
// =====================================================

async function deleteResource(
  resourceId
) {
  if (!resourceId) {
    showInlineError(
      "No resource ID provided."
    );

    return;
  }

  const token =
    getToken();

  if (!token) {
    showInlineError(
      "Authentication required."
    );

    return;
  }

  const cleanId =
    String(
      resourceId
    ).trim();

  if (
    !/^[0-9a-fA-F]{24}$/.test(
      cleanId
    )
  ) {
    showInlineError(
      "Invalid resource ID."
    );

    return;
  }

  try {

    console.log(
      "[RESOURCES] Deleting:",
      cleanId
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/resources/${cleanId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"
          }
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch (error) {
      // Empty response is okay
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        `Failed to delete resource (HTTP ${response.status})`
      );
    }

    console.log(
      "[RESOURCES] Delete successful:",
      data
    );

    showInlineSuccess(
      "Resource deleted successfully."
    );

    await loadResources();

  } catch (error) {

    console.error(
      "[RESOURCES] Delete error:",
      error
    );

    showInlineError(
      error.message ||
      "Failed to delete resource."
    );
  }
}

// =====================================================
// DELETE EVENT DELEGATION
// =====================================================

function initializeResourceList() {
  const resourceList =
    document.getElementById(
      "resource-list"
    );

  if (!resourceList) {
    return;
  }

  resourceList.addEventListener(
    "click",
    function (event) {

      const deleteButton =
        event.target.closest(
          ".delete-btn"
        );

      if (!deleteButton) {
        return;
      }

      event.preventDefault();

      const resourceId =
        deleteButton.dataset.id;

      if (!resourceId) {
        return;
      }

      const confirmed =
        confirm(
          "Are you sure you want to delete this resource?"
        );

      if (confirmed) {
        deleteResource(
          resourceId
        );
      }
    }
  );
}

// =====================================================
// CLASS FILTER
// =====================================================

function updateClassFilter() {
  const classFilter =
    document.getElementById(
      "class-filter"
    );

  if (!classFilter) {
    return;
  }

  const role =
    getUserRole();

  // -------------------------------------------------
  // STUDENT
  // -------------------------------------------------

  if (role === "student") {

    classFilter.style.display =
      "none";

    const label =
      classFilter.previousElementSibling;

    if (
      label &&
      label.tagName === "LABEL"
    ) {
      label.style.display =
        "none";
    }

    return;
  }

  // -------------------------------------------------
  // TEACHER / ADMIN
  // -------------------------------------------------

  classFilter.style.display =
    "inline-block";

  const label =
    classFilter.previousElementSibling;

  if (
    label &&
    label.tagName === "LABEL"
  ) {
    label.style.display =
      "inline-block";
  }

  classFilter.innerHTML = "";

  // All Classes
  const allOption =
    document.createElement(
      "option"
    );

  allOption.value =
    "all";

  allOption.textContent =
    "All Classes";

  classFilter.appendChild(
    allOption
  );

  // Classes
  if (
    Array.isArray(
      availableClasses
    )
  ) {

    availableClasses
      .filter(Boolean)
      .sort()
      .forEach(
        className => {

          const option =
            document.createElement(
              "option"
            );

          option.value =
            className;

          option.textContent =
            className;

          classFilter.appendChild(
            option
          );
        }
      );
  }

  // Filter change
  classFilter.onchange =
    function (event) {

      const value =
        event.target.value;

      loadResources(
        value === "all"
          ? null
          : value
      );
    };
}

// =====================================================
// UPLOAD PROGRESS ELEMENTS
// =====================================================

function initializeUploadStatus() {
  const container =
    document.getElementById(
      "upload-form-container"
    );

  if (!container) {
    return;
  }

  // Progress
  if (
    !document.getElementById(
      "upload-progress"
    )
  ) {

    const progress =
      document.createElement(
        "progress"
      );

    progress.id =
      "upload-progress";

    progress.max = 100;
    progress.value = 0;

    progress.style.display =
      "none";

    container.appendChild(
      progress
    );
  }

  // Message
  if (
    !document.getElementById(
      "resource-upload-msg"
    )
  ) {

    const message =
      document.createElement(
        "div"
      );

    message.id =
      "resource-upload-msg";

    message.style.display =
      "none";

    message.style.marginTop =
      "8px";

    container.appendChild(
      message
    );
  }
}

// =====================================================
// INITIALIZE PAGE
// =====================================================

document.addEventListener(
  "DOMContentLoaded",
  async function () {

    console.log(
      "================================="
    );

    console.log(
      "[RESOURCES] Page loaded"
    );

    console.log(
      "================================="
    );

    // -------------------------------------------------
    // AUTH
    // -------------------------------------------------

    if (
      !requireAuthentication()
    ) {
      return;
    }

    // -------------------------------------------------
    // INITIALIZE UI
    // -------------------------------------------------

    initializeUploadButton();

    initializeCancelButton();

    initializeUploadForm();

    initializeResourceList();

    initializeUploadStatus();

    // -------------------------------------------------
    // LOAD USER CLASS INTO SELECT
    // -------------------------------------------------

    const userProfile =
      getUserProfile();

    const classSelect =
      document.getElementById(
        "class-select"
      );

    if (
      classSelect &&
      userProfile.class
    ) {

      const profileClass =
        String(
          userProfile.class
        ).trim();

      for (
        let i = 0;
        i <
        classSelect.options.length;
        i++
      ) {

        if (
          String(
            classSelect.options[i].value
          ).trim() ===
          profileClass
        ) {

          classSelect.selectedIndex =
            i;

          break;
        }
      }
    }

    // -------------------------------------------------
    // INITIAL LOAD
    // -------------------------------------------------

    await loadResources();

    console.log(
      "================================="
    );

    console.log(
      "[RESOURCES] Initialization complete"
    );

    console.log(
      "================================="
    );
  }
);
