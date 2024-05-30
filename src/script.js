//Imports
import { palettes } from './palettes.js';
import { gs } from './state.js';



const svg = d3.select("#spiralSVG");
const canvas = document.getElementById('textCanvas');
const ctx = canvas.getContext('2d');
document.body.style.backgroundColor = 'black';


canvas.width = window.innerWidth;
canvas.height = window.innerHeight


const shapeMorphCombinations = getAllShapeMorphCombinations() // Assuming this function is defined elsewhere



const calculateColorFromMode = function(mode, palette, angle, radius) {
    // Returns a 3 element array of the form [hue, saturation, lightness]
    // 0 <= hue < 360
    // saturation and lightness are percents

    const angleOffset = Math.PI / 4;  // Adjust as needed
    let hue, saturation, lightness

    switch (mode) {
        case "offsetAngle":
            hue = (angle + angleOffset) * (gs.colorChange + gs.oscillationRange * Math.sin(gs.phase + angle * gs.frequency)) % 360;
            return [hue, 100, 50];
        
        case "radiusBased":
            hue = ( (radius / gs.maxRadius) * 360 + (gs.phase * 500)) % 360;  // This will change hue based on the distance from the center
            return [hue, 100, 50];

        case "offsetAndRadius":
            hue = (angle + angleOffset) * (gs.colorChange + gs.oscillationRange * Math.sin(gs.phase + angle * gs.frequency)) % 360;
            hue = hue + ( (radius / gs.maxRadius) * 360 + (gs.phase * 500)) % 360;
            hue = hue % 360
            return [hue, 100, 50];

        case "hueSliceByOffsetAndRadius":
            hue = (angle + angleOffset) * (gs.colorChange + gs.oscillationRange * Math.sin(gs.phase + angle * gs.frequency)) % 360;
            hue = hue + ( (radius / gs.maxRadius) * 360 + (gs.phase * 500)) % 360;
            hue = (gs.baseHue + (hue % gs.hueRange)) % 360 
            return [hue, 100, 50];

        case "grayscale_hsl":
            lightness = Math.abs(Math.cos(radius)) * 100;
            return [gs.baseHue,0,lightness]
        
        case "constantHue":
            saturation = Math.abs(Math.sin(angle)) * 100;
            lightness = Math.abs(Math.cos(radius)) * 50 + 50;
            return [gs.baseHue, saturation, lightness]

        case "palette":
            // Use the seeded random function to get a reproducible index
            // const seed = radius * 1000 + angle;
            const seed = radius * 1000;

            const chosenColorIndex = Math.floor(seededRandom(palette.length, seed));
            // const chosenColorIndex = Math.floor( (Math.sin(angle) ** 2) * colorList.length )
            let c = palette[chosenColorIndex]
            c[2] = Math.abs(Math.cos(radius)) * 50 + 5; // Oscillate the lightness as a function of radius
            return c

                    
        default:  // This is the default method you provided
            const hueDefault = angle * (gs.colorChange + gs.oscillationRange * Math.sin(gs.phase + angle * gs.frequency)) % 360;
            return [hueDefault,100, 50]
    }
}

function seededRandom(max, seed) {
    // A simple seeded PRNG (linear congruential generator specifically)
    var a = 1664525;
    var c = 1013904223;
    var m = Math.pow(2, 32);
    // Combine the seed and return a pseudo-random result
    return (a * seed + c) % m / m * max;
}

function initiateColorTransition() {
    // Start the transition
    console.log('initiating color transition...')
    gs.transitionStartTime = Date.now();

    if(gs.colorMethod == 'palette' & gs.nextPalette != 0){
        console.log('changing palettes..')
        gs.nextPalette = (gs.currentPalette + 1) % Object.keys(palettes).length
    }
    else{
        console.log('changing color mode...')
        gs.currentPalette = gs.nextPalette
        gs.nextColorModeIndex = (gs.colorModeIndex + 1) % gs.colorModes.length; // Prepare the next color mode index
    }
}
  
function interpolateColor(color1, color2, fraction) {
    // Simple linear interpolation between two colors
    return color1.map((c1, i) => {
        const c2 = color2[i];
        return c1 + (c2 - c1) * fraction;
    });
}

function getTween(tweenElementSelector, startPathData, endPathData, duration = 1000){
    // Returns the KUTE tween object between the paths
    
    // console.log('startPathData:', startPathData), 
    // console.log('endPathData:', endPathData)
    
    const tween = KUTE.fromTo(`${tweenElementSelector}-start`,
                                {path: `${tweenElementSelector}-start`}, 
                                {path: `${tweenElementSelector}-end`},
                                {
                                    easing: 'easingCubicInOut', 
                                    duration: duration, 
                                    yoyo: false, 
                                    repeat: 0
                                })

    return tween
}

