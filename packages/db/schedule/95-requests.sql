-- Scheduled jobs of step H5 (R-DRC-02, R-REQ-10). Every minute: deadlines are minutes apart.
SELECT FROM cron.schedule('booking-expire-invites', '* * * * *', 'SELECT booking.expire_invites()');
SELECT FROM cron.schedule('booking-warn-understaffed', '*/5 * * * *', 'SELECT booking.warn_understaffed()');
SELECT FROM cron.schedule('booking-expire-unstaffed', '* * * * *', 'SELECT booking.expire_unstaffed_requests()');
