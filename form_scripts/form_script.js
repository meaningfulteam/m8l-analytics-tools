/**
 * Retrieves and combines first-touch and last-touch attribution data in form fields
 * Both attribution points are sent through the same form fields with clear separation
 */

// Cookie names defined in tracking_cookies.js
const FIRST_TOUCH_COOKIE = "m8l-first-touch";
const LAST_TOUCH_COOKIE = "m8l-last-touch";

/**
 * Gets the value of a cookie by name
 * @param {string} name - The name of the cookie to retrieve
 * @returns {any|null} The parsed value of the cookie or null if not found/error
 */
function getCookie(name) {
  try {
    const cookies = document.cookie.split(";").map((cookie) => cookie.trim());
    const cookie = cookies.find((cookie) => cookie.startsWith(`${name}=`));
    return cookie ? JSON.parse(cookie.substring(name.length + 1)) : null;
  } catch (e) {
    console.warn("Error getting cookie:", e);
    return null;
  }
}

/**
 * Combines first-touch and last-touch attribution data for form submission
 * Uses the format "FT:value||LT:value" to separate the two touch points
 */
function populateFormFields() {
  try {
    const firstTouch = getCookie(FIRST_TOUCH_COOKIE) || {};
    const lastTouch = getCookie(LAST_TOUCH_COOKIE) || {};
    
    // Standard UTM fields to populate
    const utmFields = [
      'utm_source',
      'utm_medium', 
      'utm_campaign',
      'utm_content',
      'utm_term'
    ];
    
    // Additional attribution fields to populate if they exist
    const additionalFields = [
      'traffic_type',
      'landing_page',
      'referrer',
      'timestamp'
    ];
    
    // Combine both field sets
    const allFields = [...utmFields, ...additionalFields];
    
    // Populate each field with combined data
    allFields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        const firstValue = firstTouch[field] || '';
        const lastValue = lastTouch[field] || '';
        
        // Format: "FT:first_value||LT:last_value"
        element.value = `FT:${firstValue}||LT:${lastValue}`;
      }
    });
    
    // Alternative: Send complete JSON data in a single field
    const jsonElement = document.getElementById('attribution_data');
    if (jsonElement) {
      const attributionData = {
        first_touch: firstTouch,
        last_touch: lastTouch
      };
      jsonElement.value = JSON.stringify(attributionData);
    }
  } catch (error) {
    console.warn('Error populating form fields:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', populateFormFields);
} else {
  populateFormFields();
}