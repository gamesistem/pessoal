// ============================================================
// WISTORIA CRAFT — Main Game Engine
// ============================================================

const TILE = 32;
const GRAVITY = 0.55;
const JUMP_FORCE = -13;
const MOVE_SPEED = 4;
const WORLD_W = 180;
const WORLD_H = 100;

// ── Block types ──────────────────────────────────────────────
const BLOCKS = {
  AIR:       { id:0, color:'',        solid:false, hp:0,   drop:null,         emoji:'',   name:'Ar'      },
  GRASS:     { id:1, color:'#3d7a2e', solid:true,  hp:3,   drop:'DIRT',       emoji:'🌿', name:'Grama'   },
  DIRT:      { id:2, color:'#7a5230', solid:true,  hp:4,   drop:'DIRT',       emoji:'🟫', name:'Terra'   },
  STONE:     { id:3, color:'#6e6e6e', solid:true,  hp:8,   drop:'STONE',      emoji:'🪨', name:'Pedra'   },
  WOOD:      { id:4, color:'#8b6340', solid:true,  hp:6,   drop:'WOOD',       emoji:'🪵', name:'Madeira' },
  LEAVES:    { id:5, color:'#2d6e1e', solid:false, hp:1,   drop:null,         emoji:'🍃', name:'Folhas'  },
  COAL_ORE:  { id:6, color:'#444444', solid:true,  hp:10,  drop:'COAL',       emoji:'⚫', name:'Carvão'  },
  IRON_ORE:  { id:7, color:'#a0785a', solid:true,  hp:12,  drop:'IRON',       emoji:'🔩', name:'Ferro'   },
  GOLD_ORE:  { id:8, color:'#c8a830', solid:true,  hp:14,  drop:'GOLD',       emoji:'🟡', name:'Ouro'    },
  MAGIC_ORE: { id:9, color:'#7c4dff', solid:true,  hp:16,  drop:'MANA_SHARD', emoji:'💎', name:'Cristal Mágico'},
  DUNGEON:   { id:10,color:'#2a1a3e', solid:true,  hp:999, drop:null,         emoji:'🧱', name:'Dungeon' },
  LAVA:      { id:11,color:'#e53500', solid:false, hp:0,   drop:null,         emoji:'🌋', name:'Lava'    },
  WATER:     { id:12,color:'#1565c0', solid:false, hp:0,   drop:null,         emoji:'💧', name:'Água'    },
  PLACED_STONE:{id:13,color:'#5a5a5a',solid:true,  hp:8,   drop:'STONE',      emoji:'🪨', name:'Pedra'   },
  PLACED_DIRT:{id:14, color:'#7a5230',solid:true,  hp:4,   drop:'DIRT',       emoji:'🟫', name:'Terra'   },
  PORTAL:    { id:15,color:'#9c27b0', solid:false, hp:0,   drop:null,         emoji:'🌀', name:'Portal'  },
  CHEST:     { id:16,color:'#8d6e00', solid:true,  hp:20,  drop:'GOLD',       emoji:'📦', name:'Baú'     },
  BEDROCK:   { id:17,color:'#1a1a1a', solid:true,  hp:999, drop:null,         emoji:'⬛', name:'Bedrock' },
};

const BLOCK_IDS = {};
Object.keys(BLOCKS).forEach((k,i) => { BLOCKS[k].key = k; BLOCK_IDS[BLOCKS[k].id] = BLOCKS[k]; });

// ── Items ────────────────────────────────────────────────────
const ITEMS = {
  DIRT:       { emoji:'🟫', name:'Terra',         type:'block', blockKey:'PLACED_DIRT' },
  STONE:      { emoji:'🪨', name:'Pedra',          type:'block', blockKey:'PLACED_STONE' },
  WOOD:       { emoji:'🪵', name:'Madeira',        type:'block', blockKey:'WOOD' },
  COAL:       { emoji:'⚫', name:'Carvão',          type:'material' },
  IRON:       { emoji:'🔩', name:'Ferro',           type:'material' },
  GOLD:       { emoji:'🟡', name:'Ouro',            type:'material' },
  MANA_SHARD: { emoji:'💎', name:'Fragmento de Mana', type:'mana', manaAmt:30 },
};

// ── Spells ───────────────────────────────────────────────────
const SPELLS = [
  { name:'Faísca de Fogo',   emoji:'🔥', color:'#ff5722', damage:18, mpCost:20, range:220, speed:9,  aoe:0,  type:'projectile', cooldown:400  },
  { name:'Rajada de Gelo',   emoji:'❄️', color:'#4fc3f7', damage:12, mpCost:15, range:180, speed:7,  aoe:0,  type:'projectile', cooldown:350  },
  { name:'Relâmpago',        emoji:'⚡', color:'#ffeb3b', damage:30, mpCost:35, range:300, speed:0,  aoe:80, type:'lightning',  cooldown:800  },
  { name:'Escudo Arcano',    emoji:'🛡️', color:'#7c4dff', damage:0,  mpCost:25, range:0,   speed:0,  aoe:0,  type:'shield',     cooldown:1200 },
];

