import { requireUserId } from "@/app/lib/auth/session";
import { UserProvider } from "@/app/components/profile/UserProvider";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await requireUserId();
  return <UserProvider userId={userId}>{children}</UserProvider>;
}
