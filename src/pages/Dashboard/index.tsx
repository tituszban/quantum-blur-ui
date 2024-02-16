import { UserNav } from "./UserNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/button";
import { useTheme } from "@/hooks/theme";

export default function DashboardPage() {
    return (
        <DashboardHeader>

        </DashboardHeader>
    );
}

interface DashboardHeaderProps {
    children: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
    return (
        <div className="hidden flex-col md:flex">
            <div className="border-b">
                <div className="flex h-16 items-center px-4">
                    <h1 className="text-lg font-medium">
                        Quantum Blur
                    </h1>
                    <div className="ml-auto flex items-center space-x-4">
                        <ThemeButton />
                        <UserNav />
                    </div>
                </div>
            </div>
            <div className="flex-1 space-y-4 p-8 pt-6">
                {children}
            </div>
        </div>
    );
};

const ThemeButton = () => {
    const { theme, setTheme } = useTheme();
    return (
        <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
            <FontAwesomeIcon icon={theme === "light" ? faSun : faMoon} />
        </Button>
    );
};