// ── Enemies ──────────────────────────────────────────────────
const ENEMY_TYPES = [
  { name:'Goblin',    emoji:'👺', hp:30,  dmg:8,  speed:1.5, xp:15, color:'#388e3c', size:24 },
  { name:'Esqueleto', emoji:'💀', hp:45,  dmg:12, speed:1.2, xp:25, color:'#e0e0e0', size:26 },
  { name:'Slime',     emoji:'🟢', hp:20,  dmg:5,  speed:0.8, xp:10, color:'#66bb6a', size:20 },
  { name:'Dragão',    emoji:'🐉', hp:200, dmg:30, speed:0.6, xp:100,color:'#b71c1c', size:40 },
  { name:'Mago Sombrio',emoji:'🧙', hp:80, dmg:22, speed:1.0, xp:60, color:'#7c4dff', size:28 },
];

// ── State ────────────────────────────────────────────────────
let world, player, camera, particles, projectiles, enemies, drops;
let keys = {};
let selectedSpell = 0;
let selectedHotbar = 0;
let kills = 0;
let gameRunning = false;
let lastTime = 0;
let spellCooldowns = [0,0,0,0];
let shieldActive = false;
let shieldTimer = 0;
let msgQueue = [];

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ── Hotbar items ─────────────────────────────────────────────
let hotbarItems = ['PICKAXE','AXE','SWORD','DIRT','STONE'];
const hotbarEmojis = ['⛏️','🪓','🗡️','🟫','🪨'];

// ── Inventory ────────────────────────────────────────────────
let inventory = {};

// ── World gen ────────────────────────────────────────────────
function genWorld() {
  world = new Uint8Array(WORLD_W * WORLD_H);
  const surfaceY = new Int32Array(WORLD_W);

  // Heightmap with noise
  for (let x = 0; x < WORLD_W; x++) {
    let h = 52;
    h += Math.round(8 * Math.sin(x * 0.07) + 4 * Math.sin(x * 0.13 + 1) + 3 * Math.sin(x * 0.03));
    surfaceY[x] = Math.max(20, Math.min(70, h));
  }

  for (let x = 0; x < WORLD_W; x++) {
    const sy = surfaceY[x];
    for (let y = 0; y < WORLD_H; y++) {
      let id = 0;
      if (y === WORLD_H - 1) id = BLOCKS.BEDROCK.id;
      else if (y > sy + 20) {
        // deep stone with ores
        const r = Math.random();
        if (r < 0.02) id = BLOCKS.MAGIC_ORE.id;
        else if (r < 0.06) id = BLOCKS.GOLD_ORE.id;
        else if (r < 0.14) id = BLOCKS.IRON_ORE.id;
        else id = BLOCKS.STONE.id;
      } else if (y > sy + 4) {
        const r = Math.random();
        if (r < 0.04) id = BLOCKS.COAL_ORE.id;
        else if (r < 0.08) id = BLOCKS.IRON_ORE.id;
        else id = BLOCKS.STONE.id;
      } else if (y > sy) id = BLOCKS.DIRT.id;
      else if (y === sy) id = BLOCKS.GRASS.id;
      else id = BLOCKS.AIR.id;
      setBlock(x, y, id);
    }
  }

  // Trees
  for (let x = 5; x < WORLD_W - 5; x += Math.floor(6 + Math.random() * 8)) {
    const sy = surfaceY[x];
    if (getBlock(x, sy) === BLOCKS.GRASS.id) {
      const th = 4 + Math.floor(Math.random() * 3);
      for (let y = sy - th; y < sy; y++) setBlock(x, y, BLOCKS.WOOD.id);
      for (let lx = x-2; lx <= x+2; lx++)
        for (let ly = sy-th-2; ly <= sy-th+1; ly++)
          if (Math.abs(lx-x)+Math.abs(ly-(sy-th)) < 3+Math.random()*2) setBlock(lx, ly, BLOCKS.LEAVES.id);
    }
  }

  // Dungeon
  const dungeonX = 60, dungeonY = 75, dw = 20, dh = 10;
  for (let x = dungeonX; x < dungeonX+dw; x++)
    for (let y = dungeonY; y < dungeonY+dh; y++)
      setBlock(x, y, BLOCKS.DUNGEON.id);
  // Hollow interior
  for (let x = dungeonX+1; x < dungeonX+dw-1; x++)
    for (let y = dungeonY+1; y < dungeonY+dh-1; y++)
      setBlock(x, y, BLOCKS.AIR.id);
  // Chest inside dungeon
  setBlock(dungeonX+10, dungeonY+dh-2, BLOCKS.CHEST.id);
  // Portal
  setBlock(dungeonX+5, dungeonY+dh-2, BLOCKS.PORTAL.id);

  // Lava pools underground
  for (let i = 0; i < 4; i++) {
    const lx = 20 + Math.floor(Math.random() * 140);
    const ly = 80 + Math.floor(Math.random() * 12);
    for (let x = lx; x < lx+6; x++) setBlock(x, ly, BLOCKS.LAVA.id);
  }
}

function getBlock(x, y) {
  if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return BLOCKS.BEDROCK.id;
  return world[y * WORLD_W + x];
}
function setBlock(x, y, id) {
  if (x < 0 || x >= WORLD_W || y < 0 || y >= WORLD_H) return;
  world[y * WORLD_W + x] = id;
}

// ── Player init ──────────────────────────────────────────────
function initPlayer() {
  const sx = Math.floor(WORLD_W / 2);
  let sy = 10;
  while (getBlock(sx, sy) === BLOCKS.AIR.id && sy < WORLD_H) sy++;
  player = {
    x: sx * TILE + 4, y: (sy - 2) * TILE,
    w: 24, h: 32,
    vx: 0, vy: 0,
    onGround: false,
    hp: 120, maxHp: 120,
    mp: 100, maxMp: 100,
    xp: 0, xpNext: 100,
    level: 1,
    attackRange: 80,
    attackDmg: 15,
    miningPower: 1,
    facing: 1,
    attackTimer: 0,
    hurtTimer: 0,
    manaRegen: 0,
  };
}

