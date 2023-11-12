//gs = global state, abbreviated for ease 
let gs={

    centerX :  window.innerWidth / 2,
    centerY :  window.innerHeight / 2,

    adjustingParameter : "none",
    numMorphSteps: 200,

    autoAdjustParams: true,
    rotation: 0,
    rotationSpeed: 0.001,
    colorChange: 10,
    numSpirals: 9, // Default number of spirals
    isBackgroundBlack: true, // default to black
    currentShapeIndex: 2, // index of shape type to default
    
    shapes : ["circle", "square", "triangle", "rhombus", "random"],
    shape2Path: {
        'circle': `M 0 -0.5 L 0.35 -0.35 L 0.5 0 L 0.35 0.35 L 0 0.5 L -0.35 0.35 L -0.5 0 L -0.35 -0.35 Z`,
        'square': `M 0 -0.5 L 0.5 -0.5 L 0.5 0 L 0.5 0.5 L 0 0.5 L -0.5 0.5 L -0.5 0 L -0.5 -0.5 Z`,
        'triangle': `M -.5 .25 L 0 -.75 L .5 .25 L .3 .25 L .1 .25 L -.1 .25 L -.3 .25 L -.5 .25 Z`,
        'rhombus': `M 0 -0.5 L 0.4 -0.25 L 0.8 0 L 0.4 0.25 L 0 0.5 L -0.4 0.25 L -0.8 0 L -0.4 -0.25 Z`,
    },

    extraRotation: {
        'circle': 0,
        'square': 45,
        'triangle': -90,
        'rhombus': 0,
    },

    dotShapeMemory: {},

    time: 0,
    frequency: 0,
    oscillationRange: 100,
    minDotSize: 50,
    maxDotSize: 66,
    phase: 0,

    colorModes: ["default", "offsetAngle", "offsetAndRadius", "radiusBased", "hueSliceByOffsetAndRadius", "grayscale_hsl", "constantHue", "palette"],
    colorModeIndex: 7, // global variable to track the current color mode

    baseHue: 200,  //Hue for hueSlice color modes
    hueRange: 50,  //Width of hue slice 

    currentPalette: 0,
    doDisplayControls: false, // Whether or not the control display is visible
    angleIncrement: -0.03,
    radiusIncrement: 10,
    r0: 84.35, // Adjust this for the inflection point of the curve
    k: 0.034, // Adjust this to make the transition smoother

    transitionStartTime: null,
    transitionDuration : 5000 //Color transition time in milliseconds
}

function initializeValues(){
    gs.currentShape = gs.shapes[gs.currentShapeIndex] // Depends on 'shapes' and 'currentShapeIndex'
    gs.lastShape = gs.shapes[gs.currentShapeIndex] // Depends on 'shapes' and 'currentShapeIndex'
    gs.nextColorModeIndex = (gs.colorModeIndex + 1) % gs.colorModes.length;
    gs.colorMethod = gs.colorModes[gs.colorModeIndex];
    gs.maxRadius = Math.sqrt(gs.centerX ** 2 + gs.centerY ** 2)
}

initializeValues()

export { gs }