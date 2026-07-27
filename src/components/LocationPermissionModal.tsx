'use client';

interface LocationPermissionModalProps {
  isOpen: boolean;
  isRequesting: boolean;
  onAllow: () => void;
}

export default function LocationPermissionModal({
  isOpen,
  isRequesting,
  onAllow,
}: LocationPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-permission-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-7 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <img src="/location-current.svg" alt="" width={28} height={28} />
        </div>
        <h2
          id="location-permission-title"
          className="text-lg font-bold text-gray-900"
        >
          현재 위치를 알려주세요
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          내 주변의 가게를 찾으려면 위치 권한이 필요해요.
          <br />
          아래 버튼을 누른 뒤 브라우저에서 허용해 주세요.
        </p>
        <button
          type="button"
          onClick={onAllow}
          disabled={isRequesting}
          className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRequesting ? '위치를 확인하는 중...' : '위치 권한 허용'}
        </button>
      </div>
    </div>
  );
}
