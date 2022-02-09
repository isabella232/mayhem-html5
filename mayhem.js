// General
var CURRENT_LEVEL = 1;
var NB_PLAYER = 4;

// Window
var WINDOW_WIDTH  = 1024;
var WINDOW_HEIGHT = 768;
var DISABLE_SOUND = false;

// Player views

//var SHIP1_X = 430;        // ie left
//var SHIP1_Y = 730;        // ie top

var SHIP1_X = 473;        // ie left
var SHIP1_Y = 303;        // ie top

var SHIP2_X = 520;        // ie left
var SHIP2_Y = 955;        // ie top

var SHIP3_X = 75;         // ie left
var SHIP3_Y = 1015;       // ie top

var SHIP4_X = 451;        // ie left
var SHIP4_Y = 501;        // ie top

var FPS     = 120;

var MAP_WIDTH  = 792;
var MAP_HEIGHT = 1200;

// Ship dynamics

var SHIP_MAX_LIVES = 10;
var SHIP_SPRITE_SIZE = 32;

var SHIP_ANGLESTEP = 2.4;
var SHIP_ANGLE_LAND = 24;
var LANDED_SLOW_DOWN_COEF = 4.0;

//var SHIP_MASS = 0.9;

var SHIP_THRUST_MAX = 0.04;
var iG       = 0.01 ;
var iXfrott  = 0.99;
var iYfrott  = 0.99;
var iCoeffax = 0.75;
var iCoeffay = 0.75;
var iCoeffvx = 0.75;
var iCoeffvy = 0.75;

var iCoeffimpact = 0.02;
var MAX_SHOOT = 20;

// platforms
var PLATFORMS_1 = [ [ 464, 513, 333 ],
                    [ 60, 127, 1045 ],
                    [ 428, 497, 531 ],
                    [ 504, 568, 985 ],
                    [ 178, 241, 875 ],
                    [ 8, 37, 187 ],
                    [ 302, 351, 271 ],
                    [ 434, 521, 835 ],
                    [ 499, 586, 1165 ],
                    [ 68, 145, 1181 ] ];

// TODO made that editable dynamically
// Keyboard / Gamepad controls
const K1_RIGHT  = 88; // x
const K1_LEFT   = 87; // w
const K1_THRUST = 86; // v
const K1_SHIELD = 67; // c
const K1_SHOOT  = 71; // g

const K2_RIGHT  = 39;  // arrow right
const K2_LEFT   = 37;  // arrow left
const K2_THRUST = 110; // . keypad
const K2_SHIELD = 96;  // 0 keypad
const K2_SHOOT  = 13;  // enter keypad

const BUTTON_THRUST = 0;
const BUTTON_SHIELD = 1;
const BUTTON_SHOOT  = 5;
const HORIZONTAL_AXIS = 0;
const HORIZONTAL_RIGHT = 1;
const HORIZONTAL_LEFT = -1;

const GAMEPADS_DICT = {}; // connected gamepads

// ------------------------------------------------------------------------------------------------

class Shot {

    constructor() {
        this.x = 0;
        this.y = 0;
        this.xposprecise = 0;
        this.yposprecise = 0;
        this.dx = 0;
        this.dy = 0;
    }
}

// ------------------------------------------------------------------------------------------------

class Ship {

    constructor(ship_name, game, screen_width, screen_height, ship_number, nb_player, xpos, ypos, lives) {

        let margin_size = 0;
        let w_percent = 1.0;
        let h_percent = 1.0;

        this.game = game;

        this.ship_number = ship_number;
        this.ship_name = ship_name;
        this.ship_ctx = this.game.ships_ctx[this.ship_name].getContext('2d');
        this.ship_current_pic = this.ship_name;

        this.view_width  = (screen_width * w_percent) / 2;
        this.view_height = (screen_height * h_percent) / 2;

        if(ship_number == 1) {
            this.view_left = margin_size;
            this.view_top = margin_size;
        }

        else if (ship_number == 2) {
            this.view_left = margin_size + this.view_width + margin_size
            this.view_top = margin_size                        
        }

        else if (ship_number == 3) {
            this.view_left = margin_size
            this.view_top = margin_size + this.view_height + margin_size
        }

        else if (ship_number == 4) {
            this.view_left = margin_size + this.view_width + margin_size
            this.view_top = margin_size + this.view_height + margin_size
        }

        this.right_pressed = false;
        this.left_pressed = false;
        this.thrust_pressed = false;
        this.shoot_pressed = false;
        this.shield_pressed = false;

        this.init_xpos = xpos;
        this.init_ypos = ypos;
        
        this.xpos = xpos;
        this.ypos = ypos;
        this.xposprecise = xpos;
        this.yposprecise = ypos;

        this.vx = 0.0;
        this.vy = 0.0;
        this.ax = 0.0;
        this.ay = 0.0;

        this.impactx = 0.0;
        this.impacty = 0.0;

        this.angle  = 0.0;
        this.thrust = 0.0;
        this.shield = false;
        this.shoot  = false;
        this.landed = false;
        this.bounce = false;
        this.explod = false;
        this.shoot_delay = false;

        this.lives = lives;
        this.shots = new Array();
    }

