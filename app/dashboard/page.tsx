// Server component wrapper — forces dynamic rendering so env vars are available at runtime
export const dynamic = 'force-dynamic';

import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return <DashboardClient />;
}
