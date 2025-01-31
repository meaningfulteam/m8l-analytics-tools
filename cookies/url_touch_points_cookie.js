(function () {
  const COOKIE_URL_NAME = "m8l-urls";
  const COOKIE_TEMP_NAME = "m8l-urls-temp";

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

  function getCurrentDomain() {
    return getDomain(window.location.href);
  }

  function isNewSession() {
    if (getCookie(COOKIE_TEMP_NAME)) {
      return false;
    } else {
      setCookie(COOKIE_TEMP_NAME, "1");
      return true;
    }
  }

  function getSavedUrls() {
    const data = getCookie(COOKIE_URL_NAME);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.warn("Error parsing URL data:", e);
        return {};
      }
    }
    return {};
  }

  function updateUrlData() {
    try {
      const currentDomain = getCurrentDomain();
      const savedData = getSavedUrls();
      const urlData = {};

      urlData.first_url = savedData.first_url || currentDomain;

      if (isNewSession() || !savedData.last_url) {
        urlData.last_url = currentDomain;
      } else {
        urlData.last_url = savedData.last_url;
      }

      setCookie(COOKIE_URL_NAME, urlData, 30 * 24 * 60);
    } catch (e) {
      console.warn("Error updating URL data:", e);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    try {
      updateUrlData();
    } catch (err) {
      console.warn("Error initializing URL data" + err);
    }
  });
})();
