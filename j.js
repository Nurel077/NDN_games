const rainbowColors = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#60a5fa", // blue
  "#c084fc", // purple
]

let draggedBlock = null
let draggedBlockColors = []
let highlightedCells = []
let score = 0
let gameOver = false

function initializeGrid() {
  const gameGrid = document.getElementById("gameGrid")
  gameGrid.innerHTML = ""

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const cell = document.createElement("div")
      cell.className = "grid-cell"
      cell.dataset.row = i
      cell.dataset.col = j

      // Make all cells potential drop zones
      // But we'll validate during drop if a 2x2 block can fit
      cell.classList.add("drop-zone")
      cell.addEventListener("dragover", handleDragOver)
      cell.addEventListener("dragleave", handleDragLeave)
      cell.addEventListener("drop", handleDrop)

      gameGrid.appendChild(cell)
    }
  }

  // Generate new upcoming blocks
  generateUpcomingBlocks()

  // Reset score and game state
  score = 0
  gameOver = false
  updateScore()

  // Hide game over message if it exists
  const gameOverMessage = document.getElementById("gameOverMessage")
  if (gameOverMessage) {
    gameOverMessage.style.display = "none"
  }
}

function generateUpcomingBlocks() {
  const upcomingBlocksContainer = document.getElementById("upcomingBlocks")
  upcomingBlocksContainer.innerHTML = ""

  // Generate 3 random upcoming blocks
  for (let i = 0; i < 3; i++) {
    const block = document.createElement("div")
    block.className = "upcoming-block"
    block.draggable = true
    block.id = "block-" + i

    // Store the colors for this block
    const blockColors = []

    // Each block has 4 cells (2x2)
    for (let j = 0; j < 4; j++) {
      const cell = document.createElement("div")
      cell.className = "upcoming-block-cell"

      // Use rainbow colors for these cells
      const colorIndex = Math.floor(Math.random() * rainbowColors.length)
      const color = rainbowColors[colorIndex]
      cell.style.backgroundColor = color
      blockColors.push(color)

      block.appendChild(cell)
    }

    // Add drag event listeners
    block.addEventListener("dragstart", function (e) {
      if (gameOver) {
        e.preventDefault()
        return
      }

      draggedBlock = this
      draggedBlockColors = blockColors
      this.classList.add("dragging")

      // Required for Firefox
      e.dataTransfer.setData("text/plain", this.id)
      e.dataTransfer.effectAllowed = "move"
    })

    block.addEventListener("dragend", function () {
      this.classList.remove("dragging")
      // Clear any highlighted cells
      clearHighlightedCells()
    })

    upcomingBlocksContainer.appendChild(block)
  }

  // Check if there are any valid moves left
  setTimeout(checkForGameOver, 500)
}

function handleDragOver(e) {
  // Prevent default to allow drop
  e.preventDefault()

  if (gameOver) {
    e.dataTransfer.dropEffect = "none"
    return
  }

  // Get the row and column of the cell being dragged over
  const row = Number.parseInt(this.dataset.row)
  const col = Number.parseInt(this.dataset.col)

  // Clear previous highlighted cells
  clearHighlightedCells()

  // Check if a 2x2 block can fit here (not too close to the right or bottom edge)
  // AND all cells in the 2x2 area are not filled
  if (row < 7 && col < 7 && canPlaceBlockAt(row, col)) {
    // Highlight the 2x2 area
    highlightCells(row, col)
    e.dataTransfer.dropEffect = "move"
  } else {
    // Can't place here, show "no drop" cursor
    e.dataTransfer.dropEffect = "none"
  }
}

function canPlaceBlockAt(row, col) {
  // Check if all cells in the 2x2 area are not filled
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`)
      if (!cell || cell.classList.contains("filled")) {
        return false
      }
    }
  }
  return true
}

function handleDragLeave() {
  // We'll handle clearing highlights in dragOver to avoid flickering
}

function handleDrop(e) {
  e.preventDefault()

  if (gameOver) {
    return
  }

  // Get the row and column of the cell where the block was dropped
  const row = Number.parseInt(this.dataset.row)
  const col = Number.parseInt(this.dataset.col)

  // Clear highlighted cells
  clearHighlightedCells()

  // Check if a 2x2 block can fit here and all cells are not filled
  if (row < 7 && col < 7 && canPlaceBlockAt(row, col) && draggedBlock) {
    // Place the block in the grid
    placeBlockInGrid(row, col, draggedBlockColors)

    // Check for matches after placing the block
    setTimeout(() => {
      checkForMatches()
    }, 100)

    // Remove the dragged block from upcoming blocks
    draggedBlock.remove()
    draggedBlock = null

    // If all blocks are used, generate new ones
    const remainingBlocks = document.querySelectorAll(".upcoming-block")
    if (remainingBlocks.length === 0) {
      generateUpcomingBlocks()
    } else {
      // Check if there are any valid moves left
      setTimeout(checkForGameOver, 500)
    }
  }
}

function highlightCells(row, col) {
  // Highlight a 2x2 area
  highlightedCells = []

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`)
      if (cell && !cell.classList.contains("filled")) {
        cell.classList.add("highlight")
        cell.classList.add("active")
        highlightedCells.push(cell)
      }
    }
  }
}

