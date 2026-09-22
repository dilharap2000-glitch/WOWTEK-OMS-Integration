import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 1.7,
  height = 42,
  displayValue = false,
  fontSize = 12,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // Clean string to avoid Code128 invalid character issues
      const cleanValue = String(value).trim();
      JsBarcode(svgRef.current, cleanValue, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        textMargin: 2,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000',
        valid: () => {},
      });
    } catch (err) {
      console.error('Failed to render barcode:', err);
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <svg ref={svgRef} className="max-w-full block" />
    </div>
  );
};
