'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import BottomSheet from '@/components/BottomSheet';

interface QRScannerProps {
  onScan: (scannedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [cameraError, setCameraError] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const containerId = 'qr-reader-video';
  onScanRef.current = onScan;

  useEffect(() => {
    let mounted = true;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.72);
          return { width: edge, height: edge };
        },
        aspectRatio: 1,
      },
      (decodedText) => {
        if (!mounted) return;
        void scanner.stop().catch(() => {}).finally(() => onScanRef.current(decodedText));
      },
      () => undefined,
    ).then(() => {
      if (mounted) setIsStarting(false);
    }).catch((startError: unknown) => {
      if (!mounted) return;
      setIsStarting(false);
      setCameraError(startError instanceof Error ? startError.message : 'Camera access is unavailable.');
    });

    return () => {
      mounted = false;
      if (scanner.isScanning) void scanner.stop().catch(() => {});
    };
  }, []);

  const closeScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); } catch { /* Scanner may already be stopping. */ }
    }
    onClose();
  };

  return (
    <BottomSheet
      isOpen
      onClose={closeScanner}
      title="Scan QR Code"
      description={cameraError ? 'Camera is unavailable. Enter the coupon code instead.' : 'Align the coupon QR code within the frame.'}
      primaryButtonText={cameraError ? 'Enter Code Manually' : 'Close Scanner'}
      primaryButtonAction={closeScanner}
      secondaryButtonText={cameraError ? undefined : 'Cancel'}
      secondaryButtonAction={closeScanner}
    >
      <div className="qr-scanner-shell">
        <div id={containerId} className="qr-scanner-viewfinder" />
        {isStarting && <p className="qr-scanner-state">Starting camera…</p>}
        {cameraError && <p className="qr-scanner-state">{cameraError}</p>}
      </div>
    </BottomSheet>
  );
}
