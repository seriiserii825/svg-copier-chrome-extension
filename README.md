# SVG Copier Chrome Extension

A powerful Chrome extension that helps you easily copy SVG icons from any webpage with visual highlighting and additional features.

## Features

- 🎯 **Visual SVG Detection**: Automatically finds and highlights SVG elements on any webpage
- 📋 **One-Click Copy**: Click on any highlighted SVG to copy its code to clipboard
- 📊 **Live Statistics**: Real-time counter showing found and copied SVGs
- 📦 **Batch Copy**: Copy all SVGs at once to clipboard
- 💾 **ZIP Download**: Download all SVGs as individual .svg files in a ZIP archive
- 🗑️ **Clear All**: Reset and clear all highlighted SVGs
- 🎨 **Smart Filtering**: Ignores tiny decorative SVGs and focuses on meaningful icons
- 🔄 **Dynamic Content Support**: Automatically detects new SVGs added to the page
- 📏 **Size Information**: Shows dimensions of each SVG for better selection

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The SVG Copier icon should appear in your toolbar

## Usage

1. **Activate Detection**: Click the extension icon and press "Start SVG Detection"
2. **Visual Feedback**: SVG elements will be highlighted with green borders
3. **Copy SVGs**: Click on any highlighted SVG to copy its code
4. **Monitor Progress**: Check the counter in the top-left corner of the page
5. **Batch Operations**: Use the popup to copy all SVGs or download them

### Popup Features

- **Start/Stop Detection**: Toggle SVG highlighting on the current page
- **Copy All SVGs**: Copy all detected SVGs to clipboard in one action
- **Download as ZIP**: Save all SVGs as individual .svg files in a ZIP archive
- **Clear All**: Reset and remove all highlighted SVGs
- **Live Statistics**: See how many SVGs were found and copied

### Visual Indicators

- **Green Border**: SVG ready to be copied
- **Orange Border**: SVG being hovered over
- **Blue Border**: SVG that has been copied
- **Size Badge**: Shows dimensions (width×height) of each SVG

## Technical Details

### File Structure
```
svg-copier/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── content.js             # Main SVG detection and copying logic
├── content.css            # Styling for highlighted elements
├── icons/                 # Extension icons (16, 32, 48, 128px)
└── README.md              # This file
```

### Permissions
- `activeTab`: Access to the current active tab for SVG detection
- `scripting`: Inject content scripts for SVG highlighting

### Browser Compatibility
- Chrome 88+ (Manifest V3 compatible)
- Chromium-based browsers (Edge, Brave, etc.)

## Advanced Features

### Smart SVG Detection
- Filters out SVGs smaller than 10x10 pixels
- Handles dynamically loaded content
- Preserves original SVG formatting and attributes

### Clipboard Integration
- Copies clean, formatted SVG code
- Maintains proper XML namespaces
- Removes extension-specific attributes

### Batch Download
- Exports all SVGs as a timestamped text file
- Separates each SVG with clear markers
- Preserves individual SVG integrity

## Troubleshooting

### SVGs Not Highlighting
- Ensure the extension is activated (green button in popup)
- Refresh the page and try again
- Check if SVGs are embedded as `<svg>` elements (not images)

### Copy Not Working
- Ensure your browser supports the Clipboard API
- Check if the website allows clipboard access
- Try copying individual SVGs instead of all at once

### Dynamic Content Issues
- The extension automatically detects new SVGs
- For complex SPAs, try deactivating and reactivating

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.
