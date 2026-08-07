const area = document.getElementById("ratingArea");
const movers = [...document.querySelectorAll(".mover")];
const tenButton = document.getElementById("tenButton");
const questionView = document.getElementById("questionView");
const successView = document.getElementById("successView");
const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d");

const CONFIG = {
  triggerDistance: 205,
  cursorForce: 78,
  predictionStrength: 0.16,
  separationDistance: 88,
  separationForce: 42,
  tenRepelDistance: 125,
  wallPadding: 12
};

const directionBias = [
  { x: -1.00, y: -0.85 },
  { x: -0.65, y: -1.00 },
  { x: -0.15, y: -1.00 },
  { x: 0.55, y: -1.00 },
  { x: 1.00, y: -0.75 },
  { x: -1.00, y: 0.75 },
  { x: -0.45, y: 1.00 },
  { x: 0.35, y: 1.00 },
  { x: 1.00, y: 0.85 }
];

let lastPointer = null;
let finished = false;

function initializePositions() {
  const w = area.clientWidth;
  const h = area.clientHeight;
  const positions = [
    [w * 0.05, h * 0.10],
    [w * 0.22, h * 0.12],
    [w * 0.39, h * 0.10],
    [w * 0.56, h * 0.12],
    [w * 0.72, h * 0.10],
    [w * 0.10, h * 0.62],
    [w * 0.30, h * 0.66],
    [w * 0.52, h * 0.64],
    [w * 0.70, h * 0.66]
  ];

  movers.forEach((button, index) => {
    button.style.left = `${positions[index][0]}px`;
    button.style.top = `${positions[index][1]}px`;
  });

  tenButton.style.left = `${w * 0.88 - tenButton.offsetWidth / 2}px`;
  tenButton.style.top = `${h * 0.43 - tenButton.offsetHeight / 2}px`;
}

function clampButton(button, left, top) {
  const maxLeft = area.clientWidth - button.offsetWidth - CONFIG.wallPadding;
  const maxTop = area.clientHeight - button.offsetHeight - CONFIG.wallPadding;

  return {
    left: Math.min(Math.max(left, CONFIG.wallPadding), maxLeft),
    top: Math.min(Math.max(top, CONFIG.wallPadding), maxTop)
  };
}

function getDirection(button, pointerX, pointerY, index) {
  const cx = button.offsetLeft + button.offsetWidth / 2;
  const cy = button.offsetTop + button.offsetHeight / 2;

  let vx = cx - pointerX;
  let vy = cy - pointerY;
  const distance = Math.max(Math.hypot(vx, vy), 1);

  vx /= distance;
  vy /= distance;
  vx += directionBias[index].x * 0.5;
  vy += directionBias[index].y * 0.5;

  const magnitude = Math.max(Math.hypot(vx, vy), 1);
  return { x: vx / magnitude, y: vy / magnitude };
}

function moveButtons(clientX, clientY) {
  if (finished) return;

  const rect = area.getBoundingClientRect();
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  let predictedX = localX;
  let predictedY = localY;

  if (lastPointer) {
    predictedX += (localX - lastPointer.x) * CONFIG.predictionStrength * 10;
    predictedY += (localY - lastPointer.y) * CONFIG.predictionStrength * 10;
  }

  lastPointer = { x: localX, y: localY };

  const plans = movers.map((button, index) => {
    const cx = button.offsetLeft + button.offsetWidth / 2;
    const cy = button.offsetTop + button.offsetHeight / 2;
    let vx = 0;
    let vy = 0;

    const dx = cx - predictedX;
    const dy = cy - predictedY;
    const distance = Math.max(Math.hypot(dx, dy), 1);

    if (distance < CONFIG.triggerDistance) {
      const intensity = (CONFIG.triggerDistance - distance) / CONFIG.triggerDistance;
      const direction = getDirection(button, predictedX, predictedY, index);
      vx += direction.x * CONFIG.cursorForce * (1.05 + intensity * 2.0);
      vy += direction.y * CONFIG.cursorForce * (1.05 + intensity * 2.0);
    }

    movers.forEach((other) => {
      if (other === button) return;
      const ox = other.offsetLeft + other.offsetWidth / 2;
      const oy = other.offsetTop + other.offsetHeight / 2;
      const sdx = cx - ox;
      const sdy = cy - oy;
      const separation = Math.max(Math.hypot(sdx, sdy), 1);

      if (separation < CONFIG.separationDistance) {
        const pressure = (CONFIG.separationDistance - separation) / CONFIG.separationDistance;
        vx += (sdx / separation) * CONFIG.separationForce * (1.2 + pressure * 2.1);
        vy += (sdy / separation) * CONFIG.separationForce * (1.2 + pressure * 2.1);
      }
    });

    const tenX = tenButton.offsetLeft + tenButton.offsetWidth / 2;
    const tenY = tenButton.offsetTop + tenButton.offsetHeight / 2;
    const tdx = cx - tenX;
    const tdy = cy - tenY;
    const tenDistance = Math.max(Math.hypot(tdx, tdy), 1);

    if (tenDistance < CONFIG.tenRepelDistance) {
      const pressure = (CONFIG.tenRepelDistance - tenDistance) / CONFIG.tenRepelDistance;
      vx += (tdx / tenDistance) * 58 * (1 + pressure * 2);
      vy += (tdy / tenDistance) * 58 * (1 + pressure * 2);
    }

    return {
      button,
      left: button.offsetLeft + vx,
      top: button.offsetTop + vy
    };
  });

  plans.forEach((plan) => {
    const next = clampButton(plan.button, plan.left, plan.top);
    plan.button.style.left = `${next.left}px`;
    plan.button.style.top = `${next.top}px`;
  });
}

function showSuccess(pressedButton = null) {
  if (finished) return;
  finished = true;

  if (pressedButton && pressedButton !== tenButton) {
    pressedButton.textContent = "10";
    pressedButton.classList.add("caught");
  }

  const delay = pressedButton && pressedButton !== tenButton ? 420 : 0;

  window.setTimeout(() => {
    questionView.style.display = "none";
    successView.style.display = "grid";
    launchConfetti();
  }, delay);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchConfetti() {
  resizeCanvas();
  const colors = ["#ffbf00", "#ffffff", "#111111"];
  const particles = Array.from({ length: 180 }, () => ({
    x: canvas.clientWidth / 2,
    y: canvas.clientHeight * 0.25,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -10 - 4,
    gravity: 0.22 + Math.random() * 0.16,
    size: 5 + Math.random() * 8,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.28,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 160 + Math.random() * 70
  }));

  function frame() {
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.rotation += particle.spin;
      particle.life -= 1;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.7);
      ctx.restore();
    });

    const active = particles.some(
      (particle) => particle.life > 0 && particle.y < canvas.clientHeight + 40
    );

    if (active) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
  }

  requestAnimationFrame(frame);
}

area.addEventListener("mousemove", (event) => {
  moveButtons(event.clientX, event.clientY);
});

area.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
    const touch = event.touches[0];
    moveButtons(touch.clientX, touch.clientY);
  },
  { passive: false }
);

movers.forEach((button) => {
  button.addEventListener("mouseenter", (event) => {
    moveButtons(event.clientX, event.clientY);
  });

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    showSuccess(button);
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showSuccess(button);
    }
  });
});

tenButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  showSuccess(tenButton);
});

tenButton.addEventListener("click", (event) => {
  event.preventDefault();
});

tenButton.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    showSuccess(tenButton);
  }
});

window.addEventListener("resize", () => {
  initializePositions();
  resizeCanvas();
});

initializePositions();
resizeCanvas();
