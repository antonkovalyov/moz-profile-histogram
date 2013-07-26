/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

var JANK = 15;
var canvi = {};

function px(num)    { return parseInt(num, 10) + "px" }
function rnd(num)   { return Math.round(num) }
function hsl(h, l)  { return "hsl(" + h + ", 53%, " + l  + "%)"; }
function mean(nums) { return nums.reduce(function (p, c) { return p + c }, 0) / nums.length }
function maxn(nums) { return nums.reduce(function (p, c) { return p > c ? p : c }, -1) }

function getCanvas(id, w, h, cb) {
  if (canvi[id])
    return canvi[id];

  var canvas = document.createElement("canvas");
  canvas.style.height = px(h);
  canvas.style.width = px(w);
  canvas.height = h;
  canvas.width = w;

  var ctx = canvas.getContext("2d");

  canvi[id] = {
    canvas:  canvas,
    context: ctx
  };

  (cb || function () {})(canvas, ctx);

  return canvi[id];
}

function appendOnce(id, el) {
  var els = document.querySelectorAll(id + " > *");
  for (var i = 0; i < els.length; i++) {
    if (els[i].id === el.id) {
      return;
    }
  }

  document.querySelector(id).appendChild(el);
}

function drawJank(ctx, x, y, w, h) {
  var style = ctx.strokeStyle;
  ctx.strokeStyle = "white";
  ctx.beginPath();

  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y + h);
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y);

  ctx.stroke();
  ctx.closePath();
  ctx.strokeStyle = style;
}

function render(start) {
  start = start || 0;

  var data = DATA.allSamples
    .filter(function (sample) { return sample != null })
    .map(function (sample, i) { return sample });

  var colors = DATA.symbols.map(function () {
    return rnd(Math.random() * 50) + 30;
  });

  var width  = 900;
  var height = 200;
  var tuple  = getCanvas("cbigmap", width, height, function (canvas, ctx) {
    ctx.translate(0, canvas.height);
    ctx.scale(-1, 1);
    ctx.rotate(Math.PI);
  });
  var canvas = tuple.canvas;
  var ctx    = tuple.context;
  var max    = maxn(data.map(function (sample) { return sample.frames.length }));
  var blocks = [];

  appendOnce("#bigmap", canvas);

  var set = data.slice(start, start + (width / 20));
  var h, x = 0;
  ctx.clearRect(0, 0, width, height);

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

  div.id = "csymbol";
  div.className = "symbol";
  div.style.width = px(rect.width - 10);
  div.style.left = px(rect.left);
  div.style.top = px(rect.top);

  appendOnce("#bigmap", div);

  canvas.addEventListener("mousemove", function (ev) {
    var x = rnd(ev.pageX - rect.left);
    var y = rnd(rect.height - (ev.pageY - rect.top));
    var sym = DATA.symbols[blocks[x][y]];
    console.log(blocks[x][y]);

    div.innerHTML = sym ? sym.symbolName : "";
  });

  canvas.addEventListener("mouseout", function () {
    div.innerHTML = "";
  });

  return set.length;
}

var jankq = [];

function lines(fpd /* frames per display */) {
  var data = DATA.allSamples
    .filter(function (sample) { return sample != null })
    .map(function (sample, i) { return [ sample.frames.length, sample.extraInfo.responsiveness ] });

  var width  = 900;
  var height = 50;
  var tuple  = getCanvas("cminimap", width, height);
  var canvas = tuple.canvas;
  var ctx    = tuple.context;

  document.querySelector("#minimap").appendChild(canvas);

  var avg = [];
  for (var i = 0, frames; frames = data.slice(i, i + fpd), frames.length > 0; i += fpd) {
    avg.push([
      mean(frames.map(function (f) { return f[0] })),
      frames.some(function (f) { return f[1] > JANK })
    ]);
  }

  var max  = maxn(avg.map(function (f) { return f[0] }));
  var ppn  = height / max;
  var h, x = 0;
  var step = rnd(width / (data.length / fpd));

  ctx.strokeStyle = "steelblue";
  ctx.moveTo(0, canvas.height);
  ctx.beginPath();

  for (var i = 0; i < avg.length - 1; i++) {
    h = avg[i][0] * ppn;
    if (avg[i][1]) {
      jankq.push([x, x + step]);
    }
    ctx.lineTo(x + step, height - (avg[i + 1][0] * ppn));
    x += step;
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

  var rect = canvas.getBoundingClientRect();
  var zoom = document.createElement("div");

  zoom.className = "zoom";
  zoom.style.width = px(step);
  zoom.style.height = px(rect.height - 2);
  zoom.style.left = px(rect.left);
  zoom.style.top = px(rect.top + 1);

  document.querySelector("#minimap").appendChild(zoom);

  canvas.addEventListener("click", function (ev) {
    var pos = (ev.pageX - rect.left) - rnd(step / 2);
    pos = rect.left + pos;

    if (pos < rect.left) {
      pos = rect.left;
    }

    if (pos + step > rect.right) {
      pos = rect.right - step;
    }

    zoom.style.left = px(pos);
    render(rnd(((pos - rect.left) / step) * fpd));
  });
}

function draw() {
  var fpd = render();
  lines(fpd);
}