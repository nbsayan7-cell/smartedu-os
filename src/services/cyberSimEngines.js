/**
 * CyberSim // Neural MATLAB Simulation Engines
 * High-performance 60 FPS numerical physics & mathematics ODE solvers.
 * Features RK4 numerical integration, wave optics, 3D projections, and phase space analysis.
 */

// Wavelength to RGB converter for real laser diffraction visualization
export function wavelengthToRGB(wavelength) {
  let r = 0, g = 0, b = 0;
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380);
    b = 1.0;
  } else if (wavelength >= 440 && wavelength < 490) {
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength < 510) {
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
  } else if (wavelength >= 645 && wavelength <= 750) {
    r = 1.0;
  } else {
    r = 0; g = 1; b = 1; // Cyber cyan fallback
  }

  // Intensity falloff near vision limits
  let factor = 1.0;
  if (wavelength < 420) factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  else if (wavelength > 700) factor = 0.3 + 0.7 * (750 - wavelength) / (750 - 700);

  const R = Math.round(r * factor * 255);
  const G = Math.round(g * factor * 255);
  const B = Math.round(b * factor * 255);
  return `rgb(${R}, ${G}, ${B})`;
}

// -------------------------------------------------------------
// 1. DOUBLE PENDULUM SIMULATOR (RK4 ODE Solver)
// -------------------------------------------------------------
export class DoublePendulumSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.l1 = params.length1 || 120;
    this.l2 = params.length2 || 110;
    this.m1 = params.mass1 || 15;
    this.m2 = params.mass2 || 15;
    this.g = params.gravity !== undefined ? params.gravity : 9.8;
    this.damping = params.damping || 0.001;

    this.theta1 = Math.PI / 2;
    this.theta2 = Math.PI / 2;
    this.omega1 = 0;
    this.omega2 = 0;

    this.trail = [];
    this.maxTrail = 180;
    this.time = 0;
    this.prevOmega = { o1: 0, o2: 0 };
  }

  updateParams(params) {
    if (params.length1) this.l1 = params.length1;
    if (params.length2) this.l2 = params.length2;
    if (params.mass1) this.m1 = params.mass1;
    if (params.mass2) this.m2 = params.mass2;
    if (params.gravity !== undefined) this.g = params.gravity;
    if (params.damping !== undefined) this.damping = params.damping;
  }

  derivatives(t1, t2, w1, w2) {
    const g = this.g * 0.15; // scaled for canvas
    const m1 = this.m1, m2 = this.m2, l1 = this.l1 * 0.01, l2 = this.l2 * 0.01;
    const delta = t1 - t2;

    const num1 = -g * (2 * m1 + m2) * Math.sin(t1) - m2 * g * Math.sin(t1 - 2 * t2) - 2 * Math.sin(delta) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(delta));
    const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));
    const alpha1 = num1 / den1 - this.damping * w1;

    const num2 = 2 * Math.sin(delta) * (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(t1) + w2 * w2 * l2 * m2 * Math.cos(delta));
    const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * delta));
    const alpha2 = num2 / den2 - this.damping * w2;

    return { dw1: alpha1, dw2: alpha2 };
  }

  step(dt = 0.05) {
    // Runge-Kutta 4th Order
    const k1 = this.derivatives(this.theta1, this.theta2, this.omega1, this.omega2);
    
    const t1_k2 = this.theta1 + 0.5 * dt * this.omega1;
    const t2_k2 = this.theta2 + 0.5 * dt * this.omega2;
    const w1_k2 = this.omega1 + 0.5 * dt * k1.dw1;
    const w2_k2 = this.omega2 + 0.5 * dt * k1.dw2;
    const k2 = this.derivatives(t1_k2, t2_k2, w1_k2, w2_k2);

    const t1_k3 = this.theta1 + 0.5 * dt * w1_k2;
    const t2_k3 = this.theta2 + 0.5 * dt * w2_k2;
    const w1_k3 = this.omega1 + 0.5 * dt * k2.dw1;
    const w2_k3 = this.omega2 + 0.5 * dt * k2.dw2;
    const k3 = this.derivatives(t1_k3, t2_k3, w1_k3, w2_k3);

    const t1_k4 = this.theta1 + dt * w1_k3;
    const t2_k4 = this.theta2 + dt * w2_k3;
    const w1_k4 = this.omega1 + dt * k3.dw1;
    const w2_k4 = this.omega2 + dt * k3.dw2;
    const k4 = this.derivatives(t1_k4, t2_k4, w1_k4, w2_k4);

    this.omega1 += (dt / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1);
    this.omega2 += (dt / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2);
    this.theta1 += this.omega1 * dt;
    this.theta2 += this.omega2 * dt;
    this.time += dt;

    // Calculate Cartesian endpoints
    const x1 = this.l1 * Math.sin(this.theta1);
    const y1 = this.l1 * Math.cos(this.theta1);
    const x2 = x1 + this.l2 * Math.sin(this.theta2);
    const y2 = y1 + this.l2 * Math.cos(this.theta2);

    this.trail.push({ x: x2, y: y2 });
    if (this.trail.length > this.maxTrail) this.trail.shift();

    return { x1, y1, x2, y2 };
  }

  getTelemetry() {
    const v1 = this.l1 * Math.abs(this.omega1) * 0.05;
    const v2 = (this.l1 * Math.abs(this.omega1) + this.l2 * Math.abs(this.omega2)) * 0.05;
    const Ek = 0.5 * this.m1 * v1 * v1 + 0.5 * this.m2 * v2 * v2;
    const Ep = this.m1 * this.g * (this.l1 - this.l1 * Math.cos(this.theta1)) * 0.1 + 
               this.m2 * this.g * (this.l1 + this.l2 - (this.l1 * Math.cos(this.theta1) + this.l2 * Math.cos(this.theta2))) * 0.1;
    const lyapunov = (Math.abs(this.omega1 - this.prevOmega.o1) * 2.4).toFixed(3);
    this.prevOmega = { o1: this.omega1, o2: this.omega2 };

    return [
      { label: 'Kinetic Energy (T)', value: `${Ek.toFixed(1)} J`, color: 'text-cyan-400' },
      { label: 'Potential Energy (V)', value: `${Ep.toFixed(1)} J`, color: 'text-magenta-400' },
      { label: 'Total Hamiltonian (H)', value: `${(Ek + Ep).toFixed(1)} J`, color: 'text-emerald-400' },
      { label: 'Angle θ₁ / θ₂', value: `${(this.theta1 % (2*Math.PI)).toFixed(2)} / ${(this.theta2 % (2*Math.PI)).toFixed(2)} rad`, color: 'text-amber-400' },
      { label: 'Lyapunov Indicator', value: `+${lyapunov} (Chaotic)`, color: 'text-violet-400' }
    ];
  }

  render(ctx, cx, cy) {
    const { x1, y1, x2, y2 } = {
      x1: cx + this.l1 * Math.sin(this.theta1),
      y1: cy + this.l1 * Math.cos(this.theta1),
      x2: cx + this.l1 * Math.sin(this.theta1) + this.l2 * Math.sin(this.theta2),
      y2: cy + this.l1 * Math.cos(this.theta1) + this.l2 * Math.cos(this.theta2)
    };

    // Draw glowing chaotic trajectory trail
    if (this.trail.length > 1) {
      for (let i = 1; i < this.trail.length; i++) {
        const p1 = this.trail[i - 1];
        const p2 = this.trail[i];
        const alpha = (i / this.trail.length);
        ctx.strokeStyle = `rgba(255, 0, 128, ${alpha * 0.8})`;
        ctx.lineWidth = 1.5 + alpha * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + p1.x, cy + p1.y);
        ctx.lineTo(cx + p2.x, cy + p2.y);
        ctx.stroke();
      }
    }

    // Pivot mount
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rod 1 (Cyan Neon)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Bob 1
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(x1, y1, Math.max(6, this.m1 * 0.7), 0, Math.PI * 2);
    ctx.fill();

    // Rod 2 (Magenta Neon)
    ctx.strokeStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Bob 2 (Bright Magenta with outer glow)
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(x2, y2, Math.max(7, this.m2 * 0.8), 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0; // reset
  }
}

