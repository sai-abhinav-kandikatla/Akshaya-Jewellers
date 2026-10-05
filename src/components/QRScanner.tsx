'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (scannedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader-video';

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const edge = Math.floor(minEdge * 0.72);
              return { width: edge, height: edge };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (mounted) {
              scanner.stop().then(() => {
                onScan(decodedText);
              }).catch(() => {
                onScan(decodedText);
              });
            }
          },
          () => {
            // Frame parsing errors are ignored
          }
        );
        if (mounted) {
          setIsStarting(false);
        }
      } catch (err: unknown) {
        if (mounted) {
          setIsStarting(false);
          const message = err instanceof Error ? err.message : 'Camera access was blocked or is unavailable.';
          setCameraError(message);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan]);

  const handleStopAndClose = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors on unmount
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#1C1917] text-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-[#D4AF37]/40 flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#141210] flex items-center justify-between border-b border-[#D4AF37]/20">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center text-sm font-bold border border-[#D4AF37]/40">
              📷
            </span>
            <div>
              <h3 className="font-serif font-bold text-sm text-[#F5E6B3] tracking-wide leading-tight">
                Scan Voucher QR
              </h3>
              <p className="text-[11px] text-gray-400">Akshaya Jewellers</p>
            </div>
          </div>
          <button
            onClick={handleStopAndClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-gray-300 hover:text-white transition-all text-sm font-bold"
            aria-label="Close scanner"
          >
            ✕
          </button>
        </div>

        {/* Camera Viewfinder Body */}
        <div className="p-5 flex flex-col items-center justify-center bg-[#1C1917]">
          <div className="relative w-full max-w-[270px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[#D4AF37]/80 shadow-lg flex items-center justify-center">
            
            {/* Corner Decorative Reticles */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#D4AF37] z-10 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#D4AF37] z-10 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#D4AF37] z-10 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#D4AF37] z-10 pointer-events-none" />

            {/* Scanning Laser Beam Effect */}
            {!isStarting && !cameraError && (
              <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent shadow-[0_0_8px_#D4AF37] z-10 animate-pulse pointer-events-none" />
            )}

            {/* Video container */}
            <div id={containerId} className="w-full h-full flex items-center justify-center overflow-hidden" />

            {/* Loading View */}
            {isStarting && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white gap-2.5 p-4 text-center z-20">
                <div className="w-8 h-8 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-[#F5E6B3]">Starting camera viewfinder...</p>
                <p className="text-[10px] text-gray-400">Please grant camera permissions if prompted</p>
              </div>
            )}

            {/* Error View */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-5 text-center space-y-2.5 z-20">
                <span className="text-2xl text-amber-400">⚠️</span>
                <p className="text-xs font-semibold text-gray-200 leading-snug">Camera Unavailable</p>
                <p className="text-[11px] text-gray-400 leading-tight">
                  {cameraError.includes('permission') || cameraError.includes('NotAllowed')
                    ? 'Camera permission was denied. Please allow camera access in browser settings.'
                    : cameraError}
                </p>
                <button
                  onClick={handleStopAndClose}
                  className="btn btn-secondary text-xs px-3.5 py-1.5 mt-2 bg-white/10 text-white border-white/30 rounded-xl"
                >
                  Enter Code Manually
                </button>
              </div>
            )}
          </div>

          {/* Centered Instructions */}
          <div className="mt-4 text-center space-y-0.5 max-w-[280px]">
            <p className="text-xs font-semibold text-gray-200">
              Align the voucher QR code inside the box
            </p>
            <p className="text-[11px] text-gray-400 leading-tight">
              The coupon code will be verified automatically
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#141210] border-t border-[#D4AF37]/20 flex flex-col gap-2">
          <button
            onClick={handleStopAndClose}
            className="btn btn-secondary w-full py-2.5 text-xs font-bold text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-all"
          >
            Cancel & Enter Code Manually
          </button>
        </div>
      </div>
    </div>
  );
}
