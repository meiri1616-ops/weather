import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  X,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Umbrella,
  ThermometerSnowflake,
  Wind,
  Sun,
  CloudFog,
  BellRing,
} from "lucide-react";
import { ForecastDay, WeatherConditionType, WeatherData } from "../types";

interface WeatherOwlProps {
  cityName: string;
  weather: WeatherData;
  forecast: ForecastDay[];
  drawerOpen: boolean;
  onOpenItinerary: () => void;
  onOpenChat: () => void;
}

type ReminderTheme =
  | "change"
  | "umbrella"
  | "warmth"
  | "wind"
  | "sun"
  | "air"
  | "pleasant";

interface OwlReminder {
  text: string;
  theme: ReminderTheme;
  label: string;
}

interface SkyWaypoint {
  x: number;
  y: number;
  verticalSide: "top" | "bottom";
  horizontalSide: "left" | "right";
}

const BUBBLE_THEME_STYLES: Record<
  ReminderTheme,
  {
    container: string;
    tail: string;
    badge: string;
    iconBg: string;
  }
> = {
  change: {
    container:
      "bg-gradient-to-br from-cyan-500/95 via-teal-500/95 to-emerald-500/95 border-cyan-200/60 text-white shadow-[0_14px_32px_rgba(6,182,212,0.42)]",
    tail: "bg-teal-500 border-cyan-200/60",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-cyan-100",
  },
  umbrella: {
    container:
      "bg-gradient-to-br from-sky-500/95 via-blue-600/95 to-indigo-600/95 border-sky-200/60 text-white shadow-[0_14px_32px_rgba(37,99,235,0.45)]",
    tail: "bg-blue-600 border-sky-200/60",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-sky-100",
  },
  warmth: {
    container:
      "bg-gradient-to-br from-rose-500/95 via-pink-600/95 to-orange-500/95 border-rose-200/60 text-white shadow-[0_14px_32px_rgba(244,63,94,0.42)]",
    tail: "bg-pink-600 border-rose-200/60",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-amber-100",
  },
  wind: {
    container:
      "bg-gradient-to-br from-emerald-500/95 via-teal-600/95 to-cyan-600/95 border-emerald-200/60 text-white shadow-[0_14px_32px_rgba(16,185,129,0.4)]",
    tail: "bg-teal-600 border-emerald-200/60",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-emerald-100",
  },
  sun: {
    container:
      "bg-gradient-to-br from-amber-500/95 via-orange-500/95 to-rose-500/95 border-amber-200/70 text-white shadow-[0_14px_32px_rgba(245,158,11,0.44)]",
    tail: "bg-orange-500 border-amber-200/70",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-yellow-100",
  },
  air: {
    container:
      "bg-gradient-to-br from-violet-500/95 via-purple-600/95 to-fuchsia-600/95 border-violet-200/60 text-white shadow-[0_14px_32px_rgba(139,92,246,0.42)]",
    tail: "bg-purple-600 border-violet-200/60",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-violet-100",
  },
  pleasant: {
    container:
      "bg-gradient-to-br from-teal-500/95 via-emerald-500/95 to-sky-500/95 border-teal-200/60 text-white shadow-[0_14px_32px_rgba(20,184,166,0.4)]",
    tail: "bg-emerald-500 border-teal-200/60",
    badge: "bg-white/20 text-white border-white/25",
    iconBg: "text-teal-100",
  },
};

function getThemeIcon(theme: ReminderTheme) {
  switch (theme) {
    case "change":
      return <BellRing className="w-3.5 h-3.5" />;
    case "umbrella":
      return <Umbrella className="w-3.5 h-3.5" />;
    case "warmth":
      return <ThermometerSnowflake className="w-3.5 h-3.5" />;
    case "wind":
      return <Wind className="w-3.5 h-3.5" />;
    case "sun":
      return <Sun className="w-3.5 h-3.5" />;
    case "air":
      return <CloudFog className="w-3.5 h-3.5" />;
    default:
      return <Sparkles className="w-3.5 h-3.5" />;
  }
}

