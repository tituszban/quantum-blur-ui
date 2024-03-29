import { UserAuthForm } from "./UserAuthForm";
import { useAuth } from "@/hooks/firebase";

export default function AuthenticationPage() {
    const { signInLoading, signInWithGoogle, signInWithGitHub } = useAuth();

    return (
        <>
            <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
                {/* <Button className="absolute right-4 top-4 md:right-8 md:top-8" variant="ghost" >
                    Login
                </Button> */}
                <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div className="relative z-20 flex items-center text-lg font-medium">
                        <img src="/icon.png" alt="Quantum Blur" className="mr-2 h-6 w-6" />
                        Quantum Blur
                    </div>
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;Inside the Schrödinger's cat box, the quasi quantum
                                particles are dancing on the net of quantum attention function,
                                vanishing and arising.&rdquo;
                            </p>
                            <footer className="text-sm">Amit Ray</footer>
                        </blockquote>
                    </div>
                </div>
                <div className="lg:p-8">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                        <UserAuthForm onSubmit={() => { }} onGitHub={signInWithGitHub} onGoogle={signInWithGoogle} isLoading={signInLoading} />
                        <TermsAndConditions />
                    </div>
                </div>
            </div>
        </>
    );
}

function TermsAndConditions() {
    return <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a
            href="/"
            className="underline underline-offset-4 hover:text-primary"
        >
            Terms of Service
        </a>{" "}
        and{" "}
        <a
            href="/"
            className="underline underline-offset-4 hover:text-primary"
        >
            Privacy Policy
        </a>
        .
    </p>;
}

