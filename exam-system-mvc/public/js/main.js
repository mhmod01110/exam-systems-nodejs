// Add CSRF token to all AJAX requests
document.addEventListener('DOMContentLoaded', function() {
    // Get CSRF token from meta tag
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    
    // Add token to all fetch requests
    const originalFetch = window.fetch;
    window.fetch = function() {
        let [resource, config] = arguments;
        if(config === undefined) {
            config = {};
        }
        if(config.headers === undefined) {
            config.headers = {};
        }
        config.headers['X-CSRF-Token'] = token;
        return originalFetch(resource, config);
    };
    
    // Add token to all axios requests
    if (window.axios) {
        window.axios.defaults.headers.common['X-CSRF-Token'] = token;
    }
});

// Flash message auto-hide
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.classList.add('fade');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
    });
});

// Password strength meter
function checkPasswordStrength(password) {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains lowercase letters
    if (password.match(/[a-z]+/)) strength += 1;
    
    // Contains uppercase letters
    if (password.match(/[A-Z]+/)) strength += 1;
    
    // Contains numbers
    if (password.match(/[0-9]+/)) strength += 1;
    
    // Contains special characters
    if (password.match(/[$@#&!]+/)) strength += 1;
    
    return strength;
}

// Update password strength indicator
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.querySelector('input[type="password"]');
    const strengthIndicator = document.querySelector('.password-strength');
    
    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', function() {
            const strength = checkPasswordStrength(this.value);
            const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
            const strengthClass = ['danger', 'warning', 'info', 'primary', 'success'];
            
            strengthIndicator.textContent = strengthText[strength - 1] || '';
            strengthIndicator.className = `password-strength text-${strengthClass[strength - 1] || 'muted'}`;
        });
    }
});

// Form validation
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
});

// Confirm dialog for dangerous actions
function confirmAction(message = 'Are you sure you want to proceed?') {
    return new Promise((resolve) => {
        if (window.confirm(message)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

// Handle form submission with confirmation
document.addEventListener('DOMContentLoaded', function() {
    const confirmForms = document.querySelectorAll('form[data-confirm]');
    
    confirmForms.forEach(form => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const message = form.dataset.confirm || 'Are you sure you want to proceed?';
            
            if (await confirmAction(message)) {
                form.submit();
            }
        });
    });
});

// File input preview
document.addEventListener('DOMContentLoaded', function() {
    const fileInputs = document.querySelectorAll('input[type="file"][data-preview]');
    
    fileInputs.forEach(input => {
        const previewElement = document.querySelector(input.dataset.preview);
        if (!previewElement) return;
        
        input.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    if (previewElement.tagName === 'IMG') {
                        previewElement.src = e.target.result;
                    } else {
                        previewElement.style.backgroundImage = `url(${e.target.result})`;
                    }
                };
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    });
});

// Debounce function for search inputs
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

// Handle search inputs
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = document.querySelectorAll('input[type="search"][data-search-url]');
    
    searchInputs.forEach(input => {
        const resultsContainer = document.querySelector(input.dataset.resultsContainer);
        if (!resultsContainer) return;
        
        const searchHandler = debounce(async function() {
            const query = this.value.trim();
            if (query.length < 2) {
                resultsContainer.innerHTML = '';
                return;
            }
            
            try {
                const response = await fetch(`${this.dataset.searchUrl}?q=${encodeURIComponent(query)}`);
                const data = await response.json();
                
                if (data.results) {
                    resultsContainer.innerHTML = data.results
                        .map(result => `<div class="search-result">${result.html}</div>`)
                        .join('');
                }
            } catch (error) {
                console.error('Search error:', error);
            }
        }, 300);
        
        input.addEventListener('input', searchHandler);
    });
}); 