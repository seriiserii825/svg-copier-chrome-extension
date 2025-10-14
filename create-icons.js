// Script to generate extension icons programmatically
const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const scale = size / 128;
    
    ctx.scale(scale, scale);
    
    // Background gradient (simulate with solid color for now)
    ctx.fillStyle = '#667eea';
    ctx.beginPath();
    ctx.arc(64, 64, 56, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw SVG-like shape
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    
    // Draw a simplified SVG icon representation
    ctx.beginPath();
    ctx.moveTo(30, 40);
    ctx.lineTo(50, 25);
    ctx.lineTo(70, 40);
    ctx.lineTo(85, 55);
    ctx.lineTo(70, 70);
    ctx.lineTo(85, 85);
    ctx.lineTo(70, 100);
    ctx.lineTo(50, 85);
    ctx.lineTo(30, 100);
    ctx.lineTo(45, 85);
    ctx.lineTo(30, 70);
    ctx.lineTo(45, 55);
    ctx.closePath();
    ctx.fill();
    
    // Add copy symbol
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(75, 35, 8, 8);
    ctx.fillRect(80, 30, 8, 8);
    
    return canvas;
}

// Create icons if Node.js canvas is available
try {
    [16, 32, 48, 128].forEach(size => {
        const canvas = createIcon(size);
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(`icons/icon${size}.png`, buffer);
        console.log(`Created icon${size}.png`);
    });
} catch (error) {
    console.log('Node.js canvas not available. Use the browser method instead.');
}
