// src/game/player.js
import playerSprite from "../assets/player/player.png"; // make sure this file exists

//initializes a new image
const playerImg = new Image();
//the new image is the player sprite
playerImg.src = playerSprite;

//creates and exports the function createPlayer with the variables character, canvas width and height

//this is a factory function that returns a new object when called
//creates a player when called and exports it
export function createPlayer(character, canvasWidth, canvasHeight) {
  const size = 15;

  //returns properties, methods, and draw
  return {
    //set spawn point
    x: canvasWidth / 2,
    y: canvasHeight / 2,

    //set size
    size,

    facingRight: true, // true = right, false = left

    //sets hp to character's maxHp
    hp: character.maxHp,
    maxHp: character.maxHp,
//character max mana
    mana: character.maxMana || 100,
    maxMana: character.maxMana || 100,
    //mana regen
    manaRegen: character.manaRegen || 0.2,

    //velocity / speed of character
    speed: character.speed,
    color: character.color,

    moveTarget: { x: canvasWidth / 2, y: canvasHeight / 2 },

    //methods are returned
    update() {
      // --- Movement ---
      //defines vector from player to the target (mouse click)
      const dx = this.moveTarget.x - this.x;
      const dy = this.moveTarget.y - this.y;
      //the length of the vector by pythagorean theorem
      //A i anden + B i anden = C i anden, længden af C er afstanden
      const dist = Math.sqrt(dx * dx + dy * dy);

      //if distance is more than 1 
      if (dist > 1) {
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;

        // flip sprite based on horizontal movement
        this.facingRight = dx >= 0;
      }

      // --- Mana Regen ---
      //hvis objektets mana er mindre end dets max mana
      if (this.mana < this.maxMana) {
        //this mana is = return either max mana OR current mana + mana regen parameters
        this.mana = Math.min(this.maxMana, this.mana + this.manaRegen);
      }
    },

    //draws the player
    draw(ctx) {
      ctx.save(); //stores current state of player
      ctx.translate(this.x, this.y); //moves origin to player's position

      // Flip horizontally if facing left
      ctx.scale(this.facingRight ? 1 : -1, 1);

      // Draw sprite
      if (playerImg.complete && playerImg.naturalWidth > 0) {
        ctx.drawImage(
          playerImg,
          -this.size, // center horizontally
          -this.size, // center vertically
          this.size * 2,
          this.size * 2
        );
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Draw HP / Mana bars as before
      const barWidth = this.size * 2;
      const barHeight = 4;
      const hpPercent = this.hp / this.maxHp;

      //context fill style is black
      ctx.fillStyle = "black";
      ctx.fillRect(this.x - this.size, this.y - this.size - 10, barWidth, barHeight);

      ctx.fillStyle = hpPercent > 0.5 ? "lime" : hpPercent > 0.2 ? "yellow" : "red";
      ctx.fillRect(this.x - this.size, this.y - this.size - 10, barWidth * hpPercent, barHeight);

      ctx.strokeStyle = "white";
      ctx.strokeRect(this.x - this.size, this.y - this.size - 10, barWidth, barHeight);

      const manaPercent = this.mana / this.maxMana;
      ctx.fillStyle = "black";
      ctx.fillRect(this.x - this.size, this.y - this.size - 16, barWidth, barHeight);

      ctx.fillStyle = "blue";
      ctx.fillRect(this.x - this.size, this.y - this.size - 16, barWidth * manaPercent, barHeight);

      ctx.strokeStyle = "white";
      ctx.strokeRect(this.x - this.size, this.y - this.size - 16, barWidth, barHeight);
    },
  };
}