// ── Camera ───────────────────────────────────────────────────
function initCamera() {
  camera = { x: 0, y: 0 };
}

function updateCamera() {
  const W = canvas.width, H = canvas.height;
  camera.x = player.x + player.w/2 - W/2;
  camera.y = player.y + player.h/2 - H/2;
  camera.x = Math.max(0, Math.min(camera.x, WORLD_W * TILE - W));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H * TILE - H));
}

// ── Spawn enemies ────────────────────────────────────────────
function spawnEnemy() {
  if (enemies.length >= 12) return;
  const side = Math.random() < 0.5 ? -1 : 1;
  const ex = player.x + side * (canvas.width * 0.6 + Math.random() * 200);
  const bx = Math.floor(ex / TILE);
  if (bx < 0 || bx >= WORLD_W) return;
  let by = 5;
  while (by < WORLD_H - 1 && getBlock(bx, by) === BLOCKS.AIR.id) by++;
  by--;
  const type = ENEMY_TYPES[Math.floor(Math.random() * (player.level < 3 ? 3 : ENEMY_TYPES.length))];
  enemies.push({
    x: bx * TILE, y: by * TILE - type.size,
    w: type.size, h: type.size,
    vx: 0, vy: 0,
    hp: type.hp + (player.level - 1) * 10,
    maxHp: type.hp + (player.level - 1) * 10,
    dmg: type.dmg,
    speed: type.speed,
    xp: type.xp,
    color: type.color,
    emoji: type.emoji,
    name: type.name,
    onGround: false,
    attackTimer: 0,
    jumpTimer: 0,
    hurtTimer: 0,
    aggroRange: 350,
  });
}

// ── Physics helpers ──────────────────────────────────────────
function resolveCollision(entity) {
  const left   = Math.floor(entity.x / TILE);
  const right  = Math.floor((entity.x + entity.w - 1) / TILE);
  const top    = Math.floor(entity.y / TILE);
  const bottom = Math.floor((entity.y + entity.h - 1) / TILE);

  entity.onGround = false;

  // Vertical
  if (entity.vy > 0) {
    for (let x = left; x <= right; x++) {
      const b = BLOCK_IDS[getBlock(x, bottom)];
      if (b && b.solid) {
        entity.y = bottom * TILE - entity.h;
        entity.vy = 0;
        entity.onGround = true;
        break;
      }
    }
  } else if (entity.vy < 0) {
    for (let x = left; x <= right; x++) {
      const b = BLOCK_IDS[getBlock(x, top)];
      if (b && b.solid) {
        entity.y = (top + 1) * TILE;
        entity.vy = 0;
        break;
      }
    }
  }

  // Horizontal
  const left2  = Math.floor(entity.x / TILE);
  const right2 = Math.floor((entity.x + entity.w - 1) / TILE);
  const top2   = Math.floor((entity.y + 2) / TILE);
  const bot2   = Math.floor((entity.y + entity.h - 3) / TILE);

  if (entity.vx > 0) {
    for (let y = top2; y <= bot2; y++) {
      const b = BLOCK_IDS[getBlock(right2, y)];
      if (b && b.solid) { entity.x = right2 * TILE - entity.w; entity.vx = 0; break; }
    }
  } else if (entity.vx < 0) {
    for (let y = top2; y <= bot2; y++) {
      const b = BLOCK_IDS[getBlock(left2, y)];
      if (b && b.solid) { entity.x = (left2 + 1) * TILE; entity.vx = 0; break; }
    }
  }

  // Lava damage
  const cx = Math.floor((entity.x + entity.w/2) / TILE);
  const cy = Math.floor((entity.y + entity.h/2) / TILE);
  if (getBlock(cx, cy) === BLOCKS.LAVA.id) {
    if (entity === player) damagePlayer(2);
  }
}

// ── Player update ────────────────────────────────────────────
function updatePlayer(dt) {
  // Input
  if (keys['KeyA'] || keys['ArrowLeft'])  { player.vx -= 1.5; player.facing = -1; }
  if (keys['KeyD'] || keys['ArrowRight']) { player.vx += 1.5; player.facing =  1; }
  if ((keys['KeyW'] || keys['Space'] || keys['ArrowUp']) && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
    spawnParticle(player.x + player.w/2, player.y + player.h, '#aaa', 4);
  }

  player.vx *= 0.75;
  player.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, player.vx));
  player.vy += GRAVITY;
  player.vy = Math.min(player.vy, 20);

  player.x += player.vx;
  resolveCollision(player);
  player.y += player.vy;
  resolveCollision(player);

  // Bounds
  player.x = Math.max(0, Math.min(player.x, WORLD_W * TILE - player.w));
  player.y = Math.max(0, Math.min(player.y, WORLD_H * TILE - player.h));

  // Fall death
  if (player.y >= (WORLD_H - 2) * TILE) damagePlayer(999);

  // Timers
  if (player.attackTimer > 0) player.attackTimer -= dt;
  if (player.hurtTimer > 0) player.hurtTimer -= dt;
  if (shieldActive) { shieldTimer -= dt; if (shieldTimer <= 0) { shieldActive = false; addMsg('🛡️ Escudo desapareceu!'); } }

  // MP regen
  player.manaRegen += dt;
  if (player.manaRegen > 1200) { player.mp = Math.min(player.maxMp, player.mp + 3); player.manaRegen = 0; }

  // Spell cooldowns
  for (let i = 0; i < spellCooldowns.length; i++) if (spellCooldowns[i] > 0) spellCooldowns[i] -= dt;

  updateHUD();
}

