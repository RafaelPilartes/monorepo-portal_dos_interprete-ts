import { DataError, translatePostgrestError, type createSupabaseClient } from '@portal-dos-interpretes/data'
import type { Tables } from '@portal-dos-interpretes/db-types'

// The directory's reads and the interpreter's own writes (interpreter-profile-and-directory.md,
// api.md §16): straight to the database, under RLS and column grants. The rules stay in the
// database (R-DIR-01 in directory.profile_status, R-DIR-04 in the policies); this only reads.

type SupabaseClient = ReturnType<typeof createSupabaseClient>

export type ListingRow = Tables<{ schema: 'directory' }, 'public_listing'>
export type InterpreterProfileRow = Tables<{ schema: 'identity' }, 'interpreter_profiles'>
export type LanguageRow = Tables<{ schema: 'catalog' }, 'languages'>
export type SpecialtyRow = Tables<{ schema: 'catalog' }, 'specialties'>
export type ServiceRow = Tables<{ schema: 'catalog' }, 'services'>
export type InterpreterLanguageRow = Tables<{ schema: 'directory' }, 'interpreter_languages'>
export type InterpreterSpecialtyRow = Tables<{ schema: 'directory' }, 'interpreter_specialties'>
export type InterpreterServiceRow = Tables<{ schema: 'directory' }, 'interpreter_services'>
export type AvailabilityRuleRow = Tables<{ schema: 'directory' }, 'availability_rules'>
export type AvailabilityExceptionRow = Tables<{ schema: 'directory' }, 'availability_exceptions'>
export type EducationRow = Tables<{ schema: 'directory' }, 'education'>
export type ExperienceRow = Tables<{ schema: 'directory' }, 'experiences'>
export type CertificationRow = Tables<{ schema: 'directory' }, 'certifications'>
export type MediaItemRow = Tables<{ schema: 'directory' }, 'media_items'>
export type ArticleRow = Tables<{ schema: 'directory' }, 'articles'>
export type FavoriteRow = Tables<{ schema: 'directory' }, 'favorites'>
export type ProfileStatusRow = Tables<{ schema: 'directory' }, 'my_profile_status'>
export type ProfileItemRow = Tables<{ schema: 'directory' }, 'profile_items'>

/** The tables an interpreter writes its own rows in (data-model.md §3, "coluna — o próprio"). */
export type OwnTable = 'availability_rules' | 'availability_exceptions' | 'education' | 'experiences' | 'certifications' | 'media_items' | 'articles'

export interface ListingQuery {
  search?: string | undefined
  languageId?: string | undefined
  specialtyId?: string | undefined
  modality?: 'online' | 'in_person' | undefined
  city?: string | undefined
  limit: number
  offset: number
}

/** Everything an account may read of one interpreter (R-DIR-04), in one object. */
export interface InterpreterDetails {
  profile: InterpreterProfileRow
  fullName: string
  avatarUrl: string | null
  languages: { id: string; name: string; level: string; isSignLanguage: boolean }[]
  specialties: { id: string; name: string }[]
  /** The services on offer: active on the profile and in the catalog. */
  services: { id: string; title: string; pricingMode: string; priceAoa: number; description: string | null }[]
  /** Every language, specialty and service of the profile, items disabled in the catalog included. */
  items: ProfileItemRow[]
  blockedDays: AvailabilityExceptionRow[]
  education: EducationRow[]
  experiences: ExperienceRow[]
  certifications: CertificationRow[]
  videos: MediaItemRow[]
  articles: ArticleRow[]
  availability: AvailabilityRuleRow[]
}

export class DirectoryRepository {
  constructor(private readonly client: SupabaseClient) {}

  private from(schema: string, table: string) {
    return this.client.schema(schema).from(table)
  }

  private async rows<T>(request: PromiseLike<{ data: unknown; error: { code: string; message: string; hint?: string | null } | null }>, where: string): Promise<T[]> {
    const { data, error } = await request
    if (error) throw translatePostgrestError(error, where)
    return (data ?? []) as T[]
  }

  /**
   * A write on the own rows must touch one: zero means RLS no longer lets it (the team removed
   * the item, or it is gone), and the screen must not say it worked.
   */
  private async changed(request: PromiseLike<{ data: unknown; error: { code: string; message: string; hint?: string | null } | null }>, where: string): Promise<void> {
    const rows = await this.rows<unknown>(request, where)
    if (rows.length === 0) throw new DataError('STATE_CHANGED')
  }

  private async upload(bucket: 'avatars' | 'interpreter-media', path: string, file: File, refused: string): Promise<void> {
    const { error } = await this.client.storage.from(bucket).upload(path, file, { contentType: file.type })
    if (!error) return
    // Only a size or type refusal is the file's fault (the bucket's limits, AD-022).
    if (/size|mime|type|payload too large/i.test(error.message)) throw new FileRefused(refused, { cause: error })
    throw new DataError('INTERNAL_ERROR', { cause: error })
  }

