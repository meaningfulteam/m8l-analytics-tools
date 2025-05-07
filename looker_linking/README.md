# Looker Studio Dashboard Link Generator

A simple web application that generates Looker Studio dashboard links using the Looker Studio Linking API, optimized for Google Search Console and Google Analytics 4 integrations.

## Overview

This tool allows you to:

1. Generate links to create Looker Studio dashboards based on a template dashboard
2. Configure multiple data sources, with special focus on:
   - Google Search Console properties
   - Google Analytics 4 properties
3. Configure other data sources, including:
   - BigQuery
   - Google Sheets
   - MySQL/PostgreSQL
4. Add and remove data sources as needed
5. Generate both standard and embedded links
6. Copy the generated link or open it directly in a new tab

## Files

- `index.html` - The HTML structure for the form and UI
- `styles.css` - CSS styling for the application
- `script.js` - JavaScript functionality for generating the links

## How to Use

1. Fill in the "Report Name" field to set a name for your new dashboard
2. Configure one or more data sources:
   - Enter a name for each data source
   - Select the connector type (Google Search Console, Google Analytics 4, etc.)
   - Fill in the connector-specific fields:
     - For Google Search Console: Property URL, Search Type, and Aggregation Type
     - For Google Analytics 4: Property ID
     - For other connectors: Relevant fields for that data source
   - Click "Add Another Data Source" to add multiple data sources
   - Use the "Delete" button to remove data sources you no longer need
3. Click "Generate URL" to create the link
4. Use the "Copy URL" button to copy the link to your clipboard
5. Click "Open in New Tab" to directly open the generated dashboard in Looker Studio

## Field Descriptions and Help

The application includes detailed information to help you fill out the form correctly:

- Each field has a description explaining what information is needed
- The "How to Find Your Data" section provides step-by-step instructions for locating the required information in:
  - Google Search Console
  - Google Analytics 4
  - BigQuery
  - Google Sheets

## Google Search Console Configuration Options

When configuring a Google Search Console data source, you can set:

- **Property URL**: The URL of your website registered in Search Console (e.g., https://example.com/)
  - For domain properties (without http:// or https://), the app automatically adds the required "sc-domain:" prefix
- **Table Type**: The data structure to use (explicitly required by the Looker Studio API)
  - `SITE_IMPRESSION`: For property-level data (appropriate for "By Property", "By Country", or "By Device" aggregations)
  - `URL_IMPRESSION`: For page-level data (appropriate for "By Page" or "By Query" aggregations)
- **Search Type**: The type of search data to include (Web, Image, Video, News)
- **Aggregation Type**: How to group the data (By Property, By Page, By Query, By Country, By Device)

The application allows you to explicitly set the required `tableType` parameter, which makes it more flexible for different reporting needs. However, for best results, ensure that your Table Type matches your Aggregation Type:
- Use `SITE_IMPRESSION` with "By Property", "By Country", or "By Device" aggregations
- Use `URL_IMPRESSION` with "By Page" or "By Query" aggregations

## Google Analytics 4 Configuration Options

When configuring a Google Analytics 4 data source, you need to provide:

- **Property ID**: Your GA4 property ID (e.g., 123456789)

## Embedding in Webflow

To embed this application in Webflow:

1. Upload all three files (`index.html`, `styles.css`, and `script.js`) to a web hosting service that supports static files (e.g., GitHub Pages, Netlify, Vercel)
2. In Webflow, add an "Embed" element to your page
3. Use an iframe to embed the hosted application:

```html
<iframe 
  src="https://your-hosting-url.com/index.html" 
  width="100%" 
  height="800px" 
  style="border: none; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);"
  title="Looker Studio Dashboard Link Generator">
</iframe>
```

4. Adjust the iframe height as needed to fit the form

## Alternative Integration Methods

### Method 1: Direct Code Embed
If your Webflow plan supports custom code blocks:

1. Add a custom code block to your Webflow page
2. Copy and paste the content of all three files, wrapped in appropriate HTML tags:

```html
<style>
  /* Content of styles.css */
</style>

<div class="container">
  <!-- Content of index.html (without the DOCTYPE, html, head, and body tags) -->
</div>

<script>
  // Content of script.js
</script>
```

### Method 2: External Hosting with Fetch
Host the files on a static hosting service and load them dynamically in a custom code block:

```html
<div id="dashboard-generator"></div>

<script>
  fetch('https://your-hosting-url.com/index.html')
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const content = doc.querySelector('.container');
      document.getElementById('dashboard-generator').appendChild(content);
      
      // Load CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://your-hosting-url.com/styles.css';
      document.head.appendChild(link);
      
      // Load JS
      const script = document.createElement('script');
      script.src = 'https://your-hosting-url.com/script.js';
      document.body.appendChild(script);
    });
</script>
```

## Customization

- To use a different template dashboard, update the `templateDashboardId` variable in `script.js`
- Modify the CSS in `styles.css` to match your Webflow site's visual design
- Add additional form fields for more dashboard parameters as needed 