
import React, { useState } from 'react';
import { StoryBook } from '../types';
import { RetroButton } from './RetroButton';

interface StoryRendererProps {
  story: StoryBook;
  onRestart: () => void;
}

export const StoryRenderer: React.FC<StoryRendererProps> = ({ story, onRestart }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const totalSteps = story.pages.length + 1;

  const nextStep = () => setPageIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setPageIndex((prev) => Math.max(prev - 1, 0));

  const isCover = pageIndex === 0;
  const currentStoryPage = !isCover ? story.pages[pageIndex - 1] : null;

  const downloadHtml = () => {
    // 1. Generate Cover HTML (Box Art Style)
    // Cover is Page 0
    const coverHtml = `
      <div id="page-0" class="story-page active" style="display: flex; flex-direction: column; background: #000;">
        <div style="padding: 40px 20px; text-align: center; background: #000; border-bottom: 4px solid #333;">
             <h1 class="page-title" style="font-size: 32pt; margin: 0; line-height: 1.2; color: #fbbf24; text-shadow: 4px 4px 0 #b45309;">${story.title}</h1>
             <p style="color: #888; font-family: 'Press Start 2P'; font-size: 10pt; margin-top: 15px; text-transform: uppercase; letter-spacing: 2px;">A PIXETALE ADVENTURE</p>
        </div>
        <div style="flex: 1; position: relative; overflow: hidden; background: #111;">
             <img src="${story.coverImageUrl || ''}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated;">
        </div>
        <div style="padding: 20px; text-align: center; background: #000; border-top: 4px solid #333;">
             <p style="font-family: 'Press Start 2P'; font-size: 10pt; color: #666; margin-bottom: 10px;">DEVELOPED FOR PIXETALE</p>
             <button onclick="goToPage(1)" style="font-family: 'Press Start 2P'; font-size: 10pt; color: #fbbf24; background: none; border: 2px solid #fbbf24; padding: 10px; cursor: pointer; animation: blink 1s infinite;">PRESS START</button>
        </div>
      </div>
    `;

    // 2. Generate Story Pages HTML (Split: Image Page then Text Page)
    const pagesHtml = story.pages.map((p, i) => {
      const paragraphs = p.content.split(/\n\s*\n/).map(text => `<p>${text.trim()}</p>`).join('');
      
      // Calculate IDs based on split layout
      // i=0 -> Image=1, Text=2
      // i=1 -> Image=3, Text=4
      const imgId = (i * 2) + 1;
      const txtId = (i * 2) + 2;

      const imagePage = `
      <div id="page-${imgId}" class="story-page image-only" style="display: none;">
        <img class="full-bleed-image" src="${p.imageUrl || ''}" alt="Scene ${i + 1}">
        <div class="page-number" style="text-shadow: 2px 2px 0 #000;">- Art ${i + 1} -</div>
      </div>
      `;

      const textPage = `
      <div id="page-${txtId}" class="story-page text-only" style="display: none; background: #000; flex-direction: column; justify-content: center; align-items: center;">
         <div class="text-container-centered">
            <div class="text-box readable-content">
                ${paragraphs}
            </div>
         </div>
         <div class="page-number">- Story ${i + 1} -</div>
      </div>
      `;

      return imagePage + textPage;
    }).join('');

    // Total pages calculation: 1 Cover + (Story Pages * 2)
    const totalExportPages = 1 + (story.pages.length * 2);

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title} - Interactive Story</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,600;0,700;1,600&family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    :root { --page-width: 215.9mm; --page-height: 279.4mm; }
    * { box-sizing: border-box; }
    
    body { 
      background-color: #1a1a1a; margin: 0; padding: 0; 
      font-family: 'Crimson Text', serif; height: 100vh; overflow: hidden;
      display: flex; justify-content: center; align-items: center;
    }

    /* Print Styles */
    @media print {
      body { height: auto; display: block; overflow: visible; background: white; }
      .story-page { display: block !important; page-break-after: always; height: 100vh; position: relative; border: none; box-shadow: none; }
      .toolbar, .nav-btn, .search-overlay { display: none !important; }
      .text-only { background: white !important; color: black !important; }
      .text-box { background: none !important; border: none !important; color: black !important; text-shadow: none !important; }
      .text-box p { color: black !important; text-shadow: none !important; }
    }

    .book-container {
      width: var(--page-width); height: var(--page-height);
      max-height: 95vh; aspect-ratio: 215.9 / 279.4;
      position: relative; background: #000;
      box-shadow: 0 0 50px rgba(0,0,0,0.8);
    }
    
    .story-page { width: 100%; height: 100%; position: relative; overflow: hidden; background: #000; }
    .full-bleed-image { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
    
    .text-container-centered {
        width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 40px;
        background-image: radial-gradient(circle, #1a1a1a 0%, #000 100%);
    }

    .text-box {
      background: rgba(0, 0, 0, 0.6); padding: 40px; border-radius: 8px;
      backdrop-filter: blur(4px); border: 4px double #fbbf24;
      max-width: 90%;
    }
    .text-box p { font-size: 22pt; line-height: 1.6; margin: 0 0 24px 0; color: #fff; text-shadow: 2px 2px 0 #000; text-align: justify; }
    
    .page-number {
      position: absolute; bottom: 20px; width: 100%; text-align: center;
      font-size: 12pt; color: #fbbf24; font-family: 'Press Start 2P', cursive;
    }

    /* Toolbar Styles */
    .toolbar {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); padding: 10px 20px; border-radius: 50px;
      display: flex; gap: 15px; border: 2px solid #fbbf24; z-index: 9999;
      box-shadow: 0 10px 20px rgba(0,0,0,0.5);
    }
    .tool-btn {
      background: none; border: none; color: white; cursor: pointer; font-size: 20px;
      width: 40px; height: 40px; border-radius: 50%; transition: 0.2s;
      display: flex; justify-content: center; align-items: center;
    }
    .tool-btn:hover { background: #fbbf24; color: black; }
    
    .search-overlay {
        position: absolute; top: 10px; right: 10px; background: white; padding: 5px; display: none; z-index: 100;
        border: 2px solid #fbbf24; font-family: sans-serif;
    }

    @keyframes blink { 50% { opacity: 0; } }
  </style>
</head>
<body>

  <div class="book-container" id="book">
    ${coverHtml}
    ${pagesHtml}
    
    <div id="search-box" class="search-overlay">
        <input type="text" id="search-input" placeholder="Find text..." onkeydown="if(event.key==='Enter') findNext()">
        <button onclick="findNext()">Find</button>
        <button onclick="document.getElementById('search-box').style.display='none'">X</button>
    </div>
  </div>

  <div class="toolbar">
    <button class="tool-btn" onclick="prevPage()" title="Previous">⬅️</button>
    <button class="tool-btn" onclick="togglePlay()" id="play-btn" title="Read Aloud">▶️</button>
    <button class="tool-btn" onclick="toggleMute()" id="mute-btn" title="Mute Music/Audio">🔊</button>
    <button class="tool-btn" onclick="toggleSearch()" title="Search Text">🔍</button>
    <button class="tool-btn" onclick="toggleFullScreen()" title="Fullscreen">⛶</button>
    <button class="tool-btn" onclick="window.print()" title="Print / PDF">🖨️</button>
    <button class="tool-btn" onclick="nextPage()" title="Next">➡️</button>
  </div>

  <script>
    let currentPage = 0;
    const totalPages = ${totalExportPages};
    let isSpeaking = false;
    let isMuted = false;
    let speechUtterance = null;

    function showPage(index) {
        document.querySelectorAll('.story-page').forEach(el => el.style.display = 'none');
        const pageId = index === 0 ? 'page-0' : 'page-' + index;
        const el = document.getElementById(pageId);
        if(el) {
            // Check if text page needs flex display or block
            if(el.classList.contains('text-only')) {
                el.style.display = 'flex';
            } else {
                el.style.display = 'block';
            }
            if(index === 0) el.style.display = 'flex'; // Cover is flex

            currentPage = index;
            // Stop speech if turning page
            window.speechSynthesis.cancel();
            isSpeaking = false;
            document.getElementById('play-btn').innerText = '▶️';
        }
    }

    function nextPage() {
        if(currentPage < totalPages - 1) showPage(currentPage + 1);
    }

    function prevPage() {
        if(currentPage > 0) showPage(currentPage - 1);
    }
    
    function goToPage(n) {
        showPage(n);
    }

    function togglePlay() {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            isSpeaking = false;
            document.getElementById('play-btn').innerText = '▶️';
        } else {
            if (isMuted) return;
            const pageId = currentPage === 0 ? 'page-0' : 'page-' + currentPage;
            const el = document.getElementById(pageId);
            
            // Try to find text
            let text = "";
            if (currentPage === 0) {
                text = "${story.title}. A Pixetale Adventure.";
            } else {
                // If on image page, maybe user wants to hear the next page's text? 
                // For now, only read if there is text on current page.
                const textBox = el.querySelector('.text-box');
                if (textBox) {
                    text = textBox.innerText;
                } else {
                    // We are on an image page
                    text = "Illustration page. Go to next page to read.";
                }
            }
            
            if (text) {
                speechUtterance = new SpeechSynthesisUtterance(text);
                speechUtterance.onend = () => {
                    isSpeaking = false;
                    document.getElementById('play-btn').innerText = '▶️';
                };
                window.speechSynthesis.speak(speechUtterance);
                isSpeaking = true;
                document.getElementById('play-btn').innerText = '⏹️';
            }
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        window.speechSynthesis.cancel();
        isSpeaking = false;
        document.getElementById('play-btn').innerText = '▶️';
        document.getElementById('mute-btn').innerText = isMuted ? '🔇' : '🔊';
    }

    function toggleFullScreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    function toggleSearch() {
        const box = document.getElementById('search-box');
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        if(box.style.display === 'block') document.getElementById('search-input').focus();
    }
    
    function findNext() {
        const val = document.getElementById('search-input').value;
        if(window.find(val)) {
            // Found
        } else {
            alert('Text not found on this page (Browser search limitation). Try moving pages.');
        }
    }

    // Initialize
    showPage(0);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if(e.key === 'ArrowRight') nextPage();
        if(e.key === 'ArrowLeft') prevPage();
    });
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, '_')}_Interactive_eBook.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadColoringBook = () => {
    // Coloring Book HTML generation (Grayscale, No Text, White Background)
    
    // Cover HTML
    const coverHtml = `
      <div class="letter-page" style="position: relative; overflow: hidden; page-break-after: always; background: #fff; border: 4px solid #000; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        
        <h1 style="font-family: 'Press Start 2P'; font-size: 32pt; text-align: center; color: #000; margin: 40px 20px 20px 20px; text-transform: uppercase; line-height: 1.2;">${story.title}</h1>
        <p style="font-family: 'Press Start 2P'; font-size: 12pt; margin-bottom: 40px; color: #333;">COLORING BOOK</p>

        <!-- Grayscale Cover Image -->
        <div style="width: 80%; height: 50%; border: 4px solid #000; overflow: hidden;">
            <img src="${story.coverImageUrl || ''}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(150%) brightness(120%); image-rendering: pixelated;">
        </div>
        
        <div style="margin-top: auto; margin-bottom: 40px; text-align: center;">
             <p style="font-family: 'Press Start 2P'; font-size: 10pt; color: #000;">NAME: __________________________</p>
             <p style="font-family: 'Press Start 2P'; font-size: 8pt; color: #666; margin-top: 15px;">DEVELOPED FOR PIXETALE</p>
        </div>
      </div>
    `;

    // Pages HTML (Images Only)
    const pagesHtml = story.pages.map((p, i) => `
      <div class="letter-page" style="page-break-after: always; background: #fff; border: 2px dashed #ccc; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        
        <!-- Large Grayscale Image for coloring -->
        <div style="width: 100%; height: 85%; border: 4px solid #000; overflow: hidden; background: #fff;">
             <img src="${p.imageUrl || ''}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(150%) brightness(120%); image-rendering: pixelated;">
        </div>
        
        <!-- Page Number -->
        <div style="margin-top: 20px; font-family: 'Press Start 2P'; font-size: 12pt; color: #000;">
           Page ${i + 1}
        </div>
      </div>
    `).join('');

    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${story.title} - Coloring Book</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    :root {
      --page-width: 215.9mm;
      --page-height: 279.4mm;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; }
    
    body { 
      background-color: #f0f0f0; 
      margin: 0; 
      padding: 40px; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
    }

    @page { 
      size: Letter portrait; 
      margin: 0; 
    }

    @media print {
      body { background: none !important; padding: 0 !important; }
      .letter-page { box-shadow: none !important; margin: 0 !important; border: none !important; }
      .no-print { display: none !important; }
    }

    .letter-page {
      width: var(--page-width);
      height: var(--page-height);
      background-color: #fff;
      margin-bottom: 40px;
      position: relative;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .no-print-header { 
      background: #fff; color: #000; 
      width: 100%; max-width: var(--page-width);
      padding: 20px; text-align: center; 
      font-family: 'Press Start 2P'; 
      margin-bottom: 20px; border: 4px solid #000;
    }
    
    .print-btn { 
      padding: 15px 30px; font-family: 'Press Start 2P'; 
      cursor: pointer; background: #fff; 
      border: 4px solid #000; color: #000; 
      font-size: 14px;
      text-transform: uppercase;
    }
    .print-btn:hover { background: #000; color: #fff; }
  </style>
</head>
<body>
  <div class="no-print no-print-header">
    <div style="font-size: 16px; margin-bottom: 10px;">COLORING BOOK MODE</div>
    <button class="print-btn" onclick="window.print()">🖨️ PRINT COLORING BOOK</button>
  </div>
  ${coverHtml}
  ${pagesHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, '_')}_ColoringBook.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 flex flex-col items-center min-h-[90vh] justify-center gap-6">
      <div className="text-center w-full">
        <div className="flex justify-center items-center gap-4">
          <div className="h-1 flex-1 bg-yellow-400/30"></div>
          <p className="pixel-font text-[10px] text-gray-400 whitespace-nowrap">
            {isCover ? "COVER" : `PAGE ${pageIndex} OF ${totalSteps - 1}`}
          </p>
          <div className="h-1 flex-1 bg-yellow-400/30"></div>
        </div>
      </div>

      {/* Main Book Surface - 3:4 Aspect Ratio (Letter Portrait) */}
      <div className="w-full max-w-[500px] aspect-[3/4] relative bg-white border-[8px] border-black shadow-[20px_20px_0_rgba(0,0,0,0.3)] overflow-hidden rounded-md group">
        
        {/* RENDER COVER PAGE (Redesigned) */}
        {isCover && (
            <div className="absolute inset-0 flex flex-col bg-black">
                {/* Title Header - Separate from image */}
                <div className="p-6 pb-4 text-center z-10 bg-black border-b-4 border-white/10">
                    <h1 className="pixel-font text-xl md:text-3xl text-yellow-400 uppercase leading-tight drop-shadow-[2px_2px_0_rgba(180,83,9,1)]">
                        {story.title}
                    </h1>
                    <p className="pixel-font text-[8px] md:text-[10px] text-gray-400 mt-2 tracking-widest">
                        A PIXETALE ADVENTURE
                    </p>
                </div>

                {/* Image Area - Flexible grow */}
                <div className="relative flex-1 w-full overflow-hidden bg-[#111]">
                    {story.coverImageUrl ? (
                        <img 
                            src={story.coverImageUrl} 
                            alt="Book Cover" 
                            style={{ imageRendering: 'pixelated' }}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                             <span className="pixel-font text-gray-400 animate-pulse">GENERATING COVER...</span>
                        </div>
                    )}
                </div>

                {/* Footer / Credits */}
                <div className="p-4 bg-black text-center z-10 border-t-4 border-white/10">
                    <p className="pixel-font text-[10px] text-gray-500 mb-1">
                        DEVELOPED FOR PIXETALE
                    </p>
                    <p className="pixel-font text-[8px] text-yellow-600">
                        PRESS START
                    </p>
                </div>
            </div>
        )}

        {/* RENDER STORY PAGE */}
        {!isCover && currentStoryPage && (
            <>
                {/* Background Image */}
                {currentStoryPage.imageUrl ? (
                <img 
                    src={currentStoryPage.imageUrl} 
                    alt={`Page ${pageIndex}`} 
                    style={{ imageRendering: 'pixelated' }}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center z-0">
                    <span className="pixel-font text-gray-400 animate-pulse">GENERATING ART...</span>
                </div>
                )}

                {/* TEXT OVERLAY - Dynamic Position with Improved Readability Box */}
                <div className={`
                absolute left-0 right-0 px-8 py-10 z-20 flex flex-col items-center pointer-events-none transition-all duration-500
                ${currentStoryPage.textPosition === 'top' 
                    ? 'top-0 pt-24 bg-gradient-to-b from-black/95 via-black/60 to-transparent justify-start' 
                    : 'bottom-0 pb-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent justify-end'} 
                `}> 
                
                {/* Semi-transparent text box for guaranteed contrast */}
                <div className="bg-black/40 backdrop-blur-[2px] p-4 rounded-lg border border-white/10 shadow-lg max-h-[50%] overflow-y-auto">
                    <div className="text-white text-lg md:text-xl font-serif font-bold leading-relaxed text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)] [text-shadow:2px_2px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000]">
                        {currentStoryPage.content.split(/\n\s*\n/).map((paragraph, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-4 md:mt-6" : ""}>
                            {paragraph}
                        </p>
                        ))}
                    </div>
                </div>
                </div>

                {/* Fixed Page Number at Bottom (React View) */}
                <div className="absolute bottom-6 left-0 right-0 z-30 text-center pointer-events-none">
                    <span className="pixel-font text-[10px] text-yellow-400 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        - {pageIndex} -
                    </span>
                </div>
            </>
        )}

        {/* Navigation Tap Zones */}
        <div className="absolute inset-y-0 left-0 w-1/6 z-20 cursor-pointer hover:bg-white/5 transition-colors" onClick={prevStep} title="Previous Page"></div>
        <div className="absolute inset-y-0 right-0 w-1/6 z-20 cursor-pointer hover:bg-white/5 transition-colors" onClick={nextStep} title="Next Page"></div>
      </div>

      <div className="flex flex-wrap gap-4 w-full justify-center items-center mt-4">
        <RetroButton 
          onClick={prevStep} 
          disabled={pageIndex === 0}
          variant="secondary"
          size="sm"
        >
          {pageIndex === 0 ? 'START' : 'PREV'}
        </RetroButton>

        <div className="flex flex-col md:flex-row gap-2">
            <RetroButton 
            onClick={downloadHtml}
            variant="accent"
            size="sm"
            >
            INTERACTIVE PDF
            </RetroButton>

            <RetroButton 
            onClick={downloadColoringBook}
            variant="primary" // Different color to distinguish
            className="bg-white text-black border-gray-400 hover:bg-gray-200"
            size="sm"
            >
            COLORING BOOK
            </RetroButton>
        </div>

        <RetroButton 
          onClick={onRestart}
          variant="secondary"
          size="sm"
          className="bg-red-600 border-red-900 hover:bg-red-500"
        >
          EXIT
        </RetroButton>

        <RetroButton 
          onClick={nextStep} 
          disabled={pageIndex === totalSteps - 1}
          variant="primary"
          size="sm"
        >
          {pageIndex === 0 ? 'READ STORY' : 'NEXT'}
        </RetroButton>
      </div>
    </div>
  );
};
