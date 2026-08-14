// ============================================================
// STUDENT LIBRARY
// Loads books currently issued to the logged-in student
// ============================================================

import { API_CONFIG } from './config.js';


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    console.log(
        '[STUDENT LIBRARY] Student library module loaded'
    );

    // Attach click listener if the tab already exists.
    const libraryTab =
        document.querySelector(
            '[data-tab="library-section"]'
        );

    if (libraryTab) {

        libraryTab.addEventListener(
            'click',
            () => {
                console.log(
                    '[STUDENT LIBRARY] Library tab clicked'
                );

                fetchMyIssuedBooks();
            }
        );

    } else {

        console.warn(
            '[STUDENT LIBRARY] Library tab not found during DOMContentLoaded'
        );
    }
});


// ============================================================
// FETCH MY ISSUED BOOKS
// Backend:
// GET /api/library/my-books
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
            '[STUDENT LIBRARY] Token exists'
        );

        const endpoint =
            `${API_CONFIG.BASE_URL}/api/library/my-books`;

        console.log(
            '[STUDENT LIBRARY] Endpoint:',
            endpoint
        );

        const response =
            await fetch(
                endpoint,
                {
                    method: 'GET',

                    headers: {
                        'Authorization':
                            `Bearer ${token}`,

                        'Accept':
                            'application/json'
                    },

                    credentials: 'include'
                }
            );

        console.log(
            '[STUDENT LIBRARY] Response status:',
            response.status
        );

        // ----------------------------------------------------
        // Read response safely
        // ----------------------------------------------------

        const contentType =
            response.headers.get(
                'content-type'
            ) || '';

        let result;

        if (
            contentType.includes(
                'application/json'
            )
        ) {

            result =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                '[STUDENT LIBRARY] Non-JSON response:',
                text
            );

            throw new Error(
                `Server returned ${response.status}`
            );
        }

        console.log(
            '[STUDENT LIBRARY] Server response:',
            result
        );

        // ----------------------------------------------------
        // Handle errors
        // ----------------------------------------------------

        if (!response.ok) {

            const message =
                result?.message ||
                result?.error ||
                'Failed to fetch your books';

            throw new Error(message);
        }

        // ----------------------------------------------------
        // Normalize response
        //
        // Your current backend returns:
        //
        // [
        //   {
        //      id,
        //      title,
        //      author,
        //      ...
        //   }
        // ]
        //
        // But this also supports:
        //
        // { data: [...] }
        // { books: [...] }
        // ----------------------------------------------------

        let books = [];

        if (Array.isArray(result)) {

            books = result;

        } else if (
            Array.isArray(result?.data)
        ) {

            books =
                result.data;

        } else if (
            Array.isArray(result?.books)
        ) {

            books =
                result.books;

        }

        console.log(
            '[STUDENT LIBRARY] Books received:',
            books
        );

        console.log(
            '[STUDENT LIBRARY] Number of books:',
            books.length
        );

        displayMyBooks(books);

        return books;

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

        // Also show the error in the table.
        const booksList =
            document.getElementById(
                'my-books-list'
            );

        if (booksList) {

            booksList.innerHTML = `
                <tr>
                    <td
                        colspan="5"
                        class="text-center text-danger py-4"
                    >
                        Failed to load your issued books.
                    </td>
                </tr>
            `;
        }
    }
}


// ============================================================
// DISPLAY MY BOOKS
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
        !Array.isArray(books) ||
        books.length === 0
    ) {

        console.log(
            '[STUDENT LIBRARY] No books currently issued'
        );

        booksList.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-muted py-4"
                >
                    <i class="fas fa-book-open me-2"></i>
                    No books currently issued to you.
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

            const issueDate =
                formatDate(
                    book.issueDate
                );

            const dueDate =
                formatDate(
                    book.dueDate
                );

            const due =
                book.dueDate
                    ? new Date(
                        book.dueDate
                    )
                    : null;

            const isOverdue =
                due &&
                due < new Date() &&
                book.status !== 'Returned';

            const fine =
                Number(
                    book.fine || 0
                );

            const status =
                book.status ||
                (
                    isOverdue
                        ? 'Overdue'
                        : 'Issued'
                );

            return `
                <tr>

                    <td>
                        <div class="fw-semibold">
                            ${escapeHtml(
                                book.title ||
                                'N/A'
                            )}
                        </div>

                        ${
                            book.genre
                                ? `
                                    <small class="text-muted">
                                        ${escapeHtml(
                                            book.genre
                                        )}
                                    </small>
                                  `
                                : ''
                        }
                    </td>

                    <td>
                        ${escapeHtml(
                            book.author ||
                            'N/A'
                        )}
                    </td>

                    <td>
                        ${issueDate}
                    </td>

                    <td class="${
                        isOverdue
                            ? 'text-danger fw-bold'
                            : ''
                    }">

                        ${dueDate}

                        ${
                            isOverdue
                                ? `
                                    <div>
                                        <small class="text-danger">
                                            Overdue
                                        </small>
                                    </div>
                                  `
                                : ''
                        }

                    </td>

                    <td>

                        <span
                            class="badge ${
                                getStatusBadgeClass(
                                    status
                                )
                            }"
                        >
                            ${escapeHtml(status)}

                            ${
                                fine > 0
                                    ? `
                                        — KES ${fine.toFixed(2)}
                                      `
                                    : ''
                            }
                        </span>

                    </td>

                </tr>
            `;

        }).join('');

    console.log(
        `[STUDENT LIBRARY] Displayed ${books.length} books`
    );
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

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );
}


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(
    message,
    type = 'info'
) {

    const messageEl =
        document.getElementById(
            'message'
        );

    if (!messageEl) {

        console.warn(
            '[STUDENT LIBRARY] #message not found:',
            message
        );

        return;
    }

    let alertType = type;

    if (type === 'error') {
        alertType = 'danger';
    }

    messageEl.textContent =
        message;

    messageEl.className =
        `alert alert-${alertType} alert-dismissible fade show`;

    messageEl.style.display =
        'block';
}


// ============================================================
// GLOBAL ACCESS
// ============================================================

window.fetchMyIssuedBooks =
    fetchMyIssuedBooks;

window.displayMyBooks =
    displayMyBooks;


// ============================================================
// MODULE LOADED
// ============================================================

console.log(
    '[STUDENT LIBRARY] Module ready'
);
