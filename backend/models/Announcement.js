<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Announcements | Timiza EduAnalytics</title>

    <link rel="stylesheet" href="../css/announcement.css">

    <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
    >
</head>

<body>

    <div class="announcement-page">

        <!-- HEADER -->
        <header class="page-header">

            <div>
                <span class="page-eyebrow">
                    ADMINISTRATION
                </span>

                <h1>
                    <i class="fas fa-bullhorn"></i>
                    Announcements
                </h1>

                <p>
                    Create and manage important school announcements.
                </p>
            </div>

            <button
                type="button"
                id="createAnnouncementBtn"
                class="primary-btn"
            >
                <i class="fas fa-plus"></i>
                New Announcement
            </button>

        </header>


        <!-- STATISTICS -->
        <section class="stats-grid">

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-bullhorn"></i>
                </div>

                <div>
                    <span>Total Announcements</span>
                    <strong id="totalAnnouncements">0</strong>
                </div>
            </div>


            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-circle-check"></i>
                </div>

                <div>
                    <span>Active</span>
                    <strong id="activeAnnouncements">0</strong>
                </div>
            </div>


            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>

                <div>
                    <span>Scheduled</span>
                    <strong id="scheduledAnnouncements">0</strong>
                </div>
            </div>


            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-triangle-exclamation"></i>
                </div>

                <div>
                    <span>High Priority</span>
                    <strong id="highPriorityAnnouncements">0</strong>
                </div>
            </div>

        </section>


        <!-- ANNOUNCEMENTS -->
        <section class="announcement-card">

            <div class="section-header">

                <div>
                    <h2>
                        School Announcements
                    </h2>

                    <p>
                        Keep students, teachers and parents informed.
                    </p>
                </div>

            </div>


            <!-- FILTERS -->
            <div class="announcement-filters">

                <div class="search-box">

                    <i class="fas fa-search"></i>

                    <input
                        type="search"
                        id="announcementSearch"
                        placeholder="Search announcements..."
                    >

                </div>


                <select id="priorityFilter">

                    <option value="">
                        All Priorities
                    </option>

                    <option value="normal">
                        Normal
                    </option>

                    <option value="high">
                        High Priority
                    </option>

                </select>


                <select id="audienceFilter">

                    <option value="">
                        All Audiences
                    </option>

                    <option value="all">
                        Everyone
                    </option>

                    <option value="students">
                        Students
                    </option>

                    <option value="teachers">
                        Teachers
                    </option>

                    <option value="parents">
                        Parents
                    </option>

                </select>


                <select id="statusFilter">

                    <option value="">
                        All Status
                    </option>

                    <option value="active">
                        Active
                    </option>

                    <option value="scheduled">
                        Scheduled
                    </option>

                </select>

            </div>


            <!-- LIST -->
            <div id="announcementsList" class="announcements-list">

                <div class="loading-state">

                    <i class="fas fa-spinner fa-spin"></i>

                    Loading announcements...

                </div>

            </div>

        </section>

    </div>


    <!-- CREATE ANNOUNCEMENT MODAL -->
    <div
        id="announcementModal"
        class="modal"
        aria-hidden="true"
    >

        <div class="modal-overlay"></div>

        <div class="modal-content">

            <div class="modal-header">

                <div>
                    <h2>
                        <i class="fas fa-bullhorn"></i>
                        New Announcement
                    </h2>

                    <p>
                        Send an announcement to your school.
                    </p>
                </div>

                <button
                    type="button"
                    id="closeAnnouncementModal"
                    class="close-btn"
                >
                    <i class="fas fa-times"></i>
                </button>

            </div>


            <form id="announcementForm">

                <div
                    id="announcementFormMessage"
                    class="form-message"
                    hidden
                ></div>


                <div class="form-group">

                    <label for="announcementText">
                        Announcement
                        <span>*</span>
                    </label>

                    <textarea
                        id="announcementText"
                        name="text"
                        rows="7"
                        maxlength="1000"
                        placeholder="Write your announcement..."
                        required
                    ></textarea>

                    <div class="character-count">
                        <span id="characterCount">0</span>/1000
                    </div>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        id="cancelAnnouncementBtn"
                        class="secondary-btn"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        id="saveAnnouncementBtn"
                        class="primary-btn"
                    >
                        <i class="fas fa-paper-plane"></i>
                        Publish Announcement
                    </button>

                </div>

            </form>

        </div>

    </div>


    <!-- TOAST -->
    <div
        id="announcementToast"
        class="toast"
    ></div>


    <script src="../js/announcements.js"></script>

</body>
</html>
