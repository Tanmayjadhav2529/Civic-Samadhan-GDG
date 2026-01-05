
import React, { useState, useEffect, useRef } from 'react';
import { Department } from '../../types';
import { getLocationContext, transcribeAudio, analyzeImageSignal } from '../../services/geminiService';

// Declare Leaflet global
declare const L: any;

interface ReportFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onCancel }) => {
  const [selectedCategory, setSelectedCategory] = useState<Department | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueType, setIssueType] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [lastPing, setLastPing] = useState<string>('Offline');
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isVisionVerified, setIsVisionVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready');
  const [isMapReady, setIsMapReady] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{ title: string; description: string; category: string; issueType: string } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastResolvedPos = useRef<{ lat: number; lng: number } | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const categories = [
    { id: Department.ELECTRICITY, label: 'Street Lighting', sub: 'Utility Ops', icon: '💡' },
    { id: Department.SANITATION, label: 'Waste Disposal', sub: 'Sanitation', icon: '🗑️' },
    { id: Department.ROADS, label: 'Infrastructure', sub: 'Road Works', icon: '🛣️' },
    { id: Department.WATER, label: 'Water Supply', sub: 'Liquid Utility', icon: '💧' },
    { id: Department.PARKS, label: 'Environment', sub: 'Green Space', icon: '🌳' },
  ];

  useEffect(() => {
    const checkL = setInterval(() => {
      if (typeof L !== 'undefined') {
        setIsMapReady(true);
        clearInterval(checkL);
      }
    }, 100);
    return () => clearInterval(checkL);
  }, []);

  useEffect(() => {
    if (location && isMapReady && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([location.lat, location.lng], 18);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        subdomains: 'abcd'
      }).addTo(mapRef.current);

      const icon = L.divIcon({
        html: `<div class="relative">
                <div class="absolute -inset-8 bg-blue-500/10 rounded-full animate-[ping_3s_infinite]"></div>
                <div class="absolute -inset-4 bg-blue-400/20 rounded-full animate-pulse"></div>
                <div class="bg-blue-600 w-8 h-8 rounded-full border-4 border-white shadow-2xl relative z-10 flex items-center justify-center">
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
               </div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      markerRef.current = L.marker([location.lat, location.lng], { icon }).addTo(mapRef.current);
      setTimeout(() => mapRef.current?.invalidateSize(), 300);

    } else if (location && mapRef.current && isMapReady) {
      markerRef.current?.setLatLng([location.lat, location.lng]);
      if (isTracking) {
        mapRef.current.setView([location.lat, location.lng], 18, { animate: true });
      }
    }
  }, [location, isMapReady, isTracking]);

  useEffect(() => {
    handleLiveDetect();
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      mapRef.current?.remove();
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64DataWithPrefix = reader.result as string;
        setImage(base64DataWithPrefix);
        
        setIsAnalyzingImage(true);
        setIsVisionVerified(false);
        setAiSuggestions(null);
        try {
          const base64Data = base64DataWithPrefix.split(',')[1];
          const result = await analyzeImageSignal(base64Data, file.type);
          
          if (result) {
            setAiSuggestions(result);
            setTitle(result.title || '');
            setDescription(result.description || '');
            setIssueType(result.issueType || '');
            
            const categoryMatch = Object.values(Department).find(d => 
              d.toLowerCase().includes(result.category?.toLowerCase()) || 
              result.category?.toLowerCase().includes(d.toLowerCase())
            );
            if (categoryMatch) setSelectedCategory(categoryMatch);
            setIsVisionVerified(true);
          }
        } catch (err) {
          console.error("AI Vision failure", err);
        } finally {
          setIsAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const resolveAddress = async (lat: number, lng: number) => {
    setAddress('Indexing neighborhood intelligence...');
    try {
      const context = await getLocationContext(lat, lng);
      setAddress(context);
      lastResolvedPos.current = { lat, lng };
    } catch (error) {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setIsLocating(false);
    setStatusMessage('Ready');
  };

  const handleLiveDetect = async () => {
    if (!navigator.geolocation) {
      alert("Hardware geolocation is unavailable.");
      return;
    }

    setIsLocating(true);
    setIsTracking(true);
    setStatusMessage('Waking GPS Hardware...');

    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        const now = new Date();
        
        setLocation({ lat: latitude, lng: longitude });
        setAccuracy(acc);
        setLastPing(now.toLocaleTimeString([], { hour12: false }));
        setIsLocating(false);
        setStatusMessage('Streaming Live Data');

        const hasMoved = !lastResolvedPos.current || 
          Math.abs(latitude - lastResolvedPos.current.lat) > 0.0001 || 
          Math.abs(longitude - lastResolvedPos.current.lng) > 0.0001;

        if (hasMoved) resolveAddress(latitude, longitude);
      },
      (error) => {
        if (error.code === error.TIMEOUT) {
          setStatusMessage('Satellite Link Slow - Retrying...');
          navigator.geolocation.getCurrentPosition(
            (pos) => {
               setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
               setAccuracy(pos.coords.accuracy);
               setIsLocating(false);
               setStatusMessage('Low Precision Fallback');
            },
            () => {
               stopTracking();
               alert("Unable to acquire satellite lock. Ensure a clear view of the sky.");
            },
            { enableHighAccuracy: false, timeout: 10000 }
          );
        } else {
          stopTracking();
          alert(`Location Error: ${error.message}`);
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const text = await transcribeAudio(base64Data, 'audio/webm');
          if (text) setDescription(prev => prev ? `${prev}\n${text}` : text);
          setIsTranscribing(false);
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      alert("Microphone denied.");
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory || !title.trim() || !description.trim() || !address.trim() || !location) {
      alert("Missing required dispatch telemetry.");
      return;
    }
    setIsSubmitting(true);
    stopTracking();
    setTimeout(() => {
      onSubmit({ 
        title: title.trim(),
        category: selectedCategory, 
        issueType: issueType.trim() || 'Visual Detection',
        description: description.trim(), 
        address: address.trim(),
        location: location,
        image 
      });
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Intelligence Dispatch</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Establishing high-fidelity satellite connection...</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all shadow-sm">✕</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-8">
          
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-widest flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                <span>1. Visual Evidence Analysis</span>
              </div>
              {isVisionVerified && (
                <span className="bg-emerald-50 text-emerald-600 text-[8px] px-2 py-1 rounded-full border border-emerald-100 animate-in zoom-in duration-300">
                  Vision AI Verified
                </span>
              )}
            </h3>
            <div className="relative rounded-3xl overflow-hidden aspect-video bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 group hover:border-blue-300 transition-colors cursor-pointer">
                {image ? (
                  <div className="w-full h-full relative">
                    <img src={image} className="w-full h-full object-cover" />
                    {isAnalyzingImage && (
                      <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="flex flex-col items-center">
                          <div className="w-full h-1 bg-blue-600 absolute top-0 animate-[shimmer_2s_infinite] opacity-50"></div>
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                          <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest bg-white/90 px-3 py-1 rounded-full shadow-lg">Processing Intelligence...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition-transform">📸</div>
                    <p className="font-bold text-[10px] uppercase tracking-widest">Attach Proof</p>
                    <p className="text-[8px] mt-2 opacity-60">AI will automatically classify the issue</p>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>

            {aiSuggestions && (
              <div className="mt-6 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-blue-600 text-sm">✨</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">AI Intelligence Suggestions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.issueType && (
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Detected Issue</p>
                      <p className="text-[11px] font-black text-slate-800">{aiSuggestions.issueType}</p>
                    </div>
                  )}
                  {aiSuggestions.category && (
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm">
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-none mb-1">Detected Category</p>
                      <p className="text-[11px] font-black text-slate-800">{aiSuggestions.category}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-8 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              <span>2. Classification Packet</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`relative p-6 rounded-3xl text-left transition-all border-2 group ${
                    selectedCategory === cat.id 
                      ? 'border-blue-600 bg-blue-50/20 shadow-xl shadow-blue-100/50' 
                      : 'border-slate-50 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-all ${
                    selectedCategory === cat.id ? 'bg-blue-600 text-white rotate-6' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className={`font-black text-[11px] uppercase tracking-tight ${selectedCategory === cat.id ? 'text-blue-700' : 'text-slate-800'}`}>
                      {cat.label}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">
                      {cat.sub}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-widest flex items-center space-x-2">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
              <span>3. Issue Details</span>
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Incident Title"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black uppercase tracking-tight outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-medium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Specific Issue Type (e.g., Deep Pothole)"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black uppercase tracking-tight outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all placeholder:font-medium"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
              />
              <div className="relative">
                <textarea
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm min-h-[150px] outline-none font-medium ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500 transition-all pr-12"
                  placeholder="Describe the situation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button
                  type="button"
                  onClick={isRecording ? () => mediaRecorderRef.current?.stop() : startRecording}
                  disabled={isTranscribing}
                  className={`absolute bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isRecording ? 'bg-rose-500 text-white animate-pulse shadow-lg' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {isTranscribing ? <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span> : <span>{isRecording ? '⏹' : '🎤'}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center space-x-2">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                <span>4. Geospatial Stream</span>
              </h3>
              <div className="flex flex-col items-end">
                {accuracy && (
                  <div className={`px-3 py-1 rounded-full border mb-1 flex items-center ${accuracy > 100 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 animate-pulse ${accuracy > 100 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <p className="text-[8px] font-black uppercase tracking-widest">Prec: ±{Math.round(accuracy)}m</p>
                  </div>
                )}
                <div className="bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                   <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Last Feed: {lastPing}</p>
                </div>
              </div>
            </div>
            
            <div className="aspect-square bg-slate-50 rounded-3xl relative overflow-hidden border border-slate-100 shadow-inner h-[320px]">
               {location ? (
                 <div className="w-full h-full">
                    {!isMapReady && (
                       <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                       </div>
                    )}
                    <div ref={mapContainerRef} className="w-full h-full"></div>
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-2xl z-20 pointer-events-none">
                       <p className="text-[7px] font-black text-blue-400 uppercase tracking-widest flex items-center mb-1">
                         <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isTracking ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></span>
                         {statusMessage}
                       </p>
                       <p className="text-[11px] font-black text-white tabular-nums tracking-tighter">
                         {location.lat.toFixed(7)}, {location.lng.toFixed(7)}
                       </p>
                    </div>
                    <button onClick={handleLiveDetect} className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm w-10 h-10 rounded-xl border border-slate-100 shadow-xl z-20 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center">
                      <span className="text-sm">📡</span>
                    </button>
                 </div>
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className={`w-20 h-20 ${isLocating ? 'bg-blue-600 text-white shadow-blue-100 shadow-xl' : 'bg-blue-100 text-blue-600'} rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-inner transition-all`}>
                      {isLocating ? <span className="animate-pulse">🛰️</span> : '📍'}
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isLocating ? 'Acquiring Signal' : 'Satellite Link Idle'}</p>
                 </div>
               )}
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Live Street Context"
                  className={`w-full p-4 bg-slate-50 border-none rounded-2xl text-sm outline-none font-bold ring-1 ring-slate-100 transition-all ${isLocating || address.includes('Indexing') ? 'animate-pulse ring-blue-400 pl-10' : ''}`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
                {(isLocating || address.includes('Indexing')) && (
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button onClick={isTracking ? stopTracking : handleLiveDetect} className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-xl ${isTracking ? 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-100 hover:bg-rose-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'}`}>
                {isTracking ? <span>Abort Stream</span> : <span>Force Satellite Pulse</span>}
              </button>
            </div>
          </div>

          <button 
            disabled={isSubmitting || !location || isAnalyzingImage}
            onClick={handleSubmit}
            className="w-full py-6 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Transmitting Intelligence...' : 'Dispatch Signal'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
};
