const fs = require('fs')

const SQUARE = '■'
const CROSS = 'X'
const EMPTY = ' '

function getMinSize(numbers) {
    return numbers.reduce((acc, x) => acc + x, 0) + numbers.length - 1
}

function displayGrid(grid, noCross = false) {
    let result = ''

    grid.forEach(line => {
        result += line.map(x => {
            if (noCross) return x === CROSS ? EMPTY : x
            return x
        }).map(x => `[${x}]`).join('') + '\n'
    })

    console.log(result)
}

function applyLineToGridLine(grid, lineIndex, line) {
    line.forEach((value, index) => {
        if (value === SQUARE || value === CROSS) {
            grid[lineIndex][index] = line[index]
        }
    })
}

function applyLineToGridColumn(grid, columnIndex, line) {
    line.forEach((value, index) => {
        if (value === SQUARE || value === CROSS) {
            grid[index][columnIndex] = line[index]
        }
    })
}

function generateLinesRec(lines, size, numbers, line, initOffset) {
    if (numbers.length === 0) {
        lines.push(line)
        return
    }

    const minSize = getMinSize(numbers)
    const maxOffset = (size - initOffset) - minSize

    for (let offset = initOffset; offset <= initOffset + maxOffset; offset++) {
        const value = numbers[0]
        const lineCopy = line.slice()

        for (let i = offset; i < offset + value; i++) {
            lineCopy[i] = SQUARE
        }

        const nextOffset = offset + value + 1
        generateLinesRec(lines, size, numbers.slice(1), lineCopy, nextOffset)
    }
}

function generateLines(size, numbers) {
    const lines = []
    
    const emptyLine = []
    for (let i = 0; i < size; i++) {
        emptyLine.push(EMPTY)
    }

    generateLinesRec(lines, size, numbers, emptyLine, 0)

    return lines
}

function combineLines(size, lines) {
    const result = []
    
    for (let i = 0; i < size; i++) {
        const sameIndexValues = lines.map(line => line[i])

        if (lines.length > 0 && sameIndexValues.every(x => x === SQUARE)) {
            result.push(SQUARE)
        } else if (lines.length > 0 && sameIndexValues.every(x => x === EMPTY)) {
            result.push(CROSS)
        } else {
            result.push(EMPTY)
        }
    }

    return result
}

function analyseLine(line, numbers) {
    const lines = generateLines(line.length, numbers)
    return combineLines(line.length, lines)
}

function isGeneratedLineCompatible(currentLine, generatedLine) {
    for (let i = 0; i < currentLine.length; i++) {
        const currentValue = currentLine[i]
        const generatedValue = generatedLine[i]
        if (generatedValue === SQUARE && currentValue === CROSS) {
            return false
        }
        if (generatedValue === EMPTY && currentValue === SQUARE) {
            return false
        }
    }
    return true
}

function analyseLineWithFilter(line, numbers) {
    const lines = generateLines(line.length, numbers)
    const filteredLines = lines.filter(generatedLine => isGeneratedLineCompatible(line, generatedLine))
    return combineLines(line.length, filteredLines)
}

function fillStarterInLine(line, numbers) {
    const lineCopy = line.slice()
    const firstNumber = numbers[0]
    if (lineCopy[0] === SQUARE) {
        for (let i = 0; i < firstNumber; i++) {
            lineCopy[i] = SQUARE
        }
        lineCopy[firstNumber] = CROSS
    }
    return lineCopy
}

function areAllGroupsFormed(line, numbers) {
    let remainingNumbers = numbers.slice()
    let groupLength = 0

    for (let i = 0; i < line.length; i++) {
        const value = line[i]
        if (value === SQUARE) {
            groupLength++
        } else {
            if (groupLength > 0) {
                const firstNumber = remainingNumbers[0]
                if (groupLength !== firstNumber) {
                    return false
                }
                remainingNumbers = remainingNumbers.slice(1)
                groupLength = 0
            }
        }
    }

    if (remainingNumbers.length > 1) return false
    if (remainingNumbers.length === 1 && remainingNumbers[0] !== groupLength) return false

    return true
}

