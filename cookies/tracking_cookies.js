(function () {
  // Common constants
  const FIRST_TOUCH_COOKIE = "m8l-first-touch";
  const LAST_TOUCH_COOKIE = "m8l-last-touch";
  const URL_TEMP_COOKIE_NAME = "m8l-urls-temp";
  const PATH_HISTORY_COOKIE = "m8l-path-history"; // New constant for path tracking
  
  const UTM_PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  
  const SEARCH_ENGINES = ["google.com", "bing.com", "yahoo.com", "duckduckgo.com", "ask.com", "yandex.com", "baidu.com"];
  const LLM_DOMAINS = [
    "chatgpt.com",
    "perplexity.ai",
    "claude.ai",
    "grok.com",
    "gemini.google.com",
    "deepseek.com"
  ];

  // Check for paid indicators in any UTM parameter
  const paidCampaignIndicators = [
    "cpc",
    "paid",
    "ppc",
    "ads",
    "adwords",
    "display",
    "banner",
    "sponsored",
    "social-paid",
    "fb-paid",
    "paidsearch",
    "paid-social",
    "paid_social",
    "cpm",
    "google_ads",
    "googleads",
    "bing_ads",
    "facebook_ads",
    "linkedin_ads",
    "twitter_ads",
    "tiktok_ads",
    "meta_ads",
  ];
  
  // Common utility functions
  /**
   * Sets a cookie with the given name, value, and expiration time
   * @param {string} name - The name of the cookie
   * @param {any} value - The value to store (will be JSON stringified)
   * @param {number} expirationMinutes - Minutes until the cookie expires (optional)
   */
  function setCookie(name, value, expirationMinutes) {
    try {
      const expires = expirationMinutes
        ? `expires=${new Date(
            Date.now() + expirationMinutes * 60 * 1000
          ).toUTCString()}`
        : "";
      document.cookie = `${name}=${JSON.stringify(value)};${expires};path=/`;
    } catch (e) {
      console.warn("Error setting cookie:", e);
    }
  }

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
   * Extracts the domain from a URL
   * @param {string} url - The URL to parse
   * @returns {string} The hostname from the URL (e.g., "www.example.com")
   */
  function getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      console.warn("Error parsing URL:", e);
      return "";
    }
  }

  // Tracking functions
  /**
   * Extracts UTM parameters from the current URL
   * @returns {Object} Object containing UTM parameters if present
   */
  function getUrlUtms() {
    const urlParams = new URLSearchParams(window.location.search);
    const utms = {};
    UTM_PARAMS.forEach((param) => {
      const value = urlParams.get(param);
      if (value) {
        utms[param] = value;
      }
    });
    return utms;
  }

  /**
   * Checks if the referrer is a known search engine
   * @returns {boolean} True if the referrer is a search engine
   */
  function isFromSearchEngine() {
    if (!document.referrer) return false;
    const referrerDomain = getDomain(document.referrer);
    return SEARCH_ENGINES.some((engine) => referrerDomain.includes(engine));
  }

  /**
   * Checks if the referrer is a known LLM (Large Language Model) domain
   * @returns {boolean} True if the referrer is from an LLM domain
   */
  function isFromLLM() {
    if (!document.referrer) return false;
    const referrerHostname = getDomain(document.referrer);
    return LLM_DOMAINS.some((llm) => referrerHostname.includes(llm));
  }

  /**
   * Determines if the traffic came from a paid source based on UTM parameters
   * @param {Object} utms - UTM parameters object
   * @returns {boolean} True if the traffic appears to be from a paid source
   */
  function isPaidTraffic(utms) {
    if (!utms) return false;

    return (
      // Check all UTM values for paid indicators
      paidCampaignIndicators.some(indicator => 
        Object.values(utms).some(value => 
          value?.toLowerCase().includes(indicator)
        )
      )
    );
  }

  /**
   * Gets the domain of the current page
   * @returns {string} The domain of the current page
   */
  function getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Checks if this is a new user session by looking for a temporary cookie
   * 
   * If the temporary cookie exists, it means the user is in an existing session,
   * so return false. Otherwise, set the temporary cookie and return true to 
   * indicate this is a new session.
   * 
   * The temporary cookie (URL_TEMP_COOKIE_NAME) acts as a session marker that
   * expires when the browser is closed, allowing us to track new vs returning 
   * sessions.
   * 
   * @returns {boolean} True if this is a new session, false if existing session
   */
  function isNewSession() {
    if (getCookie(URL_TEMP_COOKIE_NAME)) {
      return false;
    } else {
      setCookie(URL_TEMP_COOKIE_NAME, "1");
      return true;
    }
  }
    
  /**
   * Tracks the current page in the user's browsing history
   * This is separate from attribution to ensure we always record the path
   * regardless of attribution rules
   */
  function trackPageView() {
    try {
      const currentUrl = window.location.href;
      const pathHistory = getCookie(PATH_HISTORY_COOKIE) || [];
      
      // Limit history size to avoid cookie size issues
      const MAX_HISTORY = 25;
      
      // Only add if not already the last page viewed (avoid duplicates)
      if (pathHistory.length === 0 || pathHistory[pathHistory.length - 1] !== currentUrl) {
        // Add current URL to history
        pathHistory.push(currentUrl);
        
        // Keep only the most recent entries
        const trimmedHistory = pathHistory.slice(-MAX_HISTORY);
        
        // Save updated history - lasts for 30 days
        setCookie(PATH_HISTORY_COOKIE, trimmedHistory, 30 * 24 * 60);
      }
    } catch (e) {
      console.warn("Error tracking page view:", e);
    }
  }

  /**
   * Collects comprehensive traffic data based on referrer, UTMs, and other signals
   * @returns {Object|null} Complete traffic data object or null if an error occurs
   */
  function getTrafficData() {
    try {
      // Get all data at the beginning of the function
      const urlUtms = getUrlUtms();
      const referrerUrl = document.referrer;
      const referrerHostname = referrerUrl ? getDomain(referrerUrl) : null;
      const currentTimestamp = new Date().toISOString();
      const currentLandingPageUrl = getCurrentUrl();
      const currentSiteHostname = window.location.hostname;
      
      // Check if this is internal navigation
      const isInternalNavigation = referrerHostname === currentSiteHostname;
      
      // For internal navigation, try to reuse the existing attribution data 
      // instead of creating new attribution
      if (isInternalNavigation) {
        const lastTouch = getCookie(LAST_TOUCH_COOKIE);
        if (lastTouch) {
          // Return the existing attribution data with updated current page
          return {
            ...lastTouch,
            current_page: currentLandingPageUrl,
            previous_page: referrerUrl,
            is_internal_navigation: true,
            timestamp: currentTimestamp // Update timestamp
          };
        }
      }
      
      // Base tracking data
      const trackingData = {
        timestamp: currentTimestamp,
        landing_page: currentLandingPageUrl,
        entry_page: currentLandingPageUrl, // Store the original entry page
        referrer: referrerUrl || "(none)",
        is_internal_navigation: false, // Mark as external traffic
        device: {
          language: navigator.language,
          platform: navigator.userAgentData?.platform || navigator.platform || "unknown"
        }
      };

      // Case 1: Has UTMs (non-paid traffic)
      if (Object.keys(urlUtms).length > 0 && !isPaidTraffic(urlUtms)) {
        const utmData = {
          utm_source: urlUtms.utm_source || "(not-set)",
          utm_medium: urlUtms.utm_medium || "(not-set)",
          utm_campaign: urlUtms.utm_campaign || "(not-set)",
          utm_term: urlUtms.utm_term || "(not-set)",
          utm_content: urlUtms.utm_content || "(not-set)",
        };
        return { ...trackingData, ...utmData, traffic_type: "url_utm" };
      }

      // Case 2: Paid traffic with UTMs
      if (Object.keys(urlUtms).length > 0 && isPaidTraffic(urlUtms)) {
        let paidMedium = 'paid';
        if (urlUtms.utm_medium) {
          const mediumLower = urlUtms.utm_medium.toLowerCase();
          if (mediumLower.includes('cpc') || mediumLower.includes('ppc')) {
            paidMedium = 'cpc';
          } else if (mediumLower.includes('display')) {
            paidMedium = 'display';
          }
        }
        return {
          ...trackingData,
          ...urlUtms,
          utm_source: urlUtms.utm_source || "paid_traffic",
          utm_medium: paidMedium,
          utm_campaign: urlUtms.utm_campaign || "undefined_campaign",
          traffic_type: "paid"
        };
      }

      // Case 3: Comes from search engine
      if (isFromSearchEngine()) {
        const searchEngine = SEARCH_ENGINES.find(
          engine => referrerHostname && referrerHostname.includes(engine)
        );
        return {
          ...trackingData,
          utm_source: searchEngine || "other_search",
          utm_medium: "organic",
          traffic_type: "organic"
        };
      }

      // Case 4: Comes from an LLM
      if (isFromLLM()) {
        const llmSource = LLM_DOMAINS.find(
          llm => referrerHostname && referrerHostname.includes(llm)
        ) || "unknown_llm";
        return {
          ...trackingData,
          utm_source: llmSource,
          utm_medium: "llm",
          traffic_type: "llm"
        };
      }

      // Case 5: Direct traffic (no referrer at all)
      if (!referrerHostname) {
        return {
          ...trackingData,
          utm_source: "direct",
          utm_medium: "(none)",
          traffic_type: "direct"
        };
      }

      // Case 6: External referrer traffic
      return {
        ...trackingData,
        utm_source: referrerHostname,
        utm_medium: "referral",
        traffic_type: "referral"
      };
    } catch (e) {
      console.warn("Error getting traffic data:", e);
      return null;
    }
  }

  /**
   * Updates first touch and last touch cookies with traffic attribution data
   * First touch is set only once per user, last touch updates on new sessions
   */
  function updateTouchPoints() {
    try {
      const trafficData = getTrafficData();
      if (!trafficData) return; // Shouldn't happen with our new design, but keep as safety
      
      // If this is internal navigation, we just want to update page history
      // but NOT change the original attribution data
      if (trafficData.is_internal_navigation) {
        // Don't update first or last touch cookies for internal navigation
        return;
      }
      
      // Handle external traffic (original referrers)
      
      // Update first touch only if it doesn't exist
      const firstTouch = getCookie(FIRST_TOUCH_COOKIE);
      if (!firstTouch) {
        setCookie(FIRST_TOUCH_COOKIE, {
          ...trafficData,
          touch_type: "first_touch",
          entry_point: trafficData.landing_page // Store original entry URL
        }, 365 * 24 * 60); // 1 year
      }
      
      // For last touch, check if it's a new session
      const isNewUserSession = isNewSession();
      const lastTouch = getCookie(LAST_TOUCH_COOKIE);
      
      // Update last touch if new session or it doesn't exist
      if (!lastTouch || isNewUserSession) {
        // Set last touch with session info
        setCookie(LAST_TOUCH_COOKIE, {
          ...trafficData,
          touch_type: "last_touch",
          is_new_session: isNewUserSession,
          entry_point: trafficData.landing_page
        }); // Session cookie
      }
    } catch (e) {
      console.warn("Error updating touch points:", e);
    }
  }

  // Initialize tracking
  document.addEventListener("DOMContentLoaded", function () {
    try {
      // Track page view in history before anything else
      trackPageView();
      
      // Standard attribution tracking
      updateTouchPoints();
    } catch (err) {
      console.warn("Error initializing tracking data:", err);
    }
  });
})();