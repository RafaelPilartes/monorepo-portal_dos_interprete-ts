// Enums the moved AdminTeam screen still uses (copied from legacy/src/type/enum/identity.ts).
// They go away when H1 rewires the team screen to the new data layer.
export enum UserRole {
  ADMIN = 'admin',
  INTERPRETER = 'interpreter',
  REQUESTER = 'requester',
}

export enum AdminPermissionLevel {
  SUPER_ADMIN = 'super_admin',
  MODERATOR = 'moderator',
  FINANCE = 'finance',
}
