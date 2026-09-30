/* =====================================================
   STUDENT DISCIPLINE
===================================================== */

(function () {

    'use strict';


    // =====================================================
    // CONFIG
    // =====================================================

    const API_URL = '/api/discipline/student/my-cases';


    let disciplineCases = [];


    // =====================================================
    // DOM HELPERS
    // =====================================================

    function getElement(id) {
        return document.getElementById(id);
    }


    // =====================================================
    // ESCAPE HTML
    // Prevent unsafe HTML from database values
    // =====================================================

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


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return '—';
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return '—';
        }

        return date.toLocaleDateString(
            undefined,
            {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }
        );

    }


    // =====================================================
    // FORMAT STATUS
    // =====================================================

    function formatStatus(status) {

        if (!status) {
            return 'Reported';
        }

        return String(status)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, letter =>
                letter.toUpperCase()
            );

    }


    // =====================================================
    // FORMAT SEVERITY
    // =====================================================

    function formatSeverity(severity) {

        if (!severity) {
            return 'Low';
        }

        return String(severity)
            .replace(/\b\w/g, letter =>
                letter.toUpperCase()
            );

    }


    // =====================================================
    // REPORTER NAME
    // =====================================================

    function getReporterName(reportedBy) {

        if (
            reportedBy &&
            typeof reportedBy === 'object'
        ) {

            return (
                reportedBy.name ||
                reportedBy.fullName ||
                reportedBy.username ||
                reportedBy.email ||
                'School Administrator'
            );

        }


        if (
            typeof reportedBy === 'string' &&
            reportedBy.trim()
        ) {

            return reportedBy.trim();

        }


        return 'School Administrator';

    }


    // =====================================================
    // LOADING
    // =====================================================

    function showLoading() {

        const loading =
            getElement('studentDisciplineLoading');

        const error =
            getElement('studentDisciplineError');

        const empty =
            getElement('studentDisciplineEmpty');

        const records =
            getElement('studentDisciplineRecords');


        if (loading) {
            loading.style.display = 'flex';
        }

        if (error) {
            error.style.display = 'none';
        }

        if (empty) {
            empty.style.display = 'none';
        }

        if (records) {
            records.innerHTML = '';
        }

    }


    // =====================================================
    // HIDE LOADING
    // =====================================================

    function hideLoading() {

        const loading =
            getElement('studentDisciplineLoading');

        if (loading) {
            loading.style.display = 'none';
        }

    }


    // =====================================================
    // ERROR
    // =====================================================

    function showError(message) {

        hideLoading();

        const error =
            getElement('studentDisciplineError');

        const errorMessage =
            getElement('studentDisciplineErrorMessage');


        if (errorMessage) {

            errorMessage.textContent =
                message ||
                'Unable to load discipline records.';

        }

        if (error) {
            error.style.display = 'flex';
        }

    }


    // =====================================================
    // UPDATE SUMMARY
    // =====================================================

    function updateSummary(cases) {

        const total =
            cases.length;


        const active =
            cases.filter(item =>
                ![
                    'resolved',
                    'dismissed'
                ].includes(
                    String(item.status || '').toLowerCase()
                )
            ).length;


        const resolved =
            cases.filter(item =>
                String(item.status || '').toLowerCase() ===
                'resolved'
            ).length;


        const high =
            cases.filter(item => {

                const severity =
                    String(
                        item.severity || ''
                    ).toLowerCase();

                return (
                    severity === 'high' ||
                    severity === 'critical'
                );

            }).length;


        const totalElement =
            getElement('studentDisciplineTotal');

        const activeElement =
            getElement('studentDisciplineActive');

        const resolvedElement =
            getElement('studentDisciplineResolved');

        const highElement =
            getElement('studentDisciplineHigh');


        if (totalElement) {
            totalElement.textContent = total;
        }

        if (activeElement) {
            activeElement.textContent = active;
        }

        if (resolvedElement) {
            resolvedElement.textContent = resolved;
        }

        if (highElement) {
            highElement.textContent = high;
        }

    }


    // =====================================================
    // BADGE
    // =====================================================

    function severityBadge(severity) {

        const value =
            String(
                severity || 'low'
            ).toLowerCase();


        return `
            <span class="discipline-badge badge-${escapeHtml(value)}">
                ${escapeHtml(formatSeverity(value))}
            </span>
        `;

    }


    function statusBadge(status) {

        const value =
            String(
                status || 'reported'
            ).toLowerCase();


        return `
            <span class="discipline-badge badge-${escapeHtml(value)}">
                ${escapeHtml(formatStatus(value))}
            </span>
        `;

    }


    // =====================================================
    // CREATE RECORD CARD
    // =====================================================

    function createDisciplineCard(record, index) {

        const category =
            record.category ||
            'Other';


        const severity =
            record.severity ||
            'low';


        const status =
            record.status ||
            'reported';


        const description =
            record.description ||
            'No description provided.';


        const actionTaken =
            record.actionTaken ||
            'No action recorded.';


        const reporter =
            getReporterName(
                record.reportedBy
            );


        return `

            <article
                class="discipline-record-card"
            >

                <div class="discipline-record-top">

                    <div>

                        <h3 class="discipline-record-title">

                            ${escapeHtml(category)}

                        </h3>

                        <div class="discipline-record-date">

                            <i class="far fa-calendar-alt"></i>

                            Incident date:
                            ${escapeHtml(
                                formatDate(
                                    record.incidentDate
                                )
                            )}

                        </div>

                    </div>


                    <div class="discipline-badges">

                        ${severityBadge(severity)}

                        ${statusBadge(status)}

                    </div>

                </div>


                <p class="discipline-record-description">

                    ${escapeHtml(description)}

                </p>


                <div class="discipline-record-meta">

                    <div>

                        <span class="discipline-meta-label">
                            Reported By
                        </span>

                        <span class="discipline-meta-value">
                            ${escapeHtml(reporter)}
                        </span>

                    </div>


                    <div>

                        <span class="discipline-meta-label">
                            Action Taken
                        </span>

                        <span class="discipline-meta-value">

                            ${escapeHtml(
                                actionTaken
                            )}

                        </span>

                    </div>


                    <div>

                        <span class="discipline-meta-label">
                            Case Status
                        </span>

                        <span class="discipline-meta-value">

                            ${escapeHtml(
                                formatStatus(status)
                            )}

                        </span>

                    </div>

                </div>


                <div
                    style="
                        margin-top:18px;
                        display:flex;
                        justify-content:flex-end;
                    "
                >

                    <button
                        type="button"
                        class="discipline-view-button"
                        onclick="openStudentDisciplineModal(${index})"
                    >

                        <i class="fas fa-eye"></i>

                        View Details

                    </button>

                </div>

            </article>

        `;

    }


    // =====================================================
    // RENDER RECORDS
    // =====================================================

    function renderRecords(cases) {

        const records =
            getElement('studentDisciplineRecords');

        const empty =
            getElement('studentDisciplineEmpty');


        if (!records) {
            return;
        }


        records.innerHTML = '';


        if (!cases.length) {

            if (empty) {
                empty.style.display = 'block';
            }

            return;

        }


        if (empty) {
            empty.style.display = 'none';
        }


        records.innerHTML =
            cases
                .map(
                    (record, index) =>
                        createDisciplineCard(
                            record,
                            index
                        )
                )
                .join('');

    }

