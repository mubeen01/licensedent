import { Link as WaspRouterLink, routes } from 'wasp/client/router';
interface BreadcrumbProps {
  pageName: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <h2 className='text-title-xl font-bold tracking-tight text-foreground'>{pageName}</h2>

      <nav>
        <ul className='flex items-center gap-1.5 text-sm text-muted-foreground'>
          <li>
            <WaspRouterLink to={routes.AdminRoute.to} className='hover:text-primary transition-colors'>
              Dashboard
            </WaspRouterLink>
          </li>
          <li>/</li>
          <li className='font-semibold text-foreground'>{pageName}</li>
        </ul>
      </nav>
    </div>
  );
};

export default Breadcrumb;