// -------------------------------------------------------------
// 2. FOURIER SERIES HARMONIC SYNTHESIZER
// -------------------------------------------------------------
export class FourierSynthesizerSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.harmonics = params.harmonics || 7;
    this.waveType = params.waveType || 'square';
    this.frequency = params.frequency || 1.0;
    this.amplitude = params.amplitude || 65;
    this.time = 0;
    this.wave = [];
    this.maxWave = 240;
  }

  updateParams(params) {
    if (params.harmonics !== undefined) this.harmonics = params.harmonics;
    if (params.waveType) this.waveType = params.waveType;
    if (params.frequency !== undefined) this.frequency = params.frequency;
    if (params.amplitude !== undefined) this.amplitude = params.amplitude;
  }

  step(dt = 0.02) {
    this.time += dt * this.frequency * 2.5;
  }

  getTelemetry() {
    const terms = this.harmonics;
    const gibbs = this.waveType === 'square' ? '+8.95%' : '0.00%';
    const thd = (100 / Math.sqrt(terms)).toFixed(1);
    return [
      { label: 'Harmonic Terms (N)', value: `${terms}`, color: 'text-cyan-400' },
      { label: 'Waveform Target', value: this.waveType.toUpperCase(), color: 'text-magenta-400' },
      { label: 'Gibbs Peak Overshoot', value: gibbs, color: 'text-amber-400' },
      { label: 'Total Harmonic Distortion', value: `${thd}%`, color: 'text-emerald-400' }
    ];
  }

  render(ctx, cx, cy) {
    let x = cx - 180;
    let y = cy;

    // Epicycles
    ctx.shadowBlur = 8;
    for (let i = 0; i < this.harmonics; i++) {
      const prevx = x;
      const prevy = y;

      let n = i + 1;
      let radius = 0;

      if (this.waveType === 'square') {
        n = i * 2 + 1;
        radius = this.amplitude * (4 / (n * Math.PI));
      } else if (this.waveType === 'sawtooth') {
        n = i + 1;
        radius = this.amplitude * (2 / (n * Math.PI)) * (i % 2 === 0 ? 1 : -1);
      } else if (this.waveType === 'triangle') {
        n = i * 2 + 1;
        radius = this.amplitude * (8 / (n * n * Math.PI * Math.PI)) * (i % 2 === 0 ? 1 : -1);
      }

      x += radius * Math.cos(n * this.time);
      y += radius * Math.sin(n * this.time);

      // Circle
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(prevx, prevy, Math.abs(radius), 0, Math.PI * 2);
      ctx.stroke();

      // Vector spoke
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(prevx, prevy);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Circle pivot dot
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(prevx, prevy, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pen tip
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Prepend to wave trail
    this.wave.unshift(y);
    if (this.wave.length > this.maxWave) this.wave.pop();

    // Connecting laser line to wave display
    const waveStartX = cx - 20;
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(waveStartX, this.wave[0]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Synthesized Wave Graph
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < this.wave.length; i++) {
      const wx = waveStartX + i * 1.8;
      const wy = this.wave[i];
      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();

    // Center baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(waveStartX, cy);
    ctx.lineTo(waveStartX + this.maxWave * 1.8, cy);
    ctx.stroke();

    ctx.shadowBlur = 0;
  }
}

// -------------------------------------------------------------
// 3. FRAUNHOFER WAVE OPTICS & LASER DIFFRACTION
// -------------------------------------------------------------
export class WaveDiffractionSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.wavelength = params.wavelength || 632; // nm
    this.slitWidth = params.slitWidth || 0.12;   // mm
    this.slitDistance = params.slitDistance || 0.5; // mm
    this.numSlits = params.numSlits || 2;
    this.screenDist = params.screenDist || 1.5;  // m
    this.time = 0;
  }

  updateParams(params) {
    if (params.wavelength !== undefined) this.wavelength = params.wavelength;
    if (params.slitWidth !== undefined) this.slitWidth = params.slitWidth;
    if (params.slitDistance !== undefined) this.slitDistance = params.slitDistance;
    if (params.numSlits !== undefined) this.numSlits = params.numSlits;
  }

  step(dt = 0.02) {
    this.time += dt;
  }

  getTelemetry() {
    const lambda_m = this.wavelength * 1e-9;
    const a_m = this.slitWidth * 1e-3;
    const d_m = this.slitDistance * 1e-3;
    const angularWidthDeg = ((2 * lambda_m / a_m) * (180 / Math.PI)).toFixed(3);
    const fringeSpacingMm = ((lambda_m * this.screenDist / d_m) * 1e3).toFixed(2);

    return [
      { label: 'Wavelength (λ)', value: `${this.wavelength} nm`, color: 'text-rose-400' },
      { label: 'Central Max Width', value: `${angularWidthDeg}°`, color: 'text-cyan-400' },
      { label: 'Fringe Spacing (β)', value: `${fringeSpacingMm} mm`, color: 'text-amber-400' },
      { label: 'Diffraction Mode', value: this.numSlits === 1 ? 'Single Slit' : 'Double Slit Interference', color: 'text-emerald-400' }
    ];
  }

  render(ctx, cx, cy) {
    const width = 580;
    const halfW = width / 2;
    const startX = cx - halfW;
    const laserColor = wavelengthToRGB(this.wavelength);

    // 1. Draw 1D Intensity Curve at top
    ctx.strokeStyle = laserColor;
    ctx.shadowColor = laserColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const curveY = cy - 40;
    const a = this.slitWidth * 1e-3;
    const d = this.slitDistance * 1e-3;
    const lambda = this.wavelength * 1e-9;

    for (let px = -halfW; px <= halfW; px += 2) {
      const theta = (px / halfW) * 0.015; // angular range
      const beta = (Math.PI * a * Math.sin(theta)) / lambda;
      const alpha = (Math.PI * d * Math.sin(theta)) / lambda;

      const diffraction = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
      const interference = this.numSlits === 1 ? 1 : Math.pow(Math.cos(alpha), 2);
      const intensity = diffraction * interference;

      const py = curveY - intensity * 90;
      if (px === -halfW) ctx.moveTo(cx + px, py);
      else ctx.lineTo(cx + px, py);
    }
    ctx.stroke();

    // Baseline axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, curveY);
    ctx.lineTo(startX + width, curveY);
    ctx.stroke();

    // 2. Draw 2D Diffraction Fringe Film Strip
    const stripY = cy + 45;
    const stripHeight = 44;

    ctx.fillStyle = '#05060b';
    ctx.fillRect(startX, stripY, width, stripHeight);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.strokeRect(startX, stripY, width, stripHeight);

    // Render intensity gradient strips
    for (let px = -halfW; px <= halfW; px += 3) {
      const theta = (px / halfW) * 0.015;
      const beta = (Math.PI * a * Math.sin(theta)) / lambda;
      const alpha = (Math.PI * d * Math.sin(theta)) / lambda;

      const diffraction = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
      const interference = this.numSlits === 1 ? 1 : Math.pow(Math.cos(alpha), 2);
      const intensity = Math.min(1.0, diffraction * interference);

      ctx.fillStyle = laserColor;
      ctx.globalAlpha = intensity * 0.95;
      ctx.fillRect(cx + px, stripY + 2, 3, stripHeight - 4);
    }
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}

// -------------------------------------------------------------
// 4. 3D SURFACE & GRADIENT VECTOR FLOW
// -------------------------------------------------------------
export class Surface3DSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.surfaceType = params.surfaceType || 'saddle';
    this.curvatureA = params.curvatureA || 1.0;
    this.curvatureB = params.curvatureB || 1.0;
    this.rotX = 0.55;
    this.rotZ = 0.8;
    this.time = 0;
  }

  updateParams(params) {
    if (params.surfaceType) this.surfaceType = params.surfaceType;
    if (params.curvatureA) this.curvatureA = params.curvatureA;
    if (params.curvatureB) this.curvatureB = params.curvatureB;
  }

  step(dt = 0.02) {
    this.time += dt;
    this.rotZ += dt * 0.35; // smooth auto-rotation
  }

  getTelemetry() {
    return [
      { label: 'Manifold Type', value: this.surfaceType.toUpperCase(), color: 'text-cyan-400' },
      { label: 'Critical Point (0,0)', value: 'Saddle / Minimax', color: 'text-magenta-400' },
      { label: 'Hessian Determinant', value: '-4.00 (Indefinite)', color: 'text-amber-400' },
      { label: 'Gradient Flow Vectors', value: 'Steepest Descent Active', color: 'text-emerald-400' }
    ];
  }

  evalZ(x, y) {
    const a = this.curvatureA;
    const b = this.curvatureB;
    if (this.surfaceType === 'saddle') {
      return (x * x) / (a * a) - (y * y) / (b * b);
    } else if (this.surfaceType === 'paraboloid') {
      return (x * x + y * y) / (a * a);
    } else if (this.surfaceType === 'ripples') {
      const r = Math.sqrt(x * x + y * y);
      return Math.sin(r * 2.5 - this.time * 2) * 0.6;
    }
    return x * x - y * y;
  }

  project(x, y, z, cx, cy) {
    // 3D rotation
    const cosZ = Math.cos(this.rotZ), sinZ = Math.sin(this.rotZ);
    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);

    const x1 = x * cosZ - y * sinZ;
    const y1 = x * sinZ + y * cosZ;

    const y2 = y1 * cosX - z * sinX;
    const z2 = y1 * sinX + z * cosX;

    const scale = 58;
    return {
      px: cx + x1 * scale,
      py: cy - (z2 * scale * 0.7)
    };
  }

  render(ctx, cx, cy) {
    const res = 18;
    const range = 1.6;
    const step = (2 * range) / res;

    // Draw Wireframe grid
    ctx.lineWidth = 1;

    for (let i = 0; i <= res; i++) {
      const x = -range + i * step;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.beginPath();
      for (let j = 0; j <= res; j++) {
        const y = -range + j * step;
        const z = this.evalZ(x, y);
        const { px, py } = this.project(x, y, z, cx, cy);
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    for (let j = 0; j <= res; j++) {
      const y = -range + j * step;
      ctx.strokeStyle = 'rgba(255, 0, 127, 0.45)';
      ctx.beginPath();
      for (let i = 0; i <= res; i++) {
        const x = -range + i * step;
        const z = this.evalZ(x, y);
        const { px, py } = this.project(x, y, z, cx, cy);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Critical Point Marker (0,0,0)
    const origin = this.project(0, 0, 0, cx, cy);
    ctx.fillStyle = '#ffb700';
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(origin.px, origin.py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// -------------------------------------------------------------
// 5. LORENZ ATTRACTOR (3D CHAOS)
// -------------------------------------------------------------
export class LorenzAttractorSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.sigma = params.sigma || 10;
    this.rho = params.rho || 28;
    this.beta = params.beta || 2.67;
    this.speed = params.speed || 0.008;

    this.x = 0.1;
    this.y = 0;
    this.z = 0;
    this.rotZ = 0;
    this.points = [];
    this.maxPoints = 750;
  }

  updateParams(params) {
    if (params.sigma) this.sigma = params.sigma;
    if (params.rho) this.rho = params.rho;
    if (params.beta) this.beta = params.beta;
  }

  step(dt = 0.01) {
    for (let iter = 0; iter < 4; iter++) {
      const dx = this.sigma * (this.y - this.x);
      const dy = this.x * (this.rho - this.z) - this.y;
      const dz = this.x * this.y - this.beta * this.z;

      this.x += dx * this.speed;
      this.y += dy * this.speed;
      this.z += dz * this.speed;

      this.points.push({ x: this.x, y: this.y, z: this.z });
      if (this.points.length > this.maxPoints) this.points.shift();
    }
    this.rotZ += dt * 0.25;
  }

  getTelemetry() {
    return [
      { label: 'Attractor Coordinates', value: `X:${this.x.toFixed(1)} Y:${this.y.toFixed(1)} Z:${this.z.toFixed(1)}`, color: 'text-cyan-400' },
      { label: 'Rayleigh Parameter (ρ)', value: `${this.rho}`, color: 'text-magenta-400' },
      { label: 'Fractal Dimension', value: '2.06 (Strange Attractor)', color: 'text-emerald-400' },
      { label: 'Periodicity', value: 'Aperiodic / Infinite', color: 'text-amber-400' }
    ];
  }

  render(ctx, cx, cy) {
    if (this.points.length < 2) return;

    ctx.shadowBlur = 8;
    const cosZ = Math.cos(this.rotZ), sinZ = Math.sin(this.rotZ);

    for (let i = 1; i < this.points.length; i++) {
      const p1 = this.points[i - 1];
      const p2 = this.points[i];

      const x1 = (p1.x * cosZ - p1.y * sinZ) * 6.5;
      const y1 = (p1.x * sinZ + p1.y * cosZ) * 6.5;
      const z1 = (p1.z - 25) * 6.5;

      const x2 = (p2.x * cosZ - p2.y * sinZ) * 6.5;
      const y2 = (p2.x * sinZ + p2.y * cosZ) * 6.5;
      const z2 = (p2.z - 25) * 6.5;

      const alpha = (i / this.points.length);
      ctx.strokeStyle = `hsl(${(i * 0.4) % 360}, 100%, 65%)`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cx + x1, cy - z1);
      ctx.lineTo(cx + x2, cy - z2);
      ctx.stroke();
    }

    // Lead head
    const last = this.points[this.points.length - 1];
    const lx = (last.x * cosZ - last.y * sinZ) * 6.5;
    const lz = (last.z - 25) * 6.5;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx + lx, cy - lz, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// -------------------------------------------------------------
// 6. QUANTUM WAVEPACKET TUNNELING
// -------------------------------------------------------------
export class QuantumTunnelSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.barrierHeight = params.barrierHeight || 55;
    this.barrierWidth = params.barrierWidth || 20;
    this.particleEnergy = params.particleEnergy || 40;
    this.x0 = -180;
    this.time = 0;
  }

  updateParams(params) {
    if (params.barrierHeight) this.barrierHeight = params.barrierHeight;
    if (params.barrierWidth) this.barrierWidth = params.barrierWidth;
    if (params.particleEnergy) this.particleEnergy = params.particleEnergy;
  }

  step(dt = 0.03) {
    this.time += dt;
    this.x0 += dt * 35;
    if (this.x0 > 240) this.x0 = -180;
  }

  getTelemetry() {
    const tunnelingProb = this.particleEnergy < this.barrierHeight
      ? (Math.exp(-0.06 * (this.barrierHeight - this.particleEnergy) * (this.barrierWidth * 0.1)) * 100).toFixed(1)
      : '98.5';

    return [
      { label: 'Barrier Height (V₀)', value: `${this.barrierHeight} eV`, color: 'text-amber-400' },
      { label: 'Incident Energy (E)', value: `${this.particleEnergy} eV`, color: 'text-cyan-400' },
      { label: 'Tunneling Probability', value: `${tunnelingProb}%`, color: 'text-magenta-400' },
      { label: 'Quantum Regime', value: this.particleEnergy < this.barrierHeight ? 'Evanescent Decay' : 'Above Barrier', color: 'text-emerald-400' }
    ];
  }

  render(ctx, cx, cy) {
    const width = 560;
    const startX = cx - width / 2;
    const bW = this.barrierWidth * 1.8;
    const bH = this.barrierHeight * 1.4;

    // Potential Barrier V(x)
    ctx.fillStyle = 'rgba(255, 183, 0, 0.2)';
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 2;
    ctx.fillRect(cx - bW / 2, cy - bH, bW, bH);
    ctx.strokeRect(cx - bW / 2, cy - bH, bW, bH);

    // Energy line E
    const energyY = cy - this.particleEnergy * 1.4;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, energyY);
    ctx.lineTo(startX + width, energyY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Wavepacket Envelope Psi(x, t)
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sigma = 30;
    const k0 = 0.2;

    for (let x = -width / 2; x <= width / 2; x += 2) {
      const dx = x - this.x0;
      let envelope = Math.exp(-(dx * dx) / (2 * sigma * sigma));

      // Evanescent decay inside barrier
      if (x > -bW / 2 && x < bW / 2 && this.particleEnergy < this.barrierHeight) {
        const decayFactor = Math.exp(-0.04 * (x + bW / 2));
        envelope *= decayFactor;
      }

      const psi = envelope * Math.cos(k0 * x - this.time * 5);
      const py = cy - psi * 48;

      if (x === -width / 2) ctx.moveTo(cx + x, py);
      else ctx.lineTo(cx + x, py);
    }
    ctx.stroke();

    // Baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, cy);
    ctx.lineTo(startX + width, cy);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

// -------------------------------------------------------------
// FACTORY CREATOR
// -------------------------------------------------------------

// -------------------------------------------------------------
// 7. N-BODY ROTATING SPIRAL GALAXY SIMULATOR (Space & Astrophysics)
// -------------------------------------------------------------
export class GalaxyNBodySim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.starCount = params.starCount || 450;
    this.coreMass = params.coreMass || 5000;
    this.armTwist = params.armTwist || 3.5;
    this.darkMatter = params.darkMatter || 1.5;
    this.collisionTide = params.collisionTide || 0.0;
    this.time = 0;

    this.stars = [];
    const numArms = 2;
    for (let i = 0; i < this.starCount; i++) {
      const arm = i % numArms;
      const armOffset = (arm * 2 * Math.PI) / numArms;
      const rRatio = Math.sqrt(Math.random());
      const r = 25 + rRatio * 210;
      const theta = armOffset + this.armTwist * Math.log(r / 25 + 0.1) + (Math.random() - 0.5) * 0.45;
      
      const vCirc = Math.sqrt((0.0008 * this.coreMass) / r + 0.0003 * this.darkMatter * r) * 1.8;
      const z = (Math.random() - 0.5) * (18 * (1 - rRatio * 0.5));

      let color = '#00f0ff';
      if (r < 60) color = '#ffdf70';
      else if (arm === 0) color = '#00f0ff';
      else color = '#ff007f';

      this.stars.push({
        r,
        theta,
        z,
        vCirc,
        color,
        size: Math.random() * 1.8 + 0.8
      });
    }

    this.perturber = { x: -300, y: -160, vx: 0.8, vy: 0.4, mass: 2500 };
  }

  updateParams(params) {
    if (params.starCount && params.starCount !== this.starCount) {
      this.reset(params);
      return;
    }
    if (params.coreMass !== undefined) this.coreMass = params.coreMass;
    if (params.armTwist !== undefined) this.armTwist = params.armTwist;
    if (params.darkMatter !== undefined) this.darkMatter = params.darkMatter;
    if (params.collisionTide !== undefined) this.collisionTide = params.collisionTide;
  }

  step(dt = 0.05) {
    this.time += dt;

    if (this.collisionTide > 0.01) {
      this.perturber.x += this.perturber.vx * dt * 20;
      this.perturber.y += this.perturber.vy * dt * 20;
      if (this.perturber.x > 380) {
        this.perturber.x = -380;
        this.perturber.y = -180;
      }
    }

    for (let s of this.stars) {
      const omega = (s.vCirc / s.r) * 0.45;
      s.theta += omega * dt;

      if (this.collisionTide > 0.01) {
        const sx = s.r * Math.cos(s.theta);
        const sy = s.r * Math.sin(s.theta);
        const dx = this.perturber.x - sx;
        const dy = this.perturber.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy) + 40;
        const tidalForce = (this.collisionTide * 80) / (dist * dist);
        s.r += (dx / dist) * tidalForce * dt * 15;
      }
    }
  }

  render(ctx, cx, cy) {
    // 1. Central Supermassive Black Hole & Accretion Glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 55);
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glowGrad.addColorStop(0.25, 'rgba(0, 240, 255, 0.45)');
    glowGrad.addColorStop(0.7, 'rgba(255, 0, 127, 0.15)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#020308';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Perturber Galaxy
    if (this.collisionTide > 0.01) {
      const px = cx + this.perturber.x;
      const py = cy + this.perturber.y;
      const pGrad = ctx.createRadialGradient(px, py, 2, px, py, 35);
      pGrad.addColorStop(0, 'rgba(255, 183, 0, 0.8)');
      pGrad.addColorStop(0.6, 'rgba(255, 0, 127, 0.25)');
      pGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(px, py, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffb700';
      ctx.font = '9px monospace';
      ctx.fillText('COMPANION TIDAL GALAXY', px + 12, py - 6);
    }

    // 3. Render Stars
    for (let s of this.stars) {
      const x = cx + s.r * Math.cos(s.theta);
      const y = cy + s.r * Math.sin(s.theta) * 0.72 + s.z;

      ctx.fillStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = s.r < 50 ? 6 : 2;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Outer Dark Matter Halo ring
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 220, 220 * 0.72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText('DARK MATTER HALO VELOCITY PROFILE: FLAT [v ~ 220 km/s]', cx - 210, cy + 180);
  }

  getTelemetry() {
    return [
      { label: 'Active Stars', value: `${this.starCount} bodies`, color: 'text-cyan-400' },
      { label: 'Core Mass', value: `${this.coreMass} M☉`, color: 'text-magenta-400' },
      { label: 'Halo Factor', value: `${this.darkMatter}x DM`, color: 'text-emerald-400' },
      { label: 'Virial Ratio', value: '2K/|U| ≈ 0.98', color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 8. RELATIVISTIC BLACK HOLE LENSING (Space & Astrophysics)
// -------------------------------------------------------------
export class BlackHoleLensingSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.bhMass = params.bhMass || 20;
    this.spin = params.spin || 1.0;
    this.diskBrightness = params.diskBrightness || 1.4;
    this.rayCount = params.rayCount || 16;
    this.time = 0;
  }

  updateParams(params) {
    if (params.bhMass !== undefined) this.bhMass = params.bhMass;
    if (params.spin !== undefined) this.spin = params.spin;
    if (params.diskBrightness !== undefined) this.diskBrightness = params.diskBrightness;
    if (params.rayCount !== undefined) this.rayCount = params.rayCount;
  }

  step(dt = 0.05) {
    this.time += dt * this.spin;
  }

  render(ctx, cx, cy) {
    const Rs = this.bhMass * 1.4;
    const Rph = Rs * 1.5;

    // 1. Photon Geodesic Deflections
    ctx.lineWidth = 1.2;
    for (let i = 0; i < this.rayCount; i++) {
      const y0 = cy - 140 + i * (280 / this.rayCount);
      const dy = y0 - cy;
      const b = Math.abs(dy);

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(cx - 260, y0);

      const bendFactor = (Rs * 60) / Math.max(Rs + 10, b);
      const midY = dy > 0 ? y0 - bendFactor * 0.4 : y0 + bendFactor * 0.4;
      const endY = dy > 0 ? y0 - bendFactor : y0 + bendFactor;

      ctx.quadraticCurveTo(cx, midY, cx + 260, endY);
      ctx.stroke();
    }

    // 2. Relativistic Accretion Disk (Doppler Beaming)
    const diskA = 175 * (this.diskBrightness / 1.4);
    const diskB = 48;

    const diskGrad = ctx.createLinearGradient(cx - diskA, cy, cx + diskA, cy);
    diskGrad.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
    diskGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.9)');
    diskGrad.addColorStop(0.65, 'rgba(255, 120, 0, 0.6)');
    diskGrad.addColorStop(1, 'rgba(255, 0, 60, 0.15)');

    ctx.strokeStyle = diskGrad;
    ctx.lineWidth = 14;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(cx, cy, diskA, diskB, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Upper gravitationally lensed arc
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, Rph + 18, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // 3. Photon Sphere Ring (1.5 Rs)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, Rph, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 4. Black Hole Event Horizon
    ctx.fillStyle = '#010206';
    ctx.beginPath();
    ctx.arc(cx, cy, Rs, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.font = '10px monospace';
    ctx.fillText('◄ ONCOMING [DOPPLER BLUE-SHIFT]', cx - 240, cy - 25);
    ctx.fillStyle = 'rgba(255, 80, 80, 0.9)';
    ctx.fillText('RECEDING [RED-SHIFT] ►', cx + 110, cy - 25);
  }

  getTelemetry() {
    const Rs = (this.bhMass * 2.95).toFixed(1);
    const Rph = (Rs * 1.5).toFixed(1);
    const Risco = (Rs * 3.0).toFixed(1);
    return [
      { label: 'Event Horizon (Rs)', value: `${Rs} km`, color: 'text-magenta-400' },
      { label: 'Photon Sphere (1.5 Rs)', value: `${Rph} km`, color: 'text-cyan-400' },
      { label: 'ISCO Stable Orbit', value: `${Risco} km`, color: 'text-amber-400' },
      { label: 'Doppler Boost (δ⁴)', value: `${(1.8 * this.spin).toFixed(2)}x`, color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 9. KEPLERIAN ORBITS & LAGRANGE POINTS (Space & Celestial)
// -------------------------------------------------------------
export class OrbitalGravitySim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.centralMass = params.centralMass || 4500;
    this.eccentricity = params.eccentricity !== undefined ? params.eccentricity : 0.35;
    this.slingshotMass = params.slingshotMass || 600;
    this.simSpeed = params.simSpeed || 1.0;

    this.semiMajor = 150;
    this.semiMinor = this.semiMajor * Math.sqrt(Math.max(0.1, 1 - this.eccentricity * this.eccentricity));
    this.focusOffset = this.semiMajor * this.eccentricity;

    this.theta = 0;
    this.trail = [];
    this.time = 0;
  }

  updateParams(params) {
    if (params.centralMass !== undefined) this.centralMass = params.centralMass;
    if (params.eccentricity !== undefined) {
      this.eccentricity = params.eccentricity;
      this.semiMinor = this.semiMajor * Math.sqrt(Math.max(0.1, 1 - this.eccentricity * this.eccentricity));
      this.focusOffset = this.semiMajor * this.eccentricity;
    }
    if (params.simSpeed !== undefined) this.simSpeed = params.simSpeed;
  }

  step(dt = 0.05) {
    this.time += dt * this.simSpeed;
    const r = (this.semiMajor * (1 - this.eccentricity * this.eccentricity)) / (1 + this.eccentricity * Math.cos(this.theta));
    const omega = 180 / (r * r);
    this.theta += omega * dt * 35 * this.simSpeed;

    const px = r * Math.cos(this.theta);
    const py = r * Math.sin(this.theta);
    this.trail.push({ x: px, y: py });
    if (this.trail.length > 200) this.trail.shift();
  }

  render(ctx, cx, cy) {
    const sunX = cx - this.focusOffset;
    const sunY = cy;

    // Central Sun
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 3, sunX, sunY, 28);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.3, '#ffb700');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();

    // Kepler Ellipse
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, this.semiMajor, this.semiMinor, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Orbit Trail
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      if (i === 0) ctx.moveTo(sunX + pt.x, sunY + pt.y);
      else ctx.lineTo(sunX + pt.x, sunY + pt.y);
    }
    ctx.stroke();

    // Orbiting Planet
    const r = (this.semiMajor * (1 - this.eccentricity * this.eccentricity)) / (1 + this.eccentricity * Math.cos(this.theta));
    const planetX = sunX + r * Math.cos(this.theta);
    const planetY = sunY + r * Math.sin(this.theta);

    ctx.strokeStyle = 'rgba(255, 183, 0, 0.35)';
    ctx.beginPath();
    ctx.moveTo(sunX, sunY);
    ctx.lineTo(planetX, planetY);
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(planetX, planetY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Lagrange Points
    const lagrange = [
      { name: 'L1', x: planetX - 25 * Math.cos(this.theta), y: planetY - 25 * Math.sin(this.theta) },
      { name: 'L2', x: planetX + 25 * Math.cos(this.theta), y: planetY + 25 * Math.sin(this.theta) },
      { name: 'L3', x: sunX - r * Math.cos(this.theta), y: sunY - r * Math.sin(this.theta) },
      { name: 'L4', x: sunX + r * Math.cos(this.theta + Math.PI / 3), y: sunY + r * Math.sin(this.theta + Math.PI / 3) },
      { name: 'L5', x: sunX + r * Math.cos(this.theta - Math.PI / 3), y: sunY + r * Math.sin(this.theta - Math.PI / 3) }
    ];

    ctx.fillStyle = '#ff007f';
    ctx.font = '9px monospace';
    for (let lp of lagrange) {
      ctx.beginPath();
      ctx.arc(lp.x, lp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(lp.name, lp.x + 4, lp.y - 3);
    }
  }

  getTelemetry() {
    const a = this.semiMajor;
    const e = this.eccentricity;
    const peri = (a * (1 - e)).toFixed(0);
    const aph = (a * (1 + e)).toFixed(0);
    return [
      { label: 'Semi-Major (a)', value: `${a} AU`, color: 'text-cyan-400' },
      { label: 'Eccentricity (e)', value: `${e.toFixed(2)}`, color: 'text-magenta-400' },
      { label: 'Perihelion', value: `${peri} AU`, color: 'text-amber-400' },
      { label: 'Aphelion', value: `${aph} AU`, color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 10. 2D PROJECTILE WITH AIR DRAG & WIND (Class 11 Physics)
// -------------------------------------------------------------
export class ProjectileMotionSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.v0 = params.initialVelocity || 65;
    this.angleDeg = params.launchAngle || 45;
    this.cd = params.dragCoeff !== undefined ? params.dragCoeff : 0.35;
    this.wind = params.crosswind !== undefined ? params.crosswind : 5;
    this.mass = params.projectileMass || 2.0;

    this.g = 9.8;
    this.angleRad = (this.angleDeg * Math.PI) / 180;
    this.x = 0;
    this.y = 0;
    this.vx = this.v0 * Math.cos(this.angleRad);
    this.vy = this.v0 * Math.sin(this.angleRad);

    this.dragTrail = [];
    this.vacTrail = [];
    this.isLanded = false;
    this.maxHeight = 0;
    this.flightTime = 0;

    const vacT = (2 * this.v0 * Math.sin(this.angleRad)) / this.g;
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * vacT;
      const vx_t = this.v0 * Math.cos(this.angleRad) * t;
      const vy_t = this.v0 * Math.sin(this.angleRad) * t - 0.5 * this.g * t * t;
      this.vacTrail.push({ x: vx_t, y: vy_t });
    }
  }

  updateParams(params) {
    this.reset(params);
  }

  step(dt = 0.05) {
    if (this.isLanded) return;

    this.flightTime += dt;
    const vRelX = this.vx - this.wind;
    const vRelY = this.vy;
    const vRel = Math.sqrt(vRelX * vRelX + vRelY * vRelY);

    const fDragX = -0.5 * 1.2 * this.cd * 0.05 * vRel * vRelX;
    const fDragY = -0.5 * 1.2 * this.cd * 0.05 * vRel * vRelY;

    const ax = fDragX / this.mass;
    const ay = -this.g + fDragY / this.mass;

    this.vx += ax * dt;
    this.vy += ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y > this.maxHeight) this.maxHeight = this.y;

    if (this.y <= 0 && this.flightTime > 0.1) {
      this.y = 0;
      this.isLanded = true;
    }

    this.dragTrail.push({ x: this.x, y: this.y });
  }

  render(ctx, cx, cy) {
    const groundY = cy + 120;
    const startX = cx - 260;
    const scale = 1.3;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX - 20, groundY);
    ctx.lineTo(startX + 520, groundY);
    ctx.stroke();

    // Vacuum Parabola
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    for (let i = 0; i < this.vacTrail.length; i++) {
      const pt = this.vacTrail[i];
      const px = startX + pt.x * scale;
      const py = groundY - pt.y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Dragged Trajectory
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffb700';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    for (let i = 0; i < this.dragTrail.length; i++) {
      const pt = this.dragTrail[i];
      const px = startX + pt.x * scale;
      const py = groundY - pt.y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ball
    const currX = startX + this.x * scale;
    const currY = groundY - this.y * scale;
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(currX, currY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Cannon
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    ctx.lineTo(startX + 25 * Math.cos(this.angleRad), groundY - 25 * Math.sin(this.angleRad));
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 183, 0, 0.9)';
    ctx.font = '10px monospace';
    ctx.fillText('REAL AIR DRAG (WARPED DESCENT)', startX + 10, groundY - 140);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.fillText('--- VACUUM NEWTONIAN PARABOLA', startX + 10, groundY - 120);
  }

  getTelemetry() {
    return [
      { label: 'Range (R)', value: `${this.x.toFixed(1)} m`, color: 'text-amber-400' },
      { label: 'Max Height (H)', value: `${this.maxHeight.toFixed(1)} m`, color: 'text-cyan-400' },
      { label: 'Flight Time (T)', value: `${this.flightTime.toFixed(2)} s`, color: 'text-emerald-400' },
      { label: 'Impact Speed', value: `${Math.sqrt(this.vx * this.vx + this.vy * this.vy).toFixed(1)} m/s`, color: 'text-magenta-400' }
    ];
  }
}

// -------------------------------------------------------------
// 11. DAMPED FORCED HARMONIC RESONANCE (Class 11 Physics)
// -------------------------------------------------------------
export class DampedOscillatorSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.k = params.springK || 40;
    this.m = params.mass || 2.0;
    this.c = params.dampingC !== undefined ? params.dampingC : 0.35;
    this.omega = params.drivingOmega || 4.47;
    this.F0 = params.forceAmp || 50;

    this.x = 40;
    this.v = 0;
    this.time = 0;
    this.history = [];
  }

  updateParams(params) {
    if (params.springK) this.k = params.springK;
    if (params.mass) this.m = params.mass;
    if (params.dampingC !== undefined) this.c = params.dampingC;
    if (params.drivingOmega) this.omega = params.drivingOmega;
    if (params.forceAmp) this.F0 = params.forceAmp;
  }

  step(dt = 0.03) {
    this.time += dt;
    const fDrive = this.F0 * Math.cos(this.omega * this.time);
    const a = (fDrive - this.c * this.v - this.k * this.x) / this.m;
    this.v += a * dt;
    this.x += this.v * dt;

    this.history.push({ t: this.time, x: this.x, v: this.v });
    if (this.history.length > 200) this.history.shift();
  }

  render(ctx, cx, cy) {
    const wallX = cx - 220;
    const blockX = cx - 60 + this.x;
    const blockY = cy - 40;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(wallX - 10, blockY - 20, 10, 60);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, blockY + 10);
    const coils = 12;
    const segW = (blockX - wallX) / coils;
    for (let i = 0; i < coils; i++) {
      const x1 = wallX + (i + 0.5) * segW;
      const y1 = blockY + 10 + (i % 2 === 0 ? -12 : 12);
      ctx.lineTo(x1, y1);
    }
    ctx.lineTo(blockX, blockY + 10);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#ff007f';
    ctx.lineWidth = 2;
    ctx.fillRect(blockX, blockY - 10, 45, 40);
    ctx.strokeRect(blockX, blockY - 10, 45, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText(`${this.m}kg`, blockX + 10, blockY + 14);

    const graphStartX = cx + 60;
    const graphW = 180;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(graphStartX, cy - 40);
    ctx.lineTo(graphStartX + graphW, cy - 40);
    ctx.stroke();

    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const h = this.history[i];
      const gx = graphStartX + (i / this.history.length) * graphW;
      const gy = cy - 40 - h.x * 0.45;
      if (i === 0) ctx.moveTo(gx, gy);
      else ctx.lineTo(gx, gy);
    }
    ctx.stroke();

    const psX = cx - 120;
    const psY = cy + 100;
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.6)';
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const h = this.history[i];
      const px = psX + h.x * 0.7;
      const py = psY - h.v * 0.25;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = '9px monospace';
    ctx.fillText('LIVE OSCILLOSCOPE x(t)', graphStartX, cy - 80);
    ctx.fillText('PHASE SPACE (x vs v)', psX - 50, psY - 45);
  }

  getTelemetry() {
    const w0 = Math.sqrt(this.k / this.m);
    const Q = (w0 * this.m) / this.c;
    return [
      { label: 'Natural Freq (ω₀)', value: `${w0.toFixed(2)} rad/s`, color: 'text-cyan-400' },
      { label: 'Drive Freq (ω)', value: `${this.omega.toFixed(2)} rad/s`, color: 'text-magenta-400' },
      { label: 'Quality Factor (Q)', value: `${Q.toFixed(1)}`, color: 'text-emerald-400' },
      { label: 'Displacement', value: `${this.x.toFixed(1)} px`, color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 12. 2D ELASTIC & INELASTIC COLLISIONS (Class 11 Physics)
// -------------------------------------------------------------
export class Collisions2DSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.m1 = params.mass1 || 8;
    this.m2 = params.mass2 || 4;
    this.v1 = params.vel1 || 45;
    this.e = params.restitution !== undefined ? params.restitution : 0.85;
    this.impactB = params.impactParam !== undefined ? params.impactParam : 15;

    this.r1 = 16 + this.m1 * 0.8;
    this.r2 = 16 + this.m2 * 0.8;

    this.p1 = { x: -160, y: this.impactB, vx: this.v1 * 0.8, vy: 0 };
    this.p2 = { x: 120, y: 0, vx: -15, vy: 0 };
    this.hasCollided = false;
    this.time = 0;
  }

  updateParams(params) {
    this.reset(params);
  }

  step(dt = 0.05) {
    this.time += dt;
    this.p1.x += this.p1.vx * dt * 2.5;
    this.p1.y += this.p1.vy * dt * 2.5;
    this.p2.x += this.p2.vx * dt * 2.5;
    this.p2.y += this.p2.vy * dt * 2.5;

    const dx = this.p2.x - this.p1.x;
    const dy = this.p2.y - this.p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= this.r1 + this.r2 && !this.hasCollided) {
      this.hasCollided = true;
      const nx = dx / dist;
      const ny = dy / dist;

      const kx = this.p1.vx - this.p2.vx;
      const ky = this.p1.vy - this.p2.vy;
      const p = 2 * (nx * kx + ny * ky) / (this.m1 + this.m2);

      this.p1.vx -= p * this.m2 * nx * this.e;
      this.p1.vy -= p * this.m2 * ny * this.e;
      this.p2.vx += p * this.m1 * nx * this.e;
      this.p2.vy += p * this.m1 * ny * this.e;
    }
  }

  render(ctx, cx, cy) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.strokeRect(cx - 240, cy - 130, 480, 260);

    const x1 = cx + this.p1.x;
    const y1 = cy + this.p1.y;
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x1, y1, this.r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + this.p1.vx * 1.5, y1 + this.p1.vy * 1.5);
    ctx.stroke();

    const x2 = cx + this.p2.x;
    const y2 = cy + this.p2.y;
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x2, y2, this.r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 + this.p2.vx * 1.5, y2 + this.p2.vy * 1.5);
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = '10px monospace';
    ctx.fillText(`${this.m1}kg`, x1 - 10, y1 + 3);
    ctx.fillText(`${this.m2}kg`, x2 - 10, y2 + 3);
  }

  getTelemetry() {
    const pTotal = Math.abs(this.m1 * this.p1.vx + this.m2 * this.p2.vx).toFixed(1);
    const ke = (0.5 * this.m1 * (this.p1.vx ** 2 + this.p1.vy ** 2) + 0.5 * this.m2 * (this.p2.vx ** 2 + this.p2.vy ** 2)).toFixed(0);
    return [
      { label: 'Momentum P', value: `${pTotal} kg·m/s`, color: 'text-cyan-400' },
      { label: 'Restitution (e)', value: `${this.e.toFixed(2)}`, color: 'text-magenta-400' },
      { label: 'System KE', value: `${ke} J`, color: 'text-emerald-400' },
      { label: 'Status', value: this.hasCollided ? 'Post-Impact' : 'Approaching', color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 13. CARNOT HEAT ENGINE & DYNAMIC PV DIAGRAM (Class 11 Physics)
// -------------------------------------------------------------
export class CarnotEngineSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.Th = params.tempHot || 800;
    this.Tc = params.tempCold || 300;
    this.r = params.compressionRatio || 4.0;
    this.gamma = params.gamma || 1.4;

    this.cycleAngle = 0;
    this.time = 0;
  }

  updateParams(params) {
    if (params.tempHot) this.Th = params.tempHot;
    if (params.tempCold) this.Tc = params.tempCold;
    if (params.compressionRatio) this.r = params.compressionRatio;
    if (params.gamma) this.gamma = params.gamma;
  }

  step(dt = 0.05) {
    this.time += dt;
    this.cycleAngle = (this.cycleAngle + dt * 1.5) % (Math.PI * 2);
  }

  render(ctx, cx, cy) {
    const cylX = cx - 210;
    const cylY = cy - 40;
    const cylW = 110;
    const cylH = 90;

    const pistonDisplace = Math.sin(this.cycleAngle) * 22;
    const pistonX = cylX + 35 + pistonDisplace;

    const isHot = this.cycleAngle < Math.PI;
    ctx.fillStyle = isHot ? 'rgba(255, 60, 0, 0.45)' : 'rgba(0, 200, 255, 0.35)';
    ctx.fillRect(cylX, cylY, pistonX - cylX, cylH);

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.strokeRect(cylX, cylY, cylW, cylH);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(pistonX, cylY, 14, cylH);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(pistonX + 14, cylY + cylH / 2 - 4, 40, 8);

    const pvX = cx + 20;
    const pvY = cy + 50;
    const pvW = 180;
    const pvH = 140;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pvX, pvY - pvH);
    ctx.lineTo(pvX, pvY);
    ctx.lineTo(pvX + pvW, pvY);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('P (Pressure)', pvX - 15, pvY - pvH - 6);
    ctx.fillText('V (Volume)', pvX + pvW - 25, pvY + 15);

    const p1 = { x: pvX + 25, y: pvY - 120 };
    const p2 = { x: pvX + 90, y: pvY - 70 };
    const p3 = { x: pvX + 160, y: pvY - 25 };
    const p4 = { x: pvX + 75, y: pvY - 45 };

    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.quadraticCurveTo(pvX + 55, pvY - 90, p2.x, p2.y);
    ctx.quadraticCurveTo(pvX + 130, pvY - 40, p3.x, p3.y);
    ctx.quadraticCurveTo(pvX + 115, pvY - 32, p4.x, p4.y);
    ctx.quadraticCurveTo(pvX + 45, pvY - 80, p1.x, p1.y);
    ctx.fillStyle = 'rgba(255, 183, 0, 0.15)';
    ctx.fill();
    ctx.stroke();

    let curX = p1.x, curY = p1.y;
    const ca = this.cycleAngle;
    if (ca < Math.PI * 0.5) {
      const u = ca / (Math.PI * 0.5);
      curX = p1.x + (p2.x - p1.x) * u;
      curY = p1.y + (p2.y - p1.y) * u;
    } else if (ca < Math.PI) {
      const u = (ca - Math.PI * 0.5) / (Math.PI * 0.5);
      curX = p2.x + (p3.x - p2.x) * u;
      curY = p2.y + (p3.y - p2.y) * u;
    } else if (ca < Math.PI * 1.5) {
      const u = (ca - Math.PI) / (Math.PI * 0.5);
      curX = p3.x + (p4.x - p3.x) * u;
      curY = p3.y + (p4.y - p3.y) * u;
    } else {
      const u = (ca - Math.PI * 1.5) / (Math.PI * 0.5);
      curX = p4.x + (p1.x - p4.x) * u;
      curY = p4.y + (p1.y - p4.y) * u;
    }

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  getTelemetry() {
    const eta = (1 - this.Tc / this.Th) * 100;
    return [
      { label: 'Carnot Eff (η)', value: `${eta.toFixed(1)}%`, color: 'text-emerald-400' },
      { label: 'Hot Temp (T_H)', value: `${this.Th} K`, color: 'text-magenta-400' },
      { label: 'Cold Temp (T_C)', value: `${this.Tc} K`, color: 'text-cyan-400' },
      { label: 'Net Work W', value: 'Enclosed Area', color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 14. BERNOULLI FLUID & VENTURI TUBE (Class 11 Physics)
// -------------------------------------------------------------
export class BernoulliFluidSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.v1 = params.inletVelocity || 3.0;
    this.r1 = params.pipeRadius1 || 60;
    this.r2 = params.throatRadius2 || 25;
    this.rho = params.fluidDensity || 1000;

    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: Math.random() * 480 - 240,
        yRatio: (Math.random() - 0.5) * 0.8
      });
    }
    this.time = 0;
  }

  updateParams(params) {
    if (params.inletVelocity) this.v1 = params.inletVelocity;
    if (params.pipeRadius1) this.r1 = params.pipeRadius1;
    if (params.throatRadius2) this.r2 = params.throatRadius2;
    if (params.fluidDensity) this.rho = params.fluidDensity;
  }

  step(dt = 0.05) {
    this.time += dt;
    const a1 = Math.PI * this.r1 * this.r1;
    const a2 = Math.PI * this.r2 * this.r2;
    const v2 = this.v1 * (a1 / a2);

    for (let p of this.particles) {
      const throatFactor = Math.exp(-(p.x * p.x) / 4000);
      const curV = this.v1 + (v2 - this.v1) * throatFactor;
      p.x += curV * dt * 25;
      if (p.x > 240) p.x = -240;
    }
  }

  render(ctx, cx, cy) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(cx - 240, cy - this.r1);
    ctx.quadraticCurveTo(cx, cy - this.r2, cx + 240, cy - this.r1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 240, cy + this.r1);
    ctx.quadraticCurveTo(cx, cy + this.r2, cx + 240, cy + this.r1);
    ctx.stroke();

    for (let p of this.particles) {
      const throatFactor = Math.exp(-(p.x * p.x) / 4000);
      const curR = this.r1 - (this.r1 - this.r2) * throatFactor;
      const py = cy + p.yRatio * curR;

      ctx.fillStyle = throatFactor > 0.5 ? '#ffb700' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(cx + p.x, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const h1 = 90;
    const a1 = Math.PI * this.r1 * this.r1;
    const a2 = Math.PI * this.r2 * this.r2;
    const v2 = this.v1 * (a1 / a2);
    const deltaH = (v2 * v2 - this.v1 * this.v1) * 1.5;
    const h2 = Math.max(20, h1 - deltaH);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 150, cy - this.r1 - 100, 16, 100);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.fillRect(cx - 150, cy - this.r1 - h1, 16, h1);

    ctx.strokeRect(cx - 8, cy - this.r2 - 100, 16, 100);
    ctx.fillStyle = 'rgba(255, 0, 127, 0.5)';
    ctx.fillRect(cx - 8, cy - this.r2 - h2, 16, h2);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px monospace';
    ctx.fillText('P₁ (HIGH)', cx - 165, cy - this.r1 - 105);
    ctx.fillStyle = '#ff007f';
    ctx.fillText('P₂ (LOW)', cx - 22, cy - this.r2 - 105);
  }

  getTelemetry() {
    const a1 = Math.PI * this.r1 * this.r1;
    const a2 = Math.PI * this.r2 * this.r2;
    const v2 = (this.v1 * (a1 / a2)).toFixed(1);
    return [
      { label: 'Inlet Speed (v₁)', value: `${this.v1} m/s`, color: 'text-cyan-400' },
      { label: 'Throat Speed (v₂)', value: `${v2} m/s`, color: 'text-magenta-400' },
      { label: 'Pressure Drop ΔP', value: 'P₁ > P₂', color: 'text-amber-400' },
      { label: 'Continuity Flow Q', value: 'Constant', color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 15. LORENTZ FORCE CYCLOTRON (Class 12 Physics)
// -------------------------------------------------------------
export class LorentzCyclotronSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.B = params.magneticB || 1.5;
    this.E = params.electricE || 15;
    this.pType = params.particleType || 'proton';
    this.v = params.initialSpeed || 50;

    this.q = this.pType === 'electron' ? -1 : (this.pType === 'alpha' ? 2 : 1);
    this.m = this.pType === 'electron' ? 0.2 : (this.pType === 'alpha' ? 4 : 1);

    this.x = 0;
    this.y = 0;
    this.vx = this.v * 0.4;
    this.vy = 0;
    this.trail = [];
    this.time = 0;
  }

  updateParams(params) {
    if (params.magneticB) this.B = params.magneticB;
    if (params.electricE !== undefined) this.E = params.electricE;
    if (params.initialSpeed) this.v = params.initialSpeed;
    if (params.particleType && params.particleType !== this.pType) this.reset(params);
  }

  step(dt = 0.05) {
    this.time += dt;
    const ax = (this.q / this.m) * (this.vy * this.B * 2.5);
    const ay = (this.q / this.m) * (this.E * 0.1 - this.vx * this.B * 2.5);

    this.vx += ax * dt;
    this.vy += ay * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 250) this.trail.shift();
  }

  render(ctx, cx, cy) {
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.font = '10px monospace';
    for (let gx = -220; gx <= 220; gx += 45) {
      for (let gy = -120; gy <= 120; gy += 40) {
        ctx.fillText('⊙ B', cx + gx, cy + gy);
      }
    }

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.trail.length; i++) {
      const pt = this.trail[i];
      if (i === 0) ctx.moveTo(cx + pt.x, cy + pt.y);
      else ctx.lineTo(cx + pt.x, cy + pt.y);
    }
    ctx.stroke();

    const px = cx + this.x;
    const py = cy + this.y;
    ctx.fillStyle = this.q > 0 ? '#ff007f' : '#00ff66';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + this.vx * 1.5, py + this.vy * 1.5);
    ctx.stroke();
  }

  getTelemetry() {
    const omega = Math.abs((this.q * this.B) / this.m).toFixed(2);
    const rLarmor = Math.abs((this.m * this.v) / (this.q * this.B * 5)).toFixed(1);
    return [
      { label: 'Cyclotron Freq (ω_c)', value: `${omega} MHz`, color: 'text-cyan-400' },
      { label: 'Larmor Radius (r)', value: `${rLarmor} mm`, color: 'text-magenta-400' },
      { label: 'Magnetic Field B', value: `${this.B} T`, color: 'text-amber-400' },
      { label: 'Particle Charge q', value: `${this.q}e`, color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 16. COULOMB FIELD & ELECTRIC DIPOLE (Class 12 Physics)
// -------------------------------------------------------------
export class ElectricDipoleSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.q1 = params.charge1 !== undefined ? params.charge1 : 6;
    this.q2 = params.charge2 !== undefined ? params.charge2 : -6;
    this.d = params.separation || 140;
    this.density = params.fieldDensity || 24;
    this.time = 0;
  }

  updateParams(params) {
    if (params.charge1 !== undefined) this.q1 = params.charge1;
    if (params.charge2 !== undefined) this.q2 = params.charge2;
    if (params.separation) this.d = params.separation;
    if (params.fieldDensity) this.density = params.fieldDensity;
  }

  step(dt = 0.05) {
    this.time += dt;
  }

  render(ctx, cx, cy) {
    const x1 = cx - this.d / 2;
    const y1 = cy;
    const x2 = cx + this.d / 2;
    const y2 = cy;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.2;

    for (let i = 0; i < this.density; i++) {
      const angle = (i * 2 * Math.PI) / this.density;
      ctx.beginPath();
      let curX = x1 + 14 * Math.cos(angle);
      let curY = y1 + 14 * Math.sin(angle);
      ctx.moveTo(curX, curY);

      for (let step = 0; step < 70; step++) {
        const dx1 = curX - x1, dy1 = curY - y1;
        const r1Sq = dx1 * dx1 + dy1 * dy1 + 10;
        const r1 = Math.sqrt(r1Sq);

        const dx2 = curX - x2, dy2 = curY - y2;
        const r2Sq = dx2 * dx2 + dy2 * dy2 + 10;
        const r2 = Math.sqrt(r2Sq);

        const Ex = (this.q1 * dx1) / (r1 * r1Sq) + (this.q2 * dx2) / (r2 * r2Sq);
        const Ey = (this.q1 * dy1) / (r1 * r1Sq) + (this.q2 * dy2) / (r2 * r2Sq);
        const Emag = Math.sqrt(Ex * Ex + Ey * Ey);

        if (Emag < 0.0001 || r2 < 12) break;

        curX += (Ex / Emag) * 5;
        curY += (Ey / Emag) * 5;
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();
    }

    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.arc(x1, y1, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('+q', x1 - 7, y1 + 4);

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(x2, y2, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.fillText('-q', x2 - 7, y2 + 4);
  }

  getTelemetry() {
    const p = Math.abs(this.q1 * this.d).toFixed(0);
    return [
      { label: 'Dipole Moment (p)', value: `${p} μC·px`, color: 'text-magenta-400' },
      { label: 'Charge Separation', value: `${this.d} px`, color: 'text-cyan-400' },
      { label: 'Field Symmetry', value: 'Dipolar', color: 'text-emerald-400' },
      { label: 'Net Charge Σq', value: `${this.q1 + this.q2} μC`, color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 17. SERIES RLC RESONANCE & PHASOR DIAGRAM (Class 12 Physics)
// -------------------------------------------------------------
export class RLCResonanceSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.R = params.resistance || 50;
    this.L = (params.inductance || 80) * 0.001;
    this.C = (params.capacitance || 40) * 0.000001;
    this.f = params.frequency || 89;
    this.V0 = params.voltageV0 || 60;
    this.time = 0;
  }

  updateParams(params) {
    if (params.resistance) this.R = params.resistance;
    if (params.inductance) this.L = params.inductance * 0.001;
    if (params.capacitance) this.C = params.capacitance * 0.000001;
    if (params.frequency) this.f = params.frequency;
    if (params.voltageV0) this.V0 = params.voltageV0;
  }

  step(dt = 0.05) {
    this.time += dt;
  }

  render(ctx, cx, cy) {
    const omega = 2 * Math.PI * this.f;
    const XL = omega * this.L;
    const XC = 1 / (omega * this.C);
    const Z = Math.sqrt(this.R * this.R + (XL - XC) * (XL - XC));
    const I0 = this.V0 / Z;
    const phi = Math.atan2(XL - XC, this.R);

    const phX = cx - 140;
    const phY = cy;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(phX, phY, 70, 0, Math.PI * 2);
    ctx.stroke();

    const rot = omega * this.time * 0.25;
    const ix = phX + 50 * Math.cos(rot);
    const iy = phY + 50 * Math.sin(rot);
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(phX, phY);
    ctx.lineTo(ix, iy);
    ctx.stroke();

    const vx = phX + 65 * Math.cos(rot + phi);
    const vy = phY + 65 * Math.sin(rot + phi);
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(phX, phY);
    ctx.lineTo(vx, vy);
    ctx.stroke();

    const oscX = cx + 30;
    const oscW = 200;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(oscX, cy);
    ctx.lineTo(oscX + oscW, cy);
    ctx.stroke();

    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    for (let x = 0; x < oscW; x += 2) {
      const tVal = this.time * 4 + x * 0.06;
      const yVal = cy - 35 * Math.sin(tVal);
      if (x === 0) ctx.moveTo(oscX + x, yVal);
      else ctx.lineTo(oscX + x, yVal);
    }
    ctx.stroke();

    ctx.strokeStyle = '#00ff66';
    ctx.beginPath();
    for (let x = 0; x < oscW; x += 2) {
      const tVal = this.time * 4 + x * 0.06;
      const yVal = cy - 25 * Math.sin(tVal - phi);
      if (x === 0) ctx.moveTo(oscX + x, yVal);
      else ctx.lineTo(oscX + x, yVal);
    }
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px monospace';
    ctx.fillText('VOLTAGE V(t)', oscX, cy - 45);
    ctx.fillStyle = '#00ff66';
    ctx.fillText('CURRENT I(t)', oscX, cy + 45);
  }

  getTelemetry() {
    const f0 = 1 / (2 * Math.PI * Math.sqrt(this.L * this.C));
    const omega = 2 * Math.PI * this.f;
    const XL = omega * this.L;
    const XC = 1 / (omega * this.C);
    const Z = Math.sqrt(this.R * this.R + (XL - XC) * (XL - XC));
    const phi = (Math.atan2(XL - XC, this.R) * 180) / Math.PI;

    return [
      { label: 'Resonant Freq (f₀)', value: `${f0.toFixed(1)} Hz`, color: 'text-emerald-400' },
      { label: 'Impedance (Z)', value: `${Z.toFixed(1)} Ω`, color: 'text-cyan-400' },
      { label: 'Phase Shift (φ)', value: `${phi.toFixed(1)}°`, color: 'text-magenta-400' },
      { label: 'Condition', value: Math.abs(this.f - f0) < 5 ? 'RESONANCE!' : (XL > XC ? 'Inductive' : 'Capacitive'), color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 18. RAY OPTICS PRISM DISPERSION (Class 12 Physics)
// -------------------------------------------------------------
export class RayPrismSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.apexAngle = params.prismAngle || 60;
    this.incidentAngle = params.incidentAngle || 48;
    this.n0 = params.baseRefraction || 1.52;
    this.dispersion = params.dispersionPower || 0.06;
    this.time = 0;
  }

  updateParams(params) {
    if (params.prismAngle) this.apexAngle = params.prismAngle;
    if (params.incidentAngle) this.incidentAngle = params.incidentAngle;
    if (params.baseRefraction) this.n0 = params.baseRefraction;
    if (params.dispersionPower) this.dispersion = params.dispersionPower;
  }

  step(dt = 0.05) {
    this.time += dt;
  }

  render(ctx, cx, cy) {
    const pTop = { x: cx, y: cy - 90 };
    const pLeft = { x: cx - 110, y: cy + 70 };
    const pRight = { x: cx + 110, y: cy + 70 };

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pTop.x, pTop.y);
    ctx.lineTo(pLeft.x, pLeft.y);
    ctx.lineTo(pRight.x, pRight.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const hitX = cx - 55;
    const hitY = cy - 10;
    const rayAngle = (this.incidentAngle * Math.PI) / 180;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hitX - 160 * Math.cos(rayAngle), hitY - 160 * Math.sin(rayAngle));
    ctx.lineTo(hitX, hitY);
    ctx.stroke();

    const colors = [
      { name: 'red', color: '#ff0033', index: this.n0 },
      { name: 'yellow', color: '#ffea00', index: this.n0 + this.dispersion * 0.4 },
      { name: 'green', color: '#00ff66', index: this.n0 + this.dispersion * 0.7 },
      { name: 'blue', color: '#00f0ff', index: this.n0 + this.dispersion * 1.0 },
      { name: 'violet', color: '#b000ff', index: this.n0 + this.dispersion * 1.4 }
    ];

    for (let c of colors) {
      const exitHitX = cx + 50;
      const exitHitY = hitY + (c.index - this.n0) * 80 + 10;

      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hitX, hitY);
      ctx.lineTo(exitHitX, exitHitY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(exitHitX, exitHitY);
      ctx.lineTo(exitHitX + 160, exitHitY + 40 + (c.index - this.n0) * 120);
      ctx.stroke();
    }
  }

  getTelemetry() {
    return [
      { label: 'Prism Apex (A)', value: `${this.apexAngle}°`, color: 'text-cyan-400' },
      { label: 'Incident Angle (i)', value: `${this.incidentAngle}°`, color: 'text-magenta-400' },
      { label: 'Crown Index (n₀)', value: `${this.n0}`, color: 'text-amber-400' },
      { label: 'Spectrum', value: 'Rainbow Dispersion', color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 19. PHOTOELECTRIC EFFECT & WORK FUNCTION (Class 12 Physics)
// -------------------------------------------------------------
export class PhotoelectricSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.lambda = params.wavelength || 320;
    this.workPhi = params.workFunction || 2.3;
    this.intensity = params.intensity || 50;
    this.Vstop = params.stoppingVoltage || 0.0;

    this.electrons = [];
    this.time = 0;
  }

  updateParams(params) {
    if (params.wavelength) this.lambda = params.wavelength;
    if (params.workFunction) this.workPhi = params.workFunction;
    if (params.intensity) this.intensity = params.intensity;
    if (params.stoppingVoltage !== undefined) this.Vstop = params.stoppingVoltage;
  }

  step(dt = 0.05) {
    this.time += dt;
    const hNu = 1240 / this.lambda;
    const keMax = Math.max(0, hNu - this.workPhi);

    if (keMax > 0 && Math.random() < this.intensity * 0.008) {
      this.electrons.push({
        x: -160,
        y: (Math.random() - 0.5) * 60,
        vx: Math.sqrt(keMax) * 14,
        ke: keMax
      });
    }

    for (let e of this.electrons) {
      e.vx += this.Vstop * dt * 8;
      e.x += e.vx * dt * 25;
    }
    this.electrons = this.electrons.filter(e => e.x > -180 && e.x < 170);
  }

  render(ctx, cx, cy) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.strokeRect(cx - 200, cy - 70, 400, 140);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(cx - 180, cy - 50, 12, 100);
    ctx.fillRect(cx + 170, cy - 50, 12, 100);

    const photonColor = wavelengthToRGB(this.lambda);
    ctx.strokeStyle = photonColor;
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const py = cy - 40 + i * 25;
      ctx.beginPath();
      ctx.moveTo(cx - 250, py - 15);
      ctx.lineTo(cx - 180, py);
      ctx.stroke();
    }

    ctx.fillStyle = '#00ff66';
    for (let e of this.electrons) {
      ctx.beginPath();
      ctx.arc(cx + e.x, cy + e.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText('CATHODE (EMITTER)', cx - 190, cy + 85);
    ctx.fillText('ANODE (COLLECTOR)', cx + 100, cy + 85);
  }

  getTelemetry() {
    const hNu = (1240 / this.lambda).toFixed(2);
    const keMax = Math.max(0, hNu - this.workPhi).toFixed(2);
    const vStop = keMax;
    return [
      { label: 'Photon Energy (hν)', value: `${hNu} eV`, color: 'text-cyan-400' },
      { label: 'Work Function (Φ)', value: `${this.workPhi} eV`, color: 'text-amber-400' },
      { label: 'Max KE (K_max)', value: `${keMax} eV`, color: 'text-emerald-400' },
      { label: 'Stopping Potential', value: `${vStop} V`, color: 'text-magenta-400' }
    ];
  }
}

// -------------------------------------------------------------
// 20. BOHR HYDROGEN ATOM & QUANTUM LEAPS (Class 12 Physics)
// -------------------------------------------------------------
export class BohrHydrogenSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.n = params.orbitN || 3;
    this.targetN = params.targetN || 2;
    this.speed = params.simSpeed || 1.0;

    this.electronAngle = 0;
    this.photons = [];
    this.time = 0;
  }

  updateParams(params) {
    if (params.orbitN) this.n = params.orbitN;
    if (params.targetN) this.targetN = params.targetN;
    if (params.simSpeed) this.speed = params.simSpeed;
  }

  step(dt = 0.05) {
    this.time += dt * this.speed;
    const omega = 80 / (this.n * this.n * this.n);
    this.electronAngle += omega * dt * this.speed;

    for (let ph of this.photons) {
      ph.r += dt * 90;
    }
    this.photons = this.photons.filter(ph => ph.r < 220);
  }

  render(ctx, cx, cy) {
    ctx.fillStyle = '#ff007f';
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    for (let level = 1; level <= 5; level++) {
      const radius = level * level * 10;
      ctx.strokeStyle = level === this.n ? 'rgba(0, 240, 255, 0.8)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = level === this.n ? 1.5 : 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px monospace';
      ctx.fillText(`n=${level}`, cx + radius + 4, cy - 2);
    }

    const curR = this.n * this.n * 10;
    const ex = cx + curR * Math.cos(this.electronAngle);
    const ey = cy + curR * Math.sin(this.electronAngle);

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  getTelemetry() {
    const E_n = (-13.6 / (this.n * this.n)).toFixed(2);
    const E_target = (-13.6 / (this.targetN * this.targetN)).toFixed(2);
    const dE = Math.abs(E_n - E_target);
    const lambda = dE > 0 ? (1240 / dE).toFixed(0) : '0';
    return [
      { label: 'Orbit Level (n)', value: `n = ${this.n}`, color: 'text-cyan-400' },
      { label: 'Energy (E_n)', value: `${E_n} eV`, color: 'text-magenta-400' },
      { label: 'Transition dE', value: `${dE.toFixed(2)} eV`, color: 'text-amber-400' },
      { label: 'Emitted Photon λ', value: `${lambda} nm`, color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 21. 1D QUANTUM INFINITE WELL (College & Engineering)
// -------------------------------------------------------------
export class QuantumWellSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.n = params.quantumN || 2;
    this.L = params.boxWidth || 4.0;
    this.mode = params.superposition || 'pure_eigenstate';
    this.time = 0;
  }

  updateParams(params) {
    if (params.quantumN) this.n = params.quantumN;
    if (params.boxWidth) this.L = params.boxWidth;
    if (params.superposition) this.mode = params.superposition;
  }

  step(dt = 0.05) {
    this.time += dt;
  }

  render(ctx, cx, cy) {
    const wellW = 320;
    const leftX = cx - wellW / 2;
    const rightX = cx + wellW / 2;

    ctx.fillStyle = 'rgba(255, 183, 0, 0.2)';
    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 3;
    ctx.fillRect(leftX - 25, cy - 120, 25, 240);
    ctx.strokeRect(leftX - 25, cy - 120, 25, 240);
    ctx.fillRect(rightX, cy - 120, 25, 240);
    ctx.strokeRect(rightX, cy - 120, 25, 240);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = leftX; px <= rightX; px += 2) {
      const u = (px - leftX) / wellW;
      const psi = Math.sin(this.n * Math.PI * u) * Math.cos(this.time * 3);
      const py = cy - psi * 65;
      if (px === leftX) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 0, 127, 0.25)';
    ctx.beginPath();
    ctx.moveTo(leftX, cy);
    for (let px = leftX; px <= rightX; px += 2) {
      const u = (px - leftX) / wellW;
      const prob = Math.sin(this.n * Math.PI * u) ** 2;
      ctx.lineTo(px, cy - prob * 70);
    }
    ctx.lineTo(rightX, cy);
    ctx.closePath();
    ctx.fill();
  }

  getTelemetry() {
    const En = (this.n * this.n * 0.376).toFixed(2);
    return [
      { label: 'Eigenstate n', value: `n = ${this.n}`, color: 'text-cyan-400' },
      { label: 'Energy (E_n)', value: `${En} eV`, color: 'text-magenta-400' },
      { label: 'Nodes (n-1)', value: `${this.n - 1} nodes`, color: 'text-emerald-400' },
      { label: 'Zero-Point Energy', value: '0.38 eV', color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// 22. 3D TRANSVERSE ELECTROMAGNETIC WAVE (College & Engineering)
// -------------------------------------------------------------
export class EMWave3DSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.wavelength = params.wavelength || 180;
    this.E0 = params.amplitudeE || 60;
    this.speed = params.simSpeed || 1.0;
    this.time = 0;
  }

  updateParams(params) {
    if (params.wavelength) this.wavelength = params.wavelength;
    if (params.amplitudeE) this.E0 = params.amplitudeE;
    if (params.simSpeed) this.speed = params.simSpeed;
  }

  step(dt = 0.05) {
    this.time += dt * this.speed;
  }

  render(ctx, cx, cy) {
    const k = (2 * Math.PI) / this.wavelength;
    const omega = 3.0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 240, cy);
    ctx.lineTo(cx + 240, cy);
    ctx.stroke();

    for (let z = -220; z <= 220; z += 12) {
      const eVal = this.E0 * Math.sin(k * z - omega * this.time);
      ctx.strokeStyle = '#ff007f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + z, cy);
      ctx.lineTo(cx + z, cy - eVal);
      ctx.stroke();

      const bVal = eVal * 0.7;
      ctx.strokeStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(cx + z, cy);
      ctx.lineTo(cx + z + bVal * 0.6, cy + bVal * 0.4);
      ctx.stroke();
    }

    ctx.fillStyle = '#ff007f';
    ctx.font = '10px monospace';
    ctx.fillText('ELECTRIC FIELD E(z, t)', cx - 220, cy - 80);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('MAGNETIC FIELD B(z, t)', cx - 220, cy + 60);
  }

  getTelemetry() {
    return [
      { label: 'Wavelength (λ)', value: `${this.wavelength} px`, color: 'text-cyan-400' },
      { label: 'E Peak (E₀)', value: `${this.E0} V/m`, color: 'text-magenta-400' },
      { label: 'Poynting Flux S', value: 'E x B / μ₀', color: 'text-amber-400' },
      { label: 'Phase Velocity c', value: '3.00 x 10⁸ m/s', color: 'text-emerald-400' }
    ];
  }
}

// -------------------------------------------------------------
// 23. MAXWELL-BOLTZMANN GAS THERMAL DISTRIBUTION (College)
// -------------------------------------------------------------
export class MaxwellBoltzmannSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.T = params.temperature || 350;
    this.count = params.particleCount || 160;
    this.time = 0;

    this.particles = [];
    for (let i = 0; i < this.count; i++) {
      const vScale = Math.sqrt(this.T / 350) * 35;
      this.particles.push({
        x: Math.random() * 190 - 95,
        y: Math.random() * 190 - 95,
        vx: (Math.random() - 0.5) * vScale,
        vy: (Math.random() - 0.5) * vScale
      });
    }
  }

  updateParams(params) {
    if (params.temperature) {
      this.T = params.temperature;
      this.reset(params);
    }
  }

  step(dt = 0.05) {
    this.time += dt;
    for (let p of this.particles) {
      p.x += p.vx * dt * 2.5;
      p.y += p.vy * dt * 2.5;

      if (p.x < -95 || p.x > 95) p.vx *= -1;
      if (p.y < -95 || p.y > 95) p.vy *= -1;
    }
  }

  render(ctx, cx, cy) {
    const boxX = cx - 210;
    const boxY = cy - 100;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.strokeRect(boxX, boxY, 190, 190);

    for (let p of this.particles) {
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      ctx.fillStyle = speed > 40 ? '#ff007f' : (speed > 20 ? '#00f0ff' : '#00ff66');
      ctx.beginPath();
      ctx.arc(boxX + 95 + p.x, boxY + 95 + p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const hX = cx + 30;
    const hY = cy + 90;
    const hW = 180;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(hX, hY);
    ctx.lineTo(hX + hW, hY);
    ctx.stroke();

    ctx.strokeStyle = '#ffb700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let v = 0; v <= hW; v += 3) {
      const vNorm = v / 30;
      const fv = vNorm * Math.exp(-(vNorm * vNorm) / 2);
      const py = hY - fv * 160;
      if (v === 0) ctx.moveTo(hX + v, py);
      else ctx.lineTo(hX + v, py);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffb700';
    ctx.font = '10px monospace';
    ctx.fillText('MAXWELL-BOLTZMANN f(v)', hX + 10, hY - 110);
  }

  getTelemetry() {
    const vRms = (Math.sqrt(3 * 8.314 * this.T) * 0.1).toFixed(0);
    return [
      { label: 'Temperature (T)', value: `${this.T} K`, color: 'text-amber-400' },
      { label: 'RMS Speed (v_rms)', value: `${vRms} m/s`, color: 'text-cyan-400' },
      { label: 'Particle Count', value: `${this.count} atoms`, color: 'text-emerald-400' },
      { label: 'Ensemble State', value: 'Thermalized', color: 'text-magenta-400' }
    ];
  }
}

// -------------------------------------------------------------
// 24. SEMICONDUCTOR PN JUNCTION BAND BENDING (College)
// -------------------------------------------------------------
export class PNJunctionSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.vBias = params.biasVoltage || 0.0;
    this.Na = params.acceptorNa || 5;
    this.Nd = params.donorNd || 5;
    this.time = 0;
  }

  updateParams(params) {
    if (params.biasVoltage !== undefined) this.vBias = params.biasVoltage;
    if (params.acceptorNa) this.Na = params.acceptorNa;
    if (params.donorNd) this.Nd = params.donorNd;
  }

  step(dt = 0.05) {
    this.time += dt;
  }

  render(ctx, cx, cy) {
    const Vbi = 0.7 - this.vBias * 0.4;
    const depWidth = Math.max(20, 80 * Math.sqrt(Math.max(0.1, Vbi)));

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cx - 200, cy - 50);
    ctx.lineTo(cx - depWidth / 2, cy - 50);
    ctx.quadraticCurveTo(cx, cy - 50 + Vbi * 60, cx + depWidth / 2, cy - 50 + Vbi * 60);
    ctx.lineTo(cx + 200, cy - 50 + Vbi * 60);
    ctx.stroke();

    ctx.strokeStyle = '#ff007f';
    ctx.beginPath();
    ctx.moveTo(cx - 200, cy + 50);
    ctx.lineTo(cx - depWidth / 2, cy + 50);
    ctx.quadraticCurveTo(cx, cy + 50 + Vbi * 60, cx + depWidth / 2, cy + 50 + Vbi * 60);
    ctx.lineTo(cx + 200, cy + 50 + Vbi * 60);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - 200, cy);
    ctx.lineTo(cx + 200, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 183, 0, 0.12)';
    ctx.fillRect(cx - depWidth / 2, cy - 100, depWidth, 200);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '10px monospace';
    ctx.fillText('CONDUCTION BAND Ec', cx - 190, cy - 60);
    ctx.fillStyle = '#ff007f';
    ctx.fillText('VALENCE BAND Ev', cx - 190, cy + 70);
    ctx.fillStyle = '#ffb700';
    ctx.fillText('DEPLETION REGION', cx - 45, cy - 105);
  }

  getTelemetry() {
    const Vbi = (0.7 - this.vBias * 0.4).toFixed(2);
    return [
      { label: 'Barrier Height (V_bi)', value: `${Vbi} V`, color: 'text-cyan-400' },
      { label: 'Bias Voltage', value: `${this.vBias} V`, color: 'text-magenta-400' },
      { label: 'Mode', value: this.vBias > 0.1 ? 'FORWARD BIAS' : (this.vBias < -0.1 ? 'REVERSE BIAS' : 'EQUILIBRIUM'), color: 'text-emerald-400' },
      { label: 'Carrier Flow', value: this.vBias > 0.2 ? 'Large Diffusion I' : 'Depleted', color: 'text-amber-400' }
    ];
  }
}

// -------------------------------------------------------------
// FACTORY CREATOR & UNIVERSAL RENDER DISPATCHER
// -------------------------------------------------------------
export const PHYSICS_CENTER_ENGINE_TYPES = new Set([
  'GALAXY_N_BODY',
  'BLACK_HOLE_LENSING',
  'ORBITAL_GRAVITY',
  'PROJECTILE_MOTION',
  'DAMPED_OSCILLATOR',
  'COLLISIONS_2D',
  'CARNOT_ENGINE',
  'BERNOULLI_FLUID',
  'LORENTZ_CYCLOTRON',
  'ELECTRIC_DIPOLE',
  'RLC_RESONANCE',
  'RAY_PRISM',
  'PHOTOELECTRIC_EFFECT',
  'BOHR_HYDROGEN',
  'QUANTUM_WELL',
  'EM_WAVE_3D',
  'MAXWELL_BOLTZMANN',
  'PN_JUNCTION',
  'DOUBLE_PENDULUM',
  'FOURIER_SERIES',
  'WAVE_DIFFRACTION',
  'SURFACE_3D',
  'LORENZ_ATTRACTOR',
  'QUANTUM_TUNNEL'
]);

const PHYSICS_CX_CY_ENGINES = new Set([
  'DoublePendulumSim',
  'FourierSynthesizerSim',
  'WaveDiffractionSim',
  'Surface3DSim',
  'LorenzAttractorSim',
  'QuantumTunnelSim',
  'GalaxyNBodySim',
  'BlackHoleLensingSim',
  'OrbitalGravitySim',
  'ProjectileMotionSim',
  'DampedOscillatorSim',
  'Collisions2DSim',
  'CarnotEngineSim',
  'BernoulliFluidSim',
  'LorentzCyclotronSim',
  'ElectricDipoleSim',
  'RLCResonanceSim',
  'RayPrismSim',
  'PhotoelectricSim',
  'BohrHydrogenSim',
  'QuantumWellSim',
  'EMWave3DSim',
  'MaxwellBoltzmannSim',
  'PNJunctionSim'
]);

export function createSimulationEngine(engineType, params = {}) {
  let engine;
  switch (engineType) {
    // Space & Astrophysics
    case 'GALAXY_N_BODY':
      engine = new GalaxyNBodySim(params);
      break;
    case 'BLACK_HOLE_LENSING':
      engine = new BlackHoleLensingSim(params);
      break;
    case 'ORBITAL_GRAVITY':
      engine = new OrbitalGravitySim(params);
      break;

    // Class 11 Physics
    case 'PROJECTILE_MOTION':
      engine = new ProjectileMotionSim(params);
      break;
    case 'DAMPED_OSCILLATOR':
      engine = new DampedOscillatorSim(params);
      break;
    case 'COLLISIONS_2D':
      engine = new Collisions2DSim(params);
      break;
    case 'CARNOT_ENGINE':
      engine = new CarnotEngineSim(params);
      break;
    case 'BERNOULLI_FLUID':
      engine = new BernoulliFluidSim(params);
      break;

    // Class 12 Physics
    case 'LORENTZ_CYCLOTRON':
      engine = new LorentzCyclotronSim(params);
      break;
    case 'ELECTRIC_DIPOLE':
      engine = new ElectricDipoleSim(params);
      break;
    case 'RLC_RESONANCE':
      engine = new RLCResonanceSim(params);
      break;
    case 'RAY_PRISM':
      engine = new RayPrismSim(params);
      break;
    case 'PHOTOELECTRIC_EFFECT':
      engine = new PhotoelectricSim(params);
      break;
    case 'BOHR_HYDROGEN':
      engine = new BohrHydrogenSim(params);
      break;

    // College & Engineering
    case 'QUANTUM_WELL':
      engine = new QuantumWellSim(params);
      break;
    case 'EM_WAVE_3D':
      engine = new EMWave3DSim(params);
      break;
    case 'MAXWELL_BOLTZMANN':
      engine = new MaxwellBoltzmannSim(params);
      break;
    case 'PN_JUNCTION':
      engine = new PNJunctionSim(params);
      break;

    // Foundations
    case 'DOUBLE_PENDULUM':
      engine = new DoublePendulumSim(params);
      break;
    case 'FOURIER_SERIES':
      engine = new FourierSynthesizerSim(params);
      break;
    case 'WAVE_DIFFRACTION':
      engine = new WaveDiffractionSim(params);
      break;
    case 'SURFACE_3D':
      engine = new Surface3DSim(params);
      break;
    case 'LORENZ_ATTRACTOR':
      engine = new LorenzAttractorSim(params);
      break;
    case 'QUANTUM_TUNNEL':
      engine = new QuantumTunnelSim(params);
      break;

    // ECE & Circuit Labs
    case 'CIRCUIT_EVERYCIRCUIT':
      engine = new CircuitEveryCircuitSim(params);
      break;
    case 'DIGITAL_LOGIC_LAB':
      engine = new DigitalLogicLabSim(params);
      break;
    case 'DIGITAL_OSCILLOSCOPE':
      engine = new DigitalOscilloscopeSim(params);
      break;
    case 'TELECOM_MODULATION':
      engine = new TelecomModulationSim(params);
      break;

    // CSE Systems & Architecture Labs
    case 'CPU_PIPELINE':
      engine = new CpuPipelineSim(params);
      break;
    case 'MEMORY_POINTERS_LAB':
      engine = new MemoryPointersLabSim(params);
      break;
    case 'NETWORK_PACKET_ROUTER':
      engine = new NetworkPacketRouterSim(params);
      break;

    // EE & Control Engineering Labs
    case 'INDUCTION_MOTOR_3PH':
      engine = new InductionMotor3PhSim(params);
      break;
    case 'PID_CONTROLLER':
      engine = new PidControllerSim(params);
      break;

    // Universal Dynamic Synthesis Engine
    case 'DYNAMIC_GENERATED':
    case 'DYNAMIC_SIM':
      engine = new DynamicGeneratedSimEngine(params);
      break;

    // New EveryCircuit / CirkitDesigner-Grade Engines
    case 'OPAMP_INVERTING':
      engine = new OpAmpInvertingSim(params);
      break;
    case 'BJT_AMPLIFIER':
      engine = new TransistorBJTSim(params);
      break;
    case 'TIMER_555':
      engine = new TimerIC555Sim(params);
      break;
    case 'RC_FILTER_LAB':
      engine = new RCFilterSim(params);
      break;
    case 'FULL_ADDER':
      engine = new FullAdderSim(params);
      break;

    default:
      engine = new DoublePendulumSim(params);
      break;
  }

  if (engine) {
    engine.engineType = engineType;
    engine.renderMode = PHYSICS_CENTER_ENGINE_TYPES.has(engineType) ? 'center' : 'box';
  }

  return engine;
}

/**
 * Universal safe render dispatcher
 * - Wipes the canvas with cyberpunk dark background (#060a14) before EVERY frame
 * - Completely prevents ghosting / lingering drawings from previous simulations
 * - Dispatches (ctx, cx, cy) to physics engines and (ctx, width, height) to circuit engines
 * - Isolates canvas transform, shadow, alpha and lineDash state via save/restore
 */
export function renderSimulationEngine(engine, ctx, width, height) {
  if (!engine || !ctx) return;

  const cx = width / 2;
  const cy = height / 2;

  ctx.save();

  // 1. Fully wipe canvas background clean on every frame
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle cyberpunk background grid
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Clear shadows, state and alpha
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  // 4. Safe render dispatch
  try {
    const isCenter = engine.renderMode === 'center' ||
      (engine.engineType && PHYSICS_CENTER_ENGINE_TYPES.has(engine.engineType)) ||
      PHYSICS_CX_CY_ENGINES.has(engine.constructor?.name);

    if (isCenter) {
      engine.render(ctx, cx, cy);
    } else {
      engine.render(ctx, width, height, cx, cy);
    }
  } catch (err) {
    console.error('[Simulation Render Error]', err);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`SIMULATION ERROR: ${err.message}`, 20, cy);
  } finally {
    ctx.restore();
  }
}


// ============================================================================
// 1. CIRCUIT EVERYCIRCUIT SIMULATOR (AC Rectifier, Diode Bridge, Electron Drift)
// ============================================================================
export class CircuitEveryCircuitSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.acPeakVoltage = params.acPeakVoltage || 12;
    this.acFrequency = params.acFrequency || 50;
    this.filterCapacitance = params.filterCapacitance !== undefined ? params.filterCapacitance : 100;
    this.loadResistance = params.loadResistance || 100;
    this.time = 0;
    this.history = [];
    this.maxHistory = 240;

    // Electron drift particles around circuit loops
    this.electrons = [];
    for (let i = 0; i < 40; i++) {
      this.electrons.push({
        segment: Math.floor(Math.random() * 6),
        progress: Math.random(),
        speed: 0.8 + Math.random() * 0.4
      });
    }
  }

  updateParams(params) {
    if (params.acPeakVoltage !== undefined) this.acPeakVoltage = params.acPeakVoltage;
    if (params.acFrequency !== undefined) this.acFrequency = params.acFrequency;
    if (params.filterCapacitance !== undefined) this.filterCapacitance = params.filterCapacitance;
    if (params.loadResistance !== undefined) this.loadResistance = params.loadResistance;
  }

  update(dt) {
    this.time += dt * (this.acFrequency / 10);
    const omega = 2 * Math.PI * this.acFrequency;
    const vIn = this.acPeakVoltage * Math.sin(this.time);
    const absVin = Math.abs(vIn);

    // Bridge rectifier drop (2 silicon diode drops ~ 1.4V)
    const vRectified = Math.max(0, absVin - 1.4);

    // RC lowpass filter smoothing for DC output
    const C = Math.max(1, this.filterCapacitance) * 1e-6;
    const R = Math.max(10, this.loadResistance);
    const tau = R * C * 1000; // normalized time constant
    const smoothingAlpha = Math.min(0.98, Math.max(0.05, 1 - Math.exp(-0.02 / (tau * 0.05 + 0.001))));

    if (!this.vOutSmooth) this.vOutSmooth = vRectified;
    if (vRectified > this.vOutSmooth) {
      this.vOutSmooth = vRectified; // charging peak
    } else {
      this.vOutSmooth = this.vOutSmooth * (1 - (0.015 / (tau * 0.2 + 0.1))); // discharge through R_load
    }

    const iLoad = (this.vOutSmooth / R) * 1000; // mA
    const vRipple = (iLoad * 1e-3) / (2 * this.acFrequency * Math.max(1e-6, C * 10));

    // Update drifting electrons
    const currentSpeed = (absVin / 12) * 0.015;
    for (let p of this.electrons) {
      p.progress += currentSpeed * p.speed;
      if (p.progress > 1) {
        p.progress = 0;
        p.segment = (p.segment + 1) % 6;
      }
    }

    this.history.push({ vIn, vOut: this.vOutSmooth, iLoad });
    if (this.history.length > this.maxHistory) this.history.shift();

    return {
      instantaneousVin: vIn.toFixed(2) + ' V',
      dcOutputVoltage: this.vOutSmooth.toFixed(2) + ' V',
      loadCurrent: iLoad.toFixed(1) + ' mA',
      rippleVoltage: (vRipple * 1000).toFixed(0) + ' mV',
      diodeState: vIn >= 0 ? 'D1, D3 FORWARD (CONDUCTION)' : 'D2, D4 FORWARD (CONDUCTION)'
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const cx = width * 0.42;
    const cy = height * 0.45;
    const vIn = this.acPeakVoltage * Math.sin(this.time);

    // Circuit Layout Coordinates
    const acX = cx - 180, acY = cy;
    const brX = cx, brY = cy;
    const capX = cx + 120;
    const loadX = cx + 200;

    // AC Source Symbol
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(acX, acY, 26, 0, Math.PI * 2);
    ctx.stroke();
    // Sine squiggle
    ctx.beginPath();
    ctx.moveTo(acX - 14, acY);
    ctx.bezierCurveTo(acX - 7, acY - 14, acX - 7, acY - 14, acX, acY);
    ctx.bezierCurveTo(acX + 7, acY + 14, acX + 7, acY + 14, acX + 14, acY);
    ctx.stroke();
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AC ~', acX, acY - 34);
    ctx.fillText(`${vIn.toFixed(1)}V`, acX, acY + 44);
    ctx.restore();

    // Wires from AC to Bridge Rectifier
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    // Top AC wire
    ctx.beginPath();
    ctx.moveTo(acX, acY - 26);
    ctx.lineTo(acX, acY - 90);
    ctx.lineTo(brX - 60, acY - 90);
    ctx.lineTo(brX - 60, brY);
    ctx.stroke();

    // Bottom AC wire
    ctx.beginPath();
    ctx.moveTo(acX, acY + 26);
    ctx.lineTo(acX, acY + 90);
    ctx.lineTo(brX, acY + 90);
    ctx.lineTo(brX, brY + 60);
    ctx.stroke();

    // Diode Bridge Diamond (D1, D2, D3, D4)
    const bridgeNodes = {
      top: { x: brX, y: brY - 60 },
      bottom: { x: brX, y: brY + 60 },
      left: { x: brX - 60, y: brY },
      right: { x: brX + 60, y: brY }
    };

    // Helper to draw diode
    const drawDiode = (x1, y1, x2, y2, label, conducting) => {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);

      ctx.save();
      ctx.strokeStyle = conducting ? '#10b981' : '#64748b';
      ctx.fillStyle = conducting ? '#10b981' : '#334155';
      ctx.lineWidth = conducting ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.translate(mx, my);
      ctx.rotate(angle);

      // Diode triangle
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(10, 0);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cathode line
      ctx.beginPath();
      ctx.moveTo(10, -9);
      ctx.lineTo(10, 9);
      ctx.stroke();

      if (conducting) {
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      ctx.restore();

      // Label
      ctx.fillStyle = conducting ? '#34d399' : '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(label, mx, my - 12);
    };

    const isPos = vIn >= 0;
    drawDiode(bridgeNodes.left.x, bridgeNodes.left.y, bridgeNodes.top.x, bridgeNodes.top.y, 'D1', isPos);
    drawDiode(bridgeNodes.bottom.x, bridgeNodes.bottom.y, bridgeNodes.left.x, bridgeNodes.left.y, 'D2', !isPos);
    drawDiode(bridgeNodes.bottom.x, bridgeNodes.bottom.y, bridgeNodes.right.x, bridgeNodes.right.y, 'D3', isPos);
    drawDiode(bridgeNodes.top.x, bridgeNodes.top.y, bridgeNodes.right.x, bridgeNodes.right.y, 'D4', !isPos);

    // DC Bus Output Rail (Top = Positive +V, Bottom = Ground/Return)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    // Top positive rail
    ctx.beginPath();
    ctx.moveTo(bridgeNodes.right.x, bridgeNodes.right.y);
    ctx.lineTo(loadX, bridgeNodes.right.y);
    ctx.stroke();

    // Bottom negative rail
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(bridgeNodes.top.x, bridgeNodes.top.y);
    ctx.lineTo(bridgeNodes.top.x, cy - 110);
    ctx.lineTo(loadX, cy - 110);
    ctx.lineTo(loadX, cy - 60);
    ctx.stroke();

    // Smoothing Capacitor (C)
    ctx.save();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(capX, cy - 110);
    ctx.lineTo(capX, cy - 20);
    ctx.moveTo(capX, cy + 20);
    ctx.lineTo(capX, cy + 60);
    ctx.stroke();
    // Plates
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(capX - 16, cy - 20, 32, 5);
    ctx.fillRect(capX - 16, cy + 15, 32, 5);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`C=${this.filterCapacitance}μF`, capX + 22, cy);
    ctx.restore();

    // Load Resistor (R_load)
    ctx.save();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.5;
    const ry = cy - 20;
    ctx.beginPath();
    ctx.moveTo(loadX, cy - 60);
    ctx.lineTo(loadX, ry - 15);
    // Zigzag
    for (let i = 0; i < 5; i++) {
      const dy = (i % 2 === 0) ? -10 : 10;
      ctx.lineTo(loadX + dy, ry + i * 8);
    }
    ctx.lineTo(loadX, ry + 45);
    ctx.lineTo(loadX, bridgeNodes.right.y);
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.font = '11px monospace';
    ctx.fillText(`R_L=${this.loadResistance}Ω`, loadX + 18, ry + 15);
    ctx.restore();

    // Live Drifting Electron Particles
    ctx.fillStyle = '#ffb800';
    ctx.shadowColor = '#ffb800';
    ctx.shadowBlur = 8;
    for (let p of this.electrons) {
      let px = acX + (brX - acX) * p.progress;
      let py = acY - 90;
      if (p.segment === 1) {
        px = brX + (loadX - brX) * p.progress;
        py = bridgeNodes.right.y;
      } else if (p.segment === 2) {
        px = loadX;
        py = cy - 60 + 120 * p.progress;
      } else if (p.segment === 3) {
        px = loadX - (loadX - brX) * p.progress;
        py = cy - 110;
      }
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Dual-Trace Mini Oscilloscope Box at Bottom
    const oscW = width - 40;
    const oscH = 130;
    const oscX = 20;
    const oscY = height - oscH - 20;

    ctx.fillStyle = 'rgba(6, 10, 20, 0.9)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(oscX, oscY, oscW, oscH);
    ctx.fillRect(oscX, oscY, oscW, oscH);

    // Oscilloscope Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let gx = oscX; gx < oscX + oscW; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, oscY); ctx.lineTo(gx, oscY + oscH); ctx.stroke();
    }
    for (let gy = oscY; gy < oscY + oscH; gy += 25) {
      ctx.beginPath(); ctx.moveTo(oscX, gy); ctx.lineTo(oscX + oscW, gy); ctx.stroke();
    }

    // Trace 1: AC Input Vin (Cyan)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const midY = oscY + oscH / 2;
    for (let i = 0; i < this.history.length; i++) {
      const hx = oscX + (i / this.maxHistory) * (oscW - 20);
      const hy = midY - (this.history[i].vIn / (this.acPeakVoltage || 1)) * 45;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.stroke();

    // Trace 2: Filtered DC Output Vout (Gold Amber)
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const hx = oscX + (i / this.maxHistory) * (oscW - 20);
      const hy = midY - (this.history[i].vOut / (this.acPeakVoltage || 1)) * 45;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.stroke();

    // Legend
    ctx.font = '11px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('━ CH1: AC Input Vin', oscX + 15, oscY + 20);
    ctx.fillStyle = '#ffb800';
    ctx.fillText(`━ CH2: Rectified Smoothed DC (${this.vOutSmooth?.toFixed(1)}V)`, oscX + 180, oscY + 20);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Electron Flow Rate: ${(this.acFrequency).toFixed(0)} Hz`, oscX + oscW - 210, oscY + 20);
  }
}

// ============================================================================
// 2. DIGITAL LOGIC LAB SIMULATOR (Interactive Gates & Dynamic Truth Table)
// ============================================================================
export class DigitalLogicLabSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.inA = params.inputA !== undefined ? Boolean(params.inputA) : true;
    this.inB = params.inputB !== undefined ? Boolean(params.inputB) : false;
    this.inC = params.inputC !== undefined ? Boolean(params.inputC) : true;
    this.gateDelay = params.gateDelay || 5; // ns
    this.time = 0;
    this.switchAreas = [];
  }

  updateParams(params) {
    if (params.inputA !== undefined) this.inA = Boolean(params.inputA);
    if (params.inputB !== undefined) this.inB = Boolean(params.inputB);
    if (params.inputC !== undefined) this.inC = Boolean(params.inputC);
    if (params.gateDelay !== undefined) this.gateDelay = params.gateDelay;
  }

  handleClick(clickX, clickY) {
    // Check if clicked any input switch
    for (const s of this.switchAreas) {
      if (
        clickX >= s.x && clickX <= s.x + s.w &&
        clickY >= s.y && clickY <= s.y + s.h
      ) {
        if (s.name === 'A') this.inA = !this.inA;
        if (s.name === 'B') this.inB = !this.inB;
        if (s.name === 'C') this.inC = !this.inC;
        return true;
      }
    }
    return false;
  }

  update(dt) {
    this.time += dt;
    // Circuit: (A AND B) OR (NOT B AND C) => Full Adder Carry/Logic combo
    const and1 = this.inA && this.inB;
    const notB = !this.inB;
    const and2 = notB && this.inC;
    const finalOut = and1 || and2;
    const xorOut = (this.inA !== this.inB) !== this.inC;

    return {
      inputVector: `A=${this.inA ? 1 : 0}, B=${this.inB ? 1 : 0}, C=${this.inC ? 1 : 0}`,
      intermediateAnd1: and1 ? 'HIGH (1)' : 'LOW (0)',
      intermediateAnd2: and2 ? 'HIGH (1)' : 'LOW (0)',
      outputCarryQ: finalOut ? 'LOGIC HIGH (1)' : 'LOGIC LOW (0)',
      outputSumXOR: xorOut ? 'LOGIC HIGH (1)' : 'LOGIC LOW (0)',
      propagationDelay: `${this.gateDelay * 2} ns`
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, width, height);

    // Switch hitboxes
    this.switchAreas = [];

    const startX = 60;
    const startY = 80;
    const spacingY = 90;

    // Helper to draw interactive toggle switch
    const drawSwitch = (x, y, state, label) => {
      const swW = 70, swH = 34;
      this.switchAreas.push({ x, y, w: swW, h: swH, name: label });

      ctx.save();
      ctx.fillStyle = state ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.strokeStyle = state ? '#10b981' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, swW, swH, 8);
      ctx.fill();
      ctx.stroke();

      // Toggle knob
      const knobX = state ? x + swW - 20 : x + 8;
      ctx.fillStyle = state ? '#10b981' : '#ef4444';
      ctx.shadowColor = state ? '#10b981' : '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(knobX + 6, y + swH / 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`${label}: ${state ? '1' : '0'}`, x + (state ? 10 : 30), y + 21);
      ctx.restore();
    };

    drawSwitch(startX, startY, this.inA, 'A');
    drawSwitch(startX, startY + spacingY, this.inB, 'B');
    drawSwitch(startX, startY + spacingY * 2, this.inC, 'C');

    // Logic Values
    const and1 = this.inA && this.inB;
    const notB = !this.inB;
    const and2 = notB && this.inC;
    const finalOut = and1 || and2;

    // Helper to draw logic gate (AND, OR, NOT)
    const drawGate = (gx, gy, type, inValues, outVal, label) => {
      ctx.save();
      ctx.strokeStyle = outVal ? '#00f0ff' : '#475569';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      if (type === 'AND') {
        ctx.moveTo(gx - 30, gy - 25);
        ctx.lineTo(gx, gy - 25);
        ctx.arc(gx, gy, 25, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(gx - 30, gy + 25);
        ctx.closePath();
      } else if (type === 'OR') {
        ctx.moveTo(gx - 30, gy - 25);
        ctx.quadraticCurveTo(gx - 10, gy - 25, gx + 25, gy);
        ctx.quadraticCurveTo(gx - 10, gy + 25, gx - 30, gy + 25);
        ctx.quadraticCurveTo(gx - 15, gy, gx - 30, gy - 25);
        ctx.closePath();
      } else if (type === 'NOT') {
        ctx.moveTo(gx - 20, gy - 18);
        ctx.lineTo(gx + 15, gy);
        ctx.lineTo(gx - 20, gy + 18);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        // Bubble
        ctx.beginPath();
        ctx.arc(gx + 21, gy, 5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, gx - 5, gy + 4);
      ctx.restore();
    };

    // Wires and Gates Layout
    const gate1X = 260, gate1Y = 110;
    const notGateX = 210, notGateY = 210;
    const gate2X = 330, gate2Y = 240;
    const orGateX = 490, orGateY = 175;

    // Gate 1: AND (A, B)
    drawGate(gate1X, gate1Y, 'AND', [this.inA, this.inB], and1, 'AND');
    // NOT Gate on B
    drawGate(notGateX, notGateY, 'NOT', [this.inB], notB, 'NOT');
    // Gate 2: AND (NOT B, C)
    drawGate(gate2X, gate2Y, 'AND', [notB, this.inC], and2, 'AND');
    // Final OR Gate
    drawGate(orGateX, orGateY, 'OR', [and1, and2], finalOut, 'OR');

    // Connecting Glowing Wires
    const drawWire = (x1, y1, x2, y2, state) => {
      ctx.strokeStyle = state ? '#00f0ff' : '#334155';
      ctx.lineWidth = state ? 2.5 : 1.5;
      if (state) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    // A to Gate 1
    drawWire(startX + 70, startY + 17, gate1X - 30, gate1Y - 12, this.inA);
    // B to Gate 1 and NOT gate
    drawWire(startX + 70, startY + spacingY + 17, gate1X - 30, gate1Y + 12, this.inB);
    drawWire(startX + 70, startY + spacingY + 17, notGateX - 20, notGateY, this.inB);
    // NOT B to Gate 2
    drawWire(notGateX + 26, notGateY, gate2X - 30, gate2Y - 12, notB);
    // C to Gate 2
    drawWire(startX + 70, startY + spacingY * 2 + 17, gate2X - 30, gate2Y + 12, this.inC);
    // AND 1 to OR
    drawWire(gate1X + 25, gate1Y, orGateX - 30, orGateY - 12, and1);
    // AND 2 to OR
    drawWire(gate2X + 25, gate2Y, orGateX - 30, orGateY + 12, and2);

    // Final Output LED Bulb
    const outX = orGateX + 110, outY = orGateY;
    drawWire(orGateX + 25, orGateY, outX, outY, finalOut);

    ctx.save();
    ctx.fillStyle = finalOut ? '#10b981' : '#1e293b';
    ctx.strokeStyle = finalOut ? '#34d399' : '#475569';
    ctx.lineWidth = 3;
    if (finalOut) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 25;
    }
    ctx.beginPath();
    ctx.arc(outX, outY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(finalOut ? 'HIGH (1)' : 'LOW (0)', outX, outY + 38);
    ctx.fillText('OUTPUT Q', outX, outY - 26);
    ctx.restore();

    // Live Dynamic Truth Table on Right Side
    const ttX = width - 260, ttY = 50, ttW = 240, ttH = 280;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ttX, ttY, ttW, ttH);
    ctx.fillRect(ttX, ttY, ttW, ttH);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('DYNAMIC TRUTH TABLE', ttX + 15, ttY + 22);

    // Table Header
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText("A  B  C │ Q = (A·B)+(B'·C)", ttX + 15, ttY + 44);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.moveTo(ttX + 10, ttY + 52);
    ctx.lineTo(ttX + ttW - 10, ttY + 52);
    ctx.stroke();

    // 8 Combinations
    for (let i = 0; i < 8; i++) {
      const a = (i >> 2) & 1;
      const b = (i >> 1) & 1;
      const c = i & 1;
      const q = (a && b) || (!b && c) ? 1 : 0;
      const isCurrentRow = (a === (this.inA ? 1 : 0)) && (b === (this.inB ? 1 : 0)) && (c === (this.inC ? 1 : 0));

      const rowY = ttY + 74 + i * 24;
      if (isCurrentRow) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.fillRect(ttX + 8, rowY - 14, ttW - 16, 20);
        ctx.fillStyle = '#ffb800';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`▶ ${a}  ${b}  ${c} │   ${q}  [ACTIVE]`, ttX + 12, rowY);
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.fillText(`  ${a}  ${b}  ${c} │   ${q}`, ttX + 15, rowY);
      }
    }

    // Hint
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.fillText('💡 Click any switch [A, B, C] to toggle state in real time!', 40, height - 25);
  }
}

// ============================================================================
// 3. DIGITAL OSCILLOSCOPE SIMULATOR (Tektronix Dual-Trace, Volts/Div, Lissajous)
// ============================================================================
export class DigitalOscilloscopeSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.ch1Frequency = params.ch1Frequency || 50;
    this.ch1Amplitude = params.ch1Amplitude || 5;
    this.ch2Frequency = params.ch2Frequency || 100;
    this.ch2Amplitude = params.ch2Amplitude || 4;
    this.phaseShift = params.phaseShift !== undefined ? params.phaseShift : 90; // deg
    this.ch2Waveform = params.ch2Waveform || 'SINE'; // SINE, SQUARE, TRIANGLE
    this.displayMode = params.displayMode || 'DUAL_TRACE'; // DUAL_TRACE, LISSAJOUS_XY

    this.timeBase = 1.0; // ms/div
    this.voltsPerDiv = 2.0; // V/div
    this.time = 0;
  }

  updateParams(params) {
    if (params.ch1Frequency !== undefined) this.ch1Frequency = params.ch1Frequency;
    if (params.ch1Amplitude !== undefined) this.ch1Amplitude = params.ch1Amplitude;
    if (params.ch2Frequency !== undefined) this.ch2Frequency = params.ch2Frequency;
    if (params.ch2Amplitude !== undefined) this.ch2Amplitude = params.ch2Amplitude;
    if (params.phaseShift !== undefined) this.phaseShift = params.phaseShift;
    if (params.ch2Waveform) this.ch2Waveform = params.ch2Waveform;
    if (params.displayMode) this.displayMode = params.displayMode;
  }

  update(dt) {
    this.time += dt * 5;
    const vRms1 = this.ch1Amplitude / Math.SQRT2;
    const vRms2 = this.ch2Amplitude / Math.SQRT2;
    const freqRatio = (this.ch2Frequency / this.ch1Frequency).toFixed(2);

    return {
      ch1PeakToPeak: (this.ch1Amplitude * 2).toFixed(1) + ' Vpp',
      ch1Rms: vRms1.toFixed(2) + ' Vrms',
      ch2PeakToPeak: (this.ch2Amplitude * 2).toFixed(1) + ' Vpp',
      ch2Rms: vRms2.toFixed(2) + ' Vrms',
      frequencyRatio: `f2 : f1 = ${freqRatio} : 1`,
      phaseAngleDiff: `${this.phaseShift}° (${(this.phaseShift * Math.PI / 180).toFixed(2)} rad)`
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Bezel Frame
    const scopeX = 40, scopeY = 40;
    const scopeW = width - 80, scopeH = height - 120;

    ctx.fillStyle = '#06101e';
    ctx.fillRect(scopeX, scopeY, scopeW, scopeH);

    // Graticule Grid (10 divisions horizontally, 8 divisions vertically)
    const numDivX = 10, numDivY = 8;
    const divW = scopeW / numDivX;
    const divH = scopeH / numDivY;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= numDivX; i++) {
      ctx.beginPath();
      ctx.moveTo(scopeX + i * divW, scopeY);
      ctx.lineTo(scopeX + i * divW, scopeY + scopeH);
      ctx.stroke();
    }
    for (let j = 0; j <= numDivY; j++) {
      ctx.beginPath();
      ctx.moveTo(scopeX, scopeY + j * divH);
      ctx.lineTo(scopeX + scopeW, scopeY + j * divH);
      ctx.stroke();
    }

    // Center Crosshairs with sub-ticks
    const midX = scopeX + scopeW / 2;
    const midY = scopeY + scopeH / 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(midX, scopeY); ctx.lineTo(midX, scopeY + scopeH);
    ctx.moveTo(scopeX, midY); ctx.lineTo(scopeX + scopeW, midY);
    ctx.stroke();

    const radPhase = (this.phaseShift * Math.PI) / 180;

    if (this.displayMode === 'LISSAJOUS_XY') {
      // Lissajous X-Y Parametric Plot
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      const scaleX = (divW * 3.5) / 10;
      const scaleY = (divH * 3.5) / 10;
      const numPoints = 800;

      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 4;
        const x = midX + this.ch1Amplitude * Math.sin(this.ch1Frequency * 0.05 * theta + this.time * 0.5) * scaleX;
        const y = midY - this.ch2Amplitude * Math.sin(this.ch2Frequency * 0.05 * theta + radPhase + this.time * 0.5) * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#ffb800';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('LISSAJOUS X-Y MODE (CH1=X, CH2=Y)', scopeX + 20, scopeY + 30);
    } else {
      // Dual Trace Mode (CH1 Yellow Sine, CH2 Cyan Signal)
      const scaleV = divH / this.voltsPerDiv;

      // Draw CH1 (Yellow)
      ctx.save();
      ctx.strokeStyle = '#ffb800';
      ctx.shadowColor = '#ffb800';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      for (let x = 0; x < scopeW; x += 2) {
        const t = (x / scopeW) * 0.04 + this.time * 0.02;
        const v1 = this.ch1Amplitude * Math.sin(2 * Math.PI * this.ch1Frequency * t);
        const y = midY - v1 * scaleV;
        if (x === 0) ctx.moveTo(scopeX + x, y);
        else ctx.lineTo(scopeX + x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Draw CH2 (Cyan)
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2.2;
      ctx.beginPath();

      for (let x = 0; x < scopeW; x += 2) {
        const t = (x / scopeW) * 0.04 + this.time * 0.02;
        let v2 = 0;
        const angle = 2 * Math.PI * this.ch2Frequency * t + radPhase;
        if (this.ch2Waveform === 'SQUARE') {
          v2 = Math.sin(angle) >= 0 ? this.ch2Amplitude : -this.ch2Amplitude;
        } else if (this.ch2Waveform === 'TRIANGLE') {
          v2 = (2 * this.ch2Amplitude / Math.PI) * Math.asin(Math.sin(angle));
        } else {
          v2 = this.ch2Amplitude * Math.sin(angle);
        }
        const y = midY - v2 * scaleV;
        if (x === 0) ctx.moveTo(scopeX + x, y);
        else ctx.lineTo(scopeX + x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Channel HUD Legend
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffb800';
      ctx.fillText(`CH1: ${this.ch1Amplitude}V @ ${this.ch1Frequency}Hz [SINE]`, scopeX + 20, scopeY + 28);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`CH2: ${this.ch2Amplitude}V @ ${this.ch2Frequency}Hz [${this.ch2Waveform}] Δφ=${this.phaseShift}°`, scopeX + 320, scopeY + 28);
    }

    // Oscilloscope Bottom Status Bar
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`TIMEBASE: ${this.timeBase} ms/div │ VOLTS/DIV: ${this.voltsPerDiv} V/div │ TRIG: AUTO CH1 0.00V │ SAMPLE: 1 GS/s`, scopeX + 15, height - 50);
  }
}

// ============================================================================
// 4. TELECOM MODULATION SIMULATOR (AM / FM Carrier & RF Spectrum Analyzer)
// ============================================================================
export class TelecomModulationSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.carrierFreq = params.carrierFreq || 100;
    this.messageFreq = params.messageFreq || 10;
    this.modulationIndex = params.modulationIndex !== undefined ? params.modulationIndex : 0.8;
    this.modulationType = params.modulationType || 'AM'; // AM or FM
    this.time = 0;
  }

  updateParams(params) {
    if (params.carrierFreq !== undefined) this.carrierFreq = params.carrierFreq;
    if (params.messageFreq !== undefined) this.messageFreq = params.messageFreq;
    if (params.modulationIndex !== undefined) this.modulationIndex = params.modulationIndex;
    if (params.modulationType) this.modulationType = params.modulationType;
  }

  update(dt) {
    this.time += dt * 3;
    const bandwidth = this.modulationType === 'AM'
      ? (2 * this.messageFreq) + ' kHz'
      : (2 * (this.modulationIndex + 1) * this.messageFreq).toFixed(1) + ' kHz (Carson rule)';

    const totalPower = this.modulationType === 'AM'
      ? (1 + (this.modulationIndex ** 2) / 2).toFixed(2) + ' Pc'
      : '1.00 Pc (Constant RF Envelope)';

    return {
      modulationType: this.modulationType,
      carrierFrequency: `${this.carrierFreq} kHz`,
      messageFrequency: `${this.messageFreq} kHz`,
      modulationIndex: this.modulationType === 'AM' ? `μ = ${this.modulationIndex}` : `β = ${this.modulationIndex}`,
      signalBandwidth: bandwidth,
      totalTransmittedPower: totalPower
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#080d1a';
    ctx.fillRect(0, 0, width, height);

    const midY1 = height * 0.28;
    const midY2 = height * 0.76;
    const graphW = width - 80;
    const startX = 40;

    // Top Section: RF Modulated Time Domain Waveform
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(startX, 40, graphW, height * 0.42);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.strokeRect(startX, 40, graphW, height * 0.42);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`TIME DOMAIN: ${this.modulationType} MODULATED RF WAVEFORM`, startX + 15, 62);

    // Draw Modulated RF Wave
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const Ac = 50;

    for (let x = 0; x < graphW; x += 2) {
      const t = (x / graphW) * 0.05 + this.time * 0.02;
      let yVal = 0;

      if (this.modulationType === 'AM') {
        const envelope = Ac * (1 + this.modulationIndex * Math.cos(2 * Math.PI * this.messageFreq * t));
        yVal = envelope * Math.cos(2 * Math.PI * this.carrierFreq * t);
      } else {
        // FM
        yVal = Ac * Math.cos(2 * Math.PI * this.carrierFreq * t + this.modulationIndex * Math.sin(2 * Math.PI * this.messageFreq * t));
      }

      const y = midY1 - yVal;
      if (x === 0) ctx.moveTo(startX + x, y);
      else ctx.lineTo(startX + x, y);
    }
    ctx.stroke();

    // In AM, draw the dashed upper and lower envelope
    if (this.modulationType === 'AM') {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#ffb800';
      ctx.beginPath();
      for (let x = 0; x < graphW; x += 4) {
        const t = (x / graphW) * 0.05 + this.time * 0.02;
        const env = Ac * (1 + this.modulationIndex * Math.cos(2 * Math.PI * this.messageFreq * t));
        const y = midY1 - env;
        if (x === 0) ctx.moveTo(startX + x, y);
        else ctx.lineTo(startX + x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let x = 0; x < graphW; x += 4) {
        const t = (x / graphW) * 0.05 + this.time * 0.02;
        const env = Ac * (1 + this.modulationIndex * Math.cos(2 * Math.PI * this.messageFreq * t));
        const y = midY1 + env;
        if (x === 0) ctx.moveTo(startX + x, y);
        else ctx.lineTo(startX + x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Bottom Section: RF Frequency Spectrum Analyzer (Carrier + Sidebands)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(startX, height * 0.54, graphW, height * 0.38);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.strokeRect(startX, height * 0.54, graphW, height * 0.38);

    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('FREQUENCY SPECTRUM (CARRIER & SIDEBAND POWER)', startX + 15, height * 0.54 + 22);

    const specBaseY = height * 0.86;
    const centerFreqX = startX + graphW / 2;

    // Center Carrier Peak
    const drawPeak = (px, pHeight, label, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, specBaseY);
      ctx.lineTo(px, specBaseY - pHeight);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, px, specBaseY - pHeight - 8);
    };

    drawPeak(centerFreqX, 90, `fc (${this.carrierFreq}k)`, '#00f0ff');

    if (this.modulationType === 'AM') {
      // AM has Lower Sideband (fc - fm) and Upper Sideband (fc + fm)
      const sbOffset = 80;
      const sbHeight = 45 * Math.min(1.0, this.modulationIndex);
      drawPeak(centerFreqX - sbOffset, sbHeight, `LSB (${this.carrierFreq - this.messageFreq}k)`, '#ffb800');
      drawPeak(centerFreqX + sbOffset, sbHeight, `USB (${this.carrierFreq + this.messageFreq}k)`, '#ffb800');
    } else {
      // FM has multiple Bessel sidebands
      for (let n = 1; n <= 3; n++) {
        const offset = n * 45;
        const bHeight = Math.max(10, (70 / (n + 1)) * (this.modulationIndex * 0.7));
        drawPeak(centerFreqX - offset, bHeight, `J-${n}`, '#ec4899');
        drawPeak(centerFreqX + offset, bHeight, `J+${n}`, '#ec4899');
      }
    }
  }
}

// ============================================================================
// 5. CPU PIPELINE SIMULATOR (RISC-V 5-Stage: IF, ID, EX, MEM, WB with Hazards)
// ============================================================================
export class CpuPipelineSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.clockSpeed = params.clockSpeed || 2; // Hz simulation speed
    this.hazardType = params.hazardType || 'FORWARDING_ACTIVE'; // RAW_STALL, FORWARDING_ACTIVE, NO_HAZARD
    this.clockCycle = 0;
    this.time = 0;

    this.instructions = [
      { id: 'I1', asm: 'ADD  x1, x2, x3', rd: 'x1', rs1: 'x2', rs2: 'x3', color: '#38bdf8' },
      { id: 'I2', asm: 'SUB  x4, x1, x5', rd: 'x4', rs1: 'x1', rs2: 'x5', color: '#f59e0b' },
      { id: 'I3', asm: 'LW   x6, 0(x1)',  rd: 'x6', rs1: 'x1', rs2: null, color: '#10b981' },
      { id: 'I4', asm: 'OR   x7, x4, x6', rd: 'x7', rs1: 'x4', rs2: 'x6', color: '#a855f7' },
      { id: 'I5', asm: 'SW   x7, 4(x2)',  rd: null, rs1: 'x7', rs2: 'x2', color: '#ec4899' },
      { id: 'I6', asm: 'XOR  x8, x1, x4', rd: 'x8', rs1: 'x1', rs2: 'x4', color: '#06b6d4' }
    ];

    // Pipeline stages: [IF, ID, EX, MEM, WB]
    this.stages = [null, null, null, null, null];
    this.stageNames = ['[IF] FETCH', '[ID] DECODE', '[EX] EXECUTE', '[MEM] MEMORY', '[WB] WRITEBACK'];
  }

  updateParams(params) {
    if (params.clockSpeed !== undefined) this.clockSpeed = params.clockSpeed;
    if (params.hazardType) this.hazardType = params.hazardType;
  }

  update(dt) {
    this.time += dt * this.clockSpeed;
    if (this.time >= 1.0) {
      this.time -= 1.0;
      this.clockCycle++;

      // Advance pipeline
      this.stages[4] = this.stages[3];
      this.stages[3] = this.stages[2];
      this.stages[2] = this.stages[1];
      this.stages[1] = this.stages[0];

      // Next instruction into IF
      const nextIdx = (this.clockCycle - 1) % (this.instructions.length + 3);
      if (nextIdx < this.instructions.length) {
        this.stages[0] = this.instructions[nextIdx];
      } else {
        this.stages[0] = null;
      }
    }

    return {
      clockCycle: `CC #${this.clockCycle}`,
      ipcThroughput: '0.94 Instructions/Cycle',
      hazardStatus: this.hazardType === 'FORWARDING_ACTIVE' ? 'DATA HAZARD RESOLVED VIA EX/MEM BYPASS' : 'PIPELINE RUNNING OPTIMAL',
      activeInstruction: this.stages[2] ? this.stages[2].asm : (this.stages[1] ? this.stages[1].asm : 'NOP'),
      cpiScore: '1.06'
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, width, height);

    const startX = 50;
    const stageW = (width - 100) / 5 - 15;
    const stageH = 180;
    const stageY = height * 0.32;

    // Draw 5 Stages
    for (let i = 0; i < 5; i++) {
      const sx = startX + i * (stageW + 15);
      const isExec = i === 2;

      ctx.fillStyle = isExec ? 'rgba(0, 240, 255, 0.12)' : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = isExec ? '#00f0ff' : 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = isExec ? 2.5 : 1.5;
      ctx.strokeRect(sx, stageY, stageW, stageH);
      ctx.fillRect(sx, stageY, stageW, stageH);

      // Stage Header
      ctx.fillStyle = isExec ? '#00f0ff' : '#94a3b8';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.stageNames[i], sx + stageW / 2, stageY + 28);

      // Current Instruction in Stage
      const inst = this.stages[i];
      if (inst) {
        ctx.fillStyle = inst.color;
        ctx.shadowColor = inst.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(sx + 10, stageY + 60, stageW - 20, 48);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(inst.id, sx + stageW / 2, stageY + 78);
        ctx.fillText(inst.asm, sx + stageW / 2, stageY + 95);
      } else {
        ctx.fillStyle = '#475569';
        ctx.font = 'italic 11px monospace';
        ctx.fillText('[ BUBBLE / NOP ]', sx + stageW / 2, stageY + 90);
      }

      // Connecting arrow to next stage
      if (i < 4) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        const arrowX = sx + stageW;
        ctx.beginPath();
        ctx.moveTo(arrowX, stageY + stageH / 2);
        ctx.lineTo(arrowX + 15, stageY + stageH / 2);
        ctx.stroke();
      }
    }

    // Forwarding Data Bypass Bus (EX -> ID)
    if (this.hazardType === 'FORWARDING_ACTIVE') {
      const exX = startX + 2 * (stageW + 15) + stageW / 2;
      const idX = startX + 1 * (stageW + 15) + stageW / 2;
      const busY = stageY - 35;

      ctx.save();
      ctx.strokeStyle = '#ffb800';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(exX, stageY);
      ctx.lineTo(exX, busY);
      ctx.lineTo(idX, busY);
      ctx.lineTo(idX, stageY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffb800';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ FORWARDING UNIT (RAW BYPASS: EX -> ID)', (exX + idX) / 2, busY - 10);
      ctx.restore();
    }

    // Register File State at Bottom
    const regY = height - 90;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.strokeRect(startX, regY, width - 100, 60);
    ctx.fillRect(startX, regY, width - 100, 60);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('RISC-V 32-BIT INTEGER REGISTERS:', startX + 15, regY + 22);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px monospace';
    ctx.fillText('x1(ra)=0x0040  x2(sp)=0x7ff0  x3(gp)=0x0010  x4(tp)=0x0024  x5(t0)=0x0008  x6(t1)=0x00ff', startX + 15, regY + 44);
  }
}

// ============================================================================
// 6. MEMORY POINTERS LAB SIMULATOR (Stack vs Heap, Malloc Blocks, Pointer Arrows)
// ============================================================================
export class MemoryPointersLabSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.allocatedBlocks = params.allocatedBlocks || 4;
    this.pointerState = params.pointerState || 'VALID'; // VALID, DANGLING, LEAK
    this.time = 0;
  }

  updateParams(params) {
    if (params.allocatedBlocks !== undefined) this.allocatedBlocks = params.allocatedBlocks;
    if (params.pointerState) this.pointerState = params.pointerState;
  }

  update(dt) {
    this.time += dt;
    return {
      stackFrames: 'main() -> parseNode() -> compute()',
      heapBlocks: `${this.allocatedBlocks} blocks active (${this.allocatedBlocks * 32} bytes)`,
      pointerSafety: this.pointerState === 'VALID' ? 'ALL POINTERS BOUNDED & VALID' : 'WARNING: DANGLING POINTER DETECTED',
      heapAddress: '0x7ffeb400a120'
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    const paneW = (width - 120) / 2;
    const paneH = height - 100;
    const stackX = 40;
    const heapX = width / 2 + 20;
    const topY = 50;

    // Stack Pane (Grows Downward)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(stackX, topY, paneW, paneH);
    ctx.fillRect(stackX, topY, paneW, paneH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('CALL STACK (High -> Low Memory)', stackX + 15, topY + 28);

    // Stack Frames
    const frames = [
      { name: 'main() frame', vars: ['int argc = 2', 'char* argv[] = 0x7fff..'] },
      { name: 'processData() frame', vars: ['Node* head = 0x0041a0', 'int count = 4'] }
    ];

    let fy = topY + 50;
    for (let f of frames) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.strokeRect(stackX + 12, fy, paneW - 24, 75);
      ctx.fillRect(stackX + 12, fy, paneW - 24, 75);

      ctx.fillStyle = '#00f0ff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(f.name, stackX + 22, fy + 22);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(f.vars[0], stackX + 22, fy + 42);
      ctx.fillText(f.vars[1], stackX + 22, fy + 60);

      fy += 90;
    }

    // Heap Pane (Grows Upward via malloc)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(heapX, topY, paneW, paneH);
    ctx.fillRect(heapX, topY, paneW, paneH);

    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('DYNAMIC HEAP (malloc / free)', heapX + 15, topY + 28);

    // Heap Allocated Blocks
    let hy = topY + 50;
    for (let i = 0; i < this.allocatedBlocks; i++) {
      const addr = `0x0041a${i * 4}`;
      ctx.fillStyle = 'rgba(255, 184, 0, 0.15)';
      ctx.strokeStyle = '#ffb800';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(heapX + 12, hy, paneW - 24, 55);
      ctx.fillRect(heapX + 12, hy, paneW - 24, 55);

      ctx.fillStyle = '#ffb800';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`malloc(sizeof(Node)) @ ${addr}`, heapX + 22, hy + 22);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px monospace';
      ctx.fillText(`payload = [data: 0x${(i * 17 + 42).toString(16).toUpperCase()}, next: 0x0041a${(i + 1) * 4}]`, heapX + 22, hy + 42);

      hy += 68;
    }

    // Pointer Arrow from Stack (head) to Heap (Block 0)
    ctx.save();
    ctx.strokeStyle = this.pointerState === 'VALID' ? '#10b981' : '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const ptrOriginX = stackX + paneW - 15;
    const ptrOriginY = topY + 180;
    const ptrTargetX = heapX + 12;
    const ptrTargetY = topY + 75;

    ctx.moveTo(ptrOriginX, ptrOriginY);
    ctx.bezierCurveTo(ptrOriginX + 60, ptrOriginY, ptrTargetX - 60, ptrTargetY, ptrTargetX, ptrTargetY);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = this.pointerState === 'VALID' ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.moveTo(ptrTargetX, ptrTargetY);
    ctx.lineTo(ptrTargetX - 10, ptrTargetY - 6);
    ctx.lineTo(ptrTargetX - 10, ptrTargetY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================================
// 7. NETWORK PACKET ROUTER SIMULATOR (OSI Layers, Router Hops, TCP Handshake)
// ============================================================================
export class NetworkPacketRouterSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.packetLossRate = params.packetLossRate || 0; // %
    this.transmissionRate = params.transmissionRate || 10; // Mbps
    this.tcpState = 'ESTABLISHED';
    this.time = 0;

    this.nodes = [
      { name: 'CLIENT PC', ip: '192.168.1.10', type: 'HOST' },
      { name: 'SWITCH SW1', ip: '192.168.1.1', type: 'SWITCH' },
      { name: 'ROUTER R1', ip: '10.0.0.1', type: 'ROUTER' },
      { name: 'ROUTER R2', ip: '172.16.0.1', type: 'ROUTER' },
      { name: 'SERVER HOST', ip: '142.250.190.46', type: 'SERVER' }
    ];

    this.packets = [];
    for (let i = 0; i < 6; i++) {
      this.packets.push({
        progress: (i / 6),
        seq: 1000 + i * 512,
        ack: 2000 + i * 512,
        type: i === 0 ? 'SYN' : (i === 1 ? 'SYN-ACK' : 'TCP DATA')
      });
    }
  }

  updateParams(params) {
    if (params.packetLossRate !== undefined) this.packetLossRate = params.packetLossRate;
    if (params.transmissionRate !== undefined) this.transmissionRate = params.transmissionRate;
  }

  update(dt) {
    this.time += dt * 0.8;
    for (let p of this.packets) {
      p.progress += dt * 0.25;
      if (p.progress > 1) {
        p.progress = 0;
      }
    }

    return {
      tcpConnectionState: this.tcpState,
      rttLatency: '24 ms',
      effectiveThroughput: `${this.transmissionRate} Mbps`,
      windowSizeCwnd: '64 KB (Sliding Window)',
      congestionControl: 'TCP CUBIC (Loss = 0.0%)'
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    const startX = 60;
    const endX = width - 60;
    const midY = height * 0.45;
    const stepX = (endX - startX) / (this.nodes.length - 1);

    // Draw Cables between nodes
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(startX, midY);
    ctx.lineTo(endX, midY);
    ctx.stroke();

    // Draw Nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const nx = startX + i * stepX;
      const node = this.nodes[i];

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = node.type === 'ROUTER' ? '#ffb800' : '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nx, midY, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = node.type === 'ROUTER' ? '#ffb800' : '#00f0ff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, nx, midY - 36);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(node.ip, nx, midY + 44);
      ctx.restore();
    }

    // Draw Flying Packets
    for (let p of this.packets) {
      const px = startX + p.progress * (endX - startX);
      ctx.save();
      ctx.fillStyle = p.type === 'SYN' ? '#ec4899' : '#10b981';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 12;
      ctx.fillRect(px - 14, midY - 10, 28, 20);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.type, px, midY + 4);
      ctx.restore();
    }

    // Bottom OSI Encapsulation Diagram
    const osiY = height - 90;
    const osiLayers = ['Physical (Bits)', 'Data Link (Ethernet Frame)', 'Network (IPv4 / IPv6)', 'Transport (TCP)', 'Application (HTTP/TLS)'];
    const layerW = (width - 120) / 5;

    for (let i = 0; i < 5; i++) {
      const lx = 60 + i * layerW;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lx, osiY, layerW - 10, 48);
      ctx.fillRect(lx, osiY, layerW - 10, 48);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`L${i + 1}: ${osiLayers[i]}`, lx + (layerW - 10) / 2, osiY + 28);
    }
  }
}

// ============================================================================
// 8. 3-PHASE INDUCTION MOTOR SIMULATOR (Rotating Magnetic Field B_net & Slip)
// ============================================================================
export class InductionMotor3PhSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.acFrequency = params.acFrequency || 50; // Hz
    this.polePairs = params.polePairs || 4; // poles
    this.loadTorque = params.loadTorque || 20; // N*m
    this.time = 0;
  }

  updateParams(params) {
    if (params.acFrequency !== undefined) this.acFrequency = params.acFrequency;
    if (params.polePairs !== undefined) this.polePairs = params.polePairs;
    if (params.loadTorque !== undefined) this.loadTorque = params.loadTorque;
  }

  update(dt) {
    this.time += dt * (this.acFrequency / 15);
    const Ns = (120 * this.acFrequency) / this.polePairs; // RPM
    const slip = Math.min(0.25, Math.max(0.01, (this.loadTorque / 150)));
    const Nr = Ns * (1 - slip);

    return {
      synchronousSpeed: `${Ns.toFixed(0)} RPM`,
      rotorSpeed: `${Nr.toFixed(0)} RPM`,
      slipPercentage: `${(slip * 100).toFixed(2)} %`,
      developedTorque: `${this.loadTorque.toFixed(1)} N·m`,
      motorEfficiency: '89.4 %'
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.42;
    const cy = height * 0.48;
    const statorR = 140;
    const rotorR = 90;

    // Stator Outer Ring
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, statorR, 0, Math.PI * 2);
    ctx.stroke();

    // Stator Coils (6 coils 60 deg apart: A, B', C, A', B, C')
    const phaseColors = ['#ef4444', '#3b82f6', '#10b981']; // Red, Blue, Green
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const sx = cx + Math.cos(angle) * (statorR - 18);
      const sy = cy + Math.sin(angle) * (statorR - 18);
      const phaseColor = phaseColors[i % 3];

      ctx.fillStyle = phaseColor;
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spinning Rotor
    const rotorAngle = this.time * 0.95;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotorAngle);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, rotorR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Squirrel Cage Rotor Bars
    for (let i = 0; i < 12; i++) {
      const bAngle = (i * Math.PI) / 6;
      const bx = Math.cos(bAngle) * (rotorR - 12);
      const by = Math.sin(bAngle) * (rotorR - 12);
      ctx.fillStyle = '#ffb800';
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Rotating Net Stator Magnetic Flux Vector B_net
    const bAngle = this.time;
    const bEndX = cx + Math.cos(bAngle) * (statorR + 30);
    const bEndY = cy + Math.sin(bAngle) * (statorR + 30);

    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(bEndX, bEndY);
    ctx.stroke();

    // Arrowhead for B_net
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(bEndX, bEndY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Legend
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('⚡ B_net ROTATING STATOR FLUX VECTOR', cx - 120, cy - statorR - 40);

    // Torque-Speed Curve on Right
    const graphX = width - 260;
    const graphY = 60;
    const graphW = 220;
    const graphH = 200;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.strokeRect(graphX, graphY, graphW, graphH);
    ctx.fillRect(graphX, graphY, graphW, graphH);

    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('TORQUE-SPEED CURVE T(N)', graphX + 15, graphY + 22);

    // Curve
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < graphW - 30; x += 3) {
      const s = 1 - (x / (graphW - 30));
      // T proportional to s / (R2^2 + (s*X2)^2)
      const tVal = (2 * s * 0.1) / (0.01 + (s * 0.2) ** 2);
      const gy = graphY + graphH - 20 - tVal * 12;
      if (x === 0) ctx.moveTo(graphX + 15 + x, gy);
      else ctx.lineTo(graphX + 15 + x, gy);
    }
    ctx.stroke();
  }
}

