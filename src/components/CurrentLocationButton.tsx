'use client';

interface CurrentLocationButtonProps {
  onClick: () => void;
}

export default function CurrentLocationButton({ onClick }: CurrentLocationButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
      style={{
        border: '1px solid #E2E2E2'
      }}
    >
      <img 
        src="/location-current.svg" 
        alt="현재 위치" 
        width={24} 
        height={24}
      />
    </button>
  );
}