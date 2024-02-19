"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    isLoading: boolean;
    onSubmit: (event: React.SyntheticEvent) => void;
    onGoogle: () => void;
    onGitHub: () => void;
 }

export function UserAuthForm({ className, onGoogle, onGitHub, isLoading = false, ...props }: UserAuthFormProps) {

    return (
        <>
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Sign In
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email below to sign in
                </p>
            </div>
            <div className={cn("grid gap-6", className)} {...props}>
                <form onSubmit={() => {}}>
                    <div className="grid gap-2">
                        <div className="grid gap-1">
                            <Label className="sr-only" htmlFor="email">
                                Email
                            </Label>
                            <Input
                                id="email"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={true}
                            />
                        </div>
                        <Button disabled={true}>
                            {isLoading && (
                                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Email sign in is not available
                        </Button>
                    </div>
                </form>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <Button variant="outline" type="button" disabled={isLoading} onClick={onGoogle}>
                    {isLoading ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Icons.google className="mr-2 h-4 w-4" />
                    )}{" "}
                    Sign in with Google
                </Button>
                <Button variant="outline" type="button" disabled={isLoading} onClick={onGitHub}>
                    {isLoading ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FontAwesomeIcon icon={faGithub} className="mr-2 h-4 w-4" />
                    )}{" "}
                    Sign in with GitHub
                </Button>
            </div>
        </>
    );
}
