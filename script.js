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
  carouselTrack: document.getElementById("carouselTrack"),
  carouselPrev: document.getElementById("carouselPrev"),
  carouselNext: document.getElementById("carouselNext"),
  carouselDots: document.getElementById("carouselDots"),
  carouselViewport: document.getElementById("carouselViewport")
};

let hasStartedMusic = false;

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

function setupImageFallbacks() {
  const images = document.querySelectorAll(".gallery-image");

  images.forEach((img, idx) => {
    img.addEventListener(
      "error",
      () => {
        img.src = makePlaceholderImage(idx + 1);
        img.alt = `Placeholder image ${idx + 1}`;
      },
      { once: true }
    );
  });
}

function setupCarousel() {
  const { carouselTrack, carouselPrev, carouselNext, carouselDots, carouselViewport } = elements;

  if (!carouselTrack || !carouselPrev || !carouselNext || !carouselDots || !carouselViewport) {
    return;
  }

  const slides = Array.from(carouselTrack.querySelectorAll(".slide"));

  if (!slides.length) {
    return;
  }

  let currentIndex = 0;
  let touchStartX = 0;

  function setSlide(index) {
    currentIndex = (index + slides.length) % slides.length;
    carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;

    const dots = carouselDots.querySelectorAll(".carousel-dot");
    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Go to photo ${index + 1}`);
    dot.addEventListener("click", () => setSlide(index));
    carouselDots.appendChild(dot);
  });

  carouselPrev.addEventListener("click", () => setSlide(currentIndex - 1));
  carouselNext.addEventListener("click", () => setSlide(currentIndex + 1));

  carouselViewport.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  });

  carouselViewport.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const delta = touchEndX - touchStartX;

    if (Math.abs(delta) < 40) {
      return;
    }

    if (delta > 0) {
      setSlide(currentIndex - 1);
      return;
    }

    setSlide(currentIndex + 1);
  });

  carouselViewport.setAttribute("tabindex", "0");
  carouselViewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      setSlide(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      setSlide(currentIndex + 1);
    }
  });

  setSlide(0);
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
  setupAudioPlayback();
  setupRunawayNoButton();
  setupImageFallbacks();
  setupCarousel();
  setupCelebrationFlow();
}

init();