// ── Enemy update ─────────────────────────────────────────────
function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = player.x - e.x;
    const dist = Math.abs(dx);

    // AI
    if (dist < e.aggroRange) {
      e.vx += Math.sign(dx) * 0.3 * e.speed;
      e.vx = Math.max(-e.speed * 2, Math.min(e.speed * 2, e.vx));

      // Jump if blocked
      if (e.onGround && e.jumpTimer <= 0) {
        const nextX = e.x + Math.sign(dx) * TILE;
        const bx = Math.floor(nextX / TILE), by = Math.floor((e.y + e.h/2) / TILE);
        if (BLOCK_IDS[getBlock(bx, by)]?.solid) { e.vy = JUMP_FORCE * 0.85; e.jumpTimer = 800; }
      }

      // Attack player
      if (dist < 40 + e.w/2) {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          if (!shieldActive) {
            damagePlayer(e.dmg);
            spawnParticle(player.x + player.w/2, player.y, '#ef5350', 6);
          } else {
            addMsg('🛡️ Escudo bloqueou!');
          }
          e.attackTimer = 1000;
        }
      }
    } else {
      e.vx *= 0.8;
    }

    e.vx *= 0.78;
    e.vy += GRAVITY;
    e.vy = Math.min(e.vy, 20);
    if (e.jumpTimer > 0) e.jumpTimer -= dt;
    if (e.hurtTimer > 0) e.hurtTimer -= dt;

    e.x += e.vx;
    resolveCollision(e);
    e.y += e.vy;
    resolveCollision(e);

    // Bounds
    e.x = Math.max(0, Math.min(e.x, WORLD_W * TILE - e.w));
    if (e.y > WORLD_H * TILE) { enemies.splice(i, 1); continue; }

    if (e.hp <= 0) {
      kills++;
      player.xp += e.xp;
      addMsg(`☠ ${e.name} derrotado! +${e.xp} XP`);
      for (let p = 0; p < 8; p++) spawnParticle(e.x + e.w/2, e.y + e.h/2, e.color, 5 + Math.random()*5);
      // Chance to drop mana shard
      if (Math.random() < 0.3) drops.push({ x: e.x, y: e.y, type: 'MANA_SHARD', emoji:'💎' });
      if (Math.random() < 0.2) drops.push({ x: e.x + 10, y: e.y, type: 'GOLD', emoji:'🟡' });
      enemies.splice(i, 1);
      checkLevelUp();
    }
  }
}

// ── Level up ─────────────────────────────────────────────────
function checkLevelUp() {
  while (player.xp >= player.xpNext) {
    player.xp -= player.xpNext;
    player.level++;
    player.xpNext = Math.floor(player.xpNext * 1.4);
    player.maxHp += 20;
    player.hp = player.maxHp;
    player.maxMp += 10;
    player.mp = player.maxMp;
    player.attackDmg += 5;
    addMsg(`🌟 NÍVEL ${player.level}! HP e MP restaurados!`);
    for (let i = 0; i < 20; i++) spawnParticle(player.x + player.w/2, player.y, '#f5c842', 8 + Math.random()*8);
    document.getElementById('level-badge').textContent = `LV ${player.level}`;
  }
}

// ── Projectiles ──────────────────────────────────────────────
function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt;

    // Particle trail
    if (Math.random() < 0.5) spawnParticle(p.x, p.y, p.color, 3 + Math.random()*3, true);

    // Hit block
    const bx = Math.floor(p.x / TILE), by = Math.floor(p.y / TILE);
    if (BLOCK_IDS[getBlock(bx, by)]?.solid) {
      for (let j = 0; j < 6; j++) spawnParticle(p.x, p.y, p.color, 4);
      projectiles.splice(i, 1);
      continue;
    }

    // Hit enemies
    let hit = false;
    for (const e of enemies) {
      if (p.x > e.x && p.x < e.x+e.w && p.y > e.y && p.y < e.y+e.h) {
        e.hp -= p.damage;
        e.vx += p.vx * 0.3;
        e.hurtTimer = 200;
        for (let j = 0; j < 5; j++) spawnParticle(p.x, p.y, p.color, 5);
        hit = true;
        break;
      }
    }

    if (hit || p.life <= 0) { projectiles.splice(i, 1); continue; }
    if (p.x < 0 || p.x > WORLD_W*TILE || p.y < 0 || p.y > WORLD_H*TILE) projectiles.splice(i, 1);
  }
}

// ── Particles ────────────────────────────────────────────────
function spawnParticle(x, y, color, size, tiny) {
  particles.push({
    x, y,
    vx: (Math.random() - 0.5) * (tiny ? 2 : 5),
    vy: -Math.random() * (tiny ? 2 : 5),
    color, size: size || 4,
    life: tiny ? 200 + Math.random()*200 : 400 + Math.random()*300,
    alpha: 1,
  });
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;
    p.life -= dt;
    p.alpha = p.life / 600;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── Drops ────────────────────────────────────────────────────
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    const dx = player.x - d.x, dy = player.y - d.y;
    if (Math.sqrt(dx*dx+dy*dy) < 50) {
      collectItem(d.type);
      drops.splice(i, 1);
    }
  }
}

