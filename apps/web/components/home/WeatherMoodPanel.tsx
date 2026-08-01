// app/web/components/home/WeatherMoodPanel.tsx
import { useEffect, useState } from "react";
import type { HomepageView } from "../../lib/cms-types";

type WeatherKey = "forecast" | "today" | "tomorrow" | "weekend";

type WeatherPoint = {
  temp: number;
  realFeel: number;
  condition: string;
  icon: string;
};

const TAB_KEYS: WeatherKey[] = ["forecast", "today", "tomorrow", "weekend"];

// Shown instantly on load / used if the API call fails, so panel never breaks.
const FALLBACK_WEATHER: Record<WeatherKey, WeatherPoint> = {
  forecast: { temp: 13, realFeel: 13, condition: "Mostly cloudy", icon: "cloudy" },
  today: { temp: 13, realFeel: 13, condition: "Mostly cloudy", icon: "cloudy" },
  tomorrow: { temp: 16, realFeel: 15, condition: "Partly sunny", icon: "partly" },
  weekend: { temp: 14, realFeel: 13, condition: "Light rain", icon: "rain" }
};

function mapWeatherCodeToText(code: number) {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 99) return "Storm";
  return "Cloudy";
}

function mapWeatherCodeToIcon(code: number) {
  if (code === 0) return "sunny";
  if (code <= 3) return "partly";
  if (code <= 48) return "cloudy";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 99) return "storm";
  return "cloudy";
}

function weatherGlyph(type: string) {
  switch (type) {
    case "sunny":
      return "☀︎";
    case "partly":
      return "⛅︎";
    case "rain":
      return "🌧︎";
    case "storm":
      return "⛈︎";
    case "snow":
      return "❄︎";
    default:
      return "☁︎";
  }
}

function getLondonTime() {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Europe/London"
  })
    .format(new Date())
    .toLowerCase();
}

export function WeatherMoodPanel({ data }: { data: HomepageView }) {
  const [timeLabel, setTimeLabel] = useState(getLondonTime);
  const [activeTab, setActiveTab] = useState<WeatherKey>("forecast");
  const [weather, setWeather] = useState<Record<WeatherKey, WeatherPoint> | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setTimeLabel(getLondonTime()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  // Live London weather from Open-Meteo. "forecast" = current conditions,
  // "today"/"tomorrow"/"weekend" = daily max for the next 3 days.
  useEffect(() => {
    let cancelled = false;

    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.5072&longitude=-0.1276&current_weather=true&daily=temperature_2m_max,weathercode&timezone=Europe/London"
    )
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const temp = Math.round(json.current_weather.temperature);
        const code = json.current_weather.weathercode;
        const daily = json.daily;

        setWeather({
          forecast: {
            temp,
            realFeel: temp,
            condition: mapWeatherCodeToText(code),
            icon: mapWeatherCodeToIcon(code)
          },
          today: {
            temp: Math.round(daily.temperature_2m_max[0]),
            realFeel: Math.round(daily.temperature_2m_max[0]),
            condition: mapWeatherCodeToText(daily.weathercode[0]),
            icon: mapWeatherCodeToIcon(daily.weathercode[0])
          },
          tomorrow: {
            temp: Math.round(daily.temperature_2m_max[1]),
            realFeel: Math.round(daily.temperature_2m_max[1]),
            condition: mapWeatherCodeToText(daily.weathercode[1]),
            icon: mapWeatherCodeToIcon(daily.weathercode[1])
          },
          weekend: {
            temp: Math.round(daily.temperature_2m_max[2]),
            realFeel: Math.round(daily.temperature_2m_max[2]),
            condition: mapWeatherCodeToText(daily.weathercode[2]),
            icon: mapWeatherCodeToIcon(daily.weathercode[2])
          }
        });
      })
      .catch(() => {
        // Keep fallback data on failure.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const w = (weather ?? FALLBACK_WEATHER)[activeTab];

  const tabLabels =
    data.forecastTabs.length === TAB_KEYS.length
      ? data.forecastTabs
      : ["Forecast", "Today", "Tomorrow", "This Weekend"];

  return (
    <aside className="min-w-0">
      <p className="ln-ui text-[13px] font-medium uppercase tracking-[0.08em] text-[#6a7788] sm:text-[15px]">
        Current Weather
      </p>
      <p className="mt-1.5 ln-ui text-[12px] font-light text-[#7b828c] sm:text-[13px]">{timeLabel}</p>

      <div className="mt-5 flex items-center gap-2.5 sm:gap-4">
        <div className="text-[52px] leading-none text-[#5a6a7a] sm:text-[70px] lg:text-[88px]">
          {weatherGlyph(w.icon)}
        </div>
        <div>
          <div className="flex items-start text-[48px] font-light leading-none tracking-[-0.04em] text-[#4a5a6a] sm:text-[58px] lg:text-[72px]">
            {w.temp}
            <span className="ml-1 flex items-start">
              <span className="text-[50px] sm:text-[60px] lg:text-[74px]">°</span>
              <span className="ln-brand mt-6 text-[16px] text-[#6b7280] sm:mt-8 sm:text-[20px] lg:mt-10 lg:text-[24px]">
                C
              </span>
            </span>
          </div>
          <div className="text-[11px] leading-none tracking-[-0.01em] text-[#4a5a6a]/80 sm:text-[13px] lg:text-[15px]">
            RealFeel® {w.realFeel}°
          </div>
        </div>
      </div>

      <p className="mt-3 text-[14px] font-light text-[#4a5a6a] sm:text-[16px] lg:text-[18px]">{w.condition}</p>

      {/* flex-wrap: tabs that don't fit drop to a clean next line instead of
          getting clipped or requiring a scrollbar. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {TAB_KEYS.map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`ln-ui shrink-0 whitespace-nowrap border-none bg-transparent pb-1 text-[9px] font-normal uppercase tracking-[0.1em] transition-colors sm:text-[10px] ${
              activeTab === key
                ? "border-b border-[#c9a24b] font-bold text-black"
                : "text-gray-500 hover:text-[#4a5a6a]"
            }`}
          >
            {tabLabels[index]}
          </button>
        ))}
      </div>
    </aside>
  );
}

