import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Sparkles, Activity } from 'lucide-react';

export default function DiffractionVisualizer({ onClose }) {
  const [slitWidthUm, setSlitWidthUm] = useState(25); // micrometers (um)
  const [wavelengthNm, setWavelengthNm] = useState(550); // nanometers (green light)
  const [distanceM, setDistanceM] = useState(1.0); // meters

  const canvasRef = useRef(null);

  // Physics calculation
  const lambdaM = wavelengthNm * 1e-9;
  const aM = slitWidthUm * 1e-6;
  const centralWidthMm = ((2 * lambdaM * distanceM) / aM) * 1000;

  // Draw diffraction pattern and intensity sinc-squared curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Simulated Optical Pattern (Top half)
    const patternHeight = 60;
    const imgData = ctx.createImageData(width, patternHeight);
    
    for (let x = 0; x < width; x++) {
      const screenX = (x - width / 2) * (0.05 / width); // screen range ±0.025m
      const sinTheta = screenX / Math.sqrt(screenX * screenX + distanceM * distanceM);
      const beta = (Math.PI * aM / lambdaM) * sinTheta;
      
      let intensity = 1.0;
      if (Math.abs(beta) > 1e-6) {
        intensity = Math.pow(Math.sin(beta) / beta, 2);
      }

      // Color mapping based on wavelength
      const r = wavelengthNm > 600 ? 255 : wavelengthNm > 500 ? (wavelengthNm - 500) * 2.5 : 0;
      const g = wavelengthNm >= 500 && wavelengthNm <= 600 ? 255 : wavelengthNm < 500 ? (wavelengthNm - 400) * 2.5 : (700 - wavelengthNm) * 2.5;
      const b = wavelengthNm < 500 ? 255 : 0;

      for (let y = 0; y < patternHeight; y++) {
        const index = (y * width + x) * 4;
        imgData.data[index] = Math.min(255, r * intensity);
        imgData.data[index + 1] = Math.min(255, g * intensity);
        imgData.data[index + 2] = Math.min(255, b * intensity);
        imgData.data[index + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 15);

    // Label on pattern
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('Optical Diffraction Fringe Pattern on Screen (Fraunhofer Pattern)', 10, 10);

    // 2. Draw Sinc-squared Intensity Curve (Bottom half)
    const curveTop = 90;
    const curveHeight = 110;
    
    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, curveTop + curveHeight);
    ctx.lineTo(width, curveTop + curveHeight);
    ctx.moveTo(width / 2, curveTop);
    ctx.lineTo(width / 2, curveTop + curveHeight);
    ctx.stroke();

    // Curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let x = 0; x < width; x++) {
      const screenX = (x - width / 2) * (0.05 / width);
      const sinTheta = screenX / Math.sqrt(screenX * screenX + distanceM * distanceM);
      const beta = (Math.PI * aM / lambdaM) * sinTheta;

      let intensity = 1.0;
      if (Math.abs(beta) > 1e-6) {
        intensity = Math.pow(Math.sin(beta) / beta, 2);
      }

      const y = curveTop + curveHeight - (intensity * curveHeight * 0.9);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Central Maxima Label
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Central Maximum (I_0)', width / 2 + 5, curveTop + 15);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('Minima: a·sin(θ) = ±mλ', width / 2 + 50, curveTop + curveHeight - 8);

  }, [slitWidthUm, wavelengthNm, distanceM]);

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-dark-700">
        <div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20">
            ENGINEERING OPTICS LAB
          </span>
          <h2 className="text-xl font-display font-extrabold text-white mt-1">
            Single-Slit Fraunhofer Diffraction Simulator
          </h2>
          <p className="text-xs text-slate-300">
            Observe the wave superposition envelope and see why widening the aperture narrows the central diffraction peak.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-dark-700 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Close Lab
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sliders (4 cols) */}
        <div className="md:col-span-4 bg-dark-900 rounded-xl p-4 border border-dark-700 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-white">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Interactive Optical Parameters</span>
          </div>

          {/* Slit Width Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Slit Width (a):</span>
              <span className="text-cyan-400 font-bold">{slitWidthUm} µm</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              value={slitWidthUm}
              onChange={(e) => setSlitWidthUm(Number(e.target.value))}
              className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Wavelength Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Wavelength (λ):</span>
              <span className="text-emerald-400 font-bold">{wavelengthNm} nm</span>
            </div>
            <input
              type="range"
              min="400"
              max="700"
              value={wavelengthNm}
              onChange={(e) => setWavelengthNm(Number(e.target.value))}
              className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

          {/* Screen Distance Slider */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Screen Distance (D):</span>
              <span className="text-amber-400 font-bold">{distanceM.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={distanceM}
              onChange={(e) => setDistanceM(Number(e.target.value))}
              className="w-full h-1.5 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Calculated Output Card */}
          <div className="p-3 rounded-lg bg-dark-800 border border-dark-600 text-xs font-mono space-y-1">
            <p className="text-slate-400 text-[10px]">Calculated Central Maximum Width:</p>
            <p className="text-lg font-extrabold text-cyan-300">
              2y = {centralWidthMm.toFixed(2)} mm
            </p>
            <p className="text-[10px] text-slate-500">Formula: 2y = (2·λ·D) / a</p>
          </div>
        </div>

        {/* Canvas Visualizer (8 cols) */}
        <div className="md:col-span-8 bg-dark-900 rounded-xl p-4 border border-dark-700 flex flex-col justify-between">
          <canvas
            ref={canvasRef}
            width={600}
            height={220}
            className="w-full h-[220px] rounded-lg bg-dark-950 border border-dark-800"
          />

          <div className="mt-3 p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>Pedagogical Takeaway:</strong> Notice that as you <em>increase</em> slit width <code>a</code>, the central maximum becomes <em>narrower and sharper</em>. This direct inverse relationship is why large telescope apertures overcome diffraction to provide sharper angular resolution (Rayleigh Criterion)!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
