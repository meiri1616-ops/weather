import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WeatherConditionType } from "../types";

interface AtmosphericGradientLayerProps {
  condition: WeatherConditionType;
}

const CONDITION_RADIAL_GRADIENTS: Record<WeatherConditionType, string> = {
  Sunny:
    "radial-gradient(circle at 78% 18%, rgba(251, 191, 36, 0.34) 0%, rgba(245, 158, 11, 0.16) 38%, rgba(56, 189, 248, 0.08) 70%, rgba(2, 6, 23, 0.24) 100%)",
  Rainy:
    "radial-gradient(circle at 50% 22%, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0.44) 55%, rgba(2, 6, 23, 0.68) 100%)",
  Thunderstorm:
    "radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.25) 0%, rgba(30, 27, 75, 0.56) 50%, rgba(2, 6, 23, 0.8) 100%)",
  Snowy:
    "radial-gradient(circle at 50% 20%, rgba(224, 242, 254, 0.3) 0%, rgba(125, 211, 252, 0.16) 46%, rgba(15, 23, 42, 0.36) 100%)",
  Overcast:
    "radial-gradient(circle at 50% 12%, rgba(148, 163, 184, 0.22) 0%, rgba(51, 65, 85, 0.4) 55%, rgba(15, 23, 42, 0.58) 100%)",
  Windy:
    "radial-gradient(circle at 24% 28%, rgba(45, 212, 191, 0.24) 0%, rgba(14, 165, 233, 0.14) 46%, rgba(15, 23, 42, 0.44) 100%)",
  Foggy:
    "radial-gradient(circle at 50% 45%, rgba(226, 232, 240, 0.34) 0%, rgba(148, 163, 184, 0.28) 55%, rgba(30, 41, 59, 0.5) 100%)",
};

export default function AtmosphericGradientLayer({
  condition,
}: AtmosphericGradientLayerProps) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={condition}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
          style={{ background: CONDITION_RADIAL_GRADIENTS[condition] }}
        />
      </AnimatePresence>
    </div>
  );
}
