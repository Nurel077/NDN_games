// Константы игры
const GRID_SIZE = 8;
const MIN_MATCH = 3;
const COMBO_TIMEOUT = 1000;
const GRAVITY_DELAY = 300;

// Цвета для блоков
const COLORS = [
  { color: '#FF4500', weight: 25 }, // Оранжевый
  { color: '#32CD32', weight: 25 }, // Зеленый
  { color: '#9370DB', weight: 25 }, // Фиолетовый
  { color: '#FFD700', weight: 25 }, // Желтый
  { color: '#FF69B4', weight: 25 }  // Розовый
];

// Состояние игры
let draggedBlock = null;
let draggedBlockColors = [];
let highlightedCells = [];
let score = 0;
let gameOver = false;
let currentCombo = 0;
let comboTimeout = null;
let isGravityActive = false;
let placedBlocksCount = 0;
let hasExplosionInRound = false;
let megaComboActive = false;
let allBlocksExploded = false;
let currentMatchGroups = [];
let currentDraggedColors = null;
let lastComboTime = 0;

/**
 * Инициализация игры
 * Создает игровое поле и начальные блоки
 */
function initializeGame() {
  // Сброс состояния
  score = 0;
  gameOver = false;
  currentCombo = 0;
  if (comboTimeout) clearTimeout(comboTimeout);
  
  // Очистка и создание сетки
  const grid = document.querySelector('.game-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  // Создание ячеек
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
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
  
  // Генерация начальных блоков
  generateUpcomingBlocks();
  
  // Обновление отображения
  updateScore();
  
  // Удаление старого сообщения об окончании игры
  const gameOverMessage = document.querySelector('.game-over-message');
  if (gameOverMessage) {
    gameOverMessage.remove();
  }
}

/**
 * Получение случайного цвета
 */
function getRandomColor(usedColors = []) {
  // Фильтруем цвета, которые уже использованы 2 раза
  const colorCounts = {};
  usedColors.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  
  const availableColors = COLORS.filter(item => 
    !colorCounts[item.color] || colorCounts[item.color] < 2
  );
  
  if (availableColors.length === 0) {
    return COLORS[Math.floor(Math.random() * COLORS.length)].color;
  }
  
  const totalWeight = availableColors.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of availableColors) {
    if (random < item.weight) return item.color;
    random -= item.weight;
  }
  
  return availableColors[0].color;
}

/**
 * Генерация L-образного блока (с случайным поворотом)
 */
function generateLShapedBlock(blockColors) {
    const block = document.createElement('div');
    block.className = 'upcoming-block';
    block.draggable = true;
    
    const blockGrid = document.createElement('div');
    blockGrid.className = 'upcoming-block-grid l-shaped';
    
    // Случайно выбираем поворот (0, 90, 180, 270 градусов)
    const rotation = Math.floor(Math.random() * 4);
    blockGrid.dataset.rotation = rotation.toString();
    
    // Создаем 3 ячейки для L-образного блока
    for (let i = 0; i < 3; i++) {
        const cell = document.createElement('div');
        cell.className = 'upcoming-block-cell';
        const color = getRandomColor(blockColors);
        cell.style.backgroundColor = color;
        blockColors.push(color);
        blockGrid.appendChild(cell);
    }
    
    block.appendChild(blockGrid);
    
    // Добавляем обработчики событий
    block.addEventListener('dragstart', handleDragStart);
    block.addEventListener('dragend', handleDragEnd);
    
    return block;
}

/**
 * Генерация горизонтального блока 1x3
 * @param {Array} blockColors - массив для отслеживания использованных цветов
 * @returns {HTMLElement} - сгенерированный блок
 */
function generateHorizontalBlock(blockColors) {
  const block = document.createElement('div');
  block.className = 'upcoming-block';
  block.draggable = true;
  
  const blockGrid = document.createElement('div');
  blockGrid.className = 'upcoming-block-grid horizontal-1x3';
  
  // Создаем 3 ячейки для горизонтального блока
  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.className = 'upcoming-block-cell';
    const color = getRandomColor(blockColors);
    cell.style.backgroundColor = color;
    blockColors.push(color);
    blockGrid.appendChild(cell);
  }
  
  block.appendChild(blockGrid);
  
  // Добавляем обработчики событий
  block.addEventListener('dragstart', handleDragStart);
  block.addEventListener('dragend', handleDragEnd);
  
  return block;
}

/**
 * Генерация вертикального блока 1x3
 * @param {Array} blockColors - массив для отслеживания использованных цветов
 * @returns {HTMLElement} - сгенерированный блок
 */
