(function () {
  const COOKIE_NAME = "m8l-utms";
  const UTM_PARAMS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
  ];
  const SEARCH_ENGINES = ["google.com", "bing.com", "yahoo.com"];

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

  function getCurrentUtms() {
    try {
      const urlUtms = getUrlUtms();
      if (Object.keys(urlUtms).length > 0) {
        saveUtms(urlUtms);
        return urlUtms;
      }

      const savedUtms = getSavedUtms();
      if (Object.keys(savedUtms).length > 0) {
        return savedUtms;
      }

      if (isFromSearchEngine()) {
        const organicUtms = {
          utm_medium: "organic",
          utm_source:
            SEARCH_ENGINES.find((engine) =>
              document.referrer.includes(engine)
            ) || "search",
        };
        saveUtms(organicUtms);
        return organicUtms;
      }

      if (!document.referrer) {
        const directUtms = {
          utm_source: "direct",
          utm_medium: "(none)",
        };
        saveUtms(directUtms);
        return directUtms;
      }

      return {};
    } catch (e) {
      console.warn("Error getting current UTMs:", e);
      return {};
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      updateUtmData();
    } catch (err) {
      console.warn("Error initializing UTM data: " + err);
    }
  });
})();
