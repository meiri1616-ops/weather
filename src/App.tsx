import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  CloudLightning,
  Wind,
  Haze,
  MapPin,
  Calendar,
  Sparkles,
  Camera,
  Compass,
  Send,
  RefreshCw,
  AlertTriangle,
  X,
  CheckCircle2,
  MessageSquare,
  Clock,
  Search,
  Landmark,
  Plus,
  Check,
  Trash2,
  Heart,
} from "lucide-react";
import {
  City,
  WeatherConditionType,
  WeatherData,
  ForecastDay,
  TravelItinerary,
  ChatMessage,
} from "./types";
import { CITIES_DATA, findCuratedCity } from "./citiesData";
import ScenicLandmark from "./components/ScenicLandmark";
import AtmosphericGradientLayer from "./components/AtmosphericGradientLayer";
import WeatherParticleLayer from "./components/WeatherParticleLayer";
import WeatherOwl from "./components/WeatherOwl";

type RightDrawerTab = "landmark" | "forecast" | "itinerary" | "chat";

interface WishlistItem {
  id: string;
  city: string;
  visited: boolean;
}

const QUICK_CITIES = ["南京", "北京", "上海", "西安", "杭州", "成都", "东京", "巴黎", "伦敦", "纽约"];

export default function App() {
  const initialCity = CITIES_DATA[0]; // 南京

  // 1. Core City & Landmark State
  const [activeCity, setActiveCity] = useState<City>(initialCity);
  const [activeLandmarkId, setActiveLandmarkId] = useState<string>(
    initialCity.landmarks[0].id
  );
  const [citySearchInput, setCitySearchInput] = useState<string>("");
  const [recentCities, setRecentCities] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("wce_recent_cities");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return ["南京", "北京", "上海", "杭州"];
  });

  // Travel Wishlist State (persisted in localStorage)
  const [wishlistInput, setWishlistInput] = useState<string>("");
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem("wce_wishlist");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [
      { id: "wish-1", city: "京都", visited: false },
      { id: "wish-2", city: "纽约", visited: false },
      { id: "wish-3", city: "巴黎", visited: false },
    ];
  });

  // 2. Real Live Weather State
  const [weatherMetrics, setWeatherMetrics] = useState<WeatherData>({
    temp: 18,
    apparentTemp: 18,
    condition: "加载中",
    conditionType: "Overcast",
    humidity: 60,
    wind: "微风",
    windSpeed: 8,
    uvIndex: 3,
    aqi: 45,
    aqiLabel: "优",
    pressure: 1013,
  });
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  // 3. Drawers State
  const [leftDrawerOpen, setLeftDrawerOpen] = useState<boolean>(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<RightDrawerTab>("landmark");

  const activeLandmark =
    activeCity.landmarks.find((l) => l.id === activeLandmarkId) ||
    activeCity.landmarks[0];

  // Close open drawers on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLeftDrawerOpen(false);
        setRightDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Persist recent cities & wishlist
  useEffect(() => {
    try {
      localStorage.setItem("wce_recent_cities", JSON.stringify(recentCities));
    } catch {
      // ignore storage errors
    }
  }, [recentCities]);

  useEffect(() => {
    try {
      localStorage.setItem("wce_wishlist", JSON.stringify(wishlist));
    } catch {
      // ignore storage errors
    }
  }, [wishlist]);

  const handleAddWishlist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = wishlistInput.trim();
    if (!trimmed) return;
    setWishlist((prev) => {
      if (prev.some((item) => item.city === trimmed)) return prev;
      return [{ id: `wish-${Date.now()}`, city: trimmed, visited: false }, ...prev];
    });
    setWishlistInput("");
  };

  const handleToggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, visited: !item.visited } : item
      )
    );
  };

  const handleRemoveWishlist = (id: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== id));
  };

  // Fetch real weather + landmarks for a city name
  const switchToCity = async (cityQuery: string, closeLeftDrawer = false) => {
    const trimmed = cityQuery.trim();
    if (!trimmed) return;

    setIsLoadingWeather(true);
    setWeatherError(null);

    try {
      const weatherRes = await fetch(
        `/api/weather?city=${encodeURIComponent(trimmed)}`
      );
      const weatherJson = await weatherRes.json();

      if (!weatherRes.ok) {
        throw new Error(weatherJson.error || `未能获取「${trimmed}」的天气数据`);
      }

      const resolvedName: string = weatherJson.location?.name || trimmed;
      const resolvedCountry: string = weatherJson.location?.country || "";
      const resolvedAdmin1: string = weatherJson.location?.admin1 || "";

      setWeatherMetrics(weatherJson.weather);
      setForecastDays(weatherJson.forecast || []);
      setLastUpdatedTime(
        new Date().toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      // Match curated city or fetch dynamic multi-landmark guide
      const curated =
        findCuratedCity(resolvedName) || findCuratedCity(trimmed);

      if (curated) {
        const updatedCity: City = {
          ...curated,
          country: resolvedCountry || curated.country,
          admin1: resolvedAdmin1 || curated.admin1,
        };
        setActiveCity(updatedCity);
        setActiveLandmarkId(updatedCity.landmarks[0].id);
      } else {
        // Set immediate placeholder city while fetching dynamic landmarks
        const tempCity: City = {
          id: resolvedName.toLowerCase(),
          name: resolvedName,
          country: resolvedCountry,
          admin1: resolvedAdmin1,
          englishName: resolvedName,
          introduction: `${resolvedName}${
            resolvedCountry ? `（${resolvedCountry}）` : ""
          }实时气象与地标探索。`,
          landmarks: [
            {
              id: `${resolvedName}-main`,
              name: `${resolvedName}城市地标`,
              subtitle: "正在获取地标信息...",
              description: `正在为您检索 ${resolvedName} 的代表性标志建筑与摄影机位。`,
              history: "加载中...",
              photoTips: ["清晨或日落前后适合拍摄城市建筑轮廓。"],
              bestTime: "全天皆宜",
            },
          ],
        };
        setActiveCity(tempCity);
        setActiveLandmarkId(tempCity.landmarks[0].id);

        try {
          const guideRes = await fetch(
            `/api/city-guide?city=${encodeURIComponent(
              resolvedName
            )}&country=${encodeURIComponent(resolvedCountry)}`
          );
          if (guideRes.ok) {
            const guideData = await guideRes.json();
            if (
              Array.isArray(guideData.landmarks) &&
              guideData.landmarks.length > 0
            ) {
              const hydratedCity: City = {
                ...tempCity,
                introduction: guideData.introduction || tempCity.introduction,
                landmarks: guideData.landmarks,
              };
              setActiveCity(hydratedCity);
              setActiveLandmarkId(hydratedCity.landmarks[0].id);
            }
          }
        } catch {
          // keep fallback city guide silently
        }
      }

      setRecentCities((prev) => {
        const next = [
          resolvedName,
          ...prev.filter((item) => item !== resolvedName),
        ];
        return next.slice(0, 8);
      });

      setCitySearchInput("");
      if (closeLeftDrawer) {
        setLeftDrawerOpen(false);
      }
    } catch (err: any) {
      setWeatherError(err.message || "无法获取该城市实时天气，请稍后再试。");
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Load real live weather for initial city (南京) on mount
  useEffect(() => {
    switchToCity(initialCity.name);
  }, []);

  const handleCitySearchSubmit = (
    e: React.FormEvent,
    closeLeftDrawer = false
  ) => {
    e.preventDefault();
    if (!citySearchInput.trim()) return;
    switchToCity(citySearchInput, closeLeftDrawer);
  };

  const getWeatherIcon = (cond: WeatherConditionType, className = "w-5 h-5") => {
    switch (cond) {
      case "Sunny":
        return <Sun className={`${className} text-amber-400`} />;
      case "Rainy":
        return <CloudRain className={`${className} text-sky-400`} />;
      case "Snowy":
        return <Snowflake className={`${className} text-cyan-200`} />;
      case "Overcast":
        return <Cloud className={`${className} text-slate-300`} />;
      case "Windy":
        return <Wind className={`${className} text-teal-300`} />;
      case "Thunderstorm":
        return <CloudLightning className={`${className} text-indigo-400`} />;
      case "Foggy":
        return <Haze className={`${className} text-slate-300`} />;
      default:
        return <Sun className={`${className} text-amber-400`} />;
    }
  };

  // 4. Camera Shutter Effect
  const [shutterFlash, setShutterFlash] = useState(false);
  const [savedPhotos, setSavedPhotos] = useState<
    {
      id: string;
      city: string;
      landmark: string;
      condition: string;
      temp: number;
      time: string;
    }[]
  >([]);
  const [photoNotification, setPhotoNotification] = useState<string | null>(
    null
  );

  const handleCapturePhoto = () => {
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 220);

    const newPhoto = {
      id: `photo-${Date.now()}`,
      city: activeCity.name,
      landmark: activeLandmark?.name || activeCity.name,
      condition: weatherMetrics.condition,
      temp: weatherMetrics.temp,
      time: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };

    setSavedPhotos((prev) => [newPhoto, ...prev]);
    setPhotoNotification(
      `已保存「${newPhoto.landmark}」在 ${weatherMetrics.condition} (${weatherMetrics.temp}°C) 下的旅行快照。`
    );

    setTimeout(() => {
      setPhotoNotification(null);
    }, 4500);
  };

  // 5. AI Itinerary Planner state
  const [itineraryDays, setItineraryDays] = useState<number>(3);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "观光",
    "摄影",
    "地标打卡",
  ]);
  const [itineraryResult, setItineraryResult] =
    useState<TravelItinerary | null>(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState<boolean>(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(1);

  const interestTags = [
    "观光",
    "摄影",
    "地标打卡",
    "饕餮美食",
    "历史文化",
    "亲子休闲",
    "户外徒步",
    "艺术展览",
    "民俗体验",
  ];

  const toggleInterest = (tag: string) => {
    setSelectedInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerateItinerary = async () => {
    setIsLoadingItinerary(true);
    setItineraryError(null);
    setItineraryResult(null);

    try {
      const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: activeCity.name,
          days: itineraryDays,
          interests: selectedInterests,
          currentWeather: weatherMetrics,
        }),
      });

      if (!response.ok) {
        throw new Error("服务器连接异常，无法生成规划。");
      }

      const data = await response.json();
      setItineraryResult(data);
      setExpandedDay(1);
    } catch (err) {
      console.error(err);
      setItineraryError("行程规划生成失败，请稍后重试。");
    } finally {
      setIsLoadingItinerary(false);
    }
  };

  // 6. AI Tour Guide Chatbot state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [isGeneratingChat, setIsGeneratingChat] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const landmarkName = activeLandmark?.name || activeCity.name;
    setChatMessages([
      {
        id: `msg-welcome-${activeCity.id}-${landmarkName}`,
        role: "assistant",
        content: `你好！我是您在「${activeCity.name}」的导游助手。当前「${landmarkName}」实时天气为 ${weatherMetrics.condition}，气温 ${weatherMetrics.temp}°C。关于这里的多处标志性建筑、摄影机位或出行穿衣建议，欢迎随时提问。`,
        timestamp: new Date(),
      },
    ]);
  }, [activeCity.id, activeLandmark?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isGeneratingChat) return;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsGeneratingChat(true);

    try {
      const history = chatMessages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/weather-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: activeCity.name,
          landmark: activeLandmark?.name || activeCity.name,
          weather: weatherMetrics,
          message: userMsg.content,
          history,
        }),
      });

      if (!response.ok) {
        throw new Error("智能对话异常");
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-assistant-${Date.now()}`,
          role: "assistant",
          content: data.text,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-error-${Date.now()}`,
          role: "assistant",
          content: "抱歉，导游连接暂时中断，请稍后再试一次。",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGeneratingChat(false);
    }
  };

  const openRightDrawerTab = (tab: RightDrawerTab) => {
    setActiveTab(tab);
    setLeftDrawerOpen(false);
    setRightDrawerOpen(true);
  };

  const formattedDate = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <div className="relative min-h-screen text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white overflow-x-hidden">
      {/* Layer 1: Immersive Background Cityscape */}
      <ScenicLandmark
        landmarkId={activeCity.landmarkSvgId}
        cityName={activeCity.name}
        condition={weatherMetrics.conditionType}
      />

      {/* Layer 2: Dynamic Atmospheric Radial Gradient Transition */}
      <AtmosphericGradientLayer condition={weatherMetrics.conditionType} />

      {/* Layer 3: Global Weather Particle Overlay driven by live weather & wind turbulence */}
      <WeatherParticleLayer
        condition={weatherMetrics.conditionType}
        windSpeed={weatherMetrics.windSpeed}
      />

      {/* Flying Cartoon Owl Weather Companion */}
      <WeatherOwl
        cityName={activeCity.name}
        weather={weatherMetrics}
        forecast={forecastDays}
        drawerOpen={leftDrawerOpen || rightDrawerOpen}
        onOpenItinerary={() => openRightDrawerTab("itinerary")}
        onOpenChat={() => openRightDrawerTab("chat")}
      />

      {/* Camera Shutter Flash overlay */}
      <AnimatePresence>
        {shutterFlash && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-white z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left Zone: Wordmark + Left Drawer Button */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setRightDrawerOpen(false);
                setLeftDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="打开城市搜索与快照抽屉"
            >
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>{activeCity.name}</span>
            </button>

            <span className="hidden md:inline text-base font-bold tracking-tight text-white whitespace-nowrap">
              Weather City Explorer
            </span>
          </div>

          {/* Center Zone: Direct City Input Switcher */}
          <form
            onSubmit={(e) => handleCitySearchSubmit(e, false)}
            className="flex-1 max-w-sm flex items-center gap-1.5 bg-white/10 border border-white/15 rounded-xl px-3 py-1.5 focus-within:border-teal-400 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-300 shrink-0" />
            <input
              type="text"
              value={citySearchInput}
              onChange={(e) => setCitySearchInput(e.target.value)}
              placeholder="输入城市名切换真实天气（如：南京、成都）"
              className="w-full bg-transparent text-xs text-white placeholder-slate-300/80 focus:outline-none min-w-0"
              aria-label="输入城市名切换天气"
            />
            <button
              type="submit"
              disabled={isLoadingWeather || !citySearchInput.trim()}
              className="px-2.5 py-1 rounded-lg bg-teal-400 hover:bg-teal-300 disabled:bg-white/10 text-slate-950 disabled:text-slate-400 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isLoadingWeather ? "查询中" : "切换"}
            </button>
          </form>

          {/* Right Zone: Drawer Quick Triggers */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openRightDrawerTab("landmark")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                rightDrawerOpen && activeTab === "landmark"
                  ? "bg-teal-500/20 border-teal-400 text-teal-200"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden lg:inline">城市地标</span>
            </button>

            <button
              type="button"
              onClick={() => openRightDrawerTab("forecast")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                rightDrawerOpen && activeTab === "forecast"
                  ? "bg-teal-500/20 border-teal-400 text-teal-200"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">七日预报</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Centered Stage: Minimalist Real Weather HUD */}
      <main className="relative z-20 max-w-2xl mx-auto min-h-[calc(100vh-4rem)] px-4 py-8 flex flex-col items-center justify-center gap-6">
        {/* Error alert if search fails */}
        <AnimatePresence>
          {weatherError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full bg-rose-950/80 border border-rose-400/30 text-rose-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between gap-3 backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{weatherError}</span>
              </div>
              <button
                type="button"
                onClick={() => setWeatherError(null)}
                className="text-rose-300 hover:text-white cursor-pointer"
                aria-label="关闭错误提示"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Real Weather HUD */}
        <section className="text-center flex flex-col items-center justify-center select-none">
          <div className="flex items-center gap-2 text-xs text-slate-200/90 font-medium tracking-wide drop-shadow">
            <span>{activeCity.country || "全球城市"}</span>
            {activeCity.admin1 && activeCity.admin1 !== activeCity.name && (
              <>
                <span aria-hidden="true">·</span>
                <span>{activeCity.admin1}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{activeLandmark?.name}</span>
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.75)]">
              {activeCity.name}
            </h1>
            <button
              type="button"
              onClick={() => switchToCity(activeCity.name)}
              disabled={isLoadingWeather}
              title="刷新实时气象数据"
              className="p-2 rounded-full bg-slate-950/45 hover:bg-slate-950/70 border border-white/15 text-slate-200 transition-colors cursor-pointer"
              aria-label="刷新当前城市实时天气"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoadingWeather ? "animate-spin text-teal-300" : ""}`}
              />
            </button>
          </div>

          <p className="text-xs text-slate-200/85 mt-1.5 drop-shadow">
            {formattedDate}
            {lastUpdatedTime && ` · 实况更新 ${lastUpdatedTime}`}
          </p>

          <div className="flex items-center justify-center gap-5 mt-6">
            {getWeatherIcon(
              weatherMetrics.conditionType,
              "w-14 h-14 sm:w-16 sm:h-16 drop-shadow-[0_4px_14px_rgba(0,0,0,0.5)]"
            )}
            <span className="text-6xl sm:text-7xl font-light font-mono tabular-nums text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]">
              {weatherMetrics.temp}°C
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 bg-slate-950/55 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15 text-xs font-medium text-slate-100 shadow-lg">
            <span className="text-teal-300 font-semibold">
              {weatherMetrics.condition}
            </span>
            <span className="text-white/25" aria-hidden="true">
              |
            </span>
            <span className="font-mono tabular-nums text-slate-200">
              体感 {weatherMetrics.apparentTemp ?? weatherMetrics.temp}°C
            </span>
            <span className="text-white/25" aria-hidden="true">
              |
            </span>
            <span className="font-mono tabular-nums text-slate-200">
              AQI {weatherMetrics.aqi} · {weatherMetrics.aqiLabel}
            </span>
          </div>

          {/* Primary Capture Action */}
          <div className="mt-6 flex items-center justify-center">
            <button
              type="button"
              onClick={handleCapturePhoto}
              className="flex items-center gap-2 bg-slate-950/65 hover:bg-teal-400 hover:text-slate-950 text-white backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold transition-all duration-200 shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Camera className="w-4 h-4" />
              <span>捕获当下</span>
              {savedPhotos.length > 0 && (
                <span className="font-mono tabular-nums text-[11px] opacity-80">
                  ({savedPhotos.length})
                </span>
              )}
            </button>
          </div>
        </section>

        {/* Photo capture confirmation toast */}
        <AnimatePresence>
          {photoNotification && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="w-full bg-slate-950/75 border border-emerald-400/30 text-emerald-200 text-xs px-4 py-3 rounded-xl flex items-center justify-between gap-3 backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{photoNotification}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRightDrawerOpen(false);
                  setLeftDrawerOpen(true);
                }}
                className="text-teal-300 hover:text-teal-200 font-medium underline underline-offset-2 shrink-0 cursor-pointer"
              >
                打开画廊
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ==================== LEFT DRAWER: Custom City Input, Recent Cities & Snapshot Gallery ==================== */}
      <AnimatePresence>
        {leftDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setLeftDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-sm bg-slate-950/92 backdrop-blur-xl border-r border-white/15 shadow-2xl flex flex-col"
              aria-label="城市切换与旅行画廊抽屉"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <h2 className="text-sm font-semibold text-white">切换城市与快照</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="关闭城市抽屉"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Custom City Search Form */}
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-slate-200 block">
                    输入任意城市获取实时天气
                  </label>
                  <form
                    onSubmit={(e) => handleCitySearchSubmit(e, true)}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={citySearchInput}
                      onChange={(e) => setCitySearchInput(e.target.value)}
                      placeholder="例如：南京、苏州、成都、京都..."
                      className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingWeather || !citySearchInput.trim()}
                      className="px-3.5 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 disabled:bg-white/10 text-slate-950 disabled:text-slate-400 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      查询
                    </button>
                  </form>
                </div>

                {/* Recent Searched Cities */}
                {recentCities.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-semibold text-slate-300">最近查看</h3>
                    <div className="flex flex-wrap gap-2">
                      {recentCities.map((cName) => {
                        const isCurrent = cName === activeCity.name;
                        return (
                          <button
                            key={cName}
                            type="button"
                            onClick={() => switchToCity(cName, true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                              isCurrent
                                ? "bg-teal-500/20 border-teal-400 text-teal-200"
                                : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                            }`}
                          >
                            {cName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Popular Quick-Pick Cities */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-slate-300">热门城市直达</h3>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_CITIES.map((cName) => (
                      <button
                        key={cName}
                        type="button"
                        onClick={() => switchToCity(cName, true)}
                        className="px-2.5 py-1 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {cName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Wishlist (To-Do List) */}
                <div className="pt-5 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>旅行心愿单</span>
                    </h3>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400">
                      {wishlist.filter((w) => !w.visited).length} 待出发
                    </span>
                  </div>

                  <form onSubmit={handleAddWishlist} className="flex gap-2">
                    <input
                      type="text"
                      value={wishlistInput}
                      onChange={(e) => setWishlistInput(e.target.value)}
                      placeholder="添加想去的城市..."
                      className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                    />
                    <button
                      type="submit"
                      disabled={!wishlistInput.trim()}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-teal-400 hover:text-slate-950 disabled:opacity-40 text-slate-100 text-xs font-medium transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>添加</span>
                    </button>
                  </form>

                  {wishlist.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2">
                      心愿单暂无城市，添加一个开启下一段旅程吧。
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {wishlist.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleWishlist(item.id)}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 cursor-pointer ${
                                item.visited
                                  ? "bg-teal-400 border-teal-400 text-slate-950"
                                  : "border-white/30 hover:border-teal-400"
                              }`}
                              aria-label={item.visited ? "标记为未前往" : "标记为已打卡"}
                            >
                              {item.visited && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => switchToCity(item.city, true)}
                              className={`text-xs text-left truncate flex-1 cursor-pointer transition-colors ${
                                item.visited
                                  ? "line-through text-slate-400 hover:text-slate-200"
                                  : "text-slate-100 hover:text-teal-300 font-medium"
                              }`}
                              title={`点击切换到 ${item.city}`}
                            >
                              {item.city}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveWishlist(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                            aria-label={`从心愿单移除 ${item.city}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Active City Overview */}
                <div className="pt-5 border-t border-white/10 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    {activeCity.name} · 城市概览
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeCity.introduction}
                  </p>
                </div>

                {/* Travel Snapshot Gallery */}
                <div className="pt-5 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-300">旅行快照画廊</h3>
                    <span className="text-xs font-mono tabular-nums text-teal-300">
                      {savedPhotos.length} 张
                    </span>
                  </div>

                  {savedPhotos.length === 0 ? (
                    <div className="text-center py-6 px-4 text-xs text-slate-400 border border-dashed border-white/15 rounded-xl">
                      暂无快照记录，点击主界面「捕获当下」即可保存当前城市光影。
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {savedPhotos.map((p) => (
                        <div
                          key={p.id}
                          className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs"
                        >
                          <span className="font-semibold text-slate-100 block truncate">
                            {p.landmark}
                          </span>
                          <span className="text-teal-300 block mt-0.5 font-mono tabular-nums text-[11px]">
                            {p.condition} · {p.temp}°C
                          </span>
                          <span className="text-slate-400 block font-mono tabular-nums text-[10px] mt-1">
                            {p.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ==================== RIGHT DRAWER: Multi-Landmark Guide, 7-Day Forecast, AI Itinerary & AI Chat ==================== */}
      <AnimatePresence>
        {rightDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setRightDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-950/92 backdrop-blur-xl border-l border-white/15 shadow-2xl flex flex-col"
              aria-label="地标建筑、七日预报与AI助手抽屉"
            >
              {/* Drawer Header + 4-Tab Bar */}
              <div className="px-5 pt-4 pb-3 border-b border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Compass className="w-4 h-4 text-teal-400 shrink-0" />
                    <h2 className="text-sm font-semibold text-white truncate">
                      {activeCity.name} · {activeLandmark?.name}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRightDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="关闭右侧抽屉"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 bg-white/5 p-1 rounded-xl border border-white/10 gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("landmark")}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                      activeTab === "landmark"
                        ? "bg-slate-800 text-teal-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Landmark className="w-3.5 h-3.5" />
                    <span>地标</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("forecast")}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                      activeTab === "forecast"
                        ? "bg-slate-800 text-teal-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>七日预报</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("itinerary")}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                      activeTab === "itinerary"
                        ? "bg-slate-800 text-teal-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI 行程</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("chat")}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
                      activeTab === "chat"
                        ? "bg-slate-800 text-teal-300 shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>AI 导游</span>
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* TAB 1: Multi-Landmark Directory & Photo Guide */}
                {activeTab === "landmark" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-300 mb-2.5">
                        {activeCity.name} 标志性建筑（点击切换当前地标视角）
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {activeCity.landmarks.map((lm) => {
                          const isSelected = lm.id === activeLandmark?.id;
                          return (
                            <button
                              key={lm.id}
                              type="button"
                              onClick={() => setActiveLandmarkId(lm.id)}
                              className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-teal-500/15 border-teal-400 text-white"
                                  : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                              }`}
                            >
                              <span className="text-xs font-semibold block truncate">
                                {lm.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                                {lm.subtitle}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {activeLandmark && (
                      <div className="pt-5 border-t border-white/10 space-y-5">
                        <div>
                          <h4 className="text-base font-semibold text-white">
                            {activeLandmark.name}
                          </h4>
                          <p className="text-[11px] text-teal-300 mt-0.5">
                            {activeLandmark.subtitle}
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed mt-2.5">
                            {activeLandmark.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <h5 className="text-xs font-semibold text-slate-200 mb-1.5">
                            历史人文由来
                          </h5>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {activeLandmark.history}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <h5 className="text-xs font-semibold text-amber-300 mb-2.5 flex items-center gap-1.5">
                            <Camera className="w-4 h-4" />
                            <span>摄影机位与取景建议</span>
                          </h5>
                          <ul className="space-y-2.5 text-xs text-slate-200">
                            {activeLandmark.photoTips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                                <span className="font-mono tabular-nums text-teal-400 font-semibold shrink-0">
                                  0{idx + 1}.
                                </span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-start gap-3">
                          <Clock className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-200 block">
                              推荐游览时段
                            </span>
                            <span className="text-slate-300 mt-1 block leading-relaxed">
                              {activeLandmark.bestTime}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Live Metrics & 7-Day Real Forecast Drawer View */}
                {activeTab === "forecast" && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {activeCity.name} · 实况指标与七日预报
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          实时气象详情与未来一周气温降水趋势
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchToCity(activeCity.name)}
                        disabled={isLoadingWeather}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                        aria-label="刷新气象数据"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isLoadingWeather ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>

                    {/* 6 Real-Time Atmospheric Metrics moved inside Drawer */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div>
                        <span className="text-[11px] text-slate-400 block">相对湿度</span>
                        <span className="text-base font-semibold font-mono tabular-nums text-slate-100 mt-0.5 block">
                          {weatherMetrics.humidity}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">实时风速</span>
                        <span className="text-base font-semibold font-mono tabular-nums text-slate-100 mt-0.5 block">
                          {weatherMetrics.windSpeed}{" "}
                          <span className="text-xs font-normal text-slate-400">km/h</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">风力等级</span>
                        <span className="text-sm font-semibold text-slate-100 mt-1 block">
                          {weatherMetrics.wind}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">空气质量</span>
                        <span className="text-base font-semibold font-mono tabular-nums text-slate-100 mt-0.5 block">
                          {weatherMetrics.aqi}{" "}
                          <span className="text-xs font-medium text-emerald-400">
                            {weatherMetrics.aqiLabel}
                          </span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">紫外线指数</span>
                        <span className="text-base font-semibold font-mono tabular-nums text-slate-100 mt-0.5 block">
                          {weatherMetrics.uvIndex}{" "}
                          <span className="text-xs font-normal text-slate-400">/11</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">大气压强</span>
                        <span className="text-base font-semibold font-mono tabular-nums text-slate-100 mt-0.5 block">
                          {weatherMetrics.pressure}{" "}
                          <span className="text-xs font-normal text-slate-400">hPa</span>
                        </span>
                      </div>
                    </div>

                    {forecastDays.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-400">
                        正在加载未来七日预报...
                      </div>
                    ) : (
                      <div className="divide-y divide-white/10 border border-white/10 rounded-2xl bg-white/5 overflow-hidden">
                        {forecastDays.map((day, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-3.5 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="w-20 shrink-0">
                              <span className="font-semibold text-slate-100 block">
                                {day.dayName}
                              </span>
                              {day.date && (
                                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                                  {day.date.slice(5)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {getWeatherIcon(day.conditionType, "w-5 h-5 shrink-0")}
                              <div className="min-w-0">
                                <span className="text-slate-200 font-medium block truncate">
                                  {day.condition}
                                </span>
                                {day.precipitation > 0 && (
                                  <span className="text-[11px] text-sky-300 font-mono tabular-nums">
                                    降水概率 {day.precipitation}%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right font-mono tabular-nums shrink-0">
                              <span className="text-slate-400">{day.tempMin}°</span>
                              <span className="text-slate-500 mx-1">/</span>
                              <span className="text-white font-semibold">{day.tempMax}°C</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: AI Weather-Aware Itinerary Planner */}
                {activeTab === "itinerary" && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-white">AI 气象行程规划</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        结合「{activeCity.name}」当前实况 {weatherMetrics.condition} (
                        {weatherMetrics.temp}°C) 定制路线
                      </p>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="text-slate-300 font-medium block mb-2">游玩天数</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 5, 7].map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setItineraryDays(d)}
                              className={`flex-1 py-2 rounded-lg border text-center font-mono tabular-nums font-semibold transition-colors cursor-pointer ${
                                itineraryDays === d
                                  ? "bg-teal-500/20 border-teal-400 text-teal-200"
                                  : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {d} 天
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-slate-300 font-medium block mb-2">
                          兴趣偏好（多选）
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {interestTags.map((tag) => {
                            const isSelected = selectedInterests.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleInterest(tag)}
                                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200"
                                    : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-200"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateItinerary}
                        disabled={isLoadingItinerary}
                        className="w-full py-2.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                      >
                        {isLoadingItinerary ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>正在规划气象路线...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>生成 AI 天气特色行程</span>
                          </>
                        )}
                      </button>
                    </div>

                    {itineraryError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{itineraryError}</span>
                      </div>
                    )}

                    {itineraryResult && (
                      <div className="space-y-5 pt-4 border-t border-white/10 text-xs">
                        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10">
                          <h4 className="font-semibold text-slate-100 mb-1.5">行前气象建议</h4>
                          <p className="text-slate-300 leading-relaxed">{itineraryResult.summary}</p>
                        </div>

                        <div className="space-y-2.5">
                          <h4 className="font-semibold text-slate-300">每日行程安排</h4>
                          {itineraryResult.days.map((day) => {
                            const isExpanded = expandedDay === day.dayNumber;
                            return (
                              <div
                                key={day.dayNumber}
                                className="border border-white/10 rounded-xl bg-white/5 overflow-hidden"
                              >
                                <button
                                  type="button"
                                  onClick={() => setExpandedDay(isExpanded ? 0 : day.dayNumber)}
                                  className="w-full text-left p-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono tabular-nums text-teal-300 font-semibold shrink-0">
                                      Day {day.dayNumber}
                                    </span>
                                    <span className="font-medium text-slate-100 truncate">
                                      {day.theme}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 text-[11px] shrink-0 ml-2">
                                    {isExpanded ? "收起" : "展开"}
                                  </span>
                                </button>

                                {isExpanded && (
                                  <div className="p-3.5 border-t border-white/10 space-y-4 bg-slate-950/40">
                                    {day.activities.map((act, idx) => (
                                      <div key={idx} className="space-y-1">
                                        <div className="flex items-center justify-between text-[11px]">
                                          <span className="text-teal-300 font-mono tabular-nums font-semibold">
                                            {act.time}
                                          </span>
                                          <span className="text-slate-400 font-mono tabular-nums">
                                            {act.costEstimate}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <h5 className="font-semibold text-slate-100">{act.title}</h5>
                                          {act.landmarkConnection && (
                                            <span className="text-[11px] text-amber-300">
                                              · 核心地标
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-slate-300 leading-relaxed">
                                          {act.description}
                                        </p>
                                        <p className="text-[11px] text-slate-400">{act.location}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-2.5">
                          <h4 className="font-semibold text-cyan-300">周边探索推荐</h4>
                          {itineraryResult.nearbyRecommendations.map((rec, idx) => (
                            <div
                              key={idx}
                              className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-slate-100">{rec.name}</span>
                                  <span className="text-[11px] text-slate-400">{rec.category}</span>
                                </div>
                                <p className="text-slate-300 mt-1 leading-relaxed">{rec.reason}</p>
                              </div>
                              <span className="text-[11px] font-mono tabular-nums text-teal-300 shrink-0">
                                {rec.distance}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Local AI Tour Guide Chat */}
                {activeTab === "chat" && (
                  <div className="flex flex-col h-full min-h-[420px] justify-between gap-3">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-100">
                          {activeLandmark?.name || activeCity.name} 导游助手
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          结合实时 {weatherMetrics.condition} ({weatherMetrics.temp}°C) 讲解
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChatMessages([
                            {
                              id: `msg-welcome-clear-${activeCity.id}`,
                              role: "assistant",
                              content: `欢迎来到「${activeCity.name}」！请问有什么我可以为您介绍的？`,
                              timestamp: new Date(),
                            },
                          ]);
                        }}
                        className="text-xs text-slate-300 hover:text-white bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        清空会话
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {chatMessages.map((msg) => {
                        const isAssistant = msg.role === "assistant";
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2.5 ${isAssistant ? "justify-start" : "justify-end"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                                isAssistant
                                  ? "bg-white/10 text-slate-100 border border-white/10 rounded-tl-none"
                                  : "bg-teal-400 text-slate-950 font-medium rounded-tr-none"
                              }`}
                            >
                              <div className="whitespace-pre-line">{msg.content}</div>
                              <span
                                className={`block text-[10px] text-right mt-1 font-mono tabular-nums ${
                                  isAssistant ? "text-slate-400" : "text-slate-900/70"
                                }`}
                              >
                                {msg.timestamp.toLocaleTimeString("zh-CN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {isGeneratingChat && (
                        <div className="flex justify-start">
                          <div className="bg-white/10 border border-white/10 text-slate-300 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs">
                            正在整理回答...
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form
                      onSubmit={handleSendChatMessage}
                      className="flex gap-2 border-t border-white/10 pt-3"
                    >
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`询问有关 ${activeLandmark?.name || activeCity.name} 的故事或建议...`}
                        disabled={isGeneratingChat}
                        className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-400 placeholder-slate-400 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={isGeneratingChat || !chatInput.trim()}
                        className="bg-teal-400 hover:bg-teal-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 px-3.5 rounded-xl transition-colors font-semibold text-xs flex items-center justify-center shrink-0 cursor-pointer"
                        aria-label="发送消息"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
