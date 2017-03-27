/* Constants */

var ST_CAN_MOVE = 'ST_CAN_MOVE';
var ST_HITS_BOTTOM = 'ST_HITS_BOTTOM';
var ST_HITS_TOP = 'ST_HITS_TOP';

var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;

/**
 * The Game class
 */

function Game(height, width)
{
	this.generate_field(height, width);
	this.generate_new_object();
	this.create_bindings();

	this.score = 0;
	this.game_over = false;
	this.tick_wait = 1000;
};

/**
 * An Object (which will fall down the playing field)
 *
 * An object is represented as an JS-object with a 2-dimensional array.
 * The object is accessible via Game.obj
 *   1 means there's a block.
 *   0 means there's no block.
 */

function Game_Obj()
{
	this.y = 0;
	this.x = 0;
	this.color = this.colors[Math.floor(Math.random()*this.colors.length)];

	this.data = this.objects[Math.floor(Math.random()*this.objects.length)];
	this.height = this.data.length;
	this.width = this.data[0].length;
};

Game_Obj.prototype.colors = [
	'red', 'green', 'yellow',
	'blue', 'orange', 'grey',
	'brown', 'cyan', 'magenta',
];

Game_Obj.prototype.objects = [
	[
		[0, 1, 0,],
		[1, 1, 1,],
	],
	[
		[1, 1,],
		[1, 1,],
	],
	[
		[0, 1, 1,],
		[1, 1, 0,],
	],
	[
		[1, 1, 0,],
		[0, 1, 1,],
	],
	[
		[1,],
		[1,],
		[1,],
		[1,],
	],
	[
		[1, 0,],
		[1, 0,],
		[1, 1,],
	],
	[
		[0, 1,],
		[0, 1,],
		[1, 1,],
	],
];

/**
 * Returns the object's data, rotated
 */
 
Game_Obj.prototype.get_rotated = function()
{
	var new_object = new Array(this.width);

	for (var y = 0; y < new_object.length; y++) {
		new_object[y] = new Array(this.height);
		for (var x = 0; x < new_object[y].length; x++) {
			new_object[y][x] = this.data[new_object[y].length - x - 1][y];
		}
	}
	
	return new_object;
}

/**
 * Rotates the object (to the right)
 */

Game_Obj.prototype.rotate = function()
{
	var new_object = this.get_rotated();
	this.data = new_object;
	this.height = this.data.length;
	this.width = this.data[0].length;
}

/**
 * Creates key and mouse bindings.
 */

Game.prototype.create_bindings = function()
{
 	$(document).keydown(this, this.on_key_down);
 	$(document).bind('touchstart', this, this.on_touchstart);
}

/**
 * The key binding
 */

Game.prototype.on_key_down = function(e)
{
	var game = e.data;

	if (game.game_over)
		return;
	
	switch (e.which) { 
		case KEY_LEFT:
			if (game.obj_can_move_left())
				game.obj.x -= 1;
			break;
		case KEY_RIGHT:
			if (game.obj_can_move_right())
				game.obj.x += 1;
			break;
		case KEY_DOWN:
			do { 
				game.tick();
			} while (game.obj_can_move_down() == ST_CAN_MOVE);
			break;
		case KEY_UP:
			if (game.obj_can_rotate())
				game.obj.rotate();
			break;
		default:
			return true;
	}
	if (typeof game.on_key_down_hook === 'function') {
		game.on_key_down_hook(game.on_key_down_hook.data, e);
	}
	return false;
}

/**
 * The mouse binding
 *
 * Viewports mouse event positions
 *
 *  30%     70%
 *   |  UP  |
 * --+------+-- 30%
 *   |      |
 * L |      |R
 *   |      |
 * --+------+-- 70%
 *   | DOWN |
 */

Game.prototype.on_touchstart = function(e)
{
	var game = e.data;
	var x = e.originalEvent.touches[0].pageX;
	var y = e.originalEvent.touches[0].pageY;
	var left = 0.3 * $(window).width();
	var right = 0.7 * $(window).width();
	var top = 0.3 * $(window).height();
	var bottom = 0.7 * $(window).height();

	if (left < x < right && y < top) {
		// up
		game.on_key_down({which: KEY_UP, data: game});
	} else if (x < left && top < y < bottom) {
		// left
		game.on_key_down({which: KEY_LEFT, data: game});
	} else if (x > right && top < y < bottom) {
		// right
		game.on_key_down({which: KEY_RIGHT, data: game});
	} else if (left < x < right && y > bottom) {
		// down
		game.on_key_down({which: KEY_DOWN, data: game});
	}
}
 
/**
 * Generates a new, empty playing field
 * 
 * Accessible via Game.field[y][x], containts css color or 0
 */

Game.prototype.generate_field = function(height, width)
{
	this.field = new Array(height);

	for (var y = 0; y < height; y++) {
		this.field[y] = new Array(width);
		for (var x = 0; x < width; x++) {
			this.field[y][x] = 0;
		}
	}
	
	this.height = height;
	this.width = width;
}

/**
 * Create a new, random object which will fall down the playing field.
 */
 
