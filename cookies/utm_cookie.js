(function () {
  const COOKIE_NAME = "m8l-utms";
  const COOKIE_TEMP_NAME = "m8l-urls-temp";
  const UTM_PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const SEARCH_ENGINES = ["google.com", "bing.com", "yahoo.com"];
  const LLM_DOMAINS = [
    "chatgpt.com",
    "perplexity.ai",
    "claude.ai",
    "grok.com",
    "gemini.google.com",
    "deepseek.com"
    // Add any other relevant LLM domains here
  ];

  // Add paid traffic indicators
  const PAID_INDICATORS = ["cpc", "paid", "ppc", "ads", "adwords", "display", "banner", "sponsored"];

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
      return cookie ? cookie.substring(name.length + 1) : null;
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

  function saveUtms(utms) {
    const cookieObj = {};
    UTM_PARAMS.forEach((param) => {
      cookieObj[param] = utms[param] || "(not-set)";
    });
    setCookie(COOKIE_NAME, cookieObj, 30 * 24 * 60); // 30 días
  }

  function getSavedUtms() {
    const data = getCookie(COOKIE_NAME);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn("Error parsing UTM data:", e);
        return {};
      }
    }
    return {};
  }

  function isNewSession() {
    if (getCookie(COOKIE_TEMP_NAME)) {
      return false;
    }
    setCookie(COOKIE_TEMP_NAME, "1", 30); // 30 minutes session
    return true;
  }

  function updateCurrentUtms() {
    try {
      const urlUtms = getUrlUtms();
      const referrerDomain = document.referrer ? getDomain(document.referrer) : null;

      // Case 1: Handle paid traffic or traffic with UTMs
      if (Object.keys(urlUtms).length > 0) {
        // Check if it's paid traffic
        if (isPaidTraffic(urlUtms)) {
          urlUtms.utm_source = urlUtms.utm_source || "paid_traffic";
          
          // Determine specific paid medium
          if (urlUtms.utm_medium) {
            if (urlUtms.utm_medium.includes('cpc') || urlUtms.utm_medium.includes('ppc')) {
              urlUtms.utm_medium = 'cpc';
            } else if (urlUtms.utm_medium.includes('display')) {
              urlUtms.utm_medium = 'display';
            } else {
              urlUtms.utm_medium = 'paid';
            }
          } else {
            urlUtms.utm_medium = 'paid';
          }
          
          // Ensure campaign tracking for paid traffic
          urlUtms.utm_campaign = urlUtms.utm_campaign || 'undefined_campaign';
        }

        // Ensure all required UTM parameters exist
        UTM_PARAMS.forEach(param => {
          if (!urlUtms[param]) {
            urlUtms[param] = "(not-set)";
          }
        });

        saveUtms(urlUtms);
        return urlUtms;
      }

      // Case 2: Comes from search engine
      if (isFromSearchEngine()) {
        const searchEngine = SEARCH_ENGINES.find(
          engine => document.referrer.includes(engine)
        );
        const organicUtms = {
          utm_source: searchEngine || "search",
          utm_medium: "organic",
        };
        saveUtms(organicUtms);
        return organicUtms;
      }

      // Case 3: Comes from an LLM
      if (isFromLLM()) {
        const llmSource = LLM_DOMAINS.find(
          llm => document.referrer.includes(llm)
        ) || "unknown_llm";
        const llmUtms = {
          utm_source: llmSource,
          utm_medium: "llm",
        };
        saveUtms(llmUtms);
        return llmUtms;
      }

      // Case 4: Direct traffic (no referrer)
      if (!referrerDomain) {
        const directUtms = {
          utm_source: "direct",
          utm_medium: "(none)",
        };
        saveUtms(directUtms);
        return directUtms;
      }

      // Case 5: Other referrer traffic
      if (referrerDomain) {
        const referrerUtms = {
          utm_source: referrerDomain,
          utm_medium: "referral",
        };
        saveUtms(referrerUtms);
        return referrerUtms;
      }

      return {};
    } catch (e) {
      console.warn("Error getting current UTMs:", e);
      return {};
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      if (isNewSession()) {
        updateCurrentUtms();
      }
    } catch (err) {
      console.warn("Error initializing UTM data: " + err);
    }
  });
})();