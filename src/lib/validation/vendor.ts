export interface VendorFormValues {
    name: string
    contactName: string
    email: string
    phone: string
    isActive: boolean
}

export type VendorFormErrors = Partial<Record<keyof VendorFormValues, string>>

export const emptyVendorFormValues: VendorFormValues = {
    name: '',
    contactName: '',
    email: '',
    phone: '',
    isActive: true,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateVendor(values: VendorFormValues): VendorFormErrors {
    const errors: VendorFormErrors = {}
    const name = values.name.trim()
    const email = values.email.trim()

    if (!name) errors.name = 'Vendor name is required'
    else if (name.length > 150) errors.name = 'Vendor name must be 150 characters or less'

    if (values.contactName.trim().length > 150) {
        errors.contactName = 'Contact name must be 150 characters or less'
    }
    if (email && !EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address'
    if (values.phone.trim().length > 50) errors.phone = 'Phone must be 50 characters or less'

    return errors
}
