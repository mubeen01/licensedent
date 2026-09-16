import { type PageViewSource } from 'wasp/entities';

const SourcesTable = ({ sources }: { sources: PageViewSource[] | undefined }) => {
  return (
    <div className='rounded-2xl border border-border bg-card px-5 pt-6 pb-2.5 shadow-xs sm:px-7.5 xl:pb-1'>
      <h4 className='mb-6 text-lg font-bold text-foreground'>Top Sources</h4>

      <div className='flex flex-col overflow-hidden rounded-xl'>
        <div className='grid grid-cols-3 bg-muted'>
          <div className='p-2.5 xl:p-5'>
            <h5 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground xsm:text-sm'>Source</h5>
          </div>
          <div className='p-2.5 text-center xl:p-5'>
            <h5 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground xsm:text-sm'>Visitors</h5>
          </div>
          <div className='hidden p-2.5 text-center sm:block xl:p-5'>
            <h5 className='text-xs font-semibold uppercase tracking-wide text-muted-foreground xsm:text-sm'>Sales</h5>
          </div>
        </div>

        {sources && sources.length > 0 ? (
          sources.map((source) => (
            <div key={source.name} className='grid grid-cols-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors'>
              <div className='flex items-center gap-3 p-2.5 xl:p-5'>
                <p className='text-foreground'>{source.name}</p>
              </div>

              <div className='flex items-center justify-center p-2.5 xl:p-5'>
                <p className='text-foreground'>{source.visitors}</p>
              </div>

              <div className='hidden items-center justify-center p-2.5 sm:flex xl:p-5'>
                <p className='text-foreground'>--</p>
              </div>
            </div>
          ))
        ) : (
          <div className='flex items-center justify-center p-2.5 xl:p-5'>
            <p className='text-muted-foreground'>No data to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcesTable;
