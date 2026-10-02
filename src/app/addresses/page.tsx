'use client';

import { useState } from 'react';
import { Home, MapPinned, Pencil, Plus, RefreshCw, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Address, AddressInput } from '@/lib/types';
import { useT } from '@/i18n';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader, PageShell } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressForm } from '@/components/customer/address-form';
import { errorMessage, useApiQuery } from '@/components/customer/use-api';
import { useRequireCustomer } from '@/components/customer/use-require-customer';
import { CustomerOnly } from '@/components/customer/wrong-role';

function toInput(a: Address, patch: Partial<AddressInput> = {}): AddressInput {
  return {
    label: a.label,
    address_line_1: a.address_line_1,
    ...(a.address_line_2 ? { address_line_2: a.address_line_2 } : {}),
    city: a.city,
    state: a.state,
    pin_code: a.pin_code,
    location_coordinates: {
      lat: Number(a.location_coordinates.lat),
      lng: Number(a.location_coordinates.lng),
    },
    is_default: a.is_default,
    ...patch,
  };
}

export default function AddressesPage() {
  const { ready, wrongRole, token } = useRequireCustomer();
  const t = useT('customer');
  const tc = useT('common');
  const { data, loading, error, reload } = useApiQuery<Address[]>(ready ? '/addresses' : null, { token });
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (wrongRole) return <CustomerOnly />;

  const list = [...(data ?? [])].sort((a, b) => Number(b.is_default) - Number(a.is_default));

  const makeDefault = async (a: Address) => {
    setBusyId(a.id);
    try {
      await api(`/addresses/${a.id}`, { method: 'PUT', token, body: toInput(a, { is_default: true }) });
      toast.success(t('addresses.madeDefault', { label: a.label }));
      reload();
    } catch (e) {
      toast.error(errorMessage(e, t('addresses.updateError')));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    const a = deleting;
    setBusyId(a.id);
    try {
      await api(`/addresses/${a.id}`, { method: 'DELETE', token });
      toast.success(t('addresses.removed'));
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e, t('addresses.removeError')));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title={t('addresses.title')}
        description={t('addresses.description')}
        actions={
          list.length > 0 ? (
            <Button onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" />
              {t('addresses.add')}
            </Button>
          ) : undefined
        }
      />

      {!ready || loading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={RefreshCw}
          title={t('addresses.loadError')}
          action={<Button onClick={reload}>{tc('action.retry')}</Button>}
        >
          {error}
        </EmptyState>
      ) : list.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title={t('addresses.emptyTitle')}
          action={
            <Button onClick={() => setEditing('new')}>
              <Plus aria-hidden="true" />
              {t('addresses.addHome')}
            </Button>
          }
        >
          {t('addresses.emptyBody')}
        </EmptyState>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="flex flex-col rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="flex min-w-0 items-center gap-2 font-sans text-lg font-medium text-foreground">
                  <Home className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 break-words">{a.label}</span>
                </h2>
                {a.is_default && (
                  <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 text-xs font-medium text-accent-foreground">
                    <Star className="size-3 fill-current" aria-hidden="true" />
                    {t('addresses.default')}
                  </span>
                )}
              </div>
              <address className="mt-2 text-sm text-muted-foreground not-italic">
                {a.address_line_1}
                {a.address_line_2 && (
                  <>
                    <br />
                    {a.address_line_2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.pin_code}
              </address>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setEditing(a)} aria-label={t('addresses.editAria', { label: a.label })}>
                  <Pencil aria-hidden="true" />
                  {tc('action.edit')}
                </Button>
                {!a.is_default && (
                  <Button variant="ghost" size="sm" onClick={() => makeDefault(a)} disabled={busyId === a.id}>
                    {t('addresses.makeDefault')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleting(a)}
                  aria-label={t('addresses.deleteAria', { label: a.label })}
                >
                  <Trash2 aria-hidden="true" />
                  {tc('action.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing === 'new' ? t('addresses.dialogAdd') : t('addresses.dialogEdit')}
            </DialogTitle>
            <DialogDescription>{t('addresses.dialogDesc')}</DialogDescription>
          </DialogHeader>
          {editing && (
            <AddressForm
              key={editing === 'new' ? 'new' : editing.id}
              initial={editing === 'new' ? null : editing}
              defaultChecked={list.length === 0}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('addresses.deleteTitle', { label: deleting?.label ?? '' })}</DialogTitle>
            <DialogDescription>{t('addresses.deleteDesc')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              {t('addresses.keep')}
            </Button>
            <Button variant="destructive" onClick={remove} disabled={!!deleting && busyId === deleting.id}>
              {t('addresses.deleteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