function collectItem(type) {
  if (!ITEMS[type]) return;
  const item = ITEMS[type];
  inventory[type] = (inventory[type] || 0) + 1;
  if (item.type === 'mana') {
    player.mp = Math.min(player.maxMp, player.mp + item.manaAmt);
    addMsg(`💎 Mana restaurada! +${item.manaAmt}`);
  } else {
    addMsg(`${item.emoji} ${item.name} coletado!`);
  }
}

// ── Damage ───────────────────────────────────────────────────
function damagePlayer(amt) {
  if (player.hurtTimer > 0) return;
  player.hp -= amt;
  player.hurtTimer = 500;
  addMsg(`❤️ -${amt} HP`);
  if (player.hp <= 0) { player.hp = 0; die(); }
}

// ── Spells ───────────────────────────────────────────────────
function castSpell(mx, my) {
  const spell = SPELLS[selectedSpell];
  if (player.mp < spell.mpCost) { addMsg('❌ Sem mana!'); return; }
  if (spellCooldowns[selectedSpell] > 0) { addMsg('⏳ Em recarga!'); return; }
  player.mp -= spell.mpCost;
  spellCooldowns[selectedSpell] = spell.cooldown;

  const wx = mx + camera.x, wy = my + camera.y;
  const px = player.x + player.w/2, py = player.y + player.h/2;
  const dx = wx - px, dy = wy - py;
  const len = Math.sqrt(dx*dx+dy*dy);

  if (spell.type === 'projectile') {
    const speed = spell.speed;
    projectiles.push({
      x: px, y: py,
      vx: dx/len*speed, vy: dy/len*speed,
      color: spell.color, damage: spell.damage,
      life: 1500,
    });
    addMsg(`${spell.emoji} ${spell.name}!`);
  } else if (spell.type === 'lightning') {
    // AoE at cursor
    for (const e of enemies) {
      const ex = e.x + e.w/2, ey = e.y + e.h/2;
      const ldx = wx - ex, ldy = wy - ey;
      if (Math.sqrt(ldx*ldx+ldy*ldy) < spell.aoe) {
        e.hp -= spell.damage;
        e.hurtTimer = 300;
        for (let j = 0; j < 10; j++) spawnParticle(ex, ey, '#ffeb3b', 7);
      }
    }
    // Particle burst
    for (let j = 0; j < 20; j++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({ x:wx, y:wy, vx:Math.cos(a)*4, vy:Math.sin(a)*4, color:'#ffeb3b', size:5, life:400, alpha:1 });
    }
    addMsg(`⚡ Relâmpago!`);
  } else if (spell.type === 'shield') {
    shieldActive = true;
    shieldTimer = 4000;
    addMsg('🛡️ Escudo Arcano ativado por 4s!');
    for (let j = 0; j < 16; j++) {
      const a = (j / 16) * Math.PI * 2;
      particles.push({ x: px + Math.cos(a)*40, y: py + Math.sin(a)*40, vx:0, vy:-0.5, color:'#7c4dff', size:6, life:600, alpha:1 });
    }
  }
}

// ── Mining / building ────────────────────────────────────────
function mineBlock(mx, my) {
  const wx = Math.floor((mx + camera.x) / TILE);
  const wy = Math.floor((my + camera.y) / TILE);
  const id = getBlock(wx, wy);
  const block = BLOCK_IDS[id];
  if (!block || !block.solid || block.hp >= 999) return;

  const px = player.x + player.w/2, py = player.y + player.h/2;
  const dx = (wx + 0.5) * TILE - px, dy = (wy + 0.5) * TILE - py;
  if (Math.sqrt(dx*dx+dy*dy) > player.attackRange * 1.5) { addMsg('❌ Muito longe!'); return; }

  setBlock(wx, wy, BLOCKS.AIR.id);
  if (block.drop) {
    drops.push({ x: wx*TILE + 8, y: wy*TILE, type: block.drop, emoji: ITEMS[block.drop]?.emoji || '?' });
    addMsg(`${ITEMS[block.drop]?.emoji || ''} ${block.name} minerado!`);
  }
  for (let i = 0; i < 8; i++) spawnParticle((wx+0.5)*TILE, (wy+0.5)*TILE, block.color, 4);

  // Chest reward
  if (id === BLOCKS.CHEST.id) {
    addMsg('📦 Baú aberto! Mana Shards e Ouro!');
    for (let i = 0; i < 3; i++) drops.push({ x: wx*TILE + i*10, y: wy*TILE, type:'MANA_SHARD', emoji:'💎' });
    drops.push({ x: wx*TILE + 20, y: wy*TILE, type:'GOLD', emoji:'🟡' });
  }
}

function placeBlock(mx, my) {
  const hb = hotbarItems[selectedHotbar];
  const item = ITEMS[hb];
  if (!item || item.type !== 'block') { addMsg('❌ Sem bloco selecionado!'); return; }
  if (!inventory[hb] || inventory[hb] <= 0) { addMsg('❌ Sem ' + item.name + '!'); return; }

  const wx = Math.floor((mx + camera.x) / TILE);
  const wy = Math.floor((my + camera.y) / TILE);
  if (getBlock(wx, wy) !== BLOCKS.AIR.id) return;

  // Don't place inside player
  const px = Math.floor(player.x / TILE), py = Math.floor(player.y / TILE);
  if ((wx === px || wx === px) && (wy === py || wy === py+1)) return;

  const blockKey = item.blockKey;
  setBlock(wx, wy, BLOCKS[blockKey].id);
  inventory[hb]--;
  for (let i = 0; i < 5; i++) spawnParticle((wx+0.5)*TILE, (wy+0.5)*TILE, BLOCKS[blockKey].color, 3);
}

