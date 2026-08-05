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

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mainContent = document.querySelector('.main-content');

    // Toggle sidebar on button click
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            // Toggle a class on the body to handle overlay if needed
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
            e.preventDefault();
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

    // Show dashboard by default
    const defaultTab = document.querySelector('.tab-link.active');
    if (defaultTab) {
        defaultTab.click();
    }
});

<!-- Debug Script -->
// This is a temporary debug script to help diagnose modal issues
console.log('=== TEMPORARY DEBUG SCRIPT ===');

// Check if modal exists in DOM
const modal = document.getElementById('customPaymentModal');
console.log('Modal element in DOM:', !!modal);

// Check if modal is visible
if (modal) {
    console.log('Modal display style:', window.getComputedStyle(modal).display);
    console.log('Modal visibility:', window.getComputedStyle(modal).visibility);
    console.log('Modal z-index:', window.getComputedStyle(modal).zIndex);
    
    // Make modal visible for testing
    modal.style.display = 'flex';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.style.zIndex = '9999';
    
    // Add a red border to make it visible
    modal.style.border = '5px solid red';
    
    console.log('Modal should now be visible with a red border');
} else {
    console.error('❌ Modal not found in DOM!');
    console.log('Available elements with id containing "modal":', 
        Array.from(document.querySelectorAll('[id*="modal"]')).map(el => ({
            id: el.id,
            class: el.className,
            tag: el.tagName
        }))
    );
}
