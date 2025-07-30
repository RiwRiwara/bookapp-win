import React from 'react';
import { FiBookmark, FiBookmark as FiBookmarkFilled } from 'react-icons/fi';

interface PageViewProps {
  leftPage: string;
  rightPage?: string;
  leftPageNum: number;
  rightPageNum?: number;
  singlePage: boolean;
  fontSize: number;
  font: string;
  appliedBg: string;
  isBookmarked: boolean;
  onBookmark: () => void;
}

const PageView: React.FC<PageViewProps> = ({
  leftPage,
  rightPage,
  leftPageNum,
  rightPageNum,
  singlePage,
  fontSize,
  font,
  appliedBg,
  isBookmarked,
  onBookmark,
}) => (
  <div
    className="flex w-full h-full  gap-8"
    style={{ fontSize, fontFamily: font }}
  >
    <div
      className="w-full whitespace-pre-wrap leading-relaxed rounded-lg shadow border bg-white/80 text-gray-900 text-justify p-6 relative"
      style={{
        background: appliedBg,
        lineHeight: '1.8',
        minHeight: '70vh',
        maxHeight: '70vh',
        overflowY: 'auto',
      }}
    >
      {leftPage || ''}
      <button
        onClick={onBookmark}
        className="absolute top-3 right-4 text-blue-500"
        title="Bookmark this page"
      >
        {isBookmarked ? <FiBookmarkFilled /> : <FiBookmark />}
      </button>
      <div className="absolute bottom-2 right-4 text-xs text-gray-400">
        {leftPageNum + 1}
      </div>
    </div>
    {!singlePage && (
      <div
        className="w-full whitespace-pre-wrap leading-relaxed rounded-lg shadow border bg-white/80 text-gray-900 text-justify p-6 relative"
        style={{
          background: appliedBg,
          lineHeight: '1.8',
          minHeight: '70vh',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {rightPage || ''}
        <div className="absolute bottom-2 right-4 text-xs text-gray-400">
          {(rightPageNum ?? 0) + 1}
        </div>
      </div>
    )}
  </div>
);

export default PageView;
