//This is the inital guess for how big the machine is. These numbers are wrong intensionally
const initialWidth = 3048 + 12
const initialHeight = 2200 - 14

//These are the true corners of the machine that we want to solve for (only used for simulated measurments)
const trueTLX = -0.6948090610228441
const trueTLY = 2131.275233532367
const trueTRX = 3034.4072793128926
const trueTRY = 2127.1780972406527
const trueBLX = 0
const trueBLY = 0
const trueBRX = 3034.960970894897
const trueBRY = 0

//Establish initial guesses for the corners
var initialGuess = {
  tl: { x: 0, y: initialHeight },
  tr: { x: initialWidth, y: initialHeight },
  bl: { x: 0, y: 0 },
  br: { x: initialWidth, y: 0 },
  fitness: 0,
}

const centerX = initialWidth / 2
const centerY = initialHeight / 2

let result

/**------------------------------------Intro------------------------------------
 *
 *   If you are reading this code to understand it then I would recommend starting
 *  at the bottom of the page and working your way up. The code is written in a
 * functional style so the function definitions are at the top and the code that
 * actually runs is at the bottom. It was also written quickly and modified a lot
 * so it is not very clean. I apologize for that.
 *
 *------------------------------------------------------------------------------
 */

/**
 * Simulates a measurement at a given location with random and constant errors.
 * @param {number} x - The x-coordinate of the location to measure.
 * @param {number} y - The y-coordinate of the location to measure.
 * @param {number} randomError - The maximum amount of random error to add to the measurement.
 * @param {number} constantError - The constant error to add to the measurement.
 * @returns {Object} - An object containing the simulated measurements at the given location.
 */
function takeSimulatedMeasurement(x, y, randomError, constantError) {
  const tl =
    distanceBetweenPoints(trueTLX, trueTLY, x, y) + (Math.random() * randomError * 2 - randomError) + constantError
  const tr =
    distanceBetweenPoints(trueTRX, trueTRY, x, y) + (Math.random() * randomError * 2 - randomError) + constantError
  const bl =
    distanceBetweenPoints(trueBLX, trueBLY, x, y) + (Math.random() * randomError * 2 - randomError) + constantError
  const br =
    distanceBetweenPoints(trueBRX, trueBRY, x, y) + (Math.random() * randomError * 2 - randomError) + constantError
  return { tl: tl, tr: tr, bl: bl, br: br }
}

/**
 * Computes the distance between two points.
 * @param {number} a - The x-coordinate of the first point.
 * @param {number} b - The y-coordinate of the first point.
 * @param {number} c - The x-coordinate of the second point.
 * @param {number} d - The y-coordinate of the second point.
 * @returns {number} - The distance between the two points.
 */
function distanceBetweenPoints(a, b, c, d) {
  var dx = c - a
  var dy = d - b
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Computes the end point of a line based on its starting point, angle, and length.
 * @param {number} startX - The x-coordinate of the line's starting point.
 * @param {number} startY - The y-coordinate of the line's starting point.
 * @param {number} angle - The angle of the line in radians.
 * @param {number} length - The length of the line.
 * @returns {Object} - An object containing the x and y coordinates of the line's end point.
 */
function getEndPoint(startX, startY, angle, length) {
  var endX = startX + length * Math.cos(angle)
  var endY = startY + length * Math.sin(angle)
  return { x: endX, y: endY }
}

/**
 * Computes how close all of the line end points are to each other.
 * @param {Object} line1 - The first line to compare.
 * @param {Object} line2 - The second line to compare.
 * @param {Object} line3 - The third line to compare.
 * @param {Object} line4 - The fourth line to compare.
 * @returns {number} - The fitness value, which is the average distance between all line end points.
 */
function computeEndpointFitness(line1, line2, line3, line4) {
  const a = distanceBetweenPoints(line1.xEnd, line1.yEnd, line2.xEnd, line2.yEnd)
  const b = distanceBetweenPoints(line1.xEnd, line1.yEnd, line3.xEnd, line3.yEnd)
  const c = distanceBetweenPoints(line1.xEnd, line1.yEnd, line4.xEnd, line4.yEnd)
  const d = distanceBetweenPoints(line2.xEnd, line2.yEnd, line3.xEnd, line3.yEnd)
  const e = distanceBetweenPoints(line2.xEnd, line2.yEnd, line4.xEnd, line4.yEnd)
  const f = distanceBetweenPoints(line3.xEnd, line3.yEnd, line4.xEnd, line4.yEnd)

  const fitness = (a + b + c + d + e + f) / 6

  return fitness
}

/**
 * Computes the end point of a line based on its starting point, angle, and length.
 * @param {Object} line - The line to compute the end point for.
 * @returns {Object} - The line with the end point added.
 */
function computeLineEndPoint(line) {
  const end = getEndPoint(line.xBegin, line.yBegin, line.theta, line.length)
  line.xEnd = end.x
  line.yEnd = end.y
  return line
}

/**
 * Walks the four lines in the given set, adjusting their endpoints to minimize the distance between them.
 * @param {Object} tlLine - The top-left line in the set.
 * @param {Object} trLine - The top-right line in the set.
 * @param {Object} blLine - The bottom-left line in the set.
 * @param {Object} brLine - The bottom-right line in the set.
 * @param {number} stepSize - The amount to adjust the angle of each line by on each iteration.
 * @returns {Object} - An object containing the final positions of each line.
 */
function walkLines(tlLine, trLine, blLine, brLine, stepSize) {
  let changeMade = true
  let bestFitness = computeEndpointFitness(tlLine, trLine, blLine, brLine)

  while (changeMade) {
    changeMade = false

    const lines = [tlLine, trLine, blLine, brLine]

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      for (let direction of [-1, 1]) {
        const newLine = computeLineEndPoint({
          xBegin: line.xBegin,
          yBegin: line.yBegin,
          theta: line.theta + direction * stepSize,
          length: line.length,
        })

        const newFitness = computeEndpointFitness(
          i === 0 ? newLine : tlLine,
          i === 1 ? newLine : trLine,
          i === 2 ? newLine : blLine,
          i === 3 ? newLine : brLine
        )

        if (newFitness < bestFitness) {
          lines[i] = newLine
          bestFitness = newFitness
          changeMade = true
        }
      }
    }

    tlLine = lines[0]
    trLine = lines[1]
    blLine = lines[2]
    brLine = lines[3]
  }

  return { tlLine, trLine, blLine, brLine }
}

