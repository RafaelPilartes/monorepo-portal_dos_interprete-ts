export interface AuditLog {
  id: string
  admin_id: string
  admin_name: string
  admin_email: string
  admin_role: string
  action: string
  module: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  target_id: string
  target_type: string
  target_label: string
  previous_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_fields: string[]
  ip_address: string
  user_agent: string
  session_id: string
  location: string
  success: boolean
  error_message: string | null
  created_at: string
}

export const mockLogs: AuditLog[] = [
  {
    id: "AUD-001",
    admin_id: "usr_9b1x",
    admin_name: "Rafael Pilartes",
    admin_email: "rafael.pilartes@gracemind.com",
    admin_role: "super_admin",
    action: "UPDATE",
    module: "system_config",
    description: "Alterou o valor da configuração do sistema 'taxa_plataforma'",
    severity: "high",
    target_id: "sys_conf_10",
    target_type: "configuration",
    target_label: "Taxa de Plataforma",
    previous_data: { fee: 10 },
    new_data: { fee: 15 },
    changed_fields: ["fee"],
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0",
    session_id: "sess_xyz123",
    location: "Luanda, Angola",
    success: true,
    error_message: null,
    created_at: "2024-03-24T10:00:00Z"
  },
  {
    id: "AUD-002",
    admin_id: "usr_2c3y",
    admin_name: "Ana Beatriz",
    admin_email: "ana.beatriz@gracemind.com",
    admin_role: "financial",
    action: "APPROVE",
    module: "verification_requests",
    description: "Aprovou a verificação do intérprete 'João Silva'",
    severity: "medium",
    target_id: "req_vk4m",
    target_type: "verification_request",
    target_label: "Verificação de Perfil",
    previous_data: { status: "pending" },
    new_data: { status: "approved" },
    changed_fields: ["status"],
    ip_address: "192.168.1.101",
    user_agent: "Mozilla/5.0",
    session_id: "sess_abc456",
    location: "Benguela, Angola",
    success: true,
    error_message: null,
    created_at: "2024-03-23T14:30:00Z"
  },
  {
    id: "AUD-003",
    admin_id: "usr_4d5z",
    admin_name: "Carlos Manuel",
    admin_email: "carlos.manuel@gracemind.com",
    admin_role: "support",
    action: "DELETE",
    module: "interpreters",
    description: "Tentou eliminar a conta do utilizador 'Maria Santos'",
    severity: "low",
    target_id: "usr_a1b2",
    target_type: "interpreter_profile",
    target_label: "Conta de Intérprete",
    previous_data: null,
    new_data: null,
    changed_fields: [],
    ip_address: "192.168.1.102",
    user_agent: "Mozilla/5.0",
    session_id: "sess_def789",
    location: "Huíla, Angola",
    success: false,
    error_message: "Permission denied",
    created_at: "2024-03-22T09:15:00Z"
  },
  {
    id: "AUD-004",
    admin_id: "usr_9b1x",
    admin_name: "Rafael Pilartes",
    admin_email: "rafael.pilartes@gracemind.com",
    admin_role: "super_admin",
    action: "CREATE",
    module: "admin_team",
    description: "Adicionou um novo administrador 'Sara Lima'",
    severity: "medium",
    target_id: "usr_new99",
    target_type: "admin_user",
    target_label: "Conta de Administrador",
    previous_data: null,
    new_data: { name: "Sara Lima", role: "moderator" },
    changed_fields: ["name", "role", "email"],
    ip_address: "192.168.1.100",
    user_agent: "Mozilla/5.0",
    session_id: "sess_xyz123",
    location: "Luanda, Angola",
    success: true,
    error_message: null,
    created_at: "2024-03-21T16:45:00Z"
  },
  {
    id: "AUD-005",
    admin_id: "sys_auto",
    admin_name: "System",
    admin_email: "system@gracemind.com",
    admin_role: "system",
    action: "FAIL",
    module: "authentication",
    description: "Múltiplas tentativas de login falhadas para o IP 203.0.113.1",
    severity: "critical",
    target_id: "ip_ban_001",
    target_type: "security",
    target_label: "Login Security",
    previous_data: null,
    new_data: { ip_banned: "203.0.113.1" },
    changed_fields: ["ip_ban_list"],
    ip_address: "203.0.113.1",
    user_agent: "Unknown",
    session_id: "none",
    location: "Unknown",
    success: false,
    error_message: "Brute force detected",
    created_at: "2024-03-20T23:59:59Z"
  }
];
