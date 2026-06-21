// ===============================
// CONFIGURATION FILE
// js/finance/config.js
// ===============================

// -------------------------------
// API Configuration
// -------------------------------
const API_BASE_URL =
    'https://luckyjuniorschool.onrender.com/api';

// MAKE GLOBAL
window.API_BASE_URL = API_BASE_URL;

// -------------------------------
// Authentication
// -------------------------------
function getAuthToken() {
    return localStorage.getItem('token');
}

// MAKE GLOBAL
window.getAuthToken = getAuthToken;

// -------------------------------
// Default Fetch Headers
// -------------------------------
function getFetchHeaders() {

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
    };
}

// MAKE GLOBAL
window.getFetchHeaders = getFetchHeaders;

// -------------------------------
// Currency Configuration
// -------------------------------
const CURRENCY = 'KES';
const LOCALE = 'en-US';

window.CURRENCY = CURRENCY;
window.LOCALE = LOCALE;

// -------------------------------
// Default Messages
// -------------------------------
const APP_MESSAGES = {
    loadingStudents: 'Loading students...',
    noStudents: 'No students found in this class',
    selectClass: 'Select a class first',
    selectStudent: 'Select a student',
    loadingRecords: 'Loading fee records...',
    noRecords: 'No fee records found',
    saveSuccess: 'Fee record saved successfully',
    saveError: 'Failed to save fee record',
    networkError: 'Unable to connect to the server'
};

window.APP_MESSAGES = APP_MESSAGES;

// -------------------------------
// Fee Status
// -------------------------------
const FEE_STATUS = {
    PAID: 'Paid',
    PENDING: 'Pending'
};

window.FEE_STATUS = FEE_STATUS;

// -------------------------------
// Receipt Configuration
// -------------------------------
const RECEIPT_CONFIG = {
    schoolName: 'Lucky Junior School',
    footerMessage: 'Thank you for your payment!',
    supportMessage:
        'For any inquiries, please contact the school office.'
};

window.RECEIPT_CONFIG = RECEIPT_CONFIG;

// -------------------------------
// Default Date Values
// -------------------------------
const TODAY =
    new Date().toISOString().split('T')[0];

window.TODAY = TODAY;

// -------------------------------
// Academic Terms
// -------------------------------
const ACADEMIC_TERMS = [
    'Term 1',
    'Term 2',
    'Term 3'
];

window.ACADEMIC_TERMS =
    ACADEMIC_TERMS;

// -------------------------------
// Class Structure
// -------------------------------
const CLASS_GROUPS = [

    {
        label: 'Pre-Primary',
        classes: [
            {
                value: 'Baby Class',
                text: 'Baby Class'
            },
            {
                value: 'Pre-primary 1 (pp1)',
                text: 'PP1 (Pre-Primary 1)'
            },
            {
                value: 'Pre-primary 2 (pp2)',
                text: 'PP2 (Pre-Primary 2)'
            }
        ]
    },

    {
        label: 'Lower Primary (Grade 1-3)',
        classes: [
            {
                value: 'Grade 1',
                text: 'Grade 1'
            },
            {
                value: 'Grade 2',
                text: 'Grade 2'
            },
            {
                value: 'Grade 3',
                text: 'Grade 3'
            }
        ]
    },

    {
        label: 'Upper Primary (Grade 4-6)',
        classes: [
            {
                value: 'Grade 4',
                text: 'Grade 4'
            },
            {
                value: 'Grade 5',
                text: 'Grade 5'
            },
            {
                value: 'Grade 6',
                text: 'Grade 6'
            }
        ]
    },

    {
        label: 'Junior Secondary (Grade 7-9)',
        classes: [
            {
                value: 'Grade 7',
                text: 'Grade 7'
            },
            {
                value: 'Grade 8',
                text: 'Grade 8'
            },
            {
                value: 'Grade 9',
                text: 'Grade 9'
            }
        ]
    },

    {
        label: 'Senior School (Grade 10-12)',
        classes: [
            {
                value: 'Grade 10',
                text: 'Grade 10'
            },
            {
                value: 'Grade 11',
                text: 'Grade 11'
            },
            {
                value: 'Grade 12',
                text: 'Grade 12'
            }
        ]
    }
];

// MAKE GLOBAL
window.CLASS_GROUPS =
    CLASS_GROUPS;

// -------------------------------
// Mock Students
// -------------------------------
const MOCK_STUDENTS = [

    {
        id: '1',
        fullName: 'Test Student 1',
        admissionNumber: 'ADM001'
    },

    {
        id: '2',
        fullName: 'Test Student 2',
        admissionNumber: 'ADM002'
    },

    {
        id: '3',
        fullName: 'Test Student 3',
        admissionNumber: 'ADM003'
    }
];

window.MOCK_STUDENTS =
    MOCK_STUDENTS;

// -------------------------------
// Global DOM Elements
// -------------------------------
window.feeForm =
    document.getElementById('fee-form');

window.feeList =
    document.getElementById('fee-list');

window.feeSearch =
    document.getElementById('fees-search');

// -------------------------------
// Startup Log
// -------------------------------
console.log(
    'Finance Config Loaded Successfully'
);

console.log(
    'API_BASE_URL:',
    window.API_BASE_URL
);

console.log(
    'CLASS_GROUPS:',
    window.CLASS_GROUPS
);

console.log(
    'getFetchHeaders:',
    typeof window.getFetchHeaders
);
