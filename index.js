/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

function px(num)    { return parseInt(num, 10) + "px" }
function hex(str)   { return "#" + str }
function rnd(num)   { return Math.round(num) }
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

function draw() {
  var data = DATA.allSamples
    .filter(function (sample) { return sample != null })
    .map(function (sample, i) { return sample.frames });

  var colors = DATA.symbols.map(function () {
    var ltr = "0123456789ABCDEF".split("");
    var ret = "";

    for (var i = 0; i < 6; i++) {
      ret += ltr[rnd(Math.random() * 15)];
    }

    return hex(ret);
  });

  var width  = 900;
  var height = 200;
  var canvas = createCanvas(width, height);
  var ctx    = canvas.getContext("2d");
  var max    = maxn(data.map(function (frames) { return frames.length }));
  var blocks = [];

  document.querySelector("#charts").appendChild(canvas);

  var set = data.slice(0, width / 20);
  var h, x = 0;
  ctx.translate(0, canvas.height);
  ctx.scale(-1, 1);
  ctx.rotate(Math.PI);

  set.forEach(function (frames) {
    h = height / max;

    for (var xx = x; xx < x + 20; xx++) {
      blocks[xx] = new Array(frames.length);
    }

    frames.forEach(function (frame, i) {
      var y = rnd(h * i);

      ctx.fillStyle = colors[frame];
      ctx.fillRect(x, y, 19, h - 1);

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

function lines() {
  var data = DATA.allSamples
    .filter(function (sample) { return sample != null })
    .map(function (sample, i) { return sample.frames.length });

  var width  = 900;
  var height = 50;
  var step   = rnd(data.length / (width / 5));
  var canvas = createCanvas(width, height);
  var ctx    = canvas.getContext("2d");

  document.querySelector("#charts").appendChild(canvas);

  var avg = [];
  for (var i = 0, samples; samples = data.slice(i, i + step), samples.length > 0; i += step) {
    avg.push(mean(samples));
  }

  var max = maxn(avg);
  var ppn = height / max;
  var h, x = 0;

  ctx.strokeStyle = "steelblue";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);

  for (var i = 0; i < avg.length - 1; i++) {
    h = avg[i] * ppn;
    ctx.lineTo(x + 5, height - (avg[i + 1] * ppn));
    x += 5;
  }

  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fillStyle = "lightblue";
  ctx.fill();
  ctx.stroke();
}