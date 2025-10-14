document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('toggleBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearBtn = document.getElementById('clearBtn');
  const status = document.getElementById('status');
  const svgCountEl = document.getElementById('svgCount');
  const copiedCountEl = document.getElementById('copiedCount');
  
  let isActive = false;
  let svgCount = 0;
  let copiedCount = 0;
  
  // Check current state when popup opens
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getState"}, function(response) {
      if (chrome.runtime.lastError) {
        // Content script not loaded yet, ignore
        return;
      }
      if (response && response.isActive) {
        setActiveState(true);
        updateStats(response.svgCount, response.copiedCount);
      }
    });
  });
  
  // Toggle SVG detection
  toggleBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const action = isActive ? "deactivate" : "activate";
      chrome.tabs.sendMessage(tabs[0].id, {action: action}, function(response) {
        if (chrome.runtime.lastError) {
          showNotification('Please refresh the page and try again', 'error');
          return;
        }
        if (response) {
          setActiveState(response.isActive);
          updateStats(response.svgCount, response.copiedCount);
        }
      });
    });
  });
  
  // Copy all SVGs
  copyAllBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "copyAll"}, function(response) {
        if (chrome.runtime.lastError) {
          showNotification('Failed to copy SVGs', 'error');
          return;
        }
        if (response && response.success) {
          showNotification(`Copied ${response.count} SVGs to clipboard!`, 'success');
          updateStats(response.svgCount, response.copiedCount);
        } else {
          showNotification('No SVGs found to copy', 'error');
        }
      });
    });
  });
  
  // Download SVGs as ZIP
  downloadBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "getSVGsForDownload"}, async function(response) {
        if (chrome.runtime.lastError) {
          showNotification('Failed to get SVGs', 'error');
          return;
        }
        
        if (!response || !response.svgs || response.svgs.length === 0) {
          showNotification('No SVGs found to download', 'error');
          return;
        }
        
        try {
          // Create ZIP file using JSZip
          const zip = new JSZip();
          
          response.svgs.forEach((svgData, index) => {
            const filename = `svg-icon-${index + 1}.svg`;
            let svgContent = svgData.content;
            
            // Ensure proper SVG format
            if (!svgContent.includes('<?xml')) {
              svgContent = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgContent;
            }
            
            // Clean up the SVG content
            svgContent = svgContent.replace(/\s+/g, ' ').trim();
            
            zip.file(filename, svgContent);
          });
          
          // Generate the ZIP file
          const blob = await zip.generateAsync({type: "blob"});
          
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `svg-icons-${new Date().toISOString().slice(0, 10)}.zip`;
          
          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up
          setTimeout(() => URL.revokeObjectURL(url), 100);
          
          showNotification(`Downloaded ${response.svgs.length} SVGs as ZIP!`, 'success');
          
        } catch (error) {
          console.error('ZIP creation failed:', error);
          showNotification('Failed to create ZIP file', 'error');
        }
      });
    });
  });
  
  // Clear all copied SVGs
  clearBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "clearAll"}, function(response) {
        if (chrome.runtime.lastError) {
          showNotification('Failed to clear SVGs', 'error');
          return;
        }
        if (response && response.success) {
          setActiveState(false);
          updateStats(0, 0);
          showNotification('All SVGs cleared!', 'success');
        }
      });
    });
  });
  
  function setActiveState(active) {
    isActive = active;
    toggleBtn.textContent = active ? '🛑 Stop Detection' : '🎯 Start SVG Detection';
    toggleBtn.classList.toggle('active', active);
    
    // Enable/disable other buttons based on state
    copyAllBtn.disabled = !active || svgCount === 0;
    downloadBtn.disabled = !active || svgCount === 0;
    clearBtn.disabled = !active;
    
    status.style.display = active ? 'block' : 'none';
    if (active) {
      status.className = 'status';
      status.textContent = 'Click on highlighted SVG elements to copy them!';
    }
  }
  
  function updateStats(svgs, copied) {
    svgCount = svgs || 0;
    copiedCount = copied || 0;
    svgCountEl.textContent = svgCount;
    copiedCountEl.textContent = copiedCount;
    
    // Update button states
    if (isActive) {
      copyAllBtn.disabled = svgCount === 0;
      downloadBtn.disabled = svgCount === 0;
    }
  }
  
  function showNotification(message, type) {
    status.style.display = 'block';
    status.textContent = message;
    status.className = `status ${type}`;
    
    setTimeout(() => {
      if (isActive) {
        status.textContent = 'Click on highlighted SVG elements to copy them!';
        status.className = 'status';
      } else {
        status.style.display = 'none';
      }
    }, 3000);
  }
  
  // Listen for updates from content script
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateStats") {
      updateStats(request.svgCount, request.copiedCount);
    }
  });
});

// Load JSZip library dynamically
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
script.onload = function() {
  console.log('JSZip loaded successfully');
};
script.onerror = function() {
  console.error('Failed to load JSZip');
};
document.head.appendChild(script);
