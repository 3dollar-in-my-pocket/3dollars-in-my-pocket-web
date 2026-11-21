import { NextRequest, NextResponse } from 'next/server';
import { readRequestAuth } from '@/src/server/authorizedApi';
import { submitDelivery } from '@/src/server/pointEvent';
import { toRouteResponse, unauthorizedResponse } from '@/src/server/routeResponse';
import { validateDeliveryForm } from '@/src/utils/pointEvent';

export async function POST(request: NextRequest) {
  const { token, userAgent } = readRequestAuth(request);
  if (!token) return unauthorizedResponse();

  const form = validateDeliveryForm(await request.json().catch(() => null));
  if (!form) {
    return NextResponse.json(
      { status: 'error', message: '받으실 정보를 모두 입력하고 동의해 주세요.' },
      { status: 400 }
    );
  }

  return toRouteResponse(
    await submitDelivery(
      { token, userAgent },
      {
        name: form.name,
        phone: form.phone,
        zonecode: form.zonecode,
        address: form.address,
        addressDetail: form.addressDetail,
      }
    )
  );
}
