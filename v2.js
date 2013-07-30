var JANK = 15;

var px  = (num)  => parseInt(num, 10) + "px";
var rnd = (num)  => Math.round(num);
var hsl = (h, l) => "hsl(" + h + ", 53%, " + l + "%)";
var get = (qr)   => document.querySelector(qr);

function canvas(opts) {
  var el = document.createElement("canvas");

  el.style.height = px(opts.height);
  el.style.width = px(opts.width);
  el.height = opts.height;
  el.width = opts.width;

  return {
    element: el,
    context: el.getContext("2d")
  };
}

function drawBigmap(map, data, start) {
  var ctx = map.context;
  var hgt = rnd(map.element.height / data.max);

  ctx.clearRect(0, 0, map.element.width, map.element.height);

  for (var i = start, x = 0; i < data.length && x < map.element.width; i++) {
    data[i].forEach(function (frame, i) {
      var y = rnd(i * hgt);
      y = map.element.height - y - hgt; // flip

      ctx.fillStyle = hsl(frame.resp > JANK ? 1 : 195, frame.color);
      ctx.fillRect(x, y, 19, hgt - 1);
    });
    x += 20;
  }
}

function cls() {
  for (var i = 0; i < arguments.length; i++) {
    var { context, element } = arguments[i];
    context.clearRect(0, 0, element.width, element.height);
  }
}

function drawOverview(map, data) {
  var ctx = map.context;
  var hgt = rnd(map.element.height / data.max);
  var flip = (val) => map.element.height - val - hgt;
  var jank = [];

  ctx.clearRect(0, 0, map.element.width, map.element.height);

  ctx.strokeStyle = "steelblue";
  ctx.moveTo(0, 0);
  ctx.beginPath();

  data.forEach((sample, i) => {
    var x = i + 1;
    var y = flip(hgt * sample.length);

    if (sample[0].resp > JANK) jank.push({ x: x, y: y });
    ctx.lineTo(x, y);
  });

  ctx.lineTo(data.length + 10, flip(-10));
  ctx.lineTo(0, flip(-10));
  ctx.closePath();
  ctx.fillStyle = "lightblue";
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "red";
  jank.forEach((coord) => {
    var { x, y } = coord;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, map.element.height);
    ctx.closePath();
    ctx.stroke();
  });
}

function drawOverlay(map, refmap, data, start) {
  var ctx = map.context;
  var cvs = map.element;
  var scl = cvs.width / data.length;
  var rec = map.element.getBoundingClientRect();
  var xx  = null;

  function draw(s) {
    var rx = 0;
    s = rnd(s);
    for (var i = s; rx < refmap.element.width; i++) {
      rx += 20;
    }

    var x = s;
    var w = i - s;
    var y = -3;
    var h = cvs.height + 6;

    if (x < 0)
      start = x = 0;

    if (x + w > cvs.width / scl)
      start = x = (cvs.width / scl) - w;

    ctx.clearRect(0, 0, cvs.width / scl, cvs.height);
    ctx.fillStyle = "hsla(179, 8%, 50%, 0.35)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, w, h);

    drawBigmap(refmap, data, x);
  }

  function end(ev) {
    if (xx === null)
      return;

    start = start + ((ev.clientX - rec.left - xx) / scl);

    if (start < 0)
      start = 0;

    xx = null;
  }

  cvs.addEventListener("mousedown", (ev) => xx = ev.clientX - rec.left);
  cvs.addEventListener("mouseout",  end);
  cvs.addEventListener("mouseup",   end);
  cvs.addEventListener("mousemove", (ev) => {
    if (xx === null)
      return;

    draw(start + ((ev.clientX - rec.left - xx) / scl));
  });

  draw(start);
}

function main() {
  var samples = DATA.allSamples;
  var bigmap  = canvas({ width: 900, height: 200 });
  var minimap = canvas({ width: 900, height: 75 });
  var overlay = canvas({ width: 900, height: 75 });
  var colors  = DATA.symbols.map(() => rnd(Math.random() * 50) + 30);
  var intmap  = null;

  get("#bigmap").appendChild(bigmap.element);
  get("#minimap").appendChild(minimap.element);
  get("#overlay").appendChild(overlay.element);

  var max = 0;
  intmap = samples.map((sample) => {
    if (sample.frames.length > max) {
      max = sample.frames.length;
    }

    return sample.frames.map((frame) => {
      return {
        resp: sample.extraInfo.responsiveness,
        color: colors[frame]
      };
    });
  });
  intmap.max = max;

  minimap.context.scale(minimap.element.width / intmap.length, 1);
  overlay.context.scale(minimap.element.width / intmap.length, 1);

  drawBigmap(bigmap, intmap, 0);
  drawOverview(minimap, intmap);

  // For demo only
  get(".jank a[data-val='10']").addEventListener("click", (ev) => {
    ev.preventDefault();
    JANK = 10;
    drawBigmap(bigmap, intmap, 0);
    drawOverview(minimap, intmap);
  });

  get(".jank a[data-val='15']").addEventListener("click", (ev) => {
    ev.preventDefault();
    JANK = 15;
    drawBigmap(bigmap, intmap, 0);
    drawOverview(minimap, intmap);
  });

  // Overlay
  var rect = get("#minimap").getBoundingClientRect();
  get("#overlay").style.left = rect.left;
  get("#overlay").style.top = rect.top;
  drawOverlay(overlay, bigmap, intmap, 0);
}