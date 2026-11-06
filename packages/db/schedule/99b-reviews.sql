-- Scheduled job of step H9 (R-REV-02): reviews left without an answer are revealed by the clock.
SELECT FROM cron.schedule('booking-reveal-reviews', '0 * * * *', 'SELECT booking.reveal_reviews()');
