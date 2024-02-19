import { UserNav } from "./UserNav";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faArrowUpFromBracket, faFileArrowUp, faTrash, faDownload } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/button";
import { useTheme } from "@/hooks/theme";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from 'react-dropzone';
import { cn } from "@/lib/utils";
import { P } from "@/components/typography";
import { useFiles, useFunctions, UploadedFile } from "@/hooks/firebase";
import { ScrollArea } from "@/components/scroll-area";
import { Skeleton } from "@/components/skeleton";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/drawer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { Switch } from "@/components/switch";
import { Label } from "@/components/label";
import { Slider } from "@/components/slider";

export default function DashboardPage() {
    const { uploadFile, files, deleteFile, downloadFile, setupAccountInitialFiles } = useFiles();
    const { quantumRotate, quantumBlur } = useFunctions();

    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [requestPending, setRequestPending] = useState(false);
    const [createdFileId, setCreatedFileId] = useState<string | null>(null);
    const [useLog, setUseLog] = useState<boolean>(false);
    const [sliderValue, setSliderValue] = useState<number>(49);
    const [currentPanel, setCurrentPanel] = useState<number>(0);
    const [selectedTab, setSelectedTab] = useState<"blur" | "rotate">("rotate");

    useEffect(() => {
        setupAccountInitialFiles();
    }, []);

    const handleDownloadFile = async (fileId: string) => {
        console.log("Download", fileId);
        await downloadFile(fileId);
    };

    const handleDeleteFile = async (file: UploadedFile) => {
        if (file.id === selectedFileId) {
            setSelectedFileId(null);
        }
        await deleteFile(file.id);
    };

    const transformScale = (v: number) => {
        if (selectedTab == "rotate") {
            if (!useLog) {
                if (v < 50) {
                    return (v + 1) * 2 / 1000;
                }

                const r = Math.round(10 + (v - 49) * 2) / 100;
                if (r > 1) {
                    return 1;
                }
                return r;
            } else {
                if (v < 50) {
                    return (v + 1) * 2 / 10000;
                }

                if (v < 80) {
                    return Math.round(10 + (v - 49) * 3) / 1000;
                }

                const r = Math.round(10 + (v - 79) * 5) / 100;
                if (r > 1) {
                    return 1;
                }
                return r;
            }
        } else {
            if (v < 25) {
                return (v + 1) * 4 / 1000;
            }
            if (v < 70) {
                return Math.round(10 + (v - 24) * 2) / 100;
            }

            return Math.round(10 + (v - 70) / 2 * 10) / 10;
        }
    };

    const handleSubmit = () => {
        if (!selectedFileId) { return; }
        setRequestPending(true);
        setCreatedFileId(null);
        (selectedTab === "rotate"
            ? quantumRotate(selectedFileId, useLog, transformScale(sliderValue))
            : quantumBlur(selectedFileId, useLog, transformScale(sliderValue))).then(result => {
                console.log(result);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setCreatedFileId((result?.data as any).new_doc);
                setCurrentPanel(2);
            }).finally(() => setRequestPending(false));
    };

    const handleFileSelected = (file: UploadedFile | null) => {
        if (file?.id !== selectedFileId) {
            setCreatedFileId(null);
        }
        setSelectedFileId(file?.id ?? null);
    };

    const disabled = requestPending || !selectedFileId;


    return (
        <DashboardHeader>
            <div className="flex flex-row h-full w-full space-x-4 items-start justify-between">
                <VerticalPanel title="1" selected={currentPanel === 0} next={{ onClick: () => setCurrentPanel(1), disabled: selectedFileId === null }}>
                    <SelectFileDrawer
                        onUploadFile={uploadFile}
                        files={files}
                        onFileSelected={handleFileSelected}
                        onDeleteFile={handleDeleteFile}
                        selectedFile={files.find((f) => f.id === selectedFileId) ?? null}
                        onDownloadFile={(f) => handleDownloadFile(f.id)}
                        disabled={requestPending}
                    />
                </VerticalPanel>
                <VerticalPanel title="2" selected={currentPanel === 1} prev={{ onClick: () => setCurrentPanel(0), disabled: disabled }}>
                    <ConfigurationPanel shouldAndimate={requestPending}>
                        <Tabs defaultValue="rotate" className="w-full h-full" onValueChange={(v: string) => setSelectedTab(v as "rotate" | "blur")} value={selectedTab}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="rotate">Rotate</TabsTrigger>
                                <TabsTrigger value="blur">Blur</TabsTrigger>
                            </TabsList>
                            <TabsContent value="rotate" className="h-[calc(100%-45px)]">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle>Apply Quantum Rotation</CardTitle>
                                        <CardDescription>

                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between space-x-2">
                                                <Label htmlFor="log-scale" className="flex flex-col space-y-1">
                                                    <span>Log scale</span>
                                                </Label>
                                                <Switch id="log-scale" checked={useLog} onCheckedChange={setUseLog} disabled={disabled} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between space-x-2">
                                                <Label htmlFor="scale" className="flex flex-col space-y-1">
                                                    <span>Fraction</span>
                                                </Label>
                                                <Slider id="scale" max={100} step={1} value={[sliderValue]} onValueChange={e => setSliderValue(e[0])} disabled={disabled} />
                                                <Label htmlFor="scale" className="flex flex-col space-y-1 w-16 text-right">
                                                    {transformScale(sliderValue)}
                                                </Label>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleSubmit()} disabled={disabled}>Start</Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="blur" className="h-[calc(100%-45px)]">
                                <Card className="h-full">
                                    <CardHeader>
                                        <CardTitle>Apply Quantum Blur</CardTitle>
                                        <CardDescription>

                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between space-x-2">
                                                <Label htmlFor="log-scale" className="flex flex-col space-y-1">
                                                    <span>Log scale</span>
                                                </Label>
                                                <Switch id="log-scale" checked={useLog} onCheckedChange={setUseLog} disabled={disabled} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between space-x-2">
                                                <Label htmlFor="scale" className="flex flex-col space-y-1">
                                                    <span>Xi</span>
                                                </Label>
                                                <Slider id="scale" max={100} step={1} value={[sliderValue]} onValueChange={e => setSliderValue(e[0])} disabled={disabled} />
                                                <Label htmlFor="scale" className="flex flex-col space-y-1 w-16 text-right">
                                                    {transformScale(sliderValue)}
                                                </Label>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleSubmit()} disabled={disabled}>Start</Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </ConfigurationPanel>
                </VerticalPanel>
                <VerticalPanel title="3" selected={currentPanel === 2} prev={{ onClick: () => setCurrentPanel(0), disabled: disabled }}>
                    <div className="relative group">
                        {!createdFileId ? (
                            <div className="flex items-center align-middle justify-center">
                                <Skeleton className="h-80 w-80 rounded-md p-4" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center align-middle justify-center">
                                    <img src={files.find(f => f.id === createdFileId)?.url ?? ""} alt={""} className="w-80 max-w-fit max-h-fit rounded-md" style={{ objectFit: "fill" }} />
                                </div>
                                <div className="absolute top-0 h-full w-full align-middle items-center justify-center hidden group-hover:flex flex-row">
                                    <Button variant="outline" className="rounded-full" onClick={() => handleDownloadFile(createdFileId)}>
                                        <FontAwesomeIcon icon={faDownload} />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </VerticalPanel>
            </div>
        </DashboardHeader>
    );
}