function getMorphStepsFromTween(tween, numMorphSteps, tweenElementId, duration=1000.){
    var stepNum = 1
    const morphSteps = []

    while (stepNum <= numMorphSteps){
        const progress = stepNum/(numMorphSteps/3)  // Why -100?  Because it doesn't completely morph without progress over 1 1/3 for some reason 
        tween.update(progress * duration)
        var currentPathData = document.getElementById(`${tweenElementId}-start`).getAttribute('d');
        morphSteps.push(currentPathData)

        stepNum++
    }

    return morphSteps
}

function getAllShapeMorphCombinations(){
    const tweenShapeCombinations = {};
    const tweens = {};

    const shapeNames = Object.keys(gs.shape2Path);

    // Iterate through each combination of start and end shapes
    for (let startShape of shapeNames) {
        tweenShapeCombinations[startShape] = {};
        tweens[startShape] = {};
        for (let endShape of shapeNames) {
            const startPathData = (gs.shape2Path[startShape]);
            const endPathData = (gs.shape2Path[endShape]);
            
            // Avoid morphing a shape to itself
            if (startShape == endShape){
                const degenerateMorphSteps = Array(gs.numMorphSteps).fill(startPathData);
                tweenShapeCombinations[startShape][endShape] = degenerateMorphSteps
            }
            else{
                const tweenElementId = `${startShape}-${endShape}`
                const tweenElementSelector = `#${tweenElementId}`
                
                ensureSvgElementExists(tweenElementId, startPathData, endPathData)
                const tween = getTween(tweenElementSelector, startPathData, endPathData)
                tween.start()
                tween.pause()
                tweens[startShape][endShape] = tween

                const tweenMorphSteps = getMorphStepsFromTween(tween, gs.numMorphSteps, tweenElementId)
                tweenShapeCombinations[startShape][endShape] = tweenMorphSteps
            }
        }
    }

    console.log('tweens', tweens)
    console.log('tweenShapeCombinations', tweenShapeCombinations)
    return tweenShapeCombinations
}

function ensureSvgElementExists(tweenElementId, startPathData, endPathData, parentSelector = 'body') {
    
    // Check if the SVG element already exists
    let svgElement = document.getElementById(tweenElementId);
    if (!svgElement) {
        console.log('Could not locate element by ID:', tweenElementId)
        // If it doesn't exist, create it
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svgElement.setAttribute('id', tweenElementId);
     
        // Create the first path element
        const startPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        startPath.setAttribute("id", `${tweenElementId}-start`);
        startPath.setAttribute("style", "visibility:hidden")
        startPath.setAttribute("d", startPathData);

        const endPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        endPath.setAttribute("id", `${tweenElementId}-end`);
        startPath.setAttribute("style", "visibility:hidden")
        endPath.setAttribute("d", endPathData); 

        svgElement.appendChild(startPath)
        svgElement.appendChild(endPath)

        // Append the newly created SVG to a parent element, default is 'body'
        const parentElement = document.querySelector(parentSelector);
        if (!parentElement) {
            console.error(`Parent element '${parentSelector}' not found.`);
            return null;
        }

        // Assuming a wrapper SVG exists or is also dynamically created
        let svgWrapper = parentElement.querySelector('svg');
        if (!svgWrapper) {
            svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            parentElement.appendChild(svgWrapper);
        }
        svgWrapper.appendChild(svgElement);
    }
    return svgElement;
}

function drawShape(shapeName, x, y, scale, color, dotIndex) {
    const relativeX = x - gs.centerX;
    const relativeY = y - gs.centerY;
    const angleToCenter = Math.atan2(relativeY, relativeX) * (180 / Math.PI); // Convert to degrees

    let pathData, rotationAngle

    // Use dotIndex as the unique key
    const dotKey = dotIndex.toString();
    // If the shape for the current dot is not in memory, select a random shape and store it
    if (!gs.dotShapeMemory[dotKey]) {
        gs.dotShapeMemory[dotKey] = {
            shape: getRandomKey(gs.shape2Path),
            morphState: 0
        }
    }

    if (shapeName == 'random'){
        // Draw the shape associated with the current dot
        pathData = gs.shape2Path[gs.dotShapeMemory[dotKey].shape]; 
        rotationAngle = angleToCenter + gs.extraRotation[gs.dotShapeMemory[dotKey].shape] + gs.globalRotation
    }
    else{
        pathData = gs.shape2Path[shapeName];
        rotationAngle = angleToCenter + gs.extraRotation[shapeName] + gs.globalRotation
    }

    svg.append("path")
        .attr("d", pathData)
        .attr("fill", color)
        .attr("transform", `translate(${x}, ${y}) rotate(${rotationAngle}) scale(${scale})`);
}