    reset() {
        this.xpos = this.init_xpos;
        this.ypos = this.init_ypos;

        this.xposprecise = this.xpos;
        this.yposprecise = this.ypos;

        this.vx = 0.0;
        this.vy = 0.0;
        this.ax = 0.0;
        this.ay = 0.0;

        this.impactx = 0.0;
        this.impacty = 0.0;

        this.angle  = 0.0;
        this.thrust = 0.0;
        this.shield = false;
        this.shoot  = false;
        this.landed = false;
        this.bounce = false;
        this.explod = false;
        this.shoot_delay = false;

        this.lives -= 1;

        this.game.sounds["thrust" + this.ship_name].stop();
        //this.sound_shoot.stop()
        //this.sound_shield.stop()
        this.game.sounds["bounce" + this.ship_name].stop();
        this.game.sounds["boom" + this.ship_name].play();
    }

    update() {

        this.ship_current_pic = this.ship_name;
        this.thrust = 0.0;
        this.shield = false;

        // shield ?
        if (this.shield_pressed) {
            this.ship_current_pic = this.ship_name + "_shield";
            this.shield = true;
            this.game.sounds["thrust" + this.ship_name].stop();
            this.game.sounds["shield" + this.ship_name].play();
        }
        else {
            this.game.sounds["shield" + this.ship_name].stop();

            // thrust ?
            if (this.thrust_pressed) {
                this.ship_current_pic = this.ship_name + "_thrust";
                this.thrust = SHIP_THRUST_MAX;
                this.landed = false;

                this.game.sounds["thrust" + this.ship_name].play();
            }
            else {
                this.game.sounds["thrust" + this.ship_name].stop();
            }
        }

        // shoot delay
        if (this.shoot_pressed && (!this.shoot)) {
            this.shoot_delay = true;
        }
        else {
            this.shoot_delay = false;
        }

        // shoot
        if (this.shoot_pressed) {
            this.shoot = true;

            if(this.shoot_delay) {

                if (this.shots.length < MAX_SHOOT) {
                    this.game.sounds["shoot" + this.ship_name].play();
                    this.add_shots();
                    //console.log(this.shots);
                }
                else {
                    //console.log(this.shots);
                }
            }
        }
        else {
            this.shoot = false;
            this.game.sounds["shoot" + this.ship_name].stop();
        }

        this.bounce = false;

        // not landed
        if (!this.landed) {

            if (this.right_pressed) {
                this.angle += SHIP_ANGLESTEP;
            }
            if (this.left_pressed) {
                this.angle -= SHIP_ANGLESTEP;
            }

            this.angle = ((this.angle % 360 ) + 360 ) % 360;
            //console.log(this.angle);

            // test simple thrust motion
            //if (this.thrust_pressed) {
            //    let coef = 1;
            //    this.xposprecise += coef * Math.sin( this.angle * Math.PI / 180 );
            //    this.yposprecise -= coef * Math.cos( this.angle * Math.PI / 180 );
            //}

            this.ax = this.thrust * Math.sin(this.angle * Math.PI / 180); // ax = thrust * sin1
            this.ay = iG + (this.thrust * -Math.cos(this.angle * Math.PI / 180)); // ay = g + thrust * (-cos1)

            // shoot when shield is on
            if (this.impactx || this.impacty) {
                this.ax += iCoeffimpact * this.impactx;
                this.ay += iCoeffimpact * this.impacty;
                this.impactx = 0.0;
                this.impacty = 0.0;
            }

            this.vx = this.vx + (iCoeffax * this.ax); // vx += coeffa * ax
            this.vy = this.vy + (iCoeffay * this.ay); // vy += coeffa * ay

            this.vx = this.vx * iXfrott;
            this.vy = this.vy * iYfrott;

            this.xposprecise = this.xposprecise + (iCoeffvx * this.vx); // xpos += coeffv * vx
            this.yposprecise = this.yposprecise + (iCoeffvy * this.vy); // ypos += coeffv * vy
        }

        // landed
        else {
            this.vx = 0.0;
            this.vy = 0.0;
            this.ax = 0.0;
            this.ay = 0.0;
        }

        // transfer to screen coordinates
        this.xpos = Math.round(this.xposprecise);
        this.ypos = Math.round(this.yposprecise);
        //this.xpos = Math.floor(this.xposprecise);
        //this.ypos = Math.floor(this.yposprecise);

        // landed ?
        this.is_landed();

        // rotate ship (https://stackoverflow.com/questions/32468969/rotating-a-sprite-in-a-canvas)
        this.ship_ctx.save();
        this.ship_ctx.clearRect(0, 0, SHIP_SPRITE_SIZE, SHIP_SPRITE_SIZE);

        this.ship_ctx.translate(SHIP_SPRITE_SIZE/2, SHIP_SPRITE_SIZE/2);
        this.ship_ctx.rotate(this.angle * Math.PI / 180);
        this.ship_ctx.translate(-SHIP_SPRITE_SIZE/2, -SHIP_SPRITE_SIZE/2);

        this.ship_ctx.drawImage(this.game.images[this.ship_current_pic], 0, 0, this.game.images[this.ship_current_pic].width, this.game.images[this.ship_current_pic].height);

        this.ship_ctx.restore();
    }

