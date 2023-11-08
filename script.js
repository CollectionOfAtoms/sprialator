const svg = d3.select("#spiralSVG");
const canvas = document.getElementById('textCanvas');
const ctx = canvas.getContext('2d');
document.body.style.backgroundColor = 'black';


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let adjustingParameter = "none";  // Can be "none", "r0", or "k"

let centerX = window.innerWidth / 2;
let centerY = window.innerHeight / 2;
const numMorphSteps = 200

let autoAdjustParams = true;
let rotation = 0;
let rotationSpeed = 0.003;
let colorChange = 10;
let dotSize = 6;
let numSpirals = 9;  // Default number of spirals
let isBackgroundBlack = true; // default to black
let currentShapeIndex = 2; // index of shape type to default
const shapes = ["circle", "square", "triangle", "rhombus", "random"]; 

const majorAxis = 1;

const shape2Path = {
    'circle' : `M 0 -0.5 L 0.35 -0.35 L 0.5 0 L 0.35 0.35 L 0 0.5 L -0.35 0.35 L -0.5 0 L -0.35 -0.35 Z`,
    'square' : `M 0 -0.5 L 0.5 -0.5 L 0.5 0 L 0.5 0.5 L 0 0.5 L -0.5 0.5 L -0.5 0 L -0.5 -0.5 Z`,
    'triangle' : `M -.5 .25 L 0 -.75 L .5 .25 L .3 .25 L .1 .25 L -.1 .25 L -.3 .25 L -.5 .25 Z`,
    'rhombus' : `M 0 -0.5 L 0.4 -0.25 L 0.8 0 L 0.4 0.25 L 0 0.5 L -0.4 0.25 L -0.8 0 L -0.4 -0.25 Z`,
    // 'einstein' : "M -0.5,0.1989752348420153 L -1,0.6011955593509819 L -0.8341584158415842,0.9982920580700256 L -0.16584158415841577,0.9982920580700256 L 0.0006188118811880639,0.5977796754910332 L 0.49938118811881194,0.9999999999999998 L 1,0.6003415883859948 L 0.8347772277227723,0.1989752348420153 L 0.5006188118811883,0.1989752348420153 L 0.504950495049505,-0.5994876174210078 L 0,-1 L -0.16584158415841577,-0.5994876174210078 L -0.5,-0.5994876174210078 Z"
};

 const extraRotation = {
     'circle' : 0,
     'square' : 45,
     'triangle' : -90,
     'rhombus' : 0,
    //  'einstein' : 0
 };

 const shapeMorphCombinations = getAllShapeMorphCombinations()

 console.log(shapeMorphCombinations)

let currentShape = shapes[currentShapeIndex];
let lastShape = shapes[currentShapeIndex];
const dotShapeMemory = {};

let time = 0;                 // Variable to drive the oscillation
let frequency = 0;            // Initial frequency of oscillation
let oscillationRange = 100;   // Maximum oscillation value (positive and negative)
let minDotSize = 50;  // Minimum dot size when radius is 0
let maxDotSize = 66; // Maximum dot size when radius is maxRadius
let phase=0

const colorModes = ["default", "offsetAngle", "offsetAndRadius", "radiusBased", "centerColor", "hueSliceByOffsetAndRadius", "grayscale_hsl", "constantHue"];
let colorModeIndex = 3;  // global variable to track the current color mode
let nextColorModeIndex = (colorModeIndex + 1) % colorModes.length; // next color mode index
let colorMethod = colorModes[colorModeIndex];  // Initial setting
let baseHue = 200; // A value between 0 and 360. For example, 200 is a blue hue.
let hueRange = 50; // The range within which the hue can vary. This will allow hues between 175 and 225 in this example.

let doDisplayControls = false // Whether or not the control display is visible

let maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
let angleIncrement = -0.03;
let radiusIncrement = 10;
// Parameters for the sigmoid-like growth of the dot size
let r0 = 84.35;  // Adjust this for the inflection point of the curve
let k = 0.034;    // Adjust this to make the transition smoother

// Color transition parameters
let transitionStartTime = null;
const transitionDuration = 5000; // Transition duration in milliseconds



