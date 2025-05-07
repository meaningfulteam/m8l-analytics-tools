document.addEventListener('DOMContentLoaded', () => {
    // Get template dashboard ID from input field
    const templateDashboardIdInput = document.getElementById('templateDashboardId');
    let templateDashboardId = templateDashboardIdInput ? templateDashboardIdInput.value : 'd29cdb49-1055-460b-882c-9a8630051579';
    
    // Default data source aliases for common template dashboards
    // Map dashboard IDs to their known data source aliases
    const knownDashboardAliases = {
        'd29cdb49-1055-460b-882c-9a8630051579': {
            'SITE_IMPRESSION': '0',    // The alias for SITE_IMPRESSION data source
            'URL_IMPRESSION': '269'    // The alias for URL_IMPRESSION data source
        }
        // Add more dashboard IDs and their aliases as needed
    };
    
    // Track number of data sources
    let dataSourceCount = 1;
    
    // Initialize event listeners
    initEventListeners();
    initAccordion();
    
    function extractDashboardId(url) {
        // Improved regex pattern to match dashboard IDs in various URL formats
        // This pattern looks for a UUID format (8-4-4-4-12 hexadecimal characters)
        // It can find IDs in various URL formats, not just after "reporting/"
        const regex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i;
        const match = url.match(regex);
        return match ? match[1] : null;
    }
    
    function getDataSourceAlias(tableType, inputAlias, dashboardId) {
        // First check if we know the aliases for this dashboard
        if (knownDashboardAliases[dashboardId] && knownDashboardAliases[dashboardId][tableType]) {
            return knownDashboardAliases[dashboardId][tableType];
        }
        
        // If we don't know this dashboard or this alias, use the provided alias
        // but sanitize it for Looker Studio
        if (inputAlias) {
            // Remove spaces, colons, and other invalid characters
            return inputAlias.replace(/[^a-zA-Z0-9]/g, "");
        }
        
        // Fallback to a numbered alias
        return tableType === 'SITE_IMPRESSION' ? '0' : '1';
    }
    
    function initEventListeners() {
        // Toggle connector fields based on selection
        document.querySelectorAll('[id^="ds"][id$="-connector"]').forEach(select => {
            select.addEventListener('change', toggleConnectorFields);
        });
        
        // Add new data source
        document.getElementById('addDataSource').addEventListener('click', addDataSource);
        
        // Generate URL button
        document.getElementById('generateUrl').addEventListener('click', generateUrl);
        
        // Copy URL button
        document.getElementById('copyUrl').addEventListener('click', copyUrl);
        
        // Add event listeners to tableType selects
        document.querySelectorAll('[id^="ds"][id$="-tableType"]').forEach(select => {
            select.addEventListener('change', handleTableTypeChange);
        });

        // Update template dashboard ID when changed
        if (templateDashboardIdInput) {
            templateDashboardIdInput.addEventListener('change', (e) => {
                const url = e.target.value;
                const extractedId = extractDashboardId(url);
                if (extractedId) {
                    templateDashboardId = extractedId;
                    e.target.value = extractedId; // Update input with just the ID
                    
                    // Update placeholder text in alias fields based on known aliases
                    updateAliasPlaceholders(templateDashboardId);
                } else {
                    templateDashboardId = url; // Use the input as is if no ID found
                }
            });
        }
    }
    
    function updateAliasPlaceholders(dashboardId) {
        // Update alias input placeholders if we know this dashboard's aliases
        if (knownDashboardAliases[dashboardId]) {
            // Update placeholders in alias input fields
            document.querySelectorAll('[id$="-alias"]').forEach(input => {
                const dsIndex = input.id.match(/ds(\d+)/)[1];
                const tableTypeSelect = document.getElementById(`ds${dsIndex}-tableType`);
                
                if (tableTypeSelect) {
                    const tableType = tableTypeSelect.value;
                    if (knownDashboardAliases[dashboardId][tableType]) {
                        input.placeholder = `Recommended alias: ${knownDashboardAliases[dashboardId][tableType]}`;
                    }
                }
            });
            
            // Update and show dashboard info section
            const dashboardInfo = document.getElementById('dashboardInfo');
            if (dashboardInfo) {
                const siteAlias = document.getElementById('siteImpressionAlias');
                const urlAlias = document.getElementById('urlImpressionAlias');
                
                if (siteAlias) {
                    siteAlias.textContent = knownDashboardAliases[dashboardId]['SITE_IMPRESSION'] || 'Unknown';
                }
                
                if (urlAlias) {
                    urlAlias.textContent = knownDashboardAliases[dashboardId]['URL_IMPRESSION'] || 'Unknown';
                }
                
                dashboardInfo.style.display = 'block';
            }
        } else {
            // Hide dashboard info if we don't know this dashboard
            const dashboardInfo = document.getElementById('dashboardInfo');
            if (dashboardInfo) {
                dashboardInfo.style.display = 'none';
            }
        }
    }
    
    function initAccordion() {
        // Add click event to all accordion headers
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                // Toggle active class on the parent
                header.parentElement.classList.toggle('active');
            });
        });
    }
    
    function handleTableTypeChange(event) {
        // Get the selected table type
        const tableType = event.target.value;
        const dsIndex = event.target.id.match(/ds(\d+)/)[1];
        
        // Get the aggregation type select for this data source
        const aggregationSelect = document.getElementById(`ds${dsIndex}-aggregationType`);
        
        // Optionally update the aggregation type based on table type
        if (tableType === 'SITE_IMPRESSION') {
            // Suggest property-level aggregations
            if (['byPage', 'byQuery'].includes(aggregationSelect.value)) {
                aggregationSelect.value = 'byProperty';
            }
        } else if (tableType === 'URL_IMPRESSION') {
            // Suggest page-level aggregations
            if (['byProperty', 'byCountry', 'byDevice'].includes(aggregationSelect.value)) {
                aggregationSelect.value = 'byPage';
            }
        }
    }
    
    function toggleConnectorFields(event) {
        const connector = event.target.value;
        const dsIndex = event.target.id.match(/ds(\d+)/)[1];
        
        // Hide all connector fields
        document.querySelectorAll(`#dataSource${dsIndex} .connector-fields`).forEach(field => {
            field.style.display = 'none';
        });
        
        // Show the appropriate fields
        if (connector === 'searchConsole') {
            document.querySelector(`#dataSource${dsIndex} .searchConsole-fields`).style.display = 'block';
        } else if (connector === 'googleAnalytics4') {
            document.querySelector(`#dataSource${dsIndex} .googleAnalytics4-fields`).style.display = 'block';
        } else if (connector === 'bigQuery') {
            document.querySelector(`#dataSource${dsIndex} .bigQuery-fields`).style.display = 'block';
        } else if (connector === 'googleSheets') {
            document.querySelector(`#dataSource${dsIndex} .googleSheets-fields`).style.display = 'block';
        } else if (connector === 'mysql' || connector === 'postgresql') {
            document.querySelector(`#dataSource${dsIndex} .sql-fields`).style.display = 'block';
        }
    }
    
    function addDataSource() {
        const dataSourcesContainer = document.getElementById('dataSources');
        const newIndex = dataSourceCount;
        dataSourceCount++;
        
        // Clone the first data source as a template
        const templateDataSource = document.getElementById('dataSource0');
        const newDataSource = templateDataSource.cloneNode(true);
        
        // Update IDs and labels
        newDataSource.id = `dataSource${newIndex}`;
        newDataSource.querySelector('h3').textContent = `Data Source ${dataSourceCount}`;
        
        // Update all input IDs and labels
        newDataSource.querySelectorAll('[id^="ds0"]').forEach(element => {
            const newId = element.id.replace('ds0', `ds${newIndex}`);
            element.id = newId;
            
            // Update associated label if it exists
            const label = newDataSource.querySelector(`label[for="${element.id}"]`);
            if (label) {
                label.setAttribute('for', newId);
            }
        });
        
        // Reset values
        newDataSource.querySelectorAll('input, select, textarea').forEach(input => {
            input.value = '';
            if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            }
        });
        
        // Hide all connector fields and show only default (searchConsole)
        newDataSource.querySelectorAll('.connector-fields').forEach(field => {
            field.style.display = 'none';
        });
        newDataSource.querySelector('.searchConsole-fields').style.display = 'block';
        
        // Add event listeners to the new select elements
        newDataSource.querySelectorAll('select').forEach(select => {
            if (select.id.endsWith('-connector')) {
                select.addEventListener('change', toggleConnectorFields);
            } else if (select.id.endsWith('-tableType')) {
                select.addEventListener('change', handleTableTypeChange);
            }
        });
        
        // Add delete button to header
        const headerDiv = newDataSource.querySelector('.data-source-header');
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn-delete';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteDataSource(newIndex));
        headerDiv.appendChild(deleteButton);
        
        // Append new data source
        dataSourcesContainer.appendChild(newDataSource);
    }
    
    function deleteDataSource(index) {
        const dataSource = document.getElementById(`dataSource${index}`);
        if (!dataSource) return;
        
        // Remove the data source element
        dataSource.remove();
        
        // Update data source count and renumber remaining data sources
        dataSourceCount--;
        updateDataSourceLabels();
    }
    
    function updateDataSourceLabels() {
        // Get all data source elements
        const dataSources = document.querySelectorAll('.data-source');
        
        // Update each data source's heading
        dataSources.forEach((dataSource, i) => {
            const heading = dataSource.querySelector('h3');
            if (heading) {
                heading.textContent = `Data Source ${i + 1}`;
            }
        });
    }
    
    function generateUrl() {
        // Base URL
        const isEmbed = document.getElementById('embedOption').checked;
        let baseUrl = isEmbed ? 
            'https://lookerstudio.google.com/embed/reporting/create?' : 
            'https://lookerstudio.google.com/reporting/create?';
        
        // Add template report ID
        const params = [`c.reportId=${templateDashboardId}`];
        
        // Add report name
        const reportName = document.getElementById('reportName').value;
        if (reportName) {
            params.push(`r.reportName=${encodeURIComponent(reportName)}`);
        }
        
        // Get all data source elements
        const dataSources = document.querySelectorAll('.data-source');
        
        // Process each data source - focusing on Search Console first
        dataSources.forEach((dataSource, index) => {
            const id = dataSource.id.match(/dataSource(\d+)/)[1];
            
            const connector = document.getElementById(`ds${id}-connector`).value;
            if (connector !== 'searchConsole') return; // Skip non-search console data sources
            
            const tableType = document.getElementById(`ds${id}-tableType`).value;
            const dsName = document.getElementById(`ds${id}-name`).value;
            if (!dsName) return;
            
            // Get the data source alias from the input field
            const dsAliasInput = document.getElementById(`ds${id}-alias`);
            const userAlias = dsAliasInput ? dsAliasInput.value : '';
            
            // Get the appropriate alias based on the tableType and template dashboard
            const dsAlias = getDataSourceAlias(tableType, userAlias, templateDashboardId);
            
            if (!dsAlias) return; // Skip if no alias provided
                        
            params.push(`ds.${dsAlias}.datasourceName=${encodeURIComponent(dsName)}`);
            params.push(`ds.${dsAlias}.connector=${connector}`);
            
            // Add connector-specific parameters
            try {
                const propertyUrl = document.getElementById(`ds${id}-propertyUrl`).value;
                const searchType = document.getElementById(`ds${id}-searchType`).value;
                const aggregationType = document.getElementById(`ds${id}-aggregationType`).value;
                
                if (propertyUrl) {
                    // Check if it's a domain property and needs the sc-domain: prefix
                    let formattedUrl = propertyUrl;
                    if (propertyUrl.indexOf('://') === -1 && !propertyUrl.startsWith('sc-domain:')) {
                        formattedUrl = 'sc-domain:' + propertyUrl;
                    }
                    params.push(`ds.${dsAlias}.siteUrl=${encodeURIComponent(formattedUrl)}`);
                }
                
                // Set the required search type parameter
                if (searchType) {
                    // Convert from lowercase to uppercase (web -> WEB)
                    const formattedSearchType = searchType.toUpperCase();
                    params.push(`ds.${dsAlias}.searchType=${formattedSearchType}`);
                }
                
                // Use the explicitly selected tableType
                if (tableType) {
                    params.push(`ds.${dsAlias}.tableType=${tableType}`);
                }
                
                if (aggregationType) {
                    params.push(`ds.${dsAlias}.dimensionFilterExp=${aggregationType}`);
                }
            } catch (error) {
                console.error(`Error processing data source ${id}:`, error);
                // Continue with the next data source
            }
        });
        
        // Process non-Search Console data sources if needed
        let dsIndex = 300; // Start from a higher number to avoid conflicts
        dataSources.forEach((dataSource, index) => {
            const id = dataSource.id.match(/dataSource(\d+)/)[1];
            
            const connector = document.getElementById(`ds${id}-connector`).value;
            if (connector === 'searchConsole') return; // Skip search console data sources (already processed)
            
            const dsName = document.getElementById(`ds${id}-name`).value;
            if (!dsName) return;
            
            // Get the data source alias from the input field and sanitize it
            const dsAliasInput = document.getElementById(`ds${id}-alias`);
            const userAlias = dsAliasInput ? dsAliasInput.value : '';
            const dsAlias = userAlias ? userAlias.replace(/[^a-zA-Z0-9]/g, "") : `${dsIndex}`;
            
            if (!dsAlias) return; // Skip if no alias provided
            
            params.push(`ds.${dsAlias}.datasourceName=${encodeURIComponent(dsName)}`);
            params.push(`ds.${dsAlias}.connector=${connector}`);
            
            // Add connector-specific parameters
            try {
                if (connector === 'googleAnalytics4') {
                    const propertyId = document.getElementById(`ds${id}-propertyId`).value;
                    if (propertyId) params.push(`ds.${dsAlias}.propertyId=${encodeURIComponent(propertyId)}`);
                } else if (connector === 'bigQuery') {
                    const projectId = document.getElementById(`ds${id}-projectId`).value;
                    const datasetId = document.getElementById(`ds${id}-datasetId`).value;
                    const tableId = document.getElementById(`ds${id}-tableId`).value;
                    const type = document.getElementById(`ds${id}-type`).value;
                    
                    if (projectId) params.push(`ds.${dsAlias}.projectId=${encodeURIComponent(projectId)}`);
                    if (datasetId) params.push(`ds.${dsAlias}.datasetId=${encodeURIComponent(datasetId)}`);
                    if (tableId) params.push(`ds.${dsAlias}.tableId=${encodeURIComponent(tableId)}`);
                    if (type) params.push(`ds.${dsAlias}.type=${type}`);
                } else if (connector === 'googleSheets') {
                    const spreadsheetId = document.getElementById(`ds${id}-spreadsheetId`).value;
                    if (spreadsheetId) params.push(`ds.${dsAlias}.spreadsheetId=${encodeURIComponent(spreadsheetId)}`);
                } else if (connector === 'mysql' || connector === 'postgresql') {
                    const sql = document.getElementById(`ds${id}-sql`).value;
                    if (sql) params.push(`ds.${dsAlias}.sql=${encodeURIComponent(sql)}`);
                }
            } catch (error) {
                console.error(`Error processing data source ${id}:`, error);
                // Continue with the next data source
            }
            
            dsIndex++;
        });
        
        // Build the final URL
        const finalUrl = baseUrl + params.join('&');
        
        // Display the result
        document.getElementById('generatedUrl').value = finalUrl;
        document.getElementById('openUrl').href = finalUrl;
        document.getElementById('resultSection').style.display = 'block';
        
        // Scroll to result
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }
    
    function copyUrl() {
        const urlTextarea = document.getElementById('generatedUrl');
        urlTextarea.select();
        document.execCommand('copy');
        
        // Visual feedback
        const copyBtn = document.getElementById('copyUrl');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }
}); 