    plot_shots() {
        this.shots.forEach(function(shot, index, object) {
            
            shot.xposprecise += shot.dx;
            shot.yposprecise += shot.dy;
            shot.x = Math.round(shot.xposprecise);
            shot.y = Math.round(shot.yposprecise);             

            var map_pixel = this.game.map_buffer_ctx.getImageData(shot.x, shot.y, 1, 1).data;
            let map_pix_is_black = map_pixel[0]==0 && map_pixel[1]==0 && map_pixel[2]==0;

            if(!map_pix_is_black) {
                //console.log("Remove shot", shot);
                this.shots.splice(index, 1);
            }
            else {
                //this.game.map_buffer_ctx.beginPath();
                //this.game.map_buffer_ctx.moveTo(shot.x, shot.y);
                //this.game.map_buffer_ctx.lineTo(shot.x+1, shot.y+1);
                //this.game.map_buffer_ctx.strokeStyle = '#ffffff';
                //this.game.map_buffer_ctx.stroke();

                this.game.map_buffer_ctx.fillStyle = '#ffffff';
                this.game.map_buffer_ctx.fillRect(shot.x, shot.y, 1, 1);
            }

        }, this)

/*                    for shot in list(self.shots): # copy of self.shots
            shot.xposprecise += shot.dx
            shot.yposprecise += shot.dy
            shot.x = int(shot.xposprecise)
            shot.y = int(shot.yposprecise)

            try:
                c = map_buffer.get_at((int(shot.x), int(shot.y)))
                if (c.r != 0) or (c.g != 0) or (c.b != 0):
                    self.shots.remove(shot)

                pygame.draw.circle(map_buffer, WHITE, (int(shot.x) , int(shot.y)), 1)

            # out of surface
            except IndexError:
                self.shots.remove(shot)*/

    }

    add_shots() {
        let shot = new Shot();

        shot.x = (this.xpos+15) + 18 * Math.sin(this.angle * Math.PI / 180);
        shot.y = (this.ypos+16) + 18 * -Math.cos(this.angle * Math.PI / 180);
        shot.xposprecise = shot.x;
        shot.yposprecise = shot.y;
        shot.dx = 5.1 * Math.sin(this.angle * Math.PI / 180);
        shot.dy = 5.1 * -Math.cos(this.angle * Math.PI / 180);
        shot.dx += this.vx / 3.5;
        shot.dy += this.vy / 3.5;

        this.shots.push(shot);
    }

    draw() {
        // the sequence is update() => collide_map() => draw()
        // blit rotated ship into the map (! only after collision check)
        this.game.map_buffer_ctx.drawImage(this.game.ships_ctx[this.ship_name], 0, 0, SHIP_SPRITE_SIZE, SHIP_SPRITE_SIZE, this.xpos, this.ypos, SHIP_SPRITE_SIZE, SHIP_SPRITE_SIZE);
    }