Game.prototype.generate_new_object = function() 
{
	if (typeof this.next_obj == 'undefined') {
		this.obj = new Game_Obj();
	} else {
		this.obj = this.next_obj;
	}

	this.next_obj = new Game_Obj();
	this.next_obj.x = Math.floor(this.width / 2 - this.obj.width / 2);
}

/**
 * Check if the object can be moved to the left
 *
 * Return is boolean
 */

Game.prototype.obj_can_move_left = function()
{
	if (this.obj.x <= 0)
		return false;
		
	// If any of the objects blocks is directly right of a field block
	for (var y = 0; y < this.obj.height; y++) {
		for (var x = 0; x < this.obj.width; x++) {
			if (this.obj.data[y][x] == 1 && this.field[this.obj.y+y][this.obj.x+x-1] != 0) {
				return false;
			}
		}
	}
		
	return true;
}
 
/**
 * Check if the object can be moved to the right
 *
 * Return is boolean
 */

Game.prototype.obj_can_move_right = function()
{
	if (this.obj.x + this.obj.width >= this.width)
		return false;
		
	// If any of the objects blocks is directly left of a field block
	for (var y = 0; y < this.obj.height; y++) {
		for (var x = 0; x < this.obj.width; x++) {
			if (this.obj.data[y][x] == 1 && this.field[this.obj.y+y][this.obj.x+x+1] != 0) {
				return false;
			}
		}
	}
		
	return true;
}

/**
 * Check if the object can be moved downwards
 * 
 * See ST_* constants at top for return values.
 */

Game.prototype.obj_can_move_down = function()
{
	if (this.obj.y + this.obj.height >= this.height)
		return ST_HITS_BOTTOM;

	// If any of the objects blocks is directly above a field block
	for (var y = 0; y < this.obj.height; y++) {
		for (var x = 0; x < this.obj.width; x++) {
			if (this.obj.data[y][x] == 1 && this.field[this.obj.y+y+1][this.obj.x+x] != 0) {
				if (this.obj.y == 0) {
					// This obj can't move, even though it hasn't even been moved yet
					return ST_HITS_TOP;
				} else {
					return ST_HITS_BOTTOM;
				}
			}
		}
	}

	return ST_CAN_MOVE;
}
 
 /**
  * Move the object 1 down.
  */
  
Game.prototype.move_obj = function()
{
	this.obj.y += 1;
}
 
 /**
  * Checks if the object can be turned at the current position
  */

Game.prototype.obj_can_rotate = function()
{
	var new_obj = this.obj.get_rotated();

	if (this.obj.x + new_obj[0].length > this.width)
		return false;
	if (this.obj.y + new_obj.length > this.height)
		return false;

	for (var y = 0; y < new_obj.length; y++) {
		for (var x = 0; x < new_obj[y].length; x++) {
			if (new_obj[y][x] != 0 && this.field[this.obj.y+y][this.obj.x+x] != 0)
				return false;
		}
	}
	return true;
}

 /**
  * Checks weather the specified line is full
  */
 
Game.prototype.is_line_full = function(y)
{
	for (var x = 0; x < this.width; x++) {
		if (this.field[y][x] == 0)
			return false;
	}
	return true;
}

 /**
  * Clearns one horizontal line and pushes down all blocks above.
  */
  
Game.prototype.remove_full_line = function(the_y)
{
	for (var x = 0; x < this.width; x++) {
		this.field[the_y][x] = 0;
	}
	for (var y = the_y; y >= 0; y--) {
		for (var x = 0; x < this.width; x++) {
			if (y > 0) {
				this.field[y][x] = this.field[y-1][x];
			} else {
				this.field[y][x] = 0;
			}
		}
	}
}

 /**
  * Removes full horizontal lines.
  */
  
Game.prototype.remove_full_lines = function()
{
	var num = 0;
	for (var y = 0; y < this.height; y++) {
		if (this.is_line_full(y)) {
			num += 1;
			this.remove_full_line(y);
		}
	}
	this.score += num * num * this.width
}

 /**
  * Transfers the object into the playing field.
  */
  
Game.prototype.merge_obj = function()
{
	for (var y = 0; y < this.obj.height; y++) {
		for (var x = 0; x < this.obj.width; x++) {
			if (this.obj.data[y][x] != 0) {
				this.field[this.obj.y + y][this.obj.x + x] = this.obj.color;
			}
		}
	}
}

/**
 * Gets called when game is over
 */
 
Game.prototype.lost = function()
{
	this.game_over = true;
	alert('Game over. Score: ' + this.score);
}

/**
 * The game's tick() function.
 * 
 * The faster you call it, the harder it gets.
 */

Game.prototype.tick = function()
{
	if (this.game_over)
		return;

	var status = this.obj_can_move_down()

	switch (status) {
		case ST_CAN_MOVE:
			this.move_obj();
			this.score += 1;
			break;
		case ST_HITS_BOTTOM:
			this.merge_obj();
			this.remove_full_lines();
			this.generate_new_object();
			this.score += 2;
			break;
		case ST_HITS_TOP:
			this.lost();
			break;
	}
	
	// Game starts with 1 tick/sec
	// It gets 10% faster every 500 points
	this.tick_wait = 1000 * Math.pow(0.9, Math.floor(this.score/500));
}
