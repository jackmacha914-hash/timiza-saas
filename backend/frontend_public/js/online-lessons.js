/* =========================================================
   STUDENT ONLINE LESSONS
   FRONTEND VERSION - MOCK DATA
========================================================= */

(function () {

    'use strict';

    console.log('[ONLINE LESSONS] Script loaded');


    // =====================================================
    // MOCK DATA
    // Later this will come from the backend
    // =====================================================

    const mockLessons = {

        today: [
            {
                _id: 'lesson-001',
                subject: 'Mathematics',
                title: 'Introduction to Algebra',
                description: 'Learn the basic concepts of algebraic expressions and equations.',
                teacher: 'Mr. Kamau',
                scheduledAt: new Date().setHours(10, 0, 0, 0),
                duration: 60,
                status: 'scheduled',
                meeting: {
                    joinUrl: '#'
                }
            },
            {
                _id: 'lesson-002',
                subject: 'Science',
                title: 'The Human Digestive System',
                description: 'A lesson covering the major organs involved in digestion.',
                teacher: 'Ms. Wanjiku',
                scheduledAt: new Date().setHours(14, 0, 0, 0),
                duration: 45,
                status: 'live',
                meeting: {
                    joinUrl: '#'
                }
            }
        ],

        upcoming: [
            {
                _id: 'lesson-003',
                subject: 'English',
                title: 'Creative Writing',
                description: 'Learn how to create interesting characters and engaging stories.',
                teacher: 'Mrs. Achieng',
                scheduledAt: new Date(Date.now() + 86400000).setHours(9, 0, 0, 0),
                duration: 60,
                status: 'scheduled',
                meeting: {
                    joinUrl: '#'
                }
            },
            {
                _id: 'lesson-004',
                subject: 'Geography',
                title: 'Weather and Climate',
                description: 'Understanding weather patterns and the factors that influence climate.',
                teacher: 'Mr. Otieno',
                scheduledAt: new Date(Date.now() + 172800000).setHours(11, 0, 0, 0),
                duration: 45,
                status: 'scheduled',
                meeting: {
                    joinUrl: '#'
                }
            }
        ],

        completed: [
            {
                _id: 'lesson-005',
                subject: 'History',
                title: 'Early African Civilizations',
                description: 'A look at some of the major civilizations that developed in Africa.',
                teacher: 'Mr. Mwangi',
                scheduledAt: new Date(Date.now() - 86400000).setHours(10, 0, 0, 0),
                duration: 60,
                status: 'completed',
                meeting: {
                    joinUrl: '#'
                }
            }
        ]

    };


    // =====================================================
    // INITIALIZE
    // =====================================================

    function initializeOnlineLessons() {

        console.log('[ONLINE LESSONS] Initializing...');

        renderLessons(mockLessons);

        const refreshButton =
            document.getElementById('refresh-online-lessons');

        if (refreshButton) {

            refreshButton.addEventListener('click', function () {

                renderLessons(mockLessons);

                showOnlineLessonMessage(
                    'Lessons refreshed successfully.',
                    'success'
                );

            });

        }

    }


    // =====================================================
    // RENDER ALL LESSONS
    // =====================================================

    function renderLessons(data) {

        renderLessonGroup(
            'today-lessons-list',
            data.today,
            'today'
        );

        renderLessonGroup(
            'upcoming-lessons-list',
            data.upcoming,
            'upcoming'
        );

        renderLessonGroup(
            'completed-lessons-list',
            data.completed,
            'completed'
        );


        // Update statistics

        setText(
            'today-lessons-count',
            data.today?.length || 0
        );

        setText(
            'upcoming-lessons-count',
            data.upcoming?.length || 0
        );

        setText(
            'completed-lessons-count',
            data.completed?.length || 0
        );

    }


    // =====================================================
    // RENDER LESSON GROUP
    // =====================================================

    function renderLessonGroup(containerId, lessons, type) {

        const container =
            document.getElementById(containerId);

        if (!container) {
            console.warn(
                `[ONLINE LESSONS] Container not found: ${containerId}`
            );
            return;
        }


        // Clear existing content

        container.innerHTML = '';


        // Empty state

        if (!lessons || lessons.length === 0) {

            container.innerHTML = `
                <div class="online-lessons-empty">

                    <i class="bi bi-camera-video"></i>

                    <h4>No lessons found</h4>

                    <p>
                        There are no ${type} online lessons at the moment.
                    </p>

                </div>
            `;

            return;
        }


        // Render cards

        lessons.forEach(lesson => {

            container.appendChild(
                createLessonCard(lesson, type)
            );

        });

    }


    // =====================================================
    // CREATE LESSON CARD
    // =====================================================

    function createLessonCard(lesson, type) {

        const card = document.createElement('div');

        card.className = 'online-lesson-card';


        const scheduledDate =
            new Date(lesson.scheduledAt);


        const formattedDate =
            scheduledDate.toLocaleDateString(
                'en-KE',
                {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                }
            );


        const formattedTime =
            scheduledDate.toLocaleTimeString(
                'en-KE',
                {
                    hour: '2-digit',
                    minute: '2-digit'
                }
            );


        const status =
            lesson.status || 'scheduled';


        const statusText =
            status.charAt(0).toUpperCase() +
            status.slice(1);


        card.innerHTML = `

            <div class="online-lesson-card-top">

                <span class="lesson-subject">
                    ${escapeHtml(lesson.subject || 'Subject')}
                </span>

                <h4>
                    ${escapeHtml(lesson.title || 'Online Lesson')}
                </h4>

            </div>


            <div class="online-lesson-card-body">

                <p class="lesson-description">
                    ${escapeHtml(
                        lesson.description ||
                        'No description provided.'
                    )}
                </p>


                <div class="lesson-info">

                    <div class="lesson-info-item">

                        <i class="bi bi-person"></i>

                        <span>
                            ${escapeHtml(
                                lesson.teacher || 'Teacher'
                            )}
                        </span>

                    </div>


                    <div class="lesson-info-item">

                        <i class="bi bi-calendar3"></i>

                        <span>
                            ${formattedDate}
                        </span>

                    </div>


                    <div class="lesson-info-item">

                        <i class="bi bi-clock"></i>

                        <span>
                            ${formattedTime}
                            ·
                            ${lesson.duration || 0} minutes
                        </span>

                    </div>

                </div>


                <span class="lesson-status ${status}">

                    <i class="bi ${
                        status === 'live'
                            ? 'bi-broadcast'
                            : status === 'completed'
                                ? 'bi-check-circle'
                                : 'bi-clock'
                    }"></i>

                    ${statusText}

                </span>

            </div>


            <div class="online-lesson-card-footer">

                ${
                    status === 'live'
                        ? `
                            <button
                                type="button"
                                class="btn btn-danger join-lesson-btn"
                                data-lesson-id="${lesson._id}">
                                <i class="bi bi-camera-video-fill"></i>
                                Join Live
                            </button>
                        `
                        : status === 'scheduled'
                            ? `
                                <button
                                    type="button"
                                    class="btn btn-outline-primary lesson-details-btn"
                                    data-lesson-id="${lesson._id}">
                                    <i class="bi bi-eye"></i>
                                    View Details
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="btn btn-outline-secondary lesson-details-btn"
                                    data-lesson-id="${lesson._id}">
                                    <i class="bi bi-eye"></i>
                                    View Lesson
                                </button>
                            `
                }

            </div>

        `;


        // View details

        const detailsButton =
            card.querySelector('.lesson-details-btn');

        if (detailsButton) {

            detailsButton.addEventListener(
                'click',
                function () {

                    const lessonId =
                        this.dataset.lessonId;

                    handleLessonDetails(lessonId);

                }
            );

        }


        // Join lesson

        const joinButton =
            card.querySelector('.join-lesson-btn');

        if (joinButton) {

            joinButton.addEventListener(
                'click',
                function () {

                    const lessonId =
                        this.dataset.lessonId;

                    handleJoinLesson(lessonId);

                }
            );

        }


        return card;

    }


    // =====================================================
    // LESSON DETAILS
    // =====================================================

    function handleLessonDetails(lessonId) {

        console.log(
            '[ONLINE LESSONS] View lesson:',
            lessonId
        );


        const lesson = findLesson(lessonId);

        if (!lesson) {

            showOnlineLessonMessage(
                'Lesson could not be found.',
                'error'
            );

            return;
        }


        alert(
            `Lesson: ${lesson.title}\n\n` +
            `Subject: ${lesson.subject}\n` +
            `Teacher: ${lesson.teacher}\n` +
            `Duration: ${lesson.duration} minutes`
        );

    }


    // =====================================================
    // JOIN LESSON
    // =====================================================

    function handleJoinLesson(lessonId) {

        console.log(
            '[ONLINE LESSONS] Join lesson:',
            lessonId
        );


        const lesson = findLesson(lessonId);

        if (!lesson) {

            showOnlineLessonMessage(
                'Lesson could not be found.',
                'error'
            );

            return;
        }


        if (
            lesson.meeting &&
            lesson.meeting.joinUrl &&
            lesson.meeting.joinUrl !== '#'
        ) {

            window.open(
                lesson.meeting.joinUrl,
                '_blank'
            );

            return;

        }


        showOnlineLessonMessage(
            'The online meeting link is not available yet.',
            'error'
        );

    }


    // =====================================================
    // FIND LESSON
    // =====================================================

    function findLesson(lessonId) {

        const allLessons = [

            ...(mockLessons.today || []),

            ...(mockLessons.upcoming || []),

            ...(mockLessons.completed || [])

        ];


        return allLessons.find(
            lesson => lesson._id === lessonId
        );

    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showOnlineLessonMessage(message, type) {

        console.log(
            `[ONLINE LESSONS] ${type}: ${message}`
        );

        // Use the existing global message system
        if (typeof window.showMessage === 'function') {

            window.showMessage(
                message,
                type
            );

            return;
        }


        // Fallback

        alert(message);

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function setText(id, value) {

        const element =
            document.getElementById(id);

        if (element) {
            element.textContent = value;
        }

    }


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


    // =====================================================
    // MAKE FUNCTION AVAILABLE TO STUDENT.JS
    // =====================================================

    window.initializeOnlineLessons =
        initializeOnlineLessons;


    // =====================================================
    // DOM READY
    // =====================================================

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initializeOnlineLessons
        );

    } else {

        initializeOnlineLessons();

    }

})();
