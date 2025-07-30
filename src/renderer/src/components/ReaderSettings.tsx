import React from 'react';

interface FontOption {
  label: string;
  value: string;
}

interface BgOption {
  label: string;
  value: string;
}

interface ReaderSettingsProps {
  fontSize: number;
  setFontSize: (v: number) => void;
  font: string;
  setFont: (v: string) => void;
  fontOptions: FontOption[];
  bgColor: string;
  setBgColor: (v: string) => void;
  customBg: string;
  setCustomBg: (v: string) => void;
  bgOptions: BgOption[];
  singlePage: boolean;
  setSinglePage: (v: boolean) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
}

const ReaderSettings: React.FC<ReaderSettingsProps> = ({
  fontSize,
  setFontSize,
  font,
  setFont,
  fontOptions,
  bgColor,
  setBgColor,
  customBg,
  setCustomBg,
  bgOptions,
  singlePage,
  setSinglePage,
  zoom,
  setZoom,
}) => {
  return (
    <div className="bg-white shadow-md border-b border-gray-200 p-4 flex flex-wrap gap-6 justify-center items-center">
      {/* Font size */}
      <div
        className="flex items-center gap-2 disabled"
        style={{ opacity: 0.2 }}
      >
        <span className="text-sm">A-</span>
        <input
          type="range"
          min={12}
          max={32}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="w-24"
        />
        <span className="text-sm">A+</span>
        <span className="text-xs text-gray-500 ml-1">{fontSize}px</span>
      </div>
      {/* Font selection */}
      <div
        className="flex items-center gap-2 disabled"
        style={{ opacity: 0.2 }}
      >
        {fontOptions.map((opt) => (
          <button
            key={opt.value}
            className={`px-2 py-1 rounded text-sm ${font === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => setFont(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Background color */}
      <div className="flex items-center gap-2">
        {bgOptions.map((opt) => (
          <button
            key={opt.value}
            className={`w-6 h-6 rounded-full border-2 ${bgColor === opt.value && !customBg ? 'border-blue-600' : 'border-gray-300'}`}
            style={{ background: opt.value }}
            onClick={() => {
              setBgColor(opt.value);
              setCustomBg('');
            }}
          />
        ))}
        <input
          type="color"
          value={customBg || bgColor}
          onChange={(e) => {
            setCustomBg(e.target.value);
            setBgColor('');
          }}
          className="w-6 h-6 rounded-full border-2 border-gray-300"
          title="Custom color"
        />
      </div>
      {/* Page mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm">Page Mode:</span>
        <button
          className={`px-3 py-1 rounded text-sm ${singlePage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setSinglePage(true)}
        >
          Single
        </button>
        <button
          className={`px-3 py-1 rounded text-sm ${!singlePage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
          onClick={() => setSinglePage(false)}
        >
          Double
        </button>
      </div>
      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm">Zoom:</span>
        <button
          onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
          className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          -
        </button>
        <span className="text-sm">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.2, 3))}
          className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default ReaderSettings;