    collide_map() {

        if(this.do_test_collision()) {
            var ship_pixels = this.ship_ctx.getImageData(0, 0, SHIP_SPRITE_SIZE, SHIP_SPRITE_SIZE).data;
            var map_pixels  = this.game.map_buffer_ctx.getImageData(this.xpos, this.ypos, SHIP_SPRITE_SIZE, SHIP_SPRITE_SIZE).data;
            
            // 1 dim array: r g b a ...
            for (let i = 0; i < ship_pixels.length; i += 4) {
                //let x = (i / 4) % SHIP_SPRITE_SIZE;
                //var y = Math.floor(Math.floor(i/SHIP_SPRITE_SIZE)/4);

                let map_pix_is_black = map_pixels[i]==0 && map_pixels[i+1]==0 && map_pixels[i+2]==0

                if( ship_pixels[i+3]==255 && !map_pix_is_black ) {
                    this.explod = true;
                    break;
                }
            }
        }
    }

    collide_ship(ships) {

        // TODO real pixel perfect collision
        ships.forEach(function(other_ship) {
            if(this.ship_number != other_ship.ship_number) {
                let d = Math.sqrt( Math.pow((this.xpos+16 - (other_ship.xpos+16)), 2) + Math.pow((this.ypos+16 - (other_ship.ypos+16)), 2) );
                //if(this.ship_number==1 && other_ship.ship_number==2)
                //    console.log(d);
                if(d < (SHIP_SPRITE_SIZE-3)) {
                    this.explod = true;
                    other_ship.explod = true;
                }
            }
        }, this)

        //for ship in ships:
        //    if self != ship:
        //        offset = ((ship.xpos - self.xpos), (ship.ypos - self.ypos))
        //        if self.mask.overlap(ship.mask, offset):
        //            self.explod = True
        //            ship.explod = True
    }

    collide_shots(ships) {

        for(const ship of ships) {
            if(this.ship_number != ship.ship_number) {
                for(const shot of ship.shots) {

                    let d = Math.sqrt( Math.pow((this.xpos+16 - shot.x), 2) + Math.pow((this.ypos+16 - shot.y), 2) );

                    if(d < (SHIP_SPRITE_SIZE/2)) {

                        if (!this.shield) {
                            this.explod = true;
                            // TODO remove shot from shots
                        }
                        else {
                            this.impactx = shot.dx;
                            this.impacty = shot.dy;
                        }
                    }
                }
            }
        }

    }

    do_test_collision() {
        let test_it = true

        for(const plaform of PLATFORMS_1) {
            let xmin  = plaform[0] - (SHIP_SPRITE_SIZE - 23);
            let xmax  = plaform[1] - (SHIP_SPRITE_SIZE - 9);
            let yflat = plaform[2] - (SHIP_SPRITE_SIZE - 2);

            if (this.shield && (xmin<=this.xpos) && (this.xpos<=xmax) && ((this.ypos==yflat) || ((this.ypos-1)==yflat) || ((this.ypos-2)==yflat) || ((this.ypos-3)==yflat) || ((this.ypos+1)==yflat)) &&  (this.angle<=SHIP_ANGLE_LAND || this.angle>=(360-SHIP_ANGLE_LAND)) ) {
                test_it = false;
                break;
            }

            if ((this.thrust) && (xmin<=this.xpos) && (this.xpos<=xmax) && ((this.ypos==yflat) || ((this.ypos-1)==yflat) || ((this.ypos+1)==yflat) )) {
                test_it = false;
                break;
            }
        }

        return test_it
    }

    is_landed() {

        for(const plaform of PLATFORMS_1) {
            let xmin  = plaform[0] - (SHIP_SPRITE_SIZE - 23);
            let xmax  = plaform[1] - (SHIP_SPRITE_SIZE - 9);
            let yflat = plaform[2] - (SHIP_SPRITE_SIZE - 2);

            if ((xmin <= this.xpos) && (this.xpos <= xmax) &&
               ((this.ypos == yflat) || ((this.ypos-1) == yflat) || ((this.ypos-2) == yflat) || ((this.ypos-3) == yflat) ) &&
               (this.vy > 0) && (this.angle<=SHIP_ANGLE_LAND || this.angle>=(360-SHIP_ANGLE_LAND)) ) {

                this.vy = - this.vy / 1.2;
                this.vx = this.vx / 1.1;
                this.angle = 0;
                this.ypos = yflat;
                this.yposprecise = yflat;

                if ( (-1.0/LANDED_SLOW_DOWN_COEF <= this.vx) && (this.vx < 1.0/LANDED_SLOW_DOWN_COEF) && (-1.0/LANDED_SLOW_DOWN_COEF < this.vy) && (this.vy < 1.0/LANDED_SLOW_DOWN_COEF) ) {
                    this.landed = true;
                    this.bounce = false;
                }
                else {
                    this.bounce = true;
                    this.game.sounds["bounce" + this.ship_name].play();
                }

                return true;
            }
        }
    } // is landed

} // Ship class