function calculateColorFromMode(mode, angle, radius) {
    // Returns a 3 element array of the form [hue, saturation, lightness]
    // 0 <= hue < 360
    // saturation and lightness are percents

    const angleOffset = Math.PI / 4;  // Adjust as needed
    let hue, saturation, lightness

    switch (mode) {
        case "offsetAngle":
            hue = (angle + angleOffset) * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            return [hue, 100, 50];
        
        case "radiusBased":
            hue = ( (radius / maxRadius) * 360 + (phase * 500)) % 360;  // This will change hue based on the distance from the center
            return [hue, 100, 50];

        case "offsetAndRadius":
            hue = (angle + angleOffset) * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            hue = hue + ( (radius / maxRadius) * 360 + (phase * 500)) % 360;
            hue = hue % 360
            return [hue, 100, 50];

        case "hueSliceByOffsetAndRadius":
            hue = (angle + angleOffset) * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            hue = hue + ( (radius / maxRadius) * 360 + (phase * 500)) % 360;
            hue = (baseHue + (hue % hueRange)) % 360 
            return [hue, 100, 50];

        case "grayscale_hsl":
            lightness = Math.abs(Math.cos(radius)) * 100;
            return [baseHue,0,lightness]
        
        case "constantHue":
            saturation = Math.abs(Math.sin(angle)) * 100;
            lightness = Math.abs(Math.cos(radius)) * 50 + 50;
            return [baseHue, saturation, lightness]
                    
        default:  // This is the default method you provided
            const hueDefault = angle * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            return [hueDefault,100, 50]
    }
}

function initiateColorTransition() {
    // Start the transition
    transitionStartTime = Date.now();
    nextColorModeIndex = (colorModeIndex + 1) % colorModes.length; // Prepare the next color mode index
  }
  
  function interpolateColor(color1, color2, fraction) {
    // Simple linear interpolation between two colors
    return color1.map((c1, i) => {
      const c2 = color2[i];
      return c1 + (c2 - c1) * fraction;
    });
  }
  
  function getColorDuringTransition(currentMode, nextMode, angle, radius) {
    // Calculate the fraction of the transition that has completed
    let fraction = (Date.now() - transitionStartTime) / transitionDuration;
    if (fraction > 1) {
      fraction = 1;
      transitionStartTime = null; // End the transition
      colorMethod = nextMode; // Update the color mode
    }
    // Get the color from the current and next modes
    const colorFromCurrentMode = calculateColorFromMode(currentMode, angle, radius);
    const colorFromNextMode = calculateColorFromMode(nextMode, angle, radius);
    
    // Interpolate between the two colors
    return interpolateColor(colorFromCurrentMode, colorFromNextMode, fraction);
  }


function getShapeMorphSteps(startPathData, endPathData){
    // Returns an array with intermediate paths botween two SVG paths. 

    const interpolator = d3.interpolatePath(startPathData, endPathData);

    const morphingSteps = Array.from({ length: numMorphSteps }, (_, i) => {
        return interpolator(i / (numMorphSteps - 1));
    });

    return morphingSteps
}  

function getAllShapeMorphCombinations(){
    const shapeCombinations = {};

    const shapeNames = Object.keys(shape2Path);

    // Iterate through each combination of start and end shapes
    for (let startShape of shapeNames) {
        shapeCombinations[startShape] = {};  // Initialize an inner object for the start shape
        for (let endShape of shapeNames) {
            // Avoid morphing a shape to itself
            const startPathData = shape2Path[startShape];
            const endPathData = shape2Path[endShape];
            const intermediateShapes = getShapeMorphSteps(startPathData, endPathData);
            shapeCombinations[startShape][endShape] = intermediateShapes;
        }
    }

    return shapeCombinations
}

function drawShape(shapeName, x, y, scale, color, dotIndex) {
    const relativeX = x - centerX;
    const relativeY = y - centerY;
    const angleToCenter = Math.atan2(relativeY, relativeX) * (180 / Math.PI); // Convert to degrees

    let pathData, rotationAngle

    // Use dotIndex as the unique key
    const dotKey = dotIndex.toString();
    // If the shape for the current dot is not in memory, select a random shape and store it
    if (!dotShapeMemory[dotKey]) {
        dotShapeMemory[dotKey] = {
            shape: getRandomKey(shape2Path),
            morphState: 0
        }
    }

    if (shapeName == 'random'){
        // Draw the shape associated with the current dot
        pathData = shape2Path[dotShapeMemory[dotKey].shape]; 
        rotationAngle = angleToCenter + extraRotation[dotShapeMemory[dotKey].shape]
    }
    else{
        pathData = shape2Path[shapeName];
        rotationAngle = angleToCenter + extraRotation[shapeName]
    }

    // rotationAngle = 50

    svg.append("path")
        .attr("d", pathData)
        .attr("fill", color)
        .attr("transform", `translate(${x}, ${y}) rotate(${rotationAngle}) scale(${scale})`);
}

