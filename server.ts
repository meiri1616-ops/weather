import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for lazy initializing GoogleGenAI client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY is not configured. Please set your API key in the Settings > Secrets menu in AI Studio.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. API: Custom AI Travel Itinerary & Tour Planner
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { city, days, interests, currentWeather } = req.body;
    
    if (!city) {
      return res.status(400).json({ error: "City is required" });
    }

    const duration = parseInt(days) || 3;
    const interestList = Array.isArray(interests) ? interests.join(", ") : (interests || "观光, 摄影, 地标打卡");
    const weatherStr = currentWeather ? `当前天气状况: ${currentWeather.condition} (温度 ${currentWeather.temp}°C, 风速 ${currentWeather.wind}, 湿度 ${currentWeather.humidity})` : "当前天气: 晴朗宜人";

    const prompt = `你是一位世界级的金牌导游和行程规划师。请为城市 [${city}] 精心制定一个为期 ${duration} 天的个性化旅行行程。
根据用户的兴趣偏好: [${interestList}]。
结合该城市的当前气象环境: [${weatherStr}]，提供实时的穿衣、携带物品以及天气应急方案（例如雨天多安排室内博物馆，晴天安排户外地标和观景台）。

请务必将该城市的标志性地标建筑巧妙融合进每日的行程和推荐中（例如，如果城市是巴黎，融入埃菲尔铁塔；如果是北京，融入故宫等）。

请严格按照指定的JSON结构输出，不需要包含任何Markdown标记或其他的文字。`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              city: { type: Type.STRING },
              summary: { type: Type.STRING, description: "结合天气和用户兴趣的旅行前言与实用气象打包建议。" },
              days: {
                type: Type.ARRAY,
                description: "按天排列的行程列表",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    theme: { type: Type.STRING, description: "今日行程主题，如 '探寻历史底蕴' 或 '艺术与现代碰撞'" },
                    activities: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          time: { type: Type.STRING, description: "活动时间段，如 '上午 09:00' 或 '傍晚 18:00'" },
                          title: { type: Type.STRING, description: "景点或活动名称" },
                          description: { type: Type.STRING, description: "详细游玩建议、路线安排，并明确指出针对当前天气的定制提醒（如：今天下雨，特别推荐在这里避雨观赏，或今天晴朗，建议登顶拍摄等）" },
                          location: { type: Type.STRING, description: "景点具体位置" },
                          costEstimate: { type: Type.STRING, description: "预估人均花费，如 '免费', '¥80元', '¥150元'" },
                          landmarkConnection: { type: Type.BOOLEAN, description: "是否属于城市核心标志建筑/景区" }
                        },
                        required: ["time", "title", "description", "location", "costEstimate", "landmarkConnection"]
                      }
                    }
                  },
                  required: ["dayNumber", "theme", "activities"]
                }
              },
              nearbyRecommendations: {
                type: Type.ARRAY,
                description: "基于用户兴趣的特色周边游、小众体验或美食街推荐（2-3个）",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "推荐项目或地点名称" },
                    category: { type: Type.STRING, description: "类别：如 美食、户外、文化、摄影、休闲" },
                    reason: { type: Type.STRING, description: "个性化推荐原因，说明为什么适合该用户的兴趣" },
                    distance: { type: Type.STRING, description: "距离市中心的相对距离，如 '车程30分钟', '约5公里'" }
                  },
                  required: ["name", "category", "reason", "distance"]
                }
              }
            },
            required: ["city", "summary", "days", "nearbyRecommendations"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini.");
      }
      
      const parsedData = JSON.parse(text.trim());
      res.json(parsedData);
    } catch (apiError: any) {
      console.warn("Gemini API error or missing API Key, utilizing local dynamic generator fallback:", apiError.message);
      
      // Fallback response with beautiful dynamic data if API is offline/key missing
      const fallbackResponse = generateFallbackItinerary(city, duration, interestList, currentWeather);
      res.json({
        ...fallbackResponse,
        isDemo: true,
        errorMessage: apiError.message.includes("GEMINI_API_KEY") ? "API_KEY_MISSING" : "API_ERROR"
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. API: Weather & Landmark AI Chat Assistant
app.post("/api/weather-chat", async (req, res) => {
  try {
    const { city, landmark, weather, message, history } = req.body;
    
    if (!city || !message) {
      return res.status(400).json({ error: "City and message are required" });
    }

    const weatherInfo = weather ? `${weather.condition}, 气温 ${weather.temp}°C, 湿度 ${weather.humidity}, 风速 ${weather.wind}` : "晴朗";
    
    const systemInstruction = `你是一位风趣、博学多才的城市地标金牌导游。
你正在带游客游览 [${city}]，目前正在标志性建筑 [${landmark}] 前。
当下的天气状况是: [${weatherInfo}]。
你需要围绕以下要求进行回答：
1. 语言亲切、专业、充满故事感。多用导游的口吻（“各位游客朋友们”、“我们现在看到的就是...”）。
2. 在回答游客提问时，巧妙、生动地将当下的天气状况（如：下雨、刮风、下雪、炎热等）融入进解说中（比如雨天的石板路更有质感，晴天的金顶闪闪发光，或者大雾天气下地标若隐若现的科幻感）。
3. 突出 [${landmark}] 的历史由来、文化背景、最佳摄影机位。
4. 提供实用的地标周边避雨、消暑或取暖的小店/咖啡馆推荐。
5. 请用简短生动的排版，字数控制在 250 字以内，避免啰嗦。`;

    try {
      const ai = getGeminiClient();
      
      // Use standard chat structure or generateContent
      const contents = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }]
          });
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });

      res.json({ text: response.text });
    } catch (apiError: any) {
      console.warn("Gemini Chat API Error, utilizing fallback chatbot responses:", apiError.message);
      
      const fallbackAnswer = getFallbackChatResponse(city, landmark, weather, message);
      res.json({
        text: fallbackAnswer,
        isDemo: true,
        errorMessage: apiError.message.includes("GEMINI_API_KEY") ? "API_KEY_MISSING" : "API_ERROR"
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Helper for generating interesting travel plans when Gemini is offline
function generateFallbackItinerary(city: string, duration: number, interests: string, weather: any) {
  const weatherStr = weather ? `${weather.condition}` : "晴朗";
  const tempStr = weather ? `${weather.temp}°C` : "22°C";
  
  const dayThemes = [
    { theme: "初识经典与历史地标", activities: [
      { time: "上午 09:30", title: "核心地标深度探索", description: `在当前的 [${weatherStr}] 天气下开启旅程。建议带上相机捕捉地标建筑的独特风貌。晴天适合在广场漫步拍摄，若有风雨则可多在周边的博物馆展厅内驻足，细细品味历史岁月的沉淀。`, location: "市中心地标广场", costEstimate: "¥120", landmarkConnection: true },
      { time: "下午 14:00", title: "文化风情老街漫游", description: "游览城市底蕴深厚的历史文化老街，品尝当地特色小吃（如热气腾腾的特色汤点、冰镇甜品）。在临街手艺茶馆里歇歇脚，听段地道的小曲或故事。", location: "老城文化古街", costEstimate: "¥50", landmarkConnection: false },
      { time: "晚上 19:30", title: "璀璨夜景璀璨华灯观赏", description: "乘着夜风，登上最佳观景台或乘坐游船。夜晚地标建筑在霓虹灯装点下分外迷人，是摄影爱好者绝佳的延时摄影创作时间。", location: "滨江/高空观景台", costEstimate: "¥80", landmarkConnection: true }
    ]},
    { theme: "现代创意与都市格调", activities: [
      { time: "上午 10:00", title: "先锋艺术街区打卡", description: "由废旧工业厂房或老仓库改建而成的艺术园区。里面布满了创意画廊、设计师买手店和极具个性的涂鸦墙，适合漫步打卡。", location: "798创意艺术区", costEstimate: "免费", landmarkConnection: false },
      { time: "下午 13:30", title: "地道美食深度搜寻", description: "由金牌吃货推荐的口碑美食街。无论是街头老字号还是精致网红融合菜，都能满足你挑剔的味蕾。注意在炎热或雨天选择有空调的特色包间。", location: "饕餮风味美食汇", costEstimate: "¥90", landmarkConnection: false },
      { time: "下午 16:00", title: "云端奢享英式下午茶", description: "在高空旋转餐厅或云端咖啡厅，一边俯瞰这座城市壮丽的天际线和地标轮廓，一边惬意享受精致的茶点与悠闲的午后时光。", location: "地标天际观光厅", costEstimate: "¥150", landmarkConnection: true }
    ]},
    { theme: "周边探索与自然秘境", activities: [
      { time: "上午 08:30", title: "远郊自然生态氧吧", description: "离开城市喧嚣，前往周边风景如画的山林或湖畔。在这里可以进行轻度徒步、呼吸新鲜空气，天气好时湖光山色倒映，如诗如画。", location: "市郊森林公园/静谧湖畔", costEstimate: "¥40", landmarkConnection: false },
      { time: "下午 14:00", title: "人文古镇慢生活体验", description: "探索市郊有着数百年历史的宁静古镇，走在青石板路上，拜访传统手工作坊，动手体验一次非遗陶艺或扎染制作，带走一份专属的旅行纪念。", location: "江南/城郊水乡古镇", costEstimate: "¥60", landmarkConnection: false }
    ]}
  ];

  const daysData = [];
  for (let i = 1; i <= duration; i++) {
    const templateIndex = (i - 1) % dayThemes.length;
    const template = dayThemes[templateIndex];
    daysData.push({
      dayNumber: i,
      theme: `第 ${i} 天: ` + template.theme,
      activities: template.activities.map(act => ({
        ...act,
        description: act.description.replace(/当前/g, weatherStr)
      }))
    });
  }

  return {
    city,
    summary: `【天气旅行指南】当前 [${city}] 的天气为 [${weatherStr}]，气温约为 [${tempStr}]。我们为你量身打造了结合 [${interests}] 偏好的专属路线。建议携带折叠伞或防晒装备，并灵活调整室外景点的停留时间。核心标志性地标已为你贴心穿插其中，保证经典与舒适并存！`,
    days: daysData,
    nearbyRecommendations: [
      { name: `${city}特色微度假·古镇慢游`, category: "文化/古镇", reason: `迎合你对 "${interests}" 的兴趣，避开拥挤人群，在古色古香的慢节奏中感受当地人文风情。`, distance: "约25公里" },
      { name: "云雾山谷生态徒步线", category: "户外/观光", reason: "空气清新，植被茂密，能拍摄到绝佳的山川河流全景，是洗肺和户外摄影的极佳去处。", distance: "车程1小时" },
      { name: "地道非遗民俗美食体验街", category: "美食/人文", reason: "汇集了数十种当地最纯正的手工风味，能看皮影戏或手工吹糖人，非常具有地方特色。", distance: "市中心3公里" }
    ]
  };
}

// Fallback chatbot chat answers
function getFallbackChatResponse(city: string, landmark: string, weather: any, message: string) {
  const condition = weather ? weather.condition : "晴";
  const temp = weather ? weather.temp : 24;
  
  const greetings = [
    `欢迎来到美丽的 [${city}]！我是您的金牌导游。现在我们正站在举世闻名的 [${landmark}] 前。今天这儿的天气是 [${condition}]，温度 ${temp}°C。`,
    `哈喽游客朋友！今天有幸由我带大家探访 [${city}] 的灵魂地标 [${landmark}]。看着这气象状态（${condition}，${temp}°C），真是别有一番风味！`
  ];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  const answers = [
    `关于您问的“${message}”，这可问对人了！[${landmark}] 凝聚了数代人的卓越智慧。在目前的 [${condition}] 天气下，最妙的观赏方法就是顺着中轴线往上看。晴天时金碧辉煌，雨天时水汽缭绕，瓦当上的雨水滑落，简直美得像一幅写意泼墨画。建议您在这个位置拍一张，刚好把天空和建筑融为一体！`,
    `对于“${message}”的疑问，其实背后有个非常精彩的故事。当年建造 [${landmark}] 时，工匠们就充分考虑了不同的气象条件，排水和光影设计都堪称鬼斧神工。像今天这样的 [${condition}] 日子，地标周边的游客不算太多，您可以到右侧的百年茶楼坐坐，点一杯招牌茶，听着檐下的雨声或享受温暖的阳光，俯瞰地标，绝对是一绝！`,
    `听到您的提问“${message}”，作为导游我感到十分欣喜！[${landmark}] 的魅力就在于四季不同、阴晴各异。比如今天，在 [${condition}] 的渲染下，整座建筑呈现出一种庄严而又温润的色调。悄悄告诉您，往左走两百米那间红砖咖啡馆，那里的临窗座位是拍地标全景的‘神仙机位’，而且提供限定的城市拉花咖啡，快去试试吧！`
  ];

  return `${greeting}\n\n${answers[Math.floor(Math.random() * answers.length)]}\n\n💡 导游温馨提示：当前天气变化快，请注意保暖或防晒。需要我为您规划接下来的地标周边游路线吗？`;
}

// Helper: Map WMO Weather Code to WeatherConditionType and Chinese label
function mapWmoWeather(code: number, windSpeedKmh = 0): {
  conditionType: "Sunny" | "Rainy" | "Snowy" | "Overcast" | "Thunderstorm" | "Foggy" | "Windy";
  condition: string;
} {
  if (code === 0) {
    return windSpeedKmh >= 28
      ? { conditionType: "Windy", condition: "晴朗大风" }
      : { conditionType: "Sunny", condition: "晴朗" };
  }
  if (code === 1) {
    return windSpeedKmh >= 28
      ? { conditionType: "Windy", condition: "晴间大风" }
      : { conditionType: "Sunny", condition: "晴间多云" };
  }
  if (code === 2) {
    return windSpeedKmh >= 28
      ? { conditionType: "Windy", condition: "多云大风" }
      : { conditionType: "Overcast", condition: "多云" };
  }
  if (code === 3) return { conditionType: "Overcast", condition: "阴天" };
  if (code === 45 || code === 48) return { conditionType: "Foggy", condition: "大雾" };
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) {
    return { conditionType: "Rainy", condition: "毛毛雨" };
  }
  if (code === 61 || code === 66) return { conditionType: "Rainy", condition: "小雨" };
  if (code === 63) return { conditionType: "Rainy", condition: "中雨" };
  if (code === 65 || code === 67) return { conditionType: "Rainy", condition: "大雨" };
  if (code === 71 || code === 77 || code === 85) return { conditionType: "Snowy", condition: "小雪" };
  if (code === 73) return { conditionType: "Snowy", condition: "中雪" };
  if (code === 75 || code === 86) return { conditionType: "Snowy", condition: "大雪" };
  if (code === 80 || code === 81 || code === 82) return { conditionType: "Rainy", condition: "阵雨" };
  if (code === 95 || code === 96 || code === 99) return { conditionType: "Thunderstorm", condition: "雷阵雨" };
  return { conditionType: "Overcast", condition: "多云" };
}

function getWindLevelText(windSpeed: number): string {
  const levels = [
    { max: 1, label: "0级 (无风)" },
    { max: 5, label: "1级 (软风)" },
    { max: 11, label: "2级 (轻风)" },
    { max: 19, label: "3级 (微风)" },
    { max: 28, label: "4级 (和风)" },
    { max: 38, label: "5级 (清风)" },
    { max: 49, label: "6级 (强风)" },
    { max: 61, label: "7级 (疾风)" },
  ];
  const matched = levels.find((l) => windSpeed <= l.max);
  return matched ? matched.label : "8级+ (大风)";
}

function getAqiLabel(aqi: number): string {
  if (aqi <= 50) return "优";
  if (aqi <= 100) return "良";
  if (aqi <= 150) return "轻度污染";
  if (aqi <= 200) return "中度污染";
  return "重度污染";
}

function getForecastDayLabel(dateStr: string, index: number): string {
  if (index === 0) return "今天";
  if (index === 1) return "明天";
  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const date = new Date(`${dateStr}T00:00:00`);
  return weekDays[date.getDay()] || dateStr.slice(5);
}

const CITY_SEARCH_ALIASES: Record<string, string> = {
  纽约: "New York",
  纽约市: "New York",
  巴黎: "Paris",
  伦敦: "London",
  东京: "Tokyo",
  里约热内卢: "Rio de Janeiro",
  里约: "Rio de Janeiro",
  京都: "Kyoto",
  大阪: "Osaka",
  札幌: "Sapporo",
  福冈: "Fukuoka",
  首尔: "Seoul",
  釜山: "Busan",
  新加坡: "Singapore",
  曼谷: "Bangkok",
  清迈: "Chiang Mai",
  吉隆坡: "Kuala Lumpur",
  悉尼: "Sydney",
  墨尔本: "Melbourne",
  奥克兰: "Auckland",
  罗马: "Rome",
  米兰: "Milan",
  威尼斯: "Venice",
  佛罗伦萨: "Florence",
  马德里: "Madrid",
  巴塞罗那: "Barcelona",
  柏林: "Berlin",
  慕尼黑: "Munich",
  苏黎世: "Zurich",
  日内瓦: "Geneva",
  阿姆斯特丹: "Amsterdam",
  维也纳: "Vienna",
  布拉格: "Prague",
  雅典: "Athens",
  伊斯坦布尔: "Istanbul",
  莫斯科: "Moscow",
  迪拜: "Dubai",
  开罗: "Cairo",
  洛杉矶: "Los Angeles",
  旧金山: "San Francisco",
  西雅图: "Seattle",
  芝加哥: "Chicago",
  波士顿: "Boston",
  华盛顿: "Washington",
  多伦多: "Toronto",
  温哥华: "Vancouver",
  墨西哥城: "Mexico City",
  布宜诺斯艾利斯: "Buenos Aires",
  雷克雅未克: "Reykjavik",
  香港: "Hong Kong",
  澳门: "Macau",
  台北: "Taipei",
  高雄: "Kaohsiung",
};

// 3. API: Real-Time City Weather & 7-Day Forecast via Open-Meteo
app.get("/api/weather", async (req, res) => {
  try {
    const cityQuery = typeof req.query.city === "string" ? req.query.city.trim() : "";
    const latParam = typeof req.query.lat === "string" ? parseFloat(req.query.lat) : NaN;
    const lonParam = typeof req.query.lon === "string" ? parseFloat(req.query.lon) : NaN;

    let latitude = latParam;
    let longitude = lonParam;
    let locationName = cityQuery || "当前位置";
    let countryName = "";
    let admin1Name = "";

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      if (!cityQuery) {
        return res.status(400).json({ error: "请提供城市名称" });
      }

      const cleanKey = cityQuery.replace(/[市省州]$/, "");
      const aliasName = CITY_SEARCH_ALIASES[cityQuery] || CITY_SEARCH_ALIASES[cleanKey];

      const fetchGeo = async (query: string, lang: string) => {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=20&language=${lang}&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error("Geocoding service unavailable");
        return (await geoRes.json()) as {
          results?: Array<{
            name: string;
            latitude: number;
            longitude: number;
            country?: string;
            admin1?: string;
            population?: number;
            feature_code?: string;
          }>;
        };
      };

      let geoData = await fetchGeo(aliasName || cityQuery, "zh");
      if ((!geoData.results || geoData.results.length === 0) && aliasName) {
        geoData = await fetchGeo(aliasName, "en");
      }
      if (!geoData.results || geoData.results.length === 0) {
        geoData = await fetchGeo(cityQuery, "en");
      }

      if (geoData.results && geoData.results.length > 0) {
        const targetNames = new Set(
          [cityQuery, cleanKey, aliasName].filter(Boolean).map((s) => s!.toLowerCase())
        );
        const sorted = [...geoData.results].sort((a, b) => {
          const aIsCity = !a.feature_code || a.feature_code.startsWith("PPL") ? 1 : 0;
          const bIsCity = !b.feature_code || b.feature_code.startsWith("PPL") ? 1 : 0;
          if (aIsCity !== bIsCity) return bIsCity - aIsCity;

          const popDiff = (b.population || 0) - (a.population || 0);
          if (popDiff !== 0) return popDiff;

          const aExact = targetNames.has(a.name.toLowerCase()) ? 1 : 0;
          const bExact = targetNames.has(b.name.toLowerCase()) ? 1 : 0;
          return bExact - aExact;
        });

        const best = sorted[0];
        latitude = best.latitude;
        longitude = best.longitude;
        locationName = aliasName ? cleanKey : best.name;
        countryName = best.country || "";
        admin1Name = best.admin1 || "";
      } else {
        // Fallback to OpenStreetMap Nominatim for any other Chinese/international city names
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          cityQuery
        )}&format=json&limit=1&accept-language=zh-CN`;
        const nomRes = await fetch(nomUrl, {
          headers: { "User-Agent": "WeatherCityExplorer/1.0" },
        }).catch(() => null);

        if (nomRes && nomRes.ok) {
          const nomJson = (await nomRes.json()) as Array<{
            lat: string;
            lon: string;
            name?: string;
            display_name?: string;
          }>;
          if (Array.isArray(nomJson) && nomJson.length > 0) {
            latitude = parseFloat(nomJson[0].lat);
            longitude = parseFloat(nomJson[0].lon);
            locationName = nomJson[0].name || cityQuery;
            const parts = (nomJson[0].display_name || "").split(",").map((s) => s.trim());
            countryName = parts[parts.length - 1] || "";
          }
        }
      }

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return res
          .status(404)
          .json({ error: `未找到「${cityQuery}」的地理坐标，请尝试输入更标准的城市名。` });
      }
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=uv_index&timezone=auto&forecast_days=7`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi`;

    const [forecastRes, aqiRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(aqiUrl).catch(() => null),
    ]);

    if (!forecastRes.ok) {
      throw new Error("获取实时气象数据失败");
    }

    const forecastJson = (await forecastRes.json()) as any;
    const aqiJson = aqiRes && aqiRes.ok ? ((await aqiRes.json()) as any) : null;

    const current = forecastJson.current;
    const windSpeed = Math.round(current.wind_speed_10m || 0);
    const mapped = mapWmoWeather(current.weather_code, windSpeed);

    // Match hourly UV index to current hour
    let uvIndex = 3;
    if (forecastJson.hourly?.time && forecastJson.hourly?.uv_index) {
      const currentHourPrefix = String(current.time || "").slice(0, 13);
      const hourIdx = forecastJson.hourly.time.findIndex((t: string) =>
        t.startsWith(currentHourPrefix)
      );
      if (hourIdx >= 0 && typeof forecastJson.hourly.uv_index[hourIdx] === "number") {
        uvIndex = Math.round(forecastJson.hourly.uv_index[hourIdx]);
      }
    }

    const aqiVal =
      typeof aqiJson?.current?.us_aqi === "number" ? Math.round(aqiJson.current.us_aqi) : 45;

    const daily = forecastJson.daily;
    const forecastDays = Array.isArray(daily?.time)
      ? daily.time.map((dateStr: string, idx: number) => {
          const dMapped = mapWmoWeather(daily.weather_code[idx]);
          return {
            dayName: getForecastDayLabel(dateStr, idx),
            date: dateStr,
            tempMin: Math.round(daily.temperature_2m_min[idx]),
            tempMax: Math.round(daily.temperature_2m_max[idx]),
            condition: dMapped.condition,
            conditionType: dMapped.conditionType,
            precipitation: Math.round(daily.precipitation_probability_max?.[idx] || 0),
          };
        })
      : [];

    res.json({
      location: {
        name: locationName,
        country: countryName,
        admin1: admin1Name,
        latitude,
        longitude,
        timezone: forecastJson.timezone,
        localTime: current.time,
      },
      weather: {
        temp: Math.round(current.temperature_2m),
        apparentTemp: Math.round(current.apparent_temperature ?? current.temperature_2m),
        condition: mapped.condition,
        conditionType: mapped.conditionType,
        humidity: Math.round(current.relative_humidity_2m || 0),
        wind: getWindLevelText(windSpeed),
        windSpeed,
        uvIndex,
        aqi: aqiVal,
        aqiLabel: getAqiLabel(aqiVal),
        pressure: Math.round(current.surface_pressure || 1013),
        updatedAt: current.time,
      },
      forecast: forecastDays,
    });
  } catch (err: any) {
    console.error("Weather API error:", err);
    res.status(500).json({ error: err.message || "无法获取实时天气数据" });
  }
});

// 4. API: Dynamic City Guide & Multi-Landmark Info for Any City
app.get("/api/city-guide", async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  const country = typeof req.query.country === "string" ? req.query.country.trim() : "";

  if (!city) {
    return res.status(400).json({ error: "City parameter is required" });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `请为城市「${city}」${country ? `（${country}）` : ""}编写一份城市概述和 3 到 4 个最具代表性的真实标志性建筑/地标景点。
要求严格以 JSON 格式输出：
- introduction: 80字以内的城市人文地理简介。
- landmarks: 数组，包含 3-4 个真实存在的核心地标，每项包含：
  - id: 英文短标识
  - name: 地标中文名称
  - subtitle: 一句话定位（12字以内）
  - description: 建筑风貌与特色描述（60字以内）
  - history: 历史人文由来（60字以内）
  - photoTips: 2条实用摄影机位与光线建议
  - bestTime: 最佳游玩季节与时段`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            introduction: { type: Type.STRING },
            landmarks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  description: { type: Type.STRING },
                  history: { type: Type.STRING },
                  photoTips: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  bestTime: { type: Type.STRING },
                },
                required: [
                  "id",
                  "name",
                  "subtitle",
                  "description",
                  "history",
                  "photoTips",
                  "bestTime",
                ],
              },
            },
          },
          required: ["introduction", "landmarks"],
        },
      },
    });

    const parsed = JSON.parse((response.text || "").trim());
    return res.json(parsed);
  } catch (err: any) {
    // Graceful fallback when GEMINI_API_KEY is missing or network fails
    return res.json({
      introduction: `${city}${country ? `位于${country}，` : ""}融合了独特的地域风貌、历史人文底蕴与现代城市景观，四季阴晴各有韵味。`,
      landmarks: [
        {
          id: `${city}-center`,
          name: `${city}历史文化核心区`,
          subtitle: "城市文脉 · 传统风貌街区",
          description: `集中展现${city}传统建筑风貌与市井生活气息的历史街区，适合漫步感受当地慢节奏。`,
          history: `承载着${city}数百年来的商贸与文化变迁，是理解城市底蕴的重要窗口。`,
          photoTips: [
            "清晨或日落前顺光漫步拍摄街区建筑立面与行人剪影。",
            "雨后或夜间灯光亮起时可利用地面倒影增强画面层次。",
          ],
          bestTime: "清晨或傍晚蓝调时刻。",
        },
        {
          id: `${city}-skyline`,
          name: `${city}现代城市天际线`,
          subtitle: "都市地标 · 滨水/中心观景带",
          description: `汇集${city}标志性现代建筑群与开阔城市广场，日间通透利落，入夜灯火璀璨。`,
          history: `见证了${city}近年来的现代化城市发展与空间更新。`,
          photoTips: [
            "在城市制高点或滨水对岸使用广角镜头拍摄全景天际线。",
          ],
          bestTime: "日落前后至夜间。",
        },
        {
          id: `${city}-park`,
          name: `${city}城市生态公园与博物馆`,
          subtitle: "自然与艺术 · 全天候漫游地",
          description: `将城市绿地景观与地方博物馆展陈融为一体的公共空间，晴雨皆宜。`,
          history: `系统收藏并呈现了${city}自古至今的自然生态与人文记忆。`,
          photoTips: [
            "晴天适合在公园林荫步道取景；雨雪天气可转入博物馆中庭拍摄建筑光影。",
          ],
          bestTime: "全天皆宜。",
        },
      ],
    });
  }
});

// --- Serve Vite / Production Bundled Files ---
async function main() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback for production (Express 4 uses app.get('*', ...))
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
