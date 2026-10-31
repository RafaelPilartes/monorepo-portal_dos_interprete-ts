-- Scheduled jobs of step H2 (data-model.md §12). cron.schedule with an existing name updates the
-- job, so this file is reapplicable.
SELECT FROM cron.schedule('identity-expire-org-invites', '7 * * * *', 'SELECT identity.expire_org_invites()');
