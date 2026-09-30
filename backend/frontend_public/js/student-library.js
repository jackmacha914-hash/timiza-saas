// ============================================================
// STUDENT LIBRARY
// ============================================================

(function () {

    console.log('[STUDENT LIBRARY] Script loaded');

    // ------------------------------------------------------------
    // API BASE URL
    // ------------------------------------------------------------

    const API_BASE_URL =
        window.API_CONFIG?.BASE_URL ||
        'https://timiza-saas.onrender.com';

    console.log(
        '[STUDENT LIBRARY] API:',
        API_BASE_URL
    );

    // ------------------------------------------------------------
    // FETCH MY ISSUED BOOKS
    // ------------------------------------------------------------

    async function fetchMyIssuedBooks() {

        console.log(
            '[STUDENT LIBRARY] Fetching issued books...'
        );

        const booksList =
            document.getElementById('my-books-list');

        if (!booksList) {
            console.error(
                '[STUDENT LIBRARY] my-books-list not found'
            );
            return;
        }

        booksList.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    Loading your books...
                </td>
            </tr>
        `;

        try {

            const token =
                localStorage.getItem('token');

            if (!token) {

                console.error(
                    '[STUDENT LIBRARY] No authentication token'
                );

                booksList.innerHTML = `
                    <tr>
                        <td colspan="5"
                            class="text-center text-danger">
                            Please log in to view your books.
                        </td>
                    </tr>
                `;

                return;
            }

            const url =
                `${API_BASE_URL}/api/library/my-books`;

            console.log(
                '[STUDENT LIBRARY] Request:',
                url
            );

            const response =
                await fetch(url, {
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

            const result =
                await response.json().catch(() => null);

            console.log(
                '[STUDENT LIBRARY] Response:',
                result
            );

            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    result?.error ||
                    `HTTP ${response.status}`
                );
            }

            /*
             * Backend may return either:
             *
             * [
             *   {...}
             * ]
             *
             * OR:
             *
             * {
             *   success: true,
             *   books: [...]
             * }
             *
             * OR:
             *
             * {
             *   success: true,
             *   data: [...]
             * }
             */

            let books = [];

            if (Array.isArray(result)) {

                books = result;

            } else if (
                Array.isArray(result?.books)
            ) {

                books = result.books;

            } else if (
                Array.isArray(result?.data)
            ) {

                books = result.data;

            } else if (
                Array.isArray(result?.issuedBooks)
            ) {

                books = result.issuedBooks;
            }

            console.log(
                '[STUDENT LIBRARY] Books:',
                books
            );

            displayMyBooks(books);

        } catch (error) {

            console.error(
                '[STUDENT LIBRARY] Error fetching books:',
                error
            );

            booksList.innerHTML = `
                <tr>
                    <td colspan="5"
                        class="text-center text-danger">
                        ${escapeHtml(
                            error.message ||
                            'Failed to load your books'
                        )}
                    </td>
                </tr>
            `;
        }
    }

    // ------------------------------------------------------------
    // DISPLAY BOOKS
    // ------------------------------------------------------------

    function displayMyBooks(books) {

        const booksList =
            document.getElementById('my-books-list');

        if (!booksList) {
            return;
        }

        if (!Array.isArray(books) || books.length === 0) {

            booksList.innerHTML = `
                <tr>
                    <td colspan="5"
                        class="text-center text-muted">
                        No books currently issued to you.
                    </td>
                </tr>
            `;

            return;
        }

        booksList.innerHTML =
            books.map(book => {

                const title =
                    book.title ||
                    book.bookTitle ||
                    book.book?.title ||
                    'N/A';

                const author =
                    book.author ||
                    book.book?.author ||
                    'N/A';

                const issueDate =
                    book.issueDate ||
                    book.issuedDate;

                const dueDate =
                    book.dueDate;

                const returned =
                    book.returned === true;

                const status =
                    book.status ||
                    (returned
                        ? 'Returned'
                        : isOverdue(dueDate)
                            ? 'Overdue'
                            : 'Issued');

                const fine =
                    Number(book.fine || 0);

                return `
                    <tr>

                        <td>
                            ${escapeHtml(title)}
                        </td>

                        <td>
                            ${escapeHtml(author)}
                        </td>

                        <td>
                            ${formatDate(issueDate)}
                        </td>

                        <td class="${
                            !returned &&
                            isOverdue(dueDate)
                                ? 'text-danger fw-bold'
                                : ''
                        }">
                            ${formatDate(dueDate)}
                        </td>

                        <td>

                            <span class="badge ${
                                getStatusBadgeClass(
                                    status
                                )
                            }">

                                ${escapeHtml(status)}

                                ${
                                    fine > 0
                                        ? ` (KES ${fine.toFixed(2)})`
                                        : ''
                                }

                            </span>

                        </td>

                    </tr>
                `;

            }).join('');
    }

    // ------------------------------------------------------------
    // DATE
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // OVERDUE
    // ------------------------------------------------------------

    function isOverdue(dateString) {

        if (!dateString) {
            return false;
        }

        const due =
            new Date(dateString);

        return (
            !Number.isNaN(due.getTime()) &&
            due < new Date()
        );
    }

    // ------------------------------------------------------------
    // STATUS BADGE
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // ESCAPE HTML
    // ------------------------------------------------------------

    function escapeHtml(value) {

        if (value === null ||
            value === undefined) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ------------------------------------------------------------
    // GLOBAL FUNCTION
    // ------------------------------------------------------------

    window.fetchMyIssuedBooks =
        fetchMyIssuedBooks;

    window.displayMyBooks =
        displayMyBooks;

    console.log(
        '[STUDENT LIBRARY] fetchMyIssuedBooks is available:',
        typeof window.fetchMyIssuedBooks
    );

    // ------------------------------------------------------------
    // LOAD WHEN LIBRARY TAB IS CLICKED
    // ------------------------------------------------------------

    document.addEventListener(
        'DOMContentLoaded',
        function () {

            const libraryTab =
                document.querySelector(
                    '[data-tab="library-section"]'
                );

            if (libraryTab) {

                libraryTab.addEventListener(
                    'click',
                    function () {

                        console.log(
                            '[STUDENT LIBRARY] Library tab clicked'
                        );

                        fetchMyIssuedBooks();

                    }
                );
            }

        }
    );

})();
