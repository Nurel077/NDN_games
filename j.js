const rainbowColors = [
  "#f87171", // red
  "#fb923c", // orange
  "#facc15", // yellow
  "#4ade80", // green
  "#60a5fa", // blue
  "#c084fc"  // purple
];

let draggedBlock = null;
let draggedBlockColors = [];
let highlightedCells = [];
let score = 0;
let gameOver = false;
let currentCombo = 0;
let isComboActive = false;
let placedBlocksCount = 0;
let hasExplosionInRound = false;
let megaComboActive = false;
let allBlocksExploded = false;
let currentMatchGroups = [];
let currentDraggedColors = null;

/**
 * Инициализация игры
 * Создает игровое поле и начальные блоки
 */
function initializeGame() {
  // Reset game state
  score = 0;
  gameOver = false;
  placedBlocksCount = 0;
  currentCombo = 0;
  hasExplosionInRound = false;
  currentDraggedColors = null;
  
  // Initialize the grid first
  initializeGrid();
  
  // Create game container if it doesn't exist
  let gameContainer = document.querySelector('.game-container');
  if (!gameContainer) {
    gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    document.body.appendChild(gameContainer);
  }
  
  // Create grid container if it doesn't exist
  let gridContainer = gameContainer.querySelector('.game-grid');
  if (!gridContainer) {
    gridContainer = document.createElement('div');
    gridContainer.className = 'game-grid';
    gameContainer.appendChild(gridContainer);
  }
  
  // Create or update the upcoming blocks container
  let upcomingContainer = gameContainer.querySelector('.upcoming-blocks-container');
  if (!upcomingContainer) {
    upcomingContainer = document.createElement('div');
    upcomingContainer.className = 'upcoming-blocks-container';
    gameContainer.appendChild(upcomingContainer);
  }
  
  // Create score display if it doesn't exist
  let scoreDisplay = gameContainer.querySelector('.score-display');
  if (!scoreDisplay) {
    scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'score-display';
    scoreDisplay.innerHTML = '<span>Score: </span><span id="score">0</span>';
    gameContainer.appendChild(scoreDisplay);
  }
  
  // Update score display
  updateScore();
  
  // Generate initial blocks
  generateUpcomingBlocks();
}

/**
 * Создание игровой сетки 8x8
 * Очищает предыдущее состояние и создает новую сетку
 */
function initializeGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = '';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      cell.addEventListener('dragover', handleDragOver);
      cell.addEventListener('dragleave', handleDragLeave);
      cell.addEventListener('drop', handleDrop);
      
      grid.appendChild(cell);
    }
  }
  
  score = 0;
  updateScore();
  gameOver = false;
  placedBlocksCount = 0;
  
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }
}

/**
 * Генерация трех новых блоков 2x2
 * Создает блоки случайных цветов для размещения
 */
function generateUpcomingBlocks() {
  const colors = ['#FF69B4', '#FF4500', '#9370DB', '#32CD32', '#FFD700'];
  const container = document.querySelector('.upcoming-blocks-container');
  
  if (!container) return;
  
  // Clear existing blocks
  container.innerHTML = '';
  
  // Generate three new blocks
  for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
    // Create block container
    const block = document.createElement('div');
    block.className = 'upcoming-block';
    block.draggable = true;
    
    // Create 2x2 grid container
    const blockGrid = document.createElement('div');
    blockGrid.className = 'upcoming-block-grid';
    
    // Generate random colors for the 2x2 block
    const blockColors = Array(4).fill().map(() => 
      colors[Math.floor(Math.random() * colors.length)]
    );
    
    // Create cells with colors
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        cell.style.backgroundColor = blockColors[i * 2 + j];
        blockGrid.appendChild(cell);
      }
    }
    
    // Add drag event listeners
    block.addEventListener('dragstart', handleDragStart);
    block.addEventListener('dragend', handleDragEnd);
    
    // Assemble the block
    block.appendChild(blockGrid);
    container.appendChild(block);
  }
}

/**
 * Обработчик начала перетаскивания блока
 * Сохраняет цвета текущего блока и добавляет класс dragging
 */
function handleDragStart(e) {
  const block = e.target.closest('.upcoming-block');
  if (!block) return;
  
  // Add dragging class for visual feedback
  block.classList.add('dragging');
  
  // Store the colors of the block being dragged
  currentDraggedColors = Array.from(block.querySelectorAll('.upcoming-block-cell'))
    .map(cell => cell.style.backgroundColor);
    
  // Set drag image
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(block, block.offsetWidth / 2, block.offsetHeight / 2);
  }
}

/**
 * Обработчик перетаскивания над ячейкой
 * Показывает область размещения блока 2x2
 */
