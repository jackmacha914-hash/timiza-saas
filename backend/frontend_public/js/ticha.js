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

// Optional: intercept XMLHttpRequest too, if you have old XHR code
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


     // JavaScript for the teacher dashboard
      document.addEventListener('DOMContentLoaded', function() {
        // API base URL - update this to your actual API endpoint
        const API_BASE_URL = 'https://timiza-saas.onrender.com/api';
        
        // Get teacher ID from JWT token or user session
        function getTeacherId() {
          // This is a placeholder - replace with actual JWT token parsing
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('No authentication token found');
            return null;
          }
          try {
            // In a real app, you would decode the JWT token to get the user ID
            // This is a simplified example
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || null;
          } catch (error) {
            console.error('Error parsing token:', error);
            return null;
          }
        }
        
        // Fetch classes for the logged-in teacher
        async function fetchTeacherClasses() {
          const teacherId = getTeacherId();
          if (!teacherId) {
            showError('Please log in to view your classes');
            return [];
          }
          
          try {
            const response = await fetch(`${API_BASE_URL}/teachers/${teacherId}/classes`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.classes || [];
          } catch (error) {
            console.error('Error fetching classes:', error);
            showError('Failed to load classes. Please try again later.');
            return [];
          }
        }
        
        // Load students for selected class
        async function loadStudentsForClass(className) {
          try {
            console.log('Loading students for class:', className);
            
            // Get token from localStorage
            const token = localStorage.getItem('token');
            if (!token) {
              console.error('No authentication token found');
              throw new Error('Authentication token not found');
            }

            // Make API request
            const response = await fetch(`https://timiza-saas.onrender.com/api/students/class/${className}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('API error response:', errorText);
              throw new Error(`Failed to load students: ${response.status} ${response.statusText}`);
            }

            // Parse and validate response
            const students = await response.json();
            console.log('Raw response:', students);
            
            if (!Array.isArray(students)) {
              console.error('Invalid response format:', typeof students);
              throw new Error('Invalid response format - expected array of students');
            }

            // Log the students data
            console.log('Loaded students:', students);
            return students;
          } catch (error) {
            console.error('Error loading students:', error);
            throw error;
          }
        }
        
        // Fetch students for a specific class
        async function fetchClassStudents(className) {
          if (!className) return [];
          
          try {
            // First, get all users with role 'student'
            const response = await fetch(`${API_BASE_URL}/users?role=student`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // Filter students by class
            return Array.isArray(data) 
              ? data.filter(student => 
                  student.profile && 
                  student.profile.class && 
                  student.profile.class.toLowerCase() === className.toLowerCase()
                )
              : [];
          } catch (error) {
            console.error('Error fetching students:', error);
            showError('Failed to load students. Please try again later.');
            return [];
          }
        }
        
        // Fetch detailed student profile
        async function fetchStudentProfile(studentId) {
          if (!studentId) return null;
          
          try {
            const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
          } catch (error) {
            console.error('Error fetching student profile:', error);
            showError('Failed to load student profile. Please try again later.');
            return null;
          }
        }
        
        // Show error message
        function showError(message) {
          const errorDiv = document.getElementById('class-message');
          if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.className = 'alert alert-error';
            
            // Hide after 5 seconds
            setTimeout(() => {
              errorDiv.style.display = 'none';
            }, 5000);
          }
        }
        
        // Show success message
        function showSuccess(message) {
          const successDiv = document.getElementById('class-message');
          if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            successDiv.className = 'alert alert-success';
            
            // Hide after 5 seconds
            setTimeout(() => {
              successDiv.style.display = 'none';
            }, 5000);
          }
        }

        // DOM Elements
        const classList = document.getElementById('class-list');
        const studentList = document.getElementById('student-list');
        const studentProfile = document.getElementById('student-profile');
        
        // Initialize the class list
        async function initializeClassList() {
          classList.innerHTML = '<div class="empty-state">Loading classes...</div>';
          
          try {
            const classes = await fetchTeacherClasses();
            
            if (classes.length === 0) {
              classList.innerHTML = '<div class="empty-state">No classes found</div>';
              return;
            }
            
            classList.innerHTML = ''; // Clear loading message
            
            for (const cls of classes) {
              const classItem = document.createElement('div');
              classItem.className = 'class-item';
              classItem.dataset.classId = cls._id || cls.id;
              
              // Get student count for this class
              const students = await fetchClassStudents(cls._id || cls.id);
              const studentCount = students.length;
              
              classItem.innerHTML = `
                <div class="class-name">${cls.name || 'Unnamed Class'}</div>
                <div class="class-details">
                  <span>${cls.level || 'N/A'} - Section ${cls.section || 'N/A'}</span>
                  <span>${studentCount} ${studentCount === 1 ? 'student' : 'students'}</span>
                </div>
              `;
              
              classItem.addEventListener('click', async () => {
                // Remove active class from all class items
                document.querySelectorAll('.class-item').forEach(item => {
                  item.classList.remove('active');
                });
                
                // Add active class to clicked item
                classItem.classList.add('active');
                
                // Show loading state
                studentList.innerHTML = '<div class="empty-state">Loading students...</div>';
                
                // Load students for this class
                await loadStudents(cls._id || cls.id);
                
                // Clear student profile
                studentProfile.innerHTML = `
                  <div class="empty-profile">
                    <i class="fas fa-user-graduate"></i>
                    <p>Select a student to view profile</p>
                  </div>
                `;
              });
              
              classList.appendChild(classItem);
            }
            
            // Select first class by default if available
            const firstClass = classList.firstElementChild;
            if (firstClass) {
              firstClass.click();
            }
          } catch (error) {
            console.error('Error initializing class list:', error);
            classList.innerHTML = '<div class="empty-state">Error loading classes</div>';
          }
        }
        
        // Load students for a class
        async function loadStudents(classId) {
          if (!classId) {
            studentList.innerHTML = '<div class="empty-state">No class selected</div>';
            return;
          }
          
          try {
            studentList.innerHTML = '<div class="empty-state">Loading students...</div>';
            
            const students = await fetchClassStudents(classId);
            
            if (students.length === 0) {
              studentList.innerHTML = '<div class="empty-state">No students found in this class</div>';
              return;
            }
            
            studentList.innerHTML = ''; // Clear loading message
            
            for (const student of students) {
              const studentItem = document.createElement('div');
              studentItem.className = 'student-item';
              studentItem.dataset.studentId = student._id || student.id;
              
              const firstName = student.firstName || 'Unknown';
              const lastName = student.lastName || '';
              const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
              const studentId = student.studentId || 'N/A';
              
              studentItem.innerHTML = `
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                  <div class="student-name">${firstName} ${lastName}</div>
                  <div class="student-id">ID: ${studentId}</div>
                </div>
              `;
              
              studentItem.addEventListener('click', async () => {
                // Show loading state
                studentProfile.innerHTML = `
                  <div class="empty-profile">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading profile...</p>
                  </div>
                `;
                
                // Fetch and display full student profile
                const fullProfile = await fetchStudentProfile(student._id || student.id);
                if (fullProfile) {
                  displayStudentProfile(fullProfile);
                }
              });
              
              studentList.appendChild(studentItem);
            }
          } catch (error) {
            console.error('Error loading students:', error);
            studentList.innerHTML = '<div class="empty-state">Error loading students</div>';
          }
        }
        
        // Display student profile
        function displayStudentProfile(student) {
          if (!student) {
            studentProfile.innerHTML = `
              <div class="empty-profile">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading student profile</p>
              </div>
            `;
            return;
          }
          
          // Extract student data with fallbacks
          const name = student.name || 'Unknown Student';
          const [firstName, ...lastNameParts] = name.split(' ');
          const lastName = lastNameParts.join(' ');
          const initials = (firstName[0] + (lastName ? lastName[0] : '')).toUpperCase();
          
          // Format dates
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
          
          // Get class information from the selected class dropdown if available
          const classSelect = document.getElementById('class-select');
          const selectedClass = classSelect ? classSelect.options[classSelect.selectedIndex] : null;
          const className = selectedClass ? selectedClass.text : (student.className || 'N/A');
          const classLevel = selectedClass ? selectedClass.parentElement.label : (student.level || 'N/A');
          
          studentProfile.innerHTML = `
            <div class="profile-header">
              <div class="profile-avatar">${initials}</div>
              <div class="profile-details">
                <h3>${name}</h3>
                <p>Student ID: ${student.studentId || 'N/A'}</p>
                ${student.gender ? `<p>Gender: ${student.gender}</p>` : ''}
              </div>
            </div>
            
            <div class="profile-section">
              <h4>Personal Information</h4>
              <div class="info-grid">
                <div class="info-label">Date of Birth:</div>
                <div>${formatDate(student.dob || student.dateOfBirth)}</div>
                
                ${student.gender ? `
                <div class="info-label">Gender:</div>
                <div>${student.gender}</div>
                ` : ''}
                
                ${student.parentName ? `
                <div class="info-label">Parent/Guardian:</div>
                <div>${student.parentName}</div>
                ` : ''}
                
                ${student.parentContact ? `
                <div class="info-label">Parent Contact:</div>
                <div>${student.parentContact}</div>
                ` : ''}
                
                ${student.admissionDate ? `
                <div class="info-label">Admission Date:</div>
                <div>${formatDate(student.admissionDate)}</div>
                ` : ''}
              </div>
            </div>
            
            <div class="profile-section">
              <h4>Contact Information</h4>
              <div class="info-grid">
                <div class="info-label">Email:</div>
                <div>${student.email || 'N/A'}</div>
                
                <div class="info-label">Phone:</div>
                <div>${student.phone || student.parentContact || 'N/A'}</div>
                
                ${student.address ? `
                <div class="info-label">Address:</div>
                <div>${student.address}</div>
                ` : ''}
              </div>
            </div>
            
            <div class="profile-section">
              <h4>Class Information</h4>
              <div class="info-grid">
                <div class="info-label">Class:</div>
                <div>${className}</div>
                
                <div class="info-label">Level:</div>
                <div>${classLevel}</div>
                
                ${student.section ? `
                <div class="info-label">Section:</div>
                <div>${student.section}</div>
                ` : ''}
              </div>
            </div>
            
            ${student.additionalNotes ? `
            <div class="profile-section">
              <h4>Additional Notes</h4>
              <div class="additional-notes">
                ${student.additionalNotes}
              </div>
            </div>` : ''}
            
            <div class="profile-actions">
              <button class="btn btn-primary" id="message-student-btn">
                <i class="fas fa-envelope"></i> Send Message
              </button>
              <button class="btn" id="print-profile-btn">
                <i class="fas fa-print"></i> Print Profile
              </button>
            </div>
            
            <style>
              .additional-notes {
                background: #f8f9fa;
                padding: 12px;
                border-radius: 4px;
                border-left: 3px solid #4a6cf7;
                font-size: 0.95em;
                line-height: 1.5;
              }
              
              .info-grid {
                display: grid;
                grid-template-columns: 150px 1fr;
                gap: 10px 15px;
              }
              
              .info-label {
                color: #666;
                font-weight: 500;
              }
            </style>
          `;
          
          // Add event listeners to the action buttons
          const messageBtn = document.getElementById('message-student-btn');
          if (messageBtn) {
            messageBtn.addEventListener('click', () => {
              // Implement message functionality
              alert(`Message student: ${firstName} ${lastName} (${email || phone || 'No contact info'})`);
            });
          }
          
          const printBtn = document.getElementById('print-profile-btn');
          if (printBtn) {
            printBtn.addEventListener('click', () => {
              // Implement print functionality
              window.print();
            });
          }
        }
        
        // Get class select element
        const classSelect = document.getElementById('class-select');
        
        // Add event listener for class selection
        if (classSelect) {
          classSelect.addEventListener('change', async function() {
            const classId = this.value;
            if (!classId) {
              studentList.innerHTML = '<div class="empty-state">Select a class to view students</div>';
              return;
            }
            
            // Show loading state
            studentList.innerHTML = '<div class="empty-state">Loading students...</div>';
            
            try {
              // Fetch students for the selected class from the backend
              const students = await fetchClassStudents(classId);
              
              if (students.length === 0) {
                studentList.innerHTML = '<div class="empty-state">No students found in this class</div>';
                return;
              }
              
              // Transform student data to match the expected format
              const formattedStudents = students.map(student => ({
                id: student._id,
                name: student.name || 'Unknown Student',
                email: student.email || 'N/A',
                gender: student.profile?.gender || 'Not specified',
                dob: student.profile?.dob ? new Date(student.profile.dob).toLocaleDateString() : 'N/A',
                address: student.profile?.address || 'N/A',
                className: student.profile?.class || 'N/A',
                parentName: student.profile?.emergencyContact?.name || 'N/A',
                parentContact: student.profile?.emergencyContact?.phone || 'N/A',
                parentRelationship: student.profile?.emergencyContact?.relationship || 'N/A',
                allergies: student.profile?.health?.allergies?.join(', ') || 'None',
                medicalConditions: student.profile?.health?.medicalConditions?.join(', ') || 'None',
                medications: student.profile?.health?.medications?.join(', ') || 'None',
                // Include all other student properties
                ...student
              }));
              
              // Display students
              displayStudents(formattedStudents);
              
            } catch (error) {
              console.error('Error loading students:', error);
              showError('Failed to load students. Please try again.');
              studentList.innerHTML = '<div class="empty-state">Error loading students</div>';
            }
          });
        }
        
        // Function to display students in the list
        function displayStudents(students) {
          if (!students || students.length === 0) {
            studentList.innerHTML = '<div class="empty-state">No students found in this class</div>';
            return;
          }
          
          studentList.innerHTML = ''; // Clear previous content
          
          students.forEach(student => {
            const studentItem = document.createElement('div');
            studentItem.className = 'student-item';
            studentItem.dataset.studentId = student.id;
            
            studentItem.innerHTML = `
              <div class="student-avatar">${student.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>
              <div class="student-info">
                <div class="student-name">${student.name}</div>
                <div class="student-id">${student.studentId}</div>
              </div>
            `;
            
            // Add click event to show student profile
            studentItem.addEventListener('click', () => {
              // Remove active class from all student items
              document.querySelectorAll('.student-item').forEach(item => {
                item.classList.remove('active');
              });
              
              // Add active class to clicked item
              studentItem.classList.add('active');
              
              // Display student profile
              displayStudentProfile(student);
            });
            
            studentList.appendChild(studentItem);
          });
        }
        
        // Initialize the application when the page loads
        document.addEventListener('DOMContentLoaded', async function() {
          try {
            // Check if user is authenticated
            const token = localStorage.getItem('token');
            if (!token) {
              // Redirect to login if not authenticated
              window.location.href = '/login.html';
              return;
            }
            
            // Show loading state
            const classList = document.getElementById('class-list');
            if (classList) {
              classList.innerHTML = '<div class="empty-state">Loading your classes...</div>';
            }
            
            // Initialize the class list
            await initializeClassList();
            
            // Add event listener for the "Add New Class" button
            const addClassBtn = document.getElementById('add-class-btn');
            if (addClassBtn) {
              addClassBtn.addEventListener('click', function() {
                // This would open a modal or navigate to a new page in a real app
                const classModal = document.getElementById('class-modal');
                if (classModal) {
                  // Reset form
                  const form = classModal.querySelector('form');
                  if (form) form.reset();
                  
                  // Set modal title
                  const title = classModal.querySelector('.modal-title');
                  if (title) title.textContent = 'Add New Class';
                  
                  // Show modal
                  classModal.style.display = 'block';
                  document.body.style.overflow = 'hidden';
                }
              });
            }
            
            // Add event listener for closing the class modal
            const closeModalBtns = document.querySelectorAll('.close-btn, .modal .close');
            closeModalBtns.forEach(btn => {
              btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) {
                  modal.style.display = 'none';
                  document.body.style.overflow = '';
                }
              });
            });
            
            // Close modal when clicking outside
            window.addEventListener('click', function(event) {
              if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
                document.body.style.overflow = '';
              }
            });
            
            // Handle class form submission
            const classForm = document.getElementById('class-form');
            if (classForm) {
              classForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = new FormData(this);
                const classData = {
                  name: formData.get('className'),
                  level: formData.get('level'),
                  section: formData.get('section'),
                  capacity: parseInt(formData.get('capacity') || '30'),
                  teacherInCharge: formData.get('teacherInCharge'),
                  roomNumber: formData.get('roomNumber'),
                  academicYear: formData.get('academicYear'),
                  notes: formData.get('notes')
                };
                
                try {
                  // Show loading state
                  const submitBtn = this.querySelector('button[type="submit"]');
                  const originalText = submitBtn.innerHTML;
                  submitBtn.disabled = true;
                  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                  
                  // In a real app, you would send this data to your API
                  console.log('Submitting class data:', classData);
                  
                  // Simulate API call
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Show success message
                  showSuccess('Class created successfully!');
                  
                  // Close modal
                  const modal = this.closest('.modal');
                  if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                  }
                  
                  // Refresh class list
                  await initializeClassList();
                  
                } catch (error) {
                  console.error('Error creating class:', error);
                  showError('Failed to create class. Please try again.');
                } finally {
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                  }
                }
              });
            }
            
          } catch (error) {
            console.error('Error initializing application:', error);
            showError('Failed to initialize application. Please refresh the page.');
          }
        });
          const timetableBody = document.querySelector('.timetable-body');
          const currentWeekElement = document.getElementById('current-week');
          
          // Get current teacher ID from JWT token
          function getCurrentTeacherId() {
            try {
              // First try to get from userData in localStorage
              const userData = localStorage.getItem('userData');
              if (userData) {
                const parsedUserData = JSON.parse(userData);
                if (parsedUserData && parsedUserData.id) {
                  console.log('Got teacher ID from userData:', parsedUserData.id);
                  return parsedUserData.id;
                }
              }
              
              // Fallback to JWT token
              const token = localStorage.getItem('token');
              if (!token) {
                console.error('No JWT token found');
                window.location.href = '/login.html';
                return null;
              }
              
              // Decode JWT token
              const base64Url = token.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const payload = JSON.parse(atob(base64));
              
              // Try different possible ID fields
              const teacherId = payload.sub || payload.userId || payload.id || payload.user_id;
              
              if (!teacherId) {
                console.error('No user ID found in token or userData');
                console.log('Token payload:', payload);
                window.location.href = '/login.html';
                return null;
              }
              
              console.log('Got teacher ID from token:', teacherId);
              return teacherId.toString(); // Ensure it's a string
              
            } catch (error) {
              console.error('Error getting teacher ID:', error);
              window.location.href = '/login.html';
              return null;
            }
          }
          
          const currentTeacherId = getCurrentTeacherId();
          if (!currentTeacherId) {
            console.error('Failed to get teacher ID');
            // Handle error (e.g., redirect to login)
          }
          
          console.log('=== Initializing timetable for teacher:', currentTeacherId, '===');
          
          // Initialize empty arrays and objects
          let timetableData = {};
          let timetableEntries = [];
          
          // Try to load teacher-specific timetable data
          const teacherTimetableKey = `timetable_${currentTeacherId}`;
          console.log('Looking for timetable data with key:', teacherTimetableKey);
          
          // List all keys in localStorage for debugging
          console.log('All localStorage keys:', Object.keys(localStorage));
          
          const savedTimetableData = localStorage.getItem(teacherTimetableKey);
          
          if (savedTimetableData) {
            console.log('Found saved timetable data, parsing...');
            try {
              const parsedData = JSON.parse(savedTimetableData);
              console.log('Parsed timetable data:', parsedData);
              
              // Ensure we have the expected structure
              if (parsedData && typeof parsedData === 'object') {
                timetableData = parsedData.timetableData || {};
                timetableEntries = Array.isArray(parsedData.timetableEntries) ? 
                  parsedData.timetableEntries : [];
                
                console.log(`Loaded ${timetableEntries.length} entries for teacher ${currentTeacherId}`);
                
                // Log first few entries for verification
                if (timetableEntries.length > 0) {
                  console.log('Sample entries:', timetableEntries.slice(0, 2));
                }
              } else {
                console.warn('Unexpected data format in saved timetable');
              }
            } catch (e) {
              console.error('Error parsing saved timetable data:', e);
            }
          } else {
            console.log('No saved timetable data found for this teacher');
          }
          
          // Make sure we have arrays and filter out any entries not belonging to this teacher
          if (!Array.isArray(timetableEntries)) {
            console.warn('Invalid timetable entries, initializing empty array');
            timetableEntries = [];
          } else {
            // Double-check all entries belong to this teacher (sanity check)
            const initialCount = timetableEntries.length;
            timetableEntries = timetableEntries.filter(entry => {
              const isValid = entry && entry.teacherId === currentTeacherId;
              if (!isValid) {
                console.warn('Filtered out invalid/foreign entry:', entry);
              }
              return isValid;
            });
            
            if (timetableEntries.length !== initialCount) {
              console.warn(`Filtered out ${initialCount - timetableEntries.length} invalid/foreign entries`);
            }
          }
          
          // Rebuild timetableData based on filtered entries
          console.log('Rebuilding timetable data from', timetableEntries.length, 'entries');
          
          // First, clear any existing data
          timetableData = {};
          
          timetableEntries.forEach((entry, index) => {
            if (!entry || !entry.startTime || !entry.day) {
              console.warn('Skipping invalid entry at index', index, ':', entry);
              return;
            }
            
            console.log(`Processing entry ${index + 1}/${timetableEntries.length}:`, entry);
            
            // Ensure we have a slot for this start time
            if (!timetableData[entry.startTime]) {
              console.log(`Creating new time slot for ${entry.startTime}`);
              timetableData[entry.startTime] = {
                endTime: entry.endTime || '',
                monday: '',
                tuesday: '',
                wednesday: '',
                thursday: '',
                friday: ''
              };
            }
            
            const slot = timetableData[entry.startTime];
            const subject = entry.subject ? 
              (entry.subject.charAt(0).toUpperCase() + entry.subject.slice(1)) : 'Unknown';
            const className = entry.class ? 
              entry.class.replace(/-/g, ' ').replace(/\bgrade\b/gi, 'Grade').replace(/\bform\b/gi, 'Form') : 
              'Unknown';
              
            console.log(`Setting ${entry.day} at ${entry.startTime} to ${subject} (${className})`);
            slot[entry.day] = `${subject} (${className})`;
            
            if (entry.endTime) {
              slot.endTime = entry.endTime;
            }
          });
          
          console.log('Final timetable data structure:', timetableData);
          
          // Save data to localStorage
          function saveTimetableData() {
            try {
              // Save the complete state for this teacher
              const teacherTimetableKey = `timetable_${currentTeacherId}`;
              const dataToSave = {
                timetableData: timetableData,
                timetableEntries: timetableEntries,
                lastUpdated: new Date().toISOString()
              };
              
              localStorage.setItem(teacherTimetableKey, JSON.stringify(dataToSave));
              console.log('Saved teacher timetable data');
            } catch (error) {
              console.error('Error saving timetable data:', error);
            }
          }

          // Function to add a new time slot with start and end time
          function addTimeSlot(startTime, endTime) {
            if (!timetableData[startTime]) {
              timetableData[startTime] = {
                endTime: endTime || '',
                monday: '',
                tuesday: '',
                wednesday: '',
                thursday: '',
                friday: ''
              };
              saveTimetableData();
              return true;
            }
            return false;
          }
          
          // Add default breaks if they don't exist
          function initializeBreaks() {
            if (!timetableData['10:00']) {
              addTimeSlot('10:00', '10:30');
              const breakData = timetableData['10:00'];
              breakData.monday = breakData.tuesday = breakData.wednesday = breakData.thursday = breakData.friday = 'Break';
            }
            
            if (!timetableData['11:50']) {
              addTimeSlot('11:50', '12:30');
              const lunchData = timetableData['11:50'];
              lunchData.monday = lunchData.tuesday = lunchData.wednesday = lunchData.thursday = lunchData.friday = 'Lunch';
            }
            
            // Save after initializing breaks
            saveTimetableData();
          }
          
          // Initialize with breaks
          initializeBreaks();
          

          
          // Round time to nearest 30 minutes
          function roundToNearest30(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            const roundedMinutes = Math.round(totalMinutes / 30) * 30;
            const roundedHours = Math.floor(roundedMinutes / 60);
            const finalMinutes = roundedMinutes % 60;
            return `${String(roundedHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
          }
          
          // Add a new entry to the timetable
          function addTimetableEntry(entry) {
            console.log('Adding timetable entry for teacher', currentTeacherId, ':', entry);
            
            // Add teacher ID and ensure entry has required fields
            const newEntry = {
              ...entry,
              id: entry.id || `entry-${Date.now()}`,
              teacherId: currentTeacherId,
              createdAt: new Date().toISOString()
            };
            
            // Add to entries array if it doesn't exist
            const exists = timetableEntries.some(e => 
              e.id === newEntry.id || 
              (e.day === newEntry.day && 
               e.startTime === newEntry.startTime &&
               e.teacherId === currentTeacherId)
            );
            
            if (!exists) {
              timetableEntries.push(newEntry);
              console.log('Added new entry:', newEntry);
              
              // Save to localStorage
              saveTimetableData();
              
              // Update the timetable data and UI
              updateTimetableData();
              generateTimetable();
            } else {
              console.log('Entry already exists, not adding duplicate');
            }
          }
          
          // Update timetable data from entries
          function updateTimetableData() {
            console.log('Updating timetable with entries:', timetableEntries);
            
            // Reset all slots except breaks and lunch
            Object.keys(timetableData).forEach(time => {
              if (time !== '10:00' && time !== '11:50') {
                const slot = timetableData[time];
                slot.monday = slot.tuesday = slot.wednesday = slot.thursday = slot.friday = '';
              }
            });
            
            // Add entries to the timetable
            timetableEntries.forEach(entry => {
              console.log('Processing entry:', entry);
              
              // Ensure the time slot exists
              if (!timetableData[entry.startTime]) {
                console.log('Creating new time slot for', entry.startTime);
                addTimeSlot(entry.startTime, entry.endTime || '');
              }
              
              const slot = timetableData[entry.startTime];
              if (slot) {
                const subject = entry.subject.charAt(0).toUpperCase() + entry.subject.slice(1);
                const className = entry.class.replace(/-/g, ' ').replace(/\bgrade\b/gi, 'Grade').replace(/\bform\b/gi, 'Form');
                const day = entry.day.toLowerCase();
                
                console.log(`Setting ${day} at ${entry.startTime} to ${subject} (${className})`);
                slot[day] = `${subject} (${className})`;
                
                // Ensure end time is set if provided
                if (entry.endTime) {
                  slot.endTime = entry.endTime;
                }
              }
            });
            
            console.log('Updated timetable data:', timetableData);
          }
          
          // Generate timetable with days as rows and time slots as columns
          function generateTimetable() {
            if (!timetableBody) {
              console.error('Timetable body element not found');
              return;
            }
            
            console.log('Generating timetable with data:', timetableData);
            
            // Clear existing content
            timetableBody.innerHTML = '';
            
            // Sort times to ensure correct order (convert to minutes for proper sorting)
            // and filter out specific time slots, then take first 13 columns
            const sortedTimes = Object.keys(timetableData)
              .filter(time => !['10:00', '11:50'].includes(time)) // Remove specific time slots
              .sort((a, b) => {
                const [aH, aM] = a.split(':').map(Number);
                const [bH, bM] = b.split(':').map(Number);
                return (aH * 60 + aM) - (bH * 60 + bM);
              })
              .slice(0, 12); // Take first 12 time slots (plus day column = 13 total columns)
            
            console.log('Sorted times:', sortedTimes);
            
            // Create table element
            const table = document.createElement('table');
            table.className = 'timetable';
            
            // Add delete handlers for columns and rows
            let isDeleteMode = false;
            
            function toggleDeleteMode() {
              isDeleteMode = !isDeleteMode;
              const deleteBtn = document.getElementById('toggleDeleteMode');
              if (deleteBtn) {
                deleteBtn.textContent = isDeleteMode ? 'Exit Delete Mode' : 'Delete Mode';
                deleteBtn.className = isDeleteMode ? 'btn btn-danger' : 'btn btn-secondary';
              }
              document.body.classList.toggle('delete-mode', isDeleteMode);
            }
            
            function deleteTimeSlot(time) {
              if (confirm(`Are you sure you want to delete the ${time} time slot? This will remove all classes at this time.`)) {
                delete timetableData[time];
                saveTimetableData();
                generateTimetable();
              }
            }
            
            function deleteDay(dayId) {
              const dayName = document.querySelector(`[data-day="${dayId}"]`).textContent;
              if (confirm(`Are you sure you want to clear all classes on ${dayName}?`)) {
                Object.keys(timetableData).forEach(time => {
                  if (timetableData[time][dayId]) {
                    delete timetableData[time][dayId];
                  }
                });
                saveTimetableData();
                generateTimetable();
              }
            }
            
            // Add delete mode toggle button
            const controlsRow = document.createElement('div');
            controlsRow.className = 'mb-3';
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'toggleDeleteMode';
            deleteBtn.className = 'btn btn-secondary';
            deleteBtn.textContent = 'Delete Mode';
            deleteBtn.onclick = toggleDeleteMode;
            controlsRow.appendChild(deleteBtn);
            timetableBody.parentNode.insertBefore(controlsRow, timetableBody);
            
            // Create header row with time slots as columns
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headerRow.innerHTML = '<th>Day/Time</th>';
            
            // Add time slot headers
            sortedTimes.forEach(time => {
              const slot = timetableData[time];
              const timeHeader = document.createElement('th');
              timeHeader.textContent = `${time}${slot.endTime ? ' - ' + slot.endTime : ''}`;
              timeHeader.className = 'time-header';
              timeHeader.onclick = (e) => {
                if (isDeleteMode && !e.target.classList.contains('delete-column')) {
                  deleteTimeSlot(time);
                }
              };
              
              if (isDeleteMode) {
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-column';
                deleteBtn.innerHTML = ' ×';
                deleteBtn.title = 'Delete this time slot';
                timeHeader.appendChild(deleteBtn);
              }
              headerRow.appendChild(timeHeader);
            });
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            
            // Create rows for each day
            const days = [
              { id: 'monday', name: 'Monday' },
              { id: 'tuesday', name: 'Tuesday' },
              { id: 'wednesday', name: 'Wednesday' },
              { id: 'thursday', name: 'Thursday' },
              { id: 'friday', name: 'Friday' }
            ];
            
            days.forEach(day => {
              const row = document.createElement('tr');
              
              // Add day cell
              const dayCell = document.createElement('td');
              dayCell.className = 'day-cell';
              dayCell.setAttribute('data-day', day.id);
              dayCell.textContent = day.name;
              dayCell.onclick = (e) => {
                if (isDeleteMode && !e.target.classList.contains('delete-row')) {
                  deleteDay(day.id);
                }
              };
              
              if (isDeleteMode) {
                const deleteBtn = document.createElement('span');
                deleteBtn.className = 'delete-row';
                deleteBtn.innerHTML = ' ×';
                deleteBtn.title = 'Clear this day';
                dayCell.appendChild(deleteBtn);
              }
              row.appendChild(dayCell);
              
              // Add class cells for each time slot
              sortedTimes.forEach(time => {
                const slot = timetableData[time];
                const classCell = document.createElement('td');
                classCell.className = 'class-cell';
                
                const cls = slot[day.id] || '';
                
                if (cls) {
                  const classSlot = document.createElement('div');
                  const subject = cls.split(' ')[0].toLowerCase();
                  const className = cls.substring(0, cls.indexOf('(')).trim();
                  
                  classSlot.className = `class-slot class-${subject}`;
                  classSlot.title = `Click to view details for ${cls}`;
                  
                  // Add delete button
                  const deleteBtn = document.createElement('button');
                  deleteBtn.className = 'delete-btn';
                  deleteBtn.innerHTML = '&times;';
                  deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Are you sure you want to remove ${cls}?`)) {
                      delete timetableData[time][day.id];
                      
                      // Find and remove the entry
                      const entryIndex = timetableEntries.findIndex(entry => 
                        entry.day === day.id && 
                        entry.startTime === time &&
                        entry.subject.toLowerCase() === className.toLowerCase()
                      );
                      
                      if (entryIndex > -1) {
                        timetableEntries.splice(entryIndex, 1);
                        saveTimetableData();
                        updateTimetableData();
                        generateTimetable();
                      }
                    }
                  };
                  
                  classSlot.textContent = className;
                  classSlot.appendChild(deleteBtn);
                  
                  classSlot.onclick = () => {
                    alert(`Class: ${className}\nTime: ${time}${slot.endTime ? ' - ' + slot.endTime : ''}\nDay: ${day.name}`);
                  };
                  
                  classCell.appendChild(classSlot);
                }
                
                // Add click handler to add new entries
                classCell.onclick = (e) => {
                  if (e.target === classCell) {
                    document.getElementById('timetable-day').value = day.id;
                    document.getElementById('timetable-start-time').value = time;
                    if (slot.endTime) {
                      document.getElementById('timetable-end-time').value = slot.endTime;
                    }
                    document.getElementById('create-timetable-modal').style.display = 'block';
                    document.getElementById('timetable-subject').focus();
                  }
                };
                
                row.appendChild(classCell);
              });
              
              tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            timetableBody.appendChild(table);
            
            // Add styles if they don't exist
            if (!document.getElementById('timetable-styles')) {
              const style = document.createElement('style');
              style.id = 'timetable-styles';
              style.textContent = `
                .timetable {
                  width: 100%;
                  table-layout: fixed;
                  border-collapse: collapse;
                  margin: 20px 0;
                  font-size: 0.8em;
                  background: white;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .timetable th, .timetable td {
                  border: 1px solid #e0e0e0;
                  padding: 6px 4px;
                  text-align: center;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
                .timetable th {
                  background-color: #f8f9fa;
                  font-weight: bold;
                  white-space: nowrap;
                  font-size: 0.85em;
                }
                .timetable th:first-child {
                  width: 120px; /* Slightly wider for delete button */
                }
                .delete-mode .time-header,
                .delete-mode .day-cell {
                  position: relative;
                  cursor: pointer;
                }
                .delete-mode .time-header:hover,
                .delete-mode .day-cell:hover {
                  background-color: #ffebee;
                }
                .delete-column,
                .delete-row {
                  color: #dc3545;
                  font-weight: bold;
                  cursor: pointer;
                  margin-left: 5px;
                  font-size: 1.2em;
                  line-height: 1;
                  display: inline-block;
                  vertical-align: middle;
                }
                .delete-column:hover,
                .delete-row:hover {
                  color: #b02a37;
                }
                .day-cell {
                  background-color: #f8f9fa;
                  font-weight: bold;
                  white-space: nowrap;
                }
                .class-cell {
                  min-width: 150px;
                  height: 80px;
                  vertical-align: top;
                  cursor: pointer;
                  transition: background-color 0.2s;
                }
                .class-cell:hover {
                  background-color: #f8f9fa;
                }
                .class-slot {
                  background-color: #e3f2fd;
                  border-left: 4px solid #1976d2;
                  padding: 8px;
                  margin: 2px 0;
                  border-radius: 4px;
                  cursor: pointer;
                  transition: all 0.2s;
                  position: relative;
                  height: 100%;
                  box-sizing: border-box;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                  align-items: center;
                  text-align: center;
                }
                .class-slot:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }

                .delete-btn {
                  position: absolute;
                  top: 2px;
                  right: 2px;
                  background: rgba(0,0,0,0.1);
                  border: none;
                  border-radius: 50%;
                  width: 18px;
                  height: 18px;
                  line-height: 16px;
                  text-align: center;
                  padding: 0;
                  cursor: pointer;
                  opacity: 0;
                  transition: opacity 0.2s;
                }
                .class-slot:hover .delete-btn {
                  opacity: 1;
                }
                .delete-btn:hover {
                  background: rgba(0,0,0,0.2);
                }
              `;
              document.head.appendChild(style);
            }
          }
          
          function getDayName(index) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            return days[index];
          }
          
          // Initialize timetable with any existing entries
          updateTimetableData();
          generateTimetable();
          
          // Add event listeners for clear time buttons
          document.querySelectorAll('.clear-time-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              const targetId = this.getAttribute('data-target');
              const input = document.getElementById(targetId);
              if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input')); // Trigger any input event listeners
              }
            });
          });
          
          // Log the current state for debugging
          console.log('Initial timetable data:', timetableData);
          console.log('Initial entries:', timetableEntries);
          
          // Add a button to add new time slots
          const addTimeSlotBtn = document.createElement('button');
          addTimeSlotBtn.textContent = 'Add Time Slot';
          addTimeSlotBtn.className = 'btn btn-secondary';
          addTimeSlotBtn.style.marginLeft = '10px';
          addTimeSlotBtn.onclick = function() {
            const timeInput = prompt('Enter time slot (e.g., 09:00 or 09:00-09:35):\nFor a range, use format: 09:00-09:35');
            if (timeInput) {
              const timeParts = timeInput.split('-').map(part => part.trim());
              const startTime = timeParts[0];
              const endTime = timeParts[1] || '';
              
              // Validate start time
              if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
                alert('Please enter a valid start time in HH:MM format (e.g., 09:00)');
                return;
              }
              
              // Validate end time if provided
              if (endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
                alert('Please enter a valid end time in HH:MM format (e.g., 09:35)');
                return;
              }
              
              if (addTimeSlot(startTime, endTime)) {
                generateTimetable();
              } else {
                alert('This time slot already exists');
              }
            }
          };
          
          // Add the button next to Create Timetable button
          const createBtn = document.getElementById('create-timetable-btn');
          if (createBtn && createBtn.parentNode) {
            createBtn.parentNode.insertBefore(addTimeSlotBtn, createBtn.nextSibling);
          }
          
          // Navigation between weeks
          document.getElementById('prev-week').addEventListener('click', () => {
            // In a real app, this would load the previous week's data
            alert('Loading previous week...');
          });
          
          document.getElementById('next-week').addEventListener('click', () => {
            // In a real app, this would load the next week's data
            alert('Loading next week...');
          });
          
          // Timetable Modal Functionality
          const timetableModal = document.getElementById('create-timetable-modal');
          const closeTimetableModal = document.getElementById('close-timetable-modal');
          const createTimetableBtn = document.getElementById('create-timetable-btn');
          const timetableForm = document.getElementById('timetable-entry-form');
          
          // Open modal
          if (createTimetableBtn && timetableModal) {
            createTimetableBtn.addEventListener('click', function(e) {
              e.preventDefault();
              timetableModal.style.display = 'block';
              document.body.style.overflow = 'hidden';
              console.log('Timetable modal opened');
            });
          } else {
            console.error('Create Timetable button or modal not found');
          }
          
          // Close modal
          if (closeTimetableModal) {
            closeTimetableModal.addEventListener('click', function() {
              timetableModal.style.display = 'none';
              document.body.style.overflow = '';
            });
          }
          
          // Close when clicking outside
          timetableModal.addEventListener('click', function(e) {
            if (e.target === this) {
              this.style.display = 'none';
              document.body.style.overflow = '';
            }
          });
          
          // Close with Escape key
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && timetableModal.style.display === 'block') {
              timetableModal.style.display = 'none';
              document.body.style.overflow = '';
            }
          });
          
          // Handle form submission
          if (timetableForm) {
            timetableForm.addEventListener('submit', (e) => {
              e.preventDefault();
              
              try {
                // Get form values
                const selectedClass = document.getElementById('timetable-class').value;
                const subject = document.getElementById('timetable-subject').value.trim();
                const day = document.getElementById('timetable-day').value;
                const startTime = document.getElementById('timetable-start-time').value;
                const endTime = document.getElementById('timetable-end-time').value;
                const room = document.getElementById('timetable-room').value.trim() || 'TBD';
                
                // Validate required fields
                if (!selectedClass || !subject || !day || !startTime) {
                  throw new Error('Please fill in all required fields');
                }
                
                // Generate a unique ID for this entry
                const entryId = 'entry-' + Date.now();
                
                // Create the entry object
                const newEntry = {
                  id: entryId,
                  class: selectedClass,
                  subject: subject.toLowerCase(),
                  day: day.toLowerCase(),
                  startTime: startTime,
                  endTime: endTime || '',
                  room: room
                };
                
                console.log('New timetable entry:', newEntry);
                
                // Add to timetable and update UI
                addTimetableEntry(newEntry);
                
                // Close the modal
                if (timetableModal) {
                  timetableModal.style.display = 'none';
                  document.body.style.overflow = '';
                }
                
                // Reset the form
                timetableForm.reset();
                
                // Show success message
                alert('Timetable entry created successfully!');
                
              } catch (error) {
                console.error('Error creating timetable entry:', error);
                alert(error.message || 'Failed to create timetable entry. Please try again.');
              }
            });
          }
        });


         <!-- Sidebar Toggle Script -->
    document.addEventListener('DOMContentLoaded', function() {
      // Sidebar toggle functionality
      const sidebar = document.querySelector('.sidebar');
      const sidebarToggle = document.querySelector('.sidebar-toggle');
      const mainContent = document.querySelector('.main-content');
      
      // Toggle sidebar on button click
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
          sidebar.classList.toggle('active');
          document.body.classList.toggle('sidebar-active');
        });
      }
      
      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', function(event) {
        const isClickInside = sidebar.contains(event.target) || 
                            (sidebarToggle && sidebarToggle.contains(event.target));
        
        if (!isClickInside && window.innerWidth <= 1024) {
          sidebar.classList.remove('active');
          document.body.classList.remove('sidebar-active');
        }
      });
      
      // Tab switching functionality
      const tabLinks = document.querySelectorAll('.tab-link');
      const tabSections = document.querySelectorAll('.tab-section');
      
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          // Don't prevent default for links that have onclick handlers
          if (!this.getAttribute('onclick')) {
            e.preventDefault();
          }
          
          const targetTab = this.getAttribute('data-tab');
          
          // Remove active class from all links
          tabLinks.forEach(l => l.classList.remove('active'));
          // Add active class to clicked link
          this.classList.add('active');
          
          // Hide all sections
          tabSections.forEach(section => {
            section.style.display = 'none';
          });
          
          // Show target section
          const targetSection = document.getElementById(targetTab);
          if (targetSection) {
            targetSection.style.display = 'block';
          }
          
          // Close sidebar on mobile after clicking a link
          if (window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
            document.body.classList.remove('sidebar-active');
          }
        });
      });
      
      // Show first section by default if none is active
      const activeTab = document.querySelector('.tab-link.active');
      if (activeTab) {
        activeTab.click();
      } else if (tabLinks.length > 0) {
        tabLinks[0].classList.add('active');
        const firstSection = document.querySelector('.tab-section');
        if (firstSection) firstSection.style.display = 'block';
      }
    });


       // Kenyan curriculum subjects by level
    const subjectsByLevel = {
      'Grade 1': [
        'English', 'Kiswahili', 'Mathematics', 'Environmental Activities', 
        'Hygiene and Nutrition', 'Religious Education', 'Creative Activities'
      ],
      'Grade 2': [
        'English', 'Kiswahili', 'Mathematics', 'Environmental Activities', 
        'Hygiene and Nutrition', 'Religious Education', 'Creative Activities'
      ],
      'Grade 3': [
        'English', 'Kiswahili', 'Mathematics', 'Environmental Activities', 
        'Hygiene and Nutrition', 'Religious Education', 'Creative Activities'
      ],
      'Grade 4': [
        'English', 'Kiswahili', 'Mathematics', 'Science and Technology', 
        'Social Studies', 'Religious Education', 'Creative Arts and Sports',
        'Agriculture', 'Home Science', 'Life Skills'
      ],
      'Grade 5': [
        'English', 'Kiswahili', 'Mathematics', 'Science and Technology', 
        'Social Studies', 'Religious Education', 'Creative Arts and Sports',
        'Agriculture', 'Home Science', 'Life Skills'
      ],
      'Grade 6': [
        'English', 'Kiswahili', 'Mathematics', 'Science and Technology', 
        'Social Studies', 'Religious Education', 'Creative Arts and Sports',
        'Agriculture', 'Home Science', 'Life Skills'
      ],
      'Grade 7': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Health Education', 'Pre-Technical Studies', 'Computer Studies', 'Business Studies', 'Agriculture', 'Life Skills', 'Sports and Physical Education', 'Religious Education', 'Social Studies', 'Performing Arts', 'Visual Arts', 'Home Science', 'Foreign Languages'],
      'Grade 8': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Health Education', 'Pre-Technical Studies', 'Computer Studies', 'Business Studies', 'Agriculture', 'Life Skills', 'Sports and Physical Education', 'Religious Education', 'Social Studies', 'Performing Arts', 'Visual Arts', 'Home Science', 'Foreign Languages'],
      'Grade 9': ['English', 'Kiswahili', 'Mathematics', 'Integrated Science', 'Health Education', 'Pre-Technical Studies', 'Computer Studies', 'Business Studies', 'Agriculture', 'Life Skills', 'Sports and Physical Education', 'Religious Education', 'Social Studies', 'Performing Arts', 'Visual Arts', 'Home Science', 'Foreign Languages'],
      'Form 1': ['English', 'Kiswahili', 'Mathematics', 'Biology', 'Physics', 'Chemistry', 'Geography', 'History', 'CRE', 'IRE', 'HRE', 'Business Studies', 'Agriculture', 'Computer Studies', 'Home Science', 'Art and Design', 'Music', 'French', 'German', 'Arabic', 'Sign Language', 'Aviation Technology', 'Marine and Fisheries', 'Wood Technology', 'Electrical Technology', 'Metal Technology', 'Power Mechanics', 'Building Construction', 'Drawing and Design', 'Electricity', 'Clothing and Textiles', 'Food and Nutrition'],
      'Form 2': ['English', 'Kiswahili', 'Mathematics', 'Biology', 'Physics', 'Chemistry', 'Geography', 'History', 'CRE', 'IRE', 'HRE', 'Business Studies', 'Agriculture', 'Computer Studies', 'Home Science', 'Art and Design', 'Music', 'French', 'German', 'Arabic', 'Sign Language', 'Aviation Technology', 'Marine and Fisheries', 'Wood Technology', 'Electrical Technology', 'Metal Technology', 'Power Mechanics', 'Building Construction', 'Drawing and Design', 'Electricity', 'Clothing and Textiles', 'Food and Nutrition'],
      'Form 3': ['English', 'Kiswahili', 'Mathematics', 'Biology', 'Physics', 'Chemistry', 'Geography', 'History', 'CRE', 'IRE', 'HRE', 'Business Studies', 'Agriculture', 'Computer Studies', 'Home Science', 'Art and Design', 'Music', 'French', 'German', 'Arabic', 'Sign Language', 'Aviation Technology', 'Marine and Fisheries', 'Wood Technology', 'Electrical Technology', 'Metal Technology', 'Power Mechanics', 'Building Construction', 'Drawing and Design', 'Electricity', 'Clothing and Textiles', 'Food and Nutrition'],
      'Form 4': ['English', 'Kiswahili', 'Mathematics', 'Biology', 'Physics', 'Chemistry', 'Geography', 'History', 'CRE', 'IRE', 'HRE', 'Business Studies', 'Agriculture', 'Computer Studies', 'Home Science', 'Art and Design', 'Music', 'French', 'German', 'Arabic', 'Sign Language', 'Aviation Technology', 'Marine and Fisheries', 'Wood Technology', 'Electrical Technology', 'Metal Technology', 'Power Mechanics', 'Building Construction', 'Drawing and Design', 'Electricity', 'Clothing and Textiles', 'Food and Nutrition']
    };

    // Function to load subjects based on selected class
    function loadSubjectsForClass(className) {
      console.log('Loading subjects for class:', className);
      const marksEntryContainer = document.getElementById('marks-entry-container');
      const marksEntryBody = document.getElementById('marks-entry-body');
      
      if (!marksEntryContainer || !marksEntryBody) {
        console.error('Marks entry container or body not found');
        return;
      }
      
      try {
        // Clear any saved marks data for the current class
        const savedMarksKey = `savedMarks_${className}`;
        localStorage.removeItem(savedMarksKey);
        console.log('Cleared saved marks data for class:', className);
      } catch (e) {
        console.error('Error clearing saved marks data:', e);
      }
      
      // Clear existing subjects
      marksEntryBody.innerHTML = '';
      
      // Get subjects for the class
      const subjects = subjectsByLevel[className];
      console.log('Loading subjects for', className, ':', subjects);
      
      if (!subjects || subjects.length === 0) {
        console.error('No subjects defined for class:', className);
        marksEntryBody.innerHTML = '<tr><td colspan="3">No subjects found for this class.</td></tr>';
        return;
      }
      
      // Create table rows for each subject
      const fragment = document.createDocumentFragment();
      
      subjects.forEach((subject) => {
        const row = document.createElement('tr');
        const subjectId = subject.replace(/\s+/g, '-').toLowerCase();
        
        row.innerHTML = `
          <td style="padding: 10px; border: 1px solid #ddd;">${subject}</td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
            <input type="number" 
                   class="form-control marks-input" 
                   min="0" 
                   max="100" 
                   id="marks-${subjectId}" 
                   data-subject="${subjectId}"
                   style="width: 80px; margin: 0 auto; text-align: center;"
                   placeholder="0-100"
                   value="">
          </td>
          <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
            <span id="grade-${subjectId}" class="grade-display">-</span>
          </td>
        `;
        
        fragment.appendChild(row);
      });
      
      // Clear and append new content
      marksEntryBody.innerHTML = '';
      marksEntryBody.appendChild(fragment);
      
      // Show the container
      marksEntryContainer.style.display = 'block';
      console.log('Marks entry container displayed - ready for new entry');
      
      // Add event delegation for marks input
      marksEntryBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('marks-input')) {
          const marks = e.target.value ? parseInt(e.target.value) : '';
          const subject = e.target.dataset.subject;
          const gradeCell = document.querySelector(`#grade-${subject}`);
          
          if (gradeCell) {
            gradeCell.textContent = marks !== '' ? getGradeFromMarks(marks) : '-';
          }
        }
      });
      
      // Load students for the selected class
      loadStudentsForClass(className);
    }

    // Function to calculate grade from marks using the four-point scale
    function getGradeFromMarks(marks) {
      if (marks >= 75) return 'Exceed Expectation';
      if (marks >= 50) return 'Meet Expectation';
      if (marks >= 30) return 'Approach Expectation';
      return 'Below Expectation';
    }

    // Function to load students for the selected class
    async function loadStudentsForClass(className) {
      console.log('Loading students for class:', className);
      const studentSelect = document.getElementById('marks-student');
      
      if (!studentSelect) {
        console.error('Student select element not found');
        return;
      }
      
      // Show loading state
      studentSelect.innerHTML = '<option value="">Loading students...</option>';
      studentSelect.disabled = true;
      
      try {
        const API_BASE_URL = 'https://timiza-saas.onrender.com/api';
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found. Please log in again.');
        }
        
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        let students = [];
        
        try {
          // First, try to fetch students for the specific class
          let response = await fetch(`${API_BASE_URL}/users?role=student&class=${encodeURIComponent(className)}`, {
            headers: headers
          });
          
          if (response.ok) {
            const data = await response.json();
            students = Array.isArray(data) ? data : [];
          }
          
          // If no students found for the class, try fetching all students
          if (students.length === 0) {
            const allResponse = await fetch(`${API_BASE_URL}/users?role=student`, {
              headers: headers
            });
            
            if (allResponse.ok) {
              const allData = await allResponse.json();
              students = Array.isArray(allData) ? allData : [];
            } else {
              throw new Error(`HTTP error! status: ${allResponse.status}`);
            }
          }
          
        } catch (fetchError) {
          console.warn('Error fetching students:', fetchError);
          // Continue with empty students array to try the next approach
        }
        
        // Update the UI
        studentSelect.innerHTML = '<option value="">Select Student</option>';
        
        if (students.length === 0) {
          studentSelect.innerHTML = '<option value="">No students found</option>';
          return;
        }
        
        // Filter students by class if we have a class name
        if (className) {
          students = students.filter(student => {
            const studentClass = student.class || student.studentClass || student.grade;
            return studentClass && studentClass.toLowerCase().includes(className.toLowerCase());
          });
          
          if (students.length === 0) {
            studentSelect.innerHTML = `<option value="">No students in ${className}</option>`;
            return;
          }
        }
        
        // Add students to dropdown
        students.forEach(student => {
          // Skip if student doesn't have a name or ID
          if (!student._id && !student.id) return;
          
          const option = document.createElement('option');
          option.value = student._id || student.id;
          // Try different possible name fields
          option.textContent = student.fullName || student.name || 
                             `${student.firstName || ''} ${student.lastName || ''}`.trim() || 
                             `Student ${student._id || student.id}`;
          studentSelect.appendChild(option);
        });
        
        studentSelect.disabled = false;
        
      } catch (error) {
        console.error('Error in loadStudentsForClass:', error);
        studentSelect.innerHTML = '<option value="">Error loading students</option>';
        // Only show alert for non-404 errors to avoid spamming the user
        if (!error.message.includes('404')) {
          console.error('Failed to load students:', error);
        }
      }
    }

    // Global flag to prevent marks loading
    let preventMarksLoading = false;

    // Function to clear all saved marks (both local and API)
    async function clearSavedMarks() {
      if (confirm('Are you sure you want to clear all saved marks? This action cannot be undone.')) {
        try {
          // Clear all marks-related localStorage data
          // Clear both individual class marks and general saved marks
          const marksKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('savedMarks_') || 
                    key.startsWith('marks-') || 
                    key.startsWith('reportCard-') ||
                    key === 'savedMarks');
          
          marksKeys.forEach(key => localStorage.removeItem(key));

          // Clear displayed marks
          const marksEntryBody = document.getElementById('marks-entry-body');
          if (marksEntryBody) {
            marksEntryBody.innerHTML = '';
          }

          // Reset student selection
          const studentSelect = document.getElementById('marks-student');
          if (studentSelect) {
            studentSelect.value = '';
            studentSelect.disabled = true;
            studentSelect.innerHTML = '<option value="">Select Student</option>';
          }

          // Reset teacher remarks
          const remarksElement = document.getElementById('teacher-remarks');
          if (remarksElement) {
            remarksElement.value = '';
          }

          // Hide the marks entry container
          const marksEntryContainer = document.getElementById('marks-entry-container');
          if (marksEntryContainer) {
            marksEntryContainer.style.display = 'none';
          }

          // Get current class
          const className = document.getElementById('marks-class').value;
          if (className) {
            // Clear any saved marks data for this class
            const savedMarksKey = `savedMarks_${className}`;
            localStorage.removeItem(savedMarksKey);
            
            // Clear the general saved marks object
            localStorage.removeItem('savedMarks');
            
            // Clear the marks entry form data
            const marksForm = document.getElementById('marks-form');
            if (marksForm) {
              marksForm.reset();
            }
            
            // Clear the marks data object
            const marksDataObj = {
              studentId: '',
              term: '',
              subjects: [],
              teacherRemarks: ''
            };
            
            // Store the empty marks data object
            localStorage.setItem('savedMarks', JSON.stringify(marksDataObj));
            
            // Show a message indicating that marks have been cleared locally
            alert('All marks have been cleared from local storage. Note: This does not affect marks stored on the server.');

            // Dispatch marks cleared event
            const marksClearedEvent = new CustomEvent('marksCleared');
            document.dispatchEvent(marksClearedEvent);
          }
        } catch (error) {
          console.error('Error clearing marks:', error);
          alert('Failed to clear marks. Please try again.');
        }
      }
    }

    // Function to check if marks loading should be prevented
    function shouldPreventMarksLoading() {
      if (preventMarksLoading) {
        preventMarksLoading = false; // Reset the flag after checking
        return true;
      }
      return false;
    }

    // Function to initialize the marks entry system
    function initializeMarksEntrySystem() {
      console.log('Initializing marks entry system...');
      
      const marksClassSelect = document.getElementById('marks-class');
      const marksContainer = document.getElementById('marks-entry-container');
      const marksEntryBody = document.getElementById('marks-entry-body');
      
      // Check if required elements exist
      if (!marksClassSelect || !marksContainer || !marksEntryBody) {
        console.error('Required elements not found:', {
          marksClassSelect: !!marksClassSelect,
          marksContainer: !!marksContainer,
          marksEntryBody: !!marksEntryBody
        });
        return;
      }
      
      console.log('All required elements found');
      
      // Ensure the marks container is initially hidden
      marksContainer.style.display = 'none';
      
      // Function to handle class selection change
      function handleClassChange() {
        const selectedClass = marksClassSelect.value;
        const studentSelect = document.getElementById('marks-student');
        
        console.log('Class selection changed to:', selectedClass);
        
        if (selectedClass) {
          // Enable student selection
          if (studentSelect) {
            studentSelect.disabled = false;
          }
          
          // Load subjects for the selected class
          loadSubjectsForClass(selectedClass);
        } else {
          // Disable student selection and hide marks entry
          if (studentSelect) {
            studentSelect.disabled = true;
          }
          marksContainer.style.display = 'none';
        }
      }
      
      // Add event listener for class selection
      marksClassSelect.addEventListener('change', handleClassChange);
      
      // Initialize the year dropdown
      const yearSelect = document.getElementById('marks-year');
      if (yearSelect) {
        const currentYear = new Date().getFullYear();
        
        // Clear any existing options
        yearSelect.innerHTML = '';
        
        // Add 5 years in the past and 2 years in the future
        for (let year = currentYear - 5; year <= currentYear + 2; year++) {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          if (year === currentYear) {
            option.selected = true;
          }
          yearSelect.appendChild(option);
        }
      }
      
      // Trigger initial load if a class is already selected
      if (marksClassSelect.value) {
        console.log('Initial class selected:', marksClassSelect.value);
        handleClassChange();
      }
      
      console.log('Marks entry system initialized');
    }
    
    // Add event listener for clear marks button
    document.addEventListener('click', function(e) {
      if (e.target && e.target.id === 'clear-marks-btn') {
        clearSavedMarks();
      }
    });

    // Add event listener for when the DOM is fully loaded
    if (document.readyState === 'loading') {
      // Loading hasn't finished yet, wait for the DOMContentLoaded event
      document.addEventListener('DOMContentLoaded', initializeMarksEntrySystem);
    } else {
      // DOM is already ready, initialize immediately
      initializeMarksEntrySystem();
    }

    // Helper function to calculate grade from marks
    function calculateGradeFromMarks(marks) {
        // Primary school expectation-based grading scale (0-100)
        if (marks >= 85) return 'Exceeds Expectations';
        else if (marks >= 70) return 'Meets Expectations';
        else if (marks >= 55) return 'Approaches Expectations';
        else return 'Below Expectations';
    }

    // Function to save marks using student ID and term
    async function saveStudentMarks(studentId, term) {
        try {
            // Get form elements
            const studentSelect = document.getElementById('marks-student');
            const className = document.getElementById('marks-class').value;
            const teacherRemarks = document.getElementById('teacher-remarks').value;
            
            // Validate inputs
            if (!studentId || !term) {
                throw new Error('Please select both student and term');
            }
            
            // Collect marks
            const marks = [];
            const rows = document.querySelectorAll('#marks-entry-body tr');
            
            rows.forEach(row => {
                const marksInput = row.querySelector('input[type="number"]');
                const subjectId = marksInput.id.replace('marks-', '');
                const marksValue = marksInput.value ? parseFloat(marksInput.value) : 0;
                const grade = calculateGradeFromMarks(marksValue);
                
                marks.push({
                    subject: subjectId,
                    marks: marksValue,
                    grade: grade
                });
            });
            
            // Prepare data
            const marksData = {
                studentId: studentId,
                term: term,
                subjects: marks,
                teacherRemarks: teacherRemarks
            };
            
            // Save to localStorage
            const marksKey = `marks-${studentId}-${term}`;
            localStorage.setItem(marksKey, JSON.stringify(marksData));
            
            // Save to API
            const token = localStorage.getItem('token');
            if (token) {
                const endpoint = `${API_BASE_URL}/api/marks/students/${studentId}/marks`;
                console.log('Saving marks to:', endpoint);
                console.log('Request body:', {
                    studentId: studentId,
                    term: term,
                    subjects: marks,
                    teacherRemarks: teacherRemarks
                });
                
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        studentId: studentId,
                        term: term,
                        subjects: marks,
                        teacherRemarks: teacherRemarks
                    })
                });
                
                const data = await response.json();
                console.log('API response:', data);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`Failed to save marks: ${errorData.message || response.statusText || 'Unknown error'}`);
                }
                
                if (data.success) {
                    alert('Marks saved successfully to backend!');
                } else {
                    console.error('Backend save failed:', data);
                    throw new Error('Failed to save marks to backend');
                }
            } else {
                console.warn('No token found - saving only to localStorage');
                alert('Marks saved to local storage only. Please login again to save to backend.');
            }
            
            return true;
        } catch (error) {
            console.error('Error saving marks:', error);
            alert('Failed to save marks: ' + error.message);
            throw error;
        }
    }

    // Helper function to update report card preview
    function updateReportCardPreview(marksData) {
        try {
            // Get student info
            const studentSelect = document.getElementById('report-student');
            const selectedOption = studentSelect.options[studentSelect.selectedIndex];
            const studentName = selectedOption.text;
            const className = document.getElementById('report-class').value;
            const term = document.getElementById('report-term').value;

            // Calculate averages and grades
            let totalMarks = 0;
            let subjectCount = 0;
            marksData.subjects.forEach(subject => {
                if (typeof subject.marks === 'number') {
                    totalMarks += subject.marks;
                    subjectCount++;
                }
            });

            const averageScore = subjectCount > 0 ? (totalMarks / subjectCount).toFixed(2) : 0;
            const overallGrade = calculateGradeFromMarks(averageScore);

            // Update report card preview
            const previewContainer = document.getElementById('report-card-preview');
            if (previewContainer) {
                previewContainer.innerHTML = `
                    <div class="report-header">
                        <h2>ST. MARY'S PRIMARY SCHOOL</h2>
                        <h3>TERMLY REPORT CARD</h3>
                    </div>
                    <div class="student-info">
                        <p><strong>Student:</strong> ${studentName}</p>
                        <p><strong>Class:</strong> ${className}</p>
                        <p><strong>Term:</strong> ${term}</p>
                    </div>
                    <div class="marks-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Marks</th>
                                    <th>Grade</th>
                                    <th>Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${marksData.subjects.map(subject => `
                                    <tr>
                                        <td>${subject.subject}</td>
                                        <td>${subject.marks}</td>
                                        <td>${subject.grade}</td>
                                        <td>${getGradeRemarks(subject.grade)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="summary">
                        <p><strong>Total Marks:</strong> ${totalMarks}</p>
                        <p><strong>Average Score:</strong> ${averageScore}</p>
                        <p><strong>Overall Grade:</strong> ${overallGrade}</p>
                    </div>
                    <div class="teacher-remarks">
                        <h4>Teacher's Remarks:</h4>
                        <p>${marksData.teacherRemarks || 'Good progress this term. Keep up the good work!'}</p>
                    </div>
                    <div class="mt-4" style="text-align: center;">
                        <button id="download-pdf" class="btn btn-primary mr-2" style="display: none;">
                            <i class="fas fa-download"></i> Download Report Card
                        </button>
                        <button id="send-to-student" class="btn btn-success mr-2" style="display: none;">
                            <i class="fas fa-paper-plane"></i> Send to Student
                        </button>
                        <button id="delete-report" class="btn btn-danger" style="display: none;" 
                                data-bs-toggle="modal" data-bs-target="#confirmDeleteModal">
                            <i class="fas fa-trash"></i> Delete Report Card
                        </button>
                    </div>
                    
                    <!-- Delete Confirmation Modal -->
                    <div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-hidden="true">
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title">Confirm Deletion</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body">
                                    <p>Are you sure you want to delete this report card? This action cannot be undone.</p>
                                    <p class="text-danger">All marks and grades for this term will be permanently deleted.</p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                    <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                                        <i class="fas fa-trash"></i> Delete Permanently
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                // Add event listeners for download/send buttons
                const downloadBtn = document.getElementById('download-pdf');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', downloadReportCardAsPDF);
                }

                const sendBtn = document.getElementById('send-to-student');
                if (sendBtn) {
                    sendBtn.addEventListener('click', sendReportCardToStudent);
                }
            }
        } catch (error) {
            console.error('Error updating report card preview:', error);
            alert('Failed to update report card preview. Please try again.');
        }
    }

    // Initialize report card section
    async function initializeReportCardSection() {
        try {
            console.log('Initializing report card section...');
            
            // Get class select element
            const classSelect = document.getElementById('report-class');
            if (!classSelect) {
                console.error('Class select element not found');
                return;
            }
            console.log('Found class select:', classSelect);

            // Get student select element
            const studentSelect = document.getElementById('report-student');
            if (!studentSelect) {
                console.error('Student select element not found');
                return;
            }
            console.log('Found student select:', studentSelect);

            // Get generate report card button
            const generateReportBtn = document.getElementById('generate-report-card');
            if (!generateReportBtn) {
                console.error('Generate report card button not found');
                return;
            }
            console.log('Found generate report card button:', generateReportBtn);

            // Add event listener for class selection
            classSelect.addEventListener('change', async function() {
                const selectedClass = this.value;
                console.log('Class selection changed to:', selectedClass);
                
                if (!selectedClass) {
                    console.log('No class selected');
                    return;
                }

                // Clear existing students
                studentSelect.innerHTML = '<option value="">-- Select a student --</option>';
                
                // Load students for selected class
                try {
                    console.log('Attempting to load students for class:', selectedClass);
                    const students = await loadStudentsForClass(selectedClass);
                    
                    if (students && students.length > 0) {
                        console.log('Successfully loaded', students.length, 'students');
                        
                        // Update student dropdown
                        students.forEach(student => {
                            const option = document.createElement('option');
                            option.value = student.id;
                            option.textContent = student.name;
                            studentSelect.appendChild(option);
                        });
                    } else {
                        console.log('No students found for class:', selectedClass);
                        alert('No students found in this class');
                    }
                } catch (error) {
                    console.error('Error loading students:', error);
                    alert('Failed to load students for this class: ' + error.message);
                }
            });

            // Initialize with current class if selected
            const currentClass = classSelect.value;
            if (currentClass) {
                console.log('Initializing with current class:', currentClass);
                classSelect.dispatchEvent(new Event('change'));
            }
        } catch (error) {
            console.error('Error initializing report card section:', error);
        }
    }

      <!-- Save marks button handler -->
    document.addEventListener('DOMContentLoaded', function() {
        // Save marks button
        const saveMarksBtn = document.getElementById('save-marks-btn');
        if (saveMarksBtn) {
            saveMarksBtn.addEventListener('click', async function() {
                try {
                    const studentId = document.getElementById('marks-student').value;
                    const term = document.getElementById('marks-term').value;
                    await saveStudentMarks(studentId, term);
                } catch (error) {
                    console.error('Error saving marks:', error);
                    alert('Failed to save marks. Please try again.');
                }
            });
        }
        
        // Log if report card section was initialized
        console.log('DOM fully loaded, report card section should be initialized');
    });
