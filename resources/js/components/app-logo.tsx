export default function AppLogo() {
    return (
        <>
            <img 
                src="/musicpic.png" 
                alt="College of Music Dashboard Logo" 
                className="h-10 w-10 object-contain rounded-md" 
            />
            <div className="ml-2 grid min-w-0 flex-1 text-left text-sm">
                <span className="mb-0.5 whitespace-normal break-words leading-tight font-semibold text-sm">
                    College of Music Dashboard
                </span>
            </div>
        </>
    );
}