function drawShapeFromPath(pathData, x, y, scale, color, rotation) {
    const relativeX = x - gs.centerX;
    const relativeY = y - gs.centerY;
    
    const angleToCenter = Math.atan2(relativeY, relativeX) * (180 / Math.PI) + rotation;

    svg.append("path")
        .attr("d", pathData)
        .attr("fill", color)
        .attr("transform", `translate(${x}, ${y}) rotate(${angleToCenter}) scale(${scale})`);
}

function getRandomValueFromObject(obj) {
    const keys = Object.keys(obj);
    const randomIndex = Math.floor(Math.random() * keys.length);
    const randomKey = keys[randomIndex];
    return obj[randomKey];
}

function getRandomKey(obj) {
    //Gets a random key off an object
    const keys = Object.keys(obj);
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
}


function drawDotForSpiral(radius, spiralNumber, dotIndex) {
    const offset = 2 * Math.PI / gs.numSpirals * spiralNumber;
    
    const angle = radius * gs.angleIncrement % (2 * Math.PI) + gs.rotation;
    const x = radius * Math.cos(angle + offset) + window.innerWidth / 2;  // Adjust for center
    const y = radius * Math.sin(angle + offset) + window.innerHeight / 2;  // Adjust for center
    
    const dynamicDotSize = gs.minDotSize + (gs.maxDotSize - gs.minDotSize) / (1 + Math.exp(-gs.k * (radius - gs.r0)));
    
    // Logic for determining a dot's color
    let color
    if (gs.transitionStartTime !== null) {
        // If a transition is active, calculate the transition fraction
        let fraction = (Date.now() - gs.transitionStartTime) / gs.transitionDuration;
        if (fraction >= 1) {
          // Transition is complete
          fraction = 1;
          gs.transitionStartTime = null;
          gs.colorModeIndex = gs.nextColorModeIndex;
          gs.colorMethod = gs.colorModes[gs.nextColorModeIndex]; // Make sure to define nextColorModeIndex somewhere
          gs.currentPalette = gs.nextPalette
        }
    
        // Use the fraction to interpolate colors for the current frame
        let currentPalette = palettes[ Object.keys(palettes)[gs.currentPalette] ]
        let nextPalette = palettes[ Object.keys(palettes)[gs.nextPalette] ]
        let currentColorMethod = gs.colorMethod
        let nextColorMethod = gs.colorModes[gs.nextColorModeIndex]

        const currentColor = calculateColorFromMode(currentColorMethod, currentPalette, angle, radius);
        const nextColor = calculateColorFromMode(nextColorMethod, nextPalette, angle, radius);
        color = interpolateColor(currentColor, nextColor, fraction);
      } else {
        // No transition active, draw normally
        let palette = palettes[ Object.keys(palettes)[gs.currentPalette] ]
        color = calculateColorFromMode(gs.colorMethod, palette, angle, radius);
      }

    const colorString = `hsl(${color[0]},${color[1]}%,${color[2]}%)`
    
    // draw the given shape
    if (gs.dotShapeMemory[dotIndex]) {
        const currentMorphState = gs.dotShapeMemory[dotIndex].morphState;
        
        let startShape = gs.lastShape;
        let endShape = gs.currentShape;
        
        if (gs.lastShape === 'random') {
            startShape = gs.dotShapeMemory[dotIndex].shape;
        }
        
        if (gs.currentShape === 'random') {
            endShape = gs.dotShapeMemory[dotIndex].shape;
        }
        
        const pathData = shapeMorphCombinations[startShape][endShape][currentMorphState];
        
        //Shapes should be rotated at the same angle that their last shape is defined to be when they start
        //And at the same angle as the current shape is defined when they end
        let shapeRotation = 0

        const startAngle = gs.extraRotation[startShape] 
        const endAngle = gs.extraRotation[endShape] 
        shapeRotation = startAngle + (endAngle-startAngle)*(currentMorphState/gs.numMorphSteps) + gs.globalRotation

        drawShapeFromPath(pathData, x, y, dynamicDotSize, colorString, shapeRotation);
    } else {
        drawShape(gs.currentShape, x, y, dynamicDotSize, colorString, dotIndex);
    }
}


