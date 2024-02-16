import { UserNav } from "./UserNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faArrowUpFromBracket, faFileArrowUp, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/button";
import { useTheme } from "@/hooks/theme";
import { useCallback, useState } from "react";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";
import { P } from "@/components/typography";
import { useFiles, useFunctions } from "@/hooks/firebase";
import { ScrollArea } from "@/components/scroll-area";
import { Skeleton } from "@/components/skeleton";
import { HoverCard, HoverCardTrigger } from "@radix-ui/react-hover-card";
import { HoverCardContent } from "@/components/hover-card";
import { Checkbox } from "@/components/checkbox";

export default function DashboardPage() {
    const { uploadFile, files, deleteFile } = useFiles();
    const { tryExampleCall } = useFunctions();

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log("files", acceptedFiles);
        // TODO: check file size
        acceptedFiles.forEach(uploadFile);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpeg", ".jpg"]
        },
    });

    const { onClick: dropzoneOnClick, ...dropzoneRootProps } = getRootProps();

    const handleClick = () => {
        if (!selectedImage) { return; }
        tryExampleCall(selectedImage);
    };


    return (
        <DashboardHeader>
            <div className="flex flex-row space-x-2">
                <div
                    className={cn(
                        "h-full w-[30rem] border rounded-md",
                        isDragActive && "bg-accent"
                    )}
                    {...dropzoneRootProps}
                >
                    <ScrollArea className="h-[calc(75vh-24px)] w-full">
                        <div className="grid grid-row w-full grid-cols-2">
                            {files.map((file, i) => (
                                <div className="p-4 grid w-60" key={file?.id ?? i}>
                                    {file?.uploaded ? (
                                        <HoverCard>
                                            <HoverCardTrigger asChild>
                                                <div className="relative" onClick={() => setSelectedImage(file.id)}>
                                                    <img src={file.url ?? ""} alt={file?.id} className="h-52 w-52 rounded-md" style={{ objectFit: "cover" }} />
                                                    <Checkbox className="absolute top-3 right-3 h-5 w-5" checked={file.id === selectedImage} />
                                                </div>
                                            </HoverCardTrigger>
                                            <HoverCardContent className="w-64">
                                                <div className="flex flex-row justify-between space-x-4">
                                                    <div className="space-y-1">
                                                        <h4 className="text-sm font-semibold">{file?.fileName}</h4>
                                                        <p className="text-sm">
                                                            {file?.size ? `${file.size[0]}x${file.size[1]}` : ""}
                                                        </p>
                                                        <p className="text-sm">
                                                            {file?.type}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-row items-center">
                                                        <div className="ml-auto flex items-center">
                                                            <Button
                                                                variant="ghost"
                                                                className="relative h-8 w-8 rounded-full"
                                                                onClick={() => { deleteFile(file.id); if (file.id === selectedImage) { setSelectedImage(null); } }}>
                                                                <FontAwesomeIcon color="red" icon={faTrash} />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </HoverCardContent>
                                        </HoverCard>
                                    ) : (
                                        <Skeleton className="h-52 w-52 rounded-md p-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <button
                        className={cn(
                            "flex flex-col items-center place-items-center justify-center gap-1 p-3 text-left text-sm transition-all hover:bg-accent h-24 w-full",
                        )}
                        onClick={dropzoneOnClick}
                    >
                        <input {...getInputProps()} />
                        <div>
                            <FontAwesomeIcon size="2x" icon={isDragActive ? faFileArrowUp : faArrowUpFromBracket} />
                        </div>
                        <div>
                            <P>Upload a new file</P>
                        </div>
                    </button>
                </div>
                <Button onClick={() => handleClick()}>
                    Try Example Call
                </Button>
            </div>
        </DashboardHeader>
    );
}

interface DashboardHeaderProps {
    children: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
    return (
        <div className="flex flex-col">
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
