-- Development seed of step H3 (catalogs.md, Seed). Applied once. The services come from the old
-- mocks (Services.tsx, AdminServices.tsx); their table prices are FICTITIOUS placeholders for
-- development: the Academia sets the real ones in admin-web before production (PC-02 spirit).
INSERT INTO catalog.languages (code, name, is_sign_language, sort) VALUES
  ('lga', 'Língua Gestual Angolana', true, 10),
  ('pt', 'Português', false, 20),
  ('en', 'Inglês', false, 30),
  ('fr', 'Francês', false, 40),
  ('es', 'Espanhol', false, 50),
  ('kmb', 'Kimbundu', false, 60),
  ('umb', 'Umbundu', false, 70),
  ('kon', 'Kikongo', false, 80),
  ('cjk', 'Cokwe', false, 90);

INSERT INTO catalog.specialties (slug, name, description, sort) VALUES
  ('saude', 'Saúde', 'Consultas, hospitais e centros de saúde.', 10),
  ('justica', 'Justiça', 'Tribunais, esquadras, notários e advogados.', 20),
  ('educacao', 'Educação', 'Escolas, universidades e formações.', 30),
  ('eventos', 'Eventos', 'Eventos públicos, espectáculos e cerimónias.', 40),
  ('conferencias', 'Conferências', 'Conferências, seminários e palestras.', 50),
  ('empresarial', 'Empresarial', 'Reuniões e comunicação nas empresas.', 60),
  ('religioso', 'Religioso', 'Cultos, missas e cerimónias religiosas.', 70),
  ('comunicacao-social', 'Comunicação social', 'Televisão, rádio e imprensa.', 80);

INSERT INTO catalog.services (slug, title, description, pricing_mode, platform_price_aoa, icon, active, sort) VALUES
  ('educacao', 'Educação', 'Interpretação em escolas, universidades, formações e conferências académicas.', 'hourly', 15000, 'education', true, 10),
  ('saude', 'Saúde', 'Acompanhamento em consultas médicas, hospitais e centros de saúde.', 'hourly', 15000, 'health', true, 20),
  ('juridico', 'Jurídico', 'Interpretação em tribunais, esquadras, notários e advogados.', 'hourly', 20000, 'legal', true, 30),
  ('eventos', 'Eventos', 'Cobertura de eventos públicos, conferências, espectáculos e cerimónias.', 'hourly', 18000, 'events', true, 40),
  ('religioso', 'Religioso', 'Interpretação em missas, cultos, casamentos e eventos religiosos.', 'fixed', 25000, 'religious', true, 50),
  ('online', 'Online', 'Interpretação remota para videoconferências, aulas online e webinars.', 'hourly', 12000, 'online', true, 60),
  ('empresarial', 'Empresarial', 'Reuniões de negócios e comunicação corporativa.', 'hourly', 18000, 'business', false, 70);
