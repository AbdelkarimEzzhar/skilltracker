"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Logo } from "@/components/ui/logo"
import { StepProfile } from "./steps/step-profile"
import { StepEducation } from "./steps/step-education"
import { StepGoals } from "./steps/step-goals"
import { StepSkills } from "./steps/step-skills"
import { StepPreferences } from "./steps/step-preferences"

const steps = [
  { id: 1, title: "Profil", component: StepProfile },
  { id: 2, title: "Formation", component: StepEducation },
  { id: 3, title: "Objectifs", component: StepGoals },
  { id: 4, title: "Compétences", component: StepSkills },
  { id: 5, title: "Préférences", component: StepPreferences },
]

export function OnboardingFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({})

  const progress = ((currentStep + 1) / steps.length) * 100
  const CurrentStepComponent = steps[currentStep].component

  const handleNext = (data: any) => {
    setFormData({ ...formData, ...data })

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Onboarding complete
      router.push("/dashboard")
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Étape {currentStep + 1} sur {steps.length}
            </span>
            <div className="w-48 hidden sm:block">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar mobile */}
      <div className="sm:hidden px-4 py-2 bg-card/50">
        <Progress value={progress} className="h-2" />
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-balance">{steps[currentStep].title}</h1>
            <p className="text-muted-foreground text-lg">Aidez-nous à personnaliser votre expérience</p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <CurrentStepComponent onNext={handleNext} onBack={handleBack} />
            </CardContent>
          </Card>

          {/* Step indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => index < currentStep && setCurrentStep(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground scale-110"
                    : index < currentStep
                      ? "bg-primary/20 text-primary cursor-pointer hover:scale-105"
                      : "bg-muted text-muted-foreground"
                }`}
                disabled={index > currentStep}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.id
                )}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
