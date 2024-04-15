/**
 * 
 * @param {String} pathString 
 * @returns {List} A list of lists where each element is a single command of the string
 */
function parseSvgPath(pathString) {
    // Insert commas before minus signs where necessary to separate coordinates
    const normalizedPath = pathString.replace(/(\d)-/g, '$1,-');

    // Split the path string into command segments
    const commandSegments = normalizedPath.match(/[a-zA-Z][^a-zA-Z]*/g);
    
    // Process each command segment
    const commands = commandSegments.map(segment => {
        // Extract the command letter and the rest of the parameters
        const commandLetter = segment[0];
        const params = segment.slice(1).trim();

        // Split parameters on spaces, commas, or a combination thereof
        // Also accounts for negative numbers
        const paramArray = params.split(/[\s,]+/).map(str => {
            // Convert parameters to numbers if possible
            const num = parseFloat(str);
            return isNaN(num) ? str : num;
        });

        // Return an array with the command letter followed by its parameters
        return [commandLetter, ...paramArray];
    });

    return commands;
}

export {parseSvgPath}