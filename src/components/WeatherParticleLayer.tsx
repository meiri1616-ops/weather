import React, { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WeatherConditionType } from "../types";

interface WeatherParticleLayerProps {
  condition: WeatherConditionType;
  windSpeed?: number;
}

// Deterministic pseudo-random helper so particle layouts remain stable across re-renders
function seededValue(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * Generates a multi-point non-linear fluid turbulence path combining
 * directional advection with two-frequency harmonic vortex perturbations.
 */
function buildFluidOffsets(
  seed: number,
  steps: number,
  driftX: number,
  turbX: number,
  turbY: number
): { x: number[]; y: number[] } {
  const phase1 = seededValue(seed + 11) * Math.PI * 2;
  const phase2 = seededValue(seed + 37) * Math.PI * 2;
  const freq1 = 1.2 + seededValue(seed + 53) * 1.6;
  const freq2 = 2.6 + seededValue(seed + 79) * 2.1;

  const x: number[] = [];
  const y: number[] = [];

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    // Non-linear gust acceleration curve
    const advect = driftX * (0.72 * t + 0.28 * t * t);
    const waveX =
      Math.sin(t * Math.PI * freq1 + phase1) * turbX +
      Math.cos(t * Math.PI * freq2 + phase2) * (turbX * 0.45);
    const waveY =
      Math.sin(t * Math.PI * freq1 + phase2) * turbY +
      Math.cos(t * Math.PI * freq2 + phase1) * (turbY * 0.5);

    x.push(Number((s === 0 ? 0 : advect + waveX).toFixed(1)));
    y.push(Number((s === 0 ? 0 : waveY).toFixed(1)));
  }

  return { x, y };
}

