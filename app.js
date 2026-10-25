const rainCanvas = document.getElementById("rain");
const ctx = rainCanvas.getContext("2d");

const beadsContainer = document.getElementById("beads");
const countElement = document.getElementById("count");
const popup = document.getElementById("popup");

const audio = document.getElementById("nasheed");
const soundButton = document.getElementById("soundButton");
const soundStatus = document.getElementById("soundStatus");
const soundWave = document.getElementById("soundWave");
const resetButton = document.getElementById("resetButton");

let width = 0;
let height = 0;
let count = 0;
let lastTime = 0;
let offset = 0;
let cycle = 0;
let beads = [];
let drops = [];
let resizeTimer;

const spacing = 39;
const speed = spacing / 1.2;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  width = window.innerWidth;
  height = window.innerHeight;

  rainCanvas.width = Math.round(width * dpr);
  rainCanvas.height = Math.round(height * dpr);
  rainCanvas.style.width = `${width}px`;
  rainCanvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createRain();
  createBeads();
}

function createRain() {
  const amount = Math.min(260, Math.floor(width * height / 1800));

  drops = Array.from({ length: amount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    length: 8 + Math.random() * 20,
    speed: 180 + Math.random() * 300,
    drift: -12 - Math.random() * 28,
    opacity: 0.08 + Math.random() * 0.23
  }));
}

function createBeads() {
  beadsContainer.innerHTML = "";
  beads = [];

  const total = Math.ceil(width / spacing) + 12;
  cycle = total * spacing;

  for (let i = 0; i < total; i++) {
    const element = document.createElement("div");
    element.className = "bead";

    if (i === 0) {
      element.classList.add("gold");
    }

    const tassel = document.createElement("div");
    tassel.className = "tassel";

    for (let j = 0; j < 7; j++) {
      tassel.appendChild(document.createElement("span"));
    }

    if (i === 0) {
      element.appendChild(tassel);
    }

    beadsContainer.appendChild(element);

    beads.push({
      element,
      index: i,
      previousX: null,
      passed: false
    });
  }

  offset = 0;
}

function drawRain(delta) {
  ctx.clearRect(0, 0, width, height);

  for (const drop of drops) {
    ctx.beginPath();
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(
      drop.x + drop.drift * 0.04,
      drop.y + drop.length
    );

    ctx.strokeStyle = `rgba(190, 231, 255, ${drop.opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    drop.x += drop.drift * delta;
    drop.y += drop.speed * delta;

    if (drop.y > height + drop.length) {
      drop.y = -drop.length;
      drop.x = Math.random() * width;
    }

    if (drop.x < -30) {
      drop.x = width + 10;
    }
  }
}

function updateCounter(bead) {
  count = count >= 100 ? 0 : count + 1;
  countElement.textContent = String(count);

  popup.classList.remove("show");
  void popup.offsetWidth;
  popup.textContent = "+1";
  popup.classList.add("show");

  if (count === 1 || count % 66 === 0) {
    bead.element.classList.add("gold");

    if (!bead.element.querySelector(".tassel")) {
      const tassel = document.createElement("div");
      tassel.className = "tassel";

      for (let i = 0; i < 7; i++) {
        tassel.appendChild(document.createElement("span"));
      }

      bead.element.appendChild(tassel);
    }
  } else {
    bead.element.classList.remove("gold");
    bead.element.querySelector(".tassel")?.remove();
  }
}

function animateBeads(delta) {
  const area = document.querySelector(".tasbeeh");
  const areaWidth = area.clientWidth;
  const areaHeight = area.clientHeight;
  const center = areaWidth / 2;

  const previousOffset = offset;
  offset = (offset + speed * delta) % cycle;

  for (const bead of beads) {
    const raw = bead.index * spacing + offset;
    const relativeX =
      ((raw + cycle / 2) % cycle + cycle) % cycle - cycle / 2;

    const x = center + relativeX;
    const distance = Math.abs(relativeX);
    const curve = Math.min(distance / (areaWidth * 0.48), 1);
    const y = areaHeight * 0.25 + curve * curve * areaHeight * 0.48;

    bead.element.style.left = `${x}px`;
    bead.element.style.top = `${y}px`;

    if (
      bead.previousX !== null &&
      bead.previousX < center &&
      x >= center &&
      x - bead.previousX < spacing * 1.5
    ) {
      updateCounter(bead);
    }

    bead.previousX = x;
  }
}

function frame(time) {
  const delta = lastTime
    ? Math.min((time - lastTime) / 1000, 0.04)
    : 0;

  lastTime = time;

  drawRain(delta);
  animateBeads(delta);

  requestAnimationFrame(frame);
}

soundButton.addEventListener("click", async () => {
  if (audio.paused) {
    try {
      await audio.play();

      soundButton.textContent = "Ⅱ";
      soundStatus.textContent = "NASHEED · ON";
      soundWave.classList.add("active");
    } catch (error) {
      soundStatus.textContent = "FAYLNI TEKSHIRING";
      console.error("Nasheed ishga tushmadi:", error);
    }
  } else {
    audio.pause();
    soundButton.textContent = "♫";
    soundStatus.textContent = "NASHEED · OFF";
    soundWave.classList.remove("active");
  }
});

audio.addEventListener("error", () => {
  soundStatus.textContent = "NASHEED FAYLI TOPILMADI";
});

audio.addEventListener("ended", () => {
  soundButton.textContent = "♫";
  soundStatus.textContent = "NASHEED · OFF";
  soundWave.classList.remove("active");
});

resetButton.addEventListener("click", () => {
  count = 0;
  countElement.textContent = "0";
  popup.classList.remove("show");
});

window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 120);
});

resize();
requestAnimationFrame(frame);