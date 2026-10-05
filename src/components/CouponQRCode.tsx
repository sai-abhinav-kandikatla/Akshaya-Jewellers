'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CouponQRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export default function CouponQRCode({ value, size = 180, label }: CouponQRCodeProps) {
  const displayId = label || (value.startsWith('http') ? value.split('/').filter(Boolean).pop() : value);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-[#E7E0CF] space-y-2">
      <div className="p-2 bg-white rounded-xl">
        <QRCodeSVG
          value={value}
          size={size}
          level="H"
          includeMargin={false}
          imageSettings={{
            src: '/logo.png',
            x: undefined,
            y: undefined,
            height: 28,
            width: 28,
            excavate: true,
          }}
        />
      </div>
      {displayId && (
        <p className="text-sm font-bold text-[#111111] font-mono tracking-wider text-center pt-0.5">
          {displayId}
        </p>
      )}
    </div>
  );
}
