'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { FolderOpen, Upload } from "lucide-react";

export default function DashboardNav() {
    const pathname = usePathname();
    const isActive = ( path: string ) => {
        if ( path === '/dashboard/projects' ) {
            return pathname === path || pathname.startsWith( '/dashboard/projects/' );
        }
        return pathname === path;
    };
    return (
        <nav className={ 'flex items-center gap-4' }>
            <Link href="/dashboard/projects">
                <Button
                    variant={ 'ghost' }
                    size={ 'sm' }
                    className={ cn(
                        'gap-4 transition-all duration-300 font-medium',
                        isActive( '/dashboard/projects' )
                            ? 'bg-white/10 text-emerald-600 hover:bg-white hover:scale-105 shadow-lg border-white/20'
                            : 'text-white hover:bg-white/20 hover:scale-105'
                    ) }
                >
                    <FolderOpen className={ 'h-4 w-4' } />
                    <span className={ 'hidden lg:inline' }>My Projects</span>
                </Button>
            </Link>
            <Link href={ '/dashboard/uploads' }>
                <Button
                    variant={ 'ghost' }
                    size={ 'sm' }
                    className={ cn(
                        'gap-4 transition-all duartion-300 font-medium',
                        isActive( '/dashboard/uploads' )
                            ? 'bg-white/10 text-emerald-600 hover:bg-white hover:scale-105 shadow-lg border border-white/20'
                            : 'text-white hover:bg-white/30 hover:scale-110',
                    ) }
                >
                    <Upload className={ 'h-4 w-4' } />
                    <span className={ 'hidden lg:inline' }>Upload</span>
                </Button>
            </Link>
        </nav>
    );
};
