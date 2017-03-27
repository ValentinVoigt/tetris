function Game_Renderer(game)
{
	this.game = game;
	this.container = $('#game');
	this.container_preview = $('#preview');
	this.container_score = $('#score span');
	this.container_game_over = $('#gameover');
	this.setup();
}

function Game_Renderer_Block(y, x, height, width)
{
	this.html = $('<div class="block"></div>');
	this.set_pos(y, x);
	this.set_size(height, width);
	this.set_color(0);
}

/**
 * Sets the size of the block
 */

Game_Renderer_Block.prototype.set_size = function(height, width)
{
	this.height = height;
	this.width = width;
	this.html.css('height', height + "px");
	this.html.css('width', width + "px");
}

/**
 * Sets the position of the block
 */

Game_Renderer_Block.prototype.set_pos = function(y, x)
{
	this.y = y;
	this.x = x;
	this.html.css('top', y + "px");
	this.html.css('left', x + "px");
}

/**
 * Sets the color of a block
 *
 * Color is a css-compartible string.
 */

Game_Renderer_Block.prototype.set_color = function(color)
{
	this.color = color;
	this.html.toggleClass('active', color != 0);
	if (color == 0) {
		this.html.css('background-color', '#ff00ff');
	} else {
		this.html.css('background-color', color);
	}
}

/**
 * Removes all content from the conainer.
 */

 Game_Renderer.prototype.clear = function()
 {
 	this.container.innerHTML = '';
 }

/**
 * Setups up the playing field.
 */
 
Game_Renderer.prototype.setup = function()
{
	this.clear();

	// Calculate max block dimensions
 	this.block_width = Math.floor(0.6 * $(window).width() / this.game.width);
	this.block_height = Math.floor(0.8 * $(window).height() / this.game.height);
	
	// Make them quadratic
	if (this.block_width > this.block_height) {
		this.block_width = this.block_height;
	} else {
		this.block_height = this.block_width;
	}
	
	// Adjust container size
	this.container.css('height', (this.block_height * this.game.height) + "px");
	this.container.css('width', (this.block_width * this.game.width) + "px");
	
	// Create divs and append divs to containers
	this.divs = new Array(this.game.height);
	for (var y = 0; y < this.game.height; y++) {
		this.divs[y] = new Array(this.game.width);
		for (var x = 0; x < this.game.width; x++) {
			this.divs[y][x] = new Game_Renderer_Block(
				y * this.block_height,
				x * this.block_width,
				this.block_height,
				this.block_width
			);
			this.container.append(this.divs[y][x].html);
		}
	}

	// Do the same again for block preview
	this.container_preview.css('height', (this.block_height * 4) + "px");
	this.container_preview.css('width', (this.block_width * 4) + "px");

	this.preview_divs = new Array(4);
	for (var y = 0; y < 4; y++) {
		this.preview_divs[y] = new Array(4);
		for (var x = 0; x < 4; x++) {
			this.preview_divs[y][x] = new Game_Renderer_Block(
				y * this.block_height,
				x * this.block_width,
				this.block_height,
				this.block_width
			);
			this.container_preview.append(this.preview_divs[y][x].html);
		}
	}
	
	// Redraw field when key is pressed
	this.game.on_key_down_hook = function (data, e) { data.render(); }
	this.game.on_key_down_hook.data = this;
}
 
/**
 * Renders the entire playing field.
 */

Game_Renderer.prototype.render = function()
{
	// Render playing field
	for (var y = 0; y < this.game.height; y++) {
		for (var x = 0; x < this.game.width; x++) {
			this.divs[y][x].set_color(this.game.field[y][x]);
		}
	}
	
	// Render current block
	for (var y = 0; y < this.game.obj.data.length; y++) {
		for (var x = 0; x < this.game.obj.data[y].length; x++) {
			if (this.game.obj.data[y][x] == 1) {
				this.divs[this.game.obj.y + y][this.game.obj.x + x].set_color(this.game.obj.color);
			}
		}
	}

	// Render next block
	for (var y = 0; y < 4; y++) {
		for (var x = 0; x < 4; x++) {
			if (y < this.game.next_obj.data.length && x < this.game.next_obj.data[y].length && this.game.next_obj.data[y][x] == 1) {
				this.preview_divs[y][x].set_color(this.game.next_obj.color);
			} else {
				this.preview_divs[y][x].set_color(0);
			}
		}
	}
	
	// Render score and stuff
	this.container_score.text(this.game.score);
	this.container_game_over.toggle(this.game.game_over);
}
