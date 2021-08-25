let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
let x, y, w, h;
let ep = 0.00001;
let player = {
  p: [],
  dead: false,
  graze: 0,
  speed: 5,
  hitbox: 4
};
let frameCounter = 0;
let deadCounter = 0;
let portraitCounter = 0;
let ehp;
let mehp = (ehp = 750);
let ephase = 0;
let edead = false;
let star = [];

let events$1 = [
  "touchstart",
  "touchmove",
  "touchend",
  "touchcancel",
  "mousedown",
  "mouseup",
  "mousemove",
  "mouseover",
  "mouseout",
  "mouseenter",
  "mouseleave"
];

for (let i = 0; i < events$1.length; i++) {
  canvas.addEventListener(events$1[i], handleTouch);
}

function handleTouch(e) {
  if (
    e.type == "touchstart" ||
    e.type == "touchmove" ||
    e.type == "touchend" ||
    e.type == "touchcancel"
  ) {
    var touch = e.touches[0] || e.changedTouches[0];
    x = touch.pageX;
    y = touch.pageY;
  } else if (
    e.type == "mousedown" ||
    e.type == "mouseup" ||
    e.type == "mousemove" ||
    e.type == "mouseover" ||
    e.type == "mouseout" ||
    e.type == "mouseenter" ||
    e.type == "mouseleave"
  ) {
    x = e.clientX;
    y = e.clientY;
  }
}

let poly = (verts, fill) => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < verts.length; i++) {
    ctx.lineTo(verts[i][0], verts[i][1]);
  }
  ctx.fill();
};

let copyPoly = (out, a) => {
  for (let i = 0; i < a.length; i++) {
    out[i] = [];
    out[i][0] = a[i][0];
    out[i][1] = a[i][1];
  }
};

let makeRect = (x, y, w, h) => {
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
};

let rotate = (point, f, center) => {
  sub2(point, point, center);
  let r = [f[1], -f[0]];
  let temp = [];
  let temp2 = [];
  mul2(temp, r, point[0]);
  mul2(temp2, f, point[1]);
  sub2(temp, temp, temp2);
  copy2(point, temp);
  add2(point, point, center);
};

class Bullet {
  constructor(pos, speed) {
    this.pos = [];
    this.target = [];
    copy2(this.pos, pos);
    copy2(this.target, pos);
    this.speed = speed;
    this.passTarget = false;
    this.lastDir = [0, 1];
    this.grazed = false;
    this.life = 0;
  }
  setTarget(target) {
    copy2(this.target, target);
  }
  setSpeed(speed) {
    this.speed = speed;
  }
  tick() {
    this.life++;
    let dir = [];
    sub2(dir, this.pos, this.target);
    let l = length2(dir);
    if (l > this.speed) {
      dir[0] /= l / this.speed;
      dir[1] /= l / this.speed;
    }
    if (this.passTarget && !this.pdir) this.pdir = dir;

    if (Math.abs(dir[0]) > ep && Math.abs(dir[1]) > ep) this.lastDir = dir;
    if (!this.pdir) {
      sub2(this.pos, this.pos, dir);
    } else {
      sub2(this.pos, this.pos, this.pdir);
    }
    this.draw();
  }
  draw() {
    let rect = makeRect(this.pos[0] - 2, this.pos[1] - 5, 4, 10);
    let rect2 = makeRect(this.pos[0] - 1.5, this.pos[1] - 4.5, 3, 9);
    for (let i = 0; i < 4; i++) {
      let d = [];
      normalize2(d, this.lastDir);
      rotate(rect[i], d, this.pos);
      rotate(rect2[i], d, this.pos);
    }
    poly(rect, "#FFFFFF");
    poly(rect2, "#FF3F3F");
  }
}

class Laser {
  constructor(pos, dir, width = 10, length = w + h) {
    this.pos = [];
    this.dir = [];
    copy2(this.pos, pos);
    normalize2(this.dir, dir);
    this.width = width;
    this.length = length;
  }
  tick() {
    this.draw();
  }
  draw() {
    let rects = [
      makeRect(
        this.pos[0] - this.width / 2 - 6,
        this.pos[1],
        this.width + 12,
        -this.length
      ),
      makeRect(
        this.pos[0] - this.width / 2 - 4,
        this.pos[1],
        this.width + 8,
        -this.length
      ),
      makeRect(
        this.pos[0] - this.width / 2 - 2,
        this.pos[1],
        this.width + 4,
        -this.length
      )
    ];
    for (let i = 0; i < rects.length; i++) {
      for (let j = 0; j < 4; j++) {
        rotate(rects[i][j], this.dir, this.pos);
      }
    }
    poly(rects[0], "#3F0000");
    poly(rects[1], "#7F0000");
    poly(rects[2], "#FFFFFF");
  }
  dist(p) {
    let rp = [];
    sub2(rp, p, this.pos);
    let d = dot2(this.dir, rp);
    mul2(rp, this.dir, clamp(d, 0, this.length));
    add2(rp, rp, this.pos);
    sub2(rp, rp, p);
    return length2(rp);
  }
}

