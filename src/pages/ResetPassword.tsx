import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { AuthFormProvider } from "@/contexts/auth/AuthFormContext";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

// Reached only via the link in the password-reset email
// (supabase.auth.resetPasswordForEmail's redirectTo). Supabase's client
// auto-detects the recovery token in the URL on load and establishes a
// session before this renders, which is what ResetPasswordForm's
// supabase.auth.updateUser() call relies on -- it takes no token itself.
const ResetPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-1 lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <Card className="p-6 bg-white">
          <div className="flex flex-col space-y-2 text-center mb-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              Set a new password
            </h1>
          </div>
          <AuthFormProvider>
            <ResetPasswordForm token="" onBackToSignIn={() => navigate("/auth")} />
          </AuthFormProvider>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
