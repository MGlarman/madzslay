// src/game/skills.js
import { SkillEffect } from "./skillEffects";

export class SkillsManager {
  constructor(player, projectiles, skillEffectsManager, enemies, character) {
    this.player = player;
    this.projectiles = projectiles;
    this.skillEffectsManager = skillEffectsManager;
    this.enemies = enemies;
    this.character = character;

    this.cooldowns = { q: 0, w: 0, e: 0, r: 0 };
    this.maxCooldown = { q: 60, w: 90, e: 300, r: 600 };

    // Mana costs for each skill
    this.manaCosts = { q: 20, w: 30, e: 40, r: 80 };
  }

  updateCooldowns() {
    for (let key in this.cooldowns) {
      if (this.cooldowns[key] > 0) this.cooldowns[key]--;
    }
  }

  cast(skill, targetX, targetY) {
    // Check cooldown
    if (this.cooldowns[skill] > 0) return 0;

    // Check mana
    const cost = this.manaCosts[skill] || 0;
    if (this.player.mana < cost) return 0;

    // Spend mana
    this.player.mana -= cost;

    let kills = 0;

    // Trigger skill
    switch (this.character.name.toLowerCase()) {
      case "warrior":
        kills = this.warriorSkills(skill, targetX, targetY);
        break;
      case "assassin":
        kills = this.assassinSkills(skill, targetX, targetY);
        break;
      case "tank":
        kills = this.tankSkills(skill, targetX, targetY);
        break;
    }

    return kills;
  }

  // ---------------- Warrior ----------------
  warriorSkills(skill, targetX, targetY) {
    let kills = 0;

    switch (skill) {
      case "q": {
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.player.x += (dx / dist) * 120;
        this.player.y += (dy / dist) * 120;

        const effect = new SkillEffect(this.player.x, this.player.y, 15, "lime", 0);
        this.skillEffectsManager.add(effect);

        this.cooldowns.q = this.maxCooldown.q;
        break;
      }
      case "w": {
        const effect = new SkillEffect(this.player.x, this.player.y, 100, "lime", 15);
        kills = effect.apply(this.enemies.enemies);
        this.skillEffectsManager.add(effect);
        this.cooldowns.w = this.maxCooldown.w;
        break;
      }
      case "e": {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        const effect = new SkillEffect(this.player.x, this.player.y, 20, "cyan", 0);
        this.skillEffectsManager.add(effect);
        this.cooldowns.e = this.maxCooldown.e;
        break;
      }
      case "r": {
        const effect = new SkillEffect(this.player.x, this.player.y, 50, "orange", 50);
        kills = effect.apply(this.enemies.enemies);
        this.skillEffectsManager.add(effect);
        this.cooldowns.r = this.maxCooldown.r;
        break;
      }
    }

    return kills;
  }

  // ---------------- Assassin ----------------
  assassinSkills(skill, targetX, targetY) {
    let kills = 0;

    switch (skill) {
      case "q":
        this.player.x = targetX;
        this.player.y = targetY;
        const qEffect = new SkillEffect(this.player.x, this.player.y, 20, "cyan", 0);
        this.skillEffectsManager.add(qEffect);
        this.cooldowns.q = this.maxCooldown.q;
        break;
      case "w":
        this.projectiles.shoot(this.player.x, this.player.y, targetX, targetY, 15, "cyan");
        const wEffect = new SkillEffect(targetX, targetY, 10, "cyan", 0);
        this.skillEffectsManager.add(wEffect);
        this.cooldowns.w = this.maxCooldown.w;
        break;
      case "e":
        const eEffect = new SkillEffect(this.player.x, this.player.y, 120, "green", 10);
        kills = eEffect.apply(this.enemies.enemies);
        this.skillEffectsManager.add(eEffect);
        this.cooldowns.e = this.maxCooldown.e;
        break;
      case "r":
        const rEffect = new SkillEffect(this.player.x, this.player.y, 50, "purple", 40);
        kills = rEffect.apply(this.enemies.enemies);
        this.skillEffectsManager.add(rEffect);
        this.cooldowns.r = this.maxCooldown.r;
        break;
    }

    return kills;
  }

  // ---------------- Tank ----------------
  tankSkills(skill, targetX, targetY) {
    let kills = 0;

    switch (skill) {
      case "q": {
        const effect = new SkillEffect(this.player.x, this.player.y, 150, "orange", 10);
        kills = effect.apply(this.enemies.enemies);
        this.enemies.enemies.forEach(enemy => {
          const dx = enemy.x - this.player.x;
          const dy = enemy.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            enemy.x += (dx / dist) * 50;
            enemy.y += (dy / dist) * 50;
          }
        });
        this.skillEffectsManager.add(effect);
        this.cooldowns.q = this.maxCooldown.q;
        break;
      }
      case "w": {
        const effect = new SkillEffect(this.player.x, this.player.y, 30, "red", 0);
        this.enemies.enemies.forEach(enemy => (enemy.speed *= 0.5));
        this.skillEffectsManager.add(effect);
        this.cooldowns.w = this.maxCooldown.w;
        break;
      }
      case "e": {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
        const eEffect = new SkillEffect(this.player.x, this.player.y, 20, "cyan", 0);
        this.skillEffectsManager.add(eEffect);
        this.cooldowns.e = this.maxCooldown.e;
        break;
      }
      case "r": {
        const rEffect = new SkillEffect(this.player.x, this.player.y, 50, "orange", 30);
        kills = rEffect.apply(this.enemies.enemies);
        this.skillEffectsManager.add(rEffect);
        this.cooldowns.r = this.maxCooldown.r;
        break;
      }
    }

    return kills;
  }
}