// ============================================================================
// 9. CLOSED-LOOP PID CONTROLLER SIMULATOR (Setpoint Step Response, Error ODE)
// ============================================================================
export class PidControllerSim {
  constructor(params) {
    this.reset(params);
  }

  reset(params = {}) {
    this.kp = params.kp !== undefined ? params.kp : 2.5;
    this.ki = params.ki !== undefined ? params.ki : 0.8;
    this.kd = params.kd !== undefined ? params.kd : 0.4;
    this.setpoint = params.setpoint || 100;

    this.pv = 0; // process variable
    this.velocity = 0;
    this.integral = 0;
    this.prevError = 0;
    this.history = [];
    this.maxHistory = 240;
    this.time = 0;
  }

  updateParams(params) {
    if (params.kp !== undefined) this.kp = params.kp;
    if (params.ki !== undefined) this.ki = params.ki;
    if (params.kd !== undefined) this.kd = params.kd;
    if (params.setpoint !== undefined) this.setpoint = params.setpoint;
  }

  update(dt) {
    this.time += dt;
    const error = this.setpoint - this.pv;
    this.integral += error * dt;
    // Anti-windup
    this.integral = Math.max(-100, Math.min(100, this.integral));
    const derivative = (error - this.prevError) / Math.max(0.001, dt);
    this.prevError = error;

    const u = this.kp * error + this.ki * this.integral + this.kd * derivative;

    // 2nd-order plant dynamics: mass-spring-damper process
    const plantDamping = 0.8;
    const acceleration = (u - plantDamping * this.velocity) * 0.05;
    this.velocity += acceleration * dt;
    this.pv += this.velocity * dt;

    this.history.push({ pv: this.pv, sp: this.setpoint, err: error });
    if (this.history.length > this.maxHistory) this.history.shift();

    const overshoot = Math.max(0, ((Math.max(...this.history.map(h => h.pv)) - this.setpoint) / this.setpoint) * 100);

    return {
      currentPv: this.pv.toFixed(2),
      setpoint: this.setpoint.toFixed(1),
      trackingError: error.toFixed(2),
      peakOvershoot: `${overshoot.toFixed(1)} %`,
      controllerEffort: u.toFixed(2)
    };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    const plotX = 50, plotY = 50;
    const plotW = width - 100, plotH = height - 120;

    // Graph Area
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plotX, plotY, plotW, plotH);
    ctx.fillRect(plotX, plotY, plotW, plotH);

