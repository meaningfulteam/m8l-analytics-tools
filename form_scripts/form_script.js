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
      console.log(`Looking for element with ID: ${field}. Found:`, element);
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

/**
 * Attempts to populate form fields once they are available in the DOM.
 * Uses polling to wait for a key element ('utm_source' by default).
 */
function tryPopulateFormFields() {
  const keyFieldId = 'utm_source'; // A representative field to check for existence
  const keyElement = document.getElementById(keyFieldId);
  
  if (!keyElement) {
    console.log(`Key form field #${keyFieldId} not found yet. Waiting...`);
    return false; // Indicate that fields are not ready
  }

  console.log(`Key form field #${keyFieldId} found. Proceeding to populate fields.`);

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
      // Removed the console log here as the initial check confirms elements should exist
      if (element) {
        const firstValue = firstTouch[field] || '';
        const lastValue = lastTouch[field] || '';
        
        // Format: "FT:first_value||LT:last_value"
        element.value = `FT:${firstValue}||LT:${lastValue}`;
      } else {
        // Log if a specific field is unexpectedly missing after the initial check
        console.warn(`Element with ID: ${field} was not found during population, though key element was present.`);
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
  
  return true; // Indicate that fields were populated (or attempted)
}

/**
 * Initializes the form field population process with polling.
 * @param {number} intervalMs - How often to check for the form fields (milliseconds).
 * @param {number} timeoutMs - Maximum time to wait for the fields (milliseconds).
 */
function initializeFormFieldPopulation(intervalMs = 500, timeoutMs = 10000) {
  let elapsedTime = 0;

  const intervalId = setInterval(() => {
    elapsedTime += intervalMs;
    
    if (tryPopulateFormFields()) {
      clearInterval(intervalId); // Stop polling once fields are populated
      console.log("Form fields successfully populated.");
    } else if (elapsedTime >= timeoutMs) {
      clearInterval(intervalId); // Stop polling after timeout
      console.warn(`Form fields could not be populated after ${timeoutMs / 1000} seconds.`);
    }
  }, intervalMs);
}

// Initialize the process
initializeFormFieldPopulation();