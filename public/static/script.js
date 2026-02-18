   // Toggle sidebar
        document.getElementById('sidebarToggle').addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });

 function viewDocument(docName) {
            document.getElementById('modalDocTitle').textContent = docName;
            document.getElementById('documentModal').style.display = 'flex';
            
            // In a real app, you would load the actual document here
            document.getElementById('documentViewer').innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <span class="material-icons" style="font-size: 48px; color: #666;">description</span>
                    <h3>${docName}</h3>
                    <p>This is a preview of the uploaded document</p>
                    <p>In a real application, this would display the actual PDF or image</p>
                </div>
            `;
        }

        function closeModal() {
            document.getElementById('documentModal').style.display = 'none';
        }

        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === document.getElementById('documentModal')) {
                closeModal();
            }
        });

   // script.js
document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar
    document.getElementById('sidebarToggle').addEventListener('click', function() {
        document.querySelector('.sidebar').classList.toggle('collapsed');
        document.querySelector('.main-content').classList.toggle('expanded');
    });

    // View document modal
    function viewDocument(docName) {
        document.getElementById('modalDocTitle').textContent = docName;
        document.getElementById('documentModal').style.display = 'flex';
        
        // In a real app, you would load the actual document here
        document.getElementById('documentViewer').innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <span class="material-icons" style="font-size: 48px; color: #666;">description</span>
                <h3>${docName}</h3>
                <p>This is a preview of the uploaded document</p>
                <p>In a real application, this would display the actual PDF or image</p>
            </div>
        `;
    }

    function closeModal() {
        document.getElementById('documentModal').style.display = 'none';
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('documentModal')) {
            closeModal();
        }
    });

    // Load registration data from localStorage
    function loadRegistrationData() {
        const registrations = [];
        
        // Get all keys from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Check if the key matches our registration pattern
            if (key.startsWith('kaccimaRegistration_')) {
                const registration = JSON.parse(localStorage.getItem(key));
                const documents = JSON.parse(localStorage.getItem(`kaccimaUploadedDocuments_${key.split('_')[1]}`));
                registrations.push({...registration, documents});
            }
        }
        
        return registrations;
    }

    // Populate pending approvals table
    function populatePendingApprovals() {
        const registrations = loadRegistrationData();
        const pendingTableBody = document.querySelector('.table-container:first-of-type tbody');
        
        // Clear existing rows
        pendingTableBody.innerHTML = '';
        
        // Filter for pending approvals
        const pendingRegistrations = registrations.filter(reg => 
            reg.documents && Object.values(reg.documents).some(doc => !doc.approved)
            || !reg.paymentVerified);
        
        pendingRegistrations.forEach(reg => {
            const row = document.createElement('tr');
            
            // Get the first document that's pending (for demo purposes)
            const pendingDoc = reg.documents ? 
                Object.entries(reg.documents).find(([name, doc]) => !doc.approved) : 
                null;
            
            row.innerHTML = `
                <td>${reg.contactPerson || 'N/A'}</td>
                <td>${reg.companyName || 'N/A'}</td>
                <td>${reg.email || 'N/A'}</td>
                <td><span class="status-badge status-pending">Pending</span></td>
                <td>${new Date().toLocaleDateString()}</td>
                <td>
                    <button class="action-btn btn-view" onclick="viewDocument('${pendingDoc ? pendingDoc[0] : 'Documents'}')">
                        <span class="material-icons">visibility</span> View
                    </button>
                    <button class="action-btn btn-approve" data-id="${reg.email}">
                        <span class="material-icons">check</span> Approve
                    </button>
                    <button class="action-btn btn-reject" data-id="${reg.email}">
                        <span class="material-icons">close</span> Reject
                    </button>
                </td>
            `;
            
            pendingTableBody.appendChild(row);
        });
        
        // Add event listeners to approve/reject buttons
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.getAttribute('data-id');
                approveRegistration(email);
            });
        });
        
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.getAttribute('data-id');
                rejectRegistration(email);
            });
        });
    }

    // Populate pending payments table
    function populatePendingPayments() {
        const registrations = loadRegistrationData();
        const paymentsTableBody = document.querySelector('.table-container:last-of-type tbody');
        
        // Clear existing rows
        paymentsTableBody.innerHTML = '';
        
        // Filter for registrations with unverified payments
        const pendingPayments = registrations.filter(reg => 
            reg.paymentSubmitted && !reg.paymentVerified);
        
        pendingPayments.forEach(reg => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${reg.contactPerson || 'N/A'}</td>
                <td>₦${reg.paymentAmount || '0'}</td>
                <td>${reg.paymentMethod || 'N/A'}</td>
                <td>${new Date().toLocaleDateString()}</td>
                <td><span class="status-badge status-paid">Paid</span></td>
                <td>
                    <button class="action-btn btn-view" onclick="viewDocument('Payment Receipt')" data-id="${reg.email}">
                        <span class="material-icons">receipt</span> View
                    </button>
                    <button class="action-btn btn-verify" data-id="${reg.email}">
                        <span class="material-icons">verified</span> Verify
                    </button>
                </td>
            `;
            
            paymentsTableBody.appendChild(row);
        });
        
        // Add event listeners to verify buttons
        document.querySelectorAll('.btn-verify').forEach(btn => {
            btn.addEventListener('click', function() {
                const email = this.getAttribute('data-id');
                verifyPayment(email);
            });
        });
    }

    // Approve a registration
    function approveRegistration(email) {
        // In a real app, you would update the registration status in your database
        // For this demo, we'll just remove it from localStorage
        localStorage.removeItem(`kaccimaRegistration_${email}`);
        localStorage.removeItem(`kaccimaUploadedDocuments_${email}`);
        
        // Refresh the tables
        populatePendingApprovals();
        populatePendingPayments();
        
        alert(`Registration for ${email} has been approved.`);
    }

    // Reject a registration
    function rejectRegistration(email) {
        // In a real app, you would update the registration status in your database
        // For this demo, we'll just remove it from localStorage
        localStorage.removeItem(`kaccimaRegistration_${email}`);
        localStorage.removeItem(`kaccimaUploadedDocuments_${email}`);
        
        // Refresh the tables
        populatePendingApprovals();
        populatePendingPayments();
        
        alert(`Registration for ${email} has been rejected.`);
    }

    // Verify a payment
    function verifyPayment(email) {
        // In a real app, you would update the payment status in your database
        // For this demo, we'll just update localStorage
        const registration = JSON.parse(localStorage.getItem(`kaccimaRegistration_${email}`));
        registration.paymentVerified = true;
        localStorage.setItem(`kaccimaRegistration_${email}`, JSON.stringify(registration));
        
        // Refresh the tables
        populatePendingApprovals();
        populatePendingPayments();
        
        alert(`Payment for ${email} has been verified.`);
    }

    // Initialize the page
    populatePendingApprovals();
    populatePendingPayments();

    // Make functions available globally for inline event handlers
    window.viewDocument = viewDocument;
    window.closeModal = closeModal;
});
     

document.addEventListener('DOMContentLoaded', function () {
    const registration = JSON.parse(localStorage.getItem('kaccimaRegistration'));
    const documents = JSON.parse(localStorage.getItem('kaccimaUploadedDocuments'));
    const receipt = localStorage.getItem('receipt') || "Not Provided";

    if (!registration || !documents) return;

    // === Update "Pending Member Approvals" Table ===
    const memberTable = document.querySelector('.table-container:nth-of-type(1) tbody');
    if (memberTable) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registration.contactPerson}</td>
            <td>${registration.companyName}</td>
            <td>${registration.email}</td>
            <td><span class="status-badge status-pending">Pending</span></td>
            <td>${new Date().toLocaleDateString()}</td>
            <td>
                <button class="action-btn btn-view" onclick="viewDocument('${documents[0]?.fileName}')">
                    <span class="material-icons">visibility</span> View
                </button>
                <button class="action-btn btn-approve">
                    <span class="material-icons">check</span> Approve
                </button>
                <button class="action-btn btn-reject">
                    <span class="material-icons">close</span> Reject
                </button>
            </td>
        `;
        memberTable.appendChild(row);
    }

    // === Update "Pending Payment Verifications" Table ===
    const paymentTable = document.querySelector('.table-container:nth-of-type(2) tbody');
    if (paymentTable) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${registration.contactPerson}</td>
            <td>₦150,000</td>
            <td>Bank Transfer</td>
            <td>${new Date().toLocaleDateString()}</td>
            <td><span class="status-badge status-paid">Paid</span></td>
            <td>
                <button class="action-btn btn-view" onclick="viewDocument('${receipt}')">
                    <span class="material-icons">receipt</span> View
                </button>
                <button class="action-btn btn-verify">
                    <span class="material-icons">verified</span> Verify
                </button>
            </td>
        `;
        paymentTable.appendChild(row);
    }

    // === Update Stat Cards (optional enhancement) ===
    const memberStat = document.querySelector('.stat-card:nth-of-type(1) .stat-value');
    if (memberStat) memberStat.textContent = '1'; // You can count dynamically if storing multiple entries

    const paymentStat = document.querySelector('.stat-card:nth-of-type(3) .stat-value');
    if (paymentStat) paymentStat.textContent = '₦150,000';

    const recentPaymentStat = document.querySelector('.stat-card:nth-of-type(4) .stat-value');
    if (recentPaymentStat) recentPaymentStat.textContent = '₦150,000';
});

// Document view simulation
function viewDocument(fileName) {
    const modal = document.getElementById('documentModal');
    const viewer = document.getElementById('documentViewer');
    const title = document.getElementById('modalDocTitle');
    modal.style.display = 'block';
    title.textContent = fileName;
    viewer.innerHTML = `<p>Preview of <strong>${fileName}</strong> would be shown here.</p>`;
}

function closeModal() {
    document.getElementById('documentModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', function () {
    const registration = JSON.parse(localStorage.getItem('kaccimaRegistration'));
    const documents = JSON.parse(localStorage.getItem('kaccimaUploadedDocuments'));
    const approvalsBody = document.getElementById('memberApprovalsBody');

    if (!registration || !documents || !approvalsBody) return;

    const memberRow = document.createElement('tr');
    memberRow.innerHTML = `
        <td>${registration.contactPerson}</td>
        <td>${registration.companyName}</td>
        <td>${registration.email}</td>
        <td><span class="status-badge status-pending">Pending</span></td>
        <td>${new Date().toLocaleDateString()}</td>
        <td>
            <button class="action-btn btn-view" onclick="viewDocument('${documents[0]?.fileName || 'Document'}')">
                <span class="material-icons">visibility</span> View
            </button>
            <button class="action-btn btn-approve">
                <span class="material-icons">check</span> Approve
            </button>
            <button class="action-btn btn-reject">
                <span class="material-icons">close</span> Reject
            </button>
        </td>
    `;
    approvalsBody.appendChild(memberRow);
});

// Document modal logic
function viewDocument(fileName) {
    const modal = document.getElementById('documentModal');
    const viewer = document.getElementById('documentViewer');
    const title = document.getElementById('modalDocTitle');
    modal.style.display = 'block';
    title.textContent = fileName;
    viewer.innerHTML = `<p>Preview of <strong>${fileName}</strong> would be shown here.</p>`;
}

function closeModal() {
    document.getElementById('documentModal').style.display = 'none';
}


document.addEventListener('DOMContentLoaded', function () {
    const registration = JSON.parse(localStorage.getItem('kaccimaRegistration'));
    const receiptFile = localStorage.getItem('receipt') || "payment_receipt.pdf"; // fallback
    const paymentTableBody = document.getElementById('paymentVerificationsBody');

    if (!registration || !paymentTableBody) return;

    const paymentRow = document.createElement('tr');
    paymentRow.innerHTML = `
        <td>${registration.contactPerson}</td>
        <td>₦150,000</td>
        <td>Bank Transfer</td>
        <td>${new Date().toLocaleDateString()}</td>
        <td><span class="status-badge status-paid">Paid</span></td>
        <td>
            <button class="action-btn btn-view" onclick="viewDocument('${receiptFile}')">
                <span class="material-icons">receipt</span> View
            </button>
            <button class="action-btn btn-verify">
                <span class="material-icons">verified</span> Verify
            </button>
        </td>
    `;
    paymentTableBody.appendChild(paymentRow);
});

// Document modal logic
function viewDocument(fileName) {
    const modal = document.getElementById('documentModal');
    const viewer = document.getElementById('documentViewer');
    const title = document.getElementById('modalDocTitle');
    modal.style.display = 'block';
    title.textContent = fileName;
    viewer.innerHTML = `<p>Preview of <strong>${fileName}</strong> would be shown here.</p>`;
}

function closeModal() {
    document.getElementById('documentModal').style.display = 'none';
}
document.addEventListener('DOMContentLoaded', function () {
    const registration = JSON.parse(localStorage.getItem('kaccimaRegistration'));
    const receipt = localStorage.getItem('receipt');
    const members = JSON.parse(localStorage.getItem('kaccimaMembers') || '[]');

    // Simulate storing multiple members (optional setup for testing)
    if (registration && !members.find(m => m.email === registration.email)) {
        members.push(registration);
        localStorage.setItem('kaccimaMembers', JSON.stringify(members));
    }

    // Update dashboard stats
    document.getElementById('totalMembers').textContent = members.length;

    // Assuming each unapproved registration = 1 pending approval
    const pendingCount = members.length; // Adjust this logic as needed
    document.getElementById('pendingApprovals').textContent = pendingCount;

    // Fake payment total for demo - can store payments in localStorage if needed
    const totalAmount = 150000; // Update this if tracking real payments
    const recentAmount = receipt ? 150000 : 0;

    document.getElementById('totalPayments').textContent = `₦${totalAmount.toLocaleString()}`;
    document.getElementById('recentPayments').textContent = `₦${recentAmount.toLocaleString()}`;
    const payments = JSON.parse(localStorage.getItem('kaccimaPayments') || '[]');
 payments.push({ amount: 150000, method: 'Bank Transfer', date: new Date() });
localStorage.setItem('kaccimaPayments', JSON.stringify(payments));

});




