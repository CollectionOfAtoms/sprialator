import {parseSvgPath} from './parseSvgPath.js'
/**
 * 
 * @param {String} pathString 
 * @param {Number} maxDimension 
 * @returns {String} The new path string scaled to be maxDimension pixels in the largest axis
 */
function scalePathString(pathString, maxDimension=1) {
    
    commands = parseSvgPath(pathString)
    console.log('commands', commands)

    xValues = []
    yValues = []
    // Extract coordinate valuse from svg paths
    for (let command of commands) {        
        let commandType = command[0]
        switch (commandType){
            case 'M':
                xValues.push(command[1])
                yValues.push(command[2])
            case 'm':
                xValues.push(command[1])
                yValues.push(command[2])
            case 'L':
                xValues.push(command[1])
                yValues.push(command[2])
            case 'l': 
                xValues.push(command[1])
                yValues.push(command[2])
        }
    }

    // Find min and max for x and y
    let minX = Math.min(...xValues);
    let maxX = Math.max(...xValues);
    let minY = Math.min(...yValues);
    let maxY = Math.max(...yValues);

    // Determine scale based on the largest range in x or y to fit within [-0.5, 0.5]
    let rangeX = maxX - minX;
    let rangeY = maxY - minY;
    let maxRange = Math.max(rangeX, rangeY);
    let scaleFactor = maxDimension/maxRange;
    let translateX = -(minX + maxX) / 2;
    let translateY = -(minY + maxY) / 2;

    /*Giving up on this.  By taking any path and converting it to an absolute path via this 
    site https://yqnn.github.io/svg-path-editor/
    I was able to then use the translate and scale utilities there to get a workable path. 
    */
    return([translateX, translateY, scaleFactor])



    let scaledCommands = commands
    let scaledPathString = ""

    // Improved number formatting function
    function formatNumber(number) {
        // Ensure we're working with a floating-point number
        let num = parseFloat(number);
        // Round to a maximum of 3 decimal places
        num = num.toFixed(5);
        // Remove any trailing zeros after the decimal point and unnecessary leading zeros
        num = parseFloat(num).toString();
        return num;
    }

    //mulitply each coordinate by the scaleFactor
    for (let command of scaledCommands) {
    
        console.log('command', ':', command );
        
        let commandType = command[0]
        

        switch (commandType){
            case 'M':
                command[1] = formatNumber(command[1]*scaleFactor)
                command[2] = formatNumber(command[2]*scaleFactor)
            case 'm':
                command[1] = formatNumber(command[1]*scaleFactor)
                command[2] = formatNumber(command[2]*scaleFactor)            
            case 'L':
                command[1] = formatNumber(command[1]*scaleFactor)
                command[2] = formatNumber(command[2]*scaleFactor)
            case 'l': 
                command[1] = formatNumber(command[1]*scaleFactor)
                command[2] = formatNumber(command[2]*scaleFactor)
            
        }

        let commandString = command[0] + command.slice(1).join()
        scaledPathString += commandString
    }
    
    return scaledPathString
    // // Calculate translation to center the path
    // let translateX = (0.5 - scaledMinX) - (rangeX * scaleFactor / 2);
    // let translateY = (0.5 - scaledMinY) - (rangeY * scaleFactor / 2);




    // // Adjust the replacement function to format numbers correctly
    // let newPathString = pathString.replace(/-?\d+(\.\d+)?/g, (match, offset) => {
    //     let number = Number(match);
    //     let scaledNumber = (offset % 2 === 0) ? (number * scaleFactor) + translateX : (number * scaleFactor) + translateY;
    //     // Use the improved formatNumber function
    //     return formatNumber(scaledNumber);
    // });
    
    return newPathString;
}

export {scalePathString}