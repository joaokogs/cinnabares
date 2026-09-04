import { boolean, date, foreignKey, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core"

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  role: text("role").notNull().default("user"),
  ...timestamps,
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  issuer: text("issuer").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
})

export const guild = pgTable(
  "guild",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    tag: text("tag").notNull().unique(),
    description: text("description").notNull().default(""),
    image: text("image"),
    banner: text("banner"),
    founderId: text("founder_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [unique("guild_name_unique").on(table.name)]
)

export const guildMember = pgTable(
  "guild_member",
  {
    guildId: text("guild_id")
      .notNull()
      .references(() => guild.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.userId] }),
    unique("guild_member_user_unique").on(table.userId),
  ]
)

export const guildRole = pgTable(
  "guild_role",
  {
    id: text("id").primaryKey(),
    guildId: text("guild_id")
      .notNull()
      .references(() => guild.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#ff5b4f"),
    position: integer("position").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    permissions: jsonb("permissions").$type<Record<string, boolean>>().notNull().default({}),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [unique("guild_role_name_unique").on(table.guildId, table.name)]
)

export const guildMemberRole = pgTable(
  "guild_member_role",
  {
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    roleId: text("role_id")
      .notNull()
      .references(() => guildRole.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.userId, table.roleId] }),
    foreignKey({
      columns: [table.guildId, table.userId],
      foreignColumns: [guildMember.guildId, guildMember.userId],
      name: "guild_member_role_member_fk",
    }).onDelete("cascade"),
  ]
)

export const guildInvite = pgTable("guild_invite", {
  id: text("id").primaryKey(),
  guildId: text("guild_id")
    .notNull()
    .references(() => guild.id, { onDelete: "cascade" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  token: text("token").notNull().unique(),
  uses: integer("uses").notNull().default(0),
  maxUses: integer("max_uses"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...timestamps,
})

export const tournamentFormat = pgEnum("tournament_format", ["individual", "guild"])
export const tournamentVisibility = pgEnum("tournament_visibility", ["blind", "partial", "total"])
export const tournamentStatus = pgEnum("tournament_status", ["draft", "open", "closed", "active", "finished"])
export const tournamentTier = pgEnum("tournament_tier", ["overused", "underused", "neverused", "doubles", "random"])
export const registrationStatus = pgEnum("tournament_registration_status", ["pending", "approved", "rejected"])

export type TournamentTier = "overused" | "underused" | "neverused" | "doubles" | "random"
export type TournamentPokemon = { name: string; item?: string }
export type TournamentRosterEntry = {
  playerId: string
  tier: TournamentTier
  team?: TournamentPokemon[]
}

export type MatchBattle = {
  slot1PlayerId: string | null
  slot2PlayerId: string | null
  winnerPlayerId: string | null
}

export const tournament = pgTable("tournament", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  format: tournamentFormat("format").notNull(),
  tiers: jsonb("tiers").$type<TournamentTier[]>().notNull(),
  tierRules: jsonb("tier_rules").$type<Partial<Record<TournamentTier, number>>>().notNull().default({}),
  slots: integer("slots").notNull(),
  visibility: tournamentVisibility("visibility").notNull().default("blind"),
  status: tournamentStatus("status").notNull().default("draft"),
  scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
  scheduledTime: text("scheduled_time").notNull(),
  location: text("location").notNull(),
  reward: text("reward").notNull().default(""),
  teamSize: integer("team_size").notNull().default(1),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  ...timestamps,
})

export const tournamentRegistration = pgTable(
  "tournament_registration",
  {
    id: text("id").primaryKey(),
    tournamentId: text("tournament_id")
      .notNull()
      .references(() => tournament.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    guildId: text("guild_id").references(() => guild.id, { onDelete: "cascade" }),
    status: registrationStatus("status").notNull().default("pending"),
    roster: jsonb("roster").$type<TournamentRosterEntry[]>().notNull().default([]),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    ...timestamps,
  },
  (table) => [
    unique("tournament_registration_user_unique").on(table.tournamentId, table.userId),
    unique("tournament_registration_guild_unique").on(table.tournamentId, table.guildId),
  ]
)

export const bracketMatchStatus = pgEnum("bracket_match_status", ["pending", "completed"])

export const bracket = pgTable("bracket", {
  id: text("id").primaryKey(),
  tournamentId: text("tournament_id")
    .notNull()
    .references(() => tournament.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  ...timestamps,
}, (table) => [unique("bracket_tournament_unique").on(table.tournamentId)])

export const bracketMatch = pgTable(
  "bracket_match",
  {
    id: text("id").primaryKey(),
    bracketId: text("bracket_id")
      .notNull()
      .references(() => bracket.id, { onDelete: "cascade" }),
    phase: integer("phase").notNull(),
    position: integer("position").notNull(),
    slot1RegistrationId: text("slot1_registration_id")
      .references(() => tournamentRegistration.id, { onDelete: "set null" }),
    slot2RegistrationId: text("slot2_registration_id")
      .references(() => tournamentRegistration.id, { onDelete: "set null" }),
    winnerRegistrationId: text("winner_registration_id")
      .references(() => tournamentRegistration.id, { onDelete: "set null" }),
    battles: jsonb("battles").$type<MatchBattle[]>().notNull().default([]),
    score1: integer("score1").notNull().default(0),
    score2: integer("score2").notNull().default(0),
    status: bracketMatchStatus("status").notNull().default("pending"),
    ...timestamps,
  },
  (table) => [unique("bracket_match_bracket_phase_position_unique").on(table.bracketId, table.phase, table.position)]
)

export const bracketActionLog = pgTable("bracket_action_log", {
  id: text("id").primaryKey(),
  bracketId: text("bracket_id")
    .notNull()
    .references(() => bracket.id, { onDelete: "cascade" }),
  matchId: text("match_id")
    .notNull()
    .references(() => bracketMatch.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  winnerRegistrationId: text("winner_registration_id")
    .references(() => tournamentRegistration.id, { onDelete: "set null" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const authSchema = { user, session, account, verification }
