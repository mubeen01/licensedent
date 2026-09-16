import { Ban, ChevronLeft, ChevronRight, CircleCheck, Download, Search, Settings2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from 'wasp/client/auth';
import { getPaginatedUsers, toggleUserDisabled, updateIsUserAdminById, useQuery } from 'wasp/client/operations';
import { type User } from 'wasp/entities';
import useDebounce from '../../../client/hooks/useDebounce';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { cn, formatRelativeTime } from '../../../lib/utils';
import { SubscriptionStatus } from '../../../payment/plans';
import LoadingSpinner from '../../layout/LoadingSpinner';
import InviteUserSheet from './InviteUserSheet';
import UserManageSheet, { type ManagedUser } from './UserManageSheet';
import UsersOverviewStats from './UsersOverviewStats';

type SortBy = 'username' | 'createdAt' | 'lastLoginAt';
const SORT_OPTIONS: { value: `${SortBy}:${'asc' | 'desc'}`; label: string }[] = [
  { value: 'username:asc', label: 'Name (A–Z)' },
  { value: 'createdAt:desc', label: 'Newest signups' },
  { value: 'createdAt:asc', label: 'Oldest signups' },
  { value: 'lastLoginAt:desc', label: 'Recently active' },
];

// Real access, computed from this user's Subscription rows -- NOT the legacy
// user.subscriptionStatus field (that's unused OpenSaaS recurring-subscription
// boilerplate; this app sells fixed-duration exam-access passes instead, see
// the Subscription model in schema.prisma).
function AccessBadge({ subscriptions }: { subscriptions: { durationDays: number; createdAt: string | Date }[] }) {
  const now = Date.now();
  const activeCount = subscriptions.filter(
    (s) => new Date(s.createdAt).getTime() + s.durationDays * 24 * 60 * 60 * 1000 > now
  ).length;

  if (subscriptions.length === 0) {
    return (
      <span className='inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground'>
        No access
      </span>
    );
  }
  if (activeCount === 0) {
    return (
      <span className='inline-flex rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning'>
        Expired
      </span>
    );
  }
  return (
    <span className='inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success'>
      {activeCount} active pass{activeCount === 1 ? '' : 'es'}
    </span>
  );
}

function UserAvatar({ email, username }: { email: string | null; username: string | null }) {
  const source = username || email || '?';
  const initials = source.slice(0, 2).toUpperCase();
  return (
    <span className='flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white shadow-sm'>
      {initials}
    </span>
  );
}

function AdminSwitch({ id, isAdmin }: Pick<User, 'id' | 'isAdmin'>) {
  const { data: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === id;

  return (
    <Switch
      checked={isAdmin}
      onCheckedChange={(value) => updateIsUserAdminById({ id: id, isAdmin: value })}
      disabled={isCurrentUser}
    />
  );
}

const UsersTable = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [emailFilter, setEmailFilter] = useState<string | undefined>(undefined);
  const [isAdminFilter, setIsAdminFilter] = useState<boolean | undefined>(undefined);
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<Array<SubscriptionStatus | null>>(
    []
  );
  const [sort, setSort] = useState<`${SortBy}:${'asc' | 'desc'}`>('username:asc');
  const [sortBy, sortDir] = sort.split(':') as [SortBy, 'asc' | 'desc'];

  const debouncedEmailFilter = useDebounce(emailFilter, 300);

  const skipPages = currentPage - 1;

  const { data, isLoading, refetch } = useQuery(getPaginatedUsers, {
    skipPages,
    filter: {
      ...(debouncedEmailFilter && { emailContains: debouncedEmailFilter }),
      ...(isAdminFilter !== undefined && { isAdmin: isAdminFilter }),
      ...(subscriptionStatusFilter.length > 0 && { subscriptionStatusIn: subscriptionStatusFilter }),
    },
    sortBy,
    sortDir,
  });

  useEffect(
    function backToPageOne() {
      setCurrentPage(1);
    },
    [debouncedEmailFilter, subscriptionStatusFilter, isAdminFilter, sort]
  );

  const handleStatusToggle = (status: SubscriptionStatus | null) => {
    setSubscriptionStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const clearAllStatusFilters = () => {
    setSubscriptionStatusFilter([]);
  };

  const hasActiveFilters = subscriptionStatusFilter && subscriptionStatusFilter.length > 0;

  const [manageUser, setManageUser] = useState<ManagedUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function openManage(user: ManagedUser) {
    setManageUser(user);
    setSheetOpen(true);
  }

  function exportCsv() {
    if (!data?.users?.length) return;
    const header = ['Email', 'Username', 'Admin', 'Disabled', 'Active passes', 'Last active'];
    const now = Date.now();
    const rows = data.users.map((u) => {
      const activeCount = u.subscriptions.filter(
        (s) => new Date(s.createdAt).getTime() + s.durationDays * 24 * 60 * 60 * 1000 > now
      ).length;
      return [
        u.email ?? '',
        u.username ?? '',
        u.isAdmin,
        u.isDisabled,
        activeCount,
        u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : '',
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-page-${currentPage}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Bulk selection -- scoped to the current page, cleared on any page/filter change.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const pageUsers = data?.users ?? [];
  const allOnPageSelected = pageUsers.length > 0 && pageUsers.every((u) => selectedIds.has(u.id));

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, debouncedEmailFilter, subscriptionStatusFilter, isAdminFilter]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    setSelectedIds((prev) => {
      if (allOnPageSelected) return new Set();
      return new Set(pageUsers.map((u) => u.id));
    });
  }

  // Any failures (e.g. trying to disable your own account, caught server-side)
  // are swallowed per-user so one bad row doesn't block the rest of the batch.
  async function bulkSetDisabled(isDisabled: boolean) {
    const ids = [...selectedIds];
    setIsBulkActing(true);
    try {
      await Promise.all(ids.map((id) => toggleUserDisabled({ id, isDisabled }).catch(() => null)));
      setSelectedIds(new Set());
      refetch();
    } finally {
      setIsBulkActing(false);
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <UsersOverviewStats />

      <div className='flex items-center justify-end gap-2'>
        <Button size='sm' variant='outline' onClick={exportCsv} disabled={!data?.users?.length}>
          <Download className='mr-1.5 h-4 w-4' />
          Export CSV
        </Button>
        <InviteUserSheet onInvited={refetch} />
      </div>

      <div className='rounded-2xl border border-border bg-card shadow-sm overflow-hidden'>
        <div className='flex flex-col gap-3 w-full p-5 bg-muted/40 border-b border-border'>
          <div className='flex flex-wrap items-center gap-2.5'>
            <div className='relative flex-1 min-w-[220px]'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                type='text'
                id='email-filter'
                placeholder='Search by email or username…'
                className='pl-9'
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setEmailFilter(value === '' ? undefined : value);
                }}
              />
            </div>

            <Select>
              <SelectTrigger className='w-auto min-w-[180px] rounded-full'>
                <SelectValue
                  placeholder={
                    subscriptionStatusFilter.length === 0
                      ? 'All subscriptions'
                      : `${subscriptionStatusFilter.length} status filter${subscriptionStatusFilter.length === 1 ? '' : 's'}`
                  }
                />
              </SelectTrigger>
              <SelectContent className='w-[300px]'>
                <div className='p-2'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium'>Subscription Status</span>
                    {subscriptionStatusFilter.length > 0 && (
                      <button
                        onClick={clearAllStatusFilters}
                        className='text-xs text-muted-foreground hover:text-foreground'
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='all-statuses'
                        checked={subscriptionStatusFilter.length === 0}
                        onCheckedChange={() => clearAllStatusFilters()}
                      />
                      <Label
                        htmlFor='all-statuses'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        All Statuses
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='has-not-subscribed'
                        checked={subscriptionStatusFilter.includes(null)}
                        onCheckedChange={() => handleStatusToggle(null)}
                      />
                      <Label
                        htmlFor='has-not-subscribed'
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Has Not Subscribed
                      </Label>
                    </div>
                    {Object.values(SubscriptionStatus).map((status) => (
                      <div key={status} className='flex items-center space-x-2'>
                        <Checkbox
                          id={status}
                          checked={subscriptionStatusFilter.includes(status)}
                          onCheckedChange={() => handleStatusToggle(status)}
                        />
                        <Label
                          htmlFor={status}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                        >
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => {
                if (value === 'both') {
                  setIsAdminFilter(undefined);
                } else {
                  setIsAdminFilter(value === 'true');
                }
              }}
            >
              <SelectTrigger className='w-auto min-w-[140px] rounded-full'>
                <SelectValue placeholder='All roles' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='both'>All roles</SelectItem>
                <SelectItem value='true'>Admins only</SelectItem>
                <SelectItem value='false'>Non-admins only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className='w-auto min-w-[170px] rounded-full'>
                <SelectValue placeholder='Sort by' />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {data?.totalPages && data.totalPages > 1 && (
              <div className='ml-auto flex items-center gap-2 text-sm text-muted-foreground'>
                <span>Page</span>
                <Input
                  type='number'
                  min={1}
                  defaultValue={currentPage}
                  max={data?.totalPages}
                  onChange={(e) => {
                    const value = parseInt(e.currentTarget.value);
                    if (data?.totalPages && value <= data?.totalPages && value > 0) {
                      setCurrentPage(value);
                    }
                  }}
                  className='w-16 rounded-full text-center'
                />
                <span>of {data?.totalPages}</span>
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs font-medium text-muted-foreground'>Active:</span>
              {subscriptionStatusFilter.map((status) => (
                <button
                  key={status ?? 'null'}
                  onClick={() => handleStatusToggle(status)}
                  className='inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20'
                >
                  {status ?? 'Has Not Subscribed'}
                  <X className='h-3 w-3' />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className='flex items-center gap-3 border-b border-border bg-primary/5 py-2.5 px-4 md:px-6'>
            <span className='text-sm font-medium text-foreground'>{selectedIds.size} selected</span>
            <div className='ml-auto flex items-center gap-2'>
              <Button size='sm' variant='outline' disabled={isBulkActing} onClick={() => bulkSetDisabled(false)}>
                <CircleCheck className='mr-1.5 h-3.5 w-3.5' />
                Enable
              </Button>
              <Button size='sm' variant='outline' disabled={isBulkActing} onClick={() => bulkSetDisabled(true)}>
                <Ban className='mr-1.5 h-3.5 w-3.5' />
                Disable
              </Button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className='text-xs text-muted-foreground hover:text-foreground'
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className='grid grid-cols-10 border-b border-border bg-muted/30 py-3.5 px-4 md:px-6'>
          <div className='col-span-3 flex items-center gap-3'>
            <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAllOnPage} aria-label='Select all' />
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>User</p>
          </div>
          <div className='col-span-2 flex items-center'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Access</p>
          </div>
          <div className='col-span-2 flex items-center'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Last active</p>
          </div>
          <div className='col-span-2 flex items-center'>
            <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>Admin</p>
          </div>
          <div className='col-span-1 flex items-center'></div>
        </div>
        {isLoading && <LoadingSpinner />}
        {!!data?.users &&
          data?.users?.length > 0 &&
          data.users.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate(`/admin/users/${user.id}`)}
              className={cn(
                'grid grid-cols-10 gap-4 py-4 px-4 md:px-6 border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors cursor-pointer',
                user.isDisabled && 'opacity-50'
              )}
            >
              <div className='col-span-3 flex items-center gap-3'>
                <span onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onCheckedChange={() => toggleSelected(user.id)}
                    aria-label='Select user'
                  />
                </span>
                <UserAvatar email={user.email} username={user.username} />
                <div className='flex flex-col min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <p className='text-sm font-medium text-foreground truncate'>{user.email}</p>
                    {user.isDisabled && (
                      <span className='flex-none rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive'>
                        Disabled
                      </span>
                    )}
                  </div>
                  {user.username && <p className='text-xs text-muted-foreground truncate'>{user.username}</p>}
                  {user.tags.length > 0 && (
                    <div className='mt-1 flex flex-wrap gap-1'>
                      {user.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className='rounded-full bg-secondary/10 px-1.5 py-0.5 text-[10px] font-medium text-secondary'
                        >
                          {tag}
                        </span>
                      ))}
                      {user.tags.length > 3 && (
                        <span className='text-[10px] text-muted-foreground'>+{user.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className='col-span-2 flex items-center'>
                <AccessBadge subscriptions={user.subscriptions} />
              </div>
              <div className='col-span-2 flex flex-col justify-center'>
                <p className='text-xs text-muted-foreground'>Active {formatRelativeTime(user.lastLoginAt)}</p>
                <p className='text-[11px] text-muted-foreground/70'>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className='col-span-2 flex items-center'>
                <div className='text-sm text-foreground' onClick={(e) => e.stopPropagation()}>
                  <AdminSwitch {...user} />
                </div>
              </div>
              <div className='col-span-1 flex items-center'>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openManage(user);
                  }}
                  className='flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                  aria-label='Manage user'
                >
                  <Settings2 className='h-4 w-4' />
                </button>
              </div>
            </div>
          ))}

        {data?.totalPages && data.totalPages > 1 && (
          <div className='flex items-center justify-between gap-4 px-4 md:px-6 py-3.5 border-t border-border bg-muted/20'>
            <p className='text-xs text-muted-foreground'>
              Page {currentPage} of {data.totalPages}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className='h-3.5 w-3.5' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={currentPage >= data.totalPages}
                onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
              >
                <ChevronRight className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
        )}
      </div>

      <UserManageSheet user={manageUser} open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
};

export default UsersTable;
