/**
 * Пошаговая Игра “РОГАЛИК”.
 * Игра генерирует карту со случайным количеством комнат(5-10) и проходов(3-5 по каждому направлению).
 * Поверх карты размещаются актеры и предметы. Необходимо обеспечить выживание для актера игрока.
 * 
 * На каждом ходу все актеры совершают только одно действие.
 * Гибель актера игрока перезапустит игровой цикл. Уничтожение всех вражеских актеров перезапустит игровой цикл.
 * Актеры могут наступать на предметы, но не друг на друга.
 * Если игрок наступает на зелье, то увеличивает свое здоровье на 25 (но не больше 100), зелье после этого пропадет.
 * Если игрок наступает на меч, то увеличивает свою атаку на 10, меч после этого пропадет.
 * Изначально все актеры имеют 100 здоровья и 10 атаки (актер игрока имеет 20 атаки).
 * Изначально игрок имеет 1 зелье в инвентаре.
 * Если наступить на зелье при полном здоровье, оно уйдет в инвентарь.
 * Использование зелья из инвентаря не отнимает ход,
 * невозможное передвижение не отнимает ход.
 * 
 * УПРАВЛЕНИЕ
 * WASD - передвижение
 * Space - атака
 * R - использовать зелье из инвенторя
 */
function Game() {
    this.ROWS = 24; // Высота карты
    this.COLS = 40; // Ширина карты
    this.map;       // Массив карты

    this.ACTORS = 11;  // Количество актеров, первый актер - актер игрока.
    this.POTIONS = 10; // Количество зелий на карте
    this.SWORDS = 2;   // Количество мечей на карте

    this.actorList; // Список актеров
	this.actorMap;  // Ассоциативная  карта актеров

    this.itemList;  // Список предметов
    this.itemMap;   // Ассоциативная  карта предметов

    this.inventory; // Инвентарь для лишних зелий
}

/**
 * Инициализация игры.
 * Выполняет инициализацию карты, актеров и предметов.
 * Также осуществляет привязку событий клавиатуры, 
 * осуществляет отображение состояния сцены на странице.
 */
Game.prototype.init = function() {
    this.initMap();
    this.initActors();
    this.initItems();

    this.inventory = 1; // Увеличить, если игра кажется несправедливой (зелья в инвентаре)
    this.actorList[0].dm = 20; // Увеличить, если игра кажется несправедливой (урон игрока)

    this.bindEvents();

    this.drawMap();
    this.drawElements(this.actorList, 'actors');
    this.drawElements(this.itemList, 'items');
    this.drawInventory();
};

/**
 * Генерирует случайное целое число в диапазоне от 0 до max.
 * @param {number} max - Максимальное значение, до которого нужно сгенерировать случайное число.
 * @returns {number} - Сгенерированное случайное целое число.
 */
Game.prototype.randomInt = function(max) {
	return Math.floor(Math.random() * max);
};

/**
 * Инициализация карты игры.
 * Создает карту игрового поля и размещает на ней комнаты и проходы.
 * Три прохода по вертикали (7, 12, 17) генерируются всегда,
 * чтобы обеспечить доступность всех комнат.
 */
Game.prototype.initMap = function() {
    this.map = [];
    // Заливка карты стеной
    for (var y = 0; y < this.ROWS; y++) {
        this.map[y] = [];
        for (var x = 0; x < this.COLS; x++)
            this.map[y][x] = "tileW";
    }
    // Генерация комнат
    this.createRooms(this.randomInt(6) + 5);

    // Генерация вертикальных проходов
    for (var i = 0; i < this.randomInt(3) + 3; i++) {
        var x = this.randomInt(this.COLS - 2) + 1;
        for (var y = 0; y < this.ROWS; y++)
            this.map[y][x] = 'tile-';
    }
    // Генерация горизонтальных проходов
    var lines = [7, 12, 17];
    lines.push(this.randomInt(this.ROWS - 2) + 1);
    lines.push(this.randomInt(this.ROWS - 2) + 1);
    for (var line of lines)
        for (var x = 0; x < this.COLS; x++)
            this.map[line][x] = 'tile-';

};

