"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

/* ---------- theme ---------- */

const themeToggle = document.getElementById("theme-toggle");

function currentTheme() {
  return document.documentElement.dataset.theme || (prefersLight.matches ? "light" : "dark");
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {}
  updateThemeLabel();
}

function updateThemeLabel() {
  themeToggle.textContent = currentTheme() === "dark" ? "theme: dark" : "theme: light";
}

themeToggle.addEventListener("click", () => {
  setTheme(currentTheme() === "dark" ? "light" : "dark");
});
prefersLight.addEventListener("change", updateThemeLabel);
updateThemeLabel();

/* ---------- last login ---------- */

const lastLogin = document.getElementById("last-login");
const now = new Date();
lastLogin.textContent =
  "Last login: " +
  now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).replace(",", "") +
  " " +
  now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) +
  " on ttys000";

/* ---------- particle portrait ---------- */

// Each pixel of the 32x32 portrait becomes a particle that is pushed away
// from the pointer and springs back home. Positions are in portrait pixels;
// PAD gives particles room to fly outside the portrait's box.
const GRID = 32;
const PAD = 6;
const SPAN = GRID + PAD * 2;

function startPortrait() {
  const figure = document.getElementById("portrait");
  const img = figure.querySelector("img");

  const source = document.createElement("canvas");
  source.width = source.height = GRID;
  const sctx = source.getContext("2d");
  sctx.drawImage(img, 0, 0, GRID, GRID);

  let pixels;
  try {
    pixels = sctx.getImageData(0, 0, GRID, GRID).data;
  } catch (e) {
    return; // tainted canvas (e.g. opened via file://); keep the static image
  }

  const particles = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const i = (y * GRID + x) * 4;
      if (pixels[i + 3] === 0) continue;
      const animateIn = !reducedMotion.matches;
      particles.push({
        ox: x,
        oy: y,
        x: animateIn ? Math.random() * SPAN - PAD : x,
        y: animateIn ? Math.random() * SPAN - PAD : y,
        vx: 0,
        vy: 0,
        color: `rgb(${pixels[i]},${pixels[i + 1]},${pixels[i + 2]})`,
      });
    }
  }

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = `position:absolute;inset:${(-PAD / GRID) * 100}%;width:auto;height:auto;pointer-events:none`;
  figure.style.position = "relative";
  figure.appendChild(canvas);
  img.style.visibility = "hidden";
  const ctx = canvas.getContext("2d");

  let cell = 0;
  function resize() {
    const size = figure.clientWidth * (SPAN / GRID);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.height = Math.round(size * dpr);
    cell = canvas.width / SPAN;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of particles) {
      // Snap both edges so neighbouring pixels meet without gaps.
      const x0 = Math.round((p.x + PAD) * cell);
      const y0 = Math.round((p.y + PAD) * cell);
      ctx.fillStyle = p.color;
      ctx.fillRect(x0, y0, Math.round((p.x + PAD + 1) * cell) - x0, Math.round((p.y + PAD + 1) * cell) - y0);
    }
  }

  const RADIUS = 5;
  const PUSH = 0.6;
  const EASE = 0.06;
  const FRICTION = 0.86;
  let pointer = null;
  let running = false;

  function step() {
    let moving = false;
    for (const p of particles) {
      if (pointer) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < RADIUS && d > 0.001) {
          const force = (1 - d / RADIUS) * PUSH;
          p.vx += (dx / d) * force;
          p.vy += (dy / d) * force;
        }
      }
      p.vx = (p.vx + (p.ox - p.x) * EASE) * FRICTION;
      p.vy = (p.vy + (p.oy - p.y) * EASE) * FRICTION;
      p.x += p.vx;
      p.y += p.vy;
      if (Math.abs(p.ox - p.x) + Math.abs(p.oy - p.y) + Math.abs(p.vx) + Math.abs(p.vy) > 0.01) {
        moving = true;
      } else {
        p.x = p.ox;
        p.y = p.oy;
      }
    }
    draw();
    if (moving || pointerNear()) {
      requestAnimationFrame(step);
    } else {
      running = false;
    }
  }

  function pointerNear() {
    return pointer && pointer.x > -RADIUS && pointer.y > -RADIUS && pointer.x < GRID + RADIUS && pointer.y < GRID + RADIUS;
  }

  function run() {
    if (running) return;
    running = true;
    requestAnimationFrame(step);
  }

  function onPointer(event) {
    if (reducedMotion.matches) return;
    const rect = figure.getBoundingClientRect();
    pointer = {
      x: ((event.clientX - rect.left) / rect.width) * GRID,
      y: ((event.clientY - rect.top) / rect.height) * GRID,
    };
    if (pointerNear()) run();
  }

  function clearPointer() {
    pointer = null;
  }

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("pointerdown", onPointer, { passive: true });
  window.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "mouse") clearPointer();
  });
  window.addEventListener("pointercancel", clearPointer);
  document.documentElement.addEventListener("pointerleave", clearPointer);

  new ResizeObserver(resize).observe(figure);
  resize();
  if (!reducedMotion.matches) run();
}