function handleDragOver(e) {
  e.preventDefault();
  
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  
  clearHighlights();
  
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  
  const canPlace = canPlaceBlockAt(row, col);
  highlightPlacementArea(row, col, canPlace);
}

/**
 * Обработчик выхода за пределы ячейки
 * Убирает подсветку области размещения
 */
function handleDragLeave(e) {
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  clearHighlights();
}

/**
 * Очистка подсветки всех ячеек
 * Убирает классы valid-drop и invalid-drop
 */
function clearHighlights() {
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('valid-drop', 'invalid-drop');
  });
}

/**
 * Подсветка области 2x2 для размещения блока
 * Показывает зеленым если можно разместить, красным если нельзя
 */
function highlightPlacementArea(row, col, isValid) {
  for (let r = row; r < row + 2 && r < 8; r++) {
    for (let c = col; c < col + 2 && c < 8; c++) {
      const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
      if (cell) {
        cell.classList.add(isValid ? 'valid-drop' : 'invalid-drop');
      }
    }
  }
}

/**
 * Проверка возможности размещения блока 2x2
 * Проверяет границы и наличие свободного места
 */
function canPlaceBlockAt(row, col) {
  if (row < 0 || row >= 8 || col < 0 || col >= 8) return false;
  
  for (let r = row; r < row + 2; r++) {
    for (let c = col; c < col + 2; c++) {
      const cell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${c}"]`);
      if (!cell || cell.querySelector('.filled-cell')) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Обработчик размещения блока
 * Использует сохраненные цвета для размещения
 */
function handleDrop(event) {
  event.preventDefault();
  clearHighlights();
  
  const targetCell = event.target.closest('.grid-cell');
  if (!targetCell || gameOver) return;
  
  const block = document.querySelector('.upcoming-block.dragging');
  if (!block || !currentDraggedColors) return;
  
  const row = parseInt(targetCell.dataset.row);
  const col = parseInt(targetCell.dataset.col);
  
  if (!canPlaceBlockAt(row, col)) {
    showInvalidPlacement();
    return;
  }
  
  // Place the block
  placeBlockInGrid(row, col, currentDraggedColors);
  
  // Remove the dragged block and update counters
  block.remove();
  currentDraggedColors = null;
  placedBlocksCount++;
  
  // Update score for placing a block
  score += 50;
  updateScore();
  
  // Check for matches after a delay
  setTimeout(() => {
    checkForMatches();
  }, 300);
  
  // Generate new blocks if all current blocks are placed
  if (placedBlocksCount >= 3) {
    const upcomingBlocksContainer = document.querySelector('.upcoming-blocks-container');
    if (!upcomingBlocksContainer || upcomingBlocksContainer.children.length === 0) {
      placedBlocksCount = 0;
      hasExplosionInRound = false;
      generateUpcomingBlocks();
    }
  }
}

function placeBlockInGrid(row, col, colors) {
  let colorIndex = 0;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`);
      if (cell) {
        const filledCell = document.createElement('div');
        filledCell.className = 'filled-cell';
        filledCell.style.backgroundColor = colors[colorIndex];
        
        // Remove any existing filled cell
        const existingFilledCell = cell.querySelector('.filled-cell');
        if (existingFilledCell) {
          existingFilledCell.remove();
        }
        
        // Add animation class
        filledCell.style.transform = 'scale(0)';
        cell.appendChild(filledCell);
        
        // Trigger animation
        setTimeout(() => {
          filledCell.style.transform = 'scale(1)';
        }, 50 * colorIndex);
        
        colorIndex++;
      }
    }
  }
}

function highlightCells(row, col) {
  highlightedCells = [];
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cell = document.querySelector(`.grid-cell[data-row="${row + i}"][data-col="${col + j}"]`);
      if (cell && !cell.classList.contains("filled")) {
        cell.classList.add("highlight");
        cell.classList.add("active");
        highlightedCells.push(cell);
      }
    }
  }
}

function clearHighlightedCells() {
  highlightedCells.forEach((cell) => {
    cell.classList.remove("highlight");
    cell.classList.remove("active");
  });
  highlightedCells = [];
}

/**
 * Поиск совпадающих блоков
 * Ищет группы из 3+ соединенных блоков одного цвета
 * Возвращает массив групп совпадений
 */
function findMatches() {
  const matchGroups = [];
  const visited = Array(8).fill().map(() => Array(8).fill(false));
  
  // Функция для проверки соседних блоков того же цвета
  function checkConnectedBlocks(row, col, color) {
    const connected = [];
    const queue = [{row, col}];
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited[current.row][current.col]) continue;
      
      visited[current.row][current.col] = true;
      connected.push(current);
      
      // Проверяем все соседние блоки (вверх, вправо, вниз, влево)
      const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      
      for (const [dx, dy] of directions) {
        const newRow = current.row + dx;
        const newCol = current.col + dy;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !visited[newRow][newCol]) {
          const nextCell = document.querySelector(`.grid-cell[data-row="${newRow}"][data-col="${newCol}"]`);
          const nextFilledCell = nextCell?.querySelector('.filled-cell');
          
          if (nextFilledCell && nextFilledCell.style.backgroundColor === color) {
            queue.push({row: newRow, col: newCol});
          }
        }
      }
    }
    
    // Если найдено 3 или больше соединенных блоков одного цвета
    if (connected.length >= 3) {
      matchGroups.push({
        color: color,
        cells: connected
      });
    }
  }
  
  // Проверяем каждую ячейку на наличие соединенных блоков
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (!visited[row][col]) {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        const filledCell = cell?.querySelector('.filled-cell');
        
        if (filledCell) {
          checkConnectedBlocks(row, col, filledCell.style.backgroundColor);
        }
      }
    }
  }
  
  return matchGroups;
}

/**
 * Удаление совпавших блоков
 * Создает эффект взрыва и удаляет блоки
 */
function removeMatches(matches) {
  matches.forEach(({ row, col }) => {
    const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
    const filledCell = cell?.querySelector('.filled-cell');
    if (filledCell) {
      filledCell.classList.add('explode');
      setTimeout(() => {
        filledCell.remove();
      }, 300);
    }
  });
}

/**
 * Применение гравитации
 * Заставляет блоки падать вниз в пустые ячейки
 */
function applyGravity() {
  let moved = false;
  
  for (let col = 0; col < 8; col++) {
    for (let row = 7; row >= 0; row--) {
      const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
      if (!cell?.querySelector('.filled-cell')) {
        for (let r = row - 1; r >= 0; r--) {
          const upperCell = document.querySelector(`.grid-cell[data-row="${r}"][data-col="${col}"]`);
          const filledCell = upperCell?.querySelector('.filled-cell');
          if (filledCell) {
            const fallDistance = (row - r) * 100;
            filledCell.style.setProperty('--fall-distance', `${fallDistance}%`);
            filledCell.classList.add('falling');
            
            cell.appendChild(filledCell);
            moved = true;
            
            setTimeout(() => {
              filledCell.classList.remove('falling');
            }, 300);
            break;
          }
        }
      }
    }
  }
  
  return moved;
}

/**
 * Перемещение блока между ячейками
 * Используется для анимации падения
 */
function moveCell(fromRow, fromCol, toRow, toCol) {
  const sourceCell = document.querySelector(`.grid-cell[data-row="${fromRow}"][data-col="${fromCol}"]`);
  const targetCell = document.querySelector(`.grid-cell[data-row="${toRow}"][data-col="${toCol}"]`);
  const filledCell = sourceCell.querySelector('.filled-cell');
  
  if (filledCell && targetCell) {
    const fallDistance = (toRow - fromRow) * 100;
    filledCell.style.setProperty('--fall-distance', `${fallDistance}%`);
    filledCell.classList.add('falling');
    
    targetCell.appendChild(filledCell);
    
    setTimeout(() => {
      filledCell.classList.remove('falling');
    }, 300);
    
    return true;
  }
  return false;
}

/**
 * Проверка совпадений после размещения блока
 * Обрабатывает комбо и мега-комбо
 */
function checkForMatches() {
  const matchGroups = findMatches();
  
  if (matchGroups.length > 0) {
    hasExplosionInRound = true;
    let totalPoints = 0;
    
    matchGroups.forEach((group, index) => {
      const comboMultiplier = Math.pow(2, currentCombo);
      const groupPoints = group.cells.length * 100 * comboMultiplier;
      totalPoints += groupPoints;
      
      const centerCell = findCenterCell(group.cells);
      showComboEffect(groupPoints, centerCell, group.color);
      
      group.cells.forEach(({row, col}) => {
        const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
        const filledCell = cell?.querySelector('.filled-cell');
        if (filledCell) {
          createExplosionEffect(cell);
          filledCell.classList.add('explode');
          setTimeout(() => filledCell.remove(), 300);
        }
      });
    });
    
    currentCombo++;
    score += totalPoints;
    updateScore();
    
    setTimeout(() => {
      if (applyGravity()) {
        setTimeout(checkForMatches, 300);
      } else {
        currentCombo = 0;
        checkForGameOver();
      }
    }, 300);
  } else {
    currentCombo = 0;
    checkForGameOver();
    
    // Check if we need to generate new blocks
    const upcomingBlocksContainer = document.querySelector('.upcoming-blocks-container');
    if (!upcomingBlocksContainer || upcomingBlocksContainer.children.length === 0) {
      generateUpcomingBlocks();
    }
  }
}

function findCenterCell(cells) {
  let sumRow = 0, sumCol = 0;
  cells.forEach(cell => {
    sumRow += cell.row;
    sumCol += cell.col;
  });
  const centerRow = Math.round(sumRow / cells.length);
  const centerCol = Math.round(sumCol / cells.length);
  
  let centerCell = cells[0];
  let minDistance = Number.MAX_VALUE;
  cells.forEach(cell => {
    const distance = Math.pow(cell.row - centerRow, 2) + Math.pow(cell.col - centerCol, 2);
    if (distance < minDistance) {
      minDistance = distance;
      centerCell = cell;
    }
  });
  
  return centerCell;
}

/**
 * Создание эффекта взрыва
 * Генерирует частицы цвета взорвавшегося блока
 */
function createExplosionEffect(cell) {
  const filledCell = cell.querySelector('.filled-cell');
  const color = filledCell ? filledCell.style.backgroundColor : '#ffffff';
  
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    // Случайное направление для частиц
    const angle = (Math.random() * Math.PI * 2);
    const distance = 20 + Math.random() * 30;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    
    particle.style.backgroundColor = color;
    particle.style.left = `calc(50% + ${x}px)`;
    particle.style.top = `calc(50% + ${y}px)`;
    
    // Добавляем случайное вращение
    particle.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    
    cell.appendChild(particle);
    
    setTimeout(() => {
      if (cell.contains(particle)) {
        cell.removeChild(particle);
      }
    }, 500);
  }
}

/**
 * Показ эффекта комбо
 * Отображает текст и анимацию для комбо
 */
function showComboEffect(points, centerCell, color) {
  const gameContainer = document.querySelector(".game-container");
  const comboText = document.createElement("div");
  comboText.className = "combo-text";
  
  // Добавляем текст комбо с множителем
  if (currentCombo > 1) {
    comboText.textContent = `${currentCombo}x COMBO!`;
  }
  
  // Устанавливаем позицию текста комбо
  const cell = document.querySelector(`.grid-cell[data-row="${centerCell.row}"][data-col="${centerCell.col}"]`);
  const cellRect = cell.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  
  comboText.style.left = `${cellRect.left - containerRect.left + cell.offsetWidth/2}px`;
  comboText.style.top = `${cellRect.top - containerRect.top + cell.offsetHeight/2}px`;
  comboText.style.setProperty("--combo-color", color);
  
  // Добавляем эффекты для комбо
  const wave = document.createElement("div");
  wave.className = "combo-wave";
  wave.style.setProperty("--combo-color", color);
  comboText.appendChild(wave);
  
  // Добавляем искры для высоких комбо
  if (currentCombo >= 3) {
    for (let i = 0; i < currentCombo * 3; i++) {
      const spark = document.createElement("div");
      spark.className = "combo-spark";
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 50;
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
      spark.style.animationDelay = `${Math.random() * 0.2}s`;
      comboText.appendChild(spark);
    }
  }
  
  gameContainer.appendChild(comboText);
  
  // Показываем очки с небольшой задержкой
  setTimeout(() => {
    const pointsText = document.createElement("div");
    pointsText.className = "points-text";
    pointsText.textContent = `+${points}`;
    pointsText.style.left = comboText.style.left;
    pointsText.style.top = `${parseInt(comboText.style.top) + 30}px`;
    pointsText.style.setProperty("--combo-color", color);
    gameContainer.appendChild(pointsText);
    
    setTimeout(() => {
      pointsText.classList.add("fade-out");
      setTimeout(() => {
        if (gameContainer.contains(pointsText)) {
          gameContainer.removeChild(pointsText);
        }
      }, 300);
    }, 1000);
  }, 200);
  
  // Удаляем текст комбо
  setTimeout(() => {
    comboText.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(comboText)) {
        gameContainer.removeChild(comboText);
      }
    }, 300);
  }, 1000);
}

/**
 * Показ эффекта мега-комбо
 * Отображает специальную анимацию для мега-комбо
 */
function showMegaComboEffect(points) {
  const gameContainer = document.querySelector(".game-container");
  const megaComboText = document.createElement("div");
  megaComboText.className = "mega-combo-text";
  megaComboText.textContent = "MEGA COMBO!";
  
  const pointsContainer = document.createElement("div");
  pointsContainer.className = "mega-combo-points";
  pointsContainer.textContent = `+${points}`;
  
  const containerRect = gameContainer.getBoundingClientRect();
  megaComboText.style.left = `${containerRect.width / 2}px`;
  megaComboText.style.top = `${containerRect.height / 2 - 50}px`;
  pointsContainer.style.left = `${containerRect.width / 2}px`;
  pointsContainer.style.top = `${containerRect.height / 2 + 50}px`;
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement("div");
    particle.className = "mega-combo-particle";
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 100 + Math.random() * 100;
    particle.style.setProperty("--angle", angle + "rad");
    particle.style.setProperty("--distance", distance + "px");
    particle.style.backgroundColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    megaComboText.appendChild(particle);
  }
  
  gameContainer.appendChild(megaComboText);
  gameContainer.appendChild(pointsContainer);
  
  setTimeout(() => {
    megaComboText.classList.add("fade-out");
    pointsContainer.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(megaComboText)) {
        gameContainer.removeChild(megaComboText);
      }
      if (gameContainer.contains(pointsContainer)) {
        gameContainer.removeChild(pointsContainer);
      }
    }, 1000);
  }, 2000);
}

/**
 * Показ эффекта прерывания мега-комбо
 * Отображает анимацию при неудачном мега-комбо
 */
function showMegaComboBreakEffect() {
  const gameContainer = document.querySelector(".game-container");
  const breakText = document.createElement("div");
  breakText.className = "mega-combo-break-text";
  breakText.textContent = "PERFECT BLAST!";
  gameContainer.appendChild(breakText);

  for (let i = 0; i < 40; i++) {
    const spark = document.createElement("div");
    spark.className = "mega-combo-particle";
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const distance = 150 + Math.random() * 150;
    spark.style.setProperty("--angle", angle + "rad");
    spark.style.setProperty("--distance", distance + "px");
    spark.style.animationDelay = `${Math.random() * 0.5}s`;
    breakText.appendChild(spark);
  }

  setTimeout(() => {
    breakText.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(breakText)) {
        gameContainer.removeChild(breakText);
      }
    }, 1000);
  }, 1500);
}

/**
 * Проверка окончания игры
 * Проверяет возможность размещения новых блоков
 */
function checkForGameOver() {
  let hasValidMove = false;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (canPlaceBlockAt(row, col)) {
        hasValidMove = true;
        break;
      }
    }
    if (hasValidMove) break;
  }

  if (!hasValidMove) {
    gameOver = true;
    showGameOver();
  }
}

/**
 * Показ экрана окончания игры
 * Отображает финальный счет и кнопку перезапуска
 */
function showGameOver() {
  let gameOverMessage = document.getElementById("gameOverMessage");
  if (!gameOverMessage) {
    gameOverMessage = document.createElement("div");
    gameOverMessage.id = "gameOverMessage";
    gameOverMessage.className = "game-over-message";
    const messageContent = document.createElement("div");
    messageContent.className = "game-over-content";
    const title = document.createElement("h2");
    title.textContent = "Game Over!";
    const finalScore = document.createElement("p");
    finalScore.textContent = `Final Score: ${score}`;
    const restartButton = document.createElement("button");
    restartButton.textContent = "Play Again";
    restartButton.className = "restart-button";
    restartButton.addEventListener("click", restartGame);
    messageContent.appendChild(title);
    messageContent.appendChild(finalScore);
    messageContent.appendChild(restartButton);
    gameOverMessage.appendChild(messageContent);
    const gameContainer = document.querySelector(".game-container");
    gameContainer.appendChild(gameOverMessage);
  } else {
    const finalScore = gameOverMessage.querySelector("p");
    finalScore.textContent = `Final Score: ${score}`;
    gameOverMessage.style.display = "flex";
  }
}

/**
 * Обновление счета
 * Обновляет отображение счета с анимацией
 */
function updateScore() {
  const scoreElement = document.getElementById("score");
  if (scoreElement) {
    scoreElement.textContent = score;
    scoreElement.classList.add("score-pulse");
    setTimeout(() => {
      scoreElement.classList.remove("score-pulse");
    }, 300);
  }
}

/**
 * Перезапуск игры
 * Сбрасывает все параметры и начинает новую игру
 */
function restartGame() {
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }
  
  score = 0;
  gameOver = false;
  placedBlocksCount = 0;
  comboCount = 0;
  
  initializeGame();
}

function handleDragEnd(e) {
  const block = e.target.closest('.upcoming-block');
  if (block) {
    block.classList.remove('dragging');
  }
  clearHighlights();
}

// Call addStyles when the game initializes
window.addEventListener('load', () => {
  initializeGame();
});