let bullets = [];
let lasers = [];
let del = (arr, index) => {
  let last = arr.length - 1;
  let temp = arr[last];
  arr[last] = arr[index];
  arr[index] = temp;
  arr.pop();
};

function setup() {
  canvas.width = w = document.body.clientWidth;
  canvas.height = h = document.body.clientHeight;
  x = player.p[0] = w / 2;
  y = player.p[1] = (h * 3) / 4;
  {
    let am = t => (2.24 + Math.sin(31.4159 * (t + 0.25))) * 4;
    let p = t => {
      let o = [Math.sin(6.28318 * t), -Math.cos(6.28318 * t)];
      mul2(o, o, am(t));
      return o;
    };
    for (let i = 0; i < 10; i++) {
      star.push(p(i * 0.1));
    }
  }

  loop();
}

function loop() {
  requestAnimationFrame(loop);
  let longest = length2([w, h]);
  let dir = [];
  sub2(dir, player.p, [x, y]);
  let l = length2(dir);
  if (l > player.speed) {
    dir[0] /= l / player.speed;
    dir[1] /= l / player.speed;
  }
  sub2(player.p, player.p, dir);
  player.p[0] = clamp(player.p[0], 0, w);
  player.p[1] = clamp(player.p[1], 0, h);

  ctx.strokeWeight = 1;
  ctx.fillStyle = `rgb(${deadCounter * 4},0,0)`;
  if (deadCounter > 0) deadCounter--;
  if (portraitCounter > 0) portraitCounter--;
  ctx.fillRect(0, 0, w, h);

  /* let v = [360, 120];
  rotate(v, [1, 0], [px, py]);
  ctx.strokeStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(v[0], v[1]);
  ctx.stroke();

  return;*/
  if (!player.dead) {
    for (let i = 0; i < 32; i += 8) {
      let rects = [
        makeRect(player.p[0] - i + 6, player.p[1] - longest, 10, longest),
        makeRect(player.p[0] - i + 8, player.p[1] - longest, 6, longest),
        makeRect(player.p[0] - i + 10, player.p[1] - longest, 2, longest)
      ];
      /*for (let j = 0; j < rects.length; j++) {
        for (let k = 0; k < 4; k++) {
          let t = [];
          normalize2(t, [w/2-player.p[0], h/4-player.p[1]]);
          rotate(rects[j][k], t, player.p);
        }
      }*/
      poly(rects[0], "#3F0000");
      poly(rects[1], "#7F0000");
      poly(rects[2], "#FFFFFF");
    }
    ctx.fillStyle = "#AAAAAA";
    ctx.beginPath();
    ctx.arc(...player.p, 20, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#AF0000";
    ctx.beginPath();
    ctx.arc(...player.p, player.hitbox + 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#DF0000";
    ctx.beginPath();
    ctx.arc(...player.p, player.hitbox + 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(...player.p, player.hitbox, 0, 2 * Math.PI);
    ctx.fill();
  }

  if (ehp > 0 && portraitCounter == 0 && !edead) {
    if (!player.dead) {
      switch (ephase) {
        case 0:
          for (let i = 0; i < 4; i++) {
            let nb = new Bullet([w / 2, h / 4], 4);
            nb.setTarget([
              w / 2 +
                (h / 4.5) *
                  Math.cos((frameCounter / 1.6) * Math.PI + frameCounter),
              h / 4 +
                (h / 4.5) *
                  Math.sin((frameCounter / 1.6) * Math.PI + frameCounter)
            ]);
            nb.passTarget = true;
            bullets.push(nb);
            frameCounter++;
          }
          break;
        case 1:
          if (frameCounter % 30 == 0) {
            for (let i = 0; i < 8; i++) {
              let nb = new Bullet([w / 2, h / 4], 4);
              nb.setTarget([
                w / 2 + (h / 5) * Math.cos(((i + 0.5) * Math.PI) / 4),
                h / 4 + (h / 5) * Math.sin(((i + 0.5) * Math.PI) / 4)
              ]);
              bullets.push(nb);
            }
          }
          if (frameCounter == 15) {
            for (let i = 0; i < 16; i++) {
              let nl = new Laser(
                [
                  w / 2 + 40 * Math.cos(((i + 0.5) * Math.PI) / 8),
                  h / 4 + 40 * Math.sin(((i + 0.5) * Math.PI) / 8)
                ],
                [
                  Math.cos(((i + 0.5) * Math.PI) / 8),
                  Math.sin(((i + 0.5) * Math.PI) / 8)
                ]
              );
              lasers.push(nl);
            }
          }
          frameCounter++;
          break;
        case 2:
          if (frameCounter % 90 == 0) {
            let sv = [];
            sub2(sv, player.p, [w / 2, h / 4]);
            let t = sv[0];
            sv[0] = -sv[1];
            sv[1] = t;
            normalize2(sv, sv);
            for (let i = 0; i < 16; i++) {
              let nb = new Bullet([w / 2, h / 4], ((i + 1) / 17) * 4 + 2);
              let target = [];
              mul2(target, sv, (Math.random() - 0.5) * 120);
              add2(target, target, player.p);
              nb.setTarget(target);
              nb.passTarget = true;
              bullets.push(nb);
            }
          }
          if (frameCounter % 30 == 0) {
            let p = Math.random();
            for (let i = 0; i < 32; i++) {
              let nb = new Bullet([w / 2, h / 4], 4);
              nb.setTarget([
                w / 2 + (h / 5) * Math.cos(((i + p) * Math.PI) / 16),
                h / 4 + (h / 5) * Math.sin(((i + p) * Math.PI) / 16)
              ]);
              nb.passTarget = true;
              bullets.push(nb);
            }
          }
          if (frameCounter % 360 == 0) bullets = [];
          frameCounter++;
          break;
        case 3:
          if (frameCounter % 180 < 60) {
            for (let _i = 0; _i < 3; _i++)
            {
              let nb = new Bullet([Math.random() * w, Math.random() * h], 0);
              let target = [];
              let d1 = [];
              let rand = Math.random() * 6.28318;
              d1[0] = Math.cos(rand);
              d1[1] = Math.sin(rand);
              add2(target, nb.pos, d1);
              nb.setTarget(target);
              let d = [];
              sub2(d, player.p, nb.pos);
              if (length2(d) > 50) {
                bullets.push(nb);
              }
            }
          }
          frameCounter++;
          break;
      }
    }
    for (let i = 0; i < lasers.length; i++) {
      lasers[i].tick();
      if (
        lasers[i].dist(player.p) < lasers[i].width + player.hitbox &&
        !player.dead
      ) {
        player.dead = true;
        deadCounter = 63;
      }
    }
    for (let i = 0; i < bullets.length; i++) {
      if (
        bullets[i].pos[0] != clamp(bullets[i].pos[0], 0, w) ||
        bullets[i].pos[1] != clamp(bullets[i].pos[1], 0, h)
      ) {
        del(bullets, i);
        continue;
      }
      let l = [];
      sub2(l, bullets[i].pos, player.p);
      switch (ephase) {
        case 1:
          if (bullets[i].life == 60) {
            bullets[i].setTarget(player.p);
            bullets[i].passTarget = true;
          }
          break;
        case 3:
          if (frameCounter % 180 >= 120 && frameCounter % 180 < 150) {
            let s = (frameCounter % 180) - 120;
            s /= 30 / 3;
            bullets[i].setSpeed(s+1);
            bullets[i].passTarget = true;
          }
      }
      bullets[i].tick();

      if (length2(l) < 24 && !player.dead && !bullets[i].grazed) {
        player.graze++;
        bullets[i].grazed = true;
      }
      if (length2(l) < player.hitbox && !player.dead) {
        player.dead = true;
        deadCounter = 63;
      }
    }
  }
  if (!edead) {
    ctx.fillStyle = "#DFDFDF";
    ctx.beginPath();
    ctx.arc(w / 2, h / 4, 24, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(
      w / 2,
      h / 4,
      64,
      -(ehp / mehp) * Math.PI * 2 - Math.PI / 2,
      -Math.PI / 2,
      false
    );
    ctx.stroke();
  }
  ctx.strokeStyle = "#FFFFFF";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "30px Arial";
  ctx.fillText(`Graze: ${player.graze}`, 15, h - 15);

  if (Math.abs(w / 2 - player.p[0]) < 40 && !player.dead && ehp > 0 && !edead)
    ehp--;
  if (ehp == 0 && !edead) {
    ephase++;
    if (ephase == 4) edead = true;
    else {
      portraitCounter = 120;
      ehp = mehp;
      frameCounter = 0;
    }
    bullets = [];
    lasers = [];
  }

  // start at (w + 144, h / 3)
  // stop at (w / 2, h / 2)
  // exit at (-144, h * 2 / 3)
  let t = 0;

  if (portraitCounter > 90) {
    t = mix(0.6, 1, (portraitCounter - 90) / 30);
  } else if (portraitCounter > 30) {
    t = mix(0.4, 0.6, (portraitCounter - 30) / 60);
  } else if (portraitCounter > 0) {
    t = mix(0, 0.4, portraitCounter / 30);
  }
  ctx.fillStyle = "#DFDFDF";
  ctx.beginPath();
  ctx.arc(
    mix(-144, w + 144, t),
    mix((h * 2) / 3, h / 3, t),
    144,
    0,
    2 * Math.PI
  );
  ctx.fill();
  let starc = [];
  copyPoly(starc, star);
  for (let i = 0; i < 10; i++) {
    add2(starc[i], starc[i], [-15, 15]);
  }

  for (let i = 0; i < 3 - ephase; i++) {
    for (let j = 0; j < 10; j++) {
      add2(starc[j], starc[j], [30, 0]);
    }
    poly(starc, "#00FF00");
  }
}

setup();