const portraitImg = document.querySelector("#portrait img");
if (portraitImg.complete && portraitImg.naturalWidth) {
  startPortrait();
} else {
  portraitImg.addEventListener("load", startPortrait, { once: true });
}

/* ---------- interactive shell ---------- */

const shell = document.getElementById("shell");
const output = document.getElementById("shell-output");
const form = document.getElementById("shell-form");
const input = document.getElementById("shell-input");

function sectionOutput(id) {
  const clone = document.querySelector(`#${id} .out`).cloneNode(true);
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  return clone;
}

function text(str) {
  const p = document.createElement("p");
  p.textContent = str;
  return p;
}

const commands = {
  help: () => {
    const p = document.createElement("p");
    p.className = "dim";
    p.textContent =
      "commands: whoami, work, projects, hobbies, contact, resume, theme [light|dark], date, echo, clear";
    return p;
  },
  whoami: () => sectionOutput("about"),
  about: () => sectionOutput("about"),
  work: () => sectionOutput("work"),
  projects: () => sectionOutput("projects"),
  ls: () => sectionOutput("projects"),
  hobbies: () => sectionOutput("hobbies"),
  contact: () => {
    const links = document.querySelector(".links").cloneNode(true);
    links.removeAttribute("aria-label");
    return links;
  },
  resume: () => {
    window.open("assets/troy-witmer-resume.pdf", "_blank", "noopener");
    return text("opening resume.pdf ...");
  },
  theme: (args) => {
    const next = args[0] === "light" || args[0] === "dark" ? args[0] : currentTheme() === "dark" ? "light" : "dark";
    setTheme(next);
    return text(`theme set to ${next}`);
  },
  date: () => text(new Date().toString()),
  echo: (args) => text(args.join(" ")),
  sudo: () => text("troy is not in the sudoers file. This incident will be reported."),
  exit: () => text("there is no escape. try `clear`."),
  make: () => text("compiling the linux kernel ... see you in 40 minutes."),
  clear: () => {
    output.replaceChildren();
    return null;
  },
};

const history = [];
let historyIndex = 0;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const line = input.value.trim();
  input.value = "";
  if (!line) return;
  history.push(line);
  historyIndex = history.length;

  const [name, ...args] = line.split(/\s+/);
  const command = commands[name.toLowerCase()];

  const echo = document.createElement("p");
  echo.className = "prompt echo";
  echo.innerHTML = '<span class="ps1" aria-hidden="true">~$ </span>';
  echo.append(line);

  const result = command ? command(args) : text(`zsh: command not found: ${name}`);
  if (name.toLowerCase() === "clear") return;
  output.append(echo);
  if (result) output.append(result);
  form.scrollIntoView({ block: "nearest" });
});

input.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" && historyIndex > 0) {
    event.preventDefault();
    input.value = history[--historyIndex];
  } else if (event.key === "ArrowDown" && historyIndex < history.length) {
    event.preventDefault();
    historyIndex++;
    input.value = history[historyIndex] ?? "";
  } else if (event.key === "Tab" && input.value && !input.value.includes(" ")) {
    const match = Object.keys(commands).filter((c) => c.startsWith(input.value.toLowerCase()));
    if (match.length === 1) {
      event.preventDefault();
      input.value = match[0] + " ";
    }
  }
});

shell.addEventListener("click", (event) => {
  if (!event.target.closest("a") && !window.getSelection().toString()) input.focus();
});

shell.hidden = false;
