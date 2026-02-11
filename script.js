"use strict";

// Change this default name if you want a different fallback value.
const VALENTINE_NAME = "Samriddhi";

const elements = {
  name: document.getElementById("valentineName"),
  yesButton: document.getElementById("yesButton"),
  noButton: document.getElementById("noButton"),
  overlay: document.getElementById("celebrationOverlay"),
  overlayClose: document.getElementById("overlayClose"),
  audio: document.getElementById("bgMusic"),
  audioHint: document.getElementById("audioHint"),
  bgSlides: document.querySelectorAll(".bg-slide")
};

let hasStartedMusic = false;
const PHOTO_COUNT = 10;
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const SLIDESHOW_INTERVAL_MS = 3600;

function decodeName(rawValue) {
  if (typeof rawValue !== "string") return "";

  try {
    return decodeURIComponent(rawValue.replace(/\+/g, " "));
  } catch {
    return rawValue;
  }
}

function sanitizeName(value) {
  if (!value) return "";

  return value
    .normalize("NFKC")
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-zA-Z0-9 .,'-]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32);
}

function resolveValentineName() {
  const queryValue = new URLSearchParams(window.location.search).get("name");
  const decoded = decodeName(queryValue || "");
  const safeQueryName = sanitizeName(decoded);
  return safeQueryName || VALENTINE_NAME;
}

function applyValentineName() {
  elements.name.textContent = resolveValentineName();
}

async function startMusic() {
  if (!elements.audio || hasStartedMusic) return true;

  try {
    await elements.audio.play();
    hasStartedMusic = true;
    if (elements.audioHint) elements.audioHint.hidden = true;
    return true;
  } catch {
    return false;
  }
}

async function setupAudioPlayback() {
  const autoplayWorked = await startMusic();

  if (!autoplayWorked && elements.audioHint) {
    elements.audioHint.hidden = false;
  }

  const unlockOnFirstPointer = async () => {
    await startMusic();

    // Requirement: hide this hint on first tap/pointer interaction.
    if (elements.audioHint) {
      elements.audioHint.hidden = true;
    }
  };

  document.addEventListener("pointerdown", unlockOnFirstPointer, { once: true });
}

function randomWithin(min, max) {
  return Math.random() * (max - min) + min;
}

function moveNoButton(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const noButton = elements.noButton;
  const rect = noButton.getBoundingClientRect();
  const padding = 10;

  const maxX = Math.max(padding, window.innerWidth - rect.width - padding);
  const maxY = Math.max(padding, window.innerHeight - rect.height - padding);

  const nextX = randomWithin(padding, maxX);
  const nextY = randomWithin(padding, maxY);

  noButton.classList.add("is-floating");
  noButton.style.left = `${nextX}px`;
  noButton.style.top = `${nextY}px`;
}

function keepNoButtonInViewport() {
  const noButton = elements.noButton;

  if (!noButton.classList.contains("is-floating")) return;

  const rect = noButton.getBoundingClientRect();
  const padding = 10;
  const clampedX = Math.min(Math.max(rect.left, padding), window.innerWidth - rect.width - padding);
  const clampedY = Math.min(Math.max(rect.top, padding), window.innerHeight - rect.height - padding);

  noButton.style.left = `${clampedX}px`;
  noButton.style.top = `${clampedY}px`;
}

function setupRunawayNoButton() {
  const noButton = elements.noButton;

  ["mouseenter", "pointerdown", "touchstart"].forEach((eventName) => {
    noButton.addEventListener(eventName, moveNoButton, { passive: false });
  });

  noButton.addEventListener("click", moveNoButton);
  window.addEventListener("resize", keepNoButtonInViewport);
}

