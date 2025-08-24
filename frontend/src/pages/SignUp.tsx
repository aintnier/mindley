import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail } from "lucide-react";
import mindleyIcon from "@/assets/mindley-icon.svg";
import GoogleIcon from "@/components/icons/google";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";

import { auth } from "@/lib/supabase";
import { type SignUpFormData, signUpSchema } from "@/lib/validations";

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error } = await auth.signUp(
        data.email,
        data.password
      );

      if (error) {
        toast({
          variant: "destructive",
          title: "Registration error",
          description: error.message,
        });
        return;
      }

      if (authData.user && !authData.session) {
        // User needs to verify email
        setUserEmail(data.email);
        setPendingVerification(true);
        toast({
          title: "Registration completed!",
          description: "Check your email for the verification code.",
        });
      } else if (authData.session) {
        // User was logged in directly
        toast({
          title: "Registration completed!",
          description: "Welcome to Mindley!",
        });
        navigate("/dashboard");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);

    try {
      const { error } = await auth.signInWithGoogle();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred with Google. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background py-8 px-4 sm:px-6 lg:px-8">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={mindleyIcon} alt="Mindley" className="h-14 w-14 mb-2" />
          <h1 className="text-3xl font-medium text-foreground">
            Verify your email
          </h1>
        </div>

        <Card className="w-full max-w-sm border shadow-sm bg-muted/50 backdrop-blur-sm border-border/20">
          <CardContent className="p-8 py-12 space-y-5">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                We sent a verification code to
              </p>
              <p className="text-sm font-medium text-foreground">{userEmail}</p>
            </div>

            <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
              <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
                Check your inbox and click the verification link to complete
                registration.
              </AlertDescription>
            </Alert>

            <div className="space-y-5">
              <Button
                variant="outline"
                className="w-full h-10 border-border hover:bg-background/60 hover:text-foreground transition-colors"
                onClick={() => {
                  setPendingVerification(false);
                  setUserEmail("");
                }}
              >
                Back to sign up
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pt-2 mt-4">
          <span className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Login
            </Link>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background py-8 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <img src={mindleyIcon} alt="Mindley" className="h-14 w-14 mb-2" />
        <h1 className="text-3xl font-medium text-foreground ">Sign up</h1>
      </div>

      <Card className="w-full max-w-sm border shadow-sm bg-muted/50 backdrop-blur-sm border-border/20">
        <CardContent className="p-8 py-12 space-y-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email"
                        className="h-10 border-border bg-background focus:bg-background transition-colors"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          autoComplete="new-password"
                          inputMode="text"
                          className="h-10 border-border bg-background focus:bg-background transition-colors pr-10"
                          disabled={isLoading}
                          {...field}
                        />
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          inputMode="text"
                          className="h-10 border-border bg-background focus:bg-background transition-colors pr-10 !mb-2"
                          disabled={isLoading}
                          {...field}
                        />
                        {field.value && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors text-base"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </Form>

          <Button
            variant="outline"
            className="w-full h-10 flex items-center justify-center gap-2 border-border hover:bg-background/60 hover:text-foreground transition-colors"
            onClick={handleGoogleSignUp}
            disabled={isLoading}
          >
            <GoogleIcon className="h-4 w-4" />
            <span className="font-medium text-base">Google</span>
          </Button>
        </CardContent>
      </Card>

      <div className="text-center pt-2 mt-4">
        <span className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline transition-colors"
          >
            Login
          </Link>
        </span>
      </div>
    </div>
  );
}
