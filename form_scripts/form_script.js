/**
 * Retrieves and populates UTM parameters from cookies to hidden form fields
 * Handles cookie parsing and form field population with error handling
 */

function getCookie(name) {
  try {
    const cookieString = document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='));
    
    if (!cookieString) return null;

    const value = cookieString.split('=')[1];
    return decodeURIComponent(value);
  } catch (error) {
    console.warn(`Error getting cookie ${name}:`, error);
    return null;
  }
}

function parseUTMCookie() {
  try {
    const utmCookie = getCookie('m8l-utms');
    if (!utmCookie) return {};

    // Handle both comma-separated and JSON formats
    try {
      // Try parsing as JSON first
      return JSON.parse(utmCookie);
    } catch {
      // Fallback to comma-separated format
      const params = {};
      utmCookie.split(',').forEach(param => {
        const [key, value] = param.split('=').map(s => s.trim());
        if (key) params[key] = value || '(not-set)';
      });
      return params;
    }
  } catch (error) {
    console.warn('Error parsing UTM cookie:', error);
    return {};
  }
}

function populateFormFields() {
  const utmParams = parseUTMCookie();
  const utmFields = [
    'utm_source',
    'utm_medium', 
    'utm_campaign',
    'utm_content',
    'utm_term'
  ];

  utmFields.forEach(field => {
    const element = document.getElementById(field);
    if (element && utmParams[field]) {
      element.value = utmParams[field];
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', populateFormFields);
} else {
  populateFormFields();
}