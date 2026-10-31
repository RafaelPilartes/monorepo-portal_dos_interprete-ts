import { useState } from 'react'
import { hhmm, WEEKDAYS } from '@portal-dos-interpretes/features/directory/labels'
import { formatDate, luandaDay } from '@portal-dos-interpretes/i18n'
import { Alert, AlertDescription } from '@portal-dos-interpretes/ui/components/alert'
import { Button } from '@portal-dos-interpretes/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@portal-dos-interpretes/ui/components/card'
import { Input } from '@portal-dos-interpretes/ui/components/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal-dos-interpretes/ui/components/select'
import { Info, Trash2 } from 'lucide-react'
import { Field, ProfileShell, type MyProfile } from '@/components/profile/ProfileShell'
import { failureOf, useProfileWrite } from '@/viewModels/profile.viewmodel'

// /availability (R-DIR-08): weekly hours in Luanda time and blocked days. Indicative: a request
// outside them is allowed, with a warning; what really blocks is an overlap (R-REQ-05).

// Monday first, as people read a week.
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

function WeeklyRules({ profile }: { profile: MyProfile }) {
  const [form, setForm] = useState({ weekday: '1', start: '09:00', end: '17:00' })
  const add = useProfileWrite((repository, accountId, input: typeof form) =>
    repository.insertOwn('availability_rules', { interpreter_id: accountId, weekday: Number(input.weekday), start_time: input.start, end_time: input.end }), 'Horário acrescentado.')
  const remove = useProfileWrite((repository, _accountId, id: string) => repository.deleteOwn('availability_rules', id), 'Horário removido.')
  const failure = add.isError ? failureOf(add.error) : null
  const rules = profile.details.availability

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário semanal</CardTitle>
        <CardDescription>Em hora de Luanda. Podes ter mais de um intervalo no mesmo dia.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {rules.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não indicaste o teu horário.</p> : (
          <ul className="divide-y">
            {WEEK_ORDER.flatMap((day) => rules.filter((rule) => rule.weekday === day)).map((rule) => (
              <li key={rule.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-24 font-medium">{WEEKDAYS[rule.weekday]}</span>
                <span className="flex-1 tabular-nums">{hhmm(rule.start_time)}–{hhmm(rule.end_time)}</span>
                <Button variant="ghost" size="icon" aria-label={`Remover ${WEEKDAYS[rule.weekday]} ${hhmm(rule.start_time)}`} disabled={remove.isPending} onClick={() => remove.mutate(rule.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); add.mutate(form) }}>
          <Field id="rule-weekday" label="Dia">
            <Select value={form.weekday} onValueChange={(value) => setForm((current) => ({ ...current, weekday: value }))}>
              <SelectTrigger id="rule-weekday" className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{WEEK_ORDER.map((day) => <SelectItem key={day} value={String(day)}>{WEEKDAYS[day]}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field id="rule-start" label="Das"><Input id="rule-start" type="time" className="w-32" value={form.start} onChange={(e) => setForm((current) => ({ ...current, start: e.target.value }))} /></Field>
          <Field id="rule-end" label="Às"><Input id="rule-end" type="time" className="w-32" value={form.end} onChange={(e) => setForm((current) => ({ ...current, end: e.target.value }))} /></Field>
          <Button type="submit" variant="outline" disabled={add.isPending}>Acrescentar</Button>
        </form>
        {failure && <p role="alert" className="text-sm text-destructive">{Object.keys(failure.fields).length > 0 ? 'A hora de fim tem de ser depois da hora de início.' : failure.message}</p>}
      </CardContent>
    </Card>
  )
}

function BlockedDays({ profile }: { profile: MyProfile }) {
  const today = luandaDay(new Date())
  const [form, setForm] = useState({ day: '', note: '' })
  const add = useProfileWrite((repository, accountId, input: typeof form) =>
    repository.insertOwn('availability_exceptions', { interpreter_id: accountId, day: input.day, note: input.note.trim() || null }), 'Dia bloqueado.')
  const remove = useProfileWrite((repository, _accountId, id: string) => repository.deleteOwn('availability_exceptions', id), 'Dia desbloqueado.')
  const failure = add.isError ? failureOf(add.error) : null
  const upcoming = profile.exceptions.filter((row) => row.day >= today)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dias bloqueados</CardTitle>
        <CardDescription>Férias, compromissos ou outros dias em que não trabalhas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum dia bloqueado.</p> : (
          <ul className="divide-y">
            {upcoming.map((row) => (
              <li key={row.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="w-28 font-medium tabular-nums">{formatDate(row.day)}</span>
                <span className="flex-1 text-muted-foreground">{row.note}</span>
                <Button variant="ghost" size="icon" aria-label={`Desbloquear ${formatDate(row.day)}`} disabled={remove.isPending} onClick={() => remove.mutate(row.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); if (form.day) add.mutate(form, { onSuccess: () => setForm({ day: '', note: '' }) }) }}>
          <Field id="blocked-day" label="Dia"><Input id="blocked-day" type="date" min={today} className="w-44" value={form.day} onChange={(e) => setForm((current) => ({ ...current, day: e.target.value }))} /></Field>
          <Field id="blocked-note" label="Nota (opcional)"><Input id="blocked-note" className="w-56" value={form.note} onChange={(e) => setForm((current) => ({ ...current, note: e.target.value }))} /></Field>
          <Button type="submit" variant="outline" disabled={!form.day || add.isPending}>Bloquear</Button>
        </form>
        {failure && <p role="alert" className="text-sm text-destructive">{failure.fields.day ?? failure.message}</p>}
      </CardContent>
    </Card>
  )
}

export default function InterpreterAvailability() {
  return (
    <ProfileShell title="Disponibilidade" description="Quando costumas estar disponível." back={false}>
      {(profile) => (
        <div className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>A disponibilidade é indicativa: podes receber pedidos fora dela, com aviso. O que impede de verdade é teres outro serviço à mesma hora.</AlertDescription>
          </Alert>
          <WeeklyRules profile={profile} />
          <BlockedDays profile={profile} />
        </div>
      )}
    </ProfileShell>
  )
}
