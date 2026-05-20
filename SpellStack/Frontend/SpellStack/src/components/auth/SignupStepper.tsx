interface SignupStepperProps {
    step: 1 | 2 | 3
}

export default function SignupStepper({ step }: SignupStepperProps) {
    return (
        <div className="mx-auto flex w-full max-w-xs items-center justify-center" aria-label={`Sign up step ${step} of 3`}>
            {[1, 2, 3].map((item, index) => {
                const active = step === item
                const complete = step > item

                return (
                    <div key={item} className="flex items-center">
                        <span
                            className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-black transition ${
                                active || complete
                                    ? "border-white bg-white text-slate-950 shadow-[0_0_22px_rgba(255,255,255,0.2)]"
                                    : "border-white/18 bg-white/8 text-white/45"
                            }`}
                        >
                            {item}
                        </span>
                        {index < 2 && <span className={`h-0.5 w-14 transition ${step > item ? "bg-white" : "bg-white/18"}`} />}
                    </div>
                )
            })}
        </div>
    )
}
