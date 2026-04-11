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
    gs.globalRotation += (gs.targetGlobalRotation - gs.globalRotation) * 0.08;

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
    ctx.save();

    const fontSize = 15;
    const labelFontSize = Math.round(fontSize * 1.5); // 22px — 50% larger
    const labelFont = `900 ${labelFontSize}px Impact, "Arial Black", sans-serif`;
    const labelColor = 'hsl(48, 65%, 68%)'; // desaturated amber/gold
    const padding = 20;
    const lineHeight = fontSize + 6;        // 21px
    const labelSpacing = labelFontSize + 14; // vertical room for label + gap
    const keyFontSize = 12;
    const keyHeight = keyFontSize + 6;       // 18px
    const keyPadH = 5;
    const keyGap = 3;
    const descKeyGap = 8;
    const bgRadius = 12;

    const adj = gs.adjustingParameter;
    const shift = gs.shiftHeld;

    // ── Key icon helpers ──────────────────────────────────────────────────────

    const getKeyWidth = (label) => {
        ctx.font = `bold ${keyFontSize}px monospace`;
        return Math.max(keyHeight, ctx.measureText(label).width + keyPadH * 2);
    };

    const getKeysGroupWidth = (keys) => {
        let total = 0;
        for (let i = 0; i < keys.length; i++) {
            total += getKeyWidth(keys[i]);
            if (i < keys.length - 1) total += keyGap;
        }
        return total;
    };

    // Draw one key icon; returns its pixel width
    const drawKey = (label, x, y, state) => {
        const kw = getKeyWidth(label);
        const kh = keyHeight;
        const isActive = state === 'active';
        const isMuted  = state === 'muted';

        ctx.globalAlpha = isMuted ? 0.30 : 1.0;

        if (isActive) {
            ctx.shadowColor = 'rgba(255, 225, 60, 0.9)';
            ctx.shadowBlur  = 13;
        } else {
            ctx.shadowBlur = 0;
        }

        // Background
        ctx.fillStyle = isMuted  ? 'rgba(60, 60, 60, 0.55)'
                      : isActive ? 'rgba(255, 210, 30, 0.22)'
                                 : 'rgba(200, 200, 200, 0.12)';
        ctx.beginPath();
        ctx.roundRect(x, y, kw, kh, 3);
        ctx.fill();

        // Border (no glow on border)
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        ctx.strokeStyle = isMuted  ? 'rgba(80, 80, 80, 0.4)'
                        : isActive ? 'rgba(255, 210, 30, 0.8)'
                                   : 'rgba(170, 170, 170, 0.4)';
        ctx.stroke();

        // Label
        ctx.font = `bold ${keyFontSize}px monospace`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isMuted  ? 'rgba(100, 100, 100, 1)'
                      : isActive ? 'rgba(255, 230, 80, 1)'
                                 : 'rgba(230, 230, 230, 1)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.strokeText(label, x + kw / 2, y + kh / 2);
        ctx.fillText(label, x + kw / 2, y + kh / 2);

        ctx.globalAlpha = 1.0;
        return kw;
    };

    // ── Control items ─────────────────────────────────────────────────────────

    const paramName = adj === 'r0' ? 'r0' : adj === 'k' ? 'k' : adj === 'h' ? 'hue' : '';
    const arrowDesc = adj !== 'none' ? `Adjust ${paramName}` : 'Min dot size';
    const lrDesc    = adj === 'h' ? 'Hue range' : 'Color freq';

    const ctrls = [
        { keys: ['↑'],       desc: arrowDesc + ' +',  state: adj !== 'none' ? 'active' : (shift ? 'muted'  : 'normal') },
        { keys: ['↓'],       desc: arrowDesc + ' −',  state: adj !== 'none' ? 'active' : (shift ? 'muted'  : 'normal') },
        { keys: ['⇧', '↑'], desc: 'Max dot +',       state: adj !== 'none' ? 'muted'  : (shift ? 'active' : 'normal') },
        { keys: ['⇧', '↓'], desc: 'Max dot −',       state: adj !== 'none' ? 'muted'  : (shift ? 'active' : 'normal') },
        { keys: ['→'],       desc: lrDesc + ' +',     state: 'normal' },
        { keys: ['←'],       desc: lrDesc + ' −',     state: 'normal' },
        { keys: ['R'],       desc: 'Toggle r0 mode',  state: adj === 'r0' ? 'active' : (adj !== 'none' ? 'muted' : 'normal') },
        { keys: ['K'],       desc: 'Toggle k mode',   state: adj === 'k'  ? 'active' : (adj !== 'none' ? 'muted' : 'normal') },
        { keys: ['H'],       desc: 'Toggle hue mode', state: adj === 'h'  ? 'active' : (adj !== 'none' ? 'muted' : 'normal') },
        { keys: ['+'],       desc: 'Rotation +',      state: 'normal' },
        { keys: ['−'],       desc: 'Rotation −',      state: 'normal' },
        { keys: ['1-9'],     desc: 'Set spirals',     state: 'normal' },
        { keys: ['N'],       desc: 'Cycle spirals',   state: 'normal' },
        { keys: ['X'],       desc: 'Rotate angle',    state: 'normal' },
        { keys: ['C'],       desc: 'Color mode',      state: 'normal' },
        { keys: ['S'],       desc: 'Shape',           state: 'normal' },
        { keys: ['A'],       desc: 'Auto-adjust',     state: gs.autoAdjustParams ? 'active' : 'normal' },
        { keys: ['SPC'],     desc: 'Toggle display',  state: 'normal' },
    ];

    // ── Readout items ─────────────────────────────────────────────────────────

    const readout = [
        { text: `FPS: ${fps.toFixed(1)}`,                                      hl: false },
        { text: `Adjusting: ${gs.adjustingParameter}`,                         hl: adj !== 'none' },
        { text: `autoAdjust: ${gs.autoAdjustParams}`,                          hl: gs.autoAdjustParams },
        { text: `rotation: ${gs.rotation.toFixed(2)}`,                         hl: false },
        { text: `rotationSpeed: ${gs.rotationSpeed.toFixed(5)}`,               hl: false },
        { text: `colorChange: ${gs.colorChange}`,                              hl: false },
        { text: `numSpirals: ${gs.numSpirals}`,                                hl: false },
        { text: `isBackgroundBlack: ${gs.isBackgroundBlack}`,                  hl: false },
        { text: `currentShapeIndex: ${gs.currentShapeIndex}`,                  hl: false },
        { text: `currentShape: ${gs.currentShape}`,                            hl: false },
        { text: `time: ${gs.time.toFixed(2)}`,                                 hl: false },
        { text: `frequency: ${gs.frequency.toFixed(2)}`,                       hl: false },
        { text: `oscillationRange: ${gs.oscillationRange}`,                    hl: false },
        { text: `minDotSize: ${gs.minDotSize.toFixed(2)}`,                     hl: adj === 'none' && !shift },
        { text: `maxDotSize: ${gs.maxDotSize.toFixed(2)}`,                     hl: adj === 'none' && shift },
        { text: `phase: ${gs.phase.toFixed(2)}`,                               hl: false },
        { text: `angleIncrement: ${gs.angleIncrement.toFixed(2)}`,             hl: false },
        { text: `radiusIncrement: ${gs.radiusIncrement.toFixed(2)}`,           hl: false },
        { text: `r0: ${gs.r0.toFixed(2)}`,                                     hl: adj === 'r0' },
        { text: `k: ${gs.k.toFixed(2)}`,                                       hl: adj === 'k' },
        { text: `baseHue: ${gs.baseHue.toFixed(2)}`,                           hl: adj === 'h' },
        { text: `hueRange: ${gs.hueRange}`,                                    hl: adj === 'h' },
        { text: `colorModeIndex: ${gs.colorModeIndex}`,                        hl: false },
        { text: `colorMethod: ${gs.colorMethod}`,                              hl: false },
        { text: `currentPalette: ${Object.keys(palettes)[gs.currentPalette]}`, hl: false },
    ];

    // ── Measure widths for panel backgrounds ──────────────────────────────────

    ctx.font = `${fontSize}px Arial`;
    const leftContentW = Math.max(...readout.map(r => ctx.measureText(r.text).width));
    ctx.font = labelFont;
    const leftLabelW = ctx.measureText('Current Params').width;
    const leftColWidth = Math.max(leftContentW, leftLabelW);

    ctx.font = `${fontSize}px Arial`;
    let maxRowW = 0;
    for (const item of ctrls) {
        const dw = ctx.measureText(item.desc).width;
        const kw = getKeysGroupWidth(item.keys);
        maxRowW = Math.max(maxRowW, dw + descKeyGap + kw);
    }
    ctx.font = labelFont;
    const rightLabelW = ctx.measureText('Controls').width;
    const rightColWidth = Math.max(maxRowW, rightLabelW);

    // ── Panel backgrounds ─────────────────────────────────────────────────────

    const leftPanelH  = padding + labelSpacing + readout.length * lineHeight + padding;
    const rightPanelW = rightColWidth + padding * 2;
    const rightPanelH = padding + labelSpacing + ctrls.length * lineHeight + padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.roundRect(0, 0, leftColWidth + padding * 2, leftPanelH, [0, bgRadius, bgRadius, 0]);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(textCanvas.width - rightPanelW, 0, rightPanelW, rightPanelH, [bgRadius, 0, 0, bgRadius]);
    ctx.fill();

    // ── "Current Params" label ────────────────────────────────────────────────

    ctx.font        = labelFont;
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'top';
    ctx.lineWidth   = 3;
    ctx.strokeStyle = 'black';
    ctx.fillStyle   = labelColor;
    ctx.shadowBlur  = 0;
    ctx.strokeText('Current Params', padding, padding);
    ctx.fillText('Current Params', padding, padding);

    // ── Readout rows ──────────────────────────────────────────────────────────

    ctx.font         = `${fontSize}px Arial`;
    ctx.lineWidth    = 2;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';

    for (let i = 0; i < readout.length; i++) {
        const item = readout[i];
        const rowY = padding + labelSpacing + lineHeight * i;

        if (item.hl) {
            ctx.shadowColor = 'rgba(255, 225, 60, 0.85)';
            ctx.shadowBlur  = 10;
            ctx.fillStyle   = 'rgba(255, 235, 80, 1)';
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle  = 'white';
        }
        ctx.strokeStyle = 'black';
        ctx.strokeText(item.text, padding, rowY);
        ctx.fillText(item.text, padding, rowY);
    }
    ctx.shadowBlur = 0;

    // ── "Controls" label ──────────────────────────────────────────────────────

    ctx.font         = labelFont;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.lineWidth    = 3;
    ctx.strokeStyle  = 'black';
    ctx.fillStyle    = labelColor;
    ctx.shadowBlur   = 0;
    ctx.strokeText('Controls', textCanvas.width - padding, padding);
    ctx.fillText('Controls', textCanvas.width - padding, padding);

    // ── Control rows ──────────────────────────────────────────────────────────

    for (let i = 0; i < ctrls.length; i++) {
        const item = ctrls[i];
        const rowY = padding + labelSpacing + lineHeight * i;
        const keysW = getKeysGroupWidth(item.keys);
        const rightEdge = textCanvas.width - padding;
        let kx = rightEdge - keysW;

        // Key icons
        let cx = kx;
        for (let ki = 0; ki < item.keys.length; ki++) {
            const kw = drawKey(item.keys[ki], cx, rowY, item.state);
            cx += kw;
            if (ki < item.keys.length - 1) cx += keyGap;
        }

        // Description text
        const descX = kx - descKeyGap;
        ctx.font         = `${fontSize}px Arial`;
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'middle';
        const textY = rowY + keyHeight / 2;

        if (item.state === 'muted') {
            ctx.fillStyle   = 'rgba(100, 100, 100, 0.7)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur  = 0;
        } else if (item.state === 'active') {
            ctx.fillStyle   = 'rgba(255, 235, 80, 1)';
            ctx.strokeStyle = 'black';
            ctx.shadowColor = 'rgba(255, 225, 60, 0.6)';
            ctx.shadowBlur  = 8;
        } else {
            ctx.fillStyle   = 'white';
            ctx.strokeStyle = 'black';
            ctx.shadowBlur  = 0;
        }
        ctx.lineWidth = 2;
        ctx.strokeText(item.desc, descX, textY);
        ctx.fillText(item.desc, descX, textY);
        ctx.shadowBlur = 0;
    }

    ctx.restore();
}


animate()
