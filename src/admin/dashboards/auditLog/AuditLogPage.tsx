import { useState } from 'react';
import { type AuthUser } from 'wasp/auth';
import { getAdminAuditLog, getAuditLogEntityTypes, useQuery } from 'wasp/client/operations';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import Breadcrumb from '../../layout/Breadcrumb';
import DefaultLayout from '../../layout/DefaultLayout';
import LoadingSpinner from '../../layout/LoadingSpinner';

const PAGE_SIZE = 50;
const ALL_ENTITY_TYPES = '__all__';

function AuditLogPage({ user }: { user: AuthUser }) {
  const [skip, setSkip] = useState(0);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const { data: entityTypes } = useQuery(getAuditLogEntityTypes);
  const { data: entries, isLoading } = useQuery(getAdminAuditLog, {
    skip,
    take: PAGE_SIZE,
    ...(entityType ? { entityType } : {}),
    ...(entityId.trim() ? { entityId: entityId.trim() } : {}),
  });

  function changeEntityType(value: string) {
    setEntityType(value === ALL_ENTITY_TYPES ? '' : value);
    setSkip(0);
  }

  function changeEntityId(value: string) {
    setEntityId(value);
    setSkip(0);
  }

  return (
    <DefaultLayout user={user}>
      <Breadcrumb pageName='Audit Log' />

      <div className='mb-4 flex flex-wrap items-center gap-3'>
        <Select value={entityType || ALL_ENTITY_TYPES} onValueChange={changeEntityType}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='All entity types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_ENTITY_TYPES}>All entity types</SelectItem>
            {entityTypes?.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={entityId}
          onChange={(e) => changeEntityId(e.currentTarget.value)}
          placeholder='Filter by entity id…'
          className='w-64'
        />
      </div>

      <div className='rounded-2xl border border-border bg-card shadow-xs'>
        {isLoading && (
          <div className='p-6'>
            <LoadingSpinner />
          </div>
        )}

        {!isLoading && (!entries || entries.length === 0) && (
          <p className='p-6 text-sm text-muted-foreground'>
            {entityType || entityId
              ? 'No admin actions match these filters.'
              : 'No admin actions recorded yet.'}
          </p>
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
