import React, { useEffect, useState } from "react";
import { useRouter } from "next/router"; // or 'react-router-dom' for React Router
import Cookies from "js-cookie";
import * as jwtDecode from "jwt-decode";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token"); // Get the token from the cookie

    if (token) {
      try {
        // Decode the JWTimport * as jwtDecode from "jwt-decode";

        const ProtectedRoute = ({
          children,
        }: {
          children: React.ReactNode;
        }) => {
          const router = useRouter();
          const [isAuthenticated, setIsAuthenticated] = useState(false);

          useEffect(() => {
            const token = Cookies.get("token"); // Get the token from the cookie

            if (token) {
              try {
                // Decode the JWT
                const decodedToken: any = jwtDecode(token);
                const currentTime = Date.now() / 1000; // Current time in seconds

                // Check if the token has expired
                if (decodedToken.exp > currentTime) {
                  setIsAuthenticated(true); // Token is valid
                } else {
                  setIsAuthenticated(false); // Token is expired
                }
              } catch (error) {
                console.error("Invalid token:", error);
                setIsAuthenticated(false); // Invalid token format
              }
            } else {
              setIsAuthenticated(false); // No token
            }
          }, []);

          if (!isAuthenticated) {
            // Redirect to login if not authenticated
            router.push("/host/login");
            return <div>Redirecting...</div>;
          }

          return <>{children}</>; // Render protected content if authenticated
        };
        const decodedToken: any = jwtDecode.default(token);
        const currentTime = Date.now() / 1000; // Current time in seconds

        // Check if the token has expired
        if (decodedToken.exp > currentTime) {
          setIsAuthenticated(true); // Token is valid
        } else {
          setIsAuthenticated(false); // Token is expired
        }
      } catch (error) {
        console.error("Invalid token:", error);
        setIsAuthenticated(false); // Invalid token format
      }
    } else {
      setIsAuthenticated(false); // No token
    }
  }, []);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    router.push("/host/login");
    return <div>Redirecting...</div>;
  }

  return <>{children}</>; // Render protected content if authenticated
};

export default ProtectedRoute;
