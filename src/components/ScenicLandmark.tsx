import React, { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { WeatherConditionType } from "../types";

// Import the generated high-quality 3D isometric city block images
import nanjingImg from "../assets/images/nanjing_isometric_1794554312603.jpg";
import beijingImg from "../assets/images/beijing_isometric_1783027004508.jpg";
import shanghaiImg from "../assets/images/shanghai_isometric_1794554312753.jpg";
import xianImg from "../assets/images/xian_isometric_1794554313601.jpg";
import hangzhouImg from "../assets/images/hangzhou_isometric_1794554313649.jpg";
import parisImg from "../assets/images/paris_isometric_1783027016252.jpg";
import tokyoImg from "../assets/images/tokyo_isometric_1783027027369.jpg";
import newyorkImg from "../assets/images/newyork_isometric_1783027037898.jpg";
import rioImg from "../assets/images/rio_isometric_1783027047417.jpg";
import londonImg from "../assets/images/london_isometric_1783027057911.jpg";

const LANDMARK_IMAGE_MAP: Record<string, string> = {
  nanjing: nanjingImg,
  beijing: beijingImg,
  shanghai: shanghaiImg,
  xian: xianImg,
  hangzhou: hangzhouImg,
  paris: parisImg,
  tokyo: tokyoImg,
  newyork: newyorkImg,
  rio: rioImg,
  london: londonImg,
};

const WATERFRONT_CITIES = new Set([
  "nanjing",
  "shanghai",
  "hangzhou",
  "paris",
  "newyork",
  "london",
  "rio",
]);

interface ScenicLandmarkProps {
  landmarkId?: string;
  cityName: string;
  condition: WeatherConditionType;
  windSpeed?: number;
}

interface VehicleRoute {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  color: string;
  angleDeg: number;
}

interface BoatRoute {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  angleDeg: number;
}

interface PedestrianRoute {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  coatColor: string;
  umbrellaColor: string;
  /** Whether this pedestrian opens an umbrella in rain/thunderstorm */
  carriesUmbrella: boolean;
  /** Stagger delay before umbrella opens */
  umbrellaOpenDelay: number;
  /** Whether umbrella pulses/toggles open-close randomly during walk */
  randomUmbrellaToggle: boolean;
}

interface WindWisp {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  duration: number;
  delay: number;
  color: string;
}

export default function ScenicLandmark({
  landmarkId,
  cityName,
  condition,
  windSpeed = 10,
}: ScenicLandmarkProps) {
  const [lightning, setLightning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const cityImage = landmarkId ? LANDMARK_IMAGE_MAP[landmarkId] : undefined;
  const hasWaterway = landmarkId ? WATERFRONT_CITIES.has(landmarkId) : false;

  const isWindy = condition === "Windy" || windSpeed >= 24;
  const isRainy = condition === "Rainy" || condition === "Thunderstorm";

  // Weather-driven movement multipliers
  const motionProfile = useMemo(() => {
    switch (condition) {
      case "Windy":
        return {
          vehicleFactor: 0.58,
          pedestrianFactor: 0.52,
          boatFactor: 0.72,
          modeKey: "windy",
        };
      case "Thunderstorm":
        return {
          vehicleFactor: 0.78,
          pedestrianFactor: 0.58,
          boatFactor: 0.85,
          modeKey: "storm",
        };
      case "Rainy":
        return {
          vehicleFactor: 0.86,
          pedestrianFactor: 0.68,
          boatFactor: 0.92,
          modeKey: "rainy",
        };
      case "Snowy":
        return {
          vehicleFactor: 1.32,
          pedestrianFactor: 1.28,
          boatFactor: 1.25,
          modeKey: "snowy",
        };
      case "Foggy":
        return {
          vehicleFactor: 1.35,
          pedestrianFactor: 1.2,
          boatFactor: 1.3,
          modeKey: "foggy",
        };
      default:
        return {
          vehicleFactor: isWindy ? 0.68 : 1,
          pedestrianFactor: isWindy ? 0.62 : 1,
          boatFactor: isWindy ? 0.8 : 1,
          modeKey: isWindy ? "breezy" : "calm",
        };
    }
  }, [condition, isWindy]);

  // Isometric miniature vehicles gliding along diagonal road vectors
  const vehicles = useMemo<VehicleRoute[]>(
    () => [
      {
        id: "v1",
        startX: 18,
        startY: 78,
        endX: 68,
        endY: 53,
        duration: 13,
        delay: 0,
        color: "#fbbf24",
        angleDeg: -26,
      },
      {
        id: "v2",
        startX: 74,
        startY: 51,
        endX: 22,
        endY: 77,
        duration: 15,
        delay: 2.5,
        color: "#f8fafc",
        angleDeg: 154,
      },
      {
        id: "v3",
        startX: 28,
        startY: 54,
        endX: 78,
        endY: 80,
        duration: 16,
        delay: 1.2,
        color: "#38bdf8",
        angleDeg: 27,
      },
      {
        id: "v4",
        startX: 82,
        startY: 76,
        endX: 34,
        endY: 51,
        duration: 14,
        delay: 5.5,
        color: "#f43f5e",
        angleDeg: -153,
      },
      {
        id: "v5",
        startX: 40,
        startY: 88,
        endX: 88,
        endY: 64,
        duration: 12,
        delay: 4,
        color: "#e2e8f0",
        angleDeg: -26,
      },
      {
        id: "v6",
        startX: 12,
        startY: 63,
        endX: 58,
        endY: 86,
        duration: 17,
        delay: 7,
        color: "#2dd4bf",
        angleDeg: 26,
      },
    ],
    []
  );

  // Miniature boats gliding smoothly across rivers/lakes
  const boats = useMemo<BoatRoute[]>(
    () => [
      {
        id: "b1",
        startX: 44,
        startY: 79,
        endX: 77,
        endY: 60,
        duration: 24,
        delay: 0,
        angleDeg: -28,
      },
      {
        id: "b2",
        startX: 73,
        startY: 65,
        endX: 48,
        endY: 81,
        duration: 28,
        delay: 6,
        angleDeg: 152,
      },
      {
        id: "b3",
        startX: 32,
        startY: 66,
        endX: 56,
        endY: 52,
        duration: 22,
        delay: 3,
        angleDeg: -29,
      },
    ],
    []
  );

  // Miniature pedestrians strolling along plazas and waterfront walkways
  const pedestrians = useMemo<PedestrianRoute[]>(
    () => [
      {
        id: "p1",
        startX: 42,
        startY: 62,
        endX: 50,
        endY: 58,
        duration: 14,
        delay: 0,
        coatColor: "#f8fafc",
        umbrellaColor: "#ef4444",
        carriesUmbrella: true,
        umbrellaOpenDelay: 0.2,
        randomUmbrellaToggle: false,
      },
      {
        id: "p2",
        startX: 53,
        startY: 57,
        endX: 44,
        endY: 63,
        duration: 16,
        delay: 2,
        coatColor: "#38bdf8",
        umbrellaColor: "#facc15",
        carriesUmbrella: true,
        umbrellaOpenDelay: 0.8,
        randomUmbrellaToggle: true,
      },
      {
        id: "p3",
        startX: 60,
        startY: 71,
        endX: 68,
        endY: 67,
        duration: 15,
        delay: 1,
        coatColor: "#fbbf24",
        umbrellaColor: "#3b82f6",
        carriesUmbrella: true,
        umbrellaOpenDelay: 0.4,
        randomUmbrellaToggle: false,
      },
      {
        id: "p4",
        startX: 35,
        startY: 73,
        endX: 43,
        endY: 77,
        duration: 13,
        delay: 3.5,
        coatColor: "#f472b6",
        umbrellaColor: "#14b8a6",
        carriesUmbrella: true,
        umbrellaOpenDelay: 1.3,
        randomUmbrellaToggle: true,
      },
      {
        id: "p5",
        startX: 66,
        startY: 61,
        endX: 58,
        endY: 56,
        duration: 17,
        delay: 4.5,
        coatColor: "#34d399",
        umbrellaColor: "#fb7185",
        carriesUmbrella: true,
        umbrellaOpenDelay: 0.6,
        randomUmbrellaToggle: false,
      },
      {
        id: "p6",
        startX: 48,
        startY: 74,
        endX: 55,
        endY: 70,
        duration: 12,
        delay: 6,
        coatColor: "#e2e8f0",
        umbrellaColor: "#a855f7",
        carriesUmbrella: false,
        umbrellaOpenDelay: 0,
        randomUmbrellaToggle: false,
      },
      {
        id: "p7",
        startX: 28,
        startY: 68,
        endX: 36,
        endY: 64,
        duration: 15,
        delay: 1.8,
        coatColor: "#fb923c",
        umbrellaColor: "#38bdf8",
        carriesUmbrella: true,
        umbrellaOpenDelay: 1.6,
        randomUmbrellaToggle: true,
      },
      {
        id: "p8",
        startX: 72,
        startY: 68,
        endX: 64,
        endY: 73,
        duration: 14,
        delay: 5,
        coatColor: "#a78bfa",
        umbrellaColor: "#f97316",
        carriesUmbrella: true,
        umbrellaOpenDelay: 0.5,
        randomUmbrellaToggle: false,
      },
      {
        id: "p9",
        startX: 51,
        startY: 66,
        endX: 59,
        endY: 62,
        duration: 13.5,
        delay: 2.6,
        coatColor: "#fde047",
        umbrellaColor: "#10b981",
        carriesUmbrella: true,
        umbrellaOpenDelay: 1.1,
        randomUmbrellaToggle: true,
      },
      {
        id: "p10",
        startX: 38,
        startY: 59,
        endX: 46,
        endY: 64,
        duration: 15.5,
        delay: 4.1,
        coatColor: "#60a5fa",
        umbrellaColor: "#f43f5e",
        carriesUmbrella: false,
        umbrellaOpenDelay: 0,
        randomUmbrellaToggle: false,
      },
    ],
    []
  );

  // Subtle wind-swept leaves & air wisps when Windy
  const windWisps = useMemo<WindWisp[]>(
    () => [
      { id: "w1", startX: 15, startY: 58, endX: 55, endY: 46, duration: 4.2, delay: 0, color: "#bef264" },
      { id: "w2", startX: 25, startY: 74, endX: 72, endY: 60, duration: 3.8, delay: 1.1, color: "#fde047" },
      { id: "w3", startX: 38, startY: 62, endX: 84, endY: 49, duration: 4.5, delay: 2.3, color: "#a7f3d0" },
      { id: "w4", startX: 18, startY: 82, endX: 64, endY: 68, duration: 3.6, delay: 0.6, color: "#fdba74" },
      { id: "w5", startX: 46, startY: 78, endX: 90, endY: 63, duration: 4.0, delay: 1.9, color: "#d9f99d" },
    ],
    []
  );

  // Interactive lightning flash on the background scene (Thunderstorm only)
  useEffect(() => {
    if (condition !== "Thunderstorm") {
      setLightning(false);
      return;
    }

    let isDestroyed = false;
    const timerIds: number[] = [];

    const scheduleLightning = () => {
      if (isDestroyed) return;
      const delay = Math.random() * 5000 + 3000;
      const t1 = window.setTimeout(() => {
        if (isDestroyed) return;
        setLightning(true);
        const t2 = window.setTimeout(() => {
          setLightning(false);
          const t3 = window.setTimeout(() => {
            if (isDestroyed) return;
            setLightning(true);
            const t4 = window.setTimeout(() => {
              setLightning(false);
              scheduleLightning();
            }, 60);
            timerIds.push(t4);
          }, 120);
          timerIds.push(t3);
        }, 150);
        timerIds.push(t2);
      }, delay);
      timerIds.push(t1);
    };

    scheduleLightning();
    return () => {
      isDestroyed = true;
      timerIds.forEach((id) => window.clearTimeout(id));
    };
  }, [condition]);

  // Dynamic CSS filter styling based on current WeatherConditionType
  const getSceneFilterStyle = () => {
    switch (condition) {
      case "Sunny":
        return { filter: "brightness(1.04) contrast(1.02) saturate(1.05)" };
      case "Rainy":
        return { filter: "brightness(0.72) contrast(0.92) saturate(0.8)" };
      case "Snowy":
        return { filter: "brightness(1.02) contrast(0.95) saturate(0.75)" };
      case "Overcast":
        return { filter: "brightness(0.8) contrast(0.88) saturate(0.7)" };
      case "Windy":
        return { filter: "brightness(1.0) contrast(1.0) saturate(1.0)" };
      case "Thunderstorm":
        return {
          filter: lightning
            ? "brightness(1.45) contrast(1.25) saturate(1.15)"
            : "brightness(0.55) contrast(1.1) saturate(0.7)",
        };
      case "Foggy":
        return { filter: "brightness(0.85) contrast(0.78) saturate(0.68) blur(0.4px)" };
      default:
        return { filter: "brightness(1) contrast(1) saturate(1)" };
    }
  };

  // Dynamic atmospheric color-grading overlay
  const getGradientOverlayClass = () => {
    switch (condition) {
      case "Sunny":
        return "bg-gradient-to-tr from-transparent via-amber-500/5 to-amber-300/15 mix-blend-color-burn";
      case "Rainy":
        return "bg-gradient-to-b from-slate-900/40 via-transparent to-slate-950/35 mix-blend-multiply";
      case "Snowy":
        return "bg-gradient-to-b from-sky-100/15 via-transparent to-white/20 mix-blend-overlay";
      case "Overcast":
        return "bg-gradient-to-b from-zinc-800/40 via-transparent to-zinc-950/35 mix-blend-color-burn";
      case "Windy":
        return "bg-gradient-to-r from-sky-400/5 via-transparent to-teal-400/10 mix-blend-color-dodge";
      case "Thunderstorm":
        return "bg-gradient-to-b from-indigo-950/60 via-transparent to-purple-950/55 mix-blend-color-burn";
      case "Foggy":
        return "bg-gradient-to-b from-slate-300/20 via-slate-100/25 to-slate-400/35 mix-blend-lighten";
      default:
        return "hidden";
    }
  };

  const getAtmosphericBackdropClass = () => {
    switch (condition) {
      case "Sunny":
        return "from-sky-900 via-cyan-900 to-amber-900/70";
      case "Rainy":
        return "from-slate-950 via-slate-900 to-sky-950";
      case "Snowy":
        return "from-slate-800 via-sky-900 to-slate-950";
      case "Thunderstorm":
        return "from-slate-950 via-indigo-950 to-slate-900";
      case "Foggy":
        return "from-slate-800 via-slate-700 to-slate-900";
      case "Windy":
        return "from-slate-900 via-teal-950 to-sky-950";
      default:
        return "from-slate-900 via-slate-800 to-slate-950";
    }
  };

  const isLowLight =
    condition === "Rainy" ||
    condition === "Thunderstorm" ||
    condition === "Overcast" ||
    condition === "Foggy";

  return (
    <div
      id="scenic-landmark-container"
      className="fixed inset-0 w-full h-full overflow-hidden select-none z-0 bg-slate-950"
    >
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={getSceneFilterStyle()}
      >
        {cityImage ? (
          <motion.img
            src={cityImage}
            alt={cityName}
            className="absolute inset-0 w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    scale: [1.02, 1.045, 1.02],
                  }
            }
            transition={{
              duration: isWindy ? 20 : 28,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getAtmosphericBackdropClass()} transition-all duration-1000`}
          >
            <svg
              viewBox="0 0 1440 360"
              preserveAspectRatio="none"
              className="absolute bottom-0 inset-x-0 w-full h-56 text-slate-950/60 fill-current"
              aria-hidden="true"
            >
              <path d="M0,360 L0,270 L48,270 L48,220 L84,220 L84,250 L130,250 L130,175 L178,175 L178,240 L225,240 L225,195 L268,195 L268,260 L320,260 L320,145 L355,120 L390,145 L390,255 L450,255 L450,185 L510,185 L510,235 L560,235 L560,165 L615,165 L615,245 L670,245 L670,115 L710,95 L750,115 L750,230 L820,230 L820,175 L880,175 L880,250 L945,250 L945,160 L1005,160 L1005,225 L1075,225 L1075,140 L1130,140 L1130,245 L1195,245 L1195,180 L1255,180 L1255,255 L1320,255 L1320,190 L1385,190 L1385,260 L1440,260 L1440,360 Z" />
            </svg>
          </div>
        )}

        {/* Weather-Reactive Micro-Interactions: Vehicles, Boats, Pedestrians w/ Umbrellas & Wind Wisps */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Miniature Vehicles gliding on isometric avenues */}
            {vehicles.map((v) => {
              const duration = Number((v.duration * motionProfile.vehicleFactor).toFixed(2));
              return (
                <motion.div
                  key={`${v.id}-${motionProfile.modeKey}`}
                  className="absolute flex items-center"
                  style={{
                    transform: `rotate(${v.angleDeg}deg)`,
                  }}
                  initial={{
                    left: `${v.startX}%`,
                    top: `${v.startY}%`,
                    opacity: 0,
                  }}
                  animate={{
                    left: [`${v.startX}%`, `${v.endX}%`],
                    top: [`${v.startY}%`, `${v.endY}%`],
                    opacity: [0, 0.92, 0.92, 0],
                  }}
                  transition={{
                    duration,
                    delay: v.delay * motionProfile.vehicleFactor,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.1, 0.9, 1],
                  }}
                >
                  <div className="relative flex items-center">
                    {/* Subtle airflow trail when driving fast in windy weather */}
                    {isWindy && (
                      <div className="w-3 h-[1.5px] -mr-0.5 bg-gradient-to-r from-transparent to-white/45 rounded-full" />
                    )}
                    <div
                      className={`w-3 h-1.5 rounded-[3px] shadow-[0_2px_3px_rgba(0,0,0,0.65)] border border-white/40 ${
                        isRainy ? "ring-1 ring-sky-200/30" : ""
                      }`}
                      style={{ backgroundColor: v.color }}
                    />
                    <div
                      className={`w-3.5 h-2 -ml-0.5 rounded-r-full blur-[2px] ${
                        isLowLight ? "bg-amber-200/85" : "bg-amber-100/45"
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}

            {/* Miniature Boats / Ferries for waterfront cities */}
            {hasWaterway &&
              boats.map((b) => {
                const duration = Number((b.duration * motionProfile.boatFactor).toFixed(2));
                return (
                  <motion.div
                    key={`${b.id}-${motionProfile.modeKey}`}
                    className="absolute"
                    style={{
                      transform: `rotate(${b.angleDeg}deg)`,
                    }}
                    initial={{
                      left: `${b.startX}%`,
                      top: `${b.startY}%`,
                      opacity: 0,
                    }}
                    animate={{
                      left: [`${b.startX}%`, `${b.endX}%`],
                      top: [`${b.startY}%`, `${b.endY}%`],
                      y: isWindy || isRainy ? [0, -1.8, 1.2, -1.5, 0] : [0, -0.5, 0],
                      opacity: [0, 0.85, 0.85, 0],
                    }}
                    transition={{
                      duration,
                      delay: b.delay * motionProfile.boatFactor,
                      repeat: Infinity,
                      ease: "linear",
                      times: [0, 0.12, 0.88, 1],
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-3.5 h-1 bg-gradient-to-r from-transparent to-white/50 rounded-full blur-[0.5px]" />
                      <div className="w-4 h-1.5 bg-amber-900 border border-amber-300/60 rounded-r-full shadow-sm" />
                    </div>
                  </motion.div>
                );
              })}

            {/* Miniature Pedestrians with weather-adaptive pace, wind lean, and random umbrella animations */}
            {pedestrians.map((p) => {
              const duration = Number((p.duration * motionProfile.pedestrianFactor).toFixed(2));
              const showUmbrella = isRainy && p.carriesUmbrella;
              const strideBounce = isWindy || isRainy ? [0, -2, 0, -2, 0, -2, 0, -2, 0] : [0, -1.4, 0, -1.4, 0, -1.4, 0];

              return (
                <motion.div
                  key={`${p.id}-${motionProfile.modeKey}`}
                  className="absolute flex flex-col items-center"
                  initial={{
                    left: `${p.startX}%`,
                    top: `${p.startY}%`,
                    opacity: 0,
                  }}
                  animate={{
                    left: [`${p.startX}%`, `${p.endX}%`],
                    top: [`${p.startY}%`, `${p.endY}%`],
                    y: strideBounce,
                    rotate: isWindy ? [-5, -11, -6, -12, -5] : 0,
                    opacity: [0, 0.94, 0.94, 0],
                  }}
                  transition={{
                    duration,
                    delay: p.delay * motionProfile.pedestrianFactor,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.1, 0.9, 1],
                  }}
                >
                  {/* Animated Miniature Umbrella on Rainy / Thunderstorm Days */}
                  {showUmbrella && (
                    <motion.div
                      className="relative flex flex-col items-center -mb-0.5 origin-bottom"
                      initial={{ scale: 0.2, opacity: 0 }}
                      animate={
                        p.randomUmbrellaToggle
                          ? {
                              scale: [0.2, 1.06, 1, 1, 0.35, 1.05, 1],
                              opacity: [0, 1, 1, 1, 0.55, 1, 1],
                              rotate: condition === "Thunderstorm" ? [-10, 12, -14, 8, -10] : [-5, 6, -4, 5, -5],
                            }
                          : {
                              scale: [0.25, 1.08, 1],
                              opacity: [0, 1, 1],
                              rotate: condition === "Thunderstorm" ? [-8, 10, -10, 8] : [-4, 4, -4],
                            }
                      }
                      transition={{
                        duration: p.randomUmbrellaToggle ? 7.5 : 3.2,
                        delay: p.umbrellaOpenDelay,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                      }}
                    >
                      {/* Dome canopy */}
                      <span
                        className="w-3.5 h-2 rounded-t-full border-t border-white/50 shadow-[0_2px_4px_rgba(0,0,0,0.65)] block"
                        style={{ backgroundColor: p.umbrellaColor }}
                      />
                      {/* Tiny umbrella shaft */}
                      <span className="w-[1px] h-1 bg-slate-200/80 block" />
                    </motion.div>
                  )}

                  {/* Pedestrian Head */}
                  <span className="w-1 h-1 rounded-full bg-amber-100 shadow-[0_0_2px_rgba(0,0,0,0.85)]" />
                  {/* Pedestrian Coat / Body */}
                  <span
                    className="w-1.5 h-2 rounded-t-[2px] rounded-b-[1px] shadow-[0_1px_2px_rgba(0,0,0,0.75)]"
                    style={{ backgroundColor: p.coatColor }}
                  />
                </motion.div>
              );
            })}

            {/* Wind-blown leaves & breeze streaks during Windy conditions */}
            {isWindy &&
              windWisps.map((w) => (
                <motion.div
                  key={`${w.id}-${motionProfile.modeKey}`}
                  className="absolute flex items-center gap-1"
                  initial={{
                    left: `${w.startX}%`,
                    top: `${w.startY}%`,
                    opacity: 0,
                  }}
                  animate={{
                    left: [`${w.startX}%`, `${w.endX}%`],
                    top: [`${w.startY}%`, `${w.endY - 4}%`, `${w.endY}%`],
                    rotate: [0, 180, 360],
                    opacity: [0, 0.75, 0.75, 0],
                  }}
                  transition={{
                    duration: w.duration,
                    delay: w.delay,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                >
                  <span
                    className="w-1.5 h-1 rounded-full shadow-sm block"
                    style={{ backgroundColor: w.color }}
                  />
                </motion.div>
              ))}
          </div>
        )}

        <div className={`absolute inset-0 transition-all duration-1000 ${getGradientOverlayClass()}`} />

        {/* Subtle legibility scrim so center HUD text stays crisp across bright scenes */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/60 pointer-events-none" />

        {/* Lightning Flash */}
        <div
          className={`absolute inset-0 bg-white/80 z-20 pointer-events-none transition-opacity duration-75 ${
            lightning ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Sun Core (Sunny or Windy) */}
        {(condition === "Sunny" || condition === "Windy") && (
          <div className="absolute top-24 right-32 w-24 h-24 rounded-full bg-amber-100/80 shadow-[0_0_80px_35px_rgba(251,191,36,0.45)] pointer-events-none z-0" />
        )}
      </div>
    </div>
  );
}