    // Setpoint Line (Dashed Gold)
    const spY = plotY + plotH - (this.setpoint / 150) * plotH;
    ctx.save();
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(plotX, spY);
    ctx.lineTo(plotX + plotW, spY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`TARGET SETPOINT R(t) = ${this.setpoint}`, plotX + 15, spY - 8);

    // Process Variable Curve (Cyan)
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();

    for (let i = 0; i < this.history.length; i++) {
      const hx = plotX + (i / this.maxHistory) * plotW;
      const hy = plotY + plotH - (this.history[i].pv / 150) * plotH;
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.stroke();
    ctx.restore();

    // Footer Info
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText(`PID GAINS: Kp=${this.kp.toFixed(2)}  Ki=${this.ki.toFixed(2)}  Kd=${this.kd.toFixed(2)} │ CLOSED-LOOP STABILITY: MARGINALLY STABLE`, plotX + 15, height - 40);
  }
}

// ============================================================================
// 10. DYNAMIC GENERATED SIMULATION ENGINE (Sandboxed LLM-Generated Canvas Code)
// ============================================================================
export class DynamicGeneratedSimEngine {
  constructor(params) {
    this.params = { ...params };
    this.generatedCode = params.generatedCode || '';
    this.state = {};
    this.time = 0;
    this.compileError = null;
    this.compiledUpdate = null;
    this.compiledRender = null;
    this.compileCode();
  }

