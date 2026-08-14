// ============================================================
// RESOURCES.JS
// Ready-to-paste version
// Fixes:
// 1. Double /uploads/resources/uploads/resources/ URL
// 2. Resource viewing
// 3. Resource downloading
// 4. Uploading
// 5. Student class filtering
// 6. Teacher/Admin class filtering
// 7. Delete resources
// 8. Duplicate event listeners
// ============================================================


// ============================================================
// API BASE URL
// ============================================================

if (typeof window.API_BASE_URL === 'undefined') {
  window.API_BASE_URL = 'https://timiza-saas.onrender.com';
}

const API_BASE_URL = window.API_BASE_URL;


// ============================================================
// GLOBAL VARIABLES
// ============================================================

let availableClasses = [];
let userClass = null;


// ============================================================
// SAFE JSON PARSER
// ============================================================

function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem('userProfile') || '{}');
  } catch (error) {
    console.error('[RESOURCES] Failed to parse userProfile:', error);
    return {};
  }
}


// ============================================================
// GET TOKEN
// ============================================================

function getToken() {
  return localStorage.getItem('token');
}


// ============================================================
// GET USER ROLE FROM TOKEN
// ============================================================

function getUserRole() {
  const token = getToken();

  if (!token) {
    return 'student';
  }

  try {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return 'student';
    }

    const payload = JSON.parse(
      decodeURIComponent(
        atob(parts[1])
          .split('')
          .map(char => {
            return '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      )
    );

    return payload.role || 'student';

  } catch (error) {
    console.error('[RESOURCES] Error decoding token:', error);
    return 'student';
  }
}


// ============================================================
// NORMALIZE RESOURCE PATH
//
// THIS IS THE IMPORTANT FIX.
//
// Handles all of these:
//
// 1786719201759-133968509.pdf
//
// /1786719201759-133968509.pdf
//
// uploads/resources/1786719201759-133968509.pdf
//
// /uploads/resources/1786719201759-133968509.pdf
//
// /uploads/resources//1786719201759-133968509.pdf
//
// https://timiza-saas.onrender.com/uploads/resources/file.pdf
// ============================================================

function normalizeResourcePath(resourcePath) {

  if (!resourcePath) {
    return '';
  }

  let value = String(resourcePath).trim();

  // Remove API domain if backend accidentally returns a full URL
  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsed = new URL(value);
      value = parsed.pathname;
    }
  } catch (error) {
    console.warn('[RESOURCES] Could not parse resource URL:', value);
  }

  // Decode URL encoding where possible
  try {
    value = decodeURIComponent(value);
  } catch (error) {
    // Ignore decoding errors
  }

  // Normalize backslashes
  value = value.replace(/\\/g, '/');

  // Remove leading slashes
  value = value.replace(/^\/+/, '');

  // Remove duplicate uploads/resources prefixes
  value = value.replace(
    /^(?:uploads\/resources\/)+/i,
    ''
  );

  // Remove leading slashes again
  value = value.replace(/^\/+/, '');

  return value;
}


// ============================================================
// BUILD RESOURCE URL
// ============================================================