function meleeAttack(mx, my) {
  const wx = mx + camera.x, wy = my + camera.y;
  const px = player.x + player.w/2, py = player.y + player.h/2;
  if (player.attackTimer > 0) return;
  player.attackTimer = 350;

  let hit = false;
  for (const e of enemies) {
    const ex = e.x + e.w/2, ey = e.y + e.h/2;
    const dx = ex - px, dy = ey - py;
    if (Math.sqrt(dx*dx+dy*dy) < player.attackRange) {
      e.hp -= player.attackDmg;
      e.vx += player.facing * 3;
      e.hurtTimer = 300;
      for (let i = 0; i < 6; i++) spawnParticle(ex, ey, '#ef5350', 5);
      hit = true;
    }
  }
  if (!hit) {
    for (let i = 0; i < 4; i++) {
      const a = Math.atan2(wy-py, wx-px) + (Math.random()-0.5)*0.5;
      particles.push({ x:px, y:py, vx:Math.cos(a)*6, vy:Math.sin(a)*6, color:'#fff', size:4, life:200, alpha:1 });
    }
  }
}

// ── Rendering ────────────────────────────────────────────────
function drawWorld() {
  const startX = Math.max(0, Math.floor(camera.x / TILE));
  const startY = Math.max(0, Math.floor(camera.y / TILE));
  const endX   = Math.min(WORLD_W, startX + Math.ceil(canvas.width / TILE) + 2);
  const endY   = Math.min(WORLD_H, startY + Math.ceil(canvas.height / TILE) + 2);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const id = getBlock(x, y);
      if (id === 0) continue;
      const block = BLOCK_IDS[id];
      const sx = x * TILE - camera.x, sy = y * TILE - camera.y;

      if (id === BLOCKS.LAVA.id) {
        // Animated lava
        const flicker = 0.85 + 0.15 * Math.sin(Date.now() * 0.004 + x * 0.5);
        ctx.fillStyle = `rgba(229, 53, 0, ${flicker})`;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = `rgba(255,200,0,0.4)`;
        ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
        continue;
      }
      if (id === BLOCKS.PORTAL.id) {
        const t = Date.now() * 0.003;
        const r = Math.floor(128 + 60*Math.sin(t));
        ctx.fillStyle = `rgb(${r}, 20, 200)`;
        ctx.fillRect(sx, sy, TILE, TILE);
        ctx.fillStyle = `rgba(200,100,255,0.5)`;
        ctx.fillRect(sx+6, sy+6, TILE-12, TILE-12);
        continue;
      }

      ctx.fillStyle = block.color;
      ctx.fillRect(sx, sy, TILE, TILE);

      // Grass top stripe
      if (id === BLOCKS.GRASS.id) {
        ctx.fillStyle = '#5a9e3f';
        ctx.fillRect(sx, sy, TILE, 5);
      }

      // Ore dots
      if (id === BLOCKS.COAL_ORE.id || id === BLOCKS.IRON_ORE.id || id === BLOCKS.GOLD_ORE.id || id === BLOCKS.MAGIC_ORE.id) {
        const oc = id === BLOCKS.COAL_ORE.id ? '#111' : id === BLOCKS.IRON_ORE.id ? '#ddd' : id === BLOCKS.GOLD_ORE.id ? '#ffe082' : '#ce93d8';
        ctx.fillStyle = oc;
        ctx.fillRect(sx+4, sy+4, 6, 6);
        ctx.fillRect(sx+18, sy+18, 6, 6);
        ctx.fillRect(sx+18, sy+6, 4, 4);
      }

      // Grid line
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.strokeRect(sx, sy, TILE, TILE);

      // Leaves shimmer
      if (id === BLOCKS.LEAVES.id) {
        ctx.fillStyle = 'rgba(100,200,80,0.3)';
        ctx.fillRect(sx+2, sy+2, TILE-4, TILE-4);
      }

      // Dungeon bricks pattern
      if (id === BLOCKS.DUNGEON.id) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        if (y % 2 === 0) { ctx.fillRect(sx, sy+12, 16, 2); ctx.fillRect(sx+16, sy+28, 16, 2); }
        else { ctx.fillRect(sx+16, sy+12, 16, 2); ctx.fillRect(sx, sy+28, 16, 2); }
      }

      // Chest
      if (id === BLOCKS.CHEST.id) {
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(sx+4, sy+4, TILE-8, TILE-8);
        ctx.fillStyle = '#c8a830';
        ctx.fillRect(sx+12, sy+14, 8, 6);
        ctx.strokeStyle = '#c8a830';
        ctx.strokeRect(sx+4, sy+4, TILE-8, TILE-8);
      }
    }
  }
}