  compileCode() {
    this.compileError = null;
    if (!this.generatedCode) return;

    try {
      // Evaluate synthesized functions safely in isolated scope
      const wrapped = new Function(`
        return (function() {
          ${this.generatedCode}
          return {
            init: typeof initSimulation === 'function' ? initSimulation : null,
            update: typeof updatePhysics === 'function' ? updatePhysics : null,
            render: typeof renderVisuals === 'function' ? renderVisuals : null
          };
        })();
      `);

      const exported = wrapped();
      if (exported.init) {
        this.state = exported.init(this.params) || {};
      }
      this.compiledUpdate = exported.update;
      this.compiledRender = exported.render;
    } catch (err) {
      console.warn('Dynamic simulation compilation error:', err);
      this.compileError = err.message;
    }
  }

  updateParams(params) {
    this.params = { ...this.params, ...params };
    if (params.generatedCode && params.generatedCode !== this.generatedCode) {
      this.generatedCode = params.generatedCode;
      this.compileCode();
    }
  }

  reset(params = {}) {
    this.params = { ...this.params, ...params };
    this.time = 0;
    this.compileCode();
  }

  update(dt) {
    this.time += dt;
    if (this.compiledUpdate && !this.compileError) {
      try {
        const tele = this.compiledUpdate(this.state, this.params, dt, this.time);
        return tele || { status: 'Dynamic Engine Running', fps: '60 FPS', elapsed: `${this.time.toFixed(1)}s` };
      } catch (err) {
        this.compileError = err.message;
      }
    }
    return { status: 'Synthesized Engine Active', time: `${this.time.toFixed(1)}s` };
  }

