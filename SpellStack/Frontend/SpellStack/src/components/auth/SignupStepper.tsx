interface SignupStepperProps {
    step: 1 | 2 | 3
}

const steps = [
    { id: 1, label: "Account" },
    { id: 2, label: "Profile" },
    { id: 3, label: "Finalize" }
] as const

export default function SignupStepper({ step }: SignupStepperProps) {
    return (
        <div className="mx-auto w-full max-w-sm" aria-label={`Sign up step ${step} of 3`}>
            <div className="grid grid-cols-[4.75rem_1fr_4.75rem_1fr_4.75rem] items-center">
                {steps.map((item, index) => {
                    const active = step === item.id
                    const complete = step > item.id

                    return (
                        <div key={item.id} className="contents">
                            <span
                                className={`mx-auto grid h-11 w-11 place-items-center rounded-full border text-xl font-black transition ${
                                    active || complete
                                        ? "border-white bg-white text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.22)]"
                                        : "border-2 border-white bg-transparent text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]"
                                }`}
                            >
                                {item.id}
                            </span>
                            {index < steps.length - 1 && <span className={`h-0.5 w-full transition ${step > item.id ? "bg-white" : "bg-white/80"}`} />}
                        </div>
                    )
                })}
            </div>
            <div className="mt-3 grid grid-cols-[4.75rem_1fr_4.75rem_1fr_4.75rem] text-center text-lg font-medium text-white">
                <span>{steps[0].label}</span>
                <span />
                <span>{steps[1].label}</span>
                <span />
                <span>{steps[2].label}</span>
            </div>
        </div>
    )
}
