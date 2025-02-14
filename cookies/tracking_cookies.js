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
    return PAID_INDICATORS.some(indicator => 
      Object.values(utms).some(value => 
        value?.toLowerCase().includes(indicator)
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
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.userAgentData?.platform || navigator.platform || "unknown"
        }
      };

      // Case 1: Has UTMs and is paid traffic
      if (Object.keys(urlUtms).length > 0 && isPaidTraffic(urlUtms)) {
        return {
          ...trackingData,
          ...urlUtms,
          traffic_type: "paid"
        };
      }

      // Case 2: Comes from search engine without paid indicators
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

      // Case 3: Comes from an LLM
      if (isFromLLM()) {
        const llmSource = LLM_DOMAINS.find(
          llm => document.referrer.includes(llm)
        ) || "unknown_llm";
        return {
          ...trackingData,
          utm_source: llmSource,
          utm_medium: "llm",
          traffic_type: "llm"
        };
      }

      // Case 4: Direct traffic
      if (!referrerDomain) {
        return {
          ...trackingData,
          utm_source: "direct",
          utm_medium: "(none)",
          traffic_type: "direct"
        };
      }

      // Case 5: Other referrer traffic
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