// =====================================================
// STUDENT DISCIPLINE
// =====================================================

(function () {

    'use strict';


    // =================================================
    // CONFIG
    // =================================================

    const API_URL =
        '/api/discipline/student/my-cases';


    // =================================================
    // STATE
    // =================================================

    let disciplineCases = [];


    // =================================================
    // DOM HELPERS
    // =================================================

    const $ = (id) =>
        document.getElementById(id);


    // =================================================
    // SHOW / HIDE
    // =================================================

    function showElement(element) {

        if (element) {
            element.style.display = '';
        }

    }


    function hideElement(element) {

        if (element) {
            element.style.display = 'none';
        }

    }


    // =================================================
    // LOADING
    // =================================================

    function showLoading() {

        showElement(
            $('studentDisciplineLoading')
        );

        hideElement(
            $('studentDisciplineError')
        );

        hideElement(
            $('studentDisciplineEmpty')
        );

    }


    function hideLoading() {

        hideElement(
            $('studentDisciplineLoading')
        );

    }


    // =================================================
    // ERROR
    // =================================================

    function showError(message) {

        hideLoading();

        hideElement(
            $('studentDisciplineEmpty')
        );

        const error =
            $('studentDisciplineError');

        const errorMessage =
            $('studentDisciplineErrorMessage');

        if (errorMessage) {
            errorMessage.textContent =
                message;
        }

        showElement(error);

    }


    // =================================================
    // ESCAPE HTML
    // =================================================

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


    // =================================================
    // DATE
    // =================================================

    function formatDate(date) {

        if (!date) {
            return '—';
        }

        const parsed =
            new Date(date);

        if (isNaN(parsed.getTime())) {
            return '—';
        }

        return parsed.toLocaleDateString(
            'en-GB',
            {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }
        );

    }


    // =================================================
    // REPORTER NAME
    // =================================================

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
                'Administrator'
            );

        }

        if (
            typeof reportedBy === 'string' &&
            reportedBy.trim()
        ) {

            return reportedBy.trim();

        }

        return 'Administrator';

    }


    // =================================================
    // STATUS LABEL
    // =================================================

    function getStatusLabel(status) {

        if (!status) {
            return 'Reported';
        }

        return String(status)
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char =>
                char.toUpperCase()
            );

    }


    // =================================================
    // SEVERITY LABEL
    // =================================================

    function getSeverityClass(severity) {

        return String(
            severity || 'low'
        ).toLowerCase();

    }


    // =================================================
    // SUMMARY
    // =================================================

    function updateSummary(cases) {

        const total =
            cases.length;

        const active =
            cases.filter(item =>
                ![
                    'resolved',
                    'dismissed'
                ].includes(
                    String(item.status || '')
                        .toLowerCase()
                )
            ).length;

        const resolved =
            cases.filter(item =>
                String(item.status || '')
                    .toLowerCase() === 'resolved'
            ).length;

        const high =
            cases.filter(item =>
                [
                    'high',
                    'critical'
                ].includes(
                    String(item.severity || '')
                        .toLowerCase()
                )
            ).length;


        const totalElement =
            $('studentDisciplineTotal');

        const activeElement =
            $('studentDisciplineActive');

        const resolvedElement =
            $('studentDisciplineResolved');

        const highElement =
            $('studentDisciplineHigh');


        if (totalElement) {
            totalElement.textContent =
                total;
        }

        if (activeElement) {
            activeElement.textContent =
                active;
        }

        if (resolvedElement) {
            resolvedElement.textContent =
                resolved;
        }

        if (highElement) {
            highElement.textContent =
                high;
        }

    }


    // =================================================
    // RENDER
    // =================================================

    function renderDiscipline(cases) {

        const container =
            $('studentDisciplineRecords');

        const empty =
            $('studentDisciplineEmpty');


        if (!container) {
            console.error(
                '[STUDENT DISCIPLINE] Records container not found.'
            );
            return;
        }


        container.innerHTML = '';


        if (!cases.length) {

            showElement(empty);

            return;

        }


        hideElement(empty);


        cases.forEach((discipline, index) => {

            const card =
                document.createElement('div');

            card.className =
                'student-discipline-card';


            const severity =
                getSeverityClass(
                    discipline.severity
                );


            card.innerHTML = `

                <div class="student-discipline-card-header">

                    <div>

                        <span class="student-discipline-category">
                            ${escapeHtml(
                                discipline.category || 'Other'
                            )}
                        </span>

                        <h3>
                            ${escapeHtml(
                                discipline.description || 'Discipline Case'
                            )}
                        </h3>

                    </div>

                    <span class="student-discipline-severity ${severity}">
                        ${escapeHtml(
                            discipline.severity || 'low'
                        )}
                    </span>

                </div>


                <div class="student-discipline-card-details">

                    <div>
                        <span>Date</span>
                        <strong>
                            ${formatDate(
                                discipline.incidentDate
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Status</span>
                        <strong>
                            ${escapeHtml(
                                getStatusLabel(
                                    discipline.status
                                )
                            )}
                        </strong>
                    </div>


                    <div>
                        <span>Reported By</span>
                        <strong>
                            ${escapeHtml(
                                getReporterName(
                                    discipline.reportedBy
                                )
                            )}
                        </strong>
                    </div>

                </div>


                <div class="student-discipline-card-footer">

                    <button
                        type="button"
                        class="student-discipline-view-button"
                        data-index="${index}"
                    >
                        <i class="fas fa-eye"></i>
                        View Details
                    </button>

                </div>

            `;


            const button =
                card.querySelector(
                    '.student-discipline-view-button'
                );


            if (button) {

                button.addEventListener(
                    'click',
                    function () {

                        openStudentDisciplineModal(
                            discipline
                        );

                    }
                );

            }


            container.appendChild(card);

        });

    }


    // =================================================
    // LOAD DISCIPLINE
    // =================================================

    async function loadStudentDiscipline() {

        console.log(
            '[STUDENT DISCIPLINE] Loading...'
        );

        showLoading();


        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Accept': 'application/json'
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


            // -----------------------------------------
            // AUTHENTICATION FAILURE
            // -----------------------------------------

            if (response.status === 401) {

                showError(
                    'Your session has expired. Please log in again.'
                );

                return;

            }


            // -----------------------------------------
            // NOT AUTHORIZED
            // -----------------------------------------

            if (response.status === 403) {

                showError(
                    data.message ||
                    'You are not authorized to view discipline records.'
                );

                return;

            }


            // -----------------------------------------
            // OTHER SERVER ERROR
            // -----------------------------------------

            if (!response.ok) {

                throw new Error(
                    data.message ||
                    'Failed to load discipline records.'
                );

            }


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            disciplineCases =
                Array.isArray(data.discipline)
                    ? data.discipline
                    : [];


            updateSummary(
                disciplineCases
            );


            renderDiscipline(
                disciplineCases
            );


            hideLoading();


        } catch (error) {

            console.error(
                '[STUDENT DISCIPLINE LOAD ERROR]',
                error
            );


            showError(
                error.message ||
                'Unable to load your discipline records.'
            );

        }

    }


    // =================================================
    // MODAL
    // =================================================

    function openStudentDisciplineModal(discipline) {

        const modal =
            $('studentDisciplineModal');

        const title =
            $('studentDisciplineModalTitle');

        const body =
            $('studentDisciplineModalBody');


        if (!modal || !body) {
            return;
        }


        if (title) {

            title.textContent =
                discipline.category ||
                'Discipline Case';

        }


        body.innerHTML = `

            <div class="discipline-detail-row">

                <span>Category</span>

                <strong>
                    ${escapeHtml(
                        discipline.category || '—'
                    )}
                </strong>

            </div>


            <div class="discipline-detail-row">

                <span>Severity</span>

                <strong>
                    ${escapeHtml(
                        discipline.severity || '—'
                    )}
                </strong>

            </div>


            <div class="discipline-detail-row">

                <span>Incident Date</span>

                <strong>
                    ${formatDate(
                        discipline.incidentDate
                    )}
                </strong>

            </div>


            <div class="discipline-detail-row">

                <span>Status</span>

                <strong>
                    ${escapeHtml(
                        getStatusLabel(
                            discipline.status
                        )
                    )}
                </strong>

            </div>


            <div class="discipline-detail-row">

                <span>Reported By</span>

                <strong>
                    ${escapeHtml(
                        getReporterName(
                            discipline.reportedBy
                        )
                    )}
                </strong>

            </div>


            <div class="discipline-detail-section">

                <h4>
                    Description
                </h4>

                <p>
                    ${escapeHtml(
                        discipline.description || 'No description provided.'
                    )}
                </p>

            </div>


            ${
                discipline.actionTaken
                    ? `
                        <div class="discipline-detail-section">

                            <h4>
                                Action Taken
                            </h4>

                            <p>
                                ${escapeHtml(
                                    discipline.actionTaken
                                )}
                            </p>

                        </div>
                    `
                    : ''
            }


            ${
                discipline.resolutionNotes
                    ? `
                        <div class="discipline-detail-section">

                            <h4>
                                Resolution Notes
                            </h4>

                            <p>
                                ${escapeHtml(
                                    discipline.resolutionNotes
                                )}
                            </p>

                        </div>
                    `
                    : ''
            }

        `;


        modal.style.display =
            'flex';

        modal.setAttribute(
            'aria-hidden',
            'false'
        );

        document.body.classList.add(
            'discipline-modal-open'
        );

    }


    // =================================================
    // CLOSE MODAL
    // =================================================

    window.closeStudentDisciplineModal =
        function () {

            const modal =
                $('studentDisciplineModal');


            if (!modal) {
                return;
            }


            modal.style.display =
                'none';


            modal.setAttribute(
                'aria-hidden',
                'true'
            );


            document.body.classList.remove(
                'discipline-modal-open'
            );

        };


    // =================================================
    // ESC KEY
    // =================================================

    document.addEventListener(
        'keydown',
        function (event) {

            if (
                event.key === 'Escape'
            ) {

                window.closeStudentDisciplineModal();

            }

        }
    );


    // =================================================
    // INITIALIZE
    // =================================================

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
