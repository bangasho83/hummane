'use client'

import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { cn } from '@/lib/utils'

type QuillEditorProps = {
    value: string
    onChange: (val: string) => void
    placeholder?: string
    className?: string
}

export function QuillEditor({ value, onChange, placeholder, className }: QuillEditorProps) {
    const rootRef = useRef<HTMLDivElement | null>(null)
    const quillRef = useRef<Quill | null>(null)
    const onChangeRef = useRef(onChange)
    const isSettingContent = useRef(false)

    useEffect(() => {
        onChangeRef.current = onChange
    }, [onChange])

    useEffect(() => {
        if (!rootRef.current || quillRef.current) return

        const root = rootRef.current
        root.innerHTML = ''
        const editorEl = document.createElement('div')
        root.appendChild(editorEl)

        const quill = new Quill(editorEl, {
            theme: 'snow',
            placeholder,
            modules: {
                toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ header: [1, 2, 3, false] }],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ color: [] }, { background: [] }],
                    ['link', 'blockquote', 'code-block'],
                    ['clean'],
                ],
            },
        })

        if (value) {
            quill.clipboard.dangerouslyPasteHTML(value)
        }
        quill.on('text-change', () => {
            if (isSettingContent.current) return
            onChangeRef.current(quill.root.innerHTML)
        })
        quillRef.current = quill

        return () => {
            quillRef.current = null
            root.replaceChildren()
        }
    }, [placeholder])

    useEffect(() => {
        const quill = quillRef.current
        if (!quill) return
        if (quill.root.innerHTML === value) return

        const selection = quill.getSelection()
        isSettingContent.current = true
        quill.setContents([])
        if (value) {
            quill.clipboard.dangerouslyPasteHTML(value)
        }
        isSettingContent.current = false
        if (selection) {
            const maxIndex = quill.getLength() - 1
            quill.setSelection(Math.min(selection.index, maxIndex), selection.length)
        }
    }, [value])

    return (
        <div className={cn('rounded-xl border border-slate-200 overflow-hidden quill-snow', className)}>
            <div ref={rootRef} className="min-h-[220px]" />
        </div>
    )
}
