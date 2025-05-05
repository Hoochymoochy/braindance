// app/host/[id]/dashboard/layout.tsx
import { ReactNode } from "react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

interface Props {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: Props) {
  const token = (await cookies()).get("token")?.value;
  console.log(token);
  console.log(process.env.JWT_SECRET);
  if (!token) redirect("/host/login");

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return <>{children}</>;
  } catch {
    redirect("/host/login");
  }
}
