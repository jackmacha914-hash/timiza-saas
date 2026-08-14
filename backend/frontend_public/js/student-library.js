// ============================================================
// STUDENT LIBRARY
// ============================================================

import { API_CONFIG } from './config.js';

console.log('[STUDENT LIBRARY] Module loaded');

// ============================================================
// FETCH MY ISSUED BOOKS
// ============================================================

async function fetchMyIssuedBooks() {

    console.log(
        '[STUDENT LIBRARY] Fetching my issued books...'
    );

    try {

        const token =
            localStorage.getItem('token');

        if (!token) {

            console.error(
                '[STUDENT LIBRARY] No authentication token'
            );

            showMessage(
                'Please log in to view your books',
                'error'
            );

            return;
        }

        console.log(
            '[STUDENT LIBRARY] Token found'
        );

        const endpoint =
            `${API_CONFIG.BASE_URL}/api/library/my-books`;

        console.log(
            '[STUDENT LIBRARY] Request:',
            endpoint
        );

        const response =
            await fetch(endpoint, {
                method: 'GET',

                headers: {
                    'Authorization':
                        `Bearer ${token}`,

                    'Content-Type':
                        'application/json',

                    'Accept':
                        'application/json'
                },

                credentials: 'include'
            });

        console.log(
            '[STUDENT LIBRARY] Response status:',
            response.status
        );

        // ----------------------------------------------------
        // Read response
        // ----------------------------------------------------

        let data = {};

        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                '[STUDENT LIBRARY] Invalid JSON response:',
                jsonError
            );

            throw new Error(
                `Server returned HTTP ${response.status}`
            );
        }

        console.log(
            '[STUDENT LIBRARY] Response data:',
            data
        );

        // ----------------------------------------------------
        // Handle HTTP errors
        // ----------------------------------------------------

        if (!response.ok) {

            const message =
                data?.message ||
                data?.error ||
                `Failed to fetch your books (HTTP ${response.status})`;

            throw new Error(message);
        }

        // ----------------------------------------------------
        // Normalize response
        // ----------------------------------------------------

        const books =
            Array.isArray(data)
                ? data
                : (
                    data?.data ||
                    data?.books ||
                    []
                );

        console.log(
            '[STUDENT LIBRARY] Books received:',
            books
        );

        console.log(
            '[STUDENT LIBRARY] Number of books:',
            books.length
        );

        // ----------------------------------------------------
        // Display
        // ----------------------------------------------------

        displayMyBooks(books);

    } catch (error) {

        console.error(
            '[STUDENT LIBRARY] Error fetching issued books:',
            error
        );

        showMessage(
            error.message ||
            'Failed to load your books. Please try again.',
            'error'
        );
    }
}


// ============================================================
// DISPLAY BOOKS
// ============================================================

