document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Handle flash messages
    const flashMessages = document.querySelectorAll('.alert');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.classList.add('fade');
            setTimeout(() => message.remove(), 300);
        }, 5000);
    });

    // Handle image preview
    const imageInputs = document.querySelectorAll('input[type="file"][accept^="image/"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                const preview = document.querySelector(`#${input.dataset.preview}`);
                if (preview) {
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    }
                    reader.readAsDataURL(file);
                }
            }
        });
    });

    // Handle tag input
    const tagInputs = document.querySelectorAll('.tag-input');
    tagInputs.forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                const value = this.value.trim();
                if (value) {
                    addTag(value, this.dataset.container);
                    this.value = '';
                }
            }
        });
    });

    // Handle form validation
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });

    // Handle exam timer
    const examTimer = document.querySelector('.exam-timer');
    if (examTimer) {
        const endTime = new Date(examTimer.dataset.endTime).getTime();
        const timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance <= 0) {
                clearInterval(timerInterval);
                document.querySelector('form').submit();
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            examTimer.querySelector('.time-remaining').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            if (distance < 300000) { // 5 minutes
                examTimer.classList.add('danger');
            } else if (distance < 600000) { // 10 minutes
                examTimer.classList.add('warning');
            }
        }, 1000);
    }
});

// Helper Functions
function addTag(value, containerId) {
    const container = document.getElementById(containerId);
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `
        ${value}
        <span class="remove-tag" onclick="removeTag(this)">&times;</span>
        <input type="hidden" name="tags[]" value="${value}">
    `;
    container.appendChild(tag);
}

function removeTag(element) {
    element.parentElement.remove();
}

function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type} show`;
    toast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
            <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
        <div class="toast-body">${message}</div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function confirmDelete(event, message = 'Are you sure you want to delete this item?') {
    if (!confirm(message)) {
        event.preventDefault();
        return false;
    }
    return true;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Handle auto-save for forms
const autoSaveForms = document.querySelectorAll('form[data-autosave]');
autoSaveForms.forEach(form => {
    const inputs = form.querySelectorAll('input, textarea, select');
    const saveEndpoint = form.dataset.autosave;
    
    const save = debounce(() => {
        const formData = new FormData(form);
        fetch(saveEndpoint, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Draft saved', 'success');
            }
        })
        .catch(error => {
            console.error('Auto-save failed:', error);
            showToast('Failed to save draft', 'error');
        });
    }, 2000);

    inputs.forEach(input => {
        input.addEventListener('input', save);
    });
}); 