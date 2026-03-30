// components/LoadingSpinner.tsx

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center w-full h-screen">
      <div className="relative">
        
        <div className="absolute inset-0 rounded-full blur-xl bg-linear-to-tr from-blue-500 to-purple-500 opacity-40 animate-pulse"></div>
        
        <div className="relative w-16 h-16 animate-spin rounded-full bg-linear-to-tr from-blue-500 via-purple-500 to-transparent p-0.75">
          
          <div className="h-full w-full rounded-full"></div>
          
        </div>

      </div>
    </div>
  );
}