/**
 * Создает комнаты на игровом поле.
 * Расположение, высота и ширина комнаты генерируется случайно.
 * Небольшие комнаты к верхнему и нижнему краю сдвигаются к середине,
 * чтобы обеспечить доступность всех комнат.
 * @param {number} numRooms - Количество комнат для создания.
 */
Game.prototype.createRooms = function(numRooms) {
    for (var n = 0; n < numRooms; n++) {
        var roomPlaced = false; // Флаг удачного размещения комнаты
        var failedAttempts = 0; // Количество неудачных размещений

        while (!roomPlaced && failedAttempts < 30) {
            failedAttempts += 1;
            var x = this.randomInt(this.COLS - 8);
            var y = this.randomInt(this.ROWS - 8);

            var width = this.randomInt(8) + 3;
            var height = this.randomInt(8) + 3;

            if (y < 8 && height < 6) 
                y += 7 - height  // Если комната слишком близко к верхнему краю карты
            else if (y + height > this.ROWS - 8 && height < 6)
                y -= 7 - height; // Если комната слишком близко к нижнему краю карты

            if (this.isRoomPlaceable(x, y, width, height)) {
                for (var i = y; i < y + height; i++)
                    for (var j = x; j < x + width; j++)
                        this.map[i][j] = 'tile-';
                roomPlaced = true;
            }
        }
    }
};

/**
 * Проверяет, можно ли разместить комнату по указанным координатам и размерам.
 * @param {number} x - Координата X верхнего левого угла комнаты.
 * @param {number} y - Координата Y верхнего левого угла комнаты.
 * @param {number} width - Ширина комнаты.
 * @param {number} height - Высота комнаты.
 * @returns {boolean} - Возвращает true, если комнату можно разместить, иначе false.
 */
Game.prototype.isRoomPlaceable = function(x, y, width, height) {
    // Проверка, находятся ли координаты комнаты в пределах игровой карты.
    if (x < 1 || y < 1 || x + width > this.COLS - 1 || y + height > this.ROWS - 1)
        return false;

    // Поиск других комнат в области размещаемой
    for (var i = y - 1; i < y + height + 1; i++)
        for (var j = x - 1; j < x + width + 1; j++)
            if (this.map[i][j] !== 'tileW')
                return false;

    return true;
};

/**
 * Инициализация списка актеров игры.
 * Создает и размещает актеров на игровом поле.
 * Первый актер в actorList, актер игрока.
 */
Game.prototype.initActors = function() {
	this.actorList = [];
	this.actorMap = {};
	for (var i = 0; i < this.ACTORS; i++) {
		var actor = { // Объект актера
			x: 0,     // x координата
			y: 0,     // y координата
			hp: 100,  // Здоровье
            dm: 10    // Урон
		};
		do { // Цикл для поиска свободного места на карте
            actor.y = this.randomInt(this.ROWS);
            actor.x = this.randomInt(this.COLS);
		} while (this.map[actor.y][actor.x] == 'tileW' || this.actorMap[actor.y + "_" + actor.x] != null);

		this.actorMap[actor.y + "_" + actor.x] = actor;
		this.actorList.push(actor);
	}
};

/**
 * Инициализация списка предметов игры.
 * Создает и размещает предметы на игровом поле.
 */
Game.prototype.initItems = function() {
    this.itemList = [];
    this.itemMap = {};

    this.createItems(this.SWORDS, 1);

    this.createItems(this.POTIONS, 0);
};

/**
 * Создает указанное количество предметов указанного типа на игровом поле.
 * @param {number} numItems - Количество предметов для создания.
 * @param {number} itemType - Тип предмета (0 - зелье, 1 - меч).
 */
Game.prototype.createItems = function(numItems, itemType) {
    for (var i = 0; i < numItems; i++) {
        var item = {       // Объект предмета
            x: 0,          // x координата
            y: 0,          // y координата
            type: itemType // Тип предмета
        };
        do { // Цикл для поиска свободного места на карте
            item.y = this.randomInt(this.ROWS);
            item.x = this.randomInt(this.COLS);
        } while (this.map[item.y][item.x] == 'tileW' || this.itemMap[item.y + "_" + item.x] != null);

        this.itemMap[item.y + "_" + item.x] = item;
        this.itemList.push(item);
    }
};

