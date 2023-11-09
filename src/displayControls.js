function displayControls() {
    //Controls on the right 
    const controls = [
        "ArrowRight: Increase color frequency / hueRange",
        "ArrowLeft: Decrease color frequency / hueRange",
        "ArrowUp: Adjust parameter up",
        "ArrowDown: Adjust parameter down",
        "R/r: Toggle r0",
        "K/k: Toggle k",
        "H/h: Toggle hue control",
        "When one of these is toggled arrow functions adjust that parameter",
        "Shift + ArrowUp: Increase max dot size",
        "Shift + ArrowDown: Decrease max dot size",
        "+: Increase rotation speed",
        "-: Decrease rotation speed",
        "1-9: Set number of spirals",
        "C/c: Change colorMethod",
        "S/s: Change shape",
        "P/p: Toggle background color",
        "Spacebar to toggle this display",
        
    ];

    const fontSize = 15;
    const padding = 20;  // Increase padding value
    const lineHeight = fontSize + 4;
    const startX = canvas.width - padding;
    
    ctx.font = `${fontSize}px Arial`;
    ctx.strokeStyle = "black"; // Set stroke color to black
    ctx.lineWidth = 2; // Set stroke width
    ctx.textAlign = "right";

    for (let i = 0; i < controls.length; i++) {
        ctx.strokeText(controls[i], startX, padding + lineHeight * i); // Draw the stroke around the text first
        ctx.fillStyle = "white"; // Set font color to white
        ctx.fillText(controls[i], startX, padding + lineHeight * i);
    }

    ctx.textAlign = "left";  // Reset the text alignment

    // display on the left 
    const readout = [
        `Adjusting: ${adjustingParameter}`,
        `autoAdujstParams: ${autoAdjustParams}`,
        `rotation: ${rotation.toFixed(2)}`,
        `rotationSpeed: ${rotationSpeed.toFixed(5)}`,
        `colorChange: ${colorChange}`,
        `dotSize: ${dotSize}`,
        `numSpirals: ${numSpirals}`,
        `isBackgroundBlack: ${isBackgroundBlack}`,
        `currentShapeIndex: ${currentShapeIndex}`,
        `currentShape: ${currentShape}`,
        `time: ${time.toFixed(2)}`,
        `frequency: ${frequency.toFixed(2)}`,
        `oscillationRange: ${oscillationRange}`,
        `minDotSize: ${minDotSize.toFixed(2)}`,
        `maxDotSize: ${maxDotSize.toFixed(2)}`,
        `phase: ${phase.toFixed(2)}`,
        `angleIncrement: ${angleIncrement.toFixed(2)}`,
        `radiusIncrement: ${radiusIncrement.toFixed(2)}`,
        `r0: ${r0.toFixed(2)}`,
        `k: ${k.toFixed(2)}`,
        `baseHue: ${baseHue.toFixed(2)}`,
        `hueRange: ${hueRange}`,
        `colorModeIndex: ${colorModeIndex}`,
        `colorMethod: ${colorMethod}`,
        `doDisplayControls: ${doDisplayControls}`
    ];
    

    const readoutStartX = padding; // Starting position for the readout on the x-axis
    ctx.textAlign = "left";
    for (let i = 0; i < readout.length; i++) {
        ctx.strokeText(readout[i], readoutStartX, padding + lineHeight * i); // Draw the stroke around the text first
        ctx.fillStyle = "white"; // Set font color to white
        ctx.fillText(readout[i], readoutStartX, padding + lineHeight * i);
    }
}
