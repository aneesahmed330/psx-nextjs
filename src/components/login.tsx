"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Lock, TrendingUp } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const success = await login(email, password);

    if (!success) {
      setError("Invalid credentials. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-background">
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* Moving particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={`moving-${i}`}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `moveParticle ${
                  10 + Math.random() * 20
                }s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-transparent to-primary/20 animate-pulse" />
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 border border-primary/10 rounded-full animate-spin-slow" />
        <div className="absolute bottom-20 right-20 w-24 h-24 border border-primary/10 rotate-45 animate-pulse" />
        <div className="absolute top-1/2 left-10 w-16 h-16 border border-primary/10 rounded-full animate-bounce" />
        <div className="absolute top-1/3 right-10 w-20 h-20 border border-primary/10 animate-pulse" />
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-primary animate-fade-in">
              <Lock className="h-8 w-8 animate-bounce" />
              <TrendingUp
                className="h-8 w-8 animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight animate-fade-in-up">
            PSX Portfolio
          </h1>
          <p
            className="text-muted-foreground animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            Track your Pakistan Stock Exchange investments
          </p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80 border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
          <CardHeader>
            <CardTitle
              className="animate-fade-in-up"
              style={{ animationDelay: "0.2s" }}
            >
              Sign In
            </CardTitle>
            <CardDescription
              className="animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              Enter your credentials to access your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div
                className="space-y-2 animate-fade-in-up"
                style={{ animationDelay: "0.4s" }}
              >
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div
                className="space-y-2 animate-fade-in-up"
                style={{ animationDelay: "0.5s" }}
              >
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md animate-fade-in-up">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full transition-all duration-200 hover:scale-105 hover:shadow-lg animate-fade-in-up"
                style={{ animationDelay: "0.6s" }}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
