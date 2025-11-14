'use client';

interface SearchButtonProps {
  isVisible: boolean;
  onClick: () => void;
}

export default function SearchButton({ isVisible, onClick }: SearchButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{
        height: '34px',
        borderRadius: '17px',
        backgroundColor: '#FF5C43',
        paddingTop: '8px',
        paddingRight: '12px',
        paddingBottom: '8px',
        paddingLeft: '12px',
        fontFamily: 'Pretendard',
        fontWeight: 700,
        fontSize: '12px',
        lineHeight: '18px',
        letterSpacing: '-0.01em',
        color: '#FFFFFF'
      }}
    >
      현재 지도에서 가게 재검색
    </button>
  );
}