// ------------------------------------------------------------------------------------------------

class MayhemEnv {

    constructor(game, nb_player) {
        this.nb_player = nb_player;
        this.game = game;

        this.accumulated_time = 0;          // window.performance.now();
        this.time_step        = 1000/FPS    // update rate

        document.addEventListener('keydown', this.key_down_handler.bind(this), false);
        document.addEventListener('keyup', this.key_up_handler.bind(this), false);
        window.addEventListener("gamepadconnected", this.gamepadConnect.bind(this));
        window.addEventListener("gamepaddisconnected", this.gamepadDisconnect.bind(this));

        this.ship_1 = new Ship("ship1", this.game, this.game.screen_width, this.game.screen_height, 1, nb_player, SHIP1_X, SHIP1_Y, SHIP_MAX_LIVES);
        this.ship_2 = new Ship("ship2", this.game, this.game.screen_width, this.game.screen_height, 2, nb_player, SHIP2_X, SHIP2_Y, SHIP_MAX_LIVES);
        this.ship_3 = new Ship("ship3", this.game, this.game.screen_width, this.game.screen_height, 3, nb_player, SHIP3_X, SHIP3_Y, SHIP_MAX_LIVES);
        this.ship_4 = new Ship("ship4", this.game, this.game.screen_width, this.game.screen_height, 4, nb_player, SHIP4_X, SHIP4_Y, SHIP_MAX_LIVES);

        this.ships = new Array();
        
        this.ships.push(this.ship_1);

        if (nb_player >= 2) {
            this.ships.push(this.ship_2)
        }
        if (nb_player >= 3) {
            this.ships.push(this.ship_3)
        }
        if (nb_player >= 4) {
            this.ships.push(this.ship_4)
        }

        this.frames = 0;

        window.requestAnimationFrame(this.main_loop.bind(this));
    }

