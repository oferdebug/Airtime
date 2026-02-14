import { Header } from "@radix-ui/react-accordion";
import React from "react"

export function DashboardLayout({
    children,
}:{
    children:React.ReactNode;
}) {
    return (
        <div className={'min-h-screen'}>
            <Header />


            <main className={'pt-6 xl:pt-12'}>
                {children}
            </main>
        </div>
    );
}
  

