import AppPageShell from "../components/layout/AppPageShell"
import PageContentTransition from "../components/PageContentTransition"
import { useI18n } from "../i18n/I18nContext"

export default function UpdatesPage() {
    const { t } = useI18n()

    return (
        <PageContentTransition>
            <AppPageShell contentClassName="flex min-h-[calc(100dvh-7rem)] max-w-3xl items-center justify-center pb-20 sm:min-h-[calc(100dvh-9rem)] sm:pb-8">
                <section className="w-full min-w-0 px-2 text-center sm:px-6">
                    <h1 className="text-4xl font-black text-white sm:text-6xl">
                        {t.updatesPage.title}
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-7 text-white/70 sm:text-lg">
                        {t.updatesPage.description}
                    </p>
                </section>
            </AppPageShell>
        </PageContentTransition>
    )
}
