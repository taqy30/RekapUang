import { Skeleton } from "@/components/ui/skeleton";
import { APP_NAME } from "@/lib/brand";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="border-b bg-background px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <p className="sr-only">Memuat {APP_NAME}</p>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </main>
    </div>
  );
}