function drawShapeFromPath(pathData, x, y, scale, color, rotation) {
    const relativeX = x - centerX;
    const relativeY = y - centerY;
    
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


function drawDotForSpiral(radius, spiralNumber, colorCallback, dotIndex) {
    const offset = 2 * Math.PI / numSpirals * spiralNumber;
    
    const angle = radius * angleIncrement % (2 * Math.PI);
    const x = radius * Math.cos(angle + offset) + window.innerWidth / 2;  // Adjust for center
    const y = radius * Math.sin(angle + offset) + window.innerHeight / 2;  // Adjust for center
    
    const dynamicDotSize = minDotSize + (maxDotSize - minDotSize) / (1 + Math.exp(-k * (radius - r0)));
    
    // Logic for determining a dot's color
    let color
    if (transitionStartTime !== null) {
        // If a transition is active, calculate the transition fraction
        let fraction = (Date.now() - transitionStartTime) / transitionDuration;
        if (fraction >= 1) {
          // Transition is complete
          fraction = 1;
          transitionStartTime = null;
          colorModeIndex = nextColorModeIndex;
          colorMethod = colorModes[nextColorModeIndex]; // Make sure to define nextColorModeIndex somewhere
        }
    
        // Use the fraction to interpolate colors for the current frame
        const currentColor = calculateColorFromMode(colorMethod, angle, radius);
        const nextColor = calculateColorFromMode(colorModes[nextColorModeIndex], angle, radius);
        color = interpolateColor(currentColor, nextColor, fraction);
      } else {
        // No transition active, draw normally
        color = calculateColorFromMode(colorMethod, angle, radius);
      }

    colorString = `hsl(${color[0]},${color[1]}%,${color[2]}%)`


    
    // draw the given shape

    if (dotShapeMemory[dotIndex]) {
        const currentMorphState = dotShapeMemory[dotIndex].morphState;
        
        let startShape = lastShape;
        let endShape = currentShape;
        
        if (lastShape === 'random') {
            startShape = dotShapeMemory[dotIndex].shape;
        }
        
        if (currentShape === 'random') {
            endShape = dotShapeMemory[dotIndex].shape;
        }
        
        const pathData = shapeMorphCombinations[startShape][endShape][currentMorphState];
        
        //Shapes should be rotated at the same angle that their last shape is defined to be when they start
        //And at the same angle as the current shape is defined when they end
        let shapeRotation = 0

        const startAngle = extraRotation[startShape]
        const endAngle = extraRotation[endShape]
        shapeRotation = startAngle + (endAngle-startAngle)*(currentMorphState/numMorphSteps)

        drawShapeFromPath(pathData, x, y, dynamicDotSize, colorString, shapeRotation);
    } else {
        drawShape(currentShape, x, y, dynamicDotSize, colorString, dotIndex);
    }
}


function animate() {
    svg.selectAll("*").remove();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    let dotIndex = 0;
    for (let radius = maxRadius; radius >= 0; radius -= radiusIncrement) {
        for (let i = 0; i < numSpirals; i++) {

            drawDotForSpiral(radius, i, calculateColorFromMode, dotIndex);
        }
        dotIndex++;
    }
    ctx.restore();
    rotation += rotationSpeed;
    phase += 0.001;
    time += 0.0078125;  // Increment the time variable for the oscillation.  Use a power of 2 for full precisions floating point maths
    
    if( doDisplayControls ) {
        displayControls()
    }

    for (let dotIndex in dotShapeMemory) {
        if (dotShapeMemory[dotIndex].morphState < numMorphSteps - 1) {
            dotShapeMemory[dotIndex].morphState++;
        }
    }

    // Change stuff to add intrigue
    if( autoAdjustParams ){
        r0 = 600 * ( Math.sin( time/17. ) ** 2 ) + 50
        angleIncrement = .027 * Math.cos( time/37. ) 
        radiusIncrement = 1 * ( Math.sin( time/25. ) ** 2 ) + 9;  // This dynamically adjusts the radiusIncrement over time
        // Modifying time to achieve the desired oscillation characteristic
        const timeModified = 2*Math.PI * (Math.cos(time/23) ** 2)  ;  // Adjust 0.05 to change the frequency of time oscillation
        k =  0.1 * Math.cos(timeModified);  // Using modified time in k's formula
        baseHue = ((baseHue) + .1) % 360

        // Auto change shapes
        if (time % 16 == 0){
            lastShape = currentShape;
            currentShapeIndex = (currentShapeIndex + 1) % shapes.length;  
            currentShape = shapes[currentShapeIndex];
        
            // Reset dotShapeMemory for all dots
            for (let dotIndex in dotShapeMemory) {
                dotShapeMemory[dotIndex].morphState = 0;
            }
        }

        if (time % 24 == 0){
            nextColorModeIndex = (colorModeIndex + 1) % colorModes.length; // Prepare the next color mode index
            initiateColorTransition(); // Start the transition
        }

    }

    requestAnimationFrame(animate);
}

document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    
    switch (key) {
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
            nextColorModeIndex = (colorModeIndex + 1) % colorModes.length; // Prepare the next color mode index
            initiateColorTransition(); // Start the transition
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
        "NumpadAdd: Increase rotation speed",
        "NumpadSubtract: Decrease rotation speed",
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
        `rotationSpeed: ${rotationSpeed.toFixed(2)}`,
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


animate()
