import SignupStepAccount from "./SignupStepAccount"
import SignupStepProfile, { type AuthCountryOption } from "./SignupStepProfile"
import SignupStepSummary from "./SignupStepSummary"
import SignupStepper from "./SignupStepper"

interface SignupFlowProps {
    step: 1 | 2 | 3
    email: string
    password: string
    confirmPassword: string
    username: string
    countryCode: string
    profileImagePreview: string | null
    countries: AuthCountryOption[]
    loading: boolean
    error: string
    onEmailChange: (value: string) => void
    onPasswordChange: (value: string) => void
    onConfirmPasswordChange: (value: string) => void
    onUsernameChange: (value: string) => void
    onCountryChange: (value: string) => void
    onProfileImageChange: (value: string | null) => void
    onNextAccount: () => void
    onNextProfile: () => void
    onSubmit: () => void
}

export default function SignupFlow(props: SignupFlowProps) {
    const selectedCountry = props.countries.find(country => country.code === props.countryCode) ?? props.countries[0]

    return (
        <div className="mx-auto w-full max-w-2xl">
            <div className="mb-8 text-center">
                <p className="text-sm font-black uppercase tracking-[0.35em] text-white/45">SpellStack</p>
                <h1 className="mt-4 text-5xl font-black tracking-tight text-white">Sign up</h1>
            </div>
            <SignupStepper step={props.step} />
            <div className="mt-9">
                {props.step === 1 && (
                    <SignupStepAccount
                        email={props.email}
                        password={props.password}
                        confirmPassword={props.confirmPassword}
                        error={props.error}
                        onEmailChange={props.onEmailChange}
                        onPasswordChange={props.onPasswordChange}
                        onConfirmPasswordChange={props.onConfirmPasswordChange}
                        onNext={props.onNextAccount}
                    />
                )}
                {props.step === 2 && (
                    <SignupStepProfile
                        username={props.username}
                        countryCode={props.countryCode}
                        profileImagePreview={props.profileImagePreview}
                        countries={props.countries}
                        error={props.error}
                        onUsernameChange={props.onUsernameChange}
                        onCountryChange={props.onCountryChange}
                        onProfileImageChange={props.onProfileImageChange}
                        onNext={props.onNextProfile}
                    />
                )}
                {props.step === 3 && (
                    <SignupStepSummary
                        username={props.username}
                        email={props.email}
                        country={selectedCountry}
                        profileImagePreview={props.profileImagePreview}
                        loading={props.loading}
                        error={props.error}
                        onSubmit={props.onSubmit}
                    />
                )}
            </div>
        </div>
    )
}
