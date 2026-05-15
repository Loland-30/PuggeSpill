interface PlayLoadingScreenProps {
    backgroundImageUrl: string
}

export default function PlayLoadingScreen({ backgroundImageUrl }: PlayLoadingScreenProps) {
    return (
        <div
            className="grid min-h-screen place-items-center bg-[#222222] bg-cover bg-center bg-no-repeat px-6 text-center text-white"
            style={{
                backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.58), rgba(0, 0, 0, 0.78)), url(${backgroundImageUrl})`
            }}
        >
            <div className="flex flex-col items-center gap-5">
                <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white shadow-[0_0_28px_rgba(255,255,255,0.18)] animate-spin" />
                <div>
                    <p className="text-sm font-black uppercase tracking-[0.35em] text-white/55">Loading stage</p>
                    <p className="mt-2 text-3xl font-black drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]">Preparing encounter</p>
                </div>
            </div>
        </div>
    )
}
