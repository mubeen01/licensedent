import { type AuthUser } from 'wasp/auth';
import { FC, ReactNode, useState } from 'react';
import { Navigate } from 'react-router';
import { routes } from 'wasp/client/router';
import Header from './Header';
import Sidebar from './Sidebar';

interface Props {
  user: AuthUser;
  children?: ReactNode;
}

const DefaultLayout: FC<Props> = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user.isAdmin) {
    return <Navigate to={routes.LandingPageRoute.to} replace />;
  }

  return (
    <div className='bg-muted/30 text-foreground'>
      <div className='flex h-screen overflow-hidden'>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className='relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden'>
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user} />
          <main>
            <div className='mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6 2xl:p-10'>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
