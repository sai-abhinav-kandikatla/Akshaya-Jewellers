'use client';

import React, { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  icon?: React.ReactNode;
  title: string;
  description: string;
  details?: {
    code?: string;
    customerName?: string;
    value?: string | number;
    date?: string;
  };
  primaryButtonText: string;
  primaryButtonAction: () => void;
  secondaryButtonText?: string;
  secondaryButtonAction?: () => void;
  isLoading?: boolean;
}

export default function BottomSheet({
  isOpen,
  onClose,
  icon,
  title,
  description,
  details,
  primaryButtonText,
  primaryButtonAction,
  secondaryButtonText = 'Cancel',
  secondaryButtonAction,
  isLoading = false,
}: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={isLoading ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Slide-up sheet */}
      <div
        className="relative w-full max-w-[430px] bg-white rounded-t-[24px] px-5 pt-3 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 border-t border-[#E7E0CF]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top drag handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Circular icon container */}
        {icon && (
          <div className="w-14 h-14 rounded-full bg-[#F6E8B1] flex items-center justify-center mx-auto mb-3 text-[#A67C00]">
            {icon}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-[#111111] text-center">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs text-[#666666] text-center mt-1.5 max-w-xs mx-auto leading-relaxed">
          {description}
        </p>

        {/* Inner Coupon Details Card (Matches Mockup) */}
        {details && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E0CF] flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="font-mono font-bold text-sm text-[#111111] truncate">
                {details.code}
              </p>
              {details.customerName && (
                <p className="text-xs text-[#666666] truncate mt-0.5">
                  {details.customerName}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-base text-[#111111]">
                {details.value}
              </p>
              {details.date && (
                <p className="text-[11px] text-[#666666] mt-0.5">
                  {details.date}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={secondaryButtonAction || onClose}
            disabled={isLoading}
            className="h-12 rounded-xl bg-white border border-[#E7E0CF] text-[#111111] font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {secondaryButtonText}
          </button>

          <button
            type="button"
            onClick={primaryButtonAction}
            disabled={isLoading}
            className="h-12 rounded-xl bg-gradient-to-r from-[#C9A227] to-[#A67C00] text-white font-bold text-sm shadow-sm hover:brightness-105 active:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              primaryButtonText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