/**
 * Computes the fitness of a set of lines based on how close their endpoints are to each other.
 * @param {Object} measurement - An object containing the initial theta values and lengths for each line.
 * @param {Object} individual - An object containing the x and y coordinates for each line's starting point.
 * @returns {Object} - An object containing the fitness value and the final positions of each line.
 */
function magneticallyAttractedLinesFitness(measurement, individual) {
  //These set the inital conditions for theta. They don't really mater, they just have to kinda point to the middle of the frame.
  if (measurement.tlTheta == undefined) {
    measurement.tlTheta = -0.3
  }
  if (measurement.trTheta == undefined) {
    measurement.trTheta = 3.5
  }
  if (measurement.blTheta == undefined) {
    measurement.blTheta = 0.5
  }
  if (measurement.brTheta == undefined) {
    measurement.brTheta = 2.6
  }

  //Define the four lines with starting points and lengths
  var tlLine = computeLineEndPoint({
    xBegin: individual.tl.x,
    yBegin: individual.tl.y,
    theta: measurement.tlTheta,
    length: measurement.tl,
  })
  var trLine = computeLineEndPoint({
    xBegin: individual.tr.x,
    yBegin: individual.tr.y,
    theta: measurement.trTheta,
    length: measurement.tr,
  })
  var blLine = computeLineEndPoint({
    xBegin: individual.bl.x,
    yBegin: individual.bl.y,
    theta: measurement.blTheta,
    length: measurement.bl,
  })
  var brLine = computeLineEndPoint({
    xBegin: individual.br.x,
    yBegin: individual.br.y,
    theta: measurement.brTheta,
    length: measurement.br,
  })

  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.1)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.01)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.001)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.0001)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.00001)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.000001)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.0000001)
  var { tlLine, trLine, blLine, brLine } = walkLines(tlLine, trLine, blLine, brLine, 0.00000001)

  measurement.tlTheta = tlLine.theta
  measurement.trTheta = trLine.theta
  measurement.blTheta = blLine.theta
  measurement.brTheta = brLine.theta

  //Compute the final fitness
  const finalFitness = computeEndpointFitness(tlLine, trLine, blLine, brLine)

  //Compute the tension in the two upper belts
  const { TL, TR } = calculateTensions(tlLine.xEnd, tlLine.yEnd, individual)
  measurement.TLtension = TL
  measurement.TRtension = TR

  drawLines(tlLine, trLine, blLine, brLine, individual);

  return { fitness: finalFitness, lines: { tlLine: tlLine, trLine: trLine, blLine: blLine, brLine: brLine } }
}

/**
 * Computes the distance of one line's end point from the center of mass of the other three lines.
 * @param {Object} lineToCompare - The line to compute the distance for.
 * @param {Object} line2 - The second line to use in computing the center of mass.
 * @param {Object} line3 - The third line to use in computing the center of mass.
 * @param {Object} line4 - The fourth line to use in computing the center of mass.
 * @returns {Object} - An object containing the x and y distances from the center of mass.
 */
function computeDistanceFromCenterOfMass(lineToCompare, line2, line3, line4) {
  //Compute the center of mass
  const x = (line2.xEnd + line3.xEnd + line4.xEnd) / 3
  const y = (line2.yEnd + line3.yEnd + line4.yEnd) / 3

  return { x: lineToCompare.xEnd - x, y: lineToCompare.yEnd - y }
}