function clearHighlightedCells() {
  // Remove highlight from all previously highlighted cells
  highlightedCells.forEach((cell) => {
    cell.classList.remove("highlight")
    cell.classList.remove("active")
  })
  highlightedCells = []
}

function placeBlockInGrid(row, col, colors) {
  // Place a 2x2 block starting at the specified row and column
  let colorIndex = 0

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`)

      if (cell && !cell.classList.contains("filled")) {
        // Mark the cell as filled
        cell.classList.add("filled")

        // Clear the cell
        cell.innerHTML = ""

        // Add the colored cell
        const filledCell = document.createElement("div")
        filledCell.className = "filled-cell"
        filledCell.style.backgroundColor = colors[colorIndex]
        filledCell.dataset.color = colors[colorIndex]
        cell.appendChild(filledCell)

        colorIndex++
      }
    }
  }
}

function checkForMatches() {
  const matches = findMatches()

  if (matches.length > 0) {
    // Remove matched cells
    removeMatches(matches)

    // Update score
    score += matches.length * 10
    updateScore()

    // Apply gravity after a short delay
    setTimeout(() => {
      applyGravity()
    }, 500)

    // Check for new matches after gravity is applied
    setTimeout(() => {
      checkForMatches()
    }, 1000)
  } else {
    // Check if there are any valid moves left
    setTimeout(checkForGameOver, 500)
  }
}

function findMatches() {
  const matches = []
  const grid = []
  const visited = Array(8)
    .fill()
    .map(() => Array(8).fill(false))

  // Create a 2D array representing the grid
  for (let i = 0; i < 8; i++) {
    grid[i] = []
    for (let j = 0; j < 8; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${i}"][data-col="${j}"]`)
      const filledCell = cell.querySelector(".filled-cell")
      grid[i][j] = filledCell ? filledCell.dataset.color : null
    }
  }

  // Find connected components using BFS
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if (grid[i][j] && !visited[i][j]) {
        const color = grid[i][j]
        const connectedCells = findConnectedCells(grid, i, j, color, visited)

        // If we have 3 or more connected cells of the same color, add them to matches
        if (connectedCells.length >= 3) {
          matches.push(...connectedCells)
        }
      }
    }
  }

  return matches
}

function findConnectedCells(grid, startRow, startCol, color, visited) {
  const queue = [{ row: startRow, col: startCol }]
  const connectedCells = []

  // Mark the starting cell as visited
  visited[startRow][startCol] = true

  // Directions: up, right, down, left
  const directions = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    connectedCells.push(current)

    // Check all four adjacent cells
    for (const [dx, dy] of directions) {
      const newRow = current.row + dx
      const newCol = current.col + dy

      // Check if the new position is valid and has the same color
      if (
        newRow >= 0 &&
        newRow < 8 &&
        newCol >= 0 &&
        newCol < 8 &&
        grid[newRow][newCol] === color &&
        !visited[newRow][newCol]
      ) {
        visited[newRow][newCol] = true
        queue.push({ row: newRow, col: newCol })
      }
    }
  }

  return connectedCells
}

function removeMatches(matches) {
  matches.forEach((match) => {
    const cell = document.querySelector(`.grid-cell[data-row="${match.row}"][data-col="${match.col}"]`)
    if (cell) {
      // Create explosion effect
      createExplosionEffect(cell)

      // Remove the filled cell
      const filledCell = cell.querySelector(".filled-cell")
      if (filledCell) {
        filledCell.classList.add("explode")

        // Remove after animation
        setTimeout(() => {
          cell.innerHTML = ""
          cell.classList.remove("filled")
        }, 300)
      }
    }
  })
}

