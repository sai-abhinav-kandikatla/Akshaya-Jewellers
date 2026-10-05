'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface CouponQRCodeProps {
  value: string;
  size?: number;
  label?: string;
}

export default function CouponQRCode({ value, size = 180, label }: CouponQRCodeProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-[#D4AF37]/40 shadow-sm space-y-2">
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
      {label && (
        <p className="text-[11px] font-semibold text-gray-500 text-center tracking-wide uppercase">
          {label}
        </p>
      )}
    </div>
  );
}
