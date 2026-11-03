import assert from 'node:assert/strict';
import test from 'node:test';

import { createTemplateApplication } from './template-application';

test('cancelled pending work settles failure and cannot later succeed', async () => {
  const results: boolean[] = [];
  const run = createTemplateApplication(
    (ok) => results.push(ok),
    () => false
  );
  run.cancel();
  run.finish(true);
  await Promise.resolve();
  assert.equal(run.signal.aborted, true);
  assert.deepEqual(results, [false]);
});

test('Strict Mode replay leaves settlement to the replacement run', async () => {
  const results: boolean[] = [];
  let replayed = false;
  const first = createTemplateApplication(
    (ok) => results.push(ok),
    () => replayed
  );
  first.cancel();
  replayed = true;
  const second = createTemplateApplication(
    (ok) => results.push(ok),
    () => false
  );
  await Promise.resolve();
  assert.deepEqual(results, []);
  first.finish(true);
  second.finish(true);
  second.cancel();
  await Promise.resolve();
  assert.deepEqual(results, [true]);
});

test('completed work settles once even when cleaned up', async () => {
  const results: boolean[] = [];
  const run = createTemplateApplication(
    (ok) => results.push(ok),
    () => false
  );
  run.finish(true);
  run.cancel();
  await Promise.resolve();
  assert.deepEqual(results, [true]);
});
