import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Crop, 
  RotateCw, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  X, 
  RefreshCw,
  Move,
  Image as ImageIcon
} from 'lucide-react';

export interface ImageCropperModalProps {
  imageFile: File | null;
  imageUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File, previewDataUrl: string) => void;
  onUseOriginal?: (originalFile: File) => void;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | 'move' | null;

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageFile,
  imageUrl,
  isOpen,
  onClose,
  onCropComplete,
  onUseOriginal
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null = free

  // Crop box percentage values relative to displayed image container (0 to 100)
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });

  const [activeHandle, setActiveHandle] = useState<HandleType>(null);
  const [dragStart, setDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load image when modal opens or input changes
  useEffect(() => {
    if (!isOpen) return;

    setRotation(0);
    setZoom(1);
    setAspectRatio(null);
    setCropBox({ x: 10, y: 10, width: 80, height: 80 });

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setImageSrc(src);
      };
      reader.readAsDataURL(imageFile);
    } else if (imageUrl) {
      setImageSrc(imageUrl);
    }
  }, [isOpen, imageFile, imageUrl]);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
  };

  // Rotation handler
  const handleRotate = (angle: number) => {
    setRotation((prev) => {
      const next = (prev + angle + 360) % 360;
      return next;
    });
    // Reset crop box safely when rotating
    setCropBox({ x: 10, y: 10, width: 80, height: 80 });
  };

  // Aspect ratio changer
  const handleSetAspect = (ratio: number | null) => {
    setAspectRatio(ratio);
    if (!ratio) return;

    setCropBox((prev) => {
      let newW = prev.width;
      let newH = newW / ratio;

      if (newH > 90) {
        newH = 90;
        newW = newH * ratio;
      }
      if (newW > 90) {
        newW = 90;
        newH = newW / ratio;
      }

      return {
        x: Math.max(5, Math.min(95 - newW, prev.x)),
        y: Math.max(5, Math.min(95 - newH, prev.y)),
        width: Math.min(90, Math.max(15, newW)),
        height: Math.min(90, Math.max(15, newH))
      };
    });
  };

  // Reset to full image
  const handleResetCrop = () => {
    setCropBox({ x: 5, y: 5, width: 90, height: 90 });
    setAspectRatio(null);
    setRotation(0);
    setZoom(1);
  };

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();

    // Capture pointer to track movements outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setActiveHandle(handle);
    setDragStart({
      pointerX: e.clientX,
      pointerY: e.clientY,
      cropX: cropBox.x,
      cropY: cropBox.y,
      cropW: cropBox.width,
      cropH: cropBox.height
    });
  };

  // Pointer Move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!activeHandle || !dragStart || !containerRef.current) return;

    e.preventDefault();
    const containerRect = containerRef.current.getBoundingClientRect();
    if (containerRect.width === 0 || containerRect.height === 0) return;

    // Delta as percentage of container width/height
    const deltaX = ((e.clientX - dragStart.pointerX) / containerRect.width) * 100;
    const deltaY = ((e.clientY - dragStart.pointerY) / containerRect.height) * 100;

    const MIN_SIZE = 10; // Minimum 10% crop size

    setCropBox(() => {
      let { cropX, cropY, cropW, cropH } = dragStart;

      if (activeHandle === 'move') {
        let newX = cropX + deltaX;
        let newY = cropY + deltaY;

        newX = Math.max(0, Math.min(100 - cropW, newX));
        newY = Math.max(0, Math.min(100 - cropH, newY));

        return { x: newX, y: newY, width: cropW, height: cropH };
      }

      // Handle Corner / Edge resizing
      let newX = cropX;
      let newY = cropY;
      let newW = cropW;
      let newH = cropH;

      if (activeHandle.includes('e')) {
        newW = Math.min(100 - cropX, Math.max(MIN_SIZE, cropW + deltaX));
      }
      if (activeHandle.includes('w')) {
        const potentialW = Math.max(MIN_SIZE, cropW - deltaX);
        const maxShift = cropX + cropW - MIN_SIZE;
        newX = Math.max(0, Math.min(maxShift, cropX + deltaX));
        newW = cropX + cropW - newX;
      }
      if (activeHandle.includes('s')) {
        newH = Math.min(100 - cropY, Math.max(MIN_SIZE, cropH + deltaY));
      }
      if (activeHandle.includes('n')) {
        const maxShift = cropY + cropH - MIN_SIZE;
        newY = Math.max(0, Math.min(maxShift, cropY + deltaY));
        newH = cropY + cropH - newY;
      }

      // Maintain aspect ratio if selected
      if (aspectRatio) {
        if (activeHandle === 'e' || activeHandle === 'w' || activeHandle === 'se' || activeHandle === 'sw') {
          newH = newW / aspectRatio;
          if (newY + newH > 100) {
            newH = 100 - newY;
            newW = newH * aspectRatio;
          }
        } else if (activeHandle === 'n' || activeHandle === 's') {
          newW = newH * aspectRatio;
          if (newX + newW > 100) {
            newW = 100 - newX;
            newH = newW / aspectRatio;
          }
        }
      }

      return {
        x: Math.max(0, Math.min(100 - MIN_SIZE, newX)),
        y: Math.max(0, Math.min(100 - MIN_SIZE, newY)),
        width: Math.max(MIN_SIZE, Math.min(100 - newX, newW)),
        height: Math.max(MIN_SIZE, Math.min(100 - newY, newH))
      };
    });
  }, [activeHandle, dragStart, aspectRatio]);

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeHandle) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    setActiveHandle(null);
    setDragStart(null);
  };

  // Perform Final Crop on Canvas
  const handleCropAndSave = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // 1. Create a canvas for rotated image
      const isRotated90or270 = rotation === 90 || rotation === 270;
      const rotW = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      const rotH = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = rotW;
      rotCanvas.height = rotH;
      const rotCtx = rotCanvas.getContext('2d');
      if (!rotCtx) throw new Error('Canvas context could not be created');

      rotCtx.translate(rotW / 2, rotH / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // 2. Compute cropped pixel bounding box
      const cropPixelX = (cropBox.x / 100) * rotW;
      const cropPixelY = (cropBox.y / 100) * rotH;
      const cropPixelW = (cropBox.width / 100) * rotW;
      const cropPixelH = (cropBox.height / 100) * rotH;

      // 3. Render cropped output
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = Math.max(1, Math.round(cropPixelW));
      finalCanvas.height = Math.max(1, Math.round(cropPixelH));
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) throw new Error('Final canvas context could not be created');

      finalCtx.drawImage(
        rotCanvas,
        cropPixelX,
        cropPixelY,
        cropPixelW,
        cropPixelH,
        0,
        0,
        finalCanvas.width,
        finalCanvas.height
      );

      // Convert to blob and file
      const previewDataUrl = finalCanvas.toDataURL('image/jpeg', 0.90);
      
      finalCanvas.toBlob((blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }
        const fileName = imageFile ? `cropped_${imageFile.name.replace(/\.[^/.]+$/, '')}.jpg` : `cropped_question_${Date.now()}.jpg`;
        const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
        
        setIsProcessing(false);
        onCropComplete(croppedFile, previewDataUrl);
      }, 'image/jpeg', 0.90);

    } catch (err: any) {
      console.error('Error cropping image:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-2 sm:p-4 select-none touch-none animate-fade-in overflow-hidden">
      
      {/* 🟢 TOP BAR */}
      <div className="w-full max-w-4xl flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <Crop className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-white truncate flex items-center space-x-1.5">
              <span>Soru Alanını Kırp</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                Mobil Uyumlu
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 truncate hidden sm:block">
              Sorunun bulunduğu alanı çerçeveyi parmağınızla/farenizle sürükleyip seçin.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {onUseOriginal && imageFile && (
            <button
              type="button"
              onClick={() => onUseOriginal(imageFile)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-all border border-slate-700 hover:border-slate-600 cursor-pointer hidden md:flex items-center space-x-1"
              title="Kırpmadan orijinal fotoğrafı kullan"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Orijinali Kullan</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 🖼️ MIDDLE WORKSPACE (TOUCH CANVAS / CONTAINER) */}
      <div className="relative flex-1 w-full max-w-4xl my-2 flex items-center justify-center overflow-hidden bg-slate-950/80 rounded-2xl border border-white/10 shadow-inner">
        <div 
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative inline-block max-w-full max-h-full cursor-crosshair overflow-hidden touch-none"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease'
          }}
        >
          {/* Base Image */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Kırpılacak Soru"
            onLoad={onImageLoad}
            draggable={false}
            className="block max-h-[60vh] sm:max-h-[66vh] w-auto max-w-full object-contain pointer-events-none transition-transform duration-200 select-none"
            style={{
              transform: `rotate(${rotation}deg)`
            }}
          />

          {/* 🌑 DARKENED OVERLAY MASK */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Top Dark Block */}
            <div 
              className="absolute left-0 right-0 top-0 bg-black/65 backdrop-blur-[0.5px]"
              style={{ height: `${cropBox.y}%` }}
            />
            {/* Bottom Dark Block */}
            <div 
              className="absolute left-0 right-0 bottom-0 bg-black/65 backdrop-blur-[0.5px]"
              style={{ height: `${100 - (cropBox.y + cropBox.height)}%` }}
            />
            {/* Left Dark Block */}
            <div 
              className="absolute left-0 bg-black/65 backdrop-blur-[0.5px]"
              style={{
                top: `${cropBox.y}%`,
                height: `${cropBox.height}%`,
                width: `${cropBox.x}%`
              }}
            />
            {/* Right Dark Block */}
            <div 
              className="absolute right-0 bg-black/65 backdrop-blur-[0.5px]"
              style={{
                top: `${cropBox.y}%`,
                height: `${cropBox.height}%`,
                width: `${100 - (cropBox.x + cropBox.width)}%`
              }}
            />
          </div>

          {/* ✂️ INTERACTIVE CROP BOX */}
          <div
            className="absolute border-2 border-indigo-400 bg-transparent shadow-[0_0_0_1px_rgba(255,255,255,0.4),0_0_20px_rgba(99,102,241,0.4)] cursor-move touch-none"
            style={{
              left: `${cropBox.x}%`,
              top: `${cropBox.y}%`,
              width: `${cropBox.width}%`,
              height: `${cropBox.height}%`
            }}
            onPointerDown={(e) => handlePointerDown(e, 'move')}
          >
            {/* Rule of Thirds Grid Lines */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div />
            </div>

            {/* Center Drag Helper Badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40 hover:opacity-100 transition-opacity bg-indigo-950/80 text-indigo-300 px-2 py-1 rounded-full text-[10px] font-bold flex items-center space-x-1 border border-indigo-400/40 shadow">
              <Move className="w-3 h-3" />
              <span className="hidden sm:inline">Taşı</span>
            </div>

            {/* 🎯 TOUCH HANDLES (8 Directions with large tap zones for mobile) */}
            {/* Top-Left (NW) */}
            <div
              className="absolute -top-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'nw')}
            >
              <div className="w-4 h-4 bg-indigo-400 border-2 border-white rounded-full shadow-lg" />
            </div>

            {/* Top-Right (NE) */}
            <div
              className="absolute -top-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'ne')}
            >
              <div className="w-4 h-4 bg-indigo-400 border-2 border-white rounded-full shadow-lg" />
            </div>

            {/* Bottom-Left (SW) */}
            <div
              className="absolute -bottom-3.5 -left-3.5 w-7 h-7 flex items-center justify-center cursor-nesw-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'sw')}
            >
              <div className="w-4 h-4 bg-indigo-400 border-2 border-white rounded-full shadow-lg" />
            </div>

            {/* Bottom-Right (SE) */}
            <div
              className="absolute -bottom-3.5 -right-3.5 w-7 h-7 flex items-center justify-center cursor-nwse-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'se')}
            >
              <div className="w-4 h-4 bg-indigo-400 border-2 border-white rounded-full shadow-lg" />
            </div>

            {/* Top Center (N) */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-8 h-7 flex items-center justify-center cursor-ns-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'n')}
            >
              <div className="w-6 h-2 bg-indigo-300 border border-white rounded-full shadow-md" />
            </div>

            {/* Bottom Center (S) */}
            <div
              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-8 h-7 flex items-center justify-center cursor-ns-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 's')}
            >
              <div className="w-6 h-2 bg-indigo-300 border border-white rounded-full shadow-md" />
            </div>

            {/* Left Center (W) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-3.5 w-7 h-8 flex items-center justify-center cursor-ew-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'w')}
            >
              <div className="w-2 h-6 bg-indigo-300 border border-white rounded-full shadow-md" />
            </div>

            {/* Right Center (E) */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-7 h-8 flex items-center justify-center cursor-ew-resize touch-none z-30"
              onPointerDown={(e) => handlePointerDown(e, 'e')}
            >
              <div className="w-2 h-6 bg-indigo-300 border border-white rounded-full shadow-md" />
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ BOTTOM CONTROLS & ACTIONS TOOLBAR */}
      <div className="w-full max-w-4xl bg-slate-900/95 border border-white/10 rounded-2xl p-2 sm:p-3 shadow-2xl backdrop-blur-md space-y-2 shrink-0 z-20">
        
        {/* Row 1: Rotation, Presets & Zoom */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/10 pb-2">
          
          {/* Rotation & Reset Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => handleRotate(-90)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center space-x-1"
              title="Sola 90° Döndür"
            >
              <RotateCcw className="w-4 h-4 text-indigo-300" />
              <span className="text-[11px] font-bold hidden sm:inline">-90°</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotate(90)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-indigo-500/40 transition-all cursor-pointer flex items-center space-x-1"
              title="Sağa 90° Döndür"
            >
              <RotateCw className="w-4 h-4 text-indigo-300" />
              <span className="text-[11px] font-bold hidden sm:inline">+90°</span>
            </button>

            <button
              type="button"
              onClick={handleResetCrop}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer flex items-center space-x-1"
              title="Sıfırla"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold hidden sm:inline">Sıfırla</span>
            </button>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="flex items-center space-x-1 overflow-x-auto py-0.5">
            <button
              type="button"
              onClick={() => handleSetAspect(null)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                aspectRatio === null
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              Serbest
            </button>

            <button
              type="button"
              onClick={() => handleSetAspect(1)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                aspectRatio === 1
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              1:1
            </button>

            <button
              type="button"
              onClick={() => handleSetAspect(3 / 4)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                aspectRatio === 3 / 4
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              3:4
            </button>

            <button
              type="button"
              onClick={() => handleSetAspect(4 / 3)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                aspectRatio === 4 / 3
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              4:3
            </button>
          </div>

          {/* Zoom Slider / Controls */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Uzaklaştır"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-mono text-slate-400 w-9 text-center font-bold">
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Yakınlaştır"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Final Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            İptal
          </button>

          <div className="flex items-center space-x-2">
            {onUseOriginal && imageFile && (
              <button
                type="button"
                onClick={() => onUseOriginal(imageFile)}
                disabled={isProcessing}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer md:hidden flex items-center space-x-1"
              >
                <span>Orijinali Kullan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCropAndSave}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-indigo-500/25 flex items-center space-x-2 transition-all cursor-pointer transform active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Kırpılıyor...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Kırp ve Kullan</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
