import assert from 'node:assert/strict';
import test from 'node:test';

import { genjutsuResultDownloadFilename } from './$generationId';

test('genjutsuResultDownloadFilename uses product slug when safe', () => {
  assert.equal(
    genjutsuResultDownloadFilename(
      '744f753f-eac7-48d4-affd-72d117c6e5f8',
      'chipmunks-dance'
    ),
    'chipmunks-dance-744f753f.mp4'
  );
});

test('genjutsuResultDownloadFilename falls back for missing or unsafe product', () => {
  assert.equal(
    genjutsuResultDownloadFilename('abcd1234-xxxx', null),
    'genjutsu-abcd1234.mp4'
  );
  assert.equal(
    genjutsuResultDownloadFilename('abcd1234-xxxx', '../evil'),
    'genjutsu-abcd1234.mp4'
  );
});
