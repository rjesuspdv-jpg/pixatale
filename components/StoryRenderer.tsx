
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

  // --- 1. FUNCIÓN PDF NORMAL (Imprimible página por página) ---
  const downloadHtml = () => {
    // Portada (Hoja 1)
    const coverHtml = `
      <div class="print-page cover-page">
        <div class="cover-content">
             <h1 class="main-title">${story.title}</h1>
             <p class="subtitle">A PIXETALE ADVENTURE</p>
             <div class="cover-image-box">
                <img src="${story.coverImageUrl || ''}" alt="Cover">
             </div>
             <div class="cover-footer">
                <p>DEVELOPED FOR PIXETALE</p>
             </div>
        </div>
      </div>
    `;

    // Páginas de Historia (Hoja A: Imagen, Hoja B: Texto)
    const pagesHtml = story.pages.map((p, i) => {
      const paragraphs = p.content.split(/\n\s*\n/).map(text => `<p>${text.trim()}</p>`).join('');
      
      return `
      <!-- Hoja Imagen -->
      <div class="print-page image-page">
        <img class="full-image" src="${p.imageUrl || ''}" alt="Scene ${i + 1}">
        <div class="page-footer">- Art ${i + 1} -</div>
      </div>

      <!-- Hoja Texto -->
      <div class="print-page text-page">
         <div class="text-wrapper">
            <div class="text-content">
                ${paragraphs}
            </div>
         </div>
         <div class="page-footer">- Story ${i + 1} -</div>
      </div>
      `;
    }).join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${story.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    /* Estilos Generales */
    body { 
      margin: 0; padding: 0; background: #555; 
      font-family: 'Crimson Text', serif; 
      display: flex; flex-direction: column; align-items: center;
    }
    
    /* Configuración de Hoja Física (A4 / Carta) */
    .print-page {
      width: 215.9mm; height: 279.4mm; /* Tamaño Carta */
      background: white;
      position: relative;
      overflow: hidden;
      margin-bottom: 20px;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      page-break-after: always; /* ¡IMPORTANTE PARA IMPRIMIR! */
      display: flex; flex-direction: column;
    }

    /* Portada */
    .cover-page { background: #000; color: #fbbf24; text-align: center; justify-content: center; }
    .cover-content { padding: 40px; height: 100%; display: flex; flex-direction: column; }
    .main-title { font-family: 'Press Start 2P'; font-size: 32pt; margin-bottom: 10px; line-height: 1.2; text-shadow: 4px 4px 0 #b45309; }
    .subtitle { font-family: 'Press Start 2P'; font-size: 10pt; color: #888; margin-bottom: 40px; letter-spacing: 2px; }
    .cover-image-box { flex: 1; border: 4px solid #fff; overflow: hidden; margin-bottom: 40px; }
    .cover-image-box img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
    .cover-footer { font-family: 'Press Start 2P'; font-size: 8pt; color: #666; }

    /* Página de Imagen */
    .image-page { background: #000; justify-content: center; }
    .full-image { width: 100%; height: 95%; object-fit: cover; image-rendering: pixelated; }

    /* Página de Texto */
    .text-page { background: #fff; justify-content: center; align-items: center; }
    .text-wrapper { padding: 60px; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-image: radial-gradient(#ccc 1px, transparent 1px); background-size: 20px 20px; }
    .text-content { 
        font-size: 24pt; line-height: 1.6; text-align: justify; 
        border: 4px double #000; padding: 40px; background: #fff;
        width: 100%;
    }
    .text-content p { margin-bottom: 24px; }

    /* Pie de página */
    .page-footer {
        position: absolute; bottom: 20px; width: 100%; text-align: center;
        font-family: 'Press Start 2P'; font-size: 10pt; color: #888;
    }
    .image-page .page-footer { color: #fbbf24; }

    /* MEDIA QUERY DE IMPRESIÓN */
    @media print {
        body { background: none; }
        .print-page { margin: 0; box-shadow: none; border: none; }
    }
  </style>
</head>
<body>
    ${coverHtml}
    ${pagesHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, '_')}_Printable_Story.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- 2. FUNCIÓN LIBRO DE COLOREAR ---
  const downloadColoringBook = () => {
    const coverHtml = `
      <div class="letter-page" style="page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <h1 style="font-family: 'Press Start 2P'; font-size: 28pt; text-align: center; margin: 40px 20px;">${story.title}</h1>
        <p style="font-family: 'Press Start 2P'; font-size: 12pt; margin-bottom: 40px; color: #333;">COLORING BOOK</p>
        <div style="width: 80%; height: 50%; border: 4px solid #000; overflow: hidden;">
            <img src="${story.coverImageUrl || ''}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(150%) brightness(120%); image-rendering: pixelated;">
        </div>
        <div style="margin-top: auto; margin-bottom: 40px; text-align: center;">
             <p style="font-family: 'Press Start 2P'; font-size: 10pt;">NAME: __________________________</p>
        </div>
      </div>
    `;

    const pagesHtml = story.pages.map((p, i) => `
      <div class="letter-page" style="page-break-after: always; padding: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="width: 100%; height: 85%; border: 4px solid #000; overflow: hidden; background: #fff;">
             <img src="${p.imageUrl || ''}" style="width: 100%; height: 100%; object-fit: cover; filter: grayscale(100%) contrast(150%) brightness(120%); image-rendering: pixelated;">
        </div>
        <div style="margin-top: 20px; font-family: 'Press Start 2P'; font-size: 12pt;">Page ${i + 1}</div>
      </div>
    `).join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${story.title} - Coloring</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <style>
    body { background-color: #f0f0f0; margin: 0; padding: 20px; display: flex; flex-direction: column; align-items: center; }
    .letter-page { width: 215.9mm; height: 279.4mm; background-color: #fff; margin-bottom: 20px; position: relative; box-shadow: 0 5px 15px rgba(0,0,0,0.1); border: 1px solid #ccc; }
    @media print { 
        body { background: none; padding: 0; } 
        .letter-page { box-shadow: none; margin: 0; border: none; }
        .no-print { display: none; } 
    }
    .print-btn { padding: 10px 20px; font-family: 'Press Start 2P'; cursor: pointer; margin-bottom: 20px; background: white; border: 2px solid black; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ PRINT</button>
  ${coverHtml}${pagesHtml}
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

  // --- 3. FLIPBOOK APP (Corregido) ---
  const downloadFlipbook = () => {
    // 1. Portada (Tipo Hard)
    // Al abrirla, la librería muestra la siguiente página a la izquierda y la subsiguiente a la derecha.
    const coverPage = `
        <div class="page page-cover" data-density="hard">
            <div class="page-content">
                <h1 class="pixel-font title">${story.title}</h1>
                <div class="cover-image-container">
                    <img src="${story.coverImageUrl}" class="pixel-art-img" />
                </div>
                <div class="footer">CLICK OR DRAG CORNER TO OPEN</div>
            </div>
        </div>
    `;

    // 2. Páginas Interiores (Tipo Soft)
    // Generamos pares: Imagen (Izquierda) - Texto (Derecha)
    const interiorPages = story.pages.map((page, i) => `
        <div class="page" data-density="soft"> <!-- IZQUIERDA: IMAGEN -->
            <div class="page-content image-mode">
                <img src="${page.imageUrl}" class="pixel-art-img full-height" />
                <span class="page-number left-num">${i + 1}A</span>
            </div>
        </div>
        <div class="page" data-density="soft"> <!-- DERECHA: TEXTO -->
            <div class="page-content text-mode">
                <div class="text-box">
                    ${page.content.split('\n').map(p => `<p>${p}</p>`).join('')}
                </div>
                <span class="page-number right-num">${i + 1}B</span>
            </div>
        </div>
    `).join('');

    // 3. Contraportada (Tipo Hard)
    const backCover = `
        <div class="page page-cover" data-density="hard">
            <div class="page-content center-all" style="justify-content: center; align-items: center; display: flex; flex-direction: column;">
                <h2 class="pixel-font" style="font-size: 40px; margin-top: 40%;">THE END</h2>
                <p style="font-family: 'VT323', monospace; font-size: 24px; margin-top: 20px;">Generated with PixeTale</p>
            </div>
        </div>
    `;

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${story.title} - Interactive App</title>
    <script src="https://cdn.jsdelivr.net/npm/page-flip/dist/js/page-flip.browser.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">
    <style>
        body { background-color: #1a1a1a; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; font-family: 'VT323', monospace; }
        .flip-book { box-shadow: 0 0 20px rgba(0,0,0,0.5); display: none; background-size: cover; }
        .page { padding: 20px; background-color: #fdfdfd; border: 1px solid #c2c2c2; overflow: hidden; }
        .page-content { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between; }
        .page-cover { background-color: #0d0d1a; color: #fbbf24; border: 4px solid #fbbf24; }
        .pixel-font { font-family: 'Press Start 2P', cursive; }
        .title { text-align: center; font-size: 20px; text-transform: uppercase; margin-top: 20px; text-shadow: 2px 2px 0 #b45309; }
        .cover-image-container { flex: 1; margin: 20px; border: 4px solid #fff; overflow: hidden; }
        .pixel-art-img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
        
        .image-mode { padding: 0; background: #000; justify-content: center; align-items: center; }
        .full-height { width: 100%; height: 100%; object-fit: cover; }
        
        .text-mode { background: #fff; color: #000; justify-content: center; }
        .text-box { padding: 20px; font-size: 24px; line-height: 1.5; text-align: justify; border: 2px dashed #ccc; height: 90%; overflow-y: auto; }
        .text-box p { margin-bottom: 15px; }

        .page-number { font-family: 'Press Start 2P'; font-size: 10px; color: #888; position: absolute; bottom: 10px; }
        .left-num { left: 10px; color: #fbbf24; }
        .right-num { right: 10px; }

        .footer { text-align: center; font-size: 10px; margin-bottom: 10px; animation: blink 2s infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 99; display: flex; gap: 20px; }
        .btn { background: #fbbf24; border: 4px solid #fff; padding: 10px 20px; font-family: 'Press Start 2P'; cursor: pointer; box-shadow: 4px 4px 0 #000; }
        .btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 #000; }
    </style>
</head>
<body>
    <div class="container">
        <div id="book" class="flip-book">
            ${coverPage}${interiorPages}${backCover}
        </div>
    </div>
    <div class="controls">
        <button class="btn" onclick="book.flipPrev()">PREV</button>
        <button class="btn" onclick="book.flipNext()">NEXT</button>
    </div>
    <script>
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        function playFlipSound() {
            if(audioCtx.state === 'suspended') audioCtx.resume();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        }
        const pageFlip = new St.PageFlip(document.getElementById('book'), {
            width: 450, height: 600, size: 'stretch', minWidth: 300, maxWidth: 800, minHeight: 400, maxHeight: 1200, maxShadowOpacity: 0.5, showCover: true, mobileScrollSupport: false 
        });
        pageFlip.loadFromHTML(document.querySelectorAll('.page'));
        document.getElementById('book').style.display = 'block';
        pageFlip.on('flip', (e) => { playFlipSound(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') pageFlip.flipNext(); if (e.key === 'ArrowLeft') pageFlip.flipPrev(); });
        window.book = pageFlip;
    </script>
</body></html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.title.replace(/\s+/g, '_')}_Interactive_Flipbook.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl w-full mx-auto p-4 flex flex-col items-center min-h-[90vh] justify-center gap-6">
      <div className="text-center w-full">
        <p className="pixel-font text-[10px] text-gray-400">PAGE {pageIndex} PREVIEW</p>
      </div>

      <div className="w-full max-w-[500px] aspect-[3/4] relative bg-white border-[8px] border-black shadow-[20px_20px_0_rgba(0,0,0,0.3)] overflow-hidden rounded-md">
          { isCover ? (
              <img src={story.coverImageUrl} className="w-full h-full object-cover" style={{imageRendering: 'pixelated'}} />
          ) : (
              <img src={currentStoryPage?.imageUrl} className="w-full h-full object-cover" style={{imageRendering: 'pixelated'}} />
          )}
          
          {/* Overlay de texto para la vista previa */}
          {!isCover && (
            <div className={`absolute left-0 right-0 px-4 py-4 ${currentStoryPage?.textPosition === 'top' ? 'top-0' : 'bottom-0'} bg-black/60`}>
                <p className="text-white font-mono text-sm">{currentStoryPage?.content.substring(0, 100)}...</p>
            </div>
          )}
      </div>

      <div className="flex flex-wrap gap-4 w-full justify-center items-center mt-4">
        <RetroButton onClick={prevStep} disabled={pageIndex === 0} variant="secondary" size="sm">PREV</RetroButton>
        
        <div className="flex flex-col md:flex-row gap-2">
            <RetroButton onClick={downloadHtml} variant="primary" size="sm" className="bg-blue-600">PDF (PRINT)</RetroButton>
            <RetroButton onClick={downloadColoringBook} variant="primary" size="sm" className="bg-white text-black border-gray-400">COLORING BOOK</RetroButton>
            <RetroButton onClick={downloadFlipbook} variant="accent" size="sm" className="bg-yellow-400 text-black animate-pulse">★ GET FLIPBOOK APP</RetroButton>
        </div>

        <RetroButton onClick={nextStep} disabled={pageIndex === totalSteps - 1} variant="primary" size="sm">NEXT</RetroButton>
      </div>

      <div className="flex justify-center mt-4">
        <RetroButton onClick={onRestart} variant="secondary" size="sm" className="bg-red-600 border-red-900 hover:bg-red-500">EXIT</RetroButton>
      </div>
    </div>
  );
};