/**
 * Привязывает события клавиатуры к методам игры.
 * Обрабатывает нажатия клавиш и запускает соответствующие методы игры.
 * После действия игрока, применяются предмет с пола, затем наступают действия противников.
 * Некорректное передвижение игрока не считается за действие.
 */
Game.prototype.bindEvents = function() {
    this.keydownHandler =('keydown', function(event) {
        var player = this.actorList[0];

        var acted = false; //Флаг, действия игрока

        switch (event.keyCode) {
            case 65: // A (влево)
                acted = this.moveActor(player, {x: -1, y: 0});
                break;
            case 87: // W (вверх)
                acted = this.moveActor(player, {x: 0, y: -1});
                break;
            case 68: // D (вправо)
                acted = this.moveActor(player, {x: 1, y: 0});
                break;
            case 83: // S (вниз)
                acted = this.moveActor(player, {x: 0, y: 1});
                break;
            case 32: // Пробел (атака)
                acted = this.attackEnemies();
                break;
            case 82: // R (Использовать зелье из инвентаря)
                if (this.inventory) {
                    this.inventory -= 1;
                    player.hp = Math.min(player.hp + 25, 100);
                    this.drawInventory();
                    this.drawElements(this.actorList, 'actors');
                }
                break;
        }

        // Проверяем, есть ли предмет под игроком
        var item = this.itemMap[player.y + '_' + player.x];
        if (item) {
            if (item.type === 0) { // зелье
                if (player.hp === 100) {
                    this.inventory += 1;
                }
                else
                    player.hp = Math.min(player.hp + 25, 100);
            }
            else if ((item.type === 1)) { // меч
                player.dm += 10;
            }
            this.itemList.splice(this.itemList.indexOf(item), 1);
            delete this.itemMap[player.y + '_' + player.x];
            // Обновляем отображение предметов
            document.querySelectorAll('.tileSW, .tileHP').forEach(element => element.remove());
            this.drawElements(this.itemList, 'items');
            this.drawInventory();
        }

        if (acted) {
            if (this.actorList.length == 1) { // Условие "победы"
                this.init();
                document.removeEventListener('keydown', this.keydownHandler);
                return;
            }
            for (var actor in this.actorList) {
                if (actor == 0) // Пропускаем игрока
                    continue;
                this.aiAct(this.actorList[actor]);

                if (player.hp < 1) { // Условие поражения
                    this.init();
                    document.removeEventListener('keydown', this.keydownHandler);
                    return;
                }
            }
            // Обновляем отображение актеров
            document.querySelectorAll('.tileP, .tileE').forEach(element => element.remove());
            this.drawElements(this.actorList, 'actors');
        }
    }.bind(this));
    document.addEventListener('keydown', this.keydownHandler);
};

/**
 * Проверяет, является ли указанный ход допустимым для указанного актера.
 * @param {Object} actor - Актер, для которого проверяется ход.
 * @param {Object} dir - Направление хода (объект с полями x и y).
 * @returns {boolean} - Возвращает true, если ход допустим, иначе false.
 */
Game.prototype.isValidMove = function(actor, dir) {
	return 	actor.x + dir.x >= 0 &&
			actor.x + dir.x <= this.COLS - 1 &&
			actor.y + dir.y >= 0 &&
			actor.y + dir.y <= this.ROWS - 1 &&
			this.map[actor.y + dir.y][actor.x + dir.x] == 'tile-';
};

/**
 * Перемещает указанного актера на указанное направление.
 * @param {Object} actor - Актер, который перемещается.
 * @param {Object} dir - Направление перемещения (объект с полями x и y).
 * @returns {boolean} - Возвращает true, если перемещение прошло успешно, иначе false.
 */
Game.prototype.moveActor = function(actor, dir) {
	if (!this.isValidMove(actor, dir))
		return false;
	
	var newKey = (actor.y + dir.y) + '_' + (actor.x + dir.x);
	if (this.actorMap[newKey] != null) {
        return false;
	} else {
		delete this.actorMap[actor.y + '_' + actor.x];
		
		actor.y += dir.y;
		actor.x += dir.x;

		this.actorMap[actor.y + '_' + actor.x] = actor;
	}
	return true;
};

/**
 * Атакует вражеских актеров, находящихся рядом с игроком.
 * @returns {boolean} - Возвращает true, если атака выполнена успешно.
 */