interface DashboardHeaderProps {
    children: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen">
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
            <div className="flex-1 space-y-4 p-8 pt-6 h-full">
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

const ConfigurationPanel: React.FC<{ children: React.ReactNode; shouldAndimate?: boolean; }> = ({ children, shouldAndimate = false, }) => {
    return (
        <div className="w-full h-[35rem] flex flex-col justify-between align-middle items-center">
            <div className="w-[8.4rem] overflow-hidden inline-block border-t">
                <div className={cn("h-24 w-24 border -rotate-45 transform origin-top-left", shouldAndimate ? "animateTriangle" : "")} />
            </div>
            <div className="w-full h-96">
                {children}
            </div>
            <div className="w-[8.4rem] overflow-hidden inline-block border-t rotate-180">
                <div className={cn("h-24 w-24 border -rotate-45 transform origin-top-left", shouldAndimate ? "animateTriangle" : "")} />
            </div>
        </div>
    );
};

interface VerticalPanelProps {
    children: React.ReactNode;
    title?: string;
    selected?: boolean;
    next?: {
        onClick: () => void;
        disabled?: boolean;
    };
    prev?: {
        onClick: () => void;
        disabled?: boolean;
    };
}

const VerticalPanel: React.FC<VerticalPanelProps> = ({ children, title, selected = true, next, prev }) => {
    return (
        <div className={cn(
            "border w-full lg:w-1/3 h-full flex-col p-4 justify-between items-center rounded-md",
            !selected ? "hidden lg:flex" : "flex"
        )}>
            <div className="">
                {title && (
                    <div className="bg-muted w-16 h-16 flex items-center justify-center rounded-full">
                        <h1 className="text-xl font-semibold">{title}</h1>
                    </div>
                )}
            </div>
            <div className="p-4 w-full">
                {children}
            </div>
            <div className="w-full">
                <div className="flex justify-between lg:hidden">
                    <div>
                        {prev && (
                            <Button variant="outline" disabled={prev.disabled} onClick={prev.onClick}>Back</Button>
                        )}
                    </div>
                    <div>
                        {next && (
                            <Button variant="outline" disabled={next.disabled} onClick={next.onClick}>Next</Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SelectFileDrawer: React.FC<{
    onUploadFile: (file: File) => Promise<void>;
    files: UploadedFile[];
    selectedFile: UploadedFile | null;
    onFileSelected: (file: UploadedFile | null) => void;
    onDeleteFile: (file: UploadedFile) => Promise<void>;
    onDownloadFile: (file: UploadedFile) => Promise<void>;
    disabled?: boolean;
}> = ({ onUploadFile, files, selectedFile, onFileSelected, onDeleteFile, onDownloadFile, disabled = false }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log("files", acceptedFiles);
        // TODO: check file size
        acceptedFiles.forEach(onUploadFile);
    }, []);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpeg", ".jpg"]
        },
    });

