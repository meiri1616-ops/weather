import React, { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WeatherConditionType } from "../types";

interface WeatherParticleLayerProps {
  condition: WeatherConditionType;
}

// Deterministic pseudo-random helper so particle layouts remain stable across re-renders
function seededValue(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export default function WeatherParticleLayer({ condition }: WeatherParticleLayerProps) {
  const prefersReducedMotion = useReducedMotion();

  const rainDrops = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => ({
        id: i,
        left: seededValue(i + 1) * 106 - 3,
        delay: seededValue(i + 101) * 1.4,
        duration: 0.55 + seededValue(i + 201) * 0.45,
        length: 18 + seededValue(i + 301) * 24,
        opacity: 0.2 + seededValue(i + 401) * 0.4,
      })),
    []
  );

  const stormDrops = useMemo(
    () =>
      Array.from({ length: 105 }, (_, i) => ({
        id: i,
        left: seededValue(i + 501) * 116 - 8,
        delay: seededValue(i + 601) * 0.9,
        duration: 0.36 + seededValue(i + 701) * 0.3,
        length: 26 + seededValue(i + 801) * 32,
        opacity: 0.25 + seededValue(i + 901) * 0.45,
      })),
    []
  );

  const snowFlakes = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        left: seededValue(i + 1001) * 100,
        size: 3 + seededValue(i + 1101) * 5,
        delay: seededValue(i + 1201) * 6,
        duration: 5.5 + seededValue(i + 1301) * 5,
        sway: 18 + seededValue(i + 1401) * 34,
        opacity: 0.35 + seededValue(i + 1501) * 0.55,
      })),
    []
  );

  const sunOrbs = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        left: seededValue(i + 1601) * 100,
        top: seededValue(i + 1701) * 85,
        size: 8 + seededValue(i + 1801) * 26,
        delay: seededValue(i + 1901) * 4,
        duration: 5 + seededValue(i + 2001) * 5,
        opacity: 0.14 + seededValue(i + 2101) * 0.26,
      })),
    []
  );

  const windStreaks = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        top: 6 + seededValue(i + 2201) * 88,
        width: 90 + seededValue(i + 2301) * 180,
        delay: seededValue(i + 2401) * 3.2,
        duration: 1.4 + seededValue(i + 2501) * 1.4,
        opacity: 0.14 + seededValue(i + 2601) * 0.26,
      })),
    []
  );

  const fogBanks = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        top: i * 18 + 4,
        duration: 16 + i * 4,
        delay: i * 1.5,
        opacity: 0.16 + seededValue(i + 2701) * 0.14,
      })),
    []
  );

  const cloudWisps = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        top: 4 + i * 13,
        width: 320 + seededValue(i + 2801) * 280,
        height: 90 + seededValue(i + 2901) * 70,
        duration: 20 + i * 5,
        delay: i * 2,
        opacity: 0.12 + seededValue(i + 3001) * 0.12,
      })),
    []
  );

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
          {/* SUNNY: Warm radial glow + drifting golden bokeh orbs */}
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
                      y: [0, -28, 0],
                      x: [0, 12, 0],
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

          {/* RAINY: Falling translucent raindrops + subtle cool atmospheric haze */}
          {condition === "Rainy" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-sky-950/15 via-transparent to-slate-950/20" />
              {!prefersReducedMotion &&
                rainDrops.map((drop) => (
                  <motion.div
                    key={drop.id}
                    className="absolute top-0 w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-sky-200/75 to-sky-100"
                    style={{
                      left: `${drop.left}%`,
                      height: drop.length,
                      opacity: drop.opacity,
                      rotate: "8deg",
                    }}
                    initial={{ y: "-10vh", x: 0 }}
                    animate={{ y: "110vh", x: -45 }}
                    transition={{
                      duration: drop.duration,
                      delay: drop.delay,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ))}
            </>
          )}

          {/* THUNDERSTORM: Heavy angled downpour + periodic atmospheric flash */}
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
                      key={drop.id}
                      className="absolute top-0 w-[1.5px] rounded-full bg-gradient-to-b from-transparent via-indigo-100/80 to-cyan-100"
                      style={{
                        left: `${drop.left}%`,
                        height: drop.length,
                        opacity: drop.opacity,
                        rotate: "16deg",
                      }}
                      initial={{ y: "-12vh", x: 0 }}
                      animate={{ y: "112vh", x: -110 }}
                      transition={{
                        duration: drop.duration,
                        delay: drop.delay,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* SNOWY: Soft glowing snowflakes swaying gently */}
          {condition === "Snowy" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-sky-100/10 via-transparent to-white/10" />
              {!prefersReducedMotion &&
                snowFlakes.map((flake) => (
                  <motion.div
                    key={flake.id}
                    className="absolute top-0 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                    style={{
                      left: `${flake.left}%`,
                      width: flake.size,
                      height: flake.size,
                      opacity: flake.opacity,
                    }}
                    initial={{ y: "-8vh", x: 0 }}
                    animate={{
                      y: "108vh",
                      x: [0, flake.sway, -flake.sway * 0.6, flake.sway * 0.4, 0],
                    }}
                    transition={{
                      y: {
                        duration: flake.duration,
                        delay: flake.delay,
                        repeat: Infinity,
                        ease: "linear",
                      },
                      x: {
                        duration: flake.duration * 0.8,
                        delay: flake.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }}
                  />
                ))}
            </>
          )}

          {/* WINDY: Fast sweeping horizontal air current streaks */}
          {condition === "Windy" && (
            <>
              {!prefersReducedMotion &&
                windStreaks.map((streak) => (
                  <motion.div
                    key={streak.id}
                    className="absolute h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-teal-100/70 to-transparent"
                    style={{
                      top: `${streak.top}%`,
                      width: streak.width,
                      opacity: streak.opacity,
                    }}
                    initial={{ x: "-25vw" }}
                    animate={{ x: "115vw" }}
                    transition={{
                      duration: streak.duration,
                      delay: streak.delay,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ))}
            </>
          )}

          {/* OVERCAST: Slow drifting upper cloud veils */}
          {condition === "Overcast" && (
            <>
              <div className="absolute inset-0 bg-slate-900/15" />
              {!prefersReducedMotion &&
                cloudWisps.map((cloud) => (
                  <motion.div
                    key={cloud.id}
                    className="absolute rounded-full bg-slate-200/20 blur-3xl"
                    style={{
                      top: `${cloud.top}%`,
                      width: cloud.width,
                      height: cloud.height,
                      opacity: cloud.opacity,
                    }}
                    initial={{ x: "-30vw" }}
                    animate={{ x: "115vw" }}
                    transition={{
                      duration: cloud.duration,
                      delay: cloud.delay,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                ))}
            </>
          )}

          {/* FOGGY: Layered breathing atmospheric mist banks */}
          {condition === "Foggy" && (
            <>
              <div className="absolute inset-0 bg-slate-200/10 backdrop-blur-[1px]" />
              {!prefersReducedMotion &&
                fogBanks.map((bank) => (
                  <motion.div
                    key={bank.id}
                    className="absolute -left-1/4 w-[150%] h-44 rounded-full bg-gradient-to-r from-transparent via-slate-100/35 to-transparent blur-3xl"
                    style={{ top: `${bank.top}%` }}
                    animate={{
                      x: ["-6%", "6%", "-6%"],
                      opacity: [bank.opacity * 0.65, bank.opacity, bank.opacity * 0.65],
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