function drawPlayer() {
  const sx = player.x - camera.x, sy = player.y - camera.y;
  const hurt = player.hurtTimer > 0;

  ctx.save();
  if (hurt) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.03);

  // Body
  ctx.fillStyle = '#3f51b5';
  ctx.fillRect(sx + 4, sy + 14, 16, 14);

  // Head
  ctx.fillStyle = '#ffcc80';
  ctx.fillRect(sx + 4, sy, 16, 14);

  // Hair
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(sx + 4, sy, 16, 5);

  // Eyes (facing direction matters)
  ctx.fillStyle = '#1a237e';
  if (player.facing > 0) {
    ctx.fillRect(sx + 12, sy + 6, 4, 4);
  } else {
    ctx.fillRect(sx + 8, sy + 6, 4, 4);
  }

  // Sword (hotbar 2 = sword)
  if (selectedHotbar === 2) {
    ctx.fillStyle = '#cfd8dc';
    if (player.facing > 0) {
      ctx.fillRect(sx + 20, sy + 10, 3, 14);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(sx + 18, sy + 16, 7, 3);
    } else {
      ctx.fillRect(sx + 1, sy + 10, 3, 14);
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(sx - 2, sy + 16, 7, 3);
    }
  }

  // Legs
  ctx.fillStyle = '#455a64';
  ctx.fillRect(sx + 4, sy + 28, 7, 4);
  ctx.fillRect(sx + 13, sy + 28, 7, 4);

  // Shield glow
  if (shieldActive) {
    ctx.strokeStyle = `rgba(124,77,255,${0.5 + 0.5*Math.sin(Date.now()*0.005)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sx + 12, sy + 16, 22, 0, Math.PI*2);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  ctx.restore();
}

function drawEnemies() {
  for (const e of enemies) {
    const sx = e.x - camera.x, sy = e.y - camera.y;
    const hurt = e.hurtTimer > 0;

    ctx.save();
    if (hurt) { ctx.globalAlpha = 0.5; }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(sx + 2, sy + e.h, e.w - 4, 4);

    // Body
    ctx.fillStyle = e.color;
    ctx.fillRect(sx, sy, e.w, e.h);

    // Emoji rendered as text
    ctx.globalAlpha = 1;
    ctx.font = `${e.w * 0.8}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(e.emoji, sx + e.w/2, sy + e.h * 0.75);

    // HP bar
    ctx.fillStyle = '#333';
    ctx.fillRect(sx, sy - 8, e.w, 5);
    ctx.fillStyle = '#ef5350';
    ctx.fillRect(sx, sy - 8, e.w * (e.hp / e.maxHp), 5);

    ctx.restore();
    ctx.textAlign = 'left';
  }
}

