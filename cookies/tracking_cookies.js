(function () {
  // Common constants
  const FIRST_TOUCH_COOKIE = "m8l-first-touch";
  const LAST_TOUCH_COOKIE = "m8l-last-touch";
  const URL_TEMP_COOKIE_NAME = "m8l-urls-temp";
  
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
  const PAID_INDICATORS = ["cpc", "paid", "ppc", "ads", "adwords"];

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
   * @returns {string} The domain with protocol, hostname, port and pathname
   */
  function getDomain(url) {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${
        urlObj.port ? `:${urlObj.port}` : ""
      }${urlObj.pathname}`;
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
    return LLM_DOMAINS.some((llm) => document.referrer.includes(llm));
  }

  /**
   * Determines if the traffic came from a paid source based on UTM parameters
   * @param {Object} utms - UTM parameters object
   * @returns {boolean} True if the traffic appears to be from a paid source
   */
  function isPaidTraffic(utms) {
    if (!utms) return false;
    
    // Check for paid indicators in any UTM parameter
    const paidCampaignIndicators = [
      'cpc', 'paid', 'ppc', 'ads', 'adwords', 'display', 
      'banner', 'sponsored', 'social-paid', 'fb-paid', 
      'linkedin-ads', 'twitter-ads', 'tiktok-ads', 'meta'
    ];
    
    // Check utm_medium specifically for common paid mediums
    const paidMediums = [
      'cpc', 'ppc', 'paidsearch', 'paid-social', 'paid_social',
      'display', 'cpm', 'banner', 'paid', 'social-paid'
    ];
    
    // Check utm_source for ad platforms
    const paidSources = [
      'google_ads', 'googleads', 'bing_ads', 'facebook_ads',
      'linkedin_ads', 'twitter_ads', 'tiktok_ads', 'meta_ads'
    ];

    return (
      // Check all UTM values for paid indicators
      paidCampaignIndicators.some(indicator => 
        Object.values(utms).some(value => 
          value?.toLowerCase().includes(indicator)
        )
      ) ||
      // Specific check for utm_medium
      (utms.utm_medium && 
        paidMediums.some(medium => 
          utms.utm_medium.toLowerCase().includes(medium)
        )
      ) ||
      // Specific check for utm_source
      (utms.utm_source &&
        paidSources.some(source =>
          utms.utm_source.toLowerCase().includes(source)
        )
      )
    );
  }

  /**
   * Gets the domain of the current page
   * @returns {string} The domain of the current page
   */
  function getCurrentDomain() {
    return getDomain(window.location.href);
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
   * Collects comprehensive traffic data based on referrer, UTMs, and other signals
   * @returns {Object|null} Complete traffic data object or null if an error occurs
   */
  function getTrafficData() {
    try {
      const urlUtms = getUrlUtms();
      const referrerDomain = document.referrer ? getDomain(document.referrer) : null;
      const currentTimestamp = new Date().toISOString();
      const currentUrl = getCurrentDomain();

      // Base tracking data
      const trackingData = {
        timestamp: currentTimestamp,
        landing_page: currentUrl,
        referrer: referrerDomain || "(none)",
        device: {
          language: navigator.language,
          platform: navigator.userAgentData?.platform || navigator.platform || "unknown"
        }
      };

      // Case 1: Has UTMs (non-paid traffic)
      if (Object.keys(urlUtms).length > 0 && !isPaidTraffic(urlUtms)) {
        // Ensure all UTM parameters are set
        const utmData = {
          utm_source: urlUtms.utm_source || "(not-set)",
          utm_medium: urlUtms.utm_medium || "(not-set)",
          utm_campaign: urlUtms.utm_campaign || "(not-set)",
          utm_term: urlUtms.utm_term || "(not-set)",
          utm_content: urlUtms.utm_content || "(not-set)",
        };

        return {
          ...trackingData,
          ...utmData,
          traffic_type: "url_utm"
        };
      }

      // Case 2: Paid traffic with UTMs
      if (Object.keys(urlUtms).length > 0 && isPaidTraffic(urlUtms)) {
        // Determine specific paid medium
        let paidMedium = 'paid';
        if (urlUtms.utm_medium) {
          if (urlUtms.utm_medium.includes('cpc') || urlUtms.utm_medium.includes('ppc')) {
            paidMedium = 'cpc';
          } else if (urlUtms.utm_medium.includes('display')) {
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

      // Case 3: Comes from search engine without paid indicators
      if (isFromSearchEngine()) {
        const searchEngine = SEARCH_ENGINES.find(
          engine => document.referrer.includes(engine)
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
          llm => document.referrer.includes(llm)
        ) || "unknown_llm";
        return {
          ...trackingData,
          utm_source: llmSource || "unknown_llm",
          utm_medium: "llm",
          traffic_type: "llm"
        };
      }

      // Case 5: Direct traffic
      if (!referrerDomain) {
        return {
          ...trackingData,
          utm_source: "direct",
          utm_medium: "(none)",
          traffic_type: "direct"
        };
      }

      // Case 6: Other referrer traffic
      return {
        ...trackingData,
        utm_source: referrerDomain,
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
      if (!trafficData) return;

      // Update first touch only if it doesn't exist
      const firstTouch = getCookie(FIRST_TOUCH_COOKIE);
      if (!firstTouch) {
        setCookie(FIRST_TOUCH_COOKIE, {
          ...trafficData,
          touch_type: "first_touch"
        }, 365 * 24 * 60); // 1 year
      }

      // Update last touch only if it doesn't exist or if it's a new session
      const lastTouch = getCookie(LAST_TOUCH_COOKIE);
      if (!lastTouch) {
        // Log session info
        trafficData.is_new_session = isNewSession();
        setCookie(LAST_TOUCH_COOKIE, {
          ...trafficData,
          touch_type: "last_touch"
        }); // Session cookie (expires when browser closes)
      }
    } catch (e) {
      console.warn("Error updating touch points:", e);
    }
  }

  // Initialize tracking
  document.addEventListener("DOMContentLoaded", function () {
    try {
      updateTouchPoints();
    } catch (err) {
      console.warn("Error initializing tracking data:", err);
    }
  });
})(); 