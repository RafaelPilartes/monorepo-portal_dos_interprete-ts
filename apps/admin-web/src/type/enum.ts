// Enums the moved AdminTeam screen still uses (copied from the old SPA's src/type/enum/identity.ts, in git up to v0.5.0).
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
