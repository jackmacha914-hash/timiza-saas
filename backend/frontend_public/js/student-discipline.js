// =====================================================
// STUDENT DISCIPLINE
// =====================================================

let studentDisciplineCases = [];


// =====================================================
// LOAD DISCIPLINE
// =====================================================

async function loadStudentDiscipline() {

    const loading =
        document.getElementById(
            'studentDisciplineLoading'
        );

    const error =
        document.getElementById(
            'studentDisciplineError'
        );

    const empty =
        document.getElementById(
            'studentDisciplineEmpty'
        );

    const records =
        document.getElementById(
            'studentDisciplineRecords'
        );

    if (loading) {
        loading.style.display = 'block';
    }

    if (error) {
        error.style.display = 'none';
        error.textContent = '';
    }

    if (empty) {
        empty.style.display = 'none';
    }

    try {

        const response = await fetch(
            '/api/discipline/student/my-cases',
            {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Failed to load discipline records.'
            );

        }


        studentDisciplineCases =
            Array.isArray(data.discipline)
                ? data.discipline
                : [];


        renderStudentDiscipline();


    } catch (err) {

        console.error(
            '[STUDENT DISCIPLINE]',
            err
        );


        if (error) {

            error.textContent =
                err.message ||
                'Failed to load discipline records.';

            error.style.display = 'block';

        }

    } finally {

        if (loading) {
            loading.style.display = 'none';
        }

    }

}


// =====================================================
// RENDER
// =====================================================

function renderStudentDiscipline() {

    const records =
        document.getElementById(
            'studentDisciplineRecords'
        );

    const empty =
        document.getElementById(
            'studentDisciplineEmpty'
        );


    if (!records) {
        return;
    }


    records.innerHTML = '';


    updateStudentDisciplineSummary();


    if (
        studentDisciplineCases.length === 0
    ) {

        if (empty) {
            empty.style.display = 'block';
        }

        return;

    }


    if (empty) {
        empty.style.display = 'none';
    }


    studentDisciplineCases.forEach(
        discipline => {

            records.appendChild(
                createStudentDisciplineCard(
                    discipline
                )
            );

        }
    );

}


// =====================================================
// SUMMARY
// =====================================================

function updateStudentDisciplineSummary() {

    const total =
        studentDisciplineCases.length;


    const active =
        studentDisciplineCases.filter(
            item =>
                ![
                    'resolved',
                    'dismissed'
                ].includes(
                    String(
                        item.status || ''
                    ).toLowerCase()
                )
        ).length;


    const resolved =
        studentDisciplineCases.filter(
            item =>
                String(
                    item.status || ''
                ).toLowerCase() === 'resolved'
        ).length;


    const highCritical =
        studentDisciplineCases.filter(
            item =>
                [
                    'high',
                    'critical'
                ].includes(
                    String(
                        item.severity || ''
                    ).toLowerCase()
                )
        ).length;


    setText(
        'studentDisciplineTotal',
        total
    );

    setText(
        'studentDisciplineActive',
        active
    );

    setText(
        'studentDisciplineResolved',
        resolved
    );

    setText(
        'studentDisciplineHigh',
        highCritical
    );

}


// =====================================================
// CREATE CARD
// =====================================================

function createStudentDisciplineCard(
    discipline
) {

    const card =
        document.createElement('div');


    card.className =
        'student-discipline-card';


    const severity =
        String(
            discipline.severity || 'low'
        ).toLowerCase();


    const status =
        String(
            discipline.status || 'reported'
        ).toLowerCase();


    const category =
        discipline.category ||
        'Other';


    const description =
        discipline.description ||
        'No description provided.';


    const date =
        formatStudentDisciplineDate(
            discipline.incidentDate
        );


    const actionTaken =
        discipline.actionTaken ||
        'No action recorded.';


    const resolutionNotes =
        discipline.resolutionNotes ||
        '';


    const reporter =
        getStudentDisciplineReporter(
            discipline.reportedBy
        );


    card.innerHTML = `

        <div class="student-discipline-card-header">

            <div>

                <span
                    class="discipline-severity severity-${severity}"
                >
                    ${escapeStudentHtml(
                        severity.toUpperCase()
                    )}
                </span>

                <h3>
                    ${escapeStudentHtml(
                        category
                    )}
                </h3>

            </div>

            <span
                class="discipline-status status-${status}"
            >
                ${formatStudentDisciplineStatus(
                    status
                )}
            </span>

        </div>


        <div class="student-discipline-date">
            ${escapeStudentHtml(date)}
        </div>


        <div class="student-discipline-description">

            <strong>
                Incident
            </strong>

            <p>
                ${escapeStudentHtml(
                    description
                )}
            </p>

        </div>


        <div class="student-discipline-info">

            <div>

                <strong>
                    Reported By
                </strong>

                <span>
                    ${escapeStudentHtml(
                        reporter
                    )}
                </span>

            </div>


            <div>

                <strong>
                    Action Taken
                </strong>

                <span>
                    ${escapeStudentHtml(
                        actionTaken
                    )}
                </span>

            </div>

        </div>


        ${
            resolutionNotes
                ? `
                    <div class="student-discipline-resolution">

                        <strong>
                            Resolution Notes
                        </strong>

                        <p>
                            ${escapeStudentHtml(
                                resolutionNotes
                            )}
                        </p>

                    </div>
                `
                : ''
        }

    `;


    return card;

}


// =====================================================
// REPORTER
// =====================================================

function getStudentDisciplineReporter(
    reportedBy
) {

    if (
        reportedBy &&
        typeof reportedBy === 'object'
    ) {

        return (
            String(
                reportedBy.name || ''
            ).trim() ||

            String(
                reportedBy.fullName || ''
            ).trim() ||

            String(
                reportedBy.username || ''
            ).trim() ||

            String(
                reportedBy.email || ''
            ).trim() ||

            'Administrator'
        );

    }


    if (
        typeof reportedBy === 'string'
    ) {

        const value =
            reportedBy.trim();

        if (value) {
            return value;
        }

    }


    return 'Administrator';

}


// =====================================================
// STATUS
// =====================================================

function formatStudentDisciplineStatus(
    status
) {

    const labels = {

        reported:
            'Reported',

        under_investigation:
            'Under Investigation',

        hearing_scheduled:
            'Hearing Scheduled',

        action_taken:
            'Action Taken',

        resolved:
            'Resolved',

        dismissed:
            'Dismissed'

    };


    return labels[status] ||
        'Reported';

}


// =====================================================
// DATE
// =====================================================

function formatStudentDisciplineDate(
    date
) {

    if (!date) {
        return 'Date not available';
    }


    const parsed =
        new Date(date);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return 'Date not available';

    }


    return parsed.toLocaleDateString(
        undefined,
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }
    );

}


// =====================================================
// TEXT HELPER
// =====================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeStudentHtml(
    value
) {

    return String(value ?? '')
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
