import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/avatar";
import { Button } from "@/components/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/dropdown-menu";
import { Muted, Small } from "@/components/typography";
import { useAuth } from "@/hooks/firebase";

export function UserNav() {
    const { user, signOut } = useAuth();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.photoURL ?? ""} alt="@shadcn" />
                        <AvatarFallback>{user?.displayName?.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <Small>{user?.displayName}</Small>
                        <Muted className="text-xs leading-none text-muted-foreground">
                            {user?.email}
                        </Muted>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