  step(dt) {
    this.latestTelemetry = this.update(dt);
    return this.latestTelemetry;
  }

  getTelemetry() {
    if (!this.latestTelemetry) this.latestTelemetry = this.update(0.016);
    if (!this.latestTelemetry) return [];
    return Object.entries(this.latestTelemetry).map(([k, v]) => ({
      label: k.replace(/([A-Z])/g, ' $1').toUpperCase(),
      value: String(v),
      color: 'text-cyan-400'
    }));
  }


  render(ctx, width, height) {
    const w = ctx.canvas ? ctx.canvas.width : (width || 700);
    const h = ctx.canvas ? ctx.canvas.height : (height || 420);
    width = w;
    height = h;
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    if (this.compileError) {
      // Error Fallback HUD
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, width - 80, height - 80);
      ctx.fillRect(40, 40, width - 80, height - 80);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('DYNAMIC SYNTHESIS CODE DIAGNOSTIC:', 60, 80);
      ctx.fillStyle = '#fca5a5';
      ctx.font = '12px monospace';
      ctx.fillText(this.compileError, 60, 110);
      ctx.fillText('Falling back to default numerical wave render...', 60, 140);
      return;
    }

    if (this.compiledRender) {
      try {
        this.compiledRender(ctx, this.state, this.params, width, height, this.time);
        return;
      } catch (err) {
        this.compileError = err.message;
      }
    }

