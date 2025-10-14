class SVGCopier {
  constructor() {
    this.isActive = false;
    this.highlightedSVGs = [];
    this.copiedSVGs = [];
    this.counter = null;
    this.setupMessageListener();
  }
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case "activate":
          this.activate();
          sendResponse({isActive: this.isActive, svgCount: this.highlightedSVGs.length, copiedCount: this.copiedSVGs.length});
          break;
        case "deactivate":
          this.deactivate();
          sendResponse({isActive: this.isActive, svgCount: 0, copiedCount: 0});
          break;
        case "getState":
          sendResponse({isActive: this.isActive, svgCount: this.highlightedSVGs.length, copiedCount: this.copiedSVGs.length});
          break;
        case "copyAll":
          this.copyAllSVGs().then(result => {
            sendResponse({success: true, count: result.count, svgCount: this.highlightedSVGs.length, copiedCount: this.copiedSVGs.length});
          });
          return true; // Keep message channel open for async response
        case "getSVGsForDownload":
          this.getSVGsForDownload().then(result => {
            sendResponse(result);
          });
          return true; // Keep message channel open for async response
        case "clearAll":
          this.clearAll();
          sendResponse({success: true});
          break;
      }
    });
  }

  activate() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.findAndHighlightSVGs();
    this.createCounter();
    this.showNotification('SVG Detection Active! Click on highlighted SVGs to copy.');
  }

  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.removeHighlights();
    this.removeCounter();
    this.highlightedSVGs = [];
    this.copiedSVGs = [];
  }

  findAndHighlightSVGs() {
    // Find all SVG elements
    const svgs = document.querySelectorAll('svg');
    
    svgs.forEach((svg, index) => {
      // Skip if already highlighted
      if (svg.classList.contains('svg-copier-highlight')) return;
      
      // Skip very small SVGs (likely decorative)
      const rect = svg.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) return;
      
      this.highlightSVG(svg, index);
    });
    
    this.updateCounter();
  }

  highlightSVG(svg, index) {
    svg.classList.add('svg-copier-highlight');
    svg.dataset.svgIndex = index;
    
    // Add size info
    const rect = svg.getBoundingClientRect();
    const sizeInfo = document.createElement('div');
    sizeInfo.className = 'svg-copier-size-info';
    sizeInfo.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
    svg.style.position = 'relative';
    svg.appendChild(sizeInfo);
    
    // Add click listener
    const clickHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.copySVG(svg);
    };
    
    svg.addEventListener('click', clickHandler);
    svg.addEventListener('mouseenter', this.showTooltip);
    svg.addEventListener('mouseleave', this.hideTooltip);
    
    this.highlightedSVGs.push({
      element: svg,
      index: index,
      clickHandler: clickHandler
    });
  }

  removeHighlights() {
    this.highlightedSVGs.forEach(({element, clickHandler}) => {
      element.classList.remove('svg-copier-highlight', 'copied');
      element.removeEventListener('click', clickHandler);
      element.removeEventListener('mouseenter', this.showTooltip);
      element.removeEventListener('mouseleave', this.hideTooltip);
      
      // Remove size info
      const sizeInfo = element.querySelector('.svg-copier-size-info');
      if (sizeInfo) sizeInfo.remove();
    });
    
    // Remove any remaining tooltips
    document.querySelectorAll('.svg-copier-tooltip').forEach(tooltip => tooltip.remove());
  }

  showTooltip = (e) => {
    const svg = e.target;
    const rect = svg.getBoundingClientRect();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'svg-copier-tooltip';
    tooltip.textContent = 'Click to copy SVG';
    
    document.body.appendChild(tooltip);
    
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
    
    setTimeout(() => tooltip.classList.add('show'), 10);
  }

  hideTooltip = (e) => {
    document.querySelectorAll('.svg-copier-tooltip').forEach(tooltip => {
      tooltip.classList.remove('show');
      setTimeout(() => tooltip.remove(), 300);
    });
  }

  async copySVG(svgElement) {
    try {
      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);
      
      // Remove our added elements
      svgClone.classList.remove('svg-copier-highlight', 'copied');
      const sizeInfo = svgClone.querySelector('.svg-copier-size-info');
      if (sizeInfo) sizeInfo.remove();
      
      // Get the SVG as string
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgClone);
      
      // Clean up and format the SVG
      svgString = this.cleanSVGString(svgString);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(svgString);
      
      // Mark as copied
      svgElement.classList.add('copied');
      
      // Add to copied list if not already there
      const index = svgElement.dataset.svgIndex;
      if (!this.copiedSVGs.find(item => item.index === index)) {
        this.copiedSVGs.push({
          element: svgElement,
          index: index,
          svg: svgString
        });
      }
      
      this.showNotification(`SVG copied to clipboard! (${this.copiedSVGs.length} total)`);
      this.updateCounter();
      this.updatePopupStats();
      
    } catch (error) {
      console.error('Failed to copy SVG:', error);
      this.showNotification('Failed to copy SVG', 'error');
    }
  }

  cleanSVGString(svgString) {
    // Remove unnecessary attributes and clean up
    svgString = svgString.replace(/\s+/g, ' ').trim();
    
    // Ensure proper SVG namespace
    if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    
    return svgString;
  }
  async copyAllSVGs() {
    if (this.highlightedSVGs.length === 0) {
      this.showNotification('No SVGs found to copy', 'error');
      return { count: 0 };
    }
    
    const allSVGs = [];
    let successCount = 0;
    
    for (const {element, index} of this.highlightedSVGs) {
      try {
        const svgClone = element.cloneNode(true);
        svgClone.classList.remove('svg-copier-highlight', 'copied');
        const sizeInfo = svgClone.querySelector('.svg-copier-size-info');
        if (sizeInfo) sizeInfo.remove();
        
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);
        svgString = this.cleanSVGString(svgString);
        
        allSVGs.push(svgString);
        
        // Mark as copied
        element.classList.add('copied');
        if (!this.copiedSVGs.find(item => item.index === index)) {
          this.copiedSVGs.push({element, index, svg: svgString});
        }
        successCount++;
      } catch (error) {
        console.error('Failed to process SVG:', error);
      }
    }
    
    if (allSVGs.length > 0) {
      const combinedSVGs = allSVGs.join('\n\n<!-- Next SVG -->\n\n');
      
      try {
        await navigator.clipboard.writeText(combinedSVGs);
        this.updateCounter();
        this.updatePopupStats();
        return { count: successCount };
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        this.showNotification('Failed to copy to clipboard', 'error');
        return { count: 0 };
      }
    }
    
    return { count: 0 };
  }

  async getSVGsForDownload() {
    if (this.highlightedSVGs.length === 0) {
      return { svgs: [] };
    }
    
    const svgData = [];
    
    for (const {element, index} of this.highlightedSVGs) {
      try {
        const svgClone = element.cloneNode(true);
        svgClone.classList.remove('svg-copier-highlight', 'copied');
        const sizeInfo = svgClone.querySelector('.svg-copier-size-info');
        if (sizeInfo) sizeInfo.remove();
        
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svgClone);
        svgString = this.cleanSVGString(svgString);
        
        // Get dimensions for filename
        const rect = element.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        
        svgData.push({
          content: svgString,
          width: width,
          height: height,
          index: index
        });
      } catch (error) {
        console.error('Failed to process SVG for download:', error);
      }
    }
    
    return { svgs: svgData };
  }

  clearAll() {
    this.deactivate();
    this.showNotification('All SVGs cleared!', 'success');
  }
  createCounter() {
    if (this.counter) return;
    
    this.counter = document.createElement('div');
    this.counter.className = 'svg-copier-counter';
    document.body.appendChild(this.counter);
    this.updateCounter();
  }

  updateCounter() {
    if (!this.counter) return;
    
    this.counter.textContent = `SVGs: ${this.highlightedSVGs.length} | Copied: ${this.copiedSVGs.length}`;
  }

  removeCounter() {
    if (this.counter) {
      this.counter.remove();
      this.counter = null;
    }
  }

  updatePopupStats() {
    chrome.runtime.sendMessage({
      action: "updateStats",
      svgCount: this.highlightedSVGs.length,
      copiedCount: this.copiedSVGs.length
    });
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'svg-copier-notification';
    notification.textContent = message;
    
    if (type === 'error') {
      notification.style.background = '#f44336';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Initialize the SVG Copier when the page loads
const svgCopier = new SVGCopier();

// Also scan for new SVGs when DOM changes (for dynamic content)
const observer = new MutationObserver((mutations) => {
  if (svgCopier.isActive) {
    let shouldUpdate = false;
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && (node.tagName === 'SVG' || node.querySelector('svg'))) {
            shouldUpdate = true;
          }
        });
      }
    });
    
    if (shouldUpdate) {
      setTimeout(() => svgCopier.findAndHighlightSVGs(), 100);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
