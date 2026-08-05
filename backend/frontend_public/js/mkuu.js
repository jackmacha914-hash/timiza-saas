// Base URL of your deployed backend
const NEW_API_BASE = 'https://timiza-saas.onrender.com';

// Save the original fetch
const originalFetch = window.fetch;

// Override fetch globally
window.fetch = async (input, init = {}) => {
  if (typeof input === 'string') {
    // Replace old hardcoded domain with the new one
    input = input.replace(
      /https:\/\/school-management-system-av07\.onrender\.com/g,
      NEW_API_BASE
    );

    // Prepend base URL if it's a relative path starting with /api
    if (input.startsWith('/api')) {
      input = NEW_API_BASE + input;
    }
  }
  return originalFetch(input, init);
};

// Optional: intercept XMLHttpRequest too
(function(open) {
  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    if (typeof url === 'string') {
      url = url.replace(
        /https:\/\/school-management-system-av07\.onrender\.com/g,
        NEW_API_BASE
      );
      if (url.startsWith('/api')) {
        url = NEW_API_BASE + url;
      }
    }
    return open.call(this, method, url, async, user, password);
  };
})(XMLHttpRequest);

 <!-- Modal functions -->

        // Global variable to store the current user type for registration
        let currentUserType = '';
        
        // Function to populate classes with Kenyan education system data
        async function fetchAndPopulateClasses() {
            const classSelect = document.getElementById('student-class');
            if (!classSelect) {
                console.error('Class select element not found');
                return;
            }
            
            // Create the Kenyan education system structure
            const kenyanEducationSystem = {
                'Pre-Primary': [
                    { id: 'pp1', name: 'Pre-Primary 1 (PP1) - Age 4-5' },
                    { id: 'pp2', name: 'Pre-Primary 2 (PP2) - Age 5-6' }
                ],
                'Primary Education': [
                    { id: 'grade1', name: 'Grade 1 - Age 6-7' },
                    { id: 'grade2', name: 'Grade 2 - Age 7-8' },
                    { id: 'grade3', name: 'Grade 3 - Age 8-9' },
                    { id: 'grade4', name: 'Grade 4 - Age 9-10' },
                    { id: 'grade5', name: 'Grade 5 - Age 10-11' },
                    { id: 'grade6', name: 'Grade 6 - Age 11-12' },
                    { id: 'grade7', name: 'Grade 7 - Age 12-13' },
                    { id: 'grade8', name: 'Grade 8 - Age 13-14 (KCPE)' }
                ],
                'Secondary Education': [
                    { id: 'form1', name: 'Form 1 - Age 14-15' },
                    { id: 'form2', name: 'Form 2 - Age 15-16' },
                    { id: 'form3', name: 'Form 3 - Age 16-17' },
                    { id: 'form4', name: 'Form 4 - Age 17-18 (KCSE)' }
                ],
                'Tertiary/College': [
                    { id: 'college1', name: 'Year 1 - Certificate/Diploma' },
                    { id: 'college2', name: 'Year 2 - Certificate/Diploma' },
                    { id: 'college3', name: 'Year 3 - Diploma/Degree' },
                    { id: 'college4', name: 'Year 4 - Degree' }
                ]
            };

            // Clear existing options
            classSelect.innerHTML = '<option value="">Select Class</option>';
            
            // Add Kenyan education system structure to the dropdown
            for (const [groupName, classes] of Object.entries(kenyanEducationSystem)) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                
                classes.forEach(cls => {
                    const option = document.createElement('option');
                    option.value = cls.id;
                    option.textContent = cls.name;
                    optgroup.appendChild(option);
                });
                
                classSelect.appendChild(optgroup);
            }
            
            console.log('Successfully populated classes dropdown with Kenyan education system');
        }
        
        function openRegistrationModal(userType) {
            try {
                console.log('Opening registration modal for:', userType);
                
                const modal = document.getElementById('registrationModal');
                const modalTitle = document.getElementById('modal-title');
                const teacherFields = document.getElementById('teacher-fields');
                const classSelection = document.getElementById('class-selection');
                const registrationForm = document.getElementById('registration-form');
                
                // Debug log elements
                console.log('Modal element:', modal);
                console.log('Modal title:', modalTitle);
                console.log('Teacher fields:', teacherFields);
                console.log('Class selection:', classSelection);
                console.log('Registration form:', registrationForm);
                
                if (!modal || !modalTitle || !teacherFields || !classSelection || !registrationForm) {
                    throw new Error('One or more required elements not found');
                }
                
                // Ensure modal is in the document flow and visible
                modal.style.display = 'block';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100%';
                modal.style.height = '100%';
                modal.style.overflow = 'auto';
                
                // Ensure modal content is properly positioned
                const content = modal.querySelector('.modal-content');
                if (content) {
                    content.style.margin = '50px auto';
                    content.style.position = 'relative';
                }
                
                // Store current user type
                currentUserType = userType;
                
                // Reset form
                registrationForm.reset();
                
                // Update modal title based on user type
                const title = userType === 'teacher' ? 'Teacher Registration' : 'Student Registration';
                modalTitle.textContent = title;
                
                // Show/hide fields based on user type
                const studentClassSelect = document.getElementById('student-class');
                if (userType === 'teacher') {
                    teacherFields.style.display = 'block';
                    classSelection.style.display = 'none';
                    // Remove required attribute for teacher registration
                    if (studentClassSelect) {
                        studentClassSelect.removeAttribute('required');
                    }
                } else {
                    teacherFields.style.display = 'none';
                    classSelection.style.display = 'block';
                    // Add required attribute for student registration
                    if (studentClassSelect) {
                        studentClassSelect.setAttribute('required', 'required');
                    }
                    // Fetch and populate classes for students
                    fetchAndPopulateClasses();
                }
                
                // Force reflow/repaint to ensure styles are applied
                void modal.offsetHeight;
                
                // Add show class with a small delay to allow for transition
                setTimeout(() => {
                    modal.classList.add('show');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
                    
                    // Force focus to the modal for better accessibility
                    modal.setAttribute('aria-hidden', 'false');
                    modal.focus();
                    
                    console.log('Modal should be visible now');
                }, 50);
                
            } catch (error) {
                console.error('Error in openRegistrationModal:', error);
                alert('Error opening registration form: ' + error.message);
            }
        }

        function closeRegistrationModal() {
            const modal = document.getElementById('registrationModal');
            if (!modal) return;
            
            // Remove show class to trigger fade out
            modal.classList.remove('show');
            document.body.style.overflow = ''; // Re-enable scrolling
            
            // Wait for the transition to complete before hiding completely
            setTimeout(() => {
                if (modal) {
                    modal.style.display = 'none';
                }
            }, 300);
        }

        // Validate password match
        function validatePasswords() {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorElement = document.getElementById('password-match-error');
            
            if (password !== confirmPassword) {
                errorElement.style.display = 'block';
                return false;
            }
            errorElement.style.display = 'none';
            return true;
        }
        
        // Add password visibility toggle functionality
        function setupPasswordToggles() {
            document.querySelectorAll('.toggle-password').forEach(button => {
                button.addEventListener('click', function() {
                    const input = this.previousElementSibling;
                    const icon = this.querySelector('i');
                    
                    // Toggle input type
                    const type = input.type === 'password' ? 'text' : 'password';
                    input.type = type;
                    
                    // Toggle icon
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                    
                    // Update button's aria-label
                    const action = type === 'password' ? 'Show' : 'Hide';
                    this.setAttribute('aria-label', `${action} password`);
                });
            });
        }
        
        // Add password validation on input
        document.addEventListener('DOMContentLoaded', () => {
            // Setup password validation
            const passwordFields = document.querySelectorAll('#password, #confirm-password');
            passwordFields.forEach(field => {
                field.addEventListener('input', validatePasswords);
            });
            
            // Setup password toggles
            setupPasswordToggles();
        });
        
        // Handle registration form submission
        async function handleRegistrationSubmit(event) {
            event.preventDefault();
            
            const form = event.target;
            const formData = new FormData(form);
            const submitButton = form.querySelector('button[type="submit"]');
            const submitButtonText = submitButton.textContent;
            
            try {
                // Get form data
                const password = formData.get('password');
                const confirmPassword = formData.get('confirmPassword');
                const name = formData.get('name');
                const email = formData.get('email');
                
                // Basic validation
                if (!name || !email || !password || !confirmPassword) {
                    throw new Error('All fields are required');
                }
                
                // Validate email format
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    throw new Error('Please enter a valid email address');
                }
                
                // Validate password length
                if (password.length < 6) {
                    throw new Error('Password must be at least 6 characters long');
                }
                
                // Validate passwords match
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match');
                }
                
                // Disable submit button and show loading state
                submitButton.disabled = true;
                submitButton.textContent = 'Processing...';
                
                // Get the class value first (for students)
                let studentClass = '';
                let displayClass = '';
                if (currentUserType === 'student') {
                    const classSelect = document.getElementById('student-class');
                    studentClass = classSelect ? classSelect.value : '';
                    
                    console.log('Form data - studentClass:', studentClass, 'from select element');
                    
                    if (!studentClass) {
                        throw new Error('Please select a class for the student');
                    }
                    
                    // Get the display text of the selected option
                    if (classSelect) {
                        const selectedOption = classSelect.options[classSelect.selectedIndex];
                        displayClass = selectedOption.text.split(' - ')[0].trim();
                        console.log('Formatted class:', displayClass);
                    }
                }
                
                // Prepare user data in the format expected by the backend
                const userData = {
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                    role: currentUserType,
                    // Set class at root level for students using the display value
                    ...(currentUserType === 'student' && { class: displayClass || studentClass }),
                    // Include all other fields in the profile object
                    profile: {
                        dob: formData.get('dob'),
                        gender: formData.get('gender'),
                        phone: formData.get('phone'),
                        address: formData.get('address'),
                        bloodGroup: formData.get('blood-group'),
                        emergencyContact: {
                            name: formData.get('emergencyContactName'),
                            phone: formData.get('emergencyContactPhone'),
                            relationship: formData.get('emergencyContactRelationship')
                        },
                        specialization: formData.get('specialization') || undefined,
                        // Set class in profile as well using the display value
                        ...(currentUserType === 'student' && { class: displayClass || studentClass })
                    }
                };
                
                console.log('User data being sent to backend:', JSON.stringify({
                    ...userData,
                    password: '***' // Don't log the actual password
                }, null, 2));
                
                const response = await fetch('https://school-management-system-av07.onrender.com/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(userData)
                });
                
                const data = await response.json();
                console.log('Registration response:', data);
                
                if (!response.ok) {
                    // Handle validation errors
                    if (data.errors && Array.isArray(data.errors)) {
                        const errorMessages = data.errors.map(err => err.msg || err.message).join('\n');
                        throw new Error(errorMessages || 'Validation failed');
                    }
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Show success message
                alert(`${currentUserType === 'teacher' ? 'Teacher' : 'Student'} registered successfully!`);
                
                // Close modal
                closeRegistrationModal();
                
                // Refresh the appropriate list
                if (currentUserType === 'teacher') {
                    loadTeachers();
                } else {
                    loadStudents();
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert(`Error: ${error.message || 'Failed to register. Please try again.'}`);
            } finally {
                // Re-enable submit button
                submitButton.disabled = false;
                submitButton.textContent = submitButtonText;
            }
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            var modal = document.getElementById('registrationModal');
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        }
    

    <!-- Add the registration form submit event listener -->
  
        document.addEventListener('DOMContentLoaded', () => {
            const registrationForm = document.getElementById('registration-form');
            if (registrationForm) {
                registrationForm.addEventListener('submit', handleRegistrationSubmit);
            }
        });

        // Sidebar Toggle Functionality
        document.addEventListener('DOMContentLoaded', function() {
            const sidebar = document.querySelector('.sidebar');
            const sidebarToggle = document.querySelector('.sidebar-toggle');
          console.log("Sidebar:", sidebar);
console.log("Toggle:", sidebarToggle);
            const tabLinks = document.querySelectorAll('.tab-link');
            const tabSections = document.querySelectorAll('.tab-section');
            
            // Toggle sidebar on mobile
            if (sidebarToggle) {
                sidebarToggle.addEventListener('click', function() {
                    sidebar.classList.toggle("open");
                    document.body.classList.toggle('sidebar-active');
                });
            }
            
            // Tab switching functionality
            tabLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetTab = this.getAttribute('data-tab');
                    
                    // Update active tab
                    tabLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show target section
                    tabSections.forEach(section => {
                        section.style.display = 'none';
                    });
                    
                    const targetSection = document.getElementById(targetTab);
                    if (targetSection) {
                        targetSection.style.display = 'block';
                    }
                });
            });
            
            // Initialize first tab as active
            if (tabLinks.length > 0) {
                const firstTab = document.querySelector('.tab-link.active') || tabLinks[0];
                firstTab.click();
            }
            
            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', function(e) {
                if (window.innerWidth < 1024 && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
                    sidebar.classList.remove('active');
                    document.body.classList.remove('sidebar-active');
                }
            });
            
            // Initialize charts if needed
            initializeCharts();
        });
        
        // Initialize sample charts
        function initializeCharts() {
            // Sample chart initialization - you can customize this based on your needs
            const ctx = document.getElementById('attendanceChart');
            if (ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Attendance Rate',
                            data: [85, 88, 92, 90, 94, 95],
                            borderColor: 'rgba(79, 70, 229, 1)',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            tension: 0.3,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: false,
                                min: 80,
                                max: 100
                            }
                        }
                    }
                });
            }
        }
        
        // Sample function to show notification
        function showNotification(message, type = 'info') {
            const container = document.getElementById('notification-container');
            if (!container) return;
            
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            container.appendChild(notification);
            
            // Auto-remove notification after 5 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }, 5000);
        }

         // Tab switching
        function showTab(tabId) {
            // Hide all tab sections
            document.querySelectorAll('.tab-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected tab section
            const tabSection = document.getElementById(tabId + '-section');
            if (tabSection) {
                tabSection.style.display = 'block';
                
                // Initialize accountant fees when the accountant tab is shown
                if (tabId === 'accountant' && typeof AccountantFees === 'function' && !window.accountantFeesInitialized) {
                    try {
                        window.accountantFees = new AccountantFees();
                        window.accountantFeesInitialized = true;
                        console.log('AccountantFees initialized');
                    } catch (error) {
                        console.error('Error initializing AccountantFees:', error);
                    }
                }
            }
        }

        // Load data when registration section is shown
        document.addEventListener('DOMContentLoaded', () => {
            const registrationSection = document.getElementById('registration-section');
            if (registrationSection) {
                loadStudents();
                loadTeachers();
            }
        });

        // Load students data
        async function loadStudents() {
            const studentsList = document.getElementById('students-list');
            if (!studentsList) return;

            try {
                const response = await fetch('https://timiza-saas.onrender.com/api/students');
                const data = await response.json();
                
                if (!data || !Array.isArray(data.students)) {
                    studentsList.innerHTML = '<p>No students found</p>';
                    return;
                }

                const students = data.students;
                
                // Create HTML for students
                let html = students.map(student => {
                    // Get class from various possible locations in the student object
                    const studentClass = student.class || student.classAssigned || (student.profile && student.profile.class) || 'Not assigned';
                    
                    return `
                    <div class="student-item">
                        <h4>${student.name}</h4>
                        <p>Email: ${student.email}</p>
                        <p>Class: ${studentClass}</p>
                        <div class="action-buttons">
                            <button onclick="editStudent('${student._id}')">Edit</button>
                            <button onclick="deleteStudent('${student._id}')">Delete</button>
                        </div>
                    </div>
                    `;
                }).join('');

                studentsList.innerHTML = html;
            } catch (error) {
                console.error('Error loading students:', error);
                studentsList.innerHTML = '<p>Error loading students data</p>';
            }
        }

        // Load teachers data
        async function loadTeachers() {
            const teachersList = document.getElementById('teachers-list');
            if (!teachersList) {
                console.error('Teachers list element not found');
                return;
            }

            try {
                const response = await fetch('https://timiza-saas.onrender.com/api/students/teachers');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // Handle both array and object responses
                const teachers = Array.isArray(data) ? data : (data.teachers || []);
                
                if (Array.isArray(teachers) && teachers.length > 0) {
                    teachersList.innerHTML = teachers.map(teacher => `
                        <div class="teacher-item">
                            <h3>${teacher.name || 'No Name'}</h3>
                            <p>Email: ${teacher.email || 'No Email'}</p>
                            <div class="action-buttons">
                                <button onclick="editTeacher('${teacher._id || teacher.id || ''}')">Edit</button>
                                <button onclick="deleteTeacher('${teacher._id || teacher.id || ''}')">Delete</button>
                            </div>
                        </div>
                    `).join('');
                } else {
                    console.log('No teachers data available');
                    teachersList.innerHTML = '<p>No teachers found</p>';
                }
            } catch (error) {
                console.error('Error loading teachers:', error);
                teachersList.innerHTML = '<p>Error loading teachers data</p>';
            }
        }

        // Edit functions (to be implemented)
        function editStudent(studentId) {
            console.log('Edit student:', studentId);
        }

        function editTeacher(teacherId) {
            console.log('Edit teacher:', teacherId);
        }

        // Delete functions (to be implemented)
        function deleteStudent(studentId) {
            if (confirm('Are you sure you want to delete this student?')) {
                fetch(`https://timiza-saas.onrender.com/api/students/${studentId}`, {
                    method: 'DELETE'
                })
                .then(() => loadStudents())
                .catch(error => console.error('Error deleting student:', error));
            }
        }

        function deleteTeacher(teacherId) {
            if (confirm('Are you sure you want to delete this teacher?')) {
                fetch(`https://timiza-saas.onrender.com/api/students/${teacherId}`, {
                    method: 'DELETE'
                })
                .then(() => loadTeachers())
                .catch(error => console.error('Error deleting teacher:', error));
            }
        }

        // Load profile data
        async function loadProfile() {
            try {
                const response = await fetch('https://timiza-saas.onrender.com/api/students/profile');
                const profileData = await response.json();
                
                if (profileData && profileData.name) {
                    const profileInfo = document.getElementById('profile-info');
                    profileInfo.innerHTML = `
                        <div class="profile-details">
                            <p><strong>Name:</strong> ${profileData.name}</p>
                            <p><strong>Email:</strong> ${profileData.email}</p>
                            <p><strong>Role:</strong> ${profileData.role}</p>
                            ${profileData.class ? `<p><strong>Class:</strong> ${profileData.class}</p>` : ''}
                            <p><strong>Phone:</strong> ${profileData.phone || 'Not provided'}</p>
                        </div>
                    `;
                } else {
                    console.error('Invalid profile data:', profileData);
                    document.getElementById('profile-info').innerHTML = '<p>Error loading profile</p>';
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                document.getElementById('profile-info').innerHTML = '<p>Error loading profile</p>';
            }
        }

        // Show message helper function
        function showMessage(message, type = 'info') {
            const messageElement = document.createElement('div');
            messageElement.className = `alert alert-${type}`;
            messageElement.textContent = message;
            
            // Style the message
            messageElement.style.padding = '10px';
            messageElement.style.margin = '10px 0';
            messageElement.style.borderRadius = '4px';
            messageElement.style.fontSize = '14px';
            
            if (type === 'error') {
                messageElement.style.backgroundColor = '#ffebee';
                messageElement.style.color = '#c62828';
                messageElement.style.border = '1px solid #ffcdd2';
            } else if (type === 'success') {
                messageElement.style.backgroundColor = '#e8f5e9';
                messageElement.style.color = '#2e7d32';
                messageElement.style.border = '1px solid #c8e6c9';
            } else {
                messageElement.style.backgroundColor = '#e3f2fd';
                messageElement.style.color = '#1565c0';
                messageElement.style.border = '1px solid #bbdefb';
            }
            
            // Find or create message container
            let messageContainer = document.getElementById('password-message-container');
            if (!messageContainer) {
                messageContainer = document.createElement('div');
                messageContainer.id = 'password-message-container';
                const form = document.getElementById('change-password-form');
                if (form) {
                    form.insertBefore(messageContainer, form.firstChild);
                }
            }
            
            // Clear existing messages and add new one
            messageContainer.innerHTML = '';
            messageContainer.appendChild(messageElement);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                messageElement.style.opacity = '0';
                messageElement.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 500);
            }, 5000);
        }

        // Toggle password change form visibility
        document.getElementById('toggle-password-btn').addEventListener('click', function() {
            const changePasswordSection = document.querySelector('.change-password-section');
            changePasswordSection.style.display = changePasswordSection.style.display === 'none' ? 'block' : 'none';
            
            // Clear any existing messages when toggling
            const messageContainer = document.getElementById('password-message-container');
            if (messageContainer) {
                messageContainer.innerHTML = '';
            }
        });

    // Add event listener for password change form
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const submitBtn = document.getElementById('change-password-submit');
            const errorElement = document.getElementById('password-change-error');
            const successElement = document.getElementById('password-change-success');

            // Reset messages
            if (errorElement) errorElement.style.display = 'none';
            if (successElement) successElement.style.display = 'none';

            // Validate inputs
            if (!currentPassword || !newPassword || !confirmPassword) {
                showMessage('All fields are required', 'error');
                return;
            }

            // Validate password match
            if (newPassword !== confirmPassword) {
                showMessage('New password and confirm password do not match', 'error');
                return;
            }

            // Validate password strength
            if (newPassword.length < 8) {
                showMessage('Password must be at least 8 characters long', 'error');
                return;
            }

            try {
                // Disable submit button to prevent multiple submissions
                if (submitBtn) submitBtn.disabled = true;

                const response = await fetch('https://timiza-saas.onrender.com/api/students/change-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword: newPassword
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message
                    showMessage('Password changed successfully!', 'success');
                    
                    // Reset form and hide it after a delay
                    changePasswordForm.reset();
                    setTimeout(() => {
                        const changePasswordSection = document.querySelector('.change-password-section');
                        if (changePasswordSection) {
                            changePasswordSection.style.display = 'none';
                        }
                        // Clear success message after hiding the form
                        if (successElement) successElement.style.display = 'none';
                    }, 2000);
                } else {
                    // Show error message from server or default message
                    const errorMsg = data.error || data.message || 'Failed to change password';
                    showMessage(errorMsg, 'error');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                showMessage('An error occurred while changing password. Please try again.', 'error');
            } finally {
                // Re-enable submit button
                if (submitBtn) submitBtn.disabled = false;
            }

        // Function to load today's attendance - now in global scope
        window.loadTodaysAttendance = async function() {
            console.log('Loading today\'s attendance data...');
            try {
                // Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];
                console.log('Fetching attendance for date:', today);
                
                // Fetch attendance data for today

                const response = await fetch(`https://timiza-saas.onrender.com/api/attendance/history?start=${today}&end=${today}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    throw new Error(`Failed to fetch attendance data: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('Raw attendance data received:', data);
                
                // Calculate present and absent counts
                let presentCount = 0;
                let absentCount = 0;
                
                if (Array.isArray(data)) {
                    console.log(`Processing ${data.length} attendance records`);
                    
                    data.forEach((record, index) => {
                        console.log(`Record ${index + 1}:`, record);
                        
                        if (record && typeof record === 'object' && record.records && Array.isArray(record.records)) {
                            console.log(`  Found ${record.records.length} student records`);
                            
                            record.records.forEach((student, studentIndex) => {
                                console.log(`    Student ${studentIndex + 1}:`, student);
                                
                                if (student && typeof student === 'object' && student.status) {
                                    if (student.status === 'present' || student.status === 'late') {
                                        presentCount++;
                                        console.log(`    ✅ Marked as present`);
                                    } else if (student.status === 'absent') {
                                        absentCount++;
                                        console.log(`    ❌ Marked as absent`);
                                    } else {
                                        console.log(`    ⚠️ Unknown status: ${student.status}`);
                                    }
                                } else {
                                    console.log('    ⚠️ Invalid student record format:', student);
                                }
                            });
                        } else {
                            console.log('  ⚠️ Record is missing records array or invalid format:', record);
                        }
                    });
                    
                    if (data.length === 0) {
                        console.log('No attendance records found for today');
                    }
                } else {
                    console.warn('Expected array data but received:', typeof data, data);
                }
                
                console.log('Present count:', presentCount, 'Absent count:', absentCount);
                
                // Update the UI
                const presentElement = document.getElementById('today-present');
                const absentElement = document.getElementById('today-absent');
                
                if (presentElement) {
                    presentElement.textContent = presentCount;
                } else {
                    console.error('Element with ID "today-present" not found');
                }
                
                if (absentElement) {
                    absentElement.textContent = absentCount;
                } else {
                    console.error('Element with ID "today-absent" not found');
                }
                
                // Update the date display
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const todayFormatted = new Date().toLocaleDateString(undefined, options);
                const dateElement = document.getElementById('attendance-date');
                
                if (dateElement) {
                    dateElement.textContent = `As of ${todayFormatted}`;
                } else {
                    console.error('Element with ID "attendance-date" not found');
                }
                
            } catch (error) {
                console.error('Error loading attendance data:', error);
                const dateElement = document.getElementById('attendance-date');
                if (dateElement) {
                    dateElement.textContent = 'Error loading attendance data';
                }
            }
        };
        
        // Load profile data when the page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM fully loaded');
            loadProfile();
            console.log('Profile loaded, now loading attendance...');
            try {
                loadTodaysAttendance(); // Load today's attendance data
            } catch (error) {
                console.error('Error in loadTodaysAttendance:', error);
                const dateElement = document.getElementById('attendance-date');
                if (dateElement) {
                    dateElement.textContent = 'Error loading attendance';
                }
            }
            console.log('Attendance load attempt completed');
        });
        
        // Also try to run it after a short delay in case the DOMContentLoaded event is missed
        setTimeout(() => {
            console.log('Running delayed attendance check...');
            if (document.readyState === 'complete') {
                try {
                    loadTodaysAttendance();
                } catch (error) {
                    console.error('Error in delayed loadTodaysAttendance:', error);
                }
            }
        }, 1000);
        
        // Test function that can be called from console
        window.testAttendance = async function() {
            console.log('=== Testing Attendance Loading ===');
            console.log('1. Checking if function exists:', typeof loadTodaysAttendance === 'function');
            console.log('2. Checking if elements exist:', {
                'today-present': document.getElementById('today-present') ? 'Found' : 'Not found',
                'today-absent': document.getElementById('today-absent') ? 'Found' : 'Not found',
                'attendance-date': document.getElementById('attendance-date') ? 'Found' : 'Not found'
            });
            
            // Test direct API call
            console.log('3. Testing API endpoint...');
            try {
                const today = new Date().toISOString().split('T')[0];
                const token = localStorage.getItem('token');
                console.log('   - Using token:', token ? 'Found' : 'Not found');
                console.log('   - Testing endpoint: /api/attendance/history');
                

                const response = await fetch(`https://timiza-saas.onrender.com/api/attendance/history?start=${today}&end=${today}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('   - Response status:', response.status);
                const data = await response.json().catch(e => {
                    console.error('   - Error parsing JSON:', e);
                    return { error: 'Invalid JSON response' };
                });
                
                console.log('   - Response data:', data);
                console.log('4. API test completed');
                
                // If API works, try the function
                console.log('5. Testing function call...');
                try {
                    loadTodaysAttendance();
                    console.log('6. Function called successfully');
                } catch (e) {
                    console.error('6. Error calling function:', e);
                }
                
            } catch (error) {
                console.error('   - API test failed:', error);
            }
        };

        // Move loadTodaysAttendance to global scope
        window.loadTodaysAttendance = loadTodaysAttendance;
        console.log('loadTodaysAttendance function defined in global scope');

        // Test function with sample data
        const testWithSampleData = async function() {
            console.log('=== Testing with Sample Data ===');
            
            // Sample data that matches the expected format
            const sampleData = [
                {
                    date: new Date().toISOString().split('T')[0],
                    records: [
                        { studentId: '1', status: 'present' },
                        { studentId: '2', status: 'present' },
                        { studentId: '3', status: 'absent' },
                        { studentId: '4', status: 'present' },
                        { studentId: '5', status: 'absent' }
                    ]
                }
            ];
            
            // Save original fetch
            const originalFetch = window.fetch;
            
            // Mock the fetch function
            window.fetch = function() {
                console.log('Mock fetch called with sample data');
                return Promise.resolve({
                    ok: true,
                    json: function() {
                        return Promise.resolve(sampleData);
                    }
                });
            };
            
            try {
                // Call the function with mock data
                console.log('Calling loadTodaysAttendance with sample data...');
                await loadTodaysAttendance();
                console.log('Sample data test completed');
                
                // Manually update the UI to show test data
                document.getElementById('today-present').textContent = '3';
                document.getElementById('today-absent').textContent = '2';
                document.getElementById('attendance-date').textContent = 'As of ' + new Date().toLocaleDateString();
                
            } catch (error) {
                console.error('Error in sample data test:', error);
            } finally {
                // Restore original fetch
                window.fetch = originalFetch;
            }
        };
        
        // Handle form submission

        // Handle form submission
        document.getElementById('registration-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const userType = document.getElementById('modal-title').textContent.includes('Teacher') ? 'teacher' : 'student';
            const formData = new FormData(this);
            
            // Add user type to form data
            formData.append('userType', userType);
            
            try {
                // Convert FormData to object
                const userData = Object.fromEntries(formData);
                
                // Validate required fields
                if (!userData.name || !userData.email || !userData.phone) {
                    throw new Error('Please fill in all required fields: name, email, and phone');
                }

                // Log the data being sent
                console.log('Sending registration data:', userData);

                // Use the correct registration endpoint

                const response = await fetch('https://timiza-saas.onrender.com/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();
                
                if (response.status === 200) {
                    // Registration successful, close modal and refresh data
                    closeRegistrationModal();
                    loadDashboardData();
                    alert('Registration successful!');
                } else {
                    throw new Error(result.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || 'Registration failed. Please try again.');
            } finally {
                // Re-enable the submit button
                const submitBtn = e.target.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                }
            }

        // Update fields based on role selection
        function updateFields() {
            const roleSelect = document.getElementById('role-select');
            const teacherFields = document.getElementById('teacher-fields');
            
            if (roleSelect && teacherFields) {
                teacherFields.style.display = roleSelect.value === 'teacher' ? 'block' : 'none';
            }
        }

        // Add event listener for role selection
        const roleSelect = document.getElementById('role-select');
        if (roleSelect) {
            roleSelect.addEventListener('change', updateFields);
            updateFields();
        }              
    
    
    <!-- Test script to verify loading -->

        console.log('Test script running');
        
        // Wait for the page to fully load
        window.addEventListener('load', function() {
            console.log('Page fully loaded');
            
            // Check if our script is loaded
            if (window.initializeAccountantPage) {
                console.log('Accountant script is loaded');
            } else {
                console.error('Accountant script is NOT loaded');
            }
            
            // Check if the class select element exists
            const classSelect = document.getElementById('fee-class-name');
            if (classSelect) {
                console.log('Class select element found:', classSelect);
                
                // Try to load classes directly
                console.log('Attempting to load classes...');
                loadClasses();
            } else {
                console.error('Class select element NOT found');
            }
        });

        // Broadcast Communication Functionality
        document.getElementById('broadcast-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const target = document.getElementById('broadcast-target').value;
            const title = document.getElementById('broadcast-title').value;
            const message = document.getElementById('broadcast-message').value;
            const logList = document.getElementById('broadcast-log-list');
            const li = document.createElement('li');
            li.innerHTML = `<strong>${title}</strong> [${target}] - ${message}`;
            logList.appendChild(li);
            alert("Broadcast sent successfully!");
            this.reset();
        });

        // Entities Management Functionality
        document.getElementById('add-class-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const className = document.getElementById('class-name').value;
            const classTeacher = document.getElementById('class-teacher').value;
            const li = document.createElement('li');
            li.innerHTML = `<strong>${className}</strong> - Assigned Teacher: ${classTeacher}`;
            document.getElementById('class-list').appendChild(li);
            alert("Class added successfully!");
            this.reset();
        });

        document.getElementById('add-subject-form').addEventListener('submit', function (e) {
            e.preventDefault();
            const subjectName = document.getElementById('subject-name').value;
            const subjectCode = document.getElementById('subject-code').value;
            const li = document.createElement('li');
            li.innerHTML = `<strong>${subjectName}</strong> (Code: ${subjectCode})`;
            document.getElementById('subject-list').appendChild(li);
            alert("Subject added successfully!");
            this.reset();
        });

        // Show/hide extra fields based on role
        document.addEventListener('DOMContentLoaded', function() {
            const roleSelect = document.getElementById('user-role');
            const subjectInput = document.getElementById('user-subject');
            const classInput = document.getElementById('user-class');
            function updateFields() {
                const role = roleSelect.value;
                subjectInput.style.display = (role === 'Teacher') ? '' : 'none';
                classInput.style.display = (role === 'Student') ? '' : 'none';
            }
            roleSelect.addEventListener('change', updateFields);
            updateFields();
        });

          <!-- API Configuration -->
    window.API_CONFIG = { 
        BASE_URL: 'https://timiza-saas.onrender.com',
        API_BASE_URL: 'https://timiza-saas.onrender.com/api',
        AUTH_URL: 'https://timiza-saas.onrender.com/api/auth',
        STUDENTS_URL: 'https://timiza-saas.onrender.com/api/students',
        TEACHERS_URL: 'https://timiza-saas.onrender.com/api/teachers',
        ATTENDANCE_URL: 'https://timiza-saas.onrender.com/api/attendance',
        FEES_URL: 'https://timiza-saas.onrender.com/api/fees',
        PAYMENTS_URL: 'https://timiza-saas.onrender.com/api/payments',
        CLASSES_URL: 'https://timiza-saas.onrender.com/api/classes',
        CLUBS_URL: 'https://timiza-saas.onrender.com/api/clubs',
        BOOKS_URL: 'https://timiza-saas.onrender.com/api/books'
    };
    
     <!-- Global Attendance Function -->
  
    // Define the function in the global scope
    window.loadTodaysAttendance = async function() {
        console.log('Global loadTodaysAttendance function called');
        try {
            // Get date range (today and past 6 days)
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 6); // 6 days ago + today = 7 days total
            
            const formatDate = (date) => date.toISOString().split('T')[0];
            const todayStr = formatDate(today);
            const sevenDaysAgoStr = formatDate(sevenDaysAgo);
            
            console.log(`Fetching attendance from ${sevenDaysAgoStr} to ${todayStr}`);
            
            // Get user data from localStorage
            const userData = JSON.parse(localStorage.getItem('userData')) || {};
            console.log('User role:', userData.role);
            
            // If not admin, try to get the user's class
            if (userData.role !== 'admin') {
                let userClass = '';
                const possibleClassPaths = [
                    userData.class,
                    userData.profile?.class,
                    userData.user?.class,
                    userData.user?.profile?.class
                ];
                
                // Find the first non-empty class value
                userClass = possibleClassPaths.find(c => c) || '';
                
                if (!userClass) {
                    console.error('User class not found in user data');
                    document.getElementById('attendance-date').textContent = 'Error: Class not found for your account';
                    return;
                }
                
                console.log('Using class for attendance:', userClass);

                const url = `https://timiza-saas.onrender.com/api/attendance/history?class=${encodeURIComponent(userClass)}&start=${sevenDaysAgoStr}&end=${todayStr}`;
await fetchAndDisplayAttendance(url);
} else {
    console.log('Admin user - fetching all classes first');
    // First, get the list of all classes
    const classesResponse = await fetch('https://timiza-saas.onrender.com/api/classes', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

                
                if (!classesResponse.ok) {
                    throw new Error(`Failed to fetch classes: ${classesResponse.status} ${classesResponse.statusText}`);
                }
                
                const classes = await classesResponse.json();
                console.log('Available classes:', classes);
                
                if (!Array.isArray(classes) || classes.length === 0) {
                    throw new Error('No classes found');
                }
                
                // Fetch attendance for each class and combine results
                let allAttendance = [];
                // Add standard grade classes if not present
                const standardClasses = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
                
                // Combine existing classes with standard grade classes
                const allClasses = [...new Set([
                    ...classes.map(c => c.name || c._id),
                    ...standardClasses
                ])];
                
                for (const className of allClasses) {
                    console.log(`Fetching attendance for class: ${className}`);
                    
                    try {
                        // Try with the exact class name first
                        let classResponse = await fetch(`https://timiza-saas.onrender.com/api/attendance/history?class=${encodeURIComponent(className)}&start=${sevenDaysAgoStr}&end=${todayStr}`, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});

                        
                        if (classResponse.ok) {
                            const classData = await classResponse.json();
                            console.log(`Attendance for ${className}:`, classData);
                            if (Array.isArray(classData)) {
                                allAttendance = allAttendance.concat(classData);
                            }
                        } else {
                            console.error(`Failed to fetch attendance for class ${className}:`, classResponse.status);
                        }
                    } catch (error) {
                        console.error(`Error fetching attendance for class ${className}:`, error);
                    }
                }
                
                console.log('All attendance data:', allAttendance);
                
                // If no attendance found, try with a wider date range (last 30 days)
                if (allAttendance.length === 0) {
                    console.log('No recent attendance found. Trying a wider date range (last 30 days)...');
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    const thirtyDaysAgoStr = formatDate(thirtyDaysAgo);
                    
                    for (const className of allClasses) {
                        try {

                            const response = await fetch(`https://timiza-saas.onrender.com/api/attendance/history?class=${encodeURIComponent(className)}&start=${thirtyDaysAgoStr}&end=${todayStr}`, {
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                if (Array.isArray(data) && data.length > 0) {
                                    allAttendance = allAttendance.concat(data);
                                    console.log(`Found ${data.length} attendance records for ${className}`);
                                }
                            }
                        } catch (error) {
                            console.error(`Error fetching attendance for ${className}:`, error);
                        }
                    }
                }
                
                if (allAttendance.length > 0) {
                    console.log(`Found a total of ${allAttendance.length} attendance records`);
                    processAttendanceData(allAttendance, true);
                } else {
                    console.log('No attendance records found in the past 30 days');
                    document.getElementById('today-present').textContent = '0';
                    document.getElementById('today-absent').textContent = '0';
                    document.getElementById('attendance-date').textContent = 'No attendance records found';
                }
                return;
            }
            
            // Fetch and process attendance data from a URL
            async function fetchAndDisplayAttendance(url) {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                console.log('Response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Error response:', errorText);
                    throw new Error(`Failed to fetch attendance data: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                console.log('Raw attendance data received:', data);
                
                processAttendanceData(data);
            }
            
            // Process attendance data and update UI
            function processAttendanceData(data, isAdminView = false) {
                if (!Array.isArray(data)) {
                    console.warn('Expected array data but received:', typeof data, data);
                    data = [];
                }

                // Calculate present and absent counts
                let presentCount = 0;
                let absentCount = 0;
                
                console.log(`Processing ${data.length} attendance records`);
                
                // Get today's date in YYYY-MM-DD format for comparison
                const today = new Date();
                const todayStr = today.toISOString().split('T')[0];
                
                data.forEach((record, index) => {
                    console.log(`Record ${index + 1}:`, record);
                    
                    // Skip records that aren't from today
                    const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : null;
                    if (recordDate !== todayStr) {
                        console.log(`  ⏩ Skipping record from ${recordDate} (not today)`);
                        return;
                    }
                    
                    if (record && typeof record === 'object' && record.records && Array.isArray(record.records)) {
                        console.log(`  Found ${record.records.length} student records`);
                        
                        record.records.forEach((student, studentIndex) => {
                            console.log(`    Student ${studentIndex + 1}:`, student);
                            
                            if (student && typeof student === 'object' && student.status) {
                                if (student.status === 'present' || student.status === 'late') {
                                    presentCount++;
                                    console.log(`    ✅ Marked as present`);
                                } else if (student.status === 'absent') {
                                    absentCount++;
                                    console.log(`    ❌ Marked as absent`);
                                } else {
                                    console.log(`    ⚠️ Unknown status: ${student.status}`);
                                }
                            } else {
                                console.log('    ⚠️ Invalid student record format:', student);
                            }
                        });
                    } else {
                        console.log('  ⚠️ Record is missing records array or invalid format:', record);
                    }
                });
                
                if (data.length === 0) {
                    console.log('No attendance records found for today');
                }
            
                console.log('Present count:', presentCount, 'Absent count:', absentCount);
                
                // Update the UI
                const presentElement = document.getElementById('today-present');
                const absentElement = document.getElementById('today-absent');
                
                if (presentElement) {
                    presentElement.textContent = presentCount;
                } else {
                    console.error('Element with ID "today-present" not found');
                }
                
                if (absentElement) {
                    absentElement.textContent = absentCount;
                } else {
                    console.error('Element with ID "today-absent" not found');
                }
                
                // Update the date display to show only today's date
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                const todayFormatted = new Date().toLocaleDateString(undefined, options);
                const dateElement = document.getElementById('attendance-date');
                
                if (dateElement) {
                    dateElement.textContent = `Today • ${todayFormatted}`;
                } else {
                    console.error('Element with ID "attendance-date" not found');
                }
            }
            
        } catch (error) {
            console.error('Error in global loadTodaysAttendance:', error);
            const dateElement = document.getElementById('attendance-date');
            if (dateElement) {
                dateElement.textContent = 'Error loading attendance';
            }
        }
    };
    
    // Log that the function is available
    console.log('Global loadTodaysAttendance function is now available');
    
    // Function to load and update total fees on dashboard
    async function loadTotalFees() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }
            
            console.log('Fetching fees from API...');
            // Fetch all fees with student population to get expected fees
            const [feesResponse, paymentsResponse] = await Promise.all([
                fetch('https://timiza-saas.onrender.com/api/fees?populate=student', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                // Fetch payments data to calculate actual fees paid
                fetch('https://timiza-saas.onrender.com/api/payments?status=completed', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);
            
            if (!feesResponse.ok || !paymentsResponse.ok) {
                const feesError = await feesResponse.text().catch(() => '');
                const paymentsError = await paymentsResponse.text().catch(() => '');
                console.error('API Errors - Fees:', feesError, 'Payments:', paymentsError);
                throw new Error(`HTTP error! status: ${feesResponse.status}/${paymentsResponse.status}`);
            }
            
            const [feesData, paymentsData] = await Promise.all([
                feesResponse.json(),
                paymentsResponse.json()
            ]);
            
            console.log('Fees API Response:', feesData);
            console.log('Payments API Response:', paymentsData);
            
            // Process fee records to get expected fees
            const fees = Array.isArray(feesData) ? feesData : (feesData.data || []);
            let totalExpectedFees = 0;
            let totalPaidFees = 0;
            
            console.log('=== FEE RECORDS ===');
            console.log(JSON.stringify(fees, null, 2));
            console.log('===================');
            
            // Calculate total expected fees from fee records
            fees.forEach(fee => {
                const feeAmount = parseFloat(fee.fees_per_term || fee.amount || fee.totalFees || 0);
                totalExpectedFees += feeAmount;
            });
            
            // Process payments data directly
            const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.data || []);
            console.log('Raw payments data:', JSON.stringify(payments, null, 2));
            
            // Sum up all completed/successful payments
            totalPaidFees = payments.reduce((sum, payment, index) => {
                console.log(`\n--- Processing Payment ${index + 1} ---`);
                console.log('Payment object:', payment);
                
                // Check if payment has the expected structure
                if (!payment) {
                    console.log('Skipping null/undefined payment');
                    return sum;
                }
                
                // Check status (case insensitive)
                const status = String(payment.status || '').toLowerCase();
                const isCompleted = status === 'completed' || status === 'success' || status === 'paid';
                
                console.log('Payment status:', status, 'Completed:', isCompleted);
                
                if (isCompleted) {
                    // Try different possible amount fields
                    const amount = parseFloat(
                        payment.amount || 
                        payment.payment_amount || 
                        payment.amount_paid ||
                        payment.paidAmount ||
                        0
                    );
                    
                    console.log('Payment amount found:', amount);
                    return sum + (isNaN(amount) ? 0 : amount);
                }
                
                return sum;
            }, 0);
            
            console.log('Total paid calculated:', totalPaidFees);
            
            console.log('\n=== FEE CALCULATION ===');
            console.log('Total Expected Fees:', totalExpectedFees);
            console.log('Total Paid Fees:', totalPaidFees);
            console.log('======================');
            
            console.log('Total Expected Fees:', totalExpectedFees);
            console.log('Total Paid Fees:', totalPaidFees);
            
            // Update the dashboard
            const feeCountElement = document.getElementById('fee-count');
            const feePaidElement = document.getElementById('fee-paid');
            const feeSummaryElement = document.getElementById('fee-summary');
            
            if (feeCountElement) {
                feeCountElement.textContent = `Ksh ${totalExpectedFees.toLocaleString()}`;
            }
            
            if (feePaidElement) {
                feePaidElement.textContent = `Paid: Ksh ${totalPaidFees.toLocaleString()}`;
                // Change color based on payment status (green if fully paid, red if not)
                feePaidElement.style.color = totalPaidFees >= totalExpectedFees ? '#4CAF50' : '#f44336';
            }
            
            if (feeSummaryElement) {
                const paymentPercentage = totalExpectedFees > 0 
                    ? Math.round((totalPaidFees / totalExpectedFees) * 100) 
                    : 0;
                feeSummaryElement.textContent = `${paymentPercentage}% of term fees collected`;
            }
            
        } catch (error) {
            console.error('Error loading fees data:', error);
            const feeCountElement = document.getElementById('fee-count');
            const feePaidElement = document.getElementById('fee-paid');
            
            if (feeCountElement) feeCountElement.textContent = 'Error loading';
            if (feePaidElement) feePaidElement.textContent = 'Payment data error';
        }
    }
    
    // Load total fees when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM fully loaded, calling loadTotalFees');
        loadTotalFees();
    });
    
    // Make the function available globally if needed
    window.loadTotalFees = async function() {
        console.log('loadTotalFees function started');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }
            
            console.log('Fetching fees from API...');
            const feesResponse = await fetch('https://timiza-saas.onrender.com/api/fees?populate=student', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!feesResponse.ok) {
                console.error('Error fetching fee data:', await feesResponse.text());
                throw new Error('Failed to fetch fee data');
            }
            
            const feesData = await feesResponse.json();
            console.log('=== FEE RECORDS ===', feesData);
            
            // Process fee records to get expected and paid fees
            const fees = Array.isArray(feesData) ? feesData : (feesData.data || []);
            let totalExpectedFees = 0;
            let totalPaidFees = 0;
            
            // Process each fee record
            fees.forEach(fee => {
                // Get the expected fee amount
                const feeAmount = parseFloat(fee.fees_per_term || fee.amount || fee.totalFees || 0);
                totalExpectedFees += feeAmount;
                
                // Check if there are payments in this fee record
                if (fee.payments && Array.isArray(fee.payments)) {
                    // Sum up all payments for this fee
                    const feePaid = fee.payments.reduce((sum, payment) => {
                        return sum + (parseFloat(payment.amount) || 0);
                    }, 0);
                    
                    console.log(`Fee ${fee._id}:`, {
                        expected: feeAmount,
                        paid: feePaid,
                        payments: fee.payments
                    });
                    
                    totalPaidFees += feePaid;
                } else if (fee.paidAmount !== undefined) {
                    // Fallback to paidAmount if payments array is not available
                    const paid = parseFloat(fee.paidAmount) || 0;
                    console.log(`Fee ${fee._id} using paidAmount:`, paid);
                    totalPaidFees += paid;
                }
            });
            
            console.log('=== TOTALS ===');
            console.log('Total Expected Fees:', totalExpectedFees);
            console.log('Total Paid Fees:', totalPaidFees);
            
            // Calculate balance
            const balance = Math.max(0, totalExpectedFees - totalPaidFees);
            
            // Update the UI
            const feeCountElement = document.getElementById('fee-count');
            const feePaidElement = document.getElementById('fee-paid');
            const feeBalanceElement = document.getElementById('fee-balance');
            
            if (feeCountElement) {
                feeCountElement.textContent = `Ksh ${totalExpectedFees.toLocaleString()}`;
            }
            
            if (feePaidElement) {
                feePaidElement.textContent = `Paid: Ksh ${totalPaidFees.toLocaleString()}`;
                feePaidElement.style.color = totalPaidFees >= totalExpectedFees ? '#4CAF50' : '#2196F3';
            }
            
            if (feeBalanceElement) {
                feeBalanceElement.textContent = `Balance: Ksh ${balance.toLocaleString()}`;
                feeBalanceElement.style.color = balance > 0 ? '#f44336' : '#4CAF50';
            }
            
        } catch (error) {
            console.error('Error in loadTotalFees:', error);
            const feeCountElement = document.getElementById('fee-count');
            const feePaidElement = document.getElementById('fee-paid');
            
            if (feeCountElement) feeCountElement.textContent = 'Error loading';
            if (feePaidElement) feePaidElement.textContent = 'Payment data error';
        }
    };
    
    // Function to load and update clubs count on dashboard
    async function loadClubsCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }
            
            console.log('Fetching clubs from API...');
            const response = await fetch('https://timiza-saas.onrender.com/api/clubs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Clubs API Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Clubs API Response:', data);
            
            // Handle both array and object responses
            const clubs = Array.isArray(data) ? data : (data.data || []);
            console.log('Total clubs found:', clubs.length);
            
            // Update the dashboard
            const clubCountElement = document.getElementById('club-count');
            if (clubCountElement) {
                clubCountElement.textContent = clubs.length;
                
                // Update the chart if it exists
                if (window.clubsChart) {
                    window.clubsChart.data.datasets[0].data = [clubs.length];
                    window.clubsChart.update();
                }
            } else {
                console.error('club-count element not found in the DOM');
            }
            
            return clubs.length;
            
        } catch (error) {
            console.error('Error loading clubs count:', error);
            const clubCountElement = document.getElementById('club-count');
            if (clubCountElement) {
                clubCountElement.textContent = 'Error';
            }
            return 0;
        }
    }
    
    // Load counts when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        loadBooksCount();
        loadClubsCount();
        
        // Initialize clubs chart
        const chartClubs = document.getElementById('chart-clubs');
        if (chartClubs) {
            const ctxClubs = chartClubs.getContext('2d');
            window.clubsChart = new Chart(ctxClubs, {
                type: 'doughnut',
                data: {
                    labels: ['Clubs'],
                    datasets: [{
                        data: [0],
                        backgroundColor: ['#10B981']
                    }]
                },
                options: { 
                    plugins: { 
                        legend: { display: false } 
                    }, 
                    cutout: '70%' 
                }
            });
        }
    });
    
    // Make the function available globally if needed
    window.loadClubsCount = loadClubsCount;
    
    // Function to load and update books count on dashboard
    async function loadBooksCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }
            
            console.log('Fetching books from API...');
            const response = await fetch('https://timiza-saas.onrender.com/api/library', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Books API Error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Books API Response:', data);
            
            // Handle both array and object responses
            const books = Array.isArray(data) ? data : (data.data || []);
            console.log('Total books found:', books.length);
            
            // Calculate total copies (sum of all copies)
            let totalCopies = 0;
            if (books.length > 0) {
                totalCopies = books.reduce((sum, book) => {
                    return sum + (parseInt(book.copies || 1, 10) || 0);
                }, 0);
            }
            
            // Update the dashboard
            const bookCountElement = document.getElementById('book-count');
            if (bookCountElement) {
                bookCountElement.textContent = totalCopies;
                
                // Update the chart if it exists
                if (window.booksChart) {
                    window.booksChart.data.datasets[0].data = [totalCopies];
                    window.booksChart.update();
                }
            } else {
                console.error('book-count element not found in the DOM');
            }
            
            return totalCopies;
            
        } catch (error) {
            console.error('Error loading books count:', error);
            const bookCountElement = document.getElementById('book-count');
            if (bookCountElement) {
                bookCountElement.textContent = 'Error';
            }
            return 0;
        }
    }
    
    // Load books count when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        loadBooksCount();
        
        // Initialize books chart if it doesn't exist
        const chartBooks = document.getElementById('chart-books');
        if (chartBooks && !window.booksChart) {
            const ctxBooks = chartBooks.getContext('2d');
            window.booksChart = new Chart(ctxBooks, {
                type: 'doughnut',
                data: {
                    labels: ['Books'],
                    datasets: [{
                        data: [0],
                        backgroundColor: ['#3B82F6']
                    }]
                },
                options: { 
                    plugins: { 
                        legend: { display: false } 
                    }, 
                    cutout: '70%' 
                }
            });
        }
    });
    
    // Make the function available globally if needed
    window.loadBooksCount = loadBooksCount;
    
    // Initialize dashboard when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.previousElementSibling;
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
        
        // Toggle change password form
        const togglePasswordBtn = document.getElementById('toggle-password-btn');
        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const form = document.querySelector('.change-password-section');
                form.style.display = form.style.display === 'none' ? 'block' : 'none';
            });
        }
        
        // Initialize mini charts
        initializeMiniCharts();
        
        // Load all dashboard data
        loadDashboardData();
    });
    
    // Initialize mini charts for dashboard cards
    function initializeMiniCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                line: {
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                point: { radius: 0 }
            }
        };
        
        // Students chart
        const studentsCtx = document.getElementById('chart-students')?.getContext('2d');
        if (studentsCtx) {
            new Chart(studentsCtx, {
                type: 'line',
                data: {
                    labels: Array(12).fill(''),
                    datasets: [{
                        data: [30, 40, 45, 50, 45, 55, 60, 65, 70, 75, 80, 85],
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2
                    }]
                },
                options: chartOptions
            });
        }
        
        // Teachers chart
        const teachersCtx = document.getElementById('chart-teachers')?.getContext('2d');
        if (teachersCtx) {
            new Chart(teachersCtx, {
                type: 'line',
                data: {
                    labels: Array(12).fill(''),
                    datasets: [{
                        data: [5, 7, 8, 8, 9, 10, 10, 11, 12, 12, 12, 12],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2
                    }]
                },
                options: chartOptions
            });
        }
    }
    
    // Load profile data
    async function loadProfileData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const response = await fetch('https://timiza-saas.onrender.com/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const user = await response.json();
                document.getElementById('profile-name').textContent = user.name || 'User';
                document.getElementById('admin-name').textContent = user.name || 'Admin';
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }
    
    // Load total fees
    async function loadTotalFees() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('https://timiza-saas.onrender.com/api/fees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            
            let total = 0;
            const fees = Array.isArray(data) ? data : (data.data || []);
            fees.forEach(fee => {
                total += Number(fee.fees_per_term || fee.amount || 0);
            });
            
            document.getElementById('fee-count').textContent = `Ksh ${total.toLocaleString()}`;
            return true;
        } catch (error) {
            console.error('Error loading fees:', error);
            document.getElementById('fee-count').textContent = 'Error';
            return false;
        }
    }
    
    // Load teachers count
    async function loadTeachersCount() {
        console.log('=== loadTeachersCount STARTED ===');
        const countElement = document.getElementById('teacher-count');
        
        // Check if element exists
        if (!countElement) {
            console.error('❌ teacher-count element not found in the DOM');
            console.log('Available elements with class "stat-value":', 
                Array.from(document.querySelectorAll('.stat-value')).map(el => ({
                    id: el.id,
                    class: el.className,
                    text: el.textContent
                }))
            );
            return false;
        }
        
        // Show loading state
        countElement.textContent = '...';
        
        // Show loading state
        countElement.textContent = '...';
        
        // First try to get from localStorage
        try {
            const savedCount = localStorage.getItem('teachersCount');
            if (savedCount) {
                countElement.textContent = savedCount;
                return true;
            }
            
            const savedTeachers = localStorage.getItem('teachers');
            if (savedTeachers) {
                const teachers = JSON.parse(savedTeachers);
                if (Array.isArray(teachers)) {
                    countElement.textContent = teachers.length.toString();
                    return true;
                }
            }
        } catch (e) {
            console.error('Error parsing saved teachers:', e);
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No authentication token found');
                countElement.textContent = '-';
                return false;
            }
            
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            console.log('🔍 Attempting to fetch teachers count...');
            
            // First try the count endpoint
            let response;
            try {

                response = await fetch('https://timiza-saas.onrender.com/api/teachers/count', {
                    method: 'GET',
                    headers: headers
                });
                
                if (response.ok) {
                const data = await response.json();
                const count = data.count || 0;
                countElement.textContent = count.toString();
                
                // Save to localStorage for offline use
                try {
                    localStorage.setItem('teachersCount', count.toString());
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
                
                return true;
            }
            
            console.log('Count endpoint failed, trying to fetch all teachers...');
            // If count endpoint fails, try to fetch all teachers and count them
            console.log('⚠️ Count endpoint failed, trying to fetch all teachers...');
            
            let teachersResponse;
            try {

                teachersResponse = await fetch('https://timiza-saas.onrender.com/api/teachers', {
                    method: 'GET',
                    headers: headers
                });
                
                if (teachersResponse.ok) {
                const data = await teachersResponse.json();
                console.log('Teachers list API response:', data);
                const teachers = Array.isArray(data) ? data : (data.teachers || data.data || []);
                const count = teachers.length;
                countElement.textContent = count.toString();
                
                // Save to localStorage for offline use
                try {
                    localStorage.setItem('teachersCount', count.toString());
                    localStorage.setItem('teachers', JSON.stringify(teachers));
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
                
                return true;
            }
            
                // If we get here, both API endpoints failed
                console.error('❌ Both count and list endpoints failed');
                throw new Error(`Failed to load teachers data: ${teachersResponse.status} ${teachersResponse.statusText}`);
            } catch (innerError) {
                console.error('❌ Error fetching teachers list:', innerError);
                throw new Error('Failed to fetch teachers list');
            }
        } catch (error) {
            console.error('❌ Error in loadTeachersCount:', error);
            
            // Try to use cached data as fallback
            try {
                const cachedCount = localStorage.getItem('teachersCount');
                if (cachedCount) {
                    console.log('ℹ️ Using cached teacher count:', cachedCount);
                    countElement.textContent = cachedCount;
                    return true;
                }
                
                // Try to get count from cached teachers list
                const cachedTeachers = localStorage.getItem('teachers');
                if (cachedTeachers) {
                    try {
                        const teachers = JSON.parse(cachedTeachers);
                        if (Array.isArray(teachers)) {
                            const count = teachers.length;
                            console.log('ℹ️ Calculated count from cached teachers:', count);
                            countElement.textContent = count.toString();
                            return true;
                        }
                    } catch (e) {
                        console.error('Error parsing cached teachers:', e);
                    }
                }
                
                countElement.textContent = '-';
                return false;
            } catch (e) {
                console.error('Error in fallback logic:', e);
                countElement.textContent = '-';
                return false;
            }
        }
    
    }
    
    } // End of loadTeachersCount
    
    // Load students count
    async function loadStudentsCount() {
        const countElement = document.getElementById('students-count');
        if (!countElement) return false;
        
        // Show loading state
        countElement.textContent = '...';
        
        // First try to get from localStorage
        try {
            const savedCount = localStorage.getItem('studentsCount');
            if (savedCount) {
                countElement.textContent = savedCount;
                return true;
            }
            
            const savedStudents = localStorage.getItem('students');
            if (savedStudents) {
                const students = JSON.parse(savedStudents);
                if (Array.isArray(students)) {
                    countElement.textContent = students.length.toString();
                    return true;
                }
            }
        } catch (e) {
            console.error('Error parsing saved students:', e);
        }
        
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            // Try to fetch students count from the server
            const response = await fetch('https://timiza-saas.onrender.com/api/students/count', {
                method: 'GET',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const count = data.count || 0;
                countElement.textContent = count.toString();
                
                // Save to localStorage for offline use
                try {
                    localStorage.setItem('studentsCount', count.toString());
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
                
                return true;
            }
            
            // If count endpoint fails, try to fetch all students and count them
            const studentsResponse = await fetch('https://timiza-saas.onrender.com/api/students', {
                method: 'GET',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                }
            });
            
            if (studentsResponse.ok) {
                const data = await studentsResponse.json();
                const students = Array.isArray(data) ? data : (data.students || data.data || []);
                const count = students.length;
                countElement.textContent = count.toString();
                
                // Save to localStorage for offline use
                try {
                    localStorage.setItem('studentsCount', count.toString());
                    localStorage.setItem('students', JSON.stringify(students));
                } catch (e) {
                    console.error('Error saving to localStorage:', e);
                }
                
                return true;
            }
            
            throw new Error('Failed to load students data');
            
        } catch (error) {
            console.error('Error loading students count:', error);
            // Try to show cached count if available
            try {
                const cachedCount = localStorage.getItem('studentsCount');
                if (cachedCount) {
                    countElement.textContent = cachedCount;
                    return true;
                }
            } catch (e) {
                console.error('Error accessing localStorage:', e);
            }
            
            countElement.textContent = '-';
            return false;
        }
    }
    
    // Load books count
    async function loadBooksCount() {
        try {
            console.log('=== loadBooksCount function STARTED ===');
            const token = localStorage.getItem('token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            // Try to fetch books from the server

            const response = await fetch('https://timiza-saas.onrender.com/api/books', {
                method: 'GET',
                headers: headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const books = Array.isArray(data) ? data : (data.books || data.data || []);
            
            // Calculate total books (sum of all copies)
            const totalBooks = books.reduce((total, book) => {
                return total + (parseInt(book.copies) || 1);
            }, 0);
            
            // Calculate issued books - check multiple possible fields
            const issuedBooks = books.filter(book => {
                // Check for any of these fields that would indicate the book is issued
                const isIssued = (
                    (book.borrowerId && book.borrowerId.length > 0) ||
                    (book.borrower && (typeof book.borrower === 'string' ? book.borrower.length > 0 : true)) ||
                    (book.issuedTo && book.issuedTo.length > 0) ||
                    (book.status && ['issued', 'borrowed', 'checked out', 'out'].includes(String(book.status).toLowerCase()))
                );
                
                // Log details for the first few issued books
                if (isIssued) {
                    console.log('Found issued book:', {
                        id: book._id || book.id,
                        title: book.title,
                        status: book.status,
                        borrowerId: book.borrowerId,
                        borrower: book.borrower,
                        issuedTo: book.issuedTo
                    });
                }
                
                return isIssued;
            });
            
            console.log(`Total books: ${totalBooks}, Issued books: ${issuedBooks.length}`);
            
            // Update the UI
            const bookCountElement = document.getElementById('book-count');
            const issuedBooksElement = document.getElementById('issued-books-count');
            
            if (bookCountElement) {
                bookCountElement.textContent = totalBooks;
            }
            
            if (issuedBooksElement) {
                issuedBooksElement.textContent = `Issued: ${issuedBooks.length}`;
                // Color code based on issued books percentage
                const issuedPercentage = totalBooks > 0 ? (issuedBooks.length / totalBooks) : 0;
                issuedBooksElement.style.color = issuedPercentage > 0.7 ? '#f44336' : '#4CAF50';
            }
            
            return true;
        } catch (error) {
            console.error('Error loading books:', error);
            const bookCountElement = document.getElementById('book-count');
            const issuedBooksElement = document.getElementById('issued-books-count');
            
            if (bookCountElement) {
                bookCountElement.textContent = '-';
            }
            
            if (issuedBooksElement) {
                issuedBooksElement.textContent = 'Issued: -';
            }
            
            return false;
        } finally {
            console.log('=== loadBooksCount function COMPLETED ===');
        }
    }
    
    // Load today's attendance
    async function loadTodayAttendance() {
        console.log('=== loadTodayAttendance STARTED ===');
        try {
            const token = localStorage.getItem('token');
            console.log('Token found in localStorage:', !!token);
            if (!token) {
                console.error('No token found in localStorage');
                throw new Error('Authentication required');
            }
            
            // Get today's date in YYYY-MM-DD format
            const today = new Date();
            const todayFormatted = today.toISOString().split('T')[0];
            
            // First update the date display immediately
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('attendance-date').textContent = `Today • ${today.toLocaleDateString('en-US', options)}`;
            
            console.log('Fetching attendance data for date:', todayFormatted);
            // Try to get today's attendance
            console.log(`Fetching attendance for date: ${todayFormatted}`);

            const response = await fetch(`https://timiza-saas.onrender.com/api/attendance?date=${todayFormatted}`, {
                method: 'GET',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            console.log('Attendance API response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Attendance API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Attendance API response data:', data);
            
            if (!data) {
                console.error('No data received from attendance API');
                throw new Error('No attendance data received');
            }
            
            let present = 0;
            let absent = 0;
            
            // Handle different response formats
            if (Array.isArray(data)) {
                // If we get an array, find today's record
                const todayRecord = data.find(record => {
                    const recordDate = record.date ? new Date(record.date).toISOString().split('T')[0] : null;
                    return recordDate === todayFormatted;
                });
                
                if (todayRecord) {
                    present = parseInt(todayRecord.present || 0);
                    absent = parseInt(todayRecord.absent || 0);
                    
                    // If we have records array, count actual present/absent
                    if (Array.isArray(todayRecord.records)) {
                        present = todayRecord.records.filter(r => r.status === 'present' || r.status === 'late').length;
                        absent = todayRecord.records.filter(r => r.status === 'absent').length;
                    }
                }
            } else if (typeof data === 'object' && data !== null) {
                // If we get an object with direct counts
                present = parseInt(data.present || 0);
                absent = parseInt(data.absent || 0);
                
                // If we have records array, count actual present/absent
                if (Array.isArray(data.records)) {
                    present = data.records.filter(r => r.status === 'present' || r.status === 'late').length;
                    absent = data.records.filter(r => r.status === 'absent').length;
                }
            }
            
            // Update the UI with the counts
            document.getElementById('today-present').textContent = present;
            document.getElementById('today-absent').textContent = absent;
            
            // Update progress bars
            const total = present + absent || 1; // Avoid division by zero
            const presentPercentage = Math.round((present / total) * 100);
            const absentPercentage = Math.round((absent / total) * 100);
            
            const presentPercentageElement = document.getElementById('present-percentage');
            const absentPercentageElement = document.getElementById('absent-percentage');
            
            if (presentPercentageElement) presentPercentageElement.style.width = presentPercentage + '%';
            if (absentPercentageElement) absentPercentageElement.style.width = absentPercentage + '%';
            
            console.log('Attendance data processed successfully:', { present, absent, presentPercentage, absentPercentage });
            console.log('=== loadTodayAttendance COMPLETED successfully ===');
            
            console.log(`Attendance updated: ${present} present, ${absent} absent`);
            return true;
            
        } catch (error) {
            console.error('Error loading attendance:', error);
            // Reset UI on error
            const presentElement = document.getElementById('today-present');
            const absentElement = document.getElementById('today-absent');
            
            if (presentElement) presentElement.textContent = '0';
            if (absentElement) absentElement.textContent = '0';
            
            console.log('=== loadTodayAttendance COMPLETED with error ===');
            document.getElementById('present-percentage').style.width = '0%';
            document.getElementById('absent-percentage').style.width = '0%';
            document.getElementById('attendance-date').textContent = 'Error loading data';
            return false;
        }
    }
    
    // Test function to verify teacher count functionality
    function testTeacherCount() {
        console.log('=== TESTING TEACHER COUNT ===');
        const countElement = document.getElementById('teacher-count');
        console.log('Teacher count element:', countElement);
        if (countElement) {
            console.log('Current content:', countElement.textContent);
            countElement.textContent = 'TEST';
            console.log('Set test content to "TEST"');
        } else {
            console.error('Teacher count element not found');
            console.log('Available elements with class "stat-value":', document.querySelectorAll('.stat-value'));
        }
    }

    // Initialize the dashboard when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        console.log('=== DOM CONTENT LOADED ===');
        
        // Test teacher count functionality
        testTeacherCount();
        
        // Load all dashboard data
        loadDashboardData();
        
        // Set up auto-refresh every 5 minutes
        setInterval(loadDashboardData, 5 * 60 * 1000);
    });
    
    // Load all dashboard data
    async function loadDashboardData() {
        console.log('Loading dashboard data...');
        
        // Show loading state for all stats
        const statElements = document.querySelectorAll('.stat-value');
        statElements.forEach(el => {
            if (!el.id.includes('percentage')) {
                el.textContent = '...';
            }
        });
        
        try {
            // Load all data in parallel
            await Promise.all([
                loadStudentsCount().catch(e => console.error('Error in loadStudentsCount:', e)),
                loadTeachersCount().catch(e => console.error('Error in loadTeachersCount:', e)),
                loadBooksCount().catch(e => console.error('Error in loadBooksCount:', e)),
                loadClubsCount().catch(e => console.error('Error in loadClubsCount:', e)),
                loadTotalFees().catch(e => console.error('Error in loadTotalFees:', e)),
                loadTodayAttendance().catch(e => console.error('Error in loadTodayAttendance:', e))
            ]);
            
            console.log('Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error in dashboard data loading:', error);
            // Individual error handling is done in each function
        } finally {
            // Ensure all loading states are cleared
            statElements.forEach(el => {
                if (el.textContent === '...') {
                    el.textContent = '-';
                }
            });
        }
    }
    

    
    // Load fees data
    async function loadFeesData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            

            const response = await fetch('https://timiza-saas.onrender.com/api/fees/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const totalFees = data.totalFees || 0;
                const formattedFees = new Intl.NumberFormat('en-KE', {
                    style: 'currency',
                    currency: 'KES',
                    minimumFractionDigits: 0
                }).format(totalFees);
                
                document.getElementById('fee-count').textContent = formattedFees;
                
                // Update fee summary if available
                if (data.percentageChange) {
                    const trend = data.percentageChange >= 0 ? 'up' : 'down';
                    const feeSummary = document.getElementById('fee-summary');
                    if (feeSummary) {
                        feeSummary.innerHTML = `
                            <i class="fas fa-arrow-${trend}"></i> 
                            ${Math.abs(data.percentageChange)}% from last term
                        `;
                        feeSummary.className = `stat-trend text-${trend === 'up' ? 'success' : 'danger'}`;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading fees data:', error);
        }
    }
    
    // Load attendance data
    async function loadAttendanceData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            
            const today = new Date().toISOString().split('T')[0];

            const response = await fetch(`https://timiza-saas.onrender.com/api/attendance/summary?date=${today}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                const present = data.present || 0;
                const absent = data.absent || 0;
                const total = present + absent;
                
                document.getElementById('today-present').textContent = present;
                document.getElementById('today-absent').textContent = absent;
                
                // Update progress bars
                if (total > 0) {
                    const presentPercent = Math.round((present / total) * 100);
                    const absentPercent = 100 - presentPercent;
                    
                    document.getElementById('present-percentage').style.width = `${presentPercent}%`;
                    document.getElementById('absent-percentage').style.width = `${absentPercent}%`;
                }
                
                // Update date
                const dateElement = document.getElementById('attendance-date');
                if (dateElement) {
                    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
                }
            }
        } catch (error) {
            console.error('Error loading attendance data:', error);
        }
    }
    
    // Make functions available globally
    window.loadDashboardData = loadDashboardData;
    
    // Ensure loadBooksCount is called when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM fully loaded, calling loadBooksCount');
        loadBooksCount().catch(console.error);
    });

     <!-- Attendance Auto-Load Script -->
        // Make loadTodaysAttendance globally available
        if (typeof loadTodaysAttendance === 'function') {
            window.loadTodaysAttendance = loadTodaysAttendance;
            
            // Load attendance data when the page loads
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('Loading attendance data...');
                    loadTodaysAttendance().catch(console.error);
                });
            } else {
                console.log('Loading attendance data now...');
                loadTodaysAttendance().catch(console.error);
            }
        } else {
            console.error('Failed to initialize attendance loading');
        }

        <!-- Class Management JavaScript -->
        document.addEventListener('DOMContentLoaded', function() {
            // Get DOM elements
            const classSelect = document.getElementById('class-select');
            const studentList = document.getElementById('student-list');
            const studentProfile = document.getElementById('student-profile');
            
            // Store current class students
            let currentClassStudents = [];
            
            // Format date helper function
            const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                try {
                    const date = new Date(dateString);
                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                } catch (e) {
                    console.error('Error formatting date:', e);
                    return 'N/A';
                }
            };
            
            // Event listener for class selection
            if (classSelect) {
                classSelect.addEventListener('change', async function() {
                    const className = this.value;
                    if (!className) {
                        studentList.innerHTML = '<div class="empty-state">Select a class to view students</div>';
                        studentProfile.innerHTML = `
                            <div class="empty-profile">
                                <i class="fas fa-user-graduate"></i>
                                <p>Select a class to view students</p>
                            </div>`;
                        return;
                    }
                    
                    try {
                        // Show loading state
                        studentList.innerHTML = '<div class="loading">Loading students...</div>';
                        
                        // Clear previous student profile
                        studentProfile.innerHTML = `
                            <div class="empty-profile">
                                <i class="fas fa-spinner fa-spin"></i>
                                <p>Loading students...</p>
                            </div>`;
                        
                        // Fetch students for the selected class
                        const students = await loadStudentsForClass(className);
                        currentClassStudents = students;
                        
                        // Display students
                        displayStudents(students);
                        
                        // Clear student profile
                        studentProfile.innerHTML = `
                            <div class="empty-profile">
                                <i class="fas fa-user-graduate"></i>
                                <p>Select a student to view profile</p>
                            </div>`;
                            
                    } catch (error) {
                        console.error('Error loading students:', error);
                        studentList.innerHTML = `
                            <div class="error">
                                <p>Error loading students. Please try again.</p>
                                <p class="small">${error.message || ''}</p>
                            </div>`;
                    }
                });
            }
            
            // Function to load students for a class
            async function loadStudentsForClass(className) {
                try {
                    console.log(`Loading students for class: ${className}`);
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('No authentication token found');
                    }
                    
                    const response = await fetch(`https://timiza-saas.onrender.com/api/students/class/${encodeURIComponent(className)}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('API Error Response:', errorText);
                        throw new Error(`Failed to load students: ${response.status} ${response.statusText}`);
                    }
                    
                    const result = await response.json();
                    console.log('API Response:', result);
                    
                    // Handle different response formats
                    if (Array.isArray(result)) {
                        return result;
                    } else if (result && Array.isArray(result.data)) {
                        return result.data;
                    } else if (result && result.students) {
                        return result.students;
                    } else if (result && result.success && Array.isArray(result.data)) {
                        return result.data;
                    }
                    
                    throw new Error('Unexpected response format from server');
                    
                } catch (error) {
                    console.error('Error in loadStudentsForClass:', error);
                    throw error;
                }
            }
            
            // Function to display students in the list
            function displayStudents(students) {
                console.log('Displaying students:', students);
                
                if (!students || !students.length) {
                    studentList.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-user-graduate"></i>
                            <p>No students found in this class</p>
                        </div>`;
                    return;
                }
                
                try {
                    // Clear the student list
                    studentList.innerHTML = '';
                    
                    // Create a document fragment for better performance
                    const fragment = document.createDocumentFragment();
                    
                    students.forEach(student => {
                        if (!student || typeof student !== 'object') {
                            console.warn('Invalid student data:', student);
                            return;
                        }
                        
                        // Get student data with fallbacks
                        const studentId = student._id || student.id || '';
                        const fullName = student.name || student.fullName || 'Unknown Student';
                        const [firstName, ...lastNameParts] = fullName.split(' ');
                        const lastName = lastNameParts.join(' ');
                        const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
                        const admissionNumber = student.admissionNumber || student.admissionNo || 'N/A';
                        
                        // Create student item
                        const studentItem = document.createElement('div');
                        studentItem.className = 'student-item';
                        studentItem.dataset.studentId = studentId;
                        
                        studentItem.innerHTML = `
                            <div class="student-avatar">${initials}</div>
                            <div class="student-info">
                                <h4>${fullName}</h4>
                                <p>Admission: ${admissionNumber}</p>
                            </div>
                        `;
                        
                        // Add click handler
                        studentItem.addEventListener('click', () => {
                            displayStudentProfile(student);
                        });
                        
                        fragment.appendChild(studentItem);
                    });
                    
                    // Append all student items at once for better performance
                    studentList.appendChild(fragment);
                    
                } catch (error) {
                    console.error('Error rendering students:', error);
                    studentList.innerHTML = `
                        <div class="error">
                            <p>Error displaying student list. Please try again.</p>
                            <p class="small">${error.message || ''}</p>
                        </div>`;
                }
            }
            
            // Function to find student in the current class data
            function findStudentInCurrentClass(studentId) {
                return currentClassStudents.find(s => (s._id === studentId || s.id === studentId));
            }
            
            // Function to format student profile HTML to match teacher dashboard
            function formatStudentProfile(student) {
                if (!student) return '<div class="error">Student not found</div>';
                
                // Get student initials for avatar
                const fullName = student.name || student.fullName || 'Unknown Student';
                const [firstName, ...lastNameParts] = fullName.split(' ');
                const lastName = lastNameParts.join(' ');
                const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
                
                // Format date of birth if it exists
                let dob = 'N/A';
                if (student.dateOfBirth) {
                    const dobDate = new Date(student.dateOfBirth);
                    if (!isNaN(dobDate.getTime())) {
                        dob = dobDate.toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'});
                    }
                }
                
                // Get class and level information
                const className = student.class || student.className || 'N/A';
                const level = className.includes('Grade') ? 'Primary School' : 
                             className.includes('Form') ? 'Secondary School' : 'N/A';
                
                return `
                    <div class="profile-header">
                        <div class="profile-avatar">${initials}</div>
                        <div class="profile-info">
                            <h2>${fullName}</h2>
                            <p>Student ID: ${student.admissionNumber || student.admissionNo || 'N/A'}</p>
                            <p>Gender: ${student.gender || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Personal Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Date of Birth:</span>
                            <span class="detail-value">${dob}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Gender:</span>
                            <span class="detail-value">${student.gender || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Parent/Guardian:</span>
                            <span class="detail-value">${student.parentName || student.parent || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Parent Contact:</span>
                            <span class="detail-value">${student.parentContact || student.contactNumber || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Contact Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${student.email || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${student.phone || student.contactNumber || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${student.address || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3>Class Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Class:</span>
                            <span class="detail-value">${className}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Level:</span>
                            <span class="detail-value">${level}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Status:</span>
                            <span class="detail-value ${student.status === 'Active' ? 'status-active' : 'status-inactive'}">
                                ${student.status || 'Active'}
                            </span>
                        </div>
                    </div>
                `;
            }
            
            // Function to display student profile
            function displayStudentProfile(student) {
                if (!student) {
                    studentProfile.innerHTML = `
                        <div class="empty-profile">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Error loading student profile</p>
                        </div>`;
                    return;
                }
                
                try {
                    // Extract student data with fallbacks
                    const fullName = student.name || student.fullName || 'Unknown Student';
                    const [firstName, ...lastNameParts] = fullName.split(' ');
                    const lastName = lastNameParts.join(' ');
                    const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
                    
                    // Get class information
                    const classSelect = document.getElementById('class-select');
                    const selectedClass = classSelect ? classSelect.options[classSelect.selectedIndex] : null;
                    const className = selectedClass ? selectedClass.text : (student.className || student.class || 'N/A');
                    
                    // Get admission number
                    const admissionNumber = student.admissionNumber || student.admissionNo || 'N/A';
                    
                    // Format parent/guardian info
                    const parentName = student.parentName || student.parent || 'N/A';
                    const parentContact = student.parentContact || student.contactNumber || 'N/A';
                    
                    // Format date of birth
                    const dob = formatDate(student.dob || student.dateOfBirth);
                    
                    // Create profile HTML
                    studentProfile.innerHTML = `
                        <div class="profile-header">
                            <div class="profile-avatar">${initials}</div>
                            <div class="profile-info">
                                <h3>${fullName}</h3>
                                <p class="student-class">${className}</p>
                            </div>
                        </div>
                        
                        <div class="profile-details">
                            <div class="detail-row">
                                <span class="detail-label">Admission No:</span>
                                <span class="detail-value">${admissionNumber}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Date of Birth:</span>
                                <span class="detail-value">${dob}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Gender:</span>
                                <span class="detail-value">${student.gender || 'N/A'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Parent/Guardian:</span>
                                <span class="detail-value">${parentName}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Contact:</span>
                                <span class="detail-value">${parentContact}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Status:</span>
                                <span class="detail-value">${student.status || 'Active'}</span>
                            </div>
                        </div>
                    `;
                    
                } catch (error) {
                    console.error('Error displaying student profile:', error);
                    studentProfile.innerHTML = `
                        <div class="error">
                            <p>Error displaying student profile. Please try again.</p>
                            <p class="small">${error.message || ''}</p>
                        </div>`;
                }
            }
            
            // Show success message
            function showSuccess(message) {
                const messageDiv = document.getElementById('class-message');
                if (messageDiv) {
                    messageDiv.textContent = message;
                    messageDiv.style.display = 'block';
                    messageDiv.className = 'alert alert-success';
                    
                    // Hide after 5 seconds
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 5000);
                }
            }
            
            // Show error message
            function showError(message) {
                const messageDiv = document.getElementById('class-message');
                if (messageDiv) {
                    messageDiv.textContent = message;
                    messageDiv.style.display = 'block';
                    messageDiv.className = 'alert alert-error';
                }
            }
        });

         <!-- Initialize admin functionality -->
        // Make sure the admin.js is loaded after the DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            // Check if the current user is an admin
            const userRole = localStorage.getItem('userRole');
            if (userRole === 'admin') {
                // Initialize the admin page
                if (typeof initializeAdminPage === 'function') {
                    initializeAdminPage();
                } else {
                    console.error('Admin initialization function not found');
                }
            }
        });

         // ------------------------
  // Safely load students
  // ------------------------
      document.addEventListener('DOMContentLoaded', () => {
  async function loadStudents() {
    const studentsList = document.getElementById('students-list');
    if (!studentsList) {
      console.warn('Student table body not found!');
      return;
    }

    try {
      const response = await fetch('https://timiza-saas.onrender.com/api/students');
      const data = await response.json();

      if (!data || !Array.isArray(data.students)) {
        studentsList.innerHTML = '<p>No students found</p>';
        return;
      }

      const html = data.students.map(student => {
        const studentClass =
          student.class ||
          student.classAssigned ||
          (student.profile && student.profile.class) ||
          'Not assigned';

        return `
          <div class="student-item">
            <h4>${student.name}</h4>
            <p>Email: ${student.email}</p>
            <p>Class: ${studentClass}</p>
            <div class="action-buttons">
              <button onclick="editStudent('${student._id}')">Edit</button>
              <button onclick="deleteStudent('${student._id}')">Delete</button>
            </div>
          </div>
        `;
      }).join('');

      studentsList.innerHTML = html;

    } catch (error) {
      console.error('Error loading students:', error);
      if (studentsList) {
        studentsList.innerHTML = '<p>Error loading students data</p>';
      }
    }
  }

  // Call student loader safely
  loadStudents();

  // ------------------------
  // Other DOM event bindings
  // ------------------------
  const roleTableBody = document.getElementById('role-table-body');
  if (roleTableBody) {
    roleTableBody.addEventListener('click', (e) => {
      console.log('Role table clicked', e.target);
    });
  }

});
