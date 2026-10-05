import { loginUser } from "@/app/lib/auth/login";

jest.mock("@/app/lib/utils/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

import { supabase } from "@/app/lib/utils/supabaseClient";

describe("loginUser", () => {
  const mockEmail = "test@example.com";
  const mockPassword = "password123";

  it("returns the user on successful login", async () => {
    const mockUser = { id: "user-1", email: mockEmail };
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const result = await loginUser(mockEmail, mockPassword);
    expect(result).toEqual(mockUser);
  });

  it("throws when supabase returns an error", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(loginUser(mockEmail, mockPassword)).rejects.toThrow(
      "Invalid login credentials"
    );
  });
});