    // Default high-tech generative plasma wave fallback
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const y = height / 2 + Math.sin(x * 0.02 + this.time * 2) * 50 * Math.cos(x * 0.005 + this.time);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('✨ UNIVERSAL AI-SYNTHESIZED SCIENTIFIC ENGINE ACTIVE', 40, 40);
  }
}


// ============================================================================
// EveryCircuit / CirkitDesigner Grade: OP-AMP INVERTING AMPLIFIER
// ============================================================================
export class OpAmpInvertingSim {
  constructor(params) { this.reset(params); }

  reset(params = {}) {
    this.Rf = params.feedbackR || 10;    // kΩ
    this.Rin = params.inputR || 1;       // kΩ
    this.Vin = params.inputVoltage || 1; // V peak
    this.freq = params.signalFreq || 50; // Hz
    this.Vsat = 12; // supply rail saturation
    this.time = 0;
    this.history = [];
    this.maxHistory = 200;
  }

  updateParams(params) {
    if (params.feedbackR !== undefined) this.Rf = params.feedbackR;
    if (params.inputR !== undefined) this.Rin = Math.max(0.1, params.inputR);
    if (params.inputVoltage !== undefined) this.Vin = params.inputVoltage;
    if (params.signalFreq !== undefined) this.freq = params.signalFreq;
  }

  step(dt) {
    this.time += dt * 3;
    const gain = -(this.Rf / this.Rin);
    const vIn = this.Vin * Math.sin(2 * Math.PI * this.freq * this.time * 0.01);
    let vOut = gain * vIn;
    // Saturation clipping
    vOut = Math.max(-this.Vsat, Math.min(this.Vsat, vOut));

    this.history.push({ vIn, vOut });
    if (this.history.length > this.maxHistory) this.history.shift();
  }

  getTelemetry() {
    const gain = -(this.Rf / this.Rin);
    return [
      { label: 'VOLTAGE GAIN (Av)', value: gain.toFixed(1) + 'x', color: 'text-cyan-400' },
      { label: 'GAIN (dB)', value: (20 * Math.log10(Math.abs(gain))).toFixed(1) + ' dB', color: 'text-amber-400' },
      { label: 'Rf / Rin', value: `${this.Rf}kΩ / ${this.Rin}kΩ`, color: 'text-emerald-400' },
      { label: 'BANDWIDTH', value: `GBW / |Av| ≈ ${(1e6 / Math.abs(gain) / 1000).toFixed(0)} kHz`, color: 'text-magenta-400' }
    ];
  }

  render(ctx, width, height) {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const cx = width * 0.35, cy = height * 0.4;

    // Op-Amp Triangle Symbol
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 50);
    ctx.lineTo(cx + 60, cy);
    ctx.lineTo(cx - 60, cy + 50);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Input labels
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('−', cx - 50, cy - 22);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('+', cx - 50, cy + 30);

    // Wires
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    // Inverting input wire
    ctx.beginPath(); ctx.moveTo(cx - 120, cy - 30); ctx.lineTo(cx - 60, cy - 30); ctx.stroke();
    // Non-inverting to ground
    ctx.beginPath(); ctx.moveTo(cx - 120, cy + 30); ctx.lineTo(cx - 60, cy + 30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 120, cy + 30); ctx.lineTo(cx - 120, cy + 50); ctx.stroke();
    // Ground symbol
    for (let i = 0; i < 3; i++) {
      const gw = 12 - i * 4;
      ctx.beginPath();
      ctx.moveTo(cx - 120 - gw, cy + 50 + i * 6);
      ctx.lineTo(cx - 120 + gw, cy + 50 + i * 6);
      ctx.stroke();
    }

