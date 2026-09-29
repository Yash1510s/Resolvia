'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  User,
  Film,
  Check,
  RefreshCw,
  Camera,
} from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { computeSha256Bytes, arrayBufferToBase64 } from '../lib/crypto';
import { WALLPAPER_PRESETS } from './AmbientBackground';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ProfileCustomizerModal({ open, onClose }: Props) {
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState<'avatar' | 'wallpaper'>('wallpaper');
  const [name, setName] = useState(user?.name ?? 'Resolvia Arbiter');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [bgMediaUrl, setBgMediaUrl] = useState(user?.bgMediaUrl ?? '');
  const [bgType, setBgType] = useState<'video' | 'image'>(user?.bgType ?? 'video');
  const [bgTheme, setBgTheme] = useState(user?.bgTheme ?? 'cyber_violet');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(user?.name ?? (typeof window !== 'undefined' ? localStorage.getItem('resolvia_user_name') : null) ?? 'Resolvia Arbiter');
      setAvatarUrl(user?.avatarUrl ?? (typeof window !== 'undefined' ? localStorage.getItem('resolvia_custom_avatar') : null) ?? '');
      setBgMediaUrl(user?.bgMediaUrl ?? (typeof window !== 'undefined' ? localStorage.getItem('resolvia_custom_bg') : null) ?? '');
      setBgType((user?.bgType as any) ?? (typeof window !== 'undefined' ? localStorage.getItem('resolvia_custom_bg_type') : null) ?? 'video');
      setBgTheme(user?.bgTheme ?? (typeof window !== 'undefined' ? localStorage.getItem('resolvia_bg_theme') : null) ?? 'cyber_violet');
    }
  }, [open, user]);

  if (!open) return null;

  // Upload file bytes to Pinata IPFS via backend endpoint
  const uploadToIPFS = async (file: File): Promise<{ ipfsCid: string; gatewayUrl: string } | null> => {
    try {
      const buf = await file.arrayBuffer();
      const sha256 = await computeSha256Bytes(buf);
      const base64 = arrayBufferToBase64(buf);

      const res = await fetch('/api/backend/ipfs/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentBase64: base64,
          sha256,
        }),
      });

      if (!res.ok) throw new Error('Pinata upload failed');
      const data = await res.json();
      return {
        ipfsCid: data.ipfsCid || `bafybei${sha256.slice(0, 44)}`,
        gatewayUrl: data.gatewayUrl || `https://gateway.pinata.cloud/ipfs/${data.ipfsCid}`,
      };
    } catch (err) {
      console.warn('IPFS upload fallback:', err);
      return null;
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setUploadProgress('Pinning avatar to IPFS…');
    const res = await uploadToIPFS(file);
    if (res?.gatewayUrl) {
      setAvatarUrl(res.gatewayUrl);
    }
    setUploadingAvatar(false);
    setUploadProgress(null);
    e.target.value = '';
  };

  const handleBgFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
    setUploadingBg(true);
    setUploadProgress(`Pinning ${isVid ? 'live video' : 'background'} to Pinata IPFS…`);
    const res = await uploadToIPFS(file);
    if (res?.gatewayUrl) {
      setBgMediaUrl(res.gatewayUrl);
      setBgType(isVid ? 'video' : 'image');
      setBgTheme('custom');
      // Apply immediately to local preview
      localStorage.setItem('resolvia_custom_bg', res.gatewayUrl);
      localStorage.setItem('resolvia_custom_bg_type', isVid ? 'video' : 'image');
      localStorage.setItem('resolvia_bg_theme', 'custom');
    }
    setUploadingBg(false);
    setUploadProgress(null);
    e.target.value = '';
  };

  const selectPreset = (presetId: string) => {
    setBgTheme(presetId);
    setBgMediaUrl('');
    setBgType('video');
    localStorage.removeItem('resolvia_custom_bg');
    localStorage.setItem('resolvia_bg_theme', presetId);
  };

  const handleSave = async () => {
    await updateProfile({
      name,
      avatarUrl: avatarUrl || undefined,
      bgMediaUrl: bgMediaUrl || undefined,
      bgType,
      bgTheme,
    });
    // Persist to local cache for instant reload
    if (avatarUrl) localStorage.setItem('resolvia_custom_avatar', avatarUrl);
    localStorage.setItem('resolvia_bg_theme', bgTheme);
    if (bgMediaUrl) {
      localStorage.setItem('resolvia_custom_bg', bgMediaUrl);
      localStorage.setItem('resolvia_custom_bg_type', bgType);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/30 text-violet-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Appearance & Identity</h2>
              <p className="text-[11px] text-slate-400">Customize your avatar & ambient live wallpaper</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/10 px-6 bg-slate-900/30">
          <button
            onClick={() => setTab('wallpaper')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'wallpaper' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Live Wallpaper
          </button>
          <button
            onClick={() => setTab('avatar')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              tab === 'avatar' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Profile & Avatar
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {tab === 'wallpaper' ? (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Curated Ambient Motion Loops</label>
                <div className="grid grid-cols-3 gap-2.5 mt-2">
                  {WALLPAPER_PRESETS.map((p) => {
                    const active = bgTheme === p.id && !bgMediaUrl;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPreset(p.id)}
                        className={`group relative p-3 rounded-xl border text-left transition-all overflow-hidden ${
                          active
                            ? 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-950/40'
                            : 'border-white/10 hover:border-white/20 bg-slate-800/40'
                        }`}
                      >
                        <div className={`h-16 rounded-lg bg-gradient-to-br ${p.previewGradient} flex items-center justify-center mb-2`}>
                          <Film className="w-5 h-5 text-white/60 group-hover:scale-110 transition-transform" />
                        </div>
                        <p className="text-[11px] font-bold text-white truncate">{p.name}</p>
                        <p className="text-[9.5px] text-slate-400">{p.category}</p>
                        {active && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom MP4 / Video upload */}
              <div className="pt-3 border-t border-white/10">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Custom Live Wallpaper (.MP4 / .WEBM / Image)</span>
                  <span className="text-violet-400 text-[10px] lowercase font-mono">Pinned on IPFS</span>
                </label>
                <input
                  key="customizer-bg-file"
                  id="customizer-bg-file"
                  ref={bgInputRef}
                  type="file"
                  accept="video/mp4,video/webm,image/*"
                  className="hidden"
                  onChange={handleBgFile}
                />
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    disabled={uploadingBg}
                    className="flex-1 py-3 px-4 rounded-xl border border-dashed border-white/20 hover:border-violet-400 hover:bg-violet-950/20 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {uploadingBg ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                        <span>{uploadProgress || 'Uploading…'}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-violet-400" />
                        <span>Upload Custom MP4 / Video Background</span>
                      </>
                    )}
                  </button>
                </div>
                {bgMediaUrl && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-mono flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Custom background active
                    </span>
                    <button
                      onClick={() => selectPreset('cyber_violet')}
                      className="text-slate-400 hover:text-rose-400 text-[10px] underline ml-2"
                    >
                      Reset to default
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Avatar tab */
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black overflow-hidden ring-4 ring-white/10">
                    {avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (name || 'U').charAt(0).toUpperCase()
                    )}
                  </div>
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity cursor-pointer"
                  >
                    <Camera className="w-4 h-4 mb-0.5" />
                    Change
                  </button>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">{name}</h3>
                  <p className="text-[11px] text-slate-400">Stored on IPFS via Pinata decentralized pinning</p>
                  <input
                    key="customizer-avatar-file"
                    id="customizer-avatar-file"
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="text-xs font-bold text-violet-400 hover:text-violet-300 underline cursor-pointer"
                  >
                    {uploadingAvatar ? (uploadProgress || 'Uploading…') : 'Upload Photo'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                <input
                  key="customizer-display-name"
                  id="customizer-display-name"
                  value={name ?? ''}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 focus:border-violet-500 focus:outline-none text-xs text-white"
                  placeholder="Your display name"
                />
              </div>

              {avatarUrl && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-white/10 text-[10px] font-mono text-slate-400 break-all truncate">
                  IPFS Gateway: {avatarUrl}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Apply</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
