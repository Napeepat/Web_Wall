// 
import Logo                     from '@/app/components/logo'
import Components_profile       from '@/app/components/navbar/components_profile'

export default function Navbar() {

  return (
    <>
      <header className="sticky top-0 z-50 bg-background shadow-sm" style={{ height: "var(--navbar-height)" }}  >
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
            
          <Logo />
          
          <Components_profile />

        </div>
      </header>
    </>
  );
}