async function loadStudentDiscipline() {

    console.log(
        '[STUDENT DISCIPLINE] Loading...'
    );

    showLoading();

    try {

        const token = localStorage.getItem('token');

        console.log(
            '[STUDENT DISCIPLINE] Token exists:',
            !!token
        );

        if (!token) {
            throw new Error(
                'Your session has expired. Please log in again.'
            );
        }

        const response =
            await fetch(
                API_URL,
                {
                    method: 'GET',

                    headers: {
                        'Accept':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`
                    }
                }
            );

        console.log(
            '[STUDENT DISCIPLINE] HTTP:',
            response.status
        );

        let data = null;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                'Server returned an invalid response.'
            );

        }

        console.log(
            '[STUDENT DISCIPLINE] Response:',
            data
        );

        if (!response.ok) {

            throw new Error(
                data?.message ||
                `Failed to load discipline records (${response.status}).`
            );

        }

        if (
            data?.success !== true
        ) {

            throw new Error(
                data?.message ||
                'Unable to load discipline records.'
            );

        }

        disciplineCases =
            Array.isArray(
                data.discipline
            )
                ? data.discipline
                : [];

        updateSummary(
            disciplineCases
        );

        renderRecords(
            disciplineCases
        );

        hideLoading();

        console.log(
            '[STUDENT DISCIPLINE] Loaded:',
            disciplineCases.length
        );

    } catch (error) {

        console.error(
            '[STUDENT DISCIPLINE]',
            error
        );

        showError(
            error.message ||
            'Unable to load your discipline records.'
        );

    }

}

    // =====================================================
    // OPEN MODAL
    // =====================================================

    window.openStudentDisciplineModal =
        function (index) {

            const record =
                disciplineCases[index];


            if (!record) {
                return;
            }


            const modal =
                getElement(
                    'studentDisciplineModal'
                );

            const title =
                getElement(
                    'studentDisciplineModalTitle'
                );

            const body =
                getElement(
                    'studentDisciplineModalBody'
                );


            if (!modal || !body) {
                return;
            }


            const reporter =
                getReporterName(
                    record.reportedBy
                );


            if (title) {

                title.textContent =
                    record.category ||
                    'Discipline Case';

            }


            body.innerHTML = `

                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Category
                    </span>

                    <div class="discipline-detail-value">

                        ${escapeHtml(
                            record.category ||
                            'Other'
                        )}

                    </div>

                </div>


                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Incident Date
                    </span>

                    <div class="discipline-detail-value">

                        ${escapeHtml(
                            formatDate(
                                record.incidentDate
                            )
                        )}

                    </div>

                </div>


                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Severity
                    </span>

                    <div class="discipline-detail-value">

                        ${severityBadge(
                            record.severity
                        )}

                    </div>

                </div>


                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Status
                    </span>

                    <div class="discipline-detail-value">

                        ${statusBadge(
                            record.status
                        )}

                    </div>

                </div>


                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Description
                    </span>

                    <div class="discipline-detail-value">

                        ${escapeHtml(
                            record.description ||
                            'No description provided.'
                        )}

                    </div>

                </div>


                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Action Taken
                    </span>

                    <div class="discipline-action-box">

                        ${escapeHtml(
                            record.actionTaken ||
                            'No action recorded.'
                        )}

                    </div>

                </div>


                <div class="discipline-detail-row">

                    <span class="discipline-detail-label">
                        Reported By
                    </span>

                    <div class="discipline-detail-value">

                        ${escapeHtml(
                            reporter
                        )}

                    </div>

                </div>


                ${
                    record.resolutionNotes
                        ? `

                    <div class="discipline-detail-row">

                        <span class="discipline-detail-label">
                            Resolution Notes
                        </span>

                        <div class="discipline-action-box">

                            ${escapeHtml(
                                record.resolutionNotes
                            )}

                        </div>

                    </div>

                    `
                        : ''
                }


                ${
                    record.resolvedAt
                        ? `

                    <div class="discipline-detail-row">

                        <span class="discipline-detail-label">
                            Resolved On
                        </span>

                        <div class="discipline-detail-value">

                            ${escapeHtml(
                                formatDate(
                                    record.resolvedAt
                                )
                            )}

                        </div>

                    </div>

                    `
                        : ''
                }

            `;


            modal.style.display =
                'block';

            modal.setAttribute(
                'aria-hidden',
                'false'
            );


            document.body.style.overflow =
                'hidden';

        };


    // =====================================================
    // CLOSE MODAL
    // =====================================================

    window.closeStudentDisciplineModal =
        function () {

            const modal =
                getElement(
                    'studentDisciplineModal'
                );


            if (!modal) {
                return;
            }


            modal.style.display =
                'none';

            modal.setAttribute(
                'aria-hidden',
                'true'
            );


            document.body.style.overflow =
                '';

        };


    // =====================================================
    // ESC KEY
    // =====================================================

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape'
            ) {

                closeStudentDisciplineModal();

            }

        }
    );


    // =====================================================
    // INITIALIZE
    // =====================================================

    document.addEventListener(
        'DOMContentLoaded',
        function () {

            console.log(
                '[STUDENT DISCIPLINE] Initializing page...'
            );


            loadStudentDiscipline();

        }
    );


})();