function generateVerticalBlock(blockColors) {
  const block = document.createElement('div');
  block.className = 'upcoming-block';
  block.draggable = true;
  
  const blockGrid = document.createElement('div');
  blockGrid.className = 'upcoming-block-grid vertical-1x3';
  
  // Создаем 3 ячейки для вертикального блока
  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.className = 'upcoming-block-cell';
    const color = getRandomColor(blockColors);
    cell.style.backgroundColor = color;
    blockColors.push(color);
    blockGrid.appendChild(cell);
  }
  
  block.appendChild(blockGrid);
  
  // Добавляем обработчики событий
  block.addEventListener('dragstart', handleDragStart);
  block.addEventListener('dragend', handleDragEnd);
  
  return block;
}

/**
 * Генерация блока 2x2
 * @param {Array} blockColors - массив для отслеживания использованных цветов
 * @returns {HTMLElement} - сгенерированный блок
 */
function generate2x2Block(blockColors) {
  const block = document.createElement('div');
  block.className = 'upcoming-block';
  block.draggable = true;
  
  const blockGrid = document.createElement('div');
  blockGrid.className = 'upcoming-block-grid 2x2';
  
  // Создаем 4 ячейки для блока 2x2
  for (let i = 0; i < 4; i++) {
    const cell = document.createElement('div');
    cell.className = 'upcoming-block-cell';
    const color = getRandomColor(blockColors);
    cell.style.backgroundColor = color;
    blockColors.push(color);
    blockGrid.appendChild(cell);
  }
  
  block.appendChild(blockGrid);
  
  // Добавляем обработчики событий
  block.addEventListener('dragstart', handleDragStart);
  block.addEventListener('dragend', handleDragEnd);
  
  return block;
}

/**
 * Генерация трех новых блоков
 * Теперь с ограничением на количество одинаковых цветов
 */
function generateUpcomingBlocks() {
  const container = document.querySelector('.upcoming-blocks-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Генерируем 3 новых блока
  for (let i = 0; i < 3; i++) {
    const blockColors = [];
    const blockType = Math.random();
    let block;
    
    if (blockType < 0.25) {
      block = generateLShapedBlock(blockColors);
    } else if (blockType < 0.5) {
      block = generateHorizontalBlock(blockColors);
    } else if (blockType < 0.75) {
      block = generateVerticalBlock(blockColors);
    } else {
      block = generate2x2Block(blockColors);
    }
    
    container.appendChild(block);
  }
}

/**
 * Обработка перетаскивания
 */
function handleDragStart(e) {
  if (gameOver) return;
  
  const block = e.target.closest('.upcoming-block');
  if (!block) return;
  
  const blockGrid = block.querySelector('.upcoming-block-grid');
  if (!blockGrid) return;
  
  const cells = blockGrid.querySelectorAll('.upcoming-block-cell');
  const colors = Array.from(cells).map(cell => cell.style.backgroundColor);
  
  let blockType = '2x2';
  if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
  else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
  else if (blockGrid.classList.contains('l-shaped')) blockType = 'l-shaped';
  
  const blockData = { type: blockType, colors: colors };
  e.dataTransfer.setData('text/plain', JSON.stringify(blockData));
  
  block.classList.add('dragging');
  draggedBlock = block;
  draggedBlockColors = colors;
}

/**
 * Подсветка области для размещения блока
 * Показывает силуэт блока в зависимости от его типа и поворота
 */
function highlightPlacementArea(row, col, isValid) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Очищаем предыдущие подсветки
  clearHighlights();
  
  // Получаем тип блока и поворот из перетаскиваемого блока
  const blockGrid = draggedBlock.querySelector('.upcoming-block-grid');
  let blockType;
  let rotation = 0;
  
  if (blockGrid.classList.contains('l-shaped')) {
    blockType = 'l-shaped';
    rotation = parseInt(blockGrid.dataset.rotation || '0');
  }
  else if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
  else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
  else blockType = '2x2';
  
  const highlightClass = isValid ? 'valid-drop' : 'invalid-drop';
  
  // Подсвечиваем ячейки в зависимости от типа блока и поворота
  switch (blockType) {
    case 'l-shaped':
      switch (rotation) {
        case 0: // ┗
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[row * GRID_SIZE + (col + 1)].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + col].classList.add(highlightClass);
          }
          break;
        case 1: // ┏
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + col].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + (col + 1)].classList.add(highlightClass);
          }
          break;
        case 2: // ┓
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[row * GRID_SIZE + (col + 1)].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + (col + 1)].classList.add(highlightClass);
          }
          break;
        case 3: // ┛
          if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
            cells[row * GRID_SIZE + col].classList.add(highlightClass);
            cells[row * GRID_SIZE + (col + 1)].classList.add(highlightClass);
            cells[(row + 1) * GRID_SIZE + (col + 1)].classList.add(highlightClass);
          }
          break;
      }
      break;
      
    case 'horizontal':
      if (col < GRID_SIZE - 2) {
        for (let i = 0; i < 3; i++) {
          cells[row * GRID_SIZE + (col + i)].classList.add(highlightClass);
        }
      }
      break;
      
    case 'vertical':
      if (row < GRID_SIZE - 2) {
        for (let i = 0; i < 3; i++) {
          cells[(row + i) * GRID_SIZE + col].classList.add(highlightClass);
        }
      }
      break;
      
    case '2x2':
      if (row < GRID_SIZE - 1 && col < GRID_SIZE - 1) {
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            cells[(row + i) * GRID_SIZE + (col + j)].classList.add(highlightClass);
          }
        }
      }
      break;
  }
}

