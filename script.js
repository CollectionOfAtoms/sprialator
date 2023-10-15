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
let numSpirals = 5;  // Default number of spirals

let time = 0;                 // Variable to drive the oscillation
let frequency = 0;            // Initial frequency of oscillation
let oscillationRange = 100;   // Maximum oscillation value (positive and negative)
let minDotSize = 1;  // Minimum dot size when radius is 0
let maxDotSize = 25; // Maximum dot size when radius is maxRadius
let phase=0
const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
const angleIncrement = 0.03;
const radiusIncrement = 1;
// Parameters for the sigmoid-like growth of the dot size
let r0 = 49.35;  // Adjust this for the inflection point of the curve
let k = 0.01;              // Adjust this to make the transition smoother

function drawSpiral(offsetAngle) {
    let angle = 0;
    let radius = 0;
    
    

    while (radius < maxRadius) {
        const x = radius * Math.cos(angle + offsetAngle);  
        const y = radius * Math.sin(angle + offsetAngle);
        
        // Calculate dot size using the sigmoid-like function
        const dynamicDotSize = minDotSize + (maxDotSize - minDotSize) / (1 + Math.exp(-k * (radius - r0)));
        
        const currentColorChange = oscillationRange * Math.sin(phase + angle * frequency);
        
        ctx.beginPath();
        ctx.fillStyle = `hsl(${angle * (colorChange + currentColorChange) % 360}, 100%, 50%)`;
        ctx.arc(x, y, dynamicDotSize, 0, Math.PI * 2);
        ctx.fill();

        angle += angleIncrement;
        radius += radiusIncrement;
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    const offset = 2 * Math.PI / numSpirals;
    for (let i = 0; i < numSpirals; i++) {
        drawSpiral(i * offset);
    }

    ctx.restore();

    rotation += rotationSpeed;
    time += 0.01;  // Increment the time variable for the oscillation
    
    ctx.font = "20px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`Adjusting: ${adjustingParameter}`, 10, 30);
    ctx.fillText(`Adjusting: ${adjustingParameter}`, 10, 30);
    ctx.fillText(`minDotSize: ${minDotSize.toFixed(2)}`, 10, 50);
    ctx.fillText(`maxDotSize: ${maxDotSize.toFixed(2)}`, 10, 70);
    ctx.fillText(`r0: ${r0.toFixed(2)}`, 10, 90);
    ctx.fillText(`k: ${k.toFixed(4)}`, 10, 110);
    ctx.fillText(`frequency: ${frequency.toFixed(4)}`, 10, 130);
    
    
    requestAnimationFrame(animate);

    phase += 0.001;

    // requestAnimationFrame(animate);
}

// Handle keyboard events
document.addEventListener('keydown', function(event) {
    switch (event.code) {
        // ... (rest of the cases remain unchanged)
        case 'ArrowRight':
            frequency += 0.05;  // Increase the oscillation frequency
            break;
        case 'ArrowLeft':
            frequency -= 0.1;  // Decrease the oscillation frequency
            if (frequency < 0.05) frequency = 0; // Ensure positive frequency
            break;
    }
});

// Handle keyboard events
document.addEventListener('keydown', function(event) {
    switch (event.code) {
        case 'ArrowUp':
            if (adjustingParameter === "r0") {
                r0 += 5;
            } else if (adjustingParameter === "k") {
                k += 0.01;
            } else if (event.shiftKey) {
                maxDotSize += 1;
            } else {
                minDotSize += 1;
            }
            break;
            
        case 'ArrowDown':
            if (adjustingParameter === "r0") {
                r0 -= 5;
            } else if (adjustingParameter === "k") {
                k -= 0.01;
            } else if (event.shiftKey) {
                maxDotSize -= 1;
                if (maxDotSize < 1) {maxDotSize=1} 
            } else {
                minDotSize -= 1;
                if (minDotSize < 1) {minDotSize=1} 

            }
            break;

        case 'KeyR':
            if (adjustingParameter === "r0") {
                adjustingParameter = "none";  // Toggle off if already on
            } else {
                adjustingParameter = "r0";
            }
            break;

        case 'KeyK':
            if (adjustingParameter === "k") {
                adjustingParameter = "none";  // Toggle off if already on
            } else {
                adjustingParameter = "k";
            }
            break;
        case 'NumpadAdd':
            rotationSpeed += 0.001;
            break;
        case 'NumpadSubtract':
            rotationSpeed -= 0.001;
            if (rotationSpeed < 0) rotationSpeed = 0;
            break;
        default:
            const numKey = event.key;
            if (numKey >= '1' && numKey <= '9') {
                numSpirals = parseInt(numKey, 10);
            }
            break;
    }
});

document.addEventListener('keydown', function(event) {
    switch (event.key) {
        // ... (rest of the cases remain unchanged for ArrowUp, ArrowDown, etc.)

        case 'r':
        case 'R':
            if (adjustingParameter === "r0") {
                adjustingParameter = "none";  // Toggle off if already on
            } else {
                adjustingParameter = "r0";
            }
            break;

        case 'k':
        case 'K':
            if (adjustingParameter === "k") {
                adjustingParameter = "none";  // Toggle off if already on
            } else {
                adjustingParameter = "k";
            }
            break;
    }
});

animate();
