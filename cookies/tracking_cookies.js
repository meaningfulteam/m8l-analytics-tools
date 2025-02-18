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

  function sanitizeValue(value) {
    if (typeof value !== 'string') return '';
    return value
      .slice(0, 500) // Limit string length
      .replace(/[<>]/g, '') // Remove potential HTML/script tags
      .trim();
  }

  // Tracking functions
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

  function isFromSearchEngine() {
    if (!document.referrer) return false;
    const referrerDomain = getDomain(document.referrer);
    return SEARCH_ENGINES.some((engine) => referrerDomain.includes(engine));
  }

  function isFromLLM() {
    if (!document.referrer) return false;
    return LLM_DOMAINS.some((llm) => document.referrer.includes(llm));
  }

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

  function getCurrentDomain() {
    return getDomain(window.location.href);
  }

  function isNewSession() {
    if (getCookie(URL_TEMP_COOKIE_NAME)) {
      return false;
    } else {
      setCookie(URL_TEMP_COOKIE_NAME, "1");
      return true;
    }
  }

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

      // Always update last touch if it's a new session
      if (isNewSession()) {
        setCookie(LAST_TOUCH_COOKIE, {
          ...trafficData,
          touch_type: "last_touch"
        }, 30 * 24 * 60); // 30 days
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