/**
 * Обработчик перетаскивания над ячейкой
 */
function handleDragOver(e) {
  e.preventDefault();
  const cell = e.target.closest('.grid-cell');
  if (!cell || !draggedBlock) return;
  
  // Получаем координаты ячейки
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  
  // Получаем тип блока
  const blockGrid = draggedBlock.querySelector('.upcoming-block-grid');
  let blockType;
  
  if (blockGrid.classList.contains('l-shaped')) blockType = 'l-shaped';
  else if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
  else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
  else blockType = '2x2';
  
  // Проверяем возможность размещения и показываем подсветку
  const canPlace = canPlaceBlockAtPosition(row, col, blockType);
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
 */
function clearHighlights() {
  document.querySelectorAll('.grid-cell').forEach(cell => {
    cell.classList.remove('valid-drop', 'invalid-drop');
  });
}

/**
 * Проверяет, можно ли разместить блок в указанной позиции
 */
function canPlaceBlockAtPosition(row, col, blockType) {
  switch (blockType) {
    case 'l-shaped':
      return canPlaceLShapedBlock(row, col);
    case 'horizontal':
      return canPlaceHorizontalBlock(row, col);
    case 'vertical':
      return canPlaceVerticalBlock(row, col);
    case '2x2':
      return canPlace2x2Block(row, col);
    default:
      return false;
  }
}

/**
 * Проверяет схождение цветов для вертикального или горизонтального блока
 * @param {number} startRow - Начальная строка блока
 * @param {number} startCol - Начальный столбец блока
 * @param {boolean} isHorizontal - true для горизонтального блока, false для вертикального
 * @param {Array} colors - Массив цветов блока
 * @returns {boolean} - true если есть схождение цветов, false если нет
 */
function checkColorConvergence(startRow, startCol, isHorizontal, colors) {
  // Проверяем соседние ячейки на схождение цветов
  if (isHorizontal) {
    // Для горизонтального блока проверяем верхнюю и нижнюю ячейки
    for (let i = 0; i < 3; i++) {
      const col = startCol + i;
      
      // Проверяем верхнюю ячейку
      if (startRow > 0) {
        const topCell = document.querySelector(`.grid-cell[data-row="${startRow - 1}"][data-col="${col}"]`);
        const topFilledCell = topCell?.querySelector('.filled-cell');
        if (topFilledCell && colors.includes(topFilledCell.style.backgroundColor)) {
          return true;
        }
      }
      
      // Проверяем нижнюю ячейку
      if (startRow < 7) {
        const bottomCell = document.querySelector(`.grid-cell[data-row="${startRow + 1}"][data-col="${col}"]`);
        const bottomFilledCell = bottomCell?.querySelector('.filled-cell');
        if (bottomFilledCell && colors.includes(bottomFilledCell.style.backgroundColor)) {
          return true;
        }
      }
    }
  } else {
    // Для вертикального блока проверяем левую и правую ячейки
    for (let i = 0; i < 3; i++) {
      const row = startRow + i;
      
      // Проверяем левую ячейку
      if (startCol > 0) {
        const leftCell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${startCol - 1}"]`);
        const leftFilledCell = leftCell?.querySelector('.filled-cell');
        if (leftFilledCell && colors.includes(leftFilledCell.style.backgroundColor)) {
          return true;
        }
      }
      
      // Проверяем правую ячейку
      if (startCol < 7) {
        const rightCell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${startCol + 1}"]`);
        const rightFilledCell = rightCell?.querySelector('.filled-cell');
        if (rightFilledCell && colors.includes(rightFilledCell.style.backgroundColor)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Показывает сообщение о том, что нет схождения цветов
 */
function showNoConvergenceMessage() {
  const message = document.createElement('div');
  message.className = 'no-convergence-message';
  message.textContent = 'Нет схождения цветов!';
  
  document.querySelector('.game-container').appendChild(message);
  
  setTimeout(() => {
    message.classList.add('fade-out');
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 500);
  }, 1500);
}

/**
 * Размещает блок на игровом поле
 * @param {number} row - начальная строка
 * @param {number} col - начальный столбец
 * @param {Object} blockData - данные блока (тип и цвета)
 * @returns {Array} - массив размещенных ячеек
 */
function placeBlock(row, col, blockData) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  const placedCells = [];
  
  switch (blockData.type) {
    case 'l-shaped':
      const draggedBlock = document.querySelector('.upcoming-block.dragging');
      const blockGrid = draggedBlock?.querySelector('.upcoming-block-grid');
      const rotation = parseInt(blockGrid?.dataset.rotation || '0');
      
      let positions;
      switch (rotation) {
        case 0: // ┗
          positions = [
            {row: row, col: col},           // Верхняя левая
            {row: row, col: col + 1},       // Верхняя правая
            {row: row + 1, col: col}        // Нижняя левая
          ];
          break;
        case 1: // ┏
          positions = [
            {row: row, col: col},           // Верхняя левая
            {row: row + 1, col: col},       // Нижняя левая
            {row: row + 1, col: col + 1}    // Нижняя правая
          ];
          break;
        case 2: // ┓
          positions = [
            {row: row, col: col},           // Верхняя левая
            {row: row, col: col + 1},       // Верхняя правая
            {row: row + 1, col: col + 1}    // Нижняя правая
          ];
          break;
        case 3: // ┛
          positions = [
            {row: row, col: col},           // Верхняя левая
            {row: row, col: col + 1},       // Верхняя правая
            {row: row + 1, col: col + 1}    // Нижняя правая
          ];
          break;
        default:
          return [];
      }
      
      for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const cell = cells[pos.row * GRID_SIZE + pos.col];
        if (!cell.classList.contains('filled')) {
          cell.classList.add('filled');
          cell.style.backgroundColor = blockData.colors[i];
          placedCells.push(cell);
        }
      }
      break;
      
    case 'horizontal':
      // Размещаем горизонтальный блок 1x3
      for (let i = 0; i < 3; i++) {
        const cell = cells[row * GRID_SIZE + (col + i)];
        if (!cell.classList.contains('filled')) {
          cell.classList.add('filled');
          cell.style.backgroundColor = blockData.colors[i];
          placedCells.push(cell);
        }
      }
      break;
      
    case 'vertical':
      // Размещаем вертикальный блок 1x3
      for (let i = 0; i < 3; i++) {
        const cell = cells[(row + i) * GRID_SIZE + col];
        if (!cell.classList.contains('filled')) {
          cell.classList.add('filled');
          cell.style.backgroundColor = blockData.colors[i];
          placedCells.push(cell);
        }
      }
      break;
      
    case '2x2':
      // Размещаем блок 2x2
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          const cell = cells[(row + i) * GRID_SIZE + (col + j)];
          if (!cell.classList.contains('filled')) {
            cell.classList.add('filled');
            cell.style.backgroundColor = blockData.colors[i * 2 + j];
            placedCells.push(cell);
          }
        }
      }
      break;
      
    default:
      console.error('Неизвестный тип блока:', blockData.type);
      return [];
  }
  
  return placedCells;
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
 */
function findMatches() {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  const matches = [];
  const visited = new Set();

  // Функция для проверки соседей
  function checkNeighbors(row, col, color, group) {
    const key = `${row},${col}`;
    if (visited.has(key)) return;

    const cell = cells[row * GRID_SIZE + col];
    if (!cell || !cell.classList.contains('filled') || cell.style.backgroundColor !== color) return;

    visited.add(key);
    group.push({row, col, cell});

    // Проверяем всех соседей
    if (row > 0) checkNeighbors(row - 1, col, color, group); // верх
    if (row < GRID_SIZE - 1) checkNeighbors(row + 1, col, color, group); // низ
    if (col > 0) checkNeighbors(row, col - 1, color, group); // лево
    if (col < GRID_SIZE - 1) checkNeighbors(row, col + 1, color, group); // право
  }

  // Ищем группы одинаковых блоков
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row},${col}`;
      if (visited.has(key)) continue;

      const cell = cells[row * GRID_SIZE + col];
      if (!cell.classList.contains('filled')) continue;

      const color = cell.style.backgroundColor;
      if (!color) continue;

      const group = [];
      checkNeighbors(row, col, color, group);

      // Добавляем группу если в ней 3 или более блоков
      if (group.length >= MIN_MATCH) {
        matches.push({
          color: color,
          cells: group
        });
      }
    }
  }

  return matches;
}

/**
 * Удаление совпавших блоков
 */
function removeMatches(matches) {
  if (!matches || matches.length === 0) return false;
  
  let hasExploded = false;
  let totalScore = 0;
  
  matches.forEach(match => {
    if (match.cells.length >= MIN_MATCH) {
      hasExploded = true;
      
      // Создаем эффект взрыва для каждой ячейки в группе
      match.cells.forEach(({cell}) => {
        createExplosionEffect(cell, match.color);
        
        // Удаляем блок
        cell.classList.add('exploding');
        setTimeout(() => {
          cell.classList.remove('filled', 'exploding');
          cell.style.backgroundColor = '';
        }, 300);
      });
      
      // Подсчитываем очки
      const baseScore = match.cells.length * 10;
      const bonusMultiplier = Math.floor(match.cells.length / 3);
      totalScore += baseScore * (1 + bonusMultiplier * 0.5);
    }
  });
  
  if (hasExploded) {
    // Применяем множитель комбо
    if (currentCombo > 1) {
      totalScore = Math.floor(totalScore * (1 + currentCombo * 0.3));
    }
    
    // Обновляем счет
    score += Math.floor(totalScore);
    updateScore();
    
    // Обновляем комбо
    currentCombo++;
    if (comboTimeout) clearTimeout(comboTimeout);
    comboTimeout = setTimeout(() => {
      currentCombo = 0;
    }, COMBO_TIMEOUT);
    
    // Показываем эффект комбо
    if (matches.length > 1) {
      const centerMatch = matches[0];
      showComboEffect(Math.floor(totalScore), findCenterCell(centerMatch.cells), centerMatch.color);
    } else if (matches[0].cells.length >= 4) {
      const match = matches[0];
      showComboEffect(Math.floor(totalScore), findCenterCell(match.cells), match.color);
    }
    
    // Применяем гравитацию после взрыва
    setTimeout(() => {
      applyGravity();
      
      // Проверяем новые совпадения после падения блоков
      setTimeout(() => {
        const newMatches = findMatches();
        if (newMatches.length > 0) {
          removeMatches(newMatches);
        } else {
          // Проверяем окончание игры после всех взрывов и падений
          setTimeout(() => {
            checkForGameOver();
          }, 100);
        }
      }, GRAVITY_DELAY);
    }, GRAVITY_DELAY);
  }
  
  return hasExploded;
}

/**
 * Применение гравитации
 */
function applyGravity() {
  let moved = false;
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Проходим снизу вверх по каждому столбцу
  for (let col = 0; col < GRID_SIZE; col++) {
    let emptyRow = GRID_SIZE - 1;
    
    // Ищем пустые ячейки снизу вверх
    for (let row = GRID_SIZE - 1; row >= 0; row--) {
      const cell = cells[row * GRID_SIZE + col];
      
      if (cell.classList.contains('filled')) {
        // Если текущая ячейка заполнена и есть куда падать
        if (row < emptyRow) {
          // Перемещаем блок вниз
          const targetCell = cells[emptyRow * GRID_SIZE + col];
          targetCell.classList.add('filled');
          targetCell.style.backgroundColor = cell.style.backgroundColor;
          cell.classList.remove('filled');
          cell.style.backgroundColor = '';
          moved = true;
          emptyRow--;
        } else {
          emptyRow = row - 1;
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
 * Обновленная система подсчета очков
 */
function checkForMatches() {
  // Получаем все блоки на поле
  const blocks = [];
  
  // Находим все L-образные блоки
  for (let row = 0; row < GRID_SIZE - 2; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      if (canPlaceLShapedBlock(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 2}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 2}"][data-col="${col + 1}"]`)
        ];
        
        // Проверяем, что все ячейки заполнены
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: 'l-shaped', cells });
        }
      }
    }
  }
  
  // Находим все горизонтальные блоки
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE - 2; col++) {
      if (canPlaceHorizontalBlock(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row}"][data-col="${col + 1}"]`),
          document.querySelector(`.cell[data-row="${row}"][data-col="${col + 2}"]`)
        ];
        
        // Проверяем, что все ячейки заполнены
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: 'horizontal', cells });
        }
      }
    }
  }
  
  // Находим все вертикальные блоки
  for (let row = 0; row < GRID_SIZE - 2; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (canPlaceVerticalBlock(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 2}"][data-col="${col}"]`)
        ];
        
        // Проверяем, что все ячейки заполнены
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: 'vertical', cells });
        }
      }
    }
  }
  
  // Находим все блоки 2x2
  for (let row = 0; row < GRID_SIZE - 1; row++) {
    for (let col = 0; col < GRID_SIZE - 1; col++) {
      if (canPlace2x2Block(row, col)) {
        const cells = [
          document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row}"][data-col="${col + 1}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col}"]`),
          document.querySelector(`.cell[data-row="${row + 1}"][data-col="${col + 1}"]`)
        ];
        
        // Проверяем, что все ячейки заполнены
        if (cells.every(cell => cell && cell.classList.contains('filled'))) {
          blocks.push({ type: '2x2', cells });
        }
      }
    }
  }
  
  // Проверяем каждый блок на возможность взрыва
  let exploded = false;
  for (const block of blocks) {
    let canExplode = false;
    let points = 0;
    
    switch (block.type) {
      case 'l-shaped':
        canExplode = canExplodeLShapedBlock(block.cells);
        if (canExplode) {
          points = explodeLShapedBlock(block.cells);
          exploded = true;
        }
        break;
      case 'horizontal':
        canExplode = canExplodeHorizontalBlock(block.cells);
        if (canExplode) {
          points = explodeHorizontalBlock(block.cells);
          exploded = true;
        }
        break;
      case 'vertical':
        canExplode = canExplodeVerticalBlock(block.cells);
        if (canExplode) {
          points = explodeVerticalBlock(block.cells);
          exploded = true;
        }
        break;
      case '2x2':
        canExplode = canExplode2x2Block(block.cells);
        if (canExplode) {
          points = explode2x2Block(block.cells);
          exploded = true;
        }
        break;
    }
    
    // Обновляем счет, если блок взорвался
    if (canExplode) {
      score += points;
      updateScore();
    }
  }
  
  // Если хотя бы один блок взорвался, применяем гравитацию
  if (exploded) {
    setTimeout(() => {
      const moved = applyGravity();
      if (moved) {
        setTimeout(checkForMatches, 300);
      }
    }, 300);
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
function createExplosionEffect(cell, color) {
  // Создаем больше частиц для более эффектного взрыва
  const particleCount = 16;
  const centerX = cell.offsetWidth / 2;
  const centerY = cell.offsetHeight / 2;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    
    // Вычисляем угол для равномерного распределения частиц
    const angle = (i / particleCount) * Math.PI * 2;
    const velocity = 8 + Math.random() * 15; // Случайная скорость
    
    // Вычисляем конечную позицию частицы
    const x = Math.cos(angle) * velocity * (Math.random() + 0.5) * 10;
    const y = Math.sin(angle) * velocity * (Math.random() + 0.5) * 10;
    
    // Создаем градиент для частицы
    const particleColor = color;
    particle.style.background = `radial-gradient(circle at center, ${particleColor}, ${adjustColor(particleColor, -30)})`;
    
    // Устанавливаем начальную позицию
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    
    // Устанавливаем параметры анимации
    particle.style.setProperty('--x', `${x}px`);
    particle.style.setProperty('--y', `${y}px`);
    particle.style.setProperty('--rotation', `${Math.random() * 360}deg`);
    
    // Добавляем тень для объемного эффекта
    particle.style.boxShadow = `0 0 ${Math.random() * 10 + 5}px ${particleColor}`;
    
    cell.appendChild(particle);
    
    // Удаляем частицу после завершения анимации
    setTimeout(() => {
      if (cell.contains(particle)) {
        cell.removeChild(particle);
      }
    }, 600);
  }
}

