import React, { useEffect, useState } from "react";
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

interface ScenicLandmarkProps {
  landmarkId?: string;
  cityName: string;
  condition: WeatherConditionType;
}

export default function ScenicLandmark({
  landmarkId,
  cityName,
  condition,
}: ScenicLandmarkProps) {
  const [lightning, setLightning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const cityImage = landmarkId ? LANDMARK_IMAGE_MAP[landmarkId] : undefined;

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
                    scale: [1.01, 1.035, 1.01],
                  }
            }
            transition={{
              duration: 28,
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

        <div className={`absolute inset-0 transition-all duration-1000 ${getGradientOverlayClass()}`} />

        {/* Subtle legibility scrim so center HUD text stays crisp across bright scenes */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/20 to-slate-950/60 pointer-events-none" />

        {/* Lightning Flash */}
        <div
          className={`absolute inset-0 bg-white/80 z-20 pointer-events-none transition-opacity duration-75 ${
            lightning ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
