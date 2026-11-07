-- ==========================================
-- 11. AUTO-UPDATE UPDATED_AT TRIGGER
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_profiles_updated_at BEFORE UPDATE ON interpreter_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_requester_profiles_updated_at BEFORE UPDATE ON requester_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON languages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_specialties_updated_at BEFORE UPDATE ON specialties FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_services_updated_at BEFORE UPDATE ON interpreter_services FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_education_updated_at BEFORE UPDATE ON interpreter_education FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_experiences_updated_at BEFORE UPDATE ON interpreter_experiences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_certifications_updated_at BEFORE UPDATE ON interpreter_certifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_portfolios_updated_at BEFORE UPDATE ON interpreter_portfolios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_interpreter_availabilities_updated_at BEFORE UPDATE ON interpreter_availabilities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_verification_requests_updated_at BEFORE UPDATE ON verification_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_booking_logs_updated_at BEFORE UPDATE ON booking_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_forum_topics_updated_at BEFORE UPDATE ON forum_topics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_legal_resources_updated_at BEFORE UPDATE ON legal_resources FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_success_cases_updated_at BEFORE UPDATE ON success_cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON partnerships FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
