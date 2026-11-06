-- Scheduled job of step H8 (R-LIFE-04): deliveries left unanswered are confirmed.
SELECT FROM cron.schedule('booking-auto-confirm-deliveries', '*/5 * * * *', 'SELECT booking.auto_confirm_deliveries()');