/**
 * Изменяет яркость цвета
 * @param {string} color - CSS цвет
 * @param {number} percent - процент изменения (-100 до 100)
 * @returns {string} - новый цвет
 */
function adjustColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

/**
 * Показ эффекта комбо
 */
function showComboEffect(points, centerCell, color) {
  const gameContainer = document.querySelector(".game-container");
  const comboText = document.createElement("div");
  comboText.className = "combo-text";
  
  // Добавляем текст комбо с множителем
  if (currentCombo > 1) {
    const multiplier = 1 + currentCombo * 0.3;
    comboText.textContent = `${currentCombo}x COMBO! (${multiplier.toFixed(1)}x)`;
    comboText.dataset.combo = currentCombo.toString();
  } else if (points >= 50) {
    comboText.textContent = "GREAT!";
  } else {
    comboText.textContent = "MATCH!";
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
  
  // Добавляем искры для высоких комбо или больших очков
  if (currentCombo >= 3 || points >= 50) {
    const sparkCount = currentCombo >= 3 ? currentCombo * 4 : 8;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement("div");
      spark.className = "combo-spark";
      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 60;
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
      spark.style.animationDelay = `${Math.random() * 0.3}s`;
      spark.style.backgroundColor = color;
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
    pointsText.style.top = `${parseInt(comboText.style.top) + 40}px`;
    pointsText.style.setProperty("--combo-color", color);
    
    // Добавляем эффект свечения для больших очков
    if (points >= 100) {
      pointsText.style.textShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
      pointsText.style.fontSize = '2rem';
    }
    
    gameContainer.appendChild(pointsText);
    
    setTimeout(() => {
      pointsText.classList.add("fade-out");
      setTimeout(() => {
        if (gameContainer.contains(pointsText)) {
          gameContainer.removeChild(pointsText);
        }
      }, 500);
    }, 1200);
  }, 200);
  
  // Удаляем текст комбо
  setTimeout(() => {
    comboText.classList.add("fade-out");
    setTimeout(() => {
      if (gameContainer.contains(comboText)) {
        gameContainer.removeChild(comboText);
      }
    }, 500);
  }, 1200);
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
    particle.style.backgroundColor = COLORS[Math.floor(Math.random() * COLORS.length)].color;
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
 */
function checkForGameOver() {
  if (gameOver) return true;

  const upcomingBlocks = document.querySelectorAll('.upcoming-block');
  if (!upcomingBlocks.length) return false;

  // Проверяем каждый upcoming блок
  for (const block of upcomingBlocks) {
    const blockGrid = block.querySelector('.upcoming-block-grid');
    if (!blockGrid) continue;

    // Определяем тип блока
    let blockType;
    if (blockGrid.classList.contains('l-shaped')) blockType = 'l-shaped';
    else if (blockGrid.classList.contains('horizontal-1x3')) blockType = 'horizontal';
    else if (blockGrid.classList.contains('vertical-1x3')) blockType = 'vertical';
    else blockType = '2x2';

    // Для L-образного блока проверяем все повороты
    if (blockType === 'l-shaped') {
      const originalRotation = parseInt(blockGrid.dataset.rotation || '0');
      
      for (let rotation = 0; rotation < 4; rotation++) {
        blockGrid.dataset.rotation = rotation.toString();
        
        // Проверяем все возможные позиции для текущего поворота
        for (let row = 0; row < GRID_SIZE; row++) {
          for (let col = 0; col < GRID_SIZE; col++) {
            // Временно делаем блок "перетаскиваемым" для проверки
            block.classList.add('dragging');
            const canPlace = canPlaceBlockAtPosition(row, col, blockType);
            block.classList.remove('dragging');
            
            if (canPlace) {
              blockGrid.dataset.rotation = originalRotation.toString();
              return false; // Нашли возможное размещение
            }
          }
        }
      }
      
      blockGrid.dataset.rotation = originalRotation.toString();
    } else {
      // Для остальных блоков проверяем все позиции
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (canPlaceBlockAtPosition(row, col, blockType)) {
            return false; // Нашли возможное размещение
          }
        }
      }
    }
  }

  // Если дошли до этой точки, значит ни один блок нельзя разместить
  gameOver = true;
  showGameOver("Game Over! No valid moves left!");
  return true;
}