function makePlaceholderImage(index) {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#ffd6e0' />
          <stop offset='100%' stop-color='#ffc3d0' />
        </linearGradient>
      </defs>
      <rect width='800' height='600' fill='url(#g)' />
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#8e3a54' font-size='40' font-family='Trebuchet MS, sans-serif'>
        Add photo ${index}
      </text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function cssBackgroundUrl(source) {
  return `url("${source.replace(/"/g, '\\"')}")`;
}

function loadFirstAvailableSource(candidates, fallbackSource) {
  return new Promise((resolve) => {
    let current = 0;

    function tryNext() {
      if (current >= candidates.length) {
        resolve(fallbackSource);
        return;
      }

      const source = candidates[current];
      const image = new Image();
      image.onload = () => resolve(source);
      image.onerror = () => {
        current += 1;
        tryNext();
      };
      image.src = source;
    }

    tryNext();
  });
}

function getPhotoCandidates(index) {
  const photoNumber = index + 1;
  return PHOTO_EXTENSIONS.map((ext) => `assets/photos/${photoNumber}.${ext}`);
}

function setupBackgroundSlideshow() {
  const slides = Array.from(elements.bgSlides || []);

  if (slides.length < 2) {
    return;
  }

  const fallbackSources = Array.from({ length: PHOTO_COUNT }, (_, idx) => makePlaceholderImage(idx + 1));
  const resolvedSources = new Array(PHOTO_COUNT);
  let activeLayerIndex = 0;
  let activeImageIndex = 0;
  let isTransitioning = false;

  async function resolveSource(index) {
    if (resolvedSources[index]) {
      return resolvedSources[index];
    }

    const source = await loadFirstAvailableSource(getPhotoCandidates(index), fallbackSources[index]);
    resolvedSources[index] = source;
    return source;
  }

  async function setInitialBackground() {
    const firstSource = await resolveSource(0);
    slides[activeLayerIndex].style.backgroundImage = cssBackgroundUrl(firstSource);
    slides[activeLayerIndex].classList.add("is-active");
  }

  async function showNextBackground() {
    if (isTransitioning) {
      return;
    }

    isTransitioning = true;

    const nextImageIndex = (activeImageIndex + 1) % PHOTO_COUNT;
    const nextLayerIndex = activeLayerIndex === 0 ? 1 : 0;
    const nextSource = await resolveSource(nextImageIndex);

    slides[nextLayerIndex].style.backgroundImage = cssBackgroundUrl(nextSource);
    slides[nextLayerIndex].classList.add("is-active");
    slides[activeLayerIndex].classList.remove("is-active");

    activeLayerIndex = nextLayerIndex;
    activeImageIndex = nextImageIndex;
    isTransitioning = false;

    // Preload one step ahead to keep transitions smooth.
    const prefetchIndex = (activeImageIndex + 1) % PHOTO_COUNT;
    resolveSource(prefetchIndex);
  }

  setInitialBackground();
  resolveSource(1);
  window.setInterval(showNextBackground, SLIDESHOW_INTERVAL_MS);
}

function showCelebrationOverlay() {
  elements.overlay.classList.add("show");
  elements.overlay.setAttribute("aria-hidden", "false");
}

function hideCelebrationOverlay() {
  elements.overlay.classList.remove("show");
  elements.overlay.setAttribute("aria-hidden", "true");
}

function launchConfettiBurst(pieceCount = 150) {
  const colors = ["#ff4f79", "#ff8ca5", "#ffd166", "#7bd389", "#54c7ec", "#ffffff"];
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.appendChild(layer);

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight * 0.45;

  let completed = 0;

  for (let i = 0; i < pieceCount; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const width = randomWithin(6, 12);
    const height = randomWithin(10, 18);

    piece.style.width = `${width}px`;
    piece.style.height = `${height}px`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${centerX}px`;
    piece.style.top = `${centerY}px`;

    layer.appendChild(piece);

    const driftX = (Math.random() - 0.5) * window.innerWidth * 1.2;
    const fallY = randomWithin(window.innerHeight * 0.35, window.innerHeight * 0.95);
    const rotate = randomWithin(-760, 760);

    const animation = piece.animate(
      [
        {
          transform: "translate(-50%, -50%) translate(0, 0) rotate(0deg)",
          opacity: 1
        },
        {
          transform: `translate(-50%, -50%) translate(${driftX * 0.45}px, ${fallY * 0.45}px) rotate(${rotate * 0.55}deg)`,
          opacity: 1,
          offset: 0.68
        },
        {
          transform: `translate(-50%, -50%) translate(${driftX}px, ${fallY}px) rotate(${rotate}deg)`,
          opacity: 0
        }
      ],
      {
        duration: randomWithin(950, 1900),
        delay: randomWithin(0, 180),
        easing: "cubic-bezier(0.12, 0.82, 0.28, 1)",
        fill: "forwards"
      }
    );

    animation.onfinish = () => {
      piece.remove();
      completed += 1;

      if (completed === pieceCount) {
        layer.remove();
      }
    };
  }
}

function setupCelebrationFlow() {
  elements.yesButton.addEventListener("click", async () => {
    showCelebrationOverlay();
    await startMusic();
    launchConfettiBurst(170);
    window.setTimeout(() => launchConfettiBurst(120), 240);
  });

  elements.overlayClose.addEventListener("click", hideCelebrationOverlay);

  elements.overlay.addEventListener("click", (event) => {
    if (event.target === elements.overlay) {
      hideCelebrationOverlay();
    }
  });
}

function init() {
  applyValentineName();
  setupBackgroundSlideshow();
  setupAudioPlayback();
  setupRunawayNoButton();
  setupCelebrationFlow();
}

init();
