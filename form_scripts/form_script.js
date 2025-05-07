/**
 * Retrieves and populates form fields with first-touch and last-touch attribution data
 * First touch data goes to fields with "_ft" suffix, last touch data goes to regular fields
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
 * Attempts to populate form fields once they are available in the DOM.
 * Uses polling to wait for necessary elements to be available.
 */
function tryPopulateFormFields() {
  // Check for form fields (as a representative check)
  const keyFieldId = 'utm_source';
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
    
    // Populate first touch fields (with _ft suffix)
    allFields.forEach(field => {
      const ftElement = document.getElementById(`${field}_ft`);
      if (ftElement) {
        ftElement.value = firstTouch[field] || '';
      }
    });
    
    // Populate last touch fields (standard names without suffix)
    allFields.forEach(field => {
      const standardElement = document.getElementById(field);
      if (standardElement) {
        standardElement.value = lastTouch[field] || '';
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