/**
 * Показ экрана окончания игры
 * @param {string} reason - причина окончания игры
 */
function showGameOver(reason) {
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
    
    const reasonText = document.createElement("p");
    reasonText.textContent = reason;
    reasonText.style.fontSize = "1.2rem";
    reasonText.style.marginTop = "10px";
    
    const restartButton = document.createElement("button");
    restartButton.textContent = "Play Again";
    restartButton.className = "restart-button";
    restartButton.addEventListener("click", restartGame);
    
    messageContent.appendChild(title);
    messageContent.appendChild(finalScore);
    messageContent.appendChild(reasonText);
    messageContent.appendChild(restartButton);
    gameOverMessage.appendChild(messageContent);
    
    const gameContainer = document.querySelector(".game-container");
    gameContainer.appendChild(gameOverMessage);
  } else {
    const finalScore = gameOverMessage.querySelector("p");
    finalScore.textContent = `Final Score: ${score}`;
    const reasonText = gameOverMessage.querySelectorAll("p")[1];
    reasonText.textContent = reason;
    gameOverMessage.style.display = "flex";
  }
}

/**
 * Обновляет отображение счета на экране
 */
function updateScore() {
  const scoreElement = document.querySelector('.score-display');
  if (scoreElement) {
    scoreElement.textContent = `Score: ${score}`;
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
  draggedBlock = null;
  draggedBlockColors = [];
}

// Call addStyles when the game initializes
window.addEventListener('load', () => {
  initializeGame();
});

/**
 * Обработчик размещения блока
 * Использует сохраненные цвета для размещения
 */
function handleDrop(e) {
  e.preventDefault();
  if (gameOver) return;
  
  const cell = e.target.closest('.grid-cell');
  if (!cell) return;
  
  try {
    const blockData = JSON.parse(e.dataTransfer.getData('text/plain'));
    if (!blockData || !blockData.type || !blockData.colors) return;
  
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
  
    if (canPlaceBlockAtPosition(row, col, blockData.type)) {
      const placedCells = placeBlock(row, col, blockData);
      
      if (placedCells.length > 0) {
        // Удаляем размещенный блок
        const draggedBlock = document.querySelector('.upcoming-block.dragging');
        if (draggedBlock) draggedBlock.remove();
        
        // Проверяем совпадения
        setTimeout(() => {
          const matches = findMatches();
          if (matches.length > 0) {
            removeMatches(matches);
          }
          
          // Генерируем новые блоки если нужно
          const upcomingContainer = document.querySelector('.upcoming-blocks-container');
          if (upcomingContainer && upcomingContainer.children.length === 0) {
            generateUpcomingBlocks();
            // Проверяем окончание игры после генерации новых блоков
            setTimeout(() => {
              checkForGameOver();
            }, 100);
          } else {
            // Проверяем окончание игры с текущими блоками
            setTimeout(() => {
              checkForGameOver();
            }, 100);
          }
        }, 100);
      }
    }
  } catch (error) {
    console.error('Ошибка при размещении блока:', error);
  }
  
  clearHighlights();
}

/**
 * Проверяет, можно ли разместить L-образный блок в указанной позиции
 */
function canPlaceLShapedBlock(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Для проверки во время перетаскивания
  const draggedBlock = document.querySelector('.upcoming-block.dragging');
  const blockGrid = draggedBlock ? draggedBlock.querySelector('.upcoming-block-grid') : null;
  const rotation = blockGrid ? parseInt(blockGrid.dataset.rotation || '0') : 0;

  // Базовая проверка границ
  if (row < 0 || col < 0) return false;

  // Проверяем занятость ячеек в зависимости от поворота
  switch (rotation) {
    case 0: // ┗
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled')
      );
    case 1: // ┏
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
      );
    case 2: // ┓
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
      );
    case 3: // ┛
      if (row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) return false;
      return (
        !cells[row * GRID_SIZE + col].classList.contains('filled') &&
        !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
        !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
      );
    default:
      return false;
  }
}