/**
 * Computes the distances from the center of mass for four lines and converts them into the relevant variables that we can tweak.
 * @param {Object} lines - An object containing four lines to compute the distances from the center of mass for.
 * @returns {Object} - An object containing the distances from the center of mass for tlX, tlY, trX, trY, and brX.
 */
function generateTweaks(lines) {
  //We care about the distances for tlX, tlY, trX, trY, brX

  const tlX = computeDistanceFromCenterOfMass(lines.tlLine, lines.trLine, lines.blLine, lines.brLine).x
  const tlY = computeDistanceFromCenterOfMass(lines.tlLine, lines.trLine, lines.blLine, lines.brLine).y
  const trX = computeDistanceFromCenterOfMass(lines.trLine, lines.tlLine, lines.blLine, lines.brLine).x
  const trY = computeDistanceFromCenterOfMass(lines.trLine, lines.tlLine, lines.blLine, lines.brLine).y
  const brX = computeDistanceFromCenterOfMass(lines.brLine, lines.tlLine, lines.trLine, lines.blLine).x

  return { tlX: tlX, tly: tlY, trX: trX, trY: trY, brX: brX }
}

/**
 * Computes all of the tweaks and summarizes them to move the guess furthest from the center of mass of the lines.
 * @param {Array} lines - An array of lines to compute the tweaks for.
 * @param {Object} lastGuess - The last guess made by the algorithm.
 * @returns {Object} - The updated guess with the furthest tweaks applied.
 */
function computeFurthestFromCenterOfMass(lines, lastGuess) {
  var tlX = 0
  var tlY = 0
  var trX = 0
  var trY = 0
  var brX = 0

  lines.forEach((line) => {
    const tweaks = generateTweaks(line)

    tlX = tlX + tweaks.tlX
    tlY = tlY + tweaks.tly
    trX = trX + tweaks.trX
    trY = trY + tweaks.trY
    brX = brX + tweaks.brX
  })

  tlX = tlX / lines.length
  tlY = tlY / lines.length
  trX = trX / lines.length
  trY = trY / lines.length
  brX = brX / lines.length

  const maxError = Math.max(Math.abs(tlX), Math.abs(tlY), Math.abs(trX), Math.abs(trY), Math.abs(brX))

  var divisor = -10
  if (maxError == Math.abs(tlX)) {
    //console.log("Move tlY by: " + tlY/divisor);
    lastGuess.tl.x = lastGuess.tl.x + tlX / divisor
  }
  if (maxError == Math.abs(tlY)) {
    //console.log("Move tlY by: " + tlY/divisor);
    lastGuess.tl.y = lastGuess.tl.y + tlY / divisor
  } else if (maxError == Math.abs(trX)) {
    //console.log("Move trX by: " + trX/divisor);
    lastGuess.tr.x = lastGuess.tr.x + trX / divisor
  } else if (maxError == Math.abs(trY)) {
    //console.log("Move trY by: " + trY/divisor);
    lastGuess.tr.y = lastGuess.tr.y + trY / divisor
  } else if (maxError == Math.abs(brX)) {
    //console.log("Move brX by: " + brX/divisor);
    lastGuess.br.x = lastGuess.br.x + brX / divisor
  }

  return lastGuess
}

/**
 * Computes the fitness of a guess for a set of measurements by comparing the guess to magnetically attracted lines.
 * @param {Array} measurements - An array of measurements to compare the guess to.
 * @param {Object} lastGuess - The last guess made by the algorithm.
 * @returns {Object} - An object containing the fitness of the guess and the lines used to calculate the fitness.
 */
function computeLinesFitness(measurements, lastGuess) {
  var fitnesses = []
  var allLines = []

  //Check each of the measurements against the guess
  measurements.forEach((measurement) => {
    const { fitness, lines } = magneticallyAttractedLinesFitness(measurement, lastGuess)
    fitnesses.push(fitness)
    allLines.push(lines)
  })

  //Computes the average fitness of all of the measurements
  const fitness = calculateAverage(fitnesses)

  // console.log(fitnesses)

  //Here is where we need to do the calculation of which corner is the worst and which direction to move it
  lastGuess = computeFurthestFromCenterOfMass(allLines, lastGuess)
  lastGuess.fitness = fitness

  return lastGuess
}

