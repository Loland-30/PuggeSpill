export default function AuthBrandTitle({ subtitle }: { subtitle?: string }) {
    return (
        <div className="mb-10 text-center">
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                SpellStack
            </h1>
            {subtitle && (
                <p className="mt-3 text-sm font-semibold tracking-[0.18em] text-white/55">
                    {subtitle}
                </p>
            )}
        </div>
    )
}
