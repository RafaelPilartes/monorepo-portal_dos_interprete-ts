-- Development seed of step H1 (data-model.md §4, decisions.md §10). Applied once.
-- Version 1 of the configuration as a draft with the development values; bootstrap-admin.mjs
-- publishes it (R-STF-03). Values marked fictitious are placeholders for PC-02, PC-03 and PC-06:
-- production starts with them empty.
INSERT INTO config.platform_versions (
  version_number, status, notes,
  request_min_lead_minutes, urgent_threshold_hours, max_interpreters_per_request,
  two_interpreters_suggest_minutes, billing_minimum_minutes, billing_round_minutes,
  invite_expiry_hours, staffing_warning_hours, overlap_buffer_minutes,
  cancellation_free_until_hours, completion_auto_confirm_hours, review_window_days,
  review_reveal_days, chat_close_days,
  managed_interpreter_share_pct, managed_payment_deadline_hours, managed_refund_full_until_hours,
  managed_refund_late_pct,
  verification_fee_aoa, verification_validity_months, verification_renewal_notice_days,
  verification_refund_on_reject_pct, verification_free_resubmissions, verification_payment_deadline_days,
  event_payment_deadline_hours, event_refund_until_hours, content_reports_autohide_threshold,
  tax_rate_pct, prices_include_tax,
  academia_bank_name, academia_iban, academia_beneficiary,
  org_invite_expiry_days, support_autoclose_days, mentorship_max_per_mentor
) VALUES (
  1, 'draft', 'Valores de desenvolvimento. Fictícios: percentagem do gerido, taxa de verificação e dados bancários da Academia.',
  30, 24, 5,
  60, 60, 30,
  48, 24, 30,
  24, 48, 30,
  14, 7,
  80, 48, 24,
  0,
  15000, 12, 30,
  0, 1, 7,
  48, 48, 3,
  0, true,
  'Banco fictício (desenvolvimento)', 'AO06000000000000000000000', 'Academia Grace Mind (fictício)',
  7, 7, 3
);

INSERT INTO config.verification_document_types (code, name, description, required, active, sort) VALUES
  ('id_card', 'Bilhete de identidade', '', true, true, 1),
  ('criminal_record', 'Registo criminal', '', true, true, 2),
  ('academia_training', 'Certificado da formação da Academia', '', true, true, 3),
  ('other', 'Outro documento', '', false, true, 4);

-- PC-05: the texts stay empty until the Academia provides them.
INSERT INTO identity.legal_documents (kind, version, body) VALUES ('terms', 1, ''), ('privacy', 1, '');
