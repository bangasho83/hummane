'use client'

import { OrgPageFrame, VendorForm } from '@/features/organization'

export default function NewVendorPage() {
    return (
        <OrgPageFrame>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4 space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Add New Vendor</h1>
                    <p className="text-slate-500 font-medium">Add a supplier and optional account contact details.</p>
                </div>
                <VendorForm mode="create" />
            </div>
        </OrgPageFrame>
    )
}
