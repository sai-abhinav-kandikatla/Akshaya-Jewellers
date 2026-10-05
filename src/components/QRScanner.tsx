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
            fps: 10,
            qrbox: { width: 250, height: 250 },
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
      } catch (err: any) {
        if (mounted) {
          setIsStarting(false);
          setCameraError(err?.message || 'Unable to access camera. Please allow camera permissions or enter the code manually.');
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
      } catch {}
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 bg-[#1a1a1a] text-white flex justify-between items-center border-b border-[#d4af37]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="font-bold text-sm tracking-wide text-[#d4af37]">SCAN COUPON QR</h3>
          </div>
          <button
            onClick={handleStopAndClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm"
          >
            ✕
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px]">
          <div id={containerId} className="w-full h-full min-h-[300px]" />

          {isStarting && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-2 p-4 text-center">
              <div className="w-8 h-8 border-3 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-300">Starting camera...</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white p-6 text-center space-y-3">
              <span className="text-3xl text-red-400">⚠️</span>
              <p className="text-xs text-red-300">{cameraError}</p>
              <button
                onClick={handleStopAndClose}
                className="btn btn-secondary text-xs px-4 py-2 mt-2 bg-white/20 text-white border-white/40"
              >
                Close & Enter Code Manually
              </button>
            </div>
          )}
        </div>

        {/* Footer Guidance */}
        <div className="p-4 bg-[#fdfbf7] text-center space-y-2 border-t border-gray-100">
          <p className="text-xs text-gray-600 font-medium">
            Point camera at the customer&apos;s phone or voucher QR code
          </p>
          <button
            onClick={handleStopAndClose}
            className="btn btn-secondary w-full py-2.5 text-xs font-bold text-gray-700 border border-gray-300 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