    const { onClick: dropzoneOnClick, ...dropzoneRootProps } = getRootProps();

    return (
        <Drawer>
            <DrawerTrigger asChild disabled={disabled}>
                <div className="relative group">
                    {(selectedFile && selectedFile.uploaded) ? (
                        <div className="flex items-center align-middle justify-center">
                            <img src={selectedFile.url ?? ""} alt={selectedFile?.id} className="w-80 max-w-fit max-h-fit rounded-md" style={{ objectFit: "fill" }} />
                        </div>
                    ) : (
                        <div className="flex items-center align-middle justify-center">
                            <Skeleton className="h-80 w-80 rounded-md p-4" />
                        </div>
                    )}
                    <div className="absolute top-0 h-full w-full align-middle items-center justify-center hidden group-hover:flex flex-row">
                        <Button variant="outline" disabled={disabled}>Select File</Button>
                    </div>
                </div>
            </DrawerTrigger>
            <DrawerContent>
                <div className="flex flex-col mx-auto w-full">
                    <DrawerHeader>
                        <DrawerTitle>Select a file</DrawerTitle>
                        <DrawerDescription>Select a file to modify</DrawerDescription>
                    </DrawerHeader>
                    <div className="p-4">
                        <div
                            className={cn(
                                "h-full w-full border rounded-md",
                                isDragActive && "bg-accent"
                            )}
                            {...dropzoneRootProps}
                        >
                            <ScrollArea className="h-[calc(60vh-24px)] w-full">
                                <div className="grid w-full justify-items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6">
                                    {files.map((file, i) => (
                                        <div className="p-4 w-60 group" key={file?.id ?? i}>
                                            {file?.uploaded ? (
                                                <div className="relative">
                                                    <img src={file.url ?? ""} alt={file?.id} className="h-52 w-52 rounded-md" style={{ objectFit: "cover" }} />
                                                    <div className="absolute w-full bottom-0 h-10 bg-muted hidden group-hover:block">
                                                        <div className="flex flex-row justify-between items-center space-x-4 h-full p-1">
                                                            <div className="overflow-hidden">
                                                                <h4 className="text-sm font-semibold">{file?.fileName}</h4>
                                                                <p className="text-xs">
                                                                    {file?.size ? `${file.size[0]}x${file.size[1]}` : ""}
                                                                </p>
                                                            </div>
                                                            <div className="ml-auto flex items-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    className="relative h-8 w-8 rounded-full hover:bg-slate-900"
                                                                    onClick={() => { onDownloadFile(file); }}>
                                                                    <FontAwesomeIcon icon={faDownload} />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="relative h-8 w-8 rounded-full hover:bg-slate-900"
                                                                    onClick={() => { onDeleteFile(file); }}>
                                                                    <FontAwesomeIcon color="red" icon={faTrash} />
                                                                </Button>
                                                            </div>

                                                        </div>
                                                    </div>
                                                    <div className="absolute top-16 w-full align-middle justify-center hidden group-hover:flex">
                                                        <DrawerClose>
                                                            <Button variant="outline" onClick={() => onFileSelected(file)}>Select</Button>
                                                        </DrawerClose>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Skeleton className="h-52 w-52 rounded-md p-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                            <button
                                className={cn(
                                    "flex flex-col items-center place-items-center justify-center gap-1 p-3 text-left text-sm transition-all hover:bg-accent h-24 w-full"
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
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

