import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageContentTransitionProps {
    children: ReactNode
    className?: string
}

export default function PageContentTransition({ children, className = "" }: PageContentTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    )
}