function drawProjectiles() {
  for (const p of projectiles) {
    const sx = p.x - camera.x, sy = p.y - camera.y;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles() {
  for (const p of particles) {
    const sx = p.x - camera.x, sy = p.y - camera.y;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.fillRect(sx - p.size/2, sy - p.size/2, p.size, p.size);
    ctx.restore();
  }
}

function drawDrops() {
  for (const d of drops) {
    const sx = d.x - camera.x, sy = d.y - camera.y;
    const bob = Math.sin(Date.now() * 0.004) * 3;
    ctx.save();
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.emoji, sx, sy + bob);
    ctx.restore();
    ctx.textAlign = 'left';
  }
}

function drawBackground() {
  // Sky gradient
  const depthRatio = camera.y / (WORLD_H * TILE);
  const r = Math.floor(10 + (60 * (1 - depthRatio)));
  const g = Math.floor(10 + (80 * (1 - depthRatio)));
  const b = Math.floor(20 + (100 * (1 - depthRatio)));
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars if high up
  if (depthRatio < 0.1) {
    ctx.fillStyle = 'white';
    for (let i = 0; i < 30; i++) {
      const sx = (i * 173 + Math.floor(camera.x * 0.05)) % canvas.width;
      const sy = (i * 97) % (canvas.height * 0.5);
      const twinkle = 0.3 + 0.7 * Math.sin(Date.now() * 0.002 + i);
      ctx.globalAlpha = twinkle;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}

function drawHUDOverlay() {
  // Depth indicator
  const tileY = Math.floor(player.y / TILE);
  document.getElementById('depth-display').textContent = `🌍 Y: ${tileY}`;
  document.getElementById('kills-display').textContent = `☠ Mortes: ${kills}`;
  document.getElementById('score-display').textContent = `💧 Mana: ${Math.floor(player.mp)}`;

  // Spell cooldown overlays on spell bar
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById(`spell${i}`);
    if (spellCooldowns[i] > 0) {
      el.style.opacity = '0.5';
    } else {
      el.style.opacity = '1';
    }
  }
}

// ── HUD update ───────────────────────────────────────────────
function updateHUD() {
  document.getElementById('hp-bar').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('mp-bar').style.width = (player.mp / player.maxMp * 100) + '%';
  document.getElementById('xp-bar-inner').style.width = (player.xp / player.xpNext * 100) + '%';
}

// ── Messages ─────────────────────────────────────────────────
function addMsg(text) {
  const log = document.getElementById('msg-log');
  const div = document.createElement('div');
  div.className = 'msg';
  div.textContent = text;
  log.appendChild(div);
  setTimeout(() => { if (div.parentNode) div.parentNode.removeChild(div); }, 3200);
}

// ── Death / respawn ──────────────────────────────────────────
function die() {
  gameRunning = false;
  const ds = document.getElementById('death-screen');
  ds.style.display = 'flex';
  document.getElementById('death-stats').textContent =
    `Nível ${player.level} | Kills: ${kills} | XP perdido: ${player.xp}`;
}

function respawn() {
  document.getElementById('death-screen').style.display = 'none';
  initPlayer();
  enemies = [];
  particles = [];
  projectiles = [];
  kills = 0;
  gameRunning = true;
  addMsg('🌟 Você renasceu!');
}

// ── Spell/hotbar selection ───────────────────────────────────
function selectSpell(i) {
  selectedSpell = i;
  for (let j = 0; j < 4; j++) document.getElementById(`spell${j}`).classList.toggle('active', j === i);
  document.getElementById('spell-name').textContent = SPELLS[i].name;
}

function selectHotbar(i) {
  selectedHotbar = i;
  for (let j = 0; j < 5; j++) document.getElementById(`hb${j}`).classList.toggle('active', j === i);
}

// ── Enemy spawn timer ────────────────────────────────────────
let enemySpawnTimer = 0;

// ── Main loop ─────────────────────────────────────────────────
function gameLoop(ts) {
  if (!gameRunning) { requestAnimationFrame(gameLoop); return; }
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  enemySpawnTimer += dt;
  if (enemySpawnTimer > 4000) { spawnEnemy(); enemySpawnTimer = 0; }

  updatePlayer(dt);
  updateEnemies(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateDrops(dt);
  updateCamera();

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawWorld();
  drawDrops();
  drawParticles();
  drawProjectiles();
  drawPlayer();
  drawEnemies();
  drawHUDOverlay();

  requestAnimationFrame(gameLoop);
}

// ── Input ────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (!gameRunning) return;
  if (e.code === 'Digit1') selectHotbar(0);
  if (e.code === 'Digit2') selectHotbar(1);
  if (e.code === 'Digit3') selectHotbar(2);
  if (e.code === 'Digit4') selectHotbar(3);
  if (e.code === 'Digit5') selectHotbar(4);
  if (e.code === 'KeyQ') selectSpell(0);
  if (e.code === 'KeyE') selectSpell(1);
  if (e.code === 'KeyR') selectSpell(2);
  if (e.code === 'KeyF') selectSpell(3);
  e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

canvas.addEventListener('mousedown', e => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);

  if (e.button === 0) {
    const hb = hotbarItems[selectedHotbar];
    if (hb === 'PICKAXE' || hb === 'AXE') {
      mineBlock(mx, my);
    } else if (hb === 'SWORD') {
      meleeAttack(mx, my);
    } else {
      // Block slot: try mine
      mineBlock(mx, my);
    }
    // Also try spell
    if (e.shiftKey) castSpell(mx, my);
  }
  if (e.button === 2) {
    // Right click: cast spell
    castSpell(mx, my);
  }
});

canvas.addEventListener('contextmenu', e => {
  e.preventDefault();
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  // Right click = place block if block selected, else cast spell
  const hb = hotbarItems[selectedHotbar];
  if (ITEMS[hb] && ITEMS[hb].type === 'block') placeBlock(mx, my);
  else castSpell(mx, my);
});

// ── Resize ───────────────────────────────────────────────────
function resizeCanvas() {
  const wrapper = document.getElementById('canvas-wrapper');
  canvas.width = wrapper.clientWidth;
  canvas.height = wrapper.clientHeight;
  ctx.imageSmoothingEnabled = false;
}

window.addEventListener('resize', resizeCanvas);

// ── Start ────────────────────────────────────────────────────
function startGame() {
  document.getElementById('menu-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'flex';
  resizeCanvas();

  world = null;
  particles = [];
  projectiles = [];
  enemies = [];
  drops = [];
  inventory = {};
  kills = 0;

  genWorld();
  initPlayer();
  initCamera();

  // Give starter items
  inventory['DIRT'] = 10;
  inventory['STONE'] = 10;

  gameRunning = true;
  lastTime = performance.now();

  addMsg('⚔️ Bem-vindo ao Wistoria Craft!');
  addMsg('🖱️ Clique Dir = Feitiço | Clique Esq = Minerar/Atacar');

  // Spawn initial enemies
  setTimeout(() => spawnEnemy(), 2000);
  setTimeout(() => spawnEnemy(), 4000);

  requestAnimationFrame(gameLoop);
}

function backToMenu() {
  gameRunning = false;
  document.getElementById('death-screen').style.display = 'none';
  document.getElementById('game-screen').style.display = 'none';
  document.getElementById('menu-screen').style.display = 'flex';
}

function showControls() {
  const p = document.getElementById('controls-popup');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

// ── Menu canvas animation ─────────────────────────────────────
const menuCanvas = document.getElementById('menuCanvas');
const mctx = menuCanvas.getContext('2d');
let menuParticles = [];

function resizeMenuCanvas() {
  menuCanvas.width = window.innerWidth;
  menuCanvas.height = window.innerHeight;
}
resizeMenuCanvas();
window.addEventListener('resize', resizeMenuCanvas);

for (let i = 0; i < 60; i++) {
  menuParticles.push({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random()-0.5)*0.5,
    vy: -0.3 - Math.random()*0.5,
    size: 2 + Math.random()*4,
    color: ['#f5c842','#4fc3f7','#ce93d8','#7c4dff','#ef5350'][Math.floor(Math.random()*5)],
    alpha: Math.random(),
  });
}

function menuLoop() {
  mctx.clearRect(0, 0, menuCanvas.width, menuCanvas.height);
  for (const p of menuParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha += 0.005;
    if (p.alpha > 1) p.alpha = 0;
    if (p.y < 0) { p.y = menuCanvas.height; p.x = Math.random()*menuCanvas.width; }
    mctx.save();
    mctx.globalAlpha = p.alpha;
    mctx.fillStyle = p.color;
    mctx.fillRect(p.x, p.y, p.size, p.size);
    mctx.restore();
  }
  if (!gameRunning) requestAnimationFrame(menuLoop);
}
menuLoop();