function applyGravity() {
  // Process each column from bottom to top
  for (let col = 0; col < 8; col++) {
    // Start from the bottom row
    for (let row = 7; row >= 0; row--) {
      const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`)

      // If this cell is empty, look for the first non-empty cell above it
      if (cell && !cell.classList.contains("filled")) {
        let sourceRow = row - 1

        // Find the first non-empty cell above
        while (sourceRow >= 0) {
          const sourceCell = document.querySelector(`.grid-cell[data-row="${sourceRow}"][data-col="${col}"]`)

          if (sourceCell && sourceCell.classList.contains("filled")) {
            // Move this cell's content down
            moveCell(sourceRow, col, row, col)
            break
          }

          sourceRow--
        }
      }
    }
  }
}

function moveCell(fromRow, fromCol, toRow, toCol) {
  const sourceCell = document.querySelector(`.grid-cell[data-row="${fromRow}"][data-col="${fromCol}"]`)
  const targetCell = document.querySelector(`.grid-cell[data-row="${toRow}"][data-col="${toCol}"]`)

  if (sourceCell && targetCell && sourceCell.classList.contains("filled")) {
    // Get the filled cell from the source
    const filledCell = sourceCell.querySelector(".filled-cell")

    if (filledCell) {
      // Clone the filled cell
      const clonedCell = filledCell.cloneNode(true)

      // Add falling animation class
      clonedCell.classList.add("falling")
      clonedCell.style.setProperty("--fall-distance", `${(toRow - fromRow) * 100}%`)

      // Add to target cell
      targetCell.appendChild(clonedCell)
      targetCell.classList.add("filled")

      // Remove from source cell
      sourceCell.innerHTML = ""
      sourceCell.classList.remove("filled")

      // Remove the animation class after it completes
      setTimeout(() => {
        clonedCell.classList.remove("falling")
      }, 300)
    }
  }
}

function checkForGameOver() {
  // Check if there's any valid place to put a 2x2 block
  let validMoveExists = false

  // Check each possible position for a 2x2 block
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (canPlaceBlockAt(row, col)) {
        validMoveExists = true
        break
      }
    }
    if (validMoveExists) break
  }

  // If no valid moves exist, game over
  if (!validMoveExists) {
    gameOver = true
    showGameOver()
  }
}

function showGameOver() {
  // Check if game over message already exists
  let gameOverMessage = document.getElementById("gameOverMessage")

  if (!gameOverMessage) {
    // Create game over message
    gameOverMessage = document.createElement("div")
    gameOverMessage.id = "gameOverMessage"
    gameOverMessage.className = "game-over-message"

    const messageContent = document.createElement("div")
    messageContent.className = "game-over-content"

    const title = document.createElement("h2")
    title.textContent = "Game Over!"

    const finalScore = document.createElement("p")
    finalScore.textContent = `Final Score: ${score}`

    const restartButton = document.createElement("button")
    restartButton.textContent = "Play Again"
    restartButton.className = "restart-button"
    restartButton.addEventListener("click", initializeGrid)

    messageContent.appendChild(title)
    messageContent.appendChild(finalScore)
    messageContent.appendChild(restartButton)
    gameOverMessage.appendChild(messageContent)

    // Add to game container
    const gameContainer = document.querySelector(".game-container")
    gameContainer.appendChild(gameOverMessage)
  } else {
    // Update existing game over message
    const finalScore = gameOverMessage.querySelector("p")
    finalScore.textContent = `Final Score: ${score}`
    gameOverMessage.style.display = "flex"
  }
}

function createExplosionEffect(cell) {
  // Create particles for explosion effect
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement("div")
    particle.className = "particle"

    // Random position within the cell
    const x = Math.random() * 20 - 10
    const y = Math.random() * 20 - 10

    // Random color from our palette
    const colorIndex = Math.floor(Math.random() * rainbowColors.length)

    particle.style.backgroundColor = rainbowColors[colorIndex]
    particle.style.left = `calc(50% + ${x}px)`
    particle.style.top = `calc(50% + ${y}px)`

    cell.appendChild(particle)

    // Remove particle after animation
    setTimeout(() => {
      if (cell.contains(particle)) {
        cell.removeChild(particle)
      }
    }, 500)
  }
}

function updateScore() {
  const scoreElement = document.getElementById("score")
  if (scoreElement) {
    scoreElement.textContent = score
  }
}

// Initialize the grid and upcoming blocks when the page loads
window.onload = () => {
  initializeGrid()

  // Add rainbow animation to the title
  const title = document.querySelector("h1")
  if (title) {
    title.classList.add("rainbow-text")
  }
}