function getSkyWaypoints(vw: number, vh: number): SkyWaypoint[] {
  const isSmall = vw < 640;
  const blockW = 148;
  const blockH = 104;
  const rightX = Math.max(16, vw - blockW - (isSmall ? 14 : 32));
  const leftX = isSmall ? 14 : 32;
  const bottomY = Math.max(200, vh - blockH - (isSmall ? 14 : 24));
  const topY = isSmall ? Math.max(120, vh - 230) : 88;

  if (isSmall) {
    return [
      { x: rightX, y: bottomY, verticalSide: "bottom", horizontalSide: "right" },
      { x: leftX, y: bottomY - 18, verticalSide: "bottom", horizontalSide: "left" },
      { x: rightX, y: bottomY - 28, verticalSide: "bottom", horizontalSide: "right" },
    ];
  }

  return [
    { x: rightX, y: bottomY, verticalSide: "bottom", horizontalSide: "right" },
    { x: rightX, y: topY, verticalSide: "top", horizontalSide: "right" },
    { x: leftX, y: topY + 10, verticalSide: "top", horizontalSide: "left" },
    { x: leftX, y: bottomY, verticalSide: "bottom", horizontalSide: "left" },
  ];
}

export default function WeatherOwl({
  cityName,
  weather,
  forecast,
  drawerOpen,
  onOpenItinerary,
  onOpenChat,
}: WeatherOwlProps) {
  const prefersReducedMotion = useReducedMotion();

  const [viewport, setViewport] = useState<{ vw: number; vh: number }>(() =>
    typeof window !== "undefined"
      ? { vw: window.innerWidth, vh: window.innerHeight }
      : { vw: 1280, vh: 800 }
  );
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [facingRight, setFacingRight] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const [bubbleOpen, setBubbleOpen] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [changeAlert, setChangeAlert] = useState<string | null>(null);

  const prevCityRef = useRef<string>(cityName);
  const prevCondRef = useRef<WeatherConditionType>(weather.conditionType);
  const prevTempRef = useRef<number>(weather.temp);
  const prevXRef = useRef<number | null>(null);

  // Track viewport size for safe flight bounds
  useEffect(() => {
    const handleResize = () => {
      setViewport({ vw: window.innerWidth, vh: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const waypoints = useMemo(
    () => getSkyWaypoints(viewport.vw, viewport.vh),
    [viewport.vw, viewport.vh]
  );

  const currentWaypoint = waypoints[waypointIndex % waypoints.length];

  // Dynamic flight loop across sky waypoints with comfortable hover pauses
  useEffect(() => {
    if (prefersReducedMotion || isHovered || drawerOpen) return;

    const timer = window.setInterval(() => {
      setWaypointIndex((prev) => (prev + 1) % waypoints.length);
    }, 8500);

    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, isHovered, drawerOpen, waypoints.length]);

  // Detect horizontal direction & flight burst when changing waypoints
  useEffect(() => {
    const targetX = currentWaypoint.x;
    if (prevXRef.current !== null && Math.abs(targetX - prevXRef.current) > 10) {
      setFacingRight(targetX > prevXRef.current);
    }
    if (prevXRef.current !== null && prevXRef.current !== targetX) {
      setIsFlying(true);
      const t = window.setTimeout(() => setIsFlying(false), 3600);
      prevXRef.current = targetX;
      return () => window.clearTimeout(t);
    }
    prevXRef.current = targetX;
  }, [currentWaypoint.x, currentWaypoint.y]);

  // Detect city or weather changes to issue an instant weather-change alert
  useEffect(() => {
    if (weather.condition === "加载中") return;

    const cityChanged = prevCityRef.current !== cityName;
    const condChanged = prevCondRef.current !== weather.conditionType;
    const tempDiff = Math.abs(weather.temp - prevTempRef.current);

    if (cityChanged) {
      setChangeAlert(
        `呼呼～我已飞抵「${cityName}」！这里现在是${weather.condition}，气温 ${weather.temp}°C。`
      );
      setBubbleOpen(true);
      setTipIndex(0);
    } else if (condChanged || tempDiff >= 3) {
      setChangeAlert(
        `注意天气变化！${cityName}当前转为「${weather.condition}」（${weather.temp}°C），记得及时调整装备哦～`
      );
      setBubbleOpen(true);
      setTipIndex(0);
    }

    prevCityRef.current = cityName;
    prevCondRef.current = weather.conditionType;
    prevTempRef.current = weather.temp;
  }, [cityName, weather.condition, weather.conditionType, weather.temp]);

  // Contextual owl weather reminders with distinct colorful bubble themes
  const reminders = useMemo<OwlReminder[]>(() => {
    const tips: OwlReminder[] = [];
    const apparent = weather.apparentTemp ?? weather.temp;
    const tomorrow = forecast[1];
    const isRainNow =
      weather.conditionType === "Rainy" ||
      weather.conditionType === "Thunderstorm";
    const willRainTomorrow =
      tomorrow &&
      (tomorrow.conditionType === "Rainy" ||
        tomorrow.conditionType === "Thunderstorm" ||
        tomorrow.precipitation >= 50);

    if (changeAlert) {
      tips.push({
        theme: "change",
        label: "天气快讯",
        text: changeAlert,
      });
    }

    if (isRainNow) {
      tips.push({
        theme: "umbrella",
        label: "记得带伞",
        text:
          weather.conditionType === "Thunderstorm"
            ? `外面正打雷下雨呢，出门一定要带好雨伞，尽量避开空旷和积水路段哦！`
            : `天空正在下${weather.condition}，出门千万记得带上雨伞，小心脚下湿滑～`,
      });
    } else if (willRainTomorrow && tomorrow) {
      tips.push({
        theme: "umbrella",
        label: "明日备伞",
        text: `虽然今天没下雨，但明天预报有${tomorrow.condition}（降水率 ${tomorrow.precipitation}%），提前备好雨伞吧！`,
      });
    }

    if (weather.conditionType === "Snowy" || weather.temp <= 11 || apparent <= 9) {
      tips.push({
        theme: "warmth",
        label: "注意保暖",
        text: `当前气温 ${weather.temp}°C、体感 ${apparent}°C，空气偏凉，出门记得穿暖和点，注意添衣保暖哦～`,
      });
    } else if (tomorrow && weather.temp - tomorrow.tempMin >= 6) {
      tips.push({
        theme: "warmth",
        label: "降温保暖",
        text: `明天最低温会降到 ${tomorrow.tempMin}°C，早晚温差比较大，记得备好防风保暖外套！`,
      });
    }

    if (weather.conditionType === "Windy" || weather.windSpeed >= 20) {
      tips.push({
        theme: "wind",
        label: "大风防风",
        text: `现在风力有点强劲（${weather.wind}），我飞起来都有点晃啦，出门记得防风保暖哦～`,
      });
    }

    if (weather.uvIndex >= 5 || weather.temp >= 28) {
      tips.push({
        theme: "sun",
        label: "防晒补水",
        text: `阳光好充足（紫外线指数 ${weather.uvIndex}），户外游玩记得防晒遮阳、多喝水补充水分呀！`,
      });
    }

    if (weather.conditionType === "Foggy" || weather.humidity >= 80) {
      tips.push({
        theme: "air",
        label: weather.conditionType === "Foggy" ? "大雾出行" : "湿度提醒",
        text: `空气湿度达到 ${weather.humidity}%${
          weather.conditionType === "Foggy" ? "且能见度偏低" : ""
        }，出行请多留意路面和交通安全～`,
      });
    }

    if (weather.aqi > 100) {
      tips.push({
        theme: "air",
        label: "空气贴士",
        text: `今天空气质量为「${weather.aqiLabel}」（AQI ${weather.aqi}），户外活动建议佩戴防护口罩！`,
      });
    }

    if (tips.length === 0) {
      tips.push(
        {
          theme: "pleasant",
          label: "出行宜游",
          text: `${cityName}今天${weather.condition}，气温 ${weather.temp}°C，微风不燥，非常适合出去散步打卡哦～`,
        },
        {
          theme: "pleasant",
          label: "气象伴侣",
          text: `点击我可以切换不同提醒，也可以直接点我脚下的「AI 行程」或「AI 导游」规划旅程！`,
        }
      );
    } else if (tips.length === 1) {
      tips.push({
        theme: "pleasant",
        label: "贴心伴侣",
        text: `点我脚下的「AI 行程」或「AI 导游」按钮，我可以帮你定制今日避雨或防寒玩法哦～`,
      });
    }

    return tips;
  }, [cityName, weather, forecast, changeAlert]);

  const activeReminder = reminders[tipIndex % reminders.length] || {
    theme: "pleasant" as ReminderTheme,
    label: "天气提醒",
    text: "",
  };
  const bubbleTheme = BUBBLE_THEME_STYLES[activeReminder.theme];

  // Auto-cycle reminders smoothly
  useEffect(() => {
    if (!bubbleOpen || reminders.length <= 1 || isHovered) return;
    const interval = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % reminders.length);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [bubbleOpen, reminders.length, isHovered]);

  // Web Speech API TTS helper so the owl can speak Chinese aloud
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "zh-CN";
      utter.pitch = 1.15;
      utter.rate = 1.03;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    } catch {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (voiceEnabled && bubbleOpen && activeReminder.text && !drawerOpen) {
      speakText(activeReminder.text);
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceEnabled, activeReminder.text, bubbleOpen, drawerOpen]);

  const handleToggleVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (voiceEnabled) {
      setVoiceEnabled(false);
      setIsSpeaking(false);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setVoiceEnabled(true);
      speakText(activeReminder.text);
    }
  };

  const handleOwlClick = () => {
    if (!bubbleOpen) {
      setBubbleOpen(true);
      if (voiceEnabled) speakText(activeReminder.text);
    } else {
      const nextIdx = (tipIndex + 1) % reminders.length;
      setTipIndex(nextIdx);
    }
  };

  const handleNextTip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTipIndex((prev) => (prev + 1) % reminders.length);
  };

  const isRainy =
    weather.conditionType === "Rainy" ||
    weather.conditionType === "Thunderstorm";
  const isCold =
    weather.conditionType === "Snowy" ||
    weather.temp <= 11 ||
    (weather.apparentTemp ?? weather.temp) <= 9;
  const isSunnyWarm =
    weather.conditionType === "Sunny" && weather.temp >= 25;
  const isWindy =
    weather.conditionType === "Windy" || weather.windSpeed >= 22;

  if (drawerOpen) return null;

  const bubbleAlignRight = currentWaypoint.horizontalSide === "right";
  const bubbleBelow = currentWaypoint.verticalSide === "top";

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none overflow-hidden"
      aria-live="polite"
    >
      <motion.div
        className="absolute pointer-events-auto flex flex-col items-center w-[148px]"
        initial={{
          x: currentWaypoint.x,
          y: currentWaypoint.y,
        }}
        animate={{
          x: currentWaypoint.x,
          y: currentWaypoint.y,
        }}
        transition={
          prefersReducedMotion
            ? { duration: 0.2 }
            : {
                duration: 3.6,
                ease: [0.37, 0, 0.63, 1],
              }
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Colorful Reminder Speech Bubble */}
        <AnimatePresence mode="wait">
          {bubbleOpen && activeReminder.text && (
            <motion.div
              key={`${activeReminder.theme}-${tipIndex}`}
              initial={{ opacity: 0, scale: 0.9, y: bubbleBelow ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: bubbleBelow ? -6 : 6 }}
              transition={{ duration: 0.24 }}
              className={`absolute w-64 sm:w-[272px] backdrop-blur-xl border rounded-2xl p-3.5 transition-colors duration-500 ${
                bubbleTheme.container
              } ${bubbleBelow ? "top-[108px]" : "bottom-[108px]"} ${
                bubbleAlignRight ? "right-0" : "left-0"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${bubbleTheme.badge}`}
                >
                  <span className={bubbleTheme.iconBg}>
                    {getThemeIcon(activeReminder.theme)}
                  </span>
                  <span>{activeReminder.label}</span>
                  {isSpeaking && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                  )}
                </span>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    title={voiceEnabled ? "关闭语音播报" : "开启语音播报"}
                    aria-label={voiceEnabled ? "关闭语音播报" : "开启语音播报"}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      voiceEnabled
                        ? "bg-white/25 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    {voiceEnabled ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleNextTip}
                    title="换一条提醒"
                    aria-label="换一条天气提醒"
                    className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBubbleOpen(false);
                    }}
                    title="收起气泡"
                    aria-label="收起猫头鹰对话气泡"
                    className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs leading-relaxed font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                {activeReminder.text}
              </p>

              {/* Colored speech tail pointing toward the owl */}
              <div
                className={`absolute w-3 h-3 rotate-45 ${bubbleTheme.tail} ${
                  bubbleBelow
                    ? "-top-1.5 border-l border-t"
                    : "-bottom-1.5 border-r border-b"
                } ${bubbleAlignRight ? "right-14" : "left-14"}`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flying Cartoon Owl Character */}
        <motion.button
          type="button"
          onClick={handleOwlClick}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          animate={
            prefersReducedMotion
              ? undefined
              : {
                  y: isFlying ? [0, -7, 2, -6, 0] : [0, -5, 0],
                  rotate: isFlying
                    ? facingRight
                      ? 7
                      : -7
                    : isWindy
                    ? [-4, 3, -3]
                    : [0, 1.5, -1.5, 0],
                }
          }
          transition={{
            duration: isFlying ? 1.1 : 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative w-[70px] h-[70px] flex items-center justify-center focus:outline-none cursor-pointer group drop-shadow-[0_10px_18px_rgba(0,0,0,0.55)]"
          aria-label="点击可爱的飞行猫头鹰查看或切换天气提醒"
          title="点我和我聊天，查看最新天气提醒"
        >
          <span className="absolute inset-2 rounded-full bg-amber-300/20 blur-md group-hover:bg-amber-300/35 transition-colors pointer-events-none" />

          <svg
            viewBox="0 0 110 110"
            className="w-full h-full overflow-visible"
            aria-hidden="true"
          >
            {/* Miniature Umbrella when Rainy or Thunderstorm */}
            {isRainy && (
              <motion.g
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, rotate: [-3, 4, -3] }}
                transition={{
                  rotate: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                }}
                style={{ originX: "55px", originY: "34px" }}
              >
                <line
                  x1="55"
                  y1="8"
                  x2="55"
                  y2="34"
                  stroke="#e2e8f0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20,16 C28,-3 82,-3 90,16 Q72,11 55,16 Q38,11 20,16 Z"
                  fill="#38bdf8"
                  stroke="#bae6fd"
                  strokeWidth="1.5"
                />
                <path
                  d="M38,14 C44,1 66,1 72,14 Q63,11 55,15 Q47,11 38,14 Z"
                  fill="#facc15"
                />
              </motion.g>
            )}

            {/* Left Flapping Wing */}
            <motion.path
              d="M28,48 C10,48 4,66 15,76 C22,82 30,72 32,60 Z"
              fill="#92400e"
              stroke="#78350f"
              strokeWidth="1.5"
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      rotate: isFlying
                        ? [0, -38, 10, -35, 0]
                        : [0, -14, 0],
                    }
              }
              transition={{
                duration: isFlying ? 0.45 : isWindy ? 1.0 : 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "30px", originY: "52px" }}
            />

            {/* Right Flapping Wing */}
            <motion.path
              d="M82,48 C100,48 106,66 95,76 C88,82 80,72 78,60 Z"
              fill="#92400e"
              stroke="#78350f"
              strokeWidth="1.5"
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      rotate: isFlying
                        ? [0, 38, -10, 35, 0]
                        : [0, 14, 0],
                    }
              }
              transition={{
                duration: isFlying ? 0.45 : isWindy ? 1.0 : 1.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "80px", originY: "52px" }}
            />

            {/* Tail Feathers */}
            <path d="M46,84 L55,95 L64,84 Z" fill="#78350f" />

            {/* Cute Dangling Feet */}
            <path
              d="M44,84 L41,91 M44,84 L45,92 M66,84 L65,92 M66,84 L69,91"
              stroke="#f97316"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Ear Tufts */}
            <path d="M31,32 L24,18 L40,26 Z" fill="#92400e" />
            <path d="M79,32 L86,18 L70,26 Z" fill="#92400e" />

            {/* Plump Owl Body */}
            <ellipse
              cx="55"
              cy="57"
              rx="28"
              ry="31"
              fill="#b45309"
              stroke="#78350f"
              strokeWidth="1.5"
            />

            {/* Soft Cream Belly */}
            <ellipse cx="55" cy="67" rx="18" ry="18" fill="#fef3c7" />
            <path
              d="M47,63 Q50,66 53,63 M57,63 Q60,66 63,63 M52,71 Q55,74 58,71"
              fill="none"
              stroke="#d97706"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            {/* Cozy Winter Scarf when Cold or Snowy */}
            {isCold && (
              <g>
                <motion.path
                  d="M72,56 Q86,62 84,74 Q76,72 68,62 Z"
                  fill="#ef4444"
                  animate={
                    prefersReducedMotion
                      ? undefined
                      : { rotate: isWindy || isFlying ? [-6, 10, -6] : [-2, 3, -2] }
                  }
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ originX: "72px", originY: "58px" }}
                />
                <path
                  d="M31,52 Q55,61 79,52 Q78,59 55,65 Q32,59 31,52 Z"
                  fill="#dc2626"
                />
                <path
                  d="M41,56 L43,62 M55,58 L55,64 M68,56 L66,62"
                  stroke="#fef3c7"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Facial Mask */}
            <circle cx="44" cy="41" r="13.5" fill="#fde68a" />
            <circle cx="66" cy="41" r="13.5" fill="#fde68a" />

            {/* Rosy Cheeks */}
            <ellipse cx="33" cy="48" rx="3.8" ry="2.2" fill="#fda4af" opacity="0.85" />
            <ellipse cx="77" cy="48" rx="3.8" ry="2.2" fill="#fda4af" opacity="0.85" />

            {/* Big Expressive Blinking Eyes */}
            <motion.g
              animate={
                prefersReducedMotion
                  ? undefined
                  : { scaleY: [1, 1, 1, 0.08, 1, 1] }
              }
              transition={{
                duration: 4.5,
                repeat: Infinity,
                times: [0, 0.45, 0.48, 0.51, 0.54, 1],
              }}
              style={{ originX: "55px", originY: "41px" }}
            >
              <circle cx="44" cy="41" r="7.5" fill="#1e293b" />
              <circle cx="66" cy="41" r="7.5" fill="#1e293b" />
              <circle cx="46.5" cy="38.5" r="2.6" fill="#ffffff" />
              <circle cx="68.5" cy="38.5" r="2.6" fill="#ffffff" />
              <circle cx="42" cy="43.5" r="1.2" fill="#ffffff" opacity="0.85" />
              <circle cx="64" cy="43.5" r="1.2" fill="#ffffff" opacity="0.85" />
            </motion.g>

            {/* Cool Sunglasses when Sunny & Warm */}
            {isSunnyWarm && (
              <g>
                <rect
                  x="35"
                  y="36"
                  width="17"
                  height="10"
                  rx="3.5"
                  fill="#0f172a"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                />
                <rect
                  x="58"
                  y="36"
                  width="17"
                  height="10"
                  rx="3.5"
                  fill="#0f172a"
                  stroke="#fbbf24"
                  strokeWidth="1.2"
                />
                <line
                  x1="52"
                  y1="40"
                  x2="58"
                  y2="40"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
              </g>
            )}

            {/* Animated Talking Beak */}
            <motion.path
              d="M50,45 L60,45 L55,53 Z"
              fill="#f97316"
              stroke="#ea580c"
              strokeWidth="1"
              strokeLinejoin="round"
              animate={
                isSpeaking && !prefersReducedMotion
                  ? { scaleY: [1, 1.35, 0.85, 1.3, 1] }
                  : undefined
              }
              transition={{ duration: 0.35, repeat: Infinity }}
              style={{ originX: "55px", originY: "45px" }}
            />
          </svg>
        </motion.button>

        {/* AI Itinerary & AI Tour Guide Action Buttons attached to the Owl */}
        <div className="flex items-center justify-center gap-1.5 mt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenItinerary();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-cyan-500/90 to-teal-500/90 hover:from-cyan-400 hover:to-teal-400 border border-white/25 text-white text-[11px] font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3 h-3 shrink-0" />
            <span>AI 行程</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500/90 to-violet-500/90 hover:from-indigo-400 hover:to-violet-400 border border-white/25 text-white text-[11px] font-semibold shadow-lg backdrop-blur-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span>AI 导游</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