function animate() {
    svg.selectAll("*").remove();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let dotIndex = 0;
    for (let radius = gs.maxRadius; radius >= 0; radius -= gs.radiusIncrement) {
        for (let i = 0; i < gs.numSpirals; i++) {
            
            drawDotForSpiral(radius, i, dotIndex);
        }
        dotIndex++;
    }
    gs.rotation += gs.rotationSpeed;
    gs.phase += 0.001;
    gs.time += 0.0078125;  // Increment the time variable for the oscillation.  Use a power of 2 for full precisions floating point maths
    
    if( gs.doDisplayControls ) {
        displayControls()
    }

    for (let dotIndex in gs.dotShapeMemory) {
        if (gs.dotShapeMemory[dotIndex].morphState < gs.numMorphSteps - 1) {
            gs.dotShapeMemory[dotIndex].morphState++;
        }
    }

    // Change stuff to add intrigue
    if( gs.autoAdjustParams ){
        gs.r0 = 600 * ( Math.sin( gs.time/17. ) ** 2 ) + 50
        gs.angleIncrement = .033 * Math.cos( gs.time/37. ) 
        gs.radiusIncrement = 1 * ( Math.sin( gs.time/25. ) ** 2 ) + 9;  // This dynamically adjusts the radiusIncrement over time
        // Modifying time to achieve the desired oscillation characteristic
        const timeModified = 2*Math.PI * (Math.cos(gs.time/23) ** 2)  ;  // Adjust 0.05 to change the frequency of time oscillation
        gs.k =  0.1 * Math.cos(timeModified);  // Using modified time in k's formula
        gs.baseHue = ((gs.baseHue) + .1) % 360

        // Auto change shapes
        if (gs.time % 12 == 0){
            gs.lastShape = gs.currentShape;
            gs.currentShapeIndex = (gs.currentShapeIndex + 1) % gs.shapes.length;  
            gs.currentShape = gs.shapes[gs.currentShapeIndex];
        
            // Reset gs.dotShapeMemory for all dots
            for (let dotIndex in gs.dotShapeMemory) {
                gs.dotShapeMemory[dotIndex].morphState = 0;
            }
        }

        // Auto change colors
        if (gs.time % 8 == 0){
            initiateColorTransition(); // Start the transition
        }
    }
    requestAnimationFrame(animate);
}

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
        `Adjusting: ${gs.adjustingParameter}`,
        `autoAdujstParams: ${gs.autoAdjustParams}`,
        `rotation: ${gs.rotation.toFixed(2)}`,
        `rotationSpeed: ${gs.rotationSpeed.toFixed(5)}`,
        `colorChange: ${gs.colorChange}`,
        `gs.numSpirals: ${gs.numSpirals}`,
        `isBackgroundBlack: ${gs.isBackgroundBlack}`,
        `currentShapeIndex: ${gs.currentShapeIndex}`,
        `currentShape: ${gs.currentShape}`,
        `time: ${gs.time.toFixed(2)}`,
        `frequency: ${gs.frequency.toFixed(2)}`,
        `oscillationRange: ${gs.oscillationRange}`,
        `gs.minDotSize: ${gs.minDotSize.toFixed(2)}`,
        `gs.maxDotSize: ${gs.maxDotSize.toFixed(2)}`,
        `phase: ${gs.phase.toFixed(2)}`,
        `gs.angleIncrement: ${gs.angleIncrement.toFixed(2)}`,
        `radiusIncrement: ${gs.radiusIncrement.toFixed(2)}`,
        `gs.r0: ${gs.r0.toFixed(2)}`,
        `k: ${gs.k.toFixed(2)}`,
        `baseHue: ${gs.baseHue.toFixed(2)}`,
        `hueRange: ${gs.hueRange}`,
        `colorModeIndex: ${gs.colorModeIndex}`,
        `colorMethod: ${gs.colorMethod}`,
        `currentPalette: ${Object.keys(palettes)[gs.currentPalette]}`
    ];
    

    const readoutStartX = padding; // Starting position for the readout on the x-axis
    ctx.textAlign = "left";
    for (let i = 0; i < readout.length; i++) {
        ctx.strokeText(readout[i], readoutStartX, padding + lineHeight * i); // Draw the stroke around the text first
        ctx.fillStyle = "white"; // Set font color to white
        ctx.fillText(readout[i], readoutStartX, padding + lineHeight * i);
    }
}


animate()