    main_loop(time_stamp) {
        // time_stamp = amount of time in milliseconds that has passed since the start
        //console.log("main_loop", time_stamp);

        // TODO check keys here

        // Only redraw and update the game if enough time has passed
        if (time_stamp >= this.accumulated_time + this.time_step) {

            // drop frames ?
            if (time_stamp - this.accumulated_time >= this.time_step * 4) {
                this.accumulated_time = time_stamp;
            }

            while(this.accumulated_time < time_stamp) {
                this.accumulated_time += this.time_step;
                
                // Add Gamepads if any connected
                this.addNewPads();

                // TODO made that editable dynamically
                // ship control mapping pref: gamepad vs keyboard
                this.keyboard1_ship = this.ship_1;

                this.gamepad_player_mapping = {};
                this.gamepad_player_mapping[0] = this.ship_2;
                this.gamepad_player_mapping[1] = this.ship_3;

                if(Object.keys(GAMEPADS_DICT).length==0) {
                    this.keyboard2_ship = this.ship_2;
                }
                else if (Object.keys(GAMEPADS_DICT).length==1) {
                    this.keyboard2_ship = this.ship_3;
                }
                else if (Object.keys(GAMEPADS_DICT).length==2) {
                    this.keyboard2_ship = this.ship_4;
                }

                // gamepad controls
                this.processGamepads();

                // --- update ship pos
                for(const ship of this.ships) {
                    ship.update();
                }
            }

            // --- render

            // clear
            this.game.window_ctx.clearRect(0, 0, this.game.window.width, this.game.window.height);

            // draw map into its canvas buffer
            this.game.map_buffer_ctx.drawImage(this.game.images["map"], 0, 0, MAP_WIDTH, MAP_HEIGHT, 0, 0, MAP_WIDTH, MAP_HEIGHT);

            // collision map
            for(const ship of this.ships) {
                ship.collide_map();
            }

            // collision ship
            this.ships.forEach(function(ship) {
                ship.collide_ship(this.ships);
            }, this)

            // plot shots
            this.ships.forEach(function(ship) {
                ship.plot_shots();
            }, this)

            // collide shots
            this.ships.forEach(function(ship) {
                ship.collide_shots(this.ships);
            }, this)

            // draw ship
            this.ships.forEach(function(ship) {
                ship.draw();
            })

            // clipping to avoid black when the ship is close to the edges
            this.ships.forEach(function(ship) {
                let rx = ship.xpos - ship.view_width/2;
                let ry = ship.ypos - ship.view_height/2;

                if(rx < 0) {
                    rx = 0;
                }
                else if(rx > (MAP_WIDTH - ship.view_width)) {
                    rx = (MAP_WIDTH - ship.view_width);
                }
                if(ry < 0) {
                    ry = 0;
                }
                else if(ry > (MAP_HEIGHT - ship.view_height)) {
                    ry = (MAP_HEIGHT - ship.view_height);
                }

                // blit the map area around the ship on the screen
                //void ctx.drawImage(image, sx, sy, sLargeur, sHauteur, dx, dy, dLargeur, dHauteur);
                this.game.window_ctx.drawImage(this.game.map_buffer, rx, ry, ship.view_width, ship.view_height, ship.view_left, ship.view_top, ship.view_width, ship.view_height);
            }, this)

            // reset on explode
            this.ships.forEach(function(ship) {
                if (ship.explod) {
                    ship.reset();
                }
            })

            // Split screen
            this.game.window_ctx.beginPath();
            this.game.window_ctx.moveTo(this.game.screen_width/2, 0);
            this.game.window_ctx.lineTo(this.game.screen_width/2, this.game.screen_height);
            this.game.window_ctx.moveTo(0, this.game.screen_height/2);
            this.game.window_ctx.lineTo(this.game.screen_width, this.game.screen_height/2);
            this.game.window_ctx.moveTo(0, 0);
            this.game.window_ctx.lineTo(this.game.screen_width, 0);
            this.game.window_ctx.moveTo(this.game.screen_width, 0);
            this.game.window_ctx.lineTo(this.game.screen_width, this.game.screen_height);
            this.game.window_ctx.moveTo(this.game.screen_width, this.game.screen_height);
            this.game.window_ctx.lineTo(0, this.game.screen_height);
            this.game.window_ctx.moveTo(0, this.game.screen_height);
            this.game.window_ctx.lineTo(0, 0);

            this.game.window_ctx.lineWidth = 1.0;
            this.game.window_ctx.strokeStyle = '#aaaaaa';
            this.game.window_ctx.stroke();

            // frame count
            this.frames += 1;
        }

        window.requestAnimationFrame(this.main_loop.bind(this));
    } 

    key_down_handler(event) {

        // keyboard1 ship
        if(event.keyCode == K1_RIGHT) {
            this.keyboard1_ship.right_pressed = true;
        }
        if(event.keyCode == K1_LEFT) {
            this.keyboard1_ship.left_pressed = true;
        }
        if(event.keyCode == K1_THRUST) {
            this.keyboard1_ship.thrust_pressed = true;
        }
        if(event.keyCode == K1_SHIELD) {
            this.keyboard1_ship.shield_pressed = true;
        }
        if(event.keyCode == K1_SHOOT) {
            this.keyboard1_ship.shoot_pressed = true;
        }

        // keyboard2 ship
        if(event.keyCode == K2_RIGHT) {
            this.keyboard2_ship.right_pressed = true;
        }
        if(event.keyCode == K2_LEFT) {
            this.keyboard2_ship.left_pressed = true;
        }
        if(event.keyCode == K2_THRUST) {
            this.keyboard2_ship.thrust_pressed = true;
        }
        if(event.keyCode == K2_SHIELD) {
            this.keyboard2_ship.shield_pressed = true;
        }
        if(event.keyCode == K2_SHOOT) {
            this.keyboard2_ship.shoot_pressed = true;
        }

    }

    key_up_handler(event) {

        // keyboard1 ship
        if(event.keyCode == K1_RIGHT) {
            this.keyboard1_ship.right_pressed = false;
        }
        if(event.keyCode == K1_LEFT) {
            this.keyboard1_ship.left_pressed = false;
        }
        if(event.keyCode == K1_THRUST) {
            this.keyboard1_ship.thrust_pressed = false;
        }
        if(event.keyCode == K1_SHIELD) {
            this.keyboard1_ship.shield_pressed = false;
        }
        if(event.keyCode == K1_SHOOT) {
            this.keyboard1_ship.shoot_pressed = false;
        }

        // keyboard2 ship
        if(event.keyCode == K2_RIGHT) {
            this.keyboard2_ship.right_pressed = false;
        }
        if(event.keyCode == K2_LEFT) {
            this.keyboard2_ship.left_pressed = false;
        }
        if(event.keyCode == K2_THRUST) {
            this.keyboard2_ship.thrust_pressed = false;
        }
        if(event.keyCode == K2_SHIELD) {
            this.keyboard2_ship.shield_pressed = false;
        }
        if(event.keyCode == K2_SHOOT) {
            this.keyboard2_ship.shoot_pressed = false;
        }
    }

