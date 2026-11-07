import type pg from 'pg'

// Test setup only: an account accepts the legal documents in force, as it would on /accept-terms
// (R-PRIV-02). Without it, any published version blocks every route of a test account.
export async function acceptCurrentTerms(owner: pg.Pool, accountId: string): Promise<void> {
  await owner.query(
    `SELECT identity.record_consents($1, ARRAY(SELECT d.id FROM auth_helper.pending_legal_documents($1) AS d), NULL, 'test')
      WHERE EXISTS (SELECT 1 FROM auth_helper.pending_legal_documents($1))`,
    [accountId],
  )
}