Game.prototype.attackEnemies = function() {
    var player = this.actorList[0];
    var enemyKeys = this.getAdjacentEnemyKeys(player);

    for (var key of enemyKeys) {
        var enemy = this.actorMap[key];
        enemy.hp -= player.dm;
        if (enemy.hp <= 0) {
            this.actorList.splice(this.actorList.indexOf(enemy), 1);
            delete this.actorMap[key];
        }
    }
    return true;
};

/**
 * Получает ключи смежных вражеских актеров для актера игрока.
 * @param {Object} actor - Актер, для которого получаются ключи вражеских актеров.
 * @returns {Array} - Массив ключей смежных вражеских актеров.
 */
Game.prototype.getAdjacentEnemyKeys = function(actor) {
    var adjacentKeys = [];
    var directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];

    for (var dir of directions) {
        var newX = actor.x + dir.x;
        var newY = actor.y + dir.y;
        var key = newY + '_' + newX;
        if (this.actorMap[key] && this.actorMap[key] !== actor) {
            adjacentKeys.push(key);
        }
    }
    return adjacentKeys;
};

/**
 * Выполняет действия искусственного интеллекта для указанного актера.
 * ИИ атакует противника на смежной клетке, преследует игрока в радиусе 5 клеток
 * и совершает случайный ход, если находится дальше 5 клеток
 * @param {Object} actor - Актер, для которого выполняются действия ИИ.
 */
Game.prototype.aiAct = function(actor) {
    var player = this.actorList[0];
	var directions = [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }];	
	var dx = player.x - actor.x;
	var dy = player.y - actor.y;
	
    if (Math.abs(dx) + Math.abs(dy) === 1) // Если игрок находится рядом с противником
        player.hp -= actor.dm;

    else if (Math.abs(dx) + Math.abs(dy) > 5) // Если игрок находится достаточно далеко от противника
        this.moveActor(actor, directions[this.randomInt(directions.length)]);

    else if (Math.abs(dx) > Math.abs(dy)) // Если игрок ближе к противнику
        if (dx < 0)
            this.moveActor(actor, directions[0]); // двигаться влево
        else
            this.moveActor(actor, directions[1]); // двигаться вправо
    else
        if (dy < 0)
            this.moveActor(actor, directions[2]); // двигаться вверх
        else
            this.moveActor(actor, directions[3]); // двигаться вниз
};

/**
 * Отрисовывает игровое поле.
 */
Game.prototype.drawMap = function() {
    var field = document.querySelector('.field');
    field.innerHTML = '';
    for (var y = 0; y < this.ROWS; y++) {
        for (var x = 0; x < this.COLS; x++) {
            var tile = document.createElement('div');
            tile.classList.add('tile', this.map[y][x]);
            tile.style.left = x * 27 + 'px';
            tile.style.top = y * 27 + 'px';
            field.appendChild(tile);
        }
    }
};

/**
 * Отрисовывает элементы (актеров или предметы) на игровом поле.
 * @param {Array} elementList - Список элементов для отрисовки.
 * @param {string} list - Тип элемента (actors - актеры, items - предметы).
 */
Game.prototype.drawElements = function(elementList, list) {
    for (var element in elementList) {
        var field = document.querySelector('.field');
        var tile = document.createElement('div');
        if (list === 'actors'){
            tile.classList.add('tile', (element == 0) ? 'tileP' : 'tileE');
            var healthBar = document.createElement('div');
            healthBar.classList.add('health');
            healthBar.style.width = elementList[element].hp + '%';
            tile.appendChild(healthBar);
        } else {
            tile.classList.add('tile', (elementList[element].type === 1) ? 'tileSW' : 'tileHP');
        }
        tile.style.left = elementList[element].x * 27 + 'px';
        tile.style.top = elementList[element].y * 27 + 'px';
        field.appendChild(tile);
    }
};

/**
 * Отрисовывает инвентарь.
 */
Game.prototype.drawInventory = function() {
    var field = document.querySelector('.inventory');
    field.classList.add('field');
    field.innerHTML = '';
    for (var i = 0; i < this.inventory; i++) {
        var tile = document.createElement('div');
        tile.classList.add('tile', 'tileHP');
        tile.style.left = i * 27 + 'px';
        field.appendChild(tile);
    }
};