    gamepadConnect(e) {
        console.log('gamepadConnect', e);
        this.addGamepadIfNew(e.gamepad);
    }

    gamepadDisconnect(e) {
        console.log('gamepadDisconnect', e);
        this.removeGamepad(e.gamepad);
    }

    removeGamepad(gamepad) {
        console.log('removeGamepad', gamepad);

        const info = GAMEPADS_DICT[gamepad.index];

        if (info) {
            delete GAMEPADS_DICT[gamepad.index];
        }
    }

    addGamepadIfNew(gamepad) {
        const info = GAMEPADS_DICT[gamepad.index];

        if (!info) {
            this.addGamepad(gamepad);
        } else {
            // This broke sometime in the past. It used to be
            // the same gamepad object was returned forever.
            // Then Chrome only changed to a new gamepad object
            // is returned every frame.
            info.gamepad = gamepad;
        }
    }

    addGamepad(gamepad) {
        console.log("addGamepad");
        GAMEPADS_DICT[gamepad.index] = {gamepad};

    }

    addNewPads() {
        const gamepads = navigator.getGamepads();

        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i]
            if (gamepad) {
                this.addGamepadIfNew(gamepad);
            }
        }
    }

    processGamepads() {
        //console.log("Gamepads=", GAMEPADS_DICT);

        for (const [gamepad_index, gamepad] of Object.entries(GAMEPADS_DICT)) {
            let gp      = gamepad.gamepad;
            let gp_ship = this.gamepad_player_mapping[gamepad_index];

            if(gp.buttons[BUTTON_THRUST].pressed) {
                gp_ship.thrust_pressed = true;
            }
            else {
                gp_ship.thrust_pressed = false;
            }
            if(gp.buttons[BUTTON_SHIELD].pressed) {
                gp_ship.shield_pressed = true;
            }
            else {
                gp_ship.shield_pressed = false;
            }
            if(gp.buttons[BUTTON_SHOOT].pressed) {
                gp_ship.shoot_pressed = true;
            }
            else {
                gp_ship.shoot_pressed = false;
            }

            if(gp.axes[HORIZONTAL_AXIS] == HORIZONTAL_RIGHT) {
                gp_ship.right_pressed = true;
            }
            else {
                gp_ship.right_pressed = false;
            }
            if(gp.axes[HORIZONTAL_AXIS] == HORIZONTAL_LEFT) {
                gp_ship.left_pressed = true;
            }
            else {
                gp_ship.left_pressed = false;
            }  

            //for(let button_number=0; button_number<gp.buttons.length; button_number++) {
            //    if(gp.buttons[button_number].pressed)
            //        console.log("Pressed: ", button_number);
            //}

        }
    }


} // MayhemEnv

// ------------------------------------------------------------------------------------------------

class GameWindow {

    constructor(screen_width, screen_height) {
        this.screen_width = screen_width;
        this.screen_height = screen_height;

        //this.window = document.createElement("canvas");
        //this.window.width = screen_width;
        //this.window.height = screen_height;
        //this.window_ctx    = this.window.getContext('2d');
        //document.body.appendChild(this.window);

        this.window = document.getElementById('mainGameCanvas');
        this.window.width  = screen_width;
        this.window.height = screen_height;
        this.window_ctx    = this.window.getContext('2d');

        this.images_assets = {
            map             : "assets/level1/Mayhem_Level1_Map_256c_alpha.png",
            ship1           : "assets/default/ship1_256c_alpha.png",
            ship1_thrust    : "assets/default/ship1_thrust_256c_alpha.png",
            ship1_shield    : "assets/default/ship1_shield_256c_alpha.png",
            ship2           : "assets/default/ship2_256c_alpha.png",
            ship2_thrust    : "assets/default/ship2_thrust_256c_alpha.png",
            ship2_shield    : "assets/default/ship2_shield_256c_alpha.png",
            ship3           : "assets/default/ship3_256c_alpha.png",
            ship3_thrust    : "assets/default/ship3_thrust_256c_alpha.png", 
            ship3_shield    : "assets/default/ship3_shield_256c_alpha.png",
            ship4           : "assets/default/ship4_256c_alpha.png",
            ship4_thrust    : "assets/default/ship4_thrust_256c_alpha.png", 
            ship4_shield    : "assets/default/ship4_shield_256c_alpha.png"
        };

        this.map_buffer = document.createElement('canvas');
        this.map_buffer.width = MAP_WIDTH;
        this.map_buffer.height = MAP_HEIGHT;
        this.map_buffer_ctx = this.map_buffer.getContext('2d');

        this.images = {};
        this.ships_ctx = {}; // each image has its own context

        this.sounds_assets = {
            thrust          : "assets/default/sfx_loop_thrust.ogg",
            boom            : "assets/default/sfx_boom.ogg",
            refuel          : "assets/default/sfx_loop_refuel.ogg",
            shield          : "assets/default/sfx_loop_shield.ogg",
            bounce          : "assets/default/sfx_rebound.ogg",
            shoot           : "assets/default/sfx_shoot.ogg"
        };

        this.sounds = {};
    }

