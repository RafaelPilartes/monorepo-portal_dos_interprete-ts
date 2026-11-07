-- Scheduled job of step H10 (R-PAY-06): expiring warnings and expired intents.
SELECT FROM cron.schedule('billing-expire-intents', '*/5 * * * *', 'SELECT billing.expire_intents()');
