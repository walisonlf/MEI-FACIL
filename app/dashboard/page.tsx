// This is the new page for the dashboard
import MeiDashboardComponent from "@/components/mei-dashboard"
import type { UserPlan } from "@/lib/types"

export default function DashboardPage() {
  // In a real app, you'd fetch the authenticated user's data here.
  // This would include their plan and role (e.g., admin).
  // const user = await getCurrentUser(); // Hypothetical function
  // const userPlan: UserPlan = user?.plan || 'free';
  // const isAdmin: boolean = user?.role === 'admin';

  // For simulation purposes:
  // Change this to 'paid' or 'free' to test different plan views
  const simulatedUserPlan: UserPlan = "paid" // Default to paid to show admin features
  const isAdminUser: boolean = true // Grant admin access for your account

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <MeiDashboardComponent userPlan={simulatedUserPlan} isAdmin={isAdminUser} />
    </div>
  )
}
