'use client'

import 'quill/dist/quill.snow.css'

import { Card, CardContent } from '@/components/ui/card'

type JobDescriptionPreviewProps = {
    title?: string
    description?: string
}

export function JobDescriptionPreview({
    title = 'Job Description',
    description
}: JobDescriptionPreviewProps) {
    return (
        <Card className="border border-slate-100 shadow-premium rounded-3xl bg-white overflow-hidden h-full">
            <CardContent className="p-6 space-y-4">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Job Description</p>
                    <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
                </div>
                {description ? (
                    <div className="ql-snow">
                        <div
                            className="ql-editor"
                            dangerouslySetInnerHTML={{ __html: description }}
                        />
                    </div>
                ) : (
                    <div className="text-sm text-red-600 bg-red-50 border border-dashed border-red-200 rounded-2xl p-4">
                        No job description added or it is empty.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