  /** The public URL of a file in a public bucket (avatars, interpreter-media), or null. */
  publicUrl(bucket: 'avatars' | 'interpreter-media', path: string | null | undefined): string | null {
    return path ? this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl : null
  }

  /** site-web and requester-web /interpreters: server-side filters and pagination. */
  async listing(query: ListingQuery): Promise<{ rows: ListingRow[]; total: number }> {
    let request = this.from('directory', 'public_listing').select('*', { count: 'exact' })
    const term = query.search?.trim().replace(/[,()%]/g, ' ')
    if (term) request = request.ilike('full_name', `%${term}%`)
    if (query.languageId) request = request.contains('language_ids', [query.languageId])
    if (query.specialtyId) request = request.contains('specialty_ids', [query.specialtyId])
    if (query.modality) request = request.in('modality', [query.modality, 'both'])
    const city = query.city?.trim().replace(/[,()%]/g, ' ')
    if (city) request = request.ilike('city', `%${city}%`)
    const { data, error, count } = await request.order('full_name').range(query.offset, query.offset + query.limit - 1)
    if (error) throw translatePostgrestError(error, 'directory.public_listing')
    return { rows: (data ?? []) as ListingRow[], total: count ?? 0 }
  }

  async catalog(): Promise<{ languages: LanguageRow[]; specialties: SpecialtyRow[]; services: ServiceRow[] }> {
    const [languages, specialties, services] = await Promise.all([
      this.rows<LanguageRow>(this.from('catalog', 'languages').select('*').order('sort'), 'catalog.languages'),
      this.rows<SpecialtyRow>(this.from('catalog', 'specialties').select('*').order('sort'), 'catalog.specialties'),
      this.rows<ServiceRow>(this.from('catalog', 'services').select('*').order('sort'), 'catalog.services'),
    ])
    return { languages, specialties, services }
  }

