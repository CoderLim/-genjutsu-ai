import assert from 'node:assert/strict';
import test from 'node:test';

import { isSameOriginLiveFaceSwapRequest } from './origin';

function request(origin?: string) {
  return new Request('https://genjutsuai.net/api/live-face-swap/token', {
    method: 'POST',
    ...(origin === undefined ? {} : { headers: { Origin: origin } }),
  });
}

test('accepts explicit matching Origin for live session POST', () => {
  assert.equal(
    isSameOriginLiveFaceSwapRequest(request('https://genjutsuai.net')),
    true
  );
});

test('rejects missing, invalid or different Origin', () => {
  for (const origin of [
    undefined,
    'null',
    'https://evil.example',
    'https://genjutsuai.net.evil.example',
    'http://genjutsuai.net',
    'https://genjutsuai.net:8443',
  ]) {
    assert.equal(
      isSameOriginLiveFaceSwapRequest(request(origin)),
      false,
      String(origin)
    );
  }
});
