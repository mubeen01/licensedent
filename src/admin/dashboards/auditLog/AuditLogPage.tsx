import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import { getAdminAuditLog, useQuery } from 'wasp/client/operations';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

const PAGE_SIZE = 50;

function AuditLogPage({ user }: { user: AuthUser }) {
  const [skip, setSkip] = useState(0);
  const { data: entries, isLoading } = useQuery(getAdminAuditLog, { skip, take: PAGE_SIZE });

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Audit Log' />

      <div className='rounded-2xl border border-border bg-card shadow-sm'>
        {isLoading && (
          <div className='p-6'>
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && (!entries || entries.length === 0) && (
          <p className='p-6 text-sm text-muted-foreground'>No admin actions recorded yet.</p>
        )}

        {!isLoading && entries && entries.length > 0 && (
          <ul className='divide-y divide-border'>
            {entries.map((entry) => (
              <li key={entry.id} className='flex flex-col gap-1 p-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <p className='text-sm font-medium text-foreground'>
                    <span className='font-mono text-xs text-muted-foreground mr-2'>
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                    {entry.admin.username ?? entry.admin.email ?? entry.admin.id}
                    <span className='text-muted-foreground'> — {entry.action}</span>
                  </p>
                  <span className='text-xs text-muted-foreground'>
                    {entry.entityType}:{entry.entityId}
                  </span>
                </div>
                {entry.details !== null && entry.details !== undefined && (
                  <details className='text-xs text-muted-foreground'>
                    <summary className='cursor-pointer select-none'>Details</summary>
                    <pre className='mt-1 whitespace-pre-wrap rounded bg-muted/40 p-2'>
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {entries && entries.length > 0 && (
        <div className='flex items-center justify-between pt-4'>
          <button
            className='text-sm text-muted-foreground hover:text-foreground disabled:opacity-40'
            disabled={skip === 0}
            onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
          >
            &larr; Previous
          </button>
          <button
            className='text-sm text-muted-foreground hover:text-foreground disabled:opacity-40'
            disabled={entries.length < PAGE_SIZE}
            onClick={() => setSkip((s) => s + PAGE_SIZE)}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </DefaultLayout>
  );
}

export default AuditLogPage;