/**
 * Проверяет и удаляет заполненные линии
 * Обновляет счет после удаления линий
 */
function checkLines() {
  const grid = document.querySelector('.grid');
  const cells = grid.querySelectorAll('.grid-cell');
  let linesCleared = 0;
  
  // Проверяем горизонтальные линии
  for (let row = 0; row < GRID_SIZE; row++) {
    let isLineFull = true;
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = cells[row * GRID_SIZE + col];
      if (!cell.classList.contains('filled')) {
        isLineFull = false;
        break;
      }
    }
    
    if (isLineFull) {
      // Удаляем линию
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = cells[row * GRID_SIZE + col];
        cell.classList.remove('filled');
        cell.style.backgroundColor = '';
      }
      
      // Сдвигаем все блоки выше вниз
      for (let r = row; r > 0; r--) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const cellAbove = cells[(r - 1) * GRID_SIZE + col];
          const cell = cells[r * GRID_SIZE + col];
          
          if (cellAbove.classList.contains('filled')) {
            cell.classList.add('filled');
            cell.style.backgroundColor = cellAbove.style.backgroundColor;
            cellAbove.classList.remove('filled');
            cellAbove.style.backgroundColor = '';
          }
        }
      }
      
      linesCleared++;
      row--; // Проверяем ту же строку снова, так как блоки сдвинулись вниз
    }
  }
  
  // Обновляем счет
  if (linesCleared > 0) {
    score += linesCleared * 100;
    updateScore();
  }
}

