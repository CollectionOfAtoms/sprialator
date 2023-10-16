const canvas = document.getElementById('spiralCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let adjustingParameter = "none";  // Can be "none", "r0", or "k"

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

let rotation = 0;
let rotationSpeed = 0.005;
let colorChange = 10;
let dotSize = 6;
let numSpirals = 9;  // Default number of spirals

let time = 0;                 // Variable to drive the oscillation
let frequency = 0;            // Initial frequency of oscillation
let oscillationRange = 100;   // Maximum oscillation value (positive and negative)
let minDotSize = 1;  // Minimum dot size when radius is 0
let maxDotSize = 28; // Maximum dot size when radius is maxRadius
let phase=0

const colorModes = ["default", "offsetAngle", "offsetAndRadius", "radiusBased", "centerColor"];
let colorModeIndex = 2;  // global variable to track the current color mode
colorMethod = colorModes[colorModeIndex];  // Initial setting

let doDisplayControls = true // Whether or not the control display is visible

const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
const angleIncrement = 0.03;
const radiusIncrement = 1;
// Parameters for the sigmoid-like growth of the dot size
let r0 = 84.35;  // Adjust this for the inflection point of the curve
let k = 0.034;    // Adjust this to make the transition smoother

function colorCalculator(angle, radius) {
    const angleOffset = Math.PI / 4;  // Adjust as needed
    
    switch (colorMethod) {
        case "offsetAngle":
            const hue = (angle + angleOffset) * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            return `hsl(${hue}, 100%, 50%)`;
        
        case "radiusBased":
            const hueBasedOnRadius = ( (radius / maxRadius) * 360 + (phase * 500)) % 360;  // This will change hue based on the distance from the center
            return `hsl(${hueBasedOnRadius}, 100%, 50%)`;

        case "offsetAndRadius":
            let h = (angle + angleOffset) * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            h = h + ( (radius / maxRadius) * 360 + (phase * 500)) % 360;
            h = h % 360
            return `hsl(${h}, 100%, 50%)`;

        case "centerColor":
            if (radius < 10) {  // This checks if the dot is very close to the center
                return "blue";  // Set to your desired center color
            }
            // If not at the center, fall back to the default calculation:
            
        default:  // This is the default method you provided
            const hueDefault = angle * (colorChange + oscillationRange * Math.sin(phase + angle * frequency)) % 360;
            return `hsl(${hueDefault}, 100%, 50%)`;
    }
}

function drawDotForSpiral(radius, spiralNumber, colorCallback) {
    const offset = 2 * Math.PI / numSpirals * spiralNumber;
    
    const angle = radius * angleIncrement % (2 * Math.PI);
    const x = radius * Math.cos(angle + offset);
    const y = radius * Math.sin(angle + offset);
    
    const dynamicDotSize = minDotSize + (maxDotSize - minDotSize) / (1 + Math.exp(-k * (radius - r0)));
    const currentColorChange = oscillationRange * Math.sin(phase + angle * frequency);
    
    const color = colorCallback(angle, radius);

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(x, y, dynamicDotSize, 0, Math.PI * 2);
    ctx.fill();
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    for (let radius = maxRadius; radius >= 0; radius -= radiusIncrement) {
        for (let i = 0; i < numSpirals; i++) {
            drawDotForSpiral(radius, i, colorCalculator);
        }
    }

    ctx.restore();
    rotation += rotationSpeed;
    phase += 0.001;
    time += 0.01;  // Increment the time variable for the oscillation
    
    if( doDisplayControls ) {
        displayControls()
    }
    requestAnimationFrame(animate);

}

document.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();
    
    console.log(key)

    switch (key) {
        case 'arrowright':
            frequency += 0.05;
            break;
        case 'arrowleft':
            frequency = Math.max(0, frequency - 0.1);
            break;
        case 'arrowup':
            // Handle functionality for ArrowUp...
            if (adjustingParameter === "r0") {
                r0 += 5;
            } else if (adjustingParameter === "k") {
                k += 0.001;
            } else if (event.shiftKey) {
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
            } else if (event.shiftKey) {
                maxDotSize -= 1;
                if (maxDotSize < 1) {maxDotSize=1} 
            } else {
                minDotSize -= 1;
                if (minDotSize < 1) {minDotSize=1} 
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
            colorModeIndex = (colorModeIndex + 1) % colorModes.length;
            colorMethod = colorModes[colorModeIndex];
            break;
        default:
            const numKey = key;
            if (numKey >= '1' && numKey <= '9') {
                numSpirals = parseInt(numKey, 10);
            }
            break;
    }
})

function displayControls() {

    //Controls on the right 
    const controls = [
        "ArrowRight: Increase frequency",
        "ArrowLeft: Decrease frequency",
        "ArrowUp: Adjust parameter up",
        "ArrowDown: Adjust parameter down",
        "R/r: Toggle r0",
        "K/k: Toggle k",
        "Shift + ArrowUp: Increase max dot size",
        "Shift + ArrowDown: Decrease max dot size",
        "NumpadAdd: Increase rotation speed",
        "NumpadSubtract: Decrease rotation speed",
        "1-9: Set number of spirals",
        "C/c: Change colorMethod ",
        "Spacebar to toggle this display"
    ];

    const fontSize = 14;
    const padding = 20;  // Increase padding value
    const lineHeight = fontSize + 4;
    const startX = canvas.width - padding;
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "black";
    ctx.textAlign = "right";

    for (let i = 0; i < controls.length; i++) {
        ctx.fillText(controls[i], startX, padding + lineHeight * i);
    }
    ctx.textAlign = "left";  // Reset the text alignment

    // display on the left 

    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`Adjusting: ${adjustingParameter}`, 10, 30);
    ctx.fillText(`minDotSize: ${minDotSize.toFixed(2)}`, 10, 50);
    ctx.fillText(`maxDotSize: ${maxDotSize.toFixed(2)}`, 10, 70);
    ctx.fillText(`r0: ${r0.toFixed(2)}`, 10, 90);
    ctx.fillText(`k: ${k.toFixed(4)}`, 10, 110);
    ctx.fillText(`frequency: ${frequency.toFixed(4)}`, 10, 130);
    ctx.fillText(`colorMethod: ${colorMethod}`, 10, 150)
}


animate()
