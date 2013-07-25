/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var JANK = 15;

function px(num)    { return parseInt(num, 10) + "px" }
function rnd(num)   { return Math.round(num) }
function hsl(h, l)  { return "hsl(" + h + ", 53%, " + l  + "%)"; }
function mean(nums) { return nums.reduce(function (p, c) { return p + c }, 0) / nums.length }
function maxn(nums) { return nums.reduce(function (p, c) { return p > c ? p : c }, -1) }

function createCanvas(w, h) {
  var canvas = document.createElement("canvas");
  canvas.style.height = px(h);
  canvas.style.width = px(w);
  canvas.height = h;
  canvas.width = w;
  return canvas;
}

function drawJank(ctx, x, y, w, h) {
  var style = ctx.strokeStyle;
  ctx.strokeStyle = "white";
  ctx.beginPath();

  var i = 3;
  ctx.moveTo(x + w - i, y + h);
  ctx.lineTo(x + w, y + h - i);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - i, y + h);
  ctx.fillStyle = "white";
  ctx.fill();

  ctx.stroke();
  ctx.closePath();
  ctx.strokeStyle = style;
}

function draw() {
  var data = DATA.allSamples
    .filter(function (sample) { return sample != null })
    .map(function (sample, i) { return sample });

  var colors = DATA.symbols.map(function () {
    return rnd(Math.random() * 50) + 30;
  });

  var width  = 900;
  var height = 200;
  var canvas = createCanvas(width, height);
  var ctx    = canvas.getContext("2d");
  var max    = maxn(data.map(function (sample) { return sample.frames.length }));
  var blocks = [];

  document.querySelector("#charts").appendChild(canvas);

  var set = data.slice(0, width / 20);
  var h, x = 0;
  ctx.translate(0, canvas.height);
  ctx.scale(-1, 1);
  ctx.rotate(Math.PI);

  set.forEach(function (sample) {
    var frames = sample.frames;
    h = rnd(height / max);

    for (var xx = x; xx < x + 20; xx++) {
      blocks[xx] = new Array(frames.length);
    }

    frames.forEach(function (frame, i) {
      var y = rnd(h * i);
      var jank = sample.extraInfo.responsiveness > JANK;

      ctx.fillStyle = hsl(jank ? 1 : 195, colors[frame]);
      ctx.fillRect(x, y, 19, h - 1);

      if (jank) {
        drawJank(ctx, x, y, 19, h - 1);
      }

      for (var xx = x; xx < x + 20; xx++) {
        for (var yy = y; yy < y + 20; yy++) {
          blocks[xx][yy] = frame;
        }
      }
    });

    x += 20;
  });

  var rect = canvas.getBoundingClientRect();
  var div = document.createElement("div");

  div.className = "symbol";
  div.style.width = px(rect.width - 10);
  div.style.left = px(rect.left);
  div.style.top = px(rect.top);

  document.querySelector("#charts").appendChild(div);

  canvas.addEventListener("mousemove", function (ev) {
    var x = rnd(ev.pageX - rect.left);
    var y = rnd(rect.height - (ev.pageY - rect.top));
    var sym = DATA.symbols[blocks[x][y]];

    div.innerHTML = sym ? sym.symbolName : "";
  });

  canvas.addEventListener("mouseout", function () {
    div.innerHTML = "";
  });

  lines();
}

var MINIMAP_STEP = 5;
var jankq = [];

function lines() {
  var data = DATA.allSamples
    .filter(function (sample) { return sample != null })
    .map(function (sample, i) { return [ sample.frames.length, sample.extraInfo.responsiveness ] });

  var width  = 900;
  var height = 50;
  var step   = rnd(data.length / (width / MINIMAP_STEP));
  var canvas = createCanvas(width, height);
  var ctx    = canvas.getContext("2d");

  document.querySelector("#charts").appendChild(canvas);

  var avg = [];
  for (var i = 0, frames; frames = data.slice(i, i + step), frames.length > 0; i += step) {
    avg.push([
      mean(frames.map(function (f) { return f[0] })),
      frames.some(function (f) { return f[1] > JANK })
    ]);
  }

  var max = maxn(avg.map(function (f) { return f[0] }));
  var ppn = height / max;
  var h, x = 0;

  ctx.strokeStyle = "steelblue";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);

  for (var i = 0; i < avg.length - 1; i++) {
    h = avg[i][0] * ppn;
    if (avg[i][1]) {
      jankq.push([x, x + MINIMAP_STEP]);
    }
    ctx.lineTo(x + MINIMAP_STEP, height - (avg[i + 1][0] * ppn));
    x += MINIMAP_STEP;
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = "lightblue";
  ctx.fill();
  ctx.stroke();

  // Draw jank
  var jankr;
  while (jankr = jankq.pop()) {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    for (var xx = jankr[0]; xx < jankr[1]; xx += 2) {
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, height);
    }
    ctx.stroke();
    ctx.closePath();
  }
}