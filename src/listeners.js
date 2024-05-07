import { gs } from './state.js';
import { palettes } from './palettes.js'

document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    
    console.log(key)
    switch (key) {
        case ' ':
            gs.doDisplayControls = !gs.doDisplayControls 
            break;
        case '+':
            gs.rotationSpeed += .0002
            break;
        case '-':
            gs.rotationSpeed -= .0002;
            break;
        case 'arrowright':
            if(gs.adjustingParameter === 'h'){
                gs.hueRange = Math.min(gs.hueRange + 5, 360)
            }
            else{
                gs.frequency += 0.01;
            }
            break;
        case 'arrowleft':
            if(gs.adjustingParameter === 'h'){
                gs.hueRange = Math.max(gs.hueRange - 5, 10)
            }else{
                gs.frequency = Math.max(0, gs.frequency - 0.01);
            }
            break;
        case 'arrowup':
            // Handle functionality for ArrowUp...
            if (gs.adjustingParameter === "r0") {
                gs.r0 += 5;
            } else if (gs.adjustingParameter === "k") {
                gs.k += 0.001;
            }else if (gs.adjustingParameter === "h"){
                gs.baseHue += 5;
                gs.baseHue = baseHue % 360
            }else if (event.shiftKey) {
                gs.maxDotSize += 1;
            } else {
                gs.minDotSize += 1;
            }
            break;
        case 'arrowdown':
            if (gs.adjustingParameter === "r0") {
                gs.r0 -= 5;
            } else if (gs.adjustingParameter === "k") {
                gs.k -= 0.001;
            }else if (gs.adjustingParameter === "h"){
                gs.baseHue -= 5;
                gs.baseHue = gs.baseHue % 360
            }else if (event.shiftKey) {
                gs.maxDotSize -= 1;
                if (gs.maxDotSize < 1) {gs.maxDotSize=1} 
            } else {
                gs.minDotSize -= 1;
                if (gs.minDotSize < 1) {gs.minDotSize=1} 
            }
            break;
        case 'a':
            gs.autoAdjustParams = !gs.autoAdjustParams
            break;
        case 'b':
            gs.isBackgroundBlack = !gs.isBackgroundBlack;
            if (gs.isBackgroundBlack) {
                document.body.style.backgroundColor = 'black';
            } else {
                document.body.style.backgroundColor = 'white';
            }
            break;
        case 'c':
            // Increment the index, and wrap it if it exceeds the length of colorModes

            // If current color mode is 'palette' then cycle palettes all the way through
            if (gs.colorMethod == 'palette'){
                if (!gs.transitionStartTime) {
                    gs.transitionStartTime = Date.now();
                    gs.nextPalette = (gs.currentPalette + 1) % Object.keys(palettes).length
                }
                else{  //Double tap p to cycle between palettes without transition
                    gs.transitionStartTime = null;
                    gs.currentPalette = gs.nextPalette
                }

                //If we just cycled through all the palettes, then get ready to cycle through color modes 
                if (gs.nextPalette == 0){
                    gs.nextColorModeIndex = (gs.colorModeIndex + 1) % gs.colorModes.length;
                }
            }

            console.log('gs.nextPalette', ':', gs.nextPalette );
            
            if (gs.nextPalette == 0){
                if (!gs.transitionStartTime) {
                    // gs.nextColorModeIndex = (gs.colorModeIndex + 1) % gs.colorModes.length; // Prepare the next color mode index
                    gs.transitionStartTime = Date.now();
                    gs.nextColorModeIndex = (gs.colorModeIndex + 1) % gs.colorModes.length; // Prepare the next color mode index
                }
                else{ 
                    //If You are mid transition do a jump
                    gs.transitionStartTime = null;
                    gs.colorModeIndex = gs.nextColorModeIndex;
                    gs.colorMethod = gs.colorModes[gs.nextColorModeIndex];

                    //If you are quickly cycling through, it won't cycle the palette back around without this code
                    if (gs.currentPalette == Object.keys(palettes).length-1) {
                        gs.currentPalette = gs.nextPalette
                    }
                }
            }

            break;
        case 'h': 
            gs.adjustingParameter = gs.adjustingParameter === "h" ? "none" : "h";
            break;
        case 'k':
            gs.adjustingParameter = gs.adjustingParameter === "k" ? "none" : "k";
            break;
        case 'r':
            gs.adjustingParameter =gs.adjustingParameter === "r0" ? "none" : "r0";
            break;
        case 's':
            gs.lastShape = gs.currentShape;
            gs.currentShapeIndex = (gs.currentShapeIndex + 1) % gs.shapes.length;  
            gs.currentShape = gs.shapes[gs.currentShapeIndex];
        
            // Reset dotShapeMemory for all dots
            for (let dotIndex in gs.dotShapeMemory) {
                gs.dotShapeMemory[dotIndex].morphState = 0;
            }
            break;
        default:
            const numKey = key;
            if (numKey >= '1' && numKey <= '9') {
                gs.numSpirals = parseInt(numKey, 10);
            }

            break;
    }
})

window.addEventListener('resize', function() {
    // Update canvas size
    const canvas = document.getElementById('textCanvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    // Update center point
    gs.centerX = canvas.width / 2;
    gs.centerY = canvas.height / 2;
    gs.maxRadius = Math.sqrt(gs.centerX ** 2 + gs.centerY ** 2 );
  
    // You might want to call a function to redraw your canvas here
    // redraw(); // Assuming you have a function called redraw that handles drawing
  });  