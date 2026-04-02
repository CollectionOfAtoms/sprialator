import { palettes } from './palettes.js';
import { gs } from './state.js';

const mainCanvas = document.getElementById('mainCanvas');
const mainCtx = mainCanvas.getContext('2d');
mainCanvas.width = window.innerWidth;
mainCanvas.height = window.innerHeight;

const textCanvas = document.getElementById('textCanvas');
const ctx = textCanvas.getContext('2d');
textCanvas.width = window.innerWidth;
textCanvas.height = window.innerHeight;

document.body.style.backgroundColor = 'black';

let fps = 0;
let lastFrameTime = performance.now();

const shapeMorphCombinations = getAllShapeMorphCombinations();

// Clean up hidden SVG elements that were only needed for KUTE morph precomputation
for (const startShape of Object.keys(gs.shape2Path)) {
    for (const endShape of Object.keys(gs.shape2Path)) {
        if (startShape !== endShape) {
            const el = document.getElementById(`${startShape}-${endShape}`);
            if (el) el.remove();
        }
    }
}


const calculateColorFromMode = function(mode, palette, angle, radius) {
    // Returns a 3 element array of the form [hue, saturation, lightness]
    // 0 <= hue < 360
    // saturation and lightness are percents

    const angleOffset = Math.PI / 4;
    let hue, saturation, lightness

    switch (mode) {
        case "offsetAngle":
            hue = (angle + angleOffset) * (gs.colorChange + gs.oscillationRange * Math.sin(gs.phase + angle * gs.frequency)) % 360;
            return [hue, 100, 50];

        case "radiusBased":
            hue = ( (radius / gs.maxRadius) * 360 + (gs.phase * 500)) % 360;
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
            return [gs.baseHue, 0, lightness]

        case "constantHue":
            saturation = Math.abs(Math.sin(angle)) * 100;
            lightness = Math.abs(Math.cos(radius)) * 50 + 50;
            return [gs.baseHue, saturation, lightness]

        case "palette":
            const seed = radius * 1000;
            const chosenColorIndex = Math.floor(seededRandom(palette.length, seed));
            let c = palette[chosenColorIndex]
            c[2] = Math.abs(Math.cos(radius)) * 50 + 5;
            return c

        default:
            const hueDefault = angle * (gs.colorChange + gs.oscillationRange * Math.sin(gs.phase + angle * gs.frequency)) % 360;
            return [hueDefault, 100, 50]
    }
}

function seededRandom(max, seed) {
    var a = 1664525;
    var c = 1013904223;
    var m = Math.pow(2, 32);
    return (a * seed + c) % m / m * max;
}

function initiateColorTransition() {
    gs.transitionStartTime = Date.now();

    if(gs.colorMethod == 'palette' & gs.nextPalette != 0){
        gs.nextPalette = (gs.currentPalette + 1) % Object.keys(palettes).length
    }
    else{
        gs.currentPalette = gs.nextPalette
        gs.nextColorModeIndex = (gs.colorModeIndex + 1) % gs.colorModes.length;
    }
}

function interpolateColor(color1, color2, fraction) {
    return color1.map((c1, i) => {
        const c2 = color2[i];
        return c1 + (c2 - c1) * fraction;
    });
}

