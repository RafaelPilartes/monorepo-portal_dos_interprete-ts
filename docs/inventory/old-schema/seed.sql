-- PORTAL DOS INTERPARTES - DATABASE SEED DATA
-- Generates initial data for testing and development
-- Created by Antigravity (Database Architect)

-- ==========================================
-- 0. AUTHENTICATION & CORE USERS
-- ==========================================

INSERT INTO auth.users (id, instance_id, email, aud, role, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES
('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'admin@gracemind.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Admin GraceMind"}', now(), now()),
('a2222222-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'suporte@gracemind.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Suporte GR"}', now(), now()),
('b1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'joao.interprete@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "João Intérprete"}', now(), now()),
('b2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'maria.linguas@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Maria Línguas"}', now(), now()),
('b3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'carlos.sinais@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Carlos Sinais"}', now(), now()),
('b4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'ana.tradutora@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Ana Tradutora"}', now(), now()),
('b5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'pedro.fala@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Pedro Fala"}', now(), now()),
('b6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'sofia.voz@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Sofia Voz"}', now(), now()),
('c1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'empresa.x@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Empresa X"}', now(), now()),
('c2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'cliente.y@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Cliente Y"}', now(), now()),
('c3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'ong.paz@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "ONG Paz"}', now(), now()),
('c4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'hospital.vida@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Hospital Vida"}', now(), now()),
('c5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'escola.saber@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Escola Saber"}', now(), now()),
('c6666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'startup.tech@example.com', 'authenticated', 'authenticated', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name": "Startup Tech"}', now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, name, avatar_url, phone, gender, role)
VALUES
('a1111111-1111-1111-1111-111111111111', 'admin@gracemind.com', 'Admin GraceMind', null, '+244900111222', 'Não Especificado', 'admin'),
('a2222222-1111-1111-1111-111111111111', 'suporte@gracemind.com', 'Suporte GR', null, '+244900333444', 'Feminino', 'admin'),
('b1111111-1111-1111-1111-111111111111', 'joao.interprete@example.com', 'João Intérprete', null, '+244900000001', 'Masculino', 'interpreter'),
('b2222222-2222-2222-2222-222222222222', 'maria.linguas@example.com', 'Maria Línguas', null, '+244900000002', 'Feminino', 'interpreter'),
('b3333333-3333-3333-3333-333333333333', 'carlos.sinais@example.com', 'Carlos Sinais', null, '+244900000003', 'Masculino', 'interpreter'),
('b4444444-4444-4444-4444-444444444444', 'ana.tradutora@example.com', 'Ana Tradutora', null, '+244900000004', 'Feminino', 'interpreter'),
('b5555555-5555-5555-5555-555555555555', 'pedro.fala@example.com', 'Pedro Fala', null, '+244900000005', 'Masculino', 'interpreter'),
('b6666666-6666-6666-6666-666666666666', 'sofia.voz@example.com', 'Sofia Voz', null, '+244900000006', 'Feminino', 'interpreter'),
('c1111111-1111-1111-1111-111111111111', 'empresa.x@example.com', 'Empresa X', null, '+244922000000', 'Outro', 'requester'),
('c2222222-2222-2222-2222-222222222222', 'cliente.y@example.com', 'Cliente Y', null, '+244933000000', 'Masculino', 'requester'),
('c3333333-3333-3333-3333-333333333333', 'ong.paz@example.com', 'ONG Paz', null, '+244944000000', 'Feminino', 'requester'),
('c4444444-4444-4444-4444-444444444444', 'hospital.vida@example.com', 'Hospital Vida', null, '+244955000000', 'Outro', 'requester'),
('c5555555-5555-5555-5555-555555555555', 'escola.saber@example.com', 'Escola Saber', null, '+244966000000', 'Masculino', 'requester'),
('c6666666-6666-6666-6666-666666666666', 'startup.tech@example.com', 'Startup Tech', null, '+244977000000', 'Feminino', 'requester')
ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, gender = EXCLUDED.gender, role = EXCLUDED.role;


-- ==========================================
-- 1. PROFILES
-- ==========================================
INSERT INTO public.admin_profiles (id, user_id, permission_level, department) VALUES
('a1111111-2222-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'super_admin', 'Management'),
('a2222222-2222-1111-1111-111111111111', 'a2222222-1111-1111-1111-111111111111', 'support_staff', 'Support')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.interpreter_profiles (id, user_id, bio, years_experience, minimum_hourly_rate, open_to_negotiation, modality, rating, review_count, verified) VALUES
('b1111111-2222-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Intérprete corporativo sênior.', 10, 15000.00, true, 'ambos', 4.8, 12, true),
('b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Especialista em LGA.', 8, 20000.00, false, 'presential', 5.0, 34, true),
('b3333333-2222-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Intérprete de conferências.', 15, 25000.00, true, 'remote', 4.9, 56, true),
('b4444444-2222-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Tradutora técnica e literária.', 6, 12000.00, true, 'ambos', 4.7, 8, true),
('b5555555-2222-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Intérprete médico bilíngue.', 12, 18000.00, false, 'presential', 4.6, 21, true),
('b6666666-2222-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Experiente em tribunais e fóruns.', 9, 22000.00, true, 'ambos', 4.9, 43, true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.requester_profiles (id, user_id, company_name, nif, address, phone_number, industry) VALUES
('c1111111-2222-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Empresa X Lda', '5000000000', 'Luanda, Angola', '+244922000000', 'Tecnologia'),
('c2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', null, null, 'Benguela, Angola', '+244933000000', 'Educação'),
('c3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'ONG Angola em Paz', '5100000001', 'Huambo, Angola', '+244944000000', 'Social'),
('c4444444-2222-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Hospital Central Vida', '5200000002', 'Luanda, Angola', '+244955000000', 'Saúde'),
('c5555555-2222-5555-5555-555555555555', 'c5555555-5555-5555-5555-555555555555', 'Instituto Superior Saber', '5300000003', 'Lubango, Angola', '+244966000000', 'Educação'),
('c6666666-2222-6666-6666-666666666666', 'c6666666-6666-6666-6666-666666666666', 'Angola Tech Hub', '5400000004', 'Luanda, Angola', '+244977000000', 'Tecnologia')
ON CONFLICT (user_id) DO NOTHING;


-- ==========================================
-- 2. DICTIONARIES & JUNCTIONS
-- ==========================================
INSERT INTO public.languages (id, name, code, is_sign_language) VALUES
('e1111111-1111-1111-1111-111111111111', 'Português', 'PT', false),
('e2222222-2222-2222-2222-222222222222', 'Inglês', 'EN', false),
('e3333333-3333-3333-3333-333333333333', 'Língua Gestual Angolana', 'LGA', true),
('e4444444-4444-4444-4444-444444444444', 'Francês', 'FR', false),
('e5555555-5555-5555-5555-555555555555', 'Espanhol', 'ES', false),
('e6666666-6666-6666-6666-666666666666', 'Umbumdu', 'UB', false)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.specialties (id, name, slug, description) VALUES
('f1111111-1111-1111-1111-111111111111', 'Medicina e Saúde', 'medicina', 'Terminologia médica avançada.'),
('f2222222-2222-2222-2222-222222222222', 'Jurídico', 'juridico', 'Tribunais e terminologia legal.'),
('f3333333-3333-3333-3333-333333333333', 'Educação', 'educacao', 'Ambiente acadêmico e escolar.'),
('f4444444-4444-4444-4444-444444444444', 'Religião', 'religiao', 'Eventos e cultos religiosos.'),
('f5555555-5555-5555-5555-555555555555', 'Negócios', 'negocios', 'Conferências e reuniões corporativas.'),
('f6666666-6666-6666-6666-666666666666', 'Tecnologia', 'tecnologia', 'Eventos de TI e inovação.')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.interpreter_languages (interpreter_profile_id, language_id) VALUES
('b1111111-2222-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111'),
('b1111111-2222-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222'),
('b2222222-2222-2222-2222-222222222222', 'e3333333-3333-3333-3333-333333333333'),
('b3333333-2222-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222'),
('b4444444-2222-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444'),
('b5555555-2222-5555-5555-555555555555', 'e1111111-1111-1111-1111-111111111111'),
('b6666666-2222-6666-6666-666666666666', 'e5555555-5555-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

INSERT INTO public.interpreter_specialties (interpreter_profile_id, specialty_id) VALUES
('b1111111-2222-1111-1111-111111111111', 'f5555555-5555-5555-5555-555555555555'),
('b2222222-2222-2222-2222-222222222222', 'f3333333-3333-3333-3333-333333333333'),
('b3333333-2222-3333-3333-333333333333', 'f6666666-6666-6666-6666-666666666666'),
('b4444444-2222-4444-4444-444444444444', 'f3333333-3333-3333-3333-333333333333'),
('b5555555-2222-5555-5555-555555555555', 'f1111111-1111-1111-1111-111111111111'),
('b6666666-2222-6666-6666-666666666666', 'f2222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;


-- ==========================================
-- 3. SERVICES 
-- ==========================================
INSERT INTO public.services (id, title, description, base_price, icon, is_active) VALUES
('20000000-0000-0000-0000-000000000001', 'Tradução Consecutiva', 'Small meetings.', 20000.00, 'translate', true),
('20000000-0000-0000-0000-000000000002', 'Língua Gestual', 'Acessibilidade total.', 25000.00, 'sign_language', true),
('20000000-0000-0000-0000-000000000003', 'Simultânea', 'Grandes conferências.', 35000.00, 'record', true),
('20000000-0000-0000-0000-000000000004', 'Sussurrada', 'Reuniões VIP.', 40000.00, 'visibility_off', true),
('20000000-0000-0000-0000-000000000005', 'Acompanhamento', 'Viagens e roteiros.', 15000.00, 'directions_walk', true),
('20000000-0000-0000-0000-000000000006', 'Tradução Escrita', 'Documentos formais.', 10000.00, 'article', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.interpreter_services (interpreter_profile_id, name, description, base_price, is_active) VALUES
('b1111111-2222-1111-1111-111111111111', 'Conferência Bilíngue', 'ES/PT em tempo real.', 30000.00, true),
('b2222222-2222-2222-2222-222222222222', 'Aulas Inclusivas', 'LGA para universidades.', 15000.00, true),
('b3333333-2222-3333-3333-333333333333', 'Simpósio de Tech', 'Inglês nativo.', 45000.00, true),
('b4444444-2222-4444-4444-444444444444', 'Reunião de Diretoria', 'Discrição absoluta.', 50000.00, true),
('b5555555-2222-5555-5555-555555555555', 'Cirurgia Assistida', 'Médico certificado.', 25000.00, true),
('b6666666-2222-6666-6666-666666666666', 'Audiência de Custódia', 'Jurídico experiente.', 35000.00, true);


-- ==========================================
-- 4. INTERPRETER SATELLITE TABLES
-- ==========================================
INSERT INTO public.interpreter_education (interpreter_profile_id, institution, degree, start_date, end_date, graduation_year, description) VALUES
('b1111111-2222-1111-1111-111111111111', 'UAN', 'Letras', '2010-01-01', '2014-12-01', '2014', 'Linguística.'),
('b2222222-2222-2222-2222-222222222222', 'Escola LGA', 'Certificado Sinais', '2015-01-01', '2017-01-01', '2017', 'Técnicas.'),
('b3333333-2222-3333-3333-333333333333', 'Oxford', 'Masters in Translation', '2008-01-01', '2010-01-01', '2010', 'Intercultural studies.'),
('b4444444-2222-4444-4444-444444444444', 'Alliance Française', 'Diplôme Supérieur', '2016-01-01', '2019-01-01', '2019', 'Advanced French.'),
('b5555555-2222-5555-5555-555555555555', 'Faculdade de Medicina (FUM)', 'Auxiliar de Enfermagem', '2012-01-01', '2015-01-01', '2015', 'Medical background.'),
('b6666666-2222-6666-6666-666666666666', 'ISPOL', 'Direito', '2011-01-01', '2016-01-01', '2016', 'Legal terminology.')
ON CONFLICT DO NOTHING;

INSERT INTO public.interpreter_experiences (interpreter_profile_id, role, company, period, description) VALUES
('b1111111-2222-1111-1111-111111111111', 'Lead Interpreter', 'Total Energy', '2015-2020', 'Corporate events.'),
('b2222222-2222-2222-2222-222222222222', 'LGA Specialist', 'TPA News', '2018-2023', 'Live broadcasting.'),
('b3333333-2222-3333-3333-333333333333', 'Senior Translator', 'UN-HABITAT', '2010-Present', 'International reports.'),
('b4444444-2222-4444-4444-444444444444', 'Freelancer', 'Upwork VIP', '2019-Present', 'Technical manuals.'),
('b5555555-2222-5555-5555-555555555555', 'Interpreter', 'Clinica Girassol', '2016-2021', 'Medical consultations.'),
('b6666666-2222-6666-6666-666666666666', 'Court Liaison', 'Tribunal de Luanda', '2017-2022', 'Criminal hearings.')
ON CONFLICT DO NOTHING;

INSERT INTO public.interpreter_certifications (interpreter_profile_id, name, issuer, issue_date) VALUES
('b1111111-2222-1111-1111-111111111111', 'Cambridge C2', 'Cambridge', '2014-06-01'),
('b2222222-2222-2222-2222-222222222222', 'Angola Signs Pro', 'AAS', '2017-05-10'),
('b3333333-2222-3333-3333-333333333333', 'ATA Certification', 'USA Translators', '2012-08-20'),
('b4444444-2222-4444-4444-444444444444', 'DELF C1', 'CIEP France', '2019-11-15'),
('b5555555-2222-5555-5555-555555555555', 'Health Interpreter', 'ISDH', '2016-04-12'),
('b6666666-2222-6666-6666-666666666666', 'Legal Expert', 'Min. Justiça', '2017-09-05')
ON CONFLICT DO NOTHING;

INSERT INTO public.interpreter_availabilities (interpreter_profile_id, day_of_week, start_time, end_time, is_unavailable) VALUES
('b1111111-2222-1111-1111-111111111111', 1, '08:00:00', '18:00:00', false),
('b2222222-2222-2222-2222-222222222222', 2, '08:00:00', '18:00:00', false),
('b3333333-2222-3333-3333-333333333333', 3, '08:00:00', '18:00:00', false),
('b4444444-2222-4444-4444-444444444444', 4, '08:00:00', '18:00:00', false),
('b5555555-2222-5555-5555-555555555555', 5, '08:00:00', '18:00:00', false),
('b6666666-2222-6666-6666-666666666666', 6, '09:00:00', '14:00:00', false)
ON CONFLICT DO NOTHING;


-- ==========================================
-- 5. BOOKINGS & FEEDBACK
-- ==========================================
INSERT INTO public.bookings (id, requester_profile_id, interpreter_profile_id, service_id, status, scheduled_date, duration_minutes, total_amount, currency, location_type, address) VALUES
('10000000-0000-0000-0000-000000000001', 'c1111111-2222-1111-1111-111111111111', 'b1111111-2222-1111-1111-111111111111', '20000000-0000-0000-0000-000000000001', 'completed', now() - interval '10 days', 120, 24000.00, 'AOA', 'presencial', 'Luanda, Edificio Z'),
('10000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', '20000000-0000-0000-0000-000000000002', 'completed', now() - interval '5 days', 60, 15000.00, 'AOA', 'online', null),
('10000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 'b3333333-2222-3333-3333-333333333333', '20000000-0000-0000-0000-000000000003', 'completed', now() - interval '2 days', 180, 50000.00, 'AOA', 'presencial', 'Huambo, Auditório'),
('10000000-0000-0000-0000-000000000004', 'c4444444-2222-4444-4444-444444444444', 'b4444444-2222-4444-4444-444444444444', '20000000-0000-0000-0000-000000000004', 'accepted', now() + interval '2 days', 90, 30000.00, 'AOA', 'online', null),
('10000000-0000-0000-0000-000000000005', 'c5555555-2222-5555-5555-555555555555', 'b5555555-2222-5555-5555-555555555555', '20000000-0000-0000-0000-000000000005', 'pending', now() + interval '5 days', 120, 20000.00, 'AOA', 'presencial', 'Lubango, Escola'),
('10000000-0000-0000-0000-000000000006', 'c6666666-2222-6666-6666-666666666666', 'b6666666-2222-6666-6666-666666666666', '20000000-0000-0000-0000-000000000006', 'pending', now() + interval '10 days', 60, 10000.00, 'AOA', 'online', null)
ON CONFLICT DO NOTHING;

INSERT INTO public.reviews (booking_id, author_requester_id, target_interpreter_id, rating, comment) VALUES
('10000000-0000-0000-0000-000000000001', 'c1111111-2222-1111-1111-111111111111', 'b1111111-2222-1111-1111-111111111111', 5, 'Excelente serviço.'),
('10000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 5, 'Muito profissional.'),
('10000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 'b3333333-2222-3333-3333-333333333333', 4, 'Boa tradução.'),
('10000000-0000-0000-0000-000000000004', 'c4444444-2222-4444-4444-444444444444', 'b4444444-2222-4444-4444-444444444444', 5, 'Recomendo.'),
('10000000-0000-0000-0000-000000000005', 'c5555555-2222-5555-5555-555555555555', 'b5555555-2222-5555-5555-555555555555', 4, 'Atencioso.'),
('10000000-0000-0000-0000-000000000006', 'c6666666-2222-6666-6666-666666666666', 'b6666666-2222-6666-6666-666666666666', 5, 'Pontual e preciso.')
ON CONFLICT DO NOTHING;


-- ==========================================
-- 6. FINANCE & CONTENT
-- ==========================================
INSERT INTO public.payments (booking_id, requester_profile_id, amount, currency, status, method) VALUES
('10000000-0000-0000-0000-000000000001', 'c1111111-2222-1111-1111-111111111111', 24000.00, 'AOA', 'completed', 'multicaixa'),
('10000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', 15000.00, 'AOA', 'completed', 'bank_transfer'),
('10000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 50000.00, 'AOA', 'completed', 'credit_card'),
('10000000-0000-0000-0000-000000000004', 'c4444444-2222-4444-4444-444444444444', 30000.00, 'AOA', 'pending', 'multicaixa'),
('10000000-0000-0000-0000-000000000005', 'c5555555-2222-5555-5555-555555555555', 20000.00, 'AOA', 'pending', 'bank_transfer'),
('10000000-0000-0000-0000-000000000006', 'c6666666-2222-6666-6666-666666666666', 10000.00, 'AOA', 'pending', 'multicaixa')
ON CONFLICT DO NOTHING;

INSERT INTO public.payouts (interpreter_profile_id, amount, currency, status, iban, bank_name) VALUES
('b1111111-2222-1111-1111-111111111111', 20000.00, 'AOA', 'completed', 'AO01', 'BAI'),
('b2222222-2222-2222-2222-222222222222', 12000.00, 'AOA', 'completed', 'AO02', 'BFA'),
('b3333333-2222-3333-3333-333333333333', 45000.00, 'AOA', 'pending', 'AO03', 'BIC'),
('b4444444-2222-4444-4444-444444444444', 10000.00, 'AOA', 'processing', 'AO04', 'SOL'),
('b5555555-2222-5555-5555-555555555555', 18000.00, 'AOA', 'completed', 'AO05', 'ATL'),
('b6666666-2222-6666-6666-666666666666', 30000.00, 'AOA', 'pending', 'AO06', 'BEA')
ON CONFLICT DO NOTHING;

INSERT INTO public.articles (title, slug, summary, content, status, author_id, author_name) VALUES
('Futuro da Tradução', 'futuro-traducao', 'IA e humanos.', 'Conteúdo...', 'published', 'a1111111-1111-1111-1111-111111111111', 'Admin'),
('Dicas LGA', 'dicas-lga', 'Como começar.', 'Conteúdo...', 'published', 'a1111111-1111-1111-1111-111111111111', 'Admin'),
('Ética Profissional', 'etica-prof', 'Conduta.', 'Conteúdo...', 'published', 'a1111111-1111-1111-1111-111111111111', 'Admin'),
('Tradução em Luanda', 'trad-luanda', 'Contexto local.', 'Conteúdo...', 'published', 'a1111111-1111-1111-1111-111111111111', 'Admin'),
('Certificações', 'certificacoes', 'Quais valem a pena.', 'Conteúdo...', 'published', 'a1111111-1111-1111-1111-111111111111', 'Admin'),
('Carreira Freelance', 'carreira-freelance', 'Desafios.', 'Conteúdo...', 'published', 'a1111111-1111-1111-1111-111111111111', 'Admin')
ON CONFLICT DO NOTHING;

INSERT INTO public.forum_topics (author_id, title, category) VALUES
('b1111111-1111-1111-1111-111111111111', 'Como lidar com clientes?', 'general'),
('b2222222-2222-2222-2222-222222222222', 'Qual o melhor dicionário LGA?', 'tips'),
('b3333333-3333-3333-3333-333333333333', 'Recomendações de software.', 'tools'),
('c1111111-1111-1111-1111-111111111111', 'Procuro intérprete EN/FR.', 'jobs'),
('c2222222-2222-2222-2222-222222222222', 'Preços médios por hora.', 'general'),
('a1111111-1111-1111-1111-111111111111', 'Regras da comunidade.', 'support')
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (target_scope, is_specific, requester_profile_id, interpreter_profile_id, admin_profile_id, title, message, type) VALUES
('requesters', true, 'c1111111-2222-1111-1111-111111111111', null, null, 'Reserva Confirmada', 'Aguardando pagamento.', 'info'),
('interpreters', false, null, null, null, 'Nova Oportunidade', 'Confira os novos anúncios.', 'info'),
('admins', false, null, null, null, 'Relatório Semanal', 'Disponível no dashboard.', 'info'),
('all', false, null, null, null, 'Manutenção do Sistema', 'Domingo às 02:00.', 'warning'),
('requesters', true, 'c2222222-2222-2222-2222-222222222222', null, null, 'Avaliação Pendente', 'O que achou do serviço?', 'info'),
('interpreters', true, null, 'b1111111-2222-1111-1111-111111111111', null, 'Pagamento Recebido', 'Valor creditado na conta.', 'success')
ON CONFLICT DO NOTHING;

INSERT INTO public.support_tickets (user_id, subject, description, category, priority, status) VALUES
('c1111111-1111-1111-1111-111111111111', 'Problema no Login', 'Não consigo entrar.', 'technical', 'high', 'open'),
('b1111111-1111-1111-1111-111111111111', 'Erro na Fatura', 'Valor incorreto.', 'billing', 'medium', 'in_progress'),
('b2222222-2222-2222-2222-222222222222', 'Sugestão de Feature', 'Mais filtros.', 'suggestion', 'low', 'open'),
('c2222222-2222-2222-2222-222222222222', 'Dúvida sobre Booking', 'Como cancelar?', 'account', 'medium', 'closed'),
('b3333333-3333-3333-3333-333333333333', 'Acesso negado', 'Área de documentos.', 'technical', 'high', 'open'),
('c3333333-3333-3333-3333-333333333333', 'Denúncia de Perfil', 'Dados falsos.', 'complaint', 'high', 'open')
ON CONFLICT DO NOTHING;

INSERT INTO public.legal_resources (title, content, type, is_published, author_user_id) VALUES
('Privacidade', 'Termos...', 'privacy_policy', true, 'a1111111-1111-1111-1111-111111111111'),
('Termos de Uso', 'Regras...', 'terms_conditions', true, 'a1111111-1111-1111-1111-111111111111'),
('Código de Ética', 'Conduta...', 'ethics_code', true, 'a1111111-1111-1111-1111-111111111111'),
('LGPD Angola', 'Privacidade local...', 'privacy_policy', true, 'a1111111-1111-1111-1111-111111111111'),
('Contrato Padrão', 'Modelo...', 'terms_conditions', true, 'a1111111-1111-1111-1111-111111111111'),
('Manual do Intérprete', 'Guia...', 'ethics_code', true, 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO public.success_cases (title, summary, content, interpreter_id, author_user_id) VALUES
('Grande Conferência de Petróleo', 'Total - 100% satisfação', 'Interpretação simultânea em ambiente offshore.', 'b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
('Projeto inclusão Escolar', 'Min. Educação - 500 alunos', 'LGA em 10 escolas públicas de Luanda.', 'b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111'),
('Cimeiras da SADC', 'Governo - Zero falhas', 'Ligas continentais em conferência diplomática.', 'b3333333-3333-3333-3333-333333333333', 'a2222222-1111-1111-1111-111111111111'),
('Expansão Tech', 'Startup Hub - Vendas +20%', 'Suporte em 3 países para expansão de mercado.', 'b4444444-4444-4444-4444-444444444444', 'a1111111-1111-1111-1111-111111111111'),
('Mutirão de Saúde', 'Vida Hospital - 200 consultas', 'Atendimento direto em consultório médico síncrono.', 'b5555555-5555-5555-5555-555555555555', 'a2222222-1111-1111-1111-111111111111'),
('Forum Jurídico Internacional', 'OAA - Elogios do painel', 'Terminologia complexa em audiência simulada.', 'b6666666-6666-6666-6666-666666666666', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO public.events (title, description, start_date, end_date, location, type, status, organizer_id) VALUES
('Workshop de LGA', 'Sinais básicos.', now() + interval '30 days', now() + interval '31 days', 'Luanda', 'presential', 'published', 'a1111111-1111-1111-1111-111111111111'),
('Conferência de Tradutores', 'Futuro da profissão.', now() + interval '60 days', now() + interval '62 days', 'Namibe', 'presential', 'published', 'a2222222-1111-1111-1111-111111111111'),
('Webinar: Ética', 'Painel online.', now() + interval '15 days', now() + interval '15 days', 'Online', 'online', 'published', 'a1111111-1111-1111-1111-111111111111'),
('Encontro de Networking', 'Café com intérpretes.', now() + interval '45 days', now() + interval '45 days', 'Lubango', 'presential', 'published', 'a2222222-1111-1111-1111-111111111111'),
('Bootcamp Simultânea', 'Treino intenso.', now() + interval '90 days', now() + interval '97 days', 'Luanda', 'presential', 'published', 'a1111111-1111-1111-1111-111111111111'),
('Mesa Redonda: Negócios', 'Estratégias.', now() + interval '20 days', now() + interval '20 days', 'Online', 'online', 'published', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO public.opportunities (title, description, type, status, remuneration, currency, deadline, posted_by_user_id) VALUES
('Busco tradutor FR/PT', 'Artigo científico.', 'contract', 'open', 50000.00, 'AOA', now() + interval '7 days', 'c1111111-1111-1111-1111-111111111111'),
('Intérprete LGA Evento', 'Show ao vivo.', 'freelance', 'open', 100000.00, 'AOA', now() + interval '14 days', 'c2222222-2222-2222-2222-222222222222'),
('Tradutor Jurídico ES', 'Contratos.', 'contract', 'open', 75000.00, 'AOA', now() + interval '5 days', 'c3333333-3333-3333-3333-333333333333'),
('Intérprete Médico', 'Acompanhamento.', 'freelance', 'open', 40000.00, 'AOA', now() + interval '2 days', 'c4444444-4444-4444-4444-444444444444'),
('Tradução de Site Tech', 'Landing page.', 'contract', 'open', 120000.00, 'AOA', now() + interval '20 days', 'c5555555-5555-5555-5555-555555555555'),
('Interprete Simultânea', 'Fórum de 3 dias.', 'full_time', 'open', 300000.00, 'AOA', now() + interval '30 days', 'c6666666-6666-6666-6666-666666666666')
ON CONFLICT DO NOTHING;

INSERT INTO public.partnerships (name, description, type, logo_url, website_url) VALUES
('Unitel', 'Telecom parceira.', 'corporate', '/logos/unitel.png', 'https://unitel.ao'),
('BAI', 'Soluções financeiras.', 'corporate', '/logos/bai.png', 'https://bai.ao'),
('LGA Association', 'Certificação oficial.', 'ngo', '/logos/lga.png', 'https://lga.ao'),
('Min. Educação', 'Parceiro governamental.', 'government', '/logos/med.png', 'https://med.gov'),
('Total Energy', 'Corporate support.', 'corporate', '/logos/total.png', 'https://total.ao'),
('Angola Tech', 'Inovação e tech.', 'academic', '/logos/tech.png', 'https://angolatech.ao')
ON CONFLICT DO NOTHING;

INSERT INTO public.testimonials (author_name, author_role, author_avatar_url, author_user_id, content, rating, status) VALUES
('António Carlos', 'Diretor', '/avatars/1.jpg', 'c1111111-1111-1111-1111-111111111111', 'Plataforma incrível.', 5, 'approved'),
('Beatriz Silva', 'Intérprete', '/avatars/2.jpg', 'b1111111-1111-1111-1111-111111111111', 'Consigo muito trabalho.', 5, 'approved'),
('Carlos Manuel', 'Coordenador', '/avatars/3.jpg', 'c3333333-3333-3333-3333-333333333333', 'Facilitou muito a logística.', 4, 'approved'),
('Delfina Luísa', 'CEO', '/avatars/4.jpg', 'c4444444-4444-4444-4444-444444444444', 'Profissionais qualificados.', 5, 'approved'),
('Eduardo Jorge', 'Professor', '/avatars/5.jpg', 'c5555555-5555-5555-5555-555555555555', 'Ótima para acadêmicos.', 4, 'approved'),
('Fátima Santos', 'PM', '/avatars/6.jpg', 'c6666666-6666-6666-6666-666666666666', 'O sistema de bookings é nota 10.', 5, 'approved')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. EXTRA SATELLITE DATA (Portfolios, Docs, Chat, etc.)
-- ==========================================

INSERT INTO public.interpreter_portfolios (interpreter_profile_id, title, url, type, description) VALUES
('b1111111-2222-1111-1111-111111111111', 'Apresentação Total Energy', 'https://vimeo.com/123', 'apresentacao', 'Interpretação simultânea ES/PT.'),
('b2222222-2222-2222-2222-222222222222', 'Aula Aberta LGA', 'https://youtube.com/456', 'aula', 'Sinais básicos para iniciantes.'),
('b3333333-2222-3333-3333-333333333333', 'Palestra Oxford', 'https://vimeo.com/789', 'palestra', 'O mercado de tradução na África.'),
('b4444444-2222-4444-4444-444444444444', 'Manual Técnico FR', 'https://docs.google.com/doc1', 'trabalho', 'Tradução técnica industrial.'),
('b5555555-2222-5555-5555-555555555555', 'Congresso Médico BAI', 'https://youtube.com/abc', 'palestra', 'Interpretação simultânea médica.'),
('b6666666-2222-6666-6666-666666666666', 'Mesa Redonda Jurídica', 'https://vimeo.com/def', 'palestra', 'Direito comparado.')
ON CONFLICT DO NOTHING;

INSERT INTO public.documents (user_id, type, file_url, file_name, status) VALUES
('b1111111-1111-1111-1111-111111111111', 'id_card', 'https://s3/docs/id_joao.pdf', 'Bilhete_Identidade.pdf', 'approved'),
('b2222222-2222-2222-2222-222222222222', 'criminal_record', 'https://s3/docs/cr_maria.pdf', 'Registo_Criminal.pdf', 'approved'),
('b3333333-3333-3333-3333-333333333333', 'certificate', 'https://s3/docs/cert_carlos.pdf', 'Certificado_Oxford.pdf', 'approved'),
('b4444444-4444-4444-4444-444444444444', 'id_card', 'https://s3/docs/id_ana.pdf', 'BI_Ana.pdf', 'pending'),
('b5555555-5555-5555-5555-555555555555', 'certificate', 'https://s3/docs/cert_pedro.pdf', 'Certificado_Medico.pdf', 'approved'),
('b6666666-6666-6666-6666-666666666666', 'criminal_record', 'https://s3/docs/cr_sofia.pdf', 'Registo_Criminal_Sofia.pdf', 'approved')
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_requests (interpreter_profile_id, type, status, submitted_at) VALUES
('b1111111-2222-1111-1111-111111111111', 'paid', 'approved', now() - interval '30 days'),
('b2222222-2222-2222-2222-222222222222', 'free', 'approved', now() - interval '20 days'),
('b3333333-2222-3333-3333-333333333333', 'paid', 'approved', now() - interval '15 days'),
('b4444444-2222-4444-4444-444444444444', 'free', 'pending', now()),
('b5555555-2222-5555-5555-555555555555', 'paid', 'approved', now() - interval '10 days'),
('b6666666-2222-6666-6666-666666666666', 'paid', 'approved', now() - interval '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_messages (booking_id, sender_id, content) VALUES
('10000000-0000-0000-0000-000000000001', 'c1111111-1111-1111-1111-111111111111', 'Confirmamos o horário?'),
('10000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'Sim, estarei lá.'),
('10000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', 'Pode enviar o link do Zoom?'),
('10000000-0000-0000-0000-000000000002', 'b2222222-2222-2222-2222-222222222222', 'Enviado por e-mail e aqui: zoom.us/j/123'),
('10000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 'Obrigado pelo suporte hoje.'),
('10000000-0000-0000-0000-000000000003', 'b3333333-3333-3333-3333-333333333333', 'Por nada, o prazer foi meu.')
ON CONFLICT DO NOTHING;

INSERT INTO public.favorites (requester_profile_id, interpreter_profile_id) VALUES
('c1111111-2222-1111-1111-111111111111', 'b1111111-2222-1111-1111-111111111111'),
('c1111111-2222-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'),
('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'),
('c3333333-3333-3333-3333-333333333333', 'b3333333-2222-3333-3333-333333333333'),
('c4444444-2222-4444-4444-444444444444', 'b4444444-2222-4444-4444-444444444444'),
('c5555555-2222-5555-5555-555555555555', 'b5555555-2222-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_logs (user_id, user_name, user_email, user_role, action, module, description, severity, target_id, target_type, target_label, ip_address, user_agent, session_id, success) VALUES
('a1111111-1111-1111-1111-111111111111', 'Admin', 'admin@gracemind.com', 'admin', 'login', 'auth', 'Admin logged in', 'low', 'a1111111', 'user', 'Admin', '127.0.0.1', 'Chrome', 's1', true),
('a1111111-1111-1111-1111-111111111111', 'Admin', 'admin@gracemind.com', 'admin', 'update', 'interpreters', 'Verified João Profile', 'medium', 'b1111111', 'profile', 'João', '127.0.0.1', 'Chrome', 's1', true),
('c1111111-1111-1111-1111-111111111111', 'Empresa X', 'empresa.x@example.com', 'requester', 'create', 'bookings', 'Created new booking', 'low', '10000000', 'booking', 'B-1', '127.0.0.1', 'Safari', 's2', true),
('b1111111-1111-1111-1111-111111111111', 'João', 'joao@example.com', 'interpreter', 'accept', 'bookings', 'Accepted booking', 'low', '10000000', 'booking', 'B-1', '127.0.0.1', 'App', 's3', true),
('a2222222-1111-1111-1111-111111111111', 'Support', 'suporte@gracemind.com', 'admin', 'delete', 'forum', 'Removed toxic post', 'high', 'p1', 'post', 'Forum Post', '127.0.0.1', 'Edge', 's4', true),
('c2222222-2222-2222-2222-222222222222', 'Cliente Y', 'cliente.y@example.com', 'requester', 'fail', 'payments', 'Payment failed', 'medium', 'pay1', 'payment', 'P-1', '127.0.0.1', 'Firefox', 's5', false)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. EXTRA SATELLITE DATA (Portfolios, Docs, Chat, etc.)
-- ==========================================

INSERT INTO public.interpreter_portfolios (interpreter_profile_id, title, url, type, description) VALUES
('b1111111-2222-1111-1111-111111111111', 'Apresentação Total Energy', 'https://vimeo.com/123', 'apresentacao', 'Interpretação simultânea ES/PT.'),
('b2222222-2222-2222-2222-222222222222', 'Aula Aberta LGA', 'https://youtube.com/456', 'aula', 'Sinais básicos para iniciantes.'),
('b3333333-2222-3333-3333-333333333333', 'Palestra Oxford', 'https://vimeo.com/789', 'palestra', 'O mercado de tradução na África.'),
('b4444444-2222-4444-4444-444444444444', 'Manual Técnico FR', 'https://docs.google.com/doc1', 'trabalho', 'Tradução técnica industrial.'),
('b5555555-2222-5555-5555-555555555555', 'Congresso Médico BAI', 'https://youtube.com/abc', 'palestra', 'Interpretação simultânea médica.'),
('b6666666-2222-6666-6666-666666666666', 'Mesa Redonda Jurídica', 'https://vimeo.com/def', 'palestra', 'Direito comparado.')
ON CONFLICT DO NOTHING;

INSERT INTO public.documents (user_id, type, file_url, file_name, status) VALUES
('b1111111-1111-1111-1111-111111111111', 'id_card', 'https://s3/docs/id_joao.pdf', 'Bilhete_Identidade.pdf', 'approved'),
('b2222222-2222-2222-2222-222222222222', 'criminal_record', 'https://s3/docs/cr_maria.pdf', 'Registo_Criminal.pdf', 'approved'),
('b3333333-3333-3333-3333-333333333333', 'certificate', 'https://s3/docs/cert_carlos.pdf', 'Certificado_Oxford.pdf', 'approved'),
('b4444444-4444-4444-4444-444444444444', 'id_card', 'https://s3/docs/id_ana.pdf', 'BI_Ana.pdf', 'pending'),
('b5555555-5555-5555-5555-555555555555', 'certificate', 'https://s3/docs/cert_pedro.pdf', 'Certificado_Medico.pdf', 'approved'),
('b6666666-6666-6666-6666-666666666666', 'criminal_record', 'https://s3/docs/cr_sofia.pdf', 'Registo_Criminal_Sofia.pdf', 'approved')
ON CONFLICT DO NOTHING;

INSERT INTO public.verification_requests (interpreter_profile_id, type, status, submitted_at) VALUES
('b1111111-2222-1111-1111-111111111111', 'paid', 'approved', now() - interval '30 days'),
('b2222222-2222-2222-2222-222222222222', 'free', 'approved', now() - interval '20 days'),
('b3333333-2222-3333-3333-333333333333', 'paid', 'approved', now() - interval '15 days'),
('b4444444-2222-4444-4444-444444444444', 'free', 'pending', now()),
('b5555555-2222-5555-5555-555555555555', 'paid', 'approved', now() - interval '10 days'),
('b6666666-2222-6666-6666-666666666666', 'paid', 'approved', now() - interval '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO public.chat_messages (booking_id, sender_id, content) VALUES
('10000000-0000-0000-0000-000000000001', 'c1111111-1111-1111-1111-111111111111', 'Confirmamos o horário?'),
('10000000-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'Sim, estarei lá.'),
('10000000-0000-0000-0000-000000000002', 'c2222222-2222-2222-2222-222222222222', 'Pode enviar o link do Zoom?'),
('10000000-0000-0000-0000-000000000002', 'b2222222-2222-2222-2222-222222222222', 'Enviado por e-mail e aqui: zoom.us/j/123'),
('10000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 'Obrigado pelo suporte hoje.'),
('10000000-0000-0000-0000-000000000003', 'b3333333-3333-3333-3333-333333333333', 'Por nada, o prazer foi meu.') ON CONFLICT DO NOTHING;

INSERT INTO public.favorites (requester_profile_id, interpreter_profile_id) VALUES
('c1111111-2222-1111-1111-111111111111', 'b1111111-2222-1111-1111-111111111111'),
('c1111111-2222-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222'),
('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'),
('c3333333-2222-3333-3333-333333333333', 'b3333333-2222-3333-3333-333333333333'),
('c4444444-2222-4444-4444-444444444444', 'b4444444-2222-4444-4444-444444444444'),
('c5555555-2222-5555-5555-555555555555', 'b5555555-2222-5555-5555-555555555555')
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_logs (user_id, user_name, user_email, user_role, action, module, description, severity, target_id, target_type, target_label, ip_address, user_agent, session_id, success) VALUES
('a1111111-1111-1111-1111-111111111111', 'Admin', 'admin@gracemind.com', 'admin', 'login', 'auth', 'Admin logged in', 'low', 'a1111111', 'user', 'Admin', '127.0.0.1', 'Chrome', 's1', true),
('a1111111-1111-1111-1111-111111111111', 'Admin', 'admin@gracemind.com', 'admin', 'update', 'interpreters', 'Verified João Profile', 'medium', 'b1111111', 'profile', 'João', '127.0.0.1', 'Chrome', 's1', true),
('c1111111-1111-1111-1111-111111111111', 'Empresa X', 'empresa.x@example.com', 'requester', 'create', 'bookings', 'Created new booking', 'low', '10000000', 'booking', 'B-1', '127.0.0.1', 'Safari', 's2', true),
('b1111111-1111-1111-1111-111111111111', 'João', 'joao@example.com', 'interpreter', 'accept', 'bookings', 'Accepted booking', 'low', '10000000', 'booking', 'B-1', '127.0.0.1', 'App', 's3', true),
('a2222222-1111-1111-1111-111111111111', 'Support', 'suporte@gracemind.com', 'admin', 'delete', 'forum', 'Removed toxic post', 'high', 'p1', 'post', 'Forum Post', '127.0.0.1', 'Edge', 's4', true),
('c2222222-2222-2222-2222-222222222222', 'Cliente Y', 'cliente.y@example.com', 'requester', 'fail', 'payments', 'Payment failed', 'medium', 'pay1', 'payment', 'P-1', '127.0.0.1', 'Firefox', 's5', false)
ON CONFLICT DO NOTHING;