function getResourceUrl(resource) {

  if (!resource) {
    return '';
  }

  // Backend may use path, file, filename, storedPath, etc.
  const rawPath =
    resource.path ||
    resource.storedPath ||
    resource.filename ||
    resource.file ||
    resource.filePath ||
    '';

  const cleanPath = normalizeResourcePath(rawPath);

  if (!cleanPath) {
    console.error(
      '[RESOURCES] Resource has no valid file path:',
      resource
    );

    return '';
  }

  const finalUrl =
    `${API_BASE_URL}/uploads/resources/${cleanPath}`;

  console.log('[RESOURCES] File URL:', {
    name: resource.name,
    originalPath: rawPath,
    normalizedPath: cleanPath,
    finalUrl: finalUrl
  });

  return finalUrl;
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ============================================================
// SHOW INLINE ERROR
// ============================================================

function showInlineError(
  message,
  elementId = 'error-message'
) {

  const element =
    document.getElementById(elementId) ||
    document.getElementById('error-message');

  if (!element) {
    console.error('[RESOURCES]', message);
    return;
  }

  element.textContent = message;

  element.style.color = '#d32f2f';
  element.style.backgroundColor = '#ffebee';
  element.style.padding = '10px';
  element.style.borderRadius = '4px';
  element.style.margin = '10px 0';
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}


// ============================================================
// SHOW INLINE SUCCESS
// ============================================================

function showInlineSuccess(
  message,
  elementId = 'error-message'
) {

  const element =
    document.getElementById(elementId) ||
    document.getElementById('error-message');

  if (!element) {
    console.log('[RESOURCES]', message);
    return;
  }

  element.textContent = message;

  element.style.color = '#2e7d32';
  element.style.backgroundColor = '#e8f5e9';
  element.style.padding = '10px';
  element.style.borderRadius = '4px';
  element.style.margin = '10px 0';
  element.style.display = 'block';

  setTimeout(() => {
    element.style.display = 'none';
  }, 5000);
}


// ============================================================
// OPEN RESOURCE
// ============================================================

function openResource(resource) {

  const url = getResourceUrl(resource);

  if (!url) {
    alert('This resource does not have a valid file path.');
    return;
  }

  console.log('[RESOURCES] Opening:', url);

  window.open(
    url,
    '_blank',
    'noopener,noreferrer'
  );
}


// ============================================================
// DOWNLOAD RESOURCE
//
// Uses fetch + blob so downloads work reliably even when
// normal <a download> behavior is ignored by the browser.
// ============================================================

async function downloadResource(resource) {

  const url = getResourceUrl(resource);

  if (!url) {
    showInlineError(
      'This resource does not have a valid download URL.'
    );
    return;
  }

  const token = getToken();

  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  console.log('[RESOURCES] Downloading:', url);

  const buttons =
    document.querySelectorAll(
      `[data-download-id="${resource._id}"]`
    );

  buttons.forEach(button => {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '⏳';
  });

  try {

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(
      '[RESOURCES] Download response:',
      response.status,
      response.statusText
    );

    if (!response.ok) {

      let message =
        `Download failed (HTTP ${response.status})`;

      try {
        const contentType =
          response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {

          const data = await response.json();

          if (data.message) {
            message = data.message;
          }
        }
      } catch (error) {
        // Ignore response parsing errors
      }

      throw new Error(message);
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error(
        'The server returned an empty file.'
      );
    }

    // Get filename
    let filename =
      resource.name ||
      'resource';

    // Try Content-Disposition filename
    const disposition =
      response.headers.get(
        'content-disposition'
      );

    if (disposition) {

      const match =
        disposition.match(
          /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i
        );

      if (match && match[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    // Create temporary blob URL
    const blobUrl =
      window.URL.createObjectURL(blob);

    // Create hidden download link
    const link =
      document.createElement('a');

    link.href = blobUrl;
    link.download = filename;

    link.style.display = 'none';

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    // Release memory
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    console.log(
      '[RESOURCES] Download successful:',
      filename
    );

    showInlineSuccess(
      `Downloaded: ${filename}`
    );

  } catch (error) {

    console.error(
      '[RESOURCES] Download error:',
      error
    );

    showInlineError(
      error.message ||
      'Unable to download this resource.'
    );

  } finally {

    buttons.forEach(button => {

      button.disabled = false;

      if (button.dataset.originalText) {
        button.innerHTML =
          button.dataset.originalText;
      }
    });
  }
}


// ============================================================
// UPLOAD RESOURCE
// ============================================================

async function handleFileUpload(event) {

  event.preventDefault();

  const form =
    event.currentTarget ||
    event.target;

  const fileInput =
    form.querySelector(
      'input[type="file"]'
    );

  const selects =
    form.querySelectorAll('select');

  const classSelect =
    document.getElementById('class-select') ||
    selects[0];

  const submitButton =
    form.querySelector(
      'button[type="submit"]'
    );

  console.log(
    '[RESOURCES] Upload started'
  );

  try {

    if (
      !fileInput ||
      !fileInput.files ||
      !fileInput.files[0]
    ) {

      throw new Error(
        'Please select a file to upload.'
      );
    }

    if (
      !classSelect ||
      !classSelect.value
    ) {

      throw new Error(
        'Please select a class.'
      );
    }

    const token = getToken();

    if (!token) {

      alert(
        'Please log in to upload files.'
      );

      window.location.href =
        '/login.html';

      return;
    }

    const file =
      fileInput.files[0];

    const classAssigned =
      classSelect.value;

    if (submitButton) {
      submitButton.disabled = true;
    }

    const status =
      document.getElementById(
        'upload-status'
      );

    if (status) {

      status.textContent =
        'Uploading...';

      status.style.color =
        'blue';

      status.style.display =
        'block';
    }

    const formData =
      new FormData();

    formData.append(
      'resource',
      file
    );

    formData.append(
      'classAssigned',
      classAssigned
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/resources/upload`,
        {
          method: 'POST',

          headers: {
            'Authorization':
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
      result = {};
    }

    if (!response.ok) {

      throw new Error(
        result.message ||
        `Upload failed (HTTP ${response.status})`
      );
    }

    console.log(
      '[RESOURCES] Upload successful:',
      result
    );

    if (status) {

      status.textContent =
        'Upload successful!';

      status.style.color =
        'green';
    }

    form.reset();

    const container =
      document.getElementById(
        'upload-form-container'
      );

    if (container) {
      container.style.display =
        'none';
    }

    setTimeout(() => {

      loadResources();

      if (status) {
        status.style.display =
          'none';
      }

    }, 1000);

  } catch (error) {

    console.error(
      '[RESOURCES] Upload error:',
      error
    );

    const status =
      document.getElementById(
        'upload-status'
      );

    if (status) {

      status.textContent =
        `Error: ${error.message}`;

      status.style.color =
        'red';

      status.style.display =
        'block';

    } else {

      alert(
        `Upload failed: ${error.message}`
      );
    }

  } finally {

    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}


// ============================================================
// DELETE RESOURCE
// ============================================================

async function deleteResource(
  resourceId
) {

  if (!resourceId) {

    showInlineError(
      'No resource ID provided.'
    );

    return;
  }

  const token = getToken();

  if (!token) {

    window.location.href =
      '/login.html';

    return;
  }

  const cleanId =
    String(resourceId).trim();

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/api/resources/${encodeURIComponent(cleanId)}`,
        {
          method: 'DELETE',

          headers: {
            'Authorization':
              `Bearer ${token}`,

            'Content-Type':
              'application/json'
          }
        }
      );

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {

      throw new Error(
        data.message ||
        `Failed to delete resource (HTTP ${response.status})`
      );
    }

    console.log(
      '[RESOURCES] Delete successful:',
      data
    );

    showInlineSuccess(
      'Resource deleted successfully.'
    );

    setTimeout(() => {
      loadResources();
    }, 700);

  } catch (error) {

    console.error(
      '[RESOURCES] Delete error:',
      error
    );

    showInlineError(
      error.message ||
      'Failed to delete resource.'
    );
  }
}


// ============================================================
// UPDATE CLASS FILTER
// ============================================================

function updateClassFilter() {

  const classFilter =
    document.getElementById(
      'class-filter'
    );

  if (!classFilter) {
    return;
  }

  const role =
    getUserRole();

  if (role === 'student') {

    classFilter.style.display =
      'none';

    const label =
      classFilter.previousElementSibling;

    if (
      label &&
      label.tagName === 'LABEL'
    ) {
      label.style.display =
        'none';
    }

    return;
  }

  classFilter.style.display =
    'inline-block';

  const label =
    classFilter.previousElementSibling;

  if (
    label &&
    label.tagName === 'LABEL'
  ) {
    label.style.display =
      'inline-block';
  }

  classFilter.innerHTML = '';

  const allOption =
    document.createElement(
      'option'
    );

  allOption.value =
    'all';

  allOption.textContent =
    'All Classes';

  classFilter.appendChild(
    allOption
  );

  if (
    Array.isArray(
      availableClasses
    )
  ) {

    availableClasses.forEach(
      className => {

        if (!className) {
          return;
        }

        const option =
          document.createElement(
            'option'
          );

        option.value =
          className;

        option.textContent =
          className.startsWith('Grade') ||
          className.startsWith('Form')
            ? className
            : `Class ${className}`;

        classFilter.appendChild(
          option
        );
      }
    );
  }

  classFilter.onchange =
    event => {

      const selected =
        event.target.value;

      loadResources(
        selected === 'all'
          ? null
          : selected
      );
    };
}


// ============================================================
// RENDER RESOURCE CARD
// ============================================================

function createResourceCard(
  resource
) {

  const card =
    document.createElement(
      'div'
    );

  card.className =
    'resource-card';

  const name =
    resource.name ||
    'Unnamed resource';

  const extension =
    name
      .split('.')
      .pop()
      .toLowerCase();

  let icon = '📄';
  let type = 'Document';

  if (extension === 'pdf') {

    icon = '📄';
    type = 'PDF';

  } else if (
    ['doc', 'docx'].includes(
      extension
    )
  ) {

    icon = '📝';
    type = 'Word';

  } else if (
    ['xls', 'xlsx'].includes(
      extension
    )
  ) {

    icon = '📊';
    type = 'Excel';

  } else if (
    ['ppt', 'pptx'].includes(
      extension
    )
  ) {

    icon = '📑';
    type = 'PowerPoint';

  } else if (
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
      extension
    )
  ) {

    icon = '🖼️';
    type = 'Image';
  }

  const fileUrl =
    getResourceUrl(resource);

  const safeName =
    escapeHtml(name);

  const uploadDate =
    resource.createdAt
      ? new Date(
          resource.createdAt
        ).toLocaleDateString()
      : '';

  const size =
    resource.size
      ? `${(
          resource.size / 1024
        ).toFixed(1)} KB`
      : '';

  let uploaderInfo =
    `Uploaded on ${uploadDate}`;

  if (
    resource.uploadedBy &&
    resource.uploadedBy.name
  ) {

    uploaderInfo =
      `Uploaded by ${escapeHtml(
        resource.uploadedBy.name
      )} on ${uploadDate}`;
  }

  const canDelete =
    resource.canDelete === true;

  card.innerHTML = `

    <div class="resource-icon">
      ${icon}
    </div>

    <div class="resource-content">

      <div
        class="resource-name"
        title="${safeName}"
      >
        <a
          href="${fileUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="resource-view-link"
        >
          ${safeName}
        </a>
      </div>

      <div class="resource-type">
        ${type}
        ${size ? ` • ${size}` : ''}
      </div>

      <div class="resource-meta">
        ${uploaderInfo}
      </div>

    </div>

    <div class="resource-actions">

      <button
        type="button"
        class="view-btn"
        data-resource-id="${escapeHtml(resource._id || '')}"
        title="Open"
      >
        <i class="fas fa-eye"></i>
        <span>Open</span>
      </button>

      <button
        type="button"
        class="download-btn"
        data-download-id="${escapeHtml(resource._id || '')}"
        title="Download"
      >
        <i class="fas fa-download"></i>
        <span>Download</span>
      </button>

      ${
        canDelete
          ? `
            <button
              type="button"
              class="delete-btn"
              data-id="${escapeHtml(resource._id || '')}"
              title="Delete"
            >
              <i class="fas fa-trash"></i>
              <span>Delete</span>
            </button>
          `
          : ''
      }

    </div>
  `;

  // Open resource
  const viewButton =
    card.querySelector(
      '.view-btn'
    );

  if (viewButton) {

    viewButton.addEventListener(
      'click',
      event => {

        event.preventDefault();

        openResource(
          resource
        );
      }
    );
  }

  // Download resource
  const downloadButton =
    card.querySelector(
      '.download-btn'
    );

  if (downloadButton) {

    downloadButton.addEventListener(
      'click',
      event => {

        event.preventDefault();

        downloadResource(
          resource
        );
      }
    );
  }

  // Delete resource
  const deleteButton =
    card.querySelector(
      '.delete-btn'
    );

  if (deleteButton) {

    deleteButton.addEventListener(
      'click',
      async event => {

        event.preventDefault();

        const confirmed =
          confirm(
            `Are you sure you want to delete "${name}"?`
          );

        if (!confirmed) {
          return;
        }

        await deleteResource(
          resource._id
        );
      }
    );
  }

  return card;
}


// ============================================================
// LOAD RESOURCES
// ============================================================

async function loadResources(
  selectedClass = null
) {

  const token =
    getToken();

  if (!token) {

    window.location.href =
      '/login.html';

    return;
  }

  const role =
    getUserRole();

  const profile =
    getUserProfile();

  const url =
    new URL(
      `${API_BASE_URL}/api/resources`
    );

  // ----------------------------------------------------------
  // STUDENT CLASS FILTER
  // ----------------------------------------------------------

  if (role === 'student') {

    const studentClass =
      profile.class ||
      (
        profile.profile &&
        profile.profile.class
      );

    if (!studentClass) {

      const resourceList =
        document.getElementById(
          'resource-list'
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
            You are not assigned to any class.
            Please contact your administrator.
          </div>
        `;
      }

      return;
    }

    url.searchParams.set(
      'class',
      String(studentClass).trim()
    );

    const classFilter =
      document.getElementById(
        'class-filter'
      );

    if (classFilter) {
      classFilter.style.display =
        'none';
    }

  } else {

    // Teacher/admin selected class
    if (
      selectedClass &&
      selectedClass !== 'all'
    ) {

      url.searchParams.set(
        'class',
        selectedClass
      );
    }
  }

  console.log(
    '[RESOURCES] Fetching:',
    url.toString()
  );

  const resourceList =
    document.getElementById(
      'resource-list'
    );

  if (resourceList) {

    resourceList.innerHTML =
      '<div class="loading">Loading resources...</div>';
  }

  try {

    const response =
      await fetch(
        url.toString(),
        {
          method: 'GET',

          headers: {
            'Authorization':
              `Bearer ${token}`
          }
        }
      );

    console.log(
      '[RESOURCES] Response:',
      response.status
    );

    let data = {};

    try {
      data =
        await response.json();
    } catch (error) {

      throw new Error(
        'Server returned an invalid response.'
      );
    }

    if (!response.ok) {

      throw new Error(
        data.message ||
        `Failed to load resources (HTTP ${response.status})`
      );
    }

    console.log(
      '[RESOURCES] Resources received:',
      data
    );

    if (
      Array.isArray(
        data.classes
      )
    ) {

      availableClasses =
        data.classes;
    }

    if (data.userClass) {

      userClass =
        data.userClass;
    }

    updateClassFilter();

    if (!resourceList) {
      return;
    }

    resourceList.innerHTML = '';

    const resources =
      Array.isArray(
        data.resources
      )
        ? data.resources
        : [];

    if (!resources.length) {

      resourceList.innerHTML = `
        <li>
          No resources available
          for the selected class.
        </li>
      `;

      return;
    }

    // --------------------------------------------------------
    // GROUP BY CLASS
    // --------------------------------------------------------

    const resourcesByClass =
      {};

    resources.forEach(
      resource => {

        const className =
          resource.classAssigned ||
          'Unassigned';

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

    const sortedClasses =
      Object.keys(
        resourcesByClass
      ).sort(
        (a, b) =>
          a.localeCompare(b)
      );

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    sortedClasses.forEach(
      className => {

        const classSection =
          document.createElement(
            'div'
          );

        classSection.className =
          'resource-class-section';

        const classHeader =
          document.createElement(
            'div'
          );

        classHeader.className =
          'resource-class-header';

        const classResources =
          resourcesByClass[
            className
          ];

        classHeader.innerHTML = `
          <h3>
            ${escapeHtml(
              className
            )}
          </h3>

          <span class="resource-count">
            ${classResources.length}
            ${
              classResources.length === 1
                ? 'resource'
                : 'resources'
            }
          </span>
        `;

        classSection.appendChild(
          classHeader
        );

        const grid =
          document.createElement(
            'div'
          );

        grid.className =
          'resources-grid';

        classResources.forEach(
          resource => {

            const card =
              createResourceCard(
                resource
              );

            grid.appendChild(
              card
            );
          }
        );

        classSection.appendChild(
          grid
        );

        resourceList.appendChild(
          classSection
        );
      }
    );

  } catch (error) {

    console.error(
      '[RESOURCES] Error loading resources:',
      error
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
          Error loading resources:
          ${escapeHtml(
            error.message
          )}
        </div>
      `;
    }
  }
}


// ============================================================
// INITIALIZE UPLOAD UI
// ============================================================

function initializeUploadUI() {

  const uploadButton =
    document.getElementById(
      'upload-resource-btn'
    );

  const uploadContainer =
    document.getElementById(
      'upload-form-container'
    );

  const classSelector =
    document.getElementById(
      'resource-class'
    );

  const classSelect =
    document.getElementById(
      'class-select'
    );

  const cancelButton =
    document.getElementById(
      'cancel-upload-btn'
    );

  const uploadForm =
    document.getElementById(
      'upload-form'
    );

  // ----------------------------------------------------------
  // Upload button
  // ----------------------------------------------------------

  if (uploadButton) {

    uploadButton.style.display =
      'block';

    uploadButton.style.visibility =
      'visible';

    uploadButton.onclick =
      event => {

        event.preventDefault();

        console.log(
          '[RESOURCES] Upload Resource clicked'
        );

        if (uploadContainer) {

          uploadContainer.style.display =
            'block';

          uploadContainer.style.visibility =
            'visible';

          uploadContainer.style.opacity =
            '1';
        }

        if (classSelector) {

          classSelector.style.display =
            'block';

          classSelector.style.visibility =
            'visible';
        }

        if (classSelect) {

          classSelect.style.display =
            'block';

          classSelect.style.visibility =
            'visible';

          classSelect.style.pointerEvents =
            'auto';
        }
      };

  } else {

    console.warn(
      '[RESOURCES] upload-resource-btn not found'
    );
  }

  // ----------------------------------------------------------
  // Cancel button
  // ----------------------------------------------------------

  if (cancelButton) {

    cancelButton.onclick =
      event => {

        event.preventDefault();

        if (uploadContainer) {

          uploadContainer.style.display =
            'none';
        }

        if (uploadForm) {

          uploadForm.reset();
        }
      };
  }

  // ----------------------------------------------------------
  // Form submit
  // ----------------------------------------------------------

  if (uploadForm) {

    uploadForm.addEventListener(
      'submit',
      handleFileUpload
    );
  }

  // ----------------------------------------------------------
  // Default student's class
  // ----------------------------------------------------------

  const profile =
    getUserProfile();

  if (
    profile.class &&
    classSelect
  ) {

    for (
      let i = 0;
      i < classSelect.options.length;
      i++
    ) {

      if (
        classSelect.options[i]
          .value === profile.class
      ) {

        classSelect.selectedIndex =
          i;

        break;
      }
    }
  }
}


// ============================================================
// CREATE UPLOAD STATUS ELEMENTS
// ============================================================

function initializeUploadStatus() {

  const container =
    document.getElementById(
      'upload-form-container'
    );

  if (!container) {
    return;
  }

  if (
    !document.getElementById(
      'upload-progress'
    )
  ) {

    const progress =
      document.createElement(
        'progress'
      );

    progress.id =
      'upload-progress';

    progress.max = 100;
    progress.value = 0;

    progress.style.display =
      'none';

    container.appendChild(
      progress
    );
  }

  if (
    !document.getElementById(
      'resource-upload-msg'
    )
  ) {

    const message =
      document.createElement(
        'div'
      );

    message.id =
      'resource-upload-msg';

    message.style.display =
      'none';

    message.style.marginTop =
      '8px';

    container.appendChild(
      message
    );
  }
}


// ============================================================
// INITIALIZE PAGE
// ============================================================

document.addEventListener(
  'DOMContentLoaded',
  () => {

    console.log(
      '================================='
    );

    console.log(
      '[RESOURCES] Initializing page'
    );

    console.log(
      '================================='
    );

    const token =
      getToken();

    if (!token) {

      console.log(
        '[RESOURCES] No token found. Redirecting to login.'
      );

      window.location.href =
        '/login.html';

      return;
    }

    initializeUploadUI();

    initializeUploadStatus();

    const classFilter =
      document.getElementById(
        'class-filter'
      );

    const role =
      getUserRole();

    if (classFilter) {

      if (role === 'student') {

        classFilter.style.display =
          'none';

      } else {

        classFilter.style.display =
          'inline-block';
      }
    }

    updateClassFilter();

    // --------------------------------------------------------
    // Load resources
    // --------------------------------------------------------

    loadResources();

    console.log(
      '================================='
    );

    console.log(
      '[RESOURCES] Initialization complete'
    );

    console.log(
      '================================='
    );
  }
);


// ============================================================
// DEBUG HELPER
// ============================================================

window.debugResourceUrl =
  function(resourcePath) {

    const normalized =
      normalizeResourcePath(
        resourcePath
      );

    const finalUrl =
      `${API_BASE_URL}/uploads/resources/${normalized}`;

    console.log(
      '[RESOURCES DEBUG]',
      {
        original: resourcePath,
        normalized: normalized,
        finalUrl: finalUrl
      }
    );

    return finalUrl;
  };