function calculateTensions(x, y, guess) {
  let Xtl = guess.tl.x
  let Ytl = guess.tl.y
  let Xtr = guess.tr.x
  let Ytr = guess.tr.y
  let Xbl = guess.bl.x
  let Ybl = guess.bl.y
  let Xbr = guess.br.x
  let Ybr = guess.br.y

  let mass = 5.0
  const G_CONSTANT = 9.80665
  let alpha = 0.26
  let TL, TR

  let A, C, sinD, cosD, sinE, cosE
  let Fx, Fy

  A = (Xtl - x) / (Ytl - y)
  C = (Xtr - x) / (Ytr - y)
  A = Math.abs(A)
  C = Math.abs(C)
  sinD = x / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
  cosD = y / Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
  sinE = Math.abs(Xbr - x) / Math.sqrt(Math.pow(Xbr - x, 2) + Math.pow(y, 2))
  cosE = y / Math.sqrt(Math.pow(Xbr - x, 2) + Math.pow(y, 2))

  Fx = Ybr * sinE - Ybl * sinD
  Fy = Ybr * cosE + Ybl * cosD + mass * G_CONSTANT * Math.cos(alpha)
  // console.log(`Fx = ${Fx.toFixed(1)}, Fy = ${Fy.toFixed(1)}`);

  let TLy = (Fx + C * Fy) / (A + C)
  let TRy = Fy - TLy
  let TRx = C * (Fy - TLy)
  let TLx = A * TLy

  // console.log(`TLy = ${TLy.toFixed(1)}, TRy = ${TRy.toFixed(1)}, TRx = ${TRx.toFixed(1)}, TLx = ${TLx.toFixed(1)}`);

  TL = Math.sqrt(Math.pow(TLx, 2) + Math.pow(TLy, 2))
  TR = Math.sqrt(Math.pow(TRx, 2) + Math.pow(TRy, 2))

  return { TL, TR }
}

/**
 * Calculates the average of an array of numbers.
 * @param {number[]} array - The array of numbers to calculate the average of.
 * @returns {number} - The average of the array.
 */
function calculateAverage(array) {
  var total = 0
  var count = 0

  array.forEach(function (item, index) {
    total += Math.abs(item)
    count++
  })

  return total / count
}

/**
 * Prints the difference between the real values and the computed values for the corners. Only useful when using simulated
 * measurements.
 * @param {Object} guess - An object containing the x and y coordinates of the top left, top right, bottom left, and bottom right corners of a trapazoid.
 * @returns {void}
 */
function printResults(guess) {
  // console.log("tlX error: " + (guess.tl.x - trueTLX) + "mm at: " + guess.tl.x);
  // console.log("tlY error: " + (guess.tl.y - trueTLY) + "mm at: " + guess.tl.y);
  // console.log("trX error: " + (guess.tr.x - trueTRX) + "mm at: " + guess.tr.x);
  // console.log("trY error: " + (guess.tr.y - trueTRY) + "mm at: " + guess.tr.y);
  // console.log("brX error: " + (guess.br.x - trueBRX) + "mm at: " + guess.br.x);
  // console.log(
  //   '(' +
  //     guess.tl.x +
  //     ', ' +
  //     guess.tl.y +
  //     '), (' +
  //     guess.tr.x +
  //     ', ' +
  //     guess.tr.y +
  //     ')\n (' +
  //     guess.bl.x +
  //     ', ' +
  //     guess.bl.y +
  //     '), (' +
  //     guess.br.x +
  //     ', ' +
  //     guess.br.y +
  //     ')'
  // )
}

/**
 * Projects the measurements to the plane of the machine. This is needed
 * because the belts are not parallel to the surface of the machine.
 * @param {Object} measurement - An object containing the measurements
 * @returns {Object} - An object containing the projected measurements
 */
function projectMeasurement(measurement) {
  const tlZ = 116
  const trZ = 69
  const blZ = 47
  const brZ = 89

  const tl = Math.sqrt(Math.pow(measurement.tl, 2) - Math.pow(tlZ, 2))
  const tr = Math.sqrt(Math.pow(measurement.tr, 2) - Math.pow(trZ, 2))
  const bl = Math.sqrt(Math.pow(measurement.bl, 2) - Math.pow(blZ, 2))
  const br = Math.sqrt(Math.pow(measurement.br, 2) - Math.pow(brZ, 2))

  return { tl: tl, tr: tr, bl: bl, br: br }
}

/**
 * Projects an array of measurements to the plane of the machine to account for the fact that the start and end point are not in the same plane.
 * @param {Object[]} measurements - An array of objects containing the measurements of the top left, top right, bottom left, and bottom right corners of a rectangle.
 * @returns {Object[]} - An array of objects containing the projected measurements of the top left, top right, bottom left, and bottom right corners of a rectangle.
 */
function projectMeasurements(measurements) {
  var projectedMeasurements = []

  measurements.forEach((measurement) => {
    projectedMeasurements.push(projectMeasurement(measurement))
  })

  return projectedMeasurements
}

/**
 * Adds a constant to each measurement in an array of measurements.
 * @param {Object[]} measurements - An array of objects containing the measurements of the top left, top right, bottom left, and bottom right corners of a rectangle.
 * @param {number} offset - The constant to add to each measurement.
 * @returns {Object[]} - An array of objects containing the updated measurements of the top left, top right, bottom left, and bottom right corners of a rectangle.
 */
function offsetMeasurements(measurements, offset) {
  const newMeasurements = measurements.map((measurement) => {
    return {
      tl: measurement.tl + offset,
      tr: measurement.tr + offset,
      bl: measurement.bl + offset,
      br: measurement.br + offset,
    }
  })

  return newMeasurements
}

