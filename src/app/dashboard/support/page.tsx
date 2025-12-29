'use client'

import { DashboardShell } from '@/components/layout/DashboardShell'
import { HelpCircle, Mail, MessageCircle, Book } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SupportPage() {
    return (
        <DashboardShell>
            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Support
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Get help and learn how to make the most of Hummane.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-premium bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-shadow">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Book className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Documentation</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">
                                Browse our comprehensive guides and tutorials.
                            </p>
                            <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 h-12">
                                View Docs
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-premium bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-shadow">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Live Chat</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">
                                Chat with our support team in real-time.
                            </p>
                            <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 h-12">
                                Start Chat
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-premium bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-shadow">
                        <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Email Support</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">
                                Send us an email and we'll get back to you.
                            </p>
                            <Button variant="outline" className="w-full rounded-xl font-bold border-slate-200 h-12">
                                Send Email
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 bg-white rounded-3xl shadow-premium border border-slate-100 overflow-hidden">
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <HelpCircle className="w-10 h-10 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-500 font-medium max-w-2xl mx-auto mb-8">
                            Find answers to common questions about using Hummane, managing employees, and processing payroll.
                        </p>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 px-6 py-6 h-auto">
                            Browse FAQ
                        </Button>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}