function solveEasyLine(line, numbers) {
    const lineCopy = line.slice()

    if (numbers.length === 1 && numbers[0] === 0) {
        lineCopy.forEach((_, index) => {
            lineCopy[index] = CROSS
        })
        return lineCopy
    }

    if (numbers.length === 1 && numbers[0] === line.length) {
        lineCopy.forEach((_, index) => {
            lineCopy[index] = SQUARE
        })
        return lineCopy
    }

    if (getMinSize(numbers) === lineCopy.length) {
        const analysedLine = analyseLine(lineCopy.length, numbers)
        analysedLine.forEach((value, index) => {
            if (value !== SQUARE) {
                analysedLine[index] = CROSS
            }
        })
        return analysedLine
    }

    if (areAllGroupsFormed(lineCopy, numbers)) {
        lineCopy.forEach((value, index) => {
            if (value !== SQUARE) {
                lineCopy[index] = CROSS
            }
        })
        return lineCopy
    }

    return lineCopy
}

function applyFunctionOnGridLines(picross, grid, functionToApply, withReverse = false) {
    const resultGrid = structuredClone(grid)

    for (let lineIndex = 0; lineIndex < picross.size; lineIndex++) {
        const line = resultGrid[lineIndex]
        const lineNumbers = picross.linesNumbers[lineIndex]

        const filledLine = functionToApply(line, lineNumbers)
        applyLineToGridLine(resultGrid, lineIndex, filledLine)

        if (withReverse) {
            const reversedFilledLine = functionToApply(line.slice().reverse(), lineNumbers.slice().reverse())
            applyLineToGridLine(resultGrid, lineIndex, reversedFilledLine.reverse())
        }
    }

    for (let columnIndex = 0; columnIndex < picross.size; columnIndex++) {
        const column = resultGrid.map(line => line[columnIndex])
        const columnNumbers = picross.columnsNumbers[columnIndex]

        const filledColumn = functionToApply(column, columnNumbers)
        applyLineToGridColumn(resultGrid, columnIndex, filledColumn)

        if (withReverse) {
            const reversedFilledColumn = functionToApply(column.slice().reverse(), columnNumbers.slice().reverse())
            applyLineToGridColumn(resultGrid, columnIndex, reversedFilledColumn.reverse())
        }
    }

    return resultGrid
}

function isGridFull(grid) {
    return grid.every(line => line.every(value => value !== EMPTY))
}

function idGridValid(picross, grid) {
    if (!isGridFull(grid)) return false

    for (let lineIndex = 0; lineIndex < picross.size; lineIndex++) {
        const line = grid[lineIndex]
        const lineNumbers = picross.linesNumbers[lineIndex]

        if (!areAllGroupsFormed(line, lineNumbers)) {
            return false
        }
    }

    for (let columnIndex = 0; columnIndex < picross.size; columnIndex++) {
        const column = grid.map(line => line[columnIndex])
        const columnNumbers = picross.columnsNumbers[columnIndex]
        
        if (!areAllGroupsFormed(column, columnNumbers)) {
            return false
        }
    }

    return true
}

function solve(picross, grid) {
    let resultGrid = structuredClone(grid)
    
    while(!idGridValid(picross, resultGrid)) {
        resultGrid = applyFunctionOnGridLines(picross, resultGrid, analyseLineWithFilter)
        resultGrid = applyFunctionOnGridLines(picross, resultGrid, fillStarterInLine, true)
        resultGrid = applyFunctionOnGridLines(picross, resultGrid, solveEasyLine)

        displayGrid(resultGrid)
    }

    return resultGrid
}

function initGrid(picross) {
    const grid = []

    for (let i = 0; i < picross.size; i++) {
        grid.push([])
        for (let j = 0; j < picross.size; j++) {
            const value = picross.initialGrid ? picross.initialGrid[i][j] : EMPTY
            grid[i].push(value)
        }
    }

    return grid
}

function run() {
    const file = process.argv[2]
    const fileContent = fs.readFileSync(file, 'utf8')
    const picross = JSON.parse(fileContent)

    const grid = initGrid(picross)

    const solvedGrid = solve(picross, grid)

    console.log('Result :')
    displayGrid(solvedGrid, true)
}

run()
