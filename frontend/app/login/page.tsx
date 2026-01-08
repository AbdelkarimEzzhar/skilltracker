import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/ui/logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <Logo className="mb-8" size="lg" />
          <h1 className="text-5xl font-bold mb-6 text-balance">
            Transformez votre parcours académique en succès professionnel
          </h1>
          <p className="text-xl text-primary-foreground/90 leading-relaxed text-pretty">
            SkillTrack utilise l'intelligence artificielle pour vous accompagner tout au long de votre formation,
            identifier vos compétences et vous guider vers les opportunités qui vous correspondent.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