function getTween(tweenElementSelector, startPathData, endPathData, duration = 1000){
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
        const progress = stepNum/(numMorphSteps/3)
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

    for (let startShape of shapeNames) {
        tweenShapeCombinations[startShape] = {};
        tweens[startShape] = {};
        for (let endShape of shapeNames) {
            const startPathData = (gs.shape2Path[startShape]);
            const endPathData = (gs.shape2Path[endShape]);

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

    return tweenShapeCombinations
}

function ensureSvgElementExists(tweenElementId, startPathData, endPathData, parentSelector = 'body') {
    let svgElement = document.getElementById(tweenElementId);
    if (!svgElement) {
        svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        svgElement.setAttribute('id', tweenElementId);

        const startPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        startPath.setAttribute("id", `${tweenElementId}-start`);
        startPath.setAttribute("style", "visibility:hidden")
        startPath.setAttribute("d", startPathData);

        const endPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        endPath.setAttribute("id", `${tweenElementId}-end`);
        endPath.setAttribute("style", "visibility:hidden")
        endPath.setAttribute("d", endPathData);

        svgElement.appendChild(startPath)
        svgElement.appendChild(endPath)

        const parentElement = document.querySelector(parentSelector);
        if (!parentElement) {
            console.error(`Parent element '${parentSelector}' not found.`);
            return null;
        }

        let svgWrapper = parentElement.querySelector('svg');
        if (!svgWrapper) {
            svgWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            parentElement.appendChild(svgWrapper);
        }
        svgWrapper.appendChild(svgElement);
    }
    return svgElement;
}

// Draw a shape by name onto the main canvas
function drawShape(shapeName, x, y, scale, color, dotIndex) {
    const relativeX = x - gs.centerX;
    const relativeY = y - gs.centerY;
    const angleToCenterRad = Math.atan2(relativeY, relativeX);

    let pathData, rotationRad;

    const dotKey = dotIndex.toString();
    if (!gs.dotShapeMemory[dotKey]) {
        gs.dotShapeMemory[dotKey] = {
            shape: getRandomKey(gs.shape2Path),
            morphState: 0
        }
    }

    if (shapeName == 'random'){
        pathData = gs.shape2Path[gs.dotShapeMemory[dotKey].shape];
        rotationRad = angleToCenterRad + gs.extraRotation[gs.dotShapeMemory[dotKey].shape] * Math.PI / 180 + gs.globalRotation * Math.PI / 180;
    }
    else{
        pathData = gs.shape2Path[shapeName];
        rotationRad = angleToCenterRad + gs.extraRotation[shapeName] * Math.PI / 180 + gs.globalRotation * Math.PI / 180;
    }

    mainCtx.save();
    mainCtx.translate(x, y);
    mainCtx.rotate(rotationRad);
    mainCtx.scale(scale, scale);
    mainCtx.fillStyle = color;
    mainCtx.fill(new Path2D(pathData));
    mainCtx.restore();
}

// Draw a shape from an SVG path string onto the main canvas
function drawShapeFromPath(pathData, x, y, scale, color, rotation) {
    const relativeX = x - gs.centerX;
    const relativeY = y - gs.centerY;
    const angleToCenterRad = Math.atan2(relativeY, relativeX) + rotation * Math.PI / 180;

    mainCtx.save();
    mainCtx.translate(x, y);
    mainCtx.rotate(angleToCenterRad);
    mainCtx.scale(scale, scale);
    mainCtx.fillStyle = color;
    mainCtx.fill(new Path2D(pathData));
    mainCtx.restore();
}

function getRandomKey(obj) {
    const keys = Object.keys(obj);
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
}


function drawDotForSpiral(radius, spiralNumber, dotIndex) {
    const offset = 2 * Math.PI / gs.numSpirals * spiralNumber;

    const angle = radius * gs.angleIncrement % (2 * Math.PI) + gs.rotation;
    const x = radius * Math.cos(angle + offset) + window.innerWidth / 2;
    const y = radius * Math.sin(angle + offset) + window.innerHeight / 2;

    const dynamicDotSize = gs.minDotSize + (gs.maxDotSize - gs.minDotSize) / (1 + Math.exp(-gs.k * (radius - gs.r0)));

    let color
    if (gs.transitionStartTime !== null) {
        let fraction = (Date.now() - gs.transitionStartTime) / gs.transitionDuration;
        if (fraction >= 1) {
          fraction = 1;
          gs.transitionStartTime = null;
          gs.colorModeIndex = gs.nextColorModeIndex;
          gs.colorMethod = gs.colorModes[gs.nextColorModeIndex];
          gs.currentPalette = gs.nextPalette
        }

        let currentPalette = palettes[ Object.keys(palettes)[gs.currentPalette] ]
        let nextPalette = palettes[ Object.keys(palettes)[gs.nextPalette] ]
        let currentColorMethod = gs.colorMethod
        let nextColorMethod = gs.colorModes[gs.nextColorModeIndex]

        const currentColor = calculateColorFromMode(currentColorMethod, currentPalette, angle, radius);
        const nextColor = calculateColorFromMode(nextColorMethod, nextPalette, angle, radius);
        color = interpolateColor(currentColor, nextColor, fraction);
      } else {
        let palette = palettes[ Object.keys(palettes)[gs.currentPalette] ]
        color = calculateColorFromMode(gs.colorMethod, palette, angle, radius);
      }

    const colorString = `hsl(${color[0]},${color[1]}%,${color[2]}%)`

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

        let shapeRotation = 0
        const startAngle = gs.extraRotation[startShape]
        const endAngle = gs.extraRotation[endShape]
        shapeRotation = startAngle + (endAngle-startAngle)*(currentMorphState/gs.numMorphSteps) + gs.globalRotation

        drawShapeFromPath(pathData, x, y, dynamicDotSize, colorString, shapeRotation);
    } else {
        drawShape(gs.currentShape, x, y, dynamicDotSize, colorString, dotIndex);
    }
}


const TARGET_FRAME_MS = 1000 / 60;

function animate(now = performance.now()) {
    const elapsed = now - lastFrameTime;
    if (elapsed < TARGET_FRAME_MS) {
        requestAnimationFrame(animate);
        return;
    }
    fps = fps * 0.9 + (1000 / elapsed) * 0.1;
    lastFrameTime = now - (elapsed % TARGET_FRAME_MS);

    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.clearRect(0, 0, textCanvas.width, textCanvas.height);

    let dotIndex = 0;
    for (let radius = gs.maxRadius; radius >= 0; radius -= gs.radiusIncrement) {
        for (let i = 0; i < gs.numSpirals; i++) {
            drawDotForSpiral(radius, i, dotIndex);
        }
        dotIndex++;
    }
    gs.rotation += gs.rotationSpeed;
    gs.phase += 0.001;
    gs.time += 0.0078125;

    // Smoothly lerp dot sizes toward their targets
    gs.minDotSize += (gs.targetMinDotSize - gs.minDotSize) * 0.08;
    gs.maxDotSize += (gs.targetMaxDotSize - gs.maxDotSize) * 0.08;

    if( gs.doDisplayControls ) {
        displayControls()
    }

    for (let dotIndex in gs.dotShapeMemory) {
        if (gs.dotShapeMemory[dotIndex].morphState < gs.numMorphSteps - 1) {
            gs.dotShapeMemory[dotIndex].morphState++;
        }
    }

    if( gs.autoAdjustParams ){
        gs.r0 = 600 * ( Math.sin( gs.time/17. ) ** 2 ) + 50
        gs.angleIncrement = .033 * Math.cos( gs.time/37. )
        gs.radiusIncrement = 1 * ( Math.sin( gs.time/25. ) ** 2 ) + 9;
        const timeModified = 2*Math.PI * (Math.cos(gs.time/23) ** 2);
        gs.k =  0.1 * Math.cos(timeModified);
        gs.baseHue = ((gs.baseHue) + .1) % 360

        if (gs.time % 12 == 0){
            gs.lastShape = gs.currentShape;
            gs.currentShapeIndex = (gs.currentShapeIndex + 1) % gs.shapes.length;
            gs.currentShape = gs.shapes[gs.currentShapeIndex];

            for (let dotIndex in gs.dotShapeMemory) {
                gs.dotShapeMemory[dotIndex].morphState = 0;
            }
        }

        if (gs.time % 8 == 0){
            initiateColorTransition();
        }
    }
    requestAnimationFrame(animate);
}

function displayControls() {
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
        "N/n: Cycle number of spirals",
        "X/x: Rotate global angle",
        "C/c: Change colorMethod",
        "S/s: Change shape",
        "A/a: Toggle auto-adjust",
        "Spacebar to toggle this display",
    ];

    const fontSize = 15;
    const padding = 20;
    const lineHeight = fontSize + 4;
    const startX = textCanvas.width - padding;

    const readout = [
        `FPS: ${fps.toFixed(1)}`,
        `Adjusting: ${gs.adjustingParameter}`,
        `autoAdjustParams: ${gs.autoAdjustParams}`,
        `rotation: ${gs.rotation.toFixed(2)}`,
        `rotationSpeed: ${gs.rotationSpeed.toFixed(5)}`,
        `colorChange: ${gs.colorChange}`,
        `numSpirals: ${gs.numSpirals}`,
        `isBackgroundBlack: ${gs.isBackgroundBlack}`,
        `currentShapeIndex: ${gs.currentShapeIndex}`,
        `currentShape: ${gs.currentShape}`,
        `time: ${gs.time.toFixed(2)}`,
        `frequency: ${gs.frequency.toFixed(2)}`,
        `oscillationRange: ${gs.oscillationRange}`,
        `minDotSize: ${gs.minDotSize.toFixed(2)}`,
        `maxDotSize: ${gs.maxDotSize.toFixed(2)}`,
        `phase: ${gs.phase.toFixed(2)}`,
        `angleIncrement: ${gs.angleIncrement.toFixed(2)}`,
        `radiusIncrement: ${gs.radiusIncrement.toFixed(2)}`,
        `r0: ${gs.r0.toFixed(2)}`,
        `k: ${gs.k.toFixed(2)}`,
        `baseHue: ${gs.baseHue.toFixed(2)}`,
        `hueRange: ${gs.hueRange}`,
        `colorModeIndex: ${gs.colorModeIndex}`,
        `colorMethod: ${gs.colorMethod}`,
        `currentPalette: ${Object.keys(palettes)[gs.currentPalette]}`
    ];

    ctx.font = `${fontSize}px Arial`;
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    // Measure column widths to fit backgrounds snugly
    const leftColWidth = Math.max(...readout.map(s => ctx.measureText(s).width));
    const rightColWidth = Math.max(...controls.map(s => ctx.measureText(s).width));

    const radius = 12;
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";

    // Left background (readout)
    ctx.beginPath();
    ctx.roundRect(0, 0, leftColWidth + padding * 2, readout.length * lineHeight + padding * 2, [0, radius, radius, 0]);
    ctx.fill();

    // Right background (controls)
    const rightBgWidth = rightColWidth + padding * 2;
    ctx.beginPath();
    ctx.roundRect(textCanvas.width - rightBgWidth, 0, rightBgWidth, controls.length * lineHeight + padding * 2, [radius, 0, 0, radius]);
    ctx.fill();

    ctx.textAlign = "right";
    for (let i = 0; i < controls.length; i++) {
        ctx.strokeText(controls[i], startX, padding + lineHeight * i);
        ctx.fillStyle = "white";
        ctx.fillText(controls[i], startX, padding + lineHeight * i);
    }

    ctx.textAlign = "left";
    for (let i = 0; i < readout.length; i++) {
        ctx.strokeText(readout[i], padding, padding + lineHeight * i);
        ctx.fillStyle = "white";
        ctx.fillText(readout[i], padding, padding + lineHeight * i);
    }
}


animate()