/**
 * Scales each measurement in an array of measurements by a constant.
 * @param {Object[]} measurements - An array of objects containing the measurements of the top left, top right, bottom left, and bottom right corners of a rectangle.
 * @param {number} scale - The constant to multiply each measurement by.
 * @returns {Object[]} - An array of objects containing the updated measurements of the top left, top right, bottom left, and bottom right corners of a rectangle.
 */
function scaleMeasurements(measurements, scale) {
  const newMeasurements = measurements.map((measurement) => {
    return {
      tl: measurement.tl * scale,
      tr: measurement.tr * scale,
      bl: measurement.bl, // * scale,
      br: measurement.br, // * scale
    }
  })

  return newMeasurements
}

function scaleMeasurementsBasedOnTension(measurements, guess) {
  const maxScale = 0.995
  const minScale = 0.994
  const maxTension = 60
  const minTension = 20

  const scaleRange = maxScale - minScale
  const tensionRange = maxTension - minTension

  const newMeasurements = measurements.map((measurement) => {
    const tensionAdjustedTLScale = (1 - (measurement.TLtension - minTension) / tensionRange) * scaleRange + minScale
    const tensionAdjustedTRScale = (1 - (measurement.TRtension - minTension) / tensionRange) * scaleRange + minScale

    return {
      tl: measurement.tl * tensionAdjustedTLScale,
      tr: measurement.tr * tensionAdjustedTRScale,
      bl: measurement.bl, // * scale,
      br: measurement.br, // * scale
    }
  })

  return newMeasurements
}

function measurementsChanged() {
  try {
    const calTextElement = document.getElementById("caldata");
    let textValue = calTextElement.value;
    if (textValue.indexOf('bl:')>0) {
      textValue = JSON.stringify(eval(textValue));
    }
    let caldata = JSON.parse(textValue);
    SavedMeasurements = caldata;
    calibrationTableUpdate();
    document.querySelector('button#compute-sim-button').disabled = false;
  } catch (err) {
    console.error(err);
  }
}

function computeSim() {

  clearCalCanvas();
  findMaxFitness(SavedMeasurements);
  results = document.querySelector("#messages").value
  console.log(results);
}


