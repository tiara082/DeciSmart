interface WizardStepsProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardSteps({ currentStep, totalSteps }: WizardStepsProps) {
  const steps = ['Define', 'Criteria', 'Alternatives', 'Scores', 'Review', 'Analyze'];

  return (
    <div className="flex justify-between items-center mb-12">
      {steps.map((step, index) => (
        <div key={index} className="flex-1">
          <div className="flex items-center">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                transition-colors
                ${
                  index + 1 < currentStep
                    ? 'bg-primary text-primary-foreground'
                    : index + 1 === currentStep
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  h-1 flex-1 mx-2 rounded-full
                  ${index + 1 < currentStep ? 'bg-primary' : 'bg-muted'}
                `}
              />
            )}
          </div>
          <p className="text-xs font-medium text-center mt-2 text-muted-foreground">{step}</p>
        </div>
      ))}
    </div>
  );
}
