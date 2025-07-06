import { useState } from 'react';
import { Check } from 'lucide-react';
import { defaultColors } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function ColorPicker({ selectedColor, onColorSelect, className }: ColorPickerProps) {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium text-foreground">
        색상 선택
      </div>
      
      <div className="grid grid-cols-10 gap-2">
        {defaultColors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              "relative w-8 h-8 rounded-full border-2 transition-all duration-200",
              "hover:scale-110 hover:shadow-md",
              selectedColor === color 
                ? "border-gray-800 dark:border-gray-200 shadow-lg" 
                : "border-gray-200 dark:border-gray-600",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            )}
            style={{ backgroundColor: color }}
            onClick={() => onColorSelect(color)}
            onMouseEnter={() => setHoveredColor(color)}
            onMouseLeave={() => setHoveredColor(null)}
            aria-label={`색상 ${color} 선택`}
          >
            {selectedColor === color && (
              <Check 
                className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-sm" 
                strokeWidth={3}
              />
            )}
            
            {/* 호버 효과를 위한 오버레이 */}
            {hoveredColor === color && selectedColor !== color && (
              <div className="absolute inset-0 rounded-full bg-white/20" />
            )}
          </button>
        ))}
      </div>
      
      {/* 선택된 색상 미리보기 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div 
          className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: selectedColor }}
        />
        <span>선택된 색상: {selectedColor}</span>
      </div>
    </div>
  );
} 