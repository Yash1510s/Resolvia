'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { useTheme } from '../lib/theme-context';
import { Sparkles, Eye, EyeOff } from 'lucide-react';

export interface WallpaperPreset {
  id: string;
  name: string;
  category: 'Cyber' | 'Aurora' | 'Deep Space' | 'Minimal';
  videoUrl?: string;
  previewGradient: string;
  cssAnimation: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'cyber_violet',
    name: 'Cyber Violet Aurora',
    category: 'Cyber',
    // Public CDN royalty-free high quality dark ambient motion loops
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-screens-with-code-31911-large.mp4',
    previewGradient: 'from-violet-900 via-indigo-950 to-slate-950',
    cssAnimation: 'animate-pulse',
  },
  {
    id: 'quantum_mesh',
    name: 'Quantum Data Stream',
    category: 'Minimal',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-animation-of-futuristic-lines-and-numbers-99732-large.mp4',
    previewGradient: 'from-blue-950 via-slate-950 to-purple-950',
    cssAnimation: '',
  },
  {
    id: 'obsidian_matrix',
    name: 'Deep Space Nebula',
    category: 'Deep Space',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1610-large.mp4',
    previewGradient: 'from-slate-950 via-purple-950 to-black',
    cssAnimation: '',
  },
];

export function AmbientBackground() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load motion preference
  useEffect(() => {
    setMounted(true);
    const pref = typeof window !== 'undefined' ? localStorage.getItem('resolvia_motion_pref') : null;
    if (pref === 'disabled') setMotionEnabled(false);
  }, []);

  const toggleMotion = () => {
    const next = !motionEnabled;
    setMotionEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resolvia_motion_pref', next ? 'enabled' : 'disabled');
    }
  };

  const localBg = typeof window !== 'undefined' ? localStorage.getItem('resolvia_custom_bg') : null;
  const localType = typeof window !== 'undefined' ? (localStorage.getItem('resolvia_custom_bg_type') as 'video' | 'image' | null) : null;
  const localTheme = typeof window !== 'undefined' ? localStorage.getItem('resolvia_bg_theme') : null;

  const bgMediaUrl = user?.bgMediaUrl || localBg;
  const bgType = user?.bgType || localType || 'video';
  const bgTheme = user?.bgTheme || localTheme || 'cyber_violet';

  const activePreset = WALLPAPER_PRESETS.find((p) => p.id === bgTheme) || WALLPAPER_PRESETS[0];
  const videoSrc = bgMediaUrl || activePreset.videoUrl;

  useEffect(() => {
    if (videoRef.current && motionEnabled) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback (silent)
      });
    }
  }, [videoSrc, motionEnabled]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* Dynamic Video or Image layer */}
      {motionEnabled && bgType === 'video' && videoSrc ? (
        <video
          ref={videoRef}
          key={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover scale-105 transition-opacity duration-1000 ${isDark ? 'opacity-30' : 'opacity-10'}`}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : bgType === 'image' && bgMediaUrl ? (
        <div
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 scale-105 ${isDark ? 'opacity-30' : 'opacity-10'}`}
          style={{ backgroundImage: `url(${bgMediaUrl})` }}
        />
      ) : (
        /* CSS Ambient Mesh Gradient Fallback */
        <div className={`absolute inset-0 bg-gradient-to-br ${activePreset.previewGradient} transition-all duration-1000 ${isDark ? 'opacity-40' : 'opacity-15'}`} />
      )}

      {/* Glassmorphism Veil Overlay — crystal clean in light mode, deep obsidian in dark mode */}
      <div className={`absolute inset-0 transition-colors duration-500 backdrop-blur-[64px] ${isDark ? 'bg-slate-950/85' : 'bg-[#f8fafc]/98'}`} />
      
      {/* Radial vignette glow */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isDark ? 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-slate-950/60 to-slate-950/95' : 'bg-transparent'}`} />

      {/* Subtle bottom-right motion indicator */}
      <div className="absolute bottom-3 right-4 pointer-events-auto">
        <button
          onClick={toggleMotion}
          title={motionEnabled ? 'Pause Live Wallpaper (Reduce Motion)' : 'Enable Live Wallpaper'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-medium text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all shadow-lg backdrop-blur-md cursor-pointer"
        >
          {motionEnabled ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Wallpaper</span>
              <EyeOff className="w-3 h-3 ml-0.5 opacity-60" />
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>Motion Paused</span>
              <Eye className="w-3 h-3 ml-0.5 opacity-60" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
