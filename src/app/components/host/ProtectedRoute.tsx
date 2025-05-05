// components/Protected.tsx
import { ReactNode } from "react";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";

interface ProtectedProps {
  children: ReactNode;
}

export default async function Protected({ children }: ProtectedProps) {
  const cookieStore = cookies();
  const token = (await cookieStore).get("auth_token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return <>{children}</>;
  } catch {
    redirect("/login");
  }
}
