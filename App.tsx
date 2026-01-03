
import React, { useState, useEffect } from 'react';
import { Language, StoryBook, GenerationStatus } from './types';
import { generateStoryContent, generatePixelArt } from './services/geminiService';
import { RetroButton } from './components/RetroButton';
import { StoryRenderer } from './components/StoryRenderer';

const PixelLoader: React.FC<{ status: GenerationStatus; progress?: number }> = ({ status, progress = 0 }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  
  const messages = status === 'writing' 
    ? [
        "Crafting the quest logs...",
        "Summoning narrative spirits...",
        "Defining hero stats...",
        "Generating world map...",
        "Scripting NPC dialogues...",
        "Saving game data..."
      ]
    : [
        "Placing pixels one by one...",
        "Selecting 16-bit color palette...",
        "Rendering sprites...",
        "Polishing background assets...",
        "Compiling graphical assets...",
        "Finalizing retro aesthetic..."
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex flex-col items-center gap-10 text-center fade-in py-20">
      <div className="relative">
        <div className="pixel-hero mx-auto shadow-[8px_8px_0_rgba(0,0,0,0.5)]"></div>
        <div className="absolute -right-12 top-0 animate-bounce">
          <div className="bg-white text-black pixel-font text-[8px] p-2 border-2 border-black rounded-lg">
            !
          </div>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        <h2 className="pixel-font text-xl md:text-2xl text-yellow-400 uppercase tracking-tighter">
          {status === 'writing' ? 'INITIALIZING QUEST' : 'RENDERING WORLD'}
        </h2>
        
        <p className="pixel-font text-[10px] md:text-xs text-blue-300 min-h-[1.5em] animate-pulse">
          {messages[messageIndex]}
        </p>

        <div className="flex flex-col items-center gap-2 mt-4">
          <div className="progress-container shadow-[6px_6px_0_rgba(0,0,0,0.5)]">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="pixel-font text-[8px] text-gray-400">
            {progress}% COMPLETE
          </div>
        </div>
        {status === 'illustrating' && (
            <p className="pixel-font text-[8px] text-yellow-600 mt-2">
                * SLOW MODE ACTIVE TO PREVENT SERVER OVERLOAD *
            </p>
        )}
      </div>
    </div>
  );
};