    load_images(callback) {
        let nb_loaded_images = 0;
        let nb_images        = Object.keys(this.images_assets).length;

        for (let key in this.images_assets) {
            this.images[key] = new Image();

            this.images[key].onload = function() {        

                if (++nb_loaded_images >= nb_images) {
                    console.log("Images loaded");
                    this.load_sounds(callback);
                }

            }.bind(this);

            this.images[key].onerror = function() {
                alert("Failed to load image, check console output for details");
            };

            this.images[key].src = this.images_assets[key];
        }
    } 

    load_sounds(callback) {

        // custom stop
        HTMLAudioElement.prototype.stop = function()
        {
            this.pause();
            this.currentTime = 0;
        }

        //
        let nb_loaded_sounds    = 0;
        let nb_sounds           = Object.keys(this.sounds_assets).length;
        const ship_names        = ['ship1', 'ship2', 'ship3', 'ship4'];
        let nb_ships            = Object.keys(ship_names).length;

        for (const ship of ship_names) {

            for (let key in this.sounds_assets) {
                this.sounds[key + ship] = new Audio();

                // onload
                this.sounds[key + ship].onloadeddata = function() {    

                    if (++nb_loaded_sounds >= nb_sounds * nb_ships) {
                        console.log("Sounds loaded");
                        callback();
                    }
                };
                
                // onerror
                this.sounds[key + ship].onerror = function() {
                    alert("Failed to load sounds, check console output for details");
                };

                // onplay
                this.sounds[key + ship].onplay = function() {

                    if(DISABLE_SOUND) {
                        this.sounds[key + ship].muted = true;
                    }
                    else {
                        this.sounds[key + ship].muted = false;
                    }
                    
                }.bind(this);

                // trying a gapless loop for looping sounds
                //if (this.sounds_assets[key].includes("loop") && !this.sounds_assets[key].includes("shield")) {
                if (this.sounds_assets[key].includes("loop") ) {

                    if (this.sounds_assets[key].includes("shield") ) {
                        this.sounds[key + ship].addEventListener('timeupdate', function() {
                            
                            var buffer = .34;

                            if(this.currentTime > this.duration - buffer){
                                this.currentTime = 0;
                                this.play();
                            }
                        });
                    }
                    else {
                        this.sounds[key + ship].addEventListener('timeupdate', function() {
                            
                            var buffer = .44;

                            if(this.currentTime > this.duration - buffer){
                                this.currentTime = 0;
                                this.play();
                            }
                        });
                    }

                }

                this.sounds[key + ship].src = this.sounds_assets[key];

            } // for all sound assets
        } // for all ships

    } 

    start_game() {
        console.log("Starting...");

        // create canvas/ctx for ship images
        for (let key in this.images) {
            if (key.startsWith("ship")) {
                let c = document.createElement("canvas");
                c.width = this.images[key].width;
                c.height = this.images[key].height;

                let c_ctx = c.getContext('2d');
                //c_ctx.drawImage(this.images[key], 0, 0, this.images[key].width, this.images[key].height);
                this.ships_ctx[key] = c;
            }
        }

        let mayhem_env = new MayhemEnv(this, NB_PLAYER);
    } 

}

// ------------------------------------------------------------------------------------------------

window.onload = function() {
    console.log("window.onload");

    let game_window = new GameWindow(WINDOW_WIDTH, WINDOW_HEIGHT);

    game_window.load_images(game_window.start_game.bind(game_window));
}