  /** null when the slug does not exist or the account may not read it (R-DIR-04). */
  async details(where: { slug: string } | { accountId: string }): Promise<InterpreterDetails | null> {
    const base = this.from('identity', 'interpreter_profiles').select('*')
    const { data: profile, error } = await ('slug' in where ? base.eq('slug', where.slug) : base.eq('account_id', where.accountId)).maybeSingle()
    if (error) throw translatePostgrestError(error, 'identity.interpreter_profiles')
    if (!profile) return null
    const id = (profile as InterpreterProfileRow).account_id
    const own = <T>(table: string, order: string, ascending = false) =>
      this.rows<T>(this.from('directory', table).select('*').eq('interpreter_id', id).order(order, { ascending }), `directory.${table}`)
    const [person, items, education, experiences, certifications, videos, articles, availability, blockedDays] = await Promise.all([
      this.rows<{ full_name: string; avatar_path: string | null }>(this.from('identity', 'public_profiles').select('full_name, avatar_path').eq('id', id), 'identity.public_profiles'),
      this.profileItems(id),
      own<EducationRow>('education', 'start_year'),
      own<ExperienceRow>('experiences', 'start_date'),
      own<CertificationRow>('certifications', 'issued_on'),
      own<MediaItemRow>('media_items', 'created_at'),
      own<ArticleRow>('articles', 'published_at'),
      own<AvailabilityRuleRow>('availability_rules', 'start_time', true),
      this.rows<AvailabilityExceptionRow>(this.from('directory', 'availability_exceptions').select('*').eq('interpreter_id', id)
        .gte('day', new Date().toISOString().slice(0, 10)).order('day'), 'directory.availability_exceptions'),
    ])
    const of = (kind: string) => items.filter((row) => row.kind === kind)
    return {
      profile: profile as InterpreterProfileRow,
      fullName: person[0]?.full_name ?? '',
      avatarUrl: this.publicUrl('avatars', person[0]?.avatar_path),
      languages: of('language').map((row) => ({ id: row.item_id ?? '', name: row.name ?? '', level: row.level ?? '', isSignLanguage: row.is_sign_language === true })),
      specialties: of('specialty').map((row) => ({ id: row.item_id ?? '', name: row.name ?? '' })),
      services: of('service').filter((row) => row.link_active && row.catalog_active).map((row) => ({
        id: row.link_id ?? '', title: row.name ?? '', pricingMode: row.pricing_mode ?? 'hourly', priceAoa: Number(row.price_aoa), description: row.description,
      })),
      items, education, experiences, certifications, videos, articles, blockedDays,
      availability: [...availability].sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)),
    }
  }

  /** The catalog items of one interpreter, with names, disabled ones included (directory.profile_items). */
  async profileItems(interpreterId: string): Promise<ProfileItemRow[]> {
    return this.rows<ProfileItemRow>(this.from('directory', 'profile_items').select('*').eq('interpreter_id', interpreterId).order('sort'), 'directory.profile_items')
  }

  async article(interpreterSlug: string, articleSlug: string): Promise<{ article: ArticleRow; author: string; authorSlug: string } | null> {
    const details = await this.details({ slug: interpreterSlug })
    const article = details?.articles.find((row) => row.slug === articleSlug && row.status === 'published')
    return details && article ? { article, author: details.fullName, authorSlug: details.profile.slug } : null
  }

  // Favorites (R-DIR-10) ----------------------------------------------------------------------
  async favorites(): Promise<ListingRow[]> {
    const marked = await this.rows<FavoriteRow>(this.from('directory', 'favorites').select('*').order('created_at', { ascending: false }), 'directory.favorites')
    if (marked.length === 0) return []
    const listed = await this.rows<ListingRow>(this.from('directory', 'public_listing').select('*').in('account_id', marked.map((row) => row.interpreter_id)), 'directory.public_listing')
    const byId = new Map(listed.map((row) => [row.account_id, row]))
    return marked.flatMap((row) => byId.get(row.interpreter_id) ?? [])
  }

  async favoriteIds(): Promise<Set<string>> {
    const marked = await this.rows<FavoriteRow>(this.from('directory', 'favorites').select('interpreter_id'), 'directory.favorites')
    return new Set(marked.map((row) => row.interpreter_id))
  }

  async setFavorite(accountId: string, interpreterId: string, favorite: boolean): Promise<void> {
    const request = favorite
      ? this.from('directory', 'favorites').insert({ requester_account_id: accountId, interpreter_id: interpreterId })
      : this.from('directory', 'favorites').delete().eq('requester_account_id', accountId).eq('interpreter_id', interpreterId)
    const { error } = await request
    if (error && !(favorite && error.code === '23505')) throw translatePostgrestError(error, 'directory.favorites')
  }

  // The interpreter's own profile ---------------------------------------------------------------
  async myStatus(): Promise<ProfileStatusRow | null> {
    const rows = await this.rows<ProfileStatusRow>(this.from('directory', 'my_profile_status').select('*'), 'directory.my_profile_status')
    return rows[0] ?? null
  }

  async updateProfile(accountId: string, values: Partial<InterpreterProfileRow>): Promise<void> {
    await this.changed(this.from('identity', 'interpreter_profiles').update(values).eq('account_id', accountId).select('account_id'), 'identity.interpreter_profiles')
  }

  async updateAvatar(accountId: string, file: File): Promise<string> {
    const path = `${accountId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
    await this.upload('avatars', path, file, 'a fotografia tem de ser JPG, PNG ou WebP, até 2 MB')
    await this.changed(this.from('identity', 'profiles').update({ avatar_path: path }).eq('id', accountId).select('id'), 'identity.profiles')
    return path
  }

  async uploadCover(accountId: string, file: File): Promise<string> {
    const path = `${accountId}/covers/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`
    await this.upload('interpreter-media', path, file, 'a capa tem de ser JPG, PNG ou WebP, até 5 MB')
    return path
  }

  async insertOwn(table: OwnTable | 'interpreter_languages' | 'interpreter_specialties' | 'interpreter_services', values: Record<string, unknown>): Promise<void> {
    const { error } = await this.from('directory', table).insert(values)
    if (error) throw translatePostgrestError(error, `directory.${table}`)
  }

  async updateOwn(table: OwnTable | 'interpreter_services', id: string, values: Record<string, unknown>): Promise<void> {
    await this.changed(this.from('directory', table).update(values).eq('id', id).select('id'), `directory.${table}`)
  }

  async updateLanguageLevel(accountId: string, languageId: string, level: string): Promise<void> {
    await this.changed(this.from('directory', 'interpreter_languages').update({ level }).eq('interpreter_id', accountId).eq('language_id', languageId).select('language_id'), 'directory.interpreter_languages')
  }

  async deleteOwn(table: OwnTable | 'interpreter_services', id: string): Promise<void> {
    await this.changed(this.from('directory', table).delete().eq('id', id).select('id'), `directory.${table}`)
  }

  async deleteLink(table: 'interpreter_languages' | 'interpreter_specialties', accountId: string, itemId: string): Promise<void> {
    const column = table === 'interpreter_languages' ? 'language_id' : 'specialty_id'
    const { error } = await this.from('directory', table).delete().eq('interpreter_id', accountId).eq(column, itemId)
    if (error) throw translatePostgrestError(error, `directory.${table}`)
  }

  async ownRows<T>(table: OwnTable | 'availability_exceptions', accountId: string, order: string): Promise<T[]> {
    return this.rows<T>(this.from('directory', table).select('*').eq('interpreter_id', accountId).order(order), `directory.${table}`)
  }
}

/**
 * Storage refused the file. The bucket holds the limits (supabase/config.toml, AD-022); the
 * message is the reason of FILE_INVALID, in Portuguese, the cause keeps what Storage said.
 */
export class FileRefused extends Error {}
