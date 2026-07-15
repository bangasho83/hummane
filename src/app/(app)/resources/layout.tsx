import { ResourcePageFrame } from '@/features/resources/components/ResourcePageFrame'

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
    return <ResourcePageFrame>{children}</ResourcePageFrame>
}
