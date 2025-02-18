# m8l-analytics-tools

A lightweight JavaScript library for tracking and analyzing user traffic data through cookies.

## Implementation

Add the following scripts to your website's `<head>` tag:

```html
<!-- Main tracking script -->
<script src="https://cdn.jsdelivr.net/gh/your-repo/m8l-analytics-tools@latest/cookies/tracking_cookies.js"></script>
<!-- UTM tracking script -->
<script src="https://cdn.jsdelivr.net/gh/your-repo/m8l-analytics-tools@latest/cookies/utm_cookie.js"></script>
<!-- URL tracking script -->
<script src="https://cdn.jsdelivr.net/gh/your-repo/m8l-analytics-tools@latest/cookies/url_touch_points_cookie.js"></script>
```

## Cookies Module

The cookies module provides comprehensive traffic tracking and attribution functionality through three main scripts:

### tracking_cookies.js

Creates and manages two main cookies:
- `m8l-first-touch`: Stores the user's first interaction data (expires in 1 year)
- `m8l-last-touch`: Stores the most recent interaction data (expires in 30 days)

Features:
- Tracks user's first and last interaction with the site
- Identifies traffic sources (paid, organic, referral, direct, LLM)
- Captures UTM parameters and referrer data
- Stores device and session information

### utm_cookie.js

Creates and manages:
- `m8l-utms`: Stores UTM parameters and traffic source data (expires in 30 days)
- `m8l-urls-temp`: Session cookie for tracking new sessions (expires in 30 minutes)

Features:
- Captures and stores UTM parameters from URLs
- Identifies traffic sources when UTMs are not present
- Supports multiple traffic types:
  - Paid traffic (CPC, display, social ads)
  - Organic search
  - LLM referrals (ChatGPT, Claude, etc.)
  - Direct traffic
  - Referral traffic

### url_touch_points_cookie.js

Creates and manages:
- `m8l-urls`: Stores first and last URL data (expires in 30 days)
- `m8l-urls-temp`: Session cookie for tracking new sessions (expires in 30 minutes)

Features:
- Records first and last visited URLs
- Maintains session-based URL tracking
- Stores URL history for attribution

## Cookie Data Structure

### First/Last Touch Cookie Structure

```json
{
  "timestamp": "2024-03-21T10:30:00.000Z",
  "landing_page": "https://example.com/page",
  "referrer": "https://google.com",
  "traffic_type": "organic|paid|direct|referral|llm",
  "utm_source": "google",
  "utm_medium": "organic",
  "utm_campaign": "spring_sale",
  "device": {
    "language": "en-US",
    "platform": "Windows"
  },
  "touch_type": "first_touch|last_touch"
}
```

### UTM Cookie Structure

```json
{
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "spring_sale",
  "utm_term": "product",
  "utm_content": "banner1"
}
```

### URL Cookie Structure

```json
{
  "first_url": "https://example.com/landing",
  "last_url": "https://example.com/product"
}
```

## Features

- Session-based tracking
- Automatic traffic source detection
- Support for major search engines and LLM platforms
- Comprehensive UTM parameter handling
- First and last touch attribution
- Clean and maintainable codebase
- Cross-browser compatibility