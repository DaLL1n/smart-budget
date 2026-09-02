import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { logErrorIncident, getStoredErrorIncidents } from '../src/shared/lib/errorLogger';

describe('ErrorBoundary & Incident Logger Tests', () => {
  it('должен корректно фиксировать ошибку и сохранять в журнал инцидентов', () => {
    const testError = new Error('Имитация критического сбоя в React-компоненте');
    testError.stack = 'Error: Имитация\n    at BuggyComponent.tsx:12:11';

    logErrorIncident(testError, {
      componentStack: '\n    in BuggyComponent\n    in DashboardPage',
    });

    const incidents = getStoredErrorIncidents();
    assert.ok(Array.isArray(incidents));
    assert.ok(incidents.length > 0);

    const latest = incidents[0];
    assert.equal(latest.message, 'Имитация критического сбоя в React-компоненте');
    assert.ok(latest.stack?.includes('BuggyComponent'));
    assert.ok(latest.componentStack?.includes('DashboardPage'));
    assert.ok(latest.id.startsWith('err_'));
    assert.ok(latest.timestamp);
  });

  it('должен ограничивать журнал последними 10 записями', () => {
    for (let i = 0; i < 15; i++) {
      logErrorIncident(new Error(`Test error #${i}`));
    }

    const incidents = getStoredErrorIncidents();
    assert.ok(incidents.length <= 10, 'Журнал не должен превышать 10 инцидентов');
    assert.equal(incidents[0].message, 'Test error #14');
  });
});