function canPlaceHorizontalBlock(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Проверяем границы поля для горизонтального блока 1x3
  if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE - 2) {
    return false;
  }
  
  // Проверяем занятость ячеек
  return (
    !cells[row * GRID_SIZE + col].classList.contains('filled') &&
    !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
    !cells[row * GRID_SIZE + (col + 2)].classList.contains('filled')
  );
}

function canPlaceVerticalBlock(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Проверяем границы поля для вертикального блока 1x3
  if (row < 0 || col < 0 || row >= GRID_SIZE - 2 || col >= GRID_SIZE) {
    return false;
  }
  
  // Проверяем занятость ячеек
  return (
    !cells[row * GRID_SIZE + col].classList.contains('filled') &&
    !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled') &&
    !cells[(row + 2) * GRID_SIZE + col].classList.contains('filled')
  );
}

function canPlace2x2Block(row, col) {
  const grid = document.querySelector('.game-grid');
  const cells = grid.querySelectorAll('.grid-cell');
  
  // Проверяем границы поля для блока 2x2
  if (row < 0 || col < 0 || row >= GRID_SIZE - 1 || col >= GRID_SIZE - 1) {
    return false;
  }
  
  // Проверяем занятость ячеек
  return (
    !cells[row * GRID_SIZE + col].classList.contains('filled') &&
    !cells[row * GRID_SIZE + (col + 1)].classList.contains('filled') &&
    !cells[(row + 1) * GRID_SIZE + col].classList.contains('filled') &&
    !cells[(row + 1) * GRID_SIZE + (col + 1)].classList.contains('filled')
  );
}

