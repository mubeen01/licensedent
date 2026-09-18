import { type AuthUser } from 'wasp/auth';
import { Mail, User as UserIcon } from 'lucide-react';
import DashboardLayout from '../dashboard/DashboardLayout';
import { ExamAccessSummary } from '../dashboard/ExamAccessSummary';
import { Separator } from '../components/ui/separator';
import ContactSupportCard from './ContactSupportCard';

export default function AccountPage({ user }: { user: AuthUser }) {
  return (
    <DashboardLayout user={user} pageTitle='Account'>
      <div className='max-w-3xl mx-auto p-6'>
        <div className='card-elevated overflow-hidden'>
          <div className='bg-gradient-to-r from-primary via-primary to-secondary px-6 py-5'>
            <h2 className='text-xl font-black text-primary-foreground flex items-center gap-3'>
              <div className='p-2 bg-white/20 rounded-xl'>
                <UserIcon className='w-5 h-5' />
              </div>
              Account Information
            </h2>
          </div>
          <div className='space-y-0'>
            {!!user.email && (
              <div className='py-5 px-6'>
                <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                  <dt className='text-sm font-bold text-muted-foreground flex items-center gap-2'>
                    <Mail className='w-4 h-4' /> Email address
                  </dt>
                  <dd className='mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0 font-medium'>{user.email}</dd>
                </div>
              </div>
            )}
            {!!user.username && (
              <>
                <Separator />
                <div className='py-5 px-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                    <dt className='text-sm font-bold text-muted-foreground'>Username</dt>
                    <dd className='mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0 font-medium'>
                      {user.username}
                    </dd>
                  </div>
                </div>
              </>
            )}
            <Separator />
            <div className='py-5 px-6'>
              <div className='grid grid-cols-1 sm:grid-cols-3 sm:gap-4'>
                <dt className='text-sm font-bold text-muted-foreground'>Exam access</dt>
                <ExamAccessSummary />
              </div>
            </div>
          </div>
        </div>

        <div className='mt-6'>
          <ContactSupportCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
