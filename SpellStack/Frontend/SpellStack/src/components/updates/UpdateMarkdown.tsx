import ReactMarkdown from "react-markdown"

export default function UpdateMarkdown({ content }: { content: string }) {
    return (
        <ReactMarkdown
            components={{
                h1: props => <h2 className="mt-10 break-words text-3xl font-black text-white first:mt-0 sm:text-4xl" {...props} />,
                h2: props => <h2 className="mt-9 break-words text-2xl font-black text-white first:mt-0 sm:text-3xl" {...props} />,
                h3: props => <h3 className="mt-8 break-words text-xl font-black text-white first:mt-0 sm:text-2xl" {...props} />,
                p: props => <p className="mt-5 break-words text-base font-medium leading-8 text-white/75 first:mt-0 sm:text-lg" {...props} />,
                ul: props => <ul className="mt-5 list-disc space-y-3 pl-6 text-base font-medium leading-8 text-white/75 marker:text-white/45 sm:text-lg" {...props} />,
                ol: props => <ol className="mt-5 list-decimal space-y-3 pl-6 text-base font-medium leading-8 text-white/75 marker:text-white/45 sm:text-lg" {...props} />,
                li: props => <li className="break-words pl-1" {...props} />,
                hr: props => <hr className="my-8 border-0 border-t border-white/15 sm:my-10" {...props} />,
                strong: props => <strong className="font-black text-white" {...props} />,
                em: props => <em className="italic text-white/85" {...props} />,
                a: props => <a className="font-bold text-sky-300 underline decoration-sky-300/50 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70" {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