//Deletes everything from the canvas
function clearCalCanvas() {
  const canvas = document.getElementById('CursorLayer');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function findMaxFitness(measurements) {
  if (window.computing) {
    console.log('Computation in progress, ignoring');
    return;
  }
  window.computing = true;

  var maxFitness = -1;
  var newFitness = 0;
  var stagnantCounter = 0;
  const maxCycles = 300000;
  var currentCycles = 0;

  function runCycle() {
      if (stagnantCounter < 14 && currentCycles < maxCycles) {
          maxFitness = newFitness;

          var maxFitnessThisRun = 0;
          //Run 100 steps
          for (let i = 0; i < 100; i++) {
              clearCalCanvas();
              initialGuess = computeLinesFitness(measurements, initialGuess);
              maxFitnessThisRun = Math.max(1 / initialGuess.fitness, maxFitnessThisRun);
          }

          currentCycles += 100;

          newFitness = maxFitnessThisRun;
          var messagesBox = document.querySelector('#messages');
          messagesBox.value += '\nFitness: ' + newFitness + ' in ' + currentCycles + ' cycles';
          messagesBox.scrollTop = messagesBox.scrollHeight;

          if (stagnantCounter > 1) {
              console.log("Stagnant Counter: " + stagnantCounter);
          }

          if (newFitness <= maxFitness) {
              stagnantCounter++;
          } else {
              stagnantCounter = 0;
          }

          setTimeout(runCycle, 0); // schedule the next cycle
      } else {
        var messagesBox = document.querySelector('#messages');
        if(maxFitness < 0.5){
          messagesBox.value += '\nWARNING FITNESS TOO LOW. DO NOT USE THESE CALIBRATION VALUES!';
        }
        messagesBox.value += '\nCalibration complete \nCalibration values:';
        messagesBox.value += '\nMaslow_tlX: ' + initialGuess.tl.x.toFixed(1);
        messagesBox.value += '\nMaslow_tlY: ' + initialGuess.tl.y.toFixed(1);
        messagesBox.value += '\nMaslow_trX: ' + initialGuess.tr.x.toFixed(1);
        messagesBox.value += '\nMaslow_trY: ' + initialGuess.tr.y.toFixed(1);
        messagesBox.value += '\nMaslow_blX: ' + initialGuess.bl.x.toFixed(1);
        messagesBox.value += '\nMaslow_blY: ' + initialGuess.bl.y.toFixed(1);
        messagesBox.value += '\nMaslow_brX: ' + initialGuess.br.x.toFixed(1);
        messagesBox.value += '\nMaslow_brY: ' + initialGuess.br.y.toFixed(1);
        messagesBox.scrollTop
        messagesBox.scrollTop = messagesBox.scrollHeight;
        window.computing = false;
      }
  }

  runCycle(); // start the first cycle


  return initialGuess;
}

//This is where the program really begins. The above is all function definitions
//The way that the progam works is that we basically guess where the four corners are and then
//check to see how good that guess was. To see how good a guess was we "draw" circles from the four corner points
//with radiuses of the measured distances. If the guess was good then all four circles will intersect at a single point.
//The closer the circles are to intersecting at a single point the better the guess is.

//Once we've figured out how good our guess was we try a different guess. We keep the good guesses and throw away the bad guesses
//using a genetic algorithm

calculateTensions(centerX, centerY, initialGuess)

//Un-comment this code to use the simulated measurements

// const randomMeasurementError = 6;
// const constantMeasurementError = 3;
// var measurements = [];
// measurements.push(takeSimulatedMeasurement(centerX,centerY,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX-800,centerY + 400,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX-800,centerY,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX-800,centerY - 400,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX,centerY + 400,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX,centerY - 400,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX + 800,centerY + 400,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX + 800,centerY,randomMeasurementError, constantMeasurementError));
// measurements.push(takeSimulatedMeasurement(centerX + 800,centerY - 400,randomMeasurementError, constantMeasurementError));

/** SavedMeasurements is the "global" measurements used for calibration. */
var SavedMeasurements = [];
  // { bl: 1560.141, br: 2734.873, tr: 2433.119, tl: 883.419 },
  // { bl: 1471.909, br: 2683.675, tr: 2461.234, tl: 956.507 },
  // { bl: 1383.243, br: 2635.983, tr: 2492.822, tl: 1034.411 },
  // { bl: 1295.276, br: 2590.421, tr: 2528.066, tl: 1116.038 },
  // {bl:1210.792,   br:2548.830,   tr:2566.603,   tl:1200.482},
  // {bl:1126.427,   br:2510.942,   tr:2608.576,   tl:1287.002},
  // {bl:1046.081,   br:2476.385,   tr:2653.523,   tl:1375.421},
  // {bl:968.967,   br:2447.814,   tr:2701.411,   tl:1465.449},
  // {bl:895.371,   br:2415.316,   tr:2752.257,   tl:1556.480},
  // {bl:1025.801,   br:2249.586,   tr:2605.334,   tl:1632.330},
  // {bl:1089.195,   br:2279.324,   tr:2551.535,   tl:1546.243},
  // {bl:1157.331,   br:2312.907,   tr:2500.786,   tl:1461.313},
  // {bl:1230.047,   br:2350.481,   tr:2452.903,   tl:1378.344},
  // {bl:1306.512,   br:2391.785,   tr:2408.270,   tl:1297.697},
  // {bl:1386.383,   br:2435.540,   tr:2367.108,   tl:1220.022},
  // {bl:1468.597,   br:2482.805,   tr:2329.333,   tl:1145.787},
  // {bl:1551.947,   br:2533.735,   tr:2295.611,   tl:1075.769},
  // {bl:1634.958,   br:2587.313,   tr:2265.767,   tl:1010.598},
  // {bl:1728.145,   br:2442.730,   tr:2098.714,   tl:1149.872},
  // {bl:1648.569,   br:2386.661,   tr:2130.453,   tl:1207.549},
  // {bl:1570.891,   br:2333.461,   tr:2166.883,   tl:1270.178},
  // {bl:1495.139,   br:2283.130,   tr:2207.264,   tl:1337.410},
  // {bl:1422.099,   br:2235.959,   tr:2251.335,   tl:1408.609},
  // {bl:1353.098,   br:2193.873,   tr:2298.926,   tl:1483.094},
  // {bl:1286.170,   br:2156.136,   tr:2349.820,   tl:1560.493},
  // {bl:1223.028,   br:2122.924,   tr:2403.933,   tl:1640.200},
  // {bl:1166.862,   br:2083.917,   tr:2460.788,   tl:1722.146},
  // {bl:1315.195,   br:1919.338,   tr:2321.692,   tl:1824.686},
  // {bl:1366.049,   br:1953.146,   tr:2261.355,   tl:1748.288},
  // {bl:1421.447,   br:1992.961,   tr:2203.810,   tl:1673.544},
  // {bl:1482.321,   br:2035.583,   tr:2149.463,   tl:1601.580},
  // {bl:1546.732,   br:2082.350,   tr:2098.183,   tl:1532.925},
  // {bl:1613.913,   br:2133.137,   tr:2050.946,   tl:1467.754},
  // {bl:1684.494,   br:2185.872,   tr:2007.277,   tl:1406.677},
  // {bl:1757.250,   br:2242.180,   tr:1967.898,   tl:1350.162},
  // {bl:1832.770,   br:2301.704,   tr:1932.702,   tl:1298.897},
  // {bl:1946.723,   br:2166.676,   tr:1769.127,   tl:1452.641},
  // {bl:1878.595,   br:2104.039,   tr:1806.392,   tl:1498.943},
  // {bl:1810.246,   br:2043.960,   tr:1849.317,   tl:1549.660},
  // {bl:1743.664,   br:1986.833,   tr:1896.564,   tl:1605.308},
  // {bl:1681.212,   br:1932.377,   tr:1947.762,   tl:1665.084},
  // {bl:1622.794,   br:1883.023,   tr:2002.583,   tl:1728.571},
  // {bl:1567.820,   br:1837.771,   tr:2060.805,   tl:1795.234},
  // {bl:1517.503,   br:1796.507,   tr:2122.194,   tl:1865.132},
  // {bl:1471.375,   br:1761.139,   tr:2186.377,   tl:1937.447},
  // {bl:1634.411,   br:1592.062,   tr:2058.424,   tl:2059.036},
  // {bl:1674.032,   br:1633.565,   tr:1990.108,   tl:1991.675},
  // {bl:1719.851,   br:1680.015,   tr:1924.478,   tl:1926.607},
  // {bl:1769.114,   br:1731.473,   tr:1862.048,   tl:1864.367},
  // {bl:1823.390,   br:1786.009,   tr:1802.766,   tl:1805.707},
  // {bl:1880.629,   br:1845.171,   tr:1747.402,   tl:1750.693},
  // {bl:1940.614,   br:1906.219,   tr:1695.987,   tl:1699.785},
  // {bl:2003.563,   br:1970.506,   tr:1649.189,   tl:1653.349},
  // {bl:2068.878,   br:2037.140,   tr:1607.122,   tl:1611.822},
  // {bl:2200.589,   br:1916.372,   tr:1448.891,   tl:1772.941},
  // {bl:2139.036,   br:1845.195,   tr:1494.522,   tl:1811.030},
  // {bl:2079.239,   br:1776.763,   tr:1546.010,   tl:1853.384},
  // {bl:2023.803,   br:1709.998,   tr:1602.073,   tl:1900.086},
  // {bl:1970.343,   br:1646.824,   tr:1662.247,   tl:1950.736},
  // {bl:1920.302,   br:1586.890,   tr:1726.220,   tl:2005.197},
  // {bl:1875.213,   br:1530.346,   tr:1793.396,   tl:2063.086},
  // {bl:1833.670,   br:1478.300,   tr:1863.655,   tl:2124.159},
  // {bl:1796.638,   br:1432.025,   tr:1936.468,   tl:2187.990},
  // {bl:1960.304,   br:1278.271,   tr:1824.665,   tl:2322.787},
  // {bl:1992.856,   br:1330.110,   tr:1747.282,   tl:2263.325},
  // {bl:2031.970,   br:1386.286,   tr:1672.226,   tl:2206.252},
  // {bl:2074.118,   br:1448.005,   tr:1599.910,   tl:2152.207},
  // {bl:2120.323,   br:1514.140,   tr:1530.566,   tl:2101.452},
  // {bl:2169.395,   br:1582.346,   tr:1464.955,   tl:2054.350},
  // {bl:2222.525,   br:1654.466,   tr:1403.102,   tl:2011.226},
  // {bl:2278.323,   br:1727.369,   tr:1346.141,   tl:1972.133},
  // {bl:2336.156,   br:1802.336,   tr:1294.329,   tl:1937.490},
  // {bl:2476.785,   br:1701.694,   tr:1146.413,   tl:2102.654},
  // {bl:2423.263,   br:1622.515,   tr:1203.448,   tl:2134.798},
  // {bl:2370.519,   br:1543.248,   tr:1266.882,   tl:2170.895},
  // {bl:2321.040,   br:1465.953,   tr:1334.756,   tl:2210.970},
  // {bl:2274.754,   br:1391.316,   tr:1406.551,   tl:2254.666},
  // {bl:2231.957,   br:1320.479,   tr:1481.419,   tl:2301.889},
  // {bl:2192.091,   br:1251.742,   tr:1559.309,   tl:2352.587},
  // {bl:2155.932,   br:1188.804,   tr:1639.628,   tl:2406.153},
  // {bl:2124.218,   br:1131.202,   tr:1721.845,   tl:2462.710},
  // {bl:2289.548,   br:992.052,   tr:1633.098,   tl:2606.764},
  // {bl:2318.090,   br:1058.084,   tr:1546.224,   tl:2554.037},
  // {bl:2352.018,   br:1127.769,   tr:1460.926,   tl:2503.489},
  // {bl:2389.037,   br:1201.926,   tr:1377.300,   tl:2455.968},
  // {bl:2428.650,   br:1281.083,   tr:1296.253,   tl:2411.657},
  // {bl:2473.283,   br:1361.113,   tr:1218.022,   tl:2370.777},
  // {bl:2520.680,   br:1443.875,   tr:1142.934,   tl:2333.437},
  // {bl:2570.439,   br:1528.110,   tr:1072.146,   tl:2299.951},
  // {bl:2621.682,   br:1613.040,   tr:1006.344,   tl:2270.363},
  // {bl:2770.967,   br:1541.329,   tr:878.953,   tl:2437.888},
  // {bl:2720.736,   br:1451.503,   tr:952.865,   tl:2465.791},
  // {bl:2673.296,   br:1361.403,   tr:1031.907,   tl:2497.052},
  // {bl:2629.197,   br:1273.123,   tr:1114.285,   tl:2531.945},
  // {bl:2587.745,   br:1187.167,   tr:1199.266,   tl:2570.259},
  // {bl:2549.635,   br:1102.365,   tr:1286.454,   tl:2611.834},
  // {bl:2514.450,   br:1019.056,   tr:1375.496,   tl:2656.550},
  // {bl:2484.029,   br:940.403,   tr:1465.790,   tl:2704.186},
  // {bl:2458.091,   br:866.263,   tr:1557.264,   tl:2754.657},
// ]

//Do projection and scaling
// measurements = scaleMeasurements(measurements, 0.9945);
SavedMeasurements = projectMeasurements(SavedMeasurements)

computeLinesFitness(SavedMeasurements, initialGuess)


/**
 * Flips the y-coordinate of a point to account for the canvas having y at the top.
 * @param {number} y - The y-coordinate to flip.
 * @returns {number} - The flipped y-coordinate.
 */
function flipY(y) {
  var canvas = document.getElementById("CursorLayer");
  return canvas.height - y;
}

function changeStrokeStyle(inputValue) {
  const green = [0, 128, 0]; // RGB values for green
  const red = [255, 0, 0]; // RGB values for red
  const range = 60 - 20; // Range of input values
  const increment = (red.map((value, index) => value - green[index])).map(value => value / range); // Increment for each RGB value

  const color = green.map((value, index) => Math.round(value + increment[index] * (inputValue - 20))); // Calculate the color based on the input value

  const canvas = document.getElementById("CursorLayer");
  const ctx = canvas.getContext("2d");

  ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`; // Set the strokeStyle to the calculated color
}

/**
 * Draws four lines on a canvas element and adds a circle at the end of each line.
 * @param {Object} line1 - An object containing the x and y coordinates of the beginning and end of the first line.
 * @param {Object} line2 - An object containing the x and y coordinates of the beginning and end of the second line.
 * @param {Object} line3 - An object containing the x and y coordinates of the beginning and end of the third line.
 * @param {Object} line4 - An object containing the x and y coordinates of the beginning and end of the fourth line.
 * @returns {void}
 */
function drawLines(line1, line2, line3, line4, guess) {

    //Compute the tensions in the upper two belts
    //const { TL, TR } = calculateTensions(line1.xEnd, line1.yEnd, guess); //This assumes the ends are in the same place which they aren't at first

    var canvas = document.getElementById("CursorLayer");
    var ctx = canvas.getContext("2d");

    // Set the stroke color to a lighter grey
    ctx.strokeStyle = "#999";

    // Draw the four lines
    ctx.setLineDash([5, 5]);

    //Top left line
    ctx.beginPath();
    ctx.moveTo(line1.xBegin / 4, flipY(line1.yBegin / 4));
    ctx.lineTo(line1.xEnd / 4, flipY(line1.yEnd / 4));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(line1.xEnd / 4, flipY(line1.yEnd / 4), 2, 0, 2 * Math.PI);
    ctx.fill();

    //Top right line
    ctx.beginPath();
    ctx.moveTo(line2.xBegin / 4, flipY(line2.yBegin / 4));
    ctx.lineTo(line2.xEnd / 4, flipY(line2.yEnd / 4));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(line2.xEnd / 4, flipY(line2.yEnd / 4), 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(line3.xBegin / 4, flipY(line3.yBegin / 4));
    ctx.lineTo(line3.xEnd / 4, flipY(line3.yEnd / 4));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(line3.xEnd / 4, flipY(line3.yEnd / 4), 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(line4.xBegin / 4, flipY(line4.yBegin / 4));
    ctx.lineTo(line4.xEnd / 4, flipY(line4.yEnd / 4));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(line4.xEnd / 4, flipY(line4.yEnd / 4), 2, 0, 2 * Math.PI);
    ctx.fill();
}

function calibrationTableUpdate() {
  const table = document.querySelector("#caltable");
  if (table.rows.length) {
    for (let i=table.rows.length; i>0;i--) {
      table.deleteRow(0);
    }
  }
  const headr = table.insertRow();
  headr.insertCell(-1).innerText = "Action";
  headr.insertCell(-1).innerText = "Top Left";
  headr.insertCell(-1).innerText = "Top Right";
  headr.insertCell(-1).innerText = "Bottom Right";
  headr.insertCell(-1).innerText = "Bottom Left";
  SavedMeasurements.forEach(
    m => {
      const row = table.insertRow();
      row.insertCell(-1).innerText = "";
      row.insertCell(-1).innerText = "" + m.tl;
      row.insertCell(-1).innerText = "" + m.tr;
      row.insertCell(-1).innerText = "" + m.br;
      row.insertCell(-1).innerText = "" + m.bl;
    }
  )
}