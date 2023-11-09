document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    
    console.log(key)
    switch (key) {
        case '+':
            rotationSpeed += .0002
            break;
        case '-':
            rotationSpeed -= .0002;
            break;
        case 'arrowright':
            if(adjustingParameter === 'h'){
                hueRange = Math.min(hueRange + 5, 360)
            }
            else{
                frequency += 0.01;
            }
            break;
        case 'arrowleft':
            if(adjustingParameter === 'h'){
                hueRange = Math.max(hueRange - 5, 10)
            }else{
                frequency = Math.max(0, frequency - 0.01);
            }
            break;
        case 'arrowup':
            // Handle functionality for ArrowUp...
            if (adjustingParameter === "r0") {
                r0 += 5;
            } else if (adjustingParameter === "k") {
                k += 0.001;
            }else if (adjustingParameter === "h"){
                baseHue += 5;
                baseHue = baseHue % 360
            }else if (event.shiftKey) {
                maxDotSize += 1;
            } else {
                minDotSize += 1;
            }
            break;
        case 'arrowdown':
            if (adjustingParameter === "r0") {
                r0 -= 5;
            } else if (adjustingParameter === "k") {
                k -= 0.001;
            }else if (adjustingParameter === "h"){
                baseHue -= 5;
                baseHue = baseHue % 360
            }else if (event.shiftKey) {
                maxDotSize -= 1;
                if (maxDotSize < 1) {maxDotSize=1} 
            } else {
                minDotSize -= 1;
                if (minDotSize < 1) {minDotSize=1} 
            }
            break;
        case 'a':
            autoAdjustParams = !autoAdjustParams
            break;
        case 'h': 
            adjustingParameter = adjustingParameter === "h" ? "none" : "h";
            break;
        case 'p':
            isBackgroundBlack = !isBackgroundBlack;
            if (isBackgroundBlack) {
                document.body.style.backgroundColor = 'black';
            } else {
                document.body.style.backgroundColor = 'white';
            }
            break;
        case 'r':
            adjustingParameter = adjustingParameter === "r0" ? "none" : "r0";
            break;
        case 'k':
            adjustingParameter = adjustingParameter === "k" ? "none" : "k";
            break;
        case ' ':
            doDisplayControls = !doDisplayControls 
            break;
        case 'c':
            // Increment the index, and wrap it if it exceeds the length of colorModes
            if (!transitionStartTime) {
                nextColorModeIndex = (colorModeIndex + 1) % colorModes.length; // Prepare the next color mode index
                initiateColorTransition(); // Start the transition
            }
            else{ 
                //If You are mid transition do a jump
                transitionStartTime = null;
                colorModeIndex = nextColorModeIndex;
                colorMethod = colorModes[nextColorModeIndex];
            }

            break;
        case 's':
            lastShape = currentShape;
            currentShapeIndex = (currentShapeIndex + 1) % shapes.length;  
            currentShape = shapes[currentShapeIndex];
        
            // Reset dotShapeMemory for all dots
            for (let dotIndex in dotShapeMemory) {
                dotShapeMemory[dotIndex].morphState = 0;
            }
            break;
        default:
            const numKey = key;
            if (numKey >= '1' && numKey <= '9') {
                numSpirals = parseInt(numKey, 10);
            }
            break;
    }
})

window.addEventListener('resize', function() {
    // Update canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  
    // Update center point
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
    maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
  
    // You might want to call a function to redraw your canvas here
    // redraw(); // Assuming you have a function called redraw that handles drawing
  });  