import { loginHost } from "@/app/lib/auth/login";
import { supabase } from "@/app/lib/utils/supabaseClient";

// Mock Supabase client
jest.mock("@/app/lib/utils/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe("loginHost", () => {
  const mockEmail = "test@braindance.io";
  const mockPassword = "raveon123";

  it("logs in a host and returns the user", async () => {
    const mockUser = { id: "123", email: mockEmail };

    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const result = await loginHost(mockEmail, mockPassword);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockEmail,
      password: mockPassword,
    });
    expect(result).toEqual(mockUser);
  });

  it("throws an error if login fails", async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: "Invalid login credentials" },
    });

    await expect(loginHost(mockEmail, mockPassword)).rejects.toThrow(
      "Invalid login credentials"
    );
  });
});
