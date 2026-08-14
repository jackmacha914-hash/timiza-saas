// library.js — Consolidated, drop-in replacement for your big library logic
// Keeps behavior identical to your original large implementation.

console.log('Library script loaded');

(function () {
  // Config
  const BASE = (window.API_CONFIG && window.API_CONFIG.BASE_URL) ? window.API_CONFIG.BASE_URL.replace(/\/$/, '') : '';

  // Shared state & DOM refs
  let libraryTableBody = null;
  let librarySearch = null;
  let libraryGenreFilter = null;
  let libraryAuthorFilter = null;
  let libraryClassFilter = null;
  let libraryBulkToolbar = null;
  let libraryBulkDelete = null;
  let libraryBulkExport = null;
  let selectAllLibrary = null;
  let issuedBooksSearch = null;
  let issuedBooksList = null;
  let selectedBookIds = new Set();

  // -------------------------
  // API helper
  // -------------------------
  async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${BASE}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.debug('API Request', { url, method: options.method || 'GET', headers, body: options.body });

    const res = await fetch(url, { ...options, headers });
    const clone = res.clone();
    const text = await clone.text().catch(() => '');
    console.debug('API Response', { status: res.status, url, body_preview: (text || '').slice(0, 500) });

    if (!res.ok) {
      // try parse json for error message
      let errData = {};
      try { errData = await res.json(); } catch (e) { /* ignore */ }
      const err = new Error(errData.message || errData.error || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = errData;
      throw err;
    }

    // if there's no JSON content-type, return raw text
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return text;
    return await res.json();
  }

  // -------------------------
  // Helpers: modal show/hide
  // -------------------------
  function showModal(modal) {
    if (!modal) return;
    modal.classList.add('show');
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
  }

  function hideModal(modal) {
    if (!modal) return;
    modal.classList.remove('show');
    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    document.body.style.overflow = '';
    // reset form inside modal if exists
    const form = modal.querySelector('form');
    if (form) form.reset();
    const msg = modal.querySelector('#universal-edit-msg');
    if (msg) { msg.textContent = ''; msg.style.display = 'none'; }
  }

  // Simple notification
  function showNotification(message, type = 'info') {
    console.log('NOTIF', type, message);
    const container = document.getElementById('notification-container') || document.body;
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  }

  // -------------------------
  // Render helpers
  // -------------------------
  function renderBookRow(book) {
    const available = (book.available !== undefined) ? book.available : (book.copies || 1);
    const copies = book.copies || 1;
    const availableClass = available > 0 ? 'status-available' : 'status-checked-out';
    const disabledIssue = available < 1 ? 'disabled' : '';
    return `<tr data-id="${book._id}">
      <td><input type="checkbox" class="library-select-checkbox" data-id="${book._id}"></td>
      <td>${escapeHtml(book.title)}</td>
      <td>${escapeHtml(book.author || '')}</td>
      <td>${book.year || 'N/A'}</td>
      <td>${escapeHtml(book.genre || 'N/A')}</td>
      <td class="status-${book.status || 'available'}">${escapeHtml(book.status || 'available')}</td>
      <td>${copies}</td>
      <td class="${availableClass}">${available}</td>
      <td class="actions-cell">
          <button class="edit-book-btn" data-id="${book._id}">Edit</button>
          <button class="issue-book-btn" data-id="${book._id}" data-genre="${escapeAttr(book.genre || 'General')}" ${disabledIssue}>Issue</button>
          <button class="delete-book-btn" data-id="${book._id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s){ return escapeHtml(s); }

  // -------------------------
  // Filters & query builder
  // -------------------------
  function getLibraryFilters() {
    return {
      search: librarySearch ? librarySearch.value.trim() : '',
      genre: libraryGenreFilter ? libraryGenreFilter.value : '',
      author: libraryAuthorFilter ? libraryAuthorFilter.value.trim() : '',
      className: libraryClassFilter ? libraryClassFilter.value : ''
    };
  }
  function buildLibraryQueryString(filters) {
    const params = [];
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.genre) params.push(`genre=${encodeURIComponent(filters.genre)}`);
    if (filters.author) params.push(`author=${encodeURIComponent(filters.author)}`);
    if (filters.className) params.push(`className=${encodeURIComponent(filters.className)}`);
    return params.length ? '?' + params.join('&') : '';
  }

  // -------------------------
  // Load books (main list)
  // -------------------------
  async function loadLibraryWithFilters() {
    try {
      if (!libraryTableBody) libraryTableBody = document.getElementById('library-table-body');
      const filters = getLibraryFilters();
      const qs = buildLibraryQueryString(filters);
      if (libraryTableBody) libraryTableBody.innerHTML = '<tr><td colspan="9" class="text-center">Loading books...</td></tr>';

      const res = await apiFetch(`/api/books${qs}`, { headers: { 'Cache-Control':'no-cache' } });
      // Accept both [] or {data: []}
      const books = Array.isArray(res) ? res : (res.data || []);
      console.debug('Books to display:', books.length);

      if (!libraryTableBody) return;
      libraryTableBody.innerHTML = '';
      if (books.length === 0) {
        libraryTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No books found in the library.</td></tr>';
      } else {
        books.forEach(b => libraryTableBody.insertAdjacentHTML('beforeend', renderBookRow(b)));
      }
      // after rendering attach event listeners for checkboxes
      attachBookEventListeners();
    } catch (err) {
      console.error('Error loading books:', err);
      if (libraryTableBody) libraryTableBody.innerHTML = `<tr><td colspan="9" class="text-center error">Error loading books: ${err.message}</td></tr>`;
    }
  }

 // -------------------------
// Attach listeners on table (edit/issue/delete) - single delegate
// -------------------------
function attachBookEventListeners() {
  if (!libraryTableBody) {
    libraryTableBody = document.getElementById('library-table-body');
  }

  if (!libraryTableBody) return;
  if (libraryTableBody._bound) return;

  libraryTableBody._bound = true;

  libraryTableBody.addEventListener('click', async (e) => {

    const btn = e.target.closest(
      '.edit-book-btn, .issue-book-btn, .delete-book-btn'
    );

    if (!btn) return;

    const bookId = btn.getAttribute('data-id');

    // =====================================================
    // EDIT BOOK
    // =====================================================
    if (btn.classList.contains('edit-book-btn')) {

      console.log('Edit clicked for', bookId);

      try {

        // Get the book first
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('authToken');

        if (!token) {
          showNotification(
            'You are not authenticated. Please log in again.',
            'error'
          );
          return;
        }

        const response = await fetch(`/api/library/${bookId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load book');
        }

        const result = await response.json();

        const book = result.book || result.data || result;

        // Ask for updated values
        const title = prompt(
          'Book title:',
          book.title || ''
        );

        if (title === null) return;

        const author = prompt(
          'Author:',
          book.author || ''
        );

        if (author === null) return;

        const className = prompt(
          'Class:',
          book.className || ''
        );

        if (className === null) return;

        const genre = prompt(
          'Genre:',
          book.genre || ''
        );

        if (genre === null) return;

        const year = prompt(
          'Year:',
          book.year || new Date().getFullYear()
        );

        if (year === null) return;

        const status = prompt(
          'Status (available/unavailable):',
          book.status || 'available'
        );

        if (status === null) return;

        const copies = prompt(
          'Number of copies:',
          book.copies || book.available || 1
        );

        if (copies === null) return;

        // =================================================
        // UPDATE BOOK
        // =================================================

        const updateResponse = await fetch(
          `/api/library/${bookId}`,
          {
            method: 'PUT',

            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },

            body: JSON.stringify({
              title: title.trim(),
              author: author.trim(),
              year: parseInt(year) || new Date().getFullYear(),
              className: className.trim(),
              genre: genre.trim(),
              status: status.trim().toLowerCase(),
              copies: parseInt(copies) || 1
            })
          }
        );

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
          throw new Error(
            updateResult.error ||
            updateResult.message ||
            'Failed to update book'
          );
        }

        console.log(
          'Book updated successfully:',
          updateResult
        );

        showNotification(
          'Book updated successfully',
          'success'
        );

        // Refresh the books table
        if (typeof loadBooks === 'function') {
          await loadBooks();
        } else if (typeof fetchBooks === 'function') {
          await fetchBooks();
        } else {
          // Reload as fallback
          window.location.reload();
        }

      } catch (err) {

        console.error(
          'Error editing book:',
          err
        );

        showNotification(
          err.message || 'Failed to update book',
          'error'
        );
      }

      return;
    }
  
      // -------------------------
      // EDIT
      // -------------------------
      if (btn.classList.contains('edit-book-btn')) {
        return handleEditButtonClick(btn);
      }

      // -------------------------
      // ISSUE
      // -------------------------
      if (btn.classList.contains('issue-book-btn')) {
        return handleIssueButtonClick(btn);
      }

      // -------------------------
      // DELETE
      // -------------------------
      if (btn.classList.contains('delete-book-btn')) {
        if (!confirm('Are you sure you want to delete this book?')) return;

        try {
          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

          await apiFetch(`/api/library/${bookId}`, {
            method: 'DELETE'
          });

          showNotification(
            'Book deleted successfully',
            'success'
          );

          const row = btn.closest('tr');

          if (row) {
            row.remove();
          }

          setTimeout(() => {
            loadLibraryWithFilters().catch(console.error);
          }, 300);

        } catch (error) {
          console.error('Delete error', error);

          showNotification(
            error.message || 'Failed to delete book',
            'error'
          );

        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-trash"></i>';
        }

        return;
      }
    });

    // -------------------------
    // Checkbox selection
    // -------------------------
    libraryTableBody.addEventListener('change', (e) => {
      const cb = e.target.closest('.library-select-checkbox');

      if (!cb) return;

      const id = cb.getAttribute('data-id');

      if (cb.checked) {
        selectedBookIds.add(id);
      } else {
        selectedBookIds.delete(id);
      }

      updateLibraryBulkToolbarState();
    });
  }


  // =====================================================
  // HANDLE EDIT BOOK
  // =====================================================
  async function handleEditButtonClick(actionBtn) {

    const bookId = actionBtn.getAttribute('data-id');

    if (!bookId) {
      showNotification(
        'Book ID is missing',
        'error'
      );
      return;
    }

    console.log(
      'Edit clicked for',
      bookId
    );

    const universalModal =
      document.getElementById('universal-edit-modal');

    const universalForm =
      document.getElementById('universal-edit-form');

    const universalMsg =
      document.getElementById('universal-edit-msg');

    const universalTitle =
      document.getElementById('universal-edit-title');


    if (!universalModal || !universalForm) {

      console.error(
        'Edit modal/form missing in DOM'
      );

      showNotification(
        'Edit modal not found',
        'error'
      );

      return;
    }


    try {

      // =================================================
      // LOAD CURRENT BOOK
      // =================================================

      const bookResponse =
        await apiFetch(
          `/api/library/${bookId}`
        );

      const book =
        bookResponse.book ||
        bookResponse.data ||
        bookResponse;


      if (!book || !book._id) {

        throw new Error(
          'Book could not be loaded'
        );
      }


      console.log(
        'Book loaded for editing:',
        book
      );


      // =================================================
      // CLEAR OLD MESSAGE
      // =================================================

      if (universalMsg) {
        universalMsg.textContent = '';
        universalMsg.style.display = 'none';
      }


      // =================================================
      // MODAL TITLE
      // =================================================

      if (universalTitle) {

        universalTitle.textContent =
          `Edit Book: ${book.title || ''}`;
      }


      // =================================================
      // EDIT FORM
      // =================================================

      universalForm.innerHTML = `

        <div class="mb-4">

          <label for="editBookTitle">
            Title
          </label>

          <input
            id="editBookTitle"
            name="title"
            type="text"
            required
            value="${escapeAttr(book.title || '')}"
          >

        </div>


        <div class="mb-4">

          <label for="editBookAuthor">
            Author
          </label>

          <input
            id="editBookAuthor"
            name="author"
            type="text"
            required
            value="${escapeAttr(book.author || '')}"
          >

        </div>


        <div class="mb-4">

          <label for="editBookYear">
            Year
          </label>

          <input
            id="editBookYear"
            name="year"
            type="number"
            min="1000"
            max="9999"
            value="${escapeAttr(
              book.year || new Date().getFullYear()
            )}"
          >

        </div>


        <div class="mb-4">

          <label for="editBookGenre">
            Genre
          </label>

          <input
            id="editBookGenre"
            name="genre"
            type="text"
            required
            value="${escapeAttr(
              book.genre || 'General'
            )}"
          >

        </div>


        <div class="mb-4">

          <label for="editBookClass">
            Class
          </label>

          <select
            id="editBookClass"
            name="className"
            required
          >

            <option value="">
              Select a class
            </option>

            <optgroup label="Pre-Primary">

              <option value="PP1">PP1</option>
              <option value="PP2">PP2</option>

            </optgroup>

            <optgroup label="Lower Primary">

              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>

            </optgroup>

            <optgroup label="Upper Primary">

              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5</option>
              <option value="Grade 6">Grade 6</option>

            </optgroup>

            <optgroup label="Junior Secondary">

              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>

            </optgroup>

            <optgroup label="Secondary">

              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>

            </optgroup>

          </select>

        </div>


        <div class="mb-4">

          <label for="editBookStatus">
            Status
          </label>

          <select
            id="editBookStatus"
            name="status"
            required
          >

            <option value="available">
              Available
            </option>

            <option value="unavailable">
              Unavailable
            </option>

          </select>

        </div>


        <div class="mb-4">

          <label for="editBookCopies">
            Total Copies
          </label>

          <input
            id="editBookCopies"
            name="copies"
            type="number"
            min="1"
            required
            value="${escapeAttr(
              book.copies ||
              book.available ||
              1
            )}"
          >

        </div>


        <div
          id="edit-book-form-msg"
          style="display:none;"
        ></div>


        <div class="flex items-center justify-end gap-3">

          <button
            type="button"
            class="cancel-btn"
          >
            Cancel
          </button>

          <button
            type="submit"
            class="submit-btn"
          >
            <i class="fas fa-save mr-2"></i>
            Save Changes
          </button>

        </div>
      `;


      // =================================================
      // SET CURRENT VALUES
      // =================================================

      const classSelect =
        universalForm.querySelector(
          '#editBookClass'
        );

      const statusSelect =
        universalForm.querySelector(
          '#editBookStatus'
        );


      if (classSelect && book.className) {
        classSelect.value =
          book.className;
      }


      if (statusSelect && book.status) {
        statusSelect.value =
          book.status;
      }


      // =================================================
      // SHOW MODAL
      // =================================================

      showModal(universalModal);


      // =================================================
      // REPLACE FORM TO REMOVE OLD HANDLERS
      // =================================================

      const newForm =
        universalForm.cloneNode(true);

      universalForm.parentNode.replaceChild(
        newForm,
        universalForm
      );


      const finalForm =
        document.getElementById(
          'universal-edit-form'
        );


      const formMsg =
        finalForm.querySelector(
          '#edit-book-form-msg'
        );


      const cancelBtn =
        finalForm.querySelector(
          '.cancel-btn'
        );


      const submitBtn =
        finalForm.querySelector(
          '.submit-btn'
        );


      // =================================================
      // CANCEL
      // =================================================

      if (cancelBtn) {

        cancelBtn.onclick = (ev) => {

          ev.preventDefault();

          hideModal(universalModal);
        };
      }


      // =================================================
      // SUBMIT UPDATE
      // =================================================

      finalForm.onsubmit = async (ev) => {

        ev.preventDefault();


        if (submitBtn) {

          submitBtn.disabled = true;

          submitBtn.innerHTML =
            '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        }


        if (formMsg) {

          formMsg.textContent = '';

          formMsg.style.display = 'none';
        }


        try {

          const formData =
            new FormData(finalForm);


          const title =
            String(
              formData.get('title') || ''
            ).trim();


          const author =
            String(
              formData.get('author') || ''
            ).trim();


          const year =
            parseInt(
              formData.get('year')
            );


          const genre =
            String(
              formData.get('genre') || ''
            ).trim();


          const className =
            String(
              formData.get('className') || ''
            ).trim();


          const status =
            String(
              formData.get('status') || 'available'
            ).trim()
              .toLowerCase();


          const copies =
            parseInt(
              formData.get('copies')
            );


          // =================================================
          // VALIDATION
          // =================================================

          if (!title) {
            throw new Error(
              'Book title is required'
            );
          }


          if (!author) {
            throw new Error(
              'Author is required'
            );
          }


          if (!genre) {
            throw new Error(
              'Genre is required'
            );
          }


          if (!className) {
            throw new Error(
              'Class is required'
            );
          }


          if (
            !Number.isFinite(year) ||
            year < 1000 ||
            year > 9999
          ) {
            throw new Error(
              'Please enter a valid year'
            );
          }


          if (
            !Number.isFinite(copies) ||
            copies < 1
          ) {
            throw new Error(
              'Copies must be at least 1'
            );
          }


          // =================================================
          // UPDATE BOOK
          // =================================================

          const updated =
            await apiFetch(
              `/api/library/${bookId}`,
              {
                method: 'PUT',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body: JSON.stringify({

                  title,

                  author,

                  year,

                  className,

                  genre,

                  status,

                  copies

                })
              }
            );


          console.log(
            'Book updated successfully:',
            updated
          );


          if (formMsg) {

            formMsg.textContent =
              'Book updated successfully!';

            formMsg.className =
              'mt-3 text-sm text-green-600';

            formMsg.style.display =
              'block';
          }


          showNotification(
            'Book updated successfully',
            'success'
          );


          // =================================================
          // REFRESH LIBRARY
          // =================================================

          setTimeout(() => {

            hideModal(
              universalModal
            );

            loadLibraryWithFilters()
              .catch(console.error);

          }, 700);


        } catch (error) {

          console.error(
            'Error updating book:',
            error
          );


          if (formMsg) {

            formMsg.textContent =
              error.message ||
              'Failed to update book';

            formMsg.className =
              'mt-3 text-sm text-red-600';

            formMsg.style.display =
              'block';

            formMsg.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }


          showNotification(
            error.message ||
            'Failed to update book',
            'error'
          );


        } finally {

          if (submitBtn) {

            submitBtn.disabled = false;

            submitBtn.innerHTML =
              '<i class="fas fa-save mr-2"></i>Save Changes';
          }
        }
      };


    } catch (error) {

      console.error(
        'Error loading book for edit:',
        error
      );

      showNotification(
        error.message ||
        'Failed to load book',
        'error'
      );
    }
  }

// =====================================================
// Handle Issue button: modal, students, submit
// =====================================================
async function handleIssueButtonClick(actionBtn) {
  const bookId = actionBtn.getAttribute('data-id');
  const genre = actionBtn.getAttribute('data-genre') || 'General';

  const bookTitle =
    actionBtn.closest('tr')?.querySelector('td:nth-child(2)')?.textContent?.trim() || '';

  const universalModal =
    document.getElementById('universal-edit-modal');

  const universalForm =
    document.getElementById('universal-edit-form');

  const universalMsg =
    document.getElementById('universal-edit-msg');

  const universalTitle =
    document.getElementById('universal-edit-title');

  // -----------------------------------------------------
  // Check modal/form exists
  // -----------------------------------------------------
  if (!universalModal || !universalForm) {
    console.error('Issue modal/form missing in DOM');
    showNotification('Issue modal not found', 'error');
    return;
  }

  // Clear old message
  if (universalMsg) {
    universalMsg.textContent = '';
    universalMsg.style.display = 'none';
  }

  // Set modal title
  if (universalTitle) {
    universalTitle.textContent =
      `Issue Book: ${bookTitle || ''}`;
  }

  // -----------------------------------------------------
  // Default due date = 14 days from today
  // -----------------------------------------------------
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);

  const defaultDueStr =
    defaultDue.toISOString().split('T')[0];

  // -----------------------------------------------------
  // Build issue form
  // -----------------------------------------------------
  universalForm.innerHTML = `
    <input
      type="hidden"
      name="bookId"
      value="${escapeAttr(bookId)}"
    >

    <input
      type="hidden"
      name="genre"
      value="${escapeAttr(genre)}"
    >

    <div class="mb-4">
      <label for="classSelect">Class</label>

      <select
        id="classSelect"
        name="class"
        required
      >
        <option value="">Select a class</option>

        <optgroup label="Pre-Primary">
          <option value="PP1">PP1</option>
          <option value="PP2">PP2</option>
        </optgroup>

        <optgroup label="Lower Primary">
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
        </optgroup>

        <optgroup label="Upper Primary">
          <option value="Grade 4">Grade 4</option>
          <option value="Grade 5">Grade 5</option>
          <option value="Grade 6">Grade 6</option>
        </optgroup>

        <optgroup label="Junior Secondary">
          <option value="Grade 7">Grade 7</option>
          <option value="Grade 8">Grade 8</option>
        </optgroup>

        <optgroup label="Secondary">
          <option value="Form 1">Form 1</option>
          <option value="Form 2">Form 2</option>
          <option value="Form 3">Form 3</option>
          <option value="Form 4">Form 4</option>
        </optgroup>
      </select>
    </div>

    <div class="mb-4">
      <label for="studentSelect">Student</label>

      <select
        id="studentSelect"
        name="studentId"
        required
        disabled
      >
        <option value="">
          Select a class first
        </option>
      </select>
    </div>

    <div class="mb-4">
      <label for="dueDate">Due Date</label>

      <input
        id="dueDate"
        name="dueDate"
        type="date"
        required
        value="${defaultDueStr}"
      >
    </div>

    <div
      id="issue-form-msg"
      style="display:none;"
    ></div>

    <div class="flex items-center justify-end gap-3">

      <button
        type="button"
        class="cancel-btn"
      >
        Cancel
      </button>

      <button
        type="submit"
        class="submit-btn"
      >
        <i class="fas fa-book-reader mr-2"></i>
        Issue Book
      </button>

    </div>
  `;

  // -----------------------------------------------------
  // Show modal
  // -----------------------------------------------------
  showModal(universalModal);

  // -----------------------------------------------------
  // IMPORTANT:
  // Clone/replace the form FIRST.
  //
  // Your previous code attached the class change
  // listener BEFORE replacing the form. That destroyed
  // the element containing the listener.
  // -----------------------------------------------------
  const newForm =
    universalForm.cloneNode(true);

  universalForm.parentNode.replaceChild(
    newForm,
    universalForm
  );

  // -----------------------------------------------------
  // Get references AFTER replacement
  // -----------------------------------------------------
  const finalForm =
    document.getElementById('universal-edit-form');

  if (!finalForm) {
    console.error('Final issue form not found');
    showNotification('Issue form not found', 'error');
    return;
  }

  const classSelect =
    finalForm.querySelector('#classSelect');

  const studentSelect =
    finalForm.querySelector('#studentSelect');

  const formMsg =
    finalForm.querySelector('#issue-form-msg');

  const cancelBtn =
    finalForm.querySelector('.cancel-btn');

  const submitBtn =
    finalForm.querySelector('.submit-btn');

  // -----------------------------------------------------
  // Make sure class/student elements exist
  // -----------------------------------------------------
  if (!classSelect || !studentSelect) {
    console.error(
      'classSelect or studentSelect missing from issue form'
    );

    showNotification(
      'Class/student fields are missing',
      'error'
    );

    return;
  }

  // -----------------------------------------------------
  // Cancel button
  // -----------------------------------------------------
  if (cancelBtn) {
    cancelBtn.onclick = (ev) => {
      ev.preventDefault();
      hideModal(universalModal);
    };
  }

  // =====================================================
  // LOAD STUDENTS WHEN CLASS CHANGES
  // =====================================================
  classSelect.addEventListener('change', async () => {

    const cls =
      classSelect.value.trim();

    console.log(
      '[LIBRARY ISSUE] Class selected:',
      cls
    );

    // No class selected
    if (!cls) {
      studentSelect.disabled = true;

      studentSelect.innerHTML = `
        <option value="">
          Select a class first
        </option>
      `;

      return;
    }

    // Show loading state
    studentSelect.disabled = true;

    studentSelect.innerHTML = `
      <option value="">
        Loading students...
      </option>
    `;

    try {

      // -------------------------------------------------
      // The students endpoint expects:
      //
      // /api/students/class/Grade%201
      //
      // apiFetch should add /api automatically.
      // -------------------------------------------------
      const endpoint =
        `/students/class/${encodeURIComponent(cls)}`;

      console.log(
        '[LIBRARY ISSUE] Fetching students:',
        endpoint
      );

      const response =
        await apiFetch(endpoint);

      console.log(
        '[LIBRARY ISSUE] Students response:',
        response
      );

      // -------------------------------------------------
      // Support both:
      //
      // [ students ]
      //
      // and:
      //
      // { success: true, data: [ students ] }
      // -------------------------------------------------
      const students =
        Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

      console.log(
        '[LIBRARY ISSUE] Students found:',
        students.length
      );

      // Clear dropdown
      studentSelect.innerHTML = '';

      // -------------------------------------------------
      // No students
      // -------------------------------------------------
      if (students.length === 0) {

        studentSelect.innerHTML = `
          <option value="">
            No students found in ${cls}
          </option>
        `;

        studentSelect.disabled = true;

        return;
      }

      // -------------------------------------------------
      // Default option
      // -------------------------------------------------
      const defaultOpt =
        document.createElement('option');

      defaultOpt.value = '';
      defaultOpt.textContent =
        'Select a student';

      defaultOpt.disabled = true;
      defaultOpt.selected = true;

      studentSelect.appendChild(
        defaultOpt
      );

      // -------------------------------------------------
      // Add students
      // -------------------------------------------------
      students.forEach((student) => {

        const opt =
          document.createElement('option');

        const studentId =
          student._id ||
          student.id ||
          '';

        const studentName =
          student.name ||
          student.displayName ||
          student.fullName ||
          student.email ||
          'Unnamed student';

        opt.value = studentId;

        opt.textContent = studentName;

        if (student.email) {
          opt.setAttribute(
            'data-email',
            student.email
          );
        }

        // Store class too, if available
        if (student.class) {
          opt.setAttribute(
            'data-class',
            student.class
          );
        }

        studentSelect.appendChild(
          opt
        );
      });

      // -------------------------------------------------
      // IMPORTANT:
      // Enable the student dropdown ONLY after students
      // have successfully been loaded.
      // -------------------------------------------------
      studentSelect.disabled = false;

      console.log(
        '[LIBRARY ISSUE] Student dropdown enabled'
      );

    } catch (err) {

      console.error(
        '[LIBRARY ISSUE] Error fetching students:',
        err
      );

      studentSelect.innerHTML = `
        <option value="">
          Error loading students
        </option>
      `;

      studentSelect.disabled = true;

      if (formMsg) {
        formMsg.textContent =
          err.message ||
          'Failed to load students';

        formMsg.className =
          'mt-3 text-sm text-red-600';

        formMsg.style.display =
          'block';
      }

    }
  });

  // =====================================================
  // FORM SUBMIT
  // =====================================================
  finalForm.onsubmit = async (ev) => {

    ev.preventDefault();

    // ---------------------------------------------------
    // Disable submit button
    // ---------------------------------------------------
    if (submitBtn) {

      submitBtn.disabled = true;

      submitBtn.setAttribute(
        'data-submitting',
        'true'
      );

      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin mr-2"></i>Issuing...';
    }

    if (formMsg) {
      formMsg.textContent = '';
      formMsg.style.display = 'none';
    }

    try {

      const formData =
        new FormData(finalForm);

      const bookIdVal =
        formData.get('bookId');

      const borrowerId =
        formData.get('studentId');

      const dueDate =
        formData.get('dueDate');

      const clsVal =
        classSelect.value.trim();

      // -------------------------------------------------
      // Get selected student
      // -------------------------------------------------
      const borrowerOption =
        studentSelect.options[
          studentSelect.selectedIndex
        ];

      const borrowerName =
        borrowerOption &&
        borrowerOption.value
          ? borrowerOption.textContent.trim()
          : '';

      const borrowerEmail =
        borrowerOption
          ? borrowerOption.getAttribute(
              'data-email'
            ) || ''
          : '';

      // -------------------------------------------------
      // Validation
      // -------------------------------------------------
      if (!clsVal) {
        throw new Error(
          'Please select a class'
        );
      }

      if (!borrowerId) {
        throw new Error(
          'Please select a student'
        );
      }

      if (!dueDate) {
        throw new Error(
          'Please select a due date'
        );
      }

      const token =
        localStorage.getItem('token');

      if (!token) {
        throw new Error(
          'Authentication required'
        );
      }

      console.log(
        '[LIBRARY ISSUE] Submitting:',
        {
          bookId: bookIdVal,
          borrowerId,
          borrowerName,
          borrowerEmail,
          className: clsVal,
          dueDate,
          genre
        }
      );

      // =================================================
      // ISSUE BOOK API
      // =================================================
      const resp =
        await fetch(
          `${BASE}/api/library/${bookIdVal}/issue`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Authorization':
                `Bearer ${token}`
            },

            body: JSON.stringify({
              borrowerName,
              borrowerId,
              borrowerEmail,
              dueDate,
              className: clsVal,
              genre
            })
          }
        );

      const data =
        await resp.json()
          .catch(() => ({}));

      console.log(
        '[LIBRARY ISSUE] API response:',
        data
      );

      // -------------------------------------------------
      // API error
      // -------------------------------------------------
      if (!resp.ok) {

        throw new Error(
          data.error ||
          data.message ||
          `Failed to issue book (status ${resp.status})`
        );
      }

      // =================================================
      // SUCCESS
      // =================================================
      if (formMsg) {

        formMsg.textContent =
          'Book issued successfully!';

        formMsg.className =
          'mt-3 text-sm text-green-600';

        formMsg.style.display =
          'block';
      }

      showNotification(
        'Book issued successfully',
        'success'
      );

      // -------------------------------------------------
      // Close modal and refresh library
      // -------------------------------------------------
      setTimeout(() => {

        hideModal(
          universalModal
        );

        loadLibraryWithFilters()
          .catch(console.error);

        if (submitBtn) {

          submitBtn.disabled =
            false;

          submitBtn.removeAttribute(
            'data-submitting'
          );

          submitBtn.innerHTML =
            '<i class="fas fa-book-reader mr-2"></i>Issue Book';
        }

      }, 900);

    } catch (error) {

      console.error(
        '[LIBRARY ISSUE] Error issuing book:',
        error
      );

      if (formMsg) {

        formMsg.textContent =
          error.message ||
          'An error occurred';

        formMsg.className =
          'mt-3 text-sm text-red-600';

        formMsg.style.display =
          'block';

        formMsg.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      if (submitBtn) {

        submitBtn.disabled =
          false;

        submitBtn.removeAttribute(
          'data-submitting'
        );

        submitBtn.innerHTML =
          '<i class="fas fa-book-reader mr-2"></i>Issue Book';
      }
    }
  };
}

  // -------------------------
  // Fees / Attendance / library stat integration (optional)
  // -------------------------
 
  // -------------------------
  // Add book form handler (initializeLibraryForm)
  // -------------------------
  function initializeLibraryForm() {
    const form = document.getElementById('library-form');
    if (!form) {
      console.warn('Library form not found; skipping initializeLibraryForm');
      return;
    }

    // replace node to avoid duplicate handlers
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const title = (document.getElementById('book-title')?.value || '').trim();
        const author = (document.getElementById('book-author')?.value || '').trim();
        const year = parseInt(document.getElementById('book-year')?.value) || new Date().getFullYear();
        const genre = document.getElementById('book-genre')?.value || 'Other';
        const className = document.getElementById('book-class')?.value || '';
        const copies = parseInt(document.getElementById('book-copies')?.value) || 1;
        const status = document.getElementById('book-status')?.value || 'available';

        if (!title || !author || !className) { alert('Please fill in required fields'); return; }
        const token = localStorage.getItem('token'); if (!token) { alert('Login required'); return; }

        const submitBtn = newForm.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : null;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Saving...'; }

        const payload = { title, author, year, genre, className, copies, available: copies, status };
        const res = await apiFetch('/api/books', { method: 'POST', body: JSON.stringify(payload) });
        showNotification('Book added successfully', 'success');
        newForm.reset();
        await loadLibraryWithFilters();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalText; }
      } catch (err) {
        console.error('Add book error', err);
        showNotification(err.message || 'Failed to add book', 'error');
        const submitBtn = newForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Add Book'; }
      }
    });
  }

  // -------------------------
  // Bulk toolbar helpers
  // -------------------------
  function updateLibraryBulkToolbarState() {
    const has = selectedBookIds.size > 0;
    if (libraryBulkToolbar) libraryBulkToolbar.style.display = has ? 'block' : 'none';
    if (libraryBulkDelete) libraryBulkDelete.disabled = !has;
    if (libraryBulkExport) libraryBulkExport.disabled = !has;
  }
  function clearLibrarySelections() {
    selectedBookIds.clear();
    document.querySelectorAll('.library-select-checkbox').forEach(cb => cb.checked = false);
    if (selectAllLibrary) selectAllLibrary.checked = false;
    updateLibraryBulkToolbarState();
  }

  async function handleBulkDelete() {
    if (selectedBookIds.size === 0) return;
    if (!confirm(`Delete ${selectedBookIds.size} selected book(s)?`)) return;
    try {
      const promises = Array.from(selectedBookIds).map(id => apiFetch(`/books/${id}`, { method: 'DELETE' }).catch(e => ({error:e})));
      const results = await Promise.allSettled(promises);
      const failed = results.filter(r => r.status === 'rejected' || (r.value && r.value.error));
      if (failed.length) {
        showNotification(`${failed.length} failed to delete`, 'error');
      } else showNotification('Deleted selected books', 'success');
      clearLibrarySelections();
      await loadLibraryWithFilters();
    } catch (err) { console.error(err); showNotification('Bulk delete failed','error'); }
  }

  async function handleBulkExport() {
    if (selectedBookIds.size === 0) { showNotification('Select at least one book', 'warning'); return; }
    try {
      const all = await apiFetch('/api/books');
      const arr = Array.isArray(all) ? all : (all.data || []);
      const sel = arr.filter(b => selectedBookIds.has(b._id));
      if (!sel.length) throw new Error('No selected books found in dataset');
      const headers = ['Title','Author','ISBN','Status','Available','Genre'];
      let csv = headers.join(',') + '\n';
      sel.forEach(b => {
        csv += [
          `"${(b.title||'').replace(/"/g,'""')}"`,
          `"${(b.author||'').replace(/"/g,'""')}"`,
          `"${(b.isbn||'').replace(/"/g,'""')}"`,
          `"${(b.status||'').replace(/"/g,'""')}"`,
          `"${b.available? 'Yes':'No'}"`,
          `"${(b.genre||'').replace(/"/g,'""')}"`
        ].join(',') + '\n';
      });
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `library_export_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
      showNotification(`Exported ${sel.length} book(s)`, 'success');
    } catch (err) {
      console.error('Export error', err);
      showNotification(err.message || 'Export failed', 'error');
    }
  }

  // -------------------------
  // Issued books: load & display
  // -------------------------
  let issuedBooksData = [];
  async function loadIssuedBooks() {
    const table = document.getElementById('issued-books-list');
    if (!table) return;
    table.innerHTML = `<tr><td colspan="8" class="text-center">Loading issued books...</td></tr>`;
    try {
      const res = await apiFetch('/api/books/issued');
      const books = Array.isArray(res) ? res : (res.data || []);
      issuedBooksData = books;
      if (!books.length) {
        table.innerHTML = `<tr><td colspan="8" class="text-center">No issued books</td></tr>`;
        return;
      }
      // if group format: use your displayIssuedBooks
      let html = '';
      books.forEach(b => html += renderIssuedBookRow(b));
      table.innerHTML = html;
      // attach return handlers
      document.querySelectorAll('.return-book-btn').forEach(btn => btn.addEventListener('click', handleReturnBook));
    } catch (err) {
      console.error('Load issued books error', err);
      table.innerHTML = `<tr><td colspan="8" class="text-danger">Failed to load issued books</td></tr>`;
    }
  }

  // Render issued row (simplified but keeps your badges & overdue)
  function renderIssuedBookRow(book) {
    const issueDate = book.issueDate ? new Date(book.issueDate).toLocaleDateString() : 'N/A';
    const due = book.dueDate ? new Date(book.dueDate) : null;
    const dueDate = due ? due.toLocaleDateString() : 'N/A';
    const today = new Date();
    const isOver = due && due < today && !book.returned;
    const daysOver = isOver ? Math.ceil((today - due)/(1000*60*60*24)) : 0;
    const fine = book.fine || 0;
    const className = book.className || book.doc?.className || 'Ungrouped';
    return `<tr class="${isOver? 'table-warning':''}" data-class="${className.toLowerCase()}" data-title="${escapeAttr(book.title||'')}" data-student="${escapeAttr(book.borrowerName||'')}">
      <td>
        <div class="fw-semibold">${escapeHtml(book.title||'Unknown')}</div>
        <div class="text-muted small">${escapeHtml(book.author||'')}</div>
      </td>
      <td>${escapeHtml(book.borrowerName||'Unknown')}</td>
      <td>${escapeHtml(className)}</td>
      <td>${issueDate}</td>
      <td>${dueDate}${isOver ? `<div class="badge bg-danger">${daysOver} day${daysOver!==1?'s':''} overdue</div>` : ''}</td>
      <td><span class="badge ${book.returned? 'bg-success':'bg-primary'}">${book.returned ? 'Returned' : 'Issued'}</span></td>
      <td>${fine>0? `<span class="badge bg-danger">KES ${parseFloat(fine).toFixed(2)}</span>` : ''}</td>
      <td>${!book.returned ? `<button class="return-book-btn" data-id="${book._id||''}" data-book-id="${book.bookId||''}" data-book-title="${escapeAttr(book.title||'')}" data-borrower="${escapeAttr(book.borrowerName||'')}" data-fine="${fine}">Return</button>` : ''}</td>
    </tr>`;
  }

  async function handleReturnBook(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const issueId = btn.getAttribute('data-id');
    const fine = parseFloat(btn.getAttribute('data-fine')||0);
    // find modal etc. For brevity show confirm then call API
    if (!confirm(`Return book "${btn.getAttribute('data-book-title')}" for ${btn.getAttribute('data-borrower')}?`)) return;
    try {
      await apiFetch(`/library/return/${issueId}`, { method: 'POST', body: JSON.stringify({ finePaid: fine }) });
      showNotification('Book returned', 'success');
      await loadIssuedBooks();
      await loadLibraryWithFilters();
    } catch (err) {
      console.error('Return error', err);
      showNotification(err.message || 'Failed to return', 'error');
    }
  }

  // -------------------------
  // Init functions
  // -------------------------
  function initLibrary() {
    console.debug('initLibrary running');
    libraryTableBody = document.getElementById('library-table-body');
    librarySearch = document.getElementById('library-search');
    libraryGenreFilter = document.getElementById('library-genre-filter');
    libraryAuthorFilter = document.getElementById('library-author-filter');
    libraryClassFilter = document.getElementById('library-class-filter');
    libraryBulkToolbar = document.getElementById('library-bulk-toolbar');
    libraryBulkDelete = document.getElementById('library-bulk-delete');
    libraryBulkExport = document.getElementById('library-bulk-export');
    selectAllLibrary = document.getElementById('select-all-library');
    issuedBooksSearch = document.getElementById('issued-books-search');
    issuedBooksList = document.getElementById('issued-books-list');

    // wire select all
    if (selectAllLibrary) {
      selectAllLibrary.onchange = function () {
        document.querySelectorAll('.library-select-checkbox').forEach(cb => {
          cb.checked = this.checked;
          const id = cb.getAttribute('data-id');
          if (this.checked) selectedBookIds.add(id); else selectedBookIds.delete(id);
        });
        updateLibraryBulkToolbarState();
      };
    }

    if (libraryBulkDelete) libraryBulkDelete.onclick = handleBulkDelete;
    if (libraryBulkExport) libraryBulkExport.onclick = handleBulkExport;

    // search/filter events (debounce simple)
    if (librarySearch) librarySearch.addEventListener('input', debounce(() => loadLibraryWithFilters(), 300));
    if (libraryGenreFilter) libraryGenreFilter.addEventListener('change', () => loadLibraryWithFilters());
    if (libraryAuthorFilter) libraryAuthorFilter.addEventListener('input', debounce(() => loadLibraryWithFilters(), 300));
    if (libraryClassFilter) libraryClassFilter.addEventListener('change', () => loadLibraryWithFilters());

    // issued books search
    if (issuedBooksSearch) issuedBooksSearch.addEventListener('input', debounce(() => filterIssuedBooks(), 300));

    updateLibraryBulkToolbarState();
  }

  function initIssuedBooksSearch() { /* kept for compatibility */ }

  // Utility debounce
  function debounce(fn, wait) {
    let t;
    return function (...args) { clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
  }

  // basic issued-books filter (uses client rows)
  function filterIssuedBooks() {
    const term = (document.getElementById('issued-books-search')?.value || '').toLowerCase();
    const classFilter = (document.getElementById('classFilter')?.value || 'All').toLowerCase();
    const table = document.getElementById('issued-books-list');
    if (!table) return;
    const rows = table.querySelectorAll('tr');
    let any = false;
    rows.forEach(r => {
      const isGroup = r.classList.contains('table-group');
      if (isGroup) { r.style.display = 'none'; return; }
      const title = (r.getAttribute('data-title')||'').toLowerCase();
      const stud = (r.getAttribute('data-student')||'').toLowerCase();
      const cls = (r.getAttribute('data-class')||'').toLowerCase();
      const matches = (!term || title.includes(term) || stud.includes(term)) && (classFilter==='all' || !classFilter || cls.includes(classFilter));
      r.style.display = matches ? '' : 'none';
      if (matches) any = true;
    });
    if (!any) {
      // show no results row
      if (!table.querySelector('.no-results-message')) {
        const tr = document.createElement('tr'); tr.className = 'no-results-message';
        tr.innerHTML = `<td colspan="8" class="text-center py-4"><div class="text-muted"><i class="fas fa-search fa-2x mb-2"></i><p>No books match your search criteria</p></div></td>`;
        table.appendChild(tr);
      }
    } else {
      const nr = table.querySelector('.no-results-message'); if (nr) nr.remove();
    }
  }

  // -------------------------
  // Initialize on DOM ready
  // -------------------------
  function initializeLibrary() {
    try {
      initLibrary();
      initIssuedBooksSearch();
      initializeLibraryForm();
      // default tab show if you have function showLibraryTab
      if (typeof window.showLibraryTab === 'function') window.showLibraryTab('available-books');
      loadLibraryWithFilters().catch(console.error);
      loadIssuedBooks().catch(() => {});
      console.log('Library initialized');
    } catch (err) {
      console.error('initializeLibrary error', err);
    }
  }

  // ensure single DOMContentLoaded binding
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLibrary);
  } else {
    initializeLibrary();
  }

  // Expose some functions for debugging
  window.loadLibraryWithFilters = loadLibraryWithFilters;
  window.loadIssuedBooks = loadIssuedBooks;
  window.initializeLibraryForm = initializeLibraryForm;
  window.apiFetch = apiFetch;

})();
