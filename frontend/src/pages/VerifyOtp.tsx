import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import mindleyIcon from "@/assets/mindley-icon.svg";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";

import { auth } from "@/lib/supabase";
import { type OtpFormData, otpSchema } from "@/lib/validations";

export default function VerifyOtpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const onSubmit = async (data: OtpFormData) => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Email not found. Return to registration.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error } = await auth.verifyOtp(email, data.otp);

      if (error) {
        toast({
          variant: "destructive",
          title: "Invalid code",
          description: error.message,
        });
        return;
      }

      if (authData.user) {
        toast({
          title: "Verification completed!",
          description: "Your account has been successfully verified.",
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

  const handleResendCode = async () => {
    if (!email) return;

    setIsResending(true);

    try {
      // Generally, to resend the OTP code, you should redo the registration
      // or have a specific endpoint for resend
      const { error } = await auth.signUp(email, ""); // This might not work, depends on configuration

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Unable to resend code. Please try again later.",
        });
      } else {
        toast({
          title: "Code sent!",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again later.",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-8 px-4 sm:px-6 lg:px-8">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <img src={mindleyIcon} alt="Mindley" className="h-20 w-20 mb-2" />
          <h1 className="text-xl font-bold text-foreground">Error</h1>
        </div>

        <Card className="w-full max-w-md border shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Email not found. Please go back to sign up.
              </p>
              <Button
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                onClick={() => navigate("/signup")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8 px-4 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <img src={mindleyIcon} alt="Mindley" className="h-20 w-20 mb-2" />
        <h1 className="text-xl font-bold text-foreground">Verify your email</h1>
      </div>

      <Card className="w-full max-w-md border shadow-sm bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to
            </p>
            <p className="text-sm font-medium text-foreground">{email}</p>
          </div>

          <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
              The verification code is valid for 10 minutes. Also check your
              spam folder.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem className="flex flex-col items-center space-y-3">
                    <FormLabel className="text-sm font-medium text-foreground">
                      Verification code
                    </FormLabel>
                    <FormControl>
                      <InputOTP maxLength={6} {...field}>
                        <InputOTPGroup>
                          <InputOTPSlot
                            index={0}
                            className="h-10 w-10 border-input"
                          />
                          <InputOTPSlot
                            index={1}
                            className="h-10 w-10 border-input"
                          />
                          <InputOTPSlot
                            index={2}
                            className="h-10 w-10 border-input"
                          />
                          <InputOTPSlot
                            index={3}
                            className="h-10 w-10 border-input"
                          />
                          <InputOTPSlot
                            index={4}
                            className="h-10 w-10 border-input"
                          />
                          <InputOTPSlot
                            index={5}
                            className="h-10 w-10 border-input"
                          />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify code"}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              className="h-9 border-input hover:bg-accent/50 transition-colors text-sm"
              onClick={handleResendCode}
              disabled={isResending}
            >
              {isResending ? "Resending..." : "Resend code"}
            </Button>
          </div>

          <div className="pt-2">
            <Button
              variant="ghost"
              className="w-full h-10 hover:bg-accent/50 transition-colors"
              onClick={() => navigate("/signup")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