export default function WeatherParticleLayer({
  condition,
  windSpeed = 10,
}: WeatherParticleLayerProps) {
  const prefersReducedMotion = useReducedMotion();

  // Normalized wind intensity (0.2 calm -> 1.4+ gale)
  const windIntensity = useMemo(() => {
    const baseFromSpeed = Math.min(1.45, Math.max(0.2, windSpeed / 26));
    if (condition === "Windy") return Math.max(0.85, baseFromSpeed);
    if (condition === "Thunderstorm") return Math.max(0.8, baseFromSpeed);
    return baseFromSpeed;
  }, [condition, windSpeed]);

  // Quantize into smooth buckets to avoid rebuilding particle arrays on tiny jitter
  const windBucket = Math.round(windIntensity * 10);

  const rainDrops = useMemo(() => {
    const w = windBucket / 10;
    const baseTilt = 6 + w * 18;
    const totalDrift = -28 - w * 95;
    const turbX = 8 + w * 26;

    return Array.from({ length: 74 }, (_, i) => {
      const flow = buildFluidOffsets(i + 1, 4, totalDrift, turbX, 0);
      const tiltJitter = (seededValue(i + 451) - 0.5) * (4 + w * 8);
      const tilt = baseTilt + tiltJitter;
      return {
        id: i,
        left: seededValue(i + 1) * 124 - 6,
        delay: seededValue(i + 101) * 1.4,
        duration: (0.58 + seededValue(i + 201) * 0.42) / (0.85 + w * 0.28),
        length: 18 + seededValue(i + 301) * 24,
        opacity: 0.22 + seededValue(i + 401) * 0.38,
        xPath: flow.x,
        rotatePath: [
          tilt,
          tilt + w * 4.5,
          tilt - w * 3.5,
          tilt + w * 3,
          tilt,
        ],
      };
    });
  }, [windBucket]);

  const stormDrops = useMemo(() => {
    const w = Math.max(0.8, windBucket / 10);
    const baseTilt = 14 + w * 16;
    const totalDrift = -75 - w * 125;
    const turbX = 18 + w * 38;

    return Array.from({ length: 108 }, (_, i) => {
      const flow = buildFluidOffsets(i + 501, 4, totalDrift, turbX, 0);
      const tilt = baseTilt + (seededValue(i + 951) - 0.5) * 10;
      return {
        id: i,
        left: seededValue(i + 501) * 136 - 8,
        delay: seededValue(i + 601) * 0.9,
        duration: (0.38 + seededValue(i + 701) * 0.28) / (0.9 + w * 0.22),
        length: 26 + seededValue(i + 801) * 32,
        opacity: 0.26 + seededValue(i + 901) * 0.44,
        xPath: flow.x,
        rotatePath: [tilt, tilt + 6, tilt - 5, tilt + 4, tilt],
      };
    });
  }, [windBucket]);

  const snowFlakes = useMemo(() => {
    const w = windBucket / 10;
    const lateralDrift = w > 0.45 ? 30 + w * 145 : 0;
    const turbX = 16 + w * 54;
    const turbY = 6 + w * 22;

    return Array.from({ length: 64 }, (_, i) => {
      const flow = buildFluidOffsets(i + 1001, 6, lateralDrift, turbX, turbY);
      const baseDuration = 5.4 + seededValue(i + 1301) * 4.8;
      // Non-linear vertical progression simulating thermal updrafts / wind eddies
      const yPath = [
        "-8vh",
        `${12 + flow.y[1] * 0.25}vh`,
        `${32 + flow.y[2] * 0.3}vh`,
        `${54 + flow.y[3] * 0.32}vh`,
        `${76 + flow.y[4] * 0.28}vh`,
        `${94 + flow.y[5] * 0.2}vh`,
        "108vh",
      ];
      return {
        id: i,
        left: seededValue(i + 1001) * (w > 0.5 ? 115 : 100) - (w > 0.5 ? 15 : 0),
        size: 3 + seededValue(i + 1101) * 5,
        delay: seededValue(i + 1201) * 5.5,
        duration: baseDuration / (0.85 + w * 0.35),
        opacity: 0.35 + seededValue(i + 1501) * 0.55,
        xPath: flow.x,
        yPath,
      };
    });
  }, [windBucket]);

  const sunOrbs = useMemo(() => {
    const w = windBucket / 10;
    return Array.from({ length: 18 }, (_, i) => {
      const flow = buildFluidOffsets(
        i + 1601,
        4,
        w * 28,
        10 + w * 22,
        14 + w * 12
      );
      return {
        id: i,
        left: seededValue(i + 1601) * 100,
        top: seededValue(i + 1701) * 85,
        size: 8 + seededValue(i + 1801) * 26,
        delay: seededValue(i + 1901) * 4,
        duration: (5 + seededValue(i + 2001) * 5) / (0.85 + w * 0.25),
        opacity: 0.14 + seededValue(i + 2101) * 0.26,
        xPath: [...flow.x, 0],
        yPath: [0, -18 - w * 10, -8 + flow.y[2], -26 - w * 8, 0],
      };
    });
  }, [windBucket]);

  const windStreaks = useMemo(() => {
    const w = Math.max(0.75, windBucket / 10);
    return Array.from({ length: 24 }, (_, i) => {
      const amp = 14 + seededValue(i + 2251) * (24 + w * 24);
      const phase = seededValue(i + 2351) * Math.PI * 2;
      const yWave = [
        0,
        Math.round(Math.sin(phase + 0.8) * amp),
        Math.round(Math.sin(phase + 2.3) * amp * 1.15),
        Math.round(Math.sin(phase + 3.9) * amp * 0.9),
        Math.round(Math.sin(phase + 5.2) * amp),
      ];
      const tiltAmp = 3 + w * 5;
      return {
        id: i,
        top: 6 + seededValue(i + 2201) * 86,
        width: 110 + seededValue(i + 2301) * 190,
        delay: seededValue(i + 2401) * 2.8,
        duration: (1.5 + seededValue(i + 2501) * 1.2) / (0.75 + w * 0.35),
        opacity: 0.16 + seededValue(i + 2601) * 0.28,
        yWave,
        rotateWave: [0, tiltAmp, -tiltAmp, tiltAmp * 0.6, 0],
      };
    });
  }, [windBucket]);

  const windEddies = useMemo(() => {
    const w = Math.max(0.75, windBucket / 10);
    return Array.from({ length: 14 }, (_, i) => {
      const amp = 22 + seededValue(i + 3101) * 34;
      const phase = seededValue(i + 3201) * Math.PI * 2;
      return {
        id: i,
        top: 10 + seededValue(i + 3301) * 80,
        size: 3 + seededValue(i + 3401) * 4,
        delay: seededValue(i + 3501) * 3,
        duration: (2.6 + seededValue(i + 3601) * 1.8) / (0.7 + w * 0.35),
        opacity: 0.35 + seededValue(i + 3701) * 0.4,
        yWave: [
          0,
          Math.round(Math.sin(phase + 1) * amp),
          Math.round(Math.cos(phase + 2.5) * -amp * 1.2),
          Math.round(Math.sin(phase + 4.2) * amp * 0.8),
          Math.round(Math.cos(phase + 5.6) * amp),
        ],
      };
    });
  }, [windBucket]);

  const fogBanks = useMemo(() => {
    const w = windBucket / 10;
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      top: i * 18 + 4,
      duration: (16 + i * 4) / (0.85 + w * 0.35),
      delay: i * 1.5,
      opacity: 0.16 + seededValue(i + 2701) * 0.14,
      driftX: 6 + w * 7,
      billowY: 8 + w * 14,
    }));
  }, [windBucket]);

  const cloudWisps = useMemo(() => {
    const w = windBucket / 10;
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      top: 4 + i * 13,
      width: 320 + seededValue(i + 2801) * 280,
      height: 90 + seededValue(i + 2901) * 70,
      duration: (20 + i * 5) / (0.8 + w * 0.45),
      delay: i * 2,
      opacity: 0.12 + seededValue(i + 3001) * 0.12,
      waveY: 12 + w * 22,
    }));
  }, [windBucket]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={condition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          {/* SUNNY: Warm radial glow + curling convection golden bokeh orbs */}
          {condition === "Sunny" && (
            <>
              <motion.div
                className="absolute -top-32 -right-24 w-[520px] h-[520px] rounded-full bg-radial from-amber-300/25 via-amber-400/10 to-transparent blur-3xl"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { scale: [1, 1.08, 1], opacity: [0.65, 0.9, 0.65] }
                }
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              {!prefersReducedMotion &&
                sunOrbs.map((orb) => (
                  <motion.div
                    key={orb.id}
                    className="absolute rounded-full bg-amber-200/60 blur-[1px] shadow-[0_0_16px_rgba(251,191,36,0.45)]"
                    style={{
                      left: `${orb.left}%`,
                      top: `${orb.top}%`,
                      width: orb.size,
                      height: orb.size,
                    }}
                    animate={{
                      y: orb.yPath,
                      x: orb.xPath,
                      opacity: [orb.opacity * 0.4, orb.opacity, orb.opacity * 0.4],
                    }}
                    transition={{
                      duration: orb.duration,
                      delay: orb.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
            </>
          )}

          {/* RAINY: Wind-perturbed curved rain sheets */}
          {condition === "Rainy" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-sky-950/15 via-transparent to-slate-950/20" />
              {!prefersReducedMotion &&
                rainDrops.map((drop) => (
                  <motion.div
                    key={`${drop.id}-${windBucket}`}
                    className="absolute top-0 w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-sky-200/75 to-sky-100"
                    style={{
                      left: `${drop.left}%`,
                      height: drop.length,
                      opacity: drop.opacity,
                    }}
                    initial={{ y: "-10vh", x: 0 }}
                    animate={{
                      y: ["-10vh", "22vh", "52vh", "82vh", "112vh"],
                      x: drop.xPath,
                      rotate: drop.rotatePath,
                    }}
                    transition={{
                      duration: drop.duration,
                      delay: drop.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
            </>
          )}

          {/* THUNDERSTORM: Turbulent gust-whipped downpour + lightning flash */}
          {condition === "Thunderstorm" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/25 via-transparent to-slate-950/35" />
              {!prefersReducedMotion && (
                <>
                  <motion.div
                    className="absolute inset-0 bg-indigo-100/20"
                    animate={{ opacity: [0, 0, 0.75, 0, 0.45, 0, 0] }}
                    transition={{
                      duration: 6.5,
                      times: [0, 0.74, 0.76, 0.78, 0.8, 0.83, 1],
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  {stormDrops.map((drop) => (
                    <motion.div
                      key={`${drop.id}-${windBucket}`}
                      className="absolute top-0 w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-indigo-100/80 to-cyan-100"
                      style={{
                        left: `${drop.left}%`,
                        height: drop.length,
                        opacity: drop.opacity,
                      }}
                      initial={{ y: "-12vh", x: 0 }}
                      animate={{
                        y: ["-12vh", "20vh", "50vh", "82vh", "114vh"],
                        x: drop.xPath,
                        rotate: drop.rotatePath,
                      }}
                      transition={{
                        duration: drop.duration,
                        delay: drop.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* SNOWY: Multi-harmonic turbulent snow eddies */}
          {condition === "Snowy" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-sky-100/10 via-transparent to-white/10" />
              {!prefersReducedMotion &&
                snowFlakes.map((flake) => (
                  <motion.div
                    key={`${flake.id}-${windBucket}`}
                    className="absolute top-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                    style={{
                      left: `${flake.left}%`,
                      width: flake.size,
                      height: flake.size,
                      opacity: flake.opacity,
                    }}
                    initial={{ y: "-8vh", x: 0 }}
                    animate={{
                      y: flake.yPath,
                      x: flake.xPath,
                      scale: [1, 1.12, 0.9, 1.08, 0.95, 1.05, 1],
                    }}
                    transition={{
                      duration: flake.duration,
                      delay: flake.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
            </>
          )}

          {/* WINDY: Non-linear undulating fluid airflow ribbons + swirling eddy motes */}
          {condition === "Windy" && (
            <>
              {!prefersReducedMotion && (
                <>
                  {windStreaks.map((streak) => (
                    <motion.div
                      key={`${streak.id}-${windBucket}`}
                      className="absolute h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-teal-100/75 to-transparent"
                      style={{
                        top: `${streak.top}%`,
                        width: streak.width,
                        opacity: streak.opacity,
                      }}
                      initial={{ x: "-25vw", y: 0 }}
                      animate={{
                        x: ["-25vw", "12vw", "48vw", "82vw", "118vw"],
                        y: streak.yWave,
                        rotate: streak.rotateWave,
                      }}
                      transition={{
                        duration: streak.duration,
                        delay: streak.delay,
                        repeat: Infinity,
                        ease: [0.35, 0.1, 0.65, 0.9],
                      }}
                    />
                  ))}
                  {windEddies.map((mote) => (
                    <motion.div
                      key={`eddy-${mote.id}-${windBucket}`}
                      className="absolute rounded-full bg-teal-100/70 blur-[0.5px]"
                      style={{
                        top: `${mote.top}%`,
                        width: mote.size,
                        height: mote.size,
                        opacity: mote.opacity,
                      }}
                      initial={{ x: "-10vw", y: 0 }}
                      animate={{
                        x: ["-10vw", "22vw", "50vw", "78vw", "112vw"],
                        y: mote.yWave,
                        rotate: [0, 180, 360, 540, 720],
                        scale: [0.8, 1.2, 0.75, 1.15, 0.8],
                      }}
                      transition={{
                        duration: mote.duration,
                        delay: mote.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* OVERCAST: Fluid billowing cloud veils */}
          {condition === "Overcast" && (
            <>
              <div className="absolute inset-0 bg-slate-900/15" />
              {!prefersReducedMotion &&
                cloudWisps.map((cloud) => (
                  <motion.div
                    key={`${cloud.id}-${windBucket}`}
                    className="absolute rounded-full bg-slate-200/20 blur-3xl"
                    style={{
                      top: `${cloud.top}%`,
                      width: cloud.width,
                      height: cloud.height,
                      opacity: cloud.opacity,
                    }}
                    initial={{ x: "-30vw", y: 0 }}
                    animate={{
                      x: ["-30vw", "10vw", "50vw", "85vw", "118vw"],
                      y: [0, -cloud.waveY, cloud.waveY * 0.7, -cloud.waveY * 0.5, 0],
                      scaleY: [1, 1.08, 0.94, 1.05, 1],
                    }}
                    transition={{
                      duration: cloud.duration,
                      delay: cloud.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
            </>
          )}

          {/* FOGGY: Layered breathing & curling atmospheric mist banks */}
          {condition === "Foggy" && (
            <>
              <div className="absolute inset-0 bg-slate-200/10 backdrop-blur-[1px]" />
              {!prefersReducedMotion &&
                fogBanks.map((bank) => (
                  <motion.div
                    key={`${bank.id}-${windBucket}`}
                    className="absolute -left-1/4 w-[150%] h-44 rounded-full bg-gradient-to-r from-transparent via-slate-100/35 to-transparent blur-3xl"
                    style={{ top: `${bank.top}%` }}
                    animate={{
                      x: [
                        `-${bank.driftX}%`,
                        `${bank.driftX * 0.6}%`,
                        `${bank.driftX}%`,
                        `-${bank.driftX * 0.5}%`,
                        `-${bank.driftX}%`,
                      ],
                      y: [0, -bank.billowY, bank.billowY * 0.8, -bank.billowY * 0.4, 0],
                      opacity: [
                        bank.opacity * 0.65,
                        bank.opacity,
                        bank.opacity * 0.8,
                        bank.opacity * 0.95,
                        bank.opacity * 0.65,
                      ],
                    }}
                    transition={{
                      duration: bank.duration,
                      delay: bank.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