// Helper for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  
  // Hero Customization State
  const [showCustomHero, setShowCustomHero] = useState(false);
  const [heroName, setHeroName] = useState('');
  const [heroGender, setHeroGender] = useState('Boy');
  const [heroHair, setHeroHair] = useState('');
  const [heroEyes, setHeroEyes] = useState('');
  const [heroClothing, setHeroClothing] = useState('');

  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [story, setStory] = useState<StoryBook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const startQuest = async () => {
    if (!topic.trim()) return;
    
    setError(null);
    setStatus('writing');
    setProgress(10);
    try {
      // 1. Generate Text (Pass all customization data)
      const generatedStory = await generateStoryContent(
        topic, 
        language, 
        showCustomHero && heroName.trim() ? heroName : undefined,
        showCustomHero ? heroGender : undefined,
        showCustomHero && heroHair.trim() ? heroHair : undefined,
        showCustomHero && heroEyes.trim() ? heroEyes : undefined,
        showCustomHero && heroClothing.trim() ? heroClothing : undefined
      );
      
      setStory(generatedStory);
      setStatus('illustrating');
      setProgress(20);

      // 2. Generate Cover Image
      try {
        const coverUrl = await generatePixelArt(generatedStory.coverImagePrompt);
        setStory(prev => prev ? { ...prev, coverImageUrl: coverUrl } : null);
      } catch (e) {
        console.error("Failed to generate cover", e);
      }
      setProgress(25);

      // DELAY: Wait 10 seconds to respect strict rate limits
      await delay(10000);

      // 3. Generate Page Images
      const updatedPages = [...generatedStory.pages];
      const pageCount = updatedPages.length;
      
      for (let i = 0; i < pageCount; i++) {
        // CRITICAL: 10 second delay between every image request
        // This is necessary to avoid 429 Resource Exhausted errors on the API
        if (i > 0) {
            await delay(10000); 
        }

        try {
          const imageUrl = await generatePixelArt(updatedPages[i].imagePrompt);
          updatedPages[i] = { ...updatedPages[i], imageUrl };
        } catch (e) {
          console.error(`Failed to generate image for page ${i + 1}`, e);
          // Dark placeholder if fails
          updatedPages[i] = { 
            ...updatedPages[i], 
            imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAABdJREFUGFdjOt3W/58BDBgZ0AG6CkLFnQA1+Qf5gqE2OAAAAABJRU5ErkJggg==' 
          };
        }
        
        setStory(prev => prev ? { ...prev, pages: [...updatedPages] } : null);
        const currentProgress = 25 + Math.round(((i + 1) / pageCount) * 75);
        setProgress(currentProgress);
      }

      setStatus('ready');
      setProgress(100);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start quest. Please try again later.");
      setStatus('error');
    }
  };

  const handleRestart = () => {
    setStory(null);
    setStatus('idle');
    setTopic('');
    setProgress(0);
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-1000 ${story && status === 'ready' ? 'bg-[#e5e7eb]' : 'bg-[#0d0d1a]'}`}>
      {status === 'idle' && (
        <div className="max-w-2xl w-full flex flex-col gap-8 text-center animate-fadeIn">
          <div className="mb-4">
            <h1 className="pixel-font text-4xl md:text-6xl text-yellow-400 mb-4 drop-shadow-[0_5px_0_rgba(255,0,0,1)]">
              PIXETALE
            </h1>
            <p className="pixel-font text-sm md:text-base text-blue-300">
              Transform your imagination into a 16-bit adventure!
            </p>
          </div>

          <div className="bg-blue-900/40 p-8 pixel-border flex flex-col gap-6 backdrop-blur-sm">
            {/* Topic Input */}
            <div className="flex flex-col gap-2 text-left">
              <label className="pixel-font text-xs text-white">CHOOSE YOUR ADVENTURE TOPIC:</label>
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. A cat who wanted to be a knight"
                className="bg-black border-4 border-blue-500 p-4 text-font text-white text-xl outline-none focus:border-yellow-400 transition-colors"
              />
            </div>

            {/* Language Select */}
            <div className="flex flex-col gap-2 text-left">
              <label className="pixel-font text-xs text-white">SELECT LANGUAGE:</label>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="bg-black border-4 border-blue-500 p-4 text-font text-white text-xl outline-none cursor-pointer focus:border-yellow-400"
              >
                {Object.values(Language).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {/* FULL Hero Customization */}
            <div className="flex flex-col gap-4">
               <button 
                 onClick={() => setShowCustomHero(!showCustomHero)}
                 className="pixel-font text-xs text-yellow-400 hover:text-yellow-300 text-left underline decoration-dotted underline-offset-4"
               >
                 {showCustomHero ? '[-] CANCEL CUSTOMIZATION' : '[+] FULL CHARACTER CUSTOMIZATION (OPTIONAL)'}
               </button>

               {showCustomHero && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn p-4 border-2 border-white/20 bg-black/30">
                    
                    {/* Name */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="pixel-font text-[9px] text-gray-300">NAME</label>
                      <input 
                        type="text" value={heroName} onChange={(e) => setHeroName(e.target.value)}
                        placeholder="Hero Name"
                        className="bg-black border border-gray-500 p-2 text-font text-white text-lg outline-none focus:border-yellow-400"
                      />
                    </div>

                    {/* Gender */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="pixel-font text-[9px] text-gray-300">GENDER / TYPE</label>
                      <select 
                        value={heroGender} onChange={(e) => setHeroGender(e.target.value)}
                        className="bg-black border border-gray-500 p-2 text-font text-white text-lg outline-none focus:border-yellow-400"
                      >
                        <option value="Boy">Boy</option>
                        <option value="Girl">Girl</option>
                        <option value="Robot">Robot</option>
                        <option value="Animal">Animal</option>
                      </select>
                    </div>

                    {/* Hair */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="pixel-font text-[9px] text-gray-300">HAIR COLOR/STYLE</label>
                      <input 
                        type="text" value={heroHair} onChange={(e) => setHeroHair(e.target.value)}
                        placeholder="e.g. Red spikey hair"
                        className="bg-black border border-gray-500 p-2 text-font text-white text-lg outline-none focus:border-yellow-400"
                      />
                    </div>

                    {/* Eyes */}
                    <div className="flex flex-col gap-1 text-left">
                      <label className="pixel-font text-[9px] text-gray-300">EYE COLOR</label>
                      <input 
                        type="text" value={heroEyes} onChange={(e) => setHeroEyes(e.target.value)}
                        placeholder="e.g. Green glowing eyes"
                        className="bg-black border border-gray-500 p-2 text-font text-white text-lg outline-none focus:border-yellow-400"
                      />
                    </div>

                    {/* Clothing */}
                    <div className="flex flex-col gap-1 text-left col-span-1 md:col-span-2">
                      <label className="pixel-font text-[9px] text-gray-300">CLOTHING / ARMOR</label>
                      <input 
                        type="text" value={heroClothing} onChange={(e) => setHeroClothing(e.target.value)}
                        placeholder="e.g. Blue space suit with a cape"
                        className="bg-black border border-gray-500 p-2 text-font text-white text-lg outline-none focus:border-yellow-400"
                      />
                    </div>
                 </div>
               )}
            </div>

            <RetroButton 
              onClick={startQuest} 
              variant="primary" 
              size="lg"
              disabled={!topic.trim()}
            >
              START QUEST
            </RetroButton>
          </div>
          
          <div className="pixel-font text-[10px] text-gray-500 mt-8">
            POWERED BY GEMINI ENGINE 2.5/3.0
          </div>
        </div>
      )}

      {(status === 'writing' || status === 'illustrating') && (
        <PixelLoader status={status} progress={progress} />
      )}

      {status === 'error' && (
        <div className="max-w-md text-center bg-red-900/50 p-8 pixel-border flex flex-col gap-4">
          <h2 className="pixel-font text-xl text-white">QUEST FAILED!</h2>
          <p className="text-font text-lg text-red-100">{error}</p>
          <RetroButton onClick={handleRestart} variant="accent">RETRY</RetroButton>
        </div>
      )}

      {story && status === 'ready' && (
        <StoryRenderer story={story} onRestart={handleRestart} />
      )}
    </div>
  );
};

export default App;
