'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useT } from '@/i18n';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AuthUser } from '@/lib/types';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/dashboard/field';
import { errorMessage } from '@/components/dashboard/use-api';
import { ProfilePhoto } from './profile-photo';

/** Same limit as the API (POST /users/me/photo). */
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'];

/**
 * Profile photo picker: current photo as a large circle, change / remove.
 * On phones `accept="image/*"` offers the camera or the gallery. The server
 * crops, resizes and strips location data; the client only pre-checks size/type.
 */
export function PhotoPicker({ variant = 'customer', className }: { variant?: 'customer' | 'pandit'; className?: string }) {
  const t = useT('account');
  const { user, token, refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<'upload' | 'remove' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Release the local preview blob when it is replaced or the picker unmounts.
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  if (!user) return null;
  const current = user.photo_url ?? null;
  const shown = preview ?? current;

  const failure = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.status === 413) return t('photo.error.tooLarge');
      if (err.status === 422) return t('photo.error.type');
      if (err.status === 503) return t('photo.error.unavailable');
    }
    return errorMessage(err);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // choosing the same file again still fires change
    if (!file) return;
    setError(null);
    // Some Android pickers report no type; the server checks the bytes anyway.
    if (file.type && !ACCEPTED.includes(file.type.toLowerCase())) {
      setError(t('photo.error.type'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('photo.error.tooLarge'));
      return;
    }
    setPreview(URL.createObjectURL(file));
    setBusy('upload');
    try {
      const form = new FormData();
      form.append('photo', file);
      await api<AuthUser>('/users/me/photo', { method: 'POST', token, body: form });
      await refreshUser();
      toast.success(t('photo.saved'));
    } catch (err) {
      setError(failure(err));
    } finally {
      setPreview(null);
      setBusy(null);
    }
  };

  const remove = async () => {
    setError(null);
    setBusy('remove');
    try {
      await api<AuthUser>('/users/me/photo', { method: 'DELETE', token });
      await refreshUser();
      toast.success(t('photo.removed'));
    } catch (err) {
      setError(failure(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      className={className}
      title={t('photo.title')}
      description={variant === 'pandit' ? t('photo.hint.pandit') : t('photo.hint.customer')}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <span
          className={cn(
            'relative grid size-32 shrink-0 place-items-center overflow-hidden rounded-full font-heading text-4xl text-[#fbe3b6]',
            'bg-[radial-gradient(circle_at_30%_25%,#c2410c,#2a1f4a_70%)] ring-2 ring-diya/50 ring-offset-2 ring-offset-background',
          )}
        >
          <ProfilePhoto
            key={shown ?? 'none'}
            src={shown}
            px={128}
            alt={t('photo.alt', { name: user.name })}
            fallback={<span aria-hidden="true">{initials(user.name)}</span>}
          />
          {busy === 'upload' && (
            <span className="absolute inset-0 grid place-items-center bg-black/45" role="status">
              <Loader2 className="size-8 animate-spin text-white" aria-hidden="true" />
              <span className="sr-only">{t('photo.uploading')}</span>
            </span>
          )}
        </span>

        <div className="grid w-full gap-3 sm:w-auto">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={onFile}
          />
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              className="min-h-11"
              onClick={() => inputRef.current?.click()}
              disabled={!!busy}
              aria-busy={busy === 'upload'}
              aria-describedby={hintId}
            >
              {busy === 'upload' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
              {busy === 'upload' ? t('photo.uploading') : current ? t('photo.change') : t('photo.add')}
            </Button>
            {current && (
              <Button variant="outline" className="min-h-11" onClick={remove} disabled={!!busy} aria-busy={busy === 'remove'}>
                {busy === 'remove' ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                {t('photo.remove')}
              </Button>
            )}
          </div>
          <p id={hintId} className="text-center text-sm text-muted-foreground sm:text-left">
            {t('photo.rules')}
          </p>
          {error && (
            <p role="alert" className="text-center text-sm font-medium text-destructive sm:text-left">
              {error}
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}
