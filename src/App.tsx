import React, { useState } from 'react';
import { Camera, Aperture, Clock, Sun, ZoomIn, Info, RotateCcw, AlertTriangle, Building2, Mountain, Moon, Star } from 'lucide-react';

const logMap = (val: number, min: number, max: number) => Math.exp(Math.log(min) + (Math.log(max) - Math.log(min)) * (val / 100));
const inverseLogMap = (val: number, min: number, max: number) => 100 * (Math.log(val) - Math.log(min)) / (Math.log(max) - Math.log(min));

const formatShutter = (val: number) => {
  if (val >= 1) {
    const rounded = Math.round(val * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}s`;
  }
  return `1/${Math.round(1 / val)}s`;
};

const scenes = [
  { id: 'city', name: '城市夜景', icon: <Building2 className="w-4 h-4" />, url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=2000&auto=format&fit=crop', baseEv: 0, optimal: { fl: 24, ap: 1.79, sh: 1/15, iso: 1298, ev: -0.9 } },
  { id: 'mountain', name: '幽暗山景', icon: <Mountain className="w-4 h-4" />, url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop', baseEv: -7, optimal: { fl: 24, ap: 1.4, sh: 1, iso: 3200, ev: 0 } },
  { id: 'moon', name: '明月高懸', icon: <Moon className="w-4 h-4" />, url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?q=80&w=2000&auto=format&fit=crop', baseEv: 13, optimal: { fl: 200, ap: 8, sh: 1/500, iso: 100, ev: -1 } },
  { id: 'stars', name: '璀璨星空', icon: <Star className="w-4 h-4" />, url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2000&auto=format&fit=crop', baseEv: -11, optimal: { fl: 24, ap: 1.4, sh: 15, iso: 3200, ev: 0 } },
];

export default function App() {
  const [activeSceneId, setActiveSceneId] = useState('city');
  const [flSlider, setFlSlider] = useState(inverseLogMap(24, 24, 200));
  const [apSlider, setApSlider] = useState(inverseLogMap(1.79, 1.4, 16));
  const [shSlider, setShSlider] = useState(inverseLogMap(1/15, 0.001, 30));
  const [isoSlider, setIsoSlider] = useState(inverseLogMap(1298, 100, 6400));
  const [evSlider, setEvSlider] = useState(((-0.9 + 3) / 6) * 100);

  const applyOptimalSettings = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId) || scenes[0];
    setFlSlider(inverseLogMap(scene.optimal.fl, 24, 200));
    setApSlider(inverseLogMap(scene.optimal.ap, 1.4, 16));
    setShSlider(inverseLogMap(scene.optimal.sh, 0.001, 30));
    setIsoSlider(inverseLogMap(scene.optimal.iso, 100, 6400));
    setEvSlider(((scene.optimal.ev + 3) / 6) * 100);
  };

  const fl = logMap(flSlider, 24, 200);
  const ap = logMap(apSlider, 1.4, 16);
  const sh = logMap(shSlider, 0.001, 30);
  const iso = logMap(isoSlider, 100, 6400);
  const ev = -3 + (evSlider / 100) * 6;

  const activeScene = scenes.find(s => s.id === activeSceneId) || scenes[0];

  const scale = fl / 24;
  const brightness = Math.pow(1.79 / ap, 2) * (sh / (1/15)) * (iso / 1298) * Math.pow(2, ev + 0.9 + activeScene.baseEv);
  const contrast = 1 + (brightness - 1) * 0.1;
  const dofBlur = Math.max(0, (8 - ap) * 1.5);
  const noiseOpacity = Math.max(0, (iso - 400) / 6000 * 0.8);
  const streakWidth = Math.max(4, sh * 1000);

  const warnings: { type: 'warning' | 'info', text: string, suggestion: string }[] = [];
  if (brightness > 2.5) {
    warnings.push({
      type: 'warning',
      text: '畫面嚴重過曝！',
      suggestion: '建議：調低 ISO、加快快門速度，或縮小光圈 (增加 f/ 數值)。'
    });
  } else if (brightness > 1.5) {
    warnings.push({
      type: 'warning',
      text: '畫面稍微偏亮',
      suggestion: '建議：可稍微調低 EV 曝光補償，或加快快門速度以保留亮部細節。'
    });
  } else if (brightness < 0.3) {
    warnings.push({
      type: 'warning',
      text: '畫面嚴重曝光不足！',
      suggestion: '建議：提高 ISO、放慢快門速度，或加大光圈 (減小 f/ 數值)。'
    });
  }

  if (sh > 1/10) {
    warnings.push({
      type: 'info',
      text: '建議使用腳架 (長曝光)',
      suggestion: '目前的快門速度較慢，手持極易手震模糊。建議使用腳架穩定設備，或提高 ISO 來換取更快的快門。'
    });
  }

  if (Math.round(iso) > 3200) {
    warnings.push({
      type: 'warning',
      text: 'ISO 感光度過高！',
      suggestion: '畫面會產生明顯雜訊。若有腳架，建議放慢快門並降低 ISO 以提升畫質。'
    });
  }

  const controls = [
    {
      id: 'fl',
      title: '焦距 (Focal Length)',
      icon: <ZoomIn className="w-5 h-5 text-blue-400" />,
      value: `${Math.round(fl)}mm`,
      sliderValue: flSlider,
      setSliderValue: setFlSlider,
      desc: '代表鏡頭的視野範圍。24mm 屬於「廣角」，能容納較寬廣的畫面，非常適合用來捕捉大範圍的城市夜景或廣闊的天空。',
    },
    {
      id: 'ap',
      title: '光圈 (Aperture)',
      icon: <Aperture className="w-5 h-5 text-green-400" />,
      value: `f/${ap.toFixed(2)}`,
      sliderValue: apSlider,
      setSliderValue: setApSlider,
      desc: '控制進光量的「閘門」。數值越小，光圈越大。f/1.79 是一個非常大的光圈，能在暗處讓大量光線進入感光元件，是提升夜拍明亮度的重要功臣。',
    },
    {
      id: 'sh',
      title: '快門速度 (Shutter Speed)',
      icon: <Clock className="w-5 h-5 text-yellow-400" />,
      value: formatShutter(sh),
      sliderValue: shSlider,
      setSliderValue: setShSlider,
      desc: '代表相機「睜開眼睛」捕捉光線的時間是 15 分之 1 秒。在夜間，相機需要較長的曝光時間來收集光線。不過 1/15 秒手持拍攝時容易因為手震而模糊，通常需要拿得非常穩，或依賴設備的防手震功能。',
    },
    {
      id: 'iso',
      title: '感光度 (ISO)',
      icon: <Camera className="w-5 h-5 text-purple-400" />,
      value: Math.round(iso),
      sliderValue: isoSlider,
      setSliderValue: setIsoSlider,
      desc: '代表設備對光線的敏感程度。環境越暗，通常會拉高 ISO 來提亮畫面。1298 屬於中高感光度（這種非整數的數值通常是系統自動演算出來的），它能讓畫面明顯變亮，但代價是照片暗部可能會產生一些微小的雜訊（顆粒感）。',
    },
    {
      id: 'ev',
      title: '曝光補償 (EV)',
      icon: <Sun className="w-5 h-5 text-orange-400" />,
      value: `${ev > 0 ? '+' : ''}${ev.toFixed(1)}`,
      sliderValue: evSlider,
      setSliderValue: setEvSlider,
      desc: '意思是「比設備自動測光的標準亮度，再刻意調暗將近 1 階」。拍夜景時，系統常會為了把畫面拍清楚而過度提亮，導致黑夜看起來像灰暗的白天，路燈等光源也容易過曝變成一團死白。設定 EV -0.9 可以把整體亮度壓低，保留夜空的深邃感與真實氛圍。',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 p-4 md:p-8 font-sans flex flex-col xl:flex-row gap-8">
      {/* Left: Viewport */}
      <div className="w-full xl:w-3/5 h-[50vh] xl:h-[calc(100vh-4rem)] sticky top-4 md:top-8 z-10">
        <div className="relative w-full h-full overflow-hidden bg-black rounded-2xl border border-gray-800 shadow-2xl flex items-center justify-center">
          {/* Scaled Container */}
          <div
            className="absolute inset-0 transition-transform duration-200 origin-center"
            style={{ transform: `scale(${scale})` }}
          >
            {/* Image with Brightness */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-200"
              style={{
                backgroundImage: `url('${activeScene.url}')`,
                filter: `brightness(${brightness}) contrast(${contrast})`,
              }}
            >
              {/* DOF Blur */}
              <div
                className="absolute inset-0 transition-all duration-200"
                style={{
                  backdropFilter: `blur(${dofBlur}px)`,
                  WebkitBackdropFilter: `blur(${dofBlur}px)`,
                  maskImage: 'linear-gradient(to bottom, black 0%, transparent 40%, transparent 60%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 40%, transparent 60%, black 100%)',
                }}
              />

              {/* Light Streaks (Motion Blur) */}
              {activeScene.id === 'city' && (
                <>
                  <div className="absolute top-[70%] left-[10%] h-1 bg-red-500 rounded-full transition-all duration-200"
                       style={{ width: `${streakWidth}px`, boxShadow: '0 0 10px 3px rgba(239, 68, 68, 0.8)' }} />
                  <div className="absolute top-[72%] left-[15%] h-1 bg-red-500 rounded-full transition-all duration-200"
                       style={{ width: `${streakWidth * 0.9}px`, boxShadow: '0 0 10px 3px rgba(239, 68, 68, 0.8)' }} />
                  
                  <div className="absolute top-[75%] right-[20%] h-1 bg-yellow-100 rounded-full transition-all duration-200"
                       style={{ width: `${streakWidth * 1.2}px`, boxShadow: '0 0 15px 4px rgba(254, 240, 138, 0.9)' }} />
                </>
              )}
            </div>
          </div>

          {/* Noise Overlay */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-200"
            style={{
              opacity: noiseOpacity,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Warnings Overlay */}
          {warnings.length > 0 && (
            <div className="absolute top-4 left-4 right-4 md:right-auto md:w-80 flex flex-col gap-2 z-20 pointer-events-none">
              {warnings.map((w, i) => (
                <div key={i} className={`bg-black/80 backdrop-blur-md border rounded-xl p-3 shadow-2xl ${w.type === 'warning' ? 'border-yellow-500/50' : 'border-blue-500/50'}`}>
                  <div className={`flex items-center gap-2 font-bold mb-1 text-sm ${w.type === 'warning' ? 'text-yellow-500' : 'text-blue-400'}`}>
                    {w.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    {w.text}
                  </div>
                  <div className="text-gray-300 text-xs leading-relaxed">
                    {w.suggestion}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Overlay info */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-xs font-mono text-white/80 flex gap-4">
            <span>{Math.round(fl)}mm</span>
            <span>f/{ap.toFixed(2)}</span>
            <span>{formatShutter(sh)}</span>
            <span>ISO {Math.round(iso)}</span>
            <span>{ev > 0 ? '+' : ''}{ev.toFixed(1)} EV</span>
          </div>
        </div>
      </div>

      {/* Right: Controls */}
      <div className="w-full xl:w-2/5 flex flex-col gap-6 xl:overflow-y-auto pb-12 xl:pr-4 custom-scrollbar">
        <div className="mb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">夜景攝影模擬器</h1>
          
          {/* Scene Selector */}
          <div className="flex gap-2 my-5 overflow-x-auto custom-scrollbar pb-2">
            {scenes.map(scene => (
              <button
                key={scene.id}
                onClick={() => {
                  setActiveSceneId(scene.id);
                  applyOptimalSettings(scene.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeSceneId === scene.id 
                    ? 'bg-white text-black shadow-lg scale-105' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {scene.icon}
                {scene.name}
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-sm md:text-base leading-relaxed">
            選擇不同場景並調整下方參數，即時預覽各項相機設定的影響。切換場景時會自動套用該場景的「最佳化預設值」。
          </p>
          <button
            onClick={() => applyOptimalSettings(activeSceneId)}
            className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 text-sm font-medium rounded-lg transition-all active:scale-95 text-indigo-200"
          >
            <RotateCcw className="w-4 h-4" />
            最佳化參數 (目前場景預設值)
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {controls.map(ctrl => (
            <div key={ctrl.id} className="bg-[#111111] border border-white/5 rounded-2xl p-5 md:p-6 shadow-xl transition-all hover:border-white/10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-black rounded-xl border border-white/5 shadow-inner">
                    {ctrl.icon}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-100">{ctrl.title}</h2>
                </div>
                <span className="text-xl font-mono font-medium text-white bg-black px-3 py-1.5 rounded-lg border border-white/5">
                  {ctrl.value}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={ctrl.sliderValue}
                onChange={(e) => ctrl.setSliderValue(Number(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white mb-5 focus:outline-none focus:ring-2 focus:ring-white/20"
              />

              <div className="flex items-start gap-3 text-sm text-gray-400 leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <p>{ctrl.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