function displayMyBooks(books) {

    const booksList =
        document.getElementById(
            'my-books-list'
        );

    if (!booksList) {

        console.error(
            '[STUDENT LIBRARY] #my-books-list not found'
        );

        return;
    }

    // --------------------------------------------------------
    // No books
    // --------------------------------------------------------

    if (
        !books ||
        books.length === 0
    ) {

        booksList.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-muted py-4"
                >
                    <i
                        class="bi bi-book"
                        style="font-size: 2rem;"
                    ></i>

                    <div class="mt-2">
                        No books currently issued to you.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    // --------------------------------------------------------
    // Render books
    // --------------------------------------------------------

    booksList.innerHTML =
        books.map(book => {

            const dueDate =
                book.dueDate
                    ? new Date(book.dueDate)
                    : null;

            const isOverdue =
                dueDate &&
                dueDate < new Date() &&
                !book.returned &&
                String(book.status || '').toLowerCase()
                    !== 'returned';

            const status =
                book.status ||
                (
                    book.returned
                        ? 'Returned'
                        : isOverdue
                            ? 'Overdue'
                            : 'Issued'
                );

            const fine =
                Number(book.fine || 0);

            return `
                <tr>

                    <!-- BOOK TITLE -->
                    <td>
                        <div class="fw-semibold">
                            ${escapeHtml(
                                book.title ||
                                'N/A'
                            )}
                        </div>
                    </td>

                    <!-- AUTHOR -->
                    <td>
                        ${escapeHtml(
                            book.author ||
                            'N/A'
                        )}
                    </td>

                    <!-- ISSUE DATE -->
                    <td>
                        ${formatDate(
                            book.issueDate
                        )}
                    </td>

                    <!-- DUE DATE -->
                    <td
                        class="${
                            isOverdue
                                ? 'text-danger fw-bold'
                                : ''
                        }"
                    >
                        ${formatDate(
                            book.dueDate
                        )}

                        ${
                            isOverdue
                                ? `
                                    <div>
                                        <small
                                            class="text-danger"
                                        >
                                            Overdue
                                        </small>
                                    </div>
                                  `
                                : ''
                        }
                    </td>

                    <!-- STATUS -->
                    <td>

                        <span
                            class="badge ${getStatusBadgeClass(
                                status
                            )}"
                        >
                            ${escapeHtml(status)}

                            ${
                                fine > 0
                                    ? `
                                        <br>
                                        <small>
                                            KES
                                            ${fine.toFixed(2)}
                                        </small>
                                      `
                                    : ''
                            }
                        </span>

                    </td>

                </tr>
            `;

        }).join('');
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateString) {

    if (!dateString) {
        return 'N/A';
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toLocaleDateString(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }
    );
}


// ============================================================
// STATUS BADGE
// ============================================================

function getStatusBadgeClass(status) {

    switch (
        String(status || '')
            .toLowerCase()
    ) {

        case 'issued':
            return 'bg-primary';

        case 'overdue':
            return 'bg-danger';

        case 'returned':
            return 'bg-success';

        default:
            return 'bg-secondary';
    }
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
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
// SHOW MESSAGE
// ============================================================

function showMessage(
    message,
    type = 'info'
) {

    const messageEl =
        document.getElementById('message');

    if (!messageEl) {
        console.warn(
            '[STUDENT LIBRARY] Message element not found:',
            message
        );
        return;
    }

    const messageText =
        document.getElementById(
            'message-text'
        );

    if (messageText) {

        messageText.textContent =
            message;

    } else {

        messageEl.textContent =
            message;
    }

    messageEl.className =
        `alert alert-${type} alert-dismissible fade show`;

    messageEl.style.display =
        'block';
}


// ============================================================
// MAKE FUNCTION GLOBAL
// IMPORTANT FOR student.js
// ============================================================

window.fetchMyIssuedBooks =
    fetchMyIssuedBooks;

window.displayMyBooks =
    displayMyBooks;


// ============================================================
// INITIALIZE AFTER DOM
// ============================================================

document.addEventListener(
    'DOMContentLoaded',
    () => {

        console.log(
            '[STUDENT LIBRARY] DOM ready'
        );

        const libraryTab =
            document.querySelector(
                '[data-tab="library-section"]'
            );

        if (!libraryTab) {

            console.warn(
                '[STUDENT LIBRARY] Library tab not found'
            );

            return;
        }

        console.log(
            '[STUDENT LIBRARY] Library tab found'
        );

        // ----------------------------------------------------
        // Do NOT rely only on student.js.
        // Register our own click handler.
        // ----------------------------------------------------

        libraryTab.addEventListener(
            'click',
            () => {

                console.log(
                    '[STUDENT LIBRARY] Library tab clicked'
                );

                // Small delay allows student.js
                // to finish switching sections.
                setTimeout(
                    () => {

                        fetchMyIssuedBooks();

                    },
                    100
                );
            }
        );

        console.log(
            '[STUDENT LIBRARY] Library handler attached'
        );
    }
);


// ============================================================
// MODULE LOADED
// ============================================================

console.log(
    '[STUDENT LIBRARY] fetchMyIssuedBooks available:',
    typeof window.fetchMyIssuedBooks
);
