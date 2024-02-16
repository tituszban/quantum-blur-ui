import { HTMLProps } from "react";

export const H1: React.FC<HTMLProps<HTMLHeadingElement>> = ({ children, className, ...props }) => {
    return (
        <h1 className={`scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl ${className}`} {...props}>
            {children}
        </h1>
    );
};

export const H2: React.FC<HTMLProps<HTMLHeadingElement>> = ({ children, className, ...props }) => {
    return (
        <h2 className={`scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 ${className}`} {...props}>
            {children}
        </h2>
    );
};

export const H3: React.FC<HTMLProps<HTMLHeadingElement>> = ({ children, className, ...props }) => {
    return (
        <h3 className={`scroll-m-20 text-2xl font-semibold tracking-tight ${className}`} {...props}>
            {children}
        </h3>
    );
};

export const H4: React.FC<HTMLProps<HTMLHeadingElement>> = ({ children, className, ...props }) => {
    return (
        <h4 className={`scroll-m-20 text-xl font-semibold tracking-tight ${className}`} {...props}>
            {children}
        </h4>
    );
};

export const P: React.FC<HTMLProps<HTMLParagraphElement>> = ({ children, className, ...props }) => {
    return (
        <p className={`leading-7 [&:not(:first-child)]:mt-6 ${className}`} {...props}>
            {children}
        </p>
    );
};

export const Blockquote: React.FC<HTMLProps<HTMLQuoteElement>> = ({ children, className, ...props }) => {
    return (
        <blockquote className={`mt-6 border-l-2 pl-6 italic ${className}`} {...props}>
            {children}
        </blockquote>
    );
};

export const Ul: React.FC<HTMLProps<HTMLUListElement>> = ({ children, className, ...props }) => {
    return (
        <ul className={`my-6 ml-6 list-disc [&>li]:mt-2 ${className}`} {...props}>
            {children}
        </ul>
    );
};

export const Li: React.FC<HTMLProps<HTMLLIElement>> = ({ children, ...props }) => {
    return (
        <li {...props}>
            {children}
        </li>
    );
};

export const Code: React.FC<HTMLProps<HTMLElement>> = ({ children, className, ...props }) => {
    return (
        <code className={`relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold ${className}`} {...props}>
            {children}
        </code>
    );
};

export const Lead: React.FC<HTMLProps<HTMLParagraphElement>> = ({ children, className, ...props }) => {
    return (
        <p className={`text-xl text-muted-foreground ${className}`} {...props}>
            {children}
        </p>
    );
};

export const Large: React.FC<HTMLProps<HTMLDivElement>> = ({ children, className, ...props }) => {
    return (
        <div className={`text-lg font-semibold ${className}`} {...props}>
            {children}
        </div>
    );
};

export const Small: React.FC<HTMLProps<HTMLParagraphElement>> = ({ children, className, ...props }) => {
    return (
        <small className={`text-sm font-medium leading-none ${className}`} {...props}>
            {children}
        </small>
    );
};

export const Muted: React.FC<HTMLProps<HTMLParagraphElement>> = ({ children, className, ...props }) => {
    return (
        <p className={`text-sm text-muted-foreground ${className}`} {...props}>
            {children}
        </p>
    );
};