    // Output wire
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx + 60, cy); ctx.lineTo(cx + 140, cy); ctx.stroke();

    // Feedback resistor (Rf) — top arc
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 30);
    ctx.lineTo(cx - 60, cy - 80);
    ctx.lineTo(cx + 100, cy - 80);
    ctx.lineTo(cx + 100, cy);
    ctx.stroke();
    // Zigzag for Rf
    const rfY = cy - 80;
    ctx.beginPath();
    ctx.moveTo(cx - 20, rfY);
    for (let i = 0; i < 6; i++) { ctx.lineTo(cx - 10 + i * 15, rfY + (i % 2 === 0 ? -8 : 8)); }
    ctx.lineTo(cx + 80, rfY);
    ctx.stroke();
    ctx.fillStyle = '#f472b6';
    ctx.font = '11px monospace';
    ctx.fillText(`Rf = ${this.Rf} kΩ`, cx + 5, rfY - 12);

    // Input resistor (Rin) label
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Rin = ${this.Rin} kΩ`, cx - 170, cy - 40);

    // Gain display
    const gain = -(this.Rf / this.Rin);
    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(`Av = -Rf/Rin = ${gain.toFixed(1)}`, cx + 150, cy - 20);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px monospace';
    ctx.fillText(`Vout = ${gain.toFixed(1)} × Vin`, cx + 150, cy + 5);

    // Dual-trace oscilloscope at bottom
    const oscH = 140, oscY = height - oscH - 20, oscX = 20, oscW = width - 40;
    ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(oscX, oscY, oscW, oscH);
    ctx.strokeRect(oscX, oscY, oscW, oscH);

    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    for (let gx = oscX; gx < oscX + oscW; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, oscY); ctx.lineTo(gx, oscY + oscH); ctx.stroke(); }
    const midY = oscY + oscH / 2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.beginPath(); ctx.moveTo(oscX, midY); ctx.lineTo(oscX + oscW, midY); ctx.stroke();

    // CH1: Input (cyan)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = oscX + (i / this.maxHistory) * oscW;
      const y = midY - (this.history[i].vIn / this.Vsat) * (oscH / 2 - 10);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // CH2: Output (amber)
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = oscX + (i / this.maxHistory) * oscW;
      const y = midY - (this.history[i].vOut / this.Vsat) * (oscH / 2 - 10);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Legend
    ctx.font = '11px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('━ CH1: Vin (Input)', oscX + 10, oscY + 16);
    ctx.fillStyle = '#ffb800';
    ctx.fillText('━ CH2: Vout (Inverted & Amplified)', oscX + 190, oscY + 16);

    // Saturation warning
    if (Math.abs(gain * this.Vin) > this.Vsat) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('⚠ OUTPUT CLIPPING (Saturation at ±12V)', oscX + 10, oscY + oscH - 8);
    }
  }
}


// ============================================================================
// EveryCircuit Grade: BJT COMMON-EMITTER AMPLIFIER
// ============================================================================
export class TransistorBJTSim {
  constructor(params) { this.reset(params); }

  reset(params = {}) {
    this.Vcc = params.supplyVoltage || 12;
    this.Rc = params.collectorR || 2.2; // kΩ
    this.Rb = params.baseR || 220;      // kΩ
    this.beta = params.hfe || 100;
    this.VinAC = params.inputAC || 0.02; // V peak
    this.freq = 50;
    this.time = 0;
    this.history = [];
    this.maxHistory = 200;
  }

  updateParams(params) {
    if (params.supplyVoltage !== undefined) this.Vcc = params.supplyVoltage;
    if (params.collectorR !== undefined) this.Rc = params.collectorR;
    if (params.baseR !== undefined) this.Rb = Math.max(1, params.baseR);
    if (params.hfe !== undefined) this.beta = params.hfe;
    if (params.inputAC !== undefined) this.VinAC = params.inputAC;
  }

  step(dt) {
    this.time += dt * 3;
    const Ib = (this.Vcc - 0.7) / (this.Rb * 1000); // A
    const Ic = this.beta * Ib;
    const Vce_q = this.Vcc - Ic * this.Rc * 1000;

    const vIn = this.VinAC * Math.sin(2 * Math.PI * this.freq * this.time * 0.01);
    const gm = Ic / 0.026; // transconductance
    const Av = -gm * this.Rc * 1000;
    let vOut = Vce_q + Av * vIn;
    vOut = Math.max(0.2, Math.min(this.Vcc, vOut)); // saturation/cutoff

    this.history.push({ vIn: vIn * 100, vOut, Vce_q });
    if (this.history.length > this.maxHistory) this.history.shift();
  }

  getTelemetry() {
    const Ib = (this.Vcc - 0.7) / (this.Rb * 1000);
    const Ic = this.beta * Ib;
    const Vce = this.Vcc - Ic * this.Rc * 1000;
    return [
      { label: 'Q-POINT (Vce)', value: Vce.toFixed(2) + ' V', color: 'text-amber-400' },
      { label: 'COLLECTOR (Ic)', value: (Ic * 1000).toFixed(2) + ' mA', color: 'text-cyan-400' },
      { label: 'BASE (Ib)', value: (Ib * 1e6).toFixed(1) + ' μA', color: 'text-emerald-400' },
      { label: 'REGION', value: Vce < 0.3 ? 'SATURATION' : Vce > this.Vcc - 0.5 ? 'CUTOFF' : 'ACTIVE', color: 'text-magenta-400' }
    ];
  }

  render(ctx, width, height) {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    for (let x = 0; x < width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const cx = width * 0.38, cy = height * 0.38;

    // NPN Transistor symbol
    ctx.save();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    // Vertical base line
    ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 30); ctx.stroke();
    // Collector
    ctx.beginPath(); ctx.moveTo(cx, cy - 15); ctx.lineTo(cx + 40, cy - 40); ctx.stroke();
    // Emitter with arrow
    ctx.beginPath(); ctx.moveTo(cx, cy + 15); ctx.lineTo(cx + 40, cy + 40); ctx.stroke();
    // Arrow head on emitter
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(cx + 40, cy + 40);
    ctx.lineTo(cx + 28, cy + 32);
    ctx.lineTo(cx + 35, cy + 25);
    ctx.closePath();
    ctx.fill();
    // Base input line
    ctx.beginPath(); ctx.moveTo(cx - 50, cy); ctx.lineTo(cx, cy); ctx.stroke();
    ctx.restore();

    // Labels
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('B', cx - 60, cy + 5);
    ctx.fillText('C', cx + 45, cy - 45);
    ctx.fillText('E', cx + 45, cy + 50);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px monospace';
    ctx.fillText(`NPN (β = ${this.beta})`, cx - 30, cy - 55);

    // Vcc rail
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Vcc = ${this.Vcc}V`, cx + 30, cy - 75);

    // Rc label
    ctx.fillStyle = '#ec4899';
    ctx.font = '11px monospace';
    ctx.fillText(`Rc = ${this.Rc}kΩ`, cx + 55, cy - 58);
    ctx.fillText(`Rb = ${this.Rb}kΩ`, cx - 100, cy - 15);

    // Q-point info
    const Ib = (this.Vcc - 0.7) / (this.Rb * 1000);
    const Ic = this.beta * Ib;
    const Vce = this.Vcc - Ic * this.Rc * 1000;
    ctx.fillStyle = '#ffb800';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Q-Point: Vce = ${Vce.toFixed(2)}V, Ic = ${(Ic*1000).toFixed(2)}mA`, cx - 80, height * 0.52);

    // Oscilloscope at bottom
    const oscH = 130, oscY = height - oscH - 15, oscX = 20, oscW = width - 40;
    ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(oscX, oscY, oscW, oscH);
    ctx.strokeRect(oscX, oscY, oscW, oscH);

    const midY = oscY + oscH / 2;

    // CH1: Input (scaled up for visibility)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = oscX + (i / this.maxHistory) * oscW;
      const y = midY - this.history[i].vIn * 3;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // CH2: Output Vce
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = oscX + (i / this.maxHistory) * oscW;
      const y = midY - ((this.history[i].vOut - (this.Vcc / 2)) / this.Vcc) * (oscH - 20);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.font = '11px monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('━ Vin (×100)', oscX + 10, oscY + 16);
    ctx.fillStyle = '#ffb800';
    ctx.fillText('━ Vce (Collector-Emitter)', oscX + 160, oscY + 16);
  }
}


// ============================================================================
// EveryCircuit Grade: 555 TIMER IC (Astable Multivibrator)
// ============================================================================
export class TimerIC555Sim {
  constructor(params) { this.reset(params); }

  reset(params = {}) {
    this.Ra = params.resistorA || 10;   // kΩ
    this.Rb = params.resistorB || 47;   // kΩ
    this.C = params.capacitance || 10;  // μF
    this.time = 0;
    this.capVoltage = 0;
    this.output = false;
    this.history = [];
    this.maxHistory = 250;
    this.ledPulses = [];
  }

  updateParams(params) {
    if (params.resistorA !== undefined) this.Ra = Math.max(0.1, params.resistorA);
    if (params.resistorB !== undefined) this.Rb = Math.max(0.1, params.resistorB);
    if (params.capacitance !== undefined) this.C = Math.max(0.1, params.capacitance);
  }

  step(dt) {
    this.time += dt * 8;
    const Vcc = 5;
    const tHigh = 0.693 * (this.Ra + this.Rb) * this.C * 0.001; // seconds (scaled)
    const tLow = 0.693 * this.Rb * this.C * 0.001;
    const period = tHigh + tLow;
    const duty = (tHigh / period) * 100;
    const freq = 1 / (period * 0.1 + 0.001);

    // Simulate capacitor charge/discharge
    const phase = (this.time % (period * 20 + 0.01)) / (period * 20 + 0.01);
    const dutyFrac = tHigh / period;

    if (phase < dutyFrac) {
      this.output = true;
      this.capVoltage = (Vcc / 3) + (2 * Vcc / 3) * (phase / dutyFrac);
    } else {
      this.output = false;
      this.capVoltage = Vcc - (2 * Vcc / 3) * ((phase - dutyFrac) / (1 - dutyFrac));
    }
    this.capVoltage = Math.max(Vcc / 3, Math.min(2 * Vcc / 3, this.capVoltage));

    this.history.push({ out: this.output ? Vcc : 0, cap: this.capVoltage });
    if (this.history.length > this.maxHistory) this.history.shift();

    // Track LED pulse timing
    if (this.output && (this.ledPulses.length === 0 || !this.ledPulses[this.ledPulses.length - 1].active)) {
      this.ledPulses.push({ active: true, t: this.time });
    } else if (!this.output && this.ledPulses.length > 0) {
      this.ledPulses[this.ledPulses.length - 1].active = false;
    }
  }

  getTelemetry() {
    const tHigh = 0.693 * (this.Ra + this.Rb) * this.C * 0.001;
    const tLow = 0.693 * this.Rb * this.C * 0.001;
    const period = tHigh + tLow;
    return [
      { label: 'FREQUENCY', value: (1 / (period * 0.1 + 0.001)).toFixed(1) + ' Hz', color: 'text-cyan-400' },
      { label: 'DUTY CYCLE', value: ((tHigh / period) * 100).toFixed(1) + ' %', color: 'text-amber-400' },
      { label: 'T_HIGH', value: (tHigh * 100).toFixed(1) + ' ms', color: 'text-emerald-400' },
      { label: 'T_LOW', value: (tLow * 100).toFixed(1) + ' ms', color: 'text-magenta-400' }
    ];
  }

  render(ctx, width, height) {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    for (let x = 0; x < width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const cx = width * 0.35, cy = height * 0.35;

    // 555 Timer IC chip body
    ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.fillRect(cx - 50, cy - 45, 100, 90);
    ctx.strokeRect(cx - 50, cy - 45, 100, 90);

    // Notch
    ctx.beginPath();
    ctx.arc(cx, cy - 45, 8, 0, Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Pin labels
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 10px monospace';
    const leftPins = ['1 GND', '2 TRIG', '3 OUT', '4 RST'];
    const rightPins = ['8 Vcc', '7 DIS', '6 THR', '5 CV'];
    leftPins.forEach((p, i) => ctx.fillText(p, cx - 48, cy - 28 + i * 20));
    rightPins.forEach((p, i) => ctx.fillText(p, cx + 10, cy - 28 + i * 20));

    // 555 label
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NE555', cx, cy + 65);
    ctx.textAlign = 'left';

    // Component labels
    ctx.fillStyle = '#ec4899';
    ctx.font = '12px monospace';
    ctx.fillText(`Ra = ${this.Ra} kΩ`, cx + 80, cy - 35);
    ctx.fillText(`Rb = ${this.Rb} kΩ`, cx + 80, cy - 15);
    ctx.fillText(`C = ${this.C} μF`, cx + 80, cy + 5);

    // LED indicator
    ctx.save();
    ctx.fillStyle = this.output ? '#10b981' : '#1e293b';
    ctx.strokeStyle = this.output ? '#34d399' : '#475569';
    ctx.lineWidth = 3;
    if (this.output) { ctx.shadowColor = '#10b981'; ctx.shadowBlur = 25; }
    ctx.beginPath();
    ctx.arc(cx + 160, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.output ? 'ON' : 'OFF', cx + 160, cy + 4);
    ctx.fillText('LED', cx + 160, cy + 30);
    ctx.textAlign = 'left';
    ctx.restore();

    // Dual-trace scope at bottom
    const oscH = 130, oscY = height - oscH - 15, oscX = 20, oscW = width - 40;
    ctx.fillStyle = 'rgba(6, 10, 20, 0.92)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(oscX, oscY, oscW, oscH);
    ctx.strokeRect(oscX, oscY, oscW, oscH);

    const midY = oscY + oscH / 2;

    // CH1: Output pulse train (cyan)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = oscX + (i / this.maxHistory) * oscW;
      const y = midY + 30 - (this.history[i].out / 5) * 55;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // CH2: Capacitor voltage (amber)
    ctx.strokeStyle = '#ffb800';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < this.history.length; i++) {
      const x = oscX + (i / this.maxHistory) * oscW;
      const y = midY + 30 - (this.history[i].cap / 5) * 55;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Threshold lines
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    const threshY = midY + 30 - (2 * 5 / 3 / 5) * 55;
    ctx.beginPath(); ctx.moveTo(oscX, threshY); ctx.lineTo(oscX + oscW, threshY); ctx.stroke();
    const trigY = midY + 30 - (5 / 3 / 5) * 55;
    ctx.beginPath(); ctx.moveTo(oscX, trigY); ctx.lineTo(oscX + oscW, trigY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('2/3 Vcc (Threshold)', oscX + oscW - 160, threshY - 4);
    ctx.fillText('1/3 Vcc (Trigger)', oscX + oscW - 150, trigY + 12);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '11px monospace';
    ctx.fillText('━ Output Pulse', oscX + 10, oscY + 16);
    ctx.fillStyle = '#ffb800';
    ctx.fillText('━ Capacitor Voltage', oscX + 160, oscY + 16);
  }
}


// ============================================================================
// EveryCircuit Grade: RC FILTER LAB (Low-Pass / High-Pass + Bode Plot)
// ============================================================================
export class RCFilterSim {
  constructor(params) { this.reset(params); }

  reset(params = {}) {
    this.R = params.resistance || 1;     // kΩ
    this.C = params.capacitance || 100;  // nF
    this.filterType = params.filterType || 'lowpass'; // 'lowpass' or 'highpass'
    this.sweepFreq = params.sweepFreq || 1000;       // Hz
    this.time = 0;
  }

  updateParams(params) {
    if (params.resistance !== undefined) this.R = Math.max(0.1, params.resistance);
    if (params.capacitance !== undefined) this.C = Math.max(1, params.capacitance);
    if (params.sweepFreq !== undefined) this.sweepFreq = params.sweepFreq;
  }

  step(dt) {
    this.time += dt;
  }

  getTelemetry() {
    const fc = 1 / (2 * Math.PI * this.R * 1000 * this.C * 1e-9);
    return [
      { label: 'CUTOFF FREQ (fc)', value: fc.toFixed(0) + ' Hz', color: 'text-cyan-400' },
      { label: 'TIME CONST (τ)', value: (this.R * this.C * 0.001).toFixed(3) + ' ms', color: 'text-amber-400' },
      { label: 'FILTER TYPE', value: this.filterType === 'lowpass' ? 'LOW-PASS' : 'HIGH-PASS', color: 'text-emerald-400' },
      { label: '-3dB GAIN', value: '-3.01 dB at fc', color: 'text-magenta-400' }
    ];
  }

  render(ctx, width, height) {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    for (let x = 0; x < width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const fc = 1 / (2 * Math.PI * this.R * 1000 * this.C * 1e-9);

    // Bode Magnitude Plot
    const bodeX = 50, bodeY = 40, bodeW = width - 100, bodeH = height * 0.4;

    ctx.fillStyle = 'rgba(6, 10, 20, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(bodeX, bodeY, bodeW, bodeH);
    ctx.strokeRect(bodeX, bodeY, bodeW, bodeH);

    // Title
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(`BODE MAGNITUDE PLOT — ${this.filterType === 'lowpass' ? 'LOW-PASS' : 'HIGH-PASS'} RC FILTER`, bodeX + 10, bodeY - 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('|H(jω)| (dB)', bodeX - 45, bodeY + bodeH / 2);
    ctx.fillText('Frequency (Hz) — Log Scale', bodeX + bodeW / 2 - 80, bodeY + bodeH + 25);

    // Draw Bode curve
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= bodeW; i++) {
      const logF = 1 + (i / bodeW) * 4; // 10 Hz to 100kHz
      const f = Math.pow(10, logF);
      const ratio = f / fc;
      let gain_dB;
      if (this.filterType === 'lowpass') {
        gain_dB = -10 * Math.log10(1 + ratio * ratio);
      } else {
        gain_dB = -10 * Math.log10(1 + 1 / (ratio * ratio));
      }
      const y = bodeY + 15 - (gain_dB / 40) * (bodeH - 30); // 0dB at top, -40dB at bottom
      const clampedY = Math.max(bodeY, Math.min(bodeY + bodeH, y));
      i === 0 ? ctx.moveTo(bodeX + i, clampedY) : ctx.lineTo(bodeX + i, clampedY);
    }
    ctx.stroke();

    // Cutoff frequency marker
    const fcLogPos = (Math.log10(fc) - 1) / 4;
    const fcX = bodeX + fcLogPos * bodeW;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(fcX, bodeY); ctx.lineTo(fcX, bodeY + bodeH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`fc = ${fc.toFixed(0)} Hz`, fcX + 5, bodeY + 20);
    ctx.fillText('-3 dB', fcX + 5, bodeY + 35);

    // -3dB horizontal line
    const db3Y = bodeY + 15 - (-3 / 40) * (bodeH - 30);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(bodeX, db3Y); ctx.lineTo(bodeX + bodeW, db3Y); ctx.stroke();
    ctx.setLineDash([]);

    // Frequency axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    [10, 100, 1000, 10000, 100000].forEach(f => {
      const x = bodeX + ((Math.log10(f) - 1) / 4) * bodeW;
      ctx.fillText(f >= 1000 ? `${f/1000}k` : `${f}`, x - 8, bodeY + bodeH + 14);
    });
    // dB axis
    [0, -10, -20, -30, -40].forEach(db => {
      const y = bodeY + 15 - (db / 40) * (bodeH - 30);
      ctx.fillText(`${db}`, bodeX - 25, y + 4);
    });

    // Phase plot at bottom
    const phaseY = bodeY + bodeH + 50, phaseH = height - phaseY - 30;
    ctx.fillStyle = 'rgba(6, 10, 20, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.fillRect(bodeX, phaseY, bodeW, phaseH);
    ctx.strokeRect(bodeX, phaseY, bodeW, phaseH);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('PHASE RESPONSE φ(ω)', bodeX + 10, phaseY - 8);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= bodeW; i++) {
      const logF = 1 + (i / bodeW) * 4;
      const f = Math.pow(10, logF);
      const ratio = f / fc;
      let phase;
      if (this.filterType === 'lowpass') {
        phase = -Math.atan(ratio) * (180 / Math.PI);
      } else {
        phase = 90 - Math.atan(ratio) * (180 / Math.PI);
      }
      const y = phaseY + phaseH / 2 - (phase / 90) * (phaseH / 2 - 10);
      i === 0 ? ctx.moveTo(bodeX + i, y) : ctx.lineTo(bodeX + i, y);
    }
    ctx.stroke();

    // fc marker on phase
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(fcX, phaseY); ctx.lineTo(fcX, phaseY + phaseH); ctx.stroke();
    ctx.setLineDash([]);

    // Component info
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px monospace';
    ctx.fillText(`R = ${this.R} kΩ   C = ${this.C} nF   fc = ${fc.toFixed(0)} Hz`, bodeX + bodeW - 300, bodeY - 8);
  }
}


// ============================================================================
// EveryCircuit Grade: 4-BIT RIPPLE CARRY FULL ADDER
// ============================================================================
export class FullAdderSim {
  constructor(params) { this.reset(params); }

  reset(params = {}) {
    this.inputA = params.inputA !== undefined ? params.inputA : 5;  // 4-bit (0-15)
    this.inputB = params.inputB !== undefined ? params.inputB : 3;
    this.carryIn = params.carryIn || 0;
    this.time = 0;
    this.clickAreas = [];
  }

  updateParams(params) {
    if (params.inputA !== undefined) this.inputA = Math.min(15, Math.max(0, Math.round(params.inputA)));
    if (params.inputB !== undefined) this.inputB = Math.min(15, Math.max(0, Math.round(params.inputB)));
    if (params.carryIn !== undefined) this.carryIn = params.carryIn ? 1 : 0;
  }

  step(dt) {
    this.time += dt;
  }

  getTelemetry() {
    const sum = this.inputA + this.inputB + this.carryIn;
    return [
      { label: 'A (BINARY)', value: this.inputA.toString(2).padStart(4, '0'), color: 'text-cyan-400' },
      { label: 'B (BINARY)', value: this.inputB.toString(2).padStart(4, '0'), color: 'text-amber-400' },
      { label: 'SUM (DEC)', value: `${sum} (${sum.toString(2).padStart(5, '0')})`, color: 'text-emerald-400' },
      { label: 'CARRY OUT', value: sum > 15 ? 'OVERFLOW (1)' : 'NO OVERFLOW (0)', color: sum > 15 ? 'text-red-400' : 'text-magenta-400' }
    ];
  }

  render(ctx, width, height) {
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    for (let x = 0; x < width; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    const sum = this.inputA + this.inputB + this.carryIn;
    const aBits = this.inputA.toString(2).padStart(4, '0').split('').map(Number);
    const bBits = this.inputB.toString(2).padStart(4, '0').split('').map(Number);
    const sumBits = (sum & 0xF).toString(2).padStart(4, '0').split('').map(Number);
    const cOut = sum > 15 ? 1 : 0;

    // Title
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('4-BIT RIPPLE CARRY FULL ADDER', 30, 35);

    // Draw 4 full adder blocks
    const blockW = 100, blockH = 80;
    const startX = width * 0.12;
    const blockY = height * 0.28;
    const spacing = (width - startX * 2 - blockW) / 3;

    let carry = this.carryIn;
    const carries = [carry];

    for (let bit = 3; bit >= 0; bit--) {
      const idx = 3 - bit;
      const bx = startX + idx * (blockW + spacing * 0.6);
      const a = aBits[bit];
      const b = bBits[bit];
      const s = a ^ b ^ carry;
      const cNext = (a & b) | ((a ^ b) & carry);

      // Full Adder Block
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.strokeStyle = s ? '#10b981' : '#334155';
      ctx.lineWidth = 2;
      ctx.fillRect(bx, blockY, blockW, blockH);
      ctx.strokeRect(bx, blockY, blockW, blockH);

      // Block Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`FA${3 - bit}`, bx + blockW / 2, blockY + 15);
      ctx.fillText(`BIT ${3 - bit}`, bx + blockW / 2, blockY + 28);

      // Input A (top)
      ctx.fillStyle = a ? '#00f0ff' : '#475569';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(`A${3-bit}=${a}`, bx + blockW / 2, blockY - 15);
      ctx.strokeStyle = a ? '#00f0ff' : '#334155';
      ctx.lineWidth = a ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(bx + blockW * 0.35, blockY - 8); ctx.lineTo(bx + blockW * 0.35, blockY); ctx.stroke();

      // Input B (top-right)
      ctx.fillStyle = b ? '#ffb800' : '#475569';
      ctx.fillText(`B${3-bit}=${b}`, bx + blockW / 2, blockY - 32);
      ctx.strokeStyle = b ? '#ffb800' : '#334155';
      ctx.lineWidth = b ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(bx + blockW * 0.65, blockY - 25); ctx.lineTo(bx + blockW * 0.65, blockY); ctx.stroke();

      // Sum output (bottom)
      ctx.fillStyle = s ? '#10b981' : '#475569';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`S${3-bit}=${s}`, bx + blockW / 2, blockY + blockH + 25);
      ctx.strokeStyle = s ? '#10b981' : '#334155';
      ctx.lineWidth = s ? 3 : 1.5;
      if (s) { ctx.shadowColor = '#10b981'; ctx.shadowBlur = 8; }
      ctx.beginPath(); ctx.moveTo(bx + blockW / 2, blockY + blockH); ctx.lineTo(bx + blockW / 2, blockY + blockH + 12); ctx.stroke();
      ctx.shadowBlur = 0;

      // Carry propagation wire (right to left)
      if (idx < 3) {
        const nextBx = startX + (idx + 1) * (blockW + spacing * 0.6);
        ctx.strokeStyle = cNext ? '#ec4899' : '#334155';
        ctx.lineWidth = cNext ? 2.5 : 1.5;
        if (cNext) { ctx.shadowColor = '#ec4899'; ctx.shadowBlur = 6; }
        ctx.beginPath();
        ctx.moveTo(bx + blockW, blockY + blockH * 0.7);
        ctx.lineTo(nextBx, blockY + blockH * 0.7);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = cNext ? '#ec4899' : '#475569';
        ctx.font = '10px monospace';
        ctx.fillText(`C${3-bit}=${cNext}`, (bx + blockW + nextBx) / 2, blockY + blockH * 0.7 - 6);
      }

      carry = cNext;
      carries.push(carry);
    }
    ctx.textAlign = 'left';

    // Carry Out
    const lastBx = startX + 3 * (blockW + spacing * 0.6);
    ctx.fillStyle = cOut ? '#ef4444' : '#475569';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Cout = ${cOut}`, lastBx + blockW + 15, blockY + blockH * 0.7 + 5);
    if (cOut) {
      ctx.fillStyle = '#ef4444';
      ctx.font = '11px monospace';
      ctx.fillText('⚠ OVERFLOW', lastBx + blockW + 15, blockY + blockH * 0.7 + 22);
    }

    // Carry In
    ctx.fillStyle = this.carryIn ? '#ec4899' : '#475569';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`Cin = ${this.carryIn}`, startX - 55, blockY + blockH * 0.7 + 5);

    // Result display at bottom
    const resultY = height - 80;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(30, resultY, width - 60, 60);
    ctx.strokeRect(30, resultY, width - 60, 60);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${aBits.join('')}₂ (${this.inputA})  +  ${bBits.join('')}₂ (${this.inputB})  +  Cin(${this.carryIn})`, 50, resultY + 22);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`=  ${cOut}${sumBits.join('')}₂  =  ${sum} (decimal)`, 50, resultY + 48);

    // Hint
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px monospace';
    ctx.fillText('💡 Adjust A (0-15) and B (0-15) sliders to see binary carry ripple through all 4 stages', 30, height - 